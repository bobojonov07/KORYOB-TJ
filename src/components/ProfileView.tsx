"use client";

import { useMemo, useState } from "react";
import { UserProfile } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRTDBData, useRTDB, useAuth } from "@/firebase";
import { User, Briefcase, ChevronRight, Mail, Calendar, KeyRound, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ref, update } from "firebase/database";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface ProfileViewProps {
  profile?: UserProfile;
  onViewMyJobs: () => void;
  onEditJob: (id: string) => void;
}

export function ProfileView({ profile, onViewMyJobs, onEditJob }: ProfileViewProps) {
  const rtdb = useRTDB();
  const auth = useAuth();
  const { toast } = useToast();
  const { data: jobsObj } = useRTDBData("jobs");

  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [newName, setNewName] = useState(profile?.name || "");
  const [passData, setPassData] = useState({ current: "", new: "" });
  const [loading, setLoading] = useState(false);
  
  const myJobsCount = useMemo(() => {
    if (!jobsObj || !profile?.email) return 0;
    return Object.values(jobsObj).filter((j: any) => j.postedEmail === profile.email).length;
  }, [jobsObj, profile]);

  if (!profile) return null;

  const handleUpdateName = async () => {
    if (!newName.trim() || !rtdb) return;
    setLoading(true);
    try {
      const encodedEmail = encodeURIComponent(profile.email).replace(/\./g, '%2E');
      await update(ref(rtdb, `users/${encodedEmail}`), { name: newName });
      toast({ title: "Ном иваз шуд" });
      setIsNameModalOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Натавонистам номро иваз кунам" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passData.current || !passData.new || !auth.currentUser) return;
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(profile.email, passData.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passData.new);
      toast({ title: "Парол иваз шуд" });
      setIsPassModalOpen(false);
      setPassData({ current: "", new: "" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Пароли ҷорӣ нодуруст аст ё хатои техникӣ" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="flex flex-col items-center text-center space-y-4 bg-white p-10 rounded-[2.5rem] border shadow-sm">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-black border-4 border-white shadow-xl">
          {profile.name[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight">{profile.name}</h2>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-1">
            {profile.role === 'korfarmo' ? 'Корфармо' : 'Корҷуй'}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="rounded-[2rem] border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <User size={22} className="text-primary" /> Маълумоти умумӣ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={<Mail size={18} />} label="Почта" value={profile.email} />
            <InfoItem icon={<Calendar size={18} />} label="Санаи сабт" value={profile.createdAt ? format(new Date(profile.createdAt), "dd.MM.yyyy") : "—"} />
          </CardContent>
        </Card>

        {profile.role === 'korfarmo' && (
          <Card className="rounded-[2rem] border-primary/5 cursor-pointer hover:bg-primary/5 transition-all group shadow-sm" onClick={onViewMyJobs}>
            <CardHeader className="flex-row items-center justify-between space-y-0 p-6">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <Briefcase size={22} className="text-primary" /> Эълонҳои ман ({myJobsCount})
              </CardTitle>
              <ChevronRight className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardHeader>
          </Card>
        )}

        <Card className="rounded-[2rem] border-primary/5 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <KeyRound size={22} className="text-primary" /> Танзимот ва амният
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 border-t">
            <button 
              onClick={() => setIsNameModalOpen(true)}
              className="w-full flex items-center justify-between p-6 hover:bg-secondary/30 transition-colors border-b last:border-0"
            >
              <div className="flex items-center gap-3 font-bold">
                <Pencil size={18} className="text-muted-foreground" />
                Тағйир додани ном
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
            <button 
              onClick={() => setIsPassModalOpen(true)}
              className="w-full flex items-center justify-between p-6 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3 font-bold">
                <KeyRound size={18} className="text-muted-foreground" />
                Иваз кардани парол
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Name Modal */}
      <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Тағйири ном</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Номи нав</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} className="rounded-xl h-12" />
            </div>
            <Button onClick={handleUpdateName} disabled={loading} className="w-full h-12 rounded-xl font-bold">
              {loading ? "Сабт..." : "Сабт кардан"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Modal */}
      <Dialog open={isPassModalOpen} onOpenChange={setIsPassModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Ивази парол</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Пароли ҷорӣ</Label>
              <Input type="password" value={passData.current} onChange={e => setPassData({...passData, current: e.target.value})} className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Пароли нав</Label>
              <Input type="password" value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})} className="rounded-xl h-12" />
            </div>
            <Button onClick={handleChangePassword} disabled={loading} className="w-full h-12 rounded-xl font-bold">
              {loading ? "Иваз..." : "Иваз кардан"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b last:border-0 border-primary/5">
      <div className="flex items-center gap-3 text-muted-foreground font-bold text-sm">
        {icon}
        {label}
      </div>
      <div className="font-black text-sm">{value}</div>
    </div>
  );
}
