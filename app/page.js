'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import VideoCard, { VideoCardSkeleton } from './components/VideoCard';

/**
 * Featured Video Card
 */
function FeaturedCard({ video, badge }) {
  return (
    <Link href={`/watch/${video.id}`} className="featured-card">
      <img
        src={video.thumbnail_url}
        alt={video.title}
        loading="lazy"
      />
      <div className="featured-overlay">
        <span className="featured-badge">{badge}</span>
        <h3 className="featured-title">{video.title}</h3>
        <p className="featured-stats">
          {Math.floor(Math.random() * 100)}K views • {video.channel || 'MeowTube'}
        </p>
      </div>
    </Link>
  );
}

/**
 * Empty State
 */
function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">📺</div>
      <h2 className="empty-title">No videos yet</h2>
      <p className="empty-text">
        Be the first to upload a video to MeowTube!
      </p>
      <Link href="/upload" className="btn btn-primary">
        Upload Video
      </Link>
    </div>
  );
}

/**
 * Loading Grid
 */
function LoadingGrid() {
  return (
    <div className="video-grid">
      {[...Array(8)].map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Homepage
 */
export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/videos');
        if (!res.ok) throw new Error('Failed to fetch videos');

        const data = await res.json();
        setVideos(data.videos || []);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="page-content">
        <LoadingGrid />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h2 className="empty-title">Something went wrong</h2>
          <p className="empty-text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Featured Section */}
      {videos.length >= 2 && (
        <section className="featured-section">
          <div className="section-header">
            <h2 className="section-title-main">🔥 Trending Now</h2>
          </div>
          <div className="featured-grid">
            <FeaturedCard video={videos[0]} badge="🔥 TRENDING" />
            {videos[1] && <FeaturedCard video={videos[1]} badge="⭐ FEATURED" />}
          </div>
        </section>
      )}

      {/* All Videos */}
      <section>
        <div className="section-header">
          <h2 className="section-title-main">📺 All Videos</h2>
        </div>

        {videos.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="video-grid">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
