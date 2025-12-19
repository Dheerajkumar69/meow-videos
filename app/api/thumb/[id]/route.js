/**
 * GET /api/thumb/[id]
 * Resolves thumbnail ID to Telegram CDN URL and returns 302 redirect
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Disable caching
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TELEGRAM_FILE_API = `https://api.telegram.org/file/bot${BOT_TOKEN}`;

export async function GET(request, { params }) {
    const { id } = await params;

    try {
        // 1. Find video in our JSON database
        const dataPath = path.join(process.cwd(), 'data', 'videos.json');

        if (!fs.existsSync(dataPath)) {
            return NextResponse.redirect(new URL('/placeholder-thumb.svg', request.url), 302);
        }

        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const videos = JSON.parse(rawData);
        const video = videos.find((v) => v.id === id);

        if (!video || !video.thumb_file_id) {
            // Return placeholder for missing thumbnails
            return NextResponse.redirect(new URL('/placeholder-thumb.svg', request.url), 302);
        }

        // 2. Call Telegram getFile API
        const tgResponse = await fetch(
            `${TELEGRAM_API}/getFile?file_id=${video.thumb_file_id}`,
            { method: 'GET' }
        );

        const tgData = await tgResponse.json();

        if (!tgData.ok) {
            // Return placeholder on any error
            return NextResponse.redirect(new URL('/placeholder-thumb.svg', request.url), 302);
        }

        // 3. Build Telegram CDN URL
        const filePath = tgData.result.file_path;
        const telegramFileUrl = `${TELEGRAM_FILE_API}/${filePath}`;

        // 4. Return 302 redirect
        return NextResponse.redirect(telegramFileUrl, 302);

    } catch (error) {
        console.error('[API /thumb] Error:', error);
        return NextResponse.redirect(new URL('/placeholder-thumb.svg', request.url), 302);
    }
}
