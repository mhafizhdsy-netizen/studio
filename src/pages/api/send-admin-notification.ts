
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// This function handles POST requests to /api/send-admin-notification
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    try {
        // The body can be a single notification object or an array of them
        const notifications = Array.isArray(req.body) ? req.body : [req.body];

        if (notifications.length === 0) {
            return res.status(400).json({ error: 'No notification data provided.' });
        }

        // Validate each notification object
        for (const notif of notifications) {
            if (!notif.userId || !notif.title || !notif.content) {
                return res.status(400).json({ error: 'Invalid notification object. `userId`, `title`, and `content` are required.' });
            }
        }

        const { error } = await supabaseAdmin.from('notifications').insert(notifications);

        if (error) {
            console.error('Supabase admin insert error:', error);
            throw error;
        }

        return res.status(200).json({ message: 'Notification(s) sent successfully.' });
    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message || 'An unexpected error occurred.' });
    }
}

    