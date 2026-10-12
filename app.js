'use strict';
const K='brockTracker.v1';
const DEF={settings:{heightIn:70,age:30,sex:'male',calMin:2000,calMax:2400,calFloor:1800,protMin:140,protMax:160,water:100,waterMin:90,waterMax:110,goalLo:0,goalHi:0,checkpoint:0},weighins:[],days:{}};
let S=load();function load(){try{const d=JSON.parse(localStorage.getItem(K));if(d)return Object.assign(structuredClone(DEF),d)}catch(e){}return structuredClone(DEF)}
function save(){localStorage.setItem(K,JSON.stringify(S))}
const $=s=>document.querySelector(s);const iso=d=>{const z=new Date(d);z.setMinutes(z.getMinutes()-z.getTimezoneOffset());return z.toISOString().slice(0,10)};
let cur=iso(new Date()),tab='today';
function day(k=cur){const D={water:[],steps:0,circuit:[0,0,0,0],walk:false,meals:[],bed:'',wake:''};if(S.days[k])return Object.assign(S.days[k],Object.assign(D,S.days[k]));return (S.days[k]={water:[],steps:0,circuit:[0,0,0,0],walk:false,meals:[],bed:'',wake:''})}
function stepGoal(k){return k<='2026-10-11'?8000:k<'2026-10-19'?9000:10000}
const dow=k=>new Date(k+'T12:00').getDay();const walkDay=k=>[1,3,5].includes(dow(k));const weighDay=k=>[1,5].includes(dow(k));
const sum=a=>a.reduce((x,y)=>x+y,0);
function sleepHrs(d){if(d.sleepMin)return d.sleepMin/60;if(!d.bed||!d.wake)return 0;const[a,b]=d.bed.split(':').map(Number),[c,e]=d.wake.split(':').map(Number);let m=(c*60+e)-(a*60+b);if(m<0)m+=1440;return m/60}
function bar(v,g){return `<div class="bar"><i style="width:${Math.min(100,g?v/g*100:0)}%"></i></div>`}
function latest(){return S.weighins.slice().sort((a,b)=>a.date<b.date?-1:1).at(-1)||{weight:200}}
function lastComp(){return S.weighins.filter(w=>w.bf).sort((a,b)=>a.date<b.date?-1:1).at(-1)}
function derived(){const w=latest().weight,c=lastComp(),bf=c?c.bf:25;const lean=w*(1-bf/100),kg=lean*0.4536;
 return{w,bf,lean,bmr:Math.round(370+21.6*kg),bmi:(703*w/S.settings.heightIn**2),prot:[Math.round(lean*0.9/5)*5,Math.round(lean/5)*5],water:Math.round(w/2/5)*5}}
function score(k){const d=S.days[k];if(!d)return null;const s=S.settings;return{water:sum(d.water)>=s.waterMin,steps:d.steps>=stepGoal(k),circuit:d.circuit.every(x=>x),walk:!walkDay(k)||d.walk,
 prot:sum(d.meals.map(m=>+m.p||0))>=s.protMin}}
function streak(key){let n=0,t=new Date(cur+'T12:00');for(;;){const k=iso(t),sc=score(k);if(sc&&sc[key])n++;else if(k!==cur)break;t.setDate(t.getDate()-1);if(n>999)break}return n}
const V={};
V.today=()=>{const d=day(),s=S.settings,w=sum(d.water),g=stepGoal(cur),cal=sum(d.meals.map(m=>+m.c||0)),p=sum(d.meals.map(m=>+m.p||0));
 const items=[['Water '+w+'/'+s.water+' oz',w>=s.waterMin],['Steps '+d.steps+'/'+g,d.steps>=g],['Night circuit '+d.circuit.filter(x=>x).length+'/4',d.circuit.every(x=>x)],
 ['Protein '+p+'/'+s.protMin+' g',p>=s.protMin],['Calories '+cal+' ('+s.calMin+'–'+s.calMax+')',cal>=s.calFloor&&cal<=s.calMax]];
 if(walkDay(cur))items.push(['20-min walk after dinner',d.walk]);if(weighDay(cur))items.push(['Weigh-in',S.weighins.some(x=>x.date===cur)]);
 const pct=Math.round(items.filter(i=>i[1]).length/items.length*100);
 return `<div class="card"><h2>Today ${pct}%</h2>${bar(pct,100)}${items.map(i=>`<div class="chk"><b>${i[1]?'✅':'⬜'}</b>${i[0]}</div>`).join('')}
 <p class="muted">Kitchen closes 8 PM. Bed 10–11 PM, wake 6:30.</p></div>
 <div class="card"><h2>💧 Water</h2><div class="big">${w} oz</div>${bar(w,s.water)}<div class="muted">Goal ${s.water} oz (${s.waterMin}–${s.waterMax})</div>
 ${[8,16,20,32].map(n=>`<button onclick="addW(${n})">+${n}</button>`).join('')}<button class="sec" onclick="undoW()">Undo</button></div>
 <div class="card"><h2>👟 Steps</h2>${bar(d.steps,g)}<div class="row"><input type="number" inputmode="numeric" value="${d.steps||''}" placeholder="Steps" onchange="setF('steps',+this.value)"></div><div class="muted">Goal ${g.toLocaleString()}</div></div>
 <div class="card"><h2>💪 Night circuit</h2><div class="muted">Per round: 20 pushups · 25 squats · 12 lunges/leg · 45s plank</div>
 ${d.circuit.map((x,i)=>`<button class="${x?'done':'sec'}" onclick="tg(${i})">Round ${i+1}</button>`).join('')}</div>
 ${walkDay(cur)?`<div class="card"><h2>🚶 Post-dinner walk (20 min)</h2><button class="${d.walk?'done':'sec'}" onclick="setF('walk',${!d.walk})">${d.walk?'Done':'Mark done'}</button></div>`:''}
 <div class="card"><h2>😴 Sleep (last night)</h2><div class="row"><label>Bed<input type="time" value="${d.bed}" onchange="setF('bed',this.value)"></label><label>Wake<input type="time" value="${d.wake}" onchange="setF('wake',this.value)"></label></div>
 <div class="big">${sleepHrs(d).toFixed(1)} h</div>
 <div class="row"><label>Sleep score<input type="number" value="${d.sleepScore||''}" onchange="setF('sleepScore',+this.value)"></label><label>Resting HR<input type="number" value="${d.rhr||''}" onchange="setF('rhr',+this.value)"></label><label>Cal burned<input type="number" value="${d.burned||''}" onchange="setF('burned',+this.value)"></label></div></div>`};
V.food=()=>{const d=day(),s=S.settings,cal=sum(d.meals.map(m=>+m.c||0)),p=sum(d.meals.map(m=>+m.p||0));
 return `<div class="card"><h2>Totals</h2>Calories <b>${cal}</b> / ${s.calMin}–${s.calMax} ${cal&&cal<s.calFloor?'<span class="muted">(under floor '+s.calFloor+')</span>':''}${bar(cal,s.calMax)}
 Protein <b>${p} g</b> / ${s.protMin}–${s.protMax} g${bar(p,s.protMin)}<p class="muted">Plate rule: ½ veggies, palm of lean protein, fist of starch. Don't skip lunch (gout). Kitchen closes 8 PM.</p></div>
 <div class="card"><h2>Add meal</h2><select id="mt"><option>Lunch</option><option>Dinner</option><option>Snack</option></select><input id="mn" placeholder="What did you eat?">
 <div class="row"><input id="mc" type="number" inputmode="numeric" placeholder="Calories"><input id="mp" type="number" inputmode="numeric" placeholder="Protein g"></div><button onclick="addM()">Add</button></div>
 <div class="card"><table>${d.meals.map((m,i)=>`<tr><td>${m.t}</td><td>${esc(m.n)}</td><td>${m.c}</td><td>${m.p}g</td><td><button class="sec" onclick="delM(${i})">✕</button></td></tr>`).join('')||'<tr><td class="muted">No meals yet</td></tr>'}</table></div>`};
V.body=()=>{const x=derived(),s=S.settings,ws=S.weighins.slice().sort((a,b)=>a.date<b.date?1:-1);
 return `<div class="card"><h2>Now: ${x.w} lb</h2><div class="muted">BMI ${x.bmi.toFixed(1)} · BF ${x.bf}% · Lean ${x.lean.toFixed(0)} lb · BMR ${x.bmr} (Katch-McArdle)</div>
 <div class="muted">Checkpoint ${s.checkpoint} · Goal ${s.goalLo}–${s.goalHi}</div>${chart()}</div>
 <div class="card"><h2>New weigh-in ${weighDay(cur)?'(today is a weigh-in day)':''}</h2><input id="wd" type="date" value="${cur}"><div class="row"><input id="ww" type="number" step="0.1" placeholder="Weight lb"><input id="wb" type="number" step="0.1" placeholder="Body fat %"></div>
 <div class="row"><input id="wm" type="number" step="0.1" placeholder="Muscle lb"><input id="wo" type="number" step="0.1" placeholder="Bone lb"><input id="wa" type="number" step="0.1" placeholder="Water %"></div>
 <button onclick="addWI()">Save weigh-in</button></div>
 <div class="card"><table><tr><th>Date</th><th>lb</th><th>BF%</th><th>Musc</th><th>Bone</th><th>H2O%</th><th></th></tr>${ws.map(w=>`<tr><td>${w.date.slice(5)}</td><td>${w.weight}</td><td>${w.bf??''}</td><td>${w.muscle??''}</td><td>${w.bone??''}</td><td>${w.water??''}</td><td><button class="sec" onclick="delWI('${w.date}')">✕</button></td></tr>`).join('')}</table></div>`};
function chart(){const ws=S.weighins.slice().sort((a,b)=>a.date<b.date?-1:1),s=S.settings;if(!ws.length)return'';const W=340,H=180,P=30;
 const t=ws.map(w=>new Date(w.date).getTime()),t0=Math.min(...t),t1=Math.max(...t,t0+864e5);const lo=Math.min(s.goalLo||1e9,...ws.map(w=>w.weight))-5,hi=Math.max(...ws.map(w=>w.weight))+5;
 const X=v=>P+(v-t0)/(t1-t0)*(W-P-10),Y=v=>10+(hi-v)/(hi-lo)*(H-30);
 const ln=(v,c,l)=>`<line x1="${P}" x2="${W-10}" y1="${Y(v)}" y2="${Y(v)}" stroke="${c}" stroke-dasharray="4"/><text x="2" y="${Y(v)+4}" fill="${c}" font-size="10">${l}</text>`;
 return `<svg viewBox="0 0 ${W} ${H}" width="100%">${s.goalLo&&s.goalHi?`<rect x="${P}" width="${W-P-10}" y="${Y(s.goalHi)}" height="${Y(s.goalLo)-Y(s.goalHi)}" fill="#3ddc8422"/>${ln(s.goalHi,'#3ddc84',s.goalHi)}`:''}${s.checkpoint?ln(s.checkpoint,'#f5b942',s.checkpoint):''}${ln(hi-5,'#9aa3b2',Math.round(hi-5))}
 <polyline fill="none" stroke="#2b6cff" stroke-width="3" points="${ws.map((w,i)=>X(t[i])+','+Y(w.weight)).join(' ')}"/>${ws.map((w,i)=>`<circle cx="${X(t[i])}" cy="${Y(w.weight)}" r="4" fill="#fff"/>`).join('')}</svg>`}
function last30(){const a=[],t=new Date(cur+'T12:00');for(let i=29;i>=0;i--){const x=new Date(t);x.setDate(t.getDate()-i);a.push(iso(x))}return a}
function stepsChart(){const ks=last30(),v=ks.map(k=>(S.days[k]||{}).steps||0),mx=Math.max(10000,...v),W=340,H=140,bw=W/30;
 return `<svg viewBox="0 0 ${W} ${H}" width="100%">${v.map((n,i)=>`<rect x="${i*bw+1}" width="${bw-2}" y="${H-n/mx*(H-10)}" height="${n/mx*(H-10)}" fill="${n>=stepGoal(ks[i])?'#3ddc84':'#2b6cff'}"/>`).join('')}
 <polyline fill="none" stroke="#f5b942" stroke-dasharray="3" points="${ks.map((k,i)=>(i*bw+bw/2)+','+(H-stepGoal(k)/mx*(H-10))).join(' ')}"/></svg>`}
function calChart(){const ks=last30(),b=ks.map(k=>(S.days[k]||{}).burned||0),e=ks.map(k=>{const d=S.days[k];return d?sum(d.meals.map(m=>+m.c||0)):0}),mx=Math.max(1,...b,...e),W=340,H=140,X=i=>i*W/29,Y=v=>H-v/mx*(H-10);
 const seg=(a,c)=>{let out='',pts=[];a.forEach((v,i)=>{if(v)pts.push(X(i)+','+Y(v));else if(pts.length){out+=`<polyline fill="none" stroke="${c}" stroke-width="2" points="${pts.join(' ')}"/>`;pts=[]}});if(pts.length)out+=`<polyline fill="none" stroke="${c}" stroke-width="2" points="${pts.join(' ')}"/>`;return out+a.map((v,i)=>v?`<circle cx="${X(i)}" cy="${Y(v)}" r="2.5" fill="${c}"/>`:'').join('')};
 return `<svg viewBox="0 0 ${W} ${H}" width="100%">${seg(b,'#f5b942')}${seg(e,'#2b6cff')}</svg>`}
V.history=()=>{const rows=Object.keys(S.days).sort().reverse().slice(0,60);rows.forEach(k=>day(k));
 return `<div class="card"><h2>Streaks 🔥</h2><div class="row"><div>Water<div class="big">${streak('water')}</div></div><div>Steps<div class="big">${streak('steps')}</div></div><div>Circuit<div class="big">${streak('circuit')}</div></div><div>Protein<div class="big">${streak('prot')}</div></div></div></div>
 <div class="card"><h2>Steps, last 30 days</h2>${stepsChart()}</div><div class="card"><h2>Calories burned vs eaten</h2>${calChart()}<div class="muted"><span style="color:#f5b942">■</span> burned <span style="color:#2b6cff">■</span> eaten</div></div>
 <div class="card" style="overflow-x:auto"><table><tr><th>Day</th><th>H2O</th><th>Steps</th><th>Circ</th><th>Cal</th><th>Prot</th><th>Sleep</th><th>Scr</th><th>RHR</th><th>Burn</th></tr>${rows.map(k=>{const d=S.days[k];return`<tr onclick="go('${k}')"><td>${k.slice(5)}</td><td>${sum(d.water)}</td><td>${d.steps}</td><td>${d.circuit.filter(x=>x).length}/4</td><td>${sum(d.meals.map(m=>+m.c||0))}</td><td>${sum(d.meals.map(m=>+m.p||0))}</td><td>${sleepHrs(d).toFixed(1)}</td><td>${d.sleepScore||''}</td><td>${d.rhr||''}</td><td>${d.burned||''}</td></tr>`}).join('')}</table></div>`};
V.setup=()=>`<div class="card"><h2>Welcome! Quick setup</h2><p class="muted">Enter your latest scale numbers. Everything stays on this phone.</p>
 <div class="row"><input id="sw" type="number" step="0.1" placeholder="Weight lb"><input id="sb" type="number" step="0.1" placeholder="Body fat %"></div>
 <div class="row"><input id="sm" type="number" step="0.1" placeholder="Muscle lb"><input id="so" type="number" step="0.1" placeholder="Bone lb"><input id="sa" type="number" step="0.1" placeholder="Water %"></div>
 <div class="row"><input id="sh" type="number" placeholder="Height (in)"><input id="sg" type="number" placeholder="Age"><select id="sx"><option>male</option><option>female</option></select></div>
 <button onclick="doSetup()">Start</button></div>${importCard()}`;
function importCard(){return `<div class="card"><h2>Import personal starter data</h2><label class="muted">JSON file<input type="file" accept=".json,application/json" onchange="imp(this.files[0])"></label>
 <textarea id="pj" rows="4" style="width:100%;background:#0f1115;color:#e8eaed;border:1px solid #333b4a;border-radius:8px;padding:10px" placeholder="…or paste JSON here"></textarea><button onclick="impText($('#pj').value)">Import pasted JSON</button></div>`}
function doSetup(){const w=+$('#sw').value;if(!w)return alert('Weight is required');const o={date:iso(new Date()),weight:w};[['bf','#sb'],['muscle','#sm'],['bone','#so'],['water','#sa']].forEach(([k,q])=>{const v=+$(q).value;if(v)o[k]=v});
 const st=S.settings;st.heightIn=+$('#sh').value||st.heightIn;st.age=+$('#sg').value||st.age;st.sex=$('#sx').value;S.weighins=[o];
 const x=derived();st.calMin=Math.round(x.bmr*1.35/100)*100;st.calMax=st.calMin+200;st.calFloor=st.calMin-200;tab='today';recompute(true)}
V.settings=()=>{const s=S.settings,f=[['calMin','Calories min'],['calMax','Calories max'],['calFloor','Calorie floor'],['protMin','Protein min g'],['protMax','Protein max g'],['water','Water goal oz'],['waterMin','Water min oz'],['waterMax','Water max oz'],['goalLo','Goal weight low'],['goalHi','Goal weight high'],['checkpoint','Checkpoint'],['heightIn','Height in'],['age','Age']];
 return `<div class="card"><h2>Targets</h2>${f.map(([k,l])=>`<label>${l}<input type="number" value="${s[k]}" onchange="S.settings.${k}=+this.value;save()"></label>`).join('')}
 <button onclick="recompute()">Recompute from latest weigh-in</button></div>
 <div class="card"><h2>Backup</h2><button onclick="exp()">Export JSON</button></div>${importCard()}
 <p class="muted">Steps goal: 8k through Oct 11, 9k from Oct 12, 10k from Oct 19. Not medical advice.</p>`};
function recompute(silent){const x=derived(),s=S.settings;s.protMin=x.prot[0];s.protMax=x.prot[1];s.water=x.water;s.waterMin=x.water-10;s.waterMax=x.water+10;save();if(!silent)alert(`BMR ${x.bmr}, lean ${x.lean.toFixed(0)} lb\nProtein ${s.protMin}-${s.protMax} g\nWater ${s.water} oz`);render()}
function esc(t){return String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function addW(n){day().water.push(n);save();render()}function undoW(){day().water.pop();save();render()}
function setF(k,v){day()[k]=v;save();render()}function tg(i){const d=day();d.circuit[i]=d.circuit[i]?0:1;save();render()}
function addM(){const n=$('#mn').value.trim();if(!n)return;day().meals.push({t:$('#mt').value,n,c:+$('#mc').value||0,p:+$('#mp').value||0});save();render()}
function delM(i){day().meals.splice(i,1);save();render()}
function addWI(){const w=+$('#ww').value;if(!w)return;const o={date:$('#wd').value,weight:w};[['bf','#wb'],['muscle','#wm'],['bone','#wo'],['water','#wa']].forEach(([k,s])=>{const v=+$(s).value;if(v)o[k]=v});
 S.weighins=S.weighins.filter(x=>x.date!==o.date);S.weighins.push(o);save();recompute()}
function delWI(d){if(confirm('Delete '+d+'?')){S.weighins=S.weighins.filter(x=>x.date!==d);save();render()}}
function exp(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));a.download='brock-tracker-'+cur+'.json';a.click()}
function impText(t){try{const d=JSON.parse(t);if(!d||(!d.settings&&!d.weighins&&!d.days))throw 0;S={settings:Object.assign({},S.settings,d.settings||{}),weighins:d.weighins||S.weighins,days:Object.assign({},S.days,d.days||{})};save();tab='today';render();alert('Imported')}catch(e){alert('Invalid JSON')}}
function imp(f){if(f)f.text().then(impText)}
function go(k){cur=k;tab='today';render()}
function render(){if(!S.weighins.length&&tab!=='settings')tab='setup';$('#day').value=cur;$('#view').innerHTML=V[tab]();document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));window.scrollTo(0,0)}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;render()});$('#day').onchange=e=>{cur=e.target.value||iso(new Date());render()};
if(location.hash.startsWith('#import=')){try{let p=location.hash.slice(8).replace(/-/g,'+').replace(/_/g,'/');while(p.length%4)p+='=';const d=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(p),c=>c.charCodeAt(0))));if(!d||(!d.settings&&!d.weighins&&!d.days))throw 0;S={settings:Object.assign({},S.settings,d.settings||{}),weighins:d.weighins||S.weighins,days:Object.assign({},S.days,d.days||{})};save();tab='today';history.replaceState(null,'',location.pathname);render();alert('Your data is loaded')}catch(e){}}
if(V[location.hash.slice(1)])tab=location.hash.slice(1);render();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
