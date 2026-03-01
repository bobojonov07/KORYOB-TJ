
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
  const [name, setName] = useState("");
  const [role, setRole] = useState("korjob");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleAction = async () => {
    if (!auth || !rtdb) return;
    
    if (mode === "signup" && !agreedToTerms) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Лутфан ба шартҳои истифода розӣ шавед." });
      return;
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
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-primary">
            {mode === "login" ? "Воридшавӣ" : mode === "signup" ? "Қайд шудан" : "Барқароркунии парол"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label>Ном ва насаб</Label>
              <Input placeholder="Ном" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Почтаи электронӣ (Email)</Label>
            <Input type="email" placeholder="example@mail.tj" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <Label>Парол</Label>
              <Input type="password" placeholder="******" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          )}

          {mode === "signup" && (
            <>
              <div className="space-y-3 pt-2">
                <Label>Шумо кистед?</Label>
                <RadioGroup value={role} onValueChange={setRole} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="korjob" id="korjob" />
                    <Label htmlFor="korjob" className="cursor-pointer">Корҷӯй</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="korfarmo" id="korfarmo" />
                    <Label htmlFor="korfarmo" className="cursor-pointer">Корфармо</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox 
                  id="terms" 
                  checked={agreedToTerms} 
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} 
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground leading-none cursor-pointer">
                  Ман ба <span className="text-primary font-bold">Сиёсати махфият</span> ва шартҳои истифода розӣ ҳастам.
                </label>
              </div>
            </>
          )}

          <Button onClick={handleAction} disabled={loading} className="w-full h-11 rounded-full text-lg shadow-md">
            {loading ? "Интизор шавед..." : mode === "login" ? "Ворид шудан" : mode === "signup" ? "Сабти ном" : "Ирсол"}
          </Button>

          <div className="text-center text-sm space-y-2">
            {mode === "login" ? (
              <>
                <p>Ҳисоб надоред? <button onClick={() => setMode("signup")} className="text-primary font-bold hover:underline">Қайд шудан</button></p>
                <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-primary transition-colors">Паролро фаромӯш кардед?</button>
              </>
            ) : mode === "signup" ? (
              <p>Аллакай ҳисоб доред? <button onClick={() => setMode("login")} className="text-primary font-bold hover:underline">Ворид шудан</button></p>
            ) : (
              <button onClick={() => setMode("login")} className="text-primary font-bold hover:underline">Бозгашт ба воридшавӣ</button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
