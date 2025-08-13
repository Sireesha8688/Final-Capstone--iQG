import React, { useState } from "react";
import { Box, Button, Typography, Container, CssBaseline, Paper } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import PatientLoginPage from "./components/patients/PatientLoginPage";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard"; // Staff/admin/etc Dashboard
import PatientDashboard from "./components/patients/PatientDashboard"; // Patient Dashboard

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2c5aa0" },
    secondary: { main: "#e91e63" },
    background: { default: "#f5f7fa" },
  },
  typography: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
});

const backgroundImageUrl =
  "https://www.nestsoft.com/images/services/hospital-management-software1s.jpg";

const App = () => {
  const [user, setUser] = useState(null); // user: { id, name, claimId, ... }
  const [role, setRole] = useState(null);
  const [loginType, setLoginType] = useState(null); // null | 'patient' | 'general'

  // Patient login success handler with claimId included
  const handlePatientLoginSuccess = (patientData) => {
    const normalizedPatient = {
      id: patientData.id || patientData._id,
      name: patientData.name,
      claimId: patientData.claimId, // hospital claim _id
    };
    console.log("Patient login success (normalized):", normalizedPatient);
    setUser(normalizedPatient);
    setRole("patient");
  };

  const handleGeneralLoginSuccess = (userData, userRole) => {
    console.log("General login success:", userData, userRole);
    setUser(userData);
    setRole(userRole.toLowerCase());
  };

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    setLoginType(null);
  };

  if (user && role) {
    if (role === "patient") {
      return <PatientDashboard user={user} onLogout={handleLogout} />;
    } else {
      return (
        <Dashboard
          user={user}
          role={role}
          onLogout={handleLogout}
          patientName={user.name}
          patientId={user.id}
        />
      );
    }
  }

  if (!loginType) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            height: "100vh",
            backgroundImage: `linear-gradient(rgba(44, 90, 160, 0.8), rgba(44, 90, 160, 0.8)), url(${backgroundImageUrl})`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 3,
          }}
        >
          <Container maxWidth="sm" disableGutters>
            <Paper
              elevation={8}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.9)", borderRadius: 3, p: 5, textAlign: "center" }}
            >
              <Typography variant="h3" gutterBottom sx={{ fontWeight: "bold", color: "#2c5aa0" }}>
                Welcome to Hospital Management System
              </Typography>
              <Typography variant="body1" gutterBottom color="text.secondary" sx={{ mb: 4 }}>
                Please select your login type to continue
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => setLoginType("patient")}
                  sx={{
                    width: 150,
                    fontWeight: "bold",
                    textTransform: "none",
                    boxShadow: "0 6px 12px rgba(44, 90, 160, 0.4)",
                    "&:hover": {
                      backgroundColor: "#1e3a8a",
                      boxShadow: "0 8px 16px rgba(44, 90, 160, 0.6)",
                    },
                  }}
                >
                  Patient Login
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setLoginType("general")}
                  sx={{
                    width: 150,
                    fontWeight: "bold",
                    textTransform: "none",
                    backgroundColor: "white",
                    color: "#2c5aa0",
                    border: "2px solid #2c5aa0",
                    boxShadow: "0 6px 12px rgba(44, 90, 160, 0.2)",
                    "&:hover": {
                      backgroundColor: "#f0f7ff",
                      boxShadow: "0 8px 16px rgba(44, 90, 160, 0.4)",
                    },
                  }}
                >
                  Staff Login
                </Button>
              </Box>
            </Paper>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  if (loginType === "patient") {
    return <PatientLoginPage onLoginSuccess={handlePatientLoginSuccess} />;
  }

  if (loginType === "general") {
    return <Login onLoginSuccess={handleGeneralLoginSuccess} />;
  }

  return null;
};

export default App;
