
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, useRTDB } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Briefcase, Lock, Mail, User, Phone } from "lucide-react";

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
  const [role, setRole] = useState("korjob");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleAction = async () => {
    if (!auth || !rtdb) return;
    
    if (mode === "signup") {
      if (!name || name.length < 3) {
        toast({ variant: "destructive", title: "Хатогӣ", description: "Ном бояд на камтар аз 3 аломат бошад." });
        return;
      }
      if (!phone) {
        toast({ variant: "destructive", title: "Хатогӣ", description: "Рақами телефонро ворид кунед." });
        return;
      }
      if (password !== confirmPassword) {
        toast({ variant: "destructive", title: "Хатогӣ", description: "Паролҳо мувофиқат намекунанд." });
        return;
      }
      if (!agreedToTerms) {
        toast({ variant: "destructive", title: "Хатогӣ", description: "Лутфан ба шартҳои истифода розӣ шавед." });
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const encodedEmail = encodeURIComponent(email).replace(/\./g, '%2E');
        const userSnap = await get(ref(rtdb, `users/${encodedEmail}`));
        
        if (userSnap.exists() && userSnap.val().isBlocked) {
          toast({ variant: "destructive", title: "Ҳисоб блок шудааст", description: "Аккаунти шумо барои риоя накардани қоидаҳо блок карда шудааст." });
          setLoading(false);
          return;
        }

        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Хуш омадед!", description: "Шумо ворид шудед." });
        onAuthSuccess();
      } else if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const encodedEmail = encodeURIComponent(email).replace(/\./g, '%2E');
        await set(ref(rtdb, `users/${encodedEmail}`), {
          uid: cred.user.uid,
          name,
          email,
          phone,
          role,
          createdAt: new Date().toISOString(),
          lastSeen: Date.now(),
          warningCount: 0,
          reportsCount: 0,
          isBlocked: false
        });
        toast({ title: "Сабти ном шуд", description: "Хуш омадед ба KORYOB.TJ!" });
        onAuthSuccess();
      } else {
        await sendPasswordResetEmail(auth, email);
        toast({ title: "Ирсол шуд", description: "Пайванд ба почтаи шумо фиристода шуд." });
        setMode("login");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Почта ё парол нодуруст аст ё хатогии техникӣ рух дод." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col p-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-4 py-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-white shadow-sm">
          <ChevronLeft />
        </Button>
        <h2 className="text-xl font-black text-primary tracking-tight uppercase">
          {mode === "login" ? "Воридшавӣ" : mode === "signup" ? "Қайд шудан" : "Барқароркунӣ"}
        </h2>
      </header>

      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full pt-10 space-y-10">
        <div className="text-center space-y-4">
          <div className="bg-primary text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-primary/40 rotate-12">
            <Briefcase size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter">KORYOB.TJ</h1>
            <p className="text-muted-foreground font-bold">Ҷойи кори орзуи худро пайдо кунед</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-primary/5 space-y-6 border border-primary/5">
          {mode === "signup" && (
            <>
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Ном ва насаб</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                  <Input placeholder="Номи шумо" value={name} onChange={e => setName(e.target.value)} className="rounded-2xl h-14 pl-12 bg-secondary/10 border-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Рақами телефон</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                  <Input placeholder="+992 000 00 00 00" value={phone} onChange={e => setPhone(e.target.value)} className="rounded-2xl h-14 pl-12 bg-secondary/10 border-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Почтаи электронӣ</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
              <Input type="email" placeholder="example@mail.tj" value={email} onChange={e => setEmail(e.target.value)} className="rounded-2xl h-14 pl-12 bg-secondary/10 border-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Парол</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                <Input type="password" placeholder="******" value={password} onChange={e => setPassword(e.target.value)} className="rounded-2xl h-14 pl-12 bg-secondary/10 border-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          )}

          {mode === "signup" && (
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Такрори парол</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                <Input type="password" placeholder="******" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="rounded-2xl h-14 pl-12 bg-secondary/10 border-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          )}

          {mode === "signup" && (
            <>
              <div className="space-y-3 pt-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Шумо кистед?</Label>
                <RadioGroup value={role} onValueChange={setRole} className="flex gap-6">
                  <div className="flex items-center space-x-2 bg-secondary/10 p-4 rounded-2xl flex-1 cursor-pointer">
                    <RadioGroupItem value="korjob" id="korjob" />
                    <Label htmlFor="korjob" className="cursor-pointer font-black text-sm">Корҷӯй</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-secondary/10 p-4 rounded-2xl flex-1 cursor-pointer">
                    <RadioGroupItem value="korfarmo" id="korfarmo" />
                    <Label htmlFor="korfarmo" className="cursor-pointer font-black text-sm">Корфармо</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="bg-muted/30 p-6 rounded-[2rem] space-y-4 border">
                <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Сиёсати махфият ва Модераторӣ</Label>
                <ScrollArea className="h-32 text-[11px] text-muted-foreground leading-relaxed pr-3 font-medium">
                  <p>1. Ҷамъоварии маълумот: Мо танҳо ном, почта, телефон ва нақши шуморо ҷамъ меорем.</p>
                  <p>2. Паролҳо: Ҳамаи паролҳо рамзгузорӣ шудаанд.</p>
                  <p>3. **Модераторӣ**: Истифодаи дашном ва калимаҳои қабеҳ манъ аст.</p>
                  <p>4. **Блоккунӣ**: Баъди 3 огоҳӣ барои дашном ё 5 гузориш (report) аккаунт блок мешавад.</p>
                </ScrollArea>
                <div className="flex items-start space-x-3 pt-1">
                  <Checkbox 
                    id="terms" 
                    checked={agreedToTerms} 
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} 
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer font-black">
                    Ман ба <span className="text-primary underline">Шартҳои истифода</span> розӣ ҳастам.
                  </label>
                </div>
              </div>
            </>
          )}

          <Button onClick={handleAction} disabled={loading} className="w-full h-16 rounded-[1.5rem] text-xl font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
            {loading ? "Интизор шавед..." : mode === "login" ? "Ворид шудан" : mode === "signup" ? "Сабти ном" : "Ирсол"}
          </Button>

          <div className="text-center text-sm space-y-4 pt-4">
            {mode === "login" ? (
              <>
                <p className="font-bold text-muted-foreground">Ҳисоб надоред? <button onClick={() => setMode("signup")} className="text-primary font-black hover:underline">Қайд шудан</button></p>
                <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-primary transition-colors font-black text-xs uppercase tracking-widest">Паролро фаромӯш кардед?</button>
              </>
            ) : mode === "signup" ? (
              <p className="font-bold text-muted-foreground">Аллакай ҳисоб доред? <button onClick={() => setMode("login")} className="text-primary font-black hover:underline">Ворид шудан</button></p>
            ) : (
              <button onClick={() => setMode("login")} className="text-primary font-black hover:underline font-bold uppercase tracking-widest text-xs">Бозгашт ба воридшавӣ</button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
