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
  int _selectedIndex = 0;

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
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => BottomNavBar(driverId: widget.driverId),
                ),
              );
            },
            child: Text(
              "Get Started".toUpperCase(),
              style: GoogleFonts.poppins(
                color: Colors.black, // Set the text color to black
                fontWeight: FontWeight.bold, // Optional: make the text bold
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
        color: isActive ? primaryColor : Color(0xFF868686).withOpacity(0.25),
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
            aspectRatio: 1,
            child: Image.asset(illustration),
          ),
        ),
        SizedBox(height: 16),
        Text(
          title,
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            fontSize: 20, // Example font size
            color: primaryColor, // Example color
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

const Color primaryColor = Color.fromARGB(255, 3, 152, 85);