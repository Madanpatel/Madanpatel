'use client'

import { useRef, useState } from 'react'

export default function UploadForm(){
 const input=useRef<HTMLInputElement>(null); const [state,setState]=useState('')
 async function upload(file:File){
  setState(`Uploading ${file.name}…`); const form=new FormData(); form.append('file',file)
  const res=await fetch('/api/documents/upload',{method:'POST',body:form}); const data=await res.json()
  if(!res.ok){setState(data.error??'Upload failed');return} setState('Uploaded. Processing will continue in the background.')
 }
 return <div><input ref={input} hidden type="file" accept="application/pdf,.docx,.xlsx,image/png,image/jpeg" onChange={e=>{const f=e.target.files?.[0];if(f) upload(f)}}/><button type="button" className="btn" onClick={()=>input.current?.click()}>Choose file</button>{state&&<div className="metric-sub" style={{marginTop:10}}>{state}</div>}</div>
}
