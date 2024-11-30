import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/globals.dart';
import 'package:sairdriver/models/crash.dart';
import 'package:sairdriver/messages/CrashDialog.dart';
import 'package:sairdriver/models/driver.dart';
import 'package:sairdriver/services/driver_database.dart';

class CrashStreamBuilder extends StatefulWidget {
  final String driverId;
  const CrashStreamBuilder({
    Key? key,
    required this.driverId,
  }) : super(key: key);

  @override
  State<CrashStreamBuilder> createState() => _CrashStreamBuilderState();
}

class _CrashStreamBuilderState extends State<CrashStreamBuilder> {
  Future<driver?> fetchDriverData() async {
    try {
      DriverDatabase dbD = DriverDatabase();
      return await dbD.getDriversnById(widget.driverId);
    } catch (e) {
      print("Error fetching driver data: $e");
      return null;
    }
  }

  Stream<QuerySnapshot> fetchCrashesStream(String driverId) {
    return FirebaseFirestore.instance
        .collection('Crash')
        .where('driverID', isEqualTo: driverId)
        .snapshots();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<driver?>(
      future: fetchDriverData(),
      builder: (context, driverSnapshot) {
        if (driverSnapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (driverSnapshot.hasError) {
          return Center(child: Text("Error: ${driverSnapshot.error}"));
        } else if (!driverSnapshot.hasData || driverSnapshot.data == null) {
          return const Center(child: Text("Driver not found"));
        }

        // Driver data is available
        final driverNat_Res = driverSnapshot.data!;

        return StreamBuilder<QuerySnapshot>(
          stream: fetchCrashesStream(driverNat_Res.driverId!),
          builder: (context, crashSnapshot) {
            if (crashSnapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            } else if (crashSnapshot.hasError) {
              return Center(child: Text("Error: ${crashSnapshot.error}"));
            } else if (!crashSnapshot.hasData ||
                crashSnapshot.data!.docs.isEmpty) {
              return const Center(child: Text(""));
            }

            final allCrashes = crashSnapshot.data!.docs;

            // Automatically show popup for auto-confirmed crashes
            for (var doc in allCrashes) {
              Crash crash = Crash.fromJson(doc);
              if (crash.isAutoshown == true) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  isAutoshown=true;
                  if(!isAutoshown){
                    CrashDialog.showAutoConfirmationMessage(context, crash);
                  }
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

            return const SizedBox(); 
          },
        );
      },
    );
  }
}
