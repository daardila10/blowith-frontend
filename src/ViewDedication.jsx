import React, { useEffect, useState, useRef } from "react";

export default function ViewDedication({ id: propId }) {
  const [data, setData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [experienceEnded, setExperienceEnded] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef(null);
  const preloadRef = useRef(null);

  useEffect(() => {
    const id =
      propId ||
      new URLSearchParams(window.location.search).get("id") ||
      window.location.pathname.match(/\/view\/([^\/]+)/)?.[1];

    if (!id) return;

    async function fetchVideo() {
      try {
        const res = await fetch(`https://blowithback.onrender.com/view/${id}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Failed to fetch view data", e);
      }
    }

    fetchVideo();
  }, [propId]);

  // preload next video
  useEffect(() => {
    if (!data?.videoLinks?.length) return;
    const nextIndex = (currentIndex + 1) % data.videoLinks.length;
    const nextVideo = data.videoLinks[nextIndex];
    if (preloadRef.current && nextVideo) {
      preloadRef.current.src = nextVideo;
      preloadRef.current.load();
    }
  }, [currentIndex, data]);

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < data.videoLinks.length) {
      setCurrentIndex(nextIndex);
    } else {
      setExperienceEnded(true);
      setCurrentIndex(0);
    }
  };

  const detectBlow = async () => {
    try {
      setIsDetecting(true);
      setApproved(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg")
        ? "audio/ogg"
        : "audio/wav";
      const mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: mime });
          const formData = new FormData();
          formData.append("file", blob, "blow.wav");

          const res = await fetch(
            "https://blow-mlservice.onrender.com/classify",
            {
              method: "POST",
              body: formData,
            }
          );

          const json = await res.json();
          const prediction = json?.prediction || "";
          const prob = Number(json?.probability ?? 0);
          const THRESH = 0.55;

          if (prediction.toLowerCase() === "blow" && prob > THRESH) {
            setApproved(true);
            handleNext();
          } else {
            alert("❌ Blow not detected, please try again!");
          }
        } catch (e) {
          console.error("Error sending audio to ML service:", e);
        } finally {
          setIsDetecting(false);
          stream.getTracks().forEach((t) => t.stop());
        }
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 2000);
    } catch (err) {
      alert("Microphone access denied or detection error");
      setIsDetecting(false);
    }
  };

  const handleVideoTap = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play();
    else videoRef.current.pause();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  if (!data) return <div>Loading...</div>;

  const videoLinks = data.videoLinks || [];
  const currentVideo = videoLinks[currentIndex];

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "black",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* === Video === */}
      {currentVideo ? (
        <video
          key={currentVideo}
          ref={videoRef}
          src={currentVideo}
          autoPlay
          playsInline
          muted={muted}
          onClick={handleVideoTap}
          onEnded={handleNext}
          style={{
            width: "90vw",
            maxWidth: "600px",
            height: "auto",
            maxHeight: "90vh",
            borderRadius: "12px",
            objectFit: "cover",
            boxShadow: "0 0 30px rgba(0,0,0,0.6)",
          }}
        />
      ) : (
        <div>No video available</div>
      )}

      {/* === Mute/Unmute Icon === */}
      <div
        onClick={toggleMute}
        style={{
          position: "absolute",
          top: "15px",
          right: "15px",
          fontSize: "1.6em",
          color: "white",
          cursor: "pointer",
          userSelect: "none",
          background: "rgba(0,0,0,0.4)",
          borderRadius: "50%",
          padding: "8px",
        }}
      >
        {muted ? "🔇" : "🔊"}
      </div>

      {/* === Action Button === */}
      <div
        style={{
          position: "absolute",
          bottom: "90px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <button
          onClick={
            experienceEnded ? () => setExperienceEnded(false) : detectBlow
          }
          disabled={isDetecting}
          style={{
            backgroundColor: isDetecting ? "#777" : "#ff3366",
            color: "white",
            border: "none",
            padding: "12px 26px",
            borderRadius: "30px",
            fontSize: "1.1em",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(255, 51, 102, 0.5)",
          }}
        >
          {experienceEnded
            ? "🔁 Replay Experience"
            : isDetecting
            ? "🎤 Listening..."
            : approved
            ? "✅ Continue"
            : "▶️ Start Experience"}
        </button>
      </div>

      {/* === Dedication Info === */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: 0,
          width: "100%",
          color: "white",
          textAlign: "center",
          padding: "0 20px",
          background:
            "linear-gradient(transparent, rgba(0, 0, 0, 0.7) 70%, rgba(0, 0, 0, 0.9))",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "1.1em",
            marginBottom: "6px",
          }}
        >
          <span>From: {data.senderName}</span>
          <span>To: {data.receiverName}</span>
        </div>
        <p
          style={{
            fontSize: "1.2em",
            fontWeight: "400",
            margin: "8px 0 0",
            opacity: 0.9,
          }}
        >
          {data.message}
        </p>
      </div>

      {/* Hidden preloader */}
      <video ref={preloadRef} preload="auto" style={{ display: "none" }} />
    </div>
  );
}
