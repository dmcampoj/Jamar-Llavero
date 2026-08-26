/* ==== llaveroV8620ViewsScript ==== */

/* ===== LLAVERO V86.20 · VISTAS ANALITICAS REALES ===== */
(function(){
  'use strict';
  if(window.__LLAVERO_V86_21_VIEWS__)return;
  window.__LLAVERO_V86_21_VIEWS__=true;

  var installed=false,base={},state={
    returnView:'resumen',returnScroll:0,
    territory:{zone:'all',department:'all',city:'all',store:'all',q:'',period:'daily',customFrom:'',customTo:'',analysisMode:'territory'},
    periodRows:[],visibleMetrics:[],visibleCodes:[]
  };
  var PERIODS={daily:{label:'Diario',days:1},weekly:{label:'Semanal',days:7},monthly:{label:'Mensual',days:30},quarterly:{label:'Trimestral',days:90}};

  function num(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function text(v){return v==null?'':String(v);}
  function esc(v){return text(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function int(v){try{return Math.round(num(v)).toLocaleString('es-CO');}catch(_){return String(Math.round(num(v)));}}
  function pct(v,d){return num(v).toFixed(d==null?1:d)+'%';}
  function money(v){
    try{if(typeof fMoneyCOP==='function')return fMoneyCOP(num(v));}catch(_){}
    try{if(typeof fMoney==='function')return fMoney(num(v));}catch(_){}
    return '$ '+Math.round(num(v)).toLocaleString('es-CO');
  }
  function dateObj(v){var d=new Date(text(v).slice(0,10)+'T00:00:00');return isNaN(d.getTime())?null:d;}
  function dateLabel(v){var p=text(v).slice(0,10).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:(v||'—');}
  function norm(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();}
  function currentView(){try{return typeof VIEW!=='undefined'?VIEW:'resumen';}catch(_){return 'resumen';}}
  function currentStore(){try{return typeof CUR!=='undefined'?CUR:'';}catch(_){return '';}}
  function stores(){try{return typeof S!=='undefined'?S:{};}catch(_){return {};}}
  function history(){try{return typeof readDailyHistory==='function'?readDailyHistory().slice().sort(function(a,b){return text(a.date).localeCompare(text(b.date));}):[];}catch(_){return [];}}
  function staticMetric(code){try{return typeof storeTerritoryMetric8618==='function'?storeTerritoryMetric8618(code):null;}catch(_){return null;}}
  function storeObj(code){var all=stores();return all[code]||{};}
  function sum(a,fn){return a.reduce(function(t,x){return t+num(fn(x));},0);}
  function avg(a,fn){var vals=a.map(fn).filter(function(x){return x!==null&&x!==undefined&&Number.isFinite(Number(x));}).map(Number);return vals.length?vals.reduce(function(x,y){return x+y;},0)/vals.length:null;}
  function deltaLabel(cur,prev,goodUp,suffix){if(cur==null||prev==null)return 'Sin base';var d=num(cur)-num(prev),a=Math.abs(d);if(a<.05)return '→ 0'+(suffix||'');var good=goodUp?d>0:d<0;return (d>0?'↑ ':'↓ ')+a.toFixed(suffix===' pp'||suffix===' pts'?1:0)+(suffix||'')+(good?' · mejora':' · alerta');}
  function keyActivate(el){if(!el||el.dataset.v8620Key==='1')return;el.dataset.v8620Key='1';if(!el.hasAttribute('tabindex'))el.tabIndex=0;if(!el.hasAttribute('role'))el.setAttribute('role','button');el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});}

  function markVersion(){
    try{
      document.documentElement.setAttribute('data-llavero-build','V86.50');
      document.documentElement.setAttribute('data-llavero-app-version','V86.50');
      document.documentElement.setAttribute('data-llavero-views','V86.50');
    }catch(_){}
    var nextTitle='Llavero · Inventarios Jamar · 05/08/2026 · V86.50';
    if(document.title!==nextTitle)document.title=nextTitle;
    var chip=document.querySelector('.appVersionChip b'),nextChip='05/08/2026 · V86.50';
    if(chip&&chip.textContent!==nextChip)chip.textContent=nextChip;
  }

  function watchVersion(){markVersion();}

  function detailShell(title,sub,body,badge){
    return '<div class="detailViewShell v8622DetailShell">'+body+'</div>';
  }
  function openDetail(title,sub,body,badge,returnView){
    var modal=document.getElementById('rangeModal'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle'),bd=document.getElementById('rangeModalBody');
    if(!modal||!bd)return;
    state.returnView=returnView||currentView()||'resumen';state.returnScroll=window.scrollY||0;
    if(tt)tt.textContent=title||'Vista detallada';
    if(ss)ss.textContent=(sub||'Información detallada')+(badge?' · '+badge:'');
    var card=modal.querySelector('.modal');if(card){card.classList.add('rangeModalWide','v8622UnifiedModal');}
    modal.dataset.detailKind=returnView==='markdown'?'inventory':returnView==='territorios'?'inventory':'inventory';
    bd.innerHTML=detailShell(title,sub,body,badge);
    modal.classList.add('on');bd.scrollTop=0;markVersion();
    setTimeout(function(){
      bd.querySelectorAll('tbody tr[onclick],.v8620RankRow[onclick],.v8620Metric[onclick]').forEach(keyActivate);
    },0);
  }
  function backDetail(){try{if(typeof closeRangeModal==='function')closeRangeModal();else document.getElementById('rangeModal')?.classList.remove('on');}catch(_){}}
  function section(title,sub,html){return '<section class="detailSection full v8622DetailSection"><div class="detailSectionTitle"><b>'+esc(title)+'</b>'+(sub?'<span>'+esc(sub)+'</span>':'')+'</div><div class="v8622DetailBody">'+html+'</div></section>';}
  function metric(label,value,sub,cls){return '<div class="rangeStat v8620Metric '+(cls||'')+'"><label>'+esc(label)+'</label><b>'+value+'</b><span>'+esc(sub||'')+'</span></div>';}


  /* ---------------------------------------------------------
     RESUMEN: restaura los cuatro cuadrantes operativos.
     --------------------------------------------------------- */
  function summaryCard(view,cls,icon,label,value,sub){
    var ico=cls==='k-evac'?'i-evac':cls==='k-amb'?'i-amb':cls==='k-vta'?'i-vta':'i-rot';
    return '<div class="kpi '+cls+'" data-v8622-view="'+esc(view)+'" role="button" tabindex="0" onclick="V8620.goView(\''+view+'\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();V8620.goView(\''+view+'\')}"><span class="v8620NavHint">Abrir módulo →</span><div class="top"><div class="ico '+ico+'">'+icon+'</div></div><div class="lab">'+esc(label)+'</div><div class="val">'+value+'</div><div class="sub">'+esc(sub)+'</div></div>';
  }
  function enhanceSummaryHtml(html,st){
    try{
      var tpl=document.createElement('template');tpl.innerHTML=html;var grid=tpl.content.querySelector('.kgrid');if(!grid)return html;
      var code=currentStore(),m=staticMetric(code)||{},s=st||storeObj(code),rot=Array.isArray(s.rot)?s.rot:[],evac=Array.isArray(s.evac)?s.evac:[],tr=Array.isArray(s.tr)?s.tr:[];
      var rotU=sum(rot,function(r){return r&&r[1];}),rotV=sum(rot,function(r){return r&&r[3];});
      var evacU=sum(evac,function(r){return r&&r[1];}),evacV=sum(evac,function(r){return r&&r[2];});
      var trU=sum(tr,function(r){return r&&r[2];}),trV=sum(tr,function(r){return r&&r[3];});
      grid.classList.add('v8620SummaryQuadrants');
      grid.innerHTML=summaryCard('rot','k-rot','⟳','Rotación pendiente',int(rot.length),int(rotU)+' uds · '+money(rotV))+
        summaryCard('evac','k-evac','⇲','Por evacuar',int(evac.length),int(evacU)+' uds · '+money(evacV))+
        summaryCard('amb','k-amb','▦','Ambientes / guías',int(m.guideComplete||0)+' / '+int(m.guides||0),pct(m.guideCoverage||0)+' de cobertura P1 + P2')+
        summaryCard('traslados','k-vta','⇄','Traslados en camino',int(m.transfers!=null?m.transfers:tr.length),int(trU)+' uds · '+num(trV).toFixed(2)+' m³');
      return tpl.innerHTML;
    }catch(err){console.error('V86.20 resumen',err);return html;}
  }

  /* ---------------------------------------------------------
     MARKDOWN: vistas detalladas y datos relevantes.
     --------------------------------------------------------- */
  function markdownRows(){try{return typeof mdRows8618==='function'?mdRows8618(currentStore()).slice():[];}catch(_){return [];}}
  function markdownFilter(kind){
    var rows=markdownRows();
    if(['actionable','manage','units','value','impact','weighted'].indexOf(kind)>=0)rows=rows.filter(function(r){return r.statusKey==='manage';});
    else if(kind==='comply')rows=rows.filter(function(r){return r.statusKey==='comply';});
    else if(kind==='exceed')rows=rows.filter(function(r){return r.statusKey==='exceed';});
    else if(kind==='review')rows=rows.filter(function(r){return r.statusKey==='review';});
    else if(kind==='older')rows=rows.filter(function(r){return r.actionable&&r.ageKey==='age_151_plus';});
    else if(kind==='last_unit')rows=rows.filter(function(r){return r.actionable&&r.typeKey==='fs_last';});
    else if(kind==='outside')rows=rows.filter(function(r){return r.actionable&&(r.typeKey==='fs'||r.typeKey==='fs_last');});
    else if(kind==='star')rows=rows.filter(function(r){return r.actionable&&r.typeKey==='star';});
    else if(kind==='rest')rows=rows.filter(function(r){return r.actionable&&r.typeKey==='rest';});
    else if(kind==='high')rows=rows.filter(function(r){return r.actionable&&num(r.discount)>=60;});
    else if(kind==='leader')rows=rows.filter(function(r){return r.actionable&&num(r.discount)>50;});
    else if(kind==='no_policy')rows=rows.filter(function(r){return r.statusKey==='no_policy';});
    else if(kind==='no_discount')rows=rows.filter(function(r){return r.noDiscount;});
    else if(kind==='rotation_group')rows=rows.filter(function(r){return r.actionable&&r.policyApplied==='Rotación';});
    else if(kind==='evacuation_group')rows=rows.filter(function(r){return r.actionable&&r.policyApplied==='Evacuación';});
    else if(kind==='age_exact_0_60')rows=rows.filter(function(r){return r.actionable&&mdAgeBucket8646(r.ageLabel)==='0-60';});
    else if(kind==='age_exact_61_90')rows=rows.filter(function(r){return r.actionable&&mdAgeBucket8646(r.ageLabel)==='61-90';});
    else if(kind==='age_exact_91_150')rows=rows.filter(function(r){return r.actionable&&mdAgeBucket8646(r.ageLabel)==='91-150';});
    else if(kind==='age_exact_151_180')rows=rows.filter(function(r){return r.actionable&&mdAgeBucket8646(r.ageLabel)==='151-180';});
    else if(kind==='age_exact_181_210')rows=rows.filter(function(r){return r.actionable&&mdAgeBucket8646(r.ageLabel)==='181-210';});
    else if(kind==='age_exact_211_240')rows=rows.filter(function(r){return r.actionable&&mdAgeBucket8646(r.ageLabel)==='211-240';});
    else if(kind==='age_exact_241_360')rows=rows.filter(function(r){return r.actionable&&mdAgeBucket8646(r.ageLabel)==='241-360';});
    else if(kind==='age_exact_360_plus')rows=rows.filter(function(r){return r.actionable&&mdAgeBucket8646(r.ageLabel)==='360+';});
    else if(text(kind).indexOf('discount_')===0){var d=num(text(kind).split('_')[1]);rows=rows.filter(function(r){return num(r.discount)===d;});}
    return rows.sort(function(a,b){return num(b.gap)-num(a.gap)||num(b.impact)-num(a.impact)||num(b.value)-num(a.value)||text(a.name).localeCompare(text(b.name),'es');});
  }
  function markdownKindTitle(kind){return {all:'Referencias evaluadas',actionable:'Productos por gestionar',manage:'Productos por gestionar',comply:'Productos que cumplen',exceed:'Productos que superan política',review:'Productos para revisar dato',units:'Unidades a gestionar',value:'Valor de inventario recomendado',impact:'Impacto estimado del descuento',weighted:'Descuento promedio ponderado',older:'Productos con 151 días o más',last_unit:'Fuera de surtido · última unidad',outside:'Productos fuera de surtido',star:'Rotación Estrella',rest:'Rotación resto surtido',high:'Descuentos de 60% o 70%',no_policy:'Sin política aplicable',no_discount:'Sin descuento sugerido',rotation_group:'Productos a gestionar · Rotación',evacuation_group:'Productos a gestionar · Evacuación',age_exact_0_60:'Productos a gestionar · 0–60 días',age_exact_61_90:'Productos a gestionar · 61–90 días',age_exact_91_150:'Productos a gestionar · 91–150 días',age_exact_151_180:'Productos a gestionar · 151–180 días',age_exact_181_210:'Productos a gestionar · 181–210 días',age_exact_211_240:'Productos a gestionar · 211–240 días',age_exact_241_360:'Productos a gestionar · 241–360 días',age_exact_360_plus:'Productos a gestionar · +360 días'}[kind]||(text(kind).indexOf('discount_')===0?'Productos con descuento de '+text(kind).split('_')[1]+'%':'Detalle de Markdown');}
  function markdownTable(rows){
    function p(v){return v==null?'—':(Math.round(num(v)*10)/10).toFixed(1).replace('.0','')+'%';}
    var body=rows.map(function(r){return '<tr onclick="V8620.openMarkdownProduct(\''+esc(r.code)+'\')"><td><span class="code">'+esc(r.code)+'</span></td><td><span class="name">'+esc(r.name)+'</span><div class="meta">'+esc(r.category+' · '+r.line)+'</div></td><td class="num">'+p(r.currentDiscount)+'</td><td class="num"><b>'+p(r.discount)+'</b></td><td class="num">'+(r.gap==null?'—':((r.gap>0?'+':'')+(Math.round(r.gap*10)/10).toFixed(1).replace('.0','')+' pp'))+'</td><td>'+esc(r.statusLabel)+'</td><td>'+esc(r.policyApplied)+'</td><td>'+esc(r.ruleApplied)+'</td></tr>';}).join('');
    return '<div class="v8620TableWrap"><table class="v8620Table"><thead><tr><th>Código</th><th>Producto</th><th class="num">Actual</th><th class="num">Sugerido</th><th class="num">Brecha</th><th>Estado</th><th>Política</th><th>Regla</th></tr></thead><tbody>'+body+'</tbody></table></div>';
  }
  function openMarkdownMetric(kind){
    var rows=markdownFilter(kind),units=sum(rows,function(r){return r.stock;}),value=sum(rows,function(r){return r.value;}),impact=sum(rows,function(r){return r.impact;}),net=value-impact,weighted=value?impact/value*100:0;
    var summary='<div class="v8620MetricGrid">'+metric('Productos',int(rows.length),'Productos incluidos','info')+metric('Unidades',int(units),'Stock asociado','')+metric('Valor actual',money(value),'Antes del descuento','')+metric('Impacto estimado',money(impact),'Reducción teórica','bad')+metric('Valor posterior',money(net),'Después de aplicar la recomendación','good')+metric('Descuento ponderado',pct(weighted),'Ponderado por valor','warn')+'</div>';
    var explain='<div class="v8620Explain"><b>Cómo leer esta vista:</b> la recomendación es orientativa. LLAVERO no cambia precios; muestra los productos que cumplen la política, el porcentaje sugerido y el efecto teórico sobre el valor del inventario.</div>';
    openDetail(markdownKindTitle(kind),'Detalle completo de los productos que conforman el indicador',section('Resumen del indicador','Valores consolidados para la tienda seleccionada',summary)+section('Interpretación','Criterio aplicado',explain)+section('Productos incluidos',int(rows.length)+' registros · selecciona una fila para abrir la ficha',markdownTable(rows)),'Markdown · '+(storeObj(currentStore()).name||currentStore()),'markdown');
  }
  function ageDistribution(r){
    var ranges=r&&r.row&&r.row.rangos||{},items=Object.keys(ranges).map(function(k){return {k:k,v:num(ranges[k])};}).filter(function(x){return x.v>0;}),mx=Math.max.apply(null,items.map(function(x){return x.v;}).concat([1]));
    if(!items.length)return '<div class="v8620NoData">Sin distribución de antigüedad disponible.</div>';
    return '<div class="v8620AgeList">'+items.map(function(x){return '<div class="v8620AgeRow"><span>'+esc(x.k)+'</span><div class="v8620AgeTrack"><div class="v8620AgeFill" style="width:'+Math.max(3,x.v/mx*100)+'%"></div></div><b>'+int(x.v)+' uds</b></div>';}).join('')+'</div>';
  }
  function openMarkdownProduct(code){
    var r=markdownRows().find(function(x){return text(x.code)===text(code);});try{if(typeof closeRangeModal==='function')closeRangeModal();}catch(_){}try{if(typeof openInventoryProduct==='function')openInventoryProduct(code);else if(base.openMarkdownProduct)base.openMarkdownProduct(code);}catch(err){console.error('V86.43 producto Markdown',err);}if(!r)return;
    function inject(){var body=document.getElementById('inventoryProductBody');if(!body)return;var modal=document.getElementById('inventoryProductModal');if(modal&&!modal.classList.contains('on'))return;body.querySelectorAll('.v8622MarkdownSection,.v8618MarkdownDetail').forEach(function(x){x.remove();});function pp(v){return v==null?'—':(Math.round(num(v)*10)/10).toFixed(1).replace('.0','')+'%';}var detail='<section class="detailSection full v8622MarkdownSection"><div class="detailSectionTitle">Diagnóstico comercial de Markdown</div><div class="mdStatusBanner31 '+esc(r.statusKey)+'"><b>'+esc(r.statusLabel)+'</b><span>'+esc(r.actionText)+'</span></div><div class="detailGrid"><div class="detailItem"><label>Precio lista</label><b>'+(r.priceList==null?'—':money(r.priceList))+'</b></div><div class="detailItem"><label>Precio oferta</label><b>'+(r.priceOffer==null?'—':money(r.priceOffer))+'</b></div><div class="detailItem"><label>Precio con promo</label><b>'+(r.pricePromo==null?'—':money(r.pricePromo))+'</b></div><div class="detailItem"><label>Desc. comercial</label><b>'+pp(r.commercialDiscount)+'</b></div><div class="detailItem"><label>Desc. oferta sistema</label><b>'+pp(r.systemOfferDiscount)+'</b></div><div class="detailItem"><label>Desc. administrado</label><b>'+pp(r.adminDiscount)+'</b></div><div class="detailItem"><label>Descuento actual</label><b>'+(r.currentDiscount==null?'—':pp(r.currentDiscount))+'</b><span>'+(r.currentDiscountSource?'Fuente: '+esc(r.currentDiscountSource):'')+'</span></div><div class="detailItem"><label>Precio efectivo actual</label><b>'+(r.currentDiscount==null||r.priceList==null?'—':money(r.currentUnit))+'</b></div><div class="detailItem"><label>Última actualización</label><b>'+esc(r.lastUpdate?String(r.lastUpdate).replace('T',' '):'—')+'</b></div><div class="detailItem"><label>Actualizado por</label><b>'+esc(r.updateUser||'—')+'</b></div><div class="detailItem"><label>Última venta</label><b>'+esc(r.lastSale?String(r.lastSale).replace('T',' '):'—')+'</b></div><div class="detailItem"><label>Política</label><b>'+esc(r.policyApplied)+'</b></div><div class="detailItem"><label>Regla</label><b>'+esc(r.ruleApplied)+'</b></div><div class="detailItem"><label>Sugerido</label><b>'+pp(r.discount)+'</b></div><div class="detailItem"><label>Brecha</label><b>'+(r.gap==null?'—':((r.gap>0?'+':'')+(Math.round(r.gap*10)/10).toFixed(1).replace('.0','')+' pp'))+'</b></div><div class="detailItem"><label>OF sugerido</label><b>'+(r.of==null?'—':pp(r.of)+' OF')+'</b></div></div><div class="v8618ActionGroup v8622MarkdownActions"><button type="button" data-md-code="'+esc(r.code)+'" onclick="copyMarkdown8617(this.dataset.mdCode)">Copiar diagnóstico</button>'+(r.actionable?'<button type="button" data-md-code="'+esc(r.code)+'" onclick="openMarkdownPortal8617(this.dataset.mdCode)">Gestionar en portal</button>':'')+'</div></section>';body.insertAdjacentHTML('beforeend',detail);}
    [70,210].forEach(function(ms){setTimeout(inject,ms);});
  }


  /* ---------------------------------------------------------
     TERRITORIOS: seguimiento diario, semanal, mensual y trimestral.
     --------------------------------------------------------- */
  function metricFromHistory(code,snapshot){var h=snapshot&&snapshot.stores&&snapshot.stores[code]||{};return h;}
  function allTerritoryMetrics(){
    var h=history(),latest=h[h.length-1],all=stores();
    return Object.keys(all).map(function(code){
      var sm=staticMetric(code)||{},hm=metricFromHistory(code,latest),actions=hm.actions||{},tr=hm.transfers||{},critical=hm.critical||{},rot360=hm.rot360||{};
      var m={code:code,name:sm.name||all[code].name||code,zone:sm.zone||'Sin zona',department:sm.department||'Sin departamento',city:sm.city||'Sin ciudad',inventory:num(sm.inventory),units:num(sm.units),rotPct:num(sm.rotPct),evacPct:num(sm.evacPct),critical:num(critical.currentCount!=null?critical.currentCount:sm.critical),managed:num(critical.recoveredCount!=null?critical.recoveredCount:sm.managed),newCritical:num(critical.newCount!=null?critical.newCount:sm.newCritical),persistent:num(critical.persistentCount!=null?critical.persistentCount:sm.persistent),older:num(rot360.currentCount!=null?rot360.currentCount:sm.older),score:hm.score==null?sm.score:num(hm.score),execution:hm.executionScore==null?null:num(hm.executionScore),actionsOpen:num(actions.currentOpen),actionsLate:num(actions.late),actionsBlocked:num(actions.blocked),actionsResolved:num(actions.resolved),actionResolution:actions.resolutionRate==null?null:num(actions.resolutionRate),transferCurrent:num(tr.current),transferResolved:num(tr.resolved),transferNew:num(tr.newCount),transferResolution:tr.resolutionRate==null?null:num(tr.resolutionRate),transferOrders:num(sm.transfers),transferUnits:num(sm.transferUnits),markdown:num(sm.markdown),markdownUnits:num(sm.markdownUnits),markdownValue:num(sm.markdownValue),markdownImpact:num(sm.markdownImpact),guides:num(sm.guides),guideComplete:num(sm.guideComplete),guideAdvance:num(sm.guideAdvance),guideCoverage:num(sm.guideCoverage),guideMissing:num(sm.guideMissing),guideRequested:num(sm.guideRequested),guideAvailable:num(sm.guideAvailable)};
      var reasons=[];if(m.score!=null&&m.score<55)reasons.push('Índice < 55');if(m.rotPct>=50)reasons.push('Rotación ≥ 50%');if(m.evacPct>=30)reasons.push('Evacuación ≥ 30%');if(m.newCritical>=10)reasons.push('Nuevos críticos altos');if(m.actionsLate>0)reasons.push('Acciones vencidas');if(m.guideCoverage<45)reasons.push('Cobertura ambientes < 45%');
      m.alertReasons=reasons;m.status=reasons.length>=2?'bad':reasons.length===1?'warn':'good';m.statusLabel=m.status==='bad'?'Crítica':m.status==='warn'?'Atención':'Estable';m.priority=Math.max(0,100-num(m.score))*1.05+m.rotPct*.28+m.evacPct*.38+m.newCritical*.25+m.actionsLate*2.5+Math.max(0,55-m.guideCoverage)*.32;return m;
    });
  }
  function filterTerritoryMetrics(rows){
    var s=state.territory,q=norm(s.q);return rows.filter(function(m){if(s.zone!=='all'&&m.zone!==s.zone)return false;if(s.department!=='all'&&m.department!==s.department)return false;if(s.city!=='all'&&m.city!==s.city)return false;if(s.store!=='all'&&m.code!==s.store)return false;if(q&&norm([m.name,m.zone,m.department,m.city,m.code].join(' ')).indexOf(q)<0)return false;return true;});
  }
  function periodDef8656(){return state.territory.period==='custom'?{label:'Personalizado',days:null}:(PERIODS[state.territory.period]||PERIODS.daily);}
  function periodHistory(){
    var rows=history();if(!rows.length)return [];
    if(state.territory.period==='custom'){
      var from=state.territory.customFrom||rows[0].date,to=state.territory.customTo||rows[rows.length-1].date;
      if(text(from)>text(to)){var tmp=from;from=to;to=tmp;}
      var custom=rows.filter(function(x){var d=text(x.date).slice(0,10);return d>=from&&d<=to;});
      return custom.length?custom:[rows[rows.length-1]];
    }
    var latestRow=rows[rows.length-1],latest=dateObj(latestRow.date);
    if(state.territory.period==='daily'){
      var dailySel=rows.slice(-2);
      return dailySel.length?dailySel:[latestRow];
    }
    if(state.territory.period==='weekly'){
      if(!latest)return [latestRow];
      var dow=latest.getDay(),diffToMonday=dow===0?6:dow-1,monday=new Date(latest.getTime()-diffToMonday*86400000);
      var weekly=rows.filter(function(x){var d=dateObj(x.date);return d&&d>=monday&&d<=latest;});
      return weekly.length?weekly:[latestRow];
    }
    if(state.territory.period==='monthly'){
      if(!latest)return [latestRow];
      var monthly=rows.filter(function(x){var d=dateObj(x.date);return d&&d.getFullYear()===latest.getFullYear()&&d.getMonth()===latest.getMonth();});
      return monthly.length?monthly:[latestRow];
    }
    var days=periodDef8656().days,sel=rows.filter(function(x){var d=dateObj(x.date);return d&&latest&&((latest-d)/86400000)<=days;});
    return sel.length?sel:[latestRow];
  }
  function aggregateSnapshot(snapshot,codes){
    var ss=snapshot&&snapshot.stores||{},vals=codes.map(function(c){return ss[c];}).filter(Boolean),inventory=sum(vals,function(x){return x.inventory;}),rotVal=sum(vals,function(x){return x.rotVal;}),evacVal=sum(vals,function(x){return x.evacVal;});
    return {date:snapshot&&snapshot.date,stores:vals.length,inventory:inventory,rotPct:inventory?rotVal/inventory*100:0,evacPct:inventory?evacVal/inventory*100:0,score:avg(vals,function(x){return x.score;}),execution:avg(vals,function(x){return x.executionScore;}),critical:sum(vals,function(x){return x.critical&&x.critical.currentCount;}),managed:sum(vals,function(x){return x.critical&&x.critical.recoveredCount;}),managedValue:sum(vals,function(x){return x.critical&&x.critical.recoveredVal;}),newCritical:sum(vals,function(x){return x.critical&&x.critical.newCount;}),newValue:sum(vals,function(x){return x.critical&&x.critical.newVal;}),persistent:sum(vals,function(x){return x.critical&&x.critical.persistentCount;}),persistentValue:sum(vals,function(x){return x.critical&&x.critical.persistentVal;}),older:sum(vals,function(x){return x.rot360&&x.rot360.currentCount;}),actionsOpen:sum(vals,function(x){return x.actions&&x.actions.currentOpen;}),actionsLate:sum(vals,function(x){return x.actions&&x.actions.late;}),actionsResolved:sum(vals,function(x){return x.actions&&x.actions.resolved;}),actionsResolution:avg(vals,function(x){return x.actions&&x.actions.resolutionRate;}),transfers:sum(vals,function(x){return x.transfers&&x.transfers.current;}),transferResolved:sum(vals,function(x){return x.transfers&&x.transfers.resolved;}),transferNew:sum(vals,function(x){return x.transfers&&x.transfers.newCount;}),transferResolution:avg(vals,function(x){return x.transfers&&x.transfers.resolutionRate;})};
  }
  function currentAggregate(rows){
    var guideWeight=sum(rows,function(x){return x.guides;}),score=avg(rows,function(x){return x.score;});return {stores:rows.length,alerts:rows.filter(function(x){return x.status!=='good';}).length,score:score,critical:sum(rows,function(x){return x.critical;}),persistent:sum(rows,function(x){return x.persistent;}),older:sum(rows,function(x){return x.older;}),markdown:sum(rows,function(x){return x.markdown;}),markdownUnits:sum(rows,function(x){return x.markdownUnits;}),markdownValue:sum(rows,function(x){return x.markdownValue;}),markdownImpact:sum(rows,function(x){return x.markdownImpact;}),transferOrders:sum(rows,function(x){return x.transferOrders;}),transferUnits:sum(rows,function(x){return x.transferUnits;}),guideComplete:sum(rows,function(x){return x.guideComplete;}),guides:sum(rows,function(x){return x.guides;}),guideCoverage:guideWeight?sum(rows,function(x){return x.guideCoverage*x.guides;})/guideWeight:0,guideMissing:sum(rows,function(x){return x.guideMissing;}),guideRequested:sum(rows,function(x){return x.guideRequested;}),guideAvailable:sum(rows,function(x){return x.guideAvailable;})};
  }
  function periodTotals(codes,rows){var agg=rows.map(function(x){return aggregateSnapshot(x,codes);}),activity=agg.length>1?agg.slice(1):agg;return {trend:agg,managed:sum(activity,function(x){return x.managed;}),managedValue:sum(activity,function(x){return x.managedValue;}),newCritical:sum(activity,function(x){return x.newCritical;}),newValue:sum(activity,function(x){return x.newValue;}),transferResolved:sum(activity,function(x){return x.transferResolved;}),transferNew:sum(activity,function(x){return x.transferNew;}),actionsResolved:sum(activity,function(x){return x.actionsResolved;}),latest:agg[agg.length-1]||{},base:agg[0]||{}};}
  function optionHtml(values,current,allLabel,labelFn){var out='<option value="all"'+(current==='all'?' selected':'')+'>'+esc(allLabel)+'</option>';values.forEach(function(v){out+='<option value="'+esc(v)+'"'+(current===v?' selected':'')+'>'+esc(labelFn?labelFn(v):v)+'</option>';});return out;}
  function filterOptions(all){
    var s=state.territory,zones=Array.from(new Set(all.map(function(x){return x.zone;}))).sort(),deps=Array.from(new Set(all.filter(function(x){return s.zone==='all'||x.zone===s.zone;}).map(function(x){return x.department;}))).sort(),cities=Array.from(new Set(all.filter(function(x){return (s.zone==='all'||x.zone===s.zone)&&(s.department==='all'||x.department===s.department);}).map(function(x){return x.city;}))).sort(),storesList=all.filter(function(x){return (s.zone==='all'||x.zone===s.zone)&&(s.department==='all'||x.department===s.department)&&(s.city==='all'||x.city===s.city);}).sort(function(a,b){return a.name.localeCompare(b.name,'es');});return {zones:zones,deps:deps,cities:cities,stores:storesList};
  }
  function territoryKpi(kind,icon,label,value,sub,cls,delta){
    var trend=delta&&delta!=='Ver detalle'?'<div class="tkTrend">'+esc(delta)+'</div>':'';
    return '<div class="v8620TerritoryKpi '+(cls||'')+'" data-v8622-territory-kind="'+esc(kind)+'" role="button" tabindex="0" onclick="V8620.openTerritoryMetric(\''+kind+'\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();V8620.openTerritoryMetric(\''+kind+'\')}"><div class="tkTop"><span class="tkIcon">'+icon+'</span><span class="tkArrow" aria-hidden="true">›</span></div><div class="tkLabel">'+esc(label)+'</div><div class="tkValue">'+value+'</div><div class="tkSub">'+esc(sub)+'</div>'+trend+'</div>';
  }
  function scoreTrendSvg(rows){
    if(!rows.length)return '<div class="v8620NoData">Sin cortes históricos disponibles.</div>';var W=690,H=250,p={l:42,r:20,t:22,b:43};function x(i){return p.l+(W-p.l-p.r)*(rows.length===1?.5:i/(rows.length-1));}function y(v){return p.t+(H-p.t-p.b)*(100-num(v))/100;}function path(key){return rows.map(function(r,i){return (i?'L':'M')+x(i).toFixed(1)+','+y(r[key]).toFixed(1);}).join(' ');}var grid='';[0,25,50,75,100].forEach(function(v){grid+='<line class="grid" x1="'+p.l+'" y1="'+y(v)+'" x2="'+(W-p.r)+'" y2="'+y(v)+'"></line><text x="'+(p.l-7)+'" y="'+(y(v)+3)+'" text-anchor="end">'+v+'</text>';});var pts=function(key,color){return rows.map(function(r,i){return '<circle class="point" onclick="V8620.openTerritoryCut('+i+')" cx="'+x(i)+'" cy="'+y(r[key])+'" r="5" fill="'+color+'"><title>'+dateLabel(r.date)+' · '+(r[key]==null?'—':num(r[key]).toFixed(1))+'</title></circle>';}).join('');};var dates=rows.map(function(r,i){return '<text x="'+x(i)+'" y="'+(H-14)+'" text-anchor="middle">'+esc(text(r.date).slice(5).split('-').reverse().join('/'))+'</text>';}).join('');return '<svg class="v8620ChartSvg" viewBox="0 0 '+W+' '+H+'">'+grid+'<path d="'+path('score')+'" fill="none" stroke="var(--vta)" stroke-width="3"></path>'+pts('score','var(--vta)')+'<path d="'+path('execution')+'" fill="none" stroke="var(--ok)" stroke-width="3"></path>'+pts('execution','var(--ok)')+dates+'</svg><div class="v8620ChartLegend"><span><i style="background:var(--vta)"></i>Índice promedio</span><span><i style="background:var(--ok)"></i>Ejecución operativa</span></div>';
  }
  function activitySvg(rows){
    if(!rows.length)return '<div class="v8620NoData">Sin cortes históricos disponibles.</div>';var W=690,H=250,p={l:42,r:18,t:22,b:43},mx=Math.max.apply(null,rows.map(function(r){return Math.max(num(r.managed),num(r.newCritical));}).concat([1])),group=(W-p.l-p.r)/rows.length,bw=Math.min(25,group*.25);function y(v){return p.t+(H-p.t-p.b)*(mx-num(v))/mx;}var grid='';for(var j=0;j<5;j++){var v=mx*j/4,yy=y(v);grid+='<line class="grid" x1="'+p.l+'" y1="'+yy+'" x2="'+(W-p.r)+'" y2="'+yy+'"></line><text x="'+(p.l-7)+'" y="'+(yy+3)+'" text-anchor="end">'+int(v)+'</text>';}var bars=rows.map(function(r,i){var cx=p.l+group*i+group/2,h1=H-p.b-y(r.managed),h2=H-p.b-y(r.newCritical);return '<g onclick="V8620.openTerritoryCut('+i+')" style="cursor:pointer"><rect x="'+(cx-bw-2)+'" y="'+y(r.managed)+'" width="'+bw+'" height="'+Math.max(1,h1)+'" rx="4" fill="var(--ok)"><title>Gestionados '+int(r.managed)+'</title></rect><rect x="'+(cx+2)+'" y="'+y(r.newCritical)+'" width="'+bw+'" height="'+Math.max(1,h2)+'" rx="4" fill="var(--bad)"><title>Nuevos '+int(r.newCritical)+'</title></rect><text x="'+cx+'" y="'+(H-14)+'" text-anchor="middle">'+esc(text(r.date).slice(5).split('-').reverse().join('/'))+'</text><text x="'+cx+'" y="'+Math.max(11,Math.min(y(r.managed),y(r.newCritical))-5)+'" text-anchor="middle">P '+int(r.persistent)+'</text></g>';}).join('');return '<svg class="v8620ChartSvg" viewBox="0 0 '+W+' '+H+'">'+grid+bars+'</svg><div class="v8620ChartLegend"><span><i style="background:var(--ok)"></i>Gestionados</span><span><i style="background:var(--bad)"></i>Nuevos críticos</span><span>P = persistentes del corte</span></div>';
  }
  function priorityRanking(rows){var top=rows.slice().sort(function(a,b){return b.priority-a.priority;}).slice(0,12),mx=Math.max.apply(null,top.map(function(x){return x.priority;}).concat([1]));return '<div class="v8620RankList">'+top.map(function(r,i){return '<div class="v8620RankRow" onclick="V8620.openTerritoryStore(\''+esc(r.code)+'\')"><div class="v8620RankName">'+(i+1)+'. '+esc(r.name)+'<small>'+esc(r.statusLabel+' · '+(r.alertReasons.join(' · ')||'sin alertas'))+'</small></div><div class="v8620RankTrack"><div class="v8620RankFill" style="width:'+Math.max(3,r.priority/mx*100)+'%"></div></div><div class="v8620RankValue">'+r.priority.toFixed(0)+'</div></div>';}).join('')+'</div>';}
  function groupByField(rows){var s=state.territory,field=s.store!=='all'||s.city!=='all'?'store':s.department!=='all'?'city':s.zone!=='all'?'department':'zone',map={};rows.forEach(function(r){var label=field==='store'?r.name:r[field];if(!map[label])map[label]=[];map[label].push(r);});return {field:field,groups:Object.keys(map).sort().map(function(k){return {label:k,rows:map[k]};})};}
  function groupChart(rows){var grouped=groupByField(rows),items=grouped.groups.map(function(g){var a=currentAggregate(g.rows);return {label:g.label,score:a.score||0,coverage:a.guideCoverage||0,alerts:a.alerts,stores:a.stores};}).sort(function(a,b){return b.score-a.score;}),mx=100;return '<div class="v8620RankList">'+items.map(function(g){return '<div class="v8620RankRow" role="button" tabindex="0" data-territory-level="'+esc(grouped.field)+'" data-territory-label="'+esc(g.label)+'" onclick="V8620.drillTerritory(this.dataset.territoryLevel,this.dataset.territoryLabel)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();V8620.drillTerritory(this.dataset.territoryLevel,this.dataset.territoryLabel)}"><div class="v8620RankName">'+esc(g.label)+'<small>'+int(g.stores)+' tienda(s) · '+int(g.alerts)+' alerta(s)</small></div><div class="v8620RankTrack"><div class="v8620RankFill" style="width:'+Math.max(2,g.score/mx*100)+'%;background:linear-gradient(90deg,var(--vta),var(--ok))"></div></div><div class="v8620RankValue">'+g.score.toFixed(0)+'</div></div>';}).join('')+'</div><div class="v8620ChartLegend"><span>La barra representa el índice promedio. Abre un grupo para avanzar en la jerarquía.</span></div>';}
  function periodStoreTotals(code){var rows=periodHistory(),aggs=rows.map(function(x){return aggregateSnapshot(x,[code]);}),activity=aggs.length>1?aggs.slice(1):aggs;return {managed:sum(activity,function(x){return x.managed;}),newCritical:sum(activity,function(x){return x.newCritical;}),transferResolved:sum(activity,function(x){return x.transferResolved;}),actionsResolved:sum(activity,function(x){return x.actionsResolved;}),latest:aggs[aggs.length-1]||{},base:aggs[0]||{}};}
  function hierarchyTable(rows){
    var grouped=groupByField(rows),period=periodHistory(),body=grouped.groups.map(function(g){var a=currentAggregate(g.rows),p=periodTotals(g.rows.map(function(x){return x.code;}),period),alerts=a.alerts;return '<tr role="button" tabindex="0" data-territory-level="'+esc(grouped.field)+'" data-territory-label="'+esc(g.label)+'" onclick="V8620.drillTerritory(this.dataset.territoryLevel,this.dataset.territoryLabel)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();V8620.drillTerritory(this.dataset.territoryLevel,this.dataset.territoryLabel)}"><td><span class="name">'+esc(g.label)+'</span><div class="meta">'+int(a.stores)+' tienda(s)</div></td><td><span class="v8620Status '+(alerts>=2?'bad':alerts?'warn':'good')+'">'+int(alerts)+' alerta(s)</span></td><td class="num">'+(a.score==null?'—':a.score.toFixed(0)+'/100')+'</td><td class="num">'+int(p.managed)+'</td><td class="num">'+int(p.newCritical)+'</td><td class="num">'+int(a.persistent)+'</td><td class="num">'+int(a.older)+'</td><td class="num">'+int(a.markdown)+'</td><td class="num">'+int(a.transferOrders)+'</td><td class="num">'+pct(a.guideCoverage)+'</td><td class="num">'+int(a.guideComplete)+' / '+int(a.guides)+'</td></tr>';}).join('');return '<div class="v8620TableWrap v8620GroupTable"><table class="v8620Table"><thead><tr><th>'+esc(grouped.field==='zone'?'Zona':grouped.field==='department'?'Departamento':grouped.field==='city'?'Ciudad':'Tienda')+'</th><th>Estado</th><th class="num">Índice</th><th class="num">Gestionados periodo</th><th class="num">Nuevos periodo</th><th class="num">Persistentes</th><th class="num">+360</th><th class="num">Markdown</th><th class="num">Órdenes</th><th class="num">Cobertura ambientes</th><th class="num">Guías completas</th></tr></thead><tbody>'+body+'</tbody></table></div>';}
  function storeMatrix(rows){var body=rows.slice().sort(function(a,b){return b.priority-a.priority;}).map(function(r){var p=periodStoreTotals(r.code),sd=p.latest.score==null||p.base.score==null?'—':(num(p.latest.score)-num(p.base.score)>=0?'+':'')+(num(p.latest.score)-num(p.base.score)).toFixed(0);return '<tr onclick="V8620.openTerritoryStore(\''+esc(r.code)+'\')"><td><span class="name">'+esc(r.name)+'</span><div class="meta">'+esc(r.zone+' · '+r.city)+'</div></td><td><span class="v8620Status '+r.status+'">'+esc(r.statusLabel)+'</span><div class="meta">'+esc(r.alertReasons.join(' · ')||'Sin alertas')+'</div></td><td class="num">'+(r.score==null?'—':r.score.toFixed(0)+'/100')+'</td><td class="num">'+sd+'</td><td class="num">'+int(p.managed)+'</td><td class="num">'+int(p.newCritical)+'</td><td class="num">'+int(r.persistent)+'</td><td class="num">'+int(r.older)+'</td><td class="num">'+int(r.markdown)+'</td><td class="num">'+int(r.transferOrders)+'</td><td class="num">'+pct(r.guideCoverage)+'</td><td class="num">'+int(r.guideComplete)+' / '+int(r.guides)+'</td></tr>';}).join('');return '<div class="v8620TableWrap"><table class="v8620Table"><thead><tr><th>Tienda</th><th>Estado y alertas</th><th class="num">Índice</th><th class="num">Δ índice</th><th class="num">Gestionados</th><th class="num">Nuevos</th><th class="num">Persistentes</th><th class="num">+360</th><th class="num">Markdown</th><th class="num">Órdenes</th><th class="num">Cobertura</th><th class="num">Guías</th></tr></thead><tbody>'+body+'</tbody></table></div>';}

  function scoreDeltaStore(m){var p=periodStoreTotals(m.code),a=p.latest&&p.latest.score,b=p.base&&p.base.score;return a==null||b==null?0:num(a)-num(b);}
  function territoryTrendStats(rows){var out={improving:0,worsening:0,stable:0};rows.forEach(function(m){var d=scoreDeltaStore(m);if(d>2)out.improving++;else if(d<-2)out.worsening++;else out.stable++;});return out;}
  function signedInt(v){v=Math.round(num(v));return (v>0?'+':'')+int(v);}
  function recoveryRate(pt,cur){var den=num(pt.managed)+num(pt.newCritical)+num(cur.persistent);return den?num(pt.managed)/den*100:0;}
  function riskConcentration(rows){var vals=rows.map(function(x){return num(x.critical);}).sort(function(a,b){return b-a;}),total=vals.reduce(function(a,b){return a+b;},0);return total?vals.slice(0,5).reduce(function(a,b){return a+b;},0)/total*100:0;}
  function territorySection(title,sub,html,extra){return '<section class="v8629Section '+(extra||'')+'"><div class="v8629SectionHead"><div><b>'+esc(title)+'</b><span>'+esc(sub||'')+'</span></div></div><div class="v8629SectionBody">'+html+'</div></section>';}
  function analysisModeBar(rows){var mode=state.territory.analysisMode||'territory',known=rows.filter(function(m){return responsibleName(m)!=='Responsable no informado';}).length;return '<div class="v8629ModeBar"><div><b>Enfoque de análisis</b><span>Analiza el territorio o las personas que tienen tiendas a cargo.</span></div><div class="v8629ModeButtons"><button class="'+(mode==='territory'?'on':'')+'" onclick="V8620.setAnalysisMode(\'territory\')">Territorial</button><button class="'+(mode==='responsible'?'on':'')+'" onclick="V8620.setAnalysisMode(\'responsible\')">Por responsable</button></div><small>'+int(known)+' de '+int(rows.length)+' tiendas con responsable informado</small></div>';}
  function responsibleName(m){var st=storeObj(m.code)||{},k=st.kpi||{},vals=[st.responsable,st.responsible,st.administrador,st.admin,st.liderArea,st.lider,st.jefe,st.gerente,k.responsable,k.administrador,k.lider];for(var i=0;i<vals.length;i++){if(vals[i]!=null&&String(vals[i]).trim())return String(vals[i]).trim();}return 'Responsable no informado';}
  function responsibleAnalysis(rows){var groups={};rows.forEach(function(m){var r=responsibleName(m);(groups[r]||(groups[r]=[])).push(m);});var names=Object.keys(groups).sort(function(a,b){if(a==='Responsable no informado')return 1;if(b==='Responsable no informado')return -1;return a.localeCompare(b,'es');});if(names.length===1&&names[0]==='Responsable no informado')return '<div class="v8629ResponsibleEmpty"><span>👤</span><div><b>La fuente actual no incluye el responsable de cada tienda.</b><p>La vista ya queda preparada. Cuando el corte incorpore el campo Responsable / Administrador / Líder por tienda, LLAVERO agrupará automáticamente desempeño, alertas y evolución por persona a cargo.</p></div></div>';
    var body=names.map(function(name){var rs=groups[name],a=currentAggregate(rs),t=territoryTrendStats(rs),p=periodTotals(rs.map(function(x){return x.code;}),periodHistory());return '<tr><td><span class="name">'+esc(name)+'</span><div class="meta">'+int(rs.length)+' tienda(s) a cargo</div></td><td class="num">'+(a.score==null?'—':a.score.toFixed(0)+'/100')+'</td><td class="num goodTxt">'+int(t.improving)+'</td><td class="num badTxt">'+int(t.worsening)+'</td><td class="num">'+int(a.alerts)+'</td><td class="num">'+int(p.managed)+'</td><td class="num">'+int(p.newCritical)+'</td><td class="num">'+int(a.persistent)+'</td><td class="num">'+pct(a.guideCoverage)+'</td></tr>';}).join('');return '<div class="v8620TableWrap"><table class="v8620Table"><thead><tr><th>Responsable</th><th class="num">Índice</th><th class="num">Mejoran</th><th class="num">Empeoran</th><th class="num">Alertas</th><th class="num">Gestionados</th><th class="num">Nuevos</th><th class="num">Persistentes</th><th class="num">Ambientes</th></tr></thead><tbody>'+body+'</tbody></table></div>';}
  function criticalWaterfall(pt,cur){var start=num(pt.base&&pt.base.critical),newc=num(pt.newCritical),managed=num(pt.managed),end=num(pt.latest&&pt.latest.critical);if(!start&&!end)end=num(cur.critical);var net=newc-managed;return '<div class="v8629Waterfall"><div class="wfNode neutral"><label>Inicio del periodo</label><b>'+int(start)+'</b><small>productos críticos</small></div><div class="wfArrow">+</div><div class="wfNode bad"><label>Nuevos críticos</label><b>'+int(newc)+'</b><small>ingresaron al estado</small></div><div class="wfArrow">−</div><div class="wfNode good"><label>Gestionados</label><b>'+int(managed)+'</b><small>salieron del estado</small></div><div class="wfArrow">=</div><div class="wfNode '+(net>0?'bad':net<0?'good':'neutral')+'"><label>Cierre del periodo</label><b>'+int(end)+'</b><small>balance neto '+signedInt(net)+'</small></div></div>';}
  function movementRanking(rows){var data=rows.map(function(m){return {m:m,d:scoreDeltaStore(m)};});var up=data.slice().sort(function(a,b){return b.d-a.d;}).slice(0,7),down=data.slice().sort(function(a,b){return a.d-b.d;}).slice(0,7);function list(items,type){return '<div class="v8629MoveList">'+items.map(function(x,i){return '<button onclick="V8620.openTerritoryStore(\''+esc(x.m.code)+'\')"><span class="pos">'+(i+1)+'</span><span class="store"><b>'+esc(x.m.name)+'</b><small>'+esc(x.m.zone+' · '+x.m.city)+'</small></span><span class="delta '+(x.d>2?'good':x.d<-2?'bad':'flat')+'">'+(x.d>0?'+':'')+x.d.toFixed(0)+' pts</span></button>';}).join('')+'</div>';}
    return '<div class="v8629MoveGrid"><div><div class="v8629MiniTitle goodTxt">Tiendas que más mejoran</div>'+list(up,'up')+'</div><div><div class="v8629MiniTitle badTxt">Tiendas que más se deterioran</div>'+list(down,'down')+'</div></div>';}
  function heatClass(value,type){value=num(value);if(type==='rot')return value>=50?'bad':value>=30?'warn':'good';if(type==='evac')return value>=30?'bad':value>=15?'warn':'good';if(type==='older')return value>=20?'bad':value>0?'warn':'good';if(type==='markdown')return value>=20?'bad':value>0?'warn':'good';if(type==='transfers')return value>=5?'bad':value>0?'warn':'good';if(type==='coverage')return value<50?'bad':value<80?'warn':'good';if(type==='actions')return value>=3?'bad':value>0?'warn':'good';return 'good';}
  function heatmap(rows){var sorted=rows.slice().sort(function(a,b){return b.priority-a.priority;});var body=sorted.map(function(m){function cell(v,type,label){return '<td><span class="v8629Heat '+heatClass(v,type)+'" title="'+esc(label)+'">'+esc(label)+'</span></td>';}return '<tr onclick="V8620.openTerritoryStore(\''+esc(m.code)+'\')"><td><span class="name">'+esc(m.name)+'</span><div class="meta">'+esc(m.city)+'</div></td>'+cell(pct(m.rotPct),'rot',pct(m.rotPct))+cell(pct(m.evacPct),'evac',pct(m.evacPct))+cell(m.older,'older',int(m.older))+cell(m.markdown,'markdown',int(m.markdown))+cell(m.transferOrders,'transfers',int(m.transferOrders))+cell(m.guideCoverage,'coverage',pct(m.guideCoverage))+cell(m.actionsLate,'actions',int(m.actionsLate))+'</tr>';}).join('');return '<div class="v8620TableWrap v8629HeatWrap"><table class="v8620Table v8629HeatTable"><thead><tr><th>Tienda</th><th>Rotación</th><th>Evacuación</th><th>+360</th><th>Markdown</th><th>Traslados</th><th>Ambientes</th><th>Acciones vencidas</th></tr></thead><tbody>'+body+'</tbody></table></div><div class="v8629HeatLegend"><span><i class="good"></i>Controlado</span><span><i class="warn"></i>Atención</span><span><i class="bad"></i>Crítico</span></div>';}
  function quadrantSvg(rows){
    if(!rows.length)return '<div class="v8620NoData">Sin tiendas visibles.</div>';
    var W=960,H=500,p={l:74,r:34,t:42,b:62};
    var vals=rows.map(function(m){return {m:m,d:scoreDeltaStore(m),risk:m.priority};});
    var maxD=Math.max.apply(null,vals.map(function(x){return Math.abs(x.d);}).concat([5]));
    var maxR=Math.max.apply(null,vals.map(function(x){return x.risk;}).concat([1]));
    function x(v){return p.l+(W-p.l-p.r)*(v+maxD)/(maxD*2);}
    function y(v){return p.t+(H-p.t-p.b)*(maxR-v)/maxR;}
    var midX=x(0),midY=y(maxR*.5),placed=[];
    vals.slice().sort(function(a,b){return b.risk-a.risk;}).forEach(function(o){
      var px=x(o.d),py=y(o.risk),tryNo=0;
      while(placed.some(function(q){var dx=px-q.x,dy=py-q.y;return Math.sqrt(dx*dx+dy*dy)<18;})&&tryNo<14){
        var ring=1+Math.floor(tryNo/4),dir=tryNo%4;
        px+=dir===0?ring*11:dir===1?-ring*11:dir===2?ring*6:-ring*6;
        py+=dir<2?ring*6:-ring*6;
        px=Math.max(p.l+8,Math.min(W-p.r-8,px));py=Math.max(p.t+8,Math.min(H-p.b-8,py));tryNo++;
      }
      placed.push({o:o,x:px,y:py});
    });
    var bg='<rect x="'+p.l+'" y="'+p.t+'" width="'+(midX-p.l)+'" height="'+(midY-p.t)+'" class="qBad"></rect>'+
      '<rect x="'+midX+'" y="'+p.t+'" width="'+(W-p.r-midX)+'" height="'+(midY-p.t)+'" class="qRecover"></rect>'+
      '<rect x="'+p.l+'" y="'+midY+'" width="'+(midX-p.l)+'" height="'+(H-p.b-midY)+'" class="qWatch"></rect>'+
      '<rect x="'+midX+'" y="'+midY+'" width="'+(W-p.r-midX)+'" height="'+(H-p.b-midY)+'" class="qGood"></rect>';
    var dots=placed.map(function(q){var o=q.o;return '<g data-v8657-store="'+esc(o.m.code)+'" role="button" tabindex="0" style="cursor:pointer" onclick="V8620.openTerritoryStore(this.dataset.v8657Store)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();V8620.openTerritoryStore(this.dataset.v8657Store)}"><circle cx="'+q.x+'" cy="'+q.y+'" r="8" class="qDot '+(o.m.status||'good')+'"><title>'+esc(o.m.name)+' · tendencia '+(o.d>=0?'+':'')+o.d.toFixed(1)+' pts · prioridad '+o.risk.toFixed(0)+'</title></circle></g>';}).join('');
    var top=vals.slice().sort(function(a,b){return b.risk-a.risk;}).slice(0,8);
    var list='<div class="v8657QuadrantRank"><div class="v8657QuadrantRankHead"><b>Mayor prioridad</b><span>Haz clic para abrir la tienda</span></div>'+top.map(function(o,i){return '<button type="button" data-v8657-store="'+esc(o.m.code)+'" onclick="V8620.openTerritoryStore(this.dataset.v8657Store)"><span class="v8657QRankNo">'+(i+1)+'</span><span class="v8657QName"><b>'+esc(o.m.name)+'</b><small>Δ '+(o.d>=0?'+':'')+o.d.toFixed(1)+' pts · prioridad '+o.risk.toFixed(0)+'</small></span><i class="'+(o.m.status||'good')+'"></i></button>';}).join('')+'</div>';
    var svg='<svg class="v8620ChartSvg v8629Quadrant v8657QuadrantSvg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+bg+
      '<line x1="'+midX+'" y1="'+p.t+'" x2="'+midX+'" y2="'+(H-p.b)+'" class="qAxis"></line><line x1="'+p.l+'" y1="'+midY+'" x2="'+(W-p.r)+'" y2="'+midY+'" class="qAxis"></line>'+
      '<text x="'+(p.l+12)+'" y="'+(p.t+22)+'" class="qLabel">INTERVENIR YA</text><text x="'+(midX+12)+'" y="'+(p.t+22)+'" class="qLabel">RECUPERANDO</text><text x="'+(p.l+12)+'" y="'+(midY+24)+'" class="qLabel">VIGILAR</text><text x="'+(midX+12)+'" y="'+(midY+24)+'" class="qLabel">SOSTENER</text>'+dots+
      '<text x="'+p.l+'" y="'+(H-20)+'" class="v8657QAxisLabel">← Deteriora</text><text x="'+(W-p.r)+'" y="'+(H-20)+'" text-anchor="end" class="v8657QAxisLabel">Mejora →</text><text x="22" y="'+(H/2)+'" transform="rotate(-90 22 '+(H/2)+')" text-anchor="middle" class="v8657QAxisLabel">Mayor criticidad ↑</text></svg>';
    return '<div class="v8657QuadrantLayout"><div class="v8657QuadrantChart">'+svg+'<div class="v8657QuadrantLegend"><span><i class="bad"></i>Crítica</span><span><i class="warn"></i>Atención</span><span><i class="good"></i>Estable</span><small>Los puntos cercanos se separan visualmente para que puedan seleccionarse; el tooltip conserva el valor real.</small></div></div>'+list+'</div>';
  }
  function leaderCauseAnalysis8630(rows){var total=Math.max(1,rows.length),dims=[
    {kind:'rotation',label:'Rotación',count:rows.filter(function(m){return num(m.rotPct)>=30;}).length,meta:'tiendas con exposición ≥ 30%'},
    {kind:'evacuation',label:'Evacuación',count:rows.filter(function(m){return num(m.evacPct)>=15;}).length,meta:'tiendas con exposición ≥ 15%'},
    {kind:'older',label:'+360 días',count:rows.filter(function(m){return num(m.older)>0;}).length,meta:'tiendas con inventario >360 días'},
    {kind:'markdown',label:'Markdown',count:rows.filter(function(m){return num(m.markdown)>0;}).length,meta:'tiendas con productos recomendados'},
    {kind:'transfers',label:'Traslados',count:rows.filter(function(m){return num(m.transferOrders)>0;}).length,meta:'tiendas con órdenes pendientes'},
    {kind:'guideCoverage',label:'Ambientes',count:rows.filter(function(m){return num(m.guideCoverage)<80;}).length,meta:'tiendas con cobertura < 80%'},
    {kind:'actions',label:'Acciones',count:rows.filter(function(m){return num(m.actionsLate)>0;}).length,meta:'tiendas con acciones vencidas'}];
    return '<div class="v8630CauseBars">'+dims.map(function(d){var p=d.count/total*100,cl=p>=60?'bad':p>=30?'warn':'good';return '<button class="v8630CauseRow '+cl+'" onclick="V8620.openTerritoryMetric(\''+d.kind+'\')"><span class="causeLabel"><b>'+esc(d.label)+'</b><small>'+esc(d.meta)+'</small></span><span class="causeTrack"><i style="width:'+Math.max(d.count?3:0,p)+'%"></i></span><span class="causeValue"><b>'+pct(p)+'</b><small>'+int(d.count)+' de '+int(rows.length)+'</small></span></button>';}).join('')+'</div>';}
  function interventionSummary8630(rows){var top=rows.slice().sort(function(a,b){return b.priority-a.priority;}).slice(0,10),mx=Math.max.apply(null,top.map(function(x){return x.priority;}).concat([1]));return '<div class="v8630InterventionList">'+top.map(function(r,i){return '<button onclick="V8620.openTerritoryStore(\''+esc(r.code)+'\')"><span class="idx">'+(i+1)+'</span><span class="store"><b>'+esc(r.name)+'</b><small>'+esc(r.zone+' · '+r.city)+'</small></span><span class="reason">'+esc((r.alertReasons||[]).slice(0,2).join(' · ')||'Seguimiento preventivo')+'</span><span class="risk"><i style="width:'+Math.max(4,r.priority/mx*100)+'%"></i></span><strong>'+r.priority.toFixed(0)+'</strong></button>';}).join('')+'</div>';}
  function buildTerritories(){
    var all=allTerritoryMetrics(),rows=filterTerritoryMetrics(all),codes=rows.map(function(x){return x.code;}),opts=filterOptions(all),ph=periodHistory(),pt=periodTotals(codes,ph),cur=currentAggregate(rows),latest=pt.latest,baseAgg=pt.base,period=PERIODS[state.territory.period]||PERIODS.daily;
    state.periodRows=pt.trend;state.visibleMetrics=rows;state.visibleCodes=codes;
    var actionCompliance=latest.actionsResolution,trend=territoryTrendStats(rows),balance=num(pt.newCritical)-num(pt.managed),recovery=recoveryRate(pt,cur),concentration=riskConcentration(rows);
    var filters='<div class="v8620TerritoryFilters"><div class="v8620Field"><label>Zona</label><select onchange="V8620.setTerritoryFilter(\'zone\',this.value)">'+optionHtml(opts.zones,state.territory.zone,'Todas las zonas')+'</select></div><div class="v8620Field"><label>Departamento</label><select onchange="V8620.setTerritoryFilter(\'department\',this.value)">'+optionHtml(opts.deps,state.territory.department,'Todos los departamentos')+'</select></div><div class="v8620Field"><label>Ciudad</label><select onchange="V8620.setTerritoryFilter(\'city\',this.value)">'+optionHtml(opts.cities,state.territory.city,'Todas las ciudades')+'</select></div><div class="v8620Field"><label>Tienda</label><select onchange="V8620.setTerritoryFilter(\'store\',this.value)">'+optionHtml(opts.stores.map(function(x){return x.code;}),state.territory.store,'Todas las tiendas',function(c){var x=opts.stores.find(function(z){return z.code===c;});return x?x.name:c;})+'</select></div><div class="v8620Field"><label>Buscar</label><input value="'+esc(state.territory.q)+'" placeholder="Zona, ciudad, tienda o código" oninput="V8620.searchTerritories(this.value)"></div><button class="v8620Clear" onclick="V8620.clearTerritories()">Limpiar</button></div>';
    var periodBar='<div class="v8620PeriodBar"><span>Seguimiento</span>'+Object.keys(PERIODS).map(function(k){return '<button class="v8620PeriodBtn '+(state.territory.period===k?'on':'')+'" onclick="V8620.setPeriod(\''+k+'\')">'+PERIODS[k].label+'</button>';}).join('')+'<div class="v8620PeriodMeta"><b>'+int(ph.length)+' cortes disponibles</b> · '+dateLabel(ph[0]&&ph[0].date)+' a '+dateLabel(ph[ph.length-1]&&ph[ph.length-1].date)+'</div></div>';
    var primary='<div class="v8620TerritoryKpis v8630LeaderKpis">'+territoryKpi('score','★','Índice promedio',cur.score==null?'—':cur.score.toFixed(0)+'/100','Resultado consolidado de las tiendas visibles','good',deltaLabel(latest.score,baseAgg.score,true,' pts'))+territoryKpi('alerts','!','Tiendas en alerta',int(cur.alerts),int(cur.stores)+' tiendas evaluadas',cur.alerts?'bad':'good','')+territoryKpi('managed','✓','Gestionados',int(pt.managed),money(pt.managedValue)+' dejaron el estado crítico','good','Periodo '+period.label.toLowerCase())+territoryKpi('new','+','Nuevos críticos',int(pt.newCritical),money(pt.newValue)+' ingresaron al estado','bad','Periodo '+period.label.toLowerCase())+territoryKpi('persistent','↻','Persistentes',int(cur.persistent),'Continúan en condición crítica','warn',deltaLabel(latest.persistent,baseAgg.persistent,false,''))+territoryKpi('older','360','Referencias +360 días',int(cur.older),'Antigüedad crítica actual','bad',deltaLabel(latest.older,baseAgg.older,false,''))+'</div>';
    var signals='<div class="v8630SignalPanel"><div class="v8630SignalHead"><div><b>Señales para la toma de decisiones</b><span>Indicadores complementarios sin llenar la pantalla de tarjetas</span></div><small>'+esc(period.label)+'</small></div><div class="v8630SignalStrip">'+leaderSignal8630('balance','Balance neto',signedInt(balance),'Nuevos − gestionados',balance>0?'bad':balance<0?'good':'warn')+leaderSignal8630('recovery','Recuperación',pct(recovery),'Gestión del movimiento crítico','good')+leaderSignal8630('risk','Concentración del riesgo',pct(concentration),'Peso de las 5 tiendas más críticas','warn')+leaderSignal8630('markdown','Markdown',int(cur.markdown),int(cur.markdownUnits)+' uds · '+money(cur.markdownImpact),'info')+leaderSignal8630('transfers','Traslados',int(cur.transferOrders),int(cur.transferUnits)+' uds pendientes','warn')+leaderSignal8630('guideCoverage','Ambientes',pct(cur.guideCoverage),int(cur.guideMissing)+' posiciones pendientes','info')+leaderSignal8630('actions','Acciones',actionCompliance==null?'—':pct(actionCompliance),int(latest.actionsLate||0)+' vencidas',latest.actionsLate?'bad':'good')+'</div></div>';
    var evolution=territorySection('Evolución del periodo','Lectura amplia del desempeño y del movimiento crítico en los cortes disponibles','<div class="v8630EvolutionStack"><div class="v8630AnalysisBlock"><div class="v8630BlockHead"><b>Índice y ejecución operativa</b><span>Selecciona un punto para revisar el corte</span></div><div class="v8630HeroChart">'+scoreTrendSvg(pt.trend)+'</div></div><div class="v8630AnalysisBlock"><div class="v8630BlockHead"><b>Gestionados vs. nuevos críticos</b><span>P = productos persistentes en cada corte</span></div><div class="v8630HeroChart">'+activitySvg(pt.trend)+'</div></div></div>','v8630EvolutionSection');
    var flow=territorySection('Movimiento del universo crítico','Cómo cambia el universo crítico durante el periodo seleccionado',criticalWaterfall(pt,cur),'v8630FlowSection');
    var movement=territorySection('Quién mejora y quién se deteriora','Variación del índice frente al inicio del periodo. Cada tienda abre su detalle.',movementRanking(rows),'v8630MovementSection');
    var priority=territorySection('Dónde debe intervenir primero el Líder de Área','Prioridad combinando índice, exposición, nuevos críticos, acciones vencidas y cobertura de ambientes',interventionSummary8630(rows),'v8630PrioritySection');
    var quadrant=territorySection('Cuadrante de priorización','Criticidad actual vs. tendencia del índice. Los puntos son tiendas y permiten abrir su detalle.','<div class="v8630QuadrantLarge">'+quadrantSvg(rows)+'</div>','v8630QuadrantSection');
    var causes=territorySection('Qué está explicando el resultado','Porcentaje de tiendas visibles que presentan una señal de atención en cada dimensión',leaderCauseAnalysis8630(rows),'v8630CauseSection');
    var comparative=territorySection('Comparativo territorial','Navega Nacional → Zona → Departamento → Ciudad → Tienda',groupChart(rows),'v8630TerritoryCompare');
    var heat=territorySection('Mapa de calor por tienda','Lectura rápida de Rotación, Evacuación, +360, Markdown, Traslados, Ambientes y acciones vencidas',heatmap(rows),'v8630HeatSection');
    var hierarchy=territorySection('Comparativo por nivel','Selecciona una fila para avanzar en Nacional → Zona → Departamento → Ciudad → Tienda',hierarchyTable(rows),'v8630HierarchySection');
    var matrix=territorySection('Detalle analítico de tiendas','Seguimiento '+period.label.toLowerCase()+' para profundizar hasta la tienda',storeMatrix(rows),'v8630MatrixSection');
    return '<div class="v8620TerritoryPage v8630TerritoryPage"><div class="v8620TerritoryIntro v8630LeaderIntro"><div class="v8620TerritoryIntroTop"><div><h2>Dashboard general</h2><p>Vista unificada · Nacional → Zona → Departamento → Ciudad → Tienda.</p></div></div><div class="v8620TerritoryNote"><span>ℹ</span><div><b>Objetivo:</b> concentrar en un solo módulo el análisis nacional, por zona, ciudad y tienda, con los filtros y gráficos territoriales necesarios para la toma de decisiones.</div></div></div>'+filters+periodBar+primary+signals+evolution+flow+movement+priority+quadrant+causes+comparative+heat+hierarchy+matrix+'</div>';
  }
  function dashboardPath8649(){var s=state.territory,p=['Nacional'];if(s.zone!=='all')p.push(s.zone);if(s.department!=='all')p.push(s.department);if(s.city!=='all')p.push(s.city);if(s.store!=='all'){var m=allTerritoryMetrics().find(function(x){return x.code===s.store;});p.push(m?m.name:s.store);}return p;}
  function dashboardTrend8649(codes){return periodHistory().map(function(snap){var ss=snap&&snap.stores||{},vals=codes.map(function(c){return ss[c];}).filter(Boolean),inv=sum(vals,function(x){return x.inventory;}),rot=sum(vals,function(x){return x.rotVal;}),evac=sum(vals,function(x){return x.evacVal;});return {date:snap.date,rotPct:inv?rot/inv*100:0,evacPct:inv?evac/inv*100:0};});}
  function dashboardManagementTrend8649(codes){var rows=periodHistory(),trend=dashboardTrend8649(codes);return rows.map(function(snap,i){var ss=snap&&snap.stores||{},vals=codes.map(function(c){return ss[c];}).filter(Boolean),rp=0,rn=0,ep=0,en=0;vals.forEach(function(x){if(x.rot){rp+=num(x.rot.previousVal)+num(x.rot.newVal);rn+=num(x.rot.currentVal);}if(x.evac){ep+=num(x.evac.previousVal)+num(x.evac.newVal);en+=num(x.evac.currentVal);}});var curr=trend[i]||{};return {date:snap.date,rotRecovery:rp>0?(rp-rn)/rp*100:null,evacRecovery:ep>0?(ep-en)/ep*100:null,isBase:i===0,rotPct:curr.rotPct,evacPct:curr.evacPct,baseDate:rows[0]&&rows[0].date||snap.date};}).filter(function(x){return x.rotRecovery!==null||x.evacRecovery!==null||x.isBase;});}
  function trendDate8650(v){var s=String(v||''),p=s.split('-');return p.length===3?p[2]+'/'+p[1]:s;}
  function dashboardTrendSvg8650(data,kind){
    data=Array.isArray(data)?data:[];if(!data.length)return '<div class="empty">Sin cortes disponibles para los filtros seleccionados.</div>';
    var exposure=kind!=='management',k1=exposure?'rotPct':'rotRecovery',k2=exposure?'evacPct':'evacRecovery',W=1180,H=500,p={l:78,r:42,t:72,b:72},vals=[];
    data.forEach(function(d){var a=d.isBase&&!exposure?0:d[k1],b=d.isBase&&!exposure?0:d[k2];if(a!=null&&Number.isFinite(Number(a)))vals.push(Number(a));if(b!=null&&Number.isFinite(Number(b)))vals.push(Number(b));});if(!vals.length)vals=[0];
    var lo=Math.min.apply(null,vals.concat(exposure?[0]:[-5])),hi=Math.max.apply(null,vals.concat(exposure?[1]:[5])),spread=Math.max(1,hi-lo),padY=Math.max(exposure?1.5:3,spread*.16);lo=exposure?Math.max(0,lo-padY):lo-padY;hi=hi+padY;if(hi-lo<1)hi=lo+1;
    function x(i){return p.l+(W-p.l-p.r)*(data.length===1?.5:i/(data.length-1));}function y(v){return p.t+(H-p.t-p.b)*(hi-num(v))/(hi-lo);}function val(d,k){return d.isBase&&!exposure?0:num(d[k]);}
    var grid='';for(var j=0;j<5;j++){var gv=lo+(hi-lo)*j/4,gy=y(gv);grid+='<line x1="'+p.l+'" y1="'+gy+'" x2="'+(W-p.r)+'" y2="'+gy+'" stroke="var(--line2)"/><text x="'+(p.l-12)+'" y="'+(gy+4)+'" text-anchor="end" font-size="11" fill="var(--mut)">'+gv.toFixed(1)+'%</text>';}
    function path(k){return data.map(function(d,i){return (i?'L':'M')+x(i).toFixed(1)+','+y(val(d,k)).toFixed(1);}).join(' ');}
    var labelStep=data.length>12?Math.ceil(data.length/10):1;
    function pts(k,color,up){return data.map(function(d,i){var v=val(d,k),cx=x(i),cy=y(v),txt=d.isBase&&!exposure?'Base 0%':v.toFixed(1)+'%',show=(i%labelStep===0||i===data.length-1),bw=Math.max(64,txt.length*7+20),ry=up?cy-39:cy+14,ty=up?cy-23:cy+31;return '<g role="button" tabindex="0" style="cursor:pointer" onclick="V8620.openTerritoryCut('+i+')" onkeydown="if(event.keyCode===13||event.keyCode===32){event.preventDefault();V8620.openTerritoryCut('+i+')}"><circle cx="'+cx+'" cy="'+cy+'" r="7" fill="'+color+'" stroke="var(--card)" stroke-width="2"><title>'+esc(d.date)+' · '+txt+'</title></circle>'+(show?'<rect x="'+(cx-bw/2)+'" y="'+ry+'" width="'+bw+'" height="25" rx="9" fill="var(--card)" stroke="'+color+'"></rect><text x="'+cx+'" y="'+ty+'" text-anchor="middle" font-size="10.5" font-weight="900" fill="'+color+'">'+txt+'</text>':'')+'</g>';}).join('');}
    var labels=data.map(function(d,i){if(i%labelStep!==0&&i!==data.length-1)return '';return '<text x="'+x(i)+'" y="'+(H-24)+'" text-anchor="middle" font-size="11" font-weight="800" fill="var(--mut)">'+trendDate8650(d.date)+'</text>';}).join(''),zero=!exposure?'<line x1="'+p.l+'" y1="'+y(0)+'" x2="'+(W-p.r)+'" y2="'+y(0)+'" stroke="var(--mut)" stroke-width="2" stroke-dasharray="7 6"/>':'';
    var pathLabel=dashboardPath8649().join(' › '),period=periodDef8656().label;
    return '<div class="v8650TrendWrap v8657TrendWrap"><svg class="v8650TrendSvg v8657TrendSvg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+grid+zero+'<path d="'+path(k1)+'" fill="none" stroke="var(--rot)" stroke-width="4" stroke-linecap="round"/>'+pts(k1,'var(--rot)',true)+'<path d="'+path(k2)+'" fill="none" stroke="var(--evac)" stroke-width="4" stroke-linecap="round"/>'+pts(k2,'var(--evac)',false)+labels+'</svg></div><div class="v8650TrendLegend"><span><i style="background:var(--rot)"></i>'+(exposure?'Rotación':'Mejora Rotación')+'</span><span><i style="background:var(--evac)"></i>'+(exposure?'Evacuación':'Mejora Evacuación')+'</span></div><div class="v8650TrendContext"><span><b>Filtro:</b> '+esc(pathLabel)+'</span><span><b>Periodo:</b> '+esc(period)+' · '+int(data.length)+' cortes</span></div><div class="dashboardNote">Presiona cualquier punto para consultar el detalle del corte dentro del territorio filtrado.</div>';
  }
  function filteredLeaderMetrics8649(codes){var allow=new Set(codes),rows=[];try{rows=window.__LLAVERO_ORIG_LEADER_METRICS_8649?window.__LLAVERO_ORIG_LEADER_METRICS_8649():leaderStoreMetrics();}catch(_){rows=[];}return rows.filter(function(r){return allow.has(r.code);});}
  function originalDashboardFiltered8649(codes){
    if(!window.__LLAVERO_ORIG_LEADER_METRICS_8649)window.__LLAVERO_ORIG_LEADER_METRICS_8649=leaderStoreMetrics;
    if(!window.__LLAVERO_ORIG_NETWORK_TREND_8649)window.__LLAVERO_ORIG_NETWORK_TREND_8649=networkTrendData;
    if(!window.__LLAVERO_ORIG_MANAGEMENT_TREND_8649)window.__LLAVERO_ORIG_MANAGEMENT_TREND_8649=networkManagementTrendData;
    var oldLeader=leaderStoreMetrics,oldTrend=networkTrendData,oldMgmt=networkManagementTrendData,oldTrend59=typeof networkTrendData59==='function'?networkTrendData59:null,oldMgmt59=typeof networkManagementTrendData59==='function'?networkManagementTrendData59:null,oldTrendSvg=window.trendSvg,oldMgmtSvg=window.managementTrendSvg;
    var trendRows=dashboardTrend8649(codes),managementRows=dashboardManagementTrend8649(codes);
    try{
      leaderStoreMetrics=function(){return filteredLeaderMetrics8649(codes);};
      networkTrendData=function(){return trendRows;};
      networkManagementTrendData=function(){return managementRows;};
      if(typeof networkTrendData59!=='undefined')networkTrendData59=function(){return trendRows;};
      if(typeof networkManagementTrendData59!=='undefined')networkManagementTrendData59=function(){return managementRows;};
      window.trendSvg=function(){return dashboardTrendSvg8650(trendRows,'exposure');};
      window.managementTrendSvg=function(){return dashboardTrendSvg8650(managementRows,'management');};
      var core=typeof viewLeaderDashboard==='function'?viewLeaderDashboard():'<div class="empty">Dashboard no disponible.</div>';
      return core;
    }finally{leaderStoreMetrics=oldLeader;networkTrendData=oldTrend;networkManagementTrendData=oldMgmt;if(oldTrend59)networkTrendData59=oldTrend59;if(oldMgmt59)networkManagementTrendData59=oldMgmt59;window.trendSvg=oldTrendSvg;window.managementTrendSvg=oldMgmtSvg;}
  }
  function cutOptions8656(cuts,current){return cuts.map(function(x){var d=text(x.date).slice(0,10);return '<option value="'+esc(d)+'"'+(current===d?' selected':'')+'>'+dateLabel(d)+'</option>';}).join('');}
  function dashboardFilters8649(all,rows){
    var opts=filterOptions(all),ph=periodHistory(),allCuts=history(),path=dashboardPath8649(),first=allCuts[0]&&allCuts[0].date||'',last=allCuts[allCuts.length-1]&&allCuts[allCuts.length-1].date||'';
    var from=state.territory.customFrom||first,to=state.territory.customTo||last,customOn=state.territory.period==='custom';
    var range='<div class="v8656CutRange '+(customOn?'on':'')+'"><span class="v8656RangeTitle">Rango de cortes</span><label>Desde<select onchange="V8620.setCutRange(\'from\',this.value)">'+cutOptions8656(allCuts,from)+'</select></label><i>→</i><label>Hasta<select onchange="V8620.setCutRange(\'to\',this.value)">'+cutOptions8656(allCuts,to)+'</select></label>'+(customOn?'<b>Personalizado</b>':'')+'</div>';
    return '<div class="v8649DashControl"><div class="v8620TerritoryIntro v8630LeaderIntro"><div class="v8620TerritoryIntroTop"><div><h2>Dashboard general</h2><p>Dashboard original + análisis territorial integrado.</p></div><div class="v8649Path">'+path.map(function(x,i){return (i?'<i>›</i>':'')+'<b>'+esc(x)+'</b>';}).join('')+'</div></div><div class="v8620TerritoryNote"><span>ℹ</span><div><b>Vista dinámica:</b> los KPI y gráficos relevantes se recalculan con las tiendas que queden dentro de los filtros seleccionados. Las reglas informativas permanecen sin cambios.</div></div></div><div class="v8620TerritoryFilters"><div class="v8620Field"><label>Zona</label><select onchange="V8620.setTerritoryFilter(\'zone\',this.value)">'+optionHtml(opts.zones,state.territory.zone,'Todas las zonas')+'</select></div><div class="v8620Field"><label>Departamento</label><select onchange="V8620.setTerritoryFilter(\'department\',this.value)">'+optionHtml(opts.deps,state.territory.department,'Todos los departamentos')+'</select></div><div class="v8620Field"><label>Ciudad</label><select onchange="V8620.setTerritoryFilter(\'city\',this.value)">'+optionHtml(opts.cities,state.territory.city,'Todas las ciudades')+'</select></div><div class="v8620Field"><label>Tienda</label><select onchange="V8620.setTerritoryFilter(\'store\',this.value)">'+optionHtml(opts.stores.map(function(x){return x.code;}),state.territory.store,'Todas las tiendas',function(c){var x=opts.stores.find(function(z){return z.code===c;});return x?x.name:c;})+'</select></div><div class="v8620Field"><label>Buscar</label><input value="'+esc(state.territory.q)+'" placeholder="Zona, ciudad, tienda o código" oninput="V8620.searchTerritories(this.value)"></div><button class="v8620Clear" onclick="V8620.clearTerritories()">Limpiar</button></div><div class="v8620PeriodBar"><span>Seguimiento</span>'+Object.keys(PERIODS).map(function(k){return '<button class="v8620PeriodBtn '+(state.territory.period===k?'on':'')+'" onclick="V8620.setPeriod(\''+k+'\')">'+PERIODS[k].label+'</button>';}).join('')+range+'<div class="v8620PeriodMeta"><b>'+int(rows.length)+' tiendas visibles</b> · '+int(ph.length)+' cortes · '+dateLabel(ph[0]&&ph[0].date)+' a '+dateLabel(ph[ph.length-1]&&ph[ph.length-1].date)+'</div></div><div class="v8656RangeHelp">Para consultar un solo corte, selecciona la misma fecha en <b>Desde</b> y <b>Hasta</b>. En un rango, el primer corte funciona como base de comparación.</div></div>';
  }
  function dashboardTerritoryExtras8649(rows){
    if(!rows.length)return '<div class="card"><div class="cbody"><div class="empty">No hay tiendas para los filtros seleccionados.</div></div></div>';
    var period=periodDef8656();
    return '<div class="v8649TerritoryExtras"><div class="v8649ExtraHead"><div><b>Análisis territorial complementario</b><span>Solo se mantienen visuales que agregan una lectura distinta al Dashboard original.</span></div><span>'+esc(period.label)+'</span></div>'+
      territorySection('Cuadrante de priorización','Criticidad actual vs. tendencia. Los puntos y el ranking lateral abren la tienda.','<div class="v8630QuadrantLarge">'+quadrantSvg(rows)+'</div>','v8630QuadrantSection')+
      territorySection('Qué está explicando el resultado','Señales de atención en Rotación, Evacuación, +360, Markdown, Traslados, Ambientes y acciones.',leaderCauseAnalysis8630(rows),'v8630CauseSection')+
      territorySection('Mapa de calor por tienda','Lectura multidimensional de las principales señales operativas.',heatmap(rows),'v8630HeatSection')+
      territorySection('Comparativo por nivel','Navega Nacional → Zona → Departamento → Ciudad → Tienda sin repetir los rankings del Dashboard.',hierarchyTable(rows),'v8630HierarchySection')+'</div>';
  }
  function buildUnifiedDashboard8649(){var all=allTerritoryMetrics(),rows=filterTerritoryMetrics(all),codes=rows.map(function(x){return x.code;}),ph=periodHistory(),pt=periodTotals(codes,ph);state.periodRows=pt.trend;state.visibleMetrics=rows;state.visibleCodes=codes;var core=originalDashboardFiltered8649(codes);return '<div class="v8649UnifiedDashboard">'+dashboardFilters8649(all,rows)+core+dashboardTerritoryExtras8649(rows)+'</div>';}
  function stackDashboardTrends8650(){try{var cuts=periodHistory().length;document.querySelectorAll('#content .chartPair').forEach(function(pair){var cards=Array.from(pair.querySelectorAll(':scope > .card')),titles=Array.from(pair.querySelectorAll('.tt')).map(function(x){return (x.textContent||'').trim();});if(titles.some(function(t){return t.indexOf('Tendencia histórica de Rotación y Evacuación')===0;})&&titles.some(function(t){return t.indexOf('Tendencia de gestión diaria')===0;})){pair.classList.add('v8650TrendStack');cards.forEach(function(card){var tt=card.querySelector('.tt'),badge=card.querySelector('.rt .badge');if(tt&&tt.textContent.indexOf('Tendencia histórica de Rotación y Evacuación')===0&&badge)badge.textContent=int(cuts)+' cortes';});}});}catch(_){}}
  function drawTerritories(){var c=document.getElementById('content');if(!c)return;try{if(typeof setActiveNav==='function')setActiveNav('dashboard');}catch(_){}c.innerHTML=buildUnifiedDashboard8649();document.body.dataset.v8620View='dashboard';stackDashboardTrends8650();try{var path=dashboardPath8649(),hs=document.getElementById('heroSub'),fst=document.getElementById('fst');if(hs)hs.innerHTML='Visión filtrada de <b>'+int(state.visibleCodes.length)+' tiendas</b> · '+esc(path.join(' › '))+' · corte '+esc(DB&&DB.meta&&DB.meta.fecha||'—');if(fst)fst.textContent=path.join(' › ');}catch(_){}markVersion();setTimeout(function(){markVersion();stackDashboardTrends8650();},900);}
  function setTerritoryFilter(field,value){state.territory[field]=value;if(field==='zone'){state.territory.department='all';state.territory.city='all';state.territory.store='all';}if(field==='department'){state.territory.city='all';state.territory.store='all';}if(field==='city')state.territory.store='all';drawTerritories();}
  var searchTimer=null;function searchTerritories(value){state.territory.q=value;clearTimeout(searchTimer);searchTimer=setTimeout(drawTerritories,120);}
  function clearTerritories(){state.territory={zone:'all',department:'all',city:'all',store:'all',q:'',period:state.territory.period||'daily',customFrom:state.territory.customFrom||'',customTo:state.territory.customTo||'',analysisMode:state.territory.analysisMode||'territory'};drawTerritories();}
  function setPeriod(period){if(!PERIODS[period])return;state.territory.period=period;state.territory.customFrom='';state.territory.customTo='';drawTerritories();}
  function setCutRange(kind,value){var cuts=history();if(!cuts.length)return;var first=text(cuts[0].date).slice(0,10),last=text(cuts[cuts.length-1].date).slice(0,10);if(kind==='from')state.territory.customFrom=value||first;else state.territory.customTo=value||last;if(!state.territory.customFrom)state.territory.customFrom=first;if(!state.territory.customTo)state.territory.customTo=last;if(kind==='from'&&state.territory.customFrom>state.territory.customTo)state.territory.customTo=state.territory.customFrom;if(kind==='to'&&state.territory.customTo<state.territory.customFrom)state.territory.customFrom=state.territory.customTo;state.territory.period='custom';drawTerritories();}
  function setAnalysisMode(mode){state.territory.analysisMode=mode==='responsible'?'responsible':'territory';drawTerritories();}
  function drillTerritory(field,label){if(field==='store'){var m=state.visibleMetrics.find(function(x){return x.name===label;});if(m)return openTerritoryStore(m.code);}if(field==='zone')setTerritoryFilter('zone',label);else if(field==='department')setTerritoryFilter('department',label);else if(field==='city')setTerritoryFilter('city',label);}
  function openTerritoryStore(code){try{if(typeof closeRangeModal==='function')closeRangeModal();}catch(_){}try{if(typeof openTerritoryStore8618==='function'){openTerritoryStore8618(code);return;}}catch(_){}try{CUR=code;var sel=document.getElementById('store');if(sel)sel.value=code;window.setView('resumen');}catch(_){}}
  function territoryMetricValue(m,kind){var p=periodStoreTotals(m.code),d=p.latest.score==null||p.base.score==null?0:num(p.latest.score)-num(p.base.score),den=num(p.managed)+num(p.newCritical)+num(m.persistent);return {alerts:m.status==='good'?0:1,improving:d>2?1:0,worsening:d<-2?1:0,score:m.score,managed:p.managed,new:p.newCritical,persistent:m.persistent,older:m.older,balance:num(p.newCritical)-num(p.managed),recovery:den?num(p.managed)/den*100:0,risk:m.critical,rotation:m.rotPct,evacuation:m.evacPct,markdown:m.markdown,transfers:m.transferOrders,transferResolution:m.transferResolution,guideCoverage:m.guideCoverage,guideComplete:m.guideComplete,actions:m.actionResolution}[kind];}
  function territoryMetricTitle(kind){return {alerts:'Tiendas en alerta',improving:'Tiendas que están mejorando',worsening:'Tiendas que se están deteriorando',score:'Índice promedio de gestión',managed:'Productos gestionados en el periodo',new:'Nuevos productos críticos',persistent:'Productos persistentes',older:'Referencias con más de 360 días',balance:'Balance neto de críticos',recovery:'Tasa de recuperación',risk:'Concentración del riesgo por tienda',rotation:'Exposición en Rotación',evacuation:'Exposición en Evacuación',markdown:'Prioridad de Markdown',transfers:'Órdenes de traslado pendientes',transferResolution:'Resolución de traslados',guideCoverage:'Cobertura de ambientes',guideComplete:'Guías completas',actions:'Cumplimiento de acciones'}[kind]||'Detalle territorial';}
  function territoryMetricDescription(kind){return {alerts:'Las alertas combinan índice bajo, exposición alta, nuevos críticos, acciones vencidas y cobertura baja de ambientes.',improving:'Tiendas cuyo índice aumentó más de 2 puntos frente al inicio del periodo seleccionado.',worsening:'Tiendas cuyo índice disminuyó más de 2 puntos frente al inicio del periodo seleccionado.',score:'Promedio del índice de gestión de las tiendas visibles.',managed:'Suma de productos que dejaron el estado crítico en los cortes del periodo seleccionado.',new:'Suma de productos que ingresaron al estado crítico en los cortes del periodo.',persistent:'Productos que permanecen críticos en el corte más reciente.',older:'Referencias de Rotación ubicadas en el rango de más de 360 días.',balance:'Diferencia entre nuevos críticos y gestionados. Un valor positivo indica que el problema crece; uno negativo indica mejora neta.',recovery:'Proporción de productos gestionados frente al movimiento crítico observado en el periodo.',risk:'Cantidad de productos críticos por tienda; permite identificar dónde se concentra el problema.',rotation:'Porcentaje del valor del inventario de cada tienda expuesto a Rotación.',evacuation:'Porcentaje del valor del inventario de cada tienda expuesto a Evacuación.',markdown:'Productos con recomendación orientativa de descuento según política.',transfers:'Órdenes activas de traslado registradas por tienda.',transferResolution:'Porcentaje de resolución reportado en el último corte del periodo.',guideCoverage:'Cobertura ponderada de las posiciones requeridas de Piso 1 y Piso 2.',guideComplete:'Guías que pueden exhibirse completas con la existencia actual.',actions:'Tasa de resolución de las acciones registradas.'}[kind]||'Desagregación del indicador por tienda.';}
  function openTerritoryMetric(kind){
    var rows=state.visibleMetrics.length?state.visibleMetrics:filterTerritoryMetrics(allTerritoryMetrics()),sorted=rows.slice().sort(function(a,b){return num(territoryMetricValue(b,kind))-num(territoryMetricValue(a,kind));});
    var body=sorted.map(function(m){var p=periodStoreTotals(m.code),v=territoryMetricValue(m,kind),d=p.latest.score==null||p.base.score==null?0:num(p.latest.score)-num(p.base.score),display;if(kind==='score')display=v==null?'—':num(v).toFixed(0)+'/100';else if(['guideCoverage','transferResolution','actions','recovery'].indexOf(kind)>=0)display=v==null?'—':pct(v);else if(kind==='alerts')display=m.statusLabel;else if(kind==='improving'||kind==='worsening')display=v?'Sí':'No';else if(kind==='balance')display=signedInt(v);else display=int(v);return '<tr onclick="V8620.openTerritoryStore(\''+esc(m.code)+'\')"><td><span class="name">'+esc(m.name)+'</span><div class="meta">'+esc(m.zone+' · '+m.city)+'</div></td><td><span class="v8620Status '+m.status+'">'+esc(m.statusLabel)+'</span><div class="meta">'+esc(m.alertReasons.join(' · ')||'Sin alertas')+'</div></td><td class="num"><b>'+display+'</b></td><td class="num">'+(m.score==null?'—':m.score.toFixed(0))+'</td><td class="num '+(d>2?'goodTxt':d<-2?'badTxt':'')+'">'+(d>0?'+':'')+d.toFixed(0)+'</td><td class="num">'+int(p.managed)+'</td><td class="num">'+int(p.newCritical)+'</td><td class="num">'+int(m.persistent)+'</td><td class="num">'+int(m.older)+'</td><td class="num">'+int(m.markdown)+'</td><td class="num">'+int(m.transferOrders)+'</td><td class="num">'+pct(m.guideCoverage)+'</td></tr>';}).join('');
    var table='<div class="v8620TableWrap"><table class="v8620Table"><thead><tr><th>Tienda</th><th>Estado</th><th class="num">Indicador</th><th class="num">Índice</th><th class="num">Δ índice</th><th class="num">Gestionados</th><th class="num">Nuevos</th><th class="num">Persistentes</th><th class="num">+360</th><th class="num">Markdown</th><th class="num">Órdenes</th><th class="num">Ambientes</th></tr></thead><tbody>'+body+'</tbody></table></div>';
    openDetail(territoryMetricTitle(kind),'Desagregación por tienda · periodo '+periodDef8656().label,section('Qué representa','Criterio de lectura','<div class="v8620Explain"><b>'+esc(territoryMetricTitle(kind))+':</b> '+esc(territoryMetricDescription(kind))+'</div>')+section('Resultado por tienda','Selecciona una fila para abrir el resumen completo de la tienda',table),'Dashboard general','dashboard');
  }
  function openTerritoryCut(index){var snap=state.periodRows[index];if(!snap)return;var hist=periodHistory(),source=hist.find(function(x){return x.date===snap.date;}),rows=state.visibleCodes.map(function(code){var m=metricFromHistory(code,source),sm=state.visibleMetrics.find(function(x){return x.code===code;});return {code:code,name:sm&&sm.name||m.name||code,zone:sm&&sm.zone||'',city:sm&&sm.city||'',score:m.score,execution:m.executionScore,managed:num(m.critical&&m.critical.recoveredCount),newCritical:num(m.critical&&m.critical.newCount),persistent:num(m.critical&&m.critical.persistentCount),older:num(m.rot360&&m.rot360.currentCount),transfers:num(m.transfers&&m.transfers.current),resolved:num(m.transfers&&m.transfers.resolved),actionsLate:num(m.actions&&m.actions.late)};}).sort(function(a,b){return num(b.newCritical)-num(a.newCritical)||num(a.score)-num(b.score);});var body=rows.map(function(r){return '<tr onclick="V8620.openTerritoryStore(\''+esc(r.code)+'\')"><td><span class="name">'+esc(r.name)+'</span><div class="meta">'+esc(r.zone+' · '+r.city)+'</div></td><td class="num">'+(r.score==null?'—':num(r.score).toFixed(0))+'</td><td class="num">'+(r.execution==null?'—':pct(r.execution))+'</td><td class="num">'+int(r.managed)+'</td><td class="num">'+int(r.newCritical)+'</td><td class="num">'+int(r.persistent)+'</td><td class="num">'+int(r.older)+'</td><td class="num">'+int(r.transfers)+'</td><td class="num">'+int(r.resolved)+'</td><td class="num">'+int(r.actionsLate)+'</td></tr>';}).join('');var summary='<div class="v8620MetricGrid">'+metric('Índice promedio',snap.score==null?'—':snap.score.toFixed(0)+'/100','Resultado consolidado','good')+metric('Ejecución',snap.execution==null?'—':pct(snap.execution),'Promedio de gestión','good')+metric('Gestionados',int(snap.managed),money(snap.managedValue),'good')+metric('Nuevos críticos',int(snap.newCritical),money(snap.newValue),'bad')+metric('Persistentes',int(snap.persistent),money(snap.persistentValue),'warn')+metric('Traslados resueltos',int(snap.transferResolved),int(snap.transfers)+' pendientes','info')+'</div>';var table='<div class="v8620TableWrap"><table class="v8620Table"><thead><tr><th>Tienda</th><th class="num">Índice</th><th class="num">Ejecución</th><th class="num">Gestionados</th><th class="num">Nuevos</th><th class="num">Persistentes</th><th class="num">+360</th><th class="num">Traslados</th><th class="num">Resueltos</th><th class="num">Acciones vencidas</th></tr></thead><tbody>'+body+'</tbody></table></div>';openDetail('Detalle del corte '+dateLabel(snap.date),'Resultado operativo de las tiendas visibles',section('Resumen del corte','Indicadores consolidados',summary)+section('Resultado por tienda','Selecciona una tienda para abrir su vista',table),'Corte '+dateLabel(snap.date),'dashboard');}

  function bindOperationalDetails(view){
    if(view==='amb')document.querySelectorAll('#content .guideListRowV48,#content .guideMainRow,#content .guideProductRow,#content .mk,#content .ambClickableCard').forEach(keyActivate);
    if(view==='traslados')document.querySelectorAll('#content .v80TransferKpi,#content .v862Kpi,#content tbody tr[data-product-code],#content tbody tr[onclick]').forEach(keyActivate);
    if(view==='markdown')document.querySelectorAll('#content .v8618Card,#content .v8618DiscountBar,#content .v8618RankRow,#content #markdown-table-8618 tbody tr').forEach(keyActivate);
  }
  function goView(v){if(v==='territorios')v='dashboard';try{if(typeof setActiveNav==='function')setActiveNav(v);}catch(_){}window.setView(v);}
  function postRender(v){
    v=v||currentView();
    if(v==='territorios'){v='dashboard';try{VIEW='dashboard';}catch(_){}}
    document.body.dataset.v8620View=v;
    var run=function(){
      if(v==='dashboard'&&IS_LEADER)drawTerritories();
      else bindOperationalDetails(v);
      markVersion();
    };
    if('requestAnimationFrame' in window)requestAnimationFrame(run);else setTimeout(run,0);
  }

  function install(){
    if(installed)return;installed=true;
    base.setView=window.setView;base.refresh=window.refresh;base.viewResumen=window.viewResumen;base.openMarkdownCard=window.openMarkdownCard8618;base.openMarkdownProduct=window.openMarkdownProduct8618;base.viewTerritories=window.viewTerritories8617;base.drawTerritories=window.drawTerritories8617;
    if(window.territoryState8618){state.territory.zone=window.territoryState8618.zone||'all';state.territory.department=window.territoryState8618.department||'all';state.territory.city=window.territoryState8618.city||'all';state.territory.store=window.territoryState8618.store||'all';state.territory.q=window.territoryState8618.q||'';}
    window.viewResumen=function(st){return enhanceSummaryHtml(base.viewResumen.call(this,st),st);};
    window.viewTerritories8617=buildTerritories;window.drawTerritories8617=drawTerritories;
    window.openMarkdownCard8618=openMarkdownMetric;window.openMarkdownProduct8618=openMarkdownProduct;
    window.setView=function(v){if(v==='territorios')v='dashboard';var out=base.setView.call(this,v);postRender(v);return out;};
    if(typeof base.refresh==='function')window.refresh=function(){var out=base.refresh.apply(this,arguments);postRender(currentView());return out;};
    window.V8620={goView:goView,backDetail:backDetail,openMarkdownMetric:openMarkdownMetric,openMarkdownProduct:openMarkdownProduct,setTerritoryFilter:setTerritoryFilter,searchTerritories:searchTerritories,clearTerritories:clearTerritories,setPeriod:setPeriod,setCutRange:setCutRange,setAnalysisMode:setAnalysisMode,drillTerritory:drillTerritory,openTerritoryStore:openTerritoryStore,openTerritoryMetric:openTerritoryMetric,openTerritoryCut:openTerritoryCut,drawTerritories:drawTerritories};
    markVersion();
    if(document.body&&!document.body.classList.contains('auth-pending')&&!document.body.classList.contains('not-authenticated'))postRender(currentView());
    console.info('LLAVERO V86.50 · tendencias filtradas + layout horizontal completo');
  }

  function readyV8620(){return !!(window.__LLAVERO_BOOTSTRAPPED__&&typeof window.setView==='function'&&typeof window.viewResumen==='function'&&typeof window.viewMarkdown8617==='function'&&typeof window.storeTerritoryMetric8618==='function');}
  function scheduleV8620Install(){
    if(installed||!readyV8620())return false;
    var schedule=window.requestIdleCallback||function(fn){setTimeout(fn,60);};
    schedule(function(){install();try{window.dispatchEvent(new CustomEvent('llavero:v8620-ready'));}catch(_){try{window.dispatchEvent(new Event('llavero:v8620-ready'));}catch(__){}}},{timeout:500});
    return true;
  }
  if(!scheduleV8620Install()){
    window.addEventListener('llavero:bootstrapped',scheduleV8620Install,{once:true});
    setTimeout(scheduleV8620Install,900);
  }
})();



/* ==== llaveroV8622FixJs ==== */

(function(){
  'use strict';
  if(window.__LLAVERO_V8622_FIX__)return;window.__LLAVERO_V8622_FIX__=true;
  function stop(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();}
  function callLater(fn){try{fn();}catch(err){console.error('V86.22 interacción',err);}}
  document.addEventListener('click',function(e){
    var q=e.target&&e.target.closest?e.target.closest('[data-v8622-view]'):null;
    if(q&&window.V8620){stop(e);callLater(function(){window.V8620.goView(q.dataset.v8622View);});return;}
    var t=e.target&&e.target.closest?e.target.closest('[data-v8622-territory-kind]'):null;
    if(t&&window.V8620){stop(e);callLater(function(){window.V8620.openTerritoryMetric(t.dataset.v8622TerritoryKind);});return;}
    var m=e.target&&e.target.closest?e.target.closest('.v8618Card[data-md-card]'):null;
    if(m&&typeof window.openMarkdownCard8618==='function'){stop(e);callLater(function(){window.openMarkdownCard8618(m.dataset.mdCard);});return;}
    var mr=e.target&&e.target.closest?e.target.closest('.v8618RankRow[data-md-product]'):null;
    if(mr&&typeof window.openMarkdownProduct8618==='function'){stop(e);callLater(function(){window.openMarkdownProduct8618(mr.dataset.mdProduct);});return;}
    var g=e.target&&e.target.closest?e.target.closest('.guideKpiLike[data-guide-filter]'):null;
    if(g&&typeof window.openGuideKpiDetail65==='function'){stop(e);callLater(function(){window.openGuideKpiDetail65(g.dataset.guideFilter||'all');});return;}
    var tr=e.target&&e.target.closest?e.target.closest('.transferMetricCard8616,.transferInsightItem8616,.transferKpi862'):null;
    if(tr){var kind=tr.dataset.transferKind||'';if(kind){stop(e);callLater(function(){var f=window.openTransferKpi8615||window.openTransferKpi862||window.openTransferKpi80;if(typeof f==='function')f(kind);});}}
  },true);
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter'&&e.key!==' ')return;var el=e.target&&e.target.closest?e.target.closest('[data-v8622-view],[data-v8622-territory-kind],.v8618Card[data-md-card],.v8618RankRow[data-md-product],.guideKpiLike[data-guide-filter],.transferMetricCard8616,.transferInsightItem8616,.transferKpi862'):null;if(el){e.preventDefault();el.click();}
  },true);
  function mark22(){
    var root=document.documentElement,ver='V86.43',ttl='Llavero · Inventarios Jamar · 05/08/2026 · '+ver;
    if(root.getAttribute('data-llavero-build')!==ver)root.setAttribute('data-llavero-build',ver);
    if(root.getAttribute('data-llavero-app-version')!==ver)root.setAttribute('data-llavero-app-version',ver);
    if(root.getAttribute('data-llavero-views')!==ver)root.setAttribute('data-llavero-views',ver);
    if(document.title!==ttl)document.title=ttl;
    var chip=document.querySelector('.appVersionChip b');if(chip&&chip.textContent!=='05/08/2026 · '+ver)chip.textContent='05/08/2026 · '+ver;
  }
  if(window.V8620)mark22();else window.addEventListener('llavero:v8620-ready',mark22,{once:true});
  setTimeout(mark22,1200);
})();


/* ==== llaveroV8623MarkdownManagementJs ==== */

(function(){
  'use strict';
  if(window.__LLAVERO_V8623_MARKDOWN_MANAGEMENT__)return;
  window.__LLAVERO_V8623_MARKDOWN_MANAGEMENT__=true;
  var installed=false,baseView=null,baseDraw=null;
  var POLICY={
    age_0_60:{star:[0,0],rest:[0,0],fs:[40,20],fs_last:[50,30]},
    age_61_90:{star:[30,10],rest:[30,10],fs:[45,25],fs_last:[60,40]},
    age_91_150:{star:[30,10],rest:[40,20],fs:[50,30],fs_last:[70,50]},
    age_151_plus:{star:[45,25],rest:[50,30],fs:[60,40],fs_last:[70,50]}
  };
  var STANDARD_DISCOUNTS=[30,40,45,50,60,70];
  var memory={items:{}};
  function txt(v){return v==null?'':String(v);}
  function num(v){var n=Number(v);return Number.isFinite(n)?n:0;}
  function code(v){try{return typeof safeCode==='function'?safeCode(v):txt(v).trim();}catch(_){return txt(v).trim();}}
  function norm(v){var s=txt(v);return (s.normalize?s.normalize('NFD').replace(/[\u0300-\u036f]/g,''):s).toUpperCase().trim();}
  function esc(v){return txt(v).replace(/[&<>\"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]||m;});}
  function fInt(v){try{return Math.round(num(v)).toLocaleString('es-CO');}catch(_){return txt(v);}}
  function money(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(v):'$ '+Math.round(num(v)).toLocaleString('es-CO');}catch(_){return '$ '+Math.round(num(v)).toLocaleString('es-CO');}}
  function currentStore(){return txt(window.CUR||CUR||'');}
  function store(sc){try{return (window.S||S||{})[sc]||{};}catch(_){return {};}}
  function cutDate(){try{return txt((window.DB||DB||{}).meta&&((window.DB||DB).meta.fecha)||'SIN_CORTE');}catch(_){return 'SIN_CORTE';}}
  function storageKey(){return 'llavero_markdown_gestion_v8623_'+cutDate().replace(/[^0-9A-Za-z_-]+/g,'_');}
  function save(){try{localStorage.setItem(storageKey(),JSON.stringify(memory));}catch(_){}updateBar();}
  function load(){try{var raw=localStorage.getItem(storageKey());if(raw){var x=JSON.parse(raw);if(x&&x.items)memory=x;}}catch(_){}if(!memory||!memory.items)memory={items:{}};}
  function itemKey(sc,c){return txt(sc)+'|'+code(c);}
  function selected(sc,c){return !!memory.items[itemKey(sc,c)];}
  var rowsCache8625={};
  function allRows(sc){
    try{
      var k=txt(sc)+'|'+cutDate();
      if(rowsCache8625[k])return rowsCache8625[k];
      var rows=typeof normalizeInventoryRows==='function'?normalizeInventoryRows(store(sc)):[];
      var map=Object.create(null);for(var i=0;i<rows.length;i++)map[code(rows[i].c)]=rows[i];
      try{Object.defineProperty(rows,'__byCode8625',{value:map,enumerable:false,configurable:true});}catch(_){rows.__byCode8625=map;}
      rowsCache8625[k]=rows;return rows;
    }catch(_){return [];}
  }
  function ageInfo(row){
    var entries=[];try{entries=typeof sortedAgeEntries==='function'?sortedAgeEntries(row.rangos||{}):Object.entries(row.rangos||{});}catch(_){entries=Object.entries(row.rangos||{});}
    entries=entries.filter(function(x){return num(x[1])>0&&norm(x[0]).indexOf('SIN DEFINIR')<0;});
    if(!entries.length)return {label:'Sin definir',units:0,key:'unknown'};
    var x=entries[0],label=typeof canonicalAgeLabel==='function'?canonicalAgeLabel(x[0]):txt(x[0]),rank=-1;
    try{rank=typeof ageRankFromLabel==='function'?ageRankFromLabel(label):-1;}catch(_){}
    var k='unknown',n=norm(label);
    if(/^0|^000|^031|0\s*-\s*60/.test(n))k='age_0_60';
    if(/^061|^61|61\s*-\s*90/.test(n))k='age_61_90';
    if(/^091|^91|^121|91\s*-\s*150/.test(n))k='age_91_150';
    if(/^151|^181|^211|^241|^360|\+360|151/.test(n)||rank>=2)k='age_151_plus';
    return {label:label,units:num(x[1]),key:k};
  }
  function policyType(row){
    var p={};try{p=typeof productInfo==='function'?productInfo(row.c):{};}catch(_){}
    var state=norm(row.estadoAbastecimiento||row.estado||p.estado),matrix=norm(row.matriz||p.matriz),states=Array.isArray(row.estados)?row.estados.map(norm):[];
    if(states.indexOf('EVACUACION')>=0||state==='N')return num(row.stock)===1?{key:'fs_last',label:'Fuera de surtido - ultima unidad'}:{key:'fs',label:'Fuera de surtido'};
    if(['A','O','T'].indexOf(state)>=0){if(matrix==='ESTRELLA')return {key:'star',label:'Rotacion Estrella'};return {key:'rest',label:'Rotacion resto surtido'};}
    return {key:'none',label:'Sin politica aplicable'};
  }
  function record(sc,c){
    sc=sc||currentStore();c=code(c);var cachedRows=allRows(sc),row=(cachedRows.__byCode8625&&cachedRows.__byCode8625[c])||cachedRows.find(function(r){return code(r.c)===c;});if(!row)return null;var p=row.p||{};try{if(!p.n&&typeof productInfo==='function')p=productInfo(c)||p;}catch(_){}
    var a=ageInfo(row),t=policyType(row),pair=POLICY[a.key]&&POLICY[a.key][t.key],suggested=pair?num(pair[0]):null,of=pair?num(pair[1]):null,d=(window.discountActual18?window.discountActual18(sc,c):null)||row.descuentoActual||null,priceList=d&&d.precioLista!=null?num(d.precioLista):null,pricePromo=d&&d.precioConPromo!=null?num(d.precioConPromo):null,commercial=d&&d.descuentoComercial!=null?num(d.descuentoComercial):null,adminRaw=d?d.descuentoAdministrado:null,offerRaw=d?d.descuentoOfertaSistema:null,adminCalc=adminRaw==null?null:num(adminRaw),offerCalc=offerRaw==null?null:num(offerRaw),current=adminCalc,currentSource=adminCalc!=null?'Muestra / Administrador':'Sin dato',gap=(suggested!==null&&current!==null)?suggested-current:null,tol=.049,status='no_policy';
    if(suggested===null)status='no_policy';else if(!d||current===null)status='review';else if(current>suggested+tol)status='exceed';else if(current>=suggested-tol)status='comply';else if(current===0&&offerCalc!==null&&offerCalc>=suggested-tol)status='update_sample';else status='manage';
    var value=num(row.valorInventario),stock=num(row.stock),avg=num(row.valorUnitarioPromedio)||(stock?value/stock:0),currentUnit=(priceList!==null&&current!==null)?priceList*(1-current/100):(pricePromo!==null?pricePromo:avg);value=currentUnit*stock||value;var impact=status==='manage'&&priceList!==null&&gap!==null?Math.max(0,priceList*stock*gap/100):0,policyName=(t.key==='star'||t.key==='rest')?'Rotación':(t.key==='fs'||t.key==='fs_last')?'Evacuación':'Sin política',ruleBase=t.key==='star'?'Estrella':t.key==='rest'?'Resto surtido':t.key==='fs_last'?'Fuera de surtido · última unidad':t.key==='fs'?'Fuera de surtido':'Sin regla',rule=ruleBase+(t.key==='none'?'':' · '+a.label),reason=status==='manage'?'Muestra '+(Math.round(current*10)/10)+'% → sugerido '+suggested+'% · brecha +'+(Math.round(gap*10)/10)+' pp.':status==='update_sample'?'Oferta '+offerCalc+'% ya cubre la política; cargar '+suggested+'% como descuento muestra.':status==='review'?'Sin dato de descuento muestra/administrado para esta tienda-producto.':status==='comply'?'El descuento muestra ya cumple la política.':status==='exceed'?'El descuento muestra supera la política.':a.key==='unknown'?'Antigüedad sin definir.':'Estado fuera de A/O/T/N.';
    var img='';try{img=typeof productImageUrl==='function'?productImageUrl(c):txt((window.P||P||{})[c]&&((window.P||P)[c].img));}catch(_){}
    return {storeCode:sc,storeName:txt(store(sc).name||sc),code:c,name:txt(p.n||row.producto||c),category:txt(p.cat||row.categoria||'—'),line:txt(p.lin||row.linea||'—'),subline:txt(p.sub||row.sublinea||'—'),stock:stock,cendis:num(row.dispCendis),sales:num(row.facturacionUlt3Meses),salesUnits:num(row.unidadesFacUlt3Meses),value:value,avg:avg,ageLabel:a.label,ageUnits:a.units,typeLabel:t.label,policyApplied:policyName,ruleApplied:rule,suggested:suggested,of:of,currentDiscount:current,currentDiscountSource:currentSource,commercialDiscount:commercial,adminDiscount:adminCalc,systemOfferDiscount:offerCalc,priceList:priceList,pricePromo:pricePromo,lastUpdate:d&&d.fechaActualizacion||'',updateUser:d&&d.usuarioActualizacion||'',gap:gap,statusKey:status,reason:reason,image:img,impact:impact,actionable:status==='manage'||status==='update_sample',updateSample:status==='update_sample',row:row};
  }
  function add(sc,c){var r=record(sc,c);if(!r||!r.actionable)return false;var k=itemKey(sc,c),old=memory.items[k]||{};memory.items[k]={storeCode:sc,code:r.code,requestedDiscount:num(old.requestedDiscount||r.suggested),note:txt(old.note||'')};save();return true;}
  function remove(sc,c){delete memory.items[itemKey(sc,c)];save();}
  function clearAll(){memory={items:{}};save();enhanceTable();renderManager();}
  function records(){
    var arr=[];Object.keys(memory.items).forEach(function(k){var it=memory.items[k],r=record(it.storeCode,it.code);if(!r||!r.actionable){delete memory.items[k];return;}r.requestedDiscount=num(it.requestedDiscount||r.suggested);r.note=txt(it.note||'');r.responsible=r.requestedDiscount>50?'Lider de Area':'Administrador';arr.push(r);});
    arr.sort(function(a,b){return (b.requestedDiscount>50)-(a.requestedDiscount>50)||b.value-a.value||a.name.localeCompare(b.name,'es');});return arr;
  }
  function totals(rs){rs=rs||records();var value=rs.reduce(function(a,r){return a+r.value;},0),units=rs.reduce(function(a,r){return a+r.stock;},0),impact=rs.reduce(function(a,r){var gap=Math.max(0,num(r.requestedDiscount)-num(r.currentDiscount));return a+(r.priceList!=null?num(r.priceList)*num(r.stock)*gap/100:num(r.value)*gap/100);},0),admin=rs.filter(function(r){return r.requestedDiscount<=50;}).length,leader=rs.length-admin;return {count:rs.length,value:value,units:units,impact:impact,admin:admin,leader:leader};}
  function manageBarHtml(){return '<div class="v8623ManageBar" id="v8623ManageBar"><div class="v8623ManageInfo"><div class="v8623ManageIcon">✓</div><div><b>Lista de gestion Markdown</b><span>Selecciona productos para generar el Excel de cargue masivo o el expediente PDF para Administrador o Lider de Area.</span></div></div><div class="v8623ManageStats"><span class="v8623ManagePill" id="v8623SelCount">0 seleccionados</span><span class="v8623ManagePill admin" id="v8623AdminCount">0 Administrador</span><span class="v8623ManagePill leader" id="v8623LeaderCount">0 Lider</span></div><div class="v8623ManageActions"><button class="v8623ManageBtn" type="button" onclick="V8623.selectVisible(true)">Seleccionar visibles</button><button class="v8623ManageBtn" id="v8623ViewBtn" type="button" onclick="V8623.openManager()">Ver seleccion</button><button class="v8623ManageBtn primary" id="v8623ExcelBtn" type="button" onclick="V8623.downloadExcel()">Generar Excel</button><button class="v8623ManageBtn" id="v8623ManagementExcelBtn" type="button" onclick="V8623.downloadManagementExcel()">Excel de gestión</button><button class="v8623ManageBtn" id="v8623PdfBtn" type="button" onclick="V8623.downloadPdf()">Generar PDF</button><button class="v8623ManageBtn danger" id="v8623ClearBtn" type="button" onclick="V8623.clearAll()">Limpiar lista</button></div></div>';}
  function updateBar(){var t=totals(),a=document.getElementById('v8623SelCount'),b=document.getElementById('v8623AdminCount'),c=document.getElementById('v8623LeaderCount');if(a)a.textContent=fInt(t.count)+' seleccionados · '+fInt(t.units)+' u';if(b)b.textContent=fInt(t.admin)+' Administrador';if(c)c.textContent=fInt(t.leader)+' Lider';['v8623ViewBtn','v8623ExcelBtn','v8623PdfBtn','v8623ClearBtn','v8623ModalExcelBtn','v8623ModalPdfBtn'].forEach(function(id){var el=document.getElementById(id);if(el)el.disabled=!t.count;});}
  function enhanceTable(){
    var root=document.getElementById('markdown-table-8618');if(!root)return;var table=root.querySelector('table');if(!table)return;table.classList.add('v8623MarkdownTable');
    /* V86.128: la tabla final V8680 ya trae su selector oficial. No volver a insertar la columna histórica V8623. */
    if(table.querySelector('.v8680Sel')){
      Array.prototype.forEach.call(table.querySelectorAll('.v8623SelectCol'),function(x){x.remove();});
      var scNative=currentStore();
      Array.prototype.forEach.call(table.tBodies[0]?table.tBodies[0].rows:[],function(tr){
        var c=tr.dataset.mdProduct;if(!c)return;var r=record(scNative,c),ok=!!(r&&r.actionable),cb=tr.querySelector('.v8680Sel input[type=checkbox]');
        if(!cb)return;cb.checked=selected(scNative,c);cb.disabled=!ok;cb.title=ok?'Agregar a la lista de gestión':'Solo se seleccionan productos que requieren gestión';
      });
      updateBar();return;
    }
    var hr=table.tHead&&table.tHead.rows&&table.tHead.rows[0];if(hr&&!hr.querySelector('.v8623SelectCol')){var th=document.createElement('th');th.className='v8623SelectCol';th.innerHTML='<input id="v8623SelectAll" type="checkbox" title="Seleccionar todos los productos visibles que tienen descuento recomendado">';hr.insertBefore(th,hr.firstChild);var all=th.querySelector('input');all.addEventListener('click',function(e){e.stopPropagation();});all.addEventListener('change',function(){selectVisible(this.checked);});}
    var sc=currentStore(),eligible=0,eligibleSelected=0;
    Array.prototype.forEach.call(table.tBodies[0]?table.tBodies[0].rows:[],function(tr){var c=tr.dataset.mdProduct;if(!c)return;var r=record(sc,c),ok=!!(r&&r.actionable);if(ok)eligible++;if(selected(sc,c))eligibleSelected++;if(!tr.querySelector('.v8623SelectCol')){var td=document.createElement('td');td.className='v8623SelectCol';var cb=document.createElement('input');cb.type='checkbox';cb.dataset.store=sc;cb.dataset.code=c;cb.checked=selected(sc,c);cb.disabled=!ok;cb.title=ok?'Agregar a la lista de gestión':'Solo se seleccionan productos con descuento actual inferior al sugerido';cb.addEventListener('click',function(e){e.stopPropagation();});cb.addEventListener('change',function(e){e.stopPropagation();if(this.checked)add(this.dataset.store,this.dataset.code);else remove(this.dataset.store,this.dataset.code);var h=document.getElementById('v8623SelectAll');if(h){h.checked=false;h.indeterminate=true;}});td.appendChild(cb);tr.insertBefore(td,tr.firstChild);}else{var existing=tr.querySelector('.v8623SelectCol input');if(existing){existing.dataset.store=sc;existing.checked=selected(sc,c);existing.disabled=!ok;}}
      if(r&&r.actionable){var discountCell=tr.querySelector('[data-md-suggested]')||tr.cells[11];if(discountCell&&!discountCell.querySelector('.v8623OwnerTag')){var tag=document.createElement('span');tag.className='v8623OwnerTag '+(r.suggested>50?'leader':'admin');tag.textContent=r.suggested>50?'Gestion Lider >50%':'Gestion Admin <=50%';discountCell.appendChild(tag);}}
    });
    var head=document.getElementById('v8623SelectAll');if(head){head.checked=eligible>0&&eligibleSelected===eligible;head.indeterminate=eligibleSelected>0&&eligibleSelected<eligible;head.disabled=eligible===0;}updateBar();
  }
  function selectVisible(check){
    var table=document.querySelector('#markdown-table-8618 table'),sc=currentStore();if(!table)return;
    Array.prototype.forEach.call(table.querySelectorAll('tbody tr[data-md-product]'),function(tr){
      var c=code(tr.dataset.mdProduct),r=record(sc,c);if(!r||!r.actionable)return;var k=itemKey(sc,c);
      if(check){var old=memory.items[k]||{};memory.items[k]={storeCode:sc,code:r.code,requestedDiscount:num(old.requestedDiscount||r.suggested),note:txt(old.note||'')};}
      else delete memory.items[k];
    });
    save();enhanceTable();renderManager();
  }
  function ensureManager(){
    var modal=document.getElementById('v8623MarkdownManageModal');if(modal)return modal;var wrap=document.createElement('div');wrap.id='v8623MarkdownManageModal';wrap.className='modalBack';wrap.innerHTML='<div class="modal v8623ManageModal" role="dialog" aria-modal="true" aria-labelledby="v8623ManagerTitle"><div class="modalHead"><div><h3 id="v8623ManagerTitle">Lista de gestion Markdown</h3><p>Genera el cargue masivo en Excel con el descuento sugerido o el expediente PDF de gestion.</p></div><button class="modalClose" type="button" onclick="V8623.closeManager()">×</button></div><div class="modalBody v8623ManageModalBody" id="v8623ManagerBody"></div><div class="modalFoot"><span class="v8623PdfProgress" id="v8623PdfProgress">Preparando archivo...</span><button class="btn danger" type="button" onclick="V8623.clearAll()">Limpiar lista</button><button class="btn ghost" type="button" onclick="V8623.closeManager()">Cerrar</button><button class="btn primary" id="v8623ModalExcelBtn" type="button" onclick="V8623.downloadExcel()">Descargar Excel</button><button class="btn ghost" id="v8623ModalPdfBtn" type="button" onclick="V8623.downloadPdf()">Descargar PDF</button></div></div>';document.body.appendChild(wrap);wrap.addEventListener('click',function(e){if(e.target===wrap)closeManager();});return wrap;
  }
  function groupHtml(title,sub,rs,leader){if(!rs.length)return '';return '<div class="v8623GroupTitle"><h4>'+esc(title)+'</h4><span>'+esc(sub)+'</span></div><div class="v8623ProductList">'+rs.map(function(r){return productCard(r,leader);}).join('')+'</div>';}
  function discountOptions(r){var vals=STANDARD_DISCOUNTS.filter(function(x){return x>=num(r.suggested)-.049&&x>num(r.currentDiscount)+.049;});if(vals.indexOf(num(r.requestedDiscount))<0)vals.push(num(r.requestedDiscount));vals.sort(function(a,b){return a-b;});return vals.map(function(x){return '<option value="'+x+'"'+(x===num(r.requestedDiscount)?' selected':'')+'>'+x+'%</option>';}).join('');}
  function productCard(r,leader){var k=itemKey(r.storeCode,r.code),img=r.image?'<img src="'+esc(r.image)+'" alt="'+esc(r.name)+'" onerror="this.parentNode.innerHTML=\'▧\'">':'▧';return '<div class="v8623ProductCard '+(leader?'leader':'admin')+'" data-key="'+esc(k)+'"><div class="v8623ProductImage">'+img+'</div><div class="v8623ProductMain"><b>'+esc(r.name)+'</b><span class="code">'+esc(r.code)+'</span><div class="v8623ProductMeta">'+esc(r.storeName)+'<br>'+esc(r.category)+' · '+esc(r.line)+' · '+esc(r.subline)+'<br>'+esc(r.typeLabel)+' · '+esc(r.ageLabel)+'</div></div><div class="v8623ProductFacts"><div class="v8623Fact"><label>Stock</label><b>'+fInt(r.stock)+' u</b></div><div class="v8623Fact"><label>Desc. actual</label><b>'+(r.currentDiscount==null?'—':(Math.round(r.currentDiscount*10)/10)+'%')+'</b></div><div class="v8623Fact"><label>Sugerido</label><b>'+fInt(r.suggested)+'%</b></div><div class="v8623Fact"><label>Brecha</label><b>+'+(Math.round(Math.max(0,r.gap)*10)/10)+' pp</b></div><div class="v8623Fact"><label>Precio lista</label><b>'+(r.priceList==null?'—':money(r.priceList))+'</b></div><div class="v8623Fact"><label>Venta 3 meses</label><b>'+money(r.sales)+'</b></div></div><div class="v8623ProductEdit"><label>Descuento solicitado</label><select class="v8623DiscountSelect" onchange="V8623.updateDiscount(\''+esc(k)+'\',this.value)">'+discountOptions(r)+'</select><textarea class="v8623Note" maxlength="420" placeholder="Observacion o justificacion para la gestion..." oninput="V8623.updateNote(\''+esc(k)+'\',this.value)">'+esc(r.note)+'</textarea></div><div class="v8623ProductSide"><span class="v8623Resp '+(leader?'leader':'admin')+'">'+(leader?'Lider de Area<br>&gt; 50%':'Administrador<br>&le; 50%')+'</span><button class="v8623MiniBtn" type="button" onclick="V8623.openProduct(\''+esc(r.storeCode)+'\',\''+esc(r.code)+'\')">Ver ficha</button><button class="v8623MiniBtn remove" type="button" onclick="V8623.remove(\''+esc(r.storeCode)+'\',\''+esc(r.code)+'\')">Quitar</button></div></div>';}
  function renderManager(){var body=document.getElementById('v8623ManagerBody');if(!body)return;var rs=records(),t=totals(rs);if(!rs.length){body.innerHTML='<div class="v8623Empty"><b>No hay productos en la lista de gestion.</b><div style="margin-top:5px">Selecciona productos desde la tabla de Markdown.</div></div>';return;}var admins=rs.filter(function(r){return r.requestedDiscount<=50;}),leaders=rs.filter(function(r){return r.requestedDiscount>50;});body.innerHTML='<div class="v8623PreviewSummary"><div class="v8623PreviewKpi"><label>Productos</label><b>'+fInt(t.count)+'</b></div><div class="v8623PreviewKpi"><label>Unidades</label><b>'+fInt(t.units)+'</b></div><div class="v8623PreviewKpi"><label>Valor inventario</label><b>'+money(t.value)+'</b></div><div class="v8623PreviewKpi admin"><label>Administrador <=50%</label><b>'+fInt(t.admin)+'</b></div><div class="v8623PreviewKpi leader"><label>Lider >50%</label><b>'+fInt(t.leader)+'</b></div></div><div class="v8623PolicyNotice"><span>ℹ</span><div><b>Regla de autorizacion:</b> el Administrador puede aplicar descuentos hasta el 50%. Todo descuento solicitado superior al 50% queda identificado para evaluacion y actualizacion por el Lider de Area, de acuerdo con las politicas vigentes.</div></div>'+groupHtml('Gestion del Administrador','Descuento solicitado hasta 50%',admins,false)+groupHtml('Escalamiento al Lider de Area','Descuento solicitado superior al 50%',leaders,true);}
  function openManager(){ensureManager();renderManager();document.getElementById('v8623MarkdownManageModal').classList.add('on');}
  function closeManager(){var m=document.getElementById('v8623MarkdownManageModal');if(m)m.classList.remove('on');}
  function updateDiscount(k,v){var it=memory.items[k];if(!it)return;it.requestedDiscount=num(v);save();renderManager();enhanceTable();}
  function updateNote(k,v){var it=memory.items[k];if(!it)return;it.note=txt(v);save();}
  function excelObservation(r){
    var current=r.currentDiscount==null?'sin dato':(Math.round(num(r.currentDiscount)*10)/10)+'%';
    var suggested=Math.round(num(r.suggested))+'%';
    var gap=Math.max(0,num(r.suggested)-num(r.currentDiscount));
    var text=txt(r.policyApplied)+' · '+txt(r.ruleApplied)+'. '+current+' → '+suggested+' (+'+(Math.round(gap*10)/10)+' pp).';
    if(txt(r.note).trim())text+=' Obs: '+txt(r.note).trim();
    return text;
  }
  var xlsxPromise8623=null;
  function ensureXlsx8623(){
    if(window.XLSX&&window.XLSX.utils&&window.XLSX.writeFile)return Promise.resolve(window.XLSX);
    if(xlsxPromise8623)return xlsxPromise8623;
    xlsxPromise8623=new Promise(function(resolve,reject){
      var existing=document.querySelector('script[data-v8623-xlsx]');
      if(existing){existing.addEventListener('load',function(){resolve(window.XLSX);},{once:true});existing.addEventListener('error',function(){reject(new Error('No fue posible cargar el motor Excel.'));},{once:true});return;}
      var sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';sc.async=true;sc.setAttribute('data-v8623-xlsx','1');sc.onload=function(){window.XLSX?resolve(window.XLSX):reject(new Error('Motor Excel no disponible.'));};sc.onerror=function(){reject(new Error('No fue posible cargar el motor Excel.'));};document.head.appendChild(sc);
    });
    return xlsxPromise8623;
  }
  async function downloadExcel(){
    var rs=records();if(!rs.length){if(typeof toast==='function')toast('Selecciona al menos un producto para generar el Excel.','err');return;}
    setProgress(true,'Preparando Excel con '+rs.length+' producto(s)...');
    try{
      var XLSX42=await ensureXlsx8623();
      var rows=[['AGENCIA','COD','DCTO_LISTA','OBSERVACION']];
      rs.forEach(function(r){rows.push([txt(r.storeCode),txt(r.code),Math.round(num(r.suggested)),excelObservation(r)]);});
      var ws=XLSX42.utils.aoa_to_sheet(rows);
      ws['!cols']=[{wch:13},{wch:16},{wch:14},{wch:95}];
      for(var i=2;i<=rows.length;i++){
        if(ws['A'+i]){ws['A'+i].t='s';ws['A'+i].v=txt(rows[i-1][0]);}
        if(ws['B'+i]){ws['B'+i].t='s';ws['B'+i].v=txt(rows[i-1][1]);}
        if(ws['C'+i]){ws['C'+i].t='n';ws['C'+i].v=Math.round(num(rows[i-1][2]));ws['C'+i].z='0';}
        if(ws['D'+i]){ws['D'+i].t='s';}
      }
      var wb=XLSX42.utils.book_new();XLSX42.utils.book_append_sheet(wb,ws,'Plantilla');
      var day=new Date().toISOString().slice(0,10);
      XLSX42.writeFile(wb,'plantilla_cargue_masivo_Markdown_'+day+'.xlsx',{compression:true});
      if(typeof toast==='function')toast('Excel de cargue masivo generado con '+rs.length+' producto(s).','ok');
    }catch(err){console.error('V86.43 Excel',err);if(typeof toast==='function')toast('No fue posible generar el Excel: '+(err&&err.message?err.message:'error desconocido'),'err');else alert('No fue posible generar el Excel.');}
    finally{setProgress(false);}
  }
  function openProduct(sc,c){closeManager();try{if(sc!==currentStore()&&typeof setStore==='function')setStore(sc);}catch(_){}setTimeout(function(){try{if(typeof window.openMarkdownProduct8618==='function')window.openMarkdownProduct8618(c);else if(typeof openInventoryProduct==='function')openInventoryProduct(c);}catch(err){console.error(err);}},120);}
  function setProgress(on,msg){var p=document.getElementById('v8623PdfProgress'),b=document.getElementById('v8623ModalPdfBtn');if(p){p.classList.toggle('on',!!on);p.textContent=msg||'Preparando PDF...';}if(b)b.disabled=!!on;}
  function ensureJsPdf(){return new Promise(function(resolve,reject){if(window.jspdf&&window.jspdf.jsPDF)return resolve(window.jspdf.jsPDF);var old=document.getElementById('v8623JsPdfLoader');if(old){var n=0,t=setInterval(function(){n++;if(window.jspdf&&window.jspdf.jsPDF){clearInterval(t);resolve(window.jspdf.jsPDF);}else if(n>80){clearInterval(t);reject(new Error('timeout'));}},100);return;}var s=document.createElement('script');s.id='v8623JsPdfLoader';s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s.async=true;s.onload=function(){window.jspdf&&window.jspdf.jsPDF?resolve(window.jspdf.jsPDF):reject(new Error('jspdf'));};s.onerror=function(){reject(new Error('network'));};document.head.appendChild(s);setTimeout(function(){if(!(window.jspdf&&window.jspdf.jsPDF))reject(new Error('timeout'));},9000);});}
  function imageData(url){return new Promise(function(resolve){if(!/^https?:\/\//i.test(url||''))return resolve(null);var img=new Image(),done=false,t=setTimeout(function(){if(!done){done=true;resolve(null);}},1800);img.crossOrigin='anonymous';img.onload=function(){if(done)return;try{var max=220,ratio=Math.min(1,max/img.width,max/img.height),w=Math.max(1,Math.round(img.width*ratio)),h=Math.max(1,Math.round(img.height*ratio)),cv=document.createElement('canvas');cv.width=w;cv.height=h;var ctx=cv.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);var data=cv.toDataURL('image/jpeg',.78);done=true;clearTimeout(t);resolve({data:data,w:w,h:h});}catch(_){done=true;clearTimeout(t);resolve(null);}};img.onerror=function(){if(!done){done=true;clearTimeout(t);resolve(null);}};img.src=url;});}
  function split(doc,text,width){return doc.splitTextToSize(txt(text).replace(/\s+/g,' ').trim()||'—',width);}
  function pdfHeader(doc,pageNo,totalPages,title){doc.setFillColor(23,59,99);doc.rect(0,0,210,18,'F');doc.setFillColor(229,50,50);doc.rect(0,0,5,18,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text(title||'LLAVERO - Gestion Markdown',12,8);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('Inventarios Jamar · Corte '+cutDate(),12,13);doc.text('Pagina '+pageNo+' de '+totalPages,198,13,{align:'right'});doc.setTextColor(24,56,95);}
  function drawSummaryPage(doc,rs){var t=totals(rs),y=28;doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(24,56,95);doc.text('Solicitud y gestion de descuentos Markdown',14,y);y+=7;doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(90,101,116);doc.text('Documento de apoyo para organizar la gestion del Administrador y los escalamientos al Lider de Area.',14,y);y+=10;var cards=[['Productos',fInt(t.count)],['Unidades',fInt(t.units)],['Valor inventario',money(t.value)],['Administrador <=50%',fInt(t.admin)],['Lider >50%',fInt(t.leader)],['Impacto solicitado',money(t.impact)]];cards.forEach(function(c,i){var col=i%3,row=Math.floor(i/3),x=14+col*61,y0=y+row*24;doc.setFillColor(247,249,252);doc.setDrawColor(226,230,235);doc.roundedRect(x,y0,56,19,2,2,'FD');doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(115,125,138);doc.text(c[0].toUpperCase(),x+3,y0+5);doc.setFontSize(11);doc.setTextColor(24,56,95);doc.text(c[1],x+3,y0+13,{maxWidth:50});});y+=54;doc.setFillColor(255,247,229);doc.setDrawColor(237,211,161);doc.roundedRect(14,y,182,24,2,2,'FD');doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(120,82,13);doc.text('REGLA DE AUTORIZACION',18,y+6);doc.setFont('helvetica','normal');doc.setFontSize(8);var notice=split(doc,'El Administrador puede aplicar descuentos hasta el 50%. Todo descuento solicitado superior al 50% debe ser evaluado y actualizado por el Lider de Area de acuerdo con las politicas vigentes.',172);doc.text(notice,18,y+11);y+=32;function group(label,color,rows){doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(color[0],color[1],color[2]);doc.text(label+' ('+rows.length+')',14,y);y+=5;doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(65,79,98);rows.slice(0,15).forEach(function(r){if(y>273)return;doc.text('• '+r.code+' - '+r.name,18,y,{maxWidth:125});doc.text(fInt(r.requestedDiscount)+'%',191,y,{align:'right'});y+=5;});if(rows.length>15){doc.setTextColor(115,125,138);doc.text('... y '+(rows.length-15)+' productos adicionales en las fichas siguientes.',18,y);y+=6;}y+=4;}group('Gestion Administrador <=50%',[21,159,112],rs.filter(function(r){return r.requestedDiscount<=50;}));group('Escalamiento Lider de Area >50%',[217,21,21],rs.filter(function(r){return r.requestedDiscount>50;}));doc.setTextColor(115,125,138);doc.setFontSize(7.5);doc.text('Generado desde LLAVERO · '+new Date().toLocaleString('es-CO'),14,286);}
  function drawProductCard(doc,r,img,y){var leader=r.requestedDiscount>50,h=116;doc.setDrawColor(224,229,235);doc.setFillColor(255,255,255);doc.roundedRect(12,y,186,h,2.5,2.5,'FD');doc.setFillColor(leader?229:21,leader?50:159,leader?50:112);doc.rect(12,y,3,h,'F');var ix=18,iy=y+7,iw=32,ih=32;if(img&&img.data){try{doc.addImage(img.data,'JPEG',ix,iy,iw,ih,undefined,'FAST');}catch(_){doc.setFillColor(246,247,249);doc.rect(ix,iy,iw,ih,'F');}}else{doc.setFillColor(246,247,249);doc.rect(ix,iy,iw,ih,'F');doc.setTextColor(155,162,172);doc.setFontSize(16);doc.text('IMG',ix+iw/2,iy+18,{align:'center'});}doc.setTextColor(24,56,95);doc.setFont('helvetica','bold');doc.setFontSize(10.5);doc.text(split(doc,r.name,94).slice(0,2),54,y+9);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(105,115,128);doc.text('Codigo '+r.code+' · '+r.storeName,54,y+20,{maxWidth:95});doc.text(split(doc,r.category+' · '+r.line+' · '+r.subline,96).slice(0,2),54,y+25);doc.setFillColor(leader?255:233,leader?240:248,leader?240:242);doc.setDrawColor(leader?245:195,leader?205:232,leader?205:220);doc.roundedRect(154,y+7,38,16,2,2,'FD');doc.setFont('helvetica','bold');doc.setFontSize(7.2);doc.setTextColor(leader?185:14,leader?29:122,leader?34:87);doc.text(leader?'LIDER DE AREA':'ADMINISTRADOR',173,y+12,{align:'center'});doc.setFontSize(10);doc.text(fInt(r.requestedDiscount)+'%',173,y+19,{align:'center'});var list=num(r.priceList),current=num(r.currentDiscount),requested=num(r.requestedDiscount),reqGap=Math.max(0,requested-current),reqImpact=list?list*num(r.stock)*reqGap/100:num(r.value)*reqGap/100;var projectedPrice=list?Math.max(0,list*(1-requested/100)):null;var currentPrice=list?Math.max(0,list*(1-current/100)):null;var customerSaving=list?Math.max(0,list-projectedPrice):null;doc.setFillColor(247,248,252);doc.setDrawColor(229,233,239);doc.roundedRect(18,y+34,174,16,2,2,'FD');doc.setFont('helvetica','bold');doc.setFontSize(6.4);doc.setTextColor(120,130,143);doc.text('COMO QUEDARIA EL PRODUCTO CON EL DESCUENTO SOLICITADO',22,y+39);doc.setFontSize(10.5);doc.setTextColor(24,56,95);doc.text(projectedPrice==null?'—':money(projectedPrice),22,y+46);doc.setFont('helvetica','normal');doc.setFontSize(7.2);doc.setTextColor(95,104,117);var summary='Precio lista '+(list?money(list):'—')+' · descuento '+fInt(requested)+'%';if(customerSaving!=null)summary+=' · ahorro '+money(customerSaving);doc.text(split(doc,summary,118).slice(0,2),68,y+42);if(currentPrice!=null){doc.setFont('helvetica','bold');doc.setTextColor(leader?185:14,leader?29:122,leader?34:87);doc.text('PRECIO FINAL',173,y+39,{align:'center'});doc.setFontSize(8.5);doc.text(money(projectedPrice),173,y+45,{align:'center'});}var facts=[['Stock',fInt(r.stock)+' u'],['Actual',r.currentDiscount==null?'—':(Math.round(r.currentDiscount*10)/10)+'%'],['Sugerido',fInt(r.suggested)+'%'],['Brecha','+'+(Math.round(Math.max(0,r.gap)*10)/10)+' pp'],['Precio lista',r.priceList==null?'—':money(r.priceList)],['Precio actual',currentPrice==null?'—':money(currentPrice)],['Responsable',leader?'Lider':'Admin'],['Impacto adicional',money(reqImpact)]];var fy=y+54;facts.forEach(function(f,i){var col=i%4,row=Math.floor(i/4),x=18+col*44.5,yy=fy+row*15.5;doc.setFillColor(248,249,251);doc.setDrawColor(233,236,240);doc.roundedRect(x,yy,41,12,1.5,1.5,'FD');doc.setFont('helvetica','bold');doc.setFontSize(6.2);doc.setTextColor(120,130,143);doc.text(f[0].toUpperCase(),x+2,yy+4);doc.setFontSize(7.5);doc.setTextColor(34,57,82);doc.text(split(doc,f[1],37).slice(0,2),x+2,yy+8.5);});var ty=y+86;doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(80,91,106);doc.text('MOTIVO',18,ty);doc.setFont('helvetica','normal');doc.setTextColor(55,68,86);doc.text(split(doc,r.reason,174).slice(0,2),18,ty+4);doc.setFont('helvetica','bold');doc.setTextColor(80,91,106);doc.text('OBSERVACION / JUSTIFICACION',18,ty+13);doc.setFont('helvetica','normal');doc.setTextColor(55,68,86);doc.text(split(doc,r.note||'Sin observacion adicional.',174).slice(0,2),18,ty+17);return h;}
  async function createPdf(rs){var JsPDF=await ensureJsPdf(),doc=new JsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true}),images=await Promise.all(rs.map(function(r){return imageData(r.image);}));var productPages=Math.ceil(rs.length/2),totalPages=1+productPages;pdfHeader(doc,1,totalPages,'LLAVERO - Gestion Markdown');drawSummaryPage(doc,rs);for(var i=0;i<rs.length;i++){if(i%2===0){doc.addPage();pdfHeader(doc,2+Math.floor(i/2),totalPages,'LLAVERO - Fichas de producto');}drawProductCard(doc,rs[i],images[i],26+(i%2)*126);}var name='Solicitud_Markdown_'+cutDate().replace(/[^0-9A-Za-z]+/g,'-')+'_'+new Date().toISOString().slice(0,10)+'.pdf';doc.save(name);}
  function printFallback(rs){var t=totals(rs),w=window.open('','_blank');if(!w)return alert('El navegador bloqueo la ventana de impresion. Habilita ventanas emergentes para generar el PDF.');var cards=rs.map(function(r){var list=num(r.priceList),requested=num(r.requestedDiscount),projected=list?Math.max(0,list*(1-requested/100)):null,saving=list?Math.max(0,list-projected):null;return '<section class="p '+(r.requestedDiscount>50?'leader':'admin')+'"><div class="head"><div><b>'+esc(r.name)+'</b><small>'+esc(r.code)+' · '+esc(r.storeName)+'</small></div><strong>'+fInt(r.requestedDiscount)+'%</strong></div><div class="hero"><div><label>Precio final con descuento sugerido</label><b>'+(projected==null?'—':money(projected))+'</b><small>Precio lista '+(list?money(list):'—')+' · ahorro '+(saving==null?'—':money(saving))+'</small></div></div><div class="grid"><span>Stock <b>'+fInt(r.stock)+' u</b></span><span>Antiguedad <b>'+esc(r.ageLabel)+'</b></span><span>Precio lista <b>'+(list?money(list):'—')+'</b></span><span>Actual <b>'+(r.currentDiscount==null?'—':(Math.round(r.currentDiscount*10)/10)+'%')+'</b></span><span>Sugerido <b>'+fInt(r.suggested)+'%</b></span><span>Brecha <b>+'+(Math.round(Math.max(0,r.gap)*10)/10)+' pp</b></span></div><p><b>Motivo:</b> '+esc(r.reason)+'</p><p><b>Observacion:</b> '+esc(r.note||'Sin observacion adicional.')+'</p><em>'+(r.requestedDiscount>50?'Responsable: Lider de Area':'Responsable: Administrador')+'</em></section>';}).join('');w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Solicitud Markdown</title><style>@page{size:A4;margin:12mm}body{font:12px Arial;color:#24364b}h1{color:#173b63}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.summary div{border:1px solid #ddd;padding:9px;border-radius:8px}.p{border:1px solid #ddd;border-left:5px solid #159f70;border-radius:9px;padding:10px;margin:0 0 10px;break-inside:avoid}.p.leader{border-left-color:#d91515}.head{display:flex;justify-content:space-between;gap:12px}.head b{font-size:14px}.head small{display:block;color:#7b818b;margin-top:3px}.head strong{font-size:20px;color:#e53232}.hero{background:#f5f7fb;border:1px solid #e1e7ef;padding:10px 12px;border-radius:10px;margin:9px 0}.hero label{display:block;color:#6e7b8a;font-size:11px;font-weight:bold;text-transform:uppercase;margin-bottom:4px}.hero b{display:block;color:#173b63;font-size:22px;line-height:1.1}.hero small{display:block;color:#6e7b8a;margin-top:4px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:9px 0}.grid span{background:#f5f7fb;padding:6px;border-radius:6px}p{margin:5px 0;line-height:1.4}em{font-style:normal;font-weight:bold}</style></head><body><h1>Solicitud y gestion de descuentos Markdown</h1><p>Corte '+esc(cutDate())+' · Generado '+esc(new Date().toLocaleString('es-CO'))+'</p><div class="summary"><div>Productos<br><b>'+fInt(t.count)+'</b></div><div>Administrador <=50%<br><b>'+fInt(t.admin)+'</b></div><div>Lider >50%<br><b>'+fInt(t.leader)+'</b></div><div>Valor inventario<br><b>'+money(t.value)+'</b></div></div>'+cards+'<script>window.onload=function(){setTimeout(function(){window.print();},250)}<\/script></body></html>');w.document.close();}
  async function downloadPdf(){var rs=records();if(!rs.length)return;setProgress(true,'Preparando '+rs.length+' producto(s)...');try{await createPdf(rs);if(typeof toast==='function')toast('PDF de gestion Markdown generado','ok');}catch(err){console.warn('V86.23 PDF: se usa impresion como respaldo',err);printFallback(rs);if(typeof toast==='function')toast('No fue posible cargar el motor PDF. Se abrio la vista de impresion para guardar como PDF.','err');}finally{setProgress(false);}}
  function install(){if(installed)return;installed=true;load();baseView=window.viewMarkdown8617;baseDraw=window.drawMarkdown8617;window.viewMarkdown8617=function(){var h=baseView.apply(this,arguments);if(h.indexOf('v8623ManageBar')<0)h=h.replace('<div id="markdown-table-8618"></div>',manageBarHtml()+'<div id="markdown-table-8618"></div>');return h;};window.drawMarkdown8617=function(){var out=baseDraw.apply(this,arguments);setTimeout(enhanceTable,0);return out;};window.V8623={add:add,remove:function(sc,c){remove(sc,c);enhanceTable();renderManager();},clearAll:clearAll,selectVisible:selectVisible,openManager:openManager,closeManager:closeManager,updateDiscount:updateDiscount,updateNote:updateNote,openProduct:openProduct,downloadExcel:downloadExcel,downloadPdf:downloadPdf,render:renderManager};try{if((document.body.dataset.v8620View||'')==='markdown'){var c=document.getElementById('content');if(c){c.innerHTML=window.viewMarkdown8617();window.drawMarkdown8617();}}}catch(err){console.error('V86.23 render',err);}mark23();console.info('LLAVERO V86.50 · Markdown estable + Dashboard general combinado');}
  function mark23(){try{var v='V86.43',r=document.documentElement;r.setAttribute('data-llavero-build',v);r.setAttribute('data-llavero-app-version',v);r.setAttribute('data-llavero-views',v);document.title='Llavero · Inventarios Jamar · 05/08/2026 · '+v;var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='05/08/2026 · '+v;}catch(_){}}
  function readyV8623(){return !!(window.V8620&&typeof window.viewMarkdown8617==='function'&&typeof window.drawMarkdown8617==='function');}
  function bootV8623(){if(installed)return;if(!readyV8623())return;var run=function(){install();mark23();};if(window.requestIdleCallback)requestIdleCallback(run,{timeout:700});else setTimeout(run,80);}
  if(!readyV8623())window.addEventListener('llavero:v8620-ready',bootV8623,{once:true});
  bootV8623();
  setTimeout(bootV8623,1600);
})();


/* ==== llaveroV8624PerformanceJs ==== */

(function(){
  'use strict';
  var V='V86.43';
  function mark(){try{var r=document.documentElement;r.setAttribute('data-llavero-build',V);r.setAttribute('data-llavero-app-version',V);r.setAttribute('data-llavero-views',V);document.title='Llavero · Inventarios Jamar · 05/08/2026 · '+V;var c=document.querySelector('.appVersionChip b');if(c)c.textContent='05/08/2026 · '+V;}catch(_){}}
  function focusLogin(){try{var m=document.getElementById('leaderModal'),u=document.getElementById('accessUser');if(m&&m.classList.contains('on')&&u&&!u.matches(':focus'))requestAnimationFrame(function(){u.focus({preventScroll:true});});}catch(_){}}
  mark();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){mark();focusLogin();},{once:true});else focusLogin();
  window.addEventListener('llavero:bootstrapped',function(){mark();focusLogin();},{once:true});
  window.addEventListener('llavero:v8620-ready',mark,{once:true});
  console.info('LLAVERO V86.43 · optimizacion de arranque activa: sin bucles de version ni observadores globales redundantes.');
})();


/* ==== llaveroV8625MarkdownPerformanceJs ==== */

(function(){
  'use strict';
  var V='V86.43',timer=0;
  window.V8625Markdown={
    schedule:function(){clearTimeout(timer);timer=setTimeout(function(){if(typeof window.drawMarkdown8617==='function')window.drawMarkdown8617();},170);},
    reset:function(){var p=window.__LLAVERO_MD8625_RENDER__;if(p)p.limit=80;}
  };
  function mark(){try{var r=document.documentElement;r.setAttribute('data-llavero-build',V);r.setAttribute('data-llavero-app-version',V);r.setAttribute('data-llavero-views',V);document.title='Llavero · Inventarios Jamar · 05/08/2026 · '+V;var c=document.querySelector('.appVersionChip b');if(c)c.textContent='05/08/2026 · '+V;}catch(_){}}
  mark();
  window.addEventListener('llavero:v8620-ready',mark,{once:true});
  console.info('LLAVERO V86.43 · Markdown con Excel de cargue masivo, búsqueda con debounce y gestión optimizada.');
})();


/* ==== llaveroV8631MarkdownActualJs ==== */

(function(){
  'use strict';
  window.copyMarkdown8617=function(code){try{var rows=typeof window.mdRows8618==='function'?window.mdRows8618(window.CUR||CUR):[],r=rows.find(function(x){return String(x.code)===String(code);});if(!r)return;function p(v){return v==null?'—':(Math.round(Number(v)*10)/10).toFixed(1).replace('.0','')+'%';}var txt='Producto: '+r.code+' · '+r.name+'\nTienda: '+(((window.S||S)[window.CUR||CUR]||{}).name||window.CUR||CUR)+'\nDescuento actual: '+p(r.currentDiscount)+'\nDescuento sugerido: '+p(r.discount)+'\nBrecha: '+(r.gap==null?'—':((r.gap>0?'+':'')+(Math.round(r.gap*10)/10).toFixed(1).replace('.0','')+' pp'))+'\nEstado: '+r.statusLabel+'\nPolítica: '+r.policyApplied+'\nRegla: '+r.ruleApplied+'\nAcción: '+r.actionText;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(function(){if(typeof toast==='function')toast('Diagnóstico copiado.','ok');});else if(typeof toast==='function')toast(txt);}catch(err){console.error(err);}};
  function mark(){try{var v='V86.43',r=document.documentElement;r.setAttribute('data-llavero-build',v);r.setAttribute('data-llavero-app-version',v);r.setAttribute('data-llavero-views',v);document.title='Llavero · Inventarios Jamar · 05/08/2026 · '+v;var c=document.querySelector('.appVersionChip b');if(c)c.textContent='05/08/2026 · '+v;}catch(_){}}
  mark();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mark,{once:true});window.addEventListener('llavero:v8620-ready',mark,{once:true});
})();


/* ==== llaveroV8634RepairAndVersionJs ==== */

(function(){
  'use strict';
  var V='V86.43';
  function mark(){try{var r=document.documentElement;r.setAttribute('data-llavero-build',V);r.setAttribute('data-llavero-app-version',V);r.setAttribute('data-llavero-views',V);window.LLAVERO_BUILD=V;document.title='Llavero · Inventarios Jamar · 05/08/2026 · '+V;var c=document.querySelector('.appVersionChip b');if(c)c.textContent='05/08/2026 · '+V;}catch(_){}}
  function refreshMarkdown(){try{var body=document.body;if(!body||body.dataset.v8620View!=='markdown')return;var p=window.__LLAVERO_MD8625_RENDER__;if(p)p.lastSig='';if(typeof window.drawMarkdown8617==='function')window.drawMarkdown8617();}catch(e){console.error('V86.43 Markdown refresh',e);}}
  window.LLAVERO_DISCOUNT_LOOKUP=function(sc,c){return window.discountActual18?window.discountActual18(sc,c):null;};
  document.addEventListener('change',function(e){if(e.target&&e.target.id==='store')setTimeout(refreshMarkdown,0);},true);
  window.addEventListener('llavero:bootstrapped',function(){mark();setTimeout(refreshMarkdown,80);},{once:true});
  window.addEventListener('llavero:v8620-ready',function(){mark();setTimeout(refreshMarkdown,80);},{once:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mark,{once:true});else mark();
  setTimeout(mark,1000);
})();


/* ==== llaveroV8636MarkdownRuntimeRepair ==== */

(function(){
  'use strict';
  var V='V86.43';
  function mark(){try{var r=document.documentElement;r.setAttribute('data-llavero-build',V);r.setAttribute('data-llavero-app-version',V);r.setAttribute('data-llavero-views',V);window.LLAVERO_BUILD=V;document.title='Llavero · Inventarios Jamar · 05/08/2026 · '+V;var c=document.querySelector('.appVersionChip b');if(c)c.textContent='05/08/2026 · '+V;}catch(_){}}
  function lookup(sc,c){
    try{
      if(typeof window.discountActual18==='function')return window.discountActual18(sc,c);
      var cat=window.__LLAVERO_DISCOUNT_DATA__;if(!cat)return null;
      sc=String(sc||window.CUR||'').trim();c=String(c==null?'':c).trim();
      var src=(cat.map&&cat.map[sc])||sc,a=cat.rows&&cat.rows[src]&&cat.rows[src][c];if(!a)return null;
      return {precioLista:a[0],precioOferta:a[1],precioConPromo:a[2],descuentoComercial:a[3],descuentoOfertaSistema:a[4],descuentoAdministrado:a[5],descuentoEfectivo:a[6],ultimaVenta:a[7]||'',fechaActualizacion:a[8]||'',usuarioActualizacion:a[9]||''};
    }catch(_){return null;}
  }
  window.LLAVERO_DISCOUNT_LOOKUP=lookup;
  window.LLAVERO_MARKDOWN_CURRENT_DISCOUNT=function(sc,c){var d=lookup(sc,c);if(!d)return null;return d.descuentoAdministrado==null?null:Number(d.descuentoAdministrado);};
  function normalizeHeader(){
    try{
      var root=document.getElementById('markdown-table-8618'),table=root&&root.querySelector('table');if(!table||!table.tHead)return;
      var ths=table.tHead.rows[0]&&table.tHead.rows[0].cells;if(!ths)return;
      for(var i=0;i<ths.length;i++){
        var t=(ths[i].textContent||'').trim().toLowerCase();
        if(t==='desc. actual'||t==='desc. administrado'||t==='descuento administrado')ths[i].textContent='Descuento actual';
      }
    }catch(_){}
  }
  function refresh(){try{if(document.body&&document.body.dataset.v8620View==='markdown'&&typeof window.drawMarkdown8617==='function'){var p=window.__LLAVERO_MD8625_RENDER__;if(p)p.lastSig='';window.drawMarkdown8617();setTimeout(normalizeHeader,0);}}catch(e){console.error('V86.43 Markdown repair',e);}}
  mark();
  window.addEventListener('llavero:bootstrapped',function(){mark();setTimeout(refresh,120);},{once:true});
  window.addEventListener('llavero:v8620-ready',function(){mark();setTimeout(refresh,120);},{once:true});
  document.addEventListener('change',function(e){if(e.target&&e.target.id==='store')setTimeout(refresh,20);},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mark,{once:true});else mark();
})();


/* ==== llaveroV8653ScrollFixJs ==== */

(function(){
  'use strict';
  var V='V86.53', CUT='11/08/2026';
  function modalOpen(){
    try{
      var sel='.v80ModalBack.on,.modalBack.on,#rangeModal.on,#inventoryProductModal.on,#imageModal.on,[class*="ModalBack"].on,[class*="modalBack"].on,[id*="ModalBack"].on';
      var nodes=document.querySelectorAll(sel);
      for(var i=0;i<nodes.length;i++){
        var cs=getComputedStyle(nodes[i]);
        if(cs.display!=='none'&&cs.visibility!=='hidden')return true;
      }
    }catch(_){}
    return false;
  }
  function restoreScroll(){
    try{
      if(!document.body)return;
      if(!modalOpen()){
        if(document.body.style.overflow==='hidden')document.body.style.overflow='';
        if(document.body.style.overflowY==='hidden')document.body.style.overflowY='';
        document.documentElement.style.overflowY='auto';
      }
    }catch(_){}
  }
  function mark(){
    try{
      window.LLAVERO_BUILD=V;
      document.documentElement.setAttribute('data-llavero-build',V);
      document.documentElement.setAttribute('data-llavero-app-version',V);
      document.title='Llavero · Inventarios Jamar · '+CUT+' · '+V;
      var c=document.querySelector('.appVersionChip b');if(c)c.textContent=CUT+' · '+V;
    }catch(_){}
    restoreScroll();
  }
  function start(){
    mark();
    [80,250,650,1300,2400].forEach(function(ms){setTimeout(restoreScroll,ms);});
    try{
      var obs=new MutationObserver(function(){setTimeout(restoreScroll,0);});
      obs.observe(document.body,{attributes:true,attributeFilter:['style']});
    }catch(_){}
    document.addEventListener('click',function(){setTimeout(restoreScroll,80);},true);
    var v8653ScrollThrottled=false;
    function restoreScrollThrottled(){if(v8653ScrollThrottled)return;v8653ScrollThrottled=true;setTimeout(function(){v8653ScrollThrottled=false;restoreScroll();},200);}
    window.addEventListener('wheel',restoreScrollThrottled,{passive:true});
    window.addEventListener('touchstart',restoreScrollThrottled,{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('llavero:bootstrapped',function(){setTimeout(mark,60);},{once:true});
  window.addEventListener('llavero:v8620-ready',function(){setTimeout(mark,60);},{once:true});
  console.info('LLAVERO V86.53 · scroll vertical reparado');
})();


/* ==== llaveroV8654TrackpadScrollJs ==== */

(function(){
  'use strict';
  var V='V86.54',CUT='11/08/2026';
  function mainScroller(){return document.querySelector('.main');}
  function normalize(){
    try{
      var m=mainScroller();
      if(m){
        m.style.overflowY='auto';
        m.style.overflowX='hidden';
        m.style.touchAction='pan-y';
      }
      window.LLAVERO_BUILD=V;
      document.documentElement.setAttribute('data-llavero-build',V);
      document.documentElement.setAttribute('data-llavero-app-version',V);
      document.title='Llavero · Inventarios Jamar · '+CUT+' · '+V;
      var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent=CUT+' · '+V;
    }catch(_){ }
  }
  function start(){
    normalize();
    [80,250,700,1500].forEach(function(ms){setTimeout(normalize,ms);});
    document.addEventListener('click',function(){setTimeout(normalize,50);},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('llavero:bootstrapped',function(){setTimeout(normalize,50);},{once:true});
  window.addEventListener('llavero:v8620-ready',function(){setTimeout(normalize,50);},{once:true});
  console.info('LLAVERO V86.54 · scroll por mousepad y rueda sobre .main');
})();


/* ==== v8658-script ==== */

(function(){
  var installed=false;
  function esc58(v){if(typeof esc==='function')return esc(v);return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function n58(v){return typeof toNum==='function'?toNum(v):(Number(v)||0);}
  function i58(v){return typeof fInt==='function'?fInt(v):Math.round(n58(v)).toLocaleString('es-CO');}
  function m58(v){return typeof fMoneyCOP==='function'?fMoneyCOP(v):('$ '+Math.round(n58(v)).toLocaleString('es-CO'));}
  function code58(v){return typeof safeCode==='function'?safeCode(v):String(v||'').trim();}
  function prod58(c){if(typeof productInfo==='function')return productInfo(c);var p=(window.P&&P[c])||{};return {n:p.n||c,cat:p.cat||'',lin:p.lin||'',sub:p.sub||''};}
  function dates58(){try{return (typeof readDetailHistory==='function'?readDetailHistory():[]).map(function(x){return x&&x.date;}).filter(Boolean).sort();}catch(_){return [];}}
  function snapshots58(){try{return (typeof readDetailHistory==='function'?readDetailHistory():[]).filter(function(x){return x&&x.date&&x.stores;}).slice().sort(function(a,b){return String(a.date).localeCompare(String(b.date));});}catch(_){return [];}}
  function fmtDate58(v){var m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:String(v||'—');}
  function ensureState58(){window.LLV_TRACK=window.LLV_TRACK||{};var ds=dates58();if(!ds.length)return window.LLV_TRACK;var last=ds[ds.length-1],prev=ds[Math.max(0,ds.length-2)];if(ds.indexOf(window.LLV_TRACK.storeFromDate)<0)window.LLV_TRACK.storeFromDate=prev;if(ds.indexOf(window.LLV_TRACK.storeToDate)<0)window.LLV_TRACK.storeToDate=last;if(!window.LLV_TRACK.storeState)window.LLV_TRACK.storeState='rot';if(!window.LLV_TRACK.storeMetric)window.LLV_TRACK.storeMetric='both';if(!window.LLV_TRACK.storeStatus)window.LLV_TRACK.storeStatus='all';return window.LLV_TRACK;}
  function map58(rows){var out={};(rows||[]).forEach(function(r){var c=code58(r&&r[0]);if(!c)return;if(!out[c])out[c]={u:0,v:0,age:-1};out[c].u+=n58(r&&r[1]);out[c].v+=n58(r&&r[2]);out[c].age=Math.max(out[c].age,n58(r&&r[3]));});return out;}
  function status58(r,c,er,ec,metric){if(er&&!ec)return 'recovered';if(!er&&ec)return 'new';var du=n58(c.u)-n58(r.u),dv=n58(c.v)-n58(r.v);if(metric==='units'){if(du<-.0001)return 'partial';if(du>.0001)return 'increased';return 'persistent';}if(metric==='value'){if(dv<-.01)return 'partial';if(dv>.01)return 'increased';return 'persistent';}if(Math.abs(du)<.0001&&Math.abs(dv)<.01)return 'persistent';if((du<=0&&dv<=0)&&(du<0||dv<0))return 'partial';if((du>=0&&dv>=0)&&(du>0||dv>0))return 'increased';return 'mixed';}
  function compare58(store,stateKey,fromDate,toDate,metric){var hs=snapshots58(),a=hs.find(function(x){return x.date===fromDate;}),b=hs.find(function(x){return x.date===toDate;});if(!a||!b)return {fromDate:fromDate,toDate:toDate,items:[],summary:null};var ar=a.stores&&a.stores[store],br=b.stores&&b.stores[store],am=map58(ar&&ar[stateKey]),bm=map58(br&&br[stateKey]),keys=Array.from(new Set(Object.keys(am).concat(Object.keys(bm)))),items=[];keys.forEach(function(c){var er=!!am[c],ec=!!bm[c],r=am[c]||{u:0,v:0,age:-1},n=bm[c]||{u:0,v:0,age:-1},st=status58(r,n,er,ec,metric),p=prod58(c);items.push({c:c,p:p,refU:r.u,curU:n.u,diffU:n.u-r.u,refV:r.v,curV:n.v,diffV:n.v-r.v,refAge:r.age,curAge:n.age,status:st});});function sum(fn){return items.reduce(function(a,x){return a+n58(fn(x));},0);}var refU=sum(function(x){return x.refU;}),curU=sum(function(x){return x.curU;}),refV=sum(function(x){return x.refV;}),curV=sum(function(x){return x.curV;}),newU=sum(function(x){return x.status==='new'?x.curU:0;}),newV=sum(function(x){return x.status==='new'?x.curV:0;}),recU=sum(function(x){return x.status==='recovered'?x.refU:0;}),recV=sum(function(x){return x.status==='recovered'?x.refV:0;}),partU=sum(function(x){return x.refU>0&&x.curU>0?Math.max(0,x.refU-x.curU):0;}),partV=sum(function(x){return x.refV>0&&x.curV>0?Math.max(0,x.refV-x.curV):0;}),adjU=refU+newU,adjV=refV+newV;return {fromDate:fromDate,toDate:toDate,items:items,summary:{refU:refU,curU:curU,newU:newU,recoveredU:recU,partialU:partU,progressU:adjU>0?(adjU-curU)/adjU*100:0,refV:refV,curV:curV,newV:newV,recoveredV:recV,partialV:partV,progressV:adjV>0?(adjV-curV)/adjV*100:0}};}
  function stateLabel58(s){return s==='evac'?'Evacuación':'Rotación';}
  function statusLabel58(s){return {recovered:'Gestionado',partial:'Reducción parcial',new:'Nuevo',increased:'Aumentó',persistent:'Persistente',mixed:'Cambio mixto'}[s]||'Todos';}
  function progress58(v){var cls=v>.05?'good':v<-.05?'bad':'flat',arrow=v>.05?'↑':v<-.05?'↓':'→';return '<span class="trackProgress '+cls+'">'+arrow+' '+Math.abs(v).toFixed(1)+'%</span>';}
  function delta58(v,money){var cls=v<0?'good':v>0?'bad':'flat',prefix=v>0?'+':'';return '<span class="trackingDelta '+cls+'">'+prefix+(money?m58(v):i58(v))+'</span>';}
  function metricCard58(label,badge,values,isMoney,fromDate,toDate){var fmt=isMoney?m58:i58;return '<div class="trackingMeasure"><div class="trackingMeasureHead"><b>'+label+'</b><span>'+badge+'</span></div><div class="trackingMetricGrid"><div class="trackingMetric"><label>Corte inicial<span class="date8658">'+fmtDate58(fromDate)+'</span></label><b>'+fmt(values.ref)+'</b></div><div class="trackingMetric"><label>Corte final<span class="date8658">'+fmtDate58(toDate)+'</span></label><b>'+fmt(values.cur)+'</b></div><div class="trackingMetric good"><label>Gestionado + reducción</label><b>'+fmt(values.recovered+values.partial)+'</b></div><div class="trackingMetric new"><label>Nuevos</label><b>'+fmt(values.newVal)+'</b></div><div class="trackingMetric '+(values.progress>=0?'good':'bad')+'"><label>Avance ajustado</label><b>'+progress58(values.progress)+'</b></div></div></div>';}
  function statusButtons58(items,current){var statuses=['all','recovered','partial','persistent','new','increased','mixed'];return '<div class="trackingStatusBar">'+statuses.map(function(s){var c=s==='all'?items.length:items.filter(function(x){return x.status===s;}).length;return '<button class="trackStatusBtn '+(current===s?'on':'')+'" onclick="setStoreTrackStatus8658(\''+s+'\')"><span class="trackStatusDot"></span><span>'+statusLabel58(s)+'</span><b>'+i58(c)+'</b></button>';}).join('')+'</div>';}
  function rows58(data,metric,status){var rows=data.items.slice();if(status!=='all')rows=rows.filter(function(x){return x.status===status;});var order={recovered:0,partial:1,new:2,increased:3,mixed:4,persistent:5};rows.sort(function(a,b){return (order[a.status]-order[b.status])||Math.abs(b.diffV)-Math.abs(a.diffV)||Math.abs(b.diffU)-Math.abs(a.diffU);});if(!rows.length)return '<div class="trackingEmpty">No hay productos para este resultado.</div>';var unitCols=metric!=='value',valueCols=metric!=='units';return '<div class="trackingTableWrap trackingTableWrapV84"><table class="trackingTable trackingComparisonTableV84"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Resultado</th>'+(unitCols?'<th class="num">Uds. inicial</th><th class="num">Uds. final</th><th class="num">Dif. uds.</th>':'')+(valueCols?'<th class="num">Valor inicial</th><th class="num">Valor final</th><th class="num">Dif. valor</th>':'')+'</tr></thead><tbody>'+rows.map(function(x){var img=typeof imageThumb==='function'?imageThumb(x.c,'sm'):'';return '<tr tabindex="0" role="button" onclick="openTrackingProduct8658(\''+esc58(x.c)+'\')"><td>'+img+'</td><td><span class="code">'+esc58(x.c)+'</span></td><td><div class="trackingProduct">'+esc58(x.p.n)+'</div><div class="trackingMeta">'+esc58(x.p.cat)+' · '+esc58(x.p.lin)+' · '+esc58(x.p.sub)+'</div></td><td><span class="trackingResult '+x.status+'">'+statusLabel58(x.status)+'</span></td>'+(unitCols?'<td class="num">'+i58(x.refU)+'</td><td class="num"><b>'+i58(x.curU)+'</b></td><td class="num">'+delta58(x.diffU,false)+'</td>':'')+(valueCols?'<td class="num">'+m58(x.refV)+'</td><td class="num"><b>'+m58(x.curV)+'</b></td><td class="num">'+delta58(x.diffV,true)+'</td>':'')+'</tr>';}).join('')+'</tbody></table></div>';}
  function options58(current){return dates58().map(function(d){return '<option value="'+esc58(d)+'"'+(d===current?' selected':'')+'>'+fmtDate58(d)+'</option>';}).join('');}
  function panel58(){var T=ensureState58(),store=window.CUR,st=(window.S&&S[store])||{},data=compare58(store,T.storeState,T.storeFromDate,T.storeToDate,T.storeMetric),s=data.summary;if(!s)return '<div class="card trackingPanel" id="storeTrackingPanel"><div class="cbody"><div class="trackingEmpty">No hay información histórica disponible para los cortes seleccionados.</div></div></div>';var head='<div class="card trackingPanel" id="storeTrackingPanel"><div class="chead"><div class="cnum n1">↔</div><div><div class="tt">Seguimiento entre cortes</div><div class="ds">Qué salió, disminuyó, permaneció, ingresó o aumentó en '+stateLabel58(T.storeState)+'</div></div><div class="rt"><span class="badge mut">'+esc58(st.name||store)+'</span></div></div>';var controls='<div class="trackingControls"><div class="trackDateSelectors8658"><div class="trackDateField8658"><label>Corte inicial</label><select onchange="setStoreTrackDate8658(\'from\',this.value)">'+options58(T.storeFromDate)+'</select></div><div class="trackDateField8658"><label>Corte final</label><select onchange="setStoreTrackDate8658(\'to\',this.value)">'+options58(T.storeToDate)+'</select></div><button class="trackBtn trackQuick8658" onclick="setStoreTrackQuick8658(\'previous\')">Anterior</button><button class="trackBtn trackQuick8658" onclick="setStoreTrackQuick8658(\'base\')">Base</button></div><div class="trackingControlGroup"><span class="trackingControlLabel">Estado</span><button class="trackBtn '+(T.storeState==='rot'?'on':'')+'" onclick="setStoreTrackState8658(\'rot\')">Rotación</button><button class="trackBtn '+(T.storeState==='evac'?'on':'')+'" onclick="setStoreTrackState8658(\'evac\')">Evacuación</button></div><div class="trackingControlGroup"><span class="trackingControlLabel">Vista</span><button class="trackBtn '+(T.storeMetric==='units'?'on':'')+'" onclick="setStoreTrackMetric8658(\'units\')">Unidades</button><button class="trackBtn '+(T.storeMetric==='value'?'on':'')+'" onclick="setStoreTrackMetric8658(\'value\')">Pesos</button><button class="trackBtn '+(T.storeMetric==='both'?'on':'')+'" onclick="setStoreTrackMetric8658(\'both\')">Juntos</button></div><div class="trackingReference v8658">Comparando <b>'+fmtDate58(T.storeFromDate)+'</b> → <b>'+fmtDate58(T.storeToDate)+'</b></div></div>';var dual='<div class="trackingDualSummary">'+metricCard58('Vista por unidades','UNIDADES',{ref:s.refU,cur:s.curU,recovered:s.recoveredU,partial:s.partialU,newVal:s.newU,progress:s.progressU},false,T.storeFromDate,T.storeToDate)+metricCard58('Vista por valor del inventario','COP',{ref:s.refV,cur:s.curV,recovered:s.recoveredV,partial:s.partialV,newVal:s.newV,progress:s.progressV},true,T.storeFromDate,T.storeToDate)+'</div>';return head+controls+'<div class="cbody">'+dual+statusButtons58(data.items,T.storeStatus)+rows58(data,T.storeMetric,T.storeStatus)+'<div class="trackingNote"><b>Lectura:</b> el corte inicial es la referencia y el corte final es el resultado. “Gestionado” salió completamente del estado; “Reducción parcial” continúa con menor exposición; “Nuevo” apareció en el corte final; “Aumentó” incrementó su exposición. Producto significa referencia distinta; las unidades se muestran por separado.</div></div></div>';}
  function render58(){var el=document.getElementById('storeTrackingPanel');if(el)el.outerHTML=panel58();}
  window.setStoreTrackDate8658=function(kind,value){var T=ensureState58(),ds=dates58();if(ds.indexOf(value)<0)return;if(kind==='from')T.storeFromDate=value;else T.storeToDate=value;if(String(T.storeFromDate)>String(T.storeToDate)){var x=T.storeFromDate;T.storeFromDate=T.storeToDate;T.storeToDate=x;}T.storeStatus='all';render58();};
  window.setStoreTrackQuick8658=function(mode){var T=ensureState58(),ds=dates58();if(!ds.length)return;T.storeToDate=ds[ds.length-1];T.storeFromDate=mode==='base'?ds[0]:ds[Math.max(0,ds.length-2)];T.storeStatus='all';render58();};
  window.setStoreTrackState8658=function(v){var T=ensureState58();T.storeState=v;T.storeStatus='all';render58();};
  window.setStoreTrackMetric8658=function(v){var T=ensureState58();T.storeMetric=v;T.storeStatus='all';render58();};
  window.setStoreTrackStatus8658=function(v){var T=ensureState58();T.storeStatus=v;render58();};
  window.__llaveroStoreTrackingPanel58=panel58;
  window.openTrackingProduct8658=function(c){try{if(typeof openInventoryProduct==='function')openInventoryProduct(c);}catch(_){}};
  function install58(){if(installed)return;installed=true;ensureState58();var baseRefresh=window.refresh,baseSetView=window.setView;if(typeof baseRefresh==='function')window.refresh=function(){var out=baseRefresh.apply(this,arguments);if(window.VIEW==='resumen')setTimeout(render58,25);return out;};if(typeof baseSetView==='function')window.setView=function(v){var out=baseSetView.apply(this,arguments);if(v==='resumen'||window.VIEW==='resumen')setTimeout(render58,25);return out;};window.renderStoreTracking=render58;setTimeout(function(){if(window.VIEW==='resumen')render58();},100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install58,{once:true});else install58();
})();


/* ==== llaveroV8664Script ==== */

(function(){
  'use strict';
  var VERSION='V86.64', installed=false, trackMode='previous', mdLimit=160, leaderSel={};
  function num(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function text(v){return v==null?'':String(v);}
  function code(v){try{return typeof safeCode==='function'?safeCode(v):text(v).trim();}catch(_){return text(v).trim();}}
  function norm(v){var x=text(v);try{x=x.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(_){}return x.toUpperCase().trim();}
  function esc64(v){return text(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function fint(v){try{return typeof fInt==='function'?fInt(v):Math.round(num(v)).toLocaleString('es-CO');}catch(_){return String(Math.round(num(v)));}}
  function money(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(v):'$ '+Math.round(num(v)).toLocaleString('es-CO');}catch(_){return '$ '+Math.round(num(v)).toLocaleString('es-CO');}}
  function store(sc){try{return (S&&S[sc||CUR])||{};}catch(_){return {};}}
  function product(c){try{return typeof productInfo==='function'?productInfo(c):(P&&P[c])||{n:c};}catch(_){return {n:c};}}
  function stateOf(r){var v=r&&(r.estadoProducto!=null?r.estadoProducto:(r.estadoAbastecimiento!=null?r.estadoAbastecimiento:r.estado));if((v==null||text(v).trim()==='')&&r&&r.c){try{v=P&&P[r.c]&&P[r.c].estado;}catch(_){}}return norm(v);}
  function lowerAge(label){var z=norm(label);if(z.indexOf('SIN')>=0)return -1;if(z.indexOf('360')>=0&&(z.indexOf('MAS')>=0||z.indexOf('+')>=0))return 361;var a=(z.match(/\d+/g)||[]).map(Number);return a.length?a[0]:-1;}
  function ageBucket(label){var x=lowerAge(label);if(x<0)return 'unknown';if(x<=60)return '0-60';if(x<=90)return '61-90';if(x<=150)return '91-150';if(x<=180)return '151-180';if(x<=210)return '181-210';if(x<=240)return '211-240';if(x<=360)return '241-360';return '360+';}
  var AGE=[['0-60','0\u201360'],['61-90','61\u201390'],['91-150','91\u2013150'],['151-180','151\u2013180'],['181-210','181\u2013210'],['211-240','211\u2013240'],['241-360','241\u2013360'],['360+','+360']];
  function invRows(sc){try{return (normalizeInventoryRows(store(sc))||[]).filter(function(r){return num(r.stock)>0;});}catch(_){return [];}}
  function mixKind(r){var s=stateOf(r);if(s==='A')return 'basic';if(s==='O'||s==='T')return 'novel';if(s==='N')return 'off';return 'unknown';}
  function mixInfo(sc,kind){var all=invRows(sc),rows=all.filter(function(r){return mixKind(r)===kind;}),target=kind==='basic'?75:kind==='novel'?15:10,ages={};AGE.forEach(function(a){ages[a[0]]={products:new Set(),units:0};});rows.forEach(function(r){Object.entries(r.rangos||{}).forEach(function(e){var b=ageBucket(e[0]),u=num(e[1]);if(u>0&&ages[b]){ages[b].products.add(code(r.c));ages[b].units+=u;}});});var pct=all.length?rows.length/all.length*100:0,delta=pct-target;return {all:all,rows:rows,target:target,pct:pct,delta:delta,ages:ages};}
  function kindTitle(k){return k==='basic'?'B\u00e1sicos \u00b7 Estado A':k==='novel'?'Novedades \u00b7 Estados T/O':'Fuera de surtido \u00b7 Estado N';}
  function mixCard(k){var g=mixInfo(CUR,k),status=Math.abs(g.delta)<.05?'En objetivo':g.delta<0?'Debe aumentar':'Debe reducir',tone=Math.abs(g.delta)<.05?'good':Math.abs(g.delta)<=5?'warn':'bad',mx=Math.max.apply(null,AGE.map(function(a){return g.ages[a[0]].products.size;}).concat([1]));return '<div class="v8662MixCard v8664MixCard '+k+'" role="button" tabindex="0" onclick="openComposition8664(\''+k+'\')"><div class="v8664MixTitle"><div><b>'+kindTitle(k)+'</b><span>Composici\u00f3n sobre productos con stock</span></div><span>Meta '+g.target+'%</span></div><div class="v8664MixMetrics"><div class="v8664MixMetric"><label>Actual</label><b>'+g.pct.toFixed(1)+'%</b></div><div class="v8664MixMetric"><label>Objetivo</label><b>'+g.target+'%</b></div><div class="v8664MixMetric '+tone+'"><label>Brecha</label><b>'+(g.delta>0?'+':'')+g.delta.toFixed(1)+' pp</b></div><div class="v8664MixMetric state '+tone+'"><label>Estado</label><b>'+status+'</b></div><div class="v8664MixMetric"><label>Total</label><b>'+fint(g.rows.length)+' productos</b></div></div><div class="v8664AgeTitle"><b>Salud por antig\u00fcedad</b><span>Productos por rango \u00b7 selecciona un rango para ver detalle</span></div><div class="v8664MixAge">'+AGE.map(function(a){var x=g.ages[a[0]],h=x.products.size?Math.max(4,Math.round(x.products.size/mx*48)):0;return '<div class="v8664AgeCol" role="button" tabindex="0" onclick="event.stopPropagation();openComposition8664(\''+k+'\',\''+a[0]+'\')" title="'+fint(x.products.size)+' productos \u00b7 '+fint(x.units)+' unidades"><b>'+fint(x.products.size)+'</b><div class="v8664AgeTrack"><i style="height:'+h+'px"></i></div><small>'+a[1]+'<br>'+fint(x.units)+' u</small></div>';}).join('')+'</div></div>';}
  function structureComposition(){if(typeof VIEW==='undefined'||VIEW!=='resumen')return;var card=Array.from(document.querySelectorAll('#content .card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Composici\u00f3n y salud del inventario';});if(!card)return;var grid=card.querySelector('.v8662MixGrid');if(grid)grid.innerHTML=mixCard('basic')+mixCard('novel')+mixCard('off');var ds=card.querySelector('.ds');if(ds)ds.textContent='Compara la mezcla 75/15/10 y lee la salud directamente por rangos de antig\u00fcedad.';}
  function unique(rows,get){return Array.from(new Set(rows.map(get).filter(Boolean))).sort(function(a,b){return text(a).localeCompare(text(b),'es');});}
  function selectOpts(vals,label){return '<option value="all">'+label+'</option>'+vals.map(function(v){return '<option value="'+esc64(v)+'">'+esc64(v)+'</option>';}).join('');}
  function compositionRows(kind,bucket){var rows=mixInfo(CUR,kind).rows.slice();if(bucket)rows=rows.filter(function(r){return Object.entries(r.rangos||{}).some(function(e){return num(e[1])>0&&ageBucket(e[0])===bucket;});});return rows;}
  window.openComposition8664=function(kind,bucket){var rows=compositionRows(kind,bucket),modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),ttl=document.getElementById('rangeModalTitle'),sub=document.getElementById('rangeModalSubtitle');if(!modal||!body)return;modal.classList.add('v8664Wide');if(ttl)ttl.textContent=kindTitle(kind)+(bucket?' \u00b7 '+bucket:'');if(sub)sub.textContent=(store(CUR).name||CUR)+' \u00b7 '+fint(rows.length)+' productos';var cats=unique(rows,function(r){return (r.p||product(r.c)).cat||'';}),lines=unique(rows,function(r){return (r.p||product(r.c)).lin||'';}),subs=unique(rows,function(r){return (r.p||product(r.c)).sub||'';});body.innerHTML='<div class="v8664DetailTools"><div class="v8664Field"><label>Buscar</label><input id="v8664MixQ" placeholder="C\u00f3digo, producto, categor\u00eda, l\u00ednea o subl\u00ednea" oninput="filterComposition8664()"></div><div class="v8664Field"><label>Categor\u00eda</label><select id="v8664MixCat" onchange="filterComposition8664()">'+selectOpts(cats,'Todas')+'</select></div><div class="v8664Field"><label>L\u00ednea</label><select id="v8664MixLine" onchange="filterComposition8664()">'+selectOpts(lines,'Todas')+'</select></div><div class="v8664Field"><label>Subl\u00ednea</label><select id="v8664MixSub" onchange="filterComposition8664()">'+selectOpts(subs,'Todas')+'</select></div><div class="v8664Field"><label>Antig\u00fcedad</label><select id="v8664MixAge" onchange="filterComposition8664()"><option value="all">Todos los rangos</option>'+AGE.map(function(a){return '<option value="'+a[0]+'"'+(bucket===a[0]?' selected':'')+'>'+a[1]+' d\u00edas</option>';}).join('')+'</select></div><div class="v8664Field"><label>CENDIS</label><select id="v8664MixCendis" onchange="filterComposition8664()"><option value="all">Todos</option><option value="with">Con respaldo</option><option value="without">Sin respaldo</option></select></div></div><div class="v8664DetailCount"><span id="v8664MixCount">'+fint(rows.length)+' productos</span><span>Selecciona una fila para abrir la ficha completa</span></div><div class="v80TableWrap"><table class="v80Table v8664DetailTable" id="v8664MixTable"><thead><tr><th>Imagen</th><th>C\u00f3digo</th><th>Producto</th><th>Categor\u00eda</th><th>L\u00ednea</th><th>Subl\u00ednea</th><th class="num">Unidades</th><th>Antig\u00fcedad</th><th class="num">CENDIS</th><th class="num">Valor</th></tr></thead><tbody>'+rows.map(function(r){var p=r.p||product(r.c),buckets=Array.from(new Set(Object.entries(r.rangos||{}).filter(function(e){return num(e[1])>0;}).map(function(e){return ageBucket(e[0]);}))).join('|'),ages=Object.entries(r.rangos||{}).filter(function(e){return num(e[1])>0;}).map(function(e){return '<span class="v867Range">'+fint(e[1])+' u \u00b7 '+esc64(e[0])+'</span>';}).join('');return '<tr data-cat="'+esc64(p.cat||'')+'" data-line="'+esc64(p.lin||'')+'" data-sub="'+esc64(p.sub||'')+'" data-age="'+esc64(buckets)+'" data-cendis="'+(num(r.dispCendis)>0?'with':'without')+'" onclick="openBestProductDetail('+JSON.stringify(r.c)+')"><td>'+(typeof imageThumb==='function'?imageThumb(r.c,'sm'):'')+'</td><td><span class="code">'+esc64(r.c)+'</span></td><td><b>'+esc64(p.n||r.c)+'</b></td><td>'+esc64(p.cat||'\u2014')+'</td><td>'+esc64(p.lin||'\u2014')+'</td><td>'+esc64(p.sub||'\u2014')+'</td><td class="num"><b>'+fint(r.stock)+'</b></td><td>'+ages+'</td><td class="num">'+(num(r.dispCendis)>0?'<span class="tag cr">'+fint(r.dispCendis)+' u</span>':'<span class="tag sr">Sin respaldo</span>')+'</td><td class="num">'+money(r.valorInventario)+'</td></tr>';}).join('')+'</tbody></table></div>';modal.classList.add('on');window.filterComposition8664();};
  window.filterComposition8664=function(){var q=norm((document.getElementById('v8664MixQ')||{}).value),cat=(document.getElementById('v8664MixCat')||{}).value||'all',line=(document.getElementById('v8664MixLine')||{}).value||'all',sub=(document.getElementById('v8664MixSub')||{}).value||'all',age=(document.getElementById('v8664MixAge')||{}).value||'all',cen=(document.getElementById('v8664MixCendis')||{}).value||'all',shown=0;document.querySelectorAll('#v8664MixTable tbody tr').forEach(function(tr){var ok=(!q||norm(tr.textContent).indexOf(q)>=0)&&(cat==='all'||tr.dataset.cat===cat)&&(line==='all'||tr.dataset.line===line)&&(sub==='all'||tr.dataset.sub===sub)&&(age==='all'||('|' + (tr.dataset.age||'') + '|').indexOf('|'+age+'|')>=0)&&(cen==='all'||tr.dataset.cendis===cen);tr.style.display=ok?'':'none';if(ok)shown++;});var c=document.getElementById('v8664MixCount');if(c)c.textContent=fint(shown)+' productos visibles';};
  function ensureTrend(){if(typeof VIEW==='undefined'||VIEW!=='resumen')return;var card=Array.from(document.querySelectorAll('#content .card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Seguimiento diario de gesti\u00f3n';});if(!card)return;var body=card.querySelector('.cbody')||card,trend=card.querySelector('.v79StoreTrendCard');if(!trend&&typeof trendChart79==='function'&&typeof storeTrendData79==='function'){var d=document.createElement('div');d.className='v79StoreTrendCard v8664TrendForced';d.innerHTML='<div class="v79StoreTrendHead"><div><b>Tendencia hist\u00f3rica de la tienda</b><span>Rotaci\u00f3n y Evacuaci\u00f3n por cada corte</span></div><span>Presiona un punto para ver su actividad</span></div>'+trendChart79(storeTrendData79(CUR),CUR);body.appendChild(d);trend=d;}if(trend){trend.classList.add('v8664TrendForced');trend.style.display='block';trend.style.visibility='visible';}}
  window.openHealthyCendis8664=function(mode){var st=store(CUR),sum=typeof inventorySummary==='function'?inventorySummary(st):{},rows=(sum.healthyRows||[]).filter(function(r){return mode==='with'?num(r.dispCendis)>0:num(r.dispCendis)<=0;}),modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),ttl=document.getElementById('rangeModalTitle'),sub=document.getElementById('rangeModalSubtitle');if(!modal||!body)return;modal.classList.add('v8664Wide');if(ttl)ttl.textContent='Productos sanos '+(mode==='with'?'con respaldo CENDIS':'sin respaldo CENDIS');if(sub)sub.textContent=(st.name||CUR)+' \u00b7 '+fint(rows.length)+' productos';body.innerHTML='<div class="v8664DetailTools" style="grid-template-columns:minmax(260px,1fr)"><div class="v8664Field"><label>Buscar</label><input id="v8664HealthyQ" placeholder="C\u00f3digo, producto, categor\u00eda, l\u00ednea o subl\u00ednea" oninput="filterHealthy8664()"></div></div><div class="v8664DetailCount"><span id="v8664HealthyCount">'+fint(rows.length)+' productos</span><span>Selecciona una fila para abrir la ficha completa</span></div><div class="v80TableWrap"><table class="v80Table v8664DetailTable" id="v8664HealthyTable"><thead><tr><th>Imagen</th><th>C\u00f3digo</th><th>Producto</th><th>Categor\u00eda</th><th>L\u00ednea</th><th>Subl\u00ednea</th><th class="num">Unidades</th><th>Antig\u00fcedad</th><th class="num">CENDIS</th><th class="num">Valor</th></tr></thead><tbody>'+rows.map(function(r){var p=r.p||product(r.c),ages=Object.entries(r.rangos||{}).filter(function(e){return num(e[1])>0;}).map(function(e){return '<span class="v867Range">'+fint(e[1])+' u \u00b7 '+esc64(e[0])+'</span>';}).join('');return '<tr onclick="openBestProductDetail('+JSON.stringify(r.c)+')"><td>'+(typeof imageThumb==='function'?imageThumb(r.c,'sm'):'')+'</td><td><span class="code">'+esc64(r.c)+'</span></td><td><b>'+esc64(p.n||r.c)+'</b></td><td>'+esc64(p.cat||'\u2014')+'</td><td>'+esc64(p.lin||'\u2014')+'</td><td>'+esc64(p.sub||'\u2014')+'</td><td class="num"><b>'+fint(r.stock)+'</b></td><td>'+ages+'</td><td class="num">'+(num(r.dispCendis)>0?'<span class="tag cr">'+fint(r.dispCendis)+' u</span>':'<span class="tag sr">Sin respaldo</span>')+'</td><td class="num">'+money(r.valorInventario)+'</td></tr>';}).join('')+'</tbody></table></div>';modal.classList.add('on');};
  window.filterHealthy8664=function(){var q=norm((document.getElementById('v8664HealthyQ')||{}).value),shown=0;document.querySelectorAll('#v8664HealthyTable tbody tr').forEach(function(tr){var ok=!q||norm(tr.textContent).indexOf(q)>=0;tr.style.display=ok?'':'none';if(ok)shown++;});var c=document.getElementById('v8664HealthyCount');if(c)c.textContent=fint(shown)+' productos visibles';};
  function removeInventoryDuplicateCards(){if(typeof VIEW==='undefined'||VIEW!=='inventario')return;var grid=document.querySelector('#content .inventoryKpis');if(!grid)return;grid.querySelectorAll('.inventoryKpi').forEach(function(c){var l=c.querySelector('.ikLabel'),x=l&&l.textContent.trim();if(x==='Pr\u00f3ximos a Rotar'||x==='Rotaci\u00f3n'||x==='Evacuaci\u00f3n')c.remove();});var healthy=Array.from(grid.querySelectorAll('.inventoryKpi')).find(function(c){var l=c.querySelector('.ikLabel');return l&&l.textContent.trim()==='Productos sanos';}),sum=typeof inventorySummary==='function'?inventorySummary(store(CUR)):{healthyRows:[]},rows=sum.healthyRows||[],withC=rows.filter(function(r){return num(r.dispCendis)>0;}).length,without=rows.length-withC;if(healthy&&!grid.querySelector('[data-v8664-healthy-with]')){healthy.insertAdjacentHTML('afterend','<div class="inventoryKpi clickableKpi" data-v8664-healthy-with onclick="openHealthyCendis8664(\'with\')"><div class="ikLabel">Sanos con respaldo CENDIS</div><div class="ikValue" style="color:var(--ok)">'+fint(withC)+'</div><div class="ikMeta">Productos sanos con disponibilidad</div></div><div class="inventoryKpi clickableKpi" data-v8664-healthy-without onclick="openHealthyCendis8664(\'without\')"><div class="ikLabel">Sanos sin respaldo CENDIS</div><div class="ikValue" style="color:var(--bad)">'+fint(without)+'</div><div class="ikMeta">Productos sanos sin disponibilidad</div></div>');}}
  function trackDates(){try{return (readDetailHistory()||[]).map(function(x){return x&&x.date;}).filter(Boolean).sort();}catch(_){return [];}}
  function formatDate(d){var m=text(d).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:text(d);}
  function applyTrackingUi(){if(typeof VIEW==='undefined'||VIEW!=='resumen')return;var panel=document.getElementById('storeTrackingPanel');if(!panel)return;var controls=panel.querySelector('.trackingControls'),group=controls&&controls.querySelector('.trackingControlGroup');if(!group)return;group.classList.add('v8664CompareGroup');var btns=group.querySelectorAll('.trackBtn'),previous=btns[0],base=btns[1];if(previous){previous.textContent='Corte anterior';previous.onclick=function(ev){ev.preventDefault();trackMode='previous';if(typeof quickTrack8662==='function')quickTrack8662('previous');setTimeout(applyTrackingUi,40);};}if(base){base.textContent='Corte base';base.onclick=function(ev){ev.preventDefault();trackMode='base';if(typeof quickTrack8662==='function')quickTrack8662('base');setTimeout(applyTrackingUi,40);};}var custom=group.querySelector('[data-v8664-custom]');if(!custom){custom=document.createElement('button');custom.type='button';custom.className='trackBtn';custom.dataset.v8664Custom='1';custom.textContent='Personalizado';custom.onclick=function(ev){ev.preventDefault();trackMode='custom';var box=controls.querySelector('.v8664CompareCustom'),f=box&&box.querySelector('[data-v8664-from]'),to=box&&box.querySelector('[data-v8664-to]');if(typeof setTrackDate8662==='function'&&f&&to){setTrackDate8662('from',f.value);setTrackDate8662('to',to.value);}setTimeout(applyTrackingUi,40);};group.appendChild(custom);}var old=controls.querySelector('.v8662CutSelectors');if(old)old.style.display='none';var box=controls.querySelector('.v8664CompareCustom');if(!box){var dates=trackDates(),s=window.__LLV_TRACK8662||{},from=s.from||dates[Math.max(0,dates.length-2)]||'',to=s.to||dates[dates.length-1]||'';box=document.createElement('div');box.className='v8664CompareCustom';box.innerHTML='<div class="v8664Field"><label>Corte inicial</label><select data-v8664-from>'+dates.map(function(d){return '<option value="'+d+'"'+(d===from?' selected':'')+'>'+formatDate(d)+'</option>';}).join('')+'</select></div><div class="v8664Field"><label>Corte final</label><select data-v8664-to>'+dates.map(function(d){return '<option value="'+d+'"'+(d===to?' selected':'')+'>'+formatDate(d)+'</option>';}).join('')+'</select></div>';group.insertAdjacentElement('afterend',box);box.querySelector('[data-v8664-from]').onchange=function(){trackMode='custom';if(typeof setTrackDate8662==='function')setTrackDate8662('from',this.value);setTimeout(applyTrackingUi,40);};box.querySelector('[data-v8664-to]').onchange=function(){trackMode='custom';if(typeof setTrackDate8662==='function')setTrackDate8662('to',this.value);setTimeout(applyTrackingUi,40);};}box.classList.toggle('on',trackMode==='custom');[previous,base,custom].forEach(function(b){if(b)b.classList.remove('on');});if(trackMode==='previous'&&previous)previous.classList.add('on');else if(trackMode==='base'&&base)base.classList.add('on');else if(custom)custom.classList.add('on');}
  function ensureProxRisk(){if(typeof VIEW==='undefined'||VIEW!=='prox')return;var rows=[];try{rows=upcomingRotationRows(store(CUR))||[];}catch(_){ }var defs=[{key:'high',label:'Alto >=50%',fn:function(r){return num(r.share)>=50;},cls:'high'},{key:'mid',label:'Medio 25-49%',fn:function(r){return num(r.share)>=25&&num(r.share)<50;},cls:'mid'},{key:'low',label:'Bajo <25%',fn:function(r){return num(r.share)<25;},cls:'low'}],data=defs.map(function(d){var a=rows.filter(d.fn);return Object.assign({},d,{count:a.length,units:a.reduce(function(x,r){return x+num(r.units);},0)});}),mx=Math.max.apply(null,data.map(function(d){return d.units;}).concat([1])),root=document.getElementById('prox-risk-chart');if(root){root.innerHTML='<div class="v8664RiskChart">'+data.map(function(d){return '<button class="v8664RiskRow '+d.cls+'" onclick="setProxRisk53(\''+d.key+'\')"><span class="v8664RiskLabel">'+d.label+'</span><span class="v8664RiskTrack"><span class="v8664RiskFill" style="width:'+Math.max(d.units?4:0,d.units/mx*100)+'%"></span></span><span class="v8664RiskValue">'+fint(d.units)+' u \u00b7 '+fint(d.count)+' productos</span></button>';}).join('')+'</div>';}var title=document.querySelector('.proxInsight .proxChartTitle');if(title)title.textContent='Riesgo de entrada a Rotaci\u00f3n';var sub=document.querySelector('.proxInsight .proxChartSub');if(sub)sub.textContent='Clasifica los productos de 60 a 90 d\u00edas seg\u00fan qu\u00e9 proporci\u00f3n de su stock ya est\u00e1 en ese rango.';}
  var POLICY={age_0_60:{star:0,rest:0,fs:40,fs_last:50},age_61_90:{star:30,rest:30,fs:45,fs_last:60},age_91_150:{star:30,rest:40,fs:50,fs_last:70},age_151_plus:{star:45,rest:50,fs:60,fs_last:70}};
  function oldestInfo(r){var best=null;Object.entries(r.rangos||{}).forEach(function(e){var u=num(e[1]),lo=lowerAge(e[0]);if(u<=0||lo<0)return;if(!best||lo>best.lo)best={label:e[0],lo:lo,units:u};});if(!best)return {label:'Sin definir',key:'unknown',bucket:'unknown',units:0};var key=best.lo<=60?'age_0_60':best.lo<=90?'age_61_90':best.lo<=150?'age_91_150':'age_151_plus';return {label:best.label,key:key,bucket:ageBucket(best.label),units:best.units};}
  function pctVal(v){if(v==null||text(v).trim()==='')return {kind:'missing',value:null};var x=Number(v);return Number.isFinite(x)?{kind:'ok',value:x}:{kind:'invalid',value:null};}
  function mdRowsOfficial(sc){sc=sc||CUR;var out=[];invRows(sc).forEach(function(r){var st=stateOf(r),rot=(['A','O','T'].indexOf(st)>=0&&Object.entries(r.rangos||{}).some(function(e){return num(e[1])>0&&lowerAge(e[0])>=91;})),ev=st==='N';if(!rot&&!ev)return;var p=r.p||product(r.c),a=oldestInfo(r),matrix=norm(r.matriz||(P&&P[r.c]&&P[r.c].matriz)),type=ev?((num(r.stock)===1&&num(r.dispCendis)===0)?'fs_last':'fs'):(matrix==='ESTRELLA'?'star':'rest'),suggested=(POLICY[a.key]&&POLICY[a.key][type]!=null)?POLICY[a.key][type]:null,d=typeof discountActual18==='function'?discountActual18(sc,r.c):null,adminRaw=(d&&d.descuentoAdministrado!=null)?d.descuentoAdministrado:0,offerRaw=d?d.descuentoOfertaSistema:null,admin=pctVal(adminRaw),offer=pctVal(offerRaw),status='no_policy',label='Sin pol\u00edtica',reason='',tol=.049;if(suggested==null){reason=a.key==='unknown'?'Antig\u00fcedad sin definir':'No se encontr\u00f3 una regla para la condici\u00f3n y antig\u00fcedad';}else if(admin.kind==='invalid'){status='review';label='Revisar dato';reason='Dato de descuento inconsistente';}else if(admin.value>suggested+tol){status='exceed';label='Supera pol\u00edtica';}else if(admin.value>=suggested-tol){status='comply';label='Cumple';}else if(admin.value===0&&offer.kind==='ok'&&offer.value>=suggested-tol){status='update_sample';label='Actualizar descuento muestra';reason='La oferta ya cubre la pol\u00edtica; cargar el sugerido como muestra';}else{status='manage';label='Gestionar';reason='El descuento sugerido es mayor al descuento actual de muestra';}var gap=(suggested!=null&&admin.kind==='ok')?suggested-admin.value:null,priceList=d&&d.precioLista!=null?num(d.precioLista):null,avg=num(r.valorUnitarioPromedio)||(num(r.stock)?num(r.valorInventario)/num(r.stock):0),curUnit=priceList!=null&&admin.kind==='ok'?priceList*(1-admin.value/100):avg,sugUnit=priceList!=null&&suggested!=null?priceList*(1-suggested/100):avg,value=num(r.valorInventario),impact=(status==='manage'&&priceList!=null&&gap!=null)?Math.max(0,priceList*num(r.stock)*gap/100):0;out.push({storeCode:sc,code:code(r.c),name:p.n||r.c,category:p.cat||'\u2014',line:p.lin||'\u2014',subline:p.sub||'\u2014',cc:text((P&&P[r.c]&&P[r.c].cc)||'SIN CLASIFICACI\u00d3N'),state:st,matrix:matrix||'\u2014',stock:num(r.stock),ageLabel:a.label,ageUnits:a.units,ageKey:a.key,ageBucket:a.bucket,typeKey:type,typeLabel:type==='star'?'Rotaci\u00f3n Estrella':type==='rest'?'Rotaci\u00f3n resto surtido':type==='fs_last'?'Fuera de surtido \u00b7 \u00faltima unidad':'Fuera de surtido',policyApplied:ev?'Evacuaci\u00f3n':'Rotaci\u00f3n',ruleApplied:(type==='star'?'Estrella':type==='rest'?'Resto surtido':type==='fs_last'?'Fuera de surtido \u00b7 \u00faltima unidad':'Fuera de surtido')+' \u00b7 '+a.label,discount:suggested,of:null,hasPolicy:suggested!=null,noDiscount:suggested===0,priceList:priceList,systemOfferDiscount:offer.kind==='ok'?offer.value:null,adminDiscount:admin.kind==='ok'?admin.value:null,currentDiscount:admin.kind==='ok'?admin.value:null,currentDiscountSource:(d&&d.descuentoAdministrado!=null)?'Muestra / Administrador':'Sin registro administrador = 0%',hasCurrentDiscountData:admin.kind==='ok',gap:gap,statusKey:status,statusLabel:label,actionable:status==='manage'||status==='update_sample',updateSample:status==='update_sample',reviewReason:status==='review'?reason:'',value:value,impact:impact,net:Math.max(0,value-impact),avgValue:avg,currentUnit:curUnit,unitAfter:sugUnit,reason:reason,actionText:reason,row:r});});return out;}
  window.mdRows8664=mdRowsOfficial;window.mdRows8618=mdRowsOfficial;window.mdRows8662=mdRowsOfficial;
  function reviewCounts(rows){var x={match:0,sample:0,invalid:0};rows.filter(function(r){return r.statusKey==='review';}).forEach(function(r){if(r.reviewReason==='Sin coincidencia tienda-producto')x.match++;else if(r.reviewReason==='Sin descuento muestra')x.sample++;else x.invalid++;});return x;}
  function openMdProduct(c){if(typeof openMarkdownProduct8618==='function')openMarkdownProduct8618(c);else if(typeof openBestProductDetail==='function')openBestProductDetail(c);}
  function mdFiltered(){var rows=mdRowsOfficial(CUR).slice(),s=window.mdState8618||{},q=norm(s.q),card=s.card||'all';if(card==='manage'||card==='actionable')rows=rows.filter(function(r){return r.actionable;});else if(card==='update_sample')rows=rows.filter(function(r){return r.statusKey==='update_sample';});else if(['comply','exceed','review','no_policy'].indexOf(card)>=0)rows=rows.filter(function(r){return r.statusKey===card;});if(s.type&&s.type!=='all')rows=rows.filter(function(r){if(s.type==='outside')return r.typeKey==='fs'||r.typeKey==='fs_last';if(s.type==='last_unit')return r.typeKey==='fs_last';return r.typeKey===s.type;});if(s.age&&s.age!=='all')rows=rows.filter(function(r){return r.ageKey===s.age;});if(s.discount&&s.discount!=='all')rows=rows.filter(function(r){return String(r.discount)===String(s.discount);});if(s.responsible&&s.responsible!=='all')rows=rows.filter(function(r){if(r.statusKey==='review')return true;if(!r.actionable)return false;return s.responsible==='leader'?num(r.discount)>50:num(r.discount)<=50;});if(q)rows=rows.filter(function(r){return norm([r.code,r.name,r.category,r.line,r.subline,r.policyApplied,r.ruleApplied,r.statusLabel,r.reviewReason].join(' ')).indexOf(q)>=0;});return rows;}
  function mdRuleHtml(rows){var act=rows.filter(function(r){return r.actionable;}),total=act.length||1,defs=[['star','Rotaci\u00f3n Estrella','k-rot'],['rest','Rotaci\u00f3n resto surtido','k-vta'],['outside','Fuera de surtido','k-evac'],['last_unit','Fuera de surtido \u00b7 \u00faltima unidad','k-evac']];return '<div class="v8618KpiGrid mdRuleGrid8648">'+defs.map(function(d){var list=act.filter(function(r){if(d[0]==='outside')return r.typeKey==='fs'||r.typeKey==='fs_last';if(d[0]==='last_unit')return r.typeKey==='fs_last';return r.typeKey===d[0];}),units=list.reduce(function(a,r){return a+num(r.stock);},0);return '<div class="kpi v8618Card '+d[2]+'" role="button" tabindex="0" onclick="openMdRule8664(\''+d[0]+'\')"><div class="top"><div class="ico">%</div><span class="v8618Arrow">Ver detalle \u2192</span></div><div class="lab">'+d[1]+'</div><div class="val">'+fint(list.length)+'</div><div class="sub">'+fint(units)+' u \u00b7 '+(list.length/total*100).toFixed(1)+'% de los productos a gestionar</div></div>';}).join('')+'</div>';}
  function mdPolicyHtml(rows){var act=rows.filter(function(r){return r.actionable;}),rot=act.filter(function(r){return r.policyApplied==='Rotaci\u00f3n';}),ev=act.filter(function(r){return r.policyApplied==='Evacuaci\u00f3n';}),total=act.length||1,mx=Math.max(rot.length,ev.length,1);function one(key,label,list,cls){return '<button class="mdPolicyRow8646 '+cls+'" onclick="openMdPolicy8664(\''+key+'\')"><div class="mdPolicyLabel8646"><b>'+label+'</b><span>Productos que requieren acci\u00f3n</span></div><div class="mdPolicyTrack8646"><i style="width:'+Math.max(list.length?3:0,list.length/mx*100)+'%"></i></div><div class="mdPolicyValue8646"><b>'+fint(list.length)+'</b><span>'+(list.length/total*100).toFixed(1)+'%</span></div></button>';}return '<div class="mdPolicyChart8646">'+one('rot','Rotaci\u00f3n',rot,'')+one('evac','Evacuaci\u00f3n',ev,'evac')+'</div><div class="dashboardNote">Selecciona una pol\u00edtica para abrir el detalle de productos.</div>';}
  function mdGapHtml(rows){var list=rows.filter(function(r){return r.actionable&&r.gap!=null;}).sort(function(a,b){return num(b.gap)-num(a.gap);}).slice(0,10),mx=Math.max.apply(null,list.map(function(r){return num(r.gap);}).concat([1]));return '<div class="v8618RankList">'+list.map(function(r){return '<div class="v8618RankRow" role="button" tabindex="0" onclick="openMdProduct8664('+JSON.stringify(r.code)+')"><div class="v8618RankName">'+esc64(r.name)+'</div><div class="v8618RankTrack"><div class="v8618RankFill" style="width:'+Math.max(2,num(r.gap)/mx*100)+'%;background:var(--bad)"></div></div><div class="v8618RankValue">+'+num(r.gap).toFixed(1).replace('.0','')+' pp</div></div>';}).join('')+'</div>';}
  window.openMdRule8664=function(kind){var rows=mdRowsOfficial(CUR).filter(function(r){if(!r.actionable)return false;if(kind==='outside')return r.typeKey==='fs'||r.typeKey==='fs_last';if(kind==='last_unit')return r.typeKey==='fs_last';return r.typeKey===kind;});mdDetailModal('Markdown \u00b7 regla '+kind,rows);};
  window.openMdPolicy8664=function(kind){mdDetailModal('Markdown \u00b7 '+(kind==='rot'?'Rotaci\u00f3n':'Evacuaci\u00f3n'),mdRowsOfficial(CUR).filter(function(r){return r.actionable&&r.policyApplied===(kind==='rot'?'Rotaci\u00f3n':'Evacuaci\u00f3n');}));};
  function mdStatusHtml(rows){var defs=[['manage','Gestionar','var(--bad)'],['update_sample','Actualizar muestra','var(--rot)'],['comply','Cumple','var(--ok)'],['exceed','Supera pol\u00edtica','var(--amb)'],['review','Revisar dato','#d58d00'],['no_policy','Sin pol\u00edtica','var(--mut)']],mx=Math.max.apply(null,defs.map(function(d){return rows.filter(function(r){return r.statusKey===d[0];}).length;}).concat([1]));return '<div class="v8664MdStatus">'+defs.map(function(d){var c=rows.filter(function(r){return r.statusKey===d[0];}).length;return '<button class="v8664MdBar" onclick="openMdStatus8664(\''+d[0]+'\')"><b>'+fint(c)+'</b><div class="v8664MdTrack"><i style="height:'+Math.max(c?4:0,c/mx*100)+'%;background:'+d[2]+'"></i></div><span>'+d[1]+'</span></button>';}).join('')+'</div>';}
  function mdAgeHtml(rows){var act=rows.filter(function(r){return r.actionable;}),mx=Math.max.apply(null,AGE.map(function(a){return act.filter(function(r){return r.ageBucket===a[0];}).length;}).concat([1]));return '<div class="v8664MdAge">'+AGE.map(function(a){var c=act.filter(function(r){return r.ageBucket===a[0];}).length;return '<button onclick="openMdAge8664(\''+a[0]+'\')"><b>'+fint(c)+'</b><div class="track"><i style="height:'+Math.max(c?4:0,c/mx*100)+'%"></i></div><span>'+a[1]+'<br>d\u00edas</span></button>';}).join('')+'</div><div class="dashboardNote">Selecciona una barra para consultar los productos a gestionar de ese rango.</div>';}
  function mdDetailModal(title,rows){var modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),ttl=document.getElementById('rangeModalTitle'),sub=document.getElementById('rangeModalSubtitle');if(!modal||!body)return;modal.classList.add('v8664Wide');if(ttl)ttl.textContent=title;if(sub)sub.textContent=(store(CUR).name||CUR)+' \u00b7 '+fint(rows.length)+' productos';body.innerHTML='<div class="v8664DetailTools" style="grid-template-columns:minmax(240px,1fr) 180px"><div class="v8664Field"><label>Buscar</label><input id="v8664MdDetailQ" placeholder="C\u00f3digo, producto, categor\u00eda, l\u00ednea o subl\u00ednea" oninput="filterMdDetail8664()"></div><div class="v8664Field"><label>Estado</label><select id="v8664MdDetailState" onchange="filterMdDetail8664()"><option value="all">Todos</option>'+Array.from(new Set(rows.map(function(r){return r.statusKey;}))).map(function(x){return '<option value="'+x+'">'+esc64(x)+'</option>';}).join('')+'</select></div></div><div class="v8664DetailCount"><span id="v8664MdDetailCount">'+fint(rows.length)+' productos</span><span>Selecciona una fila para abrir el detalle</span></div><div class="v80TableWrap"><table class="v80Table v8664DetailTable" id="v8664MdDetailTable"><thead><tr><th>C\u00f3digo</th><th>Producto</th><th>Antig\u00fcedad</th><th>Regla</th><th class="num">Oferta</th><th class="num">Actual/Muestra</th><th class="num">Sugerido</th><th>Estado</th></tr></thead><tbody>'+rows.map(function(r){return '<tr data-status="'+r.statusKey+'" onclick="openMdProduct8664('+JSON.stringify(r.code)+')"><td><span class="code">'+esc64(r.code)+'</span></td><td><b>'+esc64(r.name)+'</b><div class="muted">'+esc64(r.category+' \u00b7 '+r.line+' \u00b7 '+r.subline)+'</div></td><td>'+esc64(r.ageLabel)+'</td><td>'+esc64(r.ruleApplied)+'</td><td class="num">'+(r.systemOfferDiscount==null?'\u2014':r.systemOfferDiscount.toFixed(1).replace('.0','')+'%')+'</td><td class="num">'+(r.currentDiscount==null?'\u2014':r.currentDiscount.toFixed(1).replace('.0','')+'%')+'</td><td class="num"><b>'+(r.discount==null?'\u2014':r.discount+'%')+'</b></td><td>'+esc64(r.statusLabel)+(r.reviewReason?'<div class="muted">'+esc64(r.reviewReason)+'</div>':'')+'</td></tr>';}).join('')+'</tbody></table></div>';modal.classList.add('on');};
  window.openMdProduct8664=openMdProduct;window.filterMdDetail8664=function(){var q=norm((document.getElementById('v8664MdDetailQ')||{}).value),st=(document.getElementById('v8664MdDetailState')||{}).value||'all',shown=0;document.querySelectorAll('#v8664MdDetailTable tbody tr').forEach(function(tr){var ok=(!q||norm(tr.textContent).indexOf(q)>=0)&&(st==='all'||tr.dataset.status===st);tr.style.display=ok?'':'none';if(ok)shown++;});var c=document.getElementById('v8664MdDetailCount');if(c)c.textContent=fint(shown)+' productos visibles';};
  window.openMdAge8664=function(bucket){mdDetailModal('Markdown \u00b7 '+bucket+' d\u00edas',mdRowsOfficial(CUR).filter(function(r){return r.actionable&&r.ageBucket===bucket;}));};
  window.openMdStatus8664=function(status){mdDetailModal('Markdown \u00b7 '+(status==='update_sample'?'Actualizar descuento muestra':status),mdRowsOfficial(CUR).filter(function(r){return r.statusKey===status;}));};
  window.openMdActions8664=function(){mdDetailModal('Productos que requieren acci\u00f3n',mdRowsOfficial(CUR).filter(function(r){return r.actionable;}));};
  function renderMdTable(){var root=document.getElementById('markdown-table-8618');if(!root)return;var rows=mdFiltered(),visible=rows.slice(0,mdLimit);function p(v){return v==null?'\u2014':Number(v).toFixed(1).replace('.0','')+'%';}root.innerHTML='<div class="v8625MarkdownWrap"><table class="v8623MarkdownTable"><thead><tr><th>C\u00f3digo</th><th>Producto</th><th>Stock</th><th>Antig\u00fcedad</th><th>Pol\u00edtica / Regla</th><th>Descuento oferta</th><th>Descuento actual (muestra)</th><th>Descuento sugerido</th><th>Brecha</th><th>Estado</th><th>Responsable</th></tr></thead><tbody>'+visible.map(function(r){var owner=r.actionable?(num(r.discount)>50?'L\u00edder de \u00c1rea':'Administrador'):(r.statusKey==='review'?'Validar dato':'\u2014');return '<tr data-md-product="'+esc64(r.code)+'" onclick="openMdProduct8664('+JSON.stringify(r.code)+')"><td><span class="code">'+esc64(r.code)+'</span></td><td><b>'+esc64(r.name)+'</b><div class="muted">'+esc64(r.category+' \u00b7 '+r.line+' \u00b7 '+r.subline)+'</div></td><td class="num">'+fint(r.stock)+'</td><td>'+esc64(r.ageLabel)+'</td><td><b>'+esc64(r.policyApplied)+'</b><div class="muted">'+esc64(r.ruleApplied)+'</div></td><td class="num">'+p(r.systemOfferDiscount)+'</td><td class="num"><b>'+p(r.currentDiscount)+'</b></td><td class="num"><b>'+p(r.discount)+'</b></td><td class="num">'+(r.gap==null?'\u2014':(r.gap>0?'+':'')+r.gap.toFixed(1).replace('.0','')+' pp')+'</td><td><span class="mdStatus31 '+(r.statusKey==='manage'?'bad':r.statusKey==='review'?'warn':r.statusKey==='no_policy'?'none':'good')+'">'+esc64(r.statusLabel)+'</span>'+(r.reviewReason?'<div class="muted">'+esc64(r.reviewReason)+'</div>':'')+'</td><td>'+esc64(owner)+'</td></tr>';}).join('')+'</tbody></table></div>'+(rows.length>visible.length?'<div class="mdLoadMore8625"><span>Mostrando '+fint(visible.length)+' de '+fint(rows.length)+' productos</span><button onclick="loadMoreMd8664()">Mostrar m\u00e1s</button></div>':'');var badge=document.getElementById('md-count-badge-8618');if(badge)badge.textContent=fint(rows.length)+' productos';}
  window.loadMoreMd8664=function(){mdLimit+=160;renderMdTable();};
  function updateMarkdown(){if(window.__LLAVERO_MARKDOWN_FINAL__)return;if(typeof VIEW==='undefined'||VIEW!=='markdown')return;var content=document.getElementById('content');if(!content)return;Array.from(content.querySelectorAll('.card')).forEach(function(c){var t=c.querySelector('.tt');if(t&&t.textContent.trim()==='Diagn\u00f3stico y gesti\u00f3n de Markdown')c.remove();});var rows=mdRowsOfficial(CUR),act=rows.filter(function(r){return r.actionable;}),review=rows.filter(function(r){return r.statusKey==='review';}),noPol=rows.filter(function(r){return r.statusKey==='no_policy';}),update=rows.filter(function(r){return r.statusKey==='update_sample';}),units=act.reduce(function(a,r){return a+num(r.stock);},0),comp=rows.filter(function(r){return ['manage','update_sample','comply','exceed'].indexOf(r.statusKey)>=0;}),compliance=comp.length?comp.filter(function(r){return r.statusKey==='comply'||r.statusKey==='exceed';}).length/comp.length*100:0,rc=reviewCounts(rows),summary=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Resumen de gesti\u00f3n';});if(summary){var grid=summary.querySelector('.v8618KpiGrid');if(grid)grid.innerHTML='<div class="kpi v8618Card k-evac" role="button" tabindex="0" onclick="openMdActions8664()"><div class="top"><div class="ico i-evac">!</div><span class="v8618Arrow">Ver detalle \u2192</span></div><div class="lab">Productos a gestionar</div><div class="val">'+fint(act.length)+' productos \u00b7 '+fint(units)+' unidades</div><div class="sub">Gestionar descuento o actualizar muestra</div></div><div class="kpi v8618Card k-amb"><div class="top"><div class="ico i-amb">\u2713</div></div><div class="lab">Cumplimiento de pol\u00edtica</div><div class="val">'+compliance.toFixed(1)+'%</div><div class="sub">Cumple o supera entre productos comparables</div></div><div class="kpi v8618Card k-rot" role="button" tabindex="0" onclick="openMdStatus8664(\'review\')"><div class="top"><div class="ico i-rot">?</div><span class="v8618Arrow">Ver detalle \u2192</span></div><div class="lab">Revisar dato</div><div class="val">'+fint(review.length)+'</div><div class="sub v8664ReviewBreak">'+fint(rc.match)+' sin coincidencia \u00b7 '+fint(rc.sample)+' sin muestra \u00b7 '+fint(rc.invalid)+' inconsistentes</div></div><div class="kpi v8618Card k-vta" role="button" tabindex="0" onclick="openMdStatus8664(\'update_sample\')"><div class="top"><div class="ico i-vta">\u21bb</div><span class="v8618Arrow">Ver detalle \u2192</span></div><div class="lab">Actualizar descuento muestra</div><div class="val">'+fint(update.length)+'</div><div class="sub">Oferta cubre la pol\u00edtica; falta cargar el sugerido como muestra</div></div><div class="kpi v8618Card" role="button" tabindex="0" onclick="openMdStatus8664(\'no_policy\')"><div class="top"><div class="ico">!</div><span class="v8618Arrow">Ver detalle \u2192</span></div><div class="lab">Sin pol\u00edtica</div><div class="val">'+fint(noPol.length)+'</div><div class="sub">Auditado por condici\u00f3n y antig\u00fcedad</div></div>';var rt=summary.querySelector('.rt');if(rt){rt.querySelectorAll('.v8662LeaderBtn,.v8664LeaderBtn').forEach(function(x){x.remove();});if(typeof IS_LEADER!=='undefined'&&IS_LEADER)rt.insertAdjacentHTML('beforeend',' <button class="v8664LeaderBtn" onclick="event.stopPropagation();openLeaderAll8664()">Todas las tiendas &gt;50%</button>');else if(typeof IS_ADMIN!=='undefined'&&IS_ADMIN)rt.insertAdjacentHTML('beforeend',' <button class="v8664LeaderBtn secondary" onclick="event.stopPropagation();exportAdmin8664()">Excel mi tienda</button>');}}
    var statusCard=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Estado actual vs. pol\u00edtica';});if(statusCard){var b=statusCard.querySelector('.cbody');if(b)b.innerHTML=mdStatusHtml(rows);}var ageCard=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Productos a gestionar por antig\u00fcedad';});if(ageCard){var ab=ageCard.querySelector('.cbody');if(ab)ab.innerHTML=mdAgeHtml(rows);}var rcCard=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Productos a gestionar por regla';});if(rcCard){var rb=rcCard.querySelector('.cbody');if(rb)rb.innerHTML=mdRuleHtml(rows);}var pc=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Productos a gestionar por pol\u00edtica';});if(pc){var pb=pc.querySelector('.cbody');if(pb)pb.innerHTML=mdPolicyHtml(rows);}var gc=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Productos con mayor brecha de descuento';});if(gc){var gb=gc.querySelector('.cbody');if(gb)gb.innerHTML=mdGapHtml(rows);}var resultSel=content.querySelector('.v8618FilterGrid select');if(resultSel&&!Array.from(resultSel.options).some(function(o){return o.value==='update_sample';})){var o=document.createElement('option');o.value='update_sample';o.textContent='Actualizar muestra';resultSel.appendChild(o);}renderMdTable();}
  function observation(r){return r.policyApplied+' \u00b7 '+r.ruleApplied+'. '+(r.currentDiscount==null?'Sin muestra':r.currentDiscount+'%')+' \u2192 '+r.discount+'%'+(r.statusKey==='update_sample'?' \u00b7 Oferta cubre pol\u00edtica':'');}
  function exportXls(rows,name){if(!rows.length){if(typeof toast==='function')toast('No hay productos seleccionados.','err');return;}var html='<html><head><meta charset="UTF-8"></head><body><table><tr><th>AGENCIA</th><th>COD</th><th>DCTO_LISTA</th><th>OBSERVACION</th></tr>'+rows.map(function(r){return '<tr><td>'+esc64(r.storeCode)+'</td><td>'+esc64(r.code)+'</td><td>'+Math.round(num(r.discount))+'</td><td>'+esc64(observation(r))+'</td></tr>';}).join('')+'</table></body></html>',blob=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name+'.xls';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},300);}
  function leaderRows(){var out=[];Object.keys(S||{}).forEach(function(sc){mdRowsOfficial(sc).forEach(function(r){if(r.actionable&&num(r.discount)>50)out.push(Object.assign({},r,{storeName:(store(sc).name||sc)}));});});return out.sort(function(a,b){return a.storeName.localeCompare(b.storeName,'es')||num(b.discount)-num(a.discount);});}
  window.openLeaderAll8664=function(){if(typeof IS_LEADER==='undefined'||!IS_LEADER){if(typeof toast==='function')toast('Funci\u00f3n exclusiva del L\u00edder de \u00c1rea.','err');return;}var rows=leaderRows();leaderSel={};rows.forEach(function(r){leaderSel[r.storeCode+'|'+r.code]=true;});var modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),ttl=document.getElementById('rangeModalTitle'),sub=document.getElementById('rangeModalSubtitle');if(!modal||!body)return;modal.classList.add('v8664Wide');if(ttl)ttl.textContent='Markdown \u00b7 Todas las tiendas >50%';if(sub)sub.textContent='Funci\u00f3n exclusiva del L\u00edder de \u00c1rea';var stores=unique(rows,function(r){return r.storeName;});body.innerHTML='<div class="v8664SelectBar"><button class="v8664LeaderBtn" onclick="toggleAllLeader8664(true)">Seleccionar todos</button><button class="v8664LeaderBtn secondary" onclick="toggleAllLeader8664(false)">Quitar selecci\u00f3n</button><input id="v8664LeaderQ" placeholder="Buscar tienda, c\u00f3digo o producto" oninput="filterLeader8664()"><select id="v8664LeaderStore" onchange="filterLeader8664()">'+selectOpts(stores,'Todas las tiendas')+'</select><span class="badge mut" id="v8664LeaderCount">'+fint(rows.length)+' seleccionados</span><button class="v8664LeaderBtn" onclick="exportLeader8664()">Generar Excel consolidado</button></div><div class="v80TableWrap"><table class="v80Table v8664DetailTable" id="v8664LeaderTable"><thead><tr><th><input type="checkbox" checked onchange="toggleAllLeader8664(this.checked)"></th><th>Tienda</th><th>C\u00f3digo</th><th>Producto</th><th class="num">Actual/Muestra</th><th class="num">Oferta</th><th class="num">Sugerido</th><th>Estado</th></tr></thead><tbody>'+rows.map(function(r){var k=r.storeCode+'|'+r.code;return '<tr data-key="'+esc64(k)+'" data-store="'+esc64(r.storeName)+'"><td><input type="checkbox" checked onclick="event.stopPropagation()" onchange="toggleLeaderOne8664('+JSON.stringify(k)+',this.checked)"></td><td><b>'+esc64(r.storeName)+'</b><div class="muted">'+esc64(r.storeCode)+'</div></td><td><span class="code">'+esc64(r.code)+'</span></td><td><b>'+esc64(r.name)+'</b></td><td class="num">'+(r.currentDiscount==null?'\u2014':r.currentDiscount+'%')+'</td><td class="num">'+(r.systemOfferDiscount==null?'\u2014':r.systemOfferDiscount+'%')+'</td><td class="num"><b>'+r.discount+'%</b></td><td>'+esc64(r.statusLabel)+'</td></tr>';}).join('')+'</tbody></table></div>';modal.classList.add('on');};
  function updateLeaderCount(){var n=Object.keys(leaderSel).filter(function(k){return leaderSel[k];}).length,c=document.getElementById('v8664LeaderCount');if(c)c.textContent=fint(n)+' seleccionados';}
  window.toggleAllLeader8664=function(v){document.querySelectorAll('#v8664LeaderTable tbody tr').forEach(function(tr){if(tr.style.display==='none')return;leaderSel[tr.dataset.key]=!!v;var cb=tr.querySelector('input[type=checkbox]');if(cb)cb.checked=!!v;});updateLeaderCount();};
  window.toggleLeaderOne8664=function(k,v){leaderSel[k]=!!v;updateLeaderCount();};
  window.filterLeader8664=function(){var q=norm((document.getElementById('v8664LeaderQ')||{}).value),st=(document.getElementById('v8664LeaderStore')||{}).value||'all';document.querySelectorAll('#v8664LeaderTable tbody tr').forEach(function(tr){tr.style.display=(!q||norm(tr.textContent).indexOf(q)>=0)&&(st==='all'||tr.dataset.store===st)?'':'none';});};
  window.exportLeader8664=function(){var rows=leaderRows().filter(function(r){return leaderSel[r.storeCode+'|'+r.code];});exportXls(rows,'Markdown_Lider_Todas_Tiendas_'+text(DB&&DB.meta&&DB.meta.fecha||'corte'));};
  window.exportAdmin8664=function(){if(typeof IS_ADMIN==='undefined'||!IS_ADMIN)return;var rows=mdRowsOfficial(CUR).filter(function(r){return r.actionable&&num(r.discount)<=50;});exportXls(rows,'Markdown_Administrador_'+CUR+'_'+text(DB&&DB.meta&&DB.meta.fecha||'corte'));};
  function parseDate(v){var s=text(v).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:'';}
  function days(a,b){if(!a||!b)return 0;var x=new Date(a+'T00:00:00'),y=new Date(b+'T00:00:00');return Math.max(0,Math.round((y-x)/86400000));}
  function trStatus(x){var raw=norm(x&&x.estatus||x&&x.statusRaw);if(raw.indexOf('ENTREG')>=0)return 'Entregado';if(raw.indexOf('RUTA')>=0)return 'En Ruta';if(raw.indexOf('PICKING')>=0)return 'En picking';if(raw.indexOf('PEND')>=0)return 'Pendiente';var p=norm(x&&x.statusGlobalPicking||x&&x.pick),m=norm(x&&x.statusMovimiento||x&&x.mov);if(p==='C'&&m==='C')return 'Entregado';if(p==='C'&&m!=='C')return 'En Ruta';return 'Pendiente';}
  function trLineKey(x){return [code(x&&x.codigo||x&&x.code),parseDate(x&&x.fechaCreacion||x&&x.created),parseDate(x&&x.fechaEntrega||x&&x.eta),String(Math.round(num(x&&x.unidades||x&&x.units)*1000)/1000)].join('|');}
  function historyData(){try{var el=document.getElementById('embeddedHistory');return JSON.parse(el&&el.textContent||'{}')||{};}catch(_){return {};}}
  function detailMap(cut,sc){var out={},st=cut&&cut.stores&&cut.stores[sc],arr=st&&Array.isArray(st.tr)?st.tr:[];arr.forEach(function(item){var p=text(item&&item[0]).split('|');if(p.length<6)return;var k=[code(p[0]),parseDate(p[1]),parseDate(p[2]),String(Math.round(num(p[3])*1000)/1000)].join('|'),s=trStatus({statusGlobalPicking:p[4],statusMovimiento:p[5]});(out[k]||(out[k]=[])).push(s);});return out;}
  function orderStatus(rows){var st=Array.from(new Set(rows.map(trStatus)));return st.length===1?st[0]:'Mixto';}
  function transferMeta(sc){sc=sc||CUR;var st=store(sc),current=Array.isArray(st.trDetalle)?st.trDetalle:[],groups={};current.forEach(function(r){var id=text(r.entrega||'SIN IDENTIFICAR');(groups[id]||(groups[id]=[])).push(r);});var date=parseDate(DB&&DB.meta&&DB.meta.fecha)||parseDate((historyData().details||[]).slice(-1)[0]&&historyData().details.slice(-1)[0].date),cuts=(historyData().details||[]).filter(function(x){return x&&x.date&&x.date<=date;}).sort(function(a,b){return text(a.date).localeCompare(text(b.date));}),out={};Object.keys(groups).forEach(function(id){var lines=groups[id],keys=Array.from(new Set(lines.map(trLineKey))),series=[];cuts.forEach(function(cut){var mp=detailMap(cut,sc),statuses=[],matched=0;keys.forEach(function(k){if(mp[k]&&mp[k].length){matched++;statuses=statuses.concat(mp[k]);}});var threshold=keys.length<=2?1:Math.ceil(keys.length*.35);if(matched>=threshold){var u=Array.from(new Set(statuses)),s=u.length===1?u[0]:'Mixto';series.push({date:cut.date,status:s});}});var cur=orderStatus(lines);series.push({date:date,status:cur});var byDate={};series.forEach(function(x){byDate[x.date]=x;});series=Object.keys(byDate).sort().map(function(d){return byDate[d];});var since=date;for(var i=series.length-1;i>=0;i--){if(series[i].status===cur)since=series[i].date;else break;}out[id]={status:cur,since:since,days:days(since,date),series:series};});return out;}
  function patchTransferTable(){if(typeof VIEW==='undefined'||VIEW!=='traslados')return;var map=transferMeta(CUR),delivery=document.querySelector('#tr-tbl table.deliveryView8615');if(delivery)delivery.querySelectorAll('tbody tr[data-delivery]').forEach(function(tr){var m=map[tr.dataset.delivery],cell=tr.cells[5];if(m&&cell){var b=cell.querySelector('b');if(b)b.textContent=m.since;var sm=cell.querySelector('small');if(sm)sm.textContent=m.days+' d\u00edas en estado';else cell.insertAdjacentHTML('beforeend','<small class="v8664TransferDays">'+m.days+' d\u00edas en estado</small>');}});var prod=document.querySelector('#tr-tbl table.productView862');if(prod)prod.querySelectorAll('tbody tr[data-delivery]').forEach(function(tr){var m=map[tr.dataset.delivery],cell=tr.cells[tr.cells.length-1];if(m&&cell&&!cell.querySelector('.v8664TransferDays'))cell.insertAdjacentHTML('beforeend','<small class="v8664TransferDays">'+m.days+' d\u00edas en este estado</small>');});}
  function patchTransferModal(id,sc){var body=document.getElementById('v80ModalBody');if(!body)return;var map=transferMeta(sc||CUR),m=map[text(id)];if(!m)return;if(!body.querySelector('.v8664TransferCurrent'))body.insertAdjacentHTML('afterbegin','<div class="v8664TransferCurrent"><span>Estado actual</span><b>'+esc64(m.status)+'</b><span>Desde '+esc64(m.since)+'</span><b>'+fint(m.days)+' d\u00edas</b></div>');var hist=body.querySelector('.transferHistory8615 table');if(hist&&!hist.dataset.v8664){hist.dataset.v8664='1';var th=document.createElement('th');th.textContent='D\u00edas en estado';hist.tHead.rows[0].appendChild(th);var start='',last='';Array.from(hist.tBodies[0].rows).forEach(function(tr){var d=parseDate(tr.cells[0].textContent),st=tr.cells[1].textContent.trim();if(st!==last){start=d;last=st;}var td=document.createElement('td');td.innerHTML='<b>'+fint(days(start,d))+'</b> d\u00edas';tr.appendChild(td);});}}
  function afterRender(){setTimeout(function(){try{structureComposition();ensureTrend();applyTrackingUi();removeInventoryDuplicateCards();ensureProxRisk();updateMarkdown();patchTransferTable();}catch(err){console.error('V86.64 post render',err);}mark();},120);}
  function mark(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='11/08/2026 \u00b7 '+VERSION;document.title='Llavero \u00b7 Inventarios Jamar \u00b7 11/08/2026 \u00b7 '+VERSION;}catch(_){}}
  function install(){if(installed)return true;if(!window.__LLAVERO_V8662_READY__||typeof S==='undefined'||!S||typeof window.setView!=='function')return false;installed=true;window.mdRows8618=mdRowsOfficial;window.mdRows8662=mdRowsOfficial;var baseRefresh=window.refresh,baseSet=window.setView,baseDrawMd=window.drawMarkdown8617,baseDrawTr=window.drawTr8615||window.drawTr,baseOpenDelivery=window.openDelivery862;if(typeof baseRefresh==='function')window.refresh=function(){var out=baseRefresh.apply(this,arguments);afterRender();return out;};if(typeof baseSet==='function')window.setView=function(v){var out=baseSet.apply(this,arguments);mdLimit=160;afterRender();return out;};if(typeof baseDrawMd==='function')window.drawMarkdown8617=function(){var out=baseDrawMd.apply(this,arguments);mdLimit=160;setTimeout(updateMarkdown,35);return out;};if(typeof baseDrawTr==='function'){var draw=function(){var out=baseDrawTr.apply(this,arguments);setTimeout(patchTransferTable,25);return out;};window.drawTr8615=window.drawTr862=window.drawTr80=window.drawTr=draw;}if(typeof baseOpenDelivery==='function')window.openDelivery862=function(id,sc){var out=baseOpenDelivery.apply(this,arguments);setTimeout(function(){patchTransferModal(id,sc||CUR);},180);setTimeout(function(){patchTransferModal(id,sc||CUR);},420);return out;};window.openDelivery80=window.openDelivery862;afterRender();console.info('LLAVERO V86.64 - correcciones de composicion, cortes, tendencia, Markdown y traslados');return true;}
  function start(){if(install())return;setTimeout(start,180);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();window.addEventListener('llavero:bootstrapped',function(){setTimeout(start,250);},{once:true});
})();


/* ==== llaveroV8665PriceScript ==== */

(function(){
  'use strict';
  var VERSION='V86.65',installed=false;
  function txt(v){return v==null?'':String(v);}
  function num(v){var x=Number(v);return Number.isFinite(x)?x:null;}
  function esc65(v){return txt(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function money65(v){var x=num(v);if(x==null)return '—';try{return typeof fMoneyCOP==='function'?fMoneyCOP(x):'$ '+Math.round(x).toLocaleString('es-CO');}catch(_){return '$ '+Math.round(x).toLocaleString('es-CO');}}
  function pct65(v){var x=num(v);return x==null?'—':(Math.round(x*10)/10).toFixed(1).replace('.0','')+'%';}
  function pad65(n){n=Math.floor(n);return n<10?'0'+n:''+n;}
  function date65(v){var s=txt(v);if(!s)return 'Sin dato';var m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return m[3]+'/'+m[2]+'/'+m[1];var serial=Number(s);if(Number.isFinite(serial)&&serial>20000&&serial<80000){var dt=new Date(Math.round((serial-25569)*86400*1000));if(!isNaN(dt.getTime()))return pad65(dt.getUTCDate())+'/'+pad65(dt.getUTCMonth()+1)+'/'+dt.getUTCFullYear();}return s;}
  function sc65(){try{return typeof CUR!=='undefined'?CUR:'';}catch(_){return '';}}
  function lookup65(sc,c){try{return typeof window.discountActual18==='function'?window.discountActual18(sc||sc65(),c):null;}catch(_){return null;}}
  function mdRow65(sc,c){try{var fn=window.mdRows8618||window.mdRows8664||window.mdRows8662;if(typeof fn!=='function')return null;return (fn(sc||sc65())||[]).find(function(r){return String(r.code)===String(c);})||null;}catch(_){return null;}}
  function action65(r){if(!r)return '—';if(r.statusKey==='manage')return 'Gestionar descuento';if(r.statusKey==='update_sample')return 'Actualizar descuento muestra';if(r.statusKey==='comply')return 'Cumple política';if(r.statusKey==='exceed')return 'Supera política';if(r.statusKey==='review')return 'Validar descuento muestra';if(r.statusKey==='no_policy')return 'Validar política';return r.statusLabel||'—';}
  function setDetailValue65(body,label,value){var labs=Array.from(body.querySelectorAll('label'));var lab=labs.find(function(x){return (x.textContent||'').trim().toLowerCase()===label.toLowerCase();});if(!lab)return false;var item=lab.closest('.detailItem');var b=item&&item.querySelector('b');if(b)b.textContent=value;return !!b;}
  function patchProduct65(code){
    var body=document.getElementById('inventoryProductBody');if(!body)return;
    var d=lookup65(sc65(),code),r=mdRow65(sc65(),code);
    if(d){
      setDetailValue65(body,'Precio oferta',money65(d.precioOferta));
      setDetailValue65(body,'Precio lista',money65(d.precioLista));
      var sec=Array.from(body.querySelectorAll('.detailSection')).find(function(x){var t=x.querySelector('.detailSectionTitle');return t&&(t.textContent||'').trim()==='Valores del producto';});
      if(sec){var grid=sec.querySelector('.detailGrid');if(grid&&!grid.querySelector('[data-v8665-lo]'))grid.insertAdjacentHTML('beforeend','<div class="detailItem" data-v8665-lo><label>Descuento oferta</label><b>'+pct65(d.descuentoOfertaSistema)+'</b></div>');
        if(grid&&!grid.querySelector('[data-v8665-zone]')){var cat=window.__LLAVERO_DISCOUNT_DATA__||{},zone=cat.storeZones&&cat.storeZones[sc65()]||'Zona sin definir';grid.insertAdjacentHTML('beforeend','<div class="detailItem" data-v8665-zone><label>Zona de precio</label><b>'+esc65(zone)+'</b></div>');}
      }
    }
    Array.from(body.querySelectorAll('.v8618MarkdownDetail')).forEach(function(x){x.remove();});
    var md=body.querySelector('.markdownDetail8617');
    if(md&&r){
      var d2=d||{},reason=r.ruleApplied||r.reason||'',pill=r.discount==null?'Sin política':pct65(r.discount),status=r.reviewReason?r.statusLabel+' · '+r.reviewReason:r.statusLabel;
      md.innerHTML='<div class="mdTitle8617"><div><h4>Recomendación de Markdown</h4><p>'+esc65(reason)+'</p></div><span class="discountPill8617 '+(r.discount==null?'none':'')+'">'+esc65(pill)+'</span></div>'+
        '<div class="v8665KeyRow">'+
        '<div class="v8665KeyItem"><label>Descuento sugerido</label><b>'+pct65(r.discount)+'</b></div>'+
        '<div class="v8665KeyItem"><label>Estado</label><b>'+esc65(status||'—')+'</b></div>'+
        '<div class="v8665KeyItem"><label>Acción</label><b>'+esc65(action65(r))+'</b></div>'+
        '</div>'+
        '<div class="markdownDetailGrid8617 v8665MarkdownGrid">'+
        '<div class="markdownDetailItem8617"><label>Precio lista</label><b>'+money65(d2.precioLista)+'</b></div>'+
        '<div class="markdownDetailItem8617"><label>Precio oferta</label><b>'+money65(d2.precioOferta)+'</b></div>'+
        '<div class="markdownDetailItem8617"><label>Descuento oferta</label><b>'+pct65(d2.descuentoOfertaSistema)+'</b></div>'+
        '<div class="markdownDetailItem8617"><label>Descuento actual / muestra</label><b>'+pct65(d2.descuentoAdministrado)+'</b></div>'+
        '<div class="markdownDetailItem8617"><label>Fecha descuento administrador</label><b>'+esc65(date65(d2.fechaActualizacion))+'</b></div>'+
        '</div>'+
        '<div class="markdownAction8617" style="margin-top:10px"><button data-md-code="'+esc65(r.code)+'" onclick="copyMarkdown8617(this.dataset.mdCode)">Copiar recomendación</button>'+(r.actionable?'<button data-md-code="'+esc65(r.code)+'" onclick="openMarkdownPortal8617(this.dataset.mdCode)">'+(r.statusKey==='update_sample'?'Actualizar muestra':'Gestionar en portal')+'</button>':'')+'</div>';
    }
  }
  window.copyMarkdown8617=function(c){var r=mdRow65(sc65(),c),d=lookup65(sc65(),c);if(!r)return;var s='Producto: '+r.code+' · '+r.name+'\nTienda: '+((typeof S!=='undefined'&&S[sc65()]&&S[sc65()].name)||sc65())+'\nDescuento oferta: '+pct65(d&&d.descuentoOfertaSistema)+'\nDescuento actual / muestra: '+pct65(d&&d.descuentoAdministrado)+'\nFecha descuento administrador: '+date65(d&&d.fechaActualizacion)+'\nDescuento sugerido: '+pct65(r.discount)+'\nEstado: '+r.statusLabel+(r.reviewReason?' · '+r.reviewReason:'')+'\nAcción: '+action65(r);try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(s).then(function(){if(typeof toast==='function')toast('Recomendación copiada.','ok');});else if(typeof toast==='function')toast(s);}catch(_){}};
  function insertDateColumn65(table,codeAttr){if(!table||!table.tHead||!table.tBodies.length||table.dataset.v8665Date==='1')return;var ths=Array.from(table.tHead.rows[0].cells),idx=ths.findIndex(function(th){return /descuento actual/i.test(th.textContent||'');});if(idx<0)return;var th=document.createElement('th');th.textContent='Fecha';table.tHead.rows[0].insertBefore(th,table.tHead.rows[0].cells[idx+1]||null);Array.from(table.tBodies[0].rows).forEach(function(tr){var c=codeAttr?tr.getAttribute(codeAttr):'';if(!c){var ce=tr.querySelector('.code');c=ce&&(ce.textContent||'').trim();}var d=lookup65(sc65(),c),td=document.createElement('td');td.className='v8665DateCell';td.textContent=date65(d&&d.fechaActualizacion);tr.insertBefore(td,tr.cells[idx+1]||null);});table.dataset.v8665Date='1';}
  function patchMarkdownTables65(){
    if(typeof VIEW!=='undefined'&&VIEW!=='markdown')return;
    var main=document.querySelector('#markdown-table-8618 table.v8623MarkdownTable');if(main){var ths=Array.from(main.querySelectorAll('thead th'));ths.forEach(function(th){if((th.textContent||'').trim()==='Oferta')th.textContent='Descuento oferta';});insertDateColumn65(main,'data-md-product');}
    var detail=document.getElementById('v8664MdDetailTable');if(detail){Array.from(detail.querySelectorAll('thead th')).forEach(function(th){if((th.textContent||'').trim()==='Oferta')th.textContent='Descuento oferta';});insertDateColumn65(detail,null);}
    var leader=document.getElementById('v8664LeaderTable');if(leader){Array.from(leader.querySelectorAll('thead th')).forEach(function(th){if((th.textContent||'').trim()==='Oferta')th.textContent='Descuento oferta';});insertDateColumn65(leader,null);}
  }
  function mark65(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='11/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 11/08/2026 · '+VERSION;}catch(_){}}
  function patchAll65(){patchMarkdownTables65();mark65();}
  function wrapModalFn65(name){var fn=window[name];if(typeof fn!=='function'||fn.__v8665)return;var w=function(){var out=fn.apply(this,arguments);setTimeout(patchMarkdownTables65,60);setTimeout(patchMarkdownTables65,180);return out;};w.__v8665=true;window[name]=w;}
  function install65(){
    if(installed)return true;if(!window.__LLAVERO_BOOTSTRAPPED__||typeof window.mdRows8664!=='function'||typeof window.openInventoryProduct!=='function')return false;installed=true;
    var inv=window.openInventoryProduct;window.openInventoryProduct=function(c){var out=inv.apply(this,arguments);setTimeout(function(){patchProduct65(c);},80);setTimeout(function(){patchProduct65(c);},220);return out;};
    if(typeof window.openBestProductDetail==='function'){var best=window.openBestProductDetail;window.openBestProductDetail=function(c){var out=best.apply(this,arguments);setTimeout(function(){patchProduct65(c);},100);setTimeout(function(){patchProduct65(c);},240);return out;};}
    ['openMdAge8664','openMdStatus8664','openMdActions8664','openMdRule8664','openMdPolicy8664','openLeaderAll8664'].forEach(wrapModalFn65);
    if(typeof window.drawMarkdown8617==='function'){var draw=window.drawMarkdown8617;window.drawMarkdown8617=function(){var out=draw.apply(this,arguments);setTimeout(patchMarkdownTables65,120);setTimeout(patchMarkdownTables65,260);return out;};}
    if(typeof window.setView==='function'){var sv=window.setView;window.setView=function(){var out=sv.apply(this,arguments);setTimeout(patchAll65,180);setTimeout(patchAll65,360);return out;};}
    if(typeof window.refresh==='function'){var rf=window.refresh;window.refresh=function(){var out=rf.apply(this,arguments);setTimeout(patchAll65,180);return out;};}
    mark65();setTimeout(patchAll65,300);setTimeout(patchAll65,1200);console.info('LLAVERO V86.65 · precios zonales + descuento administrador/fecha separados de la política OF');return true;
  }
  function start65(){if(install65())return;setTimeout(start65,200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start65,{once:true});else start65();window.addEventListener('llavero:bootstrapped',function(){setTimeout(start65,250);},{once:true});
})();


/* ==== llaveroV8666Script ==== */

(function(){
  'use strict';
  var VERSION='V86.66',installed=false,baseMdRows66=null,mdLimit66=160,leaderSel66={},transferSel66={};
  function text(v){return v==null?'':String(v);} function num(v){var x=Number(v);return Number.isFinite(x)?x:0;} function nullable(v){if(v==null||v==='')return null;var x=Number(v);return Number.isFinite(x)?x:null;}
  function code(v){try{return typeof safeCode==='function'?safeCode(v):text(v).trim();}catch(_){return text(v).trim();}}
  function norm(v){var s=text(v);try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(_){}return s.toUpperCase().trim();}
  function esc(v){return text(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function fint(v){try{return typeof fInt==='function'?fInt(v):Math.round(num(v)).toLocaleString('es-CO');}catch(_){return String(Math.round(num(v)));}}
  function money(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(num(v)):'$ '+Math.round(num(v)).toLocaleString('es-CO');}catch(_){return '$ '+Math.round(num(v)).toLocaleString('es-CO');}}
  function pct(v){var x=nullable(v);return x==null?'—':x.toFixed(1).replace('.0','')+'%';}
  function store(sc){try{return (S&&S[sc||CUR])||{};}catch(_){return {};}}
  function discount(sc,c){try{return typeof window.discountActual18==='function'?window.discountActual18(sc,c):null;}catch(_){return null;}}
  function currentView(){try{return VIEW;}catch(_){return '';}}
  function image(c,size){try{return typeof imageThumb==='function'?imageThumb(c,size||'sm'):'';}catch(_){return '';}}
  function dateLabel(v){var s=text(v);if(!s)return 'Sin dato';var m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[3]+'/'+m[2]+'/'+m[1]:s;}
  function statusLabel(k){return k==='manage'?'Gestionar':k==='update_sample'?'Actualizar descuento muestra':k==='comply'?'Cumple':k==='exceed'?'Supera política':k==='review'?'Revisar dato':k==='no_policy'?'Sin política':k;}

  /* Markdown: ausencia en reporte = muestra 0. */
  function mdRows66(sc){
    sc=sc||CUR;var src=baseMdRows66?baseMdRows66(sc):[],tol=.049;
    return (src||[]).map(function(old){var r=Object.assign({},old),suggested=nullable(r.discount);if(suggested==null)return r;var d=discount(sc,r.code),raw=d?d.descuentoAdministrado:null,invalid=raw!=null&&raw!==''&&!Number.isFinite(Number(raw)),admin=invalid?null:(raw==null||raw===''?0:Number(raw)),offer=nullable(d&&d.descuentoOfertaSistema);if(offer==null)offer=nullable(r.systemOfferDiscount);
      var status='review',reason='Dato de descuento inconsistente';
      if(!invalid){if(admin>suggested+tol){status='exceed';reason='El descuento muestra supera la política';}else if(admin>=suggested-tol){status='comply';reason='El descuento muestra cumple la política';}else if(admin===0&&offer!=null&&offer>=suggested-tol){status='update_sample';reason='La oferta ya cubre la política; cargar el sugerido como descuento muestra';}else{status='manage';reason='El descuento sugerido es mayor al descuento actual de muestra';}}
      r.currentDiscount=admin;r.adminDiscount=admin;r.hasCurrentDiscountData=!invalid;r.systemOfferDiscount=offer;r.gap=invalid?null:suggested-admin;r.statusKey=status;r.statusLabel=statusLabel(status);r.actionable=status==='manage'||status==='update_sample';r.updateSample=status==='update_sample';r.reviewReason=status==='review'?reason:'';r.reason=reason;r.actionText=reason;r.currentDiscountSource='Muestra / Administrador';if(d){if(d.precioLista!=null)r.priceList=Number(d.precioLista);if(d.precioOferta!=null)r.priceOffer=Number(d.precioOferta);r.adminDate=d.fechaActualizacion||'';}else r.adminDate='';return r;});
  }
  function mdFiltered66(sc){var rows=mdRows66(sc||CUR).slice(),s=window.mdState8618||{},q=norm(s.q),card=s.card||'all';if(card==='manage'||card==='actionable')rows=rows.filter(function(r){return r.actionable;});else if(card==='update_sample')rows=rows.filter(function(r){return r.statusKey==='update_sample';});else if(['comply','exceed','review','no_policy'].indexOf(card)>=0)rows=rows.filter(function(r){return r.statusKey===card;});if(s.type&&s.type!=='all')rows=rows.filter(function(r){if(s.type==='outside')return r.typeKey==='fs'||r.typeKey==='fs_last';if(s.type==='last_unit')return r.typeKey==='fs_last';return r.typeKey===s.type;});if(s.age&&s.age!=='all')rows=rows.filter(function(r){return r.ageKey===s.age;});if(s.discount&&s.discount!=='all')rows=rows.filter(function(r){return String(r.discount)===String(s.discount);});if(s.responsible&&s.responsible!=='all')rows=rows.filter(function(r){if(r.statusKey==='review')return true;if(!r.actionable)return false;return s.responsible==='leader'?num(r.discount)>50:num(r.discount)<=50;});if(q)rows=rows.filter(function(r){return norm([r.code,r.name,r.category,r.line,r.subline,r.policyApplied,r.ruleApplied,r.statusLabel,r.reviewReason].join(' ')).indexOf(q)>=0;});return rows;}
  function responsible(r){if(r.statusKey==='review')return 'Validar dato';if(!r.actionable)return '—';return num(r.discount)>50?'Líder de Área':'Administrador';}
  function renderMdTable66(){var root=document.getElementById('markdown-table-8618');if(!root||currentView()!=='markdown')return;var rows=mdFiltered66(CUR),visible=rows.slice(0,mdLimit66);root.innerHTML='<div class="v8666MdTableWrap"><table class="v8666MdTable v8623MarkdownTable"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Stock</th><th>Antigüedad</th><th>Política / Regla</th><th>Descuento oferta</th><th>Descuento actual (muestra)</th><th>Fecha</th><th>Descuento sugerido</th><th>Brecha</th><th>Estado</th><th>Responsable</th></tr></thead><tbody>'+visible.map(function(r){var d=discount(CUR,r.code),date=(d&&d.fechaActualizacion)||r.adminDate||'';return '<tr data-md-product="'+esc(r.code)+'" onclick="openMdProduct8664('+JSON.stringify(r.code)+')"><td>'+image(r.code,'sm')+'</td><td><span class="code">'+esc(r.code)+'</span></td><td><div class="v8666ProductName">'+esc(r.name)+'</div><div class="v8666ProductMeta">'+esc(r.category+' · '+r.line+' · '+r.subline)+'</div></td><td class="num"><b>'+fint(r.stock)+'</b></td><td>'+esc(r.ageLabel)+'</td><td><b>'+esc(r.policyApplied)+'</b><div class="muted">'+esc(r.ruleApplied)+'</div></td><td class="num">'+pct(r.systemOfferDiscount)+'</td><td class="num"><b>'+pct(r.currentDiscount)+'</b></td><td>'+esc(dateLabel(date))+'</td><td class="num"><b>'+pct(r.discount)+'</b></td><td class="num">'+(r.gap==null?'—':(r.gap>0?'+':'')+Number(r.gap).toFixed(1).replace('.0','')+' pp')+'</td><td><span class="mdStatus31 '+(r.statusKey==='manage'?'bad':r.statusKey==='review'?'warn':r.statusKey==='no_policy'?'none':'good')+'">'+esc(r.statusLabel)+'</span></td><td>'+esc(responsible(r))+'</td></tr>';}).join('')+'</tbody></table></div>'+(rows.length>visible.length?'<div class="mdLoadMore8625"><span>Mostrando '+fint(visible.length)+' de '+fint(rows.length)+' productos</span><button onclick="loadMoreMd8666()">Mostrar más</button></div>':'');var b=document.getElementById('md-count-badge-8618');if(b)b.textContent=fint(rows.length)+' productos';}
  window.loadMoreMd8666=function(){mdLimit66+=160;renderMdTable66();};

  function mdDetail66(title,rows){var modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle');if(!modal||!body)return;modal.classList.add('v8664Wide');if(tt)tt.textContent=title;if(ss)ss.textContent=(store(CUR).name||CUR)+' · '+fint(rows.length)+' productos';var states=Array.from(new Set(rows.map(function(r){return r.statusKey;}))).sort();body.innerHTML='<div class="v8664DetailTools" style="grid-template-columns:minmax(280px,1fr) 180px"><div class="v8664Field"><label>Buscar</label><input id="v8666MdDetailQ" placeholder="Código, producto, categoría, línea o sublínea" oninput="filterMdDetail8666()"></div><div class="v8664Field"><label>Estado</label><select id="v8666MdDetailState" onchange="filterMdDetail8666()"><option value="all">Todos</option>'+states.map(function(x){return '<option value="'+esc(x)+'">'+esc(statusLabel(x))+'</option>';}).join('')+'</select></div></div><div class="v8664DetailCount"><span id="v8666MdDetailCount">'+fint(rows.length)+' productos</span><span>Selecciona una fila para abrir el detalle</span></div><div class="v80TableWrap"><table class="v80Table v8666MdDetailTable" id="v8666MdDetailTable"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Stock</th><th>Antigüedad</th><th>Regla</th><th class="num">Oferta</th><th class="num">Actual/Muestra</th><th class="num">Sugerido</th><th>Estado</th></tr></thead><tbody>'+rows.map(function(r){return '<tr data-status="'+esc(r.statusKey)+'" onclick="openMdProduct8664('+JSON.stringify(r.code)+')"><td>'+image(r.code,'sm')+'</td><td><span class="code">'+esc(r.code)+'</span></td><td><div class="v8666ProductName">'+esc(r.name)+'</div><div class="v8666ProductMeta">'+esc(r.category+' · '+r.line+' · '+r.subline)+'</div></td><td class="num"><b>'+fint(r.stock)+'</b></td><td>'+esc(r.ageLabel)+'</td><td>'+esc(r.ruleApplied)+'</td><td class="num">'+pct(r.systemOfferDiscount)+'</td><td class="num">'+pct(r.currentDiscount)+'</td><td class="num"><b>'+pct(r.discount)+'</b></td><td>'+esc(r.statusLabel)+'</td></tr>';}).join('')+'</tbody></table></div>';modal.classList.add('on');}
  window.filterMdDetail8666=function(){var q=norm((document.getElementById('v8666MdDetailQ')||{}).value),st=(document.getElementById('v8666MdDetailState')||{}).value||'all',shown=0;document.querySelectorAll('#v8666MdDetailTable tbody tr').forEach(function(tr){var ok=(!q||norm(tr.textContent).indexOf(q)>=0)&&(st==='all'||tr.dataset.status===st);tr.style.display=ok?'':'none';if(ok)shown++;});var c=document.getElementById('v8666MdDetailCount');if(c)c.textContent=fint(shown)+' productos visibles';};
  window.openMdActions8666=function(){mdDetail66('Markdown · Productos a gestionar',mdRows66(CUR).filter(function(r){return r.actionable;}));};
  window.openMdPolicy8666=function(kind){mdDetail66('Markdown · '+(kind==='rot'?'Rotación':'Evacuación'),mdRows66(CUR).filter(function(r){return r.actionable&&r.policyApplied===(kind==='rot'?'Rotación':'Evacuación');}));};
  window.openMdAge8666=function(bucket){mdDetail66('Markdown · '+bucket+' días',mdRows66(CUR).filter(function(r){return r.actionable&&r.ageBucket===bucket;}));};
  window.openMdStatus8666=function(status){mdDetail66('Markdown · '+statusLabel(status),mdRows66(CUR).filter(function(r){return r.statusKey===status;}));};

  function policyChart66(rows){var act=rows.filter(function(r){return r.actionable;}),rot=act.filter(function(r){return r.policyApplied==='Rotación';}),ev=act.filter(function(r){return r.policyApplied==='Evacuación';}),total=Math.max(1,act.length);function units(list){return list.reduce(function(a,r){return a+num(r.stock);},0);}function card(kind,label,list,cls){var pc=list.length/total*100;return '<button class="v8666PolicyCard '+(cls||'')+'" onclick="openMdPolicy8666(\''+kind+'\')"><div class="v8666PolicyHead"><b>'+label+'</b><span>Ver productos →</span></div><div class="v8666PolicyNumbers"><div class="v8666PolicyNumber"><label>Productos</label><b>'+fint(list.length)+'</b></div><div class="v8666PolicyNumber"><label>Unidades</label><b>'+fint(units(list))+'</b></div><div class="v8666PolicyNumber"><label>Participación</label><b>'+pc.toFixed(1)+'%</b></div></div><div class="v8666PolicyTrack"><i style="width:'+pc+'%"></i></div></button>';}return '<div class="v8666PolicyGrid">'+card('rot','Rotación',rot,'')+card('evac','Evacuación',ev,'evac')+'</div><div class="dashboardNote">Porcentaje calculado sobre los productos que requieren gestión de Markdown.</div>';}
  function ageChart66(rows){var defs=[['0-60','0–60'],['61-90','61–90'],['91-150','91–150'],['151-180','151–180'],['181-210','181–210'],['211-240','211–240'],['241-360','241–360'],['360+','+360']],act=rows.filter(function(r){return r.actionable;}),mx=Math.max.apply(null,defs.map(function(a){return act.filter(function(r){return r.ageBucket===a[0];}).length;}).concat([1]));return '<div class="v8664MdAge">'+defs.map(function(a){var list=act.filter(function(r){return r.ageBucket===a[0];}),u=list.reduce(function(x,r){return x+num(r.stock);},0),c=list.length;return '<button onclick="openMdAge8666(\''+a[0]+'\')" title="'+fint(c)+' productos · '+fint(u)+' unidades"><b>'+fint(c)+'</b><div class="track"><i style="height:'+Math.max(c?4:0,c/mx*100)+'%"></i></div><span>'+a[1]+'<br>'+fint(u)+' u</span></button>';}).join('')+'</div><div class="dashboardNote">Selecciona una barra para consultar los productos y unidades del rango.</div>';}
  function statusChart66(rows){var defs=[['manage','Gestionar','var(--bad)'],['update_sample','Actualizar muestra','var(--rot)'],['comply','Cumple','var(--ok)'],['exceed','Supera política','var(--amb)'],['review','Revisar dato','#d58d00'],['no_policy','Sin política','var(--mut)']],mx=Math.max.apply(null,defs.map(function(d){return rows.filter(function(r){return r.statusKey===d[0];}).length;}).concat([1]));return '<div class="v8664MdStatus">'+defs.map(function(d){var c=rows.filter(function(r){return r.statusKey===d[0];}).length;return '<button class="v8664MdBar" onclick="openMdStatus8666(\''+d[0]+'\')"><b>'+fint(c)+'</b><div class="v8664MdTrack"><i style="height:'+Math.max(c?4:0,c/mx*100)+'%;background:'+d[2]+'"></i></div><span>'+d[1]+'</span></button>';}).join('')+'</div>';}
  function updateMarkdown66(){if(window.__LLAVERO_MARKDOWN_FINAL__)return;if(currentView()!=='markdown')return;var content=document.getElementById('content');if(!content)return;var rows=mdRows66(CUR),act=rows.filter(function(r){return r.actionable;}),units=act.reduce(function(a,r){return a+num(r.stock);},0),comparable=rows.filter(function(r){return r.discount!=null&&r.statusKey!=='review'&&r.statusKey!=='no_policy';}),ok=comparable.filter(function(r){return r.statusKey==='comply'||r.statusKey==='exceed';}),compliance=comparable.length?ok.length/comparable.length*100:0;var summary=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Resumen de gestión';});if(summary){var grid=summary.querySelector('.v8618KpiGrid');if(grid){grid.classList.add('v8666MdSummaryOnly');grid.innerHTML='<div class="kpi v8618Card k-evac" role="button" tabindex="0" onclick="openMdActions8666()"><div class="top"><div class="ico i-evac">!</div><span class="v8618Arrow">Ver detalle →</span></div><div class="lab">Productos a gestionar</div><div class="val">'+fint(act.length)+' productos · '+fint(units)+' unidades</div><div class="sub">Gestionar descuento o actualizar muestra</div></div><div class="kpi v8618Card k-amb"><div class="top"><div class="ico i-amb">✓</div></div><div class="lab">Cumplimiento de política</div><div class="val">'+compliance.toFixed(1)+'%</div><div class="sub">Productos que cumplen o superan la política</div></div>';}}
    var statusCard=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Estado actual vs. política';});if(statusCard){var b=statusCard.querySelector('.cbody');if(b)b.innerHTML=statusChart66(rows);}var age=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Productos a gestionar por antigüedad';});if(age){var ab=age.querySelector('.cbody');if(ab)ab.innerHTML=ageChart66(rows);}var pol=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Productos a gestionar por política';});if(pol){var pb=pol.querySelector('.cbody');if(pb)pb.innerHTML=policyChart66(rows);}renderMdTable66();}

  /* Inventario: sano con unidades, Rotación/Evacuación visibles y respaldo sano junto a ellas. */
  function patchInventory66(){if(currentView()!=='inventario')return;var grid=document.querySelector('#content .inventoryKpis');if(!grid||typeof window.inventorySummary!=='function')return;var x=window.inventorySummary(store(CUR)),healthy=x.healthyRows||[],hUnits=healthy.reduce(function(a,r){return a+num(r.stock);},0),withRows=healthy.filter(function(r){return num(r.dispCendis)>0;}),withoutRows=healthy.filter(function(r){return num(r.dispCendis)<=0;}),withU=withRows.reduce(function(a,r){return a+num(r.stock);},0),withoutU=withoutRows.reduce(function(a,r){return a+num(r.stock);},0),rot=x.rotationRows||[],ev=x.evacuationRows||[],rotU=rot.reduce(function(a,r){var over=0;Object.entries(r.rangos||{}).forEach(function(e){var m=String(e[0]).match(/\d+/),lo=m?Number(m[0]):-1;if(lo>=91)over+=num(e[1]);});return a+over;},0),evU=ev.reduce(function(a,r){return a+num(r.stock);},0);
    grid.classList.add('v8666InventoryGrid');var all=Array.from(grid.querySelectorAll('.inventoryKpi'));all.forEach(function(card){var l=card.querySelector('.ikLabel'),name=l&&l.textContent.trim();if(name==='Próximos a Rotar'||name==='Rotación'||name==='Evacuación'||name==='Sanos con respaldo CENDIS'||name==='Sanos sin respaldo CENDIS')card.remove();});var healthyCard=Array.from(grid.querySelectorAll('.inventoryKpi')).find(function(card){var l=card.querySelector('.ikLabel');return l&&l.textContent.trim()==='Productos sanos';});if(healthyCard){healthyCard.classList.add('v8666ConditionCard');var v=healthyCard.querySelector('.ikValue'),m=healthyCard.querySelector('.ikMeta');if(v)v.textContent=fint(x.healthy);if(m)m.textContent=fint(hUnits)+' unidades sanas';var html='<div class="inventoryKpi clickableKpi v8666ConditionCard" data-v8666-rot onclick="openInventoryCondition8662(\'rot\')"><div class="ikLabel">Rotación</div><div class="ikValue" style="color:var(--rot)">'+fint(x.rotation)+'</div><div class="ikMeta">'+fint(rotU)+' unidades · A/O/T &gt;90 días</div></div><div class="inventoryKpi clickableKpi v8666ConditionCard" data-v8666-evac onclick="openInventoryCondition8662(\'evac\')"><div class="ikLabel">Evacuación</div><div class="ikValue" style="color:var(--bad)">'+fint(x.evacuation)+'</div><div class="ikMeta">'+fint(evU)+' unidades · estado N</div></div><div class="inventoryKpi clickableKpi v8666ConditionCard" data-v8666-hwith onclick="openHealthyCendis8664(\'with\')"><div class="ikLabel">Sanos con respaldo CENDIS</div><div class="ikValue" style="color:var(--ok)">'+fint(withRows.length)+'</div><div class="ikMeta">'+fint(withU)+' unidades</div></div><div class="inventoryKpi clickableKpi v8666ConditionCard" data-v8666-hwithout onclick="openHealthyCendis8664(\'without\')"><div class="ikLabel">Sanos sin respaldo CENDIS</div><div class="ikValue" style="color:var(--bad)">'+fint(withoutRows.length)+'</div><div class="ikMeta">'+fint(withoutU)+' unidades</div></div>';healthyCard.insertAdjacentHTML('afterend',html);}}

  /* Resumen: próximos, composición, seguimiento y tendencia. */
  function patchProxSummary66(){if(currentView()!=='resumen'||typeof window.inventorySummary!=='function')return;var x=window.inventorySummary(store(CUR)),rows=x.proxRows||[],products=rows.length,units=0,value=0;rows.forEach(function(r){var u=0;Object.entries(r.rangos||{}).forEach(function(e){var m=String(e[0]).match(/\d+/),lo=m?Number(m[0]):-1;if(lo>=61&&lo<=90)u+=num(e[1]);});units+=u;value+=num(r.stock)>0?num(r.valorInventario)*u/num(r.stock):0;});document.querySelectorAll('#content .kgrid .kpi').forEach(function(card){var lab=card.querySelector('.lab');if(!lab||lab.textContent.trim()!=='Próximos a Rotar')return;var val=card.querySelector('.val'),sub=card.querySelector('.sub');if(val)val.textContent=fint(products)+' productos';if(sub){sub.classList.add('v8666ProxSummary');sub.textContent=fint(units)+' unidades · '+money(value);}});}
  function beautifyComposition66(){if(currentView()!=='resumen')return;var card=Array.from(document.querySelectorAll('#content .card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Composición y salud del inventario';});if(!card)return;card.classList.add('v8666CompositionCard');card.querySelectorAll('.v8664MixCard').forEach(function(c){c.classList.add('v8666Pretty');var title=c.querySelector('.v8664MixTitle');if(title){var sub=title.querySelector('div span');if(sub)sub.remove();var meta=Array.from(title.children).find(function(x){return x.tagName==='SPAN';});if(meta)meta.remove();}});}
  function ensureTrend66(){if(currentView()!=='resumen')return;var daily=Array.from(document.querySelectorAll('#content .card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Seguimiento diario de gestión';});if(!daily)return;var body=daily.querySelector('.cbody')||daily,trend=daily.querySelector('.v79StoreTrendCard');if(!trend&&typeof trendChart79==='function'&&typeof storeTrendData79==='function'){trend=document.createElement('div');trend.className='v79StoreTrendCard v8664TrendForced';trend.innerHTML='<div class="v79StoreTrendHead"><div><b>Tendencia histórica de la tienda</b><span>Rotación y Evacuación por cada corte</span></div><span>Presiona un punto para ver su actividad</span></div>'+trendChart79(storeTrendData79(CUR),CUR);body.appendChild(trend);}if(trend){trend.style.display='block';trend.style.visibility='visible';trend.style.opacity='1';}}
  function patchTracking66(){if(currentView()!=='resumen')return;var panel=document.getElementById('storeTrackingPanel');if(!panel)return;var controls=panel.querySelector('.trackingControls'),group=controls&&controls.querySelector('.trackingControlGroup');if(!controls||!group)return;var old=controls.querySelector('.v8662CutSelectors');if(old){old.style.display='flex';old.style.visibility='visible';old.style.opacity='1';old.classList.add('v8666AlwaysCustom');}var extra=controls.querySelector('.v8664CompareCustom');if(extra)extra.remove();var btns=Array.from(group.querySelectorAll('.trackBtn')),previous=btns.find(function(b){return /anterior/i.test(b.textContent);})||btns[0],base=btns.find(function(b){return /base/i.test(b.textContent);})||btns[1],custom=group.querySelector('[data-v8664-custom]');if(previous)previous.onclick=function(ev){ev.preventDefault();if(typeof window.quickTrack8662==='function')window.quickTrack8662('previous');setTimeout(patchTracking66,90);};if(base)base.onclick=function(ev){ev.preventDefault();if(typeof window.quickTrack8662==='function')window.quickTrack8662('base');setTimeout(patchTracking66,90);};if(custom)custom.onclick=function(ev){ev.preventDefault();var f=panel.querySelector('[data-v8662-from]'),to=panel.querySelector('[data-v8662-to]');if(f&&to&&typeof window.setTrackDate8662==='function'){window.setTrackDate8662('from',f.value);window.setTrackDate8662('to',to.value);}setTimeout(patchTracking66,90);};}

  /* Traslados: checklist de decisiones para órdenes pendientes. */
  function trStatus66(r){var raw=norm(r&&r.estatus||r&&r.statusRaw);if(raw.indexOf('ENTREG')>=0)return 'Entregado';if(raw.indexOf('RUTA')>=0)return 'En Ruta';if(raw.indexOf('PICKING')>=0)return 'En picking';if(raw.indexOf('PEND')>=0)return 'Pendiente';var p=norm(r&&r.statusGlobalPicking||r&&r.pick),m=norm(r&&r.statusMovimiento||r&&r.mov);if(p==='C'&&m==='C')return 'Entregado';if(p==='C'&&m!=='C')return 'En Ruta';return 'Pendiente';}
  function pendingDeliveries66(){var st=store(CUR),arr=Array.isArray(st.trDetalle)?st.trDetalle:[],g={};arr.forEach(function(r){var id=text(r.entrega||'SIN IDENTIFICAR');(g[id]||(g[id]=[])).push(r);});return Object.keys(g).map(function(id){var rows=g[id],statuses=Array.from(new Set(rows.map(trStatus66))),status=statuses.length===1?statuses[0]:'Mixto';return {id:id,rows:rows,status:status};}).filter(function(x){return x.status==='Pendiente';}).sort(function(a,b){return a.id.localeCompare(b.id);});}
  function ensureTransferState66(){pendingDeliveries66().forEach(function(o){if(!transferSel66[o.id])transferSel66[o.id]={mode:'prune',products:{}};o.rows.forEach(function(r){var k=code(r.codigo);if(transferSel66[o.id].products[k]==null)transferSel66[o.id].products[k]=true;});});}
  function decisionRows66(){ensureTransferState66();var out=[];pendingDeliveries66().forEach(function(o){var d=transferSel66[o.id]||{mode:'prune',products:{}};o.rows.forEach(function(r){var action=d.mode==='delete'?'ELIMINAR':d.mode==='send'?'ENVIAR':(d.products[code(r.codigo)]===false?'ELIMINAR':'ENVIAR');out.push({delivery:o.id,code:code(r.codigo),name:text(r.nombre||((P&&P[code(r.codigo)]&&P[code(r.codigo)].n)||r.codigo)),action:action,units:num(r.unidades)});});});return out;}
  function renderTransferDecision66(){ensureTransferState66();var body=document.getElementById('v8666DecisionBody');if(!body)return;var q=norm((document.getElementById('v8666DecisionQ')||{}).value),orders=pendingDeliveries66();body.innerHTML=orders.map(function(o){var d=transferSel66[o.id],hay=!q||norm(o.id+' '+o.rows.map(function(r){return code(r.codigo)+' '+text(r.nombre);}).join(' ')).indexOf(q)>=0;if(!hay)return '';return '<div class="v8666DeliveryDecision"><div class="v8666DeliveryDecisionHead"><div><b>Entrega '+esc(o.id)+'</b><small>'+fint(o.rows.length)+' productos · '+fint(o.rows.reduce(function(a,r){return a+num(r.unidades);},0))+' unidades</small></div><select onchange="setTransferMode8666('+JSON.stringify(o.id)+',this.value)"><option value="send"'+(d.mode==='send'?' selected':'')+'>Enviar toda la entrega</option><option value="delete"'+(d.mode==='delete'?' selected':'')+'>Eliminar toda la entrega</option><option value="prune"'+(d.mode==='prune'?' selected':'')+'>Depurar por productos</option></select><span class="v8666ActionTag '+(d.mode==='delete'?'delete':'send')+'">'+(d.mode==='delete'?'ELIMINAR':d.mode==='send'?'ENVIAR':'DEPURAR')+'</span></div><div class="v8666DecisionProducts"'+(d.mode==='prune'?'':' style="opacity:.55"')+'>'+o.rows.map(function(r){var k=code(r.codigo),send=d.mode==='delete'?false:d.mode==='send'?true:d.products[k]!==false,p=P&&P[k]||{};return '<div class="v8666DecisionRow"><input type="checkbox" '+(send?'checked':'')+' '+(d.mode==='prune'?'':'disabled')+' onchange="setTransferProduct8666('+JSON.stringify(o.id)+','+JSON.stringify(k)+',this.checked)"><div>'+image(k,'sm')+'</div><div class="code"><span class="code">'+esc(k)+'</span></div><div><div class="name">'+esc(r.nombre||p.n||k)+'</div><div class="meta">'+fint(r.unidades)+' unidades</div></div><span class="v8666ActionTag '+(send?'send':'delete')+'">'+(send?'ENVIAR':'ELIMINAR')+'</span></div>';}).join('')+'</div></div>';}).join('')||'<div class="empty">No hay entregas en estado Pendiente para gestionar.</div>';updateTransferDecisionCount66();}
  function updateTransferDecisionCount66(){var rows=decisionRows66(),send=rows.filter(function(r){return r.action==='ENVIAR';}).length,del=rows.length-send,c=document.getElementById('v8666DecisionCount');if(c)c.textContent=fint(rows.length)+' productos · '+fint(send)+' enviar · '+fint(del)+' eliminar';}
  window.setTransferMode8666=function(id,mode){ensureTransferState66();if(!transferSel66[id])return;transferSel66[id].mode=mode;renderTransferDecision66();};
  window.setTransferProduct8666=function(id,c,v){ensureTransferState66();if(!transferSel66[id])return;transferSel66[id].mode='prune';transferSel66[id].products[c]=!!v;renderTransferDecision66();};
  window.filterTransferDecisions8666=function(){renderTransferDecision66();};
  function makeTransferWorkbook66(){var rows=decisionRows66(),data=[['ORDEN_ENTREGA','CODIGO_PRODUCTO','NOMBRE_PRODUCTO','ACCION']].concat(rows.map(function(r){return [r.delivery,r.code,r.name,r.action];}));if(window.XLSX){var wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(data);ws['!cols']=[{wch:18},{wch:18},{wch:55},{wch:14}];XLSX.utils.book_append_sheet(wb,ws,'Gestion traslados');return {wb:wb,rows:rows};}return {rows:rows,data:data};}
  window.exportTransferDecisions8666=function(){var x=makeTransferWorkbook66();if(!x.rows.length){if(typeof toast==='function')toast('No hay entregas pendientes para exportar.','err');return;}var name='Gestion_Traslados_'+CUR+'_'+text(DB&&DB.meta&&DB.meta.fecha||'corte');if(window.XLSX){XLSX.writeFile(x.wb,name+'.xlsx');return;}var html='<html><head><meta charset="UTF-8"></head><body><table>'+x.data.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+esc(c)+'</td>';}).join('')+'</tr>';}).join('')+'</table></body></html>',blob=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name+'.xls';a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},300);};
  window.emailTransferDecisions8666=async function(){var x=makeTransferWorkbook66(),rows=x.rows;if(!rows.length){if(typeof toast==='function')toast('No hay entregas pendientes para reportar.','err');return;}var name='Gestion_Traslados_'+CUR+'_'+text(DB&&DB.meta&&DB.meta.fecha||'corte')+'.xlsx';if(window.XLSX&&navigator.share&&navigator.canShare){try{var arr=XLSX.write(x.wb,{bookType:'xlsx',type:'array'}),file=new File([arr],name,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});if(navigator.canShare({files:[file]})){await navigator.share({title:'Gestión de traslados pendientes',text:'Adjunto reporte de decisiones ENVIAR / ELIMINAR de traslados pendientes.',files:[file]});return;}}catch(_){}}
    window.exportTransferDecisions8666();var send=rows.filter(function(r){return r.action==='ENVIAR';}).length,del=rows.length-send,subject=encodeURIComponent('Gestión de traslados pendientes · '+(store(CUR).name||CUR)),body=encodeURIComponent('Reporte de traslados pendientes.\nProductos a ENVIAR: '+send+'\nProductos a ELIMINAR: '+del+'\n\nEl archivo Excel fue generado para adjuntarlo al correo.');window.location.href='mailto:?subject='+subject+'&body='+body;};
  window.openTransferDecisions8666=function(){ensureTransferState66();var modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle');if(!modal||!body)return;modal.classList.add('v8664Wide');if(tt)tt.textContent='Traslados · checklist de entregas pendientes';if(ss)ss.textContent=(store(CUR).name||CUR)+' · define qué enviar y qué eliminar';body.innerHTML='<div class="v8666DecisionTools"><input id="v8666DecisionQ" placeholder="Buscar orden, código o producto" oninput="filterTransferDecisions8666()"><span class="badge mut" id="v8666DecisionCount"></span></div><div id="v8666DecisionBody"></div><div class="v8666DecisionActions"><button class="secondary" onclick="emailTransferDecisions8666()">Preparar correo con reporte</button><button onclick="exportTransferDecisions8666()">Generar Excel</button></div>';modal.classList.add('on');renderTransferDecision66();};
  function patchTransfers66(){if(currentView()!=='traslados')return;var content=document.getElementById('content');if(!content||content.querySelector('[data-v8666-transfer-decision]'))return;var orders=pendingDeliveries66(),products=orders.reduce(function(a,o){return a+o.rows.length;},0),card=document.createElement('div');card.dataset.v8666TransferDecision='1';card.className='v8666TransferDecisionCard';card.innerHTML='<div class="v8666TransferDecisionHead"><div><b>Gestión de entregas pendientes</b><span>'+fint(orders.length)+' entregas · '+fint(products)+' productos pendientes. Define ENVIAR, ELIMINAR entrega o depurar por producto.</span></div><button onclick="openTransferDecisions8666()">Abrir checklist</button></div>';var table=document.getElementById('tr-tbl'),anchor=table&&table.parentElement;if(anchor&&table)anchor.insertBefore(card,table);}

  /* Excel Markdown usando filas corregidas. */
  function observation66(r){return r.policyApplied+' · '+r.ruleApplied+'. '+pct(r.currentDiscount)+' → '+pct(r.discount)+(r.statusKey==='update_sample'?' · Oferta cubre política':'');}
  function exportMd66(rows,name){if(!rows.length){if(typeof toast==='function')toast('No hay productos seleccionados.','err');return;}var data=[['AGENCIA','COD','DCTO_LISTA','OBSERVACION']].concat(rows.map(function(r){return [r.storeCode,r.code,Math.round(num(r.discount)),observation66(r)];}));if(window.XLSX){var wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(data);ws['!cols']=[{wch:12},{wch:16},{wch:14},{wch:72}];XLSX.utils.book_append_sheet(wb,ws,'Markdown');XLSX.writeFile(wb,name+'.xlsx');return;}var html='<html><head><meta charset="UTF-8"></head><body><table>'+data.map(function(row){return '<tr>'+row.map(function(c){return '<td>'+esc(c)+'</td>';}).join('')+'</tr>';}).join('')+'</table></body></html>',blob=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name+'.xls';a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},300);}
  function leaderRows66(){var out=[];Object.keys(S||{}).forEach(function(sc){mdRows66(sc).forEach(function(r){if(r.actionable&&num(r.discount)>50)out.push(Object.assign({},r,{storeName:(store(sc).name||sc)}));});});return out.sort(function(a,b){return a.storeName.localeCompare(b.storeName,'es')||num(b.discount)-num(a.discount);});}
  window.openLeaderAll8664=function(){if(typeof IS_LEADER==='undefined'||!IS_LEADER){if(typeof toast==='function')toast('Función exclusiva del Líder de Área.','err');return;}var rows=leaderRows66();leaderSel66={};rows.forEach(function(r){leaderSel66[r.storeCode+'|'+r.code]=true;});var modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle');if(!modal||!body)return;modal.classList.add('v8664Wide');if(tt)tt.textContent='Markdown · Todas las tiendas >50%';if(ss)ss.textContent='Selecciona, deselecciona y genera el Excel consolidado';var stores=Array.from(new Set(rows.map(function(r){return r.storeName;}))).sort();body.innerHTML='<div class="v8664SelectBar"><button class="v8664LeaderBtn" onclick="toggleAllLeader8666(true)">Seleccionar todos</button><button class="v8664LeaderBtn secondary" onclick="toggleAllLeader8666(false)">Quitar selección</button><input id="v8666LeaderQ" placeholder="Buscar tienda, código o producto" oninput="filterLeader8666()"><select id="v8666LeaderStore" onchange="filterLeader8666()"><option value="all">Todas las tiendas</option>'+stores.map(function(s){return '<option value="'+esc(s)+'">'+esc(s)+'</option>';}).join('')+'</select><span class="badge mut" id="v8666LeaderCount">'+fint(rows.length)+' seleccionados</span><button class="v8664LeaderBtn" onclick="exportLeader8666()">Generar Excel consolidado</button></div><div class="v80TableWrap"><table class="v80Table v8666MdDetailTable" id="v8666LeaderTable"><thead><tr><th><input type="checkbox" checked onchange="toggleAllLeader8666(this.checked)"></th><th>Imagen</th><th>Tienda</th><th>Código</th><th>Producto</th><th class="num">Actual/Muestra</th><th class="num">Oferta</th><th class="num">Sugerido</th><th>Estado</th></tr></thead><tbody>'+rows.map(function(r){var k=r.storeCode+'|'+r.code;return '<tr data-key="'+esc(k)+'" data-store="'+esc(r.storeName)+'"><td><input type="checkbox" checked onclick="event.stopPropagation()" onchange="toggleLeaderOne8666('+JSON.stringify(k)+',this.checked)"></td><td>'+image(r.code,'sm')+'</td><td><b>'+esc(r.storeName)+'</b></td><td><span class="code">'+esc(r.code)+'</span></td><td><b>'+esc(r.name)+'</b></td><td class="num">'+pct(r.currentDiscount)+'</td><td class="num">'+pct(r.systemOfferDiscount)+'</td><td class="num"><b>'+pct(r.discount)+'</b></td><td>'+esc(r.statusLabel)+'</td></tr>';}).join('')+'</tbody></table></div>';modal.classList.add('on');};
  function leaderCount66(){var n=Object.keys(leaderSel66).filter(function(k){return leaderSel66[k];}).length,c=document.getElementById('v8666LeaderCount');if(c)c.textContent=fint(n)+' seleccionados';}
  window.toggleAllLeader8666=function(v){document.querySelectorAll('#v8666LeaderTable tbody tr').forEach(function(tr){if(tr.style.display==='none')return;leaderSel66[tr.dataset.key]=!!v;var cb=tr.querySelector('input[type=checkbox]');if(cb)cb.checked=!!v;});leaderCount66();};window.toggleLeaderOne8666=function(k,v){leaderSel66[k]=!!v;leaderCount66();};window.filterLeader8666=function(){var q=norm((document.getElementById('v8666LeaderQ')||{}).value),st=(document.getElementById('v8666LeaderStore')||{}).value||'all';document.querySelectorAll('#v8666LeaderTable tbody tr').forEach(function(tr){tr.style.display=(!q||norm(tr.textContent).indexOf(q)>=0)&&(st==='all'||tr.dataset.store===st)?'':'none';});};window.exportLeader8666=function(){var rows=leaderRows66().filter(function(r){return leaderSel66[r.storeCode+'|'+r.code];});exportMd66(rows,'Markdown_Lider_Todas_Tiendas_'+text(DB&&DB.meta&&DB.meta.fecha||'corte'));};window.exportAdmin8664=function(){if(typeof IS_ADMIN==='undefined'||!IS_ADMIN)return;exportMd66(mdRows66(CUR).filter(function(r){return r.actionable&&num(r.discount)<=50;}),'Markdown_Administrador_'+CUR+'_'+text(DB&&DB.meta&&DB.meta.fecha||'corte'));};

  function mark66(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='11/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 11/08/2026 · '+VERSION;}catch(_){}}
  function patch66(){try{patchInventory66();patchProxSummary66();beautifyComposition66();ensureTrend66();patchTracking66();updateMarkdown66();patchTransfers66();mark66();}catch(e){console.error('V86.66 patch',e);}}
  function install66(){if(installed)return true;var ready=window.__LLAVERO_DISCOUNT_DATA__&&window.__LLAVERO_DISCOUNT_DATA__.version==='V86.65'&&typeof window.mdRows8664==='function'&&typeof window.setView==='function'&&typeof window.inventorySummary==='function';if(!ready)return false;installed=true;baseMdRows66=window.mdRows8664;window.mdRows8618=window.mdRows8662=window.mdRows8664=mdRows66;
    var sv=window.setView,rf=window.refresh,dm=window.drawMarkdown8617,dt=window.drawTr8615||window.drawTr;if(typeof sv==='function')window.setView=function(){var out=sv.apply(this,arguments);mdLimit66=160;setTimeout(patch66,220);setTimeout(patch66,520);return out;};if(typeof rf==='function')window.refresh=function(){var out=rf.apply(this,arguments);setTimeout(patch66,220);setTimeout(patch66,520);return out;};if(typeof dm==='function')window.drawMarkdown8617=function(){var out=dm.apply(this,arguments);mdLimit66=160;setTimeout(updateMarkdown66,180);setTimeout(updateMarkdown66,380);return out;};if(typeof dt==='function'){var w=function(){var out=dt.apply(this,arguments);setTimeout(function(){patchTransfers66();mark66();},100);return out;};window.drawTr8615=window.drawTr862=window.drawTr80=window.drawTr=w;}
    patch66();console.info('LLAVERO V86.66 · cierre operativo Inventario / Resumen / Markdown / Traslados');return true;}
  function start66(){if(install66())return;setTimeout(start66,220);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start66,{once:true});else start66();window.addEventListener('llavero:bootstrapped',function(){setTimeout(start66,300);},{once:true});
})();


/* ==== llaveroV8667Script ==== */

(function(){
  'use strict';
  var VERSION='V86.67', installed=false, trackingInitialized={};
  var transferState67={};
  function n(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function s(v){return v==null?'':String(v);}
  function norm(v){var x=s(v).trim().toUpperCase();try{return x.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(_){return x;}}
  function esc(v){return s(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function fint(v){try{return typeof fInt==='function'?fInt(n(v)):Math.round(n(v)).toLocaleString('es-CO');}catch(_){return String(Math.round(n(v)));}}
  function money(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(n(v)):'$ '+Math.round(n(v)).toLocaleString('es-CO');}catch(_){return '$ '+Math.round(n(v)).toLocaleString('es-CO');}}
  function st(){try{return (S&&S[CUR])||{};}catch(_){return {};}}
  function prod(c){try{return (typeof productInfo==='function'?productInfo(c):(P&&P[c]))||{n:c,cat:'—',lin:'—',sub:'—'};}catch(_){return {n:c,cat:'—',lin:'—',sub:'—'};}}
  function img(c){try{return typeof imageThumb==='function'?imageThumb(c,'sm'):'';}catch(_){return '';}}
  function view(){try{return VIEW||'';}catch(_){return '';}}

  /* El historial debe leerse DESPUES de que el bootstrap descomprima embeddedHistory. */
  function liveHistory67(){
    try{var el=document.getElementById('embeddedHistory'),h=JSON.parse(el&&el.textContent||'{}');return {daily:Array.isArray(h.daily)?h.daily:[],details:Array.isArray(h.details)?h.details:[]};}
    catch(_){return {daily:[],details:[]};}
  }
  function daily67(){return liveHistory67().daily.slice().sort(function(a,b){return s(a&&a.date).localeCompare(s(b&&b.date));});}
  function details67(){return liveHistory67().details.slice().sort(function(a,b){return s(a&&a.date).localeCompare(s(b&&b.date));});}
  function installLiveHistory67(){
    window.readDailyHistory=daily67;window.readDetailHistory=details67;
    try{readDailyHistory=daily67;}catch(_){}
    try{readDetailHistory=details67;}catch(_){}
  }

  /* Tendencia de cantidades reales de productos Rotacion / Evacuacion por corte. */
  function trendData67(sc){return daily67().map(function(x){var m=x&&x.stores&&x.stores[sc];if(!m)return null;return {date:x.date,rot:n(m.rot&&m.rot.currentCount),evac:n(m.evac&&m.evac.currentCount)};}).filter(Boolean);}
  function fmtDate67(d){var m=s(d).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]:s(d);}
  function trendSvg67(data){
    if(!data.length)return '<div class="empty">Sin historial disponible.</div>';
    var W=Math.max(900,100+data.length*90),H=290,p={l:58,r:34,t:34,b:52},vals=[];
    data.forEach(function(d){vals.push(d.rot,d.evac);});var hi=Math.max.apply(null,vals.concat([1]))*1.12;hi=Math.max(10,hi);
    function x(i){return p.l+(W-p.l-p.r)*(data.length===1?.5:i/(data.length-1));}
    function y(v){return p.t+(H-p.t-p.b)*(hi-n(v))/hi;}
    function path(k){return data.map(function(d,i){return (i?'L':'M')+x(i).toFixed(1)+','+y(d[k]).toFixed(1);}).join(' ');}
    var grid='';for(var j=0;j<5;j++){var v=hi*j/4,yy=y(v);grid+='<line class="v8667TrendGrid" x1="'+p.l+'" y1="'+yy+'" x2="'+(W-p.r)+'" y2="'+yy+'"></line><text class="v8667TrendAxis" x="'+(p.l-9)+'" y="'+(yy+4)+'" text-anchor="end">'+fint(v)+'</text>';}
    function points(k,cl,dy){return data.map(function(d,i){var cx=x(i),cy=y(d[k]),val=fint(d[k]);return '<g class="v8667TrendPoint '+cl+'" role="button" tabindex="0" data-v8667-date="'+esc(d.date)+'" title="'+esc(d.date)+' · '+esc(cl==='rot'?'Rotación':'Evacuación')+': '+val+' productos"><circle class="v8667TrendHit" cx="'+cx+'" cy="'+cy+'" r="11"></circle><circle cx="'+cx+'" cy="'+cy+'" r="5"></circle><text x="'+cx+'" y="'+(cy+dy)+'" text-anchor="middle">'+val+'</text></g>';}).join('');}
    var dates=data.map(function(d,i){return '<text class="v8667TrendDate" x="'+x(i)+'" y="'+(H-16)+'" text-anchor="middle">'+esc(fmtDate67(d.date))+'</text>';}).join('');
    return '<div class="v8667TrendScroll"><svg class="v8667TrendSvg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+grid+'<path class="v8667TrendLineRot" d="'+path('rot')+'"></path><path class="v8667TrendLineEvac" d="'+path('evac')+'"></path>'+points('rot','rot',-11)+points('evac','evac',17)+dates+'</svg></div><div class="v8667TrendLegend"><span class="rot"><i></i>Rotación</span><span class="evac"><i></i>Evacuación</span><span>Selecciona un punto para abrir el detalle del corte.</span></div>';
  }
  window.openTrendPoint8667=function(date){var sc=typeof CUR!=='undefined'?CUR:'';try{if(typeof window.openTrendDetail80==='function')return window.openTrendDetail80(date,sc);if(typeof window.openTrendDetail79==='function')return window.openTrendDetail79(date,sc);if(typeof window.openTrendPoint863==='function')return window.openTrendPoint863(date);}catch(e){console.error(e);}};
  function patchTrend67(){
    if(view()!=='resumen')return;var dailyCard=Array.from(document.querySelectorAll('#content .card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Seguimiento diario de gestión';});if(!dailyCard)return;
    var body=dailyCard.querySelector('.cbody')||dailyCard,old=body.querySelector('.v79StoreTrendCard,.v8667TrendCard');if(old)old.remove();
    var card=document.createElement('div');card.className='v79StoreTrendCard v8668TrendRestored';
    var chart=(typeof trendChart79==='function'&&typeof storeTrendData79==='function')?trendChart79(storeTrendData79(CUR),CUR):'<div class="empty">Sin historial disponible.</div>';
    card.innerHTML='<div class="v79StoreTrendHead"><div><b>Tendencia histórica de la tienda</b><span>Rotación y Evacuación por cada corte</span></div><span>Presiona un punto para ver su actividad</span></div>'+chart;body.appendChild(card);
  }

  /* Seguimiento frente al corte: historial vivo + personalizado siempre visible. */
  function patchTracking67(){
    if(view()!=='resumen')return;var panel=document.getElementById('storeTrackingPanel');if(!panel)return;var dates=details67().map(function(x){return x.date;});if(!dates.length)return;
    if(!trackingInitialized[CUR]&&typeof window.quickTrack8662==='function'){trackingInitialized[CUR]=true;window.quickTrack8662('previous');panel=document.getElementById('storeTrackingPanel')||panel;}
    var controls=panel.querySelector('.trackingControls');if(!controls)return;var groups=Array.from(controls.querySelectorAll('.trackingControlGroup'));var compare=groups.find(function(g){var l=g.querySelector('.trackingControlLabel');return l&&/comparar/i.test(l.textContent||'');})||groups[0];if(!compare)return;
    var buttons=Array.from(compare.querySelectorAll('.trackBtn')),previous=buttons.find(function(b){return /anterior/i.test(b.textContent||'');})||buttons[0],base=buttons.find(function(b){return /base/i.test(b.textContent||'');})||buttons[1],custom=compare.querySelector('[data-v8667-custom]')||compare.querySelector('[data-v8664-custom]');
    if(previous){previous.textContent='Corte anterior';previous.onclick=function(ev){ev.preventDefault();if(typeof window.quickTrack8662==='function')window.quickTrack8662('previous');setTimeout(patchTracking67,40);};}
    if(base){base.textContent='Corte base';base.onclick=function(ev){ev.preventDefault();if(typeof window.quickTrack8662==='function')window.quickTrack8662('base');setTimeout(patchTracking67,40);};}
    if(!custom){custom=document.createElement('button');custom.type='button';custom.className='trackBtn';custom.dataset.v8667Custom='1';custom.textContent='Personalizado';compare.appendChild(custom);}
    custom.style.display='inline-flex';custom.onclick=function(ev){ev.preventDefault();var f=panel.querySelector('[data-v8662-from]'),t=panel.querySelector('[data-v8662-to]');if(f&&t&&typeof window.setTrackDate8662==='function'){window.setTrackDate8662('from',f.value);window.setTrackDate8662('to',t.value);}setTimeout(patchTracking67,40);};
    var selectors=controls.querySelector('.v8662CutSelectors');if(!selectors){selectors=document.createElement('div');selectors.className='trackDateSelectors8658 v8662CutSelectors';selectors.innerHTML='<div class="trackDateField8658"><label>Corte inicial</label><select data-v8662-from></select></div><div class="trackDateField8658"><label>Corte final</label><select data-v8662-to></select></div><span class="v8667CustomHint">Personalizado permanece disponible aunque uses Corte anterior o Corte base.</span>';compare.insertAdjacentElement('afterend',selectors);}
    selectors.style.display='flex';selectors.style.visibility='visible';selectors.style.opacity='1';
    var from=selectors.querySelector('[data-v8662-from]'),to=selectors.querySelector('[data-v8662-to]');
    if(from&&from.options.length===0){from.innerHTML=dates.map(function(d,i){return '<option value="'+esc(d)+'"'+(i===Math.max(0,dates.length-2)?' selected':'')+'>'+esc(fmtDate67(d))+'</option>';}).join('');}
    if(to&&to.options.length===0){to.innerHTML=dates.map(function(d,i){return '<option value="'+esc(d)+'"'+(i===dates.length-1?' selected':'')+'>'+esc(fmtDate67(d))+'</option>';}).join('');}
    if(from)from.onchange=function(){if(typeof window.setTrackDate8662==='function')window.setTrackDate8662('from',this.value);setTimeout(patchTracking67,40);};
    if(to)to.onchange=function(){if(typeof window.setTrackDate8662==='function')window.setTrackDate8662('to',this.value);setTimeout(patchTracking67,40);};
  }

  /* Inventario: conservar Productos sanos arriba; mover sus dos cards CENDIS al bloque de respaldo. */
  function patchInventory67(){
    if(view()!=='inventario'||typeof window.inventorySummary!=='function')return;var grid=document.querySelector('#content .inventoryKpis');if(!grid)return;var sum=window.inventorySummary(st()),healthy=sum.healthyRows||[],units=healthy.reduce(function(a,r){return a+n(r.stock);},0);
    Array.from(grid.querySelectorAll('.inventoryKpi')).forEach(function(card){var lab=card.querySelector('.ikLabel'),name=lab&&lab.textContent.trim();if(name==='Próximos a Rotar'||name==='Rotación'||name==='Evacuación'||name==='Sanos con respaldo CENDIS'||name==='Sanos sin respaldo CENDIS')card.remove();});
    var healthyCard=Array.from(grid.querySelectorAll('.inventoryKpi')).find(function(card){var l=card.querySelector('.ikLabel');return l&&l.textContent.trim()==='Productos sanos';});if(healthyCard){var v=healthyCard.querySelector('.ikValue'),m=healthyCard.querySelector('.ikMeta');if(v)v.textContent=fint(sum.healthy||healthy.length);if(m)m.textContent=fint(units)+' unidades sanas';}
    var sec=document.querySelector('#content [data-v869-cendis-section]'),cg=sec&&sec.querySelector('.v869MetricGrid');if(!cg)return;cg.classList.remove('v869FourCards');cg.classList.add('v8667SixCards');cg.querySelectorAll('[data-v8667-healthy-cendis]').forEach(function(x){x.remove();});
    var withRows=healthy.filter(function(r){return n(r.dispCendis)>0;}),withoutRows=healthy.filter(function(r){return n(r.dispCendis)<=0;});
    function stat(rows){return {p:rows.length,u:rows.reduce(function(a,r){return a+n(r.stock);},0),v:rows.reduce(function(a,r){return a+n(r.valorInventario);},0)};}
    function card(mode,label,tone,stats){return '<div class="mk '+tone+' proxKpiClickable v869MetricCard" data-v8667-healthy-cendis="'+mode+'" role="button" tabindex="0" onclick="openHealthyCendis8664(\''+mode+'\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openHealthyCendis8664(\''+mode+'\')}"><div class="l">'+label+'</div><div class="v">'+fint(stats.p)+' productos</div><div class="meta">'+fint(stats.u)+' unidades · '+money(stats.v)+'</div></div>';}
    cg.insertAdjacentHTML('beforeend',card('without','SANOS · SIN RESPALDO CENDIS','b',stat(withoutRows))+card('with','SANOS · CON RESPALDO CENDIS','g',stat(withRows)));
    var title=sec.querySelector('.v869MetricTitle span');if(title)title.textContent='Rotación, Evacuación y Productos sanos con lectura de respaldo CENDIS.';
  }

  /* Markdown: politica a ancho completo y click del producto abre la ficha completa. */
  function patchMarkdown67(){
    if(view()!=='markdown')return;var content=document.getElementById('content');if(!content)return;var policy=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Productos a gestionar por política';});if(policy)policy.classList.add('v8667PolicyWide');
    content.querySelectorAll('#markdown-table-8618 tbody tr,[id^="v8666MdDetailTable"] tbody tr').forEach(function(tr){tr.style.cursor='pointer';});
  }
  window.openMdProduct8664=function(code){try{if(typeof closeRangeModal==='function')closeRangeModal();}catch(_){}setTimeout(function(){try{if(typeof window.openMarkdownProduct8618==='function')window.openMarkdownProduct8618(code);else if(typeof window.openInventoryProduct==='function')window.openInventoryProduct(code);else if(typeof window.openBestProductDetail==='function')window.openBestProductDetail(code);}catch(e){console.error('V86.67 detalle Markdown',e);}},45);};

  /* Traslados: una regla visual simple. Checked = ENVIAR; unchecked = ELIMINAR. */
  function trStatus67(r){var raw=norm(r&&r.estatus||r&&r.statusRaw);if(raw.indexOf('ENTREG')>=0)return'Entregado';if(raw.indexOf('RUTA')>=0)return'En Ruta';if(raw.indexOf('PICKING')>=0)return'En picking';if(raw.indexOf('PEND')>=0)return'Pendiente';var p=norm(r&&r.statusGlobalPicking||r&&r.pick),m=norm(r&&r.statusMovimiento||r&&r.mov);if(p==='C'&&m==='C')return'Entregado';if(p==='C'&&m!=='C')return'En Ruta';return'Pendiente';}
  function transferGuideImpacts67(code){
    code=s(code);var out=[],seen={};
    function add(gcode,gname,floor){var k=s(gcode)+'|'+s(floor);if(seen[k])return;seen[k]=1;out.push({code:s(gcode),name:s(gname)||s(gcode),floor:s(floor)||'—'});}
    try{
      var store=st();
      if((!Array.isArray(store.guias)||!store.guias.length)&&typeof window.llaveroRebuildAllGuideData==='function'){window.llaveroRebuildAllGuideData();store=st();}
      (Array.isArray(store.guias)?store.guias:[]).forEach(function(g){
        (Array.isArray(g&&g[6])?g[6]:[]).forEach(function(p){if(s(p&&p[0])===code&&!!p[10]&&s(p[5])==='camino')add(g[0],g[1],p[1]);});
      });
    }catch(_){ }
    /* Respaldo directo sobre la guía consolidada: solo posiciones evaluables y sin existencia actual. */
    if(!out.length){
      try{
        var storeNow=st(),inv=Array.isArray(storeNow.inventario)?storeNow.inventario:[],stock=0;
        inv.forEach(function(r){if(s(r&&r.codigo)===code||s(r&&r.codigoSap).replace(/^0+/,'')===code)stock+=n(r&&r.stock);});
        if(stock<=0&&(typeof G!=='undefined')&&Array.isArray(G))G.forEach(function(g){
          (Array.isArray(g&&g[3])?g[3]:[]).forEach(function(p){var floor=s(p&&p[0]),active=norm(p&&p[3])!=='INACTIVO';if(s(p&&p[2])===code&&(floor==='1'||floor==='2')&&active)add(g[0],g[1],floor);});
        });
      }catch(_){ }
    }
    return out;
  }
  function transferConditionSets67(){var store=st(),rot=new Set(),evac=new Set();(Array.isArray(store.rot)?store.rot:[]).forEach(function(r){rot.add(s(r&&r[0]));});(Array.isArray(store.evac)?store.evac:[]).forEach(function(r){evac.add(s(r&&r[0]));});return{rot:rot,evac:evac};}
  function transferImpacts67(code){var sets=transferConditionSets67(),guides=transferGuideImpacts67(code),items=[];guides.forEach(function(g){items.push({kind:'amb',title:'Ambiente '+(g.code||g.name),sub:(g.name&&g.name!==g.code?g.name+' · ':'')+'Piso '+g.floor,guide:g});});if(sets.rot.has(s(code)))items.push({kind:'rot',title:'Rotación',sub:'Antigüedad mayor a 90 días'});if(sets.evac.has(s(code)))items.push({kind:'evac',title:'Evacuación',sub:'Producto fuera de surtido'});if(!items.length)items.push({kind:'none',title:'Sin condición',sub:'No impacta ambientes, rotación ni evacuación'});return items;}
  function transferImpactHtml67(code){return '<div class="v155ImpactStack">'+transferImpacts67(code).map(function(x){return '<div class="v155ImpactItem '+x.kind+'"><i></i><div><b>'+esc(x.title)+'</b><small>'+esc(x.sub)+'</small></div></div>';}).join('')+'</div>';}
  function pending67(){
    var arr=(Array.isArray(st().trDetalle)?st().trDetalle:[]).filter(function(r){return trStatus67(r)==='Pendiente';}),orders={};
    arr.forEach(function(r){var id=s(r.entrega||'SIN IDENTIFICAR'),code=s(r.codigo),o=orders[id]||(orders[id]={id:id,byCode:{}}),x=o.byCode[code];if(!x){x=o.byCode[code]=Object.assign({},r);x.unidades=0;x.__statuses=new Set();}x.unidades+=n(r.unidades);x.__statuses.add(trStatus67(r));});
    return Object.keys(orders).map(function(id){var o=orders[id],rows=Object.keys(o.byCode).map(function(c){return o.byCode[c];}),statuses=new Set();rows.forEach(function(r){r.__statuses.forEach(function(x){statuses.add(x);});});var list=Array.from(statuses),status=list.length===1?list[0]:(list.length?'Mixto':'Pendiente');return{id:id,rows:rows,status:status};}).sort(function(a,b){return a.id.localeCompare(b.id,'es');});
  }
  function ensureTransfer67(){pending67().forEach(function(o){if(!transferState67[o.id])transferState67[o.id]={};o.rows.forEach(function(r){var c=s(r.codigo);if(transferState67[o.id][c]==null)transferState67[o.id][c]=true;});});}
  function decision67(){ensureTransfer67();var out=[];pending67().forEach(function(o){o.rows.forEach(function(r){var c=s(r.codigo),p=prod(c);out.push({delivery:o.id,code:c,name:s(r.nombre||p.n||c),units:n(r.unidades),status:o.status,action:transferState67[o.id][c]===false?'ELIMINAR':'ENVIAR'});});});return out;}
  function updateTransferCount67(){var rows=decision67(),send=rows.filter(function(r){return r.action==='ENVIAR';}).length,del=rows.length-send,orders=pending67().length;[['v155TransferOrders',orders],['v155TransferProducts',rows.length],['v155TransferSend',send],['v155TransferDelete',del]].forEach(function(x){var el=document.getElementById(x[0]);if(el)el.textContent=fint(x[1]);});var c=document.getElementById('v8667DecisionCount');if(c)c.textContent=fint(rows.length)+' productos · '+fint(send)+' ENVIAR · '+fint(del)+' ELIMINAR';var sum=document.getElementById('v8667FooterSummary');if(sum)sum.textContent=fint(send)+' seleccionados para enviar · '+fint(del)+' marcado'+(del===1?'':'s')+' para eliminar';}
  function transferStatusSince67(r,status){if(status==='En picking')return s(r.fechaPicking||r.fechaCreacion||'—');if(status==='En Ruta'||status==='En ruta')return s(r.fechaPicking||r.fechaCreacion||'—');return s(r.fechaCreacion||'—');}
  function renderTransferRow67(o,r){var c=s(r.codigo),send=transferState67[o.id][c]!==false,p=prod(c),rowStatus=Array.from(r.__statuses||[]).join(' / ')||o.status;return '<div class="v8667DecisionRow v155TransferProductRow '+(send?'is-send':'is-delete')+'" data-transfer-delivery="'+esc(o.id)+'" data-transfer-code="'+esc(c)+'"><div class="v155SelectCell"><input type="checkbox" data-transfer-checkbox aria-label="Seleccionar '+esc(r.nombre||p.n||c)+' para enviar" '+(send?'checked':'')+'></div><div class="v155ImageCell">'+img(c)+'</div><div class="codeCol"><button type="button" class="v155ProductOpen" data-transfer-product-open="'+esc(c)+'"><span class="code">'+esc(c)+'</span></button></div><div class="v155ProductCell"><button type="button" class="v155ProductOpen v155ProductOpenName" data-transfer-product-open="'+esc(c)+'"><span class="name">'+esc(r.nombre||p.n||c)+'</span><span class="meta">'+esc((p.cat||'—')+' · '+(p.lin||'—')+(p.sub?' · '+p.sub:''))+'</span></button><span class="v155RowState">'+esc(rowStatus)+' · desde '+esc(transferStatusSince67(r,rowStatus))+'</span></div><div class="v155UnitsCell"><b>'+fint(r.unidades)+'</b><small>unidad'+(n(r.unidades)===1?'':'es')+'</small></div><div class="v155ImpactCell">'+transferImpactHtml67(c)+'</div><span class="v8667Action '+(send?'send':'delete')+'">'+(send?'ENVIAR':'ELIMINAR')+'</span></div>';}
  function renderTransfer67(){
    ensureTransfer67();var body=document.getElementById('v8667DecisionBody');if(!body)return;var q=norm((document.getElementById('v8667DecisionQ')||{}).value),impactFilter=s((document.getElementById('v8667DecisionImpact')||{}).value),orders=pending67();
    var anyFilter=!!(q||impactFilter);
    var rendered=orders.map(function(o){
      var rows=o.rows.filter(function(r){
        var c=s(r.codigo);
        if(q&&norm(o.id+' '+c+' '+s(r.nombre)).indexOf(q)<0)return false;
        if(impactFilter){var kinds=transferImpacts67(c).map(function(x){return x.kind;});if(kinds.indexOf(impactFilter)<0)return false;}
        return true;
      });
      if(!rows.length)return'';
      var units=rows.reduce(function(a,r){return a+n(r.unidades);},0);
      return '<section class="v8667Delivery" data-transfer-order="'+esc(o.id)+'"><div class="v8667DeliveryHead"><div><div class="v155OrderTitle"><b>Entrega '+esc(o.id)+'</b><span class="v155OrderStatus">'+esc(o.status)+'</span></div><small>'+fint(rows.length)+' productos · '+fint(units)+' unidades</small></div><div class="v8667DeliveryActions"><button type="button" class="send" data-transfer-order-action="send" data-transfer-order-id="'+esc(o.id)+'">✓ Seleccionar toda para enviar</button><button type="button" class="delete" data-transfer-order-action="delete" data-transfer-order-id="'+esc(o.id)+'">✕ Eliminar entrega completa</button></div></div><div class="v155DeliveryTableHead"><span>Sel.</span><span>Imagen</span><span>Código</span><span>Producto</span><span>Unidades</span><span>Impacto del producto</span><span>Acción</span></div>'+rows.map(function(r){return renderTransferRow67(o,r);}).join('')+'</section>';
    }).join('');
    body.innerHTML=rendered||('<div class="empty">'+(anyFilter?'Ningún producto coincide con los filtros aplicados.':'No hay productos en estado PENDIENTE para gestionar.')+'</div>');
    var clearBtn=document.getElementById('v8667DecisionQ')&&document.querySelector('.v8667ClearFilters');if(clearBtn)clearBtn.classList.toggle('active',anyFilter);
    updateTransferCount67();
  }
  window.clearTransferFilters8667=function(){var q=document.getElementById('v8667DecisionQ'),sel=document.getElementById('v8667DecisionImpact');if(q)q.value='';if(sel)sel.value='';renderTransfer67();};
  window.setTransferProduct8667=function(id,c,v){ensureTransfer67();id=s(id);c=s(c);if(!transferState67[id])transferState67[id]={};transferState67[id][c]=!!v;document.querySelectorAll('#v8667DecisionBody .v155TransferProductRow').forEach(function(row){if(row.dataset.transferDelivery!==id||row.dataset.transferCode!==c)return;var cb=row.querySelector('[data-transfer-checkbox]'),act=row.querySelector('.v8667Action');if(cb)cb.checked=!!v;row.classList.toggle('is-send',!!v);row.classList.toggle('is-delete',!v);if(act){act.className='v8667Action '+(v?'send':'delete');act.textContent=v?'ENVIAR':'ELIMINAR';}});updateTransferCount67();};
  window.setTransferOrder8667=function(id,v){ensureTransfer67();id=s(id);var o=pending67().find(function(x){return x.id===id;});if(!o)return;o.rows.forEach(function(r){var c=s(r.codigo);transferState67[id][c]=!!v;window.setTransferProduct8667(id,c,!!v);});updateTransferCount67();};
  window.filterTransferDecisions8667=function(){renderTransfer67();};
  function workbook67(){var rows=decision67(),data=[['ORDEN_ENTREGA','CODIGO_PRODUCTO','NOMBRE_PRODUCTO','ACCION']].concat(rows.map(function(r){return[r.delivery,r.code,r.name,r.action];}));if(window.XLSX){var wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(data);ws['!cols']=[{wch:20},{wch:18},{wch:56},{wch:14}];XLSX.utils.book_append_sheet(wb,ws,'Gestion traslados');return{wb:wb,rows:rows,data:data};}return{rows:rows,data:data};}
  window.exportTransferDecisions8667=function(){var x=workbook67();if(!x.rows.length){if(typeof toast==='function')toast('No hay entregas pendientes para exportar.','err');return;}var name='Gestion_Traslados_'+CUR+'_'+s(DB&&DB.meta&&DB.meta.fecha||'corte');if(window.XLSX){XLSX.writeFile(x.wb,name+'.xlsx');return;}var html='<html><head><meta charset="UTF-8"></head><body><table>'+x.data.map(function(r){return'<tr>'+r.map(function(c){return'<td>'+esc(c)+'</td>';}).join('')+'</tr>';}).join('')+'</table></body></html>',blob=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name+'.xls';a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},300);};
  window.emailTransferDecisions8667=function(){var rows=decision67();if(!rows.length)return;window.exportTransferDecisions8667();var send=rows.filter(function(r){return r.action==='ENVIAR';}).length,del=rows.length-send,subject=encodeURIComponent('Gestión de traslados pendientes · '+(st().name||CUR)),body=encodeURIComponent('Adjunto reporte de gestión de entregas pendientes.\n\nENVIAR: '+send+' productos\nELIMINAR: '+del+' productos\n\nEl Excel fue generado para adjuntarlo.');setTimeout(function(){window.location.href='mailto:?subject='+subject+'&body='+body;},250);};
  function wireTransferChecklist67(){var body=document.getElementById('rangeModalBody');if(!body||body.dataset.v155TransferEvents==='1')return;body.dataset.v155TransferEvents='1';body.addEventListener('change',function(e){var cb=e.target&&e.target.closest&&e.target.closest('[data-transfer-checkbox]');if(!cb)return;var row=cb.closest('.v155TransferProductRow');if(!row)return;e.stopPropagation();window.setTransferProduct8667(row.dataset.transferDelivery,row.dataset.transferCode,cb.checked);});body.addEventListener('click',function(e){var product=e.target&&e.target.closest&&e.target.closest('[data-transfer-product-open]');if(product){e.preventDefault();e.stopPropagation();window.openTransferProductDetail155(product.dataset.transferProductOpen);return;}var order=e.target&&e.target.closest&&e.target.closest('[data-transfer-order-action]');if(order){e.preventDefault();e.stopPropagation();window.setTransferOrder8667(order.dataset.transferOrderId,order.dataset.transferOrderAction==='send');}});}
  window.openTransferProductDetail155=function(code){code=s(code);if(!code)return;try{if(typeof window.openInventoryProduct==='function'){window.openInventoryProduct(code);return;}if(typeof window.openBestProductDetail==='function'){window.openBestProductDetail(code);return;}if(typeof window.openProductFromSales==='function')window.openProductFromSales(code);}catch(e){console.error('Detalle de producto en Traslados',e);}};
  window.openTransferDecisions8666=window.openTransferDecisions8667=function(){var modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle');if(!modal||!body)return;modal.classList.add('v8664Wide','v155TransferModal');if(tt)tt.textContent='Traslados · selección de entregas pendientes';if(ss)ss.textContent=(st().name||CUR)+' · solo órdenes en estado PENDIENTE · marca únicamente lo que SÍ debe enviarse';body.innerHTML='<div class="v155TransferChecklist"><div class="v155TransferTop"><div class="v155TransferKpis"><div class="v155TransferKpi"><span class="ico">⇄</span><div><b id="v155TransferOrders">0</b><span>Entregas</span></div></div><div class="v155TransferKpi products"><span class="ico">▣</span><div><b id="v155TransferProducts">0</b><span>Productos</span></div></div><div class="v155TransferKpi send"><span class="ico">✓</span><div><b id="v155TransferSend">0</b><span>Para enviar</span></div></div><div class="v155TransferKpi delete"><span class="ico">⌫</span><div><b id="v155TransferDelete">0</b><span>Para eliminar</span></div></div></div><div class="v155ImpactLegend"><b>Impacto del producto</b><span class="amb"><i></i>Ambiente</span><span class="rot"><i></i>Rotación</span><span class="evac"><i></i>Evacuación</span><span class="none"><i></i>Sin condición</span></div></div><div class="v8667TransferTools v155TransferTools"><input id="v8667DecisionQ" placeholder="Buscar orden, código o producto" oninput="filterTransferDecisions8667()"><select id="v8667DecisionImpact" onchange="filterTransferDecisions8667()"><option value="">Impacto: todos</option><option value="amb">Ambiente</option><option value="rot">Rotación</option><option value="evac">Evacuación</option><option value="none">Sin condición</option></select><button type="button" class="v8667ClearFilters" onclick="clearTransferFilters8667()">Limpiar filtros</button><span class="badge mut" id="v8667DecisionCount"></span></div><div id="v8667DecisionBody"></div><div class="v8667TransferFooter"><div><span class="summary" id="v8667FooterSummary"></span><small>Los productos desmarcados permanecen visibles y se identifican únicamente como ELIMINAR.</small></div><div><button type="button" onclick="emailTransferDecisions8667()">Preparar correo</button> <button type="button" class="primary" onclick="exportTransferDecisions8667()">Generar Excel ENVIAR / ELIMINAR</button></div></div><div class="v155ImpactInfo"><div><b>Ambiente</b><span>El producto hace parte de una necesidad de guía en exhibición; se informa la guía y el piso.</span></div><div><b>Rotación</b><span>El producto tiene antigüedad mayor a 90 días.</span></div><div><b>Evacuación</b><span>El producto está fuera de surtido.</span></div><div><b>Sin condición</b><span>No impacta ambientes, rotación ni evacuación.</span></div></div></div>';modal.classList.add('on');wireTransferChecklist67();renderTransfer67();};
  function patchTransferCard67(){if(view()!=='traslados')return;var card=document.querySelector('[data-v8666-transfer-decision]');if(!card)return;var span=card.querySelector('.v8666TransferDecisionHead span');if(span)span.textContent='Marca los productos que SÍ deben enviarse. Los desmarcados quedarán como ELIMINAR en el Excel.';var btn=card.querySelector('button');if(btn){btn.textContent='Seleccionar entregas';btn.onclick=function(){window.openTransferDecisions8667();};}}

  function mark67(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='11/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 11/08/2026 · '+VERSION;}catch(_){} }
  function patch67(){try{installLiveHistory67();patchInventory67();patchMarkdown67();patchTrend67();patchTracking67();patchTransferCard67();mark67();}catch(e){console.error('V86.67 patch',e);}}
  function install67(){if(installed)return true;if(!window.__LLAVERO_BOOTSTRAPPED__||typeof window.setView!=='function'||typeof S==='undefined'||!S)return false;var h=liveHistory67();if(!h.daily.length||!h.details.length)return false;installed=true;installLiveHistory67();
    var sv=window.setView,rf=window.refresh;if(typeof sv==='function')window.setView=function(){var out=sv.apply(this,arguments);setTimeout(patch67,260);setTimeout(patch67,620);return out;};if(typeof rf==='function')window.refresh=function(){var out=rf.apply(this,arguments);setTimeout(patch67,260);setTimeout(patch67,620);return out;};
    patch67();console.info('LLAVERO V86.67 · historial vivo + inventario + Markdown + checklist corregidos');return true;}
  function start67(){if(install67())return;setTimeout(start67,180);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start67,{once:true});else start67();window.addEventListener('llavero:bootstrapped',function(){setTimeout(start67,120);},{once:true});
})();


/* ==== llaveroV8667FinalStabilizer ==== */

(function(){
  'use strict';
  var VERSION='V86.67', installed=false;
  function tx(v){return v==null?'':String(v);}
  function nm(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function fi(v){try{return typeof fInt==='function'?fInt(v):Math.round(nm(v)).toLocaleString('es-CO');}catch(_){return String(Math.round(nm(v)));}}
  function esc67f(v){return tx(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function currentView67f(){try{return typeof VIEW!=='undefined'?VIEW:(document.body&&document.body.dataset&&document.body.dataset.v8620View)||'';}catch(_){return '';}}
  function mdRows67f(){try{return typeof window.mdRows8664==='function'?(window.mdRows8664(CUR)||[]):[];}catch(e){console.error('V86.67 filas Markdown',e);return [];}}
  function mdPolicyRows67f(){return mdRows67f().filter(function(r){return !!r.actionable||r.statusKey==='manage'||r.statusKey==='update_sample';});}
  function openPolicy67f(kind){try{if(typeof window.openMdPolicy8666==='function')return window.openMdPolicy8666(kind);if(typeof window.openMdPolicy8664==='function')return window.openMdPolicy8664(kind);}catch(e){console.error('V86.67 detalle politica',e);}}
  window.openMdPolicy8667=openPolicy67f;
  function policyHtml67f(){
    var act=mdPolicyRows67f(), rot=act.filter(function(r){return r.policyApplied==='Rotación';}), evac=act.filter(function(r){return r.policyApplied==='Evacuación';}), total=Math.max(1,act.length);
    function units(rows){return rows.reduce(function(a,r){return a+nm(r.stock);},0);}
    function card(kind,label,rows,cls){var pct=rows.length/total*100;return '<button type="button" class="v8667FinalPolicyCard '+(cls||'')+'" onclick="openMdPolicy8667(\''+kind+'\')"><div class="v8667FinalPolicyHead"><b>'+esc67f(label)+'</b><span>Ver productos →</span></div><div class="v8667FinalPolicyStats"><div class="v8667FinalPolicyStat"><label>Productos</label><b>'+fi(rows.length)+'</b></div><div class="v8667FinalPolicyStat"><label>Unidades</label><b>'+fi(units(rows))+'</b></div><div class="v8667FinalPolicyStat"><label>Participación</label><b>'+pct.toFixed(1)+'%</b></div></div><div class="v8667FinalPolicyBar"><i style="width:'+Math.max(rows.length?3:0,pct)+'%"></i></div></button>';}
    return '<div class="v8667FinalPolicyGrid">'+card('rot','Rotación',rot,'')+card('evac','Evacuación',evac,'evac')+'</div><div class="v8667FinalPolicyNote">Porcentaje calculado sobre el total de productos que requieren gestión de Markdown. Selecciona Rotación o Evacuación para abrir el detalle.</div>';
  }
  function patchPolicy67f(){if(window.__LLAVERO_MARKDOWN_FINAL__)return;
    if(currentView67f()!=='markdown')return;
    var content=document.getElementById('content');if(!content)return;
    var card=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Productos a gestionar por política';});
    if(!card)return;
    card.style.gridColumn='1 / -1';card.style.width='100%';card.style.minWidth='0';card.classList.add('v8667PolicyWide');
    var parent=card.parentElement;if(parent&&parent.classList.contains('mdAnalyticsGrid8646')){parent.style.gridTemplateColumns='minmax(0,1fr)';parent.style.width='100%';}
    var body=card.querySelector('.cbody');if(body)body.innerHTML=policyHtml67f();
  }
  var finalMdOpen67f=function(code){
    var c=tx(code).trim();if(!c)return;
    try{if(typeof window.closeRangeModal==='function')window.closeRangeModal();else{var rm=document.getElementById('rangeModal');if(rm)rm.classList.remove('on');}}catch(_){}
    setTimeout(function(){
      try{
        if(typeof window.openInventoryProduct==='function'){window.openInventoryProduct(c);return;}
        if(typeof window.openBestProductDetail==='function'){window.openBestProductDetail(c);return;}
        if(typeof window.openProductFromSales==='function')window.openProductFromSales(c);
      }catch(e){console.error('V86.67 abrir producto Markdown',e);}
    },90);
  };
  function installMdProductOpen67f(){
    try{Object.defineProperty(window,'openMdProduct8664',{configurable:true,enumerable:true,get:function(){return finalMdOpen67f;},set:function(){}});}catch(_){window.openMdProduct8664=finalMdOpen67f;}
  }
  function patchMdRows67f(){
    if(currentView67f()!=='markdown')return;
    document.querySelectorAll('#markdown-table-8618 tbody tr,[id^="v8666MdDetailTable"] tbody tr,.v8666MdDetailTable tbody tr').forEach(function(tr){
      var c=tr.getAttribute('data-md-product')||tr.getAttribute('data-code');
      if(!c){var code=tr.querySelector('.code');c=code&&code.textContent.trim();}
      if(!c)return;
      tr.style.cursor='pointer';
      tr.onclick=function(ev){if(ev&&ev.target&&ev.target.closest('input,button,a,select,textarea'))return;window.openMdProduct8664(c);};
    });
  }
  function installMdDelegation67f(){
    function wire(root){if(!root||root.dataset.v8667MdDelegate==='1')return;root.dataset.v8667MdDelegate='1';root.addEventListener('click',function(ev){
      if(currentView67f()!=='markdown')return;
      var tr=ev.target&&ev.target.closest&&ev.target.closest('#markdown-table-8618 tbody tr,.v8666MdDetailTable tbody tr,[id^="v8666MdDetailTable"] tbody tr');
      if(!tr||!root.contains(tr)||ev.target.closest('input,button,a,select,textarea'))return;
      var c=tr.getAttribute('data-md-product')||tr.getAttribute('data-code'),ce=!c&&tr.querySelector('.code');if(!c&&ce)c=ce.textContent.trim();if(!c)return;
      ev.preventDefault();ev.stopPropagation();finalMdOpen67f(c);
    },true);}
    wire(document.getElementById('content'));wire(document.getElementById('rangeModal'));
  }
  /* Seguimiento frente al corte: motor final sobre el historial ya descomprimido. */
  var trackState67f={state:'rot',metric:'both',status:'all',from:'',to:'',mode:'previous'};
  function trackHist67f(){try{var el=document.getElementById('embeddedHistory'),h=JSON.parse(el&&el.textContent||'{}'),a=Array.isArray(h.details)?h.details:[];return a.filter(function(x){return x&&x.date&&x.stores;}).slice().sort(function(a,b){return tx(a.date).localeCompare(tx(b.date));});}catch(_){return [];}}
  function trackDates67f(){return trackHist67f().map(function(x){return x.date;});}
  function ensureTrack67f(){var d=trackDates67f();if(!d.length)return d;var last=d[d.length-1],prev=d[Math.max(0,d.length-2)];if(d.indexOf(trackState67f.to)<0)trackState67f.to=last;if(d.indexOf(trackState67f.from)<0)trackState67f.from=prev;if(trackState67f.from>trackState67f.to){var z=trackState67f.from;trackState67f.from=trackState67f.to;trackState67f.to=z;}return d;}
  function trackMap67f(rows){var out={};(rows||[]).forEach(function(r){var c=tx(r&&r[0]).trim();if(!c)return;if(!out[c])out[c]={u:0,v:0,age:-1};out[c].u+=nm(r&&r[1]);out[c].v+=nm(r&&r[2]);out[c].age=Math.max(out[c].age,nm(r&&r[3]));});return out;}
  function trackStatus67f(a,b,had,has){if(had&&!has)return'recovered';if(!had&&has)return'new';var du=nm(b.u)-nm(a.u),dv=nm(b.v)-nm(a.v);if(trackState67f.metric==='units'){if(du<-.0001)return'partial';if(du>.0001)return'increased';return'persistent';}if(trackState67f.metric==='value'){if(dv<-.01)return'partial';if(dv>.01)return'increased';return'persistent';}if(Math.abs(du)<.0001&&Math.abs(dv)<.01)return'persistent';if(du<=0&&dv<=0&&(du<0||dv<0))return'partial';if(du>=0&&dv>=0&&(du>0||dv>0))return'increased';return'mixed';}
  function trackCompare67f(){var h=trackHist67f(),a=h.find(function(x){return x.date===trackState67f.from;}),b=h.find(function(x){return x.date===trackState67f.to;}),key=trackState67f.state;if(!a||!b)return{items:[],summary:null};var am=trackMap67f(a.stores&&a.stores[CUR]&&a.stores[CUR][key]),bm=trackMap67f(b.stores&&b.stores[CUR]&&b.stores[CUR][key]),keys=Array.from(new Set(Object.keys(am).concat(Object.keys(bm)))),items=[];keys.forEach(function(c){var had=!!am[c],has=!!bm[c],x=am[c]||{u:0,v:0,age:-1},y=bm[c]||{u:0,v:0,age:-1},p={n:c,cat:'—',lin:'—',sub:'—'};try{p=(typeof productInfo==='function'?productInfo(c):(window.P&&P[c]))||p;}catch(_){}items.push({c:c,p:p,refU:x.u,curU:y.u,diffU:y.u-x.u,refV:x.v,curV:y.v,diffV:y.v-x.v,refAge:x.age,curAge:y.age,status:trackStatus67f(x,y,had,has)});});function sum(fn){return items.reduce(function(z,r){return z+nm(fn(r));},0);}var refU=sum(function(r){return r.refU;}),curU=sum(function(r){return r.curU;}),refV=sum(function(r){return r.refV;}),curV=sum(function(r){return r.curV;}),newU=sum(function(r){return r.status==='new'?r.curU:0;}),newV=sum(function(r){return r.status==='new'?r.curV:0;}),recU=sum(function(r){return r.status==='recovered'?r.refU:0;}),recV=sum(function(r){return r.status==='recovered'?r.refV:0;}),partU=sum(function(r){return r.refU>0&&r.curU>0?Math.max(0,r.refU-r.curU):0;}),partV=sum(function(r){return r.refV>0&&r.curV>0?Math.max(0,r.refV-r.curV):0;}),adjU=refU+newU,adjV=refV+newV;return{items:items,summary:{refU:refU,curU:curU,newU:newU,recoveredU:recU,partialU:partU,progressU:adjU?(adjU-curU)/adjU*100:0,refV:refV,curV:curV,newV:newV,recoveredV:recV,partialV:partV,progressV:adjV?(adjV-curV)/adjV*100:0}};}
  function trackDateLabel67f(v){var m=tx(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:tx(v||'—');}
  function trackLabel67f(s){return{all:'Todos',recovered:'Gestionado',partial:'Reducción parcial',persistent:'Persistente',new:'Nuevo',increased:'Aumentó',mixed:'Cambio mixto'}[s]||'Todos';}
  function trackMoney67f(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(nm(v)):'$ '+Math.round(nm(v)).toLocaleString('es-CO');}catch(_){return '$ '+Math.round(nm(v));}}
  function trackProgress67f(v){var cl=v>.05?'good':v<-.05?'bad':'flat',a=v>.05?'↑':v<-.05?'↓':'→';return '<span class="trackProgress '+cl+'">'+a+' '+Math.abs(v).toFixed(1)+'%</span>';}
  function trackMetric67f(label,badge,ref,cur,rec,partial,fresh,progress,isMoney){var f=isMoney?trackMoney67f:fi;return '<div class="trackingMeasure"><div class="trackingMeasureHead"><b>'+label+'</b><span>'+badge+'</span></div><div class="trackingMetricGrid"><div class="trackingMetric"><label>Referencia</label><b>'+f(ref)+'</b></div><div class="trackingMetric"><label>Actual</label><b>'+f(cur)+'</b></div><div class="trackingMetric good"><label>Gestionado + reducción</label><b>'+f(rec+partial)+'</b></div><div class="trackingMetric new"><label>Nuevos</label><b>'+f(fresh)+'</b></div><div class="trackingMetric '+(progress>=0?'good':'bad')+'"><label>Avance ajustado</label><b>'+trackProgress67f(progress)+'</b></div></div></div>';}
  function trackTable67f(data){var rows=data.items.slice();if(trackState67f.status!=='all')rows=rows.filter(function(r){return r.status===trackState67f.status;});var order={recovered:0,partial:1,new:2,increased:3,mixed:4,persistent:5};rows.sort(function(a,b){return(order[a.status]-order[b.status])||Math.abs(b.diffV)-Math.abs(a.diffV)||Math.abs(b.diffU)-Math.abs(a.diffU);});if(!rows.length)return'<div class="trackingEmpty">No hay productos para este resultado.</div>';var uc=trackState67f.metric!=='value',vc=trackState67f.metric!=='units';return'<div class="trackingTableWrap trackingTableWrapV84"><table class="trackingTable trackingComparisonTableV84"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Resultado</th>'+(uc?'<th class="num">Uds. inicial</th><th class="num">Uds. final</th><th class="num">Dif. uds.</th>':'')+(vc?'<th class="num">Valor inicial</th><th class="num">Valor final</th><th class="num">Dif. valor</th>':'')+'</tr></thead><tbody>'+rows.map(function(r){var im='';try{if(typeof imageThumb==='function')im=imageThumb(r.c,'sm');}catch(_){}return'<tr data-v8667-track-code="'+esc67f(r.c)+'" tabindex="0" role="button"><td>'+im+'</td><td><span class="code">'+esc67f(r.c)+'</span></td><td><div class="trackingProduct">'+esc67f(r.p.n||r.c)+'</div><div class="trackingMeta">'+esc67f((r.p.cat||'—')+' · '+(r.p.lin||'—')+' · '+(r.p.sub||'—'))+'</div></td><td><span class="trackingResult '+r.status+'">'+trackLabel67f(r.status)+'</span></td>'+(uc?'<td class="num">'+fi(r.refU)+'</td><td class="num"><b>'+fi(r.curU)+'</b></td><td class="num"><b>'+(r.diffU>0?'+':'')+fi(r.diffU)+'</b></td>':'')+(vc?'<td class="num">'+trackMoney67f(r.refV)+'</td><td class="num"><b>'+trackMoney67f(r.curV)+'</b></td><td class="num"><b>'+(r.diffV>0?'+':'')+trackMoney67f(r.diffV)+'</b></td>':'')+'</tr>';}).join('')+'</tbody></table></div>';}
  function wireTrackingRows67f(panel){panel.querySelectorAll('[data-v8667-track-code]').forEach(function(tr){tr.onclick=function(){var c=tr.dataset.v8667TrackCode;try{if(typeof window.openInventoryProduct==='function')window.openInventoryProduct(c);else if(typeof window.openTrackingProduct8662==='function')window.openTrackingProduct8662(c);}catch(_){}};tr.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();tr.click();}};});}
  function trackingContext8670(panel,data){
    var box=panel&&panel.querySelector('.trackingCustomInfo8670');
    if(trackState67f.mode!=='custom'){if(box)box.remove();return;}
    if(!box){box=document.createElement('div');box.className='trackingCustomInfo8670';var controls=panel.querySelector('.trackingControls');if(controls)controls.insertAdjacentElement('afterend',box);}
    var stateLabel=trackState67f.state==='evac'?'Evacuación':'Rotación';
    var metricLabel=trackState67f.metric==='value'?'Pesos':trackState67f.metric==='both'?'Juntos':'Unidades';
    var count=data&&Array.isArray(data.items)?data.items.length:0;
    box.innerHTML='<div class="trackingCustomIcon8670">↔</div><div><b>Comparación personalizada activa</b><span>Corte inicial <strong>'+trackDateLabel67f(trackState67f.from)+'</strong> · Corte final <strong>'+trackDateLabel67f(trackState67f.to)+'</strong> · '+stateLabel+' · Vista '+metricLabel+'.</span><small>Los indicadores, estados y la tabla inferior están recalculados exclusivamente con estos dos cortes · '+fi(count)+' productos comparados.</small></div>';
  }
  function applyTrackingLive67f(){if(currentView67f()!=='resumen')return;var panel=document.getElementById('storeTrackingPanel'),dates=ensureTrack67f();if(!panel||!dates.length)return;var data=trackCompare67f(),sm=data.summary;if(!sm)return;var tt=panel.querySelector('.tt');if(tt)tt.textContent='Seguimiento frente al corte';var ds=panel.querySelector('.ds');if(ds)ds.textContent='Qué salió, disminuyó, permaneció, ingresó o aumentó en '+(trackState67f.state==='evac'?'Evacuación':'Rotación');var controls=panel.querySelector('.trackingControls'),groups=controls?Array.from(controls.querySelectorAll('.trackingControlGroup')):[];if(!controls||!groups.length)return;
    var compare=groups[0],btns=Array.from(compare.querySelectorAll('.trackBtn')),prev=btns.find(function(b){return /anterior/i.test(b.textContent||'');})||btns[0],base=btns.find(function(b){return /base/i.test(b.textContent||'');})||btns[1],custom=btns.find(function(b){return /personalizado/i.test(b.textContent||'');});if(!custom){custom=document.createElement('button');custom.type='button';custom.className='trackBtn';custom.textContent='Personalizado';compare.appendChild(custom);}if(prev){prev.textContent='Corte anterior';prev.classList.toggle('on',trackState67f.mode==='previous');prev.onclick=function(e){e.preventDefault();window.quickTrack8662('previous');};}if(base){base.textContent='Corte base';base.classList.toggle('on',trackState67f.mode==='base');base.onclick=function(e){e.preventDefault();window.quickTrack8662('base');};}custom.classList.toggle('on',trackState67f.mode==='custom');custom.style.display='inline-flex';custom.onclick=function(e){e.preventDefault();trackState67f.mode='custom';applyTrackingLive67f();};
    var selectors=controls.querySelector('.v8662CutSelectors');if(!selectors){selectors=document.createElement('div');selectors.className='trackDateSelectors8658 v8662CutSelectors';selectors.innerHTML='<div class="trackDateField8658"><label>Corte inicial</label><select data-v8662-from></select></div><div class="trackDateField8658"><label>Corte final</label><select data-v8662-to></select></div>';compare.insertAdjacentElement('afterend',selectors);}selectors.style.display='flex';selectors.style.visibility='visible';selectors.style.opacity='1';var opts=function(cur){return dates.map(function(d){return'<option value="'+esc67f(d)+'"'+(d===cur?' selected':'')+'>'+trackDateLabel67f(d)+'</option>';}).join('');},fs=selectors.querySelector('[data-v8662-from]'),ts=selectors.querySelector('[data-v8662-to]');if(fs){fs.innerHTML=opts(trackState67f.from);fs.onchange=function(){window.setTrackDate8662('from',this.value);};}if(ts){ts.innerHTML=opts(trackState67f.to);ts.onchange=function(){window.setTrackDate8662('to',this.value);};}
    if(groups[1])groups[1].querySelectorAll('.trackBtn').forEach(function(b){var v=/evac/i.test(b.textContent||'')?'evac':'rot';b.classList.toggle('on',trackState67f.state===v);b.onclick=function(e){e.preventDefault();window.setTrackState8662(v);};});if(groups[2])groups[2].querySelectorAll('.trackBtn').forEach(function(b){var q=tx(b.textContent).toLowerCase(),v=q.indexOf('peso')>=0?'value':q.indexOf('junto')>=0?'both':'units';b.classList.toggle('on',trackState67f.metric===v);b.onclick=function(e){e.preventDefault();window.setTrackMetric8662(v);};});var ref=panel.querySelector('.trackingReference');if(ref)ref.innerHTML='Comparando <b>'+trackDateLabel67f(trackState67f.from)+'</b> → <b>'+trackDateLabel67f(trackState67f.to)+'</b>';var dual=panel.querySelector('.trackingDualSummary');if(dual)dual.innerHTML=trackMetric67f('Vista por unidades','UNIDADES',sm.refU,sm.curU,sm.recoveredU,sm.partialU,sm.newU,sm.progressU,false)+trackMetric67f('Vista por valor del inventario','COP',sm.refV,sm.curV,sm.recoveredV,sm.partialV,sm.newV,sm.progressV,true);trackingContext8670(panel,data);
    var bar=panel.querySelector('.trackingStatusBar'),statuses=['all','recovered','partial','persistent','new','increased','mixed'];if(bar)bar.innerHTML=statuses.map(function(k){var count=k==='all'?data.items.length:data.items.filter(function(r){return r.status===k;}).length;return'<button class="trackStatusBtn '+(trackState67f.status===k?'on':'')+'" data-v8667-status="'+k+'"><span class="trackStatusDot"></span><span>'+trackLabel67f(k)+'</span><b>'+fi(count)+'</b></button>';}).join('');if(bar)bar.querySelectorAll('[data-v8667-status]').forEach(function(b){b.onclick=function(){window.setTrackStatus8662(b.dataset.v8667Status);};});var body=panel.querySelector('.cbody'),note=body&&body.querySelector('.trackingNote');if(body){body.querySelectorAll('.trackingTableWrap,.trackingEmpty').forEach(function(x){x.remove();});var h=trackTable67f(data);if(note)note.insertAdjacentHTML('beforebegin',h);else body.insertAdjacentHTML('beforeend',h);wireTrackingRows67f(panel);}if(note)note.innerHTML='<b>Lectura:</b> “Gestionado” salió completamente del estado; “Reducción parcial” continúa con menor exposición; “Persistente” no cambió; “Nuevo” apareció en el corte final; “Aumentó” incrementó su exposición.';}
  function installTrackingLive67f(){window.quickTrack8662=function(mode){var d=ensureTrack67f();if(!d.length)return;trackState67f.to=d[d.length-1];trackState67f.from=mode==='base'?(d.filter(function(x){return String(x).slice(0,7)===String(trackState67f.to).slice(0,7);})[0]||d[0]):d[Math.max(0,d.length-2)];trackState67f.mode=mode==='base'?'base':'previous';trackState67f.status='all';applyTrackingLive67f();};window.setTrackDate8662=function(k,v){var d=ensureTrack67f();if(d.indexOf(v)<0)return;trackState67f[k]=v;if(trackState67f.from>trackState67f.to){var z=trackState67f.from;trackState67f.from=trackState67f.to;trackState67f.to=z;}trackState67f.mode='custom';trackState67f.status='all';applyTrackingLive67f();};window.setTrackState8662=function(v){trackState67f.state=v;trackState67f.status='all';applyTrackingLive67f();};window.setTrackMetric8662=function(v){trackState67f.metric=v;trackState67f.status='all';applyTrackingLive67f();};window.setTrackStatus8662=function(v){trackState67f.status=v;applyTrackingLive67f();};var root=document.getElementById('content');if(root&&root.dataset.v8667TrackDelegate!=='1'){root.dataset.v8667TrackDelegate='1';root.addEventListener('click',function(e){if(currentView67f()!=='resumen')return;var b=e.target&&e.target.closest&&e.target.closest('#storeTrackingPanel .trackingControlGroup .trackBtn');if(!b||!root.contains(b))return;var g=b.closest('.trackingControlGroup'),lab=g&&g.querySelector('.trackingControlLabel'),isCompare=lab&&/comparar/i.test(lab.textContent||'');if(!isCompare)return;var t=tx(b.textContent).trim().toLowerCase();if(t.indexOf('corte anterior')<0&&t.indexOf('corte base')<0&&t.indexOf('personalizado')<0)return;e.preventDefault();e.stopPropagation();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();if(t.indexOf('base')>=0)window.quickTrack8662('base');else if(t.indexOf('anterior')>=0)window.quickTrack8662('previous');else{trackState67f.mode='custom';applyTrackingLive67f();}},true);}if(!window.__LLAVERO_TRACK_COMPARE_CAPTURE_8667__){window.__LLAVERO_TRACK_COMPARE_CAPTURE_8667__=true;var interceptTrack67f=function(e){if(currentView67f()!=='resumen')return;var b=e.target&&e.target.closest&&e.target.closest('#storeTrackingPanel .trackingControlGroup .trackBtn');if(!b)return;var g=b.closest('.trackingControlGroup'),lab=g&&g.querySelector('.trackingControlLabel');if(!lab||!/comparar/i.test(lab.textContent||''))return;var t=tx(b.textContent).trim().toLowerCase();if(t.indexOf('corte anterior')<0&&t.indexOf('corte base')<0&&t.indexOf('personalizado')<0)return;e.preventDefault();e.stopPropagation();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();if(t.indexOf('base')>=0)window.quickTrack8662('base');else if(t.indexOf('anterior')>=0)window.quickTrack8662('previous');else{trackState67f.mode='custom';applyTrackingLive67f();}};window.addEventListener('pointerdown',interceptTrack67f,true);window.addEventListener('click',interceptTrack67f,true);}}
  function transferDeliveryId67f(node){var sec=node&&node.closest&&node.closest('.v8667Delivery'),b=sec&&sec.querySelector('.v8667DeliveryHead b');return b?tx(b.textContent).replace(/^\s*Entrega\s+/i,'').trim():'';}

  function installTrendDelegation67f(){
    var root=document.getElementById('content');if(!root||root.dataset.v8667TrendDelegate==='1')return;root.dataset.v8667TrendDelegate='1';
    function pointDate(pt){var d=tx(pt&&pt.getAttribute&&pt.getAttribute('data-v8667-date')).trim();if(d)return d;var t=tx(pt&&pt.getAttribute&&pt.getAttribute('title'));return t.split(' · ')[0].trim();}
    root.addEventListener('click',function(ev){if(currentView67f()!=='resumen')return;var pt=ev.target&&ev.target.closest&&ev.target.closest('.v8667TrendPoint');if(!pt||!root.contains(pt))return;var d=pointDate(pt);if(!d)return;ev.preventDefault();ev.stopPropagation();if(typeof ev.stopImmediatePropagation==='function')ev.stopImmediatePropagation();if(typeof window.openTrendPoint8667==='function')window.openTrendPoint8667(d);},true);
    root.addEventListener('keydown',function(ev){if(currentView67f()!=='resumen'||(ev.key!=='Enter'&&ev.key!==' '))return;var pt=ev.target&&ev.target.closest&&ev.target.closest('.v8667TrendPoint');if(!pt||!root.contains(pt))return;var d=pointDate(pt);if(!d)return;ev.preventDefault();ev.stopPropagation();if(typeof window.openTrendPoint8667==='function')window.openTrendPoint8667(d);},true);
  }
  function improveTransfer67f(){
    var body=document.getElementById('rangeModalBody');if(!body||!body.querySelector('#v8667DecisionBody'))return;
    var intro=body.querySelector('.v8667TransferIntro');
    if(intro){var first=intro.firstElementChild;if(first)first.innerHTML='<b>¿Cómo usar este checklist?</b><span>Marca únicamente los productos que SÍ quieres que se envíen. Los productos desmarcados quedarán como <strong>ELIMINAR</strong> en el Excel. Si no quieres recibir ningún producto de una orden, usa <strong>Eliminar entrega completa</strong>.</span>';}
    body.querySelectorAll('.v8667DeliveryActions button.send').forEach(function(b){b.textContent='✓ Seleccionar toda para enviar';});
    body.querySelectorAll('.v8667DeliveryActions button.delete').forEach(function(b){b.textContent='✕ Eliminar entrega completa';});
    var excel=Array.from(body.querySelectorAll('.v8667TransferFooter button')).find(function(b){return /Generar Excel/i.test(b.textContent||'');});if(excel)excel.textContent='Generar Excel ENVIAR / ELIMINAR';
  }
  function mark67f(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='11/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 11/08/2026 · '+VERSION;}catch(_){} }
  function patchFinal67(){try{installMdProductOpen67f();installMdDelegation67f();installTrendDelegation67f();installTrackingLive67f();try{if(!window.__LLAVERO_MARKDOWN_FINAL__)window.mdPolicyChart8646=function(){return policyHtml67f();};}catch(_){}patchPolicy67f();patchMdRows67f();applyTrackingLive67f();improveTransfer67f();mark67f();}catch(e){console.error('V86.67 estabilizador final',e);}}
  function afterFinal67(){setTimeout(patchFinal67,40);}
  function install67f(){
    if(installed)return true;
    if(!window.__LLAVERO_BOOTSTRAPPED__||typeof window.setView!=='function'||typeof S==='undefined'||!S)return false;
    installed=true;installMdProductOpen67f();installMdDelegation67f();installTrendDelegation67f();installTrackingLive67f();
    var sv=window.setView, rf=window.refresh, dm=window.drawMarkdown8617, ot=window.openTransferDecisions8667;
    window.setView=function(){var out=sv.apply(this,arguments);afterFinal67();return out;};
    if(typeof rf==='function')window.refresh=function(){var out=rf.apply(this,arguments);afterFinal67();return out;};
    if(typeof dm==='function')window.drawMarkdown8617=function(){var out=dm.apply(this,arguments);afterFinal67();return out;};
    if(typeof ot==='function')window.openTransferDecisions8667=window.openTransferDecisions8666=function(){var out=ot.apply(this,arguments);setTimeout(improveTransfer67f,30);setTimeout(improveTransfer67f,180);return out;};
    patchFinal67();
    console.info('LLAVERO V86.67 · estabilizador final Markdown/checklist instalado');return true;
  }
  function start67f(){if(install67f())return;setTimeout(start67f,200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start67f,{once:true});else start67f();
  window.addEventListener('llavero:bootstrapped',function(){setTimeout(start67f,150);},{once:true});
})();


/* ==== llaveroV8669TrendFix ==== */

(function(){
  'use strict';
  var VERSION='V86.69', pending=false, observer=null;

  function txt(v){return v==null?'':String(v);}
  function num(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function currentStore(){try{return typeof CUR!=='undefined'?String(CUR||''):'';}catch(_){return '';}}
  function isResumen(){try{return typeof VIEW==='undefined'||VIEW==='resumen';}catch(_){return true;}}

  function historyNow(){
    try{
      var el=document.getElementById('embeddedHistory');
      var h=JSON.parse(el&&el.textContent||'{}');
      if(h&&Array.isArray(h.daily)&&h.daily.length)return h;
    }catch(_){}
    return null;
  }

  function recovery(block){
    if(block&&Number.isFinite(Number(block.reductionAdj)))return Number(block.reductionAdj);
    var base=num(block&&block.previousVal)+num(block&&block.newVal), cur=num(block&&block.currentVal);
    return base>0?(base-cur)/base*100:0;
  }

  function trendData(code){
    var h=historyNow();
    if(!h||!code)return [];
    return h.daily.slice().sort(function(a,b){return txt(a&&a.date).localeCompare(txt(b&&b.date));}).map(function(snap,i){
      var m=snap&&snap.stores&&snap.stores[code];
      if(!m)return null;
      return {
        date:snap.date,
        rotRecovery:i===0?0:recovery(m.rot),
        evacRecovery:i===0?0:recovery(m.evac),
        isBase:i===0
      };
    }).filter(Boolean);
  }

  function findDailyCard(){
    return Array.from(document.querySelectorAll('#content .card')).find(function(c){
      var t=c.querySelector('.tt');
      return t&&t.textContent.trim()==='Seguimiento diario de gestión';
    })||null;
  }

  function fallbackChart(data,code){
    if(!data.length)return '<div class="empty">Sin historial disponible.</div>';
    var W=Math.max(760,120+data.length*190),H=285,p={l:62,r:42,t:48,b:54},vals=[];
    data.forEach(function(d){vals.push(num(d.rotRecovery),num(d.evacRecovery));});
    var min=Math.min.apply(null,vals.concat([0])),max=Math.max.apply(null,vals.concat([0])),spread=Math.max(.8,max-min),margin=Math.max(.35,spread*.22),lo=Math.min(-.15,min-margin*.35),hi=max+margin;
    if(hi-lo<1.2)hi=lo+1.2;
    function x(i){return p.l+(W-p.l-p.r)*(data.length===1?.5:i/(data.length-1));}
    function y(v){return p.t+(H-p.t-p.b)*(hi-num(v))/(hi-lo);}
    function path(k){return data.map(function(d,i){return (i?'L':'M')+x(i).toFixed(1)+','+y(d[k]).toFixed(1);}).join(' ');}
    var grid='';for(var j=0;j<5;j++){var v=lo+(hi-lo)*j/4,yy=y(v);grid+='<line x1="'+p.l+'" y1="'+yy+'" x2="'+(W-p.r)+'" y2="'+yy+'" stroke="var(--line2)"/><text x="'+(p.l-9)+'" y="'+(yy+4)+'" text-anchor="end" font-size="10" fill="var(--mut)">'+v.toFixed(1)+'%</text>';}
    function point(k,color,pos){return data.map(function(d,i){var v=num(d[k]),cx=x(i),cy=y(v),base=i===0,lab=base?'Base 0%':v.toFixed(1)+'%',w=Math.max(50,lab.length*7+16),by=pos==='up'?cy-31:cy+10,ty=pos==='up'?cy-17:cy+25;if(base&&k==='evacRecovery')return '';return '<g class="trendPoint79" tabindex="0" role="button" data-v8669-date="'+txt(d.date)+'"><circle cx="'+cx+'" cy="'+cy+'" r="6" fill="'+color+'" stroke="var(--card)" stroke-width="2"></circle><rect class="trendLabelBox79" x="'+(cx-w/2)+'" y="'+by+'" width="'+w+'" height="22" rx="8" stroke="'+color+'"></rect><text class="trendLabelText79" x="'+cx+'" y="'+ty+'" text-anchor="middle" fill="'+color+'">'+lab+'</text></g>';}).join('');}
    var dates=data.map(function(d,i){var a=txt(d.date).slice(5).split('-').reverse().join('/');return '<text x="'+x(i)+'" y="'+(H-16)+'" text-anchor="middle" font-size="10" font-weight="800" fill="var(--mut)">'+a+'</text>';}).join('');
    return '<div class="trendScroll79"><svg class="v79TrendSvg" viewBox="0 0 '+W+' '+H+'" style="width:'+W+'px">'+grid+'<line x1="'+p.l+'" y1="'+y(0)+'" x2="'+(W-p.r)+'" y2="'+y(0)+'" stroke="var(--mut)" stroke-width="1.5" stroke-dasharray="6 5"/><path d="'+path('rotRecovery')+'" fill="none" stroke="var(--rot)" stroke-width="4"/><path d="'+path('evacRecovery')+'" fill="none" stroke="var(--evac)" stroke-width="4"/>'+point('rotRecovery','var(--rot)','up')+point('evacRecovery','var(--evac)','down')+dates+'</svg></div><div class="trendLegend"><span><i style="background:var(--rot)"></i>Mejora Rotación</span><span><i style="background:var(--evac)"></i>Mejora Evacuación</span></div>';
  }

  window.openTrendPoint8669=function(date){
    var code=currentStore();
    try{
      if(typeof window.openTrendDetail79==='function')return window.openTrendDetail79(date,code);
      if(typeof window.openTrendDetail80==='function')return window.openTrendDetail80(date,code);
      if(typeof window.openTrendPoint863==='function')return window.openTrendPoint863(date);
    }catch(e){console.error('V86.69 detalle tendencia',e);}
  };

  function render(){
    pending=false;
    if(!isResumen())return;
    var code=currentStore(),data=trendData(code),daily=findDailyCard();
    if(!daily||!code)return;
    var body=daily.querySelector('.cbody')||daily;
    var cards=Array.from(body.querySelectorAll('.v79StoreTrendCard,.v8667TrendCard,.v8669TrendCard'));
    var card=cards[0];
    if(!card){card=document.createElement('div');body.appendChild(card);}
    cards.slice(1).forEach(function(x){x.remove();});
    card.className='v79StoreTrendCard v8669TrendCard';
    var sig=code+'|'+data.map(function(d){return txt(d.date)+':'+num(d.rotRecovery).toFixed(4)+':'+num(d.evacRecovery).toFixed(4);}).join('|');
    if(card.dataset.v8669Signature===sig&&card.querySelector('.trendScroll79,.v8669FallbackTrend'))return;
    var chart='';
    try{chart=typeof trendChart79==='function'?trendChart79(data,code):fallbackChart(data,code);}catch(e){console.error('V86.69 trendChart79',e);chart=fallbackChart(data,code);}
    card.dataset.v8669Signature=sig;
    card.innerHTML='<div class="v79StoreTrendHead"><div><b>Tendencia histórica de la tienda</b><span>Rotación y Evacuación por cada corte</span></div><span>Presiona un punto para ver su actividad</span></div>'+chart;
    card.querySelectorAll('[data-v8669-date]').forEach(function(pt){pt.addEventListener('click',function(){window.openTrendPoint8669(pt.getAttribute('data-v8669-date'));});pt.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();window.openTrendPoint8669(pt.getAttribute('data-v8669-date'));}});});
    try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='13/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 13/08/2026 · '+VERSION;}catch(_){}
  }

  function schedule(ms){setTimeout(function(){if(pending)return;pending=true;requestAnimationFrame(render);},ms||0);}

  function install(){
    if(!window.__LLAVERO_BOOTSTRAPPED__){setTimeout(install,160);return;}
    var root=document.getElementById('content');
    if(root&&!observer){observer=new MutationObserver(function(){schedule(30);});observer.observe(root,{childList:true});}
    if(root&&!root.dataset.v8669TrendEvents){root.dataset.v8669TrendEvents='1';root.addEventListener('click',function(ev){var pt=ev.target&&ev.target.closest&&ev.target.closest('[data-v8669-date]');if(pt){ev.preventDefault();ev.stopPropagation();window.openTrendPoint8669(pt.getAttribute('data-v8669-date'));}},true);}
    var oldSet=window.setView,oldRefresh=window.refresh;
    if(typeof oldSet==='function'&&!oldSet.__v8669){var wrap=function(){var out=oldSet.apply(this,arguments);schedule(80);schedule(400);return out;};wrap.__v8669=true;window.setView=wrap;}
    if(typeof oldRefresh==='function'&&!oldRefresh.__v8669){var wrapR=function(){var out=oldRefresh.apply(this,arguments);schedule(80);schedule(400);return out;};wrapR.__v8669=true;window.refresh=wrapR;}
    [0,220,800,1800,3200].forEach(schedule);
    console.info('LLAVERO V86.69 · tendencia historica porcentual corregida');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,100);},{once:true});
})();


/* ==== llaveroV8670OperationsPatch ==== */

(function(){
  'use strict';
  var VERSION='V86.70',installed=false,badgeTimer=0;
  function num(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function fint(v){try{return typeof fInt==='function'?fInt(v):Math.round(num(v)).toLocaleString('es-CO');}catch(_){return String(Math.round(num(v)));}}
  function currentStore8670(){try{return (typeof S!=='undefined'&&S&&S[CUR])||{};}catch(_){return {};}}
  function authenticated8670(){try{return typeof isAuthenticated==='function'&&isAuthenticated();}catch(_){return false;}}

  function normalizeSidebar8670(){
    var nav=document.getElementById('nav');if(!nav)return;
    nav.querySelectorAll('a').forEach(function(a){a.style.order='';var v=a.dataset.v;if(typeof IS_ADMIN!=='undefined'&&IS_ADMIN&&['dashboard','vta','cli'].indexOf(v)>=0)a.style.display='none';else a.style.display='';});
    var storeLab=nav.querySelector('.navStoreLabel8670'),quadLab=nav.querySelector('.navQuadrantsLabel8670'),discLab=nav.querySelector('.navDiscountLabel8670');
    if(storeLab)storeLab.textContent='Tienda';if(quadLab)quadLab.textContent='Cuadrantes';if(discLab)discLab.textContent='Gestión de Descuentos';
  }

  function markdownCount8670(sc){
    try{var fn=window.mdRows8664||window.mdRows8618||window.mdRows8662;if(typeof fn!=='function')return null;var rows=fn(sc)||[];if(rows.some(function(r){return Object.prototype.hasOwnProperty.call(r||{},'actionable');}))return rows.filter(function(r){return !!r.actionable;}).length;return rows.length;}catch(_){return null;}
  }

  function syncBadges8670(){
    var st=currentStore8670();if(!st||!Object.keys(st).length)return;
    try{if(typeof window.recalcOperationalKpis==='function')window.recalcOperationalKpis(st);}catch(_){}
    var k=st.kpi||{},inv=null,prox=null,rot=null,evac=null;
    try{if(typeof window.inventorySummary==='function')inv=window.inventorySummary(st);}catch(_){}
    try{if(typeof window.upcomingRotationRows==='function')prox=window.upcomingRotationRows(st);}catch(_){}
    try{if(typeof window.normalizeRotRows==='function')rot=window.normalizeRotRows(st);}catch(_){}
    try{if(typeof window.normalizeEvacRows==='function')evac=window.normalizeEvacRows(st);}catch(_){}
    var guideCount=(Array.isArray(st.guias)&&st.guias.length)?st.guias.length:((typeof DB!=='undefined'&&DB&&Array.isArray(DB.G))?DB.G.length:0);
    var vals={
      'nc-inv':inv&&Number.isFinite(Number(inv.refs))?num(inv.refs):((st.inventario||[]).filter(function(r){return num(r&&r.stock)>0;}).length||num(k.stockRefs)),
      'nc-prox':Array.isArray(prox)?prox.length:0,
      'nc-rot':Array.isArray(rot)?rot.length:num(k.rotN),
      'nc-evac':Array.isArray(evac)?evac.filter(function(r){return r&&r.active!==false;}).length:num(k.evacN),
      'nc-amb':guideCount,
      'nc-tr':typeof window.__transferPendingOrderCount==='function'?window.__transferPendingOrderCount(st):(Array.isArray(st.tr)?st.tr.length:num(k.trN))
    };
    var md=markdownCount8670(typeof CUR!=='undefined'?CUR:'');if(md!=null)vals['nc-md']=md;
    Object.keys(vals).forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=fint(vals[id]);});
  }

  function scheduleSync8670(delay){clearTimeout(badgeTimer);badgeTimer=setTimeout(function(){normalizeSidebar8670();syncBadges8670();},delay||0);}

  function forceDefaultView8670(){
    if(!authenticated8670())return;
    try{
      var target=(typeof IS_LEADER!=='undefined'&&IS_LEADER)?'dashboard':'inventario';
      if(typeof IS_ADMIN!=='undefined'&&IS_ADMIN&&typeof AUTH!=='undefined'&&AUTH&&AUTH.store)CUR=AUTH.store;
      if(typeof VIEW!=='undefined'&&(!VIEW||(IS_ADMIN&&['dashboard','vta','cli','resumen'].indexOf(VIEW)>=0)))VIEW=target;
      if(typeof setActiveNav==='function')setActiveNav(VIEW||target);
    }catch(_){}
  }

  function wrap8670(name,after){
    var old=window[name];if(typeof old!=='function'||old.__v8670)return;
    var fn=function(){var out=old.apply(this,arguments);try{after&&after.apply(this,arguments);}catch(_){}return out;};fn.__v8670=true;window[name]=fn;
    try{if(name==='setView')setView=fn;else if(name==='refresh')refresh=fn;else if(name==='applyRoleUI')applyRoleUI=fn;else if(name==='loginUser')loginUser=fn;else if(name==='applyNewDB')applyNewDB=fn;}catch(_){}
  }

  function mark8670(){
    try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='13/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 13/08/2026 · '+VERSION;}catch(_){}
  }

  function install8670(){
    if(installed)return true;
    if(!window.__LLAVERO_BOOTSTRAPPED__||!window.__LLAVERO_V8662_READY__||typeof window.setView!=='function'||typeof window.refresh!=='function')return false;
    installed=true;
    wrap8670('setView',function(){scheduleSync8670(20);});
    wrap8670('refresh',function(){scheduleSync8670(20);});
    wrap8670('applyRoleUI',function(){setTimeout(function(){normalizeSidebar8670();forceDefaultView8670();syncBadges8670();},0);});
    wrap8670('loginUser',function(){setTimeout(function(){forceDefaultView8670();normalizeSidebar8670();syncBadges8670();},20);});
    wrap8670('applyNewDB',function(){setTimeout(function(){forceDefaultView8670();normalizeSidebar8670();syncBadges8670();},30);});
    normalizeSidebar8670();forceDefaultView8670();syncBadges8670();mark8670();
    setTimeout(function(){normalizeSidebar8670();syncBadges8670();mark8670();},600);
    setTimeout(function(){normalizeSidebar8670();syncBadges8670();mark8670();},1800);
    console.info('LLAVERO V86.70 · navegación por rol, contadores y corte personalizado optimizados');
    return true;
  }
  function start8670(){if(install8670())return;setTimeout(start8670,140);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start8670,{once:true});else start8670();
  window.addEventListener('llavero:bootstrapped',function(){setTimeout(start8670,420);},{once:true});
})();


/* ==== llaveroV8671LastUnitPolicyPatch ==== */

(function(){
  'use strict';
  var VERSION='V86.71';
  function mark(){
    try{
      window.LLAVERO_BUILD=VERSION;
      document.documentElement.setAttribute('data-llavero-build',VERSION);
      document.documentElement.setAttribute('data-llavero-app-version',VERSION);
      var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='13/08/2026 · '+VERSION;
      document.title='Llavero · Inventarios Jamar · 13/08/2026 · '+VERSION;
    }catch(_){}
  }
  function addRuleNote(){
    try{
      if(typeof VIEW!=='undefined'&&VIEW!=='markdown')return;
      var root=document.getElementById('content');if(!root||root.querySelector('[data-v8671-last-unit-note]'))return;
      var target=Array.from(root.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&/política|politica/i.test(t.textContent);});
      if(!target)return;
      var body=target.querySelector('.cbody');if(!body)return;
      var note=document.createElement('div');note.setAttribute('data-v8671-last-unit-note','1');note.className='hint';
      note.innerHTML='<span>ℹ</span><span><b>Última unidad:</b> esta política solo aplica cuando la tienda tiene exactamente <b>1 unidad</b> y la disponibilidad en <b>CENDIS es 0</b>. En cualquier otro caso de Evacuación se aplica la regla normal de Fuera de surtido.</span>';
      body.insertBefore(note,body.firstChild);
    }catch(_){}
  }
  function run(){mark();addRuleNote();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(run,500);},{once:true});else setTimeout(run,500);
  window.addEventListener('llavero:bootstrapped',function(){setTimeout(run,650);});
  var old=window.setView;if(typeof old==='function'&&!old.__v8671){var w=function(){var out=old.apply(this,arguments);setTimeout(run,120);return out;};w.__v8671=true;window.setView=w;try{setView=w;}catch(_){}}
  console.info('LLAVERO V86.71 · política de última unidad: solo stock tienda=1 y CENDIS=0');
})();


/* ==== llaveroV8682Script ==== */

(function(){
'use strict';
var VERSION='V86.82', installed=false, baseRows=null, mdLimit=160, novelState='all';window.__LLAVERO_MARKDOWN_FINAL__=true;
function s(v){return v==null?'':String(v)}
function n(v){var x=Number(v);return Number.isFinite(x)?x:0}
function nullable(v){if(v===null||v===undefined||v==='')return null;var x=Number(v);return Number.isFinite(x)?x:null}
function norm(v){var x=s(v);try{return x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim()}catch(_){return x.toUpperCase().trim()}}
function esc(v){return s(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fi(v){try{return typeof fInt==='function'?fInt(n(v)):Math.round(n(v)).toLocaleString('es-CO')}catch(_){return String(Math.round(n(v)))}}
function pct(v){var x=nullable(v);return x==null?'—':x.toFixed(1).replace('.0','')+'%'}
function store(sc){try{return (S&&S[sc||CUR])||{}}catch(_){return{}}}
function prod(c){try{return (P&&P[c])||{}}catch(_){return{}}}
function isGift(r){var p=prod(r.code),t=norm([r.name,p.n,r.category,p.cat,r.line,p.lin,r.subline,p.sub,p.estilo,p.marca].join(' '));return t.indexOf('OBSEQUI')>=0}
function classOf(r){var p=prod(r.code),x=norm(r.cc||p.cc||'');if(x.indexOf('CORE')>=0)return'CORE';if(x.indexOf('COMPLEMENT')>=0)return'COMPLEMENTO';return'SIN CLASIFICACIÓN'}
function correctedRows(sc){sc=sc||CUR;var raw=[];try{raw=(baseRows?baseRows(sc):[]).slice()}catch(_){raw=[]}return raw.filter(function(r){return r&&!isGift(r)}).map(function(r){r=Object.assign({},r);r.cc=classOf(r);var sug=nullable(r.discount),cur=nullable(r.currentDiscount),offer=nullable(r.systemOfferDiscount),tol=.049,key=r.statusKey,reason=r.reason||'';if(cur==null)cur=0;if(sug==null){key='no_policy';r.statusLabel='Sin política';}else if(key==='review'){r.statusLabel='Revisar dato';}else if(cur>sug+tol){key='exceed';r.statusLabel='Supera política';reason='El descuento muestra supera la política.';}else if(cur>=sug-tol){key='comply';r.statusLabel='Cumple política';reason='El descuento muestra cumple la política.';}else if(offer!=null&&offer>=sug-tol){key='offer_covered';r.statusLabel='Oferta ya supera sugerido';reason='La oferta comercial ya cubre o supera la política. No requiere actualización del descuento muestra.';}else{key='manage';r.statusLabel='Gestionar descuento';reason='El descuento sugerido es mayor al descuento muestra y la oferta no cubre la política.';}r.currentDiscount=cur;r.adminDiscount=cur;r.gap=sug==null?null:sug-cur;r.statusKey=key;r.actionable=key==='manage';r.updateSample=false;r.reason=reason;r.actionText=reason;if(key!=='manage')r.impact=0;return r;});}
function mdState(){window.mdState8618=window.mdState8618||{};return window.mdState8618}
function filteredRows(sc){var rows=correctedRows(sc),f=mdState(),q=norm(f.q||'');if(f.card&&f.card!=='all'&&f.card!=='actionable')rows=rows.filter(function(r){return r.statusKey===f.card});else if(f.card==='actionable')rows=rows.filter(function(r){return r.statusKey==='manage'});if(f.type&&f.type!=='all')rows=rows.filter(function(r){if(f.type==='outside')return r.typeKey==='fs'||r.typeKey==='fs_last';if(f.type==='last_unit')return r.typeKey==='fs_last';return r.typeKey===f.type});if(f.age&&f.age!=='all')rows=rows.filter(function(r){return r.ageKey===f.age});if(f.discount&&f.discount!=='all')rows=rows.filter(function(r){return String(r.discount)===String(f.discount)});if(f.responsible&&f.responsible!=='all')rows=rows.filter(function(r){if(r.statusKey!=='manage')return false;return f.responsible==='leader'?n(r.discount)>50:n(r.discount)<=50});if(f.classification&&f.classification!=='all')rows=rows.filter(function(r){return r.cc===f.classification});if(f.policyGroup==='rot')rows=rows.filter(function(r){return norm(r.policyApplied).indexOf('ROT')>=0});else if(f.policyGroup==='evac')rows=rows.filter(function(r){return norm(r.policyApplied).indexOf('EVAC')>=0});if(q)rows=rows.filter(function(r){return norm([r.code,r.name,r.category,r.line,r.subline,r.cc,r.policyApplied,r.ruleApplied,r.statusLabel].join(' ')).indexOf(q)>=0});return rows}
function statusClass(r){if(r.statusKey==='manage')return'bad';if(r.statusKey==='review')return'warn';if(r.statusKey==='no_policy')return'none';if(r.statusKey==='offer_covered')return'warn';return'good'}
function selectionMemory(){var key='llavero_markdown_gestion_v8623_'+s(DB&&DB.meta&&DB.meta.fecha||'SIN_CORTE').replace(/[^0-9A-Za-z_-]+/g,'_');try{return {key:key,data:JSON.parse(localStorage.getItem(key)||'{"items":{}}')}}catch(_){return {key:key,data:{items:{}}}}}
function selected(sc,c){var m=selectionMemory().data;return !!(m.items&&m.items[s(sc)+'|'+s(c)])}
function syncInvalidSelections(){if(!window.V8623)return;var m=selectionMemory(),items=m.data.items||{},byStore={};Object.keys(items).forEach(function(k){var p=k.split('|'),sc=p.shift(),c=p.join('|');(byStore[sc]||(byStore[sc]={}))[c]=1});Object.keys(byStore).forEach(function(sc){var ok={};correctedRows(sc).forEach(function(r){if(r.statusKey==='manage')ok[s(r.code)]=1});Object.keys(byStore[sc]).forEach(function(c){if(!ok[c])try{V8623.remove(sc,c)}catch(_){}})});}
function toggleProduct(code,checked){if(!window.V8623)return;if(checked)V8623.add(CUR,code);else V8623.remove(CUR,code)}
function selectVisibleOnly(check){var table=document.querySelector('#markdown-table-8618 table.v8680MarkdownTable');if(!table)return;table.querySelectorAll('tbody tr[data-md-product]').forEach(function(tr){var cb=tr.querySelector('input[type=checkbox]');if(!cb||cb.disabled)return;if(cb.checked!==check){cb.checked=check;toggleProduct(tr.dataset.mdProduct,check)}})}
function renderTable(){if((typeof VIEW!=='undefined'?VIEW:'')!=='markdown')return;var root=document.getElementById('markdown-table-8618');if(!root)return;var rows=filteredRows(CUR),vis=rows.slice(0,mdLimit);function img(c){try{return typeof imageThumb==='function'?imageThumb(c,'sm'):''}catch(_){return''}}root.innerHTML='<div class="v8680MarkdownWrap"><table class="v8623MarkdownTable v8680MarkdownTable"><thead><tr><th class="v8680Sel">Sel.</th><th class="v8680Img">Imagen</th><th class="v8680Code">Código</th><th class="v8680Product">Producto</th><th class="v8680Class">Clasificación</th><th class="v8680Stock num">Stock</th><th class="v8680Age">Antigüedad</th><th class="v8680Policy">Política / Regla</th><th class="v8680Pct">Oferta</th><th class="v8680Pct">Muestra</th><th class="v8680Pct">Sugerido</th><th class="v8680Gap">Brecha</th><th class="v8680State">Estado</th><th class="v8680Owner">Responsable</th></tr></thead><tbody>'+vis.map(function(r){var ok=r.statusKey==='manage',owner=ok?(n(r.discount)>50?'Líder de Área':'Administrador'):'—';return'<tr data-md-product="'+esc(r.code)+'" onclick="if(!event.target.closest(\'input,button,a\'))openMdProduct8664('+JSON.stringify(r.code)+')"><td class="v8680Sel"><input type="checkbox" aria-label="Seleccionar producto '+esc(r.code)+'" '+(selected(CUR,r.code)?'checked ':'')+(ok?'':'disabled ')+'onclick="event.stopPropagation()" onchange="V8680.toggle('+JSON.stringify(r.code)+',this.checked)"></td><td class="v8680Img">'+img(r.code)+'</td><td class="v8680Code"><span class="code">'+esc(r.code)+'</span></td><td class="v8680Product"><div class="v8680ProductName">'+esc(r.name)+'</div><div class="v8680ProductMeta">'+esc([r.category,r.line,r.subline].filter(Boolean).join(' · '))+'</div></td><td class="v8680Class"><span class="v8680ClassPill">'+esc(r.cc)+'</span></td><td class="v8680Stock num"><b>'+fi(r.stock)+'</b></td><td class="v8680Age">'+esc(r.ageLabel||'—')+'</td><td class="v8680Policy"><b>'+esc(r.policyApplied||'—')+'</b><div class="muted">'+esc(r.ruleApplied||'')+'</div></td><td class="v8680Pct">'+pct(r.systemOfferDiscount)+'</td><td class="v8680Pct"><b>'+pct(r.currentDiscount)+'</b></td><td class="v8680Pct"><b>'+pct(r.discount)+'</b></td><td class="v8680Gap">'+(r.gap==null?'—':(r.gap>0?'+':'')+Number(r.gap).toFixed(1).replace('.0','')+' pp')+'</td><td class="v8680State"><span class="mdStatus31 '+statusClass(r)+'">'+esc(r.statusLabel)+'</span></td><td class="v8680Owner">'+esc(owner)+'</td></tr>'}).join('')+'</tbody></table></div>'+(rows.length>vis.length?'<div class="mdLoadMore8625"><span>Mostrando '+fi(vis.length)+' de '+fi(rows.length)+' productos</span><button onclick="V8680.more()">Mostrar más</button></div>':'');var b=document.getElementById('md-count-badge-8618');if(b)b.textContent=fi(rows.length)+' productos evaluados'}
function classRate(rows,key,cc){var a=rows.filter(function(r){return r.cc===cc&&['manage','comply','exceed','offer_covered'].indexOf(r.statusKey)>=0}),d=a.length||1,c=a.filter(function(r){return r.statusKey===key}).length;return c/d*100}
function summaryCard81(key,title,value,sub,theme,icon){return'<div class="kpi v8618Card '+theme+' v8681MetricCard" role="button" tabindex="0" onclick="V8694.status('+JSON.stringify(key)+')"><div class="top"><div class="ico '+(theme==='k-evac'?'i-evac':theme==='k-amb'?'i-amb':theme==='k-vta'?'i-vta':'i-rot')+'">'+icon+'</div><span class="v8618Arrow">Ver detalle →</span></div><div class="lab">'+esc(title)+'</div><div class="val">'+value+'</div><div class="sub">'+sub+'</div></div>'}
function statusMetric81(rows,key,title,theme){var valid=rows.filter(function(r){return['manage','comply','exceed','offer_covered'].indexOf(r.statusKey)>=0}),c=valid.filter(function(r){return r.statusKey===key}).length,p=valid.length?c/valid.length*100:0,core=classRate(rows,key,'CORE'),comp=classRate(rows,key,'COMPLEMENTO');return summaryCard81(key,title,p.toFixed(1)+'%',fi(c)+' productos · CORE '+core.toFixed(1)+'% · COMPLEMENTO '+comp.toFixed(1)+'%',theme,'%')}
function statusChart81(rows){var defs=[['manage','Gestionar','var(--bad)'],['offer_covered','Oferta cubre','var(--rot)'],['comply','Cumple','var(--ok)'],['exceed','Supera política','var(--amb)'],['review','Revisar dato','#d58d00'],['no_policy','Sin política','var(--mut)']],mx=Math.max.apply(null,defs.map(function(d){return rows.filter(function(r){return r.statusKey===d[0]}).length}).concat([1]));return'<div class="v8664MdStatus">'+defs.map(function(d){var c=rows.filter(function(r){return r.statusKey===d[0]}).length;return'<button class="v8664MdBar" onclick="V8694.status('+JSON.stringify(d[0])+')"><b>'+fi(c)+'</b><div class="v8664MdTrack"><i style="height:'+Math.max(c?4:0,c/mx*100)+'%;background:'+d[2]+'"></i></div><span>'+d[1]+'</span></button>'}).join('')+'</div>'}
function policyChart81(rows){var act=rows.filter(function(r){return r.statusKey==='manage'}),total=act.length||1;function units(a){return a.reduce(function(x,r){return x+n(r.stock)},0)}function list(cc,kind){return act.filter(function(r){var pol=norm(r.policyApplied);return r.cc===cc&&(kind==='rot'?pol.indexOf('ROT')>=0:pol.indexOf('EVAC')>=0)})}function card(cc,kind,label,cls){var a=list(cc,kind),pc=a.length/total*100;return'<button class="v8666PolicyCard v8681PolicyCard '+(cls||'')+'" onclick="V8694.policy('+JSON.stringify(cc)+','+JSON.stringify(kind)+')"><div class="v8666PolicyHead"><b>'+label+'</b><span>Ver productos →</span></div><div class="v8666PolicyNumbers"><div class="v8666PolicyNumber"><label>Productos</label><b>'+fi(a.length)+'</b></div><div class="v8666PolicyNumber"><label>Unidades</label><b>'+fi(units(a))+'</b></div><div class="v8666PolicyNumber"><label>Participación</label><b>'+pc.toFixed(1)+'%</b></div></div><div class="v8666PolicyTrack"><i style="width:'+pc+'%"></i></div></button>'}return'<div class="v8666PolicyGrid v8681PolicyGrid"><div class="v8681PolicyGroupLabel">CORE</div>'+card('CORE','rot','Rotación · CORE','')+card('CORE','evac','Evacuación · CORE','evac')+'<div class="v8681PolicyGroupLabel">COMPLEMENTO</div>'+card('COMPLEMENTO','rot','Rotación · COMPLEMENTO','')+card('COMPLEMENTO','evac','Evacuación · COMPLEMENTO','evac')+'</div><div class="dashboardNote">Participación calculada sobre el total de productos que requieren gestión de Markdown.</div>'}
function coreHtml(rows){return''}
function patchMarkdown(){if((typeof VIEW!=='undefined'?VIEW:'')!=='markdown')return;var content=document.getElementById('content');if(!content)return;var rows=correctedRows(CUR),valid=rows.filter(function(r){return['manage','comply','exceed','offer_covered'].indexOf(r.statusKey)>=0}),manage=rows.filter(function(r){return r.statusKey==='manage'}),units=manage.reduce(function(a,r){return a+n(r.stock)},0),comply=rows.filter(function(r){return r.statusKey==='comply'}).length,exceed=rows.filter(function(r){return r.statusKey==='exceed'}).length,compliance=valid.length?(comply+exceed)/valid.length*100:0;var summary=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Resumen de gestión'});if(summary){var grid=summary.querySelector('.v8618KpiGrid');if(grid){grid.className='v8618KpiGrid mdKpis8646 v8680SummaryGrid';grid.innerHTML=summaryCard81('manage','Productos a gestionar',fi(manage.length)+' productos · '+fi(units)+' unidades','Solo casos que requieren aumentar el descuento','k-evac','!')+statusMetric81(rows,'manage','% A gestionar','k-evac')+statusMetric81(rows,'comply','% Cumple política','k-amb')+statusMetric81(rows,'exceed','% Supera política','k-amb')+statusMetric81(rows,'offer_covered','% Oferta cubre','k-rot')}var rt=summary.querySelector('.rt');if(rt){rt.querySelectorAll('.v8662LeaderBtn,.v8664LeaderBtn').forEach(function(x){x.remove()});if(typeof IS_LEADER!=='undefined'&&IS_LEADER)rt.insertAdjacentHTML('beforeend',' <button class="v8664LeaderBtn" onclick="event.stopPropagation();openLeaderAll8664()">Todas las tiendas &gt;50%</button>');else if(typeof IS_ADMIN!=='undefined'&&IS_ADMIN)rt.insertAdjacentHTML('beforeend',' <button class="v8664LeaderBtn secondary" onclick="event.stopPropagation();exportAdmin8664()">Excel mi tienda</button>')}}content.querySelectorAll('.v8680CoreCard').forEach(function(x){x.remove()});var statusCard=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Estado actual vs. política'});if(statusCard){var sb=statusCard.querySelector('.cbody');if(sb)sb.innerHTML=statusChart81(rows)}var fg=content.querySelector('.v8618FilterGrid');if(fg&&!fg.querySelector('[data-v8680-class]')){var f=document.createElement('div');f.className='v8618Field';f.setAttribute('data-v8680-class','1');f.innerHTML='<label>Clasificación</label><select onchange="mdState8618.classification=this.value;mdState8618.policyGroup=\'all\';drawMarkdown8617()"><option value="all">Todos</option><option value="CORE">CORE</option><option value="COMPLEMENTO">COMPLEMENTO</option></select>';var clear=fg.querySelector('.v8618Clear');if(clear)fg.insertBefore(f,clear);else fg.appendChild(f)}var res=fg&&Array.from(fg.querySelectorAll('.v8618Field')).find(function(x){var l=x.querySelector('label');return l&&/Resultado/i.test(l.textContent||'')});if(res){var sel=res.querySelector('select');if(sel&&!sel.dataset.v8681){sel.dataset.v8681='1';sel.innerHTML='<option value="all">Todos</option><option value="manage">Gestionar descuento</option><option value="offer_covered">Oferta cubre</option><option value="comply">Cumple política</option><option value="exceed">Supera política</option><option value="review">Revisar dato</option><option value="no_policy">Sin política</option>';sel.value=mdState().card||'all';sel.onchange=function(){mdState().card=this.value;mdState().policyGroup='all';mdLimit=160;drawMarkdown8617()}}var classSel=fg.querySelector('[data-v8680-class] select');if(classSel)classSel.value=mdState().classification||'all'}var pol=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Productos a gestionar por política'});if(pol){var pb=pol.querySelector('.cbody');if(pb)pb.innerHTML=policyChart81(rows)}var age=Array.from(content.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Productos a gestionar por antigüedad'});if(age&&typeof mdAgeChart8646==='function'){var ab=age.querySelector('.cbody');if(ab)ab.innerHTML=mdAgeChart8646(rows)}renderTable();syncMarkdownCounts()}
function syncMarkdownCounts(){var nManage=correctedRows(CUR).filter(function(r){return r.statusKey==='manage'}).length,b=document.getElementById('nc-md');if(b)b.textContent=fi(nManage);var ctx=document.querySelector('.markdownContext8617 b');if(ctx)ctx.textContent=fi(nManage)+' productos con descuento por gestionar'}
function patchNovelModal(){var body=document.getElementById('rangeModalBody'),table=body&&body.querySelector('#v8664MixTable');if(!table)return;var box=body.querySelector('.v8680NovelToggle');if(!box){box=document.createElement('div');box.className='v8680NovelToggle';box.innerHTML='<button data-v="all">Todos O + T</button><button data-v="O">Solo O</button><button data-v="T">Solo T</button>';table.parentElement.insertBefore(box,table);box.querySelectorAll('button').forEach(function(b){b.onclick=function(){novelState=b.dataset.v;patchNovelModal()}})}Array.from(table.tBodies&&table.tBodies[0]?table.tBodies[0].rows:[]).forEach(function(tr){var c=s((tr.querySelector('.code')||{}).textContent).trim(),st=norm(prod(c).estado);tr.style.display=(novelState==='all'||st===novelState)?'':'none'});box.querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.v===novelState)})}
function historyDetails(){try{return JSON.parse((document.getElementById('embeddedHistory')||{}).textContent||'{}').details||[]}catch(_){return[]}}
function mapRows(arr){var m={};(arr||[]).forEach(function(r){var c=s(r&&r[0]);if(!c)return;if(!m[c])m[c]={u:0};m[c].u+=n(r&&r[1])});return m}
function patchTrackingProducts(){if((typeof VIEW!=='undefined'?VIEW:'')!=='resumen')return;var panel=document.getElementById('storeTrackingPanel');if(!panel)return;panel.querySelectorAll('.trackingNote').forEach(function(x){x.innerHTML=x.innerHTML.replace(/SKU/gi,'Producto')});var fs=panel.querySelector('[data-v8662-from]'),ts=panel.querySelector('[data-v8662-to]');if(!fs||!ts)return;var from=fs.value,to=ts.value,state='rot';var buttons=panel.querySelectorAll('.trackingControlGroup .trackBtn.on');buttons.forEach(function(b){if(/evac/i.test(b.textContent||''))state='evac'});var h=historyDetails(),a=h.find(function(x){return x.date===from}),b=h.find(function(x){return x.date===to});if(!a||!b)return;var am=mapRows(a.stores&&a.stores[CUR]&&a.stores[CUR][state]),bm=mapRows(b.stores&&b.stores[CUR]&&b.stores[CUR][state]),keys=Array.from(new Set(Object.keys(am).concat(Object.keys(bm))),function(x){return x}),initial=Object.keys(am).filter(function(c){return am[c].u>0}).length,final=Object.keys(bm).filter(function(c){return bm[c].u>0}).length,managed=keys.filter(function(c){return am[c]&&am[c].u>0&&(!bm[c]||bm[c].u<=0)}).length,partial=keys.filter(function(c){return am[c]&&bm[c]&&am[c].u>bm[c].u&&bm[c].u>0}).length,fresh=keys.filter(function(c){return(!am[c]||am[c].u<=0)&&bm[c]&&bm[c].u>0}).length,old=panel.querySelector('.v8680TrackProducts');if(old)old.remove();var anchor=panel.querySelector('.trackingDualSummary');if(anchor)anchor.insertAdjacentHTML('beforebegin','<div class="v8680TrackProducts"><div><label>Productos iniciales</label><b>'+fi(initial)+'</b><small>'+esc(fs.options[fs.selectedIndex]?fs.options[fs.selectedIndex].text:from)+'</small></div><div><label>Productos finales</label><b>'+fi(final)+'</b><small>'+esc(ts.options[ts.selectedIndex]?ts.options[ts.selectedIndex].text:to)+'</small></div><div><label>Productos gestionados</label><b>'+fi(managed)+'</b><small>Salieron completamente</small></div><div><label>Productos con reducción parcial</label><b>'+fi(partial)+'</b><small>Siguen con menos unidades</small></div><div><label>Productos nuevos</label><b>'+fi(fresh)+'</b><small>Ingresaron en el corte final</small></div></div>')}
var guideStateMap=null;function buildGuideMap(){if(guideStateMap)return guideStateMap;guideStateMap={};try{(DB.G||[]).forEach(function(g){var gm=guideStateMap[s(g[0])]||(guideStateMap[s(g[0])]={});(g[3]||[]).forEach(function(p){if(Array.isArray(p))gm[s(p[2])]=s(p[3]||'')})})}catch(_){}return guideStateMap}
function guideBadge(v){var t=s(v)||'Sin dato',c=norm(t).toLowerCase();return'<span class="v8680GuideState '+esc(c)+'">'+esc(t)+'</span>'}
function patchGuideStates(){var body=document.getElementById('guideDetailBodyV49');if(!body)return;var sub=document.getElementById('guideDetailSubV49'),gcode=s(sub&&sub.textContent).split(' · ')[0].trim(),gm=buildGuideMap()[gcode]||{};body.querySelectorAll('.guideFloorTableV50').forEach(function(tbl){var hr=tbl.tHead&&tbl.tHead.rows&&tbl.tHead.rows[0];if(hr&&!hr.querySelector('[data-v8680-guide-state]')){var th=document.createElement('th');th.textContent='Estado guía';th.setAttribute('data-v8680-guide-state','1');hr.appendChild(th)}Array.from(tbl.tBodies&&tbl.tBodies[0]?tbl.tBodies[0].rows:[]).forEach(function(tr){if(tr.children.length===1)return;var c=s((tr.querySelector('.code')||{}).textContent).trim(),td=tr.querySelector('[data-v8680-guide-state]');if(!td){td=document.createElement('td');td.setAttribute('data-v8680-guide-state','1');tr.appendChild(td)}td.innerHTML=guideBadge(gm[c]||'Sin dato')})})}
function buildTransferRows(){var rows=[];document.querySelectorAll('#rangeModalBody .v8667Delivery').forEach(function(sec){var id=s((sec.querySelector('.v8667DeliveryHead b')||{}).textContent).replace(/^\s*Entrega\s+/i,'').trim();sec.querySelectorAll('.v8667DecisionRow').forEach(function(row){var cb=row.querySelector('input[type=checkbox]'),c=s((row.querySelector('.code')||{}).textContent).trim(),name=s((row.querySelector('.name')||{}).textContent).trim();rows.push([id,c,name,cb&&cb.checked?'ENVIAR':'ELIMINAR'])})});return rows}
function b64(buf){var bytes=new Uint8Array(buf),bin='',chunk=0x8000;for(var i=0;i<bytes.length;i+=chunk)bin+=String.fromCharCode.apply(null,bytes.subarray(i,Math.min(i+chunk,bytes.length)));return btoa(bin).replace(/(.{76})/g,'$1\r\n')}
function emailJair(){var rows=buildTransferRows();if(!rows.length){if(typeof toast==='function')toast('No hay entregas pendientes para preparar.','err');return}var name=store(CUR).name||CUR,subject='Gestión de entregas pendientes – '+name,to='pilotocmo@jamar.com',file='Gestion_Entregas_Pendientes_'+name.replace(/[^A-Za-z0-9_-]+/g,'_')+'.xlsx';if(!window.XLSX){window.location.href='mailto:'+to+'?subject='+encodeURIComponent(subject);return}var data=[['ORDEN_ENTREGA','CODIGO_PRODUCTO','NOMBRE_PRODUCTO','ACCION']].concat(rows),wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(data);XLSX.utils.book_append_sheet(wb,ws,'Gestion traslados');var arr=XLSX.write(wb,{bookType:'xlsx',type:'array'}),boundary='----=_LLAVERO_'+Date.now(),sub='=?UTF-8?B?'+btoa(unescape(encodeURIComponent(subject)))+'?=',body='Adjunto gestión de entregas pendientes de '+name+'.\r\n',eml='To: '+to+'\r\nSubject: '+sub+'\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="'+boundary+'"\r\n\r\n--'+boundary+'\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n'+body+'\r\n--'+boundary+'\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; name="'+file+'"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename="'+file+'"\r\n\r\n'+b64(arr)+'\r\n--'+boundary+'--\r\n',blob=new Blob([eml],{type:'message/rfc822'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Correo_Gestion_Entregas_'+name.replace(/[^A-Za-z0-9_-]+/g,'_')+'.eml';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},800)}
function patchTransferButton(){var btn=Array.from(document.querySelectorAll('#rangeModalBody .v8667TransferFooter button')).find(function(b){return/Preparar correo/i.test(b.textContent||'')});if(btn){btn.textContent='Preparar correo';btn.onclick=emailJair}}
function mark(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='13/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 13/08/2026 · '+VERSION}catch(_){}}
function patch(){patchMarkdown();patchTrackingProducts();patchGuideStates();patchTransferButton();mark()}
window.V8681={toggle:toggleProduct,selectVisible:selectVisibleOnly,more:function(){mdLimit+=160;renderTable()},status:function(v){mdState().card=v||'all';mdState().classification='all';mdState().policyGroup='all';mdLimit=160;drawMarkdown8617()},policy:function(cc,kind){mdState().card='manage';mdState().classification=cc;mdState().policyGroup=kind;mdLimit=160;drawMarkdown8617()}};window.V8680=window.V8681;
function install(){if(installed)return;if(!window.__LLAVERO_BOOTSTRAPPED__||typeof window.mdRows8664!=='function'||typeof window.setView!=='function'||typeof window.openTransferDecisions8667!=='function'||typeof window.setTrackDate8662!=='function'){setTimeout(install,120);return}installed=true;baseRows=window.mdRows8664;window.mdRows8664=window.mdRows8662=window.mdRows8618=correctedRows;if(typeof window.clearMarkdownFilters8618==='function'&&!window.clearMarkdownFilters8618.__v8681){var _clear81=window.clearMarkdownFilters8618;window.clearMarkdownFilters8618=function(){mdState().classification='all';mdState().policyGroup='all';return _clear81.apply(this,arguments)};window.clearMarkdownFilters8618.__v8681=true;}syncInvalidSelections();if(window.V8623)window.V8623.selectVisible=selectVisibleOnly;var sv=window.setView,rf=window.refresh,dm=window.drawMarkdown8617,oc=window.openComposition8664,og=window.openGuideDetailV49,rd=window.renderGuideDetailV49,ot=window.openTransferDecisions8667||window.openTransferDecisions8666,qt=window.quickTrack8662,sd=window.setTrackDate8662,ss=window.setTrackState8662,sm=window.setTrackMetric8662;if(typeof sv==='function')window.setView=function(){var o=sv.apply(this,arguments);setTimeout(patch,180);return o};if(typeof rf==='function')window.refresh=function(){var o=rf.apply(this,arguments);setTimeout(patch,180);return o};if(typeof dm==='function')window.drawMarkdown8617=function(){var o=dm.apply(this,arguments);setTimeout(patchMarkdown,80);return o};if(typeof oc==='function')window.openComposition8664=function(){var o=oc.apply(this,arguments);if(arguments[0]==='novel'){novelState='all';setTimeout(patchNovelModal,25)}return o};if(typeof og==='function')window.openGuideDetailV49=function(){var o=og.apply(this,arguments);setTimeout(patchGuideStates,25);return o};if(typeof rd==='function')window.renderGuideDetailV49=function(){var o=rd.apply(this,arguments);setTimeout(patchGuideStates,15);return o};if(typeof ot==='function'){var w=function(){var o=ot.apply(this,arguments);setTimeout(patchTransferButton,25);return o};window.openTransferDecisions8667=window.openTransferDecisions8666=w}if(typeof qt==='function')window.quickTrack8662=function(){var o=qt.apply(this,arguments);setTimeout(patchTrackingProducts,20);return o};if(typeof sd==='function')window.setTrackDate8662=function(){var o=sd.apply(this,arguments);setTimeout(patchTrackingProducts,20);return o};if(typeof ss==='function')window.setTrackState8662=function(){var o=ss.apply(this,arguments);setTimeout(patchTrackingProducts,20);return o};if(typeof sm==='function')window.setTrackMetric8662=function(){var o=sm.apply(this,arguments);setTimeout(patchTrackingProducts,20);return o};setTimeout(patch,220);console.info('LLAVERO V86.82 · Markdown final estable; parches anteriores de Markdown neutralizados')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,420)},{once:true});
})();


/* ==== llaveroV8684PointScript ==== */

(function(){
'use strict';
var installed=false, TO='pilotocmo@jamar.com';
function s(v){return v==null?'':String(v)}
function n(v){var x=Number(v);return Number.isFinite(x)?x:0}
function esc(v){return s(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fi(v){try{return typeof fInt==='function'?fInt(n(v)):Math.round(n(v)).toLocaleString('es-CO')}catch(_){return String(Math.round(n(v)))}}
function pct(v){if(v===null||v===undefined||v==='')return'—';var x=Number(v);return Number.isFinite(x)?x.toFixed(1).replace('.0','')+'%':'—'}
function currentRows(){try{return typeof window.mdRows8664==='function'?window.mdRows8664(CUR):typeof window.mdRows8618==='function'?window.mdRows8618(CUR):[]}catch(_){return[]}}
function storeName(){try{return (S&&S[CUR]&&S[CUR].name)||CUR}catch(_){return CUR}}
function productImage(c){try{return typeof imageThumb==='function'?imageThumb(c,'sm'):''}catch(_){return''}}
function removeDiagnostic(){if((typeof VIEW!=='undefined'?VIEW:'')!=='markdown')return;var root=document.getElementById('content');if(!root)return;Array.from(root.querySelectorAll('.card')).forEach(function(card){var tt=card.querySelector('.tt');if(tt&&tt.textContent.trim()==='Diagnóstico y gestión de Markdown')card.remove()})}
function detailConfig(label){
  if(label==='Productos a gestionar'||label==='% A gestionar')return{title:'Productos a gestionar',keys:['manage']};
  if(label==='Cumplimiento de política')return{title:'Cumplimiento de política',keys:['comply','exceed']};
  if(label==='% Cumple política')return{title:'Productos que cumplen política',keys:['comply']};
  if(label==='% Supera política')return{title:'Productos que superan política',keys:['exceed']};
  if(label==='% Oferta cubre')return{title:'Productos donde la oferta cubre la política',keys:['offer_covered']};
  return null;
}
function openDetail(label){
  var cfg=detailConfig(label);if(!cfg)return;
  var rows=currentRows().filter(function(r){return cfg.keys.indexOf(r.statusKey)>=0});
  var units=rows.reduce(function(a,r){return a+n(r.stock)},0),core=rows.filter(function(r){return r.cc==='CORE'}).length,comp=rows.filter(function(r){return r.cc==='COMPLEMENTO'}).length;
  var modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle');if(!modal||!body)return;
  modal.classList.add('v8664Wide');if(tt)tt.textContent='Markdown · '+cfg.title;if(ss)ss.textContent=storeName()+' · '+fi(rows.length)+' productos';
  var tr=rows.map(function(r){return '<tr data-v8684-code="'+esc(r.code)+'"><td>'+productImage(r.code)+'</td><td><span class="code">'+esc(r.code)+'</span></td><td class="prod"><b>'+esc(r.name)+'</b><small>'+esc([r.category,r.line,r.subline].filter(Boolean).join(' · '))+'</small></td><td>'+esc(r.cc||'—')+'</td><td class="num"><b>'+fi(r.stock)+'</b></td><td>'+esc(r.ageLabel||'—')+'</td><td>'+esc(r.policyApplied||'—')+'<br><small>'+esc(r.ruleApplied||'')+'</small></td><td class="num">'+pct(r.systemOfferDiscount)+'</td><td class="num">'+pct(r.currentDiscount)+'</td><td class="num"><b>'+pct(r.discount)+'</b></td><td>'+esc(r.statusLabel||'—')+'</td></tr>'}).join('');
  body.innerHTML='<div class="v8684DetailSummary"><div class="v8684DetailKpi"><label>Productos</label><b>'+fi(rows.length)+'</b></div><div class="v8684DetailKpi"><label>Unidades</label><b>'+fi(units)+'</b></div><div class="v8684DetailKpi"><label>CORE</label><b>'+fi(core)+'</b></div><div class="v8684DetailKpi"><label>COMPLEMENTO</label><b>'+fi(comp)+'</b></div></div><div class="v8684DetailWrap"><table class="v8684DetailTable"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Clasificación</th><th class="num">Stock</th><th>Antigüedad</th><th>Política / regla</th><th class="num">Oferta</th><th class="num">Muestra</th><th class="num">Sugerido</th><th>Estado</th></tr></thead><tbody>'+(tr||'<tr><td colspan="11">No hay productos para este indicador.</td></tr>')+'</tbody></table></div>';
  body.querySelectorAll('tr[data-v8684-code]').forEach(function(row){row.onclick=function(){if(typeof window.openMdProduct8664==='function')window.openMdProduct8664(row.dataset.v8684Code)}});
  modal.classList.add('on');
}
function wireSummaryCards(){
  if((typeof VIEW!=='undefined'?VIEW:'')!=='markdown')return;var root=document.getElementById('content');if(!root)return;var summary=Array.from(root.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&t.textContent.trim()==='Resumen de gestión'});if(!summary)return;
  summary.querySelectorAll('.v8618Card,.kpi').forEach(function(card){var lab=card.querySelector('.lab'),label=lab&&lab.textContent.trim(),cfg=detailConfig(label);if(!cfg)return;card.onclick=function(ev){if(ev)ev.stopPropagation();openDetail(label)};card.onkeydown=function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();openDetail(label)}};card.style.cursor='pointer';});
}
function afterMarkdown(){removeDiagnostic();wireSummaryCards()}
function transferRows(){var out=[];document.querySelectorAll('#rangeModalBody .v8667Delivery').forEach(function(sec){var id=s((sec.querySelector('.v8667DeliveryHead b')||{}).textContent).replace(/^\s*Entrega\s+/i,'').trim();sec.querySelectorAll('.v8667DecisionRow').forEach(function(row){var cb=row.querySelector('input[type=checkbox]'),code=s((row.querySelector('.code')||{}).textContent).trim(),name=s((row.querySelector('.name')||{}).textContent).trim();out.push({delivery:id,code:code,name:name,action:cb&&cb.checked?'ENVIAR':'ELIMINAR'})})});return out}
function b64(buffer){var bytes=new Uint8Array(buffer),bin='',chunk=0x8000;for(var i=0;i<bytes.length;i+=chunk)bin+=String.fromCharCode.apply(null,bytes.subarray(i,Math.min(i+chunk,bytes.length)));return btoa(bin).replace(/(.{76})/g,'$1\r\n')}
function prepareMail(){
  var rows=transferRows();if(!rows.length){if(typeof toast==='function')toast('No hay entregas pendientes para preparar.','err');return}
  var send=rows.filter(function(r){return r.action==='ENVIAR'}).length,del=rows.length-send,name=storeName(),subject='Gestión de traslados pendientes · '+name,bodyText='Adjunto reporte de gestión de entregas pendientes.\r\n\r\nENVIAR: '+send+' productos\r\nELIMINAR: '+del+' productos\r\n\r\nEl Excel fue generado para adjuntarlo.';
  if(!window.XLSX){window.location.href='mailto:'+TO+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(bodyText);return}
  var data=[['ORDEN_ENTREGA','CODIGO_PRODUCTO','NOMBRE_PRODUCTO','ACCION']].concat(rows.map(function(r){return[r.delivery,r.code,r.name,r.action]}));
  var wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(data);ws['!cols']=[{wch:20},{wch:18},{wch:56},{wch:14}];XLSX.utils.book_append_sheet(wb,ws,'Gestion traslados');
  var arr=XLSX.write(wb,{bookType:'xlsx',type:'array'}),file='Gestion_Traslados_'+CUR+'_'+s(DB&&DB.meta&&DB.meta.fecha||'corte')+'.xlsx',boundary='----=_LLAVERO_'+Date.now(),encodedSubject='=?UTF-8?B?'+btoa(unescape(encodeURIComponent(subject)))+'?=';
  var eml='To: '+TO+'\r\nSubject: '+encodedSubject+'\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="'+boundary+'"\r\n\r\n--'+boundary+'\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n'+bodyText+'\r\n\r\n--'+boundary+'\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; name="'+file+'"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename="'+file+'"\r\n\r\n'+b64(arr)+'\r\n--'+boundary+'--\r\n';
  var blob=new Blob([eml],{type:'message/rfc822'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Gestion_de_traslados_pendientes_'+name.replace(/[^A-Za-z0-9_-]+/g,'_')+'.eml';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
  if(typeof toast==='function')toast('Correo preparado para '+TO+' con el Excel adjunto.','ok');
}
function patchTransferButton(){var btn=Array.from(document.querySelectorAll('#rangeModalBody .v8667TransferFooter button')).find(function(b){return/Preparar correo/i.test(b.textContent||'')});if(btn){btn.textContent='Preparar correo';btn.onclick=prepareMail}}
function install(){
  if(installed)return;if(!window.__LLAVERO_BOOTSTRAPPED__||typeof window.drawMarkdown8617!=='function'||typeof window.setView!=='function'||typeof window.openTransferDecisions8667!=='function'){setTimeout(install,120);return}installed=true;
  var dm=window.drawMarkdown8617,sv=window.setView,ot=window.openTransferDecisions8667;
  window.drawMarkdown8617=function(){var o=dm.apply(this,arguments);setTimeout(afterMarkdown,130);return o};
  window.setView=function(){var o=sv.apply(this,arguments);setTimeout(afterMarkdown,260);return o};
  var w=function(){var o=ot.apply(this,arguments);setTimeout(patchTransferButton,40);return o};window.openTransferDecisions8667=window.openTransferDecisions8666=w;
  window.emailTransferDecisions8667=prepareMail;
  setTimeout(afterMarkdown,260);
  console.info('LLAVERO V86.84 · ajustes puntuales aplicados sobre V86.82');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,80)},{once:true});
})();


/* ==== llaveroV8686PointScript ==== */

(function(){
'use strict';
var installed=false, TO='pilotocmo@jamar.com';
function s(v){return v==null?'':String(v)}
function n(v){var x=Number(v);return Number.isFinite(x)?x:0}
function esc(v){return s(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fi(v){try{return typeof fInt==='function'?fInt(n(v)):Math.round(n(v)).toLocaleString('es-CO')}catch(_){return String(Math.round(n(v)))}}
function money(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(n(v)):'$ '+Math.round(n(v)).toLocaleString('es-CO')}catch(_){return '$ '+Math.round(n(v)).toLocaleString('es-CO')}}
function storeName(){try{return (S&&S[CUR]&&S[CUR].name)||CUR}catch(_){return CUR}}
function cutDate(){try{return s(DB&&DB.meta&&DB.meta.fecha||'SIN_CORTE')}catch(_){return'SIN_CORTE'}}
function storageKey(){return 'llavero_markdown_gestion_v8623_'+cutDate().replace(/[^0-9A-Za-z_-]+/g,'_')}
function readMem(){try{var x=JSON.parse(localStorage.getItem(storageKey())||'{"items":{}}');if(!x||!x.items)x={items:{}};return x}catch(_){return{items:{}}}}
function writeMem(m){try{localStorage.setItem(storageKey(),JSON.stringify(m))}catch(_){}updateBar()}
function itemKey(sc,c){return s(sc)+'|'+s(c)}
function finalRows(sc){try{return typeof window.mdRows8664==='function'?window.mdRows8664(sc||CUR):typeof window.mdRows8618==='function'?window.mdRows8618(sc||CUR):[]}catch(_){return[]}}
function rowBy(sc,c){c=s(c);return finalRows(sc).find(function(r){return s(r.code)===c})||null}
function selectedRecords(){var m=readMem(),out=[];Object.keys(m.items||{}).forEach(function(k){var p=k.split('|'),sc=p.shift(),c=p.join('|'),r=rowBy(sc,c);if(!r||r.statusKey!=='manage')return;var it=m.items[k]||{};r=Object.assign({},r);r.storeCode=sc;r.storeName=(S&&S[sc]&&S[sc].name)||sc;r.requestedDiscount=n(it.requestedDiscount||r.discount);r.note=s(it.note||'');r.responsible=r.requestedDiscount>50?'Líder de Área':'Administrador';out.push(r)});return out}
function totals(rs){rs=rs||selectedRecords();var units=rs.reduce(function(a,r){return a+n(r.stock)},0),admin=rs.filter(function(r){return n(r.requestedDiscount)<=50}).length;return{count:rs.length,units:units,admin:admin,leader:rs.length-admin}}
function updateBar(){var t=totals(),a=document.getElementById('v8623SelCount'),b=document.getElementById('v8623AdminCount'),c=document.getElementById('v8623LeaderCount');if(a)a.textContent=fi(t.count)+' seleccionados · '+fi(t.units)+' u';if(b)b.textContent=fi(t.admin)+' Administrador';if(c)c.textContent=fi(t.leader)+' Líder';['v8623ViewBtn','v8623ExcelBtn','v8623ManagementExcelBtn','v8623PdfBtn','v8623ClearBtn','v8623ModalExcelBtn','v8623ModalPdfBtn'].forEach(function(id){var el=document.getElementById(id);if(el)el.disabled=!t.count})}
function setSelected(sc,c,on){var r=rowBy(sc,c);if(!r||r.statusKey!=='manage')return false;var m=readMem(),k=itemKey(sc,c);if(on){var old=m.items[k]||{};m.items[k]={storeCode:sc,code:s(c),requestedDiscount:n(old.requestedDiscount||r.discount),note:s(old.note||'')}}else delete m.items[k];writeMem(m);return true}
function toggle(code,on){setSelected(CUR,code,on);updateBar()}
function visibleRows(){var table=document.querySelector('#markdown-table-8618 table.v8680MarkdownTable');if(!table)return[];return Array.from(table.querySelectorAll('tbody tr[data-md-product]')).map(function(tr){return{tr:tr,code:s(tr.dataset.mdProduct),cb:tr.querySelector('input[type=checkbox]')}})}
function selectVisible(on){var m=readMem();visibleRows().forEach(function(x){if(!x.cb||x.cb.disabled)return;var r=rowBy(CUR,x.code);if(!r||r.statusKey!=='manage')return;var k=itemKey(CUR,x.code);if(on){var old=m.items[k]||{};m.items[k]={storeCode:CUR,code:s(x.code),requestedDiscount:n(old.requestedDiscount||r.discount),note:s(old.note||'')}}else delete m.items[k];x.cb.checked=on});writeMem(m)}
function clearSelection(){writeMem({items:{}});visibleRows().forEach(function(x){if(x.cb)x.cb.checked=false});updateBar();renderManager()}
function ensureManager(){var modal=document.getElementById('v8623MarkdownManageModal');if(modal)return modal;var wrap=document.createElement('div');wrap.id='v8623MarkdownManageModal';wrap.className='modalBack';wrap.innerHTML='<div class="modal v8623ManageModal" role="dialog" aria-modal="true"><div class="modalHead"><div><h3>Lista de gestión Markdown</h3><p>Productos seleccionados para la gestión.</p></div><button class="modalClose" type="button" onclick="V8623.closeManager()">×</button></div><div class="modalBody v8623ManageModalBody" id="v8623ManagerBody"></div><div class="modalFoot"><button class="btn danger" type="button" onclick="V8623.clearAll()">Limpiar lista</button><button class="btn ghost" type="button" onclick="V8623.closeManager()">Cerrar</button><button class="btn primary" id="v8623ModalExcelBtn" type="button" onclick="V8623.downloadExcel()">Descargar Excel</button><button class="btn ghost" id="v8623ModalPdfBtn" type="button" onclick="V8623.downloadPdf()">Descargar PDF</button></div></div>';document.body.appendChild(wrap);wrap.addEventListener('click',function(e){if(e.target===wrap)closeManager()});return wrap}
function renderManager(){var body=document.getElementById('v8623ManagerBody');if(!body)return;var rs=selectedRecords(),t=totals(rs);if(!rs.length){body.innerHTML='<div class="v8623Empty"><b>No hay productos en la lista de gestión.</b><div style="margin-top:5px">Selecciona productos desde la tabla de Markdown.</div></div>';return}body.innerHTML='<div class="v8686SelectedSummary"><div><label>Productos</label><b>'+fi(t.count)+'</b></div><div><label>Unidades</label><b>'+fi(t.units)+'</b></div><div><label>Administrador</label><b>'+fi(t.admin)+'</b></div><div><label>Líder</label><b>'+fi(t.leader)+'</b></div></div><div class="twrap"><table class="v8686SelectedTable"><thead><tr><th>Código</th><th>Producto</th><th>Responsable</th><th class="num">Sugerido</th><th>Acción</th></tr></thead><tbody>'+rs.map(function(r){return'<tr><td><span class="code">'+esc(r.code)+'</span></td><td><b>'+esc(r.name)+'</b></td><td>'+esc(r.responsible)+'</td><td class="num"><b>'+fi(r.requestedDiscount)+'%</b></td><td><button class="remove" onclick="V8686Selection.remove('+JSON.stringify(r.storeCode)+','+JSON.stringify(r.code)+')">Quitar</button></td></tr>'}).join('')+'</tbody></table></div>'}
function openManager(){var m=ensureManager();renderManager();m.classList.add('on');updateBar()}
function closeManager(){var m=document.getElementById('v8623MarkdownManageModal');if(m)m.classList.remove('on')}
function excelObservation(r){return 'Markdown · '+s(r.policyApplied||'')+' · '+s(r.ruleApplied||'')+' · muestra '+(r.currentDiscount==null?'—':r.currentDiscount+'%')+' · sugerido '+n(r.requestedDiscount)+'%'}
function ensureXlsx(){return new Promise(function(resolve,reject){if(window.XLSX)return resolve(window.XLSX);var old=document.querySelector('script[data-v8623-xlsx]');if(old){var tries=0,t=setInterval(function(){tries++;if(window.XLSX){clearInterval(t);resolve(window.XLSX)}else if(tries>80){clearInterval(t);reject(new Error('Motor Excel no disponible'))}},100);return}var sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';sc.async=true;sc.setAttribute('data-v8623-xlsx','1');sc.onload=function(){window.XLSX?resolve(window.XLSX):reject(new Error('Motor Excel no disponible'))};sc.onerror=function(){reject(new Error('No fue posible cargar el motor Excel'))};document.head.appendChild(sc)})}
async function downloadExcel(){var rs=selectedRecords();if(!rs.length){if(typeof toast==='function')toast('Selecciona al menos un producto para generar el Excel.','err');return}try{var X=await ensureXlsx(),rows=[['AGENCIA','COD','DCTO_LISTA','OBSERVACION']];rs.forEach(function(r){rows.push([s(r.storeCode),s(r.code),Math.round(n(r.requestedDiscount)),excelObservation(r)])});var ws=X.utils.aoa_to_sheet(rows);ws['!cols']=[{wch:13},{wch:16},{wch:14},{wch:95}];var wb=X.utils.book_new();X.utils.book_append_sheet(wb,ws,'Plantilla');X.writeFile(wb,'plantilla_cargue_masivo_Markdown_'+new Date().toISOString().slice(0,10)+'.xlsx',{compression:true});if(typeof toast==='function')toast('Excel generado con '+rs.length+' producto(s).','ok')}catch(err){if(typeof toast==='function')toast('No fue posible generar el Excel.','err')}}
async function downloadManagementExcel(){
  var rs=selectedRecords();if(!rs.length){if(typeof toast==='function')toast('Selecciona al menos un producto para generar el Excel de gestión.','err');return}
  try{
    var X=await ensureXlsx();
    var header=['Foto','Código','Nombre','Tienda','Categoría','Línea','Sublínea','Antigüedad','Clasificación','Precio lista','Precio oferta','Descuento oferta (%)','Descuento actual/muestra (%)','Descuento sugerido (%)','Estado','Acción'];
    var aoa=[header];
    rs.forEach(function(r){
      var d=null;try{d=typeof discountActual18==='function'?discountActual18(r.storeCode,r.code):null;}catch(_){}
      aoa.push([
        typeof productImageUrl==='function'?(productImageUrl(r.code)||''):'',
        s(r.code),
        s(r.name),
        s(r.storeName||r.storeCode),
        s(r.category||'—'),
        s(r.line||'—'),
        s(r.subline||'—'),
        s(r.ageLabel||'—'),
        s(r.cc||'—'),
        r.priceList!=null?n(r.priceList):(d&&d.precioLista!=null?n(d.precioLista):null),
        d&&d.precioOferta!=null?n(d.precioOferta):null,
        r.systemOfferDiscount!=null?n(r.systemOfferDiscount)/100:(d&&d.descuentoOfertaSistema!=null?n(d.descuentoOfertaSistema)/100:null),
        r.currentDiscount!=null?n(r.currentDiscount)/100:null,
        n(r.requestedDiscount)/100,
        s(r.statusLabel||'—'),
        s(r.actionText||r.reason||'—')
      ]);
    });
    var ws=X.utils.aoa_to_sheet(aoa);
    ws['!cols']=[{wch:12},{wch:14},{wch:38},{wch:18},{wch:16},{wch:16},{wch:16},{wch:14},{wch:18},{wch:13},{wch:13},{wch:14},{wch:16},{wch:14},{wch:20},{wch:44}];
    ws['!rows']=[{hpt:22}].concat(rs.map(function(){return{hpt:18};}));
    var priceCols=[9,10],pctCols=[11,12,13];
    for(var ri=1;ri<=rs.length;ri++){
      priceCols.forEach(function(ci){var addr=X.utils.encode_cell({r:ri,c:ci}),cell=ws[addr];if(cell&&typeof cell.v==='number')cell.z='"$"#,##0';});
      pctCols.forEach(function(ci){var addr=X.utils.encode_cell({r:ri,c:ci}),cell=ws[addr];if(cell&&typeof cell.v==='number')cell.z='0.0%';});
    }
    var range=X.utils.decode_range(ws['!ref']);ws['!autofilter']={ref:X.utils.encode_range({s:{r:0,c:0},e:{r:0,c:range.e.c}})};
    ws['!freeze']={xSplit:0,ySplit:1,topLeftCell:'A2',activePane:'bottomLeft',state:'frozen'};
    if(!ws['!margins'])ws['!margins']={left:0.3,right:0.3,top:0.4,bottom:0.4,header:0.2,footer:0.2};
    var wb=X.utils.book_new();X.utils.book_append_sheet(wb,ws,'Gestión Markdown');
    X.writeFile(wb,'Excel_gestion_Markdown_'+new Date().toISOString().slice(0,10)+'.xlsx',{compression:true});
    if(typeof toast==='function')toast('Excel de gestión generado con '+rs.length+' producto(s). La columna Foto incluye el enlace a la imagen (esta versión de la librería no permite incrustar la imagen directamente en la celda).','ok');
  }catch(err){if(typeof toast==='function')toast('No fue posible generar el Excel de gestión.','err');console.error('Excel de gestión Markdown',err);}
}
function downloadPdf(){var rs=selectedRecords();if(!rs.length){if(typeof toast==='function')toast('Selecciona al menos un producto para generar el PDF.','err');return}var w=window.open('','_blank');if(!w){alert('Habilita ventanas emergentes para generar el PDF.');return}var t=totals(rs);w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Gestión Markdown</title><style>@page{size:A4;margin:12mm}body{font:12px Arial;color:#24364b}h1{color:#173b63}.sum{display:flex;gap:8px;margin:12px 0}.sum div{border:1px solid #ddd;border-radius:8px;padding:8px 12px}.p{border:1px solid #ddd;border-left:4px solid #159f70;border-radius:8px;padding:9px;margin:8px 0;break-inside:avoid}.p.leader{border-left-color:#d91515}.meta{color:#6d7886;font-size:11px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}.grid span{background:#f5f7fb;padding:6px;border-radius:6px}</style></head><body><h1>Lista de gestión Markdown</h1><p>Corte '+esc(cutDate())+' · '+esc(storeName())+'</p><div class="sum"><div>Productos<br><b>'+fi(t.count)+'</b></div><div>Unidades<br><b>'+fi(t.units)+'</b></div><div>Administrador<br><b>'+fi(t.admin)+'</b></div><div>Líder<br><b>'+fi(t.leader)+'</b></div></div>'+rs.map(function(r){return'<section class="p '+(n(r.requestedDiscount)>50?'leader':'')+'"><b>'+esc(r.name)+'</b><div class="meta">'+esc(r.code)+' · '+esc(r.storeName)+'</div><div class="grid"><span>Stock<br><b>'+fi(r.stock)+'</b></span><span>Muestra<br><b>'+(r.currentDiscount==null?'—':r.currentDiscount+'%')+'</b></span><span>Sugerido<br><b>'+fi(r.requestedDiscount)+'%</b></span><span>Responsable<br><b>'+esc(r.responsible)+'</b></span></div></section>'}).join('')+'<script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>');w.document.close()}
function clearFiltersOnly(){window.mdState8618=window.mdState8618||{};Object.assign(window.mdState8618,{q:'',card:'all',type:'all',age:'all',discount:'all',responsible:'all',classification:'all',policyGroup:'all'});var c=document.getElementById('content');if(c&&typeof window.viewMarkdown8617==='function'&&typeof window.drawMarkdown8617==='function'){c.innerHTML=window.viewMarkdown8617();window.drawMarkdown8617();setTimeout(function(){patchSelectionBindings();updateBar()},120)}}
function patchSelectionBindings(){if((typeof VIEW!=='undefined'?VIEW:'')!=='markdown')return;var table=document.querySelector('#markdown-table-8618 table.v8680MarkdownTable');if(!table)return;var mem=readMem();table.querySelectorAll('tbody tr[data-md-product]').forEach(function(tr){var cb=tr.querySelector('.v8680Sel input[type=checkbox]');if(!cb)return;var code=s(tr.dataset.mdProduct);cb.checked=!!(mem.items&&mem.items[itemKey(CUR,code)]);cb.onchange=function(e){e.stopPropagation();toggle(code,this.checked)}});updateBar()}
function transferRows(){var out=[];document.querySelectorAll('#rangeModalBody .v8667Delivery').forEach(function(sec){var id=s((sec.querySelector('.v8667DeliveryHead b')||{}).textContent).replace(/^\s*Entrega\s+/i,'').trim();sec.querySelectorAll('.v8667DecisionRow').forEach(function(row){var cb=row.querySelector('input[type=checkbox]'),code=s((row.querySelector('.code')||{}).textContent).trim(),name=s((row.querySelector('.name')||{}).textContent).trim();out.push({delivery:id,code:code,name:name,action:cb&&cb.checked?'ENVIAR':'ELIMINAR'})})});return out}
function b64(buffer){var bytes=new Uint8Array(buffer),bin='',chunk=0x8000;for(var i=0;i<bytes.length;i+=chunk)bin+=String.fromCharCode.apply(null,bytes.subarray(i,Math.min(i+chunk,bytes.length)));return btoa(bin).replace(/(.{76})/g,'$1\r\n')}
async function prepareMail(){var rows=transferRows();if(!rows.length){if(typeof toast==='function')toast('No hay entregas pendientes para preparar.','err');return}var send=rows.filter(function(r){return r.action==='ENVIAR'}).length,del=rows.length-send,name=storeName(),subject='Gestión de traslados pendientes · '+name,rawDate=cutDate(),parts=s(rawDate).slice(0,10).split('-'),mailDate=parts.length===3?parts[2]+'/'+parts[1]+'/'+parts[0]:s(rawDate),bodyText='Adjunto reporte de gestión de entregas pendientes ('+name+') y ('+mailDate+').\r\n\r\nENVIAR: '+send+' productos\r\nELIMINAR: '+del+' productos';try{var X=await ensureXlsx(),data=[['ORDEN_ENTREGA','CODIGO_PRODUCTO','NOMBRE_PRODUCTO','ACCION']].concat(rows.map(function(r){return[r.delivery,r.code,r.name,r.action]})),wb=X.utils.book_new(),ws=X.utils.aoa_to_sheet(data);ws['!cols']=[{wch:20},{wch:18},{wch:56},{wch:14}];X.utils.book_append_sheet(wb,ws,'Gestion traslados');var arr=X.write(wb,{bookType:'xlsx',type:'array'}),file='Gestion_Traslados_'+CUR+'_'+cutDate()+'.xlsx',boundary='----=_LLAVERO_'+Date.now(),encodedSubject='=?UTF-8?B?'+btoa(unescape(encodeURIComponent(subject)))+'?=',eml='X-Unsent: 1\r\nTo: '+TO+'\r\nSubject: '+encodedSubject+'\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="'+boundary+'"\r\n\r\n--'+boundary+'\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n'+bodyText+'\r\n\r\n--'+boundary+'\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; name="'+file+'"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename="'+file+'"\r\n\r\n'+b64(arr)+'\r\n--'+boundary+'--\r\n',blob=new Blob([eml],{type:'message/rfc822'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Gestion_de_traslados_pendientes_'+name.replace(/[^A-Za-z0-9_-]+/g,'_')+'.eml';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},1000);if(typeof toast==='function')toast('Borrador preparado para '+TO+' con el Excel adjunto.','ok')}catch(err){if(typeof toast==='function')toast('No fue posible preparar el correo con el adjunto.','err')}}
function patchTransfer(){var btn=Array.from(document.querySelectorAll('#rangeModalBody .v8667TransferFooter button')).find(function(b){return/Preparar correo/i.test(b.textContent||'')});if(btn){btn.textContent='Preparar correo';btn.onclick=prepareMail}}
function install(){if(installed)return;if(!window.__LLAVERO_BOOTSTRAPPED__||!window.V8623||!window.V8680||typeof window.drawMarkdown8617!=='function'||typeof window.openTransferDecisions8667!=='function'){setTimeout(install,120);return}installed=true;
  window.V8686Selection={remove:function(sc,c){setSelected(sc,c,false);patchSelectionBindings();renderManager()}};
  V8680.toggle=toggle;V8680.selectVisible=selectVisible;
  V8623.add=function(sc,c){return setSelected(sc,c,true)};V8623.remove=function(sc,c){setSelected(sc,c,false);patchSelectionBindings();renderManager()};V8623.clearAll=clearSelection;V8623.selectVisible=selectVisible;V8623.openManager=openManager;V8623.closeManager=closeManager;V8623.downloadExcel=downloadExcel;V8623.downloadPdf=downloadPdf;V8623.downloadManagementExcel=downloadManagementExcel;V8623.render=renderManager;V8623.updateBar=updateBar;
  window.clearMarkdownFilters8618=clearFiltersOnly;
  var dm=window.drawMarkdown8617,sv=window.setView,ot=window.openTransferDecisions8667;
  window.drawMarkdown8617=function(){var o=dm.apply(this,arguments);setTimeout(patchSelectionBindings,120);return o};
  window.setView=function(){var o=sv.apply(this,arguments);setTimeout(function(){patchSelectionBindings();updateBar()},220);return o};
  var ow=function(){var o=ot.apply(this,arguments);setTimeout(patchTransfer,40);return o};window.openTransferDecisions8667=window.openTransferDecisions8666=ow;window.emailTransferDecisions8667=prepareMail;
  setTimeout(function(){patchSelectionBindings();updateBar()},260);
  console.info('LLAVERO V86.87 · ajustes acordados sobre V86.86');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,80)},{once:true});
})();


/* ==== llaveroV8688PreviewScript ==== */

(function(){
  'use strict';
  var VERSION='V86.88 PREVIEW';
  var installed=false;
  function text(el){return (el&&el.textContent||'').trim();}
  function titleOf(card){var t=card&&card.querySelector('.tt');return text(t);}
  function addTitleFromMeta(el){if(!el)return;var m=el.querySelector('.m,.sub');if(m&&!el.title)el.title=text(m);}
  function patchMarkdown(){
    if(typeof VIEW!=='undefined'&&VIEW!=='markdown')return;
    var root=document.getElementById('content');if(!root)return;
    Array.from(root.querySelectorAll('.card')).forEach(function(card){
      var name=titleOf(card);
      if(name==='Resumen de gestión'){card.classList.add('pv-card-clean','pv-md-summary');Array.from(card.querySelectorAll('.v8618Card')).forEach(addTitleFromMeta);}
      else if(name==='Estado actual vs. política'){card.classList.add('pv-card-clean','pv-md-status');}
      else if(name==='Productos a gestionar por regla'){card.classList.add('pv-card-clean','pv-md-rule');Array.from(card.querySelectorAll('.v8618Card')).forEach(addTitleFromMeta);}
      else if(name==='Productos a gestionar por política'){card.classList.add('pv-card-clean','pv-md-policy');}
      else if(name==='Productos a gestionar por antigüedad'){card.classList.add('pv-card-clean','pv-md-age');}
      else if(name==='Detalle por producto y tienda'){card.classList.add('pv-card-clean','pv-md-detail');}
      else if(name==='Productos con mayor brecha de descuento'||name==='Tabla de política utilizada'){card.classList.add('pv-card-clean');}
    });
  }
  function groupGuideCards(card){
    var body=card.querySelector('.cbody'),mk=body&&body.querySelector('.mkpis');if(!mk||mk.dataset.pvGrouped==='1')return;
    var cards=Array.from(mk.children).filter(function(x){return x.classList&&x.classList.contains('guideKpiLike');});if(cards.length<6)return;
    mk.dataset.pvGrouped='1';
    var hLabel=document.createElement('div');hLabel.className='pv-section-label';hLabel.textContent='Cómo está la tienda';
    var health=document.createElement('div');health.className='pv-guide-group health';
    var aLabel=document.createElement('div');aLabel.className='pv-section-label';aLabel.textContent='Acciones pendientes';
    var actions=document.createElement('div');actions.className='pv-guide-group actions';
    cards.slice(0,3).forEach(function(x){addTitleFromMeta(x);health.appendChild(x);});
    cards.slice(3,6).forEach(function(x){addTitleFromMeta(x);actions.appendChild(x);});
    mk.appendChild(hLabel);mk.appendChild(health);mk.appendChild(aLabel);mk.appendChild(actions);
  }
  function patchAmbientes(){
    if(typeof VIEW!=='undefined'&&VIEW!=='amb')return;
    var root=document.getElementById('content');if(!root)return;
    var card=Array.from(root.querySelectorAll('.card')).find(function(c){return titleOf(c)==='Guías de exhibición';});
    if(card){card.classList.add('pv-card-clean','pv-guide-card');groupGuideCards(card);}
    Array.from(root.querySelectorAll('.card')).forEach(function(c){if(titleOf(c)==='Traslados en camino')c.classList.add('pv-card-clean');});
  }
  function mark(){try{document.documentElement.setAttribute('data-preview-visual','v8688');var chip=document.querySelector('.appVersionChip b');if(chip&&!/PREVIEW/i.test(chip.textContent))chip.textContent=chip.textContent+' · PREVIEW VISUAL';}catch(_){}}
  function patch(){patchMarkdown();patchAmbientes();mark();}
  function later(){setTimeout(patch,40);setTimeout(patch,180);}
  function install(){
    if(installed)return;
    if(typeof window.setView!=='function'){setTimeout(install,100);return;}
    installed=true;
    var sv=window.setView,rf=window.refresh,dm=window.drawMarkdown8617,dg=window.drawGuias;
    window.setView=function(){var o=sv.apply(this,arguments);later();return o;};
    if(typeof rf==='function')window.refresh=function(){var o=rf.apply(this,arguments);later();return o;};
    if(typeof dm==='function')window.drawMarkdown8617=function(){var o=dm.apply(this,arguments);setTimeout(patchMarkdown,35);return o;};
    if(typeof dg==='function')window.drawGuias=function(){var o=dg.apply(this,arguments);setTimeout(patchAmbientes,35);return o;};
    later();
    console.info('LLAVERO V86.88 PREVIEW · jerarquía visual aplicada sin cambiar cálculos');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,60)},{once:true});
})();


/* ==== llaveroV8689PreviewScript ==== */

(function(){
'use strict';
var VERSION='V86.91 PREVIEW',installed=false,baseResumen=null;
function title(card){var t=card&&card.querySelector('.tt');return (t&&t.textContent||'').trim()}
function cleanMarkdownContext(root){(root||document).querySelectorAll('.markdownContext8617').forEach(function(x){x.remove()})}
function cleanInventory(){if(typeof VIEW!=='undefined'&&VIEW!=='inventario')return;var root=document.getElementById('content');if(!root)return;cleanMarkdownContext(root);root.querySelectorAll('[data-v869-cendis-section],[data-v867-cendis-block]').forEach(function(x){x.remove()});Array.from(root.querySelectorAll('.v869MetricTitle')).forEach(function(x){if((x.textContent||'').indexOf('Respaldo CENDIS por condición')>=0){var p=x.closest('[data-v869-cendis-section],.v869MetricSection,.card');(p||x).remove()}})}
function cleanSummaryDom(){if(typeof VIEW!=='undefined'&&VIEW!=='resumen')return;var root=document.getElementById('content');if(!root)return;cleanMarkdownContext(root);Array.from(root.querySelectorAll('.card')).forEach(function(card){var n=title(card);if(n==='Rotación por antigüedad'||n==='Evacuación por antigüedad')card.remove();if(n==='Composición y salud del inventario')card.classList.add('v8689Composition')});var comp=Array.from(root.querySelectorAll('.card')).find(function(c){return title(c)==='Composición y salud del inventario'});if(comp)comp.classList.add('v8689Composition')}
function stripSummaryHtml(html){try{var host=document.createElement('div');host.innerHTML=html;Array.from(host.querySelectorAll('.card')).forEach(function(card){var n=title(card);if(n==='Rotación por antigüedad'||n==='Evacuación por antigüedad')card.remove()});var two=host.querySelector('.two');if(two&&!two.children.length)two.remove();return host.innerHTML}catch(_){return html}}
function mark(){try{document.documentElement.setAttribute('data-preview-clean','v8690');window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='14/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 14/08/2026 · '+VERSION;}catch(_){}}
function patch(){cleanMarkdownContext(document);cleanInventory();cleanSummaryDom();mark()}
function later(){setTimeout(patch,40);setTimeout(patch,180);setTimeout(patch,360)}
function install(){
 if(installed)return;
 if(!window.__LLAVERO_BOOTSTRAPPED__||typeof window.setView!=='function'||typeof window.viewResumen!=='function'){setTimeout(install,100);return}
 installed=true;
 baseResumen=window.viewResumen;
 window.viewResumen=function(st){return stripSummaryHtml(baseResumen.apply(this,arguments))};
 var sv=window.setView,rf=window.refresh,dm=window.drawMarkdown8617;
 window.setView=function(){var o=sv.apply(this,arguments);later();return o};
 if(typeof rf==='function')window.refresh=function(){var o=rf.apply(this,arguments);later();return o};
 if(typeof dm==='function')window.drawMarkdown8617=function(){var o=dm.apply(this,arguments);setTimeout(function(){cleanMarkdownContext(document)},120);return o};
 later();
 console.info('LLAVERO V86.91 PREVIEW · clasificación de Traslados restaurada; interfaz V86.90 preservada');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,60)},{once:true});
})();


/* ==== llaveroV8693Script ==== */

(function(){
'use strict';
var VERSION='V86.93 PREVIEW', installed=false, baseOpenComposition=null;
function s(v){return v==null?'':String(v)}
function n(v){var x=Number(v);return Number.isFinite(x)?x:0}
function norm(v){var x=s(v).trim().toUpperCase();try{return x.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(_){return x}}
function esc(v){return s(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fi(v){try{return typeof fInt==='function'?fInt(n(v)):Math.round(n(v)).toLocaleString('es-CO')}catch(_){return String(Math.round(n(v)))}}
function pct(v){if(v==null||v==='')return'—';var x=Number(v);return Number.isFinite(x)?x.toFixed(1).replace('.0','')+'%':'—'}
function store(){try{return(S&&S[CUR])||{}}catch(_){return{}}}
function product(c){try{return(P&&P[c])||{}}catch(_){return{}}}
function stateOf(r){var v=r&&(r.estadoProducto!=null?r.estadoProducto:(r.estadoAbastecimiento!=null?r.estadoAbastecimiento:r.estado));if((v==null||s(v).trim()==='')&&r&&r.c)v=product(r.c).estado;return norm(v)}
function ccOf(c){var x=norm(product(c).cc);return x==='CORE'?'CORE':x.indexOf('COMPLEMENT')>=0?'COMPLEMENTO':'SIN CLASIFICACIÓN'}
function invRows(){try{return (normalizeInventoryRows(store())||[]).filter(function(r){return n(r.stock)>0})}catch(_){return[]}}
function mixKind(r){var st=stateOf(r);if(st==='A')return'basic';if(st==='T'||st==='O')return'novel';if(st==='N')return'off';return'unknown'}
function view(){try{return typeof VIEW!=='undefined'?VIEW:''}catch(_){return''}}
function title(card){var t=card&&card.querySelector('.tt');return(t&&t.textContent||'').trim()}

function patchSummary(){
 if(view()!=='resumen')return;var root=document.getElementById('content');if(!root)return;
 /* quitar Ventas 3 meses */
 root.querySelectorAll('.kgrid .kpi,.kgrid .stat,.kgrid>div').forEach(function(card){var txt=(card.textContent||'').replace(/\s+/g,' ').trim();if(txt.indexOf('Ventas últ. 3 meses')>=0||txt.indexOf('Ventas ult. 3 meses')>=0)card.remove()});
 var kgrid=root.querySelector('.kgrid');if(kgrid)kgrid.style.gridTemplateColumns='repeat(3,minmax(0,1fr))';
 var comp=Array.from(root.querySelectorAll('.card')).find(function(c){return title(c)==='Composición y salud del inventario'});if(!comp)return;comp.classList.add('v8689Composition');
 var all=invRows();['basic','novel','off'].forEach(function(kind){var card=comp.querySelector('.v8664MixCard.'+kind);if(!card)return;var rows=all.filter(function(r){return mixKind(r)===kind}),core=rows.filter(function(r){return ccOf(r.c)==='CORE'}).length,co=rows.filter(function(r){return ccOf(r.c)==='COMPLEMENTO'}).length,t=rows.filter(function(r){return stateOf(r)==='T'}).length,o=rows.filter(function(r){return stateOf(r)==='O'}).length;
   var head=card.querySelector('.v8664MixTitle');if(head){var div=head.querySelector('div');if(div){Array.from(div.querySelectorAll('span')).forEach(function(x){if(/Composición sobre productos con stock/i.test(x.textContent||''))x.remove()});var old=div.querySelector('.v8692MixMeta');if(old)old.remove();var meta=document.createElement('div');meta.className='v8692MixMeta';meta.innerHTML='<span class="core">CORE '+fi(core)+'</span><span class="comp">COMPLEMENTO '+fi(co)+'</span>'+(kind==='novel'?'<span class="t">T '+fi(t)+'</span><span class="o">O '+fi(o)+'</span>':'');div.appendChild(meta)}Array.from(head.children).forEach(function(x){if(x.tagName==='SPAN'&&/^Meta\s/i.test((x.textContent||'').trim()))x.remove()})}
 });
 patchTrend();
}

function history(){try{var el=document.getElementById('embeddedHistory'),h=JSON.parse(el&&el.textContent||'{}');return h&&Array.isArray(h.daily)?h.daily:[]}catch(_){return[]}}
function recovery(block){if(block&&Number.isFinite(Number(block.reductionAdj)))return Number(block.reductionAdj);var base=n(block&&block.previousVal)+n(block&&block.newVal),cur=n(block&&block.currentVal);return base>0?(base-cur)/base*100:0}
function patchTrend(){
 if(view()!=='resumen')return;var daily=Array.from(document.querySelectorAll('#content .card')).find(function(c){return title(c)==='Seguimiento diario de gestión'});if(!daily)return;var body=daily.querySelector('.cbody')||daily,arr=history().slice().sort(function(a,b){return s(a.date).localeCompare(s(b.date))}).map(function(snap,i){var m=snap&&snap.stores&&snap.stores[CUR];return m?{date:snap.date,rotRecovery:i?recovery(m.rot):0,evacRecovery:i?recovery(m.evac):0,isBase:i===0}:null}).filter(Boolean);var old=body.querySelector('.v79StoreTrendCard,.v8667TrendCard,.v8669TrendCard,.v8692TrendCard');if(old)old.remove();var card=document.createElement('div');card.className='v79StoreTrendCard v8692TrendCard';var chart='';try{chart=typeof trendChart79==='function'?trendChart79(arr,CUR):''}catch(_){}if(!chart&&arr.length)chart='<div class="empty">Historial disponible: '+fi(arr.length)+' cortes.</div>';if(!chart)chart='<div class="empty">Sin historial disponible.</div>';card.innerHTML='<div class="v79StoreTrendHead"><div><b>Tendencia histórica de la tienda</b><span>Rotación y Evacuación por cada corte</span></div><span>Presiona un punto para ver su actividad</span></div>'+chart;body.appendChild(card)
}

function decorateCompositionModal(kind){
 var body=document.getElementById('rangeModalBody'),table=body&&body.querySelector('#v8664MixTable');if(!body||!table)return;var tools=body.querySelector('.v8664DetailTools');if(!tools)return;var ageSel=tools.querySelector('#v8664MixAge');if(ageSel&&ageSel.closest('.v8664Field'))ageSel.closest('.v8664Field').remove();
 if(!tools.querySelector('[data-v8692-class]')){var f=document.createElement('div');f.className='v8664Field';f.setAttribute('data-v8692-class','1');f.innerHTML='<label>Clasificación</label><select id="v8692MixClass"><option value="all">CORE + COMPLEMENTO</option><option value="CORE">CORE</option><option value="COMPLEMENTO">COMPLEMENTO</option></select>';tools.appendChild(f);f.querySelector('select').onchange=applyCompositionFilters}
 if(kind==='novel'&&!tools.querySelector('[data-v8692-novel]')){var f2=document.createElement('div');f2.className='v8664Field';f2.setAttribute('data-v8692-novel','1');f2.innerHTML='<label>Estado novedad</label><select id="v8692MixNovel"><option value="all">T + O</option><option value="T">Solo T</option><option value="O">Solo O</option></select>';tools.appendChild(f2);f2.querySelector('select').onchange=applyCompositionFilters}
 Array.from(table.tBodies&&table.tBodies[0]?table.tBodies[0].rows:[]).forEach(function(tr){var ce=tr.querySelector('.code'),c=s(ce&&ce.textContent).trim();tr.dataset.v8692Class=ccOf(c);tr.dataset.v8692State=norm(product(c).estado)});applyCompositionFilters()
}
function applyCompositionFilters(){var body=document.getElementById('rangeModalBody'),table=body&&body.querySelector('#v8664MixTable');if(!table)return;try{if(typeof baseFilterComposition92==='function')baseFilterComposition92()}catch(_){}var cl=body.querySelector('#v8692MixClass'),nv=body.querySelector('#v8692MixNovel'),cv=cl?cl.value:'all',sv=nv?nv.value:'all',shown=0;Array.from(table.tBodies[0].rows).forEach(function(tr){var base=tr.style.display!=='none',ok=base&&(cv==='all'||tr.dataset.v8692Class===cv)&&(sv==='all'||tr.dataset.v8692State===sv);tr.style.display=ok?'':'none';if(ok)shown++});var cnt=body.querySelector('#v8664MixCount');if(cnt)cnt.textContent=fi(shown)+' productos'}

function mdRows(){try{return typeof window.mdRows8664==='function'?window.mdRows8664(CUR):[]}catch(_){return[]}}
function mdOwner(r){if(!r||r.statusKey!=='manage')return'—';return n(r.discount)>50?'Líder de Área':'Administrador'}
function mdModal(titleText,rows){var modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle');if(!modal||!body)return;modal.classList.add('v8664Wide');if(tt)tt.textContent='Markdown · '+titleText;if(ss)ss.textContent=(store().name||CUR)+' · '+fi(rows.length)+' productos';var units=rows.reduce(function(a,r){return a+n(r.stock)},0),core=rows.filter(function(r){return ccOf(r.code)==='CORE'}).length,comp=rows.filter(function(r){return ccOf(r.code)==='COMPLEMENTO'}).length;
 var trs=rows.map(function(r){var cc=ccOf(r.code),owner=mdOwner(r),state=r.statusLabel||'—',pol=r.policyApplied||'—';return'<tr data-code="'+esc(r.code)+'" data-q="'+esc(norm([r.code,r.name,r.category,r.line,r.subline,state,owner].join(' ')))+'" data-class="'+esc(cc)+'" data-policy="'+esc(pol)+'" data-state="'+esc(r.statusKey||'')+'"><td>'+(typeof imageThumb==='function'?imageThumb(r.code,'sm'):'')+'</td><td><span class="code">'+esc(r.code)+'</span></td><td class="prod"><b>'+esc(r.name)+'</b><small>'+esc([r.category,r.line,r.subline].filter(Boolean).join(' · '))+'</small></td><td>'+esc(cc)+'</td><td class="num"><b>'+fi(r.stock)+'</b></td><td>'+esc(r.ageLabel||'—')+'</td><td><b>'+esc(pol)+'</b><br><small>'+esc(r.ruleApplied||'')+'</small></td><td class="num">'+pct(r.systemOfferDiscount)+'</td><td class="num">'+pct(r.currentDiscount)+'</td><td class="num"><b>'+pct(r.discount)+'</b></td><td><span class="statePill">'+esc(state)+'</span></td><td>'+esc(owner)+'</td></tr>'}).join('');
 body.innerHTML='<div class="v8684DetailSummary"><div class="v8684DetailKpi"><label>Productos</label><b>'+fi(rows.length)+'</b></div><div class="v8684DetailKpi"><label>Unidades</label><b>'+fi(units)+'</b></div><div class="v8684DetailKpi"><label>CORE</label><b>'+fi(core)+'</b></div><div class="v8684DetailKpi"><label>COMPLEMENTO</label><b>'+fi(comp)+'</b></div></div><div class="v8692MdDetailFilters"><div><label>Buscar</label><input id="v8692MdQ" placeholder="Código, producto, categoría…"></div><div><label>Clasificación</label><select id="v8692MdClass"><option value="all">Todas</option><option>CORE</option><option>COMPLEMENTO</option></select></div><div><label>Política</label><select id="v8692MdPolicy"><option value="all">Todas</option><option>Rotación</option><option>Evacuación</option></select></div><div><label>Estado</label><select id="v8692MdState"><option value="all">Todos</option><option value="manage">Gestionar</option><option value="offer_covered">Oferta cubre</option><option value="comply">Cumple</option><option value="exceed">Supera política</option><option value="review">Revisar dato</option><option value="no_policy">Sin política</option></select></div></div><div class="v8692MdDetailCount"><span id="v8692MdCount">'+fi(rows.length)+' productos</span><span>Selecciona un producto para abrir su ficha.</span></div><div class="v8692MdDetailWrap"><table class="v8692MdDetailTable"><colgroup><col class="img"><col class="code"><col class="prod"><col class="cls"><col class="stock"><col class="age"><col class="policy"><col class="disc"><col class="disc"><col class="disc"><col class="state"><col class="owner"></colgroup><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Clasificación</th><th class="num">Stock</th><th>Antigüedad</th><th>Política / regla</th><th class="num">Oferta</th><th class="num">Muestra</th><th class="num">Sugerido</th><th>Estado</th><th>Responsable</th></tr></thead><tbody>'+trs+'</tbody></table></div>';
 ['v8692MdQ','v8692MdClass','v8692MdPolicy','v8692MdState'].forEach(function(id){var x=document.getElementById(id);if(x)x.addEventListener(id==='v8692MdQ'?'input':'change',filterMdModal)});body.querySelectorAll('tbody tr[data-code]').forEach(function(tr){tr.onclick=function(){if(typeof openMdProduct8664==='function')openMdProduct8664(tr.dataset.code)}});modal.classList.add('on')
}
function filterMdModal(){var body=document.getElementById('rangeModalBody'),q=norm((body.querySelector('#v8692MdQ')||{}).value||''),cc=(body.querySelector('#v8692MdClass')||{}).value||'all',pol=(body.querySelector('#v8692MdPolicy')||{}).value||'all',st=(body.querySelector('#v8692MdState')||{}).value||'all',shown=0;body.querySelectorAll('.v8692MdDetailTable tbody tr').forEach(function(tr){var ok=(!q||s(tr.dataset.q).indexOf(q)>=0)&&(cc==='all'||tr.dataset.class===cc)&&(pol==='all'||tr.dataset.policy===pol)&&(st==='all'||tr.dataset.state===st);tr.style.display=ok?'':'none';if(ok)shown++});var cnt=body.querySelector('#v8692MdCount');if(cnt)cnt.textContent=fi(shown)+' productos'}
function summaryConfig(label){if(label==='Productos a gestionar'||label==='% A gestionar')return['Productos a gestionar',['manage']];if(label==='Cumplimiento de política')return['Cumplimiento de política',['comply','exceed']];if(label==='% Cumple política')return['Cumple política',['comply']];if(label==='% Supera política')return['Supera política',['exceed']];if(label==='% Oferta cubre')return['Oferta cubre',['offer_covered']];return null}
function patchMarkdown(){return;}

function patchTransfers(){if(view()!=='traslados')return;var root=document.getElementById('content');if(!root)return;var all=Array.from(root.querySelectorAll('.transferMetricCard8616'));function label(b){var x=b.querySelector('.transferMetricLabel8616');return(x&&x.textContent||'').trim()}var exec=root.querySelector('.transferKpisExecutive8616'),flow=root.querySelector('.transferKpisFlow8616'),impact=root.querySelector('.transferKpisImpact8616');
 all.forEach(function(b){var l=label(b);if(l==='Cambios de estado'||l==='Entregadas último corte'||l==='Productos / líneas'||l==='Unidades registradas'||l==='Completarían ambientes'||l==='Avanzarían ambientes')b.remove()});
 var crit=all.find(function(b){return label(b)==='Productos críticos'});if(crit&&flow)flow.appendChild(crit);if(impact){var sec=impact.previousElementSibling;if(sec&&sec.classList.contains('transferSectionTitle8615'))sec.remove();impact.remove()}
 if(flow){var sec2=flow.previousElementSibling;if(sec2&&sec2.classList.contains('transferSectionTitle8615'))sec2.classList.add('v8692TransferKeepTitle')}
 /* V86.101: restaurar únicamente el acceso al checklist de Traslados. */
 var checklist=root.querySelector('[data-v8666-transfer-decision]');
 if(!checklist){
   var st=store(),arr=Array.isArray(st.trDetalle)?st.trDetalle:[],orders={};
   arr.forEach(function(r){var status=norm(r.estatus||'');if(status.indexOf('ENTREG')>=0)return;var id=s(r.entrega||'SIN IDENTIFICAR');orders[id]=(orders[id]||0)+1});
   var orderCount=Object.keys(orders).length,productCount=Object.keys(orders).reduce(function(a,k){return a+orders[k]},0),card=document.createElement('div');
   card.dataset.v8666TransferDecision='1';card.className='v8666TransferDecisionCard';
   card.innerHTML='<div class="v8666TransferDecisionHead"><div><b>Gestión de entregas pendientes</b><span>'+fi(orderCount)+' entregas por revisar · '+fi(productCount)+' productos. Marca lo que se debe ENVIAR y lo que se debe ELIMINAR.</span></div><button type="button">Abrir checklist</button></div>';
   var btn=card.querySelector('button');if(btn)btn.onclick=function(){if(typeof window.openTransferDecisions8667==='function')window.openTransferDecisions8667();else if(typeof window.openTransferDecisions8666==='function')window.openTransferDecisions8666();};
   var table=document.getElementById('tr-tbl'),anchor=table&&table.parentElement;if(anchor&&table)anchor.insertBefore(card,table);else root.appendChild(card);
 }
}

function mark(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='14/08/2026 · '+VERSION;document.title='Llavero · Preview V86.93 · 14/08/2026';document.documentElement.classList.add('v8693-ready')}catch(_){}}
function patchAll(){patchSummary();patchMarkdown();patchTransfers();mark()}
function later(){patchAll()}
function install(){if(installed)return;if(!window.__LLAVERO_BOOTSTRAPPED__||typeof window.setView!=='function'){setTimeout(install,120);return}installed=true;
 baseOpenComposition=window.openComposition8664;window.baseFilterComposition92=window.filterComposition8664;if(typeof baseOpenComposition==='function')window.openComposition8664=function(kind,bucket){var o=baseOpenComposition.apply(this,arguments);decorateCompositionModal(kind);return o};if(typeof window.filterComposition8664==='function'){var bf=window.filterComposition8664;window.baseFilterComposition92=bf;window.filterComposition8664=function(){var o=bf.apply(this,arguments);applyCompositionFilters();return o}}
 var sv=window.setView,rf=window.refresh,dm=window.drawMarkdown8617,dtr=window.drawTr8615||window.drawTr;window.setView=function(){var o=sv.apply(this,arguments);later();return o};if(typeof rf==='function')window.refresh=function(){var o=rf.apply(this,arguments);later();return o};if(typeof dm==='function')window.drawMarkdown8617=function(){var o=dm.apply(this,arguments);patchMarkdown();return o};if(typeof dtr==='function'){var wt=function(){var o=dtr.apply(this,arguments);patchTransfers();return o};window.drawTr8615=window.drawTr862=window.drawTr80=window.drawTr=wt}
 later();console.info('LLAVERO V86.93 PREVIEW · render estable y detalle de composición sin filtro de antigüedad')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,70)},{once:true});
})();


/* ==== llaveroV8695Script ==== */

(function(){
'use strict';
var VERSION='V86.96 PREVIEW',installed=false;
function s(v){return v==null?'':String(v)}
function n(v){var x=Number(v);return Number.isFinite(x)?x:0}
function norm(v){var x=s(v);try{return x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim()}catch(_){return x.toUpperCase().trim()}}
function esc(v){return s(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fi(v){try{return typeof fInt==='function'?fInt(n(v)):Math.round(n(v)).toLocaleString('es-CO')}catch(_){return String(Math.round(n(v)))}}
function pct(v){if(v==null||v==='')return '—';var x=Number(v);return Number.isFinite(x)?x.toFixed(1).replace('.0','')+'%':'—'}
function rows(){try{return typeof window.mdRows8664==='function'?(window.mdRows8664(CUR)||[]):[]}catch(_){return[]}}
function cc(r){var x=norm(r&&r.cc);if(x.indexOf('CORE')>=0)return'CORE';if(x.indexOf('COMPLEMENT')>=0)return'COMPLEMENTO';return'SIN CLASIFICACIÓN'}
function owner(r){return r&&r.statusKey==='manage'?(n(r.discount)>50?'Líder de Área':'Administrador'):'—'}
function img(code){try{return typeof imageThumb==='function'?imageThumb(code,'sm'):''}catch(_){return''}}
function unique(arr){return Array.from(new Set(arr.filter(Boolean))).sort(function(a,b){return s(a).localeCompare(s(b),'es')})}
function field(id,label,options,allLabel){if(options.length<=1)return'';return '<div class="v8695MdField"><label>'+esc(label)+'</label><select id="'+id+'"><option value="all">'+esc(allLabel||'Todos')+'</option>'+options.map(function(x){return'<option value="'+esc(x)+'">'+esc(x)+'</option>'}).join('')+'</select></div>'}
function openDetail(titleText,data){
 data=(data||[]).slice();var modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle');if(!modal||!body)return;
 modal.classList.add('v8664Wide');if(tt)tt.textContent='Markdown · '+titleText;if(ss)ss.textContent=((S&&S[CUR]&&S[CUR].name)||CUR)+' · '+fi(data.length)+' productos';
 var units=data.reduce(function(a,r){return a+n(r.stock)},0),core=data.filter(function(r){return cc(r)==='CORE'}).length,comp=data.filter(function(r){return cc(r)==='COMPLEMENTO'}).length;
 var classes=unique(data.map(cc)),categories=unique(data.map(function(r){return r.category||''})),policies=unique(data.map(function(r){return r.policyApplied||''})),ages=unique(data.map(function(r){return r.ageLabel||''}));
 var trs=data.map(function(r){var c=cc(r),o=owner(r),state=r.statusLabel||'—',pol=r.policyApplied||'—',cat=r.category||'',q=norm([r.code,r.name,r.category,r.line,r.subline,c,pol,r.ruleApplied,state,o,r.ageLabel].join(' '));return '<tr data-code="'+esc(r.code)+'" data-q="'+esc(q)+'" data-class="'+esc(c)+'" data-category="'+esc(cat)+'" data-policy="'+esc(pol)+'" data-age="'+esc(r.ageLabel||'')+'"><td>'+img(r.code)+'</td><td><span class="code">'+esc(r.code)+'</span></td><td class="prod"><b>'+esc(r.name)+'</b><small>'+esc([r.category,r.line,r.subline].filter(Boolean).join(' · '))+'</small></td><td><span class="classPill">'+esc(c)+'</span></td><td class="num"><b>'+fi(r.stock)+'</b></td><td>'+esc(r.ageLabel||'—')+'</td><td><b>'+esc(pol)+'</b><br><small>'+esc(r.ruleApplied||'')+'</small></td><td class="num">'+pct(r.systemOfferDiscount)+'</td><td class="num">'+pct(r.currentDiscount)+'</td><td class="num"><b>'+pct(r.discount)+'</b></td><td><span class="statePill">'+esc(state)+'</span></td><td class="owner">'+esc(o)+'</td></tr>'}).join('');
 var filters='<div class="v8695MdFilters"><div class="v8695MdField"><label>Buscar</label><input id="v8695MdQ" placeholder="Código, producto, categoría, política…"></div>'+field('v8695MdCategory','Categoría',categories,'Todas')+field('v8695MdClass','Clasificación',classes,'Todas')+field('v8695MdPolicy','Política',policies,'Todas')+field('v8695MdAge','Antigüedad',ages,'Todas')+'</div>';
 body.innerHTML='<div class="v8684DetailSummary"><div class="v8684DetailKpi"><label>Productos</label><b>'+fi(data.length)+'</b></div><div class="v8684DetailKpi"><label>Unidades</label><b>'+fi(units)+'</b></div><div class="v8684DetailKpi"><label>CORE</label><b>'+fi(core)+'</b></div><div class="v8684DetailKpi"><label>COMPLEMENTO</label><b>'+fi(comp)+'</b></div></div>'+filters+'<div class="v8695MdCount"><span id="v8695MdCount">'+fi(data.length)+' productos</span><span>Selecciona una fila para abrir la ficha del producto.</span></div><div class="v8695MdWrap"><table class="v8695MdTable"><colgroup><col class="img"><col class="code"><col class="prod"><col class="cls"><col class="stock"><col class="age"><col class="policy"><col class="disc"><col class="disc"><col class="disc"><col class="state"><col class="owner"></colgroup><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Clasificación</th><th class="num">Stock</th><th>Antigüedad</th><th>Política / regla</th><th class="num">Oferta</th><th class="num">Muestra</th><th class="num">Sugerido</th><th>Estado</th><th>Responsable</th></tr></thead><tbody>'+trs+'</tbody></table></div>';
 function filter(){var q=norm((document.getElementById('v8695MdQ')||{}).value||''),cat=(document.getElementById('v8695MdCategory')||{}).value||'all',cl=(document.getElementById('v8695MdClass')||{}).value||'all',po=(document.getElementById('v8695MdPolicy')||{}).value||'all',ag=(document.getElementById('v8695MdAge')||{}).value||'all',shown=0;body.querySelectorAll('.v8695MdTable tbody tr').forEach(function(tr){var ok=(!q||s(tr.dataset.q).indexOf(q)>=0)&&(cat==='all'||tr.dataset.category===cat)&&(cl==='all'||tr.dataset.class===cl)&&(po==='all'||tr.dataset.policy===po)&&(ag==='all'||tr.dataset.age===ag);tr.style.display=ok?'':'none';if(ok)shown++});var c=document.getElementById('v8695MdCount');if(c)c.textContent=fi(shown)+' productos'}
 ['v8695MdQ','v8695MdCategory','v8695MdClass','v8695MdPolicy','v8695MdAge'].forEach(function(id){var x=document.getElementById(id);if(x)x.addEventListener(id==='v8695MdQ'?'input':'change',filter)});body.querySelectorAll('tbody tr[data-code]').forEach(function(tr){tr.onclick=function(){if(typeof openMdProduct8664==='function')openMdProduct8664(tr.dataset.code)}});modal.classList.add('on');
}
function statusTitle(key){return key==='manage'?'Productos a gestionar':key==='offer_covered'?'Oferta cubre':key==='comply'?'Cumple política':key==='exceed'?'Supera política':key==='review'?'Revisar dato':key==='no_policy'?'Sin política':'Detalle Markdown'}
function ageTitle(bucket){return bucket==='0-60'?'0–60 días':bucket==='61-90'?'61–90 días':bucket==='91-150'?'91–150 días':bucket==='151-180'?'151–180 días':bucket==='181-210'?'181–210 días':bucket==='211-240'?'211–240 días':bucket==='241-360'?'241–360 días':'+360 días'}
window.V8694=window.V8695={
 status:function(key){openDetail(statusTitle(key),rows().filter(function(r){return r.statusKey===key}))},
 summary:function(key){this.status(key)},
 policy:function(c,kind){var pol=kind==='evac'?'Evacuación':'Rotación';openDetail(pol+' · '+c,rows().filter(function(r){return r.statusKey==='manage'&&cc(r)===c&&norm(r.policyApplied).indexOf(kind==='evac'?'EVAC':'ROT')>=0}))},
 age:function(bucket){openDetail('Productos a gestionar · '+ageTitle(bucket),rows().filter(function(r){return r.statusKey==='manage'&&s(r.ageBucket)===bucket}))}
};
window.openMdAge8664=function(bucket){window.V8695.age(bucket)};
window.openMdAge8666=function(bucket){window.V8695.age(bucket)};
function transferStatus(r){var e=norm(r&&r.estatus);if(e.indexOf('ENTREG')>=0)return'Entregado';if(e.indexOf('PICK')>=0)return'En picking';if(e.indexOf('RUTA')>=0)return'En Ruta';if(e.indexOf('PEND')>=0)return'Pendiente';var p=norm(r&&r.statusGlobalPicking),m=norm(r&&r.statusMovimiento),w=norm(r&&r.lugarPuestaDispos);if(p==='C'&&m==='C')return'Entregado';if(p==='C'&&m==='A')return'En Ruta';if(p==='A'&&m==='A'&&w.indexOf('WMS')>=0)return'En picking';return'Pendiente'}
window.__transferPendingOrderCount=function(st){st=st||{};var g={};(st.trDetalle||[]).forEach(function(r){var id=s(r&&r.entrega||'SIN IDENTIFICAR');(g[id]||(g[id]=[])).push(r)});return Object.keys(g).filter(function(id){return g[id].some(function(r){return transferStatus(r)!=='Entregado'})}).length};
function patchTransferBadge(){var el=document.getElementById('nc-tr'),st=(S&&S[CUR])||{};if(el)el.textContent=fi(window.__transferPendingOrderCount(st))}
function patchEvaluatedBadge(){if((typeof VIEW!=='undefined'?VIEW:'')!=='markdown')return;var b=document.getElementById('md-count-badge-8618');if(b&&!/evaluados/i.test(b.textContent||''))b.textContent=(b.textContent||'').replace(/\s*productos\s*$/i,' productos evaluados')}
function mark(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='14/08/2026 · '+VERSION;document.title='Llavero · Preview V86.96 · 14/08/2026'}catch(_){}}
function patch(){patchTransferBadge();patchEvaluatedBadge();mark()}
function install(){if(installed)return;if(!window.__LLAVERO_BOOTSTRAPPED__||typeof window.setView!=='function'){setTimeout(install,100);return}installed=true;var sv=window.setView,rf=window.refresh,dm=window.drawMarkdown8617;window.setView=function(){var o=sv.apply(this,arguments);patch();return o};if(typeof rf==='function')window.refresh=function(){var o=rf.apply(this,arguments);patch();return o};if(typeof dm==='function')window.drawMarkdown8617=function(){var o=dm.apply(this,arguments);patchEvaluatedBadge();return o};patch();console.info('LLAVERO V86.96 PREVIEW · badge Traslados estabilizado en todos los ciclos de render')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,50)},{once:true});
})();


/* ==== llaveroV86104UxScript ==== */

(function(){
'use strict';
if(window.__LLAVERO_V86104_UX__)return;window.__LLAVERO_V86104_UX__=true;
var VERSION='V86.104';
var scheduled=0;
function s(v){return v==null?'':String(v)}
function norm(v){var x=s(v).trim().toUpperCase();try{return x.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(_){return x}}
function esc(v){return s(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]})}
function fi(v){var x=Number(v)||0;try{return typeof fInt==='function'?fInt(x):x.toLocaleString('es-CO')}catch(_){return String(x)}}
function mark(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);document.documentElement.setAttribute('data-ux-system','V86.104');var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='14/08/2026 · '+VERSION;document.title='Llavero · '+VERSION+' · 14/08/2026'}catch(_){}}

function openModals(){return Array.prototype.slice.call(document.querySelectorAll('#rangeModal.on,#inventoryProductModal.on,#v80ModalBack.on,.modalBack.on')).filter(function(m){return !m.matches('#leaderModal,#dataHelpModal,#actionModal,#imageModal')})}
function modalBody(modal){return modal&&modal.querySelector('#rangeModalBody,#inventoryProductBody,#v80ModalBody,#guideDetailBodyV48,#guideDetailBodyV49,#guideKpiBody65,#leaderAuditBody59,.v8623ManageModalBody,.modalBody,.inventoryDetailBody,.v80ModalBody')}
function modalTitle(modal){var t=modal&&modal.querySelector('#rangeModalTitle,#inventoryProductTitle,#v80ModalTitle,.modalHead h3,.v80ModalHead h3');return s(t&&t.textContent).trim()}
function visibleRows(table){return Array.prototype.slice.call(table&&table.tBodies&&table.tBodies[0]?table.tBodies[0].rows:[]).filter(function(r){return !r.querySelector('.empty')})}
function cleanHeader(v){return norm(v).replace(/\s+/g,' ')}
function headerKey(v){var h=cleanHeader(v);if(h==='SEL.'||h==='SEL'||h.indexOf('SELECCION')===0)return'seleccion';if(h.indexOf('IMAGEN')===0)return'imagen';if(h.indexOf('CODIGO')===0)return'codigo';if(h.indexOf('PRODUCTO')===0||h.indexOf('NOMBRE')===0)return'producto';if(h.indexOf('CLASIFIC')>=0)return'clasificacion';if(h==='ESTADO'||h.indexOf('ESTADO ACTUAL')===0||h.indexOf('RESULTADO')===0)return'estado';if(h.indexOf('RESPONSABLE')>=0)return'responsable';if(h.indexOf('POLITICA')>=0||h.indexOf('REGLA')>=0)return'politica';if(h.indexOf('ANTIG')>=0||h.indexOf('RANGO')>=0)return'antiguedad';if(h.indexOf('CENDIS')>=0)return'cendis';if(h.indexOf('CATEGOR')>=0)return'categoria';if(h==='LINEA'||h.indexOf('LINEA ')===0)return'linea';if(h.indexOf('SUBLINEA')>=0)return'sublinea';return''}
function decorateTable(table){if(!table||table.dataset.ux104Table==='1')return;table.dataset.ux104Table='1';table.classList.add('ux104DetailTable');var wrap=table.parentElement;if(wrap&&!wrap.classList.contains('ux104DetailTableWrap'))wrap.classList.add('ux104DetailTableWrap');var ths=Array.prototype.slice.call(table.querySelectorAll('thead th'));var keys=[];ths.forEach(function(th,i){var k=headerKey(th.textContent);keys[i]=k;if(k)th.classList.add('ux104-col-'+k)});visibleRows(table).forEach(function(tr){Array.prototype.slice.call(tr.cells).forEach(function(td,i){var k=keys[i];if(k)td.classList.add('ux104-col-'+k)});var c=tr.querySelector('.ux104-col-clasificacion');if(c){var v=norm(c.textContent);c.classList.toggle('ux104-core',v==='CORE');c.classList.toggle('ux104-comp',v.indexOf('COMPLEMENT')>=0);c.classList.toggle('ux104-none',v.indexOf('SIN CLASIFIC')>=0)}});var first=keys.slice(0,4).join('|');if(first==='imagen|codigo|producto|')table.classList.add('ux104Sticky3');else if(keys[0]==='imagen'&&keys[1]==='codigo'&&keys[2]==='producto')table.classList.add('ux104Sticky3');else if(keys[0]==='seleccion'&&keys[1]==='imagen'&&keys[2]==='codigo'&&keys[3]==='producto')table.classList.add('ux104Sticky4')}
function optionsFor(table,idx){var set=new Set;visibleRows(table).forEach(function(r){var c=r.cells[idx],v=s(c&&c.textContent).replace(/\s+/g,' ').trim();if(v&&v!=='—')set.add(v)});return Array.from(set).sort(function(a,b){return a.localeCompare(b,'es')})}
function filterAllowed(key){return ['clasificacion','estado','politica','categoria','linea','sublinea','cendis','responsable','antiguedad'].indexOf(key)>=0}
function needsGenericFilters(body,table){if(!body||!table)return false;if(table.querySelector('input[type=checkbox]'))return false;if(body.querySelector('.ux104Filters,[data-v866-filters],.v866ListFilters,.v8664DetailTools,.v8692MdDetailFilters,.v8695MdFilters,.v80Filters,.v8623ManageTools,.guideKpiFilters65'))return false;var rows=visibleRows(table);if(rows.length<10)return false;return true}
function addGenericFilters(modal,body,table){if(!needsGenericFilters(body,table))return;var ths=Array.prototype.slice.call(table.querySelectorAll('thead th')),title=norm(modalTitle(modal)),fields=[];ths.forEach(function(th,i){var key=headerKey(th.textContent);if(!filterAllowed(key))return;var vals=optionsFor(table,i);if(vals.length<2||vals.length>24)return;if(key==='antiguedad'&&/(0.?60|61.?90|91.?120|91.?150|121.?150|151.?180|181.?210|211.?240|241.?360|\+?360)/.test(title))return;if(key==='clasificacion'&&(title.indexOf('CORE')>=0||title.indexOf('COMPLEMENTO')>=0||title.indexOf('SIN CLASIFIC')>=0))return;fields.push({key:key,idx:i,label:s(th.textContent).trim(),values:vals})});
 var box=document.createElement('div');box.className='ux104Filters';box.dataset.ux104Filters='1';box.innerHTML='<div class="ux104Field"><label>Búsqueda rápida</label><input type="search" data-ux104-q placeholder="Código, producto o texto visible..."></div>'+fields.map(function(f){return'<div class="ux104Field"><label>'+esc(f.label)+'</label><select data-ux104-filter="'+f.idx+'"><option value="">Todos</option>'+f.values.map(function(v){return'<option value="'+esc(norm(v))+'">'+esc(v)+'</option>'}).join('')+'</select></div>'}).join('')+'<div class="ux104Field"><label>Acción</label><button type="button" data-ux104-clear>Limpiar filtros</button></div><div class="ux104FilterCount" data-ux104-count></div>';
 var anchor=table.closest('.ux104DetailTableWrap')||table.parentElement||table;anchor.parentNode.insertBefore(box,anchor);
 function apply(){var q=norm((box.querySelector('[data-ux104-q]')||{}).value||''),selects=Array.prototype.slice.call(box.querySelectorAll('[data-ux104-filter]')),shown=0;visibleRows(table).forEach(function(r){var ok=!q||norm(r.textContent).indexOf(q)>=0;if(ok)selects.forEach(function(sel){if(!ok||!sel.value)return;var idx=Number(sel.dataset.ux104Filter),v=norm(r.cells[idx]&&r.cells[idx].textContent);if(v!==sel.value)ok=false});r.style.display=ok?'':'none';if(ok)shown++});var c=box.querySelector('[data-ux104-count]');if(c)c.textContent=fi(shown)+' de '+fi(visibleRows(table).length)+' productos'}
 box.querySelector('[data-ux104-q]').addEventListener('input',apply);box.querySelectorAll('select').forEach(function(x){x.addEventListener('change',apply)});box.querySelector('[data-ux104-clear]').onclick=function(){box.querySelector('[data-ux104-q]').value='';box.querySelectorAll('select').forEach(function(x){x.value=''});apply()};apply()
}
function standardizeExistingFilters(body){if(!body)return;body.querySelectorAll('.v866Filters,.v866ListFilters,.v8664DetailTools,.v8692MdDetailFilters,.v8695MdFilters,.v80Filters').forEach(function(x){x.classList.add('ux104ExistingFilters')})}
function enhanceModal(modal){if(!modal||!modal.classList.contains('on'))return;modal.classList.add('ux104-detail-open');var body=modalBody(modal);if(!body)return;standardizeExistingFilters(body);var tables=Array.prototype.slice.call(body.querySelectorAll('table'));tables.forEach(function(t){decorateTable(t)});if(tables.length===1)addGenericFilters(modal,body,tables[0])}
function enhanceAllOpen(){scheduled=0;openModals().forEach(enhanceModal)}
function schedule(){if(scheduled)return;scheduled=requestAnimationFrame(function(){setTimeout(enhanceAllOpen,0)})}

function makeAccessibleCards(){var root=document.getElementById('content');if(!root)return;var sel='.v82ClassCard,.v8618Card,.guideKpiLike,.transferMetricCard8616,.transferInsightItem8616,.transferKpi862,.v8664MixCard,.v8666PolicyCard,.v8681PolicyCard,.proxKpiClickable,[data-v70-clickable="1"],[data-guide-filter],[data-transfer-kind]';root.querySelectorAll(sel).forEach(function(card){var hasAction=!!(card.getAttribute('onclick')||card.dataset.mdCard||card.dataset.guideFilter||card.dataset.transferKind||card.dataset.v82Class||card.dataset.v70Clickable);if(!hasAction)return;card.classList.add('ux104-clickable');card.setAttribute('role','button');if(!card.hasAttribute('tabindex'))card.tabIndex=0})}
function wireKnownInventoryCards(){if(typeof VIEW==='undefined'||VIEW!=='inventario'||typeof window.openInventoryCondition8662!=='function')return;var root=document.getElementById('content');if(!root)return;root.querySelectorAll('.inventoryKpi,.kpi,.mk').forEach(function(card){if(card.getAttribute('onclick')||card.dataset.ux104Bound==='1')return;var txt=norm(card.textContent).replace(/\s+/g,' '),kind='';if(txt.indexOf('PRODUCTOS CON STOCK')>=0)kind='all';else if(txt.indexOf('PRODUCTOS SANOS')>=0||txt.indexOf('SANOS')===0)kind='healthy';else if(txt.indexOf('PROXIMOS A ROTAR')>=0)kind='prox';else if(txt.indexOf('ROTACION')===0)kind='rot';else if(txt.indexOf('EVACUACION')===0)kind='evac';if(!kind)return;card.dataset.ux104Bound='1';card.classList.add('ux104-clickable');card.setAttribute('role','button');card.tabIndex=0;card.addEventListener('click',function(){window.openInventoryCondition8662(kind);schedule()});card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click()}})})}
function enhanceView(){makeAccessibleCards();wireKnownInventoryCards();mark()}

/* Una sola delegación para normalizar cualquier detalle después de que su función original lo abra. */
document.addEventListener('click',function(e){var target=e.target&&e.target.closest?e.target.closest('#content button,#content [role="button"],#content .kpi,#content .mk,#content .card [onclick],.modalBack button,.v80ModalBack button,table tbody tr'):null;if(target)schedule()},true);
document.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target&&e.target.closest&&e.target.closest('.ux104-clickable'))schedule()},true);

function install(){if(!window.__LLAVERO_BOOTSTRAPPED__||typeof window.setView!=='function'){setTimeout(install,80);return}var oldSet=window.setView,oldRefresh=window.refresh;if(!oldSet.__ux104){var wrapped=function(){var out=oldSet.apply(this,arguments);enhanceView();schedule();return out};wrapped.__ux104=true;window.setView=wrapped}if(typeof oldRefresh==='function'&&!oldRefresh.__ux104){var wr=function(){var out=oldRefresh.apply(this,arguments);enhanceView();schedule();return out};wr.__ux104=true;window.refresh=wr}enhanceView();schedule();mark();console.info('LLAVERO V86.104 · jerarquía de detalle y optimización conservadora activas')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(install,0)},{once:true});else setTimeout(install,0);
window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,0)},{once:true});
})();


/* ==== llaveroV86105StableBootScript ==== */

(function(){
'use strict';
if(window.__LLAVERO_V86105_STABLE_BOOT__)return;window.__LLAVERO_V86105_STABLE_BOOT__=true;
var VERSION='V86.155',loading=document.getElementById('v81Loading'),started=performance.now(),lastMutation=started,observer=null,done=false;
var MIN_VISIBLE_WAIT=180,QUIET_MS=80,MAX_WAIT=950;
function mark(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);document.documentElement.setAttribute('data-render-system','stable-once');var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='14/08/2026 · '+VERSION;document.title='Llavero · '+VERSION+' · 14/08/2026'}catch(_){}}
function criticalReady(){var c=document.getElementById('content');return !!(window.__LLAVERO_BOOTSTRAPPED__&&window.__LLAVERO_BOOT_DATA_READY__&&window.__LLAVERO_V8662_READY__&&window.__LLAVERO_V86104_UX__&&typeof window.setView==='function'&&typeof window.refresh==='function'&&c&&c.children.length);}
function reveal(){if(done)return;done=true;if(observer)observer.disconnect();mark();document.documentElement.setAttribute('data-llavero-ui-ready','1');if(loading){loading.style.transition='opacity .12s ease';loading.style.opacity='0';setTimeout(function(){loading.hidden=true;loading.style.opacity='';loading.style.transition='';},130);}try{window.dispatchEvent(new CustomEvent('llavero:ui-ready',{detail:{version:VERSION}}));}catch(_){ }console.info('LLAVERO '+VERSION+' · interfaz revelada una sola vez tras estabilizar el render en '+Math.round(performance.now()-started)+' ms');}
function tick(){if(done)return;var now=performance.now(),elapsed=now-started,quiet=now-lastMutation;if(criticalReady()&&elapsed>=MIN_VISIBLE_WAIT&&quiet>=QUIET_MS)return reveal();if(elapsed>=MAX_WAIT&&window.__LLAVERO_BOOTSTRAPPED__)return reveal();setTimeout(tick,70);}
function watch(){var c=document.getElementById('content');if(!c){setTimeout(watch,40);return;}observer=new MutationObserver(function(){lastMutation=performance.now();});observer.observe(c,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style']});lastMutation=performance.now();tick();}
if(loading){loading.hidden=false;loading.style.opacity='1';}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
window.addEventListener('llavero:bootstrapped',function(){lastMutation=performance.now();},{once:true});
setTimeout(mark,3400);
})();


/* ==== llaveroV86106AtomicViewScript ==== */

(function(){
'use strict';
if(window.__LLAVERO_V86106_FAST_VIEW__)return;window.__LLAVERO_V86106_FAST_VIEW__=true;
var VERSION='V86.155',seq=0;
function clearState(){document.documentElement.removeAttribute('data-llavero-view-switching');document.documentElement.removeAttribute('data-llavero-pending-view');}
function stable(view,my){requestAnimationFrame(function(){setTimeout(function(){if(my!==seq)return;clearState();try{window.dispatchEvent(new CustomEvent('llavero:view-stable',{detail:{view:String(view||''),version:VERSION}}));}catch(_){}},24);});}
function install(){
  clearState();
  if(typeof window.setView!=='function'){setTimeout(install,45);return;}
  var base=window.setView;if(base.__v86106Fast)return;
  var wrapped=function(view){var my=++seq,out=base.apply(this,arguments);stable(view,my);return out;};
  wrapped.__v86106Fast=true;wrapped.__v86106Base=base;window.setView=wrapped;try{setView=wrapped}catch(_){}
  console.info('LLAVERO '+VERSION+' · navegación inmediata sin pantalla de carga intermedia');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(install,0)},{once:true});else setTimeout(install,0);
window.addEventListener('llavero:ui-ready',function(){setTimeout(install,0)},{once:true});
})();


/* ==== llaveroV86108Script ==== */

(function(){
'use strict';
var VERSION='V86.108';
function s(v){return v==null?'':String(v)}
function norm(v){var x=s(v).trim().toUpperCase();try{return x.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(_){return x}}
function esc108(v){return s(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c})}
function num108(v){var n=Number(v);return Number.isFinite(n)?n:0}
function fi108(v){try{return typeof fInt==='function'?fInt(num108(v)):Math.round(num108(v)).toLocaleString('es-CO')}catch(_){return String(Math.round(num108(v)))}}
function code108(v){try{return typeof safeCode==='function'?safeCode(v):s(v).trim()}catch(_){return s(v).trim()}}
function product108(c){try{return (typeof productInfo==='function'?productInfo(c):(P&&P[c]))||{n:c,cat:'—',lin:'—',sub:'—',cc:''}}catch(_){return {n:c,cat:'—',lin:'—',sub:'—',cc:''}}}
function class108(c){var x=norm(product108(c).cc);return x==='CORE'?'CORE':x.indexOf('COMPLEMENT')>=0?'COMPLEMENTO':'SIN CLASIFICACIÓN'}
function badge108(cc){var cl=cc==='CORE'?'core':cc==='COMPLEMENTO'?'comp':'none';return '<span class="ccBadge68 '+cl+'">'+esc108(cc)+'</span>'}
function status108(p){var st=s(p&&p[5]),txt='Sin disponibilidad',cl='gs-sin';if(st==='ok'||st==='ok_requested'){txt='Con existencia en SEUS';cl='gs-ok'}else if(st==='ok_inv'){txt='Con existencia según inventario actual';cl='gs-ok'}else if(st==='camino'){txt='En traslado';cl='gs-camino'}else if(st==='requested'||st==='requested_nostock'){txt='Solicitud realizada';cl='gs-requested'}else if(st==='available'){txt='Puedes solicitar en CENDIS';cl='gs-available'}else if(st==='nd'){txt='Sin registro SEUS';cl='gs-nd'}return {text:txt,cls:cl,covered:st==='ok'||st==='ok_requested'||st==='ok_inv'}}
function guideStateMap108(){var out={};try{(DB&&Array.isArray(DB.G)?DB.G:[]).forEach(function(g){var gc=s(g&&g[0]);(Array.isArray(g&&g[3])?g[3]:[]).forEach(function(p){var f=s(p&&p[0]||'3'),c=code108(p&&p[2]),st=s(p&&p[3]||'Sin dato');out[gc+'|'+c+'|'+f]=st})})}catch(_){}return out}
function guideStateBadge108(st){var n=norm(st),cl=n==='ACTIVO'?'cr':n==='TESTEO'?'a':n==='INACTIVO'?'sr':'b';return '<span class="tag '+cl+'">'+esc108(st||'Sin dato')+'</span>'}
function modal108(){var back=document.getElementById('v80ModalBack');if(!back){back=document.createElement('div');back.id='v80ModalBack';back.className='v80ModalBack';back.innerHTML='<div class="v80Modal" role="dialog" aria-modal="true"><div class="v80ModalHead"><div><h3 id="v80ModalTitle"></h3><p id="v80ModalSub"></p></div><button type="button" class="v80ModalClose" aria-label="Cerrar">×</button></div><div class="v80ModalBody" id="v80ModalBody"></div></div>';document.body.appendChild(back)}var close=back.querySelector('.v80ModalClose');if(close)close.onclick=function(){back.classList.remove('on');document.body.style.overflow=''};return back}
function openModal108(title,sub,html){var b=modal108(),t=document.getElementById('v80ModalTitle'),s1=document.getElementById('v80ModalSub'),body=document.getElementById('v80ModalBody');if(t)t.textContent=title;if(s1)s1.textContent=sub||'';if(body){body.innerHTML=html;body.scrollTop=0}b.classList.add('on');document.body.style.overflow='hidden';setTimeout(function(){decorateOpenDetails108();},0)}

function floorRows108(floor){var st=(typeof S!=='undefined'&&S&&S[CUR])||{},gm=guideStateMap108(),rows=[];(Array.isArray(st.guias)?st.guias:[]).forEach(function(g){var gc=s(g&&g[0]),gn=s(g&&g[1]||'Guía'),gcat=s(g&&g[2]||'');(Array.isArray(g&&g[6])?g[6]:[]).forEach(function(p){var pf=s(p&&p[1]||'3');if(pf!==String(floor))return;var c=code108(p&&p[0]),prod=product108(c),stt=status108(p);rows.push({code:c,name:s(p&&p[6]||prod.n||c),cc:class108(c),cat:s(prod.cat||'—'),lin:s(prod.lin||'—'),sub:s(prod.sub||'—'),guideCode:gc,guideName:gn,guideCat:gcat,guideState:gm[gc+'|'+c+'|'+pf]||'Sin dato',status:stt.text,statusClass:stt.cls,covered:stt.covered,canSum:p&&p[2],inv:num108(p&&p[11]),canMin:p&&p[3],cendis:p&&p[9]?num108(p&&p[4]):null})})});return rows}
function unique108(rows,key){return Array.from(new Set(rows.map(function(r){return s(r[key]).trim()}).filter(Boolean))).sort(function(a,b){return a.localeCompare(b,'es')})}
function opts108(arr){return '<option value="">Todos</option>'+arr.map(function(v){return '<option value="'+esc108(norm(v))+'">'+esc108(v)+'</option>'}).join('')}
function applyFloorFilters108(){var body=document.getElementById('v80ModalBody');if(!body)return;var q=norm((body.querySelector('[data-v108-q]')||{}).value||''),cl=(body.querySelector('[data-v108-class]')||{}).value||'',cat=(body.querySelector('[data-v108-cat]')||{}).value||'',lin=(body.querySelector('[data-v108-lin]')||{}).value||'',sub=(body.querySelector('[data-v108-sub]')||{}).value||'',shown=0;body.querySelectorAll('.v108FloorTable tbody tr[data-code]').forEach(function(tr){var ok=(!q||norm(tr.textContent).indexOf(q)>=0)&&(!cl||tr.dataset.class===cl)&&(!cat||tr.dataset.cat===cat)&&(!lin||tr.dataset.lin===lin)&&(!sub||tr.dataset.sub===sub);tr.classList.toggle('v108-filtered-out',!ok);if(ok)shown++});var c=body.querySelector('[data-v108-count]');if(c)c.textContent=fi108(shown)+' productos'}
window.clearFloorFilters108=function(){var body=document.getElementById('v80ModalBody');if(!body)return;body.querySelectorAll('.v108HierarchyFilters input,.v108HierarchyFilters select').forEach(function(x){x.value=''});applyFloorFilters108()}
window.openAmbFloorDetail108=function(floor){var rows=floorRows108(floor),covered=rows.filter(function(r){return r.covered}).length,unique=new Set(rows.map(function(r){return r.code})).size,pending=Math.max(0,rows.length-covered),st=(typeof S!=='undefined'&&S&&S[CUR])||{},title='Ambientes · Piso '+floor+(String(floor)==='3'?' · Informativo':'');var filters='<div class="v108HierarchyFilters"><div class="v108Field"><label>Búsqueda rápida</label><input data-v108-q type="search" placeholder="Código, producto o ambiente..."></div><div class="v108Field"><label>Clasificación</label><select data-v108-class>'+opts108(unique108(rows,'cc'))+'</select></div><div class="v108Field"><label>Categoría</label><select data-v108-cat>'+opts108(unique108(rows,'cat'))+'</select></div><div class="v108Field"><label>Línea</label><select data-v108-lin>'+opts108(unique108(rows,'lin'))+'</select></div><div class="v108Field"><label>Sublínea</label><select data-v108-sub>'+opts108(unique108(rows,'sub'))+'</select></div><div class="v108Field"><label>Acción</label><button type="button" onclick="clearFloorFilters108()">Limpiar filtros</button></div><div class="v108Count" data-v108-count>'+fi108(rows.length)+' productos</div></div>';var trs=rows.map(function(r){return '<tr data-code="'+esc108(r.code)+'" data-class="'+esc108(norm(r.cc))+'" data-cat="'+esc108(norm(r.cat))+'" data-lin="'+esc108(norm(r.lin))+'" data-sub="'+esc108(norm(r.sub))+'" onclick="if(typeof openGuideProduct===\'function\')openGuideProduct('+JSON.stringify(r.code)+');else if(typeof openInventoryProduct===\'function\')openInventoryProduct('+JSON.stringify(r.code)+')"><td>'+((typeof imageThumb==='function')?imageThumb(r.code,'sm'):'')+'</td><td><span class="code">'+esc108(r.code)+'</span></td><td class="prod"><b>'+esc108(r.name)+'</b></td><td>'+badge108(r.cc)+'</td><td class="hier">'+esc108(r.cat)+'</td><td class="hier">'+esc108(r.lin)+'</td><td class="hier">'+esc108(r.sub)+'</td><td class="guide"><b>'+esc108(r.guideName)+'</b><small>'+esc108(r.guideCode)+' · '+esc108(r.guideCat)+'</small></td><td>'+guideStateBadge108(r.guideState)+'</td><td class="state"><span class="guideStatus '+r.statusClass+'">'+esc108(r.status)+'</span></td><td class="num">'+(r.canSum==null?'Sin dato':fi108(r.canSum))+'</td><td class="num">'+fi108(r.inv)+'</td><td class="num">'+(r.canMin==null?'Sin dato':fi108(r.canMin))+'</td><td class="num">'+(r.cendis==null?'Sin dato':fi108(r.cendis)+' u')+'</td></tr>'}).join('');var html='<div class="v108FloorSummary"><div class="v108FloorKpi"><label>Posiciones</label><b>'+fi108(rows.length)+'</b><small>Piso '+floor+'</small></div><div class="v108FloorKpi"><label>Productos únicos</label><b>'+fi108(unique)+'</b><small>Referencias distintas</small></div><div class="v108FloorKpi"><label>Con existencia</label><b>'+fi108(covered)+'</b><small>Posiciones cubiertas</small></div><div class="v108FloorKpi"><label>'+((String(floor)==='3')?'Sin existencia':'Pendientes')+'</label><b>'+fi108(pending)+'</b><small>'+((String(floor)==='3')?'Informativo':'Por cubrir')+'</small></div></div>'+filters+'<div class="v108FloorTableWrap"><table class="v108FloorTable"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Clasificación</th><th>Categoría</th><th>Línea</th><th>Sublínea</th><th>Guía / Ambiente</th><th>Estado guía</th><th>Estado cobertura</th><th class="num">CAN SUM</th><th class="num">Inventario actual</th><th class="num">CAN MIN</th><th class="num">CENDIS</th></tr></thead><tbody>'+(trs||'<tr><td colspan="14"><div class="empty">No hay productos para este piso.</div></td></tr>')+'</tbody></table></div>';openModal108(title,(st.name||CUR)+' · '+(String(floor)==='3'?'Piso informativo; no afecta cumplimiento':'Detalle de posiciones y cobertura'),html);var body=document.getElementById('v80ModalBody');if(body){body.querySelectorAll('.v108HierarchyFilters input,.v108HierarchyFilters select').forEach(function(x){x.addEventListener(x.tagName==='INPUT'?'input':'change',applyFloorFilters108)})}}

function installFloorCards108(){if(typeof VIEW==='undefined'||VIEW!=='amb')return;var content=document.getElementById('content');if(!content)return;var grids=Array.from(content.querySelectorAll('.guideFloorGrid'));var grid=grids.find(function(g){return g.children&&g.children.length>=3});if(!grid)return;Array.from(grid.querySelectorAll(':scope > .guideFloorCard')).slice(0,3).forEach(function(card,i){if(card.dataset.v108FloorBound==='1')return;card.dataset.v108FloorBound='1';card.dataset.v108Floor=String(i+1);card.classList.add('v108FloorClickable');card.setAttribute('role','button');card.tabIndex=0;card.addEventListener('click',function(){window.openAmbFloorDetail108(this.dataset.v108Floor)});card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();this.click()}})})}

/* Filtros jerárquicos universales: se agregan sin quitar columnas ni reemplazar filtros existentes. */
function rowCode108(tr){var c=tr.dataset.code||tr.dataset.productCode||tr.dataset.v68Product||'';if(c)return code108(c);var cell=tr.querySelector('.code');if(cell)return code108(cell.textContent);var m=s(tr.textContent).match(/\b\d{6,8}\b/);return m?code108(m[0]):''}
function existingLabel108(body,label){var n=norm(label);return Array.from(body.querySelectorAll('label')).some(function(l){return norm(l.textContent)===n})}
function addHierarchyFilters108(modal){if(!modal||!modal.classList.contains('on'))return;var body=modal.querySelector('#rangeModalBody,#v80ModalBody,#guideDetailBodyV49,#guideDetailBodyV48,.modalBody');if(!body||body.querySelector('[data-v108-hierarchy]'))return;var tables=Array.from(body.querySelectorAll('table')),items=[];tables.forEach(function(table){Array.from(table.tBodies&&table.tBodies[0]?table.tBodies[0].rows:[]).forEach(function(tr){if(tr.querySelector('.empty'))return;var c=rowCode108(tr);if(!c)return;var p=product108(c);tr.dataset.v108Class=norm(class108(c));tr.dataset.v108Cat=norm(p.cat||'—');tr.dataset.v108Lin=norm(p.lin||'—');tr.dataset.v108Sub=norm(p.sub||'—');items.push(tr)})});if(items.length<2)return;var vals=function(key){return Array.from(new Set(items.map(function(r){return s(r.dataset[key]).trim()}).filter(function(v){return v&&v!=='—'}))).sort(function(a,b){return a.localeCompare(b,'es')})};var defs=[['v108Class','Clasificación'],['v108Cat','Categoría'],['v108Lin','Línea'],['v108Sub','Sublínea']].filter(function(d){return !existingLabel108(body,d[1])&&vals(d[0]).length>1});if(!defs.length)return;var hasSearch=!!body.querySelector('input[type="search"],input[placeholder*="Buscar"],input[placeholder*="buscar"]'),bar=document.createElement('div');bar.className='v108HierarchyFilters';bar.dataset.v108Hierarchy='1';bar.innerHTML=(hasSearch?'':'<div class="v108Field"><label>Búsqueda rápida</label><input type="search" data-v108-gq placeholder="Código o producto..."></div>')+defs.map(function(d){return '<div class="v108Field"><label>'+d[1]+'</label><select data-v108-gfilter="'+d[0]+'">'+opts108(vals(d[0]))+'</select></div>'}).join('')+'<div class="v108Field"><label>Acción</label><button type="button" data-v108-gclear>Limpiar filtros</button></div><div class="v108Count" data-v108-gcount></div>';var first=tables[0],anchor=first.closest('.ux104DetailTableWrap,.v80TableWrap,.guideFloorTableWrapV50,.guideModalTableWrapV48,.guideDetailTableWrapV49')||first.parentElement||first;anchor.parentNode.insertBefore(bar,anchor);function apply(){var q=norm((bar.querySelector('[data-v108-gq]')||{}).value||''),sels=Array.from(bar.querySelectorAll('[data-v108-gfilter]')),shown=0;items.forEach(function(r){var ok=!q||norm(r.textContent).indexOf(q)>=0;if(ok)sels.forEach(function(sel){if(sel.value&&r.dataset[sel.dataset.v108Gfilter]!==sel.value)ok=false});r.classList.toggle('v108-filtered-out',!ok);if(ok)shown++});var c=bar.querySelector('[data-v108-gcount]');if(c)c.textContent=fi108(shown)+' de '+fi108(items.length)+' productos'}var qi=bar.querySelector('[data-v108-gq]');if(qi)qi.addEventListener('input',apply);bar.querySelectorAll('select').forEach(function(x){x.addEventListener('change',apply)});bar.querySelector('[data-v108-gclear]').onclick=function(){if(qi)qi.value='';bar.querySelectorAll('select').forEach(function(x){x.value=''});items.forEach(function(r){r.classList.remove('v108-filtered-out')});apply()};apply()}
function decorateOpenDetails108(){document.querySelectorAll('#rangeModal.on,#v80ModalBack.on,#guideDetailModalBackV49.on,#guideDetailModalBackV48.on,.modalBack.on').forEach(addHierarchyFilters108)}
function schedule108(){requestAnimationFrame(function(){setTimeout(function(){installFloorCards108();decorateOpenDetails108();},0)})}

/* Reaplica tras cualquier render sin usar observadores globales. */
var oldSet108=window.setView;if(typeof oldSet108==='function'&&!oldSet108.__v108){var setW=function(){var o=oldSet108.apply(this,arguments);schedule108();return o};setW.__v108=true;window.setView=setW}
var oldRefresh108=window.refresh;if(typeof oldRefresh108==='function'&&!oldRefresh108.__v108){var refW=function(){var o=oldRefresh108.apply(this,arguments);schedule108();return o};refW.__v108=true;window.refresh=refW}
var oldGuias108=window.drawGuias;if(typeof oldGuias108==='function'&&!oldGuias108.__v108){var gW=function(){var o=oldGuias108.apply(this,arguments);schedule108();return o};gW.__v108=true;window.drawGuias=gW}
document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('[onclick],button,[role="button"],tbody tr'))setTimeout(decorateOpenDetails108,0)},true);
function mark108(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='14/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 14/08/2026 · '+VERSION}catch(_){}}
mark108();schedule108();
})();


/* ==== llaveroV86117Script ==== */

(function(){
'use strict';
if(window.__LLAVERO_V86117__)return;window.__LLAVERO_V86117__=true;
var VERSION='V86.117',scheduled=0;
function s(v){return v==null?'':String(v)}
function n(v){var x=Number(v);return Number.isFinite(x)?x:0}
function norm(v){var x=s(v).trim().toUpperCase();try{return x.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(_){return x}}
function esc(v){return s(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c})}
function fi(v){try{return typeof fInt==='function'?fInt(n(v)):Math.round(n(v)).toLocaleString('es-CO')}catch(_){return String(Math.round(n(v)))}}
function st(){try{return (typeof S!=='undefined'&&S&&typeof CUR!=='undefined'&&S[CUR])?S[CUR]:{}}catch(_){return{}}}
function p(code){try{return (typeof P!=='undefined'&&P&&P[code])?P[code]:{}}catch(_){return{}}}
function thumb(code){try{return typeof imageThumb==='function'?imageThumb(code,'sm'):''}catch(_){return''}}
function transferStatus(r){var e=norm(r&&r.estatus);if(e.indexOf('ENTREG')>=0)return'Entregado';if(e.indexOf('PICK')>=0)return'En picking';if(e.indexOf('RUTA')>=0)return'En ruta';if(e.indexOf('PEND')>=0)return'Pendiente';var a=norm(r&&r.statusGlobalPicking),m=norm(r&&r.statusMovimiento),w=norm(r&&r.lugarPuestaDispos);if(a==='C'&&m==='C')return'Entregado';if(a==='C'&&m==='A')return'En ruta';if(a==='A'&&m==='A'&&w.indexOf('WMS')>=0)return'En picking';return'Pendiente'}
function pendingRows(){return (Array.isArray(st().trDetalle)?st().trDetalle:[]).filter(function(r){return transferStatus(r)==='Pendiente'})}
function fallbackConditionSets(){var rot=new Set(),evac=new Set();(Array.isArray(st().inventario)?st().inventario:[]).forEach(function(r){var c=s(r.codigo),es=norm(r.estadoAbastecimiento),ranges=r.rangos||{},old=Object.keys(ranges).some(function(k){var m=s(k).match(/(\d+)/);return m&&Number(m[1])>=91&&n(ranges[k])>0});if(es==='N')evac.add(c);else if(['A','O','T'].indexOf(es)>=0&&old)rot.add(c)});return{rot:rot,evac:evac}}
function impactSets(){var store=st();if((!Array.isArray(store.guias)||!store.guias.length)&&typeof window.llaveroRebuildAllGuideData==='function'){try{window.llaveroRebuildAllGuideData();store=st()}catch(_){}}
 var pend=pendingRows(),pendingCodes=new Set(pend.map(function(r){return s(r.codigo)})),rot=new Set(),evac=new Set();
 try{if(typeof window.aggregateModuleProducts71==='function'){(window.aggregateModuleProducts71('rot',store)||[]).forEach(function(r){rot.add(s(r.c))});(window.aggregateModuleProducts71('evac',store)||[]).forEach(function(r){evac.add(s(r.c))})}else{var fb=fallbackConditionSets();rot=fb.rot;evac=fb.evac}}catch(_){var fb2=fallbackConditionSets();rot=fb2.rot;evac=fb2.evac}
 var amb=new Set();(Array.isArray(store.guias)?store.guias:[]).forEach(function(g){(Array.isArray(g&&g[6])?g[6]:[]).forEach(function(x){if(x&&x[5]==='camino')amb.add(s(x[0]))})});
 function onlyPending(set){return new Set(Array.from(set).filter(function(c){return pendingCodes.has(c)}))}
 rot=onlyPending(rot);evac=onlyPending(evac);amb=onlyPending(amb);var all=new Set([].concat(Array.from(rot),Array.from(evac),Array.from(amb)));
 return{rows:pend,rot:rot,evac:evac,amb:amb,all:all};
}
function cleanupTransferDetailColumn(){document.querySelectorAll('table.deliveryView8615').forEach(function(table){var hs=Array.from(table.querySelectorAll('thead th')),idx=hs.findIndex(function(h){return norm(h.textContent)==='DETALLE'});if(idx<0)return;hs[idx].remove();Array.from(table.querySelectorAll('tbody tr')).forEach(function(tr){if(tr.children&&tr.children[idx])tr.children[idx].remove()})})}
function patchTransferCard(){cleanupTransferDetailColumn();if((typeof VIEW!=='undefined'?VIEW:'')!=='traslados')return;var root=document.getElementById('content');if(!root)return;var x=impactSets(),card=Array.from(root.querySelectorAll('.transferMetricCard8616')).find(function(b){var l=b.querySelector('.transferMetricLabel8616');return l&&/Productos críticos|Productos con impacto/i.test(l.textContent||'')});if(!card)return;var lab=card.querySelector('.transferMetricLabel8616'),val=card.querySelector('strong'),sub=card.querySelector('small');if(lab)lab.textContent='Productos con impacto por entregar';if(val)val.textContent=fi(x.all.size);if(sub)sub.textContent=fi(x.rot.size)+' Rotación · '+fi(x.evac.size)+' Evacuación · '+fi(x.amb.size)+' Ambientes';card.dataset.transferKind='impact117';card.setAttribute('aria-label','Productos con impacto por entregar: '+fi(x.all.size)+' productos únicos de órdenes Pendiente, En picking o En ruta');card.onclick=function(e){if(e)e.preventDefault();window.openTransferImpact117()};}
function invFor(code){var arr=Array.isArray(st().inventario)?st().inventario:[],r=arr.find(function(x){return s(x.codigo)===s(code)});return r||{}}
function openRange(title,subtitle,html){var modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle');if(!modal||!body)return false;if(tt)tt.textContent=title;if(ss)ss.textContent=subtitle;body.innerHTML=html;modal.classList.add('on');return true}
window.openTransferImpact117=function(){var x=impactSets(),by={};x.rows.forEach(function(r){var c=s(r.codigo);if(!x.all.has(c))return;var o=by[c]||(by[c]={code:c,name:s(r.nombre)||s(p(c).n)||c,orders:new Set(),statuses:new Set(),units:0,rot:x.rot.has(c),evac:x.evac.has(c),amb:x.amb.has(c)});o.orders.add(s(r.entrega));o.statuses.add(transferStatus(r));o.units+=n(r.unidades)});var rows=Object.keys(by).map(function(k){return by[k]}).sort(function(a,b){var ai=(a.evac?4:0)+(a.amb?2:0)+(a.rot?1:0),bi=(b.evac?4:0)+(b.amb?2:0)+(b.rot?1:0);return bi-ai||a.name.localeCompare(b.name,'es')});var orderCount=new Set();rows.forEach(function(r){r.orders.forEach(function(o){orderCount.add(o)})});
 function impactHtml(r){var a=[];if(r.rot)a.push('<span class="v117ImpactTag rot">Rotación</span>');if(r.evac)a.push('<span class="v117ImpactTag evac">Evacuación</span>');if(r.amb)a.push('<span class="v117ImpactTag amb">Ambientes</span>');return'<div class="v117ImpactTags">'+a.join('')+'</div>'}
 var trs=rows.map(function(r){var pr=p(r.code),iv=invFor(r.code),cc=pr.cc||'SIN CLASIFICACIÓN',q=norm([r.code,r.name,cc,pr.cat,pr.lin,pr.sub,Array.from(r.orders).join(' '),Array.from(r.statuses).join(' '),r.rot?'ROTACION':'',r.evac?'EVACUACION':'',r.amb?'AMBIENTES':''].join(' '));return'<tr data-q="'+esc(q)+'" data-impact="'+(r.evac?'evac':r.rot?'rot':r.amb?'amb':'')+'" data-rot="'+(r.rot?'1':'0')+'" data-evac="'+(r.evac?'1':'0')+'" data-amb="'+(r.amb?'1':'0')+'" data-class="'+esc(norm(cc))+'" data-status="'+esc(norm(Array.from(r.statuses).join('|')))+'"><td>'+thumb(r.code)+'</td><td><span class="code">'+esc(r.code)+'</span></td><td><b>'+esc(r.name)+'</b><br><small>'+esc([pr.cat,pr.lin,pr.sub].filter(Boolean).join(' · '))+'</small></td><td>'+esc(cc)+'</td><td>'+impactHtml(r)+'</td><td>'+esc(Array.from(r.orders).join(' · '))+'</td><td>'+esc(Array.from(r.statuses).join(' · '))+'</td><td class="num"><b>'+fi(r.units)+'</b></td><td class="num">'+fi(n(iv.dispCendis!=null?iv.dispCendis:pr.dispCendis))+' u</td></tr>'}).join('');
 var html='<div class="v117TransferSummary"><div><label>Productos únicos</label><b>'+fi(rows.length)+'</b></div><div><label>Rotación</label><b>'+fi(x.rot.size)+'</b></div><div><label>Evacuación</label><b>'+fi(x.evac.size)+'</b></div><div><label>Ambientes</label><b>'+fi(x.amb.size)+'</b></div><div><label>Órdenes involucradas</label><b>'+fi(orderCount.size)+'</b></div></div><div class="v117TransferFilters"><div class="v117TransferField"><label>Buscar</label><input id="v117TrQ" type="search" placeholder="Código, producto u orden..."></div><div class="v117TransferField"><label>Impacto</label><select id="v117TrImpact"><option value="all">Todos</option><option value="rot">Rotación</option><option value="evac">Evacuación</option><option value="amb">Ambientes</option></select></div><div class="v117TransferField"><label>Clasificación</label><select id="v117TrClass"><option value="all">Todas</option><option value="CORE">CORE</option><option value="COMPLEMENTO">COMPLEMENTO</option><option value="SIN CLASIFICACION">SIN CLASIFICACIÓN</option></select></div><div class="v117TransferField"><label>Estado traslado</label><select id="v117TrStatus"><option value="all">Todos</option><option value="PENDIENTE">Pendiente</option><option value="EN PICKING">En picking</option><option value="EN RUTA">En ruta</option></select></div><div class="v117TransferField"><label>Acción</label><button type="button" id="v117TrClear">Limpiar filtros</button></div></div><div class="v117TransferWrap"><table class="v117TransferTable"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Clasificación</th><th>Impacto</th><th>Órdenes</th><th>Estado traslado</th><th class="num">Uds. pendientes</th><th class="num">CENDIS</th></tr></thead><tbody>'+(trs||'<tr><td colspan="9"><div class="empty">No hay productos pendientes con impacto identificado.</div></td></tr>')+'</tbody></table></div><div class="foot"><span id="v117TrCount">'+fi(rows.length)+' productos únicos</span><span>El total no duplica productos aunque un mismo código impacte más de una categoría.</span></div>';
 if(!openRange('Traslados · productos con impacto por entregar',(st().name||CUR)+' · solo órdenes Pendiente, En picking o En ruta',html))return;
 function apply(){var body=document.getElementById('rangeModalBody'),q=norm((document.getElementById('v117TrQ')||{}).value||''),im=(document.getElementById('v117TrImpact')||{}).value||'all',cl=(document.getElementById('v117TrClass')||{}).value||'all',sta=(document.getElementById('v117TrStatus')||{}).value||'all',shown=0;if(!body)return;body.querySelectorAll('.v117TransferTable tbody tr[data-q]').forEach(function(tr){var ok=(!q||s(tr.dataset.q).indexOf(q)>=0)&&(cl==='all'||tr.dataset.class===cl)&&(sta==='all'||s(tr.dataset.status).indexOf(sta)>=0);if(ok&&im!=='all')ok=tr.dataset[im]==='1';tr.style.display=ok?'':'none';if(ok)shown++});var c=document.getElementById('v117TrCount');if(c)c.textContent=fi(shown)+' productos únicos'}
 ['v117TrQ','v117TrImpact','v117TrClass','v117TrStatus'].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener(id==='v117TrQ'?'input':'change',apply)});var clear=document.getElementById('v117TrClear');if(clear)clear.onclick=function(){['v117TrQ','v117TrImpact','v117TrClass','v117TrStatus'].forEach(function(id,i){var el=document.getElementById(id);if(el)el.value=i===0?'':'all'});apply()};
};

function guideState(code){var sub=document.getElementById('guideDetailSubV49'),gcode=s(sub&&sub.textContent).split(' · ')[0].trim(),state='Sin dato';try{if(typeof G!=='undefined'&&Array.isArray(G)){var g=G.find(function(x){return s(x&&x[0])===gcode});if(g&&Array.isArray(g[3])){var pr=g[3].find(function(x){return s(x&&x[2])===s(code)});if(pr&&pr[3])state=s(pr[3])}}}catch(_){}var k=norm(state).toLowerCase(),cl=k==='activo'?'activo':k==='testeo'?'testeo':k==='inactivo'?'inactivo':k==='novedad'?'novedad':'otro';return'<span class="v117GuideState '+cl+'">'+esc(state)+'</span>'}
function headerIndex(table,label){var hs=Array.from(table.querySelectorAll('thead th')).map(function(h){return norm(h.textContent)}),target=norm(label),i=hs.indexOf(target);if(i>=0)return i;return hs.findIndex(function(x){return x.indexOf(target)>=0})}
function compactGuideSales(body){var box=body.querySelector('#guideSalesSummary78');if(!box||box.dataset.v117)return;box.dataset.v117='1';var cards=Array.from(box.querySelectorAll('.guideSalesCard78')),scope=box.querySelector('.guideSalesScope78'),note=box.querySelector('.guideSalesNote78');if(cards.length<5)return;var main=[cards[0],cards[3],cards[4]],extra=[cards[1],cards[2]],title=document.createElement('div');title.className='v117GuideSalesTitle';title.innerHTML='<b>Contexto de venta de la guía</b><span>Venta acumulada real de 3 meses; tendencia mensual estimada disponible como información adicional.</span>';var grid=document.createElement('div');grid.className='v117GuideSalesGrid';main.forEach(function(c){grid.appendChild(c)});var det=document.createElement('details');det.className='v117GuideSalesDetails';det.innerHTML='<summary>Ver distribución mensual y variación estimada</summary><div class="v117GuideSalesDetailsGrid"></div>';var eg=det.querySelector('.v117GuideSalesDetailsGrid');extra.forEach(function(c){eg.appendChild(c)});if(scope)det.appendChild(scope);if(note)det.appendChild(note);box.className='v117GuideCompactSales';box.innerHTML='';box.appendChild(title);box.appendChild(grid);box.appendChild(det)}
function rebuildGuideTables(body){body.querySelectorAll('.guideFloorTableV50').forEach(function(table){if(table.dataset.v117==='1')return;var idx={img:headerIndex(table,'IMAGEN'),code:headerIndex(table,'CÓDIGO'),prod:headerIndex(table,'PRODUCTO'),sum:headerIndex(table,'CAN SUM'),inv:headerIndex(table,'INVENTARIO ACTUAL'),min:headerIndex(table,'CAN MIN'),cendis:headerIndex(table,'DISPO CENDIS'),status:headerIndex(table,'ESTADO'),sale:headerIndex(table,'VENTA 3 MESES'),gstate:headerIndex(table,'ESTADO GUÍA')};var trs=Array.from(table.querySelectorAll('tbody tr[data-product-code]'));trs.forEach(function(tr){var cells=Array.from(tr.children),code=s(tr.dataset.productCode),pr=p(code),cc=s(pr.cc||'SIN CLASIFICACIÓN'),ccn=norm(cc),cccl=ccn==='CORE'?'core':ccn.indexOf('COMPLEMENT')>=0?'comp':'none',img=idx.img>=0&&cells[idx.img]?cells[idx.img].innerHTML:thumb(code),name=idx.prod>=0&&cells[idx.prod]?(cells[idx.prod].querySelector('.guideProductName')||cells[idx.prod]).textContent.trim():s(pr.n||code),sum=idx.sum>=0&&cells[idx.sum]?cells[idx.sum].textContent.trim():'—',inv=idx.inv>=0&&cells[idx.inv]?cells[idx.inv].textContent.trim():'0',req=idx.min>=0&&cells[idx.min]?cells[idx.min].textContent.trim():'—',cendis=idx.cendis>=0&&cells[idx.cendis]?cells[idx.cendis].textContent.trim():'—',status=idx.status>=0&&cells[idx.status]?cells[idx.status].innerHTML:'—',sale=idx.sale>=0&&cells[idx.sale]?cells[idx.sale].innerHTML:'—';tr.innerHTML='<td>'+img+'</td><td><span class="code">'+esc(code)+'</span></td><td><div class="guideProductName">'+esc(name)+'</div></td><td class="v117HierarchyCell"><b><span class="v117ClassPill '+cccl+'">'+esc(cc)+'</span></b><small>'+esc([pr.cat,pr.lin,pr.sub].filter(Boolean).join(' · ')||'Sin jerarquía')+'</small></td><td data-v8680-guide-state="1">'+guideState(code)+'</td><td>'+status+'</td><td class="v117ExistCell"><b>Inventario '+esc(inv)+'</b><span>SEUS '+esc(sum)+'</span></td><td class="num">'+esc(req)+'</td><td class="num">'+esc(cendis)+'</td><td class="num">'+sale+'</td>'});var head=table.querySelector('thead tr');if(head)head.innerHTML='<th>Imagen</th><th>Código</th><th>Producto</th><th>Clasificación / Categoría / Línea / Sublínea</th><th data-v8680-guide-state="1">Estado guía</th><th>Cobertura</th><th>Existencia tienda</th><th class="num">Requerido</th><th class="num">CENDIS</th><th class="num">Venta 3 meses</th>';table.classList.add('v117GuideTable');table.dataset.v117='1'})}
function mergeGuideFilters(body){var nativeBar=body.querySelector('.guideModalToolbarV48'),hier=body.querySelector('.v108HierarchyFilters');if(nativeBar&&hier&&!nativeBar.contains(hier))nativeBar.appendChild(hier)}
function removeExactDuplicateFields(body){if(!body)return;var bars=Array.from(body.querySelectorAll('.v8695MdFilters,.v8698ClassFilters,.v8664DetailTools,.v866Filters,.v866ListFilters,.v80Filters,.guideModalToolbarV48,.v108HierarchyFilters,.ux104Filters')),seen={};bars.forEach(function(bar){var fields=Array.from(bar.querySelectorAll(':scope > label,:scope > .v108Field,:scope > .ux104Field,:scope > .v8695MdField,:scope > .v8618Field'));fields.forEach(function(f){var l=f.querySelector?f.querySelector('label'):null,txt=norm(l?l.textContent:'');if(!txt||txt==='ACCION')return;if(seen[txt]&&(bar.classList.contains('v108HierarchyFilters')||bar.classList.contains('ux104Filters')))f.remove();else seen[txt]=true})});bars.filter(function(b){return b.classList.contains('v108HierarchyFilters')||b.classList.contains('ux104Filters')}).forEach(function(b){var useful=Array.from(b.children).some(function(c){return c.querySelector&&c.querySelector('input,select')});if(!useful)b.remove()});var nov=Array.from(body.querySelectorAll('label')).find(function(l){return norm(l.textContent)==='ESTADO NOVEDAD'});if(nov){body.querySelectorAll('button,.chip').forEach(function(x){var t=norm(x.textContent);if(t==='SOLO O'||t==='SOLO T')x.remove()});body.querySelectorAll('.v8680NovelToggle').forEach(function(x){if(!x.children.length)x.remove()})}}
function patchGuideDetail(){var body=document.getElementById('guideDetailBodyV49');if(!body)return;removeExactDuplicateFields(body)}
function patchMarkdownPolicy(){if((typeof VIEW!=='undefined'?VIEW:'')!=='markdown')return;var root=document.getElementById('content');if(!root)return;root.querySelectorAll('.v8681PolicyCard').forEach(function(card){var label=norm((card.querySelector('.v8666PolicyHead b')||{}).textContent||card.textContent),cc=label.indexOf('COMPLEMENT')>=0?'COMPLEMENTO':'CORE',kind=label.indexOf('EVAC')>=0?'evac':'rot';card.type='button';card.style.cursor='pointer';card.setAttribute('role','button');card.onclick=function(e){if(e){e.preventDefault();e.stopPropagation()}if(window.V8695&&typeof window.V8695.policy==='function')window.V8695.policy(cc,kind);else if(window.V8694&&typeof window.V8694.policy==='function')window.V8694.policy(cc,kind);setTimeout(function(){var b=document.getElementById('rangeModalBody');removeExactDuplicateFields(b)},30)}})}
function cleanupOpenModals(){cleanupTransferDetailColumn();['rangeModalBody','v80ModalBody','guideDetailBodyV49','guideDetailBodyV48'].forEach(function(id){removeExactDuplicateFields(document.getElementById(id))})}
function mark(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='18/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 18/08/2026 · '+VERSION}catch(_){}}
function patchAll(){patchTransferCard();patchMarkdownPolicy();cleanupOpenModals();mark()}
function schedule(delay){clearTimeout(scheduled);scheduled=setTimeout(patchAll,delay==null?60:delay)}
function install(){if(!window.__LLAVERO_BOOTSTRAPPED__||typeof window.setView!=='function'){setTimeout(install,100);return}var sv=window.setView,rf=window.refresh,dm=window.drawMarkdown8617,dt=window.drawTr8615||window.drawTr,rg=window.renderGuideDetailV49,og=window.openGuideDetailV49;if(typeof sv==='function'&&!sv.__v117){var w=function(){var o=sv.apply(this,arguments);schedule(70);return o};w.__v117=true;window.setView=w}if(typeof rf==='function'&&!rf.__v117){var wr=function(){var o=rf.apply(this,arguments);schedule(70);return o};wr.__v117=true;window.refresh=wr}if(typeof dm==='function'&&!dm.__v117){var wm=function(){var o=dm.apply(this,arguments);setTimeout(patchMarkdownPolicy,40);return o};wm.__v117=true;window.drawMarkdown8617=wm}if(typeof dt==='function'&&!dt.__v117){var wt=function(){var o=dt.apply(this,arguments);setTimeout(patchTransferCard,40);return o};wt.__v117=true;window.drawTr8615=window.drawTr=wt}if(typeof rg==='function'&&!rg.__v117){var wg=function(){var o=rg.apply(this,arguments);setTimeout(patchGuideDetail,150);return o};wg.__v117=true;window.renderGuideDetailV49=wg}if(typeof og==='function'&&!og.__v117){var wo=function(){var o=og.apply(this,arguments);setTimeout(patchGuideDetail,180);return o};wo.__v117=true;window.openGuideDetailV49=window.openGuideDetailV48=wo}document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('.v8681PolicyCard,.transferMetricCard8616,.guideListRowV48,.guideQuickBtnV48,[data-v108-gclear]'))setTimeout(function(){cleanupOpenModals();patchGuideDetail()},190)},true);setTimeout(patchAll,220);mark();console.info('LLAVERO V86.117 · Traslados por impacto, Ambientes ordenado y Markdown clickeable')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,100)},{once:true});
})();


/* ==== llaveroV86119Script ==== */

(function(){
'use strict';
if(window.__LLAVERO_V86119__)return;window.__LLAVERO_V86118__=true;
var VERSION='V86.120',timers={};
function s(v){return v==null?'':String(v)}
function norm(v){var x=s(v).trim().toUpperCase();try{return x.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(_){return x}}
function esc(v){return s(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c})}
function num(v){var x=Number(v);return Number.isFinite(x)?x:0}
function fi(v){try{return typeof fInt==='function'?fInt(num(v)):Math.round(num(v)).toLocaleString('es-CO')}catch(_){return String(Math.round(num(v)))}}
function money(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(num(v)):typeof fMoney==='function'?fMoney(num(v)):'$ '+Math.round(num(v)).toLocaleString('es-CO')}catch(_){return '$ '+Math.round(num(v)).toLocaleString('es-CO')}}
function codeFromRow(tr){var c=tr.dataset.code||tr.dataset.productCode||tr.dataset.v68Product||'';if(c)return s(c).trim();var ce=tr.querySelector('.code');return ce?s(ce.textContent).trim():''}
function prod(c){try{return (typeof productInfo==='function'?productInfo(c):(P&&P[c]))||{n:c,cat:'—',lin:'—',sub:'—',cc:''}}catch(_){return {n:c,cat:'—',lin:'—',sub:'—',cc:''}}}
function cc(c){var x=norm(prod(c).cc);return x==='CORE'?'CORE':x.indexOf('COMPLEMENT')>=0?'COMPLEMENTO':'SIN CLASIFICACIÓN'}
function opts(vals,all){var out='<option value="">'+esc(all||'Todos')+'</option>';return out+vals.map(function(v){return '<option value="'+esc(v)+'">'+esc(v)+'</option>'}).join('')}
function uniq(a){return Array.from(new Set(a.filter(Boolean))).sort(function(a,b){return a.localeCompare(b,'es')})}
function headerInfo(table){return Array.from(table.querySelectorAll('thead th')).map(function(th,i){return {th:th,i:i,t:norm(th.textContent)}})}
function isMarkdownTable(table){var h=headerInfo(table).map(function(x){return x.t}).join('|');return /SUGERIDO|DESCUENTO|OFERTA|POLITICA|RESPONSABLE/.test(h)}
function isTransferOrderTable(table){var h=headerInfo(table).map(function(x){return x.t}).join('|');return /ORDEN/.test(h)&&/ESTADO/.test(h)&&!(/CODIGO/.test(h)&&/PRODUCTO/.test(h))}
function addImageIfNeeded(table){if(!table||isMarkdownTable(table)||isTransferOrderTable(table))return;var hs=headerInfo(table),ci=hs.find(function(x){return x.t==='CODIGO'});if(!ci||hs.some(function(x){return x.t==='IMAGEN'}))return;var th=document.createElement('th');th.textContent='Imagen';table.tHead.rows[0].insertBefore(th,table.tHead.rows[0].cells[ci.i]||null);Array.from(table.tBodies&&table.tBodies[0]?table.tBodies[0].rows:[]).forEach(function(tr){var c=codeFromRow(tr),td=document.createElement('td');try{td.innerHTML=typeof imageThumb==='function'?imageThumb(c,'sm'):''}catch(_){td.innerHTML=''}tr.insertBefore(td,tr.cells[ci.i]||null)})}
function unifyHierarchy(table){if(!table||table.dataset.v118Hierarchy==='1'||isMarkdownTable(table)||table.closest('#guideDetailBodyV49,#guideDetailBodyV48'))return;var hs=headerInfo(table),cat=hs.find(function(x){return x.t==='CATEGORIA'}),lin=hs.find(function(x){return x.t==='LINEA'}),sub=hs.find(function(x){return x.t==='SUBLINEA'});if(!cat||!lin||!sub)return;var inds=[cat.i,lin.i,sub.i].sort(function(a,b){return a-b}),keep=inds[0],drop=inds.slice(1).sort(function(a,b){return b-a});cat=hs.find(function(x){return x.i===keep});cat.th.textContent='Categoría / Línea / Sublínea';Array.from(table.tBodies&&table.tBodies[0]?table.tBodies[0].rows:[]).forEach(function(tr){var vals=inds.map(function(i){return tr.cells[i]?s(tr.cells[i].textContent).trim():''}),cell=tr.cells[keep];if(cell){cell.classList.add('v118HierarchyCell');cell.innerHTML='<b>'+esc(vals[0]||'—')+'</b><small>'+esc([vals[1],vals[2]].filter(Boolean).join(' · ')||'—')+'</small>'}drop.forEach(function(i){if(tr.cells[i])tr.deleteCell(i)})});drop.forEach(function(i){if(table.tHead.rows[0].cells[i])table.tHead.rows[0].deleteCell(i)});table.dataset.v118Hierarchy='1'}
function removeNovelDuplicates(body){if(!body)return;var has=Array.from(body.querySelectorAll('label')).some(function(l){return norm(l.textContent)==='ESTADO NOVEDAD'});if(!has)return;body.querySelectorAll('.v8680NovelToggle').forEach(function(x){x.remove()});body.querySelectorAll('button,.chip').forEach(function(x){var t=norm(x.textContent);if(t==='SOLO O'||t==='SOLO T')x.remove()})}
function filterBars(body){if(!body)return[];return Array.from(body.querySelectorAll('.v8695MdFilters,.v8698ClassFilters,.v8664DetailTools,.v866Filters,.v866ListFilters,.v80Filters,.v108HierarchyFilters,.ux104Filters,.v8664MixFilters,.v8692NovelFilters')).filter(function(b){return !b.closest('#guideDetailBodyV49,#guideDetailBodyV48')&&!b.classList.contains('v118UnifiedFilters')})}
function fieldKey(ctrl,wrap){var label=wrap&&wrap.querySelector&&wrap.querySelector('label');var t=norm(label&&label.textContent||'');if(t==='ACCION')return 'ACCION';if(t)return t;if(ctrl.matches('input[type="search"]')||/BUSCAR|CODIGO|PRODUCTO/.test(norm(ctrl.placeholder)))return'BUSQUEDA';return norm(ctrl.name||ctrl.id||ctrl.getAttribute('data-v108-gfilter')||ctrl.tagName)}
function modalTitleFor(body){var id=body&&body.id||'',el=id==='rangeModalBody'?document.getElementById('rangeModalTitle'):id==='v80ModalBody'?document.getElementById('v80ModalTitle'):null;return norm(el&&el.textContent||'')}
function isMarkdownContext(body){if(!body)return false;return /MARKDOWN|POLITICA|GESTIONAR|OFERTA|DESCUENTO/.test(modalTitleFor(body))||!!body.querySelector('.v8695MdFilters,.v8664MdDetailTable,.v8623MarkdownTable')}
function isTransferContext(body){return /TRASLADO|ORDENES|ENTREGAS/.test(modalTitleFor(body))}
function colIndex(table,tests){var hs=headerInfo(table);for(var j=0;j<tests.length;j++){for(var i=0;i<hs.length;i++){if(tests[j](hs[i].t))return hs[i].i}}return-1}
function cellText(tr,i){return i>=0&&tr.cells[i]?s(tr.cells[i].textContent).trim():''}
function buildUnifiedDetailFilters(body){
  if(!body||isMarkdownContext(body)||isTransferContext(body)||body.closest('#guideDetailBodyV49,#guideDetailBodyV48'))return;
  var tables=Array.from(body.querySelectorAll('table')).filter(function(t){return t.tBodies&&t.tBodies[0]&&t.tBodies[0].rows.length&&!isTransferOrderTable(t)}),table=tables[0];if(!table)return;
  if(table.dataset.v118UnifiedFilters==='1')return;
  var rows=Array.from(table.tBodies[0].rows).filter(function(tr){return !tr.querySelector('.empty')&&!!codeFromRow(tr)});if(rows.length<1)return;
  filterBars(body).forEach(function(b){b.remove()});
  body.querySelectorAll('.v8680NovelToggle').forEach(function(x){x.remove()});
  var title=modalTitleFor(body),hi=headerInfo(table),idxStatus=colIndex(table,[function(t){return t==='ESTADO'},function(t){return t==='CONDICION'}]),idxActivity=colIndex(table,[function(t){return t==='ACTIVIDAD'}]),idxAge=colIndex(table,[function(t){return /ANTIGUEDAD|RANGOS?/.test(t)}]),idxCendis=colIndex(table,[function(t){return /CENDIS/.test(t)}]);
  var st=(typeof S!=='undefined'&&S&&S[CUR])||{},cendisMap={},salesMap={};
  try{if(typeof normalizeInventoryRows==='function')normalizeInventoryRows(st).forEach(function(r){cendisMap[s(r.c)]=num(r.dispCendis)})}catch(_){}
  try{if(typeof normalizeProductSalesRows==='function')normalizeProductSalesRows(st).forEach(function(r){salesMap[s(r.c)]=num(r.u)})}catch(_){}
  rows.forEach(function(tr){var c=codeFromRow(tr),p=prod(c);tr.dataset.v118Q=norm(c+' '+p.n+' '+p.cat+' '+p.lin+' '+p.sub+' '+tr.textContent);tr.dataset.v118Cc=norm(cc(c));tr.dataset.v118Cat=s(p.cat);tr.dataset.v118Lin=s(p.lin);tr.dataset.v118Sub=s(p.sub);tr.dataset.v118Status=idxStatus>=0?cellText(tr,idxStatus):'';tr.dataset.v118Activity=idxActivity>=0?cellText(tr,idxActivity):'';tr.dataset.v118Age=idxAge>=0?cellText(tr,idxAge):'';var cd=cendisMap.hasOwnProperty(c)?cendisMap[c]:null;if(cd==null&&idxCendis>=0){var ct=norm(cellText(tr,idxCendis));cd=/SIN RESPALDO|(^|\s)0(\s|$)/.test(ct)?0:1}tr.dataset.v118Cendis=cd==null?'':(cd>0?'with':'without');var su=salesMap.hasOwnProperty(c)?salesMap[c]:0;tr.dataset.v118Sales=su>0?'with':'without';tr.dataset.v118Novel=norm((p&&p.estado)||'')});
  var values=function(key,subset){return uniq((subset||rows).map(function(r){return s(r.dataset[key])}).filter(function(v){return v&&v!=='—'}))};
  var bar=document.createElement('div');bar.className='v118UnifiedFilters';bar.dataset.v118DetailFilters='1';
  function field(label,key,html){var d=document.createElement('div');d.className='v118UnifiedField';d.innerHTML='<label>'+esc(label)+'</label>'+html;var c=d.querySelector('input,select');if(c)c.dataset.v118Df=key;bar.appendChild(d)}
  field('Búsqueda rápida','q','<input type="search" placeholder="Código o producto...">');
  field('Clasificación','cc','<select></select>');
  field('Categoría','cat','<select></select>');
  field('Línea','lin','<select></select>');
  field('Sublínea','sub','<select></select>');
  var cendisLocked=/CON RESPALDO|SIN RESPALDO/.test(title);if(!cendisLocked)field('CENDIS','cendis','<select><option value="">Todos</option><option value="with">Con respaldo</option><option value="without">Sin respaldo</option></select>');
  field('Venta 3 meses','sales','<select><option value="">Todas</option><option value="with">Con venta</option><option value="without">Sin venta</option></select>');
  if(/NOVEDAD/.test(title))field('Estado novedad','novel','<select><option value="">T + O</option><option value="T">Solo T</option><option value="O">Solo O</option></select>');
  if(idxStatus>=0&&values('v118Status').length>1)field(hi[idxStatus]&&hi[idxStatus].t==='CONDICION'?'Condición':'Estado','status','<select>'+opts(values('v118Status'))+'</select>');
  if(idxActivity>=0&&values('v118Activity').length>1)field('Actividad','activity','<select>'+opts(values('v118Activity'))+'</select>');
  var ageLocked=/0\s*[-–]\s*60|61\s*[-–]\s*90|91\s*[-–]\s*120|121\s*[-–]\s*150|151\s*[-–]\s*180|181\s*[-–]\s*210|211\s*[-–]\s*240|241\s*[-–]\s*360|\+\s*360/.test(title);
  if(idxAge>=0&&!ageLocked&&values('v118Age').length>1)field('Antigüedad','age','<select>'+opts(values('v118Age'))+'</select>');
  var clear=document.createElement('button');clear.type='button';clear.className='v118UnifiedClear';clear.textContent='Limpiar filtros';bar.appendChild(clear);var count=document.createElement('span');count.className='v118FilterCount';bar.appendChild(count);
  var anchor=table.closest('.twrap,.v80TableWrap,.ux104DetailTableWrap,.v8664TableWrap,.v118ProxDetailWrap')||table.parentElement||table;anchor.parentNode.insertBefore(bar,anchor);
  function setOptions(key,vals,label){var el=bar.querySelector('[data-v118-df="'+key+'"]');if(!el)return;var cur=el.value;el.innerHTML=opts(vals,label||'Todos');if(vals.indexOf(cur)>=0)el.value=cur;else el.value=''}
  function hierarchy(){var csel=bar.querySelector('[data-v118-df="cc"]'),catsel=bar.querySelector('[data-v118-df="cat"]'),linsel=bar.querySelector('[data-v118-df="lin"]'),subsel=bar.querySelector('[data-v118-df="sub"]'),cv=norm(csel&&csel.value),catv=catsel&&catsel.value,linv=linsel&&linsel.value;
    setOptions('cc',values('v118Cc').map(function(x){return x==='SIN CLASIFICACION'?'SIN CLASIFICACIÓN':x}));cv=norm(csel&&csel.value);
    var byCc=rows.filter(function(r){return !cv||r.dataset.v118Cc===cv});setOptions('cat',values('v118Cat',byCc));catv=catsel&&catsel.value;
    var byCat=byCc.filter(function(r){return !catv||r.dataset.v118Cat===catv});setOptions('lin',values('v118Lin',byCat));linv=linsel&&linsel.value;
    var byLin=byCat.filter(function(r){return !linv||r.dataset.v118Lin===linv});setOptions('sub',values('v118Sub',byLin));
  }
  function apply(){var v={};bar.querySelectorAll('[data-v118-df]').forEach(function(x){v[x.dataset.v118Df]=x.value});var shown=0;rows.forEach(function(tr){var ok=!v.q||tr.dataset.v118Q.indexOf(norm(v.q))>=0;if(ok&&v.cc&&tr.dataset.v118Cc!==norm(v.cc))ok=false;if(ok&&v.cat&&tr.dataset.v118Cat!==v.cat)ok=false;if(ok&&v.lin&&tr.dataset.v118Lin!==v.lin)ok=false;if(ok&&v.sub&&tr.dataset.v118Sub!==v.sub)ok=false;if(ok&&v.cendis&&tr.dataset.v118Cendis!==v.cendis)ok=false;if(ok&&v.sales&&tr.dataset.v118Sales!==v.sales)ok=false;if(ok&&v.novel&&tr.dataset.v118Novel!==norm(v.novel))ok=false;if(ok&&v.status&&tr.dataset.v118Status!==v.status)ok=false;if(ok&&v.activity&&tr.dataset.v118Activity!==v.activity)ok=false;if(ok&&v.age&&tr.dataset.v118Age!==v.age)ok=false;tr.classList.toggle('v118HiddenRow',!ok);if(ok)shown++});count.textContent=fi(shown)+' de '+fi(rows.length)+' productos'}
  var qtimer=0;bar.querySelectorAll('input,select').forEach(function(x){var ev=x.tagName==='INPUT'?'input':'change';x.addEventListener(ev,function(){if(['cc','cat','lin'].indexOf(x.dataset.v118Df)>=0)hierarchy();if(ev==='input'){clearTimeout(qtimer);qtimer=setTimeout(apply,70)}else apply()})});
  clear.onclick=function(){bar.querySelectorAll('input').forEach(function(x){x.value=''});bar.querySelectorAll('select').forEach(function(x){x.value=''});hierarchy();apply()};table.dataset.v118UnifiedFilters='1';hierarchy();apply()
}
function cleanDetail(body){if(!body)return;removeNovelDuplicates(body);Array.from(body.querySelectorAll('table')).forEach(function(t){addImageIfNeeded(t);unifyHierarchy(t)});buildUnifiedDetailFilters(body);body.querySelectorAll('td.ux104-core,td.ux104-comp,td.ux104-none').forEach(function(td){td.style.background='transparent'})}
function cleanOpenDetails(){['rangeModalBody','v80ModalBody'].forEach(function(id){cleanDetail(document.getElementById(id))});removeNovelDuplicates(document.getElementById('rangeModalBody'))}

/* Próximos a rotar: las cards ahora abren detalle, no alteran la tabla principal. */
function showProxDetail(mode){var st=(typeof S!=='undefined'&&S&&S[CUR])||{},rows=[];try{rows=typeof upcomingRotationRows==='function'?upcomingRotationRows(st):[]}catch(_){};if(mode==='nosales')rows=rows.filter(function(r){return num(r.salesUnits)<=0});if(mode==='units')rows.sort(function(a,b){return num(b.units)-num(a.units)});else if(mode==='value')rows.sort(function(a,b){return num(b.value)-num(a.value)});else rows.sort(function(a,b){return s(a.p&&a.p.n).localeCompare(s(b.p&&b.p.n),'es')});var title=mode==='units'?'Unidades 60–90 días':mode==='value'?'Valor estimado':mode==='nosales'?'Próximos a rotar · sin venta 3 meses':'Productos próximos a rotar';var modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle');if(!modal||!body)return;if(tt)tt.textContent=title;if(ss)ss.textContent=((st&&st.name)||CUR)+' · '+fi(rows.length)+' productos';var trs=rows.map(function(r){var p=r.p||prod(r.c);return '<tr data-code="'+esc(r.c)+'"><td>'+(typeof imageThumb==='function'?imageThumb(r.c,'sm'):'')+'</td><td><span class="code">'+esc(r.c)+'</span></td><td><b>'+esc(p.n)+'</b></td><td>'+esc(cc(r.c))+'</td><td class="v118HierarchyCell"><b>'+esc(p.cat)+'</b><small>'+esc(p.lin)+' · '+esc(p.sub)+'</small></td><td class="num"><b>'+fi(r.units)+'</b></td><td class="num">'+fi(r.stock)+'</td><td class="num">'+num(r.share).toFixed(1)+'%</td><td class="num">'+(num(r.cendis)>0?fi(r.cendis)+' u':'Sin respaldo')+'</td><td class="num">'+fi(r.salesUnits)+'</td><td class="num"><b>'+money(r.value)+'</b></td></tr>'}).join('');body.innerHTML='<div class="v118ProxDetailWrap"><table class="v118ProxDetail"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Clasificación</th><th>Categoría / Línea / Sublínea</th><th class="num">Uds. 60–90</th><th class="num">Stock</th><th class="num">% stock</th><th class="num">CENDIS</th><th class="num">Venta 3m</th><th class="num">Valor estimado</th></tr></thead><tbody>'+trs+'</tbody></table></div>';modal.classList.add('on');document.body.style.overflow='hidden';cleanDetail(body)}
window.proxKpi53=function(mode){showProxDetail(mode||'all')};

/* Módulos de producto: un mismo buscador jerárquico en Inventario, Próximos, Rotación y Evacuación. */
function moduleDataMaps(){var st=(typeof S!=='undefined'&&S&&S[CUR])||{},sales={},cendis={};try{if(typeof normalizeProductSalesRows==='function')normalizeProductSalesRows(st).forEach(function(r){sales[s(r.c)]=num(r.u)})}catch(_){}try{if(typeof normalizeInventoryRows==='function')normalizeInventoryRows(st).forEach(function(r){cendis[s(r.c)]=num(r.dispCendis)})}catch(_){}return {sales:sales,cendis:cendis}}
function moduleRootId(module){return module==='inventario'?'inventario-tbl':module+'-tbl'}
function hideLegacyModuleFilters(module,body){if(!body)return;var selectors=module==='inventario'?['.tbar','.invFilterPanel']:module==='prox'?['.tbar','.proxNativeToolbar','.proxFilterGroups','.proxFilterBar','#v70-prox-categories','.proxUnifiedToolbar']:['.tbar'];selectors.forEach(function(sel){body.querySelectorAll(sel).forEach(function(x){if(!x.classList.contains('v118ModuleFilters'))x.classList.add('v119LegacyFilterHidden')})})}
function prepareModuleView(module){try{if(typeof state==='undefined'||!state)return;if(module==='inventario'&&state.inventario){state.inventario.f='all';state.inventario.q='';state.inventario.cat='';state.inventario.lin='';state.inventario.sub='';state.inventario.limit=Math.max(num(state.inventario.limit)||300,1600)}else if(module==='prox'&&state.prox){state.prox.risk='all';state.prox.salesMode='all';state.prox.cendisMode='all';state.prox.cat='all';state.prox.q='';state.prox.limit=Math.max(num(state.prox.limit)||300,1600)}else if((module==='rot'||module==='evac')&&state[module]){state[module].f='all';state[module].q=''}}catch(_){}}
function moduleFilters(module){if(['inventario','prox','rot','evac'].indexOf(module)<0||(typeof VIEW!=='undefined'?VIEW:'')!==module)return;var root=document.getElementById(moduleRootId(module)),body=root&&root.closest('.cbody');if(!body)return;if(module==='rot'||module==='evac'){var chart=document.getElementById(module==='rot'?'cc-age-rot68':'cc-age-evac68'),age=body.querySelector('.v82AgeBar');if(chart&&age&&chart.nextElementSibling!==age)chart.insertAdjacentElement('afterend',age)}hideLegacyModuleFilters(module,body);var bar=body.querySelector('.v118ModuleFilters[data-module="'+module+'"]');if(!bar){bar=document.createElement('div');bar.className='v118ModuleFilters';bar.dataset.module=module;bar.innerHTML='<div class="v118ModuleField"><label>Búsqueda rápida</label><input type="search" data-v118-mf="q" placeholder="Código o producto..."></div><div class="v118ModuleField"><label>Clasificación</label><select data-v118-mf="cc"></select></div><div class="v118ModuleField"><label>Categoría</label><select data-v118-mf="cat"></select></div><div class="v118ModuleField"><label>Línea</label><select data-v118-mf="lin"></select></div><div class="v118ModuleField"><label>Sublínea</label><select data-v118-mf="sub"></select></div><div class="v118ModuleField"><label>CENDIS</label><select data-v118-mf="cendis"><option value="">Todos</option><option value="with">Con respaldo</option><option value="without">Sin respaldo</option></select></div><div class="v118ModuleField"><label>Venta 3 meses</label><select data-v118-mf="sales"><option value="">Todas</option><option value="with">Con venta</option><option value="without">Sin venta</option></select></div><button type="button" class="v118ModuleClear">Limpiar filtros</button><span class="v118FilterCount"></span>';root.parentNode.insertBefore(bar,root);var qtimer=0;bar.querySelectorAll('input,select').forEach(function(x){x.addEventListener(x.tagName==='INPUT'?'input':'change',function(){if(['cc','cat','lin'].indexOf(x.dataset.v118Mf)>=0)populateModuleFilters(module);if(x.tagName==='INPUT'){clearTimeout(qtimer);qtimer=setTimeout(function(){applyModuleFilters(module)},70)}else applyModuleFilters(module)})});bar.querySelector('.v118ModuleClear').onclick=function(){bar.querySelectorAll('input').forEach(function(x){x.value=''});bar.querySelectorAll('select').forEach(function(x){x.value=''});populateModuleFilters(module);applyModuleFilters(module)}}populateModuleFilters(module);applyModuleFilters(module)}
function moduleRows(module){var table=document.querySelector('#'+moduleRootId(module)+' table');if(!table)return[];return Array.from(table.tBodies&&table.tBodies[0]?table.tBodies[0].rows:[]).filter(function(tr){return !tr.querySelector('.empty')&&!!codeFromRow(tr)})}
function populateModuleFilters(module){var bar=document.querySelector('.v118ModuleFilters[data-module="'+module+'"]'),rows=moduleRows(module);if(!bar||!rows.length)return;var entries=rows.map(function(tr){var c=codeFromRow(tr),p=prod(c);return {cc:norm(cc(c)),cat:s(p.cat),lin:s(p.lin),sub:s(p.sub)}});function setSel(key,vals){var el=bar.querySelector('[data-v118-mf="'+key+'"]');if(!el)return;var cur=el.value;el.innerHTML=opts(uniq(vals));if(uniq(vals).indexOf(cur)>=0)el.value=cur;else el.value=''}var csel=bar.querySelector('[data-v118-mf="cc"]'),catsel=bar.querySelector('[data-v118-mf="cat"]'),linsel=bar.querySelector('[data-v118-mf="lin"]');setSel('cc',entries.map(function(e){return e.cc==='SIN CLASIFICACION'?'SIN CLASIFICACIÓN':e.cc}));var cv=norm(csel&&csel.value),byCc=entries.filter(function(e){return !cv||e.cc===cv});setSel('cat',byCc.map(function(e){return e.cat}));var catv=catsel&&catsel.value,byCat=byCc.filter(function(e){return !catv||e.cat===catv});setSel('lin',byCat.map(function(e){return e.lin}));var linv=linsel&&linsel.value,byLin=byCat.filter(function(e){return !linv||e.lin===linv});setSel('sub',byLin.map(function(e){return e.sub}))}
function applyModuleFilters(module){var bar=document.querySelector('.v118ModuleFilters[data-module="'+module+'"]'),rows=moduleRows(module);if(!bar)return;var v={},maps=moduleDataMaps();bar.querySelectorAll('[data-v118-mf]').forEach(function(x){v[x.dataset.v118Mf]=x.value});var shown=0;rows.forEach(function(tr){var c=codeFromRow(tr),p=prod(c),ok=!v.q||norm(c+' '+p.n+' '+p.cat+' '+p.lin+' '+p.sub).indexOf(norm(v.q))>=0;if(ok&&v.cc&&norm(cc(c))!==norm(v.cc))ok=false;if(ok&&v.cat&&s(p.cat)!==v.cat)ok=false;if(ok&&v.lin&&s(p.lin)!==v.lin)ok=false;if(ok&&v.sub&&s(p.sub)!==v.sub)ok=false;var cd=num(maps.cendis[c]);if(ok&&v.cendis==='with'&&cd<=0)ok=false;if(ok&&v.cendis==='without'&&cd>0)ok=false;var su=num(maps.sales[c]);if(ok&&v.sales==='with'&&su<=0)ok=false;if(ok&&v.sales==='without'&&su>0)ok=false;tr.classList.toggle('v118HiddenRow',!ok);if(ok)shown++});var ct=bar.querySelector('.v118FilterCount');if(ct)ct.textContent=fi(shown)+' de '+fi(rows.length)+' productos'}
function patchModule(module){setTimeout(function(){moduleFilters(module);populateModuleFilters(module);applyModuleFilters(module)},0);setTimeout(function(){moduleFilters(module);populateModuleFilters(module);applyModuleFilters(module)},100)}
var di=window.drawInventario,dp=window.drawProx,dr=window.drawRot,de=window.drawEvac;
if(typeof di==='function'&&!di.__v119){var wi=function(){var o=di.apply(this,arguments);patchModule('inventario');return o};wi.__v119=true;window.drawInventario=drawInventario=wi}
if(typeof dp==='function'&&!dp.__v119){var wp=function(){var o=dp.apply(this,arguments);patchModule('prox');return o};wp.__v119=true;window.drawProx=drawProx=wp}
if(typeof dr==='function'&&!dr.__v119){var wr=function(){var o=dr.apply(this,arguments);patchModule('rot');return o};wr.__v119=true;window.drawRot=drawRot=wr}
if(typeof de==='function'&&!de.__v119){var we=function(){var o=de.apply(this,arguments);patchModule('evac');return o};we.__v119=true;window.drawEvac=drawEvac=we}
/* Guide detail: no rebuild, just restore original structure and lightly improve legibility. */
function restoreGuideDetail(){var body=document.getElementById('guideDetailBodyV49');if(!body)return;body.querySelectorAll('.v117GuideCompactSales').forEach(function(x){x.classList.remove('v117GuideCompactSales')});body.querySelectorAll('.guideFloorTableV50').forEach(function(t){t.classList.remove('v117GuideTable');t.removeAttribute('data-v117')})}

function postPatch(){cleanOpenDetails();restoreGuideDetail();var v=(typeof VIEW!=='undefined'?VIEW:'');if(['inventario','prox','rot','evac'].indexOf(v)>=0)patchModule(v);mark()}
function schedule(){clearTimeout(timers.a);clearTimeout(timers.b);timers.a=setTimeout(postPatch,50);timers.b=setTimeout(postPatch,260)}
var sv=window.setView,rf=window.refresh,og=window.openGuideDetailV49,rg=window.renderGuideDetailV49,oc=window.openComposition8664;if(typeof sv==='function'&&!sv.__v119){var ws=function(){var v=arguments&&arguments.length?arguments[0]:'';if(['inventario','prox','rot','evac'].indexOf(v)>=0)prepareModuleView(v);var o=sv.apply(this,arguments);schedule();return o};ws.__v119=true;window.setView=ws}if(typeof rf==='function'&&!rf.__v119){var wf=function(){var o=rf.apply(this,arguments);schedule();return o};wf.__v119=true;window.refresh=wf}if(typeof og==='function'&&!og.__v119){var wg=function(){var o=og.apply(this,arguments);setTimeout(restoreGuideDetail,210);return o};wg.__v119=true;window.openGuideDetailV49=window.openGuideDetailV48=wg}if(typeof rg==='function'&&!rg.__v119){var wgr=function(){var o=rg.apply(this,arguments);setTimeout(restoreGuideDetail,180);return o};wgr.__v119=true;window.renderGuideDetailV49=wgr}if(typeof oc==='function'&&!oc.__v119){var wc=function(){var o=oc.apply(this,arguments);setTimeout(cleanOpenDetails,70);setTimeout(cleanOpenDetails,260);return o};wc.__v119=true;window.openComposition8664=wc}
document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('button,[role="button"],tbody tr,[onclick]')){setTimeout(cleanOpenDetails,70);setTimeout(cleanOpenDetails,260)}},true);
window.addEventListener('llavero:view-stable',function(){setTimeout(postPatch,0)});
function mark(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent='18/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 18/08/2026 · '+VERSION}catch(_){}}
var initialView=(typeof VIEW!=='undefined'?VIEW:'');if(['inventario','prox','rot','evac'].indexOf(initialView)>=0){prepareModuleView(initialView);setTimeout(function(){try{if(initialView==='inventario'&&typeof drawInventario==='function')drawInventario();else if(initialView==='prox'&&typeof drawProx==='function')drawProx();else if(initialView==='rot'&&typeof drawRot==='function')drawRot();else if(initialView==='evac'&&typeof drawEvac==='function')drawEvac()}catch(_){}},0)}mark();schedule();console.info('LLAVERO V86.120 · datos e historial reemplazados por JSON validados del usuario');
})();


/* ==== llaveroV86126CorrectInventoryLogic ==== */

(function(){
'use strict';
var VERSION='V86.126';
function n(v){var x=Number(v);return Number.isFinite(x)?x:0;}
function s(v){return v==null?'':String(v).trim();}
function code(v){var x=s(v);x=x.replace(/^0+(?=\d)/,'');return x||'0';}
function prod(c,raw){try{var p=typeof productInfo==='function'?productInfo(c):((typeof P!=='undefined'&&P&&P[c])||{});return {n:s((raw&&raw.producto)||p.n||c),cat:s((raw&&raw.categoria)||p.cat||'SIN CLASIFICAR'),lin:s((raw&&raw.linea)||p.lin||'SIN LÍNEA'),sub:s((raw&&raw.sublinea)||p.sub||'SIN SUBLÍNEA')};}catch(_){return {n:c,cat:'SIN CLASIFICAR',lin:'SIN LÍNEA',sub:'SIN SUBLÍNEA'};}}
function rawInventory(st){return (Array.isArray(st&&st.inventario)?st.inventario:[]).filter(function(r){return n(r&&r.stock)>0;});}
function invMap(st){var m={};rawInventory(st).forEach(function(r){m[code(r.codigo||r.c)]=r;});return m;}
function sets(st){var rot=new Set(),ev=new Set();(Array.isArray(st&&st.rot)?st.rot:[]).forEach(function(r){if(r&&r[0]!=null)rot.add(code(r[0]));});(Array.isArray(st&&st.evac)?st.evac:[]).forEach(function(r){if(r&&r[0]!=null)ev.add(code(r[0]));});return {rot:rot,ev:ev};}
function rangeLow(label){var z=s(label).toUpperCase();if(z.indexOf('SIN')>=0)return -1;var a=z.match(/\d+/g)||[];return a.length?Number(a[0]):-1;}
function rangeUnits(raw,min,max){var total=0;Object.entries((raw&&raw.rangos)||{}).forEach(function(e){var lo=rangeLow(e[0]),u=n(e[1]);if(u>0&&lo>=min&&(max==null||lo<=max))total+=u;});return total;}
function proxUnits(raw){return rangeUnits(raw,61,90);}
function oldestLabel(raw,onlyOld){var es=Object.keys((raw&&raw.rangos)||{}).filter(function(k){var lo=rangeLow(k);return n(raw.rangos[k])>0&&(!onlyOld||lo>=91);}).sort(function(a,b){return rangeLow(b)-rangeLow(a);});return es[0]||'SIN DEFINIR';}
function salesMap(st){var m={};try{if(typeof normalizeProductSalesRows==='function')(normalizeProductSalesRows(st)||[]).forEach(function(r){m[code(r.c)]={units:n(r.u),value:n(r.v)};});}catch(_){}rawInventory(st).forEach(function(r){var c=code(r.codigo);if(!m[c])m[c]={units:n(r.unidadesFacUlt3Meses),value:n(r.facturacionUlt3Meses)};});return m;}
function normalizedInventory(st){return rawInventory(st).map(function(raw){var c=code(raw.codigo||raw.c),p=prod(c,raw);return Object.assign({},raw,{c:c,p:p,stock:n(raw.stock),valorInventario:n(raw.valorInventario),valorUnitarioPromedio:n(raw.valorUnitarioPromedio),dispCendis:n(raw.dispCendis),entradas:n(raw.entradas),rangos:(raw.rangos&&typeof raw.rangos==='object')?raw.rangos:{}});});}
function calc(st){
  st=st||{};var se=sets(st),rows=normalizedInventory(st),im=invMap(st),sm=salesMap(st),healthy=[],prox=[],rotRowsRaw=[],evRowsRaw=[];
  rows.forEach(function(r){if(se.ev.has(r.c))return;if(se.rot.has(r.c))return;healthy.push(r);if(proxUnits(r)>0)prox.push(r);});
  (Array.isArray(st.rot)?st.rot:[]).forEach(function(a){var c=code(a&&a[0]),raw=im[c]||{},p=prod(c,raw);rotRowsRaw.push({c:c,u:n(a&&a[1]),aux:n(a&&a[2]),age:typeof ageRankFromLabel==='function'?ageRankFromLabel(a&&a[5]):-1,val:n(a&&a[3]),price:n(a&&a[4]),ageLabel:s(a&&a[5])||oldestLabel(raw,true),m1:n(a&&a[6]),m2:n(a&&a[7]),m3:n(a&&a[8]),sales3m:n(a&&a[6])+n(a&&a[7])+n(a&&a[8]),p:p,row:Object.assign({},raw,{c:c,p:p})});});
  (Array.isArray(st.evac)?st.evac:[]).forEach(function(a){var c=code(a&&a[0]),raw=im[c]||{},p=prod(c,raw);evRowsRaw.push({c:c,u:n(a&&a[1]),v:n(a&&a[2]),cendis:n(a&&a[3]),sales1:n(a&&a[4]),sales2:n(a&&a[5]),edad:s(a&&a[6])||oldestLabel(raw,false),p:p,active:true,row:Object.assign({},raw,{c:c,p:p}),sales3m:n(a&&a[4])+n(a&&a[5])});});
  return {rows:rows,healthy:healthy,prox:prox,rotRows:rotRowsRaw,evRows:evRowsRaw,se:se,sm:sm};
}
window.normalizeInventoryRows=function(st){return normalizedInventory(st||((typeof S!=='undefined'&&S&&S[CUR])||{}));};
window.normalizeRotRows=function(st){return calc(st||((typeof S!=='undefined'&&S&&S[CUR])||{})).rotRows;};
window.normalizeEvacRows=function(st){return calc(st||((typeof S!=='undefined'&&S&&S[CUR])||{})).evRows;};
window.rotationDetailedRows=function(st){st=st||((typeof S!=='undefined'&&S&&S[CUR])||{});return window.normalizeRotRows(st).map(function(x){var r=x.row||{};return Object.assign({},r,{c:x.c,p:x.p,entries:Object.entries(r.rangos||{}).filter(function(e){return n(e[1])>0&&rangeLow(e[0])>=91;}).sort(function(a,b){return rangeLow(b[0])-rangeLow(a[0]);}),u:x.u,age:x.age,val:x.val,sales3m:x.sales3m,dispCendis:n(r.dispCendis)});});};
window.evacuationDetailedRows=function(st){st=st||((typeof S!=='undefined'&&S&&S[CUR])||{});return window.normalizeEvacRows(st).map(function(x){var r=x.row||{};return Object.assign({},r,{c:x.c,p:x.p,entries:Object.entries(r.rangos||{}).filter(function(e){return n(e[1])>0;}).sort(function(a,b){return rangeLow(b[0])-rangeLow(a[0]);}),u:x.u,v:x.v,cendis:x.cendis,sales3m:x.sales3m});});};
window.upcomingRotationRows=function(st){st=st||((typeof S!=='undefined'&&S&&S[CUR])||{});var x=calc(st);return x.prox.map(function(r){var u=proxUnits(r),sl=x.sm[r.c]||{};return {c:r.c,p:r.p,units:u,stock:n(r.stock),share:n(r.stock)>0?u/n(r.stock)*100:0,value:n(r.stock)>0?n(r.valorInventario)*u/n(r.stock):0,cendis:n(r.dispCendis),salesUnits:n(sl.units),salesValue:n(sl.value),rangos:r.rangos,row:r};});};
window.inventorySummary=function(st){st=st||((typeof S!=='undefined'&&S&&S[CUR])||{});var x=calc(st),rows=x.rows,rotCodes=x.se.rot,evCodes=x.se.ev;var rotRows=rows.filter(function(r){return rotCodes.has(r.c);}),evRows=rows.filter(function(r){return evCodes.has(r.c);});return {rows:rows,refs:rows.length,units:rows.reduce(function(a,r){return a+n(r.stock);},0),value:rows.reduce(function(a,r){return a+n(r.valorInventario);},0),critical:rows.filter(function(r){return Object.keys(r.rangos||{}).some(function(k){return rangeLow(k)>=360&&n(r.rangos[k])>0;});}).length,supported:rows.filter(function(r){return n(r.dispCendis)>0;}).length,healthy:x.healthy.length,prox:x.prox.length,rotation:x.rotRows.length,evacuation:x.evRows.length,healthyRows:x.healthy,proxRows:x.prox,rotationRows:rotRows,evacuationRows:evRows};};
window.inventoryStateRows=function(st,name){var x=window.inventorySummary(st);if(name==='Rotación')return x.rotationRows.slice();if(name==='Evacuación')return x.evacuationRows.slice();if(name==='Próximo a rotar'||name==='Próximos a rotar')return x.proxRows.slice();if(name==='Sano'||name==='Sanos')return x.healthyRows.slice();return x.rows.slice();};
window.recalcOperationalKpis=function(st){st=st||((typeof S!=='undefined'&&S&&S[CUR])||{});var x=calc(st),k=st.kpi||(st.kpi={});var rotU=x.rotRows.reduce(function(a,r){return a+n(r.u);},0),rotVal=x.rotRows.reduce(function(a,r){return a+n(r.val);},0),evU=x.evRows.reduce(function(a,r){return a+n(r.u);},0),evVal=x.evRows.reduce(function(a,r){return a+n(r.v);},0);Object.assign(k,{stockRefs:x.rows.length,rotN:x.rotRows.length,rotU:rotU,rotVal:rotVal,rotSin:x.rotRows.filter(function(r){return n(r.sales3m)<=0;}).length,evacN:x.evRows.length,evacU:evU,evacVal:evVal,evacSR:x.evRows.filter(function(r){return n(r.cendis)<=0;}).length});return k;};
try{normalizeInventoryRows=window.normalizeInventoryRows;normalizeRotRows=window.normalizeRotRows;normalizeEvacRows=window.normalizeEvacRows;rotationDetailedRows=window.rotationDetailedRows;evacuationDetailedRows=window.evacuationDetailedRows;upcomingRotationRows=window.upcomingRotationRows;inventorySummary=window.inventorySummary;inventoryStateRows=window.inventoryStateRows;recalcOperationalKpis=window.recalcOperationalKpis;}catch(_){}
function syncStore(st){if(st)window.recalcOperationalKpis(st);}
function syncAll(){try{Object.keys(S||{}).forEach(function(k){syncStore(S[k]);});}catch(_){} }
function syncSidebar(){try{var st=(typeof S!=='undefined'&&S&&S[CUR])||{},x=window.inventorySummary(st),vals={'nc-inv':x.refs,'nc-prox':x.prox,'nc-rot':x.rotation,'nc-evac':x.evacuation};Object.keys(vals).forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=typeof fInt==='function'?fInt(vals[id]):String(vals[id]);});}catch(_){} }
function patchInventoryClosure(){try{if(typeof VIEW==='undefined'||VIEW!=='inventario')return;var root=document.getElementById('content');if(!root)return;var x=window.inventorySummary((S&&S[CUR])||{});root.querySelectorAll('.inventoryKpi').forEach(function(card){var l=card.querySelector('.ikLabel'),m=card.querySelector('.ikMeta'),v=card.querySelector('.ikValue');if(!l)return;var z=s(l.textContent);if(z==='Productos sanos'){if(v)v.textContent=(typeof fInt==='function'?fInt(x.healthy):x.healthy);if(m)m.textContent='Productos fuera de Rotación y Evacuación. Incluye los próximos a rotar.';}if(z==='Próximos a Rotar'){if(v)v.textContent=(typeof fInt==='function'?fInt(x.prox):x.prox);if(m)m.textContent='Advertencia dentro de Sanos · unidades entre 61 y 90 días.';}if(z==='Rotación'&&v)v.textContent=(typeof fInt==='function'?fInt(x.rotation):x.rotation);if(z==='Evacuación'&&v)v.textContent=(typeof fInt==='function'?fInt(x.evacuation):x.evacuation);});var note=root.querySelector('.v8662MixNote');if(note)note.innerHTML='<b>Cierre:</b> '+x.healthy.toLocaleString('es-CO')+' Sanos + '+x.rotation.toLocaleString('es-CO')+' Rotación + '+x.evacuation.toLocaleString('es-CO')+' Evacuación = <b>'+x.refs.toLocaleString('es-CO')+' productos</b> · '+x.prox.toLocaleString('es-CO')+' próximos están incluidos dentro de Sanos';}catch(_){} }
function mark(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var b=document.querySelector('.appVersionChip b');if(b)b.textContent='18/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 18/08/2026 · '+VERSION;}catch(_){} }
function enforce(){syncAll();syncSidebar();patchInventoryClosure();mark();}
function install(){if(typeof S==='undefined'||!S||typeof window.setView!=='function'){setTimeout(install,120);return;}syncAll();
  var sv=window.setView;if(typeof sv==='function'&&!sv.__v86124){var wsv=function(){syncAll();var out=sv.apply(this,arguments);setTimeout(enforce,0);setTimeout(enforce,180);setTimeout(enforce,700);return out;};wsv.__v86124=true;window.setView=wsv;try{setView=wsv;}catch(_){} }
  var rf=window.refresh;if(typeof rf==='function'&&!rf.__v86124){var wrf=function(){syncAll();var out=rf.apply(this,arguments);setTimeout(enforce,0);setTimeout(enforce,180);setTimeout(enforce,700);return out;};wrf.__v86124=true;window.refresh=wrf;try{refresh=wrf;}catch(_){} }
  ['drawInventario','drawProx','drawRot','drawEvac'].forEach(function(name){var old=window[name];if(typeof old!=='function'||old.__v86124)return;var w=function(){syncStore((S&&S[CUR])||{});var out=old.apply(this,arguments);setTimeout(function(){syncSidebar();patchInventoryClosure();mark();},0);return out;};w.__v86124=true;window[name]=w;try{if(name==='drawInventario')drawInventario=w;else if(name==='drawProx')drawProx=w;else if(name==='drawRot')drawRot=w;else if(name==='drawEvac')drawEvac=w;}catch(_){} });
  [0,150,500,1200].forEach(function(ms){setTimeout(enforce,ms);});
  window.__LLAVERO_INVENTORY_LOGIC_V86124__={inventory:'Inventario con stock',healthy:'Inventario excluyendo listas oficiales de Rotación y Evacuación',prox:'Advertencia dentro de Sanos: unidades exactas 61–90 días',rotation:'Lista oficial S[tienda].rot',evacuation:'Lista oficial S[tienda].evac'};
  console.info('LLAVERO V86.126 · lógica consistente: Sanos + Rotación + Evacuación = Inventario; Próximos es subgrupo de Sanos');
}
if(window.__LLAVERO_BOOTSTRAPPED__)setTimeout(install,360);else window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,360);},{once:true});
})();


/* ==== llaveroV86126SafeFinalizer ==== */

(function(){
'use strict';
var VERSION='V86.126';
function mark(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var b=document.querySelector('.appVersionChip b');if(b)b.textContent='18/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 18/08/2026 · '+VERSION;}catch(_){}}
function sync(){try{if(typeof S==='undefined'||!S||typeof CUR==='undefined')return;var st=S[CUR]||{};if(typeof window.recalcOperationalKpis==='function')window.recalcOperationalKpis(st);var x=typeof window.inventorySummary==='function'?window.inventorySummary(st):null;if(x){var vals={'nc-inv':x.refs,'nc-prox':x.prox,'nc-rot':x.rotation,'nc-evac':x.evacuation};Object.keys(vals).forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=typeof fInt==='function'?fInt(vals[id]):String(vals[id]);});}mark();}catch(e){console.error('V86.126 sync',e);}}
function start(){mark();sync();[100,350,900,1800].forEach(function(ms){setTimeout(sync,ms);});}
if(window.__LLAVERO_BOOTSTRAPPED__)start();else window.addEventListener('llavero:bootstrapped',start,{once:true});
window.addEventListener('llavero:view-stable',function(){setTimeout(sync,0);setTimeout(sync,120);});
})();


/* ==== llaveroV86127Script ==== */

(function(){
'use strict';
if(window.__LLAVERO_V86127__)return;
window.__LLAVERO_V86127__=true;
var VERSION='V86.127';
function s(v){return v==null?'':String(v)}
function n(v){var x=Number(v);return Number.isFinite(x)?x:0}
function norm(v){var x=s(v).trim().toUpperCase();try{return x.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(_){return x}}
function esc(v){return s(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c})}
function fi(v){try{return typeof fInt==='function'?fInt(n(v)):Math.round(n(v)).toLocaleString('es-CO')}catch(_){return String(Math.round(n(v)))}}
function money(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(n(v)):(typeof fMoney==='function'?fMoney(n(v)):'$ '+Math.round(n(v)).toLocaleString('es-CO'))}catch(_){return '$ '+Math.round(n(v)).toLocaleString('es-CO')}}
function st(){try{return (typeof S!=='undefined'&&S&&typeof CUR!=='undefined'&&S[CUR])?S[CUR]:{}}catch(_){return{}}}
function prod(c){try{return (typeof P!=='undefined'&&P&&P[c])?P[c]:{}}catch(_){return{}}}
function thumb(c){try{return typeof imageThumb==='function'?imageThumb(c,'sm'):''}catch(_){return''}}
function rawInventory(){return Array.isArray(st().inventario)?st().inventario:[]}
var v127PerfCache={store:null,date:'',inv:null,sets:null,data:Object.create(null)};
function v127EnsureCache(){var store=st(),date='';try{date=s(DB&&DB.meta&&DB.meta.fecha)}catch(_){}if(v127PerfCache.store!==store||v127PerfCache.date!==date){v127PerfCache.store=store;v127PerfCache.date=date;v127PerfCache.inv=null;v127PerfCache.sets=null;v127PerfCache.data=Object.create(null)}return v127PerfCache}
function invMap(){var c=v127EnsureCache();if(c.inv)return c.inv;var m=Object.create(null);rawInventory().forEach(function(r){m[s(r.codigo)]=r});c.inv=m;return m}
function ageLow(label){var m=s(label).match(/(\d+)/);return m?Number(m[1]):-1}
function ageBuckets(r){var out=[];Object.entries((r&&r.rangos)||{}).forEach(function(e){if(n(e[1])<=0)return;var lo=ageLow(e[0]),k=lo<0?'unknown':lo<=60?'0-60':lo<=90?'61-90':lo<=150?'91-150':lo<=180?'151-180':lo<=210?'181-210':lo<=240?'211-240':lo<=360?'241-360':'360+';if(out.indexOf(k)<0)out.push(k)});return out}
function transferStatus(r){var e=norm(r&&r.estatus);if(e.indexOf('ENTREG')>=0)return'Entregado';if(e.indexOf('PICK')>=0)return'En picking';if(e.indexOf('RUTA')>=0)return'En ruta';if(e.indexOf('PEND')>=0)return'Pendiente';var p=norm(r&&r.statusGlobalPicking),m=norm(r&&r.statusMovimiento),w=norm(r&&r.lugarPuestaDispos);if(p==='C'&&m==='C')return'Entregado';if(p==='C'&&m==='A')return'En ruta';if(p==='A'&&m==='A'&&w.indexOf('WMS')>=0)return'En picking';return'Pendiente'}
function pendingTransferRows(){return (Array.isArray(st().trDetalle)?st().trDetalle:[]).filter(function(r){return transferStatus(r)!=='Entregado'})}
function openRange(title,sub,html){var modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle');if(!modal||!body)return false;if(tt)tt.textContent=title;if(ss)ss.textContent=sub||'';body.innerHTML=html;modal.classList.add('on');document.body.style.overflow='hidden';return true}
function conditionSets(){var c=v127EnsureCache();if(c.sets)return c.sets;var store=st(),rot=new Set(),evac=new Set(),prox=new Set();(Array.isArray(store.rot)?store.rot:[]).forEach(function(r){rot.add(s(r&&r[0]))});(Array.isArray(store.evac)?store.evac:[]).forEach(function(r){evac.add(s(r&&r[0]))});try{(typeof upcomingRotationRows==='function'?upcomingRotationRows(store):[]).forEach(function(r){prox.add(s(r.c))})}catch(_){}c.sets={rot:rot,evac:evac,prox:prox};return c.sets}
function conditionOf(code){var x=conditionSets();if(x.evac.has(code))return'Evacuación';if(x.rot.has(code))return'Rotación';if(x.prox.has(code))return'Próximos a rotar';return'Sanos'}

/* 1. Advertencia de estados no reconocidos: conservarla solo si abre el detalle. */
function unknownRows(){return rawInventory().filter(function(r){return n(r.stock)>0&&['A','O','T','N'].indexOf(norm(r.estadoAbastecimiento))<0})}
window.openUnknownState127=function(){var rows=unknownRows(),store=st(),body=rows.map(function(r){var c=s(r.codigo),p=prod(c),cc=s(p.cc||'SIN CLASIFICACIÓN');return'<tr data-code="'+esc(c)+'"><td>'+thumb(c)+'</td><td><span class="code">'+esc(c)+'</span></td><td><b>'+esc(r.producto||p.n||c)+'</b></td><td>'+esc(cc)+'</td><td><b>'+esc(r.categoria||p.cat||'—')+'</b><br><small>'+esc((r.linea||p.lin||'—')+' · '+(r.sublinea||p.sub||'—'))+'</small></td><td>'+esc(s(r.estadoAbastecimiento)||'Sin estado')+'</td><td>'+esc(conditionOf(c))+'</td><td class="num"><b>'+fi(r.stock)+'</b></td><td class="num">'+fi(r.dispCendis)+' u</td></tr>'}).join('');openRange('Productos con estado por validar',(store.name||CUR)+' · '+fi(rows.length)+' productos con stock','<div class="v127DetailSummary"><div><label>Productos</label><b>'+fi(rows.length)+'</b></div><div><label>Acción</label><b>Validar estado</b></div></div><div class="v127TableWrap"><table class="v127Table"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Clasificación</th><th>Categoría / Línea / Sublínea</th><th>Estado fuente</th><th>Condición LLAVERO</th><th class="num">Unidades</th><th class="num">CENDIS</th></tr></thead><tbody>'+body+'</tbody></table></div>');setTimeout(function(){document.querySelectorAll('#rangeModalBody tr[data-code]').forEach(function(tr){tr.onclick=function(){if(typeof openInventoryProduct==='function')openInventoryProduct(tr.dataset.code)}})},0)};
function patchUnknownWarning(){if((typeof VIEW!=='undefined'?VIEW:'')!=='resumen')return;var root=document.getElementById('content');if(!root)return;var rows=unknownRows();Array.from(root.querySelectorAll('.v8662MixNote')).forEach(function(note){var t=norm(note.textContent);if(t.indexOf('NO TIENEN ESTADO A, O, T O N')>=0||t.indexOf('75/15/10')>=0){if(rows.length){note.classList.add('v127UnknownNote');note.innerHTML='<span>⚠ <b>'+fi(rows.length)+' productos con stock tienen un estado no reconocido.</b></span><button type="button" onclick="openUnknownState127()">Ver productos</button>'}else note.remove()}});var card=Array.from(root.querySelectorAll('.card')).find(function(c){var tt=c.querySelector('.tt');return tt&&tt.textContent.trim()==='Composición y salud del inventario'});if(card){var ds=card.querySelector('.ds');if(ds&&/75\s*\/\s*15\s*\/\s*10/.test(ds.textContent||''))ds.textContent='Lectura de la composición actual del inventario y su antigüedad.'}}

/* 2. Traslados: detalle de impacto limitado a las órdenes por entregar de cada producto. */
function transferImpactSets(){var store=st(),pending=pendingTransferRows(),codes=new Set(pending.map(function(r){return s(r.codigo)})),rot=new Set(),evac=new Set(),amb=new Set();var sets=conditionSets();sets.rot.forEach(function(c){if(codes.has(c))rot.add(c)});sets.evac.forEach(function(c){if(codes.has(c))evac.add(c)});try{if((!Array.isArray(store.guias)||!store.guias.length)&&typeof llaveroRebuildAllGuideData==='function')llaveroRebuildAllGuideData();(store.guias||[]).forEach(function(g){(Array.isArray(g&&g[6])?g[6]:[]).forEach(function(p){var c=s(p&&p[0]);if(codes.has(c)&&s(p&&p[5])==='camino')amb.add(c)})})}catch(_){}var all=new Set([].concat(Array.from(rot),Array.from(evac),Array.from(amb)));return{rows:pending,rot:rot,evac:evac,amb:amb,all:all}}
window.openImpactOrders127=function(code){code=s(code);var rows=pendingTransferRows().filter(function(r){return s(r.codigo)===code}),p=prod(code),groups={};rows.forEach(function(r){var id=s(r.entrega||'SIN IDENTIFICAR');(groups[id]||(groups[id]=[])).push(r)});var ids=Object.keys(groups),trs=ids.map(function(id){var a=groups[id],units=a.reduce(function(x,r){return x+n(r.unidades)},0),statuses=Array.from(new Set(a.map(transferStatus)));return'<tr><td><b>'+esc(id)+'</b></td><td>'+esc(a[0]&&a[0].fechaEntrega||'—')+'</td><td>'+esc(statuses.join(' / '))+'</td><td class="num"><b>'+fi(units)+'</b></td><td>'+esc(a[0]&&a[0].ruta||'—')+'</td></tr>'}).join('');openRange('Entregas pendientes del producto '+code,(st().name||CUR)+' · '+esc(p.n||rows[0]&&rows[0].nombre||code)+' · '+fi(ids.length)+' órdenes por entregar','<div class="v127DetailSummary"><div><label>Órdenes por entregar</label><b>'+fi(ids.length)+'</b></div><div><label>Unidades pendientes</label><b>'+fi(rows.reduce(function(a,r){return a+n(r.unidades)},0))+'</b></div></div><div class="v127TableWrap"><table class="v127Table"><thead><tr><th>Orden de entrega</th><th>Entrega estimada</th><th>Estado</th><th class="num">Unidades</th><th>Ruta</th></tr></thead><tbody>'+trs+'</tbody></table></div>')};
window.openTransferImpact127=function(){var x=transferImpactSets(),by={};x.rows.forEach(function(r){var c=s(r.codigo);if(!x.all.has(c))return;var o=by[c]||(by[c]={code:c,name:s(r.nombre)||s(prod(c).n)||c,orders:new Set(),statuses:new Set(),units:0,rot:x.rot.has(c),evac:x.evac.has(c),amb:x.amb.has(c)});o.orders.add(s(r.entrega));o.statuses.add(transferStatus(r));o.units+=n(r.unidades)});var rows=Object.values(by).sort(function(a,b){return b.units-a.units||a.name.localeCompare(b.name,'es')}),trs=rows.map(function(r){var p=prod(r.code),imp=[r.rot?'Rotación':'',r.evac?'Evacuación':'',r.amb?'Ambientes':''].filter(Boolean).join(' · ');return'<tr class="v127ClickableRow" data-code="'+esc(r.code)+'"><td>'+thumb(r.code)+'</td><td><span class="code">'+esc(r.code)+'</span></td><td><b>'+esc(r.name)+'</b><br><small>'+esc([p.cat,p.lin,p.sub].filter(Boolean).join(' · '))+'</small></td><td>'+esc(imp||'—')+'</td><td>'+esc(Array.from(r.orders).join(' · '))+'</td><td>'+esc(Array.from(r.statuses).join(' · '))+'</td><td class="num"><b>'+fi(r.units)+'</b></td></tr>'}).join('');openRange('Productos con impacto por entregar',(st().name||CUR)+' · solo órdenes Pendiente, En picking o En ruta','<div class="v127DetailSummary"><div><label>Productos únicos</label><b>'+fi(rows.length)+'</b></div><div><label>Rotación</label><b>'+fi(x.rot.size)+'</b></div><div><label>Evacuación</label><b>'+fi(x.evac.size)+'</b></div><div><label>Ambientes</label><b>'+fi(x.amb.size)+'</b></div></div><div class="v127TableWrap"><table class="v127Table"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Impacto</th><th>Órdenes por entregar</th><th>Estado</th><th class="num">Uds. pendientes</th></tr></thead><tbody>'+trs+'</tbody></table></div><div class="v127Hint">Selecciona un producto para ver únicamente las entregas pendientes donde viene.</div>');setTimeout(function(){document.querySelectorAll('#rangeModalBody .v127ClickableRow').forEach(function(tr){tr.onclick=function(){openImpactOrders127(tr.dataset.code)}})},0)};
function patchTransferImpact(){if((typeof VIEW!=='undefined'?VIEW:'')!=='traslados')return;var root=document.getElementById('content');if(!root)return;var x=transferImpactSets();Array.from(root.querySelectorAll('.transferMetricCard8616,.v80TransferKpi,.transferKpi8615')).forEach(function(card){var lab=card.querySelector('.transferMetricLabel8616,label,.lab'),txt=norm(lab?lab.textContent:card.textContent);if(txt.indexOf('PRODUCTOS CON IMPACTO')>=0||txt.indexOf('PRODUCTOS CRITICOS')>=0){if(lab)lab.textContent='Productos con impacto por entregar';var val=card.querySelector('strong,b,.val');if(val)val.textContent=fi(x.all.size);var sub=card.querySelector('small,.sub');if(sub)sub.textContent=fi(x.rot.size)+' Rotación · '+fi(x.evac.size)+' Evacuación · '+fi(x.amb.size)+' Ambientes';card.onclick=function(e){if(e){e.preventDefault();e.stopPropagation()}openTransferImpact127()};card.style.cursor='pointer'}})}

/* 3. Nombre definitivo para órdenes que desaparecen del archivo actual. */
function patchDeletedOrders(){if((typeof VIEW!=='undefined'?VIEW:'')!=='traslados')return;var root=document.getElementById('content');if(!root)return;root.querySelectorAll('.transferMetricCard8616,.transferKpi8615,.v80TransferKpi,.transferInsight8615,.mk').forEach(function(card){var lab=card.querySelector('.transferMetricLabel8616,label,.lab,.l');if(!lab)return;var t=norm(lab.textContent);if(t.indexOf('SALIERON DEL ARCHIVO')>=0||t.indexOf('SALIERON DEL ESTADO')>=0)lab.textContent='Órdenes eliminadas'})}

/* 4, 8 y 9. Markdown: nombres claros y detalle clickeable. */
var statusNames={manage:'Gestionar descuento',comply:'Descuento actual cumple política',exceed:'Descuento actual supera política',offer_covered:'Descuento de oferta supera sugerido',review:'Revisar dato',no_policy:'Sin política'};
function patchMarkdownLabels(){if((typeof VIEW!=='undefined'?VIEW:'')!=='markdown')return;var root=document.getElementById('content');if(!root)return;var repl={'% A GESTIONAR':'Gestionar descuento','% CUMPLE POLITICA':'Descuento actual cumple política','% SUPERA POLITICA':'Descuento actual supera política','% OFERTA CUBRE':'Descuento de oferta supera sugerido','OFERTA CUBRE':'Descuento de oferta supera sugerido','GESTIONAR':'Gestionar descuento','CUMPLE POLITICA':'Descuento actual cumple política','SUPERA POLITICA':'Descuento actual supera política'};root.querySelectorAll('.v8618Card .lab,.v8681MetricCard .lab').forEach(function(l){var k=norm(l.textContent);if(repl[k]){l.textContent=repl[k];var card=l.closest('.v8618Card,.v8681MetricCard'),ico=card&&card.querySelector('.ico');if(ico){var nm=norm(l.textContent);ico.textContent=nm.indexOf('CUMPLE')>=0?'✓':nm.indexOf('SUPERA POLITICA')>=0?'↑':nm.indexOf('OFERTA')>=0?'↗':'!'}}});root.querySelectorAll('.mdRuleGrid8648 .ico').forEach(function(x){if(x.textContent.trim()==='%')x.textContent='↗'});root.querySelectorAll('.v8664MdBar').forEach(function(b){var key='';var oc=b.getAttribute('onclick')||'';var m=oc.match(/status\(['\"]([^'\"]+)/);if(m)key=m[1];var sp=b.querySelector('span');if(sp&&statusNames[key])sp.textContent=statusNames[key];b.style.cursor='pointer'});var result=Array.from(root.querySelectorAll('.v8618Field')).find(function(f){var l=f.querySelector('label');return l&&/Resultado/i.test(l.textContent||'')});if(result){var sel=result.querySelector('select');if(sel)Array.from(sel.options).forEach(function(o){if(statusNames[o.value])o.textContent=statusNames[o.value]})}root.querySelectorAll('.v8681PolicyCard').forEach(function(c){c.style.cursor='pointer';c.setAttribute('role','button')})}
function patchMarkdownModalHeaders(){var body=document.getElementById('rangeModalBody');if(!body)return;body.querySelectorAll('table thead th').forEach(function(th){var t=norm(th.textContent);if(t==='ACTUAL'||t==='DESCUENTO ACTUAL')th.textContent='Muestra';if(t==='OFERTA SISTEMA'||t==='DESCUENTO OFERTA')th.textContent='Oferta'})}
function wrapMarkdownDetails(){if(window.__V127_MD_WRAPPED__)return;window.__V127_MD_WRAPPED__=true;['openMdRule8664','openMdRule8666'].forEach(function(name){var old=window[name];if(typeof old==='function'&&!old.__v127){var w=function(){var o=old.apply(this,arguments);setTimeout(patchMarkdownModalHeaders,20);return o};w.__v127=true;window[name]=w}});if(window.V8695&&typeof window.V8695.status==='function'&&!window.V8695.status.__v127){var os=window.V8695.status;window.V8695.status=function(key){var o=os.apply(this,arguments);setTimeout(function(){var tt=document.getElementById('rangeModalTitle');if(tt&&statusNames[key])tt.textContent='Markdown · '+statusNames[key];patchMarkdownModalHeaders()},20);return o};window.V8695.status.__v127=true;if(window.V8694)window.V8694.status=window.V8695.status}}

/* 5. Detalles de reglas: Oferta visible y Actual -> Muestra. */
function patchRuleCards(){if((typeof VIEW!=='undefined'?VIEW:'')!=='markdown')return;var root=document.getElementById('content');if(!root)return;root.querySelectorAll('.mdRuleGrid8648 .v8618Card').forEach(function(c){c.style.cursor='pointer'});patchMarkdownModalHeaders()}

/* 6. Impacto de Ambientes sin alterar la lógica de cobertura: usa los estados ya calculados por el sistema. */
function rebuildGuides(){var store=st();try{if((!Array.isArray(store.guias)||!store.guias.length)&&typeof llaveroRebuildAllGuideData==='function')llaveroRebuildAllGuideData()}catch(_){}return st()}
function guideImpact(type){var store=rebuildGuides(),rows=[];(Array.isArray(store.guias)?store.guias:[]).forEach(function(g){var total=n(g&&g[3]),current=n(g&&g[4]),ps=(Array.isArray(g&&g[6])?g[6]:[]).filter(function(p){return !!(p&&p[10])}),targets=ps.filter(function(p){var status=s(p&&p[5]),code=s(p&&p[0]),cd=n((prod(code)||{}).dispCendis);if(type==='camino')return status==='camino';if(type==='requested')return status==='requested'||status==='requested_nostock';if(type==='available')return status==='available'&&cd>0;return false});if(!targets.length)return;var projected=Math.min(total,current+targets.length),complete=current<total&&projected>=total,advance=current<total&&projected>current&&projected<total;rows.push({code:s(g&&g[0]),name:s(g&&g[1]),cat:s(g&&g[2]),total:total,current:current,projected:projected,targets:targets,complete:complete,advance:advance})});return rows}
function impactSummary(type){var rows=guideImpact(type),allCodes=new Set();rows.forEach(function(g){g.targets.forEach(function(p){allCodes.add(s(p&&p[0]))})});return{rows:rows,complete:rows.filter(function(g){return g.complete}),advance:rows.filter(function(g){return g.advance}),products:allCodes.size,positions:rows.reduce(function(a,g){return a+g.targets.length},0)}}
window.openGuideImpact127=function(type,result){var x=impactSummary(type),list=result==='complete'?x.complete:x.advance,titleType=type==='camino'?'Productos en traslado':type==='requested'?'Productos solicitados':'Puedes solicitar',resultLabel=result==='complete'?'Ambientes que completarían':'Ambientes que avanzarían',trs=[];list.forEach(function(g){g.targets.forEach(function(p){var c=s(p&&p[0]),pr=prod(c),floor=s(p&&p[1])||'—',cd=n(pr.dispCendis);trs.push('<tr data-guide="'+esc(g.code)+'"><td><b>'+esc(g.name)+'</b><br><small>'+esc(g.code)+' · '+esc(g.cat)+'</small></td><td>'+floor+'</td><td>'+thumb(c)+'</td><td><span class="code">'+esc(c)+'</span></td><td><b>'+esc(pr.n||p&&p[2]||c)+'</b><br><small>'+esc([pr.cat,pr.lin,pr.sub].filter(Boolean).join(' · '))+'</small></td><td class="num">'+fi(cd)+' u</td><td class="num">'+(g.total?((g.current/g.total)*100).toFixed(1):'0.0')+'%</td><td class="num"><b>'+(g.total?((g.projected/g.total)*100).toFixed(1):'0.0')+'%</b></td></tr>')})});openRange(titleType+' · '+resultLabel,(st().name||CUR)+' · '+fi(list.length)+' ambientes · '+fi(trs.length)+' posiciones','<div class="v127DetailSummary"><div><label>Ambientes</label><b>'+fi(list.length)+'</b></div><div><label>Productos</label><b>'+fi(new Set(list.flatMap(function(g){return g.targets.map(function(p){return s(p&&p[0])})})).size)+'</b></div><div><label>Posiciones</label><b>'+fi(trs.length)+'</b></div></div><div class="v127TableWrap"><table class="v127Table"><thead><tr><th>Ambiente / guía</th><th>Piso</th><th>Imagen</th><th>Código</th><th>Producto</th><th class="num">CENDIS</th><th class="num">Cobertura actual</th><th class="num">Proyectada</th></tr></thead><tbody>'+trs.join('')+'</tbody></table></div>');setTimeout(function(){document.querySelectorAll('#rangeModalBody tr[data-guide]').forEach(function(tr){tr.onclick=function(){var g=tr.dataset.guide;if(typeof closeRangeModal==='function')closeRangeModal();setTimeout(function(){if(typeof openGuideDetailV49==='function')openGuideDetailV49(g)},30)}})},0)};
function impactGroupHtml(type,title){var x=impactSummary(type);return'<div class="v127ImpactGroup"><div class="v127ImpactGroupHead"><b>'+esc(title)+'</b><span>'+fi(x.products)+' productos · '+fi(x.positions)+' posiciones</span></div><div class="v127ImpactChoices"><button type="button" onclick="openGuideImpact127(\''+type+'\',\'complete\')"><strong>'+fi(x.complete.length)+'</strong><span>Completan</span></button><button type="button" onclick="openGuideImpact127(\''+type+'\',\'advance\')"><strong>'+fi(x.advance.length)+'</strong><span>Avanzan</span></button></div></div>'}


/* 10. Markdown: selección simple, individual, múltiple y persistente entre políticas/filtros. */
function mdAllRows(){try{return typeof window.mdRows8664==='function'?window.mdRows8664(CUR):[]}catch(_){return[]}}
function mdFilteredRows(){var rows=mdAllRows(),f=window.mdState8618||{},q=norm(f.q||'');if(f.card&&f.card!=='all'&&f.card!=='actionable')rows=rows.filter(function(r){return r.statusKey===f.card});else if(f.card==='actionable')rows=rows.filter(function(r){return r.statusKey==='manage'});if(f.type&&f.type!=='all')rows=rows.filter(function(r){if(f.type==='outside')return r.typeKey==='fs'||r.typeKey==='fs_last';if(f.type==='last_unit')return r.typeKey==='fs_last';return r.typeKey===f.type});if(f.age&&f.age!=='all')rows=rows.filter(function(r){return r.ageKey===f.age});if(f.discount&&f.discount!=='all')rows=rows.filter(function(r){return s(r.discount)===s(f.discount)});if(f.responsible&&f.responsible!=='all')rows=rows.filter(function(r){if(r.statusKey!=='manage')return false;return f.responsible==='leader'?n(r.discount)>50:n(r.discount)<=50});if(f.classification&&f.classification!=='all')rows=rows.filter(function(r){return r.cc===f.classification});if(f.policyGroup==='rot')rows=rows.filter(function(r){return norm(r.policyApplied).indexOf('ROT')>=0});if(f.policyGroup==='evac')rows=rows.filter(function(r){return norm(r.policyApplied).indexOf('EVAC')>=0});if(q)rows=rows.filter(function(r){return norm([r.code,r.name,r.category,r.line,r.subline,r.cc,r.policyApplied,r.ruleApplied,r.statusLabel].join(' ')).indexOf(q)>=0});return rows}
function mdStorageKey(){var d=s((typeof DB!=='undefined'&&DB&&DB.meta&&DB.meta.fecha)||'SIN_CORTE').replace(/[^0-9A-Za-z_-]+/g,'_');return'llavero_markdown_gestion_v8623_'+d}
function mdRead(){try{var m=JSON.parse(localStorage.getItem(mdStorageKey())||'{"items":{}}');if(!m.items)m.items={};return m}catch(_){return{items:{}}}}
function mdWrite(m){try{localStorage.setItem(mdStorageKey(),JSON.stringify(m))}catch(_){}try{if(typeof updateBar==='function')updateBar();}catch(_){}try{if(window.V8623&&typeof window.V8623.updateBar==='function')window.V8623.updateBar();}catch(_){}}
function mdKey(c){return s(CUR)+'|'+s(c)}
window.selectAllMarkdownResults127=function(){var rows=mdFilteredRows().filter(function(r){return r.statusKey==='manage'}),m=mdRead();rows.forEach(function(r){var k=mdKey(r.code),old=m.items[k]||{};m.items[k]={storeCode:s(CUR),code:s(r.code),requestedDiscount:n(old.requestedDiscount||r.discount),note:s(old.note||'')}});mdWrite(m);if(window.V8623&&typeof V8623.render==='function')V8623.render();patchMarkdownSelection();if(typeof toast==='function')toast(fi(rows.length)+' productos seleccionados en los resultados actuales.','ok')};
function patchMarkdownSelection(){if((typeof VIEW!=='undefined'?VIEW:'')!=='markdown')return;var root=document.getElementById('content');if(!root)return;var table=root.querySelector('#markdown-table-8618 table.v8680MarkdownTable');if(table){var head=table.tHead&&table.tHead.rows&&table.tHead.rows[0];if(head){Array.from(head.cells).forEach(function(th,i){if(i>0&&norm(th.textContent)==='SEL.')return;var cb=th.querySelector('input[type=checkbox]');if(cb)cb.remove()})}var mem=mdRead();table.querySelectorAll('tbody tr[data-md-product]').forEach(function(tr){var cells=tr.cells,sel=tr.querySelector('.v8680Sel input[type=checkbox]');if(!sel&&cells&&cells[0])sel=cells[0].querySelector('input[type=checkbox]');if(!sel)return;var c=s(tr.dataset.mdProduct);sel.disabled=false;var row=mdAllRows().find(function(r){return s(r.code)===c});if(!row||row.statusKey!=='manage'){sel.disabled=true;sel.checked=false;return}sel.checked=!!mem.items[mdKey(c)];sel.onclick=function(e){e.stopPropagation()};sel.onchange=function(e){e.stopPropagation();if(window.V8623){if(this.checked)V8623.add(CUR,c);else V8623.remove(CUR,c)}setTimeout(patchMarkdownSelection,0)}})}var bar=document.getElementById('v8623ManageBar');if(bar){bar.querySelectorAll('.v8623ManageActions button').forEach(function(b){var t=norm(b.textContent);if(t==='SELECCIONAR VISIBLES')b.textContent='Seleccionar visibles';if(t.indexOf('LIMPIAR LISTA')>=0)b.textContent='Limpiar selección'});var actions=bar.querySelector('.v8623ManageActions');if(actions&&!actions.querySelector('[data-v127-select-all]')){var all=document.createElement('button');all.type='button';all.className='v8623ManageBtn';all.dataset.v127SelectAll='1';all.textContent='Seleccionar todos los resultados';all.onclick=selectAllMarkdownResults127;var view=actions.querySelector('#v8623ViewBtn');actions.insertBefore(all,view||null)}}}

/* 11 y 13. Menos colores y menos ruido visual. */
function patchNoise(){var root=document.getElementById('content');if(!root)return;root.querySelectorAll('.dashboardNote,.hint,.v8662MixNote').forEach(function(x){var t=norm(x.textContent);if(t.indexOf('75/15/10')>=0||t.indexOf('META 75')>=0)x.remove()});Array.from(root.querySelectorAll('.card')).forEach(function(card){var tt=card.querySelector('.tt'),t=norm(tt&&tt.textContent);if(t==='VENTAS'||t.indexOf('VENTAS POR CATEGORIA')===0||t==='CLIENTES')card.remove()});root.querySelectorAll('.kpi,.mk,.v8618Card,.transferMetricCard8616,.transferKpi8615').forEach(function(c){c.classList.add('v127NeutralCard')})}

/* 12. Ventas y Clientes fuera de Administrador y Líder: navegación y rutas. */
function removeSalesClients(){var nav=document.getElementById('nav');if(nav)nav.querySelectorAll('[data-v="vta"],[data-v="cli"]').forEach(function(x){x.remove()});var root=document.getElementById('content');if(root)root.querySelectorAll('[onclick*="vta"],[onclick*="cli"]').forEach(function(x){var card=x.closest('.card,.kpi');if(card)card.remove()})}

/* 14. Acción del Líder con nombre y ubicación clara. */
function patchLeaderAction(){if((typeof VIEW!=='undefined'?VIEW:'')!=='markdown')return;var root=document.getElementById('content');if(!root)return;root.querySelectorAll('.v8664LeaderBtn,.v8662LeaderBtn').forEach(function(x){if(/TODAS LAS TIENDAS|50%/.test(norm(x.textContent)))x.remove()});var old=root.querySelector('.v127LeaderAction');if(old)old.remove();if(typeof IS_LEADER!=='undefined'&&IS_LEADER){var anchor=document.getElementById('v8623ManageBar')||document.getElementById('markdown-table-8618');if(anchor){var box=document.createElement('div');box.className='v127LeaderAction';box.innerHTML='<div><b>Actualizar descuentos según la política en todas las tiendas</b><span>Consolida la gestión de productos que requieren ajuste, respetando la política y el responsable definido.</span></div><button type="button">Abrir gestión de todas las tiendas</button>';box.querySelector('button').onclick=function(){if(typeof openLeaderAll8664==='function')openLeaderAll8664()};anchor.parentNode.insertBefore(box,anchor)}}}

/* 15. Mismo lenguaje visual de filtros, campos según el módulo. */
var filterCfg={
 inventario:[['q','Búsqueda rápida','search'],['cc','Clasificación','select'],['cond','Condición','condition'],['cat','Categoría','select'],['lin','Línea','select'],['sub','Sublínea','select'],['cendis','CENDIS','cendis']],
 prox:[['q','Búsqueda rápida','search'],['cc','Clasificación','select'],['cat','Categoría','select'],['lin','Línea','select'],['sub','Sublínea','select'],['cendis','CENDIS','cendis'],['sales','Venta 3 meses','sales']],
 rot:[['q','Búsqueda rápida','search'],['cc','Clasificación','select'],['cat','Categoría','select'],['lin','Línea','select'],['sub','Sublínea','select'],['age','Antigüedad','age'],['cendis','CENDIS','cendis'],['sales','Venta 3 meses','sales']],
 evac:[['q','Búsqueda rápida','search'],['cc','Clasificación','select'],['cat','Categoría','select'],['lin','Línea','select'],['sub','Sublínea','select'],['age','Antigüedad','age'],['cendis','CENDIS','cendis'],['sales','Venta 3 meses','sales']]
};
function tableRowsFor(module){var root=document.getElementById(module==='inventario'?'inventario-tbl':module==='prox'?'prox-tbl':module+'-tbl'),table=root&&root.querySelector('table');return table&&table.tBodies&&table.tBodies[0]?Array.from(table.tBodies[0].rows).filter(function(tr){return !!(tr.querySelector('.code'))}):[]}
function rowCode(tr){var x=tr.querySelector('.code');return s(x&&x.textContent).trim()}
function filterHtml(type,key){if(type==='search')return'<input type="search" data-v127-f="'+key+'" placeholder="Código o producto...">';if(type==='condition')return'<select data-v127-f="'+key+'"><option value="">Todas</option><option value="Sanos">Sanos</option><option value="Próximos a rotar">Próximos a rotar</option><option value="Rotación">Rotación</option><option value="Evacuación">Evacuación</option></select>';if(type==='cendis')return'<select data-v127-f="'+key+'"><option value="">Todos</option><option value="with">Con respaldo</option><option value="without">Sin respaldo</option></select>';if(type==='sales')return'<select data-v127-f="'+key+'"><option value="">Todas</option><option value="with">Con venta</option><option value="without">Sin venta</option></select>';if(type==='age')return'<select data-v127-f="'+key+'"><option value="">Todos los rangos</option><option value="0-60">0–60</option><option value="61-90">61–90</option><option value="91-150">91–150</option><option value="151-180">151–180</option><option value="181-210">181–210</option><option value="211-240">211–240</option><option value="241-360">241–360</option><option value="360+">+360</option></select>';return'<select data-v127-f="'+key+'"></select>'}
function selectOptions(vals,label){var u=Array.from(new Set(vals.filter(Boolean))).sort(function(a,b){return s(a).localeCompare(s(b),'es')});return'<option value="">'+esc(label||'Todos')+'</option>'+u.map(function(v){return'<option value="'+esc(v)+'">'+esc(v)+'</option>'}).join('')}
function dataForCode(code){code=s(code);var c=v127EnsureCache();if(c.data[code])return c.data[code];var r=invMap()[code]||{},p=prod(code),d={code:code,p:p,cc:norm(p.cc||'SIN CLASIFICACIÓN').replace('SIN CLASIFICACION','SIN CLASIFICACIÓN'),cat:s(p.cat||r.categoria),lin:s(p.lin||r.linea),sub:s(p.sub||r.sublinea),cendis:n(r.dispCendis!=null?r.dispCendis:p.dispCendis),sales:n(r.unidadesFacUlt3Meses),cond:conditionOf(code),ages:ageBuckets(r)};c.data[code]=d;return d}
function populate127(module,bar){var rows=tableRowsFor(module).map(function(tr){return dataForCode(rowCode(tr))}),cc=bar.querySelector('[data-v127-f="cc"]'),cat=bar.querySelector('[data-v127-f="cat"]'),lin=bar.querySelector('[data-v127-f="lin"]'),sub=bar.querySelector('[data-v127-f="sub"]');function reset(sel,vals){if(!sel)return;var cur=sel.value;sel.innerHTML=selectOptions(vals);if(Array.from(sel.options).some(function(o){return o.value===cur}))sel.value=cur}reset(cc,rows.map(function(x){return x.cc}));var cv=cc&&cc.value,byCc=rows.filter(function(x){return !cv||x.cc===cv});reset(cat,byCc.map(function(x){return x.cat}));var av=cat&&cat.value,byCat=byCc.filter(function(x){return !av||x.cat===av});reset(lin,byCat.map(function(x){return x.lin}));var lv=lin&&lin.value,byLin=byCat.filter(function(x){return !lv||x.lin===lv});reset(sub,byLin.map(function(x){return x.sub}))}
function apply127(module,bar){var v={};bar.querySelectorAll('[data-v127-f]').forEach(function(x){v[x.dataset.v127F]=x.value});var rows=tableRowsFor(module),shown=0;rows.forEach(function(tr){var d=dataForCode(rowCode(tr)),ok=!v.q||norm([d.code,d.p.n,d.cat,d.lin,d.sub].join(' ')).indexOf(norm(v.q))>=0;if(ok&&v.cc&&d.cc!==v.cc)ok=false;if(ok&&v.cat&&d.cat!==v.cat)ok=false;if(ok&&v.lin&&d.lin!==v.lin)ok=false;if(ok&&v.sub&&d.sub!==v.sub)ok=false;if(ok&&v.cond&&d.cond!==v.cond)ok=false;if(ok&&v.cendis==='with'&&d.cendis<=0)ok=false;if(ok&&v.cendis==='without'&&d.cendis>0)ok=false;if(ok&&v.sales==='with'&&d.sales<=0)ok=false;if(ok&&v.sales==='without'&&d.sales>0)ok=false;if(ok&&v.age&&d.ages.indexOf(v.age)<0)ok=false;tr.style.display=ok?'':'none';if(ok)shown++});var ct=bar.querySelector('.v127FilterCount');if(ct)ct.textContent=fi(shown)+' de '+fi(rows.length)+' productos'}
function patchModuleFilters(){var module=(typeof VIEW!=='undefined'?VIEW:'');if(!filterCfg[module])return;var rows=tableRowsFor(module);if(!rows.length)return;var old=document.querySelector('.v118ModuleFilters[data-module="'+module+'"]'),root=document.getElementById(module==='inventario'?'inventario-tbl':module==='prox'?'prox-tbl':module+'-tbl');if(!root)return;var bar=old||document.createElement('div');bar.className='v118ModuleFilters v127ContextFilters';bar.dataset.module=module;if(bar.dataset.v127Ready!==module){bar.innerHTML=filterCfg[module].map(function(f){return'<div class="v118ModuleField"><label>'+esc(f[1])+'</label>'+filterHtml(f[2],f[0])+'</div>'}).join('')+'<button type="button" class="v118ModuleClear">Limpiar filtros</button><span class="v127FilterCount"></span>';bar.dataset.v127Ready=module;if(!old)root.parentNode.insertBefore(bar,root);var timer=0;bar.querySelectorAll('input,select').forEach(function(x){var ev=x.tagName==='INPUT'?'input':'change';x.addEventListener(ev,function(){if(['cc','cat','lin'].indexOf(x.dataset.v127F)>=0)populate127(module,bar);if(ev==='input'){clearTimeout(timer);timer=setTimeout(function(){apply127(module,bar)},60)}else apply127(module,bar)})});bar.querySelector('.v118ModuleClear').onclick=function(){bar.querySelectorAll('input').forEach(function(x){x.value=''});bar.querySelectorAll('select').forEach(function(x){x.value=''});populate127(module,bar);apply127(module,bar)}}populate127(module,bar);apply127(module,bar)}

function mark(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var b=document.querySelector('.appVersionChip b');if(b)b.textContent='18/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 18/08/2026 · '+VERSION}catch(_){} }
function patchAll(){removeSalesClients();patchUnknownWarning();patchTransferImpact();patchDeletedOrders();patchMarkdownLabels();patchRuleCards();patchMarkdownSelection();patchLeaderAction();patchModuleFilters();patchNoise();patchMarkdownModalHeaders();mark()}
var patchTimer127=0;function schedulePatch127(ms){clearTimeout(patchTimer127);patchTimer127=setTimeout(function(){patchTimer127=0;patchAll()},ms==null?60:ms)}
function install(){if(!window.__LLAVERO_BOOTSTRAPPED__||typeof window.setView!=='function'){setTimeout(install,120);return}removeSalesClients();wrapMarkdownDetails();var sv=window.setView;if(typeof sv==='function'&&!sv.__v127){var w=function(v){if(v==='vta'||v==='cli')v='inventario';var o=sv.call(this,v);schedulePatch127(70);return o};w.__v127=true;window.setView=w;try{setView=w}catch(_){}}var rf=window.refresh;if(typeof rf==='function'&&!rf.__v127){var wr=function(){if(typeof VIEW!=='undefined'&&(VIEW==='vta'||VIEW==='cli'))VIEW='inventario';var o=rf.apply(this,arguments);schedulePatch127(70);return o};wr.__v127=true;window.refresh=wr;try{refresh=wr}catch(_){}}var dm=window.drawMarkdown8617;if(typeof dm==='function'&&!dm.__v127){var wd=function(){var o=dm.apply(this,arguments);setTimeout(function(){patchMarkdownLabels();patchMarkdownSelection();patchLeaderAction();patchMarkdownModalHeaders()},60);return o};wd.__v127=true;window.drawMarkdown8617=wd;try{drawMarkdown8617=wd}catch(_){}}['drawInventario','drawProx','drawRot','drawEvac'].forEach(function(name){var old=window[name];if(typeof old!=='function'||old.__v127)return;var ww=function(){var o=old.apply(this,arguments);setTimeout(patchModuleFilters,40);return o};ww.__v127=true;window[name]=ww;try{if(name==='drawInventario')drawInventario=ww;else if(name==='drawProx')drawProx=ww;else if(name==='drawRot')drawRot=ww;else if(name==='drawEvac')drawEvac=ww}catch(_){}});document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('.v8664MdBar');if(b){var oc=b.getAttribute('onclick')||'',m=oc.match(/status\(['\"]([^'\"]+)/);if(m&&window.V8695){e.preventDefault();e.stopPropagation();window.V8695.status(m[1]);return}}var pc=e.target&&e.target.closest&&e.target.closest('.v8681PolicyCard');if(pc){setTimeout(patchMarkdownModalHeaders,30)}},true);schedulePatch127(70);console.info('LLAVERO V86.127 · depuración funcional/visual, Markdown y Traslados ajustados; lógica de cobertura de Ambientes sin modificar')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,100)},{once:true});window.addEventListener('llavero:view-stable',function(){schedulePatch127(60)});
})();



/* ==== llaveroV86128Script ==== */

(function(){
'use strict';
if(window.__LLAVERO_V86128__)return;window.__LLAVERO_V86128__=true;
var VERSION='V86.128', renderTimer=0;
var T={state:'rot',metric:'both',status:'all',from:'',to:'',mode:'previous'};
function s(v){return v==null?'':String(v)}
function n(v){var x=Number(v);return Number.isFinite(x)?x:0}
function esc(v){return s(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c})}
function fi(v){try{return typeof fInt==='function'?fInt(n(v)):Math.round(n(v)).toLocaleString('es-CO')}catch(_){return String(Math.round(n(v)))}}
function money(v){try{return typeof fMoneyCOP==='function'?fMoneyCOP(n(v)):'$ '+Math.round(n(v)).toLocaleString('es-CO')}catch(_){return '$ '+Math.round(n(v))}}
function dateLabel(v){var m=s(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:s(v||'—')}
function stateLabel(){return T.state==='both'?'Rotación y Evacuación':(T.state==='evac'?'Evacuación':'Rotación')}
function stateRows(src,key){if(!src)return[];if(key==='both')return(src.rot||[]).concat(src.evac||[]);return src[key]||[]}
function aggState(storeSnap,key){if(!storeSnap)return null;if(key==='both'){var r=storeSnap.rot,e=storeSnap.evac;if(!r&&!e)return null;function g(o,f){return o?n(o[f]):0}return{currentCount:g(r,'currentCount')+g(e,'currentCount'),previousCount:g(r,'previousCount')+g(e,'previousCount'),recoveredCount:g(r,'recoveredCount')+g(e,'recoveredCount'),newCount:g(r,'newCount')+g(e,'newCount'),persistentCount:g(r,'persistentCount')+g(e,'persistentCount'),currentVal:g(r,'currentVal')+g(e,'currentVal'),previousVal:g(r,'previousVal')+g(e,'previousVal'),recoveredVal:g(r,'recoveredVal')+g(e,'recoveredVal'),newVal:g(r,'newVal')+g(e,'newVal')}}return storeSnap[key]||null}
function currentView(){try{return typeof VIEW!=='undefined'?VIEW:''}catch(_){return''}}
function storeCode(){try{return typeof CUR!=='undefined'?s(CUR):''}catch(_){return''}}
function storeObj(){try{return typeof S!=='undefined'&&S?S[storeCode()]||{}:{}}catch(_){return{}}}
function product(c){try{return typeof P!=='undefined'&&P&&P[c]?P[c]:{n:c,cat:'—',lin:'—',sub:'—'}}catch(_){return{n:c,cat:'—',lin:'—',sub:'—'}}}
function history(){try{var el=document.getElementById('embeddedHistory'),h=JSON.parse(el&&el.textContent||'{}');if(!h||typeof h!=='object')return null;if(!Array.isArray(h.daily))h.daily=[];if(!Array.isArray(h.details))h.details=[];injectCurrentDetail(h,el);return h}catch(e){console.warn('V86.128 historial',e);return null}}
function injectCurrentDetail(h,el){try{var d=s(DB&&DB.meta&&DB.meta.fecha);if(!d||h.details.some(function(x){return x&&x.date===d}))return;if(typeof buildDetailedSnapshot!=='function')return;var snap=buildDetailedSnapshot();if(snap&&snap.date&&snap.stores){h.details.push(snap);h.details.sort(function(a,b){return s(a.date).localeCompare(s(b.date))});if(el)el.textContent=JSON.stringify(h)}}catch(e){console.warn('V86.128 detalle corte actual',e)}}
function dates(){var h=history(),a=[];if(h){h.daily.forEach(function(x){if(x&&x.date)a.push(x.date)});h.details.forEach(function(x){if(x&&x.date)a.push(x.date)})}try{if(DB&&DB.meta&&DB.meta.fecha)a.push(s(DB.meta.fecha))}catch(_){}return Array.from(new Set(a)).sort()}
function daily(date){var h=history();return h&&h.daily.find(function(x){return x&&x.date===date})}
function detail(date){var h=history();return h&&h.details.find(function(x){return x&&x.date===date})}
function mapRows(rows){var m=Object.create(null);(rows||[]).forEach(function(r){var c=s(r&&r[0]).trim();if(!c)return;if(!m[c])m[c]={u:0,v:0,age:-1};m[c].u+=n(r&&r[1]);m[c].v+=n(r&&r[2]);m[c].age=Math.max(m[c].age,n(r&&r[3]))});return m}
function pStatus(a,b,had,has){if(had&&!has)return'recovered';if(!had&&has)return'new';var du=n(b.u)-n(a.u),dv=n(b.v)-n(a.v);if(T.metric==='units'){if(du<-.0001)return'partial';if(du>.0001)return'increased';return'persistent'}if(T.metric==='value'){if(dv<-.01)return'partial';if(dv>.01)return'increased';return'persistent'}if(Math.abs(du)<.0001&&Math.abs(dv)<.01)return'persistent';if(du<=0&&dv<=0&&(du<0||dv<0))return'partial';if(du>=0&&dv>=0&&(du>0||dv>0))return'increased';return'mixed'}
function exactCompare(a,b){var key=T.state,sc=storeCode(),am=mapRows(stateRows(a.stores&&a.stores[sc],key)),bm=mapRows(stateRows(b.stores&&b.stores[sc],key)),keys=Array.from(new Set(Object.keys(am).concat(Object.keys(bm)))),items=[];keys.forEach(function(c){var had=!!am[c],has=!!bm[c],x=am[c]||{u:0,v:0,age:-1},y=bm[c]||{u:0,v:0,age:-1},p=product(c);items.push({c:c,p:p,refU:x.u,curU:y.u,diffU:y.u-x.u,refV:x.v,curV:y.v,diffV:y.v-x.v,status:pStatus(x,y,had,has),unitManaged:had&&!has,unitPartial:had&&has&&y.u<x.u-.0001,unitNew:!had&&has})});function sum(fn){return items.reduce(function(z,r){return z+n(fn(r))},0)}var refU=sum(function(r){return r.refU}),curU=sum(function(r){return r.curU}),refV=sum(function(r){return r.refV}),curV=sum(function(r){return r.curV}),newU=sum(function(r){return r.unitNew?r.curU:0}),recU=sum(function(r){return r.unitManaged?r.refU:0}),partU=sum(function(r){return r.unitPartial?Math.max(0,r.refU-r.curU):0}),newV=sum(function(r){return r.unitNew?r.curV:0}),recV=sum(function(r){return r.unitManaged?r.refV:0}),partV=sum(function(r){return r.refV>0&&r.curV>0?Math.max(0,r.refV-r.curV):0}),adjU=refU+newU,adjV=refV+newV;return{exact:true,items:items,products:{initial:Object.keys(am).length,final:Object.keys(bm).length,managed:items.filter(function(r){return r.unitManaged}).length,partial:items.filter(function(r){return r.unitPartial}).length,fresh:items.filter(function(r){return r.unitNew}).length},units:{ref:refU,cur:curU,managed:recU,reduced:partU,newVal:newU,progress:adjU?(adjU-curU)/adjU*100:0},value:{ref:refV,cur:curV,managed:recV,reduced:partV,newVal:newV,progress:adjV?(adjV-curV)/adjV*100:0}}}
function aggregateCompare(from,to){var ds=dates(),a=daily(from),b=daily(to),sc=storeCode(),ak=aggState(a&&a.stores&&a.stores[sc],T.state),bk=aggState(b&&b.stores&&b.stores[sc],T.state),idx=ds.indexOf(to),adjacent=idx>0&&ds[idx-1]===from&&!!bk;if(!ak||!bk)return{exact:false,unsupported:true,items:[],products:{initial:null,final:null,managed:null,partial:null,fresh:null}};var initial=adjacent?n(bk.previousCount):n(ak.currentCount),final=n(bk.currentCount),managed=adjacent?n(bk.recoveredCount):null,fresh=adjacent?n(bk.newCount):null;var refV=adjacent?n(bk.previousVal):n(ak.currentVal),curV=n(bk.currentVal),managedV=adjacent?n(bk.recoveredVal):null,newV=adjacent?n(bk.newVal):null,progressV;if(!adjacent)progressV=null;else if(T.state==='both'){var adjRef=refV+newV;progressV=adjRef?((adjRef-curV)/adjRef*100):0}else progressV=n(bk.reductionAdj);return{exact:false,adjacent:adjacent,items:[],products:{initial:initial,final:final,managed:managed,partial:null,fresh:fresh},units:null,value:{ref:refV,cur:curV,managed:managedV,reduced:null,newVal:newV,progress:progressV},persistent:adjacent?n(bk.persistentCount):null}}
function compare(){var a=detail(T.from),b=detail(T.to);return a&&b?exactCompare(a,b):aggregateCompare(T.from,T.to)}
function ensureState(){var d=dates();if(!d.length)return d;var last=d[d.length-1],prev=d[Math.max(0,d.length-2)];if(d.indexOf(T.to)<0)T.to=last;if(d.indexOf(T.from)<0)T.from=prev;if(T.from>T.to){var z=T.from;T.from=T.to;T.to=z}return d}
function progress(v){if(v==null)return'<span class="v128Unavailable">—</span>';var cl=v>.05?'good':v<-.05?'bad':'flat',a=v>.05?'↑':v<-.05?'↓':'→';return'<span class="trackProgress '+cl+'">'+a+' '+Math.abs(v).toFixed(1)+'%</span>'}
function productCards(c){var p=c.products||{},f=function(v){return v==null?'—':fi(v)};return'<div class="v8680TrackProducts"><div><label>Productos iniciales</label><b>'+f(p.initial)+'</b><small>'+dateLabel(T.from)+'</small></div><div><label>Productos finales</label><b>'+f(p.final)+'</b><small>'+dateLabel(T.to)+'</small></div><div><label>Productos gestionados</label><b>'+f(p.managed)+'</b><small>Salieron completamente</small></div><div><label>Productos con reducción parcial</label><b>'+f(p.partial)+'</b><small>'+(p.partial==null?'Requiere detalle histórico':'Siguen con menos unidades')+'</small></div><div><label>Productos nuevos</label><b>'+f(p.fresh)+'</b><small>'+(p.fresh==null?'No derivable entre cortes no consecutivos':'Ingresaron en el corte final')+'</small></div></div>'}
function metricCard(label,badge,x,isMoney){var f=isMoney?money:fi;if(!x)return'<div class="trackingMeasure"><div class="trackingMeasureHead"><b>'+label+'</b><span>'+badge+'</span></div><div class="trackingMetricGrid"><div class="trackingMetric"><label>Referencia</label><b class="v128Unavailable">—</b></div><div class="trackingMetric"><label>Actual</label><b class="v128Unavailable">—</b></div><div class="trackingMetric"><label>Gestionado</label><b class="v128Unavailable">—</b></div><div class="trackingMetric"><label>Reducción</label><b class="v128Unavailable">—</b></div><div class="trackingMetric"><label>Avance</label><b class="v128Unavailable">—</b></div></div></div>';return'<div class="trackingMeasure"><div class="trackingMeasureHead"><b>'+label+'</b><span>'+badge+'</span></div><div class="trackingMetricGrid"><div class="trackingMetric"><label>Referencia</label><b>'+f(x.ref)+'</b></div><div class="trackingMetric"><label>Actual</label><b>'+f(x.cur)+'</b></div><div class="trackingMetric good"><label>'+(isMoney?'Valor gestionado':'Uds. gestionadas')+'</label><b>'+(x.managed==null?'—':f(x.managed))+'</b></div><div class="trackingMetric good"><label>'+(isMoney?'Valor reducido':'Uds. reducidas')+'</label><b>'+(x.reduced==null?'—':f(x.reduced))+'</b></div><div class="trackingMetric '+(x.progress!=null&&x.progress>=0?'good':'bad')+'"><label>Avance ajustado</label><b>'+progress(x.progress)+'</b></div></div></div>'}
function statusName(v){return{all:'Todos',recovered:'Gestionado',partial:'Reducción parcial',persistent:'Persistente',new:'Nuevo',increased:'Aumentó',mixed:'Cambio mixto'}[v]||v}
function statusBar(c){var defs=['all','recovered','partial','persistent','new','increased','mixed'];return'<div class="v128StatusBar">'+defs.map(function(k){var val=null,disabled=!c.exact;if(c.exact)val=k==='all'?c.items.length:c.items.filter(function(r){return r.status===k}).length;else if(c.adjacent){if(k==='recovered')val=c.products.managed;else if(k==='new')val=c.products.fresh;else if(k==='persistent')val=c.persistent;else if(k==='all')val=(c.products.initial||0)+(c.products.fresh||0)}var label=k==='persistent'&&!c.exact?'Permanecieron':statusName(k);return'<button type="button" class="v128StatusBtn '+(c.exact&&T.status===k?'on':'')+'" data-status="'+k+'" '+(disabled?'disabled':'')+'><span class="v128Dot"></span><span>'+label+'</span><b>'+(val==null?'—':fi(val))+'</b></button>'}).join('')+'</div>'}
function resultPill(k){return'<span class="trackingResult '+k+'">'+statusName(k)+'</span>'}
function table(c){if(!c.exact)return'<div class="v128TrackingEmpty"><b>Detalle por producto no disponible para esta pareja de cortes.</b><br>El histórico embebido conserva el resumen agregado, pero no las identidades por producto en uno de los cortes. Llavero no inventa reducciones parciales ni productos específicos.</div>';var rows=c.items.slice();if(T.status!=='all')rows=rows.filter(function(r){return r.status===T.status});var order={recovered:0,partial:1,new:2,increased:3,mixed:4,persistent:5};rows.sort(function(a,b){return(order[a.status]-order[b.status])||Math.abs(b.diffV)-Math.abs(a.diffV)||Math.abs(b.diffU)-Math.abs(a.diffU)});if(!rows.length)return'<div class="v128TrackingEmpty">No hay productos para este resultado.</div>';var uc=T.metric!=='value',vc=T.metric!=='units';return'<div class="v128TrackingTableWrap"><table class="v128TrackingTable"><colgroup><col style="width:56px"><col style="width:88px"><col style="width:280px"><col style="width:135px">'+(uc?'<col style="width:88px"><col style="width:88px"><col style="width:90px">':'')+(vc?'<col style="width:120px"><col style="width:120px"><col style="width:125px">':'')+'</colgroup><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Resultado</th>'+(uc?'<th class="num">Uds. inicial</th><th class="num">Uds. final</th><th class="num">Dif. uds.</th>':'')+(vc?'<th class="num">Valor inicial</th><th class="num">Valor final</th><th class="num">Dif. valor</th>':'')+'</tr></thead><tbody>'+rows.map(function(r){var im='';try{if(typeof imageThumb==='function')im=imageThumb(r.c,'sm')}catch(_){}return'<tr data-v128-code="'+esc(r.c)+'" tabindex="0" role="button"><td>'+im+'</td><td><span class="code">'+esc(r.c)+'</span></td><td><div class="v128TrackProduct">'+esc(r.p.n||r.c)+'</div><div class="v128TrackMeta">'+esc([r.p.cat,r.p.lin,r.p.sub].filter(Boolean).join(' · '))+'</div></td><td>'+resultPill(r.status)+'</td>'+(uc?'<td class="num">'+fi(r.refU)+'</td><td class="num"><b>'+fi(r.curU)+'</b></td><td class="num"><b>'+(r.diffU>0?'+':'')+fi(r.diffU)+'</b></td>':'')+(vc?'<td class="num">'+money(r.refV)+'</td><td class="num"><b>'+money(r.curV)+'</b></td><td class="num"><b>'+(r.diffV>0?'+':'')+money(r.diffV)+'</b></td>':'')+'</tr>'}).join('')+'</tbody></table></div>'}
function options(d,val){return d.map(function(x){return'<option value="'+esc(x)+'" '+(x===val?'selected':'')+'>'+dateLabel(x)+'</option>'}).join('')}
function renderTracking(){renderTimer=0;if(currentView()!=='resumen')return;var panel=document.getElementById('storeTrackingPanel'),d=ensureState();if(!panel||!d.length)return;var c=compare(),st=storeObj(),modeLabel=T.mode==='base'?'Corte base':T.mode==='previous'?'Corte anterior':'Personalizado',availability=c.exact?'<div class="v128Availability good">✓ <span><b>Comparación detallada disponible.</b> Los productos, unidades, valores y estados se calculan código por código.</span></div>':'<div class="v128Availability warn">⚠ <span><b>Comparación agregada y verificable.</b> Uno de los cortes no trae snapshot detallado por producto. Se muestran solo métricas soportadas por el histórico; “Reducción parcial” y el detalle por producto quedan en — para no fabricar información.</span></div>';var controls='<div class="v128TrackingControls"><div class="v128ControlGroup"><span class="v128ControlLabel">Comparar</span><button class="v128TrackBtn '+(T.mode==='previous'?'on':'')+'" data-v128-mode="previous">Corte anterior</button><button class="v128TrackBtn '+(T.mode==='base'?'on':'')+'" data-v128-mode="base">Corte base</button><button class="v128TrackBtn '+(T.mode==='custom'?'on':'')+'" data-v128-mode="custom">Personalizado</button></div><div class="v128DateSelectors"><div class="v128DateField"><label>Corte inicial</label><select data-v128-date="from">'+options(d,T.from)+'</select></div><div class="v128DateField"><label>Corte final</label><select data-v128-date="to">'+options(d,T.to)+'</select></div></div><div class="v128ControlGroup"><span class="v128ControlLabel">Estado</span><button class="v128TrackBtn '+(T.state==='rot'?'on':'')+'" data-v128-state="rot">Rotación</button><button class="v128TrackBtn '+(T.state==='evac'?'on':'')+'" data-v128-state="evac">Evacuación</button><button class="v128TrackBtn '+(T.state==='both'?'on':'')+'" data-v128-state="both">Ambos</button></div><div class="v128ControlGroup"><span class="v128ControlLabel">Vista</span><button class="v128TrackBtn '+(T.metric==='units'?'on':'')+'" data-v128-metric="units">Unidades</button><button class="v128TrackBtn '+(T.metric==='value'?'on':'')+'" data-v128-metric="value">Pesos</button><button class="v128TrackBtn '+(T.metric==='both'?'on':'')+'" data-v128-metric="both">Juntos</button></div><div class="v128Reference">'+modeLabel+'<br><b>'+dateLabel(T.from)+' → '+dateLabel(T.to)+'</b></div><button type="button" class="v128TrackBtn v128PdfBtn" data-v128-pdf="1">⬇ Generar PDF</button></div>';var units=c.exact?{ref:c.units.ref,cur:c.units.cur,managed:c.units.managed,reduced:c.units.reduced,newVal:c.units.newVal,progress:c.units.progress}:null,value=c.value?{ref:c.value.ref,cur:c.value.cur,managed:c.value.managed,reduced:c.value.reduced,newVal:c.value.newVal,progress:c.value.progress}:null;panel.className='card trackingPanel v128Tracking';panel.innerHTML='<div class="chead"><div class="cnum n1">↔</div><div><div class="tt">Seguimiento frente al corte</div><div class="ds">Qué salió, disminuyó, permaneció, ingresó o aumentó en '+stateLabel()+'</div></div><div class="rt"><span class="badge mut">'+esc(st.name||storeCode())+'</span></div></div>'+controls+'<div class="cbody">'+availability+productCards(c)+'<div class="v128DualSummary">'+metricCard('Vista por unidades','UNIDADES',units,false)+metricCard('Vista por valor del inventario','COP',value,true)+'</div>'+statusBar(c)+table(c)+'<div class="v128TrackingNote"><b>Cómo clasifica:</b> por tienda y código. “Gestionado” salió completamente del estado; “Reducción parcial” sigue con menos unidades; “Nuevo” ingresó en el corte final. Los contadores superiores son <b>Productos</b>; las vistas inferiores separan explícitamente unidades y valor.</div></div>';wireTracking(panel)}
function narrativeTracking(c,st){var stateTxt=stateLabel();if(!c.exact){return '<p>El histórico disponible para este par de cortes no incluye el detalle por producto (código a código), por lo que no es posible construir un resumen narrativo completo. Los datos que siguen son el resumen agregado que sí está soportado por el histórico embebido.</p>'}var items=c.items||[];function cnt(k){return items.filter(function(r){return r.status===k}).length}var total=items.length,managed=cnt('recovered'),partial=cnt('partial'),fresh=cnt('new'),persistent=cnt('persistent'),increased=cnt('increased'),mixed=cnt('mixed'),v=c.value||{};var progTxt=(v.progress==null)?'no fue posible calcular el avance ajustado con los datos disponibles':('esto equivale a '+(v.progress>=0?'un avance de '+Math.abs(v.progress).toFixed(1)+'%':'un retroceso de '+Math.abs(v.progress).toFixed(1)+'%')+' en el valor gestionado frente al valor de referencia ajustado');var p1='Entre el corte del '+esc(dateLabel(T.from))+' y el corte del '+esc(dateLabel(T.to))+', la tienda '+esc(st.name||storeCode())+' registró '+fi(total)+' producto(s) con inventario en '+stateTxt.toLowerCase()+' en al menos uno de los dos cortes.';var p2='De estos, '+fi(managed)+' salieron completamente del estado (gestionados en su totalidad), '+fi(partial)+' redujeron su exposición sin salir por completo, '+fi(persistent)+' permanecieron sin cambios relevantes'+(fresh?', '+fi(fresh)+' ingresaron como nuevos en el corte final':'')+(increased?' y '+fi(increased)+' aumentaron su exposición frente al corte inicial':'')+(mixed?'. Adicionalmente, '+fi(mixed)+' producto(s) presentaron un cambio mixto entre unidades y valor':'')+'.';var p3='En valor de inventario se gestionó '+money(v.managed||0)+' y se redujo adicionalmente '+money(v.reduced||0)+' por reducción parcial, frente a '+money(v.newVal||0)+' que ingresó en productos nuevos; '+progTxt+'.';var movers=items.filter(function(r){return r.status==='recovered'||r.status==='partial'}).slice().sort(function(a,b){return (b.refV-b.curV)-(a.refV-a.curV)}).slice(0,5);var moversHtml=movers.length?('<p><b>Principales movimientos por valor gestionado:</b></p><ul>'+movers.map(function(r){return '<li>'+esc(r.p.n||r.c)+' ('+esc(r.c)+') · '+esc(statusName(r.status))+' · '+money(r.refV)+' → '+money(r.curV)+' ('+fi(r.refU)+' → '+fi(r.curU)+' u)</li>'}).join('')+'</ul>'):'';return '<p>'+p1+' '+p2+' '+p3+'</p>'+moversHtml}
function downloadTrackingPdf(c){var d=ensureState();if(!d.length){if(typeof toast==='function')toast('No hay historial suficiente para generar el reporte.','err');return}c=c||compare();var st=storeObj(),modeLabel=T.mode==='base'?'Corte base':T.mode==='previous'?'Corte anterior':'Personalizado';var rows=[];if(c.exact){rows=c.items.slice();if(T.status!=='all')rows=rows.filter(function(r){return r.status===T.status});var order={recovered:0,partial:1,new:2,increased:3,mixed:4,persistent:5};rows.sort(function(a,b){return(order[a.status]-order[b.status])||Math.abs(b.diffV)-Math.abs(a.diffV)||Math.abs(b.diffU)-Math.abs(a.diffU)})}if(c.exact&&!rows.length){if(typeof toast==='function')toast('No hay productos para el resultado seleccionado.','err');return}var w=window.open('','_blank');if(!w){if(typeof toast==='function')toast('Habilita ventanas emergentes para generar el PDF.','err');else alert('Habilita ventanas emergentes para generar el PDF.');return}var p=c.products||{},f=function(v){return v==null?'—':fi(v)};var cards=[['Productos iniciales',f(p.initial)],['Productos finales',f(p.final)],['Productos gestionados',f(p.managed)],['Productos con reducción parcial',f(p.partial)],['Productos nuevos',f(p.fresh)]];if(c.value)cards.push(['Valor referencia',money(c.value.ref)],['Valor actual',money(c.value.cur)]);var cardsHtml=cards.map(function(x){return'<div><label>'+esc(x[0])+'</label><b>'+x[1]+'</b></div>'}).join('');var narrative=narrativeTracking(c,st);var body;if(c.exact){var uc=T.metric!=='value',vc=T.metric!=='units';var trs=rows.map(function(r){return'<tr><td><span class="code">'+esc(r.c)+'</span></td><td><b>'+esc(r.p.n||r.c)+'</b><br><small>'+esc([r.p.cat,r.p.lin,r.p.sub].filter(Boolean).join(' · '))+'</small></td><td>'+esc(statusName(r.status))+'</td>'+(uc?'<td class="num">'+fi(r.refU)+'</td><td class="num">'+fi(r.curU)+'</td><td class="num">'+(r.diffU>0?'+':'')+fi(r.diffU)+'</td>':'')+(vc?'<td class="num">'+money(r.refV)+'</td><td class="num">'+money(r.curV)+'</td><td class="num">'+(r.diffV>0?'+':'')+money(r.diffV)+'</td>':'')+'</tr>'}).join('');var head='<tr><th>Código</th><th>Producto</th><th>Resultado</th>'+(uc?'<th>Uds. inicial</th><th>Uds. final</th><th>Dif. uds.</th>':'')+(vc?'<th>Valor inicial</th><th>Valor final</th><th>Dif. valor</th>':'')+'</tr>';body='<h2>Detalle por producto'+(T.status!=='all'?' · '+esc(statusName(T.status)):'')+'</h2><table><thead>'+head+'</thead><tbody>'+trs+'</tbody></table>'}else{body='<p class="sub">Detalle por producto no disponible para esta pareja de cortes: uno de los cortes no trae snapshot detallado por producto. Se muestra solo el resumen agregado soportado por el histórico.</p>'}w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Seguimiento frente al corte</title><style>@page{size:A4 landscape;margin:12mm}body{font:11px Arial;color:#24364b}h1{color:#173b63;margin:0 0 4px}h2{color:#173b63;font-size:13px;margin:16px 0 6px}.sub{color:#6d7886;font-size:11px;margin:0 0 12px}.summary{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:0 0 14px}.summary div{border:1px solid #ddd;border-radius:8px;padding:8px 10px}.summary label{display:block;color:#6d7886;font-size:9px;text-transform:uppercase;font-weight:bold}.summary b{display:block;margin-top:3px;color:#173b63;font-size:14px}.narrative{background:#f7f9fc;border:1px solid #e1e7ef;border-radius:9px;padding:11px 13px;margin:0 0 14px;line-height:1.55}.narrative p{margin:0 0 8px}.narrative ul{margin:4px 0 0;padding-left:18px}.narrative li{margin:2px 0}table{width:100%;border-collapse:collapse;font-size:10px}th,td{border-bottom:1px solid #e5eaf1;padding:6px 8px;text-align:left}th{background:#f4f7fc;color:#6d7886;font-size:9px;text-transform:uppercase}td.num,th.num{text-align:right}.code{font-family:monospace}</style></head><body><h1>Seguimiento frente al corte</h1><p class="sub">'+esc(st.name||storeCode())+' · '+esc(stateLabel())+' · '+esc(modeLabel)+' · Comparando '+esc(dateLabel(T.from))+' → '+esc(dateLabel(T.to))+(c.exact?' · Tabla filtrada a: '+esc(statusName(T.status))+' · '+fi(rows.length)+' productos':'')+'</p><h2>Resumen ejecutivo</h2><div class="narrative">'+narrative+'</div><h2>Indicadores generales</h2><div class="summary">'+cardsHtml+'</div>'+body+'<script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>');w.document.close()}
function wireTracking(panel){panel.querySelector('[data-v128-pdf]').onclick=function(){downloadTrackingPdf()};panel.querySelectorAll('[data-v128-mode]').forEach(function(b){b.onclick=function(){var mode=b.dataset.v128Mode,d=dates();T.mode=mode;T.status='all';if(mode==='previous'){T.to=d[d.length-1];T.from=d[Math.max(0,d.length-2)]}else if(mode==='base'){T.to=d[d.length-1];var ym=T.to.slice(0,7);T.from=d.filter(function(x){return x.slice(0,7)===ym})[0]||d[0]}renderTracking()}});panel.querySelectorAll('[data-v128-date]').forEach(function(sel){sel.onchange=function(){T[sel.dataset.v128Date]=sel.value;if(T.from>T.to){var z=T.from;T.from=T.to;T.to=z}T.mode='custom';T.status='all';renderTracking()}});panel.querySelectorAll('[data-v128-state]').forEach(function(b){b.onclick=function(){T.state=b.dataset.v128State;T.status='all';renderTracking()}});panel.querySelectorAll('[data-v128-metric]').forEach(function(b){b.onclick=function(){T.metric=b.dataset.v128Metric;T.status='all';renderTracking()}});panel.querySelectorAll('.v128StatusBtn:not([disabled])').forEach(function(b){b.onclick=function(){T.status=b.dataset.status;renderTracking()}});panel.querySelectorAll('[data-v128-code]').forEach(function(tr){function open(){var c=tr.dataset.v128Code;try{if(typeof openInventoryProduct==='function'){openInventoryProduct(c);return}}catch(_){} }tr.onclick=open;tr.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}}})}
function scheduleTracking(ms){clearTimeout(renderTimer);renderTimer=setTimeout(renderTracking,ms==null?90:ms)}
/* Barras de estado Markdown: el evento se captura en window antes de los listeners históricos de document. */
function mdKey(bar){var k=bar&&bar.dataset&&bar.dataset.v128Status;if(k)return k;var oc=bar&&bar.getAttribute&&bar.getAttribute('onclick')||'',m=oc.match(/status\s*\(\s*[\"']([^\"']+)/);if(m)return m[1];var t=(bar&&bar.querySelector('span')&&bar.querySelector('span').textContent||'').toLowerCase();if(t.indexOf('gestionar')>=0)return'manage';if(t.indexOf('oferta')>=0)return'offer_covered';if(t.indexOf('cumple')>=0)return'comply';if(t.indexOf('supera')>=0)return'exceed';if(t.indexOf('revisar')>=0)return'review';if(t.indexOf('sin pol')>=0)return'no_policy';return''}
function patchMarkdown(){if(currentView()!=='markdown')return;var root=document.getElementById('content');if(!root)return;root.querySelectorAll('#markdown-table-8618 .v8623SelectCol').forEach(function(x){x.remove()});root.querySelectorAll('.v8664MdBar').forEach(function(b){var k=mdKey(b);if(!k)return;b.dataset.v128Status=k;b.setAttribute('role','button');b.setAttribute('aria-label','Ver productos: '+(b.querySelector('span')?b.querySelector('span').textContent:k));b.tabIndex=0;b.style.pointerEvents='auto'})}
function openMdStatus(key,e){if(!key||!window.V8695||typeof window.V8695.status!=='function')return false;if(e){e.preventDefault();e.stopPropagation();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation()}window.V8695.status(key);return true}
window.addEventListener('pointerdown',function(e){if(currentView()!=='markdown'||e.button>0)return;var b=e.target&&e.target.closest&&e.target.closest('.v8664MdBar');if(!b)return;openMdStatus(mdKey(b),e)},true);
window.addEventListener('keydown',function(e){if(currentView()!=='markdown'||(e.key!=='Enter'&&e.key!==' '))return;var b=e.target&&e.target.closest&&e.target.closest('.v8664MdBar');if(!b)return;openMdStatus(mdKey(b),e)},true);
function fastAnimate(){document.querySelectorAll('.chart[data-chart]').forEach(function(ch){var cols=Array.from(ch.querySelectorAll('.col')),mx=Math.max.apply(null,cols.map(function(c){return n(c.dataset.h)}).concat([1]));cols.forEach(function(c){c.style.height=(6+96*n(c.dataset.h)/mx)+'px'})})}
function mark(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);var b=document.querySelector('.appVersionChip b');if(b)b.textContent='18/08/2026 · '+VERSION;document.title='Llavero · Inventarios Jamar · 18/08/2026 · '+VERSION}catch(_){}}
function patch(){patchMarkdown();scheduleTracking(20);mark()}
function install(){if(!window.__LLAVERO_BOOTSTRAPPED__||typeof window.setView!=='function'){setTimeout(install,120);return}try{window.animateBars=fastAnimate;animateBars=fastAnimate}catch(_){};var sv=window.setView;if(typeof sv==='function'&&!sv.__v128){var w=function(){var o=sv.apply(this,arguments);mark();setTimeout(function(){patchMarkdown();scheduleTracking(20);mark()},520);setTimeout(mark,1500);return o};w.__v128=true;window.setView=w;try{setView=w}catch(_){}}var rf=window.refresh;if(typeof rf==='function'&&!rf.__v128){var wr=function(){var o=rf.apply(this,arguments);mark();setTimeout(function(){patchMarkdown();scheduleTracking(20);mark()},520);setTimeout(mark,1500);return o};wr.__v128=true;window.refresh=wr;try{refresh=wr}catch(_){}}var dm=window.drawMarkdown8617;if(typeof dm==='function'&&!dm.__v128){var wd=function(){var o=dm.apply(this,arguments);setTimeout(patchMarkdown,70);return o};wd.__v128=true;window.drawMarkdown8617=wd;try{drawMarkdown8617=wd}catch(_){}}document.addEventListener('change',function(e){if(e.target&&e.target.matches&&e.target.matches('#store'))setTimeout(function(){T.from='';T.to='';T.status='all';scheduleTracking(80)},80)},true);setTimeout(function(){history();patch()},520);[300,1200,3600,9800].forEach(function(ms){setTimeout(mark,ms)});mark();console.info('LLAVERO V86.128 · selector Markdown único, barras clickeables, seguimiento veraz y optimización de filtros')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,100)},{once:true});window.addEventListener('llavero:view-stable',function(){setTimeout(function(){patchMarkdown();scheduleTracking(40);mark()},600);setTimeout(mark,1500)});
})();


/* ==== llaveroV86130Script ==== */

(function(){
'use strict';
var VERSION='V86.131', TO='pilotocmo@jamar.com', installed=false, resettingAge=false;
var leaderCache=null,leaderCacheKey='',leaderSelected=new Set();

function txt(v){return v==null?'':String(v).trim()}
function num(v){var x=Number(v);return Number.isFinite(x)?x:0}
function code(v){var x=txt(v).replace(/^0+(?=\d)/,'');return x||'0'}
function esc(v){return txt(v).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmtInt(v){try{return typeof fInt==='function'?fInt(num(v)):Math.round(num(v)).toLocaleString('es-CO')}catch(_){return String(Math.round(num(v)))}}
function pct(v){return v==null||v===''?'—':num(v).toFixed(1).replace('.0','')+'%'}
function currentView(){try{return typeof VIEW!=='undefined'?VIEW:''}catch(_){return''}}
function storeObj(sc){try{return (typeof S!=='undefined'&&S&&S[sc||CUR])||{}}catch(_){return{}}}
function storeName(sc){var st=storeObj(sc);return txt(st.name)||txt(sc)||(typeof CUR!=='undefined'?txt(CUR):'Tienda')}
function cutDate(){try{return txt(DB&&DB.meta&&DB.meta.fecha)||''}catch(_){return''}}
function displayDate(v){var x=txt(v).slice(0,10),p=x.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:x}
function product(c){c=code(c);try{var p=typeof productInfo==='function'?productInfo(c):((typeof P!=='undefined'&&P&&P[c])||{});return p||{}}catch(_){return{}}}
function thumb(c,size){try{if(typeof imageThumb==='function')return imageThumb(code(c),size||'sm');if(typeof image==='function')return image(code(c),size||'sm')}catch(_){}return''}
function closeRange(){try{if(typeof closeRangeModal==='function')return closeRangeModal()}catch(_){}var m=document.getElementById('rangeModal');if(m)m.classList.remove('on')}
function safeFile(v){return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'')||'Tienda'}

/* ---------- Ambientes: guía y producto clickeables ---------- */
window.openImpactGuideV129=function(guideCode){
  var g=txt(guideCode);if(!g)return;closeRange();
  setTimeout(function(){try{if(typeof openGuideDetailV49==='function')openGuideDetailV49(g);else if(typeof openGuideDetailV48==='function')openGuideDetailV48(g)}catch(_){}},50);
};

function genericProductDetail(c,guideCode,guideName,floor){
  c=code(c);var st=storeObj(),p=product(c),raw=null;
  try{raw=(Array.isArray(st.inventario)?st.inventario:[]).find(function(r){return code(r&&r.codigo)===c})||null}catch(_){}
  var stock=num(raw&&raw.stock),cendis=num(raw&&raw.dispCendis!=null?raw.dispCendis:p.dispCendis),cc=txt((typeof P!=='undefined'&&P&&P[c]&&P[c].cc)||p.cc||'SIN CLASIFICACIÓN');
  var transfers=(Array.isArray(st.trDetalle)?st.trDetalle:[]).filter(function(t){return code(t&&t.codigo)===c}).slice(0,20);
  var modal=document.getElementById('inventoryProductModal'),title=document.getElementById('inventoryProductTitle'),sub=document.getElementById('inventoryProductSubtitle'),body=document.getElementById('inventoryProductBody');
  if(!modal||!title||!sub||!body)return;
  title.textContent=txt(p.n)||c;sub.textContent='Código '+c+' · '+storeName();
  function item(l,v){return '<div class="detailItem"><label>'+esc(l)+'</label><b>'+esc(v==null||v===''?'—':v)+'</b></div>'}
  var trHtml=transfers.length?'<div class="transferTableWrap"><table class="transferMini"><thead><tr><th>Entrega</th><th>Unidades</th><th>Fecha entrega</th><th>Estatus</th></tr></thead><tbody>'+transfers.map(function(t){return'<tr><td>'+esc(t.entrega||'—')+'</td><td>'+fmtInt(t.unidades)+' u</td><td>'+esc(t.fechaEntrega||'—')+'</td><td>'+esc(t.estatus||t.statusMovimiento||'—')+'</td></tr>'}).join('')+'</tbody></table></div>':'<div class="empty">No hay traslados relacionados registrados para este producto.</div>';
  body.innerHTML='<div class="detailHero detailHeroWithImage">'+thumb(c,'lg')+'<div class="detailHeroText"><h3>'+esc(p.n||c)+'</h3><p>'+esc([p.cat,p.lin,p.sub].filter(Boolean).join(' · ')||'Sin jerarquía comercial')+'</p><div style="margin-top:7px"><span class="profilePill">'+esc(cc)+'</span></div></div><div class="detailHeroValue"><b>'+fmtInt(cendis)+' u</b><span>Disponibilidad CENDIS</span></div></div>'+
  '<div class="detailSections"><section class="detailSection"><div class="detailSectionTitle">Información del producto</div><div class="detailGrid">'+
  item('Código',c)+item('Categoría',p.cat||'—')+item('Línea',p.lin||'—')+item('Sublínea',p.sub||'—')+item('Clasificación',cc)+item('Stock actual',fmtInt(stock)+' unidades')+
  '</div></section><section class="detailSection"><div class="detailSectionTitle">Contexto de la guía</div><div class="detailGrid">'+
  item('Ambiente / guía',guideName||guideCode||'—')+item('Código guía',guideCode||'—')+item('Piso',floor||'—')+item('CENDIS',fmtInt(cendis)+' unidades')+
  '</div><div class="ageDataAlert" style="margin-top:10px">Este producto no tiene inventario actual positivo en la tienda; por eso se muestra la información disponible del maestro, CENDIS, guía y traslados.</div></section>'+
  '<section class="detailSection full"><div class="detailSectionTitle">Traslados relacionados</div>'+trHtml+'</section></div>';
  modal.classList.add('on');
}

window.openImpactProductV129=function(productCode,guideCode,guideName,floor){
  var c=code(productCode),st=storeObj(),hasInv=false;
  try{hasInv=typeof normalizeInventoryRows==='function'&&normalizeInventoryRows(st).some(function(r){return code(r.c)===c&&num(r.stock)>0})}catch(_){}
  closeRange();
  setTimeout(function(){
    if(hasInv&&typeof openInventoryProduct==='function'){try{openInventoryProduct(c);return}catch(_){}}
    genericProductDetail(c,guideCode,guideName,floor);
  },55);
};

function patchImpactDetail(){
  var body=document.getElementById('rangeModalBody');if(!body)return;
  body.querySelectorAll('.v127Table tbody tr[data-guide]').forEach(function(tr){
    if(tr.dataset.v129Ready==='1')return;
    var cells=tr.cells;if(!cells||cells.length<5)return;
    var g=txt(tr.dataset.guide),c=code((cells[3].querySelector('.code')||{}).textContent),guideName=txt((cells[0].querySelector('b')||{}).textContent),floor=txt(cells[1].textContent)||'—';
    var guideHtml=cells[0].innerHTML,productHtml=cells[4].innerHTML,codeHtml=cells[3].innerHTML;
    cells[0].innerHTML='<button type="button" class="v129GuideLink">'+guideHtml+'<span class="v129Go">Ver guía →</span></button>';
    cells[3].innerHTML='<button type="button" class="v129CodeLink">'+codeHtml+'</button>';
    cells[4].innerHTML='<button type="button" class="v129ProductLink">'+productHtml+'<span class="v129Go">Ver producto →</span></button>';
    cells[0].querySelector('.v129GuideLink').onclick=function(e){e.preventDefault();e.stopPropagation();window.openImpactGuideV129(g)};
    cells[3].querySelector('.v129CodeLink').onclick=function(e){e.preventDefault();e.stopPropagation();window.openImpactProductV129(c,g,guideName,floor)};
    cells[4].querySelector('.v129ProductLink').onclick=function(e){e.preventDefault();e.stopPropagation();window.openImpactProductV129(c,g,guideName,floor)};
    tr.onclick=function(e){if(e.target&&e.target.closest&&e.target.closest('button,a,input'))return;window.openImpactGuideV129(g)};
    tr.dataset.v129Ready='1';
  });
}

/* ---------- Traslados: correo real en HTML + Excel adjunto ---------- */
function transferRows(){
  var out=[];document.querySelectorAll('#rangeModalBody .v8667Delivery').forEach(function(sec){
    var id=txt((sec.querySelector('.v8667DeliveryHead b')||{}).textContent).replace(/^\s*Entrega\s+/i,'').trim();
    sec.querySelectorAll('.v8667DecisionRow').forEach(function(row){
      var cb=row.querySelector('input[type=checkbox]'),c=txt((row.querySelector('.code')||{}).textContent),name=txt((row.querySelector('.name')||{}).textContent);
      out.push({delivery:id,code:c,name:name,action:cb&&cb.checked?'ENVIAR':'ELIMINAR'});
    });
  });return out;
}
function ensureXlsx(){
  return new Promise(function(resolve,reject){
    if(window.XLSX)return resolve(window.XLSX);
    var tries=0,t=setInterval(function(){tries++;if(window.XLSX){clearInterval(t);resolve(window.XLSX)}else if(tries>80){clearInterval(t);reject(new Error('Motor Excel no disponible'))}},100);
  });
}
function b64(buffer){var bytes=new Uint8Array(buffer),bin='',chunk=0x8000;for(var i=0;i<bytes.length;i+=chunk)bin+=String.fromCharCode.apply(null,bytes.subarray(i,Math.min(i+chunk,bytes.length)));return btoa(bin).replace(/(.{76})/g,'$1\r\n')}
function mimeWord(v){return '=?UTF-8?B?'+btoa(unescape(encodeURIComponent(txt(v))))+'?='}
function htmlMailBody(name,date,send,del){
  return '<!doctype html><html><body style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#1f2937">'+
  '<p>Adjunto reporte de gestión de entregas pendientes (<b>'+esc(name)+' · '+esc(date)+'</b>).</p>'+
  '<p><b>ENVIAR:</b> '+fmtInt(send)+' productos<br><br><b>ELIMINAR:</b> '+fmtInt(del)+' productos</p>'+
  '</body></html>';
}
async function prepareTransferEmailV129(){
  var rows=transferRows();
  if(!rows.length){if(typeof toast==='function')toast('No hay entregas pendientes para preparar.','err');return}
  var send=rows.filter(function(r){return r.action==='ENVIAR'}).length;
  var del=rows.length-send;
  var name=storeName();
  var date=displayDate(cutDate());
  var subject='Gesti\u00f3n de traslados pendientes \u00b7 '+name+(date?' \u00b7 '+date:'');
  var plain='Adjunto reporte de gesti\u00f3n de entregas pendientes ('+name+(date?' - '+date:'')+').\r\n\r\nENVIAR: '+send+' productos\r\n\r\nELIMINAR: '+del+' productos';
  var html='<!doctype html><html><body style="font-family:Calibri,Segoe UI,Arial,sans-serif;font-size:14px;color:#1f2937;margin:0;padding:0">'+
    '<p style="margin:0 0 18px">Adjunto reporte de gesti\u00f3n de entregas pendientes (<b>'+esc(name)+(date?' - '+esc(date):'')+'</b>).</p>'+
    '<p style="margin:0 0 10px"><b>ENVIAR:</b> '+fmtInt(send)+' productos</p>'+
    '<p style="margin:0"><b>ELIMINAR:</b> '+fmtInt(del)+' productos</p>'+
    '</body></html>';
  try{
    var X=await ensureXlsx();
    var data=[['ORDEN_ENTREGA','CODIGO_PRODUCTO','NOMBRE_PRODUCTO','ACCION']].concat(rows.map(function(r){return[r.delivery,r.code,r.name,r.action]}));
    var wb=X.utils.book_new();
    var ws=X.utils.aoa_to_sheet(data);
    ws['!cols']=[{wch:20},{wch:18},{wch:56},{wch:14}];
    X.utils.book_append_sheet(wb,ws,'Gestion traslados');
    var arr=X.write(wb,{bookType:'xlsx',type:'array'});
    var file='Gestion_Traslados_'+safeFile(name)+'_'+(cutDate()||'corte')+'.xlsx';
    var boundary='----=_LLAVERO_'+Date.now();
    var encodedSubject=mimeWord(subject);
    var html64=btoa(unescape(encodeURIComponent(html))).replace(/(.{76})/g,'$1\r\n');
    var eml='X-Unsent: 1\r\n'+
      'To: '+TO+'\r\n'+
      'Subject: '+encodedSubject+'\r\n'+
      'MIME-Version: 1.0\r\n'+
      'Content-Type: multipart/mixed; boundary="'+boundary+'"\r\n\r\n'+
      '--'+boundary+'\r\n'+
      'Content-Type: multipart/alternative; boundary="'+boundary+'_ALT"\r\n\r\n'+
      '--'+boundary+'_ALT\r\n'+
      'Content-Type: text/plain; charset=UTF-8\r\n'+
      'Content-Transfer-Encoding: 8bit\r\n\r\n'+
      plain+'\r\n\r\n'+
      '--'+boundary+'_ALT\r\n'+
      'Content-Type: text/html; charset=UTF-8\r\n'+
      'Content-Transfer-Encoding: base64\r\n\r\n'+
      html64+'\r\n'+
      '--'+boundary+'_ALT--\r\n\r\n'+
      '--'+boundary+'\r\n'+
      'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; name="'+file+'"\r\n'+
      'Content-Transfer-Encoding: base64\r\n'+
      'Content-Disposition: attachment; filename="'+file+'"\r\n\r\n'+
      b64(arr)+'\r\n'+
      '--'+boundary+'--\r\n';
    var blob=new Blob([eml],{type:'message/rfc822'});
    var a=document.createElement('a');
    var url=URL.createObjectURL(blob);
    a.href=url;
    a.download='Correo_Gestion_Traslados_'+safeFile(name)+'_'+(cutDate()||'corte')+'.eml';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},1500);
    if(typeof toast==='function')toast('Correo preparado con tienda, fecha y Excel adjunto. Abre el archivo .eml descargado para enviarlo desde Outlook.','ok');
  }catch(err){
    console.error('V86.131 correo traslados',err);
    if(typeof toast==='function')toast('No fue posible preparar el correo con el Excel adjunto.','err');
  }
}
window.emailTransferDecisions8667=prepareTransferEmailV129;
window.prepareTransferEmailV129=prepareTransferEmailV129;
function patchTransferButton(){
  var body=document.getElementById('rangeModalBody');if(!body)return;
  Array.from(body.querySelectorAll('button')).filter(function(b){return /Preparar correo/i.test(b.textContent||'')}).forEach(function(btn){
    btn.textContent='Preparar correo';btn.onclick=function(e){if(e){e.preventDefault();e.stopPropagation()}prepareTransferEmailV129()};btn.dataset.v129Mail='1';
  });
}

/* ---------- Rotación / Evacuación: retirar solo la barra de chips de edad; conservar Antigüedad en búsqueda rápida ---------- */
function removeAgeFilters(){
  var v=currentView();if(v!=='rot'&&v!=='evac')return;
  try{
    if(typeof state!=='undefined'&&state){
      state[v]=state[v]||{};var changed=(state[v].age80&&state[v].age80!=='all')||(state[v].age79&&state[v].age79!=='all');
      state[v].age80='all';state[v].age79='all';
      if(changed&&!resettingAge){resettingAge=true;setTimeout(function(){try{if(v==='rot'&&typeof drawRot==='function')drawRot();else if(v==='evac'&&typeof drawEvac==='function')drawEvac()}finally{setTimeout(function(){resettingAge=false;removeAgeFilters()},80)}},0)}
    }
  }catch(_){}
  var root=document.getElementById('content');if(!root)return;
  /* Se eliminan únicamente los selectores/chips de rango independientes.
     El selector [data-v127-f="age"] del panel de Búsqueda rápida se conserva. */
  root.querySelectorAll('.v82AgeBar,.v80AgeBar,.ageFilterBar79,.ageFilterRow').forEach(function(x){x.remove()});
}

/* ---------- Líder Markdown: reconstrucción con las filas finales vigentes ---------- */
function leaderRows(){
  var key=cutDate()+'|'+(typeof S!=='undefined'&&S?Object.keys(S).length:0);
  if(leaderCache&&leaderCacheKey===key)return leaderCache;
  var out=[],seen={};
  try{
    var prevCur='';try{prevCur=typeof CUR!=='undefined'?CUR:''}catch(_){}
    Object.keys(S||{}).forEach(function(sc){
      var st=S[sc];if(!st||typeof st!=='object')return;
      var rows=[];try{if(typeof CUR!=='undefined')CUR=sc}catch(_){}
      try{rows=typeof window.mdRows8664==='function'?(window.mdRows8664(sc)||[]):[]}catch(_){rows=[]}
      rows.forEach(function(r){
        var sug=r&&r.discount!=null?num(r.discount):null,manage=r&&(r.statusKey==='manage'||r.actionable===true);
        if(!manage||sug==null||sug<=50)return;
        var k=sc+'|'+code(r.code);if(seen[k])return;seen[k]=1;
        out.push(Object.assign({},r,{storeCode:sc,storeName:txt(st.name)||sc,code:code(r.code),discount:sug}));
      });
    });
    try{if(prevCur&&typeof CUR!=='undefined')CUR=prevCur}catch(_){}
  }catch(e){console.error('V86.131 líder Markdown',e)}
  out.sort(function(a,b){return a.storeName.localeCompare(b.storeName,'es')||num(b.discount)-num(a.discount)||txt(a.name).localeCompare(txt(b.name),'es')});
  leaderCache=out;leaderCacheKey=key;return out;
}
function leaderImage(c){return thumb(c,'sm')}
function rowSearch(r){return txt([r.storeName,r.storeCode,r.code,r.name,r.category,r.line,r.subline,r.statusLabel].join(' ')).toLowerCase()}
function updateLeaderCount(){
  var el=document.getElementById('v129LeaderCount');if(el)el.textContent=fmtInt(leaderSelected.size)+' seleccionados';
}
function filterLeader(){
  var q=txt((document.getElementById('v129LeaderQ')||{}).value).toLowerCase(),st=txt((document.getElementById('v129LeaderStore')||{}).value)||'all';
  document.querySelectorAll('#v129LeaderTable tbody tr[data-key]').forEach(function(tr){
    var ok=(!q||txt(tr.dataset.search).indexOf(q)>=0)&&(st==='all'||tr.dataset.store===st);tr.style.display=ok?'':'none';
  });
}
function selectLeaderVisible(on){
  document.querySelectorAll('#v129LeaderTable tbody tr[data-key]').forEach(function(tr){
    if(tr.style.display==='none')return;var k=tr.dataset.key,cb=tr.querySelector('input[type=checkbox]');if(on)leaderSelected.add(k);else leaderSelected.delete(k);if(cb)cb.checked=on;
  });updateLeaderCount();
}
function ensureLeaderXlsx(){
  if(window.XLSX)return window.XLSX;if(typeof toast==='function')toast('El motor Excel aún está cargando. Intenta nuevamente en unos segundos.','err');return null
}
function exportLeader(){
  var X=ensureLeaderXlsx();if(!X)return;var selected=leaderRows().filter(function(r){return leaderSelected.has(r.storeCode+'|'+r.code)});
  if(!selected.length){if(typeof toast==='function')toast('No hay productos seleccionados para exportar.','err');return}
  var data=[['TIENDA','CODIGO','PRODUCTO','CLASIFICACION','STOCK','POLITICA','REGLA','OFERTA','ACTUAL_MUESTRA','SUGERIDO','BRECHA_PP','ESTADO','RESPONSABLE']];
  selected.forEach(function(r){data.push([r.storeName,r.code,r.name,r.cc||'',r.stock||0,r.policyApplied||'',r.ruleApplied||'',r.systemOfferDiscount==null?'':r.systemOfferDiscount,r.currentDiscount==null?'':r.currentDiscount,r.discount,r.gap==null?'':r.gap,r.statusLabel||'Gestionar descuento','Líder de Área'])});
  var wb=X.utils.book_new(),ws=X.utils.aoa_to_sheet(data);ws['!cols']=[{wch:22},{wch:14},{wch:48},{wch:18},{wch:10},{wch:18},{wch:34},{wch:12},{wch:16},{wch:12},{wch:12},{wch:22},{wch:18}];X.utils.book_append_sheet(wb,ws,'Markdown Lider');
  X.writeFile(wb,'Markdown_Lider_Todas_Tiendas_Mayor_50_'+(cutDate()||'corte')+'.xlsx');
}
window.openLeaderProductV129=function(sc,c){
  closeRange();try{if(typeof CUR!=='undefined')CUR=sc;var sel=document.getElementById('store');if(sel)sel.value=sc}catch(_){}
  setTimeout(function(){try{if(typeof openMdProduct8664==='function')openMdProduct8664(c);else window.openImpactProductV129(c,'','','')}catch(_){}},60);
};
function openLeaderAllV129(){
  try{if(typeof IS_LEADER!=='undefined'&&!IS_LEADER){if(typeof toast==='function')toast('Función exclusiva del Líder de Área.','err');return}}catch(_){}
  var rows=leaderRows(),modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle');
  if(!modal||!body)return;leaderSelected=new Set(rows.map(function(r){return r.storeCode+'|'+r.code}));
  if(tt)tt.textContent='Markdown · Todas las tiendas >50%';if(ss)ss.textContent='Gestión consolidada del Líder de Área · productos a gestionar con sugerido mayor al 50%';
  modal.classList.add('v8664Wide');
  if(!rows.length){
    body.innerHTML='<div class="v129LeaderEmpty"><b>No hay productos para gestión del Líder.</b><span>Con las reglas vigentes no se encontraron productos en estado Gestionar descuento con sugerido mayor al 50%.</span></div>';modal.classList.add('on');return;
  }
  var stores=Array.from(new Set(rows.map(function(r){return r.storeName}))).sort(function(a,b){return a.localeCompare(b,'es')});
  var trs=rows.map(function(r){
    var k=r.storeCode+'|'+r.code;
    return '<tr data-key="'+esc(k)+'" data-store="'+esc(r.storeName)+'" data-search="'+esc(rowSearch(r))+'">'+
      '<td class="sel"><input type="checkbox" checked aria-label="Seleccionar '+esc(r.code)+'"></td>'+
      '<td class="img">'+leaderImage(r.code)+'</td>'+
      '<td class="store"><b>'+esc(r.storeName)+'</b><div class="v129LeaderMeta">'+esc(r.storeCode)+'</div></td>'+
      '<td class="codecol"><span class="code">'+esc(r.code)+'</span></td>'+
      '<td><button type="button" class="v129LeaderProduct" data-open-product="1">'+esc(r.name||r.code)+'</button><div class="v129LeaderMeta">'+esc([r.category,r.line,r.subline].filter(Boolean).join(' · '))+'</div></td>'+
      '<td class="num pctcol">'+pct(r.currentDiscount)+'</td><td class="num pctcol">'+pct(r.systemOfferDiscount)+'</td><td class="num pctcol"><b>'+pct(r.discount)+'</b></td>'+
      '<td class="statecol">'+esc(r.statusLabel||'Gestionar descuento')+'</td></tr>';
  }).join('');
  body.innerHTML='<div class="v129LeaderNote">✓ <span>Esta vista usa la lógica final de Markdown de cada tienda. Solo incluye productos en <b>Gestionar descuento</b> cuyo descuento sugerido es <b>mayor al 50%</b>, que corresponden al Líder de Área.</span></div>'+
    '<div class="v129LeaderToolbar"><button type="button" data-v129-all="1">Seleccionar visibles</button><button type="button" data-v129-none="1">Quitar visibles</button>'+
    '<input id="v129LeaderQ" type="search" placeholder="Buscar tienda, código o producto"><select id="v129LeaderStore"><option value="all">Todas las tiendas</option>'+stores.map(function(x){return'<option value="'+esc(x)+'">'+esc(x)+'</option>'}).join('')+'</select>'+
    '<span class="count" id="v129LeaderCount">'+fmtInt(rows.length)+' seleccionados</span><button type="button" class="primary" data-v129-export="1">Generar Excel consolidado</button></div>'+
    '<div class="v129LeaderTableWrap"><table class="v129LeaderTable" id="v129LeaderTable"><thead><tr><th class="sel"><input type="checkbox" checked aria-label="Seleccionar visibles"></th><th class="img">Imagen</th><th class="store">Tienda</th><th class="codecol">Código</th><th>Producto</th><th class="num pctcol">Actual/Muestra</th><th class="num pctcol">Oferta</th><th class="num pctcol">Sugerido</th><th class="statecol">Estado</th></tr></thead><tbody>'+trs+'</tbody></table></div>';
  body.querySelector('[data-v129-all]').onclick=function(){selectLeaderVisible(true)};body.querySelector('[data-v129-none]').onclick=function(){selectLeaderVisible(false)};body.querySelector('[data-v129-export]').onclick=exportLeader;
  document.getElementById('v129LeaderQ').oninput=filterLeader;document.getElementById('v129LeaderStore').onchange=filterLeader;
  var headCb=body.querySelector('thead input[type=checkbox]');if(headCb)headCb.onchange=function(){selectLeaderVisible(this.checked)};
  body.querySelectorAll('tbody tr[data-key]').forEach(function(tr){
    var cb=tr.querySelector('input[type=checkbox]');if(cb)cb.onchange=function(e){e.stopPropagation();if(this.checked)leaderSelected.add(tr.dataset.key);else leaderSelected.delete(tr.dataset.key);updateLeaderCount()};
    var btn=tr.querySelector('[data-open-product]');if(btn)btn.onclick=function(e){e.preventDefault();e.stopPropagation();var p=tr.dataset.key.split('|');window.openLeaderProductV129(p.shift(),p.join('|'))};
  });
  modal.classList.add('on');updateLeaderCount();
}
window.openLeaderAll8664=openLeaderAllV129;
try{openLeaderAll8664=openLeaderAllV129}catch(_){}

/* ---------- Integración final ---------- */
function mark(){
  try{
    window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);
    var b=document.querySelector('.appVersionChip b');if(b)b.textContent='18/08/2026 · '+VERSION;
    document.title='Llavero · Inventarios Jamar · 18/08/2026 · '+VERSION;
  }catch(_){}
}
function patchAll(){removeAgeFilters();patchImpactDetail();patchTransferButton();mark()}
function install(){
  if(installed)return;
  if(!window.__LLAVERO_BOOTSTRAPPED__||typeof window.setView!=='function'){setTimeout(install,120);return}
  installed=true;
  var impact=window.openGuideImpact127;if(typeof impact==='function'&&!impact.__v129){var wi=function(){var o=impact.apply(this,arguments);setTimeout(patchImpactDetail,50);return o};wi.__v129=true;window.openGuideImpact127=wi;try{openGuideImpact127=wi}catch(_){}}
  var tr=window.openTransferDecisions8667||window.openTransferDecisions8666;if(typeof tr==='function'&&!tr.__v129){var wt=function(){var o=tr.apply(this,arguments);setTimeout(patchTransferButton,140);return o};wt.__v129=true;window.openTransferDecisions8667=window.openTransferDecisions8666=wt}
  window.emailTransferDecisions8667=prepareTransferEmailV129;
  var sv=window.setView;if(typeof sv==='function'&&!sv.__v129){var ws=function(){var o=sv.apply(this,arguments);setTimeout(patchAll,140);setTimeout(patchAll,760);setTimeout(mark,900);setTimeout(mark,2200);return o};ws.__v129=true;window.setView=ws;try{setView=ws}catch(_){}}
  var rf=window.refresh;if(typeof rf==='function'&&!rf.__v129){var wr=function(){leaderCache=null;leaderCacheKey='';var o=rf.apply(this,arguments);setTimeout(patchAll,160);setTimeout(patchAll,780);setTimeout(mark,900);setTimeout(mark,2200);return o};wr.__v129=true;window.refresh=wr;try{refresh=wr}catch(_){}}
  setTimeout(patchAll,350);[1000,2600,5200,10800].forEach(function(ms){setTimeout(mark,ms)});
  console.info('LLAVERO V86.131 · Antigüedad en búsqueda rápida de Rotación/Evacuación; barra independiente retirada; correcciones V86.129 conservadas');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,100)},{once:true});
window.addEventListener('llavero:view-stable',function(){setTimeout(patchAll,180);setTimeout(patchAll,900);setTimeout(mark,2200)});
})();


/* ==== llaveroV86132Script ==== */

(function(){
'use strict';
if(window.__LLAVERO_V86132__)return;window.__LLAVERO_V86132__=true;
var VERSION='V86.132', ambTimer=0, trTimer=0;
function s(v){return v==null?'':String(v)}
function esc(v){return s(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c})}
function view(){try{return typeof VIEW!=='undefined'?VIEW:''}catch(_){return''}}
function mark(){
  try{
    window.LLAVERO_BUILD=VERSION;
    document.documentElement.setAttribute('data-llavero-build',VERSION);
    document.documentElement.setAttribute('data-llavero-app-version',VERSION);
    document.documentElement.setAttribute('data-preview',VERSION);
    document.title=document.title.replace(/V86\.\d+/g,VERSION);
    var b=document.querySelector('.appVersionChip b');
    if(b)b.textContent=(b.textContent||'').replace(/V86\.\d+$/,VERSION);
  }catch(_){}
}
function actionField(){return '<div class="v132FilterField v132ClearWrap"><label>Acción</label><button type="button" class="v132ClearBtn">Limpiar filtros</button></div>'}
function hideAmbLegacy(root){
  if(!root)return;
  root.querySelectorAll('.guideNativeToolbar,.guideUnifiedToolbar').forEach(function(x){x.classList.add('v132LegacyHidden')});
  var q=root.querySelector('#q-guias');
  if(q){var bar=q.closest('.tbar,.guideUnifiedToolbar');if(bar)bar.classList.add('v132LegacyHidden')}
}
function ambOptions(current){
  var groups=[
    ['General',[['all','Todas']]],
    ['Estado de guía',[['completas','Completas'],['avance','Con avance'],['sinavance','Sin avance']]],
    ['Gestión',[['camino','En traslado'],['requested','Solicitud realizada'],['available','Puedes solicitar']]],
    ['Piso',[['p1pend','Piso 1 pendiente'],['p2pend','Piso 2 pendiente']]],
    ['Categoría',[['DORMITORIO','Dormitorio'],['SOCIAL','Social']]]
  ];
  return groups.map(function(g){return '<optgroup label="'+esc(g[0])+'">'+g[1].map(function(o){return '<option value="'+esc(o[0])+'"'+(s(current)===o[0]?' selected':'')+'>'+esc(o[1])+'</option>'}).join('')+'</optgroup>'}).join('')
}
function syncAmbCount(bar){
  if(!bar)return;
  var cnt=document.getElementById('guias-cnt'),out=bar.querySelector('.v132FilterCount');
  if(out)out.textContent=cnt&&cnt.textContent?cnt.textContent:'';
}
function patchAmbientes(){
  if(view()!=='amb')return;
  var root=document.getElementById('content'),table=document.getElementById('guias-tbl');
  if(!root||!table)return;
  hideAmbLegacy(root);
  var bar=root.querySelector('.v132ModuleFilters[data-v132-module="ambientes"]');
  if(!bar){
    bar=document.createElement('div');bar.className='v132ModuleFilters ambientes';bar.dataset.v132Module='ambientes';
    var q=s((window.state&&state.guias&&state.guias.q)||''),f=s((window.state&&state.guias&&state.guias.f)||'all')||'all';
    bar.innerHTML='<div class="v132FilterField"><label>Búsqueda rápida</label><input type="search" data-v132-amb="q" value="'+esc(q)+'" placeholder="Guía, producto o código..."></div>'+
      '<div class="v132FilterField"><label>Estado / gestión</label><select data-v132-amb="f">'+ambOptions(f)+'</select></div>'+actionField()+'<span class="v132FilterCount"></span>';
    table.parentNode.insertBefore(bar,table);
    var input=bar.querySelector('[data-v132-amb="q"]'),sel=bar.querySelector('[data-v132-amb="f"]'),clear=bar.querySelector('.v132ClearBtn');
    input.addEventListener('input',function(){clearTimeout(ambTimer);ambTimer=setTimeout(function(){state.guias=state.guias||{};state.guias.q=input.value;if(typeof window.drawGuias==='function')window.drawGuias()},70)});
    sel.addEventListener('change',function(){state.guias=state.guias||{};state.guias.f=sel.value;if(typeof window.drawGuias==='function')window.drawGuias()});
    clear.addEventListener('click',function(){state.guias=state.guias||{};state.guias.q='';state.guias.f='all';input.value='';sel.value='all';if(typeof window.drawGuias==='function')window.drawGuias()});
  }
  var qIn=bar.querySelector('[data-v132-amb="q"]'),fSel=bar.querySelector('[data-v132-amb="f"]');
  if(qIn&&document.activeElement!==qIn)qIn.value=s((state.guias&&state.guias.q)||'');
  if(fSel)fSel.value=s((state.guias&&state.guias.f)||'all')||'all';
  syncAmbCount(bar);
}
function hideTransferLegacy(root){
  if(!root)return;
  root.querySelectorAll('.transferStatusSwitch8615,.transferToolbar862').forEach(function(x){x.classList.add('v132LegacyHidden')});
  var q=root.querySelector('#q-tr');
  if(q){var b=q.closest('.transferToolbar862,.tbar');if(b)b.classList.add('v132LegacyHidden')}
}
function transferStatusOptions(current){var a=[['all','Todos'],['toDeliver','Por entregar'],['pendingExact','Pendiente'],['picking','En picking'],['route','En ruta'],['delivered','Entregados'],['changes','Cambios'],['overdue','Vencidas']];return a.map(function(o){return '<option value="'+o[0]+'"'+(s(current)===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')}
function transferPurposeOptions(current){var a=[['all','Todos los propósitos'],['complete','Completa ambientes'],['advance','Avanza ambientes'],['rot','Apoya Rotación'],['evac','Apoya Evacuación'],['none','Sin relación identificada']];return a.map(function(o){return '<option value="'+o[0]+'"'+(s(current)===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')}
function syncTransferCount(bar){var cnt=document.getElementById('tr-cnt'),out=bar&&bar.querySelector('.v132FilterCount');if(out)out.textContent=cnt&&cnt.textContent?cnt.textContent:''}
function patchTraslados(){
  if(view()!=='traslados')return;
  var root=document.getElementById('content'),table=document.getElementById('tr-tbl');
  if(!root||!table)return;
  hideTransferLegacy(root);
  state.tr=state.tr||{};
  var bar=root.querySelector('.v132ModuleFilters[data-v132-module="traslados"]');
  if(!bar){
    bar=document.createElement('div');bar.className='v132ModuleFilters';bar.dataset.v132Module='traslados';
    var q=s(state.tr.q||''),vw=s(state.tr.view80||'delivery'),f=s(state.tr.f8615||state.tr.f80||'all'),p=s(state.tr.purpose862||'all');
    bar.innerHTML='<div class="v132FilterField"><label>Búsqueda rápida</label><input type="search" data-v132-tr="q" value="'+esc(q)+'" placeholder="Orden, producto, guía, estado o propósito..."></div>'+
      '<div class="v132FilterField"><label>Mostrar por</label><select data-v132-tr="view"><option value="delivery"'+(vw==='delivery'?' selected':'')+'>Entregas</option><option value="product"'+(vw==='product'?' selected':'')+'>Productos</option></select></div>'+
      '<div class="v132FilterField"><label>Estado</label><select data-v132-tr="status">'+transferStatusOptions(f)+'</select></div>'+
      '<div class="v132FilterField"><label>Propósito</label><select data-v132-tr="purpose">'+transferPurposeOptions(p)+'</select></div>'+actionField()+'<span class="v132FilterCount"></span>';
    table.parentNode.insertBefore(bar,table);
    var input=bar.querySelector('[data-v132-tr="q"]'),vsel=bar.querySelector('[data-v132-tr="view"]'),ssel=bar.querySelector('[data-v132-tr="status"]'),psel=bar.querySelector('[data-v132-tr="purpose"]'),clear=bar.querySelector('.v132ClearBtn');
    input.addEventListener('input',function(){clearTimeout(trTimer);trTimer=setTimeout(function(){state.tr.q=input.value;if(typeof window.drawTr8615==='function')window.drawTr8615();else if(typeof window.drawTr==='function')window.drawTr()},70)});
    vsel.addEventListener('change',function(){if(typeof window.setTransferView8615==='function')window.setTransferView8615(vsel.value);else{state.tr.view80=vsel.value;if(typeof window.drawTr==='function')window.drawTr()}});
    ssel.addEventListener('change',function(){if(typeof window.setTransferFilter8615==='function')window.setTransferFilter8615(ssel.value);else{state.tr.f8615=ssel.value;state.tr.f80=ssel.value;if(typeof window.drawTr==='function')window.drawTr()}});
    psel.addEventListener('change',function(){if(typeof window.setTransferPurpose8615==='function')window.setTransferPurpose8615(psel.value);else{state.tr.purpose862=psel.value;if(typeof window.drawTr==='function')window.drawTr()}});
    clear.addEventListener('click',function(){state.tr.q='';state.tr.f8615='all';state.tr.f80='all';state.tr.purpose862='all';state.tr.view80='delivery';input.value='';vsel.value='delivery';ssel.value='all';psel.value='all';if(typeof window.drawTr8615==='function')window.drawTr8615();else if(typeof window.drawTr==='function')window.drawTr()});
  }
  var qIn=bar.querySelector('[data-v132-tr="q"]'),vSel=bar.querySelector('[data-v132-tr="view"]'),sSel=bar.querySelector('[data-v132-tr="status"]'),pSel=bar.querySelector('[data-v132-tr="purpose"]');
  if(qIn&&document.activeElement!==qIn)qIn.value=s(state.tr.q||'');
  if(vSel)vSel.value=s(state.tr.view80||'delivery');
  if(sSel)sSel.value=s(state.tr.f8615||state.tr.f80||'all');
  if(pSel)pSel.value=s(state.tr.purpose862||'all');
  syncTransferCount(bar);
}
function patch(){mark();patchAmbientes();patchTraslados()}
var dg=window.drawGuias;if(typeof dg==='function'&&!dg.__v132){var wdg=function(){var o=dg.apply(this,arguments);requestAnimationFrame(patchAmbientes);return o};wdg.__v132=true;window.drawGuias=wdg}
var dt=window.drawTr8615||window.drawTr;if(typeof dt==='function'&&!dt.__v132){var wdt=function(){var o=dt.apply(this,arguments);requestAnimationFrame(patchTraslados);return o};wdt.__v132=true;window.drawTr8615=window.drawTr862=window.drawTr80=window.drawTr=wdt}
var sv=window.setView;if(typeof sv==='function'&&!sv.__v132){var wsv=function(){var o=sv.apply(this,arguments);setTimeout(patch,40);setTimeout(patch,160);return o};wsv.__v132=true;window.setView=wsv}
var rf=window.refresh;if(typeof rf==='function'&&!rf.__v132){var wrf=function(){var o=rf.apply(this,arguments);setTimeout(patch,50);setTimeout(patch,180);return o};wrf.__v132=true;window.refresh=wrf}
document.addEventListener('change',function(e){if(e.target&&e.target.id==='store')setTimeout(patch,120)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(patch,80)},{once:true});else setTimeout(patch,80);
setTimeout(patch,300);setTimeout(patch,900);
console.info('LLAVERO V86.132 · filtros de Ambientes y Traslados unificados al diseño de Búsqueda rápida');
})();


/* ==== llaveroV86138Script ==== */

(function(){
'use strict';
var VERSION='V86.138', debounce=0, observer=null;
var filters={q:'',estado:'all',gestion:'all',piso:'all',categoria:'all'};
function str(v){return v==null?'':String(v).trim()}
function norm(v){return str(v).normalize?str(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase():str(v).toUpperCase()}
function esc(v){return str(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c})}
function view(){try{return typeof VIEW!=='undefined'?VIEW:''}catch(_){return ''}}
function mark(){
  try{
    window.LLAVERO_BUILD=VERSION;
    document.documentElement.setAttribute('data-llavero-build',VERSION);
    document.documentElement.setAttribute('data-llavero-app-version',VERSION);
    document.documentElement.setAttribute('data-preview',VERSION);
    document.title=document.title.replace(/V86\.\d+/g,VERSION);
    var b=document.querySelector('.appVersionChip b');if(b)b.textContent=(b.textContent||'').replace(/V86\.\d+$/,VERSION);
  }catch(_){ }
}
function currentRows(){
  var out={};
  try{
    var st=(typeof S!=='undefined'&&S&&typeof CUR!=='undefined'&&S[CUR])||{};
    (Array.isArray(st.guias)?st.guias:[]).forEach(function(g){
      var prods=Array.isArray(g&&g[6])?g[6]:[];
      var evaluated=prods.filter(function(p){return !!(p&&p[10])});
      var total=Number(g&&g[3])||0, covered=Number(g&&g[4])||0, pp=(g&&g[5])||[];
      out[str(g&&g[0])]={
        code:str(g&&g[0]),name:str(g&&g[1]),cat:norm(g&&g[2]),total:total,covered:covered,
        p1h:Number(pp[0])||0,p1t:Number(pp[1])||0,p2h:Number(pp[2])||0,p2t:Number(pp[3])||0,
        camino:evaluated.some(function(p){return str(p&&p[5])==='camino'}),
        requested:evaluated.some(function(p){var s=str(p&&p[5]);return s==='requested'||s==='requested_nostock'}),
        available:evaluated.some(function(p){return str(p&&p[5])==='available'}),
        search:norm([g&&g[0],g&&g[1],g&&g[2]].concat(prods.map(function(p){return [p&&p[0],p&&p[6]].join(' ')})).join(' '))
      };
    });
  }catch(_){ }
  return out;
}
function passes(rec,row){
  var q=norm(filters.q);
  var rowText=norm(row&&row.textContent);
  if(q && !(rec&&rec.search.indexOf(q)>=0) && rowText.indexOf(q)<0)return false;
  if(filters.categoria!=='all'){
    var cat=rec?rec.cat:rowText;
    if(cat.indexOf(norm(filters.categoria))<0)return false;
  }
  if(filters.estado!=='all'){
    var total=rec?rec.total:0, covered=rec?rec.covered:0;
    var pct=total?covered/total*100:parseFloat((row.cells&&row.cells[2]?row.cells[2].textContent:'0').replace(',','.'))||0;
    if(filters.estado==='completas' && pct<99.999)return false;
    if(filters.estado==='avance' && !(pct>0&&pct<99.999))return false;
    if(filters.estado==='sinavance' && pct>0)return false;
  }
  if(filters.gestion!=='all'){
    var ok=false;
    if(rec){ok=filters.gestion==='camino'?rec.camino:filters.gestion==='requested'?rec.requested:filters.gestion==='available'?rec.available:false}
    else{
      var gt=norm(row&&row.cells&&row.cells[row.cells.length-1]?row.cells[row.cells.length-1].textContent:'');
      if(filters.gestion==='camino')ok=gt.indexOf('TRASLADO')>=0;
      if(filters.gestion==='requested')ok=gt.indexOf('SOLICITUD')>=0;
      if(filters.gestion==='available')ok=gt.indexOf('PUEDES SOLICITAR')>=0;
    }
    if(!ok)return false;
  }
  if(filters.piso!=='all'){
    var p1=rec&&rec.p1t?rec.p1h/rec.p1t*100:parseFloat((row.cells&&row.cells[3]?row.cells[3].textContent:'100').replace(',','.'))||0;
    var p2=rec&&rec.p2t?rec.p2h/rec.p2t*100:parseFloat((row.cells&&row.cells[4]?row.cells[4].textContent:'100').replace(',','.'))||0;
    if(filters.piso==='p1' && p1>=99.999)return false;
    if(filters.piso==='p2' && p2>=99.999)return false;
  }
  return true;
}
function createBar(){
  if(view()!=='amb')return null;
  var root=document.getElementById('content'),table=document.getElementById('guias-tbl');if(!root||!table)return null;
  var bar=root.querySelector('.v138AmbFilters');
  if(!bar){
    bar=document.createElement('div');bar.className='v138AmbFilters';
    bar.innerHTML=''+
      '<div class="v138AmbField"><label>Búsqueda rápida</label><input data-v138="q" type="search" placeholder="Guía, producto o código..."></div>'+
      '<div class="v138AmbField"><label>Estado de guía</label><select data-v138="estado"><option value="all">Todas</option><option value="completas">Completas</option><option value="avance">Con avance</option><option value="sinavance">Sin avance</option></select></div>'+
      '<div class="v138AmbField"><label>Gestión</label><select data-v138="gestion"><option value="all">Todas</option><option value="camino">En traslado</option><option value="requested">Solicitud realizada</option><option value="available">Puedes solicitar</option></select></div>'+
      '<div class="v138AmbField"><label>Piso</label><select data-v138="piso"><option value="all">Todos</option><option value="p1">Piso 1 pendiente</option><option value="p2">Piso 2 pendiente</option></select></div>'+
      '<div class="v138AmbField"><label>Categoría</label><select data-v138="categoria"><option value="all">Todas</option><option value="DORMITORIO">Dormitorio</option><option value="SOCIAL">Social</option></select></div>'+
      '<div class="v138AmbField"><label>Acción</label><button class="v138AmbClear" type="button">Limpiar filtros</button></div>'+
      '<span class="v138AmbCount"></span>';
    table.parentNode.insertBefore(bar,table);
    bar.addEventListener('input',function(e){var k=e.target&&e.target.getAttribute('data-v138');if(k!=='q')return;clearTimeout(debounce);debounce=setTimeout(function(){filters.q=e.target.value;apply()},60)});
    bar.addEventListener('change',function(e){var k=e.target&&e.target.getAttribute('data-v138');if(!k||k==='q')return;filters[k]=e.target.value;apply()});
    bar.querySelector('.v138AmbClear').addEventListener('click',function(){filters={q:'',estado:'all',gestion:'all',piso:'all',categoria:'all'};bar.querySelector('[data-v138="q"]').value='';bar.querySelector('[data-v138="estado"]').value='all';bar.querySelector('[data-v138="gestion"]').value='all';bar.querySelector('[data-v138="piso"]').value='all';bar.querySelector('[data-v138="categoria"]').value='all';apply()});
  }
  return bar;
}
function apply(){
  if(view()!=='amb')return;
  var bar=createBar(),map=currentRows();if(!bar)return;
  var table=document.getElementById('guias-tbl');if(!table)return;
  var rows=Array.from(table.querySelectorAll('tbody tr.guideListRowV48, tbody tr[data-guide-code]'));
  if(!rows.length)rows=Array.from(table.querySelectorAll('tbody tr')).filter(function(r){return r.cells&&r.cells.length>=7});
  var visible=0;
  rows.forEach(function(row){var code=str(row.getAttribute('data-guide-code')||row.dataset.guideCode||'');var show=passes(map[code],row);row.style.display=show?'':'none';if(show)visible++});
  var total=rows.length;var cnt='Mostrando '+visible+' de '+total+' guías';
  var out=bar.querySelector('.v138AmbCount');if(out)out.textContent=cnt;
  var foot=document.getElementById('guias-cnt');if(foot)foot.textContent=cnt;
  var info=document.getElementById('guideFilterInfoV48');if(info)info.style.display='none';
}
function cleanupOld(){
  if(view()!=='amb')return;
  document.querySelectorAll('#content .v134CanonicalFilters[data-module="ambientes"],#content .v135AmbientFilters,#content .v132ModuleFilters[data-v132-module="ambientes"],#content .v133CanonicalFilters[data-module="ambientes"]').forEach(function(x){x.style.display='none'});
}
function patch(){mark();cleanupOld();createBar();apply()}
function watchContent(){
  if(observer)return;var root=document.getElementById('content');if(!root)return;
  observer=new MutationObserver(function(muts){var relevant=muts.some(function(m){return m.addedNodes&&m.addedNodes.length});if(relevant)setTimeout(patch,30)});
  observer.observe(root,{childList:true,subtree:true});
}
function wrap(name){var fn=window[name];if(typeof fn!=='function'||fn.__v138)return;var w=function(){var out=fn.apply(this,arguments);setTimeout(patch,40);setTimeout(patch,160);return out};w.__v138=true;window[name]=w;try{if(name==='setView')setView=w;else if(name==='refresh')refresh=w;else if(name==='drawGuias')drawGuias=w}catch(_){}}
function install(){mark();wrap('setView');wrap('refresh');wrap('drawGuias');watchContent();setTimeout(patch,80);setTimeout(patch,350);document.addEventListener('change',function(e){if(e.target&&e.target.id==='store')setTimeout(patch,120)},true);console.info('LLAVERO V86.138 · filtros de Ambientes separados por criterio')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,80)},{once:true});
})();


/* ==== llaveroV86139SidebarStable ==== */

(function(){
'use strict';
var VERSION='V86.140';
var CANON_CACHE=null, EXPECTED={}, EXPECTED_STORE='', lock=false, observer=null;
var IDS=['nc-inv','nc-prox','nc-rot','nc-evac','nc-amb','nc-tr','nc-md'];
function s(v){return v==null?'':String(v).trim()}
function num(v){var x=Number(v);return Number.isFinite(x)?x:0}
function fmt(v){try{return num(v).toLocaleString('es-CO')}catch(_){return String(num(v))}}
function mark(){
  try{
    window.LLAVERO_BUILD=VERSION;
    document.documentElement.setAttribute('data-llavero-build',VERSION);
    document.documentElement.setAttribute('data-llavero-app-version',VERSION);
    document.documentElement.setAttribute('data-preview',VERSION);
    document.title=document.title.replace(/V86\.\d+/g,VERSION);
    var b=document.querySelector('.appVersionChip b');if(b)b.textContent=(b.textContent||'').replace(/V86\.\d+$/,VERSION);
  }catch(_){ }
}
function canonical(){
  if(CANON_CACHE)return CANON_CACHE;
  CANON_CACHE={};
  try{
    var el=document.getElementById('llaveroV86122CanonicalSourcePatch');
    var t=el?el.textContent:'';
    var m=t.match(/var\s+CANON\s*=\s*(\{[\s\S]*?\})\s*;\s*function\s+n\s*\(/);
    if(m&&m[1])CANON_CACHE=JSON.parse(m[1]);
  }catch(e){console.warn('V86.139 canonical parse',e)}
  return CANON_CACHE;
}
function currentStore(){
  try{
    var select=document.getElementById('store');
    if(select&&select.value)return s(select.value);
    return s(typeof CUR!=='undefined'?CUR:'');
  }catch(_){return ''}
}
function fallback(st){
  var o={inv:0,prox:0,rotN:0,evacN:0};
  try{
    if(typeof window.inventorySummary==='function'){
      var x=window.inventorySummary(st||{});
      if(x){o.inv=num(x.refs);o.prox=num(x.prox);o.rotN=num(x.rotation);o.evacN=num(x.evacuation)}
    }
  }catch(_){ }
  try{if(!o.inv&&st&&Array.isArray(st.inventario))o.inv=st.inventario.filter(function(r){return num(r&&r.stock)>0}).length}catch(_){ }
  return o;
}
function expectedFor(sc){
  var st={};try{st=(typeof S!=='undefined'&&S&&S[sc])||{}}catch(_){ }
  var q=null, f=fallback(st), out={}; /* V86.154: sidebar toma el mismo cálculo vivo de los módulos, no el CANON histórico. */
  out['nc-inv']=num(f.inv);
  // V86.140: Próximos a rotar debe usar exactamente el mismo universo del módulo Próximos a rotar.
  // Esto evita que el sidebar tome el valor histórico/canónico anterior (70) cuando el módulo calcula 93.
  var proxModule=null;
  try{
    if(typeof window.upcomingRotationRows==='function'){
      var proxRows140=window.upcomingRotationRows(st||{});
      if(Array.isArray(proxRows140))proxModule=proxRows140.length;
    }
  }catch(_){proxModule=null}
  out['nc-prox']=proxModule!=null?num(proxModule):(q&&q.prox!=null?num(q.prox):num(f.prox));
  out['nc-rot']=num(f.rotN);
  out['nc-evac']=num(f.evacN);
  out['nc-amb']=st&&Array.isArray(st.guias)?st.guias.length:0;
  try{out['nc-tr']=typeof window.__transferPendingOrderCount==='function'?num(window.__transferPendingOrderCount(st)):(Array.isArray(st.tr)?st.tr.length:0)}catch(_){out['nc-tr']=Array.isArray(st.tr)?st.tr.length:0}
  try{
    if(typeof window.correctedRows==='function')out['nc-md']=window.correctedRows(sc).filter(function(r){return r&&r.statusKey==='manage'}).length;
    else if(typeof window.markdownCount8670==='function')out['nc-md']=num(window.markdownCount8670(sc));
    else out['nc-md']=null;
  }catch(_){out['nc-md']=null}
  return out;
}
function refreshExpected(sc){
  var code=s(sc||currentStore());if(!code)return;
  EXPECTED_STORE=code;EXPECTED=expectedFor(code);
}
function guard(){
  if(lock)return;
  lock=true;
  try{
    IDS.forEach(function(id){
      var el=document.getElementById(id), v=EXPECTED[id];
      if(!el||v==null)return;
      var wanted=fmt(v);
      if(s(el.textContent)!==wanted)el.textContent=wanted;
    });
    mark();
  }finally{lock=false}
}
function stabilize(sc){refreshExpected(sc);guard()}
function installObserver(){
  if(observer)return;
  var side=document.querySelector('.side')||document.body;
  observer=new MutationObserver(function(mutations){
    if(lock)return;
    var touched=false;
    for(var i=0;i<mutations.length&&!touched;i++){
      var m=mutations[i], target=m.target&&m.target.nodeType===3?m.target.parentElement:m.target;
      if(target&&target.closest&&target.closest('.cnt'))touched=true;
      if(!touched&&m.addedNodes&&m.addedNodes.length){
        for(var j=0;j<m.addedNodes.length;j++){
          var n=m.addedNodes[j];
          if(n.nodeType===1&&((n.classList&&n.classList.contains('cnt'))||(n.querySelector&&n.querySelector('.cnt')))){touched=true;break;}
        }
      }
    }
    if(touched)guard();
  });
  observer.observe(side,{subtree:true,childList:true,characterData:true});
}
function wrap(name){
  var fn=window[name];if(typeof fn!=='function'||fn.__v139Stable)return;
  var w=function(){
    // Se fijan los valores correctos ANTES del render para que nunca aparezca 0.
    stabilize();
    var out=fn.apply(this,arguments);
    // MutationObserver protege durante el render; este guard cubre funciones que reemplazan nodos completos.
    guard();
    queueMicrotask(function(){stabilize()});
    return out;
  };
  w.__v139Stable=true;window[name]=w;
  try{if(name==='setView')setView=w;else if(name==='refresh')refresh=w}catch(_){ }
}
function install(){
  mark();stabilize();installObserver();wrap('setView');wrap('refresh');
  document.addEventListener('change',function(e){
    if(e.target&&e.target.id==='store'){
      // Usamos el valor seleccionado inmediatamente, antes de que otros parches repinten el sidebar.
      stabilize(e.target.value);
      queueMicrotask(function(){stabilize(e.target.value)});
      setTimeout(function(){stabilize(e.target.value)},0);
    }
  },true);
  document.addEventListener('click',function(e){
    var nav=e.target&&e.target.closest?e.target.closest('.nav a[data-v]'):null;
    if(nav)guard();
  },true);
  window.addEventListener('focus',function(){stabilize()});
  window.addEventListener('llavero:view-stable',function(){stabilize()});
  console.info('LLAVERO V86.140 · sidebar Próximos sincronizado con el módulo y protegido contra ceros transitorios');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.addEventListener('llavero:bootstrapped',function(){stabilize();installObserver()},{once:true});
})();


/* ==== llaveroV86143BuildMarker ==== */

(function(){
  'use strict';
  var VERSION='V86.144';
  function mark(){
    try{
      window.LLAVERO_BUILD=VERSION;
      document.documentElement.setAttribute('data-llavero-build',VERSION);
      document.documentElement.setAttribute('data-llavero-app-version',VERSION);
      document.documentElement.setAttribute('data-preview',VERSION);
      document.title=document.title.replace(/V86\.\d+/g,VERSION);
      var b=document.querySelector('.appVersionChip b');
      if(b)b.textContent=(b.textContent||'').replace(/V86\.\d+$/,VERSION);
    }catch(_){ }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mark,{once:true}); else mark();
  window.addEventListener('llavero:bootstrapped',mark,{once:true});
})();


/* ==== llaveroV86145Script ==== */

(function(){
'use strict';
if(window.__LLAVERO_V86145__)return;window.__LLAVERO_V86145__=true;
var VERSION='V86.145', CUT='2026-08-19', patchTimer=0;
function s(v){return String(v==null?'':v)}
function n(v){var x=Number(v);return Number.isFinite(x)?x:0}
function norm(v){var x=s(v).trim().toUpperCase();try{return x.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(_){return x}}
function esc(v){return s(v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]||c})}
function fi(v){try{return typeof fInt==='function'?fInt(n(v)):Math.round(n(v)).toLocaleString('es-CO')}catch(_){return s(Math.round(n(v)))}}
function store(){try{return (typeof S!=='undefined'&&S&&S[CUR])||{}}catch(_){return {}}}
function pinfo(code){try{return (typeof productInfo==='function'?productInfo(code):(typeof P!=='undefined'&&P&&P[code]))||{n:code,cat:'—',lin:'—',sub:'—'}}catch(_){return {n:code,cat:'—',lin:'—',sub:'—'}}}
function thumb(code){try{return typeof imageThumb==='function'?imageThumb(code,'sm'):''}catch(_){return ''}}
function view(){try{return typeof VIEW!=='undefined'?VIEW:''}catch(_){return ''}}
function mark(){
  try{
    window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);document.documentElement.setAttribute('data-preview',VERSION);
    document.title='Llavero · Inventarios Jamar · 20/08/2026 · '+VERSION;
    var b=document.querySelector('.appVersionChip b');if(b)b.textContent='19/08/2026 · '+VERSION;
  }catch(_){ }
}

/* --- Seguimiento: autoshrink solo si un valor no cabe; nunca oculta el número. --- */
function fitValue(el,min){if(!el)return;el.style.fontSize='';var size=parseFloat(getComputedStyle(el).fontSize)||16,guard=0;while(el.scrollWidth>el.clientWidth+1&&size>(min||9)&&guard++<14){size-=.5;el.style.fontSize=size+'px'}}
function fitTracking(){
  var root=document.querySelector('.v128Tracking');if(!root)return;
  root.querySelectorAll('.trackingMetric b').forEach(function(el){fitValue(el,8.5)});
  root.querySelectorAll('.v8680TrackProducts b').forEach(function(el){fitValue(el,10)});
}

/* --- Filtros duplicados: conservar el filtro canónico del sistema. --- */
var FILTER_SEL='.v8698ClassFilters,.ux104Filters,.v108HierarchyFilters,.v8664DetailTools,.v8664MixFilters,.v8692NovelFilters,.v80Filters,.v866ListFilters,.v118UnifiedFilters,.v8695MdFilters,.v8692MdDetailFilters,.v866Filters';
function removeSearchOnlyDuplicates(body,canonical){
  if(!body)return;
  body.querySelectorAll('.v869DetailSearch').forEach(function(x){if(!canonical||!x.contains(canonical)){x.classList.add('v145RemovedDuplicate');x.remove()}});
  var searches=Array.from(body.querySelectorAll('input[type="search"]'));
  if(searches.length<=1)return;
  searches.forEach(function(inp){if(canonical&&canonical.contains(inp))return;var ph=norm(inp.placeholder);if(ph.indexOf('BUSCAR CODIGO O PRODUCTO')<0&&ph.indexOf('CODIGO O PRODUCTO')<0)return;var box=inp.closest('.tbar,.toolbar,.v869DetailSearch,.v8664DetailSearch,.v8698ClassFilters,.v866ListFilters,.v8664DetailTools');if(box&&!canonical?.contains(box))box.remove()});
}
function normalizeFilters(body){
  if(!body)return;
  var title='';try{title=norm(body.id==='rangeModalBody'?document.getElementById('rangeModalTitle').textContent:body.id==='v80ModalBody'?document.getElementById('v80ModalTitle').textContent:'')}catch(_){ }
  var isMd=/MARKDOWN|DESCUENTO|POLITICA|OFERTA|GESTIONAR/.test(title)||!!body.querySelector('.v8695MdFilters,.v8692MdDetailFilters');
  var isTrend=!!body.querySelector('.v866Filters')&&(/TENDENCIA|CORTE|HISTORIC/.test(title)||!!body.querySelector('.v866TrendTable'));
  var canonical=null;
  if(isMd)canonical=body.querySelector('.v8695MdFilters,.v8692MdDetailFilters,.v118UnifiedFilters');
  else if(isTrend)canonical=body.querySelector('.v866Filters,.v118UnifiedFilters');
  else canonical=body.querySelector('.v118UnifiedFilters')||body.querySelector('.v866Filters')||body.querySelector('.v866ListFilters');
  if(canonical){
    canonical.classList.add('v145CanonicalFilters');
    Array.from(body.querySelectorAll(FILTER_SEL)).forEach(function(b){if(b!==canonical&&!canonical.contains(b)&&!b.contains(canonical))b.remove()});
    removeSearchOnlyDuplicates(body,canonical);
  }
}
function normalizeOpenModals(){
  normalizeFilters(document.getElementById('rangeModalBody'));
  normalizeFilters(document.getElementById('v80ModalBody'));
  enhanceGuideDetail();
}

/* --- Ambientes: reconstruir de forma segura las tres tarjetas de impacto con datos vivos. --- */
function ambImpact(type){
  var st=store(),rows=[],all=new Set();
  (Array.isArray(st.guias)?st.guias:[]).forEach(function(g){
    var total=n(g&&g[3]),current=n(g&&g[4]),prods=(Array.isArray(g&&g[6])?g[6]:[]).filter(function(p){return !!(p&&p[10])});
    var targets=prods.filter(function(p){var status=s(p&&p[5]),code=s(p&&p[0]),cd=n(pinfo(code).dispCendis);if(type==='camino')return status==='camino';if(type==='requested')return status==='requested'||status==='requested_nostock';if(type==='available')return status==='available'&&cd>0;return false});
    if(!targets.length)return;targets.forEach(function(p){all.add(s(p&&p[0]))});var projected=Math.min(total,current+targets.length);
    rows.push({code:s(g&&g[0]),name:s(g&&g[1]),targets:targets,total:total,current:current,projected:projected,complete:current<total&&projected>=total,advance:current<total&&projected>current&&projected<total});
  });
  return {rows:rows,products:all.size,positions:rows.reduce(function(a,g){return a+g.targets.length},0),complete:rows.filter(function(g){return g.complete}).length,advance:rows.filter(function(g){return g.advance}).length};
}
function impactBox(type,label){var x=ambImpact(type);return '<div class="v145ImpactGroup"><div class="v145ImpactHead"><b>'+esc(label)+'</b><span>'+fi(x.products)+' productos · '+fi(x.positions)+' posiciones</span></div><div class="v145ImpactChoices"><button type="button" data-v145-impact="'+type+'" data-v145-result="complete"><strong>'+fi(x.complete)+'</strong><span>Completan</span></button><button type="button" data-v145-impact="'+type+'" data-v145-result="advance"><strong>'+fi(x.advance)+'</strong><span>Avanzan</span></button></div></div>'}


/* --- Detalle de guía: un solo buscador/selector y misma lógica V50. --- */
var guideDebounce=0;
function enhanceGuideDetail(){
  var body=document.getElementById('guideDetailBodyV49');if(!body||!body.closest('#guideDetailModalBackV49.on'))return;
  var native=body.querySelector('.guideModalToolbarV48');if(native)native.style.display='none';
  if(body.querySelector('.v145GuideFilters'))return;
  var d;try{d=(state.guias&&state.guias.detail)||{floor:'all',status:'all',q:''}}catch(_){d={floor:'all',status:'all',q:''}}
  var bar=document.createElement('div');bar.className='v145GuideFilters';
  bar.innerHTML='<div><label>Búsqueda rápida</label><input type="search" data-v145-guide="q" placeholder="Producto, código o estado..." value="'+esc(d.q||'')+'"></div><div><label>Piso</label><select data-v145-guide="floor"><option value="all">Todos los pisos</option><option value="1">Piso 1</option><option value="2">Piso 2</option><option value="3">Piso 3</option></select></div><div><label>Estado / gestión</label><select data-v145-guide="status"><option value="all">Todos</option><option value="covered">Cubiertos</option><option value="pending">Pendientes</option><option value="camino">En traslado</option><option value="requested">Solicitud realizada</option><option value="available">Puedes solicitar</option></select></div><div><label>Acción</label><button type="button" data-v145-guide-clear>Limpiar filtros</button></div>';
  bar.querySelector('[data-v145-guide="floor"]').value=d.floor||'all';bar.querySelector('[data-v145-guide="status"]').value=d.status||'all';
  var stats=body.querySelector('.guideModalStatsV48');if(stats)stats.insertAdjacentElement('afterend',bar);else body.insertBefore(bar,body.firstChild);
  bar.addEventListener('input',function(e){if(e.target.dataset.v145Guide!=='q')return;clearTimeout(guideDebounce);guideDebounce=setTimeout(function(){try{state.guias.detail.q=e.target.value;if(typeof window.renderGuideDetailV49==='function')window.renderGuideDetailV49()}catch(_){}},70)});
  bar.addEventListener('change',function(e){var k=e.target.dataset.v145Guide;if(!k||k==='q')return;try{state.guias.detail[k]=e.target.value;if(typeof window.renderGuideDetailV49==='function')window.renderGuideDetailV49()}catch(_){}});
  bar.querySelector('[data-v145-guide-clear]').onclick=function(){try{state.guias.detail={floor:'all',status:'all',q:''};if(typeof window.renderGuideDetailV49==='function')window.renderGuideDetailV49()}catch(_){}};
}

/* --- Traslados: impacto SOLO de órdenes por entregar + ambiente/guía + orden. --- */
function trStatus(r){var e=norm(r&&r.estatus);if(e.indexOf('ENTREG')>=0)return'Entregado';if(e.indexOf('PICK')>=0)return'En picking';if(e.indexOf('RUTA')>=0)return'En ruta';if(e.indexOf('PEND')>=0)return'Pendiente';var p=norm(r&&r.statusGlobalPicking),m=norm(r&&r.statusMovimiento),w=norm(r&&r.lugarPuestaDispos);if(p==='C'&&m==='C')return'Entregado';if(p==='C'&&m==='A')return'En ruta';if(p==='A'&&m==='A'&&w.indexOf('WMS')>=0)return'En picking';return'Pendiente'}
function pendingTr(){return (Array.isArray(store().trDetalle)?store().trDetalle:[]).filter(function(r){return trStatus(r)!=='Entregado'})}
function conditionSets145(){var st=store(),rot=new Set(),evac=new Set();(Array.isArray(st.rot)?st.rot:[]).forEach(function(r){rot.add(s(r&&r[0]))});(Array.isArray(st.evac)?st.evac:[]).forEach(function(r){evac.add(s(r&&r[0]))});return{rot:rot,evac:evac}}
function guideNamesFor(code){var out=[],st=store();(Array.isArray(st.guias)?st.guias:[]).forEach(function(g){var hit=(Array.isArray(g&&g[6])?g[6]:[]).some(function(p){return s(p&&p[0])===s(code)&&s(p&&p[5])==='camino'});if(hit)out.push({code:s(g&&g[0]),name:s(g&&g[1])})});return out}
function transferImpact145(){var pend=pendingTr(),codes=new Set(pend.map(function(r){return s(r.codigo)})),sets=conditionSets145(),by={};pend.forEach(function(r){var c=s(r.codigo),gs=guideNamesFor(c),rot=sets.rot.has(c),evac=sets.evac.has(c),amb=gs.length>0;if(!(rot||evac||amb))return;var o=by[c]||(by[c]={code:c,name:s(r.nombre)||pinfo(c).n||c,orders:new Set(),statuses:new Set(),units:0,rot:rot,evac:evac,guides:gs});o.orders.add(s(r.entrega||'Sin identificar'));o.statuses.add(trStatus(r));o.units+=n(r.unidades)});return Object.values(by).sort(function(a,b){return b.units-a.units||a.name.localeCompare(b.name,'es')})}
function showRange145(title,sub,html){var modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle');if(!modal||!body)return;if(tt)tt.textContent=title;if(ss)ss.textContent=sub||'';body.innerHTML=html;modal.classList.add('on');document.body.style.overflow='hidden';setTimeout(normalizeOpenModals,50)}
window.openImpactOrders145=function(code){var rows=pendingTr().filter(function(r){return s(r.codigo)===s(code)}),p=pinfo(code),guides=guideNamesFor(code),groups={};rows.forEach(function(r){var id=s(r.entrega||'Sin identificar');(groups[id]||(groups[id]=[])).push(r)});var ids=Object.keys(groups),trs=ids.map(function(id){var a=groups[id],units=a.reduce(function(x,r){return x+n(r.unidades)},0),sts=Array.from(new Set(a.map(trStatus)));return'<tr><td><b>'+esc(id)+'</b></td><td>'+esc(a[0]&&a[0].fechaEntrega||'—')+'</td><td>'+esc(sts.join(' / '))+'</td><td class="num"><b>'+fi(units)+'</b></td><td>'+esc(a[0]&&a[0].ruta||'—')+'</td></tr>'}).join('');var env=guides.length?guides.map(function(g){return esc(g.name)+' <small>'+esc(g.code)+'</small>'}).join('<br>'):'No impacta ambientes';showRange145('Entregas por entregar del producto '+esc(code),(store().name||CUR)+' · '+esc(p.n||code),'<'+'div class="v127DetailSummary"><div><label>Órdenes por entregar</label><b>'+fi(ids.length)+'</b></div><div><label>Unidades pendientes</label><b>'+fi(rows.reduce(function(a,r){return a+n(r.unidades)},0))+'</b></div><div><label>Ambientes / guías</label><b style="font-size:10px;white-space:normal">'+env+'</b></div></div><div class="v127TableWrap"><table class="v127Table"><thead><tr><th>Orden de entrega</th><th>Entrega estimada</th><th>Estado</th><th class="num">Unidades</th><th>Ruta</th></tr></thead><tbody>'+trs+'</tbody></table></div>')};
window.openTransferImpact127=function(){var rows=transferImpact145(),sets=conditionSets145(),rc=rows.filter(function(r){return r.rot}).length,ec=rows.filter(function(r){return r.evac}).length,ac=rows.filter(function(r){return r.guides.length}).length,trs=rows.map(function(r){var p=pinfo(r.code),impact=[r.rot?'Rotación':'',r.evac?'Evacuación':'',r.guides.length?'Ambientes':''].filter(Boolean).join(' · '),env=r.guides.length?r.guides.map(function(g){return'<span><b>'+esc(g.name)+'</b><small>'+esc(g.code)+'</small></span>'}).join(''):'<span>—</span>';return'<tr class="v145TransferImpactRow" data-code="'+esc(r.code)+'"><td>'+thumb(r.code)+'</td><td><span class="code">'+esc(r.code)+'</span></td><td><div class="v145Stack"><b>'+esc(r.name)+'</b><small>'+esc([p.cat,p.lin,p.sub].filter(Boolean).join(' · '))+'</small></div></td><td>'+esc(impact)+'</td><td><div class="v145Env">'+env+'</div></td><td class="v145Orders">'+esc(Array.from(r.orders).join(' · '))+'</td><td>'+esc(Array.from(r.statuses).join(' / '))+'</td><td class="num"><b>'+fi(r.units)+'</b></td></tr>'}).join('');showRange145('Productos con impacto por entregar',(store().name||CUR)+' · únicamente órdenes Pendiente, En picking o En ruta','<div class="v127DetailSummary"><div><label>Productos únicos</label><b>'+fi(rows.length)+'</b></div><div><label>Rotación</label><b>'+fi(rc)+'</b></div><div><label>Evacuación</label><b>'+fi(ec)+'</b></div><div><label>Ambientes</label><b>'+fi(ac)+'</b></div></div><div class="v127TableWrap"><table class="v127Table"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Impacto</th><th>Ambiente / guía</th><th>Orden(es) por entregar</th><th>Estado</th><th class="num">Uds. pendientes</th></tr></thead><tbody>'+trs+'</tbody></table></div><div class="v127Hint">Selecciona un producto para ver el detalle de sus órdenes que todavía están por entregar.</div>');setTimeout(function(){document.querySelectorAll('#rangeModalBody .v145TransferImpactRow').forEach(function(tr){tr.onclick=function(){window.openImpactOrders145(this.dataset.code)}})},0)};
function patchTransferCard(){if(view()!=='traslados')return;var rows=transferImpact145(),root=document.getElementById('content');if(!root)return;var rc=rows.filter(function(r){return r.rot}).length,ec=rows.filter(function(r){return r.evac}).length,ac=rows.filter(function(r){return r.guides.length}).length;root.querySelectorAll('.transferMetricCard8616,.v80TransferKpi,.transferKpi8615').forEach(function(card){var lab=card.querySelector('.transferMetricLabel8616,label,.lab'),txt=norm(lab?lab.textContent:card.textContent);if(txt.indexOf('PRODUCTOS CON IMPACTO')<0&&txt.indexOf('PRODUCTOS CRITICOS')<0)return;if(lab)lab.textContent='Productos con impacto por entregar';var val=card.querySelector('strong,b,.val');if(val)val.textContent=fi(rows.length);var sub=card.querySelector('small,.sub');if(sub)sub.textContent=fi(rc)+' Rotación · '+fi(ec)+' Evacuación · '+fi(ac)+' Ambientes';card.onclick=function(e){if(e){e.preventDefault();e.stopPropagation()}window.openTransferImpact127()};card.style.cursor='pointer'})}

/* --- Limpieza especial de detalles: cuando ya existe el filtro del sistema, retirar filtros simples heredados. --- */
function finalDetailCleanup(){
  ['rangeModalBody','v80ModalBody'].forEach(function(id){var body=document.getElementById(id);if(!body)return;var uni=body.querySelector('.v118UnifiedFilters');if(uni){uni.classList.add('v145CanonicalFilters');body.querySelectorAll('.v866ListFilters,.v8698ClassFilters,.v8664DetailTools,.ux104Filters,.v108HierarchyFilters,.v869DetailSearch').forEach(function(x){if(!uni.contains(x))x.remove()})}normalizeFilters(body)});
  var guide=document.getElementById('guideDetailBodyV49');if(guide){guide.querySelectorAll('.v108HierarchyFilters,.ux104Filters').forEach(function(x){x.remove()});enhanceGuideDetail()}
}

/* Markdown: el filtro funcional propio se conserva y se hace canónico; se eliminan auxiliares repetidos. */
function normalizeMarkdownModal(){var body=document.getElementById('rangeModalBody');if(!body)return;var title=norm((document.getElementById('rangeModalTitle')||{}).textContent||'');if(!(/MARKDOWN|DESCUENTO|POLITICA|OFERTA|GESTIONAR/.test(title)||body.querySelector('.v8695MdFilters,.v8692MdDetailFilters')))return;var keep=body.querySelector('.v8695MdFilters,.v8692MdDetailFilters,.v118UnifiedFilters');if(!keep)return;keep.classList.add('v145CanonicalFilters');Array.from(body.querySelectorAll(FILTER_SEL)).forEach(function(x){if(x!==keep&&!keep.contains(x)&&!x.contains(keep))x.remove()});removeSearchOnlyDuplicates(body,keep);if(keep.classList.contains('v8695MdFilters')&&!keep.querySelector('.v145MdClear')){var clear=document.createElement('button');clear.type='button';clear.className='v145MdClear';clear.textContent='Limpiar filtros';clear.onclick=function(){keep.querySelectorAll('input').forEach(function(x){x.value='';x.dispatchEvent(new Event('input',{bubbles:true}))});keep.querySelectorAll('select').forEach(function(x){x.value='all';x.dispatchEvent(new Event('change',{bubbles:true}))})};keep.appendChild(clear)}}

/* --- Programación ligera: sin observer global. --- */
function patchView(){mark();fitTracking();patchTransferCard();finalDetailCleanup();normalizeMarkdownModal()}
function schedule(ms){clearTimeout(patchTimer);patchTimer=setTimeout(patchView,ms==null?80:ms)}
function wrap(name,after){var fn=window[name];if(typeof fn!=='function'||fn.__v145)return;var w=function(){var out=fn.apply(this,arguments);setTimeout(after||patchView,40);setTimeout(after||patchView,180);return out};w.__v145=true;window[name]=w;try{if(name==='setView')setView=w;else if(name==='refresh')refresh=w;else if(name==='drawGuias')drawGuias=w;else if(name==='drawTr8615')drawTr8615=w}catch(_){}}
function install(){
  mark();wrap('setView');wrap('refresh');wrap('drawGuias',function(){patchView()});wrap('drawTr8615',patchTransferCard);
  var rg=window.renderGuideDetailV49;if(typeof rg==='function'&&!rg.__v145){var wr=function(){var out=rg.apply(this,arguments);setTimeout(enhanceGuideDetail,0);return out};wr.__v145=true;window.renderGuideDetailV49=wr}
  ['openCendisModule868','openInventoryClass869','openComposition8664','openTrendPoint8667','openMdRule8664','openMdRule8666'].forEach(function(name){var fn=window[name];if(typeof fn!=='function'||fn.__v145)return;var w=function(){var out=fn.apply(this,arguments);setTimeout(finalDetailCleanup,90);setTimeout(finalDetailCleanup,280);return out};w.__v145=true;window[name]=w});
  if(window.V8695&&typeof window.V8695.status==='function'&&!window.V8695.status.__v145){var os=window.V8695.status;window.V8695.status=function(){var out=os.apply(this,arguments);setTimeout(function(){finalDetailCleanup();normalizeMarkdownModal()},90);setTimeout(function(){finalDetailCleanup();normalizeMarkdownModal()},280);return out};window.V8695.status.__v145=true}
  document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('button,[role="button"],tbody tr,[onclick]')){setTimeout(function(){finalDetailCleanup();normalizeMarkdownModal();fitTracking()},100);setTimeout(function(){finalDetailCleanup();normalizeMarkdownModal()},320)}},true);
  document.addEventListener('change',function(e){if(e.target&&e.target.id==='store')setTimeout(patchView,140)},true);
  window.addEventListener('resize',function(){clearTimeout(patchTimer);patchTimer=setTimeout(function(){fitTracking()},90)});
  setTimeout(patchView,80);setTimeout(patchView,420);
  console.info('LLAVERO V86.145 · tablas limpias, filtros únicos, Ambientes/Traslados/Markdown y seguimiento visual corregidos');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,100)},{once:true});
window.addEventListener('llavero:view-stable',function(){schedule(60)});
})();


/* ==== llaveroV86154SidebarSync ==== */

(function(){
'use strict';
if(window.__LLAVERO_V86154_SIDEBAR__)return;window.__LLAVERO_V86154_SIDEBAR__=true;
var VERSION='V86.154',CUT='20/08/2026';
function n(v){var x=Number(v);return Number.isFinite(x)?x:0}
function fi(v){try{return typeof fInt==='function'?fInt(n(v)):Math.round(n(v)).toLocaleString('es-CO')}catch(_){return String(Math.round(n(v)))}}
function store(){try{return (typeof S!=='undefined'&&S&&S[CUR])||{}}catch(_){return{}}}
function counts(){
  var st=store(),inv=0,prox=0,rot=0,evac=0;
  try{var x=typeof window.inventorySummary==='function'?window.inventorySummary(st):null;if(x)inv=n(x.refs)}catch(_){}
  try{var r=typeof window.upcomingRotationRows==='function'?window.upcomingRotationRows(st):null;if(Array.isArray(r))prox=r.length}catch(_){}
  try{var r2=typeof window.rotationDetailedRows==='function'?window.rotationDetailedRows(st):null;if(Array.isArray(r2))rot=r2.length}catch(_){}
  try{var e2=typeof window.evacuationDetailedRows==='function'?window.evacuationDetailedRows(st):null;if(Array.isArray(e2))evac=e2.length}catch(_){}
  if(!inv&&Array.isArray(st.inventario))inv=st.inventario.filter(function(r){return n(r&&r.stock)>0}).length;
  if(!rot&&Array.isArray(st.rot))rot=st.rot.length;
  if(!evac&&Array.isArray(st.evac))evac=st.evac.length;
  return {'nc-inv':inv,'nc-prox':prox,'nc-rot':rot,'nc-evac':evac};
}
function mark(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);document.documentElement.setAttribute('data-preview',VERSION);document.title='Llavero · Inventarios Jamar · '+CUT+' · '+VERSION;var b=document.querySelector('.appVersionChip b');if(b)b.textContent=CUT+' · '+VERSION}catch(_){}}
function sync(){try{var c=counts();Object.keys(c).forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=fi(c[id])});window.__LLAVERO_SIDEBAR_COUNTS_V86154__=c;mark()}catch(e){console.error('V86.154 sidebar',e)}}
function install(){sync();[80,250,700,1500].forEach(function(ms){setTimeout(sync,ms)});document.addEventListener('change',function(e){if(e.target&&e.target.id==='store'){setTimeout(sync,0);setTimeout(sync,180)}},true);window.addEventListener('llavero:view-stable',function(){setTimeout(sync,0);setTimeout(sync,120)});window.addEventListener('focus',sync);console.info('LLAVERO V86.154 · Inventario, Rotación y Evacuación sincronizados con sus módulos')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.addEventListener('llavero:bootstrapped',function(){setTimeout(sync,80)},{once:true});
})();


/* ==== llaveroV86146Version ==== */

(function(){
  try{
    window.LLAVERO_BUILD='V86.146';
    document.documentElement.setAttribute('data-llavero-build','V86.146');
    document.documentElement.setAttribute('data-llavero-app-version','V86.146');
    document.documentElement.setAttribute('data-preview','V86.146');
    document.title=(document.title||'').replace(/V86\.\d+/g,'V86.146');
    var b=document.querySelector('.appVersionChip b');
    if(b)b.textContent=(b.textContent||'').replace(/V86\.\d+$/,'V86.146');
  }catch(_){ }
})();


/* ==== llaveroV86147Script ==== */

(function(){
'use strict';
var VERSION='V86.147', timer=0, guideTimer=0;
function s(v){return v==null?'':String(v).trim()}
function n(v){var x=Number(v);return Number.isFinite(x)?x:0}
function norm(v){var x=s(v).toUpperCase();try{return x.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(_){return x}}
function esc(v){return s(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c})}
function fi(v){try{return Math.round(n(v)).toLocaleString('es-CO')}catch(_){return String(Math.round(n(v)))}}
function curView(){try{return typeof VIEW!=='undefined'?VIEW:''}catch(_){return ''}}
function st(){try{return (typeof S!=='undefined'&&S&&S[CUR])||{}}catch(_){return {}}}
function product(code){try{return (typeof P!=='undefined'&&P&&P[code])||(typeof productInfo==='function'&&productInfo(code))||{n:code,cat:'—',lin:'—',sub:'—'}}catch(_){return {n:code,cat:'—',lin:'—',sub:'—'}}}
function image(code){try{return typeof imageThumb==='function'?imageThumb(code,'sm'):''}catch(_){return ''}}
function mark(){try{window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);document.documentElement.setAttribute('data-preview',VERSION);document.title='Llavero · Inventarios Jamar · 19/08/2026 · '+VERSION;var b=document.querySelector('.appVersionChip b');if(b)b.textContent='19/08/2026 · '+VERSION}catch(_){}}

/* ---------- Seguimiento: aclarar dimensiones y evitar desbordes ---------- */
function shrink(el,min){if(!el)return;el.style.fontSize='';var cs=getComputedStyle(el),size=parseFloat(cs.fontSize)||16,guard=0;while(el.scrollWidth>el.clientWidth+1&&size>(min||7.5)&&guard++<24){size-=.4;el.style.fontSize=size+'px'}}


function patchTracking(){
  var root=document.querySelector('.v128Tracking');if(!root)return;
  var cards=root.querySelector('.v8680TrackProducts');
  if(cards){
    Array.from(cards.children).forEach(function(c){if(!c.querySelector('.v147ProductUnit')){var u=document.createElement('span');u.className='v147ProductUnit';u.textContent='PRODUCTOS';c.appendChild(u)}});
    if(!root.querySelector('.v147TrackingLegend')){var lg=document.createElement('div');lg.className='v147TrackingLegend';lg.innerHTML='<span><b>Productos</b> · tarjetas superiores y estados</span><span><b>Unidades</b> · Vista por unidades</span><span><b>COP</b> · Vista por valor del inventario</span>';cards.parentNode.insertBefore(lg,cards)}
  }
  root.querySelectorAll('.v8680TrackProducts b').forEach(function(x){shrink(x,9)});
  root.querySelectorAll('.trackingMetric b').forEach(function(x){shrink(x,7.2)});
}

/* ---------- Detalles: identificar y limpiar filtros duplicados ---------- */
function titleFor(body){try{return norm(body&&body.id==='v80ModalBody'?(document.getElementById('v80ModalTitle')||{}).textContent:(document.getElementById('rangeModalTitle')||{}).textContent)}catch(_){return ''}}
function removeNodes(body,sel,except){if(!body)return;body.querySelectorAll(sel).forEach(function(x){if(except&&(x===except||x.contains(except)||except.contains(x)))return;x.remove()})}
function patchTrendDetail(){
  var body=document.getElementById('v80ModalBody');if(!body)return;var detail=body.querySelector('.v866TrendDetail');if(!detail)return;
  removeNodes(detail,'.v866QuickStrip,.v118UnifiedFilters,.v866ListFilters,.ux104Filters,.v869DetailSearch');
  var f=detail.querySelector('.v866Filters');if(f){f.classList.add('v147CanonicalFilters');var sl=f.querySelector('.v866Search>span');if(sl)sl.textContent='Búsqueda rápida';var clear=f.querySelector('.v866Clear');if(clear)clear.textContent='Limpiar filtros'}
}
function patchCendisDetail(){
  var body=document.getElementById('v80ModalBody');if(!body||!body.querySelector('.v867CendisTable'))return;
  /* El bloque duplicado solicitado se elimina por completo. */
  removeNodes(body,'.v118UnifiedFilters,.v866ListFilters,.v869DetailSearch,.ux104Filters,.v8698ClassFilters,.v8664DetailTools,.v108HierarchyFilters');
}
function patchCompositionDetail(){
  var body=document.getElementById('rangeModalBody');if(!body||!body.querySelector('#v8664MixTable'))return;
  var keep=body.querySelector('.v8664DetailTools');
  removeNodes(body,'.v118UnifiedFilters,.v869DetailSearch,.ux104Filters,.v8698ClassFilters,.v866ListFilters,.v8664MixFilters,.v108HierarchyFilters',keep);
  if(keep){keep.classList.add('v147CanonicalFilters');var q=keep.querySelector('input');if(q)q.placeholder='Código, producto, categoría, línea o sublínea...'}
}
function patchMarkdownDetail(){
  var body=document.getElementById('rangeModalBody');if(!body)return;var t=titleFor(body);var keep=body.querySelector('.v8695MdFilters')||body.querySelector('.v8692MdDetailFilters');
  if(!keep||!(/MARKDOWN|DESCUENTO|POLITICA|OFERTA|GESTIONAR|CUMPLE|SUPERA/.test(t)))return;
  removeNodes(body,'.v118UnifiedFilters,.v869DetailSearch,.ux104Filters,.v8698ClassFilters,.v866ListFilters,.v8664DetailTools,.v866Filters,.v80Filters,.v108HierarchyFilters',keep);
  keep.classList.add('v147CanonicalFilters');
  if(keep.classList.contains('v8695MdFilters')){
    var q=keep.querySelector('input');if(q)q.placeholder='Código, producto, categoría o política...';
    if(!keep.querySelector('.v147MdClear')){var b=document.createElement('button');b.type='button';b.className='v145MdClear v147MdClear';b.textContent='Limpiar filtros';b.onclick=function(){keep.querySelectorAll('input').forEach(function(x){x.value='';x.dispatchEvent(new Event('input',{bubbles:true}))});keep.querySelectorAll('select').forEach(function(x){x.selectedIndex=0;x.dispatchEvent(new Event('change',{bubbles:true}))})};keep.appendChild(b)}
  }
}
function patchOpenDetails(){patchTrendDetail();patchCendisDetail();patchCompositionDetail();patchMarkdownDetail();patchGuideDetail()}

/* ---------- Ambientes: restaurar Impacto potencial con cálculo real ---------- */
function cendisGuide(p){var code=s(p&&p[0]),x=n(p&&p[4]);try{x=Math.max(x,n(P&&P[code]&&P[code].dispCendis))}catch(_){};try{var q=typeof productInfo==='function'?productInfo(code):null;x=Math.max(x,n(q&&q.dispCendis))}catch(_){};return x}
function ambientImpact(type){
  var rows=[],products=new Set();(Array.isArray(st().guias)?st().guias:[]).forEach(function(g){
    var total=n(g&&g[3]),current=n(g&&g[4]),ps=(Array.isArray(g&&g[6])?g[6]:[]).filter(function(p){return !!(p&&p[10])});
    var targets=ps.filter(function(p){var status=s(p&&p[5]);if(type==='camino')return status==='camino';if(type==='requested')return status==='requested'||status==='requested_nostock';if(type==='available')return status==='available'&&cendisGuide(p)>0;return false});
    if(!targets.length)return;targets.forEach(function(p){products.add(s(p&&p[0]))});var projected=Math.min(total,current+targets.length);
    rows.push({code:s(g&&g[0]),name:s(g&&g[1]),cat:s(g&&g[2]),total:total,current:current,projected:projected,targets:targets,complete:current<total&&projected>=total,advance:current<total&&projected>current&&projected<total});
  });
  return {rows:rows,products:products.size,positions:rows.reduce(function(a,g){return a+g.targets.length},0),complete:rows.filter(function(g){return g.complete}).length,advance:rows.filter(function(g){return g.advance}).length};
}
function impactCard(type,label){var x=ambientImpact(type);return '<div class="v145ImpactGroup"><div class="v145ImpactHead"><b>'+esc(label)+'</b><span>'+fi(x.products)+' productos · '+fi(x.positions)+' posiciones</span></div><div class="v145ImpactChoices"><button type="button" data-v147-impact="'+type+'" data-v147-result="complete"><strong>'+fi(x.complete)+'</strong><span>Completan</span></button><button type="button" data-v147-impact="'+type+'" data-v147-result="advance"><strong>'+fi(x.advance)+'</strong><span>Avanzan</span></button></div></div>'}
function patchAmbientMain(){
  if(curView()!=='amb')return;var root=document.getElementById('content');if(!root)return;
  /* Mantener la limpieza funcional existente de barras repetidas. */
  var legacy=root.querySelector('#q-guias');if(legacy){var tb=legacy.closest('.tbar');if(tb)tb.remove();else legacy.remove()}
  root.querySelectorAll('.guideNativeToolbar,.guideUnifiedToolbar,.v134CanonicalFilters[data-module="ambientes"],.v135AmbientFilters,.v132ModuleFilters[data-v132-module="ambientes"],.v133CanonicalFilters[data-module="ambientes"]').forEach(function(x){x.remove()});
  if(typeof window.renderAmbientImpact155==='function')window.renderAmbientImpact155();
}
function rangeOpen(title,sub,html){var m=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle');if(!m||!body)return;if(tt)tt.textContent=title;if(ss)ss.textContent=sub||'';body.innerHTML=html;m.classList.add('on');document.body.style.overflow='hidden'}
function typeLabel(t){return t==='camino'?'Productos en traslado':t==='requested'?'Productos solicitados':'Puedes solicitar'}
function openAmbientImpact(type,result){
  var x=ambientImpact(type),list=x.rows.filter(function(g){return result==='complete'?g.complete:g.advance}),trs=[];
  list.forEach(function(g){g.targets.forEach(function(pp){var code=s(pp&&pp[0]),p=product(code),floor=s(pp&&pp[1])||'—',cd=cendisGuide(pp),now=g.total?g.current/g.total*100:0,projected=g.total?g.projected/g.total*100:0;trs.push('<tr><td><div class="v147GuideCell"><div class="v147CellTitle">'+esc(g.name)+'</div><div class="v147CellMeta">'+esc(g.code)+' · '+esc(g.cat)+'</div><button class="v147CellLink" type="button" data-v147-guide="'+esc(g.code)+'">Ver guía →</button></div></td><td>'+esc(floor)+'</td><td>'+image(code)+'</td><td><span class="code">'+esc(code)+'</span></td><td><div class="v147ProductCell"><div class="v147CellTitle">'+esc(p.n||code)+'</div><div class="v147CellMeta">'+esc([p.cat,p.lin,p.sub].filter(Boolean).join(' · '))+'</div><button class="v147CellLink" type="button" data-v147-product="'+esc(code)+'">Ver producto →</button></div></td><td class="num">'+fi(cd)+' u</td><td class="num">'+now.toFixed(1)+'%</td><td class="num"><b>'+projected.toFixed(1)+'%</b></td></tr>')})});
  var uniq=new Set();list.forEach(function(g){g.targets.forEach(function(p){uniq.add(s(p&&p[0]))})});
  rangeOpen(typeLabel(type)+' · '+(result==='complete'?'Ambientes que completarían':'Ambientes que avanzarían'),(st().name||CUR)+' · '+fi(list.length)+' ambientes · '+fi(trs.length)+' posiciones','<div class="v127DetailSummary"><div><label>Ambientes</label><b>'+fi(list.length)+'</b></div><div><label>Productos</label><b>'+fi(uniq.size)+'</b></div><div><label>Posiciones</label><b>'+fi(trs.length)+'</b></div></div><div class="v127TableWrap"><table class="v127Table"><thead><tr><th>Ambiente / guía</th><th>Piso</th><th>Imagen</th><th>Código</th><th>Producto</th><th class="num">CENDIS</th><th class="num">Cobertura actual</th><th class="num">Proyectada</th></tr></thead><tbody>'+(trs.join('')||'<tr><td colspan="8"><div class="empty">No hay registros para este detalle.</div></td></tr>')+'</tbody></table></div>');
}
window.openGuideImpact147=openAmbientImpact;

/* ---------- Detalle Ambiente/Guía: limpio, mismos campos, un filtro ---------- */
function guideRender(){try{if(typeof window.renderGuideDetailV49==='function')window.renderGuideDetailV49();else if(typeof renderGuideDetailV49==='function')renderGuideDetailV49()}catch(_){}}
function makeGuideFilter(body){
  var d;try{d=(state.guias&&state.guias.detail)||{floor:'all',status:'all',q:''}}catch(_){d={floor:'all',status:'all',q:''}};
  var bar=document.createElement('div');bar.className='v145GuideFilters v147CanonicalFilters';bar.innerHTML='<div><label>Búsqueda rápida</label><input type="search" data-v147-g="q" placeholder="Producto, código o estado..." value="'+esc(d.q||'')+'"></div><div><label>Piso</label><select data-v147-g="floor"><option value="all">Todos los pisos</option><option value="1">Piso 1</option><option value="2">Piso 2</option><option value="3">Piso 3</option></select></div><div><label>Estado / gestión</label><select data-v147-g="status"><option value="all">Todos</option><option value="covered">Cubiertos</option><option value="pending">Pendientes</option><option value="camino">En traslado</option><option value="requested">Solicitud realizada</option><option value="available">Puedes solicitar</option></select></div><div><label>Acción</label><button type="button" data-v147-g-clear>Limpiar filtros</button></div>';
  bar.querySelector('[data-v147-g="floor"]').value=d.floor||'all';bar.querySelector('[data-v147-g="status"]').value=d.status||'all';
  var qtimer=0;bar.addEventListener('input',function(e){if(e.target.dataset.v147G!=='q')return;clearTimeout(qtimer);qtimer=setTimeout(function(){try{state.guias.detail.q=e.target.value;guideRender()}catch(_){}},70)});bar.addEventListener('change',function(e){var k=e.target.dataset.v147G;if(!k||k==='q')return;try{state.guias.detail[k]=e.target.value;guideRender()}catch(_){}});bar.querySelector('[data-v147-g-clear]').onclick=function(){try{state.guias.detail={floor:'all',status:'all',q:''};guideRender()}catch(_){}};
  return bar;
}
function patchGuideDetail(){
  var body=document.getElementById('guideDetailBodyV49');if(!body||!body.closest('#guideDetailModalBackV49.on'))return;body.classList.add('v147GuideClean');
  var keep=body.querySelector('.v145GuideFilters');
  removeNodes(body,'.guideModalToolbarV48,.v108HierarchyFilters,.ux104Filters,.v118UnifiedFilters,.guideFilterBarV48',keep);
  if(!keep){keep=makeGuideFilter(body);var sales=body.querySelector('.guideSalesSummaryV50'),stats=body.querySelector('.guideModalStatsV48');if(sales)sales.insertAdjacentElement('afterend',keep);else if(stats)stats.insertAdjacentElement('afterend',keep);else body.insertBefore(keep,body.firstChild)}
  keep.classList.add('v147CanonicalFilters');
  var sales2=body.querySelector('.guideSalesSummaryV50');if(sales2&&keep.previousElementSibling!==sales2)sales2.insertAdjacentElement('afterend',keep);
}

/* ---------- Traslados: solo órdenes Por entregar ---------- */
function trStatus(r){var e=norm(r&&r.estatus);if(e.indexOf('ENTREG')>=0)return'Entregado';if(e.indexOf('PICK')>=0)return'En picking';if(e.indexOf('RUTA')>=0)return'En ruta';if(e.indexOf('PEND')>=0)return'Pendiente';var p=norm(r&&r.statusGlobalPicking),m=norm(r&&r.statusMovimiento),w=norm(r&&r.lugarPuestaDispos);if(p==='C'&&m==='C')return'Entregado';if(p==='C'&&m==='A')return'En ruta';if(p==='A'&&m==='A'&&w.indexOf('WMS')>=0)return'En picking';return'Pendiente'}
function pendingRows(){return (Array.isArray(st().trDetalle)?st().trDetalle:[]).filter(function(r){return trStatus(r)==='Pendiente'})}
function conditions(){var rot=new Set(),evac=new Set();try{(typeof aggregateModuleProducts71==='function'?aggregateModuleProducts71('rot',st()):[]).forEach(function(r){rot.add(s(r.c))});(typeof aggregateModuleProducts71==='function'?aggregateModuleProducts71('evac',st()):[]).forEach(function(r){evac.add(s(r.c))})}catch(_){}return{rot:rot,evac:evac}}
function guideNames(code){var out=[];(Array.isArray(st().guias)?st().guias:[]).forEach(function(g){var ps=Array.isArray(g&&g[6])?g[6]:[];if(ps.some(function(p){return s(p&&p[0])===s(code)&&s(p&&p[5])==='camino'}))out.push({code:s(g&&g[0]),name:s(g&&g[1])})});return out}
function transferImpact(){var c=conditions(),map={};pendingRows().forEach(function(r){var code=s(r.codigo),gs=guideNames(code),rot=c.rot.has(code),evac=c.evac.has(code),amb=gs.length>0;if(!(rot||evac||amb))return;var o=map[code]||(map[code]={code:code,name:s(r.nombre)||product(code).n||code,orders:new Set(),statuses:new Set(),units:0,rot:rot,evac:evac,guides:gs});o.orders.add(s(r.entrega||'Sin identificar'));o.statuses.add(trStatus(r));o.units+=n(r.unidades)});return Object.values(map).sort(function(a,b){return b.units-a.units||a.name.localeCompare(b.name,'es')})}
function openTransferImpact(){var rows=transferImpact(),rc=rows.filter(function(r){return r.rot}).length,ec=rows.filter(function(r){return r.evac}).length,ac=rows.filter(function(r){return r.guides.length}).length,trs=rows.map(function(r){var p=product(r.code),impact=[r.rot?'Rotación':'',r.evac?'Evacuación':'',r.guides.length?'Ambientes':''].filter(Boolean).join(' · '),env=r.guides.length?r.guides.map(function(g){return'<span><b>'+esc(g.name)+'</b><small>'+esc(g.code)+'</small></span>'}).join(''):'<span>—</span>';return'<tr class="v147TransferRow" data-v147-transfer="'+esc(r.code)+'"><td>'+image(r.code)+'</td><td><span class="code">'+esc(r.code)+'</span></td><td><b>'+esc(r.name)+'</b><small>'+esc([p.cat,p.lin,p.sub].filter(Boolean).join(' · '))+'</small></td><td>'+esc(impact)+'</td><td><div class="v145Env">'+env+'</div></td><td class="v145Orders">'+esc(Array.from(r.orders).join(' · '))+'</td><td>'+esc(Array.from(r.statuses).join(' / '))+'</td><td class="num"><b>'+fi(r.units)+'</b></td></tr>'}).join('');rangeOpen('Productos con impacto por entregar',(st().name||CUR)+' · solo órdenes POR ENTREGAR (se excluyen todas las entregadas)','<div class="v147TransferImpact"><div class="v127DetailSummary"><div><label>Productos únicos</label><b>'+fi(rows.length)+'</b></div><div><label>Rotación</label><b>'+fi(rc)+'</b></div><div><label>Evacuación</label><b>'+fi(ec)+'</b></div><div><label>Ambientes</label><b>'+fi(ac)+'</b></div></div><div class="v127TableWrap"><table class="v127Table"><thead><tr><th>Imagen</th><th>Código</th><th>Producto</th><th>Impacto</th><th>Ambiente / guía</th><th>Orden(es) por entregar</th><th>Estado</th><th class="num">Uds. pendientes</th></tr></thead><tbody>'+trs+'</tbody></table></div></div>')}
window.openTransferImpact127=openTransferImpact;
function patchTransferCard(){if(curView()!=='traslados')return;var root=document.getElementById('content');if(!root)return;var rows=transferImpact(),rc=rows.filter(function(r){return r.rot}).length,ec=rows.filter(function(r){return r.evac}).length,ac=rows.filter(function(r){return r.guides.length}).length;root.querySelectorAll('.transferMetricCard8616,.v80TransferKpi,.transferKpi8615').forEach(function(card){var lab=card.querySelector('.transferMetricLabel8616,label,.lab'),txt=norm(lab?lab.textContent:card.textContent);if(txt.indexOf('PRODUCTOS CON IMPACTO')<0&&txt.indexOf('PRODUCTOS CRITICOS')<0)return;if(lab)lab.textContent='Productos con impacto por entregar';var val=card.querySelector('strong,b,.val');if(val)val.textContent=fi(rows.length);var sub=card.querySelector('small,.sub');if(sub)sub.textContent=fi(rc)+' Rotación · '+fi(ec)+' Evacuación · '+fi(ac)+' Ambientes';card.onclick=function(e){if(e){e.preventDefault();e.stopPropagation()}openTransferImpact()};card.style.cursor='pointer'})}

/* ---------- Acciones delegadas de detalle ---------- */
function closeRangeSafe(){try{if(typeof closeRangeModal==='function')closeRangeModal();else{var m=document.getElementById('rangeModal');if(m)m.classList.remove('on')}}catch(_){}}
document.addEventListener('click',function(e){
  var g=e.target&&e.target.closest?e.target.closest('[data-v147-guide]'):null;if(g){e.preventDefault();e.stopPropagation();var c=g.dataset.v147Guide;closeRangeSafe();setTimeout(function(){try{if(typeof window.openGuideDetailV49==='function')window.openGuideDetailV49(c);else if(typeof window.openGuideDetailV48==='function')window.openGuideDetailV48(c)}catch(_){}},50);return}
  var p=e.target&&e.target.closest?e.target.closest('[data-v147-product]'):null;if(p){e.preventDefault();e.stopPropagation();var code=p.dataset.v147Product;closeRangeSafe();setTimeout(function(){try{if(typeof window.openBestProductDetail==='function')window.openBestProductDetail(code);else if(typeof window.openInventoryProduct==='function')window.openInventoryProduct(code);else if(typeof window.openProductFromSales==='function')window.openProductFromSales(code)}catch(_){}},50);return}
  if(e.target&&e.target.closest&&e.target.closest('button,[role="button"],tbody tr,[onclick]')){setTimeout(patchOpenDetails,25);setTimeout(function(){patchOpenDetails();patchTracking();mark()},150)}
},true);

/* ---------- Programación ligera, sin observador global nuevo ---------- */
function patchAll(){mark();patchTracking();patchAmbientMain();patchTransferCard();patchOpenDetails()}
function wrap(name){var fn=window[name];if(typeof fn!=='function'||fn.__v147)return;var w=function(){var out=fn.apply(this,arguments);setTimeout(patchAll,25);setTimeout(patchAll,160);return out};w.__v147=true;window[name]=w;try{if(name==='setView')setView=w;else if(name==='refresh')refresh=w;else if(name==='drawGuias')drawGuias=w;else if(name==='drawTr8615')drawTr8615=w}catch(_){}}
function wrapModal(name,fnPatch){var fn=window[name];if(typeof fn!=='function'||fn.__v147)return;var w=function(){var out=fn.apply(this,arguments);setTimeout(fnPatch,10);setTimeout(fnPatch,120);return out};w.__v147=true;window[name]=w;try{if(name==='openTrendDetail80')openTrendDetail80=w;else if(name==='openTrendDetail79')openTrendDetail79=w}catch(_){}}
function install(){
  if(window.__llaveroV86147Installed)return;
  window.__llaveroV86147Installed=true;
  mark();wrap('setView');wrap('refresh');wrap('drawGuias');wrap('drawTr8615');
  wrapModal('openTrendDetail80',patchTrendDetail);wrapModal('openTrendDetail79',patchTrendDetail);wrapModal('openCendisModule868',patchCendisDetail);wrapModal('openComposition8664',patchCompositionDetail);wrapModal('openGuideDetailV49',patchGuideDetail);wrapModal('renderGuideDetailV49',patchGuideDetail);
  if(window.V8695&&typeof window.V8695.status==='function'&&!window.V8695.status.__v147){var os=window.V8695.status;var ws=function(){var out=os.apply(this,arguments);setTimeout(patchMarkdownDetail,10);setTimeout(patchMarkdownDetail,130);return out};ws.__v147=true;window.V8695.status=ws}
  document.addEventListener('change',function(e){if(e.target&&e.target.id==='store')setTimeout(patchAll,100)},true);
  window.addEventListener('resize',function(){clearTimeout(timer);timer=setTimeout(patchTracking,80)});
  setTimeout(patchAll,40);setTimeout(patchAll,350);setTimeout(mark,800);setTimeout(mark,1600);
  console.info('LLAVERO V86.147 · consolidación completa de filtros, tablas, Ambientes, Traslados y detalles');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,80)},{once:true});
window.addEventListener('llavero:view-stable',function(){setTimeout(patchAll,45);[220,520,1150,2550].forEach(function(ms){setTimeout(mark,ms)})});
})();


/* ==== llaveroV86148Script ==== */

(function(){
'use strict';
if(window.__LLAVERO_V86148__)return;
window.__LLAVERO_V86148__=true;
var VERSION='V86.155', activeGuide='', guideFilter={q:'',floor:'all',status:'all'}, debounce=0;
function s(v){return v==null?'':String(v)}
function n(v){var x=Number(v);return Number.isFinite(x)?x:0}
function norm(v){var z=s(v).trim().toUpperCase();try{z=z.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(_){}return z.replace(/\s+/g,' ')}
function esc(v){return s(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c})}
function fi(v){try{return typeof fInt==='function'?fInt(n(v)):Math.round(n(v)).toLocaleString('es-CO')}catch(_){return String(Math.round(n(v)))}}
function currentView(){try{return typeof VIEW!=='undefined'?VIEW:''}catch(_){return''}}
function st(){try{return (typeof S!=='undefined'&&S&&S[CUR])?S[CUR]:{}}catch(_){return{}}}
function prod(code){try{return (typeof P!=='undefined'&&P&&P[s(code)])?P[s(code)]:((typeof productInfo==='function'&&productInfo(s(code)))||{})}catch(_){return{}}}
function actualCovered(p){
  var code=s(p&&p[0]), x=s(p&&p[5]);
  /* V86.149: la existencia real de tienda tiene prioridad sobre SEUS. */
  try{
    var store=st(), inv=Array.isArray(store&&store.inventario)?store.inventario:[];
    var row=inv.find(function(r){return s(r&&r.codigo)===code || s(r&&r.codigoSap).replace(/^0+/,'')===code;});
    if(row && n(row.stock)>0) return true;
  }catch(_){}
  return x==='ok'||x==='ok_requested'||x==='ok_inv';
}
function cendisOf(p){var code=s(p&&p[0]),x=n(p&&p[4]);try{x=Math.max(x,n(prod(code).dispCendis))}catch(_){}return x}
function isDining(info){var line=norm(info&&info.lin),sub=norm(info&&info.sub);return line==='COMEDORES'||sub.indexOf('COMEDOR ')===0}
function normalizeFamilyVariant(v){
  var z=norm(v);
  /* Variantes de configuración que no deben romper equivalencia Piso 1. */
  z=z.replace(/\b(1|2|3|4|5|6|8|10|12)\s*(PTOS|PUESTOS|PUESTO|P|PLZ|PLAZAS)\b/g,' ');
  z=z.replace(/\b(DERECHA|IZQUIERDA|DER|IZQ|R|L)\b/g,' ');
  z=z.replace(/\b(MEDIDA|TAMANO|TAMAÑO)\b/g,' ');
  return z.replace(/\s+/g,' ').trim();
}
function groupKeyP1(p){
  var code=s(p&&p[0]),info=prod(code),fam=normalizeFamilyVariant(info.familia||info.n),line=norm(info.lin),sub=norm(info.sub);
  /* Piso 1: solo entre codigos de la misma guia. */
  if(!fam||!line)return 'CODE|'+code;
  if(isDining(info))return 'DIN|'+fam+'|'+line;
  /* Piso 1 permite variantes del mismo producto (puestos, orientacion, configuracion). */
  return 'STD|'+fam+'|'+line;
}
function statusPriority(members){
  var sts=members.map(function(p){return s(p&&p[5])});
  if(sts.indexOf('camino')>=0)return'camino';
  if(sts.indexOf('requested')>=0||sts.indexOf('requested_nostock')>=0)return'requested';
  if(sts.some(function(x,i){return x==='available'&&cendisOf(members[i])>0}))return'available';
  if(sts.indexOf('nd')>=0)return'nd';
  return'sin';
}
function guideEffective(g){
  if(!g)return null;
  var ps=Array.isArray(g[6])?g[6]:[],p1=ps.filter(function(p){return !!(p&&p[10])&&s(p[1])==='1'}),p2=ps.filter(function(p){return !!(p&&p[10])&&s(p[1])==='2'}),groups={},codeInfo={};
  p1.forEach(function(p){var k=groupKeyP1(p);(groups[k]||(groups[k]=[])).push(p)});
  var garr=Object.keys(groups).map(function(k){var members=groups[k],covered=members.some(actualCovered),state=covered?'covered':statusPriority(members);return {key:k,members:members,covered:covered,state:state}});
  /* V86.152: Piso 2 aplica equivalencia por Línea + Sublínea dentro de la misma guía. */
  var p2Groups={};
  p2.forEach(function(p){
    var code=s(p&&p[0]),info=prod(code),line=norm(info.lin),sub=norm(info.sub);
    var key=(line&&sub)?'P2|'+line+'|'+sub:'CODE|'+code;
    (p2Groups[key]||(p2Groups[key]=[])).push(p);
  });
  var p2arr=Object.keys(p2Groups).map(function(k){
    var members=p2Groups[k],covered=members.some(actualCovered),state=covered?'covered':statusPriority(members);
    return {key:k,members:members,covered:covered,state:state};
  });
  var p1Covered=garr.filter(function(x){return x.covered}).length,p1Total=garr.length,p2Covered=p2arr.filter(function(x){return x.covered}).length,p2Total=p2arr.length;
  garr.forEach(function(gr){gr.members.forEach(function(p){var code=s(p[0]),act=actualCovered(p);codeInfo[code]={floor:'1',actual:act,effective:gr.covered,equivalent:gr.covered&&!act,group:gr.key,state:gr.covered?'covered':gr.state,members:gr.members.map(function(x){return s(x[0])})}})});
  p2arr.forEach(function(gr){gr.members.forEach(function(p){var code=s(p[0]),act=actualCovered(p);codeInfo[code]={floor:'2',actual:act,effective:gr.covered,equivalent:gr.covered&&!act,group:gr.key,state:gr.covered?'covered':gr.state,members:gr.members.map(function(x){return s(x[0])})}})});
  var requirements=garr.map(function(gr){return {floor:'1',key:gr.key,members:gr.members,covered:gr.covered,state:gr.state}}).concat(p2arr.map(function(gr){return {floor:'2',key:gr.key,members:gr.members,covered:gr.covered,state:gr.state}}));
  return {code:s(g[0]),name:s(g[1]),cat:s(g[2]),products:ps,groupsP1:garr,requirements:requirements,codeInfo:codeInfo,p1Total:p1Total,p1Covered:p1Covered,p2Total:p2Total,p2Covered:p2Covered,total:p1Total+p2Total,current:p1Covered+p2Covered,pp:[p1Covered,p1Total,p2Covered,p2Total,n(g[5]&&g[5][4]),n(g[5]&&g[5][5])]};
}

/* V86.152: auditoria temporal de equivalencias Piso 1 */
window.LLAVERO_EQUIV_AUDIT_V86_150=true;
function applyGuideRules(store){
  store=store||st();if(!store||!Array.isArray(store.guias))return;
  var agg={nG:store.guias.length,gCompletas:0,gIncompletas:0,compTotalPct:0,reqTotal:0,haveTotal:0,faltTot:0,faltRequested:0,faltAvailable:0,faltSin:0,faltCamino:0,noRastr:0,invCover:0,p3Total:0,p3Have:0};
  store.guias.forEach(function(g){
    var e=guideEffective(g);if(!e)return;g.__v148=e;g[3]=e.total;g[4]=e.current;g[5]=e.pp;
    agg.reqTotal+=e.total;agg.haveTotal+=e.current;if(e.total&&e.current>=e.total)agg.gCompletas++;else if(e.total)agg.gIncompletas++;
    e.requirements.forEach(function(r){if(r.covered){if(r.members.some(function(p){return s(p[5])==='ok_inv'}))agg.invCover++;return;}if(r.state==='camino')agg.faltCamino++;else if(r.state==='requested')agg.faltRequested++;else if(r.state==='available')agg.faltAvailable++;else{agg.faltSin++;if(r.state==='nd')agg.noRastr++;}});
    agg.p3Total+=n(g[5]&&g[5][5]);agg.p3Have+=n(g[5]&&g[5][4]);
  });
  agg.faltTot=Math.max(0,agg.reqTotal-agg.haveTotal);agg.compTotalPct=agg.reqTotal?Math.round(1000*agg.haveTotal/agg.reqTotal)/10:0;
  store.amb=Object.assign({},store.amb||{},agg);store.kpi=store.kpi||{};store.kpi.guiaComp=agg.compTotalPct;store.kpi.guiaFalt=agg.faltTot;store.kpi.guiaCompletas=agg.gCompletas;
}
function ensureGuideRules(){
  var store=st();if(!Array.isArray(store.guias)||!store.guias.length){try{if(typeof window.llaveroRebuildAllGuideData==='function')window.llaveroRebuildAllGuideData()}catch(_){}}
  applyGuideRules(st());
}

/* Próximos a rotar = subgrupo sano 61–90; Norte debe quedar en 63 con el corte actual. */
function syncUpcoming(){
  try{
    var rows=typeof window.upcomingRotationRows==='function'?window.upcomingRotationRows(st()):[],count=rows.length,side=document.getElementById('nc-prox');if(side)side.textContent=fi(count);
    if(currentView()==='prox')document.querySelectorAll('#content .inventoryKpi,#content .kpi,#content .mk').forEach(function(card){var lab=card.querySelector('.ikLabel,.lab,.l'),val=card.querySelector('.ikValue,.val,.v');if(!lab||!val)return;var t=norm(lab.textContent);if(t==='PRODUCTOS PROXIMOS'||t==='PRODUCTOS PROXIMOS A ROTAR'||t==='PROXIMOS A ROTAR')val.textContent=fi(count)});
  }catch(_){ }
}

/* Tabla estilo referencia + zonas de código/producto. */
function decorateTables(root){
  (root||document).querySelectorAll('table').forEach(function(table){
    var hr=table.tHead&&table.tHead.rows&&table.tHead.rows[0];if(!hr)return;
    table.classList.add('llvTable');if(table.closest('#markdown-table-8618')||table.classList.contains('v8623MarkdownTable'))table.classList.add('llvMarkdownTable');
    var shell=table.closest('.twrap,.v127TableWrap,.v80TableWrap,.trackingTableWrap,.salesRankingWrap,.guideFloorTableWrapV50,.guideDetailTableWrapV49,.guideModalTableWrapV48,.v118ProxDetailWrap,.transferTableWrap,.guideDetailWrap,.guideModalTableWrapV48');if(shell)shell.classList.add('llvTableShell');
    var heads=Array.from(hr.cells).map(function(th){return norm(th.textContent)}),cols=heads.length;
    table.style.setProperty('--llv-min-width',cols<=4?'100%':cols<=7?'820px':cols<=10?'1080px':'1380px');
    function kind(h){
      if(/IMAGEN|FOTO/.test(h))return'image';
      if(h==='CODIGO'||h==='CÓDIGO')return'code';
      if(h==='PRODUCTO'||h==='NOMBRE'||h==='NOMBRE PRODUCTO'||h.indexOf('PRODUCTO /')===0)return'product';
      if(/CLASIFICACION|CLASIFICACIÓN|CORE|COMPLEMENTO/.test(h))return'class';
      if(/ANTIGUEDAD|RANGO/.test(h))return'age';
      if(/ESTADO|CONDICION|CONDICIÓN|POLITICA|POLÍTICA|REGLA/.test(h))return'status';
      if(/ACCION|ACCIÓN/.test(h))return'action';
      if(/^(UDS|UDS\.|UNIDADES|STOCK|CENDIS|VALOR|VENTA|VENTA 3M|%|COBERTURA|PROYECTADA|BRECHA|DESCUENTO|PRECIO|POSICIONES|PRODUCTOS|ORDENES|ÓRDENES|CANTIDAD)/.test(h))return'num';
      return'';
    }
    var kinds=heads.map(kind);
    Array.from(hr.cells).forEach(function(th,i){var k=kinds[i];if(k)th.classList.add('llv-col-'+k);if(k==='num'||th.classList.contains('num'))th.classList.add('num');});
    Array.from(table.tBodies||[]).forEach(function(tb){Array.from(tb.rows).forEach(function(tr){Array.from(tr.cells).forEach(function(td,i){var k=kinds[i];if(k)td.classList.add('llv-col-'+k);if(k==='num'||(hr.cells[i]&&hr.cells[i].classList.contains('num')))td.classList.add('num');});});});
    table.dataset.v148Decorated='1';table.dataset.v148Rows=String(table.rows.length);
  });
}
var v155TableObserver=null,v155TableFrame=0;
function observeTables155(){
  if(v155TableObserver)return;var roots=['content','rangeModalBody','v80ModalBody','guideDetailBodyV49'].map(function(id){return document.getElementById(id)}).filter(Boolean);if(!roots.length)return;
  v155TableObserver=new MutationObserver(function(list){var found=list.some(function(m){return Array.from(m.addedNodes||[]).some(function(n){return n&&n.nodeType===1&&(n.matches&&n.matches('table')||n.querySelector&&n.querySelector('table'));});});if(!found)return;if(v155TableFrame)cancelAnimationFrame(v155TableFrame);v155TableFrame=requestAnimationFrame(function(){v155TableFrame=0;roots.forEach(function(r){decorateTables(r)});});});
  roots.forEach(function(r){v155TableObserver.observe(r,{childList:true,subtree:true});});
}

/* Filtro CENDIS: uno solo, con búsqueda, clasificación y antigüedad. */
function rowClass148(tr){var x=norm(tr.dataset.class||'');if(x.indexOf('COMPLEMENT')>=0)return'COMPLEMENTO';if(x==='CORE'||x.indexOf(' CORE')>=0)return'CORE';return'SIN CLASIFICACION'}
function patchCendisFilters(){
  var body=document.getElementById('v80ModalBody');if(!body)return;var table=body.querySelector('.v867CendisTable');if(!table)return;
  body.querySelectorAll('.v866ListFilters,.v118UnifiedFilters,.v869DetailSearch,.ux104Filters,.v8698ClassFilters,.v8664DetailTools,.v108HierarchyFilters,.v147CanonicalFilters:not(.v148CendisFilters)').forEach(function(x){x.remove()});
  var wrap=table.closest('.v80TableWrap,.twrap')||table,bar=body.querySelector('.v148CendisFilters');
  if(!bar){
    bar=document.createElement('div');bar.className='v148CendisFilters';bar.innerHTML='<div class="v148FilterField"><label>Búsqueda rápida</label><input type="search" data-v148-cf="q" placeholder="Código o producto..."></div><div class="v148FilterField"><label>Clasificación</label><select data-v148-cf="class"><option value="all">Todos</option><option value="CORE">CORE</option><option value="COMPLEMENTO">COMPLEMENTO</option><option value="SIN CLASIFICACION">Sin clasificación</option></select></div><div class="v148FilterField"><label>Antigüedad</label><select data-v148-cf="age"><option value="all">Todos</option><option value="91-120">91–120</option><option value="121-150">121–150</option><option value="151-180">151–180</option><option value="181-210">181–210</option><option value="211-240">211–240</option><option value="241-360">241–360</option><option value="+360">+360</option><option value="sin">Sin rango</option></select></div><div class="v148FilterField"><label>Acción</label><button type="button" data-v148-cf-clear>Limpiar filtros</button></div><span class="v148FilterCount"></span>';
    wrap.parentNode.insertBefore(bar,wrap);
    function apply(){var q=norm((bar.querySelector('[data-v148-cf="q"]')||{}).value),cl=(bar.querySelector('[data-v148-cf="class"]')||{}).value||'all',age=(bar.querySelector('[data-v148-cf="age"]')||{}).value||'all',rows=Array.from(table.querySelectorAll('tbody tr')).filter(function(r){return !r.querySelector('.empty')}),shown=0;rows.forEach(function(r){var txt=norm(r.textContent),ok=(!q||txt.indexOf(q)>=0)&&(cl==='all'||rowClass148(r)===cl);if(ok&&age!=='all'){var ranges=txt.replace(/[–—]/g,'-');ok=age==='sin'?ranges.indexOf('SIN RANGO')>=0:ranges.indexOf(age)>=0}r.style.display=ok?'':'none';if(ok)shown++});bar.querySelector('.v148FilterCount').textContent=fi(shown)+' de '+fi(rows.length)+' productos'}
    bar.addEventListener('input',function(){clearTimeout(debounce);debounce=setTimeout(apply,60)});bar.addEventListener('change',apply);bar.querySelector('[data-v148-cf-clear]').onclick=function(){bar.querySelectorAll('input').forEach(function(x){x.value=''});bar.querySelectorAll('select').forEach(function(x){x.value='all'});apply()};bar.__v148Apply=apply;
  }
  if(bar.__v148Apply)bar.__v148Apply();decorateTables(body);
}

/* Limpieza de filtros duplicados en detalles ya definidos por el sistema. */
function patchCanonicalDetails(){
  var rb=document.getElementById('rangeModalBody');if(rb){
    if(rb.querySelector('#v8664MixTable')){var keep=rb.querySelector('.v8664DetailTools');rb.querySelectorAll('.v118UnifiedFilters,.v869DetailSearch,.ux104Filters,.v8698ClassFilters,.v866ListFilters,.v8664MixFilters,.v108HierarchyFilters').forEach(function(x){if(x!==keep&&!x.contains(keep))x.remove()})}
    var md=rb.querySelector('.v8695MdFilters,.v8692MdDetailFilters');if(md){rb.querySelectorAll('.v118UnifiedFilters,.v869DetailSearch,.ux104Filters,.v8698ClassFilters,.v866ListFilters,.v8664DetailTools,.v866Filters,.v80Filters,.v108HierarchyFilters').forEach(function(x){if(x!==md&&!x.contains(md))x.remove()})}
    decorateTables(rb);
  }
  var vb=document.getElementById('v80ModalBody');if(vb){
    var trend=vb.querySelector('.v866TrendDetail');if(trend){var keepT=trend.querySelector('.v866Filters');trend.querySelectorAll('.v866QuickStrip,.v118UnifiedFilters,.v866ListFilters,.ux104Filters,.v869DetailSearch').forEach(function(x){if(x!==keepT&&!x.contains(keepT))x.remove()});if(keepT){keepT.classList.add('v147CanonicalFilters');var sl=keepT.querySelector('.v866Search>span');if(sl)sl.textContent='Búsqueda rápida';var cl=keepT.querySelector('.v866Clear');if(cl)cl.textContent='Limpiar filtros'}}
    decorateTables(vb);
  }
  patchCendisFilters();
}

/* Impacto potencial sobre Ambientes, calculado con equivalencia SOLO en Piso 1. */
function matchImpact(p,type){var x=s(p&&p[5]);if(type==='camino')return x==='camino';if(type==='requested')return x==='requested'||x==='requested_nostock';if(type==='available')return x==='available'&&cendisOf(p)>0;return false}
function impact148(type){
  ensureGuideRules();var rows=[],codes=new Set();(st().guias||[]).forEach(function(g){var e=g.__v148||guideEffective(g),targets=[],addedReq=0;
    e.requirements.forEach(function(req){if(req.covered)return;var ms=req.members.filter(function(p){return matchImpact(p,type)});if(ms.length){addedReq++;ms.forEach(function(p){targets.push(p);codes.add(s(p[0]))})}});
    if(!targets.length)return;var projected=Math.min(e.total,e.current+addedReq);rows.push({code:e.code,name:e.name,cat:e.cat,total:e.total,current:e.current,projected:projected,targets:targets,addedReq:addedReq,complete:e.current<e.total&&projected>=e.total,advance:e.current<e.total&&projected>e.current&&projected<e.total})
  });
  return {rows:rows,products:codes.size,positions:rows.reduce(function(a,g){return a+g.targets.length},0),complete:rows.filter(function(g){return g.complete}),advance:rows.filter(function(g){return g.advance})};
}
function impactLabel(type){return type==='camino'?'Productos en traslado':type==='requested'?'Productos solicitados':'Puedes solicitar'}
function impactCard148(type){var x=impact148(type);return '<div class="v148ImpactGroup"><div class="v148ImpactHead"><b>'+esc(impactLabel(type))+'</b><span>'+fi(x.products)+' productos · '+fi(x.positions)+' posiciones</span></div><div class="v148ImpactChoices"><button type="button" data-v148-impact="'+type+'" data-v148-result="complete"><strong>'+fi(x.complete.length)+'</strong><span>Completan</span></button><button type="button" data-v148-impact="'+type+'" data-v148-result="advance"><strong>'+fi(x.advance.length)+'</strong><span>Avanzan</span></button></div></div>'}
function showRange(title,sub,html){var modal=document.getElementById('rangeModal'),body=document.getElementById('rangeModalBody'),tt=document.getElementById('rangeModalTitle'),ss=document.getElementById('rangeModalSubtitle');if(!modal||!body)return;if(tt)tt.textContent=title;if(ss)ss.textContent=sub||'';body.innerHTML=html;modal.classList.add('on');document.body.style.overflow='hidden';decorateTables(body)}
window.openGuideImpact148=function(type,result){var x=impact148(type),list=result==='complete'?x.complete:x.advance,trs=[],seen={};list.forEach(function(g){g.targets.forEach(function(p){var code=s(p[0]),floor=s(p[1])||'—',key=g.code+'|'+floor+'|'+code;if(seen[key])return;seen[key]=1;var info=prod(code),now=g.total?g.current/g.total*100:0,pr=g.total?g.projected/g.total*100:0,state=s(p[5])||'—',exist=n(p[2]),source=p[12]?'Inventario actual':(p[7]?'SEUS':'Sin cruce');var covDelta=pr-now,covClass=covDelta>0.05?'v148CovUp':covDelta<-0.05?'v148CovDown':'v148CovFlat';trs.push('<tr><td><button type="button" class="v155DetailLink v155GuideLink" data-v155-guide="'+esc(g.code)+'"><b>'+esc(g.name)+'</b><small>'+esc(g.code+' · '+g.cat)+'</small><em>Ver guía →</em></button></td><td><span class="v148FloorBadge">Piso '+esc(floor)+'</span></td><td>'+(typeof imageThumb==='function'?imageThumb(code,'sm'):'')+'</td><td><button type="button" class="v155DetailLink v155ProductLink" data-v155-product="'+esc(code)+'"><span class="code">'+esc(code)+'</span></button></td><td><button type="button" class="v155DetailLink v155ProductLink" data-v155-product="'+esc(code)+'"><b>'+esc(info.n||p[6]||code)+'</b><small>'+esc([info.cat,info.lin,info.sub].filter(Boolean).join(' · '))+'</small><em>Ver producto →</em></button></td><td><span class="guideStatus gs-'+esc(state)+'">'+esc(state)+'</span></td><td class="num"><b>'+fi(exist)+'</b><small>'+esc(source)+'</small></td><td class="num">'+fi(cendisOf(p))+' u</td><td class="num">'+now.toFixed(1)+'%</td><td class="num '+covClass+'"><b>'+pr.toFixed(1)+'%</b>'+(covDelta>0.05?' <i>↑</i>':'')+'</td></tr>');});});showRange(impactLabel(type)+' · '+(result==='complete'?'Ambientes que completarían':'Ambientes que avanzarían'),(st().name||CUR)+' · '+fi(list.length)+' ambientes · '+fi(trs.length)+' posiciones','<div class="v148ImpactDetail"><div class="v127DetailSummary"><div><label>Ambientes</label><b>'+fi(list.length)+'</b></div><div><label>Productos</label><b>'+fi(new Set(list.reduce(function(a,g){return a.concat(g.targets.map(function(p){return s(p[0]);}));},[])).size)+'</b></div><div><label>Posiciones</label><b>'+fi(trs.length)+'</b></div></div><div class="v127TableWrap"><table class="v127Table"><thead><tr><th>Ambiente / guía</th><th>Piso</th><th>Imagen</th><th>Código</th><th>Producto</th><th>Estado</th><th class="num">Existencia</th><th class="num">CENDIS</th><th class="num">Cobertura actual</th><th class="num">Proyectada</th></tr></thead><tbody>'+(trs.join('')||'<tr><td colspan="10"><div class="empty">No hay registros.</div></td></tr>')+'</tbody></table></div></div>');};
/* V86.161: exportar a Excel los productos que faltan para completar/avanzar ambientes y que SÍ
   tienen disponibilidad en CENDIS (es decir, se pueden pedir). Reutiliza impact148('available'),
   que ya calcula esto mismo con la equivalencia de Piso 1, en vez de recalcular la lógica de nuevo.
   Alcance: administrador de tienda -> solo su tienda; líder -> las 21 tiendas en un solo archivo. */
function ambienteMissingCendisRowsForStore(storeCode){
  var prevCur=CUR;
  try{
    CUR=storeCode;
    var store=st();if(!store)return[];
    if((!Array.isArray(store.guias)||!store.guias.length)&&typeof window.llaveroRebuildAllGuideData==='function'){try{window.llaveroRebuildAllGuideData()}catch(_){}}
    try{ensureGuideRules()}catch(_){}
    var x=impact148('available'),out=[],seen={};
    x.rows.forEach(function(g){
      g.targets.forEach(function(p){
        var code=s(p[0]),key=g.code+'|'+code;if(seen[key])return;seen[key]=1;
        var info=prod(code);
        var imgUrl=s((typeof P!=='undefined'&&P&&P[code]&&P[code].img)||'');if(!/^https?:\/\//i.test(imgUrl))imgUrl='';
        out.push({tienda:store.name||storeCode,tiendaCodigo:storeCode,codigo:code,producto:info.n||p[6]||code,categoria:info.cat||'',linea:info.lin||'',sublinea:info.sub||'',ambiente:g.name,ambienteCodigo:g.code,cendis:n(cendisOf(p)),img:imgUrl});
      });
    });
    return out;
  }catch(_){return[];}finally{CUR=prevCur;}
}
function ambienteMissingCendisExportRows(){
  if(typeof IS_LEADER!=='undefined'&&IS_LEADER){
    var all=[];Object.keys(S||{}).forEach(function(sc){all=all.concat(ambienteMissingCendisRowsForStore(sc))});
    return all;
  }
  return ambienteMissingCendisRowsForStore(CUR);
}
function ensureXlsxV161(){return new Promise(function(resolve,reject){if(window.XLSX&&window.XLSX.utils&&window.XLSX.writeFile)return resolve(window.XLSX);var existing=document.querySelector('script[data-v8623-xlsx]');if(existing){var tries=0,t=setInterval(function(){tries++;if(window.XLSX){clearInterval(t);resolve(window.XLSX)}else if(tries>80){clearInterval(t);reject(new Error('Motor Excel no disponible'))}},100);return}var sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';sc.async=true;sc.setAttribute('data-v8623-xlsx','1');sc.onload=function(){window.XLSX?resolve(window.XLSX):reject(new Error('Motor Excel no disponible'))};sc.onerror=function(){reject(new Error('No fue posible cargar el motor Excel'))};document.head.appendChild(sc)})}
async function exportAmbienteMissingCendis(){
  var leaderScope=typeof IS_LEADER!=='undefined'&&IS_LEADER;
  var rows=ambienteMissingCendisExportRows();
  if(!rows.length){if(typeof toast==='function')toast('No hay productos faltantes con disponibilidad en CENDIS para exportar.','err');return;}
  var scopeLabel=leaderScope?'Red_21_tiendas':s((st()&&st().name)||CUR).replace(/[^A-Za-z0-9_-]+/g,'_');
  var name='Faltantes_Ambientes_CENDIS_'+scopeLabel+'_'+s((typeof DB!=='undefined'&&DB&&DB.meta&&DB.meta.fecha)||'corte');
  var header=leaderScope?['TIENDA','COD_TIENDA','CODIGO','PRODUCTO','CATEGORIA','LINEA','SUBLINEA','AMBIENTE','COD_AMBIENTE','DISPONIBLE_CENDIS']:['CODIGO','PRODUCTO','CATEGORIA','LINEA','SUBLINEA','AMBIENTE','COD_AMBIENTE','DISPONIBLE_CENDIS'];
  var data=[header].concat(rows.map(function(r){return leaderScope?[r.tienda,r.tiendaCodigo,r.codigo,r.producto,r.categoria,r.linea,r.sublinea,r.ambiente,r.ambienteCodigo,r.cendis]:[r.codigo,r.producto,r.categoria,r.linea,r.sublinea,r.ambiente,r.ambienteCodigo,r.cendis];}));
  try{
    var X=await ensureXlsxV161();
    var wb=X.utils.book_new(),ws=X.utils.aoa_to_sheet(data);
    ws['!cols']=leaderScope?[{wch:18},{wch:10},{wch:14},{wch:50},{wch:16},{wch:16},{wch:16},{wch:34},{wch:12},{wch:12}]:[{wch:14},{wch:50},{wch:16},{wch:16},{wch:16},{wch:34},{wch:12},{wch:12}];
    X.utils.book_append_sheet(wb,ws,'Faltantes CENDIS');
    X.writeFile(wb,name+'.xlsx',{compression:true});
    if(typeof toast==='function')toast('Excel generado con '+rows.length+' producto(s) faltante(s) con disponibilidad en CENDIS.','ok');
  }catch(err){
    var html='<html><head><meta charset="UTF-8"></head><body><table>'+data.map(function(row){return '<tr>'+row.map(function(c){return '<td>'+esc(c)+'</td>';}).join('')+'</tr>';}).join('')+'</table></body></html>',blob=new Blob(['﻿'+html],{type:'application/vnd.ms-excel;charset=utf-8'}),a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download=name+'.xls';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},300);
    if(typeof toast==='function')toast('Excel generado (formato de respaldo).','ok');
  }
}
/* V86.162: version grafica en PDF del mismo listado de faltantes CENDIS, con imagen de producto. */
function ensureJsPdfV161(){return new Promise(function(resolve,reject){if(window.jspdf&&window.jspdf.jsPDF)return resolve(window.jspdf.jsPDF);var old=document.querySelector('script[data-v161-jspdf]');if(old){var n=0,t=setInterval(function(){n++;if(window.jspdf&&window.jspdf.jsPDF){clearInterval(t);resolve(window.jspdf.jsPDF);}else if(n>80){clearInterval(t);reject(new Error('timeout'));}},100);return;}var sc=document.createElement('script');sc.setAttribute('data-v161-jspdf','1');sc.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';sc.async=true;sc.onload=function(){window.jspdf&&window.jspdf.jsPDF?resolve(window.jspdf.jsPDF):reject(new Error('jspdf'));};sc.onerror=function(){reject(new Error('network'));};document.head.appendChild(sc);setTimeout(function(){if(!(window.jspdf&&window.jspdf.jsPDF))reject(new Error('timeout'));},9000);});}
function imageDataV161(url){return new Promise(function(resolve){if(!/^https?:\/\//i.test(url||''))return resolve(null);var img=new Image(),done=false,t=setTimeout(function(){if(!done){done=true;resolve(null);}},1800);img.crossOrigin='anonymous';img.onload=function(){if(done)return;try{var max=180,ratio=Math.min(1,max/img.width,max/img.height),w=Math.max(1,Math.round(img.width*ratio)),h=Math.max(1,Math.round(img.height*ratio)),cv=document.createElement('canvas');cv.width=w;cv.height=h;var ctx=cv.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);var data=cv.toDataURL('image/jpeg',.78);done=true;clearTimeout(t);resolve({data:data,w:w,h:h});}catch(_){done=true;clearTimeout(t);resolve(null);}};img.onerror=function(){if(!done){done=true;clearTimeout(t);resolve(null);}};img.src=url;});}
function splitV161(doc,text,width,lines){var out=doc.splitTextToSize(s(text).replace(/\s+/g,' ').trim()||'—',width);return lines?out.slice(0,lines):out;}
function ambientePdfHeaderV161(doc,pageNo,totalPages,subtitle){doc.setFillColor(23,59,99);doc.rect(0,0,210,18,'F');doc.setFillColor(229,50,50);doc.rect(0,0,5,18,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text('LLAVERO - Faltantes de Ambientes con disponibilidad CENDIS',12,8);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(subtitle,12,13.5);doc.text('Pagina '+pageNo+' de '+totalPages,198,13.5,{align:'right'});doc.setTextColor(24,56,95);}
function drawAmbienteCoverV161(doc,rows,scopeLabel,leaderScope){var y=32;doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(24,56,95);doc.text('Faltantes de ambientes disponibles en CENDIS',14,y);y+=7;doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(90,101,116);doc.text(splitV161(doc,'Productos que las guias de exhibicion de '+scopeLabel+' aun no tienen en tienda, pero que si estan disponibles para pedir en CENDIS. Incluye la imagen del producto y el ambiente al que pertenece.',182),14,y);y+=16;var ambSet={};rows.forEach(function(r){ambSet[r.ambienteCodigo]=1;});var cards=[['Productos',fInt(rows.length)],['Ambientes involucrados',fInt(Object.keys(ambSet).length)],[leaderScope?'Tiendas':'Tienda',leaderScope?fInt(Object.keys(rows.reduce(function(a,r){a[r.tiendaCodigo]=1;return a;},{})).length):scopeLabel],['Disponibilidad total CENDIS',fInt(rows.reduce(function(a,r){return a+n(r.cendis);},0))+' u']];cards.forEach(function(c,i){var col=i%2,row=Math.floor(i/2),x=14+col*91,y0=y+row*24;doc.setFillColor(247,249,252);doc.setDrawColor(226,230,235);doc.roundedRect(x,y0,86,19,2,2,'FD');doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(115,125,138);doc.text(String(c[0]).toUpperCase(),x+4,y0+6);doc.setFontSize(12);doc.setTextColor(24,56,95);doc.text(String(c[1]),x+4,y0+14,{maxWidth:78});});y+=54;doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(115,125,138);doc.text('Generado desde LLAVERO · '+new Date().toLocaleString('es-CO'),14,286);}
function drawAmbienteCardV161(doc,r,img,x,y,w,h,leaderScope){doc.setDrawColor(224,229,235);doc.setFillColor(255,255,255);doc.roundedRect(x,y,w,h,2,2,'FD');var ix=x+3,iy=y+3,is=18;if(img&&img.data){try{doc.addImage(img.data,'JPEG',ix,iy,is,is,undefined,'FAST');}catch(_){doc.setFillColor(246,247,249);doc.rect(ix,iy,is,is,'F');}}else{doc.setFillColor(246,247,249);doc.rect(ix,iy,is,is,'F');doc.setTextColor(170,176,184);doc.setFontSize(6);doc.text('SIN\nIMG',ix+is/2,iy+is/2+1,{align:'center'});}
  var tx=ix+is+3,tw=w-is-9;doc.setTextColor(24,56,95);doc.setFont('helvetica','bold');doc.setFontSize(7.6);doc.text(splitV161(doc,r.producto,tw,2),tx,y+6.5);doc.setFont('helvetica','normal');doc.setFontSize(6.4);doc.setTextColor(105,115,128);doc.text(s(r.codigo),tx,y+18.5);
  var ay=y+is+7;doc.setFont('helvetica','bold');doc.setFontSize(6);doc.setTextColor(120,130,143);doc.text('AMBIENTE',x+3,ay);doc.setFont('helvetica','normal');doc.setFontSize(6.6);doc.setTextColor(55,68,86);doc.text(splitV161(doc,r.ambiente+' ('+r.ambienteCodigo+')',w-6,1),x+3,ay+4);
  var by=ay+9;doc.setFont('helvetica','normal');doc.setFontSize(5.8);doc.setTextColor(115,125,138);doc.text(splitV161(doc,[r.categoria,r.linea,r.sublinea].filter(Boolean).join(' · '),leaderScope?w-6:(w-30),1),x+3,by);
  doc.setFillColor(233,248,242);doc.setDrawColor(195,232,220);var bw=leaderScope?w-6:24,bx=leaderScope?x+3:x+w-3-24,byy=leaderScope?by+3:by-3.6;doc.roundedRect(bx,byy,bw,6,1.5,1.5,'FD');doc.setFont('helvetica','bold');doc.setFontSize(6.2);doc.setTextColor(14,122,87);doc.text('CENDIS: '+fInt(r.cendis)+' u',bx+bw/2,byy+4.2,{align:'center'});
  if(leaderScope){doc.setFont('helvetica','normal');doc.setFontSize(5.6);doc.setTextColor(120,130,143);doc.text(splitV161(doc,s(r.tienda),w-6,1),x+3,byy+10);}
}
async function exportAmbienteMissingCendisPdf(){
  var leaderScope=typeof IS_LEADER!=='undefined'&&IS_LEADER;
  var rows=ambienteMissingCendisExportRows();
  if(!rows.length){if(typeof toast==='function')toast('No hay productos faltantes con disponibilidad en CENDIS para exportar.','err');return;}
  var scopeLabel=leaderScope?'la red de 21 tiendas':s((st()&&st().name)||CUR);
  var fileScope=leaderScope?'Red_21_tiendas':scopeLabel.replace(/[^A-Za-z0-9_-]+/g,'_');
  var fecha=s((typeof DB!=='undefined'&&DB&&DB.meta&&DB.meta.fecha)||'corte');
  var name='Faltantes_Ambientes_CENDIS_'+fileScope+'_'+fecha;
  var btn=document.querySelector('.v161ExportMissingPdfBtn');if(btn)btn.disabled=true;
  try{
    var JsPDF=await ensureJsPdfV161();
    var images=await Promise.all(rows.map(function(r){return imageDataV161(r.img);}));
    var doc=new JsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
    var perPage=12,cols=3,colW=58,colGap=5,rowH=54,rowGap=4,startX=12,startY=26;
    var gridPages=Math.ceil(rows.length/perPage),totalPages=1+gridPages;
    var subtitle='Inventarios Jamar · Corte '+fecha+' · '+scopeLabel;
    ambientePdfHeaderV161(doc,1,totalPages,subtitle);
    drawAmbienteCoverV161(doc,rows,scopeLabel,leaderScope);
    for(var i=0;i<rows.length;i++){
      var posInPage=i%perPage;
      if(posInPage===0){doc.addPage();ambientePdfHeaderV161(doc,2+Math.floor(i/perPage),totalPages,subtitle);}
      var col=posInPage%cols,row=Math.floor(posInPage/cols),x=startX+col*(colW+colGap),y=startY+row*(rowH+rowGap);
      drawAmbienteCardV161(doc,rows[i],images[i],x,y,colW,rowH,leaderScope);
    }
    doc.save(name+'.pdf');
    if(typeof toast==='function')toast('PDF generado con '+rows.length+' producto(s) faltante(s) con disponibilidad en CENDIS.','ok');
  }catch(err){
    console.warn('V86.162 PDF faltantes ambientes: se usa impresion como respaldo',err);
    var w=window.open('','_blank');
    if(!w){if(typeof toast==='function')toast('El navegador bloqueo la ventana de impresion. Habilita ventanas emergentes para generar el PDF.','err');if(btn)btn.disabled=false;return;}
    var cards=rows.map(function(r){return '<section class="c"><div class="img">'+(r.img?'<img src="'+esc(r.img)+'" loading="lazy">':'<span class="noimg">Sin imagen</span>')+'</div><div class="b"><b>'+esc(r.producto)+'</b><small>'+esc(r.codigo)+'</small><div class="amb">'+esc(r.ambiente)+' ('+esc(r.ambienteCodigo)+')</div><div class="meta">'+esc([r.categoria,r.linea,r.sublinea].filter(Boolean).join(' · '))+(leaderScope?' · '+esc(r.tienda):'')+'</div><span class="cendis">CENDIS: '+fInt(r.cendis)+' u</span></div></section>';}).join('');
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Faltantes Ambientes CENDIS</title><style>@page{size:A4;margin:12mm}body{font:11px Arial;color:#24364b}h1{color:#173b63;font-size:18px;margin:0 0 4px}.sub{color:#6d7886;font-size:11px;margin:0 0 14px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.c{border:1px solid #e0e5eb;border-radius:8px;padding:8px;display:flex;gap:6px;break-inside:avoid}.img{width:44px;height:44px;flex:0 0 44px;background:#f6f7f9;border-radius:4px;display:flex;align-items:center;justify-content:center;overflow:hidden}.img img{width:100%;height:100%;object-fit:contain}.noimg{font-size:8px;color:#aab0b8;text-align:center}.b{min-width:0}.b b{display:block;font-size:9.5px;color:#173b63;line-height:1.2}.b small{display:block;color:#697585;font-size:8px;margin:2px 0}.amb{font-size:8px;color:#374f56;margin:2px 0}.meta{font-size:7.5px;color:#8890a0;margin:2px 0}.cendis{display:inline-block;background:#e9f8f2;color:#0e7a57;border-radius:4px;padding:1px 6px;font-size:8px;font-weight:bold;margin-top:2px}</style></head><body><h1>Faltantes de ambientes disponibles en CENDIS</h1><p class="sub">Corte '+esc(fecha)+' · '+esc(scopeLabel)+' · '+fInt(rows.length)+' productos · Generado '+esc(new Date().toLocaleString('es-CO'))+'</p><div class="grid">'+cards+'</div><script>window.onload=function(){setTimeout(function(){window.print();},250)}<\/script></body></html>');
    w.document.close();
    if(typeof toast==='function')toast('No fue posible cargar el motor PDF. Se abrio la vista de impresion para guardar como PDF.','err');
  }finally{if(btn)btn.disabled=false;}
}
function ensureAmbienteExportButton(){
  if(currentView()!=='amb')return;
  var root=document.getElementById('content');if(!root)return;
  var head=root.querySelector('.pv-guide-card .chead .rt')||root.querySelector('.card .chead .rt');if(!head)return;
  var btn=head.querySelector('.v161ExportMissingBtn');
  if(!btn){
    btn=document.createElement('button');btn.type='button';btn.className='btn ghost v161ExportMissingBtn';btn.style.cssText='margin-left:8px;white-space:nowrap;';
    head.appendChild(btn);
    btn.onclick=function(e){e.preventDefault();e.stopPropagation();exportAmbienteMissingCendis();};
  }
  var pdfBtn=head.querySelector('.v161ExportMissingPdfBtn');
  if(!pdfBtn){
    pdfBtn=document.createElement('button');pdfBtn.type='button';pdfBtn.className='btn ghost v161ExportMissingPdfBtn';pdfBtn.style.cssText='margin-left:8px;white-space:nowrap;';
    head.appendChild(pdfBtn);
    pdfBtn.onclick=function(e){e.preventDefault();e.stopPropagation();exportAmbienteMissingCendisPdf();};
  }
  var leaderScope=typeof IS_LEADER!=='undefined'&&IS_LEADER;
  btn.textContent=leaderScope?'⬇ Exportar faltantes CENDIS (21 tiendas)':'⬇ Exportar faltantes CENDIS';
  btn.title='Genera un Excel con los productos que las guías de exhibición necesitan y que aún no tienes, pero sí están disponibles para pedir en CENDIS.';
  pdfBtn.textContent=leaderScope?'🖼 PDF con imágenes (21 tiendas)':'🖼 PDF con imágenes';
  pdfBtn.title='Genera un PDF gráfico de los mismos faltantes, con la imagen de cada producto y su ambiente.';
}
function patchAmbientImpact(){
  if(currentView()!=='amb')return;ensureGuideRules();var root=document.getElementById('content');if(!root)return;
  var nodes=Array.from(root.querySelectorAll('.v71ImpactCard,.v117AmbImpactInline,.v145AmbientImpact,.v147AmbientImpact,.v148AmbientImpact,.v155AmbientImpact'));
  var host=nodes.find(function(x){return x.classList.contains('v155AmbientImpact')})||nodes[0]||document.createElement('section');
  nodes.forEach(function(x){if(x!==host)x.remove()});
  /* Ubicación original aprobada: después del bloque Completitud por piso, dentro de la misma card. */
  var floorGrid=root.querySelector('.guideFloorGrid'),floorBlock=floorGrid&&floorGrid.parentElement;
  if(floorBlock&&floorBlock.parentNode){floorBlock.insertAdjacentElement('afterend',host);}else{
    var fallback=root.querySelector('.v138AmbFilters')||document.getElementById('guias-tbl');if(!fallback||!fallback.parentNode)return;fallback.parentNode.insertBefore(host,fallback);
  }
  host.className='v155AmbientImpact';
  function group(type,label){var z=impact148(type);return '<article class="v155AmbientGroup"><div class="v155AmbientGroupHead"><div><b>'+esc(label)+'</b><span>'+fi(z.products)+' productos · '+fi(z.positions)+' posiciones</span></div></div><div class="v155AmbientGroupMetrics"><button type="button" data-v148-impact="'+type+'" data-v148-result="complete"><strong>'+fi(z.complete.length)+'</strong><span>Completan</span></button><button type="button" data-v148-impact="'+type+'" data-v148-result="advance"><strong>'+fi(z.advance.length)+'</strong><span>Avanzan</span></button></div></article>';}
  host.innerHTML='<div class="v155AmbientImpactHead"><span class="ico">↗</span><div><b>Impacto potencial sobre los ambientes</b><span>Cuántas guías completarían o avanzarían con traslados, solicitudes y productos disponibles para solicitar.</span></div></div><div class="v155AmbientImpactGrid">'+group('camino','Productos en traslado')+group('requested','Productos solicitados')+group('available','Puedes solicitar')+'</div>';
  host.querySelectorAll('[data-v148-impact]').forEach(function(b){b.onclick=function(e){e.preventDefault();e.stopPropagation();window.openGuideImpact148(b.dataset.v148Impact,b.dataset.v148Result);};});
  patchGuideConcentration155(host);
}
function patchGuideConcentration155(anchorAfter){
  if(typeof window.__llaveroGuiaRowsV48!=='function')return;
  var root=document.getElementById('content');if(!root)return;
  var rows=window.__llaveroGuiaRowsV48();if(!rows.length)return;
  var byCat={};rows.forEach(function(r){var k=s(r.cat)||'SIN CATEGORÍA';(byCat[k]=byCat[k]||[]).push(r);});
  var cats=Object.keys(byCat).sort();
  var cards=cats.map(function(cat){
    var list=byCat[cat],total=list.length,completas=list.filter(function(r){return r.comp>=100;}).length,sinAvance=list.filter(function(r){return r.comp<=0;}).length,avanzadas=total-completas-sinAvance;
    var sumTot=list.reduce(function(a,r){return a+n(r.tot);},0),sumPres=list.reduce(function(a,r){return a+n(r.pres);},0),cobertura=sumTot?Math.round(1000*sumPres/sumTot)/10:0;
    var color=cobertura>=80?'var(--ok)':cobertura>=40?'var(--amb)':'var(--rot)';
    return '<button type="button" class="v155ConcCard" data-v155-conc="'+esc(cat)+'"><div class="v155ConcHead"><b>'+esc(catLabelV155(cat))+'</b><span>'+fi(total)+' guías</span></div><div class="v155ConcTrack"><div class="v155ConcFill" style="width:'+cobertura+'%;background:'+color+'"></div></div><div class="v155ConcPct" style="color:'+color+'">'+cobertura.toFixed(1)+'% cobertura</div><div class="v155ConcMetrics"><span class="ok"><b>'+fi(completas)+'</b> completas</span><span class="warn"><b>'+fi(avanzadas)+'</b> en progreso</span><span class="bad"><b>'+fi(sinAvance)+'</b> sin avance</span></div></button>';
  }).join('');
  var hostC=document.getElementById('v155GuideConcentration');
  if(!hostC){hostC=document.createElement('section');hostC.id='v155GuideConcentration';hostC.className='v155GuideConcentration';if(anchorAfter&&anchorAfter.parentNode)anchorAfter.insertAdjacentElement('afterend',hostC);else return;}
  hostC.innerHTML='<div class="v155ConcTitle"><span class="ico">▦</span><div><b>Concentración por tipo de ambiente</b><span>Guías completas, en progreso y sin avance, agrupadas por tipo. Presiona una tarjeta para ver esas guías.</span></div></div><div class="v155ConcGrid">'+cards+'</div>';
  hostC.querySelectorAll('[data-v155-conc]').forEach(function(b){b.onclick=function(e){e.preventDefault();e.stopPropagation();if(typeof window.setGuideFilterV48==='function')window.setGuideFilterV48(b.dataset.v155Conc);};});
}
function catLabelV155(cat){if(cat==='DORMITORIO')return'Dormitorio';if(cat==='SOCIAL')return'Social';if(cat==='INTEGRAL'||cat==='INTEGRALES')return'Integrales';return cat;}
window.renderAmbientImpact155=patchAmbientImpact;

/* Detalle de guía: un solo filtro + visualización explícita de equivalencia Piso 1. */
function activeGuideMeta(){var g=(st().guias||[]).find(function(x){return s(x[0])===s(activeGuide)});return g&&(g.__v148||guideEffective(g))}
function stateForRow(meta,code,floor){var ci=meta&&meta.codeInfo&&meta.codeInfo[code];if(ci)return ci.state;if(floor==='3')return'info';return'pending'}
function patchGuideDetail(){
  var body=document.getElementById('guideDetailBodyV49'),back=document.getElementById('guideDetailModalBackV49');if(!body||!back||!back.classList.contains('on'))return;body.classList.add('v148GuideClean');var meta=activeGuideMeta();if(!meta)return;
  body.querySelectorAll('.guideModalToolbarV48,.v145GuideFilters,.v147CanonicalFilters:not(.v148GuideFilters),.v108HierarchyFilters,.ux104Filters,.v118UnifiedFilters,.guideFilterBarV48').forEach(function(x){x.remove()});
  /* Filas: marcar equivalencias de Piso 1 sin inventar existencia del código ausente. */
  body.querySelectorAll('.guideProductOpenV50').forEach(function(tr){var code=s(tr.dataset.productCode),block=tr.closest('.guideFloorBlockV50'),title=norm(block&&block.querySelector('.guideFloorHeaderV50 .title')&&block.querySelector('.guideFloorHeaderV50 .title').textContent),floor=title.indexOf('PISO 1')>=0?'1':title.indexOf('PISO 2')>=0?'2':'3',ci=meta.codeInfo[code];tr.dataset.v148Floor=floor;tr.dataset.v148State=stateForRow(meta,code,floor);if(ci&&ci.equivalent){tr.classList.add('v148EquivalentCovered');var cell=tr.querySelector('.col-status');if(cell)cell.innerHTML='<span class="guideStatus gs-ok">Cubierto por equivalencia P1</span><small class="v148EquivNote">La tienda tiene otro código válido del mismo grupo dentro de esta guía.</small>'}});
  var p1=Array.from(body.querySelectorAll('.guideFloorBlockV50')).find(function(b){return norm((b.querySelector('.guideFloorHeaderV50 .title')||{}).textContent).indexOf('PISO 1')>=0});if(p1){var m=p1.querySelector('.guideFloorHeaderV50 .meta');if(m)m.textContent=meta.groupsP1.reduce(function(a,g){return a+g.members.length},0)+' códigos de guía · '+meta.p1Total+' necesidades · '+meta.p1Covered+' cubiertas · '+Math.max(0,meta.p1Total-meta.p1Covered)+' pendientes'}
  var bar=body.querySelector('.v148GuideFilters');if(!bar){bar=document.createElement('div');bar.className='v148GuideFilters';bar.innerHTML='<div class="v148FilterField"><label>Búsqueda rápida</label><input type="search" data-v148-gf="q" placeholder="Producto, código o estado..."></div><div class="v148FilterField"><label>Piso</label><select data-v148-gf="floor"><option value="all">Todos</option><option value="1">Piso 1</option><option value="2">Piso 2</option><option value="3">Piso 3</option></select></div><div class="v148FilterField"><label>Estado / gestión</label><select data-v148-gf="status"><option value="all">Todos</option><option value="covered">Cubiertos</option><option value="pending">Pendientes</option><option value="camino">En traslado</option><option value="requested">Solicitud realizada</option><option value="available">Puedes solicitar</option></select></div><div class="v148FilterField"><label>Acción</label><button type="button" data-v148-gf-clear>Limpiar filtros</button></div><span class="v148FilterCount"></span>';
    var stats=body.querySelector('.guideModalStatsV48');if(stats)stats.insertAdjacentElement('afterend',bar);else body.insertBefore(bar,body.firstChild);
    function apply(){var q=norm((bar.querySelector('[data-v148-gf="q"]')||{}).value),floor=(bar.querySelector('[data-v148-gf="floor"]')||{}).value||'all',status=(bar.querySelector('[data-v148-gf="status"]')||{}).value||'all',rows=Array.from(body.querySelectorAll('.guideProductOpenV50')),shown=0;rows.forEach(function(tr){var stt=tr.dataset.v148State||'pending',fl=tr.dataset.v148Floor||'3',txt=norm(tr.textContent),ok=(!q||txt.indexOf(q)>=0)&&(floor==='all'||fl===floor);if(ok&&status!=='all'){if(status==='covered')ok=stt==='covered';else if(status==='pending')ok=['covered','info'].indexOf(stt)<0;else ok=stt===status}tr.style.display=ok?'':'none';if(ok)shown++});body.querySelectorAll('.guideFloorBlockV50').forEach(function(sec){var vis=Array.from(sec.querySelectorAll('.guideProductOpenV50')).some(function(r){return r.style.display!=='none'});sec.style.display=vis?'':'none'});bar.querySelector('.v148FilterCount').textContent=fi(shown)+' de '+fi(rows.length)+' productos'}
    bar.addEventListener('input',function(){clearTimeout(debounce);debounce=setTimeout(apply,60)});bar.addEventListener('change',apply);bar.querySelector('[data-v148-gf-clear]').onclick=function(){bar.querySelectorAll('input').forEach(function(x){x.value=''});bar.querySelectorAll('select').forEach(function(x){x.value='all'});apply()};bar.__v148Apply=apply;
  }
  if(bar.__v148Apply)bar.__v148Apply();decorateTables(body);
}

/* Traslados: NO tocar la card; solo su vista detallada. */
function transferStatus(r){var e=norm(r&&r.estatus);if(e.indexOf('ENTREG')>=0)return'Entregado';if(e.indexOf('PICK')>=0)return'En picking';if(e.indexOf('RUTA')>=0)return'En ruta';if(e.indexOf('PEND')>=0)return'Pendiente';var p=norm(r&&r.statusGlobalPicking),m=norm(r&&r.statusMovimiento),w=norm(r&&r.lugarPuestaDispos);if(p==='C'&&m==='C')return'Entregado';if(p==='C'&&m==='A')return'En ruta';if(p==='A'&&m==='A'&&w.indexOf('WMS')>=0)return'En picking';return'Pendiente'}
function pendingRows(){return (Array.isArray(st().trDetalle)?st().trDetalle:[]).filter(function(r){return transferStatus(r)==='Pendiente'})}
function conditionSets(){
  /* Debe coincidir con la card existente: NO recalcular ni reinterpretar sus universos. */
  var rot=new Set(),evac=new Set(),store=st();
  (Array.isArray(store.rot)?store.rot:[]).forEach(function(r){rot.add(s(r&&r[0]))});
  (Array.isArray(store.evac)?store.evac:[]).forEach(function(r){evac.add(s(r&&r[0]))});
  return{rot:rot,evac:evac}
}
/* V86.161: producto en Rotación que también hace parte de un ambiente activo (cualquier estado,
   no solo "camino"), para alertar al administrador antes de descontarlo/trasladarlo. No reemplaza
   ni reinterpreta ambientCodesCurrent(), que sigue exclusiva de la card de Traslados. */
function ambienteMemberCodes(){
  var store=st();if((!Array.isArray(store.guias)||!store.guias.length)&&typeof window.llaveroRebuildAllGuideData==='function'){try{window.llaveroRebuildAllGuideData();store=st()}catch(_){}}
  var set=new Set();(store.guias||[]).forEach(function(g){(g[6]||[]).forEach(function(p){if(p&&p[10])set.add(s(p[0]))})});return set;
}
function flagAmbienteInRotacion(){
  if(currentView()!=='rot')return;
  var tbl=document.getElementById('rot-tbl');if(!tbl)return;
  var codes=ambienteMemberCodes();
  tbl.querySelectorAll('tbody tr[data-code]').forEach(function(tr){
    var code=s(tr.dataset.code),nameEl=tr.querySelector('.v71ProductName,.pname,.productCell b,.productCell');if(!nameEl)return;
    var existing=nameEl.querySelector('.v161AmbienteFlag');
    if(codes.has(code)){
      if(!existing){
        var badge=document.createElement('span');
        badge.className='tag v161AmbienteFlag';
        badge.title='Este producto también hace parte de un ambiente activo: evita descontarlo o trasladarlo sin verificar el ambiente.';
        badge.textContent='También en Ambiente';
        badge.style.cssText='display:inline-block;margin-left:6px;background:#fef3c7;color:#92400e;border:1px solid #fde68a;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;vertical-align:middle;white-space:nowrap;';
        nameEl.appendChild(badge);
      }
    }else if(existing){existing.remove();}
  });
}
function ambientCodesCurrent(){
  /* La card de Traslados conserva su cálculo actual: código exacto de guía con estado camino. */
  var store=st();if((!Array.isArray(store.guias)||!store.guias.length)&&typeof window.llaveroRebuildAllGuideData==='function'){try{window.llaveroRebuildAllGuideData();store=st()}catch(_){}}
  var set=new Set();(store.guias||[]).forEach(function(g){(g[6]||[]).forEach(function(p){if(p&&p[10]&&s(p[5])==='camino')set.add(s(p[0]))})});return set
}
function guideRefsForPending(code){var store=st();if((!Array.isArray(store.guias)||!store.guias.length)&&typeof window.llaveroRebuildAllGuideData==='function'){try{window.llaveroRebuildAllGuideData();store=st();}catch(_){}}var out=[];(Array.isArray(store.guias)?store.guias:[]).forEach(function(g){(Array.isArray(g&&g[6])?g[6]:[]).forEach(function(p){if(s(p&&p[0])===s(code)&&!!p[10]&&s(p[5])==='camino')out.push({code:s(g[0]),name:s(g[1]),floor:s(p[1])});});});var seen={};return out.filter(function(g){var k=g.code+'|'+g.floor;if(seen[k])return false;seen[k]=1;return true;});}
function transferStateSince155(r,status){if(status==='En picking')return s(r.fechaPicking||r.fechaCreacion||'—');if(status==='En ruta')return s(r.fechaPicking||r.fechaCreacion||'—');return s(r.fechaCreacion||'—');}
function transferDetailRows(){var pending=pendingRows(),sets=conditionSets(),map={};pending.forEach(function(r){var code=s(r.codigo),guides=guideRefsForPending(code),rot=sets.rot.has(code),evac=sets.evac.has(code);if(!(rot||evac||guides.length))return;var order=s(r.entrega||'Sin identificar'),k=code+'|'+order,o=map[k]||(map[k]={code:code,order:order,name:s(r.nombre)||s(prod(code).n)||code,units:0,statuses:new Set(),since:new Set(),rot:rot,evac:evac,guides:guides});var status=transferStatus(r);o.units+=n(r.unidades);o.statuses.add(status);o.since.add(transferStateSince155(r,status));});return Object.values(map).sort(function(a,b){return s(a.order).localeCompare(s(b.order),'es')||s(a.name).localeCompare(s(b.name),'es');});}
window.openTransferImpact148=function(){
  var rows=transferDetailRows(),products=new Set(rows.map(function(r){return r.code;})),ambProducts=new Set(rows.filter(function(r){return r.guides.length;}).map(function(r){return r.code;}));
  function impactHtml(r){
    var parts=[];
    r.guides.forEach(function(g){
      parts.push('<button type="button" class="v155ImpactBadge amb v155ImpactLink" data-v155-guide="'+esc(g.code)+'"><i></i><span><b>Ambiente '+esc(g.code)+'</b><small>'+esc(g.name+' · Piso '+g.floor)+'</small><em>Ver ambiente →</em></span></button>');
    });
    if(r.rot)parts.push('<span class="v155ImpactBadge rot"><i></i><span><b>Rotación</b><small>Antigüedad mayor a 90 días</small></span></span>');
    if(r.evac)parts.push('<span class="v155ImpactBadge evac"><i></i><span><b>Evacuación</b><small>Producto fuera de surtido</small></span></span>');
    return '<div class="v155ImpactBadges">'+parts.join('')+'</div>';
  }
  var trs=rows.map(function(r){
    var p=prod(r.code);
    return '<tr>'+
      '<td><button type="button" class="v155DetailLink v155DeliveryLink" data-v155-delivery="'+esc(r.order)+'"><b>'+esc(r.order)+'</b><em>Ver entrega →</em></button></td>'+
      '<td><span class="statusPill st-pendiente">Pendiente</span></td>'+
      '<td>'+esc(Array.from(r.since).join(' / '))+'</td>'+
      '<td>'+(typeof imageThumb==='function'?imageThumb(r.code,'sm'):'')+'</td>'+
      '<td><button type="button" class="v155DetailLink v155ProductLink" data-v155-product="'+esc(r.code)+'"><span class="code">'+esc(r.code)+'</span></button></td>'+
      '<td><button type="button" class="v155DetailLink v155ProductLink" data-v155-product="'+esc(r.code)+'"><b>'+esc(r.name)+'</b><small>'+esc([p.cat,p.lin,p.sub].filter(Boolean).join(' · '))+'</small><em>Ver producto →</em></button></td>'+
      '<td class="num"><b>'+fi(r.units)+'</b></td>'+
      '<td>'+impactHtml(r)+'</td>'+
    '</tr>';
  }).join('');
  showRange(
    'Productos con impacto por entregar',
    (st().name||CUR)+' · exclusivamente productos con estado Pendiente',
    '<div class="v127DetailSummary">'+
      '<div><label>Productos únicos</label><b>'+fi(products.size)+'</b></div>'+
      '<div><label>Rotación</label><b>'+fi(new Set(rows.filter(function(r){return r.rot;}).map(function(r){return r.code;})).size)+'</b></div>'+
      '<div><label>Evacuación</label><b>'+fi(new Set(rows.filter(function(r){return r.evac;}).map(function(r){return r.code;})).size)+'</b></div>'+
      '<div><label>Ambientes</label><b>'+fi(ambProducts.size)+'</b></div>'+
    '</div>'+
    '<div class="v127TableWrap"><table class="v127Table v155PendingImpactTable"><thead><tr><th>Orden de entrega</th><th>Estado actual</th><th>Estado desde</th><th>Imagen</th><th>Código</th><th>Producto</th><th class="num">Uds. pendientes</th><th>Impacto / elemento impactado</th></tr></thead><tbody>'+
      (trs||'<tr><td colspan="8"><div class="empty">No hay productos con estado Pendiente que generen impacto.</div></td></tr>')+
    '</tbody></table></div>'+
    '<div class="v127Hint">Solo se incluyen órdenes cuyo estado actual es Pendiente. El código, el producto, la entrega y el ambiente permiten abrir su detalle sin modificar ninguna selección.</div>'
  );
};

/* ===== LLAVERO V86.160 · Impacto por entregar unificado por orden (única implementación activa) ===== */
function pendingOrEnRouteRows160(){return (Array.isArray(st().trDetalle)?st().trDetalle:[]).filter(function(r){var s=transferStatus(r);return s==='Pendiente'||s==='En picking'||s==='En ruta';});}
function transferOrderImpactRows160(){
  var rows=pendingOrEnRouteRows160(),sets=conditionSets(),orders={};
  rows.forEach(function(r){
    var code=s(r.codigo),guides=guideRefsForPending(code),rot=sets.rot.has(code),evac=sets.evac.has(code);
    if(!(rot||evac||guides.length))return;
    var order=s(r.entrega||'Sin identificar'),status=transferStatus(r);
    var o=orders[order]||(orders[order]={order:order,status:status,since:transferStateSince155(r,status),eta:s(r.fechaEntrega||'—'),products:{}});
    var p=o.products[code]||(o.products[code]={code:code,name:s(r.nombre)||s(prod(code).n)||code,units:0,rot:rot,evac:evac,guides:guides});
    p.units+=n(r.unidades);
  });
  return Object.values(orders).map(function(o){o.products=Object.values(o.products).sort(function(a,b){return b.units-a.units;});return o;}).sort(function(a,b){return s(a.order).localeCompare(s(b.order),'es');});
}
window.openTransferPendingImpact=function(){
  var data=transferOrderImpactRows160(),allProducts=new Set(),rotSet=new Set(),evacSet=new Set(),ambSet=new Set();
  data.forEach(function(o){o.products.forEach(function(p){allProducts.add(p.code);if(p.rot)rotSet.add(p.code);if(p.evac)evacSet.add(p.code);if(p.guides.length)ambSet.add(p.code);});});
  var statusCls={'Pendiente':'st-pendiente','En picking':'st-gestion','En ruta':'st-ruta8615'};
  function impactBadges(p){
    var parts=[];
    p.guides.forEach(function(g){parts.push('<button type="button" class="v155ImpactBadge amb v155ImpactLink" data-v155-guide="'+esc(g.code)+'"><i></i><span><b>Ambiente '+esc(g.code)+'</b><small>'+esc(g.name+' · Piso '+g.floor)+'</small></span></button>');});
    if(p.rot)parts.push('<span class="v155ImpactBadge rot"><i></i><span><b>Rotación</b><small>Antigüedad mayor a 90 días</small></span></span>');
    if(p.evac)parts.push('<span class="v155ImpactBadge evac"><i></i><span><b>Evacuación</b><small>Fuera de surtido</small></span></span>');
    return '<div class="v155ImpactBadges v160InlineBadges">'+parts.join('')+'</div>';
  }
  var orderCards=data.map(function(o){
    var productsHtml=o.products.map(function(p){
      return '<div class="v160ProductRow">'+
        '<div class="v160ProductThumb">'+(typeof imageThumb==='function'?imageThumb(p.code,'sm'):'')+'</div>'+
        '<button type="button" class="v155DetailLink v160ProductLink" data-v155-product="'+esc(p.code)+'"><span class="code">'+esc(p.code)+'</span><b>'+esc(p.name)+'</b></button>'+
        '<span class="v160Units">'+fi(p.units)+' u</span>'+
        impactBadges(p)+
      '</div>';
    }).join('');
    return '<div class="v160OrderCard">'+
      '<div class="v160OrderHead">'+
        '<button type="button" class="v155DetailLink v160OrderCode" data-v155-delivery="'+esc(o.order)+'"><b>Orden '+esc(o.order)+'</b><em>Ver entrega →</em></button>'+
        '<span class="statusPill '+(statusCls[o.status]||'st-pendiente')+'">'+esc(o.status)+'</span>'+
        '<span class="v160OrderMeta">Desde '+esc(o.since)+' · Entrega estimada '+esc(o.eta)+'</span>'+
        '<span class="v160OrderCount">'+fi(o.products.length)+' producto'+(o.products.length===1?'':'s')+' con impacto</span>'+
      '</div>'+
      '<div class="v160OrderProducts">'+productsHtml+'</div>'+
    '</div>';
  }).join('');
  showRange(
    'Productos con impacto por entregar',
    (st().name||CUR)+' · solo órdenes Pendiente, En picking o En ruta',
    '<div class="v127DetailSummary v160Summary5">'+
      '<div><label>Órdenes</label><b>'+fi(data.length)+'</b></div>'+
      '<div><label>Productos únicos</label><b>'+fi(allProducts.size)+'</b></div>'+
      '<div><label>Rotación</label><b>'+fi(rotSet.size)+'</b></div>'+
      '<div><label>Evacuación</label><b>'+fi(evacSet.size)+'</b></div>'+
      '<div><label>Ambientes</label><b>'+fi(ambSet.size)+'</b></div>'+
    '</div>'+
    '<div class="v160OrderList">'+(orderCards||'<div class="empty">No hay órdenes Pendiente, En picking o En ruta con impacto.</div>')+'</div>'+
    '<div class="v127Hint">Se muestran únicamente órdenes con estado Pendiente, En picking o En ruta; las entregadas no aparecen. El producto, la orden y el ambiente abren su detalle sin modificar ninguna selección.</div>'
  );
};
/* Redirige toda implementación previa (v117/v127/v145/v147/v148 y la tarjeta original v8615 con kind "critical") a esta única versión activa. */
window.openTransferImpact117=window.openTransferImpact127=window.openTransferImpact148=window.openTransferImpact=window.openTransferPendingImpact;
(function applyKpi8615ImpactRedirectV161(){
  /* V86.161 fix: en la carga multi-archivo, assets/app.js se ejecuta de inmediato, pero
     window.openTransferKpi8615 solo existe una vez que llaveroAppSource se inyecta tras
     cargar data/llavero.json(.gz) de forma asíncrona. El guard original de una sola pasada
     (typeof window.openTransferKpi8615==='function') siempre era falso en ese momento y el
     redirect nunca se aplicaba, dejando la tarjeta "Productos con impacto por entregar"
     abriendo el modal genérico de traslados. Se reintenta hasta que la función base exista. */
  if(typeof window.openTransferKpi8615==='function'&&!window.openTransferKpi8615.__v161ImpactRedirect){
    var v160OrigOpenTransferKpi8615=window.openTransferKpi8615;
    window.openTransferKpi8615=function(kind){if(kind==='critical'||kind==='impact117'||kind==='impact'){window.openTransferPendingImpact();return;}return v160OrigOpenTransferKpi8615.apply(this,arguments);};
    window.openTransferKpi8615.__v161ImpactRedirect=true;
    window.openTransferKpi862=window.openTransferKpi80=window.openTransferKpi8615;
    return;
  }
  if(typeof window.openTransferKpi8615!=='function')setTimeout(applyKpi8615ImpactRedirectV161,150);
})();
function isImpactCard(card){var lab=card&&card.querySelector&&card.querySelector('.transferMetricLabel8616,label,.lab'),txt=norm(lab?lab.textContent:card&&card.textContent);return txt.indexOf('PRODUCTOS CON IMPACTO POR ENTREGAR')>=0||txt.indexOf('PRODUCTOS CON IMPACTO')>=0||txt.indexOf('PRODUCTOS CRÍTICOS')>=0||txt.indexOf('PRODUCTOS CRITICOS')>=0}
function bindTransferCard(){if(currentView()!=='traslados')return;
  /* V86.161: la tarjeta debe reflejar el MISMO universo que su modal de detalle (Pendiente, En picking
     y En ruta - ver transferOrderImpactRows160/openTransferPendingImpact). Antes usaba transferDetailRows(),
     que internamente solo cuenta estatus "Pendiente" (pendingRows()), así que órdenes En picking/En ruta con
     impacto quedaban en 0 en la tarjeta aunque el modal sí las mostrara. */
  var rows=[];(typeof transferOrderImpactRows160==='function'?transferOrderImpactRows160():[]).forEach(function(o){(o.products||[]).forEach(function(p){rows.push(p);});});
  var rc=new Set(rows.filter(function(r){return r.rot;}).map(function(r){return r.code;})).size,ec=new Set(rows.filter(function(r){return r.evac;}).map(function(r){return r.code;})).size,ac=new Set(rows.filter(function(r){return r.guides&&r.guides.length;}).map(function(r){return r.code;})).size,total=new Set(rows.map(function(r){return r.code;})).size;document.querySelectorAll('#content .transferMetricCard8616,#content .v80TransferKpi,#content .transferKpi8615').forEach(function(card){if(!isImpactCard(card))return;var val=card.querySelector('strong,b,.val'),sub=card.querySelector('small,.sub');if(val)val.textContent=fi(total);if(sub)sub.textContent=fi(rc)+' Rotación · '+fi(ec)+' Evacuación · '+fi(ac)+' Ambientes';card.onclick=function(e){if(e){e.preventDefault();e.stopPropagation();}window.openTransferImpact148();};card.style.cursor='pointer';});}

/* V86.155 · restauración funcional V154: cuatro reglas, sin simplificar ni eliminar información. */
function renderMarkdownRuleCards155(){
  if(currentView()!=='markdown')return;
  var root=document.getElementById('content');if(!root)return;
  var card=Array.from(root.querySelectorAll('.card')).find(function(c){var t=c.querySelector('.tt');return t&&s(t.textContent).trim()==='Productos a gestionar por regla';});
  if(!card)return;
  var body=card.querySelector('.cbody');if(!body)return;
  var rows=[];try{if(typeof window.mdRows8618==='function')rows=window.mdRows8618(CUR)||[];else if(typeof window.mdRows8664==='function')rows=window.mdRows8664(CUR)||[];}catch(_){rows=[]}
  if(!Array.isArray(rows))rows=[];
  var managed=rows.filter(function(r){return r&&r.actionable;}),total=managed.length||1;
  var defs=[
    ['star','Rotación Estrella','Productos estrella','k-rot','i-rot'],
    ['rest','Rotación resto surtido','Resto del surtido','k-vta','i-vta'],
    ['outside','Fuera de surtido','Incluye última unidad','k-evac','i-evac'],
    ['last_unit','Fuera de surtido · última unidad','Solo CENDIS 0 + 1 unidad en tienda','k-evac','i-evac']
  ];
  function listFor(kind){return managed.filter(function(r){if(kind==='outside')return r.typeKey==='fs'||r.typeKey==='fs_last';if(kind==='last_unit')return r.typeKey==='fs_last';return r.typeKey===kind;});}
  body.innerHTML='<div class="v8618KpiGrid mdRuleGrid8648">'+defs.map(function(d){var list=listFor(d[0]),units=list.reduce(function(a,r){return a+n(r.stock);},0),pct=list.length/total*100;return '<div class="kpi v8618Card '+d[3]+'" role="button" tabindex="0" data-v155-md-rule="'+d[0]+'"><div class="top"><div class="ico '+d[4]+'">↗</div><span class="v8618Arrow">Ver detalle →</span></div><div class="lab">'+d[1]+'</div><div class="val">'+fi(list.length)+'</div><div class="sub">'+fi(units)+' u · '+pct.toFixed(1)+'% de los productos a gestionar</div></div>';}).join('')+'</div>';
}

function patchTracking(){
  var root=document.querySelector('#content .v128Tracking');if(!root)return;
  root.querySelectorAll('.v8680TrackProducts b,.trackingMetric b').forEach(function(x){
    x.title=s(x.textContent).trim();x.style.removeProperty('font-size');
    var fs=parseFloat(getComputedStyle(x).fontSize)||13,guard=0;
    while(x.clientWidth>0&&x.scrollWidth>x.clientWidth&&fs>8&&guard<18){fs-=.5;x.style.setProperty('font-size',fs+'px','important');guard++}
  })
}
function mark(){try{var raw=s((typeof DB!=='undefined'&&DB&&DB.meta&&DB.meta.fecha)||'2026-08-20').slice(0,10),a=raw.split('-'),cut=a.length===3?a[2]+'/'+a[1]+'/'+a[0]:raw;window.LLAVERO_BUILD=VERSION;document.documentElement.setAttribute('data-llavero-build',VERSION);document.documentElement.setAttribute('data-llavero-app-version',VERSION);document.documentElement.setAttribute('data-preview',VERSION);document.title='Llavero · Inventarios Jamar · '+cut+' · '+VERSION;var chip=document.querySelector('.appVersionChip b');if(chip)chip.textContent=cut+' · '+VERSION}catch(_){}}
function patchAll(){mark();syncUpcoming();patchTracking();renderMarkdownRuleCards155();if(currentView()==='amb'){ensureGuideRules();patchAmbientImpact();ensureAmbienteExportButton()}if(currentView()==='rot'){ensureGuideRules();flagAmbienteInRotacion()}bindTransferCard();patchCanonicalDetails();patchGuideDetail();decorateTables(document)}

/* Delegación robusta: evita que parches anteriores abran el detalle equivocado. */
document.addEventListener('click',function(e){
  var card=e.target&&e.target.closest?e.target.closest('.transferMetricCard8616,.v80TransferKpi,.transferKpi8615'):null;if(card&&currentView()==='traslados'&&isImpactCard(card)){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();window.openTransferImpact148();return}
  var mr=e.target&&e.target.closest?e.target.closest('[data-v155-md-rule]'):null;if(mr){e.preventDefault();e.stopPropagation();var kind=mr.dataset.v155MdRule;try{if(window.V8620&&typeof window.V8620.openMarkdownMetric==='function')window.V8620.openMarkdownMetric(kind);else if(typeof window.openMdRule8664==='function')window.openMdRule8664(kind)}catch(_){}return}
  var d=e.target&&e.target.closest?e.target.closest('[data-v155-delivery]'):null;if(d){e.preventDefault();e.stopPropagation();var order=d.dataset.v155Delivery;try{if(typeof closeRangeModal==='function')closeRangeModal()}catch(_){}setTimeout(function(){try{if(typeof window.openDelivery862==='function')window.openDelivery862(order,CUR);else if(typeof window.openDelivery80==='function')window.openDelivery80(order,CUR)}catch(_){}},40);return}
  var g=e.target&&e.target.closest?e.target.closest('[data-v148-guide],[data-v155-guide]'):null;if(g){e.preventDefault();e.stopPropagation();var code=g.dataset.v155Guide||g.dataset.v148Guide;try{if(typeof closeRangeModal==='function')closeRangeModal()}catch(_){}setTimeout(function(){if(typeof window.openGuideDetailV49==='function')window.openGuideDetailV49(code)},40);return}
  var p=e.target&&e.target.closest?e.target.closest('[data-v155-product]'):null;if(p){e.preventDefault();e.stopPropagation();var pc=p.dataset.v155Product;try{if(typeof window.openInventoryProduct==='function')window.openInventoryProduct(pc);else if(typeof window.openBestProductDetail==='function')window.openBestProductDetail(pc);}catch(_){}return}
},true);

function wrap(name,pre,post){var fn=window[name];if(typeof fn!=='function'||fn.__v148)return;var w=function(){if(pre)try{pre.apply(this,arguments)}catch(_){}var out=fn.apply(this,arguments);setTimeout(function(){if(post)post();patchAll()},35);setTimeout(function(){if(post)post();patchAll()},220);if(name==='setView'||name==='refresh'){[80,260,460,1050,2450].forEach(function(ms){setTimeout(mark,ms)})}return out};w.__v148=true;window[name]=w;try{if(name==='setView')setView=w;else if(name==='refresh')refresh=w;else if(name==='drawGuias')drawGuias=w;else if(name==='drawTr8615')drawTr8615=w;else if(name==='openCendisModule868')openCendisModule868=w;else if(name==='openGuideDetailV49')openGuideDetailV49=w;else if(name==='renderGuideDetailV49')renderGuideDetailV49=w}catch(_){}}
function install(){
  if(typeof S==='undefined'||!S||typeof window.setView!=='function'){setTimeout(install,120);return}
  mark();ensureGuideRules();observeTables155();decorateTables(document);
  var rebuild=window.llaveroRebuildAllGuideData;if(typeof rebuild==='function'&&!rebuild.__v148){var wr=function(){var o=rebuild.apply(this,arguments);try{Object.keys(S||{}).forEach(function(k){applyGuideRules(S[k])})}catch(_){}return o};wr.__v148=true;window.llaveroRebuildAllGuideData=wr}
  wrap('setView',function(v){if(v==='amb')ensureGuideRules()},null);wrap('refresh',function(){if(currentView()==='amb')ensureGuideRules()},null);wrap('drawGuias',ensureGuideRules,patchAmbientImpact);wrap('drawTr8615',null,bindTransferCard);wrap('openCendisModule868',null,patchCendisFilters);
  var og=window.openGuideDetailV49;if(typeof og==='function'&&!og.__v148active){var wg=function(code){activeGuide=s(code);guideFilter={q:'',floor:'all',status:'all'};ensureGuideRules();var o=og.apply(this,arguments);setTimeout(patchGuideDetail,30);setTimeout(patchGuideDetail,180);return o};wg.__v148=true;wg.__v148active=true;window.openGuideDetailV49=wg;try{openGuideDetailV49=wg;openGuideDetailV48=wg}catch(_){}}
  var rg=window.renderGuideDetailV49;if(typeof rg==='function'&&!rg.__v148){var wgr=function(){var o=rg.apply(this,arguments);setTimeout(patchGuideDetail,20);setTimeout(patchGuideDetail,140);return o};wgr.__v148=true;window.renderGuideDetailV49=wgr;try{renderGuideDetailV49=wgr}catch(_){}}
  ['openTrendDetail80','openTrendDetail79','openComposition8664','openInventoryClass869'].forEach(function(name){wrap(name,null,patchCanonicalDetails)});
  if(window.V8695&&typeof V8695.status==='function'&&!V8695.status.__v148){var md=V8695.status;var wmd=function(){var o=md.apply(this,arguments);setTimeout(patchCanonicalDetails,30);setTimeout(patchCanonicalDetails,220);return o};wmd.__v148=true;V8695.status=wmd}
  document.addEventListener('change',function(e){if(e.target&&e.target.id==='store'){setTimeout(function(){ensureGuideRules();patchAll()},90)}},true);
  [40,220,650,1400].forEach(function(ms){setTimeout(patchAll,ms)});[3500,8000,12000,16000].forEach(function(ms){setTimeout(mark,ms)});
  console.info('LLAVERO V86.155 · Traslados, Ambientes y tablas consolidados sin duplicados');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.addEventListener('llavero:bootstrapped',function(){setTimeout(install,80)},{once:true});
window.addEventListener('llavero:view-stable',function(){setTimeout(patchAll,45)});
})();

