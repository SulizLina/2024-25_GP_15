import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail, getAuth } from 'firebase/auth';
import { collection, getDocs, where, query } from 'firebase/firestore';
import successImage from '../../images/Sucess.png';
import errorImage from '../../images/Error.png';
import s from "../../css/ForgotPassword.module.css"
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Modal } from 'antd';
import '../../css/CustomModal.css';
import { useLocation } from 'react-router-dom';

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [validationMessages, setValidationMessages] = useState({ emailError: '' });
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupImage, setPopupImage] = useState('');
  const [canRequestAgain, setCanRequestAgain] = useState(true); // Track if the user can request again
  const [timer, setTimer] = useState(60); // Timer for 1 minute
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get('role'); // Retrieve the role parameter

  function validEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // Real-time validation
    if (!validEmail(value)) {
      setValidationMessages({ emailError: 'Please enter a valid email.' });
    } else {
      setValidationMessages({ emailError: '' }); // Clear error if valid
    }
  };

  const handleResetPassword = async () => {
    if (!validEmail(email) || !canRequestAgain) {
      return; // Prevent submission if invalid or if timer is active
    }

    try {
      if (role === 'employer') {
      const q = query(collection(db, 'Employer'), where('CompanyEmail', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setValidationMessages({ emailError: 'The email is invalid' });
      } else {
        const auth = getAuth();
        await sendPasswordResetEmail(auth, email);
        setPopupVisible(true);
        setPopupImage(successImage);
        setPopupMessage("Password reset email sent!");

        // Start the timer
        setCanRequestAgain(false);
        setTimer(60);
      }}
      else  if (role === 'gdt') {
        const q = query(collection(db, 'GDT'), where('GDTEmail', '==', email));
        const querySnapshot = await getDocs(q);
  
        if (querySnapshot.empty) {
          setValidationMessages({ emailError: 'The email is invalid' });
        } else {
          const auth = getAuth();
          await sendPasswordResetEmail(auth, email);
          setPopupVisible(true);
          setPopupImage(successImage);
          setPopupMessage("Password reset email sent!");
  
          // Start the timer
          setCanRequestAgain(false);
          setTimer(60);
        }

      }
    } catch (error) {
      setPopupMessage('Failed to verify email. Please try again.');
      setPopupImage(errorImage);
      setPopupVisible(true);
    }
  };

  useEffect(() => {
    let interval;
    if (!canRequestAgain && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            setCanRequestAgain(true); // Allow requesting again
            clearInterval(interval); // Clear the interval
            return 0;
          }
          return prevTimer - 1; // Decrement timer
        });
      }, 1000);
    }
    return () => clearInterval(interval); // Clean up
  }, [canRequestAgain, timer]);

  return (
    <div className={s.container}>
      <div className={s.inner}>
        <h1 className={s.title}>Forgot Password?</h1>
        <p className={s.info}>
          Don't worry! It occurs. Please enter your email that is linked with your account.
        </p>
        <label style={{ visibility: "hidden" }}>
          Enter your email
        </label>

        <input
          className={s.email}
          type="email"
          value={email}
          placeholder="Enter your email"
          onChange={handleEmailChange}
          style={{ borderColor: validationMessages.emailError ? 'red' : 'green' }}
        />

        {validationMessages.emailError && (
          <p style={{ color: 'red', textAlign: 'left', marginLeft: '90px' }}>{validationMessages.emailError}</p>
        )}
        <br/><br/>
        {!canRequestAgain && (
          <p style={{ color: '#059855', textAlign: 'center'}}>
            You can request again in {timer} seconds.
          </p>
        )}
        <button 
          className={s.sendBtn}
          onClick={handleResetPassword} 
          disabled={!canRequestAgain} // Disable button if not allowed
          style={{ cursor: 'pointer', opacity: canRequestAgain ? 1 : 0.5 }} // Change opacity
        >
          Send Reset Email
        </button>
        <br/>
        <a style={{ textDecoration: 'underline', color: '#059855', marginLeft:'-10px', cursor:'pointer' }} onClick={() => navigate('/')}>Go to Log in</a>
       

      </div>

      {popupVisible && (
    <Modal
    visible={popupVisible}
    onCancel={() => setPopupVisible(false)}
    footer={<p style={{textAlign:'center'}}>{popupMessage}</p>}
    style={{ top: '38%' }}
    bodyStyle={{ textAlign: 'center' }}
    className="custom-modal" 
    closeIcon={
      <span className="custom-modal-close-icon">
        ×
      </span>
    }
  >
    <img src={popupImage} alt="Popup" style={{ width: '20%', marginBottom: '16px' }} />
    
  </Modal>
      )}
    </div>
  );
};

export default ForgetPassword;