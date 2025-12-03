# Flutter Web Cache Fix - Subscription Screen

## Problem
The subscription screen shows old data even after code updates because Flutter Web caches compiled JavaScript files in the browser.

## Solution for Flutter Web

### Method 1: Hard Refresh in Browser (Fastest)
1. Open the Flutter web app in Chrome
2. Press **Ctrl + Shift + R** (Windows/Linux) or **Cmd + Shift + R** (Mac)
3. This forces a hard reload, bypassing cache

### Method 2: Clear Browser Cache
1. Open Chrome DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Method 3: Disable Cache in DevTools
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Keep DevTools open and refresh the page

### Method 4: Clear Service Worker (Most Thorough)
1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Click "Service Workers" in left sidebar
4. Click "Unregister" for your app
5. Click "Clear storage" 
6. Refresh the page

### Method 5: Rebuild Flutter Web App
```powershell
cd hms-app

# Stop the current Flutter process (Ctrl+C)

# Clean build
flutter clean

# Run with --web-renderer html for better compatibility
flutter run -d chrome --web-renderer html

# Or force rebuild
flutter run -d chrome --no-cache-dir
```

### Method 6: Incognito/Private Window
1. Open Chrome in Incognito mode (Ctrl + Shift + N)
2. Navigate to your Flutter app URL
3. This bypasses all cache

## Quick Commands

```powershell
# Navigate to app
cd hms-app

# Clean everything
flutter clean

# Run on Chrome with no cache
flutter run -d chrome --web-renderer html
```

## Verification Steps

After clearing cache, verify you see:

### ✅ Correct Plan Names
- Basic (not "Plus")
- Advance (not "Plus")  
- Premium

### ✅ Correct Pricing
- Basic: Free
- Advance: ₹2,999/mo
- Premium: ₹9,999/mo

### ✅ Correct Features
- Basic: "Chat support with healthcare professionals"
- Advance: "Video consultation (300 min/month)"
- Premium: "Unlimited consultations"

## Why This Happens

Flutter Web compiles Dart to JavaScript and browsers aggressively cache these files for performance. When you update the code:

1. **Dart code changes** ✅
2. **JavaScript is recompiled** ✅
3. **Browser still uses old cached JS** ❌

The browser needs to be told to fetch the new JavaScript files.

## Prevention

To avoid this in development:

### Option 1: Always Use DevTools with Cache Disabled
1. Open DevTools (F12)
2. Network tab → Check "Disable cache"
3. Keep DevTools open while developing

### Option 2: Use Hot Reload
- Press `r` in the terminal where Flutter is running
- This reloads without full rebuild

### Option 3: Use Flutter DevTools
```powershell
flutter pub global activate devtools
flutter pub global run devtools
```

## Still Not Working?

If you still see old data after all these steps:

### 1. Check if file was actually saved
```powershell
# Search for the new pricing in the file
Select-String -Path "hms-app/lib/screens/subscription_screen.dart" -Pattern "advanceMonthly = 2999"
```

Should show:
```
19:  static const double _advanceMonthly = 2999.0;
```

### 2. Check if Flutter is watching the file
Look for this in Flutter terminal:
```
Performing hot reload...
Reloaded 1 of 1234 libraries in 123ms.
```

### 3. Force complete rebuild
```powershell
cd hms-app

# Remove ALL build artifacts
Remove-Item -Recurse -Force build
Remove-Item -Recurse -Force .dart_tool
Remove-Item -Force .flutter-plugins
Remove-Item -Force .flutter-plugins-dependencies

# Clean
flutter clean

# Get dependencies
flutter pub get

# Run
flutter run -d chrome
```

### 4. Check Chrome's Application Storage
1. F12 → Application tab
2. Clear storage:
   - Local Storage
   - Session Storage
   - IndexedDB
   - Cache Storage
   - Service Workers
3. Click "Clear site data"
4. Refresh

## Expected Result

After clearing cache and reloading, clicking "Upgrade Plan" should show:

```
┌─────────────────────────────────────┐
│ Choose a plan that's right for you │
│ Upgrade to unlock video            │
│ consultations, family accounts...   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Basic                               │
│ Free                                │
│ ✓ Chat support with healthcare...  │
│ ✓ Appointment booking               │
│ ✓ Prescription access...            │
│ ✓ Medical records view              │
│ ✓ 5 consultations per month         │
│ ✓ 1 GB storage                      │
│ [Select Basic]                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Advance                             │
│ ₹2999/mo                            │
│ ✓ All Basic features                │
│ ✓ Video consultation (300 min...)  │
│ ✓ Priority support                  │
│ ✓ Health tracking...                │
│ ✓ Family accounts (up to 4...)     │
│ ✓ 20 consultations per month        │
│ ✓ 5 GB storage                      │
│ [Select Advance]                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Premium                             │
│ ₹9999/mo                            │
│ ✓ All Advance features              │
│ ✓ Unlimited consultations           │
│ ✓ Unlimited video minutes           │
│ ✓ Extended family accounts...       │
│ ✓ 20 GB storage                     │
│ ✓ Premium priority support          │
│ [Select Premium]                    │
└─────────────────────────────────────┘
```

---

**Quick Fix for Web**: Press **Ctrl + Shift + R** in Chrome to hard reload!
