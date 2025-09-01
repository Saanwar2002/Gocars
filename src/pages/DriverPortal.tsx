import React, { useState } from 'react';
import { UKConfig, formatUKCurrency } from '../config/uk-config';

const DriverPortal: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [earnings, setEarnings] = useState(18950); // Store in pence
  const [trips, setTrips] = useState(12);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '2rem'
  };

  const headerStyle: React.CSSProperties = {
    maxWidth: '1000px',
    margin: '0 auto 2rem auto',
    textAlign: 'center'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '0.5rem'
  };

  const dashboardStyle: React.CSSProperties = {
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem'
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '2rem'
  };

  const statusCardStyle: React.CSSProperties = {
    ...cardStyle,
    textAlign: 'center',
    backgroundColor: isOnline ? '#d1fae5' : '#fee2e2'
  };

  const toggleButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '1rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    backgroundColor: isOnline ? '#dc2626' : '#059669',
    color: 'white',
    marginTop: '1rem'
  };

  const statStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '1rem'
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    display: 'block'
  };

  const statLabelStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const rideRequestStyle: React.CSSProperties = {
    ...cardStyle,
    border: '2px solid #3b82f6',
    backgroundColor: '#eff6ff'
  };

  const requestHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  };

  const actionButtonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    margin: '0.25rem'
  };

  const acceptButtonStyle: React.CSSProperties = {
    ...actionButtonStyle,
    backgroundColor: '#059669',
    color: 'white'
  };

  const declineButtonStyle: React.CSSProperties = {
    ...actionButtonStyle,
    backgroundColor: '#dc2626',
    color: 'white'
  };

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
  };

  const handleAcceptRide = () => {
    alert('Ride accepted! Navigate to pickup location.');
    setTrips(trips + 1);
    setEarnings(earnings + 1850); // Add £18.50 in pence
  };

  const handleDeclineRide = () => {
    alert('Ride declined. Looking for next request...');
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>🚗 Driver Portal</h1>
        <p style={{color: '#6b7280'}}>Manage your driving status and view earnings</p>
      </div>

      <div style={dashboardStyle}>
        {/* Status Card */}
        <div style={statusCardStyle}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>
            {isOnline ? '🟢' : '🔴'}
          </div>
          <h2 style={{margin: '0 0 0.5rem 0', color: '#1f2937'}}>
            {isOnline ? 'Online' : 'Offline'}
          </h2>
          <p style={{color: '#6b7280', marginBottom: '1rem'}}>
            {isOnline ? 'Ready to accept rides' : 'Not accepting rides'}
          </p>
          <button
            style={toggleButtonStyle}
            onClick={handleToggleOnline}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        </div>

        {/* Earnings Card */}
        <div style={cardStyle}>
          <h3 style={{margin: '0 0 1.5rem 0', color: '#1f2937'}}>📊 Today's Stats</h3>
          
          <div style={statStyle}>
            <span style={statValueStyle}>{formatUKCurrency(earnings)}</span>
            <span style={statLabelStyle}>Total Earnings</span>
          </div>

          <div style={statStyle}>
            <span style={statValueStyle}>{trips}</span>
            <span style={statLabelStyle}>Completed Trips</span>
          </div>

          <div style={statStyle}>
            <span style={statValueStyle}>4.8⭐</span>
            <span style={statLabelStyle}>Average Rating</span>
          </div>
        </div>

        {/* Ride Request Card (only show when online) */}
        {isOnline && (
          <div style={rideRequestStyle}>
            <div style={requestHeaderStyle}>
              <h3 style={{margin: 0, color: '#1f2937'}}>🔔 New Ride Request</h3>
              <span style={{color: '#3b82f6', fontWeight: '600'}}>2 min away</span>
            </div>

            <div style={{marginBottom: '1rem'}}>
              <div style={{marginBottom: '0.5rem'}}>
                <strong>📍 Pickup:</strong> {UKConfig.popularLocations[10]} {/* Piccadilly Circus */}
              </div>
              <div style={{marginBottom: '0.5rem'}}>
                <strong>🎯 Destination:</strong> {UKConfig.popularLocations[1]} {/* Gatwick Airport */}
              </div>
              <div style={{marginBottom: '0.5rem'}}>
                <strong>💰 Estimated Fare:</strong> {formatUKCurrency(1850)}
              </div>
              <div>
                <strong>📏 Distance:</strong> 28 miles (45 min)
              </div>
            </div>

            <div style={{display: 'flex', gap: '1rem'}}>
              <button
                style={acceptButtonStyle}
                onClick={handleAcceptRide}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              >
                ✅ Accept Ride
              </button>
              <button
                style={declineButtonStyle}
                onClick={handleDeclineRide}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                ❌ Decline
              </button>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div style={cardStyle}>
          <h3 style={{margin: '0 0 1.5rem 0', color: '#1f2937'}}>📋 Recent Activity</h3>
          
          <div style={{borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem'}}>
              <span>Heathrow Airport Trip</span>
              <span style={{color: '#059669', fontWeight: '600'}}>+{formatUKCurrency(2250)}</span>
            </div>
            <div style={{fontSize: '0.875rem', color: '#6b7280'}}>2:30 PM • 5⭐ rating</div>
          </div>

          <div style={{borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem'}}>
              <span>King's Cross to Canary Wharf</span>
              <span style={{color: '#059669', fontWeight: '600'}}>+{formatUKCurrency(1480)}</span>
            </div>
            <div style={{fontSize: '0.875rem', color: '#6b7280'}}>1:15 PM • 4⭐ rating</div>
          </div>

          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem'}}>
              <span>Westminster to Covent Garden</span>
              <span style={{color: '#059669', fontWeight: '600'}}>+{formatUKCurrency(890)}</span>
            </div>
            <div style={{fontSize: '0.875rem', color: '#6b7280'}}>11:45 AM • 5⭐ rating</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverPortal;