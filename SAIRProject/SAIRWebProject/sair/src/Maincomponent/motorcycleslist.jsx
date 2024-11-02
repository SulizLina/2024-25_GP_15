import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { collection, doc, onSnapshot, deleteDoc, addDoc, getDoc, query, where } from 'firebase/firestore';
import TrashIcon from '../images/Trash.png';
import PencilIcon from '../images/pencil.png';
import EyeIcon from '../images/eye.png';
import successImage from '../images/Sucess.png';
import errorImage from '../images/Error.png';
import { Button, Table } from 'antd';

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

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/');
    }).catch((error) => {
      console.error('Error logging out:', error);
    });
  };


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


    const fetchMotorcycles = () => {
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
      await deleteDoc(doc(db, 'Motorcycle', motorcycleId));
      setIsSuccess(true);
      setNotificationMessage('Motorcycle deleted successfully!');
    } catch (error) {
      console.error('Error deleting motorcycle:', error);
      setIsSuccess(false);
      setNotificationMessage('Error deleting motorcycle. Please try again.');
    }
    setIsNotificationVisible(true);
    setIsDeletePopupVisible(false);
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
        CompanyName: companyName,
      });
      setIsSuccess(true);
      setNotificationMessage('Motorcycle added successfully!');
      setIsAddPopupVisible(false);
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
      title: 'Details',
      key: 'Details',
      align: 'center',
      render: (text, record) => (
        <img
          style={{ cursor: 'pointer' }}
          src={EyeIcon}
          alt="Details"
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
          />
        </div>
      ),
    },
  ];

  const handleNavigation = (path) => {
    navigate(path); // Navigate to the specified path
  };

  return (
    <>

      <Header active="motorcycleslist" />

      <div className="breadcrumb" Style={{ marginRight: '100px' }}>
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/motorcycleslist')}>Motorcycles List</a>
      </div>

      <main  >
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

        {isAddPopupVisible && (
          <div className="popup-container">
            <div className="popup-content">
              <span className="close-popup-btn" onClick={() => setIsAddPopupVisible(false)}>&times;</span>
              <h3>Add Motorcycle</h3>
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
                  placeholder=' Motorcycle License Plate'
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
                <button type="submit">Add</button>
              </form>
            </div>
          </div>
        )}

        {isDeletePopupVisible && (
          <div id="delete" className="popup-container">
            <div>
              <span className="delete-close-popup-btn" onClick={() => setIsDeletePopupVisible(false)}>&times;</span>
              <p>Are you sure you want to delete {motorcycleToRemove?.GPSnumber}?</p>
              <button id="YES" onClick={() => handleDeleteMotorcycle(motorcycleToRemove.id)}>Yes</button>
              <button id="NO" onClick={() => setIsDeletePopupVisible(false)}>No</button>
            </div>
          </div>
        )}

        {isNotificationVisible && (
          <div className={`notification-popup ${isSuccess ? 'success' : 'error'}`}>
            <span className="close-popup-btn" onClick={() => setIsNotificationVisible(false)}>&times;</span>
            <img src={isSuccess ? successImage : errorImage} alt={isSuccess ? 'Success' : 'Error'} />
            <p>{notificationMessage}</p>
          </div>
        )}
      </main>
    </>
  );
};

export default MotorcycleList;