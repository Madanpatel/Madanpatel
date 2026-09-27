import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: membership } = user
    ? await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
    : { data: null }
  const orgId = membership?.organization_id

  const [docs, risks, obligations, tasks] = orgId
    ? await Promise.all([
        supabase.from('documents').select('id,expiry_date,name', { count: 'exact' }).eq('organization_id', orgId).is('deleted_at', null),
        supabase.from('risks').select('id', { count: 'exact' }).eq('organization_id', orgId).in('status', ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS']),
        supabase.from('compliance_obligations').select('id', { count: 'exact' }).eq('organization_id', orgId).in('status', ['OVERDUE', 'DUE']),
        supabase.from('tasks').select('id', { count: 'exact' }).eq('organization_id', orgId).in('status', ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'AWAITING_REVIEW']),
      ])
    : [{ count: 0, data: [] }, { count: 0, data: [] }, { count: 0, data: [] }, { count: 0, data: [] }]

  const now = Date.now()
  const expiring = docs.data?.filter((d) => {
    if (!d.expiry_date) return false
    const expiry = new Date(d.expiry_date).getTime()
    return expiry >= now && expiry <= now + 30 * 86400000
  }).length ?? 0

  const metrics = [
    ['Open Risks', risks.count ?? 0, 'Unresolved', '/risks'],
    ['Overdue Obligations', obligations.count ?? 0, 'Requires action', '/compliance'],
    ['Expiring Documents', expiring, 'Next 30 days', '/documents'],
    ['Open Tasks', tasks.count ?? 0, 'Assigned work', '/tasks'],
  ]

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">ComplyOS</div>
        <nav className="nav">
          {[['Dashboard','/dashboard'],['Documents','/documents'],['Compliance','/compliance'],['Calendar','/calendar'],['Tasks','/tasks'],['Risks','/risks'],['Vendors','/vendors'],['Reports','/reports'],['AI Copilot','/copilot']].map(([label, href]) => (
            <Link className={label === 'Dashboard' ? 'active' : ''} key={href} href={href}>{label}</Link>
          ))}
        </nav>
        <div style={{ marginTop: 'auto' }} className="nav">
          <Link href="/notifications">Notifications</Link>
          <Link href="/settings">Settings</Link>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div><div className="eyebrow">ComplyOS workspace</div><div className="h1">Compliance overview</div><p className="muted">Metrics are calculated from records available to your organization.</p></div>
          <Link href="/documents#upload" className="btn primary">Upload document</Link>
        </header>
        <section className="grid metrics">
          {metrics.map(([label, value, sub, href]) => <Link href={href} className="card" key={label}><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-sub">{sub}</div></Link>)}
        </section>
        <div style={{ height: 16 }} />
        <section className="grid two">
          <div className="card"><h2 className="section-title">Evidence coverage</h2><p className="muted">ComplyOS does not declare legal compliance. Review configured obligations and supporting evidence before making decisions.</p><div className="list"><div className="row"><span>Documents recorded</span><b>{docs.count ?? 0}</b></div><div className="row"><span>Open risks</span><b>{risks.count ?? 0}</b></div><div className="row"><span>Overdue obligations</span><b>{obligations.count ?? 0}</b></div></div></div>
          <div className="card"><h2 className="section-title">Next actions</h2><div className="list"><div className="row"><span>Review overdue obligations</span><Link href="/compliance" className="badge warn">Open</Link></div><div className="row"><span>Review expiring documents</span><Link href="/documents" className="badge warn">Open</Link></div><div className="row"><span>Review unresolved risks</span><Link href="/risks" className="badge bad">Open</Link></div></div></div>
        </section>
      </main>
    </div>
  )
}
