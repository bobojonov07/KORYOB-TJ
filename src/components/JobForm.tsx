
"use client";

import { useState, useEffect, useMemo } from "react";
import { JobListing, UserProfile } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { collection, doc, setDoc, updateDoc, query, where, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";

interface JobFormProps {
  jobId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function JobForm({ jobId, onSuccess, onCancel }: JobFormProps) {
  const { db } = useFirestore();
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

  const usersRef = useMemo(() => collection(db, "users"), [db]);
  const { data: profileData } = useCollection(user ? query(usersRef, where("uid", "==", user.uid)) : null) as { data: UserProfile[] };
  const profile = profileData?.[0];

  useEffect(() => {
    if (jobId) {
      const loadJob = async () => {
        const docRef = doc(db, "jobs", jobId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setFormData({
            title: data.title,
            company: data.company,
            city: data.city,
            salary: data.salary || "",
            hours: data.hours || "",
            age: data.age || "",
            phone: data.phone || "",
            gender: data.gender,
            desc: data.desc,
          });
        }
      };
      loadJob();
    }
  }, [jobId, db]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    if (!formData.title || !formData.company || !formData.city) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Лутфан майдонҳои асосиро пур кунед." });
      return;
    }

    setLoading(true);
    try {
      const jobRef = jobId ? doc(db, "jobs", jobId) : doc(collection(db, "jobs"));
      const finalData = {
        ...formData,
        id: jobRef.id,
        postedBy: profile.name,
        postedEmail: profile.email,
        postedUid: user.uid,
        postedAt: jobId ? undefined : new Date().toISOString(),
        active: true,
        views: jobId ? undefined : 0,
      };

      if (jobId) {
        await updateDoc(jobRef, { ...formData });
      } else {
        await setDoc(jobRef, finalData);
      }

      toast({ title: jobId ? "Эълон навсозӣ шуд" : "Эълон нашр шуд" });
      onSuccess();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Хатогӣ", description: "Натавонистам эълонро сабт кунам." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Button variant="ghost" onClick={onCancel} className="mb-4 gap-2">
        <ArrowLeft size={16} /> Бозгашт
      </Button>

      <Card className="border-primary/10 shadow-xl overflow-hidden">
        <CardHeader className="bg-primary text-white">
          <CardTitle className="text-2xl">{jobId ? "Таҳрири эълон" : "Эълони нав эҷод кунед"}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">Номи вазифа *</label>
              <Input placeholder="Масалан: Муҳандис" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Ширкат *</label>
              <Input placeholder="Номи ширкат" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Шаҳр *</label>
              <Input placeholder="Шаҳр" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Маош</label>
              <Input placeholder="Масалан: 1200 - 1800" value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Соатҳои корӣ</label>
              <Input placeholder="Масалан: 07:00 - 18:00" value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Синну сол</label>
              <Input placeholder="Масалан: аз 20 то 25" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Телефон</label>
              <Input placeholder="+992 93 123 45 67" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">Ҷинс</label>
              <Select value={formData.gender} onValueChange={val => setFormData({ ...formData, gender: val })}>
                <SelectTrigger>
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
              <label className="text-sm font-semibold">Тавсифи вазифа *</label>
              <Textarea placeholder="Маълумоти пурра оиди кор..." rows={5} value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} />
            </div>

            <div className="md:col-span-2 pt-4">
              <Button type="submit" disabled={loading} className="w-full h-12 text-lg rounded-full gap-2">
                {loading ? "Сабт мешавад..." : jobId ? "Навсозӣ" : "Нашр кардан"}
                {!loading && <Send size={18} />}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
