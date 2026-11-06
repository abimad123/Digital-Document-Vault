"""Train useful VaultX models only from labeled, real MongoDB records.

This command never reads document contents or the synthetic ml_demo_files collection.
"""
import argparse
import json
import os
import re
from datetime import date, timedelta, datetime, timezone
from pathlib import Path

from joblib import dump
from pymongo import MongoClient
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.feature_extraction import DictVectorizer
from sklearn.metrics import accuracy_score, f1_score, mean_absolute_error, precision_score, r2_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

CATEGORIES = ('Academic', 'Finance', 'Personal', 'Other')
ROOT = Path(__file__).resolve().parent

def category_features(file):
    name = str(file.get('fileName') or '').lower()
    words = re.findall(r'[a-z]{3,}', name.rsplit('.', 1)[0])
    features = {'mime=' + str(file.get('fileType') or 'unknown').lower(): 1,
                'extension=' + (name.rsplit('.', 1)[-1] if '.' in name else 'none'): 1}
    for word in set(words):
        features['word=' + word] = 1
    return features

def train_categories(db, output):
    files = list(db.files.find({'isFolder': False}, {'user': 1, 'fileName': 1, 'fileType': 1, 'category': 1}))
    labeled = [f for f in files if f.get('category') in CATEGORIES]
    counts = {c: sum(f['category'] == c for f in labeled) for c in CATEGORIES}
    active = {c: n for c, n in counts.items() if n}
    if len(labeled) < 30 or len(active) < 2 or min(active.values()) < 5:
        return {'status': 'insufficient_real_labels', 'labeledFiles': len(labeled), 'categoryCounts': counts,
                'required': 'At least 30 confirmed real files, two categories, and five files per used category.'}
    x = [category_features(f) for f in labeled]
    y = [f['category'] for f in labeled]
    train, test = train_test_split(list(range(len(y))), test_size=.25, random_state=42, stratify=y)
    model = Pipeline([('features', DictVectorizer()), ('forest', RandomForestClassifier(
        n_estimators=150, min_samples_leaf=2, class_weight='balanced', random_state=42))])
    model.fit([x[i] for i in train], [y[i] for i in train])
    actual = [y[i] for i in test]
    predicted = model.predict([x[i] for i in test])
    metrics = {'accuracy': round(accuracy_score(actual, predicted), 4),
               'precisionMacro': round(precision_score(actual, predicted, average='macro', zero_division=0), 4),
               'recallMacro': round(recall_score(actual, predicted, average='macro', zero_division=0), 4),
               'f1Macro': round(f1_score(actual, predicted, average='macro', zero_division=0), 4)}
    run = db.ml_model_runs.insert_one({'task': 'category_suggestion', 'source': 'vault',
        'createdAt': datetime.now(timezone.utc), 'trainCount': len(train), 'testCount': len(test),
        'categoryCounts': counts, 'metrics': metrics})
    output.mkdir(parents=True, exist_ok=True)
    dump(model, output / 'category_classifier.joblib')
    unlabeled = [f for f in files if f.get('category') not in CATEGORIES]
    if unlabeled:
        features = [category_features(f) for f in unlabeled]
        classes = model.named_steps['forest'].classes_
        probabilities = model.predict_proba(features)
        for file, probs in zip(unlabeled, probabilities):
            best = int(probs.argmax())
            db.ml_predictions.update_one({'task': 'category_suggestion', 'fileId': file['_id']},
                {'$set': {'user': file['user'], 'category': str(classes[best]),
                          'confidence': round(float(probs[best]), 3), 'runId': str(run.inserted_id),
                          'createdAt': datetime.now(timezone.utc)}}, upsert=True)
    return {'status': 'trained', 'source': 'vault', 'labeledFiles': len(labeled),
            'trainCount': len(train), 'testCount': len(test), 'metrics': metrics,
            'suggestedFiles': len(unlabeled)}

def forecast_rows(snapshots):
    by_user = {}
    for item in snapshots:
        by_user.setdefault(str(item['user']), {})[date.fromisoformat(item['day'])] = item
    rows = []
    for user, days in by_user.items():
        for day, item in days.items():
            future = days.get(day + timedelta(days=30))
            if not future:
                continue
            prev = days.get(day - timedelta(days=7))
            features = {'usedBytes': item['usedBytes'], 'fileCount': item['fileCount'],
                        'growth7dBytes': item['usedBytes'] - prev['usedBytes'] if prev else 0}
            rows.append((day, user, features, future['usedBytes']))
    return sorted(rows, key=lambda row: row[0]), by_user

def train_forecast(db, output):
    snapshots = list(db.storage_snapshots.find({}, {'user': 1, 'day': 1, 'usedBytes': 1, 'fileCount': 1}))
    rows, by_user = forecast_rows(snapshots)
    if len(rows) < 40:
        return {'status': 'insufficient_real_history', 'snapshots': len(snapshots), 'trainingExamples': len(rows),
                'required': 'At least 40 actual snapshot pairs exactly 30 days apart.'}
    split = max(1, int(len(rows) * .8))
    train, test = rows[:split], rows[split:]
    model = Pipeline([('features', DictVectorizer()), ('forest', RandomForestRegressor(
        n_estimators=150, min_samples_leaf=3, random_state=42))])
    model.fit([r[2] for r in train], [r[3] for r in train])
    actual = [r[3] for r in test]
    predicted = model.predict([r[2] for r in test])
    metrics = {'maeMB': round(mean_absolute_error(actual, predicted) / 1048576, 4),
               'baselineMAEMB': round(mean_absolute_error(actual, [r[2]['usedBytes'] for r in test]) / 1048576, 4),
               'r2': round(r2_score(actual, predicted), 4)}
    if metrics['r2'] <= 0 or metrics['maeMB'] >= metrics['baselineMAEMB']:
        return {'status': 'model_below_baseline', 'source': 'vault', 'snapshots': len(snapshots),
                'trainCount': len(train), 'testCount': len(test), 'metrics': metrics,
                'message': 'Forecast withheld because held-out performance is not yet useful.'}
    run = db.ml_model_runs.insert_one({'task': 'storage_forecast', 'source': 'vault',
        'createdAt': datetime.now(timezone.utc), 'trainCount': len(train), 'testCount': len(test),
        'metrics': metrics})
    output.mkdir(parents=True, exist_ok=True)
    dump(model, output / 'storage_forecast_regressor.joblib')
    for user, days in by_user.items():
        day = max(days)
        item = days[day]
        prev = days.get(day - timedelta(days=7))
        features = {'usedBytes': item['usedBytes'], 'fileCount': item['fileCount'],
                    'growth7dBytes': item['usedBytes'] - prev['usedBytes'] if prev else 0}
        estimate = max(0, round(float(model.predict([features])[0])))
        db.ml_predictions.update_one({'task': 'storage_forecast', 'user': item['user']},
            {'$set': {'predictedBytes': estimate, 'asOf': day.isoformat(),
                      'runId': str(run.inserted_id), 'createdAt': datetime.now(timezone.utc)}}, upsert=True)
    return {'status': 'trained', 'source': 'vault', 'snapshots': len(snapshots),
            'trainCount': len(train), 'testCount': len(test), 'metrics': metrics}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['check', 'train-category', 'train-forecast'])
    parser.add_argument('--mongo-uri', default=os.environ.get('MONGO_URI'))
    parser.add_argument('--database')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'results')
    args = parser.parse_args()
    if not args.mongo_uri:
        parser.error('Set MONGO_URI or pass --mongo-uri.')
    with MongoClient(args.mongo_uri, serverSelectionTimeoutMS=5000) as client:
        client.admin.command('ping')
        db = client[args.database] if args.database else client.get_default_database()
        if args.command == 'check':
            result = {'database': db.name, 'realFiles': db.files.count_documents({'isFolder': False}),
                      'labeledFiles': db.files.count_documents({'isFolder': False, 'category': {'$in': CATEGORIES}}),
                      'storageSnapshots': db.storage_snapshots.count_documents({})}
        elif args.command == 'train-category':
            result = train_categories(db, args.output_dir)
        else:
            result = train_forecast(db, args.output_dir)
        print(json.dumps(result, indent=2, default=str))

if __name__ == '__main__':
    main()
