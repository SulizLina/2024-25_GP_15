import 'package:flutter/material.dart';
import 'package:persistent_bottom_nav_bar/persistent_bottom_nav_bar.dart';

class MyBottomNav extends StatefulWidget {
  const MyBottomNav({super.key});

  @override
  State<MyBottomNav> createState() => _MyBottomNavState();
}

class _MyBottomNavState extends State<MyBottomNav> {
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
      screens: _buildScreen(),
      items: _navbarItem(),
      navBarStyle: NavBarStyle.style15,
      animationSettings: const NavBarAnimationSettings(
          navBarItemAnimation: ItemAnimationSettings(
            // Navigation Bar's items animation properties.
            duration: Duration(milliseconds: 400),
            curve: Curves.ease,
          ),
          screenTransitionAnimation: ScreenTransitionAnimationSettings(
            // Screen transition animation on change of selected tab.
            animateTabTransition: true,
            duration: Duration(milliseconds: 500),
            screenTransitionAnimationType: ScreenTransitionAnimationType.slide,
          )),
    );
  }
}

// bottom items
List<PersistentBottomNavBarItem> _navbarItem() {
  return [
    PersistentBottomNavBarItem(
      icon: const Icon(Icons.motorcycle),
      title: 'Crashes',
      activeColorPrimary: Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey,
    ),
    PersistentBottomNavBarItem(
      icon: const Icon(Icons.warning),
      title: 'Violations',
      activeColorPrimary: Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey,
    ),
    PersistentBottomNavBarItem(
      icon: const Icon(
        Icons.home,
        color: Colors.white,
      ),
      activeColorPrimary: Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey,
    ),
    PersistentBottomNavBarItem(
      icon: const Icon(Icons.report),
      title: 'Complaints',
      activeColorPrimary: Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey,
    ),
    PersistentBottomNavBarItem(
      icon: const Icon(Icons.person),
      title: 'Profile',
      activeColorPrimary: Color.fromARGB(202, 3, 152, 85),
      inactiveColorPrimary: Colors.grey,
    ),
  ];
}

// list of screen pages
List<Widget> _buildScreen() {
  return const [
    Center(child: Text('Crashes')),
    Center(child: Text('Violations')),
    Center(child: Text('Home')),
    Center(child: Text('Complaints')),
    Center(child: Text('Profile')),
  ];
}