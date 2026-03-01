
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, useRTDB } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AuthModalsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModals({ isOpen, onClose }: AuthModalsProps) {
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
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Хуш омадед!", description: "Шумо ворид шудед." });
        onClose();
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
          lastSeen: Date.now()
        });
        toast({ title: "Сабти ном шуд", description: "Хуш омадед ба KORYOB.TJ!" });
        onClose();
      } else {
        await sendPasswordResetEmail(auth, email);
        toast({ title: "Ирсол шуд", description: "Пайванд ба почтаи шумо фиристода шуд." });
        setMode("login");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Почта ё парол нодуруст аст." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[2rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center text-primary">
            {mode === "login" ? "Воридшавӣ" : mode === "signup" ? "Қайд шудан" : "Барқароркунии парол"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {mode === "signup" && (
            <>
              <div className="space-y-1">
                <Label className="font-bold">Ном ва насаб</Label>
                <Input placeholder="Ном" value={name} onChange={e => setName(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold">Рақами телефон</Label>
                <Input placeholder="+992 000 00 00 00" value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl h-11" />
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label className="font-bold">Почтаи электронӣ (Email)</Label>
            <Input type="email" placeholder="example@mail.tj" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl h-11" />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1">
              <Label className="font-bold">Парол</Label>
              <Input type="password" placeholder="******" value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl h-11" />
            </div>
          )}

          {mode === "signup" && (
            <div className="space-y-1">
              <Label className="font-bold">Такрори парол</Label>
              <Input type="password" placeholder="******" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="rounded-xl h-11" />
            </div>
          )}

          {mode === "signup" && (
            <>
              <div className="space-y-3 pt-2">
                <Label className="font-bold">Шумо кистед?</Label>
                <RadioGroup value={role} onValueChange={setRole} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="korjob" id="korjob" />
                    <Label htmlFor="korjob" className="cursor-pointer font-medium">Корҷӯй</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="korfarmo" id="korfarmo" />
                    <Label htmlFor="korfarmo" className="cursor-pointer font-medium">Корфармо</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="bg-muted/30 p-4 rounded-2xl space-y-2 border">
                <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Сиёсати махфият</Label>
                <ScrollArea className="h-20 text-[11px] text-muted-foreground leading-relaxed pr-3">
                  <p>1. Ҷамъоварии маълумот: Мо танҳо ном, почта, телефон ва нақши шуморо ҷамъ меорем.</p>
                  <p>2. Паролҳо: Ҳамаи паролҳо рамзгузорӣ шудаанд ва ба касе дастрас нестанд.</p>
                  <p>3. Масъулият: Платформа танҳо барои пайваст кардани корбар ва корфармо мебошад.</p>
                  <p>4. Эълонҳо: Маълумоти дар эълонҳо буда оммавӣ мебошанд.</p>
                </ScrollArea>
                <div className="flex items-start space-x-2 pt-1">
                  <Checkbox 
                    id="terms" 
                    checked={agreedToTerms} 
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} 
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-none cursor-pointer font-medium">
                    Ман ба <span className="text-primary font-bold">Сиёсати махфият</span> ва шартҳо розӣ ҳастам.
                  </label>
                </div>
              </div>
            </>
          )}

          <Button onClick={handleAction} disabled={loading} className="w-full h-12 rounded-2xl text-lg font-black shadow-lg shadow-primary/20 transition-transform active:scale-95">
            {loading ? "Интизор шавед..." : mode === "login" ? "Ворид шудан" : mode === "signup" ? "Сабти ном" : "Ирсол"}
          </Button>

          <div className="text-center text-sm space-y-2 pt-2">
            {mode === "login" ? (
              <>
                <p className="font-medium text-muted-foreground">Ҳисоб надоред? <button onClick={() => setMode("signup")} className="text-primary font-bold hover:underline">Қайд шудан</button></p>
                <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-primary transition-colors font-bold text-xs">Паролро фаромӯш кардед?</button>
              </>
            ) : mode === "signup" ? (
              <p className="font-medium text-muted-foreground">Аллакай ҳисоб доред? <button onClick={() => setMode("login")} className="text-primary font-bold hover:underline">Ворид шудан</button></p>
            ) : (
              <button onClick={() => setMode("login")} className="text-primary font-bold hover:underline font-bold">Бозгашт ба воридшавӣ</button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
