
"use client";

import { useEffect, useState } from "react";
import { JobListing } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Building, Phone, Calendar, User, MessageCircle, Banknote, Clock, Users, AlertTriangle, ChevronLeft, Share2 } from "lucide-react";
import { useUser, useRTDB } from "@/firebase";
import { ref, runTransaction } from "firebase/database";
import { ReportDialog } from "./ReportDialog";
import { Badge } from "@/components/ui/badge";

interface JobDetailsProps {
  job: JobListing;
  onBack: () => void;
  onChat: () => void;
}

export function JobDetails({ job, onBack, onChat }: JobDetailsProps) {
  const { user } = useUser();
  const rtdb = useRTDB();
  const isOwner = user?.uid === job.postedUid;
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    if (rtdb && job.id && user && !isOwner) {
      const viewRef = ref(rtdb, `jobs/${job.id}/views`);
      runTransaction(viewRef, (currentValue) => {
        return (currentValue || 0) + 1;
      });
    }
  }, [rtdb, job.id, user, isOwner]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Кор дар ${job.company}: ${job.title}`,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] animate-in slide-in-from-right duration-500 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-secondary/50">
            <ChevronLeft />
          </Button>
          <h2 className="text-lg font-black tracking-tight truncate max-w-[200px] md:max-w-md">{job.title}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full bg-secondary/50">
          <Share2 size={20} />
        </Button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8">
        <section className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-primary/5 border border-primary/5 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-3">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {job.company}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight text-foreground">{job.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground font-bold">
                <MapPin className="text-primary w-5 h-5" /> {job.city}
              </div>
            </div>
            {!isOwner && user && (
              <Button variant="ghost" size="icon" onClick={() => setIsReportOpen(true)} className="text-destructive/50 hover:text-destructive hover:bg-destructive/10">
                <AlertTriangle size={24} />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
            <DetailItem icon={<Banknote className="text-primary" />} label="Маош" value={job.salary ? `${job.salary} сомонӣ` : '—'} />
            <DetailItem icon={<Clock className="text-primary" />} label="Соатҳо" value={job.hours || '—'} />
            <DetailItem icon={<Calendar className="text-primary" />} label="Синну сол" value={job.age || '—'} />
            <DetailItem icon={<Users className="text-primary" />} label="Ҷинс" value={job.gender} />
            <DetailItem icon={<Phone className="text-primary" />} label="Телефон" value={job.phone || '—'} />
            <DetailItem icon={<User className="text-primary" />} label="Нашркунанда" value={job.postedBy} />
          </div>
        </section>

        <section className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-primary/5 border border-primary/5 space-y-6">
          <h3 className="text-2xl font-black tracking-tight">Тавсифи пурраи вазифа</h3>
          <Separator />
          <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed bg-secondary/10 p-8 rounded-[2rem] font-medium italic text-lg border-l-4 border-primary">
            {job.desc}
          </div>
        </section>

        <section className="pb-10">
          {!isOwner ? (
            <Button onClick={onChat} className="w-full rounded-3xl gap-4 h-16 text-xl font-black shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95">
              <MessageCircle size={28} /> Чат бо корфармо
            </Button>
          ) : (
            <div className="w-full text-center p-8 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted/50">
              <p className="text-muted-foreground font-black italic">Шумо соҳиби ин эълон ҳастед.</p>
            </div>
          )}
        </section>
      </main>

      <ReportDialog 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        reportedUid={job.postedUid}
        reportedEmail={job.postedEmail}
      />
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-5 bg-secondary/20 rounded-[1.5rem] space-y-2 border border-white hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-2 text-[10px] uppercase font-black text-muted-foreground tracking-widest">
        {icon}
        {label}
      </div>
      <div className="font-black text-base truncate text-foreground">{value}</div>
    </div>
  );
}
