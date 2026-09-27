import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const reportTypes = ['Compliance Summary','Expiring Documents','Overdue Obligations','Open Risks','Vendor Compliance','Document Inventory','Audit Activity','Monthly Management Report']

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: member } = user ? await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle() : { data: null }
  const { data: reports } = member ? await supabase.from('reports').select('id,name,report_type,status,generated_at,created_at').eq('organization_id', member.organization_id).order('created_at',{ascending:false}).limit(50) : {data:[]}
  return <div className="shell"><aside className="sidebar"><div className="brand">ComplyOS</div><nav className="nav"><Link href="/dashboard">Dashboard</Link><Link href="/documents">Documents</Link><Link href="/compliance">Compliance</Link><Link href="/calendar">Calendar</Link><Link href="/tasks">Tasks</Link><Link href="/risks">Risks</Link><Link href="/vendors">Vendors</Link><Link className="active" href="/reports">Reports</Link><Link href="/copilot">AI Copilot</Link></nav></aside><main className="main"><header className="topbar"><div><div className="eyebrow">Management reporting</div><div className="h1">Reports</div><p className="muted">Generate evidence-based reports from your organization records.</p></div></header><section className="grid two">{reportTypes.map(type=><div className="card" key={type}><h2 className="section-title">{type}</h2><p className="muted">Creates a report from current tenant data. No legal-compliance conclusion is inferred.</p><form action="/api/reports" method="post"><input type="hidden" name="report_type" value={type}/><button className="btn primary">Generate</button></form></div>)}</section><div style={{height:16}}/><section className="card"><h2 className="section-title">Recent reports</h2><div className="list">{reports?.length ? reports.map(r=><div className="row" key={r.id}><span><b>{r.name}</b><small className="muted" style={{display:'block'}}>{r.report_type} · {r.created_at}</small></span><span className="badge">{r.status}</span></div>) : <div className="empty">No reports generated yet.</div>}</div></section></main></div>
}
