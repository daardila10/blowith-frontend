import React, { useEffect, useState, useRef } from "react";

export default function ViewDedication({ id: propId }) {
  const [data, setData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const videoRef = useRef(null);
  const preloadRef = useRef(null);

  // Fetch video data
  useEffect(() => {
    const id =
      propId ||
      new URLSearchParams(window.location.search).get("id") ||
      (window.location.pathname.match(/\/view\/([^/]+)/) || [])[1];

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

  // Handle fade + next video
  const handleNext = () => {
    if (!data?.videoLinks?.length) return;
    setIsFading(true);

    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % data.videoLinks.length);
      setIsFading(false);
      setApproved(false);
    }, 400); // fade duration
  };

  // Blow detection
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

          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`ML service returned ${res.status} ${text}`);
          }

          const json = await res.json();
          console.debug("ML service response:", res.status, json);

          const prob = Number(
            json?.probability ?? json?.blowProb ?? json?.prob ?? 0
          );
          const THRESH = 0.55;

          if (prob > THRESH) {
            setApproved(true);
            // advance to next video using functional update
            setCurrentIndex((i) => (i + 1) % (data?.videoLinks?.length || 1));
          } else {
            alert("❌ Blow not detected, please try again!");
          }
        } catch (e) {
          console.error("Error sending audio to ML service:", e);
          alert("Detection failed — check console for details.");
        } finally {
          setIsDetecting(false);
          stream.getTracks().forEach((t) => t.stop());
        }
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 2000); // Record ~2s
    } catch (err) {
      console.error("Microphone access or MediaRecorder error:", err);
      alert("Microphone access denied or detection error");
      setIsDetecting(false);
    }
  };

  // Preload next video for instant playback
  useEffect(() => {
    if (!data?.videoLinks?.length) return;
    const nextIndex = (currentIndex + 1) % data.videoLinks.length;
    const nextVideo = data.videoLinks[nextIndex];
    if (preloadRef.current) {
      preloadRef.current.src = nextVideo;
      preloadRef.current.load();
    }
  }, [currentIndex, data]);

  if (!data) return <div>Loading...</div>;

  const videoLinks = data.videoLinks || [];
  const currentVideo = videoLinks[currentIndex];

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>🎁 Dedication</h2>
      <p>
        <strong>From:</strong> {data.senderName}
      </p>
      <p>
        <strong>To:</strong> {data.receiverName}
      </p>
      <p>
        <strong>Message:</strong> {data.message}
      </p>

      {currentVideo ? (
        <video
          key={currentVideo}
          ref={videoRef}
          src={currentVideo}
          controls
          autoPlay
          playsInline
          style={{
            width: "90%",
            maxWidth: "600px",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            opacity: isFading ? 0 : 1,
            transition: "opacity 0.4s ease-in-out",
          }}
        />
      ) : (
        <div>No video available</div>
      )}

      {/* Hidden preloaded video */}
      <video ref={preloadRef} style={{ display: "none" }} preload="auto" />

      {videoLinks.length > 1 && (
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={detectBlow}
            disabled={isDetecting}
            style={{
              backgroundColor: isDetecting ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: isDetecting ? "not-allowed" : "pointer",
              transition: "background 0.3s",
            }}
          >
            {isDetecting
              ? "Listening..."
              : approved
              ? "✅ Detected"
              : "🎤 Blow to continue"}
          </button>
        </div>
      )}
    </div>
  );
}
