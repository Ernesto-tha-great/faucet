import { NextRequest } from "next/server";
import { ethers } from "ethers";
import redis from "../../../lib/redis";
import { limitRate } from "../../../lib/rate-limiter";

const ETH_FAUCET_AMOUNT = ethers.utils.parseEther("0.03");
const MORPH_FAUCET_AMOUNT = ethers.utils.parseUnits("10", 18);
const COOLDOWN_PERIOD = 24 * 60 * 60; // 24 hours in seconds

const provider = new ethers.providers.JsonRpcProvider({
  url: process.env.MORPH_RPC_URL as string,
  skipFetchSetup: true,
});

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

const MORPH_TOKEN_ADDRESS = process.env.MORPH_TOKEN_ADDRESS as string;
const MORPH_USDT_ADDRESS = process.env.MORPH_USDT_ADDRESS as string;

const morphTokenABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
];
const morphTokenContract = new ethers.Contract(
  MORPH_TOKEN_ADDRESS,
  morphTokenABI,
  wallet
);

const morphUsdtContract = new ethers.Contract(
  MORPH_USDT_ADDRESS,
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
  const verifyUrl = `https://hcaptcha.com/siteverify`;
  const response = await fetch(verifyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `response=${captchaResponse}&secret=${process.env.HCAPTCHA_SECRET_KEY}`,
  });
  const data = await response.json();
  return data.success;
}

export async function POST(request: NextRequest) {
  const ip = request.ip || "unknown";
  const isAllowed = await limitRate(ip);
  if (!isAllowed) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const { address, token, captcha } = await request.json();

  if (!ethers.utils.isAddress(address)) {
    return Response.json(
      { error: "Invalid Ethereum address" },
      { status: 400 }
    );
  }

  if (!["ETH", "MORPH", "MORPHSTABLE"].includes(token)) {
    return Response.json({ error: "Invalid token selection" }, { status: 400 });
  }

  const isCaptchaValid = await verifyCaptcha(captcha);
  if (!isCaptchaValid) {
    return Response.json({ error: "Invalid captcha" }, { status: 400 });
  }

  try {
    const lastClaimTime = await redis.get(`lastClaim:${address}`);
    const now = Math.floor(Date.now() / 1000);

    if (lastClaimTime) {
      const timeSinceLastClaim = now - parseInt(lastClaimTime);
      if (timeSinceLastClaim < COOLDOWN_PERIOD) {
        const remainingTime = Math.ceil(
          (COOLDOWN_PERIOD - timeSinceLastClaim) / 60
        );
        return Response.json(
          {
            error: `Please wait ${remainingTime} minutes before claiming again`,
          },
          { status: 429 }
        );
      }
    }

    const nonce = await getNextNonce();

    let tx;
    if (token === "ETH") {
      tx = await wallet.sendTransaction({
        to: address,
        value: ETH_FAUCET_AMOUNT,
        nonce: nonce,
        gasPrice: await provider.getGasPrice(),
        gasLimit: 21000,
      });
    } else if (token === "MORPH") {
      tx = await morphTokenContract.transfer(address, MORPH_FAUCET_AMOUNT, {
        nonce: nonce,
        gasPrice: await provider.getGasPrice(),
        gasLimit: 100000,
      });
    } else {
      tx = await morphUsdtContract.transfer(address, MORPH_FAUCET_AMOUNT, {
        nonce: nonce,
        gasPrice: await provider.getGasPrice(),
        gasLimit: 100000,
      });
    }

    await tx.wait(1);

    // Record the claim in Redis with automatic expiration
    await redis.set(`lastClaim:${address}`, now, "EX", COOLDOWN_PERIOD);

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
