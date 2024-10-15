String? validatePhoneNumber(String? value) {
  if (value == null || value.isEmpty) {
    return 'Please enter your phone number';
  } 
  // Regular expression to match phone numbers starting with country code (e.g., +966) and containing digits only
  else if (!RegExp(r'^\+966\d{9}$').hasMatch(value)) { 
    return 'Invalid phone number it must start with +966 and be followed by 9 digits';
  }
  return null;
}
