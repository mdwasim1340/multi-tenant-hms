import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'auth_widgets.dart';
import '../../features/auth/data/repositories/auth_repository.dart';

/// ============================================================
/// SIGN UP SCREEN
/// Route: /sign-up
/// 
/// Features:
/// - Full registration form with validation (connected to backend)
/// - Password strength meter
/// - Terms & Privacy checkbox
/// - Email verification flow
/// - Social sign-up options - UI only
/// ============================================================
class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _authRepository = AuthRepository();
  
  bool _agreedToTerms = false;
  bool _isLoading = false;
  bool _simulateError = false;
  bool _simulateSlowNetwork = false;
  String _selectedCountryCode = '+1';

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
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
          'Sign Up',
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
                title: 'Create your account',
                subtitle: 'Join MedChat AI — secure, private, and helpful',
              ),
              const SizedBox(height: 32),
              
              // Sign up form card
              AuthCard(
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Full name field
                      AuthTextField(
                        controller: _nameController,
                        label: 'Full Name',
                        hint: 'Enter your full name',
                        enabled: !_isLoading,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your name';
                          }
                          if (value.length < 2) {
                            return 'Name must be at least 2 characters';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      // Email field
                      AuthTextField(
                        controller: _emailController,
                        label: 'Email',
                        hint: 'Enter your email',
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
                      const SizedBox(height: 16),
                      
                      // Phone field with country code (optional)
                      _buildPhoneField(isDark),
                      const SizedBox(height: 16),
                      
                      // Password field
                      AuthTextField(
                        controller: _passwordController,
                        label: 'Password',
                        hint: 'Create a password',
                        isPassword: true,
                        enabled: !_isLoading,
                        onChanged: (_) => setState(() {}),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter a password';
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
                        label: 'Confirm Password',
                        hint: 'Re-enter your password',
                        isPassword: true,
                        enabled: !_isLoading,
                        textInputAction: TextInputAction.done,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please confirm your password';
                          }
                          if (value != _passwordController.text) {
                            return 'Passwords do not match';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 20),
                      
                      // Terms & Privacy checkbox
                      _buildTermsCheckbox(isDark),
                      const SizedBox(height: 8),
                      
                      // Privacy note
                      Text(
                        "We'll never sell your data. Read our Privacy Policy.",
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white54 : Colors.black45,
                        ),
                      ),
                      const SizedBox(height: 20),
                      
                      // Create Account button
                      // Assert: button disabled until terms agreed
                      AuthPrimaryButton(
                        label: 'Create Account',
                        isLoading: _isLoading,
                        onPressed: _agreedToTerms ? _handleSignUp : null,
                      ),
                      const SizedBox(height: 24),
                      
                      // OR divider
                      _buildOrDivider(isDark),
                      const SizedBox(height: 24),
                      
                      // Social sign-up buttons
                      SocialButton(
                        label: 'Continue with Google',
                        provider: 'google',
                        onPressed: () => _handleSocialSignUp('google'),
                      ),
                      const SizedBox(height: 12),
                      if (SocialButton.shouldShowApple())
                        SocialButton(
                          label: 'Continue with Apple',
                          provider: 'apple',
                          onPressed: () => _handleSocialSignUp('apple'),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              
              // Sign in link
              AuthFooterLinks(
                text: 'Already have an account?',
                linkText: 'Sign In',
                onLinkTap: () => Navigator.pushReplacementNamed(context, '/sign-in'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhoneField(bool isDark) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Country code selector (UI stub)
        Container(
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: isDark ? Colors.grey[800] : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isDark ? Colors.grey[600]! : const Color(0xFFE0E0E0),
            ),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _selectedCountryCode,
              items: const [
                DropdownMenuItem(value: '+1', child: Text('+1')),
                DropdownMenuItem(value: '+44', child: Text('+44')),
                DropdownMenuItem(value: '+91', child: Text('+91')),
                DropdownMenuItem(value: '+86', child: Text('+86')),
              ],
              onChanged: _isLoading
                  ? null
                  : (v) => setState(() => _selectedCountryCode = v ?? '+1'),
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Phone number field
        Expanded(
          child: AuthTextField(
            controller: _phoneController,
            label: 'Phone (optional)',
            hint: 'Enter phone number',
            isPhone: true,
            enabled: !_isLoading,
          ),
        ),
      ],
    );
  }


  Widget _buildTermsCheckbox(bool isDark) {
    return Semantics(
      label: 'I agree to the Terms of Service and Privacy Policy',
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 44,
            height: 44,
            child: Checkbox(
              value: _agreedToTerms,
              onChanged: _isLoading
                  ? null
                  : (v) => setState(() => _agreedToTerms = v ?? false),
              activeColor: kTealColor,
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 12),
              child: RichText(
                text: TextSpan(
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark ? Colors.white70 : Colors.black54,
                  ),
                  children: [
                    const TextSpan(text: 'I agree to the '),
                    TextSpan(
                      text: 'Terms of Service',
                      style: const TextStyle(
                        color: kTealColor,
                        fontWeight: FontWeight.w500,
                      ),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () => Navigator.pushNamed(context, '/terms'),
                    ),
                    const TextSpan(text: ' and '),
                    TextSpan(
                      text: 'Privacy Policy',
                      style: const TextStyle(
                        color: kTealColor,
                        fontWeight: FontWeight.w500,
                      ),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () => Navigator.pushNamed(context, '/privacy'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrDivider(bool isDark) {
    return Row(
      children: [
        Expanded(child: Divider(color: isDark ? Colors.grey[600] : Colors.grey[300])),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'OR',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: isDark ? Colors.white54 : Colors.black45,
            ),
          ),
        ),
        Expanded(child: Divider(color: isDark ? Colors.grey[600] : Colors.grey[300])),
      ],
    );
  }

  /// Handle sign up form submission
  Future<void> _handleSignUp() async {
    if (!_formKey.currentState!.validate()) return;
    
    // Assert: terms must be agreed
    assert(_agreedToTerms, 'Sign Up requires checkbox before enabling the CTA');
    
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
        'Sign Up Failed',
        'Unable to create your account. This email may already be registered.',
      );
      return;
    }
    
    try {
      // Call real backend API
      await _authRepository.signUp(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        phone: _phoneController.text.isNotEmpty
            ? '$_selectedCountryCode${_phoneController.text}'
            : null,
      );
      
      if (!mounted) return;
      
      setState(() => _isLoading = false);
      
      // Show verification modal
      _showVerificationModal();
      
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      showErrorDialog(context, 'Sign Up Failed', e.message);
      
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      showErrorDialog(
        context,
        'Error',
        'An unexpected error occurred. Please check your connection and try again.',
      );
    }
  }

  /// Show email verification modal
  void _showVerificationModal() {
    final codeController = TextEditingController();
    bool isVerifying = false;
    bool codeSent = true;
    int resendCountdown = 30;
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          // Countdown timer for resend
          if (codeSent && resendCountdown > 0) {
            Future.delayed(const Duration(seconds: 1), () {
              if (ctx.mounted && resendCountdown > 0) {
                setDialogState(() => resendCountdown--);
              }
            });
          }
          
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Row(
              children: [
                Icon(Icons.email_outlined, color: kTealColor),
                SizedBox(width: 8),
                Text('Verification Required', style: TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'We sent a verification code to ${_emailController.text}',
                  style: const TextStyle(fontSize: 14, color: Colors.black54),
                ),
                const SizedBox(height: 20),
                // 6-digit code input
                TextField(
                  controller: codeController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 24, letterSpacing: 8),
                  decoration: InputDecoration(
                    hintText: '000000',
                    counterText: '',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: kTealColor, width: 2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Resend code button
                Center(
                  child: TextButton(
                    onPressed: resendCountdown > 0
                        ? null
                        : () async {
                            setDialogState(() {
                              codeSent = true;
                              resendCountdown = 30;
                            });
                            // Resend verification code via API
                            await _authRepository.resendVerificationCode(
                              _emailController.text.trim(),
                            );
                            if (context.mounted) {
                              showSuccessSnackbar(context, 'Verification code resent');
                            }
                          },
                    child: Text(
                      resendCountdown > 0
                          ? 'Resend code in ${resendCountdown}s'
                          : 'Resend code',
                      style: TextStyle(
                        color: resendCountdown > 0 ? Colors.grey : kTealColor,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel', style: TextStyle(color: Colors.black54)),
              ),
              ElevatedButton(
                onPressed: isVerifying
                    ? null
                    : () async {
                        if (codeController.text.length != 6) {
                          showErrorDialog(context, 'Invalid Code', 'Please enter the 6-digit verification code.');
                          return;
                        }
                        
                        setDialogState(() => isVerifying = true);
                        
                        try {
                          // Call real backend API to verify email
                          await _authRepository.verifyEmail(
                            email: _emailController.text.trim(),
                            code: codeController.text,
                          );
                          
                          if (!ctx.mounted) return;
                          
                          Navigator.pop(ctx);
                          _showAccountCreatedModal();
                          
                        } on AuthException catch (e) {
                          setDialogState(() => isVerifying = false);
                          showErrorDialog(context, 'Verification Failed', e.message);
                        } catch (e) {
                          setDialogState(() => isVerifying = false);
                          showErrorDialog(context, 'Error', 'Verification failed. Please try again.');
                        }
                      },
                style: ElevatedButton.styleFrom(backgroundColor: kTealColor),
                child: isVerifying
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Verify'),
              ),
            ],
          );
        },
      ),
    );
  }

  /// Show account created success modal
  void _showAccountCreatedModal() {
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
              'Account Created!',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Your account has been created successfully.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.black54),
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pushReplacementNamed(context, '/sign-in');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: kTealColor,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Continue to Sign In'),
            ),
          ),
        ],
      ),
    );
  }

  /// Handle social sign-up
  Future<void> _handleSocialSignUp(String provider) async {
    // Analytics hook
    // TODO: analytics.track('onSocialLogin', {'provider': provider, 'action': 'signup'});
    
    setState(() => _isLoading = true);
    
    final delay = _simulateSlowNetwork ? 3000 : 800;
    await Future.delayed(Duration(milliseconds: delay));
    
    if (!mounted) return;
    
    if (_simulateError) {
      setState(() => _isLoading = false);
      showErrorDialog(
        context,
        'Sign Up Failed',
        'Unable to sign up with $provider. Please try again or use email registration.',
      );
      return;
    }
    
    // TODO: API Hook - Replace with actual social auth
    // final result = await authService.signUpWithSocial(provider);
    
    setState(() => _isLoading = false);
    _showAccountCreatedModal();
  }
}
