import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:sairdriver/screens/bottom_nav_bar.dart';

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
        }
      } catch (e) {
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
      backgroundColor: Color.fromARGB(255, 3, 152, 85), 
      toolbarHeight: 100, 
      iconTheme: const IconThemeData(color: Color(0xFFFAFAFF)), 
      title: Row(
        children: [
          IconButton(
            icon: Icon(Icons.arrow_back),
            onPressed: () {
              Navigator.pop(context); 
            },
          ),
          SizedBox(width: 10), 
          Expanded( 
            child: Text(
              "Set Your Password",
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
                'Set Your Password',
                style: GoogleFonts.poppins(
                  fontSize: 21,
                  fontWeight: FontWeight.bold,
                  color: Color.fromARGB(201, 3, 152, 85),
                ),
              ),
              SizedBox(height: 8), 
              Text(
                'Write Your New Password Below.',
                style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey),
              ),
              SizedBox(height: 14),

              // Password Input Field with dynamic validation
              TextFormField(
                controller: _passwordController,
                obscureText: !_isPasswordVisible,
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
                      color: Color.fromARGB(201, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color: Color.fromARGB(201, 3, 152, 85),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              SizedBox(height: 16),

              // Confirm Password Field
              TextFormField(
                controller: _confirmPasswordController,
                obscureText: !_isConfirmPasswordVisible,
                decoration: InputDecoration(
                  labelText: 'Confirm Password',
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
                      color: Color.fromARGB(201, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color: Color.fromARGB(201, 3, 152, 85),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
            validator: (value) {
              if (value != _passwordController.text) {
                return null;  // Don't return the error directly
              }
              return null;  // Will be handled below
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

              // Update Password Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      _showConfirmationDialog(); 
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color.fromARGB(201, 3, 152, 85),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(
                    'Update Password',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      color: Color(0xFFFAFAFF),
                      fontWeight: FontWeight.bold,
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