import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart'; // For Firebase Firestore
import 'package:firebase_auth/firebase_auth.dart'; // For Firebase Authentication
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/messages/success.dart'; // Make sure this import exists
import 'package:sairdriver/messages/confirm.dart'; // Make sure this import exists

class Editemail extends StatefulWidget {
  final String driverId; // DriverID passed from the previous page
  const Editemail({required this.driverId});

  @override
  State<Editemail> createState() => _EditemailState();
}

class _EditemailState extends State<Editemail> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _confirmEmailController = TextEditingController();
  final TextEditingController _newEmailController = TextEditingController();
  String? errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _confirmEmailController.dispose();
    _newEmailController.dispose();
    super.dispose();
  }

  bool isValidEmail(String email) {
    final emailRegex = RegExp(r'^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$');
    return emailRegex.hasMatch(email);
  }

  Future<void> _changeEmail() async {
    final currentEmail = _emailController.text.trim();
    final newEmail = _newEmailController.text.trim();
    final confirmEmail = _confirmEmailController.text.trim();

    if (_formKey.currentState!.validate()) {
      try {
        User? user = FirebaseAuth.instance.currentUser;

        // Check if the new email is already in use
        QuerySnapshot querySnapshot = await FirebaseFirestore.instance
            .collection('Driver')
            .where('Email', isEqualTo: newEmail)
            .get();

        if (querySnapshot.docs.isNotEmpty) {
          setState(() {
            errorMessage = "The new email is already taken.";
          });
          return;
        }

        // Confirm email change with a dialog
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
                "A confirmation message has been sent to your new email. Please check your email for confirmation.",
              );

              // Wait for the user to verify the email
              await _waitForEmailVerification(user);

              // Update email in the users table
              await _updateEmailInUsersTable(user, newEmail);
            } catch (e) {
              setState(() {
                errorMessage = "Something went wrong while updating the email.";
              });
            }
          },
        );
      } catch (e) {
        setState(() {
          errorMessage = "Something went wrong while updating the email.";
        });
      }
    }
  }

  Future<void> _waitForEmailVerification(User? user) async {
    await user?.reload();
    user = FirebaseAuth.instance.currentUser;

    while (!(user?.emailVerified ?? false)) {
      await Future.delayed(const Duration(seconds: 2));
      await user?.reload();
      user = FirebaseAuth.instance.currentUser;
    }
  }

  Future<void> _updateEmailInUsersTable(User? user, String newEmail) async {
    try {
      await FirebaseFirestore.instance
          .collection('Driver')
          .doc(widget.driverId)
          .update({'Email': newEmail});
    } catch (e) {
      setState(() {
        errorMessage = "Failed to update the email in the database.";
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
                  'Write Your Current and New Email Below.',
                  style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    labelText: 'Enter your current email',
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: const Color.fromARGB(201, 3, 152, 85),
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "Your current email is required.";
                    } else if (!isValidEmail(value)) {
                      return "Invalid current email.";
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: _newEmailController,
                  decoration: InputDecoration(
                    labelText: 'Enter your new email',
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: const Color.fromARGB(201, 3, 152, 85),
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "Your new email is required.";
                    } else if (!isValidEmail(value)) {
                      return "Invalid new email.";
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: _confirmEmailController,
                  decoration: InputDecoration(
                    labelText: 'Confirm your new email',
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: const Color.fromARGB(201, 3, 152, 85),
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "Please confirm your new email.";
                    } else if (value != _newEmailController.text) {
                      return "Emails do not match.";
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 30),
                if (errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Text(
                      errorMessage!,
                      style: const TextStyle(
                        color: Colors.red,
                        fontSize: 12,
                      ),
                    ),
                  ),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _changeEmail,
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
