import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request:Request){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser()
 if(!user) return NextResponse.json({error:'Authentication required'},{status:401})
 const {data:member}=await supabase.from('organization_members').select('organization_id').eq('user_id',user.id).eq('status','ACTIVE').maybeSingle()
 if(!member) return NextResponse.json({error:'Active organization membership required'},{status:403})
 const body=await request.json().catch(()=>({})); const question=typeof body.question==='string'?body.question.trim():''
 if(!question) return NextResponse.json({error:'Question is required'},{status:400})
 const terms=question.split(/\s+/).filter((x:string)=>x.length>2).slice(0,8); const pattern=terms.length?`%${terms.join('%')}%`:'%'
 const {data:documents}=await supabase.from('documents').select('id,name,document_type,document_category,expiry_date,verification_status,processing_status').eq('organization_id',member.organization_id).or(`name.ilike.${pattern},document_type.ilike.${pattern},document_category.ilike.${pattern}`).limit(12)
 const context=(documents??[]).map(d=>`Document: ${d.name}; type=${d.document_type??'unknown'}; category=${d.document_category??'unknown'}; expiry=${d.expiry_date??'unknown'}; verification=${d.verification_status}; processing=${d.processing_status}`).join('\n')
 if(!process.env.AI_PROVIDER_API_KEY||!process.env.AI_PROVIDER_BASE_URL||!process.env.AI_MODEL) return NextResponse.json({answer:'AI provider is not configured. I can only surface authorized records until an AI provider is configured.',citations:(documents??[]).map(d=>({id:d.id,name:d.name}))})
 const upstream=await fetch(`${process.env.AI_PROVIDER_BASE_URL.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.AI_PROVIDER_API_KEY}`},body:JSON.stringify({model:process.env.AI_MODEL,temperature:0.1,messages:[{role:'system',content:'You are ComplyOS Copilot. Use only the supplied organization records. Never invent regulations, deadlines, documents or legal conclusions. If evidence is insufficient, say so.'},{role:'user',content:`Question: ${question}\n\nAuthorized evidence:\n${context||'No matching evidence found.'}`}]})})
 if(!upstream.ok) return NextResponse.json({error:'AI provider request failed'},{status:502})
 const result=await upstream.json(); const answer=result?.choices?.[0]?.message?.content
 if(typeof answer!=='string') return NextResponse.json({error:'AI provider returned no answer'},{status:502})
 await supabase.from('ai_runs').insert({organization_id:member.organization_id,user_id:user.id,run_type:'COPILOT',status:'COMPLETED',model:process.env.AI_MODEL,output:{answer},citations:(documents??[]).map(d=>d.id),human_review_required:false})
 return NextResponse.json({answer,citations:(documents??[]).map(d=>({id:d.id,name:d.name}))})
}
