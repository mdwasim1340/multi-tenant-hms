# 🚀 Start Backend Server

## ✅ Port 3000 Cleared

The Node.js processes have been stopped. The connections in TimeWait state will clear automatically in a few seconds.

## 📝 Start Server

```bash
cd backend
npm run dev
```

## ⏱️ Wait Time

If you still see "EADDRINUSE" error:
- Wait 30-60 seconds for TimeWait connections to clear
- Or use a different port temporarily

## 🔄 Alternative: Use Different Port

If you need to start immediately, you can temporarily use port 3001:

1. **Update backend `.env`**:
   ```
   PORT=3001
   ```

2. **Update frontend API URL**:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. **Start server**:
   ```bash
   npm run dev
   ```

## ✅ Expected Output

When server starts successfully:
```
✅ WebSocket server initialized
Server is running on port 3000
```

## 🧪 Test Server

Once started, test the new diagnostic invoice endpoint:

```bash
curl -X POST http://localhost:3000/api/billing/generate-diagnostic-invoice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -d '{
    "tenant_id": "aajmin_polyclinic",
    "patient_id": 1,
    "patient_name": "John Doe",
    "patient_number": "P001",
    "line_items": [
      {
        "description": "X-Ray - Chest",
        "quantity": 1,
        "unit_price": 500,
        "amount": 525
      }
    ]
  }'
```

---

**Status**: Ready to start server  
**Port**: 3000 (cleared)  
**Next**: Run `npm run dev` in backend directory
