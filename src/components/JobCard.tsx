
"use client";

import { JobListing } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock, Banknote, Building2, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface JobCardProps {
  job: JobListing;
  onClick: () => void;
  onChat: () => void;
  isOwner: boolean;
}

export function JobCard({ job, onClick, onChat, isOwner }: JobCardProps) {
  const safeDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  return (
    <Card className="hover:shadow-[0_20px_50px_rgba(255,123,0,0.1)] transition-all duration-500 group overflow-hidden border-primary/10 rounded-[2.5rem] bg-white flex flex-col h-full border hover:-translate-y-2 active:scale-[0.98]">
      <CardHeader className="pb-4 space-y-5">
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
            <MapPin size={12} /> {job.city}
          </Badge>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest bg-secondary/50 px-3 py-1.5 rounded-xl border border-primary/5">
            <Clock className="w-3.5 h-3.5" />
            {formatDistanceToNow(safeDate(job.postedAt), { addSuffix: true })}
          </div>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-black group-hover:text-primary transition-colors cursor-pointer leading-tight tracking-tight" onClick={onClick}>
            {job.title}
          </CardTitle>
          <div className="flex items-center gap-2.5 text-sm font-bold text-muted-foreground/70">
            <div className="p-1.5 bg-primary/5 rounded-lg">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            {job.company}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-8 space-y-6 cursor-pointer flex-1" onClick={onClick}>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2.5 bg-primary/5 px-4 py-2.5 rounded-2xl border border-primary/10 shadow-sm">
            <Banknote className="w-5 h-5 text-primary font-bold" />
            <span className="text-sm font-black text-primary tracking-tight">
              {job.salary ? `${job.salary} сомонӣ` : 'Маош —'}
            </span>
          </div>
          <div className="flex items-center gap-2.5 bg-secondary/30 px-4 py-2.5 rounded-2xl border border-primary/5">
            <Eye className="w-5 h-5 text-muted-foreground/60" />
            <span className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">{job.views || 0} тамошо</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground/80 line-clamp-3 leading-relaxed font-bold italic border-l-4 border-primary/20 pl-4 py-1">
          {job.desc}
        </p>
      </CardContent>

      <CardFooter className="pt-0 p-8 flex gap-4 border-t border-primary/5 bg-secondary/10 mt-auto">
        <Button variant="outline" size="lg" className="flex-1 rounded-2xl border-primary/10 font-black h-14 hover:bg-white hover:text-primary hover:border-primary transition-all shadow-md active:scale-95" onClick={onClick}>
          ТАФСИЛОТ
        </Button>
      </CardFooter>
    </Card>
  );
}
