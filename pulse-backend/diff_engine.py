# diff_engine.py
import numpy as np
import yfinance as yf

def get_baseline_stats(ticker, days=30):
    """Pull recent daily history to compute this stock's normal volatility."""
    hist = yf.Ticker(ticker).history(period=f"{days}d", interval="1d")
    closes = hist["Close"].values
    volumes = hist["Volume"].values
    returns = np.diff(closes) / closes[:-1]
    return {
        "mean_return": returns.mean(),
        "std_return": returns.std(),
        "avg_volume": volumes.mean(),
        "last_close": closes[-1]
    }

def compute_zscore(current_price, baseline):
    latest_return = (current_price - baseline["last_close"]) / baseline["last_close"]
    if baseline["std_return"] == 0:
        return 0
    return (latest_return - baseline["mean_return"]) / baseline["std_return"]

def classify_event(zscore, volume, avg_volume):
    volume_ratio = volume / avg_volume if avg_volume else 1
    if abs(zscore) > 1.5 or volume_ratio > 2:
        severity = "significant"
    elif abs(zscore) > 0.8 or volume_ratio > 1.3:
        severity = "notable"
    else:
        severity = "minor"
    return severity, volume_ratio

def generate_reason(ticker, zscore, volume_ratio):
    direction = "above" if zscore > 0 else "below"
    return f"{ticker} moved {abs(zscore):.1f}σ {direction} its 30-day mean, volume {volume_ratio:.1f}x normal"