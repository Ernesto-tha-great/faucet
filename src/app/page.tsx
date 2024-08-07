import FaucetForm from "@/components/FaucetForm";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-8">Morph Faucet</h1>
        <FaucetForm />
      </main>
    </main>
  );
}
