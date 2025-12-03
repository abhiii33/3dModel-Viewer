
import Settings from '../models/Settings.js';

export const getSettings = async (req, res) => {
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
}

export const postSettings= async (req, res) => {
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
}