
"use client";

import { JobListing } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, MapPin, MessageCircle, Clock, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tg } from "date-fns/locale";

interface JobCardProps {
  job: JobListing;
  onClick: () => void;
  onChat: () => void;
  isOwner: boolean;
}

export function JobCard({ job, onClick, onChat, isOwner }: JobCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow group overflow-hidden border-primary/5">
      <CardHeader className="pb-2 space-y-1">
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">
            {job.city}
          </Badge>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-semibold">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(job.postedAt), { addSuffix: true })}
          </div>
        </div>
        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors cursor-pointer" onClick={onClick}>
          {job.title}
        </CardTitle>
        <p className="text-sm font-medium text-muted-foreground">{job.company}</p>
      </CardHeader>
      <CardContent className="pb-4 space-y-3 cursor-pointer" onClick={onClick}>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-foreground/80 font-semibold">
            <DollarSign className="w-4 h-4 text-primary" />
            {job.salary || '—'}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Eye className="w-4 h-4" />
            {job.views} дида шуд
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed italic">
          {job.desc}
        </p>
      </CardContent>
      <CardFooter className="pt-0 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 rounded-full border-primary/20" onClick={onClick}>
          Нигаристани пурра
        </Button>
        {!isOwner && (
          <Button size="sm" className="rounded-full gap-2 px-6" onClick={onChat}>
            <MessageCircle size={16} /> Чат
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
