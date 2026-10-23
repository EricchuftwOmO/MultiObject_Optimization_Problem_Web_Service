// Import required modules
const express = require('express');

// Initialize Express app
const app = express();
const port = 3000;

// 用require載入其他模組
const upload = require('./middleware/wsm.upload');
const notFound = require('./middleware/wsm.notFound');
// 用大括號只取出模組中的指定function
const { getServiceInfo, handleWSMRequest } = require('./controller/wsm.controller');

// Endpoint: GET /：回傳服務說明和可用的 endpoint
app.get('/', getServiceInfo);

// Endpoint: POST /wsm：先經過 upload 接收檔案，再交給 handleWSMRequest 處理
app.post('/wsm', upload, handleWSMRequest);

// 上面的 route 都沒有配對到時，回傳 JSON 格式的 404
app.use(notFound);

// 開始佔用一個 port、持續等待連線
app.listen(port, () => {
  console.log(`WSM service running at http://localhost:${port}`);
});
