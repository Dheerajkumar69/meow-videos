/**
 * GET /api/video/[id]
 * Returns detailed video metadata for watch page
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Disable caching
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const { id } = await params;

    try {
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

        // Format for frontend
        return NextResponse.json({
            id: video.id,
            title: video.title,
            description: video.description || '',
            duration: video.duration,
            video_url: `/api/resolve/${video.id}`,
            download_url: `/api/resolve/${video.id}`,
            thumbnail_url: video.thumb_file_id ? `/api/thumb/${video.id}` : '/placeholder-thumb.svg',
            uploaded_at: video.uploaded_at,
        });

    } catch (error) {
        console.error('Error fetching video:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
