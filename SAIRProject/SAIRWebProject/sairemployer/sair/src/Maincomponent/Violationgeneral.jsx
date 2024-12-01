import { useEffect, useState } from 'react';
import { doc, getDoc, getDocs, query, where, collection, onSnapshot } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import Map from './Map'; 
import { Button, Modal } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons'; 
import Header from './Header';
import s from "../css/ViolationDetail.module.css";
import X from '../images/redx.webp';
import '../css/CustomModal.css';

const ViolationGeneral = () => {
  const [currentViolation, setCurrentViolation] = useState({});
  const [currentMotorCycle, setCurrentMotorCycle] = useState({});
  const { violationId } = useParams(); 
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [companyName, setCompanyName] = useState('');
  const [isPopupVisible, setIsPopupVisible] = useState(false);


  useEffect(() => {
    const fetchViolationDetails = async () => {
      try {
        // Fetch violation details from the "Violation" collection
        const violationDocRef = doc(db, 'Violation', violationId);
        const unsubscribe = onSnapshot(violationDocRef, async (doc) => {
          if (doc.exists()) {
            const violationData = doc.data();
            setCurrentViolation(violationData);

            // Fetch motorcycle details from the History collection using violationID
            if (violationData.violationID) {
              const q = query(collection(db, "History"), where("ID", "==", violationData.violationID));
              const querySnapshot = await getDocs(q);
              setCurrentMotorCycle(querySnapshot.docs[0]?.data() || {});
            } 
            // Fetch complaints associated with this violation
        fetchComplaints(violationData.violationID);
          }
        });
       

        return () => unsubscribe();
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

    return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
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

  const fetchComplaints = async (violationID) => {
    try {
      const complaintsQuery = query(collection(db, 'Complaint'), where('ViolationID', '==', violationID));
      const complaintsSnapshot = await getDocs(complaintsQuery);
      const complaintsData = complaintsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComplaints(complaintsData);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const handleViewComplaints = () => {
    if (complaints.length > 0) {
      navigate(`/complaint/general/${complaints[0].id}`, { state: { from: 'ViolationGeneral' } }); // Navigate to the first complaint
    } else {
      setIsPopupVisible(true); // Show popup if no complaints exist
    }
  };

  const getOrdinal = (num) => {
    const ordinals = [
      "th", // 0
      "first", // 1
      "second", // 2
      "third", // 3
      "fourth", // 4
      "fifth", // 5
      "sixth", // 6
      "seventh", // 7
      "eighth", // 8
      "ninth", // 9
      "tenth", // 10
      "eleventh", // 11
      "twelfth", // 12
      "thirteenth", // 13
      "fourteenth", // 14
      "fifteenth", // 15
      "sixteenth", // 16
      "seventeenth", // 17
      "eighteenth", // 18
      "nineteenth", // 19
      "twentieth" // 20
    ];
    
    if (num < ordinals.length) return ordinals[num];
    
    // For numbers greater than 20, return "th"
    return num + "th"; // Fallback for numbers greater than 20
  };

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
            <div>
  <div >
    <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  color="#059855" fill="none" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}}>
        <path d="M14 3.5H10C6.22876 3.5 4.34315 3.5 3.17157 4.67157C2 5.84315 2 7.72876 2 11.5V12.5C2 16.2712 2 18.1569 3.17157 19.3284C4.34315 20.5 6.22876 20.5 10 20.5H14C17.7712 20.5 19.6569 20.5 20.8284 19.3284C22 18.1569 22 16.2712 22 12.5V11.5C22 7.72876 22 5.84315 20.8284 4.67157C19.6569 3.5 17.7712 3.5 14 3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M5 16C6.03569 13.4189 9.89616 13.2491 11 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <path d="M9.75 9.75C9.75 10.7165 8.9665 11.5 8 11.5C7.0335 11.5 6.25 10.7165 6.25 9.75C6.25 8.7835 7.0335 8 8 8C8.9665 8 9.75 8.7835 9.75 9.75Z" stroke="currentColor" stroke-width="1.5" />
        <path d="M14 8.5H19M14 12H19M14 15.5H16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      Driver ID (National ID / Residency Number)
    </h3>
    <p style={{fontSize:'18px', marginLeft:'45px'}}>{currentViolation.driverID}</p>
  </div>
              <div>
            <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="45" height="45" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <circle cx="19.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="1.5" />
    <circle cx="4.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="1.5" />
    <path d="M20.2348 7.86957C21.5163 9.42897 21.9615 10.9117 21.9994 11.6957C21.3294 11.3893 20.5771 11.2174 19.7821 11.2174C17.3369 11.2174 15.1419 12.8433 14.6177 15.0092C14.4924 15.527 14.4298 15.7859 14.2937 15.8929C14.1577 16 13.9382 16 13.4994 16H10.6206C10.1784 16 9.95733 16 9.82074 15.8915C9.68414 15.7829 9.62431 15.5249 9.50465 15.0088C9.00893 12.8708 6.99671 11.0124 4.90197 11.1698C4.69089 11.1857 4.58535 11.1936 4.51294 11.1775C4.44054 11.1613 4.36764 11.1202 4.22185 11.0378C3.80097 10.8001 3.37061 10.5744 2.95793 10.3227C2.38299 9.97198 2.02315 9.35549 2.00053 8.68241C1.98766 8.29933 2.20797 7.91865 2.65301 8.02338L9.07369 9.53435C9.55601 9.64785 9.79717 9.70461 10.0044 9.66597C10.2116 9.62734 10.4656 9.4536 10.9737 9.10614C12.262 8.22518 14.3037 7.39305 16.339 8.12822C16.8961 8.32947 17.1747 8.4301 17.3334 8.43513C17.4921 8.44016 17.7247 8.37247 18.1899 8.23707C18.9431 8.01785 19.6521 7.90409 20.2348 7.86957ZM20.2348 7.86957C19.4316 6.89211 18.2997 5.88452 16.7336 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>Motorcycle Brand</h3>
            <p style={{fontSize:'18px', marginLeft:'45px'}}>{currentMotorCycle.Brand}</p>
            </div>
            <div >
            <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <circle cx="19.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="1.5" />
    <circle cx="4.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="1.5" />
    <path d="M20.2348 7.86957C21.5163 9.42897 21.9615 10.9117 21.9994 11.6957C21.3294 11.3893 20.5771 11.2174 19.7821 11.2174C17.3369 11.2174 15.1419 12.8433 14.6177 15.0092C14.4924 15.527 14.4298 15.7859 14.2937 15.8929C14.1577 16 13.9382 16 13.4994 16H10.6206C10.1784 16 9.95733 16 9.82074 15.8915C9.68414 15.7829 9.62431 15.5249 9.50465 15.0088C9.00893 12.8708 6.99671 11.0124 4.90197 11.1698C4.69089 11.1857 4.58535 11.1936 4.51294 11.1775C4.44054 11.1613 4.36764 11.1202 4.22185 11.0378C3.80097 10.8001 3.37061 10.5744 2.95793 10.3227C2.38299 9.97198 2.02315 9.35549 2.00053 8.68241C1.98766 8.29933 2.20797 7.91865 2.65301 8.02338L9.07369 9.53435C9.55601 9.64785 9.79717 9.70461 10.0044 9.66597C10.2116 9.62734 10.4656 9.4536 10.9737 9.10614C12.262 8.22518 14.3037 7.39305 16.339 8.12822C16.8961 8.32947 17.1747 8.4301 17.3334 8.43513C17.4921 8.44016 17.7247 8.37247 18.1899 8.23707C18.9431 8.01785 19.6521 7.90409 20.2348 7.86957ZM20.2348 7.86957C19.4316 6.89211 18.2997 5.88452 16.7336 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>Motorcycle Type</h3>
            <p style={{fontSize:'18px', marginLeft:'45px'}}>{currentMotorCycle.Type}</p>
            </div> 
                       <div>
            <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <circle cx="19.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="1.5" />
    <circle cx="4.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="1.5" />
    <path d="M20.2348 7.86957C21.5163 9.42897 21.9615 10.9117 21.9994 11.6957C21.3294 11.3893 20.5771 11.2174 19.7821 11.2174C17.3369 11.2174 15.1419 12.8433 14.6177 15.0092C14.4924 15.527 14.4298 15.7859 14.2937 15.8929C14.1577 16 13.9382 16 13.4994 16H10.6206C10.1784 16 9.95733 16 9.82074 15.8915C9.68414 15.7829 9.62431 15.5249 9.50465 15.0088C9.00893 12.8708 6.99671 11.0124 4.90197 11.1698C4.69089 11.1857 4.58535 11.1936 4.51294 11.1775C4.44054 11.1613 4.36764 11.1202 4.22185 11.0378C3.80097 10.8001 3.37061 10.5744 2.95793 10.3227C2.38299 9.97198 2.02315 9.35549 2.00053 8.68241C1.98766 8.29933 2.20797 7.91865 2.65301 8.02338L9.07369 9.53435C9.55601 9.64785 9.79717 9.70461 10.0044 9.66597C10.2116 9.62734 10.4656 9.4536 10.9737 9.10614C12.262 8.22518 14.3037 7.39305 16.339 8.12822C16.8961 8.32947 17.1747 8.4301 17.3334 8.43513C17.4921 8.44016 17.7247 8.37247 18.1899 8.23707C18.9431 8.01785 19.6521 7.90409 20.2348 7.86957ZM20.2348 7.86957C19.4316 6.89211 18.2997 5.88452 16.7336 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>Motorcycle Model</h3>
            <p style={{fontSize:'18px', marginLeft:'45px'}}>{currentMotorCycle.Model}</p>
            </div>
  <div >
    <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
        <path d="M2 12C2 8.46252 2 6.69377 3.0528 5.5129C3.22119 5.32403 3.40678 5.14935 3.60746 4.99087C4.86213 4 6.74142 4 10.5 4H13.5C17.2586 4 19.1379 4 20.3925 4.99087C20.5932 5.14935 20.7788 5.32403 20.9472 5.5129C22 6.69377 22 8.46252 22 12C22 15.5375 22 17.3062 20.9472 18.4871C20.7788 18.676 20.5932 18.8506 20.3925 19.0091C19.1379 20 17.2586 20 13.5 20H10.5C6.74142 20 4.86213 20 3.60746 19.0091C3.40678 18.8506 3.22119 18.676 3.0528 18.4871C2 17.3062 2 15.5375 2 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M10 16H11.5" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M14.5 16L18 16" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M2 9H22" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
      </svg>
      Motorcycle License Plate
    </h3>
    <p style={{fontSize:'18px', marginLeft:'45px'}}>{currentMotorCycle.LicensePlate}</p>
  </div>
  <div>
            <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <path d="M12 2C17.5237 2 22 6.47778 22 12C22 17.5222 17.5237 22 12 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M9 21.5C7.81163 21.0953 6.69532 20.5107 5.72302 19.7462M5.72302 4.25385C6.69532 3.50059 7.81163 2.90473 9 2.5M2 10.2461C2.21607 9.08813 2.66019 7.96386 3.29638 6.94078M2 13.7539C2.21607 14.9119 2.66019 16.0361 3.29638 17.0592" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M12.7185 16.2151C12.5258 16.3979 12.2682 16.5 12.0001 16.5C11.732 16.5 11.4744 16.3979 11.2817 16.2151C9.51674 14.5317 7.15154 12.6511 8.30498 9.92085C8.92863 8.44462 10.4257 7.5 12.0001 7.5C13.5745 7.5 15.0715 8.44462 15.6952 9.92085C16.8472 12.6477 14.4878 14.5375 12.7185 16.2151Z" stroke="currentColor" stroke-width="1.5" />
    <path d="M11.9961 11.5H12.0024" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>GPS Serial Number</h3>
            <p style={{fontSize:'18px', marginLeft:'45px'}}>{currentMotorCycle.GPSnumber}</p>
 </div>
 


        <hr />
        <div >
        <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <path d="M19 18.5C18.4313 19.3861 17.799 20.284 16.8019 20.6679C15.9395 21 14.8562 21 12.6896 21C11.5534 21 10.9853 21 10.4566 20.8834C9.64995 20.7056 8.90001 20.3294 8.27419 19.7888C7.86398 19.4344 7.52311 18.9785 6.84137 18.0667L3.83738 14.0487C3.3758 13.4314 3.38907 12.5789 3.86965 11.9763C4.49772 11.1888 5.66877 11.1237 6.3797 11.8369L8.0011 13.4634V7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M11.0004 5.5C11.0004 4.67157 10.3288 4 9.50036 4C9.32491 4 9.15649 4.03012 9 4.08548M11.0004 5.5V3.5C11.0004 2.67157 11.6719 2 12.5004 2C13.3288 2 14.0004 2.67157 14.0004 3.5V5.5M11.0004 5.5V6.5011M14.0004 5.5C14.0004 4.67157 14.6719 4 15.5004 4C16.3288 4 17.0004 4.67157 17.0004 5.5V7.5M14.0004 5.5V9.5011M17.0004 7.5C17.0004 6.67157 17.6719 6 18.5004 6C19.3288 6 20.0004 6.67157 20.0004 7.5C19.9984 10.1666 20.0155 12.8335 19.9875 15.5M17.0004 7.5V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M2.5 2L22.5 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
</svg>Violation ID</h3>
        <p style={{fontSize:'18px', marginLeft:'45px'}}>{currentViolation.violationID}</p>
        </div>
        <div>
        <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <path d="M21 4L2.99997 4M21 20L2.99997 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M7.13475 9.66101C9.0449 10.6709 9.99997 11.1759 9.99997 12C9.99997 12.8241 9.0449 13.3291 7.13475 14.339L5.83399 15.0267C4.36702 15.8023 3.63353 16.1901 3.28087 15.9082C3.18606 15.8324 3.10784 15.7325 3.05232 15.6163C2.84584 15.1841 3.26182 14.3908 4.09379 12.8043C4.27833 12.4524 4.37059 12.2764 4.3871 12.084C4.39189 12.0281 4.39189 11.9719 4.3871 11.916C4.3706 11.7236 4.27833 11.5476 4.09379 11.1957C3.26182 9.60915 2.84584 8.81587 3.05232 8.38372C3.10784 8.26754 3.18606 8.16764 3.28087 8.09184C3.63353 7.80989 4.36702 8.19769 5.83399 8.97329L7.13475 9.66101Z" stroke="currentColor" stroke-width="1.5" />
    <path d="M21 12L19 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M15 12L13 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>Street Speed</h3>
        <p style={{fontSize:'18px', marginLeft:'45px'}}>{currentViolation.streetMaxSpeed} km/h</p>
        </div>
        <div >
        <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <circle cx="12" cy="18" r="3" stroke="currentColor" stroke-width="1.5" />
    <path d="M12 15V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    <path d="M22 13C22 7.47715 17.5228 3 12 3C6.47715 3 2 7.47715 2 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
</svg>
Motorcycle Speed</h3>
        <p style={{fontSize:'18px', marginLeft:'45px'}}>{currentViolation.driverSpeed} km/h</p>
        </div>
        <div >
        <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <path d="M20.016 2C18.9026 2 18 4.68629 18 8H20.016C20.9876 8 21.4734 8 21.7741 7.66455C22.0749 7.32909 22.0225 6.88733 21.9178 6.00381C21.6414 3.67143 20.8943 2 20.016 2Z" stroke="currentColor" stroke-width="1.5" />
    <path d="M18 8.05426V18.6458C18 20.1575 18 20.9133 17.538 21.2108C16.7831 21.6971 15.6161 20.6774 15.0291 20.3073C14.5441 20.0014 14.3017 19.8485 14.0325 19.8397C13.7417 19.8301 13.4949 19.9768 12.9709 20.3073L11.06 21.5124C10.5445 21.8374 10.2868 22 10 22C9.71321 22 9.45546 21.8374 8.94 21.5124L7.02913 20.3073C6.54415 20.0014 6.30166 19.8485 6.03253 19.8397C5.74172 19.8301 5.49493 19.9768 4.97087 20.3073C4.38395 20.6774 3.21687 21.6971 2.46195 21.2108C2 20.9133 2 20.1575 2 18.6458V8.05426C2 5.20025 2 3.77325 2.87868 2.88663C3.75736 2 5.17157 2 8 2H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M10 8C8.89543 8 8 8.67157 8 9.5C8 10.3284 8.89543 11 10 11C11.1046 11 12 11.6716 12 12.5C12 13.3284 11.1046 14 10 14M10 8C10.8708 8 11.6116 8.4174 11.8862 9M10 8V7M10 14C9.12919 14 8.38836 13.5826 8.1138 13M10 14V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
</svg>Violation Amount</h3>
        <p style={{fontSize:'18px', marginLeft:'45px'}}>{currentViolation.price} SAR</p>
        {(currentViolation.count30 > 0 || currentViolation.count50 > 0) && (
  <p style={{ fontSize: '15px', marginLeft: '45px', color: '#FF0000' }}>
   According to the General Department of Traffic regulations, This speed violation is considered reckless and marks the driver's <strong>{getOrdinal(currentViolation.count30 > 0 ? currentViolation.count30 : currentViolation.count50)}</strong> offense. <br/>  As a result, the penalty amount has been increased.
  </p>
)}
        </div>
        <div >
        <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-5px', marginRight:'10px'}} color="#059855" fill="none">
    <path d="M18.952 8.60639L21.4621 8.45358C19.6628 3.70459 14.497 0.999731 9.46037 2.34456C4.09595 3.77692 0.909592 9.26089 2.34343 14.5933C3.77728 19.9258 9.28835 23.0874 14.6528 21.6551C18.6358 20.5916 21.418 17.2945 22 13.4842" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M12 7.99982V11.9998L14 13.9998" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>Time</h3>
        <p style={{fontSize:'18px', marginLeft:'45px'}}>{new Date(currentViolation.time * 1000).toLocaleTimeString()}</p>
        </div>
        <div >

        <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-3px', marginRight:'10px'}} color="#059855" fill="none">
    <path d="M18 2V4M6 2V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M11.9955 13H12.0045M11.9955 17H12.0045M15.991 13H16M8 13H8.00897M8 17H8.00897" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M3.5 8H20.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M2.5 12.2432C2.5 7.88594 2.5 5.70728 3.75212 4.35364C5.00424 3 7.01949 3 11.05 3H12.95C16.9805 3 18.9958 3 20.2479 4.35364C21.5 5.70728 21.5 7.88594 21.5 12.2432V12.7568C21.5 17.1141 21.5 19.2927 20.2479 20.6464C18.9958 22 16.9805 22 12.95 22H11.05C7.01949 22 5.00424 22 3.75212 20.6464C2.5 19.2927 2.5 17.1141 2.5 12.7568V12.2432Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M3 8H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>Date</h3>
        <p style={{fontSize:'18px', marginLeft:'45px'}}>{formatDate(currentViolation.time)}</p>
        </div>
        <div style={{top:'100px'}}>
        <h3 style={{color:"#059855", fontWeight:'bold',fontSize:'20px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" style={{marginBottom:'-3px', marginRight:'10px'}} color="#059855" fill="none">
    <path d="M14.5 9.5H14.509" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M14.5 6C16.3941 6 18 7.61319 18 9.57031C18 11.5586 16.368 12.9539 14.8605 13.9027C14.7506 13.9665 14.6264 14 14.5 14C14.3736 14 14.2494 13.9665 14.1395 13.9027C12.6348 12.9446 11 11.5655 11 9.57031C11 7.61319 12.6059 6 14.5 6Z" stroke="currentColor" stroke-width="1.5" />
    <path d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" stroke="currentColor" stroke-width="1.5" />
    <path d="M17 21L3 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M10 14L4 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>Violation Location</h3>
        <p style={{fontSize:'18px', marginLeft:'45px'}}>{currentViolation.location}</p>
        </div>
        <div className="map">
          {currentViolation.position && (
            <Map 
              lat={currentViolation.position.latitude} 
              lng={currentViolation.position.longitude} 
              placeName={currentViolation.location} 
            />
          )}
        </div>
        <hr/> 
 <div style={{ marginBottom: '10px' }}>
                    {/* View Complaints Button */}
                    <Button onClick={handleViewComplaints} style={{
              backgroundColor: '#059855',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '20px 10px',
              height: '60px',
              fontFamily: 'Open Sans',
            }}><i className="fas fa-eye" style={{ marginRight: '8px' }}></i>
              View Complaints
            </Button>

       
          <Button onClick={goBack} style={{
            float: 'right', width: 'auto',
            height: '60px', fontSize: '15px', color: '#059855', borderColor: '#059855'
          }}>
            <ArrowLeftOutlined style={{ marginRight: '8px' }} /> Go Back
          </Button>
          </div>
      
</div>

                </>
            )}

      </main>
            {/* Popup for no complaints */}
            <Modal
        title={null}
        visible={isPopupVisible}
        onCancel={() => setIsPopupVisible(false)}
        footer={<p style={{ textAlign: 'center' }}>There is no complaint associated with this violation.</p>}
        style={{ top: '38%' }}
        className="custom-modal" 
        closeIcon={
          <span className="custom-modal-close-icon">
            ×
          </span>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img src={X} alt="No Complaints" style={{ width: '20%', marginBottom: '16px' }} />
        </div>
      </Modal>
    </div>
  );
};

export default ViolationGeneral;
