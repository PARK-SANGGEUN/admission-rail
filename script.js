const YEAR_COLOR = {2024:"#1d4ed8", 2025:"#16a34a", 2026:"#dc2626"};
const YEARS = [2024,2025,2026];

const TOOLTIP = document.getElementById("tooltip");

function fmt(n){
  if(!Number.isFinite(n)) return "-";
  const s = (Math.round(n*100)/100).toFixed(2);
  return s.replace(/\.00$/,'').replace(/(\.\d)0$/,'$1');
}
function mean(arr){
  const a = arr.filter(Number.isFinite);
  if(!a.length) return NaN;
  return a.reduce((p,c)=>p+c,0)/a.length;
}
function unique(arr){ return [...new Set(arr)]; }

function hashHue(str){
  let h=0;
  for(let i=0;i<str.length;i++) h = (h*31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

fetch("data.json").then(r=>r.json()).then(DATA=>{
  const sel = document.getElementById("collegeSelect");
  const colleges = Object.keys(DATA).sort((a,b)=>a.localeCompare(b,'ko'));
  sel.innerHTML = colleges.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  sel.value = colleges[0] || "";
  sel.addEventListener("change", ()=>renderCollege(DATA, sel.value));
  renderCollege(DATA, sel.value);
});

function renderCollege(DATA, college){
  const heroTitle = document.getElementById("heroTitle");
  const heroDesc  = document.getElementById("heroDesc");
  heroTitle.textContent = `${college} 전형별 모집단위 산포도 레일 (3개년 비교)`;

  // College-level dominant metric note: show per-track in cards; here show rule
  heroDesc.textContent =
    `전형별 기준 성적 자동 선택: 70%컷 → (없으면) 50%컷 → (없으면) 등록자 내신 평균. ` +
    `라벨은 상·중·하 각 3개만 표시(나머지는 점에 마우스 올리면 표시).`;

  const rails = document.getElementById("rails");
  rails.innerHTML = "";

  const tracks = (DATA[college] && DATA[college].tracks) ? DATA[college].tracks : [];

  tracks.forEach((tr, idx)=>{
    const accentHue = hashHue(tr.name);
    const accent = `hsl(${accentHue} 90% 70%)`;

    const card = document.createElement("section");
    card.className="railCard";
    card.style.setProperty("--accent", accent);

    const accentBar = document.createElement("div");
    accentBar.className="railAccent";

    const header = document.createElement("div");
    header.className="railHeader";

    const title = document.createElement("div");
    title.className="railTitle";
    title.textContent = tr.name;

    const meta = document.createElement("div");
    meta.className="railMeta";
    meta.textContent = `표시 기준: ${tr.metric} (2024·2025·2026)`;

    header.appendChild(title);
    header.appendChild(meta);

    const viewport = document.createElement("div");
    viewport.className="railViewport";

    const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
    const W = 1600;
    const left = 120, right = 60;
    const innerW = W - left - right;
    const laneY = {2024:70, 2025:150, 2026:230};
    const H = 280;

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", String(H));

    const pts = tr.points || [];
    // group by year
    const byYear = {};
    YEARS.forEach(y => byYear[y] = pts.filter(p=>p.year===y && Number.isFinite(p.value)));
    const allValues = pts.map(p=>p.value).filter(Number.isFinite);
    if(!allValues.length){
      card.appendChild(accentBar);
      card.appendChild(header);
      card.innerHTML += `<div class="railMeta" style="padding:8px 6px 0">데이터가 없습니다.</div>`;
      rails.appendChild(card);
      return;
    }

    let vmin = Math.min(...allValues);
    let vmax = Math.max(...allValues);
    if(vmin===vmax){ vmin -= 0.5; vmax += 0.5; }
    const pad = (vmax-vmin)*0.08;
    vmin -= pad; vmax += pad;

    const xScale = (v)=> left + ( (v - vmin) / (vmax - vmin) ) * innerW;

    // Ticks: 9 ticks, avoid overlap by spacing
    const TICKS = 8;
    for(let i=0;i<=TICKS;i++){
      const x = left + innerW*(i/TICKS);
      svg.appendChild(mkLine(x, 34, x, H-26, "axisLine"));
      const tv = vmin + (vmax-vmin)*(i/TICKS);
      const t = mkText(fmt(tv), x, 26, "tickText");
      t.setAttribute("text-anchor","middle");
      svg.appendChild(t);
    }

    // Year lanes + year labels (big)
    YEARS.forEach(y=>{
      const y0 = laneY[y];
      svg.appendChild(mkLine(left, y0, W-right, y0, "laneLine"));
      const yt = mkText(String(y), 22, y0+6, "yearText");
      yt.setAttribute("fill", YEAR_COLOR[y]);
      svg.appendChild(yt);
    });

    // Determine label targets per year: top3, mid3, bottom3
    const labelKey = new Set();
    YEARS.forEach(y=>{
      const list = byYear[y].slice().sort((a,b)=>a.value-b.value);
      const n = list.length;
      if(!n) return;

      const top = list.slice(0, Math.min(3,n));
      const bottom = list.slice(Math.max(0,n-3), n);

      const midStart = Math.max(0, Math.floor(n/2)-1);
      const mid = list.slice(midStart, Math.min(n, midStart+3));

      [...top, ...mid, ...bottom].forEach(p=> labelKey.add(keyOf(p)));
    });

    // Place dots and hover targets
    // Also compute labels with collision avoidance per year
    const labels = {2024:[], 2025:[], 2026:[]};
    YEARS.forEach(y=>{
      const list = byYear[y].slice().sort((a,b)=>a.value-b.value);
      list.forEach((p, idx)=>{
        const x = xScale(p.value);
        const y0 = laneY[y];

        const dot = mkCircle(x, y0, 9, YEAR_COLOR[y]);
        dot.setAttribute("class","dot");

        // hover target: keep pointer events on dot
        dot.style.cursor = "default";
        dot.addEventListener("mousemove", (ev)=>{
          if(!TOOLTIP) return;
          TOOLTIP.style.display="block";
          TOOLTIP.style.left = (ev.clientX + 12) + "px";
          TOOLTIP.style.top  = (ev.clientY - 12) + "px";
          TOOLTIP.innerHTML = `<div>${escapeHtml(p.unit)}</div>
                               <div class="t">${escapeHtml(tr.metric)} ${y}: <b>${fmt(p.value)}</b></div>`;
        });
        dot.addEventListener("mouseleave", ()=>{
          if(!TOOLTIP) return;
          TOOLTIP.style.display="none";
        });
        svg.appendChild(dot);

        if(labelKey.has(keyOf(p))){
          labels[y].push({x, y:y0, unit:p.unit, value:p.value});
        }
      });
    });

    // Draw labels with collision-avoidance: keep track of occupied x ranges
    YEARS.forEach(y=>{
      const items = labels[y].slice().sort((a,b)=>a.x-b.x);
      let lastX = -1e9;
      let flip = 1;
      items.forEach((it, i)=>{
        let dy = -18;
        if(it.x - lastX < 120){ // tight -> stagger
          dy = (-18) + flip*18;
          flip *= -1;
        }
        lastX = it.x;

        const text = mkText(`${it.unit} ${fmt(it.value)}`, it.x, it.y + dy, "label");
        text.setAttribute("text-anchor","middle");
        svg.appendChild(text);
      });
    });

    viewport.appendChild(svg);

    // stats for selected metric overall (all years combined)
    const values = allValues;
    const best = Math.min(...values);
    const worst = Math.max(...values);
    const avg = mean(values);
    const n = values.length;

    const stats = document.createElement("div");
    stats.className="statsRow";
    stats.appendChild(statBox("최고(가장 우수)", fmt(best)));
    stats.appendChild(statBox("평균", fmt(avg)));
    stats.appendChild(statBox("최저(가장 불리)", fmt(worst)));
    stats.appendChild(statBox("표본수(연도합)", String(n)));

    card.appendChild(accentBar);
    card.appendChild(header);
    card.appendChild(viewport);
    card.appendChild(stats);
    rails.appendChild(card);
  });
}

// SVG helpers
function mkLine(x1,y1,x2,y2,cls){
  const el = document.createElementNS("http://www.w3.org/2000/svg","line");
  el.setAttribute("x1", x1); el.setAttribute("y1", y1);
  el.setAttribute("x2", x2); el.setAttribute("y2", y2);
  if(cls) el.setAttribute("class", cls);
  return el;
}
function mkCircle(cx,cy,r,fill){
  const el = document.createElementNS("http://www.w3.org/2000/svg","circle");
  el.setAttribute("cx", cx); el.setAttribute("cy", cy);
  el.setAttribute("r", r);
  el.setAttribute("fill", fill);
  el.setAttribute("opacity","0.95");
  return el;
}
function mkText(txt,x,y,cls){
  const el = document.createElementNS("http://www.w3.org/2000/svg","text");
  el.textContent = txt;
  el.setAttribute("x", x); el.setAttribute("y", y);
  if(cls) el.setAttribute("class", cls);
  return el;
}
function statBox(k,v){
  const d = document.createElement("div");
  d.className="stat";
  d.innerHTML = `<div class="k">${escapeHtml(k)}</div><div class="v">${escapeHtml(v)}</div>`;
  return d;
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function keyOf(p){
  return `${p.unit}__${p.year}__${p.value}`;
}
