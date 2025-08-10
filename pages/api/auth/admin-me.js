const { verifyToken } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.cookies.adminToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'admin') {
    return res.status(401).json({ error: 'Invalid admin token' });
  }
  
  res.status(200).json({
    admin: {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    }
  });
}

