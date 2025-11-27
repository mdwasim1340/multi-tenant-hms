# n8n Integration - Quick Start

## ⚡ Start Using in 3 Steps

### 1. Start Backend
```bash
cd backend
npm run dev
```
✅ Backend running on http://localhost:3000

### 2. Start Frontend
```bash
cd hospital-management-system
npm run dev
```
✅ Frontend running on http://localhost:3001

### 3. Test Chat Widget
1. Open http://localhost:3001
2. Click chat button (bottom-right) 💬
3. Select department (OPD/Ward/Emergency/General)
4. Type message and send
5. Get AI response! 🤖

## 🧪 Quick Test

```bash
cd backend
node tests/test-n8n-integration.js
```

Expected: ✅ Passed: 4/4

## 🔍 Verify Configuration

```bash
curl http://localhost:3000/api/n8n/status
```

Should show all agents configured ✓

## 🤖 Departments

- **🩺 OPD** - Medical consultations
- **🏥 Ward** - Inpatient management  
- **🚨 Emergency** - Critical care
- **❓ General** - Hospital info

## 📚 Full Docs

- Setup: `backend/docs/N8N_SETUP_GUIDE.md`
- Technical: `backend/docs/N8N_INTEGRATION.md`
- Summary: `N8N_INTEGRATION_SUMMARY.md`

## ✅ Status

**Integration**: Complete  
**Credentials**: Configured  
**Tests**: Passing  
**Ready**: Yes! 🎉
