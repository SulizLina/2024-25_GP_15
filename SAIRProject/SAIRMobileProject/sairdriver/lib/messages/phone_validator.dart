String? validatePhoneNumber(String? value) {
  if (value == null || value.isEmpty) {
    return 'Please enter your phone number';
  } 
  // Regular expression to match phone numbers starting with country code (e.g., +966) and containing digits only
  else if (!RegExp(r'^\+9665\d{8}$').hasMatch(value)) { 
    return 'Enter a valid phone number with country code \n (e.g., +966XXXXXXXXX)';
  }
  return null;
}
