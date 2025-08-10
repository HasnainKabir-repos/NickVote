const { connectToDatabase, Student, Vote } = require('../../lib/mongodb');
const { verifyToken } = require('../../lib/auth');
const mongoose = require('mongoose');

export default async function handler(req, res) {
  console.log(req.body);
  if (req.method !== 'POST') {
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

  const { votes } = req.body;

  if (!votes || !Array.isArray(votes)) {
    return res.status(400).json({ error: 'Invalid votes data' });
  }

  try {
    await connectToDatabase();
    
    // Check if user has already voted
    const student = await Student.findById(decoded.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.hasVoted) {
      return res.status(400).json({ error: 'You have already submitted your votes' });
    }

    // Filter valid votes
    const validVotes = votes.filter(vote => vote.nickname && vote.nickname.trim());

    if (validVotes.length === 0) {
      return res.status(400).json({ error: 'No valid votes provided' });
    }

    // Start a MongoDB session for transaction
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Insert all votes
        const voteDocuments = validVotes.map(vote => ({
          voterId: decoded.id,
          targetStudentId: vote.studentId,
          nickname: vote.nickname.trim()
        }));

        await Vote.insertMany(voteDocuments, { session });

        // Mark student as voted
        await Student.findByIdAndUpdate(
          decoded.id,
          { hasVoted: true },
          { session }
        );
      });

      await session.endSession();

      res.status(200).json({ 
        success: true, 
        message: 'Votes submitted successfully',
        votesCount: validVotes.length
      });
    } catch (transactionError) {
      await session.endSession();
      throw transactionError;
    }
  } catch (error) {
    console.error('Vote submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

