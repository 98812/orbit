import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

  if (!publicKey || !privateKey) return null;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return webpush;
}

export async function POST(request: Request) {
  try {
    const wp = getWebPush();
    if (!wp) {
      return NextResponse.json({ error: 'Push not configured' }, { status: 500 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceKey || !url) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { recipientIds, title, message, url: targetUrl, tag, senderId } = body;

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json({ error: 'No recipients' }, { status: 400 });
    }

    const admin = createClient(url, serviceKey);

    const { data: subs, error } = await admin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', recipientIds);

    if (error) {
      console.error('Failed to load subscriptions:', error);
      return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }

    const payload = JSON.stringify({
      title: title || 'Gen-Z',
      body: message || '',
      url: targetUrl || '/',
      tag: tag || 'genz',
    });

    const stale: string[] = [];

    await Promise.all(
      (subs || [])
        .filter((s: any) => s.user_id !== senderId)
        .map(async (s: any) => {
          try {
            await wp.sendNotification(
              {
                endpoint: s.endpoint,
                keys: { p256dh: s.p256dh, auth: s.auth },
              },
              payload
            );
          } catch (err: any) {
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              stale.push(s.endpoint);
            } else {
              console.error('Push failed:', err?.statusCode, err?.body);
            }
          }
        })
    );

    if (stale.length) {
      await admin.from('push_subscriptions').delete().in('endpoint', stale);
    }

    return NextResponse.json({ sent: (subs || []).length - stale.length });
  } catch (err) {
    console.error('Push route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
