import React, { useEffect, useState } from "react";

export default function ViewDedication({ id: propId }) {
  const [data, setData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [approved, setApproved] = useState(false);

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
          console.debug("ML service response:", res.status, json);

          const prob = Number(
            json?.blowProb ??
              json?.prob ??
              json?.probability ??
              json?.probability ??
              0
          );
          const THRESH = 0.55;

          if (prob > THRESH) {
            setApproved(true);
            handleNext();
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
      setTimeout(() => mediaRecorder.stop(), 2000); // record ~2s
    } catch (err) {
      console.error("Microphone access or MediaRecorder error:", err);
      alert("Microphone access denied or detection error");
      setIsDetecting(false);
    }
  };

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
          src={currentVideo}
          controls
          autoPlay
          playsInline
          style={{
            width: "90%",
            maxWidth: "600px",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
        />
      ) : (
        <div>No video available</div>
      )}

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
