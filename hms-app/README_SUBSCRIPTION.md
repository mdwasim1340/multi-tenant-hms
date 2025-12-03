# MedChat Subscription System

## Overview

The MedChat mobile app uses the **same subscription infrastructure** as the Hospital Management System but with **different pricing tiers** tailored for consumer/patient use.

## ✅ Backend Status: COMPLETE

All backend work is done and tested. The system is ready for Flutter integration.

## Pricing Plans

### 📱 MedChat Mobile App

| Plan | Price | Consultations | Video | Family | Storage |
|------|-------|--------------|-------|--------|---------|
| **Basic** | Rs. 999/mo | 5/month | ❌ | 1 | 1 GB |
| **Advance** | Rs. 2,999/mo | 20/month | 300 min | 4 | 5 GB |
| **Premium** | Rs. 9,999/mo | Unlimited | Unlimited | 10 | 20 GB |

### 🏥 Hospital Management (Unchanged)

| Plan | Price |
|------|-------|
| Basic | Rs. 4,999/mo |
| Advanced | Rs. 14,999/mo |
| Premium | Rs. 29,999/mo |

## Quick Test

```bash
# Test MedChat subscriptions
cd backend
node tests/test-medchat-subscriptions.js

# Expected: ✅ 5/5 tests passing
```

## API Usage

```dart
// Get MedChat subscription tiers
final response = await dio.get(
  '/api/subscriptions/tiers',
  queryParameters: {'application_id': 'medchat-mobile'},
);

// Response contains 3 tiers: medchat_basic, medchat_advance, medchat_premium
```

## Documentation

- **Quick Reference**: `MEDCHAT_SUBSCRIPTION_QUICK_REFERENCE.md`
- **Setup Complete**: `SUBSCRIPTION_SETUP_COMPLETE.md`
- **Integration Guide**: `MEDCHAT_SUBSCRIPTION_INTEGRATION.md`

## Next Steps

1. Implement Flutter subscription models
2. Create subscription UI screens
3. Integrate Razorpay payment gateway
4. Add feature access checks
5. Implement usage tracking

**Estimated Time**: 10-15 hours

---

**Status**: ✅ Backend Ready | 📋 Frontend Pending
