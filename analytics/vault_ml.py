"""Train storage-size models from VaultX MongoDB file metadata.

No file contents, passwords, card details, or cloud URLs are loaded.
"""

import argparse
import json
import os
import re
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

from joblib import dump
from pymongo import ASCENDING, DESCENDING, MongoClient, UpdateOne
from sklearn.feature_extraction import DictVectorizer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


ROOT = Path(__file__).resolve().parent
THRESHOLD_MB = 5.0
FEATURES = ["mime", "extension", "name_length"]
MIME_SIZES = {
    "application/pdf": (2.5, 1.2),
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (1.4, 0.7),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": (3.6, 1.7),
    "image/jpeg": (4.8, 2.0),
    "image/png": (7.2, 2.8),
    "audio/mpeg": (9.5, 3.5),
}
EXTENSIONS = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "image/jpeg": "jpg",
    "image/png": "png",
    "audio/mpeg": "mp3",
}


def demo_documents(count=600, seed=42):
    """Deterministic, clearly synthetic metadata for a reproducible classroom demo."""
    import random

    rng = random.Random(seed)
    mime_types = list(MIME_SIZES)
    now = datetime(2026, 1, 1, tzinfo=timezone.utc)
    docs = []
    for i in range(count):
        mime = mime_types[i % len(mime_types)]
        mean, spread = MIME_SIZES[mime]
        size_mb = max(0.05, rng.gauss(mean, spread))
        extension = EXTENSIONS[mime]
        docs.append({
            "demoId": f"vaultx-demo-{seed}-{i:04d}",
            "fileName": f"sample_{i:04d}.{extension}",
            "fileType": mime,
            "sizeBytes": round(size_mb * 1024 * 1024),
            "isFolder": False,
            "createdAt": now + timedelta(hours=i),
        })
    return docs


def parse_size_mb(document):
    value = document.get("sizeBytes")
    if isinstance(value, (int, float)) and not isinstance(value, bool) and value >= 0:
        return value / (1024 * 1024)
    legacy = document.get("fileSize")
    if isinstance(legacy, str):
        match = re.fullmatch(r"\s*(\d+(?:\.\d+)?)\s*(MB|KB|GB)?\s*", legacy, re.I)
        if match:
            amount = float(match.group(1))
            unit = (match.group(2) or "MB").upper()
            return amount * {"KB": 1 / 1024, "MB": 1, "GB": 1024}[unit]
    return None


def prepare_rows(documents):
    rows, sizes = [], []
    skipped = 0
    for document in documents:
        if document.get("isFolder"):
            skipped += 1
            continue
        size_mb = parse_size_mb(document)
        if size_mb is None or size_mb <= 0:
            skipped += 1
            continue
        name = str(document.get("fileName") or "")
        mime = str(document.get("fileType") or "unknown").lower().strip()
        extension = name.rsplit(".", 1)[-1].lower() if "." in name else "unknown"
        rows.append({"mime": mime, "extension": extension, "name_length": len(name)})
        sizes.append(size_mb)
    return rows, sizes, skipped


def make_pipeline(model):
    return Pipeline([("preprocess", DictVectorizer()), ("model", model)])


def evaluate(documents, source, seed=42):
    rows, sizes, skipped = prepare_rows(documents)
    if len(rows) < 40:
        raise ValueError(f"Need at least 40 usable files; found {len(rows)} (skipped {skipped}).")
    labels = [int(size >= THRESHOLD_MB) for size in sizes]
    if min(Counter(labels).values()) < 5:
        raise ValueError("Need at least 5 files in each size class (below/at least 5 MB).")
    indexes = list(range(len(rows)))
    train_idx, test_idx = train_test_split(
        indexes, test_size=0.25, random_state=seed, stratify=labels
    )
    x_train = [rows[i] for i in train_idx]
    x_test = [rows[i] for i in test_idx]
    y_train_size = [sizes[i] for i in train_idx]
    y_test_size = [sizes[i] for i in test_idx]
    y_train_class = [labels[i] for i in train_idx]
    y_test_class = [labels[i] for i in test_idx]

    regressor = make_pipeline(RandomForestRegressor(
        n_estimators=150, max_depth=8, min_samples_leaf=3, random_state=seed, n_jobs=-1
    ))
    classifier = make_pipeline(RandomForestClassifier(
        n_estimators=150, max_depth=8, min_samples_leaf=3, random_state=seed, n_jobs=-1,
        class_weight="balanced"
    ))
    regressor.fit(x_train, y_train_size)
    classifier.fit(x_train, y_train_class)
    size_predictions = regressor.predict(x_test)
    class_predictions = classifier.predict(x_test)
    metrics = {
        "source": source,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "recordCount": len(rows),
        "skippedCount": skipped,
        "trainCount": len(train_idx),
        "testCount": len(test_idx),
        "largeFileThresholdMB": THRESHOLD_MB,
        "classCounts": {"small": labels.count(0), "large": labels.count(1)},
        "features": FEATURES,
        "regression": {
            "model": "RandomForestRegressor",
            "r2": round(float(r2_score(y_test_size, size_predictions)), 4),
            "maeMB": round(float(mean_absolute_error(y_test_size, size_predictions)), 4),
        },
        "classification": {
            "model": "RandomForestClassifier",
            "accuracy": round(float(accuracy_score(y_test_class, class_predictions)), 4),
            "precision": round(float(precision_score(y_test_class, class_predictions, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test_class, class_predictions, zero_division=0)), 4),
            "f1": round(float(f1_score(y_test_class, class_predictions, zero_division=0)), 4),
        },
    }
    return metrics, regressor, classifier


def connect(args):
    uri = args.mongo_uri or os.environ.get("MONGO_URI")
    if not uri:
        raise ValueError("Set MONGO_URI or pass --mongo-uri for MongoDB commands.")
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    database = client[args.database] if args.database else client.get_default_database()
    return client, database


def ensure_indexes(database):
    database.files.create_index([("user", ASCENDING), ("parentId", ASCENDING), ("createdAt", DESCENDING)])
    database.activities.create_index([("user", ASCENDING), ("createdAt", DESCENDING)])
    database.ml_demo_files.create_index("demoId", unique=True)
    database.ml_model_runs.create_index([("createdAt", DESCENDING)])


def mongo_summary(database, collection_name):
    """Show server-side MongoDB aggregation over exact byte sizes."""
    pipeline = [
        {"$match": {"isFolder": False, "sizeBytes": {"$type": "number"}}},
        {"$group": {
            "_id": {"$ifNull": ["$fileType", "unknown"]},
            "fileCount": {"$sum": 1},
            "totalBytes": {"$sum": "$sizeBytes"},
            "averageBytes": {"$avg": "$sizeBytes"},
        }},
        {"$sort": {"fileCount": -1}},
    ]
    return list(database[collection_name].aggregate(pipeline))


def save_local(metrics, regressor, classifier, output_dir):
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "metrics.json").write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    dump(regressor, output_dir / "size_regressor.joblib")
    dump(classifier, output_dir / "large_file_classifier.joblib")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["init-db", "seed-demo", "summary", "train"])
    parser.add_argument("--source", choices=["vault", "demo", "generated"], default="vault")
    parser.add_argument("--mongo-uri", help="MongoDB URI; prefer MONGO_URI environment variable")
    parser.add_argument("--database", help="Database name; defaults to the database in URI")
    parser.add_argument("--count", type=int, default=600, help="Demo document count")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output-dir", type=Path, default=ROOT / "results")
    args = parser.parse_args()

    if args.command == "train" and args.source == "generated":
        metrics, regressor, classifier = evaluate(demo_documents(args.count, args.seed), "generated-demo", args.seed)
        save_local(metrics, regressor, classifier, args.output_dir)
        print(json.dumps(metrics, indent=2))
        return

    client, database = connect(args)
    try:
        if args.command == "init-db":
            ensure_indexes(database)
            print("MongoDB indexes created.")
        elif args.command == "seed-demo":
            ensure_indexes(database)
            operations = [UpdateOne({"demoId": doc["demoId"]}, {"$set": doc}, upsert=True)
                          for doc in demo_documents(args.count, args.seed)]
            result = database.ml_demo_files.bulk_write(operations, ordered=False)
            print(f"Demo metadata ready: inserted {result.upserted_count}, updated {result.modified_count}.")
        elif args.command == "summary":
            name = "ml_demo_files" if args.source == "demo" else "files"
            print(json.dumps(mongo_summary(database, name), indent=2, default=str))
        elif args.command == "train":
            name = "ml_demo_files" if args.source == "demo" else "files"
            projection = {"fileName": 1, "fileType": 1, "fileSize": 1, "sizeBytes": 1, "isFolder": 1}
            documents = list(database[name].find({}, projection))
            metrics, regressor, classifier = evaluate(documents, args.source, args.seed)
            save_local(metrics, regressor, classifier, args.output_dir)
            database.ml_model_runs.insert_one({"createdAt": datetime.now(timezone.utc), **metrics})
            print(json.dumps(metrics, indent=2))
    finally:
        client.close()


if __name__ == "__main__":
    main()
