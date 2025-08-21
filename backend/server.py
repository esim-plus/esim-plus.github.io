from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import os
import subprocess
import logging
import uuid
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/esim_management.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="eSIM Management API",
    description="API for managing ATOM/Ooredoo/Mytel/MPT eSIM profiles",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/esim_management')
client = MongoClient(MONGO_URL)
db = client.esim_management
esim_profiles = db.esim_profiles
operation_logs = db.operation_logs

# Pydantic Models
class eSIMProfile(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    displayName: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(default="", max_length=500)
    activationCode: str = Field(..., min_length=1)
    smdpServerUrl: str = Field(..., min_length=1)
    provider: str = Field(..., pattern="^(ATOM|Ooredoo|Mytel|MPT)$")
    status: str = Field(default="created", pattern="^(created|deployed|active|inactive|error)$")
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

class eSIMProfileUpdate(BaseModel):
    displayName: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    activationCode: Optional[str] = Field(None, min_length=1)
    smdpServerUrl: Optional[str] = Field(None, min_length=1)
    provider: Optional[str] = Field(None, pattern="^(ATOM|Ooredoo|Mytel|MPT)$")
    status: Optional[str] = Field(None, pattern="^(created|deployed|active|inactive|error)$")

class DeploymentRequest(BaseModel):
    profileId: str
    targetDeviceId: Optional[str] = None
    deploymentNotes: Optional[str] = ""

# Helper Functions
def log_operation(operation: str, profile_id: str, status: str, details: dict = None):
    """Log operation to database"""
    try:
        log_entry = {
            "id": str(uuid.uuid4()),
            "operation": operation,
            "profileId": profile_id,
            "status": status,
            "details": details or {},
            "timestamp": datetime.utcnow()
        }
        operation_logs.insert_one(log_entry)
        logger.info(f"Operation logged: {operation} - {status}")
    except Exception as e:
        logger.error(f"Failed to log operation: {str(e)}")

def execute_powershell_script(script_path: str, params: dict = None):
    """Execute PowerShell script with parameters"""
    try:
        # Construct PowerShell command
        ps_command = f"powershell.exe -ExecutionPolicy Bypass -File {script_path}"
        
        if params:
            for key, value in params.items():
                ps_command += f" -{key} '{value}'"
        
        # Execute PowerShell script
        result = subprocess.run(
            ps_command,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "PowerShell script execution timed out"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# API Routes
@app.get("/")
async def root():
    return {"message": "eSIM Management API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )

@app.post("/api/esim/create", response_model=dict)
async def create_esim_profile(profile: eSIMProfile):
    """Create new eSIM profile"""
    try:
        # Convert to dict and insert
        profile_dict = profile.dict()
        profile_dict["createdAt"] = datetime.utcnow()
        profile_dict["updatedAt"] = datetime.utcnow()
        
        result = esim_profiles.insert_one(profile_dict)
        
        # Log operation
        log_operation("CREATE", profile.id, "success", {"profileName": profile.displayName})
        
        logger.info(f"Created eSIM profile: {profile.displayName}")
        
        return {
            "success": True,
            "message": "eSIM profile created successfully",
            "profileId": profile.id,
            "profile": profile_dict
        }
    except Exception as e:
        log_operation("CREATE", profile.id, "error", {"error": str(e)})
        logger.error(f"Failed to create eSIM profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create eSIM profile: {str(e)}"
        )

@app.get("/api/esim/list")
async def list_esim_profiles(skip: int = 0, limit: int = 100):
    """List all eSIM profiles"""
    try:
        # Get profiles with pagination
        profiles = list(esim_profiles.find({}).skip(skip).limit(limit).sort("createdAt", -1))
        
        # Convert ObjectId to string for JSON serialization
        for profile in profiles:
            if '_id' in profile:
                del profile['_id']
            
            # Convert datetime to ISO format
            if 'createdAt' in profile:
                profile['createdAt'] = profile['createdAt'].isoformat()
            if 'updatedAt' in profile:
                profile['updatedAt'] = profile['updatedAt'].isoformat()
        
        total_count = esim_profiles.count_documents({})
        
        return {
            "success": True,
            "profiles": profiles,
            "total": total_count,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Failed to list eSIM profiles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list eSIM profiles: {str(e)}"
        )

@app.get("/api/esim/{profile_id}")
async def get_esim_profile(profile_id: str):
    """Get specific eSIM profile"""
    try:
        profile = esim_profiles.find_one({"id": profile_id})
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="eSIM profile not found"
            )
        
        # Clean up response
        if '_id' in profile:
            del profile['_id']
        
        # Convert datetime to ISO format
        if 'createdAt' in profile:
            profile['createdAt'] = profile['createdAt'].isoformat()
        if 'updatedAt' in profile:
            profile['updatedAt'] = profile['updatedAt'].isoformat()
        
        return {
            "success": True,
            "profile": profile
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get eSIM profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get eSIM profile: {str(e)}"
        )

@app.put("/api/esim/update/{profile_id}")
async def update_esim_profile(profile_id: str, profile_update: eSIMProfileUpdate):
    """Update eSIM profile"""
    try:
        # Check if profile exists
        existing_profile = esim_profiles.find_one({"id": profile_id})
        if not existing_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="eSIM profile not found"
            )
        
        # Prepare update data
        update_data = {k: v for k, v in profile_update.dict().items() if v is not None}
        update_data["updatedAt"] = datetime.utcnow()
        
        # Update profile
        result = esim_profiles.update_one(
            {"id": profile_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes made to profile"
            )
        
        # Get updated profile
        updated_profile = esim_profiles.find_one({"id": profile_id})
        if '_id' in updated_profile:
            del updated_profile['_id']
        
        # Log operation
        log_operation("UPDATE", profile_id, "success", update_data)
        
        logger.info(f"Updated eSIM profile: {profile_id}")
        
        return {
            "success": True,
            "message": "eSIM profile updated successfully",
            "profile": updated_profile
        }
    except HTTPException:
        raise
    except Exception as e:
        log_operation("UPDATE", profile_id, "error", {"error": str(e)})
        logger.error(f"Failed to update eSIM profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update eSIM profile: {str(e)}"
        )

@app.post("/api/esim/deploy")
async def deploy_esim_profile(deployment: DeploymentRequest):
    """Deploy eSIM profile using PowerShell/Intune"""
    try:
        # Check if profile exists
        profile = esim_profiles.find_one({"id": deployment.profileId})
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="eSIM profile not found"
            )
        
        # Update profile status to deploying
        esim_profiles.update_one(
            {"id": deployment.profileId},
            {"$set": {"status": "deploying", "updatedAt": datetime.utcnow()}}
        )
        
        # Prepare PowerShell parameters
        ps_params = {
            "ProfileId": deployment.profileId,
            "DisplayName": profile["displayName"],
            "ActivationCode": profile["activationCode"],
            "SmdpServerUrl": profile["smdpServerUrl"],
            "Provider": profile["provider"]
        }
        
        if deployment.targetDeviceId:
            ps_params["TargetDeviceId"] = deployment.targetDeviceId
        
        # Execute PowerShell deployment script
        script_path = "/app/scripts/Deploy-eSIMProfile.ps1"
        ps_result = execute_powershell_script(script_path, ps_params)
        
        # Update profile status based on result
        new_status = "deployed" if ps_result.get("success") else "error"
        esim_profiles.update_one(
            {"id": deployment.profileId},
            {"$set": {"status": new_status, "updatedAt": datetime.utcnow()}}
        )
        
        # Log operation
        log_operation("DEPLOY", deployment.profileId, 
                     "success" if ps_result.get("success") else "error", 
                     {"powershell_result": ps_result, "notes": deployment.deploymentNotes})
        
        if ps_result.get("success"):
            logger.info(f"Successfully deployed eSIM profile: {deployment.profileId}")
            return {
                "success": True,
                "message": "eSIM profile deployed successfully",
                "profileId": deployment.profileId,
                "deploymentResult": ps_result
            }
        else:
            logger.error(f"Failed to deploy eSIM profile: {ps_result}")
            return {
                "success": False,
                "message": "eSIM profile deployment failed",
                "profileId": deployment.profileId,
                "error": ps_result.get("error", "Unknown PowerShell error"),
                "deploymentResult": ps_result
            }
            
    except HTTPException:
        raise
    except Exception as e:
        log_operation("DEPLOY", deployment.profileId, "error", {"error": str(e)})
        logger.error(f"Failed to deploy eSIM profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deploy eSIM profile: {str(e)}"
        )

@app.delete("/api/esim/{profile_id}")
async def delete_esim_profile(profile_id: str):
    """Delete eSIM profile"""
    try:
        # Check if profile exists
        profile = esim_profiles.find_one({"id": profile_id})
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="eSIM profile not found"
            )
        
        # Delete profile
        result = esim_profiles.delete_one({"id": profile_id})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete profile"
            )
        
        # Log operation
        log_operation("DELETE", profile_id, "success", {"profileName": profile["displayName"]})
        
        logger.info(f"Deleted eSIM profile: {profile_id}")
        
        return {
            "success": True,
            "message": "eSIM profile deleted successfully",
            "profileId": profile_id
        }
    except HTTPException:
        raise
    except Exception as e:
        log_operation("DELETE", profile_id, "error", {"error": str(e)})
        logger.error(f"Failed to delete eSIM profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete eSIM profile: {str(e)}"
        )

@app.get("/api/esim/logs/{profile_id}")
async def get_profile_logs(profile_id: str, skip: int = 0, limit: int = 50):
    """Get operation logs for specific profile"""
    try:
        logs = list(operation_logs.find({"profileId": profile_id})
                   .skip(skip).limit(limit).sort("timestamp", -1))
        
        # Clean up logs for JSON serialization
        for log in logs:
            if '_id' in log:
                del log['_id']
            if 'timestamp' in log:
                log['timestamp'] = log['timestamp'].isoformat()
        
        total_count = operation_logs.count_documents({"profileId": profile_id})
        
        return {
            "success": True,
            "logs": logs,
            "total": total_count,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Failed to get profile logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get profile logs: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)