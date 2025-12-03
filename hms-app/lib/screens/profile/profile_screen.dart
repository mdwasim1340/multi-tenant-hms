import 'package:flutter/material.dart';
import '../../chat_history.dart';
import '../../main.dart' show themeProvider;
import '../../theme/theme_provider.dart';
import '../chat_history_screen.dart';

/// ProfileScreen - A comprehensive, premium profile center for MedChat AI
/// Now with full dark mode support

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with TickerProviderStateMixin {
  late AnimationController _heroAnimController;
  late Animation<double> _heroFadeAnimation;
  final ChatHistoryManager _historyManager = ChatHistoryManager();

  bool _notificationsEnabled = true;
  String _selectedLanguage = 'English';

  final Map<String, bool> _completionItems = {
    'Email verified': true,
    'Phone added': true,
    'Emergency contact': false,
    'Medical details': false,
  };

  final Map<String, String> _userData = {
    'name': 'Mark Johnson',
    'email': 'mark.johnson@email.com',
    'phone': '+1 (555) 123-4567',
    'dob': 'January 15, 1985',
    'gender': 'Male',
    'memberSince': '2024',
    'bio': 'Health-conscious individual focused on preventive care.',
  };

  final Map<String, String> _medicalInfo = {
    'bloodGroup': 'O+',
    'allergies': 'Penicillin, Peanuts',
    'medications': 'Vitamin D, Omega-3',
    'conditions': 'None',
  };

  final Map<String, String> _emergencyContact = {
    'name': 'Sarah Johnson',
    'phone': '+1 (555) 987-6543',
    'relation': 'Spouse',
  };

  final Map<String, dynamic> _subscriptionData = {
    'plan': 'Plus Plan',
    'renewalDate': 'January 1, 2025',
    'credits': 185,
    'totalCredits': 250,
  };

  final Map<String, dynamic> _usageData = {
    'lastDevice': 'iPhone 15 Pro',
    'lastActive': '2 hours ago',
  };

  final List<Map<String, dynamic>> _achievements = [
    {'title': 'First 10 Chats', 'icon': Icons.chat_bubble, 'earned': true},
    {'title': 'Safety First', 'icon': Icons.shield, 'earned': true},
    {'title': 'Active Member', 'icon': Icons.star, 'earned': true},
    {'title': 'Health Expert', 'icon': Icons.medical_services, 'earned': false},
  ];

  final List<Map<String, dynamic>> _activityTimeline = [
    {'event': 'Profile updated', 'time': '2 hours ago', 'icon': Icons.edit},
    {'event': 'Subscription renewed', 'time': '5 days ago', 'icon': Icons.credit_card},
    {'event': 'New device login', 'time': '1 week ago', 'icon': Icons.phone_android},
    {'event': 'Password changed', 'time': '2 weeks ago', 'icon': Icons.lock},
    {'event': 'Account created', 'time': 'Jan 2024', 'icon': Icons.person_add},
  ];

  final List<Map<String, dynamic>> _activeSessions = [
    {'device': 'iPhone 15 Pro', 'location': 'New York, US', 'current': true, 'lastActive': 'Now'},
    {'device': 'MacBook Pro', 'location': 'New York, US', 'current': false, 'lastActive': '1 hour ago'},
    {'device': 'iPad Air', 'location': 'Boston, US', 'current': false, 'lastActive': '3 days ago'},
  ];

  @override
  void initState() {
    super.initState();
    _heroAnimController = AnimationController(duration: const Duration(milliseconds: 800), vsync: this);
    _heroFadeAnimation = CurvedAnimation(parent: _heroAnimController, curve: Curves.easeOut);
    _heroAnimController.forward();
    _historyManager.addListener(_onHistoryChanged);
    themeProvider.addListener(_onThemeChanged);
  }

  void _onHistoryChanged() => setState(() {});
  void _onThemeChanged() => setState(() {});

  @override
  void dispose() {
    _historyManager.removeListener(_onHistoryChanged);
    themeProvider.removeListener(_onThemeChanged);
    _heroAnimController.dispose();
    super.dispose();
  }

  int get _completionPercentage {
    final completed = _completionItems.values.where((v) => v).length;
    return ((completed / _completionItems.length) * 100).round();
  }

  @override
  Widget build(BuildContext context) {
    // Use themeProvider directly for immediate updates
    final isDark = themeProvider.isDarkMode;
    final backgroundColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final dividerColor = isDark ? AppColors.darkDivider : AppColors.lightDivider;

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: _buildAppBar(cardColor, textPrimary, textSecondary),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeroHeader(),
            const SizedBox(height: 20),
            _buildProfileCompletionCard(cardColor, textPrimary, textSecondary, isDark),
            const SizedBox(height: 20),
            _buildAccountInfoSection(cardColor, textPrimary, textSecondary, dividerColor),
            const SizedBox(height: 20),
            _buildMedicalInfoCard(cardColor, textPrimary, textSecondary, dividerColor),
            const SizedBox(height: 20),
            _buildEmergencyContactCard(cardColor, textPrimary, textSecondary),
            const SizedBox(height: 20),
            _buildSubscriptionCard(),
            const SizedBox(height: 20),
            _buildUsageActivityCard(cardColor, textPrimary, textSecondary, isDark),
            const SizedBox(height: 20),
            _buildAppSettingsCard(cardColor, textPrimary, textSecondary, dividerColor, isDark),
            const SizedBox(height: 20),
            _buildAchievementsCard(cardColor, textPrimary, textSecondary, isDark),
            const SizedBox(height: 20),
            _buildActivityTimelineCard(cardColor, textPrimary, textSecondary, isDark),
            const SizedBox(height: 20),
            _buildLogoutSection(cardColor, isDark),
          ],
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(Color cardColor, Color textPrimary, Color textSecondary) {
    return AppBar(
      backgroundColor: cardColor,
      elevation: 1,
      leading: IconButton(icon: Icon(Icons.arrow_back, color: textPrimary), onPressed: () => Navigator.of(context).pop()),
      title: Text('Profile', style: TextStyle(color: textPrimary, fontSize: 18, fontWeight: FontWeight.w600)),
      actions: [IconButton(icon: Icon(Icons.edit_outlined, color: textSecondary), onPressed: _showEditProfileModal), const SizedBox(width: 8)],
    );
  }

  Widget _buildHeroHeader() {
    return FadeTransition(
      opacity: _heroFadeAnimation,
      child: Container(
        width: double.infinity,
        decoration: const BoxDecoration(gradient: LinearGradient(colors: [AppColors.tealPrimary, AppColors.tealLight], begin: Alignment.topLeft, end: Alignment.bottomRight)),
        padding: const EdgeInsets.fromLTRB(20, 32, 20, 28),
        child: Column(
          children: [
            Container(
              width: 90, height: 90,
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), shape: BoxShape.circle, border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 3)),
              child: Center(child: Text(_userData['name']!.split(' ').map((n) => n[0]).take(2).join(), style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold))),
            ),
            const SizedBox(height: 16),
            Text(_userData['name']!, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 4),
            Text(_userData['email']!, style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.9))),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20)),
              child: Text('Member since ${_userData['memberSince']}', style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w500)),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _showEditProfileModal,
              icon: const Icon(Icons.edit, size: 18),
              label: const Text('Edit Profile'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.tealPrimary, padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)), elevation: 0),
            ),
          ],
        ),
      ),
    );
  }


  Widget _buildProfileCompletionCard(Color cardColor, Color textPrimary, Color textSecondary, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05), blurRadius: 10, offset: const Offset(0, 2))]),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Profile Completion', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary)),
              Text('$_completionPercentage%', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.tealPrimary)),
            ]),
            const SizedBox(height: 16),
            ClipRRect(borderRadius: BorderRadius.circular(8), child: LinearProgressIndicator(value: _completionPercentage / 100, backgroundColor: isDark ? Colors.grey.shade700 : Colors.grey.shade200, valueColor: const AlwaysStoppedAnimation<Color>(AppColors.tealPrimary), minHeight: 10)),
            const SizedBox(height: 16),
            ..._completionItems.entries.map((entry) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(children: [
                Icon(entry.value ? Icons.check_circle : Icons.cancel, size: 20, color: entry.value ? AppColors.tealPrimary : (isDark ? Colors.grey.shade600 : Colors.grey.shade400)),
                const SizedBox(width: 12),
                Text(entry.key, style: TextStyle(fontSize: 14, color: entry.value ? textPrimary : textSecondary)),
                if (!entry.value) ...[const Spacer(), TextButton(onPressed: () => _showSnackBar('Add ${entry.key.toLowerCase()}'), style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap), child: const Text('Add', style: TextStyle(color: AppColors.tealPrimary, fontSize: 13)))],
              ]),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildAccountInfoSection(Color cardColor, Color textPrimary, Color textSecondary, Color dividerColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))]),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(padding: const EdgeInsets.fromLTRB(20, 20, 20, 12), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Personal Information', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary)),
            IconButton(icon: const Icon(Icons.edit_outlined, size: 20, color: AppColors.tealPrimary), onPressed: _showEditProfileModal),
          ])),
          _buildInfoRow(Icons.person_outline, 'Full Name', _userData['name']!, textPrimary, textSecondary, dividerColor),
          _buildInfoRow(Icons.email_outlined, 'Email', _userData['email']!, textPrimary, textSecondary, dividerColor),
          _buildInfoRow(Icons.phone_outlined, 'Phone', _userData['phone']!, textPrimary, textSecondary, dividerColor),
          _buildInfoRow(Icons.cake_outlined, 'Date of Birth', _userData['dob']!, textPrimary, textSecondary, dividerColor),
          _buildInfoRow(Icons.wc_outlined, 'Gender', _userData['gender']!, textPrimary, textSecondary, dividerColor, isLast: true),
        ]),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, Color textPrimary, Color textSecondary, Color dividerColor, {bool isLast = false}) {
    return Column(children: [
      Padding(padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14), child: Row(children: [
        Icon(icon, size: 22, color: textSecondary),
        const SizedBox(width: 16),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: TextStyle(fontSize: 12, color: textSecondary)),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(fontSize: 14, color: textPrimary, fontWeight: FontWeight.w500)),
        ])),
      ])),
      if (!isLast) Divider(height: 1, indent: 56, endIndent: 16, color: dividerColor),
    ]);
  }

  Widget _buildMedicalInfoCard(Color cardColor, Color textPrimary, Color textSecondary, Color dividerColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))]),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(padding: const EdgeInsets.fromLTRB(20, 20, 20, 12), child: Row(children: [
            Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.medical_services_outlined, color: Colors.red, size: 20)),
            const SizedBox(width: 12),
            Expanded(child: Text('Medical Information', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary))),
            TextButton(onPressed: () => _showSnackBar('Manage medical info'), child: const Text('Manage', style: TextStyle(color: AppColors.tealPrimary))),
          ])),
          _buildMedicalRow('Blood Group', _medicalInfo['bloodGroup']!, textPrimary, textSecondary, dividerColor),
          _buildMedicalRow('Allergies', _medicalInfo['allergies']!, textPrimary, textSecondary, dividerColor),
          _buildMedicalRow('Medications', _medicalInfo['medications']!, textPrimary, textSecondary, dividerColor),
          _buildMedicalRow('Chronic Conditions', _medicalInfo['conditions']!, textPrimary, textSecondary, dividerColor, isLast: true),
        ]),
      ),
    );
  }

  Widget _buildMedicalRow(String label, String value, Color textPrimary, Color textSecondary, Color dividerColor, {bool isLast = false}) {
    return Column(children: [
      Padding(padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: TextStyle(fontSize: 14, color: textSecondary)),
        Flexible(child: Text(value, style: TextStyle(fontSize: 14, color: textPrimary, fontWeight: FontWeight.w500), textAlign: TextAlign.end)),
      ])),
      if (!isLast) Divider(height: 1, indent: 20, endIndent: 20, color: dividerColor),
    ]);
  }

  Widget _buildEmergencyContactCard(Color cardColor, Color textPrimary, Color textSecondary) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))]),
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.emergency_outlined, color: Colors.orange, size: 20)),
            const SizedBox(width: 12),
            Expanded(child: Text('Emergency Contact', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary))),
            TextButton(onPressed: () => _showSnackBar('Edit emergency contact'), child: const Text('Edit', style: TextStyle(color: AppColors.tealPrimary))),
          ]),
          const SizedBox(height: 16),
          Row(children: [
            CircleAvatar(radius: 24, backgroundColor: Colors.orange.withValues(alpha: 0.1), child: Text(_emergencyContact['name']!.split(' ').map((n) => n[0]).take(2).join(), style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.bold))),
            const SizedBox(width: 16),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(_emergencyContact['name']!, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: textPrimary)),
              const SizedBox(height: 2),
              Text('${_emergencyContact['relation']} • ${_emergencyContact['phone']}', style: TextStyle(fontSize: 13, color: textSecondary)),
            ])),
            IconButton(icon: const Icon(Icons.phone, color: AppColors.tealPrimary), onPressed: () => _showSnackBar('Calling emergency contact...')),
          ]),
        ]),
      ),
    );
  }

  Widget _buildSubscriptionCard() {
    final credits = _subscriptionData['credits'] as int;
    final totalCredits = _subscriptionData['totalCredits'] as int;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(gradient: const LinearGradient(colors: [AppColors.tealPrimary, AppColors.tealLight], begin: Alignment.topLeft, end: Alignment.bottomRight), borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: AppColors.tealPrimary.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4))]),
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Current Plan', style: TextStyle(fontSize: 12, color: Colors.white70)),
              const SizedBox(height: 4),
              Text(_subscriptionData['plan'] as String, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
            ]),
            Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.workspace_premium, color: Colors.white, size: 28)),
          ]),
          const SizedBox(height: 20),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Renewal', style: TextStyle(fontSize: 12, color: Colors.white70)), const SizedBox(height: 4), Text(_subscriptionData['renewalDate'] as String, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white))]),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Credits', style: TextStyle(fontSize: 12, color: Colors.white70)), const SizedBox(height: 4), Text('$credits / $totalCredits', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white))]),
          ]),
          const SizedBox(height: 16),
          ClipRRect(borderRadius: BorderRadius.circular(4), child: LinearProgressIndicator(value: credits / totalCredits, backgroundColor: Colors.white.withValues(alpha: 0.3), valueColor: const AlwaysStoppedAnimation<Color>(Colors.white), minHeight: 6)),
          const SizedBox(height: 20),
          SizedBox(width: double.infinity, child: ElevatedButton(onPressed: () => Navigator.pushNamed(context, '/subscription'), style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.tealPrimary, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0), child: const Text('Manage Subscription', style: TextStyle(fontWeight: FontWeight.w600)))),
        ]),
      ),
    );
  }

  Widget _buildUsageActivityCard(Color cardColor, Color textPrimary, Color textSecondary, bool isDark) {
    final sessions = _historyManager.sessions;
    final totalChats = sessions.length;
    final totalMessages = sessions.fold<int>(0, (sum, session) => sum + session.messages.length);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))]),
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Usage & Activity', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary)),
            TextButton(onPressed: _navigateToChatHistory, child: const Text('View All', style: TextStyle(color: AppColors.tealPrimary))),
          ]),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(child: _buildUsageStat(Icons.chat_bubble_outline, 'Total Chats', '$totalChats', Colors.blue, isDark)),
            const SizedBox(width: 12),
            Expanded(child: _buildUsageStat(Icons.message_outlined, 'Messages', '$totalMessages', Colors.purple, isDark)),
          ]),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: isDark ? AppColors.darkSurface : Colors.grey.shade50, borderRadius: BorderRadius.circular(12)),
            child: Row(children: [
              Icon(Icons.phone_android, color: textSecondary, size: 24),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Recently Active Device', style: TextStyle(fontSize: 12, color: textSecondary)),
                const SizedBox(height: 2),
                Text(_usageData['lastDevice'] as String, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimary)),
              ])),
              Text(_usageData['lastActive'] as String, style: TextStyle(fontSize: 12, color: textSecondary)),
            ]),
          ),
        ]),
      ),
    );
  }

  Widget _buildUsageStat(IconData icon, String label, String value, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: color.withValues(alpha: isDark ? 0.15 : 0.08), borderRadius: BorderRadius.circular(12)),
      child: Column(children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 8),
        Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextSecondary : Colors.black54)),
      ]),
    );
  }

  void _navigateToChatHistory() {
    Navigator.push(context, MaterialPageRoute(builder: (context) => ChatHistoryScreen(onSessionSelected: (session) => Navigator.popUntil(context, (route) => route.isFirst))));
  }


  Widget _buildAppSettingsCard(Color cardColor, Color textPrimary, Color textSecondary, Color dividerColor, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))]),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(padding: const EdgeInsets.fromLTRB(20, 20, 20, 12), child: Text('App Settings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary))),
          _buildSettingToggle(Icons.notifications_outlined, 'Notifications', 'Receive health tips and reminders', _notificationsEnabled, (value) => setState(() => _notificationsEnabled = value), textPrimary, textSecondary),
          Divider(height: 1, indent: 56, endIndent: 16, color: dividerColor),
          _buildSettingToggle(Icons.dark_mode_outlined, 'Dark Mode', 'Switch to dark theme', themeProvider.isDarkMode, (value) => themeProvider.toggleDarkMode(value), textPrimary, textSecondary),
          Divider(height: 1, indent: 56, endIndent: 16, color: dividerColor),
          _buildSettingItem(Icons.language_outlined, 'Language', _selectedLanguage, _showLanguageSelector, textPrimary, textSecondary),
          Divider(height: 1, indent: 56, endIndent: 16, color: dividerColor),
          _buildSettingItem(Icons.lock_outline, 'Security & Privacy', '', () => Navigator.pushNamed(context, '/privacy-security'), textPrimary, textSecondary),
          Divider(height: 1, indent: 56, endIndent: 16, color: dividerColor),
          _buildSettingItem(Icons.devices_outlined, 'Manage Devices & Sessions', '', _showSessionsModal, textPrimary, textSecondary),
          Divider(height: 1, indent: 56, endIndent: 16, color: dividerColor),
          _buildSettingItem(Icons.chat_bubble_outline, 'Contact Support', '', () => Navigator.pushNamed(context, '/contact-support'), textPrimary, textSecondary),
          Divider(height: 1, indent: 56, endIndent: 16, color: dividerColor),
          _buildSettingItem(Icons.help_outline, 'FAQ & Support', '', () => Navigator.pushNamed(context, '/faq-support'), textPrimary, textSecondary),
        ]),
      ),
    );
  }

  Widget _buildSettingToggle(IconData icon, String title, String subtitle, bool value, Function(bool) onChanged, Color textPrimary, Color textSecondary) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(children: [
        Icon(icon, size: 22, color: textSecondary),
        const SizedBox(width: 16),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimary)),
          Text(subtitle, style: TextStyle(fontSize: 12, color: textSecondary)),
        ])),
        Switch(
          value: value,
          onChanged: onChanged,
          activeTrackColor: AppColors.tealPrimary.withValues(alpha: 0.5),
          thumbColor: WidgetStateProperty.resolveWith((states) => states.contains(WidgetState.selected) ? AppColors.tealPrimary : null),
        ),
      ]),
    );
  }

  Widget _buildSettingItem(IconData icon, String title, String value, VoidCallback onTap, Color textPrimary, Color textSecondary) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Row(children: [
            Icon(icon, size: 22, color: textSecondary),
            const SizedBox(width: 16),
            Expanded(child: Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimary))),
            if (value.isNotEmpty) Text(value, style: TextStyle(fontSize: 13, color: textSecondary)),
            const SizedBox(width: 8),
            Icon(Icons.chevron_right, size: 20, color: textSecondary),
          ]),
        ),
      ),
    );
  }

  Widget _buildAchievementsCard(Color cardColor, Color textPrimary, Color textSecondary, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))]),
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.emoji_events, color: Colors.amber, size: 20)),
            const SizedBox(width: 12),
            Text('Achievements & Badges', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary)),
          ]),
          const SizedBox(height: 16),
          Wrap(spacing: 12, runSpacing: 12, children: _achievements.map((a) => _buildAchievementBadge(a, isDark)).toList()),
        ]),
      ),
    );
  }

  Widget _buildAchievementBadge(Map<String, dynamic> achievement, bool isDark) {
    final earned = achievement['earned'] as bool;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: earned ? AppColors.tealPrimary.withValues(alpha: 0.1) : (isDark ? Colors.grey.shade800 : Colors.grey.shade100),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: earned ? AppColors.tealPrimary.withValues(alpha: 0.3) : (isDark ? Colors.grey.shade700 : Colors.grey.shade300)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(achievement['icon'] as IconData, size: 18, color: earned ? AppColors.tealPrimary : (isDark ? Colors.grey.shade500 : Colors.grey.shade400)),
        const SizedBox(width: 8),
        Text(achievement['title'] as String, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: earned ? AppColors.tealPrimary : (isDark ? Colors.grey.shade400 : Colors.grey.shade500))),
        if (earned) ...[const SizedBox(width: 6), const Icon(Icons.check_circle, size: 14, color: AppColors.tealPrimary)],
      ]),
    );
  }

  Widget _buildActivityTimelineCard(Color cardColor, Color textPrimary, Color textSecondary, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))]),
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: Colors.blue.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.timeline, color: Colors.blue, size: 20)),
            const SizedBox(width: 12),
            Text('Activity Timeline', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary)),
          ]),
          const SizedBox(height: 16),
          ..._activityTimeline.asMap().entries.map((entry) => _buildTimelineItem(entry.value, entry.key == _activityTimeline.length - 1, textPrimary, textSecondary, isDark)),
        ]),
      ),
    );
  }

  Widget _buildTimelineItem(Map<String, dynamic> item, bool isLast, Color textPrimary, Color textSecondary, bool isDark) {
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Column(children: [
        Container(width: 32, height: 32, decoration: BoxDecoration(color: AppColors.tealPrimary.withValues(alpha: 0.1), shape: BoxShape.circle), child: Icon(item['icon'] as IconData, size: 16, color: AppColors.tealPrimary)),
        if (!isLast) Container(width: 2, height: 32, color: isDark ? Colors.grey.shade700 : Colors.grey.shade200),
      ]),
      const SizedBox(width: 12),
      Expanded(child: Padding(padding: EdgeInsets.only(bottom: isLast ? 0 : 16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(item['event'] as String, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimary)),
        const SizedBox(height: 2),
        Text(item['time'] as String, style: TextStyle(fontSize: 12, color: textSecondary)),
      ]))),
    ]);
  }

  Widget _buildLogoutSection(Color cardColor, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))]),
        child: Column(children: [
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: _showLogoutConfirmation,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: const Padding(padding: EdgeInsets.symmetric(horizontal: 20, vertical: 16), child: Row(children: [Icon(Icons.logout, size: 22, color: AppColors.redAccent), SizedBox(width: 16), Text('Log Out', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: AppColors.redAccent))])),
            ),
          ),
          Divider(height: 1, color: isDark ? AppColors.darkDivider : AppColors.lightDivider),
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: _showDeleteAccountConfirmation,
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
              child: Padding(padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16), child: Row(children: [Icon(Icons.delete_forever, size: 22, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600), const SizedBox(width: 16), Text('Delete Account', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600))])),
            ),
          ),
        ]),
      ),
    );
  }


  // ============ MODALS & DIALOGS ============

  void _showEditProfileModal() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final dividerColor = isDark ? AppColors.darkDivider : AppColors.lightDivider;

    final nameController = TextEditingController(text: _userData['name']);
    final bioController = TextEditingController(text: _userData['bio']);
    final phoneController = TextEditingController(text: _userData['phone']);
    String selectedGender = _userData['gender']!;
    String selectedDob = _userData['dob']!;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: BoxDecoration(color: cardColor, borderRadius: const BorderRadius.vertical(top: Radius.circular(24))),
          child: Column(children: [
            Container(margin: const EdgeInsets.only(top: 12), width: 40, height: 4, decoration: BoxDecoration(color: dividerColor, borderRadius: BorderRadius.circular(2))),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel', style: TextStyle(color: textSecondary))),
                Text('Edit Profile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary)),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _userData['name'] = nameController.text;
                      _userData['bio'] = bioController.text;
                      _userData['phone'] = phoneController.text;
                      _userData['gender'] = selectedGender;
                      _userData['dob'] = selectedDob;
                    });
                    Navigator.pop(context);
                    _showSnackBar('Profile updated successfully');
                  },
                  child: const Text('Save', style: TextStyle(color: AppColors.tealPrimary, fontWeight: FontWeight.w600)),
                ),
              ]),
            ),
            Divider(height: 1, color: dividerColor),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Center(
                    child: GestureDetector(
                      onTap: () => _showSnackBar('Avatar picker - coming soon'),
                      child: Stack(children: [
                        Container(
                          width: 100, height: 100,
                          decoration: BoxDecoration(color: AppColors.tealPrimary.withValues(alpha: 0.1), shape: BoxShape.circle),
                          child: Center(child: Text(nameController.text.split(' ').map((n) => n.isNotEmpty ? n[0] : '').take(2).join(), style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: AppColors.tealPrimary))),
                        ),
                        Positioned(bottom: 0, right: 0, child: Container(padding: const EdgeInsets.all(8), decoration: const BoxDecoration(color: AppColors.tealPrimary, shape: BoxShape.circle), child: const Icon(Icons.camera_alt, size: 18, color: Colors.white))),
                      ]),
                    ),
                  ),
                  const SizedBox(height: 32),
                  _buildEditField('Full Name *', nameController, Icons.person_outline, textPrimary, textSecondary, isDark),
                  const SizedBox(height: 20),
                  _buildEditField('Bio', bioController, Icons.info_outline, textPrimary, textSecondary, isDark, maxLines: 3),
                  const SizedBox(height: 20),
                  _buildEditField('Phone', phoneController, Icons.phone_outlined, textPrimary, textSecondary, isDark, keyboardType: TextInputType.phone),
                  const SizedBox(height: 20),
                  Text('Gender', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimary)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(border: Border.all(color: dividerColor), borderRadius: BorderRadius.circular(12), color: isDark ? AppColors.darkSurface : null),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: selectedGender,
                        isExpanded: true,
                        dropdownColor: cardColor,
                        style: TextStyle(color: textPrimary, fontSize: 15),
                        items: ['Male', 'Female', 'Other', 'Prefer not to say'].map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
                        onChanged: (value) => setModalState(() => selectedGender = value!),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text('Date of Birth', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimary)),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: DateTime(1985, 1, 15),
                        firstDate: DateTime(1900),
                        lastDate: DateTime.now(),
                        builder: (context, child) => Theme(data: Theme.of(context).copyWith(colorScheme: isDark ? const ColorScheme.dark(primary: AppColors.tealPrimary, surface: AppColors.darkCard) : const ColorScheme.light(primary: AppColors.tealPrimary)), child: child!),
                      );
                      if (date != null) setModalState(() => selectedDob = '${_monthName(date.month)} ${date.day}, ${date.year}');
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      decoration: BoxDecoration(border: Border.all(color: dividerColor), borderRadius: BorderRadius.circular(12), color: isDark ? AppColors.darkSurface : null),
                      child: Row(children: [
                        Icon(Icons.cake_outlined, color: textSecondary),
                        const SizedBox(width: 12),
                        Text(selectedDob, style: TextStyle(fontSize: 15, color: textPrimary)),
                        const Spacer(),
                        Icon(Icons.calendar_today, size: 20, color: textSecondary),
                      ]),
                    ),
                  ),
                ]),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _buildEditField(String label, TextEditingController controller, IconData icon, Color textPrimary, Color textSecondary, bool isDark, {int maxLines = 1, TextInputType? keyboardType}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimary)),
      const SizedBox(height: 8),
      TextField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboardType,
        style: TextStyle(color: textPrimary),
        decoration: InputDecoration(
          prefixIcon: maxLines == 1 ? Icon(icon, color: textSecondary) : null,
          filled: true,
          fillColor: isDark ? AppColors.darkSurface : Colors.white,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: isDark ? AppColors.darkDivider : Colors.grey.shade300)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: isDark ? AppColors.darkDivider : Colors.grey.shade300)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.tealPrimary, width: 2)),
          contentPadding: maxLines > 1 ? const EdgeInsets.all(16) : null,
        ),
      ),
    ]);
  }

  String _monthName(int month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  }

  void _showLanguageSelector() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final dividerColor = isDark ? AppColors.darkDivider : AppColors.lightDivider;

    final languages = ['English', 'Español', 'Français', '中文', 'हिन्दी'];
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(color: cardColor, borderRadius: const BorderRadius.vertical(top: Radius.circular(24))),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(margin: const EdgeInsets.only(top: 12), width: 40, height: 4, decoration: BoxDecoration(color: dividerColor, borderRadius: BorderRadius.circular(2))),
          Padding(padding: const EdgeInsets.all(20), child: Text('Select Language', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary))),
          Divider(height: 1, color: dividerColor),
          ...languages.map((lang) => ListTile(
            title: Text(lang, style: TextStyle(color: textPrimary)),
            trailing: _selectedLanguage == lang ? const Icon(Icons.check, color: AppColors.tealPrimary) : null,
            onTap: () { setState(() => _selectedLanguage = lang); Navigator.pop(context); _showSnackBar('Language changed to $lang'); },
          )),
          const SizedBox(height: 20),
        ]),
      ),
    );
  }

  void _showSessionsModal() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final dividerColor = isDark ? AppColors.darkDivider : AppColors.lightDivider;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.6,
        decoration: BoxDecoration(color: cardColor, borderRadius: const BorderRadius.vertical(top: Radius.circular(24))),
        child: Column(children: [
          Container(margin: const EdgeInsets.only(top: 12), width: 40, height: 4, decoration: BoxDecoration(color: dividerColor, borderRadius: BorderRadius.circular(2))),
          Padding(padding: const EdgeInsets.all(20), child: Text('Active Sessions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary))),
          Divider(height: 1, color: dividerColor),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _activeSessions.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final session = _activeSessions[index];
                final isCurrent = session['current'] as bool;
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isCurrent ? AppColors.tealPrimary.withValues(alpha: 0.05) : (isDark ? AppColors.darkSurface : Colors.grey.shade50),
                    borderRadius: BorderRadius.circular(12),
                    border: isCurrent ? Border.all(color: AppColors.tealPrimary.withValues(alpha: 0.3)) : null,
                  ),
                  child: Row(children: [
                    Icon(session['device'].toString().contains('iPhone') ? Icons.phone_iphone : session['device'].toString().contains('iPad') ? Icons.tablet_mac : Icons.laptop_mac, color: isCurrent ? AppColors.tealPrimary : textSecondary, size: 28),
                    const SizedBox(width: 16),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Text(session['device'] as String, style: TextStyle(fontWeight: FontWeight.w600, color: textPrimary)),
                        if (isCurrent) ...[const SizedBox(width: 8), Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: AppColors.tealPrimary, borderRadius: BorderRadius.circular(10)), child: const Text('Current', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)))],
                      ]),
                      const SizedBox(height: 4),
                      Text('${session['location']} • ${session['lastActive']}', style: TextStyle(fontSize: 12, color: textSecondary)),
                    ])),
                    if (!isCurrent) IconButton(icon: const Icon(Icons.logout, color: AppColors.redAccent, size: 20), onPressed: () { Navigator.pop(context); _showSnackBar('Session terminated'); }),
                  ]),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () { Navigator.pop(context); _showSnackBar('All other sessions terminated'); },
                style: OutlinedButton.styleFrom(foregroundColor: AppColors.redAccent, side: const BorderSide(color: AppColors.redAccent), padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: const Text('Sign Out All Other Sessions'),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  void _showLogoutConfirmation() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Log Out', style: TextStyle(fontWeight: FontWeight.bold, color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary)),
        content: Text('Are you sure you want to log out of your account?', style: TextStyle(color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel', style: TextStyle(color: isDark ? AppColors.darkTextSecondary : Colors.black54))),
          ElevatedButton(
            onPressed: () { Navigator.pop(context); Navigator.pushNamedAndRemoveUntil(context, '/sign-in', (route) => false); },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.redAccent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountConfirmation() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    bool understood = false;
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(children: [
            const Icon(Icons.warning_amber_rounded, color: AppColors.redAccent, size: 28),
            const SizedBox(width: 12),
            Text('Delete Account', style: TextStyle(fontWeight: FontWeight.bold, color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary)),
          ]),
          content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('This action is permanent and cannot be undone. All your data will be permanently deleted, including:', style: TextStyle(fontSize: 14, color: isDark ? AppColors.darkTextSecondary : Colors.black87)),
            const SizedBox(height: 16),
            _buildDeleteWarningItem('Chat history and saved conversations', isDark),
            _buildDeleteWarningItem('Medical information and preferences', isDark),
            _buildDeleteWarningItem('Subscription and payment history', isDark),
            _buildDeleteWarningItem('Account settings and achievements', isDark),
            const SizedBox(height: 20),
            Row(children: [
              Checkbox(value: understood, onChanged: (value) => setDialogState(() => understood = value!), activeColor: AppColors.redAccent),
              Expanded(child: Text('I understand the consequences', style: TextStyle(fontSize: 13, color: isDark ? AppColors.darkTextPrimary : Colors.black87))),
            ]),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel', style: TextStyle(color: isDark ? AppColors.darkTextSecondary : Colors.black54))),
            ElevatedButton(
              onPressed: understood ? () { Navigator.pop(context); _showSnackBar('Account deletion requested'); Navigator.pushNamedAndRemoveUntil(context, '/sign-in', (route) => false); } : null,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.redAccent, disabledBackgroundColor: isDark ? Colors.grey.shade700 : Colors.grey.shade300, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
              child: const Text('Delete Account'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDeleteWarningItem(String text, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Icon(Icons.remove_circle_outline, size: 16, color: AppColors.redAccent),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: TextStyle(fontSize: 13, color: isDark ? AppColors.darkTextSecondary : Colors.black54))),
      ]),
    );
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [const Icon(Icons.check_circle, color: Colors.white, size: 20), const SizedBox(width: 8), Text(message)]),
      backgroundColor: AppColors.tealPrimary,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      duration: const Duration(seconds: 2),
    ));
  }
}
