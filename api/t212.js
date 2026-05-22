export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const base = 'https://live.trading212.com/api/v0';
  const h = { 'Authorization': process.env.T212_KEY };
  try {
    const [portfolio, account] = await Promise.all([
      fetch(`${base}/equity/portfolio`, { headers: h }).then(r=>r.json()),
      fetch(`${base}/equity/account/info`, { headers: h }).then(r=>r.json()),
    ]);
    res.status(200).json({ portfolio, account });
  } catch(e) { res.status(500).json({ error: e.message }); }
}
