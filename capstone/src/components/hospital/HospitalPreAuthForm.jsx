import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Grid,
  Alert,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Slide,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import SendIcon from "@mui/icons-material/Send";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import { API_ENDPOINT, endpoints } from "../../api/API";

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const HospitalPreAuthForm = ({ id: hospitalId }) => {
  const [aadharInput, setAadharInput] = useState("");
  const [customer, setCustomer] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [errorCustomer, setErrorCustomer] = useState("");

  const [treatmentOffered, setTreatmentOffered] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [errorPolicies, setErrorPolicies] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const formEnabled = !!customer;

  // This useEffect fetches detailed policies info when customer changes
  useEffect(() => {
    const fetchPolicies = async () => {
      if (
        !customer ||
        !Array.isArray(customer.policies) ||
        customer.policies.length === 0
      ) {
        setPolicies([]);
        return;
      }
      setLoadingPolicies(true);
      setErrorPolicies("");
      try {
        const details = await Promise.all(
          customer.policies.map(async (p) => {
            // Fetch full policy details from admin microservice
            const res = await axios.get(
              `${API_ENDPOINT}/admin/policies/${p.policyId}`
            );
            return {
              policyId: p.policyId,
              bought_date: p.bought_date,
              expiry_date: p.expiry_date,
              name: res.data.name || "--",
            };
          })
        );
        setPolicies(details);
      } catch {
        setErrorPolicies("Failed to fetch policy details.");
        setPolicies([]);
      } finally {
        setLoadingPolicies(false);
      }
    };

    fetchPolicies();
  }, [customer]);

  const handleSearchCustomer = async () => {
    if (!aadharInput || aadharInput.length !== 12) {
      setErrorCustomer("Enter a valid 12-digit Aadhaar number.");
      return;
    }
    setLoadingCustomer(true);
    setErrorCustomer("");
    setCustomer(null);
    setPolicies([]);
    setSubmitSuccess("");
    setSubmitError("");
    try {
      const res = await axios.get(
        `${API_ENDPOINT}/${endpoints.InusrerManageUsersManage}/customer?AadharNumber=${aadharInput}`
      );
      if (res.data) {
        setCustomer(res.data);
      } else {
        setErrorCustomer("Customer not found for this Aadhaar number.");
      }
    } catch {
      setErrorCustomer("Error fetching customer. Try again.");
    } finally {
      setLoadingCustomer(false);
    }
  };

  const handleClear = () => {
    setAadharInput("");
    setCustomer(null);
    setErrorCustomer("");
    setPolicies([]);
    setSubmitSuccess("");
    setSubmitError("");
    setTreatmentOffered("");
    setEstimatedCost("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customer) {
      setSubmitError("Please search and select customer first.");
      return;
    }
    if (!treatmentOffered || !estimatedCost) {
      setSubmitError("Please fill all required fields.");
      return;
    }

    setSubmitLoading(true);
    setSubmitError("");
    setSubmitSuccess("");

    const newClaim = {
      hospitalId,
      customerName: customer.name,
      customerAadharNumber: customer.aadharCardNumber,
      customerId: customer._id,
      treatmentOffered,
      estimatedCostToHospital: parseFloat(estimatedCost),
      hospitalStatus: "PRE_AUTH_INITIATED",
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await axios.post(
        `${API_ENDPOINT}/${endpoints.HospitalClaimsMicroservice}/claims`,
        newClaim
      );
      setSubmitSuccess(
        `Pre-Authorization submitted successfully! Claim ID: ${
          response.data.id || ""
        }`
      );
      setSnackbarOpen(true);
      handleClear();
    } catch {
      setSubmitError("Failed to submit. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: "#283593" }}>
        Raise Pre-Authorization Request
      </Typography>

      {/* Customer Search Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Customer Search
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            alignItems: { sm: "center" },
            mb: 2,
          }}
        >
          <TextField
            label="Customer Aadhaar Number"
            variant="outlined"
            fullWidth
            value={aadharInput}
            onChange={(e) => setAadharInput(e.target.value.trim())}
            disabled={loadingCustomer || customer !== null}
            inputProps={{ maxLength: 12, pattern: "\\d{12}" }}
          />
          <Button
            variant="contained"
            size="large"
            onClick={handleSearchCustomer}
            disabled={loadingCustomer || customer !== null || aadharInput.length !== 12}
            startIcon={
              loadingCustomer ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SearchIcon />
              )
            }
            sx={{ minWidth: 120 }}
          >
            Search
          </Button>
          {customer && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleClear}
              startIcon={<ClearIcon />}
              sx={{ minWidth: 100 }}
            >
              Clear
            </Button>
          )}
        </Box>
        {errorCustomer && <Alert severity="error">{errorCustomer}</Alert>}
        {customer && <Alert severity="success">Customer found. Details loaded below.</Alert>}
      </Paper>

      {/* Customer Details and Policies */}
      {customer && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Customer Details
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <TextField label="Name" value={customer.name || ""} fullWidth disabled variant="filled" />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField label="Gender" value={customer.gender || ""} fullWidth disabled variant="filled" />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField label="Blood Group" value={customer.blood_group || ""} fullWidth disabled variant="filled" />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Policies Bought
          </Typography>

          {loadingPolicies ? (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <CircularProgress size={28} /> Loading policies...
            </Box>
          ) : errorPolicies ? (
            <Alert severity="error">{errorPolicies}</Alert>
          ) : policies.length === 0 ? (
            <Typography>No policies found.</Typography>
          ) : (
            <Table size="small" sx={{ backgroundColor: "#f5f7fa" }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <AssignmentIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Policy Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Policy ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Bought Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Expiry Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {policies.map((p, idx) => (
                  <TableRow key={p.policyId}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.policyId}</TableCell>
                    <TableCell>{new Date(p.bought_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(p.expiry_date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {/* Claim Details Form */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Claim Details
        </Typography>

        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Treatment Offered"
                variant="outlined"
                fullWidth
                required
                value={treatmentOffered}
                onChange={(e) => setTreatmentOffered(e.target.value)}
                disabled={!formEnabled}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Estimated Cost"
                variant="outlined"
                fullWidth
                type="number"
                required
                inputProps={{ min: 0 }}
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                disabled={!formEnabled}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                color="primary"
                disabled={!formEnabled || submitLoading || !treatmentOffered || !estimatedCost}
                startIcon={submitLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              >
                Submit Pre-Authorization Request
              </Button>
            </Grid>
          </Grid>
        </form>

        {submitError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submitError}
          </Alert>
        )}
        {submitSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {submitSuccess}
          </Alert>
        )}
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        TransitionComponent={SlideTransition}
        sx={{ maxWidth: 360 }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          icon={<CheckCircleIcon fontSize="inherit" />}
          sx={{ width: "100%", fontWeight: 600, px: 2, py: 1.5 }}
          elevation={6}
          variant="filled"
        >
          {submitSuccess || "Pre-Authorization submitted successfully!"}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HospitalPreAuthForm;
