import React from 'react';

const MyRides: React.FC = () => {
  const rides = [
    {
      id: 1,
      date: '2024-01-15',
      time: '2:30 PM',
      from: 'Oxford Street, London W1C 1JN',
      to: 'Heathrow Airport Terminal 5',
      driver: 'James Thompson',
      status: 'Completed',
      fare: '£22.50',
      rating: 5
    },
    {
      id: 2,
      date: '2024-01-14',
      time: '9:15 AM',
      from: 'King\'s Cross Station, London',
      to: 'Canary Wharf, London E14',
      driver: 'Emma Davies',
      status: 'Completed',
      fare: '£14.80',
      rating: 4
    },
    {
      id: 3,
      date: '2024-01-13',
      time: '6:45 PM',
      from: 'Covent Garden, London WC2E',
      to: 'Westminster, London SW1A',
      driver: 'Oliver Williams',
      status: 'Completed',
      fare: '£8.90',
      rating: 5
    }
  ];

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '2rem'
  };

  const headerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto 2rem auto',
    textAlign: 'center'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '0.5rem'
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '1rem'
  };

  const ridesContainerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto'
  };

  const rideCardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '1.5rem',
    marginBottom: '1rem',
    border: '1px solid #e5e7eb'
  };

  const rideHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  };

  const dateTimeStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '0.875rem'
  };

  const statusStyle: React.CSSProperties = {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    backgroundColor: '#d1fae5',
    color: '#065f46'
  };

  const routeStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem'
  };

  const locationStyle: React.CSSProperties = {
    flex: 1
  };

  const locationLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem'
  };

  const locationTextStyle: React.CSSProperties = {
    fontWeight: '500',
    color: '#1f2937'
  };

  const arrowStyle: React.CSSProperties = {
    color: '#9ca3af',
    fontSize: '1.25rem'
  };

  const rideFooterStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #f3f4f6'
  };

  const driverInfoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const fareStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#059669'
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>🚗 My Rides</h1>
        <p style={subtitleStyle}>Your recent ride history and details</p>
      </div>

      <div style={ridesContainerStyle}>
        {rides.map((ride) => (
          <div key={ride.id} style={rideCardStyle}>
            <div style={rideHeaderStyle}>
              <div style={dateTimeStyle}>
                {ride.date} at {ride.time}
              </div>
              <div style={statusStyle}>
                {ride.status}
              </div>
            </div>

            <div style={routeStyle}>
              <div style={locationStyle}>
                <div style={locationLabelStyle}>From</div>
                <div style={locationTextStyle}>{ride.from}</div>
              </div>
              <div style={arrowStyle}>→</div>
              <div style={locationStyle}>
                <div style={locationLabelStyle}>To</div>
                <div style={locationTextStyle}>{ride.to}</div>
              </div>
            </div>

            <div style={rideFooterStyle}>
              <div style={driverInfoStyle}>
                <span>👤 {ride.driver}</span>
                <span style={{marginLeft: '1rem'}}>{renderStars(ride.rating)}</span>
              </div>
              <div style={fareStyle}>{ride.fare}</div>
            </div>
          </div>
        ))}

        {rides.length === 0 && (
          <div style={{...rideCardStyle, textAlign: 'center', padding: '3rem'}}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🚗</div>
            <h3 style={{color: '#6b7280', marginBottom: '0.5rem'}}>No rides yet</h3>
            <p style={{color: '#9ca3af'}}>Book your first ride to see it here!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRides;