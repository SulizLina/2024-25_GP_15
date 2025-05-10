import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { SearchOutlined } from "@ant-design/icons";
import { Table, Modal, Button } from "antd";
import { FaEye } from 'react-icons/fa';
import Header from "./GDTHeader";
import "../../css/CustomModal.css";
import s from "../../css/DriverList.module.css";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import EyeIcon from "../../images/eye.png";
import successImage from "../../images/Sucess.png";
import errorImage from "../../images/Error.png";
import { ArrowLeftOutlined } from "@ant-design/icons";
import formstyle from "../../css/Profile.module.css";
import { Pagination } from "antd";

const DriverList = () => {
  const [driverData, setDriverData] = useState([]);
  const [companyMap, setCompanyMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(true);
  const { company } = useParams();  
  const goBack = () => {
    navigate(-1);
  };
  const [comanyInfo, setCompanyInfo] = useState({
      Name: "",
      ShortName: "",
      CommercialNum: "",
      CompamyEmail: "",
      ComPhoneNumber: "",
    });
  const [isPopupVisibleStaff, setIsPopupVisibleStaff] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  const fetchCompanyMap = async () => {
    const companiesSnapshot = await getDocs(collection(db, "Employer"));
    const map = {};
    companiesSnapshot.forEach((doc) => {
      const data = doc.data();
      map[data.CompanyName] = data.ShortCompanyName || data.CompanyName;
    });
    setCompanyMap(map);
  };

  const fetchCompamny = async (company) => {
    try {
      const compayQuery = query(collection(db, "Employer"), where("CompanyName", "==", company));
      const snapshot = await getDocs(compayQuery);
      if (!snapshot.empty) {
        const companyData = snapshot.docs[0].data();
        return {
          Name: companyData.CompanyName  || "",
          ShortName: companyData.ShortCompanyName || "",
          CommercialNum: companyData.commercialNumber || "",
          CompanyEmail: companyData.CompanyEmail || "",
          PhoneNumber: companyData.PhoneNumber || "",
        };
      }
      return {
        Name: "",
        ShortName: "",
        CommercialNum: "",
        CompanyEmail: "",
        PhoneNumber: "",
      };
    } catch (error) {
      console.error("Error fetching GDT data:", error);
      return {
        Name: "",
        ShortName: "",
        CommercialNum: "",
        CompanyEmail: "",
        PhoneNumber: "",
      };
    }
  };

  useEffect(() => {
    const unsubscribeDrivers = fetchDrivers();
    fetchCompanyMap(); // Load company data
    return () => unsubscribeDrivers();
  }, []);

  const fetchDrivers = () => {
    const driverCollection = query(collection(db, "Driver"));
    const unsubscribe = onSnapshot(driverCollection, (snapshot) => {
      const driverList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDriverData(driverList);
    });
    return unsubscribe;
  };

  useEffect(() => {
    const getComp = async () => {
      if (company) {
        const info = await fetchCompamny(company);
        setCompanyInfo(info);
      }
    };
    getComp();
  }, [company]);

  const filteredData = driverData
  .filter((driver) => {
    // Company filter if a companyName is passed (navigate from dashboard)
    if (company && driver.CompanyName !== company) {
      return false;
    }

    // Search filter
    const fullName = `${driver.Fname || ""} ${driver.Lname || ""}`.toLowerCase();
    const driverID = String(driver.DriverID).toLowerCase(); 
    const query = searchQuery.toLowerCase();
    return driverID.includes(query) || fullName.includes(query);
  });

  const capitalizeFirstLetter = (string) =>
    string
      ? string
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ")
      : "";

  const viewDriverDetails = (driverID) => {
    navigate(`/gdtdriverdetails/${driverID}`);
  };

  const columns = [
    {
      title: "Driver ID",
      dataIndex: "DriverID",
      key: "DriverID",
      align: "center",
    },
    {
      title: "Company Name",
      key: "CompanyName",
      align: "center",
      render: (_, record) => capitalizeFirstLetter(companyMap[record.CompanyName] || ""),
    },
    {
      title: "Driver Name",
      key: "DriverName",
      align: "center",
      render: (_, record) =>
        capitalizeFirstLetter(`${record.Fname || ""} ${record.Lname || ""}`),
    },
    {
      title: "Phone Number",
      dataIndex: "PhoneNumber",
      key: "PhoneNumber",
      align: "center",
    },
    {
      title: "Email",
      dataIndex: "Email",
      key: "Email",
      align: "center",
      render: (text) => (
        <a
          href={`mailto:${text}`}
          style={{ color: "black", textDecoration: "underline" }}
        >
          {text}
        </a>
      ),
    },
    {
      title: "Details",
      key: "Details",
      align: "center",
      render: (_, record) => (
<FaEye
    style={{ cursor: "pointer", fontSize: "1.5em", color: '#059855' }} 
    onClick={() => viewDriverDetails(record.DriverID)} 
    aria-label="View Details" // Accessibility improvement
  />
      ),
    },
  ];

  
  const handleShowPopupStaff = () => {
    setIsPopupVisibleStaff(true);
  };

  const handleClosePopupStaff = () => {
    setIsPopupVisibleStaff(false);
  };

  const paginatedData = filteredData.slice((currentPage - 1) * 5, currentPage * 5);

  return (
    <div>
      <Header active="gdtdriverlist" />

      <div className="breadcrumb" style={{ marginRight: '100px' }}>
      {company ? (
          <a onClick={() => navigate("/GDTDashBoard")}>Dashboard</a>
        ) : (
          <a onClick={() => navigate("/gdthome")}>Home</a>
        )}
        <span> / </span>
        <a onClick={() => navigate('/gdtdriverlist')}>Driver List</a>
      </div>

      <main>
        <div className={s.container}>
          <h2 className={s.title}> Driver List </h2>

          <div className={s.searchInputs}>
            <div className={s.searchContainer}>
              <SearchOutlined style={{ color: '#059855' }} />
              <input
                type="text"
                placeholder="Search by Driver ID or Driver Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "300px" }}
              />
            </div>
          </div>
        </div>
        <br />
        
        {company && (
          <h3 className={s.subtitleDashboard}>
            <>
                <span
                  className={s.gdtName}
                  style={{ textDecoration: "underline", cursor: "pointer" }}
                  onClick={handleShowPopupStaff}
                >
                  {comanyInfo.ShortName}
                </span>
                {" "}Drivers
              </>
            </h3>
          )}

<Table
  columns={columns}
  dataSource={paginatedData}
  rowKey="id"
  pagination={false}
  style={{
    width: '1200px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    margin: '0 auto',
  }}
/>


            {/* Notification Modal */}
            <Modal
              visible={isNotificationVisible}
              onCancel={() => setIsNotificationVisible(false)}
              footer={<p style={{ textAlign: 'center' }}>{notificationMessage}</p>}
              style={{ top: '38%' }}
              className="custom-modal"
              closeIcon={
                <span className="custom-modal-close-icon">
                  ×
                </span>
              }
            >
              <div style={{ textAlign: 'center' }}>
                <img
                  src={isSuccess ? successImage : errorImage}
                  alt={isSuccess ? 'Success' : 'Error'}
                  style={{ width: '20%', marginBottom: '16px' }}
                />
              </div>
            </Modal>

              {/*//////////////// POP-UP  ////////////////*/}
              <Modal
                visible={isPopupVisibleStaff}
                onCancel={handleClosePopupStaff}
                footer={null}
                width={700}
                closeIcon={<span className="custom-modal-close-icon">×</span>}
              >
                <main className={formstyle.GDTcontainer}>
                  <div>
                    <h4 className={formstyle.GDTLabel}>Delivery Comany Information</h4>

                    <div id="Company name">
                      <h3
                        style={{
                          color: "#059855",
                          fontWeight: "bold",
                          fontSize: "20px",
                        }}
                      >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        color="#059855"
                        fill="none"
                        width="35"
                        height="35"
                        style={{ marginBottom: "-5px", marginRight: "10px" }}
                      >
                        <path
                          d="M16 10L18.1494 10.6448C19.5226 11.0568 20.2092 11.2628 20.6046 11.7942C21 12.3256 21 13.0425 21 14.4761V22"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 9L11 9M8 13L11 13"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 22V19C12 18.0572 12 17.5858 11.7071 17.2929C11.4142 17 10.9428 17 10 17H9C8.05719 17 7.58579 17 7.29289 17.2929C7 17.5858 7 18.0572 7 19V22"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 22L22 22"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M3 22V6.71724C3 4.20649 3 2.95111 3.79118 2.32824C4.58237 1.70537 5.74742 2.04355 8.07752 2.7199L13.0775 4.17122C14.4836 4.57937 15.1867 4.78344 15.5933 5.33965C16 5.89587 16 6.65344 16 8.16857V22"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                        Company Full Name
                      </h3>
                      <p
                        style={{
                          fontSize: "18px",
                          marginLeft: "45px",
                          marginBottom: "20px",
                        }}
                      >
                        {comanyInfo.Name}
                      </p>

                      <h3
                        style={{
                          color: "#059855",
                          fontWeight: "bold",
                          fontSize: "20px",
                        }}
                      >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        color="#059855"
                        fill="none"
                        width="35"
                        height="35"
                        style={{ marginBottom: "-5px", marginRight: "10px" }}
                      >
                        <path
                          d="M16 10L18.1494 10.6448C19.5226 11.0568 20.2092 11.2628 20.6046 11.7942C21 12.3256 21 13.0425 21 14.4761V22"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 9L11 9M8 13L11 13"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 22V19C12 18.0572 12 17.5858 11.7071 17.2929C11.4142 17 10.9428 17 10 17H9C8.05719 17 7.58579 17 7.29289 17.2929C7 17.5858 7 18.0572 7 19V22"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 22L22 22"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M3 22V6.71724C3 4.20649 3 2.95111 3.79118 2.32824C4.58237 1.70537 5.74742 2.04355 8.07752 2.7199L13.0775 4.17122C14.4836 4.57937 15.1867 4.78344 15.5933 5.33965C16 5.89587 16 6.65344 16 8.16857V22"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                        Company Short Name
                      </h3>
                      <p
                        style={{
                          fontSize: "18px",
                          marginLeft: "45px",
                          marginBottom: "20px",
                        }}
                      >
                        {comanyInfo.ShortName}
                      </p>

                      <h3
                        style={{
                          color: "#059855",
                          fontWeight: "bold",
                          fontSize: "20px",
                        }}
                      >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        color="#059855"
                        fill="none"
                        width="35"
                        height="35"
                        style={{ marginBottom: "-5px", marginRight: "10px" }}
                      >
                        <path
                          d="M16 10L18.1494 10.6448C19.5226 11.0568 20.2092 11.2628 20.6046 11.7942C21 12.3256 21 13.0425 21 14.4761V22"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 9L11 9M8 13L11 13"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 22V19C12 18.0572 12 17.5858 11.7071 17.2929C11.4142 17 10.9428 17 10 17H9C8.05719 17 7.58579 17 7.29289 17.2929C7 17.5858 7 18.0572 7 19V22"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 22L22 22"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M3 22V6.71724C3 4.20649 3 2.95111 3.79118 2.32824C4.58237 1.70537 5.74742 2.04355 8.07752 2.7199L13.0775 4.17122C14.4836 4.57937 15.1867 4.78344 15.5933 5.33965C16 5.89587 16 6.65344 16 8.16857V22"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                        Company Commercial Number
                      </h3>
                      <p
                        style={{
                          fontSize: "18px",
                          marginLeft: "45px",
                          marginBottom: "20px",
                        }}
                      >
                        {comanyInfo.CommercialNum}
                      </p>

                      <h3
                        style={{
                          color: "#059855",
                          fontWeight: "bold",
                          fontSize: "20px",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="35"
                          height="35"
                          style={{ marginBottom: "-5px", marginRight: "10px" }}
                          color="#059855"
                          fill="none"
                        >
                          <path
                            d="M2 5L8.91302 8.92462C11.4387 10.3585 12.5613 10.3585 15.087 8.92462L22 5"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M10.5 19.5C10.0337 19.4939 9.56682 19.485 9.09883 19.4732C5.95033 19.3941 4.37608 19.3545 3.24496 18.2184C2.11383 17.0823 2.08114 15.5487 2.01577 12.4814C1.99475 11.4951 1.99474 10.5147 2.01576 9.52843C2.08114 6.46113 2.11382 4.92748 3.24495 3.79139C4.37608 2.6553 5.95033 2.61573 9.09882 2.53658C11.0393 2.4878 12.9607 2.48781 14.9012 2.53659C18.0497 2.61574 19.6239 2.65532 20.755 3.79141C21.8862 4.92749 21.9189 6.46114 21.9842 9.52844C21.9939 9.98251 21.9991 10.1965 21.9999 10.5"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M19 17C19 17.8284 18.3284 18.5 17.5 18.5C16.6716 18.5 16 17.8284 16 17C16 16.1716 16.6716 15.5 17.5 15.5C18.3284 15.5 19 16.1716 19 17ZM19 17V17.5C19 18.3284 19.6716 19 20.5 19C21.3284 19 22 18.3284 22 17.5V17C22 14.5147 19.9853 12.5 17.5 12.5C15.0147 12.5 13 14.5147 13 17C13 19.4853 15.0147 21.5 17.5 21.5"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                        Company Email
                      </h3>
                      <p style={{ fontSize: "18px", marginLeft: "45px" }}>
                        <a
                          href={`mailto:${comanyInfo?.CompamyEmail}`}
                          style={{ color: "#444", textDecoration: "underline" }}
                        >
                          {comanyInfo.CompanyEmail}
                        </a>
                      </p>
                    </div>
                  </div>
                </main>
              </Modal>
              {/*///////////////////////////////END POP-UP/////////////////////////////////////////// */}

              <div
              style={{
                display: "flex",
                justifyContent: company ? 'space-between' : 'flex-end',
                alignItems: "center",
                marginTop: "16px",
              }}
            >
      {company && (
        <Button
          onClick={goBack}
          style={{
            width: "auto",
            height: "60px",
            fontSize: "15px",
            color: "#059855",
            borderColor: "#059855",
          }}
        >
          <ArrowLeftOutlined style={{ marginRight: "8px" }} />
          Go Back
        </Button>
      )}
        <Pagination
        current={currentPage}
        pageSize={5}
        total={filteredData.length}
        onChange={(page) => setCurrentPage(page)}
        showSizeChanger={false}
        showLessItems
      />
    </div>
      </main>
    </div>
  );
};

export default DriverList;
