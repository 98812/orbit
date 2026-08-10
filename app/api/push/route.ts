import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const missing: string[] = [];
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) missing.push('NEXT_PUBLIC_VAPID_PUBLIC_KEY');
    if (!process.env.VAPID_PRIVATE_KEY) missing.push('VAPID_PRIVATE_KEY');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');

    if (missing.length) {
      return NextResponse.json(
        { error: 'Missing environment variables', missing },
        { status: 500 }
      );
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
    const privateKey = process.env.VAPID_PRIVATE_KEY!;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    } catch (err: any) {
      return NextResponse.json(
        { error: 'Invalid VAPID config', detail: err?.message || String(err) },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: 'Lookup failed', detail: error.message },
        { status: 500 }
      );
    }

    const payload = JSON.stringify({
      title: title || 'Gen-Z',
      body: message || '',
      url: targetUrl || '/',
      tag: tag || 'genz',
    });

    const stale: string[] = [];
    const failures: string[] = [];

    await Promise.all(
      (subs || [])
        .filter((s: any) => s.user_id !== senderId)
        .map(async (s: any) => {
          try {
            await webpush.sendNotification(
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
              failures.push(`${err?.statusCode}: ${err?.body || err?.message}`);
            }
          }
        })
    );

    if (stale.length) {
      await admin.from('push_subscriptions').delete().in('endpoint', stale);
    }

    return NextResponse.json({
      found: (subs || []).length,
      stale: stale.length,
      failures,
    });
  } catch (err: any) {
    console.error('Push route error:', err);
    return NextResponse.json(
      { error: 'Server error', detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}
