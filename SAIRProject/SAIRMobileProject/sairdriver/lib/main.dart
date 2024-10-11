import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:sairdriver/Splash_Screen.dart';
import 'package:sairdriver/models/user.dart'; // Your custom User class
import 'package:sairdriver/screens/ViolationsList.dart';
import 'package:sairdriver/screens/login.dart';
import 'package:sairdriver/services/auth.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth; // Alias firebase's User
//import 'package:flutter_nav/bottom_nav/my_bottom_nav.dart';

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
    return StreamProvider<User?>.value(
      value: AuthService().user,
      initialData: null, // Set initial data to null
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Login(),
      ),
    );
  }
}
