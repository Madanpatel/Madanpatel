import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: member } = user ? await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle() : { data: null }
  const orgId = member?.organization_id
  const [obligations, tasks, documents] = orgId ? await Promise.all([
    supabase.from('compliance_obligations').select('id,title,due_date,status,priority').eq('organization_id', orgId).not('due_date','is',null).order('due_date').limit(100),
    supabase.from('tasks').select('id,title,due_date,status,priority').eq('organization_id', orgId).not('due_date','is',null).order('due_date').limit(100),
    supabase.from('documents').select('id,name,expiry_date,status').eq('organization_id', orgId).not('expiry_date','is',null).is('deleted_at',null).order('expiry_date').limit(100),
  ]) : [{data:[]},{data:[]},{data:[]}]
  const items = [
    ...(obligations.data ?? []).map(x => ({date:x.due_date!, type:'Obligation', title:x.title, status:x.status, priority:x.priority, href:'/compliance'})),
    ...(tasks.data ?? []).map(x => ({date:x.due_date!, type:'Task', title:x.title, status:x.status, priority:x.priority, href:'/tasks'})),
    ...(documents.data ?? []).map(x => ({date:x.expiry_date!, type:'Expiry', title:x.name, status:x.status ?? 'REVIEW', priority:'HIGH', href:'/documents'})),
  ].sort((a,b)=>a.date.localeCompare(b.date))
  return <div className="shell"><aside className="sidebar"><div className="brand">ComplyOS</div><nav className="nav">{[['Dashboard','/dashboard'],['Documents','/documents'],['Compliance','/compliance'],['Calendar','/calendar'],['Tasks','/tasks'],['Risks','/risks'],['Vendors','/vendors'],['Reports','/reports'],['AI Copilot','/copilot']].map(([l,h])=><Link className={l==='Calendar'?'active':''} href={h} key={h}>{l}</Link>)}</nav></aside><main className="main"><header className="topbar"><div><div className="eyebrow">Deadlines & renewals</div><div className="h1">Compliance calendar</div><p className="muted">Obligations, tasks and document expiries from your organization records.</p></div></header><section className="card"><div className="list">{items.length ? items.map((item,i)=><Link className="row" href={item.href} key={`${item.type}-${item.title}-${i}`}><span><b>{item.date}</b> · {item.title}<small className="muted" style={{display:'block'}}>{item.type}</small></span><span className={`badge ${item.priority==='CRITICAL'||item.priority==='HIGH'?'bad':item.status==='COMPLETED'?'good':'warn'}`}>{item.status}</span></Link>) : <div className="empty">No dated obligations, tasks or expiries found.</div>}</div></section></main></div>
}
