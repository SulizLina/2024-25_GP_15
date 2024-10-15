import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';  // Import Firestore

class Home extends StatefulWidget {
  final String driverId;  // DriverID passed from previous page
  const Home({required this.driverId});

  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  String driverName = ""; 

  @override
  void initState() {
    super.initState();
    // Fetch driver details when the page initializes
    fetchDriverName();
  }

  Future<void> fetchDriverName() async {
    try {
      // Query the Firestore database for the driver's details
      var driverData = await FirebaseFirestore.instance
          .collection('Driver')  
          .doc(widget.driverId)  
          .get();

      // If the document exists, update the driverName state
      if (driverData.exists) {
        setState(() {
          driverName = driverData.data()?['Fname'] ?? '';  // Safely access 'fname' field
        });
      }
    } catch (e) {
      // Handle the error, you can log it or show an alert
      print("Error fetching driver name: $e");
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
        shape: const RoundedRectangleBorder(),
        toolbarHeight: 120, // Adjust the toolbar height
        iconTheme: const IconThemeData(color: Color(0xFF211D1D)),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 7),
              child: Image.asset(
                'assets/image/WhiteMotorcycle.png',
                width: 70,
                height: 60,
              ),
            ),
            Transform.translate(
              offset: Offset(0, 10), // Move the text down by 10 pixels
              child: Padding(
                padding: const EdgeInsets.only(left: 5),
                child: Text(
                  "Hello $driverName !", 
                  style: GoogleFonts.poppins(
                    fontSize: 32.0,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.left,
                ),
              ),
            ),
          ],
        ),
      ),
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16.0),
        decoration: const BoxDecoration(
          color:  Color(0xFFF3F3F3),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30), // Rounded top-left corner
            topRight: Radius.circular(30), // Rounded top-right corner
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.only(left: 16.0), // Add left padding here
          child: Center(
            child: Text(
              'This is a Home page...',
              style: GoogleFonts.poppins(fontSize: 20, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }
}
