import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  Paper,
  Divider,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const API_ENDPOINT = "http://localhost:1000/api/insurer/manage";
const POLICY_ENDPOINT = "http://localhost:1000/api/admin/getAllPolicies";

const defaultCustomer = {
  name: "",
  email: "",
  password: "",
  aadharCardNumber: "",
  date_of_birth: "",
  gender: "",
  blood_group: "",
  mobile_number: "",
  address: {
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
  },
  bank_account_details: {
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  },
  policies: [],
};

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function validateEmail(email) {
  return email.endsWith("@bobbili.user");
}
function validatePassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(
    password
  );
}
function validateAadhar(aadhar) {
  return /^\d{12}$/.test(aadhar);
}
function validateMobile(mobile) {
  return /^\d{10}$/.test(mobile);
}
function validatePincode(pincode) {
  return /^\d{6}$/.test(pincode);
}
function validateBloodGroup(bg) {
  return bloodGroups.includes(bg.trim().toUpperCase());
}
function isPastDate(date) {
  return new Date(date) < new Date();
}

// Age check helper (between 18 and 60)
function isAgeValid(date) {
  const dob = new Date(date);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }
  return age >= 18 && age <= 60;
}

// Account Number validator
function validateAccountNumber(accountNumber) {
  return /^\d{9,18}$/.test(accountNumber);
}

const InsurerEditCustomer = ({ customer, onDone }) => {
  const isEdit = Boolean(customer && customer._id);
  const [form, setForm] = useState({
    ...defaultCustomer,
    ...customer,
    address: { ...defaultCustomer.address, ...(customer?.address || {}) },
    bank_account_details: {
      ...defaultCustomer.bank_account_details,
      ...(customer?.bank_account_details || {}),
    },
  });
  const [policies, setPolicies] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    axios
      .get(POLICY_ENDPOINT)
      .then((res) => setPolicies(res.data))
      .catch(() => {});
  }, []);

  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value.trim() || !/^[A-Za-z ]+$/.test(value.trim())) {
          return "Name should contain only letters and spaces.";
        }
        return "";
      case "email":
        if (!validateEmail(value)) return "Email must end with @bobbili.user";
        return "";
      case "password":
        if (!validatePassword(value))
          return "Password must be at least 8 chars, include upper, lower, number, and special char.";
        return "";
      case "aadharCardNumber":
        if (!validateAadhar(value)) return "Aadhar number must be 12 digits.";
        return "";
      case "date_of_birth":
        if (!value || !isPastDate(value))
          return "Date of birth must be a past date.";
        if (!isAgeValid(value))
          return "Age must be between 18 and 60 years.";
        return "";
      case "gender":
        if (!value) return "Gender is required.";
        return "";
      case "blood_group":
        if (!validateBloodGroup(value)) return "Invalid blood group.";
        return "";
      case "mobile_number":
        if (!validateMobile(value)) return "Mobile number must be 10 digits.";
        return "";
      case "address.street":
        if (!value.trim()) return "Street is required.";
        return "";
      case "address.city":
        if (!value.trim()) return "City is required.";
        return "";
      case "address.state":
        if (!value.trim()) return "State is required.";
        return "";
      case "address.pincode":
        if (!validatePincode(value)) return "Pincode must be 6 digits.";
        return "";
      case "address.country":
        if (!value.trim()) return "Country is required.";
        return "";
      case "bank_account_details.bankName":
        if (!value.trim()) return "Bank name is required.";
        return "";
      case "bank_account_details.accountNumber":
        if (!validateAccountNumber(value))
          return "Account number must contain 9 to 18 digits.";
        return "";
      case "bank_account_details.ifscCode":
        if (!value.trim()) return "IFSC code is required.";
        return "";
      default:
        return "";
    }
  };

  const validatePolicy = (policy) => {
    if (!policy.policyId) return "Policy is required.";
    if (!policy.expiry_date) return "Expiry date is required.";
    return "";
  };

  const handleFieldChange = (field, value) => {
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
    const errorMessage = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: errorMessage }));
  };

  const handleNestedFieldChange = (parentField, childField, value) => {
    setForm((prevForm) => ({
      ...prevForm,
      [parentField]: {
        ...prevForm[parentField],
        [childField]: value,
      },
    }));

    const fieldName = `${parentField}.${childField}`;
    const errorMessage = validateField(fieldName, value);
    setErrors((prev) => ({
      ...prev,
      [fieldName]: errorMessage,
    }));
  };

  const handlePolicyChange = (idx, policyId, expiry_date) => {
    setForm((f) => {
      const updated = [...f.policies];
      if (!updated[idx]) updated[idx] = {};
      if (policyId !== undefined) updated[idx].policyId = policyId;
      if (expiry_date !== undefined) updated[idx].expiry_date = expiry_date;
      if (!updated[idx].bought_date) {
        updated[idx].bought_date = new Date().toISOString();
      }
      return { ...f, policies: updated };
    });

    const currentPolicy = policies[idx] || {};
    const errorMessage = validatePolicy({
      policyId: policyId !== undefined ? policyId : currentPolicy.policyId,
      expiry_date:
        expiry_date !== undefined ? expiry_date : currentPolicy.expiry_date,
    });
    setErrors((prev) => ({ ...prev, [`policies.${idx}`]: errorMessage }));
  };

  const handleAddPolicy = () => {
    if (form.policies.length < 3)
      setForm((f) => ({
        ...f,
        policies: [
          ...f.policies,
          {
            policyId: "",
            bought_date: new Date().toISOString(),
            expiry_date: "",
          },
        ],
      }));
  };

  const handleRemovePolicy = (idx) => {
    setForm((f) => ({
      ...f,
      policies: f.policies.filter((_, i) => i !== idx),
    }));

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`policies.${idx}`];
      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(form).forEach((field) => {
      if (field === "address" || field === "bank_account_details" || field === "policies") return;
      const errorMsg = validateField(field, form[field]);
      if (errorMsg) newErrors[field] = errorMsg;
    });

    Object.entries(form.address).forEach(([k, v]) => {
      const err = validateField(`address.${k}`, v);
      if (err) newErrors[`address.${k}`] = err;
    });

    Object.entries(form.bank_account_details).forEach(([k, v]) => {
      const err = validateField(`bank_account_details.${k}`, v);
      if (err) newErrors[`bank_account_details.${k}`] = err;
    });

    form.policies.forEach((policy, idx) => {
      const err = validatePolicy(policy);
      if (err) newErrors[`policies.${idx}`] = err;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const cleanedForm = {
        ...form,
        policies: form.policies.filter((p) => p.policyId && p.expiry_date),
      };
      if (isEdit) {
        await axios.put(`${API_ENDPOINT}/customer/${form._id}`, cleanedForm);
      } else {
        await axios.post(`${API_ENDPOINT}/customers`, cleanedForm);
      }
      onDone();
    } catch (err) {
      alert("Error saving customer. Please check your inputs.");
    }
    setSaving(false);
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => event.preventDefault();

  return (
    <Paper sx={{ maxWidth: 600, mx: "auto", mt: 4, p: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={onDone}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" ml={1}>
          {isEdit ? "Edit Customer" : "Add Customer"}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit} autoComplete="off" noValidate>
        {/* Name */}
        <TextField
          label="Name"
          value={form.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          fullWidth
          margin="normal"
          required
          error={!!errors.name}
          helperText={errors.name}
        />
        {/* Email */}
        <TextField
          label="Email"
          value={form.email}
          onChange={(e) => handleFieldChange("email", e.target.value)}
          fullWidth
          margin="normal"
          required
          error={!!errors.email}
          helperText={errors.email}
        />
        {/* Password */}
        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={(e) => handleFieldChange("password", e.target.value)}
          fullWidth
          margin="normal"
          required
          error={!!errors.password}
          helperText={errors.password}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                  size="small"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {/* Aadhar */}
        <TextField
          label="Aadhar Card Number"
          value={form.aadharCardNumber}
          onChange={(e) =>
            handleFieldChange("aadharCardNumber", e.target.value)
          }
          fullWidth
          margin="normal"
          required
          inputProps={{ maxLength: 12 }}
          error={!!errors.aadharCardNumber}
          helperText={errors.aadharCardNumber}
        />
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" gutterBottom>
          Personal Information
        </Typography>
        {/* Date of Birth */}
        <TextField
          label="Date of Birth"
          type="date"
          value={form.date_of_birth}
          onChange={(e) =>
            handleFieldChange("date_of_birth", e.target.value)
          }
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
          error={!!errors.date_of_birth}
          helperText={errors.date_of_birth}
        />
        {/* Gender */}
        <TextField
          select
          label="Gender"
          value={form.gender}
          onChange={(e) => handleFieldChange("gender", e.target.value)}
          fullWidth
          margin="normal"
          required
          error={!!errors.gender}
          helperText={errors.gender}
        >
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </TextField>
        {/* Blood Group */}
        <TextField
          select
          label="Blood Group"
          value={form.blood_group}
          onChange={(e) => handleFieldChange("blood_group", e.target.value)}
          fullWidth
          margin="normal"
          required
          error={!!errors.blood_group}
          helperText={errors.blood_group}
        >
          {bloodGroups.map((bg) => (
            <MenuItem key={bg} value={bg}>
              {bg}
            </MenuItem>
          ))}
        </TextField>
        {/* Mobile Number */}
        <TextField
          label="Mobile Number"
          value={form.mobile_number}
          onChange={(e) => handleFieldChange("mobile_number", e.target.value)}
          fullWidth
          margin="normal"
          inputProps={{ maxLength: 10 }}
          required
          error={!!errors.mobile_number}
          helperText={errors.mobile_number}
        />
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" gutterBottom>
          Address
        </Typography>
        {/* Address Fields */}
        <TextField
          label="Street"
          value={form.address.street}
          onChange={(e) =>
            handleNestedFieldChange("address", "street", e.target.value)
          }
          fullWidth
          margin="normal"
          required
          error={!!errors["address.street"]}
          helperText={errors["address.street"]}
        />
        <TextField
          label="City"
          value={form.address.city}
          onChange={(e) =>
            handleNestedFieldChange("address", "city", e.target.value)
          }
          fullWidth
          margin="normal"
          required
          error={!!errors["address.city"]}
          helperText={errors["address.city"]}
        />
        <TextField
          label="State"
          value={form.address.state}
          onChange={(e) =>
            handleNestedFieldChange("address", "state", e.target.value)
          }
          fullWidth
          margin="normal"
          required
          error={!!errors["address.state"]}
          helperText={errors["address.state"]}
        />
        <TextField
          label="Pincode"
          value={form.address.pincode}
          onChange={(e) =>
            handleNestedFieldChange("address", "pincode", e.target.value)
          }
          fullWidth
          margin="normal"
          inputProps={{ maxLength: 6 }}
          required
          error={!!errors["address.pincode"]}
          helperText={errors["address.pincode"]}
        />
        <TextField
          label="Country"
          value={form.address.country}
          onChange={(e) =>
            handleNestedFieldChange("address", "country", e.target.value)
          }
          fullWidth
          margin="normal"
          required
          error={!!errors["address.country"]}
          helperText={errors["address.country"]}
        />
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" gutterBottom>
          Bank Account Details
        </Typography>
        {/* Bank Account Fields */}
        <TextField
          label="Bank Name"
          value={form.bank_account_details.bankName}
          onChange={(e) =>
            handleNestedFieldChange(
              "bank_account_details",
              "bankName",
              e.target.value
            )
          }
          fullWidth
          margin="normal"
          required
          error={!!errors["bank_account_details.bankName"]}
          helperText={errors["bank_account_details.bankName"]}
        />
        <TextField
          label="Account Number"
          value={form.bank_account_details.accountNumber}
          onChange={(e) =>
            handleNestedFieldChange(
              "bank_account_details",
              "accountNumber",
              e.target.value
            )
          }
          fullWidth
          margin="normal"
          required
          error={!!errors["bank_account_details.accountNumber"]}
          helperText={errors["bank_account_details.accountNumber"]}
          inputProps={{ maxLength: 18 }}
        />
        <TextField
          label="IFSC Code"
          value={form.bank_account_details.ifscCode}
          onChange={(e) =>
            handleNestedFieldChange(
              "bank_account_details",
              "ifscCode",
              e.target.value
            )
          }
          fullWidth
          margin="normal"
          required
          error={!!errors["bank_account_details.ifscCode"]}
          helperText={errors["bank_account_details.ifscCode"]}
        />
        <Divider sx={{ my: 3 }} />
        <Box mt={2} mb={1}>
          <Typography variant="subtitle1">Policies</Typography>
          {form.policies.map((policy, idx) => (
            <Box key={idx} display="flex" alignItems="center" gap={1} mb={1}>
              <TextField
                select
                label="Policy"
                value={policy.policyId || ""}
                onChange={(e) =>
                  handlePolicyChange(idx, e.target.value, policy.expiry_date)
                }
                sx={{ minWidth: 180 }}
                required
                error={!!errors[`policies.${idx}`]}
                helperText={errors[`policies.${idx}`]}
              >
                {policies.map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.name || `Policy #${p._id}`}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Expiry Date"
                type="date"
                value={policy.expiry_date || ""}
                onChange={(e) =>
                  handlePolicyChange(idx, policy.policyId, e.target.value)
                }
                InputLabelProps={{ shrink: true }}
                required
                error={!!errors[`policies.${idx}`]}
                helperText={errors[`policies.${idx}`]}
              />
              <IconButton
                onClick={() => handleRemovePolicy(idx)}
                color="error"
                size="small"
                aria-label="Remove policy"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          {form.policies.length < 3 && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddPolicy}
              sx={{ mt: 1 }}
            >
              Add Policy
            </Button>
          )}
        </Box>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={saving}
          fullWidth
          sx={{ mt: 3 }}
        >
          {isEdit ? "Update Customer" : "Create Customer"}
        </Button>
      </form>
    </Paper>
  );
};

export default InsurerEditCustomer;
