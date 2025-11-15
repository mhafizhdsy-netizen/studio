import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { notifications_data } = await request.json();

    if (!notifications_data || !Array.isArray(notifications_data)) {
      return NextResponse.json({ error: 'Invalid input: notifications_data must be an array.' }, { status: 400 });
    }

    const { error } = await supabase.from('notifications').insert(notifications_data);

    if (error) {
      console.error('Supabase notification insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Notifications sent successfully.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
