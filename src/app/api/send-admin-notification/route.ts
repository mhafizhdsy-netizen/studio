import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// This function is the API handler for POST requests.
// It will only run on the server, making it safe to use service_role key.
export async function POST(req: NextRequest) {
    // Check if the required environment variables are set.
    // This is a critical security and functionality check.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Supabase URL or Service Role Key is not set in environment variables.');
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    try {
        const notifications = await req.json();

        // Basic validation on the incoming data.
        if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
            return NextResponse.json({ error: 'No notification data provided or invalid format.' }, { status: 400 });
        }

        // It's crucial to use the SERVICE_ROLE_KEY here to bypass RLS for admin actions.
        // This is safe because this code runs on the server, not the client.
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Insert the notification data into the 'notifications' table.
        const { error } = await supabaseAdmin.from('notifications').insert(notifications);

        if (error) {
            console.error('Supabase admin insert error:', error);
            // Re-throw the error to be caught by the outer catch block.
            throw error;
        }

        // Return a success response if the insertion is successful.
        return NextResponse.json({ message: 'Notification(s) sent successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error('API Route Error:', error);
        // Ensure a JSON response is always sent on error to prevent client-side parsing issues.
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
