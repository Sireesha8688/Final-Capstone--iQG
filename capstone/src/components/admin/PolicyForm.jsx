import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from "@mui/material";

export default function PolicyForm({ open, onClose, onSubmit, initialData, coversList = [] }) {
  const [fields, setFields] = useState({
    name: "",
    description: "",
    covers: [],
    sumAssured: "",
    premium: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFields({
      name: initialData?.name || "",
      description: initialData?.description || "",
      covers: Array.isArray(initialData?.covers)
        ? initialData.covers.map((c) => String(c))
        : [],
      sumAssured: initialData?.sumAssured || initialData?.baseSumAssured || "",
      premium: initialData?.premium || initialData?.basePremium || "",
    });
    setErrors({});
  }, [initialData, open]);

  const validate = () => {
    const e = {};
    if (!fields.name.trim()) e.name = "Name is required";
    if (!fields.description.trim()) e.description = "Description is required";
    if (!fields.covers.length) e.covers = "At least one cover required";
    if (!fields.sumAssured || isNaN(fields.sumAssured) || Number(fields.sumAssured) <= 0)
      e.sumAssured = "Valid sum assured required";
    if (!fields.premium || isNaN(fields.premium) || Number(fields.premium) <= 0)
      e.premium = "Valid premium required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (key) => (e) => {
    setFields((f) => ({
      ...f,
      [key]: key === "covers" ? e.target.value : e.target.value,
    }));
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      ...fields,
      covers: fields.covers.map((id) => String(id)),
      sumAssured: Number(fields.sumAssured),
      premium: Number(fields.premium),
      _id: initialData?._id,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="policy-form-dialog">
      <DialogTitle id="policy-form-dialog">{initialData ? "Edit Policy" : "Add New Policy"}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Name"
            value={fields.name}
            onChange={handleChange("name")}
            error={!!errors.name}
            helperText={errors.name}
            required
            fullWidth
            inputProps={{ "aria-label": "Policy name" }}
          />
          <TextField
            label="Description"
            value={fields.description}
            onChange={handleChange("description")}
            error={!!errors.description}
            helperText={errors.description}
            required
            fullWidth
            multiline
            minRows={5}
            inputProps={{ "aria-label": "Policy description" }}
          />
          <FormControl fullWidth error={!!errors.covers}>
            <InputLabel id="covers-label">Covers</InputLabel>
            <Select
              labelId="covers-label"
              multiple
              value={fields.covers}
              onChange={handleChange("covers")}
              renderValue={(selected) =>
                selected
                  .map((id) => coversList.find((c) => c._id === id)?.coverName || id)
                  .filter(Boolean)
                  .join(", ")
              }
              label="Covers"
            >
              {coversList.map((cover) => (
                <MenuItem key={cover._id} value={cover._id}>
                  <Checkbox checked={fields.covers.indexOf(cover._id) > -1} />
                  <ListItemText primary={cover.coverName} />
                </MenuItem>
              ))}
            </Select>
            {errors.covers && (
              <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
                {errors.covers}
              </Typography>
            )}
          </FormControl>
          <TextField
            label="Sum Assured"
            value={fields.sumAssured}
            onChange={handleChange("sumAssured")}
            error={!!errors.sumAssured}
            helperText={errors.sumAssured}
            required
            fullWidth
            type="number"
            inputProps={{ min: 0, "aria-label": "Sum assured" }}
          />
          <TextField
            label="Premium"
            value={fields.premium}
            onChange={handleChange("premium")}
            error={!!errors.premium}
            helperText={errors.premium}
            required
            fullWidth
            type="number"
            inputProps={{ min: 0, "aria-label": "Premium" }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} aria-label="Cancel">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" aria-label={initialData ? "Save Policy" : "Add Policy"}>
          {initialData ? "Save" : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
