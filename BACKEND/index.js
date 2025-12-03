
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './src/db/db.js';
import upload from './src/middleware/upload.js';
import settingsRoute from './src/router/settings.route.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

connectDB();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://3d-model-viewer-git-main-abhiii33s-projects.vercel.app"
    ],
    credentials: true,
  })
);


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

app.use('/api/v1/users', settingsRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
