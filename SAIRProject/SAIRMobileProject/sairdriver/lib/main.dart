import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:sairdriver/Splash_Screen.dart';
import 'package:sairdriver/screens/ViolationsList.dart';
import 'package:sairdriver/screens/login.dart';
void main() {
  Firebase.initializeApp();
runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
   return MaterialApp(
    debugShowCheckedModeBanner: false,
    home: Violationslist(), 
   ) ;
  }
}
