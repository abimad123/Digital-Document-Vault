# VaultX - Digital Document Vault

VaultX is a full-stack document manager built with React/Vite, Express, MongoDB, and Cloudinary. This repository also includes a **PyMongo and machine-learning analytics module** for a MongoDB course project.

## Project structure

| Folder | Purpose |
| --- | --- |
| `frontend/` | React interface for accounts, file management, storage, and activity |
| `backend/` | Express API, Mongoose models, authentication, and Cloudinary upload |
| `analytics/` | PyMongo indexes, aggregation, demo data, and ML training/evaluation |
| `reports/` | MongoDB project report and evaluation notes |

## Run the application

Use Node.js 20+ and a MongoDB database. Create `backend/.env` with `PORT`, `JWT_SECRET`, `MONGO_URI_LOCAL` or `MONGO_URI_ATLAS`, and the three `CLOUDINARY_*` variables used in `backend/config/cloudinaryConfig.js`. Create `frontend/.env` with `VITE_API_URL=http://localhost:5000`. Keep credentials out of Git.

```powershell
cd backend
npm install
node server.js
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:3000`). The API health route is `/api/auth/health`.

## Run the MongoDB and ML project

The Python module reads **metadata only**: filename, MIME type, size, and folder status. It does not read document contents or account/payment fields. The regression model estimates file size in MB; the classification model predicts whether a file is at least 5 MB. Models use file type, extension, and filename length, with a fixed 75/25 stratified split.

```powershell
cd analytics
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
$env:MONGO_URI = 'mongodb://localhost:27017/vaultx'
.venv\Scripts\python vault_ml.py init-db
.venv\Scripts\python vault_ml.py seed-demo
.venv\Scripts\python vault_ml.py summary --source demo
.venv\Scripts\python vault_ml.py train --source demo
```

Use `train --source vault` to evaluate actual vault metadata after it contains at least 40 valid files and at least five files in each size class. The `generated` source runs without a database for reproducibility checks:

```powershell
.venv\Scripts\python vault_ml.py train --source generated
```

The demo generator creates synthetic records in `ml_demo_files`; it never changes the application's `files` collection. `init-db` creates compound indexes on `files` and `activities` plus analytics indexes. `summary` uses a MongoDB aggregation pipeline. Training results are written to `analytics/results/metrics.json`; Mongo-backed runs are also stored in `ml_model_runs`.

The [project report](reports/MONGODB_PROJECT_REPORT.md) explains the dataset, MongoDB/PyMongo code, preprocessing, models, and all required evaluation metrics. Its initial numbers use the generated demo dataset and are not evidence of performance on real uploads.

## Current limitations

This is a course prototype, not a production secure vault. Password reset, payment handling, access control, and file action issues identified in the code need separate remediation before real users or real payment details are accepted. The ML results are exploratory metadata predictions, not a security or storage quota decision engine.
