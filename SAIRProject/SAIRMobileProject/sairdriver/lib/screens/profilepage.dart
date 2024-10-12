import 'package:flutter/material.dart';
import 'editpasswordpage.dart';
import 'edit_phone_page.dart'; 
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class Profilepage extends StatefulWidget {
  const Profilepage({super.key});

  @override
  State<Profilepage> createState() => _ProfilepageState();
}

class _ProfilepageState extends State<Profilepage> {
  User? currentUser = FirebaseAuth.instance.currentUser; // Get current user

  // Variables to hold data retrieved from Firebase
  String firstName = "";
  String lastName = "";
  String idNumber = "";
  String plateNumber = "";
  String phoneNumber = "";
  String gpsSerialNumber = "";
  String password = "******"; 
  String? userId; 

  @override
  void initState() {
    super.initState();
    if (currentUser != null) {
      userId = currentUser!.uid; // Assign the user's UID from FirebaseAuth
      fetchUserData(); // Fetch user data using this UID
    } else {
      print("No user is currently signed in.");
    }
  }

  Future<void> fetchUserData() async {
    if (userId != null) {
      // Fetch data from Firestore using the user UID
      final userDoc = await FirebaseFirestore.instance
          .collection('Driver')
          .doc(userId) // Use the UID to fetch the corresponding document
          .get();

      if (userDoc.exists) {
        setState(() {
          firstName = userDoc['Fname'];
          lastName = userDoc['Lname'];
          idNumber = userDoc['DriverID'];
          phoneNumber = userDoc['PhoneNumber'];
          gpsSerialNumber = userDoc['GPSNumber'] ?? 'There is no assigned GPS yet';
          password = userDoc['Password'];
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFCFCFC),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: const Color.fromARGB(202, 3, 152, 85),
        toolbarHeight: 120,
        iconTheme: const IconThemeData(color: Color(0xFF211D1D)),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 5),
              child: Transform.translate(
                offset: const Offset(0, 10),
                child: Text(
                  "My Profile",
                  style: GoogleFonts.poppins(
                    fontSize: 24.0,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.left,
                ),
              ),
            ),
            IconButton(
              icon: const Icon(
                Icons.exit_to_app,
                color: Colors.white,
                size: 30,
              ),
              tooltip: 'Log Out',
              onPressed: () {
                // Handle log out logic
                FirebaseAuth.instance.signOut();
              },
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            // First Name field
            TextFormField(
              initialValue: firstName,
              decoration: InputDecoration(
                labelText: 'First name',
                labelStyle: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                enabledBorder: OutlineInputBorder(
                  borderSide: const BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: const BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 2.0,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
              readOnly: true,
            ),
            const SizedBox(height: 16),
            // Last Name field
            TextFormField(
              initialValue: lastName,
              decoration: InputDecoration(
                labelText: 'Last name',
                labelStyle: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                enabledBorder: OutlineInputBorder(
                  borderSide: const BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: const BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 2.0,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
              readOnly: true,
            ),
            const SizedBox(height: 16),
            // Phone number field with IconButton
            TextFormField(
              initialValue: phoneNumber,
              decoration: InputDecoration(
                labelText: 'Phone number',
                labelStyle: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                enabledBorder: OutlineInputBorder(
                  borderSide: const BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: const BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 2.0,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                suffixIcon: IconButton(
                  icon: const Icon(
                    Icons.edit,
                    color: Color.fromARGB(202, 3, 152, 85),
                  ),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => EditPhonePage()),
                    );
                  },
                ),
              ),
              style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
              readOnly: true,
            ),
            const SizedBox(height: 16),
            // ID / Residency number field
            TextFormField(
              initialValue: idNumber,
              decoration: InputDecoration(
                labelText: 'ID / Residency number',
                labelStyle: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                enabledBorder: OutlineInputBorder(
                  borderSide: const BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: const BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 2.0,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
              readOnly: true,
            ),
            const SizedBox(height: 16),
            // Plate number field
            TextFormField(
              initialValue: plateNumber,
              decoration: InputDecoration(
                labelText: 'Plate number',
                labelStyle: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                enabledBorder: OutlineInputBorder(
                  borderSide: const BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: const BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 2.0,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
              readOnly: true,
            ),
            const SizedBox(height: 16),
            // GPS serial number field
            TextFormField(
              initialValue: gpsSerialNumber,
              decoration: InputDecoration(
                labelText: 'GPS serial number',
                labelStyle: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                enabledBorder: OutlineInputBorder(
                  borderSide: const BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: const BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 2.0,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
              readOnly: true,
            ),
            const SizedBox(height: 16),
            // Password field with IconButton
            TextFormField(
              initialValue: password,
              decoration: InputDecoration(
                labelText: 'Password',
                labelStyle: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                enabledBorder: OutlineInputBorder(
                  borderSide: const BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: const BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 2.0,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                suffixIcon: IconButton(
                  icon: const Icon(
                    Icons.edit,
                    color: Color.fromARGB(202, 3, 152, 85),
                  ),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => Editpasswordpage()),
                    );
                  },
                ),
              ),
              style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
              obscureText: true,
              readOnly: true,
            ),
          ],
        ),
      ),
    );
  }
}
