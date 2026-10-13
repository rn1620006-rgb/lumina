'use strict';
(() => {
 const form=document.getElementById('join-form'),status=document.getElementById('join-status'),submit=document.getElementById('join-submit');
 const category=document.getElementById('join-category-wrap');
 let enabled=false;
 const setStatus=(message,type='')=>{status.textContent=message;status.className='join-status '+type};
 async function check(){
  try{
   const response=await fetch('/api/health',{cache:'no-store'});
   const data=await response.json();
   enabled=Boolean(response.ok && data.submissionsEnabled);
  }catch{enabled=false}
  submit.disabled=!enabled;
  setStatus(enabled?'Pré-inscrições disponíveis. Podes enviar a tua manifestação de interesse.':'Os pré-registos online ainda não estão abertos. Podes contactar a equipa pelo email abaixo.');
 }
 function updateRole(){
  const role=form.querySelector('input[name="kind"]:checked')?.value;
  category.hidden=role!=='profissional';
 }
 form.querySelectorAll('input[name="kind"]').forEach(e=>e.addEventListener('change',updateRole));
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!enabled){setStatus('As inscrições online ainda não estão disponíveis. Usa o contacto por email.','error');return}
  const fd=new FormData(form);
  const payload={
   kind:fd.get('kind'),fullName:String(fd.get('fullName')||''),email:String(fd.get('email')||''),
   city:String(fd.get('city')||''),category:fd.get('kind')==='profissional'?String(fd.get('category')||''):'',
   message:String(fd.get('message')||''),website:String(fd.get('website')||''),
   privacyConsent:fd.get('privacyConsent')==='on'
  };
  submit.disabled=true;submit.textContent='A enviar…';
  try{
   const response=await fetch('/api/interesse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const data=await response.json();
   if(!response.ok || !data.ok)throw new Error(data.error||'Não foi possível enviar.');
   form.reset();updateRole();
   setStatus('Obrigado! A manifestação de interesse foi recebida. Entraremos em contacto quando houver novidades.','success');
  }catch(err){setStatus(err.message||'Erro ao enviar. Tenta novamente.','error')}
  finally{submit.disabled=!enabled;submit.textContent='Enviar manifestação de interesse ↗'}
 });
 document.getElementById('copyright-year').textContent=new Date().getFullYear();
 updateRole();check();
})();
