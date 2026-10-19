# VaultX - Digital Document Vault

VaultX is a full-stack document manager built with React/Vite, Express, MongoDB, and Cloudinary. This repository also includes a **PyMongo and machine-learning analytics module** for a MongoDB course project.

The dashboard has Drive-style My Drive, Starred, Recent, and Trash views. It supports nested folders with breadcrumbs, grid and list layouts, search, file-type filters, multi-file upload with progress, selection and select all, rename, move, download, details, right-click actions, and dragging an item onto a folder. My Drive also shows quick access and storage information. The navigation adapts to mobile screens. Trash supports restore and permanent deletion. Deleting from My Drive first moves items to Trash; items in Trash continue to use storage until permanently deleted.

## Project structure

| Folder | Purpose |
| --- | --- |
| `frontend/` | React interface for accounts, file management, storage, and activity |
| `backend/` | Express API, Mongoose models, authentication, and Cloudinary upload |
| `analytics/` | PyMongo indexes, aggregation, demo data, and ML training/evaluation |
| `reports/` | MongoDB project report and evaluation notes |

## Run the application

Use Node.js 20+ and a MongoDB database. Create `backend/.env` with `PORT`, `JWT_SECRET`, `MONGO_URI_LOCAL` or `MONGO_URI_ATLAS`, and the three `CLOUDINARY_*` variables used in `backend/config/cloudinaryConfig.js`. Include the database name in the MongoDB URI path (for example, `/vaultDB`) so the API and PyMongo use the same database. Create `frontend/.env` with `VITE_API_URL=http://localhost:5000`. Keep credentials out of Git. When both MongoDB URI variables are set, the API uses Atlas.

```powershell
cd backend
npm install
node server.js
```

Run backend route checks with `npm test` from `backend/`.

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:3000`). The API health route is `/api/auth/health`.

For Vercel hosting, both the repository root and `frontend/` include SPA rewrites so refreshing a client route such as `/dashboard/documents` serves the React app. Deploy the frontend with `frontend/dist` as the output. The browser removes an expired eight-hour login token and returns the user to sign-in.

Storage management shows actual file usage, including Trash, and supports upgrade requests stored in MongoDB. Requests require manual review; there is no payment processor or automatic tier activation. New accounts start on Personal (1 GB), and signup does not collect card details. The legacy `/api/auth/upgrade-plan` endpoint rejects direct tier changes.

## Run the MongoDB and ML project

The Python module reads **metadata only**: filename, MIME type, size, and folder status. It does not read document contents or account/payment fields. The regression model estimates file size in MB; the classification model predicts whether a file is at least 5 MB. Models use file type, extension, and filename length, with a fixed 75/25 stratified split.

```powershell
cd analytics
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
$env:MONGO_URI = 'mongodb://localhost:27017/vaultx'
.venv\Scripts\python vault_ml.py init-db
.venv\Scripts\python vault_ml.py check
.venv\Scripts\python vault_ml.py seed-demo
.venv\Scripts\python vault_ml.py summary --source demo
.venv\Scripts\python vault_ml.py train --source demo
```

Use `train --source vault` to evaluate actual vault metadata after it contains at least 40 valid files and at least five files in each size class. The `generated` source runs without a database for reproducibility checks:

```powershell
.venv\Scripts\python vault_ml.py train --source generated
```

The demo generator creates synthetic records in `ml_demo_files`; it never changes the application's `files` collection. `init-db` creates compound indexes on `files` and `activities` plus analytics indexes. `summary` uses a MongoDB aggregation pipeline. Training results are written to `analytics/results/metrics.json`; Mongo-backed runs are also stored in `ml_model_runs`.

`check` is read-only: it pings MongoDB and reports the selected database, usable file count, size-class counts, and whether real-data training is possible. On 18 October 2026, live checks connected to both Atlas (`test`: 15 file records, 10 usable, 9 small and 1 large) and local MongoDB (`vaultDB`: empty). The Atlas dataset does not yet meet the minimum of 40 usable records and five in each class.

The [project report](reports/MONGODB_PROJECT_REPORT.md) explains the dataset, MongoDB/PyMongo code, preprocessing, models, and all required evaluation metrics. Its initial numbers use the generated demo dataset and are not evidence of performance on real uploads.

## Current limitations

This is a course prototype, not a production secure vault. Password reset, payment handling, access control, and file action issues identified in the code need separate remediation before real users or real payment details are accepted. The ML results are exploratory metadata predictions, not a security or storage quota decision engine.
