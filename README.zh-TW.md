# Multi-Objective Optimization Problem Web Service

[English](README.md) | **繁體中文**

這是一個使用 Node.js / Express.js 開發的 Web 服務，以**加權總和法（Weighted Sum Method, WSM）**解決多準則決策問題。Client 上傳一個包含替代方案、各準則數值、權重和準則類型的 JSON 檔案，服務會依照 WSM 分數排序所有替代方案，並以 JSON 格式回傳。

## 專案結構

```
.
├── index.js                    # 程式進入點（建立 Express app 並啟動 server）
├── controller/
│   └── wsm.controller.js       # 處理 HTTP request 和 response
├── service/
│   ├── wsm.service.js          # WSM 計算邏輯（不依賴 HTTP）
│   └── wsm.validator.js        # WSM 輸入資料的驗證規則
├── middleware/
│   └── wsm.upload.js           # 處理 JSON 檔案上傳的 Multer middleware
├── package.json
├── README.md                   # 說明文件（英文）
└── README.zh-TW.md             # 說明文件（繁體中文）
```

### 各層的職責

| 層 | 檔案 | 職責 | 使用 `req` / `res`？ |
|---|---|---|---|
| 進入點 | `index.js` | 建立 Express app、註冊 middleware 和 routes、啟動 server | 是 |
| Middleware | `middleware/wsm.upload.js` | 透過 Multer 接收上傳的檔案，放到 `req.file` | 是 |
| Controller | `controller/wsm.controller.js` | 決定資料來源（上傳的檔案或預設資料集）、解析 JSON、呼叫 service、回傳 JSON response | 是 |
| Service | `service/wsm.service.js` | 正規化數值、套用權重、排序替代方案、組成結果 | 否 |
| Validator | `service/wsm.validator.js` | 檢查輸入資料是否符合預期的結構和 WSM 規則 | 否 |

WSM 的計算和驗證邏輯不依賴 Express，因此任何 client（HTTP、CLI、測試）都能直接重複使用，不需要修改程式碼。

## WSM 計算

### 正規化

不同準則的單位和尺度不同（例如價格以美元計、品質是 1 到 10 分），所以套用權重前要先正規化：

- **效益型準則（benefit，越高越好）**：`正規化值 = 數值 / 最大值`
- **成本型準則（cost，越低越好）**：`正規化值 = 最小值 / 數值`

這裡的最小值和最大值，是該準則在輸入資料所有替代方案中的最小值和最大值。

分數只在組成結果時才四捨五入，所以排序一律使用精確的數值。

## 輸入格式

```json
{
  "alternatives": [
    {
      "name": "Option A",
      "criteria": { "price": 100, "quality": 8, "durability": 7, "eco_friendly": 6 }
    },
    {
      "name": "Option B",
      "criteria": { "price": 150, "quality": 9, "durability": 8, "eco_friendly": 8 }
    },
    {
      "name": "Option C",
      "criteria": { "price": 80, "quality": 6, "durability": 6, "eco_friendly": 9 }
    }
  ],
  "weights": {
    "price": 0.4,
    "quality": 0.3,
    "durability": 0.2,
    "eco_friendly": 0.1
  },
  "criteriaTypes": {
    "price": "cost",
    "quality": "benefit",
    "durability": "benefit",
    "eco_friendly": "benefit"
  }
}
```

| 欄位 | 說明 |
|---|---|
| `alternatives` | 要比較的替代方案列表。每個方案都有 `name`，以及一個包含所有準則數值的 `criteria` 物件 |
| `weights` | 每個準則的重要程度。權重不能是負數，且總和必須為 1.0 |
| `criteriaTypes` | 每個準則的類型：`"benefit"`（越高越好）或 `"cost"`（越低越好） |

替代方案和準則的數量都不固定，準則名稱也是從輸入資料讀取，因此同一個服務不用修改程式碼，就能解決不同的決策問題。

## 輸出格式

上方輸入範例的輸出結果：

```json
{
  "bestAlternative": { "name": "Option C", "score": 0.85 },
  "results": [
    { "name": "Option C", "score": 0.85 },
    { "name": "Option A", "score": 0.828 },
    { "name": "Option B", "score": 0.802 }
  ],
  "statistics": {
    "highestScore": 0.85,
    "lowestScore": 0.802,
    "averageScore": 0.827,
    "scoreRange": 0.048
  },
  "metadata": {
    "method": "WSM",
    "totalAlternatives": 3,
    "totalCriteria": 4,
    "criteria": ["price", "quality", "durability", "eco_friendly"],
    "timestamp": "2026-10-23T08:20:46.774Z"
  }
}
```

## 開始使用

```bash
npm install
npm start      # 使用 nodemon 在 http://localhost:3000 啟動 server
```
