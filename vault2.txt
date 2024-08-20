"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { ToastAction } from "./ui/toast";
import { truncateAddress } from "@/lib/utils";

export default function FaucetForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formSchema = z.object({
    address: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const address = data.address;
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
        toast({
          variant: "success",
          title: "Faucet claim successfull!!",
          action: (
            <ToastAction
              className="bg-green-900 text-white"
              altText="View Transaction"
              onClick={() => {
                window.open(
                  `https://explorer-holesky.morphl2.io/tx/${data.txHash}`
                );
              }}
            >
              View transaction on Explorer
            </ToastAction>
          ),
        });
      } else {
        toast({
          variant: "destructive",
          title: "Could not process your claim",
          description: `${data.error}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <h1 className="">Morph Holesky Address</h1>
              </FormLabel>
              <FormControl>
                <Input
                  className="rounded-full text-black w-full"
                  placeholder="0x..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col justify-center items-center mt-6">
          <Button
            size="lg"
            disabled={isLoading}
            type="submit"
            className="bg-[#00646d]  rounded-full "
          >
            {isLoading ? "Processing..." : "Claim Tokens"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
