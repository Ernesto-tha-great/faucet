"use client";

import { useRef, useState } from "react";
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
import HCaptcha from "@hcaptcha/react-hcaptcha";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function FaucetForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const captchaRef = useRef<HCaptcha>(null);

  const formSchema = z.object({
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
    token: z.enum(["ETH", "MORPH", "MORPHSTABLE"]),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      token: "ETH",
    },
  });

  const executeCaptcha = () => {
    if (captchaRef.current) {
      captchaRef.current.execute();
    }
  };

  const onCaptchaVerify = async (token: string) => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Captcha verification failed",
        description: "Please try again.",
      });
      return;
    }

    const formData = form.getValues();
    await handleSubmit({ ...formData, captcha: token });
  };

  const handleSubmit = async (data: z.infer<typeof formSchema> & { captcha: string }) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          variant: "success",
          title: "Faucet claim successful!",
          action: (
            <ToastAction
              className="bg-green-900 text-white"
              altText="View Transaction"
              onClick={() => {
                window.open(
                  `https://explorer-holesky.morphl2.io/tx/${result.txHash}`
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
          description: `${result.error}`,
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
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(executeCaptcha)}
        className="flex flex-col w-full gap-6"
      >
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-transparent rounded-full">
                    <SelectValue placeholder="Select a token" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-slate-300">
                  <SelectItem value="ETH">ETH</SelectItem>
                  {/* <SelectItem value="MORPH">MORPH Token</SelectItem> */}
                  <SelectItem value="MORPHSTABLE">MORPH USDT</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  className="rounded-full text-white bg-transparent w-full"
                  placeholder="0x..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

    
                <HCaptcha
                  sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY as string}
                  onVerify={onCaptchaVerify}
                  ref={captchaRef}
                  size="invisible"
                />
       
    

        <div className="flex flex-col justify-center items-center mt-6">
          <Button
            size="lg"
            disabled={isLoading}
            type="submit"
            className="bg-[#00646d] rounded-full"
          >
            {isLoading ? "Processing..." : "Claim Tokens"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
