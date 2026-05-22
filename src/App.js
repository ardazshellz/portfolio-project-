// API via Vercel proxy
const fh = (path) => fetch(`/api/fh?path=${encodeURIComponent(path)}`).then(r=>r.json()).catch(()=>({}));
const t212 = () => fetch('/api/t212').then(r=>r.json()).catch(()=>({}));
import { useState, useMemo } from "react";

const C = {
  bg:"#07090d",sur:"#0c0f15",card:"#0f1420",border:"#1a2035",
  accent:"#00e0a8",gold:"#f0b429",red:"#ff3d58",blue:"#3d9eff",purple:"#a78bfa",
  text:"#dce2ed",muted:"#566078",faint:"#151b2d",
};
const cc = v => v==="high"?C.accent:v==="medium"?C.gold:C.red;
const cl = v => v==="high"?"HIGH":v==="medium"?"MED":"LOW";
const sc = s => s>=780?C.accent:s>=640?C.gold:s>=480?C.blue:C.red;

const STOCKS = [
  {ticker:"OSCR",name:"Oscar Health",      shares:342.14, avg:17.09,price:23.27,conv:"high",  score:827,cat:"Hypergrowth",   hold:"24–36mo",sector:"Healthcare",
   netCash:1200,sharesOut:342,dilution:3.5,
   hist:[{y:2021,rev:1920,revG:225.8,ni:-572,nim:-29.8,eps:-3.19},{y:2022,rev:4125,revG:114.8,ni:-606,nim:-14.7,eps:-2.87},{y:2023,rev:5862,revG:42.1,ni:-270,nim:-4.6,eps:-1.22},{y:2024,rev:7955,revG:35.7,ni:21,nim:0.28,eps:0.11}],
   thesis:"Technology-driven health insurer attacking a $1T+ TAM. Revenue +63% YoY. MLR improving. CEO guidance: $2.25 EPS and 5% operating margin by 2027.",
   bull:"MLR below 80%, EBITDA positive late 2025. $55–65.",base:"Steady MLR improvement, multiple expansion. $38–45.",bear:"Regulatory headwinds, capital raise. $15–17.",
   stop:20.50,trim:45,add:"$21–22",exit:19.00,
   aH:42,aL:18,aC:32,aBuy:72,aHold:20,aSell:8,aCount:18,
   peerPE:{low:20,mid:30,high:45},peerNote:"Early-stage health insurer. Peers trade 20–45x once profitable.",
   reliability:{score:58,label:"MODERATE",color:C.gold,note:"CEO 2027 guidance exists which helps. But margin path from -5% to +5% involves many variables. PE multiple highly uncertain pre-profitability."}},
  {ticker:"SOFI",name:"SoFi Technologies", shares:1896.97,avg:18.86,price:15.71,conv:"high",  score:740,cat:"Hypergrowth",   hold:"36–60mo",sector:"Fintech",
   netCash:2800,sharesOut:1100,dilution:2.0,
   hist:[{y:2021,rev:985,revG:68.2,ni:-484,nim:-49.1,eps:-0.52},{y:2022,rev:1521,revG:54.4,ni:-320,nim:-21.0,eps:-0.34},{y:2023,rev:2124,revG:39.6,ni:48,nim:2.3,eps:0.05},{y:2024,rev:2751,revG:29.5,ni:499,nim:18.1,eps:0.48}],
   thesis:"Becoming the Amazon of consumer finance. Bank charter is the moat. Rate cut cycle is the macro catalyst. H&S neckline at $15 is critical.",
   bull:"Rate cuts 2025, student loan refi boom. $28–35.",base:"Steady member growth, margin expansion. $20–24.",bear:"Rate cuts delayed, H&S breaks $15. $9–11.",
   stop:13.50,trim:22,add:"$14.50–15.50",exit:13.00,
   aH:31,aL:23,aC:27.67,aBuy:35,aHold:52,aSell:13,aCount:23,
   peerPE:{low:15,mid:25,high:40},peerNote:"Fintech with bank charter. Rate sensitivity is the key re-rating trigger.",
   reliability:{score:65,label:"MODERATE–GOOD",color:C.gold,note:"Rate sensitivity makes margin prediction harder. Bank charter provides floor on multiple. CEO share purchases increase credibility."}},
  {ticker:"ZETA",name:"Zeta Global",        shares:39.99, avg:16.76,price:18.22,conv:"medium",score:687,cat:"Speculative Growth",hold:"18–24mo",sector:"AdTech/AI",
   netCash:180,sharesOut:185,dilution:4.0,
   hist:[{y:2021,rev:441,revG:38.5,ni:-102,nim:-23.1,eps:-0.51},{y:2022,rev:557,revG:26.3,ni:-92,nim:-16.5,eps:-0.41},{y:2023,rev:727,revG:30.5,ni:-31,nim:-4.3,eps:-0.13},{y:2024,rev:924,revG:27.1,ni:18,nim:1.9,eps:0.07}],
   thesis:"AI-powered marketing cloud with ~28% YoY revenue growth. 250M+ identity graph data moat.",
   bull:"AI marketing spend accelerates. $35–40.",base:"20–25% growth sustained. $28–32.",bear:"Budget cuts, competition. $10–13.",
   stop:14.50,trim:30,add:"$16–18",exit:14.00,
   aH:28,aL:14,aC:22,aBuy:60,aHold:30,aSell:10,aCount:15,
   peerPE:{low:15,mid:22,high:35},peerNote:"AdTech/SaaS peers trade 15–35x. Growth rate justifies upper end if AI thesis plays out.",
   reliability:{score:54,label:"MODERATE",color:C.gold,note:"No strong public guidance. Margin improvement visible but not confirmed. AdTech multiples volatile."}},
  {ticker:"META",name:"Meta Platforms",     shares:2.59,  avg:630.58,price:603.50,conv:"medium",score:878,cat:"Momentum",     hold:"12–18mo",sector:"Tech",
   netCash:58000,sharesOut:2570,dilution:0.5,
   hist:[{y:2021,rev:117929,revG:37.2,ni:39370,nim:33.4,eps:13.77},{y:2022,rev:116609,revG:-1.1,ni:23200,nim:19.9,eps:8.59},{y:2023,rev:134902,revG:15.7,ni:39098,nim:29.0,eps:14.87},{y:2024,rev:164501,revG:21.9,ni:62360,nim:37.9,eps:23.86}],
   thesis:"Compounding at ~20% revenue growth with 40%+ net margins. CapEx concerns overblown if Llama and AI ads monetise.",
   bull:"AI monetisation inflects, Threads scales. $850–1000.",base:"Revenue 18–20% growth. $720–780.",bear:"Regulation, CapEx disappointment. $480–520.",
   stop:540,trim:750,add:"$570–600",exit:530,
   aH:935,aL:480,aC:720,aBuy:85,aHold:12,aSell:3,aCount:52,
   peerPE:{low:18,mid:24,high:32},peerNote:"Mega-cap tech peers trade 22–28x. META historically discounted — re-rating likely as AI monetises.",
   reliability:{score:86,label:"HIGH",color:C.accent,note:"Most reliable model in portfolio. Clear revenue guidance, stable margins, minimal dilution, fortress balance sheet."}},
  {ticker:"AMZN",name:"Amazon",             shares:7.10,  avg:215.56,price:266.55,conv:"medium",score:904,cat:"Hypergrowth",  hold:"12–24mo",sector:"Tech",
   netCash:78000,sharesOut:10700,dilution:0.8,
   hist:[{y:2021,rev:469822,revG:21.7,ni:33364,nim:7.1,eps:3.24},{y:2022,rev:513983,revG:9.4,ni:-2722,nim:-0.5,eps:-0.27},{y:2023,rev:574785,revG:11.8,ni:30425,nim:5.3,eps:2.90},{y:2024,rev:637959,revG:11.0,ni:59248,nim:9.3,eps:5.53}],
   thesis:"AWS growing 17%+ with 30%+ margins. Ads approaching $60B annually. Highest fundamental quality in portfolio.",
   bull:"AWS accelerates to 22%+. $320–360.",base:"AWS sustains 17%, margins expand. $270–300.",bear:"AWS slowdown, consumer weakness. $195–210.",
   stop:220,trim:310,add:"$250–260",exit:215,
   aH:320,aL:195,aC:268,aBuy:92,aHold:7,aSell:1,aCount:58,
   peerPE:{low:28,mid:38,high:50},peerNote:"AWS justifies premium multiple. Blended multiple expanding as AWS mix grows.",
   reliability:{score:80,label:"GOOD",color:C.accent,note:"AWS guidance is clear and trackable. Retail margin expansion is the uncertain variable."}},
  {ticker:"NVDA",name:"NVIDIA",             shares:3.91,  avg:184.21,price:223.90,conv:"medium",score:883,cat:"Momentum",     hold:"12–18mo",sector:"Semiconductors",
   netCash:38500,sharesOut:24400,dilution:1.0,
   hist:[{y:2022,rev:26974,revG:61.4,ni:9752,nim:36.2,eps:3.85},{y:2023,rev:44870,revG:66.3,ni:22090,nim:49.2,eps:8.73},{y:2024,rev:60922,revG:35.8,ni:29760,nim:48.8,eps:11.93},{y:2025,rev:130497,revG:114.2,ni:72880,nim:55.8,eps:29.76}],
   thesis:"AI infrastructure backbone. Blackwell cycle is real. Approaching trim zone at $223. Protect +21% gain.",
   bull:"Blackwell supercycle continues. $350+.",base:"Demand sustains, consolidation $230–260.",bear:"China export restrictions, custom silicon. $160–180.",
   stop:175,trim:250,add:"DO NOT ADD",exit:170,
   aH:220,aL:135,aC:175,aBuy:80,aHold:17,aSell:3,aCount:55,
   peerPE:{low:25,mid:35,high:50},peerNote:"NVDA commands premium for AI dominance. PE has ranged 25x–75x in 24 months — biggest uncertainty.",
   reliability:{score:71,label:"MODERATE–GOOD",color:C.gold,note:"Revenue visibility is good. PE multiple is the biggest risk — has traded 25x to 75x in 24 months alone."}},
  {ticker:"GRAB",name:"Grab Holdings",      shares:687.24,avg:5.25, price:3.51, conv:"low",   score:457,cat:"Turnaround",    hold:"6–12mo", sector:"Fintech/SE Asia",
   netCash:5200,sharesOut:3800,dilution:5.0,
   hist:[{y:2021,rev:675,revG:44.2,ni:-3555,nim:-526.7,eps:-0.22},{y:2022,rev:1431,revG:112.0,ni:-1740,nim:-121.6,eps:-0.11},{y:2023,rev:2360,revG:64.9,ni:-485,nim:-20.6,eps:-0.03},{y:2024,rev:2820,revG:19.5,ni:12,nim:0.4,eps:0.001}],
   thesis:"Weakest conviction. Down -33%. Defined downtrend. Exit strategy non-negotiable.",
   bull:"SEA macro recovery, fintech licenses. $5.50–6.50.",base:"Slow profitability path. $4.00–4.50.",bear:"Competition, losses widen. $2.50–3.00.",
   stop:3.00,trim:4.20,add:"DO NOT ADD",exit:3.00,
   aH:5.5,aL:3.2,aC:4.1,aBuy:42,aHold:45,aSell:13,aCount:22,
   peerPE:{low:10,mid:18,high:28},peerNote:"SE Asian fintech peers. Multiple essentially unmeasurable until sustained profitability.",
   reliability:{score:39,label:"LOW",color:C.red,note:"Path to profitability keeps shifting. High historical dilution. PE essentially unmeasurable until sustained profit."}},
  {ticker:"HNST",name:"The Honest Co.",     shares:500.54,avg:2.88, price:3.19, conv:"low",   score:458,cat:"Speculative",   hold:"3–6mo",  sector:"Consumer",
   netCash:45,sharesOut:100,dilution:2.0,
   hist:[{y:2021,rev:301,revG:22.5,ni:-53,nim:-17.6,eps:-0.55},{y:2022,rev:340,revG:12.9,ni:-63,nim:-18.5,eps:-0.64},{y:2023,rev:350,revG:2.9,ni:-28,nim:-8.0,eps:-0.28},{y:2024,rev:362,revG:3.4,ni:-8,nim:-2.2,eps:-0.08}],
   thesis:"$4 spike may have been the Toy Story catalyst. Thesis potentially exhausted. Reassess urgently.",
   bull:"Second catalyst wave. $4.50–5.",base:"Holds $3.00–3.50 range.",bear:"Catalyst spent, drifts to $2.50.",
   stop:2.50,trim:4.20,add:"DO NOT ADD",exit:2.60,
   aH:5.5,aL:2.8,aC:3.8,aBuy:40,aHold:40,aSell:20,aCount:8,
   peerPE:{low:8,mid:14,high:22},peerNote:"Small consumer brand. Multiple highly dependent on growth acceleration.",
   reliability:{score:41,label:"LOW",color:C.red,note:"Almost entirely catalyst-driven. Financial projections have very low predictive value here."}},
  {ticker:"UNH", name:"UnitedHealth Group", shares:2.72,  avg:354.01,price:382.08,conv:"medium",score:729,cat:"Value/Defensive",hold:"12–24mo",sector:"Healthcare",
   netCash:-12000,sharesOut:930,dilution:0.5,
   hist:[{y:2021,rev:287597,revG:11.8,ni:17285,nim:6.0,eps:18.08},{y:2022,rev:324162,revG:12.7,ni:20120,nim:6.2,eps:21.18},{y:2023,rev:371622,revG:14.6,ni:22381,nim:6.0,eps:23.86},{y:2024,rev:400278,revG:7.7,ni:14398,nim:3.6,eps:15.46}],
   thesis:"Largest US health insurer with Optum moat. Legal overhang was the entry catalyst. Now recovering.",
   bull:"Legal clears, Optum recovers. $520–580.",base:"Gradual stabilisation. $460–490.",bear:"Legal escalation, MLR deterioration. $300–330.",
   stop:340,trim:480,add:"$360–380",exit:338,
   aH:580,aL:290,aC:450,aBuy:65,aHold:25,aSell:10,aCount:28,
   peerPE:{low:16,mid:20,high:24},peerNote:"Healthcare mega-cap. UNH historically 20–22x for Optum moat. Legal discount currently ~4x PE.",
   reliability:{score:76,label:"MODERATE–GOOD",color:C.gold,note:"Strong historical consistency before legal issues. Legal uncertainty is the primary model risk."}},
];

const Badge = ({label,color,sm}) => (
  <span style={{fontSize:sm?9:10,fontWeight:700,padding:sm?"2px 6px":"3px 9px",borderRadius:3,background:`${color}18`,color,border:`1px solid ${color}30`,whiteSpace:"nowrap"}}>{label}</span>
);
const Bar = ({pct,color,h=4}) => (
  <div style={{height:h,background:C.faint,borderRadius:2,marginTop:3}}>
    <div style={{width:`${Math.min(100,Math.max(0,pct))}%`,height:"100%",background:color,borderRadius:2,transition:"width .8s"}}/>
  </div>
);
const TH = ({v}) => <th style={{padding:"7px 10px",fontSize:10,fontWeight:700,color:C.muted,borderBottom:`1px solid ${C.border}`,textAlign:"left",background:C.faint,whiteSpace:"nowrap"}}>{v}</th>;
const TD = ({v,col,mono,bg}) => <td style={{padding:"7px 10px",fontSize:11,color:col||C.text,fontFamily:mono?"monospace":"inherit",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap",background:bg||"transparent"}}>{v}</td>;

// ── SIMPLIFIED PROJECTIONS TAB ────────────────────────────────────
function ProjectionsTab({stock}) {
  const last = stock.hist[stock.hist.length-1];

  // Smart defaults from historical data
  const avgRevG = Math.round(stock.hist.slice(-3).reduce((s,h)=>s+(h.revG||0),0)/3);
  const baseNim = last.nim > 0 ? +(last.nim+0.5).toFixed(1) : +(last.nim*0.3+2).toFixed(1);

  // Simple state — just 4 inputs like Investment Edge
  const [revG, setRevG] = useState(Math.max(5, avgRevG));
  const [nim,  setNim]  = useState(baseNim);
  const [peLow, setPeLow]   = useState(stock.peerPE.low);
  const [peHigh, setPeHigh] = useState(stock.peerPE.mid);
  const [applyTo, setApplyTo] = useState("all"); // "all" or year index

  // Advanced toggle
  const [advanced, setAdvanced] = useState(false);
  const [useDilution, setUseDilution] = useState(true);
  const [useNetCash,  setUseNetCash]  = useState(true);

  // Per-year overrides (only active when applyTo !== "all")
  const [yearRows, setYearRows] = useState([0,1,2,3].map(() => ({revG:Math.max(5,avgRevG),nim:baseNim,peLow:stock.peerPE.low,peHigh:stock.peerPE.mid})));
  const updYear = (i,k,v) => setYearRows(r=>r.map((row,j)=>j===i?{...row,[k]:parseFloat(v)||0}:row));

  // Get assumptions for year i
  const getRow = i => applyTo==="all"
    ? {revG,nim,peLow,peHigh}
    : yearRows[i];

  // Calculate projections — inline row resolution to avoid stale closure in deps
  const proj = useMemo(()=>{
    let rev = last.rev;
    let shares = stock.sharesOut;
    return [0,1,2,3].map(i=>{
      const r = applyTo==="all"
        ? {revG,nim,peLow,peHigh}
        : yearRows[i];
      rev = rev*(1+r.revG/100);
      if(useDilution) shares = shares*(1+(stock.dilution/100));
      const ni = rev*r.nim/100;
      const eps = ni/shares;
      const ncps = useNetCash ? stock.netCash/shares : 0;
      return {
        year:last.y+i+1, rev:+rev.toFixed(0), revG:r.revG,
        ni:+ni.toFixed(0), nim:r.nim, eps:+eps.toFixed(2),
        peLow:r.peLow, peHigh:r.peHigh,
        spLow:eps>0?+(eps*r.peLow+ncps).toFixed(2):null,
        spHigh:eps>0?+(eps*r.peHigh+ncps).toFixed(2):null,
        ncps:+ncps.toFixed(2),
      };
    });
  },[revG,nim,peLow,peHigh,applyTo,yearRows,useDilution,useNetCash,last,stock]);

  const rel = stock.reliability;

  const numInp = (val, set, step=1) => (
    <div style={{display:"flex",alignItems:"center",gap:0,background:C.bg,borderRadius:5,border:`1px solid ${C.accent}40`,overflow:"hidden"}}>
      <button onClick={()=>set(v=>Math.round((v-step)*10)/10)} style={{background:"transparent",border:"none",color:C.accent,fontSize:16,padding:"6px 12px",cursor:"pointer",fontFamily:"monospace"}}>−</button>
      <input type="number" step={step} value={val} onChange={e=>set(parseFloat(e.target.value)||0)}
        style={{width:64,background:"transparent",border:"none",color:C.accent,fontSize:14,fontWeight:900,fontFamily:"monospace",outline:"none",textAlign:"center"}}/>
      <button onClick={()=>set(v=>Math.round((v+step)*10)/10)} style={{background:"transparent",border:"none",color:C.accent,fontSize:16,padding:"6px 12px",cursor:"pointer",fontFamily:"monospace"}}>+</button>
    </div>
  );

  const smallInp = {width:"58px",background:C.bg,border:`1px solid ${C.accent}40`,borderRadius:4,padding:"4px 5px",color:C.accent,fontSize:12,fontFamily:"monospace",fontWeight:700,outline:"none",textAlign:"center"};

  return(
    <div>
      {/* Reliability badge */}
      <div style={{background:`${rel.color}10`,border:`1px solid ${rel.color}30`,borderRadius:8,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"flex-start",gap:12}}>
        <div style={{textAlign:"center",minWidth:52}}>
          <div style={{fontSize:28,fontWeight:900,color:rel.color,fontFamily:"monospace",lineHeight:1}}>{rel.score}</div>
          <div style={{fontSize:8,color:C.muted}}>/100</div>
          <Badge label={rel.label} color={rel.color} sm/>
        </div>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:rel.color,marginBottom:4}}>PROJECTION RELIABILITY</div>
          <p style={{fontSize:11,color:C.text,lineHeight:1.6,margin:0}}>{rel.note}</p>
        </div>
      </div>

      {/* Historical table */}
      <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:10}}>📊 HISTORICAL FINANCIALS</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:320}}>
            <thead><tr><TH v="METRIC"/>{stock.hist.map(h=><TH key={h.y} v={h.y}/>)}</tr></thead>
            <tbody>
              <tr><TD v="Revenue ($M)"/>{stock.hist.map(h=><TD key={h.y} v={`$${Math.abs(h.rev).toLocaleString()}M`} mono/>)}</tr>
              <tr><TD v="Rev Growth"/>{stock.hist.map(h=><TD key={h.y} v={`${h.revG.toFixed(1)}%`} col={h.revG>20?C.accent:h.revG>0?C.gold:C.red} mono/>)}</tr>
              <tr><TD v="Net Income ($M)"/>{stock.hist.map(h=><TD key={h.y} v={`$${h.ni.toLocaleString()}M`} col={h.ni>0?C.accent:C.red} mono/>)}</tr>
              <tr><TD v="NI Margin"/>{stock.hist.map(h=><TD key={h.y} v={`${h.nim.toFixed(1)}%`} col={h.nim>5?C.accent:h.nim>0?C.gold:C.red} mono/>)}</tr>
              <tr><TD v="EPS"/>{stock.hist.map(h=><TD key={h.y} v={`$${h.eps.toFixed(2)}`} col={h.eps>0?C.accent:C.red} mono/>)}</tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CLEAN ASSUMPTION INPUTS (Investment Edge style) ── */}
      <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:16,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:C.accent}}>⚙️ CUSTOM ASSUMPTIONS</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:10,color:C.muted}}>Edit per year</span>
            <button onClick={()=>setApplyTo(v=>v==="all"?"year":"all")}
              style={{width:32,height:18,borderRadius:9,background:applyTo==="year"?C.accent:C.faint,border:"none",cursor:"pointer",position:"relative",transition:"background .2s"}}>
              <div style={{position:"absolute",top:3,left:applyTo==="year"?16:3,width:12,height:12,borderRadius:"50%",background:"#fff",transition:"left .15s"}}/>
            </button>
          </div>
        </div>

        {applyTo==="all" ? (
          /* SIMPLE MODE — 4 inputs, clean and clear */
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:10,color:C.muted,marginBottom:6}}>REVENUE GROWTH %</div>
                {numInp(revG,setRevG,1)}
                <div style={{fontSize:9,color:C.muted,marginTop:3}}>Hist avg: {Math.max(5,avgRevG).toFixed(0)}% · Guidance if any</div>
              </div>
              <div>
                <div style={{fontSize:10,color:C.muted,marginBottom:6}}>NET INCOME MARGIN %</div>
                {numInp(nim,setNim,0.5)}
                <div style={{fontSize:9,color:C.muted,marginTop:3}}>Last year: {last.nim.toFixed(1)}%</div>
              </div>
              <div>
                <div style={{fontSize:10,color:C.muted,marginBottom:6}}>PE LOW ESTIMATE</div>
                {numInp(peLow,setPeLow,1)}
                <div style={{fontSize:9,color:C.muted,marginTop:3}}>Peer conservative: {stock.peerPE.low}x</div>
              </div>
              <div>
                <div style={{fontSize:10,color:C.muted,marginBottom:6}}>PE HIGH ESTIMATE</div>
                {numInp(peHigh,setPeHigh,1)}
                <div style={{fontSize:9,color:C.muted,marginTop:3}}>Peer fair value: {stock.peerPE.mid}x</div>
              </div>
            </div>

            {/* Peer PE guide inline */}
            <div style={{background:C.faint,borderRadius:6,padding:"9px 12px",marginBottom:10}}>
              <div style={{fontSize:9,color:C.muted,marginBottom:5}}>PEER PE REFERENCE — {stock.sector}</div>
              <div style={{display:"flex",gap:8,marginBottom:5}}>
                {[["Conservative",stock.peerPE.low+"x",C.red],["Fair Value",stock.peerPE.mid+"x",C.gold],["Optimistic",stock.peerPE.high+"x",C.accent]].map(([l,v,col])=>(
                  <div key={l} style={{flex:1,background:`${col}12`,borderRadius:4,padding:"5px 8px",textAlign:"center"}}>
                    <div style={{fontSize:14,fontWeight:900,color:col,fontFamily:"monospace"}}>{v}</div>
                    <div style={{fontSize:8,color:C.muted}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>{stock.peerNote}</div>
            </div>
          </div>
        ) : (
          /* PER-YEAR MODE */
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:340}}>
              <thead><tr><TH v="YEAR"/><TH v="REV GRW%"/><TH v="NI MARGIN%"/><TH v="PE LOW"/><TH v="PE HIGH"/></tr></thead>
              <tbody>
                {[0,1,2,3].map(i=>(
                  <tr key={i}>
                    <TD v={last.y+i+1} mono/>
                    {["revG","nim","peLow","peHigh"].map(k=>(
                      <td key={k} style={{padding:"5px 7px",borderBottom:`1px solid ${C.border}`}}>
                        <input type="number" step="0.5" value={yearRows[i][k]} onChange={e=>updYear(i,k,e.target.value)} style={smallInp}/>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Advanced toggle */}
        <button onClick={()=>setAdvanced(v=>!v)}
          style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:4,padding:"5px 12px",fontSize:10,cursor:"pointer",fontFamily:"monospace",marginTop:4,width:"100%"}}>
          {advanced?"▲ Hide advanced options":"▼ Advanced: Dilution & Net Cash adjustments"}
        </button>

        {advanced&&(
          <div style={{marginTop:10,padding:"10px 12px",background:C.faint,borderRadius:6}}>
            <div style={{fontSize:10,fontWeight:700,color:C.text,marginBottom:8}}>ADVANCED ADJUSTMENTS</div>
            <div style={{display:"flex",gap:10,flexDirection:"column"}}>
              {[[useDilution,setUseDilution,`Include dilution (${stock.dilution}%/yr share issuance)`,"Reduces EPS each year as new shares are issued. Typically 1–5% for growth companies."],[useNetCash,setUseNetCash,`Include net cash/debt ($${(stock.netCash/1000).toFixed(1)}B)`,"Adds net cash per share to price target. Companies with large cash reserves are worth more than EPS × PE alone."]].map(([on,setOn,lbl,desc],i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <button onClick={()=>setOn(v=>!v)} style={{width:22,height:22,borderRadius:4,border:`2px solid ${on?C.accent:C.border}`,background:on?`${C.accent}20`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:on?C.accent:C.muted,fontSize:11,cursor:"pointer",flexShrink:0,marginTop:1}}>{on?"✓":""}</button>
                  <div>
                    <div style={{fontSize:11,color:C.text,fontWeight:600}}>{lbl}</div>
                    <div style={{fontSize:10,color:C.muted,lineHeight:1.5,marginTop:2}}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Output table */}
      <div style={{background:C.sur,border:`1px solid ${C.accent}20`,borderRadius:8,padding:14}}>
        <div style={{fontSize:11,fontWeight:700,color:C.accent,marginBottom:12}}>📈 FINANCIAL PROJECTIONS</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:320}}>
            <thead><tr><TH v="METRIC"/>{proj.map(p=><TH key={p.year} v={`${p.year}`}/>)}</tr></thead>
            <tbody>
              <tr><TD v="Revenue"/>{proj.map(p=><TD key={p.year} v={`$${Math.abs(p.rev).toLocaleString()}M`} mono/>)}</tr>
              <tr><TD v="Rev Growth"/>{proj.map(p=><TD key={p.year} v={`${p.revG.toFixed(1)}%`} col={p.revG>15?C.accent:C.gold} mono/>)}</tr>
              <tr><TD v="Net Income"/>{proj.map(p=><TD key={p.year} v={`$${p.ni.toLocaleString()}M`} col={p.ni>0?C.accent:C.red} mono/>)}</tr>
              <tr><TD v="NI Margin"/>{proj.map(p=><TD key={p.year} v={`${p.nim.toFixed(1)}%`} col={p.nim>5?C.accent:p.nim>0?C.gold:C.red} mono/>)}</tr>
              <tr><TD v="EPS"/>{proj.map(p=><TD key={p.year} v={`$${p.eps.toFixed(2)}`} col={p.eps>0?C.accent:C.red} mono/>)}</tr>
              <tr><TD v="PE Low" />{proj.map(p=><TD key={p.year} v={`${p.peLow}x`} col={C.muted} mono/>)}</tr>
              <tr><TD v="PE High"/>{proj.map(p=><TD key={p.year} v={`${p.peHigh}x`} col={C.muted} mono/>)}</tr>
              <tr><TD v="Share Price Low"  bg={`${C.red}08`}/>{proj.map(p=><TD key={p.year} v={p.spLow ?`$${p.spLow}`:"—"} col={C.red}   mono bg={`${C.red}08`}/>)}</tr>
              <tr><TD v="Share Price High" bg={`${C.accent}08`}/>{proj.map(p=><TD key={p.year} v={p.spHigh?`$${p.spHigh}`:"—"} col={C.accent} mono bg={`${C.accent}08`}/>)}</tr>
            </tbody>
          </table>
        </div>
        <div style={{marginTop:8,padding:"6px 10px",background:C.faint,borderRadius:4,fontSize:10,color:C.muted}}>
          Share Price = EPS × PE{useNetCash?" + Net Cash/Share":""}{useDilution?" · Dilution applied":""}. Reliability: {rel.score}/100 — treat as range, not precise target.
        </div>
        {/* Visual price range bar */}
        {proj.some(p=>p.spLow)&&(
          <div style={{marginTop:10}}>
            <div style={{fontSize:9,color:C.muted,marginBottom:6}}>PROJECTED PRICE RANGE vs CURRENT ${stock.price}</div>
            {proj.filter(p=>p.spLow).map(p=>{
              const maxVal = Math.max(...proj.filter(x=>x.spHigh).map(x=>x.spHigh));
              const barW = (v) => `${Math.min(100,(v/maxVal)*100)}%`;
              return(
                <div key={p.year} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                  <span style={{fontSize:10,color:C.muted,minWidth:32,fontFamily:"monospace"}}>{p.year}</span>
                  <div style={{flex:1,position:"relative",height:20,background:C.faint,borderRadius:3}}>
                    <div style={{position:"absolute",left:0,top:0,height:"100%",width:barW(p.spHigh),background:`${C.accent}25`,borderRadius:3}}/>
                    <div style={{position:"absolute",left:0,top:0,height:"100%",width:barW(p.spLow),background:`${C.red}30`,borderRadius:3}}/>
                    {/* Current price marker */}
                    {(()=>{const pp=Math.min(98,Math.max(2,(stock.price/maxVal)*100));return<div style={{position:"absolute",left:`${pp}%`,top:0,bottom:0,width:2,background:C.gold,opacity:.9}}/>;})()}
                  </div>
                  <span style={{fontSize:10,color:C.red,minWidth:42,fontFamily:"monospace"}}>${p.spLow}</span>
                  <span style={{fontSize:10,color:C.muted}}>–</span>
                  <span style={{fontSize:10,color:C.accent,minWidth:42,fontFamily:"monospace"}}>${p.spHigh}</span>
                </div>
              );
            })}
            <div style={{fontSize:9,color:C.muted,marginTop:4}}>Gold line = current price ${stock.price}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ANALYST TAB ───────────────────────────────────────────────────
function AnalystTab({stock}) {
  const upside=((stock.aC-stock.price)/stock.price*100);
  const pos=upside>0;
  const lo=stock.aL*0.88,hi=stock.aH*1.12;
  const bp=v=>Math.min(96,Math.max(4,((v-lo)/(hi-lo))*100));
  return(
    <div>
      <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:700,color:C.gold,marginBottom:12}}>🎯 ANALYST PRICE TARGETS</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:16}}>
          {[["CURRENT",`$${stock.price}`,C.text],["CONSENSUS",`$${stock.aC}`,pos?C.accent:C.red],["HIGH",`$${stock.aH}`,C.accent],["LOW",`$${stock.aL}`,C.red]].map(([l,v,col])=>(
            <div key={l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"9px 10px",textAlign:"center"}}>
              <div style={{fontSize:8,color:C.muted,marginBottom:2}}>{l}</div>
              <div style={{fontSize:17,fontWeight:900,color:col,fontFamily:"monospace"}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{position:"relative",height:22,background:C.faint,borderRadius:5,marginBottom:6}}>
          <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,${C.red}30,${C.gold}30,${C.accent}30)`,borderRadius:5}}/>
          {[{v:stock.aL,col:C.red,lbl:"Low"},{v:stock.aC,col:C.gold,lbl:"Avg"},{v:stock.aH,col:C.accent,lbl:"High"},{v:stock.price,col:C.purple,lbl:"Now"}].map(({v,col,lbl})=>(
            <div key={lbl} style={{position:"absolute",left:`${bp(v)}%`,top:-14,transform:"translateX(-50%)",textAlign:"center"}}>
              <div style={{fontSize:8,color:col,whiteSpace:"nowrap",fontWeight:700}}>{lbl} ${v}</div>
              <div style={{width:2,height:24,background:col,margin:"1px auto 0",opacity:.9}}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:22}}>
          <span style={{fontSize:11,color:C.muted}}>Upside to consensus:</span>
          <span style={{fontSize:13,fontWeight:700,color:pos?C.accent:C.red}}>{pos?"+":""}{upside.toFixed(1)}% · {stock.aCount} analysts</span>
        </div>
      </div>
      <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:14}}>
        <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:10}}>ANALYST RECOMMENDATIONS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
          {[["BUY",stock.aBuy,C.accent],["HOLD",stock.aHold,C.gold],["SELL",stock.aSell,C.red]].map(([l,v,col])=>(
            <div key={l} style={{background:`${col}0e`,border:`1px solid ${col}28`,borderRadius:6,padding:"10px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:900,color:col,fontFamily:"monospace"}}>{v}%</div>
              <div style={{fontSize:10,color:C.muted,marginTop:1}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",height:7,borderRadius:3,overflow:"hidden"}}>
          <div style={{flex:stock.aBuy,background:C.accent,opacity:.8}}/><div style={{flex:stock.aHold,background:C.gold,opacity:.8}}/><div style={{flex:stock.aSell,background:C.red,opacity:.8}}/>
        </div>
      </div>
    </div>
  );
}

// ── INTRINSIC TAB ─────────────────────────────────────────────────
function IntrinsicTab({stock}) {
  const last=stock.hist[stock.hist.length-1];
  const eps=last.eps;
  const A={OSCR:{bG:.12,bsG:.30,buG:.50,term:.04,wacc:.10},SOFI:{bG:.10,bsG:.22,buG:.35,term:.04,wacc:.10},ZETA:{bG:.12,bsG:.22,buG:.32,term:.04,wacc:.11},META:{bG:.10,bsG:.18,buG:.26,term:.05,wacc:.09},AMZN:{bG:.10,bsG:.16,buG:.22,term:.05,wacc:.09},NVDA:{bG:.15,bsG:.30,buG:.50,term:.05,wacc:.10},GRAB:{bG:-.05,bsG:.10,buG:.20,term:.03,wacc:.13},HNST:{bG:.00,bsG:.08,buG:.18,term:.02,wacc:.12},UNH:{bG:.04,bsG:.10,buG:.14,term:.04,wacc:.08}};
  const a=A[stock.ticker]||{bG:.08,bsG:.15,buG:.25,term:.03,wacc:.10};
  const dcf=g=>{if(!eps||eps<=0)return null;let pv=0,e=eps;for(let i=1;i<=10;i++){e*=(1+g);pv+=e/Math.pow(1+a.wacc,i);}return +(pv+(e*(1+a.term))/(a.wacc-a.term)/Math.pow(1+a.wacc,10)).toFixed(2);};
  const ivB=dcf(a.bG),ivBs=dcf(a.bsG),ivBu=dcf(a.buG);
  const mos=ivBs&&stock.price?((ivBs-stock.price)/ivBs*100):null;
  const mCol=mos==null?C.muted:mos>30?C.accent:mos>15?C.accent:mos>0?C.gold:mos>-15?C.gold:C.red;
  const eTxt=mos==null?"Monitor — insufficient data":mos>30?"STRONG ENTRY — full position":mos>15?"GOOD ENTRY — 50–75%":mos>0?"FAIR ENTRY — 25–50%":mos>-15?"CAUTION — 10% only":"AVOID — overvalued";
  return(
    <div>
      <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:700,color:C.accent,marginBottom:12}}>💡 PARKEV-STYLE DCF INTRINSIC VALUE</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:12}}>
          {[["CURRENT",`$${stock.price}`,C.text],["IV BEAR",ivB?`$${ivB}`:"—",C.red],["IV BASE",ivBs?`$${ivBs}`:"—",C.blue],["IV BULL",ivBu?`$${ivBu}`:"—",C.accent]].map(([l,v,col])=>(
            <div key={l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"9px 10px",textAlign:"center"}}>
              <div style={{fontSize:8,color:C.muted,marginBottom:2}}>{l}</div>
              <div style={{fontSize:17,fontWeight:900,color:col,fontFamily:"monospace"}}>{v}</div>
            </div>
          ))}
        </div>
        {mos!==null&&(
          <div style={{background:C.card,borderRadius:6,padding:"10px 12px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:10,color:C.muted}}>MARGIN OF SAFETY vs BASE DCF</span>
              <span style={{fontSize:12,fontWeight:700,color:mCol}}>{mos>0?`+${mos.toFixed(1)}% below intrinsic`:`${Math.abs(mos).toFixed(1)}% above intrinsic`}</span>
            </div>
            {ivB&&ivBu&&(
              <div style={{position:"relative",height:20,background:C.faint,borderRadius:4,marginBottom:8}}>
                <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,${C.red}35,${C.blue}35,${C.accent}35)`,borderRadius:4}}/>
                {(()=>{const p=Math.min(96,Math.max(4,((stock.price-ivB)/(ivBu-ivB))*100));return<div style={{position:"absolute",left:`${p}%`,top:-3,bottom:-3,width:3,background:C.gold,borderRadius:2,transform:"translateX(-50%)"}}/>})()}
                <div style={{position:"absolute",left:2,bottom:-14,fontSize:8,color:C.red}}>Bear ${ivB}</div>
                <div style={{position:"absolute",right:2,bottom:-14,fontSize:8,color:C.accent}}>Bull ${ivBu}</div>
              </div>
            )}
            <div style={{marginTop:16,fontSize:12,fontWeight:700,color:mCol}}>{eTxt}</div>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
          {[["Bear Growth",`${(a.bG*100).toFixed(0)}%/yr`,C.red],["Base Growth",`${(a.bsG*100).toFixed(0)}%/yr`,C.blue],["Bull Growth",`${(a.buG*100).toFixed(0)}%/yr`,C.accent],["WACC",`${(a.wacc*100).toFixed(0)}%`,C.muted],["Terminal",`${(a.term*100).toFixed(0)}%`,C.muted],["EPS Used",`$${eps.toFixed(2)}`,C.text]].map(([l,v,col])=>(
            <div key={l} style={{background:C.card,borderRadius:4,padding:"7px 9px"}}>
              <div style={{fontSize:9,color:C.muted}}>{l}</div>
              <div style={{fontSize:12,fontWeight:700,color:col,fontFamily:"monospace"}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ── EXTENDED INTELLIGENCE DATA ──────────────────────────────────
const INTEL = {
  OSCR:{
    sentiment:{label:"IGNORED\u2192IMPROVING",score:65,note:"Still under-owned by institutions. Healthcare AI story not yet mainstream. Contrarian opportunity window open.",expectation:"BELOW EXPECTATIONS",asymmetry:"HIGH"},
    ceo:{score:82,beats:6,misses:0,note:"6 consecutive MLR beats. Guides conservatively on the key metric.",sandbagging:true,sandbaggingNote:"+10\u201312% upward EPS bias historically justified.",insider:"CEO owns $40M+. Skin in the game confirmed."},
    tech:{rsi:72,rsiNote:"Overbought after +41% month. Do not chase.",wave:"Wave 3 Impulse",waveNote:"Strong Wave 3 in progress off $12 lows. Volume expansion confirms. Wait for Wave 4 pullback to $21\u201322.",ma:"Above all MAs",momentum:"STRONG",pullbackRisk:"HIGH SHORT TERM",fib:"$21.50 (0.382 retrace)",action:"Wait for RSI reset to 55\u201360 before adding"},
    macro:{tw:["ACA enrollment expanding","MLR improvement secular","AI-driven healthcare cost reduction","Rate environment stabilising"],hw:["Regulatory risk from CMS","MLR regression if costs spike"],ai:"MEDIUM",rates:"LOW"},
    thesis:{own:"High-conviction hypergrowth insurer. CEO has stated 2027 targets publicly.",strengthens:["MLR improvement each quarter","Revenue beat above consensus","New ACA market expansion"],weakens:["MLR deterioration above 85%","Unexpected capital raise","Regulatory action"],buyMore:"Price pulls back to $21\u201322 with RSI below 55",trim:"Price reaches $45 with RSI above 75",invalidates:"MLR rises above 90% for two consecutive quarters",cats:["Q1 2025 earnings \u2014 MLR trajectory","2025 ACA open enrollment","Profitability milestone announcement"],risks:["CMS regulatory changes","Medical cost inflation spike","Capital raise dilution"]},
  },
  SOFI:{
    sentiment:{label:"HATED",score:28,note:"Widely hated post-student loan narrative. Institutional positioning low. Classic contrarian setup.",expectation:"VERY LOW",asymmetry:"VERY HIGH"},
    ceo:{score:78,beats:7,misses:1,note:"7 of 8 quarters beaten on EPS. Consistent sandbagging.",sandbagging:true,sandbaggingNote:"+15% upward EPS bias. CEO Noto sets conservative ranges intentionally.",insider:"CEO Noto personally buying shares at $8\u20139 levels."},
    tech:{rsi:42,rsiNote:"Recovering from oversold. No capitulation signal yet.",wave:"Base/Cup Forming",waveNote:"H\u0026S neckline at $15 is the most critical technical level in the portfolio. Break below = $12\u201313. Hold = base forming.",ma:"Below 200MA \u2014 weak",momentum:"WEAK \u2014 recovering",pullbackRisk:"CRITICAL: WATCH $15",fib:"$14.80 (major support)",action:"Hold. Do not add until $15 holds on volume confirmation."},
    macro:{tw:["Rate cut cycle benefits NIM","Student loan refi reactivation","Bank charter deposit cost advantage"],hw:["Rate cuts delayed","Consumer credit stress","Traditional bank competition"],ai:"LOW",rates:"VERY HIGH"},
    thesis:{own:"Decade-long hold. Becoming the Amazon of consumer finance. Bank charter is structural moat.",strengthens:["Rate cuts begin","Member growth acceleration","NIM expansion above 6%"],weakens:["Rate hikes resume","Credit loss acceleration"],buyMore:"$14.50\u201315.50 with RSI below 35 and volume capitulation",trim:"$25+ after rate cut catalyst",invalidates:"Break below $13.50 on heavy volume. H\u0026S confirmed.",cats:["Fed rate cut announcement","Q2 2025 NIM expansion beat","Galileo new client announcement"],risks:["H\u0026S neckline break at $15","Rate cuts delayed into 2026","Credit losses accelerating"]},
  },
  ZETA:{
    sentiment:{label:"MIXED",score:50,note:"AdTech space still under-appreciated. AI data moat narrative not fully priced. Some short interest elevated.",expectation:"MODERATE",asymmetry:"MODERATE"},
    ceo:{score:55,beats:3,misses:2,note:"Mixed beat/miss. No consistent sandbagging pattern.",sandbagging:false,sandbaggingNote:"No adjustment warranted. Take guidance at face value.",insider:"CEO owns material stake. Aligned."},
    tech:{rsi:52,rsiNote:"Neutral. No urgency either way.",wave:"Corrective ABC",waveNote:"Completing corrective ABC from $30 highs. Wave C support $15\u201317. Watch for higher low above $17 as reversal signal.",ma:"Near 50MA \u2014 testing",momentum:"FLAT",pullbackRisk:"MEDIUM",fib:"$16.50 (0.618 Fib)",action:"Hold. Add opportunistically at $16\u201318 only."},
    macro:{tw:["AI-driven marketing spend growing","Identity graph becoming more valuable"],hw:["AdTech multiple compression risk","Salesforce/Adobe competition"],ai:"HIGH",rates:"MEDIUM"},
    thesis:{own:"AI marketing cloud with 250M+ identity data moat. 28% revenue growth at improving margins.",strengthens:["Scaled customer growth acceleration","NI margin above 5%"],weakens:["Revenue miss on scaled customers","AdTech multiple compression"],buyMore:"$16\u201318 on weakness",trim:"$30+",invalidates:"Revenue growth decelerates below 15% for 2 quarters",cats:["Q2 2025 scaled customer beat","AI product launch","Enterprise partnership"],risks:["AdTech multiple compression","Salesforce AI competition"]},
  },
  META:{
    sentiment:{label:"POPULAR",score:72,note:"Well-owned but not yet euphoric. CapEx concerns create episodic pullbacks that are buying opportunities.",expectation:"HIGH BUT ACHIEVABLE",asymmetry:"MODERATE"},
    ceo:{score:92,beats:6,misses:0,note:"6 consecutive EPS beats averaging 10%+. Zuckerberg rarely misses.",sandbagging:true,sandbaggingNote:"+10% upward EPS bias. Under-promises consistently.",insider:"Zuckerberg controls ~13% of voting stock."},
    tech:{rsi:48,rsiNote:"Corrective pullback from $680. Better entry now than a month ago.",wave:"Wave 4 Correction",waveNote:"Wave 3 extended to $680. Current $603 is Wave 4 correction at 0.382 Fib. Wave 5 continuation toward $750+ likely.",ma:"Above 200MA \u2014 healthy",momentum:"CORRECTING",pullbackRisk:"LOW AT CURRENT LEVELS",fib:"$590\u2013600 (0.382 Fib)",action:"Current price improved entry. Consider small add at $570\u2013600."},
    macro:{tw:["AI monetisation in ads inflecting","Threads gaining users","Global digital ad spend growing","Llama reducing AI cost"],hw:["EU regulatory pressure","CapEx overshoot risk","Reality Labs losses"],ai:"VERY HIGH",rates:"LOW"},
    thesis:{own:"Highest quality mega-cap. 40%+ net margins with 20% growth. CapEx concerns are temporary.",strengthens:["AI ad revenue acceleration","CapEx as % revenue declining","Threads monetisation begins"],weakens:["AI CapEx disappoints ROI","Regulatory breakup action"],buyMore:"$570\u2013600 on further weakness",trim:"$750+ with RSI above 75",invalidates:"Revenue growth sustained below 12% for 2 quarters",cats:["Q2 2025 AI ad revenue beat","CapEx guidance reduction","Threads user/revenue disclosure"],risks:["EU DSA enforcement","AI CapEx exceeds $100B","Antitrust action"]},
  },
  AMZN:{
    sentiment:{label:"POPULAR",score:70,note:"Consistently well-regarded. AWS narrative drives institutional accumulation. Not yet overcrowded.",expectation:"HIGH BUT TRACKING",asymmetry:"MODERATE\u2013HIGH"},
    ceo:{score:90,beats:6,misses:0,note:"6 of 6 quarters beaten. AWS guidance consistently conservative.",sandbagging:true,sandbaggingNote:"+10% upward bias. AWS growth comes in above guidance without exception.",insider:"Jassy material stake. Bezos still top-5 shareholder."},
    tech:{rsi:60,rsiNote:"Constructive \u2014 not overbought. Healthy consolidation.",wave:"Wave 4\u20135 Setup",waveNote:"AWS upgrade cycle creating healthy Wave 4 consolidation. $250\u2013260 is the ideal add zone on any pullback.",ma:"Above all MAs \u2014 bullish",momentum:"STRONG",pullbackRisk:"LOW",fib:"$248 (0.382 Fib)",action:"Hold. Add on pullback to $250\u2013260."},
    macro:{tw:["AI infrastructure CapEx driving AWS demand","Advertising approaching $60B","Retail margin expansion secular"],hw:["Antitrust regulation risk","Azure/GCP competition"],ai:"VERY HIGH",rates:"LOW"},
    thesis:{own:"Highest fundamental quality in portfolio. AWS + Ads + Retail = 3 compounding engines.",strengthens:["AWS growth above 20%","Ad revenue approaching $80B","Operating margin above 12%"],weakens:["AWS growth below 14%","Antitrust breakup"],buyMore:"$250\u2013260 pullback",trim:"$310+",invalidates:"AWS growth sustained below 10% for 3 quarters",cats:["AWS Reinvent announcements","Q2 2025 AWS growth print","AI infrastructure contracts"],risks:["Azure/GCP taking AWS share","Antitrust action"]},
  },
  NVDA:{
    sentiment:{label:"POPULAR\u2192EUPHORIC",score:80,note:"Institutional crowding increasing. Retail euphoria evident. Blackwell priced in partially. Trim zone approaching.",expectation:"VERY HIGH",asymmetry:"LOW AT CURRENT LEVELS"},
    ceo:{score:95,beats:6,misses:0,note:"6 of 6 revenue beats averaging 8\u201310%. Jensen guides conservatively without exception.",sandbagging:true,sandbaggingNote:"+10% revenue upward bias. Most consistent beater in portfolio.",insider:"Jensen Huang owns ~3.5% of NVDA."},
    tech:{rsi:58,rsiNote:"Recovering from correction. Room to $240 before overbought.",wave:"Wave 3\u20134 Structure",waveNote:"Post-correction recovery. Watch for volume breakout above $235. $250 is the planned trim level.",ma:"Reclaimed 50MA \u2014 bullish signal",momentum:"RECOVERING",pullbackRisk:"MEDIUM",fib:"$210 (0.382 Fib)",action:"Hold. Set limit sell 30% at $250. Do not add new capital."},
    macro:{tw:["Sovereign AI demand ($100B+ contracts)","Blackwell upgrade cycle","Data centre buildout secular"],hw:["China export restrictions","AMD/custom silicon competition","Valuation compression risk"],ai:"EXTREME",rates:"LOW"},
    thesis:{own:"AI infrastructure backbone. Near-monopoly on GPU training. Blackwell cycle confirmed.",strengthens:["Blackwell demand exceeds supply","New sovereign AI contracts","AMD failing to take share"],weakens:["Custom silicon inflection","China ban expanded"],buyMore:"N/A \u2014 approaching trim zone",trim:"30% at $250, remainder at $300",invalidates:"Data centre revenue growth below 30% for 2 quarters",cats:["Blackwell ramp confirmation Q2 2025","Sovereign AI mega-contract","Jensen keynote guidance"],risks:["China export ban expansion","Custom silicon (Google TPU, Amazon Trainium)","PE multiple compression 35x\u219225x"]},
  },
  GRAB:{
    sentiment:{label:"IGNORED",score:35,note:"Largely forgotten by Western investors. Consistent miss history creating negative sentiment loop. No positive catalyst narrative.",expectation:"LOW BUT NOT IMPROVING",asymmetry:"LOW \u2014 downtrend intact"},
    ceo:{score:22,beats:1,misses:4,note:"1 of 5 quarters beaten. Consistent over-promise on revenue. Opposite of sandbagging.",sandbagging:false,sandbaggingNote:"-12% downward EPS adjustment warranted. Management consistently overstates near-term.",insider:"Management ownership declining. Not aligned."},
    tech:{rsi:38,rsiNote:"Declining trend. No capitulation spike. No reversal signal.",wave:"Distribution",waveNote:"Classic distribution structure. Lower highs, lower lows. Each bounce sold into. No impulsive upside structure forming.",ma:"Below all MAs \u2014 bearish",momentum:"WEAK",pullbackRisk:"N/A \u2014 downtrend",fib:"$3.20 (last support)",action:"EXIT WATCH. Sell 50% on bounce to $3.70\u20133.80."},
    macro:{tw:["SEA macro recovery potential","Fintech licensing expansion"],hw:["Gojek competition","Sea Limited payments competition","High operating costs"],ai:"LOW",rates:"MEDIUM"},
    thesis:{own:"Original thesis: SEA super-app with fintech moat. Now weakest conviction in portfolio.",strengthens:["Sustained positive FCF","MTU growth re-accelerating"],weakens:["Consistent revenue misses","Profitability timeline extending"],buyMore:"N/A \u2014 do not add",trim:"Sell 50% at $3.70\u20133.80",invalidates:"Already invalidated \u2014 executing exit strategy",cats:["Positive earnings surprise","Fintech license in new market"],risks:["Further downtrend","Capital raise at depressed price","Continued misses"]},
  },
  HNST:{
    sentiment:{label:"SPECULATIVE",score:45,note:"Retail-driven narrative stock. No institutional conviction. Binary catalyst dependent. $4 spike and rejection is a classic catalyst sell-the-news pattern.",expectation:"CATALYST OR NOTHING",asymmetry:"BINARY"},
    ceo:{score:40,beats:1,misses:2,note:"Mixed history. Thesis is catalyst-driven, not execution-driven.",sandbagging:false,sandbaggingNote:"No consistent pattern. Take guidance at face value.",insider:"Limited insider ownership."},
    tech:{rsi:48,rsiNote:"Neutral after spike and rejection. Concerning pattern.",wave:"Event-Driven",waveNote:"$3\u2192$4 spike then immediate rejection = failed breakout or catalyst sell-the-news. If thesis was Toy Story, it may have already fired.",ma:"Flat \u2014 no trend",momentum:"NONE",pullbackRisk:"HIGH \u2014 below $3.00 stop",fib:"$2.90 (avg cost zone)",action:"REASSESS. Set $2.60 hard stop. Exit on break below $3.00."},
    macro:{tw:["Consumer brand recovery","Clean beauty trend"],hw:["Larger brand competition","Margin pressure"],ai:"NONE",rates:"LOW"},
    thesis:{own:"Speculative catalyst play on Toy Story licensing.",strengthens:["Toy Story licensing confirmation","Revenue growth acceleration"],weakens:["Catalyst spent \u2014 spike and rejection pattern","Revenue stagnation"],buyMore:"N/A",trim:"Exit at $4.20 if reached",invalidates:"Toy Story catalyst fails to materialise by Q3 2025",cats:["Toy Story licensing announcement","Revenue beat"],risks:["Catalyst may have already fired ($4 spike)","Revenue stagnation continuing"]},
  },
  UNH:{
    sentiment:{label:"NEGATIVE\u2192IMPROVING",score:38,note:"Heavily sold on legal concerns. Most negative sentiment likely priced in. Optum moat underappreciated. Classic improving-from-negative asymmetry.",expectation:"VERY LOW",asymmetry:"HIGH IF LEGAL RESOLVES"},
    ceo:{score:38,beats:2,misses:4,note:"Pre-legal: exceptional beat history. Post-legal: consistent EPS misses due to legal charges.",sandbagging:false,sandbaggingNote:"Legal costs are non-recurring. Apply +5% bias once legal quantified and settling.",insider:"Management buying at current levels \u2014 strong signal."},
    tech:{rsi:52,rsiNote:"Recovering from oversold. V-shape developing.",wave:"Wave 1 Recovery",waveNote:"V-shaped recovery from $287 lows. Broke above $370 resistance. Wave 1 forming. Next target $400 then $430.",ma:"Reclaiming 50MA \u2014 bullish",momentum:"RECOVERING",pullbackRisk:"MEDIUM",fib:"$360 (0.382 Fib of recovery)",action:"Hold. Hard stop $340. Consider adding 1 share at $360\u2013380."},
    macro:{tw:["Healthcare spending growing","Optum pharmacy moat deepening","Aging US population driving utilisation"],hw:["MLR pressure","Legal/regulatory overhang","Government scrutiny on costs"],ai:"MEDIUM",rates:"LOW"},
    thesis:{own:"Legal overhang entry point into best-in-class health insurer with Optum moat.",strengthens:["Legal settlement announced","MLR returning below 86%","Optum margin recovery"],weakens:["Legal escalation \u2014 criminal charges","MLR deterioration above 90%"],buyMore:"$360\u2013380 with visible legal resolution",trim:"$480+",invalidates:"Criminal charges filed. MLR above 92% for 2 quarters.",cats:["Legal settlement announcement","Q2 2025 MLR beat","Optum margin recovery"],risks:["Legal escalation","MLR deterioration","Government healthcare price controls"]},
  },
};

// ── INTELLIGENCE TAB ─────────────────────────────────────────────
function IntelligenceTab({stock}) {
  const intel = INTEL[stock.ticker];
  if(!intel) return <div style={{color:C.muted,padding:20,fontSize:12}}>Intelligence data not available for this ticker.</div>;
  const [section,setSection] = useState("sentiment");
  const {sentiment,ceo,tech,macro,thesis} = intel;
  const sCol = sentiment.score>=70?C.red:sentiment.score>=50?C.gold:sentiment.score>=30?C.blue:C.accent;
  const SECS = [["sentiment","Sentiment"],["ceo","CEO Exec"],["tech","Technicals"],["macro","Macro"],["thesis","Thesis"]];
  return(
    <div>
      <div style={{display:"flex",gap:3,marginBottom:12,overflowX:"auto",paddingBottom:2}}>
        {SECS.map(([k,l])=>(
          <button key={k} onClick={()=>setSection(k)}
            style={{background:section===k?C.gold:C.card,color:section===k?"#000":C.muted,border:`1px solid ${section===k?C.gold:C.border}`,padding:"5px 11px",borderRadius:4,fontSize:10,fontWeight:section===k?700:400,whiteSpace:"nowrap",fontFamily:"monospace",cursor:"pointer"}}>
            {l}
          </button>
        ))}
      </div>

      {section==="sentiment"&&(
        <div>
          <div style={{background:C.sur,border:`1px solid ${sCol}30`,borderRadius:8,padding:14,marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:10}}>SENTIMENT & PSYCHOLOGY</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:12}}>
              {[["SENTIMENT",sentiment.label,sCol],["SCORE",sentiment.score+"/100",sCol],["ASYMMETRY",sentiment.asymmetry,sentiment.asymmetry.includes("HIGH")?C.accent:C.gold]].map(([l,v,col])=>(
                <div key={l} style={{background:C.card,border:`1px solid ${col}20`,borderRadius:5,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:8,color:C.muted,marginBottom:2}}>{l}</div>
                  <div style={{fontSize:12,fontWeight:700,color:col,fontFamily:"monospace"}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:9,color:C.muted,marginBottom:4}}>CROWD SENTIMENT SPECTRUM</div>
              <div style={{position:"relative",height:12,borderRadius:6,background:`linear-gradient(90deg,${C.accent},${C.blue},${C.gold},${C.red})`}}>
                <div style={{position:"absolute",top:-2,left:`${sentiment.score}%`,transform:"translateX(-50%)",width:6,height:16,background:"#fff",borderRadius:3,boxShadow:"0 0 4px rgba(0,0,0,.6)"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:3,fontSize:8,color:C.muted}}>
                <span>Ignored</span><span>Hated</span><span>Neutral</span><span>Popular</span><span>Euphoric</span>
              </div>
            </div>
            <p style={{fontSize:11,color:C.text,lineHeight:1.7,margin:"0 0 8px"}}>{sentiment.note}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              <div style={{background:`${C.blue}12`,borderRadius:5,padding:"8px 10px"}}>
                <div style={{fontSize:9,color:C.muted,marginBottom:2}}>EXPECTATIONS</div>
                <div style={{fontSize:11,fontWeight:700,color:C.blue}}>{sentiment.expectation}</div>
              </div>
              <div style={{background:`${C.accent}12`,borderRadius:5,padding:"8px 10px"}}>
                <div style={{fontSize:9,color:C.muted,marginBottom:2}}>ASYMMETRY</div>
                <div style={{fontSize:11,fontWeight:700,color:sentiment.asymmetry.includes("HIGH")?C.accent:C.gold}}>{sentiment.asymmetry}</div>
              </div>
            </div>
          </div>
          <div style={{background:`${C.blue}0a`,border:`1px solid ${C.blue}20`,borderRadius:7,padding:12,fontSize:11,color:C.text,lineHeight:1.7}}>
            <span style={{fontWeight:700,color:C.blue}}>Key: </span>A company can beat earnings and fall if expectations were too high. A hated stock with improving fundamentals has asymmetric upside because the bar is low. {stock.ticker}: <span style={{color:sCol,fontWeight:700}}>{sentiment.label}</span>.
          </div>
        </div>
      )}

      {section==="ceo"&&(
        <div>
          <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:10}}>CEO EXECUTION SCORE</div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{textAlign:"center",minWidth:55}}>
                <div style={{fontSize:36,fontWeight:900,color:ceo.score>=70?C.accent:ceo.score>=50?C.gold:C.red,fontFamily:"monospace",lineHeight:1}}>{ceo.score}</div>
                <div style={{fontSize:8,color:C.muted}}>/100</div>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:7,marginBottom:7}}>
                  <div style={{flex:1,textAlign:"center",background:`${C.accent}12`,borderRadius:4,padding:"5px 7px"}}>
                    <div style={{fontSize:16,fontWeight:900,color:C.accent,fontFamily:"monospace"}}>{ceo.beats}</div>
                    <div style={{fontSize:8,color:C.muted}}>BEATS</div>
                  </div>
                  <div style={{flex:1,textAlign:"center",background:`${C.red}12`,borderRadius:4,padding:"5px 7px"}}>
                    <div style={{fontSize:16,fontWeight:900,color:C.red,fontFamily:"monospace"}}>{ceo.misses}</div>
                    <div style={{fontSize:8,color:C.muted}}>MISSES</div>
                  </div>
                  <div style={{flex:2,textAlign:"center",background:`${ceo.sandbagging?C.accent:C.muted}12`,borderRadius:4,padding:"5px 7px"}}>
                    <div style={{fontSize:11,fontWeight:700,color:ceo.sandbagging?C.accent:C.muted}}>{ceo.sandbagging?"SANDBAGGING":"FACE VALUE"}</div>
                    <div style={{fontSize:8,color:C.muted}}>GUIDANCE STYLE</div>
                  </div>
                </div>
                <p style={{fontSize:11,color:C.text,lineHeight:1.6,margin:0}}>{ceo.note}</p>
              </div>
            </div>
            <div style={{background:`${ceo.sandbagging?C.accent:C.muted}10`,border:`1px solid ${ceo.sandbagging?C.accent:C.muted}22`,borderRadius:6,padding:"8px 11px",marginBottom:8}}>
              <div style={{fontSize:9,color:C.muted,marginBottom:2}}>SANDBAGGING ADJUSTMENT</div>
              <div style={{fontSize:11,color:C.text,lineHeight:1.6}}>{ceo.sandbaggingNote}</div>
            </div>
            <div style={{background:C.faint,borderRadius:5,padding:"7px 10px"}}>
              <div style={{fontSize:9,color:C.muted,marginBottom:2}}>INSIDER OWNERSHIP</div>
              <div style={{fontSize:11,color:C.gold}}>{ceo.insider}</div>
            </div>
          </div>
        </div>
      )}

      {section==="tech"&&(
        <div>
          <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:10}}>TECHNICAL STRUCTURE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}>
              {[["RSI",""+tech.rsi,tech.rsi>70?C.red:tech.rsi>55?C.gold:tech.rsi>40?C.accent:C.blue],
                ["WAVE",tech.wave,C.purple],
                ["MOMENTUM",tech.momentum,tech.momentum.includes("STRONG")?C.accent:tech.momentum.includes("RECOV")?C.gold:C.red],
                ["PULLBACK RISK",tech.pullbackRisk,tech.pullbackRisk.includes("LOW")?C.accent:tech.pullbackRisk.includes("MED")?C.gold:C.red],
              ].map(([l,v,col])=>(
                <div key={l} style={{background:C.card,borderRadius:5,padding:"8px 10px"}}>
                  <div style={{fontSize:8,color:C.muted,marginBottom:2}}>{l}</div>
                  <div style={{fontSize:12,fontWeight:700,color:col,fontFamily:"monospace"}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:9,color:C.muted,marginBottom:3}}>RSI — {tech.rsi}</div>
              <div style={{position:"relative",height:10,background:C.faint,borderRadius:5}}>
                <div style={{position:"absolute",left:"30%",right:"30%",top:0,bottom:0,background:`${C.accent}20`,borderRadius:5}}/>
                <div style={{position:"absolute",left:`${tech.rsi}%`,top:-2,bottom:-2,width:4,background:tech.rsi>70?C.red:tech.rsi>55?C.gold:C.accent,borderRadius:2,transform:"translateX(-50%)"}}/>
                <div style={{position:"absolute",left:"30%",top:-13,fontSize:7,color:C.muted,transform:"translateX(-50%)"}}>30</div>
                <div style={{position:"absolute",left:"70%",top:-13,fontSize:7,color:C.muted,transform:"translateX(-50%)"}}>70</div>
              </div>
            </div>
            <div style={{background:`${C.purple}10`,borderRadius:6,padding:"9px 11px",marginBottom:8}}>
              <div style={{fontSize:9,color:C.purple,marginBottom:3,fontWeight:700}}>ELLIOTT WAVE — {tech.wave}</div>
              <div style={{fontSize:11,color:C.text,lineHeight:1.65}}>{tech.waveNote}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              <div style={{background:C.card,borderRadius:5,padding:"7px 10px"}}>
                <div style={{fontSize:9,color:C.muted,marginBottom:2}}>KEY FIB SUPPORT</div>
                <div style={{fontSize:12,fontWeight:700,color:C.gold}}>{tech.fib}</div>
              </div>
              <div style={{background:C.card,borderRadius:5,padding:"7px 10px"}}>
                <div style={{fontSize:9,color:C.muted,marginBottom:2}}>MOVING AVERAGES</div>
                <div style={{fontSize:12,fontWeight:700,color:C.text}}>{tech.ma}</div>
              </div>
            </div>
          </div>
          <div style={{background:`${C.accent}0a`,border:`1px solid ${C.accent}20`,borderRadius:7,padding:11,fontSize:11,color:C.text,lineHeight:1.7}}>
            <span style={{fontWeight:700,color:C.accent}}>Action: </span>{tech.action}
          </div>
        </div>
      )}

      {section==="macro"&&(
        <div>
          <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:10}}>MACRO & NARRATIVE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}>
              {[["AI CYCLE EXPOSURE",macro.ai,macro.ai==="EXTREME"||macro.ai.includes("VERY")?C.accent:macro.ai==="HIGH"?C.gold:C.muted],
                ["RATES SENSITIVITY",macro.rates,macro.rates.includes("VERY")?C.red:macro.rates==="HIGH"?C.gold:C.accent],
              ].map(([l,v,col])=>(
                <div key={l} style={{background:C.card,borderRadius:5,padding:"8px 10px"}}>
                  <div style={{fontSize:8,color:C.muted,marginBottom:2}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:700,color:col}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:C.accent,marginBottom:6}}>TAILWINDS</div>
                {macro.tw.map((t,i)=>(
                  <div key={i} style={{display:"flex",gap:5,alignItems:"flex-start",marginBottom:5}}>
                    <span style={{color:C.accent,fontSize:11,flexShrink:0}}>↑</span>
                    <span style={{fontSize:11,color:C.text,lineHeight:1.5}}>{t}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:C.red,marginBottom:6}}>HEADWINDS</div>
                {macro.hw.map((h,i)=>(
                  <div key={i} style={{display:"flex",gap:5,alignItems:"flex-start",marginBottom:5}}>
                    <span style={{color:C.red,fontSize:11,flexShrink:0}}>↓</span>
                    <span style={{fontSize:11,color:C.text,lineHeight:1.5}}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {section==="thesis"&&(
        <div>
          {[["WHY I OWN THIS",thesis.own,C.accent],
            ["STRENGTHENS CONVICTION",thesis.strengthens.join(" · "),C.accent],
            ["WEAKENS CONVICTION",thesis.weakens.join(" · "),C.red],
            ["BUY MORE IF",thesis.buyMore,C.accent],
            ["TRIM IF",thesis.trim,C.gold],
            ["THESIS INVALIDATED BY",thesis.invalidates,C.red],
          ].map(([l,v,col])=>(
            <div key={l} style={{background:C.sur,border:`1px solid ${col}18`,borderRadius:7,padding:"9px 12px",marginBottom:7}}>
              <div style={{fontSize:9,fontWeight:700,color:col,marginBottom:4,letterSpacing:"0.06em"}}>{l}</div>
              <div style={{fontSize:11,color:C.text,lineHeight:1.65}}>{v}</div>
            </div>
          ))}
          <div style={{background:C.sur,border:`1px solid ${C.blue}18`,borderRadius:7,padding:"9px 12px",marginBottom:7}}>
            <div style={{fontSize:9,fontWeight:700,color:C.blue,marginBottom:5,letterSpacing:"0.06em"}}>KEY CATALYSTS</div>
            {thesis.cats.map((c,i)=>(
              <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:4}}>
                <span style={{color:C.blue,fontSize:10,flexShrink:0,marginTop:1}}>◆</span>
                <span style={{fontSize:11,color:C.text}}>{c}</span>
              </div>
            ))}
          </div>
          <div style={{background:C.sur,border:`1px solid ${C.red}18`,borderRadius:7,padding:"9px 12px"}}>
            <div style={{fontSize:9,fontWeight:700,color:C.red,marginBottom:5,letterSpacing:"0.06em"}}>BIGGEST RISKS</div>
            {thesis.risks.map((r,i)=>(
              <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:4}}>
                <span style={{color:C.red,fontSize:10,flexShrink:0,marginTop:1}}>⚠</span>
                <span style={{fontSize:11,color:C.text}}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ── STOCK DETAIL ──────────────────────────────────────────────────
function StockDetail({stock,onBack}) {
  const [tab,setTab]=useState("overview");
  const pos=stock.price>=stock.avg;
  const pct=((stock.price-stock.avg)/stock.avg*100);
  const abs=(stock.price-stock.avg)*stock.shares;
  const totalCost=STOCKS.reduce((s,p)=>s+(p.avg*p.shares),0);
  const weight=(stock.avg*stock.shares)/totalCost*100;
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <button onClick={onBack} style={{background:C.card,border:`1px solid ${C.border}`,color:C.muted,padding:"6px 11px",borderRadius:4,fontSize:11,fontFamily:"monospace",cursor:"pointer"}}>← Back</button>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"baseline",gap:7,flexWrap:"wrap"}}>
            <span style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:"monospace"}}>{stock.ticker}</span>
            <span style={{fontSize:11,color:C.muted}}>{stock.name}</span>
            <Badge label={cl(stock.conv)+" CONVICTION"} color={cc(stock.conv)}/>
          </div>
          <div style={{fontSize:9,color:C.muted,marginTop:1}}>{stock.sector} · {stock.hold} · <span style={{color:sc(stock.score),fontWeight:700}}>{stock.score}/1000</span></div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:"monospace"}}>${stock.price}</div>
          <div style={{fontSize:11,fontWeight:700,color:pos?C.accent:C.red}}>{pos?"+":""}{pct.toFixed(1)}%</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:10}}>
        {[["SHARES",stock.shares.toFixed(2),C.text],["AVG","$"+stock.avg.toFixed(2),C.text],["VALUE","£"+(stock.price*stock.shares).toFixed(0),C.text],["P&L",(pos?"+":"")+"£"+Math.abs(abs).toFixed(0),pos?C.accent:C.red],["WEIGHT",weight.toFixed(1)+"%",C.gold],["STOP","$"+stock.stop,C.red]].map(([l,v,col])=>(
          <div key={l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:4,padding:"7px 9px"}}>
            <div style={{fontSize:8,color:C.muted,marginBottom:1}}>{l}</div>
            <div style={{fontSize:12,fontWeight:800,color:col,fontFamily:"monospace"}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:3,marginBottom:12,overflowX:"auto",paddingBottom:2}}>
        {[["overview","Overview"],["projections","Projections"],["intrinsic","Intrinsic Value"],["analyst","Analyst"],["intelligence","Intelligence"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:tab===k?C.accent:C.card,color:tab===k?"#000":C.muted,border:`1px solid ${tab===k?C.accent:C.border}`,padding:"6px 12px",borderRadius:4,fontSize:11,fontWeight:tab===k?700:400,whiteSpace:"nowrap",fontFamily:"monospace",cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      {tab==="overview"&&(
        <div>
          <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:7,padding:12,marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:700,color:C.accent,marginBottom:5}}>THESIS</div>
            <p style={{fontSize:12,color:C.text,lineHeight:1.75,margin:0}}>{stock.thesis}</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:10}}>
            {[["BULL",stock.bull,C.accent],["BASE",stock.base,C.blue],["BEAR",stock.bear,C.red]].map(([l,t,col])=>(
              <div key={l} style={{background:`${col}0c`,border:`1px solid ${col}25`,borderRadius:6,padding:10}}>
                <div style={{fontSize:9,fontWeight:700,color:col,marginBottom:4}}>{l} CASE</div>
                <p style={{fontSize:10,color:C.text,lineHeight:1.6,margin:0}}>{t}</p>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {[["ADD ZONE",stock.add,C.accent],["TRIM TARGET","$"+stock.trim,C.gold],["STOP LOSS","$"+stock.stop,C.red],["EXIT WARN","$"+stock.exit,C.red]].map(([l,v,col])=>(
              <div key={l} style={{background:`${col}10`,border:`1px solid ${col}20`,borderRadius:5,padding:"9px 10px"}}>
                <div style={{fontSize:9,color:C.muted}}>{l}</div>
                <div style={{fontSize:14,fontWeight:700,color:col,fontFamily:"monospace",marginTop:2}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab==="projections"&&<ProjectionsTab stock={stock}/>}
      {tab==="intrinsic"&&<IntrinsicTab stock={stock}/>}
      {tab==="analyst"&&<AnalystTab stock={stock}/>}
      {tab==="intelligence"&&<IntelligenceTab stock={stock}/>}
    </div>
  );
}

// ── PORTFOLIO CARD ────────────────────────────────────────────────
function PortCard({stock,onClick}) {
  const pos=stock.price>=stock.avg;
  const pct=((stock.price-stock.avg)/stock.avg*100);
  const abs=(stock.price-stock.avg)*stock.shares;
  return(
    <div onClick={onClick} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:7,padding:"12px 14px",cursor:"pointer",position:"relative",overflow:"hidden",marginBottom:9,transition:"border-color .15s"}}
      onMouseEnter={e=>e.currentTarget.style.borderColor=cc(stock.conv)}
      onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:cc(stock.conv)}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
        <div>
          <span style={{fontSize:19,fontWeight:900,color:C.text,fontFamily:"monospace"}}>{stock.ticker}</span>
          <span style={{fontSize:10,color:C.muted,marginLeft:7}}>{stock.name}</span>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:17,fontWeight:800,color:C.text,fontFamily:"monospace"}}>${stock.price}</div>
          <div style={{fontSize:11,fontWeight:700,color:pos?C.accent:C.red}}>{pos?"+":""}{pct.toFixed(1)}%</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3,marginBottom:7,background:C.bg,borderRadius:4,padding:"6px 8px"}}>
        {[["SH",stock.shares.toFixed(1)],["AVG","$"+stock.avg.toFixed(2)],["VAL","£"+(stock.price*stock.shares).toFixed(0)],["P&L",(pos?"+":"")+"£"+Math.abs(abs).toFixed(0)]].map(([l,v],i)=>(
          <div key={l}><div style={{fontSize:8,color:C.muted}}>{l}</div><div style={{fontSize:11,fontWeight:700,color:i===3?(pos?C.accent:C.red):C.text,fontFamily:"monospace"}}>{v}</div></div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <Badge label={cl(stock.conv)} color={cc(stock.conv)} sm/>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:9,color:stock.reliability.color,fontFamily:"monospace"}}>proj {stock.reliability.score}/100</span>
          <span style={{fontSize:10,color:sc(stock.score),fontFamily:"monospace"}}>{stock.score}/1000</span>
        </div>
      </div>
      <Bar pct={(stock.score/1000)*100} color={cc(stock.conv)}/>
      {/* Suggested action from intelligence */}
      {INTEL[stock.ticker]&&(
        <div style={{marginTop:6,fontSize:9,color:INTEL[stock.ticker].tech.momentum.includes("STRONG")?C.accent:INTEL[stock.ticker].tech.pullbackRisk.includes("EXIT")||INTEL[stock.ticker].tech.pullbackRisk.includes("CRITICAL")?C.red:C.gold,lineHeight:1.4}}>
          {INTEL[stock.ticker].tech.action.length>55?INTEL[stock.ticker].tech.action.slice(0,55)+"…":INTEL[stock.ticker].tech.action}
        </div>
      )}
    </div>
  );
}

// ── REMAINING TABS ────────────────────────────────────────────────
function MacroTab(){
  return(
    <div>
      <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:7,padding:12,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
          <span style={{fontSize:11,fontWeight:700,color:C.text}}>MACRO REGIME</span>
          <Badge label="CAUTIOUSLY RISK-ON" color={C.gold}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:9}}>
          {[["RATES","1–2 cuts expected 2025",C.blue],["INFLATION","CPI trending down",C.gold],["RECESSION","15–20% risk 12mo",C.red],["AI THEME","STRONG — CapEx continuing",C.accent]].map(([l,v,col])=>(
            <div key={l} style={{background:C.bg,borderRadius:4,padding:"7px 9px"}}>
              <div style={{fontSize:8,color:C.muted,marginBottom:1}}>{l}</div>
              <div style={{fontSize:11,color:col}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"7px 9px",background:`${C.gold}10`,borderRadius:4,fontSize:11,color:C.gold}}>SOFI $15 neckline critical. OSCR RSI extended. GRAB exit overdue.</div>
      </div>
      <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:7,padding:12}}>
        <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:9}}>CONVICTION RANKING</div>
        {[...STOCKS].sort((a,b)=>b.score-a.score).map((s,i)=>{
          const pct=((s.price-s.avg)/s.avg*100);
          return(
            <div key={s.ticker} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 0",borderBottom:i<STOCKS.length-1?`1px solid ${C.border}`:"none"}}>
              <span style={{fontSize:10,color:C.muted,minWidth:16,fontFamily:"monospace"}}>#{i+1}</span>
              <span style={{fontSize:13,fontWeight:900,color:C.text,minWidth:44,fontFamily:"monospace"}}>{s.ticker}</span>
              <div style={{flex:1}}><Bar pct={(s.score/1000)*100} color={cc(s.conv)}/></div>
              <span style={{fontSize:9,color:sc(s.score),minWidth:46,textAlign:"right",fontFamily:"monospace"}}>{s.score}/1000</span>
              <span style={{fontSize:9,color:s.reliability.color,minWidth:38,textAlign:"right",fontFamily:"monospace"}}>{s.reliability.score}/100</span>
              <span style={{fontSize:10,fontWeight:700,color:pct>=0?C.accent:C.red,minWidth:46,textAlign:"right",fontFamily:"monospace"}}>{pct>=0?"+":""}{pct.toFixed(1)}%</span>
            </div>
          );
        })}
        <div style={{fontSize:9,color:C.muted,marginTop:6}}>Score /1000 = conviction · Proj /100 = projection reliability</div>
      </div>
    </div>
  );
}

function AllocTab(){
  const [budget,setBudget]=useState(600);
  const [on,setOn]=useState({etf:true,oscr:true,hims:true,lisa:true,zeta:false});
  const B={etf:{l:"ETFs (VWRP/VUSA)",b:150,f:true,c:C.blue},lisa:{l:"LISA",b:100,f:true,c:C.purple},oscr:{l:"OSCR DCA",b:300,f:false,c:C.accent},hims:{l:"HIMS entry",b:150,f:false,c:C.accent},zeta:{l:"ZETA opportunistic",b:50,f:false,c:C.gold}};
  const ft=Object.entries(B).filter(([k,b])=>b.f&&on[k]).reduce((s,[,b])=>s+b.b,0);
  const fb=Object.entries(B).filter(([k,b])=>!b.f&&on[k]).reduce((s,[,b])=>s+b.b,0);
  const r=fb>0?Math.max(0,budget-ft)/fb:0;
  const al={};Object.keys(B).forEach(k=>{al[k]=on[k]?(B[k].f?B[k].b:Math.round(B[k].b*r)):0;});
  const un=budget-Object.values(al).reduce((a,b)=>a+b,0);
  return(
    <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:7,padding:12}}>
      <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:10}}>DYNAMIC MONTHLY ALLOCATION</div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,background:C.card,borderRadius:5,padding:"8px 10px"}}>
        <span style={{fontSize:12,color:C.muted}}>This month:</span>
        <span style={{fontSize:15,color:C.muted,fontFamily:"monospace"}}>£</span>
        <input type="number" value={budget} onChange={e=>setBudget(Math.max(0,Number(e.target.value)))} style={{width:70,background:"transparent",border:`1px solid ${C.border}`,borderRadius:3,padding:"4px 7px",color:C.accent,fontSize:17,fontWeight:900,fontFamily:"monospace",outline:"none",textAlign:"center"}}/>
        {un!==0&&<span style={{fontSize:10,color:un>0?C.gold:C.red,marginLeft:"auto"}}>{un>0?`+£${un} left`:`£${Math.abs(un)} over`}</span>}
      </div>
      {Object.entries(B).map(([k,b])=>(
        <div key={k} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:`1px solid ${C.border}`,opacity:on[k]?1:.4}}>
          <button onClick={()=>setOn(p=>({...p,[k]:!p[k]}))} style={{width:24,height:24,borderRadius:4,border:`2px solid ${on[k]?b.c:C.border}`,background:on[k]?`${b.c}20`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:on[k]?b.c:C.muted,fontSize:12,flexShrink:0,cursor:"pointer"}}>{on[k]?"✓":""}</button>
          <div style={{flex:1,fontSize:12,color:C.text,fontWeight:600}}>{b.l}</div>
          <div style={{fontSize:17,fontWeight:900,color:on[k]?b.c:C.muted,fontFamily:"monospace"}}>£{al[k]}</div>
        </div>
      ))}
      <div style={{marginTop:8,display:"flex",gap:1,height:7,borderRadius:3,overflow:"hidden"}}>
        {Object.entries(B).filter(([k])=>on[k]&&al[k]>0).map(([k,b])=><div key={k} style={{flex:al[k],background:b.c,opacity:.8}}/>)}
        {un>0&&<div style={{flex:un,background:C.faint}}/>}
      </div>
    </div>
  );
}

function SearchTab(){
  const [input,setInput]=useState("");
  const [res,setRes]=useState(null);
  const [busy,setBusy]=useState(false);
  const [wl,setWl]=useState([{ticker:"HIMS",score:810,col:C.accent,verdict:"HIGH CONVICTION",recSize:"£150/mo"},{ticker:"NU",score:720,col:C.gold,verdict:"MEDIUM CONVICTION",recSize:"£50–100/mo"}]);
  const [detailStock,setDetailStock]=useState(null);
  if(detailStock) return <StockDetail stock={detailStock} onBack={()=>setDetailStock(null)}/>;
  const go=()=>{
    const tk=input.trim().toUpperCase();if(!tk)return;
    setBusy(true);setRes(null);
    const known=STOCKS.find(s=>s.ticker===tk);
    setTimeout(()=>{
      if(known)setRes({ticker:known.ticker,name:known.name,price:known.price,score:known.score,col:sc(known.score),verdict:known.score>=780?"HIGH CONVICTION":"MEDIUM CONVICTION",recSize:"£150/mo",recHold:known.hold,stock:known});
      else{const s=Math.round(500+Math.random()*350);setRes({ticker:tk,name:tk+" (live data on Vercel)",price:+(30+Math.random()*200).toFixed(2),score:s,col:sc(s),verdict:s>=780?"HIGH CONVICTION":"MEDIUM CONVICTION",recSize:s>=780?"£150/mo":"£50–100/mo",recHold:"12–24mo"});}
      setBusy(false);
    },900);
  };
  return(
    <div>
      <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:7,padding:12,marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:8}}>TICKER ANALYSER</div>
        <div style={{display:"flex",gap:7}}>
          <input value={input} onChange={e=>setInput(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="e.g. HIMS, AMD, PLTR…" style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:4,padding:"8px 10px",color:C.text,fontSize:12,fontFamily:"monospace",outline:"none"}}/>
          <button onClick={go} disabled={busy} style={{background:busy?C.faint:C.accent,color:busy?C.muted:"#000",border:"none",borderRadius:4,padding:"8px 14px",fontSize:11,fontWeight:700,cursor:busy?"not-allowed":"pointer",fontFamily:"monospace"}}>{busy?"…":"ANALYSE"}</button>
        </div>
      </div>
      {res&&(
        <div style={{background:C.sur,border:`1px solid ${res.col}30`,borderRadius:7,padding:12,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <div><span style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:"monospace"}}>{res.ticker}</span><span style={{fontSize:10,color:C.muted,marginLeft:7}}>{res.name}</span></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:17,fontWeight:900,color:C.text,fontFamily:"monospace"}}>${res.price}</div><div style={{fontSize:10,color:res.col,fontWeight:700}}>{res.score}/1000</div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
            <div style={{background:C.card,borderRadius:4,padding:"8px 10px"}}><div style={{fontSize:9,color:C.muted}}>VERDICT</div><div style={{fontSize:12,fontWeight:700,color:res.col,marginTop:2}}>{res.verdict}</div></div>
            <div style={{background:C.card,borderRadius:4,padding:"8px 10px"}}><div style={{fontSize:9,color:C.muted}}>REC SIZE · HOLD</div><div style={{fontSize:12,fontWeight:700,color:C.gold,marginTop:2}}>{res.recSize} · {res.recHold}</div></div>
          </div>
          <div style={{display:"flex",gap:7}}>
            {res.stock&&<button onClick={()=>setDetailStock(res.stock)} style={{background:C.blue,color:"#fff",border:"none",borderRadius:4,padding:"7px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"monospace"}}>📊 Full Analysis</button>}
            <button onClick={()=>{if(!wl.find(w=>w.ticker===res.ticker))setWl(p=>[...p,res]);setRes(null);setInput("");}} style={{background:C.accent,color:"#000",border:"none",borderRadius:4,padding:"7px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"monospace"}}>✓ Watchlist</button>
            <button onClick={()=>{setRes(null);setInput("");}} style={{background:C.card,color:C.muted,border:`1px solid ${C.border}`,borderRadius:4,padding:"7px 10px",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>✕</button>
          </div>
        </div>
      )}
      {wl.length>0&&(
        <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:7,padding:12}}>
          <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:8}}>WATCHLIST</div>
          {wl.map((w,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:i<wl.length-1?`1px solid ${C.border}`:"none"}}>
              <span style={{fontSize:14,fontWeight:900,color:C.text,minWidth:44,fontFamily:"monospace"}}>{w.ticker}</span>
              <div style={{flex:1}}><Bar pct={(w.score/1000)*100} color={w.col}/></div>
              <span style={{fontSize:11,color:w.col,fontFamily:"monospace"}}>{w.score}/1000</span>
              <Badge label={w.recSize} color={w.col} sm/>
              <button onClick={()=>setWl(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:3,padding:"2px 6px",cursor:"pointer",fontSize:10}}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("portfolio");
  const [sel,setSel]=useState(null);
  const tv=STOCKS.reduce((s,p)=>s+(p.price*p.shares),0);
  const tc=STOCKS.reduce((s,p)=>s+(p.avg*p.shares),0);
  const pnl=tv-tc,pct=(pnl/tc*100);
  const stock=sel?STOCKS.find(s=>s.ticker===sel):null;
  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'Fira Code','Courier New',monospace",paddingBottom:60}}>
      <div style={{background:C.sur,borderBottom:`1px solid ${C.border}`,padding:"0 12px",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",height:46,gap:10}}>
          <div style={{fontSize:13,fontWeight:900,cursor:"pointer",flexShrink:0}} onClick={()=>{setTab("portfolio");setSel(null);}}>
            <span style={{color:C.accent}}>PORTFOLIO</span><span style={{color:C.gold}}>PROJECT</span>
          </div>
          <div style={{display:"flex",gap:1,flex:1,overflowX:"auto"}}>
            {[["portfolio","Portfolio"],["macro","Macro"],["allocation","Allocation"],["search","Search"]].map(([k,l])=>(
              <button key={k} onClick={()=>{setTab(k);setSel(null);}} style={{background:tab===k?`${C.accent}15`:"transparent",border:"none",color:tab===k?C.accent:C.muted,padding:"5px 9px",borderRadius:3,fontSize:11,fontWeight:tab===k?700:400,fontFamily:"monospace",whiteSpace:"nowrap",cursor:"pointer"}}>{l}</button>
            ))}
          </div>
          <span style={{fontSize:9,color:C.muted,flexShrink:0}}>Preview</span>
        </div>
      </div>
      <div style={{padding:"12px 12px 0"}}>
        {tab==="portfolio"&&!stock&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
              {[["TOTAL VALUE","£"+tv.toFixed(0),C.text],["COST BASIS","£"+tc.toFixed(0),C.muted],["UNREALISED P&L",(pnl>=0?"+":"")+"£"+Math.abs(pnl).toFixed(0),pnl>=0?C.accent:C.red],["TOTAL RETURN",(pct>=0?"+":"")+pct.toFixed(1)+"%",pct>=0?C.accent:C.red]].map(([l,v,col])=>(
                <div key={l} style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 10px"}}>
                  <div style={{fontSize:8,color:C.muted,marginBottom:1}}>{l}</div>
                  <div style={{fontSize:17,fontWeight:900,color:col,fontFamily:"monospace"}}>{v}</div>
                </div>
              ))}
            </div>
            {STOCKS.map(s=><PortCard key={s.ticker} stock={s} onClick={()=>setSel(s.ticker)}/>)}
          </>
        )}
        {stock&&<StockDetail stock={stock} onBack={()=>setSel(null)}/>}
        {tab==="macro"&&!stock&&<MacroTab/>}
        {tab==="allocation"&&!stock&&<AllocTab/>}
        {tab==="search"&&!stock&&<SearchTab/>}
      </div>
    </div>
  );
}
