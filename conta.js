import { auth, database, LUMINA_PATH } from './firebase-client.js';
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, sendEmailVerification, sendPasswordResetEmail, reload,
  getIdToken, setPersistence, browserLocalPersistence,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { ref, set, update, push, onValue, serverTimestamp, remove, query, orderByChild, equalTo, get }
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
  requestsList:el('requests-list'),requestCounter:el('request-counter'),
  publishOptin:el('request-publish-optin'),
  editProfileForm:el('edit-profile-form'),editProfileSubmit:el('edit-profile-submit'),
  requestSearch:el('request-search'),connectionStatus:el('firebase-connection-status'),
  connectionDot:el('firebase-connection-dot'),verificationState:el('account-verification-state'),
  passwordForm:el('password-form'),passwordSubmit:el('password-submit')
};
let mode='login', registrationOpen=false, currentUser=null, currentProfile=null;
let stopProfile=null,stopRequests=null,stopPublic=null,busy=false;
let publishedIds=new Set();
let myRequests=[];
const requestedCategory=new URLSearchParams(window.location.search).get('categoria');
let categoryApplied=false;
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
    'auth/requires-recent-login':'Por segurança, volta a iniciar sessão antes de alterar a palavra-passe.',
    'auth/user-token-expired':'A sessão expirou. Entra novamente na tua conta.',
    'auth/invalid-user-token':'A sessão já não é válida. Volta a entrar.',
    'auth/provider-already-linked':'A tua conta está associada a outro método de autenticação.',
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
  elements.authSubmit.textContent=create?(registrationOpen?'Criar conta LUMINA ↗':'Registo temporariamente fechado'):'Entrar na LUMINA ↗';
  elements.authSubmit.disabled=busy||(create&&!registrationOpen);
  el('auth-password').setAttribute('autocomplete',create?'new-password':'current-password');
  el('register-name').required=create;el('register-city').required=create;
  elements.consent.required=create;
  clearToast();
}
document.querySelectorAll('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.authTab)));
function checkRegistration(){
  return onValue(ref(database,LUMINA_PATH+'/public/registrationEnabled'),snapshot=>{
    const previous=registrationOpen;
    registrationOpen=snapshot.val()===true;
    elements.registrationNotice.textContent=registrationOpen
      ?'Registo disponível.'
      :'Ainda não é possível criar contas. Verifica se a flag lumina_v1/public/registrationEnabled está definida como true no Realtime Database.';
    elements.registrationNotice.hidden=mode!=='register'||registrationOpen;
    elements.authSubmit.disabled=busy||(mode==='register'&&!registrationOpen);
    if(previous!==registrationOpen && mode==='register' && !busy) {
      elements.authSubmit.textContent=registrationOpen?'Criar conta LUMINA ↗':'Registo temporariamente fechado';
    }
  },()=>{
    registrationOpen=false;
    elements.registrationNotice.textContent='Não foi possível consultar a configuração pública de registo. Verifica se as regras publicadas permitem ler lumina_v1/public/registrationEnabled.';
    elements.registrationNotice.hidden=mode!=='register';
    if(mode==='register')elements.authSubmit.disabled=true;
  });
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
    elements.authSubmit.textContent=mode==='register'?(registrationOpen?'Criar conta LUMINA ↗':'Registo temporariamente fechado'):'Entrar na LUMINA ↗';
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
  if(stopPublic){stopPublic();stopPublic=null}
  publishedIds=new Set();
  currentProfile=null;
  myRequests=[];
  elements.requestsList.replaceChildren();
  elements.requestCounter.textContent='0 pedidos';
}
function verificationUI(user){
  const isVerified=Boolean(user.emailVerified);
  elements.verifyBox.hidden=isVerified;
  elements.requestSubmit.disabled=!isVerified;
  if(elements.verificationState) elements.verificationState.textContent=isVerified?'Email verificado ✓':'Verificação de email pendente';
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
    const editor=document.querySelector('.profile-editor');
    if(!editor?.open){
      el('edit-profile-name').value=prof.name||'';
      el('edit-profile-city').value=prof.city||'';
    }
    el('profile-display-name').textContent=prof.name||'Utilizador LUMINA';
    el('profile-monogram').textContent=(prof.name||'L').charAt(0).toUpperCase();
    el('profile-meta').textContent=(prof.role==='cliente'?'Cliente':'Profissional')+' · '+(prof.city||'Portugal');
    el('dashboard-title').textContent='Olá, '+(prof.name||'').split(' ')[0]+'.';
    el('request-city').value=el('request-city').value||prof.city||'';
    if(prof.role==='cliente' && requestedCategory && !categoryApplied){
      const input=el('request-category');
      const available=[...input.options].map(option=>option.value);
      const match=available.find(value=>value.toLocaleLowerCase('pt-PT')===requestedCategory.toLocaleLowerCase('pt-PT'));
      input.value=match||'Outros serviços';
      categoryApplied=true;
      toast('Categoria selecionada: '+requestedCategory+'. Guarda o pedido no teu espaço pessoal quando estiver pronto.','info');
    }
  }
  if(hasProfile && prof.role==='cliente'){
    listenRequests();
    listenMyPublications();
  }else{
    if(stopRequests){stopRequests();stopRequests=null;}
    if(stopPublic){stopPublic();stopPublic=null;}
    myRequests=[];publishedIds=new Set();
    renderRequestList();
  }
}
// Publicação voluntária: publica apenas dados minimizados, nunca detalhes nem email.
async function publishSummary(item,alreadyConfirmed=false){
  const user=currentUser;
  if(!user || !currentProfile || currentProfile.role!=='cliente'){
    toast('É necessária uma conta de cliente para publicar pedidos.','error');
    return false;
  }
  if(!user.emailVerified){
    toast('Confirma o email antes de publicar um pedido.','error');
    return false;
  }
  if(!item || !item.id || item.ownerUid!==user.uid){
    toast('Este pedido não pertence à tua conta.','error');
    return false;
  }
  if(!alreadyConfirmed){
    const confirmed=window.confirm(
      'Tornar este pedido visível na página inicial da LUMINA?\n\n'+
      'Título: '+item.title+'\nCategoria: '+item.category+'\nLocalidade: '+item.city+
      '\n\nO email, a descrição completa e os teus dados pessoais continuarão privados. Confirma que o título não contém contactos nem moradas completas.'
    );
    if(!confirmed)return false;
  }
  try{
    await getIdToken(user,true);
    await set(ref(database,LUMINA_PATH+'/publicRequests/'+item.id),{
      id:item.id,ownerUid:user.uid,title:item.title,category:item.category,city:item.city,
      createdAt:item.createdAt,publishedAt:serverTimestamp()
    });
    publishedIds.add(item.id);
    renderRequestList();
    toast('Resumo publicado na página inicial da LUMINA.','success');
    return true;
  }catch(error){
    toast('O pedido continua guardado em privado, mas não foi publicado. Confirma que as novas regras de publicRequests foram publicadas na consola Firebase.','error');
    return false;
  }
}
async function unpublishSummary(item){
  const user=currentUser;
  if(!user || item.ownerUid!==user.uid)return;
  try{
    await remove(ref(database,LUMINA_PATH+'/publicRequests/'+item.id));
    publishedIds.delete(item.id);
    renderRequestList();
    toast('Resumo retirado da página inicial. O pedido privado continua guardado.','success');
  }catch(error){toast(friendlyError(error),'error');}
}
function listenMyPublications(){
  if(stopPublic || !currentUser)return;
  stopPublic=onValue(
    query(ref(database,LUMINA_PATH+'/publicRequests'),orderByChild('ownerUid'),equalTo(currentUser.uid)),
    snapshot=>{
      publishedIds=new Set(snapshot.exists()?Object.keys(snapshot.val()):[]);
      renderRequestList();
    },()=>{
      // Falha na leitura pública não deve interromper o histórico privado.
      publishedIds=new Set();
      renderRequestList();
    }
  );
}
function renderRequestList(){
  const q=safeText(elements.requestSearch.value,180).toLocaleLowerCase('pt-PT');
  const filtered=myRequests.filter(item=>
    [item.title,item.category,item.city,item.details].some(value=>String(value||'').toLocaleLowerCase('pt-PT').includes(q))
  );
  elements.requestCounter.textContent=myRequests.length+' '+(myRequests.length===1?'pedido':'pedidos');
  elements.requestsList.replaceChildren();
  if(!filtered.length){
    const p=document.createElement('p');p.className='muted';
    p.textContent=myRequests.length?'Não existem pedidos correspondentes à pesquisa.':'Ainda não guardaste pedidos.';
    elements.requestsList.append(p);return;
  }
  for(const item of filtered){
    const node=document.createElement('article');node.className='request-item';
    const title=document.createElement('h4');title.textContent=item.title||'Pedido de orçamento';
    const subtitle=document.createElement('p');subtitle.className='request-meta';
    subtitle.textContent=(item.category||'Serviço')+' · '+(item.city||'Algarve');
    const details=document.createElement('p');details.textContent=item.details||'';
    const status=document.createElement('span');status.className='request-state';
    status.textContent='✦ Guardado (não enviado)';
    const copy=document.createElement('button');copy.className='account-copy';copy.type='button';
    copy.textContent='Copiar resumo ↗';
    copy.setAttribute('aria-label','Copiar resumo do pedido '+String(item.title||''));
    copy.addEventListener('click',async()=>{
      const summary=[item.title,item.category+' · '+item.city,item.details].join('\n\n');
      try {
        if(!navigator.clipboard?.writeText)throw new Error('clipboard_unavailable');
        await navigator.clipboard.writeText(summary);
        toast('Resumo copiado. Não contém dados de outros utilizadores.','success');
      }catch{toast('Não foi possível copiar automaticamente. Usa a seleção manual do texto.','error');}
    });
    const publication=document.createElement('button');
    publication.type='button';
    publication.className='account-publication-action';
    publication.textContent=publishedIds.has(item.id)?'Retirar da página inicial':'Publicar resumo na página inicial';
    publication.addEventListener('click',async()=>{
      publication.disabled=true;
      try{
        if(publishedIds.has(item.id))await unpublishSummary(item);
        else await publishSummary(item);
      }finally{publication.disabled=false;}
    });
    node.append(title,subtitle,details,status,copy,publication);elements.requestsList.append(node);
  }
}
elements.requestSearch.addEventListener('input',renderRequestList);
function listenRequests(){
  if(stopRequests || !currentUser)return;
  stopRequests=onValue(ref(database,LUMINA_PATH+'/requests/'+currentUser.uid),snapshot=>{
    myRequests=snapshot.exists()?Object.values(snapshot.val()).filter(x=>x&&typeof x==='object'):[];
    myRequests.sort((a,b)=>(Number(b.createdAt)||0)-(Number(a.createdAt)||0));
    renderRequestList();
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
// Alteração de palavra-passe apenas com autenticação recente. Nunca se armazena a palavra-passe no RTDB.
elements.passwordForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const user=currentUser;
  if(!user){toast('Inicia sessão antes de alterar a palavra-passe.','error');return;}
  if(!user.email || !user.providerData.some(provider=>provider.providerId==='password')){
    toast('Este método de alteração está disponível apenas para contas com email e palavra-passe.','error');
    return;
  }
  const current=el('password-current').value;
  const next=el('password-new').value;
  const confirmation=el('password-confirm').value;
  if(next.length<10 || next.length>128){
    toast('Escolhe uma palavra-passe nova com 10 a 128 caracteres.','error');return;
  }
  if(next!==confirmation){
    toast('A confirmação da nova palavra-passe não coincide.','error');return;
  }
  if(current===next){
    toast('A nova palavra-passe tem de ser diferente da atual.','error');return;
  }
  elements.passwordSubmit.disabled=true;
  elements.passwordSubmit.textContent='A atualizar…';
  try{
    const credential=EmailAuthProvider.credential(user.email,current);
    await reauthenticateWithCredential(user,credential);
    await updatePassword(user,next);
    elements.passwordForm.reset();
    const details=el('account-security');
    if(details)details.open=false;
    toast('Palavra-passe atualizada com sucesso.','success');
  }catch(error){
    toast(friendlyError(error),'error');
  }finally{
    elements.passwordSubmit.disabled=false;
    elements.passwordSubmit.textContent='Atualizar palavra-passe ↗';
  }
});

elements.editProfileForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const user=currentUser,profile=currentProfile;
  if(!user || !profile || !['cliente','profissional'].includes(profile.role)){
    toast('Inicia sessão e completa o perfil antes de o editar.','error');return;
  }
  const name=safeText(el('edit-profile-name').value);
  const city=safeText(el('edit-profile-city').value,80);
  if(name.length<2||city.length<2){
    toast('O nome e a localidade devem ter pelo menos 2 caracteres.','error');return;
  }
  elements.editProfileSubmit.disabled=true;
  elements.editProfileSubmit.textContent='A guardar…';
  try{
    // Atualiza apenas campos autorizados pelas Rules já publicadas; papel e email nunca mudam.
    await update(ref(database,LUMINA_PATH+'/profiles/'+user.uid),{
      name,city,updatedAt:serverTimestamp()
    });
    const editor=document.querySelector('.profile-editor');
    if(editor)editor.open=false;
    toast('Dados atualizados e guardados no Firebase.','success');
  }catch(error){toast(friendlyError(error),'error');}
  finally{
    elements.editProfileSubmit.disabled=false;
    elements.editProfileSubmit.textContent='Guardar alterações ↗';
  }
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
  const alsoPublish=elements.publishOptin.checked;
  elements.requestSubmit.disabled=true;elements.requestSubmit.textContent='A guardar…';
  try{
    await getIdToken(currentUser,true);
    const node=push(ref(database,LUMINA_PATH+'/requests/'+currentUser.uid));
    await set(node,{id:node.key,ownerUid:currentUser.uid,title,category,city,details,createdAt:serverTimestamp(),status:'novo'});
    elements.requestForm.reset();el('request-city').value=currentProfile.city||'';
    if(alsoPublish){
      // O timestamp público tem de coincidir com o valor da cópia privada já persistida.
      const persisted=await get(ref(database,LUMINA_PATH+'/requests/'+currentUser.uid+'/'+node.key));
      if(persisted.exists())await publishSummary(persisted.val(),true);
      else toast('Pedido guardado em privado, mas não foi possível publicar o resumo.','error');
    }else{
      toast('Pedido guardado em privado. Podes publicar o resumo no histórico quando quiseres.','success');
    }
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
onValue(ref(database,'.info/connected'),snapshot=>{
  const connected=snapshot.val()===true;
  elements.connectionStatus.textContent=connected?'Firebase ligado':'Sem ligação em tempo real';
  elements.connectionDot.classList.toggle('online',connected);
},()=>{
  elements.connectionStatus.textContent='Ligação indisponível';
  elements.connectionDot.classList.remove('online');
});
checkRegistration();
