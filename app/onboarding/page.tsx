'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage(){
 const router=useRouter(); const [name,setName]=useState(''); const [slug,setSlug]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false)
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError('');const supabase=createClient();const {data,error}=await supabase.rpc('create_organization',{org_name:name,org_slug:slug});if(error){setError(error.message);setLoading(false);return}if(data) router.push('/dashboard')}
 return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24}}><form onSubmit={submit} className="card" style={{width:'100%',maxWidth:520,display:'grid',gap:14}}><div><div className="eyebrow">ComplyOS setup</div><h1 className="h1">Create your organization</h1><p className="muted">Your account becomes the organization owner. Additional members can be invited later.</p></div><label>Organization name<input className="input" value={name} onChange={e=>setName(e.target.value)} required minLength={2}/></label><label>Workspace slug<input className="input" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-'))} required minLength={2}/></label>{error&&<div className="badge bad">{error}</div>}<button className="btn primary" disabled={loading}>{loading?'Creating…':'Create organization'}</button></form></main>
}
