const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const NGROK_URL = 'https://credibly-pliable-cofounder.ngrok-free.dev';
    const response = await axios.post(`${NGROK_URL}/api/chat`, req.body, {
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      timeout: 30000
    });
    res.json(response.data);
  } catch (e) {
    console.error('Error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
};
