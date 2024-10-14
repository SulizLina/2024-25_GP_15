import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // navigation
import { auth, db } from '../../firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore'; //queries and document fetching
import '../../App.css'; 
import successImage from '../../images/Sucess.png'; 
import errorImage from '../../images/Error.png'; 
import backgroundImage from '../../images/Background.png'; 

const Signup = () => {
    const [formData, setFormData] = useState({
        fname: '',
        lname: '',
        companyName: '',
        companyEmail: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        commercialNumber: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [popupImage, setPopupImage] = useState('');
    const navigate = useNavigate();

    // Phone Number Validation
    const validatePhoneNumber = (value) => {
        let errors = {};
        if (!value.startsWith('+966') && value.length > 0) {
            errors.phoneStartError = 'Phone number must start with +966.';
        }
        if (value.length !== 13 && value.length > 0) {
            errors.phoneLengthError = 'Phone number must be exactly 13 digits.';
        }
        return errors;
    };

    // Commercial Number Validation
    const validateCommercialNumber = (value) => {
        let errors = {};
        if (value.length !== 10 && value.length > 0) {
            errors.commercialNumber = 'Commercial number must be exactly 10 digits.';
        }
        return errors;
    };

    // Email Validation
    const validateEmail = (value) => {
        let errors = {};
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length > 0) {
            errors.companyEmail = 'Please enter a valid email (e.g., name@domain.com).';
        }
        return errors;
    };

    // Password Validation
    const validatePassword = (value) => {
        let errors = {};
        if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(value) && value.length > 0) {
            errors.password = 'Password must include uppercase, lowercase, number, symbol, and be at least 8 characters.';
        }
        return errors;
    };

    // Confirm Password Validation
    const validateConfirmPassword = (value) => {
        let errors = {};
        if (value !== formData.password && value.length > 0) {
            errors.confirmPassword = 'Passwords do not match.';
        }
        return errors;
    };

    // Handle changes to input fields
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Set form data based on input
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        // Validate field on change
        let newErrors = {};
        switch (name) {
            case 'phoneNumber':
                newErrors = validatePhoneNumber(value);
                break;
            case 'commercialNumber':
                newErrors = validateCommercialNumber(value.replace(/\D/g, '')); // Clean non-digits
                break;
            case 'companyEmail':
                newErrors = validateEmail(value);
                break;
            case 'password':
                newErrors = validatePassword(value);
                break;
            case 'confirmPassword':
                newErrors = validateConfirmPassword(value);
                break;
            default:
                break;
        }
        setErrors((prev) => ({ ...prev, ...newErrors }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validate all fields before submitting
        let allErrors = {};
        Object.keys(formData).forEach(field => {
            let fieldErrors = {};
            switch (field) {
                case 'phoneNumber':
                    fieldErrors = validatePhoneNumber(formData.phoneNumber);
                    break;
                case 'commercialNumber':
                    fieldErrors = validateCommercialNumber(formData.commercialNumber);
                    break;
                case 'companyEmail':
                    fieldErrors = validateEmail(formData.companyEmail);
                    break;
                case 'password':
                    fieldErrors = validatePassword(formData.password);
                    break;
                case 'confirmPassword':
                    fieldErrors = validateConfirmPassword(formData.confirmPassword);
                    break;
                default:
                    break;
            }
            allErrors = { ...allErrors, ...fieldErrors };
        });

        // Prevent submission if any errors are present
        if (Object.values(allErrors).some(error => error)) {
            console.log('Validation errors found:', allErrors);
            setErrors(allErrors);
            setLoading(false);
            return;
        }

        try {
            // Check if commercial number already exists
            const commercialRef = query(collection(db, 'Employer'), where('commercialNumber', '==', formData.commercialNumber));
            const snapshot = await getDocs(commercialRef);

            if (!snapshot.empty) {
                setErrors((prevErrors) => ({ ...prevErrors, commercialNumber: 'Commercial number is already registered.' }));
                setLoading(false);
                return;
            }

            // Register employer in Firebase
            const userCredential = await auth.createUserWithEmailAndPassword(formData.companyEmail, formData.password);
            const user = userCredential.user;

            // Add employer details to Firestore
            await db.collection('Employer').doc(user.uid).set({
                fname: formData.fname,
                lname: formData.lname,
                companyName: formData.companyName,
                companyEmail: formData.companyEmail,
                phoneNumber: formData.phoneNumber,
                commercialNumber: formData.commercialNumber
            });

            // Clear form and show success popup
            setFormData({
                fname: '',
                lname: '',
                companyName: '',
                companyEmail: '',
                password: '',
                confirmPassword: '',
                phoneNumber: '',
                commercialNumber: ''
            });
            setPopupMessage('Signup successful! You can now log in.');
            setPopupImage(successImage); // Set the success image for the popup
            setPopupVisible(true);
            setTimeout(() => {
                setPopupVisible(false);
                navigate('/login');
            }, 3000);
        } catch (error) {
            console.error('Error signing up:', error);
            setErrors((prevErrors) => ({ ...prevErrors, password: error.message }));
            setPopupMessage('Signup failed. Please try again.');
            setPopupImage(errorImage); // Set the error image for the popup
            setPopupVisible(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="signup-container">
                <h1>Welcome to SAIR! <br /> Your easy solution for managing delivery drivers.</h1>

                {loading && <p>Signing up...</p>}
                
                <form onSubmit={handleSubmit}>
                    {/* Form Fields */}
                    <div className="form-group">
                        <label htmlFor="fname">First Name:</label><br />
                        <input type="text" name="fname" value={formData.fname} onChange={handleChange} required />
                        {errors.fname && <span className="error-message">{errors.fname}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="lname">Last Name:</label><br />
                        <input type="text" name="lname" value={formData.lname} onChange={handleChange} required />
                        {errors.lname && <span className="error-message">{errors.lname}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="companyName">Company Name:</label><br />
                        <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required />
                        {errors.companyName && <span className="error-message">{errors.companyName}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="commercialNumber">Commercial Number:</label><br />
                        <input 
                            type="text" 
                            name="commercialNumber" 
                            value={formData.commercialNumber} 
                            onChange={handleChange} 
                            required 
                        />
                        {errors.commercialNumber && <span className="error-message">{errors.commercialNumber}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="companyEmail">Company Email:</label><br />
                        <input 
                            type="email" 
                            name="companyEmail" 
                            value={formData.companyEmail} 
                            onChange={handleChange} 
                            required 
                        />
                        {errors.companyEmail && <span className="error-message">{errors.companyEmail}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="phoneNumber">Phone Number:</label><br />
                        <input 
                            type="text" 
                            name="phoneNumber" 
                            value={formData.phoneNumber} 
                            onChange={handleChange} 
                            required 
                        />
                        {errors.phoneStartError && <span className="error-message">{errors.phoneStartError}</span>}
                        {errors.phoneLengthError && <span className="error-message">{errors.phoneLengthError}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password:</label><br />
                        <input 
                            type="password" 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                        />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password:</label><br />
                        <input 
                            type="password" 
                            name="confirmPassword" 
                            value={formData.confirmPassword} 
                            onChange={handleChange} 
                            required 
                        />
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>
                    <p id='login' style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Already have an account? Log in here</p>
                    <button type="submit" disabled={loading}>Sign Up</button>
                </form>

                {popupVisible && (
                    <div className="popup">
                        <img src={popupImage} alt="Popup" />
                        <p>{popupMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Signup;
