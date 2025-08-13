import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Chip,
} from "@mui/material";

const API_BASE = "http://localhost:1000/api/patient/roomtransfers";

export default function RoomTransfer() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Fetch room transfers from API
  const fetchTransfers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to fetch transfers");
      const data = await res.json();
      setTransfers(data);
    } catch (err) {
      setError(err.message || "Error fetching transfers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  // Approve/Reject logic (backend will now handle bed status changes)
  const updateStatus = async (id, newStatus, transfer) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...transfer, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update transfer status");

      // Refresh the list after status update
      await fetchTransfers();

      // Show feedback
      setSnackbarMessage(
        newStatus.toLowerCase() === "approved"
          ? "Transfer Approved Successfully"
          : "Transfer Rejected"
      );
      setSnackbarSeverity(
        newStatus.toLowerCase() === "approved" ? "success" : "error"
      );
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage(err.message || "Update failed");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSnackbarClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const getChipColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "transfer":
        return "warning";
      default:
        return "default";
    }
  };

  // Loading
  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );

  // Error
  if (error)
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );

  // Filter transfers with status "Transfer"
  const filteredTransfers = transfers.filter(
    (t) => t.status?.toLowerCase() === "transfer"
  );

  if (!filteredTransfers.length)
    return (
      <Typography align="center" sx={{ mt: 4 }}>
        No room transfers with status "Transfer" found.
      </Typography>
    );

  return (
    <>
      <Grid container spacing={3} sx={{ p: 2 }}>
        {filteredTransfers.map((transfer) => (
          <Grid item xs={12} sm={6} key={transfer._id}>
            <Card sx={{ boxShadow: 3, height: "100%" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Transfer for: {transfer.patientName || "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Transfer ID: {transfer._id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  From Room ID: {transfer.fromRoomId} / Bed:{" "}
                  {transfer.fromBedId || "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  To Room ID: {transfer.toRoomId} / Bed:{" "}
                  {transfer.bedId || "N/A"}
                </Typography>

                {/* Status Chip */}
                <Box sx={{ mb: 1 }}>
                  <Typography component="span" variant="body2">
                    Status:{" "}
                  </Typography>
                  <Chip
                    label={transfer.status}
                    color={getChipColor(transfer.status)}
                    size="small"
                  />
                </Box>

                {/* Reason */}
                <Typography variant="body2" color="text.secondary">
                  Reason: {transfer.reason || "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Requested Date:{" "}
                  {new Date(transfer.requestedDate).toLocaleDateString()}
                </Typography>

                {/* Action buttons */}
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={
                      transfer.status?.toLowerCase() === "approved" ||
                      updatingId === transfer._id
                    }
                    onClick={() =>
                      updateStatus(transfer._id, "Approved", transfer)
                    }
                  >
                    {updatingId === transfer._id &&
                    transfer.status?.toLowerCase() !== "approved" ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Approve"
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={
                      transfer.status?.toLowerCase() === "rejected" ||
                      updatingId === transfer._id
                    }
                    onClick={() =>
                      updateStatus(transfer._id, "Rejected", transfer)
                    }
                  >
                    {updatingId === transfer._id &&
                    transfer.status?.toLowerCase() !== "rejected" ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Reject"
                    )}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
