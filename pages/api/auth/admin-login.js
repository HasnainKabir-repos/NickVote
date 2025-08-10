const { connectToDatabase, Admin } = require('../../../lib/mongodb');
const { comparePassword, generateToken } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    await connectToDatabase();
    
    // Find admin by username
    const admin = await Admin.findOne({ username }).lean();
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isValidPassword = await comparePassword(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = generateToken({
      id: admin._id.toString(),
      username: admin.username,
      role: 'admin'
    });

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', `adminToken=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`);
    
    res.status(200).json({
      success: true,
      admin: {
        id: admin._id.toString(),
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

