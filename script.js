const COLORS = {
  2024:'#2563eb',
  2025:'#16a34a',
  2026:'#dc2626'
};

fetch('data.json').then(r=>r.json()).then(DATA=>{
  const sel=document.getElementById('univSelect');
  Object.keys(DATA).forEach(u=>{
    const o=document.createElement('option');
    o.value=u;o.textContent=u;sel.appendChild(o);
  });

  const tooltip=document.createElement('div');
  tooltip.className='tooltip';
  document.body.appendChild(tooltip);

  sel.onchange=()=>render(sel.value);
  sel.value=Object.keys(DATA)[0];
  render(sel.value);

  function render(univ){
    document.getElementById('container').innerHTML='';
    document.getElementById('desc').innerHTML=
      `<h2>${univ} 전형별 모집단위 산포도 레일 (3개년 비교)</h2>
       <p>기준 성적은 전형별로 70%컷 → 50%컷 → 등록자 내신 평균 순으로 자동 선택됩니다.</p>`;

    Object.entries(DATA[univ]).forEach(([track, rows],ti)=>{
      const wrap=document.createElement('div');
      wrap.className='track';
      wrap.style.borderLeft=`10px solid ${['#e0f2fe','#ecfeff','#fef9c3','#fae8ff'][ti%4]}`;
      wrap.innerHTML=`<h2>${track}</h2><div class="svgwrap"><svg height="180"></svg></div>`;
      document.getElementById('container').appendChild(wrap);

      const svg=wrap.querySelector('svg');
      const vals=rows.map(d=>d.value).sort((a,b)=>a-b);
      const min=Math.min(...vals), max=Math.max(...vals);
      const scale=x=>60+(x-min)/(max-min)*1000;

      [2024,2025,2026].forEach((y,i)=>{
        const t=document.createElementNS('http://www.w3.org/2000/svg','text');
        t.setAttribute('x',10);t.setAttribute('y',40+i*40);
        t.textContent=y;
        t.setAttribute('class','year-label');
        t.setAttribute('fill',COLORS[y]);
        svg.appendChild(t);
      });

      const sorted=[...rows].sort((a,b)=>a.value-b.value);
      const labelSet=new Set([...sorted.slice(0,3),...sorted.slice(3,6),...sorted.slice(-3)]);

      rows.forEach((d,i)=>{
        const cx=scale(d.value);
        const cy=40+[2024,2025,2026].indexOf(d.year)*40;
        const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
        c.setAttribute('cx',cx);
        c.setAttribute('cy',cy);
        c.setAttribute('r',7);
        c.setAttribute('fill',COLORS[d.year]);
        c.classList.add('dot');

        c.onmousemove=e=>{
          if(!labelSet.has(d)){
            tooltip.style.display='block';
            tooltip.style.left=e.pageX+10+'px';
            tooltip.style.top=e.pageY-10+'px';
            tooltip.innerHTML=`${d.major}<br>${d.value}`;
          }
        };
        c.onmouseout=()=>tooltip.style.display='none';
        svg.appendChild(c);

        if(labelSet.has(d)){
          const tx=document.createElementNS('http://www.w3.org/2000/svg','text');
          tx.setAttribute('x',cx);
          tx.setAttribute('y',cy-12-(i%3)*12);
          tx.setAttribute('text-anchor','middle');
          tx.setAttribute('class','label');
          tx.textContent=`${d.major} ${d.value}`;
          svg.appendChild(tx);
        }
      });
    });
  }
});
