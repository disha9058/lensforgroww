# diff_engine.py
import numpy as np
import yfinance as yf

def get_baseline_stats(ticker, days=30):
    """Pull recent daily history to compute this stock's normal volatility.
    Returns None if there isn't enough real data — caller should skip this ticker."""
    hist = yf.Ticker(ticker).history(period=f"{days}d", interval="1d")
    if hist.empty or len(hist) < 2:
        return None

    closes = hist["Close"].values
    volumes = hist["Volume"].values
    returns = np.diff(closes) / closes[:-1]

    if len(returns) == 0 or np.isnan(returns).all():
        return None

    mean_return = returns.mean()
    std_return = returns.std()
    avg_volume = volumes.mean()
    last_close = closes[-1]

    if np.isnan(mean_return) or np.isnan(std_return) or np.isnan(avg_volume) or np.isnan(last_close):
        return None

    return {
        "mean_return": float(mean_return),
        "std_return": float(std_return),
        "avg_volume": float(avg_volume),
        "last_close": float(last_close)
    }

def compute_zscore(current_price, baseline):
    latest_return = (current_price - baseline["last_close"]) / baseline["last_close"]
    if baseline["std_return"] == 0:
        return 0
    zscore = (latest_return - baseline["mean_return"]) / baseline["std_return"]
    return 0 if np.isnan(zscore) else zscore

def classify_event(zscore, volume, avg_volume):
    volume_ratio = volume / avg_volume if avg_volume else 1
    if np.isnan(volume_ratio):
        volume_ratio = 1
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