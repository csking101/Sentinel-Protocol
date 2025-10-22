#!/usr/bin/env python3
"""
Configuration Validation Script for Sentinel Protocol

This script validates that all required environment variables are set
and that the Hedera network connection is working properly.
"""

import os
import sys
from dotenv import load_dotenv
from web3 import Web3
import json

def validate_env_vars():
    """Validate that all required environment variables are set."""
    print("=" * 60)
    print("Environment Variables Validation")
    print("=" * 60)
    
    required_vars = {
        "RPC_URL": "Hedera RPC endpoint URL",
        "CONTRACT_ADDRESS": "TokenReputation contract address",
        "ABI_PATH": "Path to contract ABI file",
    }
    
    optional_vars = {
        "PRIVATE_KEY": "Wallet private key (needed for transactions)",
        "OWNER_ADDRESS": "Wallet public address (needed for transactions)",
        "COINGECKO_API_KEY": "CoinGecko API key",
        "COVALENT_API_KEY": "Covalent API key",
        "ETHERSCAN_API_KEY": "Etherscan API key",
        "API_DELAY": "API request delay",
        "MAX_RETRIES": "Maximum retry attempts",
        "RETRY_DELAY": "Delay between retries",
    }
    
    all_good = True
    
    print("\n✓ Required Variables:")
    for var, description in required_vars.items():
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            display_value = value if len(value) < 20 else f"{value[:10]}...{value[-4:]}"
            print(f"  ✓ {var}: {display_value}")
        else:
            print(f"  ✗ {var}: NOT SET - {description}")
            all_good = False
    
    print("\n⚠ Optional Variables:")
    for var, description in optional_vars.items():
        value = os.getenv(var)
        if value:
            display_value = value if len(value) < 20 or var in ["API_DELAY", "MAX_RETRIES", "RETRY_DELAY"] else f"{value[:10]}...{value[-4:]}"
            print(f"  ✓ {var}: {display_value}")
        else:
            print(f"  - {var}: Not set - {description}")
    
    return all_good

def validate_network_connection():
    """Validate connection to Hedera network."""
    print("\n" + "=" * 60)
    print("Network Connection Validation")
    print("=" * 60)
    
    rpc_url = os.getenv("RPC_URL")
    if not rpc_url:
        print("✗ Cannot test network connection: RPC_URL not set")
        return False
    
    try:
        print(f"\nConnecting to: {rpc_url}")
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        
        if not w3.is_connected():
            print("✗ Failed to connect to network")
            return False
        
        print("✓ Successfully connected to network")
        
        # Get network information
        chain_id = w3.eth.chain_id
        print(f"✓ Chain ID: {chain_id}")
        
        if chain_id == 296:
            print("✓ Network: Hedera Testnet")
        elif chain_id == 295:
            print("✓ Network: Hedera Mainnet")
        else:
            print(f"⚠ Warning: Unknown Chain ID {chain_id}")
        
        # Get latest block
        try:
            latest_block = w3.eth.block_number
            print(f"✓ Latest block: {latest_block}")
        except Exception as e:
            print(f"⚠ Could not fetch latest block: {e}")
        
        return True
        
    except Exception as e:
        print(f"✗ Connection error: {e}")
        return False

def validate_contract():
    """Validate contract configuration."""
    print("\n" + "=" * 60)
    print("Contract Configuration Validation")
    print("=" * 60)
    
    contract_address = os.getenv("CONTRACT_ADDRESS")
    abi_path = os.getenv("ABI_PATH")
    rpc_url = os.getenv("RPC_URL")
    
    if not all([contract_address, abi_path, rpc_url]):
        print("✗ Missing required configuration")
        return False
    
    try:
        # Check if ABI file exists
        if not os.path.exists(abi_path):
            print(f"✗ ABI file not found: {abi_path}")
            return False
        
        print(f"✓ ABI file found: {abi_path}")
        
        # Load ABI
        with open(abi_path, 'r') as f:
            abi = json.load(f)
        
        print(f"✓ ABI file is valid JSON with {len(abi)} entries")
        
        # Connect to contract
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not w3.is_connected():
            print("✗ Cannot connect to network")
            return False
        
        checksum_address = Web3.to_checksum_address(contract_address)
        print(f"✓ Contract address (checksum): {checksum_address}")
        
        contract = w3.eth.contract(address=checksum_address, abi=abi)
        print("✓ Contract instance created successfully")
        
        # Try to get code at address
        code = w3.eth.get_code(checksum_address)
        if code == b'' or code == '0x':
            print("⚠ Warning: No code found at contract address (contract may not be deployed)")
        else:
            print(f"✓ Contract code found (size: {len(code)} bytes)")
        
        return True
        
    except Exception as e:
        print(f"✗ Contract validation error: {e}")
        return False

def validate_wallet():
    """Validate wallet configuration (if provided)."""
    print("\n" + "=" * 60)
    print("Wallet Configuration Validation")
    print("=" * 60)
    
    private_key = os.getenv("PRIVATE_KEY")
    owner_address = os.getenv("OWNER_ADDRESS")
    rpc_url = os.getenv("RPC_URL")
    
    if not private_key or not owner_address:
        print("⚠ Wallet credentials not set (required for transactions)")
        return True  # Not an error, just a warning
    
    try:
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not w3.is_connected():
            print("✗ Cannot connect to network")
            return False
        
        # Validate address format
        checksum_address = Web3.to_checksum_address(owner_address)
        print(f"✓ Wallet address (checksum): {checksum_address}")
        
        # Check wallet balance
        balance = w3.eth.get_balance(checksum_address)
        balance_hbar = w3.from_wei(balance, 'ether')  # HBAR uses same decimals as ETH
        print(f"✓ Wallet balance: {balance_hbar} HBAR")
        
        if balance == 0:
            print("⚠ Warning: Wallet has zero balance (cannot send transactions)")
        
        # Validate private key matches address (without exposing the key)
        try:
            account = w3.eth.account.from_key(private_key)
            if account.address.lower() == owner_address.lower():
                print("✓ Private key matches owner address")
            else:
                print("✗ Private key does NOT match owner address")
                return False
        except Exception as e:
            print(f"✗ Invalid private key format: {e}")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Wallet validation error: {e}")
        return False

def main():
    """Main validation function."""
    print("\n" + "=" * 60)
    print("Sentinel Protocol Configuration Validator")
    print("=" * 60)
    
    # Load environment variables
    load_dotenv()
    
    # Run validations
    results = {
        "Environment Variables": validate_env_vars(),
        "Network Connection": validate_network_connection(),
        "Contract Configuration": validate_contract(),
        "Wallet Configuration": validate_wallet(),
    }
    
    # Summary
    print("\n" + "=" * 60)
    print("Validation Summary")
    print("=" * 60)
    
    all_passed = True
    for test, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test}: {status}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("\n✓ All validations passed! Your configuration is ready.")
        return 0
    else:
        print("\n✗ Some validations failed. Please check the output above and fix the issues.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
