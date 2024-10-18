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
      backgroundColor: Color(0xFFFAFAFF),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Green Container with Welcome Message
          Container(
            height: MediaQuery.of(context).size.height * 0.6, // Adjust height as needed
            decoration: BoxDecoration(
              color: Color.fromARGB(202, 3, 152, 85), // Green color
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(60), // Rounded corners for bottom left
                bottomRight: Radius.circular(60), // Rounded corners for bottom right
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Image.asset(
                  'assets/icons/SAIRLogoWhiteMarker.png',
                  height: 100, // Adjust the size of the logo
                ),
                const SizedBox(height: 15),
                Text(
                  "Welcome to SAIR,",
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: 30), // Add space between green and white container
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 20),
              margin: const EdgeInsets.only(bottom: 50), // Adjust position
              decoration: BoxDecoration(
                color: const Color(0xFFFAFAFF),
                borderRadius: BorderRadius.circular(20), // Rounded corners
              ),
              width: MediaQuery.of(context).size.width * 0.9, // Make the white box bigger
              child: Column(
                children: [
                  // Login button
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color.fromARGB(202, 3, 152, 85),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 90, vertical: 15), // Make button wider
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
                        fontSize: 16, // Make text smaller
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}