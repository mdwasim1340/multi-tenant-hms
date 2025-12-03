import 'package:flutter/material.dart';
import '../theme/theme_provider.dart';
import '../main.dart' show themeProvider;

class FaqSupportScreen extends StatefulWidget {
  const FaqSupportScreen({super.key});

  @override
  State<FaqSupportScreen> createState() => _FaqSupportScreenState();
}

class _FaqSupportScreenState extends State<FaqSupportScreen> with TickerProviderStateMixin {
  static const Color _tealColor = AppColors.tealPrimary;
  static const Color _tealLight = AppColors.tealLight;
  
  String _selectedCategory = 'All';
  String _searchQuery = '';
  bool _showSearchField = false;
  bool? _feedbackHelpful;
  String _feedbackText = '';
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _feedbackController = TextEditingController();
  final Set<int> _expandedFaqs = {};

  final List<String> _categories = [
    'All', 'General', 'Account', 'Subscription', 'AI & Medical Safety', 'Data & Privacy', 'Troubleshooting'
  ];

  final List<Map<String, String>> _faqItems = [
    {'category': 'General', 'question': 'What is MedChat AI and how does it work?', 'answer': 'MedChat AI is an intelligent medical assistant that uses advanced AI to provide health information, symptom analysis, and medication guidance. It processes your queries using natural language understanding and provides evidence-based responses from trusted medical sources.'},
    {'category': 'General', 'question': 'Can MedChat AI replace a real doctor?', 'answer': 'No, MedChat AI is designed to provide general health information and guidance only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.'},
    {'category': 'General', 'question': 'What languages does MedChat AI support?', 'answer': 'Currently, MedChat AI supports English with plans to expand to additional languages including Spanish, French, German, and Mandarin in future updates.'},
    {'category': 'Account', 'question': 'How do I reset my password?', 'answer': 'To reset your password, go to the login screen and tap "Forgot Password". Enter your registered email address, and we\'ll send you a secure link to create a new password. The link expires in 24 hours.'},
    {'category': 'Account', 'question': 'How can I delete my account?', 'answer': 'To delete your account, go to Settings > Account Management > Delete Account. You\'ll need to confirm your identity and acknowledge that all your data will be permanently removed. This action cannot be undone.'},
    {'category': 'Account', 'question': 'Can I use MedChat AI on multiple devices?', 'answer': 'Yes! Your MedChat AI account can be used on multiple devices. Simply log in with your credentials on any supported device, and your chat history and preferences will sync automatically.'},
    {'category': 'Subscription', 'question': 'What\'s included in each subscription plan?', 'answer': 'Free Plan: 10 queries/day, basic symptom checker. Premium Plan: Unlimited queries, advanced AI analysis, medication interactions, priority support. Family Plan: All Premium features for up to 5 family members.'},
    {'category': 'Subscription', 'question': 'How do I cancel or upgrade my subscription?', 'answer': 'Go to Settings > Subscription to manage your plan. You can upgrade instantly or cancel anytime. Cancellations take effect at the end of your current billing period, and you\'ll retain access until then.'},
    {'category': 'Subscription', 'question': 'Do you offer refunds?', 'answer': 'We offer a 7-day money-back guarantee for new Premium subscribers. If you\'re not satisfied, contact our support team within 7 days of purchase for a full refund.'},
    {'category': 'AI & Medical Safety', 'question': 'Is MedChat AI safe for medical advice?', 'answer': 'MedChat AI provides general health information based on trusted medical sources. However, it should not be used for emergency situations or as a replacement for professional medical care. Always verify important health decisions with a healthcare provider.'},
    {'category': 'AI & Medical Safety', 'question': 'How accurate is the AI\'s symptom analysis?', 'answer': 'Our AI achieves approximately 85% accuracy in symptom matching based on clinical validation studies. However, accuracy varies by condition complexity. The AI always recommends professional consultation for serious or persistent symptoms.'},
    {'category': 'Data & Privacy', 'question': 'What data does MedChat AI collect?', 'answer': 'We collect: account information (email, name), chat history for personalization, usage analytics, and device information. We never sell your data to third parties. See our Privacy Policy for complete details.'},
    {'category': 'Data & Privacy', 'question': 'How is my health information protected?', 'answer': 'Your data is protected with AES-256 encryption at rest and TLS 1.3 in transit. We comply with HIPAA guidelines and undergo regular security audits. You can export or delete your data anytime from Account Settings.'},
    {'category': 'Troubleshooting', 'question': 'The app isn\'t responding — what should I do?', 'answer': 'Try these steps: 1) Force close and restart the app, 2) Check your internet connection, 3) Clear app cache in device settings, 4) Update to the latest version, 5) Restart your device. If issues persist, contact support.'},
    {'category': 'Troubleshooting', 'question': 'Why am I not receiving notifications?', 'answer': 'Check that notifications are enabled in both app settings and your device settings. Ensure Do Not Disturb is off, and the app has background refresh permissions. Battery optimization settings may also block notifications.'},
    {'category': 'Troubleshooting', 'question': 'The AI responses are slow or timing out', 'answer': 'Slow responses usually indicate network issues. Try switching between WiFi and mobile data, or move to an area with better signal. During peak hours, responses may take slightly longer. Clear the app cache if the problem persists.'},
  ];

  List<Map<String, String>> get _filteredFaqs {
    return _faqItems.where((faq) {
      final matchesCategory = _selectedCategory == 'All' || faq['category'] == _selectedCategory;
      final matchesSearch = _searchQuery.isEmpty ||
          faq['question']!.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          faq['answer']!.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    themeProvider.addListener(_onThemeChanged);
  }

  void _onThemeChanged() => setState(() {});

  @override
  void dispose() {
    _searchController.dispose();
    _feedbackController.dispose();
    themeProvider.removeListener(_onThemeChanged);
    super.dispose();
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
      appBar: _buildAppBar(cardColor, textPrimary, textSecondary),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeroHeader(),
            _buildCategoryTabs(),
            _buildSearchBar(),
            _buildFaqList(),
            _buildQuickHelpButtons(),
            _buildTroubleshootingWizard(),
            _buildResourcesSection(),
            _buildCommunitySection(),
            _buildFeedbackSection(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(Color cardColor, Color textPrimary, Color textSecondary) {
    return AppBar(
      backgroundColor: cardColor,
      elevation: 1,
      leading: IconButton(
        icon: Icon(Icons.arrow_back, color: textPrimary),
        onPressed: () => Navigator.of(context).pop(),
      ),
      title: _showSearchField
          ? TextField(
              controller: _searchController,
              autofocus: true,
              style: TextStyle(color: textPrimary),
              decoration: InputDecoration(
                hintText: 'Search FAQs...',
                border: InputBorder.none,
                hintStyle: TextStyle(color: textSecondary),
              ),
              onChanged: (value) => setState(() => _searchQuery = value),
            )
          : Text(
              'FAQ & Support',
              style: TextStyle(color: textPrimary, fontWeight: FontWeight.w600, fontSize: 18),
            ),
      actions: [
        IconButton(
          icon: Icon(_showSearchField ? Icons.close : Icons.search, color: textSecondary),
          onPressed: () {
            setState(() {
              _showSearchField = !_showSearchField;
              if (!_showSearchField) {
                _searchController.clear();
                _searchQuery = '';
              }
            });
          },
        ),
        IconButton(
          icon: Icon(Icons.share, color: textSecondary),
          onPressed: () => _showShareDialog(),
        ),
      ],
    );
  }


  Widget _buildHeroHeader() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [_tealColor, _tealLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: _tealColor.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          const Icon(Icons.support_agent, color: Colors.white, size: 48),
          const SizedBox(height: 16),
          const Text(
            'How can we help?',
            style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Find quick answers or reach our support team.',
            style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 14),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: [
              _buildFeatureChip('24/7 Assistance', Icons.access_time),
              _buildFeatureChip('AI Answers', Icons.smart_toy),
              _buildFeatureChip('Official Support', Icons.verified),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureChip(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 16),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildCategoryTabs() {
    final isDark = themeProvider.isDarkMode;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final borderColor = isDark ? AppColors.darkDivider : Colors.grey.shade300;
    return SizedBox(
      height: 50,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final category = _categories[index];
          final isSelected = category == _selectedCategory;
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: FilterChip(
              label: Text(category),
              selected: isSelected,
              onSelected: (_) => setState(() => _selectedCategory = category),
              backgroundColor: cardColor,
              selectedColor: _tealColor.withValues(alpha: 0.15),
              labelStyle: TextStyle(
                color: isSelected ? _tealColor : textSecondary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
              side: BorderSide(color: isSelected ? _tealColor : borderColor),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSearchBar() {
    final isDark = themeProvider.isDarkMode;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Container(
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05), blurRadius: 10, offset: const Offset(0, 2))],
        ),
        child: TextField(
          controller: _searchController,
          style: TextStyle(color: textPrimary),
          decoration: InputDecoration(
            hintText: 'Search for answers...',
            hintStyle: TextStyle(color: textSecondary),
            prefixIcon: Icon(Icons.search, color: textSecondary),
            suffixIcon: _searchQuery.isNotEmpty
                ? IconButton(
                    icon: Icon(Icons.clear, color: textSecondary),
                    onPressed: () {
                      _searchController.clear();
                      setState(() => _searchQuery = '');
                    },
                  )
                : null,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
          onChanged: (value) => setState(() => _searchQuery = value),
        ),
      ),
    );
  }

  Widget _buildFaqList() {
    final isDark = themeProvider.isDarkMode;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final faqs = _filteredFaqs;
    if (faqs.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(32),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.search_off, size: 48, color: textSecondary),
              const SizedBox(height: 16),
              Text('No results found', style: TextStyle(color: textSecondary, fontSize: 16)),
              const SizedBox(height: 8),
              Text('Try different keywords or category', style: TextStyle(color: textSecondary.withValues(alpha: 0.7), fontSize: 14)),
            ],
          ),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${faqs.length} Questions', style: TextStyle(color: textSecondary, fontSize: 13, fontWeight: FontWeight.w500)),
          const SizedBox(height: 12),
          ...faqs.asMap().entries.map((entry) => _buildFaqItem(entry.key, entry.value)),
        ],
      ),
    );
  }

  Widget _buildFaqItem(int index, Map<String, String> faq) {
    final isDark = themeProvider.isDarkMode;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final isExpanded = _expandedFaqs.contains(index);
    final question = faq['question']!;
    final answer = faq['answer']!;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => setState(() {
            if (isExpanded) {
              _expandedFaqs.remove(index);
            } else {
              _expandedFaqs.add(index);
            }
          }),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _tealColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(faq['category']!, style: const TextStyle(color: _tealColor, fontSize: 10, fontWeight: FontWeight.w600)),
                    ),
                    const Spacer(),
                    AnimatedRotation(
                      turns: isExpanded ? 0.5 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(Icons.expand_more, color: textSecondary),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildHighlightedText(question, _searchQuery, TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: textPrimary)),
                AnimatedCrossFade(
                  firstChild: const SizedBox.shrink(),
                  secondChild: Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: _buildHighlightedText(answer, _searchQuery, TextStyle(fontSize: 14, color: textSecondary, height: 1.5)),
                  ),
                  crossFadeState: isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
                  duration: const Duration(milliseconds: 200),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHighlightedText(String text, String query, TextStyle style) {
    if (query.isEmpty) return Text(text, style: style);
    final lowerText = text.toLowerCase();
    final lowerQuery = query.toLowerCase();
    final spans = <TextSpan>[];
    int start = 0;
    int index = lowerText.indexOf(lowerQuery);
    while (index != -1) {
      if (index > start) spans.add(TextSpan(text: text.substring(start, index)));
      spans.add(TextSpan(
        text: text.substring(index, index + query.length),
        style: const TextStyle(backgroundColor: Color(0xFFFFEB3B), fontWeight: FontWeight.w600),
      ));
      start = index + query.length;
      index = lowerText.indexOf(lowerQuery, start);
    }
    if (start < text.length) spans.add(TextSpan(text: text.substring(start)));
    return RichText(text: TextSpan(style: style, children: spans));
  }


  Widget _buildQuickHelpButtons() {
    final isDark = themeProvider.isDarkMode;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Quick Help', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildQuickHelpButton(Icons.email_outlined, 'Contact\nSupport', Colors.blue, () => _showContactSupportModal())),
              const SizedBox(width: 12),
              Expanded(child: _buildQuickHelpButton(Icons.smart_toy_outlined, 'Chat with\nSupport Bot', _tealColor, () => _showBotDialog())),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _buildQuickHelpButton(Icons.bug_report_outlined, 'Report a\nProblem', Colors.orange, () => _showReportProblemModal())),
              const SizedBox(width: 12),
              Expanded(child: _buildQuickHelpButton(Icons.receipt_long_outlined, 'Request\nRefund', Colors.purple, () => _showRefundDialog())),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickHelpButton(IconData icon, String label, Color color, VoidCallback onTap) {
    final isDark = themeProvider.isDarkMode;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    return Material(
      color: cardColor,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: color, size: 28),
              ),
              const SizedBox(height: 12),
              Text(label, textAlign: TextAlign.center, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: textPrimary)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTroubleshootingWizard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: [Colors.orange.shade50, Colors.orange.shade100]),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.orange.shade200),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => _showTroubleshootingWizard(),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
                    child: const Icon(Icons.build_outlined, color: Colors.orange, size: 28),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Troubleshooting Assistant', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black87)),
                        const SizedBox(height: 4),
                        Text('Get step-by-step help for common issues', style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios, color: Colors.orange, size: 18),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildResourcesSection() {
    final isDark = themeProvider.isDarkMode;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Resources', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary)),
          const SizedBox(height: 16),
          Container(
            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04), blurRadius: 8)]),
            child: Column(
              children: [
                _buildResourceItem(Icons.health_and_safety_outlined, 'Medical Safety Guidelines', '/medical-safety'),
                _buildDivider(),
                _buildResourceItem(Icons.lock_outline, 'Privacy & Security', '/privacy-security'),
                _buildDivider(),
                _buildResourceItem(Icons.description_outlined, 'Terms of Service', '/terms'),
                _buildDivider(),
                _buildResourceItem(Icons.medical_services_outlined, 'Medical Disclaimer', '/disclaimer'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResourceItem(IconData icon, String title, String route) {
    final isDark = themeProvider.isDarkMode;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          if (route == '/privacy-security') {
            Navigator.pushNamed(context, route);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Navigating to $title...'), duration: const Duration(seconds: 1)));
          }
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(icon, color: _tealColor, size: 22),
              const SizedBox(width: 16),
              Expanded(child: Text(title, style: TextStyle(fontSize: 14, color: textPrimary))),
              Icon(Icons.chevron_right, color: textSecondary, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDivider() => const Divider(height: 1, indent: 52, endIndent: 16);

  Widget _buildCommunitySection() {
    final isDark = themeProvider.isDarkMode;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Community & Help', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary)),
          const SizedBox(height: 16),
          Container(
            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04), blurRadius: 8)]),
            child: Column(
              children: [
                _buildCommunityItem(Icons.forum_outlined, 'Join our community forum', 'Connect with other users'),
                _buildDivider(),
                _buildCommunityItem(Icons.notifications_active_outlined, 'Follow us for updates', 'Stay informed about new features'),
                _buildDivider(),
                _buildCommunityItem(Icons.article_outlined, 'Read latest help articles', 'Tips and best practices'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCommunityItem(IconData icon, String title, String subtitle) {
    final isDark = themeProvider.isDarkMode;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Opening $title...'), duration: const Duration(seconds: 1))),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: _tealColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, color: _tealColor, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimary)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: TextStyle(fontSize: 12, color: textSecondary)),
                  ],
                ),
              ),
              Icon(Icons.open_in_new, color: textSecondary, size: 18),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeedbackSection() {
    final isDark = themeProvider.isDarkMode;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final borderColor = isDark ? AppColors.darkDivider : Colors.grey.shade300;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04), blurRadius: 8)],
        ),
        child: Column(
          children: [
            Text('Was this helpful?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary)),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildFeedbackButton(Icons.thumb_up_outlined, 'Yes', true),
                const SizedBox(width: 16),
                _buildFeedbackButton(Icons.thumb_down_outlined, 'No', false),
              ],
            ),
            if (_feedbackHelpful == false) ...[
              const SizedBox(height: 16),
              TextField(
                controller: _feedbackController,
                maxLines: 3,
                style: TextStyle(color: textPrimary),
                decoration: InputDecoration(
                  hintText: 'Tell us what we can improve...',
                  hintStyle: TextStyle(color: textSecondary),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderColor)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderColor)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _tealColor)),
                ),
                onChanged: (value) => setState(() => _feedbackText = value),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _feedbackText.isNotEmpty ? () {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Thank you for your feedback!'), backgroundColor: _tealColor));
                    setState(() { _feedbackHelpful = null; _feedbackController.clear(); _feedbackText = ''; });
                  } : null,
                  style: ElevatedButton.styleFrom(backgroundColor: _tealColor, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: const Text('Submit Feedback', style: TextStyle(color: Colors.white)),
                ),
              ),
            ],
            if (_feedbackHelpful == true)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text('Thank you for your feedback! 🎉', style: TextStyle(color: _tealColor, fontWeight: FontWeight.w500)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeedbackButton(IconData icon, String label, bool isPositive) {
    final isDark = themeProvider.isDarkMode;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final unselectedBg = isDark ? AppColors.darkSurface : Colors.grey.shade100;
    final isSelected = _feedbackHelpful == isPositive;
    return Material(
      color: isSelected ? (isPositive ? Colors.green.withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1)) : unselectedBg,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => setState(() => _feedbackHelpful = isPositive),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Row(
            children: [
              Icon(icon, color: isSelected ? (isPositive ? Colors.green : Colors.red) : textSecondary, size: 22),
              const SizedBox(width: 8),
              Text(label, style: TextStyle(color: isSelected ? (isPositive ? Colors.green : Colors.red) : textSecondary, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }


  void _showShareDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Share Support Link'),
        content: const Text('Share this support page with others who might need help.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied to clipboard!'), backgroundColor: _tealColor));
            },
            style: ElevatedButton.styleFrom(backgroundColor: _tealColor),
            child: const Text('Copy Link', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showContactSupportModal() {
    final nameController = TextEditingController();
    final emailController = TextEditingController();
    final messageController = TextEditingController();
    String selectedCategory = 'General Inquiry';
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    const Text('Contact Support', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const Spacer(),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildModalTextField('Name', 'Enter your name', nameController, Icons.person_outline),
                      const SizedBox(height: 16),
                      _buildModalTextField('Email', 'Enter your email', emailController, Icons.email_outlined),
                      const SizedBox(height: 16),
                      const Text('Issue Category', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(12)),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: selectedCategory,
                            isExpanded: true,
                            items: ['General Inquiry', 'Technical Issue', 'Billing', 'Account', 'Feature Request', 'Other']
                                .map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                            onChanged: (value) => setModalState(() => selectedCategory = value!),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildModalTextField('Message', 'Describe your issue...', messageController, Icons.message_outlined, maxLines: 5),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('File attachment coming soon!'))),
                        icon: const Icon(Icons.attach_file),
                        label: const Text('Attach File (Optional)'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          minimumSize: const Size(double.infinity, 48),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Support request submitted successfully!'), backgroundColor: _tealColor));
                          },
                          style: ElevatedButton.styleFrom(backgroundColor: _tealColor, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                          child: const Text('Submit Request', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModalTextField(String label, String hint, TextEditingController controller, IconData icon, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          maxLines: maxLines,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.black38),
            prefixIcon: maxLines == 1 ? Icon(icon, color: Colors.black38) : null,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _tealColor)),
          ),
        ),
      ],
    );
  }

  void _showBotDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: _tealColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.smart_toy, color: _tealColor),
            ),
            const SizedBox(width: 12),
            const Text('Support Bot'),
          ],
        ),
        content: const Text('Our AI support bot is ready to help you with common questions and issues. Would you like to start a conversation?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Not Now')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Starting chat with support bot...'), backgroundColor: _tealColor));
            },
            style: ElevatedButton.styleFrom(backgroundColor: _tealColor),
            child: const Text('Start Chat', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showReportProblemModal() {
    final descriptionController = TextEditingController();
    String selectedIssue = 'App Crash';
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
          child: Column(
            children: [
              Container(margin: const EdgeInsets.only(top: 12), width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    const Icon(Icons.bug_report, color: Colors.orange),
                    const SizedBox(width: 12),
                    const Text('Report a Problem', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const Spacer(),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Issue Type', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(12)),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: selectedIssue,
                            isExpanded: true,
                            items: ['App Crash', 'Slow Performance', 'UI Bug', 'Feature Not Working', 'Data Issue', 'Other']
                                .map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                            onChanged: (value) => setModalState(() => selectedIssue = value!),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildModalTextField('Description', 'Describe the problem in detail...', descriptionController, Icons.description_outlined, maxLines: 5),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Problem report submitted. Thank you!'), backgroundColor: _tealColor));
                          },
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                          child: const Text('Submit Report', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showRefundDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: Colors.purple.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.receipt_long, color: Colors.purple)),
            const SizedBox(width: 12),
            const Text('Request Refund'),
          ],
        ),
        content: const Text('To request a refund, please contact our support team with your purchase details. Refunds are processed within 7 business days.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _showContactSupportModal();
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.purple),
            child: const Text('Contact Support', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }


  void _showTroubleshootingWizard() {
    int currentStep = 0;
    String? selectedIssue;
    
    final issues = {
      'App Crashes': [
        'Force close the app and restart it',
        'Clear app cache in your device settings',
        'Update to the latest version from the app store',
        'Restart your device',
        'Reinstall the app if the problem persists',
      ],
      'Slow Responses': [
        'Check your internet connection speed',
        'Switch between WiFi and mobile data',
        'Close other apps running in the background',
        'Clear app cache to free up memory',
        'Try again during off-peak hours',
      ],
      'Login Issues': [
        'Verify your email and password are correct',
        'Use the "Forgot Password" option to reset',
        'Check if your account is verified',
        'Clear app data and try logging in again',
        'Contact support if you\'re still locked out',
      ],
      'Notification Problems': [
        'Check notification permissions in device settings',
        'Ensure notifications are enabled in app settings',
        'Disable battery optimization for this app',
        'Check Do Not Disturb settings',
        'Reinstall the app to reset notification settings',
      ],
      'AI Not Loading': [
        'Check your internet connection',
        'Verify you have remaining credits',
        'Clear app cache and restart',
        'Check if the service is under maintenance',
        'Try a simpler query first',
      ],
    };

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.8,
          decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
          child: Column(
            children: [
              Container(margin: const EdgeInsets.only(top: 12), width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    const Icon(Icons.build, color: Colors.orange),
                    const SizedBox(width: 12),
                    const Text('Troubleshooting Assistant', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const Spacer(),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                  ],
                ),
              ),
              // Step indicator
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: List.generate(3, (index) => Expanded(
                    child: Container(
                      height: 4,
                      margin: EdgeInsets.only(right: index < 2 ? 8 : 0),
                      decoration: BoxDecoration(
                        color: index <= currentStep ? _tealColor : Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  )),
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Step ${currentStep + 1} of 3', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                    Text(
                      currentStep == 0 ? 'Select Issue' : currentStep == 1 ? 'Solutions' : 'Need More Help?',
                      style: const TextStyle(color: _tealColor, fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: currentStep == 0
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Which issue are you experiencing?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 16),
                            ...issues.keys.map((issue) => _buildIssueOption(issue, selectedIssue == issue, () => setModalState(() => selectedIssue = issue))),
                          ],
                        )
                      : currentStep == 1
                          ? Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Solutions for: $selectedIssue', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                                const SizedBox(height: 16),
                                ...issues[selectedIssue]!.asMap().entries.map((entry) => _buildSolutionStep(entry.key + 1, entry.value)),
                              ],
                            )
                          : Column(
                              children: [
                                const Icon(Icons.help_outline, size: 64, color: _tealColor),
                                const SizedBox(height: 16),
                                const Text('Still need help?', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 8),
                                Text('If the solutions above didn\'t resolve your issue, our support team is here to help.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade600)),
                                const SizedBox(height: 24),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    onPressed: () {
                                      Navigator.pop(context);
                                      _showContactSupportModal();
                                    },
                                    icon: const Icon(Icons.email_outlined, color: Colors.white),
                                    label: const Text('Contact Support', style: TextStyle(color: Colors.white)),
                                    style: ElevatedButton.styleFrom(backgroundColor: _tealColor, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                                  ),
                                ),
                              ],
                            ),
                ),
              ),
              // Navigation buttons
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    if (currentStep > 0)
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => setModalState(() => currentStep--),
                          style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                          child: const Text('Back'),
                        ),
                      ),
                    if (currentStep > 0) const SizedBox(width: 12),
                    if (currentStep < 2)
                      Expanded(
                        child: ElevatedButton(
                          onPressed: selectedIssue != null || currentStep > 0 ? () => setModalState(() => currentStep++) : null,
                          style: ElevatedButton.styleFrom(backgroundColor: _tealColor, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                          child: Text(currentStep == 1 ? 'Still Need Help?' : 'Next', style: const TextStyle(color: Colors.white)),
                        ),
                      ),
                    if (currentStep == 2)
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => Navigator.pop(context),
                          style: ElevatedButton.styleFrom(backgroundColor: _tealColor, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                          child: const Text('Done', style: TextStyle(color: Colors.white)),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIssueOption(String issue, bool isSelected, VoidCallback onTap) {
    final icons = {
      'App Crashes': Icons.error_outline,
      'Slow Responses': Icons.speed,
      'Login Issues': Icons.lock_outline,
      'Notification Problems': Icons.notifications_off_outlined,
      'AI Not Loading': Icons.smart_toy_outlined,
    };
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isSelected ? _tealColor.withValues(alpha: 0.1) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isSelected ? _tealColor : Colors.grey.shade300),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(icons[issue] ?? Icons.help_outline, color: isSelected ? _tealColor : Colors.black54),
                const SizedBox(width: 16),
                Expanded(child: Text(issue, style: TextStyle(fontSize: 15, fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal, color: isSelected ? _tealColor : Colors.black87))),
                if (isSelected) const Icon(Icons.check_circle, color: _tealColor),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSolutionStep(int step, String solution) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(12)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(color: _tealColor, borderRadius: BorderRadius.circular(14)),
            child: Center(child: Text('$step', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14))),
          ),
          const SizedBox(width: 12),
          Expanded(child: Padding(padding: const EdgeInsets.only(top: 4), child: Text(solution, style: const TextStyle(fontSize: 14, height: 1.4)))),
        ],
      ),
    );
  }
}
