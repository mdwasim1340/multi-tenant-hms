import 'package:flutter/material.dart';
import 'sidebar_drawer.dart';
import 'chat_history.dart';
import 'theme/theme_provider.dart';
import 'screens/subscription_screen.dart';
import 'screens/privacy_security_screen.dart';
import 'screens/faq_support_screen.dart';
import 'screens/contact_support_screen.dart';
import 'screens/chat_history_screen.dart';
import 'screens/auth/sign_in_screen.dart';
import 'screens/auth/sign_up_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/auth/reset_password_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'core/storage/secure_storage.dart';

// Global theme provider instance
final themeProvider = ThemeProvider();

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MedChatApp());
}

class MedChatApp extends StatelessWidget {
  const MedChatApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: themeProvider,
      builder: (context, child) {
        return MaterialApp(
          title: 'MedChat AI',
          debugShowCheckedModeBanner: false,
          theme: lightTheme,
          darkTheme: darkTheme,
          themeMode: themeProvider.themeMode,
          home: const AuthWrapper(), // Check auth state on startup
          onGenerateRoute: (settings) {
            // Home route - goes directly to HomeScreen (after login)
            if (settings.name == '/') {
              return MaterialPageRoute(builder: (context) => const HomeScreen());
            }
            if (settings.name == '/home') {
              return MaterialPageRoute(builder: (context) => const HomeScreen());
            }
            if (settings.name == '/subscription') {
              return MaterialPageRoute(builder: (context) => const SubscriptionScreen());
            }
            if (settings.name == '/privacy-security') {
              return MaterialPageRoute(builder: (context) => const PrivacySecurityScreen());
            }
            if (settings.name == '/faq-support') {
              return MaterialPageRoute(builder: (context) => const FaqSupportScreen());
            }
            if (settings.name == '/contact-support') {
              return MaterialPageRoute(builder: (context) => const ContactSupportScreen());
            }
            if (settings.name == '/profile') {
              return MaterialPageRoute(builder: (context) => const ProfileScreen());
            }
            if (settings.name == '/sign-in') {
              return MaterialPageRoute(builder: (context) => const SignInScreen());
            }
            if (settings.name == '/sign-up') {
              return MaterialPageRoute(builder: (context) => const SignUpScreen());
            }
            if (settings.name == '/forgot-password') {
              return MaterialPageRoute(builder: (context) => const ForgotPasswordScreen());
            }
            if (settings.name == '/reset-password') {
              final token = settings.arguments as String? ?? 'demo-token';
              return MaterialPageRoute(builder: (context) => ResetPasswordScreen(token: token));
            }
            return null;
          },
        );
      },
    );
  }
}

/// Wrapper widget that checks authentication state on startup
class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isLoading = true;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    _checkAuthState();
  }

  Future<void> _checkAuthState() async {
    try {
      final isLoggedIn = await SecureStorage.isLoggedIn();
      if (mounted) {
        setState(() {
          _isAuthenticated = isLoggedIn;
          _isLoading = false;
        });
      }
    } catch (e) {
      // Error checking auth, show sign in
      if (mounted) {
        setState(() {
          _isAuthenticated = false;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      // Show splash/loading screen
      return Scaffold(
        backgroundColor: AppColors.tealPrimary,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Center(
                  child: Text(
                    'M',
                    style: TextStyle(
                      color: AppColors.tealPrimary,
                      fontSize: 56,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'MedChat AI',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 32),
              const CircularProgressIndicator(color: Colors.white),
            ],
          ),
        ),
      );
    }

    // Show sign in if not authenticated, otherwise show home
    return _isAuthenticated ? const HomeScreen() : const SignInScreen();
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ChatHistoryManager _historyManager = ChatHistoryManager();
  final List<ChatMessage> _messages = [];
  bool _isChatting = false;

  @override
  void initState() {
    super.initState();
    _historyManager.addListener(_onHistoryChanged);
    themeProvider.addListener(_onThemeChanged);
  }

  void _onHistoryChanged() {
    setState(() {});
  }

  void _onThemeChanged() {
    setState(() {});
  }

  @override
  void dispose() {
    _messageController.dispose();
    _historyManager.removeListener(_onHistoryChanged);
    themeProvider.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _startNewChat() {
    if (_messages.isNotEmpty) {
      _historyManager.saveCurrentChat(_messages);
    }
    setState(() {
      _messages.clear();
      _messageController.clear();
      _isChatting = false;
    });
  }

  void _saveConversation() {
    if (_messages.isNotEmpty) {
      _historyManager.saveCurrentChat(_messages);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Conversation saved'), duration: Duration(seconds: 2)),
      );
    }
  }

  void _loadSession(ChatSession session) {
    setState(() {
      _messages.clear();
      _messages.addAll(session.messages);
      _isChatting = true;
    });
  }

  void _openChatHistory() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatHistoryScreen(onSessionSelected: _loadSession),
      ),
    );
  }

  void _clearHistory() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear History'),
        content: const Text('Are you sure you want to delete all chat history?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              _historyManager.clearHistory();
              Navigator.pop(context);
              ScaffoldMessenger.of(this.context).showSnackBar(
                const SnackBar(content: Text('History cleared'), duration: Duration(seconds: 2)),
              );
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }

  void _deleteSession(ChatSession session) {
    _historyManager.deleteSession(session.id);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Chat deleted'), duration: Duration(seconds: 2)),
    );
  }

  void _startChatWithCategory(String message) {
    setState(() {
      _isChatting = true;
      _messages.add(ChatMessage(text: message, isUser: true));
    });

    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        setState(() {
          _messages.add(ChatMessage(
            text: 'Thank you for your question. I\'m here to help with medical information. Please note that this is for informational purposes only.',
            isUser: false,
          ));
        });
      }
    });
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _isChatting = true;
      _messages.add(ChatMessage(text: text, isUser: true));
      _messageController.clear();
    });

    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        setState(() {
          _messages.add(ChatMessage(
            text: 'Thank you for your question. I\'m here to help with medical information. Please note that this is for informational purposes only.',
            isUser: false,
          ));
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // Use themeProvider directly for immediate updates
    final isDark = themeProvider.isDarkMode;
    final backgroundColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;

    return Scaffold(
      backgroundColor: backgroundColor,
      drawer: SideBarDrawer(
        onNewChat: _startNewChat,
        onSaveConversation: _saveConversation,
        onViewHistory: _openChatHistory,
        onClearHistory: _clearHistory,
        chatHistory: _historyManager.recentSessions,
        onSessionSelected: _loadSession,
        onDeleteSession: _deleteSession,
      ),
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: Builder(
          builder: (context) => Column(
            children: [
              _buildTopHeader(context, cardColor, textPrimary, textSecondary),
              Expanded(child: _isChatting ? _buildChatView(isDark) : _buildWelcomeView(cardColor, textPrimary, textSecondary, isDark)),
              _buildBottomInputBar(cardColor, textPrimary, textSecondary, isDark),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChatView(bool isDark) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _messages.length,
      itemBuilder: (context, index) => _buildMessageBubble(_messages[index], isDark),
    );
  }

  Widget _buildMessageBubble(ChatMessage message, bool isDark) {
    final bubbleColor = message.isUser 
        ? AppColors.tealPrimary 
        : (isDark ? AppColors.darkCard : Colors.white);
    final textColor = message.isUser 
        ? Colors.white 
        : (isDark ? AppColors.darkTextPrimary : Colors.black87);

    return Align(
      alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: bubbleColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 5, offset: const Offset(0, 2))],
        ),
        child: Text(message.text, style: TextStyle(fontSize: 14, color: textColor)),
      ),
    );
  }

  Widget _buildWelcomeView(Color cardColor, Color textPrimary, Color textSecondary, bool isDark) {
    return SingleChildScrollView(
      child: Column(
        children: [
          const SizedBox(height: 24),
          _buildLogoArea(),
          const SizedBox(height: 32),
          _buildHeadlineSection(textPrimary, textSecondary),
          const SizedBox(height: 32),
          _buildOptionCards(cardColor, textPrimary, textSecondary),
          const SizedBox(height: 32),
          _buildPopularQuestions(cardColor, textPrimary, textSecondary, isDark),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildTopHeader(BuildContext context, Color cardColor, Color textPrimary, Color textSecondary) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: cardColor,
      child: Row(
        children: [
          // Show back button when chatting, menu button when on home screen
          IconButton(
            icon: Icon(_isChatting ? Icons.arrow_back : Icons.menu, color: textPrimary),
            onPressed: () {
              if (_isChatting) {
                // Go back to home screen
                _startNewChat();
              } else {
                // Open drawer
                Scaffold.of(context).openDrawer();
              }
            },
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('MedChat AI', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: textPrimary)),
              Text(_isChatting ? 'Chat Session' : 'Medical Assistant', style: TextStyle(fontSize: 11, color: textSecondary)),
            ],
          ),
          const Spacer(),
          IconButton(
            icon: Icon(Icons.notifications_outlined, color: textPrimary, size: 26),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('No new notifications'), duration: Duration(seconds: 2)),
              );
            },
            tooltip: 'Notifications',
          ),
        ],
      ),
    );
  }

  Widget _buildLogoArea() {
    return Container(
      width: 100, height: 100,
      decoration: BoxDecoration(color: AppColors.tealPrimary, borderRadius: BorderRadius.circular(20)),
      child: const Center(child: Text('M', style: TextStyle(color: Colors.white, fontSize: 56, fontWeight: FontWeight.bold))),
    );
  }

  Widget _buildHeadlineSection(Color textPrimary, Color textSecondary) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Text('How can we help your\nhealth today?', textAlign: TextAlign.center, style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: textPrimary, height: 1.3)),
          const SizedBox(height: 12),
          Text('Get reliable medical information instantly', textAlign: TextAlign.center, style: TextStyle(fontSize: 15, color: textSecondary)),
        ],
      ),
    );
  }

  Widget _buildOptionCards(Color cardColor, Color textPrimary, Color textSecondary) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          _buildOptionCard(
            icon: Icons.assignment_outlined, 
            title: 'Symptom Checker', 
            subtitle: 'Get information about symptoms', 
            cardColor: cardColor, 
            textPrimary: textPrimary, 
            textSecondary: textSecondary,
            onTap: () => _startChatWithCategory('I need help checking my symptoms'),
          ),
          const SizedBox(height: 12),
          _buildOptionCard(
            icon: Icons.medication_outlined, 
            title: 'Medication Info', 
            subtitle: 'Learn about medications and dosages', 
            cardColor: cardColor, 
            textPrimary: textPrimary, 
            textSecondary: textSecondary,
            onTap: () => _startChatWithCategory('I need information about medications'),
          ),
          const SizedBox(height: 12),
          _buildOptionCard(
            icon: Icons.local_hospital_outlined, 
            title: 'Conditions Guide', 
            subtitle: 'Explore common medical conditions', 
            cardColor: cardColor, 
            textPrimary: textPrimary, 
            textSecondary: textSecondary,
            onTap: () => _startChatWithCategory('I want to learn about medical conditions'),
          ),
        ],
      ),
    );
  }

  Widget _buildOptionCard({required IconData icon, required String title, required String subtitle, required Color cardColor, required Color textPrimary, required Color textSecondary, required VoidCallback onTap}) {
    return Container(
      decoration: BoxDecoration(
        color: cardColor, borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16), onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(color: AppColors.tealPrimary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                  child: Icon(icon, color: AppColors.tealPrimary, size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary)),
                      const SizedBox(height: 4),
                      Text(subtitle, style: TextStyle(fontSize: 13, color: textSecondary)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPopularQuestions(Color cardColor, Color textPrimary, Color textSecondary, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 12),
            child: Text('Popular Questions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary)),
          ),
          _buildQuestionItem('What are the symptoms of flu?', cardColor, textPrimary, isDark),
          const SizedBox(height: 10),
          _buildQuestionItem('How to manage migraines?', cardColor, textPrimary, isDark),
          const SizedBox(height: 10),
          _buildQuestionItem('When should I see a doctor?', cardColor, textPrimary, isDark),
          const SizedBox(height: 10),
          _buildQuestionItem('What are the side effects of ibuprofen?', cardColor, textPrimary, isDark),
        ],
      ),
    );
  }

  Widget _buildQuestionItem(String question, Color cardColor, Color textPrimary, bool isDark) {
    final borderColor = isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.08);
    return Container(
      decoration: BoxDecoration(
        color: cardColor, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor, width: 1),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 4, offset: const Offset(0, 1))],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {
            _messageController.text = question;
            _sendMessage();
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Expanded(child: Text(question, style: TextStyle(fontSize: 14, color: textPrimary))),
                Icon(Icons.chevron_right, color: isDark ? Colors.white38 : Colors.black38, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomInputBar(Color cardColor, Color textPrimary, Color textSecondary, bool isDark) {
    final inputBgColor = isDark ? AppColors.darkSurface : const Color(0xFFF5F5F5);
    return Container(
      decoration: BoxDecoration(
        color: cardColor,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, -2))],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          children: [
            // Plus button
            Container(
              width: 44, height: 44,
              decoration: const BoxDecoration(color: AppColors.tealPrimary, shape: BoxShape.circle),
              child: IconButton(icon: const Icon(Icons.add, color: Colors.white, size: 24), onPressed: () {}, padding: EdgeInsets.zero),
            ),
            const SizedBox(width: 8),
            // Input field with mic and send buttons inside
            Expanded(
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: inputBgColor,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Text input
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        style: TextStyle(color: textPrimary, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'Ask about symptoms...',
                          hintStyle: TextStyle(color: textSecondary, fontSize: 14),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                    // Mic button inside the box
                    GestureDetector(
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Voice input coming soon!'), duration: Duration(seconds: 1)),
                        );
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: Icon(Icons.mic, color: textSecondary, size: 24),
                      ),
                    ),
                    // Send button inside the box
                    Padding(
                      padding: const EdgeInsets.only(right: 5),
                      child: GestureDetector(
                        onTap: _sendMessage,
                        child: Container(
                          width: 36, height: 36,
                          decoration: const BoxDecoration(
                            color: AppColors.tealPrimary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.send, color: Colors.white, size: 18),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
