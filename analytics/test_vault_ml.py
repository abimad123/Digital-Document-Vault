import unittest

import mongomock

from vault_ml import demo_documents, ensure_indexes, evaluate, mongo_summary, parse_size_mb, prepare_rows


class VaultMLTests(unittest.TestCase):
    def test_size_parsing_and_folder_filter(self):
        docs = [
            {"fileName": "a.pdf", "fileType": "application/pdf", "sizeBytes": 1048576},
            {"fileName": "b.png", "fileType": "image/png", "fileSize": "2.50 MB"},
            {"fileName": "folder", "isFolder": True, "sizeBytes": 1048576},
            {"fileName": "bad", "fileSize": "unknown"},
        ]
        rows, sizes, skipped = prepare_rows(docs)
        self.assertEqual(len(rows), 2)
        self.assertEqual(sizes, [1.0, 2.5])
        self.assertEqual(skipped, 2)
        self.assertAlmostEqual(parse_size_mb({"fileSize": "1024 KB"}), 1.0)

    def test_demo_is_repeatable_and_models_report_all_metrics(self):
        docs = demo_documents(120, seed=42)
        self.assertEqual(docs, demo_documents(120, seed=42))
        metrics, _, _ = evaluate(docs, "generated-demo", seed=42)
        self.assertEqual(metrics["trainCount"] + metrics["testCount"], 120)
        self.assertEqual(set(metrics["regression"]), {"model", "r2", "maeMB"})
        self.assertEqual(
            set(metrics["classification"]),
            {"model", "accuracy", "precision", "recall", "f1"},
        )

    def test_pymongo_indexes_and_aggregation(self):
        database = mongomock.MongoClient().vaultx
        ensure_indexes(database)
        self.assertIn("demoId_1", database.ml_demo_files.index_information())
        database.ml_demo_files.insert_many([
            {"demoId": "1", "fileType": "application/pdf", "sizeBytes": 1024, "isFolder": False},
            {"demoId": "2", "fileType": "application/pdf", "sizeBytes": 2048, "isFolder": False},
            {"demoId": "3", "fileType": "image/png", "sizeBytes": 4096, "isFolder": False},
            {"demoId": "4", "fileType": "image/png", "isFolder": True},
        ])
        summary = mongo_summary(database, "ml_demo_files")
        by_type = {row["_id"]: row for row in summary}
        self.assertEqual(by_type["application/pdf"]["fileCount"], 2)
        self.assertEqual(by_type["application/pdf"]["totalBytes"], 3072)
        self.assertEqual(by_type["image/png"]["fileCount"], 1)


if __name__ == "__main__":
    unittest.main()
