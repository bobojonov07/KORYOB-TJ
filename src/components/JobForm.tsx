
"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRTDB, useUser, useRTDBData } from "@/firebase";
import { ref, push, set, update, get, runTransaction } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";
import { containsForbiddenWords, MODERATION_RULES } from "@/app/lib/moderation";

interface JobFormProps {
  jobId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function JobForm({ jobId, onSuccess, onCancel }: JobFormProps) {
  const rtdb = useRTDB();
  const { user } = useUser();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    city: "",
    salary: "",
    hours: "",
    age: "",
    phone: "",
    gender: "Фарқ надорад",
    desc: "",
  });

  const encodedEmail = user?.email ? encodeURIComponent(user.email.toLowerCase()).replace(/\./g, '%2E') : null;
  const { data: profile } = useRTDBData(encodedEmail ? `users/${encodedEmail}` : null) as { data: UserProfile | null };

  useEffect(() => {
    if (jobId && rtdb) {
      const loadJob = async () => {
        const snap = await get(ref(rtdb, `jobs/${jobId}`));
        if (snap.exists()) {
          const data = snap.val();
          setFormData({
            title: data.title || "",
            company: data.company || "",
            city: data.city || "",
            salary: data.salary || "",
            hours: data.hours || "",
            age: data.age || "",
            phone: data.phone || "",
            gender: data.gender || "Фарқ надорад",
            desc: data.desc || "",
          });
        }
      };
      loadJob();
    }
  }, [jobId, rtdb]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !rtdb) return;

    if (profile.isBlocked) {
      toast({ variant: "destructive", title: "Ҳисоб блок шудааст", description: "Шумо эълон нашр карда наметавонед." });
      return;
    }

    // 1. Санҷиши пур будани тамоми майдонҳои асосӣ (Ягон сатр набояд холӣ бошад)
    if (
      !formData.title.trim() || 
      !formData.company.trim() || 
      !formData.city.trim() || 
      !formData.salary.trim() || 
      !formData.hours.trim() || 
      !formData.age.trim() || 
      !formData.phone.trim() || 
      !formData.desc.trim()
    ) {
      toast({ 
        variant: "destructive", 
        title: "Хатогӣ", 
        description: "Лутфан тамоми майдонҳоро пур кунед. Ҳеҷ сатр набояд холӣ бошад." 
      });
      return;
    }

    // 2. Валидатсияи рақами телефон (танҳо рақам ва на камтар аз 9 аломат)
    const cleanPhone = formData.phone.replace(/\s+/g, '').replace(/\+/g, '');
    if (!/^\d{9,}$/.test(cleanPhone)) {
      toast({ 
        variant: "destructive", 
        title: "Хатои телефон", 
        description: "Рақами телефон бояд танҳо аз рақамҳо иборат бошад ва на камтар аз 9 аломат." 
      });
      return;
    }

    // 3. Модераторӣ
    if (containsForbiddenWords(formData.title) || containsForbiddenWords(formData.desc)) {
      const userRef = ref(rtdb, `users/${encodedEmail}`);
      await runTransaction(userRef, (userData) => {
        if (userData) {
          userData.warningCount = (userData.warningCount || 0) + 1;
          if (userData.warningCount >= MODERATION_RULES.MAX_WARNINGS) {
            userData.isBlocked = true;
          }
        }
        return userData;
      });

      toast({ 
        variant: "destructive", 
        title: "Огоҳӣ!", 
        description: "Дар эълони шумо калимаҳои ноҷо ҳастанд. Аккаунт метавонад блок шавад." 
      });
      return;
    }

    setLoading(true);
    try {
      if (jobId) {
        await update(ref(rtdb, `jobs/${jobId}`), { ...formData });
      } else {
        const jobsRef = ref(rtdb, "jobs");
        const newJobRef = push(jobsRef);
        await set(newJobRef, {
          ...formData,
          postedBy: profile.name,
          postedEmail: profile.email,
          postedUid: user.uid,
          postedAt: new Date().toISOString(),
          active: true,
          views: 0,
        });
      }

      toast({ title: jobId ? "Эълон навсозӣ шуд" : "Эълон нашр шуд" });
      onSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Натавонистам эълонро сабт кунам." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-8">
      <Button variant="ghost" onClick={onCancel} className="mb-4 gap-2 font-bold">
        <ArrowLeft size={16} /> Бозгашт
      </Button>

      <Card className="border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-primary text-white p-8">
          <CardTitle className="text-2xl font-black">{jobId ? "Таҳрири эълон" : "Эълони нав эҷод кунед"}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-10 space-y-6">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Номи вазифа *</label>
              <Input placeholder="Масалан: Муҳандис" className="h-12 rounded-xl" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Ширкат *</label>
              <Input placeholder="Номи ширкат" className="h-12 rounded-xl" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Шаҳр *</label>
              <Input placeholder="Шаҳр" className="h-12 rounded-xl" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Маош (сомонӣ) *</label>
              <Input placeholder="Масалан: 2500" className="h-12 rounded-xl" value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Соатҳои корӣ *</label>
              <Input placeholder="Масалан: 08:00 - 18:00" className="h-12 rounded-xl" value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Синну сол *</label>
              <Input placeholder="Масалан: 20-35" className="h-12 rounded-xl" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Телефон *</label>
              <Input placeholder="931234567 (на кам аз 9 рақам)" className="h-12 rounded-xl" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Ҷинс *</label>
              <Select value={formData.gender} onValueChange={val => setFormData({ ...formData, gender: val })}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Фарқ надорад">Фарқ надорад</SelectItem>
                  <SelectItem value="Мард">Мард</SelectItem>
                  <SelectItem value="Зан">Зан</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Тавсифи вазифа *</label>
              <Textarea placeholder="Маълумоти пурра оиди кор..." rows={6} className="rounded-2xl" value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} />
            </div>

            <div className="md:col-span-2 pt-4">
              <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-black rounded-2xl gap-3 shadow-xl shadow-primary/20">
                {loading ? "Сабт мешавад..." : jobId ? "Навсозӣ" : "Нашр кардан"}
                {!loading && <Send size={20} />}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
