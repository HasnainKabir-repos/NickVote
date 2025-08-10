const { connectToDatabase, Student } = require('../../../lib/mongodb');
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
    
    // Find student by username
    const student = await Student.findOne({ username }).lean();
    
    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await comparePassword(password, student.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: student._id.toString(),
      username: student.username,
      name: student.name,
      role: 'student',
      hasVoted: student.hasVoted
    });

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`);
    
    res.status(200).json({
      success: true,
      user: {
        id: student._id.toString(),
        username: student.username,
        name: student.name,
        hasVoted: student.hasVoted
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

