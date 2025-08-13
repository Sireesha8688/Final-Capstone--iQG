import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  InputAdornment,
  IconButton,
  Avatar,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PhotoCamera from "@mui/icons-material/PhotoCamera";

const emailRegex = /^[^\s@]+@bobbili\.admin$/i;
const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;

export default function AdminsForm({ open, onClose, onSubmit, initialData }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+91");
  const [profilepic, setProfilepic] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setName(initialData?.name || "");
    setEmail(initialData?.email || "");
    setPassword(initialData?.password || "");
    setPhone(initialData?.phone ? `+${initialData.phone}` : "+91");
    setProfilepic(initialData?.profilepic || "");
    setErrors({});
    setShowPassword(false);
  }, [initialData, open]);

  // Field validators
  const validateName = (value) => {
    if (!value.trim()) return "Admin Name required";
    return "";
  };

  const validateEmail = (value) => {
    if (!value.trim()) return "Email required";
    if (!emailRegex.test(value)) return "Format: user@bobbili.admin";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "Password required";
    if (!passRegex.test(value))
      return "Password must have 1 uppercase, 1 lowercase, 1 number, 1 special char";
    return "";
  };

  const validatePhone = (value) => {
    if (!value.trim()) return "Phone number required";
    if (!/^\+91\d{10}$/.test(value.trim()))
      return "Phone number must start with +91 and be 13 characters long";
    return "";
  };

  // Input change handlers with validation
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setErrors((errs) => ({ ...errs, name: validateName(val) }));
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setErrors((errs) => ({ ...errs, email: validateEmail(val) }));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setErrors((errs) => ({ ...errs, password: validatePassword(val) }));
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val);
    setErrors((errs) => ({ ...errs, phone: validatePhone(val) }));
  };

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfilepic(ev.target.result);
    reader.onerror = () =>
      setErrors((errs) => ({ ...errs, profilepic: "Failed to load image!" }));
    reader.readAsDataURL(file);
    // Clear profilepic error on new select
    setErrors((errs) => ({ ...errs, profilepic: "" }));
  };

  // Check if all fields are valid to enable submit
  const canSubmit =
    !validateName(name) &&
    !validateEmail(email) &&
    !validatePassword(password) &&
    !validatePhone(phone) &&
    !errors.profilepic;

  const handleSubmit = () => {
    // Final validation before submit (optional)
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const phoneError = validatePhone(phone);

    setErrors({
      ...errors,
      name: nameError,
      email: emailError,
      password: passwordError,
      phone: phoneError,
    });

    if (!nameError && !emailError && !passwordError && !phoneError && !errors.profilepic) {
      onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        profilepic,
      });
    }
  };

  const handleTogglePassword = () => setShowPassword((prev) => !prev);
  const handleMouseDownPassword = (event) => event.preventDefault();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? "Edit Admin" : "Add Admin"}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Avatar
            src={profilepic}
            alt={name}
            sx={{ width: 88, height: 88, mb: 1, bgcolor: "#eee" }}
          />
          <label htmlFor="profile-pic-upload">
            <input
              accept="image/*"
              id="profile-pic-upload"
              type="file"
              hidden
              onChange={handleFile}
            />
            <IconButton color="primary" component="span" size="large" aria-label="upload picture">
              <PhotoCamera />
            </IconButton>
          </label>
          {errors.profilepic && (
            <Box component="span" color="error.main" sx={{ mt: 1, mb: 2 }}>
              {errors.profilepic}
            </Box>
          )}
        </Box>
        <TextField
          label="Admin Name"
          fullWidth
          margin="normal"
          value={name}
          onChange={handleNameChange}
          error={!!errors.name}
          helperText={errors.name}
          required
        />
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={handleEmailChange}
          error={!!errors.email}
          helperText={errors.email}
          required
          placeholder="user@bobbili.admin"
        />
        <TextField
          label="Phone Number"
          fullWidth
          margin="normal"
          value={phone}
          onChange={handlePhoneChange}
          error={!!errors.phone}
          helperText={errors.phone}
          required
          placeholder="+919999999999"
          inputProps={{ maxLength: 13 }}
        />
        <TextField
          label="Password"
          fullWidth
          margin="normal"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={handlePasswordChange}
          error={!!errors.password}
          helperText={errors.password}
          required
          placeholder="1 uppercase, 1 lowercase, 1 number, 1 special char"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={handleTogglePassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                  size="large"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!canSubmit}>
          {initialData ? "Save" : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
