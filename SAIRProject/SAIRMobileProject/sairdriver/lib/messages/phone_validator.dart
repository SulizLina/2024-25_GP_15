String? validatePhoneNumber(String? value) {
  if (value == null || value.isEmpty) {
    return 'Please enter your phone number';
  } else if (value.length != 10) {
    return 'The phone number must be 10 digits long';
  } else if (!RegExp(r'^[0-9]+$').hasMatch(value)) {
    return 'Please enter a valid phone number';
  }
  return null;
}
