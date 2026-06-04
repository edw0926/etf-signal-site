import requests
import pandas as pd
import json
import statistics
from datetime import datetime, timedelta

ETF_LIST = {
    '0050':   {'name': '元大台灣50',      'type': 'base'},
    '006208': {'name': '富邦台50',         'type': 'base'},
    '00631L': {'name': '元大台灣50正2',    'type': 'lev2'},
    '00675L': {'name': '富邦臺灣加權正2',  'type': 'lev2'},
    '00685L': {'name': '群益臺灣加權正2',  'type': 'lev2'},
    '00663L': {'name': '國泰臺灣加權正2',  'type': 'lev2'},
    '00632R': {'name': '元大台灣50反1',    'type': 'inv1'},
    '00686R': {'name': '群益臺灣加權反1',  'type': 'inv1'},
    '00664R': {'name': '國泰臺灣加權反1',  'type': 'inv1'},
}

def fetch_price(ticker, years=7):
    """Fetch historical prices. Uses a larger window to compute backtest stats."""
    end = datetime.now().strftime('%Y-%m-%d')
    start = (datetime.now() - timedelta(days=years * 365)).strftime('%Y-%m-%d')
    url = 'https://api.finmindtrade.com/api/v4/data'
    params = {
        'dataset': 'TaiwanStockPrice',
        'data_id': ticker,
        'start_date': start,
        'end_date': end,
    }
    r = requests.get(url, params=params, timeout=30)
    data = r.json()
    if data.get('status') == 200 and data.get('data'):
        df = pd.DataFrame(data['data'])
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date').sort_index()
        return df['close'].astype(float)
    return None

def get_signal(bias, etf_type):
    if etf_type == 'base':
        if bias <= -5:  return 'green',  '偏低估'
        elif bias >= 5: return 'red',    '偏高估'
        else:           return 'yellow', '中性觀望'
    elif etf_type == 'lev2':
        if bias <= -7:  return 'green',  '偏低估'
        elif bias >= 7: return 'red',    '偏高估'
        else:           return 'yellow', '中性觀望'
    else:  # inv1
        if bias >= 5:   return 'green',  '空頭機會'
        elif bias <= -5: return 'red',   '不建議'
        else:           return 'yellow', '中性觀望'

def compute_bias_history(prices, months=24):
    """Return end-of-month bias values for the last N months."""
    if len(prices) < 25:
        return []
    ma20 = prices.rolling(20).mean()
    bias = (prices - ma20) / ma20 * 100
    monthly = bias.resample('ME').last().dropna()
    recent = monthly.iloc[-months:]
    return [
        {'month': d.strftime('%Y/%m'), 'bias': round(float(v), 2)}
        for d, v in recent.items()
    ]

def compute_conditional_winrates(prices, etf_type, horizon_months=12):
    """
    For each month in history, compute the bias zone at entry and
    the forward return after horizon_months. Group by zone.
    """
    if len(prices) < 22:
        return None
    ma20 = prices.rolling(20).mean()
    bias = (prices - ma20) / ma20 * 100

    monthly_price = prices.resample('ME').last()
    monthly_bias = bias.resample('ME').last()
    df = pd.DataFrame({'price': monthly_price, 'bias': monthly_bias}).dropna()

    if len(df) < horizon_months + 5:
        return None

    threshold = 7 if etf_type == 'lev2' else 5
    zones: dict[str, list[float]] = {'green': [], 'yellow': [], 'red': []}

    for i in range(len(df) - horizon_months):
        entry_bias = float(df['bias'].iloc[i])
        entry_price = float(df['price'].iloc[i])
        future_price = float(df['price'].iloc[i + horizon_months])
        ret = (future_price - entry_price) / entry_price * 100

        if etf_type == 'inv1':
            zone = 'green' if entry_bias >= 5 else ('red' if entry_bias <= -5 else 'yellow')
        else:
            zone = 'green' if entry_bias <= -threshold else ('red' if entry_bias >= threshold else 'yellow')

        zones[zone].append(ret)

    result: dict = {}
    for zone, rets in zones.items():
        if not rets:
            result[zone] = {'count': 0, 'win_rate': None, 'median_ret': None}
        else:
            wins = sum(1 for r in rets if r > 0)
            result[zone] = {
                'count': len(rets),
                'win_rate': round(wins / len(rets) * 100, 1),
                'median_ret': round(statistics.median(rets), 1),
            }
    return result

# ── Main ──────────────────────────────────────────────────────────────────────

with open('public/etf_signals.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

updated = 0
for ticker, info in ETF_LIST.items():
    prices = fetch_price(ticker, years=7)
    if prices is None or len(prices) < 20:
        print(f'⚠️  {ticker} 資料不足，跳過')
        continue

    ma20 = prices.rolling(20).mean().iloc[-1]
    latest = prices.iloc[-1]
    bias = round((latest - ma20) / ma20 * 100, 2)
    signal, label = get_signal(bias, info['type'])

    if ticker in data['etfs']:
        data['etfs'][ticker]['current'] = {
            'signal': signal,
            'label': label,
            'bias': bias,
            'latest_price': round(float(latest), 2),
            'ma20': round(float(ma20), 2),
        }

        # bias_history: last 24 months of end-of-month bias
        bh = compute_bias_history(prices, months=24)
        if bh:
            data['etfs'][ticker]['bias_history'] = bh

        # conditional_winrates: 12-month forward return grouped by entry zone
        cwr = compute_conditional_winrates(prices, info['type'], horizon_months=12)
        if cwr:
            data['etfs'][ticker]['conditional_winrates'] = cwr

        updated += 1
        print(f'✅ {ticker} 乖離率 {bias:+.2f}% → {label}')

data['updated_at'] = datetime.now().strftime('%Y/%m/%d')

with open('public/etf_signals.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'\n✅ 完成，更新 {updated} 檔 ETF，時間：{data["updated_at"]}')
