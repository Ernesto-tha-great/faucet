import { NextRequest } from "next/server";
import { ethers } from "ethers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const FAUCET_AMOUNT = ethers.utils.parseEther("0.01");
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const provider = new ethers.providers.JsonRpcProvider({
  url: process.env.MORPH_RPC_URL as string,
  skipFetchSetup: true,
});

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

let lastNonce = -1;

async function getNextNonce() {
  const currentNonce = await wallet.getTransactionCount("pending");
  lastNonce = Math.max(lastNonce, currentNonce - 1);
  return lastNonce + 1;
}

async function clearPendingTransactions() {
  const currentNonce = await wallet.getTransactionCount("pending");
  const latestNonce = await wallet.getTransactionCount("latest");

  for (let i = latestNonce; i < currentNonce; i++) {
    try {
      await wallet.sendTransaction({
        to: wallet.address,
        value: 0,
        nonce: i,
        gasPrice: ethers.utils.parseUnits("30", "gwei"),
        gasLimit: 21000,
      });
    } catch (error) {
      console.error(`Failed to clear transaction with nonce ${i}:`, error);
    }
  }
}

export async function POST(request: NextRequest) {
  const { address } = await request.json();

  if (!ethers.utils.isAddress(address)) {
    return Response.json(
      { error: "Invalid Ethereum address" },
      { status: 400 }
    );
  }

  try {
    // Check for recent claims
    const lastClaim = await convex.query(api.claims.getLastClaim, { address });
    const now = Date.now();

    if (lastClaim) {
      const timeSinceLastClaim = now - lastClaim.timestamp;
      if (timeSinceLastClaim < COOLDOWN_PERIOD) {
        const remainingTime = Math.ceil(
          (COOLDOWN_PERIOD - timeSinceLastClaim) / 1000 / 60
        );
        return Response.json(
          {
            error: `Please wait ${remainingTime} minutes before claiming again`,
          },
          { status: 429 }
        );
      }
    }

    // Clear any pending transactions
    await clearPendingTransactions();

    // Get the next nonce
    const nonce = await getNextNonce();

    // Proceed with the transaction
    const tx = await wallet.sendTransaction({
      to: address,
      value: FAUCET_AMOUNT,
      nonce: nonce,
      maxFeePerGas: ethers.utils.parseUnits("60", "gwei"), // Increased gas price
      maxPriorityFeePerGas: ethers.utils.parseUnits("8", "gwei"),
      gasLimit: 21000,
    });

    // Wait for the transaction to be mined
    await tx.wait(1); // Wait for 1 confirmation

    // Record the claim in Convex
    await convex.mutation(api.claims.createClaim, { address });

    return Response.json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Error processing claim:", error);

    if (error instanceof Error) {
      if (error.message.includes("already known")) {
        return Response.json(
          {
            error:
              "Transaction already submitted. Please wait and try again later.",
          },
          { status: 409 }
        );
      }
      if (error.message.includes("replacement fee too low")) {
        return Response.json(
          { error: "Network is busy. Please try again later." },
          { status: 503 }
        );
      }
    }

    return Response.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
