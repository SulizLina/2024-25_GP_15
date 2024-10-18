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
    _phoneController.text = "+966";
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
      backgroundColor: const Color(0xFFF3F3F3),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Green Container with Welcome Message
            Container(
              height: MediaQuery.of(context).size.height *
                  0.6, // Adjust height as needed
              decoration: BoxDecoration(
                color: Color.fromARGB(202, 3, 152, 85), // Green color
                borderRadius: BorderRadius.only(
                  bottomLeft:
                      Radius.circular(60), // Rounded corners for bottom left
                  bottomRight:
                      Radius.circular(60), // Rounded corners for bottom right
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    'assets/icons/SAIRLogoWhiteMarker.png',
                    height: 100, // Adjust the size of the logo
                  ),
                  const SizedBox(height: 15),
                  Text(
                    "Welcome to SAIR,",
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  Text(
                    "Glad to see you again!",
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),

            // Black Box for Form Fields and Login Button
            Align(
              alignment: Alignment.bottomCenter,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 30, vertical: 20),
                margin: const EdgeInsets.only(bottom: 50), // Adjust position
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20), // Rounded corners
                ),
                width: MediaQuery.of(context).size.width * 0.85, // Adjust width
                child: Column(
                  children: [
                    // Phone Input
                    TextFormField(
                      controller: _phoneController,
                      decoration: InputDecoration(
                        labelText: 'Enter Your Phone Number',
                        labelStyle: GoogleFonts.poppins(
                            color: Colors.black,
                            fontSize: 15), // Match font size and font
                        prefixIcon: Icon(
                          Icons.phone,
                          color: _isPhoneError
                              ? Colors.red
                              : const Color.fromARGB(201, 3, 152, 85),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                            vertical: 10), // Match the padding
                        enabledBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: _isPhoneError
                                ? Colors.red
                                : const Color.fromARGB(201, 3, 152, 85),
                            width: 1.5,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: _isPhoneError
                                ? Colors.red
                                : const Color.fromARGB(201, 3, 152, 85),
                            width: 2.0,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      keyboardType: TextInputType.phone,
                      style: GoogleFonts.poppins(
                          color: Colors.black,
                          fontSize: 15), // Match the font style
                    ),
                    const SizedBox(height: 20),
                    // Password Input
                    TextFormField(
                      controller: _passwordController,
                      obscureText: !_isPasswordVisible,
                      decoration: InputDecoration(
                        labelText: 'Enter Your Password',
                        labelStyle: GoogleFonts.poppins(
                          color: Colors.black,
                          fontSize: 15,
                        ),
                        prefixIcon: Icon(
                          Icons.lock,
                          color: _isPasswordError
                              ? Colors.red
                              : const Color.fromARGB(201, 3, 152, 85),
                        ),
                        contentPadding:
                            const EdgeInsets.symmetric(vertical: 10),
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
                                : const Color.fromARGB(201, 3, 152, 85),
                            width: 1.5,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: _isPasswordError
                                ? Colors.red
                                : const Color.fromARGB(201, 3, 152, 85),
                            width: 2.0,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      style: GoogleFonts.poppins(
                        color: Colors.black,
                        fontSize: 14,
                      ),
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
                          color: const Color.fromARGB(202, 3, 152, 85),
                          fontSize: 14,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Login Button
                    Container(
                      width: double.infinity,
                      child: RawMaterialButton(
                        fillColor: const Color.fromARGB(202, 3, 152, 85),
                        elevation: 0.0,
                        padding: const EdgeInsets.symmetric(
                            vertical:
                                15.0), // Match this value with the text fields' padding
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        onPressed: login,
                        child: Text(
                          "Login",
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    if (errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 15),
                        child: Text(
                          errorMessage!,
                          style: const TextStyle(
                            color: Colors.red,
                            fontSize: 16,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
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

// Clipper for custom curved green background
class BottomWaveClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    var path = Path();
    path.lineTo(0.0, size.height - 100); // Starting point of the curve

    var firstControlPoint = Offset(size.width / 2, size.height);
    var firstEndPoint = Offset(size.width, size.height - 100);

    path.quadraticBezierTo(firstControlPoint.dx, firstControlPoint.dy,
        firstEndPoint.dx, firstEndPoint.dy);

    path.lineTo(size.width, 0.0); // Closing the path
    path.close();

    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}
