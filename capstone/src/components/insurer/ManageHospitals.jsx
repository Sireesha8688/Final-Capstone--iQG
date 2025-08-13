import React, { useEffect, useState } from "react";
import axios from "axios";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InsurerEditHospital from "./InsurerEditHospital";

// Update these as per your actual backend base URL and path for insurer manage API
const API_BASE = "http://localhost:1000/api/insurer/manage";

const columns = [
  { id: "name", label: "Name", minWidth: 170 },
  { id: "email", label: "Email", minWidth: 180 },
  { id: "address", label: "Address", minWidth: 250 },
  { id: "phone", label: "Phone", minWidth: 150 },
  { id: "actions", label: "Actions", minWidth: 120 },
];

const InsurerManageHospitals = () => {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [editHospital, setEditHospital] = useState(null);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/hospitals`);
      setRows(res.data);
      setFilteredRows(res.data);
    } catch (error) {
      setRows([]);
      setFilteredRows([]);
      console.error("Failed to fetch hospitals", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!editHospital) {
      fetchHospitals();
    }
  }, [editHospital]);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredRows(rows);
    } else {
      setFilteredRows(
        rows.filter((row) =>
          row.name.toLowerCase().includes(search.trim().toLowerCase())
        )
      );
    }
    setPage(0);
  }, [search, rows]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this hospital?")) {
      try {
        await axios.delete(`${API_BASE}/hospital/${id}`);
        fetchHospitals();
      } catch (error) {
        alert("Failed to delete hospital.");
      }
    }
  };

  if (editHospital !== null) {
    return (
      <InsurerEditHospital
        hospital={editHospital}
        onDone={() => setEditHospital(null)}
      />
    );
  }

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const startIndex = page * rowsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + rowsPerPage);

  return (
    <Paper sx={{ width: "100%", overflow: "hidden", p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Hospitals</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setEditHospital({})}
        >
          Add Hospital
        </Button>
      </Box>

      <TextField
        label="Search by Name"
        variant="outlined"
        size="small"
        fullWidth
        sx={{ mb: 2 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="hospitals table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id} style={{ minWidth: column.minWidth }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  No hospitals found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => (
                <TableRow hover key={row._id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>
                    {row.address
                      ? `${row.address.street}, ${row.address.city}, ${row.address.state} - ${row.address.pincode}`
                      : "—"}
                  </TableCell>
                  <TableCell>{row.contact_info?.phone || "—"}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => setEditHospital(row)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(row._id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={filteredRows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default InsurerManageHospitals;
