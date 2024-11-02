import React from 'react';
import homeBackground from '../images/homebackground7.png';
import Vision from '../images/Vision.png';
import Mision from '../images/Mision.png'; // Note: Ensure this image is used somewhere 
import Header from './Header';
// import '../App.css'; 
import s from "../css/EmployerHome.module.css";

const EmployeeHome = () => {
  const styles = {
    backgroundImage: `url(${homeBackground})`,
    backgroundSize: 'cover', // Change to 'cover' for better scaling
    backgroundPosition: 'center', // Centers the image
    height: '100vh', // Sets the height to full viewport height
    width: '100%', // Ensures it takes the full width
  };

  return (
    <div style={styles}> 
      <Header active="home" /> 
      <main>
        <div className={s.homeContainer}>
          <div className={s.textBox}>
            <br />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={Vision}
                alt="Vision"
                style={{ width: '75px', height: 'auto', marginRight: '5px', marginTop: '-35px' }}
              />
              <h1 style={{ color: '#059855', fontWeight: "bold" }}>SAIR Vision</h1>
            </div>
            <p style={{ fontSize: '20px', color: "black" }}>
              The SAIR initiative enhances road safety for delivery motorcycle drivers by providing the
              General Department of Traffic (GDT) and stakeholders with monitoring tools. It aims to reduce
              violations and accidents, fostering a safer environment and promoting accountability in the
              delivery ecosystem.
            </p>
          </div>

          <div className={s.textBox}>
            <br />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={Mision} // Changed to Mision for consistency
                alt="Mission"
                style={{ width: '70px', height: 'auto', marginRight: '10px', marginTop: '-35px' }}
              />
              <h1 style={{ color: '#059855', fontWeight: 'bold' }}>SAIR Mission</h1>
            </div>
            <p style={{ fontSize: '20px', color: "black" }}>
              The mission of the SAIR initiative is to enhance road safety and reduce traffic violations by
              providing advanced monitoring technologies. We aim to equip the General Department of Traffic
              (GDT), employers, and delivery motorcycle drivers with essential tools to ensure compliance and
              create a safer, more efficient delivery ecosystem for all road users.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeHome;