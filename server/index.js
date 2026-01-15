const express = require('express');
const app = express();
const PORT = 3000;

// middleware để đọc JSON
app.use(express.json());

// POST endpoint
app.post('/sensor-data', (req, res) => {
  console.log('📩 ESP32 gửi lên:');
  console.log(req.body);

  res.status(200).json({ ok: true });
});

// chạy server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
