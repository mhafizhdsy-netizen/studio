import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ error: `Method ${req.method} Not Allowed` }, {
            status: 405,
            headers: { Allow: 'POST' }
        });
    }

    try {
        const notifications = await req.json();

        // Basic validation
        if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
            return NextResponse.json({ error: 'No notification data provided or invalid format.' }, { status: 400 });
        }

        // It's crucial to use the SERVICE_ROLE_KEY here to bypass RLS.
        // These variables are only accessible on the server, making this secure.
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabaseAdmin.from('notifications').insert(notifications);

        if (error) {
            console.error('Supabase admin insert error:', error);
            // Re-throw the error to be caught by the outer catch block
            throw error;
        }

        return NextResponse.json({ message: 'Notification(s) sent successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error('API Route Error:', error);
        // Ensure a JSON response is always sent on error
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
