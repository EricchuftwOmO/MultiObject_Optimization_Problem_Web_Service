// Import required modules
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 // 1MB
    }
}).single('file');

// 要export別的檔案才可以require到
module.exports = upload;