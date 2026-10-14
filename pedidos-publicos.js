import {database, LUMINA_PATH} from './firebase-client.js';
import {ref, onValue, query, orderByChild} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';

// Mostra só resumos PUBLICADOS voluntariamente. Nunca lê requests/{uid} ou profiles/{uid}.
const feed=document.getElementById('public-requests-feed');
const search=document.getElementById('public-requests-search');
const counter=document.getElementById('public-requests-count');
let published=[];
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-PT');
const formatDate=value=>{
  const time=Number(value);
  if(!Number.isFinite(time)||time<=0)return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-PT',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(time));
};
function showState(message){
  const node=document.createElement('div');
  node.className='public-feed-state';
  node.textContent=message;
  feed.replaceChildren(node);
}
function display(){
  const q=normalize(search.value).trim();
  const matching=published.filter(item=>[item.title,item.category,item.city].some(value=>normalize(value).includes(q)));
  counter.textContent=matching.length+' '+(matching.length===1?'pedido publicado':'pedidos publicados');
  if(!matching.length){
    showState(published.length
      ?'Ainda não há pedidos correspondentes à tua pesquisa. Experimenta outras palavras.'
      :'Ainda não existem pedidos publicados. Se já criaste um pedido, abre o teu histórico e escolhe «Publicar resumo».');
    return;
  }
  const fragment=document.createDocumentFragment();
  for(const item of matching){
    const article=document.createElement('article');
    article.className='public-request-card';
    const head=document.createElement('div');head.className='public-card-meta';
    const badge=document.createElement('span');badge.className='public-card-badge';badge.textContent='✦  PEDIDO PUBLICADO';
    const date=document.createElement('span');date.textContent=formatDate(item.publishedAt);
    head.append(badge,date);
    const category=document.createElement('span');category.className='public-card-category';category.textContent=item.category;
    const title=document.createElement('h3');title.textContent=item.title;
    const line=document.createElement('div');line.className='public-card-locality';
    line.textContent='⌖  '+item.city;
    const foot=document.createElement('p');foot.className='public-card-footnote';foot.textContent='Resumo público · Sem contactos nem descrição privada';
    article.append(head,category,title,line,foot);
    fragment.append(article);
  }
  feed.replaceChildren(fragment);
}
search?.addEventListener('input',display);
if(feed && search && counter){
  onValue(query(ref(database,LUMINA_PATH+'/publicRequests'),orderByChild('publishedAt')),snapshot=>{
    published=snapshot.exists()?Object.values(snapshot.val()).filter(item=>{
      return item&&typeof item==='object'&&
        typeof item.title==='string'&&typeof item.category==='string'&&typeof item.city==='string'&&
        typeof item.publishedAt==='number';
    }).sort((a,b)=>b.publishedAt-a.publishedAt):[];
    display();
  },()=>{
    published=[];
    counter.textContent='Publicação pendente';
    showState('A secção de pedidos aguarda as novas regras de leitura pública do Firebase. Os pedidos privados continuam protegidos.');
  });
}
