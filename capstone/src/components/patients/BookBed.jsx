import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINT, endpoints } from '../../api/API';

const BookBed = ({ bookingData, onBack }) => {
  const [rooms, setRooms] = useState([]);
  const [approvedPatients, setApprovedPatients] = useState([]);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    bookingType: 'New Booking',
    roomType: '',
    roomId: '',
    fromRoomId: '',
    fromBedId: '',
    bedId: '',
    requestedDate: '',
    status: 'Requested',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [patientSelectDisabled, setPatientSelectDisabled] = useState(false);

  // Fetch rooms & approved patients on first mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${API_ENDPOINT}/${endpoints.PatientMicroservice}/rooms`);
        setRooms(res.data);
      } catch (error) {
        console.error('Failed to fetch rooms', error);
      }
    };

    const fetchApprovedPatients = async () => {
      try {
        const res = await axios.get(`${API_ENDPOINT}/hospital/claims/insurer-approved/patient-list`);
        setApprovedPatients(res.data || []);
      } catch (error) {
        console.error('Failed to fetch approved patients', error);
      }
    };

    fetchRooms();
    fetchApprovedPatients();
  }, []);

  // Prefill form data from bookingData
  useEffect(() => {
    if (bookingData) {
      setFormData(prev => ({
        ...prev,
        patientId: bookingData.patientId || prev.patientId,
        patientName: bookingData.patientName || '',
        roomType: bookingData.roomType || '',
        roomId: bookingData.roomId || '',
        bedId: bookingData.bedId || '',
      }));

      if (bookingData.patientId) {
        setPatientSelectDisabled(true); // Disable patient select if bookingData contains patientId
      }
    }
  }, [bookingData]);

  // If only one approved patient, auto-select and disable dropdown (unless bookingData prevails)
  useEffect(() => {
    if (approvedPatients.length === 1 && !formData.patientId) {
      const onlyPatient = approvedPatients[0];
      setFormData(prev => ({
        ...prev,
        patientId: onlyPatient.patientId,
        patientName: onlyPatient.patientName,
      }));
      setPatientSelectDisabled(true); // Disable select since only one patient to choose
    }
  }, [approvedPatients, formData.patientId]);

  // Fetch current room/bed for Transfer type and patientId change
  useEffect(() => {
    const fetchCurrentRoomBed = async (claimId) => {
      if (!claimId) return;
      try {
        const res = await axios.get(`${API_ENDPOINT}/hospital/claims/${claimId}/currentRoomBed`);
        if (res.data) {
          setFormData(prev => ({
            ...prev,
            fromRoomId: res.data.roomId || '',
            fromBedId: res.data.bedId || '',
          }));
        }
      } catch {
        setFormData(prev => ({ ...prev, fromRoomId: '', fromBedId: '' }));
      }
    };

    if (formData.bookingType === 'Transfer' && formData.patientId) {
      fetchCurrentRoomBed(formData.patientId);
    } else {
      setFormData(prev => ({ ...prev, fromRoomId: '', fromBedId: '' }));
    }
  }, [formData.bookingType, formData.patientId]);

  // Reset some fields on bookingType change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      status: 'Requested',
      ...(prev.bookingType === 'New Booking' ? { fromRoomId: '', fromBedId: '', reason: '' } : {}),
    }));
  }, [formData.bookingType]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (message) setMessage(''); // Clear message on input change

    if (name === 'patientId') {
      // Update patientName auto when changing patient select
      const patient = approvedPatients.find(p => p.patientId === value);
      setFormData(prev => ({
        ...prev,
        patientId: value,
        patientName: patient ? patient.patientName : '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Form submission handler with duplicate booking check message handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    let requestedDateISO = formData.requestedDate;
    if (requestedDateISO && !requestedDateISO.includes('T')) requestedDateISO += 'T00:00:00Z';

    if (!formData.patientId) {
      setMessage('Please select a patient.');
      setLoading(false);
      return;
    }

    try {
      if (formData.bookingType === 'New Booking') {
        const payload = {
          patientid: formData.patientId,
          patientName: formData.patientName,
          bookingType: formData.bookingType,
          roomType: formData.roomType,
          roomId: formData.roomId,
          bedId: formData.bedId,
          requestedDate: requestedDateISO,
          status: formData.status,
        };
        await axios.post(`${API_ENDPOINT}/patient/roombookings`, payload);
      } else {
        const payload = {
          patientid: formData.patientId,
          patientName: formData.patientName,
          fromRoomId: formData.fromRoomId,
          fromBedId: formData.fromBedId,
          toRoomId: formData.roomId,
          bedId: formData.bedId,
          reason: formData.reason,
          requestedDate: requestedDateISO,
          status: 'Requested',
        };
        await axios.post(`${API_ENDPOINT}/patient/roomtransfers`, payload);
      }

      await axios.put(`${API_ENDPOINT}/hospital/claims/updateRoomBed`, null, {
        params: { claimId: formData.patientId, roomId: formData.roomId, bedId: formData.bedId },
      });

      setMessage('Request submitted successfully.');
      setLoading(false);

      setTimeout(() => {
        setMessage('');
        onBack();
      }, 2000);
    } catch (error) {
      // Handle duplicate booking error from backend
      if (error.response && error.response.status === 400) {
        if (
          typeof error.response.data === 'string' &&
          error.response.data.toLowerCase().includes('same patient') &&
          error.response.data.toLowerCase().includes('same date')
        ) {
          setMessage('Booking failed: Patient already has a booking on this date.');
        } else {
          setMessage(`Booking failed: ${error.response.data || 'Bad Request'}`);
        }
      } else {
        setMessage('Request failed. Please try again.');
      }
      setLoading(false);
    }
  };

  // Render

  if (!bookingData) return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <p>No bed selected. Please select a bed first.</p>
      <button onClick={onBack}>Back to Available Rooms</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: 'auto', padding: 30, backgroundColor: 'white', borderRadius: 15, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#2c5aa0', marginBottom: 20 }}>Book Bed</h2>
      <form onSubmit={handleSubmit}>
        {/* Patient Selection */}
        <div style={{ marginBottom: 20 }}>
          <label>
            Select Patient *
            <select
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              required
              disabled={patientSelectDisabled}
              style={inputStyle}
            >
              <option value="">-- Select Patient --</option>
              {approvedPatients.map(({ patientId, patientName }) => (
                <option key={patientId} value={patientId}>
                  {patientName} ({patientId})
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Patient Name */}
        <div style={{ marginBottom: 20 }}>
          <label>
            Patient Name *
            <input
              type="text"
              name="patientName"
              value={formData.patientName}
              readOnly
              style={inputStyle}
              autoComplete="off"
            />
          </label>
        </div>

        {/* Booking Type */}
        <div style={{ marginBottom: 20 }}>
          <label>Booking Type *</label>
          <div>
            <label style={{ marginRight: 20 }}>
              <input
                type="radio"
                name="bookingType"
                value="New Booking"
                checked={formData.bookingType === 'New Booking'}
                onChange={handleChange}
              />{' '}
              New Booking
            </label>

            <label>
              <input
                type="radio"
                name="bookingType"
                value="Transfer"
                checked={formData.bookingType === 'Transfer'}
                onChange={handleChange}
              />{' '}
              Transfer
            </label>
          </div>
        </div>

        {/* Transfer Fields */}
        {formData.bookingType === 'Transfer' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <label>
                From Room ID *
                <input type="text" name="fromRoomId" value={formData.fromRoomId || ''} readOnly disabled style={inputStyle} />
              </label>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label>
                From Bed ID *
                <input type="text" name="fromBedId" value={formData.fromBedId || ''} readOnly disabled style={inputStyle} />
              </label>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label>
                Reason *
                <textarea name="reason" value={formData.reason} onChange={handleChange} required rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </label>
            </div>
          </>
        )}

        {/* Room Type */}
        <div style={{ marginBottom: 20 }}>
          <label>
            Room Type
            <input type="text" name="roomType" value={formData.roomType} readOnly disabled style={inputStyle} />
          </label>
        </div>
        {/* To Room ID */}
        <div style={{ marginBottom: 20 }}>
          <label>
            To Room ID
            <input type="text" name="roomId" value={formData.roomId} readOnly disabled style={inputStyle} />
          </label>
        </div>
        {/* Bed ID */}
        <div style={{ marginBottom: 20 }}>
          <label>
            Bed ID
            <input type="text" name="bedId" value={formData.bedId} readOnly disabled style={inputStyle} />
          </label>
        </div>
        {/* Requested Date */}
        <div style={{ marginBottom: 20 }}>
          <label>
            Requested Date *
            <input type="date" name="requestedDate" value={formData.requestedDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required style={inputStyle} />
          </label>
        </div>
        {/* Status */}
        <div style={{ marginBottom: 20 }}>
          <label>
            Status
            <input type="text" name="status" value={formData.status} readOnly disabled style={inputStyle} />
          </label>
        </div>

        {/* Buttons */}
        <button type="submit" disabled={loading} style={{ ...submitBtnStyle, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
        <button type="button" disabled={loading} onClick={onBack} style={{ ...submitBtnStyle, backgroundColor: '#c62828', marginLeft: 10 }}>
          Cancel
        </button>

        {/* Message */}
        {message && <p style={{ marginTop: 15, color: message.toLowerCase().includes('failed') ? 'red' : 'green' }}>{message}</p>}
      </form>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: 12,
  borderRadius: 8,
  border: '1px solid #ccc',
  fontSize: 16,
  fontFamily: 'inherit',
};

const submitBtnStyle = {
  background: 'linear-gradient(135deg, #2c5aa0, #1e3a8a)',
  color: 'white',
  border: 'none',
  padding: '15px 30px',
  borderRadius: 8,
  fontWeight: 'bold',
  fontSize: 16,
};

export default BookBed;
