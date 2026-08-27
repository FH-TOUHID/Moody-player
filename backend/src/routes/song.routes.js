const express = require("express");
const multer = require("multer");

const uploadFile = require("../service/storage.service");
const Song = require("../models/song.model");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});
router.get("/songs/:mood", async (req, res) => {
  try {
    const mood = req.params.mood.toLowerCase();

    const allowedMoods = [
      "happy",
      "sad",
      "neutral",
      "angry",
      "excited",
    ];

    if (!allowedMoods.includes(mood)) {
      return res.status(400).json({
        message: "Invalid mood",
      });
    }

    const songs = await Song.find({ 
      category: mood,
    });

    res.status(200).json({
      mood,
      songs,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});
router.post("/songs", upload.single("audio"), async (req, res) => {
  try {
    const { title, artist, category } = req.body;

    // Check duplicate first
    const existingSong = await Song.findOne({
      title: title.trim(),
      artist: artist.trim(),
    });

    if (existingSong) {
      return res.status(409).json({
        message: "This song already exists",
      });
    }

    // Upload audio to ImageKit through storage.service.js
    const result = await uploadFile(req.file);

    // Save song information in MongoDB
    const newSong = await Song.create({
      title,
      artist,
      audio: result.url,
      category,
    });

    res.status(201).json({
      message: "Song uploaded successfully",
      song: newSong,
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This song already exists",
      });
    }

    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;