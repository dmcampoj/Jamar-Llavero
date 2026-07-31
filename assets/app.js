
/* ===== inline-script-3 ===== */
const DB=JSON.parse(document.getElementById('appdata').textContent);
const P=DB.P,S=DB.S; let LBL=DB.meta.lbl90;
const AGECOL=['#ffd166','#f6a623','#f5852a','#f2613f','#ef4444','#d92d3f','#b01030'];
const CATCOL=['#2f6bff','#12b5a8','#8b5cf6','#f39c12','#ef4d5a','#16a34a','#0ea5e9'];
document.getElementById('fs').textContent=DB.meta.fecha;
document.getElementById('fsc').textContent=DB.meta.nStores;
const fMoney=n=>{n=+n||0;const a=Math.abs(n);
  if(a>=1e9)return '$ '+(n/1e9).toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2})+' mil millones';
  if(a>=1e6)return '$ '+(n/1e6).toLocaleString('es-CO',{minimumFractionDigits:1,maximumFractionDigits:1})+' millones';
  if(a>=1e3)return '$ '+Math.round(n).toLocaleString('es-CO');return '$ '+Math.round(n).toLocaleString('es-CO');};
const fMoneyCOP=n=>'$ '+Math.round(toNum(n)).toLocaleString('es-CO');
const fInt=n=>(Number.isFinite(Number(n))?Number(n):0).toLocaleString('es-CO');
const esc=s=>(s==null?'':(''+s)).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const safeText=(v,fallback='—')=>v===undefined||v===null||String(v).trim()===''?fallback:String(v).trim();
function toNum(v){
  if(typeof v==='number')return Number.isFinite(v)?v:0;
  if(v===undefined||v===null||v==='')return 0;
  let x=String(v).trim().replace(/[$%\s]/g,'');
  if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(x))x=x.replace(/\./g,'').replace(',','.');
  else if(/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(x))x=x.replace(/,/g,'');
  else if(x.includes(',')&&!x.includes('.'))x=x.replace(',','.');
  const n=Number(x);return Number.isFinite(n)?n:0;
}
const safeCode=v=>safeText(v,'SIN-CODIGO');
let PRODUCT_NAME_CACHE={};
function rebuildProductNameCache(){
  PRODUCT_NAME_CACHE={};
  Object.entries(P||{}).forEach(([code,p])=>{if(p&&p.n)PRODUCT_NAME_CACHE[String(code)]=String(p.n);});
  Object.values(S||{}).forEach(st=>(st?.tr||[]).forEach(r=>{const code=safeCode(r?.[0]);if(r?.[1]&&!PRODUCT_NAME_CACHE[code])PRODUCT_NAME_CACHE[code]=String(r[1]);}));
}
function productInfo(code){
  const c=safeCode(code),raw=P?.[c]||{};
  return {n:safeText(raw.n||PRODUCT_NAME_CACHE[c],`Producto ${c}`),cat:safeText(raw.cat,'SIN CLASIFICAR'),lin:safeText(raw.lin,'SIN LÍNEA'),sub:safeText(raw.sub,'SIN SUBLÍNEA')};
}
function ageRankFromLabel(value){
  const t=safeText(value,'').toUpperCase().replace(/\s+/g,' ');if(!t||t==='SIN DEFINIR')return -1;if((t.includes('360')&&(t.includes('MAS')||t.includes('+')))||t.startsWith('+360'))return 6;
  const nums=(t.match(/\d+/g)||[]).map(Number),lo=nums[0]??-1;if(lo>=360)return 6;if(lo>=241)return 5;if(lo>=210)return 4;if(lo>=181)return 3;if(lo>=150)return 2;if(lo>=120)return 1;if(lo>=91)return 0;return -1;
}
function normalizeRotRows(st){return (Array.isArray(st?.rot)?st.rot:[]).map(r=>{
  const c=safeCode(r?.[0]),ageLabel=safeText(r?.[5],'SIN DEFINIR'),age=ageRankFromLabel(ageLabel),p=productInfo(c);
  const m1=toNum(r?.[6]),m2=toNum(r?.[7]),m3=toNum(r?.[8]);
  return {c,u:toNum(r?.[1]),aux:toNum(r?.[2]),age,val:toNum(r?.[3]),price:toNum(r?.[4]),ageLabel,m1,m2,m3,sales3m:m1+m2+m3,p};
});}
function normalizeEvacRows(st){return (Array.isArray(st?.evac)?st.evac:[]).map(r=>{
  const c=safeCode(r?.[0]),u=toNum(r?.[1]),v=toNum(r?.[2]),p=productInfo(c);
  return {c,u,v,cendis:toNum(r?.[3]),sales1:toNum(r?.[4]),sales2:toNum(r?.[5]),edad:safeText(r?.[6],'SIN DEFINIR'),p,active:u>0||v>0};
});}
function normalizeSalesRows(st){return (Array.isArray(st?.ventas)?st.ventas:[]).map(r=>({cat:safeText(r?.[0],'SIN CATEGORÍA'),lin:safeText(r?.[1],'SIN LÍNEA'),sub:safeText(r?.[2],'SIN SUBLÍNEA'),v:toNum(r?.[3]),u:toNum(r?.[4]),su:toNum(r?.[5]),sv:toNum(r?.[6])}));}
function normalizeProductSalesRows(st){
  if(Array.isArray(st?.ventasProducto)&&st.ventasProducto.length){return st.ventasProducto.map(r=>{const c=safeCode(r?.[0]);return {c,p:productInfo(c),v:toNum(r?.[1]),u:toNum(r?.[2]),su:toNum(r?.[3]),sv:toNum(r?.[4]),source:'VentasProducto'};});}
  return normalizeRotRows(st).map(r=>({c:r.c,p:r.p,v:r.sales3m*r.price,u:r.sales3m,su:r.u,sv:r.val,source:'Rotación'}));
}
function recalcOperationalKpis(st){
  st.kpi=st.kpi||{};const rot=normalizeRotRows(st),ev=normalizeEvacRows(st).filter(r=>r.active),sales=normalizeSalesRows(st),tr=Array.isArray(st.tr)?st.tr:[];
  Object.assign(st.kpi,{rotN:rot.length,rotU:rot.reduce((a,r)=>a+r.u,0),rotVal:rot.reduce((a,r)=>a+r.val,0),rotSin:rot.filter(r=>r.sales3m<=0).length,evacN:ev.length,evacU:ev.reduce((a,r)=>a+r.u,0),evacVal:ev.reduce((a,r)=>a+r.v,0),evacSR:ev.filter(r=>r.cendis<=0).length,vtot:sales.reduce((a,r)=>a+r.v,0),vU:sales.reduce((a,r)=>a+r.u,0),ncat:new Set(sales.map(r=>r.cat)).size,trN:tr.length,trU:tr.reduce((a,r)=>a+toNum(r?.[2]),0),trVol:tr.reduce((a,r)=>a+toNum(r?.[3]),0),trPick:tr.filter(r=>safeText(r?.[6],'')==='A').length,trMov:tr.filter(r=>safeText(r?.[7],'')==='A').length,trRev:tr.filter(r=>safeText(r?.[8],'')==='REVISAR').length});
  st.kpi.exhib=toNum(st.kpi.exhib);st.kpi.pres=toNum(st.kpi.pres);
}
function sanitizeCurrentDB(){rebuildProductNameCache();Object.values(S||{}).forEach(recalcOperationalKpis);}


const USER_SESSION_KEY='llavero_user_session_v3_21stores';
const STORE_CREDENTIALS={"ADM18":{"store":"18","pin":"Jm186281!","name":"Bucaramanga"},"ADMCV":{"store":"CV","pin":"JmCV3031!","name":"Cuatro Vientos"},"ADMH1":{"store":"H1","pin":"JmH11385!","name":"El Eden"},"ADMF8":{"store":"F8","pin":"JmF87676!","name":"Fabricato"},"ADMF6":{"store":"F6","pin":"JmF65128!","name":"Florida CC"},"ADM24":{"store":"24","pin":"Jm249800!","name":"Hiper Jamar"},"ADMH4":{"store":"H4","pin":"JmH42162!","name":"Jamar Cra 30"},"ADM84":{"store":"84","pin":"Jm846533!","name":"La Plazuela"},"ADMB9":{"store":"B9","pin":"JmB91255!","name":"Las Americas"},"ADMB8":{"store":"B8","pin":"JmB82153!","name":"Mayorca"},"ADMC6":{"store":"C6","pin":"JmC65094!","name":"Molinos"},"ADM55":{"store":"55","pin":"Jm551836!","name":"Monteria"},"ADM95":{"store":"95","pin":"Jm956718!","name":"Norte"},"ADMF7":{"store":"F7","pin":"JmF72454!","name":"Norte Bogota"},"ADM01":{"store":"01","pin":"Jm014208!","name":"Principal"},"ADM39":{"store":"39","pin":"Jm393713!","name":"Riohacha"},"ADM67":{"store":"67","pin":"Jm671845!","name":"San Felipe"},"ADM85":{"store":"85","pin":"Jm858691!","name":"Santa Marta"},"ADM65":{"store":"65","pin":"Jm655440!","name":"Sincelejo"},"ADM29":{"store":"29","pin":"Jm292748!","name":"Trinitarias"},"ADM45":{"store":"45","pin":"Jm454338!","name":"Valledupar"}};
const LEADER_USER='LIDER';
const LEADER_PIN_B64='SkFNQVIyMDI2';
function readAuthSession(){try{return JSON.parse(sessionStorage.getItem(USER_SESSION_KEY)||'null')||{role:'none'};}catch(e){return {role:'none'};}}
function saveAuthSession(value){try{sessionStorage.setItem(USER_SESSION_KEY,JSON.stringify(value));}catch(e){}}
function clearAuthSession(){try{sessionStorage.removeItem(USER_SESSION_KEY);}catch(e){}}
let AUTH=readAuthSession();
let IS_LEADER=AUTH.role==='leader';
let IS_ADMIN=AUTH.role==='admin';
function isAuthenticated(){return IS_LEADER||IS_ADMIN;}

const ORDER=['95','01','85'];   // Jamar Norte, Principal, Santa Marta
let KEYS=[];
function getStoreKeys(){return Object.keys(S).sort((a,b)=>{const ia=ORDER.indexOf(a),ib=ORDER.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib) || (S[a]?.name||a).localeCompare(S[b]?.name||b);});}
let CUR='';
let VIEW='resumen';
const state={inventario:{sort:'stock',dir:-1,q:'',f:'all'},prox:{sort:'units',dir:-1,q:'',f:'all',cat:'all',limit:300},rot:{sort:'age',dir:-1,q:'',f:'all'},evac:{sort:'pri',dir:1,q:'',f:'all'},tr:{sort:'st',dir:1,q:'',f:'all'},vta:{sort:'part',dir:-1,q:'',f:'all'},acciones:{sort:'fecha',dir:1,q:'',f:'all'}};

// store selector
const sel=document.getElementById('store');
function populateStoreSelect(preferred){
  KEYS=getStoreKeys(); sel.innerHTML='';
  const allowed=(IS_ADMIN&&AUTH.store&&S[AUTH.store])?[AUTH.store]:KEYS;
  allowed.forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=S[k]?.name||k;sel.appendChild(o);});
  if(IS_ADMIN&&AUTH.store&&S[AUTH.store])CUR=AUTH.store;
  else CUR=(preferred&&S[preferred])?preferred:(S[CUR]?CUR:allowed[0]);
  sel.value=CUR||'';
}
populateStoreSelect();
sel.addEventListener('change',()=>{if(!IS_LEADER)return;CUR=sel.value;state.prox.q=state.rot.q=state.evac.q=state.tr.q='';document.getElementById('gsearch').value='';if(VIEW==='dashboard'){VIEW='resumen';setActiveNav('resumen');}refresh();});
document.getElementById('gsearch').addEventListener('input',e=>{
  const v=e.target.value; state.inventario.q=state.prox.q=state.rot.q=state.evac.q=state.tr.q=v;
  if(VIEW==='inventario')drawInventario();else if(VIEW==='prox')drawProx();else if(VIEW==='rot')drawRot();else if(VIEW==='evac')drawEvac();else if(VIEW==='amb')drawTr();else{setView('inventario');setActiveNav('inventario');}
});

// nav
function setActiveNav(v){document.querySelectorAll('#nav a').forEach(x=>x.classList.toggle('on',x.dataset.v===v));}
document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>{
  if(!isAuthenticated()){openLeaderModal(true);return;}
  if(a.dataset.v==='dashboard'&&!IS_LEADER)return;
  setActiveNav(a.dataset.v);setView(a.dataset.v);document.getElementById('side').classList.remove('open');
}));

function ageMini(b){const mx=Math.max(...b,1);
  return '<span class="miniage">'+b.map((v,i)=>`<i style="height:${4+Math.round(14*v/mx)}px;background:${AGECOL[i]};opacity:${v?1:.2}" title="${LBL[i]} días: ${v}"></i>`).join('')+'</span>';}

/* ---- nav counts + sidebar footer + hero ---- */
function refresh(){
  const st=S[CUR]||{name:'Tienda sin datos',kpi:{},rot:[],evac:[],ventas:[],tr:[]},k=st.kpi||{};
  document.getElementById('fs').textContent=DB.meta.fecha||'—';
  document.getElementById('fsc').textContent=Object.keys(S).length;
  document.getElementById('fst').textContent=IS_LEADER&&VIEW==='dashboard'?'Todas las tiendas':safeText(st.name,'Tienda sin nombre');
  const invEl=document.getElementById('nc-inv');if(invEl)invEl.textContent=fInt((st.inventario||[]).filter(r=>toNum(r.stock)>0).length||k.stockRefs);
  const proxEl=document.getElementById('nc-prox');if(proxEl)proxEl.textContent=fInt(typeof upcomingRotationRows==='function'?upcomingRotationRows(st).length:0);
  document.getElementById('nc-rot').textContent=fInt(k.rotN);
  document.getElementById('nc-evac').textContent=fInt(k.evacN);
  document.getElementById('nc-amb').textContent=fInt(k.trN);
  const visibleActions=actionRows();const actCount=visibleActions.filter(a=>a.status!=='Completado').length;const actEl=document.getElementById('nc-act');if(actEl)actEl.textContent=fInt(actCount);
  const title=document.getElementById('heroTitle');
  if(title)title.textContent=IS_LEADER?'Hola, líder de área 👋':IS_ADMIN?`Hola, administrador de ${safeText(st.name,'tienda')} 👋`:'Bienvenido a Llavero';
  document.getElementById('heroSub').innerHTML=IS_LEADER&&VIEW==='dashboard'?`Visión consolidada de <b>${Object.keys(S).length} tiendas</b> · corte ${esc(safeText(DB.meta?.fecha,'—'))}`:`Gestión diaria de <b>${esc(safeText(st.name,'Tienda sin nombre'))}</b> · corte ${esc(safeText(DB.meta?.fecha,'—'))}`;
  setView(VIEW);
}
function setView(v){
  if(!isAuthenticated())return;
  if(v==='dashboard'&&!IS_LEADER)v='resumen';
  VIEW=v;
  const st=S[CUR]||{name:'Tienda sin datos',kpi:{},rot:[],evac:[],ventas:[],ventasProducto:[],inventario:[],tr:[]};
  const c=document.getElementById('content');
  try{
    if(v==='dashboard')c.innerHTML=viewLeaderDashboard();
    else if(v==='resumen')c.innerHTML=summaryHtml82(st);
    else if(v==='inventario'){c.innerHTML=viewInventario(st);drawInventario();}
    else if(v==='prox'){c.innerHTML=viewProx(st);drawProx();}
    else if(v==='rot'){c.innerHTML=viewRot(st);drawRot();}
    else if(v==='evac'){c.innerHTML=viewEvac(st);drawEvac();}
    else if(v==='amb'){c.innerHTML=viewAmb(st);drawTr();}
    else if(v==='vta'){c.innerHTML=viewVta(st);drawVta();}
    else if(v==='cli')c.innerHTML=viewCli(st);
    else if(v==='acciones'){c.innerHTML=viewAcciones();drawActions();}
    animateBars();
  }catch(err){
    console.error('Error al construir la vista',v,err);
    const technicalMessage=esc(err&&err.message?err.message:String(err||'Error desconocido'));
    c.innerHTML=`<div class="card viewErrorCard"><div class="chead"><div class="cnum n2">!</div><div><div class="tt">No fue posible mostrar esta vista</div><div class="ds">Se detectó un dato incompatible en ${esc(v)}.</div></div></div><div class="cbody"><div class="hint">⚠ <span>Actualiza la página. Si el inconveniente continúa, vuelve a cargar el último JSON válido.</span></div><details style="margin-top:10px"><summary style="cursor:pointer;font-size:11px;font-weight:800;color:var(--mut)">Ver detalle técnico</summary><code style="display:block;margin-top:8px;padding:10px;border-radius:8px;background:#f4f6f9;white-space:pre-wrap">${technicalMessage}</code></details></div></div>`;
  }
}

/* ---------------- INVENTARIO Y SEGUIMIENTO DIARIO ---------------- */
const LEGACY_HISTORY_KEY='appmin_inventory_history_v1';
const DAILY_HISTORY_KEY='appmin_daily_history_v2';
const DETAIL_HISTORY_KEY='appmin_daily_detail_v2';
function clampPct(v){return Math.max(0,Math.min(100,toNum(v)));}
function pctValue(v,total){return total>0?clampPct(v/total*100):0;}
function storeInventoryMetrics(st){
  const sales=normalizeSalesRows(st),k=st?.kpi||{};
  let totalVal=sales.reduce((a,r)=>a+r.sv,0),totalUnits=sales.reduce((a,r)=>a+r.su,0);
  const rotVal=toNum(k.rotVal),evacVal=toNum(k.evacVal);
  if(totalVal<=0)totalVal=Math.max(0,rotVal+evacVal);
  if(totalUnits<=0)totalUnits=Math.max(0,toNum(k.rotU)+toNum(k.evacU));
  const rotPct=pctValue(rotVal,totalVal),evacPct=pctValue(evacVal,totalVal),healthyPct=clampPct(100-rotPct-evacPct);
  return {totalVal,totalUnits,rotVal,evacVal,rotPct,evacPct,healthyPct};
}
function readStoredArray(key){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[];}catch(e){return [];}}
function saveStoredArray(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(e){console.warn('No se pudo guardar el histórico',e);toast('No fue posible guardar todo el histórico en este navegador','err');return false;}}
function compactStateRows(st,type){
  if(type==='rot')return normalizeRotRows(st).filter(r=>r.u>0||r.val>0).map(r=>[r.c,r.u,r.val,r.age]);
  return normalizeEvacRows(st).filter(r=>r.active).map(r=>[r.c,r.u,r.v,r.cendis]);
}
function transferFingerprint(r){return [safeCode(r?.[0]),safeText(r?.[4],''),safeText(r?.[5],''),toNum(r?.[2]),safeText(r?.[6],''),safeText(r?.[7],'')].join('|');}
function buildDetailedSnapshot(){
  const date=safeText(DB?.meta?.fecha,new Date().toISOString().slice(0,10)),stores={};
  getStoreKeys().forEach(code=>{
    const st=S[code]||{},inv=storeInventoryMetrics(st);
    const tr=(Array.isArray(st.tr)?st.tr:[]).map(r=>[transferFingerprint(r),toNum(r?.[2])]);
    const actions=Object.entries(ACTIONS||{}).filter(([,a])=>a?.store===code).map(([key,a])=>[key,safeText(a.status,'Pendiente'),safeText(a.date,'')]);
    stores[code]={name:safeText(st.name,code),inventory:inv.totalVal,inventoryUnits:inv.totalUnits,rot:compactStateRows(st,'rot'),evac:compactStateRows(st,'evac'),tr,actions};
  });
  return {date,stores};
}
function rowsAsMap(rows){
  const m={};(rows||[]).forEach(r=>{const c=safeCode(r?.[0]);if(!m[c])m[c]={u:0,v:0,age:-1,extra:0};m[c].u+=toNum(r?.[1]);m[c].v+=toNum(r?.[2]);m[c].age=Math.max(m[c].age,toNum(r?.[3]));});return m;
}
function compareStateRows(currentRows,previousRows){
  const cur=rowsAsMap(currentRows),prev=rowsAsMap(previousRows),ck=Object.keys(cur),pk=Object.keys(prev),cs=new Set(ck),ps=new Set(pk);
  const newCodes=ck.filter(c=>!ps.has(c)),recoveredCodes=pk.filter(c=>!cs.has(c)),persistentCodes=ck.filter(c=>ps.has(c));
  const sum=(map,codes,key='v')=>codes.reduce((a,c)=>a+toNum(map[c]?.[key]),0),previousVal=sum(prev,pk),currentVal=sum(cur,ck),newVal=sum(cur,newCodes),recoveredVal=sum(prev,recoveredCodes),den=previousVal+newVal;
  const reductionAdj=den>0?(den-currentVal)/den*100:(currentVal>0?-100:0);
  return {previousCount:pk.length,currentCount:ck.length,newCount:newCodes.length,recoveredCount:recoveredCodes.length,persistentCount:persistentCodes.length,previousVal,currentVal,newVal,recoveredVal,persistentVal:sum(cur,persistentCodes),reductionAdj};
}
function criticalRows(store){
  const m={};[['rot',store?.rot||[]],['evac',store?.evac||[]]].forEach(([,rows])=>(rows||[]).forEach(r=>{const c=safeCode(r?.[0]);if(!m[c])m[c]=[c,0,0,-1];m[c][1]+=toNum(r?.[1]);m[c][2]+=toNum(r?.[2]);m[c][3]=Math.max(m[c][3],toNum(r?.[3]));}));return Object.values(m);
}
function countMultiset(rows){const m={};(rows||[]).forEach(r=>{const k=safeText(r?.[0],'SIN-ID');m[k]=(m[k]||0)+1;});return m;}
function compareTransfers(currentRows,previousRows){
  const c=countMultiset(currentRows),p=countMultiset(previousRows),keys=new Set([...Object.keys(c),...Object.keys(p)]);let current=0,previous=0,resolved=0,added=0,persistent=0;
  keys.forEach(k=>{const cv=toNum(c[k]),pv=toNum(p[k]);current+=cv;previous+=pv;resolved+=Math.max(0,pv-cv);added+=Math.max(0,cv-pv);persistent+=Math.min(cv,pv);});
  return {current,previous,resolved,newCount:added,persistent,resolutionRate:previous>0?resolved/previous*100:(current===0?100:0)};
}
function compareActions(currentRows,previousRows){
  const cur=Object.fromEntries((currentRows||[]).map(r=>[r[0],{status:r[1],date:r[2]}])),prev=Object.fromEntries((previousRows||[]).map(r=>[r[0],{status:r[1],date:r[2]}]));
  const prevOpen=Object.keys(prev).filter(k=>prev[k].status!=='Completado'),resolved=prevOpen.filter(k=>cur[k]?.status==='Completado').length,currentOpen=Object.values(cur).filter(a=>a.status!=='Completado').length,blocked=Object.values(cur).filter(a=>a.status==='Bloqueado').length;
  const today=new Date();today.setHours(0,0,0,0);const late=Object.values(cur).filter(a=>a.status!=='Completado'&&a.date&&new Date(a.date+'T00:00:00')<today).length;
  return {previousOpen:prevOpen.length,currentOpen,resolved,blocked,late,resolutionRate:prevOpen.length?resolved/prevOpen.length*100:(currentOpen===0?100:0)};
}
function reductionScore(value){return clampPct(50+toNum(value));}
function baselineStateRows(currentRows){const cur=rowsAsMap(currentRows),keys=Object.keys(cur);return {previousCount:0,currentCount:keys.length,newCount:0,recoveredCount:0,persistentCount:0,previousVal:0,currentVal:keys.reduce((a,c)=>a+toNum(cur[c]?.v),0),newVal:0,recoveredVal:0,persistentVal:0,reductionAdj:null};}
function buildStoreDailySummary(current,previous){
  const hasPrevious=!!previous;
  const rot=hasPrevious?compareStateRows(current?.rot||[],previous?.rot||[]):baselineStateRows(current?.rot||[]),evac=hasPrevious?compareStateRows(current?.evac||[],previous?.evac||[]):baselineStateRows(current?.evac||[]),critical=hasPrevious?compareStateRows(criticalRows(current),criticalRows(previous)):baselineStateRows(criticalRows(current));
  const rot360=hasPrevious?compareStateRows((current?.rot||[]).filter(r=>toNum(r?.[3])>=6),(previous?.rot||[]).filter(r=>toNum(r?.[3])>=6)):baselineStateRows((current?.rot||[]).filter(r=>toNum(r?.[3])>=6));
  const transfers=hasPrevious?compareTransfers(current?.tr||[],previous?.tr||[]):{current:(current?.tr||[]).length,previous:0,resolved:0,newCount:0,persistent:0,resolutionRate:null},actions=hasPrevious?compareActions(current?.actions||[],previous?.actions||[]):{previousOpen:0,currentOpen:(current?.actions||[]).filter(r=>r?.[1]!=='Completado').length,resolved:0,blocked:(current?.actions||[]).filter(r=>r?.[1]==='Bloqueado').length,late:0,resolutionRate:null};
  const newCriticalPct=current?.inventory>0?critical.newVal/current.inventory*100:0,entryScore=100-clampPct(newCriticalPct*5);
  const executionParts=[];if(transfers.previous>0||transfers.current===0)executionParts.push(transfers.resolutionRate);if(actions.previousOpen>0||actions.currentOpen===0)executionParts.push(actions.resolutionRate);const executionScore=executionParts.length?executionParts.reduce((a,v)=>a+v,0)/executionParts.length:100;
  const score=hasPrevious?Math.round(reductionScore(evac.reductionAdj)*.30+reductionScore(rot.reductionAdj)*.25+reductionScore(rot360.reductionAdj)*.20+entryScore*.15+executionScore*.10):null;
  const inv=toNum(current?.inventory),rotVal=rot.currentVal,evacVal=evac.currentVal;
  return {name:safeText(current?.name,'Tienda'),inventory:inv,inventoryUnits:toNum(current?.inventoryUnits),rotVal,evacVal,rotPct:pctValue(rotVal,inv),evacPct:pctValue(evacVal,inv),rot,evac,critical,rot360,transfers,actions,newCriticalPct,executionScore,score,hasPrevious};
}
function legacyDailyHistory(){
  return readStoredArray(LEGACY_HISTORY_KEY).map(s=>({date:s.date,legacy:true,stores:Object.fromEntries(Object.entries(s.stores||{}).map(([code,x])=>[code,{name:x.name,inventory:toNum(x.inventory),rotVal:toNum(x.rotVal),evacVal:toNum(x.evacVal),rotPct:toNum(x.rotPct),evacPct:toNum(x.evacPct),score:null,hasPrevious:false}]))}));
}
function readDailyHistory(){
  const modern=readStoredArray(DAILY_HISTORY_KEY),by={};[...legacyDailyHistory(),...modern].forEach(x=>{if(x?.date)by[x.date]=x;});return Object.values(by).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}
function readDetailHistory(){return readStoredArray(DETAIL_HISTORY_KEY).sort((a,b)=>String(a.date).localeCompare(String(b.date)));}
function recordOperationalSnapshot(){
  if(!Object.keys(S||{}).length)return;
  const current=buildDetailedSnapshot(),details=readDetailHistory(),previous=[...details].filter(x=>String(x.date)<String(current.date)).pop()||null,stores={};
  Object.keys(current.stores).forEach(code=>stores[code]=buildStoreDailySummary(current.stores[code],previous?.stores?.[code]));
  const summary={date:current.date,stores,hasPrevious:!!previous,previousDate:previous?.date||null};
  const modern=readStoredArray(DAILY_HISTORY_KEY).filter(x=>x?.date!==current.date);modern.push(summary);modern.sort((a,b)=>String(a.date).localeCompare(String(b.date)));saveStoredArray(DAILY_HISTORY_KEY,modern.slice(-120));
  const nextDetails=details.filter(x=>x?.date!==current.date);nextDetails.push(current);nextDetails.sort((a,b)=>String(a.date).localeCompare(String(b.date)));saveStoredArray(DETAIL_HISTORY_KEY,nextDetails.slice(-3));
}
function currentDailySummary(){const h=readDailyHistory(),date=safeText(DB?.meta?.fecha,'');return h.find(x=>x.date===date)||h[h.length-1]||null;}
function previousSnapshot(){const h=readDailyHistory(),date=safeText(DB?.meta?.fecha,''),prior=h.filter(x=>String(x.date)<String(date));return prior[prior.length-1]||null;}
function deltaBadge(value){const v=toNum(value),cls=Math.abs(v)<.05?'deltaFlat':v>0?'deltaUp':'deltaDown',arrow=Math.abs(v)<.05?'→':v>0?'↑':'↓';return `<span class="${cls}">${arrow} ${Math.abs(v).toFixed(1)} pp</span>`;}
function performanceBadge(value,suffix='%'){if(value===null||value===undefined||!Number.isFinite(Number(value)))return '<span class="perfFlat">—</span>';const v=toNum(value),cls=Math.abs(v)<.05?'perfFlat':v>0?'perfGood':'perfBad',arrow=Math.abs(v)<.05?'→':v>0?'↑':'↓';return `<span class="${cls}">${arrow} ${Math.abs(v).toFixed(1)}${suffix}</span>`;}
function managementStatus(score){if(score===null||score===undefined)return '<span class="dailyStatus base">Línea base</span>';return score>=65?'<span class="dailyStatus good">Mejora</span>':score<45?'<span class="dailyStatus bad">Deterioro</span>':'<span class="dailyStatus mid">Estable</span>';}
function scoreColor(score){return score>=65?'var(--ok)':score<45?'var(--bad)':'var(--rot)';}
function donutCard(label,pct,amount,color,sub){return `<div class="donutCard"><div class="donut" style="--p:${clampPct(pct).toFixed(1)};--c:${color}"><b>${clampPct(pct).toFixed(1)}%</b></div><div class="donutInfo"><div class="dLabel">${label}</div><div class="dValue currencyValue">${amount}</div><div class="dSub">${sub}</div></div></div>`;}
function inventoryOverview(st,networkLabel='Inventario total de la tienda'){
  const m=storeInventoryMetrics(st);
  return `<div class="measureHeading"><div><b>Composición por valor del inventario</b><span>Los porcentajes y valores se calculan en pesos colombianos (COP).</span></div><span class="measureBadge">VALOR $</span></div><div class="inventoryOverview"><div class="inventoryTotal"><div class="itLabel">${networkLabel} · COP</div><div class="itValue currencyValue">${fMoneyCOP(m.totalVal)}</div><div class="itSub">${fInt(m.totalUnits)} unidades registradas<div class="stackedInventory" title="Distribución por valor del inventario"><span class="stackRot" style="width:${m.rotPct}%"></span><span class="stackEvac" style="width:${m.evacPct}%"></span><span class="stackHealthy" style="width:${m.healthyPct}%"></span></div></div></div>${donutCard('Valor en rotación',m.rotPct,fMoneyCOP(m.rotVal),'var(--rot)','Porcentaje sobre el valor total en COP')}${donutCard('Valor en evacuación',m.evacPct,fMoneyCOP(m.evacVal),'var(--evac)','Porcentaje sobre el valor total en COP')}${donutCard('Valor en otros estados',m.healthyPct,fMoneyCOP(Math.max(0,m.totalVal-m.rotVal-m.evacVal)),'var(--ok)','Valor fuera de Rotación y Evacuación')}</div>`;
}

function productInventoryOverview(st){
  const k=st?.kpi||{};
  const stockRows=normalizeProductSalesRows(st).filter(r=>toNum(r.su)>0||toNum(r.sv)>0);
  const stockSet=new Set(stockRows.map(r=>safeCode(r.c)).filter(Boolean));
  const rotSet=new Set(normalizeRotRows(st).filter(r=>toNum(r.u)>0||toNum(r.val)>0).map(r=>safeCode(r.c)).filter(Boolean));
  const evacSet=new Set(normalizeEvacRows(st).filter(r=>r.active).map(r=>safeCode(r.c)).filter(Boolean));
  let total=stockSet.size||Math.max(0,toNum(k.stockRefs));
  let rot=rotSet.size||Math.max(0,toNum(k.rotN));
  let evac=evacSet.size||Math.max(0,toNum(k.evacN));
  if(total<=0)total=Math.max(1,new Set([...rotSet,...evacSet]).size||rot+evac);
  rot=Math.min(total,rot);
  evac=Math.min(Math.max(0,total-rot),evac);
  const other=Math.max(0,total-rot-evac);
  const rotPct=pctValue(rot,total),evacPct=pctValue(evac,total),otherPct=clampPct(100-rotPct-evacPct);
  const rotEnd=rotPct.toFixed(1)+'%';
  const evacEnd=clampPct(rotPct+evacPct).toFixed(1)+'%';
  return `<div class="productInventoryCard">
    <div class="productInventoryIntro">
      <div class="productRing" style="--rotEnd:${rotEnd};--evacEnd:${evacEnd}">
        <div class="productRingCenter"><b>${fInt(total)}</b><span>productos</span></div>
      </div>
      <div><div class="productInventoryTitle">Composición por cantidad de referencias (SKU)</div><div class="productInventorySub">Este bloque cuenta códigos de producto con inventario; no suma valores en pesos.</div></div>
    </div>
    <div class="productInventoryLegend">
      <div class="productLegendItem"><div class="productLegendTop"><span class="productDot" style="background:var(--rot)"></span>Rotación</div><div class="productLegendValue">${rotPct.toFixed(1)}%</div><div class="productLegendMeta">${fInt(rot)} de ${fInt(total)} productos</div></div>
      <div class="productLegendItem"><div class="productLegendTop"><span class="productDot" style="background:var(--evac)"></span>Evacuación</div><div class="productLegendValue">${evacPct.toFixed(1)}%</div><div class="productLegendMeta">${fInt(evac)} de ${fInt(total)} productos</div></div>
      <div class="productLegendItem"><div class="productLegendTop"><span class="productDot" style="background:#9b9da3"></span>Otros estados</div><div class="productLegendValue">${otherPct.toFixed(1)}%</div><div class="productLegendMeta">${fInt(other)} de ${fInt(total)} productos</div></div>
    </div>
    <div class="productInventoryNote">El porcentaje se calcula sobre la cantidad de referencias con stock. Por eso puede ser diferente al porcentaje calculado por valor monetario: una referencia costosa pesa más en el bloque superior, pero cuenta como una sola referencia en este bloque.</div>
  </div>`;
}

function rankChart(rows,key,color){const top=[...rows].sort((a,b)=>b[key]-a[key]).slice(0,10),max=Math.max(1,...top.map(x=>x[key]));return `<div class="rankChart">${top.map((r,i)=>`<div class="rankRow" onclick="openStoreAudit59(${JSON.stringify(r.code)})" title="Ver detalle de ${esc(r.name)}"><div class="rankName" title="${esc(r.name)}">${i+1}. ${esc(r.name)}</div><div class="rankTrack"><div class="rankFill" style="width:${Math.max(1,r[key]/max*100)}%;background:${color}"></div></div><div class="rankValue">${r[key].toFixed(1)}%</div></div>`).join('')||'<div class="empty">Sin datos.</div>'}</div>`;}
function scoreRankChart(rows,best=true){const valid=rows.filter(r=>r.score!==null&&r.score!==undefined&&Number.isFinite(Number(r.score))),top=[...valid].sort((a,b)=>best?b.score-a.score:a.score-b.score).slice(0,10);return `<div class="rankChart">${top.map((r,i)=>`<div class="rankRow" onclick="openStoreAudit59(${JSON.stringify(r.code)})" title="Ver detalle de ${esc(r.name)}"><div class="rankName" title="${esc(r.name)}">${i+1}. ${esc(r.name)}</div><div class="rankTrack"><div class="rankFill" style="width:${Math.max(2,r.score)}%;background:${scoreColor(r.score)}"></div></div><div class="rankValue">${r.score}/100</div></div>`).join('')||'<div class="empty">Se requieren al menos dos cortes diarios para construir este ranking.</div>'}</div>`;}
function networkTrendData(){return readDailyHistory().map(snap=>{let inv=0,rot=0,evac=0;Object.values(snap.stores||{}).forEach(x=>{inv+=toNum(x.inventory);rot+=toNum(x.rotVal);evac+=toNum(x.evacVal);});return {date:snap.date,rotPct:pctValue(rot,inv),evacPct:pctValue(evac,inv)};});}
function networkManagementTrendData(){const data=readDailyHistory().map((snap,i,arr)=>{let rp=0,rn=0,ep=0,en=0;Object.values(snap.stores||{}).forEach(x=>{if(x.rot){rp+=toNum(x.rot.previousVal)+toNum(x.rot.newVal);rn+=toNum(x.rot.currentVal);}if(x.evac){ep+=toNum(x.evac.previousVal)+toNum(x.evac.newVal);en+=toNum(x.evac.currentVal);}});const prev=arr[i-1]||null,prevVals=prev?networkTrendData().find(d=>d.date===prev.date):null,currVals=networkTrendData().find(d=>d.date===snap.date);return {date:snap.date,rotRecovery:rp>0?(rp-rn)/rp*100:null,evacRecovery:ep>0?(ep-en)/ep*100:null,isBase:!prev,rotPct:currVals?currVals.rotPct:null,evacPct:currVals?currVals.evacPct:null,baseDate:arr[0]?.date||snap.date};}).filter(x=>x.rotRecovery!==null||x.evacRecovery!==null||x.isBase);return data;}
function trendSvg(data){
  if(data.length<2)return '<div class="empty">Aún existe una sola carga. La tendencia aparecerá con una fecha de corte posterior.</div>';
  const W=760,H=210,pad={l:42,r:18,t:18,b:35},max=Math.max(10,...data.flatMap(d=>[d.rotPct,d.evacPct])),x=i=>pad.l+(W-pad.l-pad.r)*(data.length===1?.5:i/(data.length-1)),y=v=>pad.t+(H-pad.t-pad.b)*(1-v/max),path=k=>data.map((d,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(d[k]).toFixed(1)).join(' '),labelStep=Math.max(1,Math.ceil(data.length/8));
  const grid=[0,.25,.5,.75,1].map(q=>{const val=max*q,yy=y(val);return `<line x1="${pad.l}" y1="${yy}" x2="${W-pad.r}" y2="${yy}" stroke="var(--line2)"/><text x="${pad.l-7}" y="${yy+4}" text-anchor="end" font-size="10" fill="var(--mut)">${val.toFixed(0)}%</text>`;}).join('');
  const labels=data.map((d,i)=>((i===0||i===data.length-1||i%labelStep===0)?`<text x="${x(i)}" y="${H-10}" text-anchor="middle" font-size="10" fill="var(--mut)">${esc(String(d.date).slice(5))}</text>`:'')).join(''),dots=(k,c)=>data.map((d,i)=>`<g onclick="openTrendPoint59(${JSON.stringify(d.date)},'exposure')" style="cursor:pointer"><circle cx="${x(i)}" cy="${y(d[k])}" r="4" fill="${c}"></circle><title>${d.date}: ${d[k].toFixed(1)}%</title></g>`).join('');
  return `<div class="trendWrap"><svg class="trendSvg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${grid}<path d="${path('rotPct')}" fill="none" stroke="var(--rot)" stroke-width="3"/>${dots('rotPct','var(--rot)')}<path d="${path('evacPct')}" fill="none" stroke="var(--evac)" stroke-width="3"/>${dots('evacPct','var(--evac)')}${labels}</svg></div><div class="trendLegend"><span><i style="background:var(--rot)"></i>Exposición Rotación</span><span><i style="background:var(--evac)"></i>Exposición Evacuación</span></div>`;
}
function managementTrendSvg(data){
  if(!data.length)return '<div class="empty">El primer comparativo se generará cuando se cargue el segundo corte diario.</div>';
  const W=760,H=220,pad={l:48,r:18,t:18,b:35},vals=data.flatMap(d=>[d.rotRecovery,d.evacRecovery]).filter(v=>v!==null&&Number.isFinite(v)),lo=Math.min(-10,...vals),hi=Math.max(10,...vals),range=hi-lo||1,x=i=>pad.l+(W-pad.l-pad.r)*(data.length===1?.5:i/(data.length-1)),y=v=>pad.t+(H-pad.t-pad.b)*(hi-v)/range,labelStep=Math.max(1,Math.ceil(data.length/8));
  const line=k=>data.map((d,i)=>d[k]===null?'':`${i?'L':'M'}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join(' '),zero=y(0),grid=[lo,(lo+hi)/2,hi].map(v=>`<line x1="${pad.l}" y1="${y(v)}" x2="${W-pad.r}" y2="${y(v)}" stroke="var(--line2)"/><text x="${pad.l-7}" y="${y(v)+4}" text-anchor="end" font-size="10" fill="var(--mut)">${v.toFixed(0)}%</text>`).join('');
  const labels=data.map((d,i)=>((i===0||i===data.length-1||i%labelStep===0)?`<text x="${x(i)}" y="${H-10}" text-anchor="middle" font-size="10" fill="var(--mut)">${esc(String(d.date).slice(5))}</text>`:'')).join(''),dots=(k,c)=>data.filter(d=>d[k]!==null).map(d=>{const i=data.indexOf(d);return `<g onclick="openTrendPoint59(${JSON.stringify(d.date)},'management')" style="cursor:pointer"><circle cx="${x(i)}" cy="${y(d[k])}" r="4" fill="${c}"></circle><title>${d.date}: ${d.isBase?'Base':d[k].toFixed(1)+'%'} </title></g>`;}).join('');
  return `<div class="trendWrap"><svg class="trendSvg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${grid}<line x1="${pad.l}" y1="${zero}" x2="${W-pad.r}" y2="${zero}" stroke="var(--mut)" stroke-dasharray="4 4"/><path d="${line('rotRecovery')}" fill="none" stroke="var(--rot)" stroke-width="3"/>${dots('rotRecovery','var(--rot)')}<path d="${line('evacRecovery')}" fill="none" stroke="var(--evac)" stroke-width="3"/>${dots('evacRecovery','var(--evac)')}${labels}</svg></div><div class="trendLegend"><span><i style="background:var(--rot)"></i>Reducción ajustada Rotación</span><span><i style="background:var(--evac)"></i>Reducción ajustada Evacuación</span></div><div class="dashboardNote">Valores positivos representan mejora; valores negativos representan deterioro frente al corte anterior. Haz clic en cada punto para ver el corte base, el actual y sus porcentajes.</div>`;
}
function dailyMetric(label,value,sub,cls=''){return `<div class="dailyMetric ${cls}"><div class="dmLabel">${label}</div><div class="dmValue">${value}</div><div class="dmSub">${sub}</div></div>`;}
function storeDailyManagementPanel(code){
  const snap=currentDailySummary(),m=snap?.stores?.[code];if(!m)return '';
  if(!m.hasPrevious)return `<div class="card"><div class="chead"><div class="cnum n3">D</div><div><div class="tt">Seguimiento diario de gestión</div><div class="ds">Comparación por tienda y código de producto</div></div><div class="rt">${managementStatus(null)}</div></div><div class="cbody"><div class="baselineBox"><b>Este corte es la línea base</b>Al cargar la información del día siguiente aparecerán productos gestionados, persistentes, nuevos y la reducción ajustada de Rotación y Evacuación.</div><div class="dashboardNote">“Gestionado” significa que el producto dejó de aparecer en el estado crítico; no implica que haya sido vendido.</div></div></div>`;
  const s=m.score,color=scoreColor(s);
  return `<div class="card"><div class="chead"><div class="cnum n3">D</div><div><div class="tt">Seguimiento diario de gestión</div><div class="ds">Resultado frente al corte ${esc(snap.previousDate||'anterior')}</div></div><div class="rt">${managementStatus(s)}</div></div><div class="cbody"><div class="managementHero"><div class="scoreRing" style="--score:${s};--scoreColor:${color}"><strong>${s}</strong><small>DE 100</small></div><div class="managementExplain"><b>Índice de gestión del inventario.</b> Combina reducción ajustada de Evacuación y Rotación, evolución de referencias +360 días, ingreso de nuevos productos críticos y cumplimiento de traslados/acciones. Las ventas no forman parte de esta evaluación.</div></div><div class="dailyGrid">${dailyMetric('Gestionados',fInt(m.critical.recoveredCount),`${fMoney(m.critical.recoveredVal)} dejaron el estado crítico`,'metricPositive')}${dailyMetric('Persistentes',fInt(m.critical.persistentCount),`${fMoney(m.critical.persistentVal)} continúan críticos`)}${dailyMetric('Nuevos críticos',fInt(m.critical.newCount),`${fMoney(m.critical.newVal)} ingresaron al estado`,m.critical.newCount?'metricNegative':'metricPositive')}${dailyMetric('Rotación · reducción',performanceBadge(m.rot.reductionAdj),`${fInt(m.rot.recoveredCount)} gestionados · ${fInt(m.rot.newCount)} nuevos`)}${dailyMetric('Evacuación · reducción',performanceBadge(m.evac.reductionAdj),`${fInt(m.evac.recoveredCount)} gestionados · ${fInt(m.evac.newCount)} nuevos`)}${dailyMetric('+360 días',performanceBadge(m.rot360.reductionAdj),`${fInt(m.rot360.currentCount)} referencias actuales`)}${dailyMetric('Traslados resueltos',fInt(m.transfers.resolved),`${fInt(m.transfers.current)} siguen pendientes`)}${dailyMetric('Acciones cerradas',fInt(m.actions.resolved),`${fInt(m.actions.currentOpen)} abiertas · ${fInt(m.actions.late)} vencidas`)}</div><div class="dashboardNote">La reducción no confirma una venta. Solo demuestra que el inventario o la referencia cambió entre los dos cortes.</div></div></div>`;
}

/* ---------------- DASHBOARD GENERAL DEL LÍDER ---------------- */
function daysLate(date,status){if(!date||status==='Completado')return 0;const d=new Date(date+'T00:00:00'),t=new Date();t.setHours(0,0,0,0);return Math.max(0,Math.floor((t-d)/86400000));}
function leaderStoreMetrics(){
  const current=currentDailySummary(),prev=previousSnapshot();
  return getStoreKeys().map(code=>{
    const st=S[code]||{},k=st.kpi||{},inv=storeInventoryMetrics(st),d=current?.stores?.[code],p=prev?.stores?.[code];
    return {code,name:safeText(st.name,code),inventory:inv.totalVal,inventoryUnits:inv.totalUnits,rotVal:toNum(k.rotVal),rotPct:inv.rotPct,rotDelta:p?inv.rotPct-toNum(p.rotPct):0,evacVal:toNum(k.evacVal),evacPct:inv.evacPct,evacDelta:p?inv.evacPct-toNum(p.evacPct):0,evacSR:toNum(k.evacSR),trN:toNum(k.trN),trRev:toNum(k.trRev),rot360:normalizeRotRows(st).filter(r=>r.age>=6).length,score:d?.score??null,hasPrevious:!!d?.hasPrevious,rotReduction:d?.rot?.reductionAdj??null,evacReduction:d?.evac?.reductionAdj??null,recovered:d?.critical?.recoveredCount||0,recoveredVal:d?.critical?.recoveredVal||0,newCritical:d?.critical?.newCount||0,newCriticalVal:d?.critical?.newVal||0,persistent:d?.critical?.persistentCount||0,persistentVal:d?.critical?.persistentVal||0,age360Reduction:d?.rot360?.reductionAdj??null,age360Recovered:d?.rot360?.recoveredCount||0,transfersResolved:d?.transfers?.resolved||0,actionsResolved:d?.actions?.resolved||0,actionsOpen:d?.actions?.currentOpen||0,late:d?.actions?.late||0};
  });
}
function healthClass(s){return s>=65?'healthGood':s>=45?'healthMid':'healthBad';}
function openStoreDashboard(code,view='resumen'){if(!IS_LEADER||!S[code])return;CUR=code;sel.value=code;VIEW=view;setActiveNav(view);refresh();}
function leaderKpi(icon,label,value,sub){return `<div class="leaderKpi"><div class="lkTop"><div class="lkIcon">${icon}</div></div><div class="lkLabel">${label}</div><div class="lkValue">${value}</div><div class="lkSub">${sub}</div></div>`;}
function exportDailyHistoryCSV(){
  if(!requireLeader())return;const rows=[['Fecha','Tienda','Índice','Inventario','% Rotación','% Evacuación','Reducción Rotación','Reducción Evacuación','Gestionados','Nuevos críticos','Persistentes','Gestionados +360','Traslados resueltos','Acciones cerradas','Acciones abiertas']];
  readDailyHistory().forEach(s=>Object.entries(s.stores||{}).forEach(([code,m])=>rows.push([s.date,m.name||code,m.score??'',m.inventory||0,m.rotPct||0,m.evacPct||0,m.rot?.reductionAdj??'',m.evac?.reductionAdj??'',m.critical?.recoveredCount??'',m.critical?.newCount??'',m.critical?.persistentCount??'',m.rot360?.recoveredCount??'',m.transfers?.resolved??'',m.actions?.resolved??'',m.actions?.currentOpen??''])));csvDownload(rows,`Llavero_historial_diario_${safeText(DB.meta?.fecha,'corte')}.csv`);
}
function viewLeaderDashboard(){
  const ms=leaderStoreMetrics(),trend=networkTrendData(),managementTrend=networkManagementTrendData(),snap=currentDailySummary(),prev=previousSnapshot(),sum=k=>ms.reduce((a,r)=>a+toNum(r[k]),0),inventory=sum('inventory'),rotPct=pctValue(sum('rotVal'),inventory),evacPct=pctValue(sum('evacVal'),inventory),valid=ms.filter(r=>r.score!==null&&r.score!==undefined&&Number.isFinite(Number(r.score))),avgScore=valid.length?Math.round(valid.reduce((a,r)=>a+r.score,0)/valid.length):null;
  const best=[...valid].sort((a,b)=>b.score-a.score),worst=[...valid].sort((a,b)=>a.score-b.score),risk=valid.length?worst:[...ms].sort((a,b)=>(b.rotPct+b.evacPct)-(a.rotPct+a.evacPct));
  const tableRows=[...ms].sort((a,b)=>(a.score===null)-(b.score===null)||(a.score??999)-(b.score??999)).map(r=>[`<b>${esc(r.name)}</b>`,r.score===null?'<span class="dailyStatus base">Base</span>':`<span class="healthBadge ${healthClass(r.score)}">${r.score}</span>`,fMoney(r.inventory),`${r.rotPct.toFixed(1)}%`,`${r.evacPct.toFixed(1)}%`,performanceBadge(r.rotReduction),performanceBadge(r.evacReduction),fInt(r.recovered),fInt(r.newCritical),fInt(r.persistent),fInt(r.transfersResolved),`<button class="storeDrill" onclick="openStoreDashboard('${esc(r.code)}')">Ver</button>`]);
  const alerts=risk.slice(0,4).map(r=>`<div class="alertItem"><div class="aiIcon">⚠</div><div><b>${esc(r.name)} · ${r.score===null?'sin comparativo':'índice '+r.score}</b><span>${r.score===null?`${r.rotPct.toFixed(1)}% Rotación · ${r.evacPct.toFixed(1)}% Evacuación`:`${performanceBadge(r.rotReduction)} Rotación · ${performanceBadge(r.evacReduction)} Evacuación · ${fInt(r.newCritical)} nuevos críticos`}</span></div></div>`).join('');
  const dailyRows=[...ms].sort((a,b)=>(b.recovered-a.recovered)||(a.newCritical-b.newCritical)).map(r=>`<tr class="clickableRow" onclick="openStoreAudit59(${JSON.stringify(r.code)})"><td><b>${esc(r.name)}</b></td><td class="num">${r.score??'—'}</td><td class="num">${performanceBadge(r.rotReduction)}</td><td class="num">${performanceBadge(r.evacReduction)}</td><td class="num perfGood">${fInt(r.recovered)}</td><td class="num perfBad">${fInt(r.newCritical)}</td><td class="num">${fInt(r.persistent)}</td><td class="num">${fInt(r.age360Recovered)}</td><td class="num">${fInt(r.transfersResolved)}</td></tr>`).join('');
  return `<div class="hint" style="margin-bottom:18px">📅 <span><b>Seguimiento diario:</b> cada fecha de carga se guarda como un corte. Los resultados comparan tienda + código contra el día anterior, sin atribuir las salidas a ventas.</span><button class="actionBtn historyAction" onclick="exportDailyHistoryCSV()">⬇ Exportar historial</button></div>
  <div class="leaderKpis">
    ${leaderKpi('🏬','Tiendas monitoreadas',fInt(ms.length),`${fInt(valid.length)} con comparación diaria`)}
    ${leaderKpi('📦','Inventario total red',fMoney(inventory),`${fInt(sum('inventoryUnits'))} unidades registradas`)}
    ${leaderKpi('⟳','Exposición en rotación',rotPct.toFixed(1)+'%',`${fMoney(sum('rotVal'))} del inventario total`)}
    ${leaderKpi('⇲','Exposición en evacuación',evacPct.toFixed(1)+'%',`${fMoney(sum('evacVal'))} del inventario total`)}
    ${leaderKpi('✅','Productos gestionados',fInt(sum('recovered')),`${fMoney(sum('recoveredVal'))} dejaron el estado crítico`)}
    ${leaderKpi('🆕','Nuevos productos críticos',fInt(sum('newCritical')),`${fMoney(sum('newCriticalVal'))} ingresaron al estado`)}
    ${leaderKpi('⏳','Productos persistentes',fInt(sum('persistent')),`${fMoney(sum('persistentVal'))} continúan críticos`)}
    ${leaderKpi('★','Índice promedio de gestión',avgScore===null?'Línea base':avgScore+'/100',avgScore===null?'Disponible desde el segundo corte':'Ventas excluidas del cálculo')}
  </div>
  <div class="measureHeading"><div><b>Composición consolidada por valor</b><span>Valores completos en pesos colombianos (COP).</span></div><span class="measureBadge">VALOR $</span></div><div class="inventoryOverview"><div class="inventoryTotal"><div class="itLabel">Inventario consolidado · COP</div><div class="itValue currencyValue">${fMoneyCOP(inventory)}</div><div class="itSub">Corte ${esc(safeText(DB.meta?.fecha,'—'))}<div class="stackedInventory"><span class="stackRot" style="width:${rotPct}%"></span><span class="stackEvac" style="width:${evacPct}%"></span><span class="stackHealthy" style="width:${clampPct(100-rotPct-evacPct)}%"></span></div></div></div>${donutCard('Valor en rotación',rotPct,fMoneyCOP(sum('rotVal')),'var(--rot)','Exposición actual por valor')}${donutCard('Valor en evacuación',evacPct,fMoneyCOP(sum('evacVal')),'var(--evac)','Exposición actual por valor')}${donutCard('Valor en otros estados',clampPct(100-rotPct-evacPct),fMoneyCOP(Math.max(0,inventory-sum('rotVal')-sum('evacVal'))),'var(--ok)','Fuera de ambos estados')}</div>
  <div class="chartPair"><div class="card"><div class="chead"><div class="cnum n1">⟳</div><div><div class="tt">Mayor exposición en Rotación</div><div class="ds">Dónde está concentrado el problema actualmente</div></div></div><div class="cbody">${rankChart(ms,'rotPct','var(--rot)')}</div></div><div class="card"><div class="chead"><div class="cnum n2">⇲</div><div><div class="tt">Mayor exposición en Evacuación</div><div class="ds">Dónde está concentrado el problema actualmente</div></div></div><div class="cbody">${rankChart(ms,'evacPct','var(--evac)')}</div></div></div>
  <div class="chartPair"><div class="card"><div class="chead"><div class="cnum n3">↑</div><div><div class="tt">Tiendas con mayor mejora</div><div class="ds">Mejor índice de gestión frente al corte anterior</div></div></div><div class="cbody">${scoreRankChart(ms,true)}</div></div><div class="card"><div class="chead"><div class="cnum n2">↓</div><div><div class="tt">Tiendas con mayor deterioro</div><div class="ds">Menor índice de gestión frente al corte anterior</div></div></div><div class="cbody">${scoreRankChart(ms,false)}</div></div></div>
  <div class="chartPair"><div class="card"><div class="chead"><div class="cnum n3">↗</div><div><div class="tt">Tendencia de exposición</div><div class="ds">Porcentaje del inventario actualmente en cada estado</div></div><div class="rt"><span class="badge ${trend.length>1?'cool':'mut'}">${trend.length} cortes</span></div></div><div class="cbody">${trendSvg(trend)}</div></div><div class="card"><div class="chead"><div class="cnum n4">✓</div><div><div class="tt">Tendencia de gestión diaria</div><div class="ds">Reducción ajustada frente al día anterior</div></div></div><div class="cbody">${managementTrendSvg(managementTrend)}</div></div></div>
  <div class="card"><div class="chead"><div class="cnum n4">D</div><div><div class="tt">Resultado diario por tienda</div><div class="ds">Comparación frente a ${snap?.previousDate||prev?.date||'la línea base'}</div></div></div><div class="cbody"><div class="twrap"><table class="leaderTable"><thead><tr><th>Tienda</th><th class="num">Índice</th><th class="num">Red. Rotación</th><th class="num">Red. Evacuación</th><th class="num">Gestionados</th><th class="num">Nuevos</th><th class="num">Persistentes</th><th class="num">Gest. +360</th><th class="num">Traslados resueltos</th></tr></thead><tbody>${dailyRows}</tbody></table></div><div class="dashboardNote">Gestionado significa que dejó de aparecer en Rotación o Evacuación. No demuestra una venta ni identifica la causa del movimiento.</div></div></div>
  <div class="leaderGrid"><div class="card"><div class="chead"><div class="cnum n4">★</div><div><div class="tt">Comparativo integral de tiendas</div><div class="ds">El índice mide gestión diaria, no volumen de ventas</div></div><div class="rt"><span class="badge mut">Índice 0–100</span></div></div><div class="cbody"><div class="twrap"><table class="leaderTable"><thead><tr><th>Tienda</th><th>Índice</th><th class="num">Inventario</th><th class="num">% Rotación</th><th class="num">% Evacuación</th><th class="num">Red. Rotación</th><th class="num">Red. Evacuación</th><th class="num">Gestionados</th><th class="num">Nuevos</th><th class="num">Persistentes</th><th class="num">Traslados</th><th>Detalle</th></tr></thead><tbody>${tableRows.map(r=>`<tr>${r.map((x,i)=>`<td${[2,3,4,5,6,7,8,9,10].includes(i)?' class="num"':''}>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="dashboardNote">Pesos del índice: Evacuación 30%, Rotación 25%, referencias +360 20%, control de nuevos críticos 15% y traslados/acciones 10%.</div></div></div><div style="display:flex;flex-direction:column;gap:20px"><div class="card"><div class="chead"><div class="cnum n2">!</div><div><div class="tt">Alertas prioritarias</div><div class="ds">Tiendas con deterioro o mayor exposición</div></div></div><div class="cbody"><div class="alertList">${alerts||'<div class="empty">Sin alertas críticas.</div>'}</div></div></div><div class="card"><div class="chead"><div class="cnum n3">i</div><div><div class="tt">Reglas de interpretación</div><div class="ds">Cómo leer el seguimiento</div></div></div><div class="cbody"><div class="compactLegend"><span><b>Gestionado:</b> salió del estado crítico.</span><span><b>Persistente:</b> continúa en el estado.</span><span><b>Nuevo:</b> ingresó desde el último corte.</span><span><b>Reducción ajustada:</b> considera el inventario inicial y las nuevas entradas.</span><span><b>Ventas:</b> no participan en la evaluación.</span></div></div></div></div></div>`;
}

/* ---------------- RESUMEN ---------------- */
function statTile(cls,ico,icls,lab,val,sub,goto){
  return `<div class="kpi ${cls}" onclick="gotoView('${goto}')"><div class="top"><div class="ico ${icls}">${ico}</div></div>
    <div class="lab">${lab}</div><div class="val">${val}</div><div class="sub">${sub}</div></div>`;
}
function gotoView(v){const a=document.querySelector(`#nav a[data-v="${v}"]`);if(a)a.click();}
function viewResumen(st){
  st=st&&typeof st==='object'?st:{name:'Tienda sin datos',kpi:{},rot:[],evac:[],ventas:[],ventasProducto:[],inventario:[],tr:[]};
  st.kpi=st.kpi&&typeof st.kpi==='object'?st.kpi:{};
  ['rot','evac','ventas','ventasProducto','tr'].forEach(key=>{if(!Array.isArray(st[key]))st[key]=[];});
  const k=st.kpi;
  const agg=[0,0,0,0,0,0,0];
  normalizeRotRows(st).forEach(r=>{if(r.age>=0&&agg[r.age]!==undefined)agg[r.age]+=r.u;});
  const topRot=st.rot.slice(0,6), topEvac=st.evac.slice(0,6);
  const topCat=catTotals(st).slice(0,5);
  return `
  <div class="kgrid">
    ${statTile('k-rot','⟳','i-rot','Rotación pendiente',fInt(k.rotN),`${fInt(k.rotU)} uds · ${fMoney(k.rotVal)}`,'rot')}
    ${statTile('k-evac','⇲','i-evac','Por evacuar',fInt(k.evacN),`${fInt(k.evacU)} uds · ${fMoney(k.evacVal)}`,'evac')}
    ${statTile('k-sr','!','i-sr','Sin respaldo CENDIS',fInt(k.evacSR),'salen primero','evac')}
    ${statTile('k-amb','⇄','i-amb','Traslados en camino',fInt(k.trN),`${fInt(k.trU)} uds · ${fInt(k.trVol)} m³`,'amb')}
    ${statTile('k-vta','📊','i-vta','Ventas últ. 3 meses',fMoney(k.vtot),`${fInt(k.vU)} uds facturadas`,'vta')}
  </div>
  ${inventoryOverview(st)}
  ${productInventoryOverview(st)}
  ${storeDailyManagementPanel(CUR)}
  <div class="two">
    <div class="card">
      <div class="chead"><div class="cnum n1">1</div><div><div class="tt">Rotación por antigüedad</div><div class="ds">Unidades estado A (Línea) con más de 90 días</div></div>
        <div class="rt"><span class="badge warm">${fInt(k.rotN)} productos</span></div></div>
      <div class="cbody">
        <div class="chart" data-chart>${LBL.map((l,i)=>`<div class="bar"><div class="cv" style="color:${AGECOL[i]}">${fInt(agg[i])}</div><div class="col" data-h="${agg[i]}" style="background:${AGECOL[i]}"></div><div class="cl">${l}</div></div>`).join('')}</div>
        <div class="foot"><span>Top valor detenido</span><a class="chip" onclick="gotoView('rot')">Ver cuadrante →</a></div>
        ${miniList(topRot.map(r=>[P[r[0]]?.n||r[0],fMoney(r[3]),'var(--rot)']))}
      </div>
    </div>
    <div class="card">
      <div class="chead"><div class="cnum n2">2</div><div><div class="tt">Prioridad de evacuación</div><div class="ds">Sin respaldo en CENDIS = sale primero</div></div>
        <div class="rt"><span class="badge hot">${fInt(k.evacSR)} sin respaldo</span></div></div>
      <div class="cbody">
        <div class="legend"><span><span class="sw" style="background:var(--bad)"></span>Sin respaldo</span><span><span class="sw" style="background:var(--ok)"></span>Con respaldo</span></div>
        ${miniList(topEvac.map(r=>[P[r[0]]?.n||r[0], r[3]===0?'SIN RESPALDO':fInt(r[3])+' und', r[3]===0?'var(--bad)':'var(--ok)']))}
        <div class="foot"><span>Orden por prioridad</span><a class="chip" onclick="gotoView('evac')">Ver cuadrante →</a></div>
      </div>
    </div>
    <div class="card">
      <div class="chead"><div class="cnum n4">4</div><div><div class="tt">Ventas por categoría</div><div class="ds">Facturación últimos 3 meses</div></div>
        <div class="rt"><span class="badge" style="background:var(--vtaBg);color:var(--vta)">${fMoney(k.vtot)}</span></div></div>
      <div class="cbody">
        <div class="chart" data-chart>${topCat.map((c,i)=>{const col=CATCOL[i%CATCOL.length];return `<div class="bar"><div class="cv" style="color:${col}">${fMoney(c[1])}</div><div class="col" data-h="${c[1]}" style="background:${col}"></div><div class="cl" title="${esc(c[0])}">${esc(c[0].slice(0,10))}</div></div>`;}).join('')}</div>
        <div class="foot"><span>Participación por categoría</span><a class="chip" onclick="gotoView('vta')">Ver cuadrante →</a></div>
      </div>
    </div>
    <div class="card clickableSummaryCard60" role="button" tabindex="0" onclick="if(!event.target.closest(\'a,button\'))gotoView(\'traslados\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();gotoView(\'traslados\')}">
      <div class="chead"><div class="cnum n3">3</div><div><div class="tt">Traslados</div><div class="ds">Seguimiento operativo de movimientos en tienda</div></div>
        <div class="rt"><span class="badge cool">${fInt(k.trN)} traslados</span></div></div>
      <div class="cbody">
        <div class="mkpis">
          <div class="mk r"><div class="l">Total traslados</div><div class="v">${fInt(k.trN)}</div></div>
          <div class="mk r"><div class="l">Pend. picking</div><div class="v">${fInt(k.trPick)}</div></div>
          <div class="mk r"><div class="l">Pend. mov.</div><div class="v">${fInt(k.trMov)}</div></div>
          <div class="mk a"><div class="l">En seguimiento</div><div class="v">${fInt(Math.max(0,k.trN-k.trPick-k.trMov))}</div></div>
        </div>
        <div class="foot"><span>Movimientos de traslado</span><a class="chip" onclick="gotoView('traslados')">Ver cuadrante →</a></div>
      </div>
    </div>
    <div class="card clickableSummaryCard60" role="button" tabindex="0" onclick="if(!event.target.closest(\'a,button\'))gotoView(\'amb\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();gotoView(\'amb\')}">
      <div class="chead"><div class="cnum n5">5</div><div><div class="tt">Ambientes de la tienda</div><div class="ds">Exhibición y presencia actual en sala</div></div>
        <div class="rt"><span class="badge cool">${fInt(k.exhib)} exhibidas</span></div></div>
      <div class="cbody">
        <div class="mkpis">
          <div class="mk a"><div class="l">Uds exhibidas</div><div class="v">${fInt(k.exhib)}</div></div>
          <div class="mk a"><div class="l">Ref. con presencia</div><div class="v">${fInt(k.pres)}</div></div>
          <div class="mk a"><div class="l">Prom. uds/ref</div><div class="v">${k.pres?(k.exhib/k.pres).toFixed(1):'0.0'}</div></div>
          <div class="mk a"><div class="l">Cobertura ref.</div><div class="v">${normalizeInventoryRows(st).length?pctValue(k.pres,normalizeInventoryRows(st).length).toFixed(1):'0.0'}%</div></div>
        </div>
        <div class="foot"><span>Exhibición y presencia</span><a class="chip" onclick="gotoView('amb')">Ver cuadrante →</a></div>
      </div>
    </div>
  </div>
  <div class="hint">💡 <span>Base por tienda: <b>Detalle 26</b>. Haz clic en cualquier tarjeta o el menú para abrir cada cuadrante. <b>Cliente</b> queda listo para cuando cargues su documento.</span></div>`;
}
function catTotals(st){const m={};normalizeSalesRows(st).forEach(r=>{m[r.cat]=(m[r.cat]||0)+r.v;});return Object.entries(m).sort((a,b)=>b[1]-a[1]);}
function miniList(rows){
  return '<div style="display:flex;flex-direction:column;gap:2px">'+rows.map(r=>
    `<div style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid #f0f3f9">
      <div class="pname" style="flex:1;font-size:12.5px">${esc(r[0])}</div>
      <b style="color:${r[2]};font-size:12.5px">${esc(r[1])}</b></div>`).join('')+'</div>';
}


/* ---------------- MÓDULO · INVENTARIO ---------------- */
function inventoryFallbackRows(st){
  const rot=new Map(normalizeRotRows(st).map(r=>[r.c,r])),evac=new Map(normalizeEvacRows(st).map(r=>[r.c,r]));
  return normalizeProductSalesRows(st).filter(r=>r.su>0||r.sv>0).map(r=>{const rr=rot.get(r.c),ee=evac.get(r.c),ranges={};if(rr&&rr.u>0)ranges[rr.ageLabel]=rr.u;else if(ee&&ee.u>0)ranges[ee.edad]=ee.u;else ranges['SIN DEFINIR']=r.su;return {codigo:r.c,codigoSap:'',producto:r.p.n,categoria:r.p.cat,linea:r.p.lin,sublinea:r.p.sub,matriz:'',cicloVida:'',estilo:'',familia:'',grupoSublinea:'',marca:'',surtido:'',estadoAbastecimiento:'',precioOferta:r.su?r.sv/r.su:0,precioLista:0,stock:r.su,disponible:r.su,exhibidas:0,presencia:0,dispCendis:ee?.cendis||0,entradas:0,valorInventario:r.sv,rangos,estados:[rr?'Rotación':null,ee?'Evacuación':null].filter(Boolean).length?[rr?'Rotación':null,ee?'Evacuación':null].filter(Boolean):['Otros estados'],unidadesOC:0,fechaRecibido:'',facturacionUlt3Meses:r.v,unidadesFacUlt3Meses:r.u};});
}
function canonicalAgeLabel(value){
  const raw=safeText(value,'SIN DEFINIR').toUpperCase().replace(/\s+/g,' ').trim();
  if(!raw||raw==='N/A'||raw==='SIN RANGO')return 'SIN DEFINIR';
  if(raw==='SIN DEFINIR')return 'SIN DEFINIR';
  if(raw.includes('360')&&(raw.includes('MAS')||raw.includes('MÁS')||raw.includes('+')))return '360 - Más';
  const nums=(raw.match(/\d+/g)||[]).map(Number);
  if(!nums.length)return safeText(value,'SIN DEFINIR');
  const lo=nums[0];
  if(lo>=360)return '360 - Más';
  if(lo>=241)return '241 - 360';
  if(lo>=210)return '210 - 240';
  if(lo>=181)return '181 - 210';
  if(lo>=150)return '151 - 180';
  if(lo>=120)return '121 - 150';
  if(lo>=91)return '091 - 120';
  if(lo>=61)return '061 - 090';
  if(lo>=31)return '031 - 060';
  return '000 - 030';
}
function normalizeAgeDistribution(x,stock){
  const dist={};
  const add=(label,qty)=>{qty=Math.max(0,toNum(qty));if(!qty)return;const key=canonicalAgeLabel(label);dist[key]=(dist[key]||0)+qty;};
  const raw=x&&x.rangos;
  if(raw&&typeof raw==='object'&&!Array.isArray(raw))Object.entries(raw).forEach(([a,u])=>add(a,u));
  if(Array.isArray(raw))raw.forEach(v=>{if(Array.isArray(v))add(v[0],v[1]);else if(v&&typeof v==='object')add(v.rango??v.antiguedad??v.edad,v.unidades??v.cantidad??v.qty??1);});
  const detailed=Object.values(dist).reduce((a,u)=>a+toNum(u),0),total=Math.max(0,toNum(stock));
  return {rangos:dist,detalleUnidades:detailed,cobertura:total>0?Math.min(100,detailed/total*100):100,inconsistente:Math.abs(detailed-total)>0.0001};
}
function normalizeInventoryRows(st){return (Array.isArray(st?.inventario)&&st.inventario.length?st.inventario:inventoryFallbackRows(st)).map(x=>{
  const c=safeCode(x.codigo),p=productInfo(c),stock=toNum(x.stock),ageData=normalizeAgeDistribution(x,stock),states=Array.isArray(x.estados)&&x.estados.length?x.estados:['Otros estados'];
  return {...x,c,p:{n:safeText(x.producto,p.n),cat:safeText(x.categoria,p.cat),lin:safeText(x.linea,p.lin),sub:safeText(x.sublinea,p.sub)},stock,disponible:x.disponible===null?null:toNum(x.disponible),exhibidas:x.exhibidas===null?null:toNum(x.exhibidas),presencia:x.presencia===null?null:toNum(x.presencia),dispCendis:toNum(x.dispCendis),entradas:toNum(x.entradas),valorInventario:toNum(x.valorInventario),valorUnitarioPromedio:toNum(x.valorUnitarioPromedio),precioOferta:toNum(x.precioOferta),precioLista:toNum(x.precioLista),unidadesOC:toNum(x.unidadesOC),rangos:ageData.rangos,rangosValor:x.rangosValor||{},detalleUnidades:ageData.detalleUnidades,coberturaAntiguedad:ageData.cobertura,antiguedadInconsistente:ageData.inconsistente,estados:states};
});}
function invStateHtml(states){return (states||[]).map(s=>{const cls=s==='Rotación'?'rot':s==='Evacuación'?'evac':'other';return `<span class="inventoryState ${cls}">${esc(s)}</span>`;}).join('');}
function sortedAgeEntries(ranges){const order={'360 - Más':10,'360 - MAS':10,'360 - Mas':10,'241 - 360':9,'210 - 240':8,'181 - 210':7,'151 - 180':6,'121 - 150':5,'091 - 120':4,'061 - 090':3,'031 - 060':2,'000 - 030':1,'SIN DEFINIR':0};return Object.entries(ranges||{}).filter(([,u])=>toNum(u)>0).sort((a,b)=>(order[canonicalAgeLabel(b[0])]??-1)-(order[canonicalAgeLabel(a[0])]??-1));}
function invAgeHtml(ranges,stock){const entries=sortedAgeEntries(ranges);if(!entries.length)return '<span class="ageNoData">Sin datos de antigüedad</span>';return `<div class="ageUnitList">${entries.map(([a,u])=>{const label=canonicalAgeLabel(a);return `<span class="ageUnitChip ${label==='360 - Más'?'criticalAge':label==='SIN DEFINIR'?'undefinedAge':''}"><b>${fInt(u)} u</b><span>${esc(label)}</span></span>`;}).join('')}</div>`;}
function ageDefinedUnits(ranges){return sortedAgeEntries(ranges).filter(([a])=>canonicalAgeLabel(a)!=='SIN DEFINIR').reduce((s,[,u])=>s+toNum(u),0);}
function inventorySummary(st){const rows=normalizeInventoryRows(st).filter(r=>r.stock>0),units=rows.reduce((a,r)=>a+r.stock,0),value=rows.reduce((a,r)=>a+r.valorInventario,0),critical=rows.filter(r=>Object.keys(r.rangos||{}).some(x=>ageRankFromLabel(x)>=6)),supported=rows.filter(r=>r.dispCendis>0).length;return {rows,refs:rows.length,units,value,critical:critical.length,supported};}
function viewInventario(st){const x=inventorySummary(st);return `<div class="card"><div class="chead"><div class="cnum n4">▤</div><div><div class="tt">Inventario de la tienda</div><div class="ds">Consulta completa por producto, unidades y rango de antigüedad</div></div><div class="rt"><span class="badge mut">${fInt(x.refs)} referencias</span></div></div><div class="cbody"><div class="inventoryKpis"><div class="inventoryKpi"><div class="ikLabel">Referencias con stock</div><div class="ikValue">${fInt(x.refs)}</div><div class="ikMeta">Códigos de producto</div></div><div class="inventoryKpi"><div class="ikLabel">Unidades en tienda</div><div class="ikValue">${fInt(x.units)}</div><div class="ikMeta">Stock total</div></div><div class="inventoryKpi"><div class="ikLabel">Con respaldo CENDIS</div><div class="ikValue">${fInt(x.supported)}</div><div class="ikMeta">Referencias con disponibilidad</div></div><div class="inventoryKpi"><div class="ikLabel">Valor del inventario</div><div class="ikValue">${fMoneyCOP(x.value)}</div><div class="ikMeta">Pesos colombianos</div></div><div class="inventoryKpi"><div class="ikLabel">Críticos +360 días</div><div class="ikValue" style="color:var(--jamar)">${fInt(x.critical)}</div><div class="ikMeta">Referencias críticas</div></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-inventario" placeholder="Buscar código, producto, categoría o familia…" oninput="state.inventario.q=this.value;drawInventario()"></div><span class="chip filt" data-q="inventario" data-f="all">Todo</span><span class="chip filt" data-q="inventario" data-f="rot">Rotación</span><span class="chip filt" data-q="inventario" data-f="evac">Evacuación</span><span class="chip filt" data-q="inventario" data-f="360">+360 días</span><span class="chip filt" data-q="inventario" data-f="sr">Sin respaldo</span></div><div id="inventario-tbl"></div><div class="foot"><span id="inventario-cnt"></span><span>Presiona el nombre del producto o el botón Ver para consultar toda la información.</span></div></div></div>`;}
function drawInventario(){const st=S[CUR]||{},s=state.inventario,all=normalizeInventoryRows(st).filter(r=>r.stock>0);let rows=all.slice();if(s.f==='rot')rows=rows.filter(r=>r.estados.includes('Rotación'));if(s.f==='evac')rows=rows.filter(r=>r.estados.includes('Evacuación'));if(s.f==='360')rows=rows.filter(r=>Object.keys(r.rangos||{}).some(x=>ageRankFromLabel(x)>=6));if(s.f==='sr')rows=rows.filter(r=>r.dispCendis<=0);if(s.q){const q=s.q.toLowerCase();rows=rows.filter(r=>(r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub+' '+safeText(r.familia,'')+' '+safeText(r.matriz,'')).toLowerCase().includes(q));}rows.sort(cmp(s,{c:r=>r.c,p:r=>r.p.n,state:r=>r.estados.join(' '),stock:r=>r.stock,age:r=>Math.max(-1,...Object.keys(r.rangos||{}).map(ageRankFromLabel)),cendis:r=>r.dispCendis,entries:r=>r.entradas,value:r=>r.valorInventario}));const cols=[['Código','c',0],['Producto','p',0],['Clasificación','x',0],['Estado','state',0],['Stock','stock',1],['Rango por unidad','age',0],['CENDIS','cendis',1],['Valor','value',1],['','x',0]];const body=rows.map(r=>[`<span class="code">${esc(r.c)}</span>`,`<button class="productOpen" onclick='openInventoryProduct(${JSON.stringify(r.c)})' title="Ver detalle completo">${esc(r.p.n)}</button>`,`<div class="classificationCell"><span><b>Categoría:</b> ${esc(r.p.cat)}</span><span><b>Línea:</b> ${esc(r.p.lin)}</span><span><b>Sublínea:</b> ${esc(r.p.sub)}</span></div>`,invStateHtml(r.estados),`<b>${fInt(r.stock)}</b>`,invAgeHtml(r.rangos,r.stock),r.dispCendis>0?`<span class="tag cr">${fInt(r.dispCendis)} u</span>`:'<span class="tag sr">0 u</span>',`<b>${fMoneyCOP(r.valorInventario)}</b>`,`<button class="actionBtn" onclick='openInventoryProduct(${JSON.stringify(r.c)})'>Ver</button>`]);const el=document.getElementById('inventario-tbl');if(el)el.innerHTML=tableHTML('inventario',cols,body);const cnt=document.getElementById('inventario-cnt');if(cnt)cnt.textContent=`Mostrando ${rows.length} de ${all.length} referencias con inventario`;wireTable('inventario',drawInventario);}
function openInventoryProduct(code){const st=S[CUR]||{},r=normalizeInventoryRows(st).find(x=>x.c===safeCode(code));if(!r)return;const transfers=(st.trDetalle||[]).filter(t=>safeCode(t.codigo)===r.c);const ranges=sortedAgeEntries(r.rangos),mx=Math.max(1,...ranges.map(([,u])=>toNum(u))),defined=ageDefinedUnits(r.rangos),undefinedQty=toNum(r.rangos?.['SIN DEFINIR']);document.getElementById('inventoryProductTitle').textContent=r.p.n;document.getElementById('inventoryProductSubtitle').textContent=`Código ${r.c} · ${safeText(st.name,CUR)}`;const item=(l,v)=>`<div class="detailItem"><label>${esc(l)}</label><b>${esc(safeText(v,'—'))}</b></div>`;document.getElementById('inventoryProductBody').innerHTML=`<div class="detailHero"><div><h3>${esc(r.p.n)}</h3><p>${esc(r.p.cat)} · ${esc(r.p.lin)} · ${esc(r.p.sub)}</p><div style="margin-top:7px">${invStateHtml(r.estados)}</div></div><div class="detailHeroValue"><b>${fMoneyCOP(r.valorInventario)}</b><span>Valor total del inventario</span></div></div><div class="detailSections"><section class="detailSection"><div class="detailSectionTitle">Identificación del producto</div><div class="detailGrid">${item('Código',r.c)}${item('Código SAP',r.codigoSap)}${item('Marca',r.marca)}${item('Matriz',r.matriz)}${item('Ciclo de vida',r.cicloVida)}${item('Estilo',r.estilo)}${item('Familia',r.familia)}${item('Grupo sublínea',r.grupoSublinea)}${item('Surtido',r.surtido)}</div></section><section class="detailSection"><div class="detailSectionTitle">Inventario y abastecimiento</div><div class="detailGrid">${item('Stock total',fInt(r.stock)+' unidades')}${item('Unidades con rango definido',fInt(defined)+' unidades')}${item('Unidades sin definir',fInt(undefinedQty)+' unidades')}${item('Valor promedio por unidad',fMoneyCOP(r.valorUnitarioPromedio))}${item('Disponible',r.disponible===null?'Sin dato en este corte':fInt(r.disponible)+' unidades')}${item('Exhibidas',r.exhibidas===null?'Sin dato en este corte':fInt(r.exhibidas)+' unidades')}${item('Presencia',r.presencia===null?'Sin dato en este corte':fInt(r.presencia))}${item('Disponibilidad CENDIS',fInt(r.dispCendis)+' unidades')}${item('Entradas previstas',fInt(r.entradas)+' unidades')}${item('Unidades en OC',fInt(r.unidadesOC))}${item('Fecha recibido',r.fechaRecibido)}${item('Estado abastecimiento',r.estadoAbastecimiento)}</div>${r.antiguedadInconsistente?'<div class="ageDataAlert bad">La suma de unidades por rango no coincide con el stock total de la fuente. Requiere validación.</div>':''}</section><section class="detailSection full"><div class="detailSectionTitle">Distribución exacta por rango de antigüedad</div><div class="ageDistribution">${ranges.length?ranges.map(([a,u])=>{const label=canonicalAgeLabel(a);return `<div class="ageDistRow"><b>${esc(label)}</b><div class="ageDistTrack"><div class="ageDistFill ${label==='360 - Más'?'criticalFill':''}" style="width:${Math.max(4,toNum(u)/mx*100)}%"></div></div><div class="ageDistQty"><strong>${fInt(u)} u</strong></div></div>`;}).join(''):'<div class="empty">No hay rangos de antigüedad registrados.</div>'}</div><div class="sourceNote">Fuente: ${esc(safeText(r.fuenteAntiguedad,'Inventario Art'))} · Bodega ${esc(safeText(r.fuenteBodegaCodigo,''))}</div></section><section class="detailSection"><div class="detailSectionTitle">Valores del producto</div><div class="detailGrid">${item('Precio oferta',fMoneyCOP(r.precioOferta))}${item('Precio lista',fMoneyCOP(r.precioLista))}${item('Valor promedio inventario',fMoneyCOP(r.valorUnitarioPromedio))}${item('Valor inventario',fMoneyCOP(r.valorInventario))}${item('Bodegaje',fMoneyCOP(r.bodegaje))}${item('Margen oferta',toNum(r.margenOferta)?(toNum(r.margenOferta)*100).toFixed(1)+'%':'—')}${item('Contribución bruta',fMoneyCOP(r.contribucionBruta))}</div></section><section class="detailSection"><div class="detailSectionTitle">Información de movimiento — solo consulta</div><div class="detailGrid">${item('Facturación últimos 3 meses',fMoneyCOP(r.facturacionUlt3Meses))}${item('Unidades facturadas 3 meses',fInt(r.unidadesFacUlt3Meses))}${item('Unidades facturadas',fInt(r.unidadesFacturadas))}${item('Valor oferta facturada',fMoneyCOP(r.valorOfertaFacturada))}</div></section><section class="detailSection full"><div class="detailSectionTitle">Traslados relacionados</div>${transfers.length?`<div class="transferTableWrap"><table class="transferMini"><thead><tr><th>Entrega</th><th>Unidades</th><th>Fecha entrega</th><th>Picking</th><th>Movimiento</th><th>Estatus</th></tr></thead><tbody>${transfers.slice(0,30).map(t=>`<tr><td>${esc(t.entrega)}</td><td>${fInt(t.unidades)}</td><td>${esc(safeText(t.fechaEntrega,'—'))}</td><td>${esc(safeText(t.statusGlobalPicking,'—'))}</td><td>${esc(safeText(t.statusMovimiento,'—'))}</td><td>${esc(safeText(t.estatus,'—'))}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No hay traslados relacionados con este producto.</div>'}</section></div>`;document.getElementById('inventoryProductModal').classList.add('on');}
function closeInventoryProduct(){document.getElementById('inventoryProductModal')?.classList.remove('on');}

/* ---------------- CUADRANTE 1 · ROTACIÓN ---------------- */
function ageBadge(i,label=''){if(i<0)return `<span class="tag" style="background:#eef2f9;color:var(--mut)">${esc(safeText(label,'SIN DEFINIR'))}</span>`;const idx=Math.max(0,Math.min((LBL?.length||7)-1,Math.trunc(toNum(i))));return `<span class="tag" style="background:${AGECOL[idx]}22;color:${AGECOL[idx]}">${esc(safeText(label,LBL?.[idx]||'SIN DEFINIR'))}</span>`;}
function viewRot(st){const k=st.kpi||{};return `
  <div class="card"><div class="chead"><div class="cnum n1">1</div>
    <div><div class="tt">Rotación</div><div class="ds">Productos estado <b>A</b> (Línea) con más de 90 días en tienda — ordenados de mayor a menor antigüedad</div></div>
    <div class="rt"><span class="badge warm">${fInt(k.rotN)} por rotar</span></div></div>
   <div class="cbody">
     <div class="mkpis">
       <div class="mk r"><div class="l">Productos</div><div class="v">${fInt(k.rotN)}</div></div>
       <div class="mk r"><div class="l">Unidades &gt;90d</div><div class="v">${fInt(k.rotU)}</div></div>
       <div class="mk r"><div class="l">Valor detenido</div><div class="v">${fMoney(k.rotVal)}</div></div>
       <div class="mk b"><div class="l">Sin venta 3 meses</div><div class="v">${fInt(k.rotSin)}</div></div>
     </div>
     <div><div class="legend" style="margin-bottom:4px"><b>Distribución por antigüedad (unidades en piso)</b></div><div class="chart" data-chart id="rot-chart"></div></div>
     <div class="tbar">
       <div class="tsearch">🔎<input id="q-rot" placeholder="Buscar producto o código…" oninput="state.rot.q=this.value;drawRot()"></div>
       <span class="chip filt" data-q="rot" data-f="all">Todos</span><span class="chip filt" data-q="rot" data-f="crit">+180 días</span><span class="chip filt" data-q="rot" data-f="a360">+360 días</span><span class="chip filt" data-q="rot" data-f="novta">Sin venta 3m</span>
     </div>
     <div id="rot-tbl"></div>
     <div class="foot"><span id="rot-cnt"></span><span>Orden inicial: mayor antigüedad → menor antigüedad · 🔴 sin venta = prioridad</span></div>
   </div></div>`;}
function drawRot(){
  const st=S[CUR]||{},s=state.rot;let rows=normalizeRotRows(st);
  if(s.f==='crit')rows=rows.filter(r=>r.age>=3);if(s.f==='a360')rows=rows.filter(r=>r.age>=6);if(s.f==='novta')rows=rows.filter(r=>r.sales3m<=0);
  if(s.q){const q=String(s.q).toLowerCase();rows=rows.filter(r=>r.p.n.toLowerCase().includes(q)||r.c.toLowerCase().includes(q));}
  const agg=Array.from({length:LBL?.length||7},()=>0);rows.forEach(r=>{if(r.age>=0&&agg[r.age]!==undefined)agg[r.age]+=r.u;});
  const ch=document.getElementById('rot-chart');if(ch)ch.innerHTML=(LBL||[]).map((l,i)=>`<div class="bar"><div class="cv" style="color:${AGECOL[i]}">${fInt(agg[i])}</div><div class="col" data-h="${agg[i]}" style="background:${AGECOL[i]}"></div><div class="cl">${esc(l)}</div></div>`).join('');
  if(s.sort==='age')rows.sort((a,b)=>{const ax=a.age<0?-99:a.age,bx=b.age<0?-99:b.age;return (ax-bx)*s.dir||b.val-a.val||b.u-a.u;});else rows.sort(cmp(s,{c:r=>r.c,p:r=>r.p.n,age:r=>r.age,u:r=>r.u,val:r=>r.val,vta:r=>r.sales3m}));
  const cols=[['Código','c',0],['Producto','p',0],['Cat / Línea','x',0],['Antigüedad','age',0],['Uds','u',1],['Valor detenido','val',1],['Ventas 3m (uds)','vta',1]];
  const body=rows.map(r=>[`<span class="code">${esc(r.c)}</span>`,`<div class="pname" title="${esc(r.p.n)}">${esc(r.p.n)}</div>`,`<span style="color:var(--mut);font-size:11.5px">${esc(r.p.cat)} · ${esc(r.p.lin)}</span>`,ageBadge(r.age,r.ageLabel),`<b>${fInt(r.u)}</b>`,`<b style="color:var(--rot)">${fMoney(r.val)}</b>`,r.sales3m>0?`<b>${fInt(r.sales3m)}</b>`:'<span class="tag sr">SIN VENTA</span>']);
  const tbl=document.getElementById('rot-tbl');if(tbl)tbl.innerHTML=tableHTML('rot',cols,body);const cnt=document.getElementById('rot-cnt');if(cnt)cnt.textContent=`Mostrando ${rows.length} de ${normalizeRotRows(st).length} productos`;wireTable('rot',drawRot);animateBars();
}

/* ---------------- CUADRANTE 2 · EVACUACIÓN ---------------- */
function evacuationSummary(st){const rows=normalizeEvacRows(st).filter(r=>r.active);return {rows,n:rows.length,u:rows.reduce((a,r)=>a+r.u,0),v:rows.reduce((a,r)=>a+r.v,0),sr:rows.filter(r=>r.cendis<=0).length,cr:rows.filter(r=>r.cendis>0).length};}
function viewEvac(st){const x=evacuationSummary(st);return `
  <div class="card"><div class="chead"><div class="cnum n2">2</div>
    <div><div class="tt">Evacuación</div><div class="ds">Productos fuera de portafolio con inventario real en la tienda — prioridad por respaldo en CENDIS</div></div>
    <div class="rt"><span class="badge hot">${fInt(x.sr)} sin respaldo</span></div></div>
   <div class="cbody">
     <div class="mkpis"><div class="mk e"><div class="l">Productos con inventario</div><div class="v">${fInt(x.n)}</div></div><div class="mk b"><div class="l">Sin respaldo</div><div class="v">${fInt(x.sr)}</div></div><div class="mk g"><div class="l">Con respaldo</div><div class="v">${fInt(x.cr)}</div></div><div class="mk e"><div class="l">Unidades tienda</div><div class="v">${fInt(x.u)}</div></div><div class="mk e"><div class="l">Valor</div><div class="v">${fMoney(x.v)}</div></div></div>
     <div class="legend"><span><span class="sw" style="background:var(--bad)"></span>Sin respaldo CENDIS → <b>sale primero</b></span><span><span class="sw" style="background:var(--ok)"></span>Con respaldo en CENDIS</span></div>
     <div class="tbar"><div class="tsearch">🔎<input id="q-evac" placeholder="Buscar producto o código…" oninput="state.evac.q=this.value;drawEvac()"></div><span class="chip filt" data-q="evac" data-f="all">Todos con inventario</span><span class="chip filt" data-q="evac" data-f="sr">Sin respaldo</span><span class="chip filt" data-q="evac" data-f="cr">Con respaldo</span></div>
     <div id="evac-tbl"></div><div class="foot"><span id="evac-cnt"></span><span>Se excluyen referencias sin unidades ni valor en la tienda.</span></div>
   </div></div>`;}
function drawEvac(){
  const st=S[CUR]||{},s=state.evac,all=normalizeEvacRows(st).filter(r=>r.active);let rows=all.slice();
  if(s.f==='sr')rows=rows.filter(r=>r.cendis<=0);if(s.f==='cr')rows=rows.filter(r=>r.cendis>0);
  if(s.q){const q=String(s.q).toLowerCase();rows=rows.filter(r=>r.p.n.toLowerCase().includes(q)||r.c.toLowerCase().includes(q));}
  if(s.sort==='pri')rows.sort((a,b)=>(a.cendis>0)-(b.cendis>0)||b.v-a.v||b.u-a.u);else rows.sort(cmp(s,{c:r=>r.c,p:r=>r.p.n,cendis:r=>r.cendis,u:r=>r.u,v:r=>r.v}));
  const cols=[['#','pri',0],['Código','c',0],['Producto','p',0],['Cat / Línea','x',0],['Antigüedad','x',0],['Respaldo CENDIS','cendis',1],['Uds tienda','u',1],['Valor','v',1]];
  const body=rows.map((r,i)=>[`<span class="pri ${r.cendis<=0?'top':''}">${i+1}</span>`,`<span class="code">${esc(r.c)}</span>`,`<div class="pname" title="${esc(r.p.n)}">${esc(r.p.n)}</div>`,`<span style="color:var(--mut);font-size:11.5px">${esc(r.p.cat)} · ${esc(r.p.lin)}</span>`,`<span style="color:var(--mut);font-size:11px">${esc(r.edad)}</span>`,r.cendis<=0?'<span class="tag sr">SIN RESPALDO</span>':`<span class="tag cr">${fInt(r.cendis)} und</span>`,`<b>${fInt(r.u)}</b>`,`<b style="color:var(--evac)">${fMoney(r.v)}</b>`]);
  const tbl=document.getElementById('evac-tbl');if(tbl)tbl.innerHTML=tableHTML('evac',cols,body);const cnt=document.getElementById('evac-cnt');if(cnt)cnt.textContent=`Mostrando ${rows.length} de ${all.length} productos con inventario`;wireTable('evac',drawEvac);
}

/* ---------------- CUADRANTE 3 · AMBIENTES ---------------- */
function viewAmb(st){const k=st.kpi;return `
  <div class="card"><div class="chead"><div class="cnum n3">3</div>
    <div><div class="tt">Ambientes</div><div class="ds">Traslados pendientes por llegar a la tienda + guías de exhibición</div></div>
    <div class="rt"><span class="badge cool">${fInt(k.trN)} líneas en tránsito</span></div></div>
   <div class="cbody">
     <div class="mkpis">
       <div class="mk a"><div class="l">Líneas / entregas</div><div class="v">${fInt(k.trN)}</div></div>
       <div class="mk a"><div class="l">Unidades</div><div class="v">${fInt(k.trU)}</div></div>
       <div class="mk a"><div class="l">Volumen m³</div><div class="v">${fInt(k.trVol)}</div></div>
       <div class="mk r"><div class="l">Pend. picking</div><div class="v">${fInt(k.trPick)}</div></div>
       <div class="mk r"><div class="l">Pend. mov.</div><div class="v">${fInt(k.trMov)}</div></div>
       <div class="mk b"><div class="l">Fecha a revisar</div><div class="v">${fInt(k.trRev)}</div></div>
     </div>
     <div class="tbar">
       <div class="tsearch">🔎<input id="q-tr" placeholder="Buscar material o código…" oninput="state.tr.q=this.value;drawTr()"></div>
       <span class="chip filt" data-q="tr" data-f="all">Todos</span>
       <span class="chip filt" data-q="tr" data-f="pick">Pend. picking</span>
       <span class="chip filt" data-q="tr" data-f="mov">Pend. movimiento</span>
       <span class="chip filt" data-q="tr" data-f="rev">Fecha a revisar</span>
     </div>
     <div id="tr-tbl"></div>
     <div class="foot"><span id="tr-cnt"></span><span>A = abierto/pendiente · C = completado</span></div>
   </div></div>
   <div class="card"><div class="chead"><div class="cnum n3" style="background:#cfe9e6;color:var(--amb)">🖼️</div>
     <div><div class="tt">Exhibición en piso</div><div class="ds">Presencia y unidades exhibidas (base Detalle 26)</div></div>
     <div class="rt"><span class="badge cool">${fInt(k.pres)} refs. con presencia</span></div></div>
     <div class="cbody">
       <div class="mkpis">
         <div class="mk a"><div class="l">Referencias con presencia</div><div class="v">${fInt(k.pres)}</div></div>
         <div class="mk a"><div class="l">Unidades exhibidas</div><div class="v">${fInt(k.exhib)}</div></div>
       </div>
       <div class="hint">🧩 <span>Complemento desde la base de la tienda. El detalle formal de <b>guías de exhibición y % de completitud</b> se conecta cuando cargues ese documento.</span></div>
     </div></div>`;}
function drawTr(){
  const st=S[CUR],s=state.tr;
  let rows=st.tr.slice();
  if(s.f==='pick')rows=rows.filter(r=>r[6]==='A');
  if(s.f==='mov')rows=rows.filter(r=>r[7]==='A');
  if(s.f==='rev')rows=rows.filter(r=>r[8]==='REVISAR');
  if(s.q){const q=s.q.toLowerCase();rows=rows.filter(r=>(r[1]||'').toLowerCase().includes(q)||(r[0]||'').toLowerCase().includes(q));}
  if(s.sort!=='st')rows.sort(cmp(s,{c:r=>r[0],m:r=>r[1],u:r=>r[2],vol:r=>r[3],fc:r=>r[4]}));
  else rows.sort((a,b)=>(a[6]!=='A')-(b[6]!=='A')||(a[7]!=='A')-(b[7]!=='A'));
  const stag=v=>v==='A'?'<span class="tag a">Pendiente</span>':(v==='C'?'<span class="tag cr">OK</span>':`<span style="color:var(--mut)">${esc(v||'—')}</span>`);
  const cols=[['Código','c',0],['Material','m',0],['Uds','u',1],['m³','vol',1],['Creación','fc',0],['Entrega','x',0],['Picking','x',0],['Mov.','x',0],['Fecha','x',0]];
  const body=rows.map(r=>[
    `<span class="code">${esc(r[0])}</span>`,
    `<div class="pname" title="${esc(r[1])}">${esc(r[1])}</div>`,
    `<b>${fInt(r?.[2])}</b>`,fInt(toNum(r?.[3])),`<span style="color:var(--mut)">${esc(safeText(r?.[4],'—'))}</span>`,`<span style="color:var(--mut)">${esc(safeText(r?.[5],'—'))}</span>`,
    stag(r[6]),stag(r[7]),r[8]==='REVISAR'?'<span class="tag rev">REVISAR</span>':'<span class="tag ok">OK</span>']);
  document.getElementById('tr-tbl').innerHTML=tableHTML('tr',cols,body);
  document.getElementById('tr-cnt').textContent=`Mostrando ${rows.length} de ${st.tr.length} líneas`;
  wireTable('tr',drawTr);
}

/* ---------------- CUADRANTE 4 · VENTAS ---------------- */
function salesInsights(st){
  const products=normalizeProductSalesRows(st),withSales=products.filter(r=>r.u>0).sort((a,b)=>b.u-a.u||b.v-a.v),withStock=products.filter(r=>r.su>0),noSales=withStock.filter(r=>r.u<=0).sort((a,b)=>b.sv-a.sv),low=noSales[0]||withSales.slice().sort((a,b)=>a.u-b.u||a.v-b.v)[0]||null;
  return {products,top:withSales[0]||null,low,noSales,exact:products.some(r=>r.source==='VentasProducto')};
}
function productKpi(label,row,meta){return `<div class="mk"><div class="l">${esc(label)}</div><div class="v textKpi" title="${esc(row?.p?.n||'Sin datos')}">${esc(row?.p?.n||'Sin datos')}</div><div class="meta">${row?`${fInt(row.u)} uds vendidas · stock ${fInt(row.su)}`:'Carga la hoja VentasProducto'}</div>${meta?`<div class="meta">${esc(meta)}</div>`:''}</div>`;}
function viewVta(st){const k=st.kpi||{},cats=catTotals(st),ins=salesInsights(st),avg=k.vU?k.vtot/k.vU:0,source=ins.exact?'Detalle exacto por producto':'Estimación con productos de Rotación';
  return `
  <div class="card"><div class="chead"><div class="cnum n4">4</div><div><div class="tt">Ventas</div><div class="ds">Facturación de los últimos 3 meses y seguimiento de desempeño por producto</div></div><div class="rt"><span class="badge" style="background:var(--vtaBg);color:var(--vta)">${fMoney(k.vtot)}</span></div></div>
   <div class="cbody">
     <div class="mkpis"><div class="mk"><div class="l">Facturación 3 meses</div><div class="v" style="color:var(--vta)">${fMoney(k.vtot)}</div></div><div class="mk"><div class="l">Unidades facturadas</div><div class="v" style="color:var(--vta)">${fInt(k.vU)}</div></div><div class="mk"><div class="l">Venta promedio por unidad</div><div class="v" style="color:var(--vta)">${fMoney(avg)}</div></div><div class="mk"><div class="l">Categorías</div><div class="v" style="color:var(--vta)">${fInt(k.ncat)}</div></div><div class="mk b"><div class="l">Oportunidades por sublínea</div><div class="v" id="vta-opp">—</div></div>${productKpi('Producto más vendido',ins.top,source)}${productKpi('Producto menos vendido',ins.low,source)}<div class="mk b"><div class="l">Productos con stock sin venta</div><div class="v">${fInt(ins.noSales.length)}</div><div class="meta">${esc(source)}</div></div></div>
     <div><div class="legend" style="margin-bottom:4px"><b>Participación por categoría (facturación 3 meses)</b></div><div class="chart" data-chart>${cats.map((c,i)=>{const col=CATCOL[i%CATCOL.length],pct=k.vtot?Math.round(100*c[1]/k.vtot):0;return `<div class="bar"><div class="cv" style="color:${col}">${pct}%</div><div class="col" data-h="${c[1]}" style="background:${col}"></div><div class="cl" title="${esc(c[0])}">${esc(c[0])}</div></div>`;}).join('')}</div></div>
     <div class="tbar"><div class="tsearch">🔎<input id="q-vta" placeholder="Buscar categoría, línea o sublínea…" oninput="state.vta.q=this.value;drawVta()"></div><span class="chip filt" data-q="vta" data-f="all">Todas</span>${cats.map(c=>`<span class="chip filt" data-q="vta" data-f="${esc(c[0])}">${esc(c[0])}</span>`).join('')}<span class="chip filt" data-q="vta" data-f="__opp">🎯 Oportunidad</span></div>
     <div id="vta-tbl"></div><div class="foot"><span id="vta-cnt"></span><span>🎯 Oportunidad = stock en piso con venta nula en 3 meses</span></div>
   </div></div>
   <div class="two"><div class="card"><div class="chead"><div class="cnum n4">↑</div><div><div class="tt">Productos con mayor venta</div><div class="ds">Top 10 por unidades vendidas</div></div></div><div class="cbody"><div id="vta-top-products"></div><div class="rankNote">${esc(source)}</div></div></div><div class="card"><div class="chead"><div class="cnum n2">↓</div><div><div class="tt">Productos con menor venta</div><div class="ds">Stock con menor movimiento o sin venta</div></div></div><div class="cbody"><div id="vta-low-products"></div><div class="rankNote">${esc(source)}</div></div></div></div>`;}
function salesRankTable(rows,emptyText){if(!rows.length)return `<div class="empty">${esc(emptyText)}</div>`;const cols=[['Código','x',0],['Producto','x',0],['Ventas 3m','x',1],['Stock','x',1]];const body=rows.map(r=>[`<span class="code">${esc(r.c)}</span>`,`<div class="pname" title="${esc(r.p.n)}">${esc(r.p.n)}</div>`,`<span class="rankVal">${fInt(r.u)} uds</span>`,fInt(r.su)]);return tableHTML('vta',cols,body);}
function drawSalesProductRanking(st){const ins=salesInsights(st),top=ins.products.filter(r=>r.u>0).sort((a,b)=>b.u-a.u||b.v-a.v).slice(0,10),low=ins.products.filter(r=>r.su>0).sort((a,b)=>a.u-b.u||b.sv-a.sv).slice(0,10);const a=document.getElementById('vta-top-products'),b=document.getElementById('vta-low-products');if(a)a.innerHTML=salesRankTable(top,'No hay detalle de ventas por producto.');if(b)b.innerHTML=salesRankTable(low,'No hay productos con stock para analizar.');}
function drawVta(){
  const st=S[CUR]||{},s=state.vta,k=st.kpi||{};let rows=normalizeSalesRows(st).map(r=>({...r,opp:r.su>0&&r.v<=0}));
  const oppCount=rows.filter(r=>r.opp).length,oppEl=document.getElementById('vta-opp');if(oppEl)oppEl.textContent=fInt(oppCount);
  if(s.f==='__opp')rows=rows.filter(r=>r.opp);else if(s.f&&s.f!=='all')rows=rows.filter(r=>r.cat===s.f);
  if(s.q){const q=String(s.q).toLowerCase();rows=rows.filter(r=>`${r.cat} ${r.lin} ${r.sub}`.toLowerCase().includes(q));}
  if(s.sort==='part')rows.sort((a,b)=>b.v-a.v);else rows.sort(cmp(s,{cat:r=>r.cat,lin:r=>r.lin,sub:r=>r.sub,v:r=>r.v,u:r=>r.u,su:r=>r.su}));
  const cols=[['Categoría','cat',0],['Línea','lin',0],['Sublínea','sub',0],['Fac. 3m','v',1],['Part %','part',1],['Uds','u',1],['Stock piso','su',1]];
  const body=rows.map(r=>[`<span style="font-weight:700">${esc(r.cat)}</span>`,`<span style="color:var(--ink2)">${esc(r.lin)}</span>`,`<span style="color:var(--mut)">${esc(r.sub)}</span>${r.opp?' <span class="tag sr">🎯</span>':''}`,`<b style="color:var(--vta)">${fMoney(r.v)}</b>`,`${k.vtot?(100*r.v/k.vtot).toFixed(1):0}%`,fInt(r.u),fInt(r.su)]);
  const tbl=document.getElementById('vta-tbl');if(tbl)tbl.innerHTML=tableHTML('vta',cols,body);const cnt=document.getElementById('vta-cnt');if(cnt)cnt.textContent=`Mostrando ${rows.length} de ${normalizeSalesRows(st).length} sublíneas`;wireTable('vta',drawVta);drawSalesProductRanking(st);
}
/* ---------------- CUADRANTE 5 · CLIENTE ---------------- */
function viewCli(st){return `
  <div class="card"><div class="chead"><div class="cnum n5">5</div>
    <div><div class="tt">Cliente</div><div class="ds">Comportamiento y perfil de quien entra a la tienda</div></div>
    <div class="rt"><span class="waiting">Pendiente de datos</span></div></div>
   <div class="cbody"><div class="ph">
     <div class="pic">👥</div><h4>Perfilamiento del cliente de la tienda</h4>
     <p>Mostrará qué tipo de cliente ingresa a <b>${esc(safeText(st?.name,'Tienda sin nombre'))}</b>, la participación por <b>estrato</b> y por <b>estilo</b>, y demás variables de comportamiento para orientar la oferta.</p>
     <div class="prev"><span>Tipo de cliente</span><span>Estrato</span><span>Estilo</span><span>Participación %</span><span>Ticket</span></div>
   </div></div></div>`;}

/* ---------------- table helpers ---------------- */
function cmp(s,acc){const key=acc[s.sort]||(r=>0);
  return (a,b)=>{const x=key(a),y=key(b);
    if(typeof x==='number'&&typeof y==='number')return (x-y)*s.dir;
    return (''+x).localeCompare(''+y)*s.dir;};}
function tableHTML(quad,cols,rows){
  const s=state[quad];
  const head='<tr>'+cols.map(c=>{const sortable=c[1]!=='x';
    return `<th class="${c[2]?'num':''}" ${sortable?`data-sort="${c[1]}"`:''} style="${sortable?'':'cursor:default'}">${c[0]}${(sortable&&s.sort===c[1])?(s.dir<0?' ▾':' ▴'):''}</th>`;}).join('')+'</tr>';
  if(!rows.length)return `<div class="twrap"><div class="empty">Sin registros para este filtro 🎉</div></div>`;
  const colWeight=label=>/rango/i.test(label)?2.45:/producto|material|oportunidad|sublínea|sublinea/i.test(label)?2.25:/clasificación|clasificacion|responsable|compromiso|categoría|categoria|línea|linea|tienda/i.test(label)?1.5:/valor/i.test(label)?1.35:/código|codigo|fecha|creación|creacion|entrega/i.test(label)?1.05:.8;
  const weights=cols.map(c=>colWeight(c[0])),total=weights.reduce((a,b)=>a+b,0);
  const colgroup='<colgroup>'+weights.map(w=>`<col style="width:${(100*w/total).toFixed(3)}%">`).join('')+'</colgroup>';
  const body=rows.map(r=>'<tr>'+r.map((cell,i)=>`<td class="${cols[i][2]?'num':''}" data-label="${esc(cols[i][0])}">${cell}</td>`).join('')+'</tr>').join('');
  return `<div class="twrap"><table>${colgroup}<thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}
function wireTable(quad,fn){
  document.querySelectorAll(`#${quad}-tbl thead th[data-sort]`).forEach(th=>th.onclick=()=>{
    const s=state[quad],k=th.dataset.sort;
    if(s.sort===k)s.dir*=-1;else{s.sort=k;s.dir=-1;} fn();});
  document.querySelectorAll(`.chip.filt[data-q="${quad}"]`).forEach(ch=>{
    ch.classList.toggle('on',state[quad].f===ch.dataset.f);
    ch.onclick=()=>{state[quad].f=ch.dataset.f;fn();};});
  decorateActionColumn(quad);
}
function animateBars(){
  document.querySelectorAll('.chart[data-chart]').forEach(ch=>{
    const cols=[...ch.querySelectorAll('.col')],mx=Math.max(...cols.map(c=>+c.dataset.h),1);
    cols.forEach(c=>{c.style.height='0px';requestAnimationFrame(()=>{c.style.height=(6+96*(+c.dataset.h)/mx)+'px';});});});
}
/* ============================================================
   CARGA DE DATOS · Excel estructurado, JSON o Excel con appdata A1
   ============================================================ */
const normalizeHeader=v=>safeText(v,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
function sheetRows(wb,candidates){
  const wanted=candidates.map(normalizeHeader),name=wb.SheetNames.find(n=>wanted.includes(normalizeHeader(n)));if(!name)return [];
  const aoa=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:'',raw:true});if(!aoa.length)return [];
  const heads=aoa[0].map(normalizeHeader);return aoa.slice(1).filter(r=>r.some(v=>safeText(v,'')!=='')).map(r=>Object.fromEntries(heads.map((h,i)=>[h,r[i]])));
}
function pick(row,...keys){for(const k of keys){const v=row[normalizeHeader(k)];if(v!==undefined&&v!==null&&String(v).trim()!=='')return v;}return '';}
function buildDBFromWorkbook(wb){
  const meta={fecha:new Date().toISOString().slice(0,10),pais:'Colombia',lbl90:['91-120','121-150','151-180','181-210','211-240','241-360','+360'],base:'Plantilla Excel Llavero'};
  sheetRows(wb,['Meta']).forEach(r=>{const k=normalizeHeader(pick(r,'campo','clave','key')),v=pick(r,'valor','value');if(k)meta[k]=v;});
  const newDB={meta,P:{},S:{}};
  const ensureStore=(code,name='')=>{const c=safeCode(code);if(!newDB.S[c])newDB.S[c]={name:safeText(name,`Tienda ${c}`),kpi:{},rot:[],evac:[],ventas:[],ventasProducto:[],inventario:[],tr:[]};else if(name)newDB.S[c].name=safeText(name,newDB.S[c].name);return newDB.S[c];};
  sheetRows(wb,['Tiendas']).forEach(r=>ensureStore(pick(r,'codigo_tienda','tienda','codigo'),pick(r,'nombre_tienda','nombre')));
  sheetRows(wb,['Productos']).forEach(r=>{const c=safeCode(pick(r,'codigo_producto','codigo','material'));newDB.P[c]={n:safeText(pick(r,'nombre_producto','producto','nombre'),`Producto ${c}`),cat:safeText(pick(r,'categoria'),'SIN CLASIFICAR'),lin:safeText(pick(r,'linea'),'SIN LÍNEA'),sub:safeText(pick(r,'sublinea','sublínea'),'SIN SUBLÍNEA')};});
  sheetRows(wb,['Rotacion','Rotación']).forEach(r=>{const st=ensureStore(pick(r,'codigo_tienda','tienda'));st.rot.push([safeCode(pick(r,'codigo_producto','codigo','material')),toNum(pick(r,'unidades','unidades_tienda')),toNum(pick(r,'indice_antiguedad','bucket_antiguedad')),toNum(pick(r,'valor_inventario','valor')),toNum(pick(r,'precio_unitario','precio')),safeText(pick(r,'rango_antiguedad','antiguedad'),'SIN DEFINIR'),toNum(pick(r,'venta_mes_1','ventas_mes_1')),toNum(pick(r,'venta_mes_2','ventas_mes_2')),toNum(pick(r,'venta_mes_3','ventas_mes_3'))]);});
  sheetRows(wb,['Evacuacion','Evacuación']).forEach(r=>{const st=ensureStore(pick(r,'codigo_tienda','tienda'));st.evac.push([safeCode(pick(r,'codigo_producto','codigo','material')),toNum(pick(r,'unidades_tienda','unidades')),toNum(pick(r,'valor_inventario','valor')),toNum(pick(r,'respaldo_cendis','cendis')),toNum(pick(r,'venta_mes_1','ventas_mes_1')),toNum(pick(r,'venta_mes_2','ventas_mes_2')),safeText(pick(r,'rango_antiguedad','antiguedad'),'SIN DEFINIR')]);});
  sheetRows(wb,['Ventas']).forEach(r=>{const st=ensureStore(pick(r,'codigo_tienda','tienda'));st.ventas.push([safeText(pick(r,'categoria'),'SIN CATEGORÍA'),safeText(pick(r,'linea'),'SIN LÍNEA'),safeText(pick(r,'sublinea','sublínea'),'SIN SUBLÍNEA'),toNum(pick(r,'facturacion_3m','venta_3m','facturacion')),toNum(pick(r,'unidades_3m','unidades_vendidas')),toNum(pick(r,'stock_unidades','stock_piso')),toNum(pick(r,'stock_valor','valor_stock'))]);});
  sheetRows(wb,['VentasProducto','Ventas Producto']).forEach(r=>{const st=ensureStore(pick(r,'codigo_tienda','tienda'));st.ventasProducto.push([safeCode(pick(r,'codigo_producto','codigo','material')),toNum(pick(r,'facturacion_3m','venta_3m','facturacion')),toNum(pick(r,'unidades_3m','unidades_vendidas')),toNum(pick(r,'stock_unidades','stock_piso')),toNum(pick(r,'stock_valor','valor_stock'))]);});
  sheetRows(wb,['Traslados']).forEach(r=>{const st=ensureStore(pick(r,'codigo_tienda','tienda'));st.tr.push([safeCode(pick(r,'codigo_producto','codigo','material')),safeText(pick(r,'nombre_producto','producto','nombre'),''),toNum(pick(r,'unidades')),toNum(pick(r,'volumen_m3','volumen')),safeText(pick(r,'fecha_creacion','creacion'),''),safeText(pick(r,'fecha_entrega','entrega'),''),safeText(pick(r,'estado_picking','picking'),''),safeText(pick(r,'estado_movimiento','movimiento'),''),safeText(pick(r,'revision','fecha_revision'),'')]);});
  if(!Object.keys(newDB.S).length)throw new Error('No se encontraron tiendas. Revisa las hojas y encabezados de la plantilla.');return newDB;
}
function applyRoleUI(){
  IS_LEADER=AUTH.role==='leader';IS_ADMIN=AUTH.role==='admin';
  document.body.classList.remove('auth-pending');document.body.classList.toggle('leader-mode',IS_LEADER);document.body.classList.toggle('admin-mode',IS_ADMIN);document.body.classList.toggle('not-authenticated',!isAuthenticated());
  const btn=document.getElementById('roleBtn');if(btn){const roleLabel=IS_LEADER?'Líder de área':IS_ADMIN?safeText(S[AUTH.store]?.name,'Administrador'):'Ingresar';const roleIcon=IS_LEADER?'👤':IS_ADMIN?'🏬':'🔐';btn.classList.toggle('leader',IS_LEADER);btn.innerHTML=`<span class="topActionIcon">${roleIcon}</span><span class="topActionText">${esc(roleLabel)}</span>`;btn.title=isAuthenticated()?'Ver perfil o cerrar sesión':'Iniciar sesión';}
  const side=document.getElementById('sideRoleText');if(side)side.textContent=IS_LEADER?'Perfil: Líder de área':IS_ADMIN?`Administrador: ${safeText(S[AUTH.store]?.name,AUTH.store)}`:'Sin sesión iniciada';
  populateStoreSelect(IS_ADMIN?AUTH.store:CUR);
}
function openLeaderModal(force=false){const m=document.getElementById('leaderModal');if(!m)return;m.dataset.force=force?'1':'0';m.classList.add('on');const u=document.getElementById('accessUser'),p=document.getElementById('leaderPin'),e=document.getElementById('leaderError');if(e)e.style.display='none';if(u)u.value='';if(p)p.value='';setTimeout(()=>u?.focus(),80);}
function closeLeaderModal(){const m=document.getElementById('leaderModal');if(!m)return;if(!isAuthenticated()&&m.dataset.force==='1')return;m.classList.remove('on');}
function loginUser(){
  const user=safeText(document.getElementById('accessUser')?.value,'').toUpperCase().replace(/\s+/g,''),pin=document.getElementById('leaderPin')?.value||'';let next=null;
  if(user===LEADER_USER&&pin===atob(LEADER_PIN_B64))next={role:'leader',user:LEADER_USER};
  else if(STORE_CREDENTIALS[user]&&pin===STORE_CREDENTIALS[user].pin)next={role:'admin',user,store:STORE_CREDENTIALS[user].store};
  if(!next){const e=document.getElementById('leaderError');if(e)e.style.display='block';return;}
  AUTH=next;saveAuthSession(AUTH);applyRoleUI();document.getElementById('leaderModal')?.classList.remove('on');
  if(IS_LEADER){VIEW='dashboard';setActiveNav('dashboard');}else{CUR=AUTH.store;VIEW='resumen';setActiveNav('resumen');}
  refresh();toast(IS_LEADER?'Dashboard general habilitado':`Acceso habilitado: ${safeText(S[CUR]?.name,CUR)}`,'ok');
}
function logoutUser(){AUTH={role:'none'};IS_LEADER=false;IS_ADMIN=false;clearAuthSession();VIEW='resumen';applyRoleUI();document.getElementById('content').innerHTML='';openLeaderModal(true);toast('Sesión cerrada');}
function handleRoleButton(){if(isAuthenticated()){if(confirm('¿Cerrar la sesión actual?'))logoutUser();}else openLeaderModal(true);}
function requireAuth(){if(isAuthenticated())return true;openLeaderModal(true);toast('Debes iniciar sesión','err');return false;}
function requireLeader(){if(IS_LEADER)return true;toast('Esta función es exclusiva del líder de área','err');return false;}
function loadFile(input){
  if(!requireLeader()){if(input)input.value='';return;}
  const file=input.files[0];if(!file)return;input.value='';const status=document.getElementById('xlsxStatus');status.textContent='⏳ Leyendo…';status.style.display='inline-block';const ext=file.name.split('.').pop().toLowerCase(),reader=new FileReader();reader.onerror=()=>showStatus('❌ Error al leer el archivo',true);
  if(ext==='json'){reader.onload=e=>{try{applyNewDB(JSON.parse(e.target.result));}catch(err){showStatus('❌ Error JSON: '+err.message,true);}};reader.readAsText(file,'UTF-8');return;}
  if(ext==='csv'){reader.onload=e=>parseText(e.target.result);reader.readAsText(file,'UTF-8');return;}
  reader.onload=e=>{try{const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array',cellDates:false});const structured=['productos','tiendas','rotacion','evacuacion','ventas','ventasproducto','traslados'].some(x=>wb.SheetNames.some(n=>normalizeHeader(n)===x));if(structured){applyNewDB(buildDBFromWorkbook(wb));return;}const sheetName=wb.SheetNames.find(n=>normalizeHeader(n)==='appdata')||wb.SheetNames[0],sheet=wb.Sheets[sheetName],cell=sheet?.A1;if(!cell){showStatus('❌ No se encontró la plantilla ni un JSON en A1',true);return;}parseText(cell.v!=null?String(cell.v):XLSX.utils.sheet_to_csv(sheet));}catch(err){showStatus('❌ '+err.message,true);}};reader.readAsArrayBuffer(file);
}
function parseText(raw){try{const parsed=JSON.parse(String(raw).trim());if(parsed.meta&&parsed.S){applyNewDB(parsed);return;}if(parsed.stores){applyNewDB({meta:parsed.meta||DB.meta,P:parsed.P||DB.P,S:parsed.stores});return;}if(parsed.name&&parsed.kpi){const key=prompt('¿Código de tienda a actualizar? (ej: 95, 01, 85)');if(!key){showStatus('Cancelado',false);return;}DB.S[key]=parsed;sanitizeCurrentDB();populateStoreSelect(key);refresh();showStatus(`✅ Tienda ${safeText(parsed.name)} actualizada`,false);return;}showStatus('❌ Formato JSON no reconocido',true);}catch(e){showStatus('❌ JSON inválido: '+e.message,true);}}
function normalizeDB(input){
  if(!input||typeof input!=='object'||!input.S||typeof input.S!=='object')throw new Error('El JSON consolidado debe incluir el objeto S con las tiendas.');input.meta=input.meta||{};input.meta.fecha=safeText(input.meta.fecha,new Date().toISOString().slice(0,10));input.meta.lbl90=Array.isArray(input.meta.lbl90)&&input.meta.lbl90.length?input.meta.lbl90:['91-120','121-150','151-180','181-210','211-240','241-360','+360'];input.P=input.P&&typeof input.P==='object'?input.P:{};if(!Object.keys(input.S).length)throw new Error('El archivo no contiene tiendas.');
  Object.values(input.S).forEach(st=>{st.name=safeText(st.name,'Tienda sin nombre');st.kpi=st.kpi&&typeof st.kpi==='object'?st.kpi:{};['rot','evac','ventas','ventasProducto','tr'].forEach(k=>{if(!Array.isArray(st[k]))st[k]=[];});});input.meta.nStores=Object.keys(input.S).length;return input;
}
function applyNewDB(newDB,opts={}){try{newDB=normalizeDB(newDB);}catch(err){showStatus('❌ '+err.message,true);return;}DB.meta=newDB.meta||DB.meta;LBL=DB.meta.lbl90||LBL;Object.keys(P).forEach(k=>delete P[k]);Object.assign(P,newDB.P||{});Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,newDB.S||{});sanitizeCurrentDB();recordOperationalSnapshot();populateStoreSelect(IS_ADMIN?AUTH.store:CUR);VIEW=IS_LEADER?'dashboard':'resumen';setActiveNav(VIEW);refresh();if(!opts.skipPersist)saveDBSnapshot({meta:DB.meta,P,S});if(!opts.silent)showStatus(`✅ Corte diario ${safeText(DB.meta.fecha)} cargado · ${Object.keys(S).length} tiendas`,false);}

function showStatus(msg, isError) {
  const el = document.getElementById('xlsxStatus');
  el.textContent = msg;
  el.style.display = 'inline-block';
  el.style.background = isError ? 'rgba(239,77,90,.25)' : 'rgba(255,255,255,.12)';
  if (!isError) setTimeout(() => { el.style.display = 'none'; }, 5000);
}


/* ============================================================
   APPMIN PRO · seguimiento, persistencia, exportación y UX
   ============================================================ */
const ACTION_KEY='llavero_actions_v3_21stores', PREF_KEY='llavero_prefs_v3', IDB_NAME='llavero-v18-corrected-age-21stores', IDB_STORE='snapshots';
let ACTIONS={}; let activeAction=null;
try{ACTIONS=JSON.parse(localStorage.getItem(ACTION_KEY)||'{}')||{};}catch(e){ACTIONS={};}
const actionStoreKey=(store,quad,id)=>[store,quad,id].join('¦');
const statusClass=s=>s==='Completado'?'st-completado':s==='En gestión'?'st-gestion':s==='Bloqueado'?'st-bloqueado':'st-pendiente';
const statusIcon=s=>s==='Completado'?'✓':s==='En gestión'?'◐':s==='Bloqueado'?'!':'•';
function persistActions(){localStorage.setItem(ACTION_KEY,JSON.stringify(ACTIONS));refresh();}
function resolveActionLabel(store,quad,id){const st=S[store];if(!st)return id;
  if(quad==='rot'||quad==='evac')return productInfo(id).n;
  if(quad==='tr')return st.tr.find(r=>String(r[0])===String(id))?.[1]||id;
  if(quad==='vta'){try{return decodeURIComponent(id).split('¦').join(' · ');}catch(e){return id;}}
  return id;
}
function decorateActionColumn(quad){
  if(quad==='inventario')return;
  const table=document.querySelector(`#${quad}-tbl table`); if(!table)return;
  const hr=table.tHead?.rows?.[0]; if(!hr||hr.querySelector('[data-action-col]'))return;
  const th=document.createElement('th');th.textContent='Gestión';th.dataset.actionCol='1';th.style.cursor='default';hr.appendChild(th);
  [...table.tBodies[0].rows].forEach(tr=>{
    let id=''; if(quad==='evac')id=tr.cells[1]?.innerText.trim();else if(quad==='vta')id=encodeURIComponent([tr.cells[0]?.innerText.trim(),tr.cells[1]?.innerText.trim(),tr.cells[2]?.innerText.replace('🎯','').trim()].join('¦'));else id=tr.cells[0]?.innerText.trim();
    const a=ACTIONS[actionStoreKey(CUR,quad,id)]; const td=document.createElement('td');
    td.innerHTML=`<button class="actionBtn ${a?'has':''}" onclick="openActionEditor('${quad}','${id}')">${a?`${statusIcon(a.status)} ${esc(a.status)}`:'Gestionar'}</button>`;tr.appendChild(td);
  });
}
function openActionEditor(quad,id,store=CUR){
  if(IS_ADMIN&&store!==AUTH.store){toast('Solo puedes gestionar tu tienda','err');return;}
  const key=actionStoreKey(store,quad,id),a=ACTIONS[key]||{};activeAction={key,store,quad,id};
  document.getElementById('actionTitle').textContent=resolveActionLabel(store,quad,id);
  document.getElementById('actionSub').textContent=`${S[store]?.name||store} · ${quad==='rot'?'Rotación':quad==='evac'?'Evacuación':quad==='tr'?'Ambientes / traslado':quad==='vta'?'Ventas':'Seguimiento'}`;
  document.getElementById('actionStatus').value=a.status||'Pendiente';document.getElementById('actionOwner').value=a.owner||'';document.getElementById('actionDate').value=a.date||'';document.getElementById('actionPriority').value=a.priority||'Media';document.getElementById('actionNote').value=a.note||'';
  document.getElementById('deleteActionBtn').style.visibility=a.status?'visible':'hidden';document.getElementById('actionModal').classList.add('on');setTimeout(()=>document.getElementById('actionOwner').focus(),50);
}
function closeActionModal(){document.getElementById('actionModal').classList.remove('on');activeAction=null;}
function saveCurrentAction(){if(!activeAction)return;const owner=document.getElementById('actionOwner').value.trim(),note=document.getElementById('actionNote').value.trim();
  ACTIONS[activeAction.key]={store:activeAction.store,quad:activeAction.quad,id:activeAction.id,status:document.getElementById('actionStatus').value,owner,date:document.getElementById('actionDate').value,priority:document.getElementById('actionPriority').value,note,updatedAt:new Date().toISOString()};
  localStorage.setItem(ACTION_KEY,JSON.stringify(ACTIONS));closeActionModal();toast('Seguimiento guardado','ok');refresh();}
function deleteCurrentAction(){if(!activeAction)return;if(!confirm('¿Eliminar este seguimiento?'))return;delete ACTIONS[activeAction.key];localStorage.setItem(ACTION_KEY,JSON.stringify(ACTIONS));closeActionModal();toast('Seguimiento eliminado');refresh();}
function deadlineInfo(date,status){if(!date||status==='Completado')return {txt:date||'—',cls:''};const today=new Date();today.setHours(0,0,0,0);const d=new Date(date+'T00:00:00');const diff=Math.ceil((d-today)/86400000);return {txt:date,cls:diff<0?'deadlineLate':diff<=2?'deadlineSoon':''};}
function viewAcciones(){return `<div class="card"><div class="chead"><div class="cnum n4">✓</div><div><div class="tt">Plan de acción</div><div class="ds">Compromisos guardados en los cuadrantes y tiendas autorizadas</div></div><div class="rt"><button class="actionBtn" onclick="exportActionsCSV()">⬇ Exportar acciones</button></div></div><div class="cbody"><div class="actionSummary" id="action-summary"></div><div class="tbar"><div class="tsearch">🔎<input placeholder="Buscar tienda, producto, responsable o nota…" oninput="state.acciones.q=this.value;drawActions()"></div><span class="chip filt" data-q="acciones" data-f="all">Todos</span><span class="chip filt" data-q="acciones" data-f="Pendiente">Pendientes</span><span class="chip filt" data-q="acciones" data-f="En gestión">En gestión</span><span class="chip filt" data-q="acciones" data-f="Bloqueado">Bloqueados</span><span class="chip filt" data-q="acciones" data-f="Completado">Completados</span></div><div id="acciones-tbl"></div><div class="foot"><span id="acciones-cnt"></span><span>Los seguimientos se guardan automáticamente en este navegador.</span></div></div></div>`;}
function actionRows(){let rows=Object.entries(ACTIONS).map(([key,a])=>({...a,key,label:resolveActionLabel(a.store,a.quad,a.id),storeName:S[a.store]?.name||a.store}));if(IS_ADMIN)rows=rows.filter(a=>a.store===AUTH.store);return rows;}
function drawActions(){
  let rows=actionRows(),all=rows.slice(),s=state.acciones;const counts=x=>all.filter(a=>a.status===x).length;
  const summary=document.getElementById('action-summary');if(summary)summary.innerHTML=`<div class="mk r"><div class="l">Pendientes</div><div class="v">${counts('Pendiente')}</div></div><div class="mk"><div class="l">En gestión</div><div class="v" style="color:var(--brand)">${counts('En gestión')}</div></div><div class="mk b"><div class="l">Bloqueados</div><div class="v">${counts('Bloqueado')}</div></div><div class="mk g"><div class="l">Completados</div><div class="v">${counts('Completado')}</div></div>`;
  if(s.f!=='all')rows=rows.filter(a=>a.status===s.f);if(s.q){const q=s.q.toLowerCase();rows=rows.filter(a=>(a.storeName+a.label+(a.owner||'')+(a.note||'')).toLowerCase().includes(q));}
  rows.sort((a,b)=>{const da=a.date||'9999-12-31',db=b.date||'9999-12-31';return da.localeCompare(db)||String(b.updatedAt).localeCompare(String(a.updatedAt));});
  if(!rows.length){document.getElementById('acciones-tbl').innerHTML=`<div class="actionEmpty"><div class="big">✅</div><h3>No hay acciones en este filtro</h3><p>Abre Rotación, Evacuación, Ambientes o Ventas y usa el botón <b>Gestionar</b> para crear compromisos.</p></div>`;}
  else{const cols=[['Tienda','x',0],['Cuadrante','x',0],['Producto / oportunidad','x',0],['Estado','x',0],['Responsable','x',0],['Compromiso','x',0],['Prioridad','x',0],['Acción','x',0]];const body=rows.map(a=>{const d=deadlineInfo(a.date,a.status);return [`<b>${esc(a.storeName)}</b>`,esc(a.quad==='rot'?'Rotación':a.quad==='evac'?'Evacuación':a.quad==='tr'?'Ambientes':'Ventas'),`<div class="pname" title="${esc(a.label)}">${esc(a.label)}</div>`,`<span class="statusPill ${statusClass(a.status)}">${statusIcon(a.status)} ${esc(a.status)}</span>`,esc(a.owner||'—'),`<span class="${d.cls}">${esc(d.txt)}</span>`,esc(a.priority||'Media'),`<button class="actionBtn has" onclick="openActionEditor('${a.quad}','${a.id}','${a.store}')">Editar</button>`];});document.getElementById('acciones-tbl').innerHTML=tableHTML('acciones',cols,body);}
  document.getElementById('acciones-cnt').textContent=`${rows.length} acciones visibles · ${all.length} totales`;document.querySelectorAll('.chip.filt[data-q="acciones"]').forEach(ch=>{ch.classList.toggle('on',s.f===ch.dataset.f);ch.onclick=()=>{s.f=ch.dataset.f;drawActions();};});
}
function csvDownload(rows,name){const text='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
function exportCurrentViewCSV(){const table=document.querySelector('#content table');if(!table){toast('No hay una tabla visible para exportar','err');return;}const rows=[...table.rows].map(r=>[...r.cells].filter((_,i)=>i<r.cells.length-1||!r.cells[i].querySelector('.actionBtn')).map(c=>c.innerText.trim()));csvDownload(rows,`Llavero_${VIEW}_${S[CUR]?.name||CUR}_${DB.meta.fecha}.csv`);toast('Vista exportada','ok');}
function exportActionsCSV(){const rows=[['Tienda','Cuadrante','Elemento','Estado','Responsable','Fecha compromiso','Prioridad','Nota','Actualizado'],...actionRows().map(a=>[a.storeName,a.quad,a.label,a.status,a.owner||'',a.date||'',a.priority||'',a.note||'',a.updatedAt||''])];csvDownload(rows,`Llavero_plan_accion_${DB.meta.fecha}.csv`);}
function downloadBackup(){if(!requireLeader())return;const blob=new Blob([JSON.stringify(DB,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Llavero_respaldo_${DB.meta.fecha}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);toast('Respaldo generado','ok');}
function toggleTheme(){const dark=!document.body.classList.contains('dark');document.body.classList.toggle('dark',dark);document.getElementById('themeBtn').textContent=dark?'☀️':'🌙';localStorage.setItem(PREF_KEY,JSON.stringify({dark}));}
function toast(msg,type=''){const root=document.getElementById('toastStack'),el=document.createElement('div');el.className='toast '+type;el.textContent=msg;root.appendChild(el);setTimeout(()=>el.remove(),3200);}
function openIDB(){return new Promise((res,rej)=>{const q=indexedDB.open(IDB_NAME,1);q.onupgradeneeded=()=>q.result.createObjectStore(IDB_STORE);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
async function saveDBSnapshot(data){try{localStorage.setItem('llavero_snapshot_date',safeText(data?.meta?.fecha,''));const db=await openIDB();const tx=db.transaction(IDB_STORE,'readwrite');tx.objectStore(IDB_STORE).put(data,'latest');}catch(e){console.warn('No se pudo persistir la base',e);}}
async function loadDBSnapshot(){try{const db=await openIDB();return await new Promise((res,rej)=>{const q=db.transaction(IDB_STORE).objectStore(IDB_STORE).get('latest');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}catch(e){return null;}}
function handleDroppedFile(file){if(!file||!requireLeader())return;const dt=new DataTransfer();dt.items.add(file);const inp=document.getElementById('xlsxInput');inp.files=dt.files;loadFile(inp);}
async function initEnhancedApp(){
  applyRoleUI();
  if(!isAuthenticated())openLeaderModal(true);else {VIEW=IS_LEADER?'dashboard':'resumen';if(IS_ADMIN)CUR=AUTH.store;setActiveNav(VIEW);refresh();}
  try{const p=JSON.parse(localStorage.getItem(PREF_KEY)||'{}');if(p.dark){document.body.classList.add('dark');document.getElementById('themeBtn').textContent='☀️';}}catch(e){}
  ['dragenter','dragover'].forEach(ev=>document.addEventListener(ev,e=>{e.preventDefault();if(IS_LEADER)document.getElementById('dropOverlay').classList.add('on');}));['dragleave','drop'].forEach(ev=>document.addEventListener(ev,e=>{e.preventDefault();document.getElementById('dropOverlay').classList.remove('on');if(ev==='drop'&&IS_LEADER)handleDroppedFile(e.dataTransfer.files[0]);}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeInventoryProduct();closeActionModal();closeDataHelp();if(isAuthenticated())closeLeaderModal();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.getElementById('gsearch').focus();}});
  const embeddedDate=safeText(DB?.meta?.fecha,'');
  const savedDateHint=safeText(localStorage.getItem('llavero_snapshot_date'),'');
  /* Solo se lee la copia pesada de IndexedDB cuando el navegador informa que existe un corte posterior.
     El HTML distribuido ya contiene la base actual y no necesita duplicarla al abrirse. */
  if(savedDateHint&&savedDateHint>embeddedDate){
    const snap=await loadDBSnapshot();
    const savedDate=safeText(snap?.meta?.fecha,'');
    if(snap&&savedDate>embeddedDate)applyNewDB(snap,{silent:true,skipPersist:true});
  }
}

/* ─── Plantilla Excel estructurada ─── */
function showDataHelp(){if(!requireLeader())return;document.getElementById('dataHelpModal').classList.add('on');}
function closeDataHelp(){document.getElementById('dataHelpModal').classList.remove('on');}
function downloadTemplate(){
  if(!requireLeader())return;
  const wb=XLSX.utils.book_new(),add=(name,rows)=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),name);
  add('Instrucciones',[['PASO','DESCRIPCION'],[1,'No cambies los nombres de las hojas ni los encabezados.'],[2,'Usa el mismo codigo de tienda en todas las hojas.'],[3,'La hoja VentasProducto permite calcular producto mas vendido y menos vendido.'],[4,'Guarda el archivo como .xlsx y cárgalo desde Llavero.']]);
  add('Meta',[['CAMPO','VALOR'],['fecha',new Date().toISOString().slice(0,10)],['pais','Colombia'],['base','Plantilla Excel Llavero']]);
  add('Tiendas',[['CODIGO_TIENDA','NOMBRE_TIENDA'],['95','Norte']]);
  add('Productos',[['CODIGO_PRODUCTO','NOMBRE_PRODUCTO','CATEGORIA','LINEA','SUBLINEA'],['9999999','NOMBRE PRODUCTO','SOCIAL','SALAS','SOFA 3 PTOS']]);
  add('Rotacion',[['CODIGO_TIENDA','CODIGO_PRODUCTO','UNIDADES','INDICE_ANTIGUEDAD','VALOR_INVENTARIO','PRECIO_UNITARIO','RANGO_ANTIGUEDAD','VENTA_MES_1','VENTA_MES_2','VENTA_MES_3'],['95','9999999',1,6,1000000,1200000,'+360',0,0,0]]);
  add('Evacuacion',[['CODIGO_TIENDA','CODIGO_PRODUCTO','UNIDADES_TIENDA','VALOR_INVENTARIO','RESPALDO_CENDIS','VENTA_MES_1','VENTA_MES_2','RANGO_ANTIGUEDAD'],['95','9999999',1,1000000,0,0,0,'241 - 360']]);
  add('Ventas',[['CODIGO_TIENDA','CATEGORIA','LINEA','SUBLINEA','FACTURACION_3M','UNIDADES_3M','STOCK_UNIDADES','STOCK_VALOR'],['95','SOCIAL','SALAS','SOFA 3 PTOS',5000000,2,1,1000000]]);
  add('VentasProducto',[['CODIGO_TIENDA','CODIGO_PRODUCTO','FACTURACION_3M','UNIDADES_3M','STOCK_UNIDADES','STOCK_VALOR'],['95','9999999',5000000,2,1,1000000]]);
  add('Traslados',[['CODIGO_TIENDA','CODIGO_PRODUCTO','NOMBRE_PRODUCTO','UNIDADES','VOLUMEN_M3','FECHA_CREACION','FECHA_ENTREGA','ESTADO_PICKING','ESTADO_MOVIMIENTO','REVISION'],['95','9999999','NOMBRE PRODUCTO',1,0.5,'2026-07-01','2026-07-02','A','A','REVISAR']]);
  XLSX.writeFile(wb,'Plantilla_carga_Llavero.xlsx');
}

sanitizeCurrentDB();
initEnhancedApp();


/* ===== inline-script-4 ===== */
(function(){
  function syncTopCut(){
    var src=document.getElementById('fs'), dst=document.getElementById('topCut');
    if(src&&dst) dst.textContent=(src.textContent||'—').trim();
  }
  document.addEventListener('DOMContentLoaded',function(){
    syncTopCut();
    var src=document.getElementById('fs');
    if(src&&window.MutationObserver) new MutationObserver(syncTopCut).observe(src,{childList:true,subtree:true,characterData:true});
  });
})();


/* ===== llavero-v19-interactions ===== */
/* ===== Llavero v19 · funciones interactivas ===== */
state.resumen=state.resumen||{mode:'both'};
state.inventario.cat=state.inventario.cat||'';
state.inventario.lin=state.inventario.lin||'';
state.inventario.sub=state.inventario.sub||'';
state.vta.mode=state.vta.mode||'category';

function productImageUrl(code){
  const u=safeText(P?.[safeCode(code)]?.img,'');
  return /^https?:\/\//i.test(u)?u:'';
}
function imageThumb(code,cls=''){
  const url=productImageUrl(code),p=productInfo(code);
  if(!url)return `<span class="productThumb ${cls} noImage" title="Sin imagen disponible">▧</span>`;
  return `<button class="productThumb ${cls}" type="button" onclick="event.stopPropagation();openImageModal(${JSON.stringify(url)},${JSON.stringify(p.n)})" title="Ampliar imagen"><img loading="lazy" src="${esc(url)}" alt="${esc(p.n)}" onerror="this.closest('.productThumb').classList.add('noImage');this.closest('.productThumb').innerHTML='▧'"></button>`;
}
function openImageModal(url,title){
  if(!/^https?:\/\//i.test(url||''))return;
  document.getElementById('imageModalTitle').textContent=title||'Imagen del producto';
  document.getElementById('imageModalImg').src=url;
  document.getElementById('imageModalImg').alt=title||'Producto';
  document.getElementById('imageModal').classList.add('on');
}
function closeImageModal(){const m=document.getElementById('imageModal');if(m)m.classList.remove('on');const i=document.getElementById('imageModalImg');if(i)i.removeAttribute('src');}

function exactInventoryComposition(st){
  const rows=normalizeInventoryRows(st).filter(r=>r.stock>0);
  const bucket=type=>rows.filter(r=>type==='other'?!r.estados.includes('Rotación')&&!r.estados.includes('Evacuación'):r.estados.includes(type==='rot'?'Rotación':'Evacuación'));
  const calc=rs=>({products:rs.length,units:rs.reduce((a,r)=>a+r.stock,0),value:rs.reduce((a,r)=>a+r.valorInventario,0)});
  return {total:calc(rows),rot:calc(bucket('rot')),evac:calc(bucket('evac')),other:calc(bucket('other')),rows};
}
function summaryMetricPanel(st,kind){
  const m=exactInventoryComposition(st),isMoney=kind==='value',key=isMoney?'value':'units',total=m.total[key],fmt=isMoney?fMoneyCOP:fInt;
  const label=isMoney?'Valor del inventario':'Unidades del inventario',sub=isMoney?'Composición monetaria en pesos colombianos (COP).':'Composición por unidades físicas en la tienda.';
  const seg=(name,obj,cls,view)=>{const pct=total>0?obj[key]/total*100:0;return `<div class="summarySegment ${cls}" onclick="gotoView('${view}')"><div class="ssLabel">${name}</div><div class="ssValue">${fmt(obj[key])}${isMoney?'':' uds'}</div><div class="ssPct">${pct.toFixed(1)}%</div><div class="pageInteractiveHint">${fInt(obj.products)} productos</div></div>`};
  const rp=total?m.rot[key]/total*100:0,ep=total?m.evac[key]/total*100:0,op=Math.max(0,100-rp-ep);
  return `<section class="summaryMetricPanel"><div class="summaryMetricHead"><div><h3>${label}</h3><p>${sub}</p></div><div class="summaryMetricTotal"><b>${fmt(total)}${isMoney?'':' uds'}</b><span>${fInt(m.total.products)} referencias</span></div></div><div class="summarySegments">${seg('Rotación',m.rot,'rot','rot')}${seg('Evacuación',m.evac,'evac','evac')}${seg('Otros estados',m.other,'other','inventario')}</div><div class="summaryStack"><span style="width:${rp}%;background:var(--rot)"></span><span style="width:${ep}%;background:var(--evac)"></span><span style="width:${op}%;background:#8f939a"></span></div></section>`;
}
function setSummaryMode(mode){state.resumen.mode=mode;refresh();}
function summaryMetricSwitcher(){
  const mode=state.resumen.mode||'both';
  return `<div class="summaryModeBar"><div><b>Lectura del inventario</b><br><span>Cambia entre unidades, valor en pesos o ambas perspectivas.</span></div><div class="segmented"><button class="${mode==='units'?'on':''}" onclick="setSummaryMode('units')">Unidades</button><button class="${mode==='value'?'on':''}" onclick="setSummaryMode('value')">Pesos</button><button class="${mode==='both'?'on':''}" onclick="setSummaryMode('both')">Juntos</button></div></div>`;
}
function summaryMetricsView(st){const mode=state.resumen.mode||'both';return `<div class="summaryMetricGrid ${mode==='both'?'':'single'}">${mode!=='value'?summaryMetricPanel(st,'units'):''}${mode!=='units'?summaryMetricPanel(st,'value'):''}</div>`;}

function inventoryStateRows(st,stateName){return normalizeInventoryRows(st).filter(r=>r.stock>0&&r.estados.includes(stateName));}
function exactRangeStats(st,stateName='Rotación'){
  const stats=(LBL||[]).map((label,i)=>({label,index:i,units:0,products:new Set(),items:[]}));
  inventoryStateRows(st,stateName).forEach(r=>{
    const unitValue=r.stock>0?r.valorInventario/r.stock:0;
    Object.entries(r.rangos||{}).forEach(([label,qty])=>{
      const idx=ageRankFromLabel(label),u=toNum(qty);if(idx<0||!stats[idx]||u<=0)return;
      stats[idx].units+=u;stats[idx].products.add(r.c);stats[idx].items.push({r,units:u,value:u*unitValue,label:canonicalAgeLabel(label)});
    });
  });
  return stats.map(x=>({...x,productsCount:x.products.size}));
}
function summaryProductRows(st,stateName,limit=7){
  return inventoryStateRows(st,stateName).map(r=>{const entries=sortedAgeEntries(r.rangos).filter(([a])=>ageRankFromLabel(a)>=0),units=entries.reduce((a,[,u])=>a+toNum(u),0),oldest=Math.max(-1,...entries.map(([a])=>ageRankFromLabel(a)));return {r,entries,units,oldest};}).filter(x=>x.units>0).sort((a,b)=>b.oldest-a.oldest||b.units-a.units||b.r.valorInventario-a.r.valorInventario).slice(0,limit);
}
function summaryProductList(st,stateName){
  const rows=summaryProductRows(st,stateName);
  return `<div class="summaryProductList">${rows.length?rows.map(x=>`<div class="summaryProductRow" onclick="openInventoryProduct(${JSON.stringify(x.r.c)})"><div><div class="summaryProductName" title="${esc(x.r.p.n)}">${esc(x.r.p.n)}</div><div class="summaryProductMeta">${x.entries.map(([a,u])=>`${fInt(u)} u · ${esc(canonicalAgeLabel(a))}`).join(' · ')}</div></div><div class="summaryProductUnits">${fInt(x.units)} uds</div></div>`).join(''):'<div class="empty">Sin productos en este estado.</div>'}</div>`;
}
function rangeChartHtml(st,stateName='Rotación',compact=false){
  const stats=exactRangeStats(st,stateName);
  return `<div class="chart" data-chart>${stats.map((x,i)=>`<div class="bar clickableBar" data-range="${i}" onclick="openRangeDetail('${stateName}',${i})" title="Ver ${x.productsCount} productos y ${x.units} unidades"><div class="cv dualMetric" style="color:${AGECOL[i]}"><b>${fInt(x.units)} uds</b><span>${fInt(x.productsCount)} prod.</span></div><div class="col" data-h="${x.units}" style="background:${AGECOL[i]}"></div><div class="cl">${esc(x.label)}</div></div>`).join('')}</div>`;
}
function openRangeDetail(stateName,index){
  const st=S[CUR]||{},stat=exactRangeStats(st,stateName)[index];if(!stat)return;
  const items=[...stat.items].sort((a,b)=>b.units-a.units||b.value-a.value||a.r.p.n.localeCompare(b.r.p.n));
  document.getElementById('rangeModalTitle').textContent=`${stateName} · ${stat.label} días`;
  document.getElementById('rangeModalSubtitle').textContent=`${safeText(st.name,CUR)} · detalle exacto por producto`;
  const rows=items.map(x=>`<tr onclick="closeRangeModal();openInventoryProduct(${JSON.stringify(x.r.c)})"><td>${imageThumb(x.r.c,'sm')}</td><td><span class="code">${esc(x.r.c)}</span></td><td><b>${esc(x.r.p.n)}</b><div style="font-size:9.5px;color:var(--mut);margin-top:2px">${esc(x.r.p.cat)} · ${esc(x.r.p.lin)} · ${esc(x.r.p.sub)}</div></td><td class="num"><b>${fInt(x.units)}</b></td><td class="num">${fMoneyCOP(x.value)}</td></tr>`).join('');
  document.getElementById('rangeModalBody').innerHTML=`<div class="rangeModalSummary"><div class="rangeStat"><label>Rango</label><b>${esc(stat.label)}</b></div><div class="rangeStat"><label>Unidades</label><b>${fInt(stat.units)}</b></div><div class="rangeStat"><label>Productos</label><b>${fInt(stat.productsCount)}</b></div></div><div class="twrap" style="max-height:58vh"><table class="rangeProductTable"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th class="num">Unidades</th><th class="num">Valor estimado</th></tr></thead><tbody>${rows||'<tr><td colspan="5">Sin productos.</td></tr>'}</tbody></table></div>`;
  document.getElementById('rangeModal').classList.add('on');
}
function closeRangeModal(){document.getElementById('rangeModal')?.classList.remove('on');}

viewResumen=function(st){
  st=st&&typeof st==='object'?st:{name:'Tienda sin datos',kpi:{},rot:[],evac:[],ventas:[],ventasProducto:[],inventario:[],tr:[]};st.kpi=st.kpi||{};const k=st.kpi,topCat=catTotals(st).slice(0,5);
  return `<div class="kgrid">${statTile('k-rot','⟳','i-rot','Rotación pendiente',fInt(k.rotN),`${fInt(k.rotU)} uds · ${fMoney(k.rotVal)}`,'rot')}${statTile('k-evac','⇲','i-evac','Por evacuar',fInt(k.evacN),`${fInt(k.evacU)} uds · ${fMoney(k.evacVal)}`,'evac')}${statTile('k-sr','!','i-sr','Sin respaldo CENDIS',fInt(k.evacSR),'salen primero','evac')}${statTile('k-amb','⇄','i-amb','Traslados en camino',fInt(k.trN),`${fInt(k.trU)} uds · ${fInt(k.trVol)} m³`,'amb')}${statTile('k-vta','📊','i-vta','Ventas últ. 3 meses',fMoney(k.vtot),`${fInt(k.vU)} uds facturadas`,'vta')}</div>${summaryMetricSwitcher()}${summaryMetricsView(st)}${storeDailyManagementPanel(CUR)}<div class="two"><div class="card"><div class="chead"><div class="cnum n1">1</div><div><div class="tt">Rotación por antigüedad</div><div class="ds">Presiona un rango para ver productos y unidades</div></div><div class="rt"><span class="badge warm">${fInt(inventoryStateRows(st,'Rotación').length)} productos</span></div></div><div class="cbody">${rangeChartHtml(st,'Rotación',true)}${summaryProductList(st,'Rotación')}<div class="foot"><span>Las unidades se muestran por producto y rango.</span><a class="chip" onclick="gotoView('rot')">Ver rotación →</a></div></div></div><div class="card"><div class="chead"><div class="cnum n2">2</div><div><div class="tt">Evacuación por antigüedad</div><div class="ds">Unidades exactas de cada producto por rango</div></div><div class="rt"><span class="badge hot">${fInt(inventoryStateRows(st,'Evacuación').length)} productos</span></div></div><div class="cbody">${rangeChartHtml(st,'Evacuación',true)}${summaryProductList(st,'Evacuación')}<div class="foot"><span>Presiona un producto para abrir su detalle.</span><a class="chip" onclick="gotoView('evac')">Ver evacuación →</a></div></div></div><div class="card"><div class="chead"><div class="cnum n4">4</div><div><div class="tt">Ventas por categoría</div><div class="ds">Cada barra abre el detalle filtrado</div></div><div class="rt"><span class="badge" style="background:var(--vtaBg);color:var(--vta)">${fMoney(k.vtot)}</span></div></div><div class="cbody"><div class="chart" data-chart>${topCat.map((c,i)=>{const col=CATCOL[i%CATCOL.length];return `<div class="bar salesBar" onclick="openSalesCategory(${JSON.stringify(c[0])})"><div class="cv" style="color:${col}">${fMoney(c[1])}</div><div class="col" data-h="${c[1]}" style="background:${col}"></div><div class="cl" title="${esc(c[0])}">${esc(c[0].slice(0,12))}</div></div>`;}).join('')}</div><div class="foot"><span>Participación por categoría</span><a class="chip" onclick="gotoView('vta')">Ver ventas →</a></div></div></div><div class="card clickableSummaryCard60" role="button" tabindex="0" onclick="if(!event.target.closest('a,button,.mk'))gotoView('traslados')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();gotoView('traslados')}"><div class="chead"><div class="cnum n3">3</div><div><div class="tt">Traslados de la tienda</div><div class="ds">Seguimiento de picking y movimiento de mercancía</div></div><div class="rt"><span class="badge cool">${fInt(k.trN)} traslados</span></div></div><div class="cbody"><div class="mkpis"><div class="mk r clickable" onclick="gotoView('traslados')"><div class="l">Total traslados</div><div class="v">${fInt(k.trN)}</div></div><div class="mk r clickable" onclick="gotoView('traslados')"><div class="l">Pend. picking</div><div class="v">${fInt(k.trPick)}</div></div><div class="mk r clickable" onclick="gotoView('traslados')"><div class="l">Pend. mov.</div><div class="v">${fInt(k.trMov)}</div></div><div class="mk a clickable" onclick="gotoView('traslados')"><div class="l">Uds en traslado</div><div class="v">${fInt(k.trU||0)}</div></div></div><div class="foot"><span>Movimientos pendientes</span><a class="chip" onclick="gotoView('traslados')">Ver traslados →</a></div></div></div><div class="card clickableSummaryCard60" role="button" tabindex="0" onclick="if(!event.target.closest('a,button,.mk'))gotoView('amb')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();gotoView('amb')}"><div class="chead"><div class="cnum n5">5</div><div><div class="tt">Ambientes de la tienda</div><div class="ds">Exhibición y presencia actual en sala</div></div><div class="rt"><span class="badge cool">${fInt(k.exhib)} exhibidas</span></div></div><div class="cbody"><div class="mkpis"><div class="mk a clickable" onclick="gotoView('amb')"><div class="l">Uds exhibidas</div><div class="v">${fInt(k.exhib)}</div></div><div class="mk a clickable" onclick="gotoView('amb')"><div class="l">Ref. con presencia</div><div class="v">${fInt(k.pres)}</div></div><div class="mk a clickable" onclick="gotoView('amb')"><div class="l">Prom. uds/ref</div><div class="v">${k.pres?(k.exhib/k.pres).toFixed(1):'0.0'}</div></div><div class="mk a clickable" onclick="gotoView('amb')"><div class="l">Guías disponibles</div><div class="v">${fInt((typeof G==='object'&&G)?Object.keys(G).length:0)}</div></div></div><div class="foot"><span>Exhibición y presencia</span><a class="chip" onclick="gotoView('amb')">Ver ambientes →</a></div></div></div></div>`;
};

function rotationDetailedRows(st){
  const sales=new Map(normalizeRotRows(st).map(r=>[r.c,r.sales3m]));
  return inventoryStateRows(st,'Rotación').map(r=>{const entries=sortedAgeEntries(r.rangos).filter(([a])=>ageRankFromLabel(a)>=0),u=entries.reduce((a,[,q])=>a+toNum(q),0),age=Math.max(-1,...entries.map(([a])=>ageRankFromLabel(a))),val=r.stock>0?r.valorInventario*(u/r.stock):0;return {...r,u,age,val,sales3m:toNum(sales.get(r.c)),entries};}).filter(r=>r.u>0);
}
viewRot=function(st){const rows=rotationDetailedRows(st),u=rows.reduce((a,r)=>a+r.u,0),v=rows.reduce((a,r)=>a+r.val,0),sin=rows.filter(r=>r.sales3m<=0).length;return `<div class="card"><div class="chead"><div class="cnum n1">1</div><div><div class="tt">Rotación</div><div class="ds">Distribución exacta de unidades por rango; cada barra es clickeable</div></div><div class="rt"><span class="badge warm">${fInt(rows.length)} productos</span></div></div><div class="cbody"><div class="mkpis"><div class="mk r"><div class="l">Productos</div><div class="v">${fInt(rows.length)}</div></div><div class="mk r"><div class="l">Unidades &gt;90d</div><div class="v">${fInt(u)}</div></div><div class="mk r"><div class="l">Valor detenido</div><div class="v">${fMoney(v)}</div></div><div class="mk b"><div class="l">Sin venta 3 meses</div><div class="v">${fInt(sin)}</div></div></div><div><div class="legend" style="margin-bottom:4px"><b>Presiona un rango para ver cuántos productos y unidades contiene</b></div><div id="rot-chart"></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-rot" placeholder="Buscar producto o código…" oninput="state.rot.q=this.value;drawRot()"></div><span class="chip filt" data-q="rot" data-f="all">Todos</span><span class="chip filt" data-q="rot" data-f="crit">+180 días</span><span class="chip filt" data-q="rot" data-f="a360">+360 días</span><span class="chip filt" data-q="rot" data-f="novta">Sin venta 3m</span></div><div id="rot-tbl"></div><div class="foot"><span id="rot-cnt"></span><span>Haz clic sobre una fila para abrir el producto.</span></div></div></div>`;};
drawRot=function(){
  const st=S[CUR]||{},s=state.rot;let rows=rotationDetailedRows(st),all=rows.slice();
  if(s.f==='crit')rows=rows.filter(r=>r.age>=3);if(s.f==='a360')rows=rows.filter(r=>r.age>=6);if(s.f==='novta')rows=rows.filter(r=>r.sales3m<=0);if(s.q){const q=String(s.q).toLowerCase();rows=rows.filter(r=>(r.p.n+' '+r.c+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub).toLowerCase().includes(q));}
  const ch=document.getElementById('rot-chart');if(ch)ch.innerHTML=rangeChartHtml(st,'Rotación');
  if(s.sort==='age')rows.sort((a,b)=>(a.age-b.age)*s.dir||b.val-a.val||b.u-a.u);else rows.sort(cmp(s,{c:r=>r.c,p:r=>r.p.n,age:r=>r.age,u:r=>r.u,val:r=>r.val,vta:r=>r.sales3m}));
  const cols=[['Código','c',0],['Producto','p',0],['Cat / Línea','x',0],['Unidades por rango','age',0],['Uds >90d','u',1],['Valor detenido','val',1],['Ventas 3m','vta',1]];
  const body=rows.map(r=>[`<span class="code">${esc(r.c)}</span>`,`<button class="productOpen" onclick="event.stopPropagation();openInventoryProduct(${JSON.stringify(r.c)})">${esc(r.p.n)}</button>`,`<span style="color:var(--mut);font-size:11px">${esc(r.p.cat)} · ${esc(r.p.lin)}</span>`,invAgeHtml(Object.fromEntries(r.entries),r.u),`<b>${fInt(r.u)}</b>`,`<b style="color:var(--rot)">${fMoneyCOP(r.val)}</b>`,r.sales3m>0?`<b>${fInt(r.sales3m)} uds</b>`:'<span class="tag sr">SIN VENTA</span>']);
  const tbl=document.getElementById('rot-tbl');if(tbl){tbl.innerHTML=tableHTML('rot',cols,body);tbl.querySelectorAll('tbody tr').forEach((tr,i)=>{tr.classList.add('salesClickableRow');tr.onclick=()=>openInventoryProduct(rows[i].c);});}const cnt=document.getElementById('rot-cnt');if(cnt)cnt.textContent=`Mostrando ${rows.length} de ${all.length} productos`;wireTable('rot',drawRot);animateBars();
};

function inventoryFilterValues(rows,key){return [...new Set(rows.map(r=>safeText(r.p[key],'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));}
function setSelectOptions(id,values,current,label){const el=document.getElementById(id);if(!el)return;el.innerHTML=`<option value="">${label}</option>`+values.map(v=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(v)}</option>`).join('');}
function syncInventoryFilters(all){
  const s=state.inventario;const cats=inventoryFilterValues(all,'cat');if(s.cat&&!cats.includes(s.cat))s.cat='';
  const catRows=s.cat?all.filter(r=>r.p.cat===s.cat):all;const lins=inventoryFilterValues(catRows,'lin');if(s.lin&&!lins.includes(s.lin))s.lin='';
  const linRows=s.lin?catRows.filter(r=>r.p.lin===s.lin):catRows;const subs=inventoryFilterValues(linRows,'sub');if(s.sub&&!subs.includes(s.sub))s.sub='';
  setSelectOptions('inv-cat',cats,s.cat,'Todas las categorías');setSelectOptions('inv-lin',lins,s.lin,'Todas las líneas');setSelectOptions('inv-sub',subs,s.sub,'Todas las sublíneas');
}
function clearInventoryClassFilters(){state.inventario.cat=state.inventario.lin=state.inventario.sub='';drawInventario();}
viewInventario=function(st){const x=inventorySummary(st);return `<div class="card"><div class="chead"><div class="cnum n4">▤</div><div><div class="tt">Inventario de la tienda</div><div class="ds">Imágenes, clasificación, unidades y antigüedad por producto</div></div><div class="rt"><span class="badge mut">${fInt(x.refs)} referencias</span></div></div><div class="cbody"><div class="inventoryKpis"><div class="inventoryKpi"><div class="ikLabel">Referencias con stock</div><div class="ikValue">${fInt(x.refs)}</div><div class="ikMeta">Códigos de producto</div></div><div class="inventoryKpi"><div class="ikLabel">Unidades en tienda</div><div class="ikValue">${fInt(x.units)}</div><div class="ikMeta">Stock total</div></div><div class="inventoryKpi"><div class="ikLabel">Con respaldo CENDIS</div><div class="ikValue">${fInt(x.supported)}</div><div class="ikMeta">Referencias con disponibilidad</div></div><div class="inventoryKpi"><div class="ikLabel">Valor del inventario</div><div class="ikValue">${fMoneyCOP(x.value)}</div><div class="ikMeta">Pesos colombianos</div></div><div class="inventoryKpi"><div class="ikLabel">Críticos +360 días</div><div class="ikValue" style="color:var(--jamar)">${fInt(x.critical)}</div><div class="ikMeta">Referencias críticas</div></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-inventario" placeholder="Buscar código, producto o familia…" oninput="state.inventario.q=this.value;drawInventario()"></div><span class="chip filt" data-q="inventario" data-f="all">Todo</span><span class="chip filt" data-q="inventario" data-f="rot">Rotación</span><span class="chip filt" data-q="inventario" data-f="evac">Evacuación</span><span class="chip filt" data-q="inventario" data-f="360">+360 días</span><span class="chip filt" data-q="inventario" data-f="sr">Sin respaldo</span></div><div class="invFilterPanel"><select id="inv-cat" onchange="state.inventario.cat=this.value;state.inventario.lin='';state.inventario.sub='';drawInventario()"></select><select id="inv-lin" onchange="state.inventario.lin=this.value;state.inventario.sub='';drawInventario()"></select><select id="inv-sub" onchange="state.inventario.sub=this.value;drawInventario()"></select><button class="invClearBtn" onclick="clearInventoryClassFilters()">Limpiar clasificación</button><span class="pageInteractiveHint">Presiona la imagen o cualquier fila</span></div><div id="inventario-tbl"></div><div class="foot"><span id="inventario-cnt"></span><span>La imagen se amplía; la fila abre la ficha detallada.</span></div></div></div>`;};
function inventoryTableHTML(rows){
  const cols=['Imagen','Código','Producto','Clasificación','Estado','Stock','Unidades por rango','CENDIS','Valor'];
  const body=rows.map(r=>`<tr class="inventoryRow" data-code="${esc(r.c)}" tabindex="0"><td>${imageThumb(r.c)}</td><td><span class="code">${esc(r.c)}</span></td><td><button class="productOpen" onclick="event.stopPropagation();openInventoryProduct(${JSON.stringify(r.c)})" title="Ver detalle completo">${esc(r.p.n)}</button></td><td><div class="classificationCell"><span><b>Categoría:</b> ${esc(r.p.cat)}</span><span><b>Línea:</b> ${esc(r.p.lin)}</span><span><b>Sublínea:</b> ${esc(r.p.sub)}</span></div></td><td>${invStateHtml(r.estados)}</td><td class="num"><b>${fInt(r.stock)}</b></td><td>${invAgeHtml(r.rangos,r.stock)}</td><td class="num">${r.dispCendis>0?`<span class="tag cr">${fInt(r.dispCendis)} u</span>`:'<span class="tag sr">0 u</span>'}</td><td class="num"><b>${fMoneyCOP(r.valorInventario)}</b></td></tr>`).join('');
  return `<div class="twrap"><table><colgroup>${cols.map(()=>'<col>').join('')}</colgroup><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${body||`<tr><td colspan="9"><div class="empty">Sin registros para este filtro.</div></td></tr>`}</tbody></table></div>`;
}
drawInventario=function(){
  const st=S[CUR]||{},s=state.inventario,all=normalizeInventoryRows(st).filter(r=>r.stock>0);syncInventoryFilters(all);let rows=all.slice();
  if(s.f==='rot')rows=rows.filter(r=>r.estados.includes('Rotación'));if(s.f==='evac')rows=rows.filter(r=>r.estados.includes('Evacuación'));if(s.f==='360')rows=rows.filter(r=>Object.keys(r.rangos||{}).some(x=>ageRankFromLabel(x)>=6));if(s.f==='sr')rows=rows.filter(r=>r.dispCendis<=0);if(s.cat)rows=rows.filter(r=>r.p.cat===s.cat);if(s.lin)rows=rows.filter(r=>r.p.lin===s.lin);if(s.sub)rows=rows.filter(r=>r.p.sub===s.sub);if(s.q){const q=s.q.toLowerCase();rows=rows.filter(r=>(r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub+' '+safeText(r.familia,'')+' '+safeText(r.matriz,'')).toLowerCase().includes(q));}
  rows.sort(cmp(s,{c:r=>r.c,p:r=>r.p.n,state:r=>r.estados.join(' '),stock:r=>r.stock,age:r=>Math.max(-1,...Object.keys(r.rangos||{}).map(ageRankFromLabel)),cendis:r=>r.dispCendis,value:r=>r.valorInventario}));
  const el=document.getElementById('inventario-tbl');if(el){el.innerHTML=inventoryTableHTML(rows);el.querySelectorAll('.inventoryRow').forEach(tr=>{tr.onclick=()=>openInventoryProduct(tr.dataset.code);tr.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openInventoryProduct(tr.dataset.code);}};});}
  const cnt=document.getElementById('inventario-cnt');if(cnt)cnt.textContent=`Mostrando ${rows.length} de ${all.length} referencias con inventario`;document.querySelectorAll('.chip.filt[data-q="inventario"]').forEach(ch=>{ch.classList.toggle('on',s.f===ch.dataset.f);ch.onclick=()=>{s.f=ch.dataset.f;drawInventario();};});
};
openInventoryProduct=function(code){
  const st=S[CUR]||{},r=normalizeInventoryRows(st).find(x=>x.c===safeCode(code));if(!r){openProductFromSales(code);return;}const transfers=(st.trDetalle||[]).filter(t=>safeCode(t.codigo)===r.c),ranges=sortedAgeEntries(r.rangos),mx=Math.max(1,...ranges.map(([,u])=>toNum(u))),defined=ageDefinedUnits(r.rangos),undefinedQty=toNum(r.rangos?.['SIN DEFINIR']);document.getElementById('inventoryProductTitle').textContent=r.p.n;document.getElementById('inventoryProductSubtitle').textContent=`Código ${r.c} · ${safeText(st.name,CUR)}`;const item=(l,v)=>`<div class="detailItem"><label>${esc(l)}</label><b>${esc(safeText(v,'—'))}</b></div>`;
  document.getElementById('inventoryProductBody').innerHTML=`<div class="detailHero detailHeroWithImage">${imageThumb(r.c,'lg')}<div class="detailHeroText"><h3>${esc(r.p.n)}</h3><p>${esc(r.p.cat)} · ${esc(r.p.lin)} · ${esc(r.p.sub)}</p><div style="margin-top:7px">${invStateHtml(r.estados)}</div></div><div class="detailHeroValue"><b>${fMoneyCOP(r.valorInventario)}</b><span>Valor total del inventario</span></div></div><div class="detailSections"><section class="detailSection"><div class="detailSectionTitle">Identificación del producto</div><div class="detailGrid">${item('Código',r.c)}${item('Código SAP',r.codigoSap)}${item('Categoría',r.p.cat)}${item('Línea',r.p.lin)}${item('Sublínea',r.p.sub)}${item('Marca',r.marca)}${item('Matriz',r.matriz)}${item('Ciclo de vida',r.cicloVida)}${item('Estilo',r.estilo)}${item('Familia',r.familia)}${item('Grupo sublínea',r.grupoSublinea)}${item('Surtido',r.surtido)}</div></section><section class="detailSection"><div class="detailSectionTitle">Inventario y abastecimiento</div><div class="detailGrid">${item('Stock total',fInt(r.stock)+' unidades')}${item('Unidades con rango definido',fInt(defined)+' unidades')}${item('Unidades sin definir',fInt(undefinedQty)+' unidades')}${item('Valor promedio por unidad',fMoneyCOP(r.valorUnitarioPromedio))}${item('Disponible',r.disponible===null?'Sin dato en este corte':fInt(r.disponible)+' unidades')}${item('Exhibidas',r.exhibidas===null?'Sin dato en este corte':fInt(r.exhibidas)+' unidades')}${item('Presencia',r.presencia===null?'Sin dato en este corte':fInt(r.presencia))}${item('Disponibilidad CENDIS',fInt(r.dispCendis)+' unidades')}${item('Entradas previstas',fInt(r.entradas)+' unidades')}${item('Unidades en OC',fInt(r.unidadesOC))}${item('Fecha recibido',r.fechaRecibido)}${item('Estado abastecimiento',r.estadoAbastecimiento)}</div>${r.antiguedadInconsistente?'<div class="ageDataAlert bad">La suma de unidades por rango no coincide con el stock total de la fuente. Requiere validación.</div>':''}</section><section class="detailSection full"><div class="detailSectionTitle">Distribución exacta por rango de antigüedad</div><div class="ageDistribution">${ranges.length?ranges.map(([a,u])=>{const label=canonicalAgeLabel(a);return `<div class="ageDistRow"><b>${esc(label)}</b><div class="ageDistTrack"><div class="ageDistFill ${label==='360 - Más'?'criticalFill':''}" style="width:${Math.max(4,toNum(u)/mx*100)}%"></div></div><div class="ageDistQty"><strong>${fInt(u)} u</strong></div></div>`;}).join(''):'<div class="empty">No hay rangos de antigüedad registrados.</div>'}</div><div class="sourceNote">Fuente: ${esc(safeText(r.fuenteAntiguedad,'Inventario Art'))} · Bodega ${esc(safeText(r.fuenteBodegaCodigo,''))}</div></section><section class="detailSection"><div class="detailSectionTitle">Valores del producto</div><div class="detailGrid">${item('Precio oferta',fMoneyCOP(r.precioOferta))}${item('Precio lista',fMoneyCOP(r.precioLista))}${item('Valor promedio inventario',fMoneyCOP(r.valorUnitarioPromedio))}${item('Valor inventario',fMoneyCOP(r.valorInventario))}${item('Bodegaje',fMoneyCOP(r.bodegaje))}${item('Margen oferta',toNum(r.margenOferta)?(toNum(r.margenOferta)*100).toFixed(1)+'%':'—')}${item('Contribución bruta',fMoneyCOP(r.contribucionBruta))}</div></section><section class="detailSection"><div class="detailSectionTitle">Información de movimiento</div><div class="detailGrid">${item('Facturación últimos 3 meses',fMoneyCOP(r.facturacionUlt3Meses))}${item('Unidades facturadas 3 meses',fInt(r.unidadesFacUlt3Meses))}${item('Unidades facturadas',fInt(r.unidadesFacturadas))}${item('Valor oferta facturada',fMoneyCOP(r.valorOfertaFacturada))}</div></section><section class="detailSection full"><div class="detailSectionTitle">Traslados relacionados</div>${transfers.length?`<div class="transferTableWrap"><table class="transferMini"><thead><tr><th>Entrega</th><th>Unidades</th><th>Fecha entrega</th><th>Picking</th><th>Movimiento</th><th>Estatus</th></tr></thead><tbody>${transfers.slice(0,30).map(t=>`<tr><td>${esc(t.entrega)}</td><td>${fInt(t.unidades)}</td><td>${esc(safeText(t.fechaEntrega,'—'))}</td><td>${esc(safeText(t.statusGlobalPicking,'—'))}</td><td>${esc(safeText(t.statusMovimiento,'—'))}</td><td>${esc(safeText(t.estatus,'—'))}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No hay traslados relacionados con este producto.</div>'}</section></div>`;document.getElementById('inventoryProductModal').classList.add('on');
};

function setSalesMode(mode){state.vta.mode=mode;state.vta.f='all';refresh();}
function openSalesCategory(cat){state.vta.mode='category';state.vta.f=cat;gotoView('vta');}
function openSalesProduct(code){state.vta.mode='product';gotoView('vta');setTimeout(()=>{state.vta.q=safeCode(code);const q=document.getElementById('q-vta');if(q)q.value=state.vta.q;drawVta();},0);}
function openProductFromSales(code){
  const st=S[CUR]||{},row=normalizeProductSalesRows(st).find(r=>r.c===safeCode(code));if(!row)return;const p=row.p,url=productImageUrl(row.c);document.getElementById('inventoryProductTitle').textContent=p.n;document.getElementById('inventoryProductSubtitle').textContent=`Código ${row.c} · venta por producto`;const item=(l,v)=>`<div class="detailItem"><label>${esc(l)}</label><b>${esc(safeText(v,'—'))}</b></div>`;document.getElementById('inventoryProductBody').innerHTML=`<div class="detailHero detailHeroWithImage">${imageThumb(row.c,'lg')}<div class="detailHeroText"><h3>${esc(p.n)}</h3><p>${esc(p.cat)} · ${esc(p.lin)} · ${esc(p.sub)}</p></div><div class="detailHeroValue"><b>${fMoneyCOP(row.v)}</b><span>Venta últimos 3 meses</span></div></div><div class="detailSections"><section class="detailSection full"><div class="detailSectionTitle">Información de venta y stock</div><div class="detailGrid">${item('Código',row.c)}${item('Categoría',p.cat)}${item('Línea',p.lin)}${item('Sublínea',p.sub)}${item('Venta 3 meses',fMoneyCOP(row.v))}${item('Unidades vendidas',fInt(row.u))}${item('Stock en piso',fInt(row.su))}${item('Valor del stock',fMoneyCOP(row.sv))}</div></section></div>`;document.getElementById('inventoryProductModal').classList.add('on');
}
function productSalesChart(st){const rows=normalizeProductSalesRows(st).filter(r=>r.v>0||r.u>0).sort((a,b)=>b.v-a.v||b.u-a.u).slice(0,10),total=rows.reduce((a,r)=>a+r.v,0);return `<div class="chart" data-chart>${rows.map((r,i)=>{const col=CATCOL[i%CATCOL.length];return `<div class="bar salesBar" onclick="openProductFromSales(${JSON.stringify(r.c)})" title="${esc(r.p.n)}"><div class="cv dualMetric" style="color:${col}"><b>${fMoney(r.v)}</b><span>${fInt(r.u)} uds</span></div><div class="col" data-h="${r.v}" style="background:${col}"></div><div class="cl" title="${esc(r.p.n)}">${esc(r.p.n.slice(0,12))}</div></div>`;}).join('')}</div>`;}
viewVta=function(st){const k=st.kpi||{},cats=catTotals(st),ins=salesInsights(st),avg=k.vU?k.vtot/k.vU:0,mode=state.vta.mode||'category',source=ins.exact?'Detalle exacto por producto':'Estimación con productos de Rotación';return `<div class="card"><div class="chead"><div class="cnum n4">4</div><div><div class="tt">Ventas</div><div class="ds">Consulta por categoría o por producto</div></div><div class="rt"><span class="badge" style="background:var(--vtaBg);color:var(--vta)">${fMoney(k.vtot)}</span></div></div><div class="cbody"><div class="salesModeBar"><div><div class="salesChartTitle">Vista de análisis</div><div class="pageInteractiveHint">Las barras y productos se pueden presionar</div></div><div class="segmented"><button class="${mode==='category'?'on':''}" onclick="setSalesMode('category')">Por categoría</button><button class="${mode==='product'?'on':''}" onclick="setSalesMode('product')">Por producto</button></div></div><div class="mkpis"><div class="mk"><div class="l">Facturación 3 meses</div><div class="v" style="color:var(--vta)">${fMoney(k.vtot)}</div></div><div class="mk"><div class="l">Unidades facturadas</div><div class="v" style="color:var(--vta)">${fInt(k.vU)}</div></div><div class="mk"><div class="l">Venta promedio por unidad</div><div class="v" style="color:var(--vta)">${fMoney(avg)}</div></div><div class="mk"><div class="l">Categorías</div><div class="v" style="color:var(--vta)">${fInt(k.ncat)}</div></div>${productKpi('Producto más vendido',ins.top,source)}${productKpi('Producto menos vendido',ins.low,source)}</div><div><div class="legend" style="margin-bottom:4px"><b>${mode==='category'?'Participación por categoría':'Top productos por valor vendido'}</b></div>${mode==='category'?`<div class="chart" data-chart>${cats.map((c,i)=>{const col=CATCOL[i%CATCOL.length],pct=k.vtot?Math.round(100*c[1]/k.vtot):0;return `<div class="bar salesBar" onclick="openSalesCategory(${JSON.stringify(c[0])})"><div class="cv" style="color:${col}">${pct}%</div><div class="col" data-h="${c[1]}" style="background:${col}"></div><div class="cl" title="${esc(c[0])}">${esc(c[0])}</div></div>`;}).join('')}</div>`:productSalesChart(st)}</div><div class="tbar"><div class="tsearch">🔎<input id="q-vta" placeholder="${mode==='category'?'Buscar categoría, línea o sublínea…':'Buscar código o producto…'}" value="${esc(state.vta.q||'')}" oninput="state.vta.q=this.value;drawVta()"></div>${mode==='category'?`<span class="chip filt" data-q="vta" data-f="all">Todas</span>${cats.map(c=>`<span class="chip filt" data-q="vta" data-f="${esc(c[0])}">${esc(c[0])}</span>`).join('')}<span class="chip filt" data-q="vta" data-f="__opp">🎯 Oportunidad</span>`:'<span class="chip filt on">Productos</span>'}</div><div id="vta-tbl"></div><div class="foot"><span id="vta-cnt"></span><span>${mode==='category'?'🎯 Oportunidad = stock con venta nula':'Presiona una fila para ver el producto'}</span></div></div></div>`;};
drawVta=function(){
  const st=S[CUR]||{},s=state.vta,k=st.kpi||{},mode=s.mode||'category',tbl=document.getElementById('vta-tbl');
  if(mode==='product'){
    let rows=normalizeProductSalesRows(st);const all=rows.slice();if(s.q){const q=s.q.toLowerCase();rows=rows.filter(r=>(r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub).toLowerCase().includes(q));}rows.sort((a,b)=>b.v-a.v||b.u-a.u||a.p.n.localeCompare(b.p.n));
    const cols=[['Código','x',0],['Producto','x',0],['Clasificación','x',0],['Venta 3m','x',1],['Part.','x',1],['Uds vendidas','x',1],['Stock','x',1],['Valor stock','x',1]];const body=rows.map(r=>[`<span class="code">${esc(r.c)}</span>`,`<div class="salesProductCell">${imageThumb(r.c,'sm')}<div class="salesProductText"><b>${esc(r.p.n)}</b><span>Presiona para abrir</span></div></div>`,`<span style="font-size:10.5px;color:var(--mut)">${esc(r.p.cat)} · ${esc(r.p.lin)} · ${esc(r.p.sub)}</span>`,`<b style="color:var(--vta)">${fMoneyCOP(r.v)}</b>`,`${k.vtot?(100*r.v/k.vtot).toFixed(1):0}%`,fInt(r.u),fInt(r.su),fMoneyCOP(r.sv)]);if(tbl){tbl.innerHTML=tableHTML('vta',cols,body);tbl.querySelectorAll('tbody tr').forEach((tr,i)=>{tr.classList.add('salesClickableRow');tr.onclick=()=>openProductFromSales(rows[i].c);});}const cnt=document.getElementById('vta-cnt');if(cnt)cnt.textContent=`Mostrando ${rows.length} de ${all.length} productos`;return;
  }
  let rows=normalizeSalesRows(st).map(r=>({...r,opp:r.su>0&&r.v<=0}));const all=rows.slice();if(s.f==='__opp')rows=rows.filter(r=>r.opp);else if(s.f&&s.f!=='all')rows=rows.filter(r=>r.cat===s.f);if(s.q){const q=s.q.toLowerCase();rows=rows.filter(r=>`${r.cat} ${r.lin} ${r.sub}`.toLowerCase().includes(q));}rows.sort((a,b)=>b.v-a.v);const cols=[['Categoría','cat',0],['Línea','lin',0],['Sublínea','sub',0],['Fac. 3m','v',1],['Part %','part',1],['Uds','u',1],['Stock piso','su',1]];const body=rows.map(r=>[`<span style="font-weight:700">${esc(r.cat)}</span>`,`<span>${esc(r.lin)}</span>`,`<span style="color:var(--mut)">${esc(r.sub)}</span>${r.opp?' <span class="tag sr">🎯</span>':''}`,`<b style="color:var(--vta)">${fMoneyCOP(r.v)}</b>`,`${k.vtot?(100*r.v/k.vtot).toFixed(1):0}%`,fInt(r.u),fInt(r.su)]);if(tbl)tbl.innerHTML=tableHTML('vta',cols,body);const cnt=document.getElementById('vta-cnt');if(cnt)cnt.textContent=`Mostrando ${rows.length} de ${all.length} sublíneas`;wireTable('vta',drawVta);
};


/* ============================================================
   LLAVERO V20 · rangos completos, fotos y dashboard legible
   ============================================================ */
function readableAgeRange(label){
  const c=canonicalAgeLabel(label), nums=String(c).match(/\d+/g)||[];
  if(String(c).includes('Más'))return 'Más de 360 días';
  if(nums.length>=2)return `${nums[0]} a ${nums[1]} días`;
  return `${c} días`;
}
function allAgeChips(rangos){
  const entries=sortedAgeEntries(rangos).filter(([,u])=>toNum(u)>0);
  return entries.length?`<div class="rangeAllAges">${entries.map(([a,u])=>`<span><b>${fInt(u)} u</b> · ${esc(canonicalAgeLabel(a))}</span>`).join('')}</div>`:'<span class="mut">Sin distribución registrada</span>';
}
function openProductFromRange(code){closeRangeModal();setTimeout(()=>openInventoryProduct(code),70);}
openRangeDetail=function(stateName,index){
  const st=S[CUR]||{},stat=exactRangeStats(st,stateName)[index];if(!stat)return;
  const items=[...stat.items].sort((a,b)=>b.units-a.units||b.value-a.value||a.r.p.n.localeCompare(b.r.p.n));
  const ageText=readableAgeRange(stat.label);
  document.getElementById('rangeModalTitle').textContent=`${stateName} · ${stat.label}`;
  document.getElementById('rangeModalSubtitle').textContent=`${safeText(st.name,CUR)} · productos con unidades entre ${ageText.toLowerCase()}`;
  const rows=items.map(x=>`<tr onclick="openProductFromRange(${JSON.stringify(x.r.c)})" title="Abrir información detallada del producto"><td>${imageThumb(x.r.c,'sm')}</td><td><span class="code">${esc(x.r.c)}</span></td><td><button class="rangeProductName" onclick="event.stopPropagation();openProductFromRange(${JSON.stringify(x.r.c)})">${esc(x.r.p.n)}</button><div style="font-size:9.5px;color:var(--mut);margin-top:3px">${esc(x.r.p.cat)} · ${esc(x.r.p.lin)} · ${esc(x.r.p.sub)}</div></td><td><span class="rangeSelectedAge">${esc(stat.label)}<small>${esc(ageText)}</small></span></td><td>${allAgeChips(x.r.rangos)}</td><td class="num"><b>${fInt(x.units)}</b></td><td class="num">${fMoneyCOP(x.value)}</td></tr>`).join('');
  document.getElementById('rangeModalBody').innerHTML=`<div class="rangeModalSummary"><div class="rangeStat"><label>Rango de antigüedad</label><b>${esc(stat.label)}</b></div><div class="rangeStat"><label>Edad del inventario</label><b>${esc(ageText)}</b></div><div class="rangeStat"><label>Unidades en este rango</label><b>${fInt(stat.units)}</b></div><div class="rangeStat"><label>Productos en este rango</label><b>${fInt(stat.productsCount)}</b></div></div><div class="rangeAgeNote"><b>Cómo leer esta vista:</b> la columna “Antigüedad seleccionada” identifica el rango presionado. “Distribución completa” muestra todas las unidades del mismo producto en los demás rangos de edad. Presiona el nombre o la fila para abrir la ficha completa.</div><div class="twrap" style="max-height:60vh"><table class="rangeProductTable"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Antigüedad seleccionada</th><th>Distribución completa</th><th class="num">Uds. en rango</th><th class="num">Valor estimado</th></tr></thead><tbody>${rows||'<tr><td colspan="7">Sin productos.</td></tr>'}</tbody></table></div>`;
  document.getElementById('rangeModal').classList.add('on');
};
function rotationAgeFilterButtons(){
  return `<div class="ageFilterRow"><span class="ageFilterLabel">Filtrar por rango:</span><span class="chip filt" data-q="rot" data-f="all">Todos</span>${(LBL||[]).map((l,i)=>`<span class="chip filt" data-q="rot" data-f="age${i}">${esc(l)}</span>`).join('')}<span class="chip filt" data-q="rot" data-f="novta">Sin venta 3m</span></div>`;
}
viewRot=function(st){
  const rows=rotationDetailedRows(st),u=rows.reduce((a,r)=>a+r.u,0),v=rows.reduce((a,r)=>a+r.val,0),sin=rows.filter(r=>r.sales3m<=0).length;
  return `<div class="card"><div class="chead"><div class="cnum n1">1</div><div><div class="tt">Rotación</div><div class="ds">Distribución exacta por antigüedad; gráficos, imágenes y productos son clickeables</div></div><div class="rt"><span class="badge warm">${fInt(rows.length)} productos</span></div></div><div class="cbody"><div class="mkpis"><div class="mk r"><div class="l">Productos</div><div class="v">${fInt(rows.length)}</div></div><div class="mk r"><div class="l">Unidades &gt;90d</div><div class="v">${fInt(u)}</div></div><div class="mk r"><div class="l">Valor detenido</div><div class="v">${fMoney(v)}</div></div><div class="mk b"><div class="l">Sin venta 3 meses</div><div class="v">${fInt(sin)}</div></div></div><div><div class="legend" style="margin-bottom:4px"><b>Presiona un rango para consultar productos, unidades y distribución completa de edades</b></div><div id="rot-chart"></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-rot" placeholder="Buscar producto, código, categoría, línea o sublínea…" oninput="state.rot.q=this.value;drawRot()"></div></div>${rotationAgeFilterButtons()}<div id="rot-tbl"></div><div class="foot"><span id="rot-cnt"></span><span>Presiona la imagen, el producto o la fila para abrir el detalle.</span></div></div></div>`;
};
drawRot=function(){
  const st=S[CUR]||{},s=state.rot;let rows=rotationDetailedRows(st),all=rows.slice();
  if(String(s.f).startsWith('age')){const idx=Number(String(s.f).slice(3));rows=rows.filter(r=>r.entries.some(([a,u])=>ageRankFromLabel(a)===idx&&toNum(u)>0));}
  if(s.f==='novta')rows=rows.filter(r=>r.sales3m<=0);
  if(s.q){const q=String(s.q).toLowerCase();rows=rows.filter(r=>(r.p.n+' '+r.c+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub).toLowerCase().includes(q));}
  const ch=document.getElementById('rot-chart');if(ch)ch.innerHTML=rangeChartHtml(st,'Rotación');
  if(s.sort==='age')rows.sort((a,b)=>(a.age-b.age)*s.dir||b.val-a.val||b.u-a.u);else rows.sort(cmp(s,{c:r=>r.c,p:r=>r.p.n,age:r=>r.age,u:r=>r.u,val:r=>r.val,vta:r=>r.sales3m}));
  const cols=[['Código','c',0],['Imagen','x',0],['Producto','p',0],['Categoría / Línea','x',0],['Unidades por rango','age',0],['Uds >90d','u',1],['Valor detenido','val',1],['Ventas 3m','vta',1]];
  const body=rows.map(r=>[`<span class="code">${esc(r.c)}</span>`,imageThumb(r.c,'sm'),`<button class="productOpen" onclick="event.stopPropagation();openInventoryProduct(${JSON.stringify(r.c)})">${esc(r.p.n)}</button>`,`<span style="color:var(--mut);font-size:10.8px"><b>${esc(r.p.cat)}</b><br>${esc(r.p.lin)} · ${esc(r.p.sub)}</span>`,invAgeHtml(Object.fromEntries(r.entries),r.u),`<b>${fInt(r.u)}</b>`,`<b style="color:var(--rot)">${fMoneyCOP(r.val)}</b>`,r.sales3m>0?`<b>${fInt(r.sales3m)} uds</b>`:'<span class="tag sr">SIN VENTA</span>']);
  const tbl=document.getElementById('rot-tbl');if(tbl){tbl.innerHTML=tableHTML('rot',cols,body);tbl.querySelectorAll('tbody tr').forEach((tr,i)=>{tr.dataset.code=rows[i].c;tr.classList.add('salesClickableRow');tr.onclick=()=>openInventoryProduct(rows[i].c);});}
  const cnt=document.getElementById('rot-cnt');if(cnt)cnt.textContent=`Mostrando ${rows.length} de ${all.length} productos`;
  wireTable('rot',drawRot);animateBars();
};
function evacuationDetailedRows(st){
  return inventoryStateRows(st,'Evacuación').map(r=>{const entries=sortedAgeEntries(r.rangos).filter(([a,u])=>ageRankFromLabel(a)>=0&&toNum(u)>0),u=entries.reduce((a,[,q])=>a+toNum(q),0),age=Math.max(-1,...entries.map(([a])=>ageRankFromLabel(a))),v=r.stock>0?r.valorInventario*(u/r.stock):r.valorInventario;return {...r,entries,u,age,v,cendis:toNum(r.dispCendis)};}).filter(r=>r.u>0||r.v>0);
}
viewEvac=function(st){
  const rows=evacuationDetailedRows(st),n=rows.length,u=rows.reduce((a,r)=>a+r.u,0),v=rows.reduce((a,r)=>a+r.v,0),sr=rows.filter(r=>r.cendis<=0).length,cr=n-sr;
  return `<div class="card"><div class="chead"><div class="cnum n2">2</div><div><div class="tt">Evacuación</div><div class="ds">Productos fuera de portafolio con imagen y distribución exacta por rango</div></div><div class="rt"><span class="badge hot">${fInt(sr)} sin respaldo</span></div></div><div class="cbody"><div class="mkpis"><div class="mk e"><div class="l">Productos</div><div class="v">${fInt(n)}</div></div><div class="mk b"><div class="l">Sin respaldo</div><div class="v">${fInt(sr)}</div></div><div class="mk g"><div class="l">Con respaldo</div><div class="v">${fInt(cr)}</div></div><div class="mk e"><div class="l">Unidades tienda</div><div class="v">${fInt(u)}</div></div><div class="mk e"><div class="l">Valor</div><div class="v">${fMoney(v)}</div></div></div><div class="legend"><span><span class="sw" style="background:var(--bad)"></span>Sin respaldo CENDIS → <b>sale primero</b></span><span><span class="sw" style="background:var(--ok)"></span>Con respaldo en CENDIS</span></div><div style="margin:8px 0 12px"><div class="legend"><b>Presiona un rango para ver productos y unidades</b></div><div id="evac-chart"></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-evac" placeholder="Buscar producto, código, categoría, línea o sublínea…" oninput="state.evac.q=this.value;drawEvac()"></div><span class="chip filt" data-q="evac" data-f="all">Todos</span><span class="chip filt" data-q="evac" data-f="sr">Sin respaldo</span><span class="chip filt" data-q="evac" data-f="cr">Con respaldo</span></div><div id="evac-tbl"></div><div class="foot"><span id="evac-cnt"></span><span>Presiona la imagen, el producto o la fila para abrir el detalle.</span></div></div></div>`;
};
drawEvac=function(){
  const st=S[CUR]||{},s=state.evac,all=evacuationDetailedRows(st);let rows=all.slice();
  if(s.f==='sr')rows=rows.filter(r=>r.cendis<=0);if(s.f==='cr')rows=rows.filter(r=>r.cendis>0);
  if(s.q){const q=String(s.q).toLowerCase();rows=rows.filter(r=>(r.p.n+' '+r.c+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub).toLowerCase().includes(q));}
  const ch=document.getElementById('evac-chart');if(ch)ch.innerHTML=rangeChartHtml(st,'Evacuación');
  if(s.sort==='pri')rows.sort((a,b)=>(a.cendis>0)-(b.cendis>0)||b.age-a.age||b.v-a.v||b.u-a.u);else rows.sort(cmp(s,{c:r=>r.c,p:r=>r.p.n,cendis:r=>r.cendis,u:r=>r.u,v:r=>r.v}));
  const cols=[['#','pri',0],['Código','c',0],['Imagen','x',0],['Producto','p',0],['Categoría / Línea','x',0],['Unidades por rango','x',0],['Respaldo CENDIS','cendis',1],['Uds tienda','u',1],['Valor','v',1]];
  const body=rows.map((r,i)=>[`<span class="pri ${r.cendis<=0?'top':''}">${i+1}</span>`,`<span class="code">${esc(r.c)}</span>`,imageThumb(r.c,'sm'),`<button class="productOpen" onclick="event.stopPropagation();openInventoryProduct(${JSON.stringify(r.c)})">${esc(r.p.n)}</button>`,`<span style="color:var(--mut);font-size:10.8px"><b>${esc(r.p.cat)}</b><br>${esc(r.p.lin)} · ${esc(r.p.sub)}</span>`,invAgeHtml(Object.fromEntries(r.entries),r.u),r.cendis<=0?'<span class="tag sr">SIN RESPALDO</span>':`<span class="tag cr">${fInt(r.cendis)} u</span>`,`<b>${fInt(r.u)}</b>`,`<b style="color:var(--evac)">${fMoneyCOP(r.v)}</b>`]);
  const tbl=document.getElementById('evac-tbl');if(tbl){tbl.innerHTML=tableHTML('evac',cols,body);tbl.querySelectorAll('tbody tr').forEach((tr,i)=>{tr.dataset.code=rows[i].c;tr.classList.add('salesClickableRow');tr.onclick=()=>openInventoryProduct(rows[i].c);});}
  const cnt=document.getElementById('evac-cnt');if(cnt)cnt.textContent=`Mostrando ${rows.length} de ${all.length} productos con inventario`;
  wireTable('evac',drawEvac);animateBars();
};



/* ============================================================
   LLAVERO V21 · indicadores clickeables y tablas legibles
   ============================================================ */
(function(){
  const css=`
  .mk.clickableKpi,.inventoryKpi.clickableKpi{cursor:pointer;position:relative;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}
  .mk.clickableKpi:hover,.inventoryKpi.clickableKpi:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(23,59,99,.12);border-color:rgba(229,50,50,.38)}
  .mk.clickableKpi:after,.inventoryKpi.clickableKpi:after{content:'Ver detalle';display:block;margin-top:5px;font-size:9.5px;font-weight:800;letter-spacing:.03em;color:var(--jamar)}
  .summaryProductRow{grid-template-columns:40px minmax(0,1fr) auto!important;gap:9px!important;cursor:pointer}
  .summaryProductRow:hover{background:rgba(229,50,50,.055);border-color:rgba(229,50,50,.24)}
  .summaryProductThumb{width:36px;height:36px;display:flex;align-items:center;justify-content:center}
  .summaryProductThumb .productThumb{width:34px!important;height:34px!important}
  .summaryProductNameBtn{appearance:none;border:0;background:transparent;padding:0;text-align:left;font:inherit;color:inherit;font-weight:800;cursor:pointer;line-height:1.2}
  .summaryProductNameBtn:hover{color:var(--jamar);text-decoration:underline}
  .metricModalSummary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:10px}
  .metricModalStat{padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--soft)}
  .metricModalStat label{display:block;font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--mut);font-weight:800}
  .metricModalStat b{display:block;font-size:18px;margin-top:3px;color:var(--navy)}
  .metricProductTable{width:100%;table-layout:fixed;border-collapse:collapse}
  .metricProductTable th,.metricProductTable td{padding:7px 8px;white-space:normal;overflow-wrap:anywhere;vertical-align:middle}
  .metricProductTable th{position:sticky;top:0;z-index:2;background:var(--soft);font-size:9.7px}
  .metricProductTable tbody tr{cursor:pointer}
  .metricProductTable tbody tr:hover{background:rgba(229,50,50,.05)}
  .metricProductTable th:nth-child(1),.metricProductTable td:nth-child(1){width:6%}
  .metricProductTable th:nth-child(2),.metricProductTable td:nth-child(2){width:9%}
  .metricProductTable th:nth-child(3),.metricProductTable td:nth-child(3){width:24%}
  .metricProductTable th:nth-child(4),.metricProductTable td:nth-child(4){width:20%}
  .metricProductTable th:nth-child(5),.metricProductTable td:nth-child(5){width:23%}
  .metricProductTable th:nth-child(6),.metricProductTable td:nth-child(6){width:8%}
  .metricProductTable th:nth-child(7),.metricProductTable td:nth-child(7){width:10%}
  #vta-tbl .twrap{max-height:60vh;overflow-y:auto!important;overflow-x:hidden!important;border:1px solid var(--line);border-radius:10px}
  #vta-tbl table.salesTable{width:100%;table-layout:fixed;border-collapse:collapse;font-size:11.7px}
  #vta-tbl table.salesTable th,#vta-tbl table.salesTable td{padding:7px 8px!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important;vertical-align:middle}
  #vta-tbl table.salesTable th{position:sticky;top:0;z-index:3;background:var(--soft);font-size:9.8px;line-height:1.15}
  #vta-tbl table.salesTable td.num{font-size:11.4px}
  #vta-tbl table.salesCategoryTable col:nth-child(1){width:16%!important}
  #vta-tbl table.salesCategoryTable col:nth-child(2){width:17%!important}
  #vta-tbl table.salesCategoryTable col:nth-child(3){width:25%!important}
  #vta-tbl table.salesCategoryTable col:nth-child(4){width:15%!important}
  #vta-tbl table.salesCategoryTable col:nth-child(5){width:8%!important}
  #vta-tbl table.salesCategoryTable col:nth-child(6){width:8%!important}
  #vta-tbl table.salesCategoryTable col:nth-child(7){width:11%!important}
  #vta-tbl table.salesProductTable col:nth-child(1){width:6%!important}
  #vta-tbl table.salesProductTable col:nth-child(2){width:8%!important}
  #vta-tbl table.salesProductTable col:nth-child(3){width:21%!important}
  #vta-tbl table.salesProductTable col:nth-child(4){width:20%!important}
  #vta-tbl table.salesProductTable col:nth-child(5){width:12%!important}
  #vta-tbl table.salesProductTable col:nth-child(6){width:7%!important}
  #vta-tbl table.salesProductTable col:nth-child(7){width:7%!important}
  #vta-tbl table.salesProductTable col:nth-child(8){width:7%!important}
  #vta-tbl table.salesProductTable col:nth-child(9){width:12%!important}
  .salesClassCell{font-size:10.5px;line-height:1.25;color:var(--mut)}
  .salesClassCell b{color:var(--ink2)}
  .salesNameCell{font-weight:800;line-height:1.2}
  .salesNameCell small{display:block;margin-top:3px;color:var(--mut);font-weight:600;font-size:9.5px}
  .salesTable tbody tr{cursor:pointer}
  .salesTable tbody tr:hover{background:rgba(229,50,50,.05)}
  .ambKpiHint{font-size:9.5px;color:var(--jamar);font-weight:800;margin-top:5px}
  body.dark .metricModalStat b{color:#fff}
  body.dark .mk.clickableKpi:hover,body.dark .inventoryKpi.clickableKpi:hover{box-shadow:0 8px 22px rgba(0,0,0,.28);border-color:rgba(239,68,68,.55)}
  @media(max-width:900px){
    .metricModalSummary{grid-template-columns:repeat(2,minmax(0,1fr))}
    #vta-tbl table.salesTable{font-size:10.6px}
    #vta-tbl table.salesTable th,#vta-tbl table.salesTable td{padding:6px 5px!important}
  }
  `;
  document.head.insertAdjacentHTML('beforeend',`<style id="llavero-v21-style">${css}</style>`);
})();

function openBestProductDetail(code,source='inventory'){
  closeRangeModal();
  const c=safeCode(code),hasInv=normalizeInventoryRows(S[CUR]||{}).some(r=>r.c===c);
  setTimeout(()=>{if(hasInv&&typeof openInventoryProduct==='function')openInventoryProduct(c);else if(typeof openProductFromSales==='function')openProductFromSales(c);},70);
}
function metricSummaryHtml(cards){
  return `<div class="metricModalSummary">${cards.map(c=>`<div class="metricModalStat"><label>${esc(c[0])}</label><b>${c[1]}</b></div>`).join('')}</div>`;
}
function showMetricModal(title,subtitle,cards,rows,empty='Sin registros para este indicador.'){
  const modal=document.getElementById('rangeModal');if(!modal)return;
  document.getElementById('rangeModalTitle').textContent=title;
  document.getElementById('rangeModalSubtitle').textContent=subtitle;
  const body=rows.length?rows.join(''):`<tr><td colspan="7"><div class="empty">${esc(empty)}</div></td></tr>`;
  document.getElementById('rangeModalBody').innerHTML=`${metricSummaryHtml(cards)}<div class="rangeAgeNote"><b>Vista interactiva:</b> presiona la imagen, el nombre o cualquier fila para abrir la información detallada del producto.</div><div class="twrap" style="max-height:62vh;overflow-y:auto;overflow-x:hidden"><table class="metricProductTable"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Clasificación</th><th>Unidades por rango</th><th class="num">Unidades</th><th class="num">Valor</th></tr></thead><tbody>${body}</tbody></table></div>`;
  modal.classList.add('on');
}
function inventoryMetricRowHtml(r,units,value,extra=''){
  const code=safeCode(r.c||r.codigo),p=r.p||productInfo(code),rangos=r.rangos||{},u=toNum(units),v=toNum(value);
  return `<tr onclick="openBestProductDetail(${JSON.stringify(code)})"><td>${imageThumb(code,'sm')}</td><td><span class="code">${esc(code)}</span></td><td><button class="rangeProductName" onclick="event.stopPropagation();openBestProductDetail(${JSON.stringify(code)})">${esc(p.n||r.producto||code)}</button>${extra?`<div class="pageInteractiveHint">${extra}</div>`:''}</td><td><div class="salesClassCell"><b>${esc(p.cat||r.categoria||'—')}</b><br>${esc(p.lin||r.linea||'—')} · ${esc(p.sub||r.sublinea||'—')}</div></td><td>${invAgeHtml(rangos,toNum(r.stock||u))}</td><td class="num"><b>${fInt(u)}</b></td><td class="num"><b>${fMoneyCOP(v)}</b></td></tr>`;
}
function openRotationMetric(metric){
  const st=S[CUR]||{},all=rotationDetailedRows(st);let rows=all.slice(),title='Rotación · productos',description='Todos los productos actualmente en rotación.';
  if(metric==='units'){rows.sort((a,b)=>b.u-a.u);title='Rotación · unidades con más de 90 días';description='Productos ordenados por cantidad de unidades en rangos superiores a 90 días.';}
  else if(metric==='nosales'){rows=rows.filter(r=>r.sales3m<=0).sort((a,b)=>b.val-a.val);title='Rotación · productos sin venta';description='Productos con inventario y sin unidades vendidas en los últimos 3 meses.';}
  else if(metric==='value'){rows.sort((a,b)=>b.val-a.val);title='Rotación · valor detenido';description='Productos ordenados por mayor valor de inventario detenido.';}
  else rows.sort((a,b)=>b.u-a.u||b.val-a.val);
  const units=rows.reduce((a,r)=>a+r.u,0),value=rows.reduce((a,r)=>a+r.val,0);
  showMetricModal(title,`${safeText(st.name,CUR)} · ${description}`,[['Productos',fInt(rows.length)],['Unidades',fInt(units)],['Valor',fMoneyCOP(value)],['Corte',esc(safeText(DB.meta?.fecha,'—'))]],rows.map(r=>inventoryMetricRowHtml(r,r.u,r.val,r.sales3m>0?`${fInt(r.sales3m)} uds vendidas`:'Sin venta 3m')));
}
function openEvacuationMetric(metric){
  const st=S[CUR]||{},all=evacuationDetailedRows(st);let rows=all.slice(),title='Evacuación · productos',description='Todos los productos actualmente en evacuación.';
  if(metric==='sr'){rows=rows.filter(r=>r.cendis<=0);title='Evacuación · sin respaldo CENDIS';description='Productos sin disponibilidad de respaldo en CENDIS.';}
  else if(metric==='cr'){rows=rows.filter(r=>r.cendis>0);title='Evacuación · con respaldo CENDIS';description='Productos que sí cuentan con disponibilidad de respaldo.';}
  else if(metric==='units'){rows.sort((a,b)=>b.u-a.u);title='Evacuación · unidades en tienda';description='Productos ordenados por cantidad de unidades.';}
  else if(metric==='value'){rows.sort((a,b)=>b.v-a.v);title='Evacuación · valor de inventario';description='Productos ordenados por valor de inventario.';}
  else rows.sort((a,b)=>(a.cendis>0)-(b.cendis>0)||b.u-a.u);
  const units=rows.reduce((a,r)=>a+r.u,0),value=rows.reduce((a,r)=>a+r.v,0);
  showMetricModal(title,`${safeText(st.name,CUR)} · ${description}`,[['Productos',fInt(rows.length)],['Unidades',fInt(units)],['Valor',fMoneyCOP(value)],['Sin respaldo',fInt(rows.filter(r=>r.cendis<=0).length)]],rows.map(r=>inventoryMetricRowHtml(r,r.u,r.v,r.cendis>0?`${fInt(r.cendis)} uds en CENDIS`:'Sin respaldo CENDIS')));
}
function openInventoryMetric(metric){
  const st=S[CUR]||{},all=normalizeInventoryRows(st).filter(r=>r.stock>0);let rows=all.slice(),title='Inventario · referencias con stock',description='Inventario completo de la tienda.';
  if(metric==='supported'){rows=rows.filter(r=>toNum(r.dispCendis)>0);title='Inventario · con respaldo CENDIS';description='Referencias con disponibilidad en CENDIS.';}
  else if(metric==='critical'){rows=rows.filter(r=>Object.entries(r.rangos||{}).some(([a,u])=>ageRankFromLabel(a)>=6&&toNum(u)>0));title='Inventario · críticos de más de 360 días';description='Referencias con unidades en el rango más antiguo.';}
  else if(metric==='units'){rows.sort((a,b)=>b.stock-a.stock);title='Inventario · unidades en tienda';description='Referencias ordenadas por cantidad de unidades.';}
  else if(metric==='value'){rows.sort((a,b)=>b.valorInventario-a.valorInventario);title='Inventario · valor total';description='Referencias ordenadas por valor de inventario.';}
  const units=rows.reduce((a,r)=>a+r.stock,0),value=rows.reduce((a,r)=>a+r.valorInventario,0);
  showMetricModal(title,`${safeText(st.name,CUR)} · ${description}`,[['Referencias',fInt(rows.length)],['Unidades',fInt(units)],['Valor',fMoneyCOP(value)],['Corte',esc(safeText(DB.meta?.fecha,'—'))]],rows.map(r=>inventoryMetricRowHtml(r,r.stock,r.valorInventario,toNum(r.dispCendis)>0?`${fInt(r.dispCendis)} uds en CENDIS`:'Sin respaldo CENDIS')));
}
function salesMetricRowHtml(r){
  const code=safeCode(r.c),p=r.p||productInfo(code);
  return `<tr onclick="openBestProductDetail(${JSON.stringify(code)},'sales')"><td>${imageThumb(code,'sm')}</td><td><span class="code">${esc(code)}</span></td><td><button class="rangeProductName" onclick="event.stopPropagation();openBestProductDetail(${JSON.stringify(code)},'sales')">${esc(p.n)}</button><div class="pageInteractiveHint">${fInt(r.u)} uds vendidas</div></td><td><div class="salesClassCell"><b>${esc(p.cat)}</b><br>${esc(p.lin)} · ${esc(p.sub)}</div></td><td><span class="mut">Stock actual: ${fInt(r.su)} uds</span></td><td class="num"><b>${fInt(r.u)}</b></td><td class="num"><b>${fMoneyCOP(r.v)}</b></td></tr>`;
}
function openSalesMetric(metric){
  const st=S[CUR]||{},ins=salesInsights(st),all=normalizeProductSalesRows(st);let rows=all.slice(),title='Ventas · productos',description='Detalle de ventas por producto.';
  if(metric==='revenue'){rows.sort((a,b)=>b.v-a.v);title='Ventas · facturación de 3 meses';description='Productos ordenados por valor vendido.';}
  else if(metric==='units'){rows.sort((a,b)=>b.u-a.u);title='Ventas · unidades facturadas';description='Productos ordenados por unidades vendidas.';}
  else if(metric==='top'){rows=ins.top?[ins.top]:[];title='Ventas · producto más vendido';description='Producto con mayor cantidad de unidades vendidas.';}
  else if(metric==='low'){rows=ins.low?[ins.low]:[];title='Ventas · producto de menor movimiento';description='Producto con menor movimiento o sin venta.';}
  else if(metric==='nosales'){rows=ins.noSales;title='Ventas · productos con stock sin venta';description='Productos con stock y sin ventas durante los últimos 3 meses.';}
  const units=rows.reduce((a,r)=>a+r.u,0),value=rows.reduce((a,r)=>a+r.v,0),stock=rows.reduce((a,r)=>a+r.su,0);
  showMetricModal(title,`${safeText(st.name,CUR)} · ${description}`,[['Productos',fInt(rows.length)],['Unidades vendidas',fInt(units)],['Facturación',fMoneyCOP(value)],['Stock actual',fInt(stock)]],rows.map(salesMetricRowHtml));
}

summaryProductList=function(st,stateName){
  const rows=summaryProductRows(st,stateName);
  return `<div class="summaryProductList">${rows.length?rows.map(x=>`<div class="summaryProductRow" onclick="openBestProductDetail(${JSON.stringify(x.r.c)})" title="Abrir información detallada"><div class="summaryProductThumb">${imageThumb(x.r.c,'sm')}</div><div><button class="summaryProductNameBtn" onclick="event.stopPropagation();openBestProductDetail(${JSON.stringify(x.r.c)})">${esc(x.r.p.n)}</button><div class="summaryProductMeta">${x.entries.map(([a,u])=>`${fInt(u)} u · ${esc(canonicalAgeLabel(a))}`).join(' · ')}</div></div><div class="summaryProductUnits">${fInt(x.units)} uds</div></div>`).join(''):'<div class="empty">Sin productos en este estado.</div>'}</div>`;
};

viewRot=function(st){
  const rows=rotationDetailedRows(st),u=rows.reduce((a,r)=>a+r.u,0),v=rows.reduce((a,r)=>a+r.val,0),sin=rows.filter(r=>r.sales3m<=0).length;
  return `<div class="card"><div class="chead"><div class="cnum n1">1</div><div><div class="tt">Rotación</div><div class="ds">Todos los indicadores, gráficos, imágenes y productos son clickeables</div></div><div class="rt"><span class="badge warm">${fInt(rows.length)} productos</span></div></div><div class="cbody"><div class="mkpis"><div class="mk r clickableKpi" onclick="openRotationMetric('products')"><div class="l">Total de productos</div><div class="v">${fInt(rows.length)}</div></div><div class="mk r clickableKpi" onclick="openRotationMetric('units')"><div class="l">Unidades &gt;90 días</div><div class="v">${fInt(u)}</div></div><div class="mk r clickableKpi" onclick="openRotationMetric('value')"><div class="l">Valor detenido</div><div class="v">${fMoney(v)}</div></div><div class="mk b clickableKpi" onclick="openRotationMetric('nosales')"><div class="l">Sin venta 3 meses</div><div class="v">${fInt(sin)}</div></div></div><div><div class="legend" style="margin-bottom:4px"><b>Presiona un rango para consultar productos, unidades y distribución completa de edades</b></div><div id="rot-chart"></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-rot" placeholder="Buscar producto, código, categoría, línea o sublínea…" oninput="state.rot.q=this.value;drawRot()"></div></div>${rotationAgeFilterButtons()}<div id="rot-tbl"></div><div class="foot"><span id="rot-cnt"></span><span>Presiona la imagen, el producto o la fila para abrir el detalle.</span></div></div></div>`;
};

viewEvac=function(st){
  const rows=evacuationDetailedRows(st),n=rows.length,u=rows.reduce((a,r)=>a+r.u,0),v=rows.reduce((a,r)=>a+r.v,0),sr=rows.filter(r=>r.cendis<=0).length,cr=n-sr;
  return `<div class="card"><div class="chead"><div class="cnum n2">2</div><div><div class="tt">Evacuación</div><div class="ds">Indicadores, rangos, imágenes y productos clickeables</div></div><div class="rt"><span class="badge hot">${fInt(sr)} sin respaldo</span></div></div><div class="cbody"><div class="mkpis"><div class="mk e clickableKpi" onclick="openEvacuationMetric('products')"><div class="l">Productos</div><div class="v">${fInt(n)}</div></div><div class="mk b clickableKpi" onclick="openEvacuationMetric('sr')"><div class="l">Sin respaldo</div><div class="v">${fInt(sr)}</div></div><div class="mk g clickableKpi" onclick="openEvacuationMetric('cr')"><div class="l">Con respaldo</div><div class="v">${fInt(cr)}</div></div><div class="mk e clickableKpi" onclick="openEvacuationMetric('units')"><div class="l">Unidades tienda</div><div class="v">${fInt(u)}</div></div><div class="mk e clickableKpi" onclick="openEvacuationMetric('value')"><div class="l">Valor</div><div class="v">${fMoney(v)}</div></div></div><div class="legend"><span><span class="sw" style="background:var(--bad)"></span>Sin respaldo CENDIS → <b>sale primero</b></span><span><span class="sw" style="background:var(--ok)"></span>Con respaldo en CENDIS</span></div><div style="margin:8px 0 12px"><div class="legend"><b>Presiona un rango para ver productos y unidades</b></div><div id="evac-chart"></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-evac" placeholder="Buscar producto, código, categoría, línea o sublínea…" oninput="state.evac.q=this.value;drawEvac()"></div><span class="chip filt" data-q="evac" data-f="all">Todos</span><span class="chip filt" data-q="evac" data-f="sr">Sin respaldo</span><span class="chip filt" data-q="evac" data-f="cr">Con respaldo</span></div><div id="evac-tbl"></div><div class="foot"><span id="evac-cnt"></span><span>Presiona la imagen, el producto o la fila para abrir el detalle.</span></div></div></div>`;
};

viewInventario=function(st){
  const x=inventorySummary(st);
  return `<div class="card"><div class="chead"><div class="cnum n4">▤</div><div><div class="tt">Inventario de la tienda</div><div class="ds">Imágenes, clasificación, unidades y antigüedad por producto</div></div><div class="rt"><span class="badge mut">${fInt(x.refs)} referencias</span></div></div><div class="cbody"><div class="inventoryKpis"><div class="inventoryKpi clickableKpi" onclick="openInventoryMetric('refs')"><div class="ikLabel">Referencias con stock</div><div class="ikValue">${fInt(x.refs)}</div><div class="ikMeta">Códigos de producto</div></div><div class="inventoryKpi clickableKpi" onclick="openInventoryMetric('units')"><div class="ikLabel">Unidades en tienda</div><div class="ikValue">${fInt(x.units)}</div><div class="ikMeta">Stock total</div></div><div class="inventoryKpi clickableKpi" onclick="openInventoryMetric('supported')"><div class="ikLabel">Con respaldo CENDIS</div><div class="ikValue">${fInt(x.supported)}</div><div class="ikMeta">Referencias con disponibilidad</div></div><div class="inventoryKpi clickableKpi" onclick="openInventoryMetric('value')"><div class="ikLabel">Valor del inventario</div><div class="ikValue">${fMoneyCOP(x.value)}</div><div class="ikMeta">Pesos colombianos</div></div><div class="inventoryKpi clickableKpi" onclick="openInventoryMetric('critical')"><div class="ikLabel">Críticos +360 días</div><div class="ikValue" style="color:var(--jamar)">${fInt(x.critical)}</div><div class="ikMeta">Referencias críticas</div></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-inventario" placeholder="Buscar código, producto o familia…" oninput="state.inventario.q=this.value;drawInventario()"></div><span class="chip filt" data-q="inventario" data-f="all">Todo</span><span class="chip filt" data-q="inventario" data-f="rot">Rotación</span><span class="chip filt" data-q="inventario" data-f="evac">Evacuación</span><span class="chip filt" data-q="inventario" data-f="360">+360 días</span><span class="chip filt" data-q="inventario" data-f="sr">Sin respaldo</span></div><div class="invFilterPanel"><select id="inv-cat" onchange="state.inventario.cat=this.value;state.inventario.lin='';state.inventario.sub='';drawInventario()"></select><select id="inv-lin" onchange="state.inventario.lin=this.value;state.inventario.sub='';drawInventario()"></select><select id="inv-sub" onchange="state.inventario.sub=this.value;drawInventario()"></select><button class="invClearBtn" onclick="clearInventoryClassFilters()">Limpiar clasificación</button><span class="pageInteractiveHint">Presiona la imagen o cualquier fila</span></div><div id="inventario-tbl"></div><div class="foot"><span id="inventario-cnt"></span><span>La imagen se amplía; la fila abre la ficha detallada.</span></div></div></div>`;
};

function salesKpi(label,value,metric,cls='',meta=''){
  return `<div class="mk ${cls} clickableKpi" onclick="openSalesMetric('${metric}')"><div class="l">${esc(label)}</div><div class="v" style="color:var(--vta)">${value}</div>${meta?`<div class="meta">${esc(meta)}</div>`:''}</div>`;
}
viewVta=function(st){
  const k=st.kpi||{},cats=catTotals(st),ins=salesInsights(st),avg=k.vU?k.vtot/k.vU:0,mode=state.vta.mode||'category',source=ins.exact?'Detalle exacto por producto':'Estimación con productos de Rotación';
  return `<div class="card"><div class="chead"><div class="cnum n4">4</div><div><div class="tt">Ventas</div><div class="ds">Consulta por categoría o por producto; indicadores y filas clickeables</div></div><div class="rt"><span class="badge" style="background:var(--vtaBg);color:var(--vta)">${fMoney(k.vtot)}</span></div></div><div class="cbody"><div class="salesModeBar"><div><div class="salesChartTitle">Vista de análisis</div><div class="pageInteractiveHint">La tabla fue redistribuida para mostrar toda la información</div></div><div class="segmented"><button class="${mode==='category'?'on':''}" onclick="setSalesMode('category')">Por categoría</button><button class="${mode==='product'?'on':''}" onclick="setSalesMode('product')">Por producto</button></div></div><div class="mkpis">${salesKpi('Facturación 3 meses',fMoney(k.vtot),'revenue')}${salesKpi('Unidades facturadas',fInt(k.vU),'units')}${salesKpi('Venta promedio por unidad',fMoney(avg),'revenue')}${salesKpi('Producto más vendido',esc(ins.top?.p?.n||'Sin datos'),'top','',ins.top?`${fInt(ins.top.u)} uds vendidas`:source)}${salesKpi('Producto de menor movimiento',esc(ins.low?.p?.n||'Sin datos'),'low','',ins.low?`${fInt(ins.low.u)} uds vendidas`:source)}${salesKpi('Productos con stock sin venta',fInt(ins.noSales.length),'nosales','b',source)}</div><div><div class="legend" style="margin-bottom:4px"><b>${mode==='category'?'Participación por categoría':'Top productos por valor vendido'}</b></div>${mode==='category'?`<div class="chart" data-chart>${cats.map((c,i)=>{const col=CATCOL[i%CATCOL.length],pct=k.vtot?Math.round(100*c[1]/k.vtot):0;return `<div class="bar salesBar" onclick="openSalesCategory(${JSON.stringify(c[0])})"><div class="cv" style="color:${col}">${pct}%</div><div class="col" data-h="${c[1]}" style="background:${col}"></div><div class="cl" title="${esc(c[0])}">${esc(c[0])}</div></div>`;}).join('')}</div>`:productSalesChart(st)}</div><div class="tbar"><div class="tsearch">🔎<input id="q-vta" placeholder="${mode==='category'?'Buscar categoría, línea o sublínea…':'Buscar código, producto o clasificación…'}" value="${esc(state.vta.q||'')}" oninput="state.vta.q=this.value;drawVta()"></div>${mode==='category'?`<span class="chip filt" data-q="vta" data-f="all">Todas</span>${cats.map(c=>`<span class="chip filt" data-q="vta" data-f="${esc(c[0])}">${esc(c[0])}</span>`).join('')}<span class="chip filt" data-q="vta" data-f="__opp">🎯 Oportunidad</span>`:'<span class="chip filt on">Productos</span>'}</div><div id="vta-tbl"></div><div class="foot"><span id="vta-cnt"></span><span>${mode==='category'?'🎯 Oportunidad = stock con venta nula':'Presiona una fila para ver el producto'}</span></div></div></div>`;
};
function salesTableFromBase(cols,body,extraClass){
  return tableHTML('vta',cols,body).replace('<table>','<table class="salesTable '+extraClass+'">');
}
drawVta=function(){
  const st=S[CUR]||{},s=state.vta,k=st.kpi||{},mode=s.mode||'category',tbl=document.getElementById('vta-tbl');
  if(mode==='product'){
    let rows=normalizeProductSalesRows(st),all=rows.slice();
    if(s.q){const q=s.q.toLowerCase();rows=rows.filter(r=>(r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub).toLowerCase().includes(q));}
    const acc={c:r=>r.c,p:r=>r.p.n,v:r=>r.v,part:r=>r.v,u:r=>r.u,su:r=>r.su,sv:r=>r.sv};
    if(s.sort&&acc[s.sort])rows.sort(cmp(s,acc));else rows.sort((a,b)=>b.v-a.v||b.u-a.u||a.p.n.localeCompare(b.p.n));
    const cols=[['Imagen','x',0],['Código','c',0],['Producto','p',0],['Clasificación','x',0],['Venta 3m','v',1],['Part.','part',1],['Uds vendidas','u',1],['Stock','su',1],['Valor stock','sv',1]];
    const body=rows.map(r=>[imageThumb(r.c,'sm'),`<span class="code">${esc(r.c)}</span>`,`<div class="salesNameCell">${esc(r.p.n)}<small>Presiona para abrir el detalle</small></div>`,`<div class="salesClassCell"><b>${esc(r.p.cat)}</b><br>${esc(r.p.lin)}<br>${esc(r.p.sub)}</div>`,`<b style="color:var(--vta)">${fMoneyCOP(r.v)}</b>`,`${k.vtot?(100*r.v/k.vtot).toFixed(1):0}%`,fInt(r.u),fInt(r.su),fMoneyCOP(r.sv)]);
    if(tbl){tbl.innerHTML=salesTableFromBase(cols,body,'salesProductTable');tbl.querySelectorAll('tbody tr').forEach((tr,i)=>{tr.onclick=()=>openBestProductDetail(rows[i].c,'sales');});}
    const cnt=document.getElementById('vta-cnt');if(cnt)cnt.textContent=`Mostrando ${rows.length} de ${all.length} productos`;
    wireTable('vta',drawVta);return;
  }
  let rows=normalizeSalesRows(st).map(r=>({...r,opp:r.su>0&&r.v<=0})),all=rows.slice();
  if(s.f==='__opp')rows=rows.filter(r=>r.opp);else if(s.f&&s.f!=='all')rows=rows.filter(r=>r.cat===s.f);
  if(s.q){const q=s.q.toLowerCase();rows=rows.filter(r=>`${r.cat} ${r.lin} ${r.sub}`.toLowerCase().includes(q));}
  const acc={cat:r=>r.cat,lin:r=>r.lin,sub:r=>r.sub,v:r=>r.v,part:r=>r.v,u:r=>r.u,su:r=>r.su};
  if(s.sort&&acc[s.sort])rows.sort(cmp(s,acc));else rows.sort((a,b)=>b.v-a.v);
  const cols=[['Categoría','cat',0],['Línea','lin',0],['Sublínea','sub',0],['Facturación 3m','v',1],['Participación','part',1],['Uds vendidas','u',1],['Stock piso','su',1]];
  const body=rows.map(r=>[`<b>${esc(r.cat)}</b>`,`<span>${esc(r.lin)}</span>`,`<span>${esc(r.sub)}</span>${r.opp?' <span class="tag sr">🎯</span>':''}`,`<b style="color:var(--vta)">${fMoneyCOP(r.v)}</b>`,`${k.vtot?(100*r.v/k.vtot).toFixed(1):0}%`,fInt(r.u),fInt(r.su)]);
  if(tbl)tbl.innerHTML=salesTableFromBase(cols,body,'salesCategoryTable');
  const cnt=document.getElementById('vta-cnt');if(cnt)cnt.textContent=`Mostrando ${rows.length} de ${all.length} sublíneas`;
  wireTable('vta',drawVta);
};

viewAmb=function(st){
  const k=st.kpi;
  const card=(cls,label,val,filter)=>`<div class="mk ${cls} clickableKpi" onclick="state.tr.f='${filter}';drawTr();document.getElementById('tr-tbl')?.scrollIntoView({behavior:'smooth',block:'start'})"><div class="l">${label}</div><div class="v">${val}</div></div>`;
  return `<div class="card"><div class="chead"><div class="cnum n3">3</div><div><div class="tt">Ambientes</div><div class="ds">Traslados pendientes por llegar a la tienda + guías de exhibición</div></div><div class="rt"><span class="badge cool">${fInt(k.trN)} líneas en tránsito</span></div></div><div class="cbody"><div class="mkpis">${card('a','Líneas / entregas',fInt(k.trN),'all')}${card('a','Unidades',fInt(k.trU),'all')}${card('a','Volumen m³',fInt(k.trVol),'all')}${card('r','Pend. picking',fInt(k.trPick),'pick')}${card('r','Pend. mov.',fInt(k.trMov),'mov')}${card('b','Fecha a revisar',fInt(k.trRev),'rev')}</div><div class="tbar"><div class="tsearch">🔎<input id="q-tr" placeholder="Buscar material o código…" oninput="state.tr.q=this.value;drawTr()"></div><span class="chip filt" data-q="tr" data-f="all">Todos</span><span class="chip filt" data-q="tr" data-f="pick">Pend. picking</span><span class="chip filt" data-q="tr" data-f="mov">Pend. movimiento</span><span class="chip filt" data-q="tr" data-f="rev">Fecha a revisar</span></div><div id="tr-tbl"></div><div class="foot"><span id="tr-cnt"></span><span>Presiona un indicador para filtrar la tabla.</span></div></div></div><div class="card"><div class="chead"><div class="cnum n3" style="background:#cfe9e6;color:var(--amb)">🖼️</div><div><div class="tt">Exhibición en piso</div><div class="ds">Presencia y unidades exhibidas</div></div><div class="rt"><span class="badge cool">${fInt(k.pres)} refs. con presencia</span></div></div><div class="cbody"><div class="mkpis"><div class="mk a clickableKpi" onclick="gotoView('inventario')"><div class="l">Referencias con presencia</div><div class="v">${fInt(k.pres)}</div></div><div class="mk a clickableKpi" onclick="gotoView('inventario')"><div class="l">Unidades exhibidas</div><div class="v">${fInt(k.exhib)}</div></div></div><div class="hint">🧩 <span>Presiona los indicadores para consultar el inventario relacionado.</span></div></div></div>`;
};

/* Funciones redefinidas; la actualización final se ejecuta una sola vez al terminar de cargar. */


/* ===== llavero-v22-interactions ===== */
/* ===== Llavero v22 · detalle común, navegación y ranking completo ===== */
(function(){
  function ensureDetailIcon(modalId){
    const modal=document.getElementById(modalId),head=modal?.querySelector('.modalHead');
    if(!head)return null;
    let icon=head.querySelector('.detailModalIcon');
    if(!icon){icon=document.createElement('div');icon.className='detailModalIcon';icon.setAttribute('aria-hidden','true');head.insertBefore(icon,head.firstChild);}
    return icon;
  }
  window.setUnifiedDetailHeader=function(kind){
    const modal=document.getElementById('rangeModal');if(!modal)return;
    const k=kind||'inventory';modal.dataset.detailKind=k;
    const icon=ensureDetailIcon('rangeModal');
    if(icon)icon.textContent=k==='rot'?'⟳':k==='evac'?'⇲':k==='sales'?'$':k==='inventory'?'▦':'i';
  };
  ensureDetailIcon('rangeModal');
  const productIcon=ensureDetailIcon('inventoryProductModal');if(productIcon)productIcon.textContent='▦';
})();

function detailKindFromTitle(title){
  const t=String(title||'').toLowerCase();
  if(t.includes('rotación'))return 'rot';
  if(t.includes('evacuación'))return 'evac';
  if(t.includes('venta'))return 'sales';
  return 'inventory';
}
function commonDetailShell(cards,note,tableHtml){
  return `<div class="detailViewShell"><div class="rangeModalSummary">${cards.map(c=>`<div class="rangeStat"><label>${esc(c[0])}</label><b>${c[1]}</b></div>`).join('')}</div><div class="rangeAgeNote">${note}</div><div class="detailTableWrap">${tableHtml}</div></div>`;
}

/* Todas las vistas de indicadores usan la misma composición del detalle por rango. */
showMetricModal=function(title,subtitle,cards,rows,empty='Sin registros para este indicador.'){
  const modal=document.getElementById('rangeModal');if(!modal)return;
  const kind=detailKindFromTitle(title);setUnifiedDetailHeader(kind);
  document.getElementById('rangeModalTitle').textContent=title;
  document.getElementById('rangeModalSubtitle').textContent=subtitle;
  const body=rows.length?rows.join(''):`<tr><td colspan="7"><div class="empty">${esc(empty)}</div></td></tr>`;
  const table=`<table class="metricProductTable"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Clasificación</th><th>Unidades por rango</th><th class="num">Unidades</th><th class="num">Valor</th></tr></thead><tbody>${body}</tbody></table>`;
  document.getElementById('rangeModalBody').innerHTML=commonDetailShell(cards,'<b>Vista interactiva:</b> presiona el nombre del producto o cualquier punto de la fila para abrir su ficha completa. La fotografía continúa ampliándose al presionarla.',table);
  modal.classList.add('on');
  modal.querySelector('.modalBody')?.scrollTo({top:0});
};

/* El detalle de cada rango conserva el diseño y abre la ficha completa. */
openRangeDetail=function(stateName,index){
  const st=S[CUR]||{},stat=exactRangeStats(st,stateName)[index];if(!stat)return;
  const items=[...stat.items].sort((a,b)=>b.units-a.units||b.value-a.value||a.r.p.n.localeCompare(b.r.p.n));
  const ageText=readableAgeRange(stat.label),kind=stateName==='Rotación'?'rot':'evac';setUnifiedDetailHeader(kind);
  document.getElementById('rangeModalTitle').textContent=`${stateName} · ${stat.label}`;
  document.getElementById('rangeModalSubtitle').textContent=`${safeText(st.name,CUR)} · productos con unidades entre ${ageText.toLowerCase()}`;
  const rows=items.map(x=>`<tr data-product-code="${esc(x.r.c)}" onclick="openBestProductDetail(${JSON.stringify(x.r.c)})" title="Abrir información detallada del producto"><td>${imageThumb(x.r.c,'sm')}</td><td><span class="code">${esc(x.r.c)}</span></td><td><button class="rangeProductName" onclick="event.stopPropagation();openBestProductDetail(${JSON.stringify(x.r.c)})">${esc(x.r.p.n)}</button><div class="pageInteractiveHint">${esc(x.r.p.cat)} · ${esc(x.r.p.lin)} · ${esc(x.r.p.sub)}</div></td><td><span class="rangeSelectedAge">${esc(stat.label)}<small>${esc(ageText)}</small></span></td><td>${allAgeChips(x.r.rangos)}</td><td class="num"><b>${fInt(x.units)}</b></td><td class="num">${fMoneyCOP(x.value)}</td></tr>`).join('');
  const table=`<table class="rangeProductTable"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Antigüedad seleccionada</th><th>Distribución completa</th><th class="num">Uds. en rango</th><th class="num">Valor estimado</th></tr></thead><tbody>${rows||'<tr><td colspan="7">Sin productos.</td></tr>'}</tbody></table>`;
  const cards=[['Rango de antigüedad',esc(stat.label)],['Edad del inventario',esc(ageText)],['Unidades en este rango',fInt(stat.units)],['Productos en este rango',fInt(stat.productsCount)]];
  document.getElementById('rangeModalBody').innerHTML=commonDetailShell(cards,'<b>Cómo leer esta vista:</b> “Antigüedad seleccionada” corresponde al rango presionado y “Distribución completa” muestra las demás unidades del mismo producto. Presiona el producto o la fila para abrir su ficha completa.',table);
  document.getElementById('rangeModal').classList.add('on');
  document.querySelector('#rangeModal .modalBody')?.scrollTo({top:0});
};

/* Cualquier producto de una vista de detalle abre siempre la ficha completa disponible. */
openBestProductDetail=function(code,source='inventory'){
  const c=safeCode(code),st=S[CUR]||{},hasInv=normalizeInventoryRows(st).some(r=>r.c===c);
  closeRangeModal();
  setTimeout(()=>{
    if(hasInv&&typeof openInventoryProduct==='function')openInventoryProduct(c);
    else if(typeof openProductFromSales==='function')openProductFromSales(c);
    const icon=document.querySelector('#inventoryProductModal .detailModalIcon');if(icon)icon.textContent='▦';
    document.querySelector('#inventoryProductModal .modalBody')?.scrollTo({top:0});
  },80);
};
openProductFromRange=function(code){openBestProductDetail(code);};

/* Agrega el código como dato navegable a todas las filas creadas por los indicadores. */
inventoryMetricRowHtml=function(r,units,value,extra=''){
  const code=safeCode(r.c||r.codigo),p=r.p||productInfo(code),rangos=r.rangos||{},u=toNum(units),v=toNum(value);
  return `<tr data-product-code="${esc(code)}" onclick="openBestProductDetail(${JSON.stringify(code)})"><td>${imageThumb(code,'sm')}</td><td><span class="code">${esc(code)}</span></td><td><button class="rangeProductName" onclick="event.stopPropagation();openBestProductDetail(${JSON.stringify(code)})">${esc(p.n||r.producto||code)}</button>${extra?`<div class="pageInteractiveHint">${extra}</div>`:''}</td><td><div class="salesClassCell"><b>${esc(p.cat||r.categoria||'—')}</b><br>${esc(p.lin||r.linea||'—')} · ${esc(p.sub||r.sublinea||'—')}</div></td><td>${invAgeHtml(rangos,toNum(r.stock||u))}</td><td class="num"><b>${fInt(u)}</b></td><td class="num"><b>${fMoneyCOP(v)}</b></td></tr>`;
};

/* Ranking completo: las 21 tiendas se muestran y cada fila abre la tienda en el módulo correspondiente. */
function openLeaderExposureStore(code,view){
  if(typeof openStoreDashboard!=='function')return;
  openStoreDashboard(code,view);
  setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),60);
}
rankChart=function(rows,key,color){
  const ranked=[...rows].filter(r=>Number.isFinite(Number(r[key]))).sort((a,b)=>b[key]-a[key]||String(a.name).localeCompare(String(b.name)));
  const max=Math.max(1,...ranked.map(x=>toNum(x[key]))),view=key==='rotPct'?'rot':'evac',label=key==='rotPct'?'Rotación':'Evacuación';
  return `<div class="rankChart fullStoreRanking"><div class="fullRankingHead"><b>Ranking completo · ${fInt(ranked.length)} tiendas</b><span>Presiona una tienda para abrir ${label}</span></div>${ranked.map((r,i)=>`<div class="rankRow" onclick="openLeaderExposureStore(${JSON.stringify(r.code)},${JSON.stringify(view)})" title="Abrir ${esc(r.name)} en ${label}"><div class="rankName"><b>${i+1}. ${esc(r.name)}</b><small>${fMoney(r.inventory)} de inventario · <span class="rankAction">Ver tienda</span></small></div><div class="rankTrack"><div class="rankFill" style="width:${Math.max(1,toNum(r[key])/max*100)}%;background:${color}"></div></div><div class="rankValue">${toNum(r[key]).toFixed(1)}%</div></div>`).join('')||'<div class="empty">Sin datos.</div>'}</div>`;
};

/* La actualización final se ejecuta una sola vez al terminar de cargar. */


/* ===== llavero-v23-exact-range-header-script ===== */
/* Quita la reinterpretación visual de v22 y conserva el encabezado original. */
(function(){
  function removeAddedIcons(){
    document.querySelectorAll('#rangeModal .detailModalIcon,#inventoryProductModal .detailModalIcon').forEach(function(el){el.remove();});
  }
  removeAddedIcons();
  document.addEventListener('DOMContentLoaded',removeAddedIcons,{once:true});
  window.setUnifiedDetailHeader=function(kind){
    var modal=document.getElementById('rangeModal');
    if(modal)modal.dataset.detailKind=kind||'inventory';
    removeAddedIcons();
  };
})();


/* ===== llavero-v27-clickable-products-script ===== */
(function(){
  const PRODUCT_ROW_SELECTOR=[
    '#rangeModal tbody tr',
    '#rot-tbl tbody tr',
    '#evac-tbl tbody tr',
    '#inventario-tbl tbody tr',
    '#vta-tbl tbody tr',
    '.summaryProductRow'
  ].join(',');

  function cleanCode(value){
    const raw=String(value||'').trim();
    if(!raw)return '';
    try{return typeof safeCode==='function'?safeCode(raw):raw.replace(/\D+/g,'');}
    catch(e){return raw.replace(/\D+/g,'');}
  }

  function codeFromInline(row){
    const attr=row.getAttribute('onclick')||'';
    const match=attr.match(/(?:openBestProductDetail|openInventoryProduct|openProductFromRange|openProductFromSales)\s*\(\s*['\"]?([^'\"),\s]+)['\"]?/i);
    return match?cleanCode(match[1]):'';
  }

  function getProductCode(row){
    if(!row)return '';
    let code=cleanCode(row.dataset.productCode||'');
    if(code)return code;
    const codeNode=row.querySelector('.code,[data-code],.productCode');
    code=cleanCode(codeNode?.dataset?.code||codeNode?.textContent||'');
    if(code)return code;
    return codeFromInline(row);
  }

  function markRows(root){
    const scope=root&&root.querySelectorAll?root:document;
    scope.querySelectorAll(PRODUCT_ROW_SELECTOR).forEach(function(row){
      if(row.closest('thead'))return;
      const code=getProductCode(row);
      if(!code)return;
      row.dataset.productCode=code;
      row.setAttribute('tabindex','0');
      row.setAttribute('role','button');
      row.setAttribute('aria-label','Ver información detallada del producto '+code);
      row.title='Presiona para ver la información detallada del producto';
    });
  }

  function openProduct(code){
    const c=cleanCode(code);if(!c)return;
    if(typeof openBestProductDetail==='function'){
      openBestProductDetail(c);
      return;
    }
    try{if(typeof closeRangeModal==='function')closeRangeModal();}catch(e){}
    setTimeout(function(){
      const st=(typeof S!=='undefined'&&typeof CUR!=='undefined'&&S[CUR])?S[CUR]:{};
      let hasInventory=false;
      try{hasInventory=typeof normalizeInventoryRows==='function'&&normalizeInventoryRows(st).some(function(r){return cleanCode(r.c)===c;});}catch(e){}
      if(hasInventory&&typeof openInventoryProduct==='function')openInventoryProduct(c);
      else if(typeof openProductFromSales==='function')openProductFromSales(c);
    },70);
  }

  document.addEventListener('click',function(event){
    const row=event.target.closest(PRODUCT_ROW_SELECTOR);
    if(!row)return;
    const imageButton=event.target.closest('.productThumb');
    if(imageButton)return; // La imagen conserva su función de ampliación.
    const code=getProductCode(row);
    if(!code)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openProduct(code);
  },true);

  document.addEventListener('keydown',function(event){
    if(event.key!=='Enter'&&event.key!==' ')return;
    const row=event.target.closest(PRODUCT_ROW_SELECTOR);
    if(!row)return;
    const code=getProductCode(row);if(!code)return;
    event.preventDefault();
    openProduct(code);
  },true);
  /* Las filas se atienden por delegación de eventos. No se recorre todo el DOM después de cada render. */
})();


/* ===== llavero-v31-html-download-script ===== */
function safeJSONForHTML(value){
  return JSON.stringify(value)
    .replace(/</g,'\\u003c')
    .replace(/>/g,'\\u003e')
    .replace(/&/g,'\\u0026')
    .replace(/\u2028/g,'\\u2028')
    .replace(/\u2029/g,'\\u2029');
}
function cleanDownloadedDocument(root,exportDB){
  const body=root.querySelector('body');
  if(body){
    body.className='auth-pending';
    body.removeAttribute('style');
  }
  root.querySelectorAll('.modalBack.on').forEach(el=>el.classList.remove('on'));
  root.querySelectorAll('.toastStack').forEach(el=>el.innerHTML='');
  const overlay=root.querySelector('#dropOverlay');if(overlay)overlay.classList.remove('on');
  const content=root.querySelector('#content');if(content)content.innerHTML='';
  const status=root.querySelector('#xlsxStatus');if(status){status.textContent='';status.style.display='none';}
  const fileInput=root.querySelector('#xlsxInput');if(fileInput)fileInput.removeAttribute('value');
  const accessUser=root.querySelector('#accessUser');if(accessUser)accessUser.removeAttribute('value');
  const leaderPin=root.querySelector('#leaderPin');if(leaderPin)leaderPin.removeAttribute('value');
  const err=root.querySelector('#leaderError');if(err)err.style.display='none';
  const title=root.querySelector('title');if(title)title.textContent=`Llavero · corte ${safeText(exportDB?.meta?.fecha,'actual')}`;
  const fs=root.querySelector('#fs');if(fs)fs.textContent=safeText(exportDB?.meta?.fecha,'—');
  const topCut=root.querySelector('#topCut');if(topCut)topCut.textContent=safeText(exportDB?.meta?.fecha,'—');
  const fsc=root.querySelector('#fsc');if(fsc)fsc.textContent=Object.keys(exportDB?.S||{}).length;
  const store=root.querySelector('#store');if(store)store.innerHTML='';
  const appdata=root.querySelector('#appdata');
  if(!appdata)throw new Error('No se encontro el bloque interno de datos.');
  appdata.textContent=safeJSONForHTML(exportDB);
}
function downloadUpdatedHTML(){
  if(!requireLeader())return;
  try{
    const exportDB=JSON.parse(JSON.stringify(DB));
    exportDB.meta=exportDB.meta||{};
    exportDB.meta.nStores=Object.keys(exportDB.S||{}).length;
    exportDB.meta.htmlGeneradoEn=new Date().toISOString();
    exportDB.meta.modoDistribucion='HTML diario con base incrustada';
    const clone=document.documentElement.cloneNode(true);
    cleanDownloadedDocument(clone,exportDB);
    const html='<!DOCTYPE html>\n'+clone.outerHTML;
    const blob=new Blob([html],{type:'text/html;charset=utf-8'});
    const link=document.createElement('a');
    const date=safeText(exportDB.meta.fecha,new Date().toISOString().slice(0,10)).replace(/[^0-9A-Za-z_-]/g,'-');
    link.href=URL.createObjectURL(blob);
    link.download=`Llavero_${date}_${Object.keys(exportDB.S||{}).length}_tiendas.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(link.href),1500);
    toast(`HTML actualizado generado · corte ${safeText(exportDB.meta.fecha,'—')}`,'ok');
  }catch(err){
    console.error('No se pudo generar el HTML actualizado',err);
    toast('No fue posible generar el HTML actualizado: '+safeText(err?.message,'error desconocido'),'err');
  }
}


/* ===== llavero-v32-history-portable ===== */
/* v32 · historial portátil entre archivos HTML diarios */
(function(){
  function mergeByDate(base,extra){
    var map={};
    (Array.isArray(base)?base:[]).concat(Array.isArray(extra)?extra:[]).forEach(function(x){
      if(x&&x.date)map[String(x.date)]=x;
    });
    return Object.keys(map).sort().map(function(k){return map[k];});
  }
  function readEmbedded(){
    try{
      var el=document.getElementById('embeddedHistory');
      return el?JSON.parse(el.textContent||'{}'):{};
    }catch(e){console.warn('No se pudo leer el historial incrustado',e);return {};}
  }
  function restoreEmbeddedHistory(){
    var embedded=readEmbedded();
    try{
      var daily=mergeByDate(embedded.daily,readStoredArray(DAILY_HISTORY_KEY)).slice(-120);
      var details=mergeByDate(embedded.details,readStoredArray(DETAIL_HISTORY_KEY)).slice(-30);
      saveStoredArray(DAILY_HISTORY_KEY,daily);
      saveStoredArray(DETAIL_HISTORY_KEY,details);
      var localActions=(typeof ACTIONS==='object'&&ACTIONS)?ACTIONS:{};
      ACTIONS=Object.assign({},embedded.actions||{},localActions);
      localStorage.setItem(ACTION_KEY,JSON.stringify(ACTIONS));
      window.__llaveroHistoryReady=true;
    }catch(e){console.warn('No se pudo restaurar el historial portátil',e);}
  }

  window.downloadUpdatedHTML=function(){
    if(!requireLeader())return;
    try{
      recordOperationalSnapshot();
      var exportDB=JSON.parse(JSON.stringify(DB));
      exportDB.meta=exportDB.meta||{};
      exportDB.meta.nStores=Object.keys(exportDB.S||{}).length;
      exportDB.meta.htmlGeneradoEn=new Date().toISOString();
      exportDB.meta.modoDistribucion='HTML diario con base e historial incrustados';
      exportDB.meta.historialIncluido=true;

      var portable={
        daily:readDailyHistory(),
        details:readDetailHistory(),
        actions:JSON.parse(JSON.stringify(ACTIONS||{})),
        exportedAt:new Date().toISOString(),
        currentDate:safeText(exportDB.meta.fecha,'')
      };

      var clone=document.documentElement.cloneNode(true);
      cleanDownloadedDocument(clone,exportDB);
      var historyNode=clone.querySelector('#embeddedHistory');
      if(!historyNode){
        historyNode=clone.ownerDocument.createElement('script');
        historyNode.id='embeddedHistory';
        historyNode.type='application/json';
        clone.querySelector('body').appendChild(historyNode);
      }
      historyNode.textContent=safeJSONForHTML(portable);

      var html='<!DOCTYPE html>\n'+clone.outerHTML;
      var blob=new Blob([html],{type:'text/html;charset=utf-8'});
      var link=document.createElement('a');
      var rawDate=safeText(exportDB.meta.fecha,new Date().toISOString().slice(0,10));
      var parts=String(rawDate).match(/(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})/);
      var date=parts?(parts[3]+'_'+parts[2]+'_'+parts[1]):String(rawDate).replace(/[^0-9]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'');
      link.href=URL.createObjectURL(blob);
      link.download='Llavero_'+date+'.html';
      document.body.appendChild(link);
      link.click();
      var url=link.href;
      link.remove();
      setTimeout(function(){URL.revokeObjectURL(url);},1500);
      toast('HTML actualizado generado con '+portable.daily.length+' cortes históricos','ok');
    }catch(err){
      console.error('No se pudo generar el HTML actualizado con historial',err);
      toast('No fue posible generar el HTML actualizado: '+safeText(err&&err.message,'error desconocido'),'err');
    }
  };

  window.__llaveroLegacyEmbeddedRestore=restoreEmbeddedHistory;
})();


/* ===== llavero-v33-summary-product-detail-script ===== */
(function(){
  function summaryOpenProduct(code){
    var c='';
    try{c=typeof safeCode==='function'?safeCode(code):String(code||'').trim();}catch(e){c=String(code||'').trim();}
    if(!c)return;
    if(typeof openInventoryProduct==='function'){
      openInventoryProduct(c);
      var body=document.querySelector('#inventoryProductModal .modalBody');
      if(body&&typeof body.scrollTo==='function')body.scrollTo({top:0});
      return;
    }
    if(typeof openBestProductDetail==='function')openBestProductDetail(c);
  }

  window.summaryProductList=function(st,stateName){
    var rows=summaryProductRows(st,stateName);
    return '<div class="summaryProductList">'+(rows.length?rows.map(function(x){
      var code=x.r.c;
      var distribution=x.entries.map(function(entry){return fInt(entry[1])+' u · '+esc(canonicalAgeLabel(entry[0]));}).join(' · ');
      return '<div class="summaryProductRow" data-summary-product="1" data-product-code="'+esc(code)+'" tabindex="0" role="button" aria-label="Ver informe detallado de '+esc(x.r.p.n)+'" title="Presiona para ver el informe detallado del producto">'+
        '<div class="summaryProductThumb">'+imageThumb(code,'sm')+'</div>'+
        '<div><button class="summaryProductNameBtn" type="button" data-summary-open="1">'+esc(x.r.p.n)+'</button><div class="summaryProductMeta">'+distribution+'</div></div>'+
        '<div class="summaryProductUnits">'+fInt(x.units)+' uds</div>'+
      '</div>';
    }).join(''):'<div class="empty">Sin productos en este estado.</div>')+'</div>';
  };

  function getRow(target){return target&&target.closest?target.closest('.summaryProductRow[data-summary-product]'):null;}

  document.addEventListener('click',function(event){
    var row=getRow(event.target);if(!row)return;
    var code=row.getAttribute('data-product-code');if(!code)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    summaryOpenProduct(code);
  },true);

  document.addEventListener('keydown',function(event){
    if(event.key!=='Enter'&&event.key!==' ')return;
    var row=getRow(event.target);if(!row)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    summaryOpenProduct(row.getAttribute('data-product-code'));
  },true);
})();


/* ===== llavero-v33-dashboard-sales-script ===== */
(function(){
  function goToStoreExposure(code,view){
    code=safeText(code,'').trim();
    view=view==='evac'?'evac':'rot';
    if(!code||!S||!S[code]){
      if(typeof toast==='function')toast('No fue posible abrir la tienda seleccionada.','err');
      return;
    }
    CUR=code;
    if(typeof sel!=='undefined'&&sel){sel.value=code;}
    if(state?.rot){state.rot.q='';state.rot.f='all';}
    if(state?.evac){state.evac.q='';state.evac.f='all';}
    var gs=document.getElementById('gsearch');if(gs)gs.value='';
    VIEW=view;
    if(typeof setActiveNav==='function')setActiveNav(view);
    if(typeof refresh==='function')refresh();
    else if(typeof setView==='function')setView(view);
    document.getElementById('side')?.classList.remove('open');
    requestAnimationFrame(function(){window.scrollTo({top:0,behavior:'smooth'});});
  }
  window.openLeaderExposureStore=goToStoreExposure;
  window.openStoreDashboard=function(code,view){
    var target=view==='evac'?'evac':view==='rot'?'rot':'resumen';
    code=safeText(code,'').trim();
    if(!code||!S||!S[code])return;
    CUR=code;
    if(typeof sel!=='undefined'&&sel)sel.value=code;
    VIEW=target;
    if(typeof setActiveNav==='function')setActiveNav(target);
    if(typeof refresh==='function')refresh();else if(typeof setView==='function')setView(target);
    requestAnimationFrame(function(){window.scrollTo({top:0,behavior:'smooth'});});
  };
  window.rankChart=function(rows,key,color){
    var ranked=[...(rows||[])].filter(function(r){return Number.isFinite(Number(r[key]));}).sort(function(a,b){return toNum(b[key])-toNum(a[key])||String(a.name).localeCompare(String(b.name));});
    var max=Math.max(1,...ranked.map(function(x){return toNum(x[key]);}));
    var view=key==='rotPct'?'rot':'evac',label=view==='rot'?'Rotación':'Evacuación';
    return '<div class="rankChart fullStoreRanking"><div class="fullRankingHead"><b>Ranking completo · '+fInt(ranked.length)+' tiendas</b><span>Presiona una tienda para abrir '+label+'</span></div>'+ranked.map(function(r,i){
      var code=String(r.code||'');
      return '<div class="rankRow" role="button" tabindex="0" data-store-code="'+esc(code)+'" data-target-view="'+view+'" title="Abrir '+esc(r.name)+' en '+label+'"><div class="rankName"><b>'+(i+1)+'. '+esc(r.name)+'</b><small>'+fMoney(r.inventory)+' de inventario · <span class="rankAction">Ver tienda</span></small></div><div class="rankTrack"><div class="rankFill" style="width:'+Math.max(1,toNum(r[key])/max*100)+'%;background:'+color+'"></div></div><div class="rankValue">'+toNum(r[key]).toFixed(1)+'%</div></div>';
    }).join('')+(ranked.length?'':'<div class="empty">Sin datos.</div>')+'</div>';
  };
  document.addEventListener('click',function(ev){
    var row=ev.target.closest('.fullStoreRanking .rankRow[data-store-code]');
    if(!row)return;
    ev.preventDefault();ev.stopPropagation();
    goToStoreExposure(row.dataset.storeCode,row.dataset.targetView);
  },true);
  document.addEventListener('keydown',function(ev){
    if(ev.key!=='Enter'&&ev.key!==' ')return;
    var row=ev.target.closest('.fullStoreRanking .rankRow[data-store-code]');
    if(!row)return;
    ev.preventDefault();
    goToStoreExposure(row.dataset.storeCode,row.dataset.targetView);
  });

  function salesRankingSection(){
    return '<div class="salesRankingGrid">'+
      '<div class="card salesRankingCard"><div class="chead"><div class="cnum n4">↑</div><div><div class="tt">Top 10 productos más vendidos</div><div class="ds">Últimos 3 meses · unidades, stock actual y venta en COP</div></div></div><div class="cbody"><div id="salesTop10"></div></div></div>'+
      '<div class="card salesRankingCard"><div class="chead"><div class="cnum n2">0</div><div><div class="tt">Top 10 productos sin venta</div><div class="ds">Últimos 3 meses · mayor dinero inmovilizado en stock</div></div></div><div class="cbody"><div id="salesNoSale10"></div></div></div>'+
      '</div>';
  }
  function tableEmpty(message,colspan){return '<div class="empty">'+esc(message)+'</div>';}
  function productOpen(code){
    if(typeof openBestProductDetail==='function')openBestProductDetail(code,'sales');
    else if(typeof openInventoryProduct==='function')openInventoryProduct(code);
  }
  window.openSalesRankingProduct=productOpen;
  function topSalesTable(rows){
    if(!rows.length)return tableEmpty('No hay ventas por producto para este corte.');
    return '<div class="salesRankingSummary"><span><b>'+fInt(rows.length)+'</b> productos</span><span>Ordenados por unidades vendidas</span></div><div class="salesRankingWrap"><table class="salesRankingTable salesTopTable"><colgroup><col><col><col><col><col><col></colgroup><thead><tr><th>#</th><th>Imagen</th><th>Producto</th><th class="num">Stock</th><th class="num">Uds. vendidas</th><th class="num">Venta 3 meses</th></tr></thead><tbody>'+rows.map(function(r,i){
      return '<tr tabindex="0" role="button" data-product-code="'+esc(r.c)+'" onclick="openSalesRankingProduct('+JSON.stringify(r.c)+')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openSalesRankingProduct('+JSON.stringify(r.c)+')}"><td><span class="rankPos">'+(i+1)+'</span></td><td>'+imageThumb(r.c,'sm')+'</td><td><div class="salesRankingProduct">'+esc(r.p.n)+'</div><div class="salesRankingMeta">'+esc(r.c)+' · '+esc(r.p.cat)+' · '+esc(r.p.lin)+' · '+esc(r.p.sub)+'</div></td><td class="num"><span class="salesRankingStock">'+fInt(r.su)+'</span></td><td class="num"><b>'+fInt(r.u)+'</b></td><td class="num"><span class="salesRankingMoney">'+fMoneyCOP(r.v)+'</span></td></tr>';
    }).join('')+'</tbody></table></div>';
  }
  function noSaleTable(rows){
    if(!rows.length)return tableEmpty('No hay productos con stock y sin venta en los últimos 3 meses.');
    return '<div class="salesRankingSummary"><span><b>'+fInt(rows.length)+'</b> productos</span><span>Ordenados por mayor dinero en stock</span></div><div class="salesRankingWrap"><table class="salesRankingTable salesNoSaleTable"><colgroup><col><col><col><col><col></colgroup><thead><tr><th>#</th><th>Imagen</th><th>Producto</th><th class="num">Stock actual</th><th class="num">Dinero en stock</th></tr></thead><tbody>'+rows.map(function(r,i){
      return '<tr tabindex="0" role="button" data-product-code="'+esc(r.c)+'" onclick="openSalesRankingProduct('+JSON.stringify(r.c)+')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openSalesRankingProduct('+JSON.stringify(r.c)+')}"><td><span class="rankPos">'+(i+1)+'</span></td><td>'+imageThumb(r.c,'sm')+'</td><td><div class="salesRankingProduct">'+esc(r.p.n)+'</div><div class="salesRankingMeta">'+esc(r.c)+' · '+esc(r.p.cat)+' · '+esc(r.p.lin)+' · '+esc(r.p.sub)+'</div></td><td class="num"><span class="salesRankingStock">'+fInt(r.su)+'</span></td><td class="num"><span class="salesRankingMoney">'+fMoneyCOP(r.sv)+'</span></td></tr>';
    }).join('')+'</tbody></table></div>';
  }
  window.drawSalesRankingsV33=function(st){
    st=st||S[CUR]||{};
    var products=normalizeProductSalesRows(st);
    var top=products.filter(function(r){return toNum(r.u)>0;}).sort(function(a,b){return toNum(b.u)-toNum(a.u)||toNum(b.v)-toNum(a.v)||String(a.p.n).localeCompare(String(b.p.n));}).slice(0,10);
    var noSale=products.filter(function(r){return toNum(r.su)>0&&toNum(r.u)<=0;}).sort(function(a,b){return toNum(b.sv)-toNum(a.sv)||toNum(b.su)-toNum(a.su)||String(a.p.n).localeCompare(String(b.p.n));}).slice(0,10);
    var topEl=document.getElementById('salesTop10'),noEl=document.getElementById('salesNoSale10');
    if(topEl)topEl.innerHTML=topSalesTable(top);
    if(noEl)noEl.innerHTML=noSaleTable(noSale);
  };
  var baseViewVta=window.viewVta;
  if(typeof baseViewVta==='function'){
    window.viewVta=function(st){return baseViewVta(st)+salesRankingSection();};
  }
  var baseDrawVta=window.drawVta;
  if(typeof baseDrawVta==='function'){
    window.drawVta=function(){baseDrawVta();drawSalesRankingsV33(S[CUR]||{});};
  }
})();


/* ===== llavero-v35-sales-fix-script ===== */
(function(){
  function inventoryMap(st){
    var map=new Map();
    try{normalizeInventoryRows(st||{}).forEach(function(r){map.set(safeCode(r.c),r);});}catch(e){}
    return map;
  }
  function commercialRows(st){
    var invMap=inventoryMap(st), gift=/\b(OBSEQUIO|OBSEQU|REGALO|BONO)\b/i;
    return normalizeProductSalesRows(st||{}).map(function(r){
      var inv=invMap.get(safeCode(r.c));
      var stock=inv?toNum(inv.stock):toNum(r.su);
      var stockValue=inv?toNum(inv.valorInventario):toNum(r.sv);
      var price=inv?Math.max(toNum(inv.precioOferta),toNum(inv.valorUnitarioPromedio)):0;
      var revenue=toNum(r.v), units=toNum(r.u), avg=units>0?revenue/units:0;
      var name=safeText(r.p&&r.p.n,'');
      var freeByMaster=!!inv && price<=0 && stockValue<=0;
      var freeOrNonMonetary=gift.test(name)||freeByMaster||avg<1000;
      return Object.assign({},r,{su:stock,sv:stockValue,commercial:units>0&&revenue>0&&!freeOrNonMonetary,avgRevenue:avg});
    });
  }
  function tableEmpty(message){return '<div class="empty">'+esc(message)+'</div>';}
  function productButton(r){
    return '<button class="salesRankingProductBtn" type="button" data-product-code="'+esc(r.c)+'">'+esc(r.p.n)+'</button>'+
      '<div class="salesRankingMeta">'+esc(r.c)+' · '+esc(r.p.cat)+' · '+esc(r.p.lin)+' · '+esc(r.p.sub)+'</div>';
  }
  function topSalesTableV35(rows){
    if(!rows.length)return tableEmpty('No hay productos con venta monetaria válida para este corte.');
    return '<div class="salesRankingSummary"><span><b>'+fInt(rows.length)+'</b> productos · <span class="salesRankingCommercialNote">Solo venta monetaria</span></span><span>Ordenados por unidades vendidas</span></div>'+
      '<div class="salesRankingWrap"><table class="salesRankingTable salesTopTable"><colgroup><col><col><col><col><col><col></colgroup><thead><tr><th>#</th><th>Imagen</th><th>Producto</th><th class="num">Stock actual</th><th class="num">Uds. vendidas 3m</th><th class="num">Valor vendido 3m</th></tr></thead><tbody>'+
      rows.map(function(r,i){return '<tr tabindex="0" role="button" data-product-code="'+esc(r.c)+'"><td><span class="rankPos">'+(i+1)+'</span></td><td>'+imageThumb(r.c,'sm')+'</td><td>'+productButton(r)+'</td><td class="num"><span class="salesRankingStock">'+fInt(r.su)+'</span></td><td class="num"><b>'+fInt(r.u)+'</b></td><td class="num"><span class="salesRankingMoney">'+fMoneyCOP(r.v)+'</span></td></tr>';}).join('')+
      '</tbody></table></div>';
  }
  function noSaleTableV35(rows){
    if(!rows.length)return tableEmpty('No hay productos con stock y sin venta en los últimos 3 meses.');
    return '<div class="salesRankingSummary"><span><b>'+fInt(rows.length)+'</b> productos</span><span>Ordenados por mayor dinero en stock</span></div>'+
      '<div class="salesRankingWrap"><table class="salesRankingTable salesNoSaleTable"><colgroup><col><col><col><col><col><col></colgroup><thead><tr><th>#</th><th>Imagen</th><th>Producto</th><th class="num">Stock actual</th><th class="num">Uds. vendidas 3m</th><th class="num">Dinero en stock</th></tr></thead><tbody>'+
      rows.map(function(r,i){return '<tr tabindex="0" role="button" data-product-code="'+esc(r.c)+'"><td><span class="rankPos">'+(i+1)+'</span></td><td>'+imageThumb(r.c,'sm')+'</td><td>'+productButton(r)+'</td><td class="num"><span class="salesRankingStock">'+fInt(r.su)+'</span></td><td class="num"><span class="salesNoSaleZero">'+fInt(r.u)+'</span></td><td class="num"><span class="salesRankingMoney">'+fMoneyCOP(r.sv)+'</span></td></tr>';}).join('')+
      '</tbody></table></div>';
  }
  window.drawSalesRankingsV33=function(st){
    st=st||S[CUR]||{};
    var products=commercialRows(st);
    var top=products.filter(function(r){return r.commercial;}).sort(function(a,b){return toNum(b.u)-toNum(a.u)||toNum(b.v)-toNum(a.v)||String(a.p.n).localeCompare(String(b.p.n));}).slice(0,10);
    var noSale=products.filter(function(r){return toNum(r.su)>0&&toNum(r.u)<=0;}).sort(function(a,b){return toNum(b.sv)-toNum(a.sv)||toNum(b.su)-toNum(a.su)||String(a.p.n).localeCompare(String(b.p.n));}).slice(0,10);
    var topEl=document.getElementById('salesTop10'),noEl=document.getElementById('salesNoSale10');
    if(topEl)topEl.innerHTML=topSalesTableV35(top);
    if(noEl)noEl.innerHTML=noSaleTableV35(noSale);
    var topCard=topEl&&topEl.closest('.salesRankingCard');
    var noCard=noEl&&noEl.closest('.salesRankingCard');
    if(topCard){var ds=topCard.querySelector('.ds');if(ds)ds.textContent='Últimos 3 meses · excluye obsequios y registros sin valor monetario';}
    if(noCard){var nds=noCard.querySelector('.ds');if(nds)nds.textContent='Últimos 3 meses · stock actual, 0 unidades vendidas y dinero inmovilizado';}
  };
  window.openSalesRankingProduct=function(code){
    var c=safeCode(code),st=S[CUR]||{},hasInventory=false;
    try{hasInventory=normalizeInventoryRows(st).some(function(r){return r.c===c;});}catch(e){}
    if(hasInventory&&typeof openInventoryProduct==='function')openInventoryProduct(c);
    else if(typeof openProductFromSales==='function')openProductFromSales(c);
  };
  window.setSalesMode=function(mode){
    mode=mode==='product'?'product':'category';
    state.vta=state.vta||{};
    state.vta.mode=mode;state.vta.f='all';state.vta.q='';
    VIEW='vta';
    if(typeof setActiveNav==='function')setActiveNav('vta');
    if(typeof setView==='function')setView('vta');
    requestAnimationFrame(function(){document.querySelector('.salesModeBar')?.scrollIntoView({behavior:'smooth',block:'nearest'});});
  };
  document.addEventListener('click',function(ev){
    var modeBtn=ev.target.closest('.salesModeBar .segmented button');
    if(modeBtn){
      ev.preventDefault();ev.stopImmediatePropagation();
      var mode=/producto/i.test(modeBtn.textContent||'')?'product':'category';
      window.setSalesMode(mode);return;
    }
    var productBtn=ev.target.closest('.salesRankingProductBtn[data-product-code]');
    if(productBtn){ev.preventDefault();ev.stopPropagation();window.openSalesRankingProduct(productBtn.dataset.productCode);return;}
    var row=ev.target.closest('#salesTop10 tr[data-product-code],#salesNoSale10 tr[data-product-code]');
    if(row&&!ev.target.closest('.productThumb')){ev.preventDefault();window.openSalesRankingProduct(row.dataset.productCode);}
  },true);
  document.addEventListener('keydown',function(ev){
    if(ev.key!=='Enter'&&ev.key!==' ')return;
    var row=ev.target.closest('#salesTop10 tr[data-product-code],#salesNoSale10 tr[data-product-code]');
    if(row){ev.preventDefault();window.openSalesRankingProduct(row.dataset.productCode);}
  },true);
})();


/* ===== llavero-v36-performance-script ===== */
(function(){
  /* Cachea conversiones costosas mientras la base no cambie. */
  var invCache=new WeakMap(),salesProdCache=new WeakMap(),salesCache=new WeakMap(),rotCache=new WeakMap(),evacCache=new WeakMap();
  var baseInv=window.normalizeInventoryRows,baseSalesProd=window.normalizeProductSalesRows,baseSales=window.normalizeSalesRows,baseRot=window.normalizeRotRows,baseEvac=window.normalizeEvacRows;
  function cached(cache,base,st){if(!st||typeof st!=='object')return base(st);if(!cache.has(st))cache.set(st,base(st));return cache.get(st).slice();}
  if(typeof baseInv==='function')window.normalizeInventoryRows=function(st){return cached(invCache,baseInv,st);};
  if(typeof baseSalesProd==='function')window.normalizeProductSalesRows=function(st){return cached(salesProdCache,baseSalesProd,st);};
  if(typeof baseSales==='function')window.normalizeSalesRows=function(st){return cached(salesCache,baseSales,st);};
  if(typeof baseRot==='function')window.normalizeRotRows=function(st){return cached(rotCache,baseRot,st);};
  if(typeof baseEvac==='function')window.normalizeEvacRows=function(st){return cached(evacCache,baseEvac,st);};
  window.clearLlaveroCaches=function(){invCache=new WeakMap();salesProdCache=new WeakMap();salesCache=new WeakMap();rotCache=new WeakMap();evacCache=new WeakMap();};

  state.inventario.limit=state.inventario.limit||300;
  state.vta.limit=state.vta.limit||250;
  window.showMoreInventory=function(){state.inventario.limit+=300;drawInventario();};
  window.showMoreSales=function(){state.vta.limit+=250;drawVta();};

  window.drawInventario=function(){
    const st=S[CUR]||{},s=state.inventario,all=normalizeInventoryRows(st).filter(r=>r.stock>0);syncInventoryFilters(all);let rows=all.slice();
    if(s.f==='rot')rows=rows.filter(r=>r.estados.includes('Rotación'));if(s.f==='evac')rows=rows.filter(r=>r.estados.includes('Evacuación'));if(s.f==='360')rows=rows.filter(r=>Object.keys(r.rangos||{}).some(x=>ageRankFromLabel(x)>=6));if(s.f==='sr')rows=rows.filter(r=>r.dispCendis<=0);if(s.cat)rows=rows.filter(r=>r.p.cat===s.cat);if(s.lin)rows=rows.filter(r=>r.p.lin===s.lin);if(s.sub)rows=rows.filter(r=>r.p.sub===s.sub);if(s.q){const q=s.q.toLowerCase();rows=rows.filter(r=>(r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub+' '+safeText(r.familia,'')+' '+safeText(r.matriz,'')).toLowerCase().includes(q));}
    rows.sort(cmp(s,{c:r=>r.c,p:r=>r.p.n,state:r=>r.estados.join(' '),stock:r=>r.stock,age:r=>Math.max(-1,...Object.keys(r.rangos||{}).map(ageRankFromLabel)),cendis:r=>r.dispCendis,value:r=>r.valorInventario}));
    const total=rows.length,visible=rows.slice(0,s.limit||300),el=document.getElementById('inventario-tbl');
    if(el){el.innerHTML=inventoryTableHTML(visible)+(total>visible.length?`<div class="performanceMore"><button onclick="showMoreInventory()">Mostrar 300 más</button><span class="performanceNotice">${fInt(visible.length)} de ${fInt(total)}</span></div>`:'');}
    const cnt=document.getElementById('inventario-cnt');if(cnt)cnt.textContent=`Mostrando ${visible.length} de ${total} referencias filtradas · ${all.length} en inventario`;
    document.querySelectorAll('.chip.filt[data-q="inventario"]').forEach(ch=>{ch.classList.toggle('on',s.f===ch.dataset.f);ch.onclick=()=>{s.f=ch.dataset.f;s.limit=300;drawInventario();};});
  };

  window.drawVta=function(){
    const st=S[CUR]||{},s=state.vta,k=st.kpi||{},mode=s.mode||'category',tbl=document.getElementById('vta-tbl');
    if(mode==='product'){
      let rows=normalizeProductSalesRows(st),all=rows.slice();
      if(s.q){const q=s.q.toLowerCase();rows=rows.filter(r=>(r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub).toLowerCase().includes(q));}
      const acc={c:r=>r.c,p:r=>r.p.n,v:r=>r.v,part:r=>r.v,u:r=>r.u,su:r=>r.su,sv:r=>r.sv};
      if(s.sort&&acc[s.sort])rows.sort(cmp(s,acc));else rows.sort((a,b)=>b.v-a.v||b.u-a.u||a.p.n.localeCompare(b.p.n));
      const total=rows.length,visible=rows.slice(0,s.limit||250);
      const cols=[['Imagen','x',0],['Código','c',0],['Producto','p',0],['Clasificación','x',0],['Venta 3m','v',1],['Part.','part',1],['Uds vendidas','u',1],['Stock','su',1],['Valor stock','sv',1]];
      const body=visible.map(r=>[imageThumb(r.c,'sm'),`<span class="code">${esc(r.c)}</span>`,`<div class="salesNameCell">${esc(r.p.n)}<small>Presiona para abrir el detalle</small></div>`,`<div class="salesClassCell"><b>${esc(r.p.cat)}</b><br>${esc(r.p.lin)}<br>${esc(r.p.sub)}</div>`,`<b style="color:var(--vta)">${fMoneyCOP(r.v)}</b>`,`${k.vtot?(100*r.v/k.vtot).toFixed(1):0}%`,fInt(r.u),fInt(r.su),fMoneyCOP(r.sv)]);
      if(tbl){tbl.innerHTML=salesTableFromBase(cols,body,'salesProductTable')+(total>visible.length?`<div class="performanceMore"><button onclick="showMoreSales()">Mostrar 250 más</button><span class="performanceNotice">${fInt(visible.length)} de ${fInt(total)}</span></div>`:'');tbl.querySelectorAll('tbody tr').forEach((tr,i)=>{tr.dataset.productCode=visible[i].c;});}
      const cnt=document.getElementById('vta-cnt');if(cnt)cnt.textContent=`Mostrando ${visible.length} de ${total} productos filtrados · ${all.length} disponibles`;
      wireTable('vta',drawVta);if(typeof drawSalesRankingsV33==='function')drawSalesRankingsV33(st);return;
    }
    let rows=normalizeSalesRows(st).map(r=>({...r,opp:r.su>0&&r.v<=0})),all=rows.slice();
    if(s.f==='__opp')rows=rows.filter(r=>r.opp);else if(s.f&&s.f!=='all')rows=rows.filter(r=>r.cat===s.f);
    if(s.q){const q=s.q.toLowerCase();rows=rows.filter(r=>`${r.cat} ${r.lin} ${r.sub}`.toLowerCase().includes(q));}
    const acc={cat:r=>r.cat,lin:r=>r.lin,sub:r=>r.sub,v:r=>r.v,part:r=>r.v,u:r=>r.u,su:r=>r.su};
    if(s.sort&&acc[s.sort])rows.sort(cmp(s,acc));else rows.sort((a,b)=>b.v-a.v);
    const cols=[['Categoría','cat',0],['Línea','lin',0],['Sublínea','sub',0],['Facturación 3m','v',1],['Participación','part',1],['Uds vendidas','u',1],['Stock piso','su',1]];
    const body=rows.map(r=>[`<b>${esc(r.cat)}</b>`,`<span>${esc(r.lin)}</span>`,`<span>${esc(r.sub)}</span>${r.opp?' <span class="tag sr">🎯</span>':''}`,`<b style="color:var(--vta)">${fMoneyCOP(r.v)}</b>`,`${k.vtot?(100*r.v/k.vtot).toFixed(1):0}%`,fInt(r.u),fInt(r.su)]);
    if(tbl)tbl.innerHTML=salesTableFromBase(cols,body,'salesCategoryTable');
    const cnt=document.getElementById('vta-cnt');if(cnt)cnt.textContent=`Mostrando ${rows.length} de ${all.length} sublíneas`;
    wireTable('vta',drawVta);if(typeof drawSalesRankingsV33==='function')drawSalesRankingsV33(st);
  };

  var oldSetSalesMode=window.setSalesMode;
  window.setSalesMode=function(mode){state.vta.limit=250;return oldSetSalesMode?oldSetSalesMode(mode):undefined;};

  /* Una sola actualización final, cuando todas las extensiones ya están instaladas. */
  setTimeout(function(){
    if(typeof isAuthenticated==='function'&&isAuthenticated()&&typeof refresh==='function')refresh();
    var schedule=window.requestIdleCallback||function(fn){setTimeout(fn,1200);};
    schedule(function ensureSnapshot(){
      try{
        if(!window.__llaveroHistoryReady){setTimeout(ensureSnapshot,500);return;}
        var date=safeText(DB?.meta?.fecha,'');
        var exists=typeof readDailyHistory==='function'&&readDailyHistory().some(function(x){return x&&x.date===date;});
        if(!exists&&typeof recordOperationalSnapshot==='function')recordOperationalSnapshot();
      }catch(e){console.warn('Seguimiento diferido no disponible',e);}
    });
  },0);
})();


/* ===== llavero-v35-tracking-visible-script ===== */
(function(){
  var baseReadDetailHistory=window.readDetailHistory;
  function mergeByDate(a,b){
    var map={};
    (Array.isArray(a)?a:[]).concat(Array.isArray(b)?b:[]).forEach(function(x){if(x&&x.date)map[String(x.date)]=x;});
    return Object.keys(map).sort().map(function(k){return map[k];});
  }
  function embeddedDetails(){
    try{var el=document.getElementById('embeddedHistory'),x=el?JSON.parse(el.textContent||'{}'):{};return Array.isArray(x.details)?x.details:[];}catch(e){return [];}
  }
  function keepBaseAndRecent(rows,max){
    rows=mergeByDate([],rows);max=max||30;
    if(rows.length<=max)return rows;
    return [rows[0]].concat(rows.slice(-(max-1)));
  }
  window.readDetailHistory=function(){
    var local=[];try{local=typeof baseReadDetailHistory==='function'?baseReadDetailHistory():[];}catch(e){}
    return keepBaseAndRecent(mergeByDate(embeddedDetails(),local),30);
  };
  window.recordOperationalSnapshot=function(){
    if(!Object.keys(S||{}).length)return;
    var current=buildDetailedSnapshot(),details=readDetailHistory(),previous=details.filter(function(x){return String(x.date)<String(current.date);}).pop()||null,stores={};
    Object.keys(current.stores).forEach(function(code){stores[code]=buildStoreDailySummary(current.stores[code],previous&&previous.stores&&previous.stores[code]);});
    var summary={date:current.date,stores:stores,hasPrevious:!!previous,previousDate:previous?previous.date:null};
    var modern=readStoredArray(DAILY_HISTORY_KEY).filter(function(x){return x&&x.date!==current.date;});
    modern.push(summary);modern.sort(function(a,b){return String(a.date).localeCompare(String(b.date));});saveStoredArray(DAILY_HISTORY_KEY,modern.slice(-120));
    var next=details.filter(function(x){return x&&x.date!==current.date;});next.push(current);saveStoredArray(DETAIL_HISTORY_KEY,keepBaseAndRecent(next,30));
  };

  window.LLV_TRACK=window.LLV_TRACK||{storeRef:'previous',storeState:'rot',storeMetric:'both',storeStatus:'all',leaderRef:'previous',leaderState:'rot',leaderMetric:'both'};
  var T=window.LLV_TRACK;
  function currentSnapshot(){return buildDetailedSnapshot();}
  function referenceSnapshot(mode,currentDate){
    var prior=readDetailHistory().filter(function(x){return String(x.date)<String(currentDate);});
    if(!prior.length)return currentSnapshot();
    return mode==='base'?prior[0]:prior[prior.length-1];
  }
  function stateMap(rows){
    var m={};(rows||[]).forEach(function(r){var c=safeCode(r&&r[0]);if(!c)return;if(!m[c])m[c]={u:0,v:0,age:-1};m[c].u+=toNum(r&&r[1]);m[c].v+=toNum(r&&r[2]);m[c].age=Math.max(m[c].age,toNum(r&&r[3]));});return m;
  }
  function metricStatus(ref,cur,key,existsRef,existsCur){
    if(existsRef&&!existsCur)return 'recovered';
    if(!existsRef&&existsCur)return 'new';
    var d=toNum(cur&&cur[key])-toNum(ref&&ref[key]);
    if(d<-.0001)return 'partial';if(d>.0001)return 'increased';return 'persistent';
  }
  function combinedStatus(ref,cur,existsRef,existsCur){
    if(existsRef&&!existsCur)return 'recovered';
    if(!existsRef&&existsCur)return 'new';
    var du=toNum(cur&&cur.u)-toNum(ref&&ref.u),dv=toNum(cur&&cur.v)-toNum(ref&&ref.v);
    if(Math.abs(du)<.0001&&Math.abs(dv)<.01)return 'persistent';
    if((du<=0&&dv<=0)&&(du<0||dv<0))return 'partial';
    if((du>=0&&dv>=0)&&(du>0||dv>0))return 'increased';
    return 'mixed';
  }
  function compareStore(code,stateKey,refMode,metric){
    var current=currentSnapshot(),refSnap=referenceSnapshot(refMode,current.date),curStore=current.stores&&current.stores[code],refStore=refSnap&&refSnap.stores&&refSnap.stores[code];
    if(!refSnap||!curStore)return {currentDate:current.date,reference:null,items:[],summary:null};
    var cur=stateMap(curStore[stateKey]||[]),ref=stateMap((refStore&&refStore[stateKey])||[]),keys=Array.from(new Set(Object.keys(cur).concat(Object.keys(ref)))),items=[];
    keys.forEach(function(c){
      var existsRef=!!ref[c],existsCur=!!cur[c],r=ref[c]||{u:0,v:0,age:-1},n=cur[c]||{u:0,v:0,age:-1},status=metric==='units'?metricStatus(r,n,'u',existsRef,existsCur):metric==='value'?metricStatus(r,n,'v',existsRef,existsCur):combinedStatus(r,n,existsRef,existsCur),p=productInfo(c);
      items.push({c:c,p:p,refU:r.u,curU:n.u,diffU:n.u-r.u,refV:r.v,curV:n.v,diffV:n.v-r.v,refAge:r.age,curAge:n.age,status:status});
    });
    function sum(fn){return items.reduce(function(a,x){return a+toNum(fn(x));},0);}
    var refU=sum(function(x){return x.refU;}),curU=sum(function(x){return x.curU;}),refV=sum(function(x){return x.refV;}),curV=sum(function(x){return x.curV;}),newU=sum(function(x){return x.status==='new'?x.curU:0;}),newV=sum(function(x){return x.status==='new'?x.curV:0;}),recU=sum(function(x){return x.status==='recovered'?x.refU:0;}),recV=sum(function(x){return x.status==='recovered'?x.refV:0;}),partU=sum(function(x){return x.refU>0&&x.curU>0?Math.max(0,x.refU-x.curU):0;}),partV=sum(function(x){return x.refV>0&&x.curV>0?Math.max(0,x.refV-x.curV):0;}),adjU=refU+newU,adjV=refV+newV;
    var summary={refU:refU,curU:curU,newU:newU,recoveredU:recU,partialU:partU,progressU:adjU>0?(adjU-curU)/adjU*100:0,refV:refV,curV:curV,newV:newV,recoveredV:recV,partialV:partV,progressV:adjV>0?(adjV-curV)/adjV*100:0};
    return {currentDate:current.date,reference:refSnap.date,items:items,summary:summary};
  }
  function statusLabel(s){return {recovered:'Gestionado',partial:'Reducción parcial',new:'Nuevo',increased:'Aumentó',persistent:'Persistente',mixed:'Cambio mixto'}[s]||'Todos';}
  function stateLabel(s){return s==='evac'?'Evacuación':'Rotación';}
  function refLabel(mode){return mode==='base'?'corte base':'corte anterior';}
  function progressHtml(v){var cls=v>.05?'good':v<-.05?'bad':'flat',arrow=v>.05?'↑':v<-.05?'↓':'→';return '<span class="trackProgress '+cls+'">'+arrow+' '+Math.abs(v).toFixed(1)+'%</span>';}
  function deltaHtml(v,isMoney){var cls=v<0?'good':v>0?'bad':'flat',prefix=v>0?'+':'';return '<span class="trackingDelta '+cls+'">'+prefix+(isMoney?fMoneyCOP(v):fInt(v))+'</span>';}
  function metricCard(label,badge,values,isMoney){
    var fmt=isMoney?fMoneyCOP:fInt;
    return '<div class="trackingMeasure"><div class="trackingMeasureHead"><b>'+label+'</b><span>'+badge+'</span></div><div class="trackingMetricGrid">'+
      '<div class="trackingMetric"><label>Referencia</label><b>'+fmt(values.ref)+'</b></div>'+
      '<div class="trackingMetric"><label>Actual</label><b>'+fmt(values.cur)+'</b></div>'+
      '<div class="trackingMetric good"><label>Gestionado + reducción</label><b>'+fmt(values.recovered+values.partial)+'</b></div>'+
      '<div class="trackingMetric new"><label>Nuevos</label><b>'+fmt(values.newVal)+'</b></div>'+
      '<div class="trackingMetric '+(values.progress>=0?'good':'bad')+'"><label>Avance ajustado</label><b>'+progressHtml(values.progress)+'</b></div>'+
      '</div></div>';
  }
  function statusButtons(items,current){
    var statuses=['all','recovered','partial','persistent','new','increased','mixed'];
    return '<div class="trackingStatusBar">'+statuses.map(function(s){var n=s==='all'?items.length:items.filter(function(x){return x.status===s;}).length;return '<button class="trackStatusBtn '+(current===s?'on':'')+'" data-status="'+s+'" onclick="setStoreTrackStatus(\''+s+'\')"><span class="trackStatusDot"></span><span>'+statusLabel(s)+'</span><b>'+fInt(n)+'</b></button>';}).join('')+'</div>';
  }
  function trackingRows(data,metric,status){
    var rows=data.items.slice();if(status!=='all')rows=rows.filter(function(x){return x.status===status;});
    var order={recovered:0,partial:1,new:2,increased:3,mixed:4,persistent:5};rows.sort(function(a,b){return (order[a.status]-order[b.status])||Math.abs(b.diffV)-Math.abs(a.diffV)||Math.abs(b.diffU)-Math.abs(a.diffU);});
    if(!rows.length)return '<div class="trackingEmpty">No hay productos para este resultado.</div>';
    var unitCols=metric!=='value',valueCols=metric!=='units';
    var colgroup='<colgroup><col style="width:58px"><col style="width:105px"><col style="width:310px"><col style="width:140px">'+(unitCols?'<col style="width:105px"><col style="width:105px"><col style="width:110px">':'')+(valueCols?'<col style="width:135px"><col style="width:135px"><col style="width:140px">':'')+'</colgroup>';
    return '<div class="trackingTableWrap trackingTableWrapV84"><table class="trackingTable trackingComparisonTableV84">'+colgroup+'<thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Resultado</th>'+(unitCols?'<th class="num">Uds. ref.</th><th class="num">Uds. actual</th><th class="num">Dif. uds.</th>':'')+(valueCols?'<th class="num">Valor ref.</th><th class="num">Valor actual</th><th class="num">Dif. valor</th>':'')+'</tr></thead><tbody>'+rows.map(function(x){return '<tr tabindex="0" role="button" onclick="openTrackingProduct(\''+esc(x.c)+'\')" onkeydown="if(event.key===\'Enter\'){openTrackingProduct(\''+esc(x.c)+'\')}"><td>'+imageThumb(x.c,'sm')+'</td><td><span class="code">'+esc(x.c)+'</span></td><td><div class="trackingProduct">'+esc(x.p.n)+'</div><div class="trackingMeta">'+esc(x.p.cat)+' · '+esc(x.p.lin)+' · '+esc(x.p.sub)+'</div></td><td><span class="trackingResult '+x.status+'">'+statusLabel(x.status)+'</span></td>'+(unitCols?'<td class="num">'+fInt(x.refU)+'</td><td class="num"><b>'+fInt(x.curU)+'</b></td><td class="num">'+deltaHtml(x.diffU,false)+'</td>':'')+(valueCols?'<td class="num">'+fMoneyCOP(x.refV)+'</td><td class="num"><b>'+fMoneyCOP(x.curV)+'</b></td><td class="num">'+deltaHtml(x.diffV,true)+'</td>':'')+'</tr>';}).join('')+'</tbody></table></div>';
  }
  window.openTrackingProduct=function(code){
    var c=safeCode(code),row=normalizeInventoryRows(S[CUR]||{}).find(function(x){return x.c===c;});
    if(row&&typeof openInventoryProduct==='function'){openInventoryProduct(c);return;}
    var d=compareStore(CUR,T.storeState,T.storeRef,T.storeMetric),x=d.items.find(function(i){return i.c===c;});if(!x)return;
    var modal=document.getElementById('rangeModal');if(!modal)return;
    document.getElementById('rangeModalTitle').textContent=x.p.n;
    document.getElementById('rangeModalSubtitle').textContent='Código '+x.c+' · seguimiento histórico';
    document.getElementById('rangeModalBody').innerHTML='<div class="rangeModalSummary"><div class="rangeStat"><label>Resultado</label><b>'+statusLabel(x.status)+'</b></div><div class="rangeStat"><label>Unidades referencia</label><b>'+fInt(x.refU)+'</b></div><div class="rangeStat"><label>Unidades actuales</label><b>'+fInt(x.curU)+'</b></div><div class="rangeStat"><label>Valor actual</label><b>'+fMoneyCOP(x.curV)+'</b></div></div><div class="trackingNote">Este producto ya no está disponible en el inventario actual para abrir la ficha completa. Se muestra el comparativo histórico conservado en los cortes.</div>';
    modal.classList.add('on');
  };
  function controlButton(label,value,current,fn){return '<button class="trackBtn '+(value===current?'on':'')+'" onclick="'+fn+'(\''+value+'\')">'+label+'</button>';}
  function storePanel(code){
    var d=compareStore(code,T.storeState,T.storeRef,T.storeMetric),st=S[code]||{};
    var head='<div class="card trackingPanel" id="storeTrackingPanel"><div class="chead"><div class="cnum n1">↔</div><div><div class="tt">Seguimiento frente al corte</div><div class="ds">Qué salió, disminuyó, permaneció, ingresó o aumentó en '+stateLabel(T.storeState)+'</div></div><div class="rt"><span class="badge mut">'+esc(safeText(st.name,code))+'</span></div></div>';
    var controls='<div class="trackingControls"><div class="trackingControlGroup"><span class="trackingControlLabel">Comparar</span>'+controlButton('Corte anterior','previous',T.storeRef,'setStoreTrackRef')+controlButton('Corte base','base',T.storeRef,'setStoreTrackRef')+'</div><div class="trackingControlGroup"><span class="trackingControlLabel">Estado</span>'+controlButton('Rotación','rot',T.storeState,'setStoreTrackState')+controlButton('Evacuación','evac',T.storeState,'setStoreTrackState')+'</div><div class="trackingControlGroup"><span class="trackingControlLabel">Vista</span>'+controlButton('Unidades','units',T.storeMetric,'setStoreTrackMetric')+controlButton('Pesos','value',T.storeMetric,'setStoreTrackMetric')+controlButton('Juntos','both',T.storeMetric,'setStoreTrackMetric')+'</div><div class="trackingReference">'+(d.reference===d.currentDate?'Corte <b>'+esc(d.currentDate)+'</b> · <b>línea base</b>':d.reference?'Actual <b>'+esc(d.currentDate)+'</b> vs. '+refLabel(T.storeRef)+' <b>'+esc(d.reference)+'</b>':'Este corte es la <b>línea base</b>')+'</div></div>';
    if(!d.reference)return head+controls+'<div class="cbody"><div class="trackingEmpty"><b>No existe todavía un corte anterior.</b><br>Cuando se cargue el siguiente día, Llavero mostrará automáticamente las variaciones en unidades y pesos.</div></div></div>';
    var s=d.summary,dual='<div class="trackingDualSummary">'+metricCard('Vista por unidades','UNIDADES',{ref:s.refU,cur:s.curU,recovered:s.recoveredU,partial:s.partialU,newVal:s.newU,progress:s.progressU},false)+metricCard('Vista por valor del inventario','COP',{ref:s.refV,cur:s.curV,recovered:s.recoveredV,partial:s.partialV,newVal:s.newV,progress:s.progressV},true)+'</div>';
    return head+controls+'<div class="cbody">'+dual+statusButtons(d.items,T.storeStatus)+trackingRows(d,T.storeMetric,T.storeStatus)+'<div class="trackingNote"><b>Lectura:</b> “Gestionado” dejó completamente el estado; “Reducción parcial” continúa, pero con menos unidades o valor; “Persistente” no cambió; “Nuevo” ingresó después del corte de referencia; “Aumentó” incrementó su exposición. La salida del estado no confirma por sí sola una venta.</div></div></div>';
  }
  window.renderStoreTracking=function(){var el=document.getElementById('storeTrackingPanel');if(el)el.outerHTML=storePanel(CUR);};
  window.setStoreTrackRef=function(v){T.storeRef=v;T.storeStatus='all';renderStoreTracking();};
  window.setStoreTrackState=function(v){T.storeState=v;T.storeStatus='all';renderStoreTracking();};
  window.setStoreTrackMetric=function(v){T.storeMetric=v;T.storeStatus='all';renderStoreTracking();};
  window.setStoreTrackStatus=function(v){T.storeStatus=v;renderStoreTracking();};

  function leaderRows(){return getStoreKeys().map(function(code){var d=compareStore(code,T.leaderState,T.leaderRef,T.leaderMetric);return {code:code,name:safeText(S[code]&&S[code].name,code),data:d};}).filter(function(x){return !!x.data.reference;});}
  function leaderPanel(){
    var rows=leaderRows(),metric=T.leaderMetric;
    var aggregate=rows.reduce(function(a,r){var s=r.data.summary;['refU','curU','newU','recoveredU','partialU','refV','curV','newV','recoveredV','partialV'].forEach(function(k){a[k]+=toNum(s[k]);});return a;},{refU:0,curU:0,newU:0,recoveredU:0,partialU:0,refV:0,curV:0,newV:0,recoveredV:0,partialV:0});
    aggregate.progressU=(aggregate.refU+aggregate.newU)>0?(aggregate.refU+aggregate.newU-aggregate.curU)/(aggregate.refU+aggregate.newU)*100:0;aggregate.progressV=(aggregate.refV+aggregate.newV)>0?(aggregate.refV+aggregate.newV-aggregate.curV)/(aggregate.refV+aggregate.newV)*100:0;
    rows.sort(function(a,b){var av=metric==='units'?a.data.summary.progressU:metric==='value'?a.data.summary.progressV:(a.data.summary.progressU+a.data.summary.progressV)/2,bv=metric==='units'?b.data.summary.progressU:metric==='value'?b.data.summary.progressV:(b.data.summary.progressU+b.data.summary.progressV)/2;return bv-av;});
    var current=currentSnapshot(),ref=referenceSnapshot(T.leaderRef,current.date),head='<div class="card trackingPanel" id="leaderTrackingPanel"><div class="chead"><div class="cnum n4">↕</div><div><div class="tt">Seguimiento comparativo de tiendas</div><div class="ds">Ranking por avance en '+stateLabel(T.leaderState)+' · unidades y valor en COP</div></div><div class="rt"><span class="badge mut">'+fInt(rows.length)+' tiendas</span></div></div>';
    var controls='<div class="trackingControls"><div class="trackingControlGroup"><span class="trackingControlLabel">Comparar</span>'+controlButton('Corte anterior','previous',T.leaderRef,'setLeaderTrackRef')+controlButton('Corte base','base',T.leaderRef,'setLeaderTrackRef')+'</div><div class="trackingControlGroup"><span class="trackingControlLabel">Estado</span>'+controlButton('Rotación','rot',T.leaderState,'setLeaderTrackState')+controlButton('Evacuación','evac',T.leaderState,'setLeaderTrackState')+'</div><div class="trackingControlGroup"><span class="trackingControlLabel">Ranking</span>'+controlButton('Unidades','units',T.leaderMetric,'setLeaderTrackMetric')+controlButton('Pesos','value',T.leaderMetric,'setLeaderTrackMetric')+controlButton('Juntos','both',T.leaderMetric,'setLeaderTrackMetric')+'</div><div class="trackingReference">'+(ref&&ref.date===current.date?'Corte <b>'+esc(current.date)+'</b> · <b>línea base</b>':ref?'Actual <b>'+esc(current.date)+'</b> vs. '+refLabel(T.leaderRef)+' <b>'+esc(ref.date)+'</b>':'Este corte es la <b>línea base</b>')+'</div></div>';
    if(!ref)return head+controls+'<div class="cbody"><div class="trackingEmpty">El ranking se habilitará cuando exista un segundo corte.</div></div></div>';
    var summary='<div class="leaderTrackingSummary"><div class="leaderTrackingKpi"><label>Avance en unidades</label><b>'+progressHtml(aggregate.progressU)+'</b></div><div class="leaderTrackingKpi"><label>Unidades gestionadas o reducidas</label><b>'+fInt(aggregate.recoveredU+aggregate.partialU)+'</b></div><div class="leaderTrackingKpi"><label>Avance en valor COP</label><b>'+progressHtml(aggregate.progressV)+'</b></div><div class="leaderTrackingKpi"><label>Valor gestionado o reducido</label><b>'+fMoneyCOP(aggregate.recoveredV+aggregate.partialV)+'</b></div></div>';
    var unitCols=metric!=='value',valueCols=metric!=='units';
    var table='<div class="trackingTableWrap"><table class="trackingTable leaderTrackTable"><thead><tr><th>Tienda</th>'+(unitCols?'<th class="num">Uds. ref.</th><th class="num">Uds. actual</th><th class="num">Gest./reducción</th><th class="num">Nuevas</th><th class="num">Avance uds.</th>':'')+(valueCols?'<th class="num">Valor ref.</th><th class="num">Valor actual</th><th class="num">Valor recup./reduc.</th><th class="num">Valor nuevo</th><th class="num">Avance COP</th>':'')+'</tr></thead><tbody>'+rows.map(function(r){var s=r.data.summary;return '<tr tabindex="0" role="button" onclick="openLeaderStoreTracking(\''+esc(r.code)+'\')" onkeydown="if(event.key===\'Enter\'){openLeaderStoreTracking(\''+esc(r.code)+'\')}"><td><div class="leaderStoreName">'+esc(r.name)+'</div><div class="leaderStoreSub">Ver detalle de productos →</div></td>'+(unitCols?'<td class="num">'+fInt(s.refU)+'</td><td class="num"><b>'+fInt(s.curU)+'</b></td><td class="num">'+fInt(s.recoveredU+s.partialU)+'</td><td class="num">'+fInt(s.newU)+'</td><td class="num">'+progressHtml(s.progressU)+'</td>':'')+(valueCols?'<td class="num">'+fMoneyCOP(s.refV)+'</td><td class="num"><b>'+fMoneyCOP(s.curV)+'</b></td><td class="num">'+fMoneyCOP(s.recoveredV+s.partialV)+'</td><td class="num">'+fMoneyCOP(s.newV)+'</td><td class="num">'+progressHtml(s.progressV)+'</td>':'')+'</tr>';}).join('')+'</tbody></table></div>';
    return head+controls+'<div class="cbody">'+summary+table+'<div class="trackingNote">Presiona una tienda para abrir su Resumen y consultar el detalle por producto: gestionados, reducciones parciales, persistentes, nuevos y aumentos.</div></div></div>';
  }
  window.renderLeaderTracking=function(){var el=document.getElementById('leaderTrackingPanel');if(el)el.outerHTML=leaderPanel();};
  window.setLeaderTrackRef=function(v){T.leaderRef=v;renderLeaderTracking();};
  window.setLeaderTrackState=function(v){T.leaderState=v;renderLeaderTracking();};
  window.setLeaderTrackMetric=function(v){T.leaderMetric=v;renderLeaderTracking();};
  window.openLeaderStoreTracking=function(code){
    if(!S[code])return;CUR=code;if(typeof sel!=='undefined'&&sel)sel.value=code;VIEW='resumen';if(typeof setActiveNav==='function')setActiveNav('resumen');if(typeof refresh==='function')refresh();
    setTimeout(function(){var el=document.getElementById('storeTrackingPanel');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});},80);
  };

  var baseResumen=window.viewResumen;
  if(typeof baseResumen==='function')window.viewResumen=function(st){return baseResumen(st)+storePanel(CUR);};
  window.__llaveroLeaderTrackingPanel=leaderPanel;
  var baseLeader=window.viewLeaderDashboard;
  if(typeof baseLeader==='function')window.viewLeaderDashboard=function(){return baseLeader()+leaderPanel();};
})();


/* ===== llavero-v34-proximos-rotar-script ===== */
(function(){
  var proxCache=new WeakMap();
  function age6090Units(rangos){
    return Object.entries(rangos||{}).reduce(function(sum,entry){return sum+(ageRankFromLabel(entry[0])===2?toNum(entry[1]):0);},0);
  }
  function productSalesMap(st){
    var map={};
    normalizeProductSalesRows(st).forEach(function(r){map[safeCode(r.c)]={units:toNum(r.u),value:toNum(r.v)};});
    return map;
  }
  window.upcomingRotationRows=function(st){
    st=st||S[CUR]||{};
    if(st&&typeof st==='object'&&proxCache.has(st))return proxCache.get(st);
    var sales=productSalesMap(st);
    var rows=normalizeInventoryRows(st).filter(function(r){return r.stock>0;}).map(function(r){
      var units=age6090Units(r.rangos),share=r.stock>0?units/r.stock*100:0,value=r.stock>0?r.valorInventario*(units/r.stock):0,s=sales[r.c]||{units:0,value:0};
      return {c:r.c,p:r.p,units:units,stock:r.stock,share:share,value:value,cendis:toNum(r.dispCendis),salesUnits:s.units,salesValue:s.value,rangos:r.rangos};
    }).filter(function(r){return r.units>0;});
    if(st&&typeof st==='object')proxCache.set(st,rows);
    return rows;
  };
  function proxStats(rows,st){
    var inventoryUnits=normalizeInventoryRows(st).reduce(function(a,r){return a+toNum(r.stock);},0);
    return {products:rows.length,units:rows.reduce(function(a,r){return a+r.units;},0),value:rows.reduce(function(a,r){return a+r.value;},0),share:inventoryUnits>0?rows.reduce(function(a,r){return a+r.units;},0)/inventoryUnits*100:0,noSales:rows.filter(function(r){return r.salesUnits<=0;}).length};
  }
  function categoryData(rows){
    var m={};rows.forEach(function(r){var k=safeText(r.p.cat,'Sin categoría');if(!m[k])m[k]={name:k,units:0,products:0,value:0};m[k].units+=r.units;m[k].products+=1;m[k].value+=r.value;});
    return Object.values(m).sort(function(a,b){return b.units-a.units;});
  }
  function proxChart(rows){
    var data=categoryData(rows).slice(0,10),max=Math.max(1,...data.map(function(x){return x.units;}));
    if(!data.length)return '<div class="empty">Sin productos entre 60 y 90 días.</div>';
    return '<div class="proxBarList">'+data.map(function(x){return '<button class="proxBarButton" onclick="setProxCategory('+JSON.stringify(x.name)+')" title="Filtrar por '+esc(x.name)+'"><span class="proxBarName">'+esc(x.name)+'</span><span class="proxBarTrack"><span class="proxBarFill" style="display:block;width:'+Math.max(3,x.units/max*100).toFixed(1)+'%"></span></span><span class="proxBarValue">'+fInt(x.units)+' u · '+fInt(x.products)+' prod.</span></button>';}).join('')+'</div>';
  }
  window.viewProx=function(st){
    var rows=upcomingRotationRows(st),s=proxStats(rows,st);
    return '<div class="card"><div class="chead"><div class="cnum n1">◷</div><div><div class="tt">Próximos a rotar</div><div class="ds">Productos con unidades entre 60 y 90 días que requieren gestión preventiva</div></div><div class="rt"><span class="badge warm">'+fInt(rows.length)+' productos</span></div></div><div class="cbody">'+
      '<div class="mkpis"><div class="mk r"><div class="l">Productos próximos</div><div class="v">'+fInt(s.products)+'</div><div class="meta">Referencias con unidades entre 60 y 90 días</div></div><div class="mk r"><div class="l">Unidades 60–90 días</div><div class="v">'+fInt(s.units)+'</div><div class="meta">'+s.share.toFixed(1)+'% de las unidades de la tienda</div></div><div class="mk r"><div class="l">Valor estimado</div><div class="v textKpi">'+fMoneyCOP(s.value)+'</div><div class="meta">Valor proporcional del inventario en este rango</div></div><div class="mk b"><div class="l">Sin venta 3 meses</div><div class="v">'+fInt(s.noSales)+'</div><div class="meta">Productos que requieren atención prioritaria</div></div></div>'+
      '<div class="proxGrid"><div class="proxChartCard"><div class="proxChartTitle">Unidades próximas a rotar por categoría</div><div class="proxChartSub">Presiona una categoría para filtrar la tabla.</div><div id="prox-chart">'+proxChart(rows)+'</div></div><div class="proxInsight"><div class="proxChartTitle">Lectura preventiva</div><div class="proxChartSub">La gestión debe realizarse antes de que el inventario supere los 90 días.</div><div class="proxInsightGrid"><div class="proxInsightItem"><label>Mayor categoría</label><b id="prox-top-cat">—</b></div><div class="proxInsightItem"><label>Sin respaldo CENDIS</label><b>'+fInt(rows.filter(function(r){return r.cendis<=0;}).length)+'</b></div><div class="proxInsightItem"><label>Más del 50% del stock</label><b>'+fInt(rows.filter(function(r){return r.share>=50;}).length)+'</b></div><div class="proxInsightItem"><label>Con ventas recientes</label><b>'+fInt(rows.filter(function(r){return r.salesUnits>0;}).length)+'</b></div></div></div></div>'+
      '<div class="tbar"><div class="tsearch">🔎<input id="q-prox" placeholder="Buscar producto, código, categoría, línea o sublínea…" oninput="state.prox.q=this.value;state.prox.limit=300;drawProx()"></div></div>'+
      '<div class="proxFilterBar"><span class="proxFilterLabel">Filtrar:</span><span class="chip filt" data-prox-filter="all" onclick="setProxFilter(\'all\')">Todos</span><span class="chip filt" data-prox-filter="high" onclick="setProxFilter(\'high\')">≥50% del stock</span><span class="chip filt" data-prox-filter="nosales" onclick="setProxFilter(\'nosales\')">Sin venta 3m</span><span class="chip filt" data-prox-filter="sr" onclick="setProxFilter(\'sr\')">Sin respaldo CENDIS</span><button class="invClearBtn" onclick="setProxCategory(\'all\')">Limpiar categoría</button><span class="proxCategoryActive" id="prox-cat-active"></span></div><div id="prox-tbl"></div><div class="foot"><span id="prox-count"></span><span>Presiona cualquier producto para abrir su informe detallado.</span></div></div></div>';
  };
  window.setProxFilter=function(v){state.prox.f=v;state.prox.limit=300;drawProx();};
  window.setProxCategory=function(v){state.prox.cat=v;state.prox.limit=300;drawProx();};
  window.loadMoreProx=function(){state.prox.limit+=300;drawProx();};
  window.sortProx=function(k){if(state.prox.sort===k)state.prox.dir*=-1;else{state.prox.sort=k;state.prox.dir=k==='product'||k==='category'?1:-1;}drawProx();};
  window.drawProx=function(){
    var st=S[CUR]||{},all=upcomingRotationRows(st),rows=all.slice(),q=String(state.prox.q||'').toLowerCase();
    if(state.prox.f==='high')rows=rows.filter(function(r){return r.share>=50;});
    if(state.prox.f==='nosales')rows=rows.filter(function(r){return r.salesUnits<=0;});
    if(state.prox.f==='sr')rows=rows.filter(function(r){return r.cendis<=0;});
    if(state.prox.cat&&state.prox.cat!=='all')rows=rows.filter(function(r){return r.p.cat===state.prox.cat;});
    if(q)rows=rows.filter(function(r){return (r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub).toLowerCase().includes(q);});
    var key=state.prox.sort,dir=state.prox.dir;
    rows.sort(function(a,b){var av=key==='product'?a.p.n:key==='category'?a.p.cat:key==='stock'?a.stock:key==='share'?a.share:key==='value'?a.value:key==='sales'?a.salesUnits:key==='cendis'?a.cendis:a.units,bv=key==='product'?b.p.n:key==='category'?b.p.cat:key==='stock'?b.stock:key==='share'?b.share:key==='value'?b.value:key==='sales'?b.salesUnits:key==='cendis'?b.cendis:b.units;if(typeof av==='string')return av.localeCompare(bv)*dir;return (toNum(av)-toNum(bv))*dir;});
    var visible=rows.slice(0,state.prox.limit),body=visible.map(function(r){var cls=r.share>=50?'proxRiskHigh':r.share>=25?'proxRiskMid':'proxRiskLow';return '<tr tabindex="0" role="button" onclick="openInventoryProduct('+JSON.stringify(r.c)+')" onkeydown="if(event.key===\'Enter\'){openInventoryProduct('+JSON.stringify(r.c)+')}\"><td>'+imageThumb(r.c,'sm')+'</td><td><span class="code">'+esc(r.c)+'</span></td><td><div class="proxProductName">'+esc(r.p.n)+'</div><div class="proxProductMeta">'+fInt(r.salesUnits)+' uds vendidas en 3 meses</div></td><td><b>'+esc(r.p.cat)+'</b><div class="proxProductMeta">'+esc(r.p.lin)+' · '+esc(r.p.sub)+'</div></td><td class="num"><span class="proxAgeBadge">'+fInt(r.units)+' u</span></td><td class="num"><b>'+fInt(r.stock)+'</b></td><td class="num"><span class="'+cls+'">'+r.share.toFixed(1)+'%</span></td><td class="num"><b>'+fMoneyCOP(r.value)+'</b></td><td class="num">'+(r.cendis>0?'<span class="tag cr">'+fInt(r.cendis)+' u</span>':'<span class="tag sr">0 u</span>')+'</td></tr>';}).join('');
    var table='<div class="twrap"><table><thead><tr><th>Imagen</th><th onclick="sortProx(\'code\')">Código</th><th onclick="sortProx(\'product\')">Producto</th><th onclick="sortProx(\'category\')">Clasificación</th><th class="num" onclick="sortProx(\'units\')">Uds. 60–90</th><th class="num" onclick="sortProx(\'stock\')">Stock total</th><th class="num" onclick="sortProx(\'share\')">% del stock</th><th class="num" onclick="sortProx(\'value\')">Valor estimado</th><th class="num" onclick="sortProx(\'cendis\')">CENDIS</th></tr></thead><tbody>'+(body||'<tr><td colspan="9"><div class="empty">No hay productos que cumplan los filtros.</div></td></tr>')+'</tbody></table></div>'+(rows.length>visible.length?'<div class="proxLoadMore"><button class="actionBtn" onclick="loadMoreProx()">Mostrar 300 más</button></div>':'');
    var el=document.getElementById('prox-tbl');if(el){el.innerHTML=table;el.querySelectorAll('.proxRow').forEach(function(tr){var open=function(e){if(e){e.preventDefault();}openInventoryProduct(tr.dataset.code);};tr.onclick=open;tr.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(e);}};});}
    var cnt=document.getElementById('prox-count');if(cnt)cnt.textContent='Mostrando '+fInt(visible.length)+' de '+fInt(rows.length)+' productos · '+fInt(rows.reduce(function(a,r){return a+r.units;},0))+' unidades en 60–90 días';
    document.querySelectorAll('[data-prox-filter]').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-prox-filter')===state.prox.f);});
    var cat=document.getElementById('prox-cat-active');if(cat)cat.textContent=state.prox.cat&&state.prox.cat!=='all'?'Categoría: '+state.prox.cat:'Todas las categorías';
    var top=categoryData(all)[0],topEl=document.getElementById('prox-top-cat');if(topEl)topEl.textContent=top?top.name+' · '+fInt(top.units)+' u':'—';
    var chart=document.getElementById('prox-chart');if(chart)chart.innerHTML=proxChart(all);
  };

  /* En el corte base, todos los productos se muestran como línea base, no como una tabla vacía. */
  var originalStatusLabel=window.statusLabel;
  function relabelBaselinePanel(){
    var current=safeText(DB&&DB.meta&&DB.meta.fecha,'');
    document.querySelectorAll('.trackingPanel').forEach(function(panel){
      var ref=panel.querySelector('.trackingReference');
      if(!ref||!ref.textContent.includes('línea base'))return;
      panel.querySelectorAll('.trackingResult.persistent').forEach(function(x){x.classList.remove('persistent');x.classList.add('baseline');x.textContent='Línea base';});
      panel.querySelectorAll('.trackStatusBtn').forEach(function(btn){if(btn.textContent.includes('Persistente'))btn.querySelector('span:nth-child(2)').textContent='Línea base';});
    });
  }
  var oldSetView=window.setView;
  if(typeof oldSetView==='function')window.setView=function(v){var r=oldSetView(v);setTimeout(function(){relabelBaselinePanel();if(v==='prox'&&typeof drawProx==='function')drawProx();},0);return r;};
  var oldRenderStore=window.renderStoreTracking;if(typeof oldRenderStore==='function')window.renderStoreTracking=function(){var r=oldRenderStore();setTimeout(relabelBaselinePanel,0);return r;};
  var oldRenderLeader=window.renderLeaderTracking;if(typeof oldRenderLeader==='function')window.renderLeaderTracking=function(){var r=oldRenderLeader();setTimeout(relabelBaselinePanel,0);return r;};
  setTimeout(relabelBaselinePanel,400);
})();


/* ===== llavero-v40-ambientes-script ===== */
(function(){
  if(!state.guias)state.guias={sort:'comp',dir:1,q:'',f:'all',exp:{}};
  const GUIDE_STATUS={ok:['Con existencia','gs-ok'],camino:['En camino','gs-camino'],cendis:['En pedido CENDIS','gs-cendis'],sin:['Sin pedido CENDIS','gs-sin'],nd:['Sin dato en Presencia','gs-nd']};
  const guideCode=v=>{let s=String(v??'').trim();if(/^J\d+$/.test(s))s=s.slice(1);if(/^\d+\.0$/.test(s))s=s.slice(0,-2);return s;};
  const guideMapCode=sc=>String(DB.meta?.mapeoBodegasInventario?.[sc]||sc);
  function pendingGuideTransfers(st){const out=new Set();(st?.tr||[]).forEach(r=>{if(toNum(r?.[2])>0&&(String(r?.[6]||'').toUpperCase()==='A'||String(r?.[7]||'').toUpperCase()==='A'))out.add(guideCode(r?.[0]));});return out;}
  function buildGuideStore(sc){
    const st=S[sc];if(!st)return;const bod=guideMapCode(sc),pres=DB.GP?.[bod]||{},pending=pendingGuideTransfers(st);
    const agg={nG:0,gCompletas:0,gConAvance:0,compTotalPct:0,faltTot:0,faltCendis:0,faltSin:0,faltCamino:0,noRastr:0,tracked:0,present:0};
    st.guias=(DB.G||[]).map(g=>{let tot=0,have=0,nr=0,pp=[0,0,0,0,0,0],floor1=false;const prods=(g[3]||[]).map(pd=>{
      const c=guideCode(pd[0]),piso=String(pd[1]||'?'),rec=pres[c],pi=/^[123]$/.test(piso)?Number(piso)-1:null;let cs=0,cm=-1,status='nd',hasOrder=0;
      if(!rec){nr++;agg.noRastr++;}
      else{cs=toNum(rec[0]);cm=toNum(rec[1]);hasOrder=cm>0?1:0;tot++;agg.tracked++;if(pi!==null)pp[pi*2+1]++;
        if(cs>0){status='ok';have++;agg.present++;if(pi!==null)pp[pi*2]++;if(piso==='1')floor1=true;}
        else if(pending.has(c)){status='camino';agg.faltCamino++;}
        else if(cm>0){status='cendis';agg.faltCendis++;}
        else{status='sin';agg.faltSin++;}
      }
      return [c,piso,cs,cm,hasOrder,status,pd[2]||P[c]?.n||''];
    });
    const missing=Math.max(0,tot-have);agg.faltTot+=missing;if(tot&&have===tot)agg.gCompletas++;if(floor1)agg.gConAvance++;
    return [g[0],g[1],g[2],tot,have,pp,prods,nr,floor1?1:0];
    });
    agg.nG=st.guias.length;agg.compTotalPct=agg.tracked?Math.round(1000*agg.present/agg.tracked)/10:0;st.amb=agg;st.kpi=st.kpi||{};st.kpi.guiaComp=agg.compTotalPct;st.kpi.guiaFalt=agg.faltTot;st.kpi.guiaCompletas=agg.gCompletas;
  }
  window.llaveroRebuildAllGuideData=function(){Object.keys(S).forEach(buildGuideStore);};
  window.llaveroRebuildAllGuideData();
  function statusTag(s){const x=GUIDE_STATUS[s]||GUIDE_STATUS.sin;return `<span class="guideStatus ${x[1]}">${x[0]}</span>`;}
  function pisoAgg(st){const a=[0,0,0,0,0,0];(st.guias||[]).forEach(g=>{for(let i=0;i<6;i++)a[i]+=toNum(g[5]?.[i]);});return a;}
  window.guiaKpi=function(f){const s=state.guias;s.f=s.f===f?'all':f;drawGuias();};
  window.toggleGuia=function(c){state.guias.exp[c]=!state.guias.exp[c];drawGuias();};
  window.openGuideProduct=function(c){c=guideCode(c);const exists=normalizeInventoryRows(S[CUR]||{}).some(r=>r.c===c);if(exists){if(typeof openBestProductDetail==='function')openBestProductDetail(c);else openInventoryProduct(c);}else toast('El producto no tiene inventario actual en esta tienda','err');};
  window.viewAmb=function(st){
    if(!st.guias)buildGuideStore(CUR);const k=st.kpi||{},a=st.amb||{},pa=pisoAgg(st),pPct=i=>pa[i*2+1]?Math.round(100*pa[i*2]/pa[i*2+1]):0;
    setTimeout(()=>{if(VIEW==='amb')drawGuias();},0);
    return `<div class="card"><div class="chead"><div class="cnum n3">▦</div><div><div class="tt">Guías de exhibición</div><div class="ds">Cumplimiento de ${fInt(a.nG)} guías por tienda, producto y piso</div></div><div class="rt"><span class="badge cool">${toNum(a.compTotalPct).toLocaleString('es-CO',{maximumFractionDigits:1})}% completitud</span></div></div><div class="cbody">
      <div class="mkpis"><div class="mk a guideKpi" data-f="all" onclick="guiaKpi('all')"><div class="l">Completitud total</div><div class="v">${toNum(a.compTotalPct).toLocaleString('es-CO',{maximumFractionDigits:1})}%</div></div><div class="mk g guideKpi" data-f="completas" onclick="guiaKpi('completas')"><div class="l">Guías completas</div><div class="v">${fInt(a.gCompletas)} <small>/ ${fInt(a.nG)}</small></div></div><div class="mk a guideKpi" data-f="avance" onclick="guiaKpi('avance')"><div class="l">Con avance en piso 1</div><div class="v">${fInt(a.gConAvance)}</div></div><div class="mk b guideKpi" data-f="incompletas" onclick="guiaKpi('incompletas')"><div class="l">Productos faltantes</div><div class="v">${fInt(a.faltTot)}</div></div><div class="mk g guideKpi" data-f="cendis" onclick="guiaKpi('cendis')"><div class="l">En pedido CENDIS</div><div class="v">${fInt(a.faltCendis)}</div></div><div class="mk b guideKpi" data-f="sincendis" onclick="guiaKpi('sincendis')"><div class="l">Sin pedido CENDIS</div><div class="v">${fInt(a.faltSin)}</div></div></div>
      <div><div class="legend" style="margin-bottom:7px"><b>Completitud por piso</b></div><div class="guideFloorGrid">${[0,1,2].map(i=>{const t=pa[i*2+1],h=pa[i*2],pc=pPct(i);return `<div class="guideFloorCard"><div class="guideFloorTop"><span>PISO ${i+1}</span><span>${t?pc+'%':'Sin dato'}</span></div><div class="guideTrack"><div class="guideFill" style="width:${pc}%"></div></div><div class="guideFloorMeta">${t?fInt(h)+' de '+fInt(t)+' productos con existencia':'Productos no rastreados en la fuente'}</div></div>`;}).join('')}</div></div>
      <div class="ambInfoNote"><b>Regla:</b> la tienda tiene el producto cuando <b>CAN SUM &gt; 0</b>. Si falta y <b>CAN MIN &gt; 0</b>, aparece como <b>En pedido CENDIS</b>. Si existe un traslado pendiente, se muestra como <b>En camino</b>. Los productos que no aparecen en Presencia Seus quedan como <b>Sin dato</b> y no afectan el porcentaje.</div>
      <div class="tbar"><div class="tsearch">🔎<input id="q-guias" placeholder="Buscar guía, producto o código…" oninput="state.guias.q=this.value;drawGuias()"></div><span class="chip filt" data-q="guias" data-f="all">Todas</span><span class="chip filt" data-q="guias" data-f="DORMITORIO">Dormitorio</span><span class="chip filt" data-q="guias" data-f="SOCIAL">Social</span><span class="chip filt" data-q="guias" data-f="incompletas">Incompletas</span><span class="chip filt" data-q="guias" data-f="cendis">En pedido CENDIS</span><span class="chip filt" data-q="guias" data-f="sincendis">Sin pedido</span></div><div id="guias-tbl"></div><div class="foot"><span id="guias-cnt"></span><span>Presiona una guía para consultar el detalle por piso.</span></div>
    </div></div>
    <div class="card"><div class="chead"><div class="cnum n3">⇄</div><div><div class="tt">Traslados en camino</div><div class="ds">Movimientos pendientes que pueden completar las guías</div></div><div class="rt"><span class="badge cool">${fInt(k.trN)} líneas</span></div></div><div class="cbody"><div class="mkpis"><div class="mk a"><div class="l">Líneas / entregas</div><div class="v">${fInt(k.trN)}</div></div><div class="mk a"><div class="l">Unidades</div><div class="v">${fInt(k.trU)}</div></div><div class="mk a"><div class="l">Volumen m³</div><div class="v">${fInt(k.trVol)}</div></div><div class="mk r"><div class="l">Pend. picking</div><div class="v">${fInt(k.trPick)}</div></div><div class="mk r"><div class="l">Pend. movimiento</div><div class="v">${fInt(k.trMov)}</div></div><div class="mk b"><div class="l">Fecha a revisar</div><div class="v">${fInt(k.trRev)}</div></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-tr" placeholder="Buscar material o código…" oninput="state.tr.q=this.value;drawTr()"></div><span class="chip filt" data-q="tr" data-f="all">Todos</span><span class="chip filt" data-q="tr" data-f="pick">Pend. picking</span><span class="chip filt" data-q="tr" data-f="mov">Pend. movimiento</span><span class="chip filt" data-q="tr" data-f="rev">Fecha a revisar</span></div><div id="tr-tbl"></div><div class="foot"><span id="tr-cnt"></span><span>A = pendiente · C = completado</span></div></div></div>`;
  };
  window.drawGuias=function(){
    const st=S[CUR]||{},s=state.guias;if(!st.guias)buildGuideStore(CUR);let rows=(st.guias||[]).map(g=>({code:g[0],name:g[1],cat:g[2],tot:g[3],pres:g[4],pp:g[5],prods:g[6],nr:g[7],avance:g[8],comp:g[3]?Math.round(1000*g[4]/g[3])/10:0,nCendis:g[6].filter(p=>p[5]==='cendis').length,nSin:g[6].filter(p=>p[5]==='sin').length,nCamino:g[6].filter(p=>p[5]==='camino').length}));
    if(s.f==='DORMITORIO'||s.f==='SOCIAL')rows=rows.filter(r=>r.cat===s.f);else if(s.f==='incompletas')rows=rows.filter(r=>r.comp<100);else if(s.f==='completas')rows=rows.filter(r=>r.comp>=100);else if(s.f==='avance')rows=rows.filter(r=>r.avance===1);else if(s.f==='cendis')rows=rows.filter(r=>r.nCendis>0);else if(s.f==='sincendis')rows=rows.filter(r=>r.nSin>0);
    if(s.q){const q=String(s.q).toLowerCase();rows=rows.filter(r=>(r.name+' '+r.code+' '+r.cat).toLowerCase().includes(q)||r.prods.some(p=>(p[0]+' '+p[6]).toLowerCase().includes(q)));}
    if(s.sort==='comp')rows.sort((a,b)=>(a.comp-b.comp)*s.dir||((b.tot-b.pres)-(a.tot-a.pres)));else rows.sort(cmp(s,{name:r=>r.name,cat:r=>r.cat,comp:r=>r.comp,falt:r=>r.tot-r.pres,cendis:r=>r.nCendis}));
    document.querySelectorAll('.guideKpi').forEach(x=>x.classList.toggle('on',x.dataset.f===s.f));
    const floorPct=(r,i)=>r.pp[i*2+1]?Math.round(100*r.pp[i*2]/r.pp[i*2+1]):null;
    let body='';rows.forEach(r=>{const color=r.comp>=100?'var(--ok)':r.comp>=50?'var(--amb)':'var(--rot)';body+=`<tr class="guideMainRow" onclick="toggleGuia(${JSON.stringify(r.code)})"><td><div style="display:flex;gap:8px;align-items:center"><span class="guideArrow">${s.exp[r.code]?'▾':'▸'}</span><div><div class="guideName">${esc(r.name)}</div><div class="guideCode">${esc(r.code)}</div></div></div></td><td><span class="tag ${r.cat==='DORMITORIO'?'cr':'a'}">${esc(r.cat)}</span></td><td class="num"><div class="guideComp"><div class="guideCompTrack"><div class="guideCompFill" style="width:${r.comp}%;background:${color}"></div></div><b>${r.comp.toLocaleString('es-CO',{maximumFractionDigits:1})}%</b></div></td>${[0,1,2].map(i=>{const p=floorPct(r,i);return `<td class="num"><b style="color:${p===100?'var(--ok)':p===null?'var(--mut2)':'var(--ink2)'}">${p===null?'—':p+'%'}</b></td>`;}).join('')}<td class="num"><b style="color:${r.tot-r.pres?'var(--bad)':'var(--ok)'}">${fInt(r.tot-r.pres)}</b></td><td class="num"><b style="color:var(--amb)">${fInt(r.nCendis)}</b></td></tr>`;
      if(s.exp[r.code]){const groups={};r.prods.forEach(p=>(groups[p[1]]=groups[p[1]]||[]).push(p));const order={ok:0,camino:1,cendis:2,sin:3,nd:4};let sections='';Object.keys(groups).sort().forEach(pi=>{const arr=groups[pi].slice().sort((a,b)=>order[a[5]]-order[b[5]]);const ex=arr.filter(p=>p[5]==='ok').length;sections+=`<div class="guideFloorSection"><div class="guideFloorHead"><span>PISO ${pi==='?'?'—':esc(pi)}</span><span>${arr.length} productos · ${ex} con existencia · ${arr.length-ex} pendientes</span></div><div class="guideDetailWrap"><table class="guideDetailTable"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th class="num">CAN SUM</th><th class="num">CAN MIN</th><th>Estado</th></tr></thead><tbody>${arr.map(p=>`<tr class="guideProductRow" onclick="event.stopPropagation();openGuideProduct(${JSON.stringify(p[0])})"><td>${typeof imageThumb==='function'?imageThumb(p[0],'sm'):''}</td><td><span class="code">${esc(p[0])}</span></td><td><div class="guideProductName">${esc(p[6]||P[p[0]]?.n||'—')}</div><div class="pageInteractiveHint">${esc(P[p[0]]?.cat||'')} ${P[p[0]]?.lin?'· '+esc(P[p[0]].lin):''}</div></td><td class="num"><b style="color:${p[2]>0?'var(--ok)':'var(--bad)'}">${fInt(p[2])}</b></td><td class="num">${p[3]<0?'—':fInt(p[3])}</td><td>${statusTag(p[5])}</td></tr>`).join('')}</tbody></table></div></div>`;});
        const pill=(t,n,cls)=>`<span class="guidePill ${cls}">${t}: ${fInt(n)}</span>`;body+=`<tr class="guideExpand"><td colspan="8"><div class="guidePills">${pill('Con existencia',r.pres,'gs-ok')}${pill('Faltantes',r.tot-r.pres,'gs-sin')}${pill('En pedido CENDIS',r.nCendis,'gs-cendis')}${pill('En camino',r.nCamino,'gs-camino')}${pill('Sin pedido',r.nSin,'gs-sin')}</div>${sections}${r.nr?`<div class="guideSourceNote">${fInt(r.nr)} productos de la guía no aparecen en Presencia Seus y no se incluyen en el porcentaje.</div>`:''}</td></tr>`;}
    });
    const html=`<div class="twrap"><table class="guideTable"><colgroup><col><col><col><col><col><col><col><col></colgroup><thead><tr><th data-sort="name">Guía</th><th data-sort="cat">Categoría</th><th class="num" data-sort="comp">Completitud</th><th class="num">P1</th><th class="num">P2</th><th class="num">P3</th><th class="num" data-sort="falt">Faltan</th><th class="num" data-sort="cendis">Pedido CENDIS</th></tr></thead><tbody>${body||'<tr><td colspan="8"><div class="empty">Sin guías para este filtro</div></td></tr>'}</tbody></table></div>`;
    const el=document.getElementById('guias-tbl');if(el)el.innerHTML=html;const cnt=document.getElementById('guias-cnt');if(cnt)cnt.textContent=`Mostrando ${rows.length} de ${(st.guias||[]).length} guías`;
    document.querySelectorAll('#guias-tbl th[data-sort]').forEach(th=>th.onclick=e=>{e.stopPropagation();const k=th.dataset.sort;if(s.sort===k)s.dir*=-1;else{s.sort=k;s.dir=1;}drawGuias();});document.querySelectorAll('.chip.filt[data-q="guias"]').forEach(ch=>{ch.classList.toggle('on',s.f===ch.dataset.f);ch.onclick=()=>{s.f=ch.dataset.f;drawGuias();};});
  };
  function wbRows(ws){return XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});}
  function parseGuideWorkbook(wb){const ex=new Set(['PRUEBAHAIGU9MAYO','18ABRPRUEBAHAINER']);const summary={};const rs=wb.Sheets['Resumen']?wbRows(wb.Sheets['Resumen']):[];rs.slice(1).forEach(r=>{const c=guideCode(r[0]);if(c)summary[c]=String(r[1]||'').trim();});const oldCat=Object.fromEntries((DB.G||[]).map(g=>[g[0],g[2]]));const out=[];wb.SheetNames.forEach(n=>{if(n==='Resumen'||ex.has(n))return;const rows=wbRows(wb.Sheets[n]);let floor='?',seen=new Set(),prods=[];rows.slice(1).forEach(r=>{const a=String(r[0]||'').trim(),fm=a.match(/^PISO\s*(\d+)/i);if(fm){floor=fm[1];return;}const c=guideCode(r[0]),pn=String(r[1]||'').trim();if(!c||!pn||/^C[ÓO]DIGO$/i.test(a))return;const k=floor+'|'+c;if(seen.has(k))return;seen.add(k);prods.push([c,floor,pn]);});const gc=guideCode(n),cat=oldCat[gc]||(gc.startsWith('DOR')?'DORMITORIO':'SOCIAL');out.push([gc,summary[gc]||gc,cat,prods]);});return out;}
  function parsePresenceWorkbook(wb){const rows=wbRows(wb.Sheets[wb.SheetNames[0]]);const h=rows[0].map(normalizeHeader),ix=n=>h.indexOf(normalizeHeader(n)),ib=ix('BOD'),ic=ix('COD'),is=ix('CAN SUM'),im=ix('CAN MIN SUM');if([ib,ic,is,im].some(x=>x<0))throw new Error('No se encontraron BOD, COD, CAN SUM y CAN MIN SUM.');const out={};rows.slice(1).forEach(r=>{const b=guideCode(r[ib]),c=guideCode(r[ic]);if(!b||!c)return;(out[b]=out[b]||{})[c]=[toNum(r[is]),toNum(r[im])];});return out;}
  const originalLoad=window.loadFile;
  window.loadFile=function(input){if(!requireLeader()){if(input)input.value='';return;}const file=input?.files?.[0];if(!file)return;const ext=file.name.split('.').pop().toLowerCase();if(!['xlsx','xls','xlsm','xlsb'].includes(ext)){return originalLoad(input);}const status=document.getElementById('xlsxStatus');if(status){status.textContent='⏳ Analizando '+file.name;status.style.display='inline-block';}const reader=new FileReader();reader.onerror=()=>showStatus('❌ Error al leer el archivo',true);reader.onload=e=>{try{const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array',cellDates:false});const first=wbRows(wb.Sheets[wb.SheetNames[0]])[0]||[],headers=first.map(normalizeHeader);if(wb.SheetNames.includes('Resumen')&&wb.SheetNames.length>20){DB.G=parseGuideWorkbook(wb);DB.meta.fuentes=DB.meta.fuentes||{};DB.meta.fuentes.guiasExhibicion=file.name;llaveroRebuildAllGuideData();refresh();saveDBSnapshot(DB);showStatus(`✅ ${DB.G.length} guías de exhibición actualizadas`,false);input.value='';return;}if(headers.includes(normalizeHeader('CAN SUM'))&&headers.includes(normalizeHeader('CAN MIN SUM'))){DB.GP=parsePresenceWorkbook(wb);DB.meta.fuentes=DB.meta.fuentes||{};DB.meta.fuentes.presenciaGuias=file.name;llaveroRebuildAllGuideData();refresh();saveDBSnapshot(DB);showStatus(`✅ Presencia de ${Object.keys(DB.GP).length} bodegas actualizada`,false);input.value='';return;}originalLoad(input);}catch(err){showStatus('❌ '+err.message,true);input.value='';}};reader.readAsArrayBuffer(file);};
  const oldApply=window.applyNewDB;
  window.applyNewDB=function(newDB,opts){if(newDB?.G)DB.G=newDB.G;if(newDB?.GP)DB.GP=newDB.GP;oldApply(newDB,opts);llaveroRebuildAllGuideData();if(VIEW==='amb')refresh();};
})();


/* ===== llavero-json-only-loader ===== */
/* Carga oficial: un único JSON consolidado con meta, P, S, G y GP. */
(function(){
  function jsonDateName(raw){
    var p=String(raw||'').match(/(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})/);
    return p?(p[3]+'_'+p[2]+'_'+p[1]):String(raw||'corte').replace(/[^0-9A-Za-z_-]/g,'_');
  }
  function validateConsolidatedJSON(data){
    if(!data||typeof data!=='object')throw new Error('El archivo no contiene un objeto JSON válido.');
    ['meta','P','S','G','GP'].forEach(function(k){
      if(data[k]===undefined||data[k]===null)throw new Error('Falta la sección obligatoria "'+k+'".');
    });
    if(typeof data.S!=='object'||Array.isArray(data.S)||!Object.keys(data.S).length)throw new Error('La sección S no contiene tiendas.');
    if(!Array.isArray(data.G))throw new Error('La sección G debe contener las guías de exhibición.');
    if(typeof data.GP!=='object'||Array.isArray(data.GP))throw new Error('La sección GP debe contener la presencia CAN SUM y CAN MIN por tienda.');
    data.meta=data.meta||{};
    data.meta.tipoArchivo='LLAVERO_JSON_CONSOLIDADO';
    data.meta.versionEsquema=data.meta.versionEsquema||'1.0';
    data.meta.cargaUnica=true;
    return data;
  }
  window.applyNewDB=function(newDB,opts){
    opts=opts||{};
    try{newDB=validateConsolidatedJSON(newDB);newDB=normalizeDB(newDB);}catch(err){showStatus('❌ '+err.message,true);return;}
    DB.meta=newDB.meta||DB.meta;
    LBL=DB.meta.lbl90||LBL;
    Object.keys(P).forEach(function(k){delete P[k];});Object.assign(P,newDB.P||{});
    Object.keys(S).forEach(function(k){delete S[k];});Object.assign(S,newDB.S||{});
    DB.G=Array.isArray(newDB.G)?newDB.G:[];
    DB.GP=(newDB.GP&&typeof newDB.GP==='object')?newDB.GP:{};
    if(typeof clearLlaveroCaches==='function')clearLlaveroCaches();
    sanitizeCurrentDB();
    if(typeof llaveroRebuildAllGuideData==='function')llaveroRebuildAllGuideData();
    recordOperationalSnapshot();
    populateStoreSelect(IS_ADMIN?AUTH.store:CUR);
    VIEW=IS_LEADER?'dashboard':'resumen';setActiveNav(VIEW);refresh();
    if(!opts.skipPersist)saveDBSnapshot({meta:DB.meta,P:P,S:S,G:DB.G,GP:DB.GP});
    if(!opts.silent)showStatus('✅ JSON consolidado '+safeText(DB.meta.fecha)+' cargado · '+Object.keys(S).length+' tiendas · '+DB.G.length+' guías',false);
  };
  window.loadFile=function(input){
    if(!requireLeader()){if(input)input.value='';return;}
    var file=input&&input.files&&input.files[0];if(!file)return;
    input.value='';
    var status=document.getElementById('xlsxStatus');if(status){status.textContent='⏳ Validando JSON…';status.style.display='inline-block';}
    if(!/\.json$/i.test(file.name)){showStatus('❌ La carga diaria acepta únicamente la plantilla JSON consolidada.',true);return;}
    var reader=new FileReader();
    reader.onerror=function(){showStatus('❌ No fue posible leer el JSON.',true);};
    reader.onload=function(e){
      try{applyNewDB(validateConsolidatedJSON(JSON.parse(e.target.result)));}
      catch(err){showStatus('❌ JSON no compatible: '+err.message,true);}
    };
    reader.readAsText(file,'UTF-8');
  };
  window.downloadTemplate=function(){
    if(!requireLeader())return;
    var exportDB=JSON.parse(JSON.stringify(DB));
    exportDB.meta=exportDB.meta||{};
    exportDB.meta.tipoArchivo='LLAVERO_JSON_CONSOLIDADO';
    exportDB.meta.versionEsquema=exportDB.meta.versionEsquema||'1.0';
    exportDB.meta.cargaUnica=true;
    exportDB.meta.estructuraRaiz=['meta','P','S','G','GP'];
    exportDB.meta.exportadoEn=new Date().toISOString();
    var blob=new Blob([JSON.stringify(exportDB)],{type:'application/json;charset=utf-8'});
    var a=document.createElement('a'),url=URL.createObjectURL(blob);
    a.href=url;a.download='Plantilla_JSON_Llavero_'+jsonDateName(exportDB.meta.fecha)+'.json';
    document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1500);
    toast('Plantilla JSON consolidada descargada','ok');
  };
  document.addEventListener('DOMContentLoaded',function(){
    var inp=document.getElementById('xlsxInput');if(inp)inp.setAttribute('accept','.json,application/json');
    var label=inp&&inp.closest('label');if(label){label.title='Cargar la plantilla JSON consolidada';var node=Array.from(label.childNodes).find(function(n){return n.nodeType===3&&/Cargar/.test(n.textContent||'');});if(node)node.textContent=' Cargar JSON ';}
  });
})();


/* ===== llavero-v41-dual-ambientes-script ===== */
(function(){
  'use strict';

  DB.meta=DB.meta||{};
  DB.meta.cargaUnica=false;
  DB.meta.modalidadesCarga=['JSON consolidado','Excel individual por fuente'];
  DB.meta.cargaRecomendada='JSON consolidado';
  DB.meta.archivosExcelIndividuales=[
    'Detalle','Inventario Art','Herramienta SAP','INFO VENTA BASE',
    'Traslados pendientes','Guias de exhibicion','Presencia Seus'
  ];

  function setLoadStatus(text,isError){
    if(typeof showStatus==='function')showStatus(text,!!isError);
    else {
      var el=document.getElementById('xlsxStatus');
      if(el){el.textContent=text;el.style.display='inline-block';}
    }
  }
  function code(v){
    var s=String(v==null?'':v).trim();
    if(/^J\d+$/i.test(s))s=s.slice(1);
    if(/^\d+\.0$/.test(s))s=s.slice(0,-2);
    return s;
  }
  function norm(v){
    return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
  }
  function findHeader(rows,required,maxScan){
    var limit=Math.min(rows.length,maxScan||12);
    for(var i=0;i<limit;i++){
      var h=(rows[i]||[]).map(normalizeHeader);
      if(required.every(function(k){return h.indexOf(normalizeHeader(k))>=0;}))return {row:i,headers:h};
    }
    return null;
  }
  function idx(headers){
    var names=[].slice.call(arguments,1).map(normalizeHeader);
    for(var i=0;i<names.length;i++){var p=headers.indexOf(names[i]);if(p>=0)return p;}
    return -1;
  }
  function val(row,i){return i>=0&&row&&row[i]!==undefined?row[i]:'';}
  function aoa(ws){return XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true,blankrows:false});}
  function headAoa(ws,n){var rg=XLSX.utils.decode_range(ws['!ref']||'A1:A1');rg.e.r=Math.min(rg.e.r,Math.max(0,(n||10)-1));return XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true,blankrows:false,range:rg});}
  function dateText(v){
    if(v===undefined||v===null||v==='')return '';
    if(v instanceof Date&&!isNaN(v))return v.toISOString().slice(0,10);
    if(typeof v==='number'&&XLSX.SSF&&XLSX.SSF.parse_date_code){
      var d=XLSX.SSF.parse_date_code(v);
      if(d)return String(d.y).padStart(4,'0')+'-'+String(d.m).padStart(2,'0')+'-'+String(d.d).padStart(2,'0');
    }
    var s=String(v).trim(),m=s.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if(m)return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
    return s;
  }

  var STORE_ALIAS={
    'PRINCIPAL':'01','NORTE':'95','MAYORCA':'B8','BUCARAMANGA':'18','HIPER JAMAR':'24',
    'CRA 30':'H4','CARRERA 30':'H4','EL EDEN':'H1','EDEN':'H1','FABRICATO':'F8',
    'NORTE BOGOTA':'F7','PLAZUELA':'84','LAS AMERICAS':'B9','AMERICAS':'B9',
    'MOLINOS':'C6','MONTERIA':'55','RIOHACHA':'39','SAN FELIPE':'67','SANTA MARTA':'85',
    'SINCELEJO':'65','TRINITARIAS':'29','VALLEDUPAR':'45','FLORIDA':'F6','CUATRO VIENTOS':'CV'
  };
  function storeCode(raw){
    var direct=code(raw);if(S[direct])return direct;
    var n=norm(raw).replace(/\b(ALMACEN|TIENDA|JAMAR|CENTRO COMERCIAL|CC)\b/g,' ').replace(/\s+/g,' ').trim();
    var keys=Object.keys(STORE_ALIAS).sort(function(a,b){return b.length-a.length;});
    for(var i=0;i<keys.length;i++)if(n.indexOf(keys[i])>=0)return STORE_ALIAS[keys[i]];
    var sk=Object.keys(S);
    for(var j=0;j<sk.length;j++){
      var sn=norm(S[sk[j]].name);
      if(sn&&((n.indexOf(sn)>=0)||(sn.indexOf(n)>=0)))return sk[j];
    }
    return '';
  }
  function inverseBodega(){
    var out={};Object.keys(S).forEach(function(sc){out[code(DB.meta&&DB.meta.mapeoBodegasInventario&&DB.meta.mapeoBodegasInventario[sc]||sc)]=sc;});return out;
  }
  function ensureStoreArrays(st){
    st.kpi=st.kpi||{};
    ['rot','evac','ventas','ventasProducto','tr','trDetalle','inventario'].forEach(function(k){if(!Array.isArray(st[k]))st[k]=[];});
  }
  Object.keys(S).forEach(function(sc){ensureStoreArrays(S[sc]);});

  function maxAgeLabel(ranges){
    var best='SIN DEFINIR',rank=-1;
    Object.keys(ranges||{}).forEach(function(k){if(toNum(ranges[k])>0){var r=ageRankFromLabel(k);if(r>rank){rank=r;best=canonicalAgeLabel(k);}}});
    return best;
  }
  function agedUnits(ranges,minRank){
    return Object.keys(ranges||{}).reduce(function(a,k){return a+(ageRankFromLabel(k)>=minRank?toNum(ranges[k]):0);},0);
  }
  function rebuildDerivedFromInventory(){
    Object.keys(S).forEach(function(sc){
      var st=S[sc];ensureStoreArrays(st);
      var inv=Array.isArray(st.inventario)?st.inventario:[],salesAgg={},rot=[],evac=[],vp=[];
      inv.forEach(function(x){
        var c=code(x.codigo),stock=toNum(x.stock),price=toNum(x.precioOferta)||toNum(x.valorUnitarioPromedio),value=toNum(x.valorInventario)||stock*price;
        x.codigo=c;x.valorInventario=value;x.valorUnitarioPromedio=stock?value/stock:price;
        var p=P[c]||{},cat=safeText(x.categoria||p.cat,'SIN CLASIFICAR'),lin=safeText(x.linea||p.lin,'SIN LINEA'),sub=safeText(x.sublinea||p.sub,'SIN SUBLINEA');
        var fac=toNum(x.facturacionUlt3Meses),u3=toNum(x.unidadesFacUlt3Meses),key=[cat,lin,sub].join('\u00a6');
        if(!salesAgg[key])salesAgg[key]=[cat,lin,sub,0,0,0,0];
        salesAgg[key][3]+=fac;salesAgg[key][4]+=u3;salesAgg[key][5]+=stock;salesAgg[key][6]+=value;
        vp.push([c,fac,u3,stock,value]);
        var cycle=norm(x.cicloVida||p.ciclo||''),stateCode=norm(x.estadoAbastecimiento||p.estado||''),ranges=x.rangos||{},ageLabel=maxAgeLabel(ranges),oldUnits=agedUnits(ranges,0);
        var isLine=(stateCode==='A'||cycle.indexOf('LINEA')>=0)&&cycle.indexOf('FUERA SURTIDO')<0;
        if(stock>0&&isLine&&oldUnits>0){
          var oldValue=stock?value*(oldUnits/stock):0;
          rot.push([c,oldUnits,ageRankFromLabel(ageLabel),oldValue,price,ageLabel,u3,0,0]);
          x.estados=['Rotación'];
        }else if(stock>0&&(!isLine||stateCode&&stateCode!=='A')){
          evac.push([c,stock,value,toNum(x.dispCendis),u3,0,ageLabel]);
          x.estados=['Evacuación'];
        }else x.estados=['Otros estados'];
      });
      st.rot=rot;st.evac=evac;st.ventas=Object.values(salesAgg);st.ventasProducto=vp;
    });
    if(typeof clearLlaveroCaches==='function')clearLlaveroCaches();
    sanitizeCurrentDB();
  }

  function parseDetail(wb,fileName){
    var ws=wb.Sheets[wb.SheetNames[0]],rows=aoa(ws),hf=findHeader(rows,['Tienda','Prod Codigo','Producto','Stock'],8);
    if(!hf)throw new Error('No se encontro el encabezado de Detalle.');
    var h=hf.headers,ii={
      store:idx(h,'Tienda'),c:idx(h,'Prod Codigo'),sap:idx(h,'Prod Codigo Sap'),name:idx(h,'Producto'),cat:idx(h,'Categoria'),lin:idx(h,'Linea'),sub:idx(h,'Sublinea'),
      matriz:idx(h,'Matriz'),ciclo:idx(h,'Ciclo de Vida'),estilo:idx(h,'Estilo'),familia:idx(h,'FAMILIA'),grupo:idx(h,'Grupo Sublinea'),precio:idx(h,'Precio Oferta'),lista:idx(h,'Precio Lista'),
      stock:idx(h,'Stock'),disponible:idx(h,'Disponible'),exhib:idx(h,'Cant Exhibidas'),pres:idx(h,'Presencia'),cendis:idx(h,'Disp Cendis'),rango:idx(h,'Rango Edad'),
      valorOp:idx(h,'Valor OP Oferta'),uv:idx(h,'Unidades Vendidas'),valorFac:idx(h,'Valor Oferta Fac'),uf:idx(h,'Unidades Facturadas'),fac3:idx(h,'Facturacion Ult3Meses'),u3:idx(h,'Unidades Fac Ult3Meses'),
      oc:idx(h,'Unidades en la OC'),fecha:idx(h,'Fecha Recibido'),margen:idx(h,'% Margen Oferta'),contr:idx(h,'Contr. Bruta Actual Oferta'),bod:idx(h,'BODEGAJE')
    };
    var next={};Object.keys(S).forEach(function(sc){next[sc]=[];});var current='';
    for(var r=hf.row+1;r<rows.length;r++){
      var row=rows[r],sv=val(row,ii.store);if(String(sv).trim())current=storeCode(sv);if(!current||!S[current])continue;
      var c=code(val(row,ii.c));if(!c||c==='-1')continue;
      var cat=safeText(val(row,ii.cat),P[c]&&P[c].cat||'SIN CLASIFICAR');if(norm(cat)==='DECORACION')continue;
      var stock=toNum(val(row,ii.stock)),price=toNum(val(row,ii.precio)),range=canonicalAgeLabel(val(row,ii.rango)||'SIN DEFINIR'),ranges={};if(stock>0)ranges[range]=stock;
      var item={codigo:c,codigoSap:code(val(row,ii.sap)),producto:safeText(val(row,ii.name),P[c]&&P[c].n||('Producto '+c)),categoria:cat,linea:safeText(val(row,ii.lin),P[c]&&P[c].lin||'SIN LINEA'),sublinea:safeText(val(row,ii.sub),P[c]&&P[c].sub||'SIN SUBLINEA'),matriz:safeText(val(row,ii.matriz),''),cicloVida:safeText(val(row,ii.ciclo),''),estilo:safeText(val(row,ii.estilo),''),familia:safeText(val(row,ii.familia),''),grupoSublinea:safeText(val(row,ii.grupo),''),marca:safeText(P[c]&&P[c].marca,''),surtido:safeText(P[c]&&P[c].surtido,''),estadoAbastecimiento:safeText(P[c]&&P[c].estado,''),precioOferta:price,precioLista:toNum(val(row,ii.lista)),stock:stock,disponible:ii.disponible>=0?toNum(val(row,ii.disponible)):null,exhibidas:ii.exhib>=0?toNum(val(row,ii.exhib)):null,presencia:ii.pres>=0?toNum(val(row,ii.pres)):null,dispCendisDetalle:toNum(val(row,ii.cendis)),dispCendis:toNum(P[c]&&P[c].dispCendis)||toNum(val(row,ii.cendis)),entradas:toNum(P[c]&&P[c].entradas),valorInventario:stock*price,rangos:ranges,valorOpOferta:toNum(val(row,ii.valorOp)),unidadesVendidas:toNum(val(row,ii.uv)),valorOfertaFacturada:toNum(val(row,ii.valorFac)),unidadesFacturadas:toNum(val(row,ii.uf)),facturacionUlt3Meses:toNum(val(row,ii.fac3)),unidadesFacUlt3Meses:toNum(val(row,ii.u3)),unidadesOC:toNum(val(row,ii.oc)),fechaRecibido:dateText(val(row,ii.fecha)),margenOferta:toNum(val(row,ii.margen)),contribucionBruta:toNum(val(row,ii.contr)),bodegaje:toNum(val(row,ii.bod)),estados:['Otros estados'],fuenteAntiguedad:fileName,fuenteBodegaCodigo:current,fuenteBodega:safeText(sv,S[current].name),valorUnitarioPromedio:price,rangosValor:stock>0?Object.fromEntries([[range,stock*price]]):{}};
      next[current].push(item);
      P[c]=Object.assign({},P[c]||{},{n:item.producto,cat:item.categoria,lin:item.linea,sub:item.sublinea,matriz:item.matriz,ciclo:item.cicloVida,estilo:item.estilo,familia:item.familia,grupoSublinea:item.grupoSublinea});
    }
    Object.keys(S).forEach(function(sc){S[sc].inventario=next[sc];});
    DB.meta.fuentes=DB.meta.fuentes||{};DB.meta.fuentes.gestionExhibicion=fileName;
    return 'Detalle actualizado para '+Object.keys(S).length+' tiendas';
  }

  function parseAge(wb,fileName){
    var rows=aoa(wb.Sheets[wb.SheetNames[0]]),hf=findHeader(rows,['Bod Codigo','Prod Codigo','000 - 030','Total general'],8);
    if(!hf)throw new Error('No se encontro el encabezado de Inventario Art.');
    var h=hf.headers,ib=idx(h,'Bod Codigo'),ic=idx(h,'Prod Codigo'),itype=4,map=inverseBodega();
    var rangeCols=[];['000 - 030','031 - 060','061 - 090','091 - 120','120 - 150','150 - 180','181 - 210','210 - 240','241 - 360','360 - Mas','SIN DEFINIR'].forEach(function(n){var p=idx(h,n);if(p>=0)rangeCols.push([p,canonicalAgeLabel(n)]);});
    var curB='',curC='',byStore={};
    for(var r=hf.row+1;r<rows.length;r++){
      var row=rows[r];if(String(val(row,ib)).trim())curB=code(val(row,ib));if(String(val(row,ic)).trim()&&code(val(row,ic))!=='-1')curC=code(val(row,ic));
      if(norm(val(row,itype))!=='TOTAL UNIDADES'||!curB||!curC)continue;
      var sc=map[curB];if(!sc||!S[sc])continue;var ranges={};rangeCols.forEach(function(x){var n=toNum(val(row,x[0]));if(n>0)ranges[x[1]]=n;});
      if(!byStore[sc])byStore[sc]={};byStore[sc][curC]=ranges;
    }
    Object.keys(byStore).forEach(function(sc){(S[sc].inventario||[]).forEach(function(x){var rr=byStore[sc][code(x.codigo)];if(rr){x.rangos=rr;x.fuenteAntiguedad=fileName;x.fuenteBodegaCodigo=DB.meta.mapeoBodegasInventario&&DB.meta.mapeoBodegasInventario[sc]||sc;x.rangosValor={};var p=toNum(x.valorUnitarioPromedio)||toNum(x.precioOferta);Object.keys(rr).forEach(function(k){x.rangosValor[k]=toNum(rr[k])*p;});}});});
    DB.meta.fuentes=DB.meta.fuentes||{};DB.meta.fuentes.inventarioAntiguedad=fileName;
    return 'Antiguedad exacta actualizada';
  }

  function parseInfoSales(wb,fileName){
    var rows=aoa(wb.Sheets[wb.SheetNames[0]]),hf=findHeader(rows,['Codigo Sap','Foto Producto','Categoria','Linea','Sublinea'],10);
    if(!hf)throw new Error('No se encontro el encabezado de INFO VENTA BASE.');
    var h=hf.headers,ic=idx(h,'Codigo Sap'),inm=idx(h,'Nombre Actual'),iest=idx(h,'Estilo de Vida Actual'),iestado=idx(h,'Estado Actual'),iport=idx(h,'Portafolio Actual'),imat=idx(h,'Matriz Actual'),icat=idx(h,'Categoria'),ilin=idx(h,'Linea'),isub=idx(h,'Sublinea'),iimg=idx(h,'Foto Producto');
    var count=0;
    for(var r=hf.row+1;r<rows.length;r++){
      var row=rows[r],c=code(val(row,ic));if(!c)continue;var cat=safeText(val(row,icat),P[c]&&P[c].cat||'SIN CLASIFICAR');if(norm(cat)==='DECORACION')continue;
      P[c]=Object.assign({},P[c]||{},{n:safeText(val(row,inm),P[c]&&P[c].n||('Producto '+c)),cat:cat,lin:safeText(val(row,ilin),P[c]&&P[c].lin||'SIN LINEA'),sub:safeText(val(row,isub),P[c]&&P[c].sub||'SIN SUBLINEA'),estilo:safeText(val(row,iest),P[c]&&P[c].estilo||''),estado:safeText(val(row,iestado),P[c]&&P[c].estado||''),surtido:safeText(val(row,iport),P[c]&&P[c].surtido||''),matriz:safeText(val(row,imat),P[c]&&P[c].matriz||'')});
      var im=String(val(row,iimg)||'').trim();if(/^https?:\/\//i.test(im))P[c].img=im;count++;
    }
    Object.keys(S).forEach(function(sc){(S[sc].inventario||[]).forEach(function(x){var p=P[code(x.codigo)]||{};x.producto=p.n||x.producto;x.categoria=p.cat||x.categoria;x.linea=p.lin||x.linea;x.sublinea=p.sub||x.sublinea;x.estilo=p.estilo||x.estilo;x.matriz=p.matriz||x.matriz;});});
    DB.meta.fuentes=DB.meta.fuentes||{};DB.meta.fuentes.imagenesProducto=fileName;
    return count+' productos e imagenes actualizados';
  }

  function parseSap(wb,fileName){
    var name=wb.SheetNames.find(function(n){return normalizeHeader(n)==='herramienta';});if(!name)throw new Error('No se encontro la hoja HERRAMIENTA.');
    var rows=aoa(wb.Sheets[name]),hf=findHeader(rows,['Codigo','Material','Estado','Dispo COL'],12);if(!hf)throw new Error('No se encontro el encabezado de HERRAMIENTA SAP.');
    var h=hf.headers,ic=idx(h,'Codigo'),imarca=idx(h,'Marca'),iestilo=idx(h,'Estilo'),iestado=idx(h,'Estado'),idispo=idx(h,'Dispo COL'),igrupo=idx(h,'Grupo_Sub'),iciclo=idx(h,'Ciclo_Vida'),isurt=idx(h,'Surtido_Col');
    var data={},count=0;
    for(var r=hf.row+1;r<rows.length;r++){
      var row=rows[r],c=code(val(row,ic));if(!c)continue;var entradas=0;for(var z=39;z<=42;z++)entradas+=toNum(val(row,z));
      data[c]={disp:toNum(val(row,idispo)),entradas:entradas,marca:safeText(val(row,imarca),''),estilo:safeText(val(row,iestilo),''),estado:safeText(val(row,iestado),''),grupo:safeText(val(row,igrupo),''),ciclo:safeText(val(row,iciclo),''),surtido:safeText(val(row,isurt),safeText(val(row,0),''))};count++;
      P[c]=Object.assign({},P[c]||{},{marca:data[c].marca,estilo:data[c].estilo,estado:data[c].estado,grupoSublinea:data[c].grupo,ciclo:data[c].ciclo,surtido:data[c].surtido,dispCendis:data[c].disp,entradas:data[c].entradas});
    }
    Object.keys(S).forEach(function(sc){(S[sc].inventario||[]).forEach(function(x){var d=data[code(x.codigo)];if(!d)return;x.dispCendis=d.disp;x.entradas=d.entradas;x.marca=d.marca||x.marca;x.estilo=d.estilo||x.estilo;x.estadoAbastecimiento=d.estado||x.estadoAbastecimiento;x.grupoSublinea=d.grupo||x.grupoSublinea;x.cicloVida=d.ciclo||x.cicloVida;x.surtido=d.surtido||x.surtido;});});
    DB.meta.fuentes=DB.meta.fuentes||{};DB.meta.fuentes.abastecimiento=fileName;
    return count+' productos SAP actualizados';
  }

  function parseGuides(wb,fileName){
    var excluded={PRUEBAHAIGU9MAYO:1,'18ABRPRUEBAHAINER':1},summary={},rs=wb.Sheets.Resumen?aoa(wb.Sheets.Resumen):[];
    rs.slice(1).forEach(function(r){var c=code(r[0]);if(c)summary[c]=String(r[1]||'').trim();});
    var oldCat={};(DB.G||[]).forEach(function(g){oldCat[g[0]]=g[2];});var out=[];
    wb.SheetNames.forEach(function(n){if(n==='Resumen'||excluded[n])return;var rows=aoa(wb.Sheets[n]),floor='?',seen={},prods=[];
      rows.slice(1).forEach(function(r){var a=String(r[0]||'').trim(),fm=a.match(/^PISO\s*(\d+)/i);if(fm){floor=fm[1];return;}var c=code(r[0]),pn=String(r[1]||'').trim();if(!c||!pn||/^C[OÓ]DIGO$/i.test(a))return;var k=floor+'|'+c;if(seen[k])return;seen[k]=1;prods.push([c,floor,pn]);});
      var gc=code(n),cat=oldCat[gc]||(gc.indexOf('DOR')===0?'DORMITORIO':'SOCIAL');out.push([gc,summary[gc]||gc,cat,prods]);
    });
    DB.G=out;DB.meta.fuentes=DB.meta.fuentes||{};DB.meta.fuentes.guiasExhibicion=fileName;DB.meta.nGuias=out.length;
    return out.length+' guias actualizadas';
  }

  function parsePresence(wb,fileName){
    var rows=aoa(wb.Sheets[wb.SheetNames[0]]),hf=findHeader(rows,['BOD','COD','CAN SUM'],8);if(!hf)throw new Error('No se encontro el encabezado de Presencia Seus.');
    var h=hf.headers,ib=idx(h,'BOD'),ic=idx(h,'COD'),is=idx(h,'CAN SUM'),im=idx(h,'CAN MIN SUM','CAN MIN');if(im<0)throw new Error('No se encontro CAN MIN SUM.');var out={};
    for(var r=hf.row+1;r<rows.length;r++){var row=rows[r],b=code(val(row,ib)),c=code(val(row,ic));if(!b||!c)continue;if(!out[b])out[b]={};out[b][c]=[toNum(val(row,is)),toNum(val(row,im))];}
    DB.GP=out;DB.meta.fuentes=DB.meta.fuentes||{};DB.meta.fuentes.presenciaGuias=fileName;
    return 'Presencia actualizada para '+Object.keys(out).length+' bodegas';
  }

  function parseTransfers(wb,fileName){
    var name=wb.SheetNames.find(function(n){return normalizeHeader(n)==='base_de_datos';})||wb.SheetNames[0],rows=aoa(wb.Sheets[name]);
    var hf=findHeader(rows,['Entrega','Material','Nombre destinatario de mercancias','Cantidad entrega'],10);if(!hf)throw new Error('No se encontro el encabezado de Traslados pendientes.');
    var h=hf.headers,ie=idx(h,'Entrega'),idest=idx(h,'Nombre destinatario de mercancias'),ic=idx(h,'Material'),inm=idx(h,'Denominacion'),iu=idx(h,'Cantidad entrega'),iv=idx(h,'Volumen'),ifc=idx(h,'Fecha de creacion'),ife=idx(h,'Fecha tentativa de entrega.','Fecha tentativa de entrega'),ip=idx(h,'Status glob.picking','Status de picking'),im=idx(h,'Status mov.mcia.','Status mov.mcia'),irev=idx(h,'ESTADO FECHA'),iest=idx(h,'Estatus');
    var compact={},detail={};Object.keys(S).forEach(function(sc){compact[sc]=[];detail[sc]=[];});
    for(var r=hf.row+1;r<rows.length;r++){
      var row=rows[r],sc=storeCode(val(row,idest));if(!sc||!S[sc])continue;var c=code(val(row,ic));if(!c)continue;
      var nm=safeText(val(row,inm),P[c]&&P[c].n||('Producto '+c)),u=toNum(val(row,iu)),vol=toNum(val(row,iv)),fc=dateText(val(row,ifc)),fe=dateText(val(row,ife)),pick=safeText(val(row,ip),''),mov=safeText(val(row,im),''),rev=norm(val(row,irev)).indexOf('REVISAR')>=0?'REVISAR':'OK',ent=safeText(val(row,ie),'');
      compact[sc].push([c,nm,u,vol,fc,fe,pick,mov,rev]);
      detail[sc].push({codigo:c,nombre:nm,entrega:ent,unidades:u,volumen:vol,fechaCreacion:fc,fechaEntrega:fe,statusGlobalPicking:pick,statusMovimiento:mov,estatus:safeText(val(row,iest),rev)});
      if(!P[c])P[c]={n:nm,cat:'SIN CLASIFICAR',lin:'SIN LINEA',sub:'SIN SUBLINEA'};
    }
    Object.keys(S).forEach(function(sc){S[sc].tr=compact[sc];S[sc].trDetalle=detail[sc];});
    DB.meta.fuentes=DB.meta.fuentes||{};DB.meta.fuentes.traslados=fileName;
    return Object.values(compact).reduce(function(a,x){return a+x.length;},0)+' lineas de traslado actualizadas';
  }

  function classifyWorkbook(wb,fileName){
    var names=wb.SheetNames.map(normalizeHeader);
    if(names.indexOf('resumen')>=0&&wb.SheetNames.length>20)return 'guides';
    if(names.indexOf('herramienta')>=0)return 'sap';
    if(names.indexOf('base_de_datos')>=0)return 'transfers';
    var first=headAoa(wb.Sheets[wb.SheetNames[0]],10),flat=first.map(function(r){return r.map(normalizeHeader);});
    if(flat.some(function(h){return h.indexOf('can_sum')>=0&&h.some(function(x){return x==='can_min_sum'||x==='can_min';});}))return 'presence';
    if(flat.some(function(h){return h.indexOf('tienda')>=0&&h.indexOf('prod_codigo')>=0&&h.indexOf('stock')>=0;}))return 'detail';
    if(flat.some(function(h){return h.indexOf('bod_codigo')>=0&&h.indexOf('prod_codigo')>=0&&h.indexOf('000_030')>=0;}))return 'age';
    if(flat.some(function(h){return h.indexOf('codigo_sap')>=0&&h.indexOf('foto_producto')>=0&&h.indexOf('categoria')>=0;}))return 'info';
    if(names.some(function(n){return ['productos','tiendas','rotacion','evacuacion','ventas','ventasproducto','traslados'].indexOf(n)>=0;}))return 'structured';
    return 'unknown';
  }

  function processWorkbook(wb,fileName,type){
    type=type||classifyWorkbook(wb,fileName);
    if(type==='guides')return {type:type,msg:parseGuides(wb,fileName)};
    if(type==='presence')return {type:type,msg:parsePresence(wb,fileName)};
    if(type==='transfers')return {type:type,msg:parseTransfers(wb,fileName)};
    if(type==='detail')return {type:type,msg:parseDetail(wb,fileName)};
    if(type==='age')return {type:type,msg:parseAge(wb,fileName)};
    if(type==='info')return {type:type,msg:parseInfoSales(wb,fileName)};
    if(type==='sap')return {type:type,msg:parseSap(wb,fileName)};
    if(type==='structured'){
      var newDB=buildDBFromWorkbook(wb);applyNewDB(newDB,{skipPersist:true,silent:true});return {type:type,msg:'Plantilla estructurada actualizada'};
    }
    throw new Error('No fue posible identificar la fuente de '+fileName+'. Usa el JSON consolidado o revisa que el archivo conserve sus encabezados originales.');
  }

  function readExcelFile(file){
    return new Promise(function(resolve,reject){
      var rd=new FileReader();rd.onerror=function(){reject(new Error('No fue posible leer '+file.name));};
      rd.onload=function(e){try{var wb=XLSX.read(new Uint8Array(e.target.result),{type:'array',cellDates:false});resolve(processWorkbook(wb,file.name));}catch(err){reject(err);}};
      rd.readAsArrayBuffer(file);
    });
  }

  function finalizeExcelLoad(types,messages){
    var impacts=types.some(function(t){return ['detail','age','info','sap','structured'].indexOf(t)>=0;});
    if(impacts)rebuildDerivedFromInventory();else sanitizeCurrentDB();
    if(typeof clearLlaveroCaches==='function')clearLlaveroCaches();
    if(typeof llaveroRebuildAllGuideData==='function')llaveroRebuildAllGuideData();
    DB.meta.ultimaCargaIndividual=new Date().toISOString();
    try{saveDBSnapshot({meta:DB.meta,P:P,S:S,G:DB.G||[],GP:DB.GP||{}});}catch(e){console.warn(e);}
    populateStoreSelect(IS_ADMIN?AUTH.store:CUR);refresh();
    setLoadStatus('✅ '+messages.join(' · '),false);
  }

  window.loadExcelFiles=async function(input){
    if(!requireLeader()){if(input)input.value='';return;}
    var files=Array.from(input&&input.files||[]);if(!files.length)return;input.value='';
    var allowed=/\.(xlsx|xls|xlsm|xlsb|csv)$/i;
    if(files.some(function(f){return !allowed.test(f.name);})){setLoadStatus('❌ Selecciona archivos Excel compatibles.',true);return;}
    var types=[],messages=[];
    try{
      for(var i=0;i<files.length;i++){
        setLoadStatus('⏳ Procesando '+(i+1)+' de '+files.length+': '+files[i].name,false);
        var res=await readExcelFile(files[i]);types.push(res.type);messages.push(res.msg);
        await new Promise(function(ok){setTimeout(ok,20);});
      }
      finalizeExcelLoad(types,messages);
    }catch(err){console.error(err);setLoadStatus('❌ '+err.message,true);}
  };

  function injectExcelButton(){
    var jsonInput=document.getElementById('xlsxInput'),jsonLabel=jsonInput&&jsonInput.closest('label');if(!jsonLabel||document.getElementById('excelIndividualInput'))return;
    jsonLabel.title='Opcion recomendada: cargar el JSON consolidado';
    var label=document.createElement('label');label.className='uploadBtn leaderOnly excelIndividualBtn';label.title='Carga alternativa: uno o varios archivos Excel de las fuentes originales';
    label.innerHTML='📑 Cargar Excel<input type="file" id="excelIndividualInput" accept=".xlsx,.xls,.xlsm,.xlsb,.csv" multiple onchange="loadExcelFiles(this)">';
    jsonLabel.insertAdjacentElement('afterend',label);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectExcelButton);else injectExcelButton();

  var GUIDE_STATUS_V41={ok:['Con existencia','gs-ok'],camino:['En camino','gs-camino'],cendis:['Solicitar CENDIS','gs-cendis'],sin:['Sin dispo CENDIS','gs-sin'],nd:['Sin dato','gs-nd']};
  function guideStatus(s){var x=GUIDE_STATUS_V41[s]||GUIDE_STATUS_V41.sin;return '<span class="guideStatus '+x[1]+'">'+x[0]+'</span>';}
  function dispoTag(p){var yes=toNum(p&&p[3])>0||toNum(p&&p[4])>0;return yes?'<span class="tag cr">Si</span>':'<span class="tag sr">No</span>';}
  window.drawGuias=function(){
    var st=S[CUR]||{},s=state.guias;if(!st.guias&&typeof llaveroRebuildAllGuideData==='function')llaveroRebuildAllGuideData();
    var rows=(st.guias||[]).map(function(g){return {code:g[0],name:g[1],cat:g[2],tot:g[3],pres:g[4],pp:g[5],prods:g[6],nr:g[7],avance:g[8],comp:g[3]?Math.round(1000*g[4]/g[3])/10:0,nCendis:(g[6]||[]).filter(function(p){return p[5]==='cendis';}).length,nSin:(g[6]||[]).filter(function(p){return p[5]==='sin';}).length,nCamino:(g[6]||[]).filter(function(p){return p[5]==='camino';}).length};});
    if(s.f==='DORMITORIO'||s.f==='SOCIAL')rows=rows.filter(function(r){return r.cat===s.f;});else if(s.f==='incompletas')rows=rows.filter(function(r){return r.comp<100;});else if(s.f==='completas')rows=rows.filter(function(r){return r.comp>=100;});else if(s.f==='avance')rows=rows.filter(function(r){return r.avance===1;});else if(s.f==='cendis')rows=rows.filter(function(r){return r.nCendis>0;});else if(s.f==='sincendis')rows=rows.filter(function(r){return r.nSin>0;});
    if(s.q){var q=String(s.q).toLowerCase();rows=rows.filter(function(r){return (r.name+' '+r.code+' '+r.cat).toLowerCase().indexOf(q)>=0||(r.prods||[]).some(function(p){return (p[0]+' '+p[6]).toLowerCase().indexOf(q)>=0;});});}
    var access={name:function(r){return r.name;},cat:function(r){return r.cat;},comp:function(r){return r.comp;},falt:function(r){return r.tot-r.pres;},cendis:function(r){return r.nCendis;}};
    if(s.sort==='comp')rows.sort(function(a,b){return (a.comp-b.comp)*s.dir||((b.tot-b.pres)-(a.tot-a.pres));});else if(access[s.sort])rows.sort(cmp(s,access));
    document.querySelectorAll('.guideKpi').forEach(function(x){x.classList.toggle('on',x.dataset.f===s.f);});
    function floorPct(r,i){return r.pp[i*2+1]?Math.round(100*r.pp[i*2]/r.pp[i*2+1]):null;}
    var body='';
    rows.forEach(function(r){
      var color=r.comp>=100?'var(--ok)':r.comp>=50?'var(--amb)':'var(--rot)';
      body+='<tr class="guideMainRow" tabindex="0" role="button" data-guide-code="'+esc(r.code)+'" aria-expanded="'+(s.exp[r.code]?'true':'false')+'">'+
        '<td><div class="guideMainName"><span class="guideArrow">'+(s.exp[r.code]?'▾':'▸')+'</span><div><div class="guideName">'+esc(r.name)+'</div><div class="guideCode">'+esc(r.code)+'</div></div></div></td><td><span class="tag '+(r.cat==='DORMITORIO'?'cr':'a')+'">'+esc(r.cat)+'</span></td><td class="num"><div class="guideComp"><div class="guideCompTrack"><div class="guideCompFill" style="width:'+r.comp+'%;background:'+color+'"></div></div><b>'+r.comp.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</b></div></td>'+
        [0,1,2].map(function(i){var p=floorPct(r,i);return '<td class="num"><b style="color:'+(p===100?'var(--ok)':p===null?'var(--mut2)':'var(--ink2)')+'">'+(p===null?'—':p+'%')+'</b></td>';}).join('')+
        '<td class="num"><b style="color:'+(r.tot-r.pres?'var(--bad)':'var(--ok)')+'">'+fInt(r.tot-r.pres)+'</b></td><td class="num"><b style="color:var(--amb)">'+fInt(r.nCendis)+'</b></td></tr>';
      if(s.exp[r.code]){
        var groups={'1':[],'2':[],'3':[]};(r.prods||[]).forEach(function(p){var pi=/^[123]$/.test(String(p[1]))?String(p[1]):'3';groups[pi].push(p);});
        var order={ok:0,camino:1,cendis:2,sin:3,nd:4},sections='';
        ['1','2','3'].forEach(function(pi){
          var arr=groups[pi].slice().sort(function(a,b){return (order[a[5]]||0)-(order[b[5]]||0);}),ex=arr.filter(function(p){return p[5]==='ok';}).length;
          var rowsHtml=arr.length?arr.map(function(p){return '<tr class="guideProductRow" tabindex="0" role="button" data-product-code="'+esc(p[0])+'"><td>'+imageThumb(p[0],'sm')+'</td><td><span class="code">'+esc(p[0])+'</span></td><td><div class="guideProductName">'+esc(p[6]||P[p[0]]&&P[p[0]].n||'—')+'</div><div class="pageInteractiveHint">'+esc(P[p[0]]&&P[p[0]].cat||'')+(P[p[0]]&&P[p[0]].lin?' · '+esc(P[p[0]].lin):'')+'</div></td><td class="num"><b style="color:'+(toNum(p[2])>0?'var(--ok)':'var(--bad)')+'">'+fInt(p[2])+'</b></td><td class="num">'+(toNum(p[3])<0?'—':fInt(p[3]))+'</td><td class="num">'+dispoTag(p)+'</td><td>'+guideStatus(p[5])+'</td></tr>';}).join(''):'<tr><td colspan="7"><div class="guideFloorEmpty">Esta guía no tiene productos asignados al Piso '+pi+'.</div></td></tr>';
          sections+='<div class="guideFloorSection"><div class="guideFloorHead"><span>PISO '+pi+'</span><span>'+arr.length+' productos · '+ex+' con existencia · '+Math.max(0,arr.length-ex)+' pendientes</span></div><div class="guideDetailWrap"><table class="guideDetailTable guideDetailTableV41"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th class="num">CAN SUM</th><th class="num">CAN MIN</th><th class="num">Dispo CENDIS</th><th>Estado</th></tr></thead><tbody>'+rowsHtml+'</tbody></table></div></div>';
        });
        function pill(t,n,cls){return '<span class="guidePill '+cls+'">'+t+': '+fInt(n)+'</span>';}
        body+='<tr class="guideExpand"><td colspan="8"><div class="guidePills">'+pill('Con existencia',r.pres,'gs-ok')+pill('Faltantes',r.tot-r.pres,'gs-sin')+pill('Con dispo CENDIS',r.nCendis,'gs-cendis')+pill('En camino',r.nCamino,'gs-camino')+pill('Sin dispo CENDIS',r.nSin,'gs-sin')+'</div><div class="guideDetailLabel">DETALLE POR PISO · DENTRO DE CADA PISO, EXISTENTES PRIMERO</div>'+sections+(r.nr?'<div class="guideSourceNote">'+fInt(r.nr)+' productos no aparecen en Presencia Seus y se muestran como Sin dato.</div>':'')+'</td></tr>';
      }
    });
    var html='<div class="twrap"><table class="guideTable"><colgroup><col><col><col><col><col><col><col><col></colgroup><thead><tr><th data-sort="name">Guía</th><th data-sort="cat">Categoría</th><th class="num" data-sort="comp">Completitud</th><th class="num">P1</th><th class="num">P2</th><th class="num">P3</th><th class="num" data-sort="falt">Faltan</th><th class="num" data-sort="cendis">Dispo CENDIS</th></tr></thead><tbody>'+(body||'<tr><td colspan="8"><div class="empty">Sin guias para este filtro</div></td></tr>')+'</tbody></table></div>';
    var el=document.getElementById('guias-tbl');if(el)el.innerHTML=html;var cnt=document.getElementById('guias-cnt');if(cnt)cnt.textContent='Mostrando '+rows.length+' de '+((st.guias||[]).length)+' guías · presiona cualquier guía para desplegarla';
    document.querySelectorAll('#guias-tbl .guideMainRow').forEach(function(tr){var open=function(){toggleGuia(tr.dataset.guideCode);};tr.onclick=open;tr.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};});
    document.querySelectorAll('#guias-tbl .guideProductRow').forEach(function(tr){var open=function(e){if(e)e.stopPropagation();openGuideProduct(tr.dataset.productCode);};tr.onclick=open;tr.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();open(e);}};});
    document.querySelectorAll('#guias-tbl th[data-sort]').forEach(function(th){th.onclick=function(e){e.stopPropagation();var k=th.dataset.sort;if(s.sort===k)s.dir*=-1;else{s.sort=k;s.dir=1;}drawGuias();};});
    document.querySelectorAll('.chip.filt[data-q="guias"]').forEach(function(ch){ch.classList.toggle('on',s.f===ch.dataset.f);ch.onclick=function(){s.f=ch.dataset.f;drawGuias();};});
  };

  window.openTransferProductV41=function(c){
    c=code(c);var exists=normalizeInventoryRows(S[CUR]||{}).some(function(r){return r.c===c;});
    if(exists){if(typeof openBestProductDetail==='function')openBestProductDetail(c);else openInventoryProduct(c);}
    else toast('El producto no tiene inventario actual en esta tienda','err');
  };
  window.drawTr=function(){
    var st=S[CUR]||{tr:[]},s=state.tr,rows=(st.tr||[]).slice();
    if(s.f==='pick')rows=rows.filter(function(r){return String(r[6]||'').toUpperCase()==='A';});
    if(s.f==='mov')rows=rows.filter(function(r){return String(r[7]||'').toUpperCase()==='A';});
    if(s.f==='rev')rows=rows.filter(function(r){return String(r[8]||'').toUpperCase()==='REVISAR';});
    if(s.q){var q=String(s.q).toLowerCase();rows=rows.filter(function(r){return String(r[1]||'').toLowerCase().indexOf(q)>=0||String(r[0]||'').toLowerCase().indexOf(q)>=0;});}
    if(s.sort!=='st')rows.sort(cmp(s,{c:function(r){return r[0];},m:function(r){return r[1];},u:function(r){return r[2];},vol:function(r){return r[3];},fc:function(r){return r[4];}}));
    else rows.sort(function(a,b){return (a[6]!=='A')-(b[6]!=='A')||(a[7]!=='A')-(b[7]!=='A');});
    function stag(v){return v==='A'?'<span class="tag a">Pendiente</span>':v==='C'?'<span class="tag cr">OK</span>':'<span style="color:var(--mut)">'+esc(v||'—')+'</span>';}
    var cols=[['Imagen','x',0],['Código','c',0],['Material','m',0],['Uds','u',1],['m³','vol',1],['Creación','fc',0],['Entrega','x',0],['Picking','x',0],['Mov.','x',0],['Fecha','x',0]];
    var body=rows.map(function(r){return [imageThumb(r[0],'sm'),'<span class="code">'+esc(r[0])+'</span>','<div class="pname" title="'+esc(r[1])+'">'+esc(r[1])+'</div>','<b>'+fInt(r[2])+'</b>',toNum(r[3]).toLocaleString('es-CO',{maximumFractionDigits:3}),'<span style="color:var(--mut)">'+esc(safeText(r[4],'—'))+'</span>','<span style="color:var(--mut)">'+esc(safeText(r[5],'—'))+'</span>',stag(r[6]),stag(r[7]),String(r[8]||'').toUpperCase()==='REVISAR'?'<span class="tag rev">REVISAR</span>':'<span class="tag ok">OK</span>'];});
    var el=document.getElementById('tr-tbl');if(el){el.innerHTML=tableHTML('tr',cols,body).replace('<table>','<table class="transferTableV41">');}
    var cnt=document.getElementById('tr-cnt');if(cnt)cnt.textContent='Mostrando '+rows.length+' de '+((st.tr||[]).length)+' líneas · la imagen corresponde al código del producto';
    wireTable('tr',drawTr);
  };

  setTimeout(function(){if(VIEW==='amb'){refresh();}},0);
})();


/* ===== llavero-v42-ambientes-corrected-script ===== */
(function(){
  function gc42(v){var s=String(v==null?'':v).trim();if(/^J\d+$/.test(s))s=s.slice(1);if(/^\d+\.0$/.test(s))s=s.slice(0,-2);return s;}
  function mapBod42(sc){return String(DB&&DB.meta&&DB.meta.mapeoBodegasInventario&&DB.meta.mapeoBodegasInventario[sc]||sc);}
  function transferMap42(st){var out={};(st&&st.tr||[]).forEach(function(r){var c=gc42(r&&r[0]),u=toNum(r&&r[2]),open=String(r&&r[6]||'').toUpperCase()==='A'||String(r&&r[7]||'').toUpperCase()==='A';if(c&&u>0&&open)out[c]=(out[c]||0)+u;});return out;}
  function guideStatus42(status,tu){
    var map={ok:['Con existencia','gs-ok'],camino:['En camino'+(tu?' · '+fInt(tu)+' u':''),'gs-camino'],cendis:['Solicitar CENDIS','gs-cendis'],sin:['Sin disponibilidad CENDIS','gs-sin'],nd:['Sin registro en Presencia','gs-nd']};
    var x=map[status]||map.nd;return '<span class="guideStatus '+x[1]+'">'+x[0]+'</span>';
  }
  function dispo42(p){
    if(!p[7])return '<span class="guideStatus guideDispoNd">Sin dato</span>';
    return toNum(p[3])>0?'<span class="guideStatus guideDispoYes">Sí</span>':'<span class="guideStatus guideDispoNo">No</span>';
  }
  function buildStore42(sc){
    var st=S[sc];if(!st)return;var bod=mapBod42(sc),presence=DB.GP&&DB.GP[bod]||{},transfers=transferMap42(st),allUnique={},missingUnique={};
    var agg={nG:0,gCompletas:0,gIncompletas:0,compTotalPct:0,reqTotal:0,haveTotal:0,faltTot:0,faltCendis:0,faltSin:0,faltCamino:0,noRastr:0,uniqueRequired:0,uniqueMissing:0};
    st.guias=(DB.G||[]).map(function(g){
      var total=0,have=0,noData=0,pp=[0,0,0,0,0,0],floor1=false;
      var prods=(g[3]||[]).map(function(pd){
        var c=gc42(pd[0]),floor=/^[123]$/.test(String(pd[1]))?String(pd[1]):'3',pi=Number(floor)-1,rec=presence[c],hasRecord=Array.isArray(rec),cs=hasRecord?toNum(rec[0]):0,cm=hasRecord?toNum(rec[1]):0,tu=toNum(transfers[c]),status;
        total++;agg.reqTotal++;allUnique[c]=1;pp[pi*2+1]++;
        if(cs>0){status='ok';have++;agg.haveTotal++;pp[pi*2]++;if(floor==='1')floor1=true;}
        else{missingUnique[c]=1;if(tu>0){status='camino';agg.faltCamino++;}else if(hasRecord&&cm>0){status='cendis';agg.faltCendis++;}else if(!hasRecord){status='nd';noData++;agg.noRastr++;}else{status='sin';agg.faltSin++;}}
        return [c,floor,cs,cm,cm>0?1:0,status,pd[2]||(P[c]&&P[c].n)||'',hasRecord?1:0,tu];
      });
      if(total&&have===total)agg.gCompletas++;
      return [g[0],g[1],g[2],total,have,pp,prods,noData,floor1?1:0];
    });
    agg.nG=st.guias.length;agg.gIncompletas=Math.max(0,agg.nG-agg.gCompletas);agg.faltTot=Math.max(0,agg.reqTotal-agg.haveTotal);agg.compTotalPct=agg.reqTotal?Math.round(1000*agg.haveTotal/agg.reqTotal)/10:0;agg.uniqueRequired=Object.keys(allUnique).length;agg.uniqueMissing=Object.keys(missingUnique).length;
    st.amb=agg;st.kpi=st.kpi||{};st.kpi.guiaComp=agg.compTotalPct;st.kpi.guiaFalt=agg.faltTot;st.kpi.guiaCompletas=agg.gCompletas;
  }
  window.llaveroRebuildAllGuideData=function(){Object.keys(S||{}).forEach(buildStore42);};
  window.llaveroRebuildAllGuideData();
  if(!state.guias)state.guias={sort:'comp',dir:1,q:'',f:'all',exp:{}};
  if(!state.guias.exp)state.guias.exp={};
  window.rememberGuideOpenV42=function(el){var c=el&&el.dataset&&el.dataset.guideCode;if(!c)return;state.guias.exp[c]=!!el.open;};
  window.toggleGuia=function(c){c=gc42(c);if(!state.guias.exp)state.guias.exp={};state.guias.exp[c]=!state.guias.exp[c];var el=document.querySelector('#guias-tbl details[data-guide-code="'+(window.CSS&&CSS.escape?CSS.escape(c):c.replace(/"/g,'\\"'))+'"]');if(el)el.open=state.guias.exp[c];};
  function floorAgg42(st){var a=[0,0,0,0,0,0];(st.guias||[]).forEach(function(g){for(var i=0;i<6;i++)a[i]+=toNum(g[5]&&g[5][i]);});return a;}
  function kpi42(label,value,meta){return '<div class="ambV42Kpi"><div class="akLabel">'+label+'</div><div class="akValue">'+value+'</div><div class="akMeta">'+meta+'</div></div>';}
  window.viewAmb=function(st){
    if(!st.guias)buildStore42(CUR);var k=st.kpi||{},a=st.amb||{},pa=floorAgg42(st),pct=function(i){return pa[i*2+1]?Math.round(1000*pa[i*2]/pa[i*2+1])/10:0;},manageable=toNum(a.faltCendis)+toNum(a.faltCamino);
    setTimeout(function(){if(VIEW==='amb'){drawGuias();drawTr();}},0);
    return '<div class="card"><div class="chead"><div class="cnum n3">▦</div><div><div class="tt">Guías de exhibición</div><div class="ds">Cumplimiento por ambiente y piso usando CAN SUM y CAN MIN</div></div><div class="rt"><span class="badge cool">'+toNum(a.compTotalPct).toLocaleString('es-CO',{maximumFractionDigits:1})+'% completitud</span></div></div><div class="cbody">'+
      '<div class="ambV42Intro">'+kpi42('Completitud total',toNum(a.compTotalPct).toLocaleString('es-CO',{maximumFractionDigits:1})+'%',fInt(a.haveTotal)+' de '+fInt(a.reqTotal)+' posiciones con existencia')+kpi42('Guías completas',fInt(a.gCompletas)+' / '+fInt(a.nG),fInt(a.gIncompletas)+' ambientes todavía incompletos')+kpi42('Posiciones faltantes',fInt(a.faltTot),fInt(a.uniqueMissing)+' códigos únicos faltantes')+kpi42('Faltantes gestionables',fInt(manageable),fInt(a.faltCendis)+' con CAN MIN · '+fInt(a.faltCamino)+' en traslado')+'</div>'+
      '<div class="ambV42Quality '+(a.noRastr?'':'good')+'"><span>ⓘ</span><div><b>Calidad del cruce:</b> '+(a.noRastr?fInt(a.noRastr)+' posiciones de guía no tienen una fila coincidente en Presencia Seus. Se muestran como <b>Sin registro</b>, cuentan como faltantes y no se clasifican como disponibles en CENDIS.':'todos los productos de las guías tienen registro en Presencia Seus.')+'</div></div>'+
      '<div><div class="legend" style="margin-bottom:7px"><b>Completitud por piso</b></div><div class="guideFloorGrid">'+[0,1,2].map(function(i){var t=pa[i*2+1],h=pa[i*2],pc=pct(i);return '<div class="guideFloorCard"><div class="guideFloorTop"><span>PISO '+(i+1)+'</span><span>'+pc.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</span></div><div class="guideTrack"><div class="guideFill" style="width:'+pc+'%"></div></div><div class="guideFloorMeta">'+fInt(h)+' de '+fInt(t)+' posiciones con CAN SUM &gt; 0</div></div>';}).join('')+'</div></div>'+
      '<div class="ambV42Rule"><b>Lectura única:</b> CAN SUM &gt; 0 = la tienda tiene el producto. Cuando CAN SUM = 0, CAN MIN &gt; 0 = solicitar a CENDIS. Un traslado abierto se muestra como En camino. Sin fila en Presencia Seus = Sin registro. Los totales se cuentan por <b>posición producto–guía–piso</b>, porque un mismo código puede pertenecer a varios ambientes.</div>'+
      '<div class="tbar"><div class="tsearch">🔎<input id="q-guias" placeholder="Buscar guía, producto o código…" oninput="state.guias.q=this.value;drawGuias()"></div><span class="chip filt" data-q="guias" data-f="all">Todas</span><span class="chip filt" data-q="guias" data-f="DORMITORIO">Dormitorio</span><span class="chip filt" data-q="guias" data-f="SOCIAL">Social</span><span class="chip filt" data-q="guias" data-f="incompletas">Incompletas</span><span class="chip filt" data-q="guias" data-f="cendis">Con CAN MIN</span><span class="chip filt" data-q="guias" data-f="nodata">Sin registro</span></div><div id="guias-tbl"></div><div class="foot"><span id="guias-cnt"></span><span>Presiona cualquier guía para desplegar Piso 1, Piso 2 y Piso 3.</span></div></div></div>'+
      '<div class="card"><div class="chead"><div class="cnum n3">⇄</div><div><div class="tt">Traslados en camino</div><div class="ds">Movimientos pendientes relacionados por código de producto</div></div><div class="rt"><span class="badge cool">'+fInt(k.trN)+' líneas</span></div></div><div class="cbody"><div class="mkpis"><div class="mk a"><div class="l">Líneas / entregas</div><div class="v">'+fInt(k.trN)+'</div></div><div class="mk a"><div class="l">Unidades</div><div class="v">'+fInt(k.trU)+'</div></div><div class="mk a"><div class="l">Volumen m³</div><div class="v">'+fInt(k.trVol)+'</div></div><div class="mk r"><div class="l">Pend. picking</div><div class="v">'+fInt(k.trPick)+'</div></div><div class="mk r"><div class="l">Pend. movimiento</div><div class="v">'+fInt(k.trMov)+'</div></div><div class="mk b"><div class="l">Fecha a revisar</div><div class="v">'+fInt(k.trRev)+'</div></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-tr" placeholder="Buscar material o código…" oninput="state.tr.q=this.value;drawTr()"></div><span class="chip filt" data-q="tr" data-f="all">Todos</span><span class="chip filt" data-q="tr" data-f="pick">Pend. picking</span><span class="chip filt" data-q="tr" data-f="mov">Pend. movimiento</span><span class="chip filt" data-q="tr" data-f="rev">Fecha a revisar</span></div><div id="tr-tbl"></div><div class="foot"><span id="tr-cnt"></span><span>La imagen se cruza con el código del producto.</span></div></div></div>';
  };
  function guideRow42(p){
    var c=p[0],has=toNum(p[2])>0,record=!!p[7];return '<tr class="guideProductRow" tabindex="0" role="button" data-product-code="'+esc(c)+'"><td>'+imageThumb(c,'sm')+'</td><td><span class="code">'+esc(c)+'</span></td><td><div class="guideProductName">'+esc(p[6]||(P[c]&&P[c].n)||'—')+'</div><div class="pageInteractiveHint">'+esc(P[c]&&P[c].cat||'')+((P[c]&&P[c].lin)?' · '+esc(P[c].lin):'')+'</div>'+(!record?'<div class="guideDataMissing">No aparece para esta bodega en Presencia Seus</div>':'')+'</td><td class="num"><b style="color:'+(has?'var(--ok)':'var(--bad)')+'">'+fInt(p[2])+'</b></td><td class="num">'+(record?fInt(p[3]):'—')+'</td><td class="num">'+dispo42(p)+'</td><td>'+guideStatus42(p[5],p[8])+'</td></tr>';
  }
  window.drawGuias=function(){
    var st=S[CUR]||{},s=state.guias;if(!st.guias)buildStore42(CUR);if(!s.exp)s.exp={};var rows=(st.guias||[]).map(function(g){return {code:g[0],name:g[1],cat:g[2],tot:g[3],pres:g[4],pp:g[5],prods:g[6]||[],noData:g[7],comp:g[3]?Math.round(1000*g[4]/g[3])/10:0,nCendis:(g[6]||[]).filter(function(p){return p[5]==='cendis';}).length,nSin:(g[6]||[]).filter(function(p){return p[5]==='sin';}).length,nCamino:(g[6]||[]).filter(function(p){return p[5]==='camino';}).length,nNd:(g[6]||[]).filter(function(p){return p[5]==='nd';}).length};});
    if(s.f==='DORMITORIO'||s.f==='SOCIAL')rows=rows.filter(function(r){return r.cat===s.f;});else if(s.f==='incompletas')rows=rows.filter(function(r){return r.comp<100;});else if(s.f==='completas')rows=rows.filter(function(r){return r.comp>=100;});else if(s.f==='cendis')rows=rows.filter(function(r){return r.nCendis>0;});else if(s.f==='sincendis')rows=rows.filter(function(r){return r.nSin>0;});else if(s.f==='nodata')rows=rows.filter(function(r){return r.nNd>0;});
    if(s.q){var q=String(s.q).toLowerCase();rows=rows.filter(function(r){return (r.name+' '+r.code+' '+r.cat).toLowerCase().indexOf(q)>=0||r.prods.some(function(p){return (p[0]+' '+p[6]).toLowerCase().indexOf(q)>=0;});});}
    rows.sort(function(a,b){if(s.sort==='name')return a.name.localeCompare(b.name)*s.dir;if(s.sort==='cat')return a.cat.localeCompare(b.cat)*s.dir;if(s.sort==='falt')return ((a.tot-a.pres)-(b.tot-b.pres))*s.dir;if(s.sort==='cendis')return (a.nCendis-b.nCendis)*s.dir;return (a.comp-b.comp)*s.dir||((b.tot-b.pres)-(a.tot-a.pres));});
    document.querySelectorAll('.chip.filt[data-q="guias"]').forEach(function(ch){ch.classList.toggle('on',s.f===ch.dataset.f);ch.onclick=function(){s.f=ch.dataset.f;drawGuias();};});
    function fp(r,i){var t=toNum(r.pp[i*2+1]),h=toNum(r.pp[i*2]);return t?Math.round(1000*h/t)/10:0;}
    var html='<div class="guideV42Head"><span>Guía</span><span>Categoría</span><span>Completitud</span><span>P1</span><span>P2</span><span>P3</span><span>Faltan</span><span>CAN MIN</span></div><div class="guideAccordionList">';
    rows.forEach(function(r){
      var color=r.comp>=100?'var(--ok)':r.comp>=50?'var(--amb)':'var(--rot)',groups={'1':[],'2':[],'3':[]};r.prods.forEach(function(p){groups[/^[123]$/.test(String(p[1]))?String(p[1]):'3'].push(p);});
      var order={ok:0,camino:1,cendis:2,sin:3,nd:4},sections='';['1','2','3'].forEach(function(pi){var arr=groups[pi].slice().sort(function(a,b){return (order[a[5]]-order[b[5]])||String(a[6]).localeCompare(String(b[6]));}),ex=arr.filter(function(p){return p[5]==='ok';}).length;sections+='<div class="guideFloorSection"><div class="guideFloorHead"><span>PISO '+pi+'</span><span>'+arr.length+' posiciones · '+ex+' con existencia · '+Math.max(0,arr.length-ex)+' faltantes</span></div><div class="guideDetailWrap"><table class="guideDetailTable guideDetailTableV42"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th class="num">CAN SUM</th><th class="num">CAN MIN</th><th class="num">Dispo CENDIS</th><th>Estado</th></tr></thead><tbody>'+(arr.length?arr.map(guideRow42).join(''):'<tr><td colspan="7"><div class="guideFloorEmptyV42">Esta guía no tiene productos definidos en el Piso '+pi+'.</div></td></tr>')+'</tbody></table></div></div>';});
      function pill(t,n,cls){return '<span class="guideV42Pill '+cls+'">'+t+': '+fInt(n)+'</span>';}
      html+='<details class="guideAccordion" data-guide-code="'+esc(r.code)+'" '+(s.exp[r.code]?'open':'')+' ontoggle="rememberGuideOpenV42(this)"><summary class="guideAccordionSummary"><div class="guideSummaryName"><span class="guideSummaryArrow">›</span><div><div class="guideSummaryTitle">'+esc(r.name)+'</div><div class="guideSummaryCode">'+esc(r.code)+'</div></div></div><div><span class="tag '+(r.cat==='DORMITORIO'?'cr':'a')+'">'+esc(r.cat)+'</span></div><div class="guideSummaryComp"><div class="guideSummaryTrack"><div class="guideSummaryFill" style="width:'+r.comp+'%;background:'+color+'"></div></div><b>'+r.comp.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</b></div>'+[0,1,2].map(function(i){var p=fp(r,i);return '<div class="guideSummaryMetric"><b>'+p.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</b></div>';}).join('')+'<div class="guideSummaryMetric"><b style="color:'+(r.tot-r.pres?'var(--bad)':'var(--ok)')+'">'+fInt(r.tot-r.pres)+'</b></div><div class="guideSummaryMetric"><b style="color:var(--amb)">'+fInt(r.nCendis)+'</b></div></summary><div class="guideAccordionBody"><div class="guideV42Pills">'+pill('Con existencia',r.pres,'gs-ok')+pill('Faltantes',r.tot-r.pres,'gs-sin')+pill('Con CAN MIN',r.nCendis,'gs-cendis')+pill('En camino',r.nCamino,'gs-camino')+pill('Sin dispo CENDIS',r.nSin,'gs-sin')+pill('Sin registro',r.nNd,'gs-nd')+'</div><div class="guideV42Label">DETALLE DEL AMBIENTE POR PISO</div>'+sections+'</div></details>';
    });
    html+=(rows.length?'':'<div class="empty">No hay guías para este filtro.</div>')+'</div>';
    var el=document.getElementById('guias-tbl');if(el)el.innerHTML=html;var cnt=document.getElementById('guias-cnt');if(cnt)cnt.textContent='Mostrando '+rows.length+' de '+((st.guias||[]).length)+' guías · '+fInt((st.amb||{}).reqTotal)+' posiciones de guía';
    document.querySelectorAll('#guias-tbl .guideProductRow').forEach(function(tr){var open=function(e){if(e){e.preventDefault();e.stopPropagation();}openGuideProduct(tr.dataset.productCode);};tr.onclick=open;tr.onkeydown=function(e){if(e.key==='Enter'){open(e);}};});
  };
  // JSON and Excel loaders already call llaveroRebuildAllGuideData; only initialize the embedded cut here.
  setTimeout(function(){window.llaveroRebuildAllGuideData();if(VIEW==='amb')refresh();},0);
})();


/* ===== llavero-v43-ambientes-semantica-correcta-script ===== */
(function(){
  function gc43(v){var s=String(v==null?'':v).trim();if(/^J\d+$/.test(s))s=s.slice(1);if(/^\d+\.0$/.test(s))s=s.slice(0,-2);return s;}
  function mapBod43(sc){return String(DB&&DB.meta&&DB.meta.mapeoBodegasInventario&&DB.meta.mapeoBodegasInventario[sc]||sc);}
  function transferMap43(st){var out={};(st&&st.tr||[]).forEach(function(r){var c=gc43(r&&r[0]),u=toNum(r&&r[2]),open=String(r&&r[6]||'').toUpperCase()==='A'||String(r&&r[7]||'').toUpperCase()==='A';if(c&&u>0&&open)out[c]=(out[c]||0)+u;});return out;}
  function status43(p){
    var cs=toNum(p[2]),cm=toNum(p[3]),disp=toNum(p[4]),st=p[5],tu=toNum(p[8]);
    var txt='Sin registro en Presencia',cls='gs-nd';
    if(st==='ok'){txt='Con existencia en tienda';cls='gs-ok';}
    else if(st==='ok_requested'){txt='Con existencia · '+fInt(cm)+' u solicitadas';cls='gs-ok';}
    else if(st==='camino'){txt='En camino'+(tu?' · '+fInt(tu)+' u':'');cls='gs-camino';}
    else if(st==='requested'){txt=fInt(cm)+' u solicitadas a CENDIS';cls='gs-requested';}
    else if(st==='requested_nostock'){txt=fInt(cm)+' u solicitadas · sin disponibilidad actual';cls='gs-requested-no';}
    else if(st==='available'){txt='Solicitar para completar la guía';cls='gs-available';}
    else if(st==='sin'){txt='Sin existencia ni disponibilidad CENDIS';cls='gs-sin';}
    return '<span class="guideStatus '+cls+'">'+txt+'</span>';
  }
  function dispo43(p){
    if(!p[9])return '<span class="guideStatus guideDispoNd">Sin dato</span>';
    var q=toNum(p[4]);
    return q>0?'<span class="guideStatus guideDispoYes">Sí · '+fInt(q)+' u</span>':'<span class="guideStatus guideDispoNo">No · 0 u</span>';
  }
  function buildStore43(sc){
    var st=S[sc];if(!st)return;var bod=mapBod43(sc),presence=DB.GP&&DB.GP[bod]||{},transfers=transferMap43(st),allUnique={},missingUnique={};
    var agg={nG:0,gCompletas:0,gIncompletas:0,compTotalPct:0,reqTotal:0,haveTotal:0,faltTot:0,faltRequested:0,faltRequestedNoStock:0,faltAvailable:0,faltSin:0,faltCamino:0,noRastr:0,uniqueRequired:0,uniqueMissing:0};
    st.guias=(DB.G||[]).map(function(g){
      var total=0,have=0,noData=0,pp=[0,0,0,0,0,0],floor1=false;
      var prods=(g[3]||[]).map(function(pd){
        var c=gc43(pd[0]),floor=/^[123]$/.test(String(pd[1]))?String(pd[1]):'3',pi=Number(floor)-1,rec=presence[c],hasRecord=Array.isArray(rec),cs=hasRecord?toNum(rec[0]):0,cm=hasRecord?toNum(rec[1]):0,tu=toNum(transfers[c]);
        var hasDispData=!!(P[c]&&Object.prototype.hasOwnProperty.call(P[c],'dispCendis')),disp=hasDispData?toNum(P[c].dispCendis):0,status;
        total++;agg.reqTotal++;allUnique[c]=1;pp[pi*2+1]++;
        if(hasRecord&&cs>0){status=cm>0?'ok_requested':'ok';have++;agg.haveTotal++;pp[pi*2]++;if(floor==='1')floor1=true;}
        else{
          missingUnique[c]=1;
          if(!hasRecord){status='nd';noData++;agg.noRastr++;}
          else if(tu>0){status='camino';agg.faltCamino++;}
          else if(cm>0&&disp>0){status='requested';agg.faltRequested++;}
          else if(cm>0){status='requested_nostock';agg.faltRequested++;agg.faltRequestedNoStock++;}
          else if(disp>0){status='available';agg.faltAvailable++;}
          else{status='sin';agg.faltSin++;}
        }
        return [c,floor,cs,cm,disp,status,pd[2]||(P[c]&&P[c].n)||'',hasRecord?1:0,tu,hasDispData?1:0];
      });
      if(total&&have===total)agg.gCompletas++;
      return [g[0],g[1],g[2],total,have,pp,prods,noData,floor1?1:0];
    });
    agg.nG=st.guias.length;agg.gIncompletas=Math.max(0,agg.nG-agg.gCompletas);agg.faltTot=Math.max(0,agg.reqTotal-agg.haveTotal);agg.compTotalPct=agg.reqTotal?Math.round(1000*agg.haveTotal/agg.reqTotal)/10:0;agg.uniqueRequired=Object.keys(allUnique).length;agg.uniqueMissing=Object.keys(missingUnique).length;
    st.amb=agg;st.kpi=st.kpi||{};st.kpi.guiaComp=agg.compTotalPct;st.kpi.guiaFalt=agg.faltTot;st.kpi.guiaCompletas=agg.gCompletas;
  }
  window.llaveroRebuildAllGuideData=function(){Object.keys(S||{}).forEach(buildStore43);};
  function floorAgg43(st){var a=[0,0,0,0,0,0];(st.guias||[]).forEach(function(g){for(var i=0;i<6;i++)a[i]+=toNum(g[5]&&g[5][i]);});return a;}
  function kpi43(label,value,meta){return '<div class="ambV42Kpi"><div class="akLabel">'+label+'</div><div class="akValue">'+value+'</div><div class="akMeta">'+meta+'</div></div>';}
  function mg43(label,value,meta){return '<div class="guideV43ManageCard"><div class="gmLabel">'+label+'</div><div class="gmValue">'+fInt(value)+'</div><div class="gmMeta">'+meta+'</div></div>';}
  window.viewAmb=function(st){
    if(!st.guias)buildStore43(CUR);var k=st.kpi||{},a=st.amb||{},pa=floorAgg43(st),pct=function(i){return pa[i*2+1]?Math.round(1000*pa[i*2]/pa[i*2+1])/10:0;};
    setTimeout(function(){if(VIEW==='amb'){drawGuias();drawTr();}},0);
    return '<div class="card"><div class="chead"><div class="cnum n3">▦</div><div><div class="tt">Guías de exhibición</div><div class="ds">Cumplimiento calculado exclusivamente con existencia real: CAN SUM &gt; 0</div></div><div class="rt"><span class="badge cool">'+toNum(a.compTotalPct).toLocaleString('es-CO',{maximumFractionDigits:1})+'% completitud</span></div></div><div class="cbody">'+
      '<div class="ambV42Intro">'+kpi43('Completitud total',toNum(a.compTotalPct).toLocaleString('es-CO',{maximumFractionDigits:1})+'%',fInt(a.haveTotal)+' de '+fInt(a.reqTotal)+' posiciones con CAN SUM mayor que 0')+kpi43('Guías completas',fInt(a.gCompletas)+' / '+fInt(a.nG),'Una guía cumple solo cuando todos sus productos tienen existencia')+kpi43('Posiciones faltantes',fInt(a.faltTot),fInt(a.reqTotal)+' requeridas menos '+fInt(a.haveTotal)+' con existencia')+kpi43('Códigos únicos faltantes',fInt(a.uniqueMissing),fInt(a.uniqueRequired)+' referencias diferentes exigidas por las guías')+'</div>'+
      '<div><div class="legend" style="margin-bottom:7px"><b>Gestión de los productos faltantes</b><span>Estos datos explican la acción, pero no cambian el cumplimiento.</span></div><div class="guideV43Manage">'+mg43('En traslado',a.faltCamino,'Ya vienen en un movimiento abierto')+mg43('Solicitud realizada',a.faltRequested,'CAN MIN mayor que 0')+mg43('Disponibles para solicitar',a.faltAvailable,'CAN MIN 0 y disponibilidad CENDIS mayor que 0')+mg43('Sin disponibilidad',a.faltSin,'CAN MIN 0 y CENDIS en 0')+mg43('Sin registro',a.noRastr,'No tienen cruce en Presencia Seus')+'</div></div>'+
      '<div class="ambV42Quality '+(a.noRastr?'':'good')+'"><span>ⓘ</span><div><b>Calidad del cruce:</b> '+(a.noRastr?fInt(a.noRastr)+' posiciones no tienen CAN SUM ni CAN MIN para esta bodega. Se consideran faltantes hasta corregir el cruce, pero la disponibilidad CENDIS se consulta de manera independiente.':'todos los productos de las guías tienen registro en Presencia Seus.')+'</div></div>'+
      '<div><div class="legend" style="margin-bottom:7px"><b>Completitud por piso</b></div><div class="guideFloorGrid">'+[0,1,2].map(function(i){var t=pa[i*2+1],h=pa[i*2],pc=pct(i);return '<div class="guideFloorCard"><div class="guideFloorTop"><span>PISO '+(i+1)+'</span><span>'+pc.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</span></div><div class="guideTrack"><div class="guideFill" style="width:'+pc+'%"></div></div><div class="guideFloorMeta">'+fInt(h)+' de '+fInt(t)+' posiciones con CAN SUM &gt; 0</div></div>';}).join('')+'</div></div>'+
      '<div class="ambV42Rule"><b>Regla de cumplimiento:</b> una guía está completa únicamente cuando todos sus productos tienen <b>CAN SUM &gt; 0</b> en la tienda.<div class="guideV43RuleGrid"><div class="guideV43RuleItem"><b>CAN SUM</b>Existencia real en la tienda. Es el único dato usado para calcular la completitud.</div><div class="guideV43RuleItem"><b>CAN MIN</b>Cantidad que la tienda solicita a CENDIS. Sirve para seguimiento de la gestión, no para dar la guía por cumplida.</div><div class="guideV43RuleItem"><b>Disponibilidad CENDIS</b>Inventario real disponible en CENDIS. Es independiente de CAN MIN y permite saber si un faltante puede solicitarse.</div></div></div>'+
      '<div class="tbar"><div class="tsearch">🔎<input id="q-guias" placeholder="Buscar guía, producto o código…" oninput="state.guias.q=this.value;drawGuias()"></div><span class="chip filt" data-q="guias" data-f="all">Todas</span><span class="chip filt" data-q="guias" data-f="DORMITORIO">Dormitorio</span><span class="chip filt" data-q="guias" data-f="SOCIAL">Social</span><span class="chip filt" data-q="guias" data-f="incompletas">Incompletas</span><span class="chip filt" data-q="guias" data-f="requested">Solicitud realizada</span><span class="chip filt" data-q="guias" data-f="available">Por solicitar</span><span class="chip filt" data-q="guias" data-f="nodata">Sin registro</span></div><div id="guias-tbl"></div><div class="foot"><span id="guias-cnt"></span><span>Presiona cualquier guía para desplegar Piso 1, Piso 2 y Piso 3.</span></div></div></div>'+
      '<div class="card"><div class="chead"><div class="cnum n3">⇄</div><div><div class="tt">Traslados en camino</div><div class="ds">Movimientos pendientes relacionados por código de producto</div></div><div class="rt"><span class="badge cool">'+fInt(k.trN)+' líneas</span></div></div><div class="cbody"><div class="mkpis"><div class="mk a"><div class="l">Líneas / entregas</div><div class="v">'+fInt(k.trN)+'</div></div><div class="mk a"><div class="l">Unidades</div><div class="v">'+fInt(k.trU)+'</div></div><div class="mk a"><div class="l">Volumen m³</div><div class="v">'+fInt(k.trVol)+'</div></div><div class="mk r"><div class="l">Pend. picking</div><div class="v">'+fInt(k.trPick)+'</div></div><div class="mk r"><div class="l">Pend. movimiento</div><div class="v">'+fInt(k.trMov)+'</div></div><div class="mk b"><div class="l">Fecha a revisar</div><div class="v">'+fInt(k.trRev)+'</div></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-tr" placeholder="Buscar material o código…" oninput="state.tr.q=this.value;drawTr()"></div><span class="chip filt" data-q="tr" data-f="all">Todos</span><span class="chip filt" data-q="tr" data-f="pick">Pend. picking</span><span class="chip filt" data-q="tr" data-f="mov">Pend. movimiento</span><span class="chip filt" data-q="tr" data-f="rev">Fecha a revisar</span></div><div id="tr-tbl"></div><div class="foot"><span id="tr-cnt"></span><span>La imagen se cruza con el código del producto.</span></div></div></div>';
  };
  function row43(p){
    var c=p[0],has=!!p[7]&&toNum(p[2])>0,record=!!p[7];
    return '<tr class="guideProductRow" tabindex="0" role="button" data-product-code="'+esc(c)+'"><td>'+imageThumb(c,'sm')+'</td><td><span class="code">'+esc(c)+'</span></td><td><div class="guideProductName">'+esc(p[6]||(P[c]&&P[c].n)||'—')+'</div><div class="pageInteractiveHint">'+esc(P[c]&&P[c].cat||'')+((P[c]&&P[c].lin)?' · '+esc(P[c].lin):'')+'</div>'+(!record?'<div class="guideDataMissing">No aparece para esta bodega en Presencia Seus</div>':'')+'</td><td class="num"><b style="color:'+(has?'var(--ok)':'var(--bad)')+'">'+(record?fInt(p[2]):'—')+'</b></td><td class="num">'+(record?fInt(p[3]):'—')+'</td><td class="num">'+dispo43(p)+'</td><td>'+status43(p)+'</td></tr>';
  }
  window.drawGuias=function(){
    var st=S[CUR]||{},s=state.guias;if(!st.guias)buildStore43(CUR);if(!s.exp)s.exp={};
    var rows=(st.guias||[]).map(function(g){var pr=g[6]||[];return {code:g[0],name:g[1],cat:g[2],tot:g[3],pres:g[4],pp:g[5],prods:pr,noData:g[7],comp:g[3]?Math.round(1000*g[4]/g[3])/10:0,nRequested:pr.filter(function(p){return p[5]==='requested'||p[5]==='requested_nostock';}).length,nAvailable:pr.filter(function(p){return p[5]==='available';}).length,nSin:pr.filter(function(p){return p[5]==='sin';}).length,nCamino:pr.filter(function(p){return p[5]==='camino';}).length,nNd:pr.filter(function(p){return p[5]==='nd';}).length};});
    if(s.f==='DORMITORIO'||s.f==='SOCIAL')rows=rows.filter(function(r){return r.cat===s.f;});else if(s.f==='incompletas')rows=rows.filter(function(r){return r.comp<100;});else if(s.f==='completas')rows=rows.filter(function(r){return r.comp>=100;});else if(s.f==='requested')rows=rows.filter(function(r){return r.nRequested>0;});else if(s.f==='available')rows=rows.filter(function(r){return r.nAvailable>0;});else if(s.f==='sincendis')rows=rows.filter(function(r){return r.nSin>0;});else if(s.f==='nodata')rows=rows.filter(function(r){return r.nNd>0;});
    if(s.q){var q=String(s.q).toLowerCase();rows=rows.filter(function(r){return (r.name+' '+r.code+' '+r.cat).toLowerCase().indexOf(q)>=0||r.prods.some(function(p){return (p[0]+' '+p[6]).toLowerCase().indexOf(q)>=0;});});}
    rows.sort(function(a,b){if(s.sort==='name')return a.name.localeCompare(b.name)*s.dir;if(s.sort==='cat')return a.cat.localeCompare(b.cat)*s.dir;if(s.sort==='falt')return ((a.tot-a.pres)-(b.tot-b.pres))*s.dir;if(s.sort==='cendis')return ((a.nRequested+a.nAvailable)-(b.nRequested+b.nAvailable))*s.dir;return (a.comp-b.comp)*s.dir||((b.tot-b.pres)-(a.tot-a.pres));});
    document.querySelectorAll('.chip.filt[data-q="guias"]').forEach(function(ch){ch.classList.toggle('on',s.f===ch.dataset.f);ch.onclick=function(){s.f=ch.dataset.f;drawGuias();};});
    function fp(r,i){var t=toNum(r.pp[i*2+1]),h=toNum(r.pp[i*2]);return t?Math.round(1000*h/t)/10:0;}
    var html='<div class="guideV42Head"><span>Guía</span><span>Categoría</span><span>Completitud</span><span>P1</span><span>P2</span><span>P3</span><span>Faltan</span><span>Gestión CENDIS</span></div><div class="guideAccordionList">';
    rows.forEach(function(r){
      var color=r.comp>=100?'var(--ok)':r.comp>=50?'var(--amb)':'var(--rot)',groups={'1':[],'2':[],'3':[]};r.prods.forEach(function(p){groups[/^[123]$/.test(String(p[1]))?String(p[1]):'3'].push(p);});
      var order={ok:0,ok_requested:1,camino:2,requested:3,available:4,requested_nostock:5,sin:6,nd:7},sections='';
      ['1','2','3'].forEach(function(pi){var arr=groups[pi].slice().sort(function(a,b){return (order[a[5]]-order[b[5]])||String(a[6]).localeCompare(String(b[6]));}),ex=arr.filter(function(p){return p[5]==='ok'||p[5]==='ok_requested';}).length;sections+='<div class="guideFloorSection"><div class="guideFloorHead"><span>PISO '+pi+'</span><span>'+arr.length+' productos · '+ex+' con CAN SUM &gt; 0 · '+Math.max(0,arr.length-ex)+' faltantes</span></div><div class="guideDetailWrap"><table class="guideDetailTable guideDetailTableV42"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th class="num">CAN SUM</th><th class="num">CAN MIN</th><th class="num">Dispo CENDIS</th><th>Estado</th></tr></thead><tbody>'+(arr.length?arr.map(row43).join(''):'<tr><td colspan="7"><div class="guideFloorEmptyV42">Esta guía no tiene productos definidos en el Piso '+pi+'.</div></td></tr>')+'</tbody></table></div></div>';});
      function pill(t,n,cls){return '<span class="guideV42Pill '+cls+'">'+t+': '+fInt(n)+'</span>';}
      html+='<details class="guideAccordion" data-guide-code="'+esc(r.code)+'" '+(s.exp[r.code]?'open':'')+' ontoggle="rememberGuideOpenV42(this)"><summary class="guideAccordionSummary"><div class="guideSummaryName"><span class="guideSummaryArrow">›</span><div><div class="guideSummaryTitle">'+esc(r.name)+'</div><div class="guideSummaryCode">'+esc(r.code)+'</div></div></div><div><span class="tag '+(r.cat==='DORMITORIO'?'cr':'a')+'">'+esc(r.cat)+'</span></div><div class="guideSummaryComp"><div class="guideSummaryTrack"><div class="guideSummaryFill" style="width:'+r.comp+'%;background:'+color+'"></div></div><b>'+r.comp.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</b></div>'+[0,1,2].map(function(i){var p=fp(r,i);return '<div class="guideSummaryMetric"><b>'+p.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</b></div>';}).join('')+'<div class="guideSummaryMetric"><b style="color:'+(r.tot-r.pres?'var(--bad)':'var(--ok)')+'">'+fInt(r.tot-r.pres)+'</b></div><div class="guideSummaryManage"><b>'+fInt(r.nRequested)+' solicitados</b><br>'+fInt(r.nAvailable)+' por solicitar</div></summary><div class="guideAccordionBody"><div class="guideV42Pills">'+pill('Con existencia',r.pres,'gs-ok')+pill('Faltantes',r.tot-r.pres,'gs-sin')+pill('En traslado',r.nCamino,'gs-camino')+pill('Solicitud realizada',r.nRequested,'gs-requested')+pill('Disponible para solicitar',r.nAvailable,'gs-available')+pill('Sin disponibilidad',r.nSin,'gs-sin')+pill('Sin registro',r.nNd,'gs-nd')+'</div><div class="guideV42Label">DETALLE DEL AMBIENTE POR PISO</div>'+sections+'</div></details>';
    });
    html+=(rows.length?'':'<div class="empty">No hay guías para este filtro.</div>')+'</div>';
    var el=document.getElementById('guias-tbl');if(el)el.innerHTML=html;var cnt=document.getElementById('guias-cnt');if(cnt)cnt.textContent='Mostrando '+rows.length+' de '+((st.guias||[]).length)+' guías · '+fInt((st.amb||{}).reqTotal)+' posiciones evaluadas únicamente con CAN SUM';
    document.querySelectorAll('#guias-tbl .guideProductRow').forEach(function(tr){var open=function(e){if(e){e.preventDefault();e.stopPropagation();}openGuideProduct(tr.dataset.productCode);};tr.onclick=open;tr.onkeydown=function(e){if(e.key==='Enter'){open(e);}};});
  };
  DB.meta=DB.meta||{};DB.meta.reglas=DB.meta.reglas||{};
  DB.meta.reglas.ambientes='CAN SUM es la existencia real en tienda y es el unico dato usado para calcular el cumplimiento. CAN MIN es la cantidad solicitada a CENDIS. La disponibilidad CENDIS proviene del abastecimiento SAP y es independiente de CAN MIN.';
  DB.meta.moduloAmbientes=Object.assign({},DB.meta.moduloAmbientes||{},{version:'v43',reglaCumplimiento:'Una guia cumple solo si todos sus productos tienen CAN SUM > 0',reglaSolicitud:'CAN MIN representa la cantidad solicitada a CENDIS y no modifica el porcentaje de cumplimiento',reglaDisponibilidad:'P[codigo].dispCendis representa disponibilidad real en CENDIS y es independiente de CAN MIN',estados:['Con existencia','En traslado','Solicitud realizada','Disponible para solicitar','Sin disponibilidad','Sin registro']});
  DB.meta.cargaUnica=false;DB.meta.cargaAlternativaExcel=true;DB.meta.descripcionCarga='Llavero acepta un JSON consolidado como ruta recomendada y, alternativamente, cargas individuales de los archivos Excel fuente.';
  window.llaveroRebuildAllGuideData();
  setTimeout(function(){if(VIEW==='amb')refresh();},0);
})();


/* ===== llavero-v44-ambientes-pisos12-script ===== */
(function(){
  function gc44(v){var s=String(v==null?'':v).trim();if(/^J\d+$/.test(s))s=s.slice(1);if(/^\d+\.0$/.test(s))s=s.slice(0,-2);return s;}
  function mapBod44(sc){return String(DB&&DB.meta&&DB.meta.mapeoBodegasInventario&&DB.meta.mapeoBodegasInventario[sc]||sc);}
  function transferMap44(st){var out={};(st&&st.tr||[]).forEach(function(r){var c=gc44(r&&r[0]),u=toNum(r&&r[2]),open=String(r&&r[6]||'').toUpperCase()==='A'||String(r&&r[7]||'').toUpperCase()==='A';if(c&&u>0&&open)out[c]=(out[c]||0)+u;});return out;}
  function isEvaluatedFloor44(floor){return floor==='1'||floor==='2';}
  function status44(p){
    var cm=toNum(p[3]),st=p[5],tu=toNum(p[8]),info=!p[10];
    var txt='Sin registro en Presencia',cls='gs-nd';
    if(st==='ok'){txt='Con existencia en tienda';cls='gs-ok';}
    else if(st==='ok_requested'){txt='Con existencia · '+fInt(cm)+' u solicitadas';cls='gs-ok';}
    else if(st==='camino'){txt='En camino'+(tu?' · '+fInt(tu)+' u':'');cls='gs-camino';}
    else if(st==='requested'){txt=fInt(cm)+' u solicitadas a CENDIS';cls='gs-requested';}
    else if(st==='requested_nostock'){txt=fInt(cm)+' u solicitadas · sin disponibilidad actual';cls='gs-requested-no';}
    else if(st==='available'){txt='Solicitar para completar la guía';cls='gs-available';}
    else if(st==='sin'){txt='Sin existencia ni disponibilidad CENDIS';cls='gs-sin';}
    if(info)txt+=' · Piso 3 informativo';
    return '<span class="guideStatus '+cls+'">'+txt+'</span>';
  }
  function dispo44(p){
    if(!p[9])return '<span class="guideStatus guideDispoNd">Sin dato</span>';
    var q=toNum(p[4]);
    return q>0?'<span class="guideStatus guideDispoYes">Sí · '+fInt(q)+' u</span>':'<span class="guideStatus guideDispoNo">No · 0 u</span>';
  }
  function buildStore44(sc){
    var st=S[sc];if(!st)return;
    var bod=mapBod44(sc),presence=DB.GP&&DB.GP[bod]||{},transfers=transferMap44(st),allUnique={},missingUnique={};
    var agg={nG:0,gCompletas:0,gIncompletas:0,gSinEvaluacion:0,compTotalPct:0,reqTotal:0,haveTotal:0,faltTot:0,faltRequested:0,faltRequestedNoStock:0,faltAvailable:0,faltSin:0,faltCamino:0,noRastr:0,uniqueRequired:0,uniqueMissing:0,p3Total:0,p3Have:0};
    st.guias=(DB.G||[]).map(function(g){
      var totalEval=0,haveEval=0,noDataEval=0,pp=[0,0,0,0,0,0],totalAll=0,haveAll=0;
      var prods=(g[3]||[]).map(function(pd){
        var c=gc44(pd[0]),floor=/^[123]$/.test(String(pd[1]))?String(pd[1]):'3',pi=Number(floor)-1,evaluated=isEvaluatedFloor44(floor);
        var rec=presence[c],hasRecord=Array.isArray(rec),cs=hasRecord?toNum(rec[0]):0,cm=hasRecord?toNum(rec[1]):0,tu=toNum(transfers[c]);
        var hasDispData=!!(P[c]&&Object.prototype.hasOwnProperty.call(P[c],'dispCendis')),disp=hasDispData?toNum(P[c].dispCendis):0,status;
        totalAll++;pp[pi*2+1]++;
        if(hasRecord&&cs>0){status=cm>0?'ok_requested':'ok';haveAll++;pp[pi*2]++;}
        else if(!hasRecord){status='nd';}
        else if(tu>0){status='camino';}
        else if(cm>0&&disp>0){status='requested';}
        else if(cm>0){status='requested_nostock';}
        else if(disp>0){status='available';}
        else{status='sin';}
        if(evaluated){
          totalEval++;agg.reqTotal++;allUnique[c]=1;
          if(hasRecord&&cs>0){haveEval++;agg.haveTotal++;}
          else{
            missingUnique[c]=1;
            if(!hasRecord){noDataEval++;agg.noRastr++;}
            else if(tu>0){agg.faltCamino++;}
            else if(cm>0&&disp>0){agg.faltRequested++;}
            else if(cm>0){agg.faltRequested++;agg.faltRequestedNoStock++;}
            else if(disp>0){agg.faltAvailable++;}
            else{agg.faltSin++;}
          }
        }else{
          agg.p3Total++;
          if(hasRecord&&cs>0)agg.p3Have++;
        }
        return [c,floor,cs,cm,disp,status,pd[2]||(P[c]&&P[c].n)||'',hasRecord?1:0,tu,hasDispData?1:0,evaluated?1:0];
      });
      if(totalEval>0&&haveEval===totalEval)agg.gCompletas++;
      else if(totalEval>0)agg.gIncompletas++;
      else agg.gSinEvaluacion++;
      return [g[0],g[1],g[2],totalEval,haveEval,pp,prods,noDataEval,0,totalAll,haveAll];
    });
    agg.nG=st.guias.length;
    agg.faltTot=Math.max(0,agg.reqTotal-agg.haveTotal);
    agg.compTotalPct=agg.reqTotal?Math.round(1000*agg.haveTotal/agg.reqTotal)/10:0;
    agg.uniqueRequired=Object.keys(allUnique).length;
    agg.uniqueMissing=Object.keys(missingUnique).length;
    st.amb=agg;st.kpi=st.kpi||{};st.kpi.guiaComp=agg.compTotalPct;st.kpi.guiaFalt=agg.faltTot;st.kpi.guiaCompletas=agg.gCompletas;
  }
  window.llaveroRebuildAllGuideData=function(){Object.keys(S||{}).forEach(buildStore44);};
  function floorAgg44(st){var a=[0,0,0,0,0,0];(st.guias||[]).forEach(function(g){for(var i=0;i<6;i++)a[i]+=toNum(g[5]&&g[5][i]);});return a;}
  function kpi44(label,value,meta){return '<div class="ambV42Kpi"><div class="akLabel">'+label+'</div><div class="akValue">'+value+'</div><div class="akMeta">'+meta+'</div></div>';}
  function mg44(label,value,meta){return '<div class="guideV43ManageCard"><div class="gmLabel">'+label+'</div><div class="gmValue">'+fInt(value)+'</div><div class="gmMeta">'+meta+'</div></div>';}
  window.viewAmb=function(st){
    if(!st.guias||!st.amb||st.amb.p3Total==null)buildStore44(CUR);
    var k=st.kpi||{},a=st.amb||{},pa=floorAgg44(st),pct=function(i){return pa[i*2+1]?Math.round(1000*pa[i*2]/pa[i*2+1])/10:0;};
    setTimeout(function(){if(VIEW==='amb'){drawGuias();drawTr();}},0);
    return '<div class="card"><div class="chead"><div class="cnum n3">▦</div><div><div class="tt">Guías de exhibición</div><div class="ds">Cumplimiento evaluado con existencia real de Piso 1 y Piso 2</div></div><div class="rt"><span class="badge cool">'+toNum(a.compTotalPct).toLocaleString('es-CO',{maximumFractionDigits:1})+'% completitud</span></div></div><div class="cbody">'+
      '<div class="ambEvalNotice"><span>ⓘ</span><div><b>Piso 3 es informativo.</b> Sus productos permanecen visibles en cada guía, pero no afectan el porcentaje, el estado de cumplimiento ni los indicadores de gestión.</div></div>'+
      '<div class="ambV42Intro">'+kpi44('Completitud total',toNum(a.compTotalPct).toLocaleString('es-CO',{maximumFractionDigits:1})+'%',fInt(a.haveTotal)+' de '+fInt(a.reqTotal)+' posiciones de Piso 1 y 2 con CAN SUM mayor que 0')+kpi44('Guías completas',fInt(a.gCompletas)+' / '+fInt(a.nG),'Cumplen cuando todos los productos de Piso 1 y 2 tienen existencia')+kpi44('Posiciones faltantes',fInt(a.faltTot),'Solo faltantes de Piso 1 y Piso 2')+kpi44('Códigos únicos faltantes',fInt(a.uniqueMissing),fInt(a.uniqueRequired)+' referencias evaluadas en Piso 1 y 2')+'</div>'+
      '<div><div class="legend" style="margin-bottom:7px"><b>Gestión de faltantes de Piso 1 y Piso 2</b><span>CAN MIN y disponibilidad CENDIS orientan la acción, pero no cambian el cumplimiento.</span></div><div class="guideV43Manage">'+mg44('En traslado',a.faltCamino,'Ya vienen en un movimiento abierto')+mg44('Solicitud realizada',a.faltRequested,'CAN MIN mayor que 0')+mg44('Disponibles para solicitar',a.faltAvailable,'CAN MIN 0 y disponibilidad CENDIS mayor que 0')+mg44('Sin disponibilidad',a.faltSin,'CAN MIN 0 y CENDIS en 0')+mg44('Sin registro',a.noRastr,'Sin cruce en Presencia Seus')+'</div></div>'+
      '<div class="ambV42Quality '+(a.noRastr?'':'good')+'"><span>ⓘ</span><div><b>Calidad del cruce:</b> '+(a.noRastr?fInt(a.noRastr)+' posiciones evaluables de Piso 1 y 2 no tienen CAN SUM ni CAN MIN para esta bodega.':'todos los productos evaluables de Piso 1 y 2 tienen registro en Presencia Seus.')+'</div></div>'+
      '<div><div class="legend" style="margin-bottom:7px"><b>Lectura por piso</b></div><div class="guideFloorGrid">'+[0,1].map(function(i){var t=pa[i*2+1],h=pa[i*2],pc=pct(i);return '<div class="guideFloorCard"><div class="guideFloorTop"><span>PISO '+(i+1)+'</span><span>'+pc.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</span></div><div class="guideTrack"><div class="guideFill" style="width:'+pc+'%"></div></div><div class="guideFloorMeta">'+fInt(h)+' de '+fInt(t)+' posiciones con CAN SUM &gt; 0</div></div>';}).join('')+'<div class="guideFloorCard guideFloorInfo"><div class="guideFloorTop"><span>PISO 3</span><span>Informativo</span></div><div class="guideTrack"><div class="guideFill" style="width:'+pct(2)+'%;background:var(--mut)"></div></div><div class="guideFloorMeta">'+fInt(pa[4])+' de '+fInt(pa[5])+' con existencia · no afecta cumplimiento</div></div></div></div>'+
      '<div class="ambV42Rule"><b>Regla de cumplimiento:</b> una guía está completa cuando todos los productos de <b>Piso 1 y Piso 2</b> tienen <b>CAN SUM &gt; 0</b>.<div class="guideV43RuleGrid"><div class="guideV43RuleItem"><b>CAN SUM</b>Existencia real en la tienda. Solo Piso 1 y Piso 2 se usan para el cumplimiento.</div><div class="guideV43RuleItem"><b>CAN MIN</b>Cantidad solicitada a CENDIS. Orienta la gestión y no modifica el porcentaje.</div><div class="guideV43RuleItem"><b>Piso 3</b>Complementos visibles como información de la guía, sin afectar la medición.</div></div></div>'+
      '<div class="tbar"><div class="tsearch">🔎<input id="q-guias" placeholder="Buscar guía, producto o código…" oninput="state.guias.q=this.value;drawGuias()"></div><span class="chip filt" data-q="guias" data-f="all">Todas</span><span class="chip filt" data-q="guias" data-f="DORMITORIO">Dormitorio</span><span class="chip filt" data-q="guias" data-f="SOCIAL">Social</span><span class="chip filt" data-q="guias" data-f="incompletas">Incompletas</span><span class="chip filt" data-q="guias" data-f="requested">Solicitud realizada</span><span class="chip filt" data-q="guias" data-f="available">Por solicitar</span><span class="chip filt" data-q="guias" data-f="nodata">Sin registro</span></div><div id="guias-tbl"></div><div class="foot"><span id="guias-cnt"></span><span>Presiona una guía para ver Piso 1, Piso 2 y Piso 3 informativo.</span></div></div></div>'+
      '<div class="card"><div class="chead"><div class="cnum n3">⇄</div><div><div class="tt">Traslados en camino</div><div class="ds">Movimientos pendientes relacionados por código de producto</div></div><div class="rt"><span class="badge cool">'+fInt(k.trN)+' líneas</span></div></div><div class="cbody"><div class="mkpis"><div class="mk a"><div class="l">Líneas / entregas</div><div class="v">'+fInt(k.trN)+'</div></div><div class="mk a"><div class="l">Unidades</div><div class="v">'+fInt(k.trU)+'</div></div><div class="mk a"><div class="l">Volumen m³</div><div class="v">'+fInt(k.trVol)+'</div></div><div class="mk r"><div class="l">Pend. picking</div><div class="v">'+fInt(k.trPick)+'</div></div><div class="mk r"><div class="l">Pend. movimiento</div><div class="v">'+fInt(k.trMov)+'</div></div><div class="mk b"><div class="l">Fecha a revisar</div><div class="v">'+fInt(k.trRev)+'</div></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-tr" placeholder="Buscar material o código…" oninput="state.tr.q=this.value;drawTr()"></div><span class="chip filt" data-q="tr" data-f="all">Todos</span><span class="chip filt" data-q="tr" data-f="pick">Pend. picking</span><span class="chip filt" data-q="tr" data-f="mov">Pend. movimiento</span><span class="chip filt" data-q="tr" data-f="rev">Fecha a revisar</span></div><div id="tr-tbl"></div><div class="foot"><span id="tr-cnt"></span><span>La imagen se cruza con el código del producto.</span></div></div></div>';
  };
  function row44(p){
    var c=p[0],has=!!p[7]&&toNum(p[2])>0,record=!!p[7];
    return '<tr class="guideProductRow" tabindex="0" role="button" data-product-code="'+esc(c)+'"><td>'+imageThumb(c,'sm')+'</td><td><span class="code">'+esc(c)+'</span></td><td><div class="guideProductName">'+esc(p[6]||(P[c]&&P[c].n)||'—')+'</div><div class="pageInteractiveHint">'+esc(P[c]&&P[c].cat||'')+((P[c]&&P[c].lin)?' · '+esc(P[c].lin):'')+'</div>'+(!record?'<div class="guideDataMissing">No aparece para esta bodega en Presencia Seus</div>':'')+(!p[10]?'<div class="guideFloorInfoBadge">Piso 3 · informativo</div>':'')+'</td><td class="num"><b style="color:'+(has?'var(--ok)':'var(--bad)')+'">'+(record?fInt(p[2]):'—')+'</b></td><td class="num">'+(record?fInt(p[3]):'—')+'</td><td class="num">'+dispo44(p)+'</td><td>'+status44(p)+'</td></tr>';
  }
  window.drawGuias=function(){
    var st=S[CUR]||{},s=state.guias;if(!st.guias||!st.amb||st.amb.p3Total==null)buildStore44(CUR);if(!s.exp)s.exp={};
    var rows=(st.guias||[]).map(function(g){var pr=g[6]||[];return {code:g[0],name:g[1],cat:g[2],tot:g[3],pres:g[4],pp:g[5],prods:pr,noData:g[7],totalAll:g[9],haveAll:g[10],comp:g[3]?Math.round(1000*g[4]/g[3])/10:0,nRequested:pr.filter(function(p){return p[10]&&(p[5]==='requested'||p[5]==='requested_nostock');}).length,nAvailable:pr.filter(function(p){return p[10]&&p[5]==='available';}).length,nSin:pr.filter(function(p){return p[10]&&p[5]==='sin';}).length,nCamino:pr.filter(function(p){return p[10]&&p[5]==='camino';}).length,nNd:pr.filter(function(p){return p[10]&&p[5]==='nd';}).length};});
    if(s.f==='DORMITORIO'||s.f==='SOCIAL')rows=rows.filter(function(r){return r.cat===s.f;});else if(s.f==='incompletas')rows=rows.filter(function(r){return r.comp<100;});else if(s.f==='completas')rows=rows.filter(function(r){return r.comp>=100;});else if(s.f==='requested')rows=rows.filter(function(r){return r.nRequested>0;});else if(s.f==='available')rows=rows.filter(function(r){return r.nAvailable>0;});else if(s.f==='sincendis')rows=rows.filter(function(r){return r.nSin>0;});else if(s.f==='nodata')rows=rows.filter(function(r){return r.nNd>0;});
    if(s.q){var q=String(s.q).toLowerCase();rows=rows.filter(function(r){return (r.name+' '+r.code+' '+r.cat).toLowerCase().indexOf(q)>=0||r.prods.some(function(p){return (p[0]+' '+p[6]).toLowerCase().indexOf(q)>=0;});});}
    rows.sort(function(a,b){if(s.sort==='name')return a.name.localeCompare(b.name)*s.dir;if(s.sort==='cat')return a.cat.localeCompare(b.cat)*s.dir;if(s.sort==='falt')return ((a.tot-a.pres)-(b.tot-b.pres))*s.dir;if(s.sort==='cendis')return ((a.nRequested+a.nAvailable)-(b.nRequested+b.nAvailable))*s.dir;return (a.comp-b.comp)*s.dir||((b.tot-b.pres)-(a.tot-a.pres));});
    document.querySelectorAll('.chip.filt[data-q="guias"]').forEach(function(ch){ch.classList.toggle('on',s.f===ch.dataset.f);ch.onclick=function(){s.f=ch.dataset.f;drawGuias();};});
    function fp(r,i){var t=toNum(r.pp[i*2+1]),h=toNum(r.pp[i*2]);return t?Math.round(1000*h/t)/10:0;}
    var html='<div class="guideV42Head"><span>Guía</span><span>Categoría</span><span>Cumplimiento P1+P2</span><span>P1</span><span>P2</span><span>P3 info</span><span>Faltan P1+P2</span><span>Gestión CENDIS</span></div><div class="guideAccordionList">';
    rows.forEach(function(r){
      var color=r.comp>=100?'var(--ok)':r.comp>=50?'var(--amb)':'var(--rot)',groups={'1':[],'2':[],'3':[]};r.prods.forEach(function(p){groups[/^[123]$/.test(String(p[1]))?String(p[1]):'3'].push(p);});
      var order={ok:0,ok_requested:1,camino:2,requested:3,available:4,requested_nostock:5,sin:6,nd:7},sections='';
      ['1','2','3'].forEach(function(pi){var arr=groups[pi].slice().sort(function(a,b){return (order[a[5]]-order[b[5]])||String(a[6]).localeCompare(String(b[6]));}),ex=arr.filter(function(p){return p[5]==='ok'||p[5]==='ok_requested';}).length,info=pi==='3';sections+='<div class="guideFloorSection '+(info?'guideFloorInfoSection':'')+'"><div class="guideFloorHead"><span>PISO '+pi+(info?' · INFORMATIVO':'')+'</span><span>'+arr.length+' productos · '+ex+' con CAN SUM &gt; 0 · '+Math.max(0,arr.length-ex)+' sin existencia'+(info?' · no afecta cumplimiento':'')+'</span></div><div class="guideDetailWrap"><table class="guideDetailTable guideDetailTableV42"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th class="num">CAN SUM</th><th class="num">CAN MIN</th><th class="num">Dispo CENDIS</th><th>Estado</th></tr></thead><tbody>'+(arr.length?arr.map(row44).join(''):'<tr><td colspan="7"><div class="guideFloorEmptyV42">Esta guía no tiene productos definidos en el Piso '+pi+'.</div></td></tr>')+'</tbody></table></div></div>';});
      function pill(t,n,cls){return '<span class="guideV42Pill '+cls+'">'+t+': '+fInt(n)+'</span>';}
      var p3t=toNum(r.pp[5]),p3h=toNum(r.pp[4]);
      html+='<details class="guideAccordion" data-guide-code="'+esc(r.code)+'" '+(s.exp[r.code]?'open':'')+' ontoggle="rememberGuideOpenV42(this)"><summary class="guideAccordionSummary"><div class="guideSummaryName"><span class="guideSummaryArrow">›</span><div><div class="guideSummaryTitle">'+esc(r.name)+'</div><div class="guideSummaryCode">'+esc(r.code)+'</div></div></div><div><span class="tag '+(r.cat==='DORMITORIO'?'cr':'a')+'">'+esc(r.cat)+'</span></div><div class="guideSummaryComp"><div class="guideSummaryTrack"><div class="guideSummaryFill" style="width:'+r.comp+'%;background:'+color+'"></div></div><b>'+r.comp.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</b></div>'+[0,1].map(function(i){var p=fp(r,i);return '<div class="guideSummaryMetric"><b>'+p.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</b></div>';}).join('')+'<div class="guideSummaryMetric"><b>'+fInt(p3h)+' / '+fInt(p3t)+'</b><span class="guideInfoSmall">informativo</span></div><div class="guideSummaryMetric"><b style="color:'+(r.tot-r.pres?'var(--bad)':'var(--ok)')+'">'+fInt(r.tot-r.pres)+'</b></div><div class="guideSummaryManage"><b>'+fInt(r.nRequested)+' solicitados</b><br>'+fInt(r.nAvailable)+' por solicitar</div></summary><div class="guideAccordionBody"><div class="guideV42Pills">'+pill('Con existencia P1+P2',r.pres,'gs-ok')+pill('Faltantes P1+P2',r.tot-r.pres,'gs-sin')+pill('En traslado',r.nCamino,'gs-camino')+pill('Solicitud realizada',r.nRequested,'gs-requested')+pill('Disponible para solicitar',r.nAvailable,'gs-available')+pill('Sin disponibilidad',r.nSin,'gs-sin')+pill('Sin registro',r.nNd,'gs-nd')+'</div><div class="guideV42Label">DETALLE DEL AMBIENTE POR PISO</div>'+sections+'</div></details>';
    });
    html+=(rows.length?'':'<div class="empty">No hay guías para este filtro.</div>')+'</div>';
    var el=document.getElementById('guias-tbl');if(el)el.innerHTML=html;
    var cnt=document.getElementById('guias-cnt');if(cnt)cnt.textContent='Mostrando '+rows.length+' de '+((st.guias||[]).length)+' guías · '+fInt((st.amb||{}).reqTotal)+' posiciones evaluadas en Piso 1 y Piso 2';
    document.querySelectorAll('#guias-tbl .guideProductRow').forEach(function(tr){var open=function(e){if(e){e.preventDefault();e.stopPropagation();}openGuideProduct(tr.dataset.productCode);};tr.onclick=open;tr.onkeydown=function(e){if(e.key==='Enter'){open(e);}};});
  };
  DB.meta=DB.meta||{};DB.meta.reglas=DB.meta.reglas||{};
  DB.meta.reglas.ambientes='El cumplimiento de cada guia se calcula solo con los productos de Piso 1 y Piso 2 cuyo CAN SUM sea mayor que 0. Piso 3 permanece visible como informacion complementaria y no afecta el porcentaje ni los indicadores. CAN MIN es la cantidad solicitada a CENDIS y la disponibilidad CENDIS es independiente.';
  DB.meta.moduloAmbientes=Object.assign({},DB.meta.moduloAmbientes||{},{version:'v44',pisosEvaluados:['1','2'],piso3:'Informativo; visible pero excluido del cumplimiento y de los indicadores de gestion',reglaCumplimiento:'Una guia cumple si todos los productos de Piso 1 y Piso 2 tienen CAN SUM > 0',reglaSolicitud:'CAN MIN representa la cantidad solicitada a CENDIS y no modifica el porcentaje',reglaDisponibilidad:'P[codigo].dispCendis representa disponibilidad real en CENDIS y es independiente de CAN MIN'});
  window.llaveroRebuildAllGuideData();
  setTimeout(function(){if(VIEW==='amb')refresh();},0);
})();


/* ===== llavero-v45-ambientes-fallback-inventario-script ===== */
(function(){
  if(!state.guias)state.guias={sort:'comp',dir:1,q:'',f:'all',exp:{}};
  function gc45(v){var s=String(v==null?'':v).trim();if(/^J\d+$/.test(s))s=s.slice(1);if(/^\d+\.0$/.test(s))s=s.slice(0,-2);return s;}
  function mapBod45(sc){return String(DB&&DB.meta&&DB.meta.mapeoBodegasInventario&&DB.meta.mapeoBodegasInventario[sc]||sc);}
  function isEval45(floor){return floor==='1'||floor==='2';}
  function transferMap45(st){var out={};(st&&st.tr||[]).forEach(function(r){var c=gc45(r&&r[0]),u=toNum(r&&r[2]),open=String(r&&r[6]||'').toUpperCase()==='A'||String(r&&r[7]||'').toUpperCase()==='A';if(c&&u>0&&open)out[c]=(out[c]||0)+u;});return out;}
  function invIndex45(st){
    if(st._guideInvIdx45)return st._guideInvIdx45;
    var idx={};
    (st&&st.inventario||[]).forEach(function(it){
      var code=gc45(it&&((it.codigo!=null&&it.codigo!=='')?it.codigo:it.codigoSap));
      if(!code)return;
      var prev=idx[code]||{stock:0,disp:null,obj:it};
      prev.stock+=toNum(it&&it.stock);
      if(prev.disp==null && it && Object.prototype.hasOwnProperty.call(it,'dispCendis')) prev.disp=toNum(it.dispCendis);
      prev.obj=prev.obj||it;
      idx[code]=prev;
    });
    st._guideInvIdx45=idx;
    return idx;
  }
  function productDisp45(code, invRec){
    if(P[code]&&Object.prototype.hasOwnProperty.call(P[code],'dispCendis')) return {has:1,val:toNum(P[code].dispCendis)};
    if(invRec && invRec.disp!=null) return {has:1,val:toNum(invRec.disp)};
    return {has:0,val:0};
  }
  function buildStore45(sc){
    var st=S[sc]; if(!st) return;
    var bod=mapBod45(sc), presence=DB.GP&&DB.GP[bod]||{}, transfers=transferMap45(st), invIdx=invIndex45(st);
    var allUnique={}, missingUnique={};
    var agg={nG:0,gCompletas:0,gIncompletas:0,gSinEvaluacion:0,compTotalPct:0,reqTotal:0,haveTotal:0,faltTot:0,faltRequested:0,faltAvailable:0,faltSin:0,faltCamino:0,noRastr:0,uniqueRequired:0,uniqueMissing:0,p3Total:0,p3Have:0,invCover:0};
    st.guias=(DB.G||[]).map(function(g){
      var totalEval=0,haveEval=0,noDataEval=0,pp=[0,0,0,0,0,0],totalAll=0,haveAll=0;
      var prods=(g[3]||[]).map(function(pd){
        var c=gc45(pd[0]), floor=/^[123]$/.test(String(pd[1]))?String(pd[1]):'3', pi=Number(floor)-1, evaluated=isEval45(floor);
        var rec=presence[c], hasRecord=Array.isArray(rec), cs=hasRecord?toNum(rec[0]):null, cm=hasRecord?toNum(rec[1]):null, tu=toNum(transfers[c]);
        var inv=invIdx[c], invStock=toNum(inv&&inv.stock), dispInfo=productDisp45(c,inv), disp=dispInfo.val, hasDispData=dispInfo.has;
        var hasStoreExist=(hasRecord&&toNum(cs)>0)||(!hasRecord&&invStock>0), status='sin';
        totalAll++; pp[pi*2+1]++;
        if(hasStoreExist){status=!hasRecord?'ok_inv':(toNum(cm)>0?'ok_requested':'ok'); haveAll++; pp[pi*2]++;}
        else if(tu>0){status='camino';}
        else if(hasRecord&&toNum(cm)>0&&disp>0){status='requested';}
        else if(hasRecord&&toNum(cm)>0){status='requested_nostock';}
        else if(disp>0){status='available';}
        else if(!hasRecord){status='nd';}
        else{status='sin';}
        if(evaluated){
          totalEval++; agg.reqTotal++; allUnique[c]=1;
          if(hasStoreExist){haveEval++; agg.haveTotal++; if(!hasRecord && invStock>0) agg.invCover++;}
          else {
            missingUnique[c]=1;
            if(!hasRecord){noDataEval++; agg.noRastr++;}
            if(status==='camino') agg.faltCamino++;
            else if(status==='requested'||status==='requested_nostock') agg.faltRequested++;
            else if(status==='available') agg.faltAvailable++;
            else if(status==='sin' || status==='nd') agg.faltSin++;
          }
        }else{
          agg.p3Total++;
          if(hasStoreExist) agg.p3Have++;
        }
        return [c,floor,(hasRecord?toNum(cs):null),(hasRecord?toNum(cm):null),disp,status,pd[2]||(P[c]&&P[c].n)||'',hasRecord?1:0,tu,hasDispData?1:0,evaluated?1:0,invStock,!hasRecord&&invStock>0?1:0];
      });
      if(totalEval>0&&haveEval===totalEval) agg.gCompletas++;
      else if(totalEval>0) agg.gIncompletas++;
      else agg.gSinEvaluacion++;
      return [g[0],g[1],g[2],totalEval,haveEval,pp,prods,noDataEval,0,totalAll,haveAll];
    });
    agg.nG=st.guias.length;
    agg.faltTot=Math.max(0,agg.reqTotal-agg.haveTotal);
    agg.compTotalPct=agg.reqTotal?Math.round(1000*agg.haveTotal/agg.reqTotal)/10:0;
    agg.uniqueRequired=Object.keys(allUnique).length;
    agg.uniqueMissing=Object.keys(missingUnique).length;
    st.amb=agg; st.kpi=st.kpi||{}; st.kpi.guiaComp=agg.compTotalPct; st.kpi.guiaFalt=agg.faltTot; st.kpi.guiaCompletas=agg.gCompletas;
  }
  window.llaveroRebuildAllGuideData=function(){Object.keys(S||{}).forEach(function(sc){delete (S[sc]||{})._guideInvIdx45; buildStore45(sc);});};
  function floorAgg45(st){var a=[0,0,0,0,0,0]; (st.guias||[]).forEach(function(g){for(var i=0;i<6;i++)a[i]+=toNum(g[5]&&g[5][i]);}); return a;}
  function pct45(h,t){return t?Math.round(1000*h/t)/10:0;}
  function filtCard45(key,label,value,meta){var on=(state.guias&&state.guias.f===key)||(key==='all'&&(!state.guias||state.guias.f==='all')); return '<button type="button" class="ambClickableCard'+(on?' on':'')+'" onclick="state.guias.f='+JSON.stringify(key)+';drawGuias()"><div class="acLabel">'+label+'</div><div class="acValue">'+value+'</div><div class="acMeta">'+meta+'</div></button>';}
  function status45(p){
    var cm=toNum(p[3]), st=p[5], tu=toNum(p[8]), invStock=toNum(p[11]), info=!p[10], txt='Sin registro SEUS', cls='gs-nd';
    if(st==='ok'){txt='Con existencia en tienda'; cls='gs-ok';}
    else if(st==='ok_requested'){txt='Con existencia en tienda'; cls='gs-ok';}
    else if(st==='ok_inv'){txt='Con existencia según inventario actual · '+fInt(invStock)+' u'; cls='gs-ok';}
    else if(st==='camino'){txt='En traslado'+(tu?' · '+fInt(tu)+' u':''); cls='gs-camino';}
    else if(st==='requested'){txt='Solicitud realizada a CENDIS'; cls='gs-requested';}
    else if(st==='requested_nostock'){txt='Solicitud realizada · sin disponibilidad actual'; cls='gs-requested-no';}
    else if(st==='available'){txt='Puedes solicitar en CENDIS'; cls='gs-available';}
    else if(st==='sin'){txt='Sin disponibilidad'; cls='gs-sin';}
    if(info) txt+=' · Piso 3 informativo';
    return '<span class="guideStatus '+cls+'">'+txt+'</span>';
  }
  function dispo45(p){
    if(!p[9]) return '<span class="guideStatus guideDispoNd">Sin dato</span>';
    var q=toNum(p[4]);
    return q>0?'<span class="guideStatus guideDispoYes">Sí · '+fInt(q)+' u</span>':'<span class="guideStatus guideDispoNo">No · 0 u</span>';
  }
  function row45(p){
    var c=p[0], record=!!p[7], invStock=toNum(p[11]), invOnly=!!p[12], csText=record?fInt(p[2]):'Sin dato', cmText=record?fInt(p[3]):'Sin dato';
    var note = '';
    if(!record) note += '<div class="guideDataMissing">Sin cruce en SEUS para esta bodega</div>';
    if(invOnly) note += '<div class="guideInventoryNote">Inventario actual en tienda: '+fInt(invStock)+' u</div>';
    if(!p[10]) note += '<div class="guideFloorInfoBadge">Piso 3 · informativo</div>';
    return '<tr class="guideProductRow" tabindex="0" role="button" data-product-code="'+esc(c)+'"><td>'+imageThumb(c,'sm')+'</td><td><span class="code">'+esc(c)+'</span></td><td><div class="guideProductName">'+esc(p[6]||(P[c]&&P[c].n)||'—')+'</div><div class="pageInteractiveHint">'+esc(P[c]&&P[c].cat||'')+((P[c]&&P[c].lin)?' · '+esc(P[c].lin):'')+'</div>'+note+'</td><td class="num"><b style="color:'+(record&&toNum(p[2])>0?'var(--ok)':(invOnly?'var(--ok)':'var(--ink2)'))+'">'+csText+'</b></td><td class="num">'+cmText+'</td><td class="num">'+dispo45(p)+'</td><td>'+status45(p)+'</td></tr>';
  }
  window.viewAmb=function(st){
    if(!st.guias||!st.amb||st.amb.invCover==null) buildStore45(CUR);
    var a=st.amb||{}, pa=floorAgg45(st), p1=pct45(pa[0],pa[1]), p2=pct45(pa[2],pa[3]), p3=pct45(pa[4],pa[5]);
    setTimeout(function(){ if(VIEW==='amb'){ drawGuias(); drawTr(); } },0);
    return '<div class="card"><div class="chead"><div class="cnum n3">▦</div><div><div class="tt">Guías de exhibición</div><div class="ds">Seguimiento de cumplimiento por tienda y gestión de faltantes</div></div><div class="rt"><span class="badge cool">'+toNum(a.compTotalPct).toLocaleString('es-CO',{maximumFractionDigits:1})+'% completitud</span></div></div><div class="cbody">'+
      '<div class="ambEvalNotice"><span>ⓘ</span><div><b>Piso 3 es informativo.</b> Sus productos permanecen visibles en cada guía, pero no afectan el porcentaje ni el estado de cumplimiento.</div></div>'+
      '<div class="ambClickableGrid">'+
        filtCard45('all','Completitud total',toNum(a.compTotalPct).toLocaleString('es-CO',{maximumFractionDigits:1})+'%',fInt(a.haveTotal)+' de '+fInt(a.reqTotal)+' posiciones cubiertas en Piso 1 y 2')+
        filtCard45('completas','Guías completas',fInt(a.gCompletas),fInt(a.nG-a.gCompletas)+' aún requieren gestión')+
        filtCard45('incompletas','Guías incompletas',fInt(a.gIncompletas),fInt(a.faltTot)+' posiciones pendientes por cubrir')+
        filtCard45('invcover','Respaldo inventario',fInt(a.invCover),'Posiciones cubiertas por inventario actual aunque no crucen en SEUS')+
        filtCard45('camino','En traslado',fInt(a.faltCamino),'Faltantes que ya vienen en movimiento abierto')+
        filtCard45('requested','Solicitud realizada',fInt(a.faltRequested),'Faltantes con gestión ya realizada a CENDIS')+
        filtCard45('available','Puedes solicitar',fInt(a.faltAvailable),'Faltantes con disponibilidad actual en CENDIS')+
        filtCard45('nodata','Sin registro SEUS',fInt(a.noRastr),'Posiciones evaluadas sin cruce en Presencia SEUS')+
      '</div>'+
      '<div class="ambCleanNote"><b>Lectura rápida:</b> una guía queda completa cuando todos los productos requeridos de <b>Piso 1</b> y <b>Piso 2</b> tienen existencia en tienda. Cuando una referencia no cruza en SEUS, se valida con el inventario actual de la tienda. Si tampoco hay existencia y CENDIS tiene disponibilidad, el estado será <b>Puedes solicitar en CENDIS</b>.</div>'+
      '<div class="ambSectionHead"><div><div class="legend" style="margin-bottom:0"><b>Lectura por piso</b></div><div class="sub">Piso 1 y Piso 2 impactan la medición. Piso 3 solo informa.</div></div></div>'+
      '<div class="guideFloorGrid">'+
        '<div class="guideFloorCard"><div class="guideFloorTop"><span>PISO 1</span><span>'+p1.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</span></div><div class="guideTrack"><div class="guideFill" style="width:'+p1+'%"></div></div><div class="guideFloorMeta">'+fInt(pa[0])+' de '+fInt(pa[1])+' posiciones cubiertas</div></div>'+
        '<div class="guideFloorCard"><div class="guideFloorTop"><span>PISO 2</span><span>'+p2.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</span></div><div class="guideTrack"><div class="guideFill" style="width:'+p2+'%"></div></div><div class="guideFloorMeta">'+fInt(pa[2])+' de '+fInt(pa[3])+' posiciones cubiertas</div></div>'+
        '<div class="guideFloorCard guideFloorInfo"><div class="guideFloorTop"><span>PISO 3</span><span>Informativo</span></div><div class="guideTrack"><div class="guideFill" style="width:'+p3+'%;background:var(--mut)"></div></div><div class="guideFloorMeta">'+fInt(pa[4])+' de '+fInt(pa[5])+' con existencia · no afecta cumplimiento</div></div>'+
      '</div>'+
      '<div class="tbar"><div class="tsearch">🔎<input id="q-guias" placeholder="Buscar guía, producto, código o estado…" oninput="state.guias.q=this.value;drawGuias()"></div><span class="chip filt" data-q="guias" data-f="all">Todas</span><span class="chip filt" data-q="guias" data-f="completas">Completas</span><span class="chip filt" data-q="guias" data-f="incompletas">Incompletas</span><span class="chip filt" data-q="guias" data-f="DORMITORIO">Dormitorio</span><span class="chip filt" data-q="guias" data-f="SOCIAL">Social</span><span class="chip filt" data-q="guias" data-f="invcover">Respaldo inventario</span><span class="chip filt" data-q="guias" data-f="camino">En traslado</span><span class="chip filt" data-q="guias" data-f="requested">Solicitud realizada</span><span class="chip filt" data-q="guias" data-f="available">Puedes solicitar</span><span class="chip filt" data-q="guias" data-f="sincendis">Sin disponibilidad</span><span class="chip filt" data-q="guias" data-f="nodata">Sin registro SEUS</span></div><div id="guias-tbl"></div><div class="foot"><span id="guias-cnt"></span><span>Haz clic en una guía para ver el detalle por Piso 1, Piso 2 y Piso 3.</span></div></div></div>'+
      '<div class="card"><div class="chead"><div class="cnum n3">⇄</div><div><div class="tt">Traslados en camino</div><div class="ds">Movimientos pendientes relacionados por código de producto</div></div><div class="rt"><span class="badge cool">'+fInt((st.kpi||{}).trN)+' líneas</span></div></div><div class="cbody"><div class="mkpis"><div class="mk a"><div class="l">Líneas / entregas</div><div class="v">'+fInt((st.kpi||{}).trN)+'</div></div><div class="mk a"><div class="l">Unidades</div><div class="v">'+fInt((st.kpi||{}).trU)+'</div></div><div class="mk a"><div class="l">Volumen m³</div><div class="v">'+fInt((st.kpi||{}).trVol)+'</div></div><div class="mk r"><div class="l">Pend. picking</div><div class="v">'+fInt((st.kpi||{}).trPick)+'</div></div><div class="mk r"><div class="l">Pend. movimiento</div><div class="v">'+fInt((st.kpi||{}).trMov)+'</div></div><div class="mk b"><div class="l">Fecha a revisar</div><div class="v">'+fInt((st.kpi||{}).trRev)+'</div></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-tr" placeholder="Buscar material, código o entrega…" oninput="state.tr.q=this.value;drawTr()"></div><span class="chip filt" data-q="tr" data-f="all">Todos</span><span class="chip filt" data-q="tr" data-f="pick">Pend. picking</span><span class="chip filt" data-q="tr" data-f="mov">Pend. movimiento</span><span class="chip filt" data-q="tr" data-f="rev">Fecha a revisar</span></div><div id="tr-tbl"></div><div class="foot"><span id="tr-cnt"></span><span>La imagen se cruza con el código del producto.</span></div></div></div>';
  };
  window.drawGuias=function(){
    var st=S[CUR]||{}, s=state.guias; if(!st.guias||!st.amb||st.amb.invCover==null) buildStore45(CUR); if(!s.exp) s.exp={};
    var rows=(st.guias||[]).map(function(g){
      var pr=g[6]||[], evalProds=pr.filter(function(p){return p[10];});
      return {code:g[0],name:g[1],cat:g[2],tot:g[3],pres:g[4],pp:g[5],prods:pr,totalAll:g[9],haveAll:g[10],comp:g[3]?Math.round(1000*g[4]/g[3])/10:0,
        nRequested:evalProds.filter(function(p){return p[5]==='requested'||p[5]==='requested_nostock';}).length,
        nAvailable:evalProds.filter(function(p){return p[5]==='available';}).length,
        nSin:evalProds.filter(function(p){return p[5]==='sin';}).length,
        nCamino:evalProds.filter(function(p){return p[5]==='camino';}).length,
        nNd:evalProds.filter(function(p){return !p[7];}).length,
        nInvCover:evalProds.filter(function(p){return p[12];}).length
      };
    });
    if(s.f==='DORMITORIO'||s.f==='SOCIAL') rows=rows.filter(function(r){return r.cat===s.f;});
    else if(s.f==='incompletas') rows=rows.filter(function(r){return r.comp<100;});
    else if(s.f==='completas') rows=rows.filter(function(r){return r.comp>=100;});
    else if(s.f==='requested') rows=rows.filter(function(r){return r.nRequested>0;});
    else if(s.f==='available') rows=rows.filter(function(r){return r.nAvailable>0;});
    else if(s.f==='sincendis') rows=rows.filter(function(r){return r.nSin>0;});
    else if(s.f==='nodata') rows=rows.filter(function(r){return r.nNd>0;});
    else if(s.f==='camino') rows=rows.filter(function(r){return r.nCamino>0;});
    else if(s.f==='invcover') rows=rows.filter(function(r){return r.nInvCover>0;});
    if(s.q){ var q=String(s.q).toLowerCase(); rows=rows.filter(function(r){ return (r.name+' '+r.code+' '+r.cat).toLowerCase().indexOf(q)>=0 || r.prods.some(function(p){var sttxt=status45(p).replace(/<[^>]+>/g,' '); return (p[0]+' '+p[6]+' '+sttxt).toLowerCase().indexOf(q)>=0;}); }); }
    rows.sort(function(a,b){ if(s.sort==='name') return a.name.localeCompare(b.name)*s.dir; if(s.sort==='cat') return a.cat.localeCompare(b.cat)*s.dir; if(s.sort==='falt') return ((a.tot-a.pres)-(b.tot-b.pres))*s.dir; if(s.sort==='cendis') return ((a.nRequested+a.nAvailable+a.nCamino)-(b.nRequested+b.nAvailable+b.nCamino))*s.dir; return (a.comp-b.comp)*s.dir || ((b.tot-b.pres)-(a.tot-a.pres)); });
    document.querySelectorAll('.chip.filt[data-q="guias"]').forEach(function(ch){ ch.classList.toggle('on',s.f===ch.dataset.f || (s.f==='all'&&ch.dataset.f==='all')); ch.onclick=function(){ s.f=ch.dataset.f; drawGuias(); }; });
    document.querySelectorAll('.ambClickableCard').forEach(function(card){ card.classList.toggle('on', card.getAttribute('onclick').indexOf('state.guias.f='+JSON.stringify(s.f))>=0); });
    function fp(r,i){var t=toNum(r.pp[i*2+1]), h=toNum(r.pp[i*2]); return t?Math.round(1000*h/t)/10:0;}
    var html='<div class="guideV42Head"><span>Guía</span><span>Categoría</span><span>Cumplimiento P1+P2</span><span>P1</span><span>P2</span><span>P3 info</span><span>Faltan P1+P2</span><span>Gestión</span></div><div class="guideAccordionList">';
    rows.forEach(function(r){
      var color=r.comp>=100?'var(--ok)':r.comp>=50?'var(--amb)':'var(--rot)', groups={'1':[],'2':[],'3':[]}; r.prods.forEach(function(p){ groups[/^[123]$/.test(String(p[1]))?String(p[1]):'3'].push(p); });
      var order={ok:0,ok_requested:1,ok_inv:2,camino:3,requested:4,available:5,requested_nostock:6,sin:7,nd:8}, sections='';
      ['1','2','3'].forEach(function(pi){
        var arr=groups[pi].slice().sort(function(a,b){return (order[a[5]]-order[b[5]])||String(a[6]).localeCompare(String(b[6]));}),
            ex=arr.filter(function(p){return p[5]==='ok'||p[5]==='ok_requested'||p[5]==='ok_inv';}).length,
            info=pi==='3';
        sections += '<div class="guideFloorSection '+(info?'guideFloorInfoSection':'')+'"><div class="guideFloorHead"><span>PISO '+pi+(info?' · INFORMATIVO':'')+'</span><span>'+arr.length+' productos · '+ex+' cubiertos · '+Math.max(0,arr.length-ex)+' pendientes'+(info?' · no afecta cumplimiento':'')+'</span></div><div class="guideDetailWrap"><table class="guideDetailTable guideDetailTableV42"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th class="num">CAN SUM</th><th class="num">CAN MIN</th><th class="num">Dispo CENDIS</th><th>Estado</th></tr></thead><tbody>'+(arr.length?arr.map(row45).join(''):'<tr><td colspan="7"><div class="guideFloorEmptyV42">Esta guía no tiene productos definidos en el Piso '+pi+'.</div></td></tr>')+'</tbody></table></div></div>';
      });
      function pill(t,n,cls){return '<span class="guideV42Pill '+cls+'">'+t+': '+fInt(n)+'</span>';}
      var p3t=toNum(r.pp[5]), p3h=toNum(r.pp[4]);
      html += '<details class="guideAccordion" data-guide-code="'+esc(r.code)+'" '+(s.exp[r.code]?'open':'')+' ontoggle="rememberGuideOpenV42(this)"><summary class="guideAccordionSummary"><div class="guideSummaryName"><span class="guideSummaryArrow">›</span><div><div class="guideSummaryTitle">'+esc(r.name)+'</div><div class="guideSummaryCode">'+esc(r.code)+'</div></div></div><div><span class="tag '+(r.cat==='DORMITORIO'?'cr':'a')+'">'+esc(r.cat)+'</span></div><div class="guideSummaryComp"><div class="guideSummaryTrack"><div class="guideSummaryFill" style="width:'+r.comp+'%;background:'+color+'"></div></div><b>'+r.comp.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</b></div>'+[0,1].map(function(i){var p=fp(r,i); return '<div class="guideSummaryMetric"><b>'+p.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</b></div>';}).join('')+'<div class="guideSummaryMetric"><b>'+fInt(p3h)+' / '+fInt(p3t)+'</b><span class="guideInfoSmall">informativo</span></div><div class="guideSummaryMetric"><b style="color:'+(r.tot-r.pres?'var(--bad)':'var(--ok)')+'">'+fInt(r.tot-r.pres)+'</b></div><div class="guideSummaryManage"><b>'+fInt(r.nRequested)+' solicitados</b><small>'+fInt(r.nAvailable)+' puedes solicitar · '+fInt(r.nCamino)+' en traslado</small></div></summary><div class="guideAccordionBody"><div class="guideV42Pills">'+pill('Cubiertos P1+P2',r.pres,'gs-ok')+pill('Pendientes P1+P2',r.tot-r.pres,'gs-sin')+pill('En traslado',r.nCamino,'gs-camino')+pill('Solicitud realizada',r.nRequested,'gs-requested')+pill('Puedes solicitar',r.nAvailable,'gs-available')+pill('Sin disponibilidad',r.nSin,'gs-sin')+pill('Sin registro SEUS',r.nNd,'gs-nd')+pill('Respaldo inventario',r.nInvCover,'gs-ok')+'</div><div class="guideV42Label">DETALLE DEL AMBIENTE POR PISO</div>'+sections+'</div></details>';
    });
    html += (rows.length?'':'<div class="empty">No hay guías para este filtro.</div>') + '</div>';
    var el=document.getElementById('guias-tbl'); if(el) el.innerHTML=html;
    var cnt=document.getElementById('guias-cnt'); if(cnt) cnt.textContent='Mostrando '+rows.length+' de '+((st.guias||[]).length)+' guías · '+fInt((st.amb||{}).reqTotal)+' posiciones evaluadas en Piso 1 y Piso 2';
    document.querySelectorAll('#guias-tbl .guideProductRow').forEach(function(tr){ var open=function(e){ if(e){e.preventDefault();e.stopPropagation();} openGuideProduct(tr.dataset.productCode); }; tr.onclick=open; tr.onkeydown=function(e){ if(e.key==='Enter'){open(e);} }; });
  };
  DB.meta=DB.meta||{}; DB.meta.reglas=DB.meta.reglas||{};
  DB.meta.reglas.ambientes='El cumplimiento de cada guía se calcula con existencia en tienda de Piso 1 y Piso 2. Si un producto no cruza en SEUS, se valida contra el inventario actual de la tienda. Si no hay existencia y CENDIS tiene disponibilidad, se marca como Puede solicitarse en CENDIS.';
  DB.meta.moduloAmbientes=Object.assign({},DB.meta.moduloAmbientes||{},{version:'v45',pisosEvaluados:['1','2'],validacionFallback:'Si no existe cruce en SEUS, se valida con el inventario actual de la tienda',estadoDisponible:'Puedes solicitar en CENDIS cuando no hay existencia en tienda y sí disponibilidad en CENDIS'});
  window.llaveroRebuildAllGuideData();
  setTimeout(function(){ if(VIEW==='amb') refresh(); },0);
})();


/* ===== llavero-v46-ambientes-cards-script ===== */
(function(){
  window.setGuideCardFilter46=function(f){ if(!state.guias) state.guias={sort:'comp',dir:1,q:'',f:'all',exp:{}}; state.guias.f=f||'all'; drawGuias(); };
  if(!state.guias)state.guias={sort:'comp',dir:1,q:'',f:'all',exp:{}};
  function escg(s){return (window.esc?esc(s):String(s==null?'':s));}
  function pillStatusText(st,p){const tu=toNum(p[8]); if(st==='ok'||st==='ok_requested'||st==='ok_inv') return 'Con existencia'; if(st==='camino') return 'En traslado'+(tu?' · '+fInt(tu)+' u':''); if(st==='requested'||st==='requested_nostock') return 'Solicitud realizada'; if(st==='available') return 'Puedes solicitar'; return 'Sin disponibilidad';}
  function dispoTxt(p){ if(!p[9]) return 'Sin dato'; const q=toNum(p[4]); return q>0?'Sí · '+fInt(q)+' u':'No · 0 u'; }
  function productRow46(p){ const c=p[0], record=!!p[7], invStock=toNum(p[11]), invOnly=!!p[12], prod=P[c]||{}; let note=''; if(!record) note+='<div class="guideDataMissing">Sin cruce en SEUS para esta bodega</div>'; if(invOnly) note+='<div class="guideInventoryNote">Inventario actual: '+fInt(invStock)+' u</div>'; if(!p[10]) note+='<div class="guideFloorInfoBadge">Piso 3 · informativo</div>'; return '<tr class="guideProductRow" tabindex="0" role="button" data-product-code="'+escg(c)+'"><td>'+imageThumb(c,'sm')+'</td><td><span class="code">'+escg(c)+'</span></td><td><div class="guideProductName">'+escg(p[6]||prod.n||'—')+'</div><div class="pageInteractiveHint">'+escg(prod.cat||'')+(prod.lin?' · '+escg(prod.lin):'')+'</div>'+note+'</td><td class="num"><b style="color:'+(record&&toNum(p[2])>0?'var(--ok)':(invOnly?'var(--ok)':'var(--ink2)'))+'">'+(record?fInt(p[2]):'Sin dato')+'</b></td><td class="num">'+(record?fInt(p[3]):'Sin dato')+'</td><td class="num"><span class="guideStatus '+(p[9]&&toNum(p[4])>0?'guideDispoYes':(p[9]?'guideDispoNo':'guideDispoNd'))+'">'+dispoTxt(p)+'</span></td><td><span class="guideStatus gs-'+(p[5]||'sin')+'">'+pillStatusText(p[5],p)+'</span></td></tr>'; }
  window.viewAmb=function(st){
    window.__llaveroAmbStore46=st;
    window.__llaveroAmbStoreCode46=CUR;
    if(!Array.isArray(st.guias)||st.guias.length===0||!st.amb||st.amb.invCover==null){
      if(window.llaveroRebuildAllGuideData) window.llaveroRebuildAllGuideData();
      st=(typeof S!=='undefined'&&CUR&&S[CUR])||st;
      window.__llaveroAmbStore46=st;
    }
    const a=st.amb||{}, pa=(function(){const arr=[0,0,0,0,0,0];(st.guias||[]).forEach(g=>{for(let i=0;i<6;i++)arr[i]+=toNum(g[5]&&g[5][i]);});return arr;})();
    const p1=pa[1]?Math.round(1000*pa[0]/pa[1])/10:0, p2=pa[3]?Math.round(1000*pa[2]/pa[3])/10:0, p3=pa[5]?Math.round(1000*pa[4]/pa[5])/10:0;
    const gConAvance=(st.guias||[]).filter(g=>toNum(g[4])>0 && toNum(g[4])<toNum(g[3])).length;
    setTimeout(function(){ if(VIEW==='amb'){ drawGuias(); drawTr(); if(window.reorderAllProductTables) window.reorderAllProductTables(); } },0);
    return '<div class="card"><div class="chead"><div class="cnum n3">▦</div><div><div class="tt">Guías de exhibición</div><div class="ds">Cumplimiento evaluado con existencia real de Piso 1 y Piso 2</div></div><div class="rt"><span class="badge cool">'+toNum(a.compTotalPct).toLocaleString('es-CO',{maximumFractionDigits:1})+'% completitud</span></div></div><div class="cbody">'+
      '<div class="mkpis">'+
        '<div class="mk a guideKpiLike '+((state.guias.f||'all')==='all'?'on':'')+'" data-guide-filter="all" onclick="window.setGuideCardFilter46(this.dataset.guideFilter)"><div class="l">Nivel de cobertura</div><div class="v">'+toNum(a.compTotalPct).toLocaleString('es-CO',{maximumFractionDigits:1})+'%</div><div class="m">Porcentaje de productos de <b>Piso 1</b> y <b>Piso 2</b> que la tienda ya tiene disponibles para exhibir.</div></div>'+
        '<div class="mk g guideKpiLike '+((state.guias.f||'all')==='completas'?'on':'')+'" data-guide-filter="completas" onclick="window.setGuideCardFilter46(this.dataset.guideFilter)"><div class="l">Guías completas</div><div class="v">'+fInt(a.gCompletas)+' <small>/ '+fInt(a.nG)+'</small></div><div class="m">Estas son las guías que <b>puedes exhibir completas</b>, porque ya cuentan con todos los productos requeridos del ambiente.</div></div>'+
        '<div class="mk a guideKpiLike '+((state.guias.f||'all')==='avance'?'on':'')+'" data-guide-filter="avance" onclick="window.setGuideCardFilter46(this.dataset.guideFilter)"><div class="l">Guías con avance</div><div class="v">'+fInt(gConAvance)+' <small>/ '+fInt(a.nG)+'</small></div><div class="m">Guías que ya tienen parte del ambiente y muestran un <b>avance parcial</b> sobre el total de '+fInt(a.nG)+' guías.</div></div>'+
        '<div class="mk a guideKpiLike '+((state.guias.f||'all')==='camino'?'on':'')+'" data-guide-filter="camino" onclick="window.setGuideCardFilter46(this.dataset.guideFilter)"><div class="l">Productos en traslado</div><div class="v">'+fInt(a.faltCamino)+'</div><div class="m">Productos faltantes del ambiente que <b>ya vienen en camino</b> hacia la tienda.</div></div>'+
        '<div class="mk a guideKpiLike '+((state.guias.f||'all')==='requested'?'on':'')+'" data-guide-filter="requested" onclick="window.setGuideCardFilter46(this.dataset.guideFilter)"><div class="l">Solicitud realizada</div><div class="v">'+fInt(a.faltRequested)+'</div><div class="m">Productos con <b>gestión realizada en CENDIS</b> para completar la exhibición del ambiente.</div></div>'+
        '<div class="mk b guideKpiLike '+((state.guias.f||'all')==='available'?'on':'')+'" data-guide-filter="available" onclick="window.setGuideCardFilter46(this.dataset.guideFilter)"><div class="l">Puedes solicitar</div><div class="v">'+fInt(a.faltAvailable)+'</div><div class="m">Faltantes sin existencia en tienda que <b>sí tienen disponibilidad en CENDIS</b> y ya se pueden pedir.</div></div>'+
      '</div>'+
      '<div><div class="legend" style="margin-bottom:7px"><b>Completitud por piso</b></div><div class="guideFloorGrid">'+
        '<div class="guideFloorCard"><div class="guideFloorTop"><span>PISO 1</span><span>'+p1.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</span></div><div class="guideTrack"><div class="guideFill" style="width:'+p1+'%"></div></div><div class="guideFloorMeta">'+fInt(pa[0])+' de '+fInt(pa[1])+' posiciones cubiertas</div></div>'+
        '<div class="guideFloorCard"><div class="guideFloorTop"><span>PISO 2</span><span>'+p2.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</span></div><div class="guideTrack"><div class="guideFill" style="width:'+p2+'%"></div></div><div class="guideFloorMeta">'+fInt(pa[2])+' de '+fInt(pa[3])+' posiciones cubiertas</div></div>'+
        '<div class="guideFloorCard guideFloorInfo"><div class="guideFloorTop"><span>PISO 3</span><span>Informativo</span></div><div class="guideTrack"><div class="guideFill" style="width:'+p3+'%;background:var(--mut)"></div></div><div class="guideFloorMeta">'+fInt(pa[4])+' de '+fInt(pa[5])+' con existencia · no afecta cumplimiento</div></div>'+
      '</div></div>'+
      '<div class="tbar"><div class="tsearch">🔎<input id="q-guias" value="'+escg(state.guias.q||'')+'" placeholder="Buscar guía, producto o código…" oninput="state.guias.q=this.value;drawGuias()"></div></div><div id="guias-tbl"></div><div class="foot"><span id="guias-cnt"></span><span>Haz clic en una guía para ver el detalle por piso y haz clic sobre cualquier producto para abrir su vista detallada.</span></div></div></div>'+
      '<div class="card"><div class="chead"><div class="cnum n3">⇄</div><div><div class="tt">Traslados en camino</div><div class="ds">Movimientos pendientes relacionados por código de producto</div></div><div class="rt"><span class="badge cool">'+fInt((st.kpi||{}).trN)+' líneas</span></div></div><div class="cbody"><div class="mkpis"><div class="mk a"><div class="l">Líneas / entregas</div><div class="v">'+fInt((st.kpi||{}).trN)+'</div></div><div class="mk a"><div class="l">Unidades</div><div class="v">'+fInt((st.kpi||{}).trU)+'</div></div><div class="mk a"><div class="l">Volumen m³</div><div class="v">'+fInt((st.kpi||{}).trVol)+'</div></div><div class="mk r"><div class="l">Pend. picking</div><div class="v">'+fInt((st.kpi||{}).trPick)+'</div></div><div class="mk r"><div class="l">Pend. movimiento</div><div class="v">'+fInt((st.kpi||{}).trMov)+'</div></div><div class="mk b"><div class="l">Fecha a revisar</div><div class="v">'+fInt((st.kpi||{}).trRev)+'</div></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-tr" placeholder="Buscar material, código o entrega…" oninput="state.tr.q=this.value;drawTr()"></div><span class="chip filt" data-q="tr" data-f="all">Todos</span><span class="chip filt" data-q="tr" data-f="pick">Pend. picking</span><span class="chip filt" data-q="tr" data-f="mov">Pend. movimiento</span><span class="chip filt" data-q="tr" data-f="rev">Fecha a revisar</span></div><div id="tr-tbl"></div><div class="foot"><span id="tr-cnt"></span><span>La imagen se cruza con el código del producto.</span></div></div></div>';
  };
  window.drawGuias=function(){
    let st=(typeof S!=='undefined'&&CUR&&S[CUR])||window.__llaveroAmbStore46||{}, s=state.guias;
    if((!Array.isArray(st.guias)||st.guias.length===0||!st.amb||st.amb.invCover==null) && window.llaveroRebuildAllGuideData){
      window.llaveroRebuildAllGuideData();
      st=(typeof S!=='undefined'&&CUR&&S[CUR])||window.__llaveroAmbStore46||st;
    }
    window.__llaveroAmbStore46=st;
    if(!s.exp) s.exp={};
    let rows=(Array.isArray(st.guias)?st.guias:[]).map(function(g){ const pr=g[6]||[], evalProds=pr.filter(p=>p[10]); return {code:g[0],name:g[1],cat:g[2],tot:g[3],pres:g[4],pp:g[5],prods:pr,comp:g[3]?Math.round(1000*g[4]/g[3])/10:0,nRequested:evalProds.filter(p=>p[5]==='requested'||p[5]==='requested_nostock').length,nAvailable:evalProds.filter(p=>p[5]==='available').length,nSin:evalProds.filter(p=>p[5]==='sin'||p[5]==='nd').length,nCamino:evalProds.filter(p=>p[5]==='camino').length,nAvance:(g[4]>0&&g[4]<g[3])?1:0}; });
    const allowedFilters=['all','completas','avance','camino','requested','available'];
    if(!allowedFilters.includes(s.f)) s.f='all';
    if(rows.length===0 && Array.isArray(DB.G) && DB.G.length>0 && window.llaveroRebuildAllGuideData && !window.__guideRetry47){
      window.__guideRetry47=true;
      window.llaveroRebuildAllGuideData();
      setTimeout(function(){window.__guideRetry47=false;drawGuias();},0);
      return;
    }
    if(s.f==='completas') rows=rows.filter(r=>r.comp>=100); else if(s.f==='avance') rows=rows.filter(r=>r.nAvance>0); else if(s.f==='camino') rows=rows.filter(r=>r.nCamino>0); else if(s.f==='requested') rows=rows.filter(r=>r.nRequested>0); else if(s.f==='available') rows=rows.filter(r=>r.nAvailable>0);
    if(s.q){ const q=String(s.q).toLowerCase(); rows=rows.filter(r=>(r.name+' '+r.code+' '+r.cat).toLowerCase().includes(q) || r.prods.some(p=>(p[0]+' '+p[6]).toLowerCase().includes(q))); }
    rows.sort((a,b)=>(b.comp-a.comp)||((a.tot-a.pres)-(b.tot-b.pres))||a.name.localeCompare(b.name));
    document.querySelectorAll('.guideKpiLike').forEach(function(el){ el.classList.toggle('on', (el.dataset.guideFilter||'all')===s.f); });
    function fp(r,i){const t=toNum(r.pp[i*2+1]), h=toNum(r.pp[i*2]); return t?Math.round(1000*h/t)/10:null;}
    let html='<div class="guideMainWrap"><div class="guideMainHead"><div>Guía</div><div>Categoría</div><div>Cumplimiento P1+P2</div><div>P1</div><div>P2</div><div>P3 info</div><div>Gestión</div></div><div class="guideAccordionList">';
    rows.forEach(function(r){
      const color=r.comp>=100?'var(--ok)':r.comp>=50?'var(--amb)':'var(--rot)', groups={'1':[],'2':[],'3':[]}; r.prods.forEach(p=>groups[/^[123]$/.test(String(p[1]))?String(p[1]):'3'].push(p));
      function section(pi){ const arr=groups[pi]||[], ex=arr.filter(p=>['ok','ok_requested','ok_inv'].includes(p[5])).length; return '<div class="guideFloorSection '+(pi==='3'?'guideFloorInfoSection':'')+'"><div class="guideFloorHead"><span>PISO '+pi+(pi==='3'?' · INFORMATIVO':'')+'</span><span>'+arr.length+' productos · '+ex+' cubiertos · '+Math.max(0,arr.length-ex)+' pendientes'+(pi==='3'?' · no afecta cumplimiento':'')+'</span></div><div class="guideDetailWrap"><div class="twrap"><table class="guideDetailTable guideProdTable"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th class="num">CAN SUM</th><th class="num">CAN MIN</th><th class="num">Dispo CENDIS</th><th>Estado</th></tr></thead><tbody>'+(arr.length?arr.map(productRow46).join(''):'<tr><td colspan="7"><div class="guideFloorEmptyV42">Esta guía no tiene productos definidos en el Piso '+pi+'.</div></td></tr>')+'</tbody></table></div></div></div>'; }
      const p1=fp(r,0), p2=fp(r,1), p3h=toNum(r.pp[4]), p3t=toNum(r.pp[5]);
      let gestion=''; if(r.nCamino>0) gestion='<span class="guideStatus gs-camino">'+fInt(r.nCamino)+' en camino</span>'; else if(r.nRequested>0) gestion='<span class="guideStatus gs-requested">'+fInt(r.nRequested)+' solicitados</span>'; else if(r.nAvailable>0) gestion='<span class="guideStatus gs-available">'+fInt(r.nAvailable)+' por solicitar</span>'; else if(r.comp>=100) gestion='<span class="guideStatus gs-ok">Completa</span>'; else gestion='<span class="guideStatus gs-sin">'+fInt(r.tot-r.pres)+' faltantes</span>';
      html += '<details class="guideAccordion" data-guide-code="'+escg(r.code)+'" '+(s.exp[r.code]?'open':'')+' ontoggle="rememberGuideOpenV42(this)"><summary class="guideSummaryCompact"><div class="guideSummaryName"><span class="guideSummaryArrow">›</span><div><div class="guideSummaryTitle">'+escg(r.name)+'</div><div class="guideSummaryCode">'+escg(r.code)+'</div></div></div><div><span class="tag '+(r.cat==='DORMITORIO'?'cr':'a')+'">'+escg(r.cat)+'</span></div><div><div class="guideComp"><div class="guideCompTrack"><div class="guideCompFill" style="width:'+r.comp+'%;background:'+color+'"></div></div><b>'+r.comp.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</b></div></div><div class="num"><b style="color:'+(p1===100?'var(--ok)':'var(--ink2)')+'">'+(p1==null?'—':p1.toLocaleString('es-CO',{maximumFractionDigits:1})+'%')+'</b></div><div class="num"><b style="color:'+(p2===100?'var(--ok)':'var(--ink2)')+'">'+(p2==null?'—':p2.toLocaleString('es-CO',{maximumFractionDigits:1})+'%')+'</b></div><div class="num"><b>'+fInt(p3h)+' / '+fInt(p3t)+'</b><div class="pageInteractiveHint">informativo</div></div><div>'+gestion+'</div></summary><div class="guideAccordionBody"><div class="guideV42Pills"><span class="guideV42Pill gs-ok">Cubiertos P1+P2: '+fInt(r.pres)+'</span><span class="guideV42Pill gs-sin">Pendientes P1+P2: '+fInt(r.tot-r.pres)+'</span><span class="guideV42Pill gs-camino">En traslado: '+fInt(r.nCamino)+'</span><span class="guideV42Pill gs-requested">Solicitud realizada: '+fInt(r.nRequested)+'</span><span class="guideV42Pill gs-available">Puedes solicitar: '+fInt(r.nAvailable)+'</span></div><div class="guideV42Label">DETALLE DEL AMBIENTE POR PISO</div>'+section('1')+section('2')+section('3')+'</div></details>';
    });
    html += (rows.length?'':'<div class="empty" style="padding:18px">No hay guías para este filtro.</div>')+'</div></div>';
    const el=document.getElementById('guias-tbl'); if(el) el.innerHTML=html;
    const cnt=document.getElementById('guias-cnt'); if(cnt) cnt.textContent='Mostrando '+rows.length+' de '+((st.guias||[]).length)+' guías';
    document.querySelectorAll('#guias-tbl .guideProductRow').forEach(function(tr){ const open=function(e){ if(e){e.preventDefault();e.stopPropagation();} openGuideProduct(tr.dataset.productCode); }; tr.onclick=open; tr.onkeydown=function(e){ if(e.key==='Enter') open(e); }; });
    if(window.reorderAllProductTables) window.reorderAllProductTables();
  };
  window.reorderProductTable=function(table){
    if(!table) return; const headerRow=table.querySelector('thead tr, tr'); if(!headerRow) return; const headers=[...headerRow.children];
    const txt=headers.map(th=>th.textContent.trim().toUpperCase().replace(/\s+/g,' ')); const img=txt.findIndex(t=>t==='IMAGEN'); const cod=txt.findIndex(t=>t==='CÓDIGO'||t==='CODIGO');
    if(img===-1||cod===-1||img<cod) return; [...table.querySelectorAll('tr')].forEach(tr=>{ const cells=[...tr.children]; if(cells.length>Math.max(img,cod)){ const imgCell=cells[img]; tr.removeChild(imgCell); tr.insertBefore(imgCell,cells[cod]); } }); };
  window.reorderAllProductTables=function(){ document.querySelectorAll('table').forEach(window.reorderProductTable); };
  const mo=new MutationObserver(()=>{ if(window.__reorderTick46) cancelAnimationFrame(window.__reorderTick46); window.__reorderTick46=requestAnimationFrame(()=>window.reorderAllProductTables()); });
  /* V82: observador global desactivado; el render estable aplica el ajuste una sola vez. */
  setTimeout(()=>{window.reorderAllProductTables(); if(VIEW==='amb') refresh();},0);
})();


/* ===== llavero-v48-tablas-ambientes-script ===== */
(function(){
  if(!state.guias) state.guias={sort:'comp',dir:-1,q:'',f:'all',exp:{}};
  if(!state.guias.detail) state.guias.detail={floor:'all',status:'all',q:''};
  var currentGuideV48=null;
  var filterInfoV48={
    all:['Todas las guías','Vista completa de las guías de exhibición de la tienda.'],
    completas:['Guías completas','Ambientes que pueden exhibirse completos porque la tienda ya tiene todos los productos requeridos de Piso 1 y Piso 2.'],
    avance:['Guías con avance','Ambientes que tienen parte de sus productos, pero aún requieren completar una o más posiciones.'],
    sinavance:['Guías sin avance','Ambientes que todavía no tienen ningún producto cubierto en Piso 1 ni Piso 2.'],
    camino:['Productos en traslado','Guías con productos faltantes que ya vienen en camino hacia la tienda.'],
    requested:['Solicitud realizada','Guías con productos cuya gestión de solicitud a CENDIS ya fue realizada.'],
    available:['Puedes solicitar','Guías con faltantes que tienen disponibilidad actual en CENDIS.'],
    p1pend:['Piso 1 pendiente','Guías que todavía tienen productos pendientes en Piso 1.'],
    p2pend:['Piso 2 pendiente','Guías que todavía tienen productos pendientes en Piso 2.'],
    DORMITORIO:['Dormitorio','Guías correspondientes a ambientes de dormitorio.'],
    SOCIAL:['Social','Guías correspondientes a ambientes sociales.']
  };
  function stV48(){return (typeof S!=='undefined'&&CUR&&S[CUR])?S[CUR]:{};}
  function escV48(v){return typeof esc==='function'?esc(v):String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function getRowsV48(){
    var st=stV48();
    if((!Array.isArray(st.guias)||!st.guias.length) && window.llaveroRebuildAllGuideData){window.llaveroRebuildAllGuideData();st=stV48();}
    return (Array.isArray(st.guias)?st.guias:[]).map(function(g){
      var pr=g[6]||[],ev=pr.filter(function(p){return !!p[10];});
      return {raw:g,code:g[0],name:g[1],cat:g[2],tot:toNum(g[3]),pres:toNum(g[4]),pp:g[5]||[0,0,0,0,0,0],prods:pr,
        comp:toNum(g[3])?Math.round(1000*toNum(g[4])/toNum(g[3]))/10:0,
        nRequested:ev.filter(function(p){return p[5]==='requested'||p[5]==='requested_nostock';}).length,
        nAvailable:ev.filter(function(p){return p[5]==='available';}).length,
        nCamino:ev.filter(function(p){return p[5]==='camino';}).length,
        nSin:ev.filter(function(p){return p[5]==='sin'||p[5]==='nd';}).length};
    });
  }
  function floorPctV48(r,i){var t=toNum(r.pp[i*2+1]),h=toNum(r.pp[i*2]);return t?Math.round(1000*h/t)/10:null;}
  function passesV48(r,f){
    if(f==='all'||!f)return true;
    if(f==='completas')return r.comp>=100;
    if(f==='avance')return r.pres>0&&r.pres<r.tot;
    if(f==='sinavance')return r.pres===0;
    if(f==='camino')return r.nCamino>0;
    if(f==='requested')return r.nRequested>0;
    if(f==='available')return r.nAvailable>0;
    if(f==='p1pend')return toNum(r.pp[0])<toNum(r.pp[1]);
    if(f==='p2pend')return toNum(r.pp[2])<toNum(r.pp[3]);
    if(f==='DORMITORIO'||f==='SOCIAL')return r.cat===f;
    return true;
  }
  window.setGuideFilterV48=function(f){state.guias.f=f;drawGuias();};
  function quickBtnV48(f,label){return '<button type="button" class="guideQuickBtnV48 '+((state.guias.f||'all')===f?'on':'')+'" onclick="setGuideFilterV48('+JSON.stringify(f)+')">'+label+'</button>';}
  function cardV48(f,cls,label,value,meta){return '<div class="mk '+cls+' guideKpiLike '+((state.guias.f||'all')===f?'on':'')+'" data-guide-filter="'+f+'" onclick="setGuideFilterV48('+JSON.stringify(f)+')"><div class="l">'+label+'</div><div class="v">'+value+'</div><div class="m">'+meta+'</div></div>';}
  window.viewAmb=function(st){
    if((!st.guias||!st.guias.length||!st.amb||st.amb.invCover==null)&&window.llaveroRebuildAllGuideData)window.llaveroRebuildAllGuideData();
    st=stV48();var a=st.amb||{},pa=[0,0,0,0,0,0];(st.guias||[]).forEach(function(g){for(var i=0;i<6;i++)pa[i]+=toNum(g[5]&&g[5][i]);});
    var pct=function(h,t){return t?Math.round(1000*h/t)/10:0;},p1=pct(pa[0],pa[1]),p2=pct(pa[2],pa[3]),p3=pct(pa[4],pa[5]);
    var gAv=(st.guias||[]).filter(function(g){return toNum(g[4])>0&&toNum(g[4])<toNum(g[3]);}).length,gAvPct=a.nG?Math.round(1000*gAv/a.nG)/10:0;
    setTimeout(function(){if(VIEW==='amb'){drawGuias();drawTr();if(window.reorderAllProductTables)window.reorderAllProductTables();}},0);
    return '<div class="card"><div class="chead"><div class="cnum n3">▦</div><div><div class="tt">Guías de exhibición</div><div class="ds">Cumplimiento evaluado con existencia real de Piso 1 y Piso 2</div></div><div class="rt"><span class="badge cool">'+toNum(a.compTotalPct).toLocaleString('es-CO',{maximumFractionDigits:1})+'% completitud</span></div></div><div class="cbody">'+
      '<div class="mkpis">'+
      cardV48('all','a','Nivel de cobertura',toNum(a.compTotalPct).toLocaleString('es-CO',{maximumFractionDigits:1})+'%','Porcentaje de posiciones de <b>Piso 1 y Piso 2</b> que la tienda ya puede cubrir.')+
      cardV48('completas','g','Guías completas',fInt(a.gCompletas)+' <small>/ '+fInt(a.nG)+'</small>','Ambientes que se pueden <b>exhibir completos</b> sin pedir productos adicionales.')+
      cardV48('avance','a','Guías con avance',fInt(gAv)+' <small>/ '+fInt(a.nG)+'</small>','Representan el <b>'+gAvPct.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</b> de las guías y ya tienen parte del ambiente.')+
      cardV48('camino','a','Productos en traslado',fInt(a.faltCamino),'Productos faltantes que <b>ya vienen en camino</b> hacia la tienda.')+
      cardV48('requested','a','Solicitud realizada',fInt(a.faltRequested),'Productos con <b>gestión realizada en CENDIS</b> para completar el ambiente.')+
      cardV48('available','b','Puedes solicitar',fInt(a.faltAvailable),'Faltantes con disponibilidad en CENDIS que la tienda puede solicitar.')+
      '</div>'+
      '<div><div class="legend" style="margin-bottom:7px"><b>Completitud por piso</b></div><div class="guideFloorGrid"><div class="guideFloorCard"><div class="guideFloorTop"><span>PISO 1</span><span>'+p1.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</span></div><div class="guideTrack"><div class="guideFill" style="width:'+p1+'%"></div></div><div class="guideFloorMeta">'+fInt(pa[0])+' de '+fInt(pa[1])+' posiciones cubiertas</div></div><div class="guideFloorCard"><div class="guideFloorTop"><span>PISO 2</span><span>'+p2.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</span></div><div class="guideTrack"><div class="guideFill" style="width:'+p2+'%"></div></div><div class="guideFloorMeta">'+fInt(pa[2])+' de '+fInt(pa[3])+' posiciones cubiertas</div></div><div class="guideFloorCard guideFloorInfo"><div class="guideFloorTop"><span>PISO 3</span><span>Informativo</span></div><div class="guideTrack"><div class="guideFill" style="width:'+p3+'%;background:var(--mut)"></div></div><div class="guideFloorMeta">'+fInt(pa[4])+' de '+fInt(pa[5])+' con existencia · no afecta cumplimiento</div></div></div></div>'+
      '<div class="tbar"><div class="tsearch">🔎<input id="q-guias" value="'+escV48(state.guias.q||'')+'" placeholder="Buscar guía, producto o código…" oninput="state.guias.q=this.value;drawGuias()"></div><div class="guideFilterBarV48">'+quickBtnV48('all','Todas')+quickBtnV48('completas','Completas')+quickBtnV48('avance','Con avance')+quickBtnV48('sinavance','Sin avance')+quickBtnV48('p1pend','Piso 1 pendiente')+quickBtnV48('p2pend','Piso 2 pendiente')+quickBtnV48('camino','En traslado')+quickBtnV48('requested','Solicitud realizada')+quickBtnV48('available','Puedes solicitar')+quickBtnV48('DORMITORIO','Dormitorio')+quickBtnV48('SOCIAL','Social')+'</div></div><div id="guideFilterInfoV48"></div><div id="guias-tbl"></div><div class="foot"><span id="guias-cnt"></span><span>Selecciona una guía para abrir su vista detallada.</span></div></div></div>'+
      '<div class="card"><div class="chead"><div class="cnum n3">⇄</div><div><div class="tt">Traslados en camino</div><div class="ds">Movimientos pendientes relacionados por código de producto</div></div><div class="rt"><span class="badge cool">'+fInt((st.kpi||{}).trN)+' líneas</span></div></div><div class="cbody"><div class="mkpis"><div class="mk a"><div class="l">Líneas / entregas</div><div class="v">'+fInt((st.kpi||{}).trN)+'</div></div><div class="mk a"><div class="l">Unidades</div><div class="v">'+fInt((st.kpi||{}).trU)+'</div></div><div class="mk a"><div class="l">Volumen m³</div><div class="v">'+fInt((st.kpi||{}).trVol)+'</div></div><div class="mk r"><div class="l">Pend. picking</div><div class="v">'+fInt((st.kpi||{}).trPick)+'</div></div><div class="mk r"><div class="l">Pend. movimiento</div><div class="v">'+fInt((st.kpi||{}).trMov)+'</div></div><div class="mk b"><div class="l">Fecha a revisar</div><div class="v">'+fInt((st.kpi||{}).trRev)+'</div></div></div><div class="tbar"><div class="tsearch">🔎<input id="q-tr" placeholder="Buscar material, código o entrega…" oninput="state.tr.q=this.value;drawTr()"></div><span class="chip filt" data-q="tr" data-f="all">Todos</span><span class="chip filt" data-q="tr" data-f="pick">Pend. picking</span><span class="chip filt" data-q="tr" data-f="mov">Pend. movimiento</span><span class="chip filt" data-q="tr" data-f="rev">Fecha a revisar</span></div><div id="tr-tbl"></div><div class="foot"><span id="tr-cnt"></span><span>La imagen se cruza con el código del producto.</span></div></div></div>';
  };
  function mainGestionV48(r){if(r.nCamino)return '<span class="guideStatus gs-camino">'+fInt(r.nCamino)+' en traslado</span>';if(r.nRequested)return '<span class="guideStatus gs-requested">'+fInt(r.nRequested)+' solicitados</span>';if(r.nAvailable)return '<span class="guideStatus gs-available">'+fInt(r.nAvailable)+' puedes solicitar</span>';if(r.comp>=100)return '<span class="guideStatus gs-ok">Completa</span>';return '<span class="guideStatus gs-sin">'+fInt(r.tot-r.pres)+' pendientes</span>';}
  window.drawGuias=function(){
    var rows=getRowsV48(),f=state.guias.f||'all',q=String(state.guias.q||'').trim().toLowerCase();
    if(!filterInfoV48[f]){f='all';state.guias.f='all';}
    rows=rows.filter(function(r){return passesV48(r,f);});
    if(q)rows=rows.filter(function(r){return (r.name+' '+r.code+' '+r.cat).toLowerCase().indexOf(q)>=0||r.prods.some(function(p){return (p[0]+' '+p[6]).toLowerCase().indexOf(q)>=0;});});
    rows.sort(function(a,b){return (b.comp-a.comp)||((a.tot-a.pres)-(b.tot-b.pres))||String(a.name).localeCompare(String(b.name));});
    document.querySelectorAll('.guideQuickBtnV48').forEach(function(b){b.classList.toggle('on',(b.getAttribute('onclick')||'').indexOf(JSON.stringify(f))>=0);});
    document.querySelectorAll('.guideKpiLike').forEach(function(c){c.classList.toggle('on',c.dataset.guideFilter===f);});
    var fi=filterInfoV48[f]||filterInfoV48.all,info=document.getElementById('guideFilterInfoV48');if(info)info.innerHTML='<div class="guideFilterInfoV48"><span>ⓘ</span><div><b>'+fi[0]+':</b> '+fi[1]+' Se muestran '+fInt(rows.length)+' guías.</div></div>';
    var body=rows.map(function(r){var p1=floorPctV48(r,0),p2=floorPctV48(r,1),p3h=toNum(r.pp[4]),p3t=toNum(r.pp[5]),color=r.comp>=100?'var(--ok)':r.comp>=50?'var(--amb)':'var(--rot)';return '<tr class="guideListRowV48" tabindex="0" role="button" data-guide-code="'+escV48(r.code)+'" onclick="openGuideDetailV48('+JSON.stringify(r.code)+')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openGuideDetailV48('+JSON.stringify(r.code)+')}"><td><div class="guideListTitleV48">'+escV48(r.name)+'</div><div class="guideListCodeV48">'+escV48(r.code)+'</div></td><td><span class="tag '+(r.cat==='DORMITORIO'?'cr':'a')+'">'+escV48(r.cat)+'</span></td><td><div class="guidePctCellV48"><div class="guidePctTrackV48"><div class="guidePctFillV48" style="width:'+r.comp+'%;background:'+color+'"></div></div><b>'+r.comp.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</b></div></td><td class="num"><b>'+(p1==null?'—':p1.toLocaleString('es-CO',{maximumFractionDigits:1})+'%')+'</b></td><td class="num"><b>'+(p2==null?'—':p2.toLocaleString('es-CO',{maximumFractionDigits:1})+'%')+'</b></td><td class="num"><b>'+fInt(p3h)+' / '+fInt(p3t)+'</b><div class="pageInteractiveHint">informativo</div></td><td class="num"><b style="color:'+(r.tot-r.pres?'var(--bad)':'var(--ok)')+'">'+fInt(r.tot-r.pres)+'</b></td><td>'+mainGestionV48(r)+'</td></tr>';}).join('');
    var html='<div class="twrap"><table class="guideListTableV48"><thead><tr><th>Guía</th><th>Categoría</th><th>Cumplimiento P1+P2</th><th class="num">P1</th><th class="num">P2</th><th class="num">P3 info</th><th class="num">Pendientes</th><th>Gestión</th></tr></thead><tbody>'+ (body||'<tr><td colspan="8"><div class="empty">No hay guías para este filtro.</div></td></tr>') +'</tbody></table></div>';
    var el=document.getElementById('guias-tbl');if(el)el.innerHTML=html;var cnt=document.getElementById('guias-cnt');if(cnt)cnt.textContent='Mostrando '+rows.length+' de '+getRowsV48().length+' guías';
    if(window.reorderAllProductTables)window.reorderAllProductTables();
  };
  function ensureModalV48(){
    var m=document.getElementById('guideDetailModalBackV48');if(m)return m;
    m=document.createElement('div');m.className='modalBack';m.id='guideDetailModalBackV48';m.onclick=function(e){if(e.target===m)closeGuideDetailV48();};
    m.innerHTML='<div class="modal guideDetailModalV48" role="dialog" aria-modal="true" aria-labelledby="guideDetailTitleV48"><div class="modalHead"><div><h3 id="guideDetailTitleV48">Detalle de guía</h3><p id="guideDetailSubV48">—</p></div><button class="modalClose" onclick="closeGuideDetailV48()" aria-label="Cerrar">×</button></div><div class="guideModalScrollV48" id="guideDetailBodyV48"></div></div>';
    document.body.appendChild(m);return m;
  }
  function productStateV48(p){var st=p[5];if(st==='ok'||st==='ok_requested')return ['Con existencia en SEUS','gs-ok','covered'];if(st==='ok_inv')return ['Con existencia según inventario actual','gs-ok','covered'];if(st==='camino')return ['En traslado','gs-camino','camino'];if(st==='requested'||st==='requested_nostock')return ['Solicitud realizada','gs-requested','requested'];if(st==='available')return ['Puedes solicitar en CENDIS','gs-available','available'];return ['Sin disponibilidad','gs-sin','pending'];}
  function detailButtonV48(type,value,label){var cur=state.guias.detail[type];return '<button type="button" class="guideQuickBtnV48 '+(cur===value?'on':'')+'" onclick="state.guias.detail.'+type+'='+JSON.stringify(value)+';renderGuideDetailV48()">'+label+'</button>';}
  window.openGuideDetailV48=function(code){var rows=getRowsV48();currentGuideV48=rows.find(function(r){return String(r.code)===String(code);})||null;if(!currentGuideV48)return;state.guias.detail={floor:'all',status:'all',q:''};var m=ensureModalV48();m.classList.add('on');document.body.style.overflow='hidden';renderGuideDetailV48();};
  window.closeGuideDetailV48=function(){var m=document.getElementById('guideDetailModalBackV48');if(m)m.classList.remove('on');document.body.style.overflow='';};
  window.renderGuideDetailV48=function(){
    if(!currentGuideV48)return;var r=currentGuideV48,d=state.guias.detail||{floor:'all',status:'all',q:''},body=document.getElementById('guideDetailBodyV48');if(!body)return;
    var title=document.getElementById('guideDetailTitleV48'),sub=document.getElementById('guideDetailSubV48');if(title)title.textContent=r.name;if(sub)sub.textContent=r.code+' · '+r.cat+' · '+r.comp.toLocaleString('es-CO',{maximumFractionDigits:1})+'% de cumplimiento en Piso 1 y Piso 2';
    var rows=(r.prods||[]).map(function(p){var st=productStateV48(p);return {p:p,stateText:st[0],stateClass:st[1],stateKey:st[2],floor:String(p[1]||'3'),code:p[0],name:p[6]||(typeof P!=='undefined'&&P[p[0]]&&P[p[0]].n)||'—'};});
    if(d.floor!=='all')rows=rows.filter(function(x){return x.floor===d.floor;});if(d.status!=='all')rows=rows.filter(function(x){return x.stateKey===d.status;});var q=String(d.q||'').toLowerCase();if(q)rows=rows.filter(function(x){return (x.code+' '+x.name+' '+x.stateText).toLowerCase().indexOf(q)>=0;});
    var p1t=toNum(r.pp[1]),p1h=toNum(r.pp[0]),p2t=toNum(r.pp[3]),p2h=toNum(r.pp[2]),p3t=toNum(r.pp[5]),p3h=toNum(r.pp[4]);
    var stats='<div class="guideModalStatsV48"><div class="guideModalStatV48"><div class="l">Cumplimiento</div><div class="v">'+r.comp.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</div><div class="m">Piso 1 y Piso 2</div></div><div class="guideModalStatV48"><div class="l">Piso 1</div><div class="v">'+fInt(p1h)+' / '+fInt(p1t)+'</div><div class="m">Productos cubiertos</div></div><div class="guideModalStatV48"><div class="l">Piso 2</div><div class="v">'+fInt(p2h)+' / '+fInt(p2t)+'</div><div class="m">Productos cubiertos</div></div><div class="guideModalStatV48"><div class="l">Piso 3</div><div class="v">'+fInt(p3h)+' / '+fInt(p3t)+'</div><div class="m">Solo informativo</div></div><div class="guideModalStatV48"><div class="l">Pendientes P1+P2</div><div class="v">'+fInt(r.tot-r.pres)+'</div><div class="m">Productos por gestionar</div></div></div>';
    var toolbar='<div class="guideModalToolbarV48"><div class="tsearch">🔎<input value="'+escV48(d.q||'')+'" placeholder="Buscar producto, código o estado…" oninput="state.guias.detail.q=this.value;renderGuideDetailV48()"></div><div class="guideFilterBarV48">'+detailButtonV48('floor','all','Todos los pisos')+detailButtonV48('floor','1','Piso 1')+detailButtonV48('floor','2','Piso 2')+detailButtonV48('floor','3','Piso 3')+detailButtonV48('status','all','Todos los estados')+detailButtonV48('status','covered','Cubiertos')+detailButtonV48('status','pending','Pendientes')+detailButtonV48('status','camino','En traslado')+detailButtonV48('status','requested','Solicitud realizada')+detailButtonV48('status','available','Puedes solicitar')+'</div></div>';
    var trs=rows.map(function(x){var p=x.p,record=!!p[7],inv=toNum(p[11]),invOnly=!!p[12],disp=p[9]?(toNum(p[4])>0?'Sí · '+fInt(p[4])+' u':'No · 0 u'):'Sin dato',source=invOnly?'Inventario actual':(record?'SEUS':'Sin cruce');return '<tr onclick="closeGuideDetailV48();setTimeout(function(){if(typeof openGuideProduct===\'function\')openGuideProduct('+JSON.stringify(x.code)+');},0)"><td>'+imageThumb(x.code,'sm')+'</td><td><span class="code">'+escV48(x.code)+'</span></td><td class="col-product"><div class="guideProductName">'+escV48(x.name)+'</div><div class="guideExistSourceV48">Existencia validada con: '+source+'</div></td><td><span class="guideFloorBadgeV48 '+(x.floor==='3'?'info':'')+'">Piso '+x.floor+(x.floor==='3'?' · info':'')+'</span></td><td class="num">'+(record?fInt(p[2]):'Sin dato')+'</td><td class="num">'+fInt(inv)+'</td><td class="num">'+(record?fInt(p[3]):'Sin dato')+'</td><td class="num">'+disp+'</td><td><span class="guideStatus '+x.stateClass+'">'+x.stateText+'</span></td></tr>';}).join('');
    body.innerHTML=stats+toolbar+'<div class="guideModalTableWrapV48"><table class="guideModalTableV48"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Piso</th><th class="num">CAN SUM</th><th class="num">Inventario actual</th><th class="num">CAN MIN</th><th class="num">Dispo CENDIS</th><th>Estado</th></tr></thead><tbody>'+(trs||'<tr><td colspan="9"><div class="empty">No hay productos para este filtro.</div></td></tr>')+'</tbody></table></div><div class="foot" style="margin-top:9px"><span>Mostrando '+rows.length+' productos</span><span>Piso 3 es informativo y no afecta el cumplimiento.</span></div>';
    if(window.reorderAllProductTables)window.reorderAllProductTables();
  };
  window.reorderProductTable=function(table){
    if(!table)return;var hr=table.querySelector('thead tr');if(!hr)return;var heads=Array.from(hr.children),names=heads.map(function(h){return h.textContent.trim().toUpperCase().replace(/\s+/g,' ');});
    var img=names.indexOf('IMAGEN'),cod=names.findIndex(function(t){return t==='CÓDIGO'||t==='CODIGO';});
    if(img>=0&&cod>=0&&img>cod)Array.from(table.querySelectorAll('tr')).forEach(function(tr){var cells=Array.from(tr.children);if(cells[img]){var cell=cells[img];tr.removeChild(cell);tr.insertBefore(cell,tr.children[cod]);}});
    hr=table.querySelector('thead tr');if(!hr)return;heads=Array.from(hr.children);names=heads.map(function(h){return h.textContent.trim().toUpperCase().replace(/\s+/g,' ');});
    names.forEach(function(n,i){var cls='';if(n==='IMAGEN')cls='col-image';else if(n==='CÓDIGO'||n==='CODIGO')cls='col-code';else if(n.indexOf('PRODUCTO')>=0||n.indexOf('MATERIAL')>=0||n==='DESCRIPCIÓN'||n==='DESCRIPCION')cls='col-product';else if(n.indexOf('$')>=0||n.indexOf('VALOR')>=0||n.indexOf('VENTA')>=0||n.indexOf('DINERO')>=0||n.indexOf('PRECIO')>=0)cls='col-money';else if(n.indexOf('UNIDAD')>=0||n.indexOf('STOCK')>=0||n.indexOf('CAN ')===0||n==='P1'||n==='P2'||n.indexOf('%')>=0)cls='col-number';else if(n.indexOf('FECHA')>=0)cls='col-date';else if(n.indexOf('ESTADO')>=0||n.indexOf('GESTIÓN')>=0||n.indexOf('GESTION')>=0||n.indexOf('DISPO')>=0)cls='col-status';if(cls)Array.from(table.querySelectorAll('tr')).forEach(function(tr){if(tr.children[i])tr.children[i].classList.add(cls);});});
    table.classList.add('tableEnhancedV48');
  };
  window.reorderAllProductTables=function(){document.querySelectorAll('table').forEach(window.reorderProductTable);};
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.getElementById('guideDetailModalBackV48')&&document.getElementById('guideDetailModalBackV48').classList.contains('on'))closeGuideDetailV48();});
  setTimeout(function(){window.reorderAllProductTables();if(VIEW==='amb')refresh();},0);
})();


/* ===== llavero-v49-guide-detail-click-script ===== */
(function(){
  var activeGuideV49=null;
  function esc49(v){return typeof esc==='function'?esc(v):String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c;});}
  function getStore49(){try{return (typeof S!=='undefined'&&typeof CUR!=='undefined'&&CUR&&S[CUR])?S[CUR]:{};}catch(e){return {};}}
  function getGuides49(){
    var st=getStore49();
    if((!Array.isArray(st.guias)||!st.guias.length)&&typeof window.llaveroRebuildAllGuideData==='function'){
      try{window.llaveroRebuildAllGuideData();}catch(e){}
      st=getStore49();
    }
    return (Array.isArray(st.guias)?st.guias:[]).map(function(g){return {
      raw:g,code:String(g[0]),name:g[1]||'Guía',cat:g[2]||'',tot:toNum(g[3]),pres:toNum(g[4]),pp:g[5]||[0,0,0,0,0,0],prods:g[6]||[],comp:toNum(g[3])?Math.round(1000*toNum(g[4])/toNum(g[3]))/10:0
    };});
  }
  function state49(p){
    var st=p[5];
    if(st==='ok'||st==='ok_requested')return ['Con existencia en SEUS','gs-ok','covered'];
    if(st==='ok_inv')return ['Con existencia según inventario actual','gs-ok','covered'];
    if(st==='camino')return ['En traslado','gs-camino','camino'];
    if(st==='requested'||st==='requested_nostock')return ['Solicitud realizada','gs-requested','requested'];
    if(st==='available')return ['Puedes solicitar en CENDIS','gs-available','available'];
    return ['Sin disponibilidad','gs-sin','pending'];
  }
  function modal49(){
    var back=document.getElementById('guideDetailModalBackV49');
    if(back)return back;
    back=document.createElement('div');
    back.id='guideDetailModalBackV49';back.className='modalBack';
    back.innerHTML='<div class="modal guideDetailModalV49" role="dialog" aria-modal="true" aria-labelledby="guideDetailTitleV49"><div class="modalHead"><div><h3 id="guideDetailTitleV49">Detalle de guía</h3><p id="guideDetailSubV49">—</p></div><button class="modalClose" id="guideDetailCloseV49" type="button" aria-label="Cerrar">×</button></div><div class="guideDetailScrollV49" id="guideDetailBodyV49"></div></div>';
    back.addEventListener('click',function(e){if(e.target===back)window.closeGuideDetailV49();});
    document.body.appendChild(back);
    document.getElementById('guideDetailCloseV49').addEventListener('click',window.closeGuideDetailV49);
    return back;
  }
  function detailBtn49(type,value,label){
    var d=(state.guias&&state.guias.detail)||{floor:'all',status:'all',q:''};
    return '<button type="button" class="guideQuickBtnV48 '+(d[type]===value?'on':'')+'" data-detail-type="'+type+'" data-detail-value="'+value+'">'+label+'</button>';
  }
  window.closeGuideDetailV49=function(){var b=document.getElementById('guideDetailModalBackV49');if(b)b.classList.remove('on');document.body.style.overflow='';};
  window.openGuideDetailV49=function(code){
    var rows=getGuides49(),target=String(code==null?'':code);
    activeGuideV49=rows.find(function(r){return String(r.code)===target;})||null;
    if(!activeGuideV49){
      if(typeof toast==='function')toast('No fue posible encontrar el detalle de esta guía.','err');
      return false;
    }
    if(!state.guias)state.guias={sort:'comp',dir:-1,q:'',f:'all',exp:{}};
    state.guias.detail={floor:'all',status:'all',q:''};
    var b=modal49();b.classList.add('on');document.body.style.overflow='hidden';
    window.renderGuideDetailV49();
    setTimeout(function(){var c=document.getElementById('guideDetailCloseV49');if(c)c.focus();},0);
    return true;
  };
  window.openGuideDetailV48=window.openGuideDetailV49;
  window.renderGuideDetailV49=function(){
    if(!activeGuideV49)return;
    var r=activeGuideV49,d=state.guias.detail||{floor:'all',status:'all',q:''};
    var body=document.getElementById('guideDetailBodyV49');if(!body)return;
    var title=document.getElementById('guideDetailTitleV49'),sub=document.getElementById('guideDetailSubV49');
    if(title)title.textContent=r.name;
    if(sub)sub.textContent=r.code+' · '+r.cat+' · '+r.comp.toLocaleString('es-CO',{maximumFractionDigits:1})+'% de cumplimiento en Piso 1 y Piso 2';
    var rows=(r.prods||[]).map(function(p){var st=state49(p);return {p:p,stateText:st[0],stateClass:st[1],stateKey:st[2],floor:String(p[1]||'3'),code:String(p[0]),name:p[6]||((typeof P!=='undefined'&&P[p[0]])?P[p[0]].n:'')||'—'};});
    if(d.floor!=='all')rows=rows.filter(function(x){return x.floor===d.floor;});
    if(d.status!=='all')rows=rows.filter(function(x){return x.stateKey===d.status;});
    var q=String(d.q||'').trim().toLowerCase();if(q)rows=rows.filter(function(x){return (x.code+' '+x.name+' '+x.stateText).toLowerCase().indexOf(q)>=0;});
    var p1t=toNum(r.pp[1]),p1h=toNum(r.pp[0]),p2t=toNum(r.pp[3]),p2h=toNum(r.pp[2]),p3t=toNum(r.pp[5]),p3h=toNum(r.pp[4]);
    var stats='<div class="guideModalStatsV48"><div class="guideModalStatV48"><div class="l">Cumplimiento</div><div class="v">'+r.comp.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</div><div class="m">Piso 1 y Piso 2</div></div><div class="guideModalStatV48"><div class="l">Piso 1</div><div class="v">'+fInt(p1h)+' / '+fInt(p1t)+'</div><div class="m">Productos cubiertos</div></div><div class="guideModalStatV48"><div class="l">Piso 2</div><div class="v">'+fInt(p2h)+' / '+fInt(p2t)+'</div><div class="m">Productos cubiertos</div></div><div class="guideModalStatV48"><div class="l">Piso 3</div><div class="v">'+fInt(p3h)+' / '+fInt(p3t)+'</div><div class="m">Solo informativo</div></div><div class="guideModalStatV48"><div class="l">Pendientes P1+P2</div><div class="v">'+fInt(r.tot-r.pres)+'</div><div class="m">Productos por gestionar</div></div></div>';
    var toolbar='<div class="guideModalToolbarV48"><div class="tsearch">🔎<input id="guideDetailSearchV49" value="'+esc49(d.q||'')+'" placeholder="Buscar producto, código o estado…"></div><div class="guideFilterBarV48">'+detailBtn49('floor','all','Todos los pisos')+detailBtn49('floor','1','Piso 1')+detailBtn49('floor','2','Piso 2')+detailBtn49('floor','3','Piso 3')+detailBtn49('status','all','Todos los estados')+detailBtn49('status','covered','Cubiertos')+detailBtn49('status','pending','Pendientes')+detailBtn49('status','camino','En traslado')+detailBtn49('status','requested','Solicitud realizada')+detailBtn49('status','available','Puedes solicitar')+'</div></div>';
    var trs=rows.map(function(x){var p=x.p,record=!!p[7],inv=toNum(p[11]),disp=p[9]?(toNum(p[4])>0?'Sí · '+fInt(p[4])+' u':'No · 0 u'):'Sin dato',source=p[12]?'Inventario actual':(record?'SEUS':'Sin cruce');return '<tr class="guideProductOpenV49" data-product-code="'+esc49(x.code)+'"><td>'+imageThumb(x.code,'sm')+'</td><td><span class="code">'+esc49(x.code)+'</span></td><td class="col-product"><div class="guideProductName">'+esc49(x.name)+'</div><div class="guideExistSourceV48">Existencia validada con: '+source+'</div></td><td><span class="guideFloorBadgeV48 '+(x.floor==='3'?'info':'')+'">Piso '+x.floor+(x.floor==='3'?' · info':'')+'</span></td><td class="num">'+(record?fInt(p[2]):'Sin dato')+'</td><td class="num">'+fInt(inv)+'</td><td class="num">'+(record?fInt(p[3]):'Sin dato')+'</td><td class="num">'+disp+'</td><td><span class="guideStatus '+x.stateClass+'">'+x.stateText+'</span></td></tr>';}).join('');
    body.innerHTML=stats+toolbar+'<div class="guideDetailTableWrapV49"><table class="guideDetailTableV49"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Piso</th><th class="num">CAN SUM</th><th class="num">Inventario actual</th><th class="num">CAN MIN</th><th class="num">Dispo CENDIS</th><th>Estado</th></tr></thead><tbody>'+(trs||'<tr><td colspan="9"><div class="empty">No hay productos para este filtro.</div></td></tr>')+'</tbody></table></div><div class="foot" style="margin-top:9px"><span>Mostrando '+rows.length+' productos</span><span>Piso 3 es informativo y no afecta el cumplimiento.</span></div>';
    var input=document.getElementById('guideDetailSearchV49');if(input)input.addEventListener('input',function(){state.guias.detail.q=this.value;window.renderGuideDetailV49();});
    body.querySelectorAll('[data-detail-type]').forEach(function(btn){btn.addEventListener('click',function(){state.guias.detail[this.dataset.detailType]=this.dataset.detailValue;window.renderGuideDetailV49();});});
    body.querySelectorAll('.guideProductOpenV49').forEach(function(tr){tr.addEventListener('click',function(){var c=this.dataset.productCode;window.closeGuideDetailV49();setTimeout(function(){if(typeof openGuideProduct==='function')openGuideProduct(c);else if(typeof openBestProductDetail==='function')openBestProductDetail(c);},0);});});
    if(typeof window.reorderAllProductTables==='function')window.reorderAllProductTables();
  };
  function decorateRows49(){document.querySelectorAll('.guideListRowV48').forEach(function(row){row.setAttribute('aria-label','Abrir detalle de la guía');row.setAttribute('title','Haz clic para abrir el detalle de la guía');row.querySelectorAll('.guideOpenHintV49').forEach(function(h){h.remove();});});}
  document.addEventListener('click',function(e){var row=e.target&&e.target.closest?e.target.closest('.guideListRowV48'):null;if(!row)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();window.openGuideDetailV49(row.dataset.guideCode);},true);
  document.addEventListener('keydown',function(e){var row=e.target&&e.target.closest?e.target.closest('.guideListRowV48'):null;if(row&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();window.openGuideDetailV49(row.dataset.guideCode);}if(e.key==='Escape'){var b=document.getElementById('guideDetailModalBackV49');if(b&&b.classList.contains('on'))window.closeGuideDetailV49();}},true);
  setTimeout(decorateRows49,0);
  setTimeout(decorateRows49,0);
})();


/* ===== llavero-v50-guia-nombres-pisos-script ===== */
(function(){
  var activeGuideV50=null;
  function esc50(v){return typeof esc==='function'?esc(v):String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c;});}
  function currentStore50(){try{return (typeof S!=='undefined'&&typeof CUR!=='undefined'&&CUR&&S[CUR])?S[CUR]:{};}catch(e){return {};}}
  function guides50(){
    var st=currentStore50();
    if((!Array.isArray(st.guias)||!st.guias.length)&&typeof window.llaveroRebuildAllGuideData==='function'){
      try{window.llaveroRebuildAllGuideData();}catch(e){}
      st=currentStore50();
    }
    return (Array.isArray(st.guias)?st.guias:[]).map(function(g){return {raw:g,code:String(g[0]),name:g[1]||'Guía',cat:g[2]||'',tot:toNum(g[3]),pres:toNum(g[4]),pp:g[5]||[0,0,0,0,0,0],prods:g[6]||[],comp:toNum(g[3])?Math.round(1000*toNum(g[4])/toNum(g[3]))/10:0};});
  }
  function productState50(p){
    var st=p[5];
    if(st==='ok'||st==='ok_requested')return ['Con existencia en SEUS','gs-ok','covered'];
    if(st==='ok_inv')return ['Con existencia según inventario actual','gs-ok','covered'];
    if(st==='camino')return ['En traslado','gs-camino','camino'];
    if(st==='requested'||st==='requested_nostock')return ['Solicitud realizada','gs-requested','requested'];
    if(st==='available')return ['Puedes solicitar en CENDIS','gs-available','available'];
    return ['Sin disponibilidad','gs-sin','pending'];
  }
  function ensureModal50(){
    var back=document.getElementById('guideDetailModalBackV49');
    if(back)return back;
    back=document.createElement('div');back.id='guideDetailModalBackV49';back.className='modalBack';
    back.innerHTML='<div class="modal guideDetailModalV49" role="dialog" aria-modal="true" aria-labelledby="guideDetailTitleV49"><div class="modalHead"><div class="guideDetailTitleWrapV50"><h3 id="guideDetailTitleV49">Detalle de guía</h3><p id="guideDetailSubV49">—</p></div><button class="modalClose" id="guideDetailCloseV49" type="button" aria-label="Cerrar">×</button></div><div class="guideDetailScrollV49" id="guideDetailBodyV49"></div></div>';
    back.addEventListener('click',function(e){if(e.target===back)window.closeGuideDetailV49();});
    document.body.appendChild(back);
    document.getElementById('guideDetailCloseV49').addEventListener('click',window.closeGuideDetailV49);
    return back;
  }
  function detailBtn50(type,value,label){
    var d=(state.guias&&state.guias.detail)||{floor:'all',status:'all',q:''};
    return '<button type="button" class="guideQuickBtnV48 '+(d[type]===value?'on':'')+'" data-detail-type="'+type+'" data-detail-value="'+value+'">'+label+'</button>';
  }
  function row50(x){
    var p=x.p,record=!!p[7],inv=toNum(p[11]),disp=p[9]?(toNum(p[4])>0?'Sí · '+fInt(p[4])+' u':'No · 0 u'):'Sin dato',source=p[12]?'Inventario actual':(record?'SEUS':'Sin cruce');
    return '<tr class="guideProductOpenV50" data-product-code="'+esc50(x.code)+'"><td>'+imageThumb(x.code,'sm')+'</td><td><span class="code">'+esc50(x.code)+'</span></td><td class="col-product"><div class="guideProductName">'+esc50(x.name)+'</div><div class="guideExistSourceV48">Existencia validada con: '+source+'</div></td><td class="num">'+(record?fInt(p[2]):'Sin dato')+'</td><td class="num">'+fInt(inv)+'</td><td class="num">'+(record?fInt(p[3]):'Sin dato')+'</td><td class="num">'+disp+'</td><td class="col-status"><span class="guideStatus '+x.stateClass+'">'+x.stateText+'</span></td></tr>';
  }
  function floorSection50(floor,items){
    var covered=items.filter(function(x){return x.stateKey==='covered';}).length;
    var pending=items.length-covered;
    var isInfo=floor==='3';
    var label=isInfo?'PISO 3 · INFORMATIVO':'PISO '+floor;
    var meta=items.length+' productos · '+covered+' cubiertos · '+pending+' pendientes'+(isInfo?' · no afecta el cumplimiento':'');
    var trs=items.map(row50).join('');
    return '<section class="guideFloorBlockV50 '+(isInfo?'info':'')+'"><div class="guideFloorHeaderV50"><div class="title">'+label+'</div><div class="meta">'+meta+'</div></div><div class="guideFloorTableWrapV50"><table class="guideFloorTableV50"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th class="num">CAN SUM</th><th class="num">Inventario actual</th><th class="num">CAN MIN</th><th class="num">Dispo CENDIS</th><th>Estado</th></tr></thead><tbody>'+(trs||'<tr><td colspan="8"><div class="guideFloorEmptyV50">No hay productos para este piso con los filtros seleccionados.</div></td></tr>')+'</tbody></table></div></section>';
  }
  window.closeGuideDetailV49=function(){var b=document.getElementById('guideDetailModalBackV49');if(b)b.classList.remove('on');document.body.style.overflow='';};
  window.openGuideDetailV49=function(code){
    var target=String(code==null?'':code),all=guides50();
    activeGuideV50=all.find(function(r){return String(r.code)===target;})||null;
    if(!activeGuideV50){if(typeof toast==='function')toast('No fue posible encontrar el detalle de esta guía.','err');return false;}
    if(!state.guias)state.guias={sort:'comp',dir:-1,q:'',f:'all',exp:{}};
    state.guias.detail={floor:'all',status:'all',q:''};
    var back=ensureModal50();back.classList.add('on');document.body.style.overflow='hidden';
    window.renderGuideDetailV49();
    setTimeout(function(){var c=document.getElementById('guideDetailCloseV49');if(c)c.focus();},0);
    return true;
  };
  window.openGuideDetailV48=window.openGuideDetailV49;
  window.renderGuideDetailV49=function(){
    if(!activeGuideV50)return;
    var r=activeGuideV50,d=state.guias.detail||{floor:'all',status:'all',q:''},body=document.getElementById('guideDetailBodyV49');if(!body)return;
    var title=document.getElementById('guideDetailTitleV49'),sub=document.getElementById('guideDetailSubV49');
    if(title)title.textContent=r.name;
    if(sub)sub.textContent=r.code+' · '+r.cat+' · '+r.comp.toLocaleString('es-CO',{maximumFractionDigits:1})+'% de cumplimiento en Piso 1 y Piso 2';
    var rows=(r.prods||[]).map(function(p){var st=productState50(p);return {p:p,stateText:st[0],stateClass:st[1],stateKey:st[2],floor:String(p[1]||'3'),code:String(p[0]),name:p[6]||((typeof P!=='undefined'&&P[p[0]])?P[p[0]].n:'')||'—'};});
    if(d.status!=='all')rows=rows.filter(function(x){return x.stateKey===d.status;});
    var q=String(d.q||'').trim().toLowerCase();if(q)rows=rows.filter(function(x){return (x.code+' '+x.name+' '+x.stateText).toLowerCase().indexOf(q)>=0;});
    var p1t=toNum(r.pp[1]),p1h=toNum(r.pp[0]),p2t=toNum(r.pp[3]),p2h=toNum(r.pp[2]),p3t=toNum(r.pp[5]),p3h=toNum(r.pp[4]);
    var stats='<div class="guideModalStatsV48"><div class="guideModalStatV48"><div class="l">Cumplimiento</div><div class="v">'+r.comp.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</div><div class="m">Piso 1 y Piso 2</div></div><div class="guideModalStatV48"><div class="l">Piso 1</div><div class="v">'+fInt(p1h)+' / '+fInt(p1t)+'</div><div class="m">Productos cubiertos</div></div><div class="guideModalStatV48"><div class="l">Piso 2</div><div class="v">'+fInt(p2h)+' / '+fInt(p2t)+'</div><div class="m">Productos cubiertos</div></div><div class="guideModalStatV48"><div class="l">Piso 3</div><div class="v">'+fInt(p3h)+' / '+fInt(p3t)+'</div><div class="m">Solo informativo</div></div><div class="guideModalStatV48"><div class="l">Pendientes P1+P2</div><div class="v">'+fInt(r.tot-r.pres)+'</div><div class="m">Productos por gestionar</div></div></div>';
    var toolbar='<div class="guideModalToolbarV48"><div class="tsearch">🔎<input id="guideDetailSearchV50" value="'+esc50(d.q||'')+'" placeholder="Buscar producto, código o estado…"></div><div class="guideFilterBarV48">'+detailBtn50('floor','all','Todos los pisos')+detailBtn50('floor','1','Piso 1')+detailBtn50('floor','2','Piso 2')+detailBtn50('floor','3','Piso 3')+detailBtn50('status','all','Todos los estados')+detailBtn50('status','covered','Cubiertos')+detailBtn50('status','pending','Pendientes')+detailBtn50('status','camino','En traslado')+detailBtn50('status','requested','Solicitud realizada')+detailBtn50('status','available','Puedes solicitar')+'</div></div>';
    var floors=d.floor==='all'?['1','2','3']:[d.floor];
    var sections=floors.map(function(f){return floorSection50(f,rows.filter(function(x){return x.floor===f;}));}).join('');
    body.innerHTML=stats+toolbar+sections+'<div class="foot" style="margin-top:10px"><span>Mostrando '+rows.filter(function(x){return d.floor==='all'||x.floor===d.floor;}).length+' productos</span><span>Piso 3 es informativo y no afecta el cumplimiento.</span></div>';
    var input=document.getElementById('guideDetailSearchV50');if(input)input.addEventListener('input',function(){state.guias.detail.q=this.value;window.renderGuideDetailV49();});
    body.querySelectorAll('[data-detail-type]').forEach(function(btn){btn.addEventListener('click',function(){state.guias.detail[this.dataset.detailType]=this.dataset.detailValue;window.renderGuideDetailV49();});});
    body.querySelectorAll('.guideProductOpenV50').forEach(function(tr){tr.addEventListener('click',function(){var c=this.dataset.productCode;window.closeGuideDetailV49();setTimeout(function(){if(typeof openGuideProduct==='function')openGuideProduct(c);else if(typeof openBestProductDetail==='function')openBestProductDetail(c);},0);});});
    if(typeof window.reorderAllProductTables==='function')window.reorderAllProductTables();
  };
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){var b=document.getElementById('guideDetailModalBackV49');if(b&&b.classList.contains('on'))window.closeGuideDetailV49();}},true);
})();


/* ===== llavero-v51-quitar-p3-tabla-principal-script ===== */
(function(){
  function removeP3HeaderText(){
    document.querySelectorAll('.guideListTableV48 thead tr').forEach(function(tr){
      var cells=tr.children;
      for(var i=cells.length-1;i>=0;i--){
        var t=(cells[i].textContent||'').trim().toUpperCase();
        if(t==='P3 INFO'||t==='PISO 3'||t==='P3'){cells[i].style.display='none';}
      }
    });
  }
  var oldDraw=window.drawGuias;
  if(typeof oldDraw==='function'){
    window.drawGuias=function(){
      var r=oldDraw.apply(this,arguments);
      setTimeout(removeP3HeaderText,0);
      return r;
    };
  }
  setTimeout(function(){removeP3HeaderText();if(typeof VIEW!=='undefined'&&VIEW==='amb'&&typeof refresh==='function')refresh();},0);
})();


/* ===== llavero-v52-reestructura-script ===== */
(function(){
  var baseSetViewV52=window.setView;
  var baseRefreshV52=window.refresh;
  var baseViewAmbV52=window.viewAmb;
  var baseViewResumenV52=window.viewResumen;
  var baseRenderStoreTrackingV52=window.renderStoreTracking;

  function stateTagV52(v){
    var x=String(v||'').toUpperCase();
    if(x==='A')return '<span class="tag a">Pendiente</span>';
    if(x==='C')return '<span class="tag cr">OK</span>';
    return '<span style="color:var(--mut)">'+esc(v||'—')+'</span>';
  }
  window.viewTraslados=function(st){
    st=st||{};var rows=st.tr||[],k=st.kpi||{};
    var units=rows.reduce(function(a,r){return a+toNum(r&&r[2]);},0),vol=rows.reduce(function(a,r){return a+toNum(r&&r[3]);},0),pick=rows.filter(function(r){return String(r&&r[6]||'').toUpperCase()==='A';}).length,mov=rows.filter(function(r){return String(r&&r[7]||'').toUpperCase()==='A';}).length,rev=rows.filter(function(r){return String(r&&r[8]||'').toUpperCase()==='REVISAR';}).length;
    return '<div class="card"><div class="chead"><div class="cnum n3">⇄</div><div><div class="tt">Traslados en camino</div><div class="ds">Movimientos pendientes que se dirigen a la tienda seleccionada</div></div><div class="rt"><span class="badge cool">'+fInt(rows.length)+' líneas</span></div></div><div class="cbody">'+
      '<div class="mkpis"><div class="mk a"><div class="l">Líneas / entregas</div><div class="v">'+fInt(rows.length)+'</div></div><div class="mk a"><div class="l">Unidades</div><div class="v">'+fInt(units)+'</div></div><div class="mk a"><div class="l">Volumen m³</div><div class="v">'+vol.toLocaleString('es-CO',{maximumFractionDigits:3})+'</div></div><div class="mk r"><div class="l">Pend. picking</div><div class="v">'+fInt(pick)+'</div></div><div class="mk r"><div class="l">Pend. movimiento</div><div class="v">'+fInt(mov)+'</div></div><div class="mk b"><div class="l">Fecha a revisar</div><div class="v">'+fInt(rev)+'</div></div></div>'+
      '<div class="transferIntroV52"><span>ⓘ</span><div>Esta vista conserva la información que antes estaba dentro de Ambientes. Cada fila representa un producto en traslado; la imagen y la ficha detallada se relacionan mediante el código del producto.</div></div>'+
      '<div class="tbar"><div class="tsearch">🔎<input id="q-tr" value="'+esc(state.tr.q||'')+'" placeholder="Buscar producto, código o fecha…" oninput="state.tr.q=this.value;drawTr()"></div><span class="chip filt" data-q="tr" data-f="all">Todos</span><span class="chip filt" data-q="tr" data-f="pick">Pend. picking</span><span class="chip filt" data-q="tr" data-f="mov">Pend. movimiento</span><span class="chip filt" data-q="tr" data-f="rev">Fecha a revisar</span></div><div id="tr-tbl"></div><div class="foot"><span id="tr-cnt"></span><span>Haz clic en una fila para abrir el producto.</span></div></div></div>';
  };

  window.drawTr=drawTr=function(){
    var st=S[CUR]||{tr:[]},s=state.tr,all=(st.tr||[]),rows=all.slice();
    if(s.f==='pick')rows=rows.filter(function(r){return String(r&&r[6]||'').toUpperCase()==='A';});
    if(s.f==='mov')rows=rows.filter(function(r){return String(r&&r[7]||'').toUpperCase()==='A';});
    if(s.f==='rev')rows=rows.filter(function(r){return String(r&&r[8]||'').toUpperCase()==='REVISAR';});
    if(s.q){var q=String(s.q).toLowerCase();rows=rows.filter(function(r){return (String(r&&r[0]||'')+' '+String(r&&r[1]||'')+' '+String(r&&r[4]||'')+' '+String(r&&r[5]||'')).toLowerCase().indexOf(q)>=0;});}
    if(s.sort&&s.sort!=='st')rows.sort(cmp(s,{c:function(r){return r[0];},m:function(r){return r[1];},u:function(r){return r[2];},vol:function(r){return r[3];},fc:function(r){return r[4];}}));
    else rows.sort(function(a,b){return (String(a&&a[6]||'')!=='A')-(String(b&&b[6]||'')!=='A')||(String(a&&a[7]||'')!=='A')-(String(b&&b[7]||'')!=='A');});
    var body=rows.map(function(r){var c=safeCode(r&&r[0]);return '<tr class="transferRowV52" tabindex="0" data-code="'+esc(c)+'"><td>'+imageThumb(c,'sm')+'</td><td><span class="code">'+esc(c)+'</span></td><td><div class="pname" title="'+esc(r&&r[1]||'')+'">'+esc(r&&r[1]||'—')+'</div></td><td class="num"><b>'+fInt(r&&r[2])+'</b></td><td class="num">'+toNum(r&&r[3]).toLocaleString('es-CO',{maximumFractionDigits:3})+'</td><td>'+esc(safeText(r&&r[4],'—'))+'</td><td>'+esc(safeText(r&&r[5],'—'))+'</td><td>'+stateTagV52(r&&r[6])+'</td><td>'+stateTagV52(r&&r[7])+'</td><td>'+(String(r&&r[8]||'').toUpperCase()==='REVISAR'?'<span class="tag rev">REVISAR</span>':'<span class="tag ok">OK</span>')+'</td></tr>';}).join('');
    var html='<div class="twrap"><table class="transferModuleTableV52"><colgroup>'+Array(10).fill('<col>').join('')+'</colgroup><thead><tr><th>Imagen</th><th>Código</th><th>Producto / material</th><th class="num">Uds.</th><th class="num">m³</th><th>Creación</th><th>Entrega estimada</th><th>Picking</th><th>Movimiento</th><th>Fecha</th></tr></thead><tbody>'+(body||'<tr><td colspan="10"><div class="empty">No hay traslados para este filtro.</div></td></tr>')+'</tbody></table></div>';
    var el=document.getElementById('tr-tbl');if(el){el.innerHTML=html;el.querySelectorAll('.transferRowV52').forEach(function(tr){var open=function(e){if(e){e.preventDefault();}var c=tr.dataset.code;if(typeof openTransferProductV41==='function')openTransferProductV41(c);else if(typeof openInventoryProduct==='function')openInventoryProduct(c);};tr.onclick=open;tr.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(e);}};});}
    var cnt=document.getElementById('tr-cnt');if(cnt)cnt.textContent='Mostrando '+fInt(rows.length)+' de '+fInt(all.length)+' líneas';
    document.querySelectorAll('.chip.filt[data-q="tr"]').forEach(function(ch){ch.classList.toggle('on',(s.f||'all')===ch.dataset.f);ch.onclick=function(){s.f=ch.dataset.f;drawTr();};});
  };

  window.inventoryTableHTML=inventoryTableHTML=function(rows){
    var body=rows.map(function(r){return '<tr class="inventoryRow" data-code="'+esc(r.c)+'" tabindex="0"><td>'+imageThumb(r.c)+'</td><td><span class="code">'+esc(r.c)+'</span></td><td><button class="productOpen" onclick="event.stopPropagation();openInventoryProduct('+JSON.stringify(r.c)+')" title="Abrir detalle">'+esc(r.p.n)+'</button></td><td><div class="classificationCell"><span><b>Categoría:</b> '+esc(r.p.cat)+'</span><span><b>Línea:</b> '+esc(r.p.lin)+'</span><span><b>Sublínea:</b> '+esc(r.p.sub)+'</span></div></td><td>'+invStateHtml(r.estados)+'</td><td class="num"><b>'+fInt(r.stock)+'</b></td><td>'+invAgeHtml(r.rangos,r.stock)+'</td><td class="num">'+(r.dispCendis>0?'<span class="tag cr">'+fInt(r.dispCendis)+' u</span>':'<span class="tag sr">0 u</span>')+'</td><td class="num"><b>'+fMoneyCOP(r.valorInventario)+'</b></td></tr>';}).join('');
    return '<div class="twrap"><table class="inventoryTableV52"><colgroup>'+Array(9).fill('<col>').join('')+'</colgroup><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Clasificación</th><th>Estado</th><th class="num">Stock</th><th>Unidades por rango</th><th class="num">CENDIS</th><th class="num">Valor</th></tr></thead><tbody>'+(body||'<tr><td colspan="9"><div class="empty">Sin registros para este filtro.</div></td></tr>')+'</tbody></table></div>';
  };
  window.drawInventario=drawInventario=function(){
    var st=S[CUR]||{},s=state.inventario,all=normalizeInventoryRows(st).filter(function(r){return r.stock>0;});if(typeof syncInventoryFilters==='function')syncInventoryFilters(all);var rows=all.slice();
    if(s.f==='rot')rows=rows.filter(function(r){return r.estados.includes('Rotación');});if(s.f==='evac')rows=rows.filter(function(r){return r.estados.includes('Evacuación');});if(s.f==='360')rows=rows.filter(function(r){return Object.keys(r.rangos||{}).some(function(x){return ageRankFromLabel(x)>=6;});});if(s.f==='sr')rows=rows.filter(function(r){return r.dispCendis<=0;});if(s.cat)rows=rows.filter(function(r){return r.p.cat===s.cat;});if(s.lin)rows=rows.filter(function(r){return r.p.lin===s.lin;});if(s.sub)rows=rows.filter(function(r){return r.p.sub===s.sub;});if(s.q){var q=String(s.q).toLowerCase();rows=rows.filter(function(r){return (r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub+' '+safeText(r.familia,'')+' '+safeText(r.matriz,'')).toLowerCase().indexOf(q)>=0;});}
    rows.sort(cmp(s,{c:function(r){return r.c;},p:function(r){return r.p.n;},state:function(r){return r.estados.join(' ');},stock:function(r){return r.stock;},age:function(r){return Math.max(-1,...Object.keys(r.rangos||{}).map(ageRankFromLabel));},cendis:function(r){return r.dispCendis;},value:function(r){return r.valorInventario;}}));
    var total=rows.length,visible=rows.slice(0,s.limit||300),el=document.getElementById('inventario-tbl');if(el){el.innerHTML=inventoryTableHTML(visible)+(total>visible.length?'<div class="performanceMore"><button onclick="showMoreInventory()">Mostrar 300 más</button><span class="performanceNotice">'+fInt(visible.length)+' de '+fInt(total)+'</span></div>':'');el.querySelectorAll('.inventoryRow').forEach(function(tr){var open=function(e){if(e){e.preventDefault();}openInventoryProduct(tr.dataset.code);};tr.onclick=open;tr.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(e);}};});}
    var cnt=document.getElementById('inventario-cnt');if(cnt)cnt.textContent='Mostrando '+fInt(visible.length)+' de '+fInt(total)+' referencias filtradas · '+fInt(all.length)+' en inventario';document.querySelectorAll('.chip.filt[data-q="inventario"]').forEach(function(ch){ch.classList.toggle('on',s.f===ch.dataset.f);ch.onclick=function(){s.f=ch.dataset.f;s.limit=300;drawInventario();};});
  };

  function removeTransfersFromAmbV52(html){
    var marker='<div class="card"><div class="chead"><div class="cnum n3">⇄</div>';
    var i=String(html||'').indexOf(marker);
    if(i<0){var tt=String(html||'').indexOf('<div class="tt">Traslados en camino</div>');if(tt>=0)i=String(html||'').lastIndexOf('<div class="card"',tt);}
    return i>=0?String(html).slice(0,i):html;
  }
  window.viewAmb=viewAmb=function(st){return removeTransfersFromAmbV52(baseViewAmbV52(st));};

  function enhanceTrackingV52(){
    var panel=document.getElementById('storeTrackingPanel');if(panel&&!panel.querySelector('.trackingHowV52')){
      var controls=panel.querySelector('.trackingControls'),box=document.createElement('div');box.className='trackingHowV52';box.innerHTML='<div class="trackingHowItemV52"><b>Corte anterior</b><span>Compara el corte actual contra el último corte guardado antes de la fecha actual. Sirve para leer el cambio del día.</span></div><div class="trackingHowItemV52"><b>Corte base</b><span>Compara el corte actual contra el primer corte conservado. Sirve para medir el avance acumulado desde el inicio.</span></div><div class="trackingHowItemV52"><b>Cómo clasifica</b><span>Por tienda y código: gestionado, reducción parcial, persistente, nuevo o aumentó. Se calcula por separado para Rotación y Evacuación.</span></div>';if(controls)controls.insertAdjacentElement('afterend',box);else panel.querySelector('.cbody')?.prepend(box);
    }
    var table=panel&&panel.querySelector('.trackingTable');if(table){table.classList.add('trackingTableV52');var map={'Uds. ref.':'Uds. referencia','Uds. actual':'Uds. actuales','Dif. uds.':'Variación uds.','Valor ref.':'Valor referencia','Dif. valor':'Variación valor'};table.querySelectorAll('th').forEach(function(th){var t=th.textContent.trim();if(map[t])th.textContent=map[t];});}
    document.querySelectorAll('.card').forEach(function(card){var tt=card.querySelector('.tt');if(tt&&tt.textContent.trim()==='Resultado diario por tienda'){var t=card.querySelector('table');if(t)t.classList.add('leaderDailyV52');}});
  }
  window.viewResumen=viewResumen=function(st){return baseViewResumenV52(st);}; /* V82: el detalle histórico se abre bajo demanda desde las tarjetas. */
  if(typeof baseRenderStoreTrackingV52==='function')window.renderStoreTracking=renderStoreTracking=function(){baseRenderStoreTrackingV52();setTimeout(enhanceTrackingV52,0);};

  window.decorateActionColumn=decorateActionColumn=function(){};
  document.querySelectorAll('#nav a[data-v="acciones"]').forEach(function(x){x.remove();});

  window.setView=setView=function(v){
    if(v==='acciones')v='resumen';
    if(v==='traslados'){
      if(!isAuthenticated())return;VIEW='traslados';var st=S[CUR]||{name:'Tienda sin datos',kpi:{},tr:[]},c=document.getElementById('content');if(typeof setActiveNav==='function')setActiveNav('traslados');c.innerHTML=viewTraslados(st);drawTr();if(typeof animateBars==='function')animateBars();return;
    }
    baseSetViewV52(v);setTimeout(enhanceTrackingV52,0);
  };
  window.refresh=refresh=function(){baseRefreshV52();var st=S[CUR]||{},amb=document.getElementById('nc-amb'),tr=document.getElementById('nc-tr');if(amb)amb.textContent=fInt((st.guias||[]).length);if(tr)tr.textContent=fInt((st.tr||[]).length);setTimeout(enhanceTrackingV52,0);};

  DB.meta=DB.meta||{};DB.meta.modulosIncluidos=(DB.meta.modulosIncluidos||[]).filter(function(x){return String(x).toLowerCase().indexOf('plan de acción')<0&&String(x).toLowerCase().indexOf('plan de accion')<0;});if(DB.meta.modulosIncluidos.indexOf('Traslados')<0)DB.meta.modulosIncluidos.push('Traslados');
  setTimeout(function(){var st=S[CUR]||{},amb=document.getElementById('nc-amb'),tr=document.getElementById('nc-tr');if(amb)amb.textContent=fInt((st.guias||[]).length);if(tr)tr.textContent=fInt((st.tr||[]).length);if(VIEW==='amb'||VIEW==='resumen'||VIEW==='dashboard')refresh();},0);
})();


/* ===== llavero-v53-prox-interactive-script ===== */
(function(){
  function ensureProxState53(){
    state.prox=state.prox||{};
    if(!state.prox.risk)state.prox.risk='all';
    if(!state.prox.salesMode)state.prox.salesMode='all';
    if(!state.prox.cendisMode)state.prox.cendisMode='all';
    if(!state.prox.cat)state.prox.cat='all';
    if(!state.prox.sort)state.prox.sort='units';
    if(!state.prox.dir)state.prox.dir=-1;
    if(!state.prox.limit)state.prox.limit=300;
  }
  function categoryData53(rows){
    var m={};
    rows.forEach(function(r){var k=safeText(r.p&&r.p.cat,'Sin categoría');if(!m[k])m[k]={name:k,units:0,products:0,value:0};m[k].units+=toNum(r.units);m[k].products++;m[k].value+=toNum(r.value);});
    return Object.values(m).sort(function(a,b){return b.units-a.units;});
  }
  function filterWithoutCategory53(all){
    var rows=all.slice();
    if(state.prox.risk==='high')rows=rows.filter(function(r){return r.share>=50;});
    else if(state.prox.risk==='mid')rows=rows.filter(function(r){return r.share>=25&&r.share<50;});
    else if(state.prox.risk==='low')rows=rows.filter(function(r){return r.share<25;});
    if(state.prox.salesMode==='nosales')rows=rows.filter(function(r){return r.salesUnits<=0;});
    else if(state.prox.salesMode==='sales')rows=rows.filter(function(r){return r.salesUnits>0;});
    if(state.prox.cendisMode==='without')rows=rows.filter(function(r){return r.cendis<=0;});
    else if(state.prox.cendisMode==='with')rows=rows.filter(function(r){return r.cendis>0;});
    return rows;
  }
  function proxCategoryChart53(rows){
    var data=categoryData53(rows).slice(0,10),max=Math.max(1,...data.map(function(x){return x.units;}));
    if(!data.length)return '<div class="empty">Sin información para los filtros seleccionados.</div>';
    return '<div class="proxBarList">'+data.map(function(x){var on=state.prox.cat===x.name;return '<button type="button" class="proxBarButton '+(on?'on':'')+'" onclick="setProxCategory53('+JSON.stringify(x.name)+')" title="Filtrar la tabla por '+esc(x.name)+'"><span class="proxBarName">'+esc(x.name)+'</span><span class="proxBarTrack"><span class="proxBarFill" style="display:block;width:'+Math.max(3,x.units/max*100).toFixed(1)+'%"></span></span><span class="proxBarValue">'+fInt(x.units)+' u · '+fInt(x.products)+' prod.</span></button>';}).join('')+'</div>';
  }
  function proxRiskChart53(rows){
    var data=[
      {key:'high',label:'Alto ≥50%',count:rows.filter(function(r){return r.share>=50;}).length,units:rows.filter(function(r){return r.share>=50;}).reduce(function(a,r){return a+r.units;},0),cls:'proxRiskHighFill'},
      {key:'mid',label:'Medio 25–49%',count:rows.filter(function(r){return r.share>=25&&r.share<50;}).length,units:rows.filter(function(r){return r.share>=25&&r.share<50;}).reduce(function(a,r){return a+r.units;},0),cls:'proxRiskMidFill'},
      {key:'low',label:'Bajo <25%',count:rows.filter(function(r){return r.share<25;}).length,units:rows.filter(function(r){return r.share<25;}).reduce(function(a,r){return a+r.units;},0),cls:'proxRiskLowFill'}
    ],max=Math.max(1,...data.map(function(x){return x.units;}));
    return '<div class="proxRiskChart">'+data.map(function(x){return '<button type="button" class="proxRiskRow '+(state.prox.risk===x.key?'on':'')+'" onclick="setProxRisk53('+JSON.stringify(x.key)+')"><span class="proxRiskLabel">'+x.label+'</span><span class="proxRiskTrack"><span class="proxRiskFill '+x.cls+'" style="width:'+Math.max(x.units?4:0,x.units/max*100).toFixed(1)+'%"></span></span><span class="proxRiskValue">'+fInt(x.units)+' u · '+fInt(x.count)+'</span></button>';}).join('')+'</div>';
  }
  function stats53(rows,st){
    var inv=normalizeInventoryRows(st).reduce(function(a,r){return a+toNum(r.stock);},0),units=rows.reduce(function(a,r){return a+r.units;},0);
    return {products:rows.length,units:units,value:rows.reduce(function(a,r){return a+r.value;},0),share:inv?units/inv*100:0,noSales:rows.filter(function(r){return r.salesUnits<=0;}).length};
  }
  window.setProxRisk53=function(v){ensureProxState53();state.prox.risk=state.prox.risk===v?'all':v;state.prox.limit=300;drawProx();};
  window.setProxSales53=function(v){ensureProxState53();state.prox.salesMode=state.prox.salesMode===v?'all':v;state.prox.limit=300;drawProx();};
  window.setProxCendis53=function(v){ensureProxState53();state.prox.cendisMode=state.prox.cendisMode===v?'all':v;state.prox.limit=300;drawProx();};
  window.setProxCategory53=function(v){ensureProxState53();state.prox.cat=state.prox.cat===v?'all':v;state.prox.limit=300;drawProx();};
  window.resetProxFilters53=function(){ensureProxState53();state.prox.risk='all';state.prox.salesMode='all';state.prox.cendisMode='all';state.prox.cat='all';state.prox.q='';state.prox.sort='units';state.prox.dir=-1;state.prox.limit=300;var q=document.getElementById('q-prox');if(q)q.value='';drawProx();};
  window.proxKpi53=function(mode){ensureProxState53();if(mode==='all'){resetProxFilters53();return;}if(mode==='units'){state.prox.sort='units';state.prox.dir=-1;}else if(mode==='value'){state.prox.sort='value';state.prox.dir=-1;}else if(mode==='nosales'){state.prox.salesMode='nosales';state.prox.sort='units';state.prox.dir=-1;}state.prox.limit=300;drawProx();};
  window.viewProx=function(st){
    ensureProxState53();
    var all=upcomingRotationRows(st),s=stats53(all,st),base=filterWithoutCategory53(all);
    return '<div class="card"><div class="chead"><div class="cnum n1">◷</div><div><div class="tt">Próximos a rotar</div><div class="ds">Productos con unidades entre 60 y 90 días que requieren gestión preventiva</div></div><div class="rt"><span class="badge warm">'+fInt(all.length)+' productos</span></div></div><div class="cbody">'+
      '<div class="mkpis"><div class="mk r proxKpiClickable" data-prox-kpi="all" onclick="proxKpi53(\'all\')"><div class="l">Productos próximos</div><div class="v">'+fInt(s.products)+'</div><div class="meta">Haz clic para ver todos los productos del rango.</div></div><div class="mk r proxKpiClickable" data-prox-kpi="units" onclick="proxKpi53(\'units\')"><div class="l">Unidades 60–90 días</div><div class="v">'+fInt(s.units)+'</div><div class="meta">Ordena de mayor a menor cantidad próxima a rotar.</div></div><div class="mk r proxKpiClickable" data-prox-kpi="value" onclick="proxKpi53(\'value\')"><div class="l">Valor estimado</div><div class="v textKpi">'+fMoneyCOP(s.value)+'</div><div class="meta">Prioriza los productos con mayor dinero expuesto.</div></div><div class="mk b proxKpiClickable" data-prox-kpi="nosales" onclick="proxKpi53(\'nosales\')"><div class="l">Sin venta 3 meses</div><div class="v">'+fInt(s.noSales)+'</div><div class="meta">Filtra productos sin movimiento comercial reciente.</div></div></div>'+
      '<div class="proxGrid"><div class="proxChartCard"><div class="proxChartTitle">Unidades próximas a rotar por categoría</div><div class="proxChartSub">Haz clic en una categoría para filtrar la tabla.</div><div id="prox-chart">'+proxCategoryChart53(base)+'</div></div><div class="proxInsight"><div class="proxChartTitle">Nivel de exposición</div><div class="proxChartSub">Haz clic en un nivel para consultar los productos relacionados.</div><div id="prox-risk-chart">'+proxRiskChart53(base)+'</div></div></div>'+
      '<div class="tbar"><div class="tsearch">🔎<input id="q-prox" value="'+esc(state.prox.q||'')+'" placeholder="Buscar producto, código, categoría, línea o sublínea…" oninput="state.prox.q=this.value;state.prox.limit=300;drawProx()"></div></div>'+
      '<div class="proxFilterGroups">'+
        '<div class="proxFilterGroup"><span class="proxFilterGroupLabel">Riesgo</span><button class="proxQuickBtn" data-prox-risk="all" onclick="state.prox.risk=\'all\';drawProx()">Todos</button><button class="proxQuickBtn" data-prox-risk="high" onclick="setProxRisk53(\'high\')">Alto ≥50%</button><button class="proxQuickBtn" data-prox-risk="mid" onclick="setProxRisk53(\'mid\')">Medio 25–49%</button><button class="proxQuickBtn" data-prox-risk="low" onclick="setProxRisk53(\'low\')">Bajo &lt;25%</button></div>'+
        '<div class="proxFilterGroup"><span class="proxFilterGroupLabel">Ventas 3m</span><button class="proxQuickBtn" data-prox-sales="all" onclick="state.prox.salesMode=\'all\';drawProx()">Todas</button><button class="proxQuickBtn" data-prox-sales="nosales" onclick="setProxSales53(\'nosales\')">Sin ventas</button><button class="proxQuickBtn" data-prox-sales="sales" onclick="setProxSales53(\'sales\')">Con ventas</button></div>'+
        '<div class="proxFilterGroup"><span class="proxFilterGroupLabel">CENDIS</span><button class="proxQuickBtn" data-prox-cendis="all" onclick="state.prox.cendisMode=\'all\';drawProx()">Todos</button><button class="proxQuickBtn" data-prox-cendis="without" onclick="setProxCendis53(\'without\')">Sin respaldo</button><button class="proxQuickBtn" data-prox-cendis="with" onclick="setProxCendis53(\'with\')">Con respaldo</button><button class="proxClearAll" onclick="resetProxFilters53()">Limpiar filtros</button></div>'+
        '<div class="proxActiveFilters" id="prox-active-filters"></div>'+
      '</div><div id="prox-tbl"></div><div class="foot"><span id="prox-count"></span><span>Haz clic sobre un producto para abrir su informe detallado.</span></div></div></div>';
  };
  window.drawProx=function(){
    ensureProxState53();
    var st=S[CUR]||{},all=upcomingRotationRows(st),base=filterWithoutCategory53(all),rows=base.slice(),q=String(state.prox.q||'').toLowerCase();
    if(state.prox.cat&&state.prox.cat!=='all')rows=rows.filter(function(r){return safeText(r.p&&r.p.cat,'Sin categoría')===state.prox.cat;});
    if(q)rows=rows.filter(function(r){return (r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub).toLowerCase().includes(q);});
    var key=state.prox.sort,dir=state.prox.dir;
    rows.sort(function(a,b){var av=key==='product'?a.p.n:key==='category'?a.p.cat:key==='stock'?a.stock:key==='share'?a.share:key==='value'?a.value:key==='sales'?a.salesUnits:key==='cendis'?a.cendis:a.units,bv=key==='product'?b.p.n:key==='category'?b.p.cat:key==='stock'?b.stock:key==='share'?b.share:key==='value'?b.value:key==='sales'?b.salesUnits:key==='cendis'?b.cendis:b.units;if(typeof av==='string')return av.localeCompare(bv)*dir;return (toNum(av)-toNum(bv))*dir;});
    var visible=rows.slice(0,state.prox.limit),body=visible.map(function(r){var cls=r.share>=50?'proxRiskHigh':r.share>=25?'proxRiskMid':'proxRiskLow';return '<tr class="proxRow" data-code="'+esc(r.c)+'" data-product-code="'+esc(r.c)+'" tabindex="0" role="button" aria-label="Ver información detallada del producto '+esc(r.c)+'" title="Presiona para ver la información detallada del producto"><td class="proxClickableCell">'+imageThumb(r.c,'sm')+'</td><td class="proxClickableCell"><span class="code">'+esc(r.c)+'</span></td><td class="proxClickableCell"><button class="productOpen proxProductBtn" type="button" onclick="event.stopPropagation();openInventoryProduct('+JSON.stringify(r.c)+')" title="Abrir detalle del producto"><div class="proxProductName">'+esc(r.p.n)+'</div><div class="proxProductMeta">'+fInt(r.salesUnits)+' uds vendidas en 3 meses</div></button></td><td class="proxClickableCell"><b>'+esc(r.p.cat)+'</b><div class="proxProductMeta">'+esc(r.p.lin)+' · '+esc(r.p.sub)+'</div></td><td class="num"><span class="proxAgeBadge">'+fInt(r.units)+' u</span></td><td class="num"><b>'+fInt(r.stock)+'</b></td><td class="num"><span class="'+cls+'">'+r.share.toFixed(1)+'%</span></td><td class="num"><b>'+fMoneyCOP(r.value)+'</b></td><td class="num">'+(r.cendis>0?'<span class="tag cr">'+fInt(r.cendis)+' u</span>':'<span class="tag sr">0 u</span>')+'</td></tr>';}).join('');
    var table='<div class="twrap"><table><thead><tr><th>Imagen</th><th onclick="sortProx(\'code\')">Código</th><th onclick="sortProx(\'product\')">Producto</th><th onclick="sortProx(\'category\')">Clasificación</th><th class="num" onclick="sortProx(\'units\')">Uds. 60–90</th><th class="num" onclick="sortProx(\'stock\')">Stock total</th><th class="num" onclick="sortProx(\'share\')">% del stock</th><th class="num" onclick="sortProx(\'value\')">Valor estimado</th><th class="num" onclick="sortProx(\'cendis\')">CENDIS</th></tr></thead><tbody>'+(body||'<tr><td colspan="9"><div class="empty">No hay productos que cumplan los filtros seleccionados.</div></td></tr>')+'</tbody></table></div>'+(rows.length>visible.length?'<div class="proxLoadMore"><button class="actionBtn" onclick="loadMoreProx()">Mostrar 300 más</button></div>':'');
    var el=document.getElementById('prox-tbl');if(el){el.innerHTML=table;el.querySelectorAll('.proxRow').forEach(function(tr){var open=function(e){if(e){e.preventDefault();}openInventoryProduct(tr.dataset.code);};tr.onclick=open;tr.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(e);}};});}
    var cnt=document.getElementById('prox-count');if(cnt)cnt.textContent='Mostrando '+fInt(visible.length)+' de '+fInt(rows.length)+' productos · '+fInt(rows.reduce(function(a,r){return a+r.units;},0))+' unidades en 60–90 días';
    document.querySelectorAll('[data-prox-risk]').forEach(function(x){x.classList.toggle('on',x.dataset.proxRisk===state.prox.risk);});
    document.querySelectorAll('[data-prox-sales]').forEach(function(x){x.classList.toggle('on',x.dataset.proxSales===state.prox.salesMode);});
    document.querySelectorAll('[data-prox-cendis]').forEach(function(x){x.classList.toggle('on',x.dataset.proxCendis===state.prox.cendisMode);});
    document.querySelectorAll('[data-prox-kpi]').forEach(function(x){x.classList.remove('on');});
    if(state.prox.salesMode==='nosales'){var nk=document.querySelector('[data-prox-kpi="nosales"]');if(nk)nk.classList.add('on');}
    var active=[];if(state.prox.risk!=='all')active.push('Riesgo: '+({high:'alto',mid:'medio',low:'bajo'}[state.prox.risk]||state.prox.risk));if(state.prox.salesMode!=='all')active.push(state.prox.salesMode==='nosales'?'Sin ventas 3m':'Con ventas 3m');if(state.prox.cendisMode!=='all')active.push(state.prox.cendisMode==='without'?'Sin respaldo CENDIS':'Con respaldo CENDIS');if(state.prox.cat!=='all')active.push('Categoría: '+state.prox.cat);
    var af=document.getElementById('prox-active-filters');if(af)af.innerHTML=active.length?'<b>Filtros activos:</b> '+esc(active.join(' · ')):'Sin filtros adicionales. Se muestran todos los productos próximos a rotar.';
    var chart=document.getElementById('prox-chart');if(chart)chart.innerHTML=proxCategoryChart53(base);
    var risk=document.getElementById('prox-risk-chart');if(risk)risk.innerHTML=proxRiskChart53(all.filter(function(r){if(state.prox.salesMode==='nosales'&&r.salesUnits>0)return false;if(state.prox.salesMode==='sales'&&r.salesUnits<=0)return false;if(state.prox.cendisMode==='without'&&r.cendis>0)return false;if(state.prox.cendisMode==='with'&&r.cendis<=0)return false;return true;}));
    if(window.reorderAllProductTables)window.reorderAllProductTables();
  };
  var oldSetProxCategory=window.setProxCategory;window.setProxCategory=function(v){setProxCategory53(v);};
  setTimeout(function(){if(VIEW==='prox')setView('prox');},0);
})();


/* ===== llavero-v55-filtros-compactos-script ===== */
(function(){
  function proxButton(label,action,key,value){
    return '<button type="button" class="proxUnifiedBtn" data-prox-key="'+key+'" data-prox-value="'+value+'" onclick="'+action+'">'+label+'</button>';
  }
  function guideButton(label,filter){
    return '<button type="button" class="guideUnifiedBtn" data-guide-filter="'+filter+'" onclick="setGuideFilterV48('+JSON.stringify(filter)+')">'+label+'</button>';
  }
  function transformProx(html){
    var box=document.createElement('div');box.innerHTML=html;
    var oldToolbar=box.querySelector('.tbar'),groups=box.querySelector('.proxFilterGroups');
    if(!oldToolbar||!groups)return html;
    var search=oldToolbar.querySelector('.tsearch');
    var toolbar=document.createElement('div');toolbar.className='proxUnifiedToolbar';
    if(search)toolbar.appendChild(search.cloneNode(true));
    var filters=document.createElement('div');filters.className='proxUnifiedFilters';
    filters.innerHTML=
      proxButton('Todos','resetProxFilters53()','all','all')+
      proxButton('Alto ≥50%','setProxRisk53(\'high\')','risk','high')+
      proxButton('Medio 25–49%','setProxRisk53(\'mid\')','risk','mid')+
      proxButton('Bajo <25%','setProxRisk53(\'low\')','risk','low')+
      proxButton('Sin ventas','setProxSales53(\'nosales\')','sales','nosales')+
      proxButton('Con ventas','setProxSales53(\'sales\')','sales','sales')+
      proxButton('Sin respaldo','setProxCendis53(\'without\')','cendis','without')+
      proxButton('Con respaldo','setProxCendis53(\'with\')','cendis','with');
    toolbar.appendChild(filters);
    oldToolbar.replaceWith(toolbar);
    groups.remove();
    return box.innerHTML;
  }
  function transformAmb(html){
    var box=document.createElement('div');box.innerHTML=html;
    var input=box.querySelector('#q-guias');if(!input)return html;
    var oldToolbar=input.closest('.tbar');if(!oldToolbar)return html;
    var search=oldToolbar.querySelector('.tsearch');
    var toolbar=document.createElement('div');toolbar.className='guideUnifiedToolbar';
    if(search)toolbar.appendChild(search.cloneNode(true));
    var filters=document.createElement('div');filters.className='guideUnifiedFilters';
    filters.innerHTML=
      guideButton('Todos','all')+
      guideButton('Completas','completas')+
      guideButton('Con avance','avance')+
      guideButton('En traslado','camino')+
      guideButton('Solicitud realizada','requested')+
      guideButton('Puedes solicitar','available');
    toolbar.appendChild(filters);
    oldToolbar.replaceWith(toolbar);
    var info=box.querySelector('#guideFilterInfoV48');if(info)info.remove();
    return box.innerHTML;
  }
  function updateProxButtons(){
    if(!window.state||!state.prox)return;
    var all=state.prox.risk==='all'&&state.prox.salesMode==='all'&&state.prox.cendisMode==='all'&&state.prox.cat==='all';
    document.querySelectorAll('.proxUnifiedBtn').forEach(function(btn){
      var key=btn.dataset.proxKey,val=btn.dataset.proxValue,on=false;
      if(key==='all')on=all;
      else if(key==='risk')on=state.prox.risk===val;
      else if(key==='sales')on=state.prox.salesMode===val;
      else if(key==='cendis')on=state.prox.cendisMode===val;
      btn.classList.toggle('on',on);
    });
  }
  function updateGuideButtons(){
    if(!window.state||!state.guias)return;
    document.querySelectorAll('.guideUnifiedBtn').forEach(function(btn){btn.classList.toggle('on',btn.dataset.guideFilter===(state.guias.f||'all'));});
  }
  var baseViewProx=window.viewProx;
  if(typeof baseViewProx==='function')window.viewProx=function(st){return transformProx(baseViewProx(st));};
  var baseDrawProx=window.drawProx;
  if(typeof baseDrawProx==='function')window.drawProx=function(){var r=baseDrawProx.apply(this,arguments);updateProxButtons();return r;};
  var baseViewAmb=window.viewAmb;
  if(typeof baseViewAmb==='function')window.viewAmb=function(st){return transformAmb(baseViewAmb(st));};
  var baseDrawGuias=window.drawGuias;
  if(typeof baseDrawGuias==='function')window.drawGuias=function(){var r=baseDrawGuias.apply(this,arguments);updateGuideButtons();return r;};
  setTimeout(function(){
    if(VIEW==='prox'||VIEW==='amb')refresh();
    updateProxButtons();updateGuideButtons();
  },0);
})();


/* ===== llavero-v56-filtros-iguales-rot-evac-script ===== */
(function(){
  const baseViewProxV56=window.viewProx;
  const baseDrawProxV56=window.drawProx;
  const baseViewAmbV56=window.viewAmb;
  const baseDrawGuiasV56=window.drawGuias;

  function proxChip(label,key,value,action){
    return '<span class="chip filt" data-prox-key="'+key+'" data-prox-value="'+value+'" onclick="'+action+'">'+label+'</span>';
  }
  function guideChip(label,value){
    return '<span class="chip filt" data-q="guias" data-f="'+value+'" onclick="state.guias.f='+JSON.stringify(value)+';drawGuias()">'+label+'</span>';
  }
  function replaceToolbar(html,inputId,toolbarClass,buttonsHtml){
    const box=document.createElement('div');
    box.innerHTML=String(html||'');
    const input=box.querySelector('#'+inputId);
    if(!input)return html;
    const old=input.closest('.proxUnifiedToolbar,.guideUnifiedToolbar,.tbar');
    if(!old)return html;
    const search=old.querySelector('.tsearch');
    const toolbar=document.createElement('div');
    toolbar.className='tbar '+toolbarClass;
    if(search)toolbar.appendChild(search.cloneNode(true));
    const temp=document.createElement('div');
    temp.innerHTML=buttonsHtml;
    while(temp.firstChild)toolbar.appendChild(temp.firstChild);
    old.replaceWith(toolbar);
    return box.innerHTML;
  }
  window.viewProx=function(st){
    let html=baseViewProxV56(st);
    const buttons=
      proxChip('Todos','all','all','resetProxFilters53()')+
      proxChip('Alto ≥50%','risk','high','setProxRisk53(\'high\')')+
      proxChip('Medio 25–49%','risk','mid','setProxRisk53(\'mid\')')+
      proxChip('Bajo <25%','risk','low','setProxRisk53(\'low\')')+
      proxChip('Sin venta 3m','sales','nosales','setProxSales53(\'nosales\')')+
      proxChip('Con ventas','sales','sales','setProxSales53(\'sales\')')+
      proxChip('Sin respaldo','cendis','without','setProxCendis53(\'without\')')+
      proxChip('Con respaldo','cendis','with','setProxCendis53(\'with\')');
    return replaceToolbar(html,'q-prox','proxNativeToolbar',buttons);
  };
  function syncProxChipsV56(){
    if(!state.prox)return;
    const all=(state.prox.risk||'all')==='all'&&(state.prox.salesMode||'all')==='all'&&(state.prox.cendisMode||'all')==='all'&&(state.prox.cat||'all')==='all';
    document.querySelectorAll('.proxNativeToolbar .chip').forEach(function(ch){
      const key=ch.dataset.proxKey,val=ch.dataset.proxValue;
      let on=false;
      if(key==='all')on=all;
      else if(key==='risk')on=state.prox.risk===val;
      else if(key==='sales')on=state.prox.salesMode===val;
      else if(key==='cendis')on=state.prox.cendisMode===val;
      ch.classList.toggle('on',on);
    });
  }
  window.drawProx=function(){
    const out=baseDrawProxV56.apply(this,arguments);
    syncProxChipsV56();
    return out;
  };

  window.viewAmb=function(st){
    let html=baseViewAmbV56(st);
    const buttons=
      guideChip('Todas','all')+
      guideChip('Completas','completas')+
      guideChip('Con avance','avance')+
      guideChip('En traslado','camino')+
      guideChip('Solicitud realizada','requested')+
      guideChip('Puedes solicitar','available');
    return replaceToolbar(html,'q-guias','guideNativeToolbar',buttons);
  };
  function syncGuideChipsV56(){
    const f=(state.guias&&state.guias.f)||'all';
    document.querySelectorAll('.guideNativeToolbar .chip').forEach(function(ch){
      ch.classList.toggle('on',ch.dataset.f===f);
      ch.onclick=function(){state.guias.f=ch.dataset.f;drawGuias();};
    });
  }
  window.drawGuias=function(){
    const out=baseDrawGuiasV56.apply(this,arguments);
    syncGuideChipsV56();
    return out;
  };
  setTimeout(function(){
    if(VIEW==='prox'||VIEW==='amb')refresh();
  },0);
})();


/* ===== llavero-v57-prox-click-fix ===== */
(function(){
  function bindProxRowClicks(){
    var root=document.getElementById('prox-tbl');
    if(!root)return;
    var rows=root.querySelectorAll('tbody tr');
    rows.forEach(function(tr){
      if(tr.dataset.empty==='1' || tr.querySelector('.empty'))return;
      var codeCell=tr.children && tr.children[1];
      if(!codeCell)return;
      var code=(codeCell.textContent||'').trim();
      if(!code)return;
      tr.style.cursor='pointer';
      tr.setAttribute('role','button');
      tr.setAttribute('tabindex','0');
      var go=function(ev){
        if(ev && ev.target){
          var tag=(ev.target.tagName||'').toLowerCase();
          if(tag==='a' || tag==='button' || tag==='input' || tag==='select' || tag==='textarea')return;
        }
        if(typeof openInventoryProduct==='function')openInventoryProduct(code);
      };
      tr.onclick=go;
      tr.onkeydown=function(ev){if(ev.key==='Enter' || ev.key===' '){ev.preventDefault();go(ev);}};
      [0,1,2].forEach(function(idx){
        var td=tr.children[idx];
        if(!td)return;
        td.style.cursor='pointer';
        td.title='Abrir detalle del producto';
      });
    });
  }
  var prev=window.drawProx;
  if(typeof prev==='function'){
    window.drawProx=function(){
      var out=prev.apply(this,arguments);
      bindProxRowClicks();
      return out;
    };
  }
  var refreshPrev=window.refresh;
  if(typeof refreshPrev==='function'){
    window.refresh=function(){
      var out=refreshPrev.apply(this,arguments);
      if(window.VIEW==='prox' || (typeof VIEW!=='undefined' && VIEW==='prox')){
        setTimeout(bindProxRowClicks,0);
      }
      return out;
    };
  }
  setTimeout(bindProxRowClicks,0);
})();


/* ===== llavero-v56-prox-click-standard-script ===== */
(function(){
  function cleanProxCode(v){
    var raw=String(v==null?'':v).trim();
    if(!raw)return '';
    try{return typeof safeCode==='function'?safeCode(raw):raw;}
    catch(e){return raw;}
  }
  function proxRowFromTarget(target){
    return target&&target.closest?target.closest('#prox-tbl tbody tr.proxRow'):null;
  }
  function proxCode(row){
    if(!row)return '';
    return cleanProxCode(row.dataset.productCode||row.dataset.code||row.querySelector('.code')?.textContent||'');
  }
  function openProxProduct(code){
    var c=cleanProxCode(code);if(!c)return;
    if(typeof openBestProductDetail==='function')openBestProductDetail(c);
    else if(typeof openInventoryProduct==='function')openInventoryProduct(c);
  }
  document.addEventListener('click',function(event){
    var row=proxRowFromTarget(event.target);if(!row)return;
    if(event.target.closest('.productThumb'))return;
    var code=proxCode(row);if(!code)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openProxProduct(code);
  },true);
  document.addEventListener('keydown',function(event){
    if(event.key!=='Enter'&&event.key!==' ')return;
    var row=proxRowFromTarget(event.target);if(!row)return;
    var code=proxCode(row);if(!code)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openProxProduct(code);
  },true);
})();


/* ===== llavero-v59-auditable-dashboard-script ===== */
(function(){
  'use strict';
  var V59={rows:[],mode:'movement',movement:'recovered',state:'all',store:'all',q:'',limit:200,title:'',subtitle:''};
  function n(v){return Number(v)||0;}
  function fmtDate59(v){var s=String(v||'');return s? s.split('-').reverse().join('/'):'—';}
  function mergeByDate59(a,b){var m={};(a||[]).concat(b||[]).forEach(function(x){if(x&&x.date)m[String(x.date)]=x;});return Object.keys(m).sort().map(function(k){return m[k];});}
  function importHistory59(h){
    if(!h||typeof h!=='object')return;
    try{
      var daily=mergeByDate59(readStoredArray(DAILY_HISTORY_KEY),Array.isArray(h.daily)?h.daily:[]);
      var details=mergeByDate59(readStoredArray(DETAIL_HISTORY_KEY),Array.isArray(h.details)?h.details:[]);
      if(daily.length)saveStoredArray(DAILY_HISTORY_KEY,daily.slice(-180));
      if(details.length)saveStoredArray(DETAIL_HISTORY_KEY,(details.length<=60?details:[details[0]].concat(details.slice(-59))));
    }catch(e){console.warn('No se pudo importar el histórico compartido',e);}
  }
  var originalApply59=window.applyNewDB;
  if(typeof originalApply59==='function')window.applyNewDB=function(newDB,opts){if(newDB&&newDB.H)importHistory59(newDB.H);return originalApply59(newDB,opts);};
  window.recordOperationalSnapshot=function(){
    if(!Object.keys(S||{}).length)return;
    var current=buildDetailedSnapshot(),details=readDetailHistory(),previous=details.filter(function(x){return String(x.date)<String(current.date);}).pop()||null,stores={};
    Object.keys(current.stores).forEach(function(code){stores[code]=buildStoreDailySummary(current.stores[code],previous&&previous.stores&&previous.stores[code]);});
    var summary={date:current.date,stores:stores,hasPrevious:!!previous,previousDate:previous?previous.date:null};
    var daily=readStoredArray(DAILY_HISTORY_KEY).filter(function(x){return x&&x.date!==current.date;});daily.push(summary);daily.sort(function(a,b){return String(a.date).localeCompare(String(b.date));});saveStoredArray(DAILY_HISTORY_KEY,daily.slice(-180));
    var next=details.filter(function(x){return x&&x.date!==current.date;});next.push(current);next=mergeByDate59([],next);if(next.length>3)next=[next[0]].concat(next.slice(-2));saveStoredArray(DETAIL_HISTORY_KEY,next);
  };

  function ensureModal59(){
    var back=document.getElementById('leaderAuditModalBack59');if(back)return back;
    back=document.createElement('div');back.id='leaderAuditModalBack59';back.className='modalBack';
    back.onclick=function(e){if(e.target===back)closeLeaderAudit59();};
    back.innerHTML='<div class="modal leaderAuditModal59" role="dialog" aria-modal="true" aria-labelledby="leaderAuditTitle59"><div class="modalHead"><div><h3 id="leaderAuditTitle59">Detalle comparativo</h3><p id="leaderAuditSubtitle59">Información por tienda y producto</p></div><button class="modalClose" type="button" onclick="closeLeaderAudit59()" aria-label="Cerrar">×</button></div><div class="modalBody leaderAuditBody59" id="leaderAuditBody59"></div></div>';
    document.body.appendChild(back);return back;
  }
  window.closeLeaderAudit59=function(){var x=document.getElementById('leaderAuditModalBack59');if(x)x.classList.remove('on');};
  function pair59(){
    var current=buildDetailedSnapshot(),hist=readDetailHistory().filter(function(x){return x&&x.date;}).sort(function(a,b){return String(a.date).localeCompare(String(b.date));});
    var prev=hist.filter(function(x){return String(x.date)<String(current.date);}).pop()||null;
    return {current:current,previous:prev,base:hist[0]||null};
  }
  function map59(rows){var m={};(rows||[]).forEach(function(r){var c=safeCode(r&&r[0]);if(!c)return;if(!m[c])m[c]={u:0,v:0,age:-1};m[c].u+=n(r&&r[1]);m[c].v+=n(r&&r[2]);m[c].age=Math.max(m[c].age,n(r&&r[3]));});return m;}
  function stateLabel59(k){return k==='rot'?'Rotación':'Evacuación';}
  function stateClass59(k){return k==='rot'?'rot':'evac';}
  function product59(c){var p=(P&&P[c])||{};return {n:safeText(p.n,'Producto '+c),cat:safeText(p.cat,'Sin clasificar'),lin:safeText(p.lin,'Sin línea'),sub:safeText(p.sub,'Sin sublínea')};}
  function storeName59(code,snap){return safeText((snap&&snap.stores&&snap.stores[code]&&snap.stores[code].name)||(S[code]&&S[code].name),code);}
  function criticalMap59(store){
    var out={};['rot','evac'].forEach(function(st){var m=map59(store&&store[st]);Object.keys(m).forEach(function(c){if(!out[c])out[c]={u:0,v:0,states:[]};out[c].u+=m[c].u;out[c].v+=m[c].v;out[c].states.push(st);});});return out;
  }
  function movementRows59(type,storeOnly){
    var p=pair59(),cur=p.current,prev=p.previous;if(!prev)return [];
    var rows=[],stores=new Set(Object.keys(cur.stores||{}).concat(Object.keys(prev.stores||{})));
    stores.forEach(function(store){if(storeOnly&&store!==storeOnly)return;var cm=criticalMap59(cur.stores&&cur.stores[store]),pm=criticalMap59(prev.stores&&prev.stores[store]),codes=new Set(Object.keys(cm).concat(Object.keys(pm)));
      codes.forEach(function(c){var a=pm[c]||null,b=cm[c]||null,kind=a&&!b?'recovered':!a&&b?'new':a&&b?'persistent':'';if(kind!==type)return;var prevStates=a?a.states:[],curStates=b?b.states:[],primary=(type==='recovered'?prevStates[0]:curStates[0])||prevStates[0]||'rot',pr=product59(c);
        var storeName=storeName59(store,cur),searchText=(c+' '+pr.n+' '+pr.cat+' '+pr.lin+' '+pr.sub+' '+storeName).toLowerCase();rows.push({kind:kind,state:primary,prevStates:prevStates,curStates:curStates,store:store,storeName:storeName,code:c,p:pr,prevU:a?n(a.u):0,currentU:b?n(b.u):0,prevV:a?n(a.v):0,currentV:b?n(b.v):0,exited:Math.max(0,n(a&&a.u)-n(b&&b.u)),entered:Math.max(0,n(b&&b.u)-n(a&&a.u)),searchText:searchText});
      });
    });
    return rows.sort(function(a,b){return (b.exited+b.entered)- (a.exited+a.entered)||a.storeName.localeCompare(b.storeName)||a.p.n.localeCompare(b.p.n);});
  }
  function stateMovementRows59(type,state,storeOnly){return movementRows59(type,storeOnly).filter(function(r){return state==='all'||r.state===state;});}
  function exposureRows59(state,storeOnly){
    var rows=[];Object.keys(S||{}).forEach(function(store){if(storeOnly&&store!==storeOnly)return;var st=S[store]||{},inv=storeInventoryMetrics(st),list=state==='rot'?normalizeRotRows(st).filter(function(r){return r.u>0||r.val>0;}):normalizeEvacRows(st).filter(function(r){return r.active;});
      list.forEach(function(r){var pr=r.p||product59(r.c),storeName=safeText(st.name,store),searchText=(r.c+' '+pr.n+' '+pr.cat+' '+pr.lin+' '+pr.sub+' '+storeName).toLowerCase();rows.push({kind:'exposure',state:state,store:store,storeName:storeName,code:r.c,p:pr,currentU:n(r.u),currentV:n(state==='rot'?r.val:r.v),storePct:inv.totalVal? n(state==='rot'?r.val:r.v)/inv.totalVal*100:0,searchText:searchText});});
    });return rows.sort(function(a,b){return b.currentV-a.currentV||b.currentU-a.currentU;});
  }
  function summary59(rows){return {products:new Set(rows.map(function(r){return r.store+'|'+r.code;})).size,stores:new Set(rows.map(function(r){return r.store;})).size,prevU:rows.reduce(function(a,r){return a+n(r.prevU);},0),curU:rows.reduce(function(a,r){return a+n(r.currentU);},0),exited:rows.reduce(function(a,r){return a+n(r.exited);},0),entered:rows.reduce(function(a,r){return a+n(r.entered);},0),value:rows.reduce(function(a,r){return a+n(r.currentV||r.prevV);},0)};}
  function statesText59(r){var a=(r.prevStates||[]).map(stateLabel59).join(' + ')||'—',b=(r.curStates||[]).map(stateLabel59).join(' + ')||'—';return a+' → '+b;}
  function productRow59(r){
    var delta=n(r.currentU)-n(r.prevU),dcls=delta<0?'auditPositive59':delta>0?'auditNegative59':'auditNeutral59';
    if(V59.mode==='exposure')return '<tr onclick="openLeaderProduct59('+JSON.stringify(r.store)+','+JSON.stringify(r.code)+')"><td>'+imageThumb(r.code,'sm')+'</td><td><span class="code">'+esc(r.code)+'</span></td><td><div class="auditProduct59">'+esc(r.p.n)+'</div><div class="auditMeta59">'+esc(r.p.cat)+' · '+esc(r.p.lin)+' · '+esc(r.p.sub)+'</div></td><td><div class="auditStore59">'+esc(r.storeName)+'</div></td><td><span class="auditState59 '+stateClass59(r.state)+'">'+stateLabel59(r.state)+'</span></td><td class="num"><b>'+fInt(r.currentU)+'</b></td><td class="num"><b>'+fMoneyCOP(r.currentV)+'</b></td><td class="num">'+r.storePct.toFixed(1)+'%</td></tr>';
    return '<tr onclick="openLeaderProduct59('+JSON.stringify(r.store)+','+JSON.stringify(r.code)+')"><td>'+imageThumb(r.code,'sm')+'</td><td><span class="code">'+esc(r.code)+'</span></td><td><div class="auditProduct59">'+esc(r.p.n)+'</div><div class="auditMeta59">'+esc(r.p.cat)+' · '+esc(r.p.lin)+' · '+esc(r.p.sub)+'</div></td><td><div class="auditStore59">'+esc(r.storeName)+'</div></td><td><span class="auditType59 '+r.kind+'">'+(r.kind==='recovered'?'Gestionado':r.kind==='new'?'Nuevo':'Persistente')+'</span><div class="auditMeta59">'+esc(statesText59(r))+'</div></td><td class="num">'+fInt(r.prevU)+'</td><td class="num"><b>'+fInt(r.currentU)+'</b></td><td class="num '+dcls+'">'+(delta>0?'+':'')+fInt(delta)+'</td><td class="num auditPositive59">'+fInt(r.exited)+'</td><td class="num auditNegative59">'+fInt(r.entered)+'</td><td class="num"><b>'+fMoneyCOP(r.currentV||r.prevV)+'</b></td></tr>';
  }
  function filtered59(){var q=String(V59.q||'').toLowerCase();return V59.rows.filter(function(r){if(V59.state!=='all'&&r.state!==V59.state)return false;if(V59.store&&V59.store!=='all'&&r.store!==V59.store)return false;if(!q)return true;return String(r.searchText||(''+r.code+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub+' '+r.storeName).toLowerCase()).includes(q);});}
  window.setAuditState59=function(v){V59.state=v;V59.limit=200;renderAudit59();};
  window.setAuditStore59=function(v){V59.store=v||'all';V59.limit=200;renderAudit59();};
  window.setAuditQuery59=function(v){V59.q=v;V59.limit=200;renderAudit59();};
  window.scheduleAuditQuery59=function(v){V59.q=v;clearTimeout(window.__auditSearchTimer59||0);window.__auditSearchTimer59=setTimeout(function(){V59.limit=100;renderAudit59();},420);};
  window.loadMoreAudit59=function(){V59.limit+=100;renderAudit59();};
  function renderAudit59(){
    var body=document.getElementById('leaderAuditBody59');if(!body)return;var rows=filtered59(),vis=rows.slice(0,V59.limit),s=summary59(rows);
    var stats=V59.mode==='exposure'?
      '<div class="auditHero59"><div class="auditStat59"><label>Productos-tienda</label><b>'+fInt(s.products)+'</b></div><div class="auditStat59"><label>Tiendas</label><b>'+fInt(s.stores)+'</b></div><div class="auditStat59"><label>Unidades actuales</label><b>'+fInt(s.curU)+'</b></div><div class="auditStat59"><label>Valor actual</label><b>'+fMoney(s.value)+'</b></div></div>':
      '<div class="auditHero59"><div class="auditStat59"><label>Productos-tienda</label><b>'+fInt(s.products)+'</b></div><div class="auditStat59"><label>Tiendas</label><b>'+fInt(s.stores)+'</b></div><div class="auditStat59"><label>Unidades anteriores</label><b>'+fInt(s.prevU)+'</b></div><div class="auditStat59"><label>Unidades actuales</label><b>'+fInt(s.curU)+'</b></div></div>';
    var storeMap={},storeKeys=[];V59.rows.forEach(function(r){if(!storeMap[r.store]){storeMap[r.store]=r.storeName||r.store;storeKeys.push(r.store);}});storeKeys.sort(function(a,b){return String(storeMap[a]).localeCompare(String(storeMap[b]));});var storeSelect='<select class="auditSelect59" onchange="setAuditStore59(this.value)"><option value="all">Todas las tiendas</option>'+storeKeys.map(function(code){return '<option value="'+esc(code)+'"'+(V59.store===code?' selected':'')+'>'+esc(storeMap[code])+'</option>';}).join('')+'</select>';var toolbar='<div class="auditToolbar59"><div class="auditSearch59">🔎<input value="'+esc(V59.q)+'" placeholder="Buscar producto, código, categoría o tienda…" oninput="scheduleAuditQuery59(this.value)"></div>'+storeSelect+'<button class="auditChip59 '+(V59.state==='all'?'on':'')+'" onclick="setAuditState59(\'all\')">Todos</button><button class="auditChip59 '+(V59.state==='rot'?'on':'')+'" onclick="setAuditState59(\'rot\')">Rotación</button><button class="auditChip59 '+(V59.state==='evac'?'on':'')+'" onclick="setAuditState59(\'evac\')">Evacuación</button></div>';
    var head=V59.mode==='exposure'?'<tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Tienda</th><th>Estado</th><th class="num">Uds. actuales</th><th class="num">Valor actual</th><th class="num">% inventario tienda</th></tr>':'<tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Tienda</th><th>Movimiento / estado</th><th class="num">Uds. anteriores</th><th class="num">Uds. actuales</th><th class="num">Variación</th><th class="num">Uds. que salieron</th><th class="num">Uds. que entraron</th><th class="num">Valor actual/ref.</th></tr>';
    body.innerHTML=stats+toolbar+'<div class="auditNote59"><b>'+fInt(rows.length)+'</b> registros después de filtros. Presiona cualquier producto para abrir su información detallada.</div><div class="auditTableWrap59"><table class="auditTable59"><thead>'+head+'</thead><tbody>'+(vis.length?vis.map(productRow59).join(''):'<tr><td colspan="11"><div class="empty">No hay registros para los filtros seleccionados.</div></td></tr>')+'</tbody></table></div>'+(rows.length>vis.length?'<div class="auditLoad59"><button onclick="loadMoreAudit59()">Mostrar 100 más</button></div>':'');
  }
  function openRows59(title,subtitle,rows,mode){V59.rows=rows;V59.mode=mode||'movement';V59.state='all';V59.store='all';V59.q='';V59.limit=200;ensureModal59();document.getElementById('leaderAuditTitle59').textContent=title;document.getElementById('leaderAuditSubtitle59').textContent=subtitle;renderAudit59();document.getElementById('leaderAuditModalBack59').classList.add('on');}
  window.openMovementDetail59=function(type,store){var labels={recovered:'Productos gestionados',new:'Nuevos productos críticos',persistent:'Productos persistentes'},subs={recovered:'Productos-tienda que dejaron de aparecer en el estado crítico frente al corte anterior.',new:'Productos-tienda que ingresaron al estado crítico frente al corte anterior.',persistent:'Seguimiento de unidades anteriores y actuales de los productos que continúan críticos.'};openRows59(labels[type]||'Detalle',subs[type]||'',movementRows59(type,store||null),'movement');};
  window.openExposureDetail59=function(state,store){var rows=exposureRows59('rot',store||null).concat(exposureRows59('evac',store||null));openRows59('Detalle de exposición actual','Inventario actual por tienda y producto · corte '+safeText(DB&&DB.meta&&DB.meta.fecha,'—'),rows,'exposure');V59.state=state;V59.store=store||'all';renderAudit59();};
  window.openStoreAudit59=function(store){
    var p=pair59(),cur=p.current.stores&&p.current.stores[store],prev=p.previous&&p.previous.stores&&p.previous.stores[store],name=storeName59(store,p.current);ensureModal59();document.getElementById('leaderAuditTitle59').textContent='Seguimiento detallado · '+name;document.getElementById('leaderAuditSubtitle59').textContent='Comparación '+fmtDate59(p.previous&&p.previous.date)+' vs. '+fmtDate59(p.current.date);
    var rec=movementRows59('recovered',store),nw=movementRows59('new',store),per=movementRows59('persistent',store),rot=exposureRows59('rot',store),ev=exposureRows59('evac',store);
    document.getElementById('leaderAuditBody59').innerHTML='<div class="auditHero59"><div class="auditStat59"><label>Gestionados</label><b>'+fInt(rec.length)+'</b></div><div class="auditStat59"><label>Nuevos</label><b>'+fInt(nw.length)+'</b></div><div class="auditStat59"><label>Persistentes</label><b>'+fInt(per.length)+'</b></div><div class="auditStat59"><label>Inventario actual</label><b>'+fMoney(cur&&cur.inventory)+'</b></div></div><div class="auditNote59">Selecciona una vista. Cada tabla se divide mediante los filtros <b>Rotación</b> y <b>Evacuación</b>.</div><div class="auditToolbar59"><button class="auditChip59 on" onclick="openMovementDetail59(\'recovered\','+JSON.stringify(store)+')">Gestionados</button><button class="auditChip59" onclick="openMovementDetail59(\'new\','+JSON.stringify(store)+')">Nuevos</button><button class="auditChip59" onclick="openMovementDetail59(\'persistent\','+JSON.stringify(store)+')">Persistentes</button><button class="auditChip59" onclick="openExposureDetail59(\'rot\','+JSON.stringify(store)+')">Rotación actual</button><button class="auditChip59" onclick="openExposureDetail59(\'evac\','+JSON.stringify(store)+')">Evacuación actual</button></div><div class="baselineBox"><b>Lectura de la tienda</b>Inventario anterior: '+fMoney(prev&&prev.inventory)+' · inventario actual: '+fMoney(cur&&cur.inventory)+'. Los movimientos muestran unidades por código y no atribuyen la causa a una venta.</div>';
    document.getElementById('leaderAuditModalBack59').classList.add('on');
  };
  window.openLeaderProduct59=function(store,code){
    var st=S[store]||{},has=normalizeInventoryRows(st).some(function(r){return r.c===safeCode(code);});CUR=store;var storeSel=document.getElementById('storeSel');if(storeSel)storeSel.value=store;
    if(has){closeLeaderAudit59();setTimeout(function(){openBestProductDetail(code,'inventory');},60);return;}
    var r=V59.rows.find(function(x){return x.store===store&&x.code===safeCode(code);}),p=product59(safeCode(code));ensureModal59();document.getElementById('leaderAuditTitle59').textContent=p.n;document.getElementById('leaderAuditSubtitle59').textContent='Código '+safeCode(code)+' · '+safeText(st.name,store);
    document.getElementById('leaderAuditBody59').innerHTML='<div class="baselineBox"><b>Producto sin inventario actual en esta tienda</b>El producto aparece en el comparativo histórico, pero no tiene una fila de inventario actual para abrir el detalle estándar.</div><div class="auditHero59"><div class="auditStat59"><label>Unidades anteriores</label><b>'+fInt(r&&r.prevU)+'</b></div><div class="auditStat59"><label>Unidades actuales</label><b>'+fInt(r&&r.currentU)+'</b></div><div class="auditStat59"><label>Valor anterior</label><b>'+fMoney(r&&r.prevV)+'</b></div><div class="auditStat59"><label>Valor actual</label><b>'+fMoney(r&&r.currentV)+'</b></div></div>';
  };
  window.openIndexInfo59=function(){ensureModal59();document.getElementById('leaderAuditTitle59').textContent='Índice de gestión · fórmula provisional';document.getElementById('leaderAuditSubtitle59').textContent='Explicación de los componentes y los pesos usados';document.getElementById('leaderAuditBody59').innerHTML='<div class="baselineBox"><b>Importante</b>Los pesos no provienen de una política oficial incluida en las fuentes. Son una propuesta analítica provisional y deben aprobarse con el responsable del proceso antes de utilizar el índice como meta o evaluación formal.</div><div class="auditHero59"><div class="auditStat59"><label>Evacuación</label><b>30%</b></div><div class="auditStat59"><label>Rotación</label><b>25%</b></div><div class="auditStat59"><label>Referencias +360</label><b>20%</b></div><div class="auditStat59"><label>Nuevos críticos</label><b>15%</b></div></div><div class="auditHero59"><div class="auditStat59"><label>Traslados / acciones</label><b>10%</b></div><div class="auditStat59"><label>Escala</label><b>0–100</b></div><div class="auditStat59"><label>Ventas</label><b>No participan</b></div><div class="auditStat59"><label>Estado</label><b>Provisional</b></div></div><div class="auditNote59"><b>Fórmula actual:</b> 30% desempeño de Evacuación + 25% desempeño de Rotación + 20% evolución de referencias de más de 360 días + 15% control del valor que ingresa como nuevo crítico + 10% resolución de traslados y acciones. El índice sirve para ordenar la gestión diaria, pero no demuestra por sí solo buen o mal desempeño comercial.</div>';
    document.getElementById('leaderAuditModalBack59').classList.add('on');};
  window.openTrendPoint59=function(date,kind){var data=kind==='exposure'?networkTrendData59():networkManagementTrendData59(),x=data.find(function(r){return r.date===date;});if(!x)return;ensureModal59();document.getElementById('leaderAuditTitle59').textContent=(kind==='exposure'?'Tendencia histórica de Rotación y Evacuación':'Tendencia de gestión diaria')+' · '+fmtDate59(date);document.getElementById('leaderAuditSubtitle59').textContent='Detalle del punto seleccionado';document.getElementById('leaderAuditBody59').innerHTML=kind==='exposure'?'<div class="auditHero59"><div class="auditStat59"><label>Rotación</label><b>'+x.rotPct.toFixed(1)+'%</b></div><div class="auditStat59"><label>Evacuación</label><b>'+x.evacPct.toFixed(1)+'%</b></div><div class="auditStat59"><label>Variación Rotación</label><b>'+(x.rotAdvance===null?'Base':(x.rotAdvance>=0?'Mejora ':'Deterioro ')+Math.abs(x.rotAdvance).toFixed(1)+' pp')+'</b></div><div class="auditStat59"><label>Variación Evacuación</label><b>'+(x.evacAdvance===null?'Base':(x.evacAdvance>=0?'Mejora ':'Deterioro ')+Math.abs(x.evacAdvance).toFixed(1)+' pp')+'</b></div></div>':'<div class="auditHero59"><div class="auditStat59"><label>Mejora Rotación</label><b>'+(x.isBase?'Base':x.rotRecovery.toFixed(1)+'%')+'</b></div><div class="auditStat59"><label>Mejora Evacuación</label><b>'+(x.isBase?'Base':x.evacRecovery.toFixed(1)+'%')+'</b></div><div class="auditStat59"><label>Tipo de corte</label><b>'+(x.isBase?'Línea base':'Comparativo diario')+'</b></div><div class="auditStat59"><label>Fecha</label><b>'+fmtDate59(date)+'</b></div></div>';document.getElementById('leaderAuditModalBack59').classList.add('on');};

  function networkTrendData59(){var data=networkTrendData(),prev=null;return data.map(function(x){var y={date:x.date,rotPct:n(x.rotPct),evacPct:n(x.evacPct),rotAdvance:prev?prev.rotPct-n(x.rotPct):null,evacAdvance:prev?prev.evacPct-n(x.evacPct):null};prev=y;return y;});}
  function networkManagementTrendData59(){
    var h=readDailyHistory().sort(function(a,b){return String(a.date).localeCompare(String(b.date));});return h.map(function(snap,i){if(i===0)return {date:snap.date,rotRecovery:0,evacRecovery:0,isBase:true};var rp=0,rn=0,ep=0,en=0;Object.values(snap.stores||{}).forEach(function(x){if(x.rot){rp+=n(x.rot.previousVal)+n(x.rot.newVal);rn+=n(x.rot.currentVal);}if(x.evac){ep+=n(x.evac.previousVal)+n(x.evac.newVal);en+=n(x.evac.currentVal);}});return {date:snap.date,rotRecovery:rp>0?(rp-rn)/rp*100:0,evacRecovery:ep>0?(ep-en)/ep*100:0,isBase:false};});
  }
  window.networkManagementTrendData=networkManagementTrendData59;
  window.trendSvg=function(data){data=networkTrendData59();if(data.length<2)return '<div class="empty">Aún existe una sola carga.</div>';var W=Math.max(760,80*(data.length-1)+100),H=235,p={l:44,r:24,t:30,b:40},max=Math.max(10,...data.flatMap(function(d){return [d.rotPct,d.evacPct];})),x=function(i){return p.l+(W-p.l-p.r)*(data.length===1?.5:i/(data.length-1));},y=function(v){return p.t+(H-p.t-p.b)*(1-v/max);},path=function(k){return data.map(function(d,i){return (i?'L':'M')+x(i).toFixed(1)+','+y(d[k]).toFixed(1);}).join(' ');};var grid=[0,.25,.5,.75,1].map(function(q){var v=max*q,yy=y(v);return '<line x1="'+p.l+'" y1="'+yy+'" x2="'+(W-p.r)+'" y2="'+yy+'" stroke="var(--line2)"/><text x="'+(p.l-7)+'" y="'+(yy+4)+'" text-anchor="end" font-size="10" fill="var(--mut)">'+v.toFixed(0)+'%</text>';}).join('');var labels=data.map(function(d,i){return '<text x="'+x(i)+'" y="'+(H-10)+'" text-anchor="middle" font-size="10" fill="var(--mut)">'+esc(String(d.date).slice(5))+'</text>';}).join('');function points(k,c,dy){return data.map(function(d,i){return '<circle class="trendPoint59" onclick="openTrendPoint59('+JSON.stringify(d.date)+',\'exposure\')" cx="'+x(i)+'" cy="'+y(d[k])+'" r="5" fill="'+c+'"><title>'+d.date+': '+d[k].toFixed(1)+'%</title></circle><text class="trendValue59" x="'+x(i)+'" y="'+(y(d[k])+dy)+'" text-anchor="middle" fill="'+c+'">'+d[k].toFixed(1)+'%</text>';}).join('');}return '<div class="trendWrap"><svg class="trendSvg trendSvg59" style="width:'+W+'px" viewBox="0 0 '+W+' '+H+'">'+grid+'<path d="'+path('rotPct')+'" fill="none" stroke="var(--rot)" stroke-width="3"/>'+points('rotPct','var(--rot)',-10)+'<path d="'+path('evacPct')+'" fill="none" stroke="var(--evac)" stroke-width="3"/>'+points('evacPct','var(--evac)',16)+labels+'</svg></div><div class="trendLegend"><span><i style="background:var(--rot)"></i>Rotación</span><span><i style="background:var(--evac)"></i>Evacuación</span></div>';
  };
  window.managementTrendSvg=function(){var data=networkManagementTrendData59();if(!data.length)return '<div class="empty">Sin cortes.</div>';var W=Math.max(760,80*(data.length-1)+100),H=235,p={l:48,r:24,t:30,b:40},vals=data.flatMap(function(d){return [d.rotRecovery,d.evacRecovery];}),lo=Math.min(-10,...vals),hi=Math.max(10,...vals),range=hi-lo||1,x=function(i){return p.l+(W-p.l-p.r)*(data.length===1?.5:i/(data.length-1));},y=function(v){return p.t+(H-p.t-p.b)*(hi-v)/range;},line=function(k){return data.map(function(d,i){return (i?'L':'M')+x(i).toFixed(1)+','+y(d[k]).toFixed(1);}).join(' ');},zero=y(0);var grid=[lo,0,hi].map(function(v){return '<line x1="'+p.l+'" y1="'+y(v)+'" x2="'+(W-p.r)+'" y2="'+y(v)+'" stroke="var(--line2)"/><text x="'+(p.l-7)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="10" fill="var(--mut)">'+v.toFixed(0)+'%</text>';}).join('');var labels=data.map(function(d,i){return '<text x="'+x(i)+'" y="'+(H-10)+'" text-anchor="middle" font-size="10" fill="var(--mut)">'+esc(String(d.date).slice(5))+'</text>';}).join('');function pts(k,c,dy){return data.map(function(d,i){var txt=d.isBase?'Base':d[k].toFixed(1)+'%';return '<circle class="trendPoint59" onclick="openTrendPoint59('+JSON.stringify(d.date)+',\'management\')" cx="'+x(i)+'" cy="'+y(d[k])+'" r="5" fill="'+c+'"><title>'+d.date+': '+txt+'</title></circle><text class="trendValue59" x="'+x(i)+'" y="'+(y(d[k])+dy)+'" text-anchor="middle" fill="'+c+'">'+txt+'</text>';}).join('');}return '<div class="trendWrap"><svg class="trendSvg trendSvg59" style="width:'+W+'px" viewBox="0 0 '+W+' '+H+'">'+grid+'<line x1="'+p.l+'" y1="'+zero+'" x2="'+(W-p.r)+'" y2="'+zero+'" stroke="var(--mut)" stroke-dasharray="4 4"/><path d="'+line('rotRecovery')+'" fill="none" stroke="var(--rot)" stroke-width="3"/>'+pts('rotRecovery','var(--rot)',-10)+'<path d="'+line('evacRecovery')+'" fill="none" stroke="var(--evac)" stroke-width="3"/>'+pts('evacRecovery','var(--evac)',16)+labels+'</svg></div><div class="trendLegend"><span><i style="background:var(--rot)"></i>Mejora Rotación</span><span><i style="background:var(--evac)"></i>Mejora Evacuación</span></div><div class="dashboardNote">La línea base se muestra en 0. Desde el segundo corte, valores positivos indican mejora y negativos indican deterioro frente al corte anterior.</div>';
  };
  window.rankChart=function(rows,key,color){var top=[...rows].sort(function(a,b){return b[key]-a[key];}),max=Math.max(1,...top.map(function(x){return x[key];}));return '<div class="rankChart">'+top.map(function(r,i){return '<div class="rankRow storeAuditRow59" role="button" tabindex="0" onclick="openStoreAudit59('+JSON.stringify(r.code)+')"><div class="rankName" title="'+esc(r.name)+'">'+(i+1)+'. '+esc(r.name)+'<div class="auditMeta59">Ver detalle</div></div><div class="rankTrack"><div class="rankFill" style="width:'+Math.max(1,r[key]/max*100)+'%;background:'+color+'"></div></div><div class="rankValue">'+r[key].toFixed(1)+'%</div></div>';}).join('')+'</div>';};
  function scoreComp59(rows,best){
    var h=readDailyHistory().sort(function(a,b){return String(a.date).localeCompare(String(b.date));}),cur=h[h.length-1],prev=h[h.length-2];
    var items=rows.map(function(r){
      var c=cur&&cur.stores&&cur.stores[r.code],p=prev&&prev.stores&&prev.stores[r.code],base=null;
      for(var i=0;i<h.length;i++){var z=h[i].stores&&h[i].stores[r.code];if(z&&Number.isFinite(Number(z.score))){base=n(z.score);break;}}
      var cs=c&&Number.isFinite(Number(c.score))?n(c.score):null,ps=p&&Number.isFinite(Number(p.score))?n(p.score):null;
      return {code:r.code,name:r.name,current:cs,previous:ps,base:base,delta:cs!==null&&ps!==null?cs-ps:null};
    }).filter(function(x){return x.delta!==null;});
    items.sort(function(a,b){return best?b.delta-a.delta:a.delta-b.delta;});
    if(!items.length)return '<div class="empty">El corte base no tiene índice porque todavía no existía un día anterior. La comparación de mejora y deterioro del puntaje estará disponible desde el tercer corte.</div>';
    return '<div class="rankChart">'+items.slice(0,10).map(function(x,i){
      var cls=x.delta>0?'good':x.delta<0?'bad':'flat';
      return '<div class="scoreCompareRow59 storeAuditRow59 storeNav66" role="button" tabindex="0" data-store="'+esc(String(x.code))+'" data-view="resumen"><div class="rankName">'+(i+1)+'. '+esc(x.name)+'<div class="auditMeta59">Ver detalle</div></div><div class="rankTrack"><div class="rankFill" style="width:'+Math.max(2,Math.min(100,x.current))+'%;background:'+scoreColor(x.current)+'"></div></div><div class="scoreCompareValues59"><b>Actual '+x.current+'</b> · anterior '+x.previous+' · base '+x.base+'<br><span class="scoreDelta59 '+cls+'">'+(x.delta>0?'↑ +':x.delta<0?'↓ ':'→ ')+x.delta.toFixed(0)+' puntos</span></div></div>';
    }).join('')+'</div>';
  }
  window.scoreRankChart=function(rows,best){return scoreComp59(rows,best);};
  function exposureDaily59(state,trend){trend=Array.isArray(trend)?trend:[];if(!trend.length){var rows=leaderStoreMetrics(),inv=rows.reduce(function(a,r){return a+n(r.inventory);},0),val=rows.reduce(function(a,r){return a+n(state==='rot'?r.rotVal:r.evacVal);},0),pct=inv?val/inv*100:0;return {value:pct,prev:null,base:pct,advance:null};}var cur=trend[trend.length-1],prev=trend[trend.length-2],value=state==='rot'?n(cur.rotPct):n(cur.evacPct),advance=prev?(state==='rot'?n(prev.rotPct)-value:n(prev.evacPct)-value):null;return {value:value,prev:prev?(state==='rot'?n(prev.rotPct):n(prev.evacPct)):null,base:state==='rot'?n(trend[0].rotPct):n(trend[0].evacPct),advance:advance};}
  function kpi59(icon,label,value,sub,onclick,extra){return '<div class="leaderKpi '+(onclick?'auditClickable':'')+'" '+(onclick?'onclick="'+onclick+'" tabindex="0" role="button"':'')+'><div class="lkTop"><div class="lkIcon">'+icon+'</div></div><div class="lkLabel">'+label+'</div><div class="lkValue">'+value+'</div><div class="lkSub">'+sub+'</div>'+(extra||'')+'</div>';}
  window.viewLeaderDashboard=function(){
    var ms=leaderStoreMetrics(),trend=networkTrendData59(),managementTrend=networkManagementTrendData59(),snap=currentDailySummary(),prev=previousSnapshot(),sum=function(k){return ms.reduce(function(a,r){return a+n(r[k]);},0);},inventory=sum('inventory'),rotPct=pctValue(sum('rotVal'),inventory),evacPct=pctValue(sum('evacVal'),inventory),valid=ms.filter(function(r){return r.score!==null&&r.score!==undefined&&Number.isFinite(Number(r.score));}),avgScore=valid.length?Math.round(valid.reduce(function(a,r){return a+r.score;},0)/valid.length):null,rotD=exposureDaily59('rot',trend),evD=exposureDaily59('evac',trend);
    var risk=valid.length?[...valid].sort(function(a,b){return a.score-b.score;}):[...ms].sort(function(a,b){return (b.rotPct+b.evacPct)-(a.rotPct+a.evacPct);});
    function expExtra(x){var c=x.advance===null?'base':x.advance>=0?'good':'bad',txt=x.advance===null?'Línea base':(x.advance>=0?'Mejora ':'Deterioro ')+Math.abs(x.advance).toFixed(1)+' pp';return '<div class="lkDaily"><span>Anterior '+(x.prev===null?'—':x.prev.toFixed(1)+'%')+'</span><span>Base '+x.base.toFixed(1)+'%</span><span class="'+c+'">'+txt+'</span></div>';}
    var dailyRows=[...ms].sort(function(a,b){return (b.recovered-a.recovered)||(a.newCritical-b.newCritical);}).map(function(r){return '<tr class="storeAuditRow59 storeNav66" role="button" tabindex="0" data-store="'+esc(String(r.code))+'" data-view="resumen"><td><b>'+esc(r.name)+'</b><div class="auditMeta59">Ver detalle de productos →</div></td><td class="num">'+(r.score??'—')+'</td><td class="num">'+performanceBadge(r.rotReduction)+'</td><td class="num">'+performanceBadge(r.evacReduction)+'</td><td class="num perfGood">'+fInt(r.recovered)+'</td><td class="num perfBad">'+fInt(r.newCritical)+'</td><td class="num">'+fInt(r.persistent)+'</td><td class="num">'+fInt(r.age360Recovered)+'</td><td class="num">'+fInt(r.transfersResolved)+'</td></tr>';}).join('');
    var tableRows=[...ms].sort(function(a,b){return (a.score===null)-(b.score===null)||(a.score??999)-(b.score??999);}).map(function(r){return '<tr class="storeAuditRow59 storeNav66" role="button" tabindex="0" data-store="'+esc(String(r.code))+'" data-view="resumen"><td><b>'+esc(r.name)+'</b></td><td>'+(r.score===null?'<span class="dailyStatus base">Base</span>':'<span class="healthBadge '+healthClass(r.score)+'">'+r.score+'</span>')+'</td><td class="num">'+fMoney(r.inventory)+'</td><td class="num">'+r.rotPct.toFixed(1)+'%</td><td class="num">'+r.evacPct.toFixed(1)+'%</td><td class="num">'+performanceBadge(r.rotReduction)+'</td><td class="num">'+performanceBadge(r.evacReduction)+'</td><td class="num">'+fInt(r.recovered)+'</td><td class="num">'+fInt(r.newCritical)+'</td><td class="num">'+fInt(r.persistent)+'</td><td class="num">'+fInt(r.transfersResolved)+'</td><td><button class="storeDrill" type="button" data-store="'+esc(String(r.code))+'" data-view="resumen">Ver</button></td></tr>';}).join('');
    var alerts=risk.slice(0,4).map(function(r){return '<div class="alertItem"><div class="aiIcon">⚠</div><div><b>'+esc(r.name)+' · '+(r.score===null?'sin comparativo':'índice '+r.score)+'</b><span>'+(r.score===null?r.rotPct.toFixed(1)+'% Rotación · '+r.evacPct.toFixed(1)+'% Evacuación':performanceBadge(r.rotReduction)+' Rotación · '+performanceBadge(r.evacReduction)+' Evacuación · '+fInt(r.newCritical)+' nuevos críticos')+'</span></div></div>';}).join('');
    return '<div class="hint" style="margin-bottom:18px">📅 <span><b>Seguimiento diario:</b> el porcentaje actual se compara con el corte anterior y con la base. Los cuadros y las filas con detalle son clickeables.</span><button class="actionBtn historyAction" onclick="exportDailyHistoryCSV()">⬇ Exportar historial</button></div><div class="leaderKpis">'+
      kpi59('🏬','Tiendas monitoreadas',fInt(ms.length),fInt(valid.length)+' con comparación diaria')+
      kpi59('📦','Inventario total red',fMoney(inventory),fInt(sum('inventoryUnits'))+' unidades registradas')+
      kpi59('⟳','Exposición en rotación',rotPct.toFixed(1)+'%',fMoney(sum('rotVal'))+' del inventario total','openExposureDetail59(\'rot\')',expExtra(rotD))+
      kpi59('⇲','Exposición en evacuación',evacPct.toFixed(1)+'%',fMoney(sum('evacVal'))+' del inventario total','openExposureDetail59(\'evac\')',expExtra(evD))+
      kpi59('✅','Productos gestionados',fInt(sum('recovered')),fMoney(sum('recoveredVal'))+' dejaron el estado crítico','openMovementDetail59(\'recovered\')')+
      kpi59('🆕','Nuevos productos críticos',fInt(sum('newCritical')),fMoney(sum('newCriticalVal'))+' ingresaron al estado','openMovementDetail59(\'new\')')+
      kpi59('⏳','Productos persistentes',fInt(sum('persistent')),fMoney(sum('persistentVal'))+' continúan críticos','openMovementDetail59(\'persistent\')')+
      kpi59('★','Índice promedio de gestión',avgScore===null?'Línea base':avgScore+'/100',avgScore===null?'Disponible desde el segundo corte':'Ventas excluidas del cálculo','openIndexInfo59()','<div class="indexProvisional59">Pesos provisionales · ver fórmula</div>')+
      '</div><div class="measureHeading"><div><b>Composición consolidada por valor</b><span>Valores completos en pesos colombianos (COP).</span></div><span class="measureBadge">VALOR $</span></div><div class="inventoryOverview"><div class="inventoryTotal"><div class="itLabel">Inventario consolidado · COP</div><div class="itValue currencyValue">'+fMoneyCOP(inventory)+'</div><div class="itSub">Corte '+esc(safeText(DB.meta&&DB.meta.fecha,'—'))+'<div class="stackedInventory"><span class="stackRot" style="width:'+rotPct+'%"></span><span class="stackEvac" style="width:'+evacPct+'%"></span><span class="stackHealthy" style="width:'+clampPct(100-rotPct-evacPct)+'%"></span></div></div></div>'+donutCard('Valor en rotación',rotPct,fMoneyCOP(sum('rotVal')),'var(--rot)','Exposición actual por valor')+donutCard('Valor en evacuación',evacPct,fMoneyCOP(sum('evacVal')),'var(--evac)','Exposición actual por valor')+donutCard('Valor en otros estados',clampPct(100-rotPct-evacPct),fMoneyCOP(Math.max(0,inventory-sum('rotVal')-sum('evacVal'))),'var(--ok)','Fuera de ambos estados')+'</div><div class="chartPair"><div class="card"><div class="chead"><div class="cnum n1">⟳</div><div><div class="tt">Mayor exposición en Rotación</div><div class="ds">Porcentaje actual del inventario de cada tienda</div></div></div><div class="cbody">'+rankChart(ms,'rotPct','var(--rot)')+'</div></div><div class="card"><div class="chead"><div class="cnum n2">⇲</div><div><div class="tt">Mayor exposición en Evacuación</div><div class="ds">Porcentaje actual del inventario de cada tienda</div></div></div><div class="cbody">'+rankChart(ms,'evacPct','var(--evac)')+'</div></div></div><div class="chartPair"><div class="card"><div class="chead"><div class="cnum n3">↑</div><div><div class="tt">Tiendas con mayor mejora del puntaje</div><div class="ds">Compara puntaje actual, anterior y base</div></div></div><div class="cbody">'+scoreComp59(ms,true)+'</div></div><div class="card"><div class="chead"><div class="cnum n2">↓</div><div><div class="tt">Tiendas con mayor deterioro del puntaje</div><div class="ds">Compara puntaje actual, anterior y base</div></div></div><div class="cbody">'+scoreComp59(ms,false)+'</div></div></div><div class="chartPair"><div class="card"><div class="chead"><div class="cnum n3">↗</div><div><div class="tt">Tendencia histórica de Rotación y Evacuación</div><div class="ds">Cada punto muestra el porcentaje del corte y puede abrirse</div></div><div class="rt"><span class="badge cool">'+trend.length+' cortes</span></div></div><div class="cbody">'+trendSvg(trend)+'</div></div><div class="card"><div class="chead"><div class="cnum n4">✓</div><div><div class="tt">Tendencia de gestión diaria</div><div class="ds">Incluye la línea base y el porcentaje de cada corte</div></div></div><div class="cbody">'+managementTrendSvg(managementTrend)+'</div></div></div><div class="card"><div class="chead"><div class="cnum n4">D</div><div><div class="tt">Resultado diario por tienda</div><div class="ds">Comparación frente a '+esc(snap&&snap.previousDate||prev&&prev.date||'la línea base')+'</div></div></div><div class="cbody"><div class="twrap"><table class="leaderTable"><thead><tr><th>Tienda</th><th class="num">Índice</th><th class="num">Red. Rotación</th><th class="num">Red. Evacuación</th><th class="num">Gestionados</th><th class="num">Nuevos</th><th class="num">Persistentes</th><th class="num">Gest. +360</th><th class="num">Traslados resueltos</th></tr></thead><tbody>'+dailyRows+'</tbody></table></div><div class="dashboardNote">Presiona una tienda para consultar sus productos gestionados, nuevos y persistentes, separados por Rotación y Evacuación.</div></div></div><div class="leaderGrid"><div class="card"><div class="chead"><div class="cnum n4">★</div><div><div class="tt">Comparativo integral de tiendas</div><div class="ds">El índice es una fórmula analítica provisional y no mide ventas</div></div><div class="rt"><button class="auditChip59" onclick="openIndexInfo59()">¿Qué es el índice?</button></div></div><div class="cbody"><div class="twrap"><table class="leaderTable"><thead><tr><th>Tienda</th><th>Índice</th><th class="num">Inventario</th><th class="num">% Rotación</th><th class="num">% Evacuación</th><th class="num">Red. Rotación</th><th class="num">Red. Evacuación</th><th class="num">Gestionados</th><th class="num">Nuevos</th><th class="num">Persistentes</th><th class="num">Traslados</th><th>Detalle</th></tr></thead><tbody>'+tableRows+'</tbody></table></div><div class="dashboardNote">Pesos provisionales: Evacuación 30%, Rotación 25%, referencias +360 20%, control de nuevos críticos 15% y traslados/acciones 10%. Requieren validación del negocio.</div></div></div><div style="display:flex;flex-direction:column;gap:20px"><div class="card"><div class="chead"><div class="cnum n2">!</div><div><div class="tt">Alertas prioritarias</div><div class="ds">Tiendas con deterioro o mayor exposición</div></div></div><div class="cbody"><div class="alertList">'+(alerts||'<div class="empty">Sin alertas críticas.</div>')+'</div></div></div><div class="card"><div class="chead"><div class="cnum n3">i</div><div><div class="tt">Reglas de interpretación</div><div class="ds">Cómo leer el seguimiento</div></div></div><div class="cbody"><div class="compactLegend"><span><b>Gestionado:</b> salió del estado crítico.</span><span><b>Persistente:</b> continúa en el estado y puede haber reducido o aumentado unidades.</span><span><b>Nuevo:</b> ingresó desde el último corte.</span><span><b>Reducción ajustada:</b> considera el inventario inicial y las nuevas entradas.</span><span><b>Ventas:</b> no participan en la evaluación.</span></div></div></div></div></div>'+(typeof window.__llaveroLeaderTrackingPanel==='function'?window.__llaveroLeaderTrackingPanel():'');
  };
})();


/* ===== llavero-v60-runtime-fixes-script ===== */
(function(){
  'use strict';
  function historyTrend60(){return typeof networkTrendData59==='function'?networkTrendData59():(typeof networkTrendData==='function'?networkTrendData():[]);}
  window.trendSvg=function(){
    var data=historyTrend60();
    if(data.length<2)return '<div class="empty">Aún existe una sola carga.</div>';
    var W=760,H=235,p={l:44,r:24,t:30,b:40},max=Math.max(10,...data.flatMap(function(d){return [Number(d.rotPct)||0,Number(d.evacPct)||0];}));
    var x=function(i){return p.l+(W-p.l-p.r)*(data.length===1?.5:i/(data.length-1));},y=function(v){return p.t+(H-p.t-p.b)*(1-v/max);},step=Math.max(1,Math.ceil(data.length/8));
    var path=function(k){return data.map(function(d,i){return (i?'L':'M')+x(i).toFixed(1)+','+y(Number(d[k])||0).toFixed(1);}).join(' ');};
    var grid=[0,.25,.5,.75,1].map(function(q){var v=max*q,yy=y(v);return '<line x1="'+p.l+'" y1="'+yy+'" x2="'+(W-p.r)+'" y2="'+yy+'" stroke="var(--line2)"/><text x="'+(p.l-7)+'" y="'+(yy+4)+'" text-anchor="end" font-size="10" fill="var(--mut)">'+v.toFixed(0)+'%</text>';}).join('');
    var labels=data.map(function(d,i){return (i===0||i===data.length-1||i%step===0)?'<text x="'+x(i)+'" y="'+(H-10)+'" text-anchor="middle" font-size="10" fill="var(--mut)">'+esc(String(d.date).slice(5))+'</text>':'';}).join('');
    function points(k,c,dy){return data.map(function(d,i){var v=Number(d[k])||0;return '<circle class="trendPoint59" onclick="openTrendPoint59('+JSON.stringify(d.date)+',\'exposure\')" cx="'+x(i)+'" cy="'+y(v)+'" r="5" fill="'+c+'"><title>'+d.date+': '+v.toFixed(1)+'%</title></circle><text class="trendValue59" x="'+x(i)+'" y="'+(y(v)+dy)+'" text-anchor="middle" fill="'+c+'">'+v.toFixed(1)+'%</text>';}).join('');}
    return '<div class="trendWrap"><svg class="trendSvg trendSvg59" style="width:100%;min-width:0" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+grid+'<path d="'+path('rotPct')+'" fill="none" stroke="var(--rot)" stroke-width="3"/>'+points('rotPct','var(--rot)',-10)+'<path d="'+path('evacPct')+'" fill="none" stroke="var(--evac)" stroke-width="3"/>'+points('evacPct','var(--evac)',16)+labels+'</svg></div><div class="trendLegend"><span><i style="background:var(--rot)"></i>Rotación</span><span><i style="background:var(--evac)"></i>Evacuación</span></div>';
  };
  window.managementTrendSvg=function(){
    var data=typeof networkManagementTrendData59==='function'?networkManagementTrendData59():(typeof networkManagementTrendData==='function'?networkManagementTrendData():[]);
    if(!data.length)return '<div class="empty">Sin cortes.</div>';
    var W=760,H=235,p={l:48,r:24,t:30,b:40},vals=data.flatMap(function(d){return [Number(d.rotRecovery)||0,Number(d.evacRecovery)||0];}),lo=Math.min(-10,...vals),hi=Math.max(10,...vals),range=hi-lo||1,step=Math.max(1,Math.ceil(data.length/8));
    var x=function(i){return p.l+(W-p.l-p.r)*(data.length===1?.5:i/(data.length-1));},y=function(v){return p.t+(H-p.t-p.b)*(hi-v)/range;},zero=y(0);
    var line=function(k){return data.map(function(d,i){return (i?'L':'M')+x(i).toFixed(1)+','+y(Number(d[k])||0).toFixed(1);}).join(' ');};
    var grid=[lo,0,hi].map(function(v){return '<line x1="'+p.l+'" y1="'+y(v)+'" x2="'+(W-p.r)+'" y2="'+y(v)+'" stroke="var(--line2)"/><text x="'+(p.l-7)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="10" fill="var(--mut)">'+v.toFixed(0)+'%</text>';}).join('');
    var labels=data.map(function(d,i){return (i===0||i===data.length-1||i%step===0)?'<text x="'+x(i)+'" y="'+(H-10)+'" text-anchor="middle" font-size="10" fill="var(--mut)">'+esc(String(d.date).slice(5))+'</text>':'';}).join('');
    function pts(k,c,dy){return data.map(function(d,i){var v=Number(d[k])||0,txt=d.isBase?'Base':v.toFixed(1)+'%';return '<circle class="trendPoint59" onclick="openTrendPoint59('+JSON.stringify(d.date)+',\'management\')" cx="'+x(i)+'" cy="'+y(v)+'" r="5" fill="'+c+'"><title>'+d.date+': '+txt+'</title></circle><text class="trendValue59" x="'+x(i)+'" y="'+(y(v)+dy)+'" text-anchor="middle" fill="'+c+'">'+txt+'</text>';}).join('');}
    return '<div class="trendWrap"><svg class="trendSvg trendSvg59" style="width:100%;min-width:0" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+grid+'<line x1="'+p.l+'" y1="'+zero+'" x2="'+(W-p.r)+'" y2="'+zero+'" stroke="var(--mut)" stroke-dasharray="4 4"/><path d="'+line('rotRecovery')+'" fill="none" stroke="var(--rot)" stroke-width="3"/>'+pts('rotRecovery','var(--rot)',-10)+'<path d="'+line('evacRecovery')+'" fill="none" stroke="var(--evac)" stroke-width="3"/>'+pts('evacRecovery','var(--evac)',16)+labels+'</svg></div><div class="trendLegend"><span><i style="background:var(--rot)"></i>Mejora Rotación</span><span><i style="background:var(--evac)"></i>Mejora Evacuación</span></div><div class="dashboardNote">La línea base se muestra en 0. Desde el segundo corte, valores positivos indican mejora y negativos indican deterioro frente al corte anterior.</div>';
  };
})();


/* ===== llavero-build-v62-marker ===== */
window.LLAVERO_BUILD='V79';
if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');


/* ===== llavero-v65-final-script ===== */
(function(){
  'use strict';
  window.LLAVERO_BUILD='V79';
  if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');

  function storeExists65(code){return typeof S!=='undefined' && S && S[code];}
  window.goToStore65=function(code,view){
    var c=String(code==null?'':code),v=view||'resumen';
    if(!storeExists65(c))return;
    if(typeof openStoreDashboard==='function'){
      openStoreDashboard(c,v);
    }else{
      try{
        CUR=c;
        var s=document.getElementById('storeSel');if(s)s.value=c;
        VIEW=v;
        if(typeof setActiveNav==='function')setActiveNav(v);
        if(typeof refresh==='function')refresh();
      }catch(e){console.error('No se pudo abrir la tienda',e);}
    }
    setTimeout(function(){window.scrollTo({top:0,behavior:'smooth'});},60);
  };

  /* Todas las filas históricas que antes abrían un modal llevan ahora al resumen de la tienda. */
  window.openStoreAudit59=function(code){window.goToStore65(code,'resumen');};

  /* Ranking de exposición: abre directamente Rotación o Evacuación de la tienda seleccionada. */
  window.rankChart=function(rows,key,color){
    var ranked=(rows||[]).filter(function(r){return Number.isFinite(Number(r&&r[key]));}).sort(function(a,b){return Number(b[key])-Number(a[key])||String(a.name).localeCompare(String(b.name));});
    var max=Math.max(1,...ranked.map(function(x){return Number(x[key])||0;})),view=key==='rotPct'?'rot':'evac',label=key==='rotPct'?'Rotación':'Evacuación';
    return '<div class="rankChart fullStoreRanking65">'+ranked.map(function(r,i){
      var code=JSON.stringify(String(r.code));
      return '<div class="rankRow storeLink65 storeNav66" role="button" tabindex="0" data-store="'+String(r.code).replace(/"/g,'&quot;')+'" data-view="'+view+'" title="Abrir '+String(r.name).replace(/"/g,'&quot;')+' en '+label+'"><div class="rankName"><b>'+(i+1)+'. '+esc(r.name)+'</b><small>Ver '+label+' de la tienda →</small></div><div class="rankTrack"><div class="rankFill" style="width:'+Math.max(1,(Number(r[key])||0)/max*100)+'%;background:'+color+'"></div></div><div class="rankValue">'+(Number(r[key])||0).toFixed(1)+'%</div></div>';
    }).join('')+'</div>';
  };

  function trendData65(){return typeof networkTrendData59==='function'?networkTrendData59():(typeof networkTrendData==='function'?networkTrendData():[]);}
  function managementData65(){return typeof networkManagementTrendData59==='function'?networkManagementTrendData59():(typeof networkManagementTrendData==='function'?networkManagementTrendData():[]);}
  function ticks65(lo,hi,n){var out=[];for(var i=0;i<n;i++)out.push(lo+(hi-lo)*(i/(n-1)));return out;}

  window.trendSvg=function(){
    var data=trendData65();if(data.length<2)return '<div class="empty">Aún existe una sola carga.</div>';
    var vals=data.flatMap(function(d){return [Number(d.rotPct)||0,Number(d.evacPct)||0];}),min=Math.min(...vals),max=Math.max(...vals),margin=Math.max(3,(max-min)*.16),lo=Math.max(0,min-margin),hi=Math.min(100,max+margin);if(hi-lo<10){hi=Math.min(100,hi+5);lo=Math.max(0,lo-5);}
    var W=1120,H=360,p={l:62,r:34,t:38,b:52},x=function(i){return p.l+(W-p.l-p.r)*(data.length===1?.5:i/(data.length-1));},y=function(v){return p.t+(H-p.t-p.b)*(hi-v)/(hi-lo||1);},step=Math.max(1,Math.ceil(data.length/10));
    var path=function(k){return data.map(function(d,i){return (i?'L':'M')+x(i).toFixed(1)+','+y(Number(d[k])||0).toFixed(1);}).join(' ');};
    var grid=ticks65(lo,hi,5).map(function(v){var yy=y(v);return '<line x1="'+p.l+'" y1="'+yy+'" x2="'+(W-p.r)+'" y2="'+yy+'" stroke="var(--line2)"/><text x="'+(p.l-10)+'" y="'+(yy+4)+'" text-anchor="end" font-size="12" fill="var(--mut)">'+v.toFixed(1)+'%</text>';}).join('');
    var labels=data.map(function(d,i){return (i===0||i===data.length-1||i%step===0)?'<text x="'+x(i)+'" y="'+(H-15)+'" text-anchor="middle" font-size="12" font-weight="700" fill="var(--mut)">'+esc(String(d.date).slice(5))+'</text>':'';}).join('');
    function pts(k,c,dy){return data.map(function(d,i){var v=Number(d[k])||0;return '<g class="trendPointGroup65 trendNav66" role="button" tabindex="0" data-date="'+esc(String(d.date))+'" data-kind="exposure"><circle cx="'+x(i)+'" cy="'+y(v)+'" r="7" fill="'+c+'" stroke="#fff" stroke-width="3"></circle><text x="'+x(i)+'" y="'+(y(v)+dy)+'" text-anchor="middle" font-size="12" font-weight="900" fill="'+c+'">'+v.toFixed(1)+'%</text><title>'+d.date+': '+v.toFixed(1)+'%</title></g>';}).join('');}
    return '<div class="trendWrap trendWrap65"><svg class="trendSvg trendSvg65" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+grid+'<path d="'+path('rotPct')+'" fill="none" stroke="var(--rot)" stroke-width="4"/>'+pts('rotPct','var(--rot)',-13)+'<path d="'+path('evacPct')+'" fill="none" stroke="var(--evac)" stroke-width="4"/>'+pts('evacPct','var(--evac)',20)+labels+'</svg></div><div class="trendLegend"><span><i style="background:var(--rot)"></i>Rotación</span><span><i style="background:var(--evac)"></i>Evacuación</span></div>';
  };

  window.managementTrendSvg=function(){
    var data=managementData65();if(!data.length)return '<div class="empty">Sin cortes.</div>';
    var vals=data.flatMap(function(d){return [Number(d.rotRecovery)||0,Number(d.evacRecovery)||0];}),min=Math.min(0,...vals),max=Math.max(0,...vals),margin=Math.max(2,(max-min)*.2),lo=min-margin,hi=max+margin;if(hi-lo<8){hi+=4;lo-=4;}
    var W=1120,H=360,p={l:62,r:34,t:38,b:52},x=function(i){return p.l+(W-p.l-p.r)*(data.length===1?.5:i/(data.length-1));},y=function(v){return p.t+(H-p.t-p.b)*(hi-v)/(hi-lo||1);},step=Math.max(1,Math.ceil(data.length/10)),zero=y(0);
    var path=function(k){return data.map(function(d,i){return (i?'L':'M')+x(i).toFixed(1)+','+y(Number(d[k])||0).toFixed(1);}).join(' ');};
    var grid=ticks65(lo,hi,5).map(function(v){var yy=y(v);return '<line x1="'+p.l+'" y1="'+yy+'" x2="'+(W-p.r)+'" y2="'+yy+'" stroke="var(--line2)"/><text x="'+(p.l-10)+'" y="'+(yy+4)+'" text-anchor="end" font-size="12" fill="var(--mut)">'+v.toFixed(1)+'%</text>';}).join('');
    var labels=data.map(function(d,i){return (i===0||i===data.length-1||i%step===0)?'<text x="'+x(i)+'" y="'+(H-15)+'" text-anchor="middle" font-size="12" font-weight="700" fill="var(--mut)">'+esc(String(d.date).slice(5))+'</text>':'';}).join('');
    function pts(k,c,dy){return data.map(function(d,i){var v=Number(d[k])||0,txt=d.isBase?'Base':v.toFixed(1)+'%';return '<g class="trendPointGroup65 trendNav66" role="button" tabindex="0" data-date="'+esc(String(d.date))+'" data-kind="management"><circle cx="'+x(i)+'" cy="'+y(v)+'" r="7" fill="'+c+'" stroke="#fff" stroke-width="3"></circle><text x="'+x(i)+'" y="'+(y(v)+dy)+'" text-anchor="middle" font-size="12" font-weight="900" fill="'+c+'">'+txt+'</text><title>'+d.date+': '+txt+'</title></g>';}).join('');}
    return '<div class="trendWrap trendWrap65"><svg class="trendSvg trendSvg65" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+grid+'<line x1="'+p.l+'" y1="'+zero+'" x2="'+(W-p.r)+'" y2="'+zero+'" stroke="var(--mut)" stroke-width="2" stroke-dasharray="6 5"/><path d="'+path('rotRecovery')+'" fill="none" stroke="var(--rot)" stroke-width="4"/>'+pts('rotRecovery','var(--rot)',-13)+'<path d="'+path('evacRecovery')+'" fill="none" stroke="var(--evac)" stroke-width="4"/>'+pts('evacRecovery','var(--evac)',20)+labels+'</svg></div><div class="trendLegend"><span><i style="background:var(--rot)"></i>Mejora Rotación</span><span><i style="background:var(--evac)"></i>Mejora Evacuación</span></div><div class="dashboardNote">La línea base se muestra en 0. Haz clic en un punto para abrir el detalle de ese corte.</div>';
  };

  function guideModal65(){
    var back=document.getElementById('guideKpiModalBack65');if(back)return back;
    back=document.createElement('div');back.id='guideKpiModalBack65';back.className='modalBack';back.onclick=function(e){if(e.target===back)window.closeGuideKpi65();};
    back.innerHTML='<div class="modal guideKpiModal65" role="dialog" aria-modal="true"><div class="modalHead"><div><h3 id="guideKpiTitle65">Detalle de Ambientes</h3><p id="guideKpiSub65">Información consolidada de la tienda</p></div><button class="modalClose" onclick="closeGuideKpi65()">×</button></div><div class="modalBody guideKpiBody65" id="guideKpiBody65"></div></div>';
    document.body.appendChild(back);return back;
  }
  window.closeGuideKpi65=function(){var x=document.getElementById('guideKpiModalBack65');if(x)x.classList.remove('on');document.body.style.overflow='';};
  function guideRows65(){var st=(typeof S!=='undefined'&&S&&S[CUR])||{};return (Array.isArray(st.guias)?st.guias:[]).map(function(g){var p=Array.isArray(g[6])?g[6]:[],ev=p.filter(function(x){return !!x[10];}),tot=Number(g[3])||0,pres=Number(g[4])||0;return {code:g[0],name:g[1],cat:g[2],tot:tot,pres:pres,pp:g[5]||[],prods:p,comp:tot?pres/tot*100:0,nCamino:ev.filter(function(x){return x[5]==='camino';}).length,nRequested:ev.filter(function(x){return x[5]==='requested'||x[5]==='requested_nostock';}).length,nAvailable:ev.filter(function(x){return x[5]==='available';}).length};});}
  function floorPct65(g,idx){var h=Number(g.pp[idx*2])||0,t=Number(g.pp[idx*2+1])||0;return t?h/t*100:0;}
  function statusText65(s){if(s==='camino')return 'En traslado';if(s==='requested'||s==='requested_nostock')return 'Solicitud realizada';if(s==='available')return 'Puedes solicitar';if(s==='ok'||s==='ok_requested'||s==='ok_inv')return 'Con existencia';return 'Pendiente';}
  window.openGuideKpiDetail65=function(filter){
    var f=filter||'all',rows=guideRows65(),st=(S&&S[CUR])||{},name=st.name||CUR,productMode=['camino','requested','available'].includes(f),titleMap={all:'Nivel de cobertura',completas:'Guías completas',avance:'Guías con avance',camino:'Productos en traslado',requested:'Solicitud realizada',available:'Puedes solicitar'};
    var modal=guideModal65(),body=document.getElementById('guideKpiBody65');document.getElementById('guideKpiTitle65').textContent=(titleMap[f]||'Detalle de Ambientes')+' · '+name;document.getElementById('guideKpiSub65').textContent='Presiona una guía o producto para abrir su información completa.';
    if(productMode){
      var statuses=f==='requested'?['requested','requested_nostock']:[f],items=[];rows.forEach(function(g){g.prods.filter(function(p){return !!p[10]&&statuses.includes(p[5]);}).forEach(function(p){items.push({guide:g,code:p[0],floor:p[1],sum:p[2],min:p[3],cendis:p[4],status:p[5],name:p[6]||(P[p[0]]&&P[p[0]].n)||p[0],inv:p[11]});});});
      body.innerHTML='<div class="guideDetailSummary65"><div><label>Registros</label><b>'+fInt(items.length)+'</b></div><div><label>Guías involucradas</label><b>'+fInt(new Set(items.map(function(x){return x.guide.code;})).size)+'</b></div><div><label>Tienda</label><b>'+esc(name)+'</b></div></div><div class="guideKpiTableWrap65"><table class="guideKpiTable65"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Guía</th><th>Piso</th><th class="num">CAN SUM</th><th class="num">CAN MIN</th><th class="num">CENDIS</th><th>Estado</th></tr></thead><tbody>'+items.map(function(x){return '<tr class="guideProductNav66" role="button" tabindex="0" data-product-code="'+esc(String(x.code))+'"><td>'+imageThumb(x.code,'sm')+'</td><td><span class="code">'+esc(x.code)+'</span></td><td><b>'+esc(x.name)+'</b></td><td>'+esc(x.guide.name)+'</td><td>Piso '+esc(x.floor)+'</td><td class="num">'+fInt(x.sum)+'</td><td class="num">'+fInt(x.min)+'</td><td class="num">'+fInt(x.cendis)+'</td><td><span class="guideStatus gs-'+esc(x.status)+'">'+statusText65(x.status)+'</span></td></tr>';}).join('')+'</tbody></table></div>';
    }else{
      var filtered=rows.filter(function(g){if(f==='completas')return g.comp>=100;if(f==='avance')return g.pres>0&&g.pres<g.tot;return true;});
      body.innerHTML='<div class="guideDetailSummary65"><div><label>Guías mostradas</label><b>'+fInt(filtered.length)+'</b></div><div><label>Posiciones cubiertas</label><b>'+fInt(filtered.reduce(function(a,g){return a+g.pres;},0))+'</b></div><div><label>Posiciones requeridas</label><b>'+fInt(filtered.reduce(function(a,g){return a+g.tot;},0))+'</b></div></div><div class="guideKpiTableWrap65"><table class="guideKpiTable65"><thead><tr><th>Guía</th><th>Categoría</th><th class="num">Cobertura</th><th class="num">Cubiertas</th><th class="num">Requeridas</th><th class="num">Piso 1</th><th class="num">Piso 2</th><th class="num">Faltantes</th></tr></thead><tbody>'+filtered.sort(function(a,b){return b.comp-a.comp;}).map(function(g){return '<tr class="guideRowNav66" role="button" tabindex="0" data-guide-code="'+esc(String(g.code))+'"><td><b>'+esc(g.name)+'</b><div class="auditMeta59">'+esc(g.code)+' · abrir guía →</div></td><td>'+esc(g.cat)+'</td><td class="num"><b>'+g.comp.toFixed(1)+'%</b></td><td class="num">'+fInt(g.pres)+'</td><td class="num">'+fInt(g.tot)+'</td><td class="num">'+floorPct65(g,0).toFixed(1)+'%</td><td class="num">'+floorPct65(g,1).toFixed(1)+'%</td><td class="num">'+fInt(Math.max(0,g.tot-g.pres))+'</td></tr>';}).join('')+'</tbody></table></div>';
    }
    modal.classList.add('on');document.body.style.overflow='hidden';
  };

  function enhance65(){
    document.querySelectorAll('.chartPair').forEach(function(pair){var titles=[...pair.querySelectorAll('.tt')].map(function(x){return x.textContent.trim();});if(titles.some(function(t){return t.indexOf('Tendencia histórica')===0;})&&titles.some(function(t){return t.indexOf('Tendencia de gestión')===0;}))pair.classList.add('leaderTrendPair65');});
    document.querySelectorAll('.guideKpiLike').forEach(function(card){card.setAttribute('role','button');card.setAttribute('tabindex','0');card.title='Abrir vista detallada';});
  }
  document.addEventListener('click',function(e){var card=e.target&&e.target.closest?e.target.closest('.guideKpiLike'):null;if(!card)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();window.openGuideKpiDetail65(card.dataset.guideFilter||'all');},true);
  document.addEventListener('keydown',function(e){var card=e.target&&e.target.closest?e.target.closest('.guideKpiLike'):null;if(!card||(e.key!=='Enter'&&e.key!==' '))return;e.preventDefault();window.openGuideKpiDetail65(card.dataset.guideFilter||'all');},true);

  var oldRefresh65=window.refresh;if(typeof oldRefresh65==='function')window.refresh=function(){var out=oldRefresh65.apply(this,arguments);setTimeout(enhance65,0);return out;};
  setTimeout(enhance65,0);
})();


/* ===== llavero-v66-click-fix-script ===== */
(function(){
  'use strict';
  window.LLAVERO_BUILD='V79';
  if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');

  function stop66(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();}
  function storeCodeByText66(el){
    if(!el||typeof S==='undefined'||!S)return '';
    var txt=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    var found='';Object.keys(S).some(function(code){var name=String((S[code]&&S[code].name)||code).trim().toLowerCase();if(name&&txt.indexOf(name)!==-1){found=code;return true;}return false;});return found;
  }
  function openStore66(el){
    var code=(el&&el.dataset&&el.dataset.store)||storeCodeByText66(el),view=(el&&el.dataset&&el.dataset.view)||'resumen';
    if(!code)return false;
    if(typeof window.goToStore65==='function')window.goToStore65(code,view);
    else if(typeof window.openStoreDashboard==='function')window.openStoreDashboard(code,view);
    return true;
  }
  function trendInfo66(el){
    var date=el&&el.dataset&&el.dataset.date,kind=el&&el.dataset&&el.dataset.kind;
    if(!date){var t=el&&el.querySelector&&el.querySelector('title');var m=t&&String(t.textContent||'').match(/\d{4}-\d{2}-\d{2}/);date=m?m[0]:'';}
    if(!kind){var card=el&&el.closest&&el.closest('.card'),title=card&&card.querySelector('.tt');kind=title&&/gesti[oó]n/i.test(title.textContent||'')?'management':'exposure';}
    return {date:date,kind:kind||'exposure'};
  }
  function openTrend66(el){var x=trendInfo66(el);if(!x.date||typeof window.openTrendPoint59!=='function')return false;window.openTrendPoint59(x.date,x.kind);return true;}
  function openGuideProduct66(el){var code=el&&el.dataset&&el.dataset.productCode;if(!code)return false;if(typeof window.closeGuideKpi65==='function')window.closeGuideKpi65();setTimeout(function(){if(typeof window.openGuideProduct==='function')window.openGuideProduct(code);else if(typeof window.openBestProductDetail==='function')window.openBestProductDetail(code);},40);return true;}
  function openGuide66(el){var code=el&&el.dataset&&el.dataset.guideCode;if(!code)return false;if(typeof window.closeGuideKpi65==='function')window.closeGuideKpi65();setTimeout(function(){if(typeof window.openGuideDetailV48==='function')window.openGuideDetailV48(code);},40);return true;}
  function target66(node){if(!node||!node.closest)return null;return node.closest('.guideProductNav66,.guideRowNav66,.trendNav66,.trendPointGroup65,.trendPoint59,.storeNav66,.storeLink65,.scoreCompareRow59,.storeAuditRow59');}
  function activate66(el){
    if(!el)return false;
    if(el.matches('.guideProductNav66'))return openGuideProduct66(el);
    if(el.matches('.guideRowNav66'))return openGuide66(el);
    if(el.matches('.trendNav66,.trendPointGroup65,.trendPoint59'))return openTrend66(el);
    return openStore66(el);
  }
  document.addEventListener('click',function(e){var el=target66(e.target);if(!el)return;stop66(e);activate66(el);},true);
  document.addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var el=target66(e.target);if(!el)return;stop66(e);activate66(el);},true);

  function mark66(){
    document.querySelectorAll('.scoreCompareRow59,.storeAuditRow59').forEach(function(el){if(!el.dataset.store){var c=storeCodeByText66(el);if(c)el.dataset.store=c;}if(!el.dataset.view)el.dataset.view='resumen';el.classList.add('storeNav66');el.setAttribute('role','button');el.setAttribute('tabindex','0');});
    document.querySelectorAll('.trendPointGroup65,.trendPoint59').forEach(function(el){var x=trendInfo66(el);if(x.date)el.dataset.date=x.date;if(x.kind)el.dataset.kind=x.kind;el.classList.add('trendNav66');el.setAttribute('role','button');el.setAttribute('tabindex','0');});
  }
  var obs=new MutationObserver(function(){clearTimeout(window.__llaveroMark66);window.__llaveroMark66=setTimeout(mark66,20);});
  setTimeout(mark66,0);
})();


/* ===== llavero-v67-visual-summary-script ===== */
(function(){
  'use strict';
  window.LLAVERO_BUILD='V79';
  if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');

  function num67(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function int67(v){return Math.round(num67(v)).toLocaleString('es-CO');}
  function dec67(v,d){return num67(v).toLocaleString('es-CO',{minimumFractionDigits:d,maximumFractionDigits:d});}
  function safe67(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c;});}
  function date67(v){var s=String(v||'');if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s.slice(8,10)+'/'+s.slice(5,7);return s;}
  function ticks67(lo,hi,n){var a=[];for(var i=0;i<n;i++)a.push(lo+(hi-lo)*(i/(n-1)));return a;}
  function trendData67(){return typeof networkTrendData59==='function'?networkTrendData59():(typeof networkTrendData==='function'?networkTrendData():[]);}
  function managementData67(){return typeof networkManagementTrendData59==='function'?networkManagementTrendData59():(typeof networkManagementTrendData==='function'?networkManagementTrendData():[]);}

  window.trendSvg=function(){
    var data=trendData67();
    if(data.length<2)return '<div class="empty">Aún existe una sola carga.</div>';
    var vals=[];data.forEach(function(d){vals.push(num67(d.rotPct),num67(d.evacPct));});
    var min=Math.min.apply(null,vals),max=Math.max.apply(null,vals),spread=Math.max(1,max-min),margin=Math.max(3.5,spread*.14),lo=Math.max(0,min-margin),hi=Math.min(100,max+margin);
    if(hi-lo<12){var mid=(hi+lo)/2;lo=Math.max(0,mid-6);hi=Math.min(100,mid+6);}
    var W=1280,H=470,p={l:78,r:46,t:54,b:66},plotW=W-p.l-p.r,plotH=H-p.t-p.b;
    var x=function(i){return p.l+plotW*(data.length===1?.5:i/(data.length-1));};
    var y=function(v){return p.t+plotH*(hi-v)/(hi-lo||1);};
    var step=Math.max(1,Math.ceil(data.length/12));
    function path(k){return data.map(function(d,i){return (i?'L':'M')+x(i).toFixed(1)+','+y(num67(d[k])).toFixed(1);}).join(' ');}
    var grid=ticks67(lo,hi,6).map(function(v){var yy=y(v);return '<line x1="'+p.l+'" y1="'+yy+'" x2="'+(W-p.r)+'" y2="'+yy+'" stroke="var(--line2)" stroke-width="1.5"/><text x="'+(p.l-13)+'" y="'+(yy+5)+'" text-anchor="end" font-size="14" font-weight="800" fill="var(--mut)">'+v.toFixed(1)+'%</text>';}).join('');
    var labels=data.map(function(d,i){return (i===0||i===data.length-1||i%step===0)?'<text x="'+x(i)+'" y="'+(H-20)+'" text-anchor="middle" font-size="14" font-weight="850" fill="var(--mut)">'+safe67(date67(d.date))+'</text>':'';}).join('');
    function pts(k,c,dy){return data.map(function(d,i){var v=num67(d[k]);return '<g class="trendPointGroup65 trendNav66" role="button" tabindex="0" data-date="'+safe67(d.date)+'" data-kind="exposure"><circle cx="'+x(i)+'" cy="'+y(v)+'" r="9" fill="'+c+'" stroke="#fff" stroke-width="4"></circle><text x="'+x(i)+'" y="'+(y(v)+dy)+'" text-anchor="middle" font-size="15" font-weight="950" fill="'+c+'" style="paint-order:stroke;stroke:#fff;stroke-width:4px">'+v.toFixed(1)+'%</text><title>'+safe67(d.date)+': '+v.toFixed(1)+'%</title></g>';}).join('');}
    return '<div class="trendWrap67"><svg class="trendSvg67" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+grid+'<path d="'+path('rotPct')+'" fill="none" stroke="var(--rot)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'+pts('rotPct','var(--rot)',-17)+'<path d="'+path('evacPct')+'" fill="none" stroke="var(--evac)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'+pts('evacPct','var(--evac)',27)+labels+'</svg></div><div class="trendLegend67"><span><i style="background:var(--rot)"></i>Rotación</span><span><i style="background:var(--evac)"></i>Evacuación</span></div>';
  };

  window.managementTrendSvg=function(){
    var data=managementData67();
    if(!data.length)return '<div class="empty">Sin cortes.</div>';
    var vals=[0];data.forEach(function(d){vals.push(num67(d.rotRecovery),num67(d.evacRecovery));});
    var min=Math.min.apply(null,vals),max=Math.max.apply(null,vals),spread=Math.max(1,max-min),margin=Math.max(2.5,spread*.2),lo=min-margin,hi=max+margin;
    if(hi-lo<10){var mid=(hi+lo)/2;lo=mid-5;hi=mid+5;}
    var W=1280,H=470,p={l:78,r:46,t:54,b:66},plotW=W-p.l-p.r,plotH=H-p.t-p.b;
    var x=function(i){return p.l+plotW*(data.length===1?.5:i/(data.length-1));};
    var y=function(v){return p.t+plotH*(hi-v)/(hi-lo||1);};
    var step=Math.max(1,Math.ceil(data.length/12)),zero=y(0);
    function path(k){return data.map(function(d,i){return (i?'L':'M')+x(i).toFixed(1)+','+y(num67(d[k])).toFixed(1);}).join(' ');}
    var grid=ticks67(lo,hi,6).map(function(v){var yy=y(v);return '<line x1="'+p.l+'" y1="'+yy+'" x2="'+(W-p.r)+'" y2="'+yy+'" stroke="var(--line2)" stroke-width="1.5"/><text x="'+(p.l-13)+'" y="'+(yy+5)+'" text-anchor="end" font-size="14" font-weight="800" fill="var(--mut)">'+v.toFixed(1)+'%</text>';}).join('');
    var labels=data.map(function(d,i){return (i===0||i===data.length-1||i%step===0)?'<text x="'+x(i)+'" y="'+(H-20)+'" text-anchor="middle" font-size="14" font-weight="850" fill="var(--mut)">'+safe67(date67(d.date))+'</text>':'';}).join('');
    function pts(k,c,dy){return data.map(function(d,i){var v=num67(d[k]),txt=d.isBase?'Base':v.toFixed(1)+'%';return '<g class="trendPointGroup65 trendNav66" role="button" tabindex="0" data-date="'+safe67(d.date)+'" data-kind="management"><circle cx="'+x(i)+'" cy="'+y(v)+'" r="9" fill="'+c+'" stroke="#fff" stroke-width="4"></circle><text x="'+x(i)+'" y="'+(y(v)+dy)+'" text-anchor="middle" font-size="15" font-weight="950" fill="'+c+'" style="paint-order:stroke;stroke:#fff;stroke-width:4px">'+txt+'</text><title>'+safe67(d.date)+': '+txt+'</title></g>';}).join('');}
    return '<div class="trendWrap67"><svg class="trendSvg67" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+grid+'<line x1="'+p.l+'" y1="'+zero+'" x2="'+(W-p.r)+'" y2="'+zero+'" stroke="var(--mut)" stroke-width="2.5" stroke-dasharray="8 7"/><path d="'+path('rotRecovery')+'" fill="none" stroke="var(--rot)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'+pts('rotRecovery','var(--rot)',-17)+'<path d="'+path('evacRecovery')+'" fill="none" stroke="var(--evac)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'+pts('evacRecovery','var(--evac)',27)+labels+'</svg></div><div class="trendLegend67"><span><i style="background:var(--rot)"></i>Mejora Rotación</span><span><i style="background:var(--evac)"></i>Mejora Evacuación</span></div><div class="dashboardNote">La línea base se muestra en 0. Presiona un punto para consultar el detalle del corte.</div>';
  };

  function findCard67(title){
    var all=document.querySelectorAll('.card .tt');
    for(var i=0;i<all.length;i++)if((all[i].textContent||'').trim()===title)return all[i].closest('.card');
    return null;
  }
  function guideAdvance67(st){return (st.guias||[]).filter(function(g){return num67(g&&g[4])>0&&num67(g&&g[4])<num67(g&&g[3]);}).length;}
  function metric67(label,value,cls){return '<div class="summaryModuleMetric67 '+(cls||'')+'"><span class="l">'+label+'</span><span class="v">'+value+'</span></div>';}

  function enhanceSummary67(){
    if(typeof S==='undefined'||!S||typeof CUR==='undefined'||!S[CUR])return;
    var st=S[CUR],k=st.kpi||{},amb=st.amb||{};
    var tr=findCard67('Traslados de la tienda');
    if(tr){
      var trSig=[CUR,k.trN,k.trU,k.trVol,k.trPick,k.trMov,k.trRev].join('|');
      if(tr.dataset.v67sig!==trSig){
        tr.dataset.v67sig=trSig;
        var ds=tr.querySelector('.ds');if(ds)ds.textContent='Estado operativo de la mercancía que se dirige a la tienda';
        var badge=tr.querySelector('.rt .badge');if(badge)badge.textContent=int67(k.trN)+' líneas activas';
        var body=tr.querySelector('.cbody');if(body)body.innerHTML='<div class="summaryModuleGrid67">'+metric67('Unidades en tránsito',int67(k.trU),'ok')+metric67('Volumen estimado',dec67(k.trVol,1)+' m³','')+metric67('Pendientes de picking',int67(k.trPick),'warn')+metric67('Pendientes de movimiento',int67(k.trMov),'bad')+'</div><div class="summaryModuleFoot67"><span><b>'+int67(k.trRev)+'</b> movimientos tienen fecha por revisar.</span><a class="chip" onclick="gotoView(\'traslados\')">Ver traslados →</a></div>';
      }
    }
    var am=findCard67('Ambientes de la tienda');
    if(am){
      var nG=num67(amb.nG)||(st.guias||[]).length,complete=num67(amb.gCompletas)||num67(k.guiaCompletas),advance=guideAdvance67(st),covered=num67(amb.haveTotal),required=num67(amb.reqTotal),missing=num67(amb.faltTot)||num67(k.guiaFalt),camino=num67(amb.faltCamino),requested=num67(amb.faltRequested),available=num67(amb.faltAvailable),coverage=num67(amb.compTotalPct)||num67(k.guiaComp);
      var amSig=[CUR,nG,complete,advance,covered,required,missing,camino,requested,available,coverage].join('|');
      if(am.dataset.v67sig!==amSig){
        am.dataset.v67sig=amSig;
        var ads=am.querySelector('.ds');if(ads)ads.textContent='Cobertura real de las guías de exhibición en Piso 1 y Piso 2';
        var abadge=am.querySelector('.rt .badge');if(abadge)abadge.textContent=dec67(coverage,1)+'% cobertura';
        var abody=am.querySelector('.cbody');if(abody)abody.innerHTML='<div class="summaryModuleGrid67">'+metric67('Guías completas',int67(complete)+' / '+int67(nG),'ok')+metric67('Guías con avance',int67(advance),'')+metric67('Productos en traslado',int67(camino),'warn')+metric67('Puedes solicitar',int67(available),'ok')+'</div><div class="summaryModuleFoot67"><span><b>'+int67(covered)+' de '+int67(required)+'</b> posiciones cubiertas · <b>'+int67(missing)+'</b> faltantes · <b>'+int67(requested)+'</b> con solicitud realizada.</span><a class="chip" onclick="gotoView(\'amb\')">Ver ambientes →</a></div>';
      }
    }
  }

  function enhanceTrends67(){
    document.querySelectorAll('.chartPair').forEach(function(pair){
      var titles=Array.prototype.map.call(pair.querySelectorAll('.tt'),function(x){return (x.textContent||'').trim();});
      if(titles.some(function(t){return t.indexOf('Tendencia histórica de Rotación y Evacuación')===0;})&&titles.some(function(t){return t.indexOf('Tendencia de gestión diaria')===0;}))pair.classList.add('leaderTrendPair67');
    });
  }
  function enhanceMetrics67(){document.querySelectorAll('.trackingMetric b').forEach(function(b){b.title=(b.textContent||'').trim();});}
  function enhance67(){var vb=document.querySelector('.appVersionChip b');if(vb&&vb.textContent.indexOf('V79')<0)vb.textContent=vb.textContent.replace(/V\d+$/,'V79');enhanceTrends67();enhanceMetrics67();enhanceSummary67();}
  var queued=false;
  function queue67(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;enhance67();});}
  /* V82: sin observador global V67. */
  var oldRefresh67=window.refresh;
  if(typeof oldRefresh67==='function')window.refresh=function(){var out=oldRefresh67.apply(this,arguments);setTimeout(enhance67,0);return out;};
  setTimeout(function(){
    enhance67();
    if(!window.__llaveroV67InitialRefresh&&typeof window.refresh==='function'){
      window.__llaveroV67InitialRefresh=true;
      window.refresh();
    }
  },0);
})();


/* ===== llavero-v68-core-complemento-script ===== */
(function(){
  'use strict';
  window.LLAVERO_BUILD='V79';
  if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');
  var CC_SUBLINEA_68={"CAMA DOBLE BASIC":"CORE","COLCHON FULL":"CORE","COMEDOR 4 PTOS":"CORE","COMEDOR 6 PTOS":"CORE","COLCHON QUEEN":"CORE","SALA FUNCIONAL":"CORE","COLCHON TWIN":"CORE","SOFA 3 PTOS":"CORE","SOFACAMA":"CORE","SALA CAMA":"CORE","NOCHERO":"COMPLEMENTO","SILLA RECLINABLE":"COMPLEMENTO","ALCOBA DOBLE":"CORE","SALA RINCONERA":"CORE","SOFA 2 PTOS":"CORE","BUTACA":"COMPLEMENTO","COLCHON KING":"CORE","CENTRO ENTRETENIMIEN":"COMPLEMENTO","MESA DE CENTRO":"COMPLEMENTO","TENDIDO":"COMPLEMENTO","TOCADOR":"COMPLEMENTO","LITERA":"COMPLEMENTO","PANEL DE TV":"COMPLEMENTO","ROPERO":"COMPLEMENTO","SALA MODULAR":"CORE","SILLA BAR":"COMPLEMENTO","CAMA SENCILLA BASIC":"COMPLEMENTO","DUPLEX":"COMPLEMENTO","BIFE":"COMPLEMENTO","CAMA CUNA":"COMPLEMENTO","SOFA RECLINABLE 3 PT":"COMPLEMENTO","SOFA RECLINABLE 2 PT":"COMPLEMENTO","MECEDORA":"COMPLEMENTO","CONSOLA":"COMPLEMENTO","SOMIER FULL":"COMPLEMENTO","ALMOHADA":"COMPLEMENTO","CAMA DOBLE":"CORE","SOMIER QUEEN":"COMPLEMENTO","MESA ESQUINERA":"COMPLEMENTO","COMODA INFANTIL":"COMPLEMENTO","ESCRITORIO":"COMPLEMENTO","MESA DE TV":"COMPLEMENTO","MUESTRA COLCHON":"COMPLEMENTO","SOMIER TWIN":"COMPLEMENTO","COMEDOR 8 PTOS":"CORE","SILLA COMEDOR":"COMPLEMENTO","CABECERA":"COMPLEMENTO","MARCO ESPEJO":"COMPLEMENTO","CAMA INFANTIL BASIC":"COMPLEMENTO","COMODA":"COMPLEMENTO","SOMIER KING":"COMPLEMENTO","CUNAS":"COMPLEMENTO","ALCOBA JUVENIL":"COMPLEMENTO","CAMA MULTIFUNCIONAL":"COMPLEMENTO","PUFF":"COMPLEMENTO","PROTECTOR":"COMPLEMENTO","BIBLIOTECA":"COMPLEMENTO","MESA FLOTANTE TV":"COMPLEMENTO","VITRINA":"COMPLEMENTO","MUESTRA ENTRENIMIENT":"COMPLEMENTO","CHAISE LONGUE":"COMPLEMENTO","SILLAS DE EXTERIORES":"COMPLEMENTO","COMBO COLCHON":"COMPLEMENTO","ZAPATERA":"COMPLEMENTO","SILLA DE OFICINA":"COMPLEMENTO","REPISA PARED":"COMPLEMENTO","BASE COMEDOR":"COMPLEMENTO","BASE CAMA 1.40":"COMPLEMENTO","BARRA PANTRY":"COMPLEMENTO","CENTRO DE MESA":"COMPLEMENTO","BASE CAMA 1.00":"COMPLEMENTO","MUESTRA SOMIER":"COMPLEMENTO","VIDRIO 6 PTOS":"COMPLEMENTO","MUESTRA CLOSET":"COMPLEMENTO","CAMA INFANTIL":"COMPLEMENTO","MUEBLE JUGUETERO":"COMPLEMENTO","SET TERRAZA EXTERIOR":"COMPLEMENTO","OBSEQUIO CAMA":"COMPLEMENTO","CAMA DOBLE COL":"COMPLEMENTO","COMODA DOBLE":"COMPLEMENTO","VIDRIO 4 PTOS":"COMPLEMENTO","SOFA 1 PUESTO":"COMPLEMENTO","COMEDOR 4P EXTEROR":"COMPLEMENTO","BASE CAMA 2X2":"COMPLEMENTO","CUBIERTA MESA CENTRO":"COMPLEMENTO","MODULO AUXILIAR":"COMPLEMENTO","EUROCUERO":"COMPLEMENTO","BASE CAMA 1.60":"COMPLEMENTO","PROMO CAMA":"COMPLEMENTO","OBSEQUIO RTA CLO":"COMPLEMENTO","NOCHERO INFANTIL":"COMPLEMENTO","OBSEQUIIO":"COMPLEMENTO","MUEBLE EXTERIOR":"COMPLEMENTO","MESA ESQUINERA EXTER":"COMPLEMENTO","LUNA":"COMPLEMENTO","COMEDOR 6P EXTERIOR":"COMPLEMENTO","BASE CAMA 1.20":"COMPLEMENTO","VIDRIO 8 PTOS":"COMPLEMENTO","OBSEQUIO SAL":"COMPLEMENTO","TOCADOR JUVENIL":"COMPLEMENTO","ARCHIVADOR":"COMPLEMENTO","PRODUCTO LIMPIEZA":"COMPLEMENTO","ENTREPAÑO":"COMPLEMENTO","VELVET":"COMPLEMENTO","UNION":"COMPLEMENTO","TRIPLEX":"COMPLEMENTO","TOCADOR INFANTIL":"COMPLEMENTO","TARUGO":"COMPLEMENTO","TAFETA":"COMPLEMENTO","SOMIER":"COMPLEMENTO","SISTEMA DE SONIDO":"COMPLEMENTO","SD":"COMPLEMENTO","RODACHIN":"COMPLEMENTO","ROBLE":"COMPLEMENTO","RIEL":"COMPLEMENTO","RESORTE":"COMPLEMENTO","REPUESTO ZAPATERA":"COMPLEMENTO","REPUESTO VITRINA":"COMPLEMENTO","REPUESTO TOCADOR":"COMPLEMENTO","REPUESTO SOFACAMA":"COMPLEMENTO","REPUESTO ROPERO":"COMPLEMENTO","REPUESTO PUFF":"COMPLEMENTO","REPUESTO PROTECTOR":"COMPLEMENTO","REPUESTO PANEL TV":"COMPLEMENTO","REPUESTO OBSEQUIIO":"COMPLEMENTO","REPUESTO NOCHERO":"COMPLEMENTO","REPUESTO MESA DE TV":"COMPLEMENTO","REPUESTO MESA BAR":"COMPLEMENTO","REPUESTO LITERA":"COMPLEMENTO","REPUESTO DE MAQUINA":"COMPLEMENTO","REPUESTO CUNA":"COMPLEMENTO","REPUESTO CONSOLA":"COMPLEMENTO","REPUESTO COMODA":"COMPLEMENTO","REPUESTO CAMA SENCIL":"COMPLEMENTO","REPUESTO CAMA DOBLE":"COMPLEMENTO","REPUESTO CAMA CUNA":"COMPLEMENTO","REPUESTO CABECERA":"COMPLEMENTO","REPUESTO BIFE":"COMPLEMENTO","REPUESTO BIBLIOTECA":"COMPLEMENTO","REPUESTO BASE COMED":"COMPLEMENTO","REPUES.MARCO ESPEJO":"COMPLEMENTO","REPUES.CAMA INFANTIL":"COMPLEMENTO","REPISA INFANTIL":"COMPLEMENTO","REP.MUEBLE DE COCINA":"COMPLEMENTO","REP.MESA ESQUINERA":"COMPLEMENTO","REP.MESA DECORATIVA":"COMPLEMENTO","REP.MESA DE COMPUTO":"COMPLEMENTO","REP.MESA DE CENTRO":"COMPLEMENTO","REP.COMEDOR 6 PTOS":"COMPLEMENTO","REP.COMEDOR 6 PT OS":"COMPLEMENTO","REP.COMEDOR 4 PTOS":"COMPLEMENTO","REP.CENTRO ENTRETEN.":"COMPLEMENTO","REP.CENTRO DE MESA":"COMPLEMENTO","REP.CAMA SENCILLA":"COMPLEMENTO","REP.CAMA INF.BASIC":"COMPLEMENTO","REP.CAMA DOBLE BASIC":"COMPLEMENTO","REP. SILLA COMEDOR":"COMPLEMENTO","PUERTA":"COMPLEMENTO","PROTECTOR DE ENCIA":"COMPLEMENTO","POR IDENTIFICAR":"COMPLEMENTO","PLASTICO":"COMPLEMENTO","PINTURA":"COMPLEMENTO","PEGANTE":"COMPLEMENTO","PATA":"COMPLEMENTO","PASAMERIA":"COMPLEMENTO","OBSEQUIO RTA ENT":"COMPLEMENTO","OBSEQUIO RTA COC":"COMPLEMENTO","OBSEQUIO DOR":"COMPLEMENTO","OBSEQUIO COM":"COMPLEMENTO","MUESTR MODULO CLOSET":"COMPLEMENTO","MUEST MODULO ZAPATER":"COMPLEMENTO","MUEBLE DE COCINA":"COMPLEMENTO","MUEBLE DE BAR":"COMPLEMENTO","MODULO ZAPATERO":"COMPLEMENTO","MODULO CLOSET":"COMPLEMENTO","MICROFIBRA":"COMPLEMENTO","MESA DECORATIVA":"COMPLEMENTO","MESA CENTRO MARMOL":"COMPLEMENTO","MESA BAR":"COMPLEMENTO","MECANISMO":"COMPLEMENTO","MAQUINARI.TAPIZADO":"COMPLEMENTO","MAQUINAR.Y PINTURA":"COMPLEMENTO","MAQUIN.EBANISTERIA":"COMPLEMENTO","MANIJA":"COMPLEMENTO","LINO":"COMPLEMENTO","LIJA":"COMPLEMENTO","LIENCILLO":"COMPLEMENTO","KIT MADERA":"COMPLEMENTO","ICOPOR":"COMPLEMENTO","HUACAL":"COMPLEMENTO","HILO":"COMPLEMENTO","HERRAMIENTA":"COMPLEMENTO","GRAPA":"COMPLEMENTO","GAVETA":"COMPLEMENTO","GABINETE INFERIOR":"COMPLEMENTO","GABINETE AEREO":"COMPLEMENTO","FIBRA SILICONADA":"COMPLEMENTO","ETIQUETA":"COMPLEMENTO","ESPUMA":"COMPLEMENTO","CUBRIMIENTO":"COMPLEMENTO","CORTE DE MADERA":"COMPLEMENTO","CINCHA":"COMPLEMENTO","CHENILLE":"COMPLEMENTO","CENTRO ENTRETENIMIENTO":"COMPLEMENTO","CARTON":"COMPLEMENTO","CAMA SENCILLA":"COMPLEMENTO","CAMA NIDO":"COMPLEMENTO","CAJONERA AUXILIAR":"COMPLEMENTO","BUTACA EXTERIOR":"COMPLEMENTO","ALCOBA INFANTIL":"COMPLEMENTO","AIRE ACONDICIONADO":"COMPLEMENTO","SALA RINCO. RECLINA.":"CORE"};
  var SALES_LIMIT_68={store:null,top:10,low:10};

  function norm68(v){return String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,' ');}
  function n68(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function ccFromSub68(sub){return CC_SUBLINEA_68[norm68(sub)]||'';}
  function ccCode68(code,p){p=p||(typeof P!=='undefined'&&P?P[safeCode(code)]:{})||{};var direct=norm68(p.cc);if(direct==='CORE')return 'CORE';if(direct==='COMPLEMENTO'||direct==='COMPLEMENTOS')return 'COMPLEMENTO';return ccFromSub68(p.sub);}
  function ccLabel68(code,p){return ccCode68(code,p)||'SIN CLASIFICACIÓN';}
  function ccClass68(cc){return cc==='CORE'?'core':cc==='COMPLEMENTO'?'comp':'none';}
  function ccBadge68(cc){var x=cc||'SIN CLASIFICACIÓN';return '<span class="ccBadge68 '+ccClass68(x)+'">'+esc(x)+'</span>';}
  window.llaveroClasificacion68=ccLabel68;

  var baseProductInfo68=window.productInfo;
  if(typeof baseProductInfo68==='function')window.productInfo=function(code){var x=baseProductInfo68(code);x.cc=ccLabel68(code,(typeof P!=='undefined'&&P?P[safeCode(code)]:null));return x;};

  function modal68(title,subtitle,body){var modal=document.getElementById('rangeModal'),t=document.getElementById('rangeModalTitle'),s=document.getElementById('rangeModalSubtitle'),b=document.getElementById('rangeModalBody');if(!modal||!b)return;if(t)t.textContent=title;if(s)s.textContent=subtitle||'';b.innerHTML=body;modal.classList.add('on');}
  function productOpen68(code,store){if(store&&typeof S!=='undefined'&&S[store]){CUR=store;if(typeof sel!=='undefined'&&sel)sel.value=store;}var c=safeCode(code),inv=(typeof normalizeInventoryRows==='function'&&S[CUR])?normalizeInventoryRows(S[CUR]).find(function(r){return r.c===c;}):null;if(inv&&typeof window.openInventoryProduct==='function')return window.openInventoryProduct(c);if(typeof window.openProductFromSales==='function')return window.openProductFromSales(c);if(typeof window.openBestProductDetail==='function')return window.openBestProductDetail(c);}

  function stats68(rows,valueKey){var codes=new Set(),u=0,v=0;rows.forEach(function(r){codes.add(r.c);u+=n68(r.u);v+=n68(r[valueKey]);});return {refs:codes.size,units:u,value:v};}
  function rowsByCC68(rows,cc){return rows.filter(function(r){return ccCode68(r.c,(typeof P!=='undefined'&&P?P[r.c]:null))===cc;});}
  function card68(module,cc,st){return '<button class="ccCard68 '+ccClass68(cc)+'" type="button" data-v68-cc-module="'+module+'" data-v68-cc="'+cc+'"><div class="ccTitle68"><span>'+cc+'</span>'+ccBadge68(cc)+'</div><div class="ccMain68">'+fInt(st.units)+' unidades</div><div class="ccMeta68"><span>Productos<b>'+fInt(st.refs)+'</b></span><span>Unidades<b>'+fInt(st.units)+'</b></span><span>Valor<b>'+fMoneyCOP(st.value)+'</b></span></div></button>';}
  var AGE_ORDER_68={'360 - Más':10,'360 - MAS':10,'241 - 360':9,'210 - 240':8,'181 - 210':7,'151 - 180':6,'121 - 150':5,'091 - 120':4,'061 - 090':3,'031 - 060':2,'000 - 030':1,'SIN DEFINIR':0};
  function age68(r,module){return canonicalAgeLabel(module==='rot'?r.ageLabel:r.edad);}
  function ageDiagram68(rows,module){var g={};rows.forEach(function(r){var cc=ccCode68(r.c,(typeof P!=='undefined'&&P?P[r.c]:null));if(cc!=='CORE'&&cc!=='COMPLEMENTO')return;var a=age68(r,module);if(!g[a])g[a]={CORE:{codes:new Set(),u:0},COMPLEMENTO:{codes:new Set(),u:0}};g[a][cc].codes.add(r.c);g[a][cc].u+=n68(r.u);});var ages=Object.keys(g).sort(function(a,b){return (AGE_ORDER_68[b]||0)-(AGE_ORDER_68[a]||0);});if(!ages.length)return '<div class="empty">No hay productos CORE o COMPLEMENTO para esta selección.</div>';return '<div class="ccAgePanel68"><div class="ccAgeHead68"><span>Antigüedad</span><span>CORE</span><span>COMPLEMENTO</span></div>'+ages.map(function(a){function btn(cc){var x=g[a][cc];return '<button type="button" class="ccAgeBtn68" data-v68-age-module="'+module+'" data-v68-age-cc="'+cc+'" data-v68-age="'+esc(a)+'"><span>'+cc+'</span><b>'+fInt(x.codes.size)+' prod. · '+fInt(x.u)+' uds.</b></button>';}return '<div class="ccAgeRow68"><div class="ccAgeLabel68">'+esc(a)+'</div>'+btn('CORE')+btn('COMPLEMENTO')+'</div>';}).join('')+'</div>';}

  function detailRows68(rows,module,title,subtitle){var refs=new Set(),units=0,value=0;rows.forEach(function(r){refs.add(r.c);units+=n68(r.u);value+=n68(module==='rot'?r.val:module==='evac'?r.v:r.v);});var body='<div class="v68ModalSummary"><div class="v68ModalKpi"><label>Productos</label><b>'+fInt(refs.size)+'</b></div><div class="v68ModalKpi"><label>Unidades</label><b>'+fInt(units)+'</b></div><div class="v68ModalKpi"><label>Valor</label><b>'+fMoneyCOP(value)+'</b></div><div class="v68ModalKpi"><label>Tienda</label><b>'+esc(S[CUR]&&S[CUR].name||CUR)+'</b></div></div><div class="v68DetailTableWrap"><table class="v68DetailTable"><thead><tr><th>Código</th><th>Producto</th><th>Clasificación</th><th>Categoría / Línea / Sublínea</th><th>Antigüedad</th><th class="num">Unidades</th><th class="num">Valor</th></tr></thead><tbody>'+rows.map(function(r){var cc=ccLabel68(r.c,(typeof P!=='undefined'&&P?P[r.c]:null)),age=module==='rot'?r.ageLabel:r.edad,val=module==='rot'?r.val:r.v;return '<tr class="ccClickRow68" tabindex="0" role="button" data-v68-product="'+esc(r.c)+'"><td><span class="code">'+esc(r.c)+'</span></td><td><b>'+esc(r.p.n)+'</b></td><td>'+ccBadge68(cc)+'</td><td>'+esc(r.p.cat)+' · '+esc(r.p.lin)+' · '+esc(r.p.sub)+'</td><td>'+esc(age)+'</td><td class="num"><b>'+fInt(r.u)+'</b></td><td class="num"><b>'+fMoneyCOP(val)+'</b></td></tr>';}).join('')+'</tbody></table></div>';modal68(title,subtitle,body);}
  function openCCDetail68(module,cc,age){var st=S[CUR]||{},rows=module==='rot'?normalizeRotRows(st):normalizeEvacRows(st).filter(function(r){return r.active;});rows=rowsByCC68(rows,cc);if(age)rows=rows.filter(function(r){return age68(r,module)===age;});detailRows68(rows,module,(module==='rot'?'Rotación':'Evacuación')+' · '+cc,(age?age+' · ':'')+(S[CUR]&&S[CUR].name||CUR));}
  window.openCCDetail68=openCCDetail68;

  window.viewRot=function(st){var k=st.kpi||{},all=normalizeRotRows(st),core=stats68(rowsByCC68(all,'CORE'),'val'),comp=stats68(rowsByCC68(all,'COMPLEMENTO'),'val'),un=all.filter(function(r){return !ccCode68(r.c,(typeof P!=='undefined'&&P?P[r.c]:null));}).length;return '<div class="card"><div class="chead"><div class="cnum n1">1</div><div><div class="tt">Rotación</div><div class="ds">Productos estado A (Línea) con más de 90 días en tienda, clasificados por CORE y COMPLEMENTO</div></div><div class="rt"><span class="badge warm">'+fInt(k.rotN)+' por rotar</span></div></div><div class="cbody"><div class="mkpis"><div class="mk r"><div class="l">Productos</div><div class="v">'+fInt(k.rotN)+'</div></div><div class="mk r"><div class="l">Unidades &gt;90d</div><div class="v">'+fInt(k.rotU)+'</div></div><div class="mk r"><div class="l">Valor detenido</div><div class="v">'+fMoney(k.rotVal)+'</div></div><div class="mk b"><div class="l">Sin venta 3 meses</div><div class="v">'+fInt(k.rotSin)+'</div></div></div><div class="ccOverview68">'+card68('rot','CORE',core)+card68('rot','COMPLEMENTO',comp)+'</div><div class="legend" style="margin-bottom:4px"><b>Rotación por antigüedad · productos y unidades CORE / COMPLEMENTO</b></div><div id="cc-age-rot68">'+ageDiagram68(all,'rot')+'</div>'+(un?'<div class="ccNote68">'+fInt(un)+' productos sin clasificación no se incluyen en las tarjetas CORE / COMPLEMENTO.</div>':'')+'<div class="tbar"><div class="tsearch">🔎<input id="q-rot" placeholder="Buscar producto, código o clasificación…" oninput="state.rot.q=this.value;drawRot()"></div><span class="chip filt" data-q="rot" data-f="all">Todos</span><span class="chip filt" data-q="rot" data-f="core">CORE</span><span class="chip filt" data-q="rot" data-f="comp">COMPLEMENTO</span><span class="chip filt" data-q="rot" data-f="crit">+180 días</span><span class="chip filt" data-q="rot" data-f="a360">+360 días</span><span class="chip filt" data-q="rot" data-f="novta">Sin venta 3m</span></div><div id="rot-tbl"></div><div class="foot"><span id="rot-cnt"></span><span>Presiona una tarjeta, rango o producto para abrir su detalle.</span></div></div></div>';};

  window.drawRot=function(){var st=S[CUR]||{},s=state.rot,all=normalizeRotRows(st),rows=all.slice();if(s.f==='core')rows=rowsByCC68(rows,'CORE');if(s.f==='comp')rows=rowsByCC68(rows,'COMPLEMENTO');if(s.f==='crit')rows=rows.filter(function(r){return r.age>=3;});if(s.f==='a360')rows=rows.filter(function(r){return r.age>=6;});if(s.f==='novta')rows=rows.filter(function(r){return r.sales3m<=0;});if(s.q){var q=String(s.q).toLowerCase();rows=rows.filter(function(r){return (r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub+' '+ccLabel68(r.c,P[r.c])).toLowerCase().includes(q);});}if(s.sort==='age')rows.sort(function(a,b){var ax=a.age<0?-99:a.age,bx=b.age<0?-99:b.age;return (ax-bx)*s.dir||b.val-a.val||b.u-a.u;});else rows.sort(cmp(s,{c:function(r){return r.c;},p:function(r){return r.p.n;},cc:function(r){return ccLabel68(r.c,P[r.c]);},age:function(r){return r.age;},u:function(r){return r.u;},val:function(r){return r.val;},vta:function(r){return r.sales3m;}}));var ch=document.getElementById('cc-age-rot68');if(ch)ch.innerHTML=ageDiagram68(rows,'rot');var cols=[['Código','c',0],['Producto','p',0],['CORE / Complemento','cc',0],['Categoría / Línea / Sublínea','x',0],['Antigüedad','age',0],['Uds','u',1],['Valor detenido','val',1],['Ventas 3m (uds)','vta',1]],body=rows.map(function(r){var cc=ccLabel68(r.c,P[r.c]);return ['<span class="code">'+esc(r.c)+'</span>','<div class="pname">'+esc(r.p.n)+'</div>',ccBadge68(cc),'<span style="color:var(--mut);font-size:11px">'+esc(r.p.cat)+' · '+esc(r.p.lin)+' · '+esc(r.p.sub)+'</span>',ageBadge(r.age,r.ageLabel),'<b>'+fInt(r.u)+'</b>','<b style="color:var(--rot)">'+fMoney(r.val)+'</b>',r.sales3m>0?'<b>'+fInt(r.sales3m)+'</b>':'<span class="tag sr">SIN VENTA</span>'];}),tbl=document.getElementById('rot-tbl');if(tbl){tbl.innerHTML=tableHTML('rot',cols,body);Array.prototype.forEach.call(tbl.querySelectorAll('tbody tr'),function(tr,i){if(rows[i]){tr.classList.add('ccClickRow68');tr.tabIndex=0;tr.setAttribute('role','button');tr.dataset.v68Product=rows[i].c;}});}var cnt=document.getElementById('rot-cnt');if(cnt)cnt.textContent='Mostrando '+fInt(rows.length)+' de '+fInt(all.length)+' productos';wireTable('rot',drawRot);if(typeof decorateActionColumn==='function')decorateActionColumn('rot');};

  window.viewEvac=function(st){var x=evacuationSummary(st),all=x.rows,core=stats68(rowsByCC68(all,'CORE'),'v'),comp=stats68(rowsByCC68(all,'COMPLEMENTO'),'v'),un=all.filter(function(r){return !ccCode68(r.c,P[r.c]);}).length;return '<div class="card"><div class="chead"><div class="cnum n2">2</div><div><div class="tt">Evacuación</div><div class="ds">Productos fuera de portafolio con inventario real, clasificados por CORE y COMPLEMENTO</div></div><div class="rt"><span class="badge hot">'+fInt(x.sr)+' sin respaldo</span></div></div><div class="cbody"><div class="mkpis"><div class="mk e"><div class="l">Productos con inventario</div><div class="v">'+fInt(x.n)+'</div></div><div class="mk b"><div class="l">Sin respaldo</div><div class="v">'+fInt(x.sr)+'</div></div><div class="mk g"><div class="l">Con respaldo</div><div class="v">'+fInt(x.cr)+'</div></div><div class="mk e"><div class="l">Unidades tienda</div><div class="v">'+fInt(x.u)+'</div></div><div class="mk e"><div class="l">Valor</div><div class="v">'+fMoney(x.v)+'</div></div></div><div class="ccOverview68">'+card68('evac','CORE',core)+card68('evac','COMPLEMENTO',comp)+'</div><div class="legend" style="margin-bottom:4px"><b>Evacuación por antigüedad · productos y unidades CORE / COMPLEMENTO</b></div><div id="cc-age-evac68">'+ageDiagram68(all,'evac')+'</div>'+(un?'<div class="ccNote68">'+fInt(un)+' productos sin clasificación no se incluyen en las tarjetas CORE / COMPLEMENTO.</div>':'')+'<div class="legend"><span><span class="sw" style="background:var(--bad)"></span>Sin respaldo CENDIS → <b>sale primero</b></span><span><span class="sw" style="background:var(--ok)"></span>Con respaldo en CENDIS</span></div><div class="tbar"><div class="tsearch">🔎<input id="q-evac" placeholder="Buscar producto, código o clasificación…" oninput="state.evac.q=this.value;drawEvac()"></div><span class="chip filt" data-q="evac" data-f="all">Todos</span><span class="chip filt" data-q="evac" data-f="core">CORE</span><span class="chip filt" data-q="evac" data-f="comp">COMPLEMENTO</span><span class="chip filt" data-q="evac" data-f="sr">Sin respaldo</span><span class="chip filt" data-q="evac" data-f="cr">Con respaldo</span></div><div id="evac-tbl"></div><div class="foot"><span id="evac-cnt"></span><span>Presiona una tarjeta, rango o producto para abrir su detalle.</span></div></div></div>';};

  window.drawEvac=function(){var st=S[CUR]||{},s=state.evac,all=normalizeEvacRows(st).filter(function(r){return r.active;}),rows=all.slice();if(s.f==='core')rows=rowsByCC68(rows,'CORE');if(s.f==='comp')rows=rowsByCC68(rows,'COMPLEMENTO');if(s.f==='sr')rows=rows.filter(function(r){return r.cendis<=0;});if(s.f==='cr')rows=rows.filter(function(r){return r.cendis>0;});if(s.q){var q=String(s.q).toLowerCase();rows=rows.filter(function(r){return (r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub+' '+ccLabel68(r.c,P[r.c])).toLowerCase().includes(q);});}if(s.sort==='pri')rows.sort(function(a,b){return (a.cendis>0)-(b.cendis>0)||b.v-a.v||b.u-a.u;});else rows.sort(cmp(s,{c:function(r){return r.c;},p:function(r){return r.p.n;},cc:function(r){return ccLabel68(r.c,P[r.c]);},cendis:function(r){return r.cendis;},u:function(r){return r.u;},v:function(r){return r.v;}}));var ch=document.getElementById('cc-age-evac68');if(ch)ch.innerHTML=ageDiagram68(rows,'evac');var cols=[['#','pri',0],['Código','c',0],['Producto','p',0],['CORE / Complemento','cc',0],['Categoría / Línea / Sublínea','x',0],['Antigüedad','x',0],['Respaldo CENDIS','cendis',1],['Uds tienda','u',1],['Valor','v',1]],body=rows.map(function(r,i){var cc=ccLabel68(r.c,P[r.c]);return ['<span class="pri '+(r.cendis<=0?'top':'')+'">'+(i+1)+'</span>','<span class="code">'+esc(r.c)+'</span>','<div class="pname">'+esc(r.p.n)+'</div>',ccBadge68(cc),'<span style="color:var(--mut);font-size:11px">'+esc(r.p.cat)+' · '+esc(r.p.lin)+' · '+esc(r.p.sub)+'</span>','<span style="color:var(--mut);font-size:11px">'+esc(r.edad)+'</span>',r.cendis<=0?'<span class="tag sr">SIN RESPALDO</span>':'<span class="tag cr">'+fInt(r.cendis)+' und</span>','<b>'+fInt(r.u)+'</b>','<b style="color:var(--evac)">'+fMoney(r.v)+'</b>'];}),tbl=document.getElementById('evac-tbl');if(tbl){tbl.innerHTML=tableHTML('evac',cols,body);Array.prototype.forEach.call(tbl.querySelectorAll('tbody tr'),function(tr,i){if(rows[i]){tr.classList.add('ccClickRow68');tr.tabIndex=0;tr.setAttribute('role','button');tr.dataset.v68Product=rows[i].c;}});}var cnt=document.getElementById('evac-cnt');if(cnt)cnt.textContent='Mostrando '+fInt(rows.length)+' de '+fInt(all.length)+' productos con inventario';wireTable('evac',drawEvac);if(typeof decorateActionColumn==='function')decorateActionColumn('evac');};

  function salesRows68(st){return normalizeProductSalesRows(st).map(function(r){r.cc=ccLabel68(r.c,P[r.c]);return r;});}
  function salesStats68(st,cc){var rows=salesRows68(st).filter(function(r){return r.cc===cc&&r.u>0;}),refs=new Set(),u=0,v=0;rows.forEach(function(r){refs.add(r.c);u+=r.u;v+=r.v;});return {rows:rows,refs:refs.size,units:u,value:v};}
  function salesCard68(cc,x){return '<button class="ccSalesCard68 '+ccClass68(cc)+'" type="button" data-v68-sales-class="'+cc+'"><div class="title">Ventas '+cc+' · últimos 3 meses</div><div class="money">'+fMoneyCOP(x.value)+'</div><div class="stats"><span>'+fInt(x.refs)+' productos</span><span>'+fInt(x.units)+' unidades</span></div></button>';}
  function findCard68(title){var all=document.querySelectorAll('.card .tt');for(var i=0;i<all.length;i++)if((all[i].textContent||'').trim()===title)return all[i].closest('.card');return null;}
  function enhanceSales68(){if(VIEW!=='vta'||!S[CUR])return;var card=findCard68('Ventas');if(!card)return;var old=card.querySelector('.ccSalesOverview68'),core=salesStats68(S[CUR],'CORE'),comp=salesStats68(S[CUR],'COMPLEMENTO'),un=salesRows68(S[CUR]).filter(function(r){return r.cc==='SIN CLASIFICACIÓN'&&r.u>0;}).length,html='<div class="ccSalesOverview68">'+salesCard68('CORE',core)+salesCard68('COMPLEMENTO',comp)+'</div>'+(un?'<div class="ccNote68">'+fInt(un)+' productos vendidos sin clasificación no se incluyen en el comparativo CORE / COMPLEMENTO.</div>':'');if(old)old.outerHTML=html;else{var mk=card.querySelector('.mkpis');if(mk)mk.insertAdjacentHTML('afterend',html);}var toolbar=card.querySelector('.tbar');if(toolbar&&!toolbar.querySelector('[data-v68-sales-filter]'))toolbar.insertAdjacentHTML('beforeend','<span class="chip ccFilterChip68" data-v68-sales-filter="__core">CORE</span><span class="chip ccFilterChip68" data-v68-sales-filter="__comp">COMPLEMENTO</span>');var legends=card.querySelectorAll('.legend');Array.prototype.forEach.call(legends,function(l){if((l.textContent||'').indexOf('Participación por categoría')>=0){var chart=l.parentElement&&l.parentElement.querySelector('.chart');if(chart)Array.prototype.forEach.call(chart.querySelectorAll('.bar'),function(bar){var cat=bar.querySelector('.cl');if(cat){bar.classList.add('salesCategoryClickable68');bar.tabIndex=0;bar.setAttribute('role','button');bar.dataset.v68SalesCategory=(cat.textContent||'').trim();bar.title='Ver todos los productos vendidos de '+bar.dataset.v68SalesCategory;}});}});var low=findCard68('Productos con menor venta');if(low){var tt=low.querySelector('.tt'),ds=low.querySelector('.ds');if(tt)tt.textContent='Top de productos sin venta';if(ds)ds.textContent='Productos con stock y cero unidades vendidas en los últimos 3 meses';}}

  function salesDetail68(rows,title,subtitle){var refs=new Set(),units=0,value=0;rows.forEach(function(r){refs.add(r.c);units+=r.u;value+=r.v;});modal68(title,subtitle,'<div class="v68ModalSummary"><div class="v68ModalKpi"><label>Productos</label><b>'+fInt(refs.size)+'</b></div><div class="v68ModalKpi"><label>Unidades vendidas</label><b>'+fInt(units)+'</b></div><div class="v68ModalKpi"><label>Venta 3 meses</label><b>'+fMoneyCOP(value)+'</b></div><div class="v68ModalKpi"><label>Tienda</label><b>'+esc(S[CUR]&&S[CUR].name||CUR)+'</b></div></div><div class="v68DetailTableWrap"><table class="v68DetailTable"><thead><tr><th>Código</th><th>Producto</th><th>Clasificación</th><th>Categoría / Línea / Sublínea</th><th class="num">Unidades</th><th class="num">Venta 3m</th><th class="num">Stock</th></tr></thead><tbody>'+rows.map(function(r){return '<tr class="ccClickRow68" tabindex="0" role="button" data-v68-product="'+esc(r.c)+'"><td><span class="code">'+esc(r.c)+'</span></td><td><b>'+esc(r.p.n)+'</b></td><td>'+ccBadge68(r.cc)+'</td><td>'+esc(r.p.cat)+' · '+esc(r.p.lin)+' · '+esc(r.p.sub)+'</td><td class="num"><b>'+fInt(r.u)+'</b></td><td class="num"><b>'+fMoneyCOP(r.v)+'</b></td><td class="num">'+fInt(r.su)+'</td></tr>';}).join('')+'</tbody></table></div>');}
  function openSalesClass68(cc){salesDetail68(salesStats68(S[CUR]||{},cc).rows,'Ventas '+cc,'Últimos 3 meses · '+(S[CUR]&&S[CUR].name||CUR));}
  function openSalesCategory68(cat){var rows=salesRows68(S[CUR]||{}).filter(function(r){return r.u>0&&r.p.cat===cat;}).sort(function(a,b){return b.v-a.v;});salesDetail68(rows,'Ventas de '+cat,'Todos los productos vendidos · últimos 3 meses');}
  function openSalesSub68(sub){var rows=salesRows68(S[CUR]||{}).filter(function(r){return r.p.sub===sub;}).sort(function(a,b){return b.v-a.v;});salesDetail68(rows,'Ventas · '+sub,'Detalle por producto · últimos 3 meses');}

  window.drawVta=function(){var st=S[CUR]||{},s=state.vta,k=st.kpi||{},all=normalizeSalesRows(st).map(function(r){r.cc=ccFromSub68(r.sub)||'SIN CLASIFICACIÓN';r.opp=r.su>0&&r.v<=0;return r;}),rows=all.slice(),oppCount=rows.filter(function(r){return r.opp;}).length,oppEl=document.getElementById('vta-opp');if(oppEl)oppEl.textContent=fInt(oppCount);if(s.f==='__opp')rows=rows.filter(function(r){return r.opp;});else if(s.f==='__core')rows=rows.filter(function(r){return r.cc==='CORE';});else if(s.f==='__comp')rows=rows.filter(function(r){return r.cc==='COMPLEMENTO';});else if(s.f&&s.f!=='all')rows=rows.filter(function(r){return r.cat===s.f;});if(s.q){var q=String(s.q).toLowerCase();rows=rows.filter(function(r){return (r.cat+' '+r.lin+' '+r.sub+' '+r.cc).toLowerCase().includes(q);});}if(s.sort==='part')rows.sort(function(a,b){return b.v-a.v;});else rows.sort(cmp(s,{cat:function(r){return r.cat;},lin:function(r){return r.lin;},sub:function(r){return r.sub;},cc:function(r){return r.cc;},v:function(r){return r.v;},u:function(r){return r.u;},su:function(r){return r.su;}}));var cols=[['Categoría','cat',0],['Línea','lin',0],['Sublínea','sub',0],['CORE / Complemento','cc',0],['Fac. 3m','v',1],['Part %','part',1],['Uds','u',1],['Stock piso','su',1]],body=rows.map(function(r){return ['<b>'+esc(r.cat)+'</b>','<span style="color:var(--ink2)">'+esc(r.lin)+'</span>','<span style="color:var(--mut)">'+esc(r.sub)+'</span>'+(r.opp?' <span class="tag sr">🎯</span>':''),ccBadge68(r.cc),'<b style="color:var(--vta)">'+fMoney(r.v)+'</b>',(k.vtot?(100*r.v/k.vtot).toFixed(1):0)+'%',fInt(r.u),fInt(r.su)];}),tbl=document.getElementById('vta-tbl');if(tbl){tbl.innerHTML=tableHTML('vta',cols,body);Array.prototype.forEach.call(tbl.querySelectorAll('tbody tr'),function(tr,i){if(rows[i]){tr.classList.add('ccClickRow68');tr.tabIndex=0;tr.setAttribute('role','button');tr.dataset.v68SalesSub=rows[i].sub;}});}var cnt=document.getElementById('vta-cnt');if(cnt)cnt.textContent='Mostrando '+fInt(rows.length)+' de '+fInt(all.length)+' sublíneas';wireTable('vta',drawVta);drawSalesProductRanking(S[CUR]||{});enhanceSales68();};

  function rankTable68(rows,kind,total){if(!rows.length)return '<div class="empty">'+(kind==='top'?'No hay productos vendidos.':'No hay productos con stock y venta cero.')+'</div>';return '<div class="v68DetailTableWrap" style="max-height:420px"><table class="v68DetailTable"><thead><tr><th>Código</th><th>Producto</th><th>Clasificación</th><th class="num">Unidades 3m</th><th class="num">Venta 3m</th><th class="num">Stock</th></tr></thead><tbody>'+rows.map(function(r){return '<tr class="ccClickRow68" tabindex="0" role="button" data-v68-product="'+esc(r.c)+'"><td><span class="code">'+esc(r.c)+'</span></td><td><b>'+esc(r.p.n)+'</b></td><td>'+ccBadge68(r.cc)+'</td><td class="num">'+fInt(r.u)+'</td><td class="num">'+fMoneyCOP(r.v)+'</td><td class="num">'+fInt(r.su)+'</td></tr>';}).join('')+'</tbody></table></div><div class="v68MoreWrap"><button class="v68MoreBtn" type="button" data-v68-sales-more="'+kind+'">'+(rows.length<total?'Ver más ('+fInt(total-rows.length)+' restantes)':'Ver menos')+'</button></div>';}
  window.drawSalesProductRanking=function(st){if(SALES_LIMIT_68.store!==CUR){SALES_LIMIT_68={store:CUR,top:10,low:10};}var all=salesRows68(st),topAll=all.filter(function(r){return r.u>0;}).sort(function(a,b){return b.u-a.u||b.v-a.v;}),lowAll=all.filter(function(r){return r.su>0&&r.u<=0;}).sort(function(a,b){return b.sv-a.sv||b.su-a.su;}),a=document.getElementById('vta-top-products'),b=document.getElementById('vta-low-products');if(a)a.innerHTML=rankTable68(topAll.slice(0,SALES_LIMIT_68.top),'top',topAll.length);if(b)b.innerHTML=rankTable68(lowAll.slice(0,SALES_LIMIT_68.low),'low',lowAll.length);};

  function detailHistory68(){try{return typeof window.readDetailHistory==='function'?window.readDetailHistory():[];}catch(e){return [];}}
  function currentSnap68(){return typeof buildDetailedSnapshot==='function'?buildDetailedSnapshot():null;}
  function refSnap68(mode,currentDate){var h=detailHistory68().filter(function(x){return x&&String(x.date)<String(currentDate);});if(!h.length)return null;return mode==='base'?h[0]:h[h.length-1];}
  function stateMap68(rows){var m={};(rows||[]).forEach(function(r){var c=safeCode(r&&r[0]);if(!m[c])m[c]={u:0,v:0};m[c].u+=n68(r&&r[1]);m[c].v+=n68(r&&r[2]);});return m;}
  function managed68(store,state,mode){var cur=currentSnap68(),ref=cur&&refSnap68(mode,cur.date),cs=cur&&cur.stores&&cur.stores[store],rs=ref&&ref.stores&&ref.stores[store],cm=stateMap68(cs&&cs[state]),rm=stateMap68(rs&&rs[state]),keys=Array.from(new Set(Object.keys(cm).concat(Object.keys(rm)))),items=[];keys.forEach(function(c){var a=rm[c]||{u:0,v:0},b=cm[c]||{u:0,v:0},managedU=Math.max(0,a.u-b.u),managedV=Math.max(0,a.v-b.v),newU=Math.max(0,b.u-a.u);items.push({c:c,p:productInfo(c),refU:a.u,curU:b.u,managedU:managedU,managedV:managedV,newU:newU,state:state,store:store});});var refU=items.reduce(function(a,x){return a+x.refU;},0),curU=items.reduce(function(a,x){return a+x.curU;},0),newU=items.reduce(function(a,x){return a+x.newU;},0),managedU=items.reduce(function(a,x){return a+x.managedU;},0);return {items:items,managedU:managedU,newU:newU,refU:refU,curU:curU,progress:(refU+newU)>0?(refU+newU-curU)/(refU+newU)*100:0,reference:ref&&ref.date,current:cur&&cur.date};}
  function leaderPanel68(){var mode=(window.LLV_TRACK&&window.LLV_TRACK.leaderRef)||'previous',codes=getStoreKeys(),rows=codes.map(function(code){var r=managed68(code,'rot',mode),e=managed68(code,'evac',mode);return {code:code,name:S[code]&&S[code].name||code,rot:r,evac:e,total:r.managedU+e.managedU};}).sort(function(a,b){return b.total-a.total;}),rot=rows.reduce(function(a,x){return a+x.rot.managedU;},0),ev=rows.reduce(function(a,x){return a+x.evac.managedU;},0),ref=rows[0]&&rows[0].rot.reference,current=rows[0]&&rows[0].rot.current;return '<div class="card trackingPanel" id="leaderTrackingPanel"><div class="chead"><div class="cnum n4">↕</div><div><div class="tt">Seguimiento comparativo de tiendas</div><div class="ds">Unidades gestionadas o reducidas · Rotación y Evacuación en una sola vista</div></div><div class="rt"><span class="badge mut">'+fInt(rows.length)+' tiendas</span></div></div><div class="trackingControls"><div class="trackingControlGroup"><span class="trackingControlLabel">Comparar</span><button class="trackBtn '+(mode==='previous'?'on':'')+'" data-v68-leader-ref="previous">Corte anterior</button><button class="trackBtn '+(mode==='base'?'on':'')+'" data-v68-leader-ref="base">Corte base</button></div><div class="trackingReference">Actual <b>'+esc(current||'—')+'</b> vs. <b>'+esc(ref||'línea base')+'</b></div></div><div class="cbody"><div class="managedSummary68"><div class="managedKpi68" data-v68-managed-network="rot"><label>Gestionadas Rotación</label><b>'+fInt(rot)+' uds.</b></div><div class="managedKpi68" data-v68-managed-network="evac"><label>Gestionadas Evacuación</label><b>'+fInt(ev)+' uds.</b></div><div class="managedKpi68" data-v68-managed-network="all"><label>Total gestionadas</label><b>'+fInt(rot+ev)+' uds.</b></div></div><div class="trackingTableWrap"><table class="trackingTable leaderTrackTable"><thead><tr><th>Tienda</th><th class="num">Gestionadas ROTA</th><th class="num">Gestionadas EVA</th><th class="num">Total gestionadas</th><th class="num">Nuevas ROTA</th><th class="num">Nuevas EVA</th><th class="num">Avance ROTA</th><th class="num">Avance EVA</th></tr></thead><tbody>'+rows.map(function(x){return '<tr><td><button class="managedCellBtn68" data-v68-store-summary="'+esc(x.code)+'">'+esc(x.name)+'</button></td><td class="num"><button class="managedCellBtn68" data-v68-managed-store="'+esc(x.code)+'" data-v68-managed-state="rot">'+fInt(x.rot.managedU)+'</button></td><td class="num"><button class="managedCellBtn68" data-v68-managed-store="'+esc(x.code)+'" data-v68-managed-state="evac">'+fInt(x.evac.managedU)+'</button></td><td class="num"><button class="managedCellBtn68" data-v68-managed-store="'+esc(x.code)+'" data-v68-managed-state="all"><b>'+fInt(x.total)+'</b></button></td><td class="num">'+fInt(x.rot.newU)+'</td><td class="num">'+fInt(x.evac.newU)+'</td><td class="num">'+x.rot.progress.toFixed(1)+'%</td><td class="num">'+x.evac.progress.toFixed(1)+'%</td></tr>';}).join('')+'</tbody></table></div><div class="trackingNote"><b>Validación:</b> Total gestionadas = Gestionadas ROTA + Gestionadas EVA. Presiona cualquier cifra para consultar los productos y unidades que la componen.</div></div></div>';}
  window.__llaveroLeaderTrackingPanel=leaderPanel68;
  window.renderLeaderTracking=function(){var el=document.getElementById('leaderTrackingPanel');if(el)el.outerHTML=leaderPanel68();};

  function managedDetail68(store,state){var mode=(window.LLV_TRACK&&window.LLV_TRACK.leaderRef)||'previous',states=state==='all'?['rot','evac']:[state],rows=[];states.forEach(function(s){managed68(store,s,mode).items.filter(function(x){return x.managedU>0;}).forEach(function(x){rows.push(x);});});rows.sort(function(a,b){return b.managedU-a.managedU;});var total=rows.reduce(function(a,x){return a+x.managedU;},0),name=S[store]&&S[store].name||store;modal68('Unidades gestionadas · '+name,(state==='all'?'Rotación + Evacuación':state==='rot'?'Rotación':'Evacuación'),'<div class="v68ModalSummary"><div class="v68ModalKpi"><label>Productos</label><b>'+fInt(rows.length)+'</b></div><div class="v68ModalKpi"><label>Unidades gestionadas</label><b>'+fInt(total)+'</b></div><div class="v68ModalKpi"><label>Rotación</label><b>'+fInt(rows.filter(function(x){return x.state==='rot';}).reduce(function(a,x){return a+x.managedU;},0))+'</b></div><div class="v68ModalKpi"><label>Evacuación</label><b>'+fInt(rows.filter(function(x){return x.state==='evac';}).reduce(function(a,x){return a+x.managedU;},0))+'</b></div></div><div class="v68DetailTableWrap"><table class="v68DetailTable"><thead><tr><th>Estado</th><th>Código</th><th>Producto</th><th>Clasificación</th><th class="num">Uds. referencia</th><th class="num">Uds. actuales</th><th class="num">Uds. gestionadas</th></tr></thead><tbody>'+rows.map(function(x){return '<tr class="ccClickRow68" tabindex="0" role="button" data-v68-product="'+esc(x.c)+'" data-v68-product-store="'+esc(store)+'"><td><span class="tag '+(x.state==='rot'?'a':'sr')+'">'+(x.state==='rot'?'ROTACIÓN':'EVACUACIÓN')+'</span></td><td><span class="code">'+esc(x.c)+'</span></td><td><b>'+esc(x.p.n)+'</b></td><td>'+ccBadge68(ccLabel68(x.c,P[x.c]))+'</td><td class="num">'+fInt(x.refU)+'</td><td class="num">'+fInt(x.curU)+'</td><td class="num"><b>'+fInt(x.managedU)+'</b></td></tr>';}).join('')+'</tbody></table></div>');}
  function networkManaged68(state){var mode=(window.LLV_TRACK&&window.LLV_TRACK.leaderRef)||'previous',rows=[];getStoreKeys().forEach(function(store){(state==='all'?['rot','evac']:[state]).forEach(function(s){managed68(store,s,mode).items.filter(function(x){return x.managedU>0;}).forEach(function(x){rows.push(x);});});});rows.sort(function(a,b){return b.managedU-a.managedU;});var total=rows.reduce(function(a,x){return a+x.managedU;},0);modal68('Unidades gestionadas de la red',state==='all'?'Rotación + Evacuación':state==='rot'?'Rotación':'Evacuación','<div class="v68ModalSummary"><div class="v68ModalKpi"><label>Registros tienda-producto</label><b>'+fInt(rows.length)+'</b></div><div class="v68ModalKpi"><label>Unidades gestionadas</label><b>'+fInt(total)+'</b></div><div class="v68ModalKpi"><label>Tiendas</label><b>'+fInt(new Set(rows.map(function(x){return x.store;})).size)+'</b></div><div class="v68ModalKpi"><label>Corte</label><b>'+esc(DB.meta&&DB.meta.fecha||'—')+'</b></div></div><div class="v68DetailTableWrap"><table class="v68DetailTable"><thead><tr><th>Tienda</th><th>Estado</th><th>Código</th><th>Producto</th><th>Clasificación</th><th class="num">Uds. gestionadas</th></tr></thead><tbody>'+rows.map(function(x){return '<tr class="ccClickRow68" tabindex="0" role="button" data-v68-product="'+esc(x.c)+'" data-v68-product-store="'+esc(x.store)+'"><td><b>'+esc(S[x.store]&&S[x.store].name||x.store)+'</b></td><td>'+(x.state==='rot'?'ROTACIÓN':'EVACUACIÓN')+'</td><td><span class="code">'+esc(x.c)+'</span></td><td>'+esc(x.p.n)+'</td><td>'+ccBadge68(ccLabel68(x.c,P[x.c]))+'</td><td class="num"><b>'+fInt(x.managedU)+'</b></td></tr>';}).join('')+'</tbody></table></div>');}

  function enrichProductModal68(code){var body=document.getElementById('inventoryProductBody');if(!body)return;var cc=ccLabel68(code,P[safeCode(code)]),hero=body.querySelector('.detailHeroText')||body.querySelector('.detailHero>div');if(hero&&!hero.querySelector('.ccDetailBadge68'))hero.insertAdjacentHTML('beforeend','<div class="ccDetailBadge68">'+ccBadge68(cc)+'</div>');var grid=body.querySelector('.detailGrid');if(grid&&!grid.querySelector('[data-v68-class-item]'))grid.insertAdjacentHTML('afterbegin','<div class="detailItem" data-v68-class-item><label>Clasificación comercial</label><b>'+esc(cc)+'</b></div>');}
  var oldInv68=window.openInventoryProduct;if(typeof oldInv68==='function')window.openInventoryProduct=function(code){var out=oldInv68.apply(this,arguments);setTimeout(function(){enrichProductModal68(code);},0);return out;};
  var oldSalesOpen68=window.openProductFromSales;if(typeof oldSalesOpen68==='function')window.openProductFromSales=function(code){var out=oldSalesOpen68.apply(this,arguments);setTimeout(function(){enrichProductModal68(code);},0);return out;};

  function enhanceLeader68(){var labels=document.querySelectorAll('.leaderKpi .lkLabel');Array.prototype.forEach.call(labels,function(l){if((l.textContent||'').trim()==='Productos gestionados'){var card=l.closest('.leaderKpi'),mode=(window.LLV_TRACK&&window.LLV_TRACK.leaderRef)||'previous',rot=0,ev=0;getStoreKeys().forEach(function(c){rot+=managed68(c,'rot',mode).managedU;ev+=managed68(c,'evac',mode).managedU;});l.textContent='Unidades gestionadas';var v=card.querySelector('.lkValue'),s=card.querySelector('.lkSub');if(v)v.textContent=fInt(rot+ev);if(s)s.textContent='Rotación '+fInt(rot)+' · Evacuación '+fInt(ev);card.classList.add('auditClickable');card.dataset.v68ManagedNetwork='all';}});}

  function refreshEnhancements68(){var vb=document.querySelector('.appVersionChip b');if(vb&&vb.textContent.indexOf('V79')<0)vb.textContent=vb.textContent.replace(/V\d+$/,'V79');enhanceSales68();enhanceLeader68();}
  var q68=false;function queue68(){if(q68)return;q68=true;requestAnimationFrame(function(){q68=false;refreshEnhancements68();});}
  /* V82: sin observador global V68. */

  function activate68(el){if(!el)return false;if(el.dataset.v68Product){if(el.closest('.actionBtn'))return false;productOpen68(el.dataset.v68Product,el.dataset.v68ProductStore);return true;}if(el.dataset.v68CcModule){openCCDetail68(el.dataset.v68CcModule,el.dataset.v68Cc,null);return true;}if(el.dataset.v68AgeModule){openCCDetail68(el.dataset.v68AgeModule,el.dataset.v68AgeCc,el.dataset.v68Age);return true;}if(el.dataset.v68SalesClass){openSalesClass68(el.dataset.v68SalesClass);return true;}if(el.dataset.v68SalesCategory){openSalesCategory68(el.dataset.v68SalesCategory);return true;}if(el.dataset.v68SalesSub){openSalesSub68(el.dataset.v68SalesSub);return true;}if(el.dataset.v68SalesFilter){state.vta.f=el.dataset.v68SalesFilter;drawVta();return true;}if(el.dataset.v68SalesMore){var kind=el.dataset.v68SalesMore,all=salesRows68(S[CUR]||{}),total=kind==='top'?all.filter(function(r){return r.u>0;}).length:all.filter(function(r){return r.su>0&&r.u<=0;}).length;if(SALES_LIMIT_68[kind]>=total)SALES_LIMIT_68[kind]=10;else SALES_LIMIT_68[kind]=Math.min(total,SALES_LIMIT_68[kind]+25);drawSalesProductRanking(S[CUR]||{});return true;}if(el.dataset.v68LeaderRef){window.LLV_TRACK=window.LLV_TRACK||{};window.LLV_TRACK.leaderRef=el.dataset.v68LeaderRef;window.renderLeaderTracking();return true;}if(el.dataset.v68ManagedStore){managedDetail68(el.dataset.v68ManagedStore,el.dataset.v68ManagedState);return true;}if(el.dataset.v68ManagedNetwork){networkManaged68(el.dataset.v68ManagedNetwork);return true;}if(el.dataset.v68StoreSummary){var c=el.dataset.v68StoreSummary;if(S[c]){CUR=c;if(typeof sel!=='undefined'&&sel)sel.value=c;VIEW='resumen';setActiveNav('resumen');refresh();}return true;}return false;}
  document.addEventListener('click',function(e){if(e.target.closest('.actionBtn,.modalClose,input,select,textarea'))return;var el=e.target.closest('[data-v68-product],[data-v68-cc-module],[data-v68-age-module],[data-v68-sales-class],[data-v68-sales-category],[data-v68-sales-sub],[data-v68-sales-filter],[data-v68-sales-more],[data-v68-leader-ref],[data-v68-managed-store],[data-v68-managed-network],[data-v68-store-summary]');if(el&&activate68(el)){e.preventDefault();e.stopPropagation();}},true);
  document.addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var el=e.target.closest('[data-v68-product],[data-v68-cc-module],[data-v68-age-module],[data-v68-sales-class],[data-v68-sales-category],[data-v68-sales-sub],[data-v68-sales-filter],[data-v68-sales-more],[data-v68-leader-ref],[data-v68-managed-store],[data-v68-managed-network],[data-v68-store-summary]');if(el&&activate68(el)){e.preventDefault();e.stopPropagation();}},true);

  var oldRefresh68=window.refresh;if(typeof oldRefresh68==='function')window.refresh=function(){var out=oldRefresh68.apply(this,arguments);setTimeout(refreshEnhancements68,0);return out;};
  setTimeout(function(){refreshEnhancements68();},0);
})();


/* ===== llavero-v69-correcciones-script ===== */
(function(){
  'use strict';
  window.LLAVERO_BUILD='V79';
  if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');
  function n69(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function cc69(code){return typeof window.llaveroClasificacion68==='function'?window.llaveroClasificacion68(code,(typeof P!=='undefined'&&P?P[safeCode(code)]:null)):'SIN CLASIFICACIÓN';}
  function badge69(cc){var c=cc==='CORE'?'core':cc==='COMPLEMENTO'?'comp':'none';return '<span class="ccBadge68 '+c+'">'+esc(cc)+'</span>';}
  function removeSummaryNotice69(){document.querySelectorAll('.hint').forEach(function(el){if((el.textContent||'').indexOf('Los productos Decora fueron excluidos')>=0)el.remove();});}

  function hist69(){try{return typeof readDetailHistory==='function'?readDetailHistory():[];}catch(e){return [];}}
  function snap69(){try{return typeof buildDetailedSnapshot==='function'?buildDetailedSnapshot():null;}catch(e){return null;}}
  function ref69(mode,date){var h=hist69().filter(function(x){return x&&String(x.date)<String(date);});if(!h.length)return null;return mode==='base'?h[0]:h[h.length-1];}
  function map69(rows){var m={};(rows||[]).forEach(function(r){var c=safeCode(r&&r[0]);if(!c)return;if(!m[c])m[c]={u:0,v:0};m[c].u+=n69(r&&r[1]);m[c].v+=n69(r&&r[2]);});return m;}
  function managed69(store,state,mode){var cur=snap69(),ref=cur&&ref69(mode,cur.date),cs=cur&&cur.stores&&cur.stores[store],rs=ref&&ref.stores&&ref.stores[store],cm=map69(cs&&cs[state]),rm=map69(rs&&rs[state]),keys=Array.from(new Set(Object.keys(cm).concat(Object.keys(rm)))),items=[];keys.forEach(function(c){var a=rm[c]||{u:0,v:0},b=cm[c]||{u:0,v:0};items.push({c:c,refU:a.u,curU:b.u,managedU:Math.max(0,a.u-b.u),newU:Math.max(0,b.u-a.u)});});var refU=items.reduce(function(a,x){return a+x.refU;},0),curU=items.reduce(function(a,x){return a+x.curU;},0),managedU=items.reduce(function(a,x){return a+x.managedU;},0),newU=items.reduce(function(a,x){return a+x.newU;},0);return {items:items,refU:refU,curU:curU,managedU:managedU,newU:newU,progress:(refU+newU)>0?(refU+newU-curU)/(refU+newU)*100:0,reference:ref&&ref.date,current:cur&&cur.date};}
  function leaderPanel69(){
    var mode=(window.LLV_TRACK&&window.LLV_TRACK.leaderRef)||'previous',codes=getStoreKeys(),rows=codes.map(function(code){var r=managed69(code,'rot',mode),e=managed69(code,'evac',mode);return {code:code,name:S[code]&&S[code].name||code,rot:r,evac:e,refU:r.refU+e.refU,curU:r.curU+e.curU,total:r.managedU+e.managedU};}).sort(function(a,b){return b.total-a.total;});
    var rot=rows.reduce(function(a,x){return a+x.rot.managedU;},0),ev=rows.reduce(function(a,x){return a+x.evac.managedU;},0),refU=rows.reduce(function(a,x){return a+x.refU;},0),curU=rows.reduce(function(a,x){return a+x.curU;},0),ref=rows[0]&&rows[0].rot.reference,current=rows[0]&&rows[0].rot.current,coincide=mode==='previous'&&hist69().filter(function(x){return x&&String(x.date)<String(current);}).length===1;
    return '<div class="card trackingPanel" id="leaderTrackingPanel"><div class="chead"><div class="cnum n4">↕</div><div><div class="tt">Seguimiento comparativo de tiendas</div><div class="ds">Unidades de referencia, actuales y gestionadas · Rotación y Evacuación</div></div><div class="rt"><span class="badge mut">'+fInt(rows.length)+' tiendas</span></div></div><div class="trackingControls"><div class="trackingControlGroup"><span class="trackingControlLabel">Comparar</span><button class="trackBtn '+(mode==='previous'?'on':'')+'" data-v68-leader-ref="previous">Corte anterior</button><button class="trackBtn '+(mode==='base'?'on':'')+'" data-v68-leader-ref="base">Corte base</button></div><div class="trackingReference">Actual <b>'+esc(current||'—')+'</b> vs. <b>'+esc(ref||'sin referencia')+'</b>'+(coincide?' · el corte anterior coincide con la base':'')+'</div></div><div class="cbody"><div class="managedSummary69"><div class="managedKpi68"><label>Unidades de referencia</label><b>'+fInt(refU)+' uds.</b></div><div class="managedKpi68"><label>Unidades actuales</label><b>'+fInt(curU)+' uds.</b></div><div class="managedKpi68" data-v68-managed-network="rot"><label>Gestionadas Rotación</label><b>'+fInt(rot)+' uds.</b></div><div class="managedKpi68" data-v68-managed-network="evac"><label>Gestionadas Evacuación</label><b>'+fInt(ev)+' uds.</b></div><div class="managedKpi68" data-v68-managed-network="all"><label>Total gestionadas</label><b>'+fInt(rot+ev)+' uds.</b></div></div><div class="trackingTableWrap"><table class="trackingTable leaderTrackTable"><thead><tr><th>Tienda</th><th class="num">Uds. referencia</th><th class="num">Uds. actuales</th><th class="num">Gestionadas ROTA</th><th class="num">Gestionadas EVA</th><th class="num">Total gestionadas</th><th class="num">Nuevas ROTA</th><th class="num">Nuevas EVA</th><th class="num">Avance ROTA</th><th class="num">Avance EVA</th></tr></thead><tbody>'+rows.map(function(x){return '<tr><td><button class="managedCellBtn68" data-v68-store-summary="'+esc(x.code)+'">'+esc(x.name)+'</button></td><td class="num">'+fInt(x.refU)+'</td><td class="num"><b>'+fInt(x.curU)+'</b></td><td class="num"><button class="managedCellBtn68" data-v68-managed-store="'+esc(x.code)+'" data-v68-managed-state="rot">'+fInt(x.rot.managedU)+'</button></td><td class="num"><button class="managedCellBtn68" data-v68-managed-store="'+esc(x.code)+'" data-v68-managed-state="evac">'+fInt(x.evac.managedU)+'</button></td><td class="num"><button class="managedCellBtn68" data-v68-managed-store="'+esc(x.code)+'" data-v68-managed-state="all"><b>'+fInt(x.total)+'</b></button></td><td class="num">'+fInt(x.rot.newU)+'</td><td class="num">'+fInt(x.evac.newU)+'</td><td class="num">'+x.rot.progress.toFixed(1)+'%</td><td class="num">'+x.evac.progress.toFixed(1)+'%</td></tr>';}).join('')+'</tbody></table></div><div class="trackingNote"><b>Validación:</b> las unidades de referencia y actuales corresponden al corte seleccionado. Total gestionadas = Gestionadas ROTA + Gestionadas EVA.</div></div></div>';
  }
  window.__llaveroLeaderTrackingPanel=leaderPanel69;
  window.renderLeaderTracking=function(){var el=document.getElementById('leaderTrackingPanel');if(el)el.outerHTML=leaderPanel69();};

  document.addEventListener('pointerdown',function(e){var b=e.target.closest&&e.target.closest('#storeTrackingPanel .trackBtn,#leaderTrackingPanel .trackBtn');if(!b)return;var t=(b.textContent||'').toLowerCase(),mode=t.indexOf('base')>=0?'base':t.indexOf('anterior')>=0?'previous':'';if(!mode)return;e.preventDefault();e.stopImmediatePropagation();if(b.closest('#storeTrackingPanel')&&typeof window.setStoreTrackRef==='function')window.setStoreTrackRef(mode);else{window.LLV_TRACK=window.LLV_TRACK||{};window.LLV_TRACK.leaderRef=mode;window.renderLeaderTracking();}},true);

  function visibleRows69(module){var all=module==='rot'?normalizeRotRows(S[CUR]||{}):normalizeEvacRows(S[CUR]||{}).filter(function(r){return r.active;}),root=document.getElementById(module==='rot'?'rot-tbl':'evac-tbl'),codes=new Set();if(root)root.querySelectorAll('tbody tr[data-v68-product]').forEach(function(tr){codes.add(safeCode(tr.dataset.v68Product));});return codes.size?all.filter(function(r){return codes.has(r.c);}):all;}
  function ccAgeChart69(rows,module){var g={},labels=[];rows.forEach(function(r){var cc=cc69(r.c);if(cc!=='CORE'&&cc!=='COMPLEMENTO')return;var a=canonicalAgeLabel(module==='rot'?r.ageLabel:r.edad);if(!g[a]){g[a]={CORE:{c:new Set(),u:0},COMPLEMENTO:{c:new Set(),u:0}};labels.push(a);}g[a][cc].c.add(r.c);g[a][cc].u+=n69(r.u);});labels.sort(function(a,b){return ageRankFromLabel(a)-ageRankFromLabel(b);});var mx=1;labels.forEach(function(a){mx=Math.max(mx,g[a].CORE.u,g[a].COMPLEMENTO.u);});if(!labels.length)return '<div class="empty">No hay información CORE / COMPLEMENTO para esta selección.</div>';return '<div class="ccRangeChart69">'+labels.map(function(a){var c=g[a].CORE,p=g[a].COMPLEMENTO;function col(cc,x,cls){var h=Math.max(5,Math.round(x.u/mx*100));return '<button type="button" class="ccRangeCol69 '+cls+'" style="--h:'+h+'" onclick="openCCDetail68(\''+module+'\',\''+cc+'\',\''+esc(a)+'\')" title="'+cc+': '+fInt(x.c.size)+' productos · '+fInt(x.u)+' unidades"></button>';}return '<div class="ccRangeGroup69"><div class="ccRangeMetric69"><b>'+fInt(c.u+p.u)+' uds.</b><span>'+fInt(c.c.size+p.c.size)+' prod.</span></div><div class="ccRangeColumns69">'+col('CORE',c,'core')+col('COMPLEMENTO',p,'comp')+'</div><div class="ccRangeLabel69">'+esc(a)+'</div></div>';}).join('')+'</div><div class="ccRangeLegend69"><span><i style="background:#12a878"></i>CORE: productos y unidades</span><span><i style="background:#3d70da"></i>COMPLEMENTO: productos y unidades</span></div>';}
  function enhanceAge69(module){var target=document.getElementById(module==='rot'?'cc-age-rot68':'cc-age-evac68');if(!target)return;var stateName=module==='rot'?'Rotación':'Evacuación',rows=visibleRows69(module),st=S[CUR]||{};target.innerHTML='<div class="ageChartsGrid69"><section class="ageChartCard69"><div class="ageChartTitle69">'+stateName+' por rango de edad</div><div class="ageChartSub69">Diagrama original: unidades y productos por rango.</div>'+rangeChartHtml(st,stateName,false)+'</section><section class="ageChartCard69"><div class="ageChartTitle69">CORE y COMPLEMENTO por rango</div><div class="ageChartSub69">Unidades y productos de cada clasificación en cada rango.</div>'+ccAgeChart69(rows,module)+'</section></div>';if(typeof animateBars==='function')animateBars();}
  var baseRot69=window.drawRot;if(typeof baseRot69==='function')window.drawRot=function(){var r=baseRot69.apply(this,arguments);enhanceAge69('rot');return r;};
  var baseEv69=window.drawEvac;if(typeof baseEv69==='function')window.drawEvac=function(){var r=baseEv69.apply(this,arguments);enhanceAge69('evac');return r;};

  function enhanceProx69(){var root=document.getElementById('prox-tbl');if(!root)return;var table=root.querySelector('table'),head=table&&table.querySelector('thead tr');if(!head||head.querySelector('.proxCore69'))return;var th=document.createElement('th');th.className='proxCore69';th.textContent='¿Es CORE?';head.insertBefore(th,head.children[4]||null);table.querySelectorAll('tbody tr').forEach(function(tr){if(tr.querySelector('.empty')){var td=tr.querySelector('td[colspan]');if(td)td.colSpan=Number(td.colSpan||9)+1;return;}var c=safeCode(tr.dataset.productCode||tr.dataset.code||tr.querySelector('.code')&&tr.querySelector('.code').textContent),td=document.createElement('td');td.className='proxCore69';td.innerHTML=badge69(cc69(c));tr.insertBefore(td,tr.children[4]||null);});}
  var baseProx69=window.drawProx;if(typeof baseProx69==='function')window.drawProx=function(){var r=baseProx69.apply(this,arguments);enhanceProx69();return r;};

  function salesRows69(st){return normalizeProductSalesRows(st).map(function(r){r.cc=cc69(r.c);return r;});}
  function podium69(rows,kind){var top=rows.slice(0,10),rest=rows.slice(10),empty=kind==='top'?'No hay productos vendidos en el corte actual.':'No hay productos con stock y venta cero en el corte actual.';if(!rows.length)return '<div class="empty">'+empty+'</div>';var cards='<div class="salesPodium69">'+top.map(function(r,i){var val=kind==='top'?fInt(r.u)+' uds.':fInt(r.su)+' uds. stock',meta=kind==='top'?fMoneyCOP(r.v):fMoneyCOP(r.sv);return '<article class="salesPodiumCard69 '+(i<3?'top3':'')+'" tabindex="0" role="button" onclick="openProductFromSales(\''+esc(r.c)+'\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){openProductFromSales(\''+esc(r.c)+'\')}"><div class="salesRankNo69">'+(i+1)+'</div><div class="salesPodiumImg69">'+imageThumb(r.c,'sm')+'</div><div class="salesPodiumName69">'+esc(r.p.n)+'</div><div class="salesPodiumValue69">'+val+'</div><div class="salesPodiumMeta69">'+meta+'</div><div class="salesPodiumBadge69">'+badge69(r.cc)+'</div></article>';}).join('')+'</div>';if(!rest.length)return cards;return cards+'<div class="salesRestTitle69">Demás productos del ranking</div><div class="salesRest69"><table><thead><tr><th>#</th><th>Código</th><th>Producto</th><th>Clasificación</th><th class="num">'+(kind==='top'?'Uds. 3m':'Stock')+'</th><th class="num">'+(kind==='top'?'Venta 3m':'Valor stock')+'</th></tr></thead><tbody>'+rest.map(function(r,i){return '<tr onclick="openProductFromSales(\''+esc(r.c)+'\')"><td>'+(i+11)+'</td><td><span class="code">'+esc(r.c)+'</span></td><td><b>'+esc(r.p.n)+'</b></td><td>'+badge69(r.cc)+'</td><td class="num">'+fInt(kind==='top'?r.u:r.su)+'</td><td class="num">'+fMoneyCOP(kind==='top'?r.v:r.sv)+'</td></tr>';}).join('')+'</tbody></table></div>';}
  window.drawSalesProductRanking=function(st){var all=salesRows69(st),top=all.filter(function(r){return r.u>0;}).sort(function(a,b){return b.u-a.u||b.v-a.v;}),zero=all.filter(function(r){return r.su>0&&r.u<=0;}).sort(function(a,b){return b.sv-a.sv||b.su-a.su;}),a=document.getElementById('salesTop10')||document.getElementById('vta-top-products'),b=document.getElementById('salesNoSale10')||document.getElementById('vta-low-products');if(a)a.innerHTML=podium69(top,'top');if(b)b.innerHTML=podium69(zero,'low');fixSalesRankingTitles69();};
  function fixSalesRankingTitles69(){var a=document.getElementById('salesTop10'),b=document.getElementById('salesNoSale10');function set(el,title,desc){var card=el&&el.closest('.salesRankingCard,.card');if(!card)return;var tt=card.querySelector('.tt'),ds=card.querySelector('.ds');if(tt)tt.textContent=title;if(ds)ds.textContent=desc;}set(a,'Ranking de productos más vendidos','Podio visual de los primeros 10; los demás continúan en listado.');set(b,'Ranking de productos sin venta','Podio visual de los primeros 10; los demás continúan en listado.');}
  function fixSalesHeader69(){var root=document.getElementById('vta-tbl');if(!root)return;var th=root.querySelector('thead th:nth-child(4)');if(th)th.innerHTML='CORE /<br>COMPLEMENTO';}
  var baseVta69=window.drawVta;if(typeof baseVta69==='function')window.drawVta=function(){var r=baseVta69.apply(this,arguments);fixSalesHeader69();window.drawSalesProductRanking(S[CUR]||{});return r;};

  function refresh69(){removeSummaryNotice69();if(VIEW==='rot')enhanceAge69('rot');if(VIEW==='evac')enhanceAge69('evac');if(VIEW==='prox')enhanceProx69();if(VIEW==='vta'){fixSalesHeader69();window.drawSalesProductRanking(S[CUR]||{});}var vb=document.querySelector('.appVersionChip b');if(vb&&vb.textContent.indexOf('V79')<0)vb.textContent=vb.textContent.replace(/V\d+$/,'V79');}
  var oldRefresh69=window.refresh;if(typeof oldRefresh69==='function')window.refresh=function(){var r=oldRefresh69.apply(this,arguments);setTimeout(refresh69,0);return r;};
  /* V82: sin observador global V69. */
  setTimeout(function(){refresh69();},0);
})();


/* ===== llavero-v70-interactividad-script ===== */
(function(){
  'use strict';
  window.LLAVERO_BUILD='V79';
  if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');

  function n70(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function c70(v){try{return typeof safeCode==='function'?safeCode(v):String(v==null?'':v).trim();}catch(e){return String(v==null?'':v).trim();}}
  function t70(v,f){try{return typeof safeText==='function'?safeText(v,f||'—'):String(v==null||v===''?(f||'—'):v);}catch(e){return String(v==null||v===''?(f||'—'):v);}}
  function e70(v){try{return typeof esc==='function'?esc(v):String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}catch(e){return String(v==null?'':v);}}
  function f70(v){try{return typeof fInt==='function'?fInt(v):Math.round(n70(v)).toLocaleString('es-CO');}catch(e){return String(Math.round(n70(v)));}}
  function m70(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(v):'$ '+Math.round(n70(v)).toLocaleString('es-CO');}catch(e){return '$ '+Math.round(n70(v));}}

  function class70(code){
    var cc='';
    try{cc=(typeof P!=='undefined'&&P&&P[c70(code)])?P[c70(code)].cc:'';}catch(e){}
    cc=String(cc||'').trim().toUpperCase();
    if(cc==='CORE')return 'CORE';
    if(cc==='COMPLEMENTO'||cc==='COMPLEMENTOS')return 'COMPLEMENTO';
    return 'SIN CLASIFICACIÓN';
  }
  function classKey70(cc){return cc==='CORE'?'core':cc==='COMPLEMENTO'?'comp':'none';}
  function badge70(cc){return '<span class="ccBadge68 '+classKey70(cc)+'">'+e70(cc)+'</span>';}
  window.llaveroClasificacion70=class70;

  function harmonizeTable70(module){
    var id=module==='prox'?'prox-tbl':module==='rot'?'rot-tbl':module==='evac'?'evac-tbl':module==='vta'?'vta-tbl':'';
    var root=id&&document.getElementById(id);if(!root)return;
    root.querySelectorAll('tbody tr').forEach(function(tr){
      if(tr.querySelector('.empty'))return;
      var code=c70(tr.dataset.productCode||tr.dataset.v68Product||tr.dataset.code||((tr.querySelector('.code')||{}).textContent));
      if(!code||code==='SIN-CODIGO')return;
      var cc=class70(code),badge=tr.querySelector('.ccBadge68');
      if(badge)badge.outerHTML=badge70(cc);
      if(module==='prox'){
        var cell=tr.querySelector('.proxCore69');if(cell)cell.innerHTML=badge70(cc);
      }
      if((module==='rot'||module==='evac')&&state&&state[module]&&(state[module].f==='core'||state[module].f==='comp')){
        var expected=state[module].f==='core'?'CORE':'COMPLEMENTO';tr.style.display=cc===expected?'':'none';
      }
    });
  }

  function moduleRows70(module,visibleOnly){
    var st=(typeof S!=='undefined'&&S&&S[CUR])||{},rows=[];
    try{
      if(module==='prox')rows=upcomingRotationRows(st).map(function(r){return Object.assign({},r,{module:'prox',relevantUnits:n70(r.units),moduleAge:'061 - 090',moduleValue:n70(r.value),moduleCendis:n70(r.cendis),moduleSales:n70(r.salesUnits)});});
      else if(module==='rot')rows=normalizeRotRows(st).map(function(r){return Object.assign({},r,{module:'rot',relevantUnits:n70(r.u),moduleAge:canonicalAgeLabel(r.ageLabel),moduleValue:n70(r.val),moduleCendis:n70((P&&P[r.c]&&P[r.c].dispCendis)||0),moduleSales:n70(r.sales3m)});});
      else if(module==='evac')rows=normalizeEvacRows(st).filter(function(r){return r.active;}).map(function(r){return Object.assign({},r,{module:'evac',relevantUnits:n70(r.u),moduleAge:canonicalAgeLabel(r.edad),moduleValue:n70(r.v),moduleCendis:n70(r.cendis),moduleSales:n70(r.sales1)+n70(r.sales2)});});
      else if(module==='inventario')rows=normalizeInventoryRows(st).filter(function(r){return r.stock>0;}).map(function(r){return Object.assign({},r,{module:'inventario',relevantUnits:n70(r.stock),moduleAge:'VARIOS RANGOS',moduleValue:n70(r.valorInventario),moduleCendis:n70(r.dispCendis),moduleSales:n70(r.unidadesFacUlt3Meses)});});
      else if(module==='vta')rows=normalizeProductSalesRows(st).map(function(r){return Object.assign({},r,{module:'vta',relevantUnits:n70(r.u),moduleAge:'—',moduleValue:n70(r.v),moduleCendis:0,moduleSales:n70(r.u)});});
    }catch(e){rows=[];}
    rows.forEach(function(r){r.c=c70(r.c);r.p=r.p||((typeof productInfo==='function')?productInfo(r.c):{n:r.c,cat:'SIN CLASIFICAR',lin:'SIN LÍNEA',sub:'SIN SUBLÍNEA'});r.cc=class70(r.c);});
    if(visibleOnly){
      var q='';
      if(module==='prox'&&state&&state.prox){
        var ps=state.prox;q=String(ps.q||'').toLowerCase();
        if(ps.risk==='high')rows=rows.filter(function(r){return r.share>=50;});
        else if(ps.risk==='mid')rows=rows.filter(function(r){return r.share>=25&&r.share<50;});
        else if(ps.risk==='low')rows=rows.filter(function(r){return r.share<25;});
        if(ps.salesMode==='nosales')rows=rows.filter(function(r){return r.salesUnits<=0;});
        else if(ps.salesMode==='sales')rows=rows.filter(function(r){return r.salesUnits>0;});
        if(ps.cendisMode==='without')rows=rows.filter(function(r){return r.cendis<=0;});
        else if(ps.cendisMode==='with')rows=rows.filter(function(r){return r.cendis>0;});
        if(ps.cat&&ps.cat!=='all')rows=rows.filter(function(r){return t70(r.p.cat,'SIN CATEGORÍA')===ps.cat;});
        if(q)rows=rows.filter(function(r){return (r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub+' '+r.cc).toLowerCase().includes(q);});
      }else if(module==='rot'&&state&&state.rot){
        var rs=state.rot;q=String(rs.q||'').toLowerCase();
        if(rs.f==='core')rows=rows.filter(function(r){return r.cc==='CORE';});
        else if(rs.f==='comp')rows=rows.filter(function(r){return r.cc==='COMPLEMENTO';});
        else if(rs.f==='crit')rows=rows.filter(function(r){return n70(r.age)>=3;});
        else if(rs.f==='a360')rows=rows.filter(function(r){return n70(r.age)>=6;});
        else if(rs.f==='novta')rows=rows.filter(function(r){return n70(r.sales3m)<=0;});
        if(q)rows=rows.filter(function(r){return (r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub+' '+r.cc).toLowerCase().includes(q);});
      }else if(module==='evac'&&state&&state.evac){
        var es=state.evac;q=String(es.q||'').toLowerCase();
        if(es.f==='core')rows=rows.filter(function(r){return r.cc==='CORE';});
        else if(es.f==='comp')rows=rows.filter(function(r){return r.cc==='COMPLEMENTO';});
        else if(es.f==='sr')rows=rows.filter(function(r){return n70(r.cendis)<=0;});
        else if(es.f==='cr')rows=rows.filter(function(r){return n70(r.cendis)>0;});
        if(q)rows=rows.filter(function(r){return (r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub+' '+r.cc).toLowerCase().includes(q);});
      }else{
        var id=module==='inventario'?'inventario-tbl':module==='vta'?'vta-tbl':'';
        var root=id&&document.getElementById(id),codes=new Set();
        if(root)root.querySelectorAll('tbody tr').forEach(function(tr){var code=c70(tr.dataset.productCode||tr.dataset.v68Product||tr.dataset.code||((tr.querySelector('.code')||{}).textContent));if(code&&code!=='SIN-CODIGO')codes.add(code);});
        if(codes.size)rows=rows.filter(function(r){return codes.has(r.c);});
      }
    }
    return rows;
  }

  function proxChartRows70(ignoreRisk){
    var rows=moduleRows70('prox',false),ps=(state&&state.prox)||{};
    if(!ignoreRisk){if(ps.risk==='high')rows=rows.filter(function(r){return r.share>=50;});else if(ps.risk==='mid')rows=rows.filter(function(r){return r.share>=25&&r.share<50;});else if(ps.risk==='low')rows=rows.filter(function(r){return r.share<25;});}
    if(ps.salesMode==='nosales')rows=rows.filter(function(r){return r.salesUnits<=0;});else if(ps.salesMode==='sales')rows=rows.filter(function(r){return r.salesUnits>0;});
    if(ps.cendisMode==='without')rows=rows.filter(function(r){return r.cendis<=0;});else if(ps.cendisMode==='with')rows=rows.filter(function(r){return r.cendis>0;});
    return rows;
  }

  function rowAgeEntries70(r){
    if(r.module==='prox')return [['061 - 090',n70(r.relevantUnits)]];
    if(r.module==='rot'||r.module==='evac')return [[canonicalAgeLabel(r.moduleAge),n70(r.relevantUnits)]];
    if(r.rangos&&typeof r.rangos==='object')return Object.entries(r.rangos).filter(function(x){return n70(x[1])>0;}).map(function(x){return [canonicalAgeLabel(x[0]),n70(x[1])];});
    return [[t70(r.moduleAge,'SIN DEFINIR'),n70(r.relevantUnits)]];
  }
  function ageAgg70(rows){var m={};rows.forEach(function(r){rowAgeEntries70(r).forEach(function(x){var a=t70(x[0],'SIN DEFINIR');m[a]=(m[a]||0)+n70(x[1]);});});return Object.entries(m).sort(function(a,b){try{return ageRankFromLabel(a[0])-ageRankFromLabel(b[0]);}catch(e){return a[0].localeCompare(b[0]);}});}
  function moduleTitle70(module){return module==='prox'?'Próximos a rotar':module==='rot'?'Rotación':module==='evac'?'Evacuación':module==='inventario'?'Inventario':module==='vta'?'Ventas':'Detalle';}

  function openModal70(title,subtitle,html){
    var modal=document.getElementById('rangeModal'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle'),body=document.getElementById('rangeModalBody');
    if(!modal||!body)return;
    if(tt)tt.textContent=title;if(ss)ss.textContent=subtitle||'';body.innerHTML=html;modal.classList.add('on');
  }

  function detailTable70(rows,module){
    var totalU=rows.reduce(function(a,r){return a+n70(r.relevantUnits);},0),totalV=rows.reduce(function(a,r){return a+n70(r.moduleValue);},0),totalC=rows.reduce(function(a,r){return a+n70(r.moduleCendis);},0),ages=ageAgg70(rows);
    var summary='<div class="v70DetailSummary"><div class="v70DetailKpi"><label>Productos</label><b>'+f70(rows.length)+'</b></div><div class="v70DetailKpi"><label>Unidades</label><b>'+f70(totalU)+'</b></div><div class="v70DetailKpi"><label>Valor relacionado</label><b>'+m70(totalV)+'</b></div><div class="v70DetailKpi"><label>Respaldo CENDIS</label><b>'+f70(totalC)+' u</b></div></div>';
    var age='<div class="v70AgeDetail">'+(ages.length?ages.map(function(x){return '<button type="button" data-v70-age-filter="'+e70(x[0])+'">'+e70(x[0])+' · '+f70(x[1])+' u</button>';}).join(''):'<span class="empty">Sin rangos registrados</span>')+'</div>';
    var body=rows.map(function(r){var p=r.p||{},ageHtml=rowAgeEntries70(r).map(function(x){return '<span>'+e70(x[0])+' · '+f70(x[1])+' u</span>';}).join('');return '<tr data-v70-detail-code="'+e70(r.c)+'" data-v70-detail-age="'+e70(rowAgeEntries70(r).map(function(x){return x[0];}).join('|'))+'"><td><span class="code">'+e70(r.c)+'</span></td><td><b>'+e70(p.n)+'</b></td><td>'+badge70(r.cc)+'</td><td>'+e70(p.cat)+'<br><span style="color:var(--mut)">'+e70(p.lin)+' · '+e70(p.sub)+'</span></td><td><div class="v70AgeCell">'+ageHtml+'</div></td><td class="num"><b>'+f70(r.relevantUnits)+'</b></td><td class="num">'+m70(r.moduleValue)+'</td><td class="num">'+f70(r.moduleCendis)+'</td><td class="num">'+f70(r.moduleSales)+'</td></tr>';}).join('');
    return summary+age+'<div class="v70DetailWrap"><table class="v70DetailTable"><colgroup><col style="width:8%"><col style="width:21%"><col style="width:12%"><col style="width:19%"><col style="width:16%"><col style="width:7%"><col style="width:8%"><col style="width:5%"><col style="width:5%"></colgroup><thead><tr><th>Código</th><th>Producto</th><th>Clasificación</th><th>Categoría / Línea / Sublínea</th><th>Rango de edad</th><th class="num">Uds.</th><th class="num">Valor</th><th class="num">CENDIS</th><th class="num">Venta</th></tr></thead><tbody>'+body+'</tbody></table></div>';
  }

  function openRows70(title,subtitle,rows,module){
    openModal70(title,subtitle,rows.length?detailTable70(rows,module):'<div class="empty">No hay información para esta selección.</div>');
  }
  window.openClassDetail70=function(module,cc){var rows=moduleRows70(module,true).filter(function(r){return r.cc===cc;});openRows70(moduleTitle70(module)+' · '+cc,'Productos, unidades y rango de edad de la selección actual',rows,module);};
  window.openModuleDetail70=function(module,title,filter){var rows=moduleRows70(module,true);if(typeof filter==='function')rows=rows.filter(filter);openRows70(title||moduleTitle70(module),'Detalle de los registros que sustentan el indicador',rows,module);};

  function classCards70(module){
    var rows=moduleRows70(module,true),groups={'CORE':[],'COMPLEMENTO':[],'SIN CLASIFICACIÓN':[]};rows.forEach(function(r){groups[r.cc].push(r);});
    return '<div class="v70ClassificationGrid" data-v70-class-grid="'+module+'">'+['CORE','COMPLEMENTO','SIN CLASIFICACIÓN'].map(function(cc){var a=groups[cc],u=a.reduce(function(s,r){return s+n70(r.relevantUnits);},0),ages=ageAgg70(a),preview=a.slice(0,3).map(function(r){return r.p.n;}).join(' · '),cls=classKey70(cc);return '<button type="button" class="v70ClassCard '+cls+'" onclick="openClassDetail70(\''+module+'\',\''+cc+'\')"><div class="v70ClassTop"><span class="v70ClassTitle">'+e70(cc)+'</span><span class="v70ClassArrow">→</span></div><div class="v70ClassValue">'+f70(a.length)+' productos</div><div class="v70ClassMeta">'+f70(u)+' unidades en el módulo</div><div class="v70AgeMini">'+(ages.length?ages.slice(0,4).map(function(x){return '<span><b>'+f70(x[1])+' u</b> '+e70(x[0])+'</span>';}).join(''):'<span>Sin unidades en esta selección</span>')+'</div><div class="v70ClassPreview">'+(preview?e70(preview)+(a.length>3?' · …':''):'No hay productos')+'</div></button>';}).join('')+'</div>';
  }

  function ensureClassCards70(module){
    var table=document.getElementById(module==='prox'?'prox-tbl':module==='rot'?'rot-tbl':'evac-tbl');if(!table)return;
    var card=table.closest('.card'),body=card&&card.querySelector('.cbody'),mk=body&&body.querySelector('.mkpis');if(!body||!mk)return;
    var old=body.querySelector('[data-v70-class-grid="'+module+'"]'),wrap=document.createElement('div');wrap.innerHTML=classCards70(module);var node=wrap.firstElementChild;
    if(old)old.replaceWith(node);else mk.insertAdjacentElement('afterend',node);
  }

  function categoryButtons70(){
    var rows=moduleRows70('prox',false),cats=Array.from(new Set(rows.map(function(r){return t70(r.p.cat,'SIN CATEGORÍA');}))).sort();
    return '<div class="v70CategoryFilters" id="v70-prox-categories"><span>Categoría</span><button type="button" class="v70CatBtn '+((state.prox.cat||'all')==='all'?'on':'')+'" data-v70-cat="all">Todas</button>'+cats.map(function(cat){return '<button type="button" class="v70CatBtn '+(state.prox.cat===cat?'on':'')+'" data-v70-cat="'+e70(cat)+'">'+e70(cat)+'</button>';}).join('')+'</div>';
  }
  function ensureCategoryButtons70(){var table=document.getElementById('prox-tbl');if(!table)return;var body=table.closest('.cbody');if(!body)return;var toolbar=body.querySelector('.proxNativeToolbar,.tbar'),old=document.getElementById('v70-prox-categories'),wrap=document.createElement('div');wrap.innerHTML=categoryButtons70();var node=wrap.firstElementChild;if(old)old.replaceWith(node);else if(toolbar)toolbar.insertAdjacentElement('afterend',node);}

  function openProxCategory70(category){var rows=proxChartRows70(false).filter(function(r){return t70(r.p.cat,'SIN CATEGORÍA')===category;});openRows70('Próximos a rotar · '+category,'Detalle de la categoría seleccionada',rows,'prox');}
  function openProxRisk70(key){var labels={high:'Exposición alta ≥50%',mid:'Exposición media 25–49%',low:'Exposición baja <25%'},rows=proxChartRows70(true).filter(function(r){return key==='high'?r.share>=50:key==='mid'?r.share>=25&&r.share<50:r.share<25;});openRows70('Próximos a rotar · '+labels[key],'Productos relacionados con el nivel de exposición',rows,'prox');}

  function codeFromRow70(tr){return c70(tr&&((tr.dataset&& (tr.dataset.productCode||tr.dataset.v68Product||tr.dataset.code||tr.dataset.v70DetailCode))||((tr.querySelector&&tr.querySelector('.code'))||{}).textContent));}
  function openProduct70(code){var c=c70(code);if(!c||c==='SIN-CODIGO')return;try{if(typeof window.openBestProductDetail==='function')return window.openBestProductDetail(c);if(typeof window.openInventoryProduct==='function')return window.openInventoryProduct(c);if(typeof window.openProductFromSales==='function')return window.openProductFromSales(c);}catch(e){}}

  function rowVisibleDetail70(tr){
    var table=tr.closest('table'),heads=Array.from(table&&table.querySelectorAll('thead th')||[]).map(function(x){return (x.textContent||'').trim();}),cells=Array.from(tr.children||[]),items=cells.map(function(td,i){return '<div class="v70DetailKpi"><label>'+e70(heads[i]||('Campo '+(i+1)))+'</label><b>'+e70((td.textContent||'').trim()||'—')+'</b></div>';}).join('');openModal70('Detalle del registro',moduleTitle70(typeof VIEW!=='undefined'?VIEW:''),'<div class="v70DetailSummary">'+items+'</div>');
  }

  function genericRowsForCard70(el){
    var text=(el.textContent||'').toLowerCase(),module=(typeof VIEW!=='undefined'?VIEW:'');
    if(text.indexOf('rotación')>=0||text.indexOf('por rotar')>=0)module='rot';
    else if(text.indexOf('evacuación')>=0||text.indexOf('evacuar')>=0)module='evac';
    else if(text.indexOf('próxim')>=0)module='prox';
    else if(text.indexOf('venta')>=0)module='vta';
    else if(text.indexOf('inventario')>=0||text.indexOf('stock')>=0||text.indexOf('cendis')>=0||text.indexOf('+360')>=0)module='inventario';
    var rows=moduleRows70(module,true);
    if(module==='inventario'&&text.indexOf('+360')>=0)rows=rows.filter(function(r){return Object.keys(r.rangos||{}).some(function(a){return ageRankFromLabel(a)>=6;});});
    if(module==='inventario'&&text.indexOf('cendis')>=0)rows=rows.filter(function(r){return n70(r.moduleCendis)>0;});
    if((module==='rot'||module==='evac'||module==='prox')&&text.indexOf('sin venta')>=0)rows=rows.filter(function(r){return n70(r.moduleSales)<=0;});
    return {module:module,rows:rows};
  }

  function wireGlobal70(){
    document.querySelectorAll('.kpi,.mk,.inventoryKpi,.leaderKpi,.donutCard,.summarySegment,.dailyMetric,.productLegendItem,.proxInsightItem,.rankRow,.salesBar,.bar[data-range]').forEach(function(el){
      if(el.closest('.modalBack')||el.dataset.v70Wired==='1'||el.hasAttribute('onclick')||typeof el.onclick==='function')return;
      el.dataset.v70Wired='1';el.dataset.v70Clickable='1';el.classList.add('v70Clickable');if(!el.hasAttribute('tabindex'))el.tabIndex=0;if(!el.hasAttribute('role'))el.setAttribute('role','button');
    });
    document.querySelectorAll('tbody tr').forEach(function(tr){if(tr.closest('.modalBack')&&tr.closest('#rangeModal')==null)return;if(tr.querySelector('.empty')||tr.hasAttribute('onclick')||typeof tr.onclick==='function')return;tr.dataset.v70Row='1';if(!tr.hasAttribute('tabindex'))tr.tabIndex=0;if(!tr.hasAttribute('role'))tr.setAttribute('role','button');});
  }

  document.addEventListener('click',function(e){
    var ageBtn=e.target.closest&&e.target.closest('[data-v70-age-filter]');if(ageBtn){var val=ageBtn.dataset.v70AgeFilter,tbody=ageBtn.closest('#rangeModalBody')&&document.querySelector('#rangeModalBody .v70DetailTable tbody');if(tbody)tbody.querySelectorAll('tr').forEach(function(tr){tr.style.display=(tr.dataset.v70DetailAge||'').indexOf(val)>=0?'':'none';});return;}
    var catBtn=e.target.closest&&e.target.closest('[data-v70-cat]');if(catBtn){e.preventDefault();state.prox.cat=catBtn.dataset.v70Cat;state.prox.limit=300;if(typeof drawProx==='function')drawProx();return;}
    var pbar=e.target.closest&&e.target.closest('#prox-chart .proxBarButton');if(pbar){e.preventDefault();e.stopImmediatePropagation();var name=(pbar.querySelector('.proxBarName')||{}).textContent||'';openProxCategory70(name.trim());return;}
    var risk=e.target.closest&&e.target.closest('#prox-risk-chart .proxRiskRow');if(risk){e.preventDefault();e.stopImmediatePropagation();var label=(risk.querySelector('.proxRiskLabel')||{}).textContent||'',key=label.indexOf('Alto')>=0?'high':label.indexOf('Medio')>=0?'mid':'low';openProxRisk70(key);return;}
    var drow=e.target.closest&&e.target.closest('#rangeModalBody tr[data-v70-detail-code]');if(drow){e.preventDefault();openProduct70(drow.dataset.v70DetailCode);return;}
    var row=e.target.closest&&e.target.closest('tbody tr[data-v70-row="1"]');if(row&&!e.target.closest('button,a,input,select,textarea')){var code=codeFromRow70(row);if(code&&code!=='SIN-CODIGO'){e.preventDefault();e.stopImmediatePropagation();openProduct70(code);}else{e.preventDefault();e.stopImmediatePropagation();rowVisibleDetail70(row);}return;}
    var card=e.target.closest&&e.target.closest('[data-v70-clickable="1"]');if(card&&!e.target.closest('button,a,input,select,textarea')&&!card.closest('.v70ClassCard')){var x=genericRowsForCard70(card),title=((card.querySelector('.lab,.l,.ikLabel,.lkLabel,.dLabel,.ssLabel,.dmLabel,.rankName')||{}).textContent||'Detalle del indicador').trim();if(x.rows.length){e.preventDefault();openRows70(title,'Información detallada del indicador seleccionado',x.rows,x.module);}else{var value=(card.querySelector('.val,.v,.ikValue,.lkValue,.dValue,.ssValue,.dmValue,.rankValue')||{}).textContent||'';openModal70(title,'Información visible del componente','<div class="v70DetailSummary"><div class="v70DetailKpi"><label>Valor</label><b>'+e70(value.trim()||'—')+'</b></div><div class="v70DetailKpi"><label>Módulo</label><b>'+e70(moduleTitle70(typeof VIEW!=='undefined'?VIEW:''))+'</b></div></div>');}return;}
  },true);

  document.addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var el=e.target.closest&&e.target.closest('[data-v70-clickable="1"],tbody tr[data-v70-row="1"]');if(el){e.preventDefault();el.click();}},true);

  function enhance70(){
    try{if(typeof VIEW!=='undefined'&&VIEW==='prox'){harmonizeTable70('prox');ensureClassCards70('prox');ensureCategoryButtons70();}if(typeof VIEW!=='undefined'&&VIEW==='rot'){harmonizeTable70('rot');ensureClassCards70('rot');}if(typeof VIEW!=='undefined'&&VIEW==='evac'){harmonizeTable70('evac');ensureClassCards70('evac');}}catch(e){}
    wireGlobal70();
    var vb=document.querySelector('.appVersionChip b');if(vb&&(vb.textContent||'').indexOf('V79')<0)vb.textContent=(vb.textContent||'').replace(/V\d+$/,'V79');
  }

  var dr=window.drawRot;if(typeof dr==='function')window.drawRot=function(){var out=dr.apply(this,arguments);setTimeout(function(){harmonizeTable70('rot');ensureClassCards70('rot');wireGlobal70();},0);return out;};
  var de=window.drawEvac;if(typeof de==='function')window.drawEvac=function(){var out=de.apply(this,arguments);setTimeout(function(){harmonizeTable70('evac');ensureClassCards70('evac');wireGlobal70();},0);return out;};
  var dp=window.drawProx;if(typeof dp==='function')window.drawProx=function(){var out=dp.apply(this,arguments);setTimeout(function(){harmonizeTable70('prox');ensureClassCards70('prox');ensureCategoryButtons70();wireGlobal70();},0);return out;};
  var rf=window.refresh;if(typeof rf==='function')window.refresh=function(){var out=rf.apply(this,arguments);setTimeout(enhance70,0);return out;};

  var obs=new MutationObserver(function(){clearTimeout(window.__v70Timer);window.__v70Timer=setTimeout(wireGlobal70,35);});
  setTimeout(function(){enhance70();},0);
})();


/* ===== llavero-v71-update-script ===== */
(function(){
  'use strict';
  window.LLAVERO_BUILD='V79';
  if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');

  var AGE71=[
    {rank:0,key:'91-120',label:'91–120 días'},
    {rank:1,key:'121-150',label:'121–150 días'},
    {rank:2,key:'151-180',label:'151–180 días'},
    {rank:3,key:'181-210',label:'181–210 días'},
    {rank:4,key:'211-240',label:'211–240 días'},
    {rank:5,key:'241-360',label:'241–360 días'},
    {rank:6,key:'+360',label:'Más de 360 días'}
  ];
  function n71(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function s71(v,f){try{return typeof safeText==='function'?safeText(v,f||'—'):String(v==null||v===''?(f||'—'):v);}catch(e){return String(v==null||v===''?(f||'—'):v);}}
  function e71(v){try{return typeof esc==='function'?esc(v):String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}catch(e){return String(v==null?'':v);}}
  function i71(v){try{return typeof fInt==='function'?fInt(v):Math.round(n71(v)).toLocaleString('es-CO');}catch(e){return String(Math.round(n71(v)));}}
  function m71(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(v):(typeof fMoney==='function'?fMoney(v):'$ '+Math.round(n71(v)).toLocaleString('es-CO'));}catch(e){return '$ '+Math.round(n71(v));}}
  function code71(v){try{return typeof safeCode==='function'?safeCode(v):String(v==null?'':v).trim();}catch(e){return String(v==null?'':v).trim();}}
  function cc71(code){var x='';try{x=P&&P[code71(code)]&&P[code71(code)].cc;}catch(e){}x=String(x||'').trim().toUpperCase();if(x==='CORE')return 'CORE';if(x==='COMPLEMENTO'||x==='COMPLEMENTOS')return 'COMPLEMENTO';return 'SIN CLASIFICACIÓN';}
  function ccBadge71(value){var cls=value==='CORE'?'core':value==='COMPLEMENTO'?'comp':'none';return '<span class="ccBadge68 '+cls+'">'+e71(value)+'</span>';}
  function rangeRank71(label){try{return ageRankFromLabel(label);}catch(e){return -1;}}
  function emptyRanges71(){var x={};AGE71.forEach(function(a){x[a.rank]=0;});return x;}
  function addRange71(target,label,qty){var rank=rangeRank71(label);if(rank>=0&&rank<=6)target[rank]=(target[rank]||0)+n71(qty);}
  function filterRanges71(ranges){var out=emptyRanges71();Object.entries(ranges||{}).forEach(function(x){addRange71(out,x[0],x[1]);});return out;}
  function rangesTotal71(r){return Object.values(r||{}).reduce(function(a,b){return a+n71(b);},0);}
  function ageChips71(ranges){var html=AGE71.filter(function(a){return n71(ranges&&ranges[a.rank])>0;}).map(function(a){return '<span class="v71AgeChip"><b>'+i71(ranges[a.rank])+' u</b><span>'+a.label+'</span></span>';}).join('');return html?'<div class="v71AgeChips">'+html+'</div>':'<span class="v71AgeEmpty">Sin unidades en rangos de 91 días o más</span>';}

  function inventoryMap71(st){var map={};try{normalizeInventoryRows(st).forEach(function(r){var c=code71(r.c),entry=map[c]||(map[c]={ranges:emptyRanges71(),cendis:0,stock:0});var filtered=filterRanges71(r.rangos);AGE71.forEach(function(a){entry.ranges[a.rank]+=n71(filtered[a.rank]);});entry.cendis=Math.max(entry.cendis,n71(r.dispCendis));entry.stock+=n71(r.stock);});}catch(e){}return map;}
  function product71(c){try{return productInfo(c);}catch(e){return {n:c,cat:'SIN CLASIFICAR',lin:'SIN LÍNEA',sub:'SIN SUBLÍNEA'};}}

  function aggregate71(module,st){
    var inv=inventoryMap71(st),map={};
    if(module==='rot'){
      (normalizeRotRows(st)||[]).forEach(function(r){var c=code71(r.c),x=map[c]||(map[c]={module:'rot',c:c,p:r.p||product71(c),cc:cc71(c),units:0,value:0,cendis:0,sales:0,ranges:emptyRanges71(),fallback:emptyRanges71()});x.units+=n71(r.u);x.value+=n71(r.val);x.sales+=n71(r.sales3m);x.cendis=Math.max(x.cendis,n71(inv[c]&&inv[c].cendis),n71(P&&P[c]&&P[c].dispCendis));addRange71(x.fallback,r.ageLabel,r.u);});
    }else{
      (normalizeEvacRows(st)||[]).filter(function(r){return r.active;}).forEach(function(r){var c=code71(r.c),x=map[c]||(map[c]={module:'evac',c:c,p:r.p||product71(c),cc:cc71(c),units:0,value:0,cendis:0,sales:0,ranges:emptyRanges71(),fallback:emptyRanges71()});x.units+=n71(r.u);x.value+=n71(r.v);x.sales+=n71(r.sales1)+n71(r.sales2);x.cendis=Math.max(x.cendis,n71(r.cendis),n71(inv[c]&&inv[c].cendis));addRange71(x.fallback,r.edad,r.u);});
    }
    return Object.values(map).map(function(x){var exact=inv[x.c]&&inv[x.c].ranges;x.ranges=exact&&rangesTotal71(exact)>0?exact:x.fallback;return x;});
  }
  window.aggregateModuleProducts71=aggregate71;

  function filtered71(module,st){var rows=aggregate71(module,st),stateObj=state&&state[module]||{},q=String(stateObj.q||'').toLowerCase();if(module==='rot'){
      if(stateObj.f==='core')rows=rows.filter(function(r){return r.cc==='CORE';});
      else if(stateObj.f==='comp')rows=rows.filter(function(r){return r.cc==='COMPLEMENTO';});
      else if(stateObj.f==='crit')rows=rows.filter(function(r){return AGE71.some(function(a){return a.rank>=3&&n71(r.ranges[a.rank])>0;});});
      else if(stateObj.f==='a360')rows=rows.filter(function(r){return n71(r.ranges[6])>0;});
      else if(stateObj.f==='novta')rows=rows.filter(function(r){return r.sales<=0;});
    }else{
      if(stateObj.f==='core')rows=rows.filter(function(r){return r.cc==='CORE';});
      else if(stateObj.f==='comp')rows=rows.filter(function(r){return r.cc==='COMPLEMENTO';});
      else if(stateObj.f==='sr')rows=rows.filter(function(r){return r.cendis<=0;});
      else if(stateObj.f==='cr')rows=rows.filter(function(r){return r.cendis>0;});
    }
    if(q)rows=rows.filter(function(r){return (r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub+' '+r.cc).toLowerCase().indexOf(q)>=0;});
    var key=stateObj.sort||'units',dir=n71(stateObj.dir)||-1;rows.sort(function(a,b){var av,bv;if(key==='c'){av=a.c;bv=b.c;}else if(key==='p'){av=a.p.n;bv=b.p.n;}else if(key==='age'){av=Math.max(-1,...AGE71.filter(function(x){return n71(a.ranges[x.rank])>0;}).map(function(x){return x.rank;}));bv=Math.max(-1,...AGE71.filter(function(x){return n71(b.ranges[x.rank])>0;}).map(function(x){return x.rank;}));}else if(key==='cendis'){av=a.cendis;bv=b.cendis;}else if(key==='v'||key==='val'||key==='value'){av=a.value;bv=b.value;}else if(key==='sales'||key==='v3'){av=a.sales;bv=b.sales;}else{av=a.units;bv=b.units;}if(typeof av==='string')return av.localeCompare(bv)*dir;return (n71(av)-n71(bv))*dir;});return rows;
  }

  function classCards71(module,rows){var groups={'CORE':[],'COMPLEMENTO':[],'SIN CLASIFICACIÓN':[]};rows.forEach(function(r){groups[r.cc].push(r);});return '<div class="v71ClassGrid" data-v71-class-grid="'+module+'">'+Object.keys(groups).map(function(cc){var a=groups[cc],u=a.reduce(function(s,r){return s+r.units;},0),cls=cc==='CORE'?'core':cc==='COMPLEMENTO'?'comp':'none';return '<button class="v71ClassCard '+cls+'" type="button" data-v71-class-module="'+module+'" data-v71-class="'+e71(cc)+'"><label>'+e71(cc)+'</label><b>'+i71(a.length)+' productos</b><span>'+i71(u)+' unidades</span></button>';}).join('')+'</div>';}
  function ensureClassCards71(module,allRows){var root=document.getElementById(module+'-tbl');if(!root)return;var body=root.closest('.cbody'),mk=body&&body.querySelector('.mkpis');if(!body||!mk)return;var existing=body.querySelector('[data-v71-class-grid="'+module+'"]')||body.querySelector('[data-v70-class-grid="'+module+'"]');var box=document.createElement('div');box.innerHTML=classCards71(module,allRows);if(existing)existing.replaceWith(box.firstElementChild);else mk.insertAdjacentElement('afterend',box.firstElementChild);}

  function moduleTable71(module,rows){var body=rows.map(function(r){return '<tr class="v71GeneralRow" tabindex="0" role="button" data-code="'+e71(r.c)+'"><td>'+imageThumb(r.c,'sm')+'</td><td><span class="code">'+e71(r.c)+'</span></td><td><div class="v71ProductName">'+e71(r.p.n)+'</div></td><td>'+ccBadge71(r.cc)+'</td><td><div class="v71Hierarchy">'+e71(r.p.cat)+'<br>'+e71(r.p.lin)+' · '+e71(r.p.sub)+'</div></td><td>'+ageChips71(r.ranges)+'</td><td class="num"><b>'+i71(r.units)+'</b></td><td class="num">'+(r.cendis>0?'<span class="tag cr">'+i71(r.cendis)+' u</span>':'<span class="tag sr">0 u</span>')+'</td><td class="num"><b>'+m71(r.value)+'</b></td><td class="num">'+i71(r.sales)+'</td></tr>';}).join('');return '<div class="twrap"><table class="v71ModuleTable"><colgroup><col style="width:6%"><col style="width:8%"><col style="width:19%"><col style="width:10%"><col style="width:17%"><col style="width:22%"><col style="width:6%"><col style="width:6%"><col style="width:8%"><col style="width:6%"></colgroup><thead><tr><th>Imagen</th><th data-k="c">Código</th><th data-k="p">Producto</th><th>CORE / Complemento</th><th>Categoría / Línea / Sublínea</th><th data-k="age">Unidades por rango de edad</th><th class="num" data-k="units">Uds.</th><th class="num" data-k="cendis">CENDIS</th><th class="num" data-k="value">Valor</th><th class="num" data-k="sales">Venta 3m</th></tr></thead><tbody>'+(body||'<tr><td colspan="10"><div class="empty">No hay productos para este filtro.</div></td></tr>')+'</tbody></table></div>';}
  function wireModuleTable71(module){var root=document.getElementById(module+'-tbl');if(!root)return;root.querySelectorAll('.v71GeneralRow').forEach(function(tr){var open=function(e){if(e&&e.target.closest('button,a,input,select,textarea'))return;var c=tr.dataset.code;if(typeof openInventoryProduct==='function')openInventoryProduct(c);else if(typeof openBestProductDetail==='function')openBestProductDetail(c);};tr.onclick=open;tr.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(e);}};});root.querySelectorAll('th[data-k]').forEach(function(th){th.style.cursor='pointer';th.onclick=function(){var st=state[module],k=th.dataset.k;if(st.sort===k)st.dir*=-1;else{st.sort=k;st.dir=-1;}if(module==='rot')drawRot();else drawEvac();};});}

  window.drawRot=drawRot=function(){var st=S[CUR]||{},all=aggregate71('rot',st),rows=filtered71('rot',st),el=document.getElementById('rot-tbl');if(el)el.innerHTML=moduleTable71('rot',rows);var cnt=document.getElementById('rot-cnt');if(cnt)cnt.textContent='Mostrando '+i71(rows.length)+' de '+i71(all.length)+' productos consolidados';document.querySelectorAll('.chip.filt[data-q="rot"]').forEach(function(ch){ch.classList.toggle('on',state.rot.f===ch.dataset.f);ch.onclick=function(){state.rot.f=ch.dataset.f;drawRot();};});wireModuleTable71('rot');ensureClassCards71('rot',all);};
  window.drawEvac=drawEvac=function(){var st=S[CUR]||{},all=aggregate71('evac',st),rows=filtered71('evac',st),el=document.getElementById('evac-tbl');if(el)el.innerHTML=moduleTable71('evac',rows);var cnt=document.getElementById('evac-cnt');if(cnt)cnt.textContent='Mostrando '+i71(rows.length)+' de '+i71(all.length)+' productos consolidados';document.querySelectorAll('.chip.filt[data-q="evac"]').forEach(function(ch){ch.classList.toggle('on',state.evac.f===ch.dataset.f);ch.onclick=function(){state.evac.f=ch.dataset.f;drawEvac();};});wireModuleTable71('evac');ensureClassCards71('evac',all);};

  function cendisStats71(st){var rot=aggregate71('rot',st),evac=aggregate71('evac',st);return {rotNo:rot.filter(function(r){return r.cendis<=0;}),rotYes:rot.filter(function(r){return r.cendis>0;}),evacNo:evac.filter(function(r){return r.cendis<=0;}),evacYes:evac.filter(function(r){return r.cendis>0;})};}
  function openRangeModal71(title,sub,html){var modal=document.getElementById('rangeModal'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle'),body=document.getElementById('rangeModalBody');if(!modal||!body)return;if(tt)tt.textContent=title;if(ss)ss.textContent=sub||'';body.innerHTML=html;modal.classList.add('on');}
  window.openCendisSummary71=function(mode){var st=S[CUR]||{},x=cendisStats71(st),rows=(mode==='with'?x.rotYes:x.rotNo).concat(mode==='with'?x.evacYes:x.evacNo),body=rows.map(function(r){return '<tr class="v71CendisRow" data-code="'+e71(r.c)+'"><td>'+e71(r.module==='rot'?'Rotación':'Evacuación')+'</td><td><span class="code">'+e71(r.c)+'</span></td><td><b>'+e71(r.p.n)+'</b></td><td>'+ccBadge71(r.cc)+'</td><td>'+ageChips71(r.ranges)+'</td><td class="num">'+i71(r.units)+'</td><td class="num">'+i71(r.cendis)+'</td></tr>';}).join('');openRangeModal71(mode==='with'?'Con respaldo en CENDIS':'Sin respaldo en CENDIS','Rotación y Evacuación · tienda '+s71(st.name,CUR),'<div class="v70DetailSummary"><div class="v70DetailKpi"><label>Rotación</label><b>'+i71(mode==='with'?x.rotYes.length:x.rotNo.length)+' productos</b></div><div class="v70DetailKpi"><label>Evacuación</label><b>'+i71(mode==='with'?x.evacYes.length:x.evacNo.length)+' productos</b></div></div><div class="v70DetailWrap"><table class="v71ImpactTable"><thead><tr><th>Módulo</th><th>Código</th><th>Producto</th><th>Clasificación</th><th>Rangos 91+ días</th><th class="num">Uds.</th><th class="num">CENDIS</th></tr></thead><tbody>'+body+'</tbody></table></div>');setTimeout(function(){document.querySelectorAll('#rangeModalBody .v71CendisRow').forEach(function(tr){tr.onclick=function(){if(typeof openInventoryProduct==='function')openInventoryProduct(tr.dataset.code);};});},0);};

  function enhanceSummary71(){if(VIEW!=='resumen')return;var st=S[CUR]||{},x=cendisStats71(st),grid=document.querySelector('#content .kgrid');if(grid){grid.classList.add('v71SummaryGrid');var no=grid.querySelector('.k-sr');if(no){var lab=no.querySelector('.lab'),val=no.querySelector('.val'),sub=no.querySelector('.sub');if(lab)lab.textContent='Sin respaldo en CENDIS';if(val)val.textContent=i71(x.rotNo.length+x.evacNo.length);if(sub){sub.classList.add('v71CendisSub');sub.textContent='Rotación '+i71(x.rotNo.length)+' · Evacuación '+i71(x.evacNo.length);}no.onclick=function(){openCendisSummary71('without');};no.setAttribute('role','button');no.tabIndex=0;}
      var yes=grid.querySelector('.v71SupportTile');if(!yes){yes=document.createElement('div');yes.className='kpi v71SupportTile';yes.innerHTML='<div class="top"><div class="ico">✓</div></div><div class="lab">Con respaldo en CENDIS</div><div class="val">'+i71(x.rotYes.length+x.evacYes.length)+'</div><div class="sub v71CendisSub">Rotación '+i71(x.rotYes.length)+' · Evacuación '+i71(x.evacYes.length)+'</div>';var tr=grid.querySelector('.k-amb');grid.insertBefore(yes,tr||null);}else{yes.querySelector('.val').textContent=i71(x.rotYes.length+x.evacYes.length);yes.querySelector('.sub').textContent='Rotación '+i71(x.rotYes.length)+' · Evacuación '+i71(x.evacYes.length);}yes.onclick=function(){openCendisSummary71('with');};yes.setAttribute('role','button');yes.tabIndex=0;}
    if(IS_ADMIN){document.querySelectorAll('#content .card').forEach(function(card){var tt=card.querySelector('.tt');if(tt&&tt.textContent.trim().toLowerCase().indexOf('ventas')===0)card.style.display='none';});}
  }

  function guideRows71(st){return (Array.isArray(st&&st.guias)?st.guias:[]).map(function(g){var prods=Array.isArray(g&&g[6])?g[6]:[],evals=prods.filter(function(p){return !!(p&&p[10]);}),total=n71(g&&g[3]),current=n71(g&&g[4]);return {code:g&&g[0],name:g&&g[1],cat:g&&g[2],total:total,current:current,products:evals};});}
  function missingStatus71(status){return ['ok','ok_requested','ok_inv'].indexOf(String(status||''))<0;}
  function guideImpact71(st,type){return guideRows71(st).map(function(g){var targets=g.products.filter(function(p){var s=String(p&&p[5]||'');if(type==='camino')return s==='camino';if(type==='requested')return s==='requested'||s==='requested_nostock';return missingStatus71(s);}),added=targets.length,projected=Math.min(g.total,g.current+added),complete=g.current<g.total&&projected>=g.total,advance=g.current<g.total&&added>0&&projected<g.total;return Object.assign({},g,{targets:targets,added:added,projected:projected,complete:complete,advance:advance});}).filter(function(g){return g.added>0;});}
  function impactSummary71(st,type){var rows=guideImpact71(st,type),positions=rows.reduce(function(a,g){return a+g.added;},0),codes=new Set();rows.forEach(function(g){g.targets.forEach(function(p){codes.add(code71(p&&p[0]));});});return {rows:rows,complete:rows.filter(function(g){return g.complete;}).length,advance:rows.filter(function(g){return g.advance;}).length,positions:positions,products:codes.size};}
  function impactCard71(st){var a=impactSummary71(st,'camino'),b=impactSummary71(st,'requested'),c=impactSummary71(st,'missing');function box(type,title,x,meta){return '<button class="v71ImpactItem" type="button" onclick="openGuideImpact71(\''+type+'\')"><div class="v71ImpactTitle">'+title+'</div><div class="v71ImpactMain">'+i71(x.complete)+' completarían</div><div class="v71ImpactMeta">'+i71(x.advance)+' avanzarían · '+i71(x.products)+' productos · '+i71(x.positions)+' posiciones. '+meta+'</div></button>';}
    return '<div class="card v71ImpactCard"><div class="chead"><div class="cnum n3">↗</div><div><div class="tt">Impacto potencial sobre los ambientes</div><div class="ds">Cuántas guías completarían o avanzarían con traslados, solicitudes y faltantes identificados</div></div></div><div class="cbody"><div class="v71ImpactGrid">'+box('camino','Productos en traslado',a,'Proyección al recibirlos.')+box('requested','Productos solicitados',b,'Proyección al recibir la solicitud.')+box('missing','Faltantes identificados',c,'Proyección al cubrir todos los faltantes.')+'</div></div></div>';}
  window.openGuideImpact71=function(type){var st=S[CUR]||{},x=impactSummary71(st,type),titles={camino:'Impacto de productos en traslado',requested:'Impacto de productos solicitados',missing:'Impacto de productos faltantes'},body=x.rows.map(function(g){var pct=g.total?g.current/g.total*100:0,proj=g.total?g.projected/g.total*100:0,result=g.complete?'Completaría':g.advance?'Avanzaría':'Sin cambio';return '<tr class="v71GuideImpactRow" data-guide="'+e71(g.code)+'"><td><b>'+e71(g.name)+'</b><br><span style="color:var(--mut)">'+e71(g.code)+' · '+e71(g.cat)+'</span></td><td class="num">'+pct.toFixed(1)+'%</td><td class="num">'+i71(g.added)+'</td><td class="num">'+proj.toFixed(1)+'%</td><td><span class="tag '+(g.complete?'cr':g.advance?'a':'rev')+'">'+result+'</span></td></tr>';}).join('');openRangeModal71(titles[type]||'Impacto en ambientes',s71(st.name,CUR)+' · cálculo por posición producto–guía–piso','<div class="v70DetailSummary"><div class="v70DetailKpi"><label>Completarían</label><b>'+i71(x.complete)+' ambientes</b></div><div class="v70DetailKpi"><label>Avanzarían</label><b>'+i71(x.advance)+' ambientes</b></div><div class="v70DetailKpi"><label>Productos</label><b>'+i71(x.products)+'</b></div><div class="v70DetailKpi"><label>Posiciones</label><b>'+i71(x.positions)+'</b></div></div><div class="v70DetailWrap"><table class="v71ImpactTable"><thead><tr><th>Ambiente / guía</th><th class="num">Cobertura actual</th><th class="num">Posiciones impactadas</th><th class="num">Cobertura proyectada</th><th>Resultado</th></tr></thead><tbody>'+body+'</tbody></table></div>');setTimeout(function(){document.querySelectorAll('#rangeModalBody .v71GuideImpactRow').forEach(function(tr){tr.onclick=function(){var c=tr.dataset.guide;if(typeof closeRangeModal==='function')closeRangeModal();setTimeout(function(){if(typeof openGuideDetailV48==='function')openGuideDetailV48(c);},40);};});},0);};

  var baseViewAmb71=window.viewAmb;
  if(typeof baseViewAmb71==='function')window.viewAmb=viewAmb=function(st){return impactCard71(st)+baseViewAmb71(st);};

  function configureNav71(){var nav=document.getElementById('nav');if(!nav)return;var links=nav.querySelectorAll('a');links.forEach(function(a){if(IS_ADMIN){if(['vta','cli','dashboard'].includes(a.dataset.v))a.style.display='none';else a.style.display='';}else a.style.display='';if(!IS_ADMIN)a.style.order='';});if(IS_ADMIN){var orders={inventario:1,resumen:2,prox:4,rot:5,evac:6,amb:7,traslados:8};links.forEach(function(a){if(orders[a.dataset.v])a.style.order=orders[a.dataset.v];});var lab=nav.querySelector('.nlab');if(lab)lab.style.order=3;}else{var lab2=nav.querySelector('.nlab');if(lab2)lab2.style.order='';}}

  var baseApplyRole71=window.applyRoleUI;
  if(typeof baseApplyRole71==='function')window.applyRoleUI=applyRoleUI=function(){var out=baseApplyRole71.apply(this,arguments);configureNav71();return out;};
  var baseSetView71=window.setView;
  if(typeof baseSetView71==='function')window.setView=setView=function(v){if(IS_ADMIN&&(v==='vta'||v==='cli'||v==='dashboard'))v='inventario';var out=baseSetView71.call(this,v);setTimeout(function(){configureNav71();enhanceSummary71();var vb=document.querySelector('.appVersionChip b');if(vb&&(vb.textContent||'').indexOf('V79')<0)vb.textContent=(vb.textContent||'').replace(/V\d+$/,'V79');},0);return out;};
  var baseLogin71=window.loginUser;
  if(typeof baseLogin71==='function')window.loginUser=loginUser=function(){var out=baseLogin71.apply(this,arguments);setTimeout(function(){configureNav71();if(IS_ADMIN&&isAuthenticated()){CUR=AUTH.store;VIEW='inventario';setActiveNav('inventario');setView('inventario');}},0);return out;};
  var baseRefresh71=window.refresh;
  if(typeof baseRefresh71==='function')window.refresh=refresh=function(){if(IS_ADMIN&&(VIEW==='vta'||VIEW==='cli'||VIEW==='dashboard'||!VIEW))VIEW='inventario';var out=baseRefresh71.apply(this,arguments);setTimeout(function(){configureNav71();enhanceSummary71();var vb=document.querySelector('.appVersionChip b');if(vb&&(vb.textContent||'').indexOf('V79')<0)vb.textContent=(vb.textContent||'').replace(/V\d+$/,'V79');},0);return out;};

  window.openClassDetail71=function(module,cc){var st=S[CUR]||{},rows=aggregate71(module,st).filter(function(r){return r.cc===cc;}),body=rows.map(function(r){return '<tr class="v71CendisRow" data-code="'+e71(r.c)+'"><td><span class="code">'+e71(r.c)+'</span></td><td><b>'+e71(r.p.n)+'</b></td><td>'+e71(r.p.cat)+'<br><span style="color:var(--mut)">'+e71(r.p.lin)+' · '+e71(r.p.sub)+'</span></td><td>'+ageChips71(r.ranges)+'</td><td class="num">'+i71(r.units)+'</td><td class="num">'+i71(r.cendis)+'</td><td class="num">'+m71(r.value)+'</td></tr>';}).join('');openRangeModal71((module==='rot'?'Rotación':'Evacuación')+' · '+cc,'Detalle consolidado por producto y rangos de edad de 91 días o más','<div class="v70DetailSummary"><div class="v70DetailKpi"><label>Productos</label><b>'+i71(rows.length)+'</b></div><div class="v70DetailKpi"><label>Unidades</label><b>'+i71(rows.reduce(function(a,r){return a+r.units;},0))+'</b></div><div class="v70DetailKpi"><label>Valor</label><b>'+m71(rows.reduce(function(a,r){return a+r.value;},0))+'</b></div></div><div class="v70DetailWrap"><table class="v71ImpactTable"><thead><tr><th>Código</th><th>Producto</th><th>Categoría / Línea / Sublínea</th><th>Rangos 91+ días</th><th class="num">Uds.</th><th class="num">CENDIS</th><th class="num">Valor</th></tr></thead><tbody>'+body+'</tbody></table></div>');setTimeout(function(){document.querySelectorAll('#rangeModalBody .v71CendisRow').forEach(function(tr){tr.onclick=function(){if(typeof openInventoryProduct==='function')openInventoryProduct(tr.dataset.code);};});},0);};

  document.addEventListener('click',function(e){var card=e.target.closest&&e.target.closest('[data-v71-class-module]');if(card){e.preventDefault();e.stopPropagation();openClassDetail71(card.dataset.v71ClassModule,card.dataset.v71Class);return;}},true);

  setTimeout(function(){configureNav71();var vb=document.querySelector('.appVersionChip b');if(vb&&(vb.textContent||'').indexOf('V79')<0)vb.textContent=(vb.textContent||'').replace(/V\d+$/,'V79');if(IS_ADMIN&&isAuthenticated()){CUR=AUTH.store;VIEW='inventario';setActiveNav('inventario');setView('inventario');}else if(isAuthenticated())refresh();},0);
})();


/* ===== llavero-v74-final-script ===== */
(function(){
  'use strict';

  window.LLAVERO_BUILD='V79';
  if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');

  var AGE74=[
    {rank:0,label:'91–120'},
    {rank:1,label:'121–150'},
    {rank:2,label:'151–180'},
    {rank:3,label:'181–210'},
    {rank:4,label:'211–240'},
    {rank:5,label:'241–360'},
    {rank:6,label:'+360'}
  ];

  function n74(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function e74(v){
    try{return typeof esc==='function'?esc(v):String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
    catch(err){return String(v==null?'':v);}
  }
  function i74(v){try{return typeof fInt==='function'?fInt(v):Math.round(n74(v)).toLocaleString('es-CO');}catch(err){return String(Math.round(n74(v)));}}
  function money74(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(v):(typeof fMoney==='function'?fMoney(v):'$ '+Math.round(n74(v)).toLocaleString('es-CO'));}catch(err){return '$ '+Math.round(n74(v)).toLocaleString('es-CO');}}
  function storeName74(code){try{return (S&&S[code]&&S[code].name)||code;}catch(err){return code;}}

  /* 1. Rankings de exposición con variación diaria. */
  window.rankChart=function(rows,key,color){
    var ranked=(rows||[]).filter(function(r){return Number.isFinite(Number(r&&r[key]));}).sort(function(a,b){return n74(b[key])-n74(a[key])||String(a.name).localeCompare(String(b.name));}).slice(0,10);
    var max=Math.max(1,...ranked.map(function(r){return n74(r[key]);}));
    var view=key==='rotPct'?'rot':'evac';
    var label=key==='rotPct'?'Rotación':'Evacuación';
    var deltaKey=key==='rotPct'?'rotDelta':'evacDelta';
    if(!ranked.length)return '<div class="empty">Sin datos.</div>';
    return '<div class="rankChart fullStoreRanking65 v74ExposureRank">'+ranked.map(function(r,index){
      var current=n74(r[key]),delta=n74(r[deltaKey]),previous=current-delta;
      var rel=previous>0?Math.abs(delta)/previous*100:(current>0&&Math.abs(delta)>0?100:0);
      var cls=Math.abs(delta)<0.0001?'flat':delta<0?'good':'bad';
      var arrow=Math.abs(delta)<0.0001?'→':delta<0?'↓':'↑';
      var change=Math.abs(delta)<0.0001?'Sin cambio':arrow+' '+rel.toFixed(1)+'%';
      var pp=(delta>0?'+':'')+delta.toFixed(1)+' pp';
      return '<div class="rankRow storeLink65 storeNav66" role="button" tabindex="0" data-store="'+e74(r.code)+'" data-view="'+view+'" title="Abrir '+e74(r.name)+' en '+label+'"><div class="rankName"><b>'+(index+1)+'. '+e74(r.name)+'</b><small>Ver '+label+' de la tienda →</small></div><div class="rankTrack"><div class="rankFill" style="width:'+Math.max(1,current/max*100)+'%;background:'+color+'"></div></div><div class="v74RankMetric"><b>'+current.toFixed(1)+'%</b><span class="v74Delta '+cls+'" title="Variación frente al corte anterior: '+pp+'">'+change+'</span></div></div>';
    }).join('')+'</div>';
  };

  /* 2. Tendencia diaria con escala adaptativa y etiquetas separadas. */
  window.managementTrendSvg=function(input){
    var data=Array.isArray(input)?input:(typeof networkManagementTrendData59==='function'?networkManagementTrendData59():(typeof networkManagementTrendData==='function'?networkManagementTrendData():[]));
    if(!data.length)return '<div class="empty">Sin cortes históricos.</div>';
    var values=[];
    data.forEach(function(d){if(!d.isBase){if(Number.isFinite(Number(d.rotRecovery)))values.push(n74(d.rotRecovery));if(Number.isFinite(Number(d.evacRecovery)))values.push(n74(d.evacRecovery));}});
    if(!values.length)values=[0];
    var min=Math.min(0,...values),max=Math.max(0,...values),lo,hi;
    if(min>=0){lo=-Math.max(.35,max*.18);hi=max+Math.max(.55,max*.24);}
    else if(max<=0){lo=min-Math.max(.55,Math.abs(min)*.24);hi=Math.max(.35,Math.abs(min)*.18);}
    else{var span=max-min,margin=Math.max(.45,span*.18);lo=min-margin;hi=max+margin;}
    if(hi-lo<2){var middle=(hi+lo)/2;lo=middle-1;hi=middle+1;}
    var W=1180,H=330,p={l:70,r:38,t:48,b:54};
    var x=function(index){return p.l+(W-p.l-p.r)*(data.length===1?.5:index/(data.length-1));};
    var y=function(value){return p.t+(H-p.t-p.b)*(hi-value)/(hi-lo);};
    var path=function(key){return data.map(function(d,index){var v=d.isBase?0:n74(d[key]);return (index?'L':'M')+x(index).toFixed(1)+','+y(v).toFixed(1);}).join(' ');};
    var ticks=[];for(var ti=0;ti<5;ti++)ticks.push(lo+(hi-lo)*(ti/4));
    var grid=ticks.map(function(v){var yy=y(v);return '<line x1="'+p.l+'" y1="'+yy+'" x2="'+(W-p.r)+'" y2="'+yy+'" stroke="var(--line2)"/><text x="'+(p.l-11)+'" y="'+(yy+4)+'" text-anchor="end" font-size="12" font-weight="700" fill="var(--mut)">'+v.toFixed(1)+'%</text>';}).join('');
    var dateLabels=data.map(function(d,index){return '<text x="'+x(index)+'" y="'+(H-16)+'" text-anchor="middle" font-size="12" font-weight="800" fill="var(--mut)">'+e74(String(d.date||'').slice(5).split('-').reverse().join('/'))+'</text>';}).join('');
    function valuePill(index,value,color,above){
      var px=x(index),py=y(value)+(above?-22:25),text=value.toFixed(1)+'%',width=58;
      return '<g class="trendPointGroup65 trendNav66" role="button" tabindex="0" data-date="'+e74(data[index].date)+'" data-kind="management"><circle cx="'+px+'" cy="'+y(value)+'" r="7" fill="'+color+'" stroke="#fff" stroke-width="3"></circle><rect x="'+(px-width/2)+'" y="'+(py-14)+'" width="'+width+'" height="20" rx="8" fill="var(--card)" stroke="'+color+'" stroke-width="1"></rect><text x="'+px+'" y="'+py+'" text-anchor="middle" font-size="12" font-weight="900" fill="'+color+'">'+text+'</text><title>'+e74(data[index].date)+': '+text+'</title></g>';
    }
    var points='';
    data.forEach(function(d,index){
      if(d.isBase||index===0){
        var bx=x(index),by=y(0);points+='<g class="trendPointGroup65 trendNav66" role="button" tabindex="0" data-date="'+e74(d.date)+'" data-kind="management"><circle cx="'+bx+'" cy="'+by+'" r="7" fill="var(--ink2)" stroke="#fff" stroke-width="3"></circle><rect x="'+(bx-33)+'" y="'+(by-31)+'" width="66" height="21" rx="8" fill="var(--card)" stroke="var(--ink2)"></rect><text x="'+bx+'" y="'+(by-16)+'" text-anchor="middle" font-size="12" font-weight="900" fill="var(--ink2)">Base 0%</text></g>';
      }else{
        points+=valuePill(index,n74(d.rotRecovery),'var(--rot)',true);
        points+=valuePill(index,n74(d.evacRecovery),'var(--evac)',false);
      }
    });
    var zero=y(0);
    return '<div class="trendWrap74"><svg class="trendSvg74" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+grid+'<line x1="'+p.l+'" y1="'+zero+'" x2="'+(W-p.r)+'" y2="'+zero+'" stroke="var(--mut)" stroke-width="2" stroke-dasharray="7 6"/><path d="'+path('rotRecovery')+'" fill="none" stroke="var(--rot)" stroke-width="4"/><path d="'+path('evacRecovery')+'" fill="none" stroke="var(--evac)" stroke-width="4"/>'+points+dateLabels+'</svg></div><div class="trendLegend"><span><i style="background:var(--rot)"></i>Mejora Rotación</span><span><i style="background:var(--evac)"></i>Mejora Evacuación</span></div><div class="dashboardNote">La escala se ajusta a los valores reales. Positivo = mejora; negativo = deterioro. La línea base se muestra una sola vez en 0%.</div>';
  };

  /* 3. Seguimiento comparativo de tiendas: unidades, pesos o juntos. */
  window.LLV_TRACK=window.LLV_TRACK||{};
  if(!window.LLV_TRACK.leaderRef)window.LLV_TRACK.leaderRef='previous';
  if(!window.LLV_TRACK.leaderState)window.LLV_TRACK.leaderState='rot';
  if(!window.LLV_TRACK.leaderMetric)window.LLV_TRACK.leaderMetric='both';

  function detailedHistory74(){try{return typeof readDetailHistory==='function'?readDetailHistory():[];}catch(err){return [];}}
  function currentDetail74(){try{return typeof buildDetailedSnapshot==='function'?buildDetailedSnapshot():null;}catch(err){return null;}}
  function referenceDetail74(mode,currentDate){var prior=detailedHistory74().filter(function(x){return x&&String(x.date)<String(currentDate);}).sort(function(a,b){return String(a.date).localeCompare(String(b.date));});if(!prior.length)return null;return mode==='base'?prior[0]:prior[prior.length-1];}
  function rowMap74(rows){var map={};(rows||[]).forEach(function(r){var code=String(r&&r[0]||'').trim();if(!code)return;var x=map[code]||(map[code]={u:0,v:0});x.u+=n74(r&&r[1]);x.v+=n74(r&&r[2]);});return map;}
  function compareRows74(currentRows,referenceRows){
    var cur=rowMap74(currentRows),ref=rowMap74(referenceRows),keys=new Set(Object.keys(cur).concat(Object.keys(ref)));
    var out={refU:0,curU:0,managedU:0,newU:0,refV:0,curV:0,managedV:0,newV:0};
    keys.forEach(function(code){var a=ref[code]||{u:0,v:0},b=cur[code]||{u:0,v:0};out.refU+=a.u;out.curU+=b.u;out.refV+=a.v;out.curV+=b.v;out.managedU+=Math.max(0,a.u-b.u);out.managedV+=Math.max(0,a.v-b.v);if(!ref[code]&&cur[code]){out.newU+=b.u;out.newV+=b.v;}});
    var denU=out.refU+out.newU,denV=out.refV+out.newV;out.progressU=denU?(denU-out.curU)/denU*100:0;out.progressV=denV?(denV-out.curV)/denV*100:0;return out;
  }
  function leaderRows74(){
    var current=currentDetail74();if(!current)return {current:null,reference:null,rows:[]};
    var reference=referenceDetail74(window.LLV_TRACK.leaderRef,current.date),stateName=window.LLV_TRACK.leaderState==='evac'?'evac':'rot';
    var rows=Object.keys(current.stores||{}).map(function(code){var cur=current.stores[code]||{},ref=reference&&reference.stores&&reference.stores[code]||{};return {code:code,name:cur.name||storeName74(code),stats:compareRows74(cur[stateName]||[],ref[stateName]||[])};});
    rows.sort(function(a,b){return b.stats.refU-a.stats.refU||b.stats.curU-a.stats.curU||String(a.name).localeCompare(String(b.name));});
    return {current:current,reference:reference,rows:rows};
  }
  function btn74(label,value,selected,handler){return '<button type="button" class="trackBtn '+(value===selected?'on':'')+'" onclick="'+handler+'(\''+value+'\')">'+label+'</button>';}
  function progress74(v){var cls=v>0.05?'good':v<-.05?'bad':'flat',arrow=v>0.05?'↓':v<-.05?'↑':'→';return '<span class="trackProgress '+cls+'">'+arrow+' '+Math.abs(v).toFixed(1)+'%</span>';}
  function openLeaderStore74(code){if(typeof openStoreDashboard==='function')openStoreDashboard(code,'resumen');else if(typeof window.openLeaderStoreTracking==='function')window.openLeaderStoreTracking(code);}
  window.openLeaderStore74=openLeaderStore74;

  function leaderPanel74(){
    var data=leaderRows74(),rows=data.rows,metric=window.LLV_TRACK.leaderMetric,stateName=window.LLV_TRACK.leaderState==='evac'?'Evacuación':'Rotación',current=data.current,reference=data.reference;
    var aggregate=rows.reduce(function(a,r){Object.keys(a).forEach(function(k){a[k]+=n74(r.stats[k]);});return a;},{refU:0,curU:0,managedU:0,newU:0,refV:0,curV:0,managedV:0,newV:0});
    var denU=aggregate.refU+aggregate.newU,denV=aggregate.refV+aggregate.newV;aggregate.progressU=denU?(denU-aggregate.curU)/denU*100:0;aggregate.progressV=denV?(denV-aggregate.curV)/denV*100:0;
    var head='<div class="card trackingPanel" id="leaderTrackingPanel"><div class="chead"><div class="cnum n4">↕</div><div><div class="tt">Seguimiento comparativo de tiendas</div><div class="ds">Orden inicial: mayor a menor cantidad de unidades del corte de referencia · '+stateName+'</div></div><div class="rt"><span class="badge mut">'+i74(rows.length)+' tiendas</span></div></div>';
    var controls='<div class="trackingControls"><div class="trackingControlGroup"><span class="trackingControlLabel">Comparar</span>'+btn74('Corte anterior','previous',window.LLV_TRACK.leaderRef,'setLeaderTrackRef')+btn74('Corte base','base',window.LLV_TRACK.leaderRef,'setLeaderTrackRef')+'</div><div class="trackingControlGroup"><span class="trackingControlLabel">Estado</span>'+btn74('Rotación','rot',window.LLV_TRACK.leaderState,'setLeaderTrackState')+btn74('Evacuación','evac',window.LLV_TRACK.leaderState,'setLeaderTrackState')+'</div><div class="trackingControlGroup"><span class="trackingControlLabel">Vista</span>'+btn74('Unidades','units',metric,'setLeaderTrackMetric')+btn74('Pesos','value',metric,'setLeaderTrackMetric')+btn74('Juntos','both',metric,'setLeaderTrackMetric')+'</div><div class="trackingReference">Actual <b>'+e74(current&&current.date||'—')+'</b> vs. <b>'+e74(reference&&reference.date||'sin referencia')+'</b></div></div>';
    if(!reference)return head+controls+'<div class="cbody"><div class="trackingEmpty">El comparativo se habilita cuando existe un corte anterior.</div></div></div>';
    var summary='<div class="leaderTrackingSummary"><div class="leaderTrackingKpi"><label>Unidades de referencia</label><b>'+i74(aggregate.refU)+'</b></div><div class="leaderTrackingKpi"><label>Unidades actuales</label><b>'+i74(aggregate.curU)+'</b></div><div class="leaderTrackingKpi"><label>Avance en unidades</label><b>'+progress74(aggregate.progressU)+'</b></div><div class="leaderTrackingKpi"><label>Avance en valor</label><b>'+progress74(aggregate.progressV)+'</b></div></div>';
    var unitCols=metric!=='value',valueCols=metric!=='units';
    var body=rows.map(function(r){var s=r.stats;return '<tr tabindex="0" role="button" onclick="openLeaderStore74(\''+e74(r.code)+'\')" onkeydown="if(event.key===\'Enter\'){openLeaderStore74(\''+e74(r.code)+'\')}"><td><div class="leaderStoreName">'+e74(r.name)+'</div><div class="leaderStoreSub">Ver resumen de la tienda →</div></td>'+(unitCols?'<td class="num">'+i74(s.refU)+'</td><td class="num"><b>'+i74(s.curU)+'</b></td><td class="num">'+i74(s.managedU)+'</td><td class="num">'+i74(s.newU)+'</td><td class="num">'+progress74(s.progressU)+'</td>':'')+(valueCols?'<td class="num">'+money74(s.refV)+'</td><td class="num"><b>'+money74(s.curV)+'</b></td><td class="num">'+money74(s.managedV)+'</td><td class="num">'+money74(s.newV)+'</td><td class="num">'+progress74(s.progressV)+'</td>':'')+'</tr>';}).join('');
    var table='<div class="trackingTableWrap"><table class="trackingTable leaderTrackTable"><thead><tr><th>Tienda</th>'+(unitCols?'<th class="num">Uds. referencia</th><th class="num">Uds. actuales</th><th class="num">Gestionadas / reducidas</th><th class="num">Nuevas</th><th class="num">Variación</th>':'')+(valueCols?'<th class="num">Valor referencia</th><th class="num">Valor actual</th><th class="num">Valor gestionado / reducido</th><th class="num">Valor nuevo</th><th class="num">Variación COP</th>':'')+'</tr></thead><tbody>'+body+'</tbody></table></div>';
    return head+controls+'<div class="cbody">'+summary+table+'<div class="trackingNote"><b>Orden:</b> las tiendas se muestran de mayor a menor cantidad de unidades en el corte de referencia. Usa Vista para alternar entre Unidades, Pesos o Juntos.</div></div></div>';
  }
  window.__llaveroLeaderTrackingPanel=leaderPanel74;
  window.renderLeaderTracking=function(){var el=document.getElementById('leaderTrackingPanel');if(el)el.outerHTML=leaderPanel74();};
  window.setLeaderTrackRef=function(v){window.LLV_TRACK.leaderRef=v;window.renderLeaderTracking();};
  window.setLeaderTrackState=function(v){window.LLV_TRACK.leaderState=v;window.renderLeaderTracking();};
  window.setLeaderTrackMetric=function(v){window.LLV_TRACK.leaderMetric=v;window.renderLeaderTracking();};

  /* 4. Tarjetas del seguimiento diario por tienda. */
  function trendMini74(previous,current){
    previous=n74(previous);current=n74(current);var delta=current-previous,rel=previous?Math.abs(delta)/previous*100:(current?100:0),cls=Math.abs(delta)<.0001?'flat':delta<0?'good':'bad',arrow=Math.abs(delta)<.0001?'→':delta<0?'↓':'↑',max=Math.max(1,previous,current);
    return '<div class="dailyTrend74"><div class="dailyTrendTop"><span class="v74Delta '+cls+'">'+arrow+' '+rel.toFixed(1)+'%</span><small>'+i74(previous)+' → '+i74(current)+' productos</small></div><div class="dailyTrendBars"><i style="width:'+Math.max(2,previous/max*100)+'%"></i><b style="width:'+Math.max(2,current/max*100)+'%" class="'+cls+'"></b></div></div>';
  }
  function card74(label,value,sub,cls,trend){return '<div class="dailyMetric v74DailyMetric '+(cls||'')+'"><div class="dmLabel">'+label+'</div><div class="dmValue">'+value+'</div><div class="dmSub">'+sub+'</div>'+(trend||'')+'</div>';}
  window.storeDailyManagementPanel=function(code){
    var snap=typeof currentDailySummary==='function'?currentDailySummary():null,m=snap&&snap.stores&&snap.stores[code];if(!m)return '';
    if(!m.hasPrevious)return '<div class="card"><div class="chead"><div class="cnum n3">D</div><div><div class="tt">Seguimiento diario de gestión</div><div class="ds">Comparación por tienda y producto</div></div></div><div class="cbody"><div class="baselineBox"><b>Este corte es la línea base</b>El siguiente corte mostrará gestionados, persistentes, nuevos y variaciones.</div></div></div>';
    var score=m.score,color=typeof scoreColor==='function'?scoreColor(score):'var(--brand)';
    return '<div class="card"><div class="chead"><div class="cnum n3">D</div><div><div class="tt">Seguimiento diario de gestión</div><div class="ds">Productos y variaciones frente al corte '+e74(snap.previousDate||'anterior')+'</div></div><div class="rt">'+(typeof managementStatus==='function'?managementStatus(score):'')+'</div></div><div class="cbody"><div class="managementHero"><div class="scoreRing" style="--score:'+score+';--scoreColor:'+color+'"><strong>'+score+'</strong><small>DE 100</small></div><div class="managementExplain"><b>Lectura operativa:</b> las tarjetas cuentan productos. Las gráficas comparan el corte anterior con el actual; una disminución es favorable para Rotación, Evacuación, +360 días y traslados pendientes.</div></div><div class="dailyGrid v74DailyGrid">'+
      card74('Gestionados',i74(m.critical.recoveredCount)+' productos',money74(m.critical.recoveredVal)+' dejaron el estado crítico','metricPositive','')+
      card74('Persistentes',i74(m.critical.persistentCount)+' productos',money74(m.critical.persistentVal)+' continúan críticos','','')+
      card74('Nuevos críticos',i74(m.critical.newCount)+' productos',money74(m.critical.newVal)+' ingresaron al estado',m.critical.newCount?'metricNegative':'metricPositive','')+
      card74('Rotación · variación',i74(m.rot.currentCount)+' productos',i74(m.rot.recoveredCount)+' gestionados · '+i74(m.rot.newCount)+' entraron','',trendMini74(m.rot.previousCount,m.rot.currentCount))+
      card74('Evacuación · variación',i74(m.evac.currentCount)+' productos',i74(m.evac.recoveredCount)+' gestionados · '+i74(m.evac.newCount)+' entraron','',trendMini74(m.evac.previousCount,m.evac.currentCount))+
      card74('+360 días',i74(m.rot360.currentCount)+' productos',i74(m.rot360.recoveredCount)+' gestionados · '+i74(m.rot360.newCount)+' entraron','',trendMini74(m.rot360.previousCount,m.rot360.currentCount))+
      card74('Traslados pendientes',i74(m.transfers.current)+' pendientes',i74(m.transfers.resolved)+' resueltos · '+i74(m.transfers.newCount)+' nuevos','',trendMini74(m.transfers.previous,m.transfers.current))+
    '</div><div class="dashboardNote">Gestionado significa que el producto dejó el estado crítico entre cortes; no confirma una venta.</div></div></div>';
  };

  /* 5. Tarjetas amplias y dos gráficos en Rotación y Evacuación. */
  function moduleRows74(module){try{return typeof aggregateModuleProducts71==='function'?aggregateModuleProducts71(module,S[CUR]||{}):[];}catch(err){return [];}}
  function classStats74(rows,cc){var selected=rows.filter(function(r){return r.cc===cc;});return {rows:selected,products:selected.length,units:selected.reduce(function(a,r){return a+n74(r.units);},0),value:selected.reduce(function(a,r){return a+n74(r.value);},0)};}
  function classCard74(module,cc,stats){var cls=cc==='CORE'?'core':'comp';return '<button type="button" class="v74ClassCard '+cls+'" onclick="openClassDetail71(\''+module+'\',\''+cc+'\')"><div class="v74ClassHead"><span>'+cc+'</span><em>'+cc+'</em></div><div class="v74ClassUnits">'+i74(stats.units)+' unidades</div><div class="v74ClassMetrics"><div><label>Productos</label><b>'+i74(stats.products)+'</b></div><div><label>Unidades</label><b>'+i74(stats.units)+'</b></div><div><label>Valor</label><b>'+money74(stats.value)+'</b></div></div></button>';}
  function rangeStats74(rows,rank,cc){var selected=cc?rows.filter(function(r){return r.cc===cc;}):rows,products=0,units=0;selected.forEach(function(r){var q=n74(r.ranges&&r.ranges[rank]);if(q>0){products++;units+=q;}});return {products:products,units:units};}
  function totalRangeChart74(module,rows){var values=AGE74.map(function(age){return rangeStats74(rows,age.rank,null);}),max=Math.max(1,...values.map(function(x){return x.units;}));return '<div class="v74Bars">'+AGE74.map(function(age,index){var x=values[index],height=Math.max(3,x.units/max*100);return '<div class="v74BarGroup"><div class="v74BarNumber">'+i74(x.units)+' u</div><div class="v74BarWell"><button type="button" class="v74Bar total" style="height:'+height+'%" onclick="openAgeRange74(\''+module+'\','+age.rank+',\'ALL\')" title="'+age.label+': '+i74(x.products)+' productos · '+i74(x.units)+' unidades"></button></div><div class="v74BarLabel">'+age.label+'</div><small>'+i74(x.products)+' prod.</small></div>';}).join('')+'</div>';}
  function classRangeChart74(module,rows){var values=AGE74.map(function(age){return {core:rangeStats74(rows,age.rank,'CORE'),comp:rangeStats74(rows,age.rank,'COMPLEMENTO')};}),max=Math.max(1,...values.flatMap(function(x){return [x.core.units,x.comp.units];}));return '<div class="v74Bars grouped">'+AGE74.map(function(age,index){var x=values[index],hc=Math.max(3,x.core.units/max*100),hp=Math.max(3,x.comp.units/max*100);return '<div class="v74BarGroup"><div class="v74BarPair"><button type="button" class="v74Bar core" style="height:'+hc+'%" onclick="openAgeRange74(\''+module+'\','+age.rank+',\'CORE\')" title="CORE: '+i74(x.core.products)+' productos · '+i74(x.core.units)+' unidades"></button><button type="button" class="v74Bar comp" style="height:'+hp+'%" onclick="openAgeRange74(\''+module+'\','+age.rank+',\'COMPLEMENTO\')" title="COMPLEMENTO: '+i74(x.comp.products)+' productos · '+i74(x.comp.units)+' unidades"></button></div><div class="v74BarLabel">'+age.label+'</div><small>'+i74(x.core.units)+' / '+i74(x.comp.units)+' u</small></div>';}).join('')+'</div><div class="v74ChartLegend"><span><i class="core"></i>CORE</span><span><i class="comp"></i>COMPLEMENTO</span></div>';}
  function charts74(module,rows){var title=module==='rot'?'Rotación':'Evacuación';return '<div class="v74ChartsGrid"><section class="v74ChartCard"><div class="v74ChartTitle">'+title+' por rango de edad</div><div class="v74ChartSub">Total de productos y unidades en cada rango.</div>'+totalRangeChart74(module,rows)+'</section><section class="v74ChartCard"><div class="v74ChartTitle">Clasificación por rangos</div><div class="v74ChartSub">Comparativo CORE vs. COMPLEMENTO para cada antigüedad.</div>'+classRangeChart74(module,rows)+'</section></div>';}
  function openRangeModal74(title,subtitle,html){var modal=document.getElementById('rangeModal'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle'),body=document.getElementById('rangeModalBody');if(!modal||!body)return;if(tt)tt.textContent=title;if(ss)ss.textContent=subtitle||'';body.innerHTML=html;modal.classList.add('on');}
  window.openAgeRange74=function(module,rank,cc){var rows=moduleRows74(module).filter(function(r){return n74(r.ranges&&r.ranges[rank])>0&&(cc==='ALL'||r.cc===cc);}),age=AGE74.find(function(x){return x.rank===Number(rank);})||{label:'Rango'},body=rows.map(function(r){return '<tr class="v74AgeRow" data-code="'+e74(r.c)+'"><td><span class="code">'+e74(r.c)+'</span></td><td><b>'+e74(r.p&&r.p.n||r.c)+'</b></td><td>'+e74(r.cc)+'</td><td class="num">'+i74(r.ranges&&r.ranges[rank])+'</td><td class="num">'+i74(r.units)+'</td><td class="num">'+i74(r.cendis)+'</td><td class="num">'+money74(r.value)+'</td></tr>';}).join('');openRangeModal74((module==='rot'?'Rotación':'Evacuación')+' · '+age.label+(cc==='ALL'?'':' · '+cc),'Productos que componen el rango seleccionado','<div class="v70DetailSummary"><div class="v70DetailKpi"><label>Productos</label><b>'+i74(rows.length)+'</b></div><div class="v70DetailKpi"><label>Unidades del rango</label><b>'+i74(rows.reduce(function(a,r){return a+n74(r.ranges&&r.ranges[rank]);},0))+'</b></div></div><div class="v70DetailWrap"><table class="v71ImpactTable"><thead><tr><th>Código</th><th>Producto</th><th>Clasificación</th><th class="num">Uds. rango</th><th class="num">Uds. producto</th><th class="num">CENDIS</th><th class="num">Valor</th></tr></thead><tbody>'+body+'</tbody></table></div>');setTimeout(function(){document.querySelectorAll('#rangeModalBody .v74AgeRow').forEach(function(tr){tr.onclick=function(){if(typeof openInventoryProduct==='function')openInventoryProduct(tr.dataset.code);};});},0);};
  function enhanceModule74(module){
    var root=document.getElementById(module+'-tbl');if(!root)return;var body=root.closest('.cbody'),mk=body&&body.querySelector('.mkpis');if(!body||!mk)return;var rows=moduleRows74(module),core=classStats74(rows,'CORE'),comp=classStats74(rows,'COMPLEMENTO'),unclassified=rows.filter(function(r){return r.cc!=='CORE'&&r.cc!=='COMPLEMENTO';});
    body.querySelectorAll('.ccOverview68,[data-v70-class-grid="'+module+'"],[data-v71-class-grid="'+module+'"],.v74ClassWrap[data-module="'+module+'"]').forEach(function(el){el.remove();});
    var wrap=document.createElement('div');wrap.className='v74ClassWrap';wrap.dataset.module=module;wrap.innerHTML='<div class="v74ClassGrid">'+classCard74(module,'CORE',core)+classCard74(module,'COMPLEMENTO',comp)+'</div>'+(unclassified.length?'<div class="ccNote68">'+i74(unclassified.length)+' productos sin clasificación no se incluyen en las tarjetas CORE / COMPLEMENTO.</div>':'');mk.insertAdjacentElement('afterend',wrap);
    var target=document.getElementById(module==='rot'?'cc-age-rot68':'cc-age-evac68');if(!target){target=document.createElement('div');target.id=module==='rot'?'cc-age-rot68':'cc-age-evac68';var toolbar=body.querySelector('.tbar');body.insertBefore(target,toolbar||root);}target.innerHTML=charts74(module,rows);
  }

  /* 6. En Evacuación, sin respaldo CENDIS siempre primero. */
  function prioritizeEvac74(){var tbody=document.querySelector('#evac-tbl tbody');if(!tbody)return;var rows=Array.from(tbody.querySelectorAll('tr.v71GeneralRow'));rows.sort(function(a,b){var an=!!a.querySelector('td:nth-child(8) .tag.sr'),bn=!!b.querySelector('td:nth-child(8) .tag.sr');return (an?0:1)-(bn?0:1);});rows.forEach(function(row){tbody.appendChild(row);row.classList.remove('v74FirstSupported');});var firstSupported=rows.find(function(row){return !row.querySelector('td:nth-child(8) .tag.sr');});if(firstSupported)firstSupported.classList.add('v74FirstSupported');var foot=document.querySelector('#evac-tbl+.foot span:last-child');if(foot)foot.textContent='Prioridad automática: productos sin respaldo en CENDIS primero.';}

  var baseDrawRot74=window.drawRot;
  if(typeof baseDrawRot74==='function')window.drawRot=function(){var out=baseDrawRot74.apply(this,arguments);setTimeout(function(){enhanceModule74('rot');},0);return out;};
  var baseDrawEvac74=window.drawEvac;
  if(typeof baseDrawEvac74==='function')window.drawEvac=function(){var out=baseDrawEvac74.apply(this,arguments);setTimeout(function(){enhanceModule74('evac');prioritizeEvac74();},0);return out;};

  function markVersion74(){
    if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');
    var chip=document.querySelector('.appVersionChip b');if(chip&&(chip.textContent||'').indexOf('V79')<0)chip.textContent=(chip.textContent||'Versión').replace(/V\d+$/,'V79');
    document.title=document.title.replace(/V\d+/,'V79').replace(/28\/07\/2026|29\/07\/2026/,'30/07/2026');
  }
  function enhanceCurrent74(){markVersion74();try{if(typeof VIEW!=='undefined'&&VIEW==='rot')enhanceModule74('rot');if(typeof VIEW!=='undefined'&&VIEW==='evac'){enhanceModule74('evac');prioritizeEvac74();}}catch(err){console.warn('Ajustes V74',err);}}

  var baseSetView74=window.setView;
  if(typeof baseSetView74==='function')window.setView=function(){var out=baseSetView74.apply(this,arguments);setTimeout(enhanceCurrent74,25);return out;};
  var baseRefresh74=window.refresh;
  if(typeof baseRefresh74==='function')window.refresh=function(){var out=baseRefresh74.apply(this,arguments);setTimeout(enhanceCurrent74,35);return out;};

  setTimeout(function(){markVersion74();},80);
})();


/* ===== llavero-v75-unclassified-script ===== */
(function(){
  'use strict';
  window.LLAVERO_BUILD='V79';
  if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');

  var AGE75=[
    {rank:0,label:'91–120 días'},{rank:1,label:'121–150 días'},
    {rank:2,label:'151–180 días'},{rank:3,label:'181–210 días'},
    {rank:4,label:'211–240 días'},{rank:5,label:'241–360 días'},
    {rank:6,label:'Más de 360 días'}
  ];
  function n75(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function e75(v){try{return typeof esc==='function'?esc(v):String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}catch(err){return String(v==null?'':v);}}
  function i75(v){try{return typeof fInt==='function'?fInt(v):Math.round(n75(v)).toLocaleString('es-CO');}catch(err){return String(Math.round(n75(v)));}}
  function money75(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(v):(typeof fMoney==='function'?fMoney(v):'$ '+Math.round(n75(v)).toLocaleString('es-CO'));}catch(err){return '$ '+Math.round(n75(v)).toLocaleString('es-CO');}}
  function code75(v){try{return typeof safeCode==='function'?safeCode(v):String(v==null?'':v).trim();}catch(err){return String(v==null?'':v).trim();}}
  function class75(code){
    var c=code75(code),x='';
    try{if(typeof window.llaveroClasificacion68==='function')x=window.llaveroClasificacion68(c,(typeof P!=='undefined'&&P?P[c]:null));else x=P&&P[c]&&P[c].cc;}catch(err){}
    x=String(x||'').trim().toUpperCase();
    return x==='CORE'?'CORE':(x==='COMPLEMENTO'||x==='COMPLEMENTOS')?'COMPLEMENTO':'SIN CLASIFICACIÓN';
  }
  function productName75(code,row){
    try{return (row&&row.p&&row.p.n)||(typeof productInfo==='function'&&productInfo(code).n)||(P&&P[code]&&P[code].n)||code;}catch(err){return code;}
  }
  function card75(opts){
    var mini=(opts.mini||[]).slice(0,4).map(function(x){return '<span><b>'+e75(x.value)+'</b> '+e75(x.label)+'</span>';}).join('');
    if(!mini)mini='<span>Sin unidades en esta selección</span>';
    return '<button type="button" class="v75UnclassifiedCard" '+opts.action+'>'+ 
      '<div class="v75UnclassifiedTop"><span class="v75UnclassifiedTitle">SIN CLASIFICACIÓN</span><span class="v75UnclassifiedArrow">→</span></div>'+ 
      '<div class="v75UnclassifiedValue">'+i75(opts.products)+' productos</div>'+ 
      '<div class="v75UnclassifiedMeta">'+i75(opts.units)+' '+e75(opts.unitLabel||'unidades en el módulo')+'</div>'+ 
      '<div class="v75UnclassifiedMini">'+mini+'</div>'+ 
      '<div class="v75UnclassifiedPreview">'+e75(opts.preview||'No hay productos')+'</div>'+ 
      '</button>';
  }

  function moduleRows75(module){
    try{return typeof aggregateModuleProducts71==='function'?aggregateModuleProducts71(module,S[CUR]||{}):[];}catch(err){return [];}
  }
  function ensureOperational75(module){
    var wrap=document.querySelector('.v74ClassWrap[data-module="'+module+'"]');
    if(!wrap)return;
    var old=wrap.querySelector('.v75UnclassifiedRow');if(old)old.remove();
    var rows=moduleRows75(module).filter(function(r){return r.cc!=='CORE'&&r.cc!=='COMPLEMENTO';});
    var units=rows.reduce(function(a,r){return a+n75(r.units);},0),ageMini=[];
    AGE75.forEach(function(age){var q=rows.reduce(function(a,r){return a+n75(r.ranges&&r.ranges[age.rank]);},0);if(q>0)ageMini.push({value:i75(q)+' u',label:age.label});});
    var preview=rows.slice(0,3).map(function(r){return productName75(r.c,r);}).join(' · ');if(rows.length>3)preview+=' · …';
    var row=document.createElement('div');row.className='v75UnclassifiedRow';row.dataset.v75Module=module;
    row.innerHTML=card75({products:rows.length,units:units,mini:ageMini,preview:preview,action:'onclick="openClassDetail71(\''+module+'\',\'SIN CLASIFICACIÓN\')"'});
    var note=wrap.querySelector('.ccNote68');if(note)note.remove();
    wrap.appendChild(row);
  }

  function salesRows75(){
    var rows=[];
    try{rows=(typeof normalizeProductSalesRows==='function'?normalizeProductSalesRows(S[CUR]||{}):[]).map(function(r){r.cc=class75(r.c);return r;});}catch(err){}
    return rows.filter(function(r){return r.cc==='SIN CLASIFICACIÓN'&&n75(r.u)>0;});
  }
  function ensureSales75(){
    var grid=document.querySelector('.ccSalesOverview68');if(!grid)return;
    var parent=grid.parentElement,old=parent&&parent.querySelector('.v75UnclassifiedRow[data-v75-module="vta"]');if(old)old.remove();
    var rows=salesRows75(),codes=new Set(),units=0,value=0;
    rows.forEach(function(r){codes.add(code75(r.c));units+=n75(r.u);value+=n75(r.v);});
    var preview=rows.slice().sort(function(a,b){return n75(b.v)-n75(a.v);}).slice(0,3).map(function(r){return productName75(r.c,r);}).join(' · ');if(rows.length>3)preview+=' · …';
    var row=document.createElement('div');row.className='v75UnclassifiedRow sales';row.dataset.v75Module='vta';
    row.innerHTML=card75({products:codes.size,units:units,unitLabel:'unidades vendidas',mini:value>0?[{value:money75(value),label:'venta últimos 3 meses'}]:[],preview:preview,action:'data-v68-sales-class="SIN CLASIFICACIÓN"'});
    grid.insertAdjacentElement('afterend',row);
    var note=parent&&parent.querySelector('.ccNote68');if(note&&/sin clasificaci/i.test(note.textContent||''))note.remove();
  }

  function mark75(){
    window.LLAVERO_BUILD='V79';if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');
    var chip=document.querySelector('.appVersionChip b');if(chip&&(chip.textContent||'').indexOf('V79')<0)chip.textContent=(chip.textContent||'Versión').replace(/V\d+$/,'V79');
    if(document.title.indexOf('V79')<0)document.title=document.title.replace(/V\d+/,'V79');
  }
  function enhance75(){
    mark75();
    try{
      if(typeof VIEW!=='undefined'&&VIEW==='rot')ensureOperational75('rot');
      if(typeof VIEW!=='undefined'&&VIEW==='evac')ensureOperational75('evac');
      if(typeof VIEW!=='undefined'&&VIEW==='vta')ensureSales75();
    }catch(err){console.warn('Ajuste V75',err);}
  }

  var drawRot75=window.drawRot;if(typeof drawRot75==='function')window.drawRot=function(){var out=drawRot75.apply(this,arguments);setTimeout(function(){ensureOperational75('rot');},20);return out;};
  var drawEvac75=window.drawEvac;if(typeof drawEvac75==='function')window.drawEvac=function(){var out=drawEvac75.apply(this,arguments);setTimeout(function(){ensureOperational75('evac');},20);return out;};
  var drawVta75=window.drawVta;if(typeof drawVta75==='function')window.drawVta=function(){var out=drawVta75.apply(this,arguments);setTimeout(ensureSales75,20);return out;};
  var setView75=window.setView;if(typeof setView75==='function')window.setView=function(){var out=setView75.apply(this,arguments);setTimeout(enhance75,70);return out;};
  var refresh75=window.refresh;if(typeof refresh75==='function')window.refresh=function(){var out=refresh75.apply(this,arguments);setTimeout(enhance75,90);return out;};

  setTimeout(enhance75,180);
})();


/* ===== llavero-v76-three-class-cards-script ===== */
(function(){
  'use strict';
  window.LLAVERO_BUILD='V79';
  if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');

  function integrateOperational76(module){
    var wrap=document.querySelector('.v74ClassWrap[data-module="'+module+'"]');
    if(!wrap)return;
    var grid=wrap.querySelector('.v74ClassGrid');
    var row=wrap.querySelector('.v75UnclassifiedRow[data-v75-module="'+module+'"]');
    var card=row&&row.querySelector('.v75UnclassifiedCard');
    if(grid&&card){
      card.classList.add('v76IntegratedCard');
      grid.appendChild(card);
      row.remove();
    }
  }

  function integrateSales76(){
    var grid=document.querySelector('.ccSalesOverview68');
    if(!grid)return;
    var parent=grid.parentElement;
    var row=parent&&parent.querySelector('.v75UnclassifiedRow[data-v75-module="vta"]');
    var card=row&&row.querySelector('.v75UnclassifiedCard');
    if(card){
      card.classList.add('v76IntegratedCard');
      grid.appendChild(card);
      row.remove();
    }
  }

  function mark76(){
    window.LLAVERO_BUILD='V79';
    if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');
    var chip=document.querySelector('.appVersionChip b');
    if(chip&&(chip.textContent||'').indexOf('V79')<0)chip.textContent=(chip.textContent||'Versión').replace(/V\d+$/,'V79');
    if(document.title.indexOf('V79')<0)document.title=document.title.replace(/V\d+/,'V79');
  }

  function enhance76(){
    mark76();
    try{
      if(typeof VIEW!=='undefined'&&VIEW==='rot')integrateOperational76('rot');
      if(typeof VIEW!=='undefined'&&VIEW==='evac')integrateOperational76('evac');
      if(typeof VIEW!=='undefined'&&VIEW==='vta')integrateSales76();
    }catch(err){console.warn('Ajuste V76',err);}
  }

  var drawRot76=window.drawRot;
  if(typeof drawRot76==='function')window.drawRot=function(){var out=drawRot76.apply(this,arguments);setTimeout(function(){integrateOperational76('rot');mark76();},55);return out;};
  var drawEvac76=window.drawEvac;
  if(typeof drawEvac76==='function')window.drawEvac=function(){var out=drawEvac76.apply(this,arguments);setTimeout(function(){integrateOperational76('evac');mark76();},55);return out;};
  var drawVta76=window.drawVta;
  if(typeof drawVta76==='function')window.drawVta=function(){var out=drawVta76.apply(this,arguments);setTimeout(function(){integrateSales76();mark76();},55);return out;};
  var setView76=window.setView;
  if(typeof setView76==='function')window.setView=function(){var out=setView76.apply(this,arguments);setTimeout(enhance76,115);return out;};
  var refresh76=window.refresh;
  if(typeof refresh76==='function')window.refresh=function(){var out=refresh76.apply(this,arguments);setTimeout(enhance76,135);return out;};

  /* V82: sin observador global V76. */

  setTimeout(enhance76,260);
})();


/* ===== llavero-v78-real-transfer-guide-script ===== */
(function(){
'use strict';
window.LLAVERO_BUILD='V79';if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');
function n(v){var x=Number(v);return Number.isFinite(x)?x:0}function code(v){return typeof safeCode==='function'?safeCode(v):String(v==null?'':v).trim()}function h(v){return typeof esc==='function'?esc(v==null?'':String(v)):String(v==null?'':v)}function fi(v){return typeof fInt==='function'?fInt(n(v)):Math.round(n(v)).toLocaleString('es-CO')}function fm(v){return typeof fMoneyCOP==='function'?fMoneyCOP(n(v)):'$ '+Math.round(n(v)).toLocaleString('es-CO')}
function st(){return (typeof S!=='undefined'&&S&&S[CUR])||{}}function prod(c){return (typeof P!=='undefined'&&P&&P[c])||{}}
function classification(c){var x=String(prod(c).cc||'').trim().toUpperCase();return x==='CORE'?'CORE':x==='COMPLEMENTO'?'COMPLEMENTO':'SIN CLASIFICACIÓN'}
function classTag(c){var x=classification(c),cl=x==='CORE'?'core':x==='COMPLEMENTO'?'comp':'none';return '<span class="transferTag78 '+cl+'">'+h(x)+'</span>'}
function salesMap(s){var m={};(s.ventasProducto||[]).forEach(function(r){var c=code(r&&r[0]);if(c)m[c]={value:n(r&&r[1]),units:n(r&&r[2])}});return m}
function condMaps(s){return {rot:new Set((s.rot||[]).map(function(r){return code(r&&r[0])})),evac:new Set((s.evac||[]).map(function(r){return code(r&&r[0])}))}}
function cond(c,m){var a=[];if(m.rot.has(c))a.push('ROTACIÓN');if(m.evac.has(c))a.push('EVACUACIÓN');return a.length?a:['SIN CONDICIÓN CRÍTICA']}
function condHtml(c,m){return cond(c,m).map(function(x){return '<span class="transferTag78 '+(x==='ROTACIÓN'?'rot':x==='EVACUACIÓN'?'evac':'normal')+'">'+h(x)+'</span>'}).join(' ')}
function rows(s){var sm=salesMap(s),cm=condMaps(s),d=Array.isArray(s.trDetalle)?s.trDetalle:[];return d.map(function(x,i){var c=code(x.codigo),p=prod(c),sale=sm[c]||{units:0,value:0};return {delivery:String(x.entrega||'SIN IDENTIFICAR'),document:String(x.documentoModelo||''),code:c,name:x.nombre||p.n||'—',units:n(x.unidades),volume:n(x.volumen),created:x.fechaCreacion||'',pickDate:x.fechaPicking||'',eta:x.fechaEntrega||'',pick:x.statusGlobalPicking||'',mov:x.statusMovimiento||'',review:x.revision||'',classification:classification(c),sale:sale,conditions:cond(c,cm)}})}
function ensure(){if(!state.tr)state.tr={q:'',f:'all',sort:'st',dir:-1};if(!state.tr.view78)state.tr.view78='delivery';if(!state.tr.open78)state.tr.open78={}}
window.setTransferView78=function(v){ensure();state.tr.view78=v;drawTr()};window.toggleTransferDelivery78=function(id){ensure();state.tr.open78[id]=!state.tr.open78[id];drawTr()}
function filter(all){var q=String(state.tr.q||'').trim().toLowerCase(),f=state.tr.f||'all';return all.filter(function(r){if(f==='pick'&&String(r.pick).toUpperCase()!=='A')return false;if(f==='mov'&&String(r.mov).toUpperCase()!=='A')return false;if(f==='rev'&&String(r.review).toUpperCase()!=='REVISAR')return false;if(q&&(r.delivery+' '+r.document+' '+r.code+' '+r.name+' '+r.classification+' '+r.conditions.join(' ')).toLowerCase().indexOf(q)<0)return false;return true})}
function statusTag(v){var x=String(v||'').toUpperCase();return x==='A'?'<span class="tag a">Pendiente</span>':x==='C'?'<span class="tag cr">Completado</span>':'<span style="color:var(--mut)">'+h(v||'—')+'</span>'}
function productTable(rs,compact){var body=rs.map(function(r){return '<tr class="transferProductRow78" data-code="'+h(r.code)+'"><td><b>'+h(r.delivery)+'</b></td><td><span class="code">'+h(r.code)+'</span></td><td><div class="pname">'+h(r.name)+'</div></td><td>'+classTag(r.code)+'</td><td>'+condHtml(r.code,{rot:new Set(r.conditions.indexOf('ROTACIÓN')>=0?[r.code]:[]),evac:new Set(r.conditions.indexOf('EVACUACIÓN')>=0?[r.code]:[])})+'</td><td class="transferSales78 num"><b>'+fi(r.sale.units)+' u</b><span>'+fm(r.sale.value)+'</span></td><td class="num"><b>'+fi(r.units)+'</b></td><td>'+h(r.eta||'—')+'</td><td>'+statusTag(r.pick)+'</td><td>'+statusTag(r.mov)+'</td></tr>'}).join('');return '<div class="twrap"><table class="transferProductTable78"><thead><tr><th>Orden de entrega</th><th>Código</th><th>Producto</th><th>Clasificación</th><th>Rotación / Evacuación</th><th class="num">Venta últimos 3 meses</th><th class="num">Uds. traslado</th><th>Entrega estimada</th><th>Picking</th><th>Movimiento</th></tr></thead><tbody>'+(body||'<tr><td colspan="10"><div class="empty">No hay productos para este filtro.</div></td></tr>')+'</tbody></table></div>'}
function deliveryTable(rs){var g={};rs.forEach(function(r){(g[r.delivery]||(g[r.delivery]=[])).push(r)});var ids=Object.keys(g).sort(function(a,b){return String((g[a][0]||{}).eta||'').localeCompare(String((g[b][0]||{}).eta||''))||String(a).localeCompare(String(b))});var body=ids.map(function(id){var lines=g[id],unique={};lines.forEach(function(r){unique[r.code]=r});var u=Object.values(unique),units=lines.reduce(function(a,r){return a+r.units},0),core=u.filter(function(r){return r.classification==='CORE'}).length,comp=u.filter(function(r){return r.classification==='COMPLEMENTO'}).length,none=u.length-core-comp,rot=u.filter(function(r){return r.conditions.indexOf('ROTACIÓN')>=0}).length,evac=u.filter(function(r){return r.conditions.indexOf('EVACUACIÓN')>=0}).length,su=u.reduce(function(a,r){return a+r.sale.units},0),sv=u.reduce(function(a,r){return a+r.sale.value},0),open=!!state.tr.open78[id];return '<tr class="transferDeliveryRow78 '+(open?'open':'')+'" onclick="toggleTransferDelivery78('+JSON.stringify(id)+')"><td><span class="transferArrow78">›</span></td><td><b>'+h(id)+'</b></td><td>'+h(lines[0].eta||'—')+'</td><td class="num"><b>'+fi(u.length)+'</b><div class="pageInteractiveHint">'+fi(lines.length)+' líneas</div></td><td class="num"><b>'+fi(units)+'</b></td><td><span class="transferTag78 rot">'+fi(rot)+' Rot.</span> <span class="transferTag78 evac">'+fi(evac)+' Evac.</span></td><td><span class="transferTag78 core">'+fi(core)+' Core</span> <span class="transferTag78 comp">'+fi(comp)+' Comp.</span>'+(none?' <span class="transferTag78 none">'+fi(none)+' S/C</span>':'')+'</td><td class="transferSales78 num"><b>'+fi(su)+' u</b><span>'+fm(sv)+'</span></td><td>'+statusTag(lines[0].pick)+'</td><td>'+statusTag(lines[0].mov)+'</td></tr>'+(open?'<tr class="transferDeliveryDetail78"><td colspan="10"><div class="transferDeliveryBox78"><div class="legend" style="margin-bottom:8px"><b>Productos de la entrega '+h(id)+'</b><span>'+fi(u.length)+' productos únicos · '+fi(units)+' unidades</span></div>'+productTable(lines,true)+'</div></td></tr>':'')}).join('');return '<div class="twrap"><table class="transferDeliveryTable78"><thead><tr><th></th><th>Orden de entrega</th><th>Entrega estimada</th><th class="num">Productos</th><th class="num">Unidades</th><th>Rotación / Evacuación</th><th>Clasificación</th><th class="num">Venta 3 meses</th><th>Picking</th><th>Movimiento</th></tr></thead><tbody>'+(body||'<tr><td colspan="10"><div class="empty">No hay entregas para este filtro.</div></td></tr>')+'</tbody></table></div>'}
window.viewTraslados=function(s){ensure();var all=rows(s||{}),deliveries=new Set(all.map(function(r){return r.delivery})),units=all.reduce(function(a,r){return a+r.units},0),critical=new Set(all.filter(function(r){return r.conditions[0]!=='SIN CONDICIÓN CRÍTICA'}).map(function(r){return r.code}));return '<div class="card"><div class="chead"><div class="cnum n3">⇄</div><div><div class="tt">Traslados por entrega y producto</div><div class="ds">Consulta qué productos vienen dentro de cada orden de entrega</div></div><div class="rt"><span class="badge cool">'+fi(deliveries.size)+' entregas</span></div></div><div class="cbody"><div class="mkpis"><div class="mk a"><div class="l">Órdenes de entrega</div><div class="v">'+fi(deliveries.size)+'</div></div><div class="mk a"><div class="l">Productos / líneas</div><div class="v">'+fi(all.length)+'</div></div><div class="mk a"><div class="l">Unidades en camino</div><div class="v">'+fi(units)+'</div></div><div class="mk r"><div class="l">Productos críticos</div><div class="v">'+fi(critical.size)+'</div></div></div><div class="transferSwitch78"><span class="label">Mostrar por</span><button class="'+(state.tr.view78==='delivery'?'on':'')+'" onclick="setTransferView78(\'delivery\')">Entregas</button><button class="'+(state.tr.view78==='product'?'on':'')+'" onclick="setTransferView78(\'product\')">Productos</button></div><div class="tbar"><div class="tsearch">🔎<input id="q-tr" value="'+h(state.tr.q||'')+'" placeholder="Buscar orden, producto, código, CORE o condición…" oninput="state.tr.q=this.value;drawTr()"></div><span class="chip filt" data-q="tr" data-f="all">Todos</span><span class="chip filt" data-q="tr" data-f="pick">Pend. picking</span><span class="chip filt" data-q="tr" data-f="mov">Pend. movimiento</span><span class="chip filt" data-q="tr" data-f="rev">Fecha a revisar</span></div><div id="tr-tbl"></div><div class="foot"><span id="tr-cnt"></span><span>Selecciona una entrega para ver los productos que contiene.</span></div></div></div>'}
window.drawTr=drawTr=function(){ensure();var all=rows(st()),rs=filter(all),el=document.getElementById('tr-tbl');if(el){el.innerHTML=state.tr.view78==='product'?productTable(rs,false):deliveryTable(rs);el.querySelectorAll('.transferProductRow78').forEach(function(tr){tr.onclick=function(e){e.stopPropagation();var c=tr.dataset.code;if(typeof openTransferProductV41==='function')openTransferProductV41(c);else if(typeof openInventoryProduct==='function')openInventoryProduct(c)}})}var cnt=document.getElementById('tr-cnt');if(cnt){cnt.textContent=state.tr.view78==='product'?'Mostrando '+fi(rs.length)+' de '+fi(all.length)+' productos / líneas':'Mostrando '+fi(new Set(rs.map(function(r){return r.delivery})).size)+' entregas con '+fi(rs.length)+' líneas'}document.querySelectorAll('.chip.filt[data-q="tr"]').forEach(function(ch){ch.classList.toggle('on',(state.tr.f||'all')===ch.dataset.f);ch.onclick=function(){state.tr.f=ch.dataset.f;drawTr()}})}
function month(c){var p=prod(c),u=Array.isArray(p.vmU)?p.vmU:[0,0,0],v=Array.isArray(p.vmV)?p.vmV:[0,0,0];return {u:[n(u[0]),n(u[1]),n(u[2])],v:[n(v[0]),n(v[1]),n(v[2])]}}
function trend(vals){var a=n(vals[1]),b=n(vals[2]);if(a===0&&b===0)return {cl:'flat',txt:'→ Sin venta reciente'};if(a===0&&b>0)return {cl:'up',txt:'↑ Venta nueva'};var p=(b-a)/a*100;if(Math.abs(p)<.05)return {cl:'flat',txt:'→ 0%'};return {cl:p>0?'up':'down',txt:(p>0?'↑ ':'↓ ')+Math.abs(p).toLocaleString('es-CO',{maximumFractionDigits:1})+'%'}}
function bars(vals){var mx=Math.max(1,n(vals[0]),n(vals[1]),n(vals[2])),labs=['May','Jun','Jul'];return '<div class="guideMonthBars78">'+vals.map(function(v,i){return '<span class="guideMonthBar78"><b>'+fi(v)+'</b><i style="height:'+Math.max(2,Math.round(24*n(v)/mx))+'px"></i><small>'+labs[i]+'</small></span>'}).join('')+'</div>'}
function guideCodesFromBody(body){return Array.from(new Set(Array.from(body.querySelectorAll('tbody tr[data-product-code]')).map(function(r){return code(r.dataset.productCode)}).filter(Boolean)))}
function allocateStoreMonths86(total,networkVals){
  total=Math.max(0,Math.round(n(total)));
  var w=(Array.isArray(networkVals)?networkVals:[0,0,0]).slice(0,3).map(function(v){return Math.max(0,n(v))});
  while(w.length<3)w.push(0);
  if(total===0)return {vals:[0,0,0],basis:'Sin venta en la tienda'};
  var sum=w.reduce(function(a,v){return a+v},0),vals=[0,0,0],basis='';
  if(sum<=0){
    var q=Math.floor(total/3),r=total-q*3;vals=[q,q,q];
    /* El remanente se asigna desde el mes más reciente para conservar enteros. */
    for(var j=0;j<r;j++)vals[2-j%3]++;
    basis='Distribución uniforme estimada: no existe patrón mensual de red';
  }else{
    var raw=w.map(function(v){return total*v/sum}),floor=raw.map(function(v){return Math.floor(v)}),used=floor.reduce(function(a,v){return a+v},0);
    vals=floor.slice();
    var order=[0,1,2].sort(function(a,b){var d=(raw[b]-floor[b])-(raw[a]-floor[a]);return Math.abs(d)>.0000001?d:b-a});
    for(var i=0;i<total-used;i++)vals[order[i%3]]++;
    basis='Distribución estimada con el patrón mensual de red, ajustada al total real de la tienda';
  }
  return {vals:vals,basis:basis};
}
function enhanceGuide(codeGuide){
  var body=document.getElementById('guideDetailBodyV49');
  if(!body)return;
  var old=body.querySelector('#guideSalesSummary78');if(old)old.remove();
  body.querySelectorAll('.guideSalesExtra78').forEach(function(x){x.remove()});
  body.querySelectorAll('.guideSalesTable78').forEach(function(t){t.classList.remove('guideSalesTable78')});

  var store=st(),codes=guideCodesFromBody(body),sm=salesMap(store),im={};
  (Array.isArray(store.inventario)?store.inventario:[]).forEach(function(r){
    var c=code(r&&r.codigo);if(!c)return;
    im[c]={stock:n(r&&r.stock),available:n(r&&r.disponible),units:n(r&&r.unidadesFacUlt3Meses),value:n(r&&r.facturacionUlt3Meses)};
  });

  var totalU=0,totalV=0,withSale=0,zero=0,top=null,months=[0,0,0];
  codes.forEach(function(c){
    var s=sm[c]||{units:0,value:0},alloc=allocateStoreMonths86(s.units,month(c).u);
    totalU+=n(s.units);totalV+=n(s.value);
    for(var i=0;i<3;i++)months[i]+=n(alloc.vals[i]);
    if(n(s.units)>0||n(s.value)>0)withSale++;else zero++;
    if(!top||n(s.units)>top.units)top={c:c,units:n(s.units),value:n(s.value),name:prod(c).n||c};
  });
  var pct=codes.length?withSale/codes.length*100:0,topShare=totalU&&top?top.units/totalU*100:0,guideTrend=trend(months);
  var summary='<div class="guideSalesSummary78" id="guideSalesSummary78">'
    +'<div class="guideSalesGrid78">'
    +'<div class="guideSalesCard78"><div class="l">Venta 3 meses · tienda</div><div class="v">'+fi(totalU)+' unidades</div><div class="m">'+fm(totalV)+' acumulados en la tienda seleccionada</div></div>'
    +'<div class="guideSalesCard78"><div class="l">Distribución mensual estimada · tienda</div><div class="v">'+bars(months)+'</div><div class="m">May '+fi(months[0])+' · Jun '+fi(months[1])+' · Jul '+fi(months[2])+' · total '+fi(months[0]+months[1]+months[2])+' u</div></div>'
    +'<div class="guideSalesCard78"><div class="l">Variación estimada · tienda</div><div class="v"><span class="guideTrend78 '+guideTrend.cl+'">'+guideTrend.txt+'</span></div><div class="m">Julio frente a junio · distribución ajustada al total 3M</div></div>'
    +'<div class="guideSalesCard78"><div class="l">Producto líder · tienda</div><div class="v">'+(top?fi(top.units)+' u':'0 u')+'</div><div class="m">'+h(top?top.name:'Sin ventas')+(top?' · '+topShare.toLocaleString('es-CO',{maximumFractionDigits:1})+'% de la guía':'')+'</div></div>'
    +'<div class="guideSalesCard78"><div class="l">Productos con venta · tienda</div><div class="v">'+pct.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</div><div class="m">'+fi(withSale)+' con venta · '+fi(zero)+' sin venta</div></div>'
    +'</div>'
    +'<div class="guideSalesScope78"><span><b>Total real:</b> la venta de 3 meses proviene de la tienda seleccionada.</span><span><b>Gráfico cuadrado:</b> Mayo + Junio + Julio siempre suma exactamente la venta 3M de la tienda.</span></div>'
    +'<div class="guideSalesNote78"><b>Importante:</b> la fuente disponible no trae la venta mensual separada por tienda. Para conservar el gráfico, el total real de 3 meses de cada producto se distribuye de forma estimada usando el patrón mensual del producto en la red y se ajusta a números enteros. Esta distribución sirve para visualizar tendencia, pero no reemplaza una venta mensual real por tienda.</div>'
    +'</div>';
  var stats=body.querySelector('.guideModalStatsV48');if(stats)stats.insertAdjacentHTML('afterend',summary);

  body.querySelectorAll('.guideFloorTableV50').forEach(function(table){
    table.classList.add('guideSalesTable78');
    var hr=table.querySelector('thead tr');
    if(hr)hr.insertAdjacentHTML('beforeend',
      '<th class="guideSalesExtra78 num" title="Acumulado real de los últimos tres meses en la tienda seleccionada">Venta 3 meses · tienda</th>'+
      '<th class="guideSalesExtra78" title="Distribución estimada de la venta 3M de tienda. Mayo + Junio + Julio suma exactamente el total">Distribución 3M · tienda</th>'+
      '<th class="guideSalesExtra78" title="Variación estimada de julio frente a junio">Variación estimada</th>'+
      '<th class="guideSalesExtra78 num" title="Participación del producto dentro de las unidades vendidas de toda la guía en esta tienda">Participación guía · tienda</th>');
    table.querySelectorAll('tbody tr[data-product-code]').forEach(function(tr){
      var c=code(tr.dataset.productCode),s=sm[c]||{units:0,value:0},alloc=allocateStoreMonths86(s.units,month(c).u),tt=trend(alloc.vals),share=totalU?n(s.units)/totalU*100:0;
      tr.insertAdjacentHTML('beforeend',
        '<td class="guideSalesExtra78 guideSalesCell78 num"><b>'+fi(s.units)+' u</b><span>'+fm(s.value)+'</span></td>'+
        '<td class="guideSalesExtra78" title="'+h(alloc.basis)+'">'+bars(alloc.vals)+'</td>'+
        '<td class="guideSalesExtra78"><span class="guideTrend78 '+tt.cl+'">'+tt.txt+'</span><span class="guideEstimateHint86">Estimado</span></td>'+
        '<td class="guideSalesExtra78 num"><b>'+share.toLocaleString('es-CO',{maximumFractionDigits:1})+'%</b><div class="guideShare78"><i style="width:'+Math.min(100,share)+'%"></i></div></td>');
    });
  });
}
var baseOpen=window.openGuideDetailV49;if(typeof baseOpen==='function')window.openGuideDetailV49=function(c){window.__guideCode78=String(c);var out=baseOpen.apply(this,arguments);setTimeout(function(){enhanceGuide(c)},30);return out};window.openGuideDetailV48=window.openGuideDetailV49;
var baseRender=window.renderGuideDetailV49;if(typeof baseRender==='function')window.renderGuideDetailV49=function(){var out=baseRender.apply(this,arguments);setTimeout(function(){enhanceGuide(window.__guideCode78||'')},0);return out};
var baseSet=window.setView;if(typeof baseSet==='function')window.setView=function(v){var out=baseSet.apply(this,arguments);setTimeout(function(){if(typeof VIEW!=='undefined'&&VIEW==='traslados'){var c=document.getElementById('content');if(c){c.innerHTML=window.viewTraslados(st());drawTr()}}mark()},40);return out};
function mark(){window.LLAVERO_BUILD='V79';if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');if(document.title.indexOf('V79')<0)document.title=document.title.replace(/V\d+/,'V79');var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent=(chip.textContent||'Versión').replace(/V\d+$/,'V79')}
setTimeout(mark,100)
})();


/* ===== llavero-v79-script ===== */
(function(){
'use strict';
window.LLAVERO_BUILD='V79';
if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');
var AGE79=[
  {key:'all',label:'Todos'},
  {key:'0',label:'91–120'},
  {key:'1',label:'121–150'},
  {key:'2',label:'151–180'},
  {key:'3',label:'181–210'},
  {key:'4',label:'211–240'},
  {key:'5',label:'241–360'},
  {key:'6',label:'+360'}
];
function n79(v){var x=Number(v);return Number.isFinite(x)?x:0;}
function h79(v){try{return typeof esc==='function'?esc(v==null?'':String(v)):String(v==null?'':v);}catch(e){return String(v==null?'':v);}}
function i79(v){try{return typeof fInt==='function'?fInt(n79(v)):Math.round(n79(v)).toLocaleString('es-CO');}catch(e){return String(Math.round(n79(v)));}}
function m79(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(n79(v)):(typeof fMoney==='function'?fMoney(n79(v)):'$ '+Math.round(n79(v)).toLocaleString('es-CO'));}catch(e){return '$ '+Math.round(n79(v)).toLocaleString('es-CO');}}
function c79(v){try{return typeof safeCode==='function'?safeCode(v):String(v==null?'':v).trim();}catch(e){return String(v==null?'':v).trim();}}
function product79(c){try{return typeof productInfo==='function'?productInfo(c):(P&&P[c]||{});}catch(e){return (P&&P[c])||{};}}
function cc79(c){var x=String((P&&P[c]&&P[c].cc)||'').trim().toUpperCase();return x==='CORE'?'CORE':x==='COMPLEMENTO'?'COMPLEMENTO':'SIN CLASIFICACIÓN';}
function currentStore79(code){return (S&&S[code])||{};}
function historyDaily79(){try{return (typeof readDailyHistory==='function'?readDailyHistory():[]).slice().sort(function(a,b){return String(a.date).localeCompare(String(b.date));});}catch(e){return [];}}
function historyDetails79(){try{return (typeof readDetailHistory==='function'?readDetailHistory():[]).slice().sort(function(a,b){return String(a.date).localeCompare(String(b.date));});}catch(e){return [];}}
function ageLabel79(rank){var labels=(typeof LBL!=='undefined'&&Array.isArray(LBL))?LBL:['91-120','121-150','151-180','181-210','211-240','241-360','+360'];return labels[Number(rank)]||'Sin rango';}
function rangeModal79(title,subtitle,html){var modal=document.getElementById('rangeModal'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle'),body=document.getElementById('rangeModalBody');if(!modal||!body)return;if(tt)tt.textContent=title;if(ss)ss.textContent=subtitle||'';body.innerHTML=html;modal.classList.add('on');setTimeout(function(){installGenericFilters79(body);wireDetailRows79(body);},0);}
function classBadge79(c){var cc=cc79(c),cl=cc==='CORE'?'core':cc==='COMPLEMENTO'?'comp':'none';return '<span class="ccBadge68 '+cl+'">'+h79(cc)+'</span>';}
function statusBadge79(x){var cl=x==='Gestionado'?'managed':x==='Nuevo'?'new':x==='Persistente'?'persistent':'changed';return '<span class="v79StatusTag '+cl+'">'+h79(x)+'</span>';}
function salesMap79(store){var out={};(store.ventasProducto||[]).forEach(function(r){var c=c79(r&&r[0]);if(c)out[c]={value:n79(r&&r[1]),units:n79(r&&r[2])};});return out;}
function inventoryMap79(store){var out={};try{(typeof normalizeInventoryRows==='function'?normalizeInventoryRows(store):[]).forEach(function(r){out[c79(r.c)]={cendis:n79(r.dispCendis),stock:n79(r.stock),ranges:r.rangos||{}};});}catch(e){}return out;}
function mapState79(rows){var out={};(rows||[]).forEach(function(r){var c=c79(r&&r[0]);if(c)out[c]={c:c,u:n79(r&&r[1]),v:n79(r&&r[2]),age:n79(r&&r[3])};});return out;}
function detailPair79(storeCode,date){var all=historyDetails79(),idx=date?all.findIndex(function(x){return String(x.date)===String(date);}):all.length-1;if(idx<0)idx=all.length-1;return {current:all[idx]||null,previous:idx>0?all[idx-1]:null,currentDate:all[idx]&&all[idx].date,previousDate:idx>0&&all[idx-1]&&all[idx-1].date,currentStore:all[idx]&&all[idx].stores&&all[idx].stores[storeCode],previousStore:idx>0&&all[idx-1]&&all[idx-1].stores&&all[idx-1].stores[storeCode]};}
function unionCritical79(store){var r=mapState79(store&&store.rot),e=mapState79(store&&store.evac),out={};Object.keys(r).forEach(function(c){out[c]={c:c,u:r[c].u,v:r[c].v,age:r[c].age,condition:'ROTACIÓN'};});Object.keys(e).forEach(function(c){if(out[c]){out[c].u+=e[c].u;out[c].v+=e[c].v;out[c].condition='ROTACIÓN / EVACUACIÓN';}else out[c]={c:c,u:e[c].u,v:e[c].v,age:e[c].age,condition:'EVACUACIÓN'};});return out;}
function metricRows79(storeCode,metric,date){var pair=detailPair79(storeCode,date),curStore=pair.currentStore||{},prevStore=pair.previousStore||{},cur,prev;
  if(metric==='rot'||metric==='360'){cur=mapState79(curStore.rot);prev=mapState79(prevStore.rot);}
  else if(metric==='evac'){cur=mapState79(curStore.evac);prev=mapState79(prevStore.evac);}
  else{cur=unionCritical79(curStore);prev=unionCritical79(prevStore);}
  if(metric==='360'){Object.keys(cur).forEach(function(c){if(cur[c].age<6)delete cur[c];});Object.keys(prev).forEach(function(c){if(prev[c].age<6)delete prev[c];});}
  var keys=Array.from(new Set(Object.keys(cur).concat(Object.keys(prev)))),store=currentStore79(storeCode),sm=salesMap79(store),im=inventoryMap79(store),rows=[];
  keys.forEach(function(c){var a=prev[c],b=cur[c],activity=!a&&b?'Nuevo':a&&!b?'Gestionado':'Persistente';if(metric==='managed'&&activity!=='Gestionado')return;if(metric==='new'&&activity!=='Nuevo')return;if(metric==='persistent'&&activity!=='Persistente')return;if((metric==='rot'||metric==='evac')&&activity==='Persistente'&&a.u===b.u&&a.v===b.v)return;var p=product79(c),condition=(b&&b.condition)||(a&&a.condition)||(metric==='rot'||metric==='360'?'ROTACIÓN':metric==='evac'?'EVACUACIÓN':'CRÍTICO'),inv=im[c]||{},sale=sm[c]||{units:0,value:0};rows.push({c:c,p:p,cc:cc79(c),condition:condition,activity:activity,prevU:a?a.u:0,curU:b?b.u:0,prevV:a?a.v:0,curV:b?b.v:0,age:b?b.age:(a?a.age:-1),cendis:n79(inv.cendis||P&&P[c]&&P[c].dispCendis),salesU:sale.units,salesV:sale.value});});
  rows.sort(function(a,b){var order={Nuevo:0,Gestionado:1,Persistente:2};return order[a.activity]-order[b.activity]||Math.abs((b.curU-b.prevU))-Math.abs((a.curU-a.prevU))||b.curV-a.curV;});return {rows:rows,pair:pair};
}
function detailToolbar79(){return '<div class="v79DetailFilters" data-v79-toolbar><div class="v79Search">🔎<input type="search" data-v79-search placeholder="Buscar código, producto, categoría…"></div><select data-v79-class><option value="">Todas las clasificaciones</option><option>CORE</option><option>COMPLEMENTO</option><option>SIN CLASIFICACIÓN</option></select><select data-v79-condition><option value="">Rotación y Evacuación</option><option value="ROTACIÓN">ROTACIÓN</option><option value="EVACUACIÓN">EVACUACIÓN</option></select><select data-v79-activity><option value="">Todas las actividades</option><option>Gestionado</option><option>Nuevo</option><option>Persistente</option></select><select data-v79-age><option value="">Todos los rangos</option>'+AGE79.slice(1).map(function(a){return '<option value="'+a.key+'">'+a.label+'</option>';}).join('')+'</select><button type="button" data-v79-clear>Limpiar</button><span class="v79FilterCount" data-v79-count></span></div>';}
function detailTable79(rows,includeStore){var body=rows.map(function(r){var p=r.p||product79(r.c),delta=r.curU-r.prevU;return '<tr data-code="'+h79(r.c)+'" data-v79-row data-class="'+h79(r.cc)+'" data-condition="'+h79(r.condition)+'" data-activity="'+h79(r.activity)+'" data-age="'+h79(r.age)+'"><td><span class="code">'+h79(r.c)+'</span></td><td><b>'+h79(p.n||r.c)+'</b><div class="pageInteractiveHint">'+h79((p.cat||'—')+' · '+(p.lin||'—')+' · '+(p.sub||'—'))+'</div></td>'+(includeStore?'<td>'+h79(r.storeName||r.store||'—')+'</td>':'')+'<td>'+classBadge79(r.c)+'</td><td>'+h79(r.condition)+'</td><td>'+statusBadge79(r.activity)+'</td><td class="num">'+i79(r.prevU)+'</td><td class="num"><b>'+i79(r.curU)+'</b></td><td class="num"><b class="'+(delta<0?'perfGood':delta>0?'perfBad':'perfFlat')+'">'+(delta>0?'+':'')+i79(delta)+'</b></td><td>'+h79(ageLabel79(r.age))+'</td><td class="num">'+i79(r.cendis)+'</td><td class="num">'+i79(r.salesU)+' u<div class="pageInteractiveHint">'+m79(r.salesV)+'</div></td><td class="num">'+m79(r.curV)+'</td></tr>';}).join('');return detailToolbar79()+'<div class="twrap" style="max-height:62vh"><table class="v79DetailTable"><thead><tr><th>Código</th><th>Producto</th>'+(includeStore?'<th>Tienda</th>':'')+'<th>Clasificación</th><th>Condición</th><th>Actividad</th><th class="num">Uds. anterior</th><th class="num">Uds. actual</th><th class="num">Variación</th><th>Rango</th><th class="num">CENDIS</th><th class="num">Venta 3m</th><th class="num">Valor actual</th></tr></thead><tbody>'+body+'</tbody></table></div>';}
function installGenericFilters79(root){root=root||document.getElementById('rangeModalBody');if(!root)return;var table=root.querySelector('table'),toolbar=root.querySelector('[data-v79-toolbar]');if(!table)return;if(!toolbar){root.insertAdjacentHTML('afterbegin',detailToolbar79());toolbar=root.querySelector('[data-v79-toolbar]');}var rows=Array.from(table.querySelectorAll('tbody tr')).filter(function(r){return !r.querySelector('.empty');});rows.forEach(function(r){if(!r.hasAttribute('data-v79-row')){r.setAttribute('data-v79-row','');var txt=r.textContent||'';r.dataset.class=txt.indexOf('SIN CLASIFICACIÓN')>=0?'SIN CLASIFICACIÓN':txt.indexOf('COMPLEMENTO')>=0?'COMPLEMENTO':txt.indexOf('CORE')>=0?'CORE':'';r.dataset.condition=txt.toUpperCase().indexOf('EVACUACIÓN')>=0?'EVACUACIÓN':txt.toUpperCase().indexOf('ROTACIÓN')>=0?'ROTACIÓN':'';r.dataset.activity=txt.indexOf('Gestionado')>=0?'Gestionado':txt.indexOf('Nuevo')>=0?'Nuevo':txt.indexOf('Persistente')>=0?'Persistente':'';var age='';AGE79.slice(1).forEach(function(a){if(txt.indexOf(a.label.replace('–','-'))>=0||txt.indexOf(a.label)>=0)age=a.key;});r.dataset.age=age;}});
  function apply(){var q=String(toolbar.querySelector('[data-v79-search]')&&toolbar.querySelector('[data-v79-search]').value||'').toLowerCase(),cl=toolbar.querySelector('[data-v79-class]')&&toolbar.querySelector('[data-v79-class]').value||'',co=toolbar.querySelector('[data-v79-condition]')&&toolbar.querySelector('[data-v79-condition]').value||'',ac=toolbar.querySelector('[data-v79-activity]')&&toolbar.querySelector('[data-v79-activity]').value||'',ag=toolbar.querySelector('[data-v79-age]')&&toolbar.querySelector('[data-v79-age]').value||'',shown=0;rows.forEach(function(r){var ok=(!q||(r.textContent||'').toLowerCase().indexOf(q)>=0)&&(!cl||r.dataset.class===cl)&&(!co||(r.dataset.condition||'').indexOf(co)>=0)&&(!ac||r.dataset.activity===ac)&&(!ag||String(r.dataset.age)===String(ag));r.style.display=ok?'':'none';if(ok)shown++;});var cnt=toolbar.querySelector('[data-v79-count]');if(cnt)cnt.textContent=i79(shown)+' de '+i79(rows.length)+' resultados';}
  toolbar.querySelectorAll('input,select').forEach(function(el){el.oninput=apply;el.onchange=apply;});var clear=toolbar.querySelector('[data-v79-clear]');if(clear)clear.onclick=function(){toolbar.querySelectorAll('input').forEach(function(x){x.value='';});toolbar.querySelectorAll('select').forEach(function(x){x.value='';});apply();};apply();
}
function wireDetailRows79(root){(root||document).querySelectorAll('tr[data-code]').forEach(function(tr){if(tr.dataset.v79Wired)return;tr.dataset.v79Wired='1';tr.tabIndex=0;tr.setAttribute('role','button');var open=function(e){if(e&&e.target.closest('button,a,input,select'))return;var c=tr.dataset.code;if(c&&typeof openInventoryProduct==='function')openInventoryProduct(c);};tr.onclick=open;tr.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(e);}};});}
window.openStoreDailyDetail79=function(storeCode,metric,date){var store=currentStore79(storeCode),name=store.name||storeCode;if(metric==='transfers'){var trs=Array.isArray(store.trDetalle)?store.trDetalle:[],sm=salesMap79(store);var rows=trs.map(function(x){var c=c79(x.codigo),p=product79(c),sale=sm[c]||{units:0,value:0};return '<tr data-code="'+h79(c)+'" data-v79-row data-class="'+h79(cc79(c))+'" data-condition="TRASLADO" data-activity="Pendiente"><td><b>'+h79(x.entrega||'—')+'</b></td><td><span class="code">'+h79(c)+'</span></td><td><b>'+h79(x.nombre||p.n||c)+'</b></td><td>'+classBadge79(c)+'</td><td class="num">'+i79(x.unidades)+'</td><td>'+h79(x.fechaEntrega||'—')+'</td><td>'+h79(x.statusGlobalPicking||'—')+'</td><td>'+h79(x.statusMovimiento||'—')+'</td><td class="num">'+i79(sale.units)+' u<div class="pageInteractiveHint">'+m79(sale.value)+'</div></td></tr>';}).join('');rangeModal79('Traslados pendientes · '+name,'Órdenes y productos con destino a la tienda',detailToolbar79()+'<div class="twrap"><table class="v79DetailTable"><thead><tr><th>Orden</th><th>Código</th><th>Producto</th><th>Clasificación</th><th class="num">Unidades</th><th>Entrega estimada</th><th>Picking</th><th>Movimiento</th><th class="num">Venta 3m</th></tr></thead><tbody>'+rows+'</tbody></table></div>');return;}
  var data=metricRows79(storeCode,metric,date),rows=data.rows,titles={managed:'Productos gestionados',persistent:'Productos persistentes',new:'Nuevos productos críticos',rot:'Variación de Rotación',evac:'Variación de Evacuación','360':'Productos con más de 360 días'};var prevU=rows.reduce(function(a,r){return a+r.prevU;},0),curU=rows.reduce(function(a,r){return a+r.curU;},0),value=rows.reduce(function(a,r){return a+r.curV;},0);var cards='<div class="v79ActivityGrid"><div class="v79ActivityKpi"><label>Productos</label><b>'+i79(rows.length)+'</b><small>Resultado del filtro</small></div><div class="v79ActivityKpi"><label>Unidades anteriores</label><b>'+i79(prevU)+'</b><small>'+h79(data.pair.previousDate||'Sin referencia')+'</small></div><div class="v79ActivityKpi"><label>Unidades actuales</label><b>'+i79(curU)+'</b><small>'+h79(data.pair.currentDate||date||'Corte actual')+'</small></div><div class="v79ActivityKpi"><label>Variación neta</label><b>'+(curU-prevU>0?'+':'')+i79(curU-prevU)+'</b><small>Unidades</small></div><div class="v79ActivityKpi"><label>Valor actual</label><b>'+m79(value)+'</b><small>Inventario involucrado</small></div></div>';rangeModal79((titles[metric]||'Detalle diario')+' · '+name,'Actividad entre '+h79(data.pair.previousDate||'línea base')+' y '+h79(data.pair.currentDate||date||'corte actual'),cards+detailTable79(rows,false));
};
function storeTrendData79(code){return historyDaily79().map(function(s,i){var m=s.stores&&s.stores[code];if(!m)return null;return {date:s.date,rotRecovery:i===0?0:n79(m.rot&&m.rot.reductionAdj),evacRecovery:i===0?0:n79(m.evac&&m.evac.reductionAdj),isBase:i===0};}).filter(Boolean);}
function trendChart79(data,storeCode){if(!data.length)return '<div class="empty">Sin historial disponible.</div>';var W=Math.max(760,120+data.length*190),H=285,p={l:62,r:42,t:48,b:54},vals=[];data.forEach(function(d){vals.push(n79(d.rotRecovery),n79(d.evacRecovery));});var min=Math.min.apply(null,vals.concat([0])),max=Math.max.apply(null,vals.concat([0])),spread=Math.max(.8,max-min),margin=Math.max(.35,spread*.22),lo=Math.min(-.15,min-margin*.35),hi=max+margin;if(hi-lo<1.2)hi=lo+1.2;function x(i){return p.l+(W-p.l-p.r)*(data.length===1?.5:i/(data.length-1));}function y(v){return p.t+(H-p.t-p.b)*(hi-n79(v))/(hi-lo);}function path(k){return data.map(function(d,i){return (i?'L':'M')+x(i).toFixed(1)+','+y(d[k]).toFixed(1);}).join(' ');}var ticks=[];for(var j=0;j<5;j++)ticks.push(lo+(hi-lo)*j/4);var grid=ticks.map(function(v){return '<line x1="'+p.l+'" y1="'+y(v)+'" x2="'+(W-p.r)+'" y2="'+y(v)+'" stroke="var(--line2)"/><text x="'+(p.l-9)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="10" fill="var(--mut)">'+v.toFixed(1)+'%</text>';}).join('');var dates=data.map(function(d,i){return '<text x="'+x(i)+'" y="'+(H-16)+'" text-anchor="middle" font-size="10" font-weight="800" fill="var(--mut)">'+h79(String(d.date).slice(5).split('-').reverse().join('/'))+'</text>';}).join('');
  function points(k,color,position){return data.map(function(d,i){var v=n79(d[k]),cx=x(i),cy=y(v),isBase=i===0,txt=isBase?'Base 0%':v.toFixed(1)+'%',w=Math.max(50,txt.length*7+16),boxY=position==='up'?cy-31:cy+10,textY=position==='up'?cy-17:cy+25,click='openTrendDetail79('+JSON.stringify(d.date)+','+JSON.stringify(storeCode||'')+')';if(isBase&&k==='evacRecovery')return '';return '<g class="trendPoint79" tabindex="0" role="button" onclick="'+click+'" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();'+click+'}"><circle cx="'+cx+'" cy="'+cy+'" r="6" fill="'+color+'" stroke="var(--card)" stroke-width="2"></circle><rect class="trendLabelBox79" x="'+(cx-w/2)+'" y="'+boxY+'" width="'+w+'" height="22" rx="8" stroke="'+color+'"></rect><text class="trendLabelText79" x="'+cx+'" y="'+textY+'" text-anchor="middle" fill="'+color+'">'+txt+'</text><title>'+h79(d.date)+' · '+txt+'</title></g>';}).join('');}
  return '<div class="trendScroll79"><svg class="v79TrendSvg" viewBox="0 0 '+W+' '+H+'" style="width:'+W+'px">'+grid+'<line x1="'+p.l+'" y1="'+y(0)+'" x2="'+(W-p.r)+'" y2="'+y(0)+'" stroke="var(--mut)" stroke-width="1.5" stroke-dasharray="6 5"/><path d="'+path('rotRecovery')+'" fill="none" stroke="var(--rot)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="'+path('evacRecovery')+'" fill="none" stroke="var(--evac)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'+points('rotRecovery','var(--rot)','up')+points('evacRecovery','var(--evac)','down')+dates+'</svg></div><div class="trendLegend"><span><i style="background:var(--rot)"></i>Mejora Rotación</span><span><i style="background:var(--evac)"></i>Mejora Evacuación</span></div><div class="v79TrendNote">La escala se ajusta al rango real. Presiona cada punto para consultar gestionados, nuevos, persistentes, tiendas y rangos que explican el cambio.</div>';
}
window.managementTrendSvg=function(data){return trendChart79(data||[],null);};
window.rankChart=function(rows,key,color){var all=(rows||[]).slice().sort(function(a,b){return n79(b[key])-n79(a[key]);}),max=Math.max.apply(null,[1].concat(all.map(function(x){return n79(x[key]);}))),daily=historyDaily79(),cur=daily[daily.length-1],prev=daily[daily.length-2];return '<div class="rankChart v79AllStores">'+all.map(function(r,i){var cv=n79(r[key]),pv=n79(prev&&prev.stores&&prev.stores[r.code]&&prev.stores[r.code][key]),rel=pv?((cv-pv)/pv*100):(cv?100:0),flat=Math.abs(rel)<.05,good=rel<0,arrow=flat?'→':rel>0?'↑':'↓',cl=flat?'flat':good?'good':'bad';return '<div class="rankRow" tabindex="0" role="button" onclick="openStoreAudit59('+JSON.stringify(r.code)+')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openStoreAudit59('+JSON.stringify(r.code)+')}" title="Ver detalle de '+h79(r.name)+'"><div class="rankName" title="'+h79(r.name)+'">'+(i+1)+'. '+h79(r.name)+'</div><div class="rankTrack"><div class="rankFill" style="width:'+Math.max(1,cv/max*100)+'%;background:'+color+'"></div></div><div class="rankValue">'+cv.toFixed(1)+'%<span class="rankDelta79 '+cl+'">'+arrow+' '+Math.abs(rel).toFixed(1)+'%</span></div></div>';}).join('')+'</div>';};
function networkActivity79(date){var d=historyDaily79(),idx=d.findIndex(function(x){return String(x.date)===String(date);});if(idx<0)idx=d.length-1;var cur=d[idx],prev=idx>0?d[idx-1]:null,details=historyDetails79(),di=details.findIndex(function(x){return String(x.date)===String(cur&&cur.date);}),curDet=details[di],prevDet=di>0?details[di-1]:null,rows=[];
  if(curDet){Object.keys(curDet.stores||{}).forEach(function(code){var a=prevDet&&prevDet.stores&&prevDet.stores[code]||{},b=curDet.stores&&curDet.stores[code]||{},name=(cur.stores&&cur.stores[code]&&cur.stores[code].name)||code;['rot','evac'].forEach(function(stateName){var pm=mapState79(a[stateName]),cm=mapState79(b[stateName]),keys=Array.from(new Set(Object.keys(pm).concat(Object.keys(cm))));keys.forEach(function(c){var x=pm[c],y=cm[c],activity=!x&&y?'Nuevo':x&&!y?'Gestionado':'Persistente';if(activity==='Persistente'&&x.u===y.u&&x.v===y.v)return;var p=product79(c),store=currentStore79(code),sm=salesMap79(store),im=inventoryMap79(store),sale=sm[c]||{units:0,value:0},inv=im[c]||{};rows.push({c:c,p:p,cc:cc79(c),condition:stateName==='rot'?'ROTACIÓN':'EVACUACIÓN',activity:activity,prevU:x?x.u:0,curU:y?y.u:0,prevV:x?x.v:0,curV:y?y.v:0,age:y?y.age:(x?x.age:-1),cendis:n79(inv.cendis||P&&P[c]&&P[c].dispCendis),salesU:sale.units,salesV:sale.value,store:code,storeName:name});});});});}
  var totals={managed:rows.filter(function(r){return r.activity==='Gestionado';}).length,newCount:rows.filter(function(r){return r.activity==='Nuevo';}).length,changed:rows.filter(function(r){return r.activity==='Persistente';}).length};var storeStats=Object.keys(cur&&cur.stores||{}).map(function(code){var m=cur.stores[code],p=prev&&prev.stores&&prev.stores[code];return {name:m.name||code,rot:n79(m.rot&&m.rot.reductionAdj),evac:n79(m.evac&&m.evac.reductionAdj),score:m.score,deltaScore:p&&p.score!=null&&m.score!=null?m.score-p.score:null};});storeStats.sort(function(a,b){return (b.deltaScore||0)-(a.deltaScore||0);});return {cur:cur,prev:prev,rows:rows,totals:totals,best:storeStats.slice(0,5),worst:storeStats.slice().reverse().slice(0,5)};
}
function rangeDelta79(rows,stateName){var out=Array(7).fill(0);rows.filter(function(r){return r.condition===stateName;}).forEach(function(r){var rank=Math.max(0,Math.min(6,n79(r.age)));out[rank]+=r.curU-r.prevU;});return out;}
window.openTrendDetail79=function(date,storeCode){if(storeCode){var name=currentStore79(storeCode).name||storeCode,rot=metricRows79(storeCode,'rot',date),ev=metricRows79(storeCode,'evac',date),rows=rot.rows.concat(ev.rows);rangeModal79('Actividad histórica · '+name,'Corte '+h79(date)+' frente al período anterior',detailTable79(rows,false));return;}var x=networkActivity79(date),cur=x.cur,prev=x.prev;if(!cur)return;var agg={rotManaged:0,rotNew:0,rotPersistent:0,evManaged:0,evNew:0,evPersistent:0,rotRed:0,evRed:0};Object.values(cur.stores||{}).forEach(function(m){agg.rotManaged+=n79(m.rot&&m.rot.recoveredCount);agg.rotNew+=n79(m.rot&&m.rot.newCount);agg.rotPersistent+=n79(m.rot&&m.rot.persistentCount);agg.evManaged+=n79(m.evac&&m.evac.recoveredCount);agg.evNew+=n79(m.evac&&m.evac.newCount);agg.evPersistent+=n79(m.evac&&m.evac.persistentCount);agg.rotRed+=n79(m.rot&&m.rot.reductionAdj);agg.evRed+=n79(m.evac&&m.evac.reductionAdj);});var rd=rangeDelta79(x.rows,'ROTACIÓN'),ed=rangeDelta79(x.rows,'EVACUACIÓN');var cards='<div class="v79ActivityGrid"><div class="v79ActivityKpi"><label>Gestionados Rotación</label><b>'+i79(agg.rotManaged)+'</b><small>'+i79(agg.rotNew)+' nuevos</small></div><div class="v79ActivityKpi"><label>Gestionados Evacuación</label><b>'+i79(agg.evManaged)+'</b><small>'+i79(agg.evNew)+' nuevos</small></div><div class="v79ActivityKpi"><label>Persistentes Rotación</label><b>'+i79(agg.rotPersistent)+'</b><small>Continúan críticos</small></div><div class="v79ActivityKpi"><label>Persistentes Evacuación</label><b>'+i79(agg.evPersistent)+'</b><small>Continúan críticos</small></div><div class="v79ActivityKpi"><label>Productos con movimiento</label><b>'+i79(x.rows.length)+'</b><small>Entradas, salidas o cambios</small></div></div>';var why='<div class="v79WhyGrid"><div class="v79WhyBox"><h4>Variación por rango de antigüedad</h4>'+AGE79.slice(1).map(function(a,i){return '<div class="v79WhyRow"><span>'+a.label+'</span><b>Rot. '+(rd[i]>0?'+':'')+i79(rd[i])+' · Evac. '+(ed[i]>0?'+':'')+i79(ed[i])+'</b></div>';}).join('')+'</div><div class="v79WhyBox"><h4>Tiendas que más explican el cambio de puntaje</h4>'+x.best.map(function(s){return '<div class="v79WhyRow"><span>'+h79(s.name)+'</span><b>'+(s.deltaScore==null?'—':(s.deltaScore>0?'+':'')+s.deltaScore)+' pts</b></div>';}).join('')+'<h4 style="margin-top:12px">Mayor deterioro</h4>'+x.worst.map(function(s){return '<div class="v79WhyRow"><span>'+h79(s.name)+'</span><b>'+(s.deltaScore==null?'—':(s.deltaScore>0?'+':'')+s.deltaScore)+' pts</b></div>';}).join('')+'</div></div>';rangeModal79('Detalle del corte '+date,'Actividad que explica la variación frente a '+h79(prev&&prev.date||'línea base'),cards+why+detailTable79(x.rows,true));};
window.openTrendPoint59=function(date){window.openTrendDetail79(date,'');};
window.storeDailyManagementPanel=function(code){var daily=historyDaily79(),snap=daily[daily.length-1],m=snap&&snap.stores&&snap.stores[code];if(!m)return '';if(!m.hasPrevious)return '<div class="card"><div class="chead"><div class="cnum n3">D</div><div><div class="tt">Seguimiento diario de gestión</div><div class="ds">Comparación por tienda y producto</div></div></div><div class="cbody"><div class="baselineBox"><b>Este corte es la línea base</b>El siguiente corte mostrará gestionados, persistentes, nuevos y variaciones.</div></div></div>';function mini(prev,cur){prev=n79(prev);cur=n79(cur);var delta=cur-prev,rel=prev?Math.abs(delta)/prev*100:(cur?100:0),cl=Math.abs(delta)<.001?'flat':delta<0?'good':'bad',arrow=Math.abs(delta)<.001?'→':delta<0?'↓':'↑',mx=Math.max(1,prev,cur);return '<div class="dailyTrend74"><div class="dailyTrendTop"><span class="v74Delta '+cl+'">'+arrow+' '+rel.toFixed(1)+'%</span><small>'+i79(prev)+' → '+i79(cur)+' productos</small></div><div class="dailyTrendBars"><i style="width:'+Math.max(2,prev/mx*100)+'%"></i><b style="width:'+Math.max(2,cur/mx*100)+'%" class="'+cl+'"></b></div></div>';}
  function card(label,value,sub,metric,cls,trend){return '<div class="dailyMetric v74DailyMetric v79DailyMetric '+(cls||'')+'" role="button" tabindex="0" onclick="openStoreDailyDetail79('+JSON.stringify(code)+','+JSON.stringify(metric)+')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openStoreDailyDetail79('+JSON.stringify(code)+','+JSON.stringify(metric)+')}"><div class="dmLabel">'+label+'</div><div class="dmValue">'+value+'</div><div class="dmSub">'+sub+'</div>'+(trend||'')+'</div>';}
  var score=m.score,color=typeof scoreColor==='function'?scoreColor(score):'var(--brand)',chart=trendChart79(storeTrendData79(code),code);return '<div class="card"><div class="chead"><div class="cnum n3">D</div><div><div class="tt">Seguimiento diario de gestión</div><div class="ds">Productos y variaciones frente al corte '+h79(snap.previousDate||'anterior')+'</div></div><div class="rt">'+(typeof managementStatus==='function'?managementStatus(score):'')+'</div></div><div class="cbody"><div class="managementHero"><div class="scoreRing" style="--score:'+score+';--scoreColor:'+color+'"><strong>'+score+'</strong><small>DE 100</small></div><div class="managementExplain"><b>Lectura operativa:</b> selecciona cualquier tarjeta para consultar productos, clasificación, unidades, condición, CENDIS y ventas.</div></div><div class="dailyGrid v74DailyGrid">'+card('Gestionados',i79(m.critical.recoveredCount)+' productos',m79(m.critical.recoveredVal)+' dejaron el estado crítico','managed','metricPositive','')+card('Persistentes',i79(m.critical.persistentCount)+' productos',m79(m.critical.persistentVal)+' continúan críticos','persistent','','')+card('Nuevos críticos',i79(m.critical.newCount)+' productos',m79(m.critical.newVal)+' ingresaron al estado','new',m.critical.newCount?'metricNegative':'metricPositive','')+card('Rotación · variación',i79(m.rot.currentCount)+' productos',i79(m.rot.recoveredCount)+' gestionados · '+i79(m.rot.newCount)+' entraron','rot','',mini(m.rot.previousCount,m.rot.currentCount))+card('Evacuación · variación',i79(m.evac.currentCount)+' productos',i79(m.evac.recoveredCount)+' gestionados · '+i79(m.evac.newCount)+' entraron','evac','',mini(m.evac.previousCount,m.evac.currentCount))+card('+360 días',i79(m.rot360.currentCount)+' productos',i79(m.rot360.recoveredCount)+' gestionados · '+i79(m.rot360.newCount)+' entraron','360','',mini(m.rot360.previousCount,m.rot360.currentCount))+card('Traslados pendientes',i79(m.transfers.current)+' pendientes',i79(m.transfers.resolved)+' resueltos · '+i79(m.transfers.newCount)+' nuevos','transfers','',mini(m.transfers.previous,m.transfers.current))+'</div><div class="v79StoreTrendCard"><div class="v79StoreTrendHead"><div><b>Tendencia histórica de la tienda</b><span>Rotación y Evacuación por cada corte</span></div><span>Presiona un punto para ver su actividad</span></div>'+chart+'</div></div></div>';};
window.openCendisSummary71=function(mode){var st=currentStore79(CUR),rot=(typeof aggregateModuleProducts71==='function'?aggregateModuleProducts71('rot',st):[]),ev=(typeof aggregateModuleProducts71==='function'?aggregateModuleProducts71('evac',st):[]),rows=rot.map(function(r){r.module='rot';return r;}).concat(ev.map(function(r){r.module='evac';return r;})).filter(function(r){return mode==='with'?n79(r.cendis)>0:n79(r.cendis)<=0;});var body=rows.map(function(r){var ranges=Object.keys(r.ranges||{}).filter(function(k){return n79(r.ranges[k])>0;}).map(function(k){return '<span class="v79RangeChip">'+i79(r.ranges[k])+' u · '+h79(ageLabel79(k))+'</span>';}).join('');return '<tr data-code="'+h79(r.c)+'" data-v79-row data-class="'+h79(r.cc)+'" data-condition="'+(r.module==='rot'?'ROTACIÓN':'EVACUACIÓN')+'" data-age="'+h79(Object.keys(r.ranges||{}).find(function(k){return n79(r.ranges[k])>0;})||'')+'"><td>'+(r.module==='rot'?'ROTACIÓN':'EVACUACIÓN')+'</td><td><span class="code">'+h79(r.c)+'</span></td><td><b>'+h79(r.p.n)+'</b><div class="pageInteractiveHint">'+h79(r.p.cat+' · '+r.p.lin+' · '+r.p.sub)+'</div></td><td>'+classBadge79(r.c)+'</td><td>'+ranges+'</td><td class="num">'+i79(r.units)+'</td><td class="num">'+i79(r.cendis)+'</td><td class="num">'+i79(r.sales)+'</td><td class="num">'+m79(r.value)+'</td></tr>';}).join('');var summary='<div class="v79ActivityGrid"><div class="v79ActivityKpi"><label>Rotación</label><b>'+i79(rows.filter(function(r){return r.module==='rot';}).length)+'</b><small>productos</small></div><div class="v79ActivityKpi"><label>Evacuación</label><b>'+i79(rows.filter(function(r){return r.module==='evac';}).length)+'</b><small>productos</small></div><div class="v79ActivityKpi"><label>CORE</label><b>'+i79(rows.filter(function(r){return r.cc==='CORE';}).length)+'</b><small>productos</small></div><div class="v79ActivityKpi"><label>COMPLEMENTO</label><b>'+i79(rows.filter(function(r){return r.cc==='COMPLEMENTO';}).length)+'</b><small>productos</small></div><div class="v79ActivityKpi"><label>Unidades</label><b>'+i79(rows.reduce(function(a,r){return a+n79(r.units);},0))+'</b><small>inventario</small></div></div>';rangeModal79(mode==='with'?'Con respaldo en CENDIS':'Sin respaldo en CENDIS','Rotación y Evacuación · '+h79(st.name||CUR),summary+detailToolbar79()+'<div class="twrap"><table class="v79CendisTable"><thead><tr><th>Módulo</th><th>Código</th><th>Producto</th><th>Clasificación</th><th>Rangos 91+ días</th><th class="num">Uds.</th><th class="num">CENDIS</th><th class="num">Venta 3m</th><th class="num">Valor</th></tr></thead><tbody>'+body+'</tbody></table></div>');};
function moduleRowsFiltered79(module){var st=currentStore79(CUR),rows=typeof aggregateModuleProducts71==='function'?aggregateModuleProducts71(module,st):[],s=state[module]||(state[module]={q:'',f:'all',sort:'units',dir:-1}),q=String(s.q||'').toLowerCase(),age=String(s.age79||'all');if(s.f==='core')rows=rows.filter(function(r){return r.cc==='CORE';});else if(s.f==='comp')rows=rows.filter(function(r){return r.cc==='COMPLEMENTO';});else if(s.f==='none')rows=rows.filter(function(r){return r.cc!=='CORE'&&r.cc!=='COMPLEMENTO';});else if(s.f==='sr')rows=rows.filter(function(r){return n79(r.cendis)<=0;});else if(s.f==='cr')rows=rows.filter(function(r){return n79(r.cendis)>0;});else if(s.f==='crit')rows=rows.filter(function(r){return [3,4,5,6].some(function(k){return n79(r.ranges&&r.ranges[k])>0;});});else if(s.f==='a360')rows=rows.filter(function(r){return n79(r.ranges&&r.ranges[6])>0;});else if(s.f==='novta')rows=rows.filter(function(r){return n79(r.sales)<=0;});if(age!=='all')rows=rows.filter(function(r){return n79(r.ranges&&r.ranges[Number(age)])>0;});if(q)rows=rows.filter(function(r){return (r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub+' '+r.cc).toLowerCase().indexOf(q)>=0;});var key=s.sort||'units',dir=n79(s.dir)||-1;rows.sort(function(a,b){if(module==='evac'&&key==='units'&&((n79(a.cendis)<=0)!==(n79(b.cendis)<=0)))return n79(a.cendis)>0?1:-1;var av=key==='c'?a.c:key==='p'?a.p.n:key==='cendis'?a.cendis:key==='value'||key==='v'?a.value:key==='sales'?a.sales:key==='age'?Math.max.apply(null,Object.keys(a.ranges||{}).filter(function(k){return n79(a.ranges[k])>0;}).map(Number).concat([-1])):a.units,bv=key==='c'?b.c:key==='p'?b.p.n:key==='cendis'?b.cendis:key==='value'||key==='v'?b.value:key==='sales'?b.sales:key==='age'?Math.max.apply(null,Object.keys(b.ranges||{}).filter(function(k){return n79(b.ranges[k])>0;}).map(Number).concat([-1])):b.units;if(typeof av==='string')return av.localeCompare(bv)*dir;return (n79(av)-n79(bv))*dir;});return rows;}
function ageChipsTable79(ranges){var html=Object.keys(ranges||{}).filter(function(k){return n79(ranges[k])>0;}).map(function(k){return '<span class="v79RangeChip">'+i79(ranges[k])+' u · '+h79(ageLabel79(k))+'</span>';}).join('');return html||'<span class="v71AgeEmpty">Sin unidades 91+ días</span>';}
function moduleTable79(module,rows){var body=rows.map(function(r,i){return '<tr class="v71GeneralRow" tabindex="0" role="button" data-code="'+h79(r.c)+'"><td>'+((typeof imageThumb==='function')?imageThumb(r.c,'sm'):'')+'</td>'+(module==='evac'?'<td><span class="pri '+(n79(r.cendis)<=0?'top':'')+'">'+(i+1)+'</span></td>':'')+'<td><span class="code">'+h79(r.c)+'</span></td><td><div class="v71ProductName">'+h79(r.p.n)+'</div></td><td>'+classBadge79(r.c)+'</td><td><div class="v71Hierarchy">'+h79(r.p.cat)+'<br>'+h79(r.p.lin)+' · '+h79(r.p.sub)+'</div></td><td>'+ageChipsTable79(r.ranges)+'</td><td class="num"><b>'+i79(r.units)+'</b></td><td class="num">'+(n79(r.cendis)>0?'<span class="tag cr">'+i79(r.cendis)+' u</span>':'<span class="tag sr">SIN RESPALDO</span>')+'</td><td class="num"><b>'+m79(r.value)+'</b></td><td class="num">'+i79(r.sales)+'</td></tr>';}).join('');return '<div class="twrap"><table class="v71ModuleTable"><thead><tr><th>Imagen</th>'+(module==='evac'?'<th>#</th>':'')+'<th data-k="c">Código</th><th data-k="p">Producto</th><th>Clasificación</th><th>Jerarquía</th><th data-k="age">Unidades por rango</th><th class="num" data-k="units">Uds.</th><th class="num" data-k="cendis">CENDIS</th><th class="num" data-k="value">Valor</th><th class="num" data-k="sales">Venta 3m</th></tr></thead><tbody>'+body+'</tbody></table></div>';}
function ensureAgeToolbar79(module){var root=document.getElementById(module+'-tbl'),body=root&&root.closest('.cbody');if(!body)return;var bar=body.querySelector('.ageFilterBar79[data-module="'+module+'"]');if(!bar){bar=document.createElement('div');bar.className='ageFilterBar79';bar.dataset.module=module;bar.innerHTML='<span class="label">Rango de antigüedad</span>'+AGE79.map(function(a){return '<button type="button" data-age="'+a.key+'" onclick="setAgeFilter79('+JSON.stringify(module)+','+JSON.stringify(a.key)+')">'+a.label+'</button>';}).join('');var tbar=body.querySelector('.tbar');body.insertBefore(bar,tbar||root);}var current=String((state[module]&&state[module].age79)||'all');bar.querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.age===current);});}
window.setAgeFilter79=function(module,age){if(!state[module])state[module]={};state[module].age79=age;if(module==='rot')drawRot();else drawEvac();};
function drawModule79(module){var all=typeof aggregateModuleProducts71==='function'?aggregateModuleProducts71(module,currentStore79(CUR)):[],rows=moduleRowsFiltered79(module),el=document.getElementById(module+'-tbl');if(el)el.innerHTML=moduleTable79(module,rows);var cnt=document.getElementById(module+'-cnt');if(cnt)cnt.textContent='Mostrando '+i79(rows.length)+' de '+i79(all.length)+' productos · rango '+(AGE79.find(function(a){return a.key===String((state[module]&&state[module].age79)||'all');})||AGE79[0]).label;document.querySelectorAll('.chip.filt[data-q="'+module+'"]').forEach(function(ch){ch.classList.toggle('on',(state[module].f||'all')===ch.dataset.f);ch.onclick=function(){state[module].f=ch.dataset.f;drawModule79(module);};});if(el){el.querySelectorAll('tbody tr[data-code]').forEach(function(tr){tr.onclick=function(e){if(e.target.closest('button,a,input'))return;if(typeof openInventoryProduct==='function')openInventoryProduct(tr.dataset.code);};tr.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();if(typeof openInventoryProduct==='function')openInventoryProduct(tr.dataset.code);}};});el.querySelectorAll('th[data-k]').forEach(function(th){th.onclick=function(){var s=state[module],k=th.dataset.k;if(s.sort===k)s.dir*=-1;else{s.sort=k;s.dir=-1;}drawModule79(module);};});}ensureAgeToolbar79(module);if(typeof animateBars==='function')animateBars();}
window.drawRot=drawRot=function(){drawModule79('rot');};window.drawEvac=drawEvac=function(){drawModule79('evac');};
function fixSummaryTransfer79(){if(typeof VIEW==='undefined'||VIEW!=='resumen')return;document.querySelectorAll('#content .kpi').forEach(function(card){var lab=card.querySelector('.lab');if(lab&&lab.textContent.trim().toLowerCase().indexOf('traslados en camino')>=0){card.classList.add('v79SummaryTransferFix');card.onclick=function(){if(state&&state.tr){state.tr.f='all';state.tr.view78='delivery';}if(typeof gotoView==='function')gotoView('traslados');else if(typeof setView==='function')setView('traslados');};card.setAttribute('role','button');card.tabIndex=0;}});}
function fixTransferButtons79(){document.querySelectorAll('.transferSwitch78 button').forEach(function(b){var isDelivery=(state.tr&&state.tr.view78||'delivery')==='delivery';b.classList.toggle('on',(b.textContent.trim()==='Entregas'&&isDelivery)||(b.textContent.trim()==='Productos'&&!isDelivery));});document.querySelectorAll('.chip.filt[data-q="tr"]').forEach(function(b){b.classList.toggle('on',(state.tr&&state.tr.f||'all')===b.dataset.f);});}
var oldSetTransfer=window.setTransferView78;if(typeof oldSetTransfer==='function')window.setTransferView78=function(v){var out=oldSetTransfer.apply(this,arguments);setTimeout(fixTransferButtons79,0);return out;};
var oldDrawTr=window.drawTr;if(typeof oldDrawTr==='function')window.drawTr=drawTr=function(){var out=oldDrawTr.apply(this,arguments);setTimeout(fixTransferButtons79,0);return out;};
function makeClickable79(root){(root||document).querySelectorAll('[onclick],.kpi,.rankRow,.v71GeneralRow,.dailyMetric').forEach(function(el){if(el.classList.contains('v79Clickable'))return;if(typeof el.onclick==='function'||el.hasAttribute('onclick')){el.classList.add('v79Clickable');if(!el.hasAttribute('role'))el.setAttribute('role','button');if(!el.hasAttribute('tabindex'))el.tabIndex=0;}});}
function enhance79(){mark79();fixSummaryTransfer79();fixTransferButtons79();if(typeof VIEW!=='undefined'&&(VIEW==='rot'||VIEW==='evac'))ensureAgeToolbar79(VIEW);var rb=document.getElementById('rangeModalBody');if(rb&&document.getElementById('rangeModal')&&document.getElementById('rangeModal').classList.contains('on'))installGenericFilters79(rb);makeClickable79(document);}
function mark79(){window.LLAVERO_BUILD='V79';if(document.documentElement.getAttribute('data-llavero-build')!=='V79')document.documentElement.setAttribute('data-llavero-build','V79');var nextTitle=document.title.replace(/V\d+/,'V79').replace(/28\/07\/2026|29\/07\/2026/,'30/07/2026');if(document.title!==nextTitle)document.title=nextTitle;var chip=document.querySelector('.appVersionChip b');if(chip){var next=(chip.textContent||'Versión').replace(/V\d+$/,'V79');if(chip.textContent!==next)chip.textContent=next;}}
var oldRefresh=window.refresh;if(typeof oldRefresh==='function')window.refresh=function(){var out=oldRefresh.apply(this,arguments);setTimeout(enhance79,80);return out;};
var oldSetView=window.setView;if(typeof oldSetView==='function')window.setView=function(){var out=oldSetView.apply(this,arguments);setTimeout(enhance79,90);return out;};
var pending=false; /* V82: observador global V79 desactivado. */
setTimeout(function(){mark79();enhance79();},80);
})();


/* ===== llavero-v80-script ===== */
(function(){
'use strict';
var AGE80=[{k:'all',l:'Todos'},{k:'0',l:'91–120'},{k:'1',l:'121–150'},{k:'2',l:'151–180'},{k:'3',l:'181–210'},{k:'4',l:'211–240'},{k:'5',l:'241–360'},{k:'6',l:'+360'}];
function num(v){var x=Number(v);return Number.isFinite(x)?x:0}function text(v){return v==null?'':String(v)}function esc80(v){try{return typeof esc==='function'?esc(text(v)):text(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}catch(e){return text(v)}}
function int80(v){try{return typeof fInt==='function'?fInt(num(v)):Math.round(num(v)).toLocaleString('es-CO')}catch(e){return String(Math.round(num(v)))}}function money80(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(num(v)):'$ '+Math.round(num(v)).toLocaleString('es-CO')}catch(e){return '$ '+Math.round(num(v)).toLocaleString('es-CO')}}
function code80(v){try{return typeof safeCode==='function'?safeCode(v):text(v).trim()}catch(e){return text(v).trim()}}function product80(c){try{return (typeof productInfo==='function'?productInfo(c):(P&&P[c]))||{}}catch(e){return {}}}function store80(c){try{return (S&&S[c])||{}}catch(e){return {}}}
function cc80(c){var x=text((typeof P!=='undefined'&&P&&P[c]&&P[c].cc)||'').trim().toUpperCase();return x==='CORE'?'CORE':x==='COMPLEMENTO'?'COMPLEMENTO':'SIN CLASIFICACIÓN'}
function ccBadge80(c){var x=cc80(c),cl=x==='CORE'?'core':x==='COMPLEMENTO'?'comp':'none';return '<span class="ccBadge68 '+cl+'">'+esc80(x)+'</span>'}
function daily80(){try{return (typeof readDailyHistory==='function'?readDailyHistory():[]).slice().sort(function(a,b){return text(a.date).localeCompare(text(b.date))})}catch(e){return []}}function details80(){try{return (typeof readDetailHistory==='function'?readDetailHistory():[]).slice().sort(function(a,b){return text(a.date).localeCompare(text(b.date))})}catch(e){return []}}
function fmtDate80(d){var a=text(d).split('-');return a.length===3?a[2]+'/'+a[1]+'/'+a[0]:text(d)}function ageLabel80(i){return AGE80[Number(i)+1]?AGE80[Number(i)+1].l:'Sin rango'}
function ensureModal80(){if(document.getElementById('v80ModalBack'))return;var b=document.createElement('div');b.id='v80ModalBack';b.className='v80ModalBack';b.innerHTML='<div class="v80Modal" role="dialog" aria-modal="true"><div class="v80ModalHead"><div><h3 id="v80ModalTitle"></h3><p id="v80ModalSub"></p></div><button type="button" class="v80ModalClose" aria-label="Cerrar">×</button></div><div class="v80ModalBody" id="v80ModalBody"></div></div>';document.body.appendChild(b);b.querySelector('.v80ModalClose').onclick=closeModal80;b.addEventListener('click',function(e){if(e.target===b)closeModal80()});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&b.classList.contains('on'))closeModal80()})}
function closeModal80(){var b=document.getElementById('v80ModalBack');if(b)b.classList.remove('on')}
function openModal80(title,sub,html){ensureModal80();document.getElementById('v80ModalTitle').textContent=title;document.getElementById('v80ModalSub').textContent=sub||'';var body=document.getElementById('v80ModalBody');body.innerHTML=html;document.getElementById('v80ModalBack').classList.add('on');wireModal80(body)}
function toolbar80(opts){opts=opts||{};return '<div class="v80Filters" data-v80-toolbar><div class="search">🔎 <input type="search" data-v80-search placeholder="Buscar código, producto, tienda u orden…"></div>'+(opts.classification===false?'':'<select data-v80-class><option value="">Todas las clasificaciones</option><option>CORE</option><option>COMPLEMENTO</option><option>SIN CLASIFICACIÓN</option></select>')+(opts.condition===false?'':'<select data-v80-condition><option value="">Todas las condiciones</option><option value="ROTACIÓN">ROTACIÓN</option><option value="EVACUACIÓN">EVACUACIÓN</option><option value="SIN CONDICIÓN">SIN CONDICIÓN</option></select>')+(opts.activity===false?'':'<select data-v80-activity><option value="">Todas las actividades</option><option>Gestionado</option><option>Nuevo</option><option>Persistente</option><option>Pendiente</option><option>Entregado</option></select>')+(opts.age===false?'':'<select data-v80-age><option value="">Todos los rangos</option>'+AGE80.slice(1).map(function(a){return '<option value="'+a.k+'">'+a.l+'</option>'}).join('')+'</select>')+'<button type="button" data-v80-clear>Limpiar</button><span class="v80FilterCount" data-v80-count></span></div>'}
function wireModal80(root){var tb=root.querySelector('[data-v80-toolbar]'),table=root.querySelector('table');if(tb&&table){var rows=Array.from(table.querySelectorAll('tbody tr')).filter(function(r){return !r.classList.contains('detailRow')&&!r.querySelector('.empty')});function apply(){var q=text(tb.querySelector('[data-v80-search]')&&tb.querySelector('[data-v80-search]').value).toLowerCase(),cl=text(tb.querySelector('[data-v80-class]')&&tb.querySelector('[data-v80-class]').value),co=text(tb.querySelector('[data-v80-condition]')&&tb.querySelector('[data-v80-condition]').value),ac=text(tb.querySelector('[data-v80-activity]')&&tb.querySelector('[data-v80-activity]').value),ag=text(tb.querySelector('[data-v80-age]')&&tb.querySelector('[data-v80-age]').value),shown=0;rows.forEach(function(r){var ok=(!q||text(r.textContent).toLowerCase().indexOf(q)>=0)&&(!cl||r.dataset.class===cl)&&(!co||text(r.dataset.condition).indexOf(co)>=0)&&(!ac||text(r.dataset.activity).indexOf(ac)>=0)&&(!ag||text(r.dataset.age)===ag);r.style.display=ok?'':'none';if(ok)shown++});var c=tb.querySelector('[data-v80-count]');if(c)c.textContent=int80(shown)+' de '+int80(rows.length)+' resultados'}tb.querySelectorAll('input,select').forEach(function(x){x.addEventListener('input',apply);x.addEventListener('change',apply)});var clr=tb.querySelector('[data-v80-clear]');if(clr)clr.onclick=function(){tb.querySelectorAll('input').forEach(function(x){x.value=''});tb.querySelectorAll('select').forEach(function(x){x.value=''});apply()};apply()}
root.querySelectorAll('tr[data-code]').forEach(function(r){if(r.dataset.transferProduct==='1')return;r.tabIndex=0;r.setAttribute('role','button');var go=function(e){if(e&&e.target.closest('button,a,input,select'))return;var c=r.dataset.code;if(c&&typeof openInventoryProduct==='function')openInventoryProduct(c)};r.addEventListener('click',go);r.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go(e)}})})}
function kpi80(label,value,small,cls){return '<div class="v80Kpi"><label>'+esc80(label)+'</label><b class="'+(cls||'')+'">'+esc80(value)+'</b><small>'+esc80(small||'')+'</small></div>'}
function detailPair80(storeCode,date){var a=details80(),i=date?a.findIndex(function(x){return text(x.date)===text(date)}):a.length-1;if(i<0)i=a.length-1;return {cur:a[i]||null,prev:i>0?a[i-1]:null,curStore:a[i]&&a[i].stores&&a[i].stores[storeCode],prevStore:i>0&&a[i-1]&&a[i-1].stores&&a[i-1].stores[storeCode],curDate:a[i]&&a[i].date,prevDate:i>0&&a[i-1]&&a[i-1].date}}
function mapRows80(rows,condition){var o={};(rows||[]).forEach(function(r){var c=code80(r&&r[0]);if(c)o[c]={c:c,u:num(r&&r[1]),v:num(r&&r[2]),age:num(r&&r[3]),condition:condition}});return o}
function combined80(s){var r=mapRows80(s&&s.rot,'ROTACIÓN'),e=mapRows80(s&&s.evac,'EVACUACIÓN'),o={};Object.keys(r).forEach(function(c){o[c]=r[c]});Object.keys(e).forEach(function(c){if(o[c]){o[c]={c:c,u:Math.max(o[c].u,e[c].u),v:Math.max(o[c].v,e[c].v),age:Math.max(o[c].age,e[c].age),condition:'ROTACIÓN / EVACUACIÓN'}}else o[c]=e[c]});return o}
function salesMap80(s){var o={};(s&&s.ventasProducto||[]).forEach(function(r){var c=code80(r&&r[0]);if(c)o[c]={value:num(r&&r[1]),units:num(r&&r[2])}});return o}
function currentInvMap80(s){var o={};try{(typeof normalizeInventoryRows==='function'?normalizeInventoryRows(s):[]).forEach(function(r){o[code80(r.c)]={stock:num(r.stock),cendis:num(r.dispCendis),ranges:r.rangos||{}}})}catch(e){}return o}
function activityRows80(storeCode,date,metric){var p=detailPair80(storeCode,date),cur,prev;if(metric==='rot'||metric==='360'){cur=mapRows80(p.curStore&&p.curStore.rot,'ROTACIÓN');prev=mapRows80(p.prevStore&&p.prevStore.rot,'ROTACIÓN')}else if(metric==='evac'){cur=mapRows80(p.curStore&&p.curStore.evac,'EVACUACIÓN');prev=mapRows80(p.prevStore&&p.prevStore.evac,'EVACUACIÓN')}else{cur=combined80(p.curStore);prev=combined80(p.prevStore)}if(metric==='360'){Object.keys(cur).forEach(function(c){if(cur[c].age<6)delete cur[c]});Object.keys(prev).forEach(function(c){if(prev[c].age<6)delete prev[c]})}var st=store80(storeCode),sm=salesMap80(st),im=currentInvMap80(st),keys=Array.from(new Set(Object.keys(cur).concat(Object.keys(prev)))),rows=[];keys.forEach(function(c){var a=prev[c],b=cur[c],act=!a&&b?'Nuevo':a&&!b?'Gestionado':'Persistente';if(metric==='managed'&&act!=='Gestionado')return;if(metric==='new'&&act!=='Nuevo')return;if(metric==='persistent'&&act!=='Persistente')return;if((metric==='rot'||metric==='evac')&&act==='Persistente'&&a.u===b.u&&a.v===b.v)return;var pr=product80(c),inv=im[c]||{},sale=sm[c]||{};rows.push({c:c,p:pr,cc:cc80(c),condition:(b&&b.condition)||(a&&a.condition)||'CRÍTICO',activity:act,prevU:a?a.u:0,curU:b?b.u:0,prevV:a?a.v:0,curV:b?b.v:0,age:b?b.age:(a?a.age:-1),cendis:num(inv.cendis||P&&P[c]&&P[c].dispCendis),salesU:num(sale.units),salesV:num(sale.value)})});return {rows:rows,pair:p}}
function productRowsTable80(rows,includeStore){var body=rows.map(function(r){var delta=r.curU-r.prevU,cl=delta<0?'v80Pos':delta>0?'v80Neg':'v80Flat';return '<tr data-code="'+esc80(r.c)+'" data-class="'+esc80(r.cc)+'" data-condition="'+esc80(r.condition)+'" data-activity="'+esc80(r.activity)+'" data-age="'+esc80(r.age)+'"><td><span class="code">'+esc80(r.c)+'</span></td><td class="productCell"><b>'+esc80(r.p.n||r.c)+'</b><small>'+esc80((r.p.cat||'—')+' · '+(r.p.lin||'—')+' · '+(r.p.sub||'—'))+'</small></td>'+(includeStore?'<td class="storeCell">'+esc80(r.storeName||r.store||'—')+'</td>':'')+'<td>'+ccBadge80(r.c)+'</td><td>'+esc80(r.condition)+'</td><td>'+esc80(r.activity)+'</td><td class="num">'+int80(r.prevU)+'</td><td class="num"><b>'+int80(r.curU)+'</b></td><td class="num"><b class="'+cl+'">'+(delta>0?'+':'')+int80(delta)+'</b></td><td>'+esc80(ageLabel80(r.age))+'</td><td class="num">'+int80(r.cendis)+'</td><td class="num">'+int80(r.salesU)+' u<br><small>'+money80(r.salesV)+'</small></td><td class="num">'+money80(r.curV)+'</td></tr>'}).join('');return toolbar80({})+'<div class="v80TableWrap"><table class="v80Table"><thead><tr><th>Código</th><th>Producto</th>'+(includeStore?'<th>Tienda</th>':'')+'<th>Clasificación</th><th>Condición</th><th>Actividad</th><th class="num">Uds. anterior</th><th class="num">Uds. actual</th><th class="num">Variación</th><th>Rango</th><th class="num">CENDIS</th><th class="num">Venta 3m</th><th class="num">Valor actual</th></tr></thead><tbody>'+body+'</tbody></table></div>'}
window.openStoreDailyDetail79=window.openStoreDailyDetail80=function(storeCode,metric,date){var st=store80(storeCode),name=st.name||storeCode;if(metric==='transfers'){return openTransferKpi80('pending',storeCode)}var x=activityRows80(storeCode,date,metric),rows=x.rows,titles={managed:'Productos gestionados',persistent:'Productos persistentes',new:'Nuevos productos críticos',rot:'Variación de Rotación',evac:'Variación de Evacuación','360':'Productos con más de 360 días'},prevU=rows.reduce(function(a,r){return a+r.prevU},0),curU=rows.reduce(function(a,r){return a+r.curU},0),val=rows.reduce(function(a,r){return a+r.curV},0);openModal80((titles[metric]||'Detalle diario')+' · '+name,'Actividad entre '+(x.pair.prevDate||'línea base')+' y '+(x.pair.curDate||date||'corte actual'),'<div class="v80Kpis">'+kpi80('Productos',int80(rows.length),'Resultado del criterio')+kpi80('Unidades anteriores',int80(prevU),x.pair.prevDate||'Sin referencia')+kpi80('Unidades actuales',int80(curU),x.pair.curDate||'Corte actual')+kpi80('Variación neta',(curU-prevU>0?'+':'')+int80(curU-prevU),'Unidades',curU-prevU<=0?'v80Pos':'v80Neg')+kpi80('Valor actual',money80(val),'Inventario involucrado')+'</div>'+productRowsTable80(rows,false))}
function scoreContribution80(cur,prev){if(!cur||!prev)return null;if(cur.score!=null&&prev.score!=null)return num(cur.score)-num(prev.score);return (num(prev.rotPct)-num(cur.rotPct))*.55+(num(prev.evacPct)-num(cur.evacPct))*.45}
function trendActivity80(date,storeCode){var d=daily80(),idx=d.findIndex(function(x){return text(x.date)===text(date)});if(idx<0)return null;var cur=d[idx],prev=idx>0?d[idx-1]:null,stores=storeCode?[storeCode]:Object.keys(cur.stores||{}),rows=[],storeChanges=[];stores.forEach(function(sc){var x=activityRows80(sc,date,'critical');x.rows.forEach(function(r){r.store=sc;r.storeName=(cur.stores[sc]&&cur.stores[sc].name)||(S&&S[sc]&&S[sc].name)||sc;rows.push(r)});var cm=cur.stores&&cur.stores[sc],pm=prev&&prev.stores&&prev.stores[sc],delta=scoreContribution80(cm,pm);if(cm)storeChanges.push({code:sc,name:cm.name||sc,delta:delta,rot:num(cm.rotPct)-num(pm&&pm.rotPct),evac:num(cm.evacPct)-num(pm&&pm.evacPct)})});storeChanges.sort(function(a,b){return num(b.delta)-num(a.delta)});return {cur:cur,prev:prev,rows:rows,best:storeChanges.slice(0,5),worst:storeChanges.slice().sort(function(a,b){return num(a.delta)-num(b.delta)}).slice(0,5)}}
function rangeDelta80(date,storeCode,kind){var p=detailPair80(storeCode,date),a=mapRows80((p.prevStore||{})[kind]),b=mapRows80((p.curStore||{})[kind]),out=[0,0,0,0,0,0,0];Object.keys(a).forEach(function(c){out[Math.max(0,Math.min(6,a[c].age))]-=a[c].u});Object.keys(b).forEach(function(c){out[Math.max(0,Math.min(6,b[c].age))]+=b[c].u});return out}
function networkRange80(date,kind){var d=daily80(),idx=d.findIndex(function(x){return x.date===date}),out=[0,0,0,0,0,0,0];if(idx<0)return out;Object.keys(d[idx].stores||{}).forEach(function(sc){var r=rangeDelta80(date,sc,kind);r.forEach(function(v,i){out[i]+=v})});return out}
window.openTrendDetail79=window.openTrendDetail80=function(date,storeCode){var x=trendActivity80(date,storeCode||'' );if(!x)return;var cur=x.cur,prev=x.prev,storeName=storeCode&&((cur.stores[storeCode]&&cur.stores[storeCode].name)||storeCode),m=storeCode&&cur.stores[storeCode],rotRec=storeCode?num(m&&m.rot&&m.rot.reductionAdj):Object.values(cur.stores||{}).reduce(function(a,s){return a+num(s.rot&&s.rot.reductionAdj)},0),evRec=storeCode?num(m&&m.evac&&m.evac.reductionAdj):Object.values(cur.stores||{}).reduce(function(a,s){return a+num(s.evac&&s.evac.reductionAdj)},0),managed=x.rows.filter(function(r){return r.activity==='Gestionado'}),nuevo=x.rows.filter(function(r){return r.activity==='Nuevo'}),pers=x.rows.filter(function(r){return r.activity==='Persistente'}),rd=storeCode?rangeDelta80(date,storeCode,'rot'):networkRange80(date,'rot'),ed=storeCode?rangeDelta80(date,storeCode,'evac'):networkRange80(date,'evac');function list(arr){return arr.map(function(s){var v=s.delta,cl=v==null?'v80Flat':v>=0?'v80Pos':'v80Neg';return '<div class="v80WhyRow"><span>'+esc80(s.name)+'</span><b class="'+cl+'">'+(v==null?'0.0':(v>0?'+':'')+v.toFixed(1))+' pts</b></div>'}).join('')||'<div class="empty">Sin variación disponible.</div>'}var why='<div class="v80WhyGrid"><div class="v80Why"><h4>Variación por rango de antigüedad</h4>'+AGE80.slice(1).map(function(a,i){return '<div class="v80WhyRow"><span>'+a.l+'</span><b>Rot. '+(rd[i]>0?'+':'')+int80(rd[i])+' · Evac. '+(ed[i]>0?'+':'')+int80(ed[i])+'</b></div>'}).join('')+'</div><div class="v80Why"><h4>Tiendas que más explican la mejora</h4>'+list(x.best)+'<h4 style="margin-top:12px">Mayor deterioro</h4>'+list(x.worst)+'</div></div>';openModal80('Detalle del corte '+fmtDate80(date)+(storeName?' · '+storeName:''),'Actividad que explica la variación frente a '+(prev?fmtDate80(prev.date):'la línea base'),'<div class="v80Kpis">'+kpi80('Gestionados',int80(managed.length),'Productos que salieron')+kpi80('Nuevos críticos',int80(nuevo.length),'Productos que entraron')+kpi80('Persistentes',int80(pers.length),'Continúan críticos')+kpi80('Mejora Rotación',rotRec.toFixed(1)+'%','Reducción ajustada')+kpi80('Mejora Evacuación',evRec.toFixed(1)+'%','Reducción ajustada')+'</div>'+why+productRowsTable80(x.rows,true))}
window.openTrendPoint59=function(date){return window.openTrendDetail80(date,'')}
window.rankChart=function(rows,key,color){var all=(rows||[]).slice().sort(function(a,b){return num(b[key])-num(a[key])}),max=Math.max.apply(null,[1].concat(all.map(function(x){return num(x[key])}))),d=daily80(),cur=d[d.length-1],prev=d[d.length-2];return '<div class="rankChart v80AllStores">'+all.map(function(r,i){var cv=num(r[key]),pv=num(prev&&prev.stores&&prev.stores[r.code]&&prev.stores[r.code][key]),rel=pv?((cv-pv)/pv*100):(cv?100:0),good=rel<0,flat=Math.abs(rel)<.05,arrow=flat?'→':rel>0?'↑':'↓',cl=flat?'flat':good?'good':'bad';return '<div class="rankRow v80Clickable" data-store="'+esc80(r.code)+'" data-key="'+esc80(key)+'" tabindex="0" role="button" onclick="openStoreExposure80(\''+esc80(r.code)+'\',\''+esc80(key)+'\')"><div class="rankName" title="'+esc80(r.name)+'">'+(i+1)+'. '+esc80(r.name)+'</div><div class="rankTrack"><div class="rankFill" style="width:'+Math.max(1,cv/max*100)+'%;background:'+color+'"></div></div><div class="rankValue">'+cv.toFixed(1)+'%<span class="rankDelta79 '+cl+'">'+arrow+' '+Math.abs(rel).toFixed(1)+'%</span></div></div>'}).join('')+'</div>'}
window.openStoreExposure80=function(storeCode,key){var st=store80(storeCode),module=key==='rotPct'?'rot':'evac',label=module==='rot'?'Rotación':'Evacuación',rows=typeof aggregateModuleProducts71==='function'?aggregateModuleProducts71(module,st):[],d=daily80(),hist=d.map(function(s){var m=s.stores&&s.stores[storeCode];return m?{date:s.date,pct:num(m[key]),count:num(m[module]&&m[module].currentCount),value:num(m[module+'Val'])}:null}).filter(Boolean);var current=hist[hist.length-1]||{},previous=hist[hist.length-2]||{},detail=rows.map(function(r){return {c:r.c,p:r.p||product80(r.c),cc:r.cc||cc80(r.c),condition:label.toUpperCase(),activity:'Actual',prevU:0,curU:num(r.units),prevV:0,curV:num(r.value),age:Math.max.apply(null,Object.keys(r.ranges||{}).filter(function(k){return num(r.ranges[k])>0}).map(Number).concat([-1])),cendis:num(r.cendis),salesU:num(r.sales),salesV:0}});openModal80(label+' · '+esc80(st.name||storeCode),'Exposición actual e historial de la tienda','<div class="v80Kpis">'+kpi80('Exposición actual',num(current.pct).toFixed(1)+'%','Porcentaje del inventario')+kpi80('Corte anterior',num(previous.pct).toFixed(1)+'%',previous.date||'Sin referencia')+kpi80('Productos',int80(rows.length),'Referencias en '+label)+kpi80('Unidades',int80(rows.reduce(function(a,r){return a+num(r.units)},0)),'Inventario')+kpi80('Valor',money80(rows.reduce(function(a,r){return a+num(r.value)},0)),'Inventario expuesto')+'</div>'+productRowsTable80(detail,false))}
function trendData80(kind){var d=daily80();return d.map(function(s,i){var stores=Object.values(s.stores||{}),inv=stores.reduce(function(a,x){return a+num(x.inventory)},0),rotVal=stores.reduce(function(a,x){return a+num(x.rotVal)},0),evVal=stores.reduce(function(a,x){return a+num(x.evacVal)},0),rotRec=stores.reduce(function(a,x){return a+num(x.rot&&x.rot.reductionAdj)},0),evRec=stores.reduce(function(a,x){return a+num(x.evac&&x.evac.reductionAdj)},0);return {date:s.date,rotPct:inv?rotVal/inv*100:0,evacPct:inv?evVal/inv*100:0,rotRecovery:i===0?0:rotRec,evacRecovery:i===0?0:evRec,isBase:i===0}})}
function trendSvg80(kind){var data=trendData80(kind);if(!data.length)return '<div class="empty">Sin historial disponible.</div>';var k1=kind==='management'?'rotRecovery':'rotPct',k2=kind==='management'?'evacRecovery':'evacPct',W=Math.max(820,170*data.length+100),H=330,p={l:66,r:48,t:58,b:55},vals=[];data.forEach(function(d){vals.push(num(d[k1]),num(d[k2]))});var min=Math.min.apply(null,vals.concat([0])),max=Math.max.apply(null,vals.concat([0])),spread=Math.max(.5,max-min),margin=Math.max(.35,spread*.22),lo=kind==='management'?Math.min(-.2,min-margin*.25):Math.max(0,min-margin),hi=max+margin;if(hi-lo<1)hi=lo+1;function x(i){return p.l+(W-p.l-p.r)*(data.length===1?.5:i/(data.length-1))}function y(v){return p.t+(H-p.t-p.b)*(hi-num(v))/(hi-lo)}function path(k){return data.map(function(d,i){return (i?'L':'M')+x(i).toFixed(1)+','+y(d[k]).toFixed(1)}).join(' ')}var grid='';for(var j=0;j<5;j++){var v=lo+(hi-lo)*j/4,yy=y(v);grid+='<line x1="'+p.l+'" y1="'+yy+'" x2="'+(W-p.r)+'" y2="'+yy+'" stroke="var(--line2)"/><text x="'+(p.l-9)+'" y="'+(yy+4)+'" text-anchor="end" font-size="10" fill="var(--mut)">'+v.toFixed(1)+'%</text>'}function pts(k,color,up){return data.map(function(d,i){var v=num(d[k]),cx=x(i),cy=y(v),base=d.isBase,txt=base?'Base 0%':v.toFixed(1)+'%',w=Math.max(58,txt.length*7+18),by=up?cy-38:cy+14,ty=up?cy-23:cy+29;if(base&&k===k2)return '';return '<g class="v80TrendPoint" onclick="openTrendDetail80(\''+esc80(d.date)+'\',\'\')"><circle cx="'+cx+'" cy="'+cy+'" r="6" fill="'+color+'" stroke="var(--card)" stroke-width="2"></circle><rect class="v80Pill" x="'+(cx-w/2)+'" y="'+by+'" width="'+w+'" height="24" rx="9" stroke="'+color+'"></rect><text class="v80PillText" x="'+cx+'" y="'+ty+'" text-anchor="middle" fill="'+color+'">'+txt+'</text><title>'+esc80(d.date)+' · '+txt+'</title></g>'}).join('')}var dates=data.map(function(d,i){return '<text x="'+x(i)+'" y="'+(H-16)+'" text-anchor="middle" font-size="10" font-weight="800" fill="var(--mut)">'+fmtDate80(d.date).slice(0,5)+'</text>'}).join('');return '<div class="v80TrendScroll"><svg class="v80TrendSvg" viewBox="0 0 '+W+' '+H+'" style="width:'+W+'px">'+grid+(kind==='management'?'<line x1="'+p.l+'" y1="'+y(0)+'" x2="'+(W-p.r)+'" y2="'+y(0)+'" stroke="var(--mut)" stroke-dasharray="6 5"/>':'')+'<path d="'+path(k1)+'" fill="none" stroke="var(--rot)" stroke-width="4"/>'+pts(k1,'var(--rot)',true)+'<path d="'+path(k2)+'" fill="none" stroke="var(--evac)" stroke-width="4"/>'+pts(k2,'var(--evac)',false)+dates+'</svg></div><div class="trendLegend"><span><i style="background:var(--rot)"></i>'+(kind==='management'?'Mejora Rotación':'Rotación')+'</span><span><i style="background:var(--evac)"></i>'+(kind==='management'?'Mejora Evacuación':'Evacuación')+'</span></div><div class="dashboardNote">Presiona cualquier punto para consultar productos gestionados, nuevos, persistentes, tiendas y rangos que explican el cambio.</div>'}
window.trendSvg=function(){return trendSvg80('exposure')};window.managementTrendSvg=function(){return trendSvg80('management')};
function aggregateRows80(module){var st=store80(typeof CUR!=='undefined'?CUR:''),rows=typeof aggregateModuleProducts71==='function'?aggregateModuleProducts71(module,st):[],s=state[module]||(state[module]={q:'',f:'all',sort:'units',dir:-1}),q=text(s.q).toLowerCase(),age=text(s.age80||s.age79||'all');rows=rows.filter(function(r){if(s.f==='core'&&r.cc!=='CORE')return false;if(s.f==='comp'&&r.cc!=='COMPLEMENTO')return false;if(s.f==='none'&&(r.cc==='CORE'||r.cc==='COMPLEMENTO'))return false;if(s.f==='sr'&&num(r.cendis)>0)return false;if(s.f==='cr'&&num(r.cendis)<=0)return false;if(s.f==='crit'&&![3,4,5,6].some(function(k){return num(r.ranges&&r.ranges[k])>0}))return false;if(s.f==='a360'&&num(r.ranges&&r.ranges[6])<=0)return false;if(s.f==='novta'&&num(r.sales)>0)return false;if(age!=='all'&&num(r.ranges&&r.ranges[Number(age)])<=0)return false;if(q&&(r.c+' '+r.p.n+' '+r.p.cat+' '+r.p.lin+' '+r.p.sub+' '+r.cc).toLowerCase().indexOf(q)<0)return false;return true});var key=s.sort||'units',dir=num(s.dir)||-1;rows.sort(function(a,b){if(module==='evac'){var a360=num(a.ranges&&a.ranges[6])>0,b360=num(b.ranges&&b.ranges[6])>0;if(a360!==b360)return a360?-1:1;var asr=num(a.cendis)<=0,bsr=num(b.cendis)<=0;if(asr!==bsr)return asr?-1:1}var av=key==='c'?a.c:key==='p'?a.p.n:key==='cendis'?a.cendis:key==='value'||key==='v'?a.value:key==='sales'?a.sales:key==='age'?Math.max.apply(null,Object.keys(a.ranges||{}).filter(function(k){return num(a.ranges[k])>0}).map(Number).concat([-1])):a.units,bv=key==='c'?b.c:key==='p'?b.p.n:key==='cendis'?b.cendis:key==='value'||key==='v'?b.value:key==='sales'?b.sales:key==='age'?Math.max.apply(null,Object.keys(b.ranges||{}).filter(function(k){return num(b.ranges[k])>0}).map(Number).concat([-1])):b.units;if(typeof av==='string')return av.localeCompare(text(bv))*dir;return (num(av)-num(bv))*dir});return rows}
function thumb80(c){var p=product80(c),src=p.img||'';return '<span class="v80Thumb">'+(src?'<img src="'+esc80(src)+'" alt="">':'<span class="fallback">▧</span>')+'</span>'}
function ranges80(r){var h=Object.keys(r||{}).filter(function(k){return num(r[k])>0}).map(function(k){return '<span class="v79RangeChip">'+int80(r[k])+' u · '+ageLabel80(k)+'</span>'}).join('');return h||'<span class="v71AgeEmpty">Sin unidades 91+ días</span>'}
function renderModule80(module){var rows=aggregateRows80(module),all=typeof aggregateModuleProducts71==='function'?aggregateModuleProducts71(module,store80(CUR)):[],body=rows.map(function(r,i){return '<tr data-code="'+esc80(r.c)+'"><td class="v80RankCell">'+(module==='evac'?'<span class="v80Rank '+(num(r.ranges&&r.ranges[6])>0?'hot':'')+'">'+(i+1)+'</span>':'')+'</td><td class="v80ImageCell">'+thumb80(r.c)+'</td><td><span class="code">'+esc80(r.c)+'</span></td><td class="productCell"><b>'+esc80(r.p.n)+'</b></td><td>'+ccBadge80(r.c)+'</td><td class="productCell">'+esc80(r.p.cat)+'<br><small>'+esc80(r.p.lin+' · '+r.p.sub)+'</small></td><td>'+ranges80(r.ranges)+'</td><td class="num"><b>'+int80(r.units)+'</b></td><td class="num">'+(num(r.cendis)>0?'<span class="tag cr">'+int80(r.cendis)+' u</span>':'<span class="tag sr">SIN RESPALDO</span>')+'</td><td class="num">'+money80(r.value)+'</td><td class="num">'+int80(r.sales)+'</td></tr>'}).join(''),el=document.getElementById(module+'-tbl');if(el){el.innerHTML='<div class="v80TableWrap"><table class="v80Table v80ModuleTable"><thead><tr><th>#</th><th>Imagen</th><th data-k="c">Código</th><th data-k="p">Producto</th><th>Clasificación</th><th>Jerarquía</th><th data-k="age">Unidades por rango</th><th class="num" data-k="units">Uds.</th><th class="num" data-k="cendis">CENDIS</th><th class="num" data-k="value">Valor</th><th class="num" data-k="sales">Venta 3m</th></tr></thead><tbody>'+body+'</tbody></table></div>';wireModule80(module,el)}var cnt=document.getElementById(module+'-cnt');if(cnt)cnt.textContent='Mostrando '+int80(rows.length)+' de '+int80(all.length)+' productos · '+(module==='evac'?'prioridad +360 días y sin respaldo CENDIS':'rango '+(AGE80.find(function(a){return a.k===text((state[module]&&state[module].age80)||'all')})||AGE80[0]).l);ensureAge80(module)}
function wireModule80(module,root){root.querySelectorAll('tbody tr[data-code]').forEach(function(r){r.onclick=function(){if(typeof openInventoryProduct==='function')openInventoryProduct(r.dataset.code)}});root.querySelectorAll('th[data-k]').forEach(function(th){th.onclick=function(){var s=state[module],k=th.dataset.k;if(s.sort===k)s.dir*=-1;else{s.sort=k;s.dir=-1}renderModule80(module)}});document.querySelectorAll('.chip.filt[data-q="'+module+'"]').forEach(function(ch){ch.classList.toggle('on',(state[module].f||'all')===ch.dataset.f);ch.onclick=function(){state[module].f=ch.dataset.f;renderModule80(module)}})}
function ensureAge80(module){var root=document.getElementById(module+'-tbl'),cbody=root&&root.closest('.cbody');if(!cbody)return;var bar=cbody.querySelector('.v80AgeBar[data-module="'+module+'"]');if(!bar){cbody.querySelectorAll('.ageFilterBar79').forEach(function(x){x.remove()});bar=document.createElement('div');bar.className='v80AgeBar';bar.dataset.module=module;bar.innerHTML='<span>Rango de antigüedad</span>'+AGE80.map(function(a){return '<button type="button" data-age="'+a.k+'">'+a.l+'</button>'}).join('');var tb=cbody.querySelector('.tbar');cbody.insertBefore(bar,tb||root);bar.querySelectorAll('button').forEach(function(b){b.onclick=function(){window.setAgeFilter80(module,b.dataset.age)}})}var cur=text((state[module]&&state[module].age80)||'all');bar.querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.age===cur)})}
window.setAgeFilter80=window.setAgeFilter79=function(module,age){state[module]=state[module]||{};state[module].age80=age;state[module].age79=age;renderModule80(module)};window.drawRot=drawRot=function(){renderModule80('rot')};window.drawEvac=drawEvac=function(){renderModule80('evac')};
window.openCendisSummary71=function(mode){var st=store80(CUR),rot=typeof aggregateModuleProducts71==='function'?aggregateModuleProducts71('rot',st):[],ev=typeof aggregateModuleProducts71==='function'?aggregateModuleProducts71('evac',st):[],rows=rot.map(function(r){return Object.assign({},r,{module:'ROTACIÓN'})}).concat(ev.map(function(r){return Object.assign({},r,{module:'EVACUACIÓN'})})).filter(function(r){return mode==='with'?num(r.cendis)>0:num(r.cendis)<=0});var body=rows.map(function(r){var age=Object.keys(r.ranges||{}).filter(function(k){return num(r.ranges[k])>0}),maxAge=Math.max.apply(null,age.map(Number).concat([-1]));return '<tr data-code="'+esc80(r.c)+'" data-class="'+esc80(r.cc||cc80(r.c))+'" data-condition="'+r.module+'" data-age="'+maxAge+'"><td>'+r.module+'</td><td><span class="code">'+esc80(r.c)+'</span></td><td class="productCell"><b>'+esc80(r.p.n)+'</b><small>'+esc80(r.p.cat+' · '+r.p.lin+' · '+r.p.sub)+'</small></td><td>'+ccBadge80(r.c)+'</td><td>'+ranges80(r.ranges)+'</td><td class="num">'+int80(r.units)+'</td><td class="num">'+int80(r.cendis)+'</td><td class="num">'+int80(r.sales)+'</td><td class="num">'+money80(r.value)+'</td></tr>'}).join('');openModal80(mode==='with'?'Con respaldo en CENDIS':'Sin respaldo en CENDIS','Rotación y Evacuación · '+(st.name||CUR),'<div class="v80Kpis">'+kpi80('Rotación',int80(rows.filter(function(r){return r.module==='ROTACIÓN'}).length),'productos')+kpi80('Evacuación',int80(rows.filter(function(r){return r.module==='EVACUACIÓN'}).length),'productos')+kpi80('CORE',int80(rows.filter(function(r){return (r.cc||cc80(r.c))==='CORE'}).length),'productos')+kpi80('COMPLEMENTO',int80(rows.filter(function(r){return (r.cc||cc80(r.c))==='COMPLEMENTO'}).length),'productos')+kpi80('Unidades',int80(rows.reduce(function(a,r){return a+num(r.units)},0)),'inventario')+'</div>'+toolbar80({activity:false})+'<div class="v80TableWrap"><table class="v80Table"><thead><tr><th>Módulo</th><th>Código</th><th>Producto</th><th>Clasificación</th><th>Rangos</th><th class="num">Uds.</th><th class="num">CENDIS</th><th class="num">Venta 3m</th><th class="num">Valor</th></tr></thead><tbody>'+body+'</tbody></table></div>')}
function trRows80(storeCode){var s=store80(storeCode||CUR),sm=salesMap80(s),rot=new Set((s.rot||[]).map(function(r){return code80(r&&r[0])})),ev=new Set((s.evac||[]).map(function(r){return code80(r&&r[0])}));return (s.trDetalle||[]).map(function(x){var c=code80(x.codigo),p=product80(c),conds=[];if(rot.has(c))conds.push('ROTACIÓN');if(ev.has(c))conds.push('EVACUACIÓN');if(!conds.length)conds.push('SIN CONDICIÓN');return {delivery:text(x.entrega||'SIN IDENTIFICAR'),code:c,name:x.nombre||p.n||c,units:num(x.unidades),eta:x.fechaEntrega||'',pick:text(x.statusGlobalPicking||''),mov:text(x.statusMovimiento||''),review:text(x.revision||''),cc:cc80(c),conditions:conds,sale:sm[c]||{units:0,value:0}}})}
function trFiltered80(rows){var s=state.tr||(state.tr={}),q=text(s.q).toLowerCase(),f=s.f80||'all';return rows.filter(function(r){var delivered=r.pick.toUpperCase()==='C'&&r.mov.toUpperCase()==='C',pending=!delivered;if(f==='pending'&&!pending)return false;if(f==='delivered'&&!delivered)return false;if(f==='review'&&r.review.toUpperCase()!=='REVISAR')return false;if(q&&(r.delivery+' '+r.code+' '+r.name+' '+r.cc+' '+r.conditions.join(' ')).toLowerCase().indexOf(q)<0)return false;return true})}
function condTags80(r){return r.conditions.map(function(x){return '<span class="v80Condition '+(x==='ROTACIÓN'?'rot':x==='EVACUACIÓN'?'evac':'normal')+'">'+esc80(x)+'</span>'}).join('')}
function status80(r){var done=r.pick.toUpperCase()==='C'&&r.mov.toUpperCase()==='C';return '<span class="statusPill '+(done?'st-completado':'st-gestion')+'">'+(done?'Entregado':'Por entregar')+'</span>'}
function deliveryGroups80(rows){var g={};rows.forEach(function(r){(g[r.delivery]||(g[r.delivery]=[])).push(r)});return g}
function transferTable80(rows,view){if(view==='product'){var body=rows.map(function(r){return '<tr data-transfer-product="1" data-code="'+esc80(r.code)+'" data-class="'+esc80(r.cc)+'" data-condition="'+esc80(r.conditions.join(' / '))+'" data-activity="'+(r.pick.toUpperCase()==='C'&&r.mov.toUpperCase()==='C'?'Entregado':'Pendiente')+'" onclick="openTransferProduct80(\''+esc80(r.code)+'\')"><td><span class="v80DeliveryBadge">'+esc80(r.delivery)+'</span></td><td><span class="code">'+esc80(r.code)+'</span></td><td class="productCell"><b>'+esc80(r.name)+'</b></td><td>'+ccBadge80(r.code)+'</td><td>'+condTags80(r)+'</td><td class="num">'+int80(r.sale.units)+' u<br><small>'+money80(r.sale.value)+'</small></td><td class="num"><b>'+int80(r.units)+'</b></td><td>'+esc80(r.eta||'—')+'</td><td>'+status80(r)+'</td></tr>'}).join('');return '<div class="v80TableWrap"><table class="v80Table"><thead><tr><th>Orden</th><th>Código</th><th>Producto</th><th>Clasificación</th><th>Condición</th><th class="num">Venta 3m</th><th class="num">Uds. traslado</th><th>Entrega estimada</th><th>Estado</th></tr></thead><tbody>'+body+'</tbody></table></div>'}var g=deliveryGroups80(rows),body=Object.keys(g).sort().map(function(id){var a=g[id],unique=new Set(a.map(function(r){return r.code})),units=a.reduce(function(x,r){return x+r.units},0),critical=new Set(a.filter(function(r){return r.conditions.indexOf('SIN CONDICIÓN')<0}).map(function(r){return r.code})),delivered=a.every(function(r){return r.pick.toUpperCase()==='C'&&r.mov.toUpperCase()==='C'});return '<tr data-delivery="'+esc80(id)+'" data-activity="'+(delivered?'Entregado':'Pendiente')+'" onclick="openDelivery80(\''+esc80(id)+'\')"><td><span class="v80DeliveryBadge">'+esc80(id)+'</span></td><td class="num"><b>'+int80(unique.size)+'</b></td><td class="num"><b>'+int80(units)+'</b></td><td class="num">'+int80(critical.size)+'</td><td>'+esc80(a[0].eta||'—')+'</td><td>'+status80(a[0])+'</td><td>Ver productos →</td></tr>'}).join('');return '<div class="v80TableWrap"><table class="v80Table"><thead><tr><th>Orden de entrega</th><th class="num">Productos</th><th class="num">Unidades</th><th class="num">Críticos</th><th>Entrega estimada</th><th>Estado</th><th>Detalle</th></tr></thead><tbody>'+body+'</tbody></table></div>'}
window.setTransferView80=function(v){state.tr=state.tr||{};state.tr.view80=v;drawTr80()};window.setTransferFilter80=function(f){state.tr=state.tr||{};state.tr.f80=f;drawTr80()}
window.viewTraslados=function(){state.tr=state.tr||{};if(!state.tr.view80)state.tr.view80='delivery';if(!state.tr.f80)state.tr.f80='all';var all=trRows80(CUR),g=deliveryGroups80(all),units=all.reduce(function(a,r){return a+r.units},0),critical=new Set(all.filter(function(r){return r.conditions.indexOf('SIN CONDICIÓN')<0}).map(function(r){return r.code}));return '<div class="card"><div class="chead"><div class="cnum n3">⇄</div><div><div class="tt">Traslados por entrega y producto</div><div class="ds">Órdenes, productos, unidades, clasificación y condición crítica</div></div></div><div class="cbody"><div class="v80TransferKpis"><div class="v80TransferKpi" onclick="openTransferKpi80(\'deliveries\')"><label>Órdenes de entrega</label><b>'+int80(Object.keys(g).length)+'</b><small>Ver órdenes y productos</small></div><div class="v80TransferKpi" onclick="openTransferKpi80(\'products\')"><label>Productos / líneas</label><b>'+int80(all.length)+'</b><small>Ver productos y órdenes</small></div><div class="v80TransferKpi" onclick="openTransferKpi80(\'units\')"><label>Unidades en camino</label><b>'+int80(units)+'</b><small>Ver a qué productos pertenecen</small></div><div class="v80TransferKpi" onclick="openTransferKpi80(\'critical\')"><label>Productos críticos</label><b>'+int80(critical.size)+'</b><small>Rotación o Evacuación</small></div></div><div class="v80Switch"><span class="label">Mostrar por</span><button class="'+(state.tr.view80==='delivery'?'on':'')+'" onclick="setTransferView80(\'delivery\')">Entregas</button><button class="'+(state.tr.view80==='product'?'on':'')+'" onclick="setTransferView80(\'product\')">Productos</button><span class="label" style="margin-left:8px">Estado</span><button class="'+(state.tr.f80==='all'?'on':'')+'" onclick="setTransferFilter80(\'all\')">Todos</button><button class="'+(state.tr.f80==='pending'?'on':'')+'" onclick="setTransferFilter80(\'pending\')">Por entregar</button><button class="'+(state.tr.f80==='delivered'?'on':'')+'" onclick="setTransferFilter80(\'delivered\')">Entregados</button><button class="'+(state.tr.f80==='review'?'on':'')+'" onclick="setTransferFilter80(\'review\')">Por revisar</button></div><div class="tbar"><div class="tsearch">🔎 <input id="q-tr" value="'+esc80(state.tr.q||'')+'" placeholder="Buscar orden, código o producto" oninput="state.tr.q=this.value;drawTr80()"></div></div><div id="tr-tbl">'+transferTable80(trFiltered80(all),state.tr.view80)+'</div><div class="foot" id="tr-cnt"></div></div></div>'}
window.drawTr80=window.drawTr=drawTr=function(){var el=document.getElementById('tr-tbl');if(!el)return;var all=trRows80(CUR),rs=trFiltered80(all),view=state.tr&&state.tr.view80||'delivery';el.innerHTML=transferTable80(rs,view);var cnt=document.getElementById('tr-cnt');if(cnt)cnt.textContent=view==='delivery'?'Mostrando '+int80(Object.keys(deliveryGroups80(rs)).length)+' entregas con '+int80(rs.length)+' líneas':'Mostrando '+int80(rs.length)+' productos / líneas'}
window.openDelivery80=function(id,storeCode){var rows=trRows80(storeCode||CUR).filter(function(r){return r.delivery===id}),unique=new Set(rows.map(function(r){return r.code})),units=rows.reduce(function(a,r){return a+r.units},0),critical=new Set(rows.filter(function(r){return r.conditions.indexOf('SIN CONDICIÓN')<0}).map(function(r){return r.code}));openModal80('Orden de entrega '+id,'Productos, unidades y estado de la entrega','<div class="v80Kpis">'+kpi80('Productos',int80(unique.size),'referencias únicas')+kpi80('Líneas',int80(rows.length),'registros')+kpi80('Unidades',int80(units),'en la orden')+kpi80('Productos críticos',int80(critical.size),'Rotación o Evacuación')+kpi80('Destino',store80(storeCode||CUR).name||storeCode||CUR,'tienda')+'</div>'+toolbar80({age:false})+transferTable80(rows,'product'))}
window.openTransferProduct80=function(c,storeCode){var rows=trRows80(storeCode||CUR).filter(function(r){return r.code===c}),p=product80(c),units=rows.reduce(function(a,r){return a+r.units},0),orders=new Set(rows.map(function(r){return r.delivery}));openModal80((p.n||c)+' · '+c,'Órdenes y unidades asociadas al producto','<div class="v80Kpis">'+kpi80('Órdenes',int80(orders.size),'entregas relacionadas')+kpi80('Unidades',int80(units),'en traslado')+kpi80('Clasificación',cc80(c),'producto')+kpi80('Venta 3 meses',int80(rows[0]&&rows[0].sale.units)+' u',money80(rows[0]&&rows[0].sale.value))+kpi80('Condición',rows[0]?rows[0].conditions.join(' / '):'—','en tienda destino')+'</div>'+toolbar80({classification:false,condition:false,age:false})+transferTable80(rows,'product'))}
window.openTransferKpi80=function(kind,storeCode){var rows=trRows80(storeCode||CUR);if(kind==='critical')rows=rows.filter(function(r){return r.conditions.indexOf('SIN CONDICIÓN')<0});if(kind==='pending')rows=rows.filter(function(r){return !(r.pick.toUpperCase()==='C'&&r.mov.toUpperCase()==='C')});var title={deliveries:'Órdenes de entrega',products:'Productos / líneas',units:'Unidades en camino',critical:'Productos críticos',pending:'Traslados pendientes'}[kind]||'Traslados',view=kind==='deliveries'?'delivery':'product',g=deliveryGroups80(rows),units=rows.reduce(function(a,r){return a+r.units},0),products=new Set(rows.map(function(r){return r.code}));openModal80(title+' · '+(store80(storeCode||CUR).name||storeCode||CUR),'Vista detallada de órdenes, productos y unidades','<div class="v80Kpis">'+kpi80('Órdenes',int80(Object.keys(g).length),'entregas')+kpi80('Productos',int80(products.size),'referencias únicas')+kpi80('Líneas',int80(rows.length),'registros')+kpi80('Unidades',int80(units),'en traslado')+kpi80('Críticos',int80(new Set(rows.filter(function(r){return r.conditions.indexOf('SIN CONDICIÓN')<0}).map(function(r){return r.code})).size),'Rotación o Evacuación')+'</div>'+toolbar80({age:false})+transferTable80(rows,view))}
function patchSummaryTransfer80(){document.querySelectorAll('#content .kpi').forEach(function(card){var lab=card.querySelector('.lab');if(lab&&lab.textContent.toLowerCase().indexOf('traslados en camino')>=0){card.onclick=function(){state.tr=state.tr||{};state.tr.f80='pending';state.tr.view80='delivery';if(typeof gotoView==='function')gotoView('traslados');else if(typeof setView==='function')setView('traslados')};card.classList.add('v80Clickable')}})}
function mark80(){window.LLAVERO_BUILD='V80';document.documentElement.setAttribute('data-llavero-build','V80');document.title=document.title.replace(/V\d+/,'V80').replace(/\d{2}\/07\/2026/,'31/07/2026');var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent=text(chip.textContent).replace(/V\d+$/,'V80')}
function enhance80(){mark80();patchSummaryTransfer80();if(typeof VIEW!=='undefined'&&(VIEW==='rot'||VIEW==='evac'))ensureAge80(VIEW);document.querySelectorAll('.rankRow[data-store],.v80TransferKpi,.v79DailyMetric').forEach(function(x){x.classList.add('v80Clickable')})}
var oldRefresh80=window.refresh;if(typeof oldRefresh80==='function')window.refresh=function(){var o=oldRefresh80.apply(this,arguments);setTimeout(enhance80,120);return o};var oldSetView80=window.setView;if(typeof oldSetView80==='function')window.setView=function(v){var o=oldSetView80.apply(this,arguments);setTimeout(function(){if(v==='rot')renderModule80('rot');else if(v==='evac')renderModule80('evac');else if(v==='traslados'){var c=document.getElementById('content');if(c){c.innerHTML=window.viewTraslados();drawTr80()}}enhance80()},120);return o};
setTimeout(function(){mark80();enhance80();},80);
})();


/* ===== LLAVERO V81 · OPTIMIZACION DE EJECUCION ===== */
(function v81RuntimeOptimization(){
  'use strict';
  window.LLAVERO_BUILD='V81';
  document.documentElement.setAttribute('data-llavero-app-version','V81');

  function optimizeImages(root){
    (root||document).querySelectorAll('img:not([data-v81-lazy])').forEach(function(img){
      img.dataset.v81Lazy='1';
      if(!img.hasAttribute('loading')) img.loading='lazy';
      if(!img.hasAttribute('decoding')) img.decoding='async';
      if(!img.hasAttribute('fetchpriority')) img.setAttribute('fetchpriority','low');
      img.addEventListener('error',function(){img.classList.add('image-error')},{once:true});
    });
  }
  function optimizeButtons(root){
    (root||document).querySelectorAll('button,[role="button"],.kpi,.mk,.rankRow').forEach(function(el){
      if(!el.hasAttribute('tabindex') && el.tagName!=='BUTTON') el.tabIndex=0;
      if(!el.hasAttribute('aria-label')){
        var txt=(el.textContent||'').trim().replace(/\s+/g,' ');
        if(txt) el.setAttribute('aria-label',txt.slice(0,160));
      }
    });
  }
  function optimize(root){optimizeImages(root);optimizeButtons(root);}
  var schedule=function(root){
    if('requestIdleCallback' in window) requestIdleCallback(function(){optimize(root);},{timeout:700});
    else setTimeout(function(){optimize(root);},40);
  };
  schedule(document);
  var mo=new MutationObserver(function(mutations){
    var root=null;
    for(var i=0;i<mutations.length;i++){
      if(mutations[i].addedNodes&&mutations[i].addedNodes.length){root=mutations[i].target;break;}
    }
    if(root) schedule(root);
  });
  /* V82: optimización aplicada por el render estable, sin observar todo el DOM. */

  var resizeRaf=0;
  window.addEventListener('resize',function(){
    cancelAnimationFrame(resizeRaf);
    resizeRaf=requestAnimationFrame(function(){
      document.documentElement.style.setProperty('--v81-vw',window.innerWidth+'px');
      document.dispatchEvent(new CustomEvent('llavero:optimized-resize',{detail:{width:window.innerWidth,height:window.innerHeight}}));
    });
  },{passive:true});

  window.addEventListener('pageshow',function(e){if(e.persisted&&typeof refreshAll==='function')requestAnimationFrame(refreshAll);});
})();


/* ===== LLAVERO V82 · RENDER ESTABLE, SIN DUPLICADOS Y CLICS FUNCIONALES ===== */
(function llaveroV82StableRuntime(){
  'use strict';
  window.LLAVERO_BUILD='V83';
  document.documentElement.setAttribute('data-llavero-build','V83');
  document.documentElement.setAttribute('data-llavero-app-version','V82');

  /* El historial oficial proviene de data/historial.json. No se usa localStorage como
     fuente principal porque puede contener cortes incompletos o de versiones anteriores. */
  var HISTORY82=(function(){try{var el=document.getElementById('embeddedHistory');return JSON.parse(el&&el.textContent||'{}')||{};}catch(err){console.warn('V82: historial no disponible',err);return {};}})();
  window.readDailyHistory=readDailyHistory=function(){return (Array.isArray(HISTORY82.daily)?HISTORY82.daily:[]).slice().sort(function(a,b){return String(a&&a.date||'').localeCompare(String(b&&b.date||''));});};
  window.readDetailHistory=readDetailHistory=function(){return (Array.isArray(HISTORY82.details)?HISTORY82.details:[]).slice().sort(function(a,b){return String(a&&a.date||'').localeCompare(String(b&&b.date||''));});};

  var AGE82=[
    {k:'all',l:'Todos'}, {k:'0',l:'91–120'}, {k:'1',l:'121–150'},
    {k:'2',l:'151–180'}, {k:'3',l:'181–210'}, {k:'4',l:'211–240'},
    {k:'5',l:'241–360'}, {k:'6',l:'+360'}
  ];
  var renderSeq82=0, searchTimers82={};
  function n82(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function s82(v){return v==null?'':String(v);}
  function e82(v){try{return typeof esc==='function'?esc(s82(v)):s82(v);}catch(_){return s82(v);}}
  function i82(v){try{return typeof fInt==='function'?fInt(n82(v)):Math.round(n82(v)).toLocaleString('es-CO');}catch(_){return String(Math.round(n82(v)));}}
  function m82(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(n82(v)):(typeof fMoney==='function'?fMoney(n82(v)):'$ '+Math.round(n82(v)).toLocaleString('es-CO'));}catch(_){return '$ '+Math.round(n82(v)).toLocaleString('es-CO');}}
  function store82(code){try{return (S&&S[code])||{};}catch(_){return {};}}
  function rows82(module){try{return typeof aggregateModuleProducts71==='function'?aggregateModuleProducts71(module,store82(CUR)):[];}catch(_){return [];}}
  function cc82(row){var x=s82(row&&row.cc||(P&&P[row&&row.c]&&P[row.c].cc)).trim().toUpperCase();return x==='CORE'?'CORE':x==='COMPLEMENTO'?'COMPLEMENTO':'SIN CLASIFICACIÓN';}
  function classStats82(rows,cc){var r=rows.filter(function(x){return cc82(x)===cc;});return {products:r.length,units:r.reduce(function(a,x){return a+n82(x.units);},0),value:r.reduce(function(a,x){return a+n82(x.value);},0)};}
  function rangeStats82(rows,rank,cc){var products=0,units=0;rows.forEach(function(r){if(cc&&cc82(r)!==cc)return;var q=n82(r.ranges&&r.ranges[rank]);if(q>0){products++;units+=q;}});return {products:products,units:units};}
  function classCard82(module,cc,stats){var cls=cc==='CORE'?'core':cc==='COMPLEMENTO'?'comp':'none';return '<button type="button" class="v82ClassCard '+cls+'" data-v82-class="'+e82(cc)+'" data-module="'+module+'"><div class="v82ClassHead"><span>'+e82(cc)+'</span><b>→</b></div><strong>'+i82(stats.units)+' unidades</strong><div class="v82ClassMetrics"><span><small>Productos</small><b>'+i82(stats.products)+'</b></span><span><small>Unidades</small><b>'+i82(stats.units)+'</b></span><span><small>Valor</small><b>'+m82(stats.value)+'</b></span></div></button>';}
  function charts82(module,rows){
    var vals=AGE82.slice(1).map(function(a){return {age:a,total:rangeStats82(rows,a.k),core:rangeStats82(rows,a.k,'CORE'),comp:rangeStats82(rows,a.k,'COMPLEMENTO')};});
    var maxTotal=Math.max.apply(null,[1].concat(vals.map(function(x){return x.total.units;})));
    var maxClass=Math.max.apply(null,[1].concat(vals.reduce(function(a,x){return a.concat([x.core.units,x.comp.units]);},[])));
    var total='<div class="v82Bars">'+vals.map(function(x){var h=Math.max(3,x.total.units/maxTotal*100);return '<div class="v82BarGroup"><b>'+i82(x.total.units)+' u</b><div class="v82BarWell"><button type="button" class="v82Bar total" style="height:'+h+'%" data-v82-age="'+x.age.k+'" data-v82-cc="ALL" data-module="'+module+'" title="'+x.age.l+': '+i82(x.total.products)+' productos · '+i82(x.total.units)+' unidades"></button></div><span>'+x.age.l+'</span><small>'+i82(x.total.products)+' prod.</small></div>';}).join('')+'</div>';
    var grouped='<div class="v82Bars grouped">'+vals.map(function(x){var hc=Math.max(3,x.core.units/maxClass*100),hp=Math.max(3,x.comp.units/maxClass*100);return '<div class="v82BarGroup"><div class="v82BarPair"><button type="button" class="v82Bar core" style="height:'+hc+'%" data-v82-age="'+x.age.k+'" data-v82-cc="CORE" data-module="'+module+'" title="CORE: '+i82(x.core.products)+' productos · '+i82(x.core.units)+' unidades"></button><button type="button" class="v82Bar comp" style="height:'+hp+'%" data-v82-age="'+x.age.k+'" data-v82-cc="COMPLEMENTO" data-module="'+module+'" title="COMPLEMENTO: '+i82(x.comp.products)+' productos · '+i82(x.comp.units)+' unidades"></button></div><span>'+x.age.l+'</span><small>'+i82(x.core.units)+' / '+i82(x.comp.units)+' u</small></div>';}).join('')+'</div><div class="v82ChartLegend"><span><i class="core"></i>CORE</span><span><i class="comp"></i>COMPLEMENTO</span></div>';
    return '<div class="v82ChartsGrid"><section class="v82ChartCard"><h4>'+(module==='rot'?'Rotación':'Evacuación')+' por rango de edad</h4><p>Total de productos y unidades en cada rango.</p>'+total+'</section><section class="v82ChartCard"><h4>Clasificación por rangos</h4><p>Comparativo CORE vs. COMPLEMENTO para cada antigüedad.</p>'+grouped+'</section></div>';
  }
  function ageBar82(module){return '<div class="v82AgeBar" data-module="'+module+'"><span>Rango de antigüedad</span>'+AGE82.map(function(a){return '<button type="button" data-age="'+a.k+'">'+a.l+'</button>';}).join('')+'</div>';}

  function redrawModule82(module){
    if(module==='rot'&&typeof drawRot==='function')drawRot();
    else if(module==='evac'&&typeof drawEvac==='function')drawEvac();
    decorateModule82(module);
  }
  window.setAgeFilter82=function(module,age){state[module]=state[module]||{};state[module].age80=age;state[module].age79=age;redrawModule82(module);};
  window.setAgeFilter80=window.setAgeFilter79=window.setAgeFilter82;

  function decorateModule82(module){
    var root=document.getElementById(module+'-tbl'),body=root&&root.closest('.cbody');if(!body)return;
    var rows=rows82(module),mk=body.querySelector('.mkpis');
    body.querySelectorAll('.ageFilterRow,.ageFilterBar79,.v80AgeBar,.v82AgeBar').forEach(function(x){x.remove();});
    var tbar=body.querySelector('.tbar');
    if(tbar){tbar.insertAdjacentHTML('beforebegin',ageBar82(module));}
    var bar=body.querySelector('.v82AgeBar');
    if(bar){var cur=s82((state[module]&&state[module].age80)||'all');bar.querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.age===cur);b.onclick=function(){window.setAgeFilter82(module,b.dataset.age);};});}

    body.querySelectorAll('.ccOverview68,[data-v70-class-grid],[data-v71-class-grid],.v74ClassWrap,.v75UnclassifiedRow,.v82ClassGrid').forEach(function(x){x.remove();});
    if(mk){var core=classStats82(rows,'CORE'),comp=classStats82(rows,'COMPLEMENTO'),none=classStats82(rows,'SIN CLASIFICACIÓN'),grid=document.createElement('div');grid.className='v82ClassGrid';grid.innerHTML=classCard82(module,'CORE',core)+classCard82(module,'COMPLEMENTO',comp)+classCard82(module,'SIN CLASIFICACIÓN',none);mk.insertAdjacentElement('afterend',grid);grid.querySelectorAll('[data-v82-class]').forEach(function(b){b.onclick=function(){if(typeof openClassDetail71==='function')openClassDetail71(module,b.dataset.v82Class);};});}

    var target=document.getElementById(module==='rot'?'cc-age-rot68':'cc-age-evac68');
    if(!target){target=document.createElement('div');target.id=module==='rot'?'cc-age-rot68':'cc-age-evac68';body.insertBefore(target,tbar||root);}
    target.innerHTML=charts82(module,rows);
    target.querySelectorAll('[data-v82-age]').forEach(function(b){b.onclick=function(){if(typeof openAgeRange74==='function')openAgeRange74(module,Number(b.dataset.v82Age),b.dataset.v82Cc);};});

    body.querySelectorAll('.chip.filt[data-q="'+module+'"]').forEach(function(ch){ch.onclick=function(){state[module]=state[module]||{};state[module].f=ch.dataset.f;redrawModule82(module);};});
    var q=body.querySelector('#q-'+module);if(q){q.oninput=function(){clearTimeout(searchTimers82[module]);state[module].q=q.value;searchTimers82[module]=setTimeout(function(){redrawModule82(module);},120);};}
  }

  function metricKey82(label){var t=s82(label).toLowerCase();if(t.indexOf('gestionados')>=0)return'managed';if(t.indexOf('persistentes')>=0)return'persistent';if(t.indexOf('nuevos')>=0)return'new';if(t.indexOf('rotación')>=0)return'rot';if(t.indexOf('evacuación')>=0)return'evac';if(t.indexOf('+360')>=0)return'360';if(t.indexOf('traslados')>=0)return'transfers';return'';}
  function ensureSummaryPanel82(){
    if(typeof VIEW==='undefined'||VIEW!=='resumen'||typeof window.storeDailyManagementPanel!=='function')return;
    var content=document.getElementById('content');if(!content)return;
    var current=content.querySelector('.v79StoreTrendCard');
    if(current){
      var currentCard=current.closest('.card'),trackingNow=content.querySelector('#storeTrackingPanel');
      if(currentCard&&trackingNow&&currentCard.nextElementSibling!==trackingNow)currentCard.insertAdjacentElement('afterend',trackingNow);
      return;
    }
    var cards=Array.from(content.querySelectorAll('.card'));
    var oldCard=cards.find(function(card){var tt=card.querySelector('.tt');return tt&&s82(tt.textContent).trim().toLowerCase()==='seguimiento diario de gestión';});
    /* V83: se conserva Seguimiento frente al corte. La optimizacion no debe retirar
       graficas ni comparativos que el usuario ya utilizaba en el Resumen de tienda. */
    var html='';try{html=window.storeDailyManagementPanel(CUR)||'';}catch(err){console.warn('V82: no se pudo construir el seguimiento diario',err);}
    if(!html)return;
    var box=document.createElement('div');box.innerHTML=html;var next=box.firstElementChild;if(!next)return;
    if(oldCard)oldCard.replaceWith(next);else content.insertAdjacentElement('afterbegin',next);
    var tracking=content.querySelector('#storeTrackingPanel');
    if(tracking)next.insertAdjacentElement('afterend',tracking);
  }
  function wireSummary82(){
    ensureSummaryPanel82();
    var panel=document.querySelector('.v79StoreTrendCard')&&document.querySelector('.v79StoreTrendCard').closest('.card');
    if(!panel)return;
    var code=CUR;
    panel.querySelectorAll('.v79DailyMetric,.v74DailyMetric').forEach(function(card){var metric=metricKey82(card.querySelector('.dmLabel')&&card.querySelector('.dmLabel').textContent);if(!metric)return;card.dataset.v82Metric=metric;card.onclick=function(ev){ev.preventDefault();ev.stopPropagation();if(typeof openStoreDailyDetail80==='function')openStoreDailyDetail80(code,metric);else if(typeof openStoreDailyDetail79==='function')openStoreDailyDetail79(code,metric);};card.onkeydown=function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();card.click();}};card.setAttribute('role','button');card.tabIndex=0;});
    var trend=panel.querySelector('.v79StoreTrendCard');if(trend&&!trend.dataset.v82Wired){trend.dataset.v82Wired='1';trend.addEventListener('click',function(ev){var g=ev.target.closest&&ev.target.closest('.trendPoint79,.v80TrendPoint');if(!g)return;ev.preventDefault();ev.stopPropagation();var title=g.querySelector('title'),date=title&&s82(title.textContent).split(' · ')[0];if(date&&typeof openTrendDetail80==='function')openTrendDetail80(date,code);else if(date&&typeof openTrendDetail79==='function')openTrendDetail79(date,code);},true);trend.addEventListener('keydown',function(ev){var g=ev.target.closest&&ev.target.closest('.trendPoint79,.v80TrendPoint');if(g&&(ev.key==='Enter'||ev.key===' ')){ev.preventDefault();g.dispatchEvent(new MouseEvent('click',{bubbles:true}));}},true);}
    panel.querySelectorAll('.trendPoint79,.v80TrendPoint').forEach(function(g){g.style.pointerEvents='all';g.setAttribute('role','button');g.setAttribute('tabindex','0');});
  }

  function wireDashboardTrends82(){document.querySelectorAll('.v80TrendPoint,.trendPoint79,.trendPoint59,.trendPointGroup65').forEach(function(g){g.style.pointerEvents='all';g.setAttribute('role','button');if(!g.hasAttribute('tabindex'))g.setAttribute('tabindex','0');});}
  function optimizeDom82(root){(root||document).querySelectorAll('img').forEach(function(img){if(!img.hasAttribute('loading'))img.loading='lazy';if(!img.hasAttribute('decoding'))img.decoding='async';});}
  function postRender82(v,seq){if(seq!==renderSeq82)return;if(v==='rot'||v==='evac')decorateModule82(v);if(v==='resumen')wireSummary82();if(v==='dashboard')wireDashboardTrends82();optimizeDom82(document.getElementById('content'));mark82();}

  function summaryHtml82(st){
    var html=viewResumen(st),tpl=document.createElement('template');tpl.innerHTML=html;
    /* V83: conservar el comparativo historico del Resumen de tienda. */
    return tpl.innerHTML;
  }
  function directSetView82(v){
    if(typeof isAuthenticated==='function'&&!isAuthenticated())return;
    if(v==='dashboard'&&!IS_LEADER)v='resumen';
    if(IS_ADMIN&&['vta','cli','dashboard'].indexOf(v)>=0)v='inventario';
    VIEW=v;setActiveNav(v);
    var st=S[CUR]||{name:'Tienda sin datos',kpi:{},rot:[],evac:[],ventas:[],ventasProducto:[],inventario:[],tr:[]},c=document.getElementById('content'),seq=++renderSeq82;
    try{
      if(v==='dashboard')c.innerHTML=viewLeaderDashboard();
      else if(v==='resumen')c.innerHTML=summaryHtml82(st);
      else if(v==='inventario'){c.innerHTML=viewInventario(st);drawInventario();}
      else if(v==='prox'){c.innerHTML=viewProx(st);drawProx();}
      else if(v==='rot'){c.innerHTML=viewRot(st);drawRot();}
      else if(v==='evac'){c.innerHTML=viewEvac(st);drawEvac();}
      else if(v==='amb'){c.innerHTML=viewAmb(st);drawTr();}
      else if(v==='traslados'){c.innerHTML=window.viewTraslados();if(typeof drawTr80==='function')drawTr80();else if(typeof drawTr==='function')drawTr();}
      else if(v==='vta'){c.innerHTML=viewVta(st);drawVta();}
      else if(v==='cli')c.innerHTML=viewCli(st);
      else if(v==='acciones'){c.innerHTML=viewAcciones();drawActions();}
      if(typeof animateBars==='function')animateBars();
      requestAnimationFrame(function(){postRender82(v,seq);});
    }catch(err){console.error('V82: error al construir la vista',v,err);c.innerHTML='<div class="card"><div class="cbody"><div class="hint">⚠ <span>No fue posible mostrar esta vista. Actualiza la página o valida el último JSON.</span></div></div></div>';}
  }
  function directRefresh82(){
    var st=S[CUR]||{name:'Tienda sin datos',kpi:{},rot:[],evac:[],ventas:[],tr:[]},k=st.kpi||{};
    var el=document.getElementById('fs');if(el)el.textContent=DB.meta.fecha||'—';el=document.getElementById('fsc');if(el)el.textContent=Object.keys(S).length;el=document.getElementById('fst');if(el)el.textContent=IS_LEADER&&VIEW==='dashboard'?'Todas las tiendas':s82(st.name||'Tienda sin datos');
    el=document.getElementById('nc-inv');if(el)el.textContent=i82((st.inventario||[]).filter(function(r){return n82(r.stock)>0;}).length||k.stockRefs);el=document.getElementById('nc-prox');if(el)el.textContent=i82(typeof upcomingRotationRows==='function'?upcomingRotationRows(st).length:0);el=document.getElementById('nc-rot');if(el)el.textContent=i82(k.rotN);el=document.getElementById('nc-evac');if(el)el.textContent=i82(k.evacN);el=document.getElementById('nc-amb');if(el)el.textContent=i82(k.trN);
    try{var visible=actionRows(),open=visible.filter(function(a){return a.status!=='Completado';}).length;el=document.getElementById('nc-act');if(el)el.textContent=i82(open);}catch(_){}
    var title=document.getElementById('heroTitle');if(title)title.textContent=IS_LEADER?'Hola, líder de área 👋':IS_ADMIN?'Hola, administrador de '+s82(st.name||'tienda')+' 👋':'Bienvenido a Llavero';var sub=document.getElementById('heroSub');if(sub)sub.innerHTML=IS_LEADER&&VIEW==='dashboard'?'Visión consolidada de <b>'+Object.keys(S).length+' tiendas</b> · corte '+e82(DB.meta&&DB.meta.fecha||'—'):'Gestión diaria de <b>'+e82(st.name||'Tienda sin nombre')+'</b> · corte '+e82(DB.meta&&DB.meta.fecha||'—');
    directSetView82(VIEW);
  }
  window.setView=setView=directSetView82;
  window.refresh=refresh=directRefresh82;

  /* Los botones V82 usan un único manejador directo; se evita la doble captura global. */
  document.addEventListener('keydown',function(ev){if(ev.key!=='Enter'&&ev.key!==' ')return;var card=ev.target.closest&&ev.target.closest('.v82ClassCard,.v79DailyMetric,.trendPoint79,.v80TrendPoint');if(card){ev.preventDefault();card.click();}},true);

  function mark82(){document.title=document.title.replace(/V\d+(?:(?: Optimizado)|(?: Estable)|(?: Corregida))*/,'V84 Corregida');var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent=s82(chip.textContent).replace(/V\d+(?: Estable| Corregida)?$/,'V84');window.LLAVERO_BUILD='V84';document.documentElement.setAttribute('data-llavero-build','V84');document.documentElement.setAttribute('data-llavero-app-version','V84');}
  document.documentElement.classList.add('v82-stabilizing');
  mark82();
  /* Los parches históricos programaban ajustes entre 0 y 120 ms. V82 espera a que
     terminen y realiza un único render definitivo para evitar parpadeos y duplicados. */
  setTimeout(function(){
    mark82();
    if(typeof isAuthenticated==='function'&&isAuthenticated())directRefresh82();
    requestAnimationFrame(function(){document.documentElement.classList.remove('v82-stabilizing');});
    /* Algunos componentes históricos programan mejoras después del render. Se vuelve a
       sellar la versión y los eventos una sola vez, sin reconstruir la vista. */
    setTimeout(function(){mark82();if(VIEW==='resumen')wireSummary82();if(VIEW==='rot'||VIEW==='evac')decorateModule82(VIEW);},260);
  },180);
})();

/* LLAVERO_BUILD_V84 · corrección de tablas y alcances comerciales · 2026-07-31 */


/* ===== LLAVERO V86 · gráficos comerciales ajustados al total real de tienda ===== */
(function(){
  function markV86(){
    window.LLAVERO_BUILD='V86';
    document.documentElement.setAttribute('data-llavero-build','V86');
    document.title=document.title.replace(/V\d+(?:\s+Corregida)?/,'V86');
    var chip=document.querySelector('.appVersionChip b');
    if(chip)chip.textContent=(chip.textContent||'31/07/2026 · V86').replace(/V\d+$/,'V86');
  }
  markV86();setTimeout(markV86,250);
})();
