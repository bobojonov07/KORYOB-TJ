
"use client";

import { useEffect, useState } from "react";
import { JobListing } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, Calendar, User, MessageCircle, Banknote, Clock, Users, AlertTriangle, ChevronLeft, Share2, Crown } from "lucide-react";
import { useUser, useRTDB } from "@/firebase";
import { ref, runTransaction } from "firebase/database";
import { ReportDialog } from "./ReportDialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";

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

  const handleWhatsApp = () => {
    if (!job.phone) return;
    const cleanPhone = job.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] animate-in slide-in-from-right duration-500 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-secondary/50 h-10 w-10">
            <ChevronLeft size={20} />
          </Button>
          <h2 className="text-md md:text-lg font-black tracking-tight truncate max-w-[180px] md:max-w-md uppercase">{job.title}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full bg-secondary/50 h-10 w-10">
          <Share2 size={20} />
        </Button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 space-y-6 md:space-y-8">
        
        {job.image && (
          <div className="relative h-64 md:h-96 w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
            <Image src={job.image} alt={job.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            {job.isPremium && (
              <div className="absolute top-6 right-6 bg-yellow-500 text-white p-3 rounded-2xl shadow-xl flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                <Crown size={16} fill="currentColor" /> VIP ПРЕМИУМ
              </div>
            )}
          </div>
        )}

        <section className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-xl shadow-primary/5 border border-primary/5 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                {job.company}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-[1.1] text-foreground flex items-center gap-3">
                {job.title}
                {job.isPremium && <Crown className="text-yellow-500 fill-yellow-500" />}
              </h1>
              <div className="flex items-center gap-2.5 text-muted-foreground font-black text-sm uppercase tracking-wide bg-secondary/30 w-fit px-4 py-2 rounded-xl">
                <MapPin className="text-primary w-5 h-5" /> {job.city}
              </div>
            </div>
            {!isOwner && user && (
              <Button variant="ghost" size="icon" onClick={() => setIsReportOpen(true)} className="text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-full h-12 w-12">
                <AlertTriangle size={24} />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 pt-4">
            <DetailItem icon={<Banknote className="text-primary" />} label="Маош" value={job.salary ? `${job.salary} TJS` : '—'} />
            <DetailItem icon={<Clock className="text-primary" />} label="Соатҳо" value={job.hours || '—'} />
            <DetailItem icon={<Calendar className="text-primary" />} label="Синну сол" value={job.age || '—'} />
            <DetailItem icon={<Users className="text-primary" />} label="Ҷинс" value={job.gender} />
            <DetailItem icon={<Phone className="text-primary" />} label="Телефон" value={job.phone || '—'} />
            <DetailItem icon={<User className="text-primary" />} label="Нашркунанда" value={job.postedBy} />
          </div>
        </section>

        <section className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-xl shadow-primary/5 border border-primary/5 space-y-6">
          <h3 className="text-2xl font-black tracking-tighter">Тавсифи пурраи вазифа</h3>
          <Separator className="bg-primary/5" />
          <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed bg-secondary/10 p-6 md:p-10 rounded-[2rem] font-bold italic text-md md:text-xl border-l-8 border-primary/30">
            {job.desc}
          </div>
        </section>

        <section className="pb-12 flex flex-col md:flex-row gap-4">
          {!isOwner ? (
            <>
              <Button onClick={onChat} className="flex-1 rounded-[2rem] gap-4 h-16 md:h-20 text-xl font-black shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95">
                <MessageCircle size={32} /> Чат
              </Button>
              {job.phone && (
                <Button 
                  onClick={handleWhatsApp} 
                  className="flex-1 rounded-[2rem] gap-4 h-16 md:h-20 text-xl font-black bg-[#25D366] hover:bg-[#128C7E] text-white shadow-2xl shadow-green-500/20 transition-all hover:scale-[1.02] active:scale-95 border-none"
                >
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 0 5.415 0 12.05c0 2.122.554 4.197 1.607 6.031L0 24l6.105-1.602a11.803 11.803 0 005.94 1.604h.005c6.634 0 12.048-5.417 12.048-12.052 0-3.211-1.252-6.227-3.525-8.502z"/>
                  </svg>
                  WhatsApp
                </Button>
              )}
            </>
          ) : (
            <div className="w-full text-center p-10 bg-secondary/10 rounded-[2.5rem] border-2 border-dashed border-primary/10">
              <p className="text-muted-foreground font-black italic text-lg uppercase tracking-widest opacity-50">Ин эълони шумост</p>
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
    <div className="p-4 md:p-6 bg-secondary/20 rounded-[1.8rem] space-y-2.5 border border-white hover:border-primary/20 transition-all shadow-sm">
      <div className="flex items-center gap-2 text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">
        {icon}
        {label}
      </div>
      <div className="font-black text-sm md:text-base truncate text-foreground leading-none">{value}</div>
    </div>
  );
}
