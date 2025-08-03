const path = require('path');
const fs = require('fs');

module.exports = function (req, res, next) {
  // Extract the file path from the URL
  const filePath = req.path.replace('/uploads/', '');
  const fullPath = path.join(__dirname, '../uploads', filePath);
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  
  // For now, allow public access to all uploads
  // You can add authentication logic here later if needed
  // Example: Check if user has permission to access this specific file
  
  // Serve the file
  res.sendFile(fullPath);
}; 