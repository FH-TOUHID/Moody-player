import React, { useEffect, useRef, useState } from "react";

import TrackItem from "./TrackItem";

const TrackList = ({ tracks, mood, loading, error, isListening }) => {
  const audioPlayerRef = useRef(null);

  const [currentTrackId, setCurrentTrackId] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);

  // ==========================================
  // CREATE ONE AUDIO PLAYER
  // ==========================================

  useEffect(() => {
    const audio = new Audio();

    audioPlayerRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);

      setCurrentTrackId(null);
    };

    return () => {
      audio.pause();

      audio.src = "";

      audioPlayerRef.current = null;
    };
  }, []);

  // ==========================================
  // STOP MUSIC WHEN CAMERA STARTS
  // ==========================================

  useEffect(() => {
    if (isListening && audioPlayerRef.current) {
      const audio = audioPlayerRef.current;

      // Stop song
      audio.pause();

      // Start from beginning next time
      audio.currentTime = 0;

      // Reset UI
      setIsPlaying(false);

      setCurrentTrackId(null);
    }
  }, [isListening]);

  // ==========================================
  // PLAY / PAUSE SONG
  // ==========================================

  const handlePlay = async (track) => {
    const audio = audioPlayerRef.current;

    if (!audio) {
      return;
    }

    try {
      // SAME SONG CLICKED
      if (currentTrackId === track._id) {
        // Currently playing -> pause
        if (isPlaying) {
          audio.pause();

          setIsPlaying(false);

          return;
        }

        // Currently paused -> resume
        await audio.play();

        setIsPlaying(true);

        return;
      }

      // DIFFERENT SONG CLICKED

      // Stop previous song
      audio.pause();

      // New song
      audio.src = track.audio;

      audio.load();

      await audio.play();

      setCurrentTrackId(track._id);

      setIsPlaying(true);
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  };

  return (
    <div className="mt-14">
      <h3 className="text-2xl font-bold text-gray-900 mb-2 px-3">
        Recommended Tracks
      </h3>

      {mood && (
        <p className="text-sm text-indigo-500 mb-6 px-3">
          Recommendations for your <span className="font-semibold">{mood}</span>{" "}
          mood
        </p>
      )}

      {!mood && !loading && (
        <p className="text-gray-500 px-3 py-4">
          Detect your mood to get personalized song recommendations.
        </p>
      )}

      {loading && (
        <p className="text-gray-500 px-3 py-4">Finding songs for you...</p>
      )}

      {error && <p className="text-red-500 px-3 py-4">{error}</p>}

      {!loading && mood && !error && tracks.length === 0 && (
        <p className="text-gray-500 px-3 py-4">
          No songs found for {mood} mood.
        </p>
      )}

      <div className="flex flex-col gap-1">
        {tracks.map((track) => (
          <TrackItem
            key={track._id}
            title={track.title}
            artist={track.artist}
            isPlaying={currentTrackId === track._id && isPlaying}
            onPlay={() => handlePlay(track)}
          />
        ))}
      </div>
    </div>
  );
};

export default TrackList;
