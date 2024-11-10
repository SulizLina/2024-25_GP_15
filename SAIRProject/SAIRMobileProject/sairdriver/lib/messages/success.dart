import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SuccessMessageDialog {
  static void show(BuildContext context, String successMessage) {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          child: Container(
            padding: EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Close "X" Button
                Align(
                  alignment: Alignment.topRight,
                  child: Transform.translate(
                    offset: const Offset(0, -15),
                    child: IconButton(
                      icon: const Icon(Icons.close, color: Color(0xFF211D1D)),
                      onPressed: () {
                        Navigator.of(context).pop(); // Close the dialog
                      },
                    ),
                  ),
                ),
                Text(
                  "Done Successfully!",
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 20),
                Text(
                  successMessage,
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 20),
              ],
            ),
          ),
        );
      },
    );
  }
}