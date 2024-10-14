import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/screens/login.dart';

class Welcomepage extends StatefulWidget {
  const Welcomepage({super.key});

  @override
  State<Welcomepage> createState() => _WelcomepageState();
}

class _WelcomepageState extends State<Welcomepage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // SAIRWithLine positioned at the top-right corner
          Align(
            alignment: Alignment.topRight,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(0, 20, 10,
                  0), // Adjust padding to move it away from the edges
              child: Image.asset(
                'assets/image/SAIRWithLine.png',
                height: 500, // Maintain the size
                fit: BoxFit.contain,
              ),
            ),
          ),
          // Center column with the logo, text, and button
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min, // To keep it vertically centered
              children: [
                // Center the SAIRLogo
                Image.asset(
                  'assets/image/SAIRLogo.png',
                  width: 300, // Maintain the size
                  height: 300,
                  fit: BoxFit.contain,
                ),
                const SizedBox(
                    height: 20), // Add spacing between the logo and text
                // Welcome text
                Text(
                  'Welcome to SAIR!',
                  style: GoogleFonts.poppins(
                    color: Color.fromARGB(202, 3, 152, 85),
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),
                // Login button
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color.fromARGB(202, 3, 152, 85),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 100, vertical: 15),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                  ),
                  onPressed: () {
                    // Navigate to the Login page using MaterialPageRoute
                   Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const Login()),
                    );
                  },
                  child: Text(
                    'Login',
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 18,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
