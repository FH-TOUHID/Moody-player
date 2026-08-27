import React, { useCallback, useEffect, useState } from "react";

import Header from "../components/Header";
import WebcamCapture from "../components/WebcamCapture";
import TrackList from "../components/TrackList";

const Home = () => {
  const [isListening, setIsListening] = useState(false);

  // This will contain ONLY the final confirmed mood
  const [detectedMood, setDetectedMood] = useState(null);

  const [tracks, setTracks] = useState([]);

  const [loading, setLoading] = useState(false);

  // Start / manually stop camera
  const handleStartListening = () => {
    setIsListening((previous) => !previous);
  };

  // WebcamCapture calls this ONLY after
  // it finishes observing the face
  const handleMoodConfirmed = useCallback((mood) => {
    console.log("Final confirmed mood:", mood);

    // Save final mood
    setDetectedMood(mood);

    // Automatically turn camera off
    setIsListening(false);
  }, []);

  // Fetch songs only when FINAL mood changes
  useEffect(() => {
    if (!detectedMood) {
      return;
    }

    const fetchSongs = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `http://localhost:3000/songs/${detectedMood}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch songs");
        }

        const data = await response.json();

        console.log("Recommended songs:", data.songs);

        setTracks(data.songs);
      } catch (error) {
        console.error("Song fetching error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [detectedMood]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">
      <Header />

      <main className="max-w-5xl mx-auto px-6 pb-24 mt-4">
        <WebcamCapture
          onStart={handleStartListening}
          isListening={isListening}
          onMoodConfirmed={handleMoodConfirmed}
        />

        <TrackList
          tracks={tracks}
          mood={detectedMood}
          loading={loading}
          isListening={isListening}
        />
      </main>
    </div>
  );
};

export default Home;
