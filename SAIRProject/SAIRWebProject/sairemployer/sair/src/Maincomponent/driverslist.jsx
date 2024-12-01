import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import {
  collection, doc, onSnapshot, deleteDoc, query, where, getDoc, getDocs, updateDoc
} from 'firebase/firestore';
import TrashIcon from '../images/Trash.png';
import PencilIcon from '../images/pencil.png';
import EyeIcon from '../images/eye.png';
import successImage from '../images/Sucess.png';
import errorImage from '../images/Error.png';
import { SearchOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { Button, Table, Modal } from 'antd';
import Header from './Header';
import '../css/CustomModal.css';

import s from "../css/DriverList.module.css";

const DriverList = () => {
  const [driverData, setDriverData] = useState([]);
  const [driverToRemove, setDriverToRemove] = useState(null);
  const [isDeletePopupVisible, setIsDeletePopupVisible] = useState(false);
  const [availableMotorcycles, setAvailableMotorcycles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(true);
  const [currentEmployerCompanyName, setCurrentEmployerCompanyName] = useState('');

  const navigate = useNavigate();
  const { driverId } = useParams();
  const employerUID = sessionStorage.getItem('employerUID');

  const handleEditDriver = (driver) => {
    navigate(`/edit-driver/${driver?.id}`);
  };

  const columns = [
    {
      title: 'Driver ID',
      dataIndex: 'DriverID',
      key: 'DriverID',
      align: 'center',
    },
    {
      title: 'Driver Name',
      dataIndex: 'DriverName',
      key: 'DriverName',
      align: 'center',
      render: (text, record) => `${record.Fname} ${record.Lname}`,
    },
    {
      title: 'Phone Number',
      dataIndex: 'PhoneNumber',
      key: 'PhoneNumber',
      align: 'center',
    },
    {
      title: 'Email',
      dataIndex: 'Email',
      key: 'Email',
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
          onClick={() => viewDriverDetails(record.DriverID)}
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
            onClick={() => handleEditDriver(record)}
          />
        </div>
      ),
    },
  ];

  const filteredData = driverData.filter(driver => {
    const fullName = `${driver.Fname} ${driver.Lname}`.toLowerCase();
    const driverID = driver.DriverID.toLowerCase();
    const query = searchQuery.toLowerCase();

    return driverID.includes(query) || fullName.includes(query);
  });

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

    const fetchDrivers = () => {
      const driverCollection = query(
        collection(db, 'Driver'),
        where('CompanyName', '==', currentEmployerCompanyName)
      );
      const unsubscribe = onSnapshot(driverCollection, (snapshot) => {
        const driverList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDriverData(driverList);
      });
      return () => unsubscribe();
    };

    const fetchMotorcycles = () => {
      const motorcycleQuery = query(
        collection(db, 'Motorcycle'),
        where('CompanyName', '==', currentEmployerCompanyName)
      );
      const unsubscribe = onSnapshot(motorcycleQuery, (snapshot) => {
        const bikes = snapshot.docs.map((doc) => ({
          id: doc.id,
          GPSnumber: doc.data().GPSnumber,
        }));
        setAvailableMotorcycles(bikes);
      });
      return () => unsubscribe();
    };

    fetchEmployerCompanyName().then(() => {
      fetchDrivers();
      fetchMotorcycles();
    });
  }, [employerUID, currentEmployerCompanyName]);

  const handleDeleteDriver = async (driverId) => {
    try {
      const driverDoc = await getDoc(doc(db, 'Driver', driverId));
      if (driverDoc.exists()) {
        const driverData = driverDoc.data();
        const gpsNumber = driverData.GPSnumber;

        await deleteDoc(doc(db, 'Driver', driverId));

        if (gpsNumber) {
          const motorcycleQuery = query(
            collection(db, 'Motorcycle'),
            where('GPSnumber', '==', gpsNumber)
          );
          const motorcycleSnapshot = await getDocs(motorcycleQuery);

          if (!motorcycleSnapshot.empty) {
            const motorcycleDocRef = motorcycleSnapshot.docs[0].ref;

            await updateDoc(motorcycleDocRef, {
              available: true,
              DriverID:null
            });
          }
        }

        setIsSuccess(true);
        setNotificationMessage('Driver deleted successfully!');
        setIsNotificationVisible(true);
        setTimeout(() => {
          navigate('/driverslist'); // Adjust the path as needed
        }, 2000);
      } else {
        setIsSuccess(false);
        setNotificationMessage('Driver not found.');
        setIsNotificationVisible(true);
      }
    } catch (error) {
      console.error('Error deleting driver:', error);
      setIsSuccess(false);
      setNotificationMessage('Error deleting driver. Please try again.');
      setIsNotificationVisible(true);
    }
    setIsDeletePopupVisible(false);
  };

  const openDeleteConfirmation = (driver) => {
    setDriverToRemove(driver);
    setIsDeletePopupVisible(true);
  };

  const viewDriverDetails = (driverID) => {
    console.log('Navigating to details for driver ID:', driverID);
    navigate(`/driver-details/${driverID}`);
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/');
    }).catch((error) => {
      console.error('Error LOGGING out:', error);
    });
  };

  return (
    <div>
      <Header active="driverslist" />

      <div className="breadcrumb" style={{ marginRight: '100px' }}>
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/driverslist')}>Driver List</a>
      </div>

      <main>
        <div className={s.container}>
          <h2 className={s.title}>Driver List</h2>

          <div className={s.searchInputs}>
            <div className={s.searchContainer}>
              <SearchOutlined style={{ color: '#059855' }} />
              <input
                type="text"
                placeholder="Search by Driver ID or Driver Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "300px" }}
              />
            </div>
            <Button type="primary" className={s.addButton}
              onClick={() => navigate('/add-driver')}>
              <UsergroupAddOutlined />
              <span>Add Driver</span>
            </Button>
          </div>
        </div>

        <br />

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          style={{ width: '1200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '0 auto' }}
        />

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
    <Button key="yes" type="primary" danger onClick={() => handleDeleteDriver(driverToRemove.id)}>
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
    <p>Are you sure you want to delete {driverToRemove?.Fname}?</p>
  </div>
</Modal>

        {/* Notification Modal */}
        <Modal
          visible={isNotificationVisible}
          onCancel={() => setIsNotificationVisible(false)}
          footer={<p style={{textAlign:'center'}}>{notificationMessage}</p>}
          style={{top:'38%'}}
          className="custom-modal" 
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

export default DriverList;