// src/components/admin/ManageCovers.jsx
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
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CoversForm from "./CoversForm";

// Table columns metadata
const columns = [
  { id: "coverName", label: "Cover Name", minWidth: 150 },
  { id: "description", label: "Description", minWidth: 200 },
  { id: "coverAmount", label: "Cover Amount", minWidth: 120, align: "right" },
  { id: "premium", label: "Premium", minWidth: 120, align: "right" },
  { id: "actions", label: "Actions", minWidth: 120, align: "center" },
];

// API base url — modify as needed
const API_GATEWAY_BASE = "http://localhost:1000/api/admin";

export default function ManageCovers() {
  const [covers, setCovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(null);

  const [delOpen, setDelOpen] = useState(false);
  const [delCover, setDelCover] = useState(null);

  // Fetch covers from API
  const fetchCovers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_GATEWAY_BASE}/getAllCovers`);
      if (!res.ok) throw new Error("Failed to fetch covers");
      const data = await res.json();
      setCovers(data);
    } catch (err) {
      setError(err.message || "Failed to load covers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCovers();
  }, []);

  // Filtered covers according to search term
  const filteredCovers = useMemo(() => {
    const s = search.toLowerCase();
    return covers.filter(
      (c) =>
        c.coverName?.toLowerCase().includes(s) ||
        c.description?.toLowerCase().includes(s)
    );
  }, [search, covers]);

  // Handle form submit (Add or Update)
  const handleFormSubmit = async (data) => {
    try {
      if (formData && formData._id) {
        // Update request
        const res = await fetch(`${API_GATEWAY_BASE}/updateCover/${formData._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update cover");
      } else {
        // Add request
        const res = await fetch(`${API_GATEWAY_BASE}/addCover`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to add cover");
      }
      await fetchCovers();
      setFormOpen(false);
      setFormData(null);
    } catch (err) {
      alert(err.message || "Operation failed");
    }
  };

  // Handle delete cover
  const handleDelete = async () => {
    if (!delCover?._id) return;
    try {
      const res = await fetch(`${API_GATEWAY_BASE}/deleteCover/${delCover._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete cover");
      await fetchCovers();
      setDelOpen(false);
      setDelCover(null);
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  return (
    <Box sx={{ py: 4, px: 2, minHeight: "100vh" }}>
      <Typography variant="h4" gutterBottom align="center">
        Manage Covers
      </Typography>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            placeholder="Search covers..."
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
              "aria-label": "Search covers",
            }}
          />
          <Button
            variant="contained"
            onClick={() => {
              setFormData(null);
              setFormOpen(true);
            }}
            aria-label="Add new cover"
          >
            Add New Cover
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", minHeight: 200 }} aria-live="polite">
            <CircularProgress aria-label="Loading covers" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="covers table">
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
                  {filteredCovers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center">
                        No covers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCovers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => (
                        <TableRow hover key={row._id}>
                          {columns.map((col) =>
                            col.id === "actions" ? (
                              <TableCell key={col.id} align={col.align}>
                                <Stack direction="row" spacing={1} justifyContent="center" aria-label={`Actions for ${row.coverName}`}>
                                  <IconButton
                                    color="primary"
                                    aria-label={`Edit ${row.coverName}`}
                                    onClick={() => {
                                      setFormData(row);
                                      setFormOpen(true);
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    color="error"
                                    aria-label={`Delete ${row.coverName}`}
                                    onClick={() => {
                                      setDelCover(row);
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
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={filteredCovers.length}
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

      {/* Add/Edit Dialog */}
      <CoversForm
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
            Are you sure you want to delete cover{" "}
            <strong>{delCover?.coverName || ""}</strong>?
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
