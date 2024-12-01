import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import emailjs from 'emailjs-com';
import { db, auth } from '../firebase';
import {
  Button,
  message,
} from 'antd';
import successImage from '../images/Sucess.png';
import errorImage from '../images/Error.png';
import { useNavigate } from 'react-router-dom';
import { generateRandomPassword } from '../utils/common';
import {Modal} from 'antd';
import Header from './Header';
import s from "../css/Profile.module.css";
import '../css/CustomModal.css';

const AddDriver = () => {
  const navigate = useNavigate();
  const [availableMotorcycles, setAvailableMotorcycles] = useState([]);
  const [Employer, setEmployer] = useState({ CompanyName: '' });
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupImage, setPopupImage] = useState('');
  const [validationMessages, setValidationMessages] = useState({
    Fname: '',
    Lname: '',
    PhoneNumber: '',
    Email: '',
    DriverID: '',
    GPSnumber: ''
  });

  const [driver, setDriver] = useState({
    Fname: '',
    Lname: '',
    PhoneNumber: '',
    Email: '',
    DriverID: '',
    GPSnumber: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDriver(prev => ({
      ...prev,
      [name]: value
    }));

    // Remove validation message for the field being edited
    setValidationMessages((prev) => ({
      ...prev,
      [name]: ''
    }));

    // Real-time validation for email and driver ID
    if (name === 'Email') {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value)) {
        setValidationMessages((prev) => ({
          ...prev,
          Email: 'Please enter a valid Email'
        }));
      }
    }

    if (name === 'DriverID') {
      if (value.length !== 0 && value.length !== 10) {
        setValidationMessages((prev) => ({
          ...prev,
          DriverID: 'Driver ID must be 10 digits'
        }));
      } else {
        setValidationMessages((prev) => ({
          ...prev,
          DriverID: ''
        }));
      }
    }
  };

  

  const handlePhoneNumberChange = (e) => {
    let newPhoneNumber = e.target.value;
    
    // Remove all +966 prefixes and leading zeros
    newPhoneNumber = newPhoneNumber.replace(/\+966/g, '').replace(/^0+/, '');
    
    // If there's content, add single +966 prefix
    if (newPhoneNumber) {
      // Find first occurrence of 5
      const indexOfFive = newPhoneNumber.indexOf('5');
      if (indexOfFive !== -1) {
        // Keep only the part starting with 5
        newPhoneNumber = '+966' + newPhoneNumber.substring(indexOfFive);
      } else {
        newPhoneNumber = '+966' + newPhoneNumber;
      }
    }
  
    setDriver(prev => ({
      ...prev,
      PhoneNumber: newPhoneNumber
    }));
  
    // Validate phone number
    let phoneError = '';
    if (newPhoneNumber.length > 4) {
      const validationResult = validatePhoneNumber(newPhoneNumber);
      if (validationResult === '' || validationResult === '0') {
        phoneError = '';
      } else {
        phoneError = validationResult;
      }
    }
  
    setValidationMessages((prev) => ({
      ...prev,
      PhoneNumber: phoneError
    }));
  };

  useEffect(() => {
    const employerUID = sessionStorage.getItem('employerUID');
    const fetchEmployer = async () => {
      const docRef = doc(db, 'Employer', employerUID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEmployer(data);
      } else {
        message.error('Employer not found');
      }
    };
    fetchEmployer();
  }, []);

  useEffect(() => {
    const fetchMotorcycles = async () => {
      if (Employer.CompanyName) {
        const motorcycleQuery = query(
          collection(db, 'Motorcycle'),
          where('CompanyName', '==', Employer.CompanyName),
          where('available', '==', true)
        );
        const unsubscribe = onSnapshot(motorcycleQuery, (snapshot) => {
          const bikes = snapshot.docs.map((doc) => ({
            id: doc.id,
            GPSnumber: doc.data().GPSnumber,
          }));
          setAvailableMotorcycles(bikes);
        });
        return () => unsubscribe();
      }
    };
    fetchMotorcycles();
  }, [Employer]);

  const handleAddDriver = async (values) => {
    try {
      const formattedPhoneNumber = `${values.PhoneNumber}`;
      const GPSnumber = values.GPSnumber === "None" ? null : values.GPSnumber;

      const phoneQuery = query(
        collection(db, 'Driver'),
        where('PhoneNumber', '==', formattedPhoneNumber),
        where('CompanyName', '==', Employer.CompanyName)
      );
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        setPopupMessage("The Phone number is already used. Please use a new number.");
        setPopupImage(errorImage);
        setPopupVisible(true);
        return;
      }

      const driverIdQuery = query(
        collection(db, 'Driver'),
        where('DriverID', '==', values.DriverID),
        where('CompanyName', '==', Employer.CompanyName)
      );
      const driverIdSnapshot = await getDocs(driverIdQuery);
      if (!driverIdSnapshot.empty) {
        setPopupMessage("Driver ID already exists.");
        setPopupImage(errorImage);
        setPopupVisible(true);
        return;
      }

      const generatedPassword = generateRandomPassword();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.Email,
        generatedPassword
      );

      const user = userCredential.user;
      const newDriver = {
        ...values,
        PhoneNumber: formattedPhoneNumber,
        GPSnumber: GPSnumber,
        CompanyName: Employer.CompanyName,
        isDefaultPassword: true,
        available: GPSnumber === null,
        UID: user.uid
      };

      await addDoc(collection(db, 'Driver'), newDriver);

      if (GPSnumber) {
        const q = query(
          collection(db, 'Motorcycle'),
          where('GPSnumber', '==', GPSnumber)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const motorcycleDocRef = querySnapshot.docs[0].ref;
          await updateDoc(motorcycleDocRef, {
            available: false,
            DriverID: values.DriverID
          });
        }
      }


      // Send Welcome Registration email
      const templateParams = {
        email: values.Email,
        subject: 'Welcome to SAIR!',
        companyName: Employer.ShortCompanyName,
        generatedPassword: generatedPassword,
      };
  
      const response = await emailjs.send(
        'service_ltz361p',
        'template_u0v3anh',
        templateParams,
        '6NEdVNsgOnsmX-H4s'
      );
  
      if (response.status === 200) {
        setPopupMessage('Driver added successfully!');
        setPopupImage(successImage);
      } else {
        setPopupMessage('Error adding driver');
        setPopupImage(errorImage);
      }
  
      setPopupVisible(true);

      setPopupVisible(true);

      setTimeout(() => {
        navigate('/driverslist'); // Adjust the path as needed
      }, 2000);
      
    } catch (error) {
      console.error('Error adding driver:', error);
      setPopupMessage("Driver Email Already exist.");
      setPopupVisible(true);
      setPopupImage(errorImage);
    }
  };



  const validatePhoneNumber = (PhoneNumber) => {
    const phoneRegex = /^\+9665\d{8}$/;
    const phoneRegex1 = /^\+96605\d{8}$/;
    if (phoneRegex.test(PhoneNumber) || phoneRegex1.test(PhoneNumber)) {
      return null;
    } 
    return 'Phone number must start with +9665 and be followed by 8 digits.';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { Fname, Lname, PhoneNumber, Email, DriverID } = driver;

    // Validate the form
    let isValid = true;
    const newValidationMessages = {}

    if (!Fname) {
      newValidationMessages.Fname = 'Please enter driver first name.';
      isValid = false;
    }

    if (!Lname) {
      newValidationMessages.Lname = 'Please enter driver last name.';
      isValid = false;
    }

    // Phone number validation only checks for emptiness here
    if (!PhoneNumber ||PhoneNumber == '+966') {
      newValidationMessages.PhoneNumber = 'Please enter driver phone number';
      isValid = false;
    } else {
      const phoneValidation = validatePhoneNumber(PhoneNumber);
      if (phoneValidation) {
        newValidationMessages.PhoneNumber = phoneValidation;
        isValid = false;
      }
    }

    if (!Email) {
      newValidationMessages.Email = 'Please enter Email';
      isValid = false;
    }

    if (!DriverID) {
      newValidationMessages.DriverID = 'Please enter driver ID';
      isValid = false;
    } else if (DriverID.length !== 10) {
      newValidationMessages.DriverID = 'Driver ID must be 10 digits';
      isValid = false;
    }

    if (driver.GPSnumber === "" ) {
      newValidationMessages.GPSnumber = 'Please choose a motorcycle';
      isValid = false;
    }


    setValidationMessages(newValidationMessages);

    if (isValid) {
      handleAddDriver(driver);
    }
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
  };

  return (
    <div>
      <Header active="driverslist" />
      <div className="breadcrumb">
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/driverslist')}>Drivers List</a>
        <span> / </span>
        <a onClick={() => navigate('/add-driver')}>Add Driver</a>
      </div>

      <main className={s.container}>
        <h2 className='title'>Add Driver</h2>
        <form onSubmit={handleSubmit}>
          <div className={s.formRow}>
            <div>
              <label>First Name</label>
              <input
                type="text"
                name="Fname"
                value={driver.Fname}
                onChange={handleInputChange}
              />
              {validationMessages.Fname && <p className={s.valdationMessage}>{validationMessages.Fname}</p>}
            </div>

            <div>
              <label>Last Name</label>
              <input
                type="text"
                name="Lname"
                value={driver.Lname}
                onChange={handleInputChange}
              />
              {validationMessages.Lname && <p className={s.valdationMessage}>{validationMessages.Lname}</p>}
            </div>
          </div>
          <div className={s.formRow}>
            <div>
              <label>Phone Number</label>
              <input 
                name="PhoneNumber" 
                value={driver.PhoneNumber}
                placeholder="+966" 
                onChange={handlePhoneNumberChange}  
              />
              {validationMessages.PhoneNumber && <p className={s.valdationMessage}>{validationMessages.PhoneNumber}</p>}
            </div>
            <div>
              <label>Email</label>
              <input 
                name="Email"
                value={driver.Email}
                onChange={handleInputChange}
              />
              {validationMessages.Email && <p className={s.valdationMessage}>{validationMessages.Email}</p>}
            </div>
          </div>
          <div className={s.formRow}>
            <div>
              <label>Driver ID (National ID / Residency Number)</label>
              <input
                type="text"
                name="DriverID"
                maxLength={10}
                value={driver.DriverID}
                onChange={handleInputChange}
              />
              {validationMessages.DriverID && <p className={s.valdationMessage}>{validationMessages.DriverID}</p>}
            </div>
            <div>
              <label>GPS Number</label>
              <select
  name="GPSnumber"
  value={driver.GPSnumber}
  onChange={handleInputChange}
>
  <option value="" disabled>Select a Motorcycle</option>
  <option value="None">None</option>
  {availableMotorcycles.length > 0 ? (
    availableMotorcycles.map((item) => (
      <option key={item.id} value={item.GPSnumber}>
        {item.GPSnumber}
      </option>
    ))
  ) : (
    <option disabled>No motorcycles available</option>
  )}
</select>
              {validationMessages.GPSnumber && <p className={s.valdationMessage}>{validationMessages.GPSnumber}</p>}
            </div>
          </div>

          <div> 
            <button type="submit" className={s.editBtn}>
              Add Driver
            </button> 
          </div>
        </form>
      </main>

      {popupVisible && (
  <Modal
    title={null} // No title for this image notification
    visible={popupVisible}
    onCancel={handleClosePopup}
    footer={<p style={{ textAlign:'center'}}>{popupMessage}</p>}
    style={{ top: '38%' }} // Center the modal vertically
    className="custom-modal" 
    closeIcon={
      <span className="custom-modal-close-icon">
        ×
      </span>
    }
  >
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <img src={popupImage} alt="Popup" style={{ width: '20%', marginBottom: '16px' }} />
      
    </div>
  </Modal>
)}
    </div>
  );
};

export default AddDriver;