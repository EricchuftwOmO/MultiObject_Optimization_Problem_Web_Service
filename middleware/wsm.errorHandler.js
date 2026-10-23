const multer = require('multer');

// 處理所有沒有被接住的錯誤，回傳 JSON
// 一定要有 4 個參數，Express 才會把它當成錯誤處理 middleware
function errorHandler(err, req, res, next) {
    // Multer 的錯誤（檔案太大、欄位名稱錯誤）是使用者的錯 → 400
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            error: 'File upload error',
            details: err.message
        });
    }

    // 其他未預期的錯誤 → 500
    // 詳細的錯誤只記在 server 的終端機，不要傳給使用者
    console.error(err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing the request'
    });
}

module.exports = errorHandler;