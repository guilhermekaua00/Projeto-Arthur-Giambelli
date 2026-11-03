
/* ===== CONFIGURAÇÃO: edite aqui ===== */
const CONFIG={
  bandName:'Nome da Banda',
  whatsapp:'5519999999999',      // DDI + DDD + número, só dígitos
  youtubeKey:'',                 // chave da YouTube Data API v3 (restrinja ao domínio do site no Google Cloud)
  youtubeChannelId:'',           // ID do canal, começa com UC
  adminPassword:'trocar-senha',  // senha do painel #admin (proteção simples, fica no navegador)
  links:[                        // adicione Spotify, Facebook, TikTok etc.
    {nome:'YouTube',url:'https://www.youtube.com/',desc:'Gravações e vídeos'},
    {nome:'Instagram',url:'https://www.instagram.com/',desc:'Novidades e bastidores'}
  ]
};

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=u=>/^https?:\/\//i.test(u)?u:'#';
const dec=s=>new DOMParser().parseFromString(s,'text/html').documentElement.textContent;
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const zap=t=>`https://wa.me/${CONFIG.whatsapp}${t?'?text='+encodeURIComponent(t):''}`;
const MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

/* Identidade e links */
document.querySelectorAll('[data-band]').forEach(e=>e.textContent=CONFIG.bandName);
document.title=CONFIG.bandName;
$('#y').textContent=new Date().getFullYear();
$('#wa').href=$('#fab').href=zap('Olá! Vim pelo site e gostaria de falar com a banda.');
const insta=CONFIG.links.find(l=>/instagram/i.test(l.url));
$('#ig').href=insta?safe(insta.url):'#';
$('#links').innerHTML=CONFIG.links.map(l=>`<li><a href="${esc(safe(l.url))}" target="_blank" rel="noopener"><b>${esc(l.nome)}</b><span>${esc(l.desc)}</span></a></li>`).join('');

/* Fale conosco: monta a mensagem e abre o WhatsApp */
$('#cf').onsubmit=ev=>{ev.preventDefault();const f=ev.target;
  open(zap(`Olá! Sou ${f.n.value.trim()}.\nAssunto: ${f.a.value}\n\n${f.m.value.trim()}`),'_blank','noopener');};

/* ===== AGENDA =====
   Hoje salva no navegador (localStorage). Para valer para todos os visitantes,
   troque getEvents/setEvents por chamadas a um back-end (Firebase, Supabase, planilha etc.). */
const EXEMPLOS=[
  {id:1,t:'Exemplo: show na praça',d:'2026-11-21',h:'19:00',l:'Local a definir',u:''},
  {id:2,t:'Exemplo: roda cultural',d:'2026-12-05',h:'16:00',l:'Local a definir',u:''}];
const getEvents=()=>store.get('eventos',EXEMPLOS);
const setEvents=v=>store.set('eventos',v);
const sorted=()=>getEvents().slice().sort((a,b)=>(a.d+(a.h||'')).localeCompare(b.d+(b.h||'')));

function renderEvents(){
  const hoje=new Date().toLocaleDateString('sv-SE'),l=sorted().filter(e=>e.d>=hoje);
  $('#events').innerHTML=l.length?l.map(e=>{const[,m,d]=e.d.split('-');
    return `<li><time datetime="${esc(e.d)}"><b>${+d}</b>${MES[m-1]}</time><div><h3>${esc(e.t)}</h3><p>${[e.h,e.l].filter(Boolean).map(esc).join('<br>')}</p>${e.u?`<a href="${esc(safe(e.u))}" target="_blank" rel="noopener">Mais informações</a>`:''}</div></li>`}).join('')
    :'<li class="empty">Ainda não há datas marcadas. Acompanhe as novidades no Instagram.</li>';
}
function renderAdmin(){
  $('#alist').innerHTML=sorted().map(e=>`<li><span>${esc(e.d.split('-').reverse().join('/'))} · ${esc(e.t)}</span><button data-e="${e.id}">Editar</button><button data-x="${e.id}">Excluir</button></li>`).join('')||'<li>Nenhum evento cadastrado.</li>';
}
const refresh=()=>{renderEvents();renderAdmin()};

$('#ef').onsubmit=ev=>{ev.preventDefault();const f=ev.target,all=getEvents();
  const e={id:+f.k.value||Date.now(),t:f.t.value.trim(),d:f.d.value,h:f.h.value,l:f.l.value.trim(),u:f.u.value.trim()};
  setEvents(f.k.value?all.map(x=>x.id==e.id?e:x):[...all,e]);
  f.reset();f.k.value='';$('#cancel').hidden=true;refresh();};
$('#cancel').onclick=()=>{const f=$('#ef');f.reset();f.k.value='';$('#cancel').hidden=true};
$('#alist').onclick=ev=>{const b=ev.target.closest('button');if(!b)return;const all=getEvents();
  if(b.dataset.x&&confirm('Excluir este evento?')){setEvents(all.filter(e=>e.id!=b.dataset.x));refresh();}
  if(b.dataset.e){const e=all.find(x=>x.id==b.dataset.e),f=$('#ef');
    f.k.value=e.id;f.t.value=e.t;f.d.value=e.d;f.h.value=e.h||'';f.l.value=e.l||'';f.u.value=e.u||'';
    $('#cancel').hidden=false;f.scrollIntoView({behavior:'smooth'});}};

/* Painel: abre em #admin, pede senha */
let ok=false;
$('#login').onsubmit=ev=>{ev.preventDefault();if($('#pw').value===CONFIG.adminPassword){ok=true;route()}else alert('Senha incorreta.')};
function route(){const a=location.hash==='#admin';
  document.body.classList.toggle('is-admin',a);
  $('#login').hidden=ok;$('#panel').hidden=!ok;
  if(a)scrollTo(0,0);}
addEventListener('hashchange',route);

/* ===== YOUTUBE: alimenta Mídias e Notícias ===== */
async function videos(){
  const k=CONFIG.youtubeKey,c=CONFIG.youtubeChannelId;
  if(!k||!c)return[];
  const cache=store.get('yt',null);
  if(cache&&Date.now()-cache.t<36e5)return cache.v;   // guarda por 1 hora para poupar cota
  try{
    // playlist de uploads do canal = ID do canal com "UC" trocado por "UU" (custa 1 unidade de cota)
    const r=await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=7&playlistId=UU${c.slice(2)}&key=${k}`);
    if(!r.ok)throw new Error(r.status);
    const v=(await r.json()).items.map(i=>({id:i.snippet.resourceId.videoId,t:dec(i.snippet.title),d:i.snippet.publishedAt,
      img:((i.snippet.thumbnails||{}).medium||{}).url})).filter(x=>x.img);
    store.set('yt',{t:Date.now(),v});return v;
  }catch(e){console.warn('YouTube API:',e);return cache?cache.v:[]}
}
videos().then(v=>{
  const yt=CONFIG.links.find(l=>/youtube/i.test(l.url));
  $('#player').innerHTML=v.length
    ?`<iframe src="https://www.youtube-nocookie.com/embed/${esc(v[0].id)}" title="${esc(v[0].t)}" loading="lazy" allowfullscreen></iframe>`
    :`<a class="ph" href="${esc(safe(yt&&yt.url))}" target="_blank" rel="noopener"><b>▶</b>Assista às nossas gravações no YouTube</a>`;
  $('#news').innerHTML=v.length>1
    ?v.slice(1).map(x=>`<a href="https://www.youtube.com/watch?v=${esc(x.id)}" target="_blank" rel="noopener"><img src="${esc(x.img)}" alt="" loading="lazy"><time datetime="${esc(x.d)}">${new Date(x.d).toLocaleDateString('pt-BR')}</time><h3>${esc(x.t)}</h3></a>`).join('')
    :'<p class="empty">Os vídeos mais recentes do grupo aparecem aqui. Enquanto isso, acompanhe no Instagram e no YouTube.</p>';
});

refresh();route();
