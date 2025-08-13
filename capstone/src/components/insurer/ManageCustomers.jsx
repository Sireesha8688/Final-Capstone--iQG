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
import InsurerEditCustomer from "./InsurerEditCustomer";

const API_ENDPOINT = "http://localhost:1000/api/insurer/manage";

const columns = [
  { id: "name", label: "Name", minWidth: 170 },
  { id: "aadharCardNumber", label: "Aadhar Number", minWidth: 120 },
  { id: "email", label: "Email", minWidth: 180 },
  { id: "mobile_number", label: "Mobile Number", minWidth: 120 },
  { id: "policies", label: "Policies", minWidth: 200 },
  { id: "actions", label: "Actions", minWidth: 120 },
];

const InsurerManageCustomers = () => {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_ENDPOINT}/customers`);
      setRows(res.data);
      setFilteredRows(res.data);
    } catch (e) {
      setRows([]);
      setFilteredRows([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!editCustomer) {
      fetchCustomers();
    }
  }, [editCustomer]);

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
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await axios.delete(`${API_ENDPOINT}/customer/${id}`);
        fetchCustomers();
      } catch (error) {
        alert("Failed to delete customer.");
      }
    }
  };

  if (editCustomer !== null) {
    return (
      <InsurerEditCustomer customer={editCustomer} onDone={() => setEditCustomer(null)} />
    );
  }

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  return (
    <Paper sx={{ width: "100%", overflow: "hidden", p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Customers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setEditCustomer({})}
        >
          Add Customer
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
        <Table stickyHeader aria-label="customers table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  style={{ minWidth: column.minWidth }}
                >
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
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => (
                <TableRow hover key={row._id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.aadharCardNumber}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.mobile_number || "—"}</TableCell>
                  <TableCell>
                    {row.policies && row.policies.length > 0
                      ? row.policies
                          .map(
                            (p) =>
                              `#${p.policyId} (${p.bought_date} - ${p.expiry_date})`
                          )
                          .join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => setEditCustomer(row)}
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

export default InsurerManageCustomers;
