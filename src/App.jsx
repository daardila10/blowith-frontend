import { useEffect, useState } from "react";

export default function App() {
  const [publicId, setPublicId] = useState(null);

  useEffect(() => {
    // Get the last segment from the current URL
    const pathSegments = window.location.pathname.split("/");
    const idFromUrl = pathSegments[pathSegments.length - 1];
    setPublicId(idFromUrl);
  }, []);

  if (!publicId) {
    return (
      <div style={{ textAlign: "center" }}>
        <h1>Welcome to BlowTenso!</h1>
        <p>Share your dedication link with friends 🎉</p>
        <p>⚠️ No video ID found in URL</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Welcome to BlowTenso!</h1>
      <p>Share your dedication link with friends 🎉</p>

      {/* Dynamically show the Cloudinary video */}
      <VideoPlayer publicId={publicId} />
    </div>
  );
}
