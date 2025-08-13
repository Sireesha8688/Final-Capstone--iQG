import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Availablerooms from './Availablerooms';
import BookBed from './BookBed';
import TrackStatus from './TrackStatus';
import Notifications from './Notifications';

const TABS = [
  { id: 'availableRooms', label: 'Available Rooms' },
  { id: 'bookBed', label: 'Book Bed' },
  { id: 'trackStatus', label: 'Track Status' },
  { id: 'notifications', label: 'Notifications' },
];

const NOTIFICATION_API_BASE = "http://localhost:1000/api/patient/notifications";

const PatientDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('availableRooms');
  const [bookingData, setBookingData] = useState(null);
  const [refreshSignal, setRefreshSignal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Destructure needed user fields; claimId is hospital claim _id
  const { id: customerId, name: patientName, claimId } = user || {};

  useEffect(() => {
    console.log('PatientDashboard user:', user);
    console.log('Current claimId:', claimId);
  }, [user, claimId]);

  // Fetch unread notification count for current claimId
  const fetchUnreadCount = async () => {
    if (!claimId) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await axios.get(`${NOTIFICATION_API_BASE}/patient/${claimId}/unreadCount`);
      if (res.status === 200 && typeof res.data.unreadCount === 'number') {
        setUnreadCount(res.data.unreadCount);
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to fetch unread notification count:", err);
      setUnreadCount(0);
    }
  };

  // Fetch unread count on mount, on claimId change and on refreshSignal
  useEffect(() => {
    fetchUnreadCount();
  }, [claimId, refreshSignal]);

  // Called when a bed is selected for booking inside AvailableRooms
  const handleBookRoom = ({ roomId, roomType, bedId, patientName, patientId }) => {
    setBookingData({ roomId, roomType, bedId, patientName, patientId });
    setActiveTab('bookBed');
  };

  // Called when booking form is closed/cancelled/success
  const handleBackFromBooking = () => {
    setBookingData(null);
    setActiveTab('availableRooms');
    setRefreshSignal(prev => !prev);
  };

  // Tab switch handler
  const onTabChange = (tabId) => setActiveTab(tabId);

  return (
    <div style={{ maxWidth: 1200, margin: 'auto', padding: 20 }}>
      {/* Header: Tabs and Logout */}
      <header
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 15,
          padding: '10px 24px',
          marginBottom: 30,
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        {TABS.map(tab => {
          if (tab.id === 'notifications') {
            // Show badge on Notifications tab button
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  position: 'relative',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #2c5aa0, #1e3a8a)' : '#f8f9fa',
                  color: activeTab === tab.id ? '#fff' : '#333',
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease',
                }}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                {tab.label}
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 10,
                      backgroundColor: '#e91e63',
                      color: 'white',
                      borderRadius: '50%',
                      padding: '4px 8px',
                      fontSize: 12,
                      fontWeight: 'bold',
                      minWidth: 20,
                      textAlign: 'center',
                      lineHeight: 1,
                      userSelect: 'none',
                    }}
                    aria-label={`${unreadCount} unread notifications`}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            );
          } else {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #2c5aa0, #1e3a8a)' : '#f8f9fa',
                  color: activeTab === tab.id ? '#fff' : '#333',
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease',
                }}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {tab.label}
              </button>
            );
          }
        })}
        <button
          onClick={onLogout}
          style={{
            marginLeft: 'auto',
            background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
            color: 'white',
            border: 'none',
            padding: '8px 20px',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14,
          }}
          aria-label="Logout"
        >
          Logout
        </button>
      </header>

      {/* Tab Content */}
      {activeTab === 'availableRooms' && (
        <Availablerooms
          onBookRoom={handleBookRoom}
          refreshSignal={refreshSignal}
          patientName={patientName}
          patientId={claimId}
        />
      )}

      {activeTab === 'bookBed' && (
        <BookBed
          bookingData={bookingData}
          onBack={handleBackFromBooking}
        />
      )}

      {activeTab === 'trackStatus' && (
        <TrackStatus claimId={claimId} />
      )}

      {activeTab === 'notifications' && (
        <Notifications
          claimId={claimId}
          onReadChange={fetchUnreadCount} 
        />
      )}
    </div>
  );
};

export default PatientDashboard;
