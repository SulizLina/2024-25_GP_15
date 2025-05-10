import React from 'react';
import homeBackground from '../../images/homebackground7.png';
import Header from './GDTHeader';
import '../../css/EmployerHome.module.css';
import '../../css/CustomModal.css';
import Map from "./GDTMap"; 
import { useNavigate } from "react-router-dom";

const GDTHeatMap = ({ locations }) => {  
    const navigate = useNavigate();
  
  const pageStyles = {
    height: '100vh',
    width: '100%', 
  };


  return (
    <div style={pageStyles}>
      <Header active="gdtheatmap" />
      <div className="breadcrumb" style={{ marginRight: '100px' }}>
        <a onClick={() => navigate('/gdthome')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/gdtheatmap')}>Heat-Map</a>
      </div>
      <Map locations={locations} />
    </div>
  );
};

export default GDTHeatMap;