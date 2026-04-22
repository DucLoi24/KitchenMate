#!/usr/bin/env python
"""
Script test trực tiếp Register và Login API
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def test_register():
    """Test Register API"""
    print("=" * 60)
    print("TEST REGISTER API")
    print("=" * 60)
    
    payload = {
        "email": f"test{int(datetime.now().timestamp())}@example.com",
        "full_name": "Test User",
        "password": "TestPass123",
        "password_confirm": "TestPass123"
    }
    
    print(f"\n📤 Sending payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register/",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        print(f"Response Body:")
        print(json.dumps(response.json(), indent=2))
        
        return response.json() if response.status_code == 201 else None
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return None

def test_login(email="testuser@example.com", password="TestPass123"):
    """Test Login API"""
    print("\n" + "=" * 60)
    print("TEST LOGIN API")
    print("=" * 60)
    
    payload = {
        "email": email,
        "password": password
    }
    
    print(f"\n📤 Sending payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login/",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        print(f"Response Body:")
        print(json.dumps(response.json(), indent=2))
        
        return response.json() if response.status_code == 200 else None
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return None

if __name__ == "__main__":
    # Test Register
    register_result = test_register()
    
    # Test Login với user vừa tạo (nếu register thành công)
    if register_result and register_result.get('success'):
        user_email = register_result['data']['user']['email']
        test_login(email=user_email, password="TestPass123")
    else:
        # Test với user có sẵn
        test_login()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
