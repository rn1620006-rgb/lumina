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
