import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx'; ///
import { FaTrash } from 'react-icons/fa';
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
  Input,
} from 'antd';
import successImage from '../images/Sucess.png';
import errorImage from '../images/Error.png';
import { useNavigate } from 'react-router-dom';
import { generateRandomPassword } from '../utils/common';
import { Upload ,Modal} from 'antd';///
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
    const [fileList, setFileList] = useState([]); /// Manage file as an array
    const [drivers, setDrivers] = useState([]); /// Store parsed driver data#
    const [fileData, setFileData] = useState([]); /// Store file data
    const [fileName, setFileName] = useState('');
const [recentlyAdded, setRecentlyAdded] = useState([]);


  const [validationMessages, setValidationMessages] = useState({
    Fname: '',
    Lname: '',
    PhoneNumber: '',
    Email: '',
    DriverID: '',
    GPSnumber: ''
  });

  const [manualDriver, setManualDriver] = useState({
    Fname: '',
    Lname: '',
    PhoneNumber: '',
    Email: '',
    DriverID: '',
    GPSnumber: ''
  });


  const handleInputChangeForFile=(e,index=-1)=>{
    const { name, value } = e.target;
    if (value.trim() === '') {
      console.log('clear');
      setValidationMessages((prev) => ({
        ...prev,
        [name]: '', // Clear validation message for empty fields
      }));
    }

    

    const updatedDrivers = [...drivers];
    if (index !== -1) {
      updatedDrivers[index][name] = value;
      setDrivers(updatedDrivers);
    }
    const newValidationMessages = { ...validationMessages };
    if (index !== -1) {
      // Ensure the index exists in newValidationMessages
      if (!newValidationMessages[index]) {
        newValidationMessages[index] = {};
      }
    }
    if (name === 'Fname' ) {
      if (value.trim() === '' ||value.length !== 0) {
        newValidationMessages[index].Fname='';
      }
    }
      if (name === 'Lname' ) {
        if (value.trim() === '' ||value.length !== 0) {
          newValidationMessages[index].Lname='';
        }}

      // Real-time validation for email
      if (name === 'Email') {
        if (value.trim() === '') {
          newValidationMessages[index].Email='';
        }
        else{
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) {
          newValidationMessages[index].Email = 'Please enter a valid Email';
          console.log('l');
          
        } else {
          newValidationMessages[index].Email = ''; // Clear error if valid
        }
      }}

      // Driver ID validation
      if (name === 'DriverID') {
        if (value.length === 0) {
          newValidationMessages[index].DriverID='';
        }
        else if (value.length !== 0 && value.length !== 10) {
          newValidationMessages[index].DriverID =  'Driver ID must be 10 digits';
         
        } else {
          newValidationMessages[index].DriverID = ''; // Clear error if valid
        }
      }

     
// Phone number validation
if (name === 'PhoneNumber') {
  if(value.trim() === ''|| value === '+966'){
    newValidationMessages[index].PhoneNumber='';
  }    

  // Remove all +966 prefixes and leading zeros
  let newPhoneNumber = value.replace(/\+966/g, '').replace(/^0+/, '');
  console.log('q88');    
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
  
  const updatedDrivers = [...drivers];
      if (index !== -1) {
        updatedDrivers[index].PhoneNumber = newPhoneNumber;
        setDrivers(updatedDrivers);
      }
  // Validate phone number
  
  if (newPhoneNumber.length > 4) {
    const validationResult = validatePhoneNumber(newPhoneNumber);
    if (validationResult === '' || validationResult === '0') {
      newValidationMessages[index].PhoneNumber = ''; // Clear error if valid
    } else {
      newValidationMessages[index].PhoneNumber = validationResult;
    }
  }}

   
    if (name==='GPSnumber'){
      if ( value.trim() === '') {
        newValidationMessages[index].GPSnumber = ''; // Clear any previous validation message
      }
  if(value==='None'){
    newValidationMessages[index].GPSnumber = '';
  }
      // Validate if the selected value is valid
      // if (value && value.trim() !== ''&& value !=='None') {
      // const isValid = availableMotorcycles.some(
      //   (motorcyclee) => motorcyclee.GPSnumber === value
      // );
      // if(!isValid){
      //   newValidationMessages[index].GPSnumber =  'The entered GPS number is not available.';
      // }
      // else {
      //   newValidationMessages[index].GPSnumber = ''; 
      // }}
    }
    
      
      

    // Update validation messages state
    setValidationMessages(newValidationMessages);
    console.log(validationMessages); 
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setManualDriver((prev) => ({ ...prev, [name]: value }));


    // Remove validation message for the field being edited
    setValidationMessages((prev) => ({
      ...prev,
      [name]: ''
    }));

    // Real-time validation for email and driver ID
    if (name === 'Email') {
          if (value.trim() === '') {
            // Clear validation message for empty email
            setValidationMessages((prev) => ({
              ...prev,
              Email: '',
            }));
          } else {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(value)) {
              setValidationMessages((prev) => ({
                ...prev,
                Email: 'Please enter a valid Email',
              }));
            } else {
              // Clear error if valid
              setValidationMessages((prev) => ({
                ...prev,
                Email: '',
              }));
            }
          }
        }
    
        if (name === 'DriverID') {
          if (value.length !== 0 && value.length !== 10) {
            setValidationMessages((prev) => ({
              ...prev,
              DriverID: 'Driver ID must be 10 digits'
            }));
            
          }
          else{
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
  
    setManualDriver(prev => ({
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

  // const handleAddDriver = async (values) => {
  //   try {
  //     const formattedPhoneNumber = `${values.PhoneNumber}`;
  //     const GPSnumber = values.GPSnumber === "None" ? null : values.GPSnumber;

  //     const phoneQuery = query(
  //       collection(db, 'Driver'),
  //       where('PhoneNumber', '==', formattedPhoneNumber),
  //       where('CompanyName', '==', Employer.CompanyName)
  //     );
  //     const phoneSnapshot = await getDocs(phoneQuery);
  //     if (!phoneSnapshot.empty) {
  //       setPopupMessage("The Phone number is already used. Please use a new number.");
  //       setPopupImage(errorImage);
  //       setPopupVisible(true);
  //       return;
  //     }

  //     const driverIdQuery = query(
  //       collection(db, 'Driver'),
  //       where('DriverID', '==', values.DriverID),
  //       where('CompanyName', '==', Employer.CompanyName)
  //     );
  //     const driverIdSnapshot = await getDocs(driverIdQuery);
  //     if (!driverIdSnapshot.empty) {
  //       setPopupMessage("Driver ID already exists.");
  //       setPopupImage(errorImage);
  //       setPopupVisible(true);
  //       return;
  //     }

  //     const generatedPassword = generateRandomPassword();
  //     const userCredential = await createUserWithEmailAndPassword(
  //       auth,
  //       values.Email,
  //       generatedPassword
  //     );

  //     const user = userCredential.user;
  //     const newDriver = {
  //       ...values,
  //       PhoneNumber: formattedPhoneNumber,
  //       GPSnumber: GPSnumber,
  //       CompanyName: Employer.CompanyName,
  //       isDefaultPassword: true,
  //       available: GPSnumber === null,
  //       UID: user.uid
  //     };

  //     await addDoc(collection(db, 'Driver'), newDriver);

  //     if (GPSnumber) {
  //       const q = query(
  //         collection(db, 'Motorcycle'),
  //         where('GPSnumber', '==', GPSnumber)
  //       );
  //       const querySnapshot = await getDocs(q);
  //       if (!querySnapshot.empty) {
  //         const motorcycleDocRef = querySnapshot.docs[0].ref;
  //         await updateDoc(motorcycleDocRef, {
  //           available: false,
  //           DriverID: values.DriverID
  //         });
  //       }
  //     }


  //     // Send Welcome Registration email
  //     const templateParams = {
  //       email: values.Email,
  //       subject: 'Welcome to SAIR!',
  //       companyName: Employer.ShortCompanyName,
  //       generatedPassword: generatedPassword,
  //     };
  
  //     const response = await emailjs.send(
  //       'service_ltz361p',
  //       'template_u0v3anh',
  //       templateParams,
  //       '6NEdVNsgOnsmX-H4s'
  //     );
  
  //     if (response.status === 200) {
  //       setPopupMessage('Driver added successfully!');
  //       setPopupImage(successImage);
  //     } else {
  //       setPopupMessage('Error adding driver');
  //       setPopupImage(errorImage);
  //     }
  
  //     setPopupVisible(true);

  //     setPopupVisible(true);

  //     setTimeout(() => {
  //       navigate('/driverslist'); // Adjust the path as needed
  //     }, 2000);
      
  //   } catch (error) {
  //     console.error('Error adding driver:', error);
  //     setPopupMessage("Driver Email Already exist.");
  //     setPopupVisible(true);
  //     setPopupImage(errorImage);
  //   }
  // };

const validateDriver= async(driver,validDrivers)=>{
  const errorList = [];
  // let isValid=true;
  // let errors=[];
  const formattedPhoneNumber = `${driver.PhoneNumber}`;
  const GPSnumber = driver.GPSnumber === 'None' ? null : driver.GPSnumber;

         console.log(formattedPhoneNumber);
         console.log(GPSnumber);
            // Check for existing phone number
            const phoneQuery = query(
              collection(db, 'Driver'),
              where('PhoneNumber', '==', formattedPhoneNumber),
              where('CompanyName', '==', Employer.CompanyName)
            );
            const phoneSnapshot = await getDocs(phoneQuery);
            if (!phoneSnapshot.empty) {
              console.log('sssss');
              errorList.push({
               
                message: `The Phone number ${driver.PhoneNumber} is already used.`,
                driverID: driver.DriverID
              });
              
              // setPopupMessage(
              //   `For driver , The phone number ${driver.PhoneNumber} is already used.` );
              // setPopupImage(errorImage);
              // setPopupVisible(true);
              // return;
            //  isValid= false;
            //  errors= errorList ; 
            }
            if(validDrivers.length>0){
            const isDriverPhoneExist = validDrivers.some(existingDriver => existingDriver.PhoneNumber === driver.PhoneNumber);
            if (isDriverPhoneExist) {
              errorList.push({
                message: `Phone number ${driver.PhoneNumber} is already used.`,
                driverID: driver.DriverID
              });
            //   isValid= false;
            //  errors= errorList ; 
            }}

            // Check for existing DriverID
            const driverIdQuery = query(
              collection(db, 'Driver'),
              where('DriverID', '==', driver.DriverID),
              where('CompanyName', '==', Employer.CompanyName)
            );
            const driverIdSnapshot = await getDocs(driverIdQuery);
            if (!driverIdSnapshot.empty) {
              errorList.push({
               
                message: `The driver ID ${driver.DriverID} already exists.`,
                driverID: driver.DriverID
              });
              // setPopupMessage(
              //   `For driver , The driver ID ${driver.DriverID} already exists.` );
              // setPopupImage(errorImage);
              // setPopupVisible(true);
              // return;
              // isValid= false;
              // errors= errorList ; 
            }
            if(validDrivers.length>0){
            const isDriverIdExist = validDrivers.some(existingDriver => existingDriver.DriverID === driver.DriverID);
            if (isDriverIdExist) {
              errorList.push({
                message: `The driver ID ${driver.DriverID} already exists.`,
                driverID: driver.DriverID
              });
              // isValid= false;
              // errors= errorList ; 
            }}
            
            const driverEmailQuery = query(
              collection(db, 'Driver'),
              where('Email', '==', driver.Email),
              where('CompanyName', '==', Employer.CompanyName)
            );
            console.log(driverEmailQuery);
            const driverEmailSnapshot = await getDocs(driverEmailQuery);
            if (!driverEmailSnapshot.empty) {
              errorList.push({
               
                message: `The driver email ${driver.Email} already exists.`,
                driverID: driver.DriverID
              });
              // setPopupMessage(
              //   `For driver , The driver email ${driver.Email} already exists.` );
              // setPopupImage(errorImage);
              // setPopupVisible(true);
              // return;
              // isValid= false;
              // errors= errorList ; 
            }
            if(validDrivers.length>0){
            const isDriverEmailExist = validDrivers.some(existingDriver => existingDriver.Email === driver.Email);
            if (isDriverEmailExist) {
              errorList.push({
                message: `The driver email ${driver.Email} already exists.`,
                driverID: driver.DriverID
              });
              // isValid= false;
              // errors= errorList ; 
            }}

                const isValid = availableMotorcycles.some(
                  (motorcyclee) => motorcyclee.GPSnumber === GPSnumber
                );
                 if(!isValid && GPSnumber !==null){
                  errorList.push({
                    message: `The GPS number ${driver.GPSnumber} is invalid.`,
                    driverID: driver.DriverID
                  });
                  
                  // setPopupMessage(
                  //   `For driver , The GPS number ${driver.GPSnumber} is invalid.` );
                  // setPopupImage(errorImage);
                  // setPopupVisible(true);
                  // return;  
                  // isValid= false;
                  // errors= errorList ; 
                 }
                 if(validDrivers.length>0){
                 const isDriverGPSExist = validDrivers.some(existingDriver => existingDriver.GPSnumber === driver.GPSnumber);
            if (isDriverGPSExist) {
              errorList.push({
                message: `The GPS number ${driver.GPSnumber} is invalid.`,
                driverID: driver.DriverID
              });
              // isValid= false;
              // errors= errorList ; 
            }}
console.log(driver.DriverID,errorList);
return {
  isValid: errorList.length === 0, // If no errors, valid
  errors: errorList
};
                 

            
}
const addDriverToSystem= async(driver)=>{
  const formattedPhoneNumber = `${driver.PhoneNumber}`;
  const GPSnumber = driver.GPSnumber === 'None' ? null : driver.GPSnumber;
   // Generate a random password for the driver
   const generatedPassword = generateRandomPassword();

   // Create a new user in Firebase Auth
   const userCredential = await createUserWithEmailAndPassword(
     auth,
     driver.Email,
     generatedPassword
   );
   const user = userCredential.user;

   // Create the new driver object
   const newDriver = {
     ...driver,
     PhoneNumber: formattedPhoneNumber,
     GPSnumber: GPSnumber,
     CompanyName: Employer.CompanyName,
     isDefaultPassword: true,
     available: driver.GPSnumber === null,
     UID: user.uid,
   };

   // Add the driver to Firestore
   await addDoc(collection(db, 'Driver'), newDriver);
  
   // Update motorcycle availability if GPSnumber is assigned
   if (driver.GPSnumber) {
     const q = query(
       collection(db, 'Motorcycle'),
       where('GPSnumber', '==', driver.GPSnumber)
     );
     console.log(q);
     const querySnapshot = await getDocs(q);
     if (!querySnapshot.empty) {
       const motorcycleDocRef = querySnapshot.docs[0].ref;
       await updateDoc(motorcycleDocRef, {
         available: false,
         DriverID: driver.DriverID,
       });
     }
   }

   // Send welcome email using EmailJS
   const templateParams = {
     email: driver.Email,
     subject: 'Welcome to SAIR!',
     companyName: Employer.ShortCompanyName,
     generatedPassword: generatedPassword,
   };

   await emailjs.send(
     'service_ltz361p',
     'template_u0v3anh',
     templateParams,
     '6NEdVNsgOnsmX-H4s'
   );

 
}
const sendEmail = (email, driverName, password) => {
  const templateParams = {
    email: email,
    subject: 'Welcome to SAIR!',
    driverName: driverName,
    generatedPassword: password,
  };

  emailjs.send('service_ltz361p', 'template_gd1x3q7', templateParams, '6NEdVNsgOnsmX-H4s')
      .then((response) => {
          console.log('Email sent successfully!', response.status, response.text);
      }, (error) => {
          console.error('Failed to send email:', error);
      });
};

  const handleAddDriver = async (values) => {
    try {
      // Format PhoneNumber and handle GPSnumber
      const formattedPhoneNumber = `${values.PhoneNumber}`;
      const GPSnumber = values.GPSnumber === 'None' ? null : values.GPSnumber;
  

      // Check for existing phone number
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
  
      // Check for existing DriverID
      const driveremailQuery = query(
        collection(db, 'Driver'),
        where('Email', '==', values.Email),
        where('CompanyName', '==', Employer.CompanyName)
      );
      const driveremailSnapshot = await getDocs(driveremailQuery);
      if (!driveremailSnapshot.empty) {
        setPopupMessage("Email already exists.");
        setPopupImage(errorImage);
        setPopupVisible(true);
        return;
      }
  

      // Check for existing DriverID
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
  
      // Generate a random password for the driver
      const generatedPassword = generateRandomPassword();
  
      // Create a new user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.Email,
        generatedPassword
      );
      const user = userCredential.user;
  
      // Create the new driver object
      const newDriver = {
        ...values,
        PhoneNumber: formattedPhoneNumber,
        GPSnumber: GPSnumber,
        CompanyName: Employer.CompanyName,
        isDefaultPassword: true,
        available: GPSnumber === null,
        UID: user.uid
      };
  
      // Add the driver to Firestore
      await addDoc(collection(db, 'Driver'), newDriver);
      sessionStorage.setItem(`driver_${newDriver.id}`, newDriver.id); // Store in sessionStorage
      // Update motorcycle availability if GPSnumber is assigned
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
  
      // Send welcome email using EmailJS
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
        setPopupMessage('Email already exists.');
        setPopupImage(errorImage);
      }
  
      setPopupVisible(true);
  
      // Navigate to the driver list after a short delay
      setTimeout(() => {
        navigate('/driverslist'); 
      }, 2000);
  
    } catch (error) {
      console.error('Error adding driver:', error);
      setPopupMessage("Email Already exist.");
      setPopupImage(errorImage);
      setPopupVisible(true);
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

  const validateEmail = (Email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(Email) ? null : 'Please enter a valid Email.';
};

const validatedriverID = (DriverID) => {
  const driverIDRegex = /^\d{10}$/; // Must be exactly 10 digits
  return driverIDRegex.test(DriverID) ? null : 'Driver ID must be 10 digits.';
};

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   const { Fname, Lname, PhoneNumber, Email, DriverID } = manualDriver;

  //   // Validate the form
  //   let isValid = true;
  //   const newValidationMessages = {}

  //   if (!Fname) {
  //     newValidationMessages.Fname = 'Please enter driver first name.';
  //     isValid = false;
  //   }

  //   if (!Lname) {
  //     newValidationMessages.Lname = 'Please enter driver last name.';
  //     isValid = false;
  //   }

  //   // Phone number validation only checks for emptiness here
  //   if (!PhoneNumber ||PhoneNumber == '+966') {
  //     newValidationMessages.PhoneNumber = 'Please enter driver phone number';
  //     isValid = false;
  //   } else {
  //     const phoneValidation = validatePhoneNumber(PhoneNumber);
  //     if (phoneValidation) {
  //       newValidationMessages.PhoneNumber = phoneValidation;
  //       isValid = false;
  //     }
  //   }

  //   if (!Email) {
  //     newValidationMessages.Email = 'Please enter Email';
  //     isValid = false;
  //   }

  //   if (!DriverID) {
  //     newValidationMessages.DriverID = 'Please enter driver ID';
  //     isValid = false;
  //   } else if (DriverID.length !== 10) {
  //     newValidationMessages.DriverID = 'Driver ID must be 10 digits';
  //     isValid = false;
  //   }

  //   if (manualDriver.GPSnumber === "" ) {
  //     newValidationMessages.GPSnumber = 'Please choose a motorcycle';
  //     isValid = false;
  //   }


  //   setValidationMessages(newValidationMessages);

  //   if (isValid) {
  //     handleAddDriver(manualDriver);
  //   }
  // };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Check if data is coming from the file (fileData array)
    // const dataToValidate = fileData.length > 0 ? fileData : [manualDriver]; // Use fileData if available, otherwise fallback to manualDriver
    let isValid = true;
    let newValidationMessages = {};
    
      const { Fname, Lname, PhoneNumber, Email, DriverID,GPSnumber } = manualDriver;
      newValidationMessages = {};
    if (!Fname) {
      newValidationMessages.Fname = 'Please enter driver first name.';
      isValid = false;
    }

    if (!Lname) {
      newValidationMessages.Lname = 'Please enter driver last name.';
      isValid = false;
    }

    // Phone number validation
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

    if (!Email) {
      newValidationMessages.Email = 'Please enter Email';
      isValid = false;
    }
    
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(Email)) {
          newValidationMessages.Email = 'Please enter a valid Email';
          isValid = false;
    }
  

    if (!DriverID) {
      newValidationMessages.DriverID = 'Please enter driver ID';
      isValid = false;
    } else if (DriverID.length !== 10) {
      newValidationMessages.DriverID = 'Driver ID must be 10 digits';
      isValid = false;
    }

    if (!GPSnumber) {
      newValidationMessages.GPSnumber = 'Please choose a motorcycle';
      isValid = false;
    }
  
    
  
    // Update validation messages
    setValidationMessages(newValidationMessages);
  
    if (isValid) {
     
        // If data is manual, add a single driver
        handleAddDriver(manualDriver);
      
    }
  };
  

  const handleClosePopup = () => {
    setPopupVisible(false);
  };

  const handleFileChange = async (info) => {
    const { file } = info;

    if (file.status === 'done') {
        // Handle file upload success here
    } else if (file.status === 'error') {
        // Handle upload failure here
    }
};



const handleFileUpload = (event) => {
  console.log(event); // Check the event object
  const file = event.target.files[0]; // Get the first file
  if (!file) {
    console.error("No file selected");
    return;
  }
  if (file) {
    setFileName(file.name);
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target.result; // Binary string data
    const workbook = XLSX.read(data, { type: 'binary' });

    // Process the workbook, e.g., convert to JSON
    const sheetName = workbook.SheetNames[0]; // Get the first sheet
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
   
    // Perform validation on each driver
    const newValidationMessages = {}; // Temporary object to hold validation messages

    jsonData.forEach((driver, index) => {
      const { Fname, Lname, PhoneNumber, Email, DriverID, GPSnumber } = driver;

      // Initialize validation for this driver
      newValidationMessages[index] = {};

      // Real-time validation for email
      if (Email) {
        if(!Email){
          newValidationMessages[index].Email='';
        }
        else{
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(Email)) {
          newValidationMessages[index].Email = 'Please enter a valid Email';
          console.log('l');
          
        } else {
          newValidationMessages[index].Email = ''; // Clear error if valid
        }
      }}

      // Driver ID validation
      if (DriverID) {
        if(!DriverID){
          newValidationMessages[index].DriverID='';
        }
        else if (DriverID.length !== 10) {
          newValidationMessages[index].DriverID =  'Driver ID must be 10 digits';
         
        } else {
          newValidationMessages[index].DriverID = ''; // Clear error if valid
        }
      }

      const updatedDrivers = drivers.length ? [...drivers] : [...jsonData];
      // Phone number validation
      if (PhoneNumber) {
        console.log('33',PhoneNumber);
        if(!PhoneNumber|| PhoneNumber === '+966'){
          newValidationMessages[index].PhoneNumber='';
        }
     else{       
// Remove all +966 prefixes and leading zeros
const phoneStr = String(PhoneNumber);
let newPhoneNumber = phoneStr.replace(/\+966/g, '').replace(/^0+/, '');
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

// const updatedDrivers = [...drivers];
//     if (index !== -1) {
//       updatedDrivers[index].PhoneNumber = newPhoneNumber;
//       setDrivers(updatedDrivers);
//     }
if (!updatedDrivers[index]) {
  updatedDrivers[index] = { ...driver }; // Initialize with driver object
}
updatedDrivers[index].PhoneNumber = newPhoneNumber;
// Validate phone number

if (newPhoneNumber.length > 4) {
  const validationResult = validatePhoneNumber(newPhoneNumber);
  if (validationResult === '' || validationResult === '0') {
    newValidationMessages[index].PhoneNumber = ''; // Clear error if valid
  } else {
    newValidationMessages[index].PhoneNumber = validationResult;
  }
}}}

      
      // if (GPSnumber){
      //   const isValid = availableMotorcycles.some(
      //     (motorcyclee) => motorcyclee.GPSnumber === GPSnumber
      //   );
      //   if(!isValid){
      //     newValidationMessages[index].GPSnumber =  'The entered GPS number is not available.';
      //   }
      //   else {
      //     newValidationMessages[index].GPSnumber = ''; 
      //   }}
      
    
    });///end of the handle the file of drivers

    // Update validation messages state
    setValidationMessages(newValidationMessages);

    // Log messages and data for debugging
    console.log('Validation Messages:', newValidationMessages);
    
    // If file data is valid, set it for processing and fill form fields
   
      setFileData(jsonData);// Save valid data to state
      console.log(jsonData); // Log the valid data
    
      
  };

  reader.readAsArrayBuffer(file); // Read file as ArrayBuffer
};

  
 useEffect(() => {
  // Merge file data with manual entries
  setDrivers(fileData.map((driver) => ({ ...driver })));
  console.log('hh',fileData);
}, [fileData]);

const handleRemoveFile = () => {
  setFileName(''); // Clear the file name
  document.getElementById('fileInput').value = ''; 
  setFileData([]);// Reset the file input
  setDrivers([]);
};

  

const handleBatchUpload = async (driverArray) => { 
    const errorList = [];

    for (const driver of driverArray) {
        const { Fname, Lname, PhoneNumber, Email, DriverID , GPSnumber } = driver; //GPSnumber???????????
         GPSnumber = GPSnumber === 'None' ? null : GPSnumber;

        if (!Fname || !Lname || !PhoneNumber || !Email || !DriverID ) {
            errorList.push({ driver, message: 'All fields are required.' });
            continue;
        }

        const phoneValidation = validatePhoneNumber(PhoneNumber);
        if (phoneValidation) {
            errorList.push({ driver, message: `Error adding ${Fname} ${Lname}: ${phoneValidation}` });
            continue;
        }

        const emailValidation = validateEmail(Email);
        if (emailValidation) {
            errorList.push({ driver, message: `Error adding ${Fname} ${Lname}: ${emailValidation}` });
            continue;
        }

        const driverIDValidation = validatedriverID(DriverID);
        if (driverIDValidation) {
            errorList.push({ driver, message: `Error adding ${Fname} ${Lname}: ${driverIDValidation}` });
            continue;
        }   

        const uniqueValidationResult = await checkUniqueness(PhoneNumber, Email, DriverID);
        if (!uniqueValidationResult.isUnique) {
            errorList.push({ driver, message: `Error adding ${Fname} ${Lname}: ${uniqueValidationResult.message}` });
            continue;
        }

        try {
            const password = generateRandomPassword();
            // Create user with email and password
            
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              Email,
              password
            );
            const user = userCredential.user; 

            await addDoc(collection(db, 'Driver'), {
                Fname,
                Lname,
                Email,
                PhoneNumber,
                DriverID,
                GPSnumber: GPSnumber,
                CompanyName: Employer.CompanyName,
                isDefaultPassword: true,
                available: driver.GPSnumber === null,
                UID: user.uid,
            });
            // Send welcome email 
            sendEmail(Email, `${Fname} ${Lname}`, password);
        } catch (error) {
            // Capture the specific error message, if available
            let errorMessage = error.message || "Failed to create user.";
            errorList.push({ driver, message: `Error adding ${Fname} ${Lname}: ${errorMessage}` });
        }
    }

    if (errorList.length > 0) {
        const errorMessages = errorList.map(err => err.message).join('\n'); // Join messages with newline
        setPopupMessage(`Some drivers could not be added:\n${errorMessages}`); // Add a newline after the main message
        setPopupImage(errorImage);
        setPopupVisible(true);
        console.error("Errors during batch addition:", errorList)
    } else {
        setPopupMessage("All drivers added successfully!");
        setPopupImage(successImage);
        setPopupVisible(true);
        setTimeout(() => {
                navigate('/driverslist'); 
              }, 2000);
    }
};



const checkUniqueness = async (phone, email, driverID) => {
  const driverIdQuery = query(
    collection(db, 'Driver'),
    where('DriverID', '==', driverID),
    where('CompanyName', '==', Employer.CompanyName)
  );
  const phoneQuery = query(
    collection(db, 'Driver'),
    where('PhoneNumber', '==', phone),
    where('CompanyName', '==', Employer.CompanyName)
  );
    const emailQuery = query(
      collection(db, 'Driver'), 
      where("Email", "==", email));

    const phoneSnapshot = await getDocs(phoneQuery);
    if (!phoneSnapshot.empty) {
        return {
            isUnique: false,
            message: "Phone number already exists."
        };
    }

    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) {
        return {
            isUnique: false,
            message: "Email already exists."
        };
    }

    const driverIDSnapshot = await getDocs(driverIdQuery);
    if (!driverIDSnapshot.empty) {
        return {
            isUnique: false,
            message: "Driver ID already exists."
        };
    }

    return { isUnique: true, message: "" };
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
<div className={s.container}>
                <h2 className='title'>Add Driver</h2>
                
                {fileData.length === 0 ? (
                    <form onSubmit={handleSubmit} className={s.form}>
                        <div className={s.formRow}>
                        <div>
              <label>First Name</label>
              <input
                type="text"
                name="Fname"
                value={manualDriver.Fname}
                onChange={handleInputChange}
              />
              {validationMessages.Fname && <p className={s.valdationMessage}>{validationMessages.Fname}</p>}
            </div>

            <div>
              <label>Last Name</label>
              <input
                type="text"
                name="Lname"
                value={manualDriver.Lname}
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
                value={manualDriver.PhoneNumber}
                placeholder="+966" 
                onChange={handlePhoneNumberChange}  
              />
              {validationMessages.PhoneNumber && <p className={s.valdationMessage}>{validationMessages.PhoneNumber}</p>}
            </div>
            <div>
              <label>Email</label>
              <input 
                name="Email"
                value={manualDriver.Email}
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
                value={manualDriver.DriverID}
                onChange={handleInputChange}
              />
              {validationMessages.DriverID && <p className={s.valdationMessage}>{validationMessages.DriverID}</p>}
            </div>
            <div>
              <label>GPS Number</label>
              <select
  name="GPSnumber"
  value={manualDriver.GPSnumber}
  onChange={handleInputChange}
>
  <option value="" disabled>Select a Motorcycle</option>

  <option value="None">None</option>
    {manualDriver.GPSnumber && manualDriver.GPSnumber !== '' && (
                    <option
                      key={manualDriver.GPSnumber}
                      value={manualDriver.GPSnumber}
                    >
                      {manualDriver.GPSnumber}
                    </option>
                  )}
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
                        <p style={{ marginTop: '10px' }}>
  Alternatively, you can add drivers as a batch to the drivers list. To proceed,{'  '}
  <span 
    onClick={() => navigate('/Adddriverbatch')} 
    style={{ cursor: 'pointer', color: '#059855', textDecoration: 'underline' }}
  >
    click here
  </span>.
</p>
<button
                                onClick={() => { navigate('/driverslist');}}
                                className={s.profileCancel}
                               
                            >
                                Cancel
                            </button>
                            <button type="submit" className={s.editBtn}>Add Driver</button>
                                                 </div>
                    </form>
                ) : (
                <div>
                        {/* //<button onClick={() => handleBatchUpload(fileData)} className={s.editBtn} style={{marginBottom:"10px"}}>
                        //    Add All Staff from File
                        //</button> */}
                   </div>
                )}

                {popupVisible && (
                     <Modal
                        title={null}
                        visible={popupVisible}
                        onCancel={handleClosePopup}
                        footer={<p style={{ textAlign:'center'}}>{popupMessage}</p>}
                        style={{ top: '38%' }}
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
        </div>   
    ); 
};

      {/* <main className={s.container}>
        <h2 className='title'>Add Driver</h2>
        <p>You can add drivers as batch file:</p>
        <div className={s.formRow}>
              <input
        id="fileInput"
        type="file"
        onChange={handleFileUpload} // Attach the event handler here
        accept=".xls,.xlsx"
      />
       {fileName && (
   <div style={{ marginLeft:'10' , display: 'flex', alignItems: 'center' }}>
          
          <FaTrash
            onClick={handleRemoveFile}
            style={{
              marginLeft: '10px',
              color: '#059855',
              cursor: 'pointer',
              fontSize: '20px',
            }}
            title="Remove file"
          />
        </div>
       )}
        
          </div>
        
          {fileData.length === 0 ? (
          <form onSubmit={handleSubmit}>
          <div className={s.formRow}>
            <div>
              <label>First Name</label>
              <input
                type="text"
                name="Fname"
                value={manualDriver.Fname}
                onChange={handleInputChange}
              />
              {validationMessages.Fname && <p className={s.valdationMessage}>{validationMessages.Fname}</p>}
            </div>

            <div>
              <label>Last Name</label>
              <input
                type="text"
                name="Lname"
                value={manualDriver.Lname}
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
                value={manualDriver.PhoneNumber}
                placeholder="+966" 
                onChange={handlePhoneNumberChange}  
              />
              {validationMessages.PhoneNumber && <p className={s.valdationMessage}>{validationMessages.PhoneNumber}</p>}
            </div>
            <div>
              <label>Email</label>
              <input 
                name="Email"
                value={manualDriver.Email}
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
                value={manualDriver.DriverID}
                onChange={handleInputChange}
              />
              {validationMessages.DriverID && <p className={s.valdationMessage}>{validationMessages.DriverID}</p>}
            </div>
            <div>
              <label>GPS Number</label>
              <select
  name="GPSnumber"
  value={manualDriver.GPSnumber}
  onChange={handleInputChange}
>
  <option value="" disabled>Select a Motorcycle</option>

  <option value="None">None</option>
    {manualDriver.GPSnumber && manualDriver.GPSnumber !== '' && (
                    <option
                      key={manualDriver.GPSnumber}
                      value={manualDriver.GPSnumber}
                    >
                      {manualDriver.GPSnumber}
                    </option>
                  )}
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
            <button
                onClick={() => { navigate('/driverslist');}}
                className={s.profileCancel}
                
            >
                Cancel
            </button>
                                          
          </div>
 
          </form>
      ) : (
        drivers.map((driver, index) => (
          <form key={index} className={s.driverForm} onSubmit={handleSubmit}>
             <div className={s.formRow}>
              <div>
              <label>First Name</label>
            <Input
              name="Fname"
              value={driver.Fname|| '' }
              onChange={(e) => handleInputChangeForFile(e, index)}
            />
            {validationMessages[index].Fname && <p className={s.valdationMessage}>{validationMessages[index].Fname}</p>}
            </div>
            <div>
            <label>Last Name</label>
            <Input
              name="Lname"
              value={driver.Lname || ''}
              onChange={(e) => handleInputChangeForFile(e, index)}
            />
            {validationMessages[index].Lname && <p className={s.valdationMessage}>{validationMessages[index].Lname}</p>}
            </div>
            </div>
            <div className={s.formRow}>
              <div>
              <label>Phone Number</label>
            <Input
              name="PhoneNumber"
              value={driver.PhoneNumber}
              placeholder="+966" 
              onChange={(e) => handleInputChangeForFile(e, index)} 
             />
             {validationMessages[index].PhoneNumber && <p className={s.valdationMessage}>{validationMessages[index].PhoneNumber}</p>}
             </div>
             <div>
             <label>Email</label>
            <Input
              name="Email"
              value={driver.Email || ''}
              onChange={(e) => handleInputChangeForFile(e, index)}
            />
            {validationMessages[index].Email && <p className={s.valdationMessage}>{validationMessages[index].Email}</p>}
            </div>
            </div>
            <div className={s.formRow}>
              <div>
              <label>Driver ID (National ID / Residency Number)</label>
            <Input
              name="DriverID"
              value={driver.DriverID || ''}
              onChange={(e) => handleInputChangeForFile(e, index)}
            />
             {validationMessages[index].DriverID && <p className={s.valdationMessage}>{validationMessages[index].DriverID}</p>}
             </div>
             <div>
  <label>GPS Number</label>
  {driver.GPSnumber ? (
    // If GPS number is already available, show it as a text input (read-only)
    <input
      name="GPSnumber"
      type="text"
      value={driver.GPSnumber}
      onChange={(e) => handleInputChangeForFile(e, index)}///i will handle if its not available 
    />
  ) : (
   
    <select
      name="GPSnumber"
      value={driver.GPSnumber ||''}
      onChange={(e) => handleInputChangeForFile(e, index)} 
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
   )} 
  {validationMessages[index].GPSnumber && <p className={s.valdationMessage}>{validationMessages[index].GPSnumber}</p>}
</div>
</div>

            {index === drivers.length - 1 && (
              <div>
              <Button type="submit" onClick={handleSubmit} className={s.editBtn} >
                Add All Drivers
              </Button>
              </div>
            )}
           </form>
        ))
        
      )}
      
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
}; */}

export default AddDriver;