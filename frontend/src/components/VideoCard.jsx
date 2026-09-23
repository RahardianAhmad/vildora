function VideoCard({ video }) {
  return (
    <div className="video-card">
      <div className="thumbnail">
        <img
          src={video?.thumbnail || "https://placehold.co/600x340"}
          alt={video?.title}
        />
      </div>

      <div className="video-info">
        <h3>{video?.title || "Judul Video"}</h3>

        <p>{video?.username || "Creator"}</p>

        <div className="video-meta">
          <span>{video?.views || 0} views</span>

          <span>Rp {video?.price || 0}</span>
        </div>
      </div>
    </div>
  );
}

export default VideoCard;
