import 'package:flutter/material.dart';
import 'auth_widgets.dart';
import '../../theme/theme_provider.dart';
import '../../features/auth/data/repositories/auth_repository.dart';

/// ============================================================
/// SIGN IN SCREEN
/// Route: /sign-in
/// 
/// Features:
/// - Email/password authentication (connected to backend)
/// - Remember me checkbox
/// - Social sign-in (Google, Apple) - UI only
/// - Biometric authentication stub
/// - Debug menu for testing error/loading states
/// ============================================================
class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authRepository = AuthRepository();
  
  bool _rememberMe = false;
  bool _isLoading = false;
  bool _simulateError = false;
  bool _simulateSlowNetwork = false;
  String? _passwordError;

  // Debug: prefill test credentials if enabled
  @override
  void initState() {
    super.initState();
    if (kEnableDebugMocks) {
      _emailController.text = 'admin@medchat.ai';
      _passwordController.text = 'MedChat@2025!';
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final backgroundColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: cardColor,
        elevation: 1,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: textPrimary),
          onPressed: () => Navigator.pop(context),
          tooltip: 'Go back',
        ),
        title: Text(
          'Sign In',
          style: TextStyle(
            color: textPrimary,
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
              // Header with logo
              const AuthHeader(
                title: 'Welcome back',
                subtitle: 'Sign in to continue to MedChat AI',
              ),
              const SizedBox(height: 32),
              
              // Sign in form card
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
                      
                      // Password field
                      AuthTextField(
                        controller: _passwordController,
                        label: 'Password',
                        hint: 'Enter your password',
                        isPassword: true,
                        enabled: !_isLoading,
                        errorText: _passwordError,
                        textInputAction: TextInputAction.done,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your password';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      
                      // Remember me & Forgot password row
                      Row(
                        children: [
                          // Remember me checkbox
                          Semantics(
                            label: 'Remember me',
                            child: SizedBox(
                              height: 44, // Accessibility tap target
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Checkbox(
                                    value: _rememberMe,
                                    onChanged: _isLoading
                                        ? null
                                        : (v) => setState(() => _rememberMe = v ?? false),
                                    activeColor: kTealColor,
                                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  GestureDetector(
                                    onTap: _isLoading
                                        ? null
                                        : () => setState(() => _rememberMe = !_rememberMe),
                                    child: Text(
                                      'Remember me',
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: isDark ? Colors.white70 : Colors.black54,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const Spacer(),
                          // Forgot password link
                          TextButton(
                            onPressed: _isLoading
                                ? null
                                : () => Navigator.pushNamed(context, '/forgot-password'),
                            style: TextButton.styleFrom(
                              minimumSize: const Size(44, 44),
                            ),
                            child: const Text(
                              'Forgot Password?',
                              style: TextStyle(
                                fontSize: 14,
                                color: kTealColor,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      
                      // Sign In button
                      AuthPrimaryButton(
                        label: 'Sign In',
                        isLoading: _isLoading,
                        onPressed: _handleSignIn,
                      ),
                      const SizedBox(height: 16),
                      
                      // Biometric sign-in stub (UI only)
                      _buildBiometricButton(),
                      const SizedBox(height: 24),
                      
                      // OR divider
                      _buildOrDivider(isDark),
                      const SizedBox(height: 24),
                      
                      // Social sign-in buttons
                      SocialButton(
                        label: 'Continue with Google',
                        provider: 'google',
                        onPressed: () => _handleSocialSignIn('google'),
                      ),
                      const SizedBox(height: 12),
                      if (SocialButton.shouldShowApple())
                        SocialButton(
                          label: 'Continue with Apple',
                          provider: 'apple',
                          onPressed: () => _handleSocialSignIn('apple'),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              
              // Sign up link
              AuthFooterLinks(
                text: "Don't have an account?",
                linkText: 'Sign Up',
                onLinkTap: () => Navigator.pushNamed(context, '/sign-up'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOrDivider(bool isDark) {
    return Row(
      children: [
        Expanded(
          child: Divider(
            color: isDark ? Colors.grey[600] : Colors.grey[300],
          ),
        ),
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
        Expanded(
          child: Divider(
            color: isDark ? Colors.grey[600] : Colors.grey[300],
          ),
        ),
      ],
    );
  }

  Widget _buildBiometricButton() {
    // UI-only stub for biometric authentication
    // TODO: Integrate with local_auth package for actual biometric support
    return Semantics(
      label: 'Sign in with biometrics',
      button: true,
      child: OutlinedButton.icon(
        onPressed: _isLoading ? null : _handleBiometricSignIn,
        icon: const Icon(Icons.fingerprint, color: kTealColor),
        label: const Text(
          'Use biometrics',
          style: TextStyle(color: kTealColor),
        ),
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(double.infinity, 48),
          side: const BorderSide(color: kTealColor),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }


  /// Handle sign in form submission
  Future<void> _handleSignIn() async {
    // Clear previous errors
    setState(() => _passwordError = null);
    
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
        _passwordError = 'Incorrect password. Please try again.';
      });
      showErrorDialog(
        context,
        'Sign In Failed',
        'The email or password you entered is incorrect. Please check your credentials and try again.',
      );
      return;
    }
    
    try {
      // Call real backend API
      final response = await _authRepository.signIn(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      
      if (!mounted) return;
      
      setState(() => _isLoading = false);
      
      showSuccessSnackbar(context, 'Welcome back, ${response.user.displayName}!');
      
      // Navigate to home and clear navigation stack
      Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
      
    } on MfaRequiredException catch (e) {
      // Handle MFA challenge
      if (!mounted) return;
      setState(() => _isLoading = false);
      _showMfaDialog(e.session);
      
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        if (e.isInvalidCredentials) {
          _passwordError = 'Incorrect password. Please try again.';
        }
      });
      showErrorDialog(context, 'Sign In Failed', e.message);
      
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
  
  /// Show MFA verification dialog
  void _showMfaDialog(String session) {
    final codeController = TextEditingController();
    bool isVerifying = false;
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Row(
              children: [
                Icon(Icons.security, color: kTealColor),
                SizedBox(width: 8),
                Text('Verification Required', style: TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Enter the verification code from your authenticator app.',
                  style: TextStyle(fontSize: 14, color: Colors.black54),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: codeController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 24, letterSpacing: 8),
                  decoration: InputDecoration(
                    hintText: '000000',
                    counterText: '',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: kTealColor, width: 2),
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
                          showErrorDialog(context, 'Invalid Code', 'Please enter the 6-digit code.');
                          return;
                        }
                        
                        setDialogState(() => isVerifying = true);
                        
                        try {
                          final response = await _authRepository.respondToMfaChallenge(
                            email: _emailController.text.trim(),
                            mfaCode: codeController.text,
                            session: session,
                          );
                          
                          if (!ctx.mounted) return;
                          Navigator.pop(ctx);
                          
                          showSuccessSnackbar(context, 'Welcome back, ${response.user.displayName}!');
                          Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
                          
                        } on AuthException catch (e) {
                          setDialogState(() => isVerifying = false);
                          showErrorDialog(context, 'Verification Failed', e.message);
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

  /// Handle social sign-in
  Future<void> _handleSocialSignIn(String provider) async {
    // Analytics hook: track social login attempt
    // TODO: analytics.track('onSocialLogin', {'provider': provider});
    
    setState(() => _isLoading = true);
    
    final delay = _simulateSlowNetwork ? 3000 : 800;
    await Future.delayed(Duration(milliseconds: delay));
    
    if (!mounted) return;
    
    if (_simulateError) {
      setState(() => _isLoading = false);
      showErrorDialog(
        context,
        'Sign In Failed',
        'Unable to sign in with $provider. Please try again or use email/password.',
      );
      return;
    }
    
    // TODO: API Hook - Replace with actual social auth
    // final result = await authService.signInWithSocial(provider);
    
    setState(() => _isLoading = false);
    showSuccessSnackbar(context, 'Signed in with $provider');
    
    if (mounted) {
      Navigator.pop(context);
    }
  }

  /// Handle biometric sign-in (UI stub)
  Future<void> _handleBiometricSignIn() async {
    // TODO: Integrate with local_auth package
    // final localAuth = LocalAuthentication();
    // final canCheckBiometrics = await localAuth.canCheckBiometrics;
    // if (canCheckBiometrics) {
    //   final didAuthenticate = await localAuth.authenticate(
    //     localizedReason: 'Sign in to MedChat AI',
    //   );
    //   if (didAuthenticate) { ... }
    // }
    
    setState(() => _isLoading = true);
    
    await Future.delayed(const Duration(milliseconds: 500));
    
    if (!mounted) return;
    
    if (_simulateError) {
      setState(() => _isLoading = false);
      showErrorDialog(
        context,
        'Biometric Failed',
        'Biometric authentication failed. Please try again or use email/password.',
      );
      return;
    }
    
    setState(() => _isLoading = false);
    showSuccessSnackbar(context, 'Signed in with biometrics');
    
    if (mounted) {
      Navigator.pop(context);
    }
  }
}
