import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Link,
} from '@mui/material';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const API_BASE_URL = 'http://localhost:1000/api';

// Steps and their icons for the status tracker
const steps = [
  { label: 'Requested', Icon: PendingIcon },
  { label: 'Approved', Icon: CheckCircleIcon },
  { label: 'Transfer Requested', Icon: SyncAltIcon },
  { label: 'Transfer Approved', Icon: CheckCircleIcon },
  { label: 'Discharged', Icon: LocalHospitalIcon },
];

// Map status string to step index
function getStepIndex(status) {
  if (!status) return 0;
  const s = status.toLowerCase();
  switch (s) {
    case 'requested':
      return 0;
    case 'approved':
    case 'pre_auth_approved':
      return 1;
    case 'transfer':
    case 'transfer requested':
      return 2;
    case 'transfer approved':
      return 3;
    case 'discharged':
      return 4;
    default:
      return 0;
  }
}

// Custom icon for stepper showing colors & scaling
const StepIconComponent = ({ active, completed, icon }) => {
  const index = icon - 1;
  const Icon = steps[index]?.Icon || PendingIcon;

  let color = '#b0b0b0'; // gray default
  if (completed) color = '#4caf50'; // green completed
  if (active) color = '#f44336'; // red active

  const style = {
    color,
    filter: active ? `drop-shadow(0 0 8px ${color})` : 'none',
    fontSize: active ? '2.4rem' : '1.8rem',
    transition: 'all 0.3s ease',
    transform: active ? 'scale(1.3)' : 'none',
  };

  return <Icon sx={style} />;
};

const TrackStatus = ({ claimId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [latestBooking, setLatestBooking] = useState(null);
  const [latestTransfer, setLatestTransfer] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);

  const [isDischarged, setIsDischarged] = useState(false);
  const [dischargeDate, setDischargeDate] = useState(null);
  const [dischargeSummaryUrl, setDischargeSummaryUrl] = useState(null);

  useEffect(() => {
    if (!claimId) {
      setError('No claim ID provided.');
      setLoading(false);
      return;
    }

    const fetchStatusData = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch latest booking & transfer status from patient microservice
        const statusResponse = await axios.get(
          `${API_BASE_URL}/patient/roombooking-transfer/status/${claimId}`
        );
        const { latestBooking, latestTransfer, currentStatus } = statusResponse.data;
        setLatestBooking(latestBooking);
        setLatestTransfer(latestTransfer);
        setCurrentStatus(currentStatus);

        // Fetch discharge status from hospital microservice
        try {
          const dischargeResponse = await axios.get(
            `${API_BASE_URL}/hospital/claims/${claimId}/discharge-status`
          );
          const { isDischarged, dateOfDischarge, dischargeSummaryUrl } = dischargeResponse.data;
          setIsDischarged(isDischarged);
          setDischargeDate(dateOfDischarge);
          setDischargeSummaryUrl(dischargeSummaryUrl || null);
        } catch (dischargeErr) {
          // If no discharge info or error, treat as not discharged
          console.warn('Discharge status fetch error:', dischargeErr);
          setIsDischarged(false);
          setDischargeDate(null);
          setDischargeSummaryUrl(null);
        }
      } catch (err) {
        console.error('TrackStatus fetch error:', err);
        setError('Failed to fetch patient status data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatusData();
  }, [claimId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto' }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (!latestBooking && !latestTransfer) {
    return (
      <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto' }}>
        <Typography>No booking or transfer data found for this patient/claim.</Typography>
      </Paper>
    );
  }

  // Determine current step, discharge status has highest priority
  let activeStep = 0;

  if (isDischarged) {
    activeStep = 4;
  } else if (latestTransfer?.status) {
    const transferStatus = latestTransfer.status.toLowerCase();
    if (transferStatus === 'transfer requested' || transferStatus === 'transfer') {
      activeStep = 2;
    } else if (transferStatus === 'transfer approved' || transferStatus === 'approved') {
      activeStep = 3;
    } else {
      activeStep = getStepIndex(currentStatus);
    }
  } else if (latestBooking?.status) {
    activeStep = latestBooking.status.toLowerCase() === 'approved' ? 1 : getStepIndex(latestBooking.status);
  } else {
    activeStep = getStepIndex(currentStatus);
  }

  const patientName = latestBooking?.patientName || latestTransfer?.patientName || 'Unknown Patient';

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <Paper sx={{ p: 5, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Patient Status Tracker
      </Typography>

      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        Patient Name: <strong>{patientName}</strong>
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map(({ label }) => (
          <Step key={label}>
            <StepLabel StepIconComponent={StepIconComponent}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Current Status: <strong>{isDischarged ? 'Discharged' : currentStatus || 'Requested'}</strong>
        </Typography>

        {(activeStep === 0 || activeStep === 1) && latestBooking && (
          <>
            <Typography>Booking Type: {latestBooking.BookingType || latestBooking.bookingType || 'N/A'}</Typography>
            <Typography>Requested Date: {formatDate(latestBooking.RequestedDate || latestBooking.requestedDate)}</Typography>
            <Typography>Status: {latestBooking.Status || latestBooking.status}</Typography>
          </>
        )}

        {(activeStep === 2 || activeStep === 3) && latestTransfer && (
          <>
            <Typography>
              Transfer requested on: {formatDate(latestTransfer.requestedDate || latestTransfer.RequestedDate)}
            </Typography>
            <Typography>Status: {latestTransfer.status}</Typography>
            <Typography>Reason: {latestTransfer.reason || '-'}</Typography>
          </>
        )}

        {activeStep === 4 && (
          <>
            <Typography>Patient has been discharged.</Typography>
            {dischargeSummaryUrl && (
              <Typography sx={{ mt: 1 }}>
                <Link
                  href={dischargeSummaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  color="primary"
                >
                  View Discharge Summary
                </Link>
              </Typography>
            )}
            <Typography sx={{ mt: 1 }}>
              Discharge Date: {formatDate(dischargeDate)}
            </Typography>
          </>
        )}

        {/* If discharged but step not active, show a note */}
        {activeStep !== 4 && isDischarged && (
          <Box sx={{ mt: 3, p: 2, bgcolor: '#e6f7ff', borderRadius: 1 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Note: Patient has been discharged. Please verify status.
            </Typography>
            {dischargeSummaryUrl && (
              <Typography>
                <Link
                  href={dischargeSummaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  color="primary"
                >
                  View Discharge Summary
                </Link>
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default TrackStatus;
