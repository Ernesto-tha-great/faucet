"use client";

import { useState } from "react";

export default function FaucetForm() {
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      // Call the API route to process the claim
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          `Success! Claim processed for address: ${address}. Transaction hash: ${data.txHash}`
        );
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Enter your Ethereum address"
        className="w-full text-black p-2 mb-4 border border-gray-300 rounded"
        required
        disabled={isLoading}
      />
      <button
        type="submit"
        className={`w-full p-2 text-white rounded ${
          isLoading
            ? "bg-blue-300 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Claim 0.01 ETH"}
      </button>
      {message && (
        <p
          className={`mt-4 text-center ${message.includes("Error") ? "text-red-500" : "text-green-500"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
