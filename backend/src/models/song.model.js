const mongoose = require("mongoose");

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  artist: {
    type: String,
    required: true,
    trim: true,
  },

  audio: {
    type: String,
    required: true,
  },

  category: {
    type: String,
    required: true,
    enum: ["happy", "sad", "neutral","angry","excited"],
    lowercase: true,
    trim: true,
  },
});
  songSchema.index(
  { title: 1, artist: 1 },
  { unique: true }
  );
const song = mongoose.model("song", songSchema);

module.exports = song;