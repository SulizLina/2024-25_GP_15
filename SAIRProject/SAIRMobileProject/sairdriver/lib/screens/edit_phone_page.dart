import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';  // For Firebase Firestore
import 'package:firebase_auth/firebase_auth.dart';  // For Firebase Authentication
import 'package:sairdriver/messages/error_messages.dart';  
import 'package:sairdriver/messages/success_dialog.dart';  
import 'package:sairdriver/messages/phone_validator.dart';  

class EditPhonePage extends StatefulWidget {
  @override
  _EditPhonePageState createState() => _EditPhonePageState();
}

class _EditPhonePageState extends State<EditPhonePage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _phoneController = TextEditingController();
  String? errorMessage;

  // Function to check if phone number is taken
  Future<bool> isPhoneNumberTaken(String phoneNumber) async {
    final querySnapshot = await FirebaseFirestore.instance
        .collection('Driver')
        .where('PhoneNumber', isEqualTo: phoneNumber)
        .get();

    return querySnapshot.docs.isNotEmpty;
  }

  // Function to update phone number in Firebase
  Future<void> updatePhoneNumberInFirebase(String phoneNumber) async {
    try {
      User? currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser != null) {
        // Update phone number in the Firestore document for the user
        await FirebaseFirestore.instance
            .collection('Driver')
            .doc(currentUser.uid)
            .update({
          'PhoneNumber': phoneNumber,
        });
      } else {
        setState(() {
          errorMessage = 'User is not logged in.';
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to update phone number. Please try again.';
      });
    }
  }

  // Function to show success dialog
  void showSuccessDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Success'),
          content: Text('Phone number updated successfully.'),
          actions: <Widget>[
            TextButton(
              child: Text('OK'),
              onPressed: () {
                Navigator.of(context).pop(); // Close the dialog
                Navigator.of(context).pop(); // Go back to the previous page
              },
            ),
          ],
        );
      },
    );
  }

  // Function to handle phone number update
  Future<void> _updatePhoneNumber() async {
    if (_formKey.currentState != null && _formKey.currentState!.validate()) {
      String phoneNumber = _phoneController.text;

      // Check if the phone number is already taken
      bool isTaken = await isPhoneNumberTaken(phoneNumber);
      if (isTaken) {
        setState(() {
          errorMessage = PHONE_TAKEN_ERROR; // From error_messages.dart
        });
        return;
      }

      // Update the phone number in Firebase
      await updatePhoneNumberInFirebase(phoneNumber);

      // Show confirmation
      showSuccessDialog(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.black), // Back arrow color
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Bold Green Text (Heading)
              Text(
                'Update Your Phone Number',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color.fromARGB(201, 3, 152, 85),
                ),
              ),
              SizedBox(height: 20), // Space between heading and input field

              // Phone Number Input Field with Green Border
             TextFormField(
  controller: _phoneController,
  decoration: InputDecoration(
    labelText: 'Enter Your Phone Number',
    enabledBorder: OutlineInputBorder(
      borderSide: BorderSide(
        color: Color.fromARGB(201, 3, 152, 85), // Green border when not focused
        width: 1.5,
      ),
      borderRadius: BorderRadius.circular(10), // Rounded corners
    ),
    focusedBorder: OutlineInputBorder(
      borderSide: BorderSide(
        color: Color.fromARGB(201, 3, 152, 85), // Green border when focused
        width: 2.0,
      ),
      borderRadius: BorderRadius.circular(10), // Rounded corners
    ),
    errorBorder: OutlineInputBorder(
      borderSide: BorderSide(
        color: Colors.red, // Red border when there is an error
        width: 1.5,
      ),
      borderRadius: BorderRadius.circular(10), // Rounded corners
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderSide: BorderSide(
        color: Colors.red, // Red border when focused and there is an error
        width: 2.0,
      ),
      borderRadius: BorderRadius.circular(10), // Rounded corners
    ),
  ),
  keyboardType: TextInputType.phone,
  validator: validatePhoneNumber, // Assuming validatePhoneNumber is defined in phone_validator.dart
),

              SizedBox(height: 20),

              // Error Message Display
              if (errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: Text(
                    errorMessage!,
                    style: TextStyle(color: Colors.red, fontSize: 16),
                  ),
                ),

              // Update Button with Green Background
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _updatePhoneNumber,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color.fromARGB(201, 3, 152, 85),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15.0), // Rounded corners
                    ),
                    padding: EdgeInsets.symmetric(vertical: 16), // Add vertical padding
                  ),
                  child: Text(
                    'Update',
                    style: TextStyle(
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
    );
  }
}
