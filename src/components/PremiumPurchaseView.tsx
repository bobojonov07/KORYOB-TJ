
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRTDB, useUser, useRTDBData } from "@/firebase";
import { ref, push, set } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Crown, CreditCard, Copy, ImageIcon, CheckCircle2, Loader2, X, Sparkles } from "lucide-react";
import Image from "next/image";
import { UserProfile } from "@/app/lib/types";

interface PremiumPurchaseViewProps {
  onBack: () => void;
}

export function PremiumPurchaseView({ onBack }: PremiumPurchaseViewProps) {
  const rtdb = useRTDB();
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [receipt, setReceipt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const encodedEmail = user?.email ? encodeURIComponent(user.email.toLowerCase()).replace(/\./g, '%2E') : null;
  const { data: profile } = useRTDBData(encodedEmail ? `users/${encodedEmail}` : null) as { data: UserProfile | null };

  const handleCopy = () => {
    navigator.clipboard.writeText("975638778");
    toast({ title: "Нусхабардорӣ шуд", description: "Рақами корт нусхабардорӣ шуд." });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Хатогӣ", description: "Ҳаҷми акс аз 2МБ зиёд набошад." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setReceipt(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!receipt || !user || !rtdb || !profile) return;
    setLoading(true);
    try {
      const requestRef = push(ref(rtdb, "premiumRequests"));
      await set(requestRef, {
        uid: user.uid,
        email: user.email,
        userName: profile.name,
        receiptImage: receipt,
        timestamp: Date.now(),
        status: 'pending'
      });
      setSubmitted(true);
      toast({ title: "Фиристода шуд", description: "Дархости шумо қабул шуд." });
    } catch (e) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Натавонистам дархостро фиристам." });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="bg-green-500/20 p-8 rounded-full animate-pulse">
          <CheckCircle2 size={80} className="text-green-500" />
        </div>
        <div className="space-y-4 max-w-sm">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">ДАРХОСТ ҚАБУЛ ШУД!</h2>
          <p className="text-gray-400 font-bold leading-relaxed">
            Ташаккур! Мо дархости шуморо дар давоми 24 соат тафтиш карда, режими ПРЕМИУМ-ро фаъол месозем.
          </p>
        </div>
        <Button onClick={onBack} className="w-full max-w-xs h-14 rounded-2xl font-black text-lg bg-white text-black hover:bg-gray-200">
          БА ГЛАВНИЙ
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col animate-in fade-in duration-500">
      <header className="p-4 flex items-center gap-4 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full text-white hover:bg-white/10">
          <ChevronLeft size={24} />
        </Button>
        <h2 className="text-white font-black text-lg uppercase tracking-widest">ХАРИДИ ПРЕМИУМ</h2>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full space-y-8 pb-20">
        <div className="text-center space-y-2">
          <div className="bg-gradient-to-tr from-yellow-400 to-orange-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(255,123,0,0.3)] rotate-6">
            <Crown size={40} className="text-white fill-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase pt-4">VIP STATUS</h1>
          <p className="text-gray-500 text-xs font-black tracking-widest uppercase">20 TJS / 3 МОҲ</p>
        </div>

        <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardHeader className="border-b border-white/5 p-8">
            <CardTitle className="text-white text-xl font-black flex items-center gap-3">
              <CreditCard className="text-yellow-500" /> ДАСТУРИ ПАРДОХТ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Корти мо (Душанбе Сити)</span>
                <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                  <span className="text-xl font-black text-white tracking-widest">975638778</span>
                  <Button variant="ghost" size="icon" onClick={handleCopy} className="text-yellow-500 hover:bg-yellow-500/10">
                    <Copy size={20} />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Соҳиби корт</span>
                <p className="text-lg font-black text-white">Б.А</p>
              </div>
            </div>

            <div className="p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
              <p className="text-xs text-yellow-500 font-bold leading-relaxed">
                <span className="font-black">ДИҚҚАТ:</span> Маблағро гузаронед ва акси (чек)-ро дар поён илова кунед. Мо дар давоми 24 соат премиумро фаъол мекунем.
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">ИЛОВАИ АКСИ ЧЕК</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative h-48 w-full border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all overflow-hidden"
              >
                {receipt ? (
                  <>
                    <Image src={receipt} alt="Receipt" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <X className="text-white" size={32} />
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="bg-white/5 p-4 rounded-2xl inline-block">
                      <ImageIcon className="text-gray-600" size={32} />
                    </div>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">АКСРО ИНТИХОБ КУНЕД</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={loading || !receipt}
              className="w-full h-16 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg shadow-[0_10px_30px_rgba(234,179,8,0.2)] active:scale-95 transition-all uppercase tracking-tighter"
            >
              {loading ? <Loader2 className="animate-spin" /> : "ФИРИСТОДАНИ ЧЕК"}
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 text-gray-600">
           <Sparkles size={14} />
           <span className="text-[10px] font-black uppercase tracking-widest">KORYOB.TJ PREMIUM SERVICE</span>
        </div>
      </main>
    </div>
  );
}
