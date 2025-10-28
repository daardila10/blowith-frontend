import { useEffect, useState } from "react";

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
      const res = await fetch(`https://blowithback.onrender.com/view/${id}`);
      const json = await res.json();
      setData(json);
    }

    fetchVideo();
  }, [propId]);

  // -----------------------------
  // 🧠 Function to detect blow via ML model
  // -----------------------------
  const detectBlow = async () => {
    try {
      setIsDetecting(true);
      setApproved(false);

      // Capture audio (for 2 seconds for example)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("file", blob, "blow.wav");

        // Send to ML API
        const res = await fetch(
          "https://blow-mlservice.onrender.com/classify",
          {
            method: "POST",
            body: formData,
          }
        );
        const json = await res.json();

        // Example response: { approved: true/false, confidence: 0.94 }
        if (json.approved) {
          setApproved(true);
          handleNext();
        } else {
          alert("❌ Blow not detected, please try again!");
        }
        setIsDetecting(false);
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 2000); // record 2s
    } catch (err) {
      console.error(err);
      alert("Microphone access denied or detection error");
      setIsDetecting(false);
    }
  };

  const handleNext = () => {
    setCurrentIndex((currentIndex + 1) % (data?.videoLinks?.length || 1));
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
            {isDetecting ? "Listening..." : "🎤 Blow to continue"}
          </button>
        </div>
      )}
    </div>
  );
}
