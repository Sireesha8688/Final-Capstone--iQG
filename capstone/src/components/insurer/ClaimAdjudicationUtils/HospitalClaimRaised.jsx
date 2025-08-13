// src/components/insurer/ClaimAdjudicationUtils/HospitalClaimRaised.jsx
import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DescriptionIcon from "@mui/icons-material/Description";

const HospitalClaimRaised = ({ claim }) => {
  const treatmentDetails = claim.treatmentDetails || {};

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return "Invalid Date";
    }
  };

  const handleOpenDocument = (documentData, fileName) => {
    if (!documentData) return;
    try {
      if (documentData.startsWith("data:")) {
        const parts = documentData.split(",");
        const mimeTypeMatch = parts[0].match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-\.]+);?.*$/);
        if (!mimeTypeMatch) {
          window.open(documentData, "_blank");
          return;
        }
        const mimeType = mimeTypeMatch[1];
        const base64Content = parts[1];
        const byteCharacters = atob(base64Content);
        const byteNumbers = Array.from(byteCharacters).map((c) => c.charCodeAt(0));
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      } else {
        window.open(documentData, "_blank");
      }
    } catch {
      window.open(documentData, "_blank");
    }
  };

  return (
    <Accordion sx={{ borderRadius: "8px", mt: 2 }} elevation={2} defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight="bold">Claim Details</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" gutterBottom><strong>Treatment Offered:</strong> {claim.treatmentOffered}</Typography>
        <Typography variant="body2" gutterBottom><strong>Estimated Cost:</strong> ₹{claim.estimatedCostToHospital}</Typography>

        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Treatment Details</Typography>
        <Typography variant="body2" gutterBottom><strong>Admitted:</strong> {treatmentDetails.isAdmitted ? "Yes" : "No"}</Typography>
        {treatmentDetails.dateOfAdmission && (
          <Typography variant="body2" gutterBottom><strong>Date of Admission:</strong> {formatDate(treatmentDetails.dateOfAdmission)}</Typography>
        )}
        {treatmentDetails.admissionNotes && (
          <Typography variant="body2" gutterBottom><strong>Admission Notes:</strong> {treatmentDetails.admissionNotes}</Typography>
        )}
        <Typography variant="body2" gutterBottom><strong>Discharged:</strong> {treatmentDetails.isDischarged ? "Yes" : "No"}</Typography>
        {treatmentDetails.dateOfDischarge && (
          <Typography variant="body2" gutterBottom><strong>Date of Discharge:</strong> {formatDate(treatmentDetails.dateOfDischarge)}</Typography>
        )}
        {treatmentDetails.patientPaidNonMedicalExpenses !== undefined && (
          <Typography variant="body2" gutterBottom><strong>Patient Paid Non-Medical Expenses:</strong> ₹{treatmentDetails.patientPaidNonMedicalExpenses}</Typography>
        )}
        {treatmentDetails.hospitalFinalBillAmount !== undefined && (
          <Typography variant="body2" gutterBottom><strong>Hospital Final Bill Amount:</strong> ₹{treatmentDetails.hospitalFinalBillAmount}</Typography>
        )}

        <Box sx={{ mt: 2 }}>
          {treatmentDetails.hospitalFinalBill && (
            <Button variant="outlined" size="small" startIcon={<DescriptionIcon />} onClick={() => handleOpenDocument(treatmentDetails.hospitalFinalBill, `Hospital_Final_Bill_${claim._id}.pdf`)} sx={{ mr: 1, mb: 1 }}>
              Open Hospital Final Bill
            </Button>
          )}
          {treatmentDetails.dischargeSummaryUrl && (
            <Button variant="outlined" size="small" startIcon={<DescriptionIcon />} onClick={() => handleOpenDocument(treatmentDetails.dischargeSummaryUrl, `Discharge_Summary_${claim._id}.pdf`)} sx={{ mr: 1, mb: 1 }}>
              Open Discharge Summary
            </Button>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default HospitalClaimRaised;
