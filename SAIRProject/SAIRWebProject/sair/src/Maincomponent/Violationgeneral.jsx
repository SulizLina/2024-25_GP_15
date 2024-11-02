import { useEffect, useState } from 'react';
import { doc, getDoc, getDocs, query, where, collection, onSnapshot } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import Map from './Map'; 
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons'; 
import Header from './Header';

import s from "../css/ViolationDetail.module.css";

const ViolationGeneral = () => {
  const [currentViolation, setCurrentViolation] = useState({});
  const [currentMotorCycle, setCurrentMotorCycle] = useState({});
  const { violationId } = useParams();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const fetchViolationDetails = async () => {
      try {
        // Fetch violation details from the new "Violation" collection
        const violationDocRef = doc(db, 'Violation', violationId);
        const unsubscribe = onSnapshot(violationDocRef, async (doc) => {
          if (doc.exists()) {
            const violationData = doc.data();
            setCurrentViolation(violationData);

            // Fetch motorcycle details if GPS number is available
            if (violationData.GPSnumber) {
              const q = query(collection(db, "Motorcycle"), where("GPSnumber", "==", violationData.GPSnumber));
              const querySnapshot = await getDocs(q);
              setCurrentMotorCycle(querySnapshot.docs[0]?.data() || {});
            }
          }
        });
      } catch (error) {
        console.error("Error fetching violation details:", error);
      }
    };

    fetchViolationDetails();
  }, [violationId]);


  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/'); // Redirect to login page
    }).catch((error) => {
      console.error('Error LOGGING out:', error);
    });
  };

  const goBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  const formatDate = (time) => {
    const date = new Date(time * 1000); // Assuming timestamp is in seconds
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const day = date.getDate().toString().padStart(2, '0'); // Days are 1-based

    return `${month}/${day}/${year}`; // Format as YYYY-MM-DD
  };

  useEffect(() => {
    const fetchUserName = async () => {
      const employerUID = sessionStorage.getItem('employerUID'); // Get the stored UID

      if (employerUID) {
        try {
          const userDocRef = doc(db, 'Employer', employerUID); // Use the UID to fetch the document
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const employerData = docSnap.data();
            console.log("Employer Data:", employerData); // Log the fetched data
            setCompanyName(employerData.CompanyName); // Set the company name
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error('Error fetching employer data:', error);
        }
      }
    };

    fetchUserName();
  }, []);

  return (
    <div  >

      <Header active="violations" />

      <div className="breadcrumb">
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/violations')}>Violations List</a>
        <span> / </span>
        <a onClick={() => navigate(`/violation/general/${violationId}`)}>Violation Details</a>
      </div>

      <main className={s.violation}>
        <h2 className={s.title}>Violation Details</h2>
        {currentViolation.GPSnumber && currentMotorCycle && (
          <>
            <hr />
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Driver ID
              <span style={{ fontSize: '12px', color: 'gray', marginTop: "8px" }}>
                (National ID / Residency Number)</span>
            </h3>
            <p>{currentViolation.driverID}</p>
            <h3>Motorcycle License Plate</h3>
            <p>{currentMotorCycle.LicensePlate}</p>
            <h3>GPS Serial Number</h3>
            <p>{currentMotorCycle.GPSnumber}</p>
            <h3>Motorcycle Type</h3>
            <p>{currentMotorCycle.Type}</p>
            <h3>Motorcycle Brand</h3>
            <p>{currentMotorCycle.Brand}</p>
            <h3>Motorcycle Model</h3>
            <p>{currentMotorCycle.Model}</p>
          </>
        )}
        <hr />
        <h3>Violation ID</h3>
        <p>{currentViolation.violationID}</p>
        <h3>Street Speed</h3>
        <p>{currentViolation.streetMaxSpeed}</p>
        <h3>Motorcycle Speed</h3>
        <p>{currentViolation.driverSpeed}</p>
        <h3>Violation Amount</h3>
        <p>{currentViolation.price} SAR</p>
        <h3>Time</h3>
        <p>{new Date(currentViolation.time * 1000).toLocaleTimeString()}</p>
        <h3>Date</h3>
        <p>{formatDate(currentViolation.time)}</p>
        <hr />
        <h3>Violation Location</h3>
        <p>{currentViolation.location}</p>
        <div className="map">
          {currentViolation.position && (
            <Map
              lat={currentViolation.position.latitude}
              lng={currentViolation.position.longitude}
              placeName={currentViolation.location}
            />
          )}
        </div>
        <div style={{ marginBottom: '100px' }}>
          <Button onClick={goBack} style={{
            float: 'right', marginBottom: '100px', width: 'auto',
            height: '60px', fontSize: '15px', color: '#059855', borderColor: '#059855'
          }}>
            <ArrowLeftOutlined style={{ marginRight: '8px' }} /> Go Back
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ViolationGeneral;
