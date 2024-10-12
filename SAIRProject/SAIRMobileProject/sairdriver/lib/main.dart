import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';

import 'package:sairdriver/screens/ViewComplaints.dart';
import 'package:sairdriver/screens/ViolationsList.dart';
import 'package:sairdriver/screens/login.dart';
import 'package:sairdriver/screens/profilepage.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth; // Alias firebase's User
import 'screens/bottom_nav_bar.dart';
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
   home: Profilepage() /*AnimatedSplashScreen(
            duration: 3000,
            splashIconSize: 160, // size of logo
            splash:Image.asset('assets/image/SAIRLogo.png',
            ),
            nextScreen: Login(),// navigate to this screen
            splashTransition: SplashTransition.scaleTransition, // the way of transition
            )*/
  );
  
  }

/*
  @override
  Widget build(BuildContext context) {
    return StreamProvider<User?>.value(
      value: AuthService().user,
      initialData: null, // Set initial data to null
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Login(),
      ),
    );
  }
  */
}