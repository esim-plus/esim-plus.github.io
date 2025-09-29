"""RBAC Enforcement Service for Multi-Tenant eSIM Management"""

from typing import Dict, List, Optional
from enum import Enum
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class Role(str, Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"

class Permission(str, Enum):
    CREATE_PROFILE = "create_profile"
    READ_PROFILE = "read_profile"
    UPDATE_PROFILE = "update_profile"
    DELETE_PROFILE = "delete_profile"
    DEPLOY_PROFILE = "deploy_profile"
    MIGRATE_DEVICE = "migrate_device"
    MANAGE_USERS = "manage_users"
    VIEW_AUDIT_LOGS = "view_audit_logs"
    MANAGE_TENANTS = "manage_tenants"

class RBACEnforcer:
    def __init__(self):
        self.role_permissions = {
            Role.ADMIN: [
                Permission.CREATE_PROFILE,
                Permission.READ_PROFILE,
                Permission.UPDATE_PROFILE,
                Permission.DELETE_PROFILE,
                Permission.DEPLOY_PROFILE,
                Permission.MIGRATE_DEVICE,
                Permission.MANAGE_USERS,
                Permission.VIEW_AUDIT_LOGS,
                Permission.MANAGE_TENANTS
            ],
            Role.OPERATOR: [
                Permission.CREATE_PROFILE,
                Permission.READ_PROFILE,
                Permission.UPDATE_PROFILE,
                Permission.DEPLOY_PROFILE,
                Permission.MIGRATE_DEVICE,
                Permission.VIEW_AUDIT_LOGS
            ],
            Role.VIEWER: [
                Permission.READ_PROFILE,
                Permission.VIEW_AUDIT_LOGS
            ]
        }
    
    def check_permission(self, user: Dict, permission: Permission, resource_tenant_id: str = None) -> bool:
        """Check if user has permission for operation"""
        try:
            # Check if user is active
            if not user.get("isActive", True):
                logger.warning(f"Inactive user attempted access: {user.get('id')}")
                return False
            
            # Check tenant isolation
            if resource_tenant_id and user.get("tenantId") != resource_tenant_id:
                logger.warning(f"Cross-tenant access attempt: {user.get('id')} -> {resource_tenant_id}")
                return False
            
            # Check role permissions
            user_role = Role(user.get("role", "viewer"))
            allowed_permissions = self.role_permissions.get(user_role, [])
            
            has_permission = permission in allowed_permissions
            
            if not has_permission:
                logger.warning(f"Permission denied: {user.get('id')} lacks {permission.value}")
            
            return has_permission
            
        except Exception as e:
            logger.error(f"RBAC check failed: {str(e)}")
            return False
    
    def enforce_tenant_isolation(self, user: Dict, resource_tenant_id: str) -> bool:
        """Enforce strict tenant isolation"""
        if user.get("tenantId") != resource_tenant_id:
            raise PermissionError(f"Access denied: Tenant isolation violation")
        return True
    
    def get_user_permissions(self, user: Dict) -> List[Permission]:
        """Get all permissions for user"""
        try:
            user_role = Role(user.get("role", "viewer"))
            return self.role_permissions.get(user_role, [])
        except Exception:
            return []
    
    def can_access_resource(self, user: Dict, resource_type: str, resource_id: str, 
                          operation: Permission) -> bool:
        """Check if user can access specific resource"""
        # Basic permission check
        if not self.check_permission(user, operation):
            return False
        
        # Resource-specific access control can be added here
        # For example, users can only access their own profiles
        
        return True

class TenantManager:
    def __init__(self, db_client):
        self.db = db_client.esim_management
        self.tenants = self.db.tenants
    
    def create_tenant(self, name: str, provider: str, admin_email: str) -> Dict:
        """Create new tenant with isolation"""
        tenant = {
            "id": str(uuid.uuid4()),
            "name": name,
            "provider": provider,
            "adminEmail": admin_email,
            "isActive": True,
            "createdAt": datetime.utcnow(),
            "settings": {
                "maxProfiles": 1000,
                "allowMigration": True,
                "auditRetentionDays": 2555
            }
        }
        
        result = self.tenants.insert_one(tenant)
        logger.info(f"Tenant created: {tenant['id']}")
        return tenant
    
    def get_tenant(self, tenant_id: str) -> Optional[Dict]:
        """Get tenant by ID"""
        return self.tenants.find_one({"id": tenant_id, "isActive": True})
    
    def validate_tenant_access(self, user: Dict, tenant_id: str) -> bool:
        """Validate user has access to tenant"""
        if user.get("tenantId") != tenant_id:
            return False
        
        tenant = self.get_tenant(tenant_id)
        return tenant is not None and tenant.get("isActive", False)