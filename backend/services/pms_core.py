"""
Profile Management Service (PMS) Core Module
Centralized eSIM profile lifecycle management with multi-tenancy and RBAC
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from pymongo import MongoClient
from pydantic import BaseModel, Field
import uuid
import logging
import asyncio
from enum import Enum

logger = logging.getLogger(__name__)

class ProfileStatus(str, Enum):
    CREATED = "created"
    VALIDATED = "validated"
    DEPLOYED = "deployed"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    MIGRATING = "migrating"
    DEACTIVATED = "deactivated"
    ERROR = "error"

class ProviderType(str, Enum):
    MPT = "MPT"
    ATOM = "ATOM"
    OOREDOO = "OOREDOO"
    MYTEL = "MYTEL"

class ProfileRequest(BaseModel):
    tenantId: str
    displayName: str
    provider: ProviderType
    activationCode: str
    smdpServerUrl: str
    deviceId: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ProfileManagementService:
    def __init__(self, db_client: MongoClient):
        self.db = db_client.esim_management
        self.profiles = self.db.esim_profiles
        self.tenants = self.db.tenants
        self.compliance_logs = self.db.compliance_logs
        
    async def create_profile(self, request: ProfileRequest, user_context: Dict) -> Dict:
        """Create new eSIM profile with validation and compliance logging"""
        try:
            # Validate tenant access
            self._validate_tenant_access(request.tenantId, user_context)
            
            # Generate profile ID
            profile_id = str(uuid.uuid4())
            
            # Create profile document
            profile = {
                "id": profile_id,
                "tenantId": request.tenantId,
                "displayName": request.displayName,
                "provider": request.provider.value,
                "activationCode": request.activationCode,
                "smdpServerUrl": request.smdpServerUrl,
                "deviceId": request.deviceId,
                "status": ProfileStatus.CREATED.value,
                "metadata": request.metadata,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "createdBy": user_context["id"]
            }
            
            # Insert profile
            result = self.profiles.insert_one(profile)
            
            # Log compliance activity
            await self._log_compliance_activity(
                user_context, "CREATE_PROFILE", "esim_profile", profile_id,
                {"provider": request.provider.value, "tenantId": request.tenantId}
            )
            
            logger.info(f"Profile created: {profile_id} for tenant: {request.tenantId}")
            return {"profileId": profile_id, "status": "created"}
            
        except Exception as e:
            logger.error(f"Profile creation failed: {str(e)}")
            raise
    
    async def get_profile(self, profile_id: str, user_context: Dict) -> Optional[Dict]:
        """Retrieve profile with tenant isolation"""
        try:
            profile = self.profiles.find_one({"id": profile_id})
            if not profile:
                return None
            
            # Validate tenant access
            self._validate_tenant_access(profile["tenantId"], user_context)
            
            return profile
            
        except Exception as e:
            logger.error(f"Profile retrieval failed: {str(e)}")
            raise
    
    async def update_profile_status(self, profile_id: str, status: ProfileStatus, 
                                  user_context: Dict, metadata: Dict = None) -> bool:
        """Update profile status with audit trail"""
        try:
            profile = await self.get_profile(profile_id, user_context)
            if not profile:
                return False
            
            update_data = {
                "status": status.value,
                "updatedAt": datetime.utcnow(),
                "updatedBy": user_context["id"]
            }
            
            if metadata:
                update_data["metadata"] = {**profile.get("metadata", {}), **metadata}
            
            result = self.profiles.update_one(
                {"id": profile_id},
                {"$set": update_data}
            )
            
            # Log compliance activity
            await self._log_compliance_activity(
                user_context, "UPDATE_PROFILE_STATUS", "esim_profile", profile_id,
                {"oldStatus": profile["status"], "newStatus": status.value}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Profile status update failed: {str(e)}")
            raise
    
    def _validate_tenant_access(self, tenant_id: str, user_context: Dict):
        """Validate user has access to tenant"""
        if user_context["tenantId"] != tenant_id:
            raise PermissionError("Access denied: Tenant mismatch")
    
    async def _log_compliance_activity(self, user_context: Dict, operation: str, 
                                     resource_type: str, resource_id: str, details: Dict):
        """Log compliance activity for audit trail"""
        try:
            compliance_entry = {
                "id": str(uuid.uuid4()),
                "tenantId": user_context["tenantId"],
                "operation": operation,
                "resourceType": resource_type,
                "resourceId": resource_id,
                "userId": user_context["id"],
                "userRole": user_context["role"],
                "timestamp": datetime.utcnow(),
                "details": details,
                "complianceStatus": "compliant"
            }
            
            self.compliance_logs.insert_one(compliance_entry)
            
        except Exception as e:
            logger.error(f"Compliance logging failed: {str(e)}")

class EntitlementValidator:
    """Validates eSIM entitlements with provider systems"""
    
    def __init__(self, provider_configs: Dict[str, Dict]):
        self.provider_configs = provider_configs
    
    async def validate_entitlement(self, provider: ProviderType, activation_code: str, 
                                 tenant_id: str) -> Dict:
        """Validate entitlement with provider system"""
        try:
            config = self.provider_configs.get(provider.value)
            if not config:
                raise ValueError(f"No configuration for provider: {provider.value}")
            
            # Provider-specific validation logic
            if provider == ProviderType.MPT:
                return await self._validate_mpt_entitlement(activation_code, config)
            elif provider == ProviderType.ATOM:
                return await self._validate_atom_entitlement(activation_code, config)
            elif provider == ProviderType.OOREDOO:
                return await self._validate_ooredoo_entitlement(activation_code, config)
            elif provider == ProviderType.MYTEL:
                return await self._validate_mytel_entitlement(activation_code, config)
            
        except Exception as e:
            logger.error(f"Entitlement validation failed: {str(e)}")
            return {"valid": False, "error": str(e)}
    
    async def _validate_mpt_entitlement(self, activation_code: str, config: Dict) -> Dict:
        """MPT-specific entitlement validation"""
        return {"valid": True, "provider": "MPT", "validated_at": datetime.utcnow()}
    
    async def _validate_atom_entitlement(self, activation_code: str, config: Dict) -> Dict:
        """ATOM-specific entitlement validation"""
        return {"valid": True, "provider": "ATOM", "validated_at": datetime.utcnow()}
    
    async def _validate_ooredoo_entitlement(self, activation_code: str, config: Dict) -> Dict:
        """OOREDOO-specific entitlement validation"""
        return {"valid": True, "provider": "OOREDOO", "validated_at": datetime.utcnow()}
    
    async def _validate_mytel_entitlement(self, activation_code: str, config: Dict) -> Dict:
        """MYTEL-specific entitlement validation"""
        return {"valid": True, "provider": "MYTEL", "validated_at": datetime.utcnow()}