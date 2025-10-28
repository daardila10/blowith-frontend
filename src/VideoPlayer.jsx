import { useEffect, useRef, useState } from "react";
import videoMap from "./videoMap";

export default function VideoPlayer({ publicId }) {
  const videoRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [blowDetected, setBlowDetected] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videos, setVideos] = useState([]);

  // ✅ Step 1: Fetch video info from your existing backend route
  useEffect(() => {
    async function fetchVideoData() {
      try {
        const res = await fetch(
          `https://blowithback.onrender.com/view/${publicId}`
        );
        const data = await res.json();

        if (data && data.message) {
          const category = data.message.toLowerCase(); // example: "candle"
          console.log("🎥 Video category:", category);
          setVideos(videoMap[category] || []);
        } else {
          console.warn("No valid message/category found for this video");
        }
      } catch (err) {
        console.error("Error fetching video info:", err);
      }
    }
    fetchVideoData();
  }, [publicId]);

  // ✅ Step 2: Microphone + blow detection
  useEffect(() => {
    let mediaRecorder;
    let chunks = [];

    async function startListening() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

        mediaRecorder.ondataavailable = (e) => {
          chunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("file", blob, "audio.webm");

          try {
            // ✅ Use your deployed ML service
            const res = await fetch(
              "https://blow-mlservice.onrender.com/classify",
              {
                method: "POST",
                body: formData,
              }
            );
            const data = await res.json();

            // You can adjust the threshold if needed
            if (data.blowProb > 0.5) {
              setBlowDetected(true);
              console.log("🎉 Blow detected! Probability:", data.blowProb);
            }
          } catch (err) {
            console.error("Error sending audio to ML service:", err);
          }

          chunks = [];
          setTimeout(() => mediaRecorder.start(), 2000);
        };

        mediaRecorder.start();
        setInterval(() => {
          if (mediaRecorder.state === "recording") mediaRecorder.stop();
        }, 2000);
      } catch (err) {
        console.error("Microphone access denied or not available", err);
      }
    }

    if (!isListening) {
      setIsListening(true);
      startListening();
    }

    return () => {
      mediaRecorder?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, [isListening]);

  // ✅ Step 3: Change video when blow detected
  useEffect(() => {
    if (blowDetected && videos.length > 0) {
      const nextIndex = (currentIndex + 1) % videos.length;
      setCurrentIndex(nextIndex);
      setBlowDetected(false);
    }
  }, [blowDetected]);

  if (videos.length === 0) {
    return <p>⚠️ No videos found for: {publicId}</p>;
  }

  return (
    <div style={{ textAlign: "center" }}>
      <video
        ref={videoRef}
        key={currentIndex}
        src={videos[currentIndex]}
        controls
        autoPlay
        playsInline
        style={{
          width: "80%",
          maxWidth: "600px",
          marginTop: "16px",
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}
      />
      <p style={{ marginTop: "12px" }}>
        🎬 Current video: {currentIndex + 1} / {videos.length}
      </p>
    </div>
  );
}
