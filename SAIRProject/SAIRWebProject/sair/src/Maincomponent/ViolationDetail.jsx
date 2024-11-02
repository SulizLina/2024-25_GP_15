import { useEffect, useState } from 'react';
import { doc, getDoc, getDocs, query, where, collection, onSnapshot } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import Map from './Map'; 
import SAIRLogo from '../images/SAIRlogo.png';
import logoutIcon from '../images/logout.png';
import { Button, Table, Dropdown, Menu } from 'antd';
import { UserOutlined, DownOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Header from './Header';

import s from "../css/ViolationDetail.module.css";

const ViolationDetail = () => {
  const [violations, setViolations] = useState([]);
  const [motorcycleData, setMotorcycleData] = useState({});
  const { driverId } = useParams(); // Get driver ID from URL
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const fetchViolationsByDriver = () => {
      console.log('Querying violations for Driver ID:', driverId);

      const violationsQuery = query(
        collection(db, 'Violation'),
        where('driverID', '==', driverId)
      );

      const unsubscribe = onSnapshot(violationsQuery, async (querySnapshot) => { // Mark async here
        const violationsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log('Real-time violations fetched:', violationsList);
        setViolations(violationsList);

        if (violationsList.length > 0 && violationsList[0].GPSnumber) {
          const motorcycleQuery = query(
            collection(db, 'Motorcycle'),
            where('GPSnumber', '==', violationsList[0].GPSnumber)
          );

          onSnapshot(motorcycleQuery, (motorcycleSnapshot) => {
            setMotorcycleData(motorcycleSnapshot.docs[0]?.data() || {});
          });
        }
      });

      return () => unsubscribe();
    };

    fetchViolationsByDriver();
  }, [driverId]);

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
        <a onClick={() => navigate('/driverslist')}>Driver List</a>
        <span> / </span>
        <a onClick={() => navigate('/driver-details/:driverId')}>Drivers Details</a>
        <span> / </span>
        <a onClick={() => navigate(`/violation/detail/${driverId}`)}>Violation Details</a>
      </div>

      <main  className={s.violation}>
        <h2 className={s.title}>
          Violation Details for Driver ID: {driverId}
        </h2>
        {violations.map((violation, index) => (
          <div key={violation.id}>
            <hr />
            <h3 style={{ color: "#059855", fontSize: "20px", fontWeight: "bold" }}>
              Violation {index + 1}
            </h3>
            <h3>Motorcycle License Plate</h3>
            <p>{motorcycleData.LicensePlate || 'Not Available'}</p>
            <h3>Violation ID</h3>
            <p>{violation.ViolationID}</p>
            <h3>Street Speed</h3>
            <p>{violation.streetMaxSpeed} km/h</p>
            <h3>Motorcycle Speed</h3>
            <p>{violation.driverSpeed} km/h</p>
            <h3>Violation Price</h3>
            <p>{violation.price} SAR</p>
            <h3>Time</h3>
            <p>{new Date(violation.time * 1000).toLocaleTimeString()}</p>
            <h3>Date</h3>
            <p>{new Date(violation.time * 1000).toLocaleDateString('en-US')}</p>
            <h3>Violation Location</h3>
            <p>{violation.location}</p>
            <div className={s.map}>
              {violation.position &&
                <Map lat={violation.position.latitude} lng={violation.position.longitude} />}
            </div>
            <hr />
          </div>
        ))}
        <div style={{ marginBottom: '50px' }}>
          <Button onClick={goBack}
            style={{
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

export default ViolationDetail;