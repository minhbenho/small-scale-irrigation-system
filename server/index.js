const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

const LOG_FILE = path.join(__dirname, 'logs.jsonl');

app.post('/sensor-data', (req, res) => {
  const {
    deviceId,
    soilMoisture,
    pumpState,
    timestamp
  } = req.body;

  // ❗ validate tối thiểu (KHÔNG làm phức tạp)
  if (!deviceId || !soilMoisture || !pumpState) {
    return res.status(200).json({ ok: false, reason: 'missing fields' });
  }

  const logEntry = {
    deviceId,
    soilMoisture,
    pumpState,
    timestamp: timestamp || Date.now()
  };

  // append 1 dòng JSON
  fs.appendFile(
    LOG_FILE,
    JSON.stringify(logEntry) + '\n',
    (err) => {
      if (err) {
        console.error('❌ Write log error:', err);
        // server KHÔNG crash
      }
    }
  );

  res.status(200).json({ ok: true });
});

app.post('/test', (req,res)=>{
  res.send('ok');
});


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
