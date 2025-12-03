import 'package:flutter/foundation.dart';

// Chat message model
class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;

  ChatMessage({required this.text, required this.isUser, DateTime? timestamp})
      : timestamp = timestamp ?? DateTime.now();
}

// Chat session model
class ChatSession {
  final String id;
  final String title;
  final DateTime createdAt;
  final List<ChatMessage> messages;

  ChatSession({
    required this.id,
    required this.title,
    required this.createdAt,
    required this.messages,
  });

  String get preview {
    if (messages.isEmpty) return 'Empty chat';
    final firstUserMsg = messages.firstWhere((m) => m.isUser, orElse: () => messages.first);
    final text = firstUserMsg.text;
    return text.length > 30 ? '${text.substring(0, 30)}...' : text;
  }

  String get formattedDate {
    final now = DateTime.now();
    final diff = now.difference(createdAt);
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';
    return '${createdAt.month}/${createdAt.day}';
  }
}

// Chat history manager - singleton to share state across widgets
class ChatHistoryManager extends ChangeNotifier {
  static final ChatHistoryManager _instance = ChatHistoryManager._internal();
  factory ChatHistoryManager() => _instance;
  ChatHistoryManager._internal();

  final List<ChatSession> _sessions = [];
  ChatSession? _currentSession;

  List<ChatSession> get sessions => List.unmodifiable(_sessions);
  List<ChatSession> get recentSessions => _sessions.take(3).toList();
  ChatSession? get currentSession => _currentSession;

  void saveCurrentChat(List<ChatMessage> messages) {
    if (messages.isEmpty) return;
    
    final firstUserMsg = messages.firstWhere((m) => m.isUser, orElse: () => messages.first);
    final title = firstUserMsg.text.length > 25 
        ? '${firstUserMsg.text.substring(0, 25)}...' 
        : firstUserMsg.text;

    final session = ChatSession(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: title,
      createdAt: DateTime.now(),
      messages: List.from(messages),
    );

    _sessions.insert(0, session);
    _currentSession = session;
    notifyListeners();
  }

  void loadSession(ChatSession session) {
    _currentSession = session;
    notifyListeners();
  }

  void clearHistory() {
    _sessions.clear();
    _currentSession = null;
    notifyListeners();
  }

  void deleteSession(String id) {
    _sessions.removeWhere((s) => s.id == id);
    if (_currentSession?.id == id) {
      _currentSession = null;
    }
    notifyListeners();
  }
}
