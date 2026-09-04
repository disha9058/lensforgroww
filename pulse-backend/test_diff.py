# test_diff.py
from diff_engine import get_baseline_stats, compute_zscore, classify_event, generate_reason

for ticker in ["AAPL", "TSLA", "RELIANCE.NS"]:
    baseline = get_baseline_stats(ticker)
    # use your latest live price from price_snapshots — for now hardcode from your Supabase table
    current_price = baseline["last_close"] * 1.02  # fake a 2% move to test
    z = compute_zscore(current_price, baseline)
    severity, vol_ratio = classify_event(z, baseline["avg_volume"], baseline["avg_volume"])
    print(generate_reason(ticker, z, vol_ratio), "-", severity)