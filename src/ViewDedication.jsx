import React, { useEffect, useState, useRef } from "react";

export default function ViewDedication({ id: propId }) {
  const [data, setData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [approved, setApproved] = useState(false);
  const preloadRef = useRef(null); // preloader for next video

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

  // When currentIndex changes → preload next video
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
          console.debug("ML service response:", res.status, json);

          const prediction = json?.prediction || "";
          const prob = Number(json?.probability ?? 0);
          const THRESH = 0.55;

          if (prediction.toLowerCase() === "blow" && prob > THRESH) {
            console.log("✅ Blow detected with probability:", prob);
            setApproved(true);
            handleNext();
          } else {
            console.warn(
              "❌ Not a blow. Prediction:",
              prediction,
              "Prob:",
              prob
            );
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
    <div
      style={{
        textAlign: "center",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: "100vh",
      }}
    >
      {/* === VIDEO === */}
      {currentVideo ? (
        <video
          key={currentVideo}
          src={currentVideo}
          controls
          autoPlay
          playsInline
          style={{
            width: "95%",
            maxWidth: "900px",
            borderRadius: "16px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
            marginBottom: "20px",
            transition: "opacity 0.6s ease-in-out",
          }}
        />
      ) : (
        <div>No video available</div>
      )}

      {/* Hidden preloader */}
      <video ref={preloadRef} preload="auto" style={{ display: "none" }} />

      {/* === MESSAGE === */}
      <div style={{ width: "100%", maxWidth: "800px" }}>
        <h2>🎁 Dedication</h2>
        <p>
          <strong>From:</strong> {data.senderName}
        </p>
        <p>
          <strong>To:</strong> {data.receiverName}
        </p>
        <p
          style={{
            background: "#f9f9f9",
            padding: "12px",
            borderRadius: "8px",
            marginTop: "8px",
            fontSize: "1.1em",
          }}
        >
          {data.message}
        </p>

        {videoLinks.length > 1 && (
          <div style={{ marginTop: "20px" }}>
            <button
              onClick={detectBlow}
              disabled={isDetecting}
              style={{
                backgroundColor: isDetecting ? "#bbb" : "#007bff",
                color: "white",
                border: "none",
                padding: "12px 20px",
                borderRadius: "10px",
                cursor: isDetecting ? "not-allowed" : "pointer",
                fontSize: "1.1em",
              }}
            >
              {isDetecting
                ? "🎤 Listening..."
                : approved
                ? "✅ Blow detected"
                : "🌬️  continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
