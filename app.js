
(() => {
  'use strict';
  const services = [
    {name:'Limpeza doméstica',group:'casa',icon:'clean',detail:'Casas, apartamentos e alojamentos'},
    {name:'Limpeza pós-obra',group:'casa',icon:'post-clean',detail:'Espaços renovados, bem cuidados'},
    {name:'Canalização',group:'reparacoes',icon:'plumbing',detail:'Manutenção e reparações'},
    {name:'Eletricidade',group:'reparacoes',icon:'electric',detail:'Instalações e assistência'},
    {name:'Pintura',group:'reparacoes',icon:'paint',detail:'Interiores e fachadas'},
    {name:'Jardinagem',group:'exterior',icon:'garden',detail:'Jardins e espaços exteriores'},
    {name:'Piscinas',group:'exterior',icon:'pool',detail:'Manutenção e conservação'},
    {name:'Montagem de móveis',group:'casa',icon:'furniture',detail:'Montagem e pequenos trabalhos'},
    {name:'Climatização',group:'reparacoes',icon:'climate',detail:'Conforto em todas as estações'},
    {name:'Beleza e bem-estar',group:'bemestar',icon:'wellness',detail:'Cuidados pessoais'},
    {name:'Obras e remodelações',group:'reparacoes',icon:'renovation',detail:'Transformar ambientes'},
    {name:'Eventos',group:'eventos',icon:'events',detail:'Momentos especiais'}
  ];
  function makeIcon(name){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','l-icon');
    svg.setAttribute('aria-hidden','true');
    svg.setAttribute('focusable','false');
    const use=document.createElementNS('http://www.w3.org/2000/svg','use');
    use.setAttribute('href','/assets/lumina-icons.svg#'+name);
    svg.append(use);
    return svg;
  }
  const cards = document.getElementById('service-list');
  const query = document.getElementById('service-query');
  const heroSearch = document.getElementById('hero-search');
  const searchButton = document.getElementById('hero-search-button');
  const counter = document.getElementById('result-count');
  const modal = document.getElementById('information-modal');
  const closeBtn = document.getElementById('modal-close');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  let lastFocus = null, group = 'todos';
  const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function render() {
    if (!cards) return;
    const phrase = normalize(query?.value || '').trim();
    const found = services.filter(item =>
      (group === 'todos' || item.group === group) &&
      (normalize(item.name).includes(phrase) || normalize(item.detail).includes(phrase))
    );
    cards.replaceChildren();
    for (const s of found) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'service-tile';
      button.setAttribute('aria-label',s.name+' — preparar pedido de orçamento pessoal');
      const icon = document.createElement('span');
      icon.className = 'service-icon'; icon.append(makeIcon(s.icon));
      const arrow = document.createElement('span');
      arrow.className = 'tile-arrow'; arrow.setAttribute('aria-hidden','true'); arrow.append(makeIcon('arrow-up-right'));
      const title = document.createElement('strong'); title.textContent = s.name;
      const caption = document.createElement('small'); caption.textContent = s.detail;
      button.append(icon,arrow,title,caption);
      button.addEventListener('click',()=>{window.location.assign('/conta.html?categoria='+encodeURIComponent(s.name));});
      cards.append(button);
    }
    if (!found.length) {
      const message=document.createElement('div');message.className='no-results';
      message.textContent='Não encontrámos essa categoria. Experimenta outra pesquisa ou altera o filtro.';
      cards.append(message);
    }
    if (counter) counter.textContent=found.length+' '+(found.length===1?'categoria':'categorias');
  }
  function setFilter(value){
    group=value;
    document.querySelectorAll('[data-group]').forEach(button=>{
      const active=button.dataset.group===value;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',active?'true':'false');
    });
    render();
  }
  document.querySelectorAll('[data-group]').forEach(el=>el.addEventListener('click',()=>setFilter(el.dataset.group)));
  query?.addEventListener('input',render);
  function searchFromHero(){
    if (query && heroSearch) query.value=heroSearch.value;
    setFilter('todos');
    document.getElementById('explorar')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    setTimeout(()=>query?.focus({preventScroll:true}),500);
  }
  searchButton?.addEventListener('click',searchFromHero);
  heroSearch?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();searchFromHero();}});
  document.querySelectorAll('[data-category-jump]').forEach(link=>link.addEventListener('click',()=>{
    if(query)query.value='';
    setFilter(link.dataset.categoryJump || 'todos');
    if(link.tagName==='BUTTON') document.getElementById('explorar')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }));
  function showModal(title,body){
    lastFocus=document.activeElement;
    modalTitle.textContent=title||'Estamos a preparar algo especial.';
    modalBody.textContent=body||'As contas e os pedidos privados já estão disponíveis. Reservas confirmadas, propostas de profissionais e pagamentos continuam em desenvolvimento.';
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');
    document.body.classList.add('menu-open');closeBtn?.focus();
  }
  function hideModal(){
    modal?.classList.remove('open');modal?.setAttribute('aria-hidden','true');document.body.classList.remove('menu-open');lastFocus?.focus?.();
  }
  closeBtn?.addEventListener('click',hideModal);
  document.getElementById('modal-understood')?.addEventListener('click',hideModal);
  modal?.addEventListener('click',event=>{if(event.target===modal)hideModal()});
  document.querySelectorAll('[data-demo]').forEach(button=>button.addEventListener('click',()=>showModal(button.dataset.title,button.dataset.message)));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hideModal()});
  const bookingData={
    reservar:{label:'RESERVA DIRETA',heading:'Um serviço. Sem complicações.',description:'Escolhe o serviço, indica a localização e seleciona a disponibilidade quando houver profissionais ativos na plataforma.',fieldOne:'Modalidade',valueOne:'Reserva de serviço',fieldTwo:'Próximo passo',valueTwo:'Selecionar profissional',action:'Pré-visualizar reserva'},
    orcamento:{label:'PEDIDO DE ORÇAMENTO',heading:'O teu projeto, à tua maneira.',description:'Descreve o que precisas e recebe propostas de profissionais, com espaço para comparar antes de decidir.',fieldOne:'Modalidade',valueOne:'Pedido de proposta',fieldTwo:'Próximo passo',valueTwo:'Descrever o projeto',action:'Pré-visualizar pedido'}
  };
  function bookingTab(value){
    const d=bookingData[value];if(!d)return;
    document.querySelectorAll('[data-booking-tab]').forEach(button=>{const active=button.dataset.bookingTab===value;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
    document.getElementById('booking-mode-label').textContent=d.label;
    document.getElementById('booking-mode-title').textContent=d.heading;
    document.getElementById('booking-mode-description').textContent=d.description;
    document.getElementById('booking-one-label').textContent=d.fieldOne;
    document.getElementById('booking-one-value').textContent=d.valueOne;
    document.getElementById('booking-two-label').textContent=d.fieldTwo;
    document.getElementById('booking-two-value').textContent=d.valueTwo;
    const action=document.getElementById('booking-action');
    const actionText=action.querySelector('.button-label');if(actionText)actionText.textContent=d.action;else action.textContent=d.action;
    action.dataset.title=value==='orcamento'?'Demonstração de pedido de orçamento':'Demonstração de reserva';
    action.dataset.message=value==='orcamento'?'Os pedidos de orçamento são apenas uma pré-visualização nesta versão. Ainda não é possível enviar propostas reais.':'Esta interface é demonstrativa. Reservas reais exigem profissionais registados, agenda e base de dados segura.';
  }
  document.querySelectorAll('[data-booking-tab]').forEach(b=>b.addEventListener('click',()=>bookingTab(b.dataset.bookingTab)));
  const menuButton=document.getElementById('mobile-menu-toggle'),mobileMenu=document.getElementById('mobile-menu');
  function closeMenu(){if(!mobileMenu)return;mobileMenu.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');menuButton?.setAttribute('aria-label','Abrir menu');const icon=menuButton?.querySelector('use');if(icon)icon.setAttribute('href','/assets/lumina-icons.svg#menu');document.body.classList.remove('menu-open');}
  menuButton?.addEventListener('click',()=>{const opened=!mobileMenu.classList.contains('open');mobileMenu.classList.toggle('open',opened);menuButton.setAttribute('aria-expanded',String(opened));menuButton.setAttribute('aria-label',opened?'Fechar menu':'Abrir menu');const icon=menuButton.querySelector('use');if(icon)icon.setAttribute('href','/assets/lumina-icons.svg#'+(opened?'close':'menu'));document.body.classList.toggle('menu-open',opened)});
  mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  window.addEventListener('resize',()=>{if(innerWidth>900)closeMenu()});
  document.querySelectorAll('.reveal').forEach(el=>{if('IntersectionObserver' in window){const io=new IntersectionObserver((entries,observer)=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}})},{threshold:.07});io.observe(el)}else el.classList.add('visible')});
  const year=document.getElementById('copyright-year');if(year)year.textContent=new Date().getFullYear();
  render();
  bookingTab('reservar');
})();
