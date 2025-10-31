import React, { useEffect, useState, useRef } from "react";

export default function ViewDedication({ id: propId }) {
  const [data, setData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [started, setStarted] = useState(false);
  const preloadRef = useRef(null);
  const videoRef = useRef(null);

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
    setCurrentIndex((i) => (i + 1) % (data?.videoLinks?.length || 1));
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
      const mediaRecorder = new MediaRecorder(
        stream,
        mime ? { mimeType: mime } : undefined
      );
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, {
            type: chunks[0]?.type || mime || "audio/wav",
          });
          const ext = blob.type.includes("webm")
            ? "webm"
            : blob.type.includes("ogg")
            ? "ogg"
            : "wav";
          const formData = new FormData();
          formData.append("file", blob, `blow.${ext}`);

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
          console.error("Error sending audio:", e);
        } finally {
          setIsDetecting(false);
          stream.getTracks().forEach((t) => t.stop());
        }
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 2000);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone access denied or error");
      setIsDetecting(false);
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
        background: "black",
      }}
    >
      {/* === FULLSCREEN VIDEO === */}
      {currentVideo && (
        <video
          ref={videoRef}
          key={currentVideo}
          src={currentVideo}
          autoPlay={started}
          playsInline
          muted={false}
          controls={false}
          onEnded={() => handleNext()}
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 1,
            backgroundColor: "black",
          }}
        />
      )}

      {/* preload next video */}
      <video ref={preloadRef} preload="auto" style={{ display: "none" }} />

      {/* === BOTTOM OVERLAY === */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          padding: "24px",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1))",
          color: "white",
          textAlign: "center",
          zIndex: 2,
        }}
      >
        {/* Start or Continue Button */}
        <button
          onClick={() => {
            if (!started) setStarted(true);
            else detectBlow();
          }}
          disabled={isDetecting}
          style={{
            width: "80%",
            maxWidth: "300px",
            backgroundColor: isDetecting ? "#666" : "#ff4d4f",
            color: "white",
            border: "none",
            padding: "14px 20px",
            borderRadius: "12px",
            fontSize: "1.1em",
            cursor: isDetecting ? "not-allowed" : "pointer",
            marginBottom: "20px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          }}
        >
          {!started
            ? "▶️ Start Experience"
            : isDetecting
            ? "🎤 Listening..."
            : "🌬️ Continue"}
        </button>

        {/* Message Section */}
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <p style={{ marginBottom: "4px", fontWeight: "bold" }}>
            From: {data.senderName}
          </p>
          <p style={{ marginBottom: "4px", fontWeight: "bold" }}>
            To: {data.receiverName}
          </p>
          <p style={{ fontSize: "1.1em", lineHeight: "1.4em" }}>
            {data.message}
          </p>
        </div>
      </div>
    </div>
  );
}
