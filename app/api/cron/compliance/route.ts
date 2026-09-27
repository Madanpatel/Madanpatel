import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected || request.headers.get('authorization') !== `Bearer ${expected}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const inThirty = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  const [overdue, dueSoon, expired, expiring] = await Promise.all([
    supabase.from('compliance_obligations').update({ status: 'OVERDUE' }).lt('due_date', today).not('status', 'in', '(COMPLETED,EXEMPT)').select('id,organization_id,assigned_user_id,title'),
    supabase.from('compliance_obligations').update({ status: 'DUE_SOON' }).gte('due_date', today).lte('due_date', inThirty).not('status', 'in', '(COMPLETED,EXEMPT,OVERDUE)').select('id,organization_id,assigned_user_id,title'),
    supabase.from('documents').update({ status: 'EXPIRED' }).lt('expiry_date', today).is('deleted_at', null).select('id,organization_id,uploaded_by,name'),
    supabase.from('documents').select('id,organization_id,uploaded_by,name,expiry_date').gte('expiry_date', today).lte('expiry_date', inThirty).is('deleted_at', null),
  ])
  const rows = [...(overdue.data ?? []).map(x => ({organization_id:x.organization_id,user_id:x.assigned_user_id,type:'OBLIGATION_DUE',title:'Obligation overdue',message:x.title,resource_type:'obligation',resource_id:x.id})), ...(dueSoon.data ?? []).map(x => ({organization_id:x.organization_id,user_id:x.assigned_user_id,type:'OBLIGATION_DUE',title:'Obligation due soon',message:x.title,resource_type:'obligation',resource_id:x.id})), ...(expired.data ?? []).map(x => ({organization_id:x.organization_id,user_id:x.uploaded_by,type:'DOCUMENT_EXPIRED',title:'Document expired',message:x.name,resource_type:'document',resource_id:x.id})), ...(expiring.data ?? []).map(x => ({organization_id:x.organization_id,user_id:x.uploaded_by,type:'DOCUMENT_EXPIRING',title:'Document expiring soon',message:x.name,resource_type:'document',resource_id:x.id}))].filter(x => x.user_id)
  if (rows.length) await supabase.from('notifications').upsert(rows, { onConflict: 'user_id,resource_id,type' })
  return NextResponse.json({ ok: true, processed: { overdue: overdue.data?.length ?? 0, dueSoon: dueSoon.data?.length ?? 0, expired: expired.data?.length ?? 0, expiring: expiring.data?.length ?? 0 } })
}
