import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class Crasheslist extends StatefulWidget {
  @override
  State<Crasheslist> createState() => _CrasheslistState();
}

class _CrasheslistState extends State<Crasheslist> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: Color.fromARGB(202, 3, 152, 85),
        shape: RoundedRectangleBorder(),
        toolbarHeight: 120, // Adjust the toolbar height
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
                  offset: Offset(0, 10), // Move the text down by 10 pixels to match the home page
                  child: Padding(
                    padding: const EdgeInsets.only(left: 5),
                    child: Text(
                      "My Crashes",
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
            // Logout Icon aligned with text 
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.only(left: 16.0), // Add left padding here
        child: Center(
        child: Text(
          'This is a View crashes page. Will be done in Sprint 2',
          style: GoogleFonts.poppins(fontSize: 20, color: Colors.grey),
          textAlign: TextAlign.center,
        ),
        ),
      ),
    );
  }
}
