import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
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
        
          Container(
            height: MediaQuery.of(context).size.height * 0.6, 
            decoration: const BoxDecoration(
              color: Color.fromARGB(202, 3, 152, 85), 
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(30), 
                bottomRight: Radius.circular(30), 
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(height: 50,),
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
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color.fromARGB(202, 3, 152, 85),
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      onPressed: () {
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
                          fontSize: 16,
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