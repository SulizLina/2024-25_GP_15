import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // For navigation
import '../EmployerHome.css'; 
import SAIRlogo from '../images/SAIRlogo.png'; 
import logoutIcon from '../images/logout.png'; 
import profileIcon from '../images/Profile.PNG'; 
import driversIcon from '../images/drivers.png'; 
import motorcyclesIcon from '../images/motorcyle.png'; 
import violationsIcon from '../images/violation.png';
import complaintsIcon from '../images/complaint.png'; 
import crashesIcon from '../images/crash.png'; 
import { auth, db } from '../firebase'; 
import { doc, getDoc } from 'firebase/firestore'; 

const EmployeeHome = () => {
  const [userName, setUserName] = useState(''); // State for storing user's first name
  const navigate = useNavigate(); // Use navigate for redirection

  useEffect(() => {
    // Fetch the first name from the Employer collection
    const fetchUserName = async () => {
      const employerUID = sessionStorage.getItem('employerUID'); // Get the stored UID

      if (employerUID) {
        try {
          const userDocRef = doc(db, 'Employer', employerUID); // Use the UID to fetch the document
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const employerData = docSnap.data();
            console.log("Employer Data:", employerData); // Log the fetched data
            setUserName(employerData.Fname); // Set the first name from Firestore
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

  // Logout function to navigate back to the login page
  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/'); // Redirect to login page (Login.jsx)
    }).catch((error) => {
      console.error('Error LOGGING out:', error);
    });
  };

  // Handle redirection functions for each page
  const handleNavigation = (path) => {
    navigate(path); // Navigate to the specified path
  };

  return (
    <div className="employer-home">
      {/* Header section */}
      <header className="header">
        <img src={SAIRlogo} alt="SAIR Logo" className="logo" />
        <div className="user-info">
          <img
            src={logoutIcon}
            alt="Logout"
            className="logout-icon"
            onClick={handleLogout} // Call the logout function
            style={{ cursor: 'pointer' }} // Make it look clickable
          />
          <div className="profile-section">
            <img
              src={profileIcon}
              alt="Profile"
              className="profile-icon"
              onClick={() => handleNavigation('/employee-profile')} // Call the profile function
              style={{ cursor: 'pointer' }} // Make it look clickable
            />
            <span>{userName ? userName : ""}</span> {/* Display the first name or 'Loading...' */}
          </div>
        </div>
      </header>

      {/* Horizontal line */}
      <hr />

     
      <main className="body">
        <h2>Welcome {userName ? userName : ""}!</h2>

       
        <div className="navigation-list">
          <div className="nav-item" onClick={() => handleNavigation('/driverslist')}>
            <img src={driversIcon} alt="Drivers List" className="nav-icon" />
            <span>Drivers List</span>
          </div>
          <div className="nav-item" onClick={() => handleNavigation('/motorcycleslist')}>
            <img src={motorcyclesIcon} alt="Motorcycles List" className="nav-icon" />
            <span>Motorcycles List</span>
          </div>
          <div className="nav-item" onClick={() => handleNavigation('/violations')}>
            <img src={violationsIcon} alt="Violations" className="nav-icon" />
            <span>Violations List</span>
          </div>
          <div className="nav-item" onClick={() => handleNavigation('/complaints')}>
            <img src={complaintsIcon} alt="Complaints" className="nav-icon" />
            <span>Complaints List</span>
          </div>
          <div className="nav-item" onClick={() => handleNavigation('/crashes')}>
            <img src={crashesIcon} alt="Crashes" className="nav-icon" />
            <span>Crashes List</span>
          </div>
          <div className="nav-item" onClick={() => handleNavigation('/employee-profile')}>
            <img src={profileIcon} alt="Profile" className="nav-icon" />
            <span>Employee Profile</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeHome;
