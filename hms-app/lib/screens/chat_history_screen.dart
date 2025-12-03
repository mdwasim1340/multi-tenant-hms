import 'package:flutter/material.dart';
import '../chat_history.dart';
import '../theme/theme_provider.dart';
import '../main.dart' show themeProvider;

class ChatHistoryScreen extends StatefulWidget {
  final Function(ChatSession)? onSessionSelected;

  const ChatHistoryScreen({super.key, this.onSessionSelected});

  @override
  State<ChatHistoryScreen> createState() => _ChatHistoryScreenState();
}

class _ChatHistoryScreenState extends State<ChatHistoryScreen> {
  final ChatHistoryManager _historyManager = ChatHistoryManager();

  @override
  void initState() {
    super.initState();
    _historyManager.addListener(_onHistoryChanged);
    themeProvider.addListener(_onThemeChanged);
  }

  @override
  void dispose() {
    _historyManager.removeListener(_onHistoryChanged);
    themeProvider.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _onHistoryChanged() => setState(() {});
  void _onThemeChanged() => setState(() {});

  void _confirmClearHistory() {
    final isDark = themeProvider.isDarkMode;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: cardColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Clear History', style: TextStyle(fontWeight: FontWeight.bold, color: textPrimary)),
        content: Text('Are you sure you want to delete all chat history? This cannot be undone.', style: TextStyle(color: textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel', style: TextStyle(color: textSecondary))),
          TextButton(
            onPressed: () { _historyManager.clearHistory(); Navigator.pop(context); },
            style: TextButton.styleFrom(foregroundColor: AppColors.redAccent),
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteSession(ChatSession session) {
    final isDark = themeProvider.isDarkMode;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: cardColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Delete Chat', style: TextStyle(fontWeight: FontWeight.bold, color: textPrimary)),
        content: Text('Delete "${session.title}"?', style: TextStyle(color: textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel', style: TextStyle(color: textSecondary))),
          TextButton(
            onPressed: () { _historyManager.deleteSession(session.id); Navigator.pop(context); },
            style: TextButton.styleFrom(foregroundColor: AppColors.redAccent),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Use themeProvider directly for immediate updates
    final isDark = themeProvider.isDarkMode;
    final backgroundColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final sessions = _historyManager.sessions;

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: cardColor,
        elevation: 1,
        leading: IconButton(icon: Icon(Icons.arrow_back, color: textPrimary), onPressed: () => Navigator.pop(context)),
        title: Text('Chat History', style: TextStyle(color: textPrimary, fontSize: 18, fontWeight: FontWeight.w600)),
        actions: [
          if (sessions.isNotEmpty) IconButton(icon: const Icon(Icons.delete_outline, color: AppColors.redAccent), onPressed: _confirmClearHistory),
        ],
      ),
      body: sessions.isEmpty
          ? _buildEmptyState(textSecondary)
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: sessions.length,
              itemBuilder: (context, index) => _buildSessionCard(sessions[index], cardColor, textPrimary, textSecondary, isDark),
            ),
    );
  }

  Widget _buildEmptyState(Color textSecondary) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.chat_bubble_outline, size: 64, color: textSecondary),
          const SizedBox(height: 16),
          Text('No chat history yet', style: TextStyle(fontSize: 18, color: textSecondary)),
          const SizedBox(height: 8),
          Text('Start a conversation to see it here', style: TextStyle(fontSize: 14, color: textSecondary)),
        ],
      ),
    );
  }

  Widget _buildSessionCard(ChatSession session, Color cardColor, Color textPrimary, Color textSecondary, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05), blurRadius: 5, offset: const Offset(0, 2))],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () { widget.onSessionSelected?.call(session); Navigator.pop(context); },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(color: AppColors.tealPrimary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.chat_bubble_outline, color: AppColors.tealPrimary, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(session.title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 4),
                      Text('${session.formattedDate} • ${session.messages.length} messages', style: TextStyle(fontSize: 12, color: textSecondary)),
                    ],
                  ),
                ),
                IconButton(icon: Icon(Icons.delete_outline, color: textSecondary, size: 20), onPressed: () => _confirmDeleteSession(session)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
