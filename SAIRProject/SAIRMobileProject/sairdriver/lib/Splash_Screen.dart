import 'package:flutter/material.dart';
import 'dart:async';

import 'package:sairdriver/screens/login.dart'; // Import this for Timer functionality

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    // Set a timer to automatically navigate to the next screen after 3 seconds
    Timer(Duration(seconds: 3), () {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => Login()), 
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white, // Customize your background color
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              'assets/image/SAIRLogo.png', 
              height: 150, // Adjust size
            ),
            SizedBox(height: 20),
            Text(
              "Welcome to SAIR", // Splash screen text
              style: TextStyle(
                fontSize: 24.0,
                fontWeight: FontWeight.bold,
                color: Color.fromARGB(202, 3, 152, 85), // Your theme color
              ),
            ),
          ],
        ),
      ),
    );
  }
}
