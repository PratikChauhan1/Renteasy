import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { data: notifications } = await supabaseAdmin.from('Notification').select('*').eq('receiverId', user.id).order('createdAt', { ascending: false });
    return NextResponse.json({ notifications: notifications || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { notificationId, all } = await request.json();
    if (all) {
      await supabaseAdmin.from('Notification').update({ isRead: true }).eq('receiverId', user.id).eq('isRead', false);
      return NextResponse.json({ message: 'All notifications marked as read.' });
    }
    if (!notificationId) return NextResponse.json({ error: 'Notification ID is required.' }, { status: 400 });
    await supabaseAdmin.from('Notification').update({ isRead: true }).eq('id', notificationId).eq('receiverId', user.id);
    return NextResponse.json({ message: 'Notification marked as read.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
