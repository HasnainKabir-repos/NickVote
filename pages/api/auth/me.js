const { verifyToken } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  res.status(200).json({
    user: {
      id: decoded.id,
      username: decoded.username,
      name: decoded.name,
      role: decoded.role,
      hasVoted: decoded.hasVoted
    }
  });
}

