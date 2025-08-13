import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Typography,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";

const NOTIFICATION_API_BASE = "http://localhost:1000/api/patient/notifications";

const Notifications = ({ claimId, onReadChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch notifications for patientId = claimId
  const fetchNotifications = async () => {
    if (!claimId || claimId.trim() === "") {
      setError("No patient ID provided.");
      setNotifications([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${NOTIFICATION_API_BASE}/patient/${claimId}`);
      setNotifications(response.data || []);
    } catch (err) {
      setError("Failed to load notifications.");
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mark single notification as read
  const markAsRead = async (notification) => {
    if (notification.read) return; // Already read, skip
    try {
      await axios.put(`${NOTIFICATION_API_BASE}/${notification._id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, read: true, readAt: new Date().toISOString() } : n
        )
      );
      if (onReadChange) {
        onReadChange();
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      setError("Failed to mark notification as read.");
    }
  };

  // Mark all notifications as read for the patient
  const markAllAsRead = async () => {
    try {
      await axios.put(`${NOTIFICATION_API_BASE}/patient/${claimId}/readall`);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })));
      if (onReadChange) {
        onReadChange();
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      setError("Failed to mark all notifications as read.");
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optional: polling every 30 seconds
    // const interval = setInterval(fetchNotifications, 30000);
    // return () => clearInterval(interval);
  }, [claimId]);

  if (loading)
    return (
      <Box sx={{ pt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ pt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );

  if (!notifications.length)
    return (
      <Box sx={{ pt: 4, textAlign: "center", color: "text.secondary" }}>
        No notifications found.
      </Box>
    );

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" component="h2">
          Notifications
        </Typography>
        <Chip
          label="Mark All as Read"
          color="primary"
          variant="outlined"
          clickable
          onClick={markAllAsRead}
          sx={{ cursor: "pointer" }}
          size="small"
          aria-label="Mark all notifications as read"
        />
      </Box>

      <List sx={{ maxHeight: 500, overflowY: "auto" }}>
        {notifications.map((notification) => {
          const isRead = notification.read;

          return (
            <React.Fragment key={notification._id}>
              <ListItem
                component="button" // Fix React warning
                onClick={() => markAsRead(notification)}
                sx={{
                  bgcolor: isRead ? "grey.200" : "primary.light",
                  color: isRead ? "text.secondary" : "text.primary",
                  mb: 1,
                  borderRadius: 1,
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: isRead ? "grey.300" : "primary.light",
                  },
                }}
                aria-label={`${notification.title} notification`}
              >
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: isRead ? "normal" : "bold" }}>
                      {notification.title}
                    </Typography>
                  }
                  secondary={notification.message}
                />
                {!isRead && (
                  <Chip label="New" color="info" size="small" sx={{ ml: 2 }} />
                )}
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );
};

export default Notifications;
