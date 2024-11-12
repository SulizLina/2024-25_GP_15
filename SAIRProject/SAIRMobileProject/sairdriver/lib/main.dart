import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:sairdriver/screens/welcomepage.dart';
import 'package:sairdriver/screens/login_email.dart';
import 'package:animated_splash_screen/animated_splash_screen.dart';
import 'package:sairdriver/services/NotificationService.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

void main() async {
  // Ensure that Firebase is initialized before running the app
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Register the background message handler
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  
  runApp(MainApp());
}

// Background message handler (called when app is in the background or terminated)
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Handle background messages here (optional logging, etc.)
  print('Handling a background message: ${message.messageId}');
  // You can perform additional actions here, like logging or background tasks.
}

class MainApp extends StatelessWidget {
  final NotificationService _notificationService = NotificationService();
  
  MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: SplashPage(),
    );
  }

  // Initialize notifications after Firebase is ready
  void initNotifications(String driverId) {
    _notificationService.init(driverId);
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
              splashTransition: SplashTransition.scaleTransition, // Add animation for the logo
              backgroundColor: Colors.transparent, // Make the background transparent to retain the design
            ),
          ),
        ],
      ),
    );
  }
}