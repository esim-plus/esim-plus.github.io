"""API tests for eSIM provisioning system"""

import pytest
from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_health_endpoint():
    """Test health check endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_root_endpoint():
    """Test root endpoint returns clean data"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "eSIM Plus Management API" in data["message"]
    # Ensure no emojis in response
    import re
    emoji_pattern = re.compile(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]')
    assert not emoji_pattern.search(str(data))

def test_providers_list():
    """Test providers are correctly listed"""
    response = client.get("/")
    data = response.json()
    providers = data.get("providers", [])
    expected_providers = ["MPT", "ATOM", "OOREDOO", "MYTEL"]
    for provider in expected_providers:
        assert provider in providers