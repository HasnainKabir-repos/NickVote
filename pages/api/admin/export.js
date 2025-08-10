const { connectToDatabase, getVotingResults } = require('../../../lib/mongodb');
const { verifyToken } = require('../../../lib/auth');
const XLSX = require('xlsx');

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
    
    // Get voting results
    const results = await getVotingResults();
    
    // Format data for Excel export
    const excelData = results.map(result => ({
      'Student Name': result.name,
      'Winning Nickname': result.winning_nickname
    }));

    try {
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Nickname Results');

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx' 
      });

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="nickname-voting-results.xlsx"');
      res.setHeader('Content-Length', excelBuffer.length);

      // Send the Excel file
      res.send(excelBuffer);
    } catch (excelError) {
      console.error('Excel generation error:', excelError);
      res.status(500).json({ error: 'Failed to generate Excel file' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

