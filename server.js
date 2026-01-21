const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins with all methods
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'running', 
    message: 'Dr. Gouhar Radiology API Proxy Server',
    endpoints: {
      claude: '/api/claude',
      openai: '/api/openai',
      whisper: '/api/whisper'
    }
  });
});

// Claude API Proxy
app.post('/api/claude', async (req, res) => {
  try {
    console.log('Proxying request to Claude API...');
    
    const { apiKey, messages, system, model, maxTokens } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: maxTokens || 2000,
        system: system,
        messages: messages
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Claude API Error:', data);
      return res.status(response.status).json(data);
    }

    console.log('Claude API Success');
    res.json(data);
    
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ 
      error: 'Proxy server error', 
      message: error.message 
    });
  }
});

// OpenAI ChatGPT Proxy
app.post('/api/openai', async (req, res) => {
  try {
    console.log('Proxying request to OpenAI API...');
    
    const { apiKey, messages, model, temperature, maxTokens } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: messages,
        temperature: temperature || 0.3,
        max_tokens: maxTokens || 1500
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API Error:', data);
      return res.status(response.status).json(data);
    }

    console.log('OpenAI API Success');
    res.json(data);
    
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ 
      error: 'Proxy server error', 
      message: error.message 
    });
  }
});

// OpenAI Whisper Proxy
app.post('/api/whisper', async (req, res) => {
  try {
    console.log('Proxying request to Whisper API...');
    
    const { apiKey, audio, model, language } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    // Note: This is simplified - actual implementation would handle multipart/form-data
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', Buffer.from(audio, 'base64'), 'audio.webm');
    form.append('model', model || 'whisper-1');
    if (language) form.append('language', language);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...form.getHeaders()
      },
      body: form
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Whisper API Error:', data);
      return res.status(response.status).json(data);
    }

    console.log('Whisper API Success');
    res.json(data);
    
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ 
      error: 'Proxy server error', 
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Dr. Gouhar API Proxy Server running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
});
