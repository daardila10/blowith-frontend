import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function VideoExperience() {
  const videos = [
    {
      src: "/videos/video1.mp4",
      from: "Alice",
      to: "Bob",
      message: "Be brave!",
    },
    {
      src: "/videos/video2.mp4",
      from: "Bob",
      to: "Alice",
      message: "Stay strong!",
    },
  ];

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const currentRef = useRef(null);
  const nextRef = useRef(null);
  const nextIndex = (index + 1) % videos.length;

  // ✅ Preload next video
  useEffect(() => {
    if (nextRef.current) nextRef.current.load();
  }, [index]);

  const handleEnd = () => {
    setPlaying(false);
    setTimeout(() => setIndex(nextIndex), 150);
  };

  const togglePlay = () => {
    const video = currentRef.current;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-black flex flex-col items-center justify-center">
      {/* 🎥 Video container */}
      <div
        className="
          relative overflow-hidden
          w-[95%] sm:w-[85%] md:w-[70%] lg:w-[60%]
          h-[60vh] sm:h-[60vh] md:h-[55vh] lg:h-[50vh]
          rounded-2xl shadow-lg
        "
      >
        <AnimatePresence mode="popLayout">
          <motion.video
            key={videos[index].src}
            ref={currentRef}
            src={videos[index].src}
            className="absolute w-full h-full object-cover rounded-2xl"
            autoPlay={playing}
            muted
            onClick={togglePlay}
            onEnded={handleEnd}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }} // ⚡️ Fast fade
          />
        </AnimatePresence>

        {/* Preload next video */}
        <video
          ref={nextRef}
          src={videos[nextIndex].src}
          className="hidden"
          preload="auto"
        />
      </div>

      {/* ✉️ Info section */}
      <div className="flex justify-between w-[90%] sm:w-[80%] mt-3 text-white text-sm font-semibold">
        <span>From: {videos[index].from}</span>
        <span>To: {videos[index].to}</span>
      </div>

      <p className="text-white mt-2 text-center px-4">
        {videos[index].message}
      </p>

      {/* 🟢 Button lower on screen */}
      <button
        onClick={togglePlay}
        className="absolute bottom-6 bg-white/80 text-black font-semibold py-2 px-5 rounded-full shadow-lg"
      >
        {playing ? "Pause" : "Start Experience"}
      </button>
    </div>
  );
}
