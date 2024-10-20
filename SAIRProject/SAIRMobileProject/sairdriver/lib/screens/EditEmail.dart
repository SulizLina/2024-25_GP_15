import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/messages/success.dart';
import 'package:sairdriver/messages/confirm.dart';

class Editemail extends StatefulWidget {
  final String driverId;
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
Future<void> _waitForEmailVerification(User? user, {Duration timeout = const Duration(minutes: 2)}) async {
  final stopwatch = Stopwatch()..start();

  // Reload the user's info
  await user?.reload();
  user = FirebaseAuth.instance.currentUser;

  // Check every 5 seconds for email verification, with a maximum wait time
  while (!(user?.emailVerified ?? false)) {
    await Future.delayed(const Duration(seconds: 5));
    await user?.reload();
    user = FirebaseAuth.instance.currentUser;

    // Stop waiting after the specified timeout
    if (stopwatch.elapsed > timeout) {
      break;
    }
  }

  stopwatch.stop();

  if (user?.emailVerified ?? false) {
    print("Email verified for user: ${user?.email}");
  } else {
    print("Email verification timeout. Email not verified.");
  }
}

void _changeEmail() async {
  final newEmail = _emailController.text;

  if (!_formKey.currentState!.validate()) {
    return;
  }

  setState(() {
    _isUpdating = true;
    _emailErrorText = null;
  });

  try {
    User? user = FirebaseAuth.instance.currentUser;

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

    if (!mounted) return; // Check if the widget is still mounted

    ConfirmationDialog.show(
      context,
      "Confirm Email Change",
      "Are you sure you want to change your email?",
      () async {
        try {
          await user?.verifyBeforeUpdateEmail(newEmail);

          if (mounted) {
            SuccessMessageDialog.show(
              context,
              "A confirmation message has been sent to your new email. Please verify your email.",
            );
          }

          // Wait for the email to be verified (up to 2 minutes)
          await _waitForEmailVerification(user);

          // Double-check that the email is verified
          if (user?.emailVerified ?? false) {
            // Only update the email in Firestore if verification was successful
            await _updateEmailInUsersTable(user, newEmail);
          } else {
            setState(() {
              _emailErrorText = "Email verification failed. Please verify your email.";
            });
          }
        } catch (e) {
          if (mounted) {
            setState(() {
              _emailErrorText = "Something went wrong: ${e.toString()}";
            });
          }
        } finally {
          if (mounted) {
            setState(() {
              _isUpdating = false;
            });
          }
        }
      },
      onCancel: () {
        if (mounted) {
          setState(() {
            _isUpdating = false;
          });
        }
      },
    );
  } catch (e) {
    if (mounted) {
      setState(() {
        _emailErrorText = "Something went wrong. Please try again later.";
        _isUpdating = false;
      });
    }
  }
}

Future<void> _updateEmailInUsersTable(User? user, String newEmail) async {
  try {
    // Query Firestore to find the correct document ID using the UID field
    QuerySnapshot querySnapshot = await FirebaseFirestore.instance
        .collection('Driver')
        .where('UID', isEqualTo: user?.uid)
        .get();

    if (querySnapshot.docs.isEmpty) {
      setState(() {
        _emailErrorText = "Firestore error: Document with the specified UID was not found.";
      });
      print("Document with UID: ${user?.uid} not found in Firestore.");
      return;
    }

    // Get the document ID from the query result
    String documentId = querySnapshot.docs.first.id;

    // Update Firestore with the new email
    await FirebaseFirestore.instance
        .collection('Driver')
        .doc(documentId)
        .update({'Email': newEmail});

  

    // Log the successful update
    print("Email updated successfully in Firestore for user with UID: ${user?.uid}");
  } catch (e) {
    // Handle specific Firestore exceptions using FirebaseException
    if (e is FirebaseException) {
      setState(() {
        _emailErrorText = "Firestore error: ${e.message}";
      });
    } else {
      // General exception handling
      setState(() {
        _emailErrorText = "Something went wrong. Please try again later.";
      });
    }

    // Debugging log to see the error
    print("Error updating email in Firestore: ${e.toString()}");
  } finally {
    if (mounted) {
      setState(() {
        _isUpdating = false;
      });
    }
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
                        color: const Color.fromARGB(201, 3, 152, 85),
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: const Color.fromARGB(201, 3, 152, 85),
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
