import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Typography,
  Grid,
  CircularProgress,
  Divider,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf"; // <--- Add this line

const API_BASE = "http://localhost:1000/api/hospital";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleString(); // You can customize format here
};

const GenerateDischargeDetails = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCardId, setExpandedCardId] = useState(null);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await axios.get(`${API_BASE}/claims`);
        setClaims(res.data || []);
      } catch (error) {
        console.error("Failed to fetch hospital claims:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  const toggleExpand = (id) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  const downloadPdf = (base64Data, filename = "document.pdf") => {
    if (!base64Data) {
      alert("No PDF available");
      return;
    }
    const linkSource = base64Data.startsWith("data:")
      ? base64Data
      : `data:application/pdf;base64,${base64Data}`;
    const link = document.createElement("a");
    link.href = linkSource;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!claims.length) {
    return (
      <Typography variant="h6" sx={{ mt: 4 }} align="center">
        No hospital claims found.
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Hospital Discharge Details
      </Typography>

      <Grid container spacing={3}>
        {claims.map((claim) => {
          const { _id, customerName, treatmentDetails, finalClaimSettlement } =
            claim;

          const isExpanded = expandedCardId === _id;

          return (
            <Grid item xs={12} sm={6} md={4} key={_id}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" noWrap>
                    ID: {_id}
                  </Typography>

                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {customerName || "Unknown Patient"}
                  </Typography>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => toggleExpand(_id)}
                    sx={{ mb: 1 }}
                  >
                    {isExpanded ? "Hide Summary" : "View Summary"}
                  </Button>

                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Divider sx={{ my: 1 }} />

                    {/* Room and Bed */}
                    <Typography variant="body2">
                      <strong>Room ID:</strong>{" "}
                      {treatmentDetails?.roomId || "N/A"}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Bed ID:</strong> {treatmentDetails?.bedId || "N/A"}
                    </Typography>

                    {/* Admission details */}
                    <Typography variant="body2" gutterBottom>
                      <strong>Admitted:</strong>{" "}
                      {treatmentDetails?.isAdmitted ? "Yes" : "No"}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Date of Admission:</strong>{" "}
                      {formatDate(treatmentDetails?.dateOfAdmission)}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Discharged:</strong>{" "}
                      {treatmentDetails?.isDischarged ? "Yes" : "No"}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Date of Discharge:</strong>{" "}
                      {formatDate(treatmentDetails?.dateOfDischarge)}
                    </Typography>

                    {/* Patient Paid expenses */}
                    <Typography variant="body2" gutterBottom>
                      <strong>Patient Paid Non-Medical Expenses:</strong> ₹
                      {treatmentDetails?.patientPaidNonMedicalExpenses || "0"}
                    </Typography>

                    {/* Treatment Offered */}
                    <Typography variant="body2" gutterBottom>
                      <strong>Treatment Offered:</strong>{" "}
                      {claim.treatmentOffered || "N/A"}
                    </Typography>

                    {/* Final Claim Settlement */}
                    {finalClaimSettlement ? (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Final Claim Settlement
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                          <strong>Insurer Approved Amount:</strong> ₹
                          {finalClaimSettlement.insurerApprovedAmount || "N/A"}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                          <strong>Insurer Message:</strong>{" "}
                          {finalClaimSettlement.insurerMessage || "N/A"}
                        </Typography>

                        {/* Download insurer final bill PDF */}
                        {finalClaimSettlement.insurerFinalBill && (
                          <Button
                            size="small"
                            variant="contained"
                            sx={{ mt: 1, mr: 1 }}
                            startIcon={<PictureAsPdfIcon />}
                            onClick={() =>
                              downloadPdf(
                                finalClaimSettlement.insurerFinalBill,
                                `Insurer_Final_Bill_${_id}.pdf`
                              )
                            }
                          >
                            Download Insurer Final Bill
                          </Button>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" sx={{ fontStyle: "italic", mt: 1 }}>
                        No Final Claim Settlement data available.
                      </Typography>
                    )}

                    {/* Discharge Summary PDF download */}
                    {treatmentDetails?.dischargeSummaryUrl && (
                      <Button
                        size="small"
                        variant="contained"
                        sx={{ mt: 1 }}
                        startIcon={<PictureAsPdfIcon />}
                        onClick={() =>
                          downloadPdf(
                            treatmentDetails.dischargeSummaryUrl,
                            `Discharge_Summary_${_id}.pdf`
                          )
                        }
                      >
                        Download Discharge Summary
                      </Button>
                    )}
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default GenerateDischargeDetails;
