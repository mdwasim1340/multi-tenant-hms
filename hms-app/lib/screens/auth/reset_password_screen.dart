import 'package:flutter/material.dart';
import 'auth_widgets.dart';
import '../../features/auth/data/repositories/auth_repository.dart';

/// ============================================================
/// RESET PASSWORD SCREEN
/// Route: /reset-password
/// 
/// Features:
/// - New password input with strength meter (connected to backend)
/// - Confirm password validation
/// - Verification code input
/// - Success modal with navigation
/// ============================================================
class ResetPasswordScreen extends StatefulWidget {
  /// Email address passed from forgot password screen
  final String token; // Actually used as email for this flow

  const ResetPasswordScreen({
    super.key,
    this.token = '',
  });

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _authRepository = AuthRepository();
  
  bool _isLoading = false;
  bool _simulateError = false;
  bool _simulateSlowNetwork = false;
  bool _tokenValid = true;
  
  String get _email => widget.token; // Email passed from forgot password

  @override
  void initState() {
    super.initState();
    // Check if email was passed
    _validateEmail();
  }

  @override
  void dispose() {
    _codeController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  /// Validate that email was passed
  Future<void> _validateEmail() async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    // Email is required for password reset
    if (_email.isEmpty || !_email.contains('@')) {
      setState(() => _tokenValid = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? Colors.grey[900] : kBackgroundColor,
      appBar: AppBar(
        backgroundColor: isDark ? Colors.grey[850] : Colors.white,
        elevation: 1,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: isDark ? Colors.white : Colors.black87),
          onPressed: () => Navigator.pop(context),
          tooltip: 'Go back',
        ),
        title: Text(
          'Reset Password',
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          AuthDebugMenu(
            simulateError: _simulateError,
            simulateSlowNetwork: _simulateSlowNetwork,
            onSimulateErrorChanged: (v) => setState(() => _simulateError = v),
            onSimulateSlowNetworkChanged: (v) => setState(() => _simulateSlowNetwork = v),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: _tokenValid || _simulateError
              ? _buildResetForm(isDark)
              : _buildInvalidTokenView(isDark),
        ),
      ),
    );
  }

  /// Build the password reset form
  Widget _buildResetForm(bool isDark) {
    return Column(
      children: [
        // Header
        const AuthHeader(
          title: 'Reset Password',
          subtitle: 'Enter the verification code and create a new password',
        ),
        const SizedBox(height: 32),
        
        // Form card
        AuthCard(
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Email display
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.grey[800] : Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.email_outlined,
                        size: 16,
                        color: isDark ? Colors.white54 : Colors.black45,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Resetting password for: $_email',
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark ? Colors.white54 : Colors.black54,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                
                // Verification code field
                AuthTextField(
                  controller: _codeController,
                  label: 'Verification Code',
                  hint: 'Enter 6-digit code from email',
                  enabled: !_isLoading,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter the verification code';
                    }
                    if (value.length != 6) {
                      return 'Code must be 6 digits';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // New password field
                AuthTextField(
                  controller: _passwordController,
                  label: 'New Password',
                  hint: 'Enter your new password',
                  isPassword: true,
                  enabled: !_isLoading,
                  onChanged: (_) => setState(() {}),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a new password';
                    }
                    if (value.length < 8) {
                      return 'Password must be at least 8 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 8),
                
                // Password strength meter
                PasswordStrengthMeter(password: _passwordController.text),
                const SizedBox(height: 16),
                
                // Confirm password field
                AuthTextField(
                  controller: _confirmPasswordController,
                  label: 'Confirm New Password',
                  hint: 'Re-enter your new password',
                  isPassword: true,
                  enabled: !_isLoading,
                  textInputAction: TextInputAction.done,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please confirm your new password';
                    }
                    if (value != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                
                // Password requirements info
                _buildPasswordRequirements(isDark),
                const SizedBox(height: 24),
                
                // Reset password button
                AuthPrimaryButton(
                  label: 'Reset Password',
                  isLoading: _isLoading,
                  onPressed: _handleResetPassword,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        
        // Back to sign in link
        AuthFooterLinks(
          text: 'Remember your password?',
          linkText: 'Sign In',
          onLinkTap: () => Navigator.pushReplacementNamed(context, '/sign-in'),
        ),
      ],
    );
  }

  /// Build password requirements checklist
  Widget _buildPasswordRequirements(bool isDark) {
    final password = _passwordController.text;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[800] : Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? Colors.grey[700]! : Colors.grey[200]!,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Password Requirements',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white70 : Colors.black54,
            ),
          ),
          const SizedBox(height: 12),
          _buildRequirementRow('At least 8 characters', password.length >= 8),
          _buildRequirementRow('Contains uppercase letter', password.contains(RegExp(r'[A-Z]'))),
          _buildRequirementRow('Contains lowercase letter', password.contains(RegExp(r'[a-z]'))),
          _buildRequirementRow('Contains a number', password.contains(RegExp(r'[0-9]'))),
          _buildRequirementRow('Contains special character', password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))),
        ],
      ),
    );
  }

  Widget _buildRequirementRow(String text, bool met) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 20,
            height: 20,
            decoration: BoxDecoration(
              color: met ? kTealColor : Colors.transparent,
              border: Border.all(
                color: met ? kTealColor : Colors.grey,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: met
                ? const Icon(Icons.check, size: 14, color: Colors.white)
                : null,
          ),
          const SizedBox(width: 10),
          Text(
            text,
            style: TextStyle(
              fontSize: 13,
              color: met ? kTealColor : Colors.grey,
              fontWeight: met ? FontWeight.w500 : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  /// Build invalid token view
  Widget _buildInvalidTokenView(bool isDark) {
    return Column(
      children: [
        const SizedBox(height: 60),
        // Error icon
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: kErrorColor.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.error_outline,
            size: 40,
            color: kErrorColor,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Invalid or Expired Link',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.black87,
          ),
        ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Text(
            'This password reset link is invalid or has expired. Please request a new one.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: isDark ? Colors.white54 : Colors.black54,
              height: 1.5,
            ),
          ),
        ),
        const SizedBox(height: 32),
        // Request new link button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: AuthPrimaryButton(
            label: 'Request New Reset Link',
            onPressed: () => Navigator.pushReplacementNamed(context, '/forgot-password'),
          ),
        ),
        const SizedBox(height: 16),
        // Back to sign in
        TextButton(
          onPressed: () => Navigator.pushReplacementNamed(context, '/sign-in'),
          style: TextButton.styleFrom(
            minimumSize: const Size(44, 44),
          ),
          child: const Text(
            'Back to Sign In',
            style: TextStyle(color: kTealColor),
          ),
        ),
      ],
    );
  }


  /// Handle password reset submission
  Future<void> _handleResetPassword() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    // Debug: simulate slow network if enabled
    if (_simulateSlowNetwork) {
      await Future.delayed(const Duration(seconds: 2));
    }
    
    // Debug: simulate error if enabled
    if (_simulateError) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _tokenValid = false;
      });
      return;
    }
    
    try {
      // Call real backend API
      await _authRepository.resetPassword(
        email: _email,
        code: _codeController.text.trim(),
        newPassword: _passwordController.text,
      );
      
      if (!mounted) return;
      
      setState(() => _isLoading = false);
      
      // Show success modal
      _showSuccessModal();
      
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      
      // Check if it's an invalid code error
      if (e.message.toLowerCase().contains('invalid') || 
          e.message.toLowerCase().contains('expired')) {
        showErrorDialog(
          context,
          'Invalid Code',
          'The verification code is invalid or has expired. Please request a new one.',
        );
      } else {
        showErrorDialog(context, 'Reset Failed', e.message);
      }
      
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      showErrorDialog(
        context,
        'Error',
        'An unexpected error occurred. Please try again.',
      );
    }
  }

  /// Show password reset success modal
  void _showSuccessModal() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: kTealColor,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check, color: Colors.white, size: 36),
            ),
            const SizedBox(height: 20),
            const Text(
              'Password Reset Successful!',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'Your password has been reset successfully. You can now sign in with your new password.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.black54, height: 1.4),
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                // Navigate to sign in and clear navigation stack
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/sign-in',
                  (route) => route.isFirst,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: kTealColor,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Sign In'),
            ),
          ),
        ],
      ),
    );
  }
}
