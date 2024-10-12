import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
//import 'package:phone_auth/features/auth/views/change_password_view.dart';
import 'auth_result.dart';
import 'authenticator.dart';
import 'auth_state.dart';
import 'package:sairdriver/models/user_controller.dart';
import 'package:sairdriver/models/user_state.dart';
final isLoggedInProvider = Provider<bool>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState.result == AuthResult.success;
});

final authStateProvider =
    StateNotifierProvider<AuthStateNotifier, AuthState>((ref) {
  return AuthStateNotifier(ref);
});

class AuthStateNotifier extends StateNotifier<AuthState> {
  final Ref ref;
  Authenticator? _authenticator;

  AuthStateNotifier(this.ref) : super(const AuthState.unknown()) {
    _authenticator = ref.watch(authenticatorProvider);
    if (_authenticator!.isAlreadyLoggedIn) {
      getUser().then(
        (user) => ref.read(userProvider.notifier).setUser(user),
      );
      state = AuthState(
        result: AuthResult.success,
        isLoading: false,
        userId: _authenticator!.userId,
      );
    }
  }

  Future<UserState> getUser() async {
    final db = FirebaseFirestore.instance;

    final driverDoc = await db
        .collection('Driver')
        .where('PhoneNumber',
            isEqualTo: _authenticator?.currentUser?.phoneNumber)
        .limit(1)
        .get();
    return UserState.fromMap(driverDoc.docs.first.data());
  }

  Future<void> sendOtp(BuildContext context,
      {required String phone, required String password}) async {
    final sm = ScaffoldMessenger.of(context);
    state = state.copiedWithIsLoading(true);
    final db = FirebaseFirestore.instance;
    final driverDoc = await db
        .collection('Driver')
        .where('PhoneNumber', isEqualTo: phone)
        .limit(1)
        .get();
    if (driverDoc.docs.isEmpty) {
      sm.showSnackBar(const SnackBar(
          content: Text("User with this Phone Number doesn't exists")));
      state = const AuthState(
          result: AuthResult.failure, isLoading: false, userId: null);
      return;
    }
    if (driverDoc.docs.first.data()['Password'] != password) {
      sm.showSnackBar(
        const SnackBar(content: Text('Incorrect Password')),
      );
      state = const AuthState(
          result: AuthResult.failure, isLoading: false, userId: null);
      return;
    }

    final result = await _authenticator!.sendOtp(context, phone);

    state = AuthState(result: result, isLoading: false, userId: null);
  }

  Future<void> validateOtpAndSignIn(
    BuildContext context, {
    required String verificationId,
    required String otp,
  }) async {
    state = state.copiedWithIsLoading(true);
    final result = await _authenticator!
        .validateOtpAndSignIn(context, verificationId, otp);
    if (context.mounted) {
      if (result.$1 == AuthResult.success) {
        if (result.$2) {
          //Navigator.push(
              //context,
              //MaterialPageRoute(
                //builder: (context) => const ChangePasswordView(),
             // )
            // );
        } else {
          Navigator.pop(context);
        }

        state = AuthState(
            result: AuthResult.success,
            isLoading: false,
            userId: _authenticator!.userId);
        return;
      }
    }
    state = const AuthState(
        result: AuthResult.failure, isLoading: false, userId: null);
  }

  Future<void> changePassword(
      BuildContext context, String currentPass, String newPass) async {
    final sm = ScaffoldMessenger.of(context);

    state = state.copiedWithIsLoading(true);
    final res =
        await _authenticator!.changePassword(context, currentPass, newPass);
    if (context.mounted) {
      if (res) {
        Navigator.pop(context);
        Navigator.pop(context);
        sm.showSnackBar(
          const SnackBar(
            content: Text('Password Changed Successfully'),
          ),
        );
      }
    }

    state = state.copiedWithIsLoading(false);
  }

  Future<void> logOut() async {
    state = state.copiedWithIsLoading(true);
    await _authenticator!.logOut();
    state = const AuthState.unknown();
  }
}