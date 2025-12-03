import 'package:flutter/material.dart';
import '../theme/theme_provider.dart';
import '../main.dart' show themeProvider;

/// ContactSupportScreen - A polished, accessible contact support screen
/// that matches the design and interaction style of FaqSupportScreen.
///
/// Route Integration:
/// ```dart
/// // routes: {
/// //   '/': (ctx) => HomeScreen(),
/// //   '/faq-support': (ctx) => FaqSupportScreen(),
/// //   '/contact-support': (ctx) => ContactSupportScreen(),
/// // }
/// ```
///
/// Or in onGenerateRoute:
/// ```dart
/// if (settings.name == '/contact-support') {
///   return MaterialPageRoute(builder: (context) => const ContactSupportScreen());
/// }
/// ```

class ContactSupportScreen extends StatefulWidget {
  const ContactSupportScreen({super.key});

  @override
  State<ContactSupportScreen> createState() => _ContactSupportScreenState();
}

class _ContactSupportScreenState extends State<ContactSupportScreen> {
  // Design constants - using theme provider
  static const Color _tealColor = AppColors.tealPrimary;
  static const Color _tealLight = AppColors.tealLight;

  // Form controllers
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();

  // Form state
  String _selectedCategory = 'Technical';
  String _selectedPriority = 'Normal';
  final List<String> _attachedFiles = [];
  bool _simulateError = false;
  bool _isSubmitting = false;
  bool _showTicketHistory = false;

  // Categories matching FAQ categories
  final List<String> _categories = [
    'Account', 'Subscription', 'Technical', 'Billing', 'Medical Safety', 'Other'
  ];

  final List<String> _priorities = ['Low', 'Normal', 'High'];

  // Dummy ticket history data
  final List<Map<String, dynamic>> _ticketHistory = [
    {'id': 'TKT-2024-001', 'subject': 'Login issues on mobile', 'status': 'Resolved', 'time': '2 days ago'},
    {'id': 'TKT-2024-002', 'subject': 'Subscription renewal question', 'status': 'Open', 'time': '5 hours ago'},
    {'id': 'TKT-2024-003', 'subject': 'AI response accuracy concern', 'status': 'Pending', 'time': '1 day ago'},
  ];

  // Suggested FAQ questions
  final List<Map<String, String>> _suggestedFaqs = [
    {'question': 'How do I reset my password?', 'category': 'Account'},
    {'question': 'What\'s included in each subscription plan?', 'category': 'Subscription'},
    {'question': 'The app isn\'t responding — what should I do?', 'category': 'Troubleshooting'},
    {'question': 'How is my health information protected?', 'category': 'Data & Privacy'},
    {'question': 'Is MedChat AI safe for medical advice?', 'category': 'AI & Medical Safety'},
  ];

  @override
  void initState() {
    super.initState();
    themeProvider.addListener(_onThemeChanged);
  }

  void _onThemeChanged() => setState(() {});

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _subjectController.dispose();
    _messageController.dispose();
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
    final isWideScreen = MediaQuery.of(context).size.width > 800;

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: _buildAppBar(cardColor, textPrimary, textSecondary),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeroHeader(),
            _buildQuickContactButtons(),
            if (isWideScreen)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(flex: 3, child: _buildContactForm()),
                    const SizedBox(width: 16),
                    Expanded(flex: 2, child: _buildSuggestedHelp()),
                  ],
                ),
              )
            else ...[
              _buildContactForm(),
              _buildSuggestedHelp(),
            ],
            _buildTicketHistorySection(),
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
        tooltip: 'Go back',
      ),
      title: Text(
        'Contact Support',
        style: TextStyle(color: textPrimary, fontWeight: FontWeight.w600, fontSize: 18),
      ),
      actions: [
        IconButton(
          icon: Icon(Icons.attach_file, color: textSecondary),
          onPressed: () => _showAttachmentHint(),
          tooltip: 'Attach files',
        ),
        PopupMenuButton<String>(
          icon: Icon(Icons.more_vert, color: textSecondary),
          onSelected: (value) {
            if (value == 'simulate_error') {
              setState(() => _simulateError = !_simulateError);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(_simulateError ? 'Error simulation enabled' : 'Error simulation disabled'),
                  duration: const Duration(seconds: 1),
                ),
              );
            }
          },
          itemBuilder: (context) => [
            PopupMenuItem(
              value: 'simulate_error',
              child: Row(
                children: [
                  Icon(_simulateError ? Icons.check_box : Icons.check_box_outline_blank, size: 20),
                  const SizedBox(width: 8),
                  const Text('Simulate Error'),
                ],
              ),
            ),
          ],
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
            'Contact Support',
            style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'We\'re here to help — tell us what happened and we\'ll respond quickly.',
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
    return Semantics(
      label: label,
      child: Container(
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
      ),
    );
  }

  Widget _buildQuickContactButtons() {
    final isDark = themeProvider.isDarkMode;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Quick Contact', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildQuickContactCard(Icons.email_outlined, 'Email\nSupport', Colors.blue, _scrollToForm)),
              const SizedBox(width: 12),
              Expanded(child: _buildQuickContactCard(Icons.smart_toy_outlined, 'Live\nChat', _tealColor, _showLiveChatModal)),
              const SizedBox(width: 12),
              Expanded(child: _buildQuickContactCard(Icons.phone_outlined, 'Call\nSupport', Colors.green, _showCallSupportModal)),
            ],
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildQuickContactCard(IconData icon, String label, Color color, VoidCallback onTap) {
    final isDark = themeProvider.isDarkMode;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    return Semantics(
      button: true,
      label: label.replaceAll('\n', ' '),
      child: Material(
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
      ),
    );
  }


  Widget _buildContactForm() {
    final isDark = themeProvider.isDarkMode;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Container(
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Contact Form', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary)),
                const SizedBox(height: 20),
                
                // Full Name (required)
                _buildFormField(
                  label: 'Full Name',
                  hint: 'Enter your full name',
                  controller: _nameController,
                  icon: Icons.person_outline,
                  required: true,
                  validator: (value) => value?.isEmpty ?? true ? 'Name is required' : null,
                ),
                const SizedBox(height: 16),
                
                // Email (required)
                _buildFormField(
                  label: 'Email',
                  hint: 'Enter your email address',
                  controller: _emailController,
                  icon: Icons.email_outlined,
                  required: true,
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value?.isEmpty ?? true) return 'Email is required';
                    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
                    if (!emailRegex.hasMatch(value!)) return 'Enter a valid email address';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // Phone (optional)
                _buildFormField(
                  label: 'Phone (Optional)',
                  hint: 'Enter your phone number',
                  controller: _phoneController,
                  icon: Icons.phone_outlined,
                  required: false,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),
                
                // Issue Category dropdown
                _buildDropdownField(
                  label: 'Issue Category',
                  value: _selectedCategory,
                  items: _categories,
                  onChanged: (value) => setState(() => _selectedCategory = value!),
                ),
                const SizedBox(height: 16),
                
                // Subject
                _buildFormField(
                  label: 'Subject',
                  hint: 'Brief description of your issue',
                  controller: _subjectController,
                  icon: Icons.subject,
                  required: true,
                  validator: (value) => value?.isEmpty ?? true ? 'Subject is required' : null,
                ),
                const SizedBox(height: 16),
                
                // Message (multiline)
                _buildFormField(
                  label: 'Message',
                  hint: 'Describe your issue in detail...',
                  controller: _messageController,
                  icon: Icons.message_outlined,
                  required: true,
                  maxLines: 5,
                  validator: (value) => value?.isEmpty ?? true ? 'Message is required' : null,
                ),
                const SizedBox(height: 16),
                
                // Attach files button
                _buildAttachFilesButton(),
                if (_attachedFiles.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _buildAttachedFilesList(),
                ],
                const SizedBox(height: 16),
                
                // Priority selector
                _buildPrioritySelector(),
                const SizedBox(height: 24),
                
                // Submit button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _submitForm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _tealColor,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      disabledBackgroundColor: _tealColor.withValues(alpha: 0.5),
                    ),
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Text('Send to Support', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFormField({
    required String label,
    required String hint,
    required TextEditingController controller,
    required IconData icon,
    required bool required,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    final isDark = themeProvider.isDarkMode;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final borderColor = isDark ? AppColors.darkDivider : Colors.grey.shade300;
    final fillColor = isDark ? AppColors.darkSurface : Colors.white;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimary)),
            if (required) const Text(' *', style: TextStyle(color: Colors.red, fontSize: 14)),
          ],
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          validator: validator,
          style: TextStyle(color: textPrimary),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: textSecondary),
            prefixIcon: maxLines == 1 ? Icon(icon, color: textSecondary) : null,
            filled: true,
            fillColor: fillColor,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderColor)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderColor)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _tealColor)),
            errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.red)),
            focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.red)),
            contentPadding: maxLines > 1 ? const EdgeInsets.all(16) : null,
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String value,
    required List<String> items,
    required void Function(String?) onChanged,
  }) {
    final isDark = themeProvider.isDarkMode;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final borderColor = isDark ? AppColors.darkDivider : Colors.grey.shade300;
    final fillColor = isDark ? AppColors.darkSurface : Colors.white;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimary)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: fillColor,
            border: Border.all(color: borderColor),
            borderRadius: BorderRadius.circular(12),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              dropdownColor: isDark ? AppColors.darkCard : Colors.white,
              style: TextStyle(color: textPrimary, fontSize: 14),
              items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: TextStyle(color: textPrimary)))).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAttachFilesButton() {
    return OutlinedButton.icon(
      onPressed: _simulateFileAttachment,
      icon: const Icon(Icons.attach_file),
      label: const Text('Attach Files (Optional)'),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 14),
        minimumSize: const Size(double.infinity, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Widget _buildAttachedFilesList() {
    final isDark = themeProvider.isDarkMode;
    final bgColor = isDark ? AppColors.darkSurface : Colors.grey.shade50;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: _attachedFiles.map((file) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            children: [
              const Icon(Icons.insert_drive_file, size: 20, color: _tealColor),
              const SizedBox(width: 8),
              Expanded(child: Text(file, style: TextStyle(fontSize: 13, color: textPrimary))),
              IconButton(
                icon: Icon(Icons.close, size: 18, color: textSecondary),
                onPressed: () => setState(() => _attachedFiles.remove(file)),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        )).toList(),
      ),
    );
  }

  Widget _buildPrioritySelector() {
    final isDark = themeProvider.isDarkMode;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final unselectedBg = isDark ? AppColors.darkSurface : Colors.grey.shade100;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Priority', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimary)),
        const SizedBox(height: 12),
        Row(
          children: _priorities.map((priority) {
            final isSelected = _selectedPriority == priority;
            final color = priority == 'High' ? Colors.red : priority == 'Normal' ? Colors.orange : Colors.green;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: priority != 'High' ? 8 : 0),
                child: Semantics(
                  selected: isSelected,
                  child: Material(
                    color: isSelected ? color.withValues(alpha: 0.1) : unselectedBg,
                    borderRadius: BorderRadius.circular(12),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => setState(() => _selectedPriority = priority),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isSelected ? color : Colors.transparent),
                        ),
                        child: Center(
                          child: Text(
                            priority,
                            style: TextStyle(
                              color: isSelected ? color : textSecondary,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }


  Widget _buildSuggestedHelp() {
    final isDark = themeProvider.isDarkMode;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Suggested Help', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary)),
          const SizedBox(height: 16),
          
          // Suggested FAQs
          Container(
            decoration: BoxDecoration(
              color: cardColor,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04), blurRadius: 8, offset: const Offset(0, 2))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Row(
                    children: [
                      const Icon(Icons.help_outline, color: _tealColor, size: 20),
                      const SizedBox(width: 8),
                      Text('Top FAQs', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: textPrimary)),
                    ],
                  ),
                ),
                ..._suggestedFaqs.map((faq) => _buildSuggestedFaqItem(faq)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          
          // Troubleshooting Tips
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [Colors.orange.shade50, Colors.orange.shade100]),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.orange.shade200),
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: _showTroubleshootingTips,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)),
                        child: const Icon(Icons.build_outlined, color: Colors.orange, size: 24),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Troubleshooting Tips', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.black87)),
                            SizedBox(height: 2),
                            Text('Quick fixes for common issues', style: TextStyle(fontSize: 12, color: Colors.black54)),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios, color: Colors.orange, size: 16),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestedFaqItem(Map<String, String> faq) {
    final isDark = themeProvider.isDarkMode;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _navigateToFaq(faq['category']!),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _tealColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(faq['category']!, style: const TextStyle(color: _tealColor, fontSize: 10, fontWeight: FontWeight.w600)),
              ),
              const SizedBox(width: 12),
              Expanded(child: Text(faq['question']!, style: TextStyle(fontSize: 13, color: textPrimary))),
              Icon(Icons.chevron_right, color: textSecondary, size: 18),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTicketHistorySection() {
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
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          children: [
            Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => setState(() => _showTicketHistory = !_showTicketHistory),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: Colors.purple.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                        child: const Icon(Icons.receipt_long, color: Colors.purple, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('My Requests', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary)),
                            Text('View your support ticket history', style: TextStyle(fontSize: 12, color: textSecondary)),
                          ],
                        ),
                      ),
                      AnimatedRotation(
                        turns: _showTicketHistory ? 0.5 : 0,
                        duration: const Duration(milliseconds: 200),
                        child: Icon(Icons.expand_more, color: textSecondary),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            AnimatedCrossFade(
              firstChild: const SizedBox.shrink(),
              secondChild: Column(
                children: [
                  const Divider(height: 1),
                  ..._ticketHistory.map((ticket) => _buildTicketItem(ticket)),
                ],
              ),
              crossFadeState: _showTicketHistory ? CrossFadeState.showSecond : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 200),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTicketItem(Map<String, dynamic> ticket) {
    final isDark = themeProvider.isDarkMode;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final textTertiary = isDark ? AppColors.darkTextSecondary.withValues(alpha: 0.7) : Colors.black38;
    final statusColor = ticket['status'] == 'Resolved' ? Colors.green
        : ticket['status'] == 'Open' ? Colors.blue : Colors.orange;
    
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _showTicketDetailModal(ticket),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(ticket['id'], style: TextStyle(fontSize: 12, color: textSecondary, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 4),
                    Text(ticket['subject'], style: TextStyle(fontSize: 14, color: textPrimary)),
                    const SizedBox(height: 4),
                    Text(ticket['time'], style: TextStyle(fontSize: 11, color: textTertiary)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(ticket['status'], style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ============ MODAL DIALOGS ============

  void _showAttachmentHint() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Use the Attach Files button in the form to add attachments'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _scrollToForm() {
    // Analytics stub: onEmailSupportTap
    // TODO: Integrate analytics - track email support button tap
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Scroll down to fill out the contact form'), duration: Duration(seconds: 1)),
    );
  }

  void _simulateFileAttachment() {
    final files = ['document.pdf', 'screenshot.png', 'log_file.txt'];
    final randomFile = files[DateTime.now().millisecond % files.length];
    if (_attachedFiles.length < 3) {
      setState(() => _attachedFiles.add('${randomFile}_${_attachedFiles.length + 1}'));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('File "$randomFile" attached (simulated)'), duration: const Duration(seconds: 1)),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 3 files allowed'), duration: Duration(seconds: 1)),
      );
    }
  }

  void _submitForm() {
    if (!_formKey.currentState!.validate()) return;

    // Analytics stub: onContactSubmit
    // TODO: Integrate analytics - track form submission
    
    setState(() => _isSubmitting = true);

    // Simulate API call
    Future.delayed(const Duration(seconds: 2), () {
      setState(() => _isSubmitting = false);
      
      if (_simulateError) {
        _showErrorDialog();
      } else {
        final ticketId = 'TKT-${DateTime.now().year}-${(DateTime.now().millisecondsSinceEpoch % 10000).toString().padLeft(4, '0')}';
        _showSuccessModal(ticketId);
      }
    });
  }

  void _showErrorDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.error_outline, color: Colors.red),
            ),
            const SizedBox(width: 12),
            const Text('Submission Failed'),
          ],
        ),
        content: const Text('We couldn\'t submit your request. Please check your connection and try again.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _submitForm();
            },
            style: ElevatedButton.styleFrom(backgroundColor: _tealColor),
            child: const Text('Try Again', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }


  void _showSuccessModal(String ticketId) {
    int rating = 0;
    final feedbackController = TextEditingController();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          contentPadding: const EdgeInsets.all(24),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle, color: Colors.green, size: 48),
              ),
              const SizedBox(height: 20),
              const Text('Request Submitted!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('Your ticket ID is:', style: TextStyle(color: Colors.grey.shade600)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: _tealColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(ticketId, style: const TextStyle(color: _tealColor, fontWeight: FontWeight.bold, fontSize: 16)),
              ),
              const SizedBox(height: 20),
              
              // Rating widget
              const Text('How was your experience?', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) => IconButton(
                  icon: Icon(
                    index < rating ? Icons.star : Icons.star_border,
                    color: Colors.amber,
                    size: 32,
                  ),
                  onPressed: () => setDialogState(() => rating = index + 1),
                )),
              ),
              if (rating > 0) ...[
                const SizedBox(height: 12),
                TextField(
                  controller: feedbackController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    hintText: 'Any additional feedback? (optional)',
                    hintStyle: const TextStyle(color: Colors.black38, fontSize: 13),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _tealColor)),
                    contentPadding: const EdgeInsets.all(12),
                  ),
                ),
              ],
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _clearForm();
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Close'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        // Analytics stub: onViewTicket
                        // TODO: Integrate analytics - track view ticket tap
                        Navigator.pop(context);
                        _clearForm();
                        setState(() => _showTicketHistory = true);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _tealColor,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('View Ticket', style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    // Show success snackbar
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Support request submitted successfully!'),
        backgroundColor: _tealColor,
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _clearForm() {
    _nameController.clear();
    _emailController.clear();
    _phoneController.clear();
    _subjectController.clear();
    _messageController.clear();
    setState(() {
      _selectedCategory = 'Technical';
      _selectedPriority = 'Normal';
      _attachedFiles.clear();
    });
  }

  void _showLiveChatModal() {
    // Analytics stub: onStartLiveChat
    // TODO: Integrate analytics - track live chat start
    
    final chatMessages = <Map<String, dynamic>>[
      {'isBot': true, 'message': 'Hello! I\'m your MedChat support assistant. How can I help you today?'},
      {'isBot': false, 'message': 'I\'m having trouble with my subscription.'},
      {'isBot': true, 'message': 'I\'d be happy to help with your subscription. Could you tell me more about the issue you\'re experiencing?'},
    ];
    final messageController = TextEditingController();

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
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: _tealColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                      child: const Icon(Icons.smart_toy, color: _tealColor),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Live Chat', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          Text('Support Bot • Online', style: TextStyle(fontSize: 12, color: Colors.green)),
                        ],
                      ),
                    ),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                  ],
                ),
              ),
              const Divider(height: 1),
              
              // Chat messages
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: chatMessages.length,
                  itemBuilder: (context, index) {
                    final msg = chatMessages[index];
                    return _buildChatBubble(msg['message'], msg['isBot']);
                  },
                ),
              ),
              
              // Escalate button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: OutlinedButton.icon(
                  onPressed: () => _showEscalateDialog(context),
                  icon: const Icon(Icons.person, size: 18),
                  label: const Text('Request Human Agent'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 44),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              
              // Input field
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -2))],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: messageController,
                        decoration: InputDecoration(
                          hintText: 'Type your message...',
                          hintStyle: const TextStyle(color: Colors.black38),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide(color: Colors.grey.shade300)),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: const BorderSide(color: _tealColor)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      decoration: const BoxDecoration(color: _tealColor, shape: BoxShape.circle),
                      child: IconButton(
                        icon: const Icon(Icons.send, color: Colors.white, size: 20),
                        onPressed: () {
                          if (messageController.text.isNotEmpty) {
                            setModalState(() {
                              chatMessages.add({'isBot': false, 'message': messageController.text});
                              messageController.clear();
                            });
                            // Simulate bot response
                            Future.delayed(const Duration(seconds: 1), () {
                              setModalState(() {
                                chatMessages.add({'isBot': true, 'message': 'Thank you for your message. Let me look into that for you...'});
                              });
                            });
                          }
                        },
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

  Widget _buildChatBubble(String message, bool isBot) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isBot ? MainAxisAlignment.start : MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isBot) ...[
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: _tealColor.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: const Icon(Icons.smart_toy, color: _tealColor, size: 16),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isBot ? Colors.grey.shade100 : _tealColor,
                borderRadius: BorderRadius.circular(16).copyWith(
                  bottomLeft: isBot ? const Radius.circular(4) : null,
                  bottomRight: !isBot ? const Radius.circular(4) : null,
                ),
              ),
              child: Text(
                message,
                style: TextStyle(color: isBot ? Colors.black87 : Colors.white, fontSize: 14),
              ),
            ),
          ),
          if (!isBot) const SizedBox(width: 8),
        ],
      ),
    );
  }

  void _showEscalateDialog(BuildContext modalContext) {
    showDialog(
      context: modalContext,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Request Human Agent'),
        content: const Text('Would you like to be connected with a human support agent? Average wait time is 5-10 minutes.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(modalContext);
              ScaffoldMessenger.of(this.context).showSnackBar(
                const SnackBar(content: Text('Request sent. A human agent will contact you shortly.'), backgroundColor: _tealColor),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: _tealColor),
            child: const Text('Request Agent', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }


  void _showCallSupportModal() {
    // Analytics stub: onCallSupport
    // TODO: Integrate analytics - track call support tap
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.phone, color: Colors.green),
            ),
            const SizedBox(width: 12),
            const Text('Call Support'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Support Phone Number:', style: TextStyle(fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(Icons.phone, color: _tealColor, size: 20),
                  SizedBox(width: 8),
                  Text('+1 (800) 555-0123', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text('Hours of Operation:', style: TextStyle(fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            Text('Monday - Friday: 8:00 AM - 8:00 PM EST', style: TextStyle(color: Colors.grey.shade600)),
            Text('Saturday - Sunday: 9:00 AM - 5:00 PM EST', style: TextStyle(color: Colors.grey.shade600)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(this.context).showSnackBar(
                const SnackBar(content: Text('Opening phone dialer... (simulated)'), backgroundColor: _tealColor),
              );
            },
            icon: const Icon(Icons.call, color: Colors.white, size: 18),
            label: const Text('Call', style: TextStyle(color: Colors.white)),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
          ),
        ],
      ),
    );
  }

  void _showTicketDetailModal(Map<String, dynamic> ticket) {
    // Analytics stub: onViewTicket
    // TODO: Integrate analytics - track ticket detail view
    
    final statusColor = ticket['status'] == 'Resolved' ? Colors.green
        : ticket['status'] == 'Open' ? Colors.blue : Colors.orange;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
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
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: Colors.purple.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                    child: const Icon(Icons.receipt_long, color: Colors.purple),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(ticket['id'], style: const TextStyle(fontSize: 14, color: Colors.black54)),
                        const SizedBox(height: 2),
                        Text(ticket['subject'], style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Status badge
                    Row(
                      children: [
                        const Text('Status: ', style: TextStyle(fontWeight: FontWeight.w500)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(ticket['status'], style: TextStyle(color: statusColor, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Ticket details
                    _buildTicketDetailRow('Created', ticket['time']),
                    _buildTicketDetailRow('Category', 'Technical'),
                    _buildTicketDetailRow('Priority', 'Normal'),
                    
                    const SizedBox(height: 24),
                    const Text('Conversation', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 16),
                    
                    // Sample conversation
                    _buildTicketMessage('You', 'I\'m experiencing issues with ${ticket['subject'].toLowerCase()}.', false),
                    _buildTicketMessage('Support Team', 'Thank you for reaching out. We\'re looking into this issue and will get back to you shortly.', true),
                    if (ticket['status'] == 'Resolved')
                      _buildTicketMessage('Support Team', 'This issue has been resolved. Please let us know if you need any further assistance.', true),
                    
                    const SizedBox(height: 24),
                    const Text('Attachments', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.insert_drive_file, color: _tealColor, size: 20),
                          SizedBox(width: 8),
                          Text('screenshot.png', style: TextStyle(fontSize: 13)),
                        ],
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

  Widget _buildTicketDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(width: 80, child: Text(label, style: TextStyle(color: Colors.grey.shade600))),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildTicketMessage(String sender, String message, bool isSupport) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isSupport ? _tealColor.withValues(alpha: 0.05) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isSupport ? _tealColor.withValues(alpha: 0.2) : Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(isSupport ? Icons.support_agent : Icons.person, size: 16, color: isSupport ? _tealColor : Colors.black54),
              const SizedBox(width: 6),
              Text(sender, style: TextStyle(fontWeight: FontWeight.w600, color: isSupport ? _tealColor : Colors.black87)),
            ],
          ),
          const SizedBox(height: 8),
          Text(message, style: const TextStyle(fontSize: 14, height: 1.4)),
        ],
      ),
    );
  }

  void _showTroubleshootingTips() {
    final tips = [
      {'title': 'Clear App Cache', 'desc': 'Go to Settings > Apps > MedChat > Clear Cache'},
      {'title': 'Check Internet', 'desc': 'Ensure you have a stable connection'},
      {'title': 'Update App', 'desc': 'Make sure you\'re using the latest version'},
      {'title': 'Restart Device', 'desc': 'A simple restart often fixes issues'},
      {'title': 'Reinstall App', 'desc': 'As a last resort, reinstall the app'},
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.6,
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
                  const Icon(Icons.build, color: Colors.orange),
                  const SizedBox(width: 12),
                  const Text('Troubleshooting Tips', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const Spacer(),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: tips.length,
                itemBuilder: (context, index) {
                  final tip = tips[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(color: Colors.orange, borderRadius: BorderRadius.circular(14)),
                          child: Center(child: Text('${index + 1}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(tip['title']!, style: const TextStyle(fontWeight: FontWeight.w600)),
                              const SizedBox(height: 4),
                              Text(tip['desc']!, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    Navigator.pushNamed(context, '/faq-support');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _tealColor,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('View Full Troubleshooting Guide', style: TextStyle(color: Colors.white)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToFaq(String category) {
    Navigator.pushNamed(context, '/faq-support');
    // Note: In a real implementation, you would pass the category to open the relevant accordion
    // Navigator.pushNamed(context, '/faq-support', arguments: {'category': category});
  }
}
