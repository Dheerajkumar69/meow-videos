#!/usr/bin/env node
/**
 * Admin CLI: Sync videos from Telegram channel to local JSON
 * 
 * Usage:
 *   node scripts/sync.js
 * 
 * Note: Due to Bot API limitations, this reads the channel history
 * and looks for video_meta messages. For large channels, consider
 * using MTProto API instead.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables from .env.local
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

// Fetch recent updates (Bot API workaround)
async function fetchUpdates() {
    const response = await fetch(`${TELEGRAM_API}/getUpdates?limit=100`);
    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Telegram error: ${data.description}`);
    }

    return data.result;
}

// Parse metadata from message text
function parseMetadata(text) {
    try {
        const data = JSON.parse(text);
        if (data.type !== 'video_meta') return null;

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

// Main sync function
async function main() {
    console.log('🔄 MeowTube - Sync CLI\n');
    console.log('─'.repeat(50));

    // Validate environment
    if (!BOT_TOKEN) {
        console.error('❌ Missing TELEGRAM_BOT_TOKEN');
        console.error('   Looked in:', envPath);
        process.exit(1);
    }

    if (!CHANNEL_ID) {
        console.error('❌ Missing TELEGRAM_CHANNEL_ID');
        process.exit(1);
    }

    console.log('✓ Bot Token:', BOT_TOKEN.substring(0, 10) + '...');
    console.log('✓ Channel ID:', CHANNEL_ID);
    console.log(`📁 Output: ${VIDEOS_JSON}\n`);

    try {
        console.log('⏳ Fetching channel updates...');

        const updates = await fetchUpdates();
        console.log(`📨 Found ${updates.length} recent updates`);

        // Filter for channel post messages with text
        const metadataMessages = updates
            .filter((u) => u.channel_post && u.channel_post.text)
            .map((u) => parseMetadata(u.channel_post.text))
            .filter((m) => m !== null);

        console.log(`🎬 Found ${metadataMessages.length} video metadata messages`);

        if (metadataMessages.length === 0) {
            console.log('\n⚠️  No metadata found in recent updates.');
            console.log('   Videos are added to JSON via upload.js');
            console.log('   You can also manually edit data/videos.json');

            // Show current JSON status
            if (fs.existsSync(VIDEOS_JSON)) {
                const current = JSON.parse(fs.readFileSync(VIDEOS_JSON, 'utf-8'));
                const realVideos = current.filter(v => v.file_id && v.id !== 'demo');
                console.log(`\n   Current videos in JSON: ${realVideos.length}`);
            }
            return;
        }

        // Merge with existing data (don't lose local entries)
        let existingVideos = [];
        if (fs.existsSync(VIDEOS_JSON)) {
            existingVideos = JSON.parse(fs.readFileSync(VIDEOS_JSON, 'utf-8'));
            console.log(`   Existing videos in JSON: ${existingVideos.length}`);
        }

        // Create ID map for deduplication
        const videoMap = new Map();
        existingVideos.forEach((v) => videoMap.set(v.id, v));
        metadataMessages.forEach((v) => videoMap.set(v.id, v));

        // Remove demo entries
        videoMap.delete('demo');

        const finalVideos = Array.from(videoMap.values())
            .filter((v) => v.file_id && v.file_id.length > 0)
            .sort((a, b) => b.uploaded_at - a.uploaded_at);

        // Ensure data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        // Write updated JSON
        fs.writeFileSync(VIDEOS_JSON, JSON.stringify(finalVideos, null, 2));

        console.log(`\n✅ Synced ${finalVideos.length} videos to ${VIDEOS_JSON}`);

    } catch (error) {
        console.error('\n❌ Sync failed:', error.message);
        process.exit(1);
    }
}

main();
