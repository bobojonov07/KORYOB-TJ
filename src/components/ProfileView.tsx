
"use client";

import { useMemo, useState, useRef } from "react";
import { UserProfile } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRTDBData, useRTDB, useAuth } from "@/firebase";
import { 
  User, 
  Briefcase, 
  ChevronRight, 
  Mail, 
  Calendar, 
  KeyRound, 
  Pencil, 
  Info, 
  ChevronLeft, 
  Loader2, 
  Phone, 
  LogOut, 
  Crown, 
  Sparkles,
  Settings2,
  Bell
} from "lucide-react";
import { format, isValid } from "date-fns";
import { ref, update } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

interface ProfileViewProps {
  profile?: UserProfile | null;
  isPremium?: boolean;
  loading?: boolean;
  onViewMyJobs: () => void;
  onAbout: () => void;
  onBack: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
}

export function ProfileView({ profile, isPremium, loading, onViewMyJobs, onAbout, onBack, onLogout, onUpgrade }: ProfileViewProps) {
  const rtdb = useRTDB();
  const auth = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: jobsObj } = useRTDBData("jobs");

  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [newName, setNewName] = useState(profile?.name || "");
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" });
  const [updateLoading, setUpdateLoading] = useState(false);
  
  const myJobsCount = useMemo(() => {
    if (!jobsObj || !profile?.email) return 0;
    return Object.values(jobsObj).filter((j: any) => j.postedEmail?.toLowerCase() === profile.email?.toLowerCase() && j.active).length;
  }, [jobsObj, profile]);

  const formattedPremiumDate = useMemo(() => {
    if (profile?.premiumUntil) {
      const date = new Date(profile.premiumUntil);
      if (isValid(date)) return format(date, "dd.MM.yyyy");
    }
    if (isPremium) return "3 моҳ (Стандарт)";
    return "—";
  }, [profile?.premiumUntil, isPremium]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">Боршавӣ...</p>
      </div>
    );
  }

  if (!profile) return null;

  const handleUpdateName = async () => {
    if (!newName.trim() || !rtdb) return;
    setUpdateLoading(true);
    try {
      const encodedEmail = encodeURIComponent(profile.email.toLowerCase()).replace(/\./g, '%2E');
      await update(ref(rtdb, `users/${encodedEmail}`), { name: newName });
      toast({ title: "Ном иваз шуд" });
      setIsNameModalOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Натавонистам номро иваз кунам" });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!rtdb || !profile.email) return;
    try {
      const encodedEmail = encodeURIComponent(profile.email.toLowerCase()).replace(/\./g, '%2E');
      await update(ref(rtdb, `users/${encodedEmail}`), { notificationsEnabled: enabled });
      toast({ 
        title: enabled ? "Огоҳиномаҳо фаъол шуданд" : "Огоҳиномаҳо хомӯш шуданд",
        description: enabled ? "Акнун шумо паёмҳои навро дар браузер мебинед." : "Шумо дигар дар браузер огоҳинома намегиред."
      });

      if (enabled && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Натавонистам танзимотро иваз кунам" });
    }
  };

  const handleUpdatePasswordAction = async () => {
    if (!auth.currentUser || !profile.email) return;
    
    if (!passData.current || !passData.new || !passData.confirm) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Ҳамаи майдонҳоро пур кунед" });
      return;
    }

    if (passData.new !== passData.confirm) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Пароли нав мувофиқат намекунад" });
      return;
    }

    if (passData.new.length < 6) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Пароли нав бояд на камтар аз 6 аломат бошад" });
      return;
    }

    setUpdateLoading(true);
    try {
      const credential = EmailAuthProvider.credential(profile.email, passData.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passData.new);
      
      toast({ title: "Муваффақият", description: "Пароли шумо иваз шуд" });
      setIsPassModalOpen(false);
      setPassData({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Хатогӣ", description: "Пароли ҷорӣ нодуруст аст ё хатогии техникӣ" });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && rtdb) {
      if (!isPremium) {
        toast({ variant: "destructive", title: "Танҳо барои Премиум", description: "Барои иловаи акс дар профил Премиум харед." });
        return;
      }
      if (file.size > 1024 * 1024) {
        toast({ variant: "destructive", title: "Акс калон аст", description: "Ҳаҷми акс набояд аз 1МБ зиёд бошад." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const encodedEmail = encodeURIComponent(profile.email.toLowerCase()).replace(/\./g, '%2E');
        await update(ref(rtdb, `users/${encodedEmail}`), { profileImage: reader.result as string });
        toast({ title: "Акс навсозӣ шуд" });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto md:py-8 space-y-6 h-full flex flex-col bg-[#FDFCFB] animate-in fade-in duration-700 overflow-x-hidden w-full">
      <header className="md:hidden flex items-center gap-4 p-5 border-b bg-white sticky top-0 z-30 shadow-sm w-full">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-secondary/50 h-10 w-10">
          <ChevronLeft size={20} />
        </Button>
        <h2 className="text-xl font-black tracking-tighter uppercase">Профил</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-0 space-y-8 pb-32 w-full">
        
        {!isPremium && profile.role === 'korfarmo' && (
          <div 
            onClick={onUpgrade}
            className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 p-8 rounded-[3rem] text-white flex items-center justify-between cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-orange-200 relative overflow-hidden group w-full"
          >
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/20 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
            <div className="space-y-2 relative z-10">
              <h3 className="font-black text-2xl flex items-center gap-3 uppercase tracking-tighter">
                <Crown size={32} className="fill-white" /> ПРЕМИУМ ХАРЕД
              </h3>
              <p className="text-xs font-black uppercase tracking-widest opacity-90">Лимити то 5 эълон + Акси профил + VIP Статус</p>
            </div>
            <ChevronRight className="relative z-10 w-8 h-8" />
          </div>
        )}

        <div className={cn(
          "relative flex flex-col items-center text-center p-12 rounded-[3.5rem] border shadow-2xl transition-all duration-700 overflow-hidden w-full max-w-full",
          isPremium 
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black border-yellow-500/30" 
            : "bg-white border-primary/5"
        )}>
          {isPremium && (
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,123,0,0.4),transparent)]"></div>
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-yellow-500/20 rounded-full blur-[100px]"></div>
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px]"></div>
            </div>
          )}

          <div className="relative z-10">
            <div 
              onClick={() => {
                if (isPremium) fileInputRef.current?.click();
                else toast({ variant: "destructive", title: "Танҳо барои Премиум", description: "Иловаи акс дар профил баъд аз хариди Премиум дастрас мешавад." });
              }}
              className={cn(
                "relative w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-5xl font-black border-4 shadow-2xl overflow-hidden cursor-pointer transition-all duration-500 group",
                isPremium 
                  ? "border-yellow-400 bg-gray-800 hover:scale-105" 
                  : "border-white bg-primary/10 opacity-70 grayscale"
              )}
            >
              {profile.profileImage ? (
                <Image src={profile.profileImage} alt="Profile" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <span className={isPremium ? "text-yellow-400" : "text-primary"}>
                  {profile.name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
              {!isPremium && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                   <KeyRound size={40} className="text-white opacity-80" />
                </div>
              )}
              {isPremium && (
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Pencil className="text-white w-8 h-8" />
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleProfileImageChange} accept="image/*" className="hidden" />
            </div>
            {isPremium && (
              <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white p-2 rounded-2xl shadow-xl border-2 border-gray-900 animate-bounce">
                <Crown size={20} fill="currentColor" />
              </div>
            )}
          </div>

          <div className="relative z-10 mt-8 space-y-3 w-full">
            <h2 className={cn(
              "text-2xl md:text-4xl font-black tracking-tighter uppercase flex items-center justify-center gap-3 break-words px-4",
              isPremium ? "text-white" : "text-foreground"
            )}>
              {profile.name}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3 px-4">
              <p className={cn(
                "font-black uppercase tracking-widest text-[10px] px-4 py-1.5 rounded-xl border",
                isPremium 
                  ? "bg-white/10 text-white border-white/20" 
                  : "bg-secondary/50 text-muted-foreground border-primary/5"
              )}>
                {profile.role === 'korfarmo' ? 'Корфармо' : 'Корҷӯ'}
              </p>
              {isPremium && (
                <p className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black uppercase tracking-widest text-[10px] px-4 py-1.5 rounded-xl flex items-center gap-2 shadow-lg shadow-yellow-500/20">
                  <Sparkles size={12} fill="currentColor" /> VIP ПРЕМИУМ
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 w-full">
          <Card className="rounded-[3rem] border-primary/5 shadow-xl border overflow-hidden bg-white w-full">
            <CardHeader className="bg-secondary/20 p-6 md:p-8 border-b border-primary/5">
              <CardTitle className="text-xl font-black flex items-center gap-4 tracking-tighter uppercase text-primary">
                <div className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20"><User size={20} /></div>
                МАЪЛУМОТИ ПРОФИЛ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-2">
              <InfoItem icon={<Mail size={20} />} label="Почта" value={profile.email} />
              <InfoItem icon={<Phone size={20} />} label="Телефон" value={profile.phone || "—"} />
              <InfoItem icon={<Calendar size={20} />} label="Санаи сабт" value={profile.createdAt ? format(new Date(profile.createdAt), "dd.MM.yyyy") : "—"} />
              {isPremium && (
                 <InfoItem icon={<Crown size={20} />} label="Мӯҳлати Премиум" value={formattedPremiumDate} />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-primary/5 shadow-xl border overflow-hidden bg-white w-full">
            <CardHeader className="bg-secondary/20 p-6 md:p-8 border-b border-primary/5">
              <CardTitle className="text-xl font-black flex items-center gap-4 tracking-tighter uppercase text-primary">
                <div className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20"><Settings2 size={20} /></div>
                ТАНЗИМОТИ ҲИСОБ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full flex items-center justify-between p-6 md:p-8 border-b group">
                <div className="flex items-center gap-4 font-black text-sm uppercase tracking-widest text-foreground">
                  <Bell size={20} className="text-primary" /> ОГОҲИНОМАҲО
                </div>
                <Switch 
                  checked={profile.notificationsEnabled !== false} 
                  onCheckedChange={handleToggleNotifications}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              <button onClick={() => setIsNameModalOpen(true)} className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-primary hover:text-white transition-all duration-300 border-b last:border-0 group">
                <div className="flex items-center gap-4 font-black text-sm uppercase tracking-widest"><Pencil size={20} className="text-primary group-hover:text-white" /> ТАҒЙИРИ НОМ</div>
                <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
              <button onClick={() => {
                setPassData({ current: "", new: "", confirm: "" });
                setIsPassModalOpen(true);
              }} className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-primary hover:text-white transition-all duration-300 border-b last:border-0 group">
                <div className="flex items-center gap-4 font-black text-sm uppercase tracking-widest"><KeyRound size={20} className="text-primary group-hover:text-white" /> ИВАЗИ ПАРОЛ</div>
                <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
              <div className="p-8 md:p-10 bg-destructive/5 w-full">
                <Button onClick={onLogout} variant="destructive" className="w-full h-16 rounded-[1.5rem] gap-4 text-xl font-black shadow-2xl shadow-destructive/30 uppercase tracking-tighter active:scale-95 transition-all">
                  <LogOut size={24} /> БАРОМАД АЗ ҲИСОБ
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6 w-full">
            {profile.role === 'korfarmo' && (
              <Card className="rounded-[2.5rem] border-primary/5 cursor-pointer hover:bg-primary hover:text-white transition-all duration-500 group shadow-xl border bg-white" onClick={onViewMyJobs}>
                <CardHeader className="flex-row items-center justify-between space-y-0 p-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 group-hover:bg-white/20 p-3 rounded-2xl text-primary group-hover:text-white transition-colors">
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black tracking-tighter uppercase">ЭЪЛОНҲОИ МАН</CardTitle>
                      <p className="text-[10px] font-black uppercase opacity-60">Ҳамагӣ: {myJobsCount} / {isPremium ? 5 : 1}</p>
                    </div>
                  </div>
                  <ChevronRight className="group-hover:translate-x-2 transition-transform" />
                </CardHeader>
              </Card>
            )}

            <Card className="rounded-[2.5rem] border-primary/5 cursor-pointer hover:bg-primary hover:text-white transition-all duration-500 group shadow-xl border bg-white" onClick={onAbout}>
              <CardHeader className="flex-row items-center justify-between space-y-0 p-8">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 group-hover:bg-white/20 p-3 rounded-2xl text-primary group-hover:text-white transition-colors">
                    <Info size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black tracking-tighter uppercase">ОИДИ БАРНОМА</CardTitle>
                    <p className="text-[10px] font-black uppercase opacity-60">KORYOB.TJ v2.0</p>
                  </div>
                </div>
                <ChevronRight className="group-hover:translate-x-2 transition-transform" />
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm border-none p-10">
          <DialogHeader><DialogTitle className="text-2xl font-black tracking-tighter uppercase text-primary">Тағйири ном</DialogTitle></DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest ml-1 text-muted-foreground">Номи нави шумо</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} className="rounded-2xl h-14 bg-secondary/30 border-none font-bold text-lg" />
            </div>
            <Button onClick={handleUpdateName} disabled={updateLoading} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20">
              {updateLoading ? "САБТ..." : "САБТ КАРДАН"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPassModalOpen} onOpenChange={setIsPassModalOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm border-none p-10">
          <DialogHeader><DialogTitle className="text-2xl font-black tracking-tighter uppercase text-primary">Ивази парол</DialogTitle></DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest ml-1 text-muted-foreground">Пароли пешина</Label>
              <Input type="password" value={passData.current} onChange={e => setPassData({...passData, current: e.target.value})} className="rounded-2xl h-14 bg-secondary/30 border-none font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest ml-1 text-muted-foreground">Пароли нав</Label>
              <Input type="password" value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})} className="rounded-2xl h-14 bg-secondary/30 border-none font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest ml-1 text-muted-foreground">Такрори пароли нав</Label>
              <Input type="password" value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})} className="rounded-2xl h-14 bg-secondary/30 border-none font-bold" />
            </div>
            <Button onClick={handleUpdatePasswordAction} disabled={updateLoading} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20">
              {updateLoading ? "Интизор..." : "ИВАЗ КАРДАН"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4 md:py-6 border-b last:border-0 border-primary/5 gap-2">
      <div className="flex items-center gap-4 text-muted-foreground font-black text-[11px] uppercase tracking-widest">
        <div className="text-primary/60">{icon}</div>
        {label}
      </div>
      <div className="font-black text-sm text-foreground tracking-tight break-all md:text-right">{value}</div>
    </div>
  );
}
