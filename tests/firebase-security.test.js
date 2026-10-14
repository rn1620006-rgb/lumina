'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const rules=JSON.parse(fs.readFileSync('database/firebase.rules.json','utf8')).rules;
const config=fs.readFileSync('firebase-client.js','utf8');
const app=fs.readFileSync('conta.js','utf8');
test('nega acesso geral por omissão',()=>{
  assert.equal(rules['.read'],false);assert.equal(rules['.write'],false);
});
test('perfis próprios exigem UID autenticado',()=>{
  const p=rules.lumina_v1.profiles['$uid'];
  assert.match(p['.read'],/auth\.uid === \$uid/);
  assert.match(p['.write'],/auth\.uid === \$uid/);
  assert.match(p.role['.validate'],/data\.val\(\) === newData\.val\(\)/);
  assert.match(p['.write'],/registrationEnabled/);
  assert.equal(p['$other']['.validate'],false);
});
test('pedidos exigem email verificado e papel de cliente',()=>{
  const p=rules.lumina_v1.requests['$uid']['$requestId'];
  assert.match(p['.write'],/email_verified/);
  assert.match(p['.write'],/cliente/);
  assert.match(p['.write'],/!data\.exists\(\)/);
  assert.equal(p['$other']['.validate'],false);
});
test('config web publica sem segredos de serviço',()=>{
  assert.match(config,/lumina-a0b15/);
  assert.match(config,/gstatic\.com\/firebasejs\/12\.19\.0/);
  assert.doesNotMatch(config,/private_key|serviceAccount|credential\.cert/);
});
test('aplicação persiste pedidos próprios e não promove admins',()=>{
  assert.match(app,/onAuthStateChanged/);
  assert.match(app,/currentUser\.uid/);
  assert.match(app,/serverTimestamp/);
  assert.doesNotMatch(app,/admin:\s*true|isAdmin:\s*true/);
});
