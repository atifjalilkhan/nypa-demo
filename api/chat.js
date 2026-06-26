const axios = require('axios');
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const NGROK_URL = process.env.NGROK_URL || 'https://bts-demos.ngrok.app';
    const response = await axios.post(`${NGROK_URL}/nypa/api/chat`, req.body, {
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      timeout: 55000
    });
    res.json(response.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
