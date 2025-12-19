/**
 * Telegram Message Schema & Constants
 * Single source of truth for data structure
 */

// Message type identifier in Telegram channel
export const MESSAGE_TYPE = 'video_meta';

// Schema version for future migrations
export const SCHEMA_VERSION = 1;

/**
 * Video metadata structure
 * @typedef {Object} VideoMetadata
 * @property {string} id - Unique video ID (matches video_msg_id)
 * @property {string} title - Video title
 * @property {string} description - Video description
 * @property {string} file_id - Telegram file_id for video
 * @property {string} thumb_file_id - Telegram file_id for thumbnail
 * @property {number} duration - Duration in seconds
 * @property {number} uploaded_at - Unix timestamp
 */

/**
 * Validates video metadata object
 * @param {Object} obj - Object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMetadata(obj) {
    const errors = [];

    if (!obj) {
        return { valid: false, errors: ['Object is null or undefined'] };
    }

    if (typeof obj.id !== 'string' || !obj.id) {
        errors.push('id must be a non-empty string');
    }

    if (typeof obj.title !== 'string' || !obj.title) {
        errors.push('title must be a non-empty string');
    }

    if (typeof obj.file_id !== 'string') {
        errors.push('file_id must be a string');
    }

    if (typeof obj.duration !== 'number' || obj.duration < 0) {
        errors.push('duration must be a non-negative number');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Creates Telegram metadata message content
 * @param {Object} params
 * @returns {Object} Metadata JSON for Telegram
 */
export function createMetadataMessage({
    video_msg_id,
    file_id,
    thumb_file_id,
    title,
    description = '',
    duration = 0,
}) {
    return {
        type: MESSAGE_TYPE,
        schema_version: SCHEMA_VERSION,
        video_msg_id,
        file_id,
        thumb_file_id,
        title,
        description,
        duration,
        uploaded_at: Math.floor(Date.now() / 1000),
    };
}

/**
 * Parses Telegram metadata message
 * @param {string} text - Raw message text
 * @returns {Object|null} Parsed metadata or null
 */
export function parseMetadataMessage(text) {
    try {
        const data = JSON.parse(text);
        if (data.type !== MESSAGE_TYPE) {
            return null;
        }
        return {
            id: String(data.video_msg_id),
            title: data.title || 'Untitled',
            description: data.description || '',
            file_id: data.file_id || '',
            thumb_file_id: data.thumb_file_id || '',
            duration: data.duration || 0,
            uploaded_at: data.uploaded_at || 0,
        };
    } catch {
        return null;
    }
}
