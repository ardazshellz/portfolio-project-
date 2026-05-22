export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { path } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path' });
  try {
    const data = await fetch(`https://finnhub.io/api/v1/${path}&token=${process.env.FINNHUB_KEY}`).then(r=>r.json());
    res.status(200).json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
}
