import { DownOutlined, UserOutlined } from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import SAIRLogo from '../images/SAIRlogo.png';
import { auth, db } from '../firebase';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';

import s from '../css/Header.module.css';

const Header = ({ active }) => {
  const navigate = useNavigate();

  const [currentEmployerCompanyName, setCurrentEmployerCompanyName] =
    useState('');

  const menu = (
    <Menu>
      <Menu.Item key='profile' onClick={() => navigate('/employee-profile')}>
        Profile
      </Menu.Item>
      <Menu.Item
        key='logout'
        onClick={() => {
          auth.signOut();
          navigate('/');
        }}
        style={{ color: 'red' }}
      >
        Logout
      </Menu.Item>
    </Menu>
  );

  useEffect(() => {
    const fetchUserName = async () => {
      const employerUID = sessionStorage.getItem('employerUID');

      if (employerUID) {
        try {
          const userDocRef = doc(db, 'Employer', employerUID);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const employerData = docSnap.data();
            console.log('Employer Data:', employerData);
            setCurrentEmployerCompanyName(employerData.CompanyName);
          } else {
            console.log('No such document!');
          }
        } catch (error) {
          console.error('Error fetching employer data:', error);
        }
      }
    };

    fetchUserName();
  }, []);

  return (
    <header>
      <nav>
        <Link to={'/employer-home'}>
          <img className={s.logo} src={SAIRLogo} alt='SAIR Logo' />
        </Link>

        <div className={s.navLinks} id='navLinks'>
          <ul>
            <li>
              <Link
                className={active === 'home' && s.active}
                to={'/employer-home'}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                className={active === 'violations' && s.active}
                to={'/violations'}
              >
                Violations List
              </Link>
            </li>
            <li>
              <Link
                className={active === 'crashes' && s.active}
                to={'/crashes'}
              >
                Crashes List
              </Link>
            </li>
            <li>
              <Link
                className={active === 'complaints' && s.active}
                to={'/complaints'}
              >
                Complaints List
              </Link>
            </li>
            <li>
              <Link
                className={active === 'driverslist' && s.active}
                to={'/driverslist'}
              >
                Drivers List
              </Link>
            </li>
            <li>
              <Link
                className={active === 'motorcycleslist' && s.active}
                to={'/motorcycleslist'}
              >
                Motorcycles List
              </Link>
            </li>
          </ul>
        </div>

        <div className={s.logoutButton}>
          <Dropdown
            overlay={menu}
            trigger={['click']}
            style={{
              fontSize: '15px',
              zIndex: 999999
            }}
          >
            <Link
              to={(e) => e.preventDefault()}
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'black',
                fontSize: '17px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#059855')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'black')}
            >
              <UserOutlined style={{ marginRight: 10 }} />
              Hello {currentEmployerCompanyName}
              <DownOutlined style={{ marginLeft: 15 }} />
            </Link>
          </Dropdown>
        </div>
      </nav>
    </header>
  );
};

export default Header;
