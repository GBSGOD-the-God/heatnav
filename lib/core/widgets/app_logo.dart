import 'dart:math' as math;

import 'package:flutter/material.dart';

/// HeatNav's brand mark, drawn entirely in code (no image asset) so it stays
/// crisp at any size and needs no per-platform icon plumbing.
///
/// The mark fuses the app's two ideas: a **sun** (heat) whose core holds a
/// **navigation needle** (safe passage through it).
class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.size = 96});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.28),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFC24B), Color(0xFFFB6514), Color(0xFFE4381E)],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFB6514).withValues(alpha: 0.35),
            blurRadius: size * 0.25,
            offset: Offset(0, size * 0.08),
          ),
        ],
      ),
      child: CustomPaint(painter: _SunCompassPainter()),
    );
  }
}

class _SunCompassPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width * 0.22;
    final white = Colors.white;

    // Sun rays: twelve tapered spokes around the core.
    final rayPaint = Paint()
      ..color = white.withValues(alpha: 0.92)
      ..strokeCap = StrokeCap.round
      ..strokeWidth = size.width * 0.035;
    final innerR = radius * 1.5;
    final outerR = radius * 2.05;
    for (var i = 0; i < 12; i++) {
      final angle = (i / 12) * 2 * math.pi;
      final dir = Offset(math.cos(angle), math.sin(angle));
      canvas.drawLine(center + dir * innerR, center + dir * outerR, rayPaint);
    }

    // Sun core.
    canvas.drawCircle(
      center,
      radius,
      Paint()..color = white.withValues(alpha: 0.18),
    );
    canvas.drawCircle(
      center,
      radius * 0.82,
      Paint()..color = white,
    );

    // Navigation needle inside the core: an upward arrow in the brand orange.
    final needle = Path();
    final h = radius * 0.95;
    final w = radius * 0.5;
    needle.moveTo(center.dx, center.dy - h * 0.7); // tip
    needle.lineTo(center.dx - w, center.dy + h * 0.55);
    needle.lineTo(center.dx, center.dy + h * 0.2); // notch
    needle.lineTo(center.dx + w, center.dy + h * 0.55);
    needle.close();
    canvas.drawPath(needle, Paint()..color = const Color(0xFFFB6514));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
