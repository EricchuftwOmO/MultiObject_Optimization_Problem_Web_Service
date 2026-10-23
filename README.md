# Multi-Objective Optimization Problem Web Service

**English** | [繁體中文](README.zh-TW.md)

A Node.js / Express.js web service that solves multi-criteria decision-making problems using the **Weighted Sum Method (WSM)**. Clients upload a JSON file containing alternatives, criteria values, weights and criteria types, and the service returns all alternatives ranked by their WSM scores in JSON format.

The service is not tied to one problem: alternatives, criteria, values and weights all come from the uploaded file, so the same endpoint can choose a job offer, a school, a phone or anything else without changing the code.

## Getting Started

Requirements: Node.js 18 or later.

```bash
npm install
npm start      # starts the server with nodemon on http://localhost:3000
```

Open http://localhost:3000/ to check that the service is running.

## API Documentation

All responses, including errors, are returned as JSON.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Returns a description of the service and its available endpoints |
| `POST` | `/wsm` | Uploads a JSON file, runs the WSM calculation and returns the ranked alternatives |

### `GET /`

Returns a short description of the service and the list of available endpoints.

**Response `200 OK`**

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

Calculates the WSM score of every alternative in the uploaded file.

**Request**

| Item | Value |
|---|---|
| Content type | `multipart/form-data` |
| Form field | `file` (optional, a JSON file, see [Input Format](#input-format)) |
| Maximum file size | 1 MB |

**Data source**

- **File uploaded**: the uploaded file is used. If it is not valid JSON or does not follow the input rules, the service returns `400 Bad Request`. It never falls back to the default dataset in this case.
- **No file uploaded**: the default dataset stored on the server (`data/default.json`) is used.

`metadata.dataSource` in the response shows which one was used: `"uploaded"` or `"default"`.

**Example with Postman**

1. Set the method to `POST` and the URL to `http://localhost:3000/wsm`
2. Open **Body** → select **form-data**
3. Enter `file` as the key, change its type from **Text** to **File**, and choose a JSON file
4. Click **Send**

**Example with curl**

```bash
# Upload a file
curl -X POST -F "file=@testdata/good.json" http://localhost:3000/wsm

# No file: use the default dataset
curl -X POST http://localhost:3000/wsm
```

**Success response `200 OK`**

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

| Field | Description |
|---|---|
| `bestAlternative` | The alternative with the highest score |
| `results` | All alternatives with their scores, sorted from highest to lowest score |
| `statistics` | Highest, lowest and average score, and the score range (highest − lowest) |
| `metadata` | Method name, number of alternatives and criteria, criteria names, calculation time (ISO 8601) and data source (`"uploaded"` or `"default"`) |

Scores are rounded to 3 decimal places.

### Error Responses

| Status | When it happens |
|---|---|
| `400 Bad Request` | The uploaded file is not valid JSON |
| `400 Bad Request` | The JSON does not follow the input rules (missing fields, invalid weights, invalid values, etc.) |
| `400 Bad Request` | The file is larger than 1 MB, or the form field is not named `file` |
| `404 Not Found` | The endpoint does not exist |
| `500 Internal Server Error` | An unexpected error occurred on the server |

**`400` — file is not valid JSON**

```json
{
  "error": "Uploaded file is not valid JSON",
  "details": "Expected ',' or '}' after property value in JSON at position 787 (line 42 column 4)"
}
```

**`400` — weights do not sum to 1.0**

```json
{
  "error": "Invalid input data",
  "details": ["Weights must sum to 1.0 (current sum: 1.7)"]
}
```

**`400` — missing or unknown criteria**

All problems found in the file are reported at once:

```json
{
  "error": "Invalid input data",
  "details": [
    "alternatives[1] is missing \"quality\"",
    "alternatives[1] has unknown criterion \"q\""
  ]
}
```

**`400` — file upload error**

```json
{
  "error": "File upload error",
  "details": "Unexpected file field"
}
```

**`404` — endpoint does not exist**

```json
{
  "error": "Not Found",
  "message": "Route GET /abc does not exist"
}
```

**`500` — unexpected server error**

The error details are logged on the server and are not sent to the client.

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred while processing the request"
}
```

## Input Format

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

| Field | Description |
|---|---|
| `alternatives` | List of options to compare. Each has a `name` and a `criteria` object with a value for every criterion |
| `weights` | Importance of each criterion. The criteria names in `weights` define the criteria used in the calculation |
| `criteriaTypes` | Type of each criterion: `"benefit"` (higher is better) or `"cost"` (lower is better) |

### Validation Rules

| Rule | Example of invalid input |
|---|---|
| The file must contain a JSON object | `[1, 2, 3]`, `"hello"`, `null` |
| `alternatives` must be an array with at least 2 alternatives | Missing, not an array, only 1 alternative |
| `weights` and `criteriaTypes` must be non-empty objects | Missing, an array, `{}` |
| Every weight must be a number ≥ 0 | `"0.4"`, `-0.1` |
| Weights must sum to 1.0 (tolerance ±0.001) | `0.5 + 0.3 + 0.2 + 0.1 = 1.1` |
| Every criterion must have the type `"benefit"` or `"cost"` | `"Cost"`, missing type |
| `criteriaTypes` must not contain criteria without a weight | Extra criterion `"color"` |
| Every alternative must have a unique, non-empty `name` | Empty name, duplicate names |
| Every alternative must have a value for every criterion | Missing `"quality"` |
| Every value must be a number greater than 0 | `0`, `-5`, `"100"` |
| Alternatives must not contain criteria without a weight | Misspelled `"prise"` |

Values must be greater than 0 because the normalization formulas divide by them (see below).

## WSM Calculation

### 1. Normalization

Criteria use different scales (e.g. salary in dollars, rating from 1 to 10), so each value is first normalized to a number between 0 and 1:

- **Benefit criterion** (higher is better): `normalized = value / max`
- **Cost criterion** (lower is better): `normalized = min / value`

`min` and `max` are the smallest and largest values of that criterion among all alternatives in the input. After normalization, the best alternative for each criterion gets 1, and higher is always better.

### 2. Weighted Sum

The score of each alternative is the sum of its normalized values multiplied by the weights:

```
score = Σ (normalized value of criterion × weight of criterion)
```

### 3. Ranking

Alternatives are sorted by score from highest to lowest. Scores are rounded only when the result is built, so ranking always uses the exact values. Alternatives with the same score keep their order from the input file.

## Project Structure

```
.
├── index.js                      # Entry point: creates the app, registers routes and middleware, starts the server
├── controller/
│   └── wsm.controller.js         # HTTP request/response handling
├── service/
│   ├── wsm.service.js            # WSM calculation logic (independent of HTTP)
│   └── wsm.validator.js          # Input validation rules (independent of HTTP)
├── middleware/
│   ├── wsm.upload.js             # Multer middleware for JSON file uploads
│   ├── wsm.notFound.js           # Returns a JSON 404 for unknown endpoints
│   └── wsm.errorHandler.js       # Returns JSON for upload errors (400) and unexpected errors (500)
├── data/
│   └── default.json              # Default dataset used when no file is uploaded
├── testdata/                     # Sample input files for testing
├── package.json
├── README.md                     # Documentation (English)
└── README.zh-TW.md               # Documentation (Traditional Chinese)
```

| Layer | File | Responsibility | Uses `req` / `res`? |
|---|---|---|---|
| Entry point | `index.js` | Creates the Express app, registers routes and middleware, starts the server | Yes |
| Middleware | `middleware/wsm.upload.js` | Receives the uploaded file through Multer and makes it available as `req.file` | Yes |
| Controller | `controller/wsm.controller.js` | Chooses the data source (uploaded file or default dataset), parses the uploaded JSON, calls the validator and the service, sends the JSON response | Yes |
| Validator | `service/wsm.validator.js` | Checks that the input data follows the input rules and returns a list of problems | No |
| Service | `service/wsm.service.js` | Normalizes values, applies weights, ranks alternatives and builds the result | No |
| Middleware | `middleware/wsm.notFound.js` | Handles requests that match no route | Yes |
| Middleware | `middleware/wsm.errorHandler.js` | Handles errors thrown while processing a request | Yes |

The WSM calculation and validation logic do not depend on Express, so they can be reused by any client (HTTP, CLI, tests) without modification.

### Request Flow

```
POST /wsm
  → wsm.upload.js          receive the file (req.file)
  → wsm.controller.js      file uploaded?             → no: use data/default.json
                           yes: parse JSON            → 400 if invalid JSON
  → wsm.validator.js       validate the input         → 400 with all problems found
  → wsm.service.js         normalize, score, rank
  → wsm.controller.js      200 with the results

Unknown endpoint           → wsm.notFound.js          → 404
Error during the request   → wsm.errorHandler.js      → 400 (upload error) or 500
```

## Test Data

The `testdata/` folder contains sample files for testing the service.

### Valid Inputs

| File | Size | Description |
|---|---|---|
| `good.json` | 3 alternatives × 4 criteria | Small example (products compared by price, quality, durability and eco-friendliness) |
| `goodjobOffers.json` | 10 alternatives × 8 criteria | **Main scenario**: choosing a job offer by salary, commute time, work-life balance, career growth, paid time off, remote flexibility, company rating and health insurance cost |
| `goodjobOffersSalaryOnly.json` | 10 alternatives × 8 criteria | Same job offers with all weight on salary, to show how changing the weights changes the ranking |
| `goodschoolSelection.json` | 5 alternatives × 4 criteria | **Second scenario**: choosing a school by tuition, ranking, campus facilities and graduate employment rate |

All company and school names and their data are fictional.

### Invalid Inputs

| File | Problem | Expected response |
|---|---|---|
| `bad.json` | Missing closing `}` | `400` — not valid JSON |
| `notJSON.txt` | Plain text, not JSON | `400` — not valid JSON |
| `wrongWeightSum.json` | Weights sum to 1.7 | `400` — weights must sum to 1.0 |
| `wrongCriteriaTypes.json` | Invalid criterion type | `400` — type must be `"benefit"` or `"cost"` |
| `criteriaNameNotMatch.json` | Criteria names in `criteriaTypes` do not match `weights` | `400` — missing type and unknown criterion |
| `wrongAlternatives.json` | An alternative uses a misspelled criterion name | `400` — missing and unknown criterion |

### Effect of Changing Weights

Uploading `goodjobOffers.json` and then `goodjobOffersSalaryOnly.json` shows how user preferences change the result:

| Company | Salary | Rank (balanced weights) | Rank (salary only) |
|---|---|---|---|
| Nimbus Cloud Labs | 132,000 | 1 | 2 |
| Willow Education Tech | 92,000 | 2 | 10 |
| Lumen Robotics | 140,000 | 6 | 1 |

With balanced weights, Willow Education Tech ranks second thanks to its work-life balance and paid time off. When only salary matters, it drops to last place and the highest-paying company, Lumen Robotics, moves to first.

### Reusability

`goodjobOffers.json` and `goodschoolSelection.json` describe two different problems with different alternatives, criteria and weights. Both are sent to the same `POST /wsm` endpoint and processed correctly without changing the source code.
