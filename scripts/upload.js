#!/usr/bin/env node
/**
 * Admin CLI: Upload video to Telegram channel
 * 
 * Usage:
 *   node scripts/upload.js --video ./video.mp4 --thumb ./thumb.jpg --title "My Video"
 */

import fs from 'fs';
import { openAsBlob } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    config({ path: envPath });
} else {
    config();
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const VIDEOS_JSON = path.join(DATA_DIR, 'videos.json');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Parse CLI arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const params = {};
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace(/^--/, '');
        const value = args[i + 1];
        params[key] = value;
    }
    return params;
}

// Upload file using Native FormData (Node 20+)
async function uploadFile(filePath, type) {
    const form = new FormData();
    form.append('chat_id', String(CHANNEL_ID));

    const fileBlob = await openAsBlob(filePath);
    const fileName = path.basename(filePath);
    form.append(type, fileBlob, fileName);

    const endpoint = type === 'video' ? 'sendVideo' : 'sendPhoto';

    console.log(`\n⏳ Uploading ${type} to ${CHANNEL_ID}...`);

    const response = await fetch(`${TELEGRAM_API}/${endpoint}`, {
        method: 'POST',
        body: form,
    });

    const data = await response.json();

    if (!data.ok) {
        console.error('Telegram API Response:', JSON.stringify(data, null, 2));
        throw new Error(`Telegram error: ${data.description}`);
    }

    return data.result;
}

// Send metadata message
async function sendMetadata(metadata) {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHANNEL_ID,
            text: JSON.stringify(metadata, null, 2),
        }),
    });

    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Telegram error: ${data.description}`);
    }

    return data.result;
}

// Update local videos.json
function updateLocalDB(video) {
    console.log('\n📝 Updating local database...');

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let videos = [];
    if (fs.existsSync(VIDEOS_JSON)) {
        const content = fs.readFileSync(VIDEOS_JSON, 'utf-8');
        videos = JSON.parse(content);
    }

    // Filter valid file_ids
    videos = videos.filter((v) => v.id !== 'demo' && v.file_id && v.file_id.length > 0);

    // Updates logic
    const existingIndex = videos.findIndex(v => v.id === video.id);
    if (existingIndex >= 0) {
        videos[existingIndex] = video;
    } else {
        videos.push(video);
    }

    fs.writeFileSync(VIDEOS_JSON, JSON.stringify(videos, null, 2));
    console.log(`✅ Saved ${videos.length} videos to ${VIDEOS_JSON}`);
}

// Get video duration
async function getVideoDuration(filePath) {
    try {
        const { execSync } = await import('child_process');
        const output = execSync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
            { encoding: 'utf-8' }
        );
        return Math.floor(parseFloat(output));
    } catch {
        return 0;
    }
}

function extractFileId(result) {
    if (result.video) return result.video.file_id;
    if (result.document) return result.document.file_id;
    if (result.animation) return result.animation.file_id;
    throw new Error('Could not find file_id in Telegram response');
}

async function main() {
    console.log('🎬 MeowTube - Admin Upload CLI (Native FormData)\n');

    if (!BOT_TOKEN || !CHANNEL_ID) {
        console.error('❌ Missing credentials');
        process.exit(1);
    }

    const params = parseArgs();
    if (!params.video) {
        console.error('❌ Missing --video argument');
        process.exit(1);
    }
    if (!params.title) {
        console.error('❌ Missing --title argument');
        process.exit(1);
    }

    const videoPath = path.resolve(params.video);
    const thumbPath = params.thumb ? path.resolve(params.thumb) : null;

    if (!fs.existsSync(videoPath)) {
        console.error(`❌ File not found: ${videoPath}`);
        process.exit(1);
    }

    // Check file size (50MB limit for Bot API)
    const stats = fs.statSync(videoPath);
    const sizeMB = stats.size / (1024 * 1024);
    if (sizeMB > 50) {
        console.error(`❌ File too large: ${sizeMB.toFixed(2)} MB`);
        console.error('   Telegram Bot API limit is 50 MB.');
        process.exit(1);
    }

    try {
        // 1. Upload Video
        const videoResult = await uploadFile(videoPath, 'video');
        const videoMsgId = videoResult.message_id;
        const fileId = extractFileId(videoResult);
        console.log(`✅ Video uploaded (ID: ${videoMsgId})`);

        // 2. Upload Thumbnail
        let thumbFileId = '';
        if (thumbPath && fs.existsSync(thumbPath)) {
            const thumbResult = await uploadFile(thumbPath, 'photo');
            thumbFileId = thumbResult.photo[thumbResult.photo.length - 1].file_id;
            console.log(`✅ Thumbnail uploaded`);
        } else if (videoResult.video?.thumb) {
            thumbFileId = videoResult.video.thumb.file_id;
            console.log('✅ Using auto-generated thumbnail');
        }

        // 3. Metadata
        const duration = await getVideoDuration(videoPath);
        const metadata = {
            type: 'video_meta',
            video_msg_id: videoMsgId,
            file_id: fileId,
            thumb_file_id: thumbFileId,
            title: params.title,
            description: params.desc || '',
            duration,
            uploaded_at: Math.floor(Date.now() / 1000),
        };

        await sendMetadata(metadata);
        console.log('✅ Metadata posted');

        // 4. Update Local DB
        const localVideo = {
            id: String(videoMsgId),
            title: params.title,
            description: params.desc || '',
            file_id: fileId,
            thumb_file_id: thumbFileId,
            duration,
            uploaded_at: Math.floor(Date.now() / 1000),
        };
        updateLocalDB(localVideo);

        console.log('\n🎉 Upload complete!');

    } catch (error) {
        console.error('\n❌ Upload failed:', error.message);
        process.exit(1);
    }
}

main();
