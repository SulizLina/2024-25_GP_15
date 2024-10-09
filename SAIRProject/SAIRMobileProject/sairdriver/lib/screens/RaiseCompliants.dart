import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class Raisecomplaint extends StatefulWidget {
  const Raisecomplaint({super.key});

  @override
  State<Raisecomplaint> createState() => _RaisecomplaintState();
}

class _RaisecomplaintState extends State<Raisecomplaint> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        
      ),
      body: Center(
        child: Text(
          'This is a rise complaint page. Will be done sprint 2',
          style: GoogleFonts.poppins(fontSize: 20, color: Colors.grey),
          textAlign: TextAlign.center,
        ),
      ),
    ); 
  }
}