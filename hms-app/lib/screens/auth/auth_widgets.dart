import 'package:flutter/material.dart';
import 'dart:io' show Platform;
import '../../theme/theme_provider.dart';

/// Debug flag to enable prefilled test credentials and demo flows.
/// Set to false before production release.
/// ignore: constant_identifier_names
const bool kEnableDebugMocks = true;

// App primary color used across auth screens - using theme provider colors
const Color kTealColor = AppColors.tealPrimary;
const Color kTealLight = AppColors.tealLight;
const Color kErrorColor = AppColors.redAccent;
const Color kBackgroundColor = AppColors.lightBackground;

/// ============================================================
/// AUTH HEADER WIDGET
/// Displays app logo and title/subtitle for auth screens.
/// ============================================================
class AuthHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const AuthHeader({
    super.key,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Column(
      children: [
        // App logo - matches main.dart style
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: kTealColor,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Center(
            child: Text(
              'M',
              style: TextStyle(
                color: Colors.white,
                fontSize: 44,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        // Title
        Text(
          title,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        // Subtitle
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 14,
            color: isDark ? Colors.white70 : Colors.black54,
            height: 1.4,
          ),
        ),
      ],
    );
  }
}


/// ============================================================
/// AUTH TEXT FIELD WIDGET
/// Reusable text field with validation, show/hide toggle for passwords.
/// Meets accessibility requirements: tap targets ≥44px, semantic labels.
/// ============================================================
class AuthTextField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final bool isPassword;
  final bool isEmail;
  final bool isPhone;
  final String? errorText;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final TextInputAction? textInputAction;
  final FocusNode? focusNode;
  final bool enabled;

  const AuthTextField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.isPassword = false,
    this.isEmail = false,
    this.isPhone = false,
    this.errorText,
    this.validator,
    this.onChanged,
    this.textInputAction,
    this.focusNode,
    this.enabled = true,
  });

  @override
  State<AuthTextField> createState() => _AuthTextFieldState();
}

class _AuthTextFieldState extends State<AuthTextField> {
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Semantics(
      label: widget.label,
      textField: true,
      child: TextFormField(
        controller: widget.controller,
        focusNode: widget.focusNode,
        enabled: widget.enabled,
        obscureText: widget.isPassword && _obscureText,
        keyboardType: widget.isEmail
            ? TextInputType.emailAddress
            : widget.isPhone
                ? TextInputType.phone
                : TextInputType.text,
        textInputAction: widget.textInputAction ?? TextInputAction.next,
        onChanged: widget.onChanged,
        validator: widget.validator,
        style: TextStyle(
          fontSize: 16,
          color: isDark ? Colors.white : Colors.black87,
        ),
        decoration: InputDecoration(
          labelText: widget.label,
          hintText: widget.hint,
          errorText: widget.errorText,
          filled: true,
          fillColor: isDark ? Colors.grey[800] : Colors.white,
          // Ensure minimum tap target of 44px
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 16,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: isDark ? Colors.grey[600]! : const Color(0xFFE0E0E0),
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: isDark ? Colors.grey[600]! : const Color(0xFFE0E0E0),
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: kTealColor, width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: kErrorColor),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: kErrorColor, width: 2),
          ),
          suffixIcon: widget.isPassword
              ? Semantics(
                  label: _obscureText ? 'Show password' : 'Hide password',
                  button: true,
                  child: IconButton(
                    icon: Icon(
                      _obscureText ? Icons.visibility_off : Icons.visibility,
                      color: Colors.black54,
                    ),
                    onPressed: () => setState(() => _obscureText = !_obscureText),
                    // Ensure minimum tap target
                    constraints: const BoxConstraints(
                      minWidth: 44,
                      minHeight: 44,
                    ),
                  ),
                )
              : null,
        ),
      ),
    );
  }
}

/// ============================================================
/// SOCIAL BUTTON WIDGET
/// Social sign-in buttons (Google, Apple) with proper styling.
/// ============================================================
class SocialButton extends StatelessWidget {
  final String label;
  final String provider; // 'google' or 'apple'
  final VoidCallback onPressed;
  final bool isLoading;

  const SocialButton({
    super.key,
    required this.label,
    required this.provider,
    required this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isApple = provider == 'apple';
    
    return Semantics(
      label: label,
      button: true,
      child: SizedBox(
        width: double.infinity,
        height: 52, // Meets 44px minimum tap target
        child: OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            backgroundColor: isApple
                ? (isDark ? Colors.white : Colors.black)
                : (isDark ? Colors.grey[800] : Colors.white),
            foregroundColor: isApple
                ? (isDark ? Colors.black : Colors.white)
                : (isDark ? Colors.white : Colors.black87),
            side: BorderSide(
              color: isDark ? Colors.grey[600]! : const Color(0xFFE0E0E0),
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      isApple ? Icons.apple : Icons.g_mobiledata,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      label,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  /// Helper to check if Apple sign-in should be shown (iOS only)
  static bool shouldShowApple() {
    try {
      return Platform.isIOS;
    } catch (_) {
      // Platform not available (web), show both
      return true;
    }
  }
}


/// ============================================================
/// PASSWORD STRENGTH METER WIDGET
/// Visual indicator of password strength with accessibility support.
/// ============================================================
class PasswordStrengthMeter extends StatelessWidget {
  final String password;

  const PasswordStrengthMeter({super.key, required this.password});

  @override
  Widget build(BuildContext context) {
    final strength = _calculateStrength(password);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Semantics(
      label: 'Password strength: ${strength.label}. ${_getAccessibilityHints(password)}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Strength bar
          Row(
            children: List.generate(4, (index) {
              final isActive = index < strength.level;
              return Expanded(
                child: Container(
                  height: 4,
                  margin: EdgeInsets.only(right: index < 3 ? 4 : 0),
                  decoration: BoxDecoration(
                    color: isActive
                        ? strength.color
                        : (isDark ? Colors.grey[700] : Colors.grey[300]),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 8),
          // Strength label and suggestions
          Row(
            children: [
              Text(
                strength.label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: strength.color,
                ),
              ),
              const Spacer(),
              if (password.isNotEmpty)
                Text(
                  _getSuggestion(password),
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? Colors.white54 : Colors.black54,
                  ),
                ),
            ],
          ),
          // Requirements checklist
          if (password.isNotEmpty) ...[
            const SizedBox(height: 12),
            _buildRequirement('At least 8 characters', password.length >= 8),
            _buildRequirement('Contains uppercase letter', password.contains(RegExp(r'[A-Z]'))),
            _buildRequirement('Contains number', password.contains(RegExp(r'[0-9]'))),
            _buildRequirement('Contains special character', password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))),
          ],
        ],
      ),
    );
  }

  Widget _buildRequirement(String text, bool met) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(
            met ? Icons.check_circle : Icons.circle_outlined,
            size: 16,
            color: met ? kTealColor : Colors.grey,
          ),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: met ? kTealColor : Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  _PasswordStrength _calculateStrength(String password) {
    if (password.isEmpty) return _PasswordStrength(0, 'Enter password', Colors.grey);
    
    int score = 0;
    if (password.length >= 8) score++;
    if (password.contains(RegExp(r'[A-Z]'))) score++;
    if (password.contains(RegExp(r'[0-9]'))) score++;
    if (password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) score++;
    
    switch (score) {
      case 0:
      case 1:
        return _PasswordStrength(1, 'Weak', kErrorColor);
      case 2:
        return _PasswordStrength(2, 'Fair', Colors.orange);
      case 3:
        return _PasswordStrength(3, 'Good', Colors.amber[700]!);
      default:
        return _PasswordStrength(4, 'Strong', kTealColor);
    }
  }

  String _getSuggestion(String password) {
    if (password.length < 8) return 'Add more characters';
    if (!password.contains(RegExp(r'[A-Z]'))) return 'Add uppercase';
    if (!password.contains(RegExp(r'[0-9]'))) return 'Add a number';
    if (!password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) return 'Add special char';
    return 'Great password!';
  }

  String _getAccessibilityHints(String password) {
    final hints = <String>[];
    if (password.length < 8) hints.add('needs at least 8 characters');
    if (!password.contains(RegExp(r'[A-Z]'))) hints.add('needs uppercase letter');
    if (!password.contains(RegExp(r'[0-9]'))) hints.add('needs a number');
    if (!password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) hints.add('needs special character');
    return hints.isEmpty ? 'All requirements met' : hints.join(', ');
  }
}

class _PasswordStrength {
  final int level;
  final String label;
  final Color color;
  
  _PasswordStrength(this.level, this.label, this.color);
}

/// ============================================================
/// AUTH FOOTER LINKS WIDGET
/// Footer navigation links for auth screens.
/// ============================================================
class AuthFooterLinks extends StatelessWidget {
  final String text;
  final String linkText;
  final VoidCallback onLinkTap;

  const AuthFooterLinks({
    super.key,
    required this.text,
    required this.linkText,
    required this.onLinkTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          text,
          style: TextStyle(
            fontSize: 14,
            color: isDark ? Colors.white70 : Colors.black54,
          ),
        ),
        Semantics(
          label: linkText,
          button: true,
          child: TextButton(
            onPressed: onLinkTap,
            style: TextButton.styleFrom(
              minimumSize: const Size(44, 44), // Accessibility tap target
              padding: const EdgeInsets.symmetric(horizontal: 8),
            ),
            child: Text(
              linkText,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: kTealColor,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// ============================================================
/// AUTH CARD WIDGET
/// Rounded card container for auth forms.
/// ============================================================
class AuthCard extends StatelessWidget {
  final Widget child;

  const AuthCard({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[850] : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }
}

/// ============================================================
/// PRIMARY AUTH BUTTON
/// Full-width CTA button with loading state.
/// ============================================================
class AuthPrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;

  const AuthPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      button: true,
      child: SizedBox(
        width: double.infinity,
        height: 52, // Meets 44px minimum tap target
        child: ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: kTealColor,
            foregroundColor: Colors.white,
            disabledBackgroundColor: kTealColor.withValues(alpha: 0.6),
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: isLoading
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : Text(
                  label,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
        ),
      ),
    );
  }
}

/// ============================================================
/// DEBUG OVERFLOW MENU
/// Debug menu for simulating error and slow network states.
/// ============================================================
class AuthDebugMenu extends StatelessWidget {
  final bool simulateError;
  final bool simulateSlowNetwork;
  final ValueChanged<bool> onSimulateErrorChanged;
  final ValueChanged<bool> onSimulateSlowNetworkChanged;

  const AuthDebugMenu({
    super.key,
    required this.simulateError,
    required this.simulateSlowNetwork,
    required this.onSimulateErrorChanged,
    required this.onSimulateSlowNetworkChanged,
  });

  @override
  Widget build(BuildContext context) {
    if (!kEnableDebugMocks) return const SizedBox.shrink();
    
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert, color: Colors.black87),
      tooltip: 'Debug options',
      onSelected: (value) {
        if (value == 'error') {
          onSimulateErrorChanged(!simulateError);
        } else if (value == 'slow') {
          onSimulateSlowNetworkChanged(!simulateSlowNetwork);
        }
      },
      itemBuilder: (_) => [
        PopupMenuItem(
          value: 'error',
          child: Row(
            children: [
              Icon(
                simulateError ? Icons.check_box : Icons.check_box_outline_blank,
                size: 20,
              ),
              const SizedBox(width: 8),
              const Text('Simulate Error'),
            ],
          ),
        ),
        PopupMenuItem(
          value: 'slow',
          child: Row(
            children: [
              Icon(
                simulateSlowNetwork ? Icons.check_box : Icons.check_box_outline_blank,
                size: 20,
              ),
              const SizedBox(width: 8),
              const Text('Simulate Slow Network'),
            ],
          ),
        ),
      ],
    );
  }
}

/// ============================================================
/// HELPER FUNCTIONS
/// ============================================================

/// Email validation regex
bool isValidEmail(String email) {
  return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
}

/// Show success snackbar
void showSuccessSnackbar(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Row(
        children: [
          const Icon(Icons.check_circle, color: Colors.white, size: 20),
          const SizedBox(width: 8),
          Expanded(child: Text(message)),
        ],
      ),
      backgroundColor: kTealColor,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ),
  );
}

/// Show error dialog
void showErrorDialog(BuildContext context, String title, String message) {
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          const Icon(Icons.error_outline, color: kErrorColor),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('OK', style: TextStyle(color: kTealColor)),
        ),
      ],
    ),
  );
}

/// ============================================================
/// ROUTE INTEGRATION SNIPPET
/// Add these routes to your MaterialApp's onGenerateRoute:
/// 
/// ```dart
/// import 'screens/auth/sign_in_screen.dart';
/// import 'screens/auth/sign_up_screen.dart';
/// import 'screens/auth/forgot_password_screen.dart';
/// import 'screens/auth/reset_password_screen.dart';
/// 
/// // In MaterialApp:
/// onGenerateRoute: (settings) {
///   if (settings.name == '/sign-in') {
///     return MaterialPageRoute(builder: (_) => const SignInScreen());
///   }
///   if (settings.name == '/sign-up') {
///     return MaterialPageRoute(builder: (_) => const SignUpScreen());
///   }
///   if (settings.name == '/forgot-password') {
///     return MaterialPageRoute(builder: (_) => const ForgotPasswordScreen());
///   }
///   if (settings.name == '/reset-password') {
///     final token = settings.arguments as String? ?? 'demo-token';
///     return MaterialPageRoute(builder: (_) => ResetPasswordScreen(token: token));
///   }
///   // ... other routes
/// }
/// ```
/// ============================================================

/// ============================================================
/// i18n LOCALIZATION HOOK
/// To add internationalization, replace hardcoded strings with:
/// 
/// ```dart
/// // 1. Create an AppLocalizations class or use intl package
/// // 2. Replace strings like:
/// //    'Sign In' -> AppLocalizations.of(context).signIn
/// //    'Email' -> AppLocalizations.of(context).email
/// // 3. Add ARB files for each supported locale
/// ```
/// ============================================================
