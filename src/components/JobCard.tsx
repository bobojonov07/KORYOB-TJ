"use client";

import { JobListing, UserProfile } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock, Banknote, Building2, MapPin, Heart, ArrowRight, Crown, ChevronRight, Briefcase } from "lucide-react";
import { useUser, useRTDB, useRTDBData } from "@/firebase";
import { ref, update, runTransaction } from "firebase/database";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface JobCardProps {
  job: JobListing;
  onClick: () => void;
  onChat: () => void;
  isOwner: boolean;
  compact?: boolean;
}

function formatTajikTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "Ҳозир";
  if (diffInMinutes < 60) return `${diffInMinutes} дақ. пеш`;
  if (diffInHours < 24) return `${diffInHours} соат пеш`;
  if (diffInDays === 1) return "Дирӯз";
  if (diffInDays < 30) return `${diffInDays} рӯз пеш`;
  
  return date.toLocaleDateString('tg-TJ', { day: 'numeric', month: 'long' });
}

export function JobCard({ job, onClick, onChat, isOwner, compact = false }: JobCardProps) {
  const { user } = useUser();
  const rtdb = useRTDB();
  
  const userEncodedEmail = user?.email ? encodeURIComponent(user.email).replace(/\./g, '%2E') : null;
  const { data: profileObj } = useRTDBData(userEncodedEmail ? `users/${userEncodedEmail}` : null);
  const profile = profileObj as UserProfile | null;

  const isFavorite = profile?.favorites?.includes(job.id);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !userEncodedEmail || !rtdb) return;

    const userRef = ref(rtdb, `users/${userEncodedEmail}`);
    await runTransaction(userRef, (userData) => {
      if (userData) {
        if (!userData.favorites) userData.favorites = [];
        if (userData.favorites.includes(job.id)) {
          userData.favorites = userData.favorites.filter((id: string) => id !== job.id);
        } else {
          userData.favorites.push(job.id);
        }
      }
      return userData;
    });
  };

  if (compact) {
    return (
      <div 
        onClick={onClick}
        className="shrink-0 w-64 glass rounded-[2rem] p-5 space-y-4 cursor-pointer hover:scale-[1.03] active:scale-95 transition-all duration-300 relative overflow-hidden group shadow-2xl"
      >
        <div className="relative h-36 w-full rounded-2xl overflow-hidden bg-secondary/30">
          {job.image ? (
            <Image src={job.image} alt={job.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
               <Briefcase className="text-primary/10 group-hover:text-primary/20 transition-colors" size={40} />
            </div>
          )}
          {job.isPremium && (
            <div className="absolute top-2 right-2 bg-primary text-white p-1.5 rounded-lg shadow-xl animate-pulse">
              <Crown size={12} fill="currentColor" />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="font-black text-sm truncate tracking-tight text-foreground group-hover:text-primary transition-colors">{job.title}</h3>
          <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5">
            <Building2 size={10} className="text-primary/60" /> {job.company}
          </p>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-primary/5">
          <span className="text-xs font-black text-primary">{job.salary ? `${job.salary} TJS` : 'Маош —'}</span>
          <div className="bg-primary/10 p-1 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "group hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white border border-primary/5 shadow-xl overflow-hidden flex flex-col h-full",
      job.isPremium && "ring-1 ring-primary/20 bg-gradient-to-br from-white to-primary/5"
    )}>
      {job.image && (
        <div className="relative h-56 w-full cursor-pointer overflow-hidden" onClick={onClick}>
          <Image src={job.image} alt={job.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          {user && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFavorite}
              className={cn(
                "absolute top-4 right-4 rounded-2xl h-11 w-11 transition-all active:scale-125 z-10",
                isFavorite ? "text-red-500 bg-white shadow-xl" : "text-white bg-black/20 backdrop-blur-md hover:bg-black/40"
              )}
            >
              <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            </Button>
          )}
        </div>
      )}

      <CardHeader className="p-6 pb-2">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-black truncate tracking-tighter cursor-pointer hover:text-primary transition-colors leading-tight" onClick={onClick}>
                {job.title}
              </CardTitle>
              {job.isPremium && <Crown size={16} className="text-primary animate-subtle-float" fill="currentColor" />}
            </div>
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
              {job.company}
            </p>
          </div>
          {!job.image && user && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFavorite}
              className={cn(
                "rounded-2xl h-10 w-10 transition-all active:scale-125",
                isFavorite ? "text-red-500 bg-red-50" : "text-muted-foreground/30 hover:text-red-500 hover:bg-red-50"
              )}
            >
              <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-2 flex-1 space-y-5">
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-xl border border-primary/5">
            <MapPin size={12} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-tight">{job.city}</span>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/10">
            <Banknote size={12} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-tight text-primary">{job.salary ? `${job.salary} TJS` : 'Маош —'}</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-xl text-muted-foreground/60">
            <Clock size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">{formatTajikTime(job.postedAt)}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed font-medium">
          {job.desc}
        </p>
      </CardContent>

      <CardFooter className="p-6 pt-0 mt-auto">
        <Button 
          variant="default" 
          className="w-full rounded-2xl font-black h-12 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 gap-3 text-xs uppercase tracking-widest" 
          onClick={onClick}
        >
          ТАФСИЛОТ <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  );
}
