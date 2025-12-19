'use client';

import Link from 'next/link';

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds) {
    if (!seconds || seconds === 0) return '0:00';

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format view count
 */
function formatViews(views) {
    if (!views) return '0 views';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
}

/**
 * Format upload date to relative time
 */
function formatDate(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (minutes < 60) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (months < 12) return `${months} months ago`;
    return `${years} years ago`;
}

export default function VideoCard({ video, compact = false }) {
    return (
        <Link href={`/watch/${video.id}`} className="video-card">
            <div className="thumbnail">
                <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    loading="lazy"
                />
                <div className="thumbnail-overlay">
                    <div className="play-icon">▶</div>
                </div>
                <div className="duration-badge">{formatDuration(video.duration)}</div>
            </div>

            <div className="video-info">
                {!compact && (
                    <div className="channel-avatar">
                        {(video.channel || 'U').charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="video-meta">
                    <h3 className="video-title">{video.title}</h3>
                    <p className="video-channel">{video.channel || 'Unknown'}</p>
                    <p className="video-stats">
                        {formatViews(video.views || Math.floor(Math.random() * 10000))} • {formatDate(video.uploaded_at)}
                    </p>
                </div>
            </div>
        </Link>
    );
}

export function VideoCardSkeleton() {
    return (
        <div className="video-card">
            <div className="skeleton-thumbnail loading-skeleton" />
            <div className="video-info">
                <div className="channel-avatar loading-skeleton" style={{ width: 36, height: 36 }} />
                <div className="video-meta">
                    <div className="skeleton-text loading-skeleton" style={{ width: '90%' }} />
                    <div className="skeleton-text loading-skeleton short" />
                </div>
            </div>
        </div>
    );
}
