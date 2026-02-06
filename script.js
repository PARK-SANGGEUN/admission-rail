fetch('/admission-rail/data.json')
.then(r=>r.json())
.then(data=>{
  const sel=document.getElementById('college');
  const colleges=[...new Set(data.map(d=>d.college))];
  sel.innerHTML=colleges.map(c=>`<option>${c}</option>`).join('');
  sel.onchange=()=>render(sel.value,data);
  render(colleges[0],data);
});

function render(college,data){
  const rows=data.filter(d=>d.college===college);
  document.getElementById('summaryTitle').innerText=college+' 전형별 모집단위 산포도 레일';
  document.getElementById('summaryDesc').innerText='70%컷 → 50%컷 → 등록자 내신 평균 기준 자동 선택';

  const box=document.getElementById('rails');
  box.innerHTML='';

  const tracks=[...new Set(rows.map(r=>r.track))];

  tracks.forEach(trackName=>{
    const tr=rows.filter(r=>r.track===trackName);

    // metric priority
    const metrics=['70%컷','50%컷','등록자내신평균'];
    let metric=null;
    for(const m of metrics){
      if(tr.some(r=>r.metric===m)){ metric=m; break; }
    }
    const pts=tr.filter(r=>r.metric===metric);

    const vals=pts.map(p=>p.value);
    const min=Math.min(...vals), max=Math.max(...vals);
    const span=(max-min)||1;

    const rail=document.createElement('div');
    rail.className='rail';
    rail.innerHTML='<div class="rail-title">'+trackName+' ('+metric+')</div>';

    const track=document.createElement('div');
    track.className='track';

    // axis
    for(let i=0;i<=10;i++){
      const ax=document.createElement('div');
      ax.className='axis';
      ax.style.left=(i*10)+'%';
      track.appendChild(ax);
    }

    const yearY={2024:20,2025:60,2026:100};

    pts.forEach(p=>{
      const x=((p.value-min)/span)*100;
      const el=document.createElement('div');
      el.className='point y'+p.year;
      el.style.left=x+'%';
      el.style.top=yearY[p.year]+'px';
      el.innerHTML='<div class="dot"></div>'+p.unit+' '+p.value;
      track.appendChild(el);
    });

    rail.appendChild(track);
    box.appendChild(rail);
  });
}
