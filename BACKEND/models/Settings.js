import mongoose from 'mongoose';
const settingsSchema = mongoose.Schema({
  backgroundColor: {
    type: String,
    required: true,
  },
  wireframe: {
    type: Boolean,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;

