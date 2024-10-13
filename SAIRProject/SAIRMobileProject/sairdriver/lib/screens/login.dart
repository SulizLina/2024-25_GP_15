import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/screens/Forgotpass.dart';
import 'package:sairdriver/messages/phone_validator.dart';
import 'login_otp.dart';

class Login extends StatefulWidget {
  const Login({super.key});

  @override
  State<Login> createState() => _LoginState();
}

class _LoginState extends State<Login> {
  late final TextEditingController _phoneController;
  late final TextEditingController _passwordController;
  bool _isPasswordVisible = false; // For toggling password visibility
  String? errorMessage;

  @override
  void initState() {
    _phoneController = TextEditingController();
    _passwordController = TextEditingController();
    super.initState();
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

// Updated validatePassword function
String? validatePassword(String? value) {
  if (value == null || value.isEmpty) {
    return 'Your password is required';
  } else if (value.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  return null; // Return null if the input is valid
}

  Future<void> login() async {
    try {
      final db = FirebaseFirestore.instance;
      // Retrieve the phone number from Firestore
      final driverDoc = await db
          .collection('Driver')
          .where('PhoneNumber', isEqualTo: _phoneController.text)
          .limit(1)
          .get();

      // Check if driver exists and the password matches
      if (driverDoc.docs.isEmpty) {
        setState(() {
          errorMessage = "Phone number not found.";
        });
        return;
      }

      // Retrieve the correct password from Firestore
      final storedPassword = driverDoc.docs.first.data()['Password'];

      if (storedPassword != _passwordController.text) {
        setState(() {
          errorMessage = "Incorrect password.";
        });
        return;
      }

      // If both phone and password are correct, proceed with OTP verification
      final phone = _phoneController.text;

      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: phone,
        verificationCompleted: (PhoneAuthCredential credential) {
          // Handle verification completion if necessary
        },
        verificationFailed: (FirebaseAuthException error) {
          log(error.toString());
        },
        codeSent: (String verificationId, int? forceResendingToken) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => LoginOtp(verificationId: verificationId),
            ),
          );
        },
        codeAutoRetrievalTimeout: (String verificationId) {
          log('Auto Retrieval Timeout');
        },
      );
    } catch (e) {
      log(e.toString());
      setState(() {
        errorMessage = "An error occurred. Please try again.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        backgroundColor: Colors.white,
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                // Center the logo
                child: Image.asset(
                  'assets/image/SAIRLogo.png', // Logo asset path
                  height: 200,
                ),
              ),
              const SizedBox(height: 20.0),
              Text(
                " Welcome to SAIR,\n Glad to see you again!",
                style: GoogleFonts.poppins(
                  color: Color.fromARGB(202, 3, 152, 85),
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.left,
              ),
              const SizedBox(height: 44.0),
              // Phone Number Input Field with Icon
              TextFormField(
                controller: _phoneController,
                decoration: InputDecoration(
                  labelText: 'Enter your number with country code',
                  prefixIcon: Icon(
                    Icons.phone, // Icon for phone input
                    color: Color.fromARGB(201, 3, 152, 85),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color: Color.fromARGB(201, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color: errorMessage == null
                          ? Color.fromARGB(201, 3, 152, 85)
                          : Colors.red,
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  errorBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color: Colors.red,
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedErrorBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color: Colors.red,
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  errorStyle: TextStyle(
                    fontSize: 12,
                    color: Colors.red,
                    height: 1.2,
                  ),
                ),
                keyboardType: TextInputType.phone,
                validator: validatePhoneNumber, // Phone validator logic
              ),
              const SizedBox(height: 10),
              // Error Message Display
              if (errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: Text(
                    errorMessage!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.red,
                      height: 1.2,
                    ),
                  ),
                ),
              const SizedBox(height: 10),
              // Password Input Field with Icon
             // Password Input Field with Icon
TextFormField(
  controller: _passwordController,
  obscureText: !_isPasswordVisible,
  decoration: InputDecoration(
    labelText: 'Enter Your Password',
    prefixIcon: Icon(
      Icons.lock, // Icon for password input
      color: Color.fromARGB(201, 3, 152, 85),
    ),
    suffixIcon: IconButton(
      icon: Icon(
        _isPasswordVisible
            ? Icons.visibility
            : Icons.visibility_off,
        color: Colors.grey,
      ),
      onPressed: () {
        setState(() {
          _isPasswordVisible = !_isPasswordVisible;
        });
      },
    ),
    enabledBorder: OutlineInputBorder(
      borderSide: BorderSide(
        color: Color.fromARGB(201, 3, 152, 85),
        width: 1.5,
      ),
      borderRadius: BorderRadius.circular(10),
    ),
    focusedBorder: OutlineInputBorder(
      borderSide: BorderSide(
        color: Color.fromARGB(201, 3, 152, 85),
        width: 2.0,
      ),
      borderRadius: BorderRadius.circular(10),
    ),
    errorBorder: OutlineInputBorder(
      borderSide: BorderSide(
        color: Colors.red,
        width: 1.5,
      ),
      borderRadius: BorderRadius.circular(10),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderSide: BorderSide(
        color: Colors.red,
        width: 2.0,
      ),
      borderRadius: BorderRadius.circular(10),
    ),
  ),
  validator: (value) => validatePassword(value),
),

              const SizedBox(height: 12.0),
              GestureDetector(
                onTap: () {
                  Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => const Forgotpass()));
                },
                child: Text(
                  "Forgot your password?",
                  style: GoogleFonts.poppins(
                    color: Color.fromARGB(202, 3, 152, 85),
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(height: 88.0),
              Container(
                width: double.infinity,
                child: RawMaterialButton(
                  fillColor: Color.fromARGB(202, 3, 152, 85),
                  elevation: 0.0,
                  padding: const EdgeInsets.symmetric(vertical: 20.0),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12.0),
                  ),
                  onPressed: login,
                  child: Text(
                    "Login",
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
