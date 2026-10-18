# VaultX MongoDB analytics

Run `python vault_ml.py --help` for command options. See the repository README for setup and `reports/MONGODB_PROJECT_REPORT.md` for the methodology and results.

Collections used:

- `files`: the existing Mongoose collection; PyMongo reads metadata and indexes it.
- `activities`: the existing activity collection; PyMongo creates a user/date index.
- `ml_demo_files`: synthetic demo records, upserted by `demoId` so reseeding is safe.
- `ml_model_runs`: evaluation results, inserted after MongoDB-backed training.

The models never need Cloudinary URLs or user secrets. Actual vault data must have enough examples in both size classes for a meaningful train/test split. Use `--database NAME` if your MongoDB URI does not include a database name.

For tests, install `requirements-dev.txt` and run `python -m unittest discover -s analytics -v` from the repository root. The database-facing test uses `mongomock`; a live MongoDB connection is still needed to validate deployment.
