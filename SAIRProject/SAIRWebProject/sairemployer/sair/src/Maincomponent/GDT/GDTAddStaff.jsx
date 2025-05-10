import React, { useState } from 'react';
import { db,auth } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Modal } from 'antd';
import { FaTrash } from 'react-icons/fa'; 
import * as XLSX from 'xlsx';
import Header from './GDTHeader';
import s from "../../css/Profile.module.css";
import successImage from '../../images/Sucess.png';
import errorImage from '../../images/Error.png';
import { useNavigate } from 'react-router-dom';
import emailjs from 'emailjs-com';
import { generateRandomPassword } from '../../utils/common';

const GDTAddStaff = () => {
    const [manualStaff, setManualStaff] = useState({
        Fname: '',
        Lname: '',
        PhoneNumber: '+966',
        Email: '',
        ID: '',
    });
    const navigate = useNavigate();
    const [fileData, setFileData] = useState([]);
    const [validationMessages, setValidationMessages] = useState({});
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [popupImage, setPopupImage] = useState('');
    const [fileName, setFileName] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'PhoneNumber') {
            if (value.startsWith('+966')) {
                if (value === '+9660') {
                    return; 
                }
                setManualStaff({ ...manualStaff, PhoneNumber: value });
            } else {
                setManualStaff({ ...manualStaff, PhoneNumber: '+966' + value.replace(/\+966/g, '') });
            }
        } else {
            setManualStaff({ ...manualStaff, [name]: value });
        }

        const error = validateInput(name, value);
        setValidationMessages((prevMessages) => ({
            ...prevMessages,
            [name]: error,
        }));
    };

    const validateInput = (name, value) => {
        switch (name) {
            case 'Fname':
                return value.trim() === '' ? 'First name is required.' : '';
            case 'Lname':
                return value.trim() === '' ? 'Last name is required.' : '';
            case 'PhoneNumber':
                return validatePhoneNumber(value);
            case 'Email':
                return validateEmail(value);
            case 'ID':
                return validateStaffID(value);
            default:
                return '';
        }
    };

    const validatePhoneNumber = (PhoneNumber) => {
        const phoneRegex = /^\+9665\d{8}$/;
        return phoneRegex.test(PhoneNumber) ? null : 'Phone number must start with +9665 and be followed by 8 digits.';
    };

    const validateEmail = (Email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(Email) ? null : 'Please enter a valid Email.';
    };

    const validateStaffID = (StaffID) => {
        const staffIDRegex = /^\d{10}$/; // Must be exactly 10 digits
        return staffIDRegex.test(StaffID) ? null : 'Staff ID must be 10 digits.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let isValid = true;
        let newValidationMessages = {};

        const { Fname, Lname, PhoneNumber, Email, ID } = manualStaff;

        if (!Fname) {
            newValidationMessages.Fname = 'Please enter staff first name.';
            isValid = false;
        }

        if (!Lname) {
            newValidationMessages.Lname = 'Please enter staff last name.';
            isValid = false;
        }

        if (!PhoneNumber || PhoneNumber === '+966') {
            newValidationMessages.PhoneNumber = 'Please enter staff phone number.';
            isValid = false;
        } else {
            const phoneValidation = validatePhoneNumber(PhoneNumber);
            if (phoneValidation) {
                newValidationMessages.PhoneNumber = phoneValidation;
                isValid = false;
            }
        }

        if (!Email) {
            newValidationMessages.Email = 'Please enter Email.';
            isValid = false;
        } else {
            const emailValidation = validateEmail(Email);
            if (emailValidation) {
                newValidationMessages.Email = emailValidation;
                isValid = false;
            }
        }

        const staffIDValidation = validateStaffID(ID);
        if (staffIDValidation) {
            newValidationMessages.ID = staffIDValidation;
            isValid = false;
        }

        setValidationMessages(newValidationMessages);

        if (isValid) {
            const uniqueValidationResult = await checkUniqueness(PhoneNumber, Email, ID);
            if (!uniqueValidationResult.isUnique) {
                setPopupMessage(uniqueValidationResult.message);
                setPopupImage(errorImage);
                setPopupVisible(true);
                return;
            }

            try {
                const password = generateRandomPassword();
                // Create user with email and password
                await createUserWithEmailAndPassword(auth, Email, password);

                const addedStaff = await addDoc(collection(db, 'GDT'), {
                    Fname,
                    Lname,
                    GDTEmail: Email,
                    PhoneNumber,
                    ID,
                    isAdmin: false,
                    isDefaultPassword: true,
                });
                // Store the added staff ID in session storage
                sessionStorage.setItem(`staff_${addedStaff.id}`, addedStaff.id);

                setPopupMessage("Staff added successfully!");
                setPopupImage(successImage);
                //setManualStaff({ Fname: '', Lname: '', PhoneNumber: '+966', Email: '', StaffID: '' });
                setValidationMessages({});
                 // Send welcome email
                 sendEmail(Email, `${Fname} ${Lname}`, password);
                setTimeout(() => {
                    navigate('/gdtstafflist'); 
                  }, 2000);
            } catch (error) {
                console.error('Error adding staff:', error);
                setPopupMessage("Email already exists.");
                setPopupImage(errorImage);
            }
            setPopupVisible(true);
        }
    };

const checkUniqueness = async (phone, email, staffID) => {
    const phoneQuery = query(collection(db, 'GDT'), where("PhoneNumber", "==", phone));
    const emailQuery = query(collection(db, 'GDT'), where("GDTEmail", "==", email));
    const staffIDQuery = query(collection(db, 'GDT'), where("ID", "==", staffID));

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

    const staffIDSnapshot = await getDocs(staffIDQuery);
    if (!staffIDSnapshot.empty) {
        return {
            isUnique: false,
            message: "Staff ID already exists."
        };
    }

    return { isUnique: true, message: "" };
};

const sendEmail = (email, staffName, password) => {
    const templateParams = {
        to_name: staffName,
        to_email: email,
        generatedPassword:password,
    };

    emailjs.send('service_ltz361p', 'template_gd1x3q7', templateParams, '6NEdVNsgOnsmX-H4s')
        .then((response) => {
            console.log('Email sent successfully!', response.status, response.text);
        }, (error) => {
            console.error('Failed to send email:', error);
        });
};

const handleBatchUpload = async (staffArray) => {
    const errorList = [];

    for (const staff of staffArray) {
        const { Fname, Lname, PhoneNumber, Email, ID } = staff;

        if (!Fname || !Lname || !PhoneNumber || !Email || !ID) {
            errorList.push({ staff, message: 'All fields are required.' });
            continue;
        }

        const phoneValidation = validatePhoneNumber(PhoneNumber);
        if (phoneValidation) {
            errorList.push({ staff, message: `Error adding ${Fname} ${Lname}: ${phoneValidation}` });
            continue;
        }

        const emailValidation = validateEmail(Email);
        if (emailValidation) {
            errorList.push({ staff, message: `Error adding ${Fname} ${Lname}: ${emailValidation}` });
            continue;
        }

        const staffIDValidation = validateStaffID(ID);
        if (staffIDValidation) {
            errorList.push({ staff, message: `Error adding ${Fname} ${Lname}: ${staffIDValidation}` });
            continue;
        }   

        const uniqueValidationResult = await checkUniqueness(PhoneNumber, Email, ID);
        if (!uniqueValidationResult.isUnique) {
            errorList.push({ staff, message: `Error adding ${Fname} ${Lname}: ${uniqueValidationResult.message}` });
            continue;
        }

        try {
            const password = generateRandomPassword();
            // Create user with email and password
            await createUserWithEmailAndPassword(auth, Email, password);

            await addDoc(collection(db, 'GDT'), {
                Fname,
                Lname,
                GDTEmail: Email,
                PhoneNumber,
                ID,
                isAdmin: false,
                isDefaultPassword: true,
            });
            // Send welcome email for each staff member
            sendEmail(Email, `${Fname} ${Lname}`, password);
        } catch (error) {
            // Capture the specific error message, if available
            let errorMessage = error.message || "Failed to create user.";
            errorList.push({ staff, message: `Error adding ${Fname} ${Lname}: ${errorMessage}` });
        }
    }

    if (errorList.length > 0) {
        const errorMessages = errorList.map(err => err.message).join('\n'); // Join messages with newline
        setPopupMessage(`Some staff could not be added:\n${errorMessages}`); // Add a newline after the main message
        setPopupImage(errorImage);
        setPopupVisible(true);
        console.error("Errors during batch addition:", errorList)
    } else {
        setPopupMessage("All staff added successfully!");
        setPopupImage(successImage);
        setPopupVisible(true);
        setTimeout(() => {
                navigate('/gdtstafflist'); 
              }, 2000);
    }
};

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            setFileData(jsonData);
        };
        reader.readAsBinaryString(file);
    };

    const handleRemoveFile = () => {
        setFileName('');
        document.getElementById('fileInput').value = '';
        setFileData([]);
    };

    const handleClosePopup = () => {
        setPopupVisible(false);
    };
//
    return (        
        <div>   
            <Header active="gdtstafflist" />
            <div className="breadcrumb" style={{ marginRight: '100px' }}>
        <a onClick={() => navigate('/gdthome')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/gdtstafflist')}>Staff List</a>
        <span> / </span>
        <a onClick={() => navigate('/gdtaddstaff')}>Add Staff</a>
      </div>
            <div className={s.container}>
                <h2 className='title'>Add Staff</h2>
                
                {fileData.length === 0 ? (
                    <form onSubmit={handleSubmit} className={s.form}>
                        <div className={s.formRow}>
                            <div>
                                <label>First Name</label>
                                <input type="text" name="Fname" value={manualStaff.Fname} onChange={handleInputChange} className={s.inputField} />
                                {validationMessages.Fname && <p className={s.valdationMessage}>{validationMessages.Fname}</p>}
                            </div>
                            <div>
                                <label>Last Name</label>
                                <input type="text" name="Lname" value={manualStaff.Lname} onChange={handleInputChange} className={s.inputField} />
                                {validationMessages.Lname && <p className={s.valdationMessage}>{validationMessages.Lname}</p>}
                            </div>
                        </div>
                        <div className={s.formRow}>
                            <div>
                                <label>Phone Number</label>
                                <input name="PhoneNumber" value={manualStaff.PhoneNumber} onChange={handleInputChange} className={s.inputField} />
                                {validationMessages.PhoneNumber && <p className={s.valdationMessage}>{validationMessages.PhoneNumber}</p>}
                            </div>
                            <div>
                                <label>Email</label>
                                <input name="Email" value={manualStaff.Email} onChange={handleInputChange} className={s.inputField} />
                                {validationMessages.Email && <p className={s.valdationMessage}>{validationMessages.Email}</p>}
                            </div>
                        </div>
                        <div className={s.formRow}>
                            <div>
                                <label>Staff ID</label>
                                <input type="text" name="ID" value={manualStaff.ID} onChange={handleInputChange} className={s.inputField} />
                                {validationMessages.ID && <p className={s.valdationMessage}>{validationMessages.ID}</p>}
                            </div>
                        </div>
                        <div>
                        <p style={{ marginTop: '10px' }}>
  Alternatively, you can add staff as a batch to the staff list. To proceed,{'  '}
  <span 
    onClick={() => navigate('/gdtaddstaffbatch')} 
    style={{ cursor: 'pointer', color: '#059855', textDecoration: 'underline' }}
  >
    click here
  </span>.
</p>
<button
                                onClick={() => { navigate('/gdtstafflist');}}
                                className={s.profileCancel}
                               
                            >
                                Cancel
                            </button>
                            <button type="submit" className={s.editBtn}>Add Staff</button>
                                                 </div>
                    </form>
                ) : (
                <div>
                        //<button onClick={() => handleBatchUpload(fileData)} className={s.editBtn} style={{marginBottom:"10px"}}>
                        //    Add All Staff from File
                        //</button>
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
export default GDTAddStaff;

