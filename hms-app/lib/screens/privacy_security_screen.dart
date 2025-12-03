import 'package:flutter/material.dart';
import '../theme/theme_provider.dart';
import '../main.dart' show themeProvider;

/// Privacy & Security Screen for MedChat AI
/// A comprehensive control center for privacy settings, security options,
/// data management, and trust transparency.
/// 
/// Route: /privacy-security
/// 
/// TODO: Connect to backend APIs for:
/// - User authentication settings (2FA)
/// - Session management
/// - Data export/deletion
/// - Privacy preferences persistence

class PrivacySecurityScreen extends StatefulWidget {
  const PrivacySecurityScreen({super.key});

  @override
  State<PrivacySecurityScreen> createState() => _PrivacySecurityScreenState();
}

class _PrivacySecurityScreenState extends State<PrivacySecurityScreen>
    with TickerProviderStateMixin {
  // Theme colors - using theme provider
  static const Color _tealColor = AppColors.tealPrimary;
  static const Color _tealLight = AppColors.tealLight;

  // Helper getters for theme-aware colors
  bool get _isDark => themeProvider.isDarkMode;
  Color get _backgroundColor => _isDark ? AppColors.darkBackground : AppColors.lightBackground;
  Color get _cardColor => _isDark ? AppColors.darkCard : AppColors.lightCard;
  Color get _textPrimary => _isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
  Color get _textSecondary => _isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
  Color get _dividerColor => _isDark ? AppColors.darkDivider : AppColors.lightDivider;
  Color get _textTertiary => _isDark ? AppColors.darkTextSecondary.withValues(alpha: 0.7) : Colors.black38;

  // Search
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  // Accordion expansion states
  final Map<String, bool> _expandedSections = {
    'dataCollect': false,
    'dataUse': false,
    'aiProcess': false,
    'thirdParty': false,
    'cookies': false,
    'rights': false,
    'children': false,
    'retention': false,
    'policyPreview': false,
    'changelog': false,
  };

  // Security toggles
  bool _twoFactorEnabled = false;
  bool _suspiciousActivityAlerts = true;

  // Cookie toggles
  bool _essentialCookies = true; // Always on
  bool _analyticsCookies = true;
  bool _personalizationCookies = false;
  bool _marketingCookies = false;

  // Cookie banner visibility
  bool _showCookieBanner = true;

  // Accessibility settings
  double _fontSizeMultiplier = 1.0;
  bool _highContrastMode = false;
  bool _readerFriendlyMode = false;

  // Language
  String _selectedLanguage = 'English';

  // Animation controllers
  late AnimationController _bannerAnimController;
  late Animation<double> _bannerFadeAnimation;

  @override
  void initState() {
    super.initState();
    _bannerAnimController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _bannerFadeAnimation = CurvedAnimation(
      parent: _bannerAnimController,
      curve: Curves.easeOut,
    );
    _bannerAnimController.forward();
    themeProvider.addListener(_onThemeChanged);
  }

  void _onThemeChanged() => setState(() {});

  @override
  void dispose() {
    _searchController.dispose();
    _bannerAnimController.dispose();
    themeProvider.removeListener(_onThemeChanged);
    super.dispose();
  }

  // Localized strings
  Map<String, Map<String, String>> get _localizedStrings => {
    'English': {
      'title': 'Privacy & Security',
      'heroTitle': 'Your Privacy & Security',
      'heroSubtitle': 'Control how your medical data is protected and used.',
      'badge1': 'End-to-End Encryption',
      'badge2': 'HIPAA-aware Data Practices',
      'badge3': 'Secure AI Processing',
      'overviewTitle': 'Privacy at a Glance',
      'overview1': 'We encrypt all messages and medical data.',
      'overview2': 'You control your data export and deletion.',
      'overview3': 'We do not sell personal health information.',
      'overview4': 'You can manage cookies, tracking, and permissions.',
      'viewPolicy': 'View Full Privacy Policy',
      'searchHint': 'Search privacy & security topics...',
      'securityCenter': 'Security Center',
      'twoFactor': 'Two-Factor Authentication',
      'loginActivity': 'Login Activity',
      'activeSessions': 'Active Sessions',
      'suspiciousAlerts': 'Suspicious Activity Alerts',
      'appPermissions': 'App Permissions',
      'encryptionTitle': 'How We Protect Your Data',
      'cookieSettings': 'Cookie & Tracking Controls',
      'dataTools': 'Your Data Tools',
      'policyPreview': 'Privacy Policy Preview',
      'changelog': 'Policy Changelog',
      'accessibility': 'Accessibility Controls',
      'language': 'Language',
      'dataCollectTitle': 'Data We Collect',
      'dataCollectContent': 'We collect information you provide directly, including your name, email, health queries, and conversation history. We also automatically collect device information, usage data, and technical logs to improve our services.',
      'dataUseTitle': 'How We Use Your Data',
      'dataUseContent': 'Your data helps us provide personalized medical information, improve our AI models, ensure service quality, and maintain security. We use aggregated, anonymized data for research and service improvements.',
      'aiProcessTitle': 'How AI Models Process Information',
      'aiProcessContent': 'Our AI processes your queries in real-time to provide relevant medical information. Conversations are analyzed using secure, isolated processing environments. AI models are trained on anonymized data.',
      'thirdPartyTitle': 'Third-Party Tools',
      'thirdPartyContent': 'We work with trusted partners for hosting, analytics, and security services. All third parties are contractually bound to protect your data. We do not share identifiable health information with advertisers.',
      'cookiesTitle': 'Cookies & Tracking',
      'cookiesContent': 'We use essential cookies for app functionality and security. Analytics cookies help us understand usage patterns. You can manage cookie preferences in the settings below.',
      'rightsTitle': 'Your Rights',
      'rightsContent': 'You have the right to access, correct, export, and delete your personal data. You can withdraw consent for data processing at any time. Contact our privacy team for any data-related requests.',
      'childrenTitle': "Children's Privacy",
      'childrenContent': 'MedChat AI is not intended for users under 13 years of age. We do not knowingly collect data from children. If we discover child data was collected, we will delete it promptly.',
      'retentionTitle': 'Retention & Security Commitments',
      'retentionContent': 'We retain your data only as long as necessary for service provision. Conversation history is retained for 2 years unless you delete it sooner. We employ industry-standard encryption.',
      'textSize': 'Text Size',
      'highContrast': 'High Contrast Mode',
      'highContrastDesc': 'Increase color contrast for better visibility',
      'readerFriendly': 'Reader-Friendly Mode',
      'readerFriendlyDesc': 'Simplified layout with larger text',
      'essential': 'Essential',
      'essentialDesc': 'Required for app functionality',
      'analytics': 'Analytics',
      'analyticsDesc': 'Help us improve the app',
      'personalization': 'Personalization',
      'personalizationDesc': 'Remember your preferences',
      'marketing': 'Marketing',
      'marketingDesc': 'Relevant health content',
      'exportData': 'Export My Data',
      'exportDataDesc': 'Download all your data in JSON format',
      'deleteData': 'Delete My Data',
      'deleteDataDesc': 'Permanently remove all your data',
      'auditLog': 'Download Privacy Audit Log',
      'auditLogDesc': 'View all data access records',
      'encryptionAtRest': 'Encryption at rest and in transit',
      'secureProcessing': 'Secure medical data processing',
      'phiIsolation': 'Protected health information isolation',
      'learnMore': 'Learn More',
    },
    'Español': {
      'title': 'Privacidad y Seguridad',
      'heroTitle': 'Tu Privacidad y Seguridad',
      'heroSubtitle': 'Controla cómo se protegen y utilizan tus datos médicos.',
      'badge1': 'Cifrado de Extremo a Extremo',
      'badge2': 'Prácticas de Datos HIPAA',
      'badge3': 'Procesamiento de IA Seguro',
      'overviewTitle': 'Privacidad de un Vistazo',
      'overview1': 'Ciframos todos los mensajes y datos médicos.',
      'overview2': 'Controlas la exportación y eliminación de tus datos.',
      'overview3': 'No vendemos información de salud personal.',
      'overview4': 'Puedes gestionar cookies, seguimiento y permisos.',
      'viewPolicy': 'Ver Política de Privacidad Completa',
      'searchHint': 'Buscar temas de privacidad y seguridad...',
      'securityCenter': 'Centro de Seguridad',
      'twoFactor': 'Autenticación de Dos Factores',
      'loginActivity': 'Actividad de Inicio de Sesión',
      'activeSessions': 'Sesiones Activas',
      'suspiciousAlerts': 'Alertas de Actividad Sospechosa',
      'appPermissions': 'Permisos de la Aplicación',
      'encryptionTitle': 'Cómo Protegemos Tus Datos',
      'cookieSettings': 'Controles de Cookies y Seguimiento',
      'dataTools': 'Herramientas de Datos',
      'policyPreview': 'Vista Previa de Política',
      'changelog': 'Historial de Cambios',
      'accessibility': 'Controles de Accesibilidad',
      'language': 'Idioma',
      'dataCollectTitle': 'Datos que Recopilamos',
      'dataCollectContent': 'Recopilamos información que proporcionas directamente, incluyendo tu nombre, correo electrónico, consultas de salud e historial de conversaciones. También recopilamos automáticamente información del dispositivo y datos de uso.',
      'dataUseTitle': 'Cómo Usamos Tus Datos',
      'dataUseContent': 'Tus datos nos ayudan a proporcionar información médica personalizada, mejorar nuestros modelos de IA, garantizar la calidad del servicio y mantener la seguridad.',
      'aiProcessTitle': 'Cómo los Modelos de IA Procesan la Información',
      'aiProcessContent': 'Nuestra IA procesa tus consultas en tiempo real para proporcionar información médica relevante. Las conversaciones se analizan utilizando entornos de procesamiento seguros y aislados.',
      'thirdPartyTitle': 'Herramientas de Terceros',
      'thirdPartyContent': 'Trabajamos con socios de confianza para servicios de alojamiento, análisis y seguridad. Todos los terceros están obligados contractualmente a proteger tus datos.',
      'cookiesTitle': 'Cookies y Seguimiento',
      'cookiesContent': 'Usamos cookies esenciales para la funcionalidad y seguridad de la aplicación. Las cookies de análisis nos ayudan a entender los patrones de uso.',
      'rightsTitle': 'Tus Derechos',
      'rightsContent': 'Tienes derecho a acceder, corregir, exportar y eliminar tus datos personales. Puedes retirar el consentimiento para el procesamiento de datos en cualquier momento.',
      'childrenTitle': 'Privacidad de los Niños',
      'childrenContent': 'MedChat AI no está destinado a usuarios menores de 13 años. No recopilamos datos de niños a sabiendas. Si descubrimos que se recopilaron datos de niños, los eliminaremos.',
      'retentionTitle': 'Retención y Compromisos de Seguridad',
      'retentionContent': 'Retenemos tus datos solo el tiempo necesario para la prestación del servicio. El historial de conversaciones se retiene durante 2 años a menos que lo elimines antes.',
      'textSize': 'Tamaño del Texto',
      'highContrast': 'Modo de Alto Contraste',
      'highContrastDesc': 'Aumentar el contraste de color para mejor visibilidad',
      'readerFriendly': 'Modo de Lectura Fácil',
      'readerFriendlyDesc': 'Diseño simplificado con texto más grande',
      'essential': 'Esencial',
      'essentialDesc': 'Requerido para la funcionalidad de la app',
      'analytics': 'Análisis',
      'analyticsDesc': 'Ayúdanos a mejorar la app',
      'personalization': 'Personalización',
      'personalizationDesc': 'Recordar tus preferencias',
      'marketing': 'Marketing',
      'marketingDesc': 'Contenido de salud relevante',
      'exportData': 'Exportar Mis Datos',
      'exportDataDesc': 'Descargar todos tus datos en formato JSON',
      'deleteData': 'Eliminar Mis Datos',
      'deleteDataDesc': 'Eliminar permanentemente todos tus datos',
      'auditLog': 'Descargar Registro de Auditoría',
      'auditLogDesc': 'Ver todos los registros de acceso a datos',
      'encryptionAtRest': 'Cifrado en reposo y en tránsito',
      'secureProcessing': 'Procesamiento seguro de datos médicos',
      'phiIsolation': 'Aislamiento de información de salud protegida',
      'learnMore': 'Más Información',
    },
    'हिन्दी': {
      'title': 'गोपनीयता और सुरक्षा',
      'heroTitle': 'आपकी गोपनीयता और सुरक्षा',
      'heroSubtitle': 'नियंत्रित करें कि आपका चिकित्सा डेटा कैसे सुरक्षित और उपयोग किया जाता है।',
      'badge1': 'एंड-टू-एंड एन्क्रिप्शन',
      'badge2': 'HIPAA-अनुरूप डेटा प्रथाएं',
      'badge3': 'सुरक्षित AI प्रोसेसिंग',
      'overviewTitle': 'गोपनीयता एक नज़र में',
      'overview1': 'हम सभी संदेशों और चिकित्सा डेटा को एन्क्रिप्ट करते हैं।',
      'overview2': 'आप अपने डेटा निर्यात और हटाने को नियंत्रित करते हैं।',
      'overview3': 'हम व्यक्तिगत स्वास्थ्य जानकारी नहीं बेचते।',
      'overview4': 'आप कुकीज़, ट्रैकिंग और अनुमतियां प्रबंधित कर सकते हैं।',
      'viewPolicy': 'पूर्ण गोपनीयता नीति देखें',
      'searchHint': 'गोपनीयता और सुरक्षा विषय खोजें...',
      'securityCenter': 'सुरक्षा केंद्र',
      'twoFactor': 'दो-कारक प्रमाणीकरण',
      'loginActivity': 'लॉगिन गतिविधि',
      'activeSessions': 'सक्रिय सत्र',
      'suspiciousAlerts': 'संदिग्ध गतिविधि अलर्ट',
      'appPermissions': 'ऐप अनुमतियां',
      'encryptionTitle': 'हम आपके डेटा की सुरक्षा कैसे करते हैं',
      'cookieSettings': 'कुकी और ट्रैकिंग नियंत्रण',
      'dataTools': 'आपके डेटा टूल्स',
      'policyPreview': 'गोपनीयता नीति पूर्वावलोकन',
      'changelog': 'नीति परिवर्तन लॉग',
      'accessibility': 'पहुंच नियंत्रण',
      'language': 'भाषा',
      'dataCollectTitle': 'हम कौन सा डेटा एकत्र करते हैं',
      'dataCollectContent': 'हम आपके द्वारा सीधे प्रदान की गई जानकारी एकत्र करते हैं, जिसमें आपका नाम, ईमेल, स्वास्थ्य प्रश्न और बातचीत का इतिहास शामिल है। हम स्वचालित रूप से डिवाइस जानकारी और उपयोग डेटा भी एकत्र करते हैं।',
      'dataUseTitle': 'हम आपके डेटा का उपयोग कैसे करते हैं',
      'dataUseContent': 'आपका डेटा हमें व्यक्तिगत चिकित्सा जानकारी प्रदान करने, हमारे AI मॉडल में सुधार करने, सेवा गुणवत्ता सुनिश्चित करने और सुरक्षा बनाए रखने में मदद करता है।',
      'aiProcessTitle': 'AI मॉडल जानकारी कैसे प्रोसेस करते हैं',
      'aiProcessContent': 'हमारा AI प्रासंगिक चिकित्सा जानकारी प्रदान करने के लिए आपके प्रश्नों को वास्तविक समय में प्रोसेस करता है। बातचीत का विश्लेषण सुरक्षित, पृथक प्रोसेसिंग वातावरण का उपयोग करके किया जाता है।',
      'thirdPartyTitle': 'तृतीय-पक्ष उपकरण',
      'thirdPartyContent': 'हम होस्टिंग, एनालिटिक्स और सुरक्षा सेवाओं के लिए विश्वसनीय भागीदारों के साथ काम करते हैं। सभी तृतीय पक्ष आपके डेटा की सुरक्षा के लिए अनुबंधित रूप से बाध्य हैं।',
      'cookiesTitle': 'कुकीज़ और ट्रैकिंग',
      'cookiesContent': 'हम ऐप कार्यक्षमता और सुरक्षा के लिए आवश्यक कुकीज़ का उपयोग करते हैं। एनालिटिक्स कुकीज़ हमें उपयोग पैटर्न समझने में मदद करती हैं।',
      'rightsTitle': 'आपके अधिकार',
      'rightsContent': 'आपको अपने व्यक्तिगत डेटा तक पहुंचने, सुधारने, निर्यात करने और हटाने का अधिकार है। आप किसी भी समय डेटा प्रोसेसिंग के लिए सहमति वापस ले सकते हैं।',
      'childrenTitle': 'बच्चों की गोपनीयता',
      'childrenContent': 'MedChat AI 13 वर्ष से कम आयु के उपयोगकर्ताओं के लिए नहीं है। हम जानबूझकर बच्चों से डेटा एकत्र नहीं करते। यदि हमें पता चलता है कि बच्चों का डेटा एकत्र किया गया था, तो हम इसे हटा देंगे।',
      'retentionTitle': 'प्रतिधारण और सुरक्षा प्रतिबद्धताएं',
      'retentionContent': 'हम आपके डेटा को केवल सेवा प्रावधान के लिए आवश्यक समय तक रखते हैं। बातचीत का इतिहास 2 साल तक रखा जाता है जब तक आप इसे पहले नहीं हटाते।',
      'textSize': 'टेक्स्ट आकार',
      'highContrast': 'उच्च कंट्रास्ट मोड',
      'highContrastDesc': 'बेहतर दृश्यता के लिए रंग कंट्रास्ट बढ़ाएं',
      'readerFriendly': 'पाठक-अनुकूल मोड',
      'readerFriendlyDesc': 'बड़े टेक्स्ट के साथ सरलीकृत लेआउट',
      'essential': 'आवश्यक',
      'essentialDesc': 'ऐप कार्यक्षमता के लिए आवश्यक',
      'analytics': 'एनालिटिक्स',
      'analyticsDesc': 'ऐप को बेहतर बनाने में हमारी मदद करें',
      'personalization': 'वैयक्तिकरण',
      'personalizationDesc': 'आपकी प्राथमिकताएं याद रखें',
      'marketing': 'मार्केटिंग',
      'marketingDesc': 'प्रासंगिक स्वास्थ्य सामग्री',
      'exportData': 'मेरा डेटा निर्यात करें',
      'exportDataDesc': 'JSON प्रारूप में अपना सारा डेटा डाउनलोड करें',
      'deleteData': 'मेरा डेटा हटाएं',
      'deleteDataDesc': 'अपना सारा डेटा स्थायी रूप से हटाएं',
      'auditLog': 'गोपनीयता ऑडिट लॉग डाउनलोड करें',
      'auditLogDesc': 'सभी डेटा एक्सेस रिकॉर्ड देखें',
      'encryptionAtRest': 'रेस्ट और ट्रांजिट में एन्क्रिप्शन',
      'secureProcessing': 'सुरक्षित चिकित्सा डेटा प्रोसेसिंग',
      'phiIsolation': 'संरक्षित स्वास्थ्य जानकारी अलगाव',
      'learnMore': 'और जानें',
    },
    'Français': {
      'title': 'Confidentialité et Sécurité',
      'heroTitle': 'Votre Confidentialité et Sécurité',
      'heroSubtitle': 'Contrôlez comment vos données médicales sont protégées et utilisées.',
      'badge1': 'Chiffrement de Bout en Bout',
      'badge2': 'Pratiques de Données HIPAA',
      'badge3': 'Traitement IA Sécurisé',
      'overviewTitle': 'Confidentialité en un Coup d\'Œil',
      'overview1': 'Nous chiffrons tous les messages et données médicales.',
      'overview2': 'Vous contrôlez l\'exportation et la suppression de vos données.',
      'overview3': 'Nous ne vendons pas d\'informations de santé personnelles.',
      'overview4': 'Vous pouvez gérer les cookies, le suivi et les autorisations.',
      'viewPolicy': 'Voir la Politique de Confidentialité Complète',
      'searchHint': 'Rechercher des sujets de confidentialité et sécurité...',
      'securityCenter': 'Centre de Sécurité',
      'twoFactor': 'Authentification à Deux Facteurs',
      'loginActivity': 'Activité de Connexion',
      'activeSessions': 'Sessions Actives',
      'suspiciousAlerts': 'Alertes d\'Activité Suspecte',
      'appPermissions': 'Autorisations de l\'Application',
      'encryptionTitle': 'Comment Nous Protégeons Vos Données',
      'cookieSettings': 'Contrôles des Cookies et du Suivi',
      'dataTools': 'Vos Outils de Données',
      'policyPreview': 'Aperçu de la Politique de Confidentialité',
      'changelog': 'Historique des Modifications',
      'accessibility': 'Contrôles d\'Accessibilité',
      'language': 'Langue',
      'dataCollectTitle': 'Données que Nous Collectons',
      'dataCollectContent': 'Nous collectons les informations que vous fournissez directement, y compris votre nom, email, questions de santé et historique des conversations. Nous collectons également automatiquement les informations sur l\'appareil et les données d\'utilisation.',
      'dataUseTitle': 'Comment Nous Utilisons Vos Données',
      'dataUseContent': 'Vos données nous aident à fournir des informations médicales personnalisées, améliorer nos modèles d\'IA, assurer la qualité du service et maintenir la sécurité.',
      'aiProcessTitle': 'Comment les Modèles d\'IA Traitent l\'Information',
      'aiProcessContent': 'Notre IA traite vos requêtes en temps réel pour fournir des informations médicales pertinentes. Les conversations sont analysées dans des environnements de traitement sécurisés et isolés.',
      'thirdPartyTitle': 'Outils Tiers',
      'thirdPartyContent': 'Nous travaillons avec des partenaires de confiance pour l\'hébergement, l\'analyse et les services de sécurité. Tous les tiers sont contractuellement tenus de protéger vos données.',
      'cookiesTitle': 'Cookies et Suivi',
      'cookiesContent': 'Nous utilisons des cookies essentiels pour la fonctionnalité et la sécurité de l\'application. Les cookies d\'analyse nous aident à comprendre les modèles d\'utilisation.',
      'rightsTitle': 'Vos Droits',
      'rightsContent': 'Vous avez le droit d\'accéder, corriger, exporter et supprimer vos données personnelles. Vous pouvez retirer votre consentement au traitement des données à tout moment.',
      'childrenTitle': 'Confidentialité des Enfants',
      'childrenContent': 'MedChat AI n\'est pas destiné aux utilisateurs de moins de 13 ans. Nous ne collectons pas sciemment de données auprès des enfants. Si nous découvrons que des données d\'enfants ont été collectées, nous les supprimerons.',
      'retentionTitle': 'Rétention et Engagements de Sécurité',
      'retentionContent': 'Nous conservons vos données uniquement le temps nécessaire à la fourniture du service. L\'historique des conversations est conservé pendant 2 ans sauf si vous le supprimez avant.',
      'textSize': 'Taille du Texte',
      'highContrast': 'Mode Contraste Élevé',
      'highContrastDesc': 'Augmenter le contraste des couleurs pour une meilleure visibilité',
      'readerFriendly': 'Mode Lecture Facile',
      'readerFriendlyDesc': 'Mise en page simplifiée avec texte plus grand',
      'essential': 'Essentiel',
      'essentialDesc': 'Requis pour la fonctionnalité de l\'app',
      'analytics': 'Analytique',
      'analyticsDesc': 'Aidez-nous à améliorer l\'app',
      'personalization': 'Personnalisation',
      'personalizationDesc': 'Mémoriser vos préférences',
      'marketing': 'Marketing',
      'marketingDesc': 'Contenu de santé pertinent',
      'exportData': 'Exporter Mes Données',
      'exportDataDesc': 'Télécharger toutes vos données au format JSON',
      'deleteData': 'Supprimer Mes Données',
      'deleteDataDesc': 'Supprimer définitivement toutes vos données',
      'auditLog': 'Télécharger le Journal d\'Audit',
      'auditLogDesc': 'Voir tous les enregistrements d\'accès aux données',
      'encryptionAtRest': 'Chiffrement au repos et en transit',
      'secureProcessing': 'Traitement sécurisé des données médicales',
      'phiIsolation': 'Isolation des informations de santé protégées',
      'learnMore': 'En Savoir Plus',
    },
    '中文': {
      'title': '隐私与安全',
      'heroTitle': '您的隐私与安全',
      'heroSubtitle': '控制您的医疗数据如何被保护和使用。',
      'badge1': '端到端加密',
      'badge2': 'HIPAA合规数据实践',
      'badge3': '安全AI处理',
      'overviewTitle': '隐私概览',
      'overview1': '我们加密所有消息和医疗数据。',
      'overview2': '您可以控制数据导出和删除。',
      'overview3': '我们不出售个人健康信息。',
      'overview4': '您可以管理Cookie、跟踪和权限。',
      'viewPolicy': '查看完整隐私政策',
      'searchHint': '搜索隐私和安全主题...',
      'securityCenter': '安全中心',
      'twoFactor': '双因素认证',
      'loginActivity': '登录活动',
      'activeSessions': '活跃会话',
      'suspiciousAlerts': '可疑活动警报',
      'appPermissions': '应用权限',
      'encryptionTitle': '我们如何保护您的数据',
      'cookieSettings': 'Cookie和跟踪控制',
      'dataTools': '您的数据工具',
      'policyPreview': '隐私政策预览',
      'changelog': '政策更新日志',
      'accessibility': '无障碍控制',
      'language': '语言',
      'dataCollectTitle': '我们收集的数据',
      'dataCollectContent': '我们收集您直接提供的信息，包括您的姓名、电子邮件、健康问题和对话历史。我们还自动收集设备信息和使用数据。',
      'dataUseTitle': '我们如何使用您的数据',
      'dataUseContent': '您的数据帮助我们提供个性化的医疗信息、改进我们的AI模型、确保服务质量并维护安全。',
      'aiProcessTitle': 'AI模型如何处理信息',
      'aiProcessContent': '我们的AI实时处理您的查询以提供相关的医疗信息。对话在安全、隔离的处理环境中进行分析。',
      'thirdPartyTitle': '第三方工具',
      'thirdPartyContent': '我们与可信赖的合作伙伴合作提供托管、分析和安全服务。所有第三方都有合同义务保护您的数据。',
      'cookiesTitle': 'Cookie和跟踪',
      'cookiesContent': '我们使用必要的Cookie来实现应用功能和安全。分析Cookie帮助我们了解使用模式。',
      'rightsTitle': '您的权利',
      'rightsContent': '您有权访问、更正、导出和删除您的个人数据。您可以随时撤回数据处理的同意。',
      'childrenTitle': '儿童隐私',
      'childrenContent': 'MedChat AI不适用于13岁以下的用户。我们不会故意收集儿童的数据。如果我们发现收集了儿童数据，我们将删除它。',
      'retentionTitle': '保留和安全承诺',
      'retentionContent': '我们仅在服务提供所需的时间内保留您的数据。对话历史保留2年，除非您提前删除。',
      'textSize': '文字大小',
      'highContrast': '高对比度模式',
      'highContrastDesc': '增加颜色对比度以提高可见性',
      'readerFriendly': '阅读友好模式',
      'readerFriendlyDesc': '简化布局，更大文字',
      'essential': '必要',
      'essentialDesc': '应用功能所需',
      'analytics': '分析',
      'analyticsDesc': '帮助我们改进应用',
      'personalization': '个性化',
      'personalizationDesc': '记住您的偏好',
      'marketing': '营销',
      'marketingDesc': '相关健康内容',
      'exportData': '导出我的数据',
      'exportDataDesc': '以JSON格式下载所有数据',
      'deleteData': '删除我的数据',
      'deleteDataDesc': '永久删除所有数据',
      'auditLog': '下载隐私审计日志',
      'auditLogDesc': '查看所有数据访问记录',
      'encryptionAtRest': '静态和传输中加密',
      'secureProcessing': '安全的医疗数据处理',
      'phiIsolation': '受保护健康信息隔离',
      'learnMore': '了解更多',
    },
  };

  String _getString(String key) {
    return _localizedStrings[_selectedLanguage]?[key] ?? 
           _localizedStrings['English']![key]!;
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: themeProvider,
      builder: (context, child) {
        return Scaffold(
          backgroundColor: _backgroundColor,
          appBar: _buildAppBar(_cardColor, _textPrimary, _textSecondary),
          body: _buildBody(),
        );
      },
    );
  }

  Widget _buildBody() {
    return Stack(
      children: [
        SingleChildScrollView(
          padding: EdgeInsets.only(
            bottom: _showCookieBanner ? 100 : 24,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeroBanner(),
              const SizedBox(height: 20),
              _buildPrivacyOverviewCard(),
              const SizedBox(height: 20),
              _buildSearchBar(),
              const SizedBox(height: 16),
              _buildPrivacySections(),
              const SizedBox(height: 24),
              _buildSecurityCenterCard(),
              const SizedBox(height: 24),
              _buildAppPermissionsCard(),
              const SizedBox(height: 24),
              _buildEncryptionCard(),
              const SizedBox(height: 24),
              _buildCookieControlsCard(),
              const SizedBox(height: 24),
              _buildDataToolsCard(),
              const SizedBox(height: 24),
              _buildPolicyPreviewCard(),
              const SizedBox(height: 24),
              _buildChangelogCard(),
              const SizedBox(height: 24),
              _buildAccessibilityCard(),
              const SizedBox(height: 24),
              _buildLanguageSwitcher(),
              const SizedBox(height: 40),
            ],
          ),
        ),
        if (_showCookieBanner) _buildCookieBanner(),
      ],
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
      title: Text(
        _getString('title'),
        style: TextStyle(
          color: textPrimary,
          fontSize: 18 * _fontSizeMultiplier,
          fontWeight: FontWeight.w600,
        ),
      ),
      actions: [
        IconButton(
          icon: Icon(Icons.print_outlined, color: textSecondary),
          onPressed: () => _showStubDialog('Print', 'Print functionality will be available soon.'),
          tooltip: 'Print',
        ),
        IconButton(
          icon: Icon(Icons.share_outlined, color: textSecondary),
          onPressed: () => _showStubDialog('Share', 'Share functionality will be available soon.'),
          tooltip: 'Share',
        ),
        const SizedBox(width: 8),
      ],
    );
  }


  Widget _buildHeroBanner() {
    return FadeTransition(
      opacity: _bannerFadeAnimation,
      child: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [_tealColor, _tealLight],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.fromLTRB(20, 32, 20, 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(
              Icons.shield_outlined,
              size: 48,
              color: Colors.white.withValues(alpha: 0.9),
            ),
            const SizedBox(height: 16),
            Text(
              _getString('heroTitle'),
              style: TextStyle(
                fontSize: 26 * _fontSizeMultiplier,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              _getString('heroSubtitle'),
              style: TextStyle(
                fontSize: 15 * _fontSizeMultiplier,
                color: Colors.white.withValues(alpha: 0.9),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            // Trust badges
            Wrap(
              spacing: 12,
              runSpacing: 12,
              alignment: WrapAlignment.center,
              children: [
                _buildTrustBadge(Icons.lock_outline, _getString('badge1')),
                _buildTrustBadge(Icons.verified_user_outlined, _getString('badge2')),
                _buildTrustBadge(Icons.psychology_outlined, _getString('badge3')),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrustBadge(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Colors.white),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 11 * _fontSizeMultiplier,
              color: Colors.white,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrivacyOverviewCard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: _cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _tealColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.info_outline, color: _tealColor, size: 24),
                ),
                const SizedBox(width: 12),
                Text(
                  _getString('overviewTitle'),
                  style: TextStyle(
                    fontSize: 18 * _fontSizeMultiplier,
                    fontWeight: FontWeight.w600,
                    color: _textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildOverviewBullet(_getString('overview1')),
            _buildOverviewBullet(_getString('overview2')),
            _buildOverviewBullet(_getString('overview3')),
            _buildOverviewBullet(_getString('overview4')),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _showFullPrivacyPolicy(),
                icon: const Icon(Icons.description_outlined, size: 18),
                label: Text(_getString('viewPolicy')),
                style: OutlinedButton.styleFrom(
                  foregroundColor: _tealColor,
                  side: const BorderSide(color: _tealColor),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOverviewBullet(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 6),
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              color: _tealColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 14 * _fontSizeMultiplier,
                color: _textPrimary,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: _cardColor,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: TextField(
          controller: _searchController,
          onChanged: (value) {
            setState(() {
              _searchQuery = value.toLowerCase();
              // Auto-expand sections that match
              if (_searchQuery.isNotEmpty) {
                _expandMatchingSections();
              }
            });
          },
          style: TextStyle(fontSize: 14 * _fontSizeMultiplier),
          decoration: InputDecoration(
            hintText: _getString('searchHint'),
            hintStyle: TextStyle(
              color: _textTertiary,
              fontSize: 14 * _fontSizeMultiplier,
            ),
            prefixIcon: Icon(Icons.search, color: _textTertiary),
            suffixIcon: _searchQuery.isNotEmpty
                ? IconButton(
                    icon: Icon(Icons.clear, color: _textTertiary),
                    onPressed: () {
                      _searchController.clear();
                      setState(() => _searchQuery = '');
                    },
                  )
                : null,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ),
    );
  }

  void _expandMatchingSections() {
    final sectionContent = {
      'dataCollect': 'data collect personal information health records device',
      'dataUse': 'use data improve services personalize experience',
      'aiProcess': 'ai artificial intelligence process analyze medical',
      'thirdParty': 'third party partners share providers',
      'cookies': 'cookies tracking analytics marketing',
      'rights': 'rights access delete export portability',
      'children': 'children minors age consent parental',
      'retention': 'retention security store delete period',
    };

    for (var entry in sectionContent.entries) {
      if (entry.value.contains(_searchQuery)) {
        _expandedSections[entry.key] = true;
      }
    }
  }


  Widget _buildPrivacySections() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          _buildAccordionSection(
            key: 'dataCollect',
            title: _getString('dataCollectTitle'),
            icon: Icons.folder_outlined,
            content: _highlightText(_getString('dataCollectContent')),
          ),
          _buildAccordionSection(
            key: 'dataUse',
            title: _getString('dataUseTitle'),
            icon: Icons.analytics_outlined,
            content: _highlightText(_getString('dataUseContent')),
          ),
          _buildAccordionSection(
            key: 'aiProcess',
            title: _getString('aiProcessTitle'),
            icon: Icons.psychology_outlined,
            content: _highlightText(_getString('aiProcessContent')),
          ),
          _buildAccordionSection(
            key: 'thirdParty',
            title: _getString('thirdPartyTitle'),
            icon: Icons.extension_outlined,
            content: _highlightText(_getString('thirdPartyContent')),
          ),
          _buildAccordionSection(
            key: 'cookies',
            title: _getString('cookiesTitle'),
            icon: Icons.cookie_outlined,
            content: _highlightText(_getString('cookiesContent')),
          ),
          _buildAccordionSection(
            key: 'rights',
            title: _getString('rightsTitle'),
            icon: Icons.gavel_outlined,
            content: _highlightText(_getString('rightsContent')),
          ),
          _buildAccordionSection(
            key: 'children',
            title: _getString('childrenTitle'),
            icon: Icons.child_care_outlined,
            content: _highlightText(_getString('childrenContent')),
          ),
          _buildAccordionSection(
            key: 'retention',
            title: _getString('retentionTitle'),
            icon: Icons.security_outlined,
            content: _highlightText(_getString('retentionContent')),
          ),
        ],
      ),
    );
  }

  Widget _buildAccordionSection({
    required String key,
    required String title,
    required IconData icon,
    required Widget content,
  }) {
    final isExpanded = _expandedSections[key] ?? false;
    
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () {
                setState(() {
                  _expandedSections[key] = !isExpanded;
                });
              },
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(icon, color: _tealColor, size: 22),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyle(
                          fontSize: 15 * _fontSizeMultiplier,
                          fontWeight: FontWeight.w500,
                          color: _textPrimary,
                        ),
                      ),
                    ),
                    AnimatedRotation(
                      turns: isExpanded ? 0.5 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(
                        Icons.keyboard_arrow_down,
                        color: _textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: content,
            ),
            crossFadeState: isExpanded
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 250),
          ),
        ],
      ),
    );
  }

  Widget _highlightText(String text) {
    if (_searchQuery.isEmpty) {
      return Text(
        text,
        style: TextStyle(
          fontSize: 14 * _fontSizeMultiplier,
          color: _textSecondary,
          height: 1.5,
        ),
      );
    }

    final spans = <TextSpan>[];
    final lowerText = text.toLowerCase();
    int start = 0;

    while (true) {
      final index = lowerText.indexOf(_searchQuery, start);
      if (index == -1) {
        spans.add(TextSpan(text: text.substring(start)));
        break;
      }
      if (index > start) {
        spans.add(TextSpan(text: text.substring(start, index)));
      }
      spans.add(TextSpan(
        text: text.substring(index, index + _searchQuery.length),
        style: const TextStyle(
          backgroundColor: Color(0xFFFFEB3B),
          fontWeight: FontWeight.w600,
        ),
      ));
      start = index + _searchQuery.length;
    }

    return RichText(
      text: TextSpan(
        style: TextStyle(
          fontSize: 14 * _fontSizeMultiplier,
          color: _textSecondary,
          height: 1.5,
        ),
        children: spans,
      ),
    );
  }


  Widget _buildSecurityCenterCard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: _cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: _tealColor.withValues(alpha: 0.05),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: _tealColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.security, color: _tealColor, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    _getString('securityCenter'),
                    style: TextStyle(
                      fontSize: 18 * _fontSizeMultiplier,
                      fontWeight: FontWeight.w600,
                      color: _textPrimary,
                    ),
                  ),
                ],
              ),
            ),
            
            // 2FA Section
            _buildSecurityItem(
              icon: Icons.phonelink_lock_outlined,
              title: _getString('twoFactor'),
              subtitle: _twoFactorEnabled ? 'Enabled via SMS' : 'Add extra security to your account',
              trailing: Switch(
                value: _twoFactorEnabled,
                onChanged: (value) {
                  if (value) {
                    _show2FASetupModal();
                  } else {
                    setState(() => _twoFactorEnabled = false);
                  }
                },
                activeColor: _tealColor,
              ),
            ),
            const Divider(height: 1, indent: 16, endIndent: 16),
            
            // Login Activity
            _buildSecurityItem(
              icon: Icons.history,
              title: _getString('loginActivity'),
              subtitle: 'View recent account access',
              trailing: Icon(Icons.chevron_right, color: _textTertiary),
              onTap: _showLoginActivityModal,
            ),
            const Divider(height: 1, indent: 16, endIndent: 16),
            
            // Active Sessions
            _buildSecurityItem(
              icon: Icons.devices,
              title: _getString('activeSessions'),
              subtitle: '3 devices currently active',
              trailing: Icon(Icons.chevron_right, color: _textTertiary),
              onTap: _showActiveSessionsModal,
            ),
            const Divider(height: 1, indent: 16, endIndent: 16),
            
            // Suspicious Activity Alerts
            _buildSecurityItem(
              icon: Icons.notification_important_outlined,
              title: _getString('suspiciousAlerts'),
              subtitle: 'Get notified about unusual activity',
              trailing: Switch(
                value: _suspiciousActivityAlerts,
                onChanged: (value) {
                  setState(() => _suspiciousActivityAlerts = value);
                  _showSnackBar(value 
                    ? 'Suspicious activity alerts enabled' 
                    : 'Suspicious activity alerts disabled');
                },
                activeColor: _tealColor,
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _buildSecurityItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required Widget trailing,
    VoidCallback? onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(
            children: [
              Icon(icon, color: _tealColor, size: 24),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 15 * _fontSizeMultiplier,
                        fontWeight: FontWeight.w500,
                        color: _textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 13 * _fontSizeMultiplier,
                        color: _textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              trailing,
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppPermissionsCard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: _cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _tealColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.app_settings_alt_outlined, color: _tealColor, size: 24),
                ),
                const SizedBox(width: 12),
                Text(
                  _getString('appPermissions'),
                  style: TextStyle(
                    fontSize: 18 * _fontSizeMultiplier,
                    fontWeight: FontWeight.w600,
                    color: _textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _buildPermissionRow(Icons.mic_outlined, 'Microphone', 'Allowed', true),
            const SizedBox(height: 12),
            _buildPermissionRow(Icons.storage_outlined, 'Local Storage', 'Allowed', true),
            const SizedBox(height: 12),
            _buildPermissionRow(Icons.notifications_outlined, 'Notifications', 'Allowed', true),
            const SizedBox(height: 12),
            _buildPermissionRow(Icons.camera_alt_outlined, 'Camera', 'Denied', false),
          ],
        ),
      ),
    );
  }

  Widget _buildPermissionRow(IconData icon, String name, String status, bool isAllowed) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: isAllowed ? _tealColor : _textTertiary, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: TextStyle(
                    fontSize: 14 * _fontSizeMultiplier,
                    fontWeight: FontWeight.w500,
                    color: _textPrimary,
                  ),
                ),
                Text(
                  status,
                  style: TextStyle(
                    fontSize: 12 * _fontSizeMultiplier,
                    color: isAllowed ? _tealColor : Colors.orange,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () => _showPermissionModal(name),
            style: TextButton.styleFrom(
              foregroundColor: _tealColor,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            ),
            child: Text(
              'Manage',
              style: TextStyle(fontSize: 13 * _fontSizeMultiplier),
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildEncryptionCard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: _cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _tealColor.withValues(alpha: 0.3)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _tealColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.enhanced_encryption_outlined, color: _tealColor, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _getString('encryptionTitle'),
                    style: TextStyle(
                      fontSize: 18 * _fontSizeMultiplier,
                      fontWeight: FontWeight.w600,
                      color: _textPrimary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _buildEncryptionPoint(Icons.lock_outline, _getString('encryptionAtRest')),
            _buildEncryptionPoint(Icons.medical_services_outlined, _getString('secureProcessing')),
            _buildEncryptionPoint(Icons.shield_outlined, _getString('phiIsolation')),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _showEncryptionInfoModal(),
                icon: const Icon(Icons.info_outline, size: 18),
                label: Text(_getString('learnMore')),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _tealColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEncryptionPoint(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, color: _tealColor, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 14 * _fontSizeMultiplier,
                color: _textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCookieControlsCard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: _cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _tealColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.cookie_outlined, color: _tealColor, size: 24),
                ),
                const SizedBox(width: 12),
                Text(
                  _getString('cookieSettings'),
                  style: TextStyle(
                    fontSize: 18 * _fontSizeMultiplier,
                    fontWeight: FontWeight.w600,
                    color: _textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _buildCookieToggle(_getString('essential'), _getString('essentialDesc'), _essentialCookies, null, locked: true),
            _buildCookieToggle(_getString('analytics'), _getString('analyticsDesc'), _analyticsCookies, (v) => setState(() => _analyticsCookies = v)),
            _buildCookieToggle(_getString('personalization'), _getString('personalizationDesc'), _personalizationCookies, (v) => setState(() => _personalizationCookies = v)),
            _buildCookieToggle(_getString('marketing'), _getString('marketingDesc'), _marketingCookies, (v) => setState(() => _marketingCookies = v)),
          ],
        ),
      ),
    );
  }

  Widget _buildCookieToggle(String title, String subtitle, bool value, Function(bool)? onChanged, {bool locked = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 14 * _fontSizeMultiplier,
                        fontWeight: FontWeight.w500,
                        color: _textPrimary,
                      ),
                    ),
                    if (locked) ...[
                      const SizedBox(width: 6),
                      Icon(Icons.lock, size: 14, color: _textTertiary),
                    ],
                  ],
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12 * _fontSizeMultiplier,
                    color: _textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: locked ? null : onChanged,
            activeColor: _tealColor,
          ),
        ],
      ),
    );
  }

  Widget _buildDataToolsCard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: _cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _tealColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.build_outlined, color: _tealColor, size: 24),
                ),
                const SizedBox(width: 12),
                Text(
                  _getString('dataTools'),
                  style: TextStyle(
                    fontSize: 18 * _fontSizeMultiplier,
                    fontWeight: FontWeight.w600,
                    color: _textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _buildDataToolButton(
              icon: Icons.download_outlined,
              title: _getString('exportData'),
              subtitle: _getString('exportDataDesc'),
              onTap: _showExportDataModal,
            ),
            const SizedBox(height: 12),
            _buildDataToolButton(
              icon: Icons.delete_forever_outlined,
              title: _getString('deleteData'),
              subtitle: _getString('deleteDataDesc'),
              onTap: _showDeleteDataModal,
              isDestructive: true,
            ),
            const SizedBox(height: 12),
            _buildDataToolButton(
              icon: Icons.receipt_long_outlined,
              title: _getString('auditLog'),
              subtitle: _getString('auditLogDesc'),
              onTap: () {
                _showSnackBar('Privacy audit log download started');
                // TODO: Connect to backend API for audit log download
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDataToolButton({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isDestructive 
                ? Colors.red.withValues(alpha: 0.05) 
                : _backgroundColor,
            borderRadius: BorderRadius.circular(12),
            border: isDestructive 
                ? Border.all(color: Colors.red.withValues(alpha: 0.2)) 
                : null,
          ),
          child: Row(
            children: [
              Icon(
                icon, 
                color: isDestructive ? Colors.red : _tealColor, 
                size: 24,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 14 * _fontSizeMultiplier,
                        fontWeight: FontWeight.w500,
                        color: isDestructive ? Colors.red : _textPrimary,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12 * _fontSizeMultiplier,
                        color: _textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right, 
                color: isDestructive ? Colors.red.withValues(alpha: 0.5) : _textTertiary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPolicyPreviewCard() {
    final isExpanded = _expandedSections['policyPreview'] ?? false;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: _cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                onTap: () {
                  setState(() {
                    _expandedSections['policyPreview'] = !isExpanded;
                  });
                },
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: _tealColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.description_outlined, color: _tealColor, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _getString('policyPreview'),
                          style: TextStyle(
                            fontSize: 18 * _fontSizeMultiplier,
                            fontWeight: FontWeight.w600,
                            color: _textPrimary,
                          ),
                        ),
                      ),
                      AnimatedRotation(
                        turns: isExpanded ? 0.5 : 0,
                        duration: const Duration(milliseconds: 200),
                        child: Icon(Icons.keyboard_arrow_down, color: _textSecondary),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            AnimatedCrossFade(
              firstChild: const SizedBox.shrink(),
              secondChild: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: _backgroundColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'MedChat AI Privacy Policy\n\n'
                        'Last Updated: December 1, 2025\n\n'
                        '1. Introduction\n'
                        'MedChat AI ("we", "our", or "us") is committed to protecting your privacy. '
                        'This Privacy Policy explains how we collect, use, disclose, and safeguard your information.\n\n'
                        '2. Information We Collect\n'
                        'We collect information you provide directly, including personal identifiers, '
                        'health-related queries, and usage data.\n\n'
                        '3. How We Use Your Information\n'
                        'We use your information to provide and improve our services, personalize your experience, '
                        'and ensure the security of our platform.\n\n'
                        '4. Data Security\n'
                        'We implement industry-standard security measures to protect your data, '
                        'including encryption at rest and in transit.',
                        style: TextStyle(
                          fontSize: 13 * _fontSizeMultiplier,
                          color: _textPrimary,
                          height: 1.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () => _showStubDialog('Full Policy', 'Opening full privacy policy document...'),
                        icon: const Icon(Icons.open_in_new, size: 18),
                        label: const Text('Read Full Policy'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: _tealColor,
                          side: const BorderSide(color: _tealColor),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              crossFadeState: isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 250),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChangelogCard() {
    final isExpanded = _expandedSections['changelog'] ?? false;
    
    final changelogEntries = [
      {'date': 'Dec 1, 2025', 'title': 'Cookie consent improvements', 'type': 'update'},
      {'date': 'Nov 15, 2025', 'title': 'Added data export feature', 'type': 'new'},
      {'date': 'Nov 1, 2025', 'title': 'Enhanced encryption protocols', 'type': 'security'},
      {'date': 'Oct 20, 2025', 'title': 'HIPAA compliance updates', 'type': 'compliance'},
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: _cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                onTap: () {
                  setState(() {
                    _expandedSections['changelog'] = !isExpanded;
                  });
                },
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: _tealColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.history, color: _tealColor, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _getString('changelog'),
                          style: TextStyle(
                            fontSize: 18 * _fontSizeMultiplier,
                            fontWeight: FontWeight.w600,
                            color: _textPrimary,
                          ),
                        ),
                      ),
                      AnimatedRotation(
                        turns: isExpanded ? 0.5 : 0,
                        duration: const Duration(milliseconds: 200),
                        child: Icon(Icons.keyboard_arrow_down, color: _textSecondary),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            AnimatedCrossFade(
              firstChild: const SizedBox.shrink(),
              secondChild: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                child: Column(
                  children: changelogEntries.map((entry) => _buildChangelogEntry(
                    entry['date']!,
                    entry['title']!,
                    entry['type']!,
                  )).toList(),
                ),
              ),
              crossFadeState: isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 250),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChangelogEntry(String date, String title, String type) {
    Color typeColor;
    IconData typeIcon;
    
    switch (type) {
      case 'new':
        typeColor = Colors.green;
        typeIcon = Icons.add_circle_outline;
        break;
      case 'security':
        typeColor = Colors.orange;
        typeIcon = Icons.security;
        break;
      case 'compliance':
        typeColor = Colors.blue;
        typeIcon = Icons.verified_outlined;
        break;
      default:
        typeColor = _tealColor;
        typeIcon = Icons.update;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: _backgroundColor,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Icon(typeIcon, color: typeColor, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14 * _fontSizeMultiplier,
                      fontWeight: FontWeight.w500,
                      color: _textPrimary,
                    ),
                  ),
                  Text(
                    date,
                    style: TextStyle(
                      fontSize: 12 * _fontSizeMultiplier,
                      color: _textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAccessibilityCard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: _cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _tealColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.accessibility_new, color: _tealColor, size: 24),
                ),
                const SizedBox(width: 12),
                Text(
                  _getString('accessibility'),
                  style: TextStyle(
                    fontSize: 18 * _fontSizeMultiplier,
                    fontWeight: FontWeight.w600,
                    color: _textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // Font Size Slider
            Text(
              _getString('textSize'),
              style: TextStyle(
                fontSize: 14 * _fontSizeMultiplier,
                fontWeight: FontWeight.w500,
                color: _textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text('A', style: TextStyle(fontSize: 12, color: _textSecondary)),
                Expanded(
                  child: Slider(
                    value: _fontSizeMultiplier,
                    min: 0.8,
                    max: 1.4,
                    divisions: 6,
                    activeColor: _tealColor,
                    onChanged: (value) {
                      setState(() => _fontSizeMultiplier = value);
                    },
                  ),
                ),
                Text('A', style: TextStyle(fontSize: 20, color: _textSecondary)),
              ],
            ),
            const SizedBox(height: 16),
            
            // High Contrast Toggle
            _buildAccessibilityToggle(
              _getString('highContrast'),
              _getString('highContrastDesc'),
              _highContrastMode,
              (value) => setState(() => _highContrastMode = value),
            ),
            
            // Reader Friendly Toggle
            _buildAccessibilityToggle(
              _getString('readerFriendly'),
              _getString('readerFriendlyDesc'),
              _readerFriendlyMode,
              (value) => setState(() => _readerFriendlyMode = value),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAccessibilityToggle(String title, String subtitle, bool value, Function(bool) onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14 * _fontSizeMultiplier,
                    fontWeight: FontWeight.w500,
                    color: _textPrimary,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12 * _fontSizeMultiplier,
                    color: _textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: _tealColor,
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageSwitcher() {
    final languages = ['English', 'Español', 'हिन्दी', 'Français', '中文'];
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: _cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: _tealColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.language, color: _tealColor, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _getString('language'),
                style: TextStyle(
                  fontSize: 18 * _fontSizeMultiplier,
                  fontWeight: FontWeight.w600,
                  color: _textPrimary,
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: _backgroundColor,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: _dividerColor),
              ),
              child: DropdownButton<String>(
                value: _selectedLanguage,
                underline: const SizedBox(),
                isDense: true,
                icon: const Icon(Icons.keyboard_arrow_down, size: 20),
                items: languages.map((lang) => DropdownMenuItem(
                  value: lang,
                  child: Text(
                    lang,
                    style: TextStyle(fontSize: 14 * _fontSizeMultiplier),
                  ),
                )).toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _selectedLanguage = value);
                    _showSnackBar('Language changed to $value');
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCookieBanner() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: FadeTransition(
        opacity: _bannerFadeAnimation,
        child: Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _cardColor,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.15),
                blurRadius: 20,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.cookie_outlined, color: _tealColor, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Cookie Preferences',
                      style: TextStyle(
                        fontSize: 16 * _fontSizeMultiplier,
                        fontWeight: FontWeight.w600,
                        color: _textPrimary,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => setState(() => _showCookieBanner = false),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'We use cookies to enhance your experience. You can customize your preferences above.',
                style: TextStyle(
                  fontSize: 13 * _fontSizeMultiplier,
                  color: _textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() {
                          _analyticsCookies = false;
                          _personalizationCookies = false;
                          _marketingCookies = false;
                          _showCookieBanner = false;
                        });
                        _showSnackBar('Only essential cookies enabled');
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: _textSecondary,
                        side: BorderSide(color: _dividerColor),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text('Essential Only'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _analyticsCookies = true;
                          _personalizationCookies = true;
                          _marketingCookies = true;
                          _showCookieBanner = false;
                        });
                        _showSnackBar('All cookies accepted');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _tealColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text('Accept All'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }


  // ============ Modal & Dialog Methods ============

  void _showStubDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK', style: TextStyle(color: _tealColor)),
          ),
        ],
      ),
    );
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: _tealColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  void _show2FASetupModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _tealColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.phonelink_lock, color: _tealColor, size: 28),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Text(
                    'Set Up Two-Factor Authentication',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Text(
              'Add an extra layer of security to your account. We\'ll send a verification code to your phone each time you sign in.',
              style: TextStyle(color: Colors.black54, height: 1.5),
            ),
            const SizedBox(height: 24),
            _build2FAOption(Icons.sms, 'SMS Verification', 'Receive codes via text message'),
            const SizedBox(height: 12),
            _build2FAOption(Icons.email_outlined, 'Email Verification', 'Receive codes via email'),
            const SizedBox(height: 12),
            _build2FAOption(Icons.app_shortcut, 'Authenticator App', 'Use Google Authenticator or similar'),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  setState(() => _twoFactorEnabled = true);
                  _showSnackBar('Two-factor authentication enabled');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: _tealColor,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Enable 2FA', style: TextStyle(fontSize: 16)),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel', style: TextStyle(color: Colors.black54)),
              ),
            ),
            SizedBox(height: MediaQuery.of(ctx).padding.bottom),
          ],
        ),
      ),
    );
  }

  Widget _build2FAOption(IconData icon, String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.black12),
      ),
      child: Row(
        children: [
          Icon(icon, color: _tealColor, size: 24),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
                Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.black54)),
              ],
            ),
          ),
          Radio(value: true, groupValue: false, onChanged: (_) {}, activeColor: _tealColor),
        ],
      ),
    );
  }

  void _showLoginActivityModal() {
    final activities = [
      {'device': 'iPhone 14 Pro', 'location': 'New York, US', 'time': '2 hours ago', 'current': true},
      {'device': 'Chrome on Windows', 'location': 'New York, US', 'time': 'Yesterday', 'current': false},
      {'device': 'Safari on MacBook', 'location': 'Boston, US', 'time': '3 days ago', 'current': false},
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.7),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Login Activity',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Recent sign-ins to your account',
              style: TextStyle(color: Colors.black54),
            ),
            const SizedBox(height: 20),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: activities.length,
                separatorBuilder: (_, __) => const Divider(height: 24),
                itemBuilder: (_, i) {
                  final a = activities[i];
                  return Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: a['current'] == true ? _tealColor.withValues(alpha: 0.1) : _backgroundColor,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          a['device'].toString().contains('iPhone') ? Icons.phone_iphone : Icons.computer,
                          color: a['current'] == true ? _tealColor : Colors.black54,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(a['device'] as String, style: const TextStyle(fontWeight: FontWeight.w500)),
                                if (a['current'] == true) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: _tealColor,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text('Current', style: TextStyle(color: Colors.white, fontSize: 10)),
                                  ),
                                ],
                              ],
                            ),
                            Text('${a['location']} • ${a['time']}', style: const TextStyle(fontSize: 12, color: Colors.black54)),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Close', style: TextStyle(color: _tealColor)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showActiveSessionsModal() {
    final sessions = [
      {'device': 'This device', 'browser': 'MedChat App', 'lastActive': 'Now', 'current': true},
      {'device': 'Windows PC', 'browser': 'Chrome', 'lastActive': '5 min ago', 'current': false},
      {'device': 'MacBook Pro', 'browser': 'Safari', 'lastActive': '1 hour ago', 'current': false},
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.7),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Active Sessions',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Devices currently signed in to your account',
              style: TextStyle(color: Colors.black54),
            ),
            const SizedBox(height: 20),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: sessions.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) {
                  final s = sessions[i];
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: s['current'] == true ? _tealColor.withValues(alpha: 0.05) : _backgroundColor,
                      borderRadius: BorderRadius.circular(12),
                      border: s['current'] == true ? Border.all(color: _tealColor.withValues(alpha: 0.3)) : null,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          s['device'].toString().contains('This') ? Icons.phone_android : Icons.computer,
                          color: s['current'] == true ? _tealColor : Colors.black54,
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(s['device'] as String, style: const TextStyle(fontWeight: FontWeight.w500)),
                              Text('${s['browser']} • ${s['lastActive']}', style: const TextStyle(fontSize: 12, color: Colors.black54)),
                            ],
                          ),
                        ),
                        if (s['current'] != true)
                          TextButton(
                            onPressed: () {
                              Navigator.pop(ctx);
                              _showSnackBar('Session terminated');
                            },
                            style: TextButton.styleFrom(foregroundColor: Colors.red),
                            child: const Text('End'),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  _showSnackBar('All other sessions terminated');
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Sign Out All Other Devices'),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Close', style: TextStyle(color: Colors.black54)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showPermissionModal(String permissionName) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('$permissionName Permission'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'MedChat AI uses $permissionName for the following:',
              style: const TextStyle(color: Colors.black87),
            ),
            const SizedBox(height: 16),
            _buildPermissionReason(Icons.mic, 'Voice input for medical queries'),
            _buildPermissionReason(Icons.record_voice_over, 'Speech-to-text conversion'),
            const SizedBox(height: 16),
            const Text(
              'You can change this permission in your device settings.',
              style: TextStyle(fontSize: 12, color: Colors.black54),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.black54)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _showSnackBar('Opening device settings...');
            },
            style: ElevatedButton.styleFrom(backgroundColor: _tealColor),
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }

  Widget _buildPermissionReason(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: _tealColor),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }

  void _showEncryptionInfoModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.8),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _tealColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.enhanced_encryption, color: _tealColor, size: 28),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Text(
                    'How We Protect Your Data',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _buildEncryptionInfoItem(
              'End-to-End Encryption',
              'All messages are encrypted using AES-256 encryption before transmission and remain encrypted at rest.',
              Icons.lock_outline,
            ),
            _buildEncryptionInfoItem(
              'Secure Data Centers',
              'Your data is stored in SOC 2 Type II certified data centers with 24/7 monitoring.',
              Icons.business,
            ),
            _buildEncryptionInfoItem(
              'HIPAA Compliance',
              'We follow HIPAA guidelines for handling protected health information (PHI).',
              Icons.verified_user_outlined,
            ),
            _buildEncryptionInfoItem(
              'Regular Security Audits',
              'Independent security firms conduct regular penetration testing and audits.',
              Icons.security,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Close', style: TextStyle(color: _tealColor)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEncryptionInfoItem(String title, String description, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: _backgroundColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: _tealColor, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(description, style: const TextStyle(fontSize: 13, color: Colors.black54, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showExportDataModal() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.download_outlined, color: _tealColor),
            SizedBox(width: 12),
            Text('Export Your Data', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'We\'ll prepare a download of all your data, including:',
              style: TextStyle(color: Colors.black87),
            ),
            const SizedBox(height: 16),
            _buildExportItem('Profile information'),
            _buildExportItem('Conversation history'),
            _buildExportItem('Saved preferences'),
            _buildExportItem('Usage analytics'),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.blue, size: 20),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Your download will be ready within 24 hours.',
                      style: TextStyle(fontSize: 12, color: Colors.blue),
                    ),
                  ),
                ],
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
            onPressed: () {
              Navigator.pop(ctx);
              _showSnackBar('Data export request submitted');
            },
            style: ElevatedButton.styleFrom(backgroundColor: _tealColor),
            child: const Text('Request Export'),
          ),
        ],
      ),
    );
  }

  Widget _buildExportItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const Icon(Icons.check, size: 16, color: _tealColor),
          const SizedBox(width: 10),
          Text(text, style: const TextStyle(fontSize: 14)),
        ],
      ),
    );
  }

  void _showDeleteDataModal() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.red),
            SizedBox(width: 12),
            Text('Delete All Data', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'This action will permanently delete:',
              style: TextStyle(color: Colors.black87),
            ),
            const SizedBox(height: 16),
            _buildDeleteItem('All conversation history'),
            _buildDeleteItem('Your profile and preferences'),
            _buildDeleteItem('Saved medical information'),
            _buildDeleteItem('Account credentials'),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red, size: 20),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'This action cannot be undone. Your data will be permanently removed within 30 days.',
                      style: TextStyle(fontSize: 12, color: Colors.red),
                    ),
                  ),
                ],
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
            onPressed: () {
              Navigator.pop(ctx);
              _showDeleteConfirmation();
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete My Data'),
          ),
        ],
      ),
    );
  }

  Widget _buildDeleteItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const Icon(Icons.remove_circle_outline, size: 16, color: Colors.red),
          const SizedBox(width: 10),
          Text(text, style: const TextStyle(fontSize: 14)),
        ],
      ),
    );
  }

  void _showDeleteConfirmation() {
    final controller = TextEditingController();
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Confirm Deletion', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Type "DELETE" to confirm:'),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: InputDecoration(
                hintText: 'DELETE',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Colors.red, width: 2),
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
            onPressed: () {
              if (controller.text == 'DELETE') {
                Navigator.pop(ctx);
                _showSnackBar('Data deletion request submitted');
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Confirm Delete'),
          ),
        ],
      ),
    );
  }

  void _showFullPrivacyPolicy() {
    final policyContent = _getLocalizedPolicyContent();
    
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => Scaffold(
          backgroundColor: _backgroundColor,
          appBar: AppBar(
            backgroundColor: _cardColor,
            elevation: 1,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.black87),
              onPressed: () => Navigator.of(context).pop(),
            ),
            title: Text(
              policyContent['appBarTitle']!,
              style: TextStyle(
                color: Colors.black87,
                fontSize: 18 * _fontSizeMultiplier,
                fontWeight: FontWeight.w600,
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.print_outlined, color: Colors.black54),
                onPressed: () => _showSnackBar('Print functionality coming soon'),
                tooltip: 'Print',
              ),
              IconButton(
                icon: const Icon(Icons.share_outlined, color: Colors.black54),
                onPressed: () => _showSnackBar('Share functionality coming soon'),
                tooltip: 'Share',
              ),
              const SizedBox(width: 8),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [_tealColor, _tealLight],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.policy_outlined, size: 48, color: Colors.white),
                      const SizedBox(height: 12),
                      Text(
                        policyContent['headerTitle']!,
                        style: TextStyle(
                          fontSize: 22 * _fontSizeMultiplier,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        policyContent['lastUpdated']!,
                        style: TextStyle(
                          fontSize: 14 * _fontSizeMultiplier,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                
                // Policy Sections
                _buildPolicySection(
                  policyContent['section1Title']!,
                  policyContent['section1Content']!,
                ),
                _buildPolicySection(
                  policyContent['section2Title']!,
                  policyContent['section2Content']!,
                ),
                _buildPolicySection(
                  policyContent['section3Title']!,
                  policyContent['section3Content']!,
                ),
                _buildPolicySection(
                  policyContent['section4Title']!,
                  policyContent['section4Content']!,
                ),
                _buildPolicySection(
                  policyContent['section5Title']!,
                  policyContent['section5Content']!,
                ),
                _buildPolicySection(
                  policyContent['section6Title']!,
                  policyContent['section6Content']!,
                ),
                _buildPolicySection(
                  policyContent['section7Title']!,
                  policyContent['section7Content']!,
                ),
                _buildPolicySection(
                  policyContent['section8Title']!,
                  policyContent['section8Content']!,
                ),
                const SizedBox(height: 24),
                
                // Footer
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _tealColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _tealColor.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.verified_user_outlined, color: _tealColor, size: 32),
                      const SizedBox(height: 8),
                      Text(
                        policyContent['footerTitle']!,
                        style: TextStyle(
                          fontSize: 16 * _fontSizeMultiplier,
                          fontWeight: FontWeight.w600,
                          color: _tealColor,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        policyContent['footerContent']!,
                        style: TextStyle(
                          fontSize: 13 * _fontSizeMultiplier,
                          color: Colors.black54,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPolicySection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 18 * _fontSizeMultiplier,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            content,
            style: TextStyle(
              fontSize: 14 * _fontSizeMultiplier,
              color: Colors.black87,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }

  Map<String, String> _getLocalizedPolicyContent() {
    switch (_selectedLanguage) {
      case 'हिन्दी':
        return {
          'appBarTitle': 'गोपनीयता नीति',
          'headerTitle': 'MedChat AI गोपनीयता नीति',
          'lastUpdated': 'अंतिम अपडेट: 1 दिसंबर, 2025',
          'section1Title': '1. परिचय',
          'section1Content': 'MedChat AI में आपका स्वागत है। हम आपकी गोपनीयता की रक्षा करने और आपकी व्यक्तिगत और स्वास्थ्य जानकारी की सुरक्षा सुनिश्चित करने के लिए प्रतिबद्ध हैं। यह गोपनीयता नीति बताती है कि जब आप हमारे मोबाइल एप्लिकेशन और सेवाओं का उपयोग करते हैं तो हम आपकी जानकारी कैसे एकत्र, उपयोग, प्रकट और सुरक्षित करते हैं।\n\nMedChat AI का उपयोग करके, आप इस नीति के अनुसार जानकारी के संग्रह और उपयोग से सहमत होते हैं।',
          'section2Title': '2. हम कौन सी जानकारी एकत्र करते हैं',
          'section2Content': 'हम अपने एप्लिकेशन के उपयोगकर्ताओं से कई प्रकार की जानकारी एकत्र करते हैं:\n\n• व्यक्तिगत जानकारी: नाम, ईमेल पता, फोन नंबर और खाता क्रेडेंशियल।\n\n• स्वास्थ्य जानकारी: चिकित्सा प्रश्न, आपके द्वारा वर्णित लक्षण, चर्चा की गई स्वास्थ्य स्थितियां और बातचीत का इतिहास।\n\n• डिवाइस जानकारी: डिवाइस प्रकार, ऑपरेटिंग सिस्टम और मोबाइल नेटवर्क जानकारी।',
          'section3Title': '3. हम आपकी जानकारी का उपयोग कैसे करते हैं',
          'section3Content': 'हम एकत्रित जानकारी का उपयोग विभिन्न उद्देश्यों के लिए करते हैं:\n\n• हमारी AI-संचालित चिकित्सा सूचना सेवा प्रदान करने और बनाए रखने के लिए\n\n• आपके अनुभव को व्यक्तिगत बनाने और प्रासंगिक स्वास्थ्य जानकारी प्रदान करने के लिए\n\n• हमारे AI मॉडल और सेवा गुणवत्ता में सुधार करने के लिए\n\n• अपडेट, सुरक्षा अलर्ट और समर्थन के बारे में आपसे संवाद करने के लिए',
          'section4Title': '4. डेटा सुरक्षा',
          'section4Content': 'हम आपकी जानकारी की सुरक्षा के लिए मजबूत सुरक्षा उपाय लागू करते हैं:\n\n• एंड-टू-एंड एन्क्रिप्शन: सभी डेटा TLS 1.3 का उपयोग करके ट्रांजिट में और AES-256 एन्क्रिप्शन का उपयोग करके रेस्ट में एन्क्रिप्ट किया जाता है।\n\n• सुरक्षित इंफ्रास्ट्रक्चर: हमारे सर्वर SOC 2 Type II प्रमाणित डेटा सेंटर में होस्ट किए जाते हैं।\n\n• नियमित ऑडिट: हम स्वतंत्र सुरक्षा फर्मों द्वारा नियमित सुरक्षा ऑडिट करते हैं।',
          'section5Title': '5. HIPAA अनुपालन',
          'section5Content': 'MedChat AI संरक्षित स्वास्थ्य जानकारी (PHI) को संभालने के लिए HIPAA दिशानिर्देशों का पालन करता है। हम आपकी स्वास्थ्य जानकारी के लिए उच्चतम स्तर की सुरक्षा सुनिश्चित करने के लिए स्वेच्छा से HIPAA-संरेखित प्रथाओं को अपनाते हैं।',
          'section6Title': '6. डेटा साझाकरण और प्रकटीकरण',
          'section6Content': 'हम आपकी व्यक्तिगत स्वास्थ्य जानकारी नहीं बेचते हैं। हम केवल निम्नलिखित परिस्थितियों में आपकी जानकारी साझा कर सकते हैं:\n\n• सेवा प्रदाता: विश्वसनीय तृतीय-पक्ष सेवा प्रदाताओं के साथ जो हमारे एप्लिकेशन को संचालित करने में सहायता करते हैं।\n\n• कानूनी आवश्यकताएं: जब कानून, अदालत के आदेश या सरकारी प्राधिकरण द्वारा आवश्यक हो।',
          'section7Title': '7. आपके अधिकार और विकल्प',
          'section7Content': 'आपकी व्यक्तिगत जानकारी के संबंध में आपके निम्नलिखित अधिकार हैं:\n\n• पहुंच: हमारे पास मौजूद व्यक्तिगत डेटा की एक प्रति का अनुरोध करें।\n\n• सुधार: गलत या अपूर्ण डेटा के सुधार का अनुरोध करें।\n\n• हटाना: अपने व्यक्तिगत डेटा को हटाने का अनुरोध करें।\n\n• निर्यात: अपना डेटा पोर्टेबल प्रारूप में डाउनलोड करें।',
          'section8Title': '8. संपर्क करें',
          'section8Content': 'यदि इस गोपनीयता नीति या हमारी डेटा प्रथाओं के बारे में आपके कोई प्रश्न हैं, तो कृपया हमसे संपर्क करें:\n\n• ईमेल: privacy@medchat.ai\n\n• डेटा सुरक्षा अधिकारी: dpo@medchat.ai',
          'footerTitle': 'आपकी गोपनीयता हमारी प्राथमिकता है',
          'footerContent': 'हम सुरक्षा और गोपनीयता के उच्चतम मानकों के साथ आपकी स्वास्थ्य जानकारी की रक्षा करने के लिए प्रतिबद्ध हैं।',
        };
      case 'Français':
        return {
          'appBarTitle': 'Politique de Confidentialité',
          'headerTitle': 'Politique de Confidentialité MedChat AI',
          'lastUpdated': 'Dernière mise à jour: 1 décembre 2025',
          'section1Title': '1. Introduction',
          'section1Content': 'Bienvenue sur MedChat AI. Nous nous engageons à protéger votre vie privée et à assurer la sécurité de vos informations personnelles et de santé. Cette Politique de Confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre application mobile et nos services.\n\nEn utilisant MedChat AI, vous acceptez la collecte et l\'utilisation des informations conformément à cette politique.',
          'section2Title': '2. Informations que Nous Collectons',
          'section2Content': 'Nous collectons plusieurs types d\'informations auprès des utilisateurs de notre application:\n\n• Informations Personnelles: Nom, adresse e-mail, numéro de téléphone et identifiants de compte.\n\n• Informations de Santé: Questions médicales, symptômes décrits, conditions de santé discutées et historique des conversations.\n\n• Informations sur l\'Appareil: Type d\'appareil, système d\'exploitation et informations sur le réseau mobile.',
          'section3Title': '3. Comment Nous Utilisons Vos Informations',
          'section3Content': 'Nous utilisons les informations collectées à diverses fins:\n\n• Pour fournir et maintenir notre service d\'information médicale alimenté par l\'IA\n\n• Pour personnaliser votre expérience et fournir des informations de santé pertinentes\n\n• Pour améliorer nos modèles d\'IA et la qualité du service\n\n• Pour communiquer avec vous concernant les mises à jour et le support',
          'section4Title': '4. Sécurité des Données',
          'section4Content': 'Nous mettons en œuvre des mesures de sécurité robustes pour protéger vos informations:\n\n• Chiffrement de Bout en Bout: Toutes les données sont chiffrées en transit avec TLS 1.3 et au repos avec AES-256.\n\n• Infrastructure Sécurisée: Nos serveurs sont hébergés dans des centres de données certifiés SOC 2 Type II.\n\n• Audits Réguliers: Nous effectuons des audits de sécurité réguliers par des firmes indépendantes.',
          'section5Title': '5. Conformité HIPAA',
          'section5Content': 'MedChat AI suit les directives HIPAA pour le traitement des informations de santé protégées (PHI). Nous adoptons volontairement des pratiques alignées sur HIPAA pour assurer le plus haut niveau de protection de vos informations de santé.',
          'section6Title': '6. Partage et Divulgation des Données',
          'section6Content': 'Nous ne vendons pas vos informations de santé personnelles. Nous pouvons partager vos informations uniquement dans les circonstances suivantes:\n\n• Fournisseurs de Services: Avec des prestataires tiers de confiance qui nous aident à exploiter notre application.\n\n• Exigences Légales: Lorsque requis par la loi ou une autorité gouvernementale.',
          'section7Title': '7. Vos Droits et Choix',
          'section7Content': 'Vous avez les droits suivants concernant vos informations personnelles:\n\n• Accès: Demander une copie des données personnelles que nous détenons.\n\n• Correction: Demander la correction de données inexactes ou incomplètes.\n\n• Suppression: Demander la suppression de vos données personnelles.\n\n• Export: Télécharger vos données dans un format portable.',
          'section8Title': '8. Nous Contacter',
          'section8Content': 'Si vous avez des questions sur cette Politique de Confidentialité, veuillez nous contacter:\n\n• Email: privacy@medchat.ai\n\n• Délégué à la Protection des Données: dpo@medchat.ai',
          'footerTitle': 'Votre vie privée est notre priorité',
          'footerContent': 'Nous nous engageons à protéger vos informations de santé avec les plus hauts standards de sécurité et de confidentialité.',
        };
      case '中文':
        return {
          'appBarTitle': '隐私政策',
          'headerTitle': 'MedChat AI 隐私政策',
          'lastUpdated': '最后更新：2025年12月1日',
          'section1Title': '1. 简介',
          'section1Content': '欢迎使用 MedChat AI。我们致力于保护您的隐私并确保您的个人和健康信息的安全。本隐私政策说明了当您使用我们的移动应用程序和服务时，我们如何收集、使用、披露和保护您的信息。\n\n使用 MedChat AI，即表示您同意按照本政策收集和使用信息。',
          'section2Title': '2. 我们收集的信息',
          'section2Content': '我们从应用程序用户那里收集多种类型的信息：\n\n• 个人信息：姓名、电子邮件地址、电话号码和账户凭证。\n\n• 健康信息：医疗查询、您描述的症状、讨论的健康状况和对话历史。\n\n• 设备信息：设备类型、操作系统和移动网络信息。',
          'section3Title': '3. 我们如何使用您的信息',
          'section3Content': '我们将收集的信息用于各种目的：\n\n• 提供和维护我们的AI医疗信息服务\n\n• 个性化您的体验并提供相关的健康信息\n\n• 改进我们的AI模型和服务质量\n\n• 就更新、安全警报和支持与您沟通',
          'section4Title': '4. 数据安全',
          'section4Content': '我们实施强大的安全措施来保护您的信息：\n\n• 端到端加密：所有数据在传输中使用TLS 1.3加密，在静态时使用AES-256加密。\n\n• 安全基础设施：我们的服务器托管在SOC 2 Type II认证的数据中心。\n\n• 定期审计：我们由独立安全公司进行定期安全审计。',
          'section5Title': '5. HIPAA合规',
          'section5Content': 'MedChat AI 遵循HIPAA指南处理受保护的健康信息（PHI）。我们自愿采用符合HIPAA的做法，以确保对您的健康信息提供最高级别的保护。',
          'section6Title': '6. 数据共享和披露',
          'section6Content': '我们不出售您的个人健康信息。我们仅在以下情况下共享您的信息：\n\n• 服务提供商：与协助运营我们应用程序的可信第三方服务提供商。\n\n• 法律要求：当法律、法院命令或政府机构要求时。',
          'section7Title': '7. 您的权利和选择',
          'section7Content': '您对个人信息拥有以下权利：\n\n• 访问：请求我们持有的个人数据副本。\n\n• 更正：请求更正不准确或不完整的数据。\n\n• 删除：请求删除您的个人数据。\n\n• 导出：以便携格式下载您的数据。',
          'section8Title': '8. 联系我们',
          'section8Content': '如果您对本隐私政策有任何疑问，请联系我们：\n\n• 电子邮件：privacy@medchat.ai\n\n• 数据保护官：dpo@medchat.ai',
          'footerTitle': '您的隐私是我们的首要任务',
          'footerContent': '我们致力于以最高的安全和隐私标准保护您的健康信息。',
        };
      case 'Español':
        return {
          'appBarTitle': 'Política de Privacidad',
          'headerTitle': 'Política de Privacidad de MedChat AI',
          'lastUpdated': 'Última actualización: 1 de diciembre de 2025',
          'section1Title': '1. Introducción',
          'section1Content': 'Bienvenido a MedChat AI. Estamos comprometidos a proteger su privacidad y garantizar la seguridad de su información personal y de salud. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos su información cuando utiliza nuestra aplicación móvil y servicios.\n\nAl usar MedChat AI, acepta la recopilación y uso de información de acuerdo con esta política.',
          'section2Title': '2. Información que Recopilamos',
          'section2Content': 'Recopilamos varios tipos de información de los usuarios de nuestra aplicación:\n\n• Información Personal: Nombre, dirección de correo electrónico, número de teléfono y credenciales de cuenta.\n\n• Información de Salud: Consultas médicas, síntomas descritos, condiciones de salud discutidas e historial de conversaciones.\n\n• Información del Dispositivo: Tipo de dispositivo, sistema operativo e información de red móvil.',
          'section3Title': '3. Cómo Usamos Su Información',
          'section3Content': 'Usamos la información recopilada para varios propósitos:\n\n• Para proporcionar y mantener nuestro servicio de información médica impulsado por IA\n\n• Para personalizar su experiencia y proporcionar información de salud relevante\n\n• Para mejorar nuestros modelos de IA y la calidad del servicio\n\n• Para comunicarnos con usted sobre actualizaciones y soporte',
          'section4Title': '4. Seguridad de Datos',
          'section4Content': 'Implementamos medidas de seguridad robustas para proteger su información:\n\n• Cifrado de Extremo a Extremo: Todos los datos se cifran en tránsito con TLS 1.3 y en reposo con AES-256.\n\n• Infraestructura Segura: Nuestros servidores están alojados en centros de datos certificados SOC 2 Type II.\n\n• Auditorías Regulares: Realizamos auditorías de seguridad regulares por firmas independientes.',
          'section5Title': '5. Cumplimiento HIPAA',
          'section5Content': 'MedChat AI sigue las pautas de HIPAA para el manejo de información de salud protegida (PHI). Adoptamos voluntariamente prácticas alineadas con HIPAA para garantizar el más alto nivel de protección para su información de salud.',
          'section6Title': '6. Compartir y Divulgación de Datos',
          'section6Content': 'No vendemos su información de salud personal. Podemos compartir su información solo en las siguientes circunstancias:\n\n• Proveedores de Servicios: Con proveedores de servicios terceros de confianza que nos ayudan a operar nuestra aplicación.\n\n• Requisitos Legales: Cuando lo requiera la ley o una autoridad gubernamental.',
          'section7Title': '7. Sus Derechos y Opciones',
          'section7Content': 'Tiene los siguientes derechos con respecto a su información personal:\n\n• Acceso: Solicitar una copia de los datos personales que tenemos.\n\n• Corrección: Solicitar la corrección de datos inexactos o incompletos.\n\n• Eliminación: Solicitar la eliminación de sus datos personales.\n\n• Exportación: Descargar sus datos en un formato portátil.',
          'section8Title': '8. Contáctenos',
          'section8Content': 'Si tiene preguntas sobre esta Política de Privacidad, contáctenos:\n\n• Correo electrónico: privacy@medchat.ai\n\n• Oficial de Protección de Datos: dpo@medchat.ai',
          'footerTitle': 'Su privacidad es nuestra prioridad',
          'footerContent': 'Estamos comprometidos a proteger su información de salud con los más altos estándares de seguridad y privacidad.',
        };
      default: // English
        return {
          'appBarTitle': 'Privacy Policy',
          'headerTitle': 'MedChat AI Privacy Policy',
          'lastUpdated': 'Last Updated: December 1, 2025',
          'section1Title': '1. Introduction',
          'section1Content': 'Welcome to MedChat AI. We are committed to protecting your privacy and ensuring the security of your personal and health information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.\n\nBy using MedChat AI, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.',
          'section2Title': '2. Information We Collect',
          'section2Content': 'We collect several types of information from and about users of our application:\n\n• Personal Information: Name, email address, phone number, and account credentials.\n\n• Health Information: Medical queries, symptoms you describe, health conditions discussed, and conversation history.\n\n• Device Information: Device type, operating system, unique device identifiers, and mobile network information.\n\n• Usage Data: How you interact with our app, features used, time spent, and navigation patterns.\n\n• Location Data: General location information based on IP address (we do not collect precise GPS location).',
          'section3Title': '3. How We Use Your Information',
          'section3Content': 'We use the information we collect for various purposes:\n\n• To provide and maintain our AI-powered medical information service\n\n• To personalize your experience and provide relevant health information\n\n• To improve our AI models and service quality (using anonymized data)\n\n• To communicate with you about updates, security alerts, and support\n\n• To detect, prevent, and address technical issues and security threats\n\n• To comply with legal obligations and protect our legal rights',
          'section4Title': '4. Data Security',
          'section4Content': 'We implement robust security measures to protect your information:\n\n• End-to-End Encryption: All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.\n\n• Secure Infrastructure: Our servers are hosted in SOC 2 Type II certified data centers with 24/7 monitoring.\n\n• Access Controls: Strict access controls and authentication mechanisms protect your data from unauthorized access.\n\n• Regular Audits: We conduct regular security audits and penetration testing by independent security firms.',
          'section5Title': '5. HIPAA Compliance',
          'section5Content': 'MedChat AI follows HIPAA (Health Insurance Portability and Accountability Act) guidelines for handling protected health information (PHI). While MedChat AI is an informational tool and not a covered entity under HIPAA, we voluntarily adopt HIPAA-aligned practices to ensure the highest level of protection for your health information.',
          'section6Title': '6. Data Sharing and Disclosure',
          'section6Content': 'We do not sell your personal health information. We may share your information only in the following circumstances:\n\n• Service Providers: With trusted third-party service providers who assist in operating our application (hosting, analytics, customer support).\n\n• Legal Requirements: When required by law, court order, or governmental authority.\n\n• Safety: To protect the safety, rights, or property of MedChat AI, our users, or the public.\n\n• Business Transfers: In connection with a merger, acquisition, or sale of assets (with prior notice to users).',
          'section7Title': '7. Your Rights and Choices',
          'section7Content': 'You have the following rights regarding your personal information:\n\n• Access: Request a copy of the personal data we hold about you.\n\n• Correction: Request correction of inaccurate or incomplete data.\n\n• Deletion: Request deletion of your personal data (subject to legal retention requirements).\n\n• Export: Download your data in a portable format.\n\n• Opt-Out: Opt out of marketing communications and certain data processing activities.\n\n• Withdraw Consent: Withdraw consent for data processing at any time.',
          'section8Title': '8. Contact Us',
          'section8Content': 'If you have any questions about this Privacy Policy or our data practices, please contact us:\n\n• Email: privacy@medchat.ai\n\n• Address: MedChat AI, Inc.\n123 Health Street\nSan Francisco, CA 94102\nUnited States\n\n• Data Protection Officer: dpo@medchat.ai',
          'footerTitle': 'Your privacy is our priority',
          'footerContent': 'We are committed to protecting your health information with the highest standards of security and privacy.',
        };
    }
  }
}
