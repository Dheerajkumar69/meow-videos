'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Upload Item Component
 */
function UploadItem({ file, onRemove, onMetadataChange }) {
    const [expanded, setExpanded] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('pending'); // pending, uploading, complete, error
    const [metadata, setMetadata] = useState({
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        category: 'entertainment',
    });

    const handleMetadataChange = (field, value) => {
        const updated = { ...metadata, [field]: value };
        setMetadata(updated);
        onMetadataChange?.(file.name, updated);
    };

    const handleUpload = async () => {
        setUploading(true);
        setStatus('uploading');

        try {
            // Get video duration
            const duration = await new Promise((resolve) => {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src);
                    resolve(Math.round(video.duration));
                };
                video.src = URL.createObjectURL(file);
            });

            const formData = new FormData();
            formData.append('video', file);
            formData.append('title', metadata.title);
            formData.append('description', metadata.description);
            formData.append('category', metadata.category);
            formData.append('duration', duration.toString());

            // Add thumbnail if selected (not yet implemented in UI but supported in API)
            // if (metadata.thumbnail) formData.append('thumbnail', metadata.thumbnail);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload');

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    setProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    setStatus('complete');
                    setUploading(false);
                } else {
                    throw new Error('Upload failed');
                }
            };

            xhr.onerror = () => {
                throw new Error('Network error');
            };

            xhr.send(formData);

        } catch (error) {
            console.error(error);
            setStatus('error');
            setUploading(false);
        }
    };

    return (
        <div className="upload-item">
            <div className="upload-item-header">
                <div className="upload-item-icon">🎬</div>
                <div className="upload-item-info">
                    <p className="upload-item-name">{file.name}</p>
                    <p className="upload-item-size">{formatFileSize(file.size)}</p>
                </div>
                <span className={`upload-item-status ${status}`}>
                    {status === 'pending' && 'Ready'}
                    {status === 'uploading' && `${Math.min(100, Math.floor(progress))}%`}
                    {status === 'complete' && '✓ Complete'}
                    {status === 'error' && '✗ Error'}
                </span>
                <button
                    className="icon-btn"
                    onClick={() => setExpanded(!expanded)}
                    style={{ marginLeft: 8 }}
                >
                    {expanded ? '▲' : '▼'}
                </button>
                <button
                    className="icon-btn"
                    onClick={() => onRemove(file.name)}
                    style={{ color: 'var(--accent-primary)' }}
                >
                    ✕
                </button>
            </div>

            {status === 'uploading' && (
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${Math.min(100, progress)}%` }}
                    />
                </div>
            )}

            {expanded && status !== 'complete' && (
                <div className="metadata-form">
                    <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={metadata.title}
                            onChange={(e) => handleMetadataChange('title', e.target.value)}
                            placeholder="Enter video title"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            value={metadata.description}
                            onChange={(e) => handleMetadataChange('description', e.target.value)}
                            placeholder="Tell viewers about your video"
                            rows={3}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                                className="form-select"
                                value={metadata.category}
                                onChange={(e) => handleMetadataChange('category', e.target.value)}
                            >
                                <option value="entertainment">Entertainment</option>
                                <option value="music">Music</option>
                                <option value="gaming">Gaming</option>
                                <option value="education">Education</option>
                                <option value="sports">Sports</option>
                                <option value="news">News</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Thumbnail</label>
                            <input
                                type="file"
                                className="form-input"
                                accept="image/*"
                                style={{ padding: 8 }}
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => onRemove(file.name)}
                        >
                            Remove
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleUpload}
                            disabled={uploading || !metadata.title}
                        >
                            {uploading ? 'Uploading...' : 'Upload Video'}
                        </button>
                    </div>
                </div>
            )}

            {status === 'complete' && (
                <p style={{
                    color: 'var(--accent-green)',
                    fontSize: '0.875rem',
                    marginTop: 12
                }}>
                    ✓ Video uploaded successfully! It will appear on the homepage shortly.
                </p>
            )}
        </div>
    );
}

/**
 * Upload Page
 */
export default function UploadPage() {
    const [files, setFiles] = useState([]);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleFiles = useCallback((newFiles) => {
        const videoFiles = Array.from(newFiles).filter(file =>
            file.type.startsWith('video/')
        );

        if (videoFiles.length === 0) {
            alert('Please select video files only');
            return;
        }

        setFiles(prev => [
            ...prev,
            ...videoFiles.filter(f => !prev.some(p => p.name === f.name))
        ]);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleFileSelect = (e) => {
        handleFiles(e.target.files);
    };

    const handleRemove = (fileName) => {
        setFiles(prev => prev.filter(f => f.name !== fileName));
    };

    const handleUploadAll = () => {
        // Trigger upload for all pending files
        alert('Bulk upload: This would upload all files to Telegram.\n\nFor now, use the CLI:\nnpm run upload -- --video ./video.mp4 --title "Title"');
    };

    return (
        <div className="page-content">
            <div className="upload-page">
                <div className="upload-header">
                    <h1 className="upload-title">Upload Videos</h1>
                    <p className="upload-subtitle">
                        Drag and drop your videos or click to browse. Supports bulk uploads.
                    </p>
                </div>

                {/* Dropzone */}
                <div
                    className={`upload-dropzone ${dragOver ? 'dragover' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="upload-icon">📤</div>
                    <p className="upload-text">Drag & drop video files here</p>
                    <p className="upload-hint">or click to browse your computer</p>
                    <button className="select-files-btn" type="button">
                        Select Files
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Upload Queue */}
                {files.length > 0 && (
                    <div className="upload-queue">
                        <div className="queue-title">
                            <span>📋 Upload Queue ({files.length} video{files.length > 1 ? 's' : ''})</span>
                            {files.length > 1 && (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleUploadAll}
                                    style={{ marginLeft: 'auto', padding: '8px 16px' }}
                                >
                                    Upload All
                                </button>
                            )}
                        </div>

                        {files.map((file) => (
                            <UploadItem
                                key={file.name}
                                file={file}
                                onRemove={handleRemove}
                            />
                        ))}
                    </div>
                )}

                {/* CLI Instructions */}
                <div style={{
                    marginTop: 32,
                    padding: 24,
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                }}>
                    <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>💡 Pro Tip: Use CLI for Large Uploads</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.875rem' }}>
                        For reliable uploads of large files, use the command line:
                    </p>
                    <code style={{
                        display: 'block',
                        padding: 16,
                        background: 'var(--bg-primary)',
                        borderRadius: 8,
                        fontSize: '0.875rem',
                        color: 'var(--accent-blue)',
                        overflowX: 'auto',
                    }}>
                        npm run upload -- --video ./video.mp4 --thumb ./thumb.jpg --title &quot;My Video&quot;
                    </code>
                </div>
            </div>
        </div>
    );
}
