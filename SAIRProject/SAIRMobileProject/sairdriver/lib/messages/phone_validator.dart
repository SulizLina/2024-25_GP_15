String? validatePhoneNumber(String? value) {
  if (value == null || value.isEmpty ||value=="+966" ) {
    return 'Please enter your phone number';
  } 
  // Clean the phone number before validation
  String cleanedNumber = cleanPhoneNumber(value);

  // Validate cleaned number using regex (exactly 9 digits after +966)
  if (!RegExp(r'^\+9665\d{8}$').hasMatch(cleanedNumber)) {
    return 'Phone number must start with +9665 and be followed\nby 9 digits.';
  }
  return null;
}

// Helper function to clean phone number by removing leading zero after +966
String cleanPhoneNumber(String phoneNumber) {
  if (phoneNumber.startsWith("+9660")) {
    return "+966" + phoneNumber.substring(5); // Remove the '0' after +966
  }
  return phoneNumber; // Return unchanged if no leading zero
}
