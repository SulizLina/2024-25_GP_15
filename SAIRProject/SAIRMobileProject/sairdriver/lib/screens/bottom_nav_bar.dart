import 'package:flutter/material.dart';
import 'package:persistent_bottom_nav_bar/persistent_bottom_nav_bar.dart';
import 'package:sairdriver/screens/CrashesList.dart';
import 'package:sairdriver/screens/ViewComplaints.dart';
import 'package:sairdriver/screens/ViolationsList.dart';
import 'package:sairdriver/screens/home.dart';
import 'package:sairdriver/screens/profilepage.dart';
import 'package:hugeicons/hugeicons.dart';

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
      screens: _buildScreen(widget.driverId),
      items: _navbarItem(),
      navBarStyle: NavBarStyle.style15,
      backgroundColor: Color(0xFFF3F3F3),
      navBarHeight: 55,
      onItemSelected: (int index) {
        setState(() {}); // Rebuilds the widget on item selection to apply the line dynamically
      },
      decoration: NavBarDecoration(
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
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
    return [
      const Crasheslist(),
      Violationslist(driverId: driverId),
      Home(driverId: driverId),
      Viewcomplaints(driverId: driverId),
      Profilepage(driverId: driverId),
    ];
  }

  // Bottom NavBar Items with dynamic line
  List<PersistentBottomNavBarItem> _navbarItem() {
    return [
    PersistentBottomNavBarItem(
      icon: Stack(
        alignment: Alignment.center,
        children: [
          // Conditionally add the top border when the icon is active
          if (_controller.index == 0)
            Positioned(
              top: 0,
              child: Container(
                height: 2.0,
                width: 40.0,
                color: Color.fromARGB(202, 3, 152, 85),
              ),
            ),
          // The custom motorcycle image for the first tab
          Image.asset(
            'assets/icons/CrashIcon.png', // Path to your custom icon
            color: _controller.index == 0
                ? Color.fromARGB(202, 3, 152, 85)
                : Color(0xFF8E8E8E),
            width: 50,
            height: 50,
          ),
        ],
      ),
      activeColorPrimary: Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey[600],
    ),
      _customNavBarItem(
        HugeIcons.strokeRoundedDoNotTouch02,
        'Violations',
        1,
      ),
      PersistentBottomNavBarItem(
        icon: const Icon(
          Icons.home,
          color: Colors.white,
          size: 32,
        ),
        activeColorPrimary: Color.fromARGB(202, 3, 152, 85),
        inactiveColorPrimary: Colors.grey,
      ),
      _customNavBarItem(
        HugeIcons.strokeRoundedFileEdit,
        'Complaints',
        3,
      ),
      _customNavBarItem(
        HugeIcons.strokeRoundedUser,
        'Profile',
        4,
      ),
    ];
  }

  PersistentBottomNavBarItem _customNavBarItem(
      IconData icon, String title, int index) {
    return PersistentBottomNavBarItem(
      icon: Stack(
        alignment: Alignment.center,
        children: [
          // Conditionally add the top border when the icon is active
          if (_controller.index == index)
            Positioned(
              top: 0,
              child: Container(
                height: 2.0,
                width: 40.0,
                color: Color.fromARGB(202, 3, 152, 85),
              ),
            ),
          // The actual icon, always centered
          Icon(
            icon,
            color: _controller.index == index
                ? Color.fromARGB(202, 3, 152, 85)
                : Colors.grey,
            size: 30,
          ),
        ],
      ),
      activeColorPrimary: Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey,
    );
  }
}
