import 'package:flutter/material.dart';
import 'editpasswordpage.dart';
import 'edit_phone_page.dart'; // Page for editing phone number
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'bottom_nav_bar.dart';
import 'package:sairdriver/models/Driver.dart';
class Profilepage extends StatefulWidget {
  const Profilepage({super.key});

  @override
  State<Profilepage> createState() => _Profilepage();
}

class _Profilepage extends State<Profilepage> {
  // Variables to hold data retrieved from Firebase
  String firstName = "";
  String lastName = "";
  String idNumber = "";
  String plateNumber = "";
  String phoneNumber = "";
  String gpsSerialNumber = "";
  String password = "******"; // Hidden by default

  // Fetch user data from Firebase
    final _driverStream =
      FirebaseFirestore.instance.collection('Driver').snapshots();
      /*
 Future<void> fetchUserData() async {
    DocumentSnapshot snapshot = await FirebaseFirestore.instance
        .collection('Driver')
        .doc('document-id') // Replace with actual document ID
        .get();
    setState(() {
      firstName = snapshot['firstName'];
      lastName = snapshot['lastName'];
      idNumber = snapshot['idNumber'];
      plateNumber = snapshot['plateNumber'];
      phoneNumber = snapshot['phoneNumber'];
      gpsSerialNumber = snapshot['gpsSerialNumber'];
    });
  }

  @override
  void initState() {
    super.initState();
    fetchUserData();
  }
*/
  @override
  Widget build(BuildContext context) {
    return Scaffold(
              backgroundColor: Color(0xFFFCFCFC),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: Color.fromARGB(202, 3, 152, 85),
        shape: RoundedRectangleBorder(),
        toolbarHeight: 120,
        iconTheme: IconThemeData(color: Color(0xFF211D1D)),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Padding(
                  padding: const EdgeInsets.only(left: 7),
                ),
                Transform.translate(
                  offset: Offset(0, 10),
                  child: Padding(
                    padding: const EdgeInsets.only(left: 5),
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
              ],
            ),
           
            IconButton(
              icon: Icon(
                Icons.exit_to_app,
                color: Colors.white,
                size: 30, // Increased the size of the logout icon
              ),
              tooltip: 'Log Out',
              onPressed: () {
                // Handle log out logic
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
            SizedBox(height: 16),
            // First Name field
            TextFormField(
              initialValue: firstName,
              decoration: InputDecoration(
                labelText: 'First name',
                labelStyle: GoogleFonts.poppins(
                    color: Color(0xFF211D1D)),
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 2.0,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              style: GoogleFonts.poppins(
                  color: Color(0xFF211D1D)),
              readOnly: true,
            ),
            SizedBox(height: 16),
            // Last Name field
            TextFormField(
              initialValue: lastName,
              decoration: InputDecoration(
                labelText: 'Last name',
                labelStyle: GoogleFonts.poppins(
                    color: Color(0xFF211D1D)), 
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: Colors.green,
                    width: 2.0,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              style: GoogleFonts.poppins(
                  color: Color(0xFF211D1D)),
              readOnly: true,
            ),
            SizedBox(height: 16),
            // Phone number field with IconButton
            TextFormField(
              initialValue: phoneNumber,
              decoration: InputDecoration(
                labelText: 'Phone number',
                labelStyle: GoogleFonts.poppins(
                    color: Color(0xFF211D1D)),
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 2.0,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                suffixIcon: IconButton(
                  icon:
                      Icon(Icons.edit, color: Color.fromARGB(202, 3, 152, 85)),
                  onPressed: () {
                    // Navigate to phone number edit page
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => EditPhonePage()),
                    );
                  },
                ),
              ),
              style: GoogleFonts.poppins(
                  color: Color(0xFF211D1D)),
              readOnly: true,
            ),
            SizedBox(height: 16),
            // ID / Residency number field
            TextFormField(
              initialValue: idNumber,
              decoration: InputDecoration(
                labelText: 'ID / Residency number',
                labelStyle: GoogleFonts.poppins(
                    color: Color(0xFF211D1D)),
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 2.0,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              style: GoogleFonts.poppins(color: Color(0xFF211D1D)),
              readOnly: true,
            ),
            SizedBox(height: 16),
            // Plate number field
            TextFormField(
              initialValue: plateNumber,
              decoration: InputDecoration(
                labelText: 'Plate number',
                labelStyle: GoogleFonts.poppins(color: Color(0xFF211D1D)),
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 2.0,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              style: GoogleFonts.poppins(color: Color(0xFF211D1D)),
              readOnly: true,
            ),
            SizedBox(height: 16),
            // GPS serial number field
            TextFormField(
              initialValue: gpsSerialNumber,
              decoration: InputDecoration(
                labelText: 'GPS serial number',
                labelStyle: GoogleFonts.poppins(color: Color(0xFF211D1D)),
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 2.0,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              style: GoogleFonts.poppins(
                  color: Color(0xFF211D1D)),
              readOnly: true,
            ),
            SizedBox(height: 16),
            // Password field with IconButton
            TextFormField(
              initialValue: password,
              decoration: InputDecoration(
                labelText: 'Password',
                labelStyle: GoogleFonts.poppins(
                    color: Color(0xFF211D1D)),
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: Color.fromARGB(202, 3, 152, 85),
                    width: 2.0,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                suffixIcon: IconButton(
                  icon: Icon(
                    Icons.edit,
                    color: Color.fromARGB(
                        202, 3, 152, 85),
                  ),
                  onPressed: () {
                    // Navigate to password edit page
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => Editpasswordpage()),
                    );
                  },
                ),
              ),
              style: GoogleFonts.poppins(color: Color(0xFF211D1D)),
     