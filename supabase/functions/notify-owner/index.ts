import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
const ownerEmail = Deno.env.get('OWNER_NOTIFICATION_EMAIL') ?? 'ahmed16060080@gmail.com';
const fromEmail = Deno.env.get('OWNER_NOTIFICATION_FROM') ?? 'Menu Notifications <onboarding@resend.dev>';

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function esc(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function subject(kind: string, row: Record<string, unknown>) {
  const name = String(row.name_ar ?? row.business_name ?? 'طلب جديد');
  return kind === 'website'
    ? `Menu — طلب إنشاء موقع جديد: ${name}`
    : `Menu — استفسار/طلب خدمة جديد: ${name}`;
}

function render(kind: string, row: Record<string, unknown>) {
  const fields: Array<[string, unknown]> = kind === 'website'
    ? [
        ['نوع النشاط', row.business_type], ['اسم النشاط', row.name_ar], ['الاسم بالإنجليزية', row.name_en],
        ['اسم المسؤول', row.contact_name], ['الجوال', row.phone], ['واتساب', row.whatsapp], ['البريد', row.email],
        ['الدولة', row.country_code], ['المنطقة', row.region], ['المدينة', row.city], ['العنوان', row.address],
        ['اللغة', row.language], ['الأسلوب', row.style_key], ['الصفحات', row.pages], ['الخدمات', row.services],
        ['رابط الخرائط', row.maps_url], ['ملاحظات', row.special_notes],
      ]
    : [
        ['الخدمة', row.service_type], ['اسم النشاط', row.business_name], ['نوع النشاط', row.business_type],
        ['اسم المسؤول', row.contact_name], ['الجوال', row.contact_phone], ['البريد', row.contact_email],
        ['الدولة', row.country], ['المدينة', row.city], ['التفاصيل', row.details],
      ];

  const rows = fields.map(([label, value]) => {
    let text = value;
    if (value && typeof value === 'object') text = JSON.stringify(value, null, 2);
    return `<tr><td style="padding:10px 12px;border-bottom:1px solid #eee;font-weight:700;white-space:nowrap">${esc(label)}</td><td style="padding:10px 12px;border-bottom:1px solid #eee;white-space:pre-wrap">${esc(text || '—')}</td></tr>`;
  }).join('');

  return `<!doctype html><html lang="ar" dir="rtl"><body style="font-family:Arial,sans-serif;background:#f7f5f2;padding:24px;color:#181512"><div style="max-width:760px;margin:auto;background:#fff;border:1px solid #e6dfd5;border-radius:16px;padding:24px"><h2 style="margin-top:0">${esc(subject(kind, row))}</h2><p style="color:#6e645a">تم تسجيل طلب جديد في منصة Menu.</p><table style="width:100%;border-collapse:collapse">${rows}</table><p style="margin-top:22px;color:#6e645a;font-size:12px">رقم الطلب: ${esc(row.id)}</p></div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405, headers: corsHeaders });
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return Response.json({ error: 'email_service_not_configured' }, { status: 503, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const kind = body?.kind === 'website' ? 'website' : body?.kind === 'service' ? 'service' : '';
    const id = typeof body?.id === 'string' ? body.id : '';
    if (!kind || !id) return Response.json({ error: 'invalid_request' }, { status: 400, headers: corsHeaders });

    const table = kind === 'website' ? 'website_projects' : 'service_requests';
    const notificationColumn = 'owner_notified_at';
    const { data: row, error: readError } = await admin.from(table).select('*').eq('id', id).maybeSingle();
    if (readError) throw readError;
    if (!row) return Response.json({ error: 'request_not_found' }, { status: 404, headers: corsHeaders });
    if (row[notificationColumn]) return Response.json({ ok: true, already_notified: true }, { headers: corsHeaders });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: fromEmail,
        to: [ownerEmail],
        subject: subject(kind, row),
        html: render(kind, row),
        reply_to: kind === 'website' ? (row.email || undefined) : (row.contact_email || undefined),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.message || 'Resend request failed');

    const { error: markError } = await admin.from(table).update({ owner_notified_at: new Date().toISOString(), owner_notification_error: null }).eq('id', id);
    if (markError) throw markError;

    return Response.json({ ok: true, email_id: result?.id ?? null }, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : 'notification_failed' }, { status: 500, headers: corsHeaders });
  }
});
