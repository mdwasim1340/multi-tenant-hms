# n8n Chat Integration Fix - December 4, 2025

## Issues Identified

### 1. Hardcoded localhost URL in Chat Widget ❌
**Problem**: Chat widget uses `http://localhost:3000/api/n8n/chat` instead of environment variable
**Impact**: Chat fails in production with "ERR_CONNECTION_REFUSED"
**Location**: `hospital-management-system/components/chat-widget.tsx:100`

### 2. Branding API Returns 403 ⚠️
**Problem**: `/api/tenants/sunrise_medical_center/branding` returns 403 Forbidden
**Impact**: Branding features not working, falls back to defaults
**Root Cause**: Likely missing authentication or permission check

### 3. Subscription API Returns 403 ⚠️
**Problem**: `/api/subscriptions/current` returns 403 Forbidden
**Impact**: Subscription tier features not working, falls back to basic tier
**Root Cause**: Likely missing authentication or permission check

### 4. Vercel Analytics Script 404 ℹ️
**Problem**: `/_vercel/insights/script.js` returns 404
**Impact**: Analytics not working (non-critical)
**Root Cause**: Vercel Web Analytics not enabled for project

## Fixes Required

### Fix 1: Update Chat Widget to Use Environment Variable

**File**: `hospital-management-system/components/chat-widget.tsx`

**Change**:
```typescript
// ❌ WRONG - Line 100
const response = await fetch("http://localhost:3000/api/n8n/chat", {

// ✅ CORRECT
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const response = await fetch(`${API_URL}/api/n8n/chat`, {
```

**Full Implementation**:
```typescript
// Add at top of component
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Update handleSendMessage function
const handleSendMessage = async () => {
  if (!input.trim()) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: "user",
    content: input,
    timestamp: new Date(),
  }

  setMessages((prev) => [...prev, userMessage])
  const currentInput = input
  setInput("")
  setIsLoading(true)

  try {
    // Call backend n8n integration with environment variable
    const response = await fetch(`${API_URL}/api/n8n/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        // Add authentication headers if needed
        "X-App-ID": "hospital-management",
        "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "hospital-dev-key-123"
      },
      body: JSON.stringify({
        message: currentInput,
        sessionId: sessionId,
        department: department,
      }),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to get response from AI agent")
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: data.response,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, assistantMessage])
  } catch (error) {
    console.error("Chat error:", error)
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Sorry, I encountered an error connecting to the AI agent. Please try again or select a different department.",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, errorMessage])
  } finally {
    setIsLoading(false)
  }
}
```

### Fix 2: Check Branding API Authentication

**Backend Route**: Check if `/api/tenants/:tenantId/branding` requires authentication

**Possible Issues**:
1. Route requires authentication but frontend not sending token
2. Route requires specific permissions
3. Route doesn't exist or is misconfigured

**Investigation Steps**:
```bash
# 1. Check if route exists
grep -r "branding" backend/src/routes/

# 2. Check route middleware
# Look for auth middleware on branding route

# 3. Test with curl
curl -X GET https://backend.aajminpolyclinic.com.np/api/tenants/sunrise_medical_center/branding \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: sunrise_medical_center" \
  -H "X-App-ID: hospital-management" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Temporary Fix**: Frontend already handles 403 gracefully with fallback to defaults

### Fix 3: Check Subscription API Authentication

**Backend Route**: Check if `/api/subscriptions/current` requires authentication

**Investigation Steps**:
```bash
# 1. Check if route exists
grep -r "subscriptions/current" backend/src/routes/

# 2. Test with curl
curl -X GET https://backend.aajminpolyclinic.com.np/api/subscriptions/current \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: sunrise_medical_center" \
  -H "X-App-ID: hospital-management" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Temporary Fix**: Frontend already handles 403 gracefully with fallback to basic tier

### Fix 4: Disable Vercel Analytics (Optional)

**File**: `hospital-management-system/next.config.mjs`

**Option 1**: Enable Vercel Analytics in Vercel dashboard
**Option 2**: Disable analytics in config:
```javascript
const nextConfig = {
  // ... other config
  analytics: false
}
```

## Environment Variables Required

### Production (.env.production)
```bash
# Backend API URL
NEXT_PUBLIC_API_URL=https://backend.aajminpolyclinic.com.np

# API Key
NEXT_PUBLIC_API_KEY=your-production-api-key

# n8n Configuration (Backend)
N8N_BASE_URL=https://n8n.aajminpolyclinic.com.np
N8N_WEBHOOK_AUTH_HEADER=cdss
N8N_WEBHOOK_AUTH_TOKEN=your-n8n-token
N8N_OPD_AGENT_PATH=opd-agent-path
N8N_WARD_AGENT_PATH=ward-agent-path
N8N_EMERGENCY_AGENT_PATH=emergency-agent-path
N8N_SESSION_TIMEOUT=90000
```

### Local Development (.env.local)
```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# API Key
NEXT_PUBLIC_API_KEY=hospital-dev-key-123

# n8n Configuration (Backend .env)
N8N_BASE_URL=http://localhost:5678
N8N_WEBHOOK_AUTH_HEADER=cdss
N8N_WEBHOOK_AUTH_TOKEN=your-local-n8n-token
N8N_OPD_AGENT_PATH=opd-agent-path
N8N_WARD_AGENT_PATH=ward-agent-path
N8N_EMERGENCY_AGENT_PATH=emergency-agent-path
N8N_SESSION_TIMEOUT=90000
```

## Testing Checklist

### Local Testing
- [ ] Chat widget opens successfully
- [ ] Department selector works
- [ ] Messages send and receive responses
- [ ] Voice input works (if browser supports)
- [ ] Error handling works for failed requests
- [ ] Session ID persists across messages

### Production Testing
- [ ] Chat widget uses production backend URL
- [ ] n8n webhooks respond correctly
- [ ] Authentication headers included
- [ ] Branding loads or falls back gracefully
- [ ] Subscription tier loads or falls back gracefully
- [ ] No console errors (except non-critical ones)

## Deployment Steps

### 1. Update Chat Widget
```bash
# Edit file
code hospital-management-system/components/chat-widget.tsx

# Test locally
cd hospital-management-system
npm run dev

# Build for production
npm run build
```

### 2. Deploy to Production
```bash
# SSH to production
ssh -i "C:\app_dev\multi-tenant-backend\n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75

# Navigate to frontend
cd /home/bitnami/hospital-frontend

# Pull changes
git pull origin main

# Install dependencies (if needed)
npm install

# Build
npm run build

# Restart PM2
pm2 restart hospital-frontend

# Check logs
pm2 logs hospital-frontend --lines 50
```

### 3. Verify n8n Configuration
```bash
# Check backend environment variables
cat /home/bitnami/multi-tenant-backend/.env | grep N8N

# Test n8n status endpoint
curl http://localhost:3001/api/n8n/status

# Test n8n chat endpoint
curl -X POST http://localhost:3001/api/n8n/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "sessionId": "test-session",
    "department": "general"
  }'
```

## Success Criteria

✅ Chat widget connects to correct backend URL (production or local)
✅ n8n chat responses received successfully
✅ Department switching works
✅ Error messages are user-friendly
✅ No "ERR_CONNECTION_REFUSED" errors
✅ Branding and subscription APIs either work or fail gracefully

## Known Issues (Non-Critical)

1. **Vercel Analytics 404**: Not critical, can be ignored or disabled
2. **Cloudflare Insights Blocked**: Tracking prevention is working as expected
3. **Branding 403**: Falls back to defaults gracefully
4. **Subscription 403**: Falls back to basic tier gracefully

## Next Steps

1. ✅ Fix hardcoded localhost URL in chat widget
2. ⏳ Investigate branding API 403 (optional - has fallback)
3. ⏳ Investigate subscription API 403 (optional - has fallback)
4. ⏳ Configure n8n webhooks in production
5. ⏳ Test end-to-end chat flow in production

---

**Status**: Ready to implement Fix 1 (critical)
**Priority**: High (chat functionality broken in production)
**Estimated Time**: 15 minutes
**Risk**: Low (simple environment variable change)
