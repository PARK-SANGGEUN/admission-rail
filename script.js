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
  const colleges=uniq(DATA.map(d=>d.college));
  const sel=document.getElementById('college');
  sel.innerHTML=colleges.map(c=>`<option>${c}</option>`).join('');
  sel.onchange=render;
}

function render(){
  const college=document.getElementById('college').value;
  const rows=DATA.filter(d=>d.college===college);

  const wrap=document.getElementById('rails');
  wrap.innerHTML='';

  const explain=document.getElementById('explain');

  // group by track
  const tracks=uniq(rows.map(d=>d.track));

  // metric priority
  const metricPriority=['70%컷','50%컷','등록자내신평균'];

  let chosenMetric='';
  for(const m of metricPriority){
    if(rows.some(r=>r.metric===m)){
      chosenMetric=m;
      break;
    }
  }

  explain.innerHTML=`
    <b>[${college}]</b><br/>
    본 화면은 ${college}의 전형별 모집단위 성적 분포를
    <b>${chosenMetric}</b> 기준으로
    <b>2024~2026학년도 3개년</b>을 동시에 비교한 자료입니다.
  `;

  tracks.forEach(track=>{
    const rws=rows.filter(r=>r.track===track && r.metric===chosenMetric);
    if(!rws.length) return;

    const rail=document.createElement('div');
    rail.className='rail';
    rail.innerHTML=`<div class="rail-title">${track}</div>
      <div class="track-wrap"><div class="track"></div></div>
      <div class="legend">
        <span style="color:var(--y2024)">● 2024</span>
        <span style="color:var(--y2025)">● 2025</span>
        <span style="color:var(--y2026)">● 2026</span>
      </div>
    `;

    const bar=rail.querySelector('.track');

    const years=[2024,2025,2026];
    years.forEach(y=>{
      const vals=rws.filter(r=>r.year===y).map(r=>r.value);
      if(!vals.length) return;
      const min=Math.min(...vals), max=Math.max(...vals);
      const avg=vals.reduce((a,b)=>a+b,0)/vals.length;

      const avgLine=document.createElement('div');
      avgLine.className=`avg-line avg-${y}`;
      avgLine.style.left=`${((avg-min)/(max-min))*100}%`;
      bar.appendChild(avgLine);

      rws.filter(r=>r.year===y).forEach(r=>{
        const p=document.createElement('div');
        p.className=`year-row y${y} point`;
        const x=((r.value-min)/(max-min))*100;
        p.style.left=`${x}%`;
        p.innerHTML=`<div class="dot"></div>${r.unit} ${r.value.toFixed(2)}`;
        bar.appendChild(p);
      });
    });

    wrap.appendChild(rail);
  });
}
