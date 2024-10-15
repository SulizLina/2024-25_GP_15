import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class Rules extends StatefulWidget {
  const Rules({super.key});

  @override
  State<Rules> createState() => _RulesState();
}

class _RulesState extends State<Rules> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 3, 152, 85),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: const Color.fromARGB(255, 3, 152, 85),
        toolbarHeight: 250,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () {
            Navigator.of(context).pop(); // Navigate back to the home page
          },
        ),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 7),
              child: Transform.translate(
                offset: const Offset(0, 10),
                child: Text(
                  "Stay Safe",
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
      ),
      body: Center(
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.only(top: 16.0),
          decoration: const BoxDecoration(
            color: Color(0xFFF3F3F3),
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(100),
              topRight: Radius.circular(100),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 30.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "- Don't drive in residential areas more than 50 km/h",
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    color: const Color.fromARGB(255, 3, 152, 85),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  "- Don't drive on main roads more than 80 km/h",
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    color: const Color.fromARGB(255, 3, 152, 85),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  "- Don't drive outside the city at speeds more than 120 km/h",
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    color: const Color.fromARGB(255, 3, 152, 85),
                  ),
                ),
               
              ],
            ),
          ),
        ),
      ),
    );
  }
}
