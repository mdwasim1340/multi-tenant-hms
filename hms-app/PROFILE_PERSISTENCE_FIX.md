# Profile Data Persistence Fix

**Date**: December 3, 2025  
**Issue**: Profile changes not persisting after navigating away + Sidebar not updating  
**Status**: ✅ Fixed

## Problem

When users updated their profile information (name, phone, bio, etc.) and then navigated away from the profile screen, the changes were lost. Reopening the profile screen showed the original hardcoded data instead of the saved changes.

## Root Cause

The profile screen was using in-memory `Map` objects (`_userData`, `_medicalInfo`, `_emergencyContact`) that were initialized with hardcoded default values. When the screen was recreated (after navigation), these maps were reset to their default values.

## Solution

Added persistence using `SecureStorage`:

### 1. Added Profile Storage Methods

**File**: `hms-app/lib/core/storage/secure_storage.dart`

```dart
// New storage key
static const _profileKey = 'medchat_profile_data';

// Save profile data
static Future<void> saveProfileData(Map<String, dynamic> profileData) async {
  final jsonString = jsonEncode(profileData);
  await _storage.write(key: _profileKey, value: jsonString);
}

// Get profile data
static Future<Map<String, dynamic>?> getProfileData() async {
  final jsonString = await _storage.read(key: _profileKey);
  if (jsonString != null && jsonString.isNotEmpty) {
    try {
      return jsonDecode(jsonString) as Map<String, dynamic>;
    } catch (e) {
      await _storage.delete(key: _profileKey);
      return null;
    }
  }
  return null;
}

// Delete profile data
static Future<void> deleteProfileData() async {
  await _storage.delete(key: _profileKey);
}
```

### 2. Updated Profile Screen

**File**: `hms-app/lib/screens/profile/profile_screen.dart`

Added import:
```dart
import '../../core/storage/secure_storage.dart';
```

Added load method in `initState`:
```dart
@override
void initState() {
  super.initState();
  // ... existing code ...
  _loadProfileData(); // Load saved profile data
}

Future<void> _loadProfileData() async {
  final savedData = await SecureStorage.getProfileData();
  if (savedData != null && mounted) {
    setState(() {
      // Load user data, medical info, emergency contact
      // from saved data
    });
  }
}
```

Added save method:
```dart
Future<void> _saveProfileData() async {
  final profileData = {
    'userData': Map<String, String>.from(_userData),
    'medicalInfo': Map<String, String>.from(_medicalInfo),
    'emergencyContact': Map<String, String>.from(_emergencyContact),
  };
  await SecureStorage.saveProfileData(profileData);
}
```

Updated save button to persist data:
```dart
onPressed: () async {
  setState(() {
    _userData['name'] = nameController.text;
    // ... other fields ...
  });
  await _saveProfileData(); // Persist to storage
  Navigator.pop(context);
  _showSnackBar('Profile updated successfully');
},
```

## Data Persisted

The following data is now persisted:

### User Data
- Name
- Email
- Phone
- Date of Birth
- Gender
- Bio

### Medical Info
- Blood Group
- Allergies
- Medications
- Chronic Conditions

### Emergency Contact
- Name
- Phone
- Relation

## Testing

1. Open the app and go to Profile screen
2. Click "Edit Profile"
3. Change any field (e.g., name, phone, bio)
4. Click "Save"
5. Navigate away (go to Home or another screen)
6. Return to Profile screen
7. **Verify**: The saved changes should still be visible

## Technical Details

- **Storage**: Uses `flutter_secure_storage` for encrypted storage
- **Format**: JSON encoded Map
- **Key**: `medchat_profile_data`
- **Platform Support**: Android (EncryptedSharedPreferences), iOS (Keychain)

## Files Modified

1. `hms-app/lib/core/storage/secure_storage.dart`
   - Added `_profileKey` constant
   - Added `saveProfileData()` method
   - Added `getProfileData()` method
   - Added `deleteProfileData()` method

2. `hms-app/lib/screens/profile/profile_screen.dart`
   - Added import for SecureStorage and UserModel
   - Added `_loadProfileData()` method (loads auth user first, then profile data)
   - Added `_saveProfileData()` method
   - Updated `initState()` to load saved data
   - Updated save button to persist data

3. `hms-app/lib/sidebar_drawer.dart`
   - Updated `_loadUserData()` to also check profile data
   - Sidebar now shows updated name/email after profile changes

## Notes

- First-time users will see default/hardcoded values
- After first save, their data will persist
- Data is stored securely (encrypted)
- Data survives app restarts
- Data is cleared on logout (via `SecureStorage.clearAll()`)

## Future Improvements

1. **Backend Sync**: Sync profile data with backend API
2. **Offline Support**: Queue changes when offline, sync when online
3. **Conflict Resolution**: Handle conflicts between local and server data
4. **Profile Picture**: Add avatar upload and persistence

---

**Status**: ✅ Fixed - Profile data now persists across navigation
