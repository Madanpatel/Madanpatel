import Link from 'next/link'
import { login } from './actions'

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24}}><form action={login} className="card" style={{width:'100%',maxWidth:420,display:'grid',gap:14}}><div><div className="eyebrow">ComplyOS</div><h1 className="h1">Sign in</h1><p className="muted">Access your organization's compliance workspace.</p></div>{params.error&&<div className="badge bad">Sign-in failed. Check your credentials and try again.</div>}<label>Email<input className="input" name="email" type="email" required/></label><label>Password<input className="input" name="password" type="password" required/></label><button className="btn primary" type="submit">Sign in</button><p className="muted">New to ComplyOS? <Link href="/signup">Create an account</Link></p></form></main>
}
