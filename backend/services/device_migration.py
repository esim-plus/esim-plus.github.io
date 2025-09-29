"""Device Migration Workflows for eSIM Profiles"""

from typing import Dict, List
from datetime import datetime
from pymongo import MongoClient
from enum import Enum
import uuid
import logging
import subprocess

logger = logging.getLogger(__name__)

class MigrationStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"

class DeviceMigrationService:
    def __init__(self, db_client: MongoClient):
        self.db = db_client.esim_management
        self.migrations = self.db.device_migrations
        self.profiles = self.db.esim_profiles
        
    def initiate_migration(self, profile_id: str, source_device_id: str, 
                          target_device_id: str, tenant_id: str, user_id: str) -> Dict:
        """Initiate device-to-device profile migration"""
        migration_id = str(uuid.uuid4())
        
        migration = {
            "id": migration_id,
            "profileId": profile_id,
            "tenantId": tenant_id,
            "sourceDeviceId": source_device_id,
            "targetDeviceId": target_device_id,
            "status": MigrationStatus.PENDING.value,
            "initiatedBy": user_id,
            "createdAt": datetime.utcnow(),
            "steps": []
        }
        
        self.migrations.insert_one(migration)
        logger.info(f"Migration initiated: {migration_id}")
        return {"migrationId": migration_id, "status": "initiated"}
    
    def execute_migration(self, migration_id: str) -> Dict:
        """Execute the migration workflow"""
        migration = self.migrations.find_one({"id": migration_id})
        if not migration:
            return {"success": False, "error": "Migration not found"}
        
        try:
            # Update status to in progress
            self._update_migration_status(migration_id, MigrationStatus.IN_PROGRESS)
            
            # Step 1: Deactivate on source device
            deactivate_result = self._deactivate_profile(
                migration["profileId"], migration["sourceDeviceId"]
            )
            self._add_migration_step(migration_id, "deactivate_source", deactivate_result)
            
            # Step 2: Deploy to target device
            deploy_result = self._deploy_to_target(
                migration["profileId"], migration["targetDeviceId"]
            )
            self._add_migration_step(migration_id, "deploy_target", deploy_result)
            
            # Step 3: Verify activation
            verify_result = self._verify_activation(migration["targetDeviceId"])
            self._add_migration_step(migration_id, "verify_activation", verify_result)
            
            if all([deactivate_result["success"], deploy_result["success"], verify_result["success"]]):
                self._update_migration_status(migration_id, MigrationStatus.COMPLETED)
                self._update_profile_device(migration["profileId"], migration["targetDeviceId"])
                return {"success": True, "migrationId": migration_id}
            else:
                self._update_migration_status(migration_id, MigrationStatus.FAILED)
                return {"success": False, "migrationId": migration_id}
                
        except Exception as e:
            self._update_migration_status(migration_id, MigrationStatus.FAILED)
            logger.error(f"Migration failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def rollback_migration(self, migration_id: str) -> Dict:
        """Rollback failed migration"""
        migration = self.migrations.find_one({"id": migration_id})
        if not migration or migration["status"] != MigrationStatus.FAILED.value:
            return {"success": False, "error": "Invalid migration for rollback"}
        
        try:
            # Reactivate on source device
            reactivate_result = self._deploy_to_target(
                migration["profileId"], migration["sourceDeviceId"]
            )
            
            if reactivate_result["success"]:
                self._update_migration_status(migration_id, MigrationStatus.ROLLED_BACK)
                self._update_profile_device(migration["profileId"], migration["sourceDeviceId"])
                return {"success": True, "migrationId": migration_id}
            
            return {"success": False, "error": "Rollback failed"}
            
        except Exception as e:
            logger.error(f"Rollback failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _deactivate_profile(self, profile_id: str, device_id: str) -> Dict:
        """Deactivate profile on source device"""
        try:
            # Call PowerShell script for deactivation
            result = subprocess.run([
                "powershell", "-File", "/app/scripts/modules/Deactivate-eSIM.ps1",
                "-ProfileId", profile_id, "-DeviceId", device_id
            ], capture_output=True, text=True, timeout=120)
            
            return {"success": result.returncode == 0, "output": result.stdout}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _deploy_to_target(self, profile_id: str, device_id: str) -> Dict:
        """Deploy profile to target device"""
        try:
            profile = self.profiles.find_one({"id": profile_id})
            if not profile:
                return {"success": False, "error": "Profile not found"}
            
            result = subprocess.run([
                "powershell", "-File", "/app/scripts/modules/Intune-Deployment.ps1",
                "-ProfileId", profile_id,
                "-TenantId", profile["tenantId"],
                "-Provider", profile["provider"],
                "-ActivationCode", profile["activationCode"],
                "-SmdpServerUrl", profile["smdpServerUrl"],
                "-TargetDeviceId", device_id
            ], capture_output=True, text=True, timeout=300)
            
            return {"success": result.returncode == 0, "output": result.stdout}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _verify_activation(self, device_id: str) -> Dict:
        """Verify profile activation on target device"""
        # Simplified verification - in production, query device status
        return {"success": True, "verified": True}
    
    def _update_migration_status(self, migration_id: str, status: MigrationStatus):
        """Update migration status"""
        self.migrations.update_one(
            {"id": migration_id},
            {"$set": {"status": status.value, "updatedAt": datetime.utcnow()}}
        )
    
    def _add_migration_step(self, migration_id: str, step_name: str, result: Dict):
        """Add migration step result"""
        step = {
            "name": step_name,
            "timestamp": datetime.utcnow(),
            "result": result
        }
        self.migrations.update_one(
            {"id": migration_id},
            {"$push": {"steps": step}}
        )
    
    def _update_profile_device(self, profile_id: str, device_id: str):
        """Update profile's associated device"""
        self.profiles.update_one(
            {"id": profile_id},
            {"$set": {"deviceId": device_id, "updatedAt": datetime.utcnow()}}
        )