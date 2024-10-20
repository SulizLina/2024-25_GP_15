import 'package:flutter/material.dart';
import 'dart:developer';
import 'package:sairdriver/screens/login.dart';
import 'package:sairdriver/screens/login_email.dart';
import 'otppage.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_fonts/google_fonts.dart';

class Emailforgotpass extends StatefulWidget {
  const Emailforgotpass({super.key});

  @override
  State<Emailforgotpass> createState() => _EmailforgotpassState();
}

class _EmailforgotpassState extends State<Emailforgotpass> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  String _emailErrorText = "";

  void _validateEmail(String value) {
    if (value.isEmpty) {
      setState(() {
        _emailErrorText = "Your email is required";
      });
    } else if (!_isEmailValid(value)) {
      setState(() {
        _emailErrorText = "Invalid email";
      });
    } else {
      setState(() {
        _emailErrorText = "";
      });
    }
  }

  bool _isEmailValid(String email) {
    final emailRegex = RegExp(
      r'^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$',
    );
    return emailRegex.hasMatch(email);
  }

  void _sendResetPasswordEmail() async {
    final email = _emailController.text;

    if (email.isEmpty) {
      setState(() {
        _emailErrorText = "Your email is required";
      });
    }

    if (_emailErrorText.isEmpty) {
      try {
        // Check if the email exists in Firestore
        QuerySnapshot<Map<String, dynamic>> query = await FirebaseFirestore
            .instance
            .collection('Driver')
            .where('Email', isEqualTo: email)
            .get();

        if (query.docs.isEmpty) {
          setState(() {
            _emailErrorText = "Invalid email";
          });
          return;
        }

        await FirebaseAuth.instance.sendPasswordResetEmail(email: email);

        // Display success message
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: Text('Success'),
            content:
                Text('the reset password link have been sent to your email'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(context); // Close dialog
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const LoginEmail()),
                  );
                },
                child: Text('OK'),
              ),
            ],
          ),
        );

        setState(() {
          _emailErrorText = "";
        });
      } catch (e) {
        print(e);
      }
    }
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFFAFAFF),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: Color.fromARGB(255, 3, 152, 85),
        toolbarHeight: 100,
        iconTheme: const IconThemeData(color: Color(0xFFFAFAFF)),
        title: Row(
          children: [
            IconButton(
              icon: Icon(Icons.arrow_back),
              onPressed: () {
                Navigator.pop(context); // Navigate back
              },
            ),
            SizedBox(width: 10), // Space between arrow and text
            Expanded(
              // Allows the text to take up remaining space
              child: Text(
                "Reset Your Password",
                style: GoogleFonts.poppins(
                  fontSize: 23,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFFAFAFF),
                ),
                textAlign: TextAlign.start,
              ),
            ),
          ],
        ),
      ),
      resizeToAvoidBottomInset: true,
      body: Container(
        ////////////////////
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16),
        decoration: const BoxDecoration(
          color: Color(0xFFFAFAFF),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30), // Rounded top-left corner
            topRight: Radius.circular(30), // Rounded top-right corner
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 30),
                Text(
                  "Don't worry we got you!",
                  style: GoogleFonts.poppins(
                    fontSize: 21,
                    fontWeight: FontWeight.bold,
                    color: const Color.fromARGB(201, 3, 152, 85),
                  ),
                ),
                const SizedBox(
                    height: 8), // Space between heading and input field
                Text(
                  'Enter email to receive a reset email',
                  style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey),
                ),
                const SizedBox(height: 20),

                // Phone Number Input Field
                TextFormField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    labelText: 'Enter your email',
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: _emailErrorText.isEmpty
                            ? const Color.fromARGB(
                                201, 3, 152, 85) // Green if valid
                            : Colors.red, // Red for error
                        width: 1.5,
                      ),
                      borderRadius:
                          BorderRadius.circular(10), // Rounded corners
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: _emailErrorText.isEmpty
                            ? const Color.fromARGB(
                                201, 3, 152, 85) // Green on focus
                            : Colors.red, // Red for error on focus
                        width: 2.0,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    errorText:
                        _emailErrorText.isNotEmpty ? _emailErrorText : null,
                    errorBorder: OutlineInputBorder(
                      borderSide:
                          const BorderSide(color: Colors.red, width: 1.5),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    focusedErrorBorder: OutlineInputBorder(
                      borderSide:
                          const BorderSide(color: Colors.red, width: 2.0),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),

                const SizedBox(height: 30),

                // Send OTP Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed:
                        _sendResetPasswordEmail, // Firestore check only on button press
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color.fromARGB(201, 3, 152, 85),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15.0),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(
                      'Send Email',
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        color: Colors.white, // White text
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
