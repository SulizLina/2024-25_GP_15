import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:sairdriver/screens/welcomepage.dart';
import 'package:animated_splash_screen/animated_splash_screen.dart';

void main() async {
  // Ensure that Firebase is initialized before running the app
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
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
              nextScreen: Welcomepage(), // The next screen to transition to
              splashTransition: SplashTransition.scaleTransition, // Add animation for the logo
              backgroundColor: Colors.transparent, // Make the background transparent to retain the design
            ),
          ),
        ],
      ),
    );
  }
}