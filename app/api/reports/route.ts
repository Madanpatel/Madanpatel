import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))
  const form = await request.formData()
  const reportType = String(form.get('report_type') ?? '').trim()
  const allowed = new Set(['Compliance Summary','Expiring Documents','Overdue Obligations','Open Risks','Vendor Compliance','Document Inventory','Audit Activity','Monthly Management Report'])
  if (!allowed.has(reportType)) return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
  const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Organization membership required' }, { status: 403 })
  const { error } = await supabase.from('reports').insert({ organization_id: member.organization_id, report_type: reportType, name: `${reportType} — ${new Date().toISOString().slice(0,10)}`, generated_by: user.id, status: 'QUEUED' })
  if (error) return NextResponse.json({ error: 'Unable to queue report' }, { status: 500 })
  return NextResponse.redirect(new URL('/reports', request.url), 303)
}
