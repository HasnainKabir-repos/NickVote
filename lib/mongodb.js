const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI

// Connection state
let isConnected = false;

// Connect to MongoDB
async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Student Schema
const studentSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  hasVoted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Vote Schema
const voteSchema = new mongoose.Schema({
  voterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  targetStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50
  }
}, {
  timestamps: true
});

// Create models
const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
const Vote = mongoose.models.Vote || mongoose.model('Vote', voteSchema);

function generatePassword(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

async function seedDataFromExcel(inputFilePath, outputFilePath) {
  try {
    await connectToDatabase();

    const existingStudents = await Student.countDocuments();
    if (existingStudents >= 58) {
      console.log('Data already seeded');
      return;
    }

    // Read the input Excel file
    const workbook = xlsx.readFile(inputFilePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const saltRounds = 10;
    const studentDocs = [];
    const outputData = [];

    for (let row of sheetData) {
      const username = row.Email.trim();
      const name = row.Name.trim();
      const plainPassword = generatePassword(10);
      const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

      studentDocs.push({
        username,
        password: hashedPassword,
        name,
        hasVoted: false
      });

      // Prepare for output file
      outputData.push({
        email: username,
        name,
        password: plainPassword
      });
    }

    // Save to DB
    await Student.insertMany(studentDocs);
    console.log(`Inserted ${studentDocs.length} students.`);

    // Create admin
    const adminPasswordPlain = '12345678a@A';
    const adminPasswordHashed = await bcrypt.hash(adminPasswordPlain, saltRounds);
    await Admin.create({
      username: 'admin@nickvote.com',
      password: adminPasswordHashed
    });
    outputData.push({
      email: 'admin@nickvote.com',
      name: 'Admin User',
      password: adminPasswordPlain
    });

    // Write passwords to new Excel
    const outputWb = xlsx.utils.book_new();
    const outputWs = xlsx.utils.json_to_sheet(outputData);
    xlsx.utils.book_append_sheet(outputWb, outputWs, 'Passwords');
    xlsx.writeFile(outputWb, outputFilePath);

    console.log(`Passwords saved to ${outputFilePath}`);

  } catch (error) {
    console.error('Error seeding data from Excel:', error);
    throw error;
  }
}


// Get voting results with winner determination
async function getVotingResults() {
  try {
    await connectToDatabase();

    // Get all students
    const students = await Student.find({}).sort({ name: 1 }).lean();
    
    // Get all votes with populated student data
    const votes = await Vote.find({})
      .populate('targetStudentId', 'name')
      .sort({ createdAt: 1 })
      .lean();

    // Process results for each student
    const results = students.map(student => {
      // Find votes for this student
      const studentVotes = votes.filter(vote => 
        vote.targetStudentId._id.toString() === student._id.toString()
      );

      if (studentVotes.length === 0) {
        return {
          id: student._id,
          name: student.name,
          username: student.username,
          winning_nickname: 'No nickname suggested',
          vote_count: 0,
          first_suggested: null
        };
      }

      // Group votes by nickname
      const nicknameGroups = {};
      studentVotes.forEach(vote => {
        if (!nicknameGroups[vote.nickname]) {
          nicknameGroups[vote.nickname] = {
            count: 0,
            firstSuggested: vote.createdAt
          };
        }
        nicknameGroups[vote.nickname].count++;
        
        // Keep track of the earliest suggestion for tie-breaking
        if (vote.createdAt < nicknameGroups[vote.nickname].firstSuggested) {
          nicknameGroups[vote.nickname].firstSuggested = vote.createdAt;
        }
      });

      // Find the winning nickname (highest count, earliest if tied)
      let winningNickname = null;
      let maxCount = 0;
      let earliestTime = null;

      Object.entries(nicknameGroups).forEach(([nickname, data]) => {
        if (data.count > maxCount || 
            (data.count === maxCount && (!earliestTime || data.firstSuggested < earliestTime))) {
          winningNickname = nickname;
          maxCount = data.count;
          earliestTime = data.firstSuggested;
        }
      });

      return {
        id: student._id,
        name: student.name,
        username: student.username,
        winning_nickname: winningNickname,
        vote_count: maxCount,
        first_suggested: earliestTime
      };
    });

    return results;
  } catch (error) {
    console.error('Error getting voting results:', error);
    throw error;
  }
}

// Get voting statistics
async function getVotingStatistics() {
  try {
    await connectToDatabase();

    const totalVoters = await Student.countDocuments({ hasVoted: true });
    const totalVotes = await Vote.countDocuments();
    const studentsWithVotes = await Vote.distinct('targetStudentId').then(ids => ids.length);

    return {
      total_voters: totalVoters,
      total_votes: totalVotes,
      students_with_votes: studentsWithVotes
    };
  } catch (error) {
    console.error('Error getting voting statistics:', error);
    throw error;
  }
}

module.exports = {
  connectToDatabase,
  Student,
  Admin,
  Vote,
  seedDataFromExcel,
  getVotingResults,
  getVotingStatistics
};

