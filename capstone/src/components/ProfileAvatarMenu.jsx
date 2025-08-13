import React, { useState, useRef, useEffect } from "react";
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import axios from "axios";

function ProfileAvatarMenu({ user, role, onProfileUpdate, onLogout }) {
  const fileInputRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const [preview, setPreview] = useState(user.profilepic || user.avatar || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, severity: "info", message: "" });

  useEffect(() => {
    setPreview(user.profilepic || user.avatar || "");
  }, [user.profilepic, user.avatar]);

  const handleAvatarClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => {
    setAnchorEl(null);
    if (!uploading) {
      setSelectedFile(null);
      setPreview(user.profilepic || user.avatar || "");
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setSelectedFile(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadProfilePic = async () => {
    if (!selectedFile) {
      setSnackbar({ open: true, severity: "warning", message: "No image selected." });
      return;
    }
    setUploading(true);
    try {
      const baseUrl = "/api/admin";
      let url = "";
      if (role === "admin") {
        url = `${baseUrl}/updateAdminProfilePic/${user._id}`;
      } else if (role === "insurer") {
        url = `${baseUrl}/updateInsurerProfilePic/${user._id}`;
      } else {
        setSnackbar({ open: true, severity: "error", message: "Profile update not supported for your role." });
        setUploading(false);
        return;
      }
      const response = await axios.put(url, { profilepic: selectedFile });
      if (response.status === 200 && response.data) {
        const newPic = response.data.profilepic || selectedFile;
        onProfileUpdate(newPic); // update parent with new pic
        setSnackbar({ open: true, severity: "success", message: "Profile picture updated." });
        setSelectedFile(null);
        handleClose();
      } else {
        setSnackbar({ open: true, severity: "error", message: "Failed to update profile picture." });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        severity: "error",
        message: error.response?.data || error.message || "Error updating profile picture.",
      });
    }
    setUploading(false);
  };

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={onFileChange}
      />
      <Tooltip title="Profile & Settings">
        <IconButton onClick={handleAvatarClick} sx={{ p: 0 }}>
          <Avatar
            alt={user.name || user.email}
            src={preview}
            sx={{ border: "2px solid rgba(255,255,255,0.3)", width: 40, height: 40 }}
            imgProps={{ style: { objectFit: "cover" } }}
          />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => !uploading && handleClose()}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { mt: 1, borderRadius: 2, minWidth: 240 } }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user.name || "No Name"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, wordBreak: "break-all" }}>
            {user.email || "No Email"}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: "medium" }}>
            ID: {user._id || "N/A"}
          </Typography>
        </Box>
        <MenuItem onClick={triggerFileSelect} disabled={uploading}>
          Change Profile Picture
        </MenuItem>
        {selectedFile && (
          <Box sx={{ px: 2, py: 1 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={uploadProfilePic}
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={18} /> : null}
              sx={{ mb: 1 }}
            >
              {uploading ? "Uploading..." : "Save"}
            </Button>
            <Button
              variant="text"
              fullWidth
              onClick={() => {
                setSelectedFile(null);
                setPreview(user.profilepic || user.avatar || "");
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
          </Box>
        )}
        <MenuItem onClick={() => { onLogout(); handleClose(); }} sx={{ py: 1.5 }}>
          Logout
        </MenuItem>
      </Menu>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
export default ProfileAvatarMenu;
