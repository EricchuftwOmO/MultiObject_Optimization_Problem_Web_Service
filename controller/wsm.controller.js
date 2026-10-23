const {validateInput} = require('../service/wsm.validator');
const {runWSM} = require('../service/wsm.service');
const defaultDataset = require('../data/default.json');

// GET /
// 回傳服務說明：這個服務在做什麼、有哪些 endpoint 可以用
function getServiceInfo(req, res) {
    res.status(200).json({
        service: 'WSM Web Service',
        description: 'Solves multi-criteria decision-making problems using the Weighted Sum Method (WSM). ' +
            'Upload a JSON file with alternatives, criteria values, weights and criteria types ' +
            'to get all alternatives ranked by their WSM scores.',
        endpoints: [
            {
                method: 'GET',
                path: '/',
                description: 'Returns this service description'
            },
            {
                method: 'POST',
                path: '/wsm',
                description: 'Calculates WSM scores and returns the alternatives ranked from highest to lowest score',
                contentType: 'multipart/form-data',
                fileField: 'file',
                notes: 'If no file is uploaded, the default dataset stored on the server is used'
            }
        ]
    });
}

// POST 
function handleWSMRequest(req, res) {
    let data;
    let dataSource;
    if (!req.file){
        // no file uploaded
        // use a default dataset stored on the server
        data = defaultDataset;
        dataSource = 'default';
    }
    else{
        // req.file.buffer 是原始 bytes，JSON.parse只吃字串，所以要先轉換。
        const text = req.file.buffer.toString('utf8');
        try {
            data = JSON.parse(text);
            dataSource = 'uploaded';
        } catch(error){
            return res.status(400).json({
                error: 'Uploaded file is not valid JSON',
                details: error.message
            });
        }
    }
    
    const errors = validateInput(data);
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Invalid input data',
            details: errors,
        });
    }

    // 資料驗證通過，交給 service 計算 WSM 分數並回傳結果
    const result = runWSM(data);
    result.metadata.dataSource = dataSource;
    res.status(200).json(result);
}

module.exports = {
    getServiceInfo,
    handleWSMRequest
};