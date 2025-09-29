"""Zero-Manual eSIM Provisioning API Endpoints"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Optional
from datetime import datetime
import subprocess
import logging
from ..services.pms_core import ProfileManagementService, ProfileRequest, ProfileStatus
from ..services.qr_lifecycle import QRLifecycleManager
from ..services.device_migration import DeviceMigrationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/esim", tags=["eSIM Management"])

@router.post("/provision")
async def provision_esim(request: ProfileRequest, user: dict = Depends(get_current_user)):
    """Zero-manual eSIM provisioning with automatic deployment"""
    try:
        pms = ProfileManagementService(db_client)
        qr_manager = QRLifecycleManager(db_client)
        
        profile_result = await pms.create_profile(request, user)
        profile_id = profile_result["profileId"]
        
        qr_code = qr_manager.generate_qr(
            profile_id, request.tenantId, request.activationCode, request.smdpServerUrl
        )
        
        deploy_result = subprocess.run([
            "powershell", "-File", "/app/scripts/modules/Intune-Deployment.ps1",
            "-ProfileId", profile_id,
            "-TenantId", request.tenantId,
            "-Provider", request.provider.value,
            "-ActivationCode", request.activationCode,
            "-SmdpServerUrl", request.smdpServerUrl,
            "-TargetDeviceId", request.deviceId or ""
        ], capture_output=True, text=True, timeout=300)
        
        status = ProfileStatus.DEPLOYED if deploy_result.returncode == 0 else ProfileStatus.ERROR
        await pms.update_profile_status(profile_id, status, user)
        
        return {
            "profileId": profile_id,
            "qrCodeId": qr_code["id"],
            "status": status.value,
            "deploymentResult": deploy_result.stdout if deploy_result.returncode == 0 else deploy_result.stderr
        }
        
    except Exception as e:
        logger.error(f"Provisioning failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/migrate")
async def migrate_device(profile_id: str, source_device_id: str, target_device_id: str, 
                        user: dict = Depends(get_current_user)):
    """Migrate eSIM profile between devices"""
    try:
        migration_service = DeviceMigrationService(db_client)
        
        migration_result = migration_service.initiate_migration(
            profile_id, source_device_id, target_device_id, user["tenantId"], user["id"]
        )
        
        execution_result = migration_service.execute_migration(migration_result["migrationId"])
        
        return {
            "migrationId": migration_result["migrationId"],
            "success": execution_result["success"],
            "status": "completed" if execution_result["success"] else "failed"
        }
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profiles/{tenant_id}")
async def list_profiles(tenant_id: str, provider: Optional[str] = None, 
                       user: dict = Depends(get_current_user)):
    """List eSIM profiles with tenant isolation"""
    try:
        pms = ProfileManagementService(db_client)
        filters = {"provider": provider} if provider else {}
        
        result = await pms.list_profiles(tenant_id, user, filters)
        return result
        
    except Exception as e:
        logger.error(f"Profile listing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/compliance/audit")
async def get_compliance_audit(tenant_id: str, user: dict = Depends(get_current_user)):
    """Retrieve compliance audit logs"""
    try:
        if user["role"] not in ["admin", "operator"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        logs = db_client.esim_management.compliance_logs.find(
            {"tenantId": tenant_id}
        ).sort("timestamp", -1).limit(100)
        
        return {"logs": list(logs)}
        
    except Exception as e:
        logger.error(f"Audit retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))