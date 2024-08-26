import FaucetForm from "@/components/FaucetForm";
import InfoCards from "@/components/InfoCards";
import { data } from "@/components/constants/data";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <section className="py-12 flex flex-col items-center text-center gap-8">
          <h1 className="text-4xl font-bold">Morph Holesky Faucet</h1>
          <p className="text-2xl text-muted-foreground max-w-3xl text-center">
          Claim Morph Holesky Testnet tokens every 24 hours for any development and testing needs.
Please note, these are testnet-only tokens with no real economic value.
          </p>
        </section>

        <section className="flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-xl p-8 bg-slate-800 shadow-lg rounded-lg">
            <FaucetForm />
          </div>
        </section>
      </div>

      <section className="mt-auto">
        <InfoCards data={data} />
      </section>
    </main>
  );
}
