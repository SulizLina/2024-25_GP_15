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
import Adddriverbatch from './Maincomponent/Adddriverbatch';
import EditDriver from './Maincomponent/EditDriver';
import ViolationGeneral from './Maincomponent/Violationgeneral';
import AddMotorcycle from './Maincomponent/AddMotorcycle';
import EditMotorcycle from './Maincomponent/EditMotorcycle';
import DriverDetails from './Maincomponent/DriverDetails';
import React, { useEffect, useState } from 'react';
import { monitorUnits } from './Maincomponent/monitorUnits';
import VDriver from './Maincomponent/VDriver';
import CrashGeneral from './Maincomponent/CrashGeneral';
import ComplaintGeneral from './Maincomponent/ComplaintGeneral'
import MotorcycleDetails from './Maincomponent/Motorcycledetails'
import { LoadScript } from '@react-google-maps/api';
import VMotorcycle from './Maincomponent/VMotorcycle'
import { ShortCompanyNameProvider } from './ShortCompanyNameContext';
import { FirstNameProvider } from './FirstNameContext';
import "./css/common.css"
import ScrollToTop from './ScrollToTop'; 
import { CrashNotification } from './CrashNotification';
import { GDTNotification } from './GDTNotification';
import GDTHome from './Maincomponent/GDT/GDTHome';
import GDTViolations from './Maincomponent/GDT/GDTViolations';
import GDTRecklessViolations from './Maincomponent/GDT/GDTRecklessViolations';
import GDTViolationGeneral from './Maincomponent/GDT/GDTViolationgeneral';
import GDTViolationDetail from './Maincomponent/GDT/GDTViolationDetail';
import GDTCrashes from './Maincomponent/GDT/GDTCrashes';
import GDTCrashGeneral from './Maincomponent/GDT/GDTCrashGeneral';
import GDTComplaints from './Maincomponent/GDT/GDTComplaints';
import GDTComplaintGeneral from './Maincomponent/GDT/GDTComplaintGeneral';
import GDTHeatmap from './Maincomponent/GDT/GDTHeatmap';
import GDTDashBoard from './Maincomponent/GDT/GDTDashBoard';
import GDTStafflist from './Maincomponent/GDT/GDTStafflist';
import CrashResponse from './Maincomponent/GDT/ChartDetails/CrashResponse';
import GDTDriverlist from './Maincomponent/GDT/GDTDriverlist';
import GDTProfilepage from './Maincomponent/GDT/GDTProfilepage';
import GDTAddStaff from './Maincomponent/GDT/GDTAddStaff';
import GDTEditStaff from './Maincomponent/GDT/GDTEditStaff';
import GDTRicklessDrivers from './Maincomponent/GDT/GDTRicklessDrivers';
import GDTDriverDetails from './Maincomponent/GDT/GDTDriverDetails';
import GDTViolationDriver from"./Maincomponent/GDT/GDTViolationDriver";
import GDTAddStaffBatch from"./Maincomponent/GDT/GDTAddStaffBatch";
import RicklessDrivers from './Maincomponent/ricklessdrives';
import NotificationsList from './Maincomponent/NotificationsList';
import GDTNotificationsList from './Maincomponent/GDT/GDTNotificationsList';
import HeatMap from './Maincomponent/HeatMap';
import EmployerHeatMap from './Maincomponent/EmployerHeatMap';


const libraries = ["visualization"];  

function App() {
  const [locations, setLocations] = useState([]);
  const fetchInterval = 10000; // Fetch every 10 seconds

  useEffect(() => {
    console.log("📡 Fetching data from Wialon API...");

    const sess = window.wialon.core.Session.getInstance();

    const initSession = () => {
      if (!window.wialon) {
        console.error("Wialon API is not loaded");
        return;}

      sess.initSession('https://hst-api.wialon.com');
     const token = '8ca297495a6d20aed50815e6f79cdd3b2D6292586C51CF2BE801FC0E4C312A5474C9BB71'; 

      sess.loginToken(token, '', (code) => {
        if (code) {
          console.error("Wialon Login Failed! Code:", code);
          return;
        }

        console.log("Wialon Login Successful");

        // Start monitoring units continuously
        monitorUnits(sess);
      });
    };

    // Function to fetch unit positions
    const monitorUnits = async (sess) => {
      const flags = window.wialon.item.Item.dataFlag.base | window.wialon.item.Unit.dataFlag.lastMessage;

      setInterval(async () => {
        try {
          const code = await new Promise((resolve) => {
            sess.updateDataFlags([{ type: 'type', data: 'avl_unit', flags: flags, mode: 0 }], resolve);
          });

          if (code) {
            console.error("Wialon API Error: ", code);
            return;
          }          const loadedUnits = sess.getItems('avl_unit');

          if (loadedUnits) {
            console.log("Fetched Units from Wialon:", loadedUnits);

            const positions = loadedUnits.map(unit => {
              const pos = unit.getPosition();
              const gpsNumber= unit.getName();
              console.log(':::::::::::::::',gpsNumber);
              return pos ? { lat: pos.y, lng: pos.x , gpsNumber } : null;
            }).filter(p => p !== null);
            
            console.log("Processed Positions:", positions);

            setLocations(positions);
          }
        } catch (error) {
          console.error('Error fetching units:', error);
        }
      }, fetchInterval);
    };

    initSession();
  }, []);

  
  return (
<ShortCompanyNameProvider>
<FirstNameProvider>
    <LoadScript
    googleMapsApiKey="AIzaSyDVN_DvWUzNN4f4UGgk90MIjVdJa8sXvU0" libraries={libraries}
  >

    <Router>
    <ScrollToTop /> 
    <CrashNotification />
    <GDTNotification/>

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
        <Route path="/drivers/:driverId/violations/:type?" element={<VDriver />} />
        <Route path="/crash/general/:crashId" element={<CrashGeneral />} />
        <Route path="/complaint/general/:complaintId" element={<ComplaintGeneral />} />
        <Route path="/motorcycle-details/:motorcycleId" element={<MotorcycleDetails />} />
        <Route path="/motorcycle/:motorcycleId/violations" element={<VMotorcycle />} />
        <Route path="/gdthome" element={<GDTHome />} />
        <Route path="/gdtviolations/:company?/:date?" element={<GDTViolations />} />
        <Route path="/gdtrecklessviolations/:type/:company" element={<GDTRecklessViolations />} />
        <Route path="/gdtviolation/general/:violationId" element={<GDTViolationGeneral />} />
        <Route path="/gdtviolation/detail/:violationId" element={<GDTViolationDetail />} />
        <Route path="/gdtcrashes/:GDTID?" element={<GDTCrashes />} />
        <Route path="/gdtcrash/general/:crashId" element={<GDTCrashGeneral />} />
        <Route path="/gdtcomplaints/:GDTID?" element={<GDTComplaints />} /> 
        <Route path="/gdtcomplaints/general/:complaintId" element={<GDTComplaintGeneral />} />
        <Route path="/gdtheatmap" element={<GDTHeatmap locations={locations} />}  /> 
        <Route path="/GDTDashBoard" element={<GDTDashBoard />} /> 
        <Route path="/gdtstafflist" element={<GDTStafflist />} /> 
        <Route path="/gdtdriverlist/:company?" element={<GDTDriverlist />} /> 
        <Route path="/gdtprofile" element={<GDTProfilepage />} /> 
        <Route path="/gdtaddstaff" element={<GDTAddStaff />} />
        <Route path="/ChartDetails/CrashResponse/:GDTID" element={<CrashResponse />} />
        <Route path="/gdteditstaff/:staffId" element={<GDTEditStaff />} />
        <Route path="/gdtricklessdrives/" element={<GDTRicklessDrivers />} />
        <Route path="/gdtdriverdetails/:driverId" element={<GDTDriverDetails />} />
        <Route path="/gdtviolationdriver/:driverId" element={<GDTViolationDriver />} />
        <Route path="/gdtaddstaffbatch" element={<GDTAddStaffBatch />} />
        <Route path="/ricklessdrives" element={<RicklessDrivers />} />
        <Route path="/notificationslist" element={<NotificationsList />} />
        <Route path="/gdtnotificationslist" element={<GDTNotificationsList />} />
        <Route path="/Adddriverbatch" element={<Adddriverbatch />} />
        <Route path="/EmployerHeatMap" element={<EmployerHeatMap locations={locations} />}/>
        <Route path="/HeatMap" element={<HeatMap />} />

        
      </Routes>
    </Router>
    </LoadScript>
    </FirstNameProvider>
    </ShortCompanyNameProvider>
  );
}

export default App;