const { connectToDatabase, getVotingResults, getVotingStatistics } = require('../../../lib/mongodb');
const { verifyToken } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.cookies.adminToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'admin') {
    return res.status(401).json({ error: 'Invalid admin token' });
  }

  try {
    await connectToDatabase();
    
    // Get voting results and statistics
    const [results, statistics] = await Promise.all([
      getVotingResults(),
      getVotingStatistics()
    ]);

    res.status(200).json({ 
      results,
      statistics
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

