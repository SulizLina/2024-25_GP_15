import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, query, collection, where, onSnapshot, getDocs, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Form, Input, Button, notification, Card, Row, Col, Select, Menu, Dropdown, Modal } from 'antd';
import successImage from '../images/Sucess.png';
import errorImage from '../images/Error.png';
import SAIRLogo from '../images/SAIRlogo.png';
import logoutIcon from '../images/logout.png';
import { UserOutlined, DownOutlined } from '@ant-design/icons';
import Header from './Header';
import '../css/CustomModal.css';

import s from '../css/Profile.module.css';
import { Option } from 'antd/es/mentions';

const EditDriver = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [driverData, setDriverData] = useState(null);
  const [oldDriverData, setOldDriverData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableMotorcycles, setAvailableMotorcycles] = useState([]);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [originalDriverID, setOriginalDriverID] = useState('');
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState('');
  const timerRef = useRef(null); // Ref to store the timer ID
  const [companyName, setCompanyName] = useState('');
  const [phoneValidationMessage, setPhoneValidationMessage] = useState('');

  // Update state structure to match AddDriver
  const [validationMessages, setValidationMessages] = useState({
    Fname: '',
    Lname: '',
    PhoneNumber: '',
    Email: '',
    DriverID: '',
    GPSnumber: ''
  });

  const employerUID = sessionStorage.getItem('employerUID');
  // Fetch the driver's data based on driverId
  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const driverDocRef = doc(db, 'Driver', driverId);
        const driverDoc = await getDoc(driverDocRef);
        if (driverDoc.exists()) {
          const driverData = driverDoc.data();
          const companyName = await fetchCompanyName(employerUID);

          console.log('Driver data:', driverData);

          setDriverData({
            ...driverData,
            CompanyName: companyName, // Include CompanyName
            GPSnumber: driverData.GPSnumber || 'None'
          });

          setOldDriverData({
            ...driverData,
            CompanyName: companyName, // Include CompanyName
            GPSnumber: driverData.GPSnumber || 'None'
          });

          setOriginalDriverID(driverData.DriverID); // Store original Driver ID
          setOriginalPhoneNumber(driverData.PhoneNumber.slice(4)); // Store original Phone Number (without +966)

          // Fetch available motorcycles after driver data is set
          fetchAvailableMotorcycles(companyName);
        } else {
          notification.error({ message: 'Driver not found' });
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
        notification.error({ message: 'Error fetching driver data.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriverData();
  }, [driverId]);

  // Function to fetch company name based on employerUID
  const fetchCompanyName = async (employerUID) => {
    try {
      const companyDocRef = doc(db, 'Employer', employerUID);
      const companyDoc = await getDoc(companyDocRef);
      if (companyDoc.exists()) {
        const data = companyDoc.data();
        return data.CompanyName; // Return the CompanyName field
      } else {
        console.error('No such document!');
        return '';
      }
    } catch (error) {
      console.error('Error fetching company name:', error);
      return '';
    }
  };

  // Fetch available motorcycles based on company name
  const fetchAvailableMotorcycles = async (companyName) => {
    try {
      const motorcycleQuery = query(
        collection(db, 'Motorcycle'),
        where('CompanyName', '==', companyName),
        where('available', '==', true)
      );

      onSnapshot(motorcycleQuery, (snapshot) => {
        const bikes = snapshot.docs.map((doc) => ({
          id: doc.id,
          GPSnumber: doc.data().GPSnumber,
        }));
        setAvailableMotorcycles(bikes);
      });
    } catch (error) {
      console.error('Error fetching motorcycles:', error);
    }
  };

  // Show notification function
  const showNotification = (message, success) => {
    setNotificationMessage(message);
    setIsSuccess(success);
    setIsNotificationVisible(true);
    setTimeout(() => {
      setIsNotificationVisible(false);
    }, 2000);
  };

  // Validate phone number
  const validatePhoneNumber = (PhoneNumber) => {
    const phoneRegex = /^\+9665\d{8}$/;
    const phoneRegex1 = /^\+96605\d{8}$/;
    if (PhoneNumber === '+966') {
      return 'Please enter driver phone number'; // Custom message for exact match
    }
    if (phoneRegex.test(PhoneNumber) || phoneRegex1.test(PhoneNumber)) {
      return null; // Valid phone number
    } else {
      return 'Phone number must start with +9665 and be followed by 8 digits.';
    }
  };


  const handleUpdateDriver = async (values) => {
    const previousGPS = oldDriverData.GPSnumber;
    const newGPS = values.GPSnumber;

    setDriverData(values);
    setOldDriverData(values);

    try {
      // Step 1: Check if DriverID has changed
      if (values.DriverID !== originalDriverID) {
        const driverIdExists = await checkIfDriverIdExists(values.DriverID);
        if (driverIdExists) {
          showNotification('Driver ID already exists.', false);
          return;
        }
        // Update associated violations if DriverID has changed
        await updateViolations(originalDriverID, values.DriverID);
      }

        // Check if PhoneNumber has changed and is unique
    if (values.PhoneNumber !== originalPhoneNumber) {
      const phoneNumberExists = await checkIfPhoneNumberExists(values.PhoneNumber,driverData.UID);
      if (phoneNumberExists) {
        showNotification('The Phone number is already used. Please use a new number.', false);
        return;
      }
    }

      // Step 2: Update the previous motorcycle if it exists
      console.log('previousGPS:', previousGPS, 'newGPS:', newGPS);;
      if (previousGPS && previousGPS !== newGPS) {
        const previousMotorcycleQuery = query(
          collection(db, 'Motorcycle'),
          where('GPSnumber', '==', previousGPS)
        );
        const previousQuerySnapshot = await getDocs(previousMotorcycleQuery);

        if (!previousQuerySnapshot.empty) {
          const previousMotorcycleDocRef = previousQuerySnapshot.docs[0].ref;
          await updateDoc(previousMotorcycleDocRef, {
            DriverID: null, // Unassign the driver
            available: true // Set it to available
          });
          console.log(`Updated Motorcycle with GPS ${previousGPS} to available and unassigned.`);
        } else {
          console.error(`No motorcycle found with GPS number: ${previousGPS}`);
        }
      }

      // Step 3: Update the new motorcycle if it exists
      if (newGPS && newGPS !== "None") {
        const motorcycleQuery = query(
          collection(db, 'Motorcycle'),
          where('GPSnumber', '==', newGPS)
        );
        const querySnapshot = await getDocs(motorcycleQuery);

        if (!querySnapshot.empty) {
          const motorcycleDocRef = querySnapshot.docs[0].ref;
          await updateDoc(motorcycleDocRef, {
            DriverID: values.DriverID, // Assign the new driver
            available: false // Mark as not available
          });
          console.log(`Assigned Motorcycle with GPS ${newGPS} to Driver ${values.DriverID}.`);
        } else {
          console.error(`No motorcycle found with GPS number: ${newGPS}`);
        }
      }

      // Step 4: Update the driver document
      const driversRef = collection(db, "Driver");
      const driverQuery = query(driversRef, where("UID", "==", driverData.UID));

      const updatedData = {
        ...driverData,
        ...values,
        PhoneNumber: values.PhoneNumber.startsWith('+966') ? values.PhoneNumber : `+966${values.PhoneNumber}`,
        GPSnumber: newGPS === 'None' ? null : newGPS,
        available:newGPS === 'None' ? true : false
      };      
      const querySnapshot = await getDocs(driverQuery);

      const driverDocRef = querySnapshot.docs[0].ref;


      await updateDoc(driverDocRef, updatedData);
      showNotification("Driver updated successfully!", true);

      // Redirect to Driver List after a short delay
      setTimeout(() => {
        navigate('/driverslist');
      }, 5000);
    } catch (error) {
      console.error('Error updating driver:', error);
      showNotification(`Error updating driver: ${error.message}`, false);
    }
  };


  // Function to update violations when DriverID changes
  const updateViolations = async (oldDriverID, newDriverID) => {
    const violationCollection = collection(db, 'Violation');
    const violationQuery = query(violationCollection, where('driverID', '==', oldDriverID));

    const querySnapshot = await getDocs(violationQuery);
    const updatePromises = querySnapshot.docs.map(doc => {
      const violationRef = doc.ref;
      return setDoc(violationRef, { driverID: newDriverID }, { merge: true });
    });

    await Promise.all(updatePromises);
    console.log(`Updated driverID from ${oldDriverID} to ${newDriverID} in violations.`);
  };

  // Function to check if DriverID exists
  const checkIfDriverIdExists = async (driverId) => {
    const driverQuery = query(
      collection(db, 'Driver'),
      where('DriverID', '==', driverId)
    );
    const querySnapshot = await getDocs(driverQuery);
    return !querySnapshot.empty; // Returns true if exists
  };

  // Function to check if PhoneNumber exists
  const checkIfPhoneNumberExists = async (phoneNumber, currentDriverId) => {
    const phoneQuery = query(
      collection(db, 'Driver'),
      where('PhoneNumber', '==', phoneNumber),
      where('UID', '!=', currentDriverId), 
      where('CompanyName', '==', driverData.CompanyName)
    );
  
    const querySnapshot = await getDocs(phoneQuery);
    return !querySnapshot.empty; // Returns true if exists
  };

  // Effect to fetch company name on component mount
  useEffect(() => {
    const getCompanyName = async () => {
      const name = await fetchCompanyName(employerUID);
      setCompanyName(name); // Store the fetched name in state
    };
    getCompanyName();
  }, [employerUID]);



  // Update submit handler 
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting driver event :', e);
    const { Fname, Lname, PhoneNumber, DriverID } = driverData;

    let isValid = true;
    const newValidationMessages = {};

    if (!Fname) {
      newValidationMessages.Fname = 'Please enter first name.';
      isValid = false;
    }

    if (!Lname) {
      newValidationMessages.Lname = 'Please enter last name.';
      isValid = false;
    }

    // Phone number validation only checks for emptiness here
    if (!PhoneNumber || PhoneNumber === '+966') {
      newValidationMessages.PhoneNumber = 'Please enter driver phone number';
      isValid = false;
    } else {
      const phoneValidation = validatePhoneNumber(PhoneNumber);
      if (phoneValidation) {
        newValidationMessages.PhoneNumber = phoneValidation;
        isValid = false;
      }
    }

    if (!DriverID) {
      newValidationMessages.DriverID = 'Please enter driver ID';
      isValid = false;
    } else if (DriverID.length !== 10) {
      newValidationMessages.DriverID = 'Driver ID must be 10 digits';
      isValid = false;
    }


    setValidationMessages(newValidationMessages);

    if (isValid) {
      handleUpdateDriver(driverData);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;

    // Update the driverData with the new GPS number
    if (name === 'GPSnumber') {
      setDriverData(prev => ({
        ...prev,
        GPSnumber: value
      }));

      // If GPS number is set to "None", fetch available motorcycles again
      if (value === 'None') {
        await fetchAvailableMotorcycles(companyName);
      }
    } else {
      setDriverData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear validation messages if necessary
    setValidationMessages(prev => ({
      ...prev,
      [name]: ''
    }));


    // Check uniqueness when Driver ID changes
    if (name === 'DriverID') {
      if (value.length !== 10) {
        setValidationMessages(prev => ({
          ...prev,
          DriverID: 'Driver ID must be 10 digits.'
        }));
      } else if (value !== originalDriverID) {
        const exists = await checkIfDriverIdExists(value);
        if (exists) {
          setValidationMessages(prev => ({
            ...prev,
            DriverID: ''
          }));
        }
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
  
    setDriverData(prev => ({
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



  return (
    <div className="Header">

      <Header active="driverslist" />

      <div className="breadcrumb">
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/driverslist')}>Driver List</a>
        <span> / </span>
        <a onClick={() => navigate(`/edit-driver/${driverId}`)}>Edit Driver</a>
      </div>
      <main>
        <div  >
          <div className={s.container}>
            <h2 className='title'>Edit Driver</h2>
            {isLoading ? (
              <p>   </p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className={s.formRow}>
                  <div>
                    <label>First Name</label>
                    <input
                      type="text"
                      name="Fname"
                      value={driverData.Fname}
                      onChange={handleInputChange}
                    />
                    {validationMessages.Fname && <p className={s.valdationMessage}>{validationMessages.Fname}</p>}
                  </div>

                  <div>
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="Lname"
                      value={driverData.Lname}
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
                      value={driverData.PhoneNumber}
                      placeholder="+966"
                      onChange={handlePhoneNumberChange}
                    />
                    {validationMessages.PhoneNumber && <p className={s.valdationMessage}>{validationMessages.PhoneNumber}</p>}
                  </div>

                  <div>
                    <label>Email</label>
                    <input
                      name="Email"
                      value={driverData.Email}
                      disabled
                      className={s.disabledInput}
                    />
                  </div>
                </div>

                <div className={s.formRow}>
                  <div>
                    <label>Driver ID (National ID / Residency Number)</label>
                    <input
                      type="text"
                      name="DriverID"
                      maxLength={10}
                      value={driverData.DriverID}
                      onChange={handleInputChange}
                    />
                    {validationMessages.DriverID && <p className={s.valdationMessage}>{validationMessages.DriverID}</p>}
                  </div>
                 { console.log("oldgps number",oldDriverData.GPSnumber, "new gps number", driverData.GPSnumber)}
                  <div>
                    <label>GPS Number</label>
                    <select
                      name="GPSnumber"
                      value={driverData.GPSnumber || 'None'}
                      onChange={handleInputChange}
                      className={s.select}
                    >
                      {/* Show the currently assigned GPS number if available */}
                      {oldDriverData.GPSnumber && (
                        <option value={oldDriverData.GPSnumber}>
                          {oldDriverData.GPSnumber}
                        </option>
                      )}
                      {/* Add "None" option only if it is not already selected */}
                      {oldDriverData.GPSnumber !== 'None' && (
                        <option value="None">None</option>
                      )}
                      {/* Render available motorcycles, excluding the currently selected GPS number */}
                      {availableMotorcycles.length > 0 ? (
                        availableMotorcycles 
                          .map((item) => (
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
                <button
                                onClick={() => { navigate('/driverslist');}}
                                className={s.profileCancel}
                               
                            >
                                Cancel
                            </button>
                  <button type="submit" className={s.editBtn}>
                    Update Driver
                  </button>
                 
                </div>
              </form>
            )}
          </div>
        </div>
        <Modal
          visible={isNotificationVisible}
          onCancel={() => setIsNotificationVisible(false)}
          footer={<p style={{ textAlign: 'center' }}> {notificationMessage}</p>} // No footer buttons
          style={{ top: '38%' }}
          className="custom-modal" 
          closeIcon={
            <span className="custom-modal-close-icon">
              ×
            </span>
          }
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={isSuccess ? successImage : errorImage}
              alt={isSuccess ? 'Success' : 'Error'}
              style={{ width: '20%', marginBottom: '16px' }}
            />
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default EditDriver;