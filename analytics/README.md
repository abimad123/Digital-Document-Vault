# VaultX MongoDB analytics

Run `python vault_ml.py --help` for command options. See the repository README for setup and `reports/MONGODB_PROJECT_REPORT.md` for the methodology and results.

Collections used:

- `files`: the existing Mongoose collection; PyMongo reads metadata and indexes it.
- `activities`: the existing activity collection; PyMongo creates a user/date index.
- `ml_demo_files`: synthetic demo records, upserted by `demoId` so reseeding is safe.
- `ml_model_runs`: evaluation results, inserted after MongoDB-backed training.

The models never need Cloudinary URLs or user secrets. Actual vault data must have enough examples in both size classes for a meaningful train/test split. Include the database name in `MONGO_URI`, or pass `--database NAME`. Run `python vault_ml.py check` for a read-only connection and data-readiness check before training.

For tests, install `requirements-dev.txt` and run `python -m unittest discover -s analytics -v` from the repository root. The database-facing tests use `mongomock`. A live check on 18 October 2026 reached the configured Atlas `test` database and local `vaultDB`; the live vault has too few usable files for model evaluation.
