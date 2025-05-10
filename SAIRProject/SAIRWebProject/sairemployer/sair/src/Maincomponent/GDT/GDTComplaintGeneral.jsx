import { useEffect, useState } from "react";
import {
  doc,
  getDocs,
  query,
  where,
  collection,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { db } from "../../firebase";
import Header from "./GDTHeader";
import s from "../../css/ViolationDetail.module.css";
import formstyle from "../../css/Profile.module.css";
import { Button, Modal, Input } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const GDTComplaintGeneral = () => {
  const [currentComplaint, setCurrentComplaint] = useState({});
  const [AssositedViolation, setAssositedViolation] = useState({});
  const [violations, setViolations] = useState([]);
  const [driverDetails, setDriverDetails] = useState({});
  const [employerDetails, setEmployerDetails] = useState({});
  const [violationDocId, setViolationDocId] = useState(null);
  const [GDT, setGDT] = useState({
    Lname: "",
    Fname: "",
    ID: "",
  });
  const [respondingGDT, setRespondingGDT] = useState({
    Fname: "",
    Lname: "",
    ID: "",
    GDTEmail: "",
    PhoneNumber: "",
  });
  const [DriverInfo, setDriverInfo] = useState({
    Fname: "",
    Lname: "",
    DriverID: "",
    Email: "",
    PhoneNumber: "",
    coutRejected: "",
  });
  const [userInput, setUserInput] = useState("");
  const maxLength = 245;
  const minLength = 10;
  const { complaintId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPopupVisibleStaff, setIsPopupVisibleStaff] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [WarningVisible, setWarningVisible] = useState(false);
  const [MINWarningVisible, setMINWarningVisible] = useState(false);
  const from = location.state?.from; // Get the source of navigation
  const violationId = location.state?.violationId; // Get violationId from state

  useEffect(() => {
    const GDTUID = sessionStorage.getItem("gdtUID"); // Get the stored UID  
    const fetchGDT = async () => {
      try {
        const docRef = doc(db, "GDT", GDTUID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGDT(docSnap.data());
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    };
  
    const fetchComplaintDetails = async () => {
      try {
        const complaintDocRef = doc(db, "Complaint", complaintId);
        const unsubscribe = onSnapshot(complaintDocRef, async (doc) => {
          if (doc.exists()) {
            const complaintData = doc.data();
            setCurrentComplaint(complaintData);
  
            if (complaintData.RespondedBy) {
              const gdtQuery = query(
                collection(db, "GDT"),
                where("ID", "==", complaintData.RespondedBy)
              );

              const violationQuery = query(
                                      collection(db, "Violation"),
                                      where("violationID", "==", complaintData.ViolationID) // Querying by the violationID field
                                    );

              const violationSnapshot = await getDocs(violationQuery);
                                    if (!violationSnapshot.empty) {
                                      // Assuming there's only one document with that violationID
                                      const violationDoc = violationSnapshot.docs[0];
                                      setViolationDocId(violationDoc.id); // Store the document ID
                                      console.log("Violation document found:", violationDoc.data());
                                    } else {
                                      console.error("Violation document not found for ID:", complaintData.ViolationID);
                                    }
  
              const gdtSnapshot = await getDocs(gdtQuery);
              if (!gdtSnapshot.empty) {
                const gdtData = gdtSnapshot.docs[0].data();
                setRespondingGDT(gdtData);
              } else {
                console.error("No GDT document found with ID:", complaintData.RespondedBy);
              }
            }
  
            // Fetch driver details
            const driverCollection = query(
              collection(db, "Driver"),
              where("DriverID", "==", complaintData.driverID)
            );
            const driverSnapshot = await getDocs(driverCollection);
            if (!driverSnapshot.empty) {
              const driverData = driverSnapshot.docs[0].data();
              setDriverDetails(driverData);
              fetchEmployerDetails(driverData.CompanyName);
            } 

            // Count rejected complaints
            const complaintQuery = query(
              collection(db, "Complaint"),
              where("driverID", "==", complaintData.driverID)
            );
            const complaintSnapshot = await getDocs(complaintQuery);
            const currentYear = new Date().getFullYear();
            
            const rejectedCount = complaintSnapshot.docs.filter(doc => {
              const data = doc.data();
              const timestamp = data.DateTime;
            
              if (timestamp?.toDate) {
                const complaintDate = timestamp.toDate(); // Convert Firestore Timestamp to JS Date
                return (
                  data.Status === "Rejected" &&
                  complaintDate.getFullYear() === currentYear
                );
              }
            
              return false; // Skip if DateTime is invalid
            }).length;
            
            setDriverInfo(prev => ({
              ...prev,
              coutRejected: rejectedCount,
            }));
          }
        });
    
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching complaint details:", error);
      }
    };
  
    fetchGDT();
    fetchComplaintDetails();
  }, [complaintId]);

  const fetchEmployerDetails = (companyName) => {
    const employerQuery = query(
      collection(db, "Employer"),
      where("CompanyName", "==", companyName)
    );

    const unsubscribe = onSnapshot(employerQuery, (snapshot) => {
      if (!snapshot.empty) {
        snapshot.forEach((doc) => {
          const data = doc.data();
          setEmployerDetails({
            CompanyEmail: data.CompanyEmail,
            CompanyName: data.CompanyName,
            PhoneNumber: data.PhoneNumber,
            ShortCompanyName: data.ShortCompanyName,
            commercialNumber: data.commercialNumber,
          });
        });
      }
    });

    return unsubscribe;
  };

  const goBack = () => {
    navigate(-2); // Navigate back to the previous page
  };

  const formatDateTime = (timestamp) => {
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }); // Format to 'HH:MM:SS AM/PM'
    }
    return ""; // Return an empty string if timestamp is not available
  };

  
  const viewViolation = () => {
    if (violationDocId) {
        navigate(`/gdtviolation/general/${violationDocId}`, {
          state: { from: "GDTComplaintGeneral", breadcrumbParam: "From Complaint" },
        });
      } else {
        console.error("No violation document ID found.");
      }
  };

  const handleShowPopupStaff = () => {
    setIsPopupVisibleStaff(true);
  };

  const handleClosePopupStaff = () => {
    setIsPopupVisibleStaff(false);
  };

  const handleConfirmResponse = () => {
    setModalVisible(true); // Show the confirmation modal
  };
  const handleConfirmResponse2 = () => {
    setModalVisible(true); // Show the confirmation modal
  };

  const handleAccept = async () => {
    setModalVisible(false); // Close the modal
  
    try {
      console.log("Current Complaint ID:", currentComplaint?.ComplaintID);
      console.log("Complaint ID:", complaintId);
  
      if (!complaintId) {
        console.error("Complaint ID is missing");
        return;
      }
  
      if (!GDT?.ID) {
        console.error("Responder details are incomplete");
        return;
      }
  
      console.log("Before checking Firestore document");
  
      // Reference the complaint document using the doc ID
      const complaintDocRef = doc(db, "Complaint", complaintId);
      const docSnapshot = await getDoc(complaintDocRef);
  
      if (!docSnapshot.exists()) {
        console.error("No Complaint document found with ID:", complaintId);
        return;
      }
  
      const complaintData = docSnapshot.data();
      const violationId = currentComplaint?.ViolationID;
  
      if (!violationId) {
        console.error("Violation ID not found in complaint data");
        return;
      }
      
      const violationQuery = query(
        collection(db, "Violation"),
        where("violationID", "==", violationId)
      );
      const violationSnapshot = await getDocs(violationQuery);
  
      if (violationSnapshot.empty) {
        console.error("No Violation document found with ViolationID:", violationId);
        return;
      }
  
      const violationDocRef = violationSnapshot.docs[0].ref;
  
      console.log("Document exists. Preparing update...");
  
      const updateData = {
        RespondedBy: GDT.ID,
        Status: "Accepted",
      };
  
      if (userInput && userInput.trim() !== "") {
        updateData.GDTResponse = userInput;
      }
  
      const updateViolation = {
        Status: "Revoked",
      };
  
      await updateDoc(complaintDocRef, updateData);
      await updateDoc(violationDocRef, updateViolation);
  
      setCurrentComplaint((prevComplaint) => ({
        ...prevComplaint,
        ...updateData,
      }));
  
      console.log("Complaint and violation updated successfully.");
    } catch (error) {
      console.error("Error updating complaint response:", error);
    }
  };
  

  const handleReject = async () => {
    if (!userInput.trim()) {
      setWarningVisible(true); // Show warning popup if the text area is empty
      return;
    } else if (userInput.length < minLength) {
      setMINWarningVisible(true);
      return;
    } else {
      setModalVisible(false); // Close the modal

      try {
        console.log(currentComplaint.complaintId);
        console.log("only", complaintId);
        // Check if ComplaintID exists and is valid
        if (!complaintId) {
          console.error("Complaint ID is missing");
          return;
        }

        // Ensure the GDT data is valid
        if (!GDT.ID) {
          console.error("Responder details are incomplete");
          return;
        }

        console.log("Before updating complaint");

        const updatedComplaint = {
          ...currentComplaint,
          RespondedBy: GDT.ID,
          GDTResponse: userInput,
          Status: "Rejected",
        };

        console.log("After updating complaint");

        const complaintDocRef = doc(db, "Complaint", complaintId);
        console.log("Firestore document reference:", complaintDocRef.path);

        // Check if document exists
        const docSnapshot = await getDoc(complaintDocRef);
        if (!docSnapshot.exists()) {
          console.error("No document found with ID:", complaintId);
          return;
        }

        // Update Firestore with new fields
        await updateDoc(complaintDocRef, {
          RespondedBy: updatedComplaint.RespondedBy,
          GDTResponse: updatedComplaint.GDTResponse,
          Status: updatedComplaint.Status,
        });

        // Update local state with new complaint details
        setCurrentComplaint(updatedComplaint);

        // Handle the assosiated violation---------------------------NO NEED
        // console.log(currentComplaint.ViolationID);
        // console.log("only",currentComplaint.ViolationID);
        // // Check if ComplaintID exists and is valid
        // if (!currentComplaint.ViolationID) {
        //   console.error("Violation ID is missing");
        //   return;
        // }

        // // Ensure the GDT data is valid
        // if (!GDT.ID) {
        //   console.error("Responder details are incomplete");
        //   return;
        // }

        // console.log("Before updating violation");

        // const updatedCViolation = {
        //   ...currentComplaint,
        //   ComplaintStatus: "Rejected",
        // };

        // console.log("After updating violation");

        // const violationDocRef = doc(
        //   db,
        //   "Violation",
        //   currentComplaint.ViolationID
        // );
        // console.log("Firestore document reference:", complaintDocRef.path);

        // // Check if document exists
        // const ViodocSnapshot = await getDoc(complaintDocRef);
        // if (!docSnapshot.exists()) {
        //   console.error(
        //     "No document found with ID:",
        //     complaintId
        //   );
        //   return;
        // }

        // // Update Firestore with new fields
        // await updateDoc(violationDocRef, {
        //   ComplaintStatus: updatedCViolation.ComplaintStatus,
        // });

        // // Update local state with new complaint details
        // setAssositedViolation(updatedCViolation);

        console.log("Complaint response updated successfully");
      } catch (error) {
        console.error("Error updating complaint response:", error);
      }
    }
  };

  // Determine the active state for the Header
  let activeHeader;
  if (from === "GDTViolationDetail") {
    activeHeader = location.state?.previousList || "gdtcomplaints"; // Default to 'complaints' if not set
  } else if (from === "GDTViolationGeneral") {
    activeHeader = "gdtviolations";
  } else {
    activeHeader = "gdtcomplaints"; // Default case
  }
  return (
    <div>
      <div>
        <Header active={activeHeader} />

        <div className="breadcrumb">
          <a onClick={() => navigate("/gdt-home")}>Home</a>
          <span> / </span>
          {from === "GDTViolationGeneral" && (
            <>
              <a onClick={() => navigate("/gdtviolations")}>Violations List</a>
              <span> / </span>
              <a
                onClick={() => navigate(`/gdtviolation/general/${violationId}`)}
              >
                Violation Details
              </a>
              <span> / </span>
              <a
                onClick={() => navigate(`/gdtcomplaint/general/${complaintId}`)}
              >
                Complaint Details
              </a>
            </>
          )}
          {from === "GDTViolationDetails" && (
            <>
              <a onClick={() => navigate("/gdtdriverslist")}>Driver List</a>
              <span> / </span>
              <a
                onClick={() =>
                  navigate(`/driver-details/${driverDetails.DriverID}`)
                }
              >
                Drivers Details
              </a>
              <span> / </span>
              <a onClick={() => navigate(`/drivers/:driverId/violations`)}>
                Violations List
              </a>
              <span> / </span>
              <a
                onClick={() => navigate(`/gdtviolation/detail/${violationId}`)}
              >
                Violation Details
              </a>
              <span> / </span>
              <a
                onClick={() => navigate(`/gdtcomplaint/general/${complaintId}`)}
              >
                Complaint Details
              </a>
            </>
          )}
          {!from && (
            <>
              <a onClick={() => navigate("/gdtcomplaints")}>Complaints List</a>
              <span> / </span>
              <a
                onClick={() => navigate(`/gdtcomplaint/general/${complaintId}`)}
              >
                Complaint Details
              </a>
            </>
          )}
        </div>
      </div>

      <main className={s.violation}>
        {!currentComplaint.RespondedBy && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "red",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              Would you like to handle this complaint report?
            </span>

            <Button type="primary" onClick={handleConfirmResponse}>
              Confirm Response
            </Button>

          </div>
        )}

        <Modal
          title="Confirm Response"
          visible={modalVisible}
          onCancel={() => setModalVisible(false)} // Close the modal when canceled
          centered
          width={700}
          closeIcon={<span className="custom-modal-close-icon">×</span>}
          footer={[
            <Button
              key="reject"
              type="primary"
              style={{ backgroundColor: "red", color: "white" }}
              onClick={handleReject}
            >
              Reject
            </Button>,

            <Button key="accept" type="primary" onClick={handleAccept}>
              Accept
            </Button>,
          ]}
        >
          <p>
            {GDT.Fname.charAt(0).toUpperCase() + GDT.Fname.slice(1)}{" "}
            {GDT.Lname.charAt(0).toUpperCase() + GDT.Lname.slice(1)}, by
            clicking the "Reject" or "Accept" button, you formally acknowledge
            your responsibility for managing this complaint and its associated
            violation. If you accept the complaint, the associated violation
            will be removed from the driver's record.
            <br />
            <br />
            {/* condition if rejected counter =! 0 */}
            NOTE: the driver {driverDetails.Fname} {driverDetails.Lname}, have
            {" "}{DriverInfo.coutRejected} rejected complaint within this year
          </p>

          <Input.TextArea
            placeholder="Please provide a reason for your response, as it is mandatory when selecting reject."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            autoSize={{ minRows: 5, maxRows: 10 }}
            maxLength={245}
            minLength={10}
            showCount
            style={{
              marginTop: 10,
              marginBottom: 15,
            }}
          />
        </Modal>

        {/* 2nd option */}
        <Modal
          title="Confirm Response"
          visible={modalVisible2}
          onCancel={() => setModalVisible(false)} // Close the modal when canceled
          centered
          width={700}
          closeIcon={<span className="custom-modal-close-icon">×</span>}
          footer={[
            <Button
              key="reject"
              type="primary"
              style={{ backgroundColor: "red", color: "white" }}
              onClick={() => setModalVisible(false)}
            >
              Reject
            </Button>,
            <Button key="accept" type="primary" onClick={handleAccept}>
              Accept
            </Button>,
          ]}
        >
          <p>
            {GDT.Fname.charAt(0).toUpperCase() + GDT.Fname.slice(1)}{" "}
            {GDT.Lname.charAt(0).toUpperCase() + GDT.Lname.slice(1)}, by
            clicking the "Reject" or "Accept" button, you formally acknowledge
            your responsibility for managing this complaint and its associated
            violation. If you accept the complaint, the associated violation
            will be removed from the driver's record.
            <br />
            <br />
            {/* condition if rejected counter =! 0 */}
            NOTE: the driver {driverDetails.Fname} {driverDetails.Lname}, have
            'counter' rejected complaint within this year
          </p>

          <Input.TextArea
            placeholder="Please provide a reason for your response, as it is mandatory when selecting reject."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            autoSize={{ minRows: 5, maxRows: 10 }}
            maxLength={245}
            showCount
            style={{
              marginTop: 10,
              marginBottom: 15,
              color: userInput.length >= maxLength ? "red" : "black",
            }}
          />
        </Modal>

        {/* Text is empty */}
        <Modal
          title="Warning"
          visible={WarningVisible}
          onCancel={() => setWarningVisible(false)} // Close the modal when canceled
          centered
          footer={[]}
          closeIcon={<span className="custom-modal-close-icon">×</span>}
        >
          <p>
            Dear {GDT.Fname.charAt(0).toUpperCase() + GDT.Fname.slice(1)}{" "}
            {GDT.Lname.charAt(0).toUpperCase() + GDT.Lname.slice(1)}, please
            provide a reason for rejecting the complaint in the text area before
            proceeding.
          </p>
        </Modal>

        {/* text is too short */}
        <Modal
          title="Warning"
          visible={MINWarningVisible}
          onCancel={() => setMINWarningVisible(false)} // Close the modal when canceled
          centered
          footer={[]}
          closeIcon={<span className="custom-modal-close-icon">×</span>}
        >
          <p>
            The provided reason is too short. Please provide more details, with
            at least one full sentence.
          </p>
        </Modal>

        <h2 style={{ marginTop: "30px" }} className="title">Driver Details</h2>
        <hr />

        {currentComplaint && driverDetails && (
          <>
            <div>
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
                    d="M14 3.5H10C6.22876 3.5 4.34315 3.5 3.17157 4.67157C2 5.84315 2 7.72876 2 11.5V12.5C2 16.2712 2 18.1569 3.17157 19.3284C4.34315 20.5 6.22876 20.5 10 20.5H14C17.7712 20.5 19.6569 20.5 20.8284 19.3284C22 18.1569 22 16.2712 22 12.5V11.5C22 7.72876 22 5.84315 20.8284 4.67157C19.6569 3.5 17.7712 3.5 14 3.5Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M5 16C6.03569 13.4189 9.89616 13.2491 11 16"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <path
                    d="M9.75 9.75C9.75 10.7165 8.9665 11.5 8 11.5C7.0335 11.5 6.25 10.7165 6.25 9.75C6.25 8.7835 7.0335 8 8 8C8.9665 8 9.75 8.7835 9.75 9.75Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                  <path
                    d="M14 8.5H19M14 12H19M14 15.5H16.5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Driver ID (National ID / Residency Number)
              </h3>
              <p style={{ fontSize: "18px", marginLeft: "45px" }}>
                {driverDetails.DriverID}
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
                    d="M14 3.5H10C6.22876 3.5 4.34315 3.5 3.17157 4.67157C2 5.84315 2 7.72876 2 11.5V12.5C2 16.2712 2 18.1569 3.17157 19.3284C4.34315 20.5 6.22876 20.5 10 20.5H14C17.7712 20.5 19.6569 20.5 20.8284 19.3284C22 18.1569 22 16.2712 22 12.5V11.5C22 7.72876 22 5.84315 20.8284 4.67157C19.6569 3.5 17.7712 3.5 14 3.5Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M5 16C6.03569 13.4189 9.89616 13.2491 11 16"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <path
                    d="M9.75 9.75C9.75 10.7165 8.9665 11.5 8 11.5C7.0335 11.5 6.25 10.7165 6.25 9.75C6.25 8.7835 7.0335 8 8 8C8.9665 8 9.75 8.7835 9.75 9.75Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                  <path
                    d="M14 8.5H19M14 12H19M14 15.5H16.5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Driver Name
              </h3>
              <p style={{ fontSize: "18px", marginLeft: "45px" }}>
                {driverDetails.Fname} {driverDetails.Lname}
              </p>
              <h3
                style={{
                  color: "#059855",
                  fontWeight: "bold",
                  fontSize: "20px",
                }}
              >
                {" "}
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
                    d="M9.1585 5.71223L8.75584 4.80625C8.49256 4.21388 8.36092 3.91768 8.16405 3.69101C7.91732 3.40694 7.59571 3.19794 7.23592 3.08785C6.94883 3 6.6247 3 5.97645 3C5.02815 3 4.554 3 4.15597 3.18229C3.68711 3.39702 3.26368 3.86328 3.09497 4.3506C2.95175 4.76429 2.99278 5.18943 3.07482 6.0397C3.94815 15.0902 8.91006 20.0521 17.9605 20.9254C18.8108 21.0075 19.236 21.0485 19.6496 20.9053C20.137 20.7366 20.6032 20.3131 20.818 19.8443C21.0002 19.4462 21.0002 18.9721 21.0002 18.0238C21.0002 17.3755 21.0002 17.0514 20.9124 16.7643C20.8023 16.4045 20.5933 16.0829 20.3092 15.8362C20.0826 15.6393 19.7864 15.5077 19.194 15.2444L18.288 14.8417C17.6465 14.5566 17.3257 14.4141 16.9998 14.3831C16.6878 14.3534 16.3733 14.3972 16.0813 14.5109C15.7762 14.6297 15.5066 14.8544 14.9672 15.3038C14.4304 15.7512 14.162 15.9749 13.834 16.0947C13.5432 16.2009 13.1588 16.2403 12.8526 16.1951C12.5071 16.1442 12.2426 16.0029 11.7135 15.7201C10.0675 14.8405 9.15977 13.9328 8.28011 12.2867C7.99738 11.7577 7.85602 11.4931 7.80511 11.1477C7.75998 10.8414 7.79932 10.457 7.90554 10.1663C8.02536 9.83828 8.24905 9.56986 8.69643 9.033C9.14586 8.49368 9.37058 8.22402 9.48939 7.91891C9.60309 7.62694 9.64686 7.3124 9.61719 7.00048C9.58618 6.67452 9.44362 6.35376 9.1585 5.71223Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
                Driver Phone Number
              </h3>
              <p style={{ fontSize: "18px", marginLeft: "45px" }}>
                {driverDetails.PhoneNumber}
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
                Driver Email
              </h3>
              <p style={{ fontSize: "18px", marginLeft: "45px" }}>
                {" "}
                <a
                  href={`mailto:${driverDetails.Email}`}
                  style={{
                    color: "black", // Default color
                    textDecoration: "underline", // Underline the text
                    transition: "color 0.3s", // Smooth transition for color change
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "green")} // Change color on hover
                  onMouseLeave={(e) => (e.currentTarget.style.color = "black")} // Revert color on mouse leave
                >
                  {driverDetails.Email}
                </a>
              </p>

              <h2 style={{ marginTop: "30px" }} className="title">Violation Details</h2>
              <hr />
            </div>

            {/* Violation ID Section */}
            <h3
              style={{ color: "#059855", fontWeight: "bold", fontSize: "20px" }}
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
                  d="M19 18.5C18.4313 19.3861 17.799 20.284 16.8019 20.6679C15.9395 21 14.8562 21 12.6896 21C11.5534 21 10.9853 21 10.4566 20.8834C9.64995 20.7056 8.90001 20.3294 8.27419 19.7888C7.86398 19.4344 7.52311 18.9785 6.84137 18.0667L3.83738 14.0487C3.3758 13.4314 3.38907 12.5789 3.86965 11.9763C4.49772 11.1888 5.66877 11.1237 6.3797 11.8369L8.0011 13.4634V7.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M11.0004 5.5C11.0004 4.67157 10.3288 4 9.50036 4C9.32491 4 9.15649 4.03012 9 4.08548M11.0004 5.5V3.5C11.0004 2.67157 11.6719 2 12.5004 2C13.3288 2 14.0004 2.67157 14.0004 3.5V5.5M11.0004 5.5V6.5011M14.0004 5.5C14.0004 4.67157 14.6719 4 15.5004 4C16.3288 4 17.0004 4.67157 17.0004 5.5V7.5M14.0004 5.5V9.5011M17.0004 7.5C17.0004 6.67157 17.6719 6 18.5004 6C19.3288 6 20.0004 6.67157 20.0004 7.5C19.9984 10.1666 20.0155 12.8335 19.9875 15.5M17.0004 7.5V10"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M2.5 2L22.5 22"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />{" "}
              </svg>
              Violation ID
            </h3>
            <p style={{ fontSize: "18px", marginLeft: "45px" }}>
              {currentComplaint.ViolationID}
            </p>

            <h2 style={{ marginTop: "30px" }} className="title">Complaint Details</h2>
            <hr />

            {/* Complaint ID Section */}
            <h3
              style={{ color: "#059855", fontWeight: "bold", fontSize: "20px" }}
            >
              {" "}
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
                  d="M13 20.8268V22H14.1734C14.5827 22 14.7874 22 14.9715 21.9238C15.1555 21.8475 15.3003 21.7028 15.5897 21.4134L20.4133 16.5894C20.6864 16.3164 20.8229 16.1799 20.8959 16.0327C21.0347 15.7525 21.0347 15.4236 20.8959 15.1434C20.8229 14.9961 20.6864 14.8596 20.4133 14.5866C20.1403 14.3136 20.0038 14.1771 19.8565 14.1041C19.5763 13.9653 19.2473 13.9653 18.9671 14.1041C18.8198 14.1771 18.6833 14.3136 18.4103 14.5866L18.4103 14.5866L13.5867 19.4106C13.2972 19.7 13.1525 19.8447 13.0762 20.0287C13 20.2128 13 20.4174 13 20.8268Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                />
                <path
                  d="M19 11C19 11 19 9.4306 18.8478 9.06306C18.6955 8.69552 18.4065 8.40649 17.8284 7.82843L13.0919 3.09188C12.593 2.593 12.3436 2.34355 12.0345 2.19575C11.9702 2.165 11.9044 2.13772 11.8372 2.11401C11.5141 2 11.1614 2 10.4558 2C7.21082 2 5.58831 2 4.48933 2.88607C4.26731 3.06508 4.06508 3.26731 3.88607 3.48933C3 4.58831 3 6.21082 3 9.45584V14C3 17.7712 3 19.6569 4.17157 20.8284C5.23467 21.8915 6.8857 21.99 10 21.9991M12 2.5V3C12 5.82843 12 7.24264 12.8787 8.12132C13.7574 9 15.1716 9 18 9H18.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Complaint ID
            </h3>
            <p style={{ fontSize: "18px", marginLeft: "45px" }}>
              {currentComplaint.ComplaintID}
            </p>

            <h3
              style={{ color: "#059855", fontWeight: "bold", fontSize: "20px" }}
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
                  d="M18.952 8.60639L21.4621 8.45358C19.6628 3.70459 14.497 0.999731 9.46037 2.34456C4.09595 3.77692 0.909592 9.26089 2.34343 14.5933C3.77728 19.9258 9.28835 23.0874 14.6528 21.6551C18.6358 20.5916 21.418 17.2945 22 13.4842"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M12 7.99982V11.9998L14 13.9998"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Time
            </h3>
            <p style={{ fontSize: "18px", marginLeft: "45px" }}>
              {formatDateTime(currentComplaint.DateTime)}
            </p>

            <h3
              style={{ color: "#059855", fontWeight: "bold", fontSize: "20px" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="35"
                height="35"
                style={{ marginBottom: "-3px", marginRight: "10px" }}
                color="#059855"
                fill="none"
              >
                <path
                  d="M18 2V4M6 2V4"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M11.9955 13H12.0045M11.9955 17H12.0045M15.991 13H16M8 13H8.00897M8 17H8.00897"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M3.5 8H20.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M2.5 12.2432C2.5 7.88594 2.5 5.70728 3.75212 4.35364C5.00424 3 7.01949 3 11.05 3H12.95C16.9805 3 18.9958 3 20.2479 4.35364C21.5 5.70728 21.5 7.88594 21.5 12.2432V12.7568C21.5 17.1141 21.5 19.2927 20.2479 20.6464C18.9958 22 16.9805 22 12.95 22H11.05C7.01949 22 5.00424 22 3.75212 20.6464C2.5 19.2927 2.5 17.1141 2.5 12.7568V12.2432Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M3 8H21"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Date
            </h3>
            <p style={{ fontSize: "18px", marginLeft: "45px" }}>
              {currentComplaint.DateTime
                ? new Date(
                    currentComplaint.DateTime.seconds * 1000
                  ).toLocaleDateString()
                : ""}
            </p>

            {/* Reason Section */}
            <h3
              style={{ color: "#059855", fontWeight: "bold", fontSize: "20px" }}
            >
              {" "}
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
                  d="M13 20.8268V22H14.1734C14.5827 22 14.7874 22 14.9715 21.9238C15.1555 21.8475 15.3003 21.7028 15.5897 21.4134L20.4133 16.5894C20.6864 16.3164 20.8229 16.1799 20.8959 16.0327C21.0347 15.7525 21.0347 15.4236 20.8959 15.1434C20.8229 14.9961 20.6864 14.8596 20.4133 14.5866C20.1403 14.3136 20.0038 14.1771 19.8565 14.1041C19.5763 13.9653 19.2473 13.9653 18.9671 14.1041C18.8198 14.1771 18.6833 14.3136 18.4103 14.5866L18.4103 14.5866L13.5867 19.4106C13.2972 19.7 13.1525 19.8447 13.0762 20.0287C13 20.2128 13 20.4174 13 20.8268Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                />
                <path
                  d="M19 11C19 11 19 9.4306 18.8478 9.06306C18.6955 8.69552 18.4065 8.40649 17.8284 7.82843L13.0919 3.09188C12.593 2.593 12.3436 2.34355 12.0345 2.19575C11.9702 2.165 11.9044 2.13772 11.8372 2.11401C11.5141 2 11.1614 2 10.4558 2C7.21082 2 5.58831 2 4.48933 2.88607C4.26731 3.06508 4.06508 3.26731 3.88607 3.48933C3 4.58831 3 6.21082 3 9.45584V14C3 17.7712 3 19.6569 4.17157 20.8284C5.23467 21.8915 6.8857 21.99 10 21.9991M12 2.5V3C12 5.82843 12 7.24264 12.8787 8.12132C13.7574 9 15.1716 9 18 9H18.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Complaint Reason
            </h3>
            <p style={{ fontSize: "18px", marginLeft: "45px" }}>
              {currentComplaint.Reason}
            </p>
            {/* Description Section */}
            <h3
              style={{ color: "#059855", fontWeight: "bold", fontSize: "20px" }}
            >
              {" "}
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
                  d="M13 20.8268V22H14.1734C14.5827 22 14.7874 22 14.9715 21.9238C15.1555 21.8475 15.3003 21.7028 15.5897 21.4134L20.4133 16.5894C20.6864 16.3164 20.8229 16.1799 20.8959 16.0327C21.0347 15.7525 21.0347 15.4236 20.8959 15.1434C20.8229 14.9961 20.6864 14.8596 20.4133 14.5866C20.1403 14.3136 20.0038 14.1771 19.8565 14.1041C19.5763 13.9653 19.2473 13.9653 18.9671 14.1041C18.8198 14.1771 18.6833 14.3136 18.4103 14.5866L18.4103 14.5866L13.5867 19.4106C13.2972 19.7 13.1525 19.8447 13.0762 20.0287C13 20.2128 13 20.4174 13 20.8268Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                />
                <path
                  d="M19 11C19 11 19 9.4306 18.8478 9.06306C18.6955 8.69552 18.4065 8.40649 17.8284 7.82843L13.0919 3.09188C12.593 2.593 12.3436 2.34355 12.0345 2.19575C11.9702 2.165 11.9044 2.13772 11.8372 2.11401C11.5141 2 11.1614 2 10.4558 2C7.21082 2 5.58831 2 4.48933 2.88607C4.26731 3.06508 4.06508 3.26731 3.88607 3.48933C3 4.58831 3 6.21082 3 9.45584V14C3 17.7712 3 19.6569 4.17157 20.8284C5.23467 21.8915 6.8857 21.99 10 21.9991M12 2.5V3C12 5.82843 12 7.24264 12.8787 8.12132C13.7574 9 15.1716 9 18 9H18.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Complaint Description
            </h3>
            <p style={{ fontSize: "18px", marginLeft: "45px" }}>
              {currentComplaint.Description}
            </p>

            {currentComplaint.RespondedBy && (
            <div>
              <h2 style={{ marginTop: "30px" }} className="title">Complaint Response Details</h2>
              <hr/>
            </div>
            )}

            {currentComplaint.RespondedBy && (
              <div class={formstyle.banner}>
                <strong>
                  This complaint was responded by
                  <span
                    class={formstyle.underline}
                    onClick={handleShowPopupStaff}
                    style={{ marginLeft: "4px" }}
                  >
                    {`${respondingGDT.Fname} ${respondingGDT.Lname}`}
                  </span>
                </strong>
              </div>
            )}

            {/* Status Section */}
            <h3
              style={{ color: "#059855", fontWeight: "bold", fontSize: "20px" }}
            >
              <span
                style={{
                  backgroundColor:
                    currentComplaint.Status === "Accepted"
                      ? "green"
                      : currentComplaint.Status === "Pending"
                      ? "orange"
                      : "red",
                  marginRight: "20px",
                  marginLeft: "5px",
                  borderRadius: "50%",
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                }}
              ></span>
              Status
            </h3>
            <p style={{ fontSize: "18px", marginLeft: "45px" }}>
              {currentComplaint.Status}
            </p>

            {/* Reason of Response */}
            
            { currentComplaint.GDTResponse && (
              <>
            <h3
              style={{ color: "#059855", fontWeight: "bold", fontSize: "20px" }}
            >
              {" "}
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
                  d="M16.4249 4.60509L17.4149 3.6151C18.2351 2.79497 19.5648 2.79497 20.3849 3.6151C21.205 4.43524 21.205 5.76493 20.3849 6.58507L19.3949 7.57506M16.4249 4.60509L9.76558 11.2644C9.25807 11.772 8.89804 12.4078 8.72397 13.1041L8 16L10.8959 15.276C11.5922 15.102 12.228 14.7419 12.7356 14.2344L19.3949 7.57506M16.4249 4.60509L19.3949 7.57506"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                />
                <path
                  d="M18.9999 13.5C18.9999 16.7875 18.9999 18.4312 18.092 19.5376C17.9258 19.7401 17.7401 19.9258 17.5375 20.092C16.4312 21 14.7874 21 11.4999 21H11C7.22876 21 5.34316 21 4.17159 19.8284C3.00003 18.6569 3 16.7712 3 13V12.5C3 9.21252 3 7.56879 3.90794 6.46244C4.07417 6.2599 4.2599 6.07417 4.46244 5.90794C5.56879 5 7.21252 5 10.5 5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
                Reason of {currentComplaint?.Status === "Rejected" ? "Rejection" : currentComplaint?.Status === "Accepted" ? "Acceptance" : "Response"}
              </h3>
            <p style={{ fontSize: "18px", marginLeft: "45px" }}>
              {currentComplaint.GDTResponse}
            </p>
            </>
            )}
            <hr />

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
                  <h4 className={formstyle.GDTLabel}>Staff Information</h4>

                  <div id="Staff name">
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
                          d="M14 3.5H10C6.22876 3.5 4.34315 3.5 3.17157 4.67157C2 5.84315 2 7.72876 2 11.5V12.5C2 16.2712 2 18.1569 3.17157 19.3284C4.34315 20.5 6.22876 20.5 10 20.5H14C17.7712 20.5 19.6569 20.5 20.8284 19.3284C22 18.1569 22 16.2712 22 12.5V11.5C22 7.72876 22 5.84315 20.8284 4.67157C19.6569 3.5 17.7712 3.5 14 3.5Z"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M5 16C6.03569 13.4189 9.89616 13.2491 11 16"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                        <path
                          d="M9.75 9.75C9.75 10.7165 8.9665 11.5 8 11.5C7.0335 11.5 6.25 10.7165 6.25 9.75C6.25 8.7835 7.0335 8 8 8C8.9665 8 9.75 8.7835 9.75 9.75Z"
                          stroke="currentColor"
                          stroke-width="1.5"
                        />
                        <path
                          d="M14 8.5H19M14 12H19M14 15.5H16.5"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      Staff ID (National Number)
                    </h3>
                    <p
                      style={{
                        fontSize: "18px",
                        marginLeft: "45px",
                        marginBottom: "20px",
                      }}
                    >
                      {respondingGDT.ID}
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
                          d="M14 3.5H10C6.22876 3.5 4.34315 3.5 3.17157 4.67157C2 5.84315 2 7.72876 2 11.5V12.5C2 16.2712 2 18.1569 3.17157 19.3284C4.34315 20.5 6.22876 20.5 10 20.5H14C17.7712 20.5 19.6569 20.5 20.8284 19.3284C22 18.1569 22 16.2712 22 12.5V11.5C22 7.72876 22 5.84315 20.8284 4.67157C19.6569 3.5 17.7712 3.5 14 3.5Z"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M5 16C6.03569 13.4189 9.89616 13.2491 11 16"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                        <path
                          d="M9.75 9.75C9.75 10.7165 8.9665 11.5 8 11.5C7.0335 11.5 6.25 10.7165 6.25 9.75C6.25 8.7835 7.0335 8 8 8C8.9665 8 9.75 8.7835 9.75 9.75Z"
                          stroke="currentColor"
                          stroke-width="1.5"
                        />
                        <path
                          d="M14 8.5H19M14 12H19M14 15.5H16.5"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      Staff Name
                    </h3>
                    <p
                      style={{
                        fontSize: "18px",
                        marginLeft: "45px",
                        marginBottom: "20px",
                      }}
                    >
                      {respondingGDT.Fname} {respondingGDT.Lname}
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
                          d="M9.1585 5.71223L8.75584 4.80625C8.49256 4.21388 8.36092 3.91768 8.16405 3.69101C7.91732 3.40694 7.59571 3.19794 7.23592 3.08785C6.94883 3 6.6247 3 5.97645 3C5.02815 3 4.554 3 4.15597 3.18229C3.68711 3.39702 3.26368 3.86328 3.09497 4.3506C2.95175 4.76429 2.99278 5.18943 3.07482 6.0397C3.94815 15.0902 8.91006 20.0521 17.9605 20.9254C18.8108 21.0075 19.236 21.0485 19.6496 20.9053C20.137 20.7366 20.6032 20.3131 20.818 19.8443C21.0002 19.4462 21.0002 18.9721 21.0002 18.0238C21.0002 17.3755 21.0002 17.0514 20.9124 16.7643C20.8023 16.4045 20.5933 16.0829 20.3092 15.8362C20.0826 15.6393 19.7864 15.5077 19.194 15.2444L18.288 14.8417C17.6465 14.5566 17.3257 14.4141 16.9998 14.3831C16.6878 14.3534 16.3733 14.3972 16.0813 14.5109C15.7762 14.6297 15.5066 14.8544 14.9672 15.3038C14.4304 15.7512 14.162 15.9749 13.834 16.0947C13.5432 16.2009 13.1588 16.2403 12.8526 16.1951C12.5071 16.1442 12.2426 16.0029 11.7135 15.7201C10.0675 14.8405 9.15977 13.9328 8.28011 12.2867C7.99738 11.7577 7.85602 11.4931 7.80511 11.1477C7.75998 10.8414 7.79932 10.457 7.90554 10.1663C8.02536 9.83828 8.24905 9.56986 8.69643 9.033C9.14586 8.49368 9.37058 8.22402 9.48939 7.91891C9.60309 7.62694 9.64686 7.3124 9.61719 7.00048C9.58618 6.67452 9.44362 6.35376 9.1585 5.71223Z"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                      </svg>
                      Staff Phone Numbr
                    </h3>
                    <p
                      style={{
                        fontSize: "18px",
                        marginLeft: "45px",
                        marginBottom: "20px",
                      }}
                    >
                      {GDT.PhoneNumber}
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
                      Staff Email
                    </h3>
                    <p style={{ fontSize: "18px", marginLeft: "45px" }}>
                      <a
                        href={`mailto:${employerDetails?.CompanyEmail}`}
                        style={{ color: "#444", textDecoration: "underline" }}
                      >
                        {respondingGDT.GDTEmail}
                      </a>
                    </p>
                  </div>
                </div>
              </main>
            </Modal>
            {/*///////////////////////////////END POP-UP/////////////////////////////////////////// */}

            <div style={{ marginBottom: "90px" }}>
            <Button
                onClick={goBack}
                style={{
                  float: "left",
                  marginBottom: "100px",
                  width: "auto",
                  height: "60px",
                  fontSize: "15px",
                  color: "#059855",
                  borderColor: "#059855",
                }}
              >
                <ArrowLeftOutlined style={{ marginRight: "8px" }} /> Go Back
              </Button>
              {/* View Violation Button */}
              <Button
                onClick={viewViolation}
                style={{
                  float: "right",
                  width: "auto",
                  height: "60px",
                  fontSize: "15px",
                  color: "#059855",
                  borderColor: "#059855",
                }}
              >
                <i className="fas fa-eye" style={{ marginRight: "8px" }}></i>
                View Violation
              </Button>

              
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default GDTComplaintGeneral;
