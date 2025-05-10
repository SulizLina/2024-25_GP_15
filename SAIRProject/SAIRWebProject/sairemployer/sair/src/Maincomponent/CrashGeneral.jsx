import { useEffect, useState } from 'react';
import { doc, getDocs, query, where, collection, onSnapshot } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import Map from './Map'; 
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons'; 
import Header from './Header';
import s from "../css/ViolationDetail.module.css"; // Reusing the same CSS module
import crashImage from '../images/crash.png';
import '../css/CustomModal.css';

const CrashGeneral = () => {
    const [currentCrash, setCurrentCrash] = useState({});
    const [currentMotorCycle, setCurrentMotorCycle] = useState({});
    const [driverDetails, setDriverDetails] = useState({});
    const { crashId } = useParams();
    const navigate = useNavigate();
  
    useEffect(() => {
      const fetchCrashDetails = async () => {
        try {
          const crashDocRef = doc(db, 'Crash', crashId);
          const unsubscribe = onSnapshot(crashDocRef, async (doc) => {
            if (doc.exists()) {
              const crashData = doc.data();
              setCurrentCrash(crashData);
  
              // Fetch driver details using the driver's ID
              const driverCollection = query(
                collection(db, 'Driver'),
                where('DriverID', '==', crashData.driverID)
              );
  
              const driverSnapshot = await getDocs(driverCollection);
              if (!driverSnapshot.empty) {
                const driverData = driverSnapshot.docs[0].data();
                setDriverDetails(driverData);
              }
  
              // Fetch motorcycles using crashID from the Crash collection
              const motorcycleQuery = query(
                collection(db, 'History'),
                where('ID', '==', crashData.crashID) // Match crashID from Crash with ID in History
              );
  
              const motorcycleSnapshot = await getDocs(motorcycleQuery);
              setCurrentMotorCycle(motorcycleSnapshot.docs[0]?.data() || {});
            }
          });
  
          return () => unsubscribe(); // Cleanup the subscription
        } catch (error) {
          console.error("Error fetching crash details:", error);
        }
      };
  
      fetchCrashDetails();
    }, [crashId]);
  
    const goBack = () => {
      navigate(-2); // Navigate back to the previous page
    };
  
    const formatDate = (time) => {
      const date = new Date(time * 1000);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
  
      return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
    };
  

  return (
    <div>
      <Header active="crashes" />

      <div className="breadcrumb">
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/crashes')}>Crashes List</a>
        <span> / </span>
        <a onClick={() => navigate(`/crash/general/${crashId}`)}>Crash Details</a>
      </div>

      <main className={s.violation}>
        <h2 className={s.title}>Crash Details</h2>
        {currentCrash.GPSnumber && currentMotorCycle && (
          <>
            <hr />
            <div>
            <h3 style={{ color: "#059855", fontWeight: 'bold', fontSize: '20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  color="#059855" fill="none" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}}>
        <path d="M14 3.5H10C6.22876 3.5 4.34315 3.5 3.17157 4.67157C2 5.84315 2 7.72876 2 11.5V12.5C2 16.2712 2 18.1569 3.17157 19.3284C4.34315 20.5 6.22876 20.5 10 20.5H14C17.7712 20.5 19.6569 20.5 20.8284 19.3284C22 18.1569 22 16.2712 22 12.5V11.5C22 7.72876 22 5.84315 20.8284 4.67157C19.6569 3.5 17.7712 3.5 14 3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M5 16C6.03569 13.4189 9.89616 13.2491 11 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <path d="M9.75 9.75C9.75 10.7165 8.9665 11.5 8 11.5C7.0335 11.5 6.25 10.7165 6.25 9.75C6.25 8.7835 7.0335 8 8 8C8.9665 8 9.75 8.7835 9.75 9.75Z" stroke="currentColor" stroke-width="1.5" />
        <path d="M14 8.5H19M14 12H19M14 15.5H16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>Driver ID (National ID / Residency Number)</h3>
              <p style={{ fontSize: '18px', marginLeft: '45px' }}>{driverDetails.DriverID}</p>
        <h3 style={{ color: "#059855", fontWeight: 'bold', fontSize: '20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  color="#059855" fill="none" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}}>
        <path d="M14 3.5H10C6.22876 3.5 4.34315 3.5 3.17157 4.67157C2 5.84315 2 7.72876 2 11.5V12.5C2 16.2712 2 18.1569 3.17157 19.3284C4.34315 20.5 6.22876 20.5 10 20.5H14C17.7712 20.5 19.6569 20.5 20.8284 19.3284C22 18.1569 22 16.2712 22 12.5V11.5C22 7.72876 22 5.84315 20.8284 4.67157C19.6569 3.5 17.7712 3.5 14 3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M5 16C6.03569 13.4189 9.89616 13.2491 11 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <path d="M9.75 9.75C9.75 10.7165 8.9665 11.5 8 11.5C7.0335 11.5 6.25 10.7165 6.25 9.75C6.25 8.7835 7.0335 8 8 8C8.9665 8 9.75 8.7835 9.75 9.75Z" stroke="currentColor" stroke-width="1.5" />
        <path d="M14 8.5H19M14 12H19M14 15.5H16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>Name</h3>
              <p style={{ fontSize: '18px', marginLeft: '45px' }}>{driverDetails.Fname} {driverDetails.Lname}</p>
              <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <path d="M9.1585 5.71223L8.75584 4.80625C8.49256 4.21388 8.36092 3.91768 8.16405 3.69101C7.91732 3.40694 7.59571 3.19794 7.23592 3.08785C6.94883 3 6.6247 3 5.97645 3C5.02815 3 4.554 3 4.15597 3.18229C3.68711 3.39702 3.26368 3.86328 3.09497 4.3506C2.95175 4.76429 2.99278 5.18943 3.07482 6.0397C3.94815 15.0902 8.91006 20.0521 17.9605 20.9254C18.8108 21.0075 19.236 21.0485 19.6496 20.9053C20.137 20.7366 20.6032 20.3131 20.818 19.8443C21.0002 19.4462 21.0002 18.9721 21.0002 18.0238C21.0002 17.3755 21.0002 17.0514 20.9124 16.7643C20.8023 16.4045 20.5933 16.0829 20.3092 15.8362C20.0826 15.6393 19.7864 15.5077 19.194 15.2444L18.288 14.8417C17.6465 14.5566 17.3257 14.4141 16.9998 14.3831C16.6878 14.3534 16.3733 14.3972 16.0813 14.5109C15.7762 14.6297 15.5066 14.8544 14.9672 15.3038C14.4304 15.7512 14.162 15.9749 13.834 16.0947C13.5432 16.2009 13.1588 16.2403 12.8526 16.1951C12.5071 16.1442 12.2426 16.0029 11.7135 15.7201C10.0675 14.8405 9.15977 13.9328 8.28011 12.2867C7.99738 11.7577 7.85602 11.4931 7.80511 11.1477C7.75998 10.8414 7.79932 10.457 7.90554 10.1663C8.02536 9.83828 8.24905 9.56986 8.69643 9.033C9.14586 8.49368 9.37058 8.22402 9.48939 7.91891C9.60309 7.62694 9.64686 7.3124 9.61719 7.00048C9.58618 6.67452 9.44362 6.35376 9.1585 5.71223Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
</svg>Phone Number</h3>
                        <p style={{fontSize:'18px', marginLeft:'45px'}}>{driverDetails.PhoneNumber}</p>
                        <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <path d="M2 5L8.91302 8.92462C11.4387 10.3585 12.5613 10.3585 15.087 8.92462L22 5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
    <path d="M10.5 19.5C10.0337 19.4939 9.56682 19.485 9.09883 19.4732C5.95033 19.3941 4.37608 19.3545 3.24496 18.2184C2.11383 17.0823 2.08114 15.5487 2.01577 12.4814C1.99475 11.4951 1.99474 10.5147 2.01576 9.52843C2.08114 6.46113 2.11382 4.92748 3.24495 3.79139C4.37608 2.6553 5.95033 2.61573 9.09882 2.53658C11.0393 2.4878 12.9607 2.48781 14.9012 2.53659C18.0497 2.61574 19.6239 2.65532 20.755 3.79141C21.8862 4.92749 21.9189 6.46114 21.9842 9.52844C21.9939 9.98251 21.9991 10.1965 21.9999 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M19 17C19 17.8284 18.3284 18.5 17.5 18.5C16.6716 18.5 16 17.8284 16 17C16 16.1716 16.6716 15.5 17.5 15.5C18.3284 15.5 19 16.1716 19 17ZM19 17V17.5C19 18.3284 19.6716 19 20.5 19C21.3284 19 22 18.3284 22 17.5V17C22 14.5147 19.9853 12.5 17.5 12.5C15.0147 12.5 13 14.5147 13 17C13 19.4853 15.0147 21.5 17.5 21.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>
Email</h3>
                        <p style={{fontSize:'18px', marginLeft:'45px'}}> <a
    href={`mailto:${driverDetails.Email}`}
    style={{
      color: 'black', 
      textDecoration: 'underline', 
      transition: 'color 0.3s', 
    }}
    onMouseEnter={(e) => (e.currentTarget.style.color = 'green')} 
    onMouseLeave={(e) => (e.currentTarget.style.color = 'black')} 
  >
    {driverDetails.Email}
  </a></p>

            <hr /> 

              <h3 style={{ color: "#059855", fontWeight: 'bold', fontSize: '20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="45" height="45" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <circle cx="19.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="1.5" />
    <circle cx="4.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="1.5" />
    <path d="M20.2348 7.86957C21.5163 9.42897 21.9615 10.9117 21.9994 11.6957C21.3294 11.3893 20.5771 11.2174 19.7821 11.2174C17.3369 11.2174 15.1419 12.8433 14.6177 15.0092C14.4924 15.527 14.4298 15.7859 14.2937 15.8929C14.1577 16 13.9382 16 13.4994 16H10.6206C10.1784 16 9.95733 16 9.82074 15.8915C9.68414 15.7829 9.62431 15.5249 9.50465 15.0088C9.00893 12.8708 6.99671 11.0124 4.90197 11.1698C4.69089 11.1857 4.58535 11.1936 4.51294 11.1775C4.44054 11.1613 4.36764 11.1202 4.22185 11.0378C3.80097 10.8001 3.37061 10.5744 2.95793 10.3227C2.38299 9.97198 2.02315 9.35549 2.00053 8.68241C1.98766 8.29933 2.20797 7.91865 2.65301 8.02338L9.07369 9.53435C9.55601 9.64785 9.79717 9.70461 10.0044 9.66597C10.2116 9.62734 10.4656 9.4536 10.9737 9.10614C12.262 8.22518 14.3037 7.39305 16.339 8.12822C16.8961 8.32947 17.1747 8.4301 17.3334 8.43513C17.4921 8.44016 17.7247 8.37247 18.1899 8.23707C18.9431 8.01785 19.6521 7.90409 20.2348 7.86957ZM20.2348 7.86957C19.4316 6.89211 18.2997 5.88452 16.7336 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>Motorcycle Brand</h3>
              <p style={{ fontSize: '18px', marginLeft: '45px' }}>{currentMotorCycle.Brand}</p>

              <h3 style={{ color: "#059855", fontWeight: 'bold', fontSize: '20px' }}> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="45" height="45" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <circle cx="19.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="1.5" />
    <circle cx="4.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="1.5" />
    <path d="M20.2348 7.86957C21.5163 9.42897 21.9615 10.9117 21.9994 11.6957C21.3294 11.3893 20.5771 11.2174 19.7821 11.2174C17.3369 11.2174 15.1419 12.8433 14.6177 15.0092C14.4924 15.527 14.4298 15.7859 14.2937 15.8929C14.1577 16 13.9382 16 13.4994 16H10.6206C10.1784 16 9.95733 16 9.82074 15.8915C9.68414 15.7829 9.62431 15.5249 9.50465 15.0088C9.00893 12.8708 6.99671 11.0124 4.90197 11.1698C4.69089 11.1857 4.58535 11.1936 4.51294 11.1775C4.44054 11.1613 4.36764 11.1202 4.22185 11.0378C3.80097 10.8001 3.37061 10.5744 2.95793 10.3227C2.38299 9.97198 2.02315 9.35549 2.00053 8.68241C1.98766 8.29933 2.20797 7.91865 2.65301 8.02338L9.07369 9.53435C9.55601 9.64785 9.79717 9.70461 10.0044 9.66597C10.2116 9.62734 10.4656 9.4536 10.9737 9.10614C12.262 8.22518 14.3037 7.39305 16.339 8.12822C16.8961 8.32947 17.1747 8.4301 17.3334 8.43513C17.4921 8.44016 17.7247 8.37247 18.1899 8.23707C18.9431 8.01785 19.6521 7.90409 20.2348 7.86957ZM20.2348 7.86957C19.4316 6.89211 18.2997 5.88452 16.7336 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>Motorcycle Type</h3>
              <p style={{ fontSize: '18px', marginLeft: '45px' }}>{currentMotorCycle.Type}</p>

              <h3 style={{ color: "#059855", fontWeight: 'bold', fontSize: '20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="45" height="45" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <circle cx="19.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="1.5" />
    <circle cx="4.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="1.5" />
    <path d="M20.2348 7.86957C21.5163 9.42897 21.9615 10.9117 21.9994 11.6957C21.3294 11.3893 20.5771 11.2174 19.7821 11.2174C17.3369 11.2174 15.1419 12.8433 14.6177 15.0092C14.4924 15.527 14.4298 15.7859 14.2937 15.8929C14.1577 16 13.9382 16 13.4994 16H10.6206C10.1784 16 9.95733 16 9.82074 15.8915C9.68414 15.7829 9.62431 15.5249 9.50465 15.0088C9.00893 12.8708 6.99671 11.0124 4.90197 11.1698C4.69089 11.1857 4.58535 11.1936 4.51294 11.1775C4.44054 11.1613 4.36764 11.1202 4.22185 11.0378C3.80097 10.8001 3.37061 10.5744 2.95793 10.3227C2.38299 9.97198 2.02315 9.35549 2.00053 8.68241C1.98766 8.29933 2.20797 7.91865 2.65301 8.02338L9.07369 9.53435C9.55601 9.64785 9.79717 9.70461 10.0044 9.66597C10.2116 9.62734 10.4656 9.4536 10.9737 9.10614C12.262 8.22518 14.3037 7.39305 16.339 8.12822C16.8961 8.32947 17.1747 8.4301 17.3334 8.43513C17.4921 8.44016 17.7247 8.37247 18.1899 8.23707C18.9431 8.01785 19.6521 7.90409 20.2348 7.86957ZM20.2348 7.86957C19.4316 6.89211 18.2997 5.88452 16.7336 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>Motorcycle Model</h3>
              <p style={{ fontSize: '18px', marginLeft: '45px' }}>{currentMotorCycle.Model}</p>

              <h3 style={{ color: "#059855", fontWeight: 'bold', fontSize: '20px' }}>      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
        <path d="M2 12C2 8.46252 2 6.69377 3.0528 5.5129C3.22119 5.32403 3.40678 5.14935 3.60746 4.99087C4.86213 4 6.74142 4 10.5 4H13.5C17.2586 4 19.1379 4 20.3925 4.99087C20.5932 5.14935 20.7788 5.32403 20.9472 5.5129C22 6.69377 22 8.46252 22 12C22 15.5375 22 17.3062 20.9472 18.4871C20.7788 18.676 20.5932 18.8506 20.3925 19.0091C19.1379 20 17.2586 20 13.5 20H10.5C6.74142 20 4.86213 20 3.60746 19.0091C3.40678 18.8506 3.22119 18.676 3.0528 18.4871C2 17.3062 2 15.5375 2 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M10 16H11.5" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M14.5 16L18 16" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M2 9H22" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
      </svg>Motorcycle License Plate</h3>
              <p style={{ fontSize: '18px', marginLeft: '45px' }}>{currentMotorCycle.LicensePlate}</p>

              <h3 style={{ color: "#059855", fontWeight: 'bold', fontSize: '20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <path d="M12 2C17.5237 2 22 6.47778 22 12C22 17.5222 17.5237 22 12 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M9 21.5C7.81163 21.0953 6.69532 20.5107 5.72302 19.7462M5.72302 4.25385C6.69532 3.50059 7.81163 2.90473 9 2.5M2 10.2461C2.21607 9.08813 2.66019 7.96386 3.29638 6.94078M2 13.7539C2.21607 14.9119 2.66019 16.0361 3.29638 17.0592" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M12.7185 16.2151C12.5258 16.3979 12.2682 16.5 12.0001 16.5C11.732 16.5 11.4744 16.3979 11.2817 16.2151C9.51674 14.5317 7.15154 12.6511 8.30498 9.92085C8.92863 8.44462 10.4257 7.5 12.0001 7.5C13.5745 7.5 15.0715 8.44462 15.6952 9.92085C16.8472 12.6477 14.4878 14.5375 12.7185 16.2151Z" stroke="currentColor" stroke-width="1.5" />
    <path d="M11.9961 11.5H12.0024" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>GPS Serial Number</h3>
              <p style={{ fontSize: '18px', marginLeft: '45px' }}>{currentMotorCycle.GPSnumber}</p>
            </div>

            <hr />
            <div>

            <h3 style={{ color: "#059855", fontWeight: 'bold', fontSize: '20px', display: 'flex', alignItems: 'center',  }}>
                <img 
                  src={crashImage} 
                  alt="Crash Icon" 
                  style={{ 
                    width: '30px', // Match SVG width
                    height: '30px', // Match SVG height
                    marginBottom: '2px', 
                    marginRight: '5px',
                    marginLeft:'1px',
                    filter: 'invert(22%) sepia(83%) saturate(2157%) hue-rotate(150deg) brightness(95%)' // Adjust filter to approximate #059855
                  }} 
                />Crash ID</h3>
              <p style={{ fontSize: '18px', marginLeft: '45px' }}>{currentCrash.crashID}</p>

              <h3 style={{ color: "#059855", fontWeight: 'bold', fontSize: '20px' }}>   <span style={{ 
    backgroundColor: currentCrash.Status === "Emergency SOS" ? "red" : "green", // Set backgroundColor
    marginRight: '20px',
    marginLeft:'5px',
    borderRadius: '50%', 
    display: 'inline-block', 
    width: '12px', 
    height: '12px' 
  }}></span>Status</h3>
<p style={{ fontSize: '18px', marginLeft: '45px' }}>
  {currentCrash.Status}
</p>

              <h3 style={{ color: "#059855", fontWeight: 'bold', fontSize: '20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <path d="M18.952 8.60639L21.4621 8.45358C19.6628 3.70459 14.497 0.999731 9.46037 2.34456C4.09595 3.77692 0.909592 9.26089 2.34343 14.5933C3.77728 19.9258 9.28835 23.0874 14.6528 21.6551C18.6358 20.5916 21.418 17.2945 22 13.4842" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M12 7.99982V11.9998L14 13.9998" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>Time</h3>
              <p style={{ fontSize: '18px', marginLeft: '45px' }}>{new Date(currentCrash.time * 1000).toLocaleTimeString()}</p>

              <h3 style={{ color: "#059855", fontWeight: 'bold', fontSize: '20px' }}> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-3px', marginRight:'10px'}} color="#059855" fill="none">
    <path d="M18 2V4M6 2V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M11.9955 13H12.0045M11.9955 17H12.0045M15.991 13H16M8 13H8.00897M8 17H8.00897" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M3.5 8H20.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M2.5 12.2432C2.5 7.88594 2.5 5.70728 3.75212 4.35364C5.00424 3 7.01949 3 11.05 3H12.95C16.9805 3 18.9958 3 20.2479 4.35364C21.5 5.70728 21.5 7.88594 21.5 12.2432V12.7568C21.5 17.1141 21.5 19.2927 20.2479 20.6464C18.9958 22 16.9805 22 12.95 22H11.05C7.01949 22 5.00424 22 3.75212 20.6464C2.5 19.2927 2.5 17.1141 2.5 12.7568V12.2432Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M3 8H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>Date</h3>
              <p style={{ fontSize: '18px', marginLeft: '45px' }}>{formatDate(currentCrash.time)}</p>

              <h3 style={{ color: "#059855", fontWeight: 'bold', fontSize: '20px' }}> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-3px', marginRight:'10px'}} color="#059855" fill="none">
    <path d="M14.5 9.5H14.509" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M14.5 6C16.3941 6 18 7.61319 18 9.57031C18 11.5586 16.368 12.9539 14.8605 13.9027C14.7506 13.9665 14.6264 14 14.5 14C14.3736 14 14.2494 13.9665 14.1395 13.9027C12.6348 12.9446 11 11.5655 11 9.57031C11 7.61319 12.6059 6 14.5 6Z" stroke="currentColor" stroke-width="1.5" />
    <path d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" stroke="currentColor" stroke-width="1.5" />
    <path d="M17 21L3 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M10 14L4 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>Crash Location</h3>
              <p style={{ fontSize: '18px', marginLeft: '45px' }}>{currentCrash.location}</p>
            </div>

            <div className="map">
              {currentCrash.position && (
                <Map 
                  lat={currentCrash.position.latitude} 
                  lng={currentCrash.position.longitude} 
                  placeName={currentCrash.location} 
                />
              )}
            </div>
            <hr />
            <div style={{ marginBottom: '80px' }}>
              <Button onClick={goBack} style={{
                float: 'left', marginBottom: '100px', width: 'auto',
                height: '60px', fontSize: '15px', color: '#059855', borderColor: '#059855'
              }}>
                <ArrowLeftOutlined style={{ marginRight: '8px' }} /> Go Back
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default CrashGeneral;