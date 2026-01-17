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

app.get('/config',(req,res)=>{
  const deviceId=req.query.deviceId;
  if(!deviceId){
    return res.status(400).json({ok: false});
  }
  // config tĩnh, sau này có dtb sẽ fix lại
  const config={
    thresholdDry: 1400,
    thresholdWet: 1800,
    minWaterTime: 2000,
    maxWaterTime: 5000,
    cooldownMs: 5000
  };
  res.status(200).json(config);
})

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
