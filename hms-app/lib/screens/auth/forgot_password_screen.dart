import 'package:flutter/material.dart';
import 'auth_widgets.dart';
import '../../features/auth/data/repositories/auth_repository.dart';

/// ============================================================
/// FORGOT PASSWORD SCREEN
/// Route: /forgot-password
/// 
/// Features:
/// - Email input for password reset (connected to backend)
/// - ReCAPTCHA UI stub
/// - Resend countdown timer
/// - Debug menu for testing states
/// ============================================================
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _authRepository = AuthRepository();
  
  bool _isLoading = false;
  bool _simulateError = false;
  bool _simulateSlowNetwork = false;
  bool _emailSent = false;
  int _resendCountdown = 0;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
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
          'Forgot Password',
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
          child: Column(
            children: [
              // Header
              const AuthHeader(
                title: 'Forgot password?',
                subtitle: "Enter your email and we'll send instructions to reset your password",
              ),
              const SizedBox(height: 32),
              
              // Form card
              AuthCard(
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Email field
                      AuthTextField(
                        controller: _emailController,
                        label: 'Email',
                        hint: 'Enter your registered email',
                        isEmail: true,
                        enabled: !_isLoading,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your email';
                          }
                          if (!isValidEmail(value)) {
                            return 'Please enter a valid email address';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 20),
                      
                      // ReCAPTCHA UI stub
                      _buildRecaptchaStub(isDark),
                      const SizedBox(height: 20),
                      
                      // Send reset link button
                      AuthPrimaryButton(
                        label: _emailSent ? 'Resend Reset Link' : 'Send Reset Link',
                        isLoading: _isLoading,
                        onPressed: _resendCountdown > 0 ? null : _handleSendResetLink,
                      ),
                      
                      // Resend countdown
                      if (_resendCountdown > 0) ...[
                        const SizedBox(height: 12),
                        Center(
                          child: Text(
                            'You can resend in ${_resendCountdown}s',
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark ? Colors.white54 : Colors.black45,
                            ),
                          ),
                        ),
                      ],
                      
                      // Success message
                      if (_emailSent) ...[
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: kTealColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: kTealColor.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle, color: kTealColor, size: 24),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Email sent!',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: kTealColor,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Check your inbox for password reset instructions.',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: isDark ? Colors.white70 : Colors.black54,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
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
          ),
        ),
      ),
    );
  }

  /// ReCAPTCHA UI stub (visual only)
  Widget _buildRecaptchaStub(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[800] : Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? Colors.grey[600]! : Colors.grey[300]!,
        ),
      ),
      child: Row(
        children: [
          // Checkbox stub
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey),
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Icon(Icons.check, size: 18, color: kTealColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              "I'm not a robot",
              style: TextStyle(
                fontSize: 14,
                color: isDark ? Colors.white70 : Colors.black87,
              ),
            ),
          ),
          // reCAPTCHA logo placeholder
          Column(
            children: [
              Icon(
                Icons.refresh,
                size: 24,
                color: isDark ? Colors.white38 : Colors.black38,
              ),
              Text(
                'reCAPTCHA',
                style: TextStyle(
                  fontSize: 8,
                  color: isDark ? Colors.white38 : Colors.black38,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Handle send reset link
  Future<void> _handleSendResetLink() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    // Debug: simulate slow network if enabled
    if (_simulateSlowNetwork) {
      await Future.delayed(const Duration(seconds: 2));
    }
    
    // Debug: simulate error if enabled
    if (_simulateError) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      showErrorDialog(
        context,
        'Request Failed',
        'Unable to send password reset email. Please check your email address and try again.',
      );
      return;
    }
    
    try {
      // Call real backend API
      await _authRepository.forgotPassword(_emailController.text.trim());
      
      if (!mounted) return;
      
      setState(() {
        _isLoading = false;
        _emailSent = true;
        _resendCountdown = 30;
      });
      
      showSuccessSnackbar(context, 'Password reset email sent');
      
      // Start countdown timer
      _startResendCountdown();
      
      // Navigate to reset password screen
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          Navigator.pushNamed(
            context,
            '/reset-password',
            arguments: _emailController.text.trim(), // Pass email for reset
          );
        }
      });
      
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      showErrorDialog(context, 'Request Failed', e.message);
      
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

  /// Start resend countdown timer
  void _startResendCountdown() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      if (_resendCountdown <= 0) return false;
      setState(() => _resendCountdown--);
      return true;
    });
  }
}
