import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [results, setResults] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check admin authentication
      const authResponse = await fetch('/api/auth/admin-me');
      if (!authResponse.ok) {
        router.push('/admin');
        return;
      }

      const authData = await authResponse.json();
      setAdmin(authData.admin);

      // Load results
      const resultsResponse = await fetch('/api/admin/results');
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setResults(resultsData.results);
        setStatistics(resultsData.statistics);
      } else {
        setError('Failed to load results');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin-logout', { method: 'POST' });
      router.push('/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nickname-voting-results.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to export results');
      }
    } catch (error) {
      setError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading - Admin Dashboard</title>
        </Head>
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Nickname Voting System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="container">
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>

        <div className="card">
          <div className="header">
            <h1>📊 Admin Dashboard</h1>
            <p>Welcome, {admin?.username}!</p>
            <p>Nickname voting results and statistics</p>
          </div>

          {error && <div className="error">{error}</div>}

          {/* Statistics */}
          <div className="card" style={{ background: '#f8f9fa', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Voting Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <strong>Total Voters:</strong> {statistics.total_voters || 0}
              </div>
              <div>
                <strong>Total Votes:</strong> {statistics.total_votes || 0}
              </div>
              <div>
                <strong>Students with Nicknames:</strong> {statistics.students_with_votes || 0}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={handleExport} 
              className="btn" 
              disabled={exporting}
              style={{ maxWidth: '300px' }}
            >
              {exporting ? 'Exporting...' : '📥 Export Results to Excel'}
            </button>
          </div>

          {/* Results Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Winning Nickname</th>
                  <th>Vote Count</th>
                  <th>First Suggested</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id}>
                    <td>{result.name}</td>
                    <td>
                      <strong style={{ 
                        color: result.winning_nickname === 'No nickname suggested' ? '#666' : '#2c3e50' 
                      }}>
                        {result.winning_nickname}
                      </strong>
                    </td>
                    <td>{result.vote_count}</td>
                    <td>
                      {result.first_suggested ? 
                        new Date(result.first_suggested).toLocaleString() : 
                        '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {results.length === 0 && (
            <div className="info">
              No voting results available yet.
            </div>
          )}

          <div className="info" style={{ marginTop: '30px' }}>
            <strong>Note:</strong> In case of tied votes, the nickname that was suggested first wins.
          </div>
        </div>
      </div>
    </>
  );
}

