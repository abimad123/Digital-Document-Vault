# Project report

`MONGODB_PROJECT_REPORT.md` is the editable source. The checked PDF is at `output/pdf/VaultX_MongoDB_Project_Report.pdf`.

After updating the Markdown source, install `reports/requirements.txt` and run from the repository root:

```powershell
python reports/build_report.py
```

If you retrain the models on actual vault data, replace the demo evaluation table with the new `analytics/results/metrics.json` values and label the source and record counts correctly before rebuilding the PDF.
