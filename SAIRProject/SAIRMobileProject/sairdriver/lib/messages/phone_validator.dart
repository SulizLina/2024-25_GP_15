String? validatePhoneNumber(String? value) {
  if (value == null || value.isEmpty || value == "+966") {
    return 'Please enter your phone number';
  }

  // Remove the leading zero after +966, if present
  String cleanedNumber = value.startsWith("+9660")
      ? "+966" + value.substring(5)
      : value;

  // Validate using regex: starts with +9665 and has 9 digits
  if (!RegExp(r'^\+9665\d{8}$').hasMatch(cleanedNumber)) {
    return 'Phone number must start with +9665 and be followed\nby 9 digits.';
  }

  return null; // Return null if the number is valid
}

// Helper function to clean phone number by removing leading zero after +966
String cleanPhoneNumber(String phoneNumber) {
  if (phoneNumber.startsWith("+9660")) {
    return "+966" + phoneNumber.substring(5); // Remove the '0' after +966
  }
  return phoneNumber; // Return unchanged if no leading zero
}
