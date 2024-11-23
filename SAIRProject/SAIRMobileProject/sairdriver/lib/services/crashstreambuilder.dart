import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/globals.dart';
import 'package:sairdriver/models/crash.dart';
import 'package:sairdriver/messages/CrashDialog.dart';

class CrashStreamBuilder extends StatefulWidget {
  const CrashStreamBuilder({
    Key? key,
  }) : super(key: key);

  @override
  State<CrashStreamBuilder> createState() => _CrashStreamBuilderState();
}

class _CrashStreamBuilderState extends State<CrashStreamBuilder> {
  Stream<QuerySnapshot> fetchCrashesStream() {
    return FirebaseFirestore.instance.collection('Crash').snapshots();
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: fetchCrashesStream(),
      builder: (context, crashSnapshot) {
        if (crashSnapshot.connectionState == ConnectionState.waiting ||
            crashSnapshot.hasError) {
          return SizedBox(); // Ignore crashes block until loaded
        }

        if (crashSnapshot.data != null && crashSnapshot.data!.docs.isNotEmpty) {
          final allCrashes = crashSnapshot.data!.docs;

          // Automatically show popup for auto-confirmed crashes
          for (var doc in allCrashes) {
            Crash crash = Crash.fromJson(doc);
            if (crash.isAutoshown == true) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                CrashDialog.showAutoConfirmationMessage(context, crash);
              });
            }
          }

          // Filter for pending crashes
          final pendingCrashes = allCrashes.where((doc) {
            Crash crash = Crash.fromJson(doc);
            return crash.status?.toLowerCase() == 'pending';
          }).toList();

          // Show crash dialogs for pending crashes
          for (var doc in pendingCrashes) {
            Crash crash = Crash.fromJson(doc);

            // Skip already processed crashes
            if (processedCrashes.contains(crash.cDocid)) {
              continue;
            }

            processedCrashes.add(crash.cDocid!);

            WidgetsBinding.instance.addPostFrameCallback((_) {
              CrashDialog.showCrashDialog(context, doc);
            });
          }
        }
        return SizedBox(); // Empty space for crashes block
      },
    );
  }
}
