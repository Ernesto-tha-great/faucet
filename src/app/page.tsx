import FaucetForm from "@/components/FaucetForm";
import InfoCards from "@/components/InfoCards";
import { data } from "@/components/constants/data";
import { InfoIcon } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen p-4 md:p-8  text-gray-200">
      <div className="flex-grow max-w-4xl mx-auto w-full">
        <section className="py-8 md:py-12 flex flex-col items-center text-center gap-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Morph Holesky Faucet</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
            Claim Morph Holesky Testnet tokens every 24 hours for your development and testing needs.
          </p>
          <div className="flex items-start gap-2 bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 max-w-2xl">
            <InfoIcon className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-400" />
            <p className="text-left">
              Please note: These are testnet-only tokens with no real economic value.
            </p>
          </div>
        </section>

        <section className="flex flex-col items-center justify-center w-full my-8">
          <div className="w-full max-w-3xl p-6 md:p-12 bg-gray-800 shadow-lg rounded-lg border border-gray-700">
            <FaucetForm />
          </div>
        </section>
      </div>

      <section className="mt-12 md:mt-16">
        <InfoCards data={data} />
      </section>
    </main>
  );
}