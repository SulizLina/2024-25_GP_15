import React, { useState } from 'react';
import { db, auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { doc, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import successImage from '../../images/Sucess.png';
import errorImage from '../../images/Error.png';
import backgroundImage from '../../images/sairbackground.png';

import { getDocs, query, collection, where } from 'firebase/firestore';
import '@fortawesome/fontawesome-free/css/all.min.css';

import s from '../../css/Signup.module.css';

const SignUp = () => {
  const [user, setUser] = useState({
    commercialNumber: '',
    PhoneNumber: '',
    CompanyName: '',
    CompanyEmail: '',
    Password: '',
    confirmPassword: '',
    confirmPasswordError: '',
  });
  const [validationMessages, setValidationMessages] = useState({
    phoneError: '',
    commercialNumberError: '',
    emailError: '',
    passwordError: '',
    emailperError: '',

  });
  const [loading, setLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupImage, setPopupImage] = useState('');
  const [showConfirmNewPassword, setshowConfirmNewPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+966');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
    // Validation for the confirmation password
    if (name === 'confirmPassword') {
      const confirmPasswordError = value !== user.Password ? 'Passwords do not match.' : '';
      setValidationMessages((prev) => ({
        ...prev,
        confirmPasswordError: confirmPasswordError,
      }));
    }
    if (name === 'commercialNumber') {
      const commercialNumberError = validateCommercialNumber(value);
      setValidationMessages((prev) => ({
        ...prev,
        commercialNumberError: value === '' ? '' : commercialNumberError,
      }));
    } else if (name === 'CompanyEmail') {
      const emailError = validateEmail(value);
      setValidationMessages((prev) => ({
        ...prev,
        emailError: value === '' ? '' : emailError,
      }));
    }

    if (name === 'Password') {
      // Check password requirements
      setPasswordRequirements({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    } else if (value.trim() === '') {
      setValidationMessages((prev) => ({ ...prev, [`${name}Error`]: '' }));
    }
  };

  const togglePasswordVisibility = (type) => {
    if (type === 'new') {
      setShowPassword(!showPassword);
    } else if (type === 'confirm') {
      setshowConfirmNewPassword(!showConfirmNewPassword);
    }
  };

  const handlePhoneNumberChange = (e) => {
    console.log(e.target.value);
    let newPhoneNumber = e.target.value;
    if (newPhoneNumber.startsWith('+966')) {

      setUser({ ...user, PhoneNumber: newPhoneNumber }); // Store only the digits

    }
    else {
      newPhoneNumber = '+966' + newPhoneNumber.slice(3);


      setUser({ ...user, PhoneNumber: newPhoneNumber }); // Store only the digits
    }


    // Only validate if there is more than just the prefix ('+966')
    // const phoneError = newPhoneNumber !== '+966' ? validatePhoneNumber(newPhoneNumber) : '';
    let phoneError = '';
    if (newPhoneNumber.length > 4) {
      if (validatePhoneNumber(newPhoneNumber) === '') {
        phoneError = '';
      }
      else if (validatePhoneNumber(newPhoneNumber) === '0') {
        phoneError = '';
        var str = newPhoneNumber + "";
        str = str.substring(str.indexOf('5'));
        var st = '+966' + str;
        setUser({ ...user, PhoneNumber: st });

      }
      else {
        phoneError = validatePhoneNumber(newPhoneNumber);
      }

    }
    setValidationMessages((prev) => ({
      ...prev,
      phoneError: phoneError
    }));
  };

  const handleFocus = (e) => {
    e.target.setSelectionRange(user.PhoneNumber.length, user.PhoneNumber.length);
  };


  const handleClick = (e) => {
    // If the user clicks inside the input, ensure the cursor stays after the prefix
    if (e.target.selectionStart < 4) {
      e.target.setSelectionRange(user.PhoneNumber.length, user.PhoneNumber.length);
    }
  };

  const validatePhoneNumber = (phoneNumber) => {
    const phoneRegex = /^\+9665\d{8}$/; // Example for a specific format
    const phoneRegex1 = /^\+96605\d{8}$/; // Example for a specific format
    if (phoneRegex.test(phoneNumber)) {
      return '';
    }
    else if (phoneRegex1.test(phoneNumber)) {
      return '0';
    }
    else {
      return 'Phone number must start with +9665 and be followed by 8 digits.';
    }
  };

  const validateCommercialNumber = (number) => {
    const numberRegex = /^\d{10}$/; // Exactly 10 digits
    return numberRegex.test(number) ? '' : 'Commercial number must be exactly 10 digits long.';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format
    return emailRegex.test(email) ? '' : 'Please enter a valid email address.';
  };


  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setValidationMessages((prev) => ({ ...prev, confirmPasswordError: '' }));

    // Check if passwords match
    if (user.Password !== user.confirmPassword) {
      setValidationMessages((prev) => ({
        ...prev,
        confirmPasswordError: 'Passwords do not match.',
      }));
      setLoading(false);
      return;
    }

    if (
      !passwordRequirements.length ||
      !passwordRequirements.uppercase ||
      !passwordRequirements.lowercase ||
      !passwordRequirements.number ||
      !passwordRequirements.special
    ) {
      setValidationMessages((prev) => ({
        ...prev,
        passwordError: 'Password does not meet the requirements.',
      }));
      setLoading(false);
      return;
    }


    try {
      // Check if the commercialNumber already exists
      const existingUserQuery = await getDocs(query(collection(db, 'Employer'), where('commercialNumber', '==', user.commercialNumber)));

      if (!existingUserQuery.empty) {
        setPopupMessage("The commercial number is already used. Please use a correct number.");
        setPopupImage(errorImage);
        setPopupVisible(true);
        setLoading(false);
        return; // Prevent sign-up if commercial number exists
      }

      const existingUserQuery1 = await getDocs(query(collection(db, 'Employer'), where('PhoneNumber', '==', user.PhoneNumber)));

      if (!existingUserQuery1.empty) {
        setPopupMessage("The phone number is already used. Please use a correct number.");
        setPopupImage(errorImage);
        setPopupVisible(true);
        setLoading(false);
        return; // Prevent sign-up if commercial number exists
      }

      // Create user with Firebase Authentication using email
      const userCredential = await createUserWithEmailAndPassword(auth, `${user.CompanyEmail}`, user.Password);
      const newUser = userCredential.user;

      // Send email verification
      await sendEmailVerification(newUser);


      // Add user data to Firestore
      await addDoc(collection(db, 'Employer'), {
        commercialNumber: user.commercialNumber,
        PhoneNumber: user.PhoneNumber,
        CompanyName: user.CompanyName,
        CompanyEmail: user.CompanyEmail,
        uid: newUser.uid,
      });

      // Inform the user to check their email for verification
      setPopupMessage("You have successfully signed up! Please verify your email before logging in.");
      setPopupImage(successImage);
      setPopupVisible(true);
      setTimeout(() => {
        setPopupVisible(false);
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Error signing up:', error);
      if (error.code === 'auth/email-already-in-use') {
        setPopupMessage('The company email is already used. Please use a different email.');
      } else {
        setPopupMessage('Signup failed. Please try again.');
      }
      setPopupImage(errorImage);
      setPopupVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
  };


  const getBorderColor = (field) => {
    if (field === 'Password') {
      return validationMessages.passwordError ? 'red' : !validationMessages.passwordError && user.Password ? 'green' : '';
    } else if (field === 'PhoneNumber') {
      return validationMessages.phoneError ? 'red' : !validationMessages.phoneError && user.PhoneNumber ? 'green' : '';
    } else if (field === 'confirmPassword') {
      return validationMessages.confirmPasswordError ? 'red' : user.confirmPassword ? 'green' : '';
    } else if (field === 'CompanyEmail') {
      return validationMessages.emailError ? 'red' : !validationMessages.emailError && user.CompanyEmail ? 'green' : '';
    } else if (field === 'commercialNumber') {
      return validationMessages.commercialNumberError ? 'red' : !validationMessages.commercialNumberError && user.commercialNumber ? 'green' : '';
    } else {
      return validationMessages[`${field}Error`] ? 'red' : !validationMessages[`${field}Error`] && user[field] ? 'green' : '';
    }
  };



  return (

    <div
      className={s.loginContainer}
    >
      <div >
        <img
          src={backgroundImage}
          alt='Top Right'
          className={s.rightImage}
        />
      </div>
      <div >
        <h1 style={{ marginTop: '40px', fontWeight: "bold" }}>Welcome to SAIR! </h1>
        <p style={{ fontSize: '30px', color: '#059855', marginTop: '6px', marginBottom: "20px" }}>
          Your easy solution for managing <br />delivery drivers.
        </p>



        <form
          className={s.formContainer}
          onSubmit={handleSignUp}
        >
          <div className={s.profileField}>
            <label>Commercial Number</label>
            <input
              type="text"
              name="commercialNumber"
              value={user.commercialNumber}
              onChange={handleChange}

              required
              style={{ borderColor: getBorderColor('commercialNumber') }}
            />
            {validationMessages.commercialNumberError && <p style={{ color: 'red', marginLeft: '22px' }}>{validationMessages.commercialNumberError}</p>}
          </div>

          <div className={s.profileField}>
            <label>Company Name</label>
            <input
              type="text"
              name="CompanyName"
              value={user.CompanyName}
              onChange={handleChange}
              required
              style={{ borderColor: getBorderColor('CompanyName') }}
            />
          </div>
          <div className={s.profileField}>
            <label>Company Email</label>
            <input
              type="email"
              name="CompanyEmail"
              value={user.CompanyEmail}
              onChange={handleChange}
              required
              style={{ borderColor: getBorderColor('CompanyEmail') }}
            />
            {validationMessages.emailError && <p style={{ color: 'red', marginLeft: '22px' }}>{validationMessages.emailError}</p>}

          </div>
          <div className={s.profileField}>
            <label>Phone Number</label>
            <input
              type="tel"
              name="PhoneNumber"
              placeholder='+966'
              value={`${user.PhoneNumber}`}
              onChange={handlePhoneNumberChange}
              pattern="\+9665\d{8}"
              required
              style={{ borderColor: getBorderColor('PhoneNumber') }}
            />
            {validationMessages.phoneError && <p style={{ color: 'red', marginLeft: '22px' }}>{validationMessages.phoneError}</p>}
          </div>

          <div style={{ position: 'relative' }} className={`${s.profileField} ${s.passwordContainer}`}>
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="Password"
              value={user.Password}
              onChange={handleChange}
              required
              style={{ borderColor: getBorderColor('Password'), paddingRight: '30px' }}
            />

            <span
              onClick={() => togglePasswordVisibility('new')}
              className={s.passwordVisibilityToggle}
               
            >
              <i className={showPassword ? 'far fa-eye' : 'far fa-eye-slash'}></i>
            </span></div>
          <div  >
            <ul style={{ marginLeft: '45px' }}>
              <li style={{ color: passwordRequirements.length ? '#059855' : 'red' }}>
                At least 8 characters
              </li>
              <li style={{ color: passwordRequirements.uppercase ? '#059855' : 'red' }}>
                At least one uppercase letter
              </li>
              <li style={{ color: passwordRequirements.lowercase ? '#059855' : 'red' }}>
                At least one lowercase letter
              </li>
              <li style={{ color: passwordRequirements.number ? '#059855' : 'red' }}>
                At least one number
              </li>
              <li style={{ color: passwordRequirements.special ? '#059855' : 'red' }}>
                At least one special character
              </li>
            </ul>
          </div>
          <div style={{ position: 'relative' }} className={`${s.profileField} ${s.passwordContainer}`}>
            <label >Confirm Password</label>
            <input
              type={showConfirmNewPassword ? "text" : "password"}
              name="confirmPassword"
              value={user.confirmPassword}
              onChange={handleChange}
              required
              style={{ borderColor: getBorderColor('confirmPassword') }}
            />
            <span
              onClick={() => togglePasswordVisibility('confirm')}
              className={s.passwordVisibilityToggle}

            >
              <i className={showConfirmNewPassword ? 'far fa-eye' : 'far fa-eye-slash'}></i>
            </span>
            {validationMessages.confirmPasswordError && <p style={{ color: 'red', marginLeft: '22px' }}>{validationMessages.confirmPasswordError}</p>}
          </div>
          <div style={{ marginTop: '20px', textAlign: 'center', position: 'relative' }}>
            <a
              id={s.loginLink}
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer', color: '#059855', textDecoration: 'underline', marginTop: '10px' }}
            >
              Already have a company account? Log in here
            </a> <br />

            <button className={s.submitButton} type="submit" style={{ marginBottom: '15px' }}>
              Sign up
            </button>


          </div>
        </form>

        {popupVisible && (
          <div className="popup">
            <button className="close-btn" onClick={handleClosePopup}>×</button>
            <img src={popupImage} alt="Popup" />
            <p>{popupMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;