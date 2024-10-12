import 'dart:convert';

class UserState {
  final String driverId;
  final String fname;
  final String gpsNumber;
  final String lname;
  final String phoneNumber;

  UserState({
    required this.driverId,
    required this.fname,
    required this.gpsNumber,
    required this.lname,
    required this.phoneNumber,
  });

  UserState copyWith({
    String? driverId,
    String? fname,
    String? gpsNumber,
    String? lname,
    String? phoneNumber,
  }) {
    return UserState(
      driverId: driverId ?? this.driverId,
      fname: fname ?? this.fname,
      gpsNumber: gpsNumber ?? this.gpsNumber,
      lname: lname ?? this.lname,
      phoneNumber: phoneNumber ?? this.phoneNumber,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'DriverID': driverId,
      'Fname': fname,
      'GPSnumber': gpsNumber,
      'Lname': lname,
      'PhoneNumber': phoneNumber,
    };
  }

  factory UserState.fromMap(Map<String, dynamic> map) {
    return UserState(
      driverId: map['DriverID'] ?? '',
      fname: map['Fname'] ?? '',
      gpsNumber: map['GPSnumber'] ?? '',
      lname: map['Lname'] ?? '',
      phoneNumber: map['PhoneNumber'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory UserState.fromJson(String source) =>
      UserState.fromMap(json.decode(source));

  @override
  String toString() {
    return 'UserState(driverId: $driverId, fname: $fname, gpsNumber: $gpsNumber, lname: $lname, phoneNumber: $phoneNumber)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is UserState &&
        other.driverId == driverId &&
        other.fname == fname &&
        other.gpsNumber == gpsNumber &&
        other.lname == lname &&
        other.phoneNumber == phoneNumber;
  }

  @override
  int get hashCode {
    return driverId.hashCode ^
        fname.hashCode ^
        gpsNumber.hashCode ^
        lname.hashCode ^
        phoneNumber.hashCode;
  }
}