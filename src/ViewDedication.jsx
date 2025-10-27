import { useEffect, useState } from "react";

// 🧩 Example mapping between group keys and actual video URLs
const videoGroups = {
  sensi1: [
    "https://res.cloudinary.com/do6ea0ear/video/upload/v1734723456/sensi1_1.mp4",
    
  ],


  puff1: [
    "https://res.cloudinary.com/do6ea0ear/video/upload/v1759161847/puff3_ywhjvy.mp4",
  ],
};



export default function ViewDedication({ id: propId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const id =
      propId ||
      new URLSearchParams(window.location.search).get("id") ||
      window.location.pathname.match(/\/view\/([^\/]+)/)?.[1];

    if (!id) {
      setError("No id provided");
      setLoading(false);
      return;
    }

    async function fetchVideo() {
      try {
        const res = await fetch(
          `https://blowithback.onrender.com/view/${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("❌ fetch error:", err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchVideo();
  }, [propId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!data) return <div>No data found</div>;

  const groupVideos = videoGroups[data.videoGroupKey] || [];
  const videoUrl = groupVideos[currentIndex];

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

      {videoUrl ? (
        <video
          key={videoUrl}
          src={videoUrl}
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
        <div>No video available for group "{data.videoGroupKey}"</div>
      )}

      {groupVideos.length > 1 && (
        <div style={{ marginTop: "12px" }}>
          <button
            onClick={() =>
              setCurrentIndex(
                (currentIndex - 1 + groupVideos.length) % groupVideos.length
              )
            }
          >
            ◀ Prev
          </button>
          <button
            style={{ marginLeft: "10px" }}
            onClick={() =>
              setCurrentIndex((currentIndex + 1) % groupVideos.length)
            }
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  );
}
