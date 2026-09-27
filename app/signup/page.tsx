import Link from 'next/link'
import { signup } from './actions'

export default async function Signup({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24}}><form action={signup} className="card" style={{width:'100%',maxWidth:460,display:'grid',gap:14}}><div><div className="eyebrow">ComplyOS</div><h1 className="h1">Start free</h1><p className="muted">Create your account, verify your email, then configure your organization.</p></div>{params.error&&<div className="badge bad">{params.error}</div>}<label>Email<input className="input" name="email" type="email" required/></label><label>Password<input className="input" name="password" type="password" minLength={8} required/></label><button className="btn primary" type="submit">Create account</button><p className="muted">Already registered? <Link href="/login">Sign in</Link></p></form></main>
}
