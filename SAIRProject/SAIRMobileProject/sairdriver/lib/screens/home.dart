import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';  
import 'package:hugeicons/hugeicons.dart';

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
        //shape: const RoundedRectangleBorder(),
        toolbarHeight: 120, // Adjust the toolbar height
        iconTheme: const IconThemeData(color: Color(0xFF211D1D)),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 0),//7
              child: Image.asset(
                'assets/image/WhiteMotorcycle.png',
                width: 70,
                height: 60,
              ),
            ),
            Transform.translate(
              offset: Offset(0, 10), // Move the text down by 10 pixels
              child: Padding(
                padding: const EdgeInsets.only(left: 2),//5
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
        padding: const EdgeInsets.only(top: 16.0, left: 16),
        decoration: const BoxDecoration(
          color:  Color(0xFFF3F3F3),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30), // Rounded top-left corner
            topRight: Radius.circular(30), // Rounded top-right corner
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.only(left: 16.0, right: 16), // Add left padding here
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              Text(
                'Stay Safe,',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF211D1D),
              ),
              ),
              const SizedBox(height: 35),
              buildReminderItem(
                imagePath: 'assets/icons/helmet2.png', // Path to your PNG image
                title: "Protect Your Head",
                subtitle: "Don't forget your helmet!",
              ),
              const SizedBox(height: 35),
              buildReminderItem(
                icon: HugeIcons.strokeRoundedDashboardSpeed02, 
                title: "Obey Speed Limit", 
                subtitle: "- 50 kilometers in residential areas.\n- 80 kilometers on main roads within cities.\n- 120 kilometers outside city limits"
              ),
              const SizedBox(height: 35),
              buildReminderItem(
                icon: HugeIcons.strokeRoundedMotorbike02, 
                title: "See And Be Seen",
                subtitle: "Stay visible and follow the rules.\nAvoid weaving between cars\nyour safety matters more than rushing to your target!!",
              ),
              const SizedBox(height: 35),
              buildReminderItem(
                icon: HugeIcons.strokeRoundedRepair, 
                title: "Check Your Motorcycle",
                subtitle: "Inspect Your Motorcycle: Tires, Lights, and More Before Each Ride"
              ),
            ],
          ),
        ),
      ),
    );
  }

// Helper method to create each reminder item with icon/image and text
Widget buildReminderItem({
  IconData? icon,
  String? imagePath,
  required String title,
  String? subtitle,
}) {
  return Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Align(
        alignment: Alignment.centerLeft, 
        child: imagePath != null
            ? ColorFiltered(
                colorFilter: ColorFilter.mode(
                  Color.fromARGB(255, 3, 152, 85), // Desired color
                  BlendMode.srcIn, 
                ),
                child: Image.asset(
                  imagePath, 
                  width: 50, 
                  height: 50, 
                ),
              )
            : Icon(
                icon, // Use the passed icon
                size: 50,
                color: Color.fromARGB(255, 3, 152, 85),
              ),
      ),
      const SizedBox(width: 20),
      Expanded(
        child: Align(
          alignment: Alignment.centerLeft, // Align text to start
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color.fromARGB(255, 3, 152, 85),
                ),
              ),
              if (subtitle != null) // Display subtitle if provided
                Text(
                  subtitle,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: Color(0xFF211D1D),
                    height: 1.5,
                  ),
                ),
            ],
          ),
        ),
      ),
    ],
  );
}
}