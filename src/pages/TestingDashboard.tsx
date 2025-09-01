import React, { useState, useEffect } from 'react';

const TestingDashboard: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [systemStatus, setSystemStatus] = useState('healthy');

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '2rem'
  };

  const headerStyle: React.CSSProperties = {
    maxWidth: '1200px',
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
    maxWidth: '1200px',
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
    backgroundColor: systemStatus === 'healthy' ? '#d1fae5' : '#fee2e2'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    margin: '0.5rem',
    backgroundColor: '#3b82f6',
    color: 'white'
  };

  const runningButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#6b7280',
    cursor: 'not-allowed'
  };

  const testItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '0.5rem'
  };

  const statusBadgeStyle: React.CSSProperties = {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600'
  };

  const passedBadgeStyle: React.CSSProperties = {
    ...statusBadgeStyle,
    backgroundColor: '#d1fae5',
    color: '#065f46'
  };

  const failedBadgeStyle: React.CSSProperties = {
    ...statusBadgeStyle,
    backgroundColor: '#fee2e2',
    color: '#991b1b'
  };

  const runningBadgeStyle: React.CSSProperties = {
    ...statusBadgeStyle,
    backgroundColor: '#fef3c7',
    color: '#92400e'
  };

  const mockTests = [
    { id: 1, name: 'System Health Check', status: 'passed', duration: '45ms' },
    { id: 2, name: 'API Endpoints Test', status: 'passed', duration: '120ms' },
    { id: 3, name: 'Database Connection', status: 'passed', duration: '89ms' },
    { id: 4, name: 'Firebase Integration', status: 'passed', duration: '156ms' },
    { id: 5, name: 'WebSocket Connection', status: 'failed', duration: '234ms' },
    { id: 6, name: 'Performance Metrics', status: 'passed', duration: '67ms' }
  ];

  const runTests = async (testType: string) => {
    setIsRunning(true);
    setTestResults([]);
    
    // Simulate running tests
    for (let i = 0; i < mockTests.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setTestResults(prev => [...prev, { ...mockTests[i], status: 'running' }]);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTestResults(prev => 
        prev.map((test, index) => 
          index === i ? { ...mockTests[i] } : test
        )
      );
    }
    
    setIsRunning(false);
  };

  const openTestingAgent = () => {
    window.open('http://localhost:3003', '_blank');
  };

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'passed': return passedBadgeStyle;
      case 'failed': return failedBadgeStyle;
      case 'running': return runningBadgeStyle;
      default: return statusBadgeStyle;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>🧪 Testing Dashboard</h1>
        <p style={{color: '#6b7280'}}>Monitor system health and run comprehensive tests</p>
      </div>

      <div style={dashboardStyle}>
        {/* System Status */}
        <div style={statusCardStyle}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>
            {systemStatus === 'healthy' ? '✅' : '⚠️'}
          </div>
          <h2 style={{margin: '0 0 0.5rem 0', color: '#1f2937'}}>
            System {systemStatus === 'healthy' ? 'Healthy' : 'Issues Detected'}
          </h2>
          <p style={{color: '#6b7280', marginBottom: '1rem'}}>
            All core services operational
          </p>
        </div>

        {/* Test Controls */}
        <div style={cardStyle}>
          <h3 style={{margin: '0 0 1.5rem 0', color: '#1f2937'}}>🚀 Test Execution</h3>
          
          <button
            style={isRunning ? runningButtonStyle : buttonStyle}
            onClick={() => runTests('basic')}
            disabled={isRunning}
            onMouseOver={(e) => !isRunning && (e.currentTarget.style.backgroundColor = '#2563eb')}
            onMouseOut={(e) => !isRunning && (e.currentTarget.style.backgroundColor = '#3b82f6')}
          >
            {isRunning ? '⏳ Running...' : '🔍 Run Basic Tests'}
          </button>

          <button
            style={isRunning ? runningButtonStyle : {...buttonStyle, backgroundColor: '#059669'}}
            onClick={() => runTests('comprehensive')}
            disabled={isRunning}
            onMouseOver={(e) => !isRunning && (e.currentTarget.style.backgroundColor = '#047857')}
            onMouseOut={(e) => !isRunning && (e.currentTarget.style.backgroundColor = '#059669')}
          >
            {isRunning ? '⏳ Running...' : '🚀 Run Comprehensive Tests'}
          </button>

          <div style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
            <button
              style={{...buttonStyle, backgroundColor: '#7c3aed', width: '100%'}}
              onClick={openTestingAgent}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
            >
              🌐 Open Full Testing Agent
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div style={{...cardStyle, gridColumn: 'span 2'}}>
          <h3 style={{margin: '0 0 1.5rem 0', color: '#1f2937'}}>📊 Test Results</h3>
          
          {testResults.length === 0 ? (
            <div style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>
              <div style={{fontSize: '2rem', marginBottom: '1rem'}}>🧪</div>
              <p>No tests run yet. Click a button above to start testing.</p>
            </div>
          ) : (
            <div>
              {testResults.map((test, index) => (
                <div key={test.id} style={testItemStyle}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <span style={{fontSize: '1.25rem'}}>{getStatusIcon(test.status)}</span>
                    <div>
                      <div style={{fontWeight: '500', color: '#1f2937'}}>{test.name}</div>
                      <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Duration: {test.duration}</div>
                    </div>
                  </div>
                  <div style={getBadgeStyle(test.status)}>
                    {test.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div style={cardStyle}>
          <h3 style={{margin: '0 0 1.5rem 0', color: '#1f2937'}}>📈 Quick Stats</h3>
          
          <div style={{marginBottom: '1rem'}}>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#059669'}}>
              {testResults.filter(t => t.status === 'passed').length}
            </div>
            <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Tests Passed</div>
          </div>

          <div style={{marginBottom: '1rem'}}>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626'}}>
              {testResults.filter(t => t.status === 'failed').length}
            </div>
            <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Tests Failed</div>
          </div>

          <div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6'}}>
              {testResults.length > 0 ? Math.round((testResults.filter(t => t.status === 'passed').length / testResults.length) * 100) : 0}%
            </div>
            <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestingDashboard;