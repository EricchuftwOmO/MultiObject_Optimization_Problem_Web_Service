// 處理所有沒有配對到的 route，回傳 JSON 格式的 404
function notFound(req, res) {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} does not exist`
    });
}

module.exports = notFound;