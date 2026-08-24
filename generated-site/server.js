const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// POST /api/inquire endpoint for handling user inquiries
app.post('/api/inquire', (req, res) => {
  const { name, email, type, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, email, and message.'
    });
  }

  // Simulate processing the inquiry
  console.log(`[ROAST] New Inquiry: ${name} (${email}) - Type: ${type || 'General'}`);

  // Return success response
  res.status(201).json({
    success: true,
    message: 'Thank you for your inquiry. Our team will contact you shortly.',
    data: {
      id: Date.now(),
      receivedAt: new Date().toISOString()
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`ROAST API server running on port ${PORT}`);
});