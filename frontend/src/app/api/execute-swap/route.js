import { NextResponse } from 'next/server';
import { verifyVincentAppUserJWT } from '@lit-protocol/vincent-app-sdk/jwt';
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { bundledVincentAbility } from '@sentinel-protocol/swap-tokens-hedera-testnet';
import { ethers } from 'ethers'; // ethers v5 for Vincent SDK compatibility

export async function POST(request) {
  try {
    // 1. Extract JWT from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const jwt = authHeader.substring(7); // Remove 'Bearer ' prefix

    // 2. Verify the JWT
    let verified;
    try {
      verified = await verifyVincentAppUserJWT({
        jwt,
        expectedAudience: process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin'),
        requiredAppId: parseInt(process.env.NEXT_PUBLIC_VINCENT_APP_ID || '8047866111'),
      });
    } catch (error) {
      console.error('JWT verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid or expired JWT' },
        { status: 401 }
      );
    }
    console.log(verified)
    // 3. Extract PKP information from verified JWT
    const { pkpInfo } = verified.payload;
    const delegatorPkpEthAddress = pkpInfo.ethAddress;

    console.log('Executing swap for PKP:', delegatorPkpEthAddress);

    // 4. Get request body with swap parameters
    const body = await request.json();
    const { tokenFrom, tokenTo, amount, swapAgentAddress, rpcUrl, chainId } = body;

    // 5. Validate required parameters
    if (!tokenFrom || !tokenTo || !amount || !swapAgentAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: tokenFrom, tokenTo, amount, swapAgentAddress' },
        { status: 400 }
      );
    }

    const finalChainId = chainId || 296; // Default to Hedera testnet

    // 6. Initialize delegatee signer (your server's wallet)
    const delegateePrivateKey = process.env.DELEGATEE_PRIVATE_KEY;
    if (!delegateePrivateKey) {
      console.error('DELEGATEE_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Connect the wallet to a provider (using the RPC URL from params or default)
    // For Hedera testnet, we need to specify the network config explicitly
    const networkConfig = {
      name: 'hedera-testnet',
      chainId: finalChainId,
    };
    
    const provider = new ethers.providers.JsonRpcProvider(
      rpcUrl || 'https://testnet.hashio.io/api',
      networkConfig
    );
    const delegateeSigner = new ethers.Wallet(delegateePrivateKey, provider);

    // 7. Initialize Vincent Ability Client
    const abilityClient = getVincentAbilityClient({
      ethersSigner: delegateeSigner,
      bundledVincentAbility,
      appId: parseInt(process.env.NEXT_PUBLIC_VINCENT_APP_ID || '8047866111'),
      appVersion: 8, // Updated to version 6 with ERC20 approval ability
    });

    // 8. Prepare ability parameters
    const abilityParams = {
      tokenFrom,
      tokenTo,
      amount,
      swapAgentAddress,
      rpcUrl: rpcUrl || 'https://testnet.hashio.io/api',
      chainId: finalChainId,
    };

    // console.log('Running precheck with params:', abilityParams);

    // 9. Execute the swap ability
    console.log('Executing swap...');
    const executeResult = await abilityClient.execute(abilityParams, {
      delegatorPkpEthAddress,
    });

    if (!executeResult.success) {
      console.error('Execution failed:', executeResult);
      return NextResponse.json(
        {
          error: 'Swap execution failed',
          details: executeResult.result,
        },
        { status: 500 }
      );
    }

    console.log('Swap executed successfully:', executeResult.result);

    // 10. Return success response
    return NextResponse.json({
      success: true,
      result: executeResult.result,
    });

  } catch (error) {
    console.error('Server error during swap execution:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
