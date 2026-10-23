# Multi-Objective Optimization Problem Web Service

[English](README.md) | **繁體中文**

這是一個使用 Node.js / Express.js 開發的 Web 服務，以**加權總和法（Weighted Sum Method, WSM）**解決多準則決策問題。Client 上傳一個包含替代方案、各準則數值、權重和準則類型的 JSON 檔案，服務會依照 WSM 分數排序所有替代方案，並以 JSON 格式回傳。

這個服務不限定於某一個問題：替代方案、準則、數值和權重都來自上傳的檔案，所以同一個 endpoint 不用修改程式碼，就能用來選工作、選學校、選手機或任何其他決策問題。

## 開始使用

需求：Node.js 18 以上。

```bash
npm install
npm start      # 使用 nodemon 在 http://localhost:3000 啟動 server
```

打開 http://localhost:3000/ 確認服務正在運作。

## API 文件

所有回應（包括錯誤）都是 JSON 格式。

| Method | Endpoint | 說明 |
|---|---|---|
| `GET` | `/` | 回傳服務說明和可用的 endpoint |
| `POST` | `/wsm` | 上傳 JSON 檔案，執行 WSM 計算並回傳排序後的替代方案 |

### `GET /`

回傳服務的簡短說明和可用的 endpoint 列表。

**回應 `200 OK`**

```json
{
  "service": "WSM Web Service",
  "description": "Solves multi-criteria decision-making problems using the Weighted Sum Method (WSM). ...",
  "endpoints": [
    { "method": "GET", "path": "/", "description": "Returns this service description" },
    {
      "method": "POST",
      "path": "/wsm",
      "description": "Calculates WSM scores and returns the alternatives ranked from highest to lowest score",
      "contentType": "multipart/form-data",
      "fileField": "file",
      "notes": "If no file is uploaded, the default dataset stored on the server is used"
    }
  ]
}
```

### `POST /wsm`

計算上傳檔案中每個替代方案的 WSM 分數。

**Request**

| 項目 | 值 |
|---|---|
| Content type | `multipart/form-data` |
| 表單欄位 | `file`（選填，JSON 檔案，格式見[輸入格式](#輸入格式)）|
| 檔案大小上限 | 1 MB |

**資料來源**

- **有上傳檔案**：使用上傳的檔案。如果檔案不是合法的 JSON，或不符合輸入規則，會回傳 `400 Bad Request`。這種情況下絕對不會改用預設資料集。
- **沒有上傳檔案**：使用 server 上的預設資料集（`data/default.json`）。

回應中的 `metadata.dataSource` 會標示使用的是哪一種：`"uploaded"` 或 `"default"`。

**使用 Postman**

1. Method 選 `POST`，URL 填 `http://localhost:3000/wsm`
2. 打開 **Body** → 選 **form-data**
3. Key 填 `file`，把類型從 **Text** 改成 **File**，再選擇 JSON 檔案
4. 按 **Send**

**使用 curl**

```bash
# 上傳檔案
curl -X POST -F "file=@testdata/good.json" http://localhost:3000/wsm

# 不上傳檔案：使用預設資料集
curl -X POST http://localhost:3000/wsm
```

**成功回應 `200 OK`**

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
    "timestamp": "2026-10-23T08:20:46.774Z",
    "dataSource": "uploaded"
  }
}
```

| 欄位 | 說明 |
|---|---|
| `bestAlternative` | 分數最高的替代方案 |
| `results` | 所有替代方案和分數，依分數由高到低排序 |
| `statistics` | 最高分、最低分、平均分和分數範圍（最高分 − 最低分）|
| `metadata` | 方法名稱、替代方案和準則的數量、準則名稱、計算時間（ISO 8601），以及資料來源（`"uploaded"` 或 `"default"`）|

分數四捨五入到小數點後 3 位。

### 錯誤回應

| 狀態碼 | 發生情況 |
|---|---|
| `400 Bad Request` | 上傳的檔案不是合法的 JSON |
| `400 Bad Request` | JSON 不符合輸入規則（缺少欄位、權重不合法、數值不合法等）|
| `400 Bad Request` | 檔案超過 1 MB，或表單欄位名稱不是 `file` |
| `404 Not Found` | Endpoint 不存在 |
| `500 Internal Server Error` | Server 發生未預期的錯誤 |

**`400`：檔案不是合法的 JSON**

```json
{
  "error": "Uploaded file is not valid JSON",
  "details": "Expected ',' or '}' after property value in JSON at position 787 (line 42 column 4)"
}
```

**`400`：權重總和不是 1.0**

```json
{
  "error": "Invalid input data",
  "details": ["Weights must sum to 1.0 (current sum: 1.7)"]
}
```

**`400`：缺少準則或出現未定義的準則**

檔案中找到的所有問題會一次列出：

```json
{
  "error": "Invalid input data",
  "details": [
    "alternatives[1] is missing \"quality\"",
    "alternatives[1] has unknown criterion \"q\""
  ]
}
```

**`400`：檔案上傳錯誤**

```json
{
  "error": "File upload error",
  "details": "Unexpected file field"
}
```

**`404`：Endpoint 不存在**

```json
{
  "error": "Not Found",
  "message": "Route GET /abc does not exist"
}
```

**`500`：Server 發生未預期的錯誤**

錯誤細節只會記錄在 server 端，不會傳給 client。

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred while processing the request"
}
```

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
| `weights` | 每個準則的重要程度。`weights` 裡的準則名稱決定計算時使用哪些準則 |
| `criteriaTypes` | 每個準則的類型：`"benefit"`（越高越好）或 `"cost"`（越低越好）|

### 驗證規則

| 規則 | 不合法的例子 |
|---|---|
| 檔案內容必須是 JSON 物件 | `[1, 2, 3]`、`"hello"`、`null` |
| `alternatives` 必須是陣列，且至少有 2 個替代方案 | 缺少、不是陣列、只有 1 個方案 |
| `weights` 和 `criteriaTypes` 必須是非空的物件 | 缺少、是陣列、`{}` |
| 每個權重都必須是 ≥ 0 的數字 | `"0.4"`、`-0.1` |
| 權重總和必須為 1.0（容許誤差 ±0.001）| `0.5 + 0.3 + 0.2 + 0.1 = 1.1` |
| 每個準則的類型必須是 `"benefit"` 或 `"cost"` | `"Cost"`、缺少類型 |
| `criteriaTypes` 不能有沒有權重的準則 | 多了一個 `"color"` |
| 每個替代方案都必須有不重複、非空白的 `name` | 名稱空白、名稱重複 |
| 每個替代方案都必須有所有準則的數值 | 缺少 `"quality"` |
| 每個數值都必須是大於 0 的數字 | `0`、`-5`、`"100"` |
| 替代方案不能有沒有權重的準則 | 拼錯成 `"prise"` |

數值必須大於 0，因為正規化公式會除以它（見下方說明）。

## WSM 計算

### 1. 正規化

不同準則的單位和尺度不同（例如薪水以美元計、評分是 1 到 10 分），所以先把每個數值正規化成 0 到 1 之間的數字：

- **效益型準則（benefit，越高越好）**：`正規化值 = 數值 / 最大值`
- **成本型準則（cost，越低越好）**：`正規化值 = 最小值 / 數值`

這裡的最小值和最大值，是該準則在輸入資料所有替代方案中的最小值和最大值。正規化之後，每個準則表現最好的方案會得到 1，而且一律是越高越好。

### 2. 加權總和

每個替代方案的分數，是它的正規化值乘以權重後的總和：

```
分數 = Σ（準則的正規化值 × 準則的權重）
```

### 3. 排序

替代方案依分數由高到低排序。分數只在組成結果時才四捨五入，所以排序一律使用精確的數值。同分的替代方案會保持輸入檔案中的順序。

## 專案結構

```
.
├── index.js                      # 進入點：建立 app、註冊 routes 和 middleware、啟動 server
├── controller/
│   └── wsm.controller.js         # 處理 HTTP request 和 response
├── service/
│   ├── wsm.service.js            # WSM 計算邏輯（不依賴 HTTP）
│   └── wsm.validator.js          # 輸入資料的驗證規則（不依賴 HTTP）
├── middleware/
│   ├── wsm.upload.js             # 處理 JSON 檔案上傳的 Multer middleware
│   ├── wsm.notFound.js           # 不存在的 endpoint 回傳 JSON 格式的 404
│   └── wsm.errorHandler.js       # 上傳錯誤回傳 400、未預期的錯誤回傳 500（JSON 格式）
├── data/
│   └── default.json              # 沒有上傳檔案時使用的預設資料集
├── testdata/                     # 測試用的範例輸入檔案
├── package.json
├── README.md                     # 說明文件（英文）
└── README.zh-TW.md               # 說明文件（繁體中文）
```

| 層 | 檔案 | 職責 | 使用 `req` / `res`？ |
|---|---|---|---|
| 進入點 | `index.js` | 建立 Express app、註冊 routes 和 middleware、啟動 server | 是 |
| Middleware | `middleware/wsm.upload.js` | 透過 Multer 接收上傳的檔案，放到 `req.file` | 是 |
| Controller | `controller/wsm.controller.js` | 決定資料來源（上傳的檔案或預設資料集）、解析上傳的 JSON、呼叫 validator 和 service、回傳 JSON response | 是 |
| Validator | `service/wsm.validator.js` | 檢查輸入資料是否符合輸入規則，並回傳所有問題的列表 | 否 |
| Service | `service/wsm.service.js` | 正規化數值、套用權重、排序替代方案、組成結果 | 否 |
| Middleware | `middleware/wsm.notFound.js` | 處理沒有配對到任何 route 的 request | 是 |
| Middleware | `middleware/wsm.errorHandler.js` | 處理 request 過程中丟出的錯誤 | 是 |

WSM 的計算和驗證邏輯不依賴 Express，因此任何 client（HTTP、CLI、測試）都能直接重複使用，不需要修改程式碼。

### Request 流程

```
POST /wsm
  → wsm.upload.js          接收檔案（req.file）
  → wsm.controller.js      有上傳檔案嗎？             → 沒有：使用 data/default.json
                           有：解析 JSON              → 不是合法的 JSON 時回傳 400
  → wsm.validator.js       驗證輸入資料               → 回傳 400 和所有找到的問題
  → wsm.service.js         正規化、計算分數、排序
  → wsm.controller.js      回傳 200 和計算結果

不存在的 endpoint          → wsm.notFound.js          → 404
處理 request 時發生錯誤    → wsm.errorHandler.js      → 400（上傳錯誤）或 500
```

## 測試資料

`testdata/` 資料夾裡有測試這個服務用的範例檔案。

### 合法的輸入

| 檔案 | 大小 | 說明 |
|---|---|---|
| `good.json` | 3 個方案 × 4 個準則 | 小型範例（依價格、品質、耐用度和環保程度比較產品）|
| `goodjobOffers.json` | 10 個方案 × 8 個準則 | **主要情境**：依薪水、通勤時間、工作與生活平衡、發展機會、年假、遠端彈性、公司評價和健保自付額選擇工作 |
| `goodjobOffersSalaryOnly.json` | 10 個方案 × 8 個準則 | 同樣的工作資料，但權重全部給薪水，用來示範修改權重如何改變排名 |
| `goodschoolSelection.json` | 5 個方案 × 4 個準則 | **第二個情境**：依學費、排名、校園設施和畢業生就業率選擇學校 |

所有公司、學校的名稱和資料都是虛構的。

### 不合法的輸入

| 檔案 | 問題 | 預期回應 |
|---|---|---|
| `bad.json` | 少了最後的 `}` | `400`：不是合法的 JSON |
| `notJSON.txt` | 純文字，不是 JSON | `400`：不是合法的 JSON |
| `wrongWeightSum.json` | 權重總和是 1.7 | `400`：權重總和必須為 1.0 |
| `wrongCriteriaTypes.json` | 準則類型不合法 | `400`：類型必須是 `"benefit"` 或 `"cost"` |
| `criteriaNameNotMatch.json` | `criteriaTypes` 和 `weights` 的準則名稱不一致 | `400`：缺少類型、出現未定義的準則 |
| `wrongAlternatives.json` | 某個替代方案的準則名稱拼錯 | `400`：缺少準則、出現未定義的準則 |

### 修改權重的影響

先上傳 `goodjobOffers.json`，再上傳 `goodjobOffersSalaryOnly.json`，就能看到使用者偏好如何改變結果：

| 公司 | 年薪 | 名次（平衡權重）| 名次（只看薪水）|
|---|---|---|---|
| Nimbus Cloud Labs | 132,000 | 1 | 2 |
| Willow Education Tech | 92,000 | 2 | 10 |
| Lumen Robotics | 140,000 | 6 | 1 |

在平衡的權重下，Willow Education Tech 靠著工作與生活平衡和年假排在第 2 名。只看薪水時，它掉到最後一名，而年薪最高的 Lumen Robotics 則升到第 1 名。

### 可重複使用性

`goodjobOffers.json` 和 `goodschoolSelection.json` 是兩個不同的問題，替代方案、準則和權重都不一樣。兩者都送到同一個 `POST /wsm` endpoint，不用修改程式碼就能正確處理。
