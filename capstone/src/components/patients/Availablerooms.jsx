import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINT, endpoints } from '../../api/API';

const roomFilters = [
  { label: 'All Rooms', value: 'all' },
  { label: 'Available Only', value: 'available' },
  { label: 'Private Rooms', value: 'private' },
  { label: 'Deluxe & Suite', value: 'deluxe' },
];

const sortOptions = [
  { label: 'Sort by Price', value: '' },
  { label: 'Low to High', value: 'asc' },
  { label: 'High to Low', value: 'desc' },
];

const Availablerooms = ({ onBookRoom, refreshSignal, patientName, patientId }) => {
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Availablerooms received patientName:', patientName);
    console.log('Availablerooms received patientId:', patientId);
  }, [patientName, patientId]);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_ENDPOINT}/${endpoints.PatientMicroservice}/rooms`);
      setRooms(response.data);
    } catch (err) {
      setError('Failed to load rooms. Please try again later.');
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [refreshSignal]);

  const filteredRooms = rooms.filter(room => {
    switch (filter) {
      case 'available':
        return room.beds?.some(bed => bed.status?.toLowerCase() === 'available');
      case 'private':
        return room.type?.toLowerCase().includes('private');
      case 'deluxe':
        return room.type?.toLowerCase().includes('deluxe') || room.type?.toLowerCase().includes('suite');
      case 'all':
      default:
        return true;
    }
  });

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (sortOrder === 'asc') return a.price - b.price;
    if (sortOrder === 'desc') return b.price - a.price;
    return 0;
  });

  return (
    <div>
      {/* Filters + Sort + Refresh */}
      <div
        style={{
          background: 'white',
          borderRadius: 15,
          padding: 20,
          marginBottom: 20,
          display: 'flex',
          gap: 15,
          alignItems: 'center',
          boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
          flexWrap: 'wrap',
        }}
      >
        <label>
          Filter by:&nbsp;
          <select value={filter} onChange={e => setFilter(e.target.value)} style={selectStyle}>
            {roomFilters.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sort:&nbsp;
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={selectStyle}>
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <button onClick={fetchRooms} style={refreshBtnStyle} disabled={loading}>
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Rooms Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: 20,
          padding: '1rem',
        }}
      >
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {loading && !error && <p>Loading rooms...</p>}
        {!loading && sortedRooms.length === 0 && <p>No rooms available.</p>}

        {sortedRooms.map(room => {
          const isAnyBedAvailable = room.beds?.some(bed => bed.status?.toLowerCase() === 'available');

          return (
            <div
              key={room._id}
              style={{
                background: 'white',
                borderRadius: 15,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <img
                src={room.image}
                alt={room.type}
                style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12 }}
                onError={e => (e.currentTarget.src = 'https://via.placeholder.com/350x200?text=No+Image')}
              />
              <div style={{ marginTop: '1rem', flexGrow: 1 }}>
                <h3 style={{ color: '#2c5aa0', marginBottom: '0.5rem' }}>
                  {room.type} (Floor: {room.floor})
                </h3>
                <p style={{ color: '#555', marginBottom: '1rem' }}>{room.description}</p>

                <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Price: ₹{room.price}</div>

                <div style={{ marginBottom: '1rem' }}>
                  <span
                    style={{
                      padding: '6px 12px',
                      borderRadius: 15,
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: isAnyBedAvailable ? '#2e7d32' : '#c62828',
                      backgroundColor: isAnyBedAvailable ? '#e8f5e8' : '#ffebee',
                    }}
                  >
                    {isAnyBedAvailable ? 'Some Beds Available' : 'No Beds Available'}
                  </span>
                </div>

                <div>
                  <h4>Beds:</h4>
                  {room.beds?.length > 0 ? (
                    room.beds.map(bed => {
                      const bedAvailable = bed.status?.toLowerCase() === 'available';
                      const isTransferRequested = bed.status?.toLowerCase() === 'transfer requested';

                      return (
                        <div
                          key={bed.bedId}
                          style={{
                            marginBottom: '0.75rem',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>Bed ID: {bed.bedId}</span>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 12,
                              fontSize: 12,
                              fontWeight: 'bold',
                              backgroundColor: bedAvailable
                                ? '#e8f5e8'
                                : isTransferRequested
                                ? '#fff3e0'
                                : '#ffebee',
                              color: bedAvailable ? '#2e7d32' : isTransferRequested ? '#fb8c00' : '#c62828',
                            }}
                          >
                            {bed.status}
                          </span>
                          <button
                            disabled={!bedAvailable}
                            onClick={() => {
                              console.log('Booking bed for patient:', patientName, 'patientId:', patientId);
                              onBookRoom({
                                roomId: room._id,
                                roomType: room.type,
                                bedId: bed.bedId,
                                patientName,
                                patientId, // Pass hospital claim _id here
                              });
                            }}
                            style={{
                              background: bedAvailable ? 'linear-gradient(135deg, #4caf50, #45a049)' : '#ccc',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: 8,
                              cursor: bedAvailable ? 'pointer' : 'not-allowed',
                              fontWeight: 'bold',
                            }}
                            onMouseOver={e => bedAvailable && (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseOut={e => (e.currentTarget.style.transform = 'none')}
                          >
                            {bedAvailable ? 'Book Bed' : 'Not Available'}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p>No beds info available</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const selectStyle = {
  padding: 10,
  borderRadius: 8,
  border: '1px solid #ddd',
  cursor: 'pointer',
};

const refreshBtnStyle = {
  background: '#2c5aa0',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: 8,
  cursor: 'pointer',
};

export default Availablerooms;
