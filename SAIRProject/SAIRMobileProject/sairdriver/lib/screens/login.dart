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
  bool _isPhoneError = false;
  bool _isPasswordError = false;

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

  // Validation method for phone and password fields
  void validateFields() {
    setState(() {
      _isPhoneError = _phoneController.text.isEmpty;
      _isPasswordError = _passwordController.text.isEmpty;
      if (!_isPhoneValid(_phoneController.text)) {
        errorMessage =
            'Phone number must start with +966 and be followed\nby 9 digits.';
      }
      if (_isPhoneError || _isPasswordError) {
        errorMessage = 'Please fill all required fields.';
      } else {
        errorMessage = null;
      }
    });
  }

  // Validate phone number format
  bool _isPhoneValid(String phone) {
    final phoneRegex = RegExp(r'^\+966\d{9}$'); // Saudi phone number validation
    return phoneRegex.hasMatch(phone);
  }

  // Login method that checks for valid credentials and sends OTP
  Future<void> login() async {
    // Validate fields before proceeding
    validateFields();
    if (errorMessage != null) {
      return; // Stop login if validation fails
    }

    try {
      final db = FirebaseFirestore.instance;
      // Retrieve the phone number from Firestore
      final driverDoc = await db
          .collection('Driver')
          .where('PhoneNumber', isEqualTo: _phoneController.text)
          .limit(1)
          .get();

      if (driverDoc.docs.isEmpty) {
        setState(() {
          errorMessage = "Incorrect phone number or password";
          _isPhoneError = true;
          _isPasswordError = true;
        });
        return;
      }

      // Retrieve the correct password from Firestore
      final storedPassword = driverDoc.docs.first.data()['Password'];

      if (storedPassword != _passwordController.text) {
        setState(() {
          errorMessage = "Incorrect phone number or password.";
          _isPhoneError = true;
          _isPasswordError = true;
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
    return Scaffold(
      backgroundColor: Color(0xFFF3F3F3),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Green Container with Welcome Message
            Container(
              height: 600,
              decoration: BoxDecoration(
                color: Color.fromARGB(202, 3, 152, 85),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(60),
                  bottomRight: Radius.circular(60),
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    'assets/icons/SAIRLogoWhiteMarker.png',
                    height: 80, // Adjust the size of the logo
                  ),
                  const SizedBox(height: 15),
                  Text(
                    "Welcome to SAIR,",
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 22, // Adjusted font size
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  Text(
                    "Glad to see you again!",
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 22, // Adjusted font size
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            //const SizedBox(height: 20), ////////////////////////////////////
            
            // Black Box for Form Fields and Login Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20), // Padding around the black box container
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white, // Black background color
                  borderRadius: BorderRadius.circular(25),
                ),
                padding: EdgeInsets.symmetric(vertical: 30, horizontal: 20), // Padding inside the black box container
                child: Column(
                  children: [
                    // Phone Input
                    TextFormField(
                      controller: _phoneController,
                      decoration: InputDecoration(
                        labelText: 'Enter Your Phone Number',
                        labelStyle: TextStyle(color: Colors.black),
                        prefixIcon: Icon(
                          Icons.phone,
                          color: _isPhoneError
                              ? Colors.red
                              : Color.fromARGB(201, 3, 152, 85),
                        ),
                        contentPadding: EdgeInsets.symmetric(vertical: 15), // Padding inside the phone input field
                        enabledBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: _isPhoneError
                                ? Colors.red
                                : Color.fromARGB(201, 3, 152, 85), // Adjusted border color
                            width: 1.5,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: _isPhoneError
                                ? Colors.red
                                : Color.fromARGB(201, 3, 152, 85),
                            width: 2.0,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      keyboardType: TextInputType.phone,
                      style: TextStyle(color: Colors.black), // White text
                    ),
                    const SizedBox(height: 20),
                    // Password Input
                    TextFormField(
                      controller: _passwordController,
                      obscureText: !_isPasswordVisible,
                      decoration: InputDecoration(
                        labelText: 'Enter Your Password',
                        labelStyle: TextStyle(color: Colors.black),
                        prefixIcon: Icon(
                          Icons.lock,
                          color: _isPasswordError
                              ? Colors.red
                              : Color.fromARGB(201, 3, 152, 85),
                        ),
                        contentPadding: EdgeInsets.symmetric(vertical: 15), // Padding inside the password input field
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
                            color: _isPasswordError
                                ? Colors.red
                                : Color.fromARGB(201, 3, 152, 85), // Adjusted border color
                            width: 1.5,
                          ),
                          borderRadius: BorderRadius.circular(25),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: _isPasswordError
                                ? Colors.red
                                : Color.fromARGB(201, 3, 152, 85),
                            width: 2.0,
                          ),
                          borderRadius: BorderRadius.circular(25),
                        ),
                      ),
                      style: TextStyle(color: Colors.black), // White text
                    ),
                    const SizedBox(height: 10),
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (context) => const Forgotpass()),
                        );
                      },
                      child: Text(
                        "Forgot Password?",
                        style: GoogleFonts.poppins(
                          color: Color.fromARGB(202, 3, 152, 85),
                          fontSize: 14,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Login Button
                    Container(
                      width: double.infinity,
                      child: RawMaterialButton(
                        fillColor: Color.fromARGB(202, 3, 152, 85),
                        elevation: 0.0,
                        padding: const EdgeInsets.symmetric(vertical: 18.0), // Padding inside the login button
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25.0),
                        ),
                        onPressed: () {
                          login();
                        },
                        child: Text(
                          "Login",
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 18.0,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    if (errorMessage != null) ...[
                      const SizedBox(height: 20),
                      Text(
                        errorMessage!,
                        style: TextStyle(
                          color: Colors.red,
                          fontSize: 14.0,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}