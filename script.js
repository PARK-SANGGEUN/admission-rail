
let DATA=[];

fetch('data.json')
  .then(r=>r.json())
  .then(d=>{
    DATA=d;
    init();
    render();
  });

function uniq(arr){return [...new Set(arr)]}

function init(){
  fill('college', uniq(DATA.map(d=>d.college)));
  fill('track', uniq(DATA.map(d=>d.track)));
  fill('metric', uniq(DATA.map(d=>d.metric)));
  fill('year', uniq(DATA.map(d=>d.year)));

  document.querySelectorAll('select').forEach(s=>s.onchange=render);
}

function fill(id, arr){
  const el=document.getElementById(id);
  el.innerHTML=arr.map(v=>`<option>${v}</option>`).join('');
}

function render(){
  const c=val('college'), t=val('track'), m=val('metric'), y=Number(val('year'));
  const rows=DATA.filter(d=>d.college===c && d.track===t && d.metric===m && d.year===y);

  const wrap=document.getElementById('rails');
  wrap.innerHTML='';

  if(!rows.length) return;

  const vals=rows.map(d=>d.value).filter(v=>isFinite(v));
  const min=Math.min(...vals), max=Math.max(...vals);
  const avg=vals.reduce((a,b)=>a+b,0)/vals.length;

  const rail=document.createElement('div');
  rail.className='rail';

  rail.innerHTML=`
    <div class="rail-header">
      <div class="rail-title">${c} · ${t}</div>
      <div class="stats">
        <div class="stat">${min.toFixed(2)}<span>최저</span></div>
        <div class="stat">${avg.toFixed(2)}<span>평균</span></div>
        <div class="stat">${max.toFixed(2)}<span>최고</span></div>
        <div class="stat">${vals.length}<span>표본수</span></div>
      </div>
    </div>
    <div class="track-bar"></div>
  `;

  const bar=rail.querySelector('.track-bar');

  for(let i=0;i<=10;i++){
    const ax=document.createElement('div');
    ax.className='axis';
    ax.style.left=`${i*10}%`;
    bar.appendChild(ax);
  }

  const avgLine=document.createElement('div');
  avgLine.className='avg-line';
  avgLine.style.left=`${((avg-min)/(max-min))*100}%`;
  bar.appendChild(avgLine);

  rows.forEach(r=>{
    const p=document.createElement('div');
    p.className='point';
    const x=((r.value-min)/(max-min))*100;
    p.style.left=`${x}%`;
    p.innerHTML=`
      <span class="dot" style="background:var(--track-${t})"></span>
      ${r.unit} ${r.value.toFixed(2)}
    `;
    bar.appendChild(p);
  });

  wrap.appendChild(rail);
}

function val(id){return document.getElementById(id).value}
