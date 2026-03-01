"use client";

import { JobListing } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, MapPin, MessageCircle, Clock, DollarSign, Building2 } from "lucide-react";
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
    <Card className="hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 group overflow-hidden border-primary/10 rounded-[2rem] bg-white flex flex-col h-full border hover:-translate-y-1">
      <CardHeader className="pb-4 space-y-4">
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider">
            {job.city}
          </Badge>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-black tracking-widest bg-muted/50 px-2 py-1 rounded-md">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(safeDate(job.postedAt), { addSuffix: true })}
          </div>
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-xl md:text-2xl font-black group-hover:text-primary transition-colors cursor-pointer leading-tight" onClick={onClick}>
            {job.title}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
            <Building2 className="w-4 h-4 text-primary/50" />
            {job.company}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-6 space-y-4 cursor-pointer flex-1" onClick={onClick}>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
            <DollarSign className="w-4 h-4 text-primary font-bold" />
            <span className="text-sm font-black text-primary">{job.salary || '—'}</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground">{job.views || 0} дида шуд</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground/80 line-clamp-3 leading-relaxed font-medium italic">
          {job.desc}
        </p>
      </CardContent>

      <CardFooter className="pt-0 p-6 flex gap-3 border-t bg-secondary/5 mt-auto">
        <Button variant="ghost" size="lg" className="flex-1 rounded-2xl border font-bold hover:bg-white" onClick={onClick}>
          Тафсилот
        </Button>
        {!isOwner && (
          <Button size="lg" className="flex-1 rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20" onClick={onChat}>
            <MessageCircle size={18} /> Чат
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}