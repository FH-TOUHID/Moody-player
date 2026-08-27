import React from "react";

import { Play, Pause } from "lucide-react";

const TrackItem = ({ title, artist, isPlaying, onPlay }) => {
  return (
    <div className="flex items-center justify-between py-4 px-3">
      <div>
        <p className="text-base font-semibold text-gray-900">{title}</p>

        <p className="text-sm text-indigo-500">{artist}</p>
      </div>

      <button
        onClick={onPlay}
        className="p-2 rounded-full hover:bg-gray-100 transition"
      >
        {isPlaying ? (
          <Pause className="w-6 h-6" />
        ) : (
          <Play className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};

export default TrackItem;
