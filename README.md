# Multi-Objective Optimization Problem Web Service

**English** | [繁體中文](README.zh-TW.md)

A Node.js / Express.js web service that solves multi-criteria decision-making problems using the **Weighted Sum Method (WSM)**. Clients upload a JSON file containing alternatives, criteria values, weights and criteria types, and the service returns the alternatives ranked by their WSM scores in JSON format.

## Project Structure

```
.
├── index.js                    # Application entry point (Express app setup and server start)
├── controller/
│   └── wsm.controller.js       # HTTP request/response handling
├── service/
│   ├── wsm.service.js          # WSM calculation logic (independent of HTTP)
│   └── wsm.validator.js        # Input validation rules for WSM data
├── middleware/
│   └── wsm.upload.js           # Multer middleware for JSON file uploads
├── package.json
├── README.md                   # Documentation (English)
└── README.zh-TW.md             # Documentation (Traditional Chinese)
```

### Responsibilities of each layer

| Layer | File | Responsibility | Uses `req` / `res`? |
|---|---|---|---|
| Entry point | `index.js` | Creates the Express app, registers middleware and routes, starts the server | Yes |
| Middleware | `middleware/wsm.upload.js` | Receives the uploaded file through Multer and makes it available as `req.file` | Yes |
| Controller | `controller/wsm.controller.js` | Chooses the data source (uploaded file or default dataset), parses the JSON, calls the service, sends the JSON response | Yes |
| Service | `service/wsm.service.js` | Normalizes values, applies weights, ranks alternatives and builds the result | No |
| Validator | `service/wsm.validator.js` | Checks that the input data follows the expected structure and WSM rules | No |

The WSM calculation and validation logic do not depend on Express, so they can be reused by any client (HTTP, CLI, tests) without modification.

## WSM Calculation

### Normalization

Criteria use different scales (e.g. price in dollars, quality from 1 to 10), so values are normalized before applying weights:

- **Benefit criterion** (higher is better): `normalized = value / max`
- **Cost criterion** (lower is better): `normalized = min / value`

`min` and `max` are the smallest and largest values of that criterion among all alternatives in the input.

Scores are rounded only when the result is built, so ranking always uses the exact values.

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
| `weights` | Importance of each criterion. Weights must be non-negative and sum to 1.0 |
| `criteriaTypes` | Type of each criterion: `"benefit"` (higher is better) or `"cost"` (lower is better) |

The number of alternatives and criteria is not fixed, and criteria names are read from the input, so the same service can solve different decision-making problems without changing the code.

## Output Format

Output of the input example above:

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

## Getting Started

```bash
npm install
npm start      # starts the server with nodemon on http://localhost:3000
```
