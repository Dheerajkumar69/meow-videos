/**
 * GET /api/resolve/[id]
 * Resolves video ID to Telegram CDN URL and returns 302 redirect
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
            return NextResponse.json(
                { error: 'No videos database found' },
                { status: 404 }
            );
        }

        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const videos = JSON.parse(rawData);
        const video = videos.find((v) => v.id === id);

        if (!video) {
            return NextResponse.json(
                { error: 'Video not found', id },
                { status: 404 }
            );
        }

        if (!video.file_id) {
            return NextResponse.json(
                { error: 'Video file_id missing', id },
                { status: 404 }
            );
        }

        // 2. Call Telegram getFile API
        console.log(`[API /resolve] Getting file for: ${video.file_id.substring(0, 20)}...`);

        const tgResponse = await fetch(
            `${TELEGRAM_API}/getFile?file_id=${video.file_id}`,
            { method: 'GET' }
        );

        const tgData = await tgResponse.json();

        if (!tgData.ok) {
            console.error('[API /resolve] Telegram error:', tgData);

            if (tgData.error_code === 400) {
                return NextResponse.json(
                    { error: 'File not found on Telegram', telegram_error: tgData.description },
                    { status: 404 }
                );
            }
            if (tgData.error_code === 429) {
                const retryAfter = tgData.parameters?.retry_after || 60;
                return NextResponse.json(
                    { error: 'Rate limited, please try again later' },
                    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
                );
            }
            return NextResponse.json(
                { error: 'Telegram API error', details: tgData.description },
                { status: 502 }
            );
        }

        // 3. Build Telegram CDN URL
        const filePath = tgData.result.file_path;
        const telegramFileUrl = `${TELEGRAM_FILE_API}/${filePath}`;

        console.log(`[API /resolve] Redirecting to: ${telegramFileUrl.substring(0, 50)}...`);

        // 4. Return 302 redirect
        return NextResponse.redirect(telegramFileUrl, 302);

    } catch (error) {
        console.error('[API /resolve] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
