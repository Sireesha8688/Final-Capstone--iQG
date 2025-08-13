// src/components/insurer/InsurerHospitalClaimCard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import HospitalClaimRaised from "./ClaimAdjudicationUtils/HospitalClaimRaised";
import HospitalQueryAccordian from "./ClaimAdjudicationUtils/HospitalQueryAccordian";
import HospitalDeniedAccordian from "./ClaimAdjudicationUtils/HospitalDeniedAccordian";
import HospitalApproveAccordian from "./ClaimAdjudicationUtils/HospitalApproveAccordian";
import { API_ENDPOINT, endpoints } from "../../api/API";

const STATUS_FLOW = {
  CLAIM_RAISED: "Claim Raised",
  CLAIM_ASSIGNED_FOR_QUERY: "Insurer Query Review",
  CLAIM_DENIED: "Denied",
  CLAIM_APPROVED: "Approved",
  CLAIM_RE_RAISE: "Re-Raised",
  CLAIM_SETTLED: "Settled",
};

const statusChipColor = (status) => {
  switch (status) {
    case STATUS_FLOW.CLAIM_APPROVED:
      return "success";
    case STATUS_FLOW.CLAIM_DENIED:
      return "error";
    case STATUS_FLOW.CLAIM_ASSIGNED_FOR_QUERY:
    case STATUS_FLOW.CLAIM_RE_RAISE:
      return "warning";
    case STATUS_FLOW.CLAIM_RAISED:
      return "info";
    case STATUS_FLOW.CLAIM_SETTLED:
      return "success";
    default:
      return "info";
  }
};

const InsurerHospitalClaimCard = ({ claim, refreshClaims }) => {
  const [status, setStatus] = useState(STATUS_FLOW[claim.insurerStatus] || STATUS_FLOW.CLAIM_RAISED);
  const [statusChange, setStatusChange] = useState(status);
  const [statusDisabled, setStatusDisabled] = useState(true);

  const [accordions, setAccordions] = useState({
    raised: false,
    query: false,
    denied: false,
    approved: false,
  });

  useEffect(() => {
    setStatusChange(status);
    setAccordions({
      raised: false,
      query: false,
      denied: false,
      approved: false,
    });

    switch (status) {
      case STATUS_FLOW.CLAIM_RAISED:
        setAccordions((a) => ({ ...a, raised: true }));
        break;
      case STATUS_FLOW.CLAIM_ASSIGNED_FOR_QUERY:
        setAccordions((a) => ({ ...a, query: true }));
        break;
      case STATUS_FLOW.CLAIM_DENIED:
      case STATUS_FLOW.CLAIM_RE_RAISE:
        setAccordions((a) => ({ ...a, denied: true }));
        break;
      case STATUS_FLOW.CLAIM_APPROVED:
      case STATUS_FLOW.CLAIM_SETTLED:
        setAccordions((a) => ({ ...a, approved: true }));
        break;
      default:
        break;
    }
  }, [status]);

  const handleSelectStatus = () => {
    setStatus(statusChange);
    setStatusDisabled(true);
  };

  const handleEditStatus = () => setStatusDisabled(false);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="h6" fontWeight="bold">Claim ID: {claim._id}</Typography>
          <Chip label={status} color={statusChipColor(status)} sx={{ fontWeight: "bold", fontSize: 16 }} />
        </Box>

        <Typography variant="body2" sx={{ mb: 0.5 }}>
          <strong>Hospital:</strong> {claim.hospitalName || claim.hospitalId || "N/A"} &nbsp;|&nbsp;
          <strong>Customer:</strong> {claim.customerName} &nbsp;|&nbsp;
          <strong>Aadhar:</strong> {claim.customerAadharNumber}
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          <strong>Treatment:</strong> {claim.treatmentOffered || "N/A"} &nbsp;|&nbsp;
          <strong>Estimated Cost:</strong> ₹{claim.estimatedCostToHospital}
        </Typography>

        <Typography variant="body2" sx={{ mb: 0.5 }}>
          <strong>Claim Type:</strong> {claim.claimTypeName || "Cashless"}
        </Typography>

        <Typography variant="body2" gutterBottom>
          Status:&nbsp;
          <Select
            value={statusChange}
            size="small"
            sx={{ minWidth: 180 }}
            disabled={statusDisabled}
            onChange={(e) => setStatusChange(e.target.value)}
          >
            {Object.values(STATUS_FLOW).map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
          <Button onClick={handleSelectStatus} disabled={statusDisabled} sx={{ ml: 1 }}>Select</Button>
          <Button onClick={handleEditStatus} disabled={!statusDisabled} sx={{ ml: 1 }}>Edit</Button>
        </Typography>

        <Divider sx={{ my: 2 }} />

        {accordions.raised && <HospitalClaimRaised claim={claim} />}
        {accordions.query && <HospitalQueryAccordian claim={claim} />}
        {accordions.denied && <HospitalDeniedAccordian claim={claim} onClaimDenied={refreshClaims} />}
        {accordions.approved && <HospitalApproveAccordian claim={claim} onClaimApproved={refreshClaims} />}
      </CardContent>
    </Card>
  );
};

export default InsurerHospitalClaimCard;
