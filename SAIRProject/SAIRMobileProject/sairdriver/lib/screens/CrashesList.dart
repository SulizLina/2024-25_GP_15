import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class Crasheslist extends StatefulWidget {
  const Crasheslist({super.key});

  @override
  State<Crasheslist> createState() => _CrasheslistState();
}

class _CrasheslistState extends State<Crasheslist> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor:  Color.fromARGB(255, 3, 152, 85), 
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: Color.fromARGB(255, 3, 152, 85), 
        shape: const RoundedRectangleBorder(),
        toolbarHeight: 120, // Adjust the toolbar height
        iconTheme: const IconThemeData(color: Color(0xFF211D1D)),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Padding(
                  padding: EdgeInsets.only(left: 7),
                ),
                Transform.translate(
                  offset: const Offset(0, 10), 
                  child: Padding(
                    padding: EdgeInsets.only(left: 5),
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
          ],
        ),
      ),
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16.0),
        decoration: const BoxDecoration(
          color: Color(0xFFF3F3F3),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30), 
            topRight: Radius.circular(30), 
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0), 
          child: Center(
            child: Text(
              'This is a View crashes page.\nIt will be done in Sprint 2',
              style: GoogleFonts.poppins(fontSize: 20, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }
}
