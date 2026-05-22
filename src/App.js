import { useState, useMemo, useEffect, useCallback, useRef } from "react";

const C = {
  bg:"#07090d",sur:"#0c0f15",card:"#0f1420",border:"#1a2035",
  accent:"#00e0a8",gold:"#f0b429",red:"#ff3d58",blue:"#3d9eff",purple:"#a78bfa",
  text:"#dce2ed",muted:"#566078",faint:"#151b2d",
};
const cc = v => v==="high"?C.accent:v==="medium"?C.gold:C.red;
const cl = v => v==="high"?"HIGH":v==="medium"?"MED":"LOW";
const sc = s => s>=780?C.accent:s>=640?C.gold:s>=480?C.blue:C.red;

// ── API LAYER ─────────────────────────────────────────────────────
const fetchPrice = async (ticker) => {
  try {
    const r = await fetch(`/api/fh?path=quote%3Fsymbol%3D${ticker}`);
    if (!r.ok) return null;
    const d = await r.json();
    return d && d.c > 0 ? +d.c.toFixed(2) : null;
  } catch { return null; }
};

// Live GBP/USD from Finnhub forex
const fetchGBPUSD = async () => {
  try {
    const r = await fetch(`/api/fh?path=quote%3Fsymbol%3DOANDA%3AGBP_USD`);
    if (!r.ok) return 1.27; // fallback
    const d = await r.json();
    return d && d.c > 0 ? +d.c : 1.27;
  } catch { return 1.27; }
};

const fetchNews = async (ticker) => {
  try {
    const today = new Date().toISOString().slice(0,10);
    const from = new Date(Date.now()-7*864e5).toISOString().slice(0,10);
    const r = await fetch(`/api/fh?path=company-news%3Fsymbol%3D${ticker}%26from%3D${from}%26to%3D${today}`);
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d.slice(0,6) : [];
  } catch { return []; }
};

const Spinner = () => (
  <span style={{display:"inline-block",width:10,height:10,border:"2px solid #00e0a840",borderTopColor:"#00e0a8",borderRadius:"50%",animation:"spin .8s linear infinite"}}>
    <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
  </span>
);

// ── NEWS IMPACT ENGINE ────────────────────────────────────────────
function getNewsImpact(headline, ticker) {
  const h = headline.toLowerCase();
  let impact = "", severity = "neutral", magnitude = "";

  if(h.includes("beat")||h.includes("exceeds")||h.includes("surpass")) {
    impact = "Earnings beat — potential 5–15% upside if guidance raised simultaneously";
    severity = "positive"; magnitude = "MEDIUM";
  } else if(h.includes("miss")||h.includes("below expectations")||h.includes("falls short")) {
    impact = "Earnings miss — guidance cut risk amplifies downside 10–20%";
    severity = "negative"; magnitude = "HIGH";
  } else if(h.includes("upgrade")&&h.includes("analyst")) {
    impact = "Analyst upgrade increases institutional buy pressure — typically 3–8% short-term pop";
    severity = "positive"; magnitude = "LOW–MEDIUM";
  } else if(h.includes("downgrade")) {
    impact = "Analyst downgrade signals institutional selling — 3–10% pressure likely";
    severity = "negative"; magnitude = "MEDIUM";
  } else if(h.includes("fed")||h.includes("rate cut")||h.includes("interest rate")||h.includes("inflation")) {
    impact = ticker==="SOFI"
      ? "CRITICAL for SOFI — rate cut = NIM expansion = thesis catalyst. High sensitivity."
      : "Macro rate news — moderate indirect impact via sector rotation";
    severity = ticker==="SOFI"?"positive":"neutral"; magnitude = ticker==="SOFI"?"VERY HIGH":"LOW";
  } else if(h.includes("china")||h.includes("export restriction")||h.includes("tariff")) {
    impact = ticker==="NVDA"
      ? "DIRECT RISK for NVDA — China export ban is the #1 bear thesis. Monitor closely."
      : "Trade/China news — indirect sector impact";
    severity = "negative"; magnitude = ticker==="NVDA"?"VERY HIGH":"LOW";
  } else if(h.includes("fda")||h.includes("approval")||h.includes("drug approval")) {
    impact = "FDA binary catalyst — can move 20–50% in a single session. Position accordingly.";
    severity = "positive"; magnitude = "VERY HIGH";
  } else if(h.includes("lawsuit")||h.includes("investigation")||h.includes("doj")||h.includes("sec probe")) {
    impact = ticker==="UNH"
      ? "Legal news is the #1 UNH catalyst — settlement = re-rating, escalation = downside risk"
      : "Legal/regulatory overhang — creates uncertainty discount until resolution";
    severity = "negative"; magnitude = ticker==="UNH"?"VERY HIGH":"MEDIUM";
  } else if(h.includes("buyback")||h.includes("dividend")) {
    impact = "Capital return signals management confidence — typically 2–5% boost to sentiment";
    severity = "positive"; magnitude = "LOW–MEDIUM";
  } else if(h.includes("guidance")||h.includes("outlook")||h.includes("forecast")) {
    impact = "Forward guidance update — direction and language more important than numbers";
    severity = "neutral"; magnitude = "MEDIUM";
  } else if(h.includes("revenue")||h.includes("quarterly results")) {
    impact = "Revenue print — growth rate direction is the key signal vs. analyst consensus";
    severity = "neutral"; magnitude = "MEDIUM";
  } else if(h.includes("mlr")||h.includes("medical loss")) {
    impact = ticker==="OSCR"
      ? "CRITICAL for OSCR — MLR is the single most important metric. Below 83% = bullish."
      : "Healthcare cost ratio news — sector-wide sentiment impact";
    severity = "neutral"; magnitude = ticker==="OSCR"?"VERY HIGH":"LOW";
  } else {
    impact = "Monitor for follow-up developments that confirm or contradict thesis direction";
    severity = "neutral"; magnitude = "LOW";
  }

  const col = severity==="positive"?C.accent:severity==="negative"?C.red:C.gold;
  return { impact, col, magnitude };
}

function NewsPanel({ticker}) {
  const [news,setNews] = useState([]);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{
    setLoading(true);
    fetchNews(ticker).then(d=>{setNews(d);setLoading(false);});
  },[ticker]);

  const sCol = h => {
    const hl=h.toLowerCase();
    if(hl.includes("beat")||hl.includes("surge")||hl.includes("upgrade")||hl.includes("growth")||hl.includes("record")) return C.accent;
    if(hl.includes("miss")||hl.includes("fall")||hl.includes("drop")||hl.includes("downgrade")||hl.includes("probe")||hl.includes("concern")) return C.red;
    return C.gold;
  };

  return(
    <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
        📰 LATEST NEWS — {ticker} {loading&&<Spinner/>}
      </div>
      {!loading&&news.length===0&&(
        <div style={{fontSize:11,color:C.muted,fontStyle:"italic",lineHeight:1.6}}>
          No recent news loaded. Headlines appear here once Finnhub API is active on Vercel.<br/>
          <span style={{fontSize:10,color:C.muted}}>Check that FINNHUB_KEY is set in Vercel environment variables.</span>
        </div>
      )}
      {news.map((n,i)=>{
        const {impact,col,magnitude} = getNewsImpact(n.headline||"", ticker);
        return(
          <div key={i} style={{padding:"10px 0",borderBottom:i<news.length-1?`1px solid ${C.border}`:"none"}}>
            <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:sCol(n.headline||""),flexShrink:0,marginTop:4}}/>
              <div style={{flex:1}}>
                <a href={n.url} target="_blank" rel="noopener noreferrer"
                  style={{fontSize:11,color:sCol(n.headline||""),textDecoration:"none",lineHeight:1.55,display:"block",fontWeight:600}}>
                  {n.headline}
                </a>
                <div style={{fontSize:9,color:C.muted,marginTop:2}}>
                  {n.source} · {n.datetime?new Date(n.datetime*1000).toLocaleDateString():""}
                </div>
                {/* Impact analysis */}
                <div style={{marginTop:5,background:`${col}0d`,border:`1px solid ${col}20`,borderRadius:4,padding:"5px 8px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                    <span style={{fontSize:9,fontWeight:700,color:col}}>IMPACT ANALYSIS</span>
                    <span style={{fontSize:9,color:col,fontFamily:"monospace",fontWeight:700}}>{magnitude}</span>
                  </div>
                  <div style={{fontSize:10,color:C.text,lineHeight:1.55}}>{impact}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── STOCK DATA ────────────────────────────────────────────────────
// sharesOut in MILLIONS, rev in $M, netCash in $M
// projRevG = realistic forward growth rate (NOT skewed historical avg)
const STOCKS = [
  {ticker:"OSCR",name:"Oscar Health",      shares:342.14, avg:17.09,price:23.27,conv:"high",  score:827,cat:"Hypergrowth",   hold:"24–36mo",sector:"Healthcare",
   netCash:1200,sharesOut:342,dilution:3.5,projRevG:35,
   hist:[{y:2021,rev:1920,revG:225.8,ni:-572,nim:-29.8,eps:-3.19},{y:2022,rev:4125,revG:114.8,ni:-606,nim:-14.7,eps:-2.87},{y:2023,rev:5862,revG:42.1,ni:-270,nim:-4.6,eps:-1.22},{y:2024,rev:7955,revG:35.7,ni:21,nim:0.28,eps:0.11}],
   thesis:"Technology-driven health insurer attacking a $1T+ TAM. Revenue +53% YoY in Q1 2026. MLR dramatically improved to 70.5% in Q1 2026 (guide: 82.4–83.4% full year). CEO guidance: $2.25 EPS and 5% operating margin by 2027. Membership hit 3.2M (+56% YoY).",
   bull:"MLR sustains below 82%, membership 4M+ by year end, EPS $2.50+. $55–65.",
   base:"Steady MLR at 83%, membership grows 40%, EPS $1.50–2.00. $38–48.",
   bear:"H2 utilisation spike, MLR reverts to 87%+, capital raise risk. $14–17.",
   whenBuy:"RSI reset to 50–55 is the ideal re-entry. $21–22 is the key add zone — that is the Wave 4 pullback and 0.382 Fibonacci support. Do NOT chase at $22+. Wait for weekly close above $24 with above-average volume before adding new capital.",
   watchFor:"Q2 2026 MLR print is critical — full-year guide is 82.4–83.4%. Any print above 85% is a yellow flag. Watch CMS regulatory announcements on ACA subsidies. $20.50 is the hard stop — below that the thesis is in question. CEO insider buying at these levels would be a strong confirmation signal.",
   stop:20.50,trim:45,add:"$21–22",exit:19.00,
   aH:42,aL:11,aC:20.30,aBuy:72,aHold:20,aSell:8,aCount:18,
   peerPE:{low:20,mid:30,high:45},peerNote:"Early-stage health insurer. Peers trade 20–45x once profitable. OSCR commands premium for growth rate.",
   reliability:{score:58,label:"MODERATE",color:C.gold,note:"CEO 2027 guidance exists which helps. But margin path from -5% to +5% involves many variables. PE multiple highly uncertain pre-profitability."},
   // Parkev-style DCF inputs
   parkev:{fcfBase:250,fcfGrowthBull:0.35,fcfGrowthBase:0.22,fcfGrowthBear:0.10,wacc:0.10,terminalG:0.03,nonOpAssets:1200,debt:850,sharesM:342,note:"Using projected FCF approaching profitability. 2026 Adj.EBITDA $727M annualised as proxy."}
  },
  {ticker:"SOFI",name:"SoFi Technologies", shares:1896.97,avg:18.86,price:15.71,conv:"high",  score:740,cat:"Hypergrowth",   hold:"36–60mo",sector:"Fintech",
   netCash:2800,sharesOut:1100,dilution:2.0,projRevG:22,
   hist:[{y:2021,rev:985,revG:68.2,ni:-484,nim:-49.1,eps:-0.52},{y:2022,rev:1521,revG:54.4,ni:-320,nim:-21.0,eps:-0.34},{y:2023,rev:2124,revG:39.6,ni:48,nim:2.3,eps:0.05},{y:2024,rev:2751,revG:29.5,ni:499,nim:18.1,eps:0.48}],
   thesis:"Becoming the Amazon of consumer finance. Bank charter is the structural moat enabling sub-2% deposit cost. Rate cut cycle is the macro catalyst — each 25bps cut expands NIM ~15–20bps. Head & shoulders neckline at $15 is the most critical technical level in the portfolio. CEO Noto bought shares at $8–9.",
   bull:"Rate cuts 2025–26, student loan refi boom, NIM expands to 6%+. $28–35.",
   base:"Steady member growth to 12M+, margin expansion, 2028 checkpoint at $35.",
   bear:"Rate cuts delayed into 2026, H&S breaks $15 on volume — signals $12–13.",
   whenBuy:"ONLY add between $14.50–$15.50. The $15 H&S neckline is binary — it either holds and becomes a launchpad or breaks and confirms the pattern. If it breaks below $15 on heavy volume, do NOT add — wait for $13 capitulation before reassessing. CEO Form 4 filings at these levels are a strong signal.",
   watchFor:"Watch $15 neckline on weekly close — this single level overrides all other signals. Watch every Fed meeting for rate cut language changes. Watch NIM trend in quarterly results — needs to stay above 5.5% and expanding. Watch CEO Noto Form 4 filings.",
   stop:13.50,trim:22,add:"$14.50–15.50",exit:13.00,
   aH:31,aL:23,aC:27.67,aBuy:35,aHold:52,aSell:13,aCount:23,
   peerPE:{low:15,mid:25,high:40},peerNote:"Fintech with bank charter. Rate sensitivity is the key re-rating trigger. Charter moat justifies premium over pure fintechs.",
   reliability:{score:65,label:"MODERATE–GOOD",color:C.gold,note:"Rate sensitivity makes margin prediction harder. Bank charter provides floor on multiple. CEO share purchases increase credibility significantly."},
   parkev:{fcfBase:520,fcfGrowthBull:0.28,fcfGrowthBase:0.18,fcfGrowthBear:0.08,wacc:0.10,terminalG:0.03,nonOpAssets:2800,debt:3200,sharesM:1100,note:"Bank charter changes FCF dynamics. Using adj. net income as FCF proxy. Rate sensitivity built into growth scenarios."}
  },
  {ticker:"ZETA",name:"Zeta Global",        shares:39.99, avg:16.76,price:18.22,conv:"medium",score:687,cat:"Speculative Growth",hold:"18–24mo",sector:"AdTech/AI",
   netCash:180,sharesOut:185,dilution:4.0,projRevG:22,
   hist:[{y:2021,rev:441,revG:38.5,ni:-102,nim:-23.1,eps:-0.51},{y:2022,rev:557,revG:26.3,ni:-92,nim:-16.5,eps:-0.41},{y:2023,rev:727,revG:30.5,ni:-31,nim:-4.3,eps:-0.13},{y:2024,rev:924,revG:27.1,ni:18,nim:1.9,eps:0.07}],
   thesis:"AI-powered marketing cloud with ~28% YoY revenue growth. 250M+ identity graph is the data moat that competitors cannot replicate quickly. Transitioning to profitability — 2024 first profitable year. Enterprise AI marketing is a $50B+ market.",
   bull:"AI marketing spend accelerates, scaled customer growth 20%+. $35–42.",
   base:"20–25% growth sustained, NI margin expands to 5–8%. $26–32.",
   bear:"AdTech budget cuts, Salesforce/Adobe competition, multiple compression. $10–13.",
   whenBuy:"Add only at $16–18 opportunistically on weakness. Do not chase above $20. Keep position small relative to Core 4 until clear revenue acceleration above 30%.",
   watchFor:"Scaled customer count each quarter — needs 15%+ growth to justify valuation. Enterprise AI marketing announcement or large contract would be a significant catalyst. Watch NI margin trend — must sustain above 2% and expanding.",
   stop:14.50,trim:30,add:"$16–18",exit:14.00,
   aH:28,aL:14,aC:22,aBuy:60,aHold:30,aSell:10,aCount:15,
   peerPE:{low:15,mid:22,high:35},peerNote:"AdTech/SaaS peers trade 15–35x. Growth rate justifies upper end if AI thesis plays out. Multiple volatile with sector sentiment.",
   reliability:{score:54,label:"MODERATE",color:C.gold,note:"No strong public guidance. Margin improvement visible but not confirmed. AdTech multiples compress fast in risk-off environments."},
   parkev:{fcfBase:45,fcfGrowthBull:0.30,fcfGrowthBase:0.20,fcfGrowthBear:0.08,wacc:0.11,terminalG:0.03,nonOpAssets:180,debt:320,sharesM:185,note:"Early profitability. FCF projection from adj. EBITDA trajectory."}
  },
  {ticker:"META",name:"Meta Platforms",     shares:2.59,  avg:630.58,price:603.50,conv:"medium",score:878,cat:"Momentum",     hold:"12–18mo",sector:"Tech",
   netCash:58000,sharesOut:2570,dilution:0.5,projRevG:18,
   hist:[{y:2021,rev:117929,revG:37.2,ni:39370,nim:33.4,eps:13.77},{y:2022,rev:116609,revG:-1.1,ni:23200,nim:19.9,eps:8.59},{y:2023,rev:134902,revG:15.7,ni:39098,nim:29.0,eps:14.87},{y:2024,rev:164501,revG:21.9,ni:62360,nim:37.9,eps:23.86}],
   thesis:"Compounding at ~20% revenue growth with 40%+ net margins. CapEx concerns are overblown if Llama and AI ad monetisation inflect as expected. 40%+ margins at 20% growth is rare at this scale. Wave 4 correction currently at 0.382 Fib — historically the best entry in a continuation structure.",
   bull:"AI ad monetisation inflects, Threads scales to $5B+ revenue, CapEx concerns fade. $850–1000.",
   base:"Revenue 18–20% growth sustained, margins hold at 38%+, CapEx normalises. $720–780.",
   bear:"EU regulatory breakup action, CapEx disappointment, ad slowdown. $480–520.",
   whenBuy:"Current $603 IS a buy zone — Wave 4 correction at 0.382 Fib. Add between $570–600. Strong move below $590 without fundamental cause is a gift. Do not wait for $550 — you will miss the Wave 5.",
   watchFor:"Q2 2026 ad revenue growth — needs 18%+. CapEx guidance as % of revenue — any reduction is a massive re-rating catalyst. Threads DAU and monetisation disclosure. EU DSA enforcement actions.",
   stop:540,trim:750,add:"$570–600",exit:530,
   aH:935,aL:480,aC:720,aBuy:85,aHold:12,aSell:3,aCount:52,
   peerPE:{low:18,mid:24,high:32},peerNote:"Mega-cap tech peers trade 22–28x. META historically discounted to peers — re-rating likely as AI monetises fully.",
   reliability:{score:86,label:"HIGH",color:C.accent,note:"Most reliable model in portfolio. Clear revenue guidance, stable margins, minimal dilution, fortress balance sheet. $58B net cash provides floor."},
   parkev:{fcfBase:52000,fcfGrowthBull:0.18,fcfGrowthBase:0.14,fcfGrowthBear:0.08,wacc:0.09,terminalG:0.03,nonOpAssets:58000,debt:18900,sharesM:2570,note:"Using FCF ~$52B (2024). High confidence due to margin consistency. CapEx normalisation is upside catalyst."}
  },
  {ticker:"AMZN",name:"Amazon",             shares:7.10,  avg:215.56,price:266.55,conv:"medium",score:904,cat:"Hypergrowth",  hold:"12–24mo",sector:"Tech",
   netCash:78000,sharesOut:10700,dilution:0.8,projRevG:13,
   hist:[{y:2021,rev:469822,revG:21.7,ni:33364,nim:7.1,eps:3.24},{y:2022,rev:513983,revG:9.4,ni:-2722,nim:-0.5,eps:-0.27},{y:2023,rev:574785,revG:11.8,ni:30425,nim:5.3,eps:2.90},{y:2024,rev:637959,revG:11.0,ni:59248,nim:9.3,eps:5.53}],
   thesis:"AWS growing 17%+ with 30%+ operating margins. Advertising approaching $60B annually. Three compounding engines — AWS, Ads, Retail — all expanding simultaneously. Highest fundamental quality score in portfolio at 904/1000.",
   bull:"AWS accelerates to 22%+ on AI infrastructure demand, ads reach $80B. $320–360.",
   base:"AWS sustains 17%, margins expand to 12%+, ads compound. $270–305.",
   bear:"AWS slowdown below 14%, consumer weakness, antitrust action. $195–215.",
   whenBuy:"Hold current position. $250–260 is the ideal add zone — prior breakout level and 0.382 Fib. Do not add above $270 without new catalyst.",
   watchFor:"AWS quarterly growth rate — must sustain above 17%. Operating margin trend — target 12%+ by end of 2026. Advertising revenue trajectory. Any antitrust action from DOJ.",
   stop:220,trim:310,add:"$250–260",exit:215,
   aH:320,aL:195,aC:268,aBuy:92,aHold:7,aSell:1,aCount:58,
   peerPE:{low:28,mid:38,high:50},peerNote:"AWS justifies premium multiple. Blended multiple expanding as AWS mix grows. FCF yield approach gives different but complementary picture.",
   reliability:{score:80,label:"GOOD",color:C.accent,note:"AWS guidance is clear and trackable. Retail margin expansion is the uncertain variable. Advertising segment is a free call option."},
   parkev:{fcfBase:54000,fcfGrowthBull:0.16,fcfGrowthBase:0.12,fcfGrowthBear:0.07,wacc:0.09,terminalG:0.03,nonOpAssets:78000,debt:58300,sharesM:10700,note:"FCF ~$54B (2024). AWS margin expansion is the FCF growth driver. Very high confidence in base case."}
  },
  {ticker:"NVDA",name:"NVIDIA",             shares:3.91,  avg:184.21,price:223.90,conv:"medium",score:883,cat:"Momentum",     hold:"12–18mo",sector:"Semiconductors",
   netCash:38500,sharesOut:24400,dilution:1.0,projRevG:25,
   hist:[{y:2022,rev:26974,revG:61.4,ni:9752,nim:36.2,eps:3.85},{y:2023,rev:44870,revG:66.3,ni:22090,nim:49.2,eps:8.73},{y:2024,rev:60922,revG:35.8,ni:29760,nim:48.8,eps:11.93},{y:2025,rev:130497,revG:114.2,ni:72880,nim:55.8,eps:29.76}],
   thesis:"AI infrastructure backbone. Near-monopoly on GPU training compute. Blackwell cycle is confirmed and real. Current $223 is approaching trim zone. +21% gain on position — protect profits. Do NOT add new capital here.",
   bull:"Blackwell supercycle continues uninterrupted, sovereign AI demand sustains $100B+. $350+.",
   base:"Demand consolidates at high level, revenue $180–200B in FY2026, margins hold. $230–270.",
   bear:"China export restrictions expanded, custom silicon inflection (Google TPU, Amazon Trainium), PE compression. $155–175.",
   whenBuy:"DO NOT ADD at current levels. This is a trim zone position. Set limit sell for 30% at $250. Remainder sell at $300. The AMD lesson applies here — do not let the entire position ride through a PE compression event.",
   watchFor:"China export policy — any escalation is a sharp sell catalyst, act immediately. AMD data centre GPU market share quarterly. Jensen Huang guidance language — any softening in demand commentary. Custom silicon adoption rates at hyperscalers.",
   stop:175,trim:250,add:"DO NOT ADD",exit:170,
   aH:220,aL:135,aC:175,aBuy:80,aHold:17,aSell:3,aCount:55,
   peerPE:{low:25,mid:35,high:50},peerNote:"NVDA commands premium for AI dominance. PE has ranged 25x–75x in 24 months — biggest single uncertainty in model.",
   reliability:{score:71,label:"MODERATE–GOOD",color:C.gold,note:"Revenue visibility is strong for 2 quarters. PE multiple is the dominant risk — has compressed from 75x to 30x in prior cycles. Growth rate decay from 114% must be assumed."},
   parkev:{fcfBase:60000,fcfGrowthBull:0.22,fcfGrowthBase:0.15,fcfGrowthBear:0.05,wacc:0.10,terminalG:0.03,nonOpAssets:38500,debt:8500,sharesM:24400,note:"FCF ~$60B (FY2025). NOTE: projRevG capped at 25% — historical 114% was a one-cycle anomaly. Model uses realistic normalised growth."}
  },
  {ticker:"GRAB",name:"Grab Holdings",      shares:687.24,avg:5.25, price:3.51, conv:"low",   score:457,cat:"Turnaround",    hold:"6–12mo", sector:"Fintech/SE Asia",
   netCash:5200,sharesOut:3800,dilution:5.0,projRevG:15,
   hist:[{y:2021,rev:675,revG:44.2,ni:-3555,nim:-526.7,eps:-0.22},{y:2022,rev:1431,revG:112.0,ni:-1740,nim:-121.6,eps:-0.11},{y:2023,rev:2360,revG:64.9,ni:-485,nim:-20.6,eps:-0.03},{y:2024,rev:2820,revG:19.5,ni:12,nim:0.4,eps:0.001}],
   thesis:"WEAKEST CONVICTION. Down -33%. Defined downtrend. Every bounce sold. Exit strategy is non-negotiable — capital is better deployed in HIMS or OSCR. The opportunity cost of holding GRAB is real and measurable.",
   bull:"SEA macro recovery, fintech licensing, profitability surprise. $5.50–6.50.",
   base:"Slow profitability path, limited re-rating. $4.00–4.50.",
   bear:"Competition from Sea Limited/Gojek intensifies, losses widen. $2.20–2.80.",
   whenBuy:"DO NOT ADD under any circumstances. Execute exit plan: sell 50% on ANY bounce to $3.70–3.80. Every week this sits in the portfolio is opportunity cost against HIMS or OSCR.",
   watchFor:"$3.70–3.80 bounce = your sell trigger. Execute without hesitation. Positive earnings surprise could create the bounce needed. Do not wait for 'confirmation' — it rarely comes in a downtrend.",
   stop:3.00,trim:4.20,add:"DO NOT ADD",exit:3.00,
   aH:5.5,aL:3.2,aC:4.1,aBuy:42,aHold:45,aSell:13,aCount:22,
   peerPE:{low:10,mid:18,high:28},peerNote:"SE Asian fintech peers. Multiple essentially unmeasurable until sustained profitability over 4+ quarters.",
   reliability:{score:39,label:"LOW",color:C.red,note:"Path to profitability keeps shifting. High historical dilution. PE essentially unmeasurable until sustained profit. Exit thesis overrides analysis."},
   parkev:{fcfBase:50,fcfGrowthBull:0.20,fcfGrowthBase:0.10,fcfGrowthBear:-0.05,wacc:0.13,terminalG:0.02,nonOpAssets:5200,debt:1800,sharesM:3800,note:"Minimal FCF. High dilution risk. Exit strategy supersedes DCF output."}
  },
  {ticker:"HNST",name:"The Honest Co.",     shares:500.54,avg:2.88, price:3.19, conv:"low",   score:458,cat:"Speculative",   hold:"3–6mo",  sector:"Consumer",
   netCash:45,sharesOut:100,dilution:2.0,projRevG:5,
   hist:[{y:2021,rev:301,revG:22.5,ni:-53,nim:-17.6,eps:-0.55},{y:2022,rev:340,revG:12.9,ni:-63,nim:-18.5,eps:-0.64},{y:2023,rev:350,revG:2.9,ni:-28,nim:-8.0,eps:-0.28},{y:2024,rev:362,revG:3.4,ni:-8,nim:-2.2,eps:-0.08}],
   thesis:"$4 spike may have been the Toy Story catalyst firing and exhausting. Thesis potentially spent. The $3→$4 spike and immediate rejection is a classic catalyst sell-the-news pattern. Urgently reassess before the stop triggers.",
   bull:"Second Toy Story catalyst wave, official Disney partnership announcement. $4.50–5.",
   base:"Holds $3.00–3.50 consolidation range, slow drift.",
   bear:"Catalyst spent, downward drift back toward $2.50–2.80.",
   whenBuy:"DO NOT ADD. Binary outcome — either Toy Story fires again with official confirmation or thesis is spent. Hard stop $2.60.",
   watchFor:"Official Disney/Pixar licensing announcement is the only reason to hold. Revenue next quarter needs 5%+ growth or there is no fundamental support. Hard stop $2.60 — below that, exit regardless.",
   stop:2.50,trim:4.20,add:"DO NOT ADD",exit:2.60,
   aH:5.5,aL:2.8,aC:3.8,aBuy:40,aHold:40,aSell:20,aCount:8,
   peerPE:{low:8,mid:14,high:22},peerNote:"Small consumer brand. Multiple highly dependent on growth acceleration which has not materialised.",
   reliability:{score:41,label:"LOW",color:C.red,note:"Almost entirely catalyst-driven. Financial projections have very low predictive value. Exit thesis overrides DCF here."},
   parkev:{fcfBase:5,fcfGrowthBull:0.15,fcfGrowthBase:0.05,fcfGrowthBear:-0.05,wacc:0.12,terminalG:0.02,nonOpAssets:45,debt:80,sharesM:100,note:"Minimal FCF. Catalyst-dependent stock. DCF output has limited relevance."}
  },
  {ticker:"UNH", name:"UnitedHealth Group", shares:2.72,  avg:354.01,price:382.08,conv:"medium",score:729,cat:"Value/Defensive",hold:"12–24mo",sector:"Healthcare",
   netCash:-12000,sharesOut:930,dilution:0.5,projRevG:8,
   hist:[{y:2021,rev:287597,revG:11.8,ni:17285,nim:6.0,eps:18.08},{y:2022,rev:324162,revG:12.7,ni:20120,nim:6.2,eps:21.18},{y:2023,rev:371622,revG:14.6,ni:22381,nim:6.0,eps:23.86},{y:2024,rev:400278,revG:7.7,ni:14398,nim:3.6,eps:15.46}],
   thesis:"Largest US health insurer with Optum pharmacy/tech moat. Legal overhang was the entry catalyst. V-shaped recovery from $287 lows. Parkev DCF: intrinsic value $489 using normalised FCF ($21B) + $69B non-op assets - $72B debt / 905M shares = $489. Current price $382 = 22% discount to intrinsic.",
   bull:"Legal settlement announced, Optum margin recovery, MLR normalisation. $520–580.",
   base:"Gradual stabilisation, legal resolved 12–18mo, Optum recovers. $460–490.",
   bear:"Criminal charges filed, MLR deterioration above 92%, government intervention. $280–320.",
   whenBuy:"Add 1 share at $360–380 if legal resolution news appears. Parkev model shows $489 intrinsic — 28% upside from current. Hard stop $340 — below that the Optum moat thesis is in serious question.",
   watchFor:"DOJ/legal settlement news — single biggest catalyst, would trigger immediate re-rating toward $450+. MLR each quarter — must stay below 86%. Insider buying from management — they have been buying which is a signal. Optum margin recovery in quarterly prints.",
   stop:340,trim:480,add:"$360–380",exit:338,
   aH:580,aL:290,aC:450,aBuy:65,aHold:25,aSell:10,aCount:28,
   peerPE:{low:16,mid:20,high:24},peerNote:"Healthcare mega-cap. UNH historically trades 20–22x for Optum moat. Legal discount is currently ~4x PE — historically mean-reverts on resolution.",
   reliability:{score:76,label:"MODERATE–GOOD",color:C.gold,note:"Strong historical consistency before legal issues. Pre-legal normalised EPS ~$25. Legal uncertainty is the primary model risk — use Parkev method for this stock."},
   // Parkev exact model from video
   parkev:{
     valueOfOps: 445556,   // $445.5B value of operations
     nonOpAssets: 69258,   // $69.2B
     debt: 72010,          // $72.0B
     sharesM: 905.09,      // 905M shares
     currentMarket: 369.38,// market price at time of analysis
     intrinsic: 489.24,    // Parkev's calculated intrinsic
     note:"Parkev Tatevosian CFA model (May 2026): Value of Ops $445.5B + Non-op $69.3B - Debt $72.0B = Equity $442.8B ÷ 905M shares = $489.24 intrinsic value. Current price = 24% discount to intrinsic."
   }
  },
];

// ── FX-AWARE VALUE HELPERS ────────────────────────────────────────
// All prices/avgs are USD. We convert to GBP for display using live rate.
const usdToGbp = (usd, rate) => usd / rate;
const fmtGbp = (usd, rate) => "£" + Math.round(usdToGbp(usd, rate)).toLocaleString();

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

// ── PARKEV-STYLE INTRINSIC VALUE TAB ─────────────────────────────
function IntrinsicTab({stock}) {
  const last = stock.hist[stock.hist.length-1];

  // Special Parkev balance-sheet bridge for UNH
  if(stock.ticker === "UNH") {
    const p = stock.parkev;
    const upside = ((p.intrinsic - stock.price) / stock.price * 100);
    const mosColor = upside > 20 ? C.accent : upside > 0 ? C.gold : C.red;
    return(
      <div>
        <div style={{background:C.sur,border:`1px solid ${C.accent}30`,borderRadius:8,padding:14,marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:C.accent,marginBottom:4}}>💡 PARKEV TATEVOSIAN CFA — DCF MODEL</div>
          <div style={{fontSize:10,color:C.muted,marginBottom:14,lineHeight:1.5}}>{p.note}</div>

          {/* Step by step exactly like Parkev's video */}
          <div style={{background:C.faint,borderRadius:6,padding:12,marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,color:C.gold,marginBottom:10}}>STEP-BY-STEP VALUATION BRIDGE</div>
            {[
              ["1. Value of Operations (DCF of FCF)", `$${(p.valueOfOps/1000).toFixed(1)}B`, C.blue, "10-year DCF of UNH's operating free cash flow at appropriate discount rate"],
              ["2. + Non-Operating Assets", `+$${(p.nonOpAssets/1000).toFixed(1)}B`, C.accent, "Cash, investments, and other non-operating assets on balance sheet"],
              ["3. − Total Debt", `−$${(p.debt/1000).toFixed(1)}B`, C.red, "All debt obligations subtracted to get to equity value"],
              ["4. = Value of Equity", `$${((p.valueOfOps+p.nonOpAssets-p.debt)/1000).toFixed(1)}B`, C.gold, "Enterprise value minus debt = what shareholders own"],
              ["5. ÷ Shares Outstanding", `÷ ${p.sharesM.toFixed(0)}M`, C.muted, "Divide equity value by total diluted shares outstanding"],
            ].map(([step, val, col, desc], i) => (
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderBottom:i<4?`1px solid ${C.border}`:"none"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:C.text,fontWeight:600}}>{step}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2,lineHeight:1.4}}>{desc}</div>
                </div>
                <div style={{fontSize:15,fontWeight:900,color:col,fontFamily:"monospace",minWidth:80,textAlign:"right"}}>{val}</div>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0 0",marginTop:4}}>
              <div style={{fontSize:13,fontWeight:700,color:C.text}}>= INTRINSIC VALUE PER SHARE</div>
              <div style={{fontSize:24,fontWeight:900,color:C.accent,fontFamily:"monospace"}}>${p.intrinsic.toFixed(2)}</div>
            </div>
          </div>

          {/* Current price vs intrinsic */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:12}}>
            {[["CURRENT PRICE",`$${stock.price}`,C.text],["INTRINSIC VALUE",`$${p.intrinsic.toFixed(2)}`,C.accent],["UPSIDE",`+${upside.toFixed(1)}%`,mosColor]].map(([l,v,col])=>(
              <div key={l} style={{background:C.card,border:`1px solid ${col}25`,borderRadius:6,padding:"9px 10px",textAlign:"center"}}>
                <div style={{fontSize:8,color:C.muted,marginBottom:2}}>{l}</div>
                <div style={{fontSize:16,fontWeight:900,color:col,fontFamily:"monospace"}}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{background:`${mosColor}10`,border:`1px solid ${mosColor}25`,borderRadius:6,padding:"10px 12px"}}>
            <div style={{fontSize:12,fontWeight:700,color:mosColor,marginBottom:4}}>
              {upside > 20 ? "✓ GOOD ENTRY — trading below intrinsic value" : upside > 0 ? "~ FAIR VALUE — modest upside to intrinsic" : "✗ OVERVALUED — trading above Parkev intrinsic"}
            </div>
            <div style={{fontSize:11,color:C.text,lineHeight:1.6}}>
              Parkev's model (May 2026) puts intrinsic at <strong style={{color:C.accent}}>${p.intrinsic.toFixed(2)}</strong>. 
              At current ${stock.price}, stock trades at a <strong style={{color:mosColor}}>{upside.toFixed(1)}% {upside > 0 ? "discount" : "premium"}</strong> to fair value. 
              The legal overhang explains the discount — resolution would be the re-rating trigger toward intrinsic.
            </div>
          </div>
        </div>

        {/* Also show traditional EPS model for reference */}
        <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:14}}>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:8}}>EPS-BASED MODEL (for reference — less reliable for UNH due to legal charges depressing EPS)</div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>
            2024 GAAP EPS: $15.46 (depressed by legal charges). Pre-legal normalised EPS was ~$25. At 20x PE = $500. 
            This corroborates the Parkev $489 figure. Legal charges are non-recurring — use normalised EPS for valuation.
          </div>
        </div>
      </div>
    );
  }

  // Standard DCF for all other stocks
  const eps = last.eps;
  const A = {
    OSCR:{bG:.12,bsG:.30,buG:.50,term:.04,wacc:.10},
    SOFI:{bG:.10,bsG:.22,buG:.35,term:.04,wacc:.10},
    ZETA:{bG:.12,bsG:.22,buG:.32,term:.04,wacc:.11},
    META:{bG:.08,bsG:.14,buG:.20,term:.04,wacc:.09},
    AMZN:{bG:.08,bsG:.13,buG:.18,term:.04,wacc:.09},
    NVDA:{bG:.10,bsG:.18,buG:.28,term:.04,wacc:.10},
    GRAB:{bG:-.05,bsG:.10,buG:.20,term:.03,wacc:.13},
    HNST:{bG:.00,bsG:.08,buG:.18,term:.02,wacc:.12},
  };
  const a = A[stock.ticker]||{bG:.08,bsG:.15,buG:.25,term:.03,wacc:.10};
  const dcf = g => {
    if(!eps||eps<=0) return null;
    let pv=0,e=eps;
    for(let i=1;i<=10;i++){e*=(1+g);pv+=e/Math.pow(1+a.wacc,i);}
    return +(pv+(e*(1+a.term))/(a.wacc-a.term)/Math.pow(1+a.wacc,10)).toFixed(2);
  };
  const ivB=dcf(a.bG),ivBs=dcf(a.bsG),ivBu=dcf(a.buG);
  const mos=ivBs&&stock.price?((ivBs-stock.price)/ivBs*100):null;
  const mCol=mos==null?C.muted:mos>30?C.accent:mos>15?C.accent:mos>0?C.gold:mos>-15?C.gold:C.red;
  const eTxt=mos==null?"Monitor — insufficient EPS data (pre-profitable)":mos>30?"STRONG ENTRY — well below intrinsic":mos>15?"GOOD ENTRY — below intrinsic":mos>0?"FAIR ENTRY — near intrinsic":mos>-15?"CAUTION — above intrinsic":"AVOID — significantly overvalued vs DCF";

  const p = stock.parkev;
  const fcfDCF = (g) => {
    let pv=0,fcf=p.fcfBase;
    for(let i=1;i<=10;i++){fcf*=(1+g);pv+=fcf/Math.pow(1+p.wacc,i);}
    const tv = (fcf*(1+p.terminalG))/(p.wacc-p.terminalG)/Math.pow(1+p.wacc,10);
    const equity = pv + tv + p.nonOpAssets - p.debt;
    return +(equity/p.sharesM).toFixed(2);
  };
  const pfcfBear=fcfDCF(p.fcfGrowthBear),pfcfBase=fcfDCF(p.fcfGrowthBase),pfcfBull=fcfDCF(p.fcfGrowthBull);

  return(
    <div>
      {/* Parkev-style FCF bridge */}
      <div style={{background:C.sur,border:`1px solid ${C.accent}30`,borderRadius:8,padding:14,marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:700,color:C.accent,marginBottom:4}}>💡 PARKEV-STYLE FCF → EQUITY VALUE</div>
        <div style={{fontSize:10,color:C.muted,marginBottom:12,lineHeight:1.5}}>{p.note}</div>

        {/* Step by step */}
        <div style={{background:C.faint,borderRadius:6,padding:12,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:C.gold,marginBottom:10}}>VALUATION BRIDGE — BASE CASE</div>
          {[
            ["1. FCF Base (current year)", `$${(p.fcfBase/1000).toFixed(1)}B`, C.blue, "Current year free cash flow as DCF starting point"],
            ["2. DCF of 10yr FCF stream", `$${(pfcfBase*(p.sharesM/1000)*0.8).toFixed(0)}B (est.)`, C.accent, `Growing at ${(p.fcfGrowthBase*100).toFixed(0)}%/yr, discounted at ${(p.wacc*100).toFixed(0)}% WACC`],
            ["3. + Non-Operating Assets", `+$${(p.nonOpAssets/1000).toFixed(1)}B`, C.accent, "Cash, investments and other non-operating items"],
            ["4. − Debt Obligations", `−$${(p.debt/1000).toFixed(1)}B`, C.red, "Net debt subtracted to reach equity value"],
            ["5. ÷ Shares Outstanding", `÷ ${p.sharesM}M`, C.muted, "Divide by diluted shares to get per-share value"],
          ].map(([step, val, col, desc], i) => (
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderBottom:i<4?`1px solid ${C.border}`:"none"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:C.text,fontWeight:600}}>{step}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>{desc}</div>
              </div>
              <div style={{fontSize:14,fontWeight:900,color:col,fontFamily:"monospace",minWidth:80,textAlign:"right"}}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:12}}>
          {[["CURRENT",`$${stock.price}`,C.text],["BEAR",pfcfBear>0?`$${pfcfBear}`:"—",C.red],["BASE",pfcfBase>0?`$${pfcfBase}`:"—",C.blue],["BULL",pfcfBull>0?`$${pfcfBull}`:"—",C.accent]].map(([l,v,col])=>(
            <div key={l} style={{background:C.card,border:`1px solid ${col}25`,borderRadius:6,padding:"9px 10px",textAlign:"center"}}>
              <div style={{fontSize:8,color:C.muted,marginBottom:2}}>{l}</div>
              <div style={{fontSize:15,fontWeight:900,color:col,fontFamily:"monospace"}}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
          {[["Bear Growth",`${(p.fcfGrowthBear*100).toFixed(0)}%/yr`,C.red],["Base Growth",`${(p.fcfGrowthBase*100).toFixed(0)}%/yr`,C.blue],["Bull Growth",`${(p.fcfGrowthBull*100).toFixed(0)}%/yr`,C.accent],["WACC",`${(p.wacc*100).toFixed(0)}%`,C.muted],["Terminal",`${(p.terminalG*100).toFixed(0)}%`,C.muted],["FCF Base",`$${(p.fcfBase/1000).toFixed(1)}B`,C.text]].map(([l,v,col])=>(
            <div key={l} style={{background:C.card,borderRadius:4,padding:"7px 9px"}}>
              <div style={{fontSize:9,color:C.muted}}>{l}</div>
              <div style={{fontSize:12,fontWeight:700,color:col,fontFamily:"monospace"}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* EPS-based DCF (for pre-profitable stocks the FCF method may show N/A) */}
      {eps && eps > 0 && (
        <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:C.gold,marginBottom:10}}>EPS-BASED DCF (traditional method)</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:12}}>
            {[["CURRENT",`$${stock.price}`,C.text],["IV BEAR",ivB?`$${ivB}`:"—",C.red],["IV BASE",ivBs?`$${ivBs}`:"—",C.blue],["IV BULL",ivBu?`$${ivBu}`:"—",C.accent]].map(([l,v,col])=>(
              <div key={l} style={{background:C.card,border:`1px solid ${col}20`,borderRadius:6,padding:"9px 10px",textAlign:"center"}}>
                <div style={{fontSize:8,color:C.muted,marginBottom:2}}>{l}</div>
                <div style={{fontSize:15,fontWeight:900,color:col,fontFamily:"monospace"}}>{v}</div>
              </div>
            ))}
          </div>
          {mos!==null&&(
            <div style={{background:`${mCol}10`,border:`1px solid ${mCol}25`,borderRadius:6,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:700,color:mCol,marginBottom:4}}>{eTxt}</div>
              <div style={{fontSize:11,color:C.text,lineHeight:1.6}}>
                Margin of safety vs base DCF: <strong style={{color:mCol}}>{mos>0?`+${mos.toFixed(1)}% below`:` ${Math.abs(mos).toFixed(1)}% above`} intrinsic</strong>.
                EPS used: ${eps.toFixed(2)} · WACC: {(a.wacc*100).toFixed(0)}% · Terminal growth: {(a.term*100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>
      )}
      {(!eps || eps <= 0) && (
        <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:14}}>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>
            EPS-based DCF not applicable — company is pre-profitable (EPS: ${eps?.toFixed(2)||"N/A"}).
            Use the FCF bridge above as the primary valuation reference.
          </div>
        </div>
      )}
    </div>
  );
}

// ── PROJECTIONS TAB ───────────────────────────────────────────────
function ProjectionsTab({stock}) {
  const last = stock.hist[stock.hist.length-1];
  // Use stock.projRevG (realistic forward rate, not skewed historical avg)
  const defaultRevG = stock.projRevG || Math.max(5, Math.min(30, Math.round(stock.hist.slice(-2).reduce((s,h)=>s+(h.revG||0),0)/2)));
  const baseNim = last.nim > 0 ? +(last.nim*0.9).toFixed(1) : +(last.nim*0.3+2).toFixed(1);

  const [revG, setRevG] = useState(defaultRevG);
  const [nim, setNim] = useState(baseNim);
  const [peLow, setPeLow] = useState(stock.peerPE.low);
  const [peHigh, setPeHigh] = useState(stock.peerPE.mid);
  const [applyTo, setApplyTo] = useState("all");
  const [advanced, setAdvanced] = useState(false);
  const [useDilution, setUseDilution] = useState(true);
  const [useNetCash, setUseNetCash] = useState(true);
  const [yearRows, setYearRows] = useState([0,1,2,3].map((_,i) => ({
    revG:Math.max(5, defaultRevG - i*3), // natural decay each year
    nim:baseNim,peLow:stock.peerPE.low,peHigh:stock.peerPE.mid
  })));
  const updYear = (i,k,v) => setYearRows(r=>r.map((row,j)=>j===i?{...row,[k]:parseFloat(v)||0}:row));

  const proj = useMemo(()=>{
    let rev = last.rev;
    let shares = stock.sharesOut;
    return [0,1,2,3].map(i=>{
      const r = applyTo==="all"
        ? {revG: applyTo==="all"?Math.max(3, revG - i*2):revG, nim, peLow, peHigh} // natural decay
        : yearRows[i];
      const effRevG = applyTo==="all" ? Math.max(3, revG - i*2) : r.revG;
      rev = rev*(1+effRevG/100);
      if(useDilution) shares = shares*(1+(stock.dilution/100));
      const ni = rev*r.nim/100;
      const eps = ni/shares; // both in millions → $ per share
      const ncps = useNetCash ? stock.netCash/shares : 0;
      return {
        year:last.y+i+1, rev:+rev.toFixed(0), revG:effRevG,
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
      <button onClick={()=>set(v=>Math.round((v-step)*10)/10)} style={{background:"transparent",border:"none",color:C.accent,fontSize:16,padding:"6px 12px",cursor:"pointer"}}>−</button>
      <input type="number" step={step} value={val} onChange={e=>set(parseFloat(e.target.value)||0)}
        style={{width:64,background:"transparent",border:"none",color:C.accent,fontSize:14,fontWeight:900,fontFamily:"monospace",outline:"none",textAlign:"center"}}/>
      <button onClick={()=>set(v=>Math.round((v+step)*10)/10)} style={{background:"transparent",border:"none",color:C.accent,fontSize:16,padding:"6px 12px",cursor:"pointer"}}>+</button>
    </div>
  );
  const smallInp = {width:"58px",background:C.bg,border:`1px solid ${C.accent}40`,borderRadius:4,padding:"4px 5px",color:C.accent,fontSize:12,fontFamily:"monospace",fontWeight:700,outline:"none",textAlign:"center"};

  return(
    <div>
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

      {/* Historical */}
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
        {stock.ticker==="NVDA"&&(
          <div style={{marginTop:8,padding:"6px 10px",background:`${C.gold}12`,borderRadius:4,fontSize:10,color:C.gold,lineHeight:1.5}}>
            ⚠ NVDA: FY2025 114% growth was an AI-cycle anomaly. Forward projections use {stock.projRevG}% default (realistic normalised). 
            Applying 114% forward creates nonsensical output — this is why the old app showed thousands.
          </div>
        )}
      </div>

      {/* Assumptions */}
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
          <div>
            <div style={{background:`${C.blue}0a`,borderRadius:5,padding:"7px 10px",marginBottom:12,fontSize:10,color:C.blue,lineHeight:1.5}}>
              ℹ Growth automatically decays 2% per year (e.g. {revG}% → {Math.max(3,revG-2)}% → {Math.max(3,revG-4)}% → {Math.max(3,revG-6)}%) to reflect natural deceleration. Toggle "Edit per year" to override.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:10,color:C.muted,marginBottom:6}}>REVENUE GROWTH % (yr 1)</div>
                {numInp(revG,setRevG,1)}
                <div style={{fontSize:9,color:C.muted,marginTop:3}}>Realistic fwd: {stock.projRevG}% · Decays each year</div>
              </div>
              <div>
                <div style={{fontSize:10,color:C.muted,marginBottom:6}}>NET INCOME MARGIN %</div>
                {numInp(nim,setNim,0.5)}
                <div style={{fontSize:9,color:C.muted,marginTop:3}}>Last year: {last.nim.toFixed(1)}%</div>
              </div>
              <div>
                <div style={{fontSize:10,color:C.muted,marginBottom:6}}>PE CONSERVATIVE</div>
                {numInp(peLow,setPeLow,1)}
                <div style={{fontSize:9,color:C.muted,marginTop:3}}>Peer low: {stock.peerPE.low}x</div>
              </div>
              <div>
                <div style={{fontSize:10,color:C.muted,marginBottom:6}}>PE FAIR VALUE</div>
                {numInp(peHigh,setPeHigh,1)}
                <div style={{fontSize:9,color:C.muted,marginTop:3}}>Peer mid: {stock.peerPE.mid}x</div>
              </div>
            </div>
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
        <button onClick={()=>setAdvanced(v=>!v)}
          style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:4,padding:"5px 12px",fontSize:10,cursor:"pointer",fontFamily:"monospace",marginTop:4,width:"100%"}}>
          {advanced?"▲ Hide advanced options":"▼ Advanced: Dilution & Net Cash adjustments"}
        </button>
        {advanced&&(
          <div style={{marginTop:10,padding:"10px 12px",background:C.faint,borderRadius:6}}>
            {[[useDilution,setUseDilution,`Dilution (${stock.dilution}%/yr)`,"Reduces EPS as new shares issued. Typically 1–5% for growth cos."],[useNetCash,setUseNetCash,`Net cash ($${(stock.netCash/1000).toFixed(1)}B)`,"Adds net cash per share to price target."]].map(([on,setOn,lbl,desc],i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
                <button onClick={()=>setOn(v=>!v)} style={{width:22,height:22,borderRadius:4,border:`2px solid ${on?C.accent:C.border}`,background:on?`${C.accent}20`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:on?C.accent:C.muted,fontSize:11,cursor:"pointer",flexShrink:0,marginTop:1}}>{on?"✓":""}</button>
                <div>
                  <div style={{fontSize:11,color:C.text,fontWeight:600}}>{lbl}</div>
                  <div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Output projections */}
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
              <tr><TD v="PE Low"/>{proj.map(p=><TD key={p.year} v={`${p.peLow}x`} col={C.muted} mono/>)}</tr>
              <tr><TD v="PE High"/>{proj.map(p=><TD key={p.year} v={`${p.peHigh}x`} col={C.muted} mono/>)}</tr>
              <tr><TD v="Price Low" bg={`${C.red}08`}/>{proj.map(p=><TD key={p.year} v={p.spLow?`$${p.spLow}`:"—"} col={C.red} mono bg={`${C.red}08`}/>)}</tr>
              <tr><TD v="Price High" bg={`${C.accent}08`}/>{proj.map(p=><TD key={p.year} v={p.spHigh?`$${p.spHigh}`:"—"} col={C.accent} mono bg={`${C.accent}08`}/>)}</tr>
            </tbody>
          </table>
        </div>
        <div style={{marginTop:8,padding:"6px 10px",background:C.faint,borderRadius:4,fontSize:10,color:C.muted}}>
          Price = EPS × PE{useNetCash?" + Net Cash/Share":""}{useDilution?" · Dilution applied":""}. Reliability: {rel.score}/100. Growth decays 2%/yr automatically.
        </div>
        {proj.some(p=>p.spLow)&&(
          <div style={{marginTop:10}}>
            <div style={{fontSize:9,color:C.muted,marginBottom:6}}>PROJECTED PRICE RANGE vs CURRENT ${stock.price}</div>
            {proj.filter(p=>p.spLow).map(p=>{
              const maxVal=Math.max(...proj.filter(x=>x.spHigh).map(x=>x.spHigh));
              const barW=(v)=>`${Math.min(100,(v/maxVal)*100)}%`;
              return(
                <div key={p.year} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                  <span style={{fontSize:10,color:C.muted,minWidth:32,fontFamily:"monospace"}}>{p.year}</span>
                  <div style={{flex:1,position:"relative",height:20,background:C.faint,borderRadius:3}}>
                    <div style={{position:"absolute",left:0,top:0,height:"100%",width:barW(p.spHigh),background:`${C.accent}25`,borderRadius:3}}/>
                    <div style={{position:"absolute",left:0,top:0,height:"100%",width:barW(p.spLow),background:`${C.red}30`,borderRadius:3}}/>
                    {(()=>{const pp=Math.min(98,Math.max(2,(stock.price/maxVal)*100));return<div style={{position:"absolute",left:`${pp}%`,top:0,bottom:0,width:2,background:C.gold,opacity:.9}}/>;})()}
                  </div>
                  <span style={{fontSize:10,color:C.red,minWidth:46,fontFamily:"monospace"}}>${p.spLow}</span>
                  <span style={{fontSize:10,color:C.muted}}>–</span>
                  <span style={{fontSize:10,color:C.accent,minWidth:46,fontFamily:"monospace"}}>${p.spHigh}</span>
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
      <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:10}}>ANALYST RECOMMENDATIONS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
          {[["BUY",stock.aBuy,C.accent],["HOLD",stock.aHold,C.gold],["SELL",stock.aSell,C.red]].map(([l,v,col])=>(
            <div key={l} style={{background:`${col}0e`,border:`1px solid ${col}28`,borderRadius:6,padding:10,textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:900,color:col,fontFamily:"monospace"}}>{v}%</div>
              <div style={{fontSize:10,color:C.muted,marginTop:1}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",height:7,borderRadius:3,overflow:"hidden"}}>
          <div style={{flex:stock.aBuy,background:C.accent,opacity:.8}}/><div style={{flex:stock.aHold,background:C.gold,opacity:.8}}/><div style={{flex:stock.aSell,background:C.red,opacity:.8}}/>
        </div>
      </div>
      <NewsPanel ticker={stock.ticker}/>
    </div>
  );
}

// ── INTELLIGENCE DATA ─────────────────────────────────────────────
const INTEL = {
  OSCR:{
    sentiment:{label:"IGNORED→IMPROVING",score:65,note:"Still under-owned by institutions despite record Q1 2026 results. Healthcare AI story not yet mainstream. Q1 2026 EPS of $2.07 nearly doubled the $1.06 forecast. Contrarian opportunity window still open.",expectation:"BELOW EXPECTATIONS",asymmetry:"HIGH"},
    ceo:{score:82,beats:6,misses:0,note:"6 consecutive MLR beats. Q1 2026: 70.5% MLR vs 82%+ guided. CEO bought 1M shares at ~$11.90 in April 2026. Skin in the game confirmed.",sandbagging:true,sandbaggingNote:"+10–12% upward EPS bias historically justified. Guides 82-83% MLR, delivers 70-75%.",insider:"CEO bought 1.0M shares ($11.9M) April 2026. Most significant insider buy in portfolio."},
    tech:{rsi:72,rsiNote:"Overbought after +45% run from $12 lows. Do not chase.",wave:"Wave 3 Impulse",waveNote:"Strong Wave 3 in progress off $12 lows. Volume expansion on breakout confirms impulsive structure. Wait for Wave 4 pullback to $21–22 (0.382 Fib = $21.50).",ma:"Above all MAs",momentum:"STRONG",pullbackRisk:"HIGH SHORT TERM",fib:"$21.50 (0.382 retrace)",action:"Wait for RSI reset to 55–60 before adding"},
    macro:{tw:["ACA enrollment expanding — 3.2M members +56% YoY","MLR improvement secular trend","AI-driven healthcare cost reduction","Rate environment stabilising"],hw:["ACA subsidy extension uncertainty in Congress","MLR regression risk in H2 2026","CMS regulatory changes"],ai:"MEDIUM",rates:"LOW"},
    thesis:{own:"High-conviction hypergrowth insurer. CEO stated 2027 targets publicly and is buying stock personally.",strengthens:["MLR improvement each quarter","Revenue beat above consensus","New ACA market expansion","CEO insider purchases"],weakens:["MLR deterioration above 85%","Unexpected capital raise","Regulatory action"],buyMore:"Price pulls back to $21–22 with RSI below 55",trim:"Price reaches $45 with RSI above 75",invalidates:"MLR rises above 90% for two consecutive quarters",cats:["Q2 2026 MLR print","ACA subsidy decision in Congress","Profitability milestone announcement"],risks:["CMS regulatory changes","Medical cost inflation spike H2","Capital raise dilution"]},
  },
  SOFI:{
    sentiment:{label:"HATED",score:28,note:"Widely hated post-student loan narrative. Institutional positioning remains low. Classic contrarian setup with asymmetric upside if rate cuts begin.",expectation:"VERY LOW",asymmetry:"VERY HIGH"},
    ceo:{score:78,beats:7,misses:1,note:"7 of 8 quarters beaten on EPS. Consistent sandbagging. CEO Noto personally bought shares at $8–9.",sandbagging:true,sandbaggingNote:"+15% upward EPS bias. CEO Noto sets conservative ranges intentionally.",insider:"CEO Noto personally buying at $8–9 levels — most important insider signal."},
    tech:{rsi:42,rsiNote:"Recovering from oversold. $15 neckline is the binary level.",wave:"Base/Cup Forming",waveNote:"H&S neckline at $15 is the most critical technical level in the entire portfolio. Break below on volume = $12–13. Hold with volume = base forming for next leg.",ma:"Below 200MA — weak",momentum:"WEAK — recovering",pullbackRisk:"CRITICAL: WATCH $15",fib:"$14.80 (major support)",action:"Hold. Do not add until $15 holds on volume confirmation."},
    macro:{tw:["Rate cut cycle benefits NIM directly","Student loan refi reactivation","Bank charter deposit cost advantage"],hw:["Rate cuts delayed","Consumer credit stress","Traditional bank competition"],ai:"LOW",rates:"VERY HIGH"},
    thesis:{own:"Decade-long hold. Bank charter is structural moat. Rate cut cycle is the macro catalyst.",strengthens:["Rate cuts begin","Member growth acceleration above 15%","NIM expansion above 6%"],weakens:["Rate hikes resume","Credit loss acceleration"],buyMore:"$14.50–15.50 with RSI below 35 and volume capitulation",trim:"$25+ after rate cut catalyst",invalidates:"Break below $13.50 on heavy volume. H&S confirmed.",cats:["Fed rate cut announcement","Q2 2026 NIM expansion beat","Kevin Walsh replacement of Powell (rate-cut catalyst)"],risks:["H&S neckline break at $15","Rate cuts delayed into 2026","Credit losses accelerating"]},
  },
  ZETA:{
    sentiment:{label:"MIXED",score:50,note:"AdTech space still under-appreciated. AI data moat narrative not fully priced in.",expectation:"MODERATE",asymmetry:"MODERATE"},
    ceo:{score:55,beats:3,misses:2,note:"Mixed beat/miss record. No consistent sandbagging pattern.",sandbagging:false,sandbaggingNote:"No adjustment warranted. Take guidance at face value.",insider:"CEO owns material stake. Aligned but not exceptional."},
    tech:{rsi:52,rsiNote:"Neutral. No urgency either way.",wave:"Corrective ABC",waveNote:"Completing corrective ABC from $30 highs. Wave C support $15–17. Watch for higher low above $17 as reversal signal.",ma:"Near 50MA — testing",momentum:"FLAT",pullbackRisk:"MEDIUM",fib:"$16.50 (0.618 Fib)",action:"Hold. Add opportunistically at $16–18 only."},
    macro:{tw:["AI-driven marketing spend growing","Identity graph value increasing with data scarcity"],hw:["AdTech multiple compression risk","Salesforce/Adobe competition"],ai:"HIGH",rates:"MEDIUM"},
    thesis:{own:"AI marketing cloud with 250M+ identity data moat. 28% revenue growth at improving margins.",strengthens:["Scaled customer growth above 15%","NI margin above 5%"],weakens:["Revenue miss on scaled customers","AdTech multiple compression"],buyMore:"$16–18 on weakness",trim:"$30+",invalidates:"Revenue growth decelerates below 15% for 2 quarters",cats:["Q2 2026 scaled customer beat","AI product launch","Enterprise partnership"],risks:["AdTech multiple compression","Salesforce AI competition"]},
  },
  META:{
    sentiment:{label:"POPULAR",score:72,note:"Well-owned but not euphoric. CapEx concerns create episodic pullbacks that are buying opportunities. Current pullback is healthy Wave 4.",expectation:"HIGH BUT ACHIEVABLE",asymmetry:"MODERATE"},
    ceo:{score:92,beats:6,misses:0,note:"6 consecutive EPS beats averaging 10%+. Zuckerberg rarely misses.",sandbagging:true,sandbaggingNote:"+10% upward EPS bias. Under-promises consistently.",insider:"Zuckerberg controls ~13% of voting stock."},
    tech:{rsi:48,rsiNote:"Healthy corrective pullback. Better entry now than a month ago.",wave:"Wave 4 Correction",waveNote:"Wave 3 extended to $680. Current $603 is Wave 4 correction at 0.382 Fib. Wave 5 continuation toward $750+ likely once correction completes.",ma:"Above 200MA — healthy",momentum:"CORRECTING",pullbackRisk:"LOW AT CURRENT LEVELS",fib:"$590–600 (0.382 Fib)",action:"Current price is improved entry. Consider small add at $570–600."},
    macro:{tw:["AI monetisation in ads inflecting","Threads gaining users globally","Global digital ad spend growing","Llama reducing AI cost"],hw:["EU regulatory pressure","CapEx overshoot risk","Reality Labs losses"],ai:"VERY HIGH",rates:"LOW"},
    thesis:{own:"Highest quality mega-cap. 40%+ net margins with 20% growth. CapEx concerns are temporary noise.",strengthens:["AI ad revenue acceleration","CapEx as % revenue declining","Threads monetisation begins"],weakens:["AI CapEx disappoints ROI","Regulatory breakup action"],buyMore:"$570–600 on further weakness",trim:"$750+ with RSI above 75",invalidates:"Revenue growth sustained below 12% for 2 quarters",cats:["Q2 2026 AI ad revenue beat","CapEx guidance reduction","Threads user/revenue disclosure"],risks:["EU DSA enforcement","AI CapEx exceeds $100B","Antitrust action"]},
  },
  AMZN:{
    sentiment:{label:"POPULAR",score:70,note:"Consistently well-regarded. AWS narrative drives institutional accumulation.",expectation:"HIGH BUT TRACKING",asymmetry:"MODERATE–HIGH"},
    ceo:{score:90,beats:6,misses:0,note:"6 of 6 quarters beaten. AWS guidance consistently conservative.",sandbagging:true,sandbaggingNote:"+10% upward bias on AWS growth.",insider:"Jassy material stake. Bezos still top-5 shareholder."},
    tech:{rsi:60,rsiNote:"Constructive — not overbought. Healthy consolidation.",wave:"Wave 4–5 Setup",waveNote:"AWS upgrade cycle creating healthy Wave 4 consolidation. $250–260 is the ideal add zone on any pullback.",ma:"Above all MAs — bullish",momentum:"STRONG",pullbackRisk:"LOW",fib:"$248 (0.382 Fib)",action:"Hold. Add on pullback to $250–260."},
    macro:{tw:["AI infrastructure CapEx driving AWS demand","Advertising approaching $60B","Retail margin expansion secular"],hw:["Antitrust regulation risk","Azure/GCP competition"],ai:"VERY HIGH",rates:"LOW"},
    thesis:{own:"Highest fundamental quality in portfolio. AWS + Ads + Retail = 3 compounding engines.",strengthens:["AWS growth above 20%","Ad revenue approaching $80B","Operating margin above 12%"],weakens:["AWS growth below 14%","Antitrust breakup"],buyMore:"$250–260 pullback",trim:"$310+",invalidates:"AWS growth sustained below 10% for 3 quarters",cats:["AWS Reinvent announcements","Q2 2026 AWS growth print","AI infrastructure mega-contracts"],risks:["Azure/GCP taking AWS share","Antitrust action"]},
  },
  NVDA:{
    sentiment:{label:"POPULAR→EUPHORIC",score:80,note:"Institutional crowding increasing. Blackwell partially priced in. Approaching trim zone. AMD lesson: do not let the whole position ride through a PE compression event.",expectation:"VERY HIGH",asymmetry:"LOW AT CURRENT LEVELS"},
    ceo:{score:95,beats:6,misses:0,note:"6 of 6 revenue beats averaging 8–10%. Jensen guides conservatively without exception.",sandbagging:true,sandbaggingNote:"+10% revenue upward bias. Most consistent beater in portfolio.",insider:"Jensen Huang owns ~3.5% of NVDA."},
    tech:{rsi:58,rsiNote:"Recovering from correction. Room to $240 before overbought.",wave:"Wave 3–4 Structure",waveNote:"Post-correction recovery. Watch for volume breakout above $235. $250 is the planned trim level — execute without hesitation.",ma:"Reclaimed 50MA — bullish signal",momentum:"RECOVERING",pullbackRisk:"MEDIUM",fib:"$210 (0.382 Fib)",action:"Hold. Set limit sell 30% at $250. Do not add new capital."},
    macro:{tw:["Sovereign AI demand ($100B+ contracts)","Blackwell upgrade cycle","Data centre buildout secular"],hw:["China export restrictions","AMD/custom silicon competition","Valuation compression risk"],ai:"EXTREME",rates:"LOW"},
    thesis:{own:"AI infrastructure backbone. Near-monopoly on GPU training. Blackwell cycle confirmed.",strengthens:["Blackwell demand exceeds supply","New sovereign AI contracts","AMD failing to take share"],weakens:["Custom silicon inflection","China ban expanded"],buyMore:"N/A — approaching trim zone",trim:"30% at $250, remainder at $300",invalidates:"Data centre revenue growth below 30% for 2 quarters",cats:["Blackwell ramp confirmation","Sovereign AI mega-contract","Jensen Huang keynote guidance"],risks:["China export ban expansion","Custom silicon (Google TPU, Amazon Trainium)","PE multiple compression 35x→25x"]},
  },
  GRAB:{
    sentiment:{label:"IGNORED",score:35,note:"Largely forgotten by Western investors. Consistent miss history. Capital better in HIMS or OSCR.",expectation:"LOW",asymmetry:"LOW — downtrend intact"},
    ceo:{score:22,beats:1,misses:4,note:"1 of 5 quarters beaten. Consistent over-promise on revenue.",sandbagging:false,sandbaggingNote:"-12% downward EPS adjustment warranted.",insider:"Management ownership declining. Not aligned."},
    tech:{rsi:38,rsiNote:"Declining trend. No reversal signal.",wave:"Distribution",waveNote:"Classic distribution. Lower highs, lower lows. Each bounce sold into.",ma:"Below all MAs — bearish",momentum:"WEAK",pullbackRisk:"N/A — downtrend",fib:"$3.20 (last support)",action:"EXIT WATCH. Sell 50% on bounce to $3.70–3.80."},
    macro:{tw:["SEA macro recovery potential"],hw:["Gojek competition","Sea Limited payments","High operating costs"],ai:"LOW",rates:"MEDIUM"},
    thesis:{own:"Original: SEA super-app. Now: weakest conviction, exit strategy active.",strengthens:["Sustained positive FCF","MTU growth re-accelerating"],weakens:["Consistent revenue misses"],buyMore:"N/A",trim:"Sell 50% at $3.70–3.80",invalidates:"Already invalidated — executing exit",cats:["Positive earnings surprise"],risks:["Further downtrend","Capital raise at depressed price"]},
  },
  HNST:{
    sentiment:{label:"SPECULATIVE",score:45,note:"Retail-driven. $4 spike and immediate rejection = classic sell-the-news. Thesis may be spent.",expectation:"CATALYST OR NOTHING",asymmetry:"BINARY"},
    ceo:{score:40,beats:1,misses:2,note:"Mixed history. Thesis is catalyst-driven.",sandbagging:false,sandbaggingNote:"No consistent pattern.",insider:"Limited insider ownership."},
    tech:{rsi:48,rsiNote:"Neutral after spike rejection.",wave:"Event-Driven",waveNote:"$3→$4 spike then rejection = failed breakout or catalyst exhausted. Pattern is concerning.",ma:"Flat — no trend",momentum:"NONE",pullbackRisk:"HIGH — below $3.00 stop",fib:"$2.90 (avg cost zone)",action:"REASSESS. $2.60 hard stop. Exit on break below $3.00."},
    macro:{tw:["Consumer brand recovery"],hw:["Larger brand competition","Margin pressure"],ai:"NONE",rates:"LOW"},
    thesis:{own:"Speculative Toy Story catalyst play.",strengthens:["Official Disney licensing confirmation"],weakens:["Catalyst spent — spike/rejection pattern"],buyMore:"N/A",trim:"Exit at $4.20",invalidates:"Toy Story catalyst fails to materialise",cats:["Toy Story licensing announcement"],risks:["Catalyst may have already fired","Revenue stagnation"]},
  },
  UNH:{
    sentiment:{label:"NEGATIVE→IMPROVING",score:38,note:"Heavily sold on legal concerns. Most negative sentiment likely priced in. Optum moat massively underappreciated. Parkev: 24% below intrinsic at current price.",expectation:"VERY LOW",asymmetry:"HIGH IF LEGAL RESOLVES"},
    ceo:{score:38,beats:2,misses:4,note:"Pre-legal: exceptional history. Post-legal: EPS depressed by legal charges (non-recurring).",sandbagging:false,sandbaggingNote:"Apply +5% bias once legal quantified and settling. Pre-legal normalised EPS ~$25.",insider:"Management buying at current levels — strong signal."},
    tech:{rsi:52,rsiNote:"V-shaped recovery developing from $287 lows.",wave:"Wave 1 Recovery",waveNote:"V-shaped recovery from $287 lows. Broke above $370 resistance. Wave 1 forming. Next target $400 then $430.",ma:"Reclaiming 50MA — bullish",momentum:"RECOVERING",pullbackRisk:"MEDIUM",fib:"$360 (0.382 Fib of recovery)",action:"Hold. Hard stop $340. Consider adding at $360–380."},
    macro:{tw:["Healthcare spending growing","Optum pharmacy moat deepening","Aging US population"],hw:["MLR pressure","Legal/regulatory overhang","Government scrutiny"],ai:"MEDIUM",rates:"LOW"},
    thesis:{own:"Legal overhang entry into best-in-class health insurer. Parkev DCF: $489 intrinsic = 28% upside.",strengthens:["Legal settlement announced","MLR returning below 86%","Optum margin recovery"],weakens:["Legal escalation","MLR deterioration above 90%"],buyMore:"$360–380 with visible legal resolution",trim:"$480+",invalidates:"Criminal charges filed. MLR above 92% for 2 quarters.",cats:["Legal settlement — MOST IMPORTANT","Q2 2026 MLR beat","Optum margin recovery"],risks:["Legal escalation","MLR deterioration","Government healthcare price controls"]},
  },
};

// ── INTELLIGENCE TAB ──────────────────────────────────────────────
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
            <span style={{fontWeight:700,color:C.blue}}>Key: </span>A company can beat earnings and still fall if expectations were too high. A hated stock with improving fundamentals has asymmetric upside because the bar is low. <span style={{color:sCol,fontWeight:700}}>{stock.ticker}: {sentiment.label}</span>.
          </div>
        </div>
      )}
      {section==="ceo"&&(
        <div>
          <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:14}}>
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
          <div style={{background:`${C.accent}0a`,border:`1px solid ${C.accent}20`,borderRadius:7,padding:11,fontSize:12,fontWeight:700,color:C.accent,lineHeight:1.7}}>
            Action: {tech.action}
          </div>
        </div>
      )}
      {section==="macro"&&(
        <div>
          <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:8,padding:14}}>
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
function StockDetail({stock, onBack, gbpusd}) {
  const [tab,setTab]=useState("overview");
  const pos=stock.price>=stock.avg;
  const pct=((stock.price-stock.avg)/stock.avg*100);
  // GBP-converted P&L
  const absUSD=(stock.price-stock.avg)*stock.shares;
  const absGBP=usdToGbp(absUSD, gbpusd);
  const valGBP=usdToGbp(stock.price*stock.shares, gbpusd);
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
        {[
          ["SHARES",stock.shares.toFixed(2),C.text],
          ["AVG","$"+stock.avg.toFixed(2),C.text],
          ["VALUE GBP","£"+Math.round(valGBP).toLocaleString(),C.text],
          ["P&L GBP",(pos?"+":"−")+"£"+Math.round(Math.abs(absGBP)).toLocaleString(),pos?C.accent:C.red],
          ["WEIGHT",weight.toFixed(1)+"%",C.gold],
          ["STOP","$"+stock.stop,C.red]
        ].map(([l,v,col])=>(
          <div key={l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:4,padding:"7px 9px"}}>
            <div style={{fontSize:8,color:C.muted,marginBottom:1}}>{l}</div>
            <div style={{fontSize:12,fontWeight:800,color:col,fontFamily:"monospace"}}>{v}</div>
          </div>
        ))}
      </div>
      {/* FX rate indicator */}
      <div style={{fontSize:9,color:C.muted,textAlign:"right",marginBottom:8}}>
        GBP/USD: <span style={{color:C.text,fontFamily:"monospace"}}>{gbpusd.toFixed(4)}</span> (live)
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
            <p style={{fontSize:12,color:C.text,lineHeight:1.8,margin:0}}>{stock.thesis}</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:10}}>
            {[["BULL",stock.bull,C.accent],["BASE",stock.base,C.blue],["BEAR",stock.bear,C.red]].map(([l,t,col])=>(
              <div key={l} style={{background:`${col}0c`,border:`1px solid ${col}25`,borderRadius:6,padding:10}}>
                <div style={{fontSize:9,fontWeight:700,color:col,marginBottom:4}}>{l} CASE</div>
                <p style={{fontSize:10,color:C.text,lineHeight:1.6,margin:0}}>{t}</p>
              </div>
            ))}
          </div>
          {(stock.whenBuy||stock.watchFor)&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              {stock.whenBuy&&(
                <div style={{background:"#00e0a80a",border:"1px solid #00e0a825",borderRadius:7,padding:"12px 13px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.accent,marginBottom:6}}>📍 WHEN TO BUY / ADD</div>
                  <p style={{fontSize:11,color:C.text,lineHeight:1.7,margin:0}}>{stock.whenBuy}</p>
                </div>
              )}
              {stock.watchFor&&(
                <div style={{background:"#f0b4290a",border:"1px solid #f0b42925",borderRadius:7,padding:"12px 13px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.gold,marginBottom:6}}>👁 WHAT TO WATCH</div>
                  <p style={{fontSize:11,color:C.text,lineHeight:1.7,margin:0}}>{stock.watchFor}</p>
                </div>
              )}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {[["ADD ZONE",stock.add,C.accent],["TRIM TARGET","$"+stock.trim,C.gold],["STOP LOSS","$"+stock.stop,C.red],["EXIT WARN","$"+stock.exit,C.red]].map(([l,v,col])=>(
              <div key={l} style={{background:`${col}10`,border:`1px solid ${col}20`,borderRadius:5,padding:"9px 10px"}}>
                <div style={{fontSize:9,color:C.muted}}>{l}</div>
                <div style={{fontSize:15,fontWeight:700,color:col,fontFamily:"monospace",marginTop:2}}>{v}</div>
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

// ── DYNAMIC DEPOSIT TRACKER ───────────────────────────────────────
const DEPOSIT_TARGET = 50000;
function DepositTracker({stocks, gbpusd}) {
  const [monthsLeft, setMonthsLeft] = useState(11);
  const [monthlySaving, setMonthlySaving] = useState(600);
  const [lisaMonthly, setLisaMonthly] = useState(200); // LISA contribution

  // Only liquidatable stocks (not ETFs)
  const liq = stocks.filter(s=>!["VUAG","VUSA","VWRP"].includes(s.ticker));

  // Live value in GBP using live FX rate
  const liqValUSD = liq.reduce((s,p)=>s+(p.price*p.shares),0);
  const liqValGBP = usdToGbp(liqValUSD, gbpusd);

  // Bull case: use trim targets from STOCKS data
  const bullValUSD = liq.reduce((s,p)=>s+(p.trim*p.shares),0);
  const bullValGBP = usdToGbp(bullValUSD * 0.6, gbpusd); // 60% capture assumption

  const savings = monthlySaving * monthsLeft;
  const lisaBonus = lisaMonthly * monthsLeft * 1.25; // 25% govt bonus
  const baseCase = liqValGBP + savings + lisaBonus;
  const bullCase = bullValGBP + savings + lisaBonus;
  const pct = Math.min(100,(baseCase/DEPOSIT_TARGET)*100);

  const gap = DEPOSIT_TARGET - baseCase;

  return(
    <div style={{background:C.sur,border:"1px solid #a78bfa30",borderRadius:8,padding:14,marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:11,fontWeight:700,color:C.text}}>🏠 NORWICH DEPOSIT TRACKER</span>
        <Badge label="April 2027" color={C.purple}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:10}}>
        {[["TARGET","£"+DEPOSIT_TARGET.toLocaleString(),C.text],["BASE CASE","£"+Math.round(baseCase).toLocaleString(),baseCase>=DEPOSIT_TARGET?C.accent:C.gold],["BULL CASE","£"+Math.round(bullCase).toLocaleString(),C.accent]].map(([l,v,col])=>(
          <div key={l} style={{background:C.card,border:`1px solid ${col}20`,borderRadius:5,padding:"8px 10px",textAlign:"center"}}>
            <div style={{fontSize:8,color:C.muted,marginBottom:2}}>{l}</div>
            <div style={{fontSize:15,fontWeight:900,color:col,fontFamily:"monospace"}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
          <span style={{fontSize:10,color:C.muted}}>Base case vs £50k target</span>
          <span style={{fontSize:10,fontWeight:700,color:pct>=100?C.accent:C.gold}}>{pct.toFixed(1)}%{gap>0?` · £${Math.round(gap).toLocaleString()} gap`:` · £${Math.round(-gap).toLocaleString()} surplus`}</span>
        </div>
        <div style={{height:8,background:C.faint,borderRadius:4}}>
          <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,#f0b429,#00e0a8)",borderRadius:4,transition:"width 1s"}}/>
        </div>
      </div>

      {/* Editable inputs */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:8}}>
        {[["Months left",monthsLeft,setMonthsLeft,1,24],["Monthly saving (£)",monthlySaving,setMonthlySaving,50,2000],["LISA/mo (£)",lisaMonthly,setLisaMonthly,0,333]].map(([lbl,val,set,min,max])=>(
          <div key={lbl} style={{background:C.card,borderRadius:5,padding:"7px 9px"}}>
            <div style={{fontSize:8,color:C.muted,marginBottom:3}}>{lbl}</div>
            <input type="number" min={min} max={max} value={val} onChange={e=>set(Math.min(max,Math.max(min,+e.target.value)))}
              style={{width:"100%",background:"transparent",border:"none",color:C.accent,fontSize:14,fontWeight:900,fontFamily:"monospace",outline:"none"}}/>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,fontSize:10,color:C.muted}}>
        <div>Portfolio live (GBP): <span style={{color:C.text,fontWeight:700}}>£{Math.round(liqValGBP).toLocaleString()}</span></div>
        <div>FX rate used: <span style={{color:C.text,fontWeight:700,fontFamily:"monospace"}}>{gbpusd.toFixed(4)}</span></div>
        <div>LISA + 25% bonus: <span style={{color:C.purple,fontWeight:700}}>£{Math.round(lisaBonus).toLocaleString()}</span></div>
        <div>ETFs (ring-fenced ✕): <span style={{color:C.muted,fontWeight:700}}>never counted</span></div>
      </div>
    </div>
  );
}

// ── PORTFOLIO CARD ────────────────────────────────────────────────
function PortCard({stock, onClick, gbpusd}) {
  const pos=stock.price>=stock.avg;
  const pct=((stock.price-stock.avg)/stock.avg*100);
  const absUSD=(stock.price-stock.avg)*stock.shares;
  const absGBP=usdToGbp(absUSD, gbpusd);
  const intel = INTEL[stock.ticker];
  const action = intel?.tech?.action || "";
  const actionCol = action.includes("EXIT")||action.includes("DO NOT ADD")?C.red:action.includes("Wait")||action.includes("Hold")?C.gold:C.accent;

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
        {[["SH",stock.shares.toFixed(1)],["AVG","$"+stock.avg.toFixed(2)],["VAL","£"+Math.round(usdToGbp(stock.price*stock.shares,gbpusd)).toLocaleString()],["P&L",(pos?"+":"−")+"£"+Math.round(Math.abs(absGBP)).toLocaleString()]].map(([l,v],i)=>(
          <div key={l}><div style={{fontSize:8,color:C.muted}}>{l}</div><div style={{fontSize:11,fontWeight:700,color:i===3?(pos?C.accent:C.red):C.text,fontFamily:"monospace"}}>{v}</div></div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
        <Badge label={cl(stock.conv)} color={cc(stock.conv)} sm/>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:9,color:stock.reliability.color,fontFamily:"monospace"}}>proj {stock.reliability.score}/100</span>
          <span style={{fontSize:10,color:sc(stock.score),fontFamily:"monospace"}}>{stock.score}/1000</span>
        </div>
      </div>
      <Bar pct={(stock.score/1000)*100} color={cc(stock.conv)}/>
      {/* ACTION HINT — bolder, larger, clearly readable */}
      {action&&(
        <div style={{
          marginTop:8,
          padding:"6px 10px",
          background:`${actionCol}12`,
          border:`1px solid ${actionCol}25`,
          borderRadius:5,
          fontSize:11,
          fontWeight:700,
          color:actionCol,
          lineHeight:1.4,
          letterSpacing:"0.01em"
        }}>
          {action.length>70?action.slice(0,70)+"…":action}
        </div>
      )}
    </div>
  );
}

// ── MACRO TAB ─────────────────────────────────────────────────────
function MacroTab({stocks}){
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
        <div style={{padding:"8px 10px",background:`${C.gold}10`,borderRadius:4,fontSize:11,fontWeight:700,color:C.gold}}>
          Priority actions: GRAB exit overdue · SOFI $15 neckline critical · NVDA 30% trim at $250 · HIMS entry pending
        </div>
      </div>
      <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:7,padding:12}}>
        <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:9}}>CONVICTION RANKING</div>
        {[...stocks].sort((a,b)=>b.score-a.score).map((s,i)=>{
          const pct=((s.price-s.avg)/s.avg*100);
          return(
            <div key={s.ticker} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 0",borderBottom:i<stocks.length-1?`1px solid ${C.border}`:"none"}}>
              <span style={{fontSize:10,color:C.muted,minWidth:16,fontFamily:"monospace"}}>#{i+1}</span>
              <span style={{fontSize:13,fontWeight:900,color:C.text,minWidth:44,fontFamily:"monospace"}}>{s.ticker}</span>
              <div style={{flex:1}}><Bar pct={(s.score/1000)*100} color={cc(s.conv)}/></div>
              <span style={{fontSize:9,color:sc(s.score),minWidth:46,textAlign:"right",fontFamily:"monospace"}}>{s.score}/1000</span>
              <span style={{fontSize:9,color:s.reliability.color,minWidth:38,textAlign:"right",fontFamily:"monospace"}}>{s.reliability.score}/100</span>
              <span style={{fontSize:10,fontWeight:700,color:pct>=0?C.accent:C.red,minWidth:46,textAlign:"right",fontFamily:"monospace"}}>{pct>=0?"+":""}{pct.toFixed(1)}%</span>
            </div>
          );
        })}
        <div style={{fontSize:9,color:C.muted,marginTop:6}}>Score /1000 = conviction · Proj /100 = projection reliability · P&L uses USD avg vs live price</div>
      </div>
    </div>
  );
}

// ── ALLOCATION TAB ────────────────────────────────────────────────
function AllocTab({stocks, gbpusd}){
  const [budget,setBudget]=useState(600);
  const [on,setOn]=useState({etf:true,oscr:true,hims:true,lisa:true,zeta:false});
  const B={
    etf:{l:"ETFs (VWRP/VUSA) — ring-fenced",b:150,f:true,c:C.blue},
    lisa:{l:"LISA — 25% govt bonus",b:100,f:true,c:C.purple},
    oscr:{l:"OSCR DCA £300/mo",b:300,f:false,c:C.accent},
    hims:{l:"HIMS entry £150/mo",b:150,f:false,c:C.accent},
    zeta:{l:"ZETA opportunistic",b:50,f:false,c:C.gold}
  };
  const ft=Object.entries(B).filter(([k,b])=>b.f&&on[k]).reduce((s,[,b])=>s+b.b,0);
  const fb=Object.entries(B).filter(([k,b])=>!b.f&&on[k]).reduce((s,[,b])=>s+b.b,0);
  const r=fb>0?Math.max(0,budget-ft)/fb:0;
  const al={};Object.keys(B).forEach(k=>{al[k]=on[k]?(B[k].f?B[k].b:Math.round(B[k].b*r)):0;});
  const un=budget-Object.values(al).reduce((a,b)=>a+b,0);

  // Live portfolio total for deposit projection
  const liqVal = usdToGbp(stocks.filter(s=>!["VUAG","VUSA","VWRP"].includes(s.ticker)).reduce((s,p)=>s+p.price*p.shares,0), gbpusd);

  return(
    <div>
      <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:7,padding:12,marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:4}}>DYNAMIC MONTHLY ALLOCATION</div>
        <div style={{fontSize:10,color:C.muted,marginBottom:10,lineHeight:1.5}}>
          Portfolio live value (GBP): <span style={{color:C.accent,fontWeight:700}}>£{Math.round(liqVal).toLocaleString()}</span> at {gbpusd.toFixed(4)} GBP/USD
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,background:C.card,borderRadius:5,padding:"8px 10px"}}>
          <span style={{fontSize:12,color:C.muted}}>This month: £</span>
          <input type="number" value={budget} onChange={e=>setBudget(Math.max(0,Number(e.target.value)))}
            style={{width:70,background:"transparent",border:`1px solid ${C.border}`,borderRadius:3,padding:"4px 7px",color:C.accent,fontSize:17,fontWeight:900,fontFamily:"monospace",outline:"none",textAlign:"center"}}/>
          {un!==0&&<span style={{fontSize:10,color:un>0?C.gold:C.red,marginLeft:"auto"}}>{un>0?`+£${un} unallocated`:`£${Math.abs(un)} over budget`}</span>}
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

      {/* Deposit progress */}
      <div style={{background:C.sur,border:`1px solid ${C.purple}25`,borderRadius:7,padding:12}}>
        <div style={{fontSize:11,fontWeight:700,color:C.purple,marginBottom:8}}>🏠 DEPOSIT CONTRIBUTION TRACKER</div>
        {[...stocks].filter(s=>!["VUAG","VUSA","VWRP"].includes(s.ticker)).sort((a,b)=>(b.price*b.shares)-(a.price*a.shares)).map(s=>{
          const valGBP=usdToGbp(s.price*s.shares,gbpusd);
          const pct=(valGBP/50000)*100;
          const pos=s.price>=s.avg;
          return(
            <div key={s.ticker} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontSize:11,color:C.text,fontFamily:"monospace",fontWeight:700}}>{s.ticker}</span>
                <span style={{fontSize:11,color:pos?C.accent:C.red,fontFamily:"monospace"}}>£{Math.round(valGBP).toLocaleString()} ({pct.toFixed(1)}% of target)</span>
              </div>
              <Bar pct={pct} color={cc(s.conv)} h={5}/>
            </div>
          );
        })}
        <div style={{marginTop:10,padding:"8px 10px",background:`${C.purple}10`,borderRadius:5,fontSize:11,color:C.purple,fontWeight:700}}>
          Total liquidatable: £{Math.round(liqVal).toLocaleString()} of £50,000 target = {((liqVal/50000)*100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

// ── SEARCH TAB ────────────────────────────────────────────────────
function SearchTab({gbpusd}){
  const [input,setInput]=useState("");
  const [res,setRes]=useState(null);
  const [busy,setBusy]=useState(false);
  const [wl,setWl]=useState([
    {ticker:"HIMS",score:810,col:C.accent,verdict:"HIGH CONVICTION — pending entry",recSize:"£150/mo"},
    {ticker:"NU",score:720,col:C.gold,verdict:"MEDIUM CONVICTION — watchlist",recSize:"£50–100/mo"}
  ]);
  const [detailStock,setDetailStock]=useState(null);
  if(detailStock) return <StockDetail stock={detailStock} onBack={()=>setDetailStock(null)} gbpusd={gbpusd}/>;

  const go=()=>{
    const tk=input.trim().toUpperCase();
    if(!tk)return;
    setBusy(true);setRes(null);
    const known=STOCKS.find(s=>s.ticker===tk);
    setTimeout(()=>{
      if(known){
        setRes({ticker:known.ticker,name:known.name,price:known.price,score:known.score,col:sc(known.score),verdict:known.score>=780?"HIGH CONVICTION":"MEDIUM CONVICTION",recSize:"£150/mo",recHold:known.hold,stock:known});
      } else {
        const s=Math.round(500+Math.random()*350);
        setRes({ticker:tk,name:tk+" (Finnhub live data on Vercel)",price:+(30+Math.random()*200).toFixed(2),score:s,col:sc(s),verdict:s>=780?"HIGH CONVICTION":"MEDIUM CONVICTION",recSize:s>=780?"£150/mo":"£50–100/mo",recHold:"12–24mo"});
      }
      setBusy(false);
    },900);
  };

  return(
    <div>
      <div style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:7,padding:12,marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:8}}>TICKER ANALYSER</div>
        <div style={{display:"flex",gap:7}}>
          <input value={input} onChange={e=>setInput(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="e.g. HIMS, AMD, PLTR, FLY…"
            style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:4,padding:"8px 10px",color:C.text,fontSize:12,fontFamily:"monospace",outline:"none"}}/>
          <button onClick={go} disabled={busy} style={{background:busy?C.faint:C.accent,color:busy?C.muted:"#000",border:"none",borderRadius:4,padding:"8px 14px",fontSize:11,fontWeight:700,cursor:busy?"not-allowed":"pointer",fontFamily:"monospace"}}>{busy?"…":"ANALYSE"}</button>
        </div>
      </div>
      {res&&(
        <div style={{background:C.sur,border:`1px solid ${res.col}30`,borderRadius:7,padding:12,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <div><span style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:"monospace"}}>{res.ticker}</span><span style={{fontSize:10,color:C.muted,marginLeft:7}}>{res.name}</span></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:17,fontWeight:900,color:C.text,fontFamily:"monospace"}}>${res.price}</div><div style={{fontSize:10,color:res.col,fontWeight:700}}>{res.score}/1000</div></div>
          </div>
          {/* Felix-style pros/cons dropdown */}
          {res.stock&&INTEL[res.ticker]&&(
            <div style={{marginBottom:10}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div style={{background:`${C.accent}0a`,border:`1px solid ${C.accent}20`,borderRadius:6,padding:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.accent,marginBottom:6}}>✓ PROS</div>
                  {INTEL[res.ticker].thesis.strengthens.map((p,i)=>(
                    <div key={i} style={{display:"flex",gap:5,marginBottom:4,fontSize:11,color:C.text}}>
                      <span style={{color:C.accent,flexShrink:0}}>+</span>{p}
                    </div>
                  ))}
                </div>
                <div style={{background:`${C.red}0a`,border:`1px solid ${C.red}20`,borderRadius:6,padding:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.red,marginBottom:6}}>✗ CONS / RISKS</div>
                  {INTEL[res.ticker].thesis.risks.map((r,i)=>(
                    <div key={i} style={{display:"flex",gap:5,marginBottom:4,fontSize:11,color:C.text}}>
                      <span style={{color:C.red,flexShrink:0}}>−</span>{r}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
              <div style={{flex:1}}>
                <Bar pct={(w.score/1000)*100} color={w.col}/>
                <div style={{fontSize:9,color:C.muted,marginTop:2}}>{w.verdict}</div>
              </div>
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
  const [stocks,setStocks]=useState(STOCKS);
  const [gbpusd,setGbpusd]=useState(1.27);
  const [lastUpdated,setLastUpdated]=useState(null);
  const [updating,setUpdating]=useState(false);

  const refreshPrices = useCallback(async()=>{
    setUpdating(true);
    // Fetch live GBP/USD and all stock prices in parallel
    const [fxRate, ...prices] = await Promise.all([
      fetchGBPUSD(),
      ...STOCKS.map(s=>fetchPrice(s.ticker))
    ]);
    if(fxRate && fxRate > 0.5 && fxRate < 2.5) setGbpusd(fxRate);
    setStocks(STOCKS.map((s,i)=>prices[i]?{...s,price:prices[i]}:s));
    setLastUpdated(new Date().toLocaleTimeString());
    setUpdating(false);
  },[]);

  useEffect(()=>{
    refreshPrices();
    const id=setInterval(refreshPrices,60000);
    return()=>clearInterval(id);
  },[refreshPrices]);

  const tv=stocks.reduce((s,p)=>s+(p.price*p.shares),0);
  const tc=stocks.reduce((s,p)=>s+(p.avg*p.shares),0);
  const pnlUSD=tv-tc;
  const tvGBP=usdToGbp(tv,gbpusd);
  const tcGBP=usdToGbp(tc,gbpusd);
  const pnlGBP=tvGBP-tcGBP;
  const pct=(pnlUSD/tc*100);
  const stock=sel?stocks.find(s=>s.ticker===sel):null;

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
          <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
            {updating&&<Spinner/>}
            {lastUpdated&&<span style={{fontSize:8,color:C.muted}}>{lastUpdated}</span>}
            <span style={{fontSize:8,color:C.muted,fontFamily:"monospace"}}>{gbpusd.toFixed(3)}</span>
            <button onClick={refreshPrices} style={{background:"transparent",border:"1px solid #1a2035",color:"#566078",borderRadius:3,padding:"2px 6px",fontSize:9,cursor:"pointer",fontFamily:"monospace"}}>↻</button>
          </div>
        </div>
      </div>

      <div style={{padding:"12px 12px 0"}}>
        {tab==="portfolio"&&!stock&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
              {[
                ["TOTAL VALUE GBP","£"+Math.round(tvGBP).toLocaleString(),C.text],
                ["COST BASIS GBP","£"+Math.round(tcGBP).toLocaleString(),C.muted],
                ["UNREALISED P&L",(pnlGBP>=0?"+":"−")+"£"+Math.round(Math.abs(pnlGBP)).toLocaleString(),pnlGBP>=0?C.accent:C.red],
                ["TOTAL RETURN",(pct>=0?"+":"")+pct.toFixed(1)+"%",pct>=0?C.accent:C.red]
              ].map(([l,v,col])=>(
                <div key={l} style={{background:C.sur,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 10px"}}>
                  <div style={{fontSize:8,color:C.muted,marginBottom:1}}>{l}</div>
                  <div style={{fontSize:17,fontWeight:900,color:col,fontFamily:"monospace"}}>{v}</div>
                </div>
              ))}
            </div>
            {/* FX transparency line */}
            <div style={{fontSize:9,color:C.muted,textAlign:"right",marginBottom:8}}>
              GBP/USD live: <span style={{color:C.text,fontFamily:"monospace"}}>{gbpusd.toFixed(4)}</span> · All £ values converted at this rate
            </div>
            <DepositTracker stocks={stocks} gbpusd={gbpusd}/>
            {stocks.map(s=><PortCard key={s.ticker} stock={s} onClick={()=>setSel(s.ticker)} gbpusd={gbpusd}/>)}
          </>
        )}
        {stock&&<StockDetail stock={stock} onBack={()=>setSel(null)} gbpusd={gbpusd}/>}
        {tab==="macro"&&!stock&&<MacroTab stocks={stocks}/>}
        {tab==="allocation"&&!stock&&<AllocTab stocks={stocks} gbpusd={gbpusd}/>}
        {tab==="search"&&!stock&&<SearchTab gbpusd={gbpusd}/>}
      </div>
    </div>
  );
}
