import requests
import pandas as pd
import json
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

def fetch_price(ticker):
    end = datetime.now().strftime('%Y-%m-%d')
    start = (datetime.now() - timedelta(days=60)).strftime('%Y-%m-%d')
    url = 'https://api.finmindtrade.com/api/v4/data'
    params = {
        'dataset': 'TaiwanStockPrice',
        'data_id': ticker,
        'start_date': start,
        'end_date': end,
    }
    r = requests.get(url, params=params, timeout=20)
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

# 讀取現有 JSON（保留歷史回測數據不動）
with open('public/etf_signals.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

updated = 0
for ticker, info in ETF_LIST.items():
    prices = fetch_price(ticker)
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
        updated += 1
        print(f'✅ {ticker} 乖離率 {bias:+.2f}% → {label}')

data['updated_at'] = datetime.now().strftime('%Y/%m/%d')

with open('public/etf_signals.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'\n✅ 完成，更新 {updated} 檔 ETF，時間：{data["updated_at"]}')
