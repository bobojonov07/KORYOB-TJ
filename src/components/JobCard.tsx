
"use client";

import { JobListing, UserProfile } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock, Banknote, Building2, MapPin, Heart, ArrowRight, Crown, Sparkles } from "lucide-react";
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
        className="shrink-0 w-64 bg-white rounded-[2rem] border-2 border-yellow-500/20 shadow-[0_10px_30px_rgba(255,123,0,0.1)] p-4 space-y-3 cursor-pointer hover:scale-[1.03] transition-all relative overflow-hidden group"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400"></div>
        <div className="absolute top-3 right-3 z-10 bg-yellow-400 text-white p-1 rounded-lg shadow-md group-hover:rotate-12 transition-transform">
          <Crown size={14} fill="currentColor" />
        </div>
        
        <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-secondary mb-2">
          {job.image ? (
            <Image src={job.image} alt={job.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-yellow-50/50">
               <Sparkles className="text-yellow-400 opacity-30" size={40} />
            </div>
          )}
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-white/90 text-primary border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
              {job.city}
            </Badge>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-black text-sm truncate leading-tight uppercase group-hover:text-primary transition-colors">{job.title}</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
             <Building2 size={10} className="text-primary" /> {job.company}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-primary/5">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Маош</span>
            <span className="text-xs font-black text-primary">{job.salary ? `${job.salary} TJS` : '—'}</span>
          </div>
          <div className="bg-primary/5 p-1.5 rounded-full text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "hover:shadow-[0_30px_60px_rgba(255,123,0,0.15)] transition-all duration-500 group overflow-hidden rounded-[2.5rem] bg-white flex flex-col h-full border hover:-translate-y-2 active:scale-[0.98]",
      job.isPremium ? "border-yellow-500/40 border-2" : "border-primary/10"
    )}>
      {job.isPremium && (
        <div className="bg-yellow-500 text-white text-[9px] font-black py-1 px-4 text-center tracking-widest flex items-center justify-center gap-2">
          <Crown size={12} fill="currentColor" /> VIP ПРЕМИУМ ЭЪЛОН
        </div>
      )}
      {job.image && (
        <div className="relative h-48 w-full cursor-pointer overflow-hidden" onClick={onClick}>
          <Image src={job.image} alt={job.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>
      )}
      <CardHeader className="pb-4 space-y-5">
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
            <MapPin size={12} /> {job.city}
          </Badge>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest bg-secondary/50 px-3 py-1.5 rounded-xl border border-primary/5">
              <Clock className="w-3.5 h-3.5" />
              {formatTajikTime(job.postedAt)}
            </div>
            {user && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleFavorite}
                className={cn("rounded-xl h-8 w-8 transition-transform active:scale-125", isFavorite ? "text-red-500 bg-red-50" : "text-muted-foreground")}
              >
                <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
              </Button>
            )}
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
              {job.salary ? `${job.salary} TJS` : 'Маош —'}
            </span>
          </div>
          <div className="flex items-center gap-2.5 bg-secondary/30 px-4 py-2.5 rounded-2xl border border-primary/5">
            <Eye className="w-5 h-5 text-muted-foreground/60" />
            <span className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">{job.views || 0}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground/80 line-clamp-3 leading-relaxed font-bold italic border-l-4 border-primary/20 pl-4 py-1">
          {job.desc}
        </p>
      </CardContent>

      <CardFooter className="pt-0 p-8 flex gap-4 border-t border-primary/5 bg-secondary/5 mt-auto">
        <Button 
          variant="default" 
          size="lg" 
          className="flex-1 rounded-[1.25rem] font-black h-14 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all gap-3" 
          onClick={onClick}
        >
          ТАФСИЛОТ <ArrowRight size={18} />
        </Button>
      </CardFooter>
    </Card>
  );
}
