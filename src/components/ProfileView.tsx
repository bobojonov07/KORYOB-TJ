
"use client";

import { useMemo, useState, useRef } from "react";
import { UserProfile } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  MessageCircle,
  Image as ImageIcon 
} from "lucide-react";
import { format } from "date-fns";
import { ref, update } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface ProfileViewProps {
  profile?: UserProfile | null;
  loading?: boolean;
  onViewMyJobs: () => void;
  onAbout: () => void;
  onBack: () => void;
  onLogout: () => void;
}

export function ProfileView({ profile, loading, onViewMyJobs, onAbout, onBack, onLogout }: ProfileViewProps) {
  const rtdb = useRTDB();
  const auth = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: jobsObj } = useRTDBData("jobs");

  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [newName, setNewName] = useState(profile?.name || "");
  const [passData, setPassData] = useState({ current: "", new: "" });
  const [updateLoading, setUpdateLoading] = useState(false);
  
  const myJobsCount = useMemo(() => {
    if (!jobsObj || !profile?.email) return 0;
    return Object.values(jobsObj).filter((j: any) => j.postedEmail?.toLowerCase() === profile.email?.toLowerCase() && j.active).length;
  }, [jobsObj, profile]);

  const isPremium = profile?.isPremium && profile?.premiumUntil && new Date(profile.premiumUntil) > new Date();

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

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && rtdb) {
      if (!isPremium) {
        toast({ variant: "destructive", title: "Танҳо барои Премиум", description: "Барои иловаи акс Премиум харед." });
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

  const buyPremium = async () => {
    if (!rtdb) return;
    setUpdateLoading(true);
    try {
      const encodedEmail = encodeURIComponent(profile.email.toLowerCase()).replace(/\./g, '%2E');
      const until = new Date();
      until.setMonth(until.getMonth() + 3);
      await update(ref(rtdb, `users/${encodedEmail}`), { 
        isPremium: true, 
        premiumUntil: until.toISOString() 
      });
      toast({ title: "Табрик!", description: "Режими ПРЕМИУМ фаъол шуд. Акнун имкониятҳои шумо бештар аст!" });
      setIsPremiumModalOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Натавонистам Премиумро фаъол кунам" });
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto md:py-6 space-y-6 h-full flex flex-col bg-[#FDFCFB]">
      <header className="md:hidden flex items-center gap-4 p-4 border-b bg-white sticky top-0 z-20">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-secondary/50">
          <ChevronLeft size={20} />
        </Button>
        <h2 className="text-lg font-black tracking-tight uppercase">Профил</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-0 space-y-6 pb-24">
        
        {/* Премиум фақат барои Корфармо нишон дода мешавад */}
        {!isPremium && profile.role === 'korfarmo' && (
          <div 
            onClick={() => setIsPremiumModalOpen(true)}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-[2rem] text-white flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-all shadow-xl shadow-orange-200"
          >
            <div className="space-y-1">
              <h3 className="font-black text-xl flex items-center gap-2"><Crown size={24} /> PREMIUM ХАРЕД</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">Имкониятҳои бештар: 5 эълон, аксҳо, чати 3000 аломат</p>
            </div>
            <ChevronRight />
          </div>
        )}

        <div className="flex flex-col items-center text-center space-y-4 bg-white p-10 rounded-[2.5rem] border shadow-sm border-primary/5">
          <div 
            onClick={() => {
              if (profile.role === 'korfarmo') fileInputRef.current?.click();
              else toast({ title: "Танҳо барои корфармоён", description: "Иловаи акс дар профил танҳо барои корфармоёни Премиум дастрас аст." });
            }}
            className="relative w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-black border-4 border-white shadow-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          >
            {profile.profileImage ? (
              <Image src={profile.profileImage} alt="Profile" fill className="object-cover" />
            ) : (
              profile.name?.[0]?.toUpperCase() || '?'
            )}
            <input type="file" ref={fileInputRef} onChange={handleProfileImageChange} accept="image/*" className="hidden" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase flex items-center justify-center gap-2">
              {profile.name}
              {isPremium && <Crown size={20} className="text-yellow-500 fill-yellow-500" />}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] bg-secondary/50 px-3 py-1 rounded-lg">
                {profile.role === 'korfarmo' ? 'Корфармо' : 'Корҷӯ'}
              </p>
              {isPremium && (
                <p className="bg-yellow-500 text-white font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded-lg">
                  VIP PREMIUM
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="rounded-[2.5rem] border-primary/5 shadow-sm border">
            <CardHeader>
              <CardTitle className="text-xl font-black flex items-center gap-3 tracking-tighter uppercase">
                <div className="bg-primary/10 p-2.5 rounded-2xl text-primary"><User size={20} /></div>
                Маълумоти умумӣ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoItem icon={<Mail size={18} />} label="Почта" value={profile.email} />
              <InfoItem icon={<Phone size={18} />} label="Телефон" value={profile.phone || "—"} />
              <InfoItem icon={<Calendar size={18} />} label="Санаи сабт" value={profile.createdAt ? format(new Date(profile.createdAt), "dd.MM.yyyy") : "—"} />
              {isPremium && (
                 <InfoItem icon={<Crown size={18} />} label="Мӯҳлати Премиум" value={profile.premiumUntil ? format(new Date(profile.premiumUntil), "dd.MM.yyyy") : "—"} />
              )}
            </CardContent>
          </Card>

          {profile.role === 'korfarmo' && (
            <Card className="rounded-[2.5rem] border-primary/5 cursor-pointer hover:bg-primary/5 transition-all group shadow-sm border" onClick={onViewMyJobs}>
              <CardHeader className="flex-row items-center justify-between space-y-0 p-6">
                <CardTitle className="text-xl font-black flex items-center gap-3 tracking-tighter uppercase">
                  <div className="bg-primary/10 p-2.5 rounded-2xl text-primary"><Briefcase size={20} /></div>
                  Эълонҳои ман ({myJobsCount} / {isPremium ? 5 : 1})
                </CardTitle>
                <ChevronRight className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </CardHeader>
            </Card>
          )}

          <Card className="rounded-[2.5rem] border-primary/5 cursor-pointer hover:bg-primary/5 transition-all group shadow-sm border" onClick={onAbout}>
            <CardHeader className="flex-row items-center justify-between space-y-0 p-6">
              <CardTitle className="text-xl font-black flex items-center gap-3 tracking-tighter uppercase">
                <div className="bg-primary/10 p-2.5 rounded-2xl text-primary"><Info size={20} /></div>
                Дар бораи барнома
              </CardTitle>
              <ChevronRight className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardHeader>
          </Card>

          <Card className="rounded-[2.5rem] border-primary/5 shadow-sm border overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-black flex items-center gap-3 tracking-tighter uppercase">
                <div className="bg-primary/10 p-2.5 rounded-2xl text-primary"><KeyRound size={20} /></div>
                Танзимот
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <button onClick={() => setIsNameModalOpen(true)} className="w-full flex items-center justify-between p-6 hover:bg-secondary/30 transition-colors border-b last:border-0">
                <div className="flex items-center gap-3 font-black text-sm uppercase tracking-widest text-muted-foreground"><Pencil size={18} /> Тағйир додани ном</div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
              <button onClick={() => setIsPassModalOpen(true)} className="w-full flex items-center justify-between p-6 hover:bg-secondary/30 transition-colors border-b last:border-0">
                <div className="flex items-center gap-3 font-black text-sm uppercase tracking-widest text-muted-foreground"><KeyRound size={18} /> Иваз кардани парол</div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
              <div className="p-6 bg-destructive/5">
                <Button onClick={onLogout} variant="destructive" className="w-full h-14 rounded-2xl gap-3 text-lg font-black shadow-lg shadow-destructive/20 uppercase tracking-tighter active:scale-95 transition-all">
                  <LogOut size={20} /> Баромад аз ҳисоб
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm border-none p-0 overflow-hidden bg-white">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 text-white text-center space-y-4">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
              <Crown size={32} />
            </div>
            <h3 className="text-3xl font-black tracking-tighter">VIP PREMIUM</h3>
            <p className="text-sm font-bold opacity-90 leading-relaxed">Платформаро бо тамоми имкониятҳояш истифода баред!</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
               <PremiumBenefit icon={<Briefcase size={16}/>} label="Нашри то 5 эълони фаъол" />
               <PremiumBenefit icon={<ImageIcon size={16}/>} label="Иловаи акс ба профил ва эълонҳо" />
               <PremiumBenefit icon={<MessageCircle size={16}/>} label="Лимити чат: 3000 аломат" />
               <PremiumBenefit icon={<Sparkles size={16}/>} label="Эълони шумо дар аввали рӯйхат (VIP)" />
            </div>
            <div className="pt-4 border-t text-center space-y-4">
               <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Нарх</p>
                  <p className="text-3xl font-black text-primary">20 TJS / 3 моҳ</p>
               </div>
               <Button onClick={buyPremium} disabled={updateLoading} className="w-full h-14 rounded-2xl text-md font-black shadow-xl shadow-primary/20 bg-primary active:scale-95 transition-all">
                 {updateLoading ? "Фаъол шуда истодааст..." : "ҲОЛО ХАРИДАН"}
               </Button>
               <p className="text-[9px] text-muted-foreground font-bold italic leading-tight">Барои пардохт метавонед бо рақами +992 200 70 20 32 дар тамос шавед.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm border-none p-8">
          <DialogHeader><DialogTitle className="text-xl font-black tracking-tighter uppercase">Тағйири ном</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest ml-1 text-muted-foreground">Номи нав</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} className="rounded-xl h-12 bg-secondary/20 border-none font-bold" />
            </div>
            <Button onClick={handleUpdateName} disabled={updateLoading} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs">
              {updateLoading ? "Сабт..." : "Сабт кардан"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPassModalOpen} onOpenChange={setIsPassModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm border-none p-8">
          <DialogHeader><DialogTitle className="text-xl font-black tracking-tighter uppercase">Ивази парол</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest ml-1 text-muted-foreground">Пароли нав</Label>
              <Input type="password" value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})} className="rounded-xl h-12 bg-secondary/20 border-none font-bold" />
            </div>
            <Button onClick={() => setIsPassModalOpen(false)} disabled={updateLoading} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs">
              Сабт кардан
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PremiumBenefit({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs font-bold text-foreground">
      <div className="bg-yellow-100 text-yellow-600 p-1.5 rounded-lg">{icon}</div>
      {label}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-4 border-b last:border-0 border-primary/5">
      <div className="flex items-center gap-3 text-muted-foreground font-black text-[10px] uppercase tracking-widest">
        <div className="text-primary/60">{icon}</div>
        {label}
      </div>
      <div className="font-black text-sm text-foreground tracking-tight">{value}</div>
    </div>
  );
}
