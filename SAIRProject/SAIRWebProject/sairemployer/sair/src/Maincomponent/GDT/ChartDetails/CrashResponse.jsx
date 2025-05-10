import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { SearchOutlined } from "@ant-design/icons";
import { db, auth } from "../../../firebase";
import EyeIcon from "../../../images/eye.png";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Table, Button, Dropdown, Menu, Modal } from "antd";
import Header from "../GDTHeader";
import X from "../../../images/redx.webp";
import s from "../../../css/CrashResponse.module.css";
import "../../../css/CustomModal.css";

const columns = [
  {
    title: "Crash ID",
    dataIndex: "CrashID",
    key: "CrashID",
    align: "center",
  },
  {
    title: "Driver ID",
    dataIndex: "DriverID",
    key: "DriverID",
    align: "center",
  },
  {
    title: "Driver Name",
    key: "DriverName",
    align: "center",
    render: (text, record) => `${record.Fname} ${record.Lname}`,
  },

  {
    title: "Date",
    dataIndex: "Date",
    key: "Date",
    align: "center",
  },
  {
    title: "Crash Details",
    key: "Details",
    align: "center",
    render: (text, record) => (
      <img
        style={{ cursor: "pointer" }}
        src={EyeIcon}
        alt="Details"
        onClick={() => {}}
      />
    ),
  },
];

const CrashResponse = () => {
  const { GDTID } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [responseDetails, setresponseDetails] = useState(null);
  const [Crashes, setCrashes] = useState([]);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [error, setError] = useState(null);
  const [currentEmployerCompanyName, setCurrentEmployerCompanyName] =
    useState("");
  const GDTUID = sessionStorage.getItem("GDTUID");
  const [employerDetails, setEmployerDetails] = useState({});

  const filteredData = Crashes.filter((driver) => {
    const fullName = `${driver.DriverName || ""}`.toLowerCase();
    const driverID = driver.DriverID?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || driverID.includes(query);
  });

  useEffect(() => {
    const fetchCrashResponse = async () => {
      try {
        const crashesRef = collection(db, "Crash");
        const q = query(crashesRef, where("RespondedBy", "==", GDTID));
        const querySnapshot = await getDocs(q);

        const crashData = [];

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();

          // Criver details
          const driverRef = doc(db, "Driver", data.driverID);
          const driverSnap = await getDoc(driverRef);
          const driverData = driverSnap.exists() ? driverSnap.data() : {};

          crashData.push({
            key: docSnap.id,
            CrashID: data.crashID,
            DriverID: data.driverID,
            DriverName: `${driverData.Fname || ""} ${driverData.Lname || ""}`,
            Date: data.time || "",
          });
        }

        setCrashes(crashData);
      } catch (error) {
        console.error("Error fetching crash responses:", error);
        setError("Failed to fetch crash data.");
      }
    };

    fetchCrashResponse();
  }, [GDTID]);

  const handleLogout = () => {
    navigate("/login");
  };

  const goBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  return (
    <div>
      <Header active={"gdtdriverlist"} /> {/* DK */}
      <div className="breadcrumb">
        <a onClick={() => navigate("/gdtdashboard")}>DashBoard</a>
        <span> / </span>
        <a>Staff Response Details</a>
      </div>
      <main>
        <div className={s.container}>
          <h2 className={s.title}>Staff Response Details</h2>
          <div className={s.searchInputs}>
            <div className={s.searchContainer}>
              <SearchOutlined style={{ color: "#059855" }} />
              <input
                type="text"
                placeholder="Search by Crash ID or driver ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "300px" }}
              />
            </div>
          </div>
        </div>
        <br />

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          style={{ width: "1200px", margin: "0 auto", marginBottom: "20px" }}
        />

        {/* Flexbox container for button and pagination */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <Button
            onClick={goBack}
            style={{
              height: "60px",
              fontSize: "15px",
              color: "#059855",
              borderColor: "#059855",
            }}
          >
            <ArrowLeftOutlined style={{ marginRight: "8px" }} /> Go Back
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CrashResponse;
