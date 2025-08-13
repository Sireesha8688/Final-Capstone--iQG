import React, { useState, useEffect, useMemo } from "react";
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
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";

import PolicyForm from "./PolicyForm";

const columns = [
  { id: "name", label: "Policy Name", minWidth: 150 },
  { id: "description", label: "Description", minWidth: 220 },
  { id: "covers", label: "Covers", minWidth: 220 },
  { id: "sumAssured", label: "Sum Assured", minWidth: 120, align: "right" },
  { id: "premium", label: "Premium", minWidth: 120, align: "right" },
  { id: "actions", label: "Actions", minWidth: 100, align: "center" },
];

// Change API base URL accordingly
const API_GATEWAY_BASE = "http://localhost:1000/api/admin";

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [covers, setCovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(null);

  const [delOpen, setDelOpen] = useState(false);
  const [delPolicy, setDelPolicy] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const [policiesRes, coversRes] = await Promise.all([
          fetch(`${API_GATEWAY_BASE}/getAllPolicies`),
          fetch(`${API_GATEWAY_BASE}/getAllCovers`),
        ]);
        if (!policiesRes.ok) throw new Error("Failed to fetch policies");
        if (!coversRes.ok) throw new Error("Failed to fetch covers");
        const policiesData = await policiesRes.json();
        const coversData = await coversRes.json();
        setPolicies(policiesData);
        setCovers(coversData);
      } catch (err) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredPolicies = useMemo(() => {
    const s = search.toLowerCase();
    return policies.filter(
      (p) =>
        p.name?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s)
    );
  }, [search, policies]);

  const handleFormSubmit = async (data) => {
    try {
      if (formData && formData._id) {
        // Update existing policy
        const res = await fetch(`${API_GATEWAY_BASE}/updatePolicy/${formData._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update policy");
        setPolicies((prev) =>
          prev.map((p) => (p._id === formData._id ? { ...p, ...data, _id: formData._id } : p))
        );
      } else {
        // Add new policy
        const res = await fetch(`${API_GATEWAY_BASE}/addPolicy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to add policy");
        const newPolicy = await res.json();
        setPolicies((prev) => [...prev, newPolicy]);
      }
      setFormOpen(false);
      setFormData(null);
    } catch (err) {
      alert(err.message || "An error occurred while saving policy.");
    }
  };

  const handleDelete = async () => {
    if (!delPolicy?._id) return;
    try {
      const res = await fetch(`${API_GATEWAY_BASE}/deletePolicy/${delPolicy._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete policy");
      setPolicies((prev) => prev.filter((p) => p._id !== delPolicy._id));
      setDelOpen(false);
      setDelPolicy(null);
    } catch (err) {
      alert(err.message || "Failed to delete policy.");
    }
  };

  return (
    <Box sx={{ py: 4, px: 2, minHeight: "100vh" }}>
      <Typography variant="h4" gutterBottom align="center">
        Manage Policies
      </Typography>

      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            placeholder="Search policies..."
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
              "aria-label": "Search policies",
            }}
          />
          <Button
            variant="contained"
            onClick={() => {
              setFormData(null);
              setFormOpen(true);
            }}
            aria-label="Add new policy"
          >
            Add Policy
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", minHeight: 200 }} aria-live="polite">
            <CircularProgress aria-label="Loading policies" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="policies table">
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
                  {filteredPolicies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center">
                        No policies found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPolicies
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => (
                        <TableRow hover key={row._id}>
                          {columns.map((col) =>
                            col.id === "actions" ? (
                              <TableCell key={col.id} align={col.align}>
                                <Stack direction="row" spacing={1} justifyContent="center" aria-label={`Actions for ${row.name}`}>
                                  <IconButton
                                    color="primary"
                                    aria-label={`Edit ${row.name}`}
                                    onClick={() => {
                                      setFormData(row);
                                      setFormOpen(true);
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    color="error"
                                    aria-label={`Delete ${row.name}`}
                                    onClick={() => {
                                      setDelPolicy(row);
                                      setDelOpen(true);
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            ) : (
                              <TableCell key={col.id} align={col.align}>
                                {col.id === "covers"
                                  ? (row.covers || [])
                                      .map((coverId) => {
                                        const cover = covers.find((c) => c._id === coverId);
                                        return cover ? cover.coverName : coverId;
                                      })
                                      .join(", ")
                                  : col.id === "sumAssured"
                                  ? row.sumAssured || row.baseSumAssured || ""
                                  : col.id === "premium"
                                  ? row.premium || row.basePremium || ""
                                  : row[col.id]}
                              </TableCell>
                            )
                          )}
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={filteredPolicies.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Rows per page"
              aria-label="Table pagination"
            />
          </Paper>
        )}
      </Box>

      <PolicyForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setFormData(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={formData}
        coversList={covers}
      />

      <Dialog
        open={delOpen}
        onClose={() => setDelOpen(false)}
        aria-labelledby="delete-confirm-title"
        aria-describedby="delete-confirm-description"
      >
        <DialogTitle id="delete-confirm-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography id="delete-confirm-description">
            Are you sure you want to delete policy <b>{delPolicy?.name}</b>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelOpen(false)} aria-label="Cancel delete">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" aria-label="Confirm delete">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
