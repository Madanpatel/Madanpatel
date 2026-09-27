import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'

const ALLOWED=new Set(['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/png','image/jpeg'])
const MAX=25*1024*1024

export async function POST(request:Request){
 try{
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Authentication required'},{status:401})
  const {data:member}=await supabase.from('organization_members').select('organization_id').eq('user_id',user.id).eq('status','ACTIVE').maybeSingle()
  if(!member) return NextResponse.json({error:'Active organization membership required'},{status:403})
  const body=await request.formData(); const file=body.get('file')
  if(!(file instanceof File)) return NextResponse.json({error:'A file is required'},{status:400})
  if(file.size>MAX) return NextResponse.json({error:'File exceeds 25 MB limit'},{status:413})
  if(!ALLOWED.has(file.type)) return NextResponse.json({error:'Unsupported file type'},{status:415})
  const bytes=Buffer.from(await file.arrayBuffer()); const hash=createHash('sha256').update(bytes).digest('hex')
  const documentId=crypto.randomUUID(); const versionId=crypto.randomUUID(); const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_')
  const path=`${member.organization_id}/${documentId}/${versionId}/${safeName}`
  const upload=await supabase.storage.from('documents').upload(path,bytes,{contentType:file.type,upsert:false})
  if(upload.error) return NextResponse.json({error:'Document storage failed',reference:hash.slice(0,12)},{status:500})
  const {error:docError}=await supabase.from('documents').insert({id:documentId,organization_id:member.organization_id,name:file.name,original_filename:file.name,mime_type:file.type,size_bytes:file.size,sha256:hash,storage_path:path,processing_status:'UPLOADED',verification_status:'PENDING',uploaded_by:user.id,current_version_id:versionId})
  if(docError){ await supabase.storage.from('documents').remove([path]); return NextResponse.json({error:'Document record could not be created',reference:hash.slice(0,12)},{status:500}) }
  const {error:versionError}=await supabase.from('document_versions').insert({id:versionId,document_id:documentId,version_number:1,storage_path:path,file_hash:hash,uploaded_by:user.id,extraction_status:'PENDING'})
  if(versionError) return NextResponse.json({error:'Document version could not be recorded',reference:hash.slice(0,12)},{status:500})
  await supabase.from('audit_events').insert({organization_id:member.organization_id,actor_id:user.id,action:'DOCUMENT_UPLOAD',entity_type:'document',entity_id:documentId,metadata:{filename:file.name,size:file.size,mime_type:file.type}})
  return NextResponse.json({id:documentId,status:'UPLOADED'})
 }catch(error){ console.error('document upload failed',error); return NextResponse.json({error:'Document upload failed'},{status:500}) }
}
