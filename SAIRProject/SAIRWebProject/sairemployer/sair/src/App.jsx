import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Maincomponent/UserAuth/Login';
import Signup from './Maincomponent/UserAuth/Signup';
import ForgotPassword from './Maincomponent/UserAuth/ForgotPassword';
import EmployeeHome from './Maincomponent/EmployeeHome';
import DriversList from './Maincomponent/driverslist';
import MotorcyclesList from './Maincomponent/motorcycleslist';
import Violations from './Maincomponent/Violations';
import Complaints from './Maincomponent/Complaints';
import Crashes from './Maincomponent/Crashes';
import EmployeeProfile from './Maincomponent/Employeeprofilepage';
import ViolationDetail from './Maincomponent/ViolationDetail';
import AddDriver from './Maincomponent/AddDriver';
import EditDriver from './Maincomponent/EditDriver';
import ViolationGeneral from './Maincomponent/Violationgeneral';
import AddMotorcycle from './Maincomponent/AddMotorcycle';
import EditMotorcycle from './Maincomponent/EditMotorcycle';
import DriverDetails from './Maincomponent/DriverDetails';
import React, { useEffect } from 'react';
import { monitorUnits } from './Maincomponent/monitorUnits';
import VDriver from './Maincomponent/VDriver';
import CrashGeneral from './Maincomponent/CrashGeneral';
import ComplaintGeneral from './Maincomponent/ComplaintGeneral'
import MotorcycleDetails from './Maincomponent/Motorcycledetails'
import { LoadScript } from '@react-google-maps/api';
import VMotorcycle from './Maincomponent/VMotorcycle'
import { ShortCompanyNameProvider } from './ShortCompanyNameContext';
import "./css/common.css"
import ScrollToTop from './ScrollToTop'; 
import { CrashNotification } from './CrashNotification';

function App() {
  useEffect(() => {
    const sess = window.wialon.core.Session.getInstance();

    const initSession = () => {
     if (!window.wialon) {
       return;
     }
     sess.initSession('https://hst-api.wialon.com');
     const token = '8ca297495a6d20aed50815e6f79cdd3b2D6292586C51CF2BE801FC0E4C312A5474C9BB71'; 
     sess.loginToken(token, '', (code) => {
     if (code) {
       return;
     }
       // Start monitoring units continuously
     monitorUnits(sess, 10000); // 10 seconds fetch interval
     //checkCrash(sess, 10000);// 10 second fetch interval

  });
};
   // Initialize session
    initSession();
 }, []); 




  return (
<ShortCompanyNameProvider>

    <LoadScript
    googleMapsApiKey="AIzaSyBFbAxhllak_ia6wXY5Nidci_cLmUQkVhc"
    onError={(e) => console.error('Error loading maps', e)}
  >
    <Router>
    <ScrollToTop /> 
    <CrashNotification />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route path="/employer-home" element={<EmployeeHome />} />
        <Route path="/driverslist" element={<DriversList />} />
        <Route path="/motorcycleslist" element={<MotorcyclesList />} />
        <Route path="/violations" element={<Violations />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/crashes" element={<Crashes />} />
        <Route path="/employee-profile" element={<EmployeeProfile />} />
        <Route path="/edit-driver/:driverId" element={<EditDriver />} />
        <Route path="/add-driver" element={<AddDriver />} />
        <Route path="/violation/general/:violationId" element={<ViolationGeneral />} />
        <Route path="/violation/detail/:violationId" element={<ViolationDetail />} />
        <Route path="/edit-motorcycle/:motorcycleId" element={<EditMotorcycle />} />
        <Route path="/add-motorcycle" element={<AddMotorcycle />} />
        <Route path="/driver-details/:driverId" element={<DriverDetails />} />
        <Route path="/drivers/:driverId/violations" element={<VDriver />} />
        <Route path="/crash/general/:crashId" element={<CrashGeneral />} />
        <Route path="/complaint/general/:complaintId" element={<ComplaintGeneral />} />
        <Route path="/motorcycle-details/:motorcycleId" element={<MotorcycleDetails />} />
        <Route path="/motorcycle/:motorcycleId/violations" element={<VMotorcycle />} />
      </Routes>
    </Router>
    </LoadScript>
    
    </ShortCompanyNameProvider>
  );
}

export default App;