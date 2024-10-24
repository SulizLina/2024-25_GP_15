import 'package:flutter/material.dart';
import 'package:sairdriver/screens/bottom_nav_bar.dart';
import 'package:google_fonts/google_fonts.dart';

class RegulationOnboarding extends StatefulWidget {
  final String driverId;  
  const RegulationOnboarding({required this.driverId});

  @override
  State<RegulationOnboarding> createState() => _RegulationOnboardingState();
}

class _RegulationOnboardingState extends State<RegulationOnboarding> {
  int _selectedIndex = 0; // Track the current page index
  bool isLastPage = false; // Track if the user is on the last page

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Spacer(flex: 2),
            SizedBox(
              height: 500,
              child: PageView.builder(
                itemCount: demoData.length,
                onPageChanged: (value) {
                  setState(() {
                    _selectedIndex = value;
                    isLastPage = value == demoData.length - 1; // Check if it's the last page
                  });
                },
                itemBuilder: (context, index) {
                  return OnboardingContent(
                    illustration: demoData[index]['illustration'],
                    title: demoData[index]['title'],
                    text: demoData[index]['text'],
                  );
                },
              ),
            ),
            Spacer(),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                demoData.length,
                (index) => Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: AnimatedDot(isActive: _selectedIndex == index),
                ),
              ),
            ),
            Spacer(flex: 2),
            ElevatedButton(
              onPressed: () {
                if (isLastPage) {
                  // Navigate to the next screen if it's the last page
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => BottomNavBar(driverId: widget.driverId),
                    ),
                  );
                } else {
                  // Show styled dialog if the button is pressed before reaching the last page
                  showDialog(
                    context: context,
                    builder: (context) {
                      return Dialog(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20), // Rounded corners
                        ),
                        child: Container(
                          padding: EdgeInsets.all(16),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                "Attention!",
                                style: GoogleFonts.poppins(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 20),
                              Text(
                                "Please complete all regulations information before proceeding.",
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              SizedBox(height: 20),
                              ElevatedButton(
                                onPressed: () {
                                  Navigator.pop(context); // Close the dialog
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Color.fromARGB(201, 3, 152, 85), // Green button
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10), // Rounded button
                                  ),
                                ),
                                child: Text(
                                  "OK",
                                  style: GoogleFonts.poppins(
                                    color: Colors.white, // White text
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: isLastPage
                    ? Color.fromARGB(255, 3, 152, 85) // Green when active
                    : Colors.grey, 
                padding: EdgeInsets.symmetric(horizontal: 30, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              child: Text(
                "Get Started".toUpperCase(),
                style: GoogleFonts.poppins(
                  color: Colors.black, // Text color
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Spacer(),
          ],
        ),
      ),
    );
  }
}

class AnimatedDot extends StatelessWidget {
  const AnimatedDot({super.key, required this.isActive});

  final bool isActive;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: Duration(milliseconds: 300),
      height: 6,
      width: isActive ? 20 : 6,
      decoration: BoxDecoration(
        color: isActive ? Color.fromARGB(255, 3, 152, 85) : Color(0xFF868686).withOpacity(0.25),
        borderRadius: BorderRadius.all(Radius.circular(12)),
      ),
    );
  }
}

class OnboardingContent extends StatelessWidget {
  const OnboardingContent({
    super.key,
    required this.illustration,
    required this.title,
    required this.text,
  });

  final String illustration, title, text;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: AspectRatio(
            aspectRatio: 1.5,
            child: Image.asset(illustration),
          ),
        ),
        SizedBox(height: 16),
        Text(
          title,
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            fontSize: 25, 
            color: Color.fromARGB(255, 3, 152, 85),
          ),
        ),
        SizedBox(height: 8),
        Text(
          text,
          style: GoogleFonts.poppins(
            fontSize: 16,
            color: Colors.black,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

List<Map<String, dynamic>> demoData = [
  {
    "illustration": "assets/image/OnboaringHelmet.png", 
    "title": "Protect Your Head",
    "text": "Don't forget your helmet",
  },
  {
    "illustration": "assets/image/SpeedIconNOb.png", 
    "title": "Obey Speed Limit",
    "text": "50 kilometers in residential areas.\n80 kilometers on main roads within cities.\n120 kilometers outside city limits",
  },
  {
    "illustration": "assets/image/MotorRegu.png", 
    "title": "See and Be Seen",
    "text": "Stay visible and follow the rules.\nAvoid weaving between cars.\nYour safety matters more than rushing to your target!!",
  },
  {
    "illustration": "assets/image/checkMotorcycle.png",
    "title": "Check Your Motorcycle",
    "text": "Inspect Your Motorcycle: Tires, Lights, and More Before Each Ride",
  },
];