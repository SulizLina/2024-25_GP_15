import 'package:flutter/material.dart';
import 'package:persistent_bottom_nav_bar/persistent_bottom_nav_bar.dart';
import 'package:sairdriver/screens/CrashesList.dart';
import 'package:sairdriver/screens/RaiseCompliants.dart';
import 'package:sairdriver/screens/ViewComplaints.dart';
import 'package:sairdriver/screens/ViolationDetail.dart';
import 'package:sairdriver/screens/ViolationsList.dart';
import 'package:sairdriver/screens/home.dart';
import 'package:sairdriver/screens/profilepage.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class BottomNavBar extends StatefulWidget {
  final String driverId; // DriverID passed from login

  BottomNavBar({required this.driverId});

  @override
  State<BottomNavBar> createState() => _MyBottomNavState();
}

class _MyBottomNavState extends State<BottomNavBar> {
  final PersistentTabController _controller =
      PersistentTabController(initialIndex: 2);

  @override
  void dispose() {
    super.dispose();
    _controller.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PersistentTabView(
      controller: _controller,
      context,
      screens: _buildScreen(widget.driverId), // Pass driverId to the method
      items: _navbarItem(),
      navBarStyle: NavBarStyle.style15,
      backgroundColor: Colors.white,
      decoration: NavBarDecoration(
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1), // Color for shadow
            blurRadius: 10, // Spread of the shadow
            offset: const Offset(0, -3), // Position of shadow (above nav bar)
          ),
        ],
      ),
      navBarHeight: 55, // Reduced height to make navbar more compact
      animationSettings: const NavBarAnimationSettings(
        navBarItemAnimation: ItemAnimationSettings(
          duration: Duration(milliseconds: 400),
          curve: Curves.ease,
        ),
        screenTransitionAnimation: ScreenTransitionAnimationSettings(
          animateTabTransition: true,
          duration: Duration(milliseconds: 500),
          screenTransitionAnimationType: ScreenTransitionAnimationType.slide,
        ),
      ),
    );
  }

  // List of Screens for Bottom NavBar
  List<Widget> _buildScreen(String driverId) {
    // Add driverId parameter
    return [
      const Crasheslist(),
      Violationslist(driverId: driverId),
      Home(driverId: driverId),
       Viewcomplaints(driverId: driverId),
      Profilepage(driverId: driverId), // Use the driverId here
    ];
  }
}

// Bottom NavBar Items
List<PersistentBottomNavBarItem> _navbarItem() {
  return [
    PersistentBottomNavBarItem(
      icon: const Icon(Icons.motorcycle, size: 31), // Smaller icon size
      title: 'Crashes',
      activeColorPrimary: Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey,
    ),
    PersistentBottomNavBarItem(
      icon: const FaIcon(
      FontAwesomeIcons.fileCircleExclamation, size: 31 ), // Smaller icon size
      title: 'Violations',
      activeColorPrimary: Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey,
    ),
    PersistentBottomNavBarItem(
      icon: const FaIcon(
      FontAwesomeIcons.house,
      color: Colors.white,
        size: 28, // Adjust the size as needed
    ),
      activeColorPrimary: Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey,
    ),
    PersistentBottomNavBarItem(
      icon: const FaIcon(
      FontAwesomeIcons.fileSignature,
        size: 32, // Adjust the size as needed
    ),
      title: 'Complaints',
      activeColorPrimary: Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey,
    ),
    PersistentBottomNavBarItem(
      icon: const FaIcon(
      FontAwesomeIcons.user,
        size: 32, // Adjust the size as needed
    ),
      title: 'Profile',
      activeColorPrimary: Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey,
    ),
  ];
}
