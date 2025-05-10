import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  doc,
  getDoc,
  setDoc,
  query,
  collection,
  where,
  onSnapshot,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Modal } from 'antd';
import successImage from '../images/Sucess.png';
import errorImage from '../images/Error.png';
import Header from './Header';
import s from '../css/Profile.module.css';

const EditMotorcycle = () => {
  const { motorcycleId } = useParams();
  const navigate = useNavigate();
  const [motorcycleData, setMotorcycleData] = useState(null);
  const [oldMotorcycleData, setOldMotorcycleData] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [validationMessages, setValidationMessages] = useState({});
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const employerUID = sessionStorage.getItem('employerUID');

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
  useEffect(() => {
    const fetchMotorcycleData = async () => {
      try {
        const motorcycleDocRef = doc(db, 'Motorcycle', motorcycleId);
        const motorcycleDoc = await getDoc(motorcycleDocRef);
        if (motorcycleDoc.exists()) {
          const data = motorcycleDoc.data();
          setMotorcycleData(data);
          setOldMotorcycleData(data);
          fetchAvailableDrivers();
        } else {
          setNotificationMessage('Motorcycle not found.');
          setIsSuccess(false);
          setIsNotificationVisible(true);
        }
      } catch (error) {
        console.error('Error fetching motorcycle data:', error);
        setNotificationMessage('Error fetching motorcycle data.');
        setIsSuccess(false);
        setIsNotificationVisible(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMotorcycleData();
  }, [motorcycleId]);

  const fetchAvailableDrivers = async (companyName) => {
    try {
      const driverQuery = query(
        collection(db, 'Driver'),
        where('available', '==', true),
        where('CompanyName', '==', companyName)
      );
      onSnapshot(driverQuery, (snapshot) => {
        const drivers = snapshot.docs.map((doc) => ({
          id: doc.id,
          DriverID: doc.data().DriverID,
        }));
        setAvailableDrivers(drivers);
      });
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const showNotification = (message, success) => {
    setNotificationMessage(message);
    setIsSuccess(success);
    setIsNotificationVisible(true);
    setTimeout(() => {
      setIsNotificationVisible(false);
    }, 2000);
  };

  const handleUpdateMotorcycle = async (values) => {
    try {
      const updatedData = {
        ...motorcycleData,
        ...values,
        DriverID: values.DriverID === 'None' ? null : values.DriverID,
        available: values.DriverID === 'None' ? true : false, // Set availability based on driver assignment
      };

      setMotorcycleData(updatedData);
      setOldMotorcycleData(updatedData);

      // Step 1: Update the previous driver's availability and GPSnumber if a new driver is assigned
      const prevDriverId = oldMotorcycleData.DriverID;
      console.log(
        prevDriverId,
        'prevDriverId',
        values.DriverID,
        'values.DriverID'
      );
      if (prevDriverId && prevDriverId !== values.DriverID) {
        const prevDriverQuery = query(
          collection(db, 'Driver'),
          where('DriverID', '==', prevDriverId)
        );
        const prevDriverQuerySnapshot = await getDocs(prevDriverQuery);

        if (!prevDriverQuerySnapshot.empty) {
          const prevDriverDocRef = prevDriverQuerySnapshot.docs[0].ref;
          await updateDoc(prevDriverDocRef, {
            available: true,
            GPSnumber: null, // Clear the GPSnumber for the previous driver
          });
        } else {
          console.error(`No driver found with DriverID: ${prevDriverId}`);
        }
      }

      // Step 2: Update the motorcycle document
      const motorcycleDocRef = doc(db, 'Motorcycle', motorcycleId);
      await updateDoc(motorcycleDocRef, updatedData);

      // Step 3: Update the new driver's availability and GPSnumber
      if (values.DriverID && values.DriverID !== 'None') {
        const driverQuery = query(
          collection(db, 'Driver'),
          where('DriverID', '==', values.DriverID)
        );
        const driverQuerySnapshot = await getDocs(driverQuery);

        if (!driverQuerySnapshot.empty) {
          const driverDocRef = driverQuerySnapshot.docs[0].ref;
          await updateDoc(driverDocRef, {
            available: false,
            GPSnumber: motorcycleData.GPSnumber, // Assign the motorcycle's GPSnumber to the driver
          });
        } else {
          console.error('Driver document not found.');
        }
      }

      
      showNotification('Motorcycle updated successfully!', true);
      setTimeout(() => {
        navigate('/motorcycleslist');
      }, 5000);
    } catch (error) {
      console.error('Error updating motorcycle:', error);
      showNotification(`Error updating motorcycle: ${error.message}`, false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { Model, GPSnumber, Type, Brand, LicensePlate, DriverID } =
      motorcycleData;

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
      newValidationMessages.LicensePlate =
        'Please enter motorcycle license plate.';
      isValid = false;
    }

    setValidationMessages(newValidationMessages);

    if (isValid) {
      handleUpdateMotorcycle(motorcycleData);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMotorcycleData((prev) => ({ ...prev, [name]: value }));
    setValidationMessages((prev) => ({ ...prev, [name]: '' }));
  };
  console.log(motorcycleData);
  console.log(motorcycleData?.DriverID || 'None');

  useEffect(() => {
    const getCompanyName = async () => {
      const name = await fetchCompanyName(employerUID);
      setCompanyName(name);
      if (name) {
        fetchAvailableDrivers(name); // Fetch drivers using the company name
      }
    };
    getCompanyName();
  }, [employerUID]);
  return (
    <div>
      <Header active='motorcycleslist' />

      <div className="breadcrumb" Style={{ marginRight: '100px' }}>
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/motorcycleslist')}>Motorcycles List</a>
        <span> / </span>
        <a onClick={() => navigate(`/edit-motorcycle/${motorcycleId}`)}>Edit Motorcycle</a>
      </div>

      <main>
        <div className={s.container}>
          <h2 className='title'>Edit Motorcycle</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={s.formRow}>
                <div>
                  <label>GPS Number</label>
                  <input
                    type='text'
                    name='GPSnumber'
                    value={motorcycleData.GPSnumber}
                    onChange={handleInputChange}
                  />
                  {validationMessages.GPSnumber && (
                    <p className={s.valdationMessage}>
                      {validationMessages.GPSnumber}
                    </p>
                  )}
                </div>
                <div>
                  <label>Motorcycle Model</label>
                  <input
                    type='text'
                    name='Model'
                    value={motorcycleData.Model}
                    onChange={handleInputChange}
                  />
                  {validationMessages.Model && (
                    <p className={s.valdationMessage}>
                      {validationMessages.Model}
                    </p>
                  )}
                </div>
              </div>

              <div className={s.formRow}>
                <div>
                  <label> Motorcycle Type</label>
                  <input
                    type='text'
                    name='Type'
                    value={motorcycleData.Type}
                    onChange={handleInputChange}
                  />
                  {validationMessages.Type && (
                    <p className={s.valdationMessage}>
                      {validationMessages.Type}
                    </p>
                  )}
                </div>

                <div>
                  <label>Motorcycle Brand</label>
                  <input
                    type='text'
                    name='Brand'
                    value={motorcycleData.Brand}
                    onChange={handleInputChange}
                  />
                  {validationMessages.Brand && (
                    <p className={s.valdationMessage}>
                      {validationMessages.Brand}
                    </p>
                  )}
                </div>
              </div>

              <div className={s.formRow}>
                <div>
                  <label>Motorcycle License Plate</label>
                  <input
                    type='text'
                    name='LicensePlate'
                    value={motorcycleData.LicensePlate}
                    onChange={handleInputChange}
                  />
                  {validationMessages.LicensePlate && (
                    <p className={s.valdationMessage}>
                      {validationMessages.LicensePlate}
                    </p>
                  )}
                </div>

                <div>
                  <label>Driver ID</label>
                  <select
                    name='DriverID'
                    value={motorcycleData.DriverID || 'None'}
                    onChange={handleInputChange}
                  >
                    <option value='None'>None</option>
                    {oldMotorcycleData.DriverID && (
                      <option value={oldMotorcycleData.DriverID}>
                        {oldMotorcycleData.DriverID}
                      </option>
                    )}
                    {availableDrivers.map((driver) => (
                      <option key={driver.id} value={driver.DriverID}>
                        {driver.DriverID}
                      </option>
                    ))}
                  </select>
                  {validationMessages.DriverID && (
                    <p className={s.valdationMessage}>
                      {validationMessages.DriverID}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                                onClick={() => { navigate('/motorcycleslist');}}
                                className={s.profileCancel}
                               
                            >
                                Cancel
                            </button>
                <button type='submit' className={s.editBtn}>
                  Update Motorcycle
                </button>
              </div>
            </form>
          )}
        </div>
        <Modal
          visible={isNotificationVisible}
          onCancel={() => setIsNotificationVisible(false)}
          footer={<p style={{ textAlign: 'center' }}>{notificationMessage}</p>}
          style={{ top: '38%' }}
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

export default EditMotorcycle;
