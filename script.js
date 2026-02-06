// GitHub Pages 안전: 전부 상대경로
const YEARS = [2024, 2025, 2026];
const YEAR_COLOR = {
  2024: "#1d4ed8",
  2025: "#16a34a",
  2026: "#dc2626",
};

const METRIC_PRIORITY = ["70%컷", "50%컷", "등록자내신평균"];

function fmt(n){
  if(!Number.isFinite(n)) return "-";
  // 소수 2자리까지, 불필요 0 제거
  const s = (Math.round(n*100)/100).toFixed(2);
  return s.replace(/\.00$/,'').replace(/(\.\d)0$/,'$1');
}
function mean(arr){
  const a = arr.filter(Number.isFinite);
  if(!a.length) return NaN;
  return a.reduce((p,c)=>p+c,0)/a.length;
}
function unique(arr){
  return [...new Set(arr)];
}

let DATA = null;

fetch("data.json")
  .then(r => r.json())
  .then(payload => {
    DATA = payload;
    init();
  })
  .catch(err => {
    console.error(err);
    document.getElementById("rails").innerHTML =
      `<div class="railCard"><div class="railTitle">데이터 로드 실패</div>
       <div class="railMeta">data.json 경로/형식을 확인해주세요.</div></div>`;
  });

function init(){
  const select = document.getElementById("collegeSelect");
  const colleges = unique(DATA.records.map(r => r.college));
  select.innerHTML = colleges.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

  select.addEventListener("change", () => renderCollege(select.value));
  select.value = colleges[0] || "";
  renderCollege(select.value);
}

function renderCollege(college){
  const heroTitle = document.getElementById("heroTitle");
  const heroDesc = document.getElementById("heroDesc");
  heroTitle.textContent = `${college} 전형별 모집단위 산포도 레일 (3개년 비교)`;
  heroDesc.textContent = `기준 성적은 전형별로 자동 선택됩니다: 70%컷 → (없으면) 50%컷 → (없으면) 등록자 내신 평균. (값이 클수록 오른쪽)`;

  const rails = document.getElementById("rails");
  rails.innerHTML = "";

  const order = (DATA.track_order && DATA.track_order[college]) ? DATA.track_order[college] : unique(DATA.records.filter(r=>r.college===college).map(r=>r.track));

  order.forEach(track => {
    const card = document.createElement("section");
    card.className = "railCard";

    const header = document.createElement("div");
    header.className = "railHeader";

    const title = document.createElement("div");
    title.className = "railTitle";
    title.textContent = track;

    const meta = document.createElement("div");
    meta.className = "railMeta";

    // pick metric
    const metric = pickMetric(college, track);
    meta.textContent = `표시 기준: ${metric} (2024·2025·2026)`;

    header.appendChild(title);
    header.appendChild(meta);

    const viewport = document.createElement("div");
    viewport.className = "railViewport";

    const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
    const W = 1200; // 넷플릭스처럼 큰 레일
    const H = 190;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", String(H));

    const pts = getPoints(college, track, metric);
    // if empty, show message
    if(!pts.length){
      card.appendChild(header);
      card.innerHTML += `<div class="railMeta" style="padding:8px 2px 0">데이터가 없습니다.</div>`;
      rails.appendChild(card);
      return;
    }

    const values = pts.map(p=>p.value).filter(Number.isFinite);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = (max - min) || 1;

    // axis ticks (10)
    for(let i=0;i<=10;i++){
      const x = 60 + (W-120) * (i/10);
      const line = mkLine(x, 32, x, H-20, "axisLine");
      svg.appendChild(line);

      const tVal = min + span*(i/10);
      const t = mkText(fmt(tVal), x, 22, "tickText");
      t.setAttribute("text-anchor","middle");
      svg.appendChild(t);
    }

    // year lanes (top-down)
    const laneY = {2024:55, 2025:105, 2026:155};

    // Reduce label overlap: per year, sort by x and stagger labels +/-
    const perYear = {};
    YEARS.forEach(y => perYear[y] = pts.filter(p=>p.year===y).slice().sort((a,b)=>a.value-b.value));

    YEARS.forEach(y => {
      const list = perYear[y];
      let lastX = -1e9;
      let flip = 1;
      list.forEach((p, idx) => {
        const x = 60 + (W-120) * ((p.value - min)/span);
        const yBase = laneY[y];
        const yJ = (x - lastX < 55) ? (yBase + (flip*14)) : yBase; // 겹치면 위/아래 살짝
        if(x - lastX < 55) flip *= -1;
        lastX = x;

        // dot
        const dot = mkCircle(x, yJ, 7, YEAR_COLOR[y]);
        svg.appendChild(dot);

        // label (unit + value)
        const label = `${p.unit} ${fmt(p.value)}`;
        const text = mkText(label, x, yJ - 10, "pointLabel");
        text.setAttribute("fill", YEAR_COLOR[y]);
        text.setAttribute("text-anchor","middle");
        svg.appendChild(text);
      });
    });

    viewport.appendChild(svg);

    // stats
    const stats = document.createElement("div");
    stats.className = "statsRow";
    const best = min;
    const worst = max;
    const avg = mean(values);
    const n = values.length;
    stats.appendChild(statBox("최고(가장 우수)", fmt(best)));
    stats.appendChild(statBox("평균", fmt(avg)));
    stats.appendChild(statBox("최저(가장 불리)", fmt(worst)));
    stats.appendChild(statBox("표본수", String(n)));

    card.appendChild(header);
    card.appendChild(viewport);
    card.appendChild(stats);
    rails.appendChild(card);
  });
}

function pickMetric(college, track){
  for(const m of METRIC_PRIORITY){
    if(DATA.records.some(r => r.college===college && r.track===track && r.metric===m && Number.isFinite(r.value) && YEARS.includes(r.year))){
      return m;
    }
  }
  // fallback: first existing metric
  const any = DATA.records.find(r => r.college===college && r.track===track && Number.isFinite(r.value) && YEARS.includes(r.year));
  return any ? any.metric : METRIC_PRIORITY[0];
}

function getPoints(college, track, metric){
  // build points for years
  const pts = DATA.records
    .filter(r => r.college===college && r.track===track && r.metric===metric && YEARS.includes(r.year) && Number.isFinite(r.value))
    .map(r => ({unit:r.unit, year:r.year, value:r.value}));
  return pts;
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
