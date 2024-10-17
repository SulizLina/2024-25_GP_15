import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:sairdriver/screens/bottom_nav_bar.dart';
import 'package:sairdriver/screens/home.dart'; // For Firebase Authentication

class Changepassword extends StatefulWidget {
  final String driverId; // DriverID passed from previous page
  const Changepassword({required this.driverId});

  @override
  State<Changepassword> createState() => _ChangepasswordState();
}

class _ChangepasswordState extends State<Changepassword> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();
  bool _isPasswordVisible = false; // For toggling password visibility
  bool _isConfirmPasswordVisible = false;

   // Password requirement flags
  bool hasMinLength = false;
  bool hasUpperLowerCase = false;
  bool hasNumber = false;
  bool hasSpecialChar = false;

  bool hasUserTyped = false; // Flag to check if user has started typing

  // Function to validate password dynamically
  void _validatePassword(String password) {
    setState(() {
      hasUserTyped = true;
      hasMinLength = password.length >= 8;
      hasUpperLowerCase = password.contains(RegExp(r'(?=.*[a-z])(?=.*[A-Z])'));
      hasNumber = password.contains(RegExp(r'[0-9]'));
      hasSpecialChar = password.contains(RegExp(r'[!@#\$%^&*_\-]'));
    });
  }

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

    // Function to handle password update
  Future<void> _changePassword() async {
    if (_formKey.currentState!.validate()) {
      try {
        User? currentUser = FirebaseAuth.instance.currentUser;

        if (currentUser != null) {
          await currentUser.updatePassword(_passwordController.text);

          await FirebaseFirestore.instance
              .collection('Driver')
              .doc(widget.driverId)
              .update({
            'Password': _passwordController.text,
            'isDefaultPassword': false,
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
      
                  // OK Button
                  ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).pop(); // Close the dialog
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) =>
                                BottomNavBar(driverId: widget.driverId)),
                      );
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
        } else {
          // Handle the case where the user is not logged in
          print('User is not logged in.');
        }
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
    appBar: AppBar(
      automaticallyImplyLeading: false,
      elevation: 0,
      backgroundColor: Color.fromARGB(255, 3, 152, 85), // Background color
      toolbarHeight: 100, // Adjusted toolbar height for the row layout
      iconTheme: const IconThemeData(color: Color(0xFFFAFAFF)), // Arrow color
      title: Row(
        children: [
          IconButton(
            icon: Icon(Icons.arrow_back),
            onPressed: () {
              Navigator.pop(context); // Navigate back
            },
          ),
          SizedBox(width: 10), // Space between arrow and text
          Expanded( // Allows the text to take up remaining space
            child: Text(
              "Reset Your Password", // Adjust the text as needed
              style: GoogleFonts.poppins(
                fontSize: 23, // Font size to match the image
                fontWeight: FontWeight.bold,
                color: Color(0xFFFAFAFF), // Color for the text
              ),
              textAlign: TextAlign.start, // Align text to the start
            ),
          ),
        ],
      ),
    ),
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16),
        decoration: const BoxDecoration(
          color: Color(0xFFFAFAFF), // White background for the content
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
                'Set Your Password',
                style: GoogleFonts.poppins(
                  fontSize: 21,
                  fontWeight: FontWeight.bold,
                  color: Color.fromARGB(201, 3, 152, 85),
                ),
              ),
              SizedBox(height: 8), // Space between heading and input field

              // Subtitle text
              Text(
                'Write Your New Password Below.',
                style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey),
              ),
              SizedBox(height: 14),

              // New Password Input Field with Green Border and Eye Icon
              TextFormField(
                controller: _passwordController,
                obscureText:
                    !_isPasswordVisible, // Toggle for hiding/revealing password
                onChanged: _validatePassword,
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
                      color:
                          Color.fromARGB(201, 3, 152, 85), // Green border color
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10), // Rounded corners
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color: Color.fromARGB(
                          201, 3, 152, 85), // Green border when focused
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10), // Rounded corners
                  ),
                  errorBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color: Colors.red, // Red border color for error state
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10), // Rounded corners
                  ),
                  focusedErrorBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color:
                          Colors.red, // Red border color when focused and error
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10), // Rounded corners
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your password';
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
                        _isConfirmPasswordVisible = !_isConfirmPasswordVisible;
                      });
                    },
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color:
                          Color.fromARGB(201, 3, 152, 85), // Green border color
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10), // Rounded corners
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color: Color.fromARGB(
                          201, 3, 152, 85), // Green border when focused
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10), // Rounded corners
                  ),
                  errorBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color: Colors.red, // Red border color for error state
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10), // Rounded corners
                  ),
                  focusedErrorBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color:
                          Colors.red, // Red border color when focused and error
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10), // Rounded corners
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
               if (_confirmPasswordController.text.isNotEmpty && _passwordController.text != _confirmPasswordController.text) 
            Container(
              margin: EdgeInsets.only(top: 8),
              padding: EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.red), // Red border for error
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                'Passwords do not match',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: Colors.red,
                ),
              ),
            ),
            
              SizedBox(height: 24),

              // Password requirements section inserted here
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Password must:',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      //fontWeight: FontWeight.bold,
                      color: Color(0xFF211D1D), // Customize as needed
                    ),
                  ),
                  SizedBox(height: 8), 
                  
                  _buildRequirementText('Contain at least 8 characters', hasMinLength),
                  _buildRequirementText(
                      'Contain both uppercase and lowercase letters', hasUpperLowerCase),
                  _buildRequirementText('Contain at least one number', hasNumber),
                  _buildRequirementText(
                      'Contain at least one special character (!@#\$%^&*)',
                      hasSpecialChar),
                ],
              ),
              SizedBox(height: 30),

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
      )
    );
  }

  // Helper method to build password requirement text with dynamic color and GoogleFonts.poppins
  Widget _buildRequirementText(String text, bool isValid) {
    Color textColor;

    // Change the text color based on validation
    if (!hasUserTyped) {
      textColor = Colors.grey; // Grey if the user hasn't typed
    } else if (isValid) {
      textColor = Colors.green; // Green if the condition is met
    } else {
      textColor = Colors.red; // Red if the condition is not met
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: GoogleFonts.poppins(  // Use GoogleFonts.poppins here
          fontSize: 14,
          color: textColor,
        ),
      ),
    );
  }

}