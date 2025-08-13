import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import axios from "axios";
import { API_ENDPOINT, endpoints } from "../../api/API";

const InsurerPreAuthClaims = ({ id }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [insurerComments, setInsurerComments] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [approveDialog, setApproveDialog] = useState(false);
  const [denyDialog, setDenyDialog] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState(null);

  // States for policies dialog
  const [policiesDialogOpen, setPoliciesDialogOpen] = useState(false);
  const [selectedAadhaar, setSelectedAadhaar] = useState(null);
  const [policiesForAadhaar, setPoliciesForAadhaar] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [errorPolicies, setErrorPolicies] = useState("");

  // Fetch hospital name for a given hospitalId
  const fetchHospitalName = async (hospitalId) => {
    try {
      const res = await axios.get(
        `${API_ENDPOINT}/${endpoints.InusrerManageUsersManage}/hospital`,
        { params: { id: hospitalId } }
      );
      return res.data?.name || "Unknown Hospital";
    } catch (error) {
      console.error("Error fetching hospital name:", error);
      return "Unknown Hospital";
    }
  };

  // Fetch all claims and enrich with hospitalName
  const fetchAllClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_ENDPOINT}/${endpoints.HospitalClaimsMicroservice}/claims/no-insurer`
      );
      const claimsData = res.data || [];

      // Fetch hospital names for each claim in parallel
      const claimsWithHospitalName = await Promise.all(
        claimsData.map(async (claim) => {
          if (claim.hospitalId) {
            const hospitalName = await fetchHospitalName(claim.hospitalId);
            return { ...claim, hospitalName };
          }
          return { ...claim, hospitalName: "Unknown Hospital" };
        })
      );

      setClaims(claimsWithHospitalName);
    } catch (error) {
      console.error("Error fetching claims:", error);
      setClaims([]);
      alert("Failed to load claims. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllClaims();
  }, [fetchAllClaims]);

  const handleApproveDialogState = (claimId = null) => {
    setApproveDialog((prev) => !prev);
    setSelectedClaimId(claimId);
    if (!approveDialog) {
      setInsurerComments("");
      setApprovedAmount("");
    }
  };

  const handleDenyDialogState = (claimId = null) => {
    setDenyDialog((prev) => !prev);
    setSelectedClaimId(claimId);
    if (!denyDialog) {
      setInsurerComments("");
    }
  };

  const handleAddInsurer = async (claimId) => {
    try {
      await axios.put(
        `${API_ENDPOINT}/${endpoints.HospitalClaimsMicroservice}/claims/${claimId}`,
        {
          insurerId: id,
          insurerStatus: "PRE_AUTH_APPROVED",
          preAuthorization: {
            responseDateTime: new Date().toISOString(),
            approvedAmount: approvedAmount,
            insurerComments:
              insurerComments || "Pre-Authorization approved by insurer.",
          },
          updatedAt: new Date().toISOString(),
        }
      );
      await fetchAllClaims();
      setApproveDialog(false);
      alert("Pre-Authorization approved successfully!");
    } catch (error) {
      console.error("Error approving pre-auth:", error);
      alert("Failed to approve claim.");
    }
  };

  const handleDenyPreAuth = async (claimId) => {
    try {
      await axios.put(
        `${API_ENDPOINT}/${endpoints.HospitalClaimsMicroservice}/claims/${claimId}`,
        {
          insurerId: id,
          insurerStatus: "PRE_AUTH_DENIED",
          preAuthorization: {
            responseDateTime: new Date().toISOString(),
            insurerComments:
              insurerComments || "Pre-Authorization denied by insurer.",
          },
          updatedAt: new Date().toISOString(),
        }
      );
      await fetchAllClaims();
      setDenyDialog(false);
      alert("Pre-Authorization denied successfully!");
    } catch (error) {
      console.error("Error denying pre-auth:", error);
      alert("Failed to deny claim.");
    }
  };

  // Fetch and show policies when Aadhaar clicked
  const handleAadhaarClick = async (aadhaarNumber) => {
    setSelectedAadhaar(aadhaarNumber);
    setPoliciesDialogOpen(true);
    setLoadingPolicies(true);
    setErrorPolicies("");
    setPoliciesForAadhaar([]);

    try {
      // Step 1: Get customer by Aadhaar number (insurer microservice)
      const customerRes = await axios.get(
        `${API_ENDPOINT}/${endpoints.InusrerManageUsersManage}/customer?AadharNumber=${aadhaarNumber}`
      );
      const customerData = customerRes.data;

      if (!customerData || !customerData.policies?.length) {
        setPoliciesForAadhaar([]);
        setErrorPolicies("No policies found for this Aadhaar number.");
        return;
      }

      // Step 2: For each policyId, get full policy details from admin microservice
      const detailedPolicies = await Promise.all(
        customerData.policies.map(async (p) => {
          try {
            const policyRes = await axios.get(
              `${API_ENDPOINT}/admin/policies/${p.policyId}`
            );
            return {
              policyId: p.policyId,
              bought_date: p.bought_date,
              expiry_date: p.expiry_date,
              name: policyRes.data.name || "--",
            };
          } catch {
            return {
              policyId: p.policyId,
              bought_date: p.bought_date,
              expiry_date: p.expiry_date,
              name: "--",
            };
          }
        })
      );

      setPoliciesForAadhaar(detailedPolicies);
    } catch {
      setErrorPolicies("Failed to fetch policies for this Aadhaar number.");
      setPoliciesForAadhaar([]);
    } finally {
      setLoadingPolicies(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        height: "100vh",
        width: "100%",
        p: 2,
        boxSizing: "border-box",
        overflowY: "auto",
        alignItems: "center",
      }}
    >
      <TableContainer component={Paper} sx={{ maxWidth: 1000 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Hospital Name</TableCell>
              <TableCell>Customer Aadhaar</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell>Treatment Offered</TableCell>
              <TableCell>Estimated Cost</TableCell>
              <TableCell>Date of Claim</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No claims found.
                </TableCell>
              </TableRow>
            ) : (
              claims.map((claim) => (
                <TableRow hover key={claim._id}>
                  <TableCell>{claim.hospitalName || "N/A"}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleAadhaarClick(claim.customerAadharNumber)}
                      variant="text"
                      size="small"
                    >
                      {claim.customerAadharNumber}
                    </Button>
                  </TableCell>
                  <TableCell>{claim.customerName}</TableCell>
                  <TableCell>{claim.treatmentOffered}</TableCell>
                  <TableCell>₹{claim.estimatedCostToHospital}</TableCell>
                  <TableCell>{new Date(claim.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleApproveDialogState(claim._id)}
                      sx={{ mr: 1 }}
                    >
                      Approve & Add
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDenyDialogState(claim._id)}
                    >
                      Deny
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Approve Dialog */}
      <Dialog
        open={approveDialog && selectedClaimId !== null}
        onClose={() => handleApproveDialogState()}
      >
        <DialogTitle>Approve Claim</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Insurer Comments"
            type="text"
            fullWidth
            variant="standard"
            value={insurerComments}
            onChange={(e) => setInsurerComments(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Approved Amount"
            type="number"
            fullWidth
            variant="standard"
            value={approvedAmount}
            onChange={(e) => setApprovedAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleApproveDialogState()}>Cancel</Button>
          <Button
            onClick={() => handleAddInsurer(selectedClaimId)}
            variant="contained"
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog
        open={denyDialog && selectedClaimId !== null}
        onClose={() => handleDenyDialogState()}
      >
        <DialogTitle>Deny Claim</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Insurer Comments"
            type="text"
            fullWidth
            variant="standard"
            value={insurerComments}
            onChange={(e) => setInsurerComments(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDenyDialogState()}>Cancel</Button>
          <Button
            onClick={() => handleDenyPreAuth(selectedClaimId)}
            variant="contained"
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Policies Dialog */}
      <Dialog
        open={policiesDialogOpen}
        onClose={() => setPoliciesDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Policies for Aadhaar: {selectedAadhaar}</DialogTitle>
        <DialogContent dividers>
          {loadingPolicies ? (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <CircularProgress size={32} />
            </Box>
          ) : errorPolicies ? (
            <Typography color="error">{errorPolicies}</Typography>
          ) : policiesForAadhaar.length === 0 ? (
            <Typography>No policies found.</Typography>
          ) : (
            <Stack spacing={2}>
              {policiesForAadhaar.map((policy) => (
                <Card key={policy.policyId} variant="outlined">
                  <CardContent>
                    <Typography variant="h6">{policy.name}</Typography>
                    <Typography>Policy ID: {policy.policyId}</Typography>
                    <Typography>
                      Bought Date: {new Date(policy.bought_date).toLocaleDateString()}
                    </Typography>
                    <Typography>
                      Expiry Date: {new Date(policy.expiry_date).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPoliciesDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InsurerPreAuthClaims;
