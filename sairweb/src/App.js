import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './Maincomponent/UserAuth/Login';
import Signup from './Maincomponent/UserAuth/Signup';
import EmployeeHome from './Maincomponent/Employeehomepage'; // Import EmployeeHome component
import DriversList from './Maincomponent/driverslist'; // Ensure this file name matches exactly
import MotorcyclesList from './Maincomponent/motorcycleslist'; // Ensure this file name matches exactly
import Violations from './Maincomponent/Violations'; // Ensure this file name matches exactly
import Complaints from './Maincomponent/Complaints'; // Ensure this file name matches exactly
import Crashes from './Maincomponent/Crashes'; // Ensure this file name matches exactly
import EmployeeProfile from './Maincomponent/Employeeprofilepage'; // Ensure this file name matches exactly

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/employer-home" element={<EmployeeHome />} /> 
        <Route path="/driverslist" element={<DriversList />} />
        <Route path="/motorcycleslist" element={<MotorcyclesList />} />
        <Route path="/violations" element={<Violations />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/crashes" element={<Crashes />} />
        <Route path="/employee-profile" element={<EmployeeProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
