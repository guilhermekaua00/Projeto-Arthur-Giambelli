/* ===== CONFIGURAÇÃO: edite aqui ===== */
const CONFIG = {
  name: 'Corporação Musical Arthur Giambelli',
  short: 'Arthur Giambelli',
  whatsapp: '5519981499302',      // DDI + DDD + número, só dígitos
  youtubeKey: 'AIzaSyAgzzS8QuGuQamk7-dVnsHrTqtRi4jYS8g',                 // chave da YouTube Data API v3 (restrinja por referenciador ao domínio do site no Google Cloud)
  youtubeHandle: 'arthurgiambelli', // @ do canal (sem o @); com a chave, o site descobre sozinho a lista de vídeos
  youtubeChannelId: 'UC6_pEHE95km4mXapHR46B5Q', // opcional: ID do canal (UC...). Se preenchido, o player funciona mesmo sem chave
  adminSalt: '48f1d7866f657f66',       // sal do hash da senha do painel
  adminHash: '1f5cba60da404fe606dfa9cda0164bf240ee5c368be70da33c6f989fd1f1c3e4', // PBKDF2-SHA256 (200 mil iterações) da senha do painel; para trocar, ver README
  links: [                        // o primeiro deve ser o YouTube; adicione outras mídias do grupo
    { nome: 'YouTube', url: 'https://www.youtube.com/@arthurgiambelli', desc: 'Concertos, gravações e o documentário Alma Sonora de Limeira' },
    { nome: 'Instagram', url: 'https://www.instagram.com/arthurgiambelli/', desc: 'Novidades e bastidores' }
  ]
};

const $ = s => document.querySelector(s);
const on = (s, f) => { const e = $(s); if (e) f(e) };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safe = u => /^https?:\/\//i.test(u) ? u : '#';
const dec = s => new DOMParser().parseFromString(s, 'text/html').documentElement.textContent;
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { } } };
const MSG = 'Olá! Vim pelo site e gostaria de falar com a banda.';
const zap = t => `https://wa.me/${CONFIG.whatsapp}${t ? '?text=' + encodeURIComponent(t) : ''}`;
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const PAGES = [['index.html', 'Início'], ['historia.html', 'História'], ['midias.html', 'Mídias'], ['agenda.html', 'Agenda'], ['noticias.html', 'Notícias'], ['contato.html', 'Contato']];
const pg = document.body.dataset.page;

/* Cabeçalho, rodapé e links (iguais em todas as páginas) */
$('#hd').innerHTML = `<div class="wrap"><a class="brand" href="index.html"><img src="img/logo.png" alt="" width="44" height="44"><span>${esc(CONFIG.short)}</span></a><button class="menu" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav">☰</button><nav id="nav" aria-label="Principal">${PAGES.map(([h, t]) => `<a href="${h}"${h.startsWith(pg) ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav></div>`;
$('#ft').innerHTML = `<div class="wrap"><span>© ${new Date().getFullYear()} ${esc(CONFIG.name)}. Limeira, SP.</span></div>`;
/* Menu recolhível em telas pequenas */
const hd = $('#hd'), mb = $('#hd .menu');
const setMenu = o => { hd.classList.toggle('open', o); mb.setAttribute('aria-expanded', o); mb.setAttribute('aria-label', o ? 'Fechar menu' : 'Abrir menu'); mb.textContent = o ? '✕' : '☰' };
mb.onclick = () => setMenu(!hd.classList.contains('open'));
$('#nav').onclick = e => { if (e.target.closest('a')) setMenu(false) };
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false) });

/* Mensagens de validação em português (em vez das do idioma do navegador) */
document.querySelectorAll('input,select,textarea').forEach(el => {
  el.addEventListener('invalid', () => el.setCustomValidity(el.validity.valueMissing ? 'Preencha este campo.' : el.validity.typeMismatch ? 'Digite um endereço válido, por exemplo https://exemplo.com.' : ''));
  el.addEventListener('input', () => el.setCustomValidity(''))
});

document.querySelectorAll('.wa').forEach(a => a.href = zap(MSG));
document.querySelectorAll('.yt').forEach(a => a.href = safe(CONFIG.links[0].url));
const insta = CONFIG.links.find(l => /instagram/i.test(l.url));
on('#ig', e => e.href = insta ? safe(insta.url) : '#');
on('#links', e => e.innerHTML = CONFIG.links.map(l => `<li><a href="${esc(safe(l.url))}" target="_blank" rel="noopener"><b>${esc(l.nome)}</b><span>${esc(l.desc)}</span></a></li>`).join(''));


/* ===== AGENDA =====
   Hoje salva no navegador (localStorage). Para valer para todos os visitantes,
   troque getEvents/setEvents por chamadas a um back-end (Firebase, Supabase, planilha etc.). */
const EXEMPLOS = [
  { id: 1, t: 'Exemplo: concerto no Teatro Vitória', d: '2026-11-21', h: '20:00', l: 'Teatro Vitória, Limeira', u: '' },
  { id: 2, t: 'Exemplo: apresentação no coreto', d: '2026-12-05', h: '16:00', l: 'Local a definir', u: '' }];
const getEvents = () => store.get('eventos', EXEMPLOS);
const setEvents = v => store.set('eventos', v);
const sorted = () => getEvents().slice().sort((a, b) => (a.d + (a.h || '')).localeCompare(b.d + (b.h || '')));

function renderEvents() {
  const el = $('#events'); if (!el) return;
  const hoje = new Date().toLocaleDateString('sv-SE'), l = sorted().filter(e => e.d >= hoje).slice(0, +el.dataset.limit || 99);
  el.innerHTML = l.length ? l.map(e => {
    const [, m, d] = e.d.split('-');
    return `<li><time datetime="${esc(e.d)}"><b>${+d}</b>${MES[m - 1]}</time><div><h3>${esc(e.t)}</h3><p>${[e.h, e.l].filter(Boolean).map(esc).join('<br>')}</p>${e.u ? `<a href="${esc(safe(e.u))}" target="_blank" rel="noopener">Mais informações</a>` : ''}</div></li>`
  }).join('')
    : '<li class="empty">Ainda não há datas marcadas. Acompanhe as novidades no Instagram e no YouTube.</li>';
}
const hojeISO = () => new Date().toLocaleDateString('sv-SE');
function renderAdmin() {
  const el = $('#alist'); if (!el) return;
  el.innerHTML = sorted().map(e => `<li><span>${esc(e.d.split('-').reverse().join('/'))} · ${esc(e.t)}${e.d < hojeISO() ? ' <em class="past">data passada: não aparece na Agenda</em>' : ''}</span><button data-e="${e.id}">Editar</button><button data-x="${e.id}">Excluir</button></li>`).join('') || '<li>Nenhum evento cadastrado.</li>';
}
const refresh = () => { renderEvents(); renderAdmin() };

/* Painel de administração: arquivo CONFIG.adminPage, sem link no site */
on('#ef', f => {
  const flash = (txt, tipo) => { const m = $('#msg'); m.textContent = txt; m.className = 'msg' + (tipo ? ' ' + tipo : ''); m.hidden = false };
  f.onsubmit = ev => {
    ev.preventDefault(); const all = getEvents(), edit = !!f.k.value;
    const e = { id: +f.k.value || Date.now(), t: f.t.value.trim(), d: f.d.value, h: f.h.value, l: f.l.value.trim(), u: f.u.value.trim() };
    setEvents(edit ? all.map(x => x.id == e.id ? e : x) : [...all, e]);
    f.reset(); f.k.value = ''; $('#cancel').hidden = true; refresh();
    const passado = e.d < hojeISO();
    flash(`Evento “${e.t}” ${edit ? 'atualizado' : 'salvo'}.` + (passado ? ' Atenção: a data já passou, então ele não aparece na Agenda do site.' : ''), passado ? 'warn' : '');
    const b = $(`#alist [data-e="${e.id}"]`); if (b) { const li = b.closest('li'); li.classList.add('novo'); li.scrollIntoView({ block: 'nearest' }) }
  };
  $('#cancel').onclick = () => { f.reset(); f.k.value = ''; $('#cancel').hidden = true; $('#msg').hidden = true };
  $('#alist').onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return; const all = getEvents();
    if (b.dataset.x && confirm('Excluir este evento?')) { setEvents(all.filter(e => e.id != b.dataset.x)); refresh(); flash('Evento excluído.') }
    if (b.dataset.e) {
      const e = all.find(x => x.id == b.dataset.e);
      f.k.value = e.id; f.t.value = e.t; f.d.value = e.d; f.h.value = e.h || ''; f.l.value = e.l || ''; f.u.value = e.u || '';
      $('#cancel').hidden = false; f.scrollIntoView({ behavior: 'smooth' })
    }
  };
  const ss = { get() { try { return sessionStorage.getItem('adm') } catch { } }, set() { try { sessionStorage.setItem('adm', '1') } catch { } }, clear() { try { sessionStorage.removeItem('adm') } catch { } } };
  const show = () => { const ok = ss.get() === '1'; $('#login').hidden = ok; $('#panel').hidden = !ok };
  const enc = new TextEncoder();
  const hashSenha = async t => {
    const k = await crypto.subtle.importKey('raw', enc.encode(t), 'PBKDF2', false, ['deriveBits']);
    const b = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(CONFIG.adminSalt), iterations: 200000 }, k, 256);
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')
  };
  $('#login').onsubmit = async ev => {
    ev.preventDefault();
    const err = $('#lerr'), pw = $('#pw'), bt = $('#login button'); err.hidden = true; pw.removeAttribute('aria-invalid');
    if (!crypto.subtle) { err.textContent = 'Abra o painel por https:// ou localhost.'; err.hidden = false; return }
    bt.disabled = true; const ok = await hashSenha(pw.value) === CONFIG.adminHash; bt.disabled = false;
    if (ok) { pw.value = ''; ss.set(); show(); f.t.focus() }
    else { err.textContent = 'Senha incorreta. Confira e tente de novo.'; err.hidden = false; pw.setAttribute('aria-invalid', 'true'); pw.value = ''; pw.focus() }
  };
  $('#logout').onclick = () => { ss.clear(); $('#msg').hidden = true; show(); $('#pw').focus() };
  show();
});

/* ===== YOUTUBE: alimenta o player e as Notícias =====
   Com chave + @ do canal: lista os vídeos (player do mais recente e grade em Notícias).
   Só com o ID do canal: o player toca a lista de envios, sem chave.
   Sem nada disso: mostra um link para o canal. */
const YT_API = 'https://www.googleapis.com/youtube/v3/';
async function uploadsId() {
  if (CONFIG.youtubeChannelId) return 'UU' + CONFIG.youtubeChannelId.slice(2);   // UC... -> UU... = playlist de envios
  const k = CONFIG.youtubeKey, h = CONFIG.youtubeHandle;
  if (!k || !h) return '';
  const c = store.get('ytu', null);
  if (c && c.h === h) return c.id;
  const r = await fetch(`${YT_API}channels?part=contentDetails&forHandle=${encodeURIComponent(h)}&key=${k}`);
  if (!r.ok) throw new Error(r.status);
  const it = ((await r.json()).items || [])[0];
  const id = it && it.contentDetails.relatedPlaylists.uploads || '';
  if (id) store.set('ytu', { h, id });
  return id;
}
async function videos() {
  let list = '', v = [];
  try { list = await uploadsId() } catch (e) { console.warn('YouTube API:', e) }
  if (!list || !CONFIG.youtubeKey) return { list, v };
  const cache = store.get('yt', null);
  if (cache && cache.l === list && Date.now() - cache.t < 36e5) return { list, v: cache.v };   // guarda por 1 hora para poupar cota
  try {
    const r = await fetch(`${YT_API}playlistItems?part=snippet&maxResults=12&playlistId=${list}&key=${CONFIG.youtubeKey}`);
    if (!r.ok) throw new Error(r.status);
    v = (await r.json()).items.map(i => ({
      id: i.snippet.resourceId.videoId, t: dec(i.snippet.title), d: i.snippet.publishedAt,
      img: ((i.snippet.thumbnails || {}).medium || {}).url
    })).filter(x => x.img);
    store.set('yt', { t: Date.now(), l: list, v });
  } catch (e) { console.warn('YouTube API:', e); v = cache && cache.l === list ? cache.v : [] }
  return { list, v };
}
const ytFrame = (src, t) => `<iframe src="https://www.youtube-nocookie.com/embed/${src}" title="${esc(t)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
if ($('#player') || $('#news')) videos().then(({ list, v }) => {
  on('#player', e => e.innerHTML = v.length ? ytFrame(esc(v[0].id), v[0].t)
    : list ? ytFrame('videoseries?list=' + esc(list), 'Vídeos da ' + CONFIG.name)
      : `<a class="ph" href="${esc(safe(CONFIG.links[0].url))}" target="_blank" rel="noopener"><b>▶</b>Assista aos nossos concertos no YouTube</a>`);
  on('#news', e => e.innerHTML = v.length > 1
    ? v.slice(1).map(x => `<a href="https://www.youtube.com/watch?v=${esc(x.id)}" target="_blank" rel="noopener"><img src="${esc(x.img)}" alt="" loading="lazy"><time datetime="${esc(x.d)}">${new Date(x.d).toLocaleDateString('pt-BR')}</time><h3>${esc(x.t)}</h3></a>`).join('')
    : '<p class="empty">Os vídeos mais recentes do canal aparecem aqui. Enquanto isso, acompanhe o grupo no YouTube e no Instagram.</p>');
});

refresh();