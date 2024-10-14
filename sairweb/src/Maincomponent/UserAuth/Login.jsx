import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { db } from '../../firebase'; 
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; 
import '../../App.css'; 
import successImage from '../../images/Sucess.png'; 
import errorImage from '../../images/Error.png'; 
import backgroundImage from '../../images/Background.png'; 
const Login = () => {
    const navigate = useNavigate(); 
    const [role, setRole] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [commercialRegNumber, setCommercialRegNumber] = useState('');
    const [showPassword, setShowPassword] = useState(false); // State for password visibility
    const [errors, setErrors] = useState({
        phoneStartError: '',
        phoneLengthError: '',
        commercialError: '',
    });
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [popupImage, setPopupImage] = useState('');

    useEffect(() => {
        validatePhoneNumber(phoneNumber);
    }, [phoneNumber]);

    useEffect(() => {
        if (role === 'employee' && commercialRegNumber.length > 0) {
            validateCommercialRegNumber(commercialRegNumber);
        } else {
            setErrors((prev) => ({ ...prev, commercialError: '' }));
        }
    }, [commercialRegNumber, role]);

    const handleRoleChange = (event) => {
        const selectedRole = event.target.value;
        setRole(selectedRole);
        setPhoneNumber('');
        setCommercialRegNumber('');
        setPassword(''); // Clear password
        setErrors({ phoneStartError: '', phoneLengthError: '', commercialError: '' });
    };

    const validatePhoneNumber = (phoneValue) => {
        let phoneStartError = '';
        let phoneLengthError = '';

        // Check if the phone number starts with +9665
        if (!phoneValue.startsWith('+9665') && phoneValue.length > 0) {
            phoneStartError = 'Phone number must start with +9665.';
        }
        
        // Ensure the phone number has exactly 13 digits
        if (phoneValue.length !== 13 && phoneValue.length > 0) {
            phoneLengthError = 'Phone number must be exactly 13 digits.';
        }

        setErrors((prev) => ({
            ...prev,
            phoneStartError,
            phoneLengthError,
        }));
    };

    const validateCommercialRegNumber = (commercialValue) => {
        const commercialError = commercialValue.length === 10 ? '' : 'Commercial registration number must be exactly 10 digits.';
        setErrors((prev) => ({
            ...prev,
            commercialError,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        // Validate errors
        if (!errors.phoneStartError && !errors.phoneLengthError && !errors.commercialError) {
            try {
                let userFound = false;
    
                // Check for Admin and Staff users
                if (role === 'gdtAdmin' || role === 'gdtStaff') {
                    const q = query(collection(db, 'GDT'), where('PhoneNumber', '==', phoneNumber));
                    const querySnapshot = await getDocs(q);
                    
                    if (!querySnapshot.empty) {
                        const docSnap = querySnapshot.docs[0];
                        const data = docSnap.data();
    
                        if (data.Password === password) {
                            if (role === 'gdtAdmin' && data.Privilege === 'Admin') {
                                userFound = true;
                                setPopupMessage("Login successful!");
                                setPopupImage(successImage);
                                setPopupVisible(true);
                                setTimeout(() => {
                                    navigate('/Adminhomepage');
                                }, 1500);
                            } else if (role === 'gdtStaff' && data.Privilege === 'Staff') {
                                userFound = true;
                                setPopupMessage("Login successful!");
                                setPopupImage(successImage);
                                setPopupVisible(true);
                                setTimeout(() => {
                                    navigate('/Staffhomepage');
                                }, 1500);
                            } else {
                                setPopupMessage('You do not have permission to access this area.');
                                setPopupImage(errorImage);
                                setPopupVisible(true);
                            }
                        } else {
                            setPopupMessage('Incorrect password for Admin/Staff.');
                            setPopupImage(errorImage);
                            setPopupVisible(true);
                        }
                    } else {
                        setPopupMessage('Admin/Staff user not found.');
                        setPopupImage(errorImage);
                        setPopupVisible(true);
                    }
                }
    
                // Check for Employee users
                if (role === 'employee') {
                    // Query the Employer collection using the correct field name for commercial number
                    const q = query(collection(db, 'Employer'), where('commercialNumber', '==', commercialRegNumber));
                    const querySnapshot = await getDocs(q);
    
                    if (!querySnapshot.empty) {
                        const docSnap = querySnapshot.docs[0]; // Get the first matching document
                        const data = docSnap.data();
                        
                        // Log the fetched data for employee
                        console.log("Fetched Employee data:", data);
    
                        // Check if the password matches
                        if (data.Password === password) {
                            userFound = true;
                            const employerUID = docSnap.id;
                        console.log("Employer UID:", employerUID);
                        
                        // Store the UID in localStorage or sessionStorage, or pass it to other components via context
                        sessionStorage.setItem('employerUID', employerUID); 
                            setPopupMessage("Login successful!");
                            setPopupImage(successImage);
                            setPopupVisible(true);
                            setTimeout(() => {
                                navigate('/employer-home'); // Use navigate for routing
                            }, 1500);
                        } else {
                            setPopupMessage('Incorrect password for Employee.');
                            setPopupImage(errorImage);
                            setPopupVisible(true);
                        }
                    } else {
                        setPopupMessage('Employee not found.');
                        setPopupImage(errorImage);
                        setPopupVisible(true);
                    }
                }
    
                // If no user is found after all checks
                if (!userFound) {
                    setPopupMessage("Incorrect credentials.");
                    setPopupImage(errorImage);
                    setPopupVisible(true);
                }
            } catch (error) {
                console.error("Error fetching user: ", error);
            }
        } else {
            console.log("Validation failed");
        }
    };

    // Close popup handler
    const handleClosePopup = () => {
        setPopupVisible(false);
    };

    return (
        <div 
            className="login-container" 
            style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} // Fixed URL syntax
        >
            <h1>Welcome to SAIR!</h1>
            <p>Please Select a Role</p>
            <select id="roleSelect" onChange={handleRoleChange}>
                <option value="">-- Select a Role --</option>
                <option value="gdtAdmin">GDT Admin</option>
                <option value="gdtStaff">GDT Staff</option>
                <option value="employee">Employee</option>
            </select>
            <br /><br />

            <div className="form-container" style={{ display: role ? 'block' : 'none' }}>
                <form id="dynamicForm" onSubmit={handleSubmit}>
                    {role === 'gdtAdmin' || role === 'gdtStaff' ? (
                        <div>
                            <p className='fill'>Please fill in the following information to log in to your account.</p>
                            <br />
                            <label htmlFor="phoneNumber">Phone Number:</label><br />
                            <input 
                                type="text" 
                                id="phoneNumber" 
                                value={phoneNumber} 
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))} 
                            /><br />
                            <span className={`error-message ${errors.phoneStartError ? 'visible' : ''}`}>{errors.phoneStartError}</span><br />
                            <span className={`error-message ${errors.phoneLengthError ? 'visible' : ''}`}>{errors.phoneLengthError}</span><br />
                            <label htmlFor="password">Password:</label><br />
                            <input 
                                type={showPassword ? "text" : "password"} // Toggle password visibility
                                id="password" 
                                name="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            /><br />
                        </div>
                    ) : role === 'employee' ? (
                        <div>
                            <p className='fill'>Please fill in the following information to log in to your account.</p>
                            <br />
                            <label htmlFor="commercialRegNumber">Commercial Registration Number:</label><br />
                            <input 
                                type="text" 
                                id="commercialRegNumber" 
                                value={commercialRegNumber} 
                                onChange={(e) => setCommercialRegNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                            /><br />
                            <span className={`error-message ${errors.commercialError ? 'visible' : ''}`}>{errors.commercialError}</span><br />
                            <label htmlFor="password">Password:</label><br />
                            <input 
                                type={showPassword ? "text" : "password"} // Toggle password visibility
                                id="password" 
                                name="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            /><br />
                        </div>
                    ) : null}<div className="link-container">
                    <a id='forget' href="Forgetpassword.jsx">Forget Password?</a> 
                    <br />
                    {role === 'employee' && (
                        <a 
                            id='signup' 
                            onClick={() => navigate('/Signup')} // Use navigate for routing
                            style={{ cursor: 'pointer' }} // Change cursor to indicate clickable link
                        >
                            Don't have a company account? Sign up here
                        </a>
                    )}
                </div>
                <button type="submit">Login</button>
            </form>
        </div>

        {popupVisible && (
<div className="popup">
    <button className="close-btn" onClick={handleClosePopup}>X</button>
    <img src={popupImage} alt="Popup" />
    <p>{popupMessage}</p>
</div>
)}

    </div>
);
};

export default Login;