import 'package:flutter/material.dart';
import 'chat_history.dart';
import 'theme/theme_provider.dart';
import 'main.dart' show themeProvider;
import 'core/storage/secure_storage.dart';
import 'features/auth/data/models/user_model.dart';
import 'features/auth/data/repositories/auth_repository.dart';

class SideBarDrawer extends StatefulWidget {
  final VoidCallback? onNewChat;
  final VoidCallback? onSaveConversation;
  final VoidCallback? onViewHistory;
  final VoidCallback? onClearHistory;
  final List<ChatSession>? chatHistory;
  final Function(ChatSession)? onSessionSelected;
  final Function(ChatSession)? onDeleteSession;

  const SideBarDrawer({
    super.key,
    this.onNewChat,
    this.onSaveConversation,
    this.onViewHistory,
    this.onClearHistory,
    this.chatHistory,
    this.onSessionSelected,
    this.onDeleteSession,
  });

  @override
  State<SideBarDrawer> createState() => _SideBarDrawerState();
}

class _SideBarDrawerState extends State<SideBarDrawer> {
  String _userName = 'Loading...';
  String _userEmail = '';
  UserModel? _user;
  final _authRepository = AuthRepository();

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    final user = await SecureStorage.getUser();
    if (user != null && mounted) {
      setState(() {
        _user = user;
        _userName = user.name;
        _userEmail = user.email;
      });
    }
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

    return Drawer(
      width: 260,
      backgroundColor: backgroundColor,
      child: SafeArea(
        child: Column(
          children: [
            _buildTopHeader(context),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildCurrentChatSection(textPrimary, textSecondary),
                    Divider(height: 1, thickness: 1, color: dividerColor),
                    _buildChatHistorySection(textPrimary, textSecondary, cardColor, isDark),
                    Divider(height: 1, thickness: 1, color: dividerColor),
                    _buildAccountSection(textPrimary, textSecondary),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopHeader(BuildContext context) {
    final initials = _userName.split(' ').map((n) => n.isNotEmpty ? n[0] : '').take(2).join().toUpperCase();

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(colors: [AppColors.tealPrimary, AppColors.tealLight], begin: Alignment.topLeft, end: Alignment.bottomRight),
      ),
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: () { Navigator.of(context).pop(); Navigator.pushNamed(context, '/profile'); },
                child: Container(
                  width: 56, height: 56,
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), shape: BoxShape.circle, border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 2)),
                  child: Center(child: Text(initials, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold))),
                ),
              ),
              const Spacer(),
              IconButton(icon: const Icon(Icons.close, color: Colors.white70, size: 24), onPressed: () => Navigator.of(context).pop(), tooltip: 'Close menu'),
            ],
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () { Navigator.of(context).pop(); Navigator.pushNamed(context, '/profile'); },
            child: Text(_userName, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(height: 4),
          Text(_userEmail, style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13)),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () { Navigator.of(context).pop(); Navigator.pushNamed(context, '/profile'); },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.white.withValues(alpha: 0.3))),
              child: const Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.person_outline, color: Colors.white, size: 16), SizedBox(width: 6), Text('View Profile', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500))]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, Color textSecondary) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
      child: Text(title, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textSecondary, letterSpacing: 0.8)),
    );
  }

  Widget _buildListItem({required IconData icon, required String title, Color? iconColor, Color? textColor, FontWeight? fontWeight, Widget? trailing, VoidCallback? onTap, required Color defaultTextColor, required Color defaultIconColor}) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap ?? () {},
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Row(
            children: [
              Icon(icon, size: 22, color: iconColor ?? defaultIconColor),
              const SizedBox(width: 16),
              Expanded(child: Text(title, style: TextStyle(fontSize: 14, fontWeight: fontWeight ?? FontWeight.w400, color: textColor ?? defaultTextColor))),
              if (trailing != null) trailing,
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentChatSection(Color textPrimary, Color textSecondary) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('CURRENT CHAT', textSecondary),
        _buildListItem(
          icon: Icons.add_circle_outline,
          title: 'New Chat',
          defaultTextColor: textPrimary,
          defaultIconColor: textSecondary,
          onTap: () { Navigator.of(context).pop(); widget.onNewChat?.call(); },
        ),
      ],
    );
  }

  Widget _buildChatHistorySection(Color textPrimary, Color textSecondary, Color cardColor, bool isDark) {
    final history = widget.chatHistory ?? [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('CHAT HISTORY', textSecondary),
        if (history.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Text('No chat history yet', style: TextStyle(fontSize: 13, color: textSecondary, fontStyle: FontStyle.italic)),
          )
        else
          ...history.map((session) => _buildHistoryItem(session, textPrimary, textSecondary, isDark)),
        _buildListItem(
          icon: Icons.menu_book_outlined,
          title: 'View All History',
          defaultTextColor: textPrimary,
          defaultIconColor: textSecondary,
          onTap: () { Navigator.of(context).pop(); widget.onViewHistory?.call(); },
        ),
        _buildListItem(
          icon: Icons.delete_outline,
          title: 'Clear History',
          iconColor: AppColors.redAccent,
          textColor: AppColors.redAccent,
          defaultTextColor: textPrimary,
          defaultIconColor: textSecondary,
          onTap: () { Navigator.of(context).pop(); widget.onClearHistory?.call(); },
        ),
      ],
    );
  }

  Widget _buildHistoryItem(ChatSession session, Color textPrimary, Color textSecondary, bool isDark) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () { Navigator.of(context).pop(); widget.onSessionSelected?.call(session); },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Row(
            children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(color: AppColors.tealPrimary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.chat_bubble_outline, size: 16, color: AppColors.tealPrimary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(session.preview, style: TextStyle(fontSize: 13, color: textPrimary, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text(session.formattedDate, style: TextStyle(fontSize: 11, color: textSecondary)),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.redAccent),
                onPressed: () => _confirmDeleteSession(session, isDark),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                tooltip: 'Delete chat',
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _confirmDeleteSession(ChatSession session, bool isDark) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Delete Chat', style: TextStyle(fontWeight: FontWeight.bold, color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary)),
        content: Text('Delete "${session.preview}"?', style: TextStyle(color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: TextStyle(color: isDark ? AppColors.darkTextSecondary : Colors.black54))),
          TextButton(
            onPressed: () { Navigator.pop(ctx); widget.onDeleteSession?.call(session); },
            style: TextButton.styleFrom(foregroundColor: AppColors.redAccent),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountSection(Color textPrimary, Color textSecondary) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('ACCOUNT', textSecondary),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [AppColors.tealPrimary, AppColors.tealLight], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Your Credits', style: TextStyle(fontSize: 12, color: Colors.white70, fontWeight: FontWeight.w400)),
                const SizedBox(height: 4),
                const Text('250 Credits', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 2),
                const Text('Renews Dec 1', style: TextStyle(fontSize: 11, color: Colors.white70)),
                const SizedBox(height: 12),
                Container(
                  height: 6,
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(3)),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: 0.65,
                    child: Container(decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(3))),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 42,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context).pop();
                      Navigator.pushNamed(context, '/subscription');
                    },
                    icon: const Icon(Icons.workspace_premium, size: 18),
                    label: const Text('Upgrade Plan', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.tealPrimary,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        _buildListItem(
          icon: Icons.logout,
          title: 'Logout',
          iconColor: AppColors.redAccent,
          textColor: AppColors.redAccent,
          fontWeight: FontWeight.w600,
          defaultTextColor: textPrimary,
          defaultIconColor: textSecondary,
          onTap: () async {
            Navigator.of(context).pop();
            await _authRepository.signOut(); // Clear stored tokens
            if (context.mounted) {
              Navigator.pushNamedAndRemoveUntil(context, '/sign-in', (route) => false);
            }
          },
        ),
      ],
    );
  }
}
