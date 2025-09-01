import React from 'react';
import { UKConfig } from '../config/uk-config';

const HomePage: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '3rem',
    padding: '2rem'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '1rem'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    color: '#6b7280'
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem'
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem'
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1rem'
  };

  const cardTextStyle: React.CSSProperties = {
    color: '#6b7280',
    lineHeight: '1.6'
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '1rem',
    fontSize: '0.875rem',
    fontWeight: '500'
  };

  const mainButtonStyle: React.CSSProperties = {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1.125rem',
    fontWeight: '600',
    margin: '3rem auto',
    display: 'block'
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>
          🚗 GoCars UK - Premium Taxi Service
        </h1>
        <p style={subtitleStyle}>
          Your Journey Across {UKConfig.locale.country}, Our Priority
        </p>
      </header>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2 style={{...cardTitleStyle, color: '#3b82f6'}}>
            🚀 Instant Booking
          </h2>
          <p style={cardTextStyle}>
            Book your taxi across the UK in seconds with real UK addresses
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={{...cardTitleStyle, color: '#10b981'}}>
            📍 Live GPS Tracking
          </h2>
          <p style={cardTextStyle}>
            Track your driver across British roads with precise location updates
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={{...cardTitleStyle, color: '#8b5cf6'}}>
            🤖 Smart UK Routing
          </h2>
          <p style={cardTextStyle}>
            AI-powered navigation optimised for UK traffic and road conditions
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={{...cardTitleStyle, color: '#f59e0b'}}>
            🧪 System Monitoring
          </h2>
          <p style={cardTextStyle}>
            Real-time monitoring of UK service coverage and performance
          </p>
          <button 
            style={buttonStyle}
            onClick={() => window.open('http://localhost:3003', '_blank')}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            View System Status
          </button>
        </div>

        <div style={cardStyle}>
          <div>
            <h2 style={{...cardTitleStyle, color: '#ef4444'}}>
              📊 UK Coverage Analytics
            </h2>
            <p style={cardTextStyle}>
              Monitor service coverage across {Object.values(UKConfig.regions).map(r => r.name).join(', ')}
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
              <strong>Major Cities:</strong> {Object.values(UKConfig.regions).flatMap(r => r.major_cities).slice(0, 8).join(', ')}...
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div>
            <h2 style={{...cardTitleStyle, color: '#6366f1'}}>
              🔒 GDPR Compliant
            </h2>
            <p style={cardTextStyle}>
              UK data protection compliant with 99.9% uptime across Britain
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
              <strong>Emergency:</strong> {UKConfig.emergency.police} | <strong>Support:</strong> {UKConfig.emergency.support_phone}
            </div>
          </div>
        </div>
      </div>

      <button 
        style={mainButtonStyle}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
      >
        Start Your Journey
      </button>
    </div>
  );
};

export default HomePage;