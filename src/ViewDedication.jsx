import { useEffect, useState } from "react";

export default function ViewDedication({ id: propId }) {
  const [data, setData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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
        <div style={{ marginTop: "12px" }}>
          <button
            onClick={() =>
              setCurrentIndex(
                (currentIndex - 1 + videoLinks.length) % videoLinks.length
              )
            }
          >
            ◀ Prev
          </button>
          <button
            style={{ marginLeft: "10px" }}
            onClick={() =>
              setCurrentIndex((currentIndex + 1) % videoLinks.length)
            }
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  );
}
