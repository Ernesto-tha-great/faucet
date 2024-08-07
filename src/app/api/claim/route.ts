import { NextRequest } from "next/server";
import { ethers } from "ethers";
import { api } from "../../../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const FAUCET_AMOUNT = ethers.utils.parseEther("0.001");
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const provider = new ethers.providers.JsonRpcProvider({
  url: process.env.MORPH_RPC_URL as string,
  skipFetchSetup: true,
});

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

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

    if (lastClaim) {
      const timeSinceLastClaim = Date.now() - lastClaim.timestamp;
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
    } else {
      console.log("all goooood");
    }

    // Check wallet balance
    try {
      console.log("Wallet address:", wallet.address);
      console.log("provider", provider);
      console.log("Attempting to get wallet balance...");

      // First, try to get the balance using the wallet
      let balance;
      try {
        balance = await provider.getBalance(wallet.address);
      } catch (walletError) {
        console.error("Error getting balance from wallet:", walletError);
        // If wallet.getBalance() fails, try using the provider directly
      }

      console.log("Raw balance:", balance?.toString());

      if (balance?.lt(FAUCET_AMOUNT)) {
        console.log("Faucet amount:", FAUCET_AMOUNT.toString());
        console.error("Insufficient funds in faucet wallet");
        return Response.json(
          { error: "Faucet is currently out of funds" },
          { status: 503 }
        );
      } else {
        console.log("Sufficient funds available");
      }
    } catch (balanceError) {
      console.error("Error getting wallet balance:", balanceError);
      if (balanceError instanceof Error) {
        if (balanceError.message.includes("network")) {
          return Response.json(
            {
              error:
                "Network error while checking faucet balance. Please try again later.",
            },
            { status: 503 }
          );
        }
        // Log the full error for debugging
        console.error("Full balance error details:", balanceError);
        return Response.json(
          { error: "Error checking faucet balance: " + balanceError.message },
          { status: 500 }
        );
      }
      return Response.json(
        { error: "Unexpected error while checking faucet balance" },
        { status: 500 }
      );
    }

    //////////

    // Proceed with the transaction
    const tx = await wallet.sendTransaction({
      to: address,
      value: FAUCET_AMOUNT,
    });

    const receipt = await tx.wait();

    // Record the claim
    await convex.mutation(api.claims.createClaim, { address });

    return Response.json({ success: true, txHash: receipt.transactionHash });
  } catch (error) {
    console.error("Error processing claim:", error);

    if (error instanceof Error) {
      // Network-related errors
      if (error.message.includes("network")) {
        return Response.json(
          { error: "Network error. Please try again later." },
          { status: 503 }
        );
      }

      // Insufficient gas
      if (error.message.includes("insufficient funds")) {
        return Response.json(
          {
            error: "Insufficient gas for transaction. Please try again later.",
          },
          { status: 503 }
        );
      }

      // Other specific errors can be handled here

      // Log the full error for debugging
      console.error("Full error details:", error);

      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
