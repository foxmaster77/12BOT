// Generated Backend API Server
import express from 'express';
const app = express();
app.use(express.json());

app.post('/api/inquire', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  return res.status(200).json({
    success: true,
    message: 'Inquiry received. A representative will contact you shortly.'
  });
});

export default app;
