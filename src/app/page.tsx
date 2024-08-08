import FaucetForm from "@/components/FaucetForm";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col h-screen items-center justify-center">
      <section className="py-12 flex flex-col items-center text-center gap-8">
        <h1 className="text-4xl font-bold">Morph Holesky Faucet</h1>
        <p className="text-2xl text-muted-foreground">
          Claim testnet ETH to your wallet. You can only claim 0.1ETH per day.
        </p>
      </section>

      <section className="flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-xl p-8  bg-slate-800 shadow-lg rounded-lg">
          <FaucetForm />
        </div>
      </section>
    </main>
  );
}
