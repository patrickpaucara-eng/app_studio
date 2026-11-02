var D=window.__D;
var KEY='atenea-pwa', ST;
try{ST=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){ST=null}
ST=ST||{s:{},events:[],syncId:'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)};
function save(){try{localStorage.setItem(KEY,JSON.stringify(ST))}catch(e){}}
ST.newCards=ST.newCards||[];ST.dudas=ST.dudas||[];
var HAVE={};D.cards.forEach(function(c){HAVE[c.id]=1});ST.newCards=ST.newCards.filter(function(n){return !n.sent||!HAVE[n.id]});
ST.newCards.forEach(function(n){if(!HAVE[n.id])D.cards.push({id:n.id,k:n.k,x:'',t:'basica',f:n.f,r:n.r,p:'',s:null,n:n.ts})});
/* estado local solo si es más reciente que el que mandó la app */
for(var sid in ST.s){var cc=null;for(var q=0;q<D.cards.length;q++)if(D.cards[q].id===sid){cc=D.cards[q];break}if(cc&&cc.s&&cc.s.last_review&&ST.s[sid].last_review&&new Date(cc.s.last_review)>=new Date(ST.s[sid].last_review))delete ST.s[sid]}save();
var FP={request_retention:D.retencion,enable_fuzz:true,enable_short_term:true};if(D.w)FP.w=D.w;var F=FSRS.fsrs(FSRS.generatorParameters(FP));
var K=['stability','difficulty','elapsed_days','scheduled_days','reps','lapses','learning_steps','state'];
function st(c){return ST.s[c.id]||c.s}
function toC(f){var o={due:new Date(f.due)};K.forEach(function(k){o[k]=Number(f[k])||0});o.last_review=f.last_review?new Date(f.last_review):undefined;return o}
function fromC(c){var o={due:new Date(c.due).toISOString(),last_review:c.last_review?new Date(c.last_review).toISOString():null};K.forEach(function(k){o[k]=Number(c[k])||0});return o}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function md(t){try{return DOMPurify.sanitize(marked.parse(String(t||''),{breaks:true}))}catch(e){return esc(t).replace(/\n/g,'<br>')}}
function day(d){return (d||new Date()).toLocaleDateString('sv-SE')}
function delta(ms){var m=ms/6e4;if(m<1)return'<1 min';if(m<60)return Math.round(m)+' min';var h=m/60;if(h<24)return Math.round(h)+' h';var d=h/24;if(d<30)return Math.round(d)+' d';return (d/30).toFixed(1)+' mes'}
var CO={};D.courses.forEach(function(c){CO[c.id]=c});
function cname(c){var co=CO[c.k];if(!co)return'';var x=(co.conceptos||[]).filter(function(y){return y.id===c.x})[0];return x?x.nombre:''}
function due(k){var now=Date.now();return D.cards.filter(function(c){var s=st(c);return s&&new Date(s.due).getTime()<=now&&(!k||c.k===k)})}
function newsToday(){var t=day();return ST.events.filter(function(e){return e.nw&&day(new Date(e.ts))===t}).length}
function fresh(k){return D.cards.filter(function(c){return !st(c)&&(!k||c.k===k)}).sort(function(a,b){return a.n-b.n})}
var S=null, app=document.getElementById('app');
function home(){
  var dl=due(),nl=fresh().slice(0,Math.max(0,D.nuevasDia-newsToday()));
  var nAns=ST.events.filter(function(e){return e.ans}).length, pend=ST.events.length+ST.newCards.length+ST.dudas.length;
  app.innerHTML='<div class="r sp"><h1>Atenea sin conexión</h1><span class="chip">'+D.cards.length+' tarjetas</span></div>'+
  '<p class="m s">Copia del '+new Date(D.exportedAt).toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric'})+'. Funciona sin internet.</p>'+
  '<section class="c"><h2>'+(dl.length+nl.length?'Hoy: '+dl.length+' repasos y '+nl.length+' nuevas':'Estás al día')+'</h2>'+
  '<div class="r"><button class="p" onclick="go()" '+(dl.length+nl.length?'':'disabled')+'>Empezar sesión</button></div></section>'+
  '<section class="c"><h3>Por curso</h3>'+D.courses.map(function(co){var d=due(co.id).length,n=Math.min(fresh(co.id).length,Math.max(0,D.nuevasDia-newsToday()));return '<div class="r sp"><span><b>'+esc(co.nombre)+'</b><br><span class="s m">'+d+' repasos · '+n+' nuevas</span></span><span class="r"><button onclick="go(\''+co.id+'\')" '+(d+n?'':'disabled')+'>Estudiar</button><button onclick="browse(\''+co.id+'\')">Ver tarjetas</button>'+(aiOn()?'<button onclick="tutor(\''+co.id+'\')">Tutor</button>':'')+'</span></div>'}).join('')+'</section>'+
  '<section class="c"><h3>Mientras estás sin conexión</h3><p class="s m">Escribe tus respuestas en las tarjetas abiertas: al reconectar, la IA las corrige todas juntas. Lo que crees aquí se sube a la app al importar el progreso.</p><div class="r"><button onclick="addForm(1)">Nueva tarjeta</button><button onclick="addForm(2)">Anotar una duda para el tutor</button>'+(aiOn()?'<button onclick="addForm(3)">Crear tarjetas con IA desde un texto</button>':'')+'</div></section>'+
  (AI_ENABLED?'<section class="c"><div class="r sp"><span><b>IA con tu clave de API</b></span><button onclick="aiSettings()">Configurar</button></div></section>':'')+
  '<section class="c"><h3>Llevar tu progreso a la app</h3><p class="s m">'+(pend?'Pendiente de subir: '+[ST.events.length?ST.events.length+' repasos':'',nAns?nAns+' respuestas escritas para corregir':'',ST.newCards.length?ST.newCards.length+' tarjetas nuevas':'',ST.dudas.length?ST.dudas.length+' dudas':''].filter(Boolean).join(', ')+'. ':'Nada pendiente de subir. ')+'Con señal, pulsa “Enviar progreso”; en Atenea, “Traer progreso del celular”.</p><div class="r"><button class="p" onclick="sendProgress(this)" '+(pend?'':'disabled')+'>Enviar progreso</button><button onclick="refreshData(this)">Buscar tarjetas nuevas</button><button onclick="syncSettings()">'+(ghCfg().token?'Conexión':'Conectar GitHub')+'</button></div><p class="s m">Datos del '+new Date(D.exportedAt).toLocaleString('es-PE',{dateStyle:'medium',timeStyle:'short'})+(ST.lastSent?' · último envío '+new Date(ST.lastSent).toLocaleString('es-PE',{dateStyle:'medium',timeStyle:'short'}):'')+'.</p></section>';
}
function addForm(kind){
  app.innerHTML='<div class="r"><button onclick="home()">← Volver</button></div><section class="c"><h2>'+(kind===1?'Nueva tarjeta':kind===3?'Crear tarjetas con IA':'Anotar una duda')+'</h2>'+
  '<label class="s">Curso<select id="fk" style="width:100%;font:inherit;padding:10px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink)">'+D.courses.map(function(c){return '<option value="'+esc(c.id)+'">'+esc(c.nombre)+'</option>'}).join('')+'</select></label>'+
  (kind===3?'<label class="s">Pega el texto (apuntes, un párrafo del libro)<textarea id="fx" rows="8"></textarea></label><div class="r"><button class="p" onclick="aiCards()">Crear tarjetas</button></div><div id="aibox"></div></section>':kind===1?'<label class="s">Pregunta<textarea id="ff" rows="3"></textarea></label><label class="s">Respuesta<textarea id="fr" rows="4"></textarea></label>':'<label class="s">Tu duda<textarea id="fd" rows="4" placeholder="Ej.: no entiendo por qué el ciclo de Calvin necesita ATP"></textarea></label><p class="s m">En la app, el tutor te la propondrá como punto de partida.</p>')+
  (kind===3?'':'<div class="r"><button class="p" onclick="saveForm('+kind+')">Guardar</button></div></section>');
}
function saveForm(kind){
  var k=document.getElementById('fk').value, ts=Date.now();
  if(kind===1){var f=document.getElementById('ff').value.trim(),r=document.getElementById('fr').value.trim();if(!f||!r)return;var id='o'+ts.toString(36)+Math.random().toString(36).slice(2,6);ST.newCards.push({id:id,k:k,f:f,r:r,ts:ts});D.cards.push({id:id,k:k,x:'',t:'basica',f:f,r:r,p:'',s:null,n:ts})}
  else{var d=document.getElementById('fd').value.trim();if(!d)return;ST.dudas.push({k:k,t:d,ts:ts})}
  save();home();
}
function go(k){
  var d=due(k).sort(function(){return Math.random()-.5}), n=fresh(k).slice(0,Math.max(0,D.nuevasDia-newsToday()));
  var q=d.map(function(c){return c.id}); var step=n.length?Math.max(1,Math.floor(q.length/n.length)):0, out=[], j=0;
  q.forEach(function(id,i){out.push(id);if(step&&(i+1)%step===0&&j<n.length)out.push(n[j++].id)}); while(j<n.length)out.push(n[j++].id);
  S={q:out,total:out.length,done:0,ok:0,cur:null,ph:'q',t0:Date.now()}; next();
}
function byId(id){for(var i=0;i<D.cards.length;i++)if(D.cards[i].id===id)return D.cards[i]}
function next(){ S.cur=S.q.shift(); S.ph='q'; S.ans=''; S.res=null; S.sug=0; S.shown=Date.now(); if(!S.cur){end();return} card(); window.scrollTo(0,0) }
function card(){
  var c=byId(S.cur), co=CO[c.k]||{}, open=c.t==='abierta'||c.t==='problema'||c.t==='codigo', s=st(c), grades='';
  if(S.ph==='a'){var now=new Date(),rp=F.repeat(s?toC(s):FSRS.createEmptyCard(now),now);grades='<div class="g">'+[[1,'Otra vez'],[2,'Difícil'],[3,'Bien'],[4,'Fácil']].map(function(g){return '<button onclick="rate('+g[0]+')"'+(S.sug===g[0]?' style="box-shadow:0 0 0 2px var(--accent) inset"':'')+'>'+g[1]+'<small>vuelve en '+delta(rp[g[0]].card.due-now)+'</small></button>'}).join('')+'</div>'}
  var fb=S.res?'<div class="note"><b>'+({correcto:'Correcto',parcial:'Parcial',incorrecto:'Incorrecto'}[S.res.veredicto]||'Evaluado')+'</b>'+(S.res.falto?'<br>Faltó: '+esc(S.res.falto):'')+(S.res.error_conceptual?'<br>Idea a corregir: '+esc(S.res.error_conceptual):'')+(S.sug?'<br><span class="s m">La IA sugiere la opción marcada; tú decides.</span>':'')+'</div>':'';
  app.innerHTML='<div class="r sp"><span class="s m">'+S.done+' de '+S.total+'</span><button onclick="end()">Terminar</button></div><div class="bar"><i style="width:'+Math.round(100*S.done/Math.max(1,S.total))+'%"></i></div>'+
  '<section class="c"><div class="r"><span class="chip">'+esc(co.nombre||'')+'</span>'+(cname(c)?'<span class="chip">'+esc(cname(c))+'</span>':'')+(s?'':'<span class="chip">nueva</span>')+'</div><div class="q">'+md(c.f)+'</div>'+
  (S.ph==='q'?(open?'<textarea id="ans" rows="5" placeholder="Escribe tu respuesta antes de mirar: el esfuerzo de recordar es lo que fija.">'+esc(S.ans)+'</textarea>':'')+(c.p?'<details><summary class="s">Pista</summary>'+md(c.p)+'</details>':'')+'<div class="r"><button class="p" onclick="show()">Mostrar respuesta</button>'+(open&&aiOn()?'<button onclick="aiGrade()">Corregir con IA</button>':'')+'</div><div id="aibox"></div>'
  :(S.ans?'<div class="a"><b class="s">Tu respuesta</b>'+md(S.ans)+'</div>':'')+'<div class="a">'+md(c.r)+'</div>'+fb+(open&&!S.res?'<p class="note">Compara tu respuesta con los puntos clave y califícate con honestidad.</p>':'')+grades+(aiOn()?'<div class="r"><button onclick="aiExplain()">Explícamelo</button></div><div id="aibox"></div>':''))+'</section>';
}
function show(){var a=document.getElementById('ans');S.ans=a?a.value.trim():'';S.ph='a';card()}
function rate(g){
  var c=byId(S.cur), s=st(c), now=new Date(), isNew=!s;
  var nc=F.next(s?toC(s):FSRS.createEmptyCard(now),now,g).card;
  ST.s[c.id]=fromC(nc); ST.events.push({c:c.id,g:g,ts:now.getTime(),ms:Date.now()-S.shown,nw:isNew?1:0,ans:S.ans||undefined,res:S.res||undefined}); save();
  if(nc.due-now<20*6e4)S.q.splice(Math.min(S.q.length,4),0,c.id),S.total++;
  S.done++; if(g>=3)S.ok++; next();
}
function end(){ setTimeout(autoSyncPhone,300); if(!S){home();return} var r=S.done; app.innerHTML='<section class="c"><h1>'+r+' tarjetas repasadas</h1><p class="m">'+(r?Math.round(100*S.ok/r)+'% recordadas. ':'')+'Tu progreso quedó guardado en este dispositivo.</p><div class="r"><button class="p" onclick="S=null;home()">Volver</button></div></section>'; }
function browse(k){
  var co=CO[k]; var cs=D.cards.filter(function(c){return c.k===k});
  app.innerHTML='<div class="r"><button onclick="home()">← Volver</button></div><section class="c"><h2>'+esc(co.nombre)+'</h2>'+((co.estrategia||[]).length?'<ul class="s">'+co.estrategia.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>':'')+
  '<details><summary>Mapa de conceptos ('+(co.conceptos||[]).length+')</summary><ol class="s">'+(co.conceptos||[]).map(function(x){return '<li><b>'+esc(x.nombre)+'</b> <span class="m">'+esc(x.resumen||'')+'</span></li>'}).join('')+'</ol></details>'+
  '<input id="qf" placeholder="Buscar tarjeta" oninput="flt(\''+k+'\')"></section><div id="cl" class="w" style="padding:0"></div>'; flt(k);
}
function flt(k){var v=(document.getElementById('qf').value||'').toLowerCase();document.getElementById('cl').innerHTML=D.cards.filter(function(c){return c.k===k&&(!v||(c.f+' '+c.r).toLowerCase().indexOf(v)>=0)}).slice(0,80).map(function(c){return '<section class="c"><div>'+md(c.f)+'</div><details><summary class="s">Respuesta</summary>'+md(c.r)+'</details></section>'}).join('')}
function exp(){
  var blob=new Blob([JSON.stringify(progressObj())],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='atenea-progreso-'+day()+'.json';document.body.appendChild(a);a.click();a.remove();
}
function progressObj(){return {source:'atenea-offline',exportId:D.exportId,syncId:ST.syncId,device:'celular',events:ST.events,newCards:ST.newCards.filter(function(n){return !n.sent}),dudas:ST.dudas}}
var GHK='atenea-gh';
function ghCfg(){try{return JSON.parse(localStorage.getItem(GHK)||'null')||{}}catch(e){return {}}}
function b64(s){var u=new TextEncoder().encode(s),b='';for(var i=0;i<u.length;i+=8192)b+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(b)}
async function sendProgress(btn){
  var g=ghCfg(),repo=(D.repo||'');
  if(!g.token){syncSettings('Primero pega tu token de GitHub.');return}
  if(navigator.onLine===false){alert('Sin internet. Tu progreso sigue guardado en este celular; envíalo cuando tengas señal.');return}
  if(btn){btn.disabled=true;btn.textContent='Enviando…'}
  try{
    var r=await fetch('https://api.github.com/repos/'+repo+'/contents/progreso/'+ST.syncId+'.json',{method:'PUT',headers:{'Authorization':'Bearer '+g.token,'Accept':'application/vnd.github+json'},body:JSON.stringify({message:'Progreso del celular '+day(),content:b64(JSON.stringify(progressObj()))})});
    if(r.status===401||r.status===403){throw new Error('El token no es válido o no tiene permiso de escritura en el repositorio.')}
    if(!r.ok&&r.status!==422)throw new Error('GitHub respondió '+r.status+'. Intenta de nuevo.');
    ST.events=[];ST.dudas=[];ST.newCards.forEach(function(n){n.sent=1});ST.syncId='s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);ST.lastSent=Date.now();save();
    alert('Progreso enviado. En Atenea (Claude), pulsa “Traer progreso del celular”.');
  }catch(e){alert(e.message||'No se pudo enviar. Revisa tu internet.')}
  home();
}
async function autoSyncPhone(){
  if(navigator.onLine===false||!D)return;
  var g=ghCfg();
  if(g.token&&D.repo&&(ST.events.length||ST.dudas.length||ST.newCards.some(function(n){return !n.sent}))){
    try{var r=await fetch('https://api.github.com/repos/'+D.repo+'/contents/progreso/'+ST.syncId+'.json',{method:'PUT',headers:{'Authorization':'Bearer '+g.token,'Accept':'application/vnd.github+json'},body:JSON.stringify({message:'Progreso del celular '+day(),content:b64(JSON.stringify(progressObj()))})});
      if(r.ok||r.status===422){ST.events=[];ST.dudas=[];ST.newCards.forEach(function(n){n.sent=1});ST.syncId='s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);ST.lastSent=Date.now();save()}}catch(e){}
  }
  try{var q=await fetch('data.json?t='+Date.now(),{cache:'no-store'});if(q.ok){var d=await q.json();if(d&&d.exportId&&d.exportId!==D.exportId){localStorage.setItem('atenea-data',JSON.stringify(d));if(!S)location.reload()}}}catch(e){}
}
window.addEventListener('online',function(){autoSyncPhone()});
setTimeout(autoSyncPhone,1500);
async function refreshData(btn){
  if(navigator.onLine===false){alert('Sin internet: sigues con las tarjetas que ya tienes.');return}
  if(btn){btn.disabled=true;btn.textContent='Buscando…'}
  try{var r=await fetch('data.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw 0;var d=await r.json();localStorage.setItem('atenea-data',JSON.stringify(d));location.reload()}
  catch(e){alert('No se pudo descargar la actualización.');home()}
}
function syncSettings(msg){
  var g=ghCfg();
  app.innerHTML='<div class="r"><button onclick="home()">← Volver</button></div><section class="c"><h2>Conexión con GitHub</h2>'+(msg?'<p class="note">'+esc(msg)+'</p>':'')+
  '<p class="s m">Pega aquí el token “fine-grained” que creaste (solo para este repositorio, permiso Contents: Read and write). Se guarda solo en este celular y se usa únicamente para enviar tu progreso.</p>'+
  '<label class="s">Token de GitHub<input id="ght" type="password" autocomplete="off" value="'+esc(g.token||'')+'" placeholder="github_pat_…"></label>'+
  '<p class="s m">Repositorio: '+esc(D.repo||'')+'</p><div class="r"><button class="p" onclick="saveGh()">Guardar</button>'+(g.token?'<button onclick="localStorage.removeItem(GHK);syncSettings()">Borrar token</button>':'')+'</div></section>';
}
function saveGh(){try{localStorage.setItem(GHK,JSON.stringify({token:document.getElementById('ght').value.trim()}))}catch(e){}home()}
/* ===== IA opcional con tu propia clave de API: solo se usa cuando la pides y hay internet ===== */
var NL=String.fromCharCode(10);
var AIK='atenea-api';
function aiCfg(){try{return JSON.parse(localStorage.getItem(AIK)||'null')||{}}catch(e){return {}}}
function aiSave(c){try{localStorage.setItem(AIK,JSON.stringify(c))}catch(e){}}
var AI_ENABLED=false;  /* desactivado a pedido: sin gasto de API */
function aiOn(){var c=aiCfg();return AI_ENABLED&&!!c.key}
function aiErr(code,msg){return {code:code,msg:msg}}
async function claudeApi(prompt,maxTok){
  var c=aiCfg();
  if(!c.key)throw aiErr('nokey','Configura tu clave de API en Ajustes de IA.');
  if(navigator.onLine===false)throw aiErr('offline','Sin internet. Tu respuesta queda guardada y se corrige cuando importes el progreso en la app.');
  var r;
  try{r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':c.key,'anthropic-version':'2023-06-01','content-type':'application/json','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:c.model||'claude-haiku-5-5',max_tokens:maxTok||800,messages:[{role:'user',content:prompt}]})})}
  catch(e){throw aiErr('net','No se pudo conectar con la API de Claude. Revisa tu internet.')}
  var j=null;try{j=await r.json()}catch(e){}
  if(!r.ok){var m={401:'La clave de API no es válida.',403:'Tu clave no tiene permiso para este modelo.',429:'Límite de uso de tu cuenta de API alcanzado; espera un momento.',529:'La API está saturada; intenta en unos minutos.'}[r.status]||('Error de la API ('+r.status+').');throw aiErr('api',m)}
  var u=(j&&j.usage)||{};ST.usage=ST.usage||{i:0,o:0,n:0};ST.usage.i+=u.input_tokens||0;ST.usage.o+=u.output_tokens||0;ST.usage.n++;save();
  return ((j&&j.content)||[]).filter(function(b){return b.type==='text'}).map(function(b){return b.text}).join('');
}
function parseJson(t){var a=t.indexOf('{'),b=t.indexOf('['),i=(a<0)?b:(b<0?a:Math.min(a,b));if(i<0)return null;var e=Math.max(t.lastIndexOf('}'),t.lastIndexOf(']'));try{return JSON.parse(t.slice(i,e+1))}catch(x){return null}}
function aiBox(html){var el=document.getElementById('aibox');if(el)el.innerHTML=html}
async function aiGrade(){
  var c=byId(S.cur),a=document.getElementById('ans');S.ans=a?a.value.trim():S.ans;
  if(!S.ans){aiBox('<p class="note">Escribe tu respuesta primero.</p>');return}
  aiBox('<p class="s m">Corrigiendo…</p>');
  try{
    var t=await claudeApi('Eres un tutor exigente pero amable. Evalúa la comprensión, no la redacción. '+(D.perfil||'')+NL+'PREGUNTA: '+c.f+NL+'PUNTOS CLAVE: '+c.r+NL+'RESPUESTA DEL ESTUDIANTE: '+S.ans+NL+'Devuelve SOLO JSON: {"veredicto":"correcto|parcial|incorrecto","calificacion":1,"falto":"1-2 frases o vacío","error_conceptual":"o vacío"} (calificacion 1 a 4).',400);
    var r=parseJson(t);if(!r)throw aiErr('json','La respuesta de la IA no se entendió; intenta de nuevo.');
    S.res={veredicto:String(r.veredicto||''),falto:String(r.falto||''),error_conceptual:String(r.error_conceptual||'')};S.sug=Math.max(1,Math.min(4,Number(r.calificacion)||0));S.ph='a';card();
  }catch(e){aiBox('<p class="note">'+esc(e.msg||'No se pudo corregir.')+'</p>')}
}
async function aiExplain(){
  var c=byId(S.cur);aiBox('<p class="s m">Explicando…</p>');
  try{var t=await claudeApi((D.perfil||'')+NL+'Explica en menos de 150 palabras por qué esta es la respuesta, con un ejemplo concreto, y termina con una pregunta corta para verificar que se entendió.'+NL+'Pregunta: '+c.f+NL+'Respuesta: '+c.r+(S.ans?NL+'Lo que respondió el estudiante: '+S.ans:''),500);aiBox('<div class="note">'+md(t)+'</div>')}
  catch(e){aiBox('<p class="note">'+esc(e.msg||'No se pudo explicar.')+'</p>')}
}
function aiSettings(){
  var c=aiCfg(),u=ST.usage||{i:0,o:0,n:0};
  app.innerHTML='<div class="r"><button onclick="home()">← Volver</button></div><section class="c"><h2>IA con tu clave de API</h2>'+
  '<p class="s m">Opcional. Todo funciona sin internet; la IA solo se usa cuando pulsas un botón de IA y hay conexión. Se cobra en tu cuenta de la API de Claude (console.anthropic.com), aparte de tu plan. Te recomendamos crear una clave solo para esto y ponerle un límite de gasto.</p>'+
  '<label class="s">Clave de API<input id="akey" type="password" autocomplete="off" placeholder="sk-ant-…" value="'+esc(c.key||'')+'"></label>'+
  '<label class="s">Modelo<select id="amodel" style="width:100%;font:inherit;padding:10px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink)"><option value="claude-haiku-5-5"'+(c.model!=='claude-sonnet-5-5'?' selected':'')+'>Haiku: rápido y económico (recomendado)</option><option value="claude-sonnet-5-5"'+(c.model==='claude-sonnet-5-5'?' selected':'')+'>Sonnet: mejor calidad, más caro</option></select></label>'+
  '<div class="r"><button class="p" onclick="aiStore()">Guardar</button><button onclick="aiTest()">Probar conexión</button>'+(c.key?'<button onclick="aiForget()">Borrar clave</button>':'')+'</div><div id="aibox"></div>'+
  '<p class="s m">La clave queda guardada solo en este dispositivo. Uso en este dispositivo: '+u.n+' llamadas, '+u.i+' tokens de entrada y '+u.o+' de salida.</p></section>';
}
function aiStore(){aiSave({key:document.getElementById('akey').value.trim(),model:document.getElementById('amodel').value});aiBox('<p class="note">Guardado.</p>')}
function aiForget(){aiSave({});aiSettings()}
async function aiTest(){aiStore();aiBox('<p class="s m">Probando…</p>');try{await claudeApi('Responde solo: ok',5);aiBox('<p class="note">Conexión correcta.</p>')}catch(e){aiBox('<p class="note">'+esc(e.msg||'Falló la prueba.')+'</p>')}}
var CHAT=[];
function tutor(k){
  S2k=k;var co=CO[k]||{};
  app.innerHTML='<div class="r"><button onclick="home()">← Volver</button></div><section class="c"><h2>Tutor · '+esc(co.nombre||'')+'</h2><p class="s m">Usa tu clave de API y necesita internet. Sin conexión, anota la duda con “Anotar una duda” y la verás en la app.</p><div id="chat" style="display:grid;gap:8px">'+CHAT.map(function(m){return '<div class="note" style="'+(m.role==='user'?'justify-self:end;background:var(--surface);border:1px solid var(--line)':'')+'">'+md(m.content)+'</div>'}).join('')+'</div>'+
  '<textarea id="tq" rows="3" placeholder="Pregunta sobre el curso"></textarea><div class="r"><button class="p" onclick="tutorAsk()">Enviar</button>'+(CHAT.length?'<button onclick="CHAT=[];tutor(S2k)">Nueva conversación</button>':'')+'</div><div id="aibox"></div></section>';
}
var S2k='';
async function tutorAsk(){
  var q=document.getElementById('tq').value.trim();if(!q)return;var co=CO[S2k]||{};
  var words=q.toLowerCase().split(' ').filter(function(w){return w.length>4});
  var ctx=D.cards.filter(function(c){return c.k===S2k}).map(function(c){var t=(c.f+' '+c.r).toLowerCase();return {c:c,s:words.filter(function(w){return t.indexOf(w.slice(0,6))>=0}).length}}).filter(function(x){return x.s>0}).sort(function(a,b){return b.s-a.s}).slice(0,8).map(function(x){return '- '+x.c.f+' → '+x.c.r}).join(NL);
  CHAT.push({role:'user',content:q});tutor(S2k);aiBox('<p class="s m">Pensando…</p>');
  try{
    var hist=CHAT.slice(-8).map(function(m){return (m.role==='user'?'ESTUDIANTE: ':'TUTOR: ')+m.content}).join(NL+NL);
    var t=await claudeApi('Eres un tutor socrático del curso "'+(co.nombre||'')+'". '+(D.perfil||'')+' Temas: '+(co.conceptos||[]).map(function(x){return x.nombre}).join('; ')+'.'+(ctx?NL+'Tarjetas del estudiante relacionadas:'+NL+ctx:'')+NL+'Responde breve (máximo 150 palabras), guía con una pregunta cuando ayude, y si algo no está en sus tarjetas dilo.'+NL+NL+hist,700);
    CHAT.push({role:'assistant',content:t});tutor(S2k);
  }catch(e){CHAT.pop();tutor(S2k);document.getElementById('tq').value=q;aiBox('<p class="note">'+esc(e.msg||'No se pudo responder.')+'</p>')}
}
async function aiCards(){
  var k=document.getElementById('fk').value,txt=document.getElementById('fx').value.trim();if(!txt)return;
  aiBox('<p class="s m">Creando tarjetas…</p>');
  try{
    var t=await claudeApi('Crea de 3 a 8 tarjetas de estudio atómicas (una idea por tarjeta, foco en el porqué) a partir de este texto. '+(D.perfil||'')+NL+'TEXTO:'+NL+txt.slice(0,12000)+NL+'Devuelve SOLO JSON: [{"f":"pregunta","r":"respuesta"}]',1500);
    var arr=parseJson(t);if(!Array.isArray(arr)||!arr.length)throw aiErr('json','No se pudieron crear tarjetas; intenta con otro texto.');
    var ts=Date.now();arr.forEach(function(x,i){if(!x||!x.f||!x.r)return;var id='o'+(ts+i).toString(36)+Math.random().toString(36).slice(2,6);ST.newCards.push({id:id,k:k,f:String(x.f),r:String(x.r),ts:ts+i});D.cards.push({id:id,k:k,x:'',t:'basica',f:String(x.f),r:String(x.r),p:'',s:null,n:ts+i})});
    save();aiBox('<p class="note">'+arr.length+' tarjetas creadas. Ya puedes estudiarlas y se subirán a la app al importar el progreso.</p>');
  }catch(e){aiBox('<p class="note">'+esc(e.msg||'No se pudo.')+'</p>')}
}
home();
