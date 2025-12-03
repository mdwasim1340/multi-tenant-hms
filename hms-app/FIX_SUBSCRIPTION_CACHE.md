# Fix Subscription Screen Cache Issue

## Problem
The subscription screen shows old data (Plus/Premium) instead of the new MedChat pricing (Basic/Advance/Premium) even though the code has been updated.

## Cause
Flutter is using cached/compiled code from the previous version. The app needs to be rebuilt with the new code.

## Solution

### Option 1: Hot Restart (Fastest - 5 seconds)
If the app is already running:

1. In your IDE/terminal, press `R` (capital R) for hot restart
2. Or run: `flutter run` and press `R` when prompted

### Option 2: Full Rebuild (Recommended - 30 seconds)
```bash
cd hms-app

# Stop the current app (Ctrl+C if running)

# Clean build cache
flutter clean

# Get dependencies
flutter pub get

# Run the app
flutter run
```

### Option 3: Specific Platform Rebuild
```bash
cd hms-app

# For Android
flutter clean
flutter run -d android

# For iOS
flutter clean
flutter run -d ios

# For Web
flutter clean
flutter run -d chrome
```

### Option 4: Force Rebuild Without Cache
```bash
cd hms-app
flutter run --no-cache-dir
```

## Verification

After rebuilding, you should see:

### ✅ Correct Pricing
- **Basic**: Free
- **Advance**: ₹2,999/mo (or ₹28,800/yr with 20% discount)
- **Premium**: ₹9,999/mo (or ₹95,904/yr with 20% discount)

### ✅ Correct Features

**Basic (Free)**:
- Chat support with healthcare professionals
- Appointment booking
- Prescription access and management
- Medical records view
- 5 consultations per month
- 1 GB storage

**Advance (₹2,999/mo)**:
- All Basic features
- Video consultation (300 min/month)
- Priority support
- Health tracking (vitals, medications)
- Family accounts (up to 4 members)
- 20 consultations per month
- 5 GB storage

**Premium (₹9,999/mo)**:
- All Advance features
- Unlimited consultations
- Unlimited video minutes
- Extended family accounts (up to 10 members)
- 20 GB storage
- Premium priority support

### ✅ Correct Comparison Table
Should show 6 rows:
1. Chat support: ✓, ✓, ✓
2. Video consultation: —, ✓, ✓
3. Consultations/month: 5, 20, Unlimited
4. Family members: 1, 4, 10
5. Storage: 1 GB, 5 GB, 20 GB

## Still Not Working?

If you still see old data after rebuilding:

### 1. Check File Content
```bash
# Verify the file has the correct data
grep -n "advanceMonthly = 2999" hms-app/lib/screens/subscription_screen.dart
grep -n "Chat support with healthcare" hms-app/lib/screens/subscription_screen.dart
```

Expected output:
```
19:  static const double _advanceMonthly = 2999.0;
209:            'Chat support with healthcare professionals',
```

### 2. Check for Multiple Files
```bash
# Make sure there's only one subscription screen
find hms-app -name "*subscription*screen*.dart"
```

Should only show:
```
hms-app/lib/screens/subscription_screen.dart
```

### 3. Clear All Caches
```bash
cd hms-app

# Remove all build artifacts
rm -rf build/
rm -rf .dart_tool/
rm -rf .flutter-plugins
rm -rf .flutter-plugins-dependencies

# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

### 4. Restart IDE
Sometimes the IDE caches files:
- Close your IDE completely
- Reopen the project
- Run `flutter clean`
- Run `flutter run`

## Quick Test Commands

```bash
# Navigate to app directory
cd hms-app

# Clean everything
flutter clean

# Get dependencies
flutter pub get

# Run on connected device
flutter run

# Or run on specific device
flutter devices  # List available devices
flutter run -d <device-id>
```

## Expected Behavior After Fix

1. Click "Upgrade Plan" button in sidebar
2. See subscription screen with:
   - Hero section mentioning "video consultations, family accounts"
   - Trial banner for "Advance" plan (not "Plus")
   - Three cards: Basic (Free), Advance (₹2,999), Premium (₹9,999)
   - Comparison table with 6 feature rows
   - All prices in Indian Rupees (₹)

## Troubleshooting

### Issue: Still shows "Plus" and "Premium"
**Solution**: The old code is still cached. Run `flutter clean` and rebuild.

### Issue: Shows dollar signs ($) instead of rupees (₹)
**Solution**: The old code is still cached. Run `flutter clean` and rebuild.

### Issue: Shows wrong features
**Solution**: The old code is still cached. Run `flutter clean` and rebuild.

### Issue: App crashes after update
**Solution**: 
```bash
flutter clean
flutter pub get
flutter run
```

## Success Indicators

✅ You'll know it's working when you see:
- "Basic", "Advance", "Premium" (not "Plus")
- ₹ symbol (not $)
- "Chat support with healthcare professionals" as first Basic feature
- "Video consultation (300 min/month)" in Advance features
- "Unlimited consultations" in Premium features
- Comparison table shows "Consultations/month: 5, 20, Unlimited"

---

**Quick Fix**: `cd hms-app && flutter clean && flutter run`
