// src/components/Dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Chip,
  useTheme,
  alpha,
  Container,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";

import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  LocalHospital as LocalHospitalIcon,
  Receipt as ReceiptIcon,
  TrackChanges as TrackChangesIcon,
  Apartment as ApartmentIcon,
  People as PeopleIcon,
  Gavel as GavelIcon,
  Business as BusinessIcon,
  VerifiedUser as VerifiedUserIcon,
  Policy as PolicyIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";

import axios from "axios";

import ManageInsurers from "./admin/ManageInsurers";
import ManageCovers from "./admin/ManageCovers";
import RoomManagementDashboard from "./admin/RoomManagementDashboard";
import Policies from "./admin/Policies";
import GenerateDischargeDetails from "./admin/GenerateDischargeDetails";
import ManageAdmins from "./admin/ManageAdmins";

import PreAuth from "./hospital/HospitalPreAuthForm";
import AdmitPatient from "./hospital/HospitalAdmissionForm";
import Discharge from "./hospital/HospitalDischargeClaimSubmission";
import TrackClaimStatus from "./hospital/HospitalClaimTracker";

import ManageHospitals from "./insurer/ManageHospitals";
import ManageCustomers from "./insurer/ManageCustomers";

import InsurerPreAuth from "./insurer/InsurerPreAuthClaims";
import InsurerClaimsAdjudication from "./insurer/InsurerClaimsAdjudication";

const drawerWidthOpen = 280;
const drawerWidthClosed = 70;

const primaryColor = "#1976d2";
const lightBlue = "#64b5f6";
const darkBlue = "#0d47a1";
const backgroundColor = "#f4f6f8";

const sidebarMenus = {
  hospital: [
    { label: "PreAuthorization", path: "preauth", icon: <AssignmentTurnedInIcon /> },
    { label: "Admit Patient", path: "admitpatient", icon: <LocalHospitalIcon /> },
    { label: "Discharge & Bills", path: "discharge", icon: <ReceiptIcon /> },
    { label: "Track Claims", path: "trackclaimstatus", icon: <TrackChangesIcon /> },
  ],
  insurer: [
     { label: "Manage Customers", path: "managecustomers", icon: <PeopleIcon /> },
    { label: "Manage Covers", path: "managecovers", icon: <VerifiedUserIcon /> },
    { label: "Manage Policies", path: "managepolicies", icon: <PolicyIcon /> },
    { label: "PreAuthorization", path: "insurerpreauth", icon: <AssignmentTurnedInIcon /> },
    { label: "Claims Adjudication", path: "claimsAdjudication", icon: <GavelIcon /> },
    { label: "Manage Hospitals", path: "managehospitals", icon: <ApartmentIcon /> },
   
  ],
  admin: [
    { label: "Manage Insurers", path: "manageinsurers", icon: <BusinessIcon /> },
    { label: "Manage Admins", path: "manageadmins", icon: <PeopleIcon /> },
    { label: "Room Management", path: "roommanagement", icon: <VerifiedUserIcon /> },
    { label: "Discharge Details", path: "generatedischargedetails", icon: <DescriptionIcon /> },
   
  ],
};

function Dashboard({ user: initialUser, role, onLogout }) {
  const theme = useTheme();

  const [user, setUser] = useState(initialUser);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(user.profilepic || user.avatar || "");
  const [uploading, setUploading] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, severity: "info", message: "" });

  const menus = sidebarMenus[role] || [];
  const [selectedMenu, setSelectedMenu] = useState(menus.length > 0 ? menus[0].path : null);

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (mobile) setDrawerOpen(false);
      else setMobileOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setPreview(user.profilepic || user.avatar || "");
  }, [user.profilepic, user.avatar]);

  const handleDrawerToggle = () => {
    if (isMobile) setMobileOpen(!mobileOpen);
    else setDrawerOpen(!drawerOpen);
  };

  const handleProfileClick = (event) => setAnchorEl(event.currentTarget);
  const handleProfileClose = () => {
    if (!uploading) setAnchorEl(null);
  };

  const onAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
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
      setSnackbar({ open: true, severity: "warning", message: "Please select an image to upload." });
      return;
    }
    setUploading(true);

    try {
      // Determine backend API URL based on role
      let url = "";
      if (role === "admin") {
        url = `http://localhost:1000/api/admin/updateAdminProfilePic/${user._id}`;
      } else if (role === "insurer") {
        url = `http://localhost:1000/api/admin/updateInsurerProfilePic/${user._id}`;
      } else if (role === "hospital") {
        // Note: Adjust based on your hospital API path and port
        url = `http://localhost:1000/api/insurer/manage/hospital/updateProfilePic/${user._id}`;
      } else {
        setSnackbar({ open: true, severity: "error", message: "Profile update not supported for your role." });
        setUploading(false);
        return;
      }

      const response = await axios.put(url, { profilepic: selectedFile });
      if (response.status === 200 && response.data) {
        const newPic = response.data.profilepic || selectedFile;
        setUser((prev) => ({ ...prev, profilepic: newPic }));
        setSnackbar({ open: true, severity: "success", message: "Profile picture updated successfully." });
        setSelectedFile(null);
        handleProfileClose();
      } else {
        setSnackbar({ open: true, severity: "error", message: "Failed to update profile picture." });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        severity: "error",
        message: error.response?.data || error.message || "Error updating profile picture.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSnackbarClose = () => setSnackbar((s) => ({ ...s, open: false }));

  // Styles and UI rendering is unchanged from previous, here are essential implementations

  const drawerSx = {
    width: drawerOpen ? drawerWidthOpen : drawerWidthClosed,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    "& .MuiDrawer-paper": {
      width: drawerOpen ? drawerWidthOpen : drawerWidthClosed,
      overflowX: "hidden",
      transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      boxSizing: "border-box",
      background: `linear-gradient(180deg, ${darkBlue}, ${primaryColor})`,
      color: "#fff",
      borderRight: `3px solid ${alpha(primaryColor, 0.3)}`,
    },
  };

  const appBarSx = {
    width: { sm: `calc(100% - ${drawerOpen ? drawerWidthOpen : drawerWidthClosed}px)` },
    ml: { sm: `${drawerOpen ? drawerWidthOpen : drawerWidthClosed}px` },
    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: primaryColor,
    boxShadow: theme.shadows[4],
  };

  const mainContentSx = {
    flexGrow: 1,
    p: 0,
    mt: 8,
    width: { sm: `calc(100% - ${drawerOpen ? drawerWidthOpen : drawerWidthClosed}px)` },
    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: backgroundColor,
    minHeight: "calc(100vh - 64px)",
  };

  const drawerContent = (
    <>
      <Toolbar
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          background: darkBlue,
          minHeight: "64px",
          color: "#fff",
        }}
      >
        {drawerOpen && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <DashboardIcon sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
              {role.charAt(0).toUpperCase() + role.slice(1)} Portal
            </Typography>
          </Box>
        )}
        <IconButton onClick={handleDrawerToggle} sx={{ color: "#fff" }}>
          {drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Toolbar>

      <List sx={{ px: 1, py: 2 }}>
        {menus.map(({ label, path, icon }) => (
          <ListItemButton
            key={path}
            selected={selectedMenu === path}
            onClick={() => {
              setSelectedMenu(path);
              if (isMobile) setMobileOpen(false);
            }}
            sx={{
              mb: 1,
              borderRadius: 2,
              justifyContent: drawerOpen ? "initial" : "center",
              px: 2.5,
              py: 1.5,
              color: "inherit",
              transition: "all 0.3s ease",
              "&.Mui-selected": {
                background: `linear-gradient(135deg, ${alpha(lightBlue, 0.3)}, ${alpha(lightBlue, 0.2)})`,
                color: "#fff",
                boxShadow: `0 4px 12px ${alpha(darkBlue, 0.3)}`,
                "&:hover": {
                  background: `linear-gradient(135deg, ${alpha(lightBlue, 0.35)}, ${alpha(lightBlue, 0.25)})`,
                },
              },
              "&:hover": {
                background: `linear-gradient(135deg, ${alpha("#fff", 0.1)}, ${alpha("#fff", 0.05)})`,
                transform: "translateX(4px)",
              },
            }}
          >
            <Tooltip title={!drawerOpen ? label : ""} placement="right" arrow>
              <Box
                sx={{
                  minWidth: 0,
                  mr: drawerOpen ? 3 : "auto",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {icon}
              </Box>
            </Tooltip>
            {drawerOpen && <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 500 }} />}
          </ListItemButton>
        ))}
      </List>
    </>
  );

  const DefaultContent = () => (
    <Container sx={{ p: 3 }}>
      <Typography variant="h5" color="text.secondary" align="center" sx={{ mt: 10 }}>
        Select a menu option to begin
      </Typography>
    </Container>
  );

  const renderContent = () => {
    const contentStyle = { p: 3 };
    switch (selectedMenu) {
      case "preauth":
        return <Box sx={contentStyle}><PreAuth id={user.hospitalId || user._id} /></Box>;
      case "admitpatient":
        return <Box sx={contentStyle}><AdmitPatient id={user.hospitalId || user._id} /></Box>;
      case "discharge":
        return <Box sx={contentStyle}><Discharge id={user.hospitalId || user._id} /></Box>;
      case "trackclaimstatus":
        return <Box sx={contentStyle}><TrackClaimStatus id={user.hospitalId || user._id} /></Box>;

      case "insurerpreauth":
        return <Box sx={contentStyle}><InsurerPreAuth id={user._id} /></Box>;
      case "claimsAdjudication":
        return <Box sx={contentStyle}><InsurerClaimsAdjudication id={user._id} /></Box>;
      case "managehospitals":
        return <Box sx={contentStyle}><ManageHospitals /></Box>;
      case "managecustomers":
        return <Box sx={contentStyle}><ManageCustomers /></Box>;
      case "managecovers":
        return <Box sx={contentStyle}><ManageCovers /></Box>;
      case "managepolicies":
        return <Box sx={contentStyle}><Policies /></Box>;

      case "manageinsurers":
        return <Box sx={contentStyle}><ManageInsurers /></Box>;
      case "roommanagement":
        return <Box sx={contentStyle}><RoomManagementDashboard /></Box>;
      case "generatedischargedetails":
        return <Box sx={contentStyle}><GenerateDischargeDetails /></Box>;
      case "manageadmins":
        return <Box sx={contentStyle}><ManageAdmins /></Box>;

      default:
        return <DefaultContent />;
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" sx={appBarSx}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
          >
            Welcome {user.name ? user.name.split(" ")[0] : user.email}
            <Chip
              label={role?.charAt(0).toUpperCase() + role?.slice(1)}
              size="small"
              sx={{ ml: 2, backgroundColor: alpha("#fff", 0.2), color: "#fff", fontWeight: 600 }}
            />
          </Typography>
          <Box sx={{ position: "relative", display: "inline-block" }}>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={onFileChange}
              disabled={uploading}
            />
            <Tooltip title="Profile & Settings">
              <IconButton onClick={handleProfileClick} sx={{ p: 0 }}>
                <Avatar
                  alt={user.name || user.email}
                  src={preview}
                  sx={{ border: "2px solid rgba(255,255,255,0.3)", boxShadow: theme.shadows[2], width: 40, height: 40 }}
                  imgProps={{ style: { objectFit: "cover" } }}
                />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={() => !uploading && handleProfileClose()}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{ sx: { mt: 1, borderRadius: 2, minWidth: 240 } }}
            >
              <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {user.name || "No Name"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, wordBreak: "break-word" }}>
                  {user.email || "No Email"}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                  ID: {user._id || "N/A"}
                </Typography>
              </Box>

              <MenuItem onClick={onAvatarClick} disabled={uploading}>
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

              <MenuItem
                onClick={() => {
                  onLogout();
                  handleProfileClose();
                }}
                sx={{ py: 1.5 }}
              >
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidthOpen,
              background: `linear-gradient(180deg, ${darkBlue}, ${primaryColor})`,
              color: "#fff",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer variant="permanent" open={drawerOpen} sx={drawerSx}>
          {drawerContent}
        </Drawer>
      )}

      <Box component="main" sx={mainContentSx}>
        {renderContent()}
      </Box>

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
    </Box>
  );
}

export default Dashboard;
