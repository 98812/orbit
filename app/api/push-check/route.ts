import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const report: Record<string, any> = {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      ? 'set (' + process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.length + ' chars)'
      : 'MISSING',
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY
      ? 'set (' + process.env.VAPID_PRIVATE_KEY.length + ' chars)'
      : 'MISSING',
    VAPID_SUBJECT: process.env.VAPID_SUBJECT || 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? 'set (' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ' chars)'
      : 'MISSING',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
  };

  // try loading web-push
  try {
    const webpush = (await import('web-push')).default;
    report.webPushLoaded = true;

    if (
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY
    ) {
      try {
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
        report.vapidConfig = 'ok';
      } catch (err: any) {
        report.vapidConfig = 'FAILED: ' + (err?.message || String(err));
      }
    }
  } catch (err: any) {
    report.webPushLoaded = false;
    report.webPushError = err?.message || String(err);
  }

  // try connecting to supabase with service key
  try {
    const { createClient } = await import('@supabase/supabase-js');
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { error, count } = await admin
        .from('push_subscriptions')
        .select('id', { count: 'exact', head: true });

      report.supabaseQuery = error ? 'FAILED: ' + error.message : 'ok';
      report.subscriptionCount = count ?? 0;
    }
  } catch (err: any) {
    report.supabaseQuery = 'FAILED: ' + (err?.message || String(err));
  }

  return NextResponse.json(report);
}
