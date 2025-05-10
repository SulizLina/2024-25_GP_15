import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { collection, doc, onSnapshot, deleteDoc, addDoc, getDoc, query, where, updateDoc, getDocs } from 'firebase/firestore';
import TrashIcon from '../images/Trash.png';
import PencilIcon from '../images/pencil.png';
import EyeIcon from '../images/eye.png';
import { FaEye } from "react-icons/fa"; 
import successImage from '../images/Sucess.png';
import errorImage from '../images/Error.png';
import { Button, Table, Modal  } from 'antd';
import '../css/CustomModal.css';

import Header from './Header';

import s from "../css/MotorcyclesList.module.css";

const MotorcycleList = () => {
  const [motorcycleData, setMotorcycleData] = useState([]);
  const [driverData, setDriverData] = useState([]);
  const [isAddPopupVisible, setIsAddPopupVisible] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newMotorcycle, setNewMotorcycle] = useState({
    MotorcycleID: '',
    GPSnumber: '',
    LicensePlate: '',
    DriverID: null,

  });
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);
  const [motorcycleToRemove, setMotorcycleToRemove] = useState(null);
  const [isDeletePopupVisible, setIsDeletePopupVisible] = useState(false);
  const [currentEmployerCompanyName, setCurrentEmployerCompanyName] = useState('');

  const navigate = useNavigate();
  const employerUID = sessionStorage.getItem('employerUID');


  useEffect(() => {
    const fetchEmployerCompanyName = async () => {
      if (employerUID) {
        const employerDoc = await getDoc(doc(db, 'Employer', employerUID));
        if (employerDoc.exists()) {
          setCurrentEmployerCompanyName(employerDoc.data().CompanyName);
        } else {
          console.error("No such employer!");
        }
      }
    };


    const fetchMotorcycles = async () => {
      if (currentEmployerCompanyName) {
        const motorcycleCollection = query(
          collection(db, 'Motorcycle'),
          where('CompanyName', '==', currentEmployerCompanyName)
        );
        const unsubscribe = onSnapshot(motorcycleCollection, (snapshot) => {
          const motorcycleList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMotorcycleData(motorcycleList);
        });
        return () => unsubscribe();
      }
    };

    const fetchDrivers = () => {
      const driverCollection = collection(db, 'Driver');
      const unsubscribe = onSnapshot(driverCollection, (snapshot) => {
        const driverList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDriverData(driverList);
      });
      return () => unsubscribe();
    };

    fetchEmployerCompanyName().then(() => {
      fetchMotorcycles();
      fetchDrivers();
    });
  }, [employerUID, currentEmployerCompanyName]);
  const openDeleteConfirmation = (motorcycle) => {
    setMotorcycleToRemove(motorcycle);
    setIsDeletePopupVisible(true);
  };

  const handleDeleteMotorcycle = async (motorcycleId) => {
    try {
        // Reference to the motorcycle document
        const motorcycleDocRef = doc(db, 'Motorcycle', motorcycleId);
        const motorcycleDoc = await getDoc(motorcycleDocRef);

        if (motorcycleDoc.exists()) {
            const motorcycleData = motorcycleDoc.data();
            const driverId = motorcycleData.DriverID; // Use the correct field name for DriverID

            // Delete the motorcycle document
            await deleteDoc(motorcycleDocRef);

            // If there is a DriverID, update the corresponding driver
            if (driverId) {
                // Fetch driver based on the unique DriverID field
                const driverQuery = query(collection(db, 'Driver'), where('DriverID', '==', driverId));
                const driverSnapshot = await getDocs(driverQuery);

                if (!driverSnapshot.empty) {
                    const driverDocRef = doc(db, 'Driver', driverSnapshot.docs[0].id); // Get the document ID of the first matching driver
                    await updateDoc(driverDocRef, {
                        available: true, // Set driver as available
                        GPSnumber: null  // Clear the GPS number
                    });
                } else {
                    console.error(`No driver found with ID ${driverId}`);
                    setIsSuccess(false);
                    setNotificationMessage(`No driver found with ID ${driverId}`);
                }
            }

            setIsSuccess(true);
            setNotificationMessage('Motorcycle deleted successfully!');
        } else {
            setIsSuccess(false);
            setNotificationMessage('Motorcycle not found.');
        }
    } catch (error) {
        console.error('Error deleting motorcycle:', error);
        setIsSuccess(false);
        setNotificationMessage('Error deleting motorcycle. Please try again.');
    }
    setIsDeletePopupVisible(false);
    setIsNotificationVisible(true);
    
};

const handleAddMotorcycleSubmit = async (e) => {
  e.preventDefault();
  if (!newMotorcycle.GPSnumber || !newMotorcycle.LicensePlate) {
    setIsSuccess(false);
    setNotificationMessage('Please fill in all required fields');
    setIsNotificationVisible(true);
    return;
  }

  try {
    await addDoc(collection(db, 'Motorcycle'), {
      MotorcycleID: newMotorcycle.MotorcycleID,
      GPSnumber: newMotorcycle.GPSnumber,
      LicensePlate: newMotorcycle.LicensePlate,
      DriverID: newMotorcycle.DriverID || null,
      CompanyName: currentEmployerCompanyName, // Use the current company's name
    });
    setIsSuccess(true);
    setNotificationMessage('Motorcycle added successfully!');
    setIsAddPopupVisible(false);
    setTimeout(() => {
      navigate('/motorcycleslist'); // Adjust the path as needed
    }, 2000);
  } catch (error) {
    console.error('Error saving motorcycle:', error);
    setIsSuccess(false);
    setNotificationMessage(`Error saving motorcycle: ${error.message}`);
  }

  setIsNotificationVisible(true);
  setNewMotorcycle({
    MotorcycleID: '',
    GPSnumber: '',
    LicensePlate: '',
    DriverID: null,
  });
};

  const filteredData = motorcycleData.filter((motorcycle) => {
    const searchLower = searchQuery.toLowerCase().trim();

    return (
      (motorcycle.MotorcycleID && motorcycle.MotorcycleID.toLowerCase().includes(searchLower)) ||
      (motorcycle.LicensePlate && motorcycle.LicensePlate.toLowerCase().includes(searchLower)) ||
      (motorcycle.Type && motorcycle.Type.toLowerCase().includes(searchLower)) || // Optional: Search by Type
      (motorcycle.Brand && motorcycle.Brand.toLowerCase().includes(searchLower)) // Optional: Search by Brand
    );
  });

  const viewMotorcycleDetails = (motorcycleID) => {
    console.log('Navigating to details for motorcycle ID:', motorcycleID);
    navigate(`/motorcycle-details/${motorcycleID}`); // Adjust the path as needed
  };

  const columns = [
    {
      title: 'Motorcycle ID',
      dataIndex: 'MotorcycleID',
      key: 'MotorcycleID',
      align: 'center',
    },
    {
      title: 'Motorcycle License Plate',
      dataIndex: 'LicensePlate',
      key: 'LicensePlate',
      align: 'center',
    },
    {
      title: 'Motorcycle Type',
      dataIndex: 'Type',
      key: 'Type',
      align: 'center',
    },
    {
      title: 'Motorcycle Brand',
      dataIndex: 'Brand',
      key: 'Brand',
      align: 'center',
    },
    {
      title: 'Motorcycle Details',
      key: 'Details',
      align: 'center',
      render: (text, record) => (
        <FaEye
        style={{ cursor: 'pointer', fontSize: '1.5em', color: '#059855' }} 
        onClick={() => viewMotorcycleDetails(record.id)} 
      />
      ),
    },
    {
      title: 'Actions',
      key: 'Actions',
      align: 'center',
      render: (text, record) => (
        <div>
          <img
            style={{ cursor: 'pointer', marginRight: 8 }}
            src={TrashIcon}
            alt="Delete"
            onClick={() => openDeleteConfirmation(record)}
          />
          <img
            style={{ cursor: 'pointer' }}
            src={PencilIcon}
            alt="Edit"
            onClick={() => navigate(`/edit-motorcycle/${record.id}`)}
          />
        </div>
      ),
    },
  ];


  return (
    <>

      <Header active="motorcycleslist" />

      <div className="breadcrumb" Style={{ marginRight: '100px' }}>
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/motorcycleslist')}>Motorcycles List</a>
      </div>

      <main>
        <div className={s.container} >
          <h2 className='title'>Motorcycles List</h2>
          <div className={s.searchInputs}>
            <div className={s.searchContainer}>
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="#059855" strokeLinecap="round" strokeWidth="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
              </svg>
              <input
                type="text"
                placeholder="Search by Motorcycle ID or License Plate"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '330px', padding: '8px', borderRadius: '4px' }}
              />

            </div>

            <Button type="primary"
              className={s.addButton}
              onClick={() => {
                navigate('/add-motorcycle')
              }}>
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="white"
                  strokeLinecap="round"
                  strokeWidth="2"
                  d="M12 5v14M5 12h14"
                />
              </svg>
              <span>Add Motorcycle</span>
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />

        {/* Add Motorcycle Modal */}
        <Modal
        style={{ top: '10%' }}
          title="Add Motorcycle"
          visible={isAddPopupVisible}
          onCancel={() => setIsAddPopupVisible(false)}
          footer={null}
          className="custom-modal" 
          closeIcon={
            <span className="custom-modal-close-icon">
              ×
            </span>
          }
        >
          <form onSubmit={handleAddMotorcycleSubmit}>
            <input
              type="text"
              placeholder='GPS Number'
              value={newMotorcycle.GPSnumber}
              onChange={(e) => setNewMotorcycle((prevState) => ({
                ...prevState,
                GPSnumber: e.target.value,
              }))}
            />
            <input
              type="text"
              placeholder='Motorcycle License Plate'
              value={newMotorcycle.LicensePlate}
              onChange={(e) => setNewMotorcycle((prevState) => ({
                ...prevState,
                LicensePlate: e.target.value,
              }))}
            />
            <select
              value={newMotorcycle.DriverID || ''}
              onChange={(e) => setNewMotorcycle((prevState) => ({
                ...prevState,
                DriverID: e.target.value === 'None' ? null : e.target.value
              }))}>
              <option value="None">None</option>
              {driverData.map(driver => (
                <option key={driver.id} value={driver.id}>{driver.DriverID}</option>
              ))}
            </select>
            <Button type="primary" htmlType="submit">Add</Button>
          </form>
        </Modal>


{/* Delete Motorcycle Modal */}
<Modal
  style={{ top: '38%' }}
  title="Confirm Deletion"
  visible={isDeletePopupVisible}
  onCancel={() => setIsDeletePopupVisible(false)}
  footer={[
    <Button key="no" onClick={() => setIsDeletePopupVisible(false)}>
      No
    </Button>,
    <Button key="yes" type="primary" danger onClick={() => handleDeleteMotorcycle(motorcycleToRemove.id)}>
      Yes
    </Button>,
  ]}
  className="custom-modal" 
  closeIcon={
    <span className="custom-modal-close-icon">
      ×
    </span>
  }
>
  <div>
    <p>Are you sure you want to delete {motorcycleToRemove?.GPSnumber}?</p>
  </div>
</Modal>

{/* Notification Modal */}
<Modal
  visible={isNotificationVisible}
  onCancel={() => setIsNotificationVisible(false)}
  footer={<p style={{ textAlign: 'center' }}> {notificationMessage}</p>}
  style={{ top: '38%' }}
  className="custom-modal" 
  closeIcon={
    <span className="custom-modal-close-icon">
      ×
    </span>
  }
>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <img
      src={isSuccess ? successImage : errorImage}
      alt={isSuccess ? 'Success' : 'Error'}
      style={{ width: '20%', marginBottom: '16px' }}
    />
  
  </div>
</Modal>
      </main>
    </>
  );
};

export default MotorcycleList;