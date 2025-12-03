# MedChat Mobile App - Subscription Integration Guide

**Created**: December 3, 2025  
**Status**: Ready for Implementation

## Overview

The MedChat mobile app uses the same subscription infrastructure as the Hospital Management System but with different pricing tiers and features tailored for patient/consumer use.

## Subscription Tiers

### Basic - Rs. 999/month
**Target**: Individual users seeking basic healthcare access

**Features**:
- ✅ Chat support with healthcare professionals
- ✅ Appointment booking
- ✅ Prescription access and management
- ✅ Medical records view
- ❌ Video consultation
- ❌ Priority support
- ❌ Health tracking
- ❌ Family accounts

**Limits**:
- 5 consultations per month
- 1 family member (self only)
- 1 GB storage
- 0 video minutes

### Advance - Rs. 2,999/month
**Target**: Families and users needing regular healthcare access

**Features**:
- ✅ All Basic features
- ✅ Video consultation (300 minutes/month)
- ✅ Priority support
- ✅ Health tracking (vitals, medications, etc.)
- ✅ Family accounts (up to 4 members)

**Limits**:
- 20 consultations per month
- 4 family members
- 5 GB storage
- 300 video minutes per month

### Premium - Rs. 9,999/month
**Target**: Large families and users requiring unlimited access

**Features**:
- ✅ All Advance features
- ✅ Unlimited consultations
- ✅ Unlimited video minutes
- ✅ Extended family accounts (up to 10 members)
- ✅ Premium storage (20 GB)

**Limits**:
- Unlimited consultations
- 10 family members
- 20 GB storage
- Unlimited video minutes

## Database Setup

### 1. Run Setup Script

```bash
cd backend
node scripts/setup-medchat-subscriptions.js
```

This script:
- Adds `application_id` column to `subscription_tiers` table
- Creates indexes for performance
- Inserts 3 MedChat-specific tiers
- Maintains existing hospital management tiers

### 2. Verify Setup

```bash
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT id, name, price, application_id 
FROM subscription_tiers 
WHERE application_id = 'medchat-mobile'
ORDER BY display_order;
"
```

Expected output:
```
       id        |      name       |  price   | application_id  
-----------------+-----------------+----------+-----------------
 medchat_basic   | MedChat Basic   |   999.00 | medchat-mobile
 medchat_advance | MedChat Advance |  2999.00 | medchat-mobile
 medchat_premium | MedChat Premium |  9999.00 | medchat-mobile
```

## API Integration

### Base URL
```
Development: http://10.0.2.2:3000 (Android)
Development: http://localhost:3000 (iOS/Web)
Production: https://your-api-domain.com
```

### Required Headers
```dart
final headers = {
  'Content-Type': 'application/json',
  'X-App-ID': 'medchat-mobile',
  'X-API-Key': 'medchat-dev-key-789',  // From environment
  'Authorization': 'Bearer $jwtToken',   // After login
  'X-Tenant-ID': '$tenantId',            // User's tenant
};
```

### API Endpoints

#### 1. Get MedChat Subscription Tiers
```http
GET /api/subscriptions/tiers?application_id=medchat-mobile
```

**Response**:
```json
{
  "success": true,
  "application_id": "medchat-mobile",
  "tiers": [
    {
      "id": "medchat_basic",
      "name": "MedChat Basic",
      "price": 999,
      "currency": "INR",
      "features": {
        "chat_support": true,
        "appointment_booking": true,
        "prescription_access": true,
        "medical_records_view": true,
        "video_consultation": false,
        "priority_support": false,
        "health_tracking": false,
        "family_accounts": false
      },
      "limits": {
        "max_consultations_per_month": 5,
        "max_family_members": 1,
        "storage_gb": 1,
        "video_minutes_per_month": 0
      }
    }
    // ... other tiers
  ]
}
```

#### 2. Get User's Current Subscription
```http
GET /api/subscriptions/current
Headers: Authorization, X-Tenant-ID, X-App-ID, X-API-Key
```

**Response**:
```json
{
  "tier": {
    "id": "medchat_basic",
    "name": "MedChat Basic",
    "price": 999,
    "features": { ... },
    "limits": { ... }
  },
  "usage": {
    "consultations_this_month": 2,
    "family_members_count": 1,
    "storage_used_gb": 0.3,
    "video_minutes_used_this_month": 0
  },
  "warnings": []
}
```

#### 3. Compare Subscription Tiers
```http
GET /api/subscriptions/compare?current_tier=medchat_basic&target_tier=medchat_advance
```

**Response**:
```json
{
  "success": true,
  "current_tier": { ... },
  "target_tier": { ... },
  "price_difference": 2000,
  "is_upgrade": true,
  "feature_differences": {
    "video_consultation": {
      "current": false,
      "target": true,
      "changed": true
    }
  },
  "limit_differences": {
    "max_consultations_per_month": {
      "current": 5,
      "target": 20,
      "changed": true
    }
  }
}
```

#### 4. Update User Subscription
```http
PUT /api/subscriptions/tenant/:tenantId
Headers: Authorization, X-Tenant-ID, X-App-ID, X-API-Key
Body: {
  "tier_id": "medchat_advance",
  "billing_cycle": "monthly"
}
```

## Flutter Implementation

### 1. Create Subscription Models

```dart
// lib/features/subscription/data/models/subscription_tier.dart
class SubscriptionTier {
  final String id;
  final String name;
  final double price;
  final String currency;
  final MedChatFeatures features;
  final MedChatLimits limits;

  SubscriptionTier({
    required this.id,
    required this.name,
    required this.price,
    required this.currency,
    required this.features,
    required this.limits,
  });

  factory SubscriptionTier.fromJson(Map<String, dynamic> json) {
    return SubscriptionTier(
      id: json['id'],
      name: json['name'],
      price: (json['price'] as num).toDouble(),
      currency: json['currency'],
      features: MedChatFeatures.fromJson(json['features']),
      limits: MedChatLimits.fromJson(json['limits']),
    );
  }
}

class MedChatFeatures {
  final bool chatSupport;
  final bool appointmentBooking;
  final bool prescriptionAccess;
  final bool medicalRecordsView;
  final bool videoConsultation;
  final bool prioritySupport;
  final bool healthTracking;
  final bool familyAccounts;

  MedChatFeatures({
    required this.chatSupport,
    required this.appointmentBooking,
    required this.prescriptionAccess,
    required this.medicalRecordsView,
    required this.videoConsultation,
    required this.prioritySupport,
    required this.healthTracking,
    required this.familyAccounts,
  });

  factory MedChatFeatures.fromJson(Map<String, dynamic> json) {
    return MedChatFeatures(
      chatSupport: json['chat_support'] ?? false,
      appointmentBooking: json['appointment_booking'] ?? false,
      prescriptionAccess: json['prescription_access'] ?? false,
      medicalRecordsView: json['medical_records_view'] ?? false,
      videoConsultation: json['video_consultation'] ?? false,
      prioritySupport: json['priority_support'] ?? false,
      healthTracking: json['health_tracking'] ?? false,
      familyAccounts: json['family_accounts'] ?? false,
    );
  }
}

class MedChatLimits {
  final int maxConsultationsPerMonth;
  final int maxFamilyMembers;
  final int storageGb;
  final int videoMinutesPerMonth;

  MedChatLimits({
    required this.maxConsultationsPerMonth,
    required this.maxFamilyMembers,
    required this.storageGb,
    required this.videoMinutesPerMonth,
  });

  factory MedChatLimits.fromJson(Map<String, dynamic> json) {
    return MedChatLimits(
      maxConsultationsPerMonth: json['max_consultations_per_month'] ?? 0,
      maxFamilyMembers: json['max_family_members'] ?? 1,
      storageGb: json['storage_gb'] ?? 0,
      videoMinutesPerMonth: json['video_minutes_per_month'] ?? 0,
    );
  }
  
  bool get hasUnlimitedConsultations => maxConsultationsPerMonth == -1;
  bool get hasUnlimitedVideo => videoMinutesPerMonth == -1;
}
```

### 2. Create Subscription Repository

```dart
// lib/features/subscription/data/repositories/subscription_repository.dart
import 'package:dio/dio.dart';
import '../models/subscription_tier.dart';

class SubscriptionRepository {
  final Dio _dio;

  SubscriptionRepository(this._dio);

  Future<List<SubscriptionTier>> getMedChatTiers() async {
    try {
      final response = await _dio.get(
        '/api/subscriptions/tiers',
        queryParameters: {'application_id': 'medchat-mobile'},
      );

      if (response.data['success'] == true) {
        final List<dynamic> tiersJson = response.data['tiers'];
        return tiersJson.map((json) => SubscriptionTier.fromJson(json)).toList();
      }

      throw Exception('Failed to fetch subscription tiers');
    } catch (e) {
      throw Exception('Error fetching tiers: $e');
    }
  }

  Future<Map<String, dynamic>> getCurrentSubscription() async {
    try {
      final response = await _dio.get('/api/subscriptions/current');
      return response.data;
    } catch (e) {
      throw Exception('Error fetching current subscription: $e');
    }
  }

  Future<Map<String, dynamic>> compareTiers(String currentTier, String targetTier) async {
    try {
      final response = await _dio.get(
        '/api/subscriptions/compare',
        queryParameters: {
          'current_tier': currentTier,
          'target_tier': targetTier,
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('Error comparing tiers: $e');
    }
  }

  Future<void> updateSubscription(String tierId) async {
    try {
      final tenantId = await _getTenantId(); // Get from secure storage
      await _dio.put(
        '/api/subscriptions/tenant/$tenantId',
        data: {
          'tier_id': tierId,
          'billing_cycle': 'monthly',
        },
      );
    } catch (e) {
      throw Exception('Error updating subscription: $e');
    }
  }

  Future<String> _getTenantId() async {
    // Get from secure storage
    return 'tenant_id_from_storage';
  }
}
```

### 3. Create Subscription UI Screen

```dart
// lib/screens/subscription/subscription_plans_screen.dart
import 'package:flutter/material.dart';

class SubscriptionPlansScreen extends StatefulWidget {
  @override
  _SubscriptionPlansScreenState createState() => _SubscriptionPlansScreenState();
}

class _SubscriptionPlansScreenState extends State<SubscriptionPlansScreen> {
  List<SubscriptionTier> _tiers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadTiers();
  }

  Future<void> _loadTiers() async {
    try {
      final repository = SubscriptionRepository(ApiClient.dio);
      final tiers = await repository.getMedChatTiers();
      setState(() {
        _tiers = tiers;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load plans: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Choose Your Plan')),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: EdgeInsets.all(16),
              itemCount: _tiers.length,
              itemBuilder: (context, index) {
                final tier = _tiers[index];
                return _buildPlanCard(tier);
              },
            ),
    );
  }

  Widget _buildPlanCard(SubscriptionTier tier) {
    return Card(
      margin: EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              tier.name,
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text(
              '₹${tier.price.toStringAsFixed(0)}/month',
              style: TextStyle(fontSize: 20, color: Colors.green),
            ),
            SizedBox(height: 16),
            _buildFeatureList(tier.features),
            SizedBox(height: 16),
            _buildLimitsList(tier.limits),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _selectPlan(tier),
              child: Text('Select Plan'),
              style: ElevatedButton.styleFrom(
                minimumSize: Size(double.infinity, 48),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureList(MedChatFeatures features) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildFeature('Chat Support', features.chatSupport),
        _buildFeature('Appointment Booking', features.appointmentBooking),
        _buildFeature('Prescription Access', features.prescriptionAccess),
        _buildFeature('Medical Records', features.medicalRecordsView),
        _buildFeature('Video Consultation', features.videoConsultation),
        _buildFeature('Priority Support', features.prioritySupport),
        _buildFeature('Health Tracking', features.healthTracking),
        _buildFeature('Family Accounts', features.familyAccounts),
      ],
    );
  }

  Widget _buildFeature(String label, bool enabled) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(
            enabled ? Icons.check_circle : Icons.cancel,
            color: enabled ? Colors.green : Colors.grey,
            size: 20,
          ),
          SizedBox(width: 8),
          Text(label),
        ],
      ),
    );
  }

  Widget _buildLimitsList(MedChatLimits limits) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Limits:', style: TextStyle(fontWeight: FontWeight.bold)),
        SizedBox(height: 8),
        Text('• ${limits.hasUnlimitedConsultations ? "Unlimited" : limits.maxConsultationsPerMonth} consultations/month'),
        Text('• ${limits.maxFamilyMembers} family member(s)'),
        Text('• ${limits.storageGb} GB storage'),
        if (limits.videoMinutesPerMonth > 0)
          Text('• ${limits.hasUnlimitedVideo ? "Unlimited" : limits.videoMinutesPerMonth} video minutes/month'),
      ],
    );
  }

  Future<void> _selectPlan(SubscriptionTier tier) async {
    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Confirm Subscription'),
        content: Text('Subscribe to ${tier.name} for ₹${tier.price}/month?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Confirm'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      // Proceed to payment
      _initiatePayment(tier);
    }
  }

  Future<void> _initiatePayment(SubscriptionTier tier) async {
    // TODO: Integrate Razorpay payment gateway
    // For now, just update subscription
    try {
      final repository = SubscriptionRepository(ApiClient.dio);
      await repository.updateSubscription(tier.id);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Subscription updated successfully!')),
      );
      
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update subscription: $e')),
      );
    }
  }
}
```

## Payment Integration (Razorpay)

### 1. Add Razorpay Dependency
```yaml
# pubspec.yaml
dependencies:
  razorpay_flutter: ^1.3.5
```

### 2. Implement Payment Flow
```dart
// lib/features/subscription/services/payment_service.dart
import 'package:razorpay_flutter/razorpay_flutter.dart';

class PaymentService {
  late Razorpay _razorpay;

  void initialize() {
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  Future<void> startPayment({
    required String orderId,
    required double amount,
    required String tierName,
  }) async {
    var options = {
      'key': 'YOUR_RAZORPAY_KEY',
      'amount': (amount * 100).toInt(), // Amount in paise
      'name': 'MedChat',
      'order_id': orderId,
      'description': '$tierName Subscription',
      'prefill': {
        'contact': '9999999999',
        'email': 'user@example.com'
      }
    };

    try {
      _razorpay.open(options);
    } catch (e) {
      print('Error: $e');
    }
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    // Verify payment on backend
    print('Payment Success: ${response.paymentId}');
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    print('Payment Error: ${response.message}');
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    print('External Wallet: ${response.walletName}');
  }

  void dispose() {
    _razorpay.clear();
  }
}
```

## Testing

### 1. Test Tier Retrieval
```bash
curl -X GET "http://localhost:3000/api/subscriptions/tiers?application_id=medchat-mobile" \
  -H "X-App-ID: medchat-mobile" \
  -H "X-API-Key: medchat-dev-key-789"
```

### 2. Test Subscription Update
```bash
curl -X PUT "http://localhost:3000/api/subscriptions/tenant/medchat_tenant_001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: medchat_tenant_001" \
  -H "X-App-ID: medchat-mobile" \
  -H "X-API-Key: medchat-dev-key-789" \
  -H "Content-Type: application/json" \
  -d '{"tier_id": "medchat_advance", "billing_cycle": "monthly"}'
```

## Next Steps

1. ✅ Database schema updated with application_id
2. ✅ MedChat tiers created
3. ✅ API endpoints support application filtering
4. 📋 Implement Flutter subscription UI
5. 📋 Integrate Razorpay payment gateway
6. 📋 Add subscription status to user profile
7. 📋 Implement feature access checks in mobile app
8. 📋 Add usage tracking for consultations and video minutes
9. 📋 Create subscription management screen
10. 📋 Add upgrade/downgrade flows

## Support

For questions or issues, refer to:
- Backend API: `backend/src/routes/subscriptions.ts`
- Subscription Service: `backend/src/services/subscription.ts`
- Database Setup: `backend/scripts/setup-medchat-subscriptions.js`
