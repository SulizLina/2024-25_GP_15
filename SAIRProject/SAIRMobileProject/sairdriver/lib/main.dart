import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:sairdriver/models/driver.dart';
import 'package:sairdriver/screens/CrashesList.dart';
import 'package:sairdriver/screens/bottom_nav_bar.dart';
import 'package:sairdriver/screens/home.dart';
import 'package:sairdriver/screens/welcomepage.dart';
import 'package:sairdriver/screens/login_email.dart';
import 'package:animated_splash_screen/animated_splash_screen.dart';
import 'package:sairdriver/services/NotificationService.dart';
import 'dart:convert';
import 'package:sairdriver/screens/ViolationsList.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('Handling a background message ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  _setupFirebaseMessaging();
  runApp(const InitialApp());
}
void _setupFirebaseMessaging() {
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  final driverData = message.data['driverData'] ?? '';
  final screen = message.data['screen'] ?? '';

  if (driverData.isNotEmpty) {
    if (screen == 'ViolationsList') {
      // Update the index for Violations tab
      navigatorKey.currentState?.pushReplacement(
        MaterialPageRoute(
          builder: (context) => BottomNavBar(
            driverId: driverData,
            initialIndex: 1, // Set index for Violations tab
          ),
        ),
      );
    } else if (screen == 'CrashList') {
      navigatorKey.currentState?.pushReplacement(
        MaterialPageRoute(
          builder: (context) => BottomNavBar(
            driverId: driverData,
            initialIndex: 0, // Set index for Crashes tab
          ),
        ),
      );
    }
  }
});

}
class InitialApp extends StatelessWidget {
  const InitialApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      navigatorKey: navigatorKey,
      home: SplashPage(),
    );
  }
}

class MainApp extends StatefulWidget {
  final String driverId;
  const MainApp({super.key, required this.driverId});

  @override
  _MainAppState createState() => _MainAppState();
}

class _MainAppState extends State<MainApp> {
  final NotificationService notificationService = NotificationService();

  @override
  void initState() {
    super.initState();
    _initializeNotificationService();
    _setupFirebaseMessaging();
  }

  Future<void> _initializeNotificationService() async {
    await notificationService.init(widget.driverId);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      navigatorKey: navigatorKey,
      home: SplashPage(),
    );
  }
}

class SplashPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Full-screen background with circular pattern
          Container(
            width: double.infinity, // Full screen width
            height: double.infinity, // Full screen height
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.white, Colors.white],
              ),
            ),
            child: Opacity(
              opacity: 0.1, // Set the transparency to 10%
              child: Image.asset(
                'assets/image/SGreenCircularPattern.png', // Circular pattern background
                fit: BoxFit.cover, // Ensure the image fills the entire screen
                width: double.infinity, // Make the image as wide as the screen
                height: double.infinity,
              ),
            ),
          ),
          // AnimatedSplashScreen integration for functionality
          Center(
            child: AnimatedSplashScreen(
              duration: 2000,
              splashIconSize: 160,
              splash: Image.asset(
                'assets/image/SAIRLogo.png', // Logo image
              ),
              nextScreen: LoginEmail(), // The next screen to transition to
              splashTransition: SplashTransition
                  .scaleTransition, // Add animation for the logo
              backgroundColor: Colors
                  .transparent, // Make the background transparent to retain the design
            ),
          ),
        ],
      ),
    );
  }
}
