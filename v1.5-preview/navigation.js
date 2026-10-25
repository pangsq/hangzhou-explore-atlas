(()=>{'use strict';
const $=s=>document.querySelector(s), A=window.ATLAS;
const controls=$('.inputs');
controls.insertAdjacentHTML('beforeend',`<label>行程天数<select id="duration"><option value="all">全部天数</option><option value="1">1日</option><option value="2">2日</option><option value="multi">3日及以上</option></select></label><label>游玩主题<select id="theme"><option value="all">全部主题</option><option value="hike">登山与徒步</option><option value="culture">人文与博物馆</option><option value="water">湖水与湿地</option><option value="city">城市与古镇慢游</option></select></label><label>主交通方案<select id="transport"><option value="all">全部交通</option><option value="metro">地铁进城</option><option value="car">自驾为主</option><option value="rail">高铁 / 火车</option><option value="mixed">多种方案待选</option></select></label>`);
const cars=new Set(['L02','L03','L04','L05','L06','L07','L09','N01','N02','N03','N07','N08','N09']);
function matches(r){
 const duration=$('#duration').value,theme=$('#theme').value,transport=$('#transport').value,q=$('#search').value.trim().toLowerCase();
 const tags=r.tags.join(' '), mode=r.id.startsWith('F')||['N04','N05','N06','N10'].includes(r.id)?'rail':cars.has(r.id)?'car':r.id==='L01'?'metro':'mixed';
 const themes={hike:/徒步|登山|古道/.test(tags),culture:/博物馆|文化|文学|建筑|石窟|古都|陶瓷|藏书/.test(tags),water:/湖景|湿地|水城|运河|海景|赣江/.test(tags),city:/citywalk|古镇|老城|古村|村落/.test(tags)};
 return (duration==='all'||(duration==='multi'?r.days>=3:r.days===Number(duration)))&&(theme==='all'||themes[theme])&&(transport==='all'||transport===mode)&&(!q||[r.id,r.title,...r.tags].join(' ').toLowerCase().includes(q));
}
function filter(){let count=0;document.querySelectorAll('#collection .card').forEach(card=>{const id=new URLSearchParams(card.querySelector('a').hash.slice(1)).get('route'),r=A.routes.find(x=>x.id===id),ok=r&&matches(r);card.hidden=!ok;if(ok)count++;});
 const base=$('#people').value==='1'?'1人独行总额':'2人同行每人';$('#result-count').textContent=`${count} 条行程 · 金额为${base}，不是实时报价`;
 $('#filter-empty')?.remove();if(!count){const p=document.createElement('p');p.id='filter-empty';p.textContent='没有匹配的路线，试试减少筛选条件或搜索目的地。';$('#collection').append(p);}
}
$('#search').placeholder='搜索目的地、路线名或主题…';
$('#search').addEventListener('input',e=>{e.stopImmediatePropagation();filter();},true);
['duration','theme','transport'].forEach(id=>$('#'+id).addEventListener('change',filter));
const hint=document.createElement('p');hint.className='map-scope';hint.textContent='关键词只匹配目的地、路线名和主题；交通按现有主方案筛选，铁路班次与地铁换乘仍须出发前核实。';controls.after(hint);
new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&n.classList.contains('card'))))filter();}).observe($('#collection'),{childList:true});
$('#people').addEventListener('change',filter);
function enhanceRoute(){const detail=$('#detail');if(detail.hidden||!detail.querySelector('.route-head')||detail.querySelector('.route-toc'))return;
 const ids=[['导览','guide','.scenic-section'],['交通','transport-section',null],['日程','schedule',null],['详细地图','maps-section',null],['预算','budget-section',null],['出发检查','departure','.checks']];
 const headings={'怎么出发，住在哪里':'transport-section','留出休息的日程':'schedule','地图不是装饰，是这一段怎么走':'maps-section','舒服出行的预算':'budget-section'};
 detail.querySelectorAll('section>h2').forEach(h=>{if(headings[h.textContent])h.parentElement.id=headings[h.textContent];});
 ids.forEach(([,id,selector])=>{if(selector&&detail.querySelector(selector))detail.querySelector(selector).id=id;});
 const nav=document.createElement('nav');nav.className='route-toc';nav.setAttribute('aria-label','本路线快捷目录');
 ids.forEach(([label,id])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>document.getElementById(id)?.scrollIntoView({behavior:'instant',block:'start'});nav.append(b);});detail.querySelector('.route-head').after(nav);
 const route=A.routes.find(r=>location.hash.includes('route='+r.id));if(route)document.title=route.title+'｜杭与城 V1.5 Preview';
}
new MutationObserver(enhanceRoute).observe($('#detail'),{childList:true});
window.addEventListener('hashchange',()=>{if(!location.hash.includes('route='))document.title='杭与城 V1.5 Preview｜从城市日常到山水远方';filter();enhanceRoute();});
filter();enhanceRoute();

// Keep original image URLs as a progressive-enhancement fallback.
const dialog=document.createElement('dialog');dialog.className='image-reader';dialog.setAttribute('aria-label','地图与照片阅读器');
dialog.innerHTML=`<div class="reader-toolbar"><button type="button" data-act="close" aria-label="关闭阅读器，返回路线">关闭 / 返回</button><button type="button" data-act="prev" aria-label="上一页">←</button><span class="reader-page" aria-live="polite"></span><button type="button" data-act="next" aria-label="下一页">→</button><button type="button" data-act="out" aria-label="缩小">−</button><button type="button" data-act="fit">适宽</button><button type="button" data-act="in" aria-label="放大">＋</button><a class="reader-original" target="_blank" rel="noopener">打开原图 ↗</a></div><p class="reader-title"></p><div class="reader-canvas" tabindex="0" aria-label="图片区域，可滚动或拖动浏览"><img alt=""></div><p class="reader-status" aria-live="polite"></p>`;
document.body.append(dialog);let pages=[],page=0,zoom=1,returnFocus=null,drag=null;
const canvas=dialog.querySelector('.reader-canvas'),img=canvas.querySelector('img');
function scale(){img.style.width=Math.round(canvas.clientWidth*zoom)+'px';img.style.maxWidth='none';dialog.querySelector('[data-act=fit]').textContent=zoom===1?'适宽':Math.round(zoom*100)+'%';}
function show(){const p=pages[page];zoom=1;img.alt=p.title;img.src=p.url;dialog.querySelector('.reader-title').textContent=p.title;dialog.querySelector('.reader-page').textContent=`${page+1} / ${pages.length}`;dialog.querySelector('.reader-original').href=p.url;dialog.querySelector('[data-act=prev]').disabled=page===0;dialog.querySelector('[data-act=next]').disabled=page===pages.length-1;dialog.querySelector('.reader-status').textContent='加载中…';scale();canvas.scrollTo(0,0);}
img.onload=()=>dialog.querySelector('.reader-status').textContent='可放大后拖动或滚动浏览；手机支持双指缩放页面。';img.onerror=()=>dialog.querySelector('.reader-status').textContent='图片未能加载，可点击“打开原图”重试。';
document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||dialog.contains(a)||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;
 const url=new URL(a.href,location.href);if(url.origin!==location.origin||!(/\.(webp|png|svg|jpe?g)$/i.test(url.pathname))||!a.closest('#detail'))return;
 e.preventDefault();const group=a.closest('.scenic-pages')||a.closest('.photo-grid')||a.closest('section.section')||$('#detail');
 const seen=new Set();pages=[...group.querySelectorAll('a[href]')].filter(link=>{const u=new URL(link.href,location.href);if(u.origin!==location.origin||!(/\.(webp|png|svg|jpe?g)$/i.test(u.pathname))||seen.has(u.href))return false;seen.add(u.href);return true;}).map(link=>({url:link.href,title:link.querySelector('img')?.alt||link.closest('.map-panel')?.querySelector('h3')?.textContent||link.closest('figure')?.querySelector('strong')?.textContent||link.textContent.trim()}));
 page=Math.max(0,pages.findIndex(p=>p.url===a.href));returnFocus=a;dialog.showModal();document.body.classList.add('reader-open');show();
});
function act(action){if(action==='close')dialog.close();if(action==='prev'&&page>0){page--;show();}if(action==='next'&&page<pages.length-1){page++;show();}if(action==='fit'){zoom=1;scale();canvas.scrollTo(0,0);}if(action==='in'||action==='out'){zoom=Math.max(.5,Math.min(5,zoom*(action==='in'?1.4:1/1.4)));scale();}}
dialog.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)act(b.dataset.act);});
dialog.addEventListener('close',()=>{document.body.classList.remove('reader-open');returnFocus?.focus({preventScroll:true});});
dialog.addEventListener('keydown',e=>{const action={ArrowLeft:'prev',ArrowRight:'next','+':'in','=':'in','-':'out'}[e.key];if(action){e.preventDefault();act(action);}});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;drag={x:e.clientX,y:e.clientY,left:canvas.scrollLeft,top:canvas.scrollTop};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(drag){canvas.scrollLeft=drag.left+drag.x-e.clientX;canvas.scrollTop=drag.top+drag.y-e.clientY;}});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);img.draggable=false;
window.addEventListener('resize',()=>{if(dialog.open)scale();});window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();});
})();
