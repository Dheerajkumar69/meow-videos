'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Format duration
 */
function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date
 */
function formatDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Related Video Card
 */
function RelatedVideoCard({ video }) {
    return (
        <Link href={`/watch/${video.id}`} className="related-card">
            <div className="related-thumbnail">
                <img src={video.thumbnail_url} alt={video.title} />
                <div className="duration-badge">{formatDuration(video.duration)}</div>
            </div>
            <div className="related-info">
                <h4 className="related-video-title">{video.title}</h4>
                <p className="related-channel">{video.channel || 'MeowTube'}</p>
                <p className="related-stats">{Math.floor(Math.random() * 50)}K views</p>
            </div>
        </Link>
    );
}

/**
 * Watch Page
 */
export default function WatchPage() {
    const params = useParams();
    const id = params.id;

    const [video, setVideo] = useState(null);
    const [relatedVideos, setRelatedVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [descExpanded, setDescExpanded] = useState(false);
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (!id) return;

            try {
                // Fetch video details
                const res = await fetch(`/api/video/${id}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error('Video not found');
                    throw new Error('Failed to load video');
                }
                const data = await res.json();
                setVideo(data);

                // Fetch related videos
                const relRes = await fetch('/api/videos');
                if (relRes.ok) {
                    const relData = await relRes.json();
                    setRelatedVideos((relData.videos || []).filter(v => v.id !== id).slice(0, 10));
                }
            } catch (err) {
                console.error('Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id]);

    const handleLike = () => {
        setLiked(!liked);
        if (disliked) setDisliked(false);
    };

    const handleDislike = () => {
        setDisliked(!disliked);
        if (liked) setLiked(false);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="watch-page">
                    <div className="player-section">
                        <div className="video-player-wrapper loading-skeleton" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="page-content">
                <Link href="/" className="back-link" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 24,
                    color: 'var(--text-secondary)'
                }}>
                    ← Back to videos
                </Link>
                <div className="empty-state">
                    <div className="empty-icon">🎬</div>
                    <h2 className="empty-title">{error || 'Video not found'}</h2>
                    <p className="empty-text">
                        The video you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                    <Link href="/" className="btn btn-primary">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="watch-page">
                {/* Main Player Section */}
                <div className="player-section">
                    <div className="video-player-wrapper">
                        <video
                            className="video-player"
                            src={video.video_url}
                            controls
                            autoPlay
                            playsInline
                            poster={video.thumbnail_url}
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>

                    {/* Video Actions */}
                    <div className="video-actions">
                        <div className="video-primary-info">
                            <h1 className="watch-title">{video.title}</h1>
                            <p className="watch-stats">
                                {Math.floor(Math.random() * 100000).toLocaleString()} views • {formatDate(video.uploaded_at)}
                            </p>
                        </div>

                        <div className="action-buttons">
                            <button
                                className={`action-btn ${liked ? 'primary' : ''}`}
                                onClick={handleLike}
                            >
                                👍 {liked ? 'Liked' : 'Like'}
                            </button>
                            <button
                                className={`action-btn ${disliked ? 'primary' : ''}`}
                                onClick={handleDislike}
                            >
                                👎
                            </button>
                            <button className="action-btn" onClick={handleShare}>
                                🔗 Share
                            </button>
                            <a
                                href={video.download_url}
                                download
                                className="action-btn primary"
                            >
                                ⬇️ Download
                            </a>
                        </div>
                    </div>

                    {/* Channel Info */}
                    <div className="channel-info">
                        <div className="channel-avatar-lg">M</div>
                        <div className="channel-details">
                            <p className="channel-name">MeowTube Channel</p>
                            <p className="subscriber-count">1.2K subscribers</p>
                        </div>
                        <button className="subscribe-btn">Subscribe</button>
                    </div>

                    {/* Description */}
                    <div
                        className="description-box"
                        onClick={() => setDescExpanded(!descExpanded)}
                    >
                        <div className="description-header">
                            <span>{Math.floor(Math.random() * 50000).toLocaleString()} views</span>
                            <span>{formatDate(video.uploaded_at)}</span>
                        </div>
                        <p className={`description-text ${descExpanded ? '' : 'collapsed'}`}>
                            {video.description || 'No description available.'}
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 8 }}>
                            {descExpanded ? 'Show less' : 'Show more'}
                        </p>
                    </div>

                    {/* Comments */}
                    <div className="comments-section">
                        <div className="comments-header">
                            <span className="comments-count">Comments</span>
                        </div>
                        <div className="comment-input-wrapper">
                            <div className="channel-avatar" style={{ width: 40, height: 40 }}>U</div>
                            <input
                                type="text"
                                className="comment-input"
                                placeholder="Add a comment..."
                            />
                        </div>
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
                            Comments coming soon...
                        </p>
                    </div>
                </div>

                {/* Related Videos */}
                <aside className="related-section">
                    <h3 className="related-title">Related Videos</h3>
                    {relatedVideos.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No related videos</p>
                    ) : (
                        relatedVideos.map((v) => (
                            <RelatedVideoCard key={v.id} video={v} />
                        ))
                    )}
                </aside>
            </div>
        </div>
    );
}
