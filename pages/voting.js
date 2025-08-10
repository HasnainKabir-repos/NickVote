import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Voting() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check authentication
      const authResponse = await fetch('/api/auth/me');
      if (!authResponse.ok) {
        router.push('/');
        return;
      }

      const authData = await authResponse.json();
      setUser(authData.user);
      console.log('Authenticated user:', authData.user);
      // Check if user has already voted
      if (authData.user.hasVoted) {
        setSuccess('You have already submitted your votes. Thank you for participating!');
        setLoading(false);
        return;
      }

      // Load students list
      const studentsResponse = await fetch('/api/students');
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.students);
        
        // Initialize votes object
        const initialVotes = {};
        studentsData.students.forEach(student => {
          initialVotes[student.id] = '';
        });
        setVotes(initialVotes);
      } else {
        setError('Failed to load students list');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteChange = (studentId, nickname) => {
    setVotes(prev => ({
      ...prev,
      [studentId]: nickname
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Prepare votes array
    const votesArray = Object.entries(votes)
      .filter(([studentId, nickname]) => nickname.trim())
      .map(([studentId, nickname]) => ({
        studentId: studentId,
        nickname: nickname.trim()
      }));

    if (votesArray.length === 0) {
      setError('Please suggest at least one nickname before submitting.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ votes: votesArray }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Successfully submitted ${data.votesCount} nickname suggestions! Thank you for participating.`);
        setVotes({});
      } else {
        setError(data.error || 'Failed to submit votes');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading - Nickname Voting System</title>
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
        <title>Vote for Nicknames - Nickname Voting System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="container">
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>

        <div className="card">
          <div className="header">
            <h1>🎉 Suggest Nicknames</h1>
            <p>Welcome, {user?.name}!</p>
            <p>Suggest fun nicknames for your classmates. You can skip anyone you want.</p>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="student-list">
                {students.map((student) => (
                  <div key={student.id} className="student-item">
                    <div className="student-name">{student.name}</div>
                    <input
                      type="text"
                      className="nickname-input"
                      placeholder="Suggest a nickname (optional)"
                      value={votes[student.id] || ''}
                      onChange={(e) => handleVoteChange(student.id, e.target.value)}
                      disabled={submitting}
                      maxLength={50}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '30px' }}>
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Nickname Suggestions'}
                </button>
              </div>

              <div className="info" style={{ marginTop: '20px' }}>
                <strong>Important:</strong> You can only submit once. Your submissions will be final and cannot be edited.
              </div>
            </form>
          )}

          {success && (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

