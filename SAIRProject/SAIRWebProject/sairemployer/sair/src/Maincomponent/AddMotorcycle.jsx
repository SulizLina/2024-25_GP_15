import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, onSnapshot, doc, getDoc , updateDoc} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import successImage from '../images/Sucess.png';
import errorImage from '../images/Error.png';
import s from "../css/Profile.module.css";
import {Modal} from 'antd';
import '../css/CustomModal.css';

const AddMotorcycle = () => {
  const navigate = useNavigate();
  const [Employer, setEmployer] = useState({ CompanyName: '' });
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupImage, setPopupImage] = useState('');

  const [motorcycle, setMotorcycle] = useState({
    Model: '',
    GPSnumber: '',
    Type: '',
    Brand: '',
    LicensePlate: '',
    DriverID: ''
  });

  const [validationMessages, setValidationMessages] = useState({
    Model: '',
    GPSnumber: '',
    Type: '',
    Brand: '',
    LicensePlate: '',
    DriverID: ''
  });

  const [availableDrivers, setAvailableDrivers] = useState([]);

  const handleInputChange = (e) => {
    setValidationMessages((prev) => ({
      ...prev,
      [e.target.name]: ''
    }));

    const { name, value } = e.target;
    setMotorcycle(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMotorcycle = async (values) => {
    try {
        // Check if GPS number already exists
        const gpsQuery = query(
            collection(db, 'Motorcycle'),
            where('GPSnumber', '==', values.GPSnumber),
            where('CompanyName', '==', Employer.CompanyName)
        );
        const gpsSnapshot = await getDocs(gpsQuery);
        if (!gpsSnapshot.empty) {
            setPopupMessage("GPS number already exists.");
            setPopupImage(errorImage);
            setPopupVisible(true);
            return;
        }

        // Check if license plate already exists
        const plateQuery = query(
            collection(db, 'Motorcycle'),
            where('LicensePlate', '==', values.LicensePlate),
            where('CompanyName', '==', Employer.CompanyName)
        );
        const plateSnapshot = await getDocs(plateQuery);
        if (!plateSnapshot.empty) {
            setPopupMessage("License plate already exists.");
            setPopupImage(errorImage);
            setPopupVisible(true);
            return;
        }

        // Generate a unique MotorcycleID
        const motorcycleID = await generateMotorcycleID(values.GPSnumber);
        const newMotorcycle = {
            ...values,
            MotorcycleID: motorcycleID,
            CompanyName: Employer.CompanyName,
            DriverID: values.DriverID === "None" ? null : values.DriverID,
            available: values.DriverID === "None" ? true : false,
        };

        // Add the new motorcycle
        await addDoc(collection(db, 'Motorcycle'), newMotorcycle);
        setPopupMessage("Motorcycle added successfully!");
        setPopupImage(successImage);
        setPopupVisible(true);

        // Update the driver if a DriverID is assigned
        if (newMotorcycle.DriverID) {
            // Fetch driver based on the unique DriverID field
            const driverQuery = query(collection(db, 'Driver'), where('DriverID', '==', newMotorcycle.DriverID));
            const driverSnapshot = await getDocs(driverQuery);

            if (!driverSnapshot.empty) {
                const driverDocRef = doc(db, 'Driver', driverSnapshot.docs[0].id); // Get the document ID of the first matching driver
                await updateDoc(driverDocRef, {
                    GPSnumber: values.GPSnumber,
                    available: false
                });
            } else {
                console.error(`No driver found with ID ${newMotorcycle.DriverID}`);
                setPopupMessage(`No driver found with ID ${newMotorcycle.DriverID}`);
                setPopupImage(errorImage);
                setPopupVisible(true);
            }
        }
        // Redirect after a short delay only if added successfully
        setTimeout(() => {
          navigate('/motorcycleslist'); // Change this to your desired route
      }, 2000); // Delay of 2000 milliseconds (2 seconds)
    } catch (error) {
        console.error('Error adding motorcycle:', error);
        setPopupMessage(`Error adding motorcycle: ${error.message}`);
        setPopupImage(errorImage);
        setPopupVisible(true);
    }
};

// Unique ID generation function
const generateMotorcycleID = async (gpsNumber) => {
    let uniqueID = '';
    let isUnique = false;

    while (!isUnique) {
        const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
        uniqueID = `5${randomDigits}`;

        const q = query(collection(db, 'Motorcycle'), where('MotorcycleID', '==', uniqueID));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            isUnique = true; // If no existing IDs match, this ID is unique
        }
    }

    return uniqueID; // Returns the unique ID
};

  const handleSubmit = (e) => {
    e.preventDefault();
    const { Model, GPSnumber, Type, Brand, LicensePlate, DriverID } = motorcycle;

    let isValid = true;
    const newValidationMessages = {};

    if (!Model) {
      newValidationMessages.Model = 'Please enter motorcycle model.';
      isValid = false;
    }

    if (!GPSnumber) {
      newValidationMessages.GPSnumber = 'Please enter GPS number.';
      isValid = false;
    }

    if (!Type) {
      newValidationMessages.Type = 'Please enter motorcycle type.';
      isValid = false;
    }

    if (!Brand) {
      newValidationMessages.Brand = 'Please enter motorcycle brand.';
      isValid = false;
    }

    if (!LicensePlate) {
      newValidationMessages.LicensePlate = 'Please enter motorcycle license plate.';
      isValid = false;
    }

    if (!DriverID) {
      newValidationMessages.DriverID = 'Please choose a driver';
      isValid = false;
    }

    setValidationMessages(newValidationMessages);

    if (isValid) {
      handleAddMotorcycle(motorcycle);
    }
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
  };

  useEffect(() => {
    const fetchAvailableDrivers = async () => {
      const employerUID = sessionStorage.getItem('employerUID');
      const employerDocRef = doc(db, 'Employer', employerUID);
      const docSnap = await getDoc(employerDocRef);

      if (docSnap.exists()) {
        const employerData = docSnap.data();
        setEmployer({ CompanyName: employerData.CompanyName });
        const { CompanyName } = docSnap.data();
        const dq = query(collection(db, 'Driver'), where('CompanyName', '==', CompanyName), where('available', '==', true));

        const unsubscribe = onSnapshot(dq, (drivers) => {
          const driverOptions = drivers.docs.map((doc) => {
            const driverData = doc.data();
            return { value: driverData.DriverID, label: driverData.DriverID };
          });
          setAvailableDrivers(driverOptions);
        });

        return () => unsubscribe();
      }
    };

    fetchAvailableDrivers();
  }, []);

  return (
    <div>
      <Header active="motorcycleslist" />

      <div className="breadcrumb">
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/motorcycleslist')}>Motorcycle List</a>
        <span> / </span>
        <a onClick={() => navigate('/add-motorcycle')}>Add Motorcycle</a>
      </div>

      <main className={s.container}>
        <h2 className='title'>Add Motorcycle</h2>
        <form onSubmit={handleSubmit}>
          <div className={s.formRow}> 
          <div>
              <label>GPS Number</label>
              <input
                type="text"
                name="GPSnumber"
                value={motorcycle.GPSnumber}
                onChange={handleInputChange}
              />
              {validationMessages.GPSnumber && <p className={s.valdationMessage}>{validationMessages.GPSnumber}</p>}
            </div>
            <div>
              <label>Motorcycle Model</label>
              <input
                type="text"
                name="Model"
                value={motorcycle.Model}
                onChange={handleInputChange}
              />
              {validationMessages.Model && <p className={s.valdationMessage}>{validationMessages.Model}</p>}
            </div>


          </div>

          <div className={s.formRow}>
            <div>
              <label>Motorcycle Type</label>
              <input
                type="text"
                name="Type"
                value={motorcycle.Type}
                onChange={handleInputChange}
              />
              {validationMessages.Type && <p className={s.valdationMessage}>{validationMessages.Type}</p>}
            </div>

            <div>
              <label>Motorcycle Brand</label>
              <input
                type="text"
                name="Brand"
                value={motorcycle.Brand}
                onChange={handleInputChange}
              />
              {validationMessages.Brand && <p className={s.valdationMessage}>{validationMessages.Brand}</p>}
            </div>
          </div>

          <div className={s.formRow}>
            <div>
              <label>Motorcycle License Plate</label>
              <input
                type="text"
                name="LicensePlate"
                value={motorcycle.LicensePlate}
                onChange={handleInputChange}
              />
              {validationMessages.LicensePlate && <p className={s.valdationMessage}>{validationMessages.LicensePlate}</p>}
            </div>

            <div>
              <label>Driver ID</label>
             <select
  name="DriverID"
  value={motorcycle.DriverID}
  onChange={handleInputChange}
>
  <option value="" disabled>Select a Driver</option> {/* Disabled placeholder option */}
  <option value={null}>None</option> {/* This will be treated as null */}
  {availableDrivers.length > 0 ? (
    availableDrivers.map(({ value, label }) => (
      <option key={value} value={value}>
        {label}
      </option>
    ))
  ) : (
    <option disabled>No drivers available</option>
  )}
</select>
{validationMessages.DriverID && <p className={s.valdationMessage}>{validationMessages.DriverID}</p>}
            </div>
          </div>

          <div>
            <button type="submit" className={s.editBtn}>
              Add Motorcycle
            </button>
          </div>
        </form>
      </main>


{popupVisible && (
  <Modal
    title={null} // No title since it's a simple image notification
    visible={popupVisible}
    onCancel={handleClosePopup}
    footer={<p style={{ textAlign:'center' }}>{popupMessage}</p>}
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

export default AddMotorcycle;