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
  Grid, // Added Grid for layout
  Chip, // Added Chip for status display
} from "@mui/material";

const API_BASE = "http://localhost:1000/api/patient/roombookings";
const UPDATE_BED_ROOM_STATUS_API =
  "http://localhost:1000/api/patient/rooms/updateBedAndRoomStatus";

export default function RoomBooking() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // 'success' or 'error'

  // Fetch bookings with "Requested" status
  const fetchBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();

      const requestedBookings = data.filter(
        (b) => b.status?.toLowerCase() === "requested"
      );

      setBookings(requestedBookings);
    } catch (err) {
      setError(err.message || "Error fetching bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Update booking status handler
  const updateStatus = async (id, newStatus, booking) => {
    setUpdatingId(id);
    try {
      // 1. Update booking status
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...booking, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update booking status");

      // 2. Determine bed status for bed and room update
      let bedStatus = null;
      if (newStatus.toLowerCase() === "approved") {
        bedStatus = "Occupied";
      } else if (newStatus.toLowerCase() === "rejected") {
        bedStatus = "Available";
      }

      if (bedStatus) {
        const updateRes = await fetch(UPDATE_BED_ROOM_STATUS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: booking.roomId,
            bedId: booking.bedId,
            newStatus: bedStatus,
          }),
        });
        if (!updateRes.ok) {
          throw new Error("Failed to update bed and room status");
        }
      }

      // 3. Refresh bookings list
      await fetchBookings();

      // 4. Show success snackbar
      setSnackbarMessage(
        newStatus.toLowerCase() === "approved"
          ? "Booking Approved Successfully"
          : "Booking Rejected"
      );
      setSnackbarSeverity(
        newStatus.toLowerCase() === "approved" ? "success" : "error"
      );
      setSnackbarOpen(true);
    } catch (err) {
      // Show error snackbar
      setSnackbarMessage(err.message || "Update failed");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setUpdatingId(null);
    }
  };

  // Snackbar close handler
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  // Helper function for Chip color
  const getChipColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "requested":
        return "warning"; // Use warning for requested status
      default:
        return "default";
    }
  };

  // Loading state UI
  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );

  // Fetch error UI
  if (error)
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );

  // No bookings found UI
  if (!bookings.length)
    return (
      <Typography align="center" sx={{ mt: 4 }}>
        No room bookings with status "Requested" found.
      </Typography>
    );

  return (
    <>
      <Grid container spacing={3} sx={{ p: 2 }}> {/* Added Grid container with spacing */}
        {bookings.map((booking) => (
          <Grid item xs={12} sm={6} key={booking._id}> {/* Two cards per row on small screens and up */}
            <Card sx={{ boxShadow: 3, height: '100%' }}> {/* Ensure cards take full height */}
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Booking for: {booking.patientName || "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Booking ID: {booking._id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Room Type: {booking.roomType}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Room ID: {booking.roomId}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Bed ID: {booking.bedId}
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography component="span" variant="body2">Status: </Typography>
                  <Chip
                    label={booking.status}
                    color={getChipColor(booking.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Booking Type: {booking.bookingType}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Requested Date:{" "}
                  {new Date(booking.requestedDate).toLocaleDateString()}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={updatingId === booking._id}
                    onClick={() => updateStatus(booking._id, "Approved", booking)}
                  >
                    {updatingId === booking._id &&
                    booking.status?.toLowerCase() !== "approved" ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Approve"
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={updatingId === booking._id}
                    onClick={() => updateStatus(booking._id, "Rejected", booking)}
                  >
                    {updatingId === booking._id &&
                    booking.status?.toLowerCase() !== "rejected" ? (
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

      {/* Snackbar for messages */}
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