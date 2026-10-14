'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(path)=>fs.readFileSync(path,'utf8');
const home=read('index.html');
const account=read('conta.html');
const privacy=read('privacidade.html');
const app=read('app.js');
const premium=read('premium.css');
const icons=read('assets/lumina-icons.svg');
const styles=read('styles.css');
const feed=read('pedidos-publicos.js');

test('nova hero e navegação usam a marca oficial sem substituição',()=>{
  assert.match(home,/class="hero hero-imperial"/);
  assert.match(home,/id="hero-title"/);
  assert.match(home,/class="hero-primary-actions"/);
  assert.match(home,/class="hero-brand-gallery"/);
  const logos=[...home.matchAll(/data:image\/webp;base64,/g)];
  assert.ok(logos.length>=2);
  assert.match(home,/class="wordmark-original-emblem"/);
  assert.match(premium,/\.wordmark-icon \.wordmark-original-emblem/);
  assert.match(premium,/@media\(max-width:600px\)/);
});
test('cinco fotos em alta definição com srcset e alt',()=>{
  const images=[...home.matchAll(/<img class="category-image"[^>]+>/g)].map(x=>x[0]);
  assert.equal(images.length,5);
  for(const tag of images){
    assert.match(tag,/srcset="/);
    assert.match(tag,/1920w/);
    assert.match(tag,/loading="lazy"/);
    assert.match(tag,/decoding="async"/);
    assert.match(tag,/alt="[^"]+"/);
  }
  assert.match(premium,/\.category--beauty \.category-image/);
  assert.match(premium,/\.category--garden \.category-image/);
});
test('iconografia própria SVG usada em vez de emojis e símbolos de texto',()=>{
  for(const symbol of ['clean','post-clean','plumbing','electric','paint','garden','pool','furniture','climate','wellness','renovation','events','arrow-up-right','menu','shield']){
    assert.match(icons,new RegExp('id="'+symbol+'"'));
  }
  const disallowed=/[✦✧↗◇⌖❀◈✳≋ϟ❄▤⌑◫✿☰←×✓⌕]/u;
  for(const [name,content] of Object.entries({'homepage':home,'account':account,'privacy':privacy,'service-app':app,'public-feed':feed,'original-styles':styles})){
    assert.doesNotMatch(content,disallowed,name+' ainda contém ícone tipográfico');
  }
});
test('sistema visual chega à página de conta e à política de privacidade',()=>{
  assert.match(home,/href="\/premium\.css"/);
  assert.match(account,/href="\/premium\.css"/);
  assert.match(privacy,/href="\/premium\.css"/);
  assert.match(account,/wordmark-original-emblem/);
  assert.match(privacy,/wordmark-original-emblem/);
});
test('Firebase e pedidos publicados preservados na homepage',()=>{
  assert.match(home,/id="public-requests-feed"/);
  assert.match(home,/src="\/pedidos-publicos\.js"/);
  assert.match(home,/href="\/conta\.html"/);
  assert.match(feed,/LUMINA_PATH\+'\/publicRequests'/);
  assert.doesNotMatch(feed,/LUMINA_PATH\+'\/requests\/'/);
  assert.match(app,/encodeURIComponent\(s\.name\)/);
});
test('botões de conta mantêm ícones após mudança de estados',()=>{
  const js=read('conta.js');
  assert.match(js,/function setButtonText\(button,label\)/);
  assert.match(account,/class="button-label"/);
  assert.match(js,/setButtonText\(elements\.authSubmit/);
  assert.match(js,/setButtonText\(elements\.requestSubmit/);
});
