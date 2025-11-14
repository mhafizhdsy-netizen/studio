import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// This function handles POST requests to /api/send-admin-notification
export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ error: `Method ${req.method} Not Allowed` }, {
            status: 405,
            headers: { Allow: 'POST' }
        });
    }

    // It's crucial to use the SERVICE_ROLE_KEY here to bypass RLS.
    // Ensure these environment variables are set in your deployment environment.
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    try {
        const body = await req.json();
        // The body can be a single notification object or an array of them
        const notifications = Array.isArray(body) ? body : [body];

        if (notifications.length === 0) {
            return NextResponse.json({ error: 'No notification data provided.' }, { status: 400 });
        }

        // Validate each notification object
        for (const notif of notifications) {
            if (!notif.userId || !notif.title || !notif.content) {
                return NextResponse.json({ error: 'Invalid notification object. `userId`, `title`, and `content` are required.' }, { status: 400 });
            }
        }

        const { error } = await supabaseAdmin.from('notifications').insert(notifications);

        if (error) {
            console.error('Supabase admin insert error:', error);
            throw error;
        }

        return NextResponse.json({ message: 'Notification(s) sent successfully.' }, { status: 200 });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
