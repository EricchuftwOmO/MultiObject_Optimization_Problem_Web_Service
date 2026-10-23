// Import required modules
const express = require('express');

// Initialize Express app
const app = express();
const port = 3000;


// 開始佔用一個 port、持續等待連線
app.listen(port, () => {
  console.log(`WSM service running at http://localhost:${port}`);
});
