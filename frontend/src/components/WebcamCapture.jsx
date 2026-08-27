import React, { useRef, useEffect, useState } from "react";

import * as faceapi from "face-api.js";

const normalizeMood = (mood) => {
  const moodMap = {
    happy: "happy",
    sad: "sad",
    neutral: "neutral",
    angry: "angry",

    // face-api gives "surprised"
    // but your database category is "excited"
    surprised: "excited",

    fearful: "sad",
    disgusted: "angry",
  };

  return moodMap[mood] || "neutral";
};

const WebcamCapture = ({ onStart, isListening, onMoodConfirmed }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const moodSamplesRef = useRef([]);

  // Prevent sending final mood more than once
  const confirmedRef = useRef(false);

  const [modelsLoaded, setModelsLoaded] = useState(false);

  const [detectedMood, setDetectedMood] = useState(null);

  // ==========================================
  // LOAD FACE API MODELS
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/Models"),

          faceapi.nets.faceExpressionNet.loadFromUri("/Models"),
        ]);

        if (!cancelled) {
          setModelsLoaded(true);
        }
      } catch (error) {
        console.error("Model loading error:", error);
      }
    };

    loadModels();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // CAMERA START / STOP
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => {
            track.stop();
          });

          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Camera error:", error);

        alert("Please allow camera permission.");
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });

        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Only clear the temporary live mood.
      // Do NOT clear the mood in Home.jsx.
      setDetectedMood(null);
    };

    if (isListening) {
      // Fresh detection session
      moodSamplesRef.current = [];

      confirmedRef.current = false;

      setDetectedMood(null);

      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      cancelled = true;

      stopCamera();
    };
  }, [isListening]);

  // ==========================================
  // MOOD DETECTION
  // ==========================================

  useEffect(() => {
    if (!isListening || !modelsLoaded) {
      return;
    }

    let detectionRunning = false;

    const detectMood = async () => {
      const video = videoRef.current;

      if (
        !video ||
        video.readyState < 2 ||
        detectionRunning ||
        confirmedRef.current
      ) {
        return;
      }

      detectionRunning = true;

      try {
        const result = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        // If no face is found,
        // don't count it as a sample.
        if (!result) {
          setDetectedMood(null);

          return;
        }

        const expressions = result.expressions;

        // Find expression with highest score
        const detectedExpression = Object.entries(expressions).reduce(
          (highest, current) => (current[1] > highest[1] ? current : highest),
        )[0];

        // Convert face-api expression
        // to one of your DB categories
        const mood = normalizeMood(detectedExpression);

        // Display live result
        setDetectedMood(mood);

        // Save this detection
        moodSamplesRef.current.push(mood);

        console.log("Mood samples:", moodSamplesRef.current);

        // ====================================
        // WAIT FOR 5 VALID DETECTIONS
        // ====================================

        if (moodSamplesRef.current.length >= 5) {
          const counts = {};

          moodSamplesRef.current.forEach((sample) => {
            counts[sample] = (counts[sample] || 0) + 1;
          });

          // Example:
          //
          // happy
          // happy
          // neutral
          // happy
          // happy
          //
          // Result:
          // happy = 4
          // neutral = 1

          const finalMood = Object.entries(counts).reduce((highest, current) =>
            current[1] > highest[1] ? current : highest,
          )[0];

          console.log("Final confirmed mood:", finalMood);

          // Prevent another confirmation
          confirmedRef.current = true;

          // Send ONLY ONE final mood
          // to Home.jsx
          onMoodConfirmed(finalMood);
        }
      } catch (error) {
        console.error("Mood detection error:", error);
      } finally {
        detectionRunning = false;
      }
    };

    // Start immediately
    detectMood();

    // Then analyze every second
    const intervalId = setInterval(detectMood, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isListening, modelsLoaded, onMoodConfirmed]);

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="mt-8">
      <div className="flex flex-col md:flex-row gap-10 items-center">
        {/* CAMERA */}

        <div className="w-full md:w-[500px] h-[340px] rounded-2xl overflow-hidden shadow-sm relative shrink-0 bg-gray-900 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {!isListening && (
            <p className="absolute text-gray-400 font-medium">Camera is off</p>
          )}

          {isListening && (
            <div className="absolute top-4 right-4 bg-white/90 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
              {!modelsLoaded
                ? "Loading AI model..."
                : detectedMood
                  ? `Analyzing: ${detectedMood}`
                  : "Finding face..."}
            </div>
          )}
        </div>

        {/* INFORMATION */}

        <div className="flex flex-col items-start max-w-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Live Mood Detection
          </h3>

          <p className="text-base text-indigo-500/80 leading-relaxed mb-8">
            {isListening
              ? detectedMood
                ? `Analyzing your mood: ${detectedMood}`
                : "Look directly at the camera while we analyze your mood."
              : "Start listening to detect your mood and get song recommendations."}
          </p>

          <button
            onClick={onStart}
            className={`text-base font-medium py-3 px-8 rounded-full transition-colors ${
              isListening
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {isListening ? "Stop Listening" : "Start Listening"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebcamCapture;
