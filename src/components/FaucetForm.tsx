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
      className="space-y-4"
    >
      <div className="grid grid-cols-5 gap-4">
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white rounded-md w-full">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="ETH" className="text-white">0.03 ETH</SelectItem>
                  <SelectItem value="MORPHSTABLE" className="text-white">10 MORPH USDT</SelectItem>
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
            <FormItem className="col-span-3">
              <FormControl>
                <Input
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-md w-full"
                  placeholder="Wallet Address"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
  
      <Button
        size="lg"
        disabled={isLoading}
        type="submit"
        className="w-full bg-white text-black hover:bg-gray-200 rounded-md"
      >
        {isLoading ? "Processing..." : `Send ${form.watch('token') === 'ETH' ? '0.01 ETH' : '10 MORPH USDT'}`}
      </Button>
  
      <HCaptcha
        sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY as string}
        onVerify={onCaptchaVerify}
        ref={captchaRef}
        size="invisible"
      />
    </form>
  </Form>
  );
}
