import os
import requests
import numpy as np
import pandas as pd
from datetime import datetime, timezone
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- CONFIG ---
TOKENS = {
    "ethereum": { "symbol": "ETH",   "contract": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
    "matic-network": { "symbol": "MATIC", "contract": "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0" },
    "aave": { "symbol": "AAVE",   "contract": "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9" },
    "usd-coin": { "symbol": "USDC", "contract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    "dogecoin": { "symbol": "DOGE","contract": "0x4206931337dc273a630d328da6441786bfad668f" }
}

DAYS = 100

COINGECKO_BASE = "https://api.coingecko.com/api/v3"
ETHERSCAN_BASE = "https://api.etherscan.io/v2/api"

# Load API keys from environment
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")
ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY")
COVALENT_API_KEY = os.getenv("COVALENT_API_KEY")

# Rate limiting configuration
API_DELAY = float(os.getenv("API_DELAY", 1.0))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", 3))
RETRY_DELAY = float(os.getenv("RETRY_DELAY", 2.0))

def rate_limited_request(url, params=None, headers=None):
    """Make a rate-limited request with retry logic"""
    for attempt in range(MAX_RETRIES):
        try:
            time.sleep(API_DELAY)  # Rate limiting delay
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                wait_time = RETRY_DELAY * (2 ** attempt)
                print(f"Request failed (attempt {attempt + 1}/{MAX_RETRIES}), retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise e

# --- HELPER FUNCTIONS ---
def fetch_market_chart(token_id, days=DAYS):
    url = f"{COINGECKO_BASE}/coins/{token_id}/market_chart"
    params = {"vs_currency": "usd", "days": days}
    resp = rate_limited_request(url, params=params)
    return resp.json()

def fetch_coin_details(token_id):
    url = f"{COINGECKO_BASE}/coins/{token_id}"
    params = {"localization": "false"}
    resp = rate_limited_request(url, params=params)
    return resp.json()

def fetch_holder_concentration_covalent(contract_address, top_n=10):
    """Fetch % supply held by top holders using free Covalent API"""
    url = f"https://api.covalenthq.com/v1/1/tokens/{contract_address}/token_holders_v2/?key={COVALENT_API_KEY}"
    r = rate_limited_request(url)
    data = r.json().get("data", {}).get("items", [])
    total_supply = float(data[0]["total_supply"]) if data else 1
    top_qty = sum(float(i["balance"]) for i in data[:top_n])
    return top_qty / total_supply

def compute_volatility(values):
    returns = np.diff(values) / values[:-1]
    return float(np.std(returns))

def normalize(series):
    return (series - series.min()) / (series.max() - series.min() + 1e-8)

# --- DATA COLLECTION ---
def calculate_reputation_scores():
    results = []

    for token_id, meta in TOKENS.items():
        symbol = meta["symbol"]
        contract = meta["contract"]
        print(f"Fetching data for {symbol} ({token_id})...")
        try:
            market_data = fetch_market_chart(token_id, days=DAYS)
            details = fetch_coin_details(token_id)
        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
            continue

        # Market Stability
        prices = np.array([p[1] for p in market_data.get("prices", [])])
        market_caps = np.array([m[1] for m in market_data.get("market_caps", [])])
        volumes = np.array([v[1] for v in market_data.get("total_volumes", [])])

        price_volatility = compute_volatility(prices) if len(prices) > 1 else None
        mcap_volatility = (np.std(market_caps) / np.mean(market_caps)) if len(market_caps) > 1 else None
        liquidity_ratio = (np.mean(volumes[-7:]) / np.mean(market_caps[-7:])) if len(volumes) >=7 and len(market_caps)>=7 else None

        # Fundamental Strength
        genesis = details.get("genesis_date")
        if genesis:
            try:
                age_years = (datetime.now(timezone.utc) - datetime.strptime(genesis, "%Y-%m-%d").replace(tzinfo=timezone.utc)).days / 365.0
            except Exception:
                age_years = 0.0
        else:
            age_years = 0.0

        dev_activity = details.get("developer_data", {}).get("commit_count_4_weeks", 0)

        # Ecosystem integration: simple binary if token appears in DefiLlama protocols
        try:
            llama_resp = rate_limited_request("https://api.llama.fi/protocols")
            llama_data = llama_resp.json()
            ecosystem_integration = 1 if any(meta["symbol"].lower() == (p.get("symbol","").lower()) for p in llama_data) else 0
        except Exception:
            ecosystem_integration = 0

        # Risk & Concentration
        holder_concentration = None
        try:
            holder_concentration = fetch_holder_concentration_covalent(contract)
        except Exception as e:
            print(f"Error fetching holder concentration for {symbol}: {e}")

        results.append({
            "token": symbol,
            "price_volatility": price_volatility,
            "mcap_volatility": mcap_volatility,
            "liquidity": liquidity_ratio,
            "age": age_years,
            "dev_activity": dev_activity,
            "ecosystem_integration": ecosystem_integration,
            "holder_concentration": holder_concentration,
        })

    df = pd.DataFrame(results)

    # --- NORMALIZATION & CLEANUP ---
    # Replace None with nan to allow numeric ops
    df = df.replace({None: np.nan})

    for col in ["price_volatility", "mcap_volatility", "liquidity", "age", "dev_activity", "holder_concentration"]:
        df[col] = normalize(df[col].fillna(df[col].mean()))

    # Invert metrics where "lower is better":
    df["price_volatility"] = 1.0 - df["price_volatility"]
    df["mcap_volatility"]  = 1.0 - df["mcap_volatility"]
    df["holder_concentration"] = 1.0 - df["holder_concentration"]

    # --- COMPUTE COMPONENT SCORES ---
    df["Market_Stability"] = (0.15 * df["price_volatility"] +
                              0.15 * df["mcap_volatility"] +
                              0.10 * df["liquidity"])

    df["Fundamental_Strength"] = (0.10 * df["age"] +
                                  0.15 * df["dev_activity"] +
                                  0.10 * df["ecosystem_integration"])

    df["Risk_Concentration"] = df["holder_concentration"]

    # Final Reputation
    df["Reputation_Score"] = (0.45 * df["Market_Stability"] +
                              0.40 * df["Fundamental_Strength"] +
                              0.15 * df["Risk_Concentration"])

    # Add timestamp
    df["timestamp"] = datetime.now(timezone.utc)

    # Sort by reputation score
    df_sorted = df.sort_values(by="Reputation_Score", ascending=False)

    print(results)
    return df_sorted


def main():
    try:
        result = calculate_reputation_scores()
        print(result)
        print(f"\n✅ Reputation scoring completed successfully!")
    except Exception as e:
        print(f"❌ Error during reputation score computation: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())