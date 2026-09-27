import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: member } = user ? await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle() : { data: null }
  const { data: notifications } = member ? await supabase.from('notifications').select('id,type,title,message,resource_type,resource_id,read_at,created_at').eq('organization_id', member.organization_id).eq('user_id', user!.id).order('created_at',{ascending:false}).limit(100) : {data:[]}
  return <div className="shell"><aside className="sidebar"><div className="brand">ComplyOS</div><nav className="nav"><Link href="/dashboard">Dashboard</Link><Link href="/documents">Documents</Link><Link href="/compliance">Compliance</Link><Link href="/calendar">Calendar</Link><Link href="/tasks">Tasks</Link><Link href="/risks">Risks</Link><Link href="/vendors">Vendors</Link><Link href="/reports">Reports</Link><Link href="/copilot">AI Copilot</Link></nav></aside><main className="main"><header className="topbar"><div><div className="eyebrow">Activity</div><div className="h1">Notifications</div></div></header><section className="card"><div className="list">{notifications?.length ? notifications.map(n=><div className="row" key={n.id}><span><b>{n.title}</b><small className="muted" style={{display:'block'}}>{n.message}</small></span><span className={n.read_at?'badge':'badge warn'}>{n.read_at?'Read':'Unread'}</span></div>) : <div className="empty">You're all caught up.</div>}</div></section></main></div>
}
