"use client";

import { useEffect } from "react";
import { JobListing } from "@/app/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Building, Phone, Calendar, User, MessageCircle, DollarSign, Clock, Users } from "lucide-react";
import { useUser, useRTDB } from "@/firebase";
import { ref, runTransaction } from "firebase/database";

interface JobDetailsProps {
  job: JobListing;
  onClose: () => void;
  onChat: () => void;
}

export function JobDetails({ job, onClose, onChat }: JobDetailsProps) {
  const { user } = useUser();
  const rtdb = useRTDB();
  const isOwner = user?.uid === job.postedUid;

  useEffect(() => {
    if (rtdb && job.id && user && !isOwner) {
      const viewRef = ref(rtdb, `jobs/${job.id}/views`);
      runTransaction(viewRef, (currentValue) => {
        return (currentValue || 0) + 1;
      });
    }
  }, [rtdb, job.id, user, isOwner]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
        <div className="bg-primary p-6 md:p-8 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl font-black">{job.title}</DialogTitle>
            <DialogDescription className="text-white/80 text-lg font-medium flex items-center gap-2 mt-2">
              <Building className="w-5 h-5" /> {job.company} — <MapPin className="w-5 h-5" /> {job.city}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <DetailItem icon={<DollarSign className="text-primary w-5 h-5" />} label="Маош" value={job.salary || '—'} />
            <DetailItem icon={<Clock className="text-primary w-5 h-5" />} label="Соатҳои корӣ" value={job.hours || '—'} />
            <DetailItem icon={<Calendar className="text-primary w-5 h-5" />} label="Синну сол" value={job.age || '—'} />
            <DetailItem icon={<Users className="text-primary w-5 h-5" />} label="Ҷинс" value={job.gender} />
            <DetailItem icon={<Phone className="text-primary w-5 h-5" />} label="Телефон" value={job.phone || '—'} />
            <DetailItem icon={<User className="text-primary w-5 h-5" />} label="Нашркунанда" value={job.postedBy} />
          </div>

          <Separator className="opacity-50" />

          <div className="space-y-4">
            <h4 className="font-black text-xl flex items-center gap-2">Тавсифи пурра</h4>
            <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed bg-secondary/20 p-6 rounded-[2rem] font-medium italic border">
              {job.desc}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            {!isOwner ? (
              <Button onClick={onChat} className="flex-1 rounded-2xl gap-3 h-14 text-lg font-black shadow-xl shadow-primary/20 transition-transform active:scale-95">
                <MessageCircle size={24} /> Чат бо корфармо
              </Button>
            ) : (
              <div className="w-full text-center p-4 bg-muted/50 rounded-2xl border-2 border-dashed">
                <p className="text-muted-foreground font-bold italic">Ин эълони нашркардаи шумост.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-4 bg-secondary/30 rounded-2xl space-y-1 border border-white">
      <div className="flex items-center gap-2 text-[10px] uppercase font-black text-muted-foreground tracking-widest">
        {icon}
        {label}
      </div>
      <div className="font-bold text-sm truncate">{value}</div>
    </div>
  );
}
