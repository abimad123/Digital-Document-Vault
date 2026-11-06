"""Reproducible synthetic classroom demo for the real-data forecast pipeline.

This script does not read or write MongoDB. It never creates user history.
The output is visibly labeled as synthetic in the storage UI.
"""
import json
import random
from datetime import date, timedelta
from pathlib import Path

from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction import DictVectorizer
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline

from smart_insights import forecast_rows

MB = 1024 * 1024
SEED = 42
END_DAY = date(2026, 11, 6)
OUTPUT = Path(__file__).resolve().parents[1] / 'frontend' / 'src' / 'data' / 'forecastClassroomDemo.json'


def sample_history():
    rng = random.Random(SEED)
    records = []
    for user_number in range(36):
        start_mb = rng.uniform(40, 480)
        daily_growth_mb = rng.uniform(0.3, 3.2)
        for day_number in range(76):
            day = END_DAY - timedelta(days=75 - day_number)
            weekly_variation = (day_number % 7) * 0.06
            used_mb = start_mb + day_number * daily_growth_mb + weekly_variation
            records.append({
                'user': f'synthetic-user-{user_number:02d}',
                'day': day.isoformat(),
                'usedBytes': round(used_mb * MB),
                'fileCount': round(8 + day_number * daily_growth_mb / 3),
            })
    return records


def build_demo():
    records = sample_history()
    rows, by_user = forecast_rows(records)
    split = int(len(rows) * 0.8)
    train, test = rows[:split], rows[split:]
    model = Pipeline([
        ('features', DictVectorizer()),
        ('forest', RandomForestRegressor(n_estimators=150, min_samples_leaf=3, random_state=SEED)),
    ])
    model.fit([row[2] for row in train], [row[3] for row in train])
    actual = [row[3] for row in test]
    predicted = model.predict([row[2] for row in test])
    mae_mb = mean_absolute_error(actual, predicted) / MB
    baseline_mae_mb = mean_absolute_error(actual, [row[2]['usedBytes'] for row in test]) / MB
    r2 = r2_score(actual, predicted)
    user = 'synthetic-user-00'
    latest = max(by_user[user])
    current = by_user[user][latest]
    week_ago = by_user[user][latest - timedelta(days=7)]
    features = {
        'usedBytes': current['usedBytes'],
        'fileCount': current['fileCount'],
        'growth7dBytes': current['usedBytes'] - week_ago['usedBytes'],
    }
    return {
        'source': 'synthetic_classroom_demo',
        'randomSeed': SEED,
        'model': 'RandomForestRegressor',
        'sampleAccounts': 36,
        'daysPerAccount': 76,
        'trainingExamples': len(train),
        'testExamples': len(test),
        'r2': round(r2, 4),
        'maeMB': round(mae_mb, 2),
        'baselineMAEMB': round(baseline_mae_mb, 2),
        'asOf': latest.isoformat(),
        'forecastFor': (latest + timedelta(days=30)).isoformat(),
        'currentMB': round(current['usedBytes'] / MB, 1),
        'predictedMB': round(float(model.predict([features])[0]) / MB, 1),
        'passesQualityGate': r2 > 0 and mae_mb < baseline_mae_mb,
    }


if __name__ == '__main__':
    result = build_demo()
    if not result['passesQualityGate']:
        raise SystemExit('Demo model failed its quality gate; no forecast exported.')
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result, indent=2))
