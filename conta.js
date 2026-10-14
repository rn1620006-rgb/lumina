import { auth, database, LUMINA_PATH } from './firebase-client.js';
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, sendEmailVerification, sendPasswordResetEmail, reload,
  getIdToken, setPersistence, browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { ref, get, set, push, onValue, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';

const el=id=>document.getElementById(id);
const elements={
  loading:el('account-loading'),authPanel:el('account-auth'),dashboard:el('account-dashboard'),
  authForm:el('auth-form'),authSubmit:el('auth-submit'),authTitle:el('auth-title'),
  authDescription:el('auth-description'),registrationFields:el('registration-fields'),
  registrationNotice:el('registration-notice'),consent:el('auth-consent'),consentLabel:el('auth-consent-label'),
  forgot:el('forgot-password'),toast:el('account-toast'),
  profileForm:el('profile-form'),profileMissing:el('profile-missing'),
  profileOverview:el('profile-overview'),clientArea:el('client-area'),
  professionalArea:el('professional-area'),verifyBox:el('verify-box'),
  requestForm:el('request-form'),requestSubmit:el('request-submit'),
  requestsList:el('requests-list'),requestCounter:el('request-counter')
};
let mode='login', registrationOpen=false, currentUser=null, currentProfile=null;
let stopProfile=null,stopRequests=null,busy=false;
el('copyright-year').textContent=String(new Date().getFullYear());

function toast(message,type='info'){
  elements.toast.textContent=message;
  elements.toast.hidden=false;
  elements.toast.className='account-toast '+type;
}
function clearToast(){elements.toast.hidden=true;elements.toast.textContent='';}
function showPanel(name){
  elements.loading.hidden=name!=='loading';
  elements.authPanel.hidden=name!=='auth';
  elements.dashboard.hidden=name!=='dashboard';
}
function friendlyError(error){
  const code=error?.code||'';
  const map={
    'auth/invalid-credential':'Email ou palavra-passe incorretos.',
    'auth/wrong-password':'Email ou palavra-passe incorretos.',
    'auth/user-not-found':'Email ou palavra-passe incorretos.',
    'auth/email-already-in-use':'Já existe uma conta com este email. Experimenta entrar.',
    'auth/invalid-email':'O endereço de email não é válido.',
    'auth/weak-password':'Escolhe uma palavra-passe mais forte.',
    'auth/too-many-requests':'Demasiadas tentativas. Volta a tentar mais tarde.',
    'auth/operation-not-allowed':'Ativa Email/Password nas definições de Authentication do Firebase.',
    'auth/unauthorized-domain':'Adiciona o domínio da LUMINA à lista de domínios autorizados do Firebase.',
    'auth/network-request-failed':'Não foi possível contactar o Firebase. Verifica a ligação à internet.',
    'PERMISSION_DENIED':'A base de dados recusou a operação. Confirma as regras de segurança no Firebase.',
    'permission_denied':'A base de dados recusou a operação. Confirma as regras de segurança no Firebase.'
  };
  return map[code]||(/permission.denied/i.test(String(error?.message||''))?
    'O Realtime Database bloqueou o acesso. Verifica as regras de segurança no Firebase.':
    'Não foi possível concluir esta operação. Tenta novamente.');
}
function safeText(value,max=120){return typeof value==='string'?value.trim().replace(/\s+/g,' ').slice(0,max):'';}
function setMode(next){
  mode=next;
  document.querySelectorAll('[data-auth-tab]').forEach(b=>{
    const active=b.dataset.authTab===next;b.classList.toggle('active',active);
    b.setAttribute('aria-selected',String(active));
  });
  const create=next==='register';
  elements.registrationFields.hidden=!create;
  elements.consentLabel.hidden=!create;
  elements.forgot.hidden=create;
  elements.registrationNotice.hidden=!create||registrationOpen;
  elements.authTitle.textContent=create?'A tua história começa aqui.':'Bem-vindo à LUMINA.';
  elements.authDescription.textContent=create?'Cria o teu espaço pessoal como cliente ou profissional.':'Entra com a tua conta e continua de onde ficaste.';
  elements.authSubmit.textContent=create?'Criar conta LUMINA ↗':'Entrar na LUMINA ↗';
  elements.authSubmit.disabled=busy||(create&&!registrationOpen);
  el('auth-password').setAttribute('autocomplete',create?'new-password':'current-password');
  el('register-name').required=create;el('register-city').required=create;
  elements.consent.required=create;
  clearToast();
}
document.querySelectorAll('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.authTab)));
async function checkRegistration(){
  try{
    const snapshot=await get(ref(database,LUMINA_PATH+'/public/registrationEnabled'));
    registrationOpen=snapshot.val()===true;
  }catch{
    registrationOpen=false;
  }
  if(mode==='register')setMode('register');
}
elements.authForm.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const email=el('auth-email').value.trim(),password=el('auth-password').value;
  if(mode==='register'){
    if(!registrationOpen){toast('O registo está fechado até à validação das regras de segurança.','error');return;}
    if(!elements.consent.checked){toast('É necessário aceitar a Política de Privacidade.','error');return;}
    const name=safeText(el('register-name').value),city=safeText(el('register-city').value,80);
    const role=el('register-role').value;
    if(name.length<2||city.length<2||!['cliente','profissional'].includes(role)){toast('Preenche corretamente o nome, a localidade e o tipo de conta.','error');return;}
    if(password.length<8){toast('Usa uma palavra-passe com pelo menos 8 caracteres.','error');return;}
  }
  busy=true;elements.authSubmit.disabled=true;elements.authSubmit.textContent='A processar…';clearToast();
  try{
    await setPersistence(auth,browserLocalPersistence);
    if(mode==='login'){
      await signInWithEmailAndPassword(auth,email,password);
      toast('Sessão iniciada com sucesso.','success');
    }else{
      const credential=await createUserWithEmailAndPassword(auth,email,password);
      const user=credential.user;
      const name=safeText(el('register-name').value),city=safeText(el('register-city').value,80),role=el('register-role').value;
      try{
        await set(ref(database,LUMINA_PATH+'/profiles/'+user.uid),{
          uid:user.uid,name,email:user.email,role,city,
          createdAt:serverTimestamp(),updatedAt:serverTimestamp()
        });
      }catch(error){
        toast('A conta foi criada no Authentication, mas o perfil não pôde ser guardado. Confirma as regras do Realtime Database e completa o perfil nesta página.','error');
        throw Object.assign(new Error('PROFILE_SAVE_FAILED'),{profileSaveFailed:true});
      }
      try{await sendEmailVerification(user);}catch{toast('Conta criada! Não foi possível enviar o email de verificação agora. Podes tentar novamente no teu painel.','error');}
      if(!elements.toast.hidden)return;
      toast('Conta criada! Verifica o email para poderes guardar pedidos.','success');
    }
  }catch(error){if(!error?.profileSaveFailed)toast(friendlyError(error),'error');}
  finally{
    busy=false;
    elements.authSubmit.disabled=(mode==='register'&&!registrationOpen);
    elements.authSubmit.textContent=mode==='register'?'Criar conta LUMINA ↗':'Entrar na LUMINA ↗';
  }
});
elements.forgot.addEventListener('click',async()=>{
  const email=el('auth-email').value.trim();
  if(!email){toast('Escreve primeiro o teu email no campo de autenticação.','error');return;}
  try{
    await sendPasswordResetEmail(auth,email);
    toast('Se a conta existir e o envio for permitido, receberás instruções para redefinir a palavra-passe.','success');
  }catch(error){toast(friendlyError(error),'error')}
});
el('signout').addEventListener('click',async()=>{try{await signOut(auth);toast('Terminaste a sessão.','success');}catch(error){toast(friendlyError(error),'error')}});
function stopSubscriptions(){
  if(stopProfile){stopProfile();stopProfile=null}
  if(stopRequests){stopRequests();stopRequests=null}
  currentProfile=null;
}
function verificationUI(user){
  const isVerified=Boolean(user.emailVerified);
  elements.verifyBox.hidden=isVerified;
  elements.requestSubmit.disabled=!isVerified;
  return isVerified;
}
el('verify-refresh').addEventListener('click',async()=>{
  if(!currentUser)return;
  try{await reload(currentUser);await getIdToken(currentUser,true);verificationUI(currentUser);renderSections();toast(currentUser.emailVerified?'Email confirmado. Já podes guardar os teus pedidos!':'O email ainda não foi confirmado. Verifica a tua caixa de entrada.',currentUser.emailVerified?'success':'info');}
  catch(error){toast(friendlyError(error),'error')}
});
el('verify-resend').addEventListener('click',async()=>{try{if(!currentUser)return;await sendEmailVerification(currentUser);toast('Email de verificação enviado.','success');}catch(error){toast(friendlyError(error),'error')}});
function renderSections(){
  if(!currentUser)return;
  verificationUI(currentUser);
  const prof=currentProfile;
  const hasProfile=Boolean(prof && ['cliente','profissional'].includes(prof.role));
  elements.profileMissing.hidden=hasProfile;
  elements.profileOverview.hidden=!hasProfile;
  elements.clientArea.hidden=!hasProfile||prof.role!=='cliente';
  elements.professionalArea.hidden=!hasProfile||prof.role!=='profissional';
  if(hasProfile){
    el('profile-display-name').textContent=prof.name||'Utilizador LUMINA';
    el('profile-monogram').textContent=(prof.name||'L').charAt(0).toUpperCase();
    el('profile-meta').textContent=(prof.role==='cliente'?'Cliente':'Profissional')+' · '+(prof.city||'Portugal');
    el('dashboard-title').textContent='Olá, '+(prof.name||'').split(' ')[0]+'.';
    el('request-city').value=el('request-city').value||prof.city||'';
  }
  if(hasProfile && prof.role==='cliente' && currentUser.emailVerified){
    listenRequests();
  }else if(stopRequests){stopRequests();stopRequests=null;elements.requestsList.replaceChildren();elements.requestCounter.textContent='0 pedidos';}
}
function listenRequests(){
  if(stopRequests || !currentUser)return;
  stopRequests=onValue(ref(database,LUMINA_PATH+'/requests/'+currentUser.uid),snapshot=>{
    const items=snapshot.exists()?Object.values(snapshot.val()).filter(x=>x&&typeof x==='object'):[];
    items.sort((a,b)=>(Number(b.createdAt)||0)-(Number(a.createdAt)||0));
    elements.requestCounter.textContent=items.length+' '+(items.length===1?'pedido':'pedidos');
    elements.requestsList.replaceChildren();
    if(!items.length){const p=document.createElement('p');p.className='muted';p.textContent='Ainda não guardaste pedidos.';elements.requestsList.append(p);return;}
    for(const item of items){
      const node=document.createElement('article');node.className='request-item';
      const title=document.createElement('h4');title.textContent=item.title||'Pedido de orçamento';
      const subtitle=document.createElement('p');subtitle.className='request-meta';
      subtitle.textContent=(item.category||'Serviço')+' · '+(item.city||'Algarve');
      const details=document.createElement('p');details.textContent=item.details||'';
      const status=document.createElement('span');status.className='request-state';status.textContent='✦ '+(item.status==='novo'?'Guardado (não enviado)':'Em análise');
      node.append(title,subtitle,details,status);elements.requestsList.append(node);
    }
  },error=>toast(friendlyError(error),'error'));
}
function watchProfile(user){
  stopProfile=onValue(ref(database,LUMINA_PATH+'/profiles/'+user.uid),snapshot=>{
    currentProfile=snapshot.exists()?snapshot.val():null;
    renderSections();
  },error=>{
    currentProfile=null;renderSections();toast(friendlyError(error),'error');
  });
}
elements.profileForm.addEventListener('submit',async event=>{
  event.preventDefault();if(!currentUser)return;
  const name=safeText(el('profile-name').value),city=safeText(el('profile-city').value,80),role=el('profile-role').value;
  if(name.length<2||city.length<2||!['cliente','profissional'].includes(role)){toast('Completa os campos corretamente.','error');return}
  if(currentProfile){toast('O perfil já existe. O tipo de conta não pode ser alterado neste formulário.','error');return;}
  try{
    await set(ref(database,LUMINA_PATH+'/profiles/'+currentUser.uid),{
      uid:currentUser.uid,name,email:currentUser.email,role,city,
      createdAt:serverTimestamp(),updatedAt:serverTimestamp()
    });
    toast('Perfil guardado com sucesso.','success');
  }catch(error){toast(friendlyError(error),'error')}
});
elements.requestForm.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!currentUser||!currentProfile||currentProfile.role!=='cliente'){toast('Entra com uma conta de cliente para guardar pedidos.','error');return;}
  if(!currentUser.emailVerified){toast('Confirma o teu email antes de guardar um pedido.','error');return;}
  const title=safeText(el('request-title').value),category=safeText(el('request-category').value,100),
    city=safeText(el('request-city').value,80),details=el('request-details').value.trim();
  if(title.length<8||!category||city.length<2||details.length<12||details.length>900){
    toast('Preenche os campos do pedido (mínimo de 8 caracteres no título e 12 na descrição).','error');return;
  }
  elements.requestSubmit.disabled=true;elements.requestSubmit.textContent='A guardar…';
  try{
    await getIdToken(currentUser,true);
    const node=push(ref(database,LUMINA_PATH+'/requests/'+currentUser.uid));
    await set(node,{id:node.key,ownerUid:currentUser.uid,title,category,city,details,createdAt:serverTimestamp(),status:'novo'});
    elements.requestForm.reset();el('request-city').value=currentProfile.city||'';
    toast('Pedido guardado no teu espaço pessoal. Ainda não foi enviado a profissionais.','success');
  }catch(error){toast(friendlyError(error),'error');}
  finally{elements.requestSubmit.disabled=!currentUser.emailVerified;elements.requestSubmit.textContent='Guardar pedido ↗';}
});
onAuthStateChanged(auth,user=>{
  stopSubscriptions();currentUser=user;
  if(!user){
    showPanel('auth');setMode(mode);return;
  }
  showPanel('dashboard');el('dashboard-email').textContent=user.email||'Conta autenticada';
  el('profile-name').value=safeText(el('register-name').value||'',120);
  el('profile-city').value=safeText(el('register-city').value||'',80);
  el('profile-role').value=el('register-role').value||'cliente';
  currentProfile=null;renderSections();watchProfile(user);
},error=>{showPanel('auth');toast(friendlyError(error),'error')});
checkRegistration();
