const {validateInput} = require('../service/wsm.validator');

function handleWSMRequest(req, res) {
    if (!req.file){
        // no file uploaded
        // use a default dataset stored on the server
        return res.json({ message: 'No file uploaded' });
    }

    // req.file.buffer 是原始 bytes，JSON.parse只吃字串，所以要先轉換。
    const text = req.file.buffer.toString('utf8');
    let data;
    try {
        data = JSON.parse(text);
    } catch(error){
        return res.status(400).json({
            error: 'Uploaded file is not valid JSON',
            details: error.message
        });
    }
    
    const errors = validateInput(data);
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Invalid input data',
            details: errors,
        });
    }

    res.json({
        message: 'Valid JSON',
        filename: req.file.originalname,
        size: req.file.size,
        data: data
    });
}

module.exports = {
    handleWSMRequest
};