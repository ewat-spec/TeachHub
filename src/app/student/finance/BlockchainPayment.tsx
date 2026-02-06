
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wallet, Copy, CheckCircle, Loader2, QrCode, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { convertKEStoADA, generateMockPaymentAddress, verifyCardanoTransaction } from "@/lib/cardano";
import { recordStudentPayment } from "./actions";

interface BlockchainPaymentProps {
  amountKES: number;
  studentId: string;
  onSuccess: () => void;
}

type PaymentStep = "details" | "verifying" | "success";

export function BlockchainPayment({ amountKES, studentId, onSuccess }: BlockchainPaymentProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<PaymentStep>("details");
  const [txHash, setTxHash] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");

  const adaAmount = convertKEStoADA(amountKES);
  const paymentAddress = generateMockPaymentAddress();

  const handleVerify = async () => {
    if (!txHash) return;

    setStep("verifying");
    setVerificationStatus("Connecting to Cardano node...");

    await new Promise(r => setTimeout(r, 1000));
    setVerificationStatus("Scanning blockchain for transaction...");

    const status = await verifyCardanoTransaction(txHash);

    if (status.success) {
      setVerificationStatus("Transaction found. Recording payment...");
      const result = await recordStudentPayment({
        studentId,
        amount: amountKES,
        paymentMethod: "Cardano (ADA)",
        description: `International Payment via Cardano (Hash: ${txHash.substring(0, 10)}...)`,
        reference: txHash
      });

      if (result.success) {
        setStep("success");
        toast({
          title: "Payment Confirmed",
          description: "Your payment has been successfully verified on the blockchain.",
          action: <CheckCircle className="text-green-500" />
        });
        setTimeout(onSuccess, 3000);
      } else {
        setStep("details");
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } else {
      setStep("details");
      toast({ title: "Verification Failed", description: status.message, variant: "destructive" });
    }
  };

  if (step === "verifying") {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
          <Zap className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold font-headline">Verifying Transaction</h3>
          <p className="text-muted-foreground animate-pulse">{verificationStatus}</p>
        </div>
        <div className="w-full max-w-xs bg-muted h-2 rounded-full overflow-hidden">
          <div className="bg-primary h-full animate-progress-indeterminate w-1/2 rounded-full" />
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold font-headline text-green-700">Payment Successful!</h3>
          <p className="text-muted-foreground">
            Transaction <span className="font-mono text-xs">{txHash.substring(0, 16)}...</span> has been confirmed.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">Refreshing your financial records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Step Indicator */}
      <div className="flex items-center justify-between px-4">
         <div className="flex flex-col items-center gap-1">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-lg">1</div>
            <span className="text-[10px] font-medium">Send ADA</span>
         </div>
         <div className="h-[2px] flex-1 bg-primary/20 mx-2" />
         <div className="flex flex-col items-center gap-1">
            <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold border-2">2</div>
            <span className="text-[10px] font-medium text-muted-foreground">Verify</span>
         </div>
         <div className="h-[2px] flex-1 bg-primary/20 mx-2" />
         <div className="flex flex-col items-center gap-1">
            <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold border-2">3</div>
            <span className="text-[10px] font-medium text-muted-foreground">Confirmed</span>
         </div>
      </div>

      <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4">
        <div className="flex justify-between items-center border-b border-primary/10 pb-2">
          <span className="text-sm font-medium flex items-center gap-2">
             <ShieldCheck className="h-4 w-4 text-primary" /> Secure Payment
          </span>
          <Badge variant="outline" className="bg-background">ADA Network</Badge>
        </div>
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Amount to Pay</p>
            <p className="text-lg font-bold">KES {amountKES.toLocaleString()}</p>
          </div>
          <div className="text-right space-y-1">
             <p className="text-xs text-muted-foreground">Equivalent ADA</p>
             <p className="text-2xl font-black text-primary">{adaAmount} ADA</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Receiving Wallet Address</Label>
          <div className="flex gap-2">
            <Input readOnly value={paymentAddress} className="font-mono text-xs bg-muted/30 focus-visible:ring-0" />
            <Button variant="secondary" size="icon" onClick={() => {
              navigator.clipboard.writeText(paymentAddress);
              toast({ title: "Address Copied", description: "Payment address copied to clipboard." });
            }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="txHash" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Transaction Hash (TxID)</Label>
          <div className="relative">
            <Input
              id="txHash"
              placeholder="Paste your transaction hash here..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="pl-9"
            />
            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Please copy the Transaction ID from your wallet after sending the payment. Verification usually takes less than 60 seconds.
          </p>
        </div>
      </div>

      <Button
        className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/20 group"
        disabled={!txHash}
        onClick={handleVerify}
      >
        Complete My Payment
        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
}
