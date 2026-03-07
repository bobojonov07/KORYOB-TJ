
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, useRTDB } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Briefcase, Lock, Mail, User as UserIcon, Phone, UserCheck, Building2, ShieldCheck, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AuthViewProps {
  onBack: () => void;
  onAuthSuccess: () => void;
}

export function AuthView({ onBack, onAuthSuccess }: AuthViewProps) {
  const auth = useAuth();
  const rtdb = useRTDB();
  const { toast } = useToast();

  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"korjob" | "korfarmo">("korjob");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleAction = async () => {
    if (!auth || !rtdb) return;
    
    const cleanEmail = email.trim().toLowerCase();

    if (mode === "signup") {
      if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
        toast({ variant: "destructive", title: "Хатогӣ", description: "Лутфан тамоми майдонҳоро пур кунед." });
        return;
      }
      if (name.trim().length < 3) {
        toast({ variant: "destructive", title: "Хатои ном", description: "Ном бояд на камтар аз 3 аломат бошад." });
        return;
      }
      if (phone.replace(/\D/g, '').length < 9) {
        toast({ variant: "destructive", title: "Хатои телефон", description: "Рақами телефон бояд на камтар аз 9 рақам бошад." });
        return;
      }
      if (!validateEmail(cleanEmail)) {
        toast({ variant: "destructive", title: "Хатои почта", description: "Лутфан почтаи дурустро ворид кунед (масалан: example@mail.com)." });
        return;
      }
      if (password.length < 6) {
        toast({ variant: "destructive", title: "Хатои парол", description: "Парол бояд на камтар аз 6 аломат бошад." });
        return;
      }
      if (password !== confirmPassword) {
        toast({ variant: "destructive", title: "Хатои парол", description: "Паролҳо мувофиқат намекунанд." });
        return;
      }
      if (!agreedToTerms) {
        toast({ variant: "destructive", title: "Хатогӣ", description: "Лутфан ба шартҳо ва сиёсати махфият розӣ шавед." });
        return;
      }
    }

    if (mode === "login" && (!email || !password)) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Лутфан почта ва паролро ворид кунед." });
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const encodedEmail = encodeURIComponent(cleanEmail).replace(/\./g, '%2E');
        const userSnap = await get(ref(rtdb, `users/${encodedEmail}`));
        
        if (userSnap.exists() && userSnap.val().isBlocked) {
          toast({ variant: "destructive", title: "Блок шудааст", description: userSnap.val().blockReason || "Аккаунти шумо блок шудааст." });
          setLoading(false);
          return;
        }

        await signInWithEmailAndPassword(auth, cleanEmail, password);
        toast({ title: "Хуш омадед!", description: "Шумо ворид шудед." });
        onAuthSuccess();
      } else if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const encodedEmail = encodeURIComponent(cleanEmail).replace(/\./g, '%2E');
        await set(ref(rtdb, `users/${encodedEmail}`), {
          uid: cred.user.uid,
          name,
          email: cleanEmail,
          phone,
          role: role, 
          createdAt: new Date().toISOString(),
          lastSeen: Date.now(),
          warningCount: 0,
          reportsCount: 0,
          isBlocked: false,
          isPremium: false
        });
        toast({ title: "Хуш омадед!", description: "Сабти ном бомуваффақият гузашт." });
        onAuthSuccess();
      } else {
        if (!validateEmail(cleanEmail)) {
          toast({ variant: "destructive", title: "Хатогӣ", description: "Почтаи дурустро нависед." });
          setLoading(false);
          return;
        }
        await sendPasswordResetEmail(auth, cleanEmail);
        toast({ 
          title: "Ирсол шуд", 
          description: "Пайванд ба почтаи шумо фиристода шуд. Лутфан папкаи 'Spam'-ро низ тафтиш кунед." 
        });
        setMode("login");
      }
    } catch (error: any) {
      console.error(error);
      let msg = "Хатогии техникӣ ё маълумоти нодуруст.";
      if (error.code === 'auth/email-already-in-use') msg = "Ин почта аллакай истифода шудааст.";
      if (error.code === 'auth/wrong-password') msg = "Пароли нодуруст.";
      if (error.code === 'auth/user-not-found') msg = "Корбар ёфт нашуд.";
      
      toast({ variant: "destructive", title: "Хатогӣ", description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col p-4 animate-in fade-in duration-500 overflow-x-hidden">
      <header className="flex items-center gap-4 py-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-white shadow-sm">
          <ChevronLeft size={20} />
        </Button>
        <h2 className="text-lg font-black text-primary tracking-tight">
          {mode === "login" ? "Воридшавӣ" : mode === "signup" ? "Қайд шудан" : "Барқароркунӣ"}
        </h2>
      </header>

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full pt-6 space-y-6 pb-12">
        <div className="text-center space-y-3">
          <div className="bg-primary text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/30 rotate-3">
            <Briefcase size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter">KORYOB.TJ</h1>
            <p className="text-muted-foreground text-xs font-bold px-4 leading-relaxed">
              {mode === "signup" ? "Маълумоти худро ворид кунед" : mode === "login" ? "Ба ҳисоби худ ворид шавед" : "Почтаи худро нависед"}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl space-y-4 border border-primary/5">
          {mode === "signup" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setRole("korjob")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                    role === "korjob" ? "border-primary bg-primary/5 text-primary" : "border-secondary bg-secondary/20 text-muted-foreground"
                  )}
                >
                  <UserCheck size={24} />
                  <span className="text-xs font-black">Корҷӯ</span>
                </button>
                <button 
                  onClick={() => setRole("korfarmo")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                    role === "korfarmo" ? "border-primary bg-primary/5 text-primary" : "border-secondary bg-secondary/20 text-muted-foreground"
                  )}
                >
                  <Building2 size={24} />
                  <span className="text-xs font-black">Корфармо</span>
                </button>
              </div>
            </div>
          )}

          {mode === "signup" && (
            <>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground ml-1">Ном ва насаб (ҳадди ақал 3 ҳарф)</Label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
                  <Input placeholder="Номи шумо" value={name} onChange={e => setName(e.target.value)} className="rounded-xl h-12 pl-10 bg-secondary/10 border-none font-bold" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground ml-1">Рақами телефон (9 рақам)</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
                  <Input placeholder="931234567" value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl h-12 pl-10 bg-secondary/10 border-none font-bold" />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-muted-foreground ml-1">Почтаи электронӣ</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
              <Input type="email" placeholder="example@mail.com" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl h-12 pl-10 bg-secondary/10 border-none font-bold" />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-muted-foreground ml-1">Парол (ҳадди ақал 6 аломат)</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
                <Input type="password" placeholder="******" value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl h-12 pl-10 bg-secondary/10 border-none font-bold" />
              </div>
            </div>
          )}

          {mode === "signup" && (
            <>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground ml-1">Такрори парол</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
                  <Input type="password" placeholder="******" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="rounded-xl h-12 pl-10 bg-secondary/10 border-none font-bold" />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-[11px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <ScrollText size={14} /> Шартҳои истифода ва махфият
                </Label>
                <div className="border rounded-2xl bg-secondary/5 overflow-hidden">
                  <ScrollArea className="h-28 p-4 text-[10px] text-muted-foreground font-bold leading-relaxed text-justify">
                    <p className="mb-2">1. Масъулият: Шумо барои саҳеҳии маълумоти худ ва эълонҳое, ки нашр мекунед, пурра ҷавобгар ҳастед.</p>
                    <p className="mb-2">2. Эълонҳо: Нашри эълонҳои бардурӯғ, фиребгарона ва хилофи қонунҳои ҶТ қатъиян манъ аст.</p>
                    <p className="mb-2">3. Модератсия: Система ва маъмурият ҳуқуқ доранд, ки дар сурати вайрон кардани қоидаҳо, аккаунти шуморо бе огоҳӣ блок кунанд.</p>
                    <p className="mb-2">4. Маълумоти шахсӣ: Шумо розигӣ медиҳед, ки маълумоти шумо барои фаъолияти платформа ва тамос истифода шавад.</p>
                    <p className="mb-2">5. Бехатарӣ: Барои чеки қалбакӣ ва дашном дар чатҳо, аккаунт фавран ва якумрӣ блок карда мешавад.</p>
                    <p>6. Тағйирот: Маъмурият ҳуқуқ дорад шартҳоро дар ҳар вақт тағйир диҳад.</p>
                  </ScrollArea>
                </div>
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox 
                    id="terms" 
                    checked={agreedToTerms} 
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} 
                    className="mt-0.5"
                  />
                  <label htmlFor="terms" className="text-[11px] text-muted-foreground font-bold cursor-pointer leading-tight">
                    Ман шартҳои истифода ва сиёсати махфиятро пурра хондам ва ба онҳо розӣ ҳастам.
                  </label>
                </div>
              </div>
            </>
          )}

          <Button onClick={handleAction} disabled={loading} className="w-full h-12 rounded-xl text-md font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 mt-4">
            {loading ? "Интизор..." : mode === "login" ? "Ворид шудан" : mode === "signup" ? "Қайд шудан" : "Ирсол"}
          </Button>

          <div className="text-center pt-2">
            {mode === "login" ? (
              <div className="space-y-3">
                <p className="font-bold text-muted-foreground text-xs">Ҳисоб надоред? <button onClick={() => setMode("signup")} className="text-primary font-black">Қайд шудан</button></p>
                <button onClick={() => setMode("forgot")} className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest">Паролро фаромӯш кардам</button>
              </div>
            ) : (
              <p className="font-bold text-muted-foreground text-xs">Аллакай ҳисоб доред? <button onClick={() => setMode("login")} className="text-primary font-black">Ворид шудан</button></p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
