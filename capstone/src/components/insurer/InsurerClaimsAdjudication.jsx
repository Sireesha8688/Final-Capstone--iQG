// src/components/insurer/InsurerClaimsAdjudication.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import axios from "axios";
import { API_ENDPOINT, endpoints } from "../../api/API";
import InsurerHospitalClaimCard from "./InsurerHospitalClaimCard";

const InsurerClaimsAdjudication = ({ id }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_ENDPOINT}/${endpoints.HospitalClaimsMicroservice}/claims/insurer?InsurerId=${id}`
      );
      setClaims(res.data || []);
    } catch (err) {
      console.error("Error fetching hospital claims:", err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
       
        width: "100%",
        p: 2,
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      <Typography variant="h5" sx={{ mb: 2 }}>
        Claims Adjudication (Hospital Claims)
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : claims.length === 0 ? (
        <Typography>No hospital claims found.</Typography>
      ) : (
        claims.map((claim) => (
          <InsurerHospitalClaimCard 
            key={claim._id} 
            claim={claim} 
            refreshClaims={fetchClaims} 
          />
        ))
      )}
    </Box>
  );
};

export default InsurerClaimsAdjudication;
