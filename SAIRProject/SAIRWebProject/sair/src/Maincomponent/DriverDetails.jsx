import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase'; 
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu } from 'antd'; 
import Header from './Header';


import s from "../css/DriverDetail.module.css";

const DriverDetails = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [driverDetails, setDriverDetails] = useState(null);
  const [motorcycles, setMotorcycles] = useState([]);
  const [violations, setViolations] = useState([]);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [error, setError] = useState(null);
  const [currentEmployerCompanyName, setCurrentEmployerCompanyName] = useState('');
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

    const fetchDriverDetails = async () => {
      try {
        const driverQuery = query(collection(db, 'Driver'), where('DriverID', '==', driverId));
        const querySnapshot = await getDocs(driverQuery);

        if (!querySnapshot.empty) {
          const driverData = querySnapshot.docs[0].data();
          setDriverDetails(driverData);

          // Fetch motorcycles and violations
          await fetchMotorcycles(driverData.GPSnumber);
          await fetchViolations(driverData.DriverID);
        } else {
          setError('No driver found with this ID.');
        }
      } catch (error) {
        setError('Failed to fetch driver details.');
      }
    };

    const fetchMotorcycles = async (gpsNumber) => {
      try {
        const motorcycleQuery = query(collection(db, 'Motorcycle'), where('GPSnumber', '==', gpsNumber));
        const motorcycleSnapshot = await getDocs(motorcycleQuery);
        const motorcyclesData = motorcycleSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMotorcycles(motorcyclesData);
      } catch (error) {
        setError('Failed to fetch motorcycle details.');
      }
    };

    const fetchViolations = async (driverID) => {
      try {
        const violationsQuery = query(collection(db, 'Violation'), where('driverID', '==', driverID));
        const violationsSnapshot = await getDocs(violationsQuery);
        const violationsData = violationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setViolations(violationsData);
      } catch (error) {
        console.error("Error fetching violations:", error);
      }
    };
    fetchEmployerCompanyName().then(() => {
      fetchDriverDetails();
    });
  }, [driverId]);

  const handleLogout = () => {
    navigate('/login');
  };

  const handleViewViolations = () => {
    if (violations.length > 0) {
      navigate(`/violation/detail/${driverId}`);
    } else {
      setIsPopupVisible(true); // Show popup if no violations exist
    }
  };

  const goBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

 
  return (
    <div  >
      
      <Header active={"driverslist"} />

      <div className="breadcrumb">
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/driverslist')}>Drivers List</a>
        <span> / </span>
        <a onClick={() => navigate('/driver-details/:driverId')}>Drivers Details</a>

      </div>

      <main className={s.detail} >
        <h2 className="title">Driver Details</h2>
        <hr />
        {error ? (
          <p>{error}</p>
        ) : driverDetails ? (
          <>
            <h3>Driver ID <span style={{ fontSize: '12px', color: 'gray', marginTop: "8px" }}>(National ID / Residency Number)</span></h3>
            <p>{driverDetails.DriverID}</p>
            <h3>Name</h3>
            <p>{`${driverDetails.Fname} ${driverDetails.Lname}`}</p>
            <h3>Phone Number</h3>
            <p>{driverDetails.PhoneNumber}</p>
            <h3>Email</h3>
            <p>{driverDetails.Email}</p>
            <h3>GPS Number</h3>
            <p>{driverDetails.GPSnumber ? driverDetails.GPSnumber : 'No assigned Motorcycle yet'}</p>
            <h3>Company Name</h3>
            <p>{driverDetails.CompanyName}</p>
            <br />

            <h3 style={{
              color: '#059855',
              fontSize: '32px',
              margin: '20px 0',
            }}>Motorcycles Details</h3>
            <hr />
            {motorcycles.length > 0 ? (
              motorcycles.map((motorcycle, index) => (
                <div key={index}>
                  <h3>Motorcycle ID</h3>
                  <p>{motorcycle.MotorcycleID}</p>
                  <h3>Motorcycle GPS Number</h3>
                  <p>{motorcycle.GPSnumber}</p>
                  <h3>Motorcycle Brand</h3>
                  <p>{motorcycle.Brand}</p>
                  <h3>Motorcycle Model</h3>
                  <p>{motorcycle.Model}</p>
                  <h3>Motorcycle License Plate</h3>
                  <p>{motorcycle.LicensePlate}</p>
                  <h3>Motorcycle Type</h3>
                  <p>{motorcycle.Type}</p>
                  <hr />
                </div>
              ))
            ) : (
              <p>No motorcycles associated with this driver.</p>
            )}

            <button onClick={handleViewViolations} style={{
              backgroundColor: '#059855',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '20px 10px',
              width: 'auto',
              height: '60px',
              fontFamily: 'Open Sans',
            }}>    <i className="fas fa-eye" style={{ marginRight: '8px' }}></i>

              View Violations
            </button>

            <Button onClick={goBack} style={{
              float: 'right', marginBottom: '100px', width: 'auto',
              height: '60px', fontSize: '15px', color: '#059855', borderColor: '#059855'
            }}>
              <ArrowLeftOutlined style={{ marginRight: '8px' }} /> Go Back
            </Button>
          </>
        ) : null}
      </main>

      {isPopupVisible && (
        <div className="popup-container" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'auto',
          height: 'auto',
          backgroundColor: 'var(--primary)',
          color: '#059855',
          boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.2)',
          padding: '10px',
          minWidth: '230px',
          height: '180px',
          fontFamily: 'Open Sans',
        }}>
          <span
            className="close-popup-btn1"
            onClick={() => setIsPopupVisible(false)}
            style={{
              position: 'absolute',
              top: '100px',
              right: '10px',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#FF0000',
            }}
          >
            &times;
          </span>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '5px'
          }}>
            {/* SVG for the "No" icon */}
            <svg width="70" height="70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#FF0000" strokeWidth="2" />
              <line x1="8" y1="8" x2="16" y2="16" stroke="#FF0000" strokeWidth="2" />
              <line x1="8" y1="16" x2="16" y2="8" stroke="#FF0000" strokeWidth="2" />
            </svg>
            <p style={{ fontSize: '20px', fontFamily: 'Open Sans', marginTop: '20px' }}>This driver has no violations.</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default DriverDetails;