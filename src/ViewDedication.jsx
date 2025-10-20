import { useEffect, useState } from "react";

export default function ViewDedication({ id: propId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id =
      propId ||
      params.get("id") ||
      window.location.pathname.match(/\/view\/([^\/]+)/)?.[1];
    console.log("[ViewDedication] id:", id);

    if (!id) {
      setError("No id provided");
      setLoading(false);
      return;
    }

    async function fetchVideo() {
      try {
        const url = `http://${
          window.location.hostname
        }:3000/view/${encodeURIComponent(id)}`;
        console.log("[ViewDedication] fetching", url);
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        console.log("[ViewDedication] json:", json);
        setData(json);
      } catch (err) {
        console.error("[ViewDedication] fetch error:", err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchVideo();
  }, [propId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!data) return <div>No data</div>;

  const videoUrl = data.videoId
    ? `https://res.cloudinary.com/do6ea0ear/video/upload/${data.videoId}.mp4`
    : null;

  return (
    <div>
      <h3>Dedication</h3>
      <div>
        <strong>From:</strong> {data.senderName || "—"}
      </div>
      <div>
        <strong>To:</strong> {data.receiverName || "—"}
      </div>
      <div>
        <strong>Message:</strong> {data.message || "—"}
      </div>
      {videoUrl ? (
        <video src={videoUrl} controls style={{ maxWidth: "100%" }} />
      ) : (
        <div>No video available</div>
      )}
    </div>
  );
}
