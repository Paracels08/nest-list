
(function(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var uid=function(p){return (p||'x')+Date.now().toString(36).slice(-4)+Math.random().toString(36).slice(2,7)};
var SIZES={4:'a poppy seed',5:'a sesame seed',6:'a lentil',7:'a blueberry',8:'a raspberry',9:'a cherry',10:'a strawberry',11:'a fig',12:'a lime',13:'a lemon',14:'a peach',15:'an apple',16:'an avocado',17:'a pear',18:'a bell pepper',19:'a mango',20:'a banana',21:'a carrot',22:'a papaya',23:'a grapefruit',24:'an ear of corn',25:'a cauliflower',26:'a lettuce',27:'a cabbage',28:'an eggplant',29:'a butternut squash',30:'a cucumber',31:'a coconut',32:'a jicama',33:'a pineapple',34:'a cantaloupe',35:'a honeydew melon',36:'a romaine lettuce',37:'a bunch of chard',38:'a leek',39:'a mini watermelon',40:'a little pumpkin'};
var SOURCES=['Vinted','Facebook Marketplace','Friends & family','Hand-me-down','Gift','Second-hand shop','Amazon','Local store','IKEA','Pharmacy'];
var CURRENCIES=['EUR','USD','GBP','CHF','CZK','PLN','SEK','NOK','DKK','HUF','CAD','AUD'];
var sv=function(w,b){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round">'+b+'</svg>'};
var ICON={
 check:sv(3,'<path d="M5.5 12.5l4 4 9-9"/>'),
 chev:'<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
 disc:'<svg class="disc" viewBox="0 0 8 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1.5l5 5-5 5"/></svg>',
 plus:sv(3.4,'<path d="M12 5v14M5 12h14"/>'),
 gear:sv(2,'<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'),
 dots:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18.5" cy="12" r="1.8"/></svg>',
 eye:sv(2,'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
 home:sv(1.8,'<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'),
 baby:sv(1.8,'<path d="M4 10h16a0 0 0 0 1 0 0 8 8 0 0 1-8 8 8 8 0 0 1-8-8z"/><path d="M12 10V3a7 7 0 0 1 7 7"/><circle cx="7.5" cy="20.5" r="1.5"/><circle cx="16.5" cy="20.5" r="1.5"/>'),
 bag:sv(1.8,'<rect x="3.5" y="7" width="17" height="13" rx="3"/><path d="M8.5 7V5.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7M9 7v13M15 7v13"/>'),
 list:sv(1.8,'<path d="M10 6.5h10M10 12h10M10 17.5h10"/><circle cx="5" cy="6.5" r="1.4"/><circle cx="5" cy="12" r="1.4"/><circle cx="5" cy="17.5" r="1.4"/>')
};

/* ---------- state ---------- */
var state=null;
var canWrite=false, capsChecked=false;
var CFG=window.NEST_CONFIG||{};
var sb=window.supabase&&CFG.url?window.supabase.createClient(CFG.url,CFG.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
var session=null,listId=null,role=null,channel=null,recovering=false;
var ui={tab:'home',filter:'need',q:'',collapsed:{}};
try{var u=JSON.parse(localStorage.getItem('nest-ui')||'null');if(u)ui=Object.assign(ui,u)}catch(e){}
try{var h=(location.hash||'').slice(1);if(['home','baby','mom','todo'].indexOf(h)>=0)ui.tab=h}catch(e){}
if(ui.filter!=='got')ui.filter='need';
function keepUi(){try{localStorage.setItem('nest-ui',JSON.stringify(ui))}catch(e){}}

/* ---------- helpers ---------- */
function money(n){if(n==null||isNaN(n))return '';try{return new Intl.NumberFormat(undefined,{style:'currency',currency:state.settings.currency||'EUR',maximumFractionDigits:n%1?2:0,minimumFractionDigits:n%1?2:0}).format(n)}catch(e){return n.toFixed(2)+' '+(state.settings.currency||'')}}
function today(){var d=new Date();d.setHours(0,0,0,0);return d}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function parse(s){var p=String(s).split('-');return new Date(+p[0],+p[1]-1,+p[2])}
function daysUntil(s){return Math.round((parse(s)-today())/864e5)}
function shortDate(s){return parse(s).toLocaleDateString(undefined,{month:'short',day:'numeric'})}
function longDate(s){return parse(s).toLocaleDateString(undefined,{weekday:'short',month:'long',day:'numeric',year:'numeric'})}
function addDays(s,n){var d=parse(s);d.setDate(d.getDate()+n);return iso(d)}
function relDue(s){var n=daysUntil(s);if(n<0)return {t:(-n)+(n===-1?' day':' days')+' overdue',c:'late'};if(n===0)return {t:'Today',c:'late'};if(n===1)return {t:'Tomorrow',c:'soon'};if(n<=7)return {t:'In '+n+' days',c:'soon'};return {t:shortDate(s),c:''}}
function lastPrice(o){var h=o.history||[];return h.length?h[h.length-1].p:null}
function minPrice(it){var m=null;(it.options||[]).forEach(function(o){var p=lastPrice(o);if(p!=null&&(m==null||p<m))m=p});return m}
function hasDrop(it){return (it.options||[]).some(function(o){var h=o.history||[];return h.length>1&&h[h.length-1].p<h[h.length-2].p})}
function domain(u){try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return u}}
function prefLabel(p){return p==='used'?'Second-hand':p==='new'?'New':'Either'}
function allItems(area){var r=[];state.areas[area].sections.forEach(function(s){s.items.forEach(function(i){r.push(i)})});return r}
function findItem(id){var res=null;['baby','mom'].forEach(function(a){state.areas[a].sections.forEach(function(s){s.items.forEach(function(i){if(i.id===id)res={area:a,sec:s,item:i}})})});return res}
function findSec(id){var res=null;['baby','mom'].forEach(function(a){state.areas[a].sections.forEach(function(s){if(s.id===id)res={area:a,sec:s}})});return res}
function findList(id){return state.lists.filter(function(l){return l.id===id})[0]}
function findTask(id){var r=null;state.lists.forEach(function(l){l.tasks.forEach(function(t){if(t.id===id)r={list:l,task:t}})});return r}
function pct(a,b){return b?a/b:0}
function toast(msg){var o=$('.toast');if(o)o.remove();var t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=msg;document.body.appendChild(t);setTimeout(function(){t.remove()},2400)}
function ring(f){var r=17.5,c=2*Math.PI*r;return '<svg class="ring" viewBox="0 0 40 40" aria-hidden="true"><circle class="bg" cx="20" cy="20" r="'+r+'"/>'+(f>0?'<circle class="fg" cx="20" cy="20" r="'+r+'" stroke-dasharray="'+(c*f).toFixed(1)+' '+c.toFixed(1)+'"/>':'')+'</svg>'}

/* ---------- saving ---------- */
var saveTimer=null,saving=false,again=false,saveState='';
function setSave(s){saveState=s;var el=$('#save');if(el){el.textContent=saveLabel();el.className='save'+(s==='error'||s==='offline'?' err':'')}}
function saveLabel(){return {pending:'Edited',saving:'Saving…',saved:'Saved',error:'Not saved · Retry',offline:'Offline · will sync'}[saveState]||''}
function cache(){try{localStorage.setItem('nest-cache',JSON.stringify({listId:listId,role:role,uid:session&&session.user.id,data:state,pending:saveState==='pending'||saveState==='offline'||saveState==='error'}))}catch(e){}}
function readCache(){try{return JSON.parse(localStorage.getItem('nest-cache')||'null')}catch(e){return null}}
function commit(){state.updatedAt=Date.now();setSave('pending');cache();clearTimeout(saveTimer);saveTimer=setTimeout(save,900);render()}
function flush(){if(saveTimer){clearTimeout(saveTimer);saveTimer=null;save()}}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')flush();else if(state&&!saveTimer&&!saving&&saveState!=='pending')refresh()});
window.addEventListener('pagehide',flush);
window.addEventListener('online',function(){if(saveState==='offline'||saveState==='error')save()});
function save(){
  saveTimer=null;
  if(!sb||!canWrite||!listId)return;
  if(saving){again=true;return}
  if(!navigator.onLine){setSave('offline');cache();return}
  saving=true;setSave('saving');
  sb.from('lists').update({data:state,updated_at:new Date().toISOString()}).eq('id',listId).then(function(r){
    saving=false;
    if(r.error){setSave(navigator.onLine?'error':'offline');cache()}else{setSave('saved');cache()}
    if(again){again=false;save()}
  },function(){saving=false;setSave('offline');cache()});
}
// Never swap in server data while a sheet is open: the form holds the old item and saving it would add a copy.
function refresh(){
  if(!sb||!listId)return;
  sb.from('lists').select('data').eq('id',listId).maybeSingle().then(function(r){
    if(r.data&&r.data.data&&!sheetEl&&!saveTimer&&!saving&&saveState!=='pending'&&saveState!=='offline'&&saveState!=='error'){state=r.data.data;cache();render()}
  });
}
function listen(){
  if(!sb||!listId)return;
  if(channel)sb.removeChannel(channel);
  channel=sb.channel('list-'+listId).on('postgres_changes',{event:'UPDATE',schema:'public',table:'lists',filter:'id=eq.'+listId},function(p){
    if(p.new&&p.new.data&&!sheetEl&&!saveTimer&&!saving&&saveState!=='pending'&&(p.new.data.updatedAt||0)>(state.updatedAt||0)){state=p.new.data;cache();render()}
  }).subscribe();
}

/* ---------- render ---------- */
var app=document.getElementById('app');
var TITLES={home:['Nest List','Everything to sort before the baby arrives'],baby:['Baby','Things to get for the baby'],mom:['Mom','Hospital bag and your essentials'],todo:['To-dos','Paperwork, prep and deadlines']};
function render(){
  if(!state)return renderGate();
  var sy=window.scrollY,t=TITLES[ui.tab];
  app.innerHTML='<div class="topbar"><div class="wrap"><button class="save" id="save" data-act="retry">'+esc(saveLabel())+'</button>'+
   '<button class="iconbtn" data-act="settings" aria-label="Settings">'+ICON.gear+'</button></div></div>'+
   '<main class="wrap" id="main"><div class="lt"><h1>'+t[0]+'</h1><p>'+t[1]+'</p></div>'+
   (capsChecked&&!canWrite?'<div class="banner">'+ICON.eye+'<span>Shared with you. You can view everything, but only the owner can make changes.</span></div>':'')+page()+'</main>'+tabs();
  window.scrollTo(0,sy);
}
function tabs(){
  var t=[['home','Overview',ICON.home],['baby','Baby',ICON.baby],['mom','Mom',ICON.bag],['todo','To-dos',ICON.list]];
  return '<nav class="tabs" aria-label="Sections"><div class="in">'+t.map(function(x){return '<button data-act="tab" data-tab="'+x[0]+'"'+(ui.tab===x[0]?' aria-current="page"':'')+'>'+x[2]+x[1]+'</button>'}).join('')+'</div></nav>';
}
function page(){return ui.tab==='home'?overview():ui.tab==='todo'?todos():area(ui.tab)}
function H2(title,extra){return '<div class="h2"><h2>'+title+'</h2>'+(extra?'<span>'+extra+'</span>':'')+'</div>'}

function countdown(){
  var d=state.settings.dueDate,nm=state.settings.babyName;
  if(!d)return '<div class="hero"><div class="hero-empty"><div><b>When is the due date?</b><p>Add it for a countdown and quick deadlines on to-dos.</p></div>'+(canWrite?'<button class="btn sm" data-act="settings">Add date</button>':'')+'</div></div>';
  var left=daysUntil(d),g=Math.max(0,Math.min(280,280-left)),wk=Math.floor(g/7),dy=g%7;
  var tri=wk<14?'First trimester':wk<28?'Second trimester':'Third trimester';
  var big=left>=0?left:-left,unit=(big===1?'day':'days')+(left>=0?' to go':' past due');
  return '<div class="hero"><div class="top"><span class="eyebrow">'+(nm?esc(nm):'Due date')+'</span><span class="date">'+esc(longDate(d))+'</span></div>'+
   '<div><div class="num">'+big+'<small>'+unit+'</small></div><div class="sub">'+(left>=0?'Week '+wk+(dy?' + '+dy+' days':'')+' · '+tri+(SIZES[wk]?'<span class="size">About the size of '+SIZES[wk]+'</span>':''):'Any day now')+'</div></div>'+
   '<div><div class="track"><i style="width:'+(g/280*100).toFixed(1)+'%"></i><b style="left:35%"></b><b style="left:70%"></b></div><div class="tri"><span>Week 0</span><span>14</span><span>28</span><span>40</span></div></div></div>';
}
function stat(label,a,b,tab,tone){return '<button class="stat '+tone+'" data-act="tab" data-tab="'+tab+'">'+ring(pct(a,b))+'<span class="tx"><span class="k">'+label+'</span><span class="v">'+a+'<span> / '+b+'</span></span></span></button>'}
function overview(){
  var baby=allItems('baby'),mom=allItems('mom');
  var bag=[];state.areas.mom.sections.forEach(function(s){if(s.bag)bag=bag.concat(s.items)});
  var ess=[];state.areas.mom.sections.forEach(function(s){if(!s.bag)ess=ess.concat(s.items)});
  var tasks=[];state.lists.forEach(function(l){l.tasks.forEach(function(t){tasks.push({t:t,l:l})})});
  var got=function(a){return a.filter(function(i){return i.got}).length};
  var s=countdown()+'<div class="stats">'+
    stat('Baby items',got(baby),baby.length,'baby','t-pink')+stat('Hospital bag',got(bag),bag.length,'mom','t-peach')+
    stat('For mom',got(ess),ess.length,'mom','t-lilac')+stat('To-dos',tasks.filter(function(x){return x.t.done}).length,tasks.length,'todo','t-mint')+'</div>';
  var up=tasks.filter(function(x){return !x.t.done&&x.t.due}).sort(function(a,b){return a.t.due<b.t.due?-1:1}).slice(0,5);
  s+=H2('Coming up')+'<div class="group">'+(up.length?up.map(function(x){return taskRow(x.t,x.l.name)}).join(''):'<div class="empty">No deadlines yet. Give a to-do a date and it appears here.</div>')+'</div>';
  var all=baby.concat(mom),est=0,priced=0,spent=0,used=0;
  all.forEach(function(i){if(!i.got){var m=minPrice(i);if(m!=null){est+=m;priced++}}if(i.got&&i.paid!=null)spent+=i.paid;if(i.pref==='used')used++});
  s+=H2('Budget')+'<div class="group"><div class="money"><div><b>'+money(spent)+'</b><span>Spent</span></div><div><b>'+(priced?money(est):'—')+'</b><span>Still to spend</span></div><div><b>'+used+'</b><span>Second-hand</span></div></div></div>'+
   '<p class="note">'+(priced?'Based on the cheapest saved link for '+priced+' item'+(priced>1?'s':'')+' still to get.':'Save links with prices on items to estimate what is left to spend.')+'</p>';
  var drops=all.filter(function(i){return !i.got&&hasDrop(i)});
  if(drops.length)s+=H2('Price drops',drops.length)+'<div class="group">'+drops.map(itemRow).join('')+'</div>';
  var must=all.filter(function(i){return i.must!==false&&!i.got});
  var left=must.filter(function(i){return drops.indexOf(i)<0});// already shown under Price drops
  s+=H2('Must-haves left',must.length)+'<div class="group">'+(left.length?left.slice(0,6).map(itemRow).join(''):'<div class="empty">'+(must.length?'The rest are under Price drops above.':'Every must-have is sorted.')+'</div>')+'</div>'+
    (left.length>6?'<p class="note">Plus '+(left.length-6)+' more in Baby and Mom.</p>':'');
  s+='<button class="btn wide" data-act="copy-list">Copy shopping list</button>';
  return s;
}
function checkBtn(act,id,on,label){return '<button class="check" data-act="'+act+'" data-id="'+id+'" aria-pressed="'+!!on+'" aria-label="'+label+'"'+(canWrite?'':' disabled')+'>'+ICON.check+'</button>'}
function itemRow(i){
  var mp=minPrice(i),meta=[];
  if(i.pref!=='either')meta.push('<span class="tag '+i.pref+'">'+prefLabel(i.pref)+'</span>');
  meta.push(i.must===false?'<span class="tag">Nice to have</span>':'<span class="tag must">Must-have</span>');
  if(!i.got&&hasDrop(i))meta.push('<span class="tag drop">Price drop</span>');
  if(i.qty>1)meta.push('<span>×'+i.qty+'</span>');
  if(i.source)meta.push('<span>'+esc(i.source)+'</span>');
  if(i.got&&i.paid!=null)meta.push('<span class="price">'+money(i.paid)+'</span>');
  else if(mp!=null)meta.push('<span class="price">'+((i.options||[]).length>1?'from ':'')+money(mp)+'</span>');
  return '<div class="row'+(i.got?' done':'')+'">'+checkBtn('toggle-item',i.id,i.got,i.got?'Mark as still needed':'Mark as got it')+
   '<button class="main" data-act="open-item" data-id="'+i.id+'"><span class="tx"><div class="t">'+esc(i.name)+'</div>'+(meta.length?'<div class="meta">'+meta.join('')+'</div>':'')+'</span>'+ICON.disc+'</button></div>';
}
function taskRow(t,sub){
  var r=t.due?relDue(t.due):null,meta=[];
  if(r)meta.push('<span class="tag '+(t.done?'':r.c)+'">'+esc(t.done?shortDate(t.due):r.t)+'</span>');
  if(sub)meta.push('<span>'+esc(sub)+'</span>');
  else if(t.notes)meta.push('<span>'+esc(t.notes.length>56?t.notes.slice(0,56)+'…':t.notes)+'</span>');
  return '<div class="row'+(t.done?' done':'')+'">'+checkBtn('toggle-task',t.id,t.done,t.done?'Mark not done':'Mark done')+
   '<button class="main" data-act="open-task" data-id="'+t.id+'"><span class="tx"><div class="t">'+esc(t.title)+'</div>'+(meta.length?'<div class="meta">'+meta.join('')+'</div>':'')+'</span>'+ICON.disc+'</button></div>';
}
function addRow(act,attr,label){return '<button class="add" data-act="'+act+'" '+attr+'><span class="plus">'+ICON.plus+'</span>'+label+'</button>'}
function matches(i){
  var q=ui.q.trim().toLowerCase();
  if(q&&(i.name+' '+i.source+' '+i.notes).toLowerCase().indexOf(q)<0)return false;
  return ui.filter==='got'?!!i.got:!i.got;
}
function area(a){
  var all=allItems(a),nb=all.filter(function(i){return i.got}).length;
  var s='<div class="tools"><div class="seg big" role="group" aria-label="Show">'+
    [['need','Not bought',all.length-nb],['got','Bought',nb]].map(function(f){return '<button data-act="filter" data-f="'+f[0]+'" aria-pressed="'+(ui.filter===f[0])+'">'+f[1]+' <span class="n">'+f[2]+'</span></button>'}).join('')+
    '</div><input class="search" id="q" type="search" placeholder="Search" value="'+esc(ui.q)+'" autocomplete="off" aria-label="Search items"></div><div id="secs">'+sections(a)+'</div>';
  if(canWrite&&ui.filter==='need')s+=addRow('new-sec','data-area="'+a+'"','Add section').replace('class="add"','class="add solo"');
  return s;
}
function sections(a){
  var filtering=ui.filter==='got'||ui.q.trim();
  return state.areas[a].sections.map(function(sec){
    var items=sec.items.filter(matches);
    if(filtering&&!items.length)return '';
    var col=!filtering&&ui.collapsed[sec.id];
    var done=sec.items.filter(function(i){return i.got}).length;
    return '<section class="'+(col?'collapsed':'')+'"><div class="sec-h"><button class="ttl" data-act="collapse" data-id="'+sec.id+'" aria-expanded="'+!col+'"><h3>'+esc(sec.name)+'</h3><span class="cnt">'+done+'/'+sec.items.length+'</span>'+ICON.chev+'</button>'+
     (canWrite?'<button class="iconbtn" data-act="sec-menu" data-id="'+sec.id+'" aria-label="Edit section '+esc(sec.name)+'">'+ICON.dots+'</button>':'')+'</div>'+
     (col?'':'<div class="group">'+(items.length?items.map(itemRow).join(''):'')+(!items.length&&canWrite&&sec.items.length&&ui.filter==='need'?'<div class="empty">Everything here is bought.</div>':'')+(canWrite&&ui.filter==='need'?addRow('new-item','data-sec="'+sec.id+'"','Add item'):(items.length?'':'<div class="empty">Nothing left to buy here.</div>'))+'</div>')+'</section>';
  }).join('')||'<div class="group"><div class="empty">'+(ui.q.trim()?'No items match.':'Nothing bought yet. Tick an item when you get it.')+'</div></div>';
}
function todos(){
  var s='';
  state.lists.forEach(function(l){
    var tasks=l.tasks.slice().sort(function(a,b){if(a.done!==b.done)return a.done?1:-1;if(a.due&&b.due)return a.due<b.due?-1:1;if(a.due)return -1;if(b.due)return 1;return 0});
    var done=l.tasks.filter(function(t){return t.done}).length;
    s+='<section><div class="sec-h"><div class="ttl"><h3>'+esc(l.name)+'</h3><span class="cnt">'+done+'/'+l.tasks.length+'</span></div>'+
     (canWrite?'<button class="iconbtn" data-act="list-menu" data-id="'+l.id+'" aria-label="Edit list '+esc(l.name)+'">'+ICON.dots+'</button>':'')+'</div><div class="group">'+
     tasks.map(function(t){return taskRow(t)}).join('')+(canWrite?addRow('new-task','data-list="'+l.id+'"','Add task'):(tasks.length?'':'<div class="empty">No tasks yet.</div>'))+'</div></section>';
  });
  if(canWrite)s+=addRow('new-list','','New list').replace('class="add"','class="add solo"');
  return s;
}

/* ---------- sheets ---------- */
var sheetEl=null;
function openSheet(title,body,opts,onReady){
  opts=opts||{};closeSheet();sheetEl=document.createElement('div');sheetEl.className='scrim';
  sheetEl.innerHTML='<div class="sheet" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><form id="sheetf" autocomplete="off" novalidate><div class="sheet-h"><button type="button" class="textbtn" data-close>'+(opts.done?'':'Cancel')+'</button><h3>'+esc(title)+'</h3>'+(opts.done?'<button type="button" class="textbtn" data-close>Done</button>':'<button type="submit" class="textbtn">'+(opts.save||'Save')+'</button>')+'</div>'+body+'</form></div>';
  document.body.appendChild(sheetEl);document.body.style.overflow='hidden';
  sheetEl.addEventListener('click',function(e){if(e.target===sheetEl||e.target.closest('[data-close]'))closeSheet()});
  sheetEl.querySelectorAll('.seg button').forEach(function(b){b.onclick=function(){b.parentNode.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',x===b)})}});
  sheetEl.querySelectorAll('.sw').forEach(function(b){b.addEventListener('click',function(){b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true')})});
  var f=$('#sheetf',sheetEl);f.onsubmit=function(e){e.preventDefault();if(opts.onSave&&opts.onSave(sheetEl)!==false){closeSheet();commit()}};
  if(onReady)onReady(sheetEl);
}
function closeSheet(){if(sheetEl){sheetEl.remove();sheetEl=null;document.body.style.overflow=''}}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeSheet()});
function seg(name,val,opts){return '<div class="seg" data-seg="'+name+'">'+opts.map(function(o){return '<button type="button" data-v="'+o[0]+'" aria-pressed="'+(val===o[0])+'">'+o[1]+'</button>'}).join('')+'</div>'}
function segVal(root,name){var b=$('[data-seg="'+name+'"] [aria-pressed="true"]',root);return b?b.getAttribute('data-v'):null}
function sw(id,on,label){return '<div class="fr"><label for="'+id+'">'+label+'</label><button type="button" class="sw" id="'+id+'" aria-pressed="'+!!on+'"></button></div>'}
function swVal(root,id){var b=$('#'+id,root);return b?b.getAttribute('aria-pressed')==='true':false}
function delBtn(id){return '<button type="button" class="del" id="'+id+'">Delete</button>'}
function armDelete(root,id,fn,warn){var b=$('#'+id,root);if(!b)return;b.onclick=function(){if(b.dataset.armed){fn();closeSheet();commit();toast('Deleted')}else{b.dataset.armed='1';b.textContent=warn||'Tap again to delete';setTimeout(function(){if(b.isConnected){delete b.dataset.armed;b.textContent='Delete'}},3000)}}}
function histText(o){var h=o.history||[];if(h.length<2)return '';return h.slice(-4).map(function(x){return money(x.p)}).join(' → ')+' since '+shortDate(h[Math.max(0,h.length-4)].d)}
function fr(label,val){return '<div class="fr"><span>'+label+'</span><span>'+esc(val)+'</span></div>'}

function itemView(f){
  var i=f.item,rows=[fr('Status',i.got?'Got it':'Still to get'),fr('Quantity',String(i.qty||1)),fr('Buy',prefLabel(i.pref)),fr('Priority',i.must===false?'Nice to have':'Must-have')];
  if(i.source)rows.push(fr('Where from',i.source));if(i.got&&i.paid!=null)rows.push(fr('Paid',money(i.paid)));
  var b='<div class="big">'+esc(i.name)+'</div><div class="fg dl">'+rows.join('')+'</div>';
  if((i.options||[]).length)b+='<div class="fh">Options</div><div class="fg">'+i.options.map(function(o){var p=lastPrice(o),ht=histText(o);
    var inner='<span class="tx"><b>'+esc(o.label||(o.url?domain(o.url):'Option'))+'</b>'+(ht?'<span class="hist" style="padding:0">'+esc(ht)+'</span>':(o.label&&o.url?'<span class="hist" style="padding:0">'+esc(domain(o.url))+'</span>':''))+'</span>'+(p!=null?'<span class="price">'+money(p)+'</span>':'');
    return o.url?'<a class="linkrow" href="'+esc(o.url)+'" target="_blank" rel="noopener">'+inner+ICON.disc+'</a>':'<div class="linkrow">'+inner+'</div>'}).join('')+'</div>';
  if(i.notes)b+='<div class="fh">Notes</div><div class="fg"><div class="pad" style="white-space:pre-wrap">'+esc(i.notes)+'</div></div>';
  openSheet('Item',b,{done:true});
}
function itemForm(f,secId){
  if(!canWrite)return itemView(f);
  var isNew=!f,i=f?f.item:{id:uid('i'),name:'',qty:1,got:false,pref:'either',source:'',must:true,notes:'',paid:null,options:[]};
  var curSec=f?f.sec.id:secId;
  var opts=(i.options||[]).slice();while(opts.length<3)opts.push({id:uid('o'),label:'',url:'',history:[]});
  var secOpts=['baby','mom'].map(function(a){return '<optgroup label="'+(a==='baby'?'Baby':'Mom')+'">'+state.areas[a].sections.map(function(s){return '<option value="'+s.id+'"'+(s.id===curSec?' selected':'')+'>'+esc(s.name)+'</option>'}).join('')+'</optgroup>'}).join('');
  var b='<div class="fg"><input class="in" id="f-name" value="'+esc(i.name)+'" placeholder="Item name" aria-label="Item name" style="padding-left:16px;padding-right:16px"></div>'+
   '<div class="fg">'+sw('f-got',i.got,'Got it')+'<div class="fr" id="paidwrap"'+(i.got?'':' hidden')+'><label for="f-paid">Price paid</label><input class="in" id="f-paid" type="number" inputmode="decimal" step="0.01" min="0" value="'+(i.paid!=null?i.paid:'')+'" placeholder="0 if gifted"></div></div>'+
   '<div class="fg"><div class="fr"><label for="f-qty">Quantity</label><input class="in" id="f-qty" type="number" inputmode="numeric" min="1" value="'+(i.qty||1)+'"></div>'+
   '<div class="fr"><label for="f-sec">Section</label><select class="in" id="f-sec">'+secOpts+'</select></div>'+
   '<div class="fr">'+seg('pref',i.pref,[['new','New'],['used','Second-hand'],['either','Either']])+'</div>'+
   '<div class="fr">'+seg('must',i.must===false?'nice':'must',[['must','Must-have'],['nice','Nice to have']])+'</div>'+
   '<div class="fr"><label for="f-src">Where from</label><input class="in" id="f-src" list="srcs" value="'+esc(i.source)+'" placeholder="Vinted, a friend…"><datalist id="srcs">'+SOURCES.map(function(x){return '<option value="'+esc(x)+'">'}).join('')+'</datalist></div></div>'+
   '<div class="fh">Watching · up to 3 links</div><div class="fg">'+opts.map(function(o,k){var p=lastPrice(o),ht=histText(o);
     return '<div class="opt" data-opt="'+k+'"><div class="o1"><span class="n">'+(k+1)+'</span><input class="in" data-o="url" type="text" autocapitalize="off" inputmode="url" placeholder="Paste a link" value="'+esc(o.url)+'" aria-label="Link '+(k+1)+'"></div><div class="o2"><input class="in" data-o="label" placeholder="Label" value="'+esc(o.label)+'" aria-label="Label '+(k+1)+'"><input class="in" data-o="price" type="number" inputmode="decimal" step="0.01" min="0" placeholder="Price" value="'+(p!=null?p:'')+'" aria-label="Price '+(k+1)+'"></div>'+(ht?'<div class="hist">'+esc(ht)+'</div>':'')+'</div>'}).join('')+'</div>'+
   '<p class="note" style="margin:-14px 16px 22px">Update the price when you check a link. Every change is kept, so drops stand out.</p>'+
   '<div class="fh">Notes</div><div class="fg"><textarea class="in" id="f-notes" placeholder="Size, colour, safety notes" aria-label="Notes">'+esc(i.notes)+'</textarea></div>'+
   (isNew?'':delBtn('f-del'));
  openSheet(isNew?'New item':'Edit item',b,{onSave:function(r){
      var name=$('#f-name',r).value.trim();if(!name){$('#f-name',r).focus();return false}
      i.name=name;i.qty=Math.max(1,parseInt($('#f-qty',r).value,10)||1);i.pref=segVal(r,'pref');i.must=segVal(r,'must')!=='nice';
      i.source=$('#f-src',r).value.trim();i.notes=$('#f-notes',r).value.trim();i.got=swVal(r,'f-got');
      var pv=$('#f-paid',r).value;i.paid=i.got&&pv!==''?Math.max(0,parseFloat(pv)):null;
      var d=iso(today());
      i.options=opts.map(function(o,k){var box=$('[data-opt="'+k+'"]',r);var url=$('[data-o="url"]',box).value.trim(),label=$('[data-o="label"]',box).value.trim(),pr=$('[data-o="price"]',box).value;
        if(url&&!/^https?:\/\//i.test(url))url='https://'+url;
        if(!url&&!label&&pr==='')return null;
        var hist=(o.history||[]).slice();
        if(pr!==''){var p=Math.round(parseFloat(pr)*100)/100;var last=hist.length?hist[hist.length-1]:null;
          if(!last||last.p!==p){if(last&&last.d===d&&hist.length>1)hist[hist.length-1]={d:d,p:p};else hist.push({d:d,p:p})}}
        return {id:o.id,label:label,url:url,history:hist.slice(-12)}}).filter(Boolean);
      var target=findSec($('#f-sec',r).value).sec;
      if(isNew)target.items.push(i);else if(target!==f.sec){f.sec.items=f.sec.items.filter(function(x){return x!==i});target.items.push(i)}
    }},function(r){
    $('#f-got',r).addEventListener('click',function(){$('#paidwrap',r).hidden=!swVal(r,'f-got')});
    if(f)armDelete(r,'f-del',function(){f.sec.items=f.sec.items.filter(function(x){return x!==i})});
    if(isNew)setTimeout(function(){$('#f-name',r).focus()},60);
  });
}
function taskForm(f,listId){
  var isNew=!f,t=f?f.task:{id:uid('t'),title:'',due:'',done:false,notes:''},l=f?f.list:findList(listId);
  if(!canWrite){
    var b='<div class="big">'+esc(t.title)+'</div><div class="fg dl">'+fr('List',l.name)+fr('Status',t.done?'Done':'To do')+(t.due?fr('Deadline',longDate(t.due))+fr('',relDue(t.due).t):'')+'</div>'+(t.notes?'<div class="fh">Notes</div><div class="fg"><div class="pad" style="white-space:pre-wrap">'+esc(t.notes)+'</div></div>':'');
    openSheet('Task',b,{done:true});return;
  }
  var dd=state.settings.dueDate,q='';
  if(dd)q='<div class="qchips">'+[[-56,'8 wks before due'],[-28,'4 wks before'],[-14,'2 wks before'],[0,'Due date'],[14,'2 wks after'],[42,'6 wks after']].map(function(x){return '<button type="button" class="chip" data-add="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div>';
  var b='<div class="fg"><input class="in" id="t-title" value="'+esc(t.title)+'" placeholder="Task" aria-label="Task" style="padding-left:16px;padding-right:16px"></div>'+
   '<div class="fg">'+sw('t-done',t.done,'Done')+'<div class="fr"><label for="t-due">Deadline</label><input class="in" id="t-due" type="date" value="'+esc(t.due)+'"></div>'+q+'</div>'+
   '<div class="fh">Notes</div><div class="fg"><textarea class="in" id="t-notes" placeholder="Documents needed, phone numbers, links" aria-label="Notes">'+esc(t.notes)+'</textarea></div>'+(isNew?'':delBtn('t-del'));
  openSheet(isNew?'New task':'Edit task',b,{onSave:function(r){var v=$('#t-title',r).value.trim();if(!v){$('#t-title',r).focus();return false}t.title=v;t.due=$('#t-due',r).value;t.done=swVal(r,'t-done');t.notes=$('#t-notes',r).value.trim();if(isNew)l.tasks.push(t)}},function(r){
    r.querySelectorAll('[data-add]').forEach(function(b){b.onclick=function(){$('#t-due',r).value=addDays(dd,+b.getAttribute('data-add'))}});
    if(f)armDelete(r,'t-del',function(){l.tasks=l.tasks.filter(function(x){return x!==t})});
    if(isNew)setTimeout(function(){$('#t-title',r).focus()},60);
  });
}
function nameForm(title,val,placeholder,onSave,onDelete,extra,warn){
  var b='<div class="fg"><input class="in" id="n-name" value="'+esc(val)+'" placeholder="'+esc(placeholder)+'" aria-label="Name" style="padding-left:16px;padding-right:16px"></div>'+(extra||'')+(onDelete?delBtn('n-del'):'');
  openSheet(title,b,{onSave:function(r){var v=$('#n-name',r).value.trim();if(!v){$('#n-name',r).focus();return false}onSave(v,r)}},function(r){
    if(onDelete)armDelete(r,'n-del',onDelete,warn);if(!val)setTimeout(function(){$('#n-name',r).focus()},60)});
}
function settingsForm(){
  var st=state.settings,em=session&&session.user.email||'';
  var acct='<div class="fh">Account</div><div class="fg"><div class="fr"><span class="lbl">Signed in as</span><span class="in" style="color:var(--ink2);overflow:hidden;text-overflow:ellipsis">'+esc(em)+'</span></div></div><button type="button" class="del" id="s-out" style="color:var(--accent-text)">Sign out</button>';
  if(!canWrite){openSheet('Settings','<div class="banner">'+ICON.eye+'<span>This list was shared with you to view.</span></div>'+acct,{done:true},function(r){$('#s-out',r).onclick=signOut});return}
  var b='<div class="fg"><div class="fr"><label for="s-due">Due date</label><input class="in" id="s-due" type="date" value="'+esc(st.dueDate)+'"></div>'+
   '<div class="fr"><label for="s-name">Nickname</label><input class="in" id="s-name" value="'+esc(st.babyName)+'" placeholder="Optional"></div>'+
   '<div class="fr"><label for="s-cur">Currency</label><select class="in" id="s-cur">'+CURRENCIES.map(function(c){return '<option'+(c===st.currency?' selected':'')+'>'+c+'</option>'}).join('')+'</select></div></div>'+
   '<div class="fh">Shared with (view only)</div><div class="fg" id="viewers"><div class="empty">Loading…</div></div>'+
   '<div class="fg"><div class="fr"><input class="in" id="s-share" type="email" inputmode="email" autocapitalize="off" placeholder="Partner’s email" aria-label="Email to share with" style="text-align:left"><button type="button" class="textbtn" id="s-add">Share</button></div></div>'+
   '<p class="note" style="margin:-14px 16px 22px">They create an account in Nest List with this email and see your list. They can’t change anything.</p>'+acct;
  openSheet('Settings',b,{onSave:function(r){st.dueDate=$('#s-due',r).value;st.babyName=$('#s-name',r).value.trim();st.currency=$('#s-cur',r).value}},function(r){
    $('#s-out',r).onclick=signOut;
    function load(){sb.from('list_viewers').select('email').eq('list_id',listId).order('created_at').then(function(res){var box=$('#viewers',r);if(!box)return;
      var rows=res.data||[];box.innerHTML=rows.length?rows.map(function(v){return '<div class="fr"><span style="flex:1;min-width:0;overflow-wrap:anywhere">'+esc(v.email)+'</span><button type="button" class="textbtn" data-rm="'+esc(v.email)+'" style="color:var(--danger);font-weight:600">Remove</button></div>'}).join(''):'<div class="empty">Not shared with anyone yet.</div>';
      box.querySelectorAll('[data-rm]').forEach(function(x){x.onclick=function(){sb.from('list_viewers').delete().eq('list_id',listId).eq('email',x.getAttribute('data-rm')).then(load)}})})}
    load();
    $('#s-add',r).onclick=function(){var e=$('#s-share',r).value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(e)){$('#s-share',r).focus();return}
      sb.from('list_viewers').insert({list_id:listId,email:e}).then(function(res){if(res.error&&res.error.code!=='23505'){toast('Could not share. Check the email and try again.');return}$('#s-share',r).value='';toast('Shared with '+e);load()})};
  });
}
function signOut(){closeSheet();try{localStorage.removeItem('nest-cache')}catch(e){}if(channel)sb.removeChannel(channel);sb.auth.signOut().then(function(){state=null;listId=null;role=null;canWrite=false;gate='signin';render()})}

/* ---------- sign in ---------- */
var gate='signin',gateMsg='',gateBusy=false;
function renderGate(){
  var title={signin:'Welcome back',signup:'Create your account',reset:'Reset password',newpass:'Choose a new password',start:'Your list',loading:''}[gate];
  var sub={signin:'Sign in to see your checklist.',signup:'Start your own list, or see one shared with you.',reset:'We’ll email you a link to set a new password.',newpass:'Enter a new password for your account.',start:'',loading:''}[gate];
  var h='<main class="wrap gate"><div class="gate-mark" aria-hidden="true"><img src="icons/icon-192.png" alt=""></div><h1 class="gate-title">Nest List</h1>';
  if(!sb)h+='<div class="group pad">This copy of Nest List isn’t connected to its database yet.</div>';
  else if(gate==='loading')h+='<p class="gate-sub">Loading your list…</p>';
  else if(gate==='start'){
    h+='<div class="group pad gate-card"><h2>'+title+'</h2><p class="note" style="margin:6px 0 16px">No list is linked to <b>'+esc(session.user.email)+'</b> yet.</p>'+
     '<button class="btn" style="width:100%" data-g="create">Start my list</button>'+
     '<p class="note" style="margin:16px 0 0">Waiting for your partner’s list? Ask them to share it with this email in Settings, then tap Check again.</p>'+
     '<button class="btn ghost" style="width:100%;margin-top:12px" data-g="recheck">Check again</button></div>'+
     '<button class="link" data-g="out">Sign out</button>';
  } else {
    h+='<form class="group pad gate-card" id="gatef" novalidate><h2>'+title+'</h2><p class="note" style="margin:6px 0 16px">'+sub+'</p>'+
     (gate!=='newpass'?'<div class="fg flat"><input class="in" id="g-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" placeholder="Email" aria-label="Email"></div>':'')+
     (gate!=='reset'?'<div class="fg flat"><input class="in" id="g-pass" type="password" autocomplete="'+(gate==='signin'?'current-password':'new-password')+'" placeholder="'+(gate==='signin'?'Password':'Password (8+ characters)')+'" aria-label="Password"></div>':'')+
     (gateMsg?'<p class="gate-msg" role="status">'+esc(gateMsg)+'</p>':'')+
     '<button class="btn" type="submit" style="width:100%"'+(gateBusy?' disabled':'')+'>'+{signin:'Sign in',signup:'Create account',reset:'Send link',newpass:'Save password'}[gate]+'</button></form>'+
     (gate==='signin'?'<button class="link" data-g="signup">New here? Create an account</button><button class="link" data-g="reset">Forgot password?</button>':'')+
     (gate==='signup'||gate==='reset'?'<button class="link" data-g="signin">I already have an account</button>':'');
  }
  app.innerHTML=h+'</main>';
  var f=$('#gatef');if(f)f.onsubmit=function(e){e.preventDefault();submitGate()};
}
function setGate(g,msg){gate=g;gateMsg=msg||'';gateBusy=false;render()}
function submitGate(){
  var em=$('#g-email'),pw=$('#g-pass'),e=em?em.value.trim().toLowerCase():'',p=pw?pw.value:'';
  if(em&&!/^\S+@\S+\.\S+$/.test(e)){gateMsg='Enter your email address.';render();return}
  if(pw&&gate!=='signin'&&p.length<8){gateMsg='Use at least 8 characters for the password.';render();return}
  gateBusy=true;gateMsg='';render();if($('#g-email'))$('#g-email').value=e;
  var done=function(msg,next){gateBusy=false;if(next)gate=next;gateMsg=msg||'';render();if($('#g-email'))$('#g-email').value=e};
  var here=location.origin+location.pathname;
  if(gate==='signin')sb.auth.signInWithPassword({email:e,password:p}).then(function(r){if(r.error)done(/confirm/i.test(r.error.message)?'Confirm your email first: open the link we sent you, then sign in.':'That email and password don’t match.');else{session=r.data.session;loadList()}});
  else if(gate==='signup')sb.auth.signUp({email:e,password:p,options:{emailRedirectTo:here}}).then(function(r){if(r.error)done(r.error.message);else if(r.data.session){session=r.data.session;loadList()}else done('Almost there. Open the link we emailed to '+e+', then sign in here.','signin')});
  else if(gate==='reset')sb.auth.resetPasswordForEmail(e,{redirectTo:here}).then(function(r){done(r.error?r.error.message:'Check your email for a link to set a new password.','signin')});
  else if(gate==='newpass')sb.auth.updateUser({password:p}).then(function(r){if(r.error)done(r.error.message);else{recovering=false;toast('Password updated');loadList()}});
}
app.addEventListener('click',function(e){var b=e.target.closest('[data-g]');if(!b)return;var g=b.getAttribute('data-g');
  if(g==='create')createList();else if(g==='recheck')loadList();else if(g==='out')signOut();else setGate(g)});

function loadList(){
  if(!session)return setGate('signin');
  if(recovering)return setGate('newpass');
  var uid=session.user.id;
  if(!state){gate='loading';render()}
  sb.from('lists').select('id,owner,data').order('owner',{ascending:true}).then(function(r){
    if(r.error){var c=readCache();if(c&&c.uid===uid&&c.data){openList(c.listId,c.role,c.data,c.pending);toast('Offline · showing your saved copy')}else setGate('signin','Couldn’t reach the server. Check your connection and try again.');return}
    var rows=r.data||[],own=rows.filter(function(x){return x.owner===uid})[0],shared=rows.filter(function(x){return x.owner!==uid})[0];
    var c=readCache();
    if(own){var d=own.data;if(c&&c.uid===uid&&c.listId===own.id&&c.pending&&c.data&&(c.data.updatedAt||0)>(d.updatedAt||0)){d=c.data;openList(own.id,'owner',d,true);save();return}openList(own.id,'owner',d)}
    else if(shared)openList(shared.id,'viewer',shared.data);
    else setGate('start');
  });
}
function openList(id,r,data,pending){listId=id;role=r;canWrite=r==='owner';capsChecked=true;state=data;setSave(pending?'pending':'');cache();render();listen()}
function createList(){
  gateBusy=true;
  fetch('starter.json',{cache:'no-store'}).then(function(x){return x.json()}).then(function(starter){
    starter.updatedAt=Date.now();
    return sb.from('lists').insert({data:starter}).select('id,data').single();
  }).then(function(r){if(r.error){setGate('start');toast('Could not create the list. Try again.');return}openList(r.data.id,'owner',r.data.data)})
  .catch(function(){setGate('start');toast('Could not create the list. Check your connection.')});
}

function shoppingText(){
  var out=['Nest List · still to get',''];
  ['baby','mom'].forEach(function(a){
    state.areas[a].sections.forEach(function(s){var it=s.items.filter(function(i){return !i.got});if(!it.length)return;
      out.push(s.name.toUpperCase());
      it.forEach(function(i){var mp=minPrice(i),bits=[];if(i.pref!=='either')bits.push(prefLabel(i.pref).toLowerCase());if(i.source)bits.push(i.source);if(mp!=null)bits.push('~'+money(mp));
        out.push('☐ '+i.name+(i.qty>1?' ×'+i.qty:'')+(bits.length?' ('+bits.join(', ')+')':''))});
      out.push('')})});
  return out.join('\n');
}

/* ---------- events ---------- */
app.addEventListener('click',function(e){
  var b=e.target.closest('[data-act]');if(!b)return;
  var act=b.getAttribute('data-act'),id=b.getAttribute('data-id');
  if(act==='tab'){ui.tab=b.getAttribute('data-tab');keepUi();try{history.replaceState(null,'','#'+ui.tab)}catch(x){}render();window.scrollTo(0,0);return}
  if(act==='filter'){ui.filter=b.getAttribute('data-f');keepUi();render();return}
  if(act==='collapse'){if(ui.filter!=='all'||ui.q.trim())return;ui.collapsed[id]=!ui.collapsed[id];keepUi();render();return}
  if(act==='retry'){if(saveState==='error'||saveState==='pending')save();return}
  if(act==='open-item'){var f=findItem(id);if(f)(canWrite?itemForm(f):itemView(f));return}
  if(act==='open-task'){var ft=findTask(id);if(ft)taskForm(ft);return}
  if(act==='copy-list'){var txt=shoppingText();
    var fallback=function(){openSheet('Shopping list','<div class="fg"><textarea class="in" id="cl" style="min-height:55vh;font-size:15px" readonly aria-label="Shopping list">'+esc(txt)+'</textarea></div><p class="note">Select all and copy.</p>',{done:true},function(r){var t=$('#cl',r);t.focus();t.select()})};
    try{navigator.clipboard.writeText(txt).then(function(){toast('Shopping list copied')},fallback)}catch(x){fallback()}return}
  if(!canWrite)return;
  if(act==='settings'){settingsForm();return}
  if(act==='toggle-item'){var fi=findItem(id);if(fi){fi.item.got=!fi.item.got;commit();if(fi.item.got)toast(ui.tab!=='home'&&ui.filter==='need'?'Moved to Bought':'Bought · tap the item to log the price')}return}
  if(act==='toggle-task'){var tt=findTask(id);if(tt){tt.task.done=!tt.task.done;commit()}return}
  if(act==='new-item'){itemForm(null,b.getAttribute('data-sec'));return}
  if(act==='new-task'){taskForm(null,b.getAttribute('data-list'));return}
  if(act==='new-sec'){var ar=b.getAttribute('data-area');nameForm('New section','',ar==='baby'?'e.g. Toys':'e.g. Recovery',function(v){state.areas[ar].sections.push({id:uid('s'),name:v,items:[]})});return}
  if(act==='sec-menu'){var fs=findSec(id);if(!fs)return;var n=fs.sec.items.length;
    nameForm('Edit section',fs.sec.name,'',function(v,r){fs.sec.name=v;if(fs.area==='mom')fs.sec.bag=swVal(r,'n-bag')},
      function(){state.areas[fs.area].sections=state.areas[fs.area].sections.filter(function(s){return s!==fs.sec})},
      fs.area==='mom'?'<div class="fg">'+sw('n-bag',fs.sec.bag,'Part of hospital bag')+'</div>':'',n?'Delete section and '+n+' item'+(n>1?'s':'')+'?':null);return}
  if(act==='new-list'){nameForm('New list','','e.g. Before the birth',function(v){state.lists.push({id:uid('l'),name:v,tasks:[]})});return}
  if(act==='list-menu'){var l=findList(id);if(!l)return;var m=l.tasks.length;nameForm('Edit list',l.name,'',function(v){l.name=v},function(){state.lists=state.lists.filter(function(x){return x!==l})},'',m?'Delete list and '+m+' task'+(m>1?'s':'')+'?':null);return}
});
app.addEventListener('input',function(e){if(e.target.id==='q'){ui.q=e.target.value;keepUi();var s=$('#secs');if(s)s.innerHTML=sections(ui.tab)}});

/* ---------- boot ---------- */
if(!sb){render()}else{
  var c0=readCache();
  sb.auth.onAuthStateChange(function(ev,s){
    if(ev==='PASSWORD_RECOVERY'){recovering=true;session=s;state=null;setGate('newpass');return}
    if(ev==='SIGNED_OUT'){session=null;return}
    if(s)session=s;
  });
  sb.auth.getSession().then(function(r){
    session=r.data.session;
    if(!session){setGate(location.hash.indexOf('type=recovery')>=0?'newpass':'signin');return}
    if(c0&&c0.uid===session.user.id&&c0.data){openList(c0.listId,c0.role,c0.data,c0.pending)}
    loadList();
  });
}
if('serviceWorker' in navigator&&location.protocol==='https:'){
  // When a new release takes over, reload once so it shows straight away (unless something is being edited).
  var hadSW=!!navigator.serviceWorker.controller,reloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',function(){if(hadSW&&!reloaded&&!sheetEl){reloaded=true;flush();location.reload()}});
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(function(r){r.update()}).catch(function(){})});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')navigator.serviceWorker.getRegistration().then(function(r){if(r)r.update()})});
}
})();
