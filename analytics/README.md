# VaultX MongoDB analytics

Run `python vault_ml.py --help` for command options. See the repository README for setup and `reports/MONGODB_PROJECT_REPORT.md` for the methodology and results.

Collections used:

- `files`: the existing Mongoose collection; PyMongo reads metadata and indexes it.
- `activities`: the existing activity collection; PyMongo creates a user/date index.
- `ml_demo_files`: synthetic demo records, upserted by `demoId` so reseeding is safe.
- `ml_model_runs`: evaluation results, inserted after MongoDB-backed training.

The models never need Cloudinary URLs or user secrets. Actual vault data must have enough examples in both size classes for a meaningful train/test split. Include the database name in `MONGO_URI`, or pass `--database NAME`. Run `python vault_ml.py check` for a read-only connection and data-readiness check before training.

For tests, install `requirements-dev.txt` and run `python -m unittest discover -s analytics -v` from the repository root. The database-facing tests use `mongomock`. A live check on 18 October 2026 reached the configured Atlas `test` database and local `vaultDB`; the live vault has too few usable files for model evaluation.

## Smart Vault models on real data

The upload dialog recommends a category from clear filename words and lets the user accept or correct it. Files with no clear hint can upload without a category. Once a real-data classifier is trained, the training command exports its trees to `ml_category_models`, and the upload dialog uses that model for suggestions. The storage page records one real usage snapshot per account per day when opened and lets a user label older files. Categories are Academic, Finance, Personal, and Other. The backend stores accepted labels in `files.category` and daily totals in `storage_snapshots`.

With `MONGO_URI` set to the same database as the API, run:

```powershell
python smart_insights.py check
python smart_insights.py train-category
python smart_insights.py train-forecast
```

`train-category` uses only confirmed labels from real `files` records. It requires at least 30 labeled files, two used categories, and five files per used category. It reports accuracy and macro precision, recall, and F1 on a held-out test split. `train-forecast` uses actual `storage_snapshots` pairs exactly 30 days apart. It needs at least 40 pairs, holds out the latest 20% by date, and reports R² and MAE alongside a no-growth baseline MAE. A forecast is withheld if R² is not positive or MAE is no better than the baseline. Successful runs save Joblib models in `analytics/results/`, metrics in `ml_model_runs`, and predictions in `ml_predictions`. The dashboard shows a forecast or category suggestion only after a successful real-data run.

On 6 November 2026, a read-only Atlas check found 11 real file records, zero confirmed category labels, and zero storage snapshots. Both training commands correctly reported insufficient data. No real-data model score or prediction is claimed yet. Storage history starts accumulating when users open the updated storage page after deployment. A 30-day forecast requires at least 30 days of subsequent history and enough examples across users.
