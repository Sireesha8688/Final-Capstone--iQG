import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import axios from "axios";

const theme = createTheme({
  palette: {
    mode: "light",
    background: { default: "#f0f2f5" },
    primary: { main: "#1976d2" },
    text: { primary: "#333", secondary: "#555" },
  },
  typography: { fontFamily: "'Roboto', 'Helvetica', 'Arial', 'sans-serif'" },
});

const API_BASE = "http://localhost:1000/api";
const OTP_MICROSERVICE_BASE = "http://localhost:1009/otp";

const ADMIN_API = `${API_BASE}/admin`;
const INSURER_API = `${API_BASE}/admin`;
const HOSPITAL_API = `${API_BASE}/insurer/manage`;

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

// Detect user role based on email suffix
const getUserRole = (email = "") => {
  email = email.toLowerCase();
  if (email.endsWith(".admin")) return "admin";
  if (email.endsWith(".ins")) return "insurer";
  if (email.endsWith(".htl")) return "hospital";
  if (email.endsWith(".user")) return "user";
  if (email.endsWith(".ver")) return "verifier";
  return "";
};

// Role-based forgot-password API URLs
const getForgotPasswordApis = (email) => {
  const role = getUserRole(email);
  switch (role) {
    case "admin":
      return {
        checkEmailUrl: `${ADMIN_API}/check-email`,
        verifyPhoneUrl: `${ADMIN_API}/verify-phone`,
        updatePasswordUrlBase: `${ADMIN_API}/updatePassword/`,
      };
    case "insurer":
      return {
        checkEmailUrl: `${INSURER_API}/check-email-insurer`,
        verifyPhoneUrl: `${INSURER_API}/verify-phone-insurer`,
        updatePasswordUrlBase: `${INSURER_API}/updatePasswordInsurer/`,
      };
    case "hospital":
      return {
        checkEmailUrl: `${HOSPITAL_API}/check-email`,
        verifyPhoneUrl: `${HOSPITAL_API}/verify-phone`,
        updatePasswordUrlBase: `${HOSPITAL_API}/hospital/updatePassword/`,
      };
    default:
      return {};
  }
};

export default function Login({ onLoginSuccess }) {
  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password states
  const [forgotOpen, setForgotOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [phoneFromServer, setPhoneFromServer] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Forgot password error/success messages
  const [searchError, setSearchError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const validatePassword = (pwd) => PASSWORD_REGEX.test(pwd);
  const newPasswordHelper =
    newPassword.length > 0 && !validatePassword(newPassword)
      ? "At least 8 chars including uppercase, lowercase, number & special char"
      : "";

  // Login handler
  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    const role = getUserRole(email);
    if (!role) {
      setError("Invalid email format for role detection");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/login`, { email, password });
      const user = response.data;

      if (!user || !user._id) {
        setError("Invalid credentials");
      } else {
        onLoginSuccess(user, role, user.hospitalId || null);
      }
    } catch (err) {
      let msg = "Login failed";
      if (err.response?.data) {
        if (typeof err.response.data === "string") msg = err.response.data;
        else if (err.response.data.error) msg = err.response.data.error;
        else if (err.response.data.message) msg = err.response.data.message;
      }
      setError(msg);
    }
    setLoading(false);
  };

  // Reset forgot-password flow state and open modal
  const openForgotPassword = () => {
    setForgotEmail(email);
    resetForgotPasswordState();
    setForgotOpen(true);
  };

  const resetForgotPasswordState = () => {
    setStep(1);
    setUserId(null);
    setPhoneFromServer("");
    setPhone("");
    setPhoneVerified(false);
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setResetLoading(false);
    setSearchError("");
    setPhoneError("");
    setOtpError("");
    setResetError("");
    setResetSuccess("");
    setSendingOtp(false);
    setVerifyingOtp(false);
  };

  const closeForgotPassword = () => {
    if (resetLoading || sendingOtp || verifyingOtp) return;
    setForgotOpen(false);
  };

  // Step 1: Verify Email
  const verifyEmail = async () => {
    setSearchError("");
    if (!forgotEmail.trim()) {
      setSearchError("Please enter your email");
      return;
    }

    const { checkEmailUrl } = getForgotPasswordApis(forgotEmail.trim());
    if (!checkEmailUrl) {
      setSearchError("Invalid email domain for password reset");
      return;
    }

    try {
      const res = await axios.post(checkEmailUrl, { email: forgotEmail.trim() });
      setUserId(res.data.userId);
      setPhoneFromServer(res.data.phone || "");
      setStep(2);
    } catch (e) {
      setSearchError(
        e.response?.data?.error ||
          e.response?.data ||
          "Email not found"
      );
    }
  };

  // Step 2: Verify Phone
  const verifyPhone = async () => {
    setPhoneError("");
    if (!phone.trim()) {
      setPhoneError("Please enter your phone number");
      return;
    }

    const { verifyPhoneUrl } = getForgotPasswordApis(forgotEmail.trim());
    if (!verifyPhoneUrl) {
      setPhoneError("Invalid user or role");
      return;
    }

    try {
      await axios.post(verifyPhoneUrl, { userId, phone: phone.trim() });
      setPhoneVerified(true);
      setStep(3);
    } catch (e) {
      setPhoneError(
        e.response?.data?.error ||
          e.response?.data ||
          "Phone verification failed or does not match"
      );
    }
  };

  // Step 3a: Send OTP
  const sendOtp = async () => {
    setOtpError("");
    setSendingOtp(true);
    try {
      await axios.post(`${OTP_MICROSERVICE_BASE}/send`, { userId, phone });
      setOtpSent(true);
    } catch {
      setOtpError("Failed to send OTP. Please try again.");
    }
    setSendingOtp(false);
  };

  // Step 3b: Verify OTP
  const verifyOtp = async () => {
    setOtpError("");
    setVerifyingOtp(true);
    try {
      await axios.post(`${OTP_MICROSERVICE_BASE}/verify`, { userId, phone, otp });
      setOtpVerified(true);
      setStep(4);
    } catch {
      setOtpError("Invalid OTP. Please try again.");
    }
    setVerifyingOtp(false);
  };

  // Step 4: Reset Password
  const handlePasswordReset = async () => {
    setResetError("");
    setResetSuccess("");
    if (!newPassword) {
      setResetError("Please enter a new password");
      return;
    }
    if (!validatePassword(newPassword)) {
      setResetError(
        "Password must be at least 8 characters including uppercase, lowercase, number & special character"
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }

    setResetLoading(true);

    const { updatePasswordUrlBase } = getForgotPasswordApis(forgotEmail.trim());
    if (!updatePasswordUrlBase) {
      setResetError("Invalid user role for password reset");
      setResetLoading(false);
      return;
    }

    try {
      await axios.put(`${updatePasswordUrlBase}${userId}`, { password: newPassword });
      setResetSuccess("Password updated successfully");
      resetForgotPasswordState();
      setForgotOpen(false);
    } catch {
      setResetError("Failed to update password");
    }

    setResetLoading(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundImage:
            'url("https://images.pexels.com/photos/531880/pexels-photo-531880.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
          position: "relative",
          "&:before": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 50, 0.55)",
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="xs" sx={{ position: "relative", zIndex: 1 }}>
          <Paper
            elevation={12}
            sx={{
              p: 4,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.95)",
              boxShadow: "0 0 24px rgba(0,0,0,0.25)",
            }}
          >
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{ fontWeight: "700", color: "#1976d2" }}
            >
              Staff Login
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Email"
              placeholder="Enter your email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              sx={{ mb: 2, "& input::placeholder": { color: "rgba(0,0,0,0.54)" } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              autoComplete="email"
            />

            <TextField
              label="Password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              type={showLoginPassword ? "text" : "password"}
              sx={{ mb: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowLoginPassword((v) => !v)}
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              autoComplete="current-password"
            />

            <Box sx={{ textAlign: "right", mb: 3 }}>
              <Button size="small" onClick={openForgotPassword} disabled={loading}>
                Forgot password?
              </Button>
            </Box>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleLogin}
              disabled={loading}
              sx={{ py: 1.8, fontWeight: "semibold", fontSize: "1.1rem" }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Log In"
              )}
            </Button>
          </Paper>
        </Container>

        <Dialog open={forgotOpen} onClose={closeForgotPassword} fullWidth maxWidth="xs">
          <DialogTitle>Password Reset</DialogTitle>
          <DialogContent>
            {step === 1 && (
              <>
                <TextField
                  label="Email"
                  fullWidth
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    setSearchError("");
                  }}
                  disabled={resetLoading}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  autoComplete="email"
                />
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={verifyEmail}
                  disabled={!forgotEmail.trim() || resetLoading}
                  sx={{ mb: 2 }}
                >
                  {resetLoading ? "Verifying..." : "Verify Email"}
                </Button>
                {searchError && <Alert severity="error" sx={{ mb: 2 }}>{searchError}</Alert>}
              </>
            )}

            {step === 2 && (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Please enter the phone number registered with your account
                </Typography>
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError("");
                  }}
                  disabled={resetLoading}
                  sx={{ mb: 2 }}
                  placeholder={phoneFromServer || ""}
                  autoComplete="tel"
                />
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={verifyPhone}
                  disabled={!phone.trim() || resetLoading}
                  sx={{ mb: 2 }}
                >
                  Verify Phone
                </Button>
                {phoneError && <Alert severity="error" sx={{ mb: 2 }}>{phoneError}</Alert>}
              </>
            )}

            {step === 3 && (
              <>
                {!otpSent ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={sendOtp}
                    disabled={sendingOtp || resetLoading}
                    sx={{ mb: 2 }}
                  >
                    {sendingOtp ? "Sending OTP..." : "Send OTP"}
                  </Button>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Enter the OTP sent to your phone
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                      <TextField
                        label="OTP"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value);
                          setOtpError("");
                        }}
                        sx={{ flexGrow: 1 }}
                        disabled={verifyingOtp || resetLoading}
                      />
                      <Button
                        variant="contained"
                        onClick={verifyOtp}
                        disabled={!otp.trim() || verifyingOtp || resetLoading}
                      >
                        {verifyingOtp ? "Verifying..." : "Verify"}
                      </Button>
                    </Box>
                    {otpError && <Alert severity="error" sx={{ mb: 2 }}>{otpError}</Alert>}
                  </>
                )}
              </>
            )}

            {step === 4 && otpVerified && (
              <>
                <TextField
                  label="New Password"
                  fullWidth
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  error={!!newPasswordHelper}
                  helperText={newPasswordHelper}
                  type={showNewPassword ? "text" : "password"}
                  sx={{ mb: 2 }}
                  disabled={resetLoading}
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword((v) => !v)}
                          edge="end"
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Confirm Password"
                  fullWidth
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={confirmPassword.length > 0 && confirmPassword !== newPassword}
                  helperText={
                    confirmPassword.length > 0 && confirmPassword !== newPassword
                      ? "Passwords do not match"
                      : ""
                  }
                  type={showConfirmPassword ? "text" : "password"}
                  sx={{ mb: 2 }}
                  disabled={resetLoading}
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          edge="end"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {resetError && <Alert severity="error" sx={{ mb: 2 }}>{resetError}</Alert>}
                {resetSuccess && <Alert severity="success" sx={{ mb: 2 }}>{resetSuccess}</Alert>}

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handlePasswordReset}
                  disabled={
                    resetLoading ||
                    !newPassword.trim() ||
                    !confirmPassword.trim() ||
                    !!newPasswordHelper ||
                    confirmPassword !== newPassword
                  }
                >
                  {resetLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={closeForgotPassword} disabled={resetLoading || sendingOtp || verifyingOtp}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}
