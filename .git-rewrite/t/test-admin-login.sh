#!/bin/bash

# 🔐 Admin Login Test Script
# Tests the admin login flow end-to-end

set -e

API_URL="${API_URL:-http://localhost:4000}"
EMAIL="admin@advancia.com"
PASSWORD="Admin@123"
PHONE="+1234567890"

echo "🔐 Testing Admin Login Flow"
echo "============================"
echo ""
echo "API URL: $API_URL"
echo "Email: $EMAIL"
echo "Password: ****"
echo ""

# Test 1: Health check
echo "📡 Step 1: Checking backend health..."
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not accessible at $API_URL"
    echo "   Start it with: cd backend && npm run dev"
    exit 1
fi
echo ""

# Test 2: Request OTP
echo "🔑 Step 2: Requesting OTP..."
RESPONSE=$(curl -s -X POST "$API_URL/api/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"phone\":\"$PHONE\"}")

echo "Response: $RESPONSE"
echo ""

# Check if OTP step was returned
if echo "$RESPONSE" | grep -q "verify_otp"; then
    echo "✅ OTP request successful!"
    echo ""
    echo "📱 CHECK YOUR BACKEND CONSOLE for the OTP code"
    echo "   Look for a line like:"
    echo "   [DEV] Admin OTP for admin@advancia.com: 123456"
    echo ""
    
    # Extract OTP if in dev mode
    OTP=$(echo "$RESPONSE" | grep -o '"code":"[0-9]*"' | grep -o '[0-9]*' || echo "")
    if [ -n "$OTP" ]; then
        echo "🎯 OTP Found in Response: $OTP"
        echo ""
        echo "🔐 Step 3: Verifying OTP..."
        
        VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/admin/verify-otp" \
          -H "Content-Type: application/json" \
          -d "{\"email\":\"$EMAIL\",\"code\":\"$OTP\"}")
        
        if echo "$VERIFY_RESPONSE" | grep -q "accessToken"; then
            echo "✅ OTP verification successful!"
            echo "✅ Admin login working correctly!"
            echo ""
            echo "Tokens received:"
            echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
        else
            echo "❌ OTP verification failed"
            echo "Response: $VERIFY_RESPONSE"
            exit 1
        fi
    else
        echo "ℹ️  OTP not in response (production mode)"
        echo "   Please check backend logs for OTP code"
        echo ""
        echo "To complete login manually:"
        echo "1. Find OTP in backend console"
        echo "2. Run: curl -X POST $API_URL/api/auth/admin/verify-otp \\"
        echo "     -H 'Content-Type: application/json' \\"
        echo "     -d '{\"email\":\"$EMAIL\",\"code\":\"YOUR_OTP\"}'"
    fi
else
    echo "❌ OTP request failed"
    echo "Response: $RESPONSE"
    
    if echo "$RESPONSE" | grep -q "Invalid credentials"; then
        echo ""
        echo "⚠️  Invalid credentials detected"
        echo "   Expected email: $EMAIL"
        echo "   Expected password: Admin@123"
        echo ""
        echo "   Check ADMIN_EMAIL and ADMIN_PASS in backend/.env"
    elif echo "$RESPONSE" | grep -q "No admin user found"; then
        echo ""
        echo "⚠️  No admin user in database"
        echo "   Run: cd backend && npm run db:seed"
    fi
    exit 1
fi

echo ""
echo "============================"
echo "✅ Admin Login Test Complete"
echo "============================"
