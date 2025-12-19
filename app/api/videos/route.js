/**
 * GET /api/videos
 * Returns list of all videos with metadata for homepage grid
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Disable caching to always get fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const dataPath = path.join(process.cwd(), 'data', 'videos.json');

        // Check if file exists
        if (!fs.existsSync(dataPath)) {
            console.log('[API /videos] No videos.json found');
            return NextResponse.json({ videos: [], message: 'No videos yet' });
        }

        // Read fresh data (no caching)
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const videos = JSON.parse(rawData);

        console.log(`[API /videos] Loaded ${videos.length} videos from JSON`);

        // Filter out demo/empty entries and format for frontend
        const formattedVideos = videos
            .filter((v) => {
                const hasFileId = v.file_id && v.file_id.length > 0;
                const notDemo = v.id !== 'demo';
                if (!hasFileId) console.log(`[API /videos] Filtered out: ${v.id} (no file_id)`);
                if (!notDemo) console.log(`[API /videos] Filtered out: ${v.id} (demo)`);
                return hasFileId && notDemo;
            })
            .map((v) => ({
                id: v.id,
                title: v.title,
                description: v.description,
                duration: v.duration,
                thumbnail_url: v.thumb_file_id ? `/api/thumb/${v.id}` : '/placeholder-thumb.svg',
                uploaded_at: v.uploaded_at,
            }));

        console.log(`[API /videos] Returning ${formattedVideos.length} videos`);

        return NextResponse.json({
            videos: formattedVideos,
            total: formattedVideos.length,
        });
    } catch (error) {
        console.error('[API /videos] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch videos', message: error.message },
            { status: 500 }
        );
    }
}
