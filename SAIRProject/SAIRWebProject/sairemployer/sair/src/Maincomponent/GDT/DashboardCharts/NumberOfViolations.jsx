"use client";

import { useRef, useEffect, useState } from "react";
import { db } from "../../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Button, Modal, Input } from "antd";

const CustomDot = ({
  cx,
  cy,
  payload,
  dateType,
  offset,
  selectedYear,
  companyName,
  setWarningVisible,
  setWarningDate,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const violationCount = payload.count;

    let fullDate;
  
    if (dateType === "week") {
      // Parse the payload.date (like "25 April") and determine the real year from offset
      const [day, month] = payload.date.split(" ");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const endDate = new Date(today);
      endDate.setDate(today.getDate() - 7 * offset);
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6);
  
      const constructedDate = new Date(`${month} ${day}, ${startDate.getFullYear()}`);
      fullDate = constructedDate.toLocaleDateString("en-CA");
    } else {
      fullDate = `${payload.date}-${selectedYear}`;
    }

    if (violationCount === 0) {
      setWarningDate(fullDate); // Set the warning date
      setWarningVisible(true); // Show the modal
      return;
    }

    const companyParam =
      companyName === "All" ? "all" : encodeURIComponent(companyName);
    const dateParam = encodeURIComponent(fullDate);

    navigate(`/GDTViolations/${companyParam}/${dateParam}`);
  };

  return (
    <g>
      {/* Bigger transparent circle for better click experience */}
      <circle
        cx={cx}
        cy={cy}
        r={12}
        fill="transparent"
        onClick={handleClick}
        style={{ cursor: "pointer" }}
      />
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="#82ca9d"
        stroke="black"
        strokeWidth={1}
        pointerEvents="none"
      />
    </g>
  );
};

const NumberofViolations = ({ dateType, companyName }) => {
  const [data, setData] = useState([]);
  const [offset, setOffset] = useState(0); // 0 = current week/month
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isYearOpen, setIsYearOpen] = useState(false);
  const dropdownRef = useRef(null);
  const shortToFullCompanyMapRef = useRef(new Map());
  const [WarningVisible, setWarningVisible] = useState(false);
  const [warningDate, setWarningDate] = useState(""); // To store date for the modal

  useEffect(() => {
    if (dateType !== "week") {
      setSelectedYear(new Date().getFullYear()); // Reset to current year when not in "week" mode
    }
  }, [dateType]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsYearOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    const fetchViolations = async () => {
      try {
        const violationSnapshot = await getDocs(collection(db, "Violation"));
        const driverIDs = new Set();

        violationSnapshot.forEach((doc) => {
          const { driverID } = doc.data();
          if (driverID) driverIDs.add(driverID);
        });

        const driverIDList = [...driverIDs];
        const driverMap = new Map();

        // Fetch drivers in batches
        for (let i = 0; i < driverIDList.length; i += 10) {
          const batch = driverIDList.slice(i, i + 10);
          const q = query(
            collection(db, "Driver"),
            where("DriverID", "in", batch)
          );
          const driverSnapshot = await getDocs(q);

          driverSnapshot.forEach((doc) => {
            const { DriverID, CompanyName } = doc.data();
            if (DriverID && CompanyName) {
              driverMap.set(DriverID, CompanyName);
            }
          });
        }

        // Fetch all employers to map CompanyName to ShortCompanyName
        const employerSnapshot = await getDocs(collection(db, "Employer"));
        const employerMap = new Map();
        const shortToFullCompanyMap = new Map(); // CompanyName

        employerSnapshot.forEach((doc) => {
          const { CompanyName, ShortCompanyName } = doc.data();
          if (CompanyName && ShortCompanyName) {
            employerMap.set(CompanyName, ShortCompanyName);
            shortToFullCompanyMap.set(ShortCompanyName, CompanyName);
          }
        });
        shortToFullCompanyMapRef.current = shortToFullCompanyMap;

        const violationsMap = new Map();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate, endDate;
        if (dateType === "week") {
          endDate = new Date(today);
          endDate.setDate(today.getDate() - 7 * offset);
          startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 6);
        } else {
          startDate = new Date(selectedYear, 0, 1);
          endDate = new Date(selectedYear, 11, 31);
          
        }

        // Initialize the date range for the chart
        const dateRange = [];
        if (dateType === "week") {
          for (
            let d = new Date(startDate);
            d <= endDate;
            d.setDate(d.getDate() + 1)
          ) {
            const formattedDate = d.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
            });
            dateRange.push({ date: formattedDate, count: 0 });
          }
        } else {
          const months = Array.from({ length: 12 }, (_, i) =>
            new Date(startDate.getFullYear(), i, 1).toLocaleDateString(
              "en-GB",
              {
                month: "long",
              }
            )
          );
          months.forEach((month) => {
            dateRange.push({ date: month, count: 0 });
          });
        }

        // Process violations and group by date
        violationSnapshot.forEach((doc) => {
          const { time, driverID } = doc.data();
          if (!time) return;

          const violationDate = new Date(time * 1000);
          violationDate.setHours(0, 0, 0, 0);

          if (violationDate >= startDate && violationDate <= endDate) {
            const companyNameFromDriver = driverMap.get(driverID);
            const shortName =
              employerMap.get(companyNameFromDriver) || companyNameFromDriver;

            // Filter by company name if provided
            if (companyName !== "All" && shortName !== companyName) return;

            const formattedDate =
              dateType === "week"
                ? violationDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                  })
                : violationDate.toLocaleDateString("en-GB", {
                  month: "long",
                });
            violationsMap.set(
              formattedDate,
              (violationsMap.get(formattedDate) || 0) + 1
            );
          }
        });

        // Update the date range with actual counts
        dateRange.forEach(({ date }) => {
          if (violationsMap.has(date)) {
            const count = violationsMap.get(date);
            // Set the count for the existing date
            violationsMap.set(date, count);
          } else {
            // Ensure it exists with a count of 0
            violationsMap.set(date, 0);
          }
        });

        // Convert Map to an array
        let chartData = Array.from(violationsMap, ([date, count]) => ({
          date,
          count,
          // Add a sortOrder property for proper month sorting
          sortOrder:
            dateType === "week"
              ? new Date(
                  date.split(" ")[1] +
                    " " +
                    date.split(" ")[0] +
                    ", " +
                    startDate.getFullYear()
                ).getTime()
              : new Date(date + " 1, " + startDate.getFullYear()).getTime(),
        }));

        // Sort by sortOrder (chronological order)
        chartData.sort((a, b) => a.sortOrder - b.sortOrder);

        // Remove the sortOrder property before rendering
        chartData = chartData.map(({ date, count }) => ({ date, count }));

        console.log("Chart Data:", chartData); // Debugging line
        setData(chartData);
      } catch (error) {
        console.error("Error fetching violations:", error);
      }
    };

    fetchViolations(); // Fetch violations data
  }, [dateType, companyName, offset, selectedYear]);

  const fullCompanyName =
    companyName === "All"
      ? "All"
      : shortToFullCompanyMapRef.current.get(companyName) || companyName;

  // Sync offset with selectedYear
  useEffect(() => {
    setOffset(new Date().getFullYear() - selectedYear);
  }, [selectedYear]);

  return (
    <div
      style={{
        width: "100%",
        height: "400px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      {/* Control Buttons */}
      <div
        style={{ position: "absolute", top: "360px", left: "10px", zIndex: 2 }}
      >
        {/* Left Arrow Button */}
        <button
          onClick={() =>
            setOffset((prev) => {
              const newOffset = Math.min(prev + 1, 4); // Max 5 years back
              setSelectedYear(new Date().getFullYear() - newOffset); // Sync dropdown
              return newOffset;
            })
          }
          style={buttonStyle}
        >
          ←
        </button>
      </div>
      <div
        style={{ position: "absolute", top: "360px", right: "10px", zIndex: 2 }}
      >
        {/* Right Arrow Button */}
        <button
          onClick={() =>
            setOffset((prev) => {
              const newOffset = Math.max(prev - 1, 0);
              setSelectedYear(new Date().getFullYear() - newOffset); // Sync dropdown
              return newOffset;
            })
          }
          disabled={offset === 0}
          style={{
            ...buttonStyle,
            backgroundColor: offset === 0 ? "#edeceb " : "white",
            opacity: offset === 0 ? 0.5 : 1,
            cursor: offset === 0 ? "not-allowed" : "pointer",
          }}
        >
          →
        </button>
      </div>

      {/* Year Filter near X-axis Label */}
      {dateType !== "week" && (
        <div
          style={{
            position: "absolute",
            bottom: "-1px",
            left: "300px", // Adjust based on where you want it near the x-axis label
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 1,
          }}
        >
          <label
            style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#808080",
              whiteSpace: "nowrap",
            }}
          >
            Year:
          </label>
          <div
            className="selectWrapper"
            ref={dropdownRef}
            style={{
              border: "1px solid #4CAF50",
              backgroundColor: "#FFFFFF",
              color: "black",
              borderRadius: "5px",
              width: "100px",
              position: "relative",
            }}
          >
            <div
              className={`customSelect ${isYearOpen ? "open" : ""}`}
              onClick={() => setIsYearOpen(!isYearOpen)}
              style={{
                cursor: "pointer",
                padding: "6px 10px",
                textAlign: "left",
                fontSize: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {selectedYear}
              <span
                style={{
                  border: "solid #4CAF50",
                  borderWidth: "0 2px 2px 0",
                  display: "inline-block",
                  padding: "4px",
                  transform: isYearOpen ? "rotate(-135deg)" : "rotate(45deg)",
                  transition: "transform 0.2s",
                }}
              />
            </div>
            {isYearOpen && (
              <div
                className="dropdownMenu"
                style={{
                  position: "absolute",
                  zIndex: 1000,
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  width: "100%",
                  top: "100%",
                  left: 0,
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                  maxHeight: "80px", // Approx height for 5 items
                  overflowY: "auto", // Enables scrolling
                }}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <div
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        setIsYearOpen(false);
                      }}
                      style={{
                        padding: "10px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f0f0f0")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      {year}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Noviolation is empty */}
      <Modal
        title="Warning"
        visible={WarningVisible}
        onCancel={() => setWarningVisible(false)}
        centered
        footer={[]}
        closeIcon={<span className="custom-modal-close-icon">×</span>}
      >
        <p>
          No violations were reported on <strong>{warningDate}</strong>
          {companyName !== "All" && (
            <>
              {" "}
              for <strong>{companyName}</strong>
            </>
          )}
          .
        </p>
      </Modal>

      {/* Chart Component */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
        >
          <defs>
            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            interval={0}
            angle={-45}
            textAnchor="end"
            label={{
              value: dateType === "week" ? "Date" : `Date        `,
              position: "insideBottom",
              dy: 55,
              dx: dateType != "week" ? -60 : 0,
            }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            label={{
              value: "Number of Violations",
              angle: -90,
              position: "middle",
              dx: -20,
            }}
          />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#82ca9d"
            dot={
              <CustomDot
                dateType={dateType}
                offset={offset}
                selectedYear={selectedYear}
                companyName={fullCompanyName}
                setWarningVisible={setWarningVisible}
                setWarningDate={setWarningDate}
              />
            }
          />
          {/* <Line type="monotone" dataKey="count" stroke="#82ca9d" dot={true} /> */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Button styling for reuse
const buttonStyle = {
  fontSize: "20px",
  backgroundColor: "white",
  color: "black",
  width: "45px",
  height: "45px",
  border: "1px solid #e7eae8",
  borderRadius: "8px",
  cursor: "pointer",
};

export default NumberofViolations;
