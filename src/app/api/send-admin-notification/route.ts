import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    // This is a server-side only route, so it's safe to use the service_role key.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase URL or Service Role Key is not set in environment variables.');
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    try {
        const notifications = await req.json();

        // Basic validation on the incoming data.
        if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
            return NextResponse.json({ error: 'No notification data provided or invalid format.' }, { status: 400 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const { error } = await supabaseAdmin.from('notifications').insert(notifications);

        if (error) {
            console.error('Supabase admin insert error:', error);
            throw error;
        }

        return NextResponse.json({ message: 'Notification(s) sent successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}

    