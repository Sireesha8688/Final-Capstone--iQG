import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  Paper,
  Divider,
  InputAdornment,
  Avatar,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PhotoCamera from "@mui/icons-material/PhotoCamera";

const API_BASE = "http://localhost:1000/api/insurer/manage";

const defaultHospital = {
  name: "",
  email: "",
  password: "",
  address: {
    street: "",
    city: "",
    state: "",
    pincode: "",
  },
  contact_info: {
    email: "",
    phone: "91", // Default phone prefix here
  },
  bankDetails: {
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  },
  profilepic: "",
};

// Validation helper functions
const validateEmail = (email) => email.endsWith("@bobbili.htl");

// Password has min 8 chars, upper, lower, digit, special char
const validatePassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/.test(password);

const validatePincode = (pincode) => /^\d{6}$/.test(pincode);

// Updated phone validation: must start with "91" and be 12 digits in total ("91" + 10 digits)
const validatePhone = (phone) => /^91\d{10}$/.test(phone);

// Helper to ensure phone always starts with '91' during typing
const sanitizePhoneInput = (input) => {
  if (!input.startsWith("91")) {
    // If user tries to remove '91' prefix forcibly, re-add it
    if (input.length < 2) return "91"; // prevent empty or too short
    return "91" + input.replace(/^91/, "");
  }
  return input;
};

const InsurerEditHospital = ({ hospital, onDone }) => {
  const isEdit = Boolean(hospital && hospital._id);

  const [form, setForm] = useState({
    ...defaultHospital,
    ...hospital,
    address: { ...defaultHospital.address, ...(hospital?.address || {}) },
    contact_info: {
      ...defaultHospital.contact_info,
      ...(hospital?.contact_info || {}),
      // Enforce phone default '91' here on edit
      phone: hospital?.contact_info?.phone
        ? hospital.contact_info.phone.startsWith("91")
          ? hospital.contact_info.phone
          : "91" + hospital.contact_info.phone
        : "91",
    },
    bankDetails: { ...defaultHospital.bankDetails, ...(hospital?.bankDetails || {}) },
    profilepic: hospital?.profilepic || "",
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  const validateField = (field, value, parent = null) => {
    let error = "";
    switch (field) {
      case "name":
        if (!value.trim()) error = "Hospital name is required.";
        break;
      case "email":
        if (!validateEmail(value)) error = "Email must end with @bobbili.htl";
        break;
      case "password":
        if (!validatePassword(value))
          error =
            "Password must be at least 8 chars, include uppercase, lowercase, number, and special character.";
        break;
      case "street":
      case "city":
      case "state":
        if (!value.trim()) error = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
        break;
      case "pincode":
        if (!validatePincode(value)) error = "Pincode must be 6 digits.";
        break;
      case "email_contact":
        if (value && !validateEmail(value))
          error = "Contact email must end with @bobbili.htl";
        break;
      case "phone":
        if (!validatePhone(value)) error = "Contact phone must start with '91' and be 12 digits.";
        break;
      case "bankName":
      case "accountNumber":
      case "ifscCode":
        if (!value.trim()) error = `${field === "ifscCode" ? "IFSC Code" : field} is required.`;
        break;
      default:
        error = "";
    }
    return error;
  };

  const handleField = (field, value, parentField = null) => {
    // Enforce '91' prefix on phone input change
    if (parentField === "contact_info" && field === "phone") {
      value = sanitizePhoneInput(value);
    }

    setForm((prevForm) => {
      if (parentField) {
        return {
          ...prevForm,
          [parentField]: {
            ...prevForm[parentField],
            [field]: value,
          },
        };
      }
      return { ...prevForm, [field]: value };
    });

    // Validate the field on change
    let key;
    if (parentField === "contact_info" && (field === "email" || field === "phone")) {
      key = `contact_info.${field}`;
      setErrors((prev) => ({ ...prev, [key]: validateField(field, value, parentField) }));
    } else if (parentField === "address") {
      key = `address.${field}`;
      setErrors((prev) => ({ ...prev, [key]: validateField(field, value, parentField) }));
    } else if (parentField === "bankDetails") {
      key = `bankDetails.${field}`;
      setErrors((prev) => ({ ...prev, [key]: validateField(field, value, parentField) }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Hospital name is required.";
    if (!validateEmail(form.email)) newErrors.email = "Email must end with @bobbili.htl";
    if (!validatePassword(form.password))
      newErrors.password =
        "Password must be at least 8 chars, include uppercase, lowercase, number, and special character.";
    if (!form.address.street.trim()) newErrors["address.street"] = "Street is required.";
    if (!form.address.city.trim()) newErrors["address.city"] = "City is required.";
    if (!form.address.state.trim()) newErrors["address.state"] = "State is required.";
    if (!validatePincode(form.address.pincode)) newErrors["address.pincode"] = "Pincode must be 6 digits.";
    if (form.contact_info.email && !validateEmail(form.contact_info.email))
      newErrors["contact_info.email"] = "Contact email must end with @bobbili.htl";
    if (!validatePhone(form.contact_info.phone)) newErrors["contact_info.phone"] = "Contact phone must start with '91' and be 12 digits.";
    if (!form.bankDetails.bankName.trim()) newErrors["bankDetails.bankName"] = "Bank name is required.";
    if (!form.bankDetails.accountNumber.trim())
      newErrors["bankDetails.accountNumber"] = "Account number is required.";
    if (!form.bankDetails.ifscCode.trim()) newErrors["bankDetails.ifscCode"] = "IFSC code is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (isEdit) {
        await axios.put(`${API_BASE}/hospital/${form._id}`, form);
      } else {
        await axios.post(`${API_BASE}/hospital`, form);
      }
      onDone();
    } catch (error) {
      alert("Error saving hospital. Please check your inputs and try again.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePassword = () => setShowPassword((prev) => !prev);
  const handleMouseDownPassword = (e) => e.preventDefault();

  const handleFileInput = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, profilepic: reader.result }));
      setErrors((prev) => ({ ...prev, profilepic: undefined }));
    };
    reader.onerror = () => {
      setErrors((prev) => ({ ...prev, profilepic: "Failed to load image." }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <Paper sx={{ maxWidth: 600, mx: "auto", mt: 4, p: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={onDone} aria-label="Back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" ml={1}>
          {isEdit ? "Edit Hospital" : "Add Hospital"}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit} noValidate autoComplete="off">
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
          <Avatar
            src={form.profilepic}
            alt={form.name || "Hospital Profile Pic"}
            sx={{ width: 88, height: 88, bgcolor: "#eee", mb: 1 }}
          />
          <label htmlFor="profile-pic-upload" style={{ cursor: "pointer" }}>
            <input
              accept="image/*"
              id="profile-pic-upload"
              type="file"
              hidden
              onChange={handleFileInput}
              disabled={saving}
            />
            <Button variant="outlined" component="span" disabled={saving}>
              Upload Profile Picture
            </Button>
          </label>
          {errors.profilepic && (
            <Typography color="error" variant="body2" mt={1}>
              {errors.profilepic}
            </Typography>
          )}
        </Box>

        {/* Basic Info */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Basic Information
        </Typography>
        <TextField
          label="Hospital Name"
          value={form.name}
          onChange={(e) => handleField("name", e.target.value)}
          fullWidth
          margin="normal"
          required
          error={!!errors.name}
          helperText={errors.name}
          disabled={saving}
        />
        <TextField
          label="Hospital Email"
          value={form.email}
          onChange={(e) => handleField("email", e.target.value)}
          fullWidth
          margin="normal"
          required
          error={!!errors.email}
          helperText={errors.email}
          disabled={saving}
        />
        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={(e) => handleField("password", e.target.value)}
          fullWidth
          margin="normal"
          required
          error={!!errors.password}
          helperText={errors.password}
          disabled={saving}
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

        <Divider sx={{ my: 2 }} />

        {/* Address */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Address
        </Typography>
        <TextField
          label="Street"
          value={form.address.street}
          onChange={(e) => handleField("street", e.target.value, "address")}
          fullWidth
          margin="normal"
          required
          error={!!errors["address.street"]}
          helperText={errors["address.street"]}
          disabled={saving}
        />
        <TextField
          label="City"
          value={form.address.city}
          onChange={(e) => handleField("city", e.target.value, "address")}
          fullWidth
          margin="normal"
          required
          error={!!errors["address.city"]}
          helperText={errors["address.city"]}
          disabled={saving}
        />
        <TextField
          label="State"
          value={form.address.state}
          onChange={(e) => handleField("state", e.target.value, "address")}
          fullWidth
          margin="normal"
          required
          error={!!errors["address.state"]}
          helperText={errors["address.state"]}
          disabled={saving}
        />
        <TextField
          label="Pincode"
          value={form.address.pincode}
          onChange={(e) => handleField("pincode", e.target.value, "address")}
          fullWidth
          margin="normal"
          required
          inputProps={{ maxLength: 6 }}
          error={!!errors["address.pincode"]}
          helperText={errors["address.pincode"]}
          disabled={saving}
        />

        <Divider sx={{ my: 2 }} />

        {/* Contact Info */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Contact Information
        </Typography>
        <TextField
          label="Contact Email"
          value={form.contact_info.email}
          onChange={(e) => handleField("email", e.target.value, "contact_info")}
          fullWidth
          margin="normal"
          required
          error={!!errors["contact_info.email"]}
          helperText={errors["contact_info.email"]}
          disabled={saving}
        />
        <TextField
          label="Contact Phone"
          value={form.contact_info.phone}
          onChange={(e) => handleField("phone", e.target.value, "contact_info")}
          fullWidth
          margin="normal"
          required
          inputProps={{ maxLength: 12 }}
          error={!!errors["contact_info.phone"]}
          helperText={errors["contact_info.phone"]}
          disabled={saving}
          placeholder="911234567890"
        />

        <Divider sx={{ my: 2 }} />

        {/* Bank Details */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Bank Details
        </Typography>
        <TextField
          label="Bank Name"
          value={form.bankDetails.bankName}
          onChange={(e) => handleField("bankName", e.target.value, "bankDetails")}
          fullWidth
          margin="normal"
          required
          error={!!errors["bankDetails.bankName"]}
          helperText={errors["bankDetails.bankName"]}
          disabled={saving}
        />
        <TextField
          label="Account Number"
          value={form.bankDetails.accountNumber}
          onChange={(e) => handleField("accountNumber", e.target.value, "bankDetails")}
          fullWidth
          margin="normal"
          required
          error={!!errors["bankDetails.accountNumber"]}
          helperText={errors["bankDetails.accountNumber"]}
          disabled={saving}
        />
        <TextField
          label="IFSC Code"
          value={form.bankDetails.ifscCode}
          onChange={(e) => handleField("ifscCode", e.target.value, "bankDetails")}
          fullWidth
          margin="normal"
          required
          error={!!errors["bankDetails.ifscCode"]}
          helperText={errors["bankDetails.ifscCode"]}
          disabled={saving}
        />

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={saving}
            aria-label={isEdit ? "Update Hospital" : "Create Hospital"}
          >
            {saving ? <CircularProgress size={24} /> : isEdit ? "Update Hospital" : "Create Hospital"}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default InsurerEditHospital;
