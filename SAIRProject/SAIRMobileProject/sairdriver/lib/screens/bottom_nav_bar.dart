import 'package:flutter/material.dart';
import 'package:persistent_bottom_nav_bar/persistent_bottom_nav_bar.dart';
import 'package:sairdriver/screens/CrashesList.dart';
import 'package:sairdriver/screens/ViewComplaints.dart';
import 'package:sairdriver/screens/ViolationsList.dart';
import 'package:sairdriver/screens/home.dart';
import 'package:sairdriver/screens/profilepage.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:google_fonts/google_fonts.dart';

class BottomNavBar extends StatefulWidget {
  final String driverId;

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
      screens: _buildScreens(widget.driverId),
      items: _navbarItems(),
      navBarStyle: NavBarStyle.style15,
      backgroundColor: Color(0xFFF3F3F3),
      navBarHeight: 55,
      onItemSelected: (int index) {
        setState(() {});
      },
      decoration: _navbarDecoration(),
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
  List<Widget> _buildScreens(String driverId) {
    return [
      Crasheslist(driverId: driverId),
      Violationslist(driverId: driverId),
      Home(driverId: driverId),
      Viewcomplaints(driverId: driverId),
      Profilepage(driverId: driverId),
    ];
  }

  // Bottom NavBar Items
  List<PersistentBottomNavBarItem> _navbarItems() {
    return [
      _crashesNavBarItem(),
      _customNavBarItem(HugeIcons.strokeRoundedDoNotTouch02, 'Violations', 1),
      _homeNavBarItem(),
      _customNavBarItem(HugeIcons.strokeRoundedFileEdit, 'Complaints', 3),
      _customNavBarItem(HugeIcons.strokeRoundedUser, 'Profile', 4),
    ];
  }

  PersistentBottomNavBarItem _crashesNavBarItem() {
    return PersistentBottomNavBarItem(
      icon: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 2.0,
            width: 40.0,
            color: _controller.index == 0
                ? const Color.fromARGB(202, 3, 152, 85)
                : Colors.transparent, // Use green line when active
          ),
          const SizedBox(height: 4),
          Image.asset(
            'assets/icons/accident.png',
            color: _controller.index == 0
                ? const Color.fromARGB(202, 3, 152, 85)
                : Colors.grey[500],
            width: 52,
            height: 29,
          ),
          const SizedBox(height: 4),
          Text(
            'Crash',
            style: GoogleFonts.poppins(
              fontSize: 9,
              decoration: TextDecoration.none,
              color: _controller.index == 0
                  ? const Color.fromARGB(202, 3, 152, 85)
                  : Colors.grey,
            ),
          ),
        ],
      ),
      activeColorPrimary: const Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey[600],
    );
  }

  PersistentBottomNavBarItem _homeNavBarItem() {
    return PersistentBottomNavBarItem(
      icon: const Icon(
        Icons.home,
        color: Colors.white,
        size: 32,
      ),
      activeColorPrimary: const Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey,
    );
  }

  PersistentBottomNavBarItem _customNavBarItem(
    IconData icon,
    String title,
    int index,
  ) {
    return PersistentBottomNavBarItem(
      icon: _customNavBarItemIcon(icon, title, index),
      activeColorPrimary: const Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey,
      textStyle: const TextStyle(
        fontSize: 10,
      ),
    );
  }

  Widget _customNavBarItemIcon(IconData icon, String title, int index) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          height: 2.0,
          width: 40.0,
          color: _controller.index == index
              ? const Color.fromARGB(202, 3, 152, 85)
              : Colors.transparent, // Use transparent color when not active
        ),
        const SizedBox(height: 2), // Adjusted spacing to keep consistent height
        Icon(
          icon,
          color: _controller.index == index
              ? const Color.fromARGB(202, 3, 152, 85)
              : Colors.grey,
          size: 30,
        ),
        const SizedBox(height: 4),
        Text(
          title,
          style: GoogleFonts.poppins(
            fontSize: 10,
            decoration: TextDecoration.none,
            color: _controller.index == index
                ? const Color.fromARGB(202, 3, 152, 85)
                : Colors.grey,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  NavBarDecoration _navbarDecoration() {
    return NavBarDecoration(
      borderRadius: BorderRadius.circular(0),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.1),
          blurRadius: 10,
          offset: const Offset(0, -3),
        ),
      ],
    );
  }
}
