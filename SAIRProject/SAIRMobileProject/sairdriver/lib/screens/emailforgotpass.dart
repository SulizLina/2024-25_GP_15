import 'package:flutter/material.dart';
import 'dart:developer';
import 'package:sairdriver/screens/login_email.dart';
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
    final email = _emailController.text.trim();

    // Validate email before sending
    _validateEmail(email);

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

        // Send password reset email
        await FirebaseAuth.instance.sendPasswordResetEmail(email: email);

        // Display success message
        showDialog(
          context: context,
          builder: (context) {
            return Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Container(
                padding: EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      "Done Successfully!",
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 20),
                    Text(
                      "The reset password link has been sent to your email!",
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context); 
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(builder: (context) => const LoginEmail()),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color.fromARGB(201, 3, 152, 85),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        "Back to Login",
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );

        // Clear the error text after successful email sending
        setState(() {
          _emailErrorText = "";
        });

      } catch (e) {
        setState(() {
          _emailErrorText = "Failed to send reset email. Please try again.";
        });
        log("Error sending password reset email: $e");
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color.fromARGB(255, 3, 152, 85),
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
            SizedBox(width: 10),
            Expanded(
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
   
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16),
        decoration: const BoxDecoration(
          color: Color(0xFFFAFAFF),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Don't worry, we got you!",
                  style: GoogleFonts.poppins(
                    fontSize: 21,
                    fontWeight: FontWeight.bold,
                    color: const Color.fromARGB(201, 3, 152, 85),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Enter your email to receive a reset email',
                  style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    labelText: 'Enter your email',
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: _emailErrorText.isEmpty
                            ? const Color.fromARGB(201, 3, 152, 85)
                            : Colors.red,
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: _emailErrorText.isEmpty
                            ? const Color.fromARGB(201, 3, 152, 85)
                            : Colors.red,
                        width: 2.0,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    errorText:
                        _emailErrorText.isNotEmpty ? _emailErrorText : null,
                    errorBorder: OutlineInputBorder(
                      borderSide: const BorderSide(color: Colors.red, width: 1.5),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    focusedErrorBorder: OutlineInputBorder(
                      borderSide: const BorderSide(color: Colors.red, width: 2.0),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  onChanged: _validateEmail,
                ),
                const SizedBox(height: 30),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _sendResetPasswordEmail,
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
                        color: Colors.white,
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
