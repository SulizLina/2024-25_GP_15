import React, { useEffect, useState,useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Modal, Tooltip  } from 'antd';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FaTrash } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import Header from './GDTHeader';
import s from '../../css/Profile.module.css';
import successImage from '../../images/Sucess.png';
import errorImage from '../../images/Error.png';
import { useNavigate } from 'react-router-dom';
import emailjs from 'emailjs-com';
import { generateRandomPassword } from '../../utils/common';
import templateFile from './template.xlsx';
import { FaCheck, FaTimes } from 'react-icons/fa';

const GDTAddStaffBatch = () => {
  const [fileData, setFileData] = useState([]);
  const [errorData, setErrorData] = useState([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupImage, setPopupImage] = useState('');
  const [fileName, setFileName] = useState('');
  const navigate = useNavigate();
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUploadBoxVisible, setIsUploadBoxVisible] = useState(true);
  const fileInputRef = useRef(null);

  const handleInputChange = (index, field, value) => {
    const updatedFileData = [...fileData];
    updatedFileData[index] = { ...updatedFileData[index], [field]: value };
    setFileData(updatedFileData);
    validateAllFields(updatedFileData);
  };

  const validateAllFields = async (updatedData) => {
    updatedData.map((staff, index) =>
      validateStaffMember(staff, index, updatedData)
    );
  };

const validateStaffMember = async (staff, index, allStaff) => {
  const staffErrors = {
    Fname: false,
    Lname: false,
    PhoneNumber: false,
    Email: false,
    ID: false,
    FnameMessage: '',
    LnameMessage: '',
    PhoneNumberMessage: '',
    EmailMessage: '',
    IDMessage: '',
  };

  // Validate First Name
  if (!staff['First name']) {
    staffErrors.Fname = true;
    staffErrors.FnameMessage = 'First name is required.';
  } else if (!validateName(staff['First name'])) {
    staffErrors.Fname = true;
    staffErrors.FnameMessage = 'Name must contain letters only.';
  }

  // Validate Last Name
  if (!staff['Last name']) {
    staffErrors.Lname = true;
    staffErrors.LnameMessage = 'Last name is required.';
  } else if (!validateName(staff['Last name'])) {
    staffErrors.Lname = true;
    staffErrors.LnameMessage = 'Name must contain letters only.';
  }

  // Validate Phone Number
  if (!staff['Mobile Phone Number']) {
    staffErrors.PhoneNumber = true;
    staffErrors.PhoneNumberMessage = 'Phone number is required.';
  } else {
    const phoneValidation = validatePhoneNumber(staff['Mobile Phone Number']);
    if (phoneValidation) {
      staffErrors.PhoneNumber = true;
      staffErrors.PhoneNumberMessage = phoneValidation;
    }
  }

  // Validate Email
  if (!staff.Email) {
    staffErrors.Email = true;
    staffErrors.EmailMessage = 'Email is required.';
  } else {
    const emailValidation = validateEmail(staff.Email);
    if (emailValidation) {
      staffErrors.Email = true;
      staffErrors.EmailMessage = emailValidation;
    }
  }

  // Validate Staff ID
  if (!staff['Staff ID']) {
    staffErrors.ID = true;
    staffErrors.IDMessage = 'Staff ID is required.';
  } else {
    const idValidation = validateStaffID(staff['Staff ID']);
    if (idValidation) {
      staffErrors.ID = true;
      staffErrors.IDMessage = idValidation;
    }
  }

  // Unique validation against the database
  const uniquenessResult = await checkUniqueness(
    staff['Mobile Phone Number'],
    staff.Email,
    staff['Staff ID']
  );

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
    staffErrors.IDMessage = 'Staff ID already exists.';
  }

  // Check for duplicates within the uploaded file
  const duplicates = allStaff.filter(
    (s, i) =>
      i !== index &&
      (s['Mobile Phone Number'] === staff['Mobile Phone Number'] ||
        s.Email === staff.Email ||
        s['Staff ID'] === staff['Staff ID'])
  );

  if (duplicates.length > 0) {
    duplicates.forEach((dup) => {
      if (dup['Mobile Phone Number'] === staff['Mobile Phone Number']) {
        staffErrors.PhoneNumber = true;
        staffErrors.PhoneNumberMessage = 'Phone number already exists within the same file.';
      }
      if (dup.Email === staff.Email) {
        staffErrors.Email = true;
        staffErrors.EmailMessage = 'Email already exists within the same file.';
      }
      if (dup['Staff ID'] === staff['Staff ID']) {
        staffErrors.ID = true;
        staffErrors.IDMessage = 'Staff ID already exists within the same file.';
      }
    });
  }

  setErrorData((prev) => {
    const updatedErrorData = [...prev];
    updatedErrorData[index] = staffErrors;
    return updatedErrorData;
  });
};

  const validatePhoneNumber = (PhoneNumber) => {
    const phoneRegex = /^\+9665\d{8}$/;
    return phoneRegex.test(PhoneNumber)
      ? null
      : 'Phone number must start with +9665 and be followed by 8 digits.';
  };

  const validateName = (name) => {
    // Regular expression to match only letters and spaces
    const nameRegex = /^[a-zA-Z\s]+$/;
    return name && nameRegex.test(name.trim());
  };

  const validateEmail = (Email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(Email) ? null : 'Please enter a valid Email.';
  };

  const validateStaffID = (StaffID) => {
    const staffIDRegex = /^\d{10}$/;
    return staffIDRegex.test(StaffID) ? null : 'Staff ID must be 10 digits.';
  };

  const checkUniqueness = async (phone, email, staffID) => {
    // console.log('Checking uniqueness for:', { phone, email, staffID });

    let result = { PhoneNumber: true, Email: true, ID: true };

    try {
      // Create queries to check for existing phone, email, and staff ID
      const phoneQuery = query(
        collection(db, 'GDT'),
        where('PhoneNumber', '==', phone)
      );
      const emailQuery = query(
        collection(db, 'GDT'),
        where('GDTEmail', '==', email)
      );
      const idQuery = query(collection(db, 'GDT'), where('ID', '==', staffID));

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
        console.log('Staff ID already exists.');
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
  };

  const handleBatchUploadResults = (errorList) => {
    const successfulCount = fileData.length - errorList.length;
    if (errorList.length > 0) {
      const errorMessages = errorList.map((err) => err.message).join('\n');
      setPopupMessage(`${errorMessages}\n\nTotal successful additions: ${successfulCount}`);
      setPopupImage(errorImage);
    } else {
      setPopupMessage(`All ${successfulCount} staff added successfully!`);
      setPopupImage(successImage);
      setTimeout(() => navigate('/gdtstafflist'), 2000);
    }
    setPopupVisible(true);
  };

  const sendEmail = (email, staffName, password) => {
    const templateParams = {
      to_name: staffName,
      to_email: email,
      generatedPassword: password,
    };
  
    emailjs
      .send('service_ltz361p', 'template_gd1x3q7', templateParams, '6NEdVNsgOnsmX-H4s')
      .then((response) => {
        console.log('Email sent successfully!', response.status, response.text);
      })
      .catch((error) => {
        console.error('Failed to send email:', error);
      });
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
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Get rows as array

    // Validate the header
    const headers = jsonData[0]; // First row contains the headers
    const expectedHeaders = ['First name', 'Last name', 'Mobile Phone Number', 'Email', 'Staff ID'];

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
        'Staff ID': row[4],
      };
    });

    setFileData(dataRows); // Set the processed data
      const initialErrorData = jsonData.map(() => ({
        Fname: false,
        Lname: false,
        PhoneNumber: false,
        Email: false,
        ID: false,
      }));
      console.log('Initial error data:', initialErrorData);
      setErrorData(initialErrorData);

      validateAllFields(dataRows);
    };
    reader.readAsBinaryString(file);
  };

  const handleRemoveFile = () => {
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileData([]);
    setIsButtonDisabled(true); // Disable button when file is removed
    setErrorMessage(''); // Clear error message
    setIsUploadBoxVisible(true);
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
  };

  const handleAddStaff = async () => {
    const hasErrors = errorData.some((staffErrors) =>
      Object.values(staffErrors).some((error) => error)
    );
    if (hasErrors) {
      setPopupMessage('Please fix the errors before adding staff.');
      setPopupImage(errorImage);
      setPopupVisible(true);
      return;
    }

    const errorList = [];
    for (const staff of fileData) {
      try {
        const addedStaff = await addStaffToDatabase(staff);
        // Store the staff ID in sessionStorage
        sessionStorage.setItem(`staff_${addedStaff.ID}`, addedStaff.ID);
      } catch (error) {
        errorList.push({
          message: `Error adding staff ${staff['First name']} ${staff['Last name']}: ${error.message}`,
        });
      }
    }
    handleBatchUploadResults(errorList);
  };

  const addStaffToDatabase = async (staff) => {
    const {
      'First name': Fname,
      'Last name': Lname,
      'Mobile Phone Number': PhoneNumber,
      Email,
      'Staff ID': ID,
    } = staff;
    const password = generateRandomPassword();
    try {
      await createUserWithEmailAndPassword(auth, Email, password);
      const addedDoc = await addDoc(collection(db, 'GDT'), {
        Fname,
        Lname,
        PhoneNumber,
        GDTEmail: Email,
        ID,
        isAdmin: false,
        isDefaultPassword: true,
      });
      sendEmail(Email, `${Fname} ${Lname}`, password);
      // Return the added staff data along with the ID
      return { ID: addedDoc.id, ...staff }; // Return the added document ID
    } catch (error) {
      throw error; // Re-throw the error to be caught in handleAddStaff
    }
  };
  

  useEffect(() => {
    // Validate only when fileData changes
    const hasErrors = errorData.some((staffErrors) =>
      Object.values(staffErrors).some((error) => error)
    );

    setIsButtonDisabled(hasErrors);
    setErrorMessage(
      hasErrors
        ? 'Please fix the errors in the table highlighted with red borders.'
        : ''
    );
  }, [errorData, fileData]);

  return (
    <div style={{ paddingBottom: '40px' }}>
      <Header active='gdtstafflist' />
      <div className='breadcrumb' style={{ marginRight: '100px' }}>
        <a onClick={() => navigate('/gdthome')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/gdtstafflist')}>Staff List</a>
        <span> / </span>
        <a onClick={() => navigate('/gdtaddstaff')}>Add Staff</a>
        <span> / </span>
        <a onClick={() => navigate('/gdtaddstaffbatch')}>Add Staff as Batch</a>
      </div>
      <div className={s.container}>
        <h2 className='title'>Add Staff as Batch</h2>
        <p>
          For a successful staff addition, please download the staff batch
          template by clicking here,{' '}
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
            <table>
              <thead>
                <tr>
                  <th style={{ color: '#059855' }}>First Name</th>
                  <th style={{ color: '#059855' }}>Last Name</th>
                  <th style={{ color: '#059855' }}>Phone Number</th>
                  <th style={{ color: '#059855' }}>Email</th>
                  <th style={{ color: '#059855' }}>ID</th>
                  <th style={{ color: '#059855' }}>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
              {fileData.map((staff, index) => (
                  <tr key={index}>
                    <td>
                        <input
                          type='text'
                          value={staff['First name'] || ''}
                          onChange={(e) => handleInputChange(index, 'First name', e.target.value)}
                          style={{
                            borderColor: errorData[index]?.Fname ? 'red' : '#059855',
                            outline: 'none',
                            transition: 'border-color 0.3s',
                          }}
                          title={errorData[index]?.Fname ? errorData[index].FnameMessage : ''}
                        />
                    </td>
                    <td>
                      
                        <input
                          type='text'
                          value={staff['Last name'] || ''}
                          onChange={(e) => handleInputChange(index, 'Last name', e.target.value)}
                          style={{
                            borderColor: errorData[index]?.Lname ? 'red' : '#059855',
                            outline: 'none',
                            transition: 'border-color 0.3s',
                          }}
                          title={errorData[index]?.Lname ? errorData[index].LnameMessage : ''}
                        />
                      
                    </td>
                    <td>
                        <input
                          type='text'
                          value={staff['Mobile Phone Number'] || ''}
                          onChange={(e) => handleInputChange(index, 'Mobile Phone Number', e.target.value)}
                          style={{
                            borderColor: errorData[index]?.PhoneNumber ? 'red' : '#059855',
                            outline: 'none',
                            transition: 'border-color 0.3s',
                          }}
                          title={errorData[index]?.PhoneNumber ? errorData[index].PhoneNumberMessage : ''}
                        />
                      
                    </td>
                    <td>
                        <input
                          type='email'
                          value={staff.Email || ''}
                          onChange={(e) => handleInputChange(index, 'Email', e.target.value)}
                          style={{
                            borderColor: errorData[index]?.Email ? 'red' : '#059855',
                            outline: 'none',
                            transition: 'border-color 0.3s',
                          }}
                          title={errorData[index]?.Email ? errorData[index].EmailMessage : ''}
                        />
                     
                    </td>
                    <td>
                        <input
                          type='text'
                          value={staff['Staff ID'] || ''}
                          onChange={(e) => handleInputChange(index, 'Staff ID', e.target.value)}
                          style={{
                            borderColor: errorData[index]?.ID ? 'red' : '#059855',
                            outline: 'none',
                            transition: 'border-color 0.3s',
                          }}
                          title={errorData[index]?.ID ? errorData[index].IDMessage : ''}
                        />
                      
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {errorData[index]?.Fname || errorData[index]?.Lname || errorData[index]?.PhoneNumber || errorData[index]?.Email || errorData[index]?.ID ? (
                        <FaTimes style={{ color: 'red', marginLeft: '10px', marginTop: '5px' }} title='Not Valid' />
                      ) : (
                        <FaCheck style={{ color: 'green', marginLeft: '10px', marginTop: '5px' }} title='Valid' />
                      )}
                    </td>
                    <td>
                      {/* delet icon */}
                      <button
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'red',
                        }}
                        onClick={() => {
                          const newFileData = [...fileData];
                          newFileData.splice(index, 1);
                          setFileData(newFileData);
                          setErrorData((prev) => {
                            const updatedErrorData = [...prev];
                            updatedErrorData.splice(index, 1);
                            return updatedErrorData;
                          });
                        }}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
 
            {true&& (
              <button
                onClick={() => navigate('/gdtaddstaff')} // Navigate to Staff List page
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
            )}

<button
  onClick={handleAddStaff} 
  disabled={isButtonDisabled}
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
  Add to Staff List
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

export default GDTAddStaffBatch;
