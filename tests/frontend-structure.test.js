'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

function read(path){return fs.readFileSync(path,'utf8')};
const html=read('conta.html'),script=read('conta.js'),rules=JSON.parse(read('database/firebase.rules.json')).rules;

test('todos os elementos usados pelo painel existem no HTML',()=>{
 const names=[...script.matchAll(/\bel\('([^']+)'\)/g)].map(item=>item[1]);
 for(const id of new Set(names)){assert.match(html,new RegExp('id="'+id+'"'),id+' não existe');}
});
test('dashboard permite editar apenas nome e localidade',()=>{
 assert.match(html,/id="edit-profile-name"/);
 assert.match(html,/id="edit-profile-city"/);
 assert.match(script,/update\(ref\(database,LUMINA_PATH\+'\/profiles\/'\+user\.uid\)/);
 assert.match(script,/name,city,updatedAt:serverTimestamp\(\)/);
});
test('pesquisa do histórico não consulta outros utilizadores',()=>{
 assert.match(script,/myRequests\.filter/);
 assert.match(script,/LUMINA_PATH\+'\/requests\/'\+currentUser\.uid/);
 assert.equal(rules.lumina_v1.requests['$uid']['.read'].includes('auth.uid === $uid'),true);
});
test('registos dependem de flag controlada no RTDB',()=>{
 assert.match(script,/registrationEnabled/);
 assert.equal(rules.lumina_v1.public.registrationEnabled['.write'],false);
});
test('não existem menus de administração sem controlo de servidor',()=>{
 assert.doesNotMatch(html,/id="admin-dashboard"/);
 assert.doesNotMatch(script,/set\(.+admin/);
});

test('o catálogo permite preparar pedidos privados sem os publicar',()=>{
  const catalog=read('app.js');
  assert.match(catalog,/conta\.html\?categoria=/);
  assert.match(script,/requestedCategory/);
  assert.match(script,/request-category/);
  assert.match(html,/id="request-form"/);
});
test('editor e pesquisador de pedidos oferecem controlos reais',()=>{
  assert.match(html,/id="edit-profile-form"/);
  assert.match(html,/id="request-search"/);
  assert.match(script,/elements\.requestSearch\.addEventListener\('input',renderRequestList\)/);
  assert.match(script,/navigator\.clipboard\.writeText/);
});

test('segurança da conta exige reautenticação antes de alterar palavra-passe',()=>{
 assert.match(html,/id="password-form"/);
 assert.match(html,/id="password-current"/);
 assert.match(html,/id="password-new"/);
 assert.match(html,/id="password-confirm"/);
 assert.match(script,/EmailAuthProvider\.credential\(user\.email,current\)/);
 assert.match(script,/await reauthenticateWithCredential\(user,credential\);\s*await updatePassword\(user,next\)/);
 assert.doesNotMatch(script,/set\(ref\(database,[^;]*password/i);
});
test('nunca apresenta email verificado como aprovação profissional',()=>{
 assert.match(html,/Verifica o teu email/i);
 assert.match(html,/verificação documental/i);
});

test('homepage integra todos os pedidos PUBLICADOS sem aba separada',()=>{
  const homepage=read('index.html');
  const feed=read('pedidos-publicos.js');
  assert.match(homepage,/id="public-requests-feed"/);
  assert.match(homepage,/src="\/pedidos-publicos\.js"/);
  assert.match(feed,/LUMINA_PATH\+'\/publicRequests'/);
  assert.doesNotMatch(feed,/LUMINA_PATH\+'\/requests\/'/);
  assert.equal(feed.includes("ref(database,LUMINA_PATH+'/profiles/"),false);
});
test('cliente escolhe o que será público e pode voltar a privatizar',()=>{
  assert.match(html,/id="request-publish-optin"/);
  assert.match(script,/function publishSummary\(/);
  assert.match(script,/function unpublishSummary\(/);
  assert.match(script,/remove\(ref\(database,LUMINA_PATH\+'\/publicRequests\/'\+item\.id\)\)/);
  assert.match(script,/title:item\.title,category:item\.category,city:item\.city/);
  assert.doesNotMatch(script,/details:item\.details,.*publishedAt/);
});
