"use client";
import { useEffect, useState, useRef } from "react";
import { Modal, Button } from "antd";
import { db } from "../../../firebase";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, where, query } from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tooltip as AntTooltip } from "antd";

const CustomLegend = () => {
  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        justifyContent: "center",
        marginBottom: "10px",
      }}
    >
      <AntTooltip title="Number of Crach Response for this Staff">
        <span
          style={{ color: "#2E7D32", fontWeight: "bold", cursor: "pointer" }}
        >
          ● Staff Crach Response
        </span>
      </AntTooltip>
      <AntTooltip title="Number of Complaint Response for this Staff">
        <span
          style={{ color: "#4CAF50", fontWeight: "bold", cursor: "pointer" }}
        >
          ● Staff Complaint Response
        </span>
      </AntTooltip>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "white",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "5px",
          boxShadow: "0px 0px 5px rgba(0,0,0,0.2)",
        }}
      >
        <p style={{ fontWeight: "bold", marginBottom: "5px" }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, margin: 0 }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StaffChart = () => {
  const [data, setData] = useState([]);
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [hoveringTooltip, setHoveringTooltip] = useState(false);
  const navigate = useNavigate();
  const [crashModalVisible, setCrashModalVisible] = useState(false);
  const [complaintModalVisible, setComplaintModalVisible] = useState(false);
  const [staffNameWithNoComplaint, setStaffNameWithNoComplaint] = useState("");
  const [staffNameWithNoCrash, setStaffNameWithNoCrash] = useState("");
  const [startIndex, setStartIndex] = useState(0); // Track the start index for pagination
  const visibleCount = 5; // Number of items to display

  // Function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  useEffect(() => {
    const fetchResponse = async () => {
      try {
        const crashQuery = query(
          collection(db, "Crash"),
          where("Status", "==", "Emergency SOS")
        );
        const CrashQuerySnapshot = await getDocs(crashQuery);

        const complaintQuery = query(collection(db, "Complaint"));
        const ComplaintQuerySnapshot = await getDocs(complaintQuery);

        const StaffCounts = new Map();

        CrashQuerySnapshot.forEach((doc) => {
          const { RespondedBy } = doc.data();
          if (RespondedBy) {
            if (!StaffCounts.has(RespondedBy)) {
              StaffCounts.set(RespondedBy, {
                countCrash: 0,
                countComplaint: 0,
              });
            }
            StaffCounts.get(RespondedBy).countCrash += 1;
          }
        });

        ComplaintQuerySnapshot.forEach((doc) => {
          const { RespondedBy } = doc.data();
          if (RespondedBy) {
            if (!StaffCounts.has(RespondedBy)) {
              StaffCounts.set(RespondedBy, {
                countCrash: 0,
                countComplaint: 0,
              });
            }
            StaffCounts.get(RespondedBy).countComplaint += 1;
          }
        });

        const gdtSnapshot = await getDocs(collection(db, "GDT"));
        const allStaffData = gdtSnapshot.docs.map((doc) => {
          const data = doc.data();
          const GDTID = data.ID;
          const FirstName = capitalizeFirstLetter(data.Fname || "");
        
          const counts = StaffCounts.get(GDTID) || { countCrash: 0, countComplaint: 0 };
        
          return {
            FirstName,
            GDTID,
            Crash: counts.countCrash,
            Complaint: counts.countComplaint,
          };
        });
        // Sort x axis
        allStaffData.sort((a, b) => {
          const totalA = a.Crash + a.Complaint;
          const totalB = b.Crash + b.Complaint;
        
          if (totalB === totalA) {
            return a.FirstName.localeCompare(b.FirstName); // Alphabetical order for equal totals
          }
        
          return totalB - totalA; // Highest total first
        });        
        setData(allStaffData);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchResponse();
  }, []);

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - visibleCount));
  };

  const handleNext = () => {
    setStartIndex((prev) =>
      Math.min(data.length - visibleCount, prev + visibleCount)
    );
  };

  const visibleData = data.slice(startIndex, startIndex + visibleCount); // Get the currently visible data

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Alert for no complaints */}
      <Modal
        title="No Complaints Found"
        open={complaintModalVisible}
        onCancel={() => setComplaintModalVisible(false)}
        centered
        style={{ top: "1%" }}
        className="custom-modal"
        closeIcon={<span className="custom-modal-close-icon">×</span>}
        footer={[
          <Button key="cancel" onClick={() => setComplaintModalVisible(false)}>
            OK
          </Button>,
        ]}
      >
        <p>
          <strong>{staffNameWithNoComplaint}</strong>, the staff member, has not
          responded to any complaints yet.
        </p>
      </Modal>

      {/* Alert for no crashes */}
      <Modal
        title="No Crash Found"
        open={crashModalVisible}
        onCancel={() => setCrashModalVisible(false)}
        centered
        style={{ top: "1%" }}
        className="custom-modal"
        closeIcon={<span className="custom-modal-close-icon">×</span>}
        footer={[
          <Button key="cancel" onClick={() => setCrashModalVisible(false)}>
            OK
          </Button>,
        ]}
      >
        <p>
          <strong>{staffNameWithNoCrash}</strong>, the staff member, has not
          responded to any crash yet.
        </p>
      </Modal>

      <CustomLegend />
      <div style={{ whiteSpace: "nowrap" }}>
       
        <ResponsiveContainer width="100%" height={450} >
          <BarChart
            data={visibleData} // Display only visible data
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
            onMouseLeave={() => {
              if (!hoveringTooltip) setTooltipData(null);
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="FirstName"
              interval={0}
              height={60}
              tick={{ dy: 10 }}
              label={{
                value: "Staff Name",
                position: "insideBottom",
                dy: 25,
              }}
            />
            <YAxis
              allowDecimals={false}
              label={{
                value: "Number of Responses",
                angle: -90,
                position: "middle",
                dx: -20,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="Crash"
              fill="#2E7D32"
              name="Number of Crash Responses"
              style={{ cursor: "pointer" }}
              onClick={(data) => {
                if (data.payload.Crash === 0) {
                  setStaffNameWithNoCrash(data.payload.FirstName);
                  setCrashModalVisible(true);
                } else {
                  navigate(`/GDTcrashes/${data.payload.GDTID}`);
                }
              }}
            />
            <Bar
              dataKey="Complaint"
              fill="#4CAF50"
              name="Number of Complaint Responses"
              style={{ cursor: "pointer" }}
              onClick={(data) => {
                if (data.payload.Complaint === 0) {
                  setStaffNameWithNoComplaint(data.payload.FirstName);
                  setComplaintModalVisible(true);
                } else {
                  navigate(`/GDTComplaints/${data.payload.GDTID}`);
                }
              }}
            />
          </BarChart>
        </ResponsiveContainer>
        {data.length > 0 && (
          <div style={{position: "relative"}}>
            <Button
              onClick={handlePrev}
              disabled={startIndex === 0}
              style={{
                position: "absolute",
                left: "10px",
                bottom: "0px",
                fontSize: "20px",
                backgroundColor: "white",
                color: "black",
                width: "45px",
                height: "45px",
                border: "1px solid #e7eae8",
                borderRadius: "8px",
                opacity: startIndex === 0 ? 0.5 : 1,
                backgroundColor: startIndex === 0 ?  "#edeceb ": "white" ,
                cursor: startIndex === 0 ? "not-allowed" : "pointer",              }}
            >
              ←
            </Button>
            <Button
              onClick={handleNext}
              disabled={startIndex + visibleCount >= data.length}
              style={{
                position: "absolute",
                right: "10px",
                bottom: "0",
                fontSize: "20px",
                backgroundColor: "white",
                color: "black",
                width: "45px",
                height: "45px",
                border: "1px solid #e7eae8",
                borderRadius: "8px",
                opacity: startIndex + visibleCount >= data.length ? 0.5 : 1,
                backgroundColor: startIndex + visibleCount >= data.length ? "#edeceb ": "white" ,
                cursor: startIndex + visibleCount >= data.length ? "not-allowed" : "pointer",              }}
            >
              →
            </Button>
          </div>
        )}

      </div>

      {tooltipData && (
        <div
          onMouseEnter={() => setHoveringTooltip(true)}
          onMouseLeave={() => {
            setHoveringTooltip(false);
            setTooltipData(null);
          }}
          style={{
            position: "absolute",
            left: tooltipPos.x + 60,
            top: tooltipPos.y,
            backgroundColor: "white",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            boxShadow: "0px 0px 5px rgba(0,0,0,0.2)",
            zIndex: 10,
          }}
        >
          <p style={{ fontWeight: "bold", marginBottom: "5px" }}>
            {tooltipData.label}
          </p>
          {tooltipData.payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: 0 }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffChart;
