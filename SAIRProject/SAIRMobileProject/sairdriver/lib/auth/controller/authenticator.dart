import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
//import 'package:phone_auth/features/auth/views/enter_otp_view.dart';
import 'package:sairdriver/models/user_controller.dart';
import 'auth_result.dart';
import 'package:sairdriver/models/user_state.dart';
final authenticatorProvider = Provider<Authenticator>((ref) {
  return Authenticator(ref);
});

class Authenticator {
  final Ref ref;
  Authenticator(this.ref);
  FirebaseAuth auth = FirebaseAuth.instance;
  User? get currentUser => FirebaseAuth.instance.currentUser;
  String? get userId => currentUser?.uid;
  bool get isAlreadyLoggedIn => userId != null;
  String get displayName => currentUser?.displayName ?? '';
  String? get email => currentUser?.email;

  Future<AuthResult> sendOtp(BuildContext context, String phone) async {
    final sm = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    try {
      await auth.verifyPhoneNumber(
        phoneNumber: phone,
        verificationCompleted: (phoneAuthCredential) async {
          try {
            await auth.signInWithCredential(phoneAuthCredential);
          } on FirebaseAuthException catch (e) {
            sm.showSnackBar(
              SnackBar(
                content: Text(e.message.toString()),
              ),
            );
          }
        },
        verificationFailed: (error) {
          sm.showSnackBar(
            SnackBar(
              content: Text(error.message.toString()),
            ),
          );
        },
        codeSent: (verificationId, forceResendingToken) {
          // print(verificationId);
          sm.showSnackBar(
            const SnackBar(
              content: Text('OTP Sent Successfully'),
            ),
          );
          //navigator.push(
            //MaterialPageRoute(
              //builder: (context) => EnterOtpView(verificationId),
           // ),
          //);
        },
        codeAutoRetrievalTimeout: (verificationId) {},
      );
      return AuthResult.otpSent;
    } catch (e) {
      if (e is FirebaseAuthException) {
        sm.showSnackBar(
          SnackBar(
            content: Text(e.message.toString()),
          ),
        );
      }
      sm.showSnackBar(
        SnackBar(
          content: Text(e.toString()),
        ),
      );
      print(e.toString());
      return AuthResult.failure;
    }
  }

  Future<(AuthResult, bool)> validateOtpAndSignIn(
      BuildContext context, String verificationId, String otp) async {
    final sm = ScaffoldMessenger.of(context);
    final db = FirebaseFirestore.instance;

    final phoneAuthCredential = PhoneAuthProvider.credential(
        verificationId: verificationId, smsCode: otp);

    try {
      await auth.signInWithCredential(phoneAuthCredential);
      final driverDoc = await db
          .collection('Driver')
          .where('PhoneNumber', isEqualTo: currentUser?.phoneNumber)
          .limit(1)
          .get();
      final bool isDefaultPassword =
          driverDoc.docs.first.data()['isDefaultPassword'];
      final shouldChangePassword = isDefaultPassword == true;
      ref
          .read(userProvider.notifier)
          .setUser(UserState.fromMap(driverDoc.docs.first.data()));
      sm.showSnackBar(
          const SnackBar(content: Text('User Logged in Successfully')));
      return (AuthResult.success, shouldChangePassword);
    } catch (e) {
      if (e is FirebaseAuthException) {
        sm.showSnackBar(
          SnackBar(
            content: Text(e.message.toString()),
          ),
        );
      }
      sm.showSnackBar(
        SnackBar(
          content: Text(e.toString()),
        ),
      );
      print(e.toString());
      return (AuthResult.failure, false);
    }
  }

  Future<bool> changePassword(
      BuildContext context, String currentPass, String newPass) async {
    final sm = ScaffoldMessenger.of(context);

    final db = FirebaseFirestore.instance;
    try {
      final driverDoc = await db
          .collection('Driver')
          .where('PhoneNumber', isEqualTo: currentUser?.phoneNumber)
          .limit(1)
          .get();
      if (driverDoc.docs.isNotEmpty) {
        if (driverDoc.docs.first.data()['Password'] != currentPass) {
          sm.showSnackBar(
            const SnackBar(
              content: Text('Incorrect Current Password'),
            ),
          );
          return false;
        }
        await driverDoc.docs.first.reference.update({
          'Password': newPass,
          'isDefaultPassword': false,
        });
        return true;
      }
      return false;
    } catch (e) {
      if (e is FirebaseAuthException) {
        sm.showSnackBar(
          SnackBar(
            content: Text(e.message.toString()),
          ),
        );
      }
      sm.showSnackBar(
        SnackBar(
          content: Text(e.toString()),
        ),
      );
      print(e.toString());
      return false;
    }
  }

  Future<void> logOut() async {
    await FirebaseAuth.instance.signOut();
  }
}