/**
 * Telegram Bot API Helper Functions
 * Handles all communication with Telegram
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TELEGRAM_FILE_API = `https://api.telegram.org/file/bot${BOT_TOKEN}`;

/**
 * Call Telegram Bot API
 * @param {string} method - API method name
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} API response
 */
export async function callTelegramAPI(method, params = {}) {
    const url = `${TELEGRAM_API}/${method}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!data.ok) {
        const error = new Error(data.description || 'Telegram API error');
        error.code = data.error_code;
        throw error;
    }

    return data.result;
}

/**
 * Upload file to Telegram
 * @param {FormData} formData - Multipart form data
 * @param {string} type - 'video' or 'photo'
 * @returns {Promise<Object>} Upload result
 */
export async function uploadFile(formData, type) {
    const endpoint = type === 'video' ? 'sendVideo' : 'sendPhoto';
    const url = `${TELEGRAM_API}/${endpoint}`;

    console.log(`[Telegram] Uploading ${type} to ${endpoint}...`);

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // duplex: 'half' is required for Node 20+ fetch with streams/blobs, 
        // but Next.js Request/Response might handle it differently.
        // We'll see if it's needed in the API route context.
    });

    const data = await response.json();

    if (!data.ok) {
        console.error('[Telegram] Upload error:', data);
        throw new Error(data.description || 'Telegram upload failed');
    }

    return data.result;
}

/**
 * Get file download URL from Telegram
 * @param {string} fileId - Telegram file_id
 * @returns {Promise<string>} Direct download URL
 */
export async function getFileUrl(fileId) {
    if (!fileId) {
        throw new Error('file_id is required');
    }

    const file = await callTelegramAPI('getFile', { file_id: fileId });
    return `${TELEGRAM_FILE_API}/${file.file_path}`;
}

/**
 * Send a text message to the channel
 * @param {string} text - Message text
 * @returns {Promise<Object>} Sent message
 */
export async function sendMessage(text) {
    return callTelegramAPI('sendMessage', {
        chat_id: CHANNEL_ID,
        text,
    });
}

/**
 * Get channel history (for syncing)
 * @param {number} limit - Maximum messages to fetch
 * @returns {Promise<Object[]>} Array of messages
 */
export async function getChannelHistory(limit = 100) {
    // Note: Bot API doesn't have getHistory, we use getUpdates workaround
    // For MVP, we sync by reading metadata JSON in channel
    // In production, consider using MTProto API

    // For now, return empty - sync will be done via manual CLI
    return [];
}

/**
 * Error types for handling
 */
export const TelegramErrors = {
    FILE_NOT_FOUND: 400,
    RATE_LIMITED: 429,
    UNAUTHORIZED: 401,
};
