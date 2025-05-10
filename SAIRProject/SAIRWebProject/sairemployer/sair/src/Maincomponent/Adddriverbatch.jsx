import React, { useEffect, useState, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, onSnapshot,doc, getDoc,updateDoc } from 'firebase/firestore';
import { Button, Modal ,message} from 'antd';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import Header from './Header';
import s from '../css/Profile.module.css';
import successImage from '../images/Sucess.png';
import errorImage from '../images/Error.png';
import { useNavigate } from 'react-router-dom';
import emailjs from 'emailjs-com';
import { generateRandomPassword } from '../utils/common';
import templateFile from './template.xlsx';
//

const Adddriverbatch = () => {
  const [fileData, setFileData] = useState([]);
  const [availableMotorcycles, setAvailableMotorcycles] = useState([]);
  const [selectedGPSNumbers, setSelectedGPSNumbers] = useState({}); 
  const [deletedGPS, setDeletedGPS] = useState(null); // New state for deletedGPS

  const [Employer, setEmployer] = useState({ CompanyName: '' });

  const [errorData, setErrorData] = useState([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupImage, setPopupImage] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUploadBoxVisible, setIsUploadBoxVisible] = useState(true);
  const navigate = useNavigate();
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeletePopupVisible, setIsDeletePopupVisible] = useState(false);
  const [driverToRemove, setDriverToRemove] = useState(null);
  const fileInputRef = useRef(null);



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
          // const filteredBikes = bikes.filter(bike => 
          //   !Object.values(selectedGPSNumbers).includes(bike.GPSnumber)
          // );
          setAvailableMotorcycles(bikes);
        });
        return () => unsubscribe();
      }
    };
    fetchMotorcycles();
  }, [Employer]);


  const handleInputChangeGPS = (index, value, driver) => {
    console.log('hhhhhhhhhhhhhhhhhhhhhhhhhhiiiiiiiiiiiiiiii',selectedGPSNumbers);
    console.log('hhhhhhhhhhhhhhhhhhhhhhhhhhiiiiiiiiiiiiiiii',availableMotorcycles);

    setFileData((prevFileData) => {
      const updatedFileData = [...prevFileData];
      // Update the specific driver's GPSnumber
      updatedFileData[index] = { ...driver, GPSnumber: value };
  
      return updatedFileData;
    });
  
    // Optionally update the selected GPS numbers state if you are tracking them
    // setSelectedGPSNumbers((prevSelected) => ({
    //   ...prevSelected,
    //   [index]: value,
    // }));
    setSelectedGPSNumbers((prevSelected) => {

      // if (value === 'None') {
      //   console.log('hhhhhhhhhhhhhhhhhhhhhhhhhhiiiiiiiiiiiiiiii',prevSelected);
      //   return prevSelected;
      // }
    
      // Check if the value (GPS number) is already selected
      // if (Object.values(prevSelected).includes(value)) {
      //   return prevSelected; // Return the previous state if the value already exists (no duplicates)
      // }
    
      // If not, update the state with the new selected GPS number
      return {
        ...prevSelected,
        [index]: value,
      };
    });
    

  

    setErrorData((prev) => {
      const updatedErrorData = [...prev];
      
      // Update only the GPSnumber error for the selected index
      updatedErrorData[index] = {
        ...updatedErrorData[index],  // Keep existing errors for other fields
        GPSnumber: !value ,  // Set GPSnumber error if invalid
        GPSnumberMessage: !value ? 'Please choose a motorcycle.' : '', // Set message if invalid
      };
  
      return updatedErrorData;
    });

  // // Trigger a re-render (if you're using state to track changes)
  // setManualDriver([...manualDriver]);

  //   setSelectedGPSNumbers((prevSelected) => {
  //     const updatedSelected = { ...prevSelected };
  
  //     // Remove previous selection from tracking
  //     if (updatedSelected[index]) {
  //       delete updatedSelected[index];
  //     }
  
  //     // If the new selection is not "None", store it
  //     if (newGPS !== "None") {
  //       updatedSelected[index] = newGPS;
  //     }
  
  //     return updatedSelected;
  //   });
  
  //   setManualDriver((prevDrivers) => {
  //     if (!Array.isArray(prevDrivers)) {
  //       console.error("manualDriver is not an array", prevDrivers);
  //       return []; // Return empty array if it's not initialized correctly
  //     }
  
  //     const updatedDrivers = [...fileData];
  // updatedDrivers[index] = {
  //   ...updatedDrivers[index],
  //   GPSnumber: newGPS === 'None' ? null : newGPS,
  // };
  // setFileData(updatedDrivers);
  
    // });
  };
 

  const handleInputChange = (index, field, value) => {
    const updatedFileData = [...fileData];
    updatedFileData[index] = { ...updatedFileData[index], [field]: value };
    setFileData(updatedFileData);
    validateAllFields(updatedFileData);
  };

  const validateAllFields = async (updatedData) => {
    updatedData.forEach((staff, index) =>
      validateDriverMember(staff, index, updatedData)
    );
  };



  const handleDeleteDrivers = (index) => {
      const updatedFileData = [...fileData];
      const deletedGPS = updatedFileData[index]?.GPSnumber;
      setDeletedGPS(deletedGPS);
        if (deletedGPS && deletedGPS !== 'None') {
          // Remove from selected list
          // setSelectedGPSNumbers(prevSelected => {
          //   const updatedSelected = { ...prevSelected };
          //   delete updatedSelected[deletedGPS];
          //   return updatedSelected;
          // });
          const updatedSelectedGPSNumbers = { ...selectedGPSNumbers };

        delete updatedSelectedGPSNumbers[index];

        setSelectedGPSNumbers(updatedSelectedGPSNumbers);
          // Add back to availableMotorcycles
          // setAvailableMotorcycles(prevAvailable => {
          //   return [...prevAvailable, deletedGPS]; // Add back to available list
          // });
        }


      updatedFileData.splice(index, 1);
      const updatedErrorData = [...errorData];
      updatedErrorData.splice(index, 1);
  

      
    setFileData(updatedFileData);
    setErrorData(updatedErrorData);
    setIsDeletePopupVisible(false);
};



useEffect(() => {

  console.log('hhhhhhhhhhhhhhhhhhhhhhhhhhiiiiiiiiiiiiiiii',selectedGPSNumbers);
  console.log('hhhhhhhhhhhhhhhhhhhhhhhhhhiiiiiiiiiiiiiiii',availableMotorcycles);
setSelectedGPSNumbers(selectedGPSNumbers);

  // setDeletedGPS(null);
}, [selectedGPSNumbers]); // Re-run whenever deletedGPS changes

  const validateDriverMember = async (driver, index, allStaff) => {
    const staffErrors = {
      Fname: false,
      Lname: false,
      PhoneNumber: false,
      Email: false,
      ID: false,
      GPSnumber:false,
      EmailMessage: '',
      PhoneNumberMessage: '',
      IDMessage: '',
      FnameMessage: '',
      LnameMessage: '',
      GPSnumberMessage:'',
    };
  
    // const formattedPhoneNumber = `${driver['Mobile Phone Number']}`;
    // const GPSnumber = values.GPSnumber === 'None' ? null : values.GPSnumber;

    // Validate First Name
    if (!driver['First name'] ) {
      staffErrors.Fname = true;
      staffErrors.FnameMessage = 'First name is required.';
    }else if (!validateName(driver['First name'])) {
      staffErrors.Fname = true;
      staffErrors.FnameMessage = 'Name must contain letters only.';
    }
    
    // Validate Last Name
    if (!driver['Last name']) {
      staffErrors.Lname = true;
      staffErrors.LnameMessage = 'Last name is required.';
    }else if (!validateName(driver['Last name'])) {
      staffErrors.Lname = true;
      staffErrors.LnameMessage = 'Name must contain letters only.';
    }
  
    // Validate Phone Number
    if (!driver['Mobile Phone Number']) {
      staffErrors.PhoneNumber = true;
      staffErrors.PhoneNumberMessage = 'Phone number is required.';
    } else {
      const phoneValidation = validatePhoneNumber(driver['Mobile Phone Number']);
      if (phoneValidation) {
        staffErrors.PhoneNumber = true;
        staffErrors.PhoneNumberMessage = phoneValidation;
      }
    }
  
    // Validate Email
    if (!driver.Email) {
      staffErrors.Email = true;
      staffErrors.EmailMessage = 'Email is required.';
    } else {
      const emailValidation = validateEmail(driver.Email);
      if (emailValidation) {
        staffErrors.Email = true;
        staffErrors.EmailMessage = emailValidation;
      }
    }
  
    if (!driver['Driver ID']) {
      staffErrors.ID = true;
      staffErrors.IDMessage = 'Driver ID is required.';
    } else {
      const idValidation = validateStaffID(driver['Driver ID']);
      if (idValidation) {
        staffErrors.ID = true;
        staffErrors.IDMessage = idValidation;
      }
    }
  

    if (!driver?.GPSnumber ) {
      staffErrors.GPSnumber = true;
      staffErrors.GPSnumberMessage = 'Please choose a motorcycle.';
    }
  

    // Unique validation
    const uniquenessResult = await checkUniqueness(
      driver['Mobile Phone Number'],
      driver.Email,
      driver['Driver ID']
    );
  
    // Set error messages based on uniqueness check
    if (!uniquenessResult.PhoneNumber && !staffErrors.PhoneNumber) {
      staffErrors.PhoneNumber = true;
      staffErrors.PhoneNumberMessage = 'Phone number already exists.';
    }
    if (!uniquenessResult.Email && !staffErrors.Email) {
      staffErrors.Email = true;
      staffErrors.EmailMessage = 'Email already exists.';
    }
    if (!uniquenessResult.ID && !staffErrors.ID) {
      staffErrors.ID = true;
      staffErrors.IDMessage = 'Driver ID already exists.';
    }
  
    // Check for duplicates within the uploaded file...
  
    const duplicates = allStaff.filter(
      (s, i) =>
        i !== index &&
        (s['Mobile Phone Number'] === driver['Mobile Phone Number'] ||   //driver['Mobile Phone Number']
          s.Email === driver.Email ||
          s['Driver ID'] === driver['Driver ID'])
    );
  
    if (duplicates.length > 0) {
      duplicates.forEach((dup) => {
        if (dup['Mobile Phone Number'] === driver['Mobile Phone Number']) {
          staffErrors.PhoneNumber = true;
          staffErrors.PhoneNumberMessage = 'Phone number already exists within the same file.';
        }
        if (dup.Email === driver.Email) {
          staffErrors.Email = true;
          staffErrors.EmailMessage = 'Email already exists within the same file.';
        }
        if (dup['Driver ID'] === driver['Driver ID']) {
          staffErrors.ID = true;
          staffErrors.IDMessage = 'Driver ID already exists within the same file.';
        }
      });
    }

    setErrorData((prev) => {
      const updatedErrorData = [...prev];
      updatedErrorData[index] = staffErrors;
      return updatedErrorData;
    });
  };

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return name && nameRegex.test(name.trim());
  };
  
  const validatePhoneNumber = (PhoneNumber) => {
    const phoneRegex = /^\+9665\d{8}$/;
    return phoneRegex.test(PhoneNumber)
      ? null
      : 'Phone number must start with +9665 and be followed by 8 digits.';
  };
  
  const validateEmail = (Email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(Email) ? null : 'Please enter a valid Email.';
  };
  
  const validateStaffID = (StaffID) => {
    const staffIDRegex = /^\d{10}$/;
    return staffIDRegex.test(StaffID)
      ? null
      : 'Driver ID must be 10 digits.';
  };

  const checkUniqueness = async (phone, email, ID) => {
    let result = { PhoneNumber: true, Email: true, ID: true };

    try {
          // Create queries to check for existing phone, email, and staff ID
          const phoneQuery = query(
                  collection(db, 'Driver'),
                  where('PhoneNumber', '==', phone),
                  where('CompanyName', '==', Employer.CompanyName)
                );
          
                const emailQuery = query(
                        collection(db, 'Driver'),
                        where('Email', '==', email)
                      );
                      const idQuery = query(
                              collection(db, 'Driver'),
                              where('DriverID', '==', ID),
                              where('CompanyName', '==', Employer.CompanyName)
                            );    
          // Execute the queries
          const [phoneSnapshot, emailSnapshot, idSnapshot] = await Promise.all([
            getDocs(phoneQuery),
            getDocs(emailQuery),
            getDocs(idQuery),
          ]);
    
          // Check if any of the snapshots have documents
          if (!phoneSnapshot.empty) {
            console.log('Phone number already exists.');
            result = { ...result, PhoneNumber: false };
          }
          if (!emailSnapshot.empty) {
            console.log('Email already exists.');
            result = { ...result, Email: false };
          }
          if (!idSnapshot.empty) {
            console.log('Driver ID already exists.');
            result = { ...result, ID: false };
          }
    
          // If no duplicates are found
          return result;
        } catch (error) {
          console.error('Error checking uniqueness:', error);
          return {
            message: 'Error checking uniqueness in the database.',
          };
        }

    // try {
    //   let queries = [];
    //   let queryMap = {}; // Store which field corresponds to which query
  
    //   if (phone) {
    //     const phoneQuery = query(
    //       collection(db, 'Driver'),
    //       where('PhoneNumber', '==', phone),
    //       where('CompanyName', '==', Employer.CompanyName)
    //     );
    //     queryMap['PhoneNumber'] = getDocs(phoneQuery);
    //     queries.push(queryMap['PhoneNumber']);
    //   }
  
    //   if (email) {
    //     const emailQuery = query(
    //       collection(db, 'Driver'),
    //       where('Email', '==', email)
    //     );
    //     queryMap['Email'] = getDocs(emailQuery);
    //     queries.push(queryMap['Email']);
    //   }
  
    //   if (ID) {
    //     const idQuery = query(
    //       collection(db, 'Driver'),
    //       where('DriverID', '==', ID),
    //       where('CompanyName', '==', Employer.CompanyName)
    //     );
    //     queryMap['ID'] = getDocs(idQuery);
    //     queries.push(queryMap['ID']);
    //   }
  
    //   const snapshots = await Promise.all(queries);
  
    //   // Check snapshots correctly
    //   if (phone && !(await queryMap['PhoneNumber']).empty) {
    //     result.PhoneNumber = false;
    //   }
    //   if (email && !(await queryMap['Email']).empty) {
    //     result.Email = false;
    //   }
    //   if (ID && !(await queryMap['ID']).empty) {
    //     result.ID = false;
    //   }
  
    //   return result;
    // } catch (error) {
    //   console.error('Error checking uniqueness:', error);
    //   return { message: 'Error checking uniqueness in the database.' };
    // }
  };
 
  

  const sendEmail = (email, driverName, password) => {
    // const templateParams = {
    //   to_name: driverName,
    //   to_email: email,
    //   generatedPassword: password,
    // };
    const templateParams = {
      email: email,
      subject: 'Welcome to SAIR!',
      companyName: Employer.ShortCompanyName,
      generatedPassword: password,
    };

    emailjs
      .send(
        'service_ltz361p',
        'template_u0v3anh',
        templateParams,
        '6NEdVNsgOnsmX-H4s'
      )
      .then(
        (response) => {
          console.log('Email sent successfully!', response.status, response.text);
        },
        (error) => {
          console.error('Failed to send email:', error);
        }
      );
  };

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  setFileName(file.name);
  setIsUploadBoxVisible(false);
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target.result;
    const workbook = XLSX.read(data, { type: 'binary' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert the sheet to JSON, using the first row as headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Get rows as an array

    // Validate the header
    const headers = jsonData[0]; // First row contains the headers
    const expectedHeaders = ['First name', 'Last name', 'Mobile Phone Number', 'Email', 'Driver ID'];

    // Check if headers match
    const isValidTemplate = expectedHeaders.every(header => headers.includes(header));
    if (!isValidTemplate) {
      setPopupMessage('The uploaded file does not match the required template.');
      setPopupImage(errorImage);
      setPopupVisible(true);
      setFileData([]); // Clear the previous data
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the file input
      }
      return; // Stop further processing
    }

    // Proceed with the valid data, excluding the headers
    const dataRows = jsonData.slice(1).map(row => {
      return {
        'First name': row[0],
        'Last name': row[1],
        'Mobile Phone Number': row[2],
        'Email': row[3],
        'Driver ID': row[4],
        'GPSnumber': row[5],
      };
    });

    setFileData(dataRows); // Set the processed data
    const initialErrorData = dataRows.map(() => ({
      Fname: false,
      Lname: false,
      PhoneNumber: false,
      Email: false,
      ID: false,
    }));
    setErrorData(initialErrorData);
    validateAllFields(dataRows); // Validate data excluding headers
  };

  reader.readAsBinaryString(file);
};


  const handleRemoveFile = () => {
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileData([]);
    setSelectedGPSNumbers([]);
    // setAvailableMotorcycles([])
    setIsButtonDisabled(true);
    setErrorMessage('');
    setIsUploadBoxVisible(true);
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
  };

  const handleBatchUploadResults = (errorList) => {
//

 const successfulCount = fileData.length - errorList.length;
    if (errorList.length > 0) {
      const errorMessages = errorList.map((err) => err.message).join('\n');
      setPopupMessage(`${errorMessages}\n\nTotal successful additions: ${successfulCount}`);
      setPopupImage(errorImage);
    } else {
      setPopupMessage(`All ${successfulCount} Drivers added successfully!`);
      setPopupImage(successImage);
      setTimeout(() => navigate('/driverslist'), 2000);
    }
    setPopupVisible(true);

  };


  const handleAddDrivers = async () => {
     const hasErrors = errorData.some((staffErrors) =>
          Object.values(staffErrors).some((error) => error)
        );
        if (hasErrors) {
          setPopupMessage('Please fix the errors before adding drivers.');
          setPopupImage(errorImage);
          setPopupVisible(true);
          return;
        }
    
        const errorList = [];
        for (const staff of fileData) {
          try {
            const addedStaff = await addDriverToDatabase(staff);
            sessionStorage.setItem(`driver_${addedStaff.ID}`, addedStaff.ID);
          }  catch (error) {
            errorList.push({
              message: `Error adding driver ${staff['First name']} ${staff['Last name']}: ${error.message}`,
            });
          }
        }
        handleBatchUploadResults(errorList);
      };
    

  const addDriverToDatabase = async (driver) => {
    const {
      'First name': Fname,
      'Last name': Lname,
      'Mobile Phone Number': PhoneNumber,
      Email,
      'GPSnumber': GPSnumber,
      'Driver ID': DriverID,

    } = driver;
    const formattedDriverID = String(DriverID);
    const formattedGPSnumber = GPSnumber === 'None' ? null : GPSnumber;  
    const password = generateRandomPassword();
    // let user;
    try {
      // Attempt to create user in Firebase Authentication
      // const userCredential = await createUserWithEmailAndPassword(auth, Email, password);
      // user = userCredential.user; // Store the user if creation succeeds
   await createUserWithEmailAndPassword(auth, Email, password);

      // Proceed to add to Firestore only if user creation was successful
      const addedDriver = await addDoc(collection(db, 'Driver'), {
        Fname,
        Lname,
        PhoneNumber,
        Email,
        CompanyName: Employer.CompanyName,
        DriverID: formattedDriverID,
        GPSnumber: formattedGPSnumber,  
        available: formattedGPSnumber === null, 
        isDefaultPassword: true,
        // UID: user.uid // Using the user ID from Firebase Authentication
      });

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
            DriverID: DriverID
          });
        }
      }
      sendEmail(Email, `${Fname} ${Lname}`, password);
      return { ID: addedDriver.id, ...driver };

    } catch (error) {
      throw error;
    }
};

useEffect(() => {
   const hasErrors = errorData.some((staffErrors) =>
       Object.values(staffErrors).some((error) => error)
   );

   // If there's valid data and no errors, enable the button
  //  const isValidData = fileData.length === 1 && !hasErrors;

   setIsButtonDisabled(hasErrors);
   setErrorMessage(
       hasErrors
           ? 'Please fix the errors in the table highlighted with red borders.'
           : ''
   );
}, [errorData, fileData]);

    const getFilteredUniqueGPSNumbers = (selectedGPSNumbers) => {
      // Convert the object to an array, filter out 'None', and remove duplicates
      const filteredNumbers = Array.from(new Set(Object.values(selectedGPSNumbers).filter(value => value !== 'None')));
      console.log('fggggggggggggggggggggggggggggggggg',filteredNumbers);
      return filteredNumbers;
    };
  

  return (
    <div style={{ paddingBottom: '40px' }}>
      <Header active='driverslist' />
      <div className='breadcrumb' style={{ marginRight: '100px' }}>
      <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/driverslist')}>Drivers List</a>
        <span> / </span>
        <a onClick={() => navigate('/add-driver')}>Add Driver</a>
        <span> / </span>
        <a onClick={() => navigate('/Adddriverbatch')}>Add Drivers as Batch</a>
      </div>
      <div className={s.container}>
        <h2 className='title'>Add Drivers as Batch</h2>
        <p>
          For a successful drivers addition, please download the drivers batch
          template by{' '}
          <a
            href={templateFile}
            download
            style={{
              cursor: 'pointer',
              color: '#059855',
              textDecoration: 'underline',
            }}
          >
            clicking here
          </a>
          , making sure to follow the required format.
        </p>

        {isUploadBoxVisible && (
          <div
            className={s.fileUploadContainer}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) {
                handleFileUpload({ target: { files: [file] } });
              }
            }}
          >
            <label htmlFor="fileInput" className={s.fileUploadBox}>
              <div className={s.fileUploadContent}>
                <div className={s.uploadIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    color="#000000"
                    fill="none"
                  >
                    <path
                      d="M6.5 2.5C5.3579 2.68817 4.53406 3.03797 3.89124 3.6882C2.5 5.09548 2.5 7.36048 2.5 11.8905C2.5 16.4204 2.5 18.6854 3.89124 20.0927C5.28249 21.5 7.52166 21.5 12 21.5C16.4783 21.5 18.7175 21.5 20.1088 20.0927C21.5 18.6854 21.5 16.4204 21.5 11.8905C21.5 7.36048 21.5 5.09548 20.1088 3.6882C19.4659 3.03797 18.6421 2.68817 17.5 2.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.5 5C9.99153 4.4943 11.2998 2.5 12 2.5M14.5 5C14.0085 4.4943 12.7002 2.5 12 2.5M12 2.5V10.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21.5 13.5H16.5743C15.7322 13.5 15.0706 14.2036 14.6995 14.9472C14.2963 15.7551 13.4889 16.5 12 16.5C10.5111 16.5 9.70373 15.7551 9.30054 14.9472C8.92942 14.2036 8.26777 13.5 7.42566 13.5H2.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p>Drag & drop a file here</p>
                <p>
                  or <span className={s.browseText}>browse file</span> from device
                </p>
              </div>
            </label>
            <input
              ref={fileInputRef}
              id="fileInput"
              type="file"
              onChange={handleFileUpload}
              accept=".xls,.xlsx"
              className={s.hiddenInput}
            />
          </div>
        )}
        {fileName && (
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '8px', border: '1px solid #059855', padding: '8px' }}>
            <span style={{ marginRight: '10px', fontSize: '14px', alignItems: 'center', justifyContent: 'center' }}>{fileName}</span>
            <FaTrash
              onClick={handleRemoveFile}
              style={{ color: '#059855', cursor: 'pointer', fontSize: '20px' }}
              title="Remove file"
            />
          </div>
        )}

        {fileData.length > 0 && (
          <div style={{ marginBottom: '5px' }}>
            {errorMessage && (
              <p style={{ color: 'red', margin: '10px 0' }}>
                {errorMessage} <br />
                You can hover over a specific cell to see the error.
              </p>
            )}
            <table style={{ marginTop: '15px' }}>
              <thead>
                <tr>
                  <th style={{ color: '#059855' }}>First Name</th>
                  <th style={{ color: '#059855' }}>Last Name</th>
                  <th style={{ color: '#059855' }}>Phone Number</th>
                  <th style={{ color: '#059855' }}>Email</th>
                  <th style={{ color: '#059855' }}>ID</th>
                  <th style={{ color: '#059855' }}>GPS Number</th>
                  <th style={{ color: '#059855' }}>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
  {fileData.map((driver, index) => (
    <tr key={index}>
      <td>
        <input
          type='text'
          value={driver['First name'] || ''}
          onChange={(e) =>
            handleInputChange(index, 'First name', e.target.value)
          }
          style={{
            borderColor: errorData[index]?.Fname ? 'red' : '#059855',
            boxShadow: errorData[index]?.Fname ? '0 0 5px red' : 'none',
            outline: 'none',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
          title={errorData[index]?.Fname ? errorData[index]?.FnameMessage : ''}
        />
      </td>
      <td>
        <input
          type='text'
          value={driver['Last name'] || ''}
          onChange={(e) =>
            handleInputChange(index, 'Last name', e.target.value)
          }
          style={{
            borderColor: errorData[index]?.Lname ? 'red' : '#059855',
            boxShadow: errorData[index]?.Lname ? '0 0 5px red' : 'none',
            outline: 'none',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
          title={errorData[index]?.Lname ? errorData[index]?.LnameMessage : ''}
        />
      </td>
      <td>
        <input
          type='text'
          value={driver['Mobile Phone Number'] || ''}
          onChange={(e) =>
            handleInputChange(index, 'Mobile Phone Number', e.target.value)
          }
          style={{
            borderColor: errorData[index]?.PhoneNumber ? 'red' : '#059855',
            boxShadow: errorData[index]?.PhoneNumber ? '0 0 5px red' : 'none',
            outline: 'none',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
          title={errorData[index]?.PhoneNumber ? errorData[index]?.PhoneNumberMessage : ''}
        />
      </td>
      <td>
        <input
          type='email'
          value={driver.Email || ''}
          onChange={(e) =>
            handleInputChange(index, 'Email', e.target.value)
          }
          style={{
            borderColor: errorData[index]?.Email ? 'red' : '#059855',
            boxShadow: errorData[index]?.Email ? '0 0 5px red' : 'none',
            outline: 'none',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
          title={errorData[index]?.Email ? errorData[index]?.EmailMessage : ''}
        />
      </td>
      <td>
        <input
          type='text'
          value={driver['Driver ID'] || ''}
          onChange={(e) =>
            handleInputChange(index, 'Driver ID', e.target.value)
          }
          style={{
            borderColor: errorData[index]?.ID ? 'red' : '#059855',
            boxShadow: errorData[index]?.ID ? '0 0 5px red' : 'none',
            outline: 'none',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
          title={errorData[index]?.ID ? errorData[index]?.IDMessage : ''}
        />
      </td>
      <td>
      <select
  name="GPSnumber"
  value={driver?.GPSnumber || ""}
  onChange={(e) => handleInputChangeGPS(index, e.target.value, driver)}
  style={{
    borderColor: errorData?.[index]?.GPSnumber ? 'red' : '#059855',
    boxShadow: errorData?.[index]?.GPSnumber ? '0 0 5px red' : 'none',
    outline: 'none',
    transition: 'border-color 0.3s, box-shadow 0.3s',
    minWidth: "170px",
    maxWidth: "170px",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }}
  title={errorData?.[index]?.GPSnumber ? errorData?.[index]?.GPSnumberMessage : ''}
>
<option value="" disabled>Select a Motorcycle</option>
  <option value="None">None</option>

  {/* Show previously selected GPS number */}
  {driver?.GPSnumber && driver.GPSnumber !== "None" && (
    <option value={driver.GPSnumber}>{driver.GPSnumber}</option>
  )}

  {/* Only show unselected GPS numbers */}
  {availableMotorcycles
    .filter((item) => !Object.values(selectedGPSNumbers).includes(item.GPSnumber))
    .map((item) => (
      <option key={item.id} value={item.GPSnumber}>
        {item.GPSnumber}
      </option>
    ))}

  {/* Display when no motorcycles are available */}
  {availableMotorcycles.length === getFilteredUniqueGPSNumbers(selectedGPSNumbers).length && (
    <option disabled>No motorcycles available</option>
  )}
</select>


      </td>


      <td style={{ textAlign: 'center' }}>
        {errorData[index]?.Fname ||
        errorData[index]?.Lname ||
        errorData[index]?.PhoneNumber ||
        errorData[index]?.Email ||
        errorData[index]?.GPSnumber||
        errorData[index]?.ID ? (
          <FaTimes
            style={{
              color: 'red',
              marginLeft: '10px',
              marginTop: '5px',
            }}
            title='Not Valid'
          />
        ) : (
          <FaCheck
            style={{
              color: 'green',
              marginLeft: '10px',
              marginTop: '5px',
            }}
            title='Valid'
          />
        )}
      </td>
      <td>
  <button
    style={{
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: 'red',
    }}
    onClick={() => {
      setDriverToRemove(driver); // Set the staff member to be removed
      setIsDeletePopupVisible(true); // Show the confirmation modal
    }}
  >
    <FaTrash />
  </button>
</td>
    </tr>
  ))}
</tbody>

{/* Delete Confirmation Modal */}
<Modal
  visible={isDeletePopupVisible}
  onCancel={() => setIsDeletePopupVisible(false)}
  title="Confirm Deletion"
  style={{ top: '38%' }}
  footer={[
    <Button key="no" onClick={() => setIsDeletePopupVisible(false)}>
      No
    </Button>,
    <Button key="yes" type="primary" danger  onClick={() => {
      handleDeleteDrivers(fileData.indexOf(driverToRemove)); 
    }}>
      Yes
    </Button>,
  ]}
  className="custom-modal"
  closeIcon={
    <span className="custom-modal-close-icon">×</span>
  }
>
  <div>
    <p>
      Are you sure you want to delete {driverToRemove?.['First name']} {driverToRemove?.['Last name']}?
    </p>
  </div>
</Modal>
            </table>

            <button
              onClick={() => navigate('/add-driver')} // Navigate to d List page
              style={{
                borderRadius: '5px',
                backgroundColor: '#059855',
                border: 'none',
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                marginTop: '20px',
                color: 'white',
                marginRight: '10px',
                fontFamily: 'Open Sans',
              }}
            >
              Cancel
            </button>

            <button
              disabled={isButtonDisabled}
              onClick={handleAddDrivers}
              className={s.editBtn}
              style={{
                marginBottom: '40px',
                borderRadius: '5px',
                backgroundColor: '#059855',
                border: 'none',
                padding: '10px 20px',
                fontSize: '16px',
                
              }}
            >
              Add to Drivers List
            </button>
          </div>
        )}

 {popupVisible && (
          <Modal
            title={null}
            visible={popupVisible}
            onCancel={handleClosePopup}
            footer={<p style={{ textAlign: 'center' }}>{popupMessage}</p>}
            style={{ top: '38%' }}
            className='custom-modal'
            closeIcon={<span className='custom-modal-close-icon'>×</span>}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <img
                src={popupImage}
                alt='Popup'
                style={{ width: '20%', marginBottom: '16px' }}
              />
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Adddriverbatch;