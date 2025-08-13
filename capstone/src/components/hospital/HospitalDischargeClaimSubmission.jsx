// src/components/hospital/HospitalDischargeClaimSubmission.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import HospitalDischargeClaimCard from "./HospitalDischargeClaimCard";
import { API_ENDPOINT, endpoints } from "../../api/API";

const HospitalDischargeClaimSubmission = ({ id: hospitalId }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_ENDPOINT}/${endpoints.HospitalClaimsMicroservice}/claims/admitted?HospitalId=${hospitalId}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setClaims(data);
    } catch (err) {
      console.error("Error fetching claims for discharge:", err);
      setError("Failed to load admitted claims. Please try again.");
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  const handleClaimDischarged = (dischargedClaimId) => {
    setClaims((prevClaims) => prevClaims.filter((c) => c._id !== dischargedClaimId));
  };

  useEffect(() => {
    if (hospitalId) fetchClaims();
  }, [fetchClaims, hospitalId]);

  return (
    <Box sx={{ p: 4, maxWidth: "md", margin: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Discharge Claim Submission
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Submit final claim details for admitted patients (Hospital ID: {hospitalId})
      </Typography>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading admitted claims for discharge...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && claims.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No admitted patients awaiting discharge claim submission for this hospital.
        </Alert>
      )}

      {!loading && !error && claims.length > 0 && (
        <Box sx={{ mt: 3 }}>
          {claims.map((claim) => (
            <HospitalDischargeClaimCard
              key={claim._id}
              claim={claim}
              onClaimDischarged={handleClaimDischarged}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default HospitalDischargeClaimSubmission;
