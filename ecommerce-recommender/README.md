# AI-Powered E-Commerce Recommendation System

A complete India-first product-discovery MVP with anonymous browsing history, natural-language idea matching, and explainable content-based recommendations. The UI is branded as **Khoj** and deliberately has no cart, checkout, or retailer redirects.

## Architecture

```text
┌─────────────────┐       REST        ┌──────────────────┐
│ React + Vite    │ ────────────────► │ Express API      │
│ localhost:5173  │ ◄──────────────── │ localhost:5000   │
└─────────────────┘                   └────────┬─────────┘
                                              │
                              ┌───────────────┴───────────────┐
                              │                               │
                              ▼                               ▼
                    ┌─────────────────┐             ┌─────────────────┐
                    │ MongoDB         │             │ FastAPI ML      │
                    │ products/views  │             │ localhost:8000  │
                    │ recommendation  │             │ stateless users │
                    │ logs            │             └─────────────────┘
                    └─────────────────┘
```

Recommendation flow:

1. React sends the anonymous `userId` with an interaction or recommendation request.
2. Express loads that user's recent product views from MongoDB.
3. Express sends only the ordered product IDs to FastAPI.
4. FastAPI builds a recent-view-weighted user profile and returns ranked product IDs, scores, and reasons.
5. Express hydrates those IDs with full MongoDB product documents, saves a log, and returns the result to React.

## How the recommender works

Each product becomes one text document made from its category, repeated tags, and description. `TfidfVectorizer` gives more importance to descriptive terms that distinguish a product from the rest of the catalog, while common words receive little or no weight. Unigrams and bigrams preserve both individual concepts such as `wireless` and phrases such as `noise cancelling`.

Cosine similarity measures the angle between two TF-IDF vectors. Products pointing in a similar direction use similar language and features, so their score approaches 1. For a user, the service averages the vectors of viewed products and gives newer views progressively higher weight. It ranks the catalog against that profile, removes already-viewed items, and explains each recommendation with the viewed product that has the highest direct similarity. With no history, it returns a round-robin selection across categories.

Interview summary: **TF-IDF turns product metadata into meaningful numeric feature vectors; cosine similarity ranks products by feature overlap; a weighted average of viewed vectors represents the user's current taste.**

## Project structure

```text
ecommerce-recommender/
├── client/                  React, Router, Axios, Chart.js, responsive CSS
├── server/
│   ├── controllers/         HTTP behavior and response hydration
│   ├── middleware/          Central 404 and error handling
│   ├── models/              Product, Interaction, RecommendationLog
│   ├── routes/              Express route definitions
│   ├── seed/seed.js         Idempotent product import
│   └── services/            FastAPI client
├── ml-service/
│   ├── data/products.json   48-product, 10-collection Indian catalog
│   ├── recommender.py       TF-IDF model and ranking logic
│   ├── evaluate.py          Five-product qualitative evaluation
│   └── app.py               FastAPI application
└── docs/                    Postman collection
```

## Prerequisites

- Node.js 18 or newer
- Python 3.10 or newer
- MongoDB running locally, or a MongoDB Atlas connection string

## Local setup

Run each service in its own terminal.

### 1. MongoDB seed and Express API — port 5000

```bash
cd server
npm install
cp .env.example .env
npm run seed
npm run dev
```

`server/.env`:

```dotenv
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce_recommender
ML_SERVICE_URL=http://127.0.0.1:8000
CLIENT_URL=http://localhost:5173
```

### 2. FastAPI ML service — port 8000

```bash
cd ml-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Run the qualitative recommendation check:

```bash
python evaluate.py
```

Interactive API docs are available at `http://localhost:8000/docs`.

### 3. React client — port 5173

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

`client/.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

Open `http://localhost:5173`.

## REST API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Express health check |
| GET | `/api/products?category=&search=` | List and filter products |
| GET | `/api/products/:id` | Fetch one product |
| GET | `/api/products/:id/similar?limit=4` | Hydrated similar products |
| POST | `/api/interactions` | Record `{ userId, productId, type }` |
| GET | `/api/interactions/:userId` | Hydrated activity and recommendation logs |
| GET | `/api/recommendations/:userId?limit=8` | Personalized or cold-start recommendations |
| POST | `/api/recommendations/idea` | Match products to a natural-language room, routine, or goal |
| GET | `/health` on port 8000 | ML health and loaded-product count |
| GET | `/similar/:productId?limit=5` on port 8000 | Direct content similarity |
| POST | `/recommend` on port 8000 | Rank against ordered viewing history |
| POST | `/recommend/idea` on port 8000 | Rank products against free-text intent |

Import [the Postman collection](docs/ecommerce-recommender.postman_collection.json) to exercise every endpoint.

When FastAPI is down, Express returns HTTP `503` with a clear message and usable fallback products in the same response. The frontend recognizes that response and continues rendering the fallback selection.

## Screenshots

Capture the running application for a portfolio README at these three breakpoints:

- Home and recommendation shelf — desktop
- Product detail and similar products — tablet
- Activity dashboard and category chart — mobile

## Deployment

### Client on Vercel

1. Import the repository and set the root directory to `client`.
2. Use build command `npm run build` and output directory `dist`.
3. Set `VITE_API_BASE_URL=https://YOUR-API.onrender.com/api`.
4. Add a Vercel SPA rewrite from `/(.*)` to `/index.html` if framework detection does not create one automatically.

### Express API on Render

1. Create a Web Service with root directory `server`.
2. Build command: `npm install`.
3. Start command: `npm start`.
4. Set `MONGO_URI`, `ML_SERVICE_URL=https://YOUR-ML-SERVICE.onrender.com`, and `CLIENT_URL=https://YOUR-CLIENT.vercel.app`.
5. Run `npm run seed` once against the production database.

### FastAPI on Render

1. Create a Python Web Service with root directory `ml-service`.
2. Build command: `pip install -r requirements.txt`.
3. Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`.
4. The service is stateless and needs no database variables.

For multiple allowed frontend origins, provide a comma-separated `CLIENT_URL` value to Express. Replace wildcard FastAPI CORS with the deployed API origin if the ML service is later exposed to browsers directly; in this architecture only Express calls it.

## Future improvements

- Persist product popularity signals for stronger cold-start ranking.
- Add interaction weights such as dwell time or favorites while keeping explanations.
- Blend content similarity with collaborative signals once enough users exist.
- Add automated API, component, and ranking-quality tests.
- Move catalog vector construction to startup lifecycle hooks for larger catalogs.
