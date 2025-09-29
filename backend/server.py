from fastapi import FastAPI, HTTPException, status, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient, IndexModel
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import subprocess
import logging
import uuid
import json
import qrcode
import io
import base64
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
    title="eSIM Plus Management API",
    description="Enterprise eSIM Management API for MPT/ATOM/OOREDOO/MYTEL providers with multi-tenancy, RBAC, and compliance",
    version="2.0.0"
)

# Security configuration
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection with indexes
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/esim_management')
client = MongoClient(MONGO_URL)
db = client.esim_management

# Collections
esim_profiles = db.esim_profiles
operation_logs = db.operation_logs
users = db.users
tenants = db.tenants
qr_codes = db.qr_codes
device_migrations = db.device_migrations
compliance_logs = db.compliance_logs

# Create indexes for performance
def create_indexes():
    """Create database indexes for optimal performance"""
    try:
        # Profile indexes
        esim_profiles.create_index(["id"], unique=True)
        esim_profiles.create_index(["tenantId", "provider"])
        esim_profiles.create_index(["status"])
        esim_profiles.create_index(["createdAt"])
        
        # User indexes
        users.create_index(["username"], unique=True)
        users.create_index(["tenantId"])
        
        # QR Code indexes
        qr_codes.create_index(["profileId"])
        qr_codes.create_index(["expiresAt"])
        
        # Compliance log indexes
        compliance_logs.create_index(["timestamp"])
        compliance_logs.create_index(["operation"])
        compliance_logs.create_index(["tenantId"])
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Failed to create indexes: {str(e)}")

# Initialize indexes on startup
create_indexes()

# Constants
VALID_PROVIDERS = ["MPT", "ATOM", "OOREDOO", "MYTEL"]
VALID_ROLES = ["admin", "operator", "viewer"]
VALID_STATUSES = ["created", "deployed", "active", "inactive", "error", "migrating"]

# Enhanced Pydantic Models
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    email: str = Field(..., regex=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    role: str = Field(..., pattern="^(admin|operator|viewer)$")
    tenantId: str
    fullName: str = Field(..., min_length=1, max_length=100)

class User(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    role: str
    tenantId: str
    fullName: str
    isActive: bool = Field(default=True)
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    lastLogin: Optional[datetime] = None

class Tenant(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=1, max_length=100)
    provider: str = Field(..., pattern="^(MPT|ATOM|OOREDOO|MYTEL)$")
    isActive: bool = Field(default=True)
    adminIdentity: str = Field(default="admin@esimplus.onmicrosoft.com")
    entitlementServerUrl: Optional[str] = None
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    settings: Dict[str, Any] = Field(default_factory=dict)

class eSIMProfile(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    tenantId: str = Field(..., min_length=1)
    displayName: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(default="", max_length=500)
    activationCode: str = Field(..., min_length=1)
    smdpServerUrl: str = Field(..., min_length=1)
    provider: str = Field(..., pattern="^(MPT|ATOM|OOREDOO|MYTEL)$")
    status: str = Field(default="created", pattern="^(created|deployed|active|inactive|error|migrating)$")
    qrCodeId: Optional[str] = None
    deviceId: Optional[str] = None
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    createdBy: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class QRCode(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    profileId: str
    tenantId: str
    qrData: str
    imageBase64: str
    expiresAt: datetime
    isActive: bool = Field(default=True)
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    scannedAt: Optional[datetime] = None
    scannedBy: Optional[str] = None

class DeviceMigration(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    profileId: str
    tenantId: str
    sourceDeviceId: str
    targetDeviceId: str
    status: str = Field(default="pending", pattern="^(pending|in_progress|completed|failed)$")
    initiatedBy: str
    completedAt: Optional[datetime] = None
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    migrationNotes: Optional[str] = None

class ComplianceLog(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    tenantId: str
    operation: str
    resourceType: str
    resourceId: str
    userId: str
    userRole: str
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)
    details: Dict[str, Any] = Field(default_factory=dict)
    complianceStatus: str = Field(default="compliant", pattern="^(compliant|non_compliant|requires_review)$")

# Authentication and Authorization
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get current authenticated user from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        
        user = users.find_one({"username": username})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        if not user.get("isActive", True):
            raise HTTPException(status_code=401, detail="Inactive user")
        
        # Update last login
        users.update_one(
            {"username": username},
            {"$set": {"lastLogin": datetime.utcnow()}}
        )
        
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

def check_permission(user: dict, required_role: str = None, tenant_id: str = None):
    """Check if user has required permissions"""
    if not user.get("isActive", True):
        raise HTTPException(status_code=403, detail="User account is inactive")
    
    # Check tenant isolation
    if tenant_id and user.get("tenantId") != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied: Tenant mismatch")
    
    # Check role-based permissions
    if required_role:
        user_role = user.get("role")
        role_hierarchy = {"admin": 3, "operator": 2, "viewer": 1}
        
        if role_hierarchy.get(user_role, 0) < role_hierarchy.get(required_role, 999):
            raise HTTPException(status_code=403, detail=f"Insufficient permissions. Required: {required_role}")

# Utility Functions
def log_compliance_activity(user: dict, operation: str, resource_type: str, resource_id: str, details: dict = None):
    """Log compliance activity for audit trail"""
    try:
        compliance_entry = ComplianceLog(
            tenantId=user.get("tenantId"),
            operation=operation,
            resourceType=resource_type,
            resourceId=resource_id,
            userId=user.get("id"),
            userRole=user.get("role"),
            details=details or {}
        ).dict()
        
        compliance_logs.insert_one(compliance_entry)
        logger.info(f"Compliance activity logged: {operation} on {resource_type}")
    except Exception as e:
        logger.error(f"Failed to log compliance activity: {str(e)}")

def generate_qr_code(profile: dict) -> dict:
    """Generate QR code for eSIM profile"""
    try:
        # Create QR code data
        qr_data = f"LPA:1${profile['smdpServerUrl']}${profile['activationCode']}"
        
        # Generate QR code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        # Create image
        qr_image = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        img_buffer = io.BytesIO()
        qr_image.save(img_buffer, format='PNG')
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        # Set expiration
        expiry_hours = int(os.environ.get('QR_CODE_EXPIRY_HOURS', 24))
        expires_at = datetime.utcnow() + timedelta(hours=expiry_hours)
        
        # Create QR code record
        qr_code = QRCode(
            profileId=profile['id'],
            tenantId=profile['tenantId'],
            qrData=qr_data,
            imageBase64=img_base64,
            expiresAt=expires_at
        ).dict()
        
        result = qr_codes.insert_one(qr_code)
        qr_code['_id'] = str(result.inserted_id)
        
        return qr_code
    except Exception as e:
        logger.error(f"Failed to generate QR code: {str(e)}")
        return None

def execute_powershell_deployment(profile: dict, target_device_id: str = None) -> dict:
    """Execute PowerShell script for Intune deployment"""
    try:
        # Prepare PowerShell parameters
        ps_params = {
            "ProfileId": profile["id"],
            "DisplayName": profile["displayName"],
            "ActivationCode": profile["activationCode"],
            "SmdpServerUrl": profile["smdpServerUrl"],
            "Provider": profile["provider"]
        }
        
        if target_device_id:
            ps_params["TargetDeviceId"] = target_device_id
        
        # Construct PowerShell command
        script_path = "/app/scripts/Deploy-eSIMProfile.ps1"
        ps_command = f"powershell.exe -ExecutionPolicy Bypass -File {script_path}"
        
        for key, value in ps_params.items():
            ps_command += f" -{key} '{value}'"
        
        # Execute PowerShell script
        result = subprocess.run(
            ps_command,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "PowerShell script execution timed out"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# API Routes
@app.get("/")
async def root():
    return {
        "message": "eSIM Plus Management API",
        "version": "2.0.0",
        "providers": VALID_PROVIDERS,
        "features": [
            "Multi-tenancy",
            "RBAC", 
            "QR Code Management",
            "Device Migration",
            "Compliance Logging",
            "Microsoft Intune Integration"
        ]
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint with database connectivity test"""
    try:
        # Test database connection
        db.command('ping')
        
        # Check collections
        collections_status = {
            "esim_profiles": esim_profiles.count_documents({}),
            "users": users.count_documents({}),
            "tenants": tenants.count_documents({}),
            "compliance_logs": compliance_logs.count_documents({})
        }
        
        return {
            "status": "healthy",
            "database": "connected",
            "collections": collections_status,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unavailable: {str(e)}"
        )

# Authentication endpoints
@app.post("/api/auth/login")
async def login(username: str, password: str):
    """User authentication endpoint"""
    try:
        user = users.find_one({"username": username})
        if not user or not verify_password(password, user.get("hashedPassword")):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not user.get("isActive", True):
            raise HTTPException(status_code=401, detail="Account is inactive")
        
        # Create JWT token
        access_token = create_access_token(data={"sub": username})
        
        # Update last login
        users.update_one(
            {"username": username},
            {"$set": {"lastLogin": datetime.utcnow()}}
        )
        
        # Log compliance activity
        log_compliance_activity(user, "LOGIN", "user", user["id"])
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "role": user["role"],
                "tenantId": user["tenantId"],
                "fullName": user["fullName"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)