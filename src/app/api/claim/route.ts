import { NextRequest } from "next/server";
import { ethers } from "ethers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const ETH_FAUCET_AMOUNT = ethers.utils.parseEther("0.01");
const MORPH_FAUCET_AMOUNT = ethers.utils.parseUnits("100", 18); // Assuming 18 decimals for MORPH token
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const provider = new ethers.providers.JsonRpcProvider({
  url: process.env.MORPH_RPC_URL as string,
  skipFetchSetup: true,
});

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

const MORPH_TOKEN_ADDRESS = process.env.MORPH_TOKEN_ADDRESS as string;
const morphTokenABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
];
const morphTokenContract = new ethers.Contract(
  MORPH_TOKEN_ADDRESS,
  morphTokenABI,
  wallet
);

let lastNonce = -1;

async function getNextNonce() {
  const currentNonce = await wallet.getTransactionCount("pending");
  lastNonce = Math.max(lastNonce, currentNonce - 1);
  return lastNonce + 1;
}

async function verifyCaptcha(captchaResponse: string): Promise<boolean> {
  // Implement captcha verification logic here
  // Return true if captcha is valid, false otherwise
  return true; // Placeholder
}

export async function POST(request: NextRequest) {
  const { address, token, captcha } = await request.json();

  if (!ethers.utils.isAddress(address)) {
    return Response.json(
      { error: "Invalid Ethereum address" },
      { status: 400 }
    );
  }

  if (!["ETH", "MORPH"].includes(token)) {
    return Response.json({ error: "Invalid token selection" }, { status: 400 });
  }

  // Verify captcha
  const isCaptchaValid = await verifyCaptcha(captcha);
  if (!isCaptchaValid) {
    return Response.json({ error: "Invalid captcha" }, { status: 400 });
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

    // Get the next nonce
    const nonce = await getNextNonce();

    let tx;
    if (token === "ETH") {
      // Send ETH
      tx = await wallet.sendTransaction({
        to: address,
        value: ETH_FAUCET_AMOUNT,
        nonce: nonce,
        gasPrice: await provider.getGasPrice(),
        gasLimit: 21000,
      });
    } else {
      // Send MORPH tokens
      tx = await morphTokenContract.transfer(address, MORPH_FAUCET_AMOUNT, {
        nonce: nonce,
        gasPrice: await provider.getGasPrice(),
        gasLimit: 100000, // Adjust as needed for the MORPH token contract
      });
    }

    // Wait for the transaction to be mined
    await tx.wait(1); // Wait for 1 confirmation

    // Record the claim in Convex
    await convex.mutation(api.claims.createClaim, { address, token });

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
