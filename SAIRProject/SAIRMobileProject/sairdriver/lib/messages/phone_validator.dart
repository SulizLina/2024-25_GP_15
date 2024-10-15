String? validatePhoneNumber(String? value) {
  if (value == null || value.isEmpty) {
    return 'Please enter your phone number';
  } 
  // Regular expression to match phone numbers starting with country code (e.g., +966) and containing digits only
  else if (!RegExp(r'^\+966\d{9}$').hasMatch(value)) { 
    return 'Phone number must start with +966 and be followed\nby 9 digits.';
  }
  return null;
}
