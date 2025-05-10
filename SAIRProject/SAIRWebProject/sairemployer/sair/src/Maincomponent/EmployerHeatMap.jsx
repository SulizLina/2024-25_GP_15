import React from 'react';
import Header from './Header';
import '../css/EmployerHome.module.css';
import '../css/CustomModal.css';
import HeatMap from "./HeatMap"; 
import { useNavigate } from "react-router-dom";

const EmployerHeatMap = ({ locations })=> {
    const navigate = useNavigate();
  
  const pageStyles = {
    height: '100vh',
    width: '100%', 
  };


  return (
    <div style={pageStyles}>
      <Header active="EmployerHeatMap" />
      <div className="breadcrumb" style={{ marginRight: '100px' }}>
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/EmployerHeatMap')}>Heat Map</a>
      </div>
      <HeatMap locations={locations} />
    </div>
  );
};

export default EmployerHeatMap;