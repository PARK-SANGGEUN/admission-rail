// Sample adaptive data model.
// Replace DATA with your real merged dataset (college, track, unit, year, metrics).
const DATA = [
  {college:'한양대학교', track:'학생부교과(추천형)', unit:'컴퓨터소프트웨어학부', year:2026, metric:'등록자내신평균', value:1.71},
  {college:'한양대학교', track:'학생부교과(추천형)', unit:'전기공학전공', year:2026, metric:'등록자내신평균', value:1.49},
  {college:'서강대학교', track:'지역균형', unit:'컴퓨터공학과', year:2026, metric:'70%컷', value:1.96},
  {college:'서강대학교', track:'지역균형', unit:'수학과', year:2026, metric:'70%컷', value:1.63},
  {college:'고려대학교', track:'학업우수', unit:'경영대학', year:2026, metric:'70%컷', value:2.18},
  {college:'성균관대학교', track:'학생부교과', unit:'경영학과', year:2026, metric:'70%컷', value:1.74},
];

const $ = sel => document.querySelector(sel);
const collegeSel = $('#college');
const trackSel = $('#track');
const metricSel = $('#metric');
const yearSel = $('#year');

const uniq = (arr, key) => [...new Set(arr.map(d=>d[key]))];

function fillSelect(sel, items){
  sel.innerHTML = items.map(v=>`<option value="${v}">${v}</option>`).join('');
}

fillSelect(collegeSel, uniq(DATA,'college'));
fillSelect(trackSel, uniq(DATA,'track'));
fillSelect(metricSel, uniq(DATA,'metric'));
fillSelect(yearSel, uniq(DATA,'year'));

const ctx = document.getElementById('rail').getContext('2d');
Chart.register(ChartDataLabels);

let chart;

function render(){
  const f = DATA.filter(d =>
    d.college===collegeSel.value &&
    d.track===trackSel.value &&
    d.metric===metricSel.value &&
    d.year==yearSel.value
  );

  const xs = f.map(d=>d.value);
  const min = Math.min(...xs), max = Math.max(...xs);
  const avg = xs.reduce((a,b)=>a+b,0)/xs.length;

  $('#minVal').textContent = min.toFixed(2);
  $('#maxVal').textContent = max.toFixed(2);
  $('#avgVal').textContent = avg.toFixed(2);
  $('#nVal').textContent = xs.length;

  const points = f.map((d,i)=>({x:d.value, y:0, label:d.unit}));

  if(chart) chart.destroy();
  chart = new Chart(ctx,{
    type:'scatter',
    data:{datasets:[{
      data:points,
      pointRadius:6,
      pointHoverRadius:8,
      backgroundColor:'rgba(45,212,191,.9)',
    }]} ,
    options:{
      responsive:true, maintainAspectRatio:false,
      scales:{
        y:{display:false, min:-1, max:1},
        x:{
          title:{display:true,text:`${metricSel.value} (${yearSel.value})`, color:'#0b1220', font:{size:16,weight:'800'}},
          grid:{color:'#e5e7eb'},
          ticks:{font:{size:14,weight:'700'}}
        }
      },
      plugins:{
        legend:{display:false},
        datalabels:{
          align:'top', anchor:'end', offset:4,
          formatter:(v,ctx)=>`${ctx.dataset.data[ctx.dataIndex].label} ${v.x.toFixed(2)}`,
          color:'#0b1220', font:{size:12,weight:'700'},
          clip:true
        },
        tooltip:{enabled:false}
      }
    }
  });

  // draw avg line
  const xScale = chart.scales.x;
  const y = chart.chartArea.top;
  const y2 = chart.chartArea.bottom;
  const cx = xScale.getPixelForValue(avg);
  const g = chart.ctx;
  g.save();
  g.strokeStyle = '#2dd4bf';
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(cx,y); g.lineTo(cx,y2); g.stroke();
  g.restore();
}

[collegeSel,trackSel,metricSel,yearSel].forEach(s=>s.addEventListener('change',render));
render();
