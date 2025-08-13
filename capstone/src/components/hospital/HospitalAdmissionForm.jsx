// src/components/hospital/HospitalAdmissionForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { API_ENDPOINT, endpoints } from "../../api/API";

const HospitalAdmissionForm = ({ id: hospitalId }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [admittingClaimId, setAdmittingClaimId] = useState(null);
  const [admitError, setAdmitError] = useState("");
  const [admitSuccess, setAdmitSuccess] = useState("");

  const [openAdmitDialog, setOpenAdmitDialog] = useState(false);
  const [currentClaimToAdmit, setCurrentClaimToAdmit] = useState(null);
  const [admissionNotes, setAdmissionNotes] = useState("");
  const [dialogLoading, setDialogLoading] = useState(false);

  useEffect(() => {
    const fetchClaims = async () => {
      setLoading(true);
      setError("");
      try {
        if (!hospitalId) {
          setError("Hospital ID is missing.");
          setClaims([]);
          setLoading(false);
          return;
        }
        const response = await axios.get(
          `${API_ENDPOINT}/${endpoints.HospitalClaimsMicroservice}/claims/initiated?HospitalId=${hospitalId}`
        );
        const filteredClaims = response.data.filter(
          (claim) => claim.insurerStatus !== null
        );
        setClaims(filteredClaims);
      } catch (err) {
        console.error("Error fetching claims:", err);
        setError("Failed to load claims. Please try again.");
        setClaims([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [hospitalId]);

  const renderPreAuthDetail = (value, messageIfNull) =>
    value !== null && value !== undefined && value !== "" ? value : messageIfNull;

  const handleOpenAdmitDialog = (claim) => {
    setCurrentClaimToAdmit(claim);
    setAdmissionNotes("");
    setOpenAdmitDialog(true);
    setAdmitError("");
    setAdmitSuccess("");
  };

  const handleCloseAdmitDialog = () => {
    setOpenAdmitDialog(false);
    setCurrentClaimToAdmit(null);
    setAdmissionNotes("");
    setDialogLoading(false);
  };

  const handleConfirmAdmit = async () => {
    if (!currentClaimToAdmit) return;

    setDialogLoading(true);
    setAdmitError("");
    setAdmittingClaimId(currentClaimToAdmit._id);

    let newHospitalStatus;
    if (currentClaimToAdmit.insurerStatus === "PRE_AUTH_APPROVED") {
      newHospitalStatus = "ADMITTED";
    } else if (currentClaimToAdmit.insurerStatus === "PRE_AUTH_DENIED") {
      newHospitalStatus = "CASH_BASED_ADMISSION";
    } else {
      setAdmitError("Invalid insurer status for admission.");
      setDialogLoading(false);
      setAdmittingClaimId(null);
      return;
    }

    const existingTreatmentDetails = currentClaimToAdmit.treatmentDetails || {};

    const updatePayload = {
      hospitalStatus: newHospitalStatus,
      treatmentDetails: {
        ...existingTreatmentDetails,
        isAdmitted: true,
        dateOfAdmission: new Date().toISOString(),
        admissionNotes: admissionNotes,
      },
      updatedAt: new Date().toISOString(),
    };

    try {
      await axios.put(
        `${API_ENDPOINT}/${endpoints.HospitalClaimsMicroservice}/claims/${currentClaimToAdmit._id}`,
        updatePayload
      );
      setAdmitSuccess(
        `Patient admitted successfully (Claim ID: ${currentClaimToAdmit._id})!`
      );
      setClaims((prev) =>
        prev.filter((claim) => claim._id !== currentClaimToAdmit._id)
      );
      handleCloseAdmitDialog();
    } catch (err) {
      console.error("Error admitting patient:", err);
      setAdmitError(
        `Failed to admit patient (Claim ID: ${currentClaimToAdmit._id}). Please try again.`
      );
    } finally {
      setDialogLoading(false);
      setAdmittingClaimId(null);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: "lg", margin: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Customer Admission Form
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        List of pre-authorized requests for Hospital ID: {hospitalId}
      </Typography>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading pending admissions...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {admitSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {admitSuccess}
        </Alert>
      )}

      {admitError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {admitError}
        </Alert>
      )}

      {!loading && !error && claims.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No pending admission requests for this hospital.
        </Alert>
      )}

      {!loading && !error && claims.length > 0 && (
        <TableContainer component={Paper} elevation={3} sx={{ mt: 3 }}>
          <Table stickyHeader aria-label="pending admissions table">
            <TableHead>
              <TableRow>
                <TableCell>S.No.</TableCell>
                <TableCell>Customer Name</TableCell>
                <TableCell>Aadhar Number</TableCell>
                <TableCell>Treatment</TableCell>
                <TableCell>Estimated Cost</TableCell>
                <TableCell>Insurer Status</TableCell>
                <TableCell>Approved Amount</TableCell>
                <TableCell>Insurer Comments</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {claims.map((claim, index) => (
                <TableRow key={claim._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{claim.customerName}</TableCell>
                  <TableCell>{claim.customerAadharNumber}</TableCell>
                  <TableCell>{claim.treatmentOffered}</TableCell>
                  <TableCell>₹{claim.estimatedCostToHospital.toFixed(2)}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={
                        claim.insurerStatus === "PRE_AUTH_APPROVED"
                          ? "success.main"
                          : "error.main"
                      }
                      fontWeight="bold"
                    >
                      {claim.insurerStatus.replace(/_/g, " ")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {renderPreAuthDetail(
                      claim.preAuthorization?.approvedAmount,
                      "N/A (Denied)"
                    )}
                  </TableCell>
                  <TableCell>
                    {renderPreAuthDetail(
                      claim.preAuthorization?.insurerComments,
                      "No specific comments"
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {(claim.insurerStatus === "PRE_AUTH_APPROVED" ||
                      claim.insurerStatus === "PRE_AUTH_DENIED") && (
                      <Button
                        variant="contained"
                        color={
                          claim.insurerStatus === "PRE_AUTH_APPROVED"
                            ? "primary"
                            : "warning"
                        }
                        onClick={() => handleOpenAdmitDialog(claim)}
                        disabled={admittingClaimId === claim._id}
                        startIcon={
                          admittingClaimId === claim._id ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : claim.insurerStatus === "PRE_AUTH_APPROVED" ? (
                            <LocalHospitalIcon />
                          ) : (
                            <AttachMoneyIcon />
                          )
                        }
                      >
                        {claim.insurerStatus === "PRE_AUTH_APPROVED"
                          ? "Admit Patient"
                          : "Cash-based Admit"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={openAdmitDialog}
        onClose={handleCloseAdmitDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Admit Patient: {currentClaimToAdmit?.customerName} (Claim ID:{" "}
          {currentClaimToAdmit?._id})
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Insurer Status:{" "}
            <Typography
              component="span"
              fontWeight="bold"
              color={
                currentClaimToAdmit?.insurerStatus === "PRE_AUTH_APPROVED"
                  ? "success.main"
                  : "error.main"
              }
            >
              {currentClaimToAdmit?.insurerStatus?.replace(/_/g, " ")}
            </Typography>
            <br />
            Estimated Cost: ₹
            {currentClaimToAdmit?.estimatedCostToHospital?.toFixed(2)}
            {currentClaimToAdmit?.preAuthorization?.approvedAmount !== null && (
              <>
                <br />
                Approved Amount: ₹
                {currentClaimToAdmit?.preAuthorization?.approvedAmount.toFixed(2)}
              </>
            )}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="admission-notes"
            label="Admission Notes (Optional)"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={admissionNotes}
            onChange={(e) => setAdmissionNotes(e.target.value)}
          />
          {admitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {admitError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdmitDialog} disabled={dialogLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAdmit}
            color="primary"
            variant="contained"
            disabled={dialogLoading}
            startIcon={
              dialogLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <LocalHospitalIcon />
              )
            }
          >
            Confirm Admission
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HospitalAdmissionForm;
