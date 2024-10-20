import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/messages/success.dart';
import 'package:sairdriver/messages/confirm.dart';

class Editemail extends StatefulWidget {
  final String driverId; // DriverID passed from the previous page
  const Editemail({required this.driverId});

  @override
  State<Editemail> createState() => _EditemailState();
}

class _EditemailState extends State<Editemail> {
  final _emailController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String? _emailErrorText;
  bool _isUpdating = false;

  bool isValidEmail(String email) {
    final emailRegex = RegExp(r'^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$');
    return emailRegex.hasMatch(email);
  }

  Future<void> _changeEmail() async {
    final newEmail = _emailController.text.trim();

    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isUpdating = true;
      _emailErrorText = null; // Clear any previous error
    });

    try {
      User? user = FirebaseAuth.instance.currentUser;

      // Check if the new email is already in use
      QuerySnapshot querySnapshot = await FirebaseFirestore.instance
          .collection('Driver')
          .where('Email', isEqualTo: newEmail)
          .get();

      if (querySnapshot.docs.isNotEmpty) {
        setState(() {
          _emailErrorText = "This email is already taken.";
          _isUpdating = false;
        });
        return;
      }

      // Confirm email change
      ConfirmationDialog.show(
        context,
        "Confirm Email Change",
        "Are you sure you want to change your email?",
        () async {
          try {
            // Send email verification to the new email address
            await user?.verifyBeforeUpdateEmail(newEmail);

            // Show success message dialog
            SuccessMessageDialog.show(
              context,
              "A confirmation message has been sent to your new email. Please check your email for verification.",
            );

            // Wait for email verification
            await _waitForEmailVerification(user);

            // Update email in Firestore
            await _updateEmailInFirestore(newEmail);
          } catch (e) {
            setState(() {
              _emailErrorText = "Something went wrong: ${e.toString()}";
            });
          } finally {
            setState(() {
              _isUpdating = false;
            });
          }
        },
        onCancel: () {
          // Reset loading state if the user cancels
          setState(() {
            _isUpdating = false;
          });
        },
      );
    } catch (e) {
      setState(() {
        _emailErrorText = "Something went wrong. Please try again later.";
        _isUpdating = false;
      });
    }
  }

  Future<void> _waitForEmailVerification(User? user) async {
    await user?.reload();
    user = FirebaseAuth.instance.currentUser;

    while (!(user?.emailVerified ?? false)) {
      await Future.delayed(const Duration(seconds: 5));
      await user?.reload();
      user = FirebaseAuth.instance.currentUser;
    }
  }

  Future<void> _updateEmailInFirestore(String newEmail) async {
    try {
      // Use widget.driverId for the document reference
      DocumentReference docRef =
          FirebaseFirestore.instance.collection('Driver').doc(widget.driverId);

      // Check if the document exists
      DocumentSnapshot docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        setState(() {
          _emailErrorText = "Driver record not found in the database.";
        });
        return;
      }

      // Update the email in Firestore
      await docRef.update({'Email': newEmail});
    } catch (e) {
      setState(() {
        _emailErrorText =
            "Failed to update email in the database. Error: ${e.toString()}";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 3, 152, 85),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: const Color.fromARGB(255, 3, 152, 85),
        iconTheme: const IconThemeData(color: Color(0xFFFAFAFF)),
        toolbarHeight: 100,
        title: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () {
                Navigator.pop(context);
              },
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                "Update Email",
                style: GoogleFonts.poppins(
                  fontSize: 23,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFFFAFAFF),
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
          color: Color(0xFFF3F3F3),
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
                  'Update Your Email',
                  style: GoogleFonts.poppins(
                    fontSize: 21,
                    fontWeight: FontWeight.bold,
                    color: const Color.fromARGB(201, 3, 152, 85),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Write Your New Email Below.',
                  style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    labelText: 'Enter your new email',
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: const Color.fromARGB(
                            201, 3, 152, 85), // Green color when enabled
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: const Color.fromARGB(
                            201, 3, 152, 85), // Green color when focused
                        width: 2.0,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    errorBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: Colors.red, // Red border when there is an error
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    focusedErrorBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: Colors
                            .red, // Red border when focused and there is an error
                        width: 2.0,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    errorText: _emailErrorText,
                  ),
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "Your email is required.";
                    } else if (!isValidEmail(value)) {
                      return "Invalid email format.";
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 30),
                if (_isUpdating)
                  const Center(child: CircularProgressIndicator()),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isUpdating ? null : _changeEmail,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color.fromARGB(201, 3, 152, 85),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15.0),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(
                      'Update',
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
