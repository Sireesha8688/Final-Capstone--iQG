// src/components/insurer/ClaimAdjudicationUtils/HospitalApproveAccordian.jsx
import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { API_ENDPOINT, endpoints } from "../../../api/API";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Error Formatting Date";
  }
};

// Calculate age in years from date_of_birth string (expects ISO format or parseable date)
const calculateAge = (dobString) => {
  if (!dobString) return "N/A";
  try {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return "N/A";
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  } catch {
    return "N/A";
  }
};

const handleDownloadPdf = (base64Data, fileName) => {
  try {
    const byteCharacters = atob(base64Data.split(",")[1] || base64Data); // Handle data URL prefix
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    alert("Failed to download PDF. The file might be corrupted or not a valid base64 PDF.");
  }
};

const HospitalApproveAccordian = ({ claim, onClaimApproved }) => {
  // States for form inputs
  const [billRows, setBillRows] = useState([{ head: "", billAmount: "", deduction: "", settled: "" }]);
  const [insurerMessage, setInsurerMessage] = useState("");

  // Loading, error, success feedback
  const [billLoading, setBillLoading] = useState(false);
  const [billError, setBillError] = useState("");
  const [billSuccess, setBillSuccess] = useState("");

  // Manage approved claim mode
  const [isClaimApproved, setIsClaimApproved] = useState(false);
  const [isEditingApprovedDetails, setIsEditingApprovedDetails] = useState(false);
  const [approvedAmountDisplay, setApprovedAmountDisplay] = useState(0);
  const [generatedPdfBase64, setGeneratedPdfBase64] = useState(null);

  const fetchClaimDetails = () => {
    setIsClaimApproved(true);
    setApprovedAmountDisplay(claim.finalClaimSettlement?.insurerApprovedAmount || 0);
    setInsurerMessage(claim.finalClaimSettlement?.insurerMessage || "");
    setGeneratedPdfBase64(claim.finalClaimSettlement?.insurerFinalBill || null);
    setIsEditingApprovedDetails(false);
  };

  useEffect(() => {
    if (claim.insurerStatus === "CLAIM_APPROVED" && claim.finalClaimSettlement) {
      fetchClaimDetails();
    } else {
      // Reset for new approval
      setIsClaimApproved(false);
      setApprovedAmountDisplay(0);
      setInsurerMessage("");
      setGeneratedPdfBase64(null);
      setBillRows([{ head: "", billAmount: "", deduction: "", settled: "" }]);
      setIsEditingApprovedDetails(true); // Start in edit mode
    }
    setBillError("");
    setBillSuccess("");
  }, [claim]);

  const handleBillRowChange = (idx, field, value) => {
    setBillRows((rows) => rows.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  };

  const handleAddBillRow = () => {
    setBillRows((rows) => [...rows, { head: "", billAmount: "", deduction: "", settled: "" }]);
  };

  const handleEditApprovedMessage = () => {
    setIsEditingApprovedDetails(true);
    setBillError("");
    setBillSuccess("");
  };

  const handleSubmitApproval = async () => {
    setBillLoading(true);
    setBillError("");
    setBillSuccess("");
    try {
      let totalBill = 0,
        totalDeduction = 0,
        totalSettled = 0;

      if (!isClaimApproved || isEditingApprovedDetails) {
        billRows.forEach((row) => {
          totalBill += parseFloat(row.billAmount || 0);
          totalDeduction += parseFloat(row.deduction || 0);
          totalSettled += parseFloat(row.settled || 0);
        });
      } else {
        totalSettled = approvedAmountDisplay;
      }

      const coPay = 0;
      const discount = 0;
      const payableAmount = totalSettled + coPay + discount;

      let pdfBase64 = generatedPdfBase64;

      if (!isClaimApproved || isEditingApprovedDetails) {
        const [customerRes, hospitalRes] = await Promise.all([
          axios.get(`${API_ENDPOINT}/${endpoints.LoginMicroservice}/Customer/${claim.customerId}`),
          axios.get(`${API_ENDPOINT}/${endpoints.LoginMicroservice}/Hospital/${claim.hospitalId}`),
        ]);
        const customer = customerRes.data;
        const hospital = hospitalRes.data;

        const doc = new jsPDF();
        let yPos = 15;

        doc.setFontSize(10);
        doc.text(`Date: ${formatDate(new Date().toISOString())}`, 170, yPos);
        yPos += 10;
        doc.text(`To,`, 20, yPos);
        yPos += 8;

        doc.setFontSize(12);
        doc.text(`${customer.name || "N/A"}`, 20, yPos);
        yPos += 7;

        doc.setFontSize(10);
        doc.text(`${customer.address?.street || "N/A"}`, 20, yPos);
        yPos += 7;
        doc.text(`State: ${customer.address?.state || "N/A"}, City: ${customer.address?.city || "N/A"}`, 20, yPos);
        yPos += 7;
        doc.text(`Pin: ${customer.address?.pincode || "N/A"}`, 20, yPos);
        yPos += 15;

        doc.setFontSize(11);
        doc.text(`Dear Sir/Madam,`, 20, yPos);
        yPos += 8;

        doc.setFontSize(12);
        doc.text(`SUBJECT: Claim Settlement Advice (Claim ID: ${claim._id})`, 20, yPos);
        yPos += 12;

        doc.setFontSize(10);
        
        doc.text(`Patient Name: ${customer.name || "N/A"}`, 100, yPos);

        const age = calculateAge(customer.date_of_birth);
        doc.text(`Age: ${age !== "N/A" ? age : "N/A"}`, 170, yPos);
        yPos += 7;

        const policyNumber = customer.policies?.length > 0 ? customer.policies[0].policyId : "N/A";
        const policyValidity =
          customer.policies?.length > 0
            ? `${customer.policies[0].bought_date} - ${customer.policies[0].expiry_date}`
            : "N/A";

        doc.text(`Policy No.: ${policyNumber}`, 20, yPos);
        doc.text(`Policy Validity: ${policyValidity}`, 100, yPos);
        yPos += 7;

        doc.text(`Hospital Name: ${hospital.name || "N/A"}`, 20, yPos);
        yPos += 7;

        doc.text(`DOA: ${formatDate(claim.treatmentDetails?.dateOfAdmission)}`, 20, yPos);
        doc.text(`DOD: ${formatDate(claim.treatmentDetails?.dateOfDischarge)}`, 100, yPos);
        yPos += 7;

        doc.text(`Illness: ${claim.treatmentOffered || "N/A"}`, 20, yPos);
        doc.text(`Amount Claimed: ₹${claim.estimatedCostToHospital || "N/A"}`, 100, yPos);
        doc.text(`Amount Settled: ₹${payableAmount}`, 170, yPos);
        yPos += 15;

        doc.text(
          `As per the instructions of the insurer, the claim is settled for ₹${payableAmount} on account of ${
            claim.treatmentOffered || "N/A"
          }.`,
          20,
          yPos,
        );
        yPos += 10;

        autoTable(doc, {
          startY: yPos,
          head: [["Heads", "Bill Amount (Rs.)", "Deduction Amount (Rs.)", "Settled Amount (Rs.)"]],
          body: billRows.map((row) => [
            row.head,
            parseFloat(row.billAmount || 0).toFixed(2),
            parseFloat(row.deduction || 0).toFixed(2),
            parseFloat(row.settled || 0).toFixed(2),
          ]),
          theme: "grid",
          styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
          headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: "bold" },
          columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 40, halign: "right" }, 2: { cellWidth: 40, halign: "right" }, 3: { cellWidth: 40, halign: "right" } },
        });

        yPos = doc.lastAutoTable.finalY + 6;
        doc.text(`Total:`, 20, yPos);
        doc.text(`₹${totalBill.toFixed(2)}`, 70, yPos, { align: "right" });
        doc.text(`₹${totalDeduction.toFixed(2)}`, 110, yPos, { align: "right" });
        doc.text(`₹${totalSettled.toFixed(2)}`, 150, yPos, { align: "right" });
        yPos += 8;
        doc.text(`Co-pay: ₹${coPay.toFixed(2)}`, 20, yPos);
        yPos += 8;
        doc.text(`Discount: ₹${discount.toFixed(2)}`, 20, yPos);
        yPos += 8;
        doc.setFontSize(12);
        doc.text(`Payable Amount: ₹${payableAmount.toFixed(2)}`, 20, yPos);
        yPos += 12;

        if (insurerMessage) {
          doc.setFontSize(10);
          doc.text(`Insurer Message: ${insurerMessage}`, 20, yPos);
          yPos += 12;
        }

        doc.setFontSize(10);
        doc.text(
          `Sincerely yours,\nTEAM\nBobbili's Health Insurance Pvt. Ltd.\n[NB: This is a computer generated letter and no signature is required.]`,
          20,
          yPos,
        );

        pdfBase64 = doc.output("dataurlstring");
      }

      const updatePayload = {
        insurerStatus: "CLAIM_APPROVED",
        finalClaimSettlement: {
          insurerApprovedAmount: payableAmount,
          insurerFinalBill: pdfBase64,
          insurerMessage,
        },
        updatedAt: new Date().toISOString(),
      };

      await axios.put(`${API_ENDPOINT}/${endpoints.HospitalClaimsMicroservice}/claims/${claim._id}`, updatePayload);

      setBillSuccess(isClaimApproved ? "Approved claim details updated successfully!" : "Claim approved and bill generated!");
      setIsEditingApprovedDetails(false);
      setApprovedAmountDisplay(payableAmount);
      setGeneratedPdfBase64(pdfBase64);

      if (onClaimApproved) onClaimApproved();
      fetchClaimDetails();
    } catch (err) {
      console.error("Failed to approve claim and generate bill:", err);
      setBillError(`Failed to approve claim and generate bill: ${err.message || err.response?.statusText}`);
    } finally {
      setBillLoading(false);
    }
  };

  return (
    <Accordion sx={{ mt: 2, borderRadius: "8px" }} elevation={2}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight="bold">{isClaimApproved ? "Approved Claim Details" : "Approve & Generate Bill"}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {billLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 1 }}>Processing...</Typography>
          </Box>
        )}
        {billError && <Alert severity="error" sx={{ mb: 2 }}>{billError}</Alert>}
        {billSuccess && <Alert severity="success" sx={{ mb: 2 }}>{billSuccess}</Alert>}

        {isClaimApproved && !isEditingApprovedDetails ? (
          <Box>
            <Typography variant="body1" gutterBottom><strong>Approved Amount:</strong> ₹{approvedAmountDisplay.toFixed(2)}</Typography>
            {insurerMessage && <Typography variant="body2" gutterBottom><strong>Insurer Message:</strong> {insurerMessage}</Typography>}
            <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
              {generatedPdfBase64 && (
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleDownloadPdf(generatedPdfBase64, `Approved_Bill_${claim._id}.pdf`)}>
                  Download Approved Bill
                </Button>
              )}
              <Button variant="outlined" onClick={handleEditApprovedMessage} disabled={billLoading}>
                Edit Message
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Heads</TableCell>
                    <TableCell align="right">Bill Amount (Rs.)</TableCell>
                    <TableCell align="right">Deduction Amount (Rs.)</TableCell>
                    <TableCell align="right">Settled Amount (Rs.)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {billRows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <TextField
                          value={row.head}
                          onChange={(e) => handleBillRowChange(idx, "head", e.target.value)}
                          size="small"
                          fullWidth
                          disabled={billLoading}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={row.billAmount}
                          onChange={(e) => handleBillRowChange(idx, "billAmount", e.target.value)}
                          size="small"
                          fullWidth
                          disabled={billLoading}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={row.deduction}
                          onChange={(e) => handleBillRowChange(idx, "deduction", e.target.value)}
                          size="small"
                          fullWidth
                          disabled={billLoading}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={row.settled}
                          onChange={(e) => handleBillRowChange(idx, "settled", e.target.value)}
                          size="small"
                          fullWidth
                          disabled={billLoading}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddBillRow} sx={{ mt: 2, mb: 2 }} disabled={billLoading}>
              Add Row
            </Button>

            <TextField
              label="Insurer Message"
              fullWidth
              multiline
              rows={3}
              value={insurerMessage}
              onChange={(e) => setInsurerMessage(e.target.value)}
              sx={{ mt: 2, mb: 2 }}
              disabled={billLoading}
            />

            <Button
              variant="contained"
              color="success"
              startIcon={<SendIcon />}
              onClick={handleSubmitApproval}
              sx={{ mt: 2 }}
              disabled={billLoading || billRows.some((row) => !row.head || !row.billAmount || !row.settled)}
              fullWidth
            >
              {billLoading ? <CircularProgress size={24} color="inherit" /> : isClaimApproved ? "Update Message & Regenerate Bill" : "Approve & Generate Bill"}
            </Button>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default HospitalApproveAccordian;
