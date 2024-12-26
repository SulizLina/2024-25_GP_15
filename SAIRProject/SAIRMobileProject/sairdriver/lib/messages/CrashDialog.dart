import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/messages/Warning.dart';
import 'package:sairdriver/messages/success.dart'; // Adjust path accordingly
//import 'package:sairdriver/CountdownTimer.dart'; // Adjust path accordingly
import 'package:sairdriver/models/crash.dart';
import 'package:flutter_countdown_timer/flutter_countdown_timer.dart';
import 'package:sairdriver/messages/CrashDialog.dart';
import 'package:sairdriver/globals.dart';

class CrashDialog {
  static Future<void> showCrashDialog(
      BuildContext context, DocumentSnapshot crashDoc) async {
    Crash crash = Crash.fromJson(crashDoc);

    if (isDialogShown) return;
    isDialogShown = true;

    // Parse time and date logic
    List<String> timeParts = crash.getFormattedTimeOnly().split(':');
    int hours = int.parse(timeParts[0]);
    int minutes = int.parse(timeParts[1]);
    int seconds = int.parse(timeParts[2]);

    DateTime crashDate = DateTime.parse(crash.getFormattedDate());
    DateTime crashDateTime = DateTime(
      crashDate.year,
      crashDate.month,
      crashDate.day,
      hours,
      minutes,
      seconds,
    );

    DateTime endDateTime = crashDateTime.add(Duration(minutes: 10));
    int remainingTime = endDateTime.difference(DateTime.now()).inSeconds;

    if (remainingTime <= 0) remainingTime = 0;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Center(
                child: Text(
                  "You had a crash?",
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color.fromARGB(202, 3, 152, 85),
                  ),
                ),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'You may have been involved in a crash. Confirm you’re safe or request help within 10 minutes. Afterward, the alert will be confirmed automatically to ensure your safety.',
                    style: GoogleFonts.poppins(fontSize: 16),
                  ),
                  SizedBox(height: 20),
                  CountdownTimer(
                    endTime: DateTime.now().millisecondsSinceEpoch +
                        remainingTime * 1000,
                    onEnd: () async {
                      Navigator.of(context).pop();
                      isDialogShown = false;

                      await FirebaseFirestore.instance
                          .collection('Crash')
                          .doc(crashDoc.id)
                          .update({
                        'Status': 'Confirmed',
                        'isAuto': true,
                        'isAutoshown': true,
                      });
                    },
                    widgetBuilder: (_, time) {
                      return Text(
                        "Time remaining: ${time?.min ?? '0'}m:${time?.sec ?? '0'}s",
                        style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
                      );
                    },
                  ),
                ],
              ),
              actions: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    TextButton(
                      onPressed: () async {
                        Navigator.of(context).pop();
                        isDialogShown = false;
                        // Reject logic
                        _updateCrashStatus(crashDoc.id, "Rejected");
                        SuccessMessageDialog.show(
                          context,
                          'The crash with ID:${crash.cid!} has been rejected successfully!',
                        ).then((_) {
                          // This runs after the dialog is closed
                          FirebaseFirestore.instance
                              .collection('Crash')
                              .doc(crash.cDocid)
                              .update({
                            'isAutoshown': FieldValue.delete(),
                          });
                          // Reset the dialog shown flag
                          isDialogShown = false;
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        'Alert Authorities',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                        ),
                      ),
                    ),
                    SizedBox(width: 10),
                    ElevatedButton(
                      onPressed: () async {
                        _updateCrashStatus(crashDoc.id, "Confirmed");
                        Navigator.of(context).pop();
                        isDialogShown = false;
                        await SuccessMessageDialog.show(
                          context,
                          "The crash with ID:${crash.cid} has been confirmed.\n\nPlease wait, you will receive a call from your delivery company or the concerned authorities.",
                        ).then((_) {
                          // This runs after the dialog is closed
                          FirebaseFirestore.instance
                              .collection('Crash')
                              .doc(crash.cDocid)
                              .update({
                            'isAutoshown': FieldValue.delete(),
                          });
                          // Reset the dialog shown flag
                          isDialogShown = false;
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color.fromARGB(255, 3, 152, 85),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        'I\'Safe',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            );
          },
        );
      },
    );
  }

  static Future<void> showAutoConfirmationMessage(
      BuildContext context, Crash crash) async {
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return WarningDialog(
          message:
              "The crash with ID: ${crash.cid}\n has been automatically confirmed due to no action being taken within the allotted 10-minute timeframe.\n\nPlease wait, you will receive a call from your delivery company or the concerned authorities.",
        );
      },
    ).then((_) {
      // This runs after the dialog is closed
      FirebaseFirestore.instance.collection('Crash').doc(crash.cDocid).update({
        'isAutoshown': FieldValue.delete(),
      });
      // Reset the dialog shown flag
      isDialogShown = false;
    });
  }

  static void _updateCrashStatus(String crashId, String status) {
    FirebaseFirestore.instance
        .collection('Crash')
        .doc(crashId)
        .update({'Status': status, 'isAuto': true}).catchError((error) {
      print("Failed to update crash status: $error");
    });
  }
}
