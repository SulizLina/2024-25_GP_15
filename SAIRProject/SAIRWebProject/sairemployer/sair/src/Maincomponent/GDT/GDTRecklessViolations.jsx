import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { FaEye } from 'react-icons/fa';
import EyeIcon from "../../images/eye.png";
import { Table } from "antd";
import Header from "./GDTHeader";
import s from "../../css/Violations.module.css";
import "../../css/CustomModal.css";
import { Button, Modal } from "antd";
import X from "../../images/redx.webp";
import { Pagination } from "antd";
import { FaFilter } from "react-icons/fa";
import formstyle from "../../css/Profile.module.css";
import { ArrowLeftOutlined } from "@ant-design/icons";

const RecklessViolationList = () => {
  const { type, company } = useParams();
  const goBack = () => {navigate(-1)};
  const [motorcycles, setMotorcycles] = useState({});
  const [violations, setViolations] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const navigate = useNavigate();
  const [violationTypeFilter, setViolationTypeFilter] = useState("");
  const gdtUID = sessionStorage.getItem("gdtUID");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [filters, setFilters] = useState({
      type: [],
      status: [],
    });
    const [currentPage, setCurrentPage] = useState(1);
const pageSize = 5; // Set your desired page size

const [dropdownOpen, setDropdownOpen] = useState(false);
const [selectedValues, setSelectedValues] = useState([]);
const options = [
  { value: "Reckless Violations", label: "Reckless Violations" },
  { value: "Regular Violations", label: "Regular Violations" },
  { value: "Active", label: "Active" },
  { value: "Revoked", label: "Revoked" },
];
  const [clickedViolations, setClickedViolations] = useState(() => {
    // Load clicked violations from local storage using a user-specific key
    const savedClickedViolations = localStorage.getItem(`clickedViolations_${gdtUID}`);
    return savedClickedViolations ? JSON.parse(savedClickedViolations) : [];
  });
  const [isPopupVisibleCompany, setIsPopupVisibleCompany] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    Name: "",
    ShortName: "",
    CommercialNum: "",
    CompamyEmail: "",
    ComPhoneNumber: "",
  });

  useEffect(() => {
    const fetchEmployerDrivers = async () => {
      if (gdtUID) {
        const employerDoc = await getDoc(doc(db, "GDT", gdtUID));
        fetchDrivers();
      }
    };

    fetchEmployerDrivers();
  }, [gdtUID]);

  const handleClickDetails = (id) => {
    if (!clickedViolations.includes(id)) {
      const updatedClickedViolations = [...clickedViolations, id];
      setClickedViolations(updatedClickedViolations);
      // Save to local storage with a user-specific key
      localStorage.setItem(`clickedViolations_${gdtUID}`, JSON.stringify(updatedClickedViolations));
    }
  };
  const fetchDrivers = () => {
    const driverCollection = query(collection(db, "Driver"));

    const unsubscribe = onSnapshot(driverCollection, (snapshot) => {
      const driverMap = {};
      const driverIDs = [];
      const companyPromises = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        driverMap[data.DriverID] = {
          name: `${data.Fname} ${data.Lname}`,
          companyName: data.CompanyName,
          shortCompanyName: "", // Placeholder for ShortCompanyName
        };
        driverIDs.push(data.DriverID);

        // Add a promise to fetch the company details
        companyPromises.push(
          fetchCompany(data.CompanyName).then((shortName) => {
            driverMap[data.DriverID].shortCompanyName = shortName;
          })
        );
      });

      // Wait for all company data to be fetched before updating state
      Promise.all(companyPromises).then(() => {
        setDrivers(driverMap);
      });

      // Fetch violations if there are valid driver IDs
      if (driverIDs.length > 0) {
        fetchViolations(driverIDs);
      } else {
        setViolations([]);
      }
    });

    return () => unsubscribe();
  };

  const fetchCompany = async (company, detailed = false) => {
    try {
      const companyQuery = query(
        collection(db, "Employer"),
        where("CompanyName", "==", company)
      );
  
      const snapshot = await getDocs(companyQuery);
  
      if (!snapshot.empty) {
        const companyData = snapshot.docs[0].data();
  
        if (detailed) {
          return {
            Name: companyData.CompanyName || "",
            ShortName: companyData.ShortCompanyName || "",
            CommercialNum: companyData.commercialNumber || "",
            CompanyEmail: companyData.CompanyEmail || "",
            PhoneNumber: companyData.PhoneNumber || "",
          };
        } else {
          return companyData.ShortCompanyName || company;
        }
      }
  
      // Fallback for when no match is found
      return detailed
        ? {
            Name: "",
            ShortName: "",
            CommercialNum: "",
            CompanyEmail: "",
            PhoneNumber: "",
          }
        : company;
    } catch (error) {
      console.error("Error fetching company data:", error);
      return detailed
        ? {
            Name: "",
            ShortName: "",
            CommercialNum: "",
            CompanyEmail: "",
            PhoneNumber: "",
          }
        : company;
    }
  };

  
  useEffect(() => {
    const getComp = async () => {
      if (company) {
        const info = await fetchCompany(company, true);
        setCompanyInfo(info);
      }
    };
    getComp();
  }, [company]);

  
  const handleShowPopupCompany = () => {
    setIsPopupVisibleCompany(true);
  };

  const handleClosePopupCompany = () => {
    setIsPopupVisibleCompany(false);
  };

  const fetchMotorcycles = (violationIDs) => {
    const motorcycleCollection = query(
      collection(db, "History"),
      where("ID", "in", violationIDs) // Matching by violationID
    );
    const unsubscribe = onSnapshot(motorcycleCollection, (snapshot) => {
      const motorcycleMap = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Fetched Motorcycle Data:", data);
        motorcycleMap[data.ID] = data.LicensePlate; // Map ID to License Plate
      });
      console.log("Motorcycle Map:", motorcycleMap); // Log the entire motorcycle map
      setMotorcycles(motorcycleMap);
    });

    return () => unsubscribe();
  };
  // Function to format the date
  const formatDate = (time) => {
    const date = new Date(time * 1000); // Assuming timestamp is in seconds
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
    const day = date.getDate().toString().padStart(2, "0"); // Days are 1-based
    return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
  };
  const handleViewViolations = () => {
    if (violations.length > 0) {
      navigate(`/gdtricklessdrives`); // Navigate to the first violation
    } else {
      setIsPopupVisible(true); // Show popup if no violation exist
    }
  };
  const fetchViolations = (driverIDs) => {
    const violationCollection = query(
      collection(db, "Violation"),
      where("driverID", "in", driverIDs)
    );

    // Fetching reckless violations data
    const count30Query = query(collection(db, "Violation"), where("count30", ">=", 1));
    const count50Query = query(collection(db, "Violation"), where("count50", ">=", 1));

    const unsubscribe = onSnapshot(violationCollection, (snapshot) => {
      const violationList = snapshot.docs.map((doc) => {
        const data = doc.data();
        const isReckless = data.count30 > 0 || data.count50 > 0;
        return {
          id: doc.id,
          ...data,
          isReckless, // Add reckless classification
        };
      });
      // Ensure violations not clicked yet are highlighted
      const newViolationIDs = violationList.map((v) => v.id);
      setClickedViolations((prev) =>
        prev.filter((id) => newViolationIDs.includes(id))
      );
      setViolations(violationList);
      if (violationList.length > 0) {
        const violationIDs = violationList.map((v) => v.violationID); // Collecting violation IDs
        fetchMotorcycles(violationIDs); // Fetch motorcycles using violation IDs
      } else {
        setMotorcycles({});
      }
    });

    return () => unsubscribe();
  };

  // Filtering violations
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleSelect = (value) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];

    setSelectedValues(newSelection);
    const newType = newSelection.filter(val => val === "Reckless Violations" || val === "Regular Violations");
    const newStatus = newSelection.filter(val => val === "Active" || val === "Revoked");
    setFilters({ type: newType, status: newStatus });
  };

  const filteredViolations = violations
  .filter((violation) => {
    const driverName = drivers[violation.driverID]?.name || "";
    const licensePlate = motorcycles[violation.violationID] || ' ';

    // Format the violation date using formatDate
    const violationDate = violation.time ? formatDate(violation.time) : "";

    // Format searchDate to MM/DD/YYYY
    const formattedSearchDate = searchDate ? formatDate(new Date(searchDate).getTime() / 1000) : "";

    const matchesSearchQuery = driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               licensePlate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearchDate = formattedSearchDate ? violationDate === formattedSearchDate : true;

    const matchesTypeFilter = filters.type.length === 0 ||
      (filters.type.includes("Reckless Violations") && violation.isReckless) ||
      (filters.type.includes("Regular Violations") && !violation.isReckless);

    const matchesStatusFilter = filters.status.length === 0 ||
      filters.status.includes(violation.Status);

      const matchesCompany = company
      ? drivers[violation.driverID]?.companyName === company
      : true;

    //filter based on type from URL
    const matchesURLType =
      (type === "30" && violation.count30 > 0) ||
      (type === "50" && violation.count50 > 0) ||
      type === undefined;

    console.log(`Checking violation: ${violation.id} - Status: ${violation.Status}, 
                 Matches Status Filter: ${matchesStatusFilter}, 
                 Matches Search Query: ${matchesSearchQuery}, 
                 Matches Search Date: ${matchesSearchDate}, 
                 Violation Date: ${violationDate}, 
                 Search Date: ${formattedSearchDate}`);

    return matchesSearchQuery && matchesSearchDate && matchesTypeFilter && matchesStatusFilter && matchesCompany && matchesURLType;
  })
  .sort((a, b) => (b.time || 0) - (a.time || 0));
  
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const columns = [
    {
      title: "Violation ID",
      dataIndex: "violationID",
      key: "violationID",
      align: "center",
    },
    {
      title: "Driver ID",
      dataIndex: "driverID",
      key: "driverID",
      align: "center",
    },
    {
      title: "Driver Name",
      key: "driverName",
      align: "center",
      render: (text, record) => {
        const driverName = drivers[record.driverID]?.name || "";
        return capitalizeFirstLetter(driverName);
      },
    },
    {
      title: "Company Name",
      key: "CompanyName",
      align: "center",
      render: (text, record) => {
        const companyName = drivers[record.driverID]?.shortCompanyName || "";
        return capitalizeFirstLetter(companyName);
      },
    },
    {
      title: "Motorcycle License Plate",
      key: "motorcyclePlate",
      align: "center",
      render: (text, record) => motorcycles[record.violationID] || "   ", // Use violationID for lookup
    },
    {
      title: "Speed",
      dataIndex: "driverSpeed",
      key: "driverSpeed",
      align: "center",
    },
    {
      title: "Type",
      dataIndex: "violationType",
      key: "violationType",
      align: "center",
      render: (text, record) =>
        record.isReckless ? "Reckless Violation" : "Regular Violation",
    },
    {
      title: "Status",
      dataIndex: "Status",
      key: "Status",
      align: "center",
      render: (text, record) => (
        <span style={{ color: record.Status === "Active" ? 'green' : 'red' }}>
          {record.Status}
        </span>
      ),    
    },
    {
      title: "Date",
      key: "date",
      align: "center",
      render: (text, record) => formatDate(record.time),
    },
    {
      title: "Violation Details",
      key: "Details",
      align: "center",
      render: (text, record) => (
        <Link
          to={`/gdtviolation/general/${record.id}`}
          onClick={(e) => {
            e.preventDefault(); // Prevent immediate navigation
            handleClickDetails(record.id); // Update state
            setTimeout(
              () => navigate(`/gdtviolation/general/${record.id}`),
              100
            ); // Navigate after state update
          }}
        >
 <FaEye
                               style={{ cursor: 'pointer', fontSize: '1.5em', color: '#059855' }} 
                             />
                                     </Link>
      ),
    },
  ];
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  // Slice the filtered violations for current page
const paginatedViolations = filteredViolations.slice((currentPage - 1) * pageSize, currentPage * pageSize);
const paginatedData = filteredViolations.slice((currentPage - 1) * 5, currentPage * 5);
  

return (
    <>
      <Header active="gdtviolations" />
      <div className="breadcrumb">
        <a onClick={() => navigate("/gdthome")}>Home</a>
        <span> / </span>
        <a onClick={() => navigate("/GDTviolations")}>Violations List</a>
      </div>
      <main>
        {" "}
        <div>
          <div className={s.container}>
            <div className={s.searchHeader}>
            <h2 className={s.title}>Violations List</h2>
              <div className={s.searchContainer}>
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="#059855"
                    strokeLinecap="round"
                    strokeWidth="2"
                    d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search by Driver ID  or License Plate"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "235px", height:"20px" }}
                />
              </div>
              <div className={s.searchContainer} >
                <div className={`${s.selectWrapper} ${s.dropdownContainer}`} style={{  width: '355px' }}>
                  <FaFilter className={s.filterIcon} />
                  <div style={{ position: 'relative', width: '500px'}}>
                    <div
                      onClick={toggleDropdown}
                      style={{
                        padding: '8px',
                        backgroundColor: 'transparent', // Make background transparent
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: 'border 0.3s',
                        color: 'grey', // Set text color to grey
                        lineHeight: '1.0', 
                        fontSize:'14px',
                      }}
                    >
                    {selectedValues.length > 0 ? selectedValues.join(', ') : 'Filter violations'}

                    </div>
                    {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    background: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    zIndex: 1000,
                    width: '350px', // Set a wider width for the dropdown
                    left: '-40px', // Adjust this value to move the dropdown left
              
                  }}
                >
                  <div style={{ padding: '10px', fontWeight: 'bold' }}>Type</div>
                  {options.filter(option => option.value === "Reckless Violations" || option.value === "Regular Violations").map((option) => (
                    <div key={option.value} style={{ padding: '10px', cursor: 'pointer' }}>
                      <label style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedValues.includes(option.value)}
                          onChange={() => handleSelect(option.value)}
                          style={{ marginRight: '10px' }} // Space between checkbox and text
                        />
                        {option.label}
                      </label>
                    </div>
                  ))}
                  <div style={{ padding: '10px', fontWeight: 'bold' }}>Status</div>
                  {options.filter(option => option.value === "Active" || option.value === "Revoked").map((option) => (
                    <div key={option.value} style={{ padding: '10px', cursor: 'pointer' }}>
                      <label style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedValues.includes(option.value)}
                          onChange={() => handleSelect(option.value)}
                          style={{ marginRight: '10px' }} // Space between checkbox and text
                        />
                        {option.label}
                      </label>
                    </div>
                  ))}
                  {/* Reset Button */}
                  <div style={{ padding: '10px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        setSelectedValues([]); // Reset selected values
                        setFilters({ type: [], status: [] }); // Reset filters
                        toggleDropdown(); // Optionally close the dropdown
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        color: 'blue',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 0', // Adjust padding for better appearance
                        cursor: 'pointer',
                        width: '100%', 
                        textAlign:'left',
                      }}
                    >
                      Reset Filter
                    </button>
                  </div>
                </div>
              )}
                </div>
                </div>
              </div>
              <div
  className={s.searchContainerdate}
  style={{ position: "relative" }}
>
  <div>
    {/* Conditional rendering for the green circle with tick */}
    {searchDate && (
      <div style={{
        position: "absolute",
        top: "-1px",  // Adjust to position it higher
        right: "-1px",  // Adjust to position it to the right
        width: "16px",  // Smaller size for better fit
        height: "16px", // Smaller size for better fit
        borderRadius: "50%",
        backgroundColor: "#059855",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        fontSize: "12px", // Slightly smaller font size
        zIndex: 1, // Ensure it appears in front

      }}>
        ✓ 
      </div>
    )}

    <svg
      onClick={() => document.getElementById("date-input").focus()}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        top: "50%",
        left: "1px",
        transform: "translateY(-50%)",
        cursor: "pointer",
        width: "40px", // Adjusted width
        height: "40px", // Adjusted height
      }}
    >
      <path
        d="M18 2V4M6 2V4"
        stroke="#059855"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.9955 13H12.0045M11.9955 17H12.0045M15.991 13H16M8 13H8.00897M8 17H8.00897"
        stroke="#059855"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 8H20.5"
        stroke="#059855"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 12.2432C2.5 7.88594 2.5 5.70728 3.75212 4.35364C5.00424 3 7.01949 3 11.05 3H12.95C16.9805 3 18.9958 3 20.2479 4.35364C21.5 5.70728 21.5 7.88594 21.5 12.2432V12.7568C21.5 17.1141 21.5 19.2927 20.2479 20.6464C18.9958 22 16.9805 22 12.95 22H11.05C7.01949 22 5.00424 22 3.75212 20.6464C2.5 19.2927 2.5 17.1141 2.5 12.7568V12.2432Z"
        stroke="#059855"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 8H21"
        stroke="#059855"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>

    <input
      id="date-input"
      type="date"
      value={searchDate}
      onChange={(e) => setSearchDate(e.target.value)}
      style={{
        width: "100%",
        height: "40px", // Adjusted height
        fontSize: "16px",
        paddingLeft: "40px", // Add padding to avoid overlap with the icon
        backgroundColor: "transparent",
        border: "0px solid #ccc",
        borderRadius: "4px",
      }}
    />
  </div>
</div>
            </div>
          </div>

          {company &&  (
            <h3 className={s.subtitleDashboard}>
              <>
                Reckless Violation Reports from{" "}
                <span
                  className={s.gdtName}
                  style={{ textDecoration: "underline", cursor: "pointer" }}
                  onClick={handleShowPopupCompany}
                >
                  {companyInfo.ShortName}
                </span>{" "}
                Drivers
                {type === "50" && <> of Type 2 (exceeded the speed limit by 50km/h)</>}
                {type === "30" && <> of Type 1 (exceeded the speed limit by 30km/h)</>}
              </>
            </h3>
          )}
<Table
  columns={columns}
  dataSource={paginatedData}
  rowKey="id"
  rowClassName={(record) =>
    clickedViolations.includes(record.id) ? "" : s.highlightRow
  }
  pagination={false}
/>

{/* Flex container for button and pagination */}<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: '20px',
  flexWrap: 'wrap', // handles small screens
}}>
  {/* Left side: Go Back + View Reckless Drivers */}
  <div style={{ display: 'flex', gap: '12px' }}>
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
  </div>

  {/* Right side: Pagination */}
  <Pagination
    current={currentPage}
    pageSize={5}
    total={filteredViolations.length}
    onChange={(page) => setCurrentPage(page)}
    showSizeChanger={false}
    showLessItems
    // style={{ marginLeft: '20px' }} // Add margin for spacing
  />
</div>

          {/* Popup for no violations */}
          <Modal
            title={null}
            visible={isPopupVisible}
            onCancel={() => setIsPopupVisible(false)}
            footer={
              <p style={{ textAlign: "center" }}>
                There are no drivers with reckless violations.
              </p>
            }
            style={{ top: "38%" }}
            className="custom-modal"
            closeIcon={<span className="custom-modal-close-icon">×</span>}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <img
                src={X}
                alt="No Reckless Drivers"
                style={{ width: "20%", marginBottom: "16px" }}
              />
            </div>
          </Modal>

          {/*//////////////// Company Details POP-UP  ////////////////*/}
          <Modal
            visible={isPopupVisibleCompany}
            onCancel={handleClosePopupCompany}
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
                    {companyInfo.Name}
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
                    {companyInfo.ShortName}
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
                    {companyInfo.CommercialNum}
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
                      href={`mailto:${companyInfo?.CompamyEmail}`}
                      style={{ color: "#444", textDecoration: "underline" }}
                    >
                      {companyInfo.CompanyEmail}
                    </a>
                  </p>
                </div>
              </div>
            </main>
          </Modal>
          {/*///////////////////////////////END POP-UP/////////////////////////////////////////// */}
          
        </div>
      </main>
    </>
  );
};

export default RecklessViolationList;