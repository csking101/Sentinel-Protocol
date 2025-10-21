import pandas as pd
from web3 import Web3
import json
from dotenv import load_dotenv
import os
import time

load_dotenv()

def connect_contract(rpc_url, contract_address, abi_path):
    """Connect to an Ethereum contract and return the Web3 and contract objects."""
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        raise ConnectionError("Failed to connect to Ethereum node")
    
    print(f"✓ Connected to network (Chain ID: {w3.eth.chain_id})")

    contract_address = Web3.to_checksum_address(contract_address)

    with open(abi_path) as f:
        abi = json.load(f)

    contract = w3.eth.contract(address=contract_address, abi=abi)
    print(f"✓ Contract loaded at {contract_address}")

    return w3, contract

def push_reputation_scores_to_contract(df, rpc_url, private_key, owner_address, contract_address, abi_path, scale=1_000_000):
    """
    Push all token reputation scores from a Pandas DataFrame to the deployed smart contract.

    Args:
        df (pd.DataFrame): DataFrame with columns:
            ["token", "Market_Stability", "Fundamental_Strength", "Risk_Concentration", "Reputation_Score"]
        rpc_url (str): Ethereum node URL (Infura, Alchemy, Ganache)
        private_key (str): Private key of the owner
        owner_address (str): Public address of the owner
        contract_address (str): Deployed smart contract address
        abi_path (str): Path to the ABI JSON file
        scale (int, optional): Scaling factor for float → uint256 (default 1e6)
    """

    print(f"✓ Owner address: {owner_address}")
    print(f"✓ Contract address: {contract_address}")

    # Connect to Ethereum
    w3, contract = connect_contract(rpc_url, contract_address, abi_path)

    # Convert addresses to checksum format
    owner_address = Web3.to_checksum_address(owner_address)
    contract_address = Web3.to_checksum_address(contract_address)

    # Get initial nonce (will increment for each transaction)
    nonce = w3.eth.get_transaction_count(owner_address)
    
    successful = 0
    failed = 0

    # Iterate over each token and update contract
    for idx, row in df.iterrows():
        print(f"\nProcessing token {idx+1}/{len(df)}...")
        try:
            token_symbol = str(row["token"])
            market = int(row["Market_Stability"] * scale)
            fundamental = int(row["Fundamental_Strength"] * scale)
            risk = int(row["Risk_Concentration"] * scale)
            reputation = int(row["Reputation_Score"] * scale)

            print(f"→ Updating {token_symbol}: Market={market}, Fundamental={fundamental}, Risk={risk}, Reputation={reputation}")

            # Build transaction
            func = contract.functions.setScores(token_symbol, market, fundamental, risk, reputation)
            
            # Estimate gas (with 20% buffer)
            try:
                estimated_gas = func.estimate_gas({"from": owner_address})
                gas_limit = int(estimated_gas * 1.2)
            except Exception as e:
                print(f"⚠ Gas estimation failed for {token_symbol}, using default: {e}")
                gas_limit = 200_000

            # Get current gas price (EIP-1559 if supported)
            try:
                base_fee = w3.eth.get_block('latest')['baseFeePerGas']
                max_priority_fee = w3.eth.max_priority_fee
                max_fee = base_fee * 2 + max_priority_fee
                
                tx = func.build_transaction({
                    "from": owner_address,
                    "nonce": nonce,
                    "gas": gas_limit,
                    "maxFeePerGas": max_fee,
                    "maxPriorityFeePerGas": max_priority_fee,
                    "chainId": w3.eth.chain_id
                })
            except:
                # Fallback to legacy gas pricing
                gas_price = w3.eth.gas_price
                tx = func.build_transaction({
                    "from": owner_address,
                    "nonce": nonce,
                    "gas": gas_limit,
                    "gasPrice": gas_price,
                    "chainId": w3.eth.chain_id
                })

            # Sign and send transaction
            signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for transaction receipt
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt['status'] == 1:
                print(f"✓ [{idx+1}/{len(df)}] Updated {token_symbol} | Gas used: {receipt['gasUsed']} | Tx: {tx_hash.hex()}")
                successful += 1
            else:
                print(f"✗ [{idx+1}/{len(df)}] Transaction failed for {token_symbol}")
                failed += 1
            
            # Increment nonce for next transaction
            nonce += 1
            
            # Small delay to avoid rate limiting
            time.sleep(1)
            
        except Exception as e:
            print(f"✗ Error updating {token_symbol}: {str(e)}")
            failed += 1
            # Don't increment nonce on failure
            continue

    print("\n" + "="*60)
    print(f"Summary: {successful} successful, {failed} failed out of {len(df)} total")
    print("="*60)


def fetch_contract_data(rpc_url, contract_address, abi_path, scale=1_000_000):
    """
    Fetch and display all tokens and their details from the contract.
    Expected contract functions:
      - getAllTokens() returns string[] (list of token symbols)
      - getScores(string token) returns (market, fundamental, risk, reputation)
    """
    w3, contract = connect_contract(rpc_url, contract_address, abi_path)

    try:
        tokens = contract.functions.getAllTokens().call()
        if not tokens:
            print("⚠ No tokens found in the contract.")
            return
        
        print(f"\nFound {len(tokens)} tokens on-chain:\n")
        for t in tokens:
            try:
                data = contract.functions.getScores(t).call()
                market, fundamental, risk, reputation = [x / scale for x in data]
                print(f"🔹 {t}:")
                print(f"   Market Stability: {market}")
                print(f"   Fundamental Strength: {fundamental}")
                print(f"   Risk Concentration: {risk}")
                print(f"   Reputation Score: {reputation}\n")
            except Exception as e:
                print(f"⚠ Could not fetch details for {t}: {e}")
    except Exception as e:
        print(f"✗ Error fetching tokens: {e}")


if __name__ == "__main__":
    # Load data
    try:
        df = pd.read_csv("reputation_scores.csv")
        print(f"Loaded {len(df)} tokens from reputation_scores.csv")
    except FileNotFoundError:
        raise FileNotFoundError("reputation_scores.csv not found")
    
    # push_reputation_scores_to_contract(
    #     df=df, 
    #     rpc_url=os.getenv("RPC_URL"),
    #     private_key=os.getenv("PRIVATE_KEY"),
    #     owner_address=os.getenv("OWNER_ADDRESS"),
    #     contract_address=os.getenv("CONTRACT_ADDRESS"),
    #     abi_path=os.getenv("ABI_PATH")
    # )

    fetch_contract_data(
        rpc_url=os.getenv("RPC_URL"),
        contract_address=os.getenv("CONTRACT_ADDRESS"),
        abi_path=os.getenv("ABI_PATH")
    )