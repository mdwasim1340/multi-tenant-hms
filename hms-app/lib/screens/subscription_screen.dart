import 'package:flutter/material.dart';
import '../theme/theme_provider.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});
  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  bool _isYearly = false;
  bool _showTrialBanner = true;
  bool _simulateError = false;
  String _selectedPlan = 'Basic';
  final List<bool> _faqExpanded = [false, false, false];

  // MedChat subscription pricing (in INR)
  static const double _basicMonthly = 0.0; // Free
  static const double _advanceMonthly = 2999.0;
  static const double _premiumMonthly = 9999.0;

  double get _basicPrice => 0.0; // Always free
  double get _advancePrice => _isYearly ? (_advanceMonthly * 12 * 0.8) : _advanceMonthly;
  double get _premiumPrice => _isYearly ? (_premiumMonthly * 12 * 0.8) : _premiumMonthly;
  String get _billingPeriod => _isYearly ? '/yr' : '/mo';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final backgroundColor =
        isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary =
        isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary =
        isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: cardColor,
        elevation: 1,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Subscription',
          style: TextStyle(
              color: textPrimary, fontSize: 18, fontWeight: FontWeight.w600),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _hero(),
              if (_showTrialBanner) _trial(isDark, textPrimary, textSecondary, cardColor),
              const SizedBox(height: 24),
              _toggle(isDark, cardColor, textPrimary),
              const SizedBox(height: 24),
              _cards(isDark, cardColor, textPrimary),
              const SizedBox(height: 16),
              _links(textSecondary),
              const SizedBox(height: 32),
              _grid(isDark, cardColor, textPrimary, textSecondary),
              const SizedBox(height: 32),
              _faqSection(isDark, cardColor, textPrimary, textSecondary),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _hero() => Container(
        color: AppColors.tealPrimary,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(10)),
              child: const Center(
                  child: Text('M',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold))),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Choose a plan that's right for you",
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(
                      'Upgrade to unlock video consultations, family accounts, and unlimited access.',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 11)),
                ],
              ),
            ),
          ],
        ),
      );

  Widget _trial(bool isDark, Color textPrimary, Color textSecondary, Color cardColor) =>
      Container(
        margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.tealPrimary.withOpacity(isDark ? 0.2 : 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.tealPrimary.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            const Icon(Icons.star, color: AppColors.tealPrimary, size: 24),
            const SizedBox(width: 12),
            Expanded(
                child: Text('Start 7-day free trial on Advance',
                    style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: textPrimary))),
            TextButton(
                onPressed: () => _confirm('Advance', _advancePrice, trial: true),
                child: const Text('Start trial')),
            IconButton(
                icon: Icon(Icons.close, size: 20, color: textSecondary),
                onPressed: () => setState(() => _showTrialBanner = false)),
          ],
        ),
      );

  Widget _toggle(bool isDark, Color cardColor, Color textPrimary) => Center(
        child: Container(
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(30),
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.3 : 0.12),
                  blurRadius: 8)
            ],
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            _tgl('Monthly', !_isYearly, () => setState(() => _isYearly = false),
                textPrimary),
            _tgl('Yearly', _isYearly, () => setState(() => _isYearly = true),
                textPrimary,
                badge: true),
          ]),
        ),
      );

  Widget _tgl(String l, bool sel, VoidCallback tap, Color textPrimary,
          {bool badge = false}) =>
      GestureDetector(
        onTap: tap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          decoration: BoxDecoration(
              color: sel ? AppColors.tealPrimary : Colors.transparent,
              borderRadius: BorderRadius.circular(30)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text(l,
                style: TextStyle(
                    color: sel ? Colors.white : textPrimary,
                    fontWeight: FontWeight.w600)),
            if (badge) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                    color: sel
                        ? Colors.white24
                        : AppColors.tealPrimary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8)),
                child: Text('-20%',
                    style: TextStyle(
                        color: sel ? Colors.white : AppColors.tealPrimary,
                        fontSize: 10,
                        fontWeight: FontWeight.bold)),
              ),
            ],
          ]),
        ),
      );

  Widget _cards(bool isDark, Color cardColor, Color textPrimary) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          _card('Basic', _basicPrice, 'Free', [
            'Chat support with healthcare professionals',
            'Appointment booking',
            'Prescription access and management',
            'Medical records view',
            '5 consultations per month',
            '1 GB storage'
          ], isDark, cardColor, textPrimary),
          const SizedBox(height: 16),
          _card('Advance', _advancePrice, '₹${_advancePrice.toStringAsFixed(0)}$_billingPeriod', [
            'All Basic features',
            'Video consultation (300 min/month)',
            'Priority support',
            'Health tracking (vitals, medications)',
            'Family accounts (up to 4 members)',
            '20 consultations per month',
            '5 GB storage'
          ], isDark, cardColor, textPrimary),
          const SizedBox(height: 16),
          _card('Premium', _premiumPrice, '₹${_premiumPrice.toStringAsFixed(0)}$_billingPeriod', [
            'All Advance features',
            'Unlimited consultations',
            'Unlimited video minutes',
            'Extended family accounts (up to 10 members)',
            '20 GB storage',
            'Premium priority support'
          ], isDark, cardColor, textPrimary),
        ],
      ),
    );
  }

  Widget _card(String name, double price, String label, List<String> bullets,
      bool isDark, Color cardColor, Color textPrimary) {
    final isSelected = _selectedPlan == name;
    return Container(
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        border: isSelected
            ? Border.all(color: AppColors.tealPrimary, width: 2)
            : null,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(
                  isSelected ? (isDark ? 0.3 : 0.12) : (isDark ? 0.2 : 0.06)),
              blurRadius: isSelected ? 16 : 10,
              offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (isSelected)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: const BoxDecoration(
                  color: AppColors.tealPrimary,
                  borderRadius:
                      BorderRadius.vertical(top: Radius.circular(14))),
              child: const Center(
                  child: Text('SELECTED',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1))),
            ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: textPrimary)),
                const SizedBox(height: 8),
                Text(label,
                    style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color:
                            isSelected ? AppColors.tealPrimary : textPrimary)),
                const SizedBox(height: 16),
                ...bullets.map((b) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.check_circle,
                              color: AppColors.tealPrimary, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                              child: Text(b,
                                  style: TextStyle(
                                      fontSize: 14,
                                      height: 1.3,
                                      color: textPrimary)))
                        ]))),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () {
                      if (name == 'Basic' && price == 0) {
                        setState(() => _selectedPlan = name);
                        _snack('Basic plan activated!');
                      } else if (isSelected) {
                        _confirm(name, price);
                      } else {
                        setState(() => _selectedPlan = name);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          isSelected ? AppColors.tealPrimary : cardColor,
                      foregroundColor:
                          isSelected ? Colors.white : AppColors.tealPrimary,
                      elevation: isSelected ? 2 : 0,
                      side: isSelected
                          ? null
                          : const BorderSide(
                              color: AppColors.tealPrimary, width: 1.5),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(
                        name == 'Basic' 
                            ? (isSelected ? 'Current Plan' : 'Select Basic')
                            : (isSelected ? 'Continue' : 'Select $name'),
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _links(Color textSecondary) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextButton(
                onPressed: () => _snack('Purchases restored successfully!'),
                child: Text('Restore Purchases',
                    style: TextStyle(color: textSecondary))),
            Text(' • ', style: TextStyle(color: textSecondary)),
            TextButton(
                onPressed: _promo,
                child: Text('Have a promo code?',
                    style: TextStyle(color: textSecondary))),
          ],
        ),
      );

  Widget _grid(bool isDark, Color cardColor, Color textPrimary,
          Color textSecondary) =>
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
                padding: const EdgeInsets.only(left: 4, bottom: 16),
                child: Text('Compare Plans',
                    style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: textPrimary))),
            Container(
              decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.2 : 0.05),
                      blurRadius: 8)
                ],
              ),
              child: Column(
                children: [
                  _row('', 'Basic', 'Advance', 'Premium', true, textPrimary,
                      textSecondary),
                  Divider(
                      height: 1,
                      color: isDark
                          ? AppColors.darkDivider
                          : AppColors.lightDivider),
                  _row('Chat support', '✓', '✓', '✓', false, textPrimary,
                      textSecondary),
                  Divider(
                      height: 1,
                      color: isDark
                          ? AppColors.darkDivider
                          : AppColors.lightDivider),
                  _row('Video consultation', '—', '✓', '✓', false, textPrimary,
                      textSecondary),
                  Divider(
                      height: 1,
                      color: isDark
                          ? AppColors.darkDivider
                          : AppColors.lightDivider),
                  _row('Consultations/month', '5', '20', 'Unlimited', false, textPrimary,
                      textSecondary),
                  Divider(
                      height: 1,
                      color: isDark
                          ? AppColors.darkDivider
                          : AppColors.lightDivider),
                  _row('Family members', '1', '4', '10', false, textPrimary,
                      textSecondary),
                  Divider(
                      height: 1,
                      color: isDark
                          ? AppColors.darkDivider
                          : AppColors.lightDivider),
                  _row('Storage', '1 GB', '5 GB', '20 GB', false, textPrimary,
                      textSecondary),
                ],
              ),
            ),
          ],
        ),
      );

  Widget _row(String f, String b, String p, String pr, bool h, Color textPrimary,
      Color textSecondary) {
    final s = TextStyle(
        fontSize: 13,
        fontWeight: h ? FontWeight.bold : FontWeight.normal,
        color: textPrimary);
    Widget c(String v) => Center(
        child: Text(v,
            style: h
                ? s
                : TextStyle(
                    fontSize: 14,
                    color: v == '—' ? textSecondary : AppColors.tealPrimary,
                    fontWeight: FontWeight.w500)));
    return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        child: Row(children: [
          Expanded(flex: 3, child: Text(f, style: s)),
          Expanded(flex: 2, child: c(b)),
          Expanded(flex: 2, child: c(p)),
          Expanded(flex: 2, child: c(pr))
        ]));
  }

  Widget _faqSection(bool isDark, Color cardColor, Color textPrimary,
      Color textSecondary) {
    final qs = [
      'How do trials work?',
      'How do I cancel?',
      'Can I upgrade or downgrade?'
    ];
    final as_ = [
      'The trial starts immediately and converts to paid unless cancelled.',
      'Cancel in the app or via your account page.',
      'Yes—changes apply at next billing cycle.'
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 16),
              child: Text('Frequently Asked Questions',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: textPrimary))),
          Container(
            decoration: BoxDecoration(
              color: cardColor,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withOpacity(isDark ? 0.2 : 0.05),
                    blurRadius: 8)
              ],
            ),
            child: Column(
              children: List.generate(qs.length, (i) {
                final last = i == qs.length - 1;
                return Column(
                  children: [
                    InkWell(
                      onTap: () =>
                          setState(() => _faqExpanded[i] = !_faqExpanded[i]),
                      child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(children: [
                            Expanded(
                                child: Text(qs[i],
                                    style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w500,
                                        color: textPrimary))),
                            AnimatedRotation(
                                turns: _faqExpanded[i] ? 0.5 : 0,
                                duration: const Duration(milliseconds: 200),
                                child: Icon(Icons.keyboard_arrow_down,
                                    color: textSecondary))
                          ])),
                    ),
                    AnimatedCrossFade(
                        firstChild: const SizedBox.shrink(),
                        secondChild: Padding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                            child: Text(as_[i],
                                style: TextStyle(
                                    fontSize: 14,
                                    color: textSecondary,
                                    height: 1.4))),
                        crossFadeState: _faqExpanded[i]
                            ? CrossFadeState.showSecond
                            : CrossFadeState.showFirst,
                        duration: const Duration(milliseconds: 200)),
                    if (!last)
                      Divider(
                          height: 1,
                          color: isDark
                              ? AppColors.darkDivider
                              : AppColors.lightDivider),
                  ],
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  void _confirm(String plan, double price, {bool trial = false}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary =
        isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary =
        isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;

    bool err = false, loading = false;
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, set) => AlertDialog(
          backgroundColor: cardColor,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(trial ? 'Start Free Trial' : 'Confirm Purchase',
              style:
                  TextStyle(fontWeight: FontWeight.bold, color: textPrimary)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (err) ...[
                Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(8)),
                    child: Row(children: [
                      Icon(Icons.error_outline,
                          color: Colors.red.shade700, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                          child: Text('Payment failed. Please try again.',
                              style: TextStyle(
                                  color: Colors.red.shade700, fontSize: 13)))
                    ])),
                const SizedBox(height: 16),
              ],
              _mrow('Plan', plan, textPrimary, textSecondary),
              const SizedBox(height: 8),
              _mrow(
                  'Price',
                  trial
                      ? 'Free for 7 days, then ₹${_advancePrice.toStringAsFixed(0)}$_billingPeriod'
                      : (price == 0
                          ? 'Free'
                          : '₹${price.toStringAsFixed(0)}$_billingPeriod'),
                  textPrimary,
                  textSecondary),
              const SizedBox(height: 8),
              _mrow('Billing', _isYearly ? 'Yearly' : 'Monthly', textPrimary,
                  textSecondary),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx),
                child:
                    Text('Cancel', style: TextStyle(color: textSecondary))),
            if (err)
              TextButton(
                onPressed: loading
                    ? null
                    : () {
                        set(() => loading = true);
                        Future.delayed(const Duration(milliseconds: 500), () {
                          if (!_simulateError) {
                            Navigator.pop(ctx);
                            _snack(trial
                                ? 'Trial started!'
                                : 'Subscription activated');
                          } else {
                            set(() => loading = false);
                          }
                        });
                      },
                child: loading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Try Again'),
              )
            else
              ElevatedButton(
                onPressed: loading
                    ? null
                    : () {
                        set(() => loading = true);
                        Future.delayed(const Duration(milliseconds: 500), () {
                          if (_simulateError) {
                            set(() {
                              err = true;
                              loading = false;
                            });
                          } else {
                            Navigator.pop(ctx);
                            _snack(trial
                                ? 'Trial started!'
                                : 'Subscription activated');
                          }
                        });
                      },
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.tealPrimary),
                child: loading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Text('Confirm'),
              ),
          ],
        ),
      ),
    );
  }

  Widget _mrow(String l, String v, Color textPrimary, Color textSecondary) =>
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(l, style: TextStyle(color: textSecondary, fontSize: 14)),
        Flexible(
            child: Text(v,
                style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: textPrimary),
                textAlign: TextAlign.end))
      ]);

  void _promo() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary =
        isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary =
        isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;

    final c = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: cardColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Enter Promo Code',
            style: TextStyle(fontWeight: FontWeight.bold, color: textPrimary)),
        content: TextField(
          controller: c,
          autofocus: true,
          style: TextStyle(color: textPrimary),
          decoration: InputDecoration(
            hintText: 'Enter code',
            hintStyle: TextStyle(color: textSecondary),
            filled: true,
            fillColor: isDark ? AppColors.darkSurface : Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide:
                    const BorderSide(color: AppColors.tealPrimary, width: 2)),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('Cancel', style: TextStyle(color: textSecondary))),
          ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                _snack(c.text.isNotEmpty
                    ? 'Promo code applied!'
                    : 'Please enter a valid code');
              },
              style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.tealPrimary),
              child: const Text('Apply')),
        ],
      ),
    );
  }

  void _snack(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [
        const Icon(Icons.check_circle, color: Colors.white, size: 20),
        const SizedBox(width: 8),
        Text(m)
      ]),
      backgroundColor: AppColors.tealPrimary,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))));
}
