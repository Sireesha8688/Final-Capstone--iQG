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
  TextField,
  IconButton,
  Paper,
  Grid,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const API_BASE = "http://localhost:1000/api/patient/rooms";

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [processingBedId, setProcessingBedId] = useState(null);

  const [addingRoom, setAddingRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    type: "",
    status: "Available",
    floor: "",
    image: "",
    feature: "",
    description: "", // Added description field to state
    price: "",
    beds: [],
  });
  const [formError, setFormError] = useState("");

  const fetchRooms = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      setError(err.message || "Error fetching rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const markBedAvailable = async (roomId, bedId) => {
    setProcessingBedId(bedId);
    try {
      const res = await fetch(`${API_BASE}/updateBedAndRoomStatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, bedId, newStatus: "Available" }),
      });
      if (!res.ok) throw new Error("Failed to update bed status");

      setSnackbarMessage(`Bed ${bedId} marked as Available`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      await fetchRooms();
    } catch (err) {
      setSnackbarMessage(err.message || "Failed to update bed status");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setProcessingBedId(null);
    }
  };

  const deleteBed = async (roomId, bedId) => {
    if (!window.confirm(`Are you sure you want to delete bed ${bedId}?`)) return;

    setProcessingBedId(bedId);
    try {
      const roomResponse = await fetch(`${API_BASE}/${roomId}`);
      if (!roomResponse.ok) throw new Error("Failed to load room details");
      const room = await roomResponse.json();

      const updatedBeds = (room.beds || []).filter((bed) => bed.bedId !== bedId);

      const updatedRoom = { ...room, beds: updatedBeds };

      const updateResponse = await fetch(`${API_BASE}/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRoom),
      });
      if (!updateResponse.ok) throw new Error("Failed to delete bed");

      setSnackbarMessage(`Bed ${bedId} deleted successfully`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      await fetchRooms();
    } catch (err) {
      setSnackbarMessage(err.message || "Failed to delete bed");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setProcessingBedId(null);
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this entire room?")) return;

    try {
      const res = await fetch(`${API_BASE}/${roomId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete room");

      setSnackbarMessage("Room deleted successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      await fetchRooms();
    } catch (err) {
      setSnackbarMessage(err.message || "Failed to delete room");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleNewRoomChange = (field, value) => {
    setNewRoom((prev) => ({ ...prev, [field]: value }));
  };

  const handleBedChange = (index, value) => {
    setNewRoom((prev) => {
      const updatedBeds = [...prev.beds];
      updatedBeds[index].bedId = value;
      return { ...prev, beds: updatedBeds };
    });
  };

  const addBed = () => {
    setNewRoom((prev) => ({
      ...prev,
      beds: [...prev.beds, { bedId: "", status: "Available" }],
    }));
  };

  const removeBed = (index) => {
    setNewRoom((prev) => {
      const updatedBeds = [...prev.beds];
      updatedBeds.splice(index, 1);
      return { ...prev, beds: updatedBeds };
    });
  };

  const submitNewRoom = async (e) => {
    e.preventDefault();

    if (!newRoom.type.trim()) {
      setFormError("Room type is required.");
      return;
    }
    if (!newRoom.floor.toString().trim()) {
      setFormError("Floor is required.");
      return;
    }
    if (!newRoom.price.toString().trim()) {
      setFormError("Price is required.");
      return;
    }
    if (!newRoom.image.trim()) {
      setFormError("Image URL is required.");
      return;
    }
    if (!newRoom.feature.trim()) {
      setFormError("Feature is required.");
      return;
    }
    if (!newRoom.description.trim()) { // New validation for description
      setFormError("Description is required.");
      return;
    }

    if (newRoom.beds.length === 0) {
      setFormError("At least one bed is required.");
      return;
    }
    for (let i = 0; i < newRoom.beds.length; i++) {
      if (!newRoom.beds[i].bedId.trim()) {
        setFormError(`Bed ID #${i + 1} is required.`);
        return;
      }
    }

    setFormError("");
    try {
      const payload = {
        type: newRoom.type.trim(),
        status: "Available",
        floor: parseInt(newRoom.floor, 10),
        image: newRoom.image.trim(),
        feature: newRoom.feature.trim(),
        description: newRoom.description.trim(), // Added description to payload
        price: parseFloat(newRoom.price),
        beds: newRoom.beds.map((bed) => ({
          bedId: bed.bedId.trim(),
          status: "Available",
        })),
      };

      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create room");

      setSnackbarMessage("Room added successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      setNewRoom({
        type: "",
        status: "Available",
        floor: "",
        image: "",
        feature: "",
        description: "", // Reset description field
        price: "",
        beds: [],
      });
      setAddingRoom(false);

      await fetchRooms();
    } catch (err) {
      setSnackbarMessage(err.message || "Failed to add room");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const getChipColor = (status) => {
    switch (status?.toLowerCase()) {
      case "occupied":
        return "error";
      case "available":
        return "success";
      case "requested":
        return "primary";
      case "maintenance":
        return "info";
      default:
        return "default";
    }
  };

  const roomsWithOccupiedBeds = rooms.filter(room =>
    room.beds && room.beds.some(bed => bed.status?.toLowerCase() === "occupied")
  );

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );

  if (!roomsWithOccupiedBeds.length && !addingRoom)
    return (
      <>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Button variant="contained" onClick={() => setAddingRoom(true)} startIcon={<AddIcon />}>
            Add Room
          </Button>
        </Box>
        <Typography align="center" sx={{ mt: 4 }}>
          No rooms with occupied beds found.
        </Typography>
      </>
    );

  return (
    <>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        {!addingRoom ? (
          <Button variant="contained" onClick={() => setAddingRoom(true)} startIcon={<AddIcon />}>
            Add Room
          </Button>
        ) : (
          <Paper elevation={2} sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
            <Typography variant="h6" gutterBottom>
              Add New Room
            </Typography>
            <form onSubmit={submitNewRoom} noValidate>
              <Stack spacing={2}>
                <TextField
                  label="Room Type"
                  value={newRoom.type}
                  onChange={(e) => handleNewRoomChange("type", e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Floor"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={newRoom.floor}
                  onChange={(e) => handleNewRoomChange("floor", e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Price per day"
                  type="number"
                  inputProps={{ min: 0, step: "0.01" }}
                  value={newRoom.price}
                  onChange={(e) => handleNewRoomChange("price", e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Image URL"
                  value={newRoom.image}
                  onChange={(e) => handleNewRoomChange("image", e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Feature"
                  value={newRoom.feature}
                  onChange={(e) => handleNewRoomChange("feature", e.target.value)}
                  required
                  fullWidth
                />
                <TextField // Added description TextField
                  label="Description"
                  value={newRoom.description}
                  onChange={(e) => handleNewRoomChange("description", e.target.value)}
                  required
                  fullWidth
                  multiline // Allow multiple lines for description
                  rows={3} // Set initial number of rows
                />

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Beds
                  </Typography>

                  {newRoom.beds.map((bed, index) => (
                    <Stack key={index} direction="row" spacing={1} alignItems="center" mb={1}>
                      <TextField
                        label={`Bed ID #${index + 1}`}
                        value={bed.bedId}
                        onChange={(e) => handleBedChange(index, e.target.value)}
                        required
                        fullWidth
                      />
                      <IconButton
                        color="error"
                        aria-label="remove bed"
                        onClick={() => removeBed(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  ))}

                  <Button variant="outlined" startIcon={<AddIcon />} onClick={addBed}>
                    Add Bed
                  </Button>
                </Box>

                {formError && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {formError}
                  </Alert>
                )}

                <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
                  <Button onClick={() => setNewRoom({ // Reset newRoom state on Cancel
                    type: "",
                    status: "Available",
                    floor: "",
                    image: "",
                    feature: "",
                    description: "",
                    price: "",
                    beds: [],
                  })} variant="outlined">
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" color="primary">
                    Save Room
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Paper>
        )}
      </Box>

      <Grid container spacing={3} columnSpacing={14} sx={{ p: 2, }}>
        {roomsWithOccupiedBeds.map((room) => {
          const occupiedBedsInRoom = (room.beds || []).filter(
            (bed) => bed.status?.toLowerCase() === "occupied"
          );

          if (occupiedBedsInRoom.length === 0) return null;

          return (
            <Grid item xs={12} sm={6} md={6} lg={6} key={room._id}>
              <Card
                sx={{
                  boxShadow: 3,
                  position: "relative",
                  pt: 1,
                  pb: 1,
                  pl: 1,
                  pr: 1,
                  minHeight: 250,
                  display: "flex",
                  flexDirection: "column",
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 1, "&:last-child": { pb: 1 }, flexGrow: 1 }}>
                  <Typography variant="subtitle2" component="div" sx={{ mb: 0.5 }}>
                    Room ID: {room._id}{" "}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Type: {room.type} - Floor: {room.floor}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Features: {room.feature || "N/A"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Price: ₹{room.price ? room.price.toFixed(2) : "N/A"}
                  </Typography>

                  {room.status && (
                    <Chip
                      label={`Room Status: ${room.status}`}
                      color={getChipColor(room.status)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  )}

                  {occupiedBedsInRoom.length > 0 && (
                    <Box sx={{ mt: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                        Occupied Beds:
                      </Typography>
                      <Stack spacing={1}>
                        {occupiedBedsInRoom.map((bed) => {
                          const isProcessing = processingBedId === bed.bedId;
                          return (
                            <Box
                              key={bed.bedId}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                p: 1,
                                border: "1px solid #ddd",
                                borderRadius: 1,
                                bgcolor: '#fde0dc',
                              }}
                            >
                              <Typography variant="body2">
                                Bed {bed.bedId}:
                              </Typography>
                              <Chip
                                label={bed.status}
                                color={getChipColor(bed.status)}
                                size="small"
                                sx={{ ml: 1 }}
                              />
                              <Box sx={{ ml: "auto" }}>
                                <Button
                                  variant="outlined"
                                  color="success"
                                  size="small"
                                  sx={{ minWidth: 'unset', px: 0.8, py: 0.2 }}
                                  disabled={isProcessing}
                                  onClick={() => markBedAvailable(room._id, bed.bedId)}
                                >
                                  {isProcessing ? (
                                    <CircularProgress size={12} />
                                  ) : (
                                    "MARK AVAILABLE"
                                  )}
                                </Button>
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

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