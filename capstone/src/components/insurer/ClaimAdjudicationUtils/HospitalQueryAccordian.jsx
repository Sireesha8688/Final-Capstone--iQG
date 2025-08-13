// src/components/insurer/ClaimAdjudicationUtils/HospitalQueryAccordian.jsx
import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  Card,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SendIcon from "@mui/icons-material/Send";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DownloadIcon from "@mui/icons-material/Download";
import axios from "axios";
import { API_ENDPOINT, endpoints } from "../../../api/API";

const QUERY_STATUS_FLOW = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
};

const HospitalQueryAccordian = ({ claim }) => {
  const [queryRecord, setQueryRecord] = useState(null);
  const [currentQueryStatus, setCurrentQueryStatus] = useState(QUERY_STATUS_FLOW.OPEN);
  const [tempQueryStatus, setTempQueryStatus] = useState(QUERY_STATUS_FLOW.OPEN);
  const [queryStatusDisabled, setQueryStatusDisabled] = useState(true);
  const [newQueryInputs, setNewQueryInputs] = useState([{ queryText: "", queryRequest: "", attachmentRequired: false }]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (claim.insurerStatus !== "CLAIM_ASSIGNED_FOR_QUERY") return;
    const getQueryData = async () => {
      setQueryLoading(true);
      setQueryError("");
      setSubmitSuccess(false);
      try {
        const response = await axios.get(
          `${API_ENDPOINT}/${endpoints.HospitalClaimsQueriesMicroservice}/claimraised/${claim._id}`
        );
        const data = response.data[0];
        if (data) {
          setQueryRecord(data);
          setCurrentQueryStatus(data.queryStatus);
          setTempQueryStatus(data.queryStatus);
          setQueryStatusDisabled(true);
          setNewQueryInputs([{ queryText: "", queryRequest: "", attachmentRequired: false }]);
        } else {
          setQueryRecord(null);
          setCurrentQueryStatus(QUERY_STATUS_FLOW.OPEN);
          setTempQueryStatus(QUERY_STATUS_FLOW.OPEN);
          setQueryStatusDisabled(false);
        }
      } catch (error) {
        setQueryError(error.message || error.response?.statusText || "Failed to load queries");
      } finally {
        setQueryLoading(false);
      }
    };
    getQueryData();
  }, [claim]);

  const handleTempQueryStatusChange = (newStatus) => setTempQueryStatus(newStatus);

  const handleSelectQueryStatus = async () => {
    setQueryLoading(true);
    setQueryError("");
    try {
      if (queryRecord) {
        const updatedRecord = { ...queryRecord, queryStatus: tempQueryStatus };
        const response = await axios.put(
          `${API_ENDPOINT}/${endpoints.HospitalClaimsQueriesMicroservice}/query/${queryRecord._id}`,
          updatedRecord
        );
        setQueryRecord(response.data);
        setCurrentQueryStatus(tempQueryStatus);
        setSubmitSuccess(true);
      } else {
        setCurrentQueryStatus(tempQueryStatus);
      }
      setQueryStatusDisabled(true);
    } catch (error) {
      setQueryError(error.message || error.response?.statusText || "Failed to update status");
    } finally {
      setQueryLoading(false);
    }
  };

  const handleEditQueryStatus = () => {
    setQueryStatusDisabled(false);
    setTempQueryStatus(currentQueryStatus);
  };

  const handleAddQueryRow = () => {
    setNewQueryInputs([...newQueryInputs, { queryText: "", queryRequest: "", attachmentRequired: false }]);
  };

  const handleNewQueryInputChange = (index, field, value) => {
    const updatedInputs = [...newQueryInputs];
    updatedInputs[index][field] = value;
    setNewQueryInputs(updatedInputs);
  };

  const openBase64File = (fileUrl, fileName) => {
    if (!fileUrl) return;
    try {
      const parts = fileUrl.split(",");
      const base64Str = parts.length > 1 ? parts[1] : fileUrl;
      const byteCharacters = atob(base64Str);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (err) {
      alert("Could not display file (invalid or corrupt base64 encoding).");
      console.error("File open error:", err, { fileUrl, fileName });
    }
  };

  const handleQuerySubmit = async () => {
    setQueryLoading(true);
    setQueryError("");
    setSubmitSuccess(false);
    try {
      const queriesToSubmit = newQueryInputs
        .filter((input) => input.queryText.trim() !== "" || input.queryRequest.trim() !== "")
        .map((input, index) => ({
          queryId: `${queryRecord?.query?.length ? queryRecord.query.length + 1 : index + 1}`,
          queryText: input.queryText,
          queryRequest: input.queryRequest,
          dateRaised: new Date().toISOString(),
          queryResponse: "",
          attachmentRequired: input.attachmentRequired,
          attachment: [],
        }));

      if (queriesToSubmit.length === 0) {
        setQueryError("Please enter at least one query to submit.");
        setQueryLoading(false);
        return;
      }

      if (queryRecord) {
        const updatedQueries = [...queryRecord.query, ...queriesToSubmit];
        const updatedQueryRecordPayload = {
          ...queryRecord,
          query: updatedQueries,
          queryStatus: currentQueryStatus,
          updatedAt: new Date().toISOString(),
        };

        const response = await axios.put(
          `${API_ENDPOINT}/${endpoints.HospitalClaimsQueriesMicroservice}/query/${queryRecord._id}`,
          updatedQueryRecordPayload
        );
        setQueryRecord(response.data);
      } else {
        const newQueryRecordPayload = {
          claimRaisedId: claim._id,
          raisedByInsurerId: claim.insurerId,
          queryStatus: currentQueryStatus,
          query: queriesToSubmit,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const response = await axios.post(
          `${API_ENDPOINT}/${endpoints.HospitalClaimsQueriesMicroservice}`,
          newQueryRecordPayload
        );
        setQueryRecord(response.data);
      }

      await axios.put(
        `${API_ENDPOINT}/${endpoints.HospitalClaimsMicroservice}/claims/${claim._id}`,
        {
          insurerStatus: "CLAIM_ASSIGNED_FOR_QUERY",
          updatedAt: new Date().toISOString(),
        }
      );

      setSubmitSuccess("Query submitted successfully and claim status updated!");
      setNewQueryInputs([{ queryText: "", queryRequest: "", attachmentRequired: false }]);
    } catch (error) {
      setQueryError(error.message || error.response?.statusText || "Failed to submit query");
    } finally {
      setQueryLoading(false);
    }
  };

  const hasExistingQueries = queryRecord && queryRecord.query && queryRecord.query.length > 0;

  return (
    <Accordion sx={{ mt: 2, borderRadius: "8px" }} elevation={2}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight="bold">{hasExistingQueries ? "See Query Responses" : "Raise Query to Hospital"}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {queryLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 1 }}>Loading...</Typography>
          </Box>
        )}
        {queryError && <Alert severity="error" sx={{ mb: 2 }}>{queryError}</Alert>}
        {submitSuccess && <Alert severity="success" sx={{ mb: 2 }}>{submitSuccess}</Alert>}

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Query Status:
          </Typography>
          <Select
            value={tempQueryStatus}
            onChange={(e) => handleTempQueryStatusChange(e.target.value)}
            size="small"
            sx={{ minWidth: 100, mr: 1 }}
            disabled={queryStatusDisabled || queryLoading}
          >
            {Object.values(QUERY_STATUS_FLOW).map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
          <Button onClick={handleSelectQueryStatus} disabled={queryLoading || queryStatusDisabled} variant="outlined" size="small" sx={{ mr: 1 }}>
            Select
          </Button>
          <Button onClick={handleEditQueryStatus} disabled={queryLoading || !queryStatusDisabled} variant="outlined" size="small">
            Edit
          </Button>
        </Box>

        {hasExistingQueries ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Existing Queries:
            </Typography>
            {queryRecord.query.map((q, index) => (
              <Card key={q.queryId} variant="outlined" sx={{ mb: 2, p: 2, borderRadius: "8px" }}>
                <Typography variant="subtitle2">Query {index + 1} (ID: {q.queryId})</Typography>
                <Typography variant="body2"><strong>Raised:</strong> {new Date(q.dateRaised).toLocaleString()}</Typography>
                <Typography variant="body2"><strong>Text:</strong> {q.queryText}</Typography>
                <Typography variant="body2"><strong>Request:</strong> {q.queryRequest}</Typography>
                <Typography variant="body2"><strong>Attachment Required:</strong> {q.attachmentRequired ? "Yes" : "No"}</Typography>
                {q.queryResponse && <Typography variant="body2" sx={{ mt: 1, color: "green" }}><strong>Response:</strong> {q.queryResponse}</Typography>}
                {q.attachment && q.attachment.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Attachments:</strong>
                    </Typography>
                    {q.attachment.map((a, attIndex) => (
                      <Button
                        key={attIndex}
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => openBase64File(a.fileUrl, a.fileName)}
                        sx={{ mr: 1, mb: 1 }}
                      >
                        Download Attachment {attIndex + 1}
                      </Button>
                    ))}
                  </Box>
                )}
              </Card>
            ))}
          </Box>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Raise New Query
            </Typography>
            {newQueryInputs.map((input, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: "1px solid #eee", borderRadius: "8px" }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  New Query {index + 1}
                </Typography>
                <TextField label="Query Text" fullWidth multiline rows={2} value={input.queryText} onChange={(e) => handleNewQueryInputChange(index, "queryText", e.target.value)} sx={{ mb: 2 }} />
                <TextField label="Query Request" fullWidth multiline rows={2} value={input.queryRequest} onChange={(e) => handleNewQueryInputChange(index, "queryRequest", e.target.value)} sx={{ mb: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <label>
                    <input type="checkbox" checked={input.attachmentRequired} onChange={(e) => handleNewQueryInputChange(index, "attachmentRequired", e.target.checked)} /> Attachment Required
                  </label>
                </Box>
              </Box>
            ))}
            <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={handleAddQueryRow} disabled={queryLoading} sx={{ mb: 2 }}>
              Add Another Query
            </Button>
            <Button variant="contained" startIcon={<SendIcon />} onClick={handleQuerySubmit} disabled={queryLoading || newQueryInputs.every((input) => input.queryText.trim() === "" && input.queryRequest.trim() === "")} fullWidth>
              {queryLoading ? <CircularProgress size={24} color="inherit" /> : "Submit All New Queries"}
            </Button>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default HospitalQueryAccordian;
