import React from 'react';
import homeBackground from '../../images/homebackground7.png';
import Vision from '../../images/Vision.png';
import Mision from '../../images/Mision.png'; 
import Header from './GDTHeader';
import s from "../../css/EmployerHome.module.css";
import '../../css/CustomModal.css';

const GDTHome = () => {
  const pageStyles = {
    backgroundImage: `url(${homeBackground})`,
    backgroundSize: '1000px', 
    backgroundPosition: 'right', 
    height: '100vh',
    width: '100%', 
    backgroundRepeat: 'no-repeat',
  };

  const h1WrapperStyles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 'calc(100vh - 50px)', 
  };

  return (
    <div style={pageStyles}>
      <Header active="gdthome" />
      <div style={h1WrapperStyles}>
      

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
             The SAIR initiative aspires to empower the General Department of Traffic (GDT) with 
             monitoring tools to ensure safer roads for delivery motorcycle drivers. By minimizing violations and accidents,
             it contributes to creating a secure and accountable delivery ecosystem that aligns with national road safety goals.
            </p>
          </div>

          <div className={s.textBox}>
            <br />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={Mision} // Changed to Mision for consistency
                alt="Mission"
                style={{ width: '70px', height: 'auto', marginRight: '10px', marginTop: '-10px' }}
              />
              <h1 style={{ color: '#059855', fontWeight: 'bold' }}>SAIR Mission</h1>
            </div>
            <p style={{ fontSize: '20px', color: "black" }}>
             The mission of the SAIR initiative is to support the General Department of Traffic (GDT) in enhancing
             road safety and enforcing traffic compliance. By leveraging advanced monitoring technologies, SAIR equips
             GDT with the tools needed to monitor, regulate, and foster accountability among delivery motorcycle drivers,
             ensuring a safer and more efficient road environment for all.
            </p>
          </div>
        </div>
      </main>


      </div>
    </div>
  );
};

export default GDTHome;