"use client";

import { useEffect, useState } from "react";
import { JobListing } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, Calendar, User, MessageCircle, Banknote, Clock, Users, AlertTriangle, ChevronLeft, Share2, Crown, Sparkles } from "lucide-react";
import { useUser, useRTDB } from "@/firebase";
import { ref, runTransaction } from "firebase/database";
import { ReportDialog } from "./ReportDialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { AdSenseBanner } from "./AdSenseBanner";

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
    <div className={cn(
      "min-h-screen animate-in slide-in-from-right duration-500 flex flex-col pb-12",
      job.isPremium ? "bg-orange-50/20" : "bg-[#FDFCFB]"
    )}>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-secondary/30 h-9 w-9">
            <ChevronLeft size={18} />
          </Button>
          <h2 className="text-sm font-bold truncate max-w-[200px] uppercase tracking-tight">{job.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {job.isPremium && <Crown size={16} className="text-yellow-500 fill-yellow-500 animate-pulse" />}
          <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full bg-secondary/30 h-9 w-9">
            <Share2 size={18} />
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 space-y-6">
        
        {job.image ? (
          <div className="relative h-64 md:h-[450px] w-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-xl border-2 border-white">
            <Image src={job.image} alt={job.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            {job.isPremium && (
              <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest z-10 border border-white/20">
                <Crown size={12} fill="currentColor" /> VIP ПРЕМИУМ
              </div>
            )}
            <div className="absolute bottom-6 left-6 right-6">
               <h1 className="text-white text-2xl md:text-4xl font-black tracking-tight leading-tight drop-shadow-md uppercase">
                 {job.title}
               </h1>
            </div>
          </div>
        ) : (
          <div className={cn(
            "p-8 rounded-[2rem] shadow-lg border space-y-4",
            job.isPremium ? "bg-gradient-to-br from-gray-900 to-black border-yellow-500/20 text-white" : "bg-white border-primary/5"
          )}>
            <div className="flex items-center gap-2">
              <Badge className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                job.isPremium ? "bg-yellow-500 text-black border-none" : "bg-primary/10 text-primary border-primary/20"
              )}>
                {job.company}
              </Badge>
              {job.isPremium && <Sparkles size={14} className="text-yellow-400" />}
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">
              {job.title}
            </h1>
          </div>
        )}

        <section className={cn(
          "p-6 md:p-10 rounded-[2.5rem] shadow-xl border space-y-8 relative overflow-hidden",
          job.isPremium ? "bg-white border-yellow-500/10" : "bg-white border-primary/5"
        )}>
          {job.isPremium && (
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wide bg-secondary/40 px-4 py-2 rounded-xl">
              <MapPin className="text-primary w-4 h-4" /> {job.city}
            </div>
            {!isOwner && user && (
              <Button variant="ghost" size="icon" onClick={() => setIsReportOpen(true)} className="text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-full ml-auto">
                <AlertTriangle size={20} />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <DetailItem icon={<Banknote size={16} className="text-primary" />} label="Маош" value={job.salary ? `${job.salary} TJS` : '—'} isPremium={job.isPremium} />
            <DetailItem icon={<Clock size={16} className="text-primary" />} label="Соатҳо" value={job.hours || '—'} isPremium={job.isPremium} />
            <DetailItem icon={<Calendar size={16} className="text-primary" />} label="Синну сол" value={job.age || '—'} isPremium={job.isPremium} />
            <DetailItem icon={<Users size={16} className="text-primary" />} label="Ҷинс" value={job.gender} isPremium={job.isPremium} />
            <DetailItem icon={<Phone size={16} className="text-primary" />} label="Телефон" value={job.phone || '—'} isPremium={job.isPremium} />
            <DetailItem icon={<User size={16} className="text-primary" />} label="Нашркунанда" value={job.postedBy} isPremium={job.isPremium} />
          </div>

          <AdSenseBanner adSlot="5754332317" adFormat="fluid" adLayout="in-article" />

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              Тавсифи вазифа
              {job.isPremium && <Sparkles size={14} className="text-yellow-500" />}
            </h3>
            <Separator className="opacity-50" />
            <div className={cn(
              "text-muted-foreground whitespace-pre-wrap leading-relaxed p-6 rounded-[1.5rem] font-medium text-sm md:text-base border-l-4",
              job.isPremium ? "bg-orange-50/50 border-yellow-500" : "bg-secondary/20 border-primary"
            )}>
              {job.desc}
            </div>
          </div>
        </section>

        <section className="flex flex-col md:flex-row gap-3 pt-4">
          {!isOwner ? (
            <>
              <Button onClick={onChat} className="flex-1 rounded-2xl gap-3 h-14 text-sm font-black shadow-lg transition-all hover:scale-[1.01] active:scale-95">
                <MessageCircle size={20} /> ЧАТ БО КОРФАРМО
              </Button>
              {job.phone && (
                <Button 
                  onClick={handleWhatsApp} 
                  className="flex-1 rounded-2xl gap-3 h-14 text-sm font-black bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg transition-all hover:scale-[1.01] active:scale-95"
                >
                  <MessageCircle size={20} /> WHATSAPP
                </Button>
              )}
            </>
          ) : (
            <div className="w-full text-center p-8 bg-secondary/10 rounded-3xl border-2 border-dashed border-muted">
              <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest opacity-60">Ин эълони шумост</p>
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

function DetailItem({ icon, label, value, isPremium }: { icon: React.ReactNode, label: string, value: string, isPremium?: boolean }) {
  return (
    <div className={cn(
      "p-4 md:p-5 rounded-2xl space-y-1.5 border transition-all shadow-sm",
      isPremium ? "bg-white border-yellow-500/10 hover:border-yellow-500/30" : "bg-secondary/10 border-white hover:border-primary/20"
    )}>
      <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
        {icon}
        {label}
      </div>
      <div className="font-bold text-xs md:text-sm truncate text-foreground">{value}</div>
    </div>
  );
}
