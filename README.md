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



Listed directory Digital-Document-Vault
Listed directory backend
Listed directory analytics
Viewed requirements.txt:1-4
Viewed README.md:1-15
Viewed MONGODB_PROJECT_REPORT.md:1-83
Viewed vault_ml.py:1-120
Viewed vault_ml.py:121-281
Viewed server.js:1-52

### Project Overview: **VaultX (Digital Document Vault)**

**VaultX** is a full-stack cloud document management application designed to store, manage, and inspect user files, folders, and activity logs:
- **Frontend**: React + Vite (modern web dashboard).
- **Backend API**: Node.js + Express using **Mongoose** for operational CRUD (authentication, file metadata, folders, activity tracking).
- **File Storage**: Cloudinary for binary asset storage.
- **Database**: **MongoDB** (Atlas or local `vaultDB`).
- **Analytics & ML Subsystem**: Python (`scikit-learn`, `joblib`, and **PyMongo**).

---

### What is "pumongodb" (PyMongo)?

In this project, **"pumongodb"** refers to [**PyMongo**](file:///c:/Users/abiji/OneDrive/Desktop/lpu/Projects%20ALL/FULL%20stack/Digital-Document-Vault/analytics/requirements.txt) (`pymongo>=4.10,<5`), which is the **official Python driver for MongoDB**.

While the Node.js backend uses **Mongoose** to handle day-to-day web requests, the dedicated analytics module in [`analytics/vault_ml.py`](file:///c:/Users/abiji/OneDrive/Desktop/lpu/Projects%20ALL/FULL%20stack/Digital-Document-Vault/analytics/vault_ml.py) uses **PyMongo** to connect Python directly to the MongoDB database.

---

### Why PyMongo is Used in this Project

PyMongo serves as the bridge between **MongoDB's stored document metadata** and **Python's Data Science / Machine Learning pipeline**. Here is specifically why and how it is used:

#### 1. Direct Integration with Python Machine Learning (`scikit-learn`)
- The project trains two machine learning models:
  - **Random Forest Regressor**: Predicts document size in megabytes based on metadata (MIME type, file extension, filename length).
  - **Random Forest Classifier**: Classifies whether a document is a "large file" (≥ 5 MB).
- Instead of manually exporting data to CSVs or creating intermediate JSON files, **PyMongo** connects directly to MongoDB (`MongoClient`) and fetches records into memory for training.

#### 2. Selective & Secure Data Ingestion (Projections)
- In [`check_dataset()`](file:///c:/Users/abiji/OneDrive/Desktop/lpu/Projects%20ALL/FULL%20stack/Digital-Document-Vault/analytics/vault_ml.py#L188-L203) and [`train`](file:///c:/Users/abiji/OneDrive/Desktop/lpu/Projects%20ALL/FULL%20stack/Digital-Document-Vault/analytics/vault_ml.py#L267-L274):
  ```python
  projection = {"fileName": 1, "fileType": 1, "fileSize": 1, "sizeBytes": 1, "isFolder": 1}
  documents = list(database.files.find({}, projection))
  ```
- PyMongo allows querying **only non-sensitive metadata**, deliberately excluding user passwords, Cloudinary URLs, session tokens, and file binary contents.

#### 3. Native Server-Side Aggregation Pipelines
- In [`mongo_summary()`](file:///c:/Users/abiji/OneDrive/Desktop/lpu/Projects%20ALL/FULL%20stack/Digital-Document-Vault/analytics/vault_ml.py#L212-L225), PyMongo runs a server-side MongoDB aggregation pipeline:
  - `$match`: Filters for active files having numeric `sizeBytes`.
  - `$group`: Groups documents by MIME type to calculate total byte usage, average file sizes, and file counts.
  - `$sort`: Sorts file types by frequency.
- This offloads heavy statistical computation to the database engine rather than doing it in application memory.

#### 4. Automated Database Index Management
- Through [`ensure_indexes()`](file:///c:/Users/abiji/OneDrive/Desktop/lpu/Projects%20ALL/FULL%20stack/Digital-Document-Vault/analytics/vault_ml.py#L205-L210), PyMongo configures performance indexes directly:
  - `files`: Compound index on `(user, parentId, createdAt)` for fast folder and file hierarchy lookups.
  - `activities`: Compound index on `(user, createdAt)` for fast user history queries.
  - `ml_demo_files`: Unique index on `demoId`.
  - `ml_model_runs`: Descending index on `createdAt` for historical run tracking.

#### 5. Safe Bulk Upserts & Demo Isolation
- In [`seed-demo`](file:///c:/Users/abiji/OneDrive/Desktop/lpu/Projects%20ALL/FULL%20stack/Digital-Document-Vault/analytics/vault_ml.py#L258-L263), PyMongo's `bulk_write` with `UpdateOne(..., upsert=True)` is used to seed 600 synthetic metadata records into a separate `ml_demo_files` collection.
- This keeps experimental and classroom demo data completely isolated from real user vault documents.

#### 6. Persisting Model Runs and Audit Logs
- After training, PyMongo inserts evaluation metrics (R², MAE, Accuracy, Precision, Recall, F1 score, record counts) directly into the `ml_model_runs` collection:
  ```python
  database.ml_model_runs.insert_one({"createdAt": datetime.now(timezone.utc), **metrics})
  ```
- This maintains a persistent, queryable log of ML experiments inside the same database.

#### 7. Connection Validation & Health Checks
- In [`connect()`](file:///c:/Users/abiji/OneDrive/Desktop/lpu/Projects%20ALL/FULL%20stack/Digital-Document-Vault/analytics/vault_ml.py#L168-L186), PyMongo issues an administrative ping (`client.admin.command("ping")`) to verify the database URI and assess whether the dataset meets the minimum sample threshold (≥ 40 files, ≥ 5 files per class) before running models.

---

### Summary Table

| Layer | Technology | Primary Role |
| :--- | :--- | :--- |
| **Web Server (CRUD)** | Node.js + Express + **Mongoose** | User authentication, file upload/deletion API, folder management, UI requests |
| **Storage Engine** | **MongoDB** | Unified storage for users, files, folders, activities, demo files, and ML runs |
| **Analytics & ML** | Python + **PyMongo** | Direct database queries, indexing, bulk demo seeding, server-side aggregations, and ML model training/evaluation logging |