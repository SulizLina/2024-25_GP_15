import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import jsPDF from 'jspdf';
import { DownloadOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import {
  collection, doc, onSnapshot, deleteDoc, query, where, getDoc, getDocs, updateDoc
} from 'firebase/firestore';
import TrashIcon from '../images/Trash.png';
import PencilIcon from '../images/pencil.png';
import { FaEye } from "react-icons/fa"; 
import EyeIcon from '../images/eye.png';
import successImage from '../images/Sucess.png';
import errorImage from '../images/Error.png';
import { SearchOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { Button, Table, Modal } from 'antd';
import Header from './Header';
import '../css/CustomModal.css';
import SAIRLogo from '../images/SAIRlogo.png';
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
      render: (text) => (
        <a
          href={`mailto:${text}`}
          style={{
            color: 'black', 
            textDecoration: 'underline', 
            transition: 'color 0.3s', 
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'green')} // Change color on hover
          onMouseLeave={(e) => (e.currentTarget.style.color = 'black')} // Revert color on mouse leave
        >
          {text}
        </a>
      ),
    },
    {
      title: 'Driver Details',
      key: 'Details',
      align: 'center',
      render: (text, record) => (
        <FaEye
    style={{ cursor: 'pointer', fontSize: '1.5em', color: '#059855' }} 
    onClick={() => viewDriverDetails(record,record.DriverID)} 
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
    {
      title: 'Export',
      key: 'Report',
      align: 'center',
      render: (text, record) => (
          <DownloadOutlined 
            onClick={() => generatePDF(record)} 
            style={{ cursor: 'pointer', fontSize: '20px', color:'#059855' }} 
          />

      ),
    }
  ];

  const generatePDF = async (driver) => {
    try {
      // Fetch full driver details
      const driverDoc = await getDoc(doc(db, 'Driver', driver.id));
      if (!driverDoc.exists()) {
        console.error("Driver not found");
        return;
      }
  
      const driverData = driverDoc.data();
      const motorcycles = await fetchMotorcycles(driverData.GPSnumber);
  
      // Fetch employer details
      const employerDoc = await getDoc(doc(db, 'Employer', employerUID));
      const shortCompanyName = employerDoc.exists() ? employerDoc.data().ShortCompanyName : '';
      
      // Company details
      const companyDetails = employerDoc.exists() ? {
        email: employerDoc.data().CompanyEmail,
        name: shortCompanyName, 
        phone: employerDoc.data().PhoneNumber,
        commercialNumber: employerDoc.data().commercialNumber,
      } : {};
  
      const pdfDoc = new jsPDF();
      pdfDoc.setFont("Times", "normal");
  
      // Add SAIR logo
      const logoImg = new Image();
      logoImg.src = SAIRLogo; 
      logoImg.onload = () => {
        pdfDoc.addImage(logoImg, 'PNG', 8, 10, 60, 25); // Adjust size and position
  
        // Add employer company name
        pdfDoc.setFontSize(18);
        pdfDoc.text(shortCompanyName, 150, 28); 
  
        // Add title
        pdfDoc.setFontSize(16);
        pdfDoc.setTextColor("#059855");
        pdfDoc.setFont('Times', 'bold');
        pdfDoc.text('Driver Details', 10, 50);
        pdfDoc.setTextColor("#000000");
        pdfDoc.setFont('Times', 'normal');
  
        // Set the starting position for details
        let currentY = 60;
        const details = [
          `Driver Name: ${driverData.Fname} ${driverData.Lname}`,
          `Driver ID: ${driverData.DriverID}`,
          `Phone Number: ${driverData.PhoneNumber}`,
          `Email: ${driverData.Email}`,
        ];
  
        details.forEach(line => {
          const [label, value] = line.split(': ');
          pdfDoc.setFont('Times', 'bold');
          pdfDoc.setTextColor("#059855");
          pdfDoc.text(`${label}:`, 20, currentY);
          pdfDoc.setFont('Times', 'normal');
          pdfDoc.setTextColor("#000000");
          pdfDoc.text(value, 80, currentY);
          currentY += 10;
        });
  
        // Add a horizontal line after driver details
        pdfDoc.setDrawColor('green');
        pdfDoc.line(10, 100, 200, 100);
        currentY += 10;
  
        // Add motorcycle details
        pdfDoc.setFontSize(16);
        pdfDoc.setTextColor("#059855");
        pdfDoc.setFont('Times', 'bold');
        pdfDoc.text('Motorcycle Details', 10, currentY + 10);
        pdfDoc.setTextColor("#000000");
        pdfDoc.setFont('Times', 'normal');
  
        currentY += 20;
        if (motorcycles.length > 0) {
          motorcycles.forEach(motorcycle => {
            const motorcycleDetails = [
              `Motorcycle ID: ${motorcycle.MotorcycleID}`,
              `Type: ${motorcycle.Type}`,
              `Brand: ${motorcycle.Brand}`,
              `Model: ${motorcycle.Model}`,
              `GPS Number: ${motorcycle.GPSnumber}`,
              `License Plate: ${motorcycle.LicensePlate}`,
            ];
  
            motorcycleDetails.forEach(detail => {
              const [label, value] = detail.split(': ');
              pdfDoc.setFont('Times', 'bold');
              pdfDoc.setTextColor("#059855");
              pdfDoc.text(`${label}:`, 20, currentY);
              pdfDoc.setFont('Times', 'normal');
              pdfDoc.setTextColor("#000000");
              pdfDoc.text(value, 80, currentY);
              currentY += 10;
            });
  
            currentY += 10; // Extra space before the next motorcycle
          });
        } else {
          pdfDoc.text('No motorcycles associated with this driver.', 10, currentY);
        }
  
        pdfDoc.setDrawColor('green');
        pdfDoc.line(10, currentY, 200, currentY);


        // Add Company Details
        currentY += 20;
        pdfDoc.setFontSize(16);
        pdfDoc.setTextColor("#059855");
        pdfDoc.setFont('Times', 'bold');
        pdfDoc.text('Company Details', 10, currentY);
        pdfDoc.setTextColor("#000000");
        pdfDoc.setFont('Times', 'normal');
  
        currentY += 10;
        const companyDetailsArr = [
          `Company Name: ${companyDetails.name || 'N/A'}`,
          `Commercial Number: ${companyDetails.commercialNumber || 'N/A'}`,
          `Email: ${companyDetails.email || 'N/A'}`,
          `Phone Number: ${companyDetails.phone || 'N/A'}`,
        ];
  
        companyDetailsArr.forEach(line => {
          const [label, value] = line.split(': ');
          pdfDoc.setFont('Times', 'bold');
          pdfDoc.setTextColor("#059855");
          pdfDoc.text(`${label}:`, 20, currentY);
          pdfDoc.setFont('Times', 'normal');
          pdfDoc.setTextColor("#000000");
          pdfDoc.text(value, 80, currentY);
          currentY += 10;
        });
  
        // Footer
        currentY += 20;
        pdfDoc.setFont('Times', 'normal');
        pdfDoc.setFontSize(12); 
        const footerText = '     The report is generated by: SAIR                                                        Email: sairsystemproject@gmail.com';
        pdfDoc.text(footerText, 10, currentY); 
  
        pdfDoc.save(`Driver_Report_${driverData.DriverID}.pdf`);
      };
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  
  const fetchMotorcycles = async (gpsNumber) => {
    const motorcycleQuery = query(collection(db, 'Motorcycle'), where('GPSnumber', '==', gpsNumber));
    const motorcycleSnapshot = await getDocs(motorcycleQuery);
    return motorcycleSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  };

  const filteredData = driverData.filter(driver => {
    const fullName = `${driver.Fname} ${driver.Lname}`.toLowerCase();
    const driverID = String(driver.DriverID).toLowerCase(); // Convert driverID to a string and to lowercase
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
            // Sort drivers by full name (Fname Lname)
    driverList.sort((a, b) => {
      const fullNameA = `${a.Fname} ${a.Lname}`.toLowerCase();
      const fullNameB = `${b.Fname} ${b.Lname}`.toLowerCase();
      return fullNameA.localeCompare(fullNameB); // A to Z sorting
    });

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

  const viewDriverDetails = (record,driverID) => {
    sessionStorage.removeItem(`driver_${record.id}`);
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
      <head>
  <link href="https://fonts.googleapis.com/css2?family=Amiri&display=swap" rel="stylesheet" />
</head>
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
                 style={{ width: '1200px', whiteSpace: 'nowrap', overflow:
       'hidden', textOverflow: 'ellipsis', margin: '0 auto' }}
                 onRow={(record) => ({
                   style: {
                     backgroundColor:
                       sessionStorage.getItem(`driver_${record.id}`) ?
       "#d0e0d0" : "transparent",
                   },
                 })}
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