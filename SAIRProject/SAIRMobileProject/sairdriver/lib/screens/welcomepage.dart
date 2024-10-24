import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/screens/login.dart';
import 'login_email.dart';
class Welcomepage extends StatefulWidget {
  const Welcomepage({super.key});

  @override
  State<Welcomepage> createState() => _WelcomepageState();
}

class _WelcomepageState extends State<Welcomepage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFF),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Green Container with Welcome Message
          Container(
            height: MediaQuery.of(context).size.height * 0.6, // Adjust height as needed
            decoration: const BoxDecoration(
              color: Color.fromARGB(202, 3, 152, 85), // Green color
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(30), // Rounded corners for bottom left
                bottomRight: Radius.circular(30), // Rounded corners for bottom right
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
                  "Welcome to SAIR",
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
          const SizedBox(height: 80), // Increased space between green and white container

          // White container with Login button
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 30.0),
              child: Column(
                children: [
                  // Login button
                  SizedBox(
                    width: double.infinity, // Makes the button stretch across the screen
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color.fromARGB(202, 3, 152, 85),
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      onPressed: () {
                        // Navigate to the Login page using MaterialPageRoute
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (context) => const LoginEmail()),
                        );
                      },
                      child: Text(
                        'Login',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 16, // Keep text size as it is
                        ),
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