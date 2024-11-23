import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:sairdriver/screens/login_email.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:sairdriver/services/crashstreambuilder.dart';

class Home extends StatefulWidget {
  final String driverId; // DriverID passed from previous page
  const Home({required this.driverId});

  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  String driverName = "";
  final FirebaseMessaging messaging = FirebaseMessaging.instance;
  @override
  void initState() {
    super.initState();
    request(widget.driverId);
    // Fetch driver details when the page initializes
    fetchDriverName();
  }

  Future<void> request(String driverId) async {
    // Get the device token
    String? token = await messaging.getToken();
    print("Device token: $token");

    // Save the token to Firestore
    if (token != null) {
      await FirebaseFirestore.instance
          .collection('Driver')
          .doc(driverId)
          .update({'token': token});
    }
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
          driverName =
              driverData.data()?['Fname'] ?? ''; // Safely access 'fname' field
        });
      }
    } catch (e) {
      // Handle the error, you can log it or show an alert
      print("Error fetching driver name: $e");
    }
  }

  Widget _buildObeySpeedLimitSubtitle() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSpeedLimitRow("•", "50 kilometers in residential areas."),
        _buildSpeedLimitRow("•", "80 kilometers on main roads within cities."),
        _buildSpeedLimitRow("•", "120 kilometers outside city limits."),
      ],
    );
  }

  Widget _buildSpeedLimitRow(String bullet, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          bullet,
          style: GoogleFonts.poppins(
            fontSize: 14,
            color: Color(0xFF211D1D),
            height: 1.5,
          ),
        ),
        const SizedBox(width: 8), // Space between bullet and text
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: Color(0xFF211D1D),
              height: 1.5,
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color.fromARGB(255, 3, 152, 85),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: Color.fromARGB(255, 3, 152, 85),
        toolbarHeight: 120,
        iconTheme: const IconThemeData(color: Color(0xFF211D1D)),
        title: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Logo on the far left
            Image.asset(
              'assets/image/WhiteMotorcycle.png',
              width: 60,
              height: 70,
            ),
            Expanded(
              child: Text(
                "Hello $driverName !",
                style: GoogleFonts.poppins(
                  fontSize: 22,
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.left, // Ensure text is aligned to the left
              ),
            ),
            // Logout button on the far right
            IconButton(
              icon: const Icon(
                Icons.exit_to_app,
                color: Colors.white,
                size: 30,
              ),
              tooltip: 'Log Out',
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (BuildContext context) {
                    return Dialog(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Container(
                        padding: EdgeInsets.all(16),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              "Logout",
                              style: GoogleFonts.poppins(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Color.fromARGB(202, 3, 152, 85),
                              ),
                            ),
                            SizedBox(height: 20),
                            Text(
                              'Are you sure that you want to logout?',
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            SizedBox(height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: [
                                // Cancel Button
                                ElevatedButton(
                                  onPressed: () {
                                    Navigator.of(context)
                                        .pop(); // Close the dialog without logging out
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors
                                        .grey, // Grey background for the Cancel button
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                  child: Text(
                                    'Cancel',
                                    style: GoogleFonts.poppins(
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                // Logout Button
                                ElevatedButton(
                                  onPressed: () {
                                    Navigator.of(context)
                                        .pop(); // Close the dialog
                                    FirebaseAuth.instance
                                        .signOut(); // Firebase sign-out
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                          builder: (context) =>
                                              const LoginEmail()), // Navigate to the welcome page
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors
                                        .red, // Red background for the Logout button
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                  child: Text(
                                    'Logout',
                                    style: GoogleFonts.poppins(
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16.0, left: 16),
        decoration: const BoxDecoration(
          color: Color(0xFFF3F3F3),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30), // Rounded top-left corner
            topRight: Radius.circular(30), // Rounded top-right corner
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.only(
              left: 16.0, right: 16), // Add left padding here
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              Text(
                'Stay Safe, stay smart!',
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
                subtitle: _buildObeySpeedLimitSubtitle(),
              ),
              const SizedBox(height: 35),
              buildReminderItem(
                icon: HugeIcons.strokeRoundedMotorbike02,
                title: "See And Be Seen",
                subtitle:
                    "Stay visible and follow the rules.\nAvoid weaving between cars\nyour safety matters more than rushing to your target!!",
              ),
              const SizedBox(height: 35),
              buildReminderItem(
                  icon: HugeIcons.strokeRoundedRepair,
                  title: "Check Your Motorcycle",
                  subtitle:
                      "Inspect Your Motorcycle: Tires, Lights, and More Before Each Ride"),
              //show crash dialog if needed
              CrashStreamBuilder(driverId: widget.driverId),
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
    dynamic subtitle,
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
                  icon!, // Use the passed icon
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
                  if (subtitle is String)
                    Text(
                      subtitle,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: Color(0xFF211D1D),
                        height: 1.5,
                      ),
                    )
                  else
                    subtitle, // Display the Widget if the subtitle is not a String
              ],
            ),
          ),
        ),
      ],
    );
  }
}
