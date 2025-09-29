"""QR Code Lifecycle Management for eSIM Provisioning"""

import qrcode
import base64
import io
from datetime import datetime, timedelta
from typing import Dict, Optional
from pymongo import MongoClient
import uuid
import logging

logger = logging.getLogger(__name__)

class QRLifecycleManager:
    def __init__(self, db_client: MongoClient):
        self.db = db_client.esim_management
        self.qr_codes = self.db.qr_codes
        
    def generate_qr(self, profile_id: str, tenant_id: str, activation_code: str, 
                   smdp_url: str, expiry_hours: int = 24) -> Dict:
        """Generate QR code with automatic expiration"""
        qr_data = f"LPA:1${smdp_url}${activation_code}"
        
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        qr_record = {
            "id": str(uuid.uuid4()),
            "profileId": profile_id,
            "tenantId": tenant_id,
            "qrData": qr_data,
            "imageBase64": img_base64,
            "createdAt": datetime.utcnow(),
            "expiresAt": datetime.utcnow() + timedelta(hours=expiry_hours),
            "isActive": True,
            "scannedAt": None
        }
        
        self.qr_codes.insert_one(qr_record)
        logger.info(f"QR code generated for profile {profile_id}")
        return qr_record
    
    def get_qr(self, qr_id: str, tenant_id: str) -> Optional[Dict]:
        """Retrieve QR code with tenant isolation"""
        qr = self.qr_codes.find_one({"id": qr_id, "tenantId": tenant_id})
        if qr and qr["expiresAt"] > datetime.utcnow():
            return qr
        return None
    
    def mark_scanned(self, qr_id: str, tenant_id: str) -> bool:
        """Mark QR code as scanned"""
        result = self.qr_codes.update_one(
            {"id": qr_id, "tenantId": tenant_id},
            {"$set": {"scannedAt": datetime.utcnow(), "isActive": False}}
        )
        return result.modified_count > 0
    
    def cleanup_expired(self) -> int:
        """Remove expired QR codes"""
        result = self.qr_codes.delete_many({"expiresAt": {"$lt": datetime.utcnow()}})
        return result.deleted_count