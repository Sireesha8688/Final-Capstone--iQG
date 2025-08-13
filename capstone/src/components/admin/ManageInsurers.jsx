import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InsurersForm from "./InsurersForm";

const columns = [
  { id: "name", label: "Insurer Name", minWidth: 150 },
  { id: "email", label: "Email", minWidth: 220 },
  { id: "phone", label: "Phone", minWidth: 150 },
  { id: "password", label: "Password", minWidth: 120 },
  { id: "actions", label: "Actions", minWidth: 100, align: "center" },
];

const API_GATEWAY_BASE = "http://localhost:1000/api/admin";

export default function ManageInsurers() {
  const [insurers, setInsurers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(null);

  const [delOpen, setDelOpen] = useState(false);
  const [delInsurer, setDelInsurer] = useState(null);

  useEffect(() => {
    fetchInsurers();
  }, []);

  const fetchInsurers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_GATEWAY_BASE}/getAllInsurers`);
      if (!res.ok) throw new Error("Failed to fetch insurers");
      const data = await res.json();
      setInsurers(data);
    } catch (err) {
      setError(err.message || "Error fetching insurers.");
    } finally {
      setLoading(false);
    }
  };

  const filteredInsurers = insurers.filter(
    (i) =>
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.email?.toLowerCase().includes(search.toLowerCase()) ||
      (i.phone && i.phone.includes(search))
  );

  const handleFormSubmit = async (data) => {
    try {
      // Normalize Phone: if starts with +91 remove '+', else keep as is or add '91'.
      let normalizedPhone = data.phone?.trim() || "";
      if (normalizedPhone.startsWith("+91")) {
        normalizedPhone = normalizedPhone.slice(1); // remove +
      } else if (!normalizedPhone.startsWith("91") && normalizedPhone.length > 0) {
        normalizedPhone = "91" + normalizedPhone;
      }
      const toSubmit = { ...data, phone: normalizedPhone };

      if (formData && formData._id) {
        // Update existing insurer
        const res = await fetch(`${API_GATEWAY_BASE}/updateInsurer/${formData._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toSubmit),
        });
        if (!res.ok) throw new Error("Failed to update insurer");
        setInsurers((prev) =>
          prev.map((i) => (i._id === formData._id ? { ...i, ...toSubmit } : i))
        );
      } else {
        // Add new insurer
        const res = await fetch(`${API_GATEWAY_BASE}/addInsurer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toSubmit),
        });
        if (!res.ok) throw new Error("Failed to add insurer");
        const newInsurer = await res.json();
        setInsurers((prev) => [...prev, newInsurer]);
      }
      setFormOpen(false);
      setFormData(null);
    } catch (err) {
      alert(err.message || "An error occurred.");
    }
  };

  const handleDelete = async () => {
    if (!delInsurer?._id) return;
    try {
      const res = await fetch(`${API_GATEWAY_BASE}/deleteInsurer/${delInsurer._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete insurer");
      setInsurers((prev) => prev.filter((i) => i._id !== delInsurer._id));
      setDelOpen(false);
      setDelInsurer(null);
    } catch (err) {
      alert(err.message || "An error occurred.");
    }
  };

  return (
    <Box sx={{ py: 4, px: 2, minHeight: "100vh" }}>
      <Typography variant="h4" gutterBottom align="center">
        Manage Insurers
      </Typography>

      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            placeholder="Search insurers..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              "aria-label": "search insurers",
            }}
          />
          <Button
            variant="contained"
            onClick={() => {
              setFormData(null);
              setFormOpen(true);
            }}
            aria-label="Add Insurer"
          >
            Add Insurer
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", minHeight: 200 }}>
            <CircularProgress aria-label="Loading insurers" />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="insurers table">
                <TableHead>
                  <TableRow>
                    {columns.map((col) => (
                      <TableCell
                        key={col.id}
                        align={col.align}
                        sx={{
                          backgroundColor: "#1565c0",
                          color: "#fff",
                          minWidth: col.minWidth,
                          fontWeight: "bold",
                          textTransform: "uppercase",
                        }}
                      >
                        {col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInsurers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <TableRow hover key={row._id}>
                        {columns.map((col) =>
                          col.id === "actions" ? (
                            <TableCell key={col.id} align={col.align}>
                              <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="center"
                                aria-label={`actions for ${row.name}`}
                              >
                                <IconButton
                                  color="primary"
                                  aria-label={`edit ${row.name}`}
                                  onClick={() => {
                                    setFormData(row);
                                    setFormOpen(true);
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  color="error"
                                  aria-label={`delete ${row.name}`}
                                  onClick={() => {
                                    setDelInsurer(row);
                                    setDelOpen(true);
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          ) : (
                            <TableCell key={col.id} align={col.align}>
                              {row[col.id]}
                            </TableCell>
                          )
                        )}
                      </TableRow>
                    ))}
                  {filteredInsurers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center">
                        No insurers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={filteredInsurers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Rows per page"
              aria-label="table pagination"
            />
          </Paper>
        )}
      </Box>

      {/* Add/Edit Form Dialog */}
      <InsurersForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setFormData(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={formData}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={delOpen}
        onClose={() => setDelOpen(false)}
        aria-labelledby="delete-confirm-title"
        aria-describedby="delete-confirm-description"
      >
        <DialogTitle id="delete-confirm-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography id="delete-confirm-description">
            Are you sure you want to delete insurer <strong>{delInsurer?.name || ""}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelOpen(false)} aria-label="Cancel delete">
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            aria-label="Confirm delete"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
