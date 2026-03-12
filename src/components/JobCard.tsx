
"use client";

import { JobListing, UserProfile } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock, Banknote, Building2, MapPin, Heart, ArrowRight, Crown, Sparkles, ChevronRight } from "lucide-react";
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
        className="shrink-0 w-72 bg-white rounded-[2.5rem] border-2 border-yellow-500/30 shadow-[0_15px_40px_rgba(255,123,0,0.15)] p-5 space-y-4 cursor-pointer hover:scale-[1.05] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden group"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400"></div>
        
        <div className="relative h-40 w-full rounded-[1.8rem] overflow-hidden bg-gray-100 shadow-inner">
          {job.image ? (
            <Image src={job.image} alt={job.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-yellow-50/80">
               <Crown className="text-yellow-400 opacity-20" size={64} fill="currentColor" />
            </div>
          )}
          <div className="absolute top-3 right-3 bg-yellow-500 text-white p-2 rounded-xl shadow-xl z-20 animate-pulse">
            <Crown size={16} fill="currentColor" />
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-2 z-20">
            <Badge className="bg-white/95 text-primary border-none text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-md">
              <MapPin size={10} className="mr-1" /> {job.city}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-black text-base truncate leading-tight uppercase group-hover:text-primary transition-colors tracking-tighter">{job.title}</h3>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5">
               <Building2 size={12} className="text-primary/60" /> {job.company}
            </p>
            <div className="flex items-center gap-1 bg-black/5 px-2 py-0.5 rounded-md text-[9px] font-black">
              <Eye size={10} /> {job.views || 0}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-primary/10">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Маош</span>
            <span className="text-sm font-black text-primary tracking-tight">{job.salary ? `${job.salary} TJS` : '—'}</span>
          </div>
          <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/30 group-hover:translate-x-1 transition-transform">
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "hover:shadow-[0_40px_80px_rgba(255,123,0,0.2)] transition-all duration-700 group overflow-hidden rounded-[3rem] bg-white flex flex-col h-full border-none shadow-xl hover:-translate-y-3 active:scale-[0.97]",
      job.isPremium ? "ring-2 ring-yellow-500/40 relative" : "border border-primary/5"
    )}>
      {job.isPremium && (
        <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 text-white text-[10px] font-black py-2 px-6 text-center tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg z-20">
          <Crown size={14} fill="currentColor" /> VIP ПРЕМИУМ ЭЪЛОН
        </div>
      )}
      
      <div className="relative h-60 w-full cursor-pointer overflow-hidden" onClick={onClick}>
        {job.image ? (
          <Image src={job.image} alt={job.title} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
        ) : (
          <div className="w-full h-full bg-secondary/30 flex items-center justify-center">
            <Briefcase size={80} className="text-primary/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
        <div className="absolute bottom-4 left-6 flex items-center gap-2">
           <Badge className="bg-white/95 text-primary border-none px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl">
              <MapPin size={12} className="mr-1.5" /> {job.city}
           </Badge>
        </div>
        {user && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleFavorite}
            className={cn(
              "absolute top-4 right-4 rounded-2xl h-12 w-12 transition-all active:scale-125 z-20 backdrop-blur-md",
              isFavorite ? "text-red-500 bg-white/90 shadow-xl" : "text-white bg-black/20 hover:bg-black/40"
            )}
          >
            <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
          </Button>
        )}
      </div>

      <CardHeader className="pb-4 pt-8 px-8 space-y-4">
        <div className="space-y-3">
          <CardTitle className="text-3xl font-black group-hover:text-primary transition-colors cursor-pointer leading-tight tracking-tighter" onClick={onClick}>
            {job.title}
          </CardTitle>
          <div className="flex items-center gap-3 text-base font-black text-muted-foreground/70">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            {job.company}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-8 pb-8 space-y-6 flex-1 flex flex-col justify-between" onClick={onClick}>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-3 bg-primary/5 px-5 py-3 rounded-2xl border border-primary/10 shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-500">
            <Banknote className="w-6 h-6 text-primary group-hover:text-white" />
            <span className="text-base font-black tracking-tight">
              {job.salary ? `${job.salary} TJS` : 'Маош —'}
            </span>
          </div>
          <div className="flex items-center gap-3 bg-secondary/50 px-5 py-3 rounded-2xl border border-primary/5">
            <Eye className="w-6 h-6 text-muted-foreground/40" />
            <span className="text-sm font-black text-muted-foreground/60 uppercase tracking-widest">{job.views || 0}</span>
          </div>
          <div className="flex items-center gap-3 bg-secondary/50 px-5 py-3 rounded-2xl border border-primary/5">
            <Clock className="w-6 h-6 text-muted-foreground/40" />
            <span className="text-sm font-black text-muted-foreground/60 uppercase tracking-widest">{formatTajikTime(job.postedAt)}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed font-bold italic border-l-4 border-primary/30 pl-6 py-2 bg-secondary/10 rounded-r-2xl">
          {job.desc}
        </p>
      </CardContent>

      <CardFooter className="pt-0 p-8 flex gap-4 bg-gray-50/50 border-t border-primary/5 mt-auto">
        <Button 
          variant="default" 
          size="lg" 
          className="flex-1 rounded-[1.5rem] font-black h-16 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all gap-4 text-lg uppercase tracking-tighter" 
          onClick={onClick}
        >
          ТАФСИЛОТ <ArrowRight size={20} />
        </Button>
      </CardFooter>
    </Card>
  );
}
