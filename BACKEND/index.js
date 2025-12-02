
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './db/db.js';
import upload from './middleware/upload.js';
import Settings from './models/Settings.js';
import path from 'path';

dotenv.config();

connectDB();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
}));
app.use(express.json())

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  res.send(`/${req.file.path.replace(/\\/g, '/')}`);
});

app.post('/api/settings', async (req, res) => {
  const { backgroundColor, wireframe } = req.body;
  try {
    const settings = new Settings({
      backgroundColor,
      wireframe,
    });
    const createdSettings = await settings.save();
    res.status(201).json(createdSettings);
  } catch (error) {
    res.status(400).json({ message: 'Error saving settings' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.findOne().sort({ timestamp: -1 });
    if (settings) {
      res.json(settings);
    } else {
      res.json({ backgroundColor: '#dddddd', wireframe: false }); // Default
    }
  } catch (error) {
    res.status(400).json({ message: 'Error fetching settings' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
