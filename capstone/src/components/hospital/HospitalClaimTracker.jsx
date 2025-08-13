import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import HospitalClaimTrackerCard from "./HospitalClaimTrackerCard";
import { API_ENDPOINT, endpoints } from "../../api/API";

const HospitalClaimTracker = ({ id: hospitalId }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Function to fetch claims
  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${API_ENDPOINT}/${endpoints.HospitalClaimsMicroservice}/claims/track?HospitalId=${hospitalId}`
      );
      setClaims(response.data);
    } catch (err) {
      console.error("Error fetching claims for tracking:", err);
      setError("Failed to load claims for tracking. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  // Callback to refresh claims when something changes in a child card
  const handleClaimUpdate = useCallback(() => {
    fetchClaims(); // Re-fetch all claims to get latest statuses
  }, [fetchClaims]);

  // Fetch claims on component mount and when hospitalId changes
  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  return (
    <Box sx={{ p: 4, maxWidth: "md", margin: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Hospital Claim Tracker
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Track the status of claims for Hospital ID: {hospitalId}
      </Typography>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading claims...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && claims.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No claims currently in 'CLAIM_RAISED' status for this hospital.
        </Alert>
      )}

      {!loading && !error && claims.length > 0 && (
        <Box sx={{ mt: 3 }}>
          {claims.map((claim) => (
            <HospitalClaimTrackerCard
              key={claim._id}
              claim={claim}
              refreshClaims={handleClaimUpdate}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default HospitalClaimTracker;
