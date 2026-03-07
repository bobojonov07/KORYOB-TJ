
"use client";

import { useMemo, useState } from "react";
import { UserProfile } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRTDBData, useRTDB, useAuth } from "@/firebase";
import { User, Briefcase, ChevronRight, Mail, Calendar, KeyRound, Pencil, Info, ChevronLeft, Loader2, Phone, LogOut } from "lucide-react";
import { format } from "date-fns";
import { ref, update } from "firebase/database";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

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
  const { data: jobsObj } = useRTDBData("jobs");

  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [newName, setNewName] = useState(profile?.name || "");
  const [passData, setPassData] = useState({ current: "", new: "" });
  const [updateLoading, setUpdateLoading] = useState(false);
  
  const myJobsCount = useMemo(() => {
    if (!jobsObj || !profile?.email) return 0;
    return Object.values(jobsObj).filter((j: any) => j.postedEmail?.toLowerCase() === profile.email?.toLowerCase()).length;
  }, [jobsObj, profile]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">Боршавӣ...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="bg-secondary/20 p-8 rounded-full">
          <User size={64} className="text-muted-foreground/30" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black">Профил ёфт нашуд</h2>
          <p className="text-muted-foreground font-medium">Мутаассифона, маълумоти профили шуморо пайдо карда натавонистем.</p>
        </div>
        <Button onClick={onBack} variant="outline" className="rounded-2xl px-8 h-14 font-black">Бозгашт</Button>
      </div>
    );
  }

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

  const handleChangePassword = async () => {
    if (!passData.current || !passData.new || !auth.currentUser) return;
    setUpdateLoading(true);
    try {
      const credential = EmailAuthProvider.credential(profile.email, passData.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passData.new);
      toast({ title: "Парол иваз шуд" });
      setIsPassModalOpen(false);
      setPassData({ current: "", new: "" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Пароли ҷорӣ нодуруст аст" });
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
        <div className="flex flex-col items-center text-center space-y-4 bg-white p-10 rounded-[2.5rem] border shadow-sm border-primary/5">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-black border-4 border-white shadow-xl">
            {profile.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase">{profile.name}</h2>
            <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] mt-1 bg-secondary/50 px-3 py-1 rounded-lg">
              {profile.role === 'korfarmo' ? 'Корфармо' : 'Корҷӯ'}
            </p>
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
            </CardContent>
          </Card>

          {profile.role === 'korfarmo' && (
            <Card className="rounded-[2.5rem] border-primary/5 cursor-pointer hover:bg-primary/5 transition-all group shadow-sm border" onClick={onViewMyJobs}>
              <CardHeader className="flex-row items-center justify-between space-y-0 p-6">
                <CardTitle className="text-xl font-black flex items-center gap-3 tracking-tighter uppercase">
                  <div className="bg-primary/10 p-2.5 rounded-2xl text-primary"><Briefcase size={20} /></div>
                  Эълонҳои ман ({myJobsCount})
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
                Танзимот ва амният
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <button 
                onClick={() => setIsNameModalOpen(true)}
                className="w-full flex items-center justify-between p-6 hover:bg-secondary/30 transition-colors border-b last:border-0"
              >
                <div className="flex items-center gap-3 font-black text-sm uppercase tracking-widest text-muted-foreground">
                  <Pencil size={18} />
                  Тағйир додани ном
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
              <button 
                onClick={() => setIsPassModalOpen(true)}
                className="w-full flex items-center justify-between p-6 hover:bg-secondary/30 transition-colors border-b last:border-0"
              >
                <div className="flex items-center gap-3 font-black text-sm uppercase tracking-widest text-muted-foreground">
                  <KeyRound size={18} />
                  Иваз кардани парол
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
              <div className="p-6 bg-destructive/5">
                <Button 
                  onClick={onLogout}
                  variant="destructive"
                  className="w-full h-14 rounded-2xl gap-3 text-lg font-black shadow-lg shadow-destructive/20 uppercase tracking-tighter active:scale-95 transition-all"
                >
                  <LogOut size={20} /> Баромад аз ҳисоб
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm border-none p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tighter uppercase">Тағйири ном</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest ml-1 text-muted-foreground">Номи нав</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} className="rounded-xl h-12 bg-secondary/20 border-none font-bold" />
            </div>
            <Button onClick={handleUpdateName} disabled={updateLoading} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all">
              {updateLoading ? "Сабт..." : "Сабт кардан"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPassModalOpen} onOpenChange={setIsPassModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm border-none p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tighter uppercase">Ивази парол</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest ml-1 text-muted-foreground">Пароли ҷорӣ</Label>
              <Input type="password" value={passData.current} onChange={e => setPassData({...passData, current: e.target.value})} className="rounded-xl h-12 bg-secondary/20 border-none font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest ml-1 text-muted-foreground">Пароли нав</Label>
              <Input type="password" value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})} className="rounded-xl h-12 bg-secondary/20 border-none font-bold" />
            </div>
            <Button onClick={handleChangePassword} disabled={updateLoading} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all">
              {updateLoading ? "Иваз..." : "Иваз кардан"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
