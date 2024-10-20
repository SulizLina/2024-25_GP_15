import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/screens/Forgotpass.dart';
import 'package:sairdriver/messages/phone_validator.dart';
import 'package:sairdriver/screens/bottom_nav_bar.dart';
import 'package:sairdriver/screens/changepassword.dart';
import 'package:sairdriver/screens/emailforgotpass.dart';
import 'package:sairdriver/screens/home.dart';
import 'login_otp.dart';

class LoginEmail extends StatefulWidget {
  const LoginEmail({super.key});

  @override
  State<LoginEmail> createState() => _LoginEmailState();
}

class _LoginEmailState extends State<LoginEmail> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String _emailErrorText = "";
  String _passwordErrorText = "";
  final db = FirebaseFirestore.instance;
  final _formKey = GlobalKey<FormState>();
  bool isError = false;
  User? get currentUser => FirebaseAuth.instance.currentUser;

  String _loginErrorText = "";
  bool _isPhoneError = false;
  bool _isPasswordError = false;
  bool _isPasswordVisible = false;
  String? errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _validateEmail(String value) {
    if (value.isEmpty) {
      setState(() {
        _emailErrorText = "Your email is required";
        _isPhoneError = true;
      });
    } else if (!RegExp(r'^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$').hasMatch(value)) {
      setState(() {
        _emailErrorText = "Invalid email";
        _isPhoneError = true;
      });
    } else {
      setState(() {
        _emailErrorText = "";
        _isPhoneError = false;
      });
    }
  }

  void _validatePassword(String value) {
    if (value.isEmpty) {
      setState(() {
        _passwordErrorText = "Your password is required";
        _isPasswordError = true;
      });
    } else {
      setState(() {
        _passwordErrorText = "";
        _isPasswordError = false;
      });
    }
  }

  Future<void> signIn() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    _validateEmail(email);
    _validatePassword(password);

    if (_emailErrorText.isEmpty && _passwordErrorText.isEmpty) {
      try {
        await FirebaseAuth.instance.signInWithEmailAndPassword(
          email: email,
          password: password,
        );

        final driverDoc = await db
            .collection('Driver')
            .where('Email', isEqualTo: currentUser?.email)
            .limit(1)
            .get();

        final String driverId = driverDoc.docs.first.id;
        final bool isDefaultPassword = driverDoc.docs.first.data()['isDefaultPassword'] ?? false;

        if (!isDefaultPassword) {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => BottomNavBar(driverId: driverId)),
          );
        } else {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => Changepassword(driverId: driverId)),
          );
        }
      } catch (e) {
        if (e is FirebaseAuthException) {
          setState(() {
            _loginErrorText = e.code == 'invalid-credential' ? "Invalid email or password" : "An error occurred: ${e.message}";
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFF),
      body: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                height: MediaQuery.of(context).size.height * 0.6,
                decoration: const BoxDecoration(
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
                      height: 100,
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
              const SizedBox(height: 50),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 30.0),
                child: Column(
                  children: [
                    TextFormField(
                      controller: _emailController,
                      decoration: InputDecoration(
                        labelText: 'Enter Your Email',
                        labelStyle: GoogleFonts.poppins(color: Colors.black, fontSize: 13),
                        prefixIcon: Icon(
                          Icons.email,
                          color: _isPhoneError ? Colors.red : const Color.fromARGB(201, 3, 152, 85),
                        ),
                        contentPadding: const EdgeInsets.symmetric(vertical: 10),
                        enabledBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: _isPhoneError ? Colors.red : const Color.fromARGB(201, 3, 152, 85),
                            width: 1.5,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: _isPhoneError ? Colors.red : const Color.fromARGB(201, 3, 152, 85),
                            width: 2.0,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      keyboardType: TextInputType.emailAddress,
                      style: GoogleFonts.poppins(color: Colors.black, fontSize: 13),
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: !_isPasswordVisible,
                      decoration: InputDecoration(
                        labelText: 'Enter Your Password',
                        labelStyle: GoogleFonts.poppins(color: Colors.black, fontSize: 13),
                        prefixIcon: Icon(
                          Icons.lock,
                          color: _isPasswordError ? Colors.red : const Color.fromARGB(201, 3, 152, 85),
                        ),
                        contentPadding: const EdgeInsets.symmetric(vertical: 10),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _isPasswordVisible ? Icons.visibility : Icons.visibility_off,
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
                            color: _isPasswordError ? Colors.red : const Color.fromARGB(201, 3, 152, 85),
                            width: 1.5,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: _isPasswordError ? Colors.red : const Color.fromARGB(201, 3, 152, 85),
                            width: 2.0,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      style: GoogleFonts.poppins(color: Colors.black, fontSize: 14),
                    ),
                    const SizedBox(height: 10),
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const Emailforgotpass()),
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
                    SizedBox(
                      width: double.infinity,
                      child: RawMaterialButton(
                        fillColor: const Color.fromARGB(202, 3, 152, 85),
                        elevation: 0.0,
                        padding: const EdgeInsets.symmetric(vertical: 15.0),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        onPressed: signIn,
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
            ],
          ),
        ),
      ),
    );
  }
}
