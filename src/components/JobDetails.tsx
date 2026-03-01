
"use client";

import { JobListing } from "@/app/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Building, Phone, Calendar, User, MessageCircle, DollarSign, Clock, Users } from "lucide-react";
import { useUser } from "@/firebase";

interface JobDetailsProps {
  job: JobListing;
  onClose: () => void;
  onChat: () => void;
}

export function JobDetails({ job, onClose, onChat }: JobDetailsProps) {
  const { user } = useUser();

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">{job.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-base">
            <Building className="w-4 h-4" /> {job.company} — <MapPin className="w-4 h-4" /> {job.city}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <DetailItem icon={<DollarSign className="text-primary" />} label="Маош" value={job.salary || '—'} />
            <DetailItem icon={<Clock className="text-primary" />} label="Соатҳои корӣ" value={job.hours || '—'} />
            <DetailItem icon={<Calendar className="text-primary" />} label="Синну сол" value={job.age || '—'} />
            <DetailItem icon={<Users className="text-primary" />} label="Ҷинс" value={job.gender} />
            <DetailItem icon={<Phone className="text-primary" />} label="Телефон" value={job.phone || '—'} />
            <DetailItem icon={<User className="text-primary" />} label="Нашркунанда" value={job.postedBy} />
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-bold text-lg">Тавсифи пурра</h4>
            <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed bg-secondary/10 p-4 rounded-xl">
              {job.desc}
            </div>
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
            {user?.uid !== job.postedUid ? (
              <Button onClick={onChat} className="flex-1 rounded-full gap-2 h-12 text-lg shadow-lg">
                <MessageCircle size={20} /> Чат бо корфармо
              </Button>
            ) : (
              <p className="text-sm text-center w-full italic text-muted-foreground">Ин эълони шумост</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-3 bg-secondary/30 rounded-xl space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="font-semibold text-sm truncate">{value}</div>
    </div>
  );
}
