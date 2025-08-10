const { connectToDatabase, Student } = require('../../lib/mongodb');
const { verifyToken } = require('../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    await connectToDatabase();
    
    // Get all students except the current user, sorted by name
    const students = await Student.find(
      { _id: { $ne: decoded.id } },
      { _id: 1, name: 1, username: 1 }
    ).sort({ name: 1 }).lean();

    // Convert MongoDB _id to id for frontend compatibility
    const studentsWithId = students.map(student => ({
      id: student._id.toString(),
      name: student.name,
      username: student.username
    }));

    res.status(200).json({ students: studentsWithId });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

