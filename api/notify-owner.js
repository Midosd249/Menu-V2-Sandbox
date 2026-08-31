const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ublxptcqefujkbeepylc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const OWNER_NOTIFICATION_EMAIL = process.env.OWNER_NOTIFICATION_EMAIL || 'ahmed16060080@gmail.com';
const OWNER_NOTIFICATION_FROM = process.env.OWNER_NOTIFICATION_FROM || 'Menu Notifications <onboarding@resend.dev>';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');
}
function subject(kind,row){
  const name=String(row.name_ar ?? row.business_name ?? 'طلب جديد');
  return kind==='website' ? `Menu — طلب إنشاء موقع جديد: ${name}` : `Menu — استفسار/طلب خدمة جديد: ${name}`;
}
function html(kind,row){
  const fields=kind==='website'
    ? [['نوع النشاط',row.business_type],['اسم النشاط',row.name_ar],['الاسم بالإنجليزية',row.name_en],['اسم المسؤول',row.contact_name],['الجوال',row.phone],['واتساب',row.whatsapp],['البريد',row.email],['الدولة',row.country_code],['المنطقة',row.region],['المدينة',row.city],['العنوان',row.address],['اللغة',row.language],['الأسلوب',row.style_key],['الصفحات',row.pages],['الخدمات',row.services],['رابط الخرائط',row.maps_url],['ملاحظات',row.special_notes]]
    : [['الخدمة',row.service_type],['اسم النشاط',row.business_name],['نوع النشاط',row.business_type],['اسم المسؤول',row.contact_name],['الجوال',row.contact_phone],['البريد',row.contact_email],['الدولة',row.country],['المدينة',row.city],['التفاصيل',row.details]];
  const rows=fields.map(([label,value])=>{let text=value;if(value&&typeof value==='object')text=JSON.stringify(value,null,2);return `<tr><td style="padding:10px 12px;border-bottom:1px solid #eee;font-weight:700;white-space:nowrap">${esc(label)}</td><td style="padding:10px 12px;border-bottom:1px solid #eee;white-space:pre-wrap">${esc(text||'—')}</td></tr>`}).join('');
  return `<!doctype html><html lang="ar" dir="rtl"><body style="font-family:Arial,sans-serif;background:#f7f5f2;padding:24px;color:#181512"><div style="max-width:760px;margin:auto;background:#fff;border:1px solid #e6dfd5;border-radius:16px;padding:24px"><h2>${esc(subject(kind,row))}</h2><p style="color:#6e645a">تم تسجيل طلب جديد في منصة Menu.</p><table style="width:100%;border-collapse:collapse">${rows}</table><p style="margin-top:22px;color:#6e645a;font-size:12px">رقم الطلب: ${esc(row.id)}</p></div></body></html>`;
}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(204).end();
  if(req.method!=='POST') return res.status(405).json({error:'method_not_allowed'});
  if(!SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) return res.status(503).json({error:'email_service_not_configured'});
  try{
    const {kind,id}=req.body||{};
    if(!['website','service'].includes(kind)||typeof id!=='string'||!id) return res.status(400).json({error:'invalid_request'});
    const table=kind==='website'?'website_projects':'service_requests';
    const read=await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=*`,{headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`} });
    if(!read.ok) throw new Error(`Supabase read failed: ${read.status}`);
    const rows=await read.json();
    const row=rows[0];
    if(!row) return res.status(404).json({error:'request_not_found'});
    if(row.owner_notified_at) return res.status(200).json({ok:true,already_notified:true});
    const email=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${RESEND_API_KEY}`},body:JSON.stringify({from:OWNER_NOTIFICATION_FROM,to:[OWNER_NOTIFICATION_EMAIL],subject:subject(kind,row),html:html(kind,row),reply_to:kind==='website'?(row.email||undefined):(row.contact_email||undefined)})});
    const result=await email.json();
    if(!email.ok) throw new Error(result?.message||'Resend request failed');
    const patch=await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({owner_notified_at:new Date().toISOString(),owner_notification_error:null})});
    if(!patch.ok) throw new Error(`Supabase update failed: ${patch.status}`);
    return res.status(200).json({ok:true});
  }catch(error){
    console.error(error);
    return res.status(500).json({error:error instanceof Error?error.message:'notification_failed'});
  }
}
