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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AdminsForm from "./AdminsForms";

const columns = [
  { id: "name", label: "Admin Name", minWidth: 150 },
  { id: "email", label: "Email", minWidth: 250 },
  { id: "phone", label: "Phone", minWidth: 150 },
  { id: "password", label: "Password", minWidth: 150 },
  { id: "actions", label: "Actions", minWidth: 120, align: "center" },
];

const API_GATEWAY_BASE = "http://localhost:1000/api/admin";

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0),
    [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false),
    [formData, setFormData] = useState(null);
  const [delOpen, setDelOpen] = useState(false),
    [delAdmin, setDelAdmin] = useState(null);

  useEffect(() => {
    fetch(`${API_GATEWAY_BASE}/getAllAdmins`)
      .then((res) => res.json())
      .then(setAdmins)
      .catch(console.error);
  }, []);

  const filtered = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.phone && a.phone.includes(search))
  );

  const handleFormSubmit = (data) => {
    // Format phone to store only digits with '91' prefix (no '+')
    let normalizedPhone = data.phone?.trim() || "";
    if (normalizedPhone.startsWith("+91")) {
      normalizedPhone = normalizedPhone.slice(1); // remove '+'
    } else if (!normalizedPhone.startsWith("91") && normalizedPhone.length > 0) {
      // If starts not '91' or '+91', prepend '91' (optional based on your rule)
      normalizedPhone = "91" + normalizedPhone;
    }
    const toSubmit = { ...data, phone: normalizedPhone };

    if (formData && formData._id) {
      // Update admin
      console.log("Updating admin id:", formData._id);
      fetch(`${API_GATEWAY_BASE}/updateAdmin/${formData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSubmit),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to update");
          return res.json();
        })
        .then((updatedAdmin) => {
          setAdmins((adms) =>
            adms.map((a) => (a._id === updatedAdmin._id ? updatedAdmin : a))
          );
          setFormOpen(false);
        })
        .catch(console.error);
    } else {
      // Add admin
      fetch(`${API_GATEWAY_BASE}/addAdmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSubmit),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to add");
          return res.json();
        })
        .then((newAdmin) => {
          setAdmins((adms) => [...adms, newAdmin]);
          setFormOpen(false);
        })
        .catch(console.error);
    }
  };

  const handleDelete = () => {
    if (!delAdmin || !delAdmin._id) return;
    console.log("Deleting admin id:", delAdmin._id);
    fetch(`${API_GATEWAY_BASE}/deleteAdmin/${delAdmin._id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete");
        setAdmins((adms) => adms.filter((a) => a._id !== delAdmin._id));
        setDelOpen(false);
      })
      .catch(console.error);
  };

  return (
    <Box sx={{ py: 4, px: 2, minHeight: "100vh", alignItems: "center" }}>
      <Typography variant="h4" gutterBottom align="center">
        Manage Admins
      </Typography>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            placeholder="Search admins..."
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
            }}
          />
          <Button
            variant="contained"
            onClick={() => {
              setFormData(null);
              setFormOpen(true);
            }}
          >
            Add Admin
          </Button>
        </Box>
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.align}
                      style={{
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
                {filtered
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((admin) => (
                    <TableRow key={admin._id} hover>
                      {columns.map((col) =>
                        col.id === "actions" ? (
                          <TableCell key={col.id} align={col.align}>
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <IconButton
                                color="primary"
                                onClick={() => {
                                  setFormData(admin);
                                  setFormOpen(true);
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => {
                                  setDelAdmin(admin);
                                  setDelOpen(true);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        ) : (
                          <TableCell key={col.id} align={col.align}>
                            {admin[col.id]}
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
            count={filtered.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, np) => setPage(np)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />
        </Paper>
      </Box>

      <AdminsForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={formData}
      />

      <Dialog open={delOpen} onClose={() => setDelOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Delete admin <b>{delAdmin?.name}</b>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
