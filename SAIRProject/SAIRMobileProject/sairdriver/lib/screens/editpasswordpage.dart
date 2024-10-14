import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart'; // For Firebase Authentication
import 'package:crypto/crypto.dart';
import 'dart:convert';

import 'package:sairdriver/screens/profilepage.dart'; // for the utf8.encode method

class Editpasswordpage extends StatefulWidget {
  @override
  _EditpasswordpageState createState() => _EditpasswordpageState();
}

class _EditpasswordpageState extends State<Editpasswordpage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();
  bool _isPasswordVisible = false; // For toggling password visibility
  bool _isConfirmPasswordVisible = false;

  // Function to show the confirmation dialog before updating the password
  void _showConfirmationDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(
            'Confirm Password Change',
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.bold,
              color: Color.fromARGB(201, 3, 152, 85),
            ),
          ),
          content: Text(
            'Are you sure you want to change your password?',
            style: GoogleFonts.poppins(fontSize: 16),
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(); // Close the dialog
              },
              child: Text(
                'Cancel',
                style: GoogleFonts.poppins(color: Colors.red),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop(); // Close the dialog
                _changePassword(); // Proceed with password update
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Color.fromARGB(201, 3, 152, 85),
              ),
              child: Text(
                'Confirm',
                style: GoogleFonts.poppins(color: Colors.white),
              ),
            ),
          ],
        );
      },
    );
  }

  // Function to validate password strength
  bool _isPasswordValid(String password) {
    final RegExp passwordPattern = RegExp(
      r'^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#\$%^&*_\-])[\w!@#\$%^&*_\-]{8,}$',
    );
    return passwordPattern.hasMatch(password);
  }

  // Function to handle password update
  Future<void> _changePassword() async {
    if (_formKey.currentState!.validate()) {
      try {
        // Get the current user
        //User? currentUser = FirebaseAuth.instance.currentUser;

        //if (currentUser != null) {
        // Update the password in Firebase Authentication
        // await currentUser.updatePassword(_passwordController.text);
/*final bytes = utf8.encode(_passwordController.text); // data being hashed
final digest = sha256.convert(bytes);*/
        // Update password in Firestore (if needed)
        await FirebaseFirestore.instance
            .collection('Driver')
            .doc("LMUhIgvgZa3H07D0IQvs") // Use currentUser.uid
            .update({
          'Password': _passwordController.text,
        });

        // Show success dialog once password is updated
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: Text(
                'Success',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.bold,
                  color: Color.fromARGB(201, 3, 152, 85),
                ),
              ),
              content: Text(
                'Your password has been updated successfully!',
                style: GoogleFonts.poppins(fontSize: 16),
              ),
              actions: <Widget>[
                // Cancel Button
                TextButton(
                  onPressed: () {
                    Navigator.of(context)
                        .pop(); // Close the dialog, stay on the same page
                  },
                  child: Text(
                    'Cancel',
                    style: GoogleFonts.poppins(color: Colors.red),
                  ),
                ),
                // OK Button
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop(); // Close the dialog
                    Navigator.pushNamed(
                        context, 'profilepage'); // Navigate to the profile page
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color.fromARGB(201, 3, 152, 85),
                  ),
                  child: Text(
                    'OK',
                    style: GoogleFonts.poppins(color: Colors.white),
                  ),
                ),
              ],
            );
          },
        );

        //} else {
        // Handle the case where the user is not logged in
        //print('User is not logged in.');
        //}
      } catch (e) {
        // Handle errors during password update
        print('Failed to update password: $e');
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: Text(
                'Error',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                ),
              ),
              content: Text(
                'Failed to update password. Please try again.',
                style: GoogleFonts.poppins(fontSize: 16),
              ),
              actions: <Widget>[
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop(); // Close the dialog
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                  ),
                  child: Text(
                    'OK',
                    style: GoogleFonts.poppins(color: Colors.white),
                  ),
                ),
              ],
            );
          },
        );
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
        toolbarHeight: 80, // Adjust the toolbar height
        iconTheme: const IconThemeData(color: Colors.white),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => Profilepage()),
            );
          },
        ),
        title: Text(
            "Update Your Password",
            style: TextStyle(
              fontSize: 24.0,
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
        
      ),
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16.0),
        decoration: const BoxDecoration(
          color: Colors.white, // White background for the content
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
                // Bold Green Text (Heading)
                Text(
                  'Update Your Password',
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color.fromARGB(201, 3, 152, 85),
                  ),
                ),
                SizedBox(height: 8), // Space between heading and input field

                // Subtitle text
                Text(
                  'Write Your New Password Below.',
                  style: GoogleFonts.poppins(fontSize: 16, color: Colors.grey),
                ),
                SizedBox(height: 20),

                // New Password Input Field with Green Border and Eye Icon
                TextFormField(
                  controller: _passwordController,
                  obscureText:
                      !_isPasswordVisible, // Toggle for hiding/revealing password
                  decoration: InputDecoration(
                    labelText: 'Enter Your New Password',
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
                        color: Color.fromARGB(
                            201, 3, 152, 85), // Green border color
                        width: 1.5,
                      ),
                      borderRadius:
                          BorderRadius.circular(10), // Rounded corners
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: Color.fromARGB(
                            201, 3, 152, 85), // Green border when focused
                        width: 2.0,
                      ),
                      borderRadius:
                          BorderRadius.circular(10), // Rounded corners
                    ),
                    errorBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: Colors.red, // Red border color for error state
                        width: 1.5,
                      ),
                      borderRadius:
                          BorderRadius.circular(10), // Rounded corners
                    ),
                    focusedErrorBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: Colors
                            .red, // Red border color when focused and error
                        width: 2.0,
                      ),
                      borderRadius:
                          BorderRadius.circular(10), // Rounded corners
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your password';
                    } else if (!_isPasswordValid(value)) {
                      return 'Password must contain 8+ characters, including uppercase, \n lowercase, number, and special character.';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 16),

                // Confirm Password Input Field with Green Border and Eye Icon
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText:
                      !_isConfirmPasswordVisible, // Toggle for hiding/revealing password
                  decoration: InputDecoration(
                    labelText: 'Re-enter your new password',
                    suffixIcon: IconButton(
                      icon: Icon(
                        _isConfirmPasswordVisible
                            ? Icons.visibility
                            : Icons.visibility_off,
                        color: Colors.grey,
                      ),
                      onPressed: () {
                        setState(() {
                          _isConfirmPasswordVisible =
                              !_isConfirmPasswordVisible;
                        });
                      },
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: Color.fromARGB(
                            201, 3, 152, 85), // Green border color
                        width: 1.5,
                      ),
                      borderRadius:
                          BorderRadius.circular(10), // Rounded corners
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: Color.fromARGB(
                            201, 3, 152, 85), // Green border when focused
                        width: 2.0,
                      ),
                      borderRadius:
                          BorderRadius.circular(10), // Rounded corners
                    ),
                    errorBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: Colors.red, // Red border color for error state
                        width: 1.5,
                      ),
                      borderRadius:
                          BorderRadius.circular(10), // Rounded corners
                    ),
                    focusedErrorBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: Colors
                            .red, // Red border color when focused and error
                        width: 2.0,
                      ),
                      borderRadius:
                          BorderRadius.circular(10), // Rounded corners
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please confirm your password';
                    } else if (value != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 32),

                // Update Button with Green Background
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      // Show confirmation dialog before proceeding with password change
                      if (_formKey.currentState!.validate()) {
                        _showConfirmationDialog();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          Color.fromARGB(201, 3, 152, 85), // Green background
                      shape: RoundedRectangleBorder(
                        borderRadius:
                            BorderRadius.circular(15.0), // Rounded corners
                      ),
                      padding: EdgeInsets.symmetric(
                          vertical: 16), // Add vertical padding
                    ),
                    child: Text(
                      'Update',
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
