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
        className="shrink-0 w-64 bg-white rounded-3xl border border-primary/10 shadow-lg p-4 space-y-3 cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden"
      >
        <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-gray-100">
          {job.image ? (
            <Image src={job.image} alt={job.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
               <Briefcase className="text-primary/20" size={32} />
            </div>
          )}
          {job.isPremium && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white p-1.5 rounded-lg shadow-lg">
              <Crown size={12} fill="currentColor" />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-sm truncate leading-tight">{job.title}</h3>
          <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
            <Building2 size={10} /> {job.company}
          </p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs font-bold text-primary">{job.salary ? `${job.salary} TJS` : '—'}</span>
          <ChevronRight size={14} className="text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "hover:shadow-xl transition-all duration-300 rounded-[2rem] bg-white flex flex-col h-full border border-primary/5 shadow-md overflow-hidden",
      job.isPremium && "ring-1 ring-yellow-500/30"
    )}>
      {job.image && (
        <div className="relative h-48 w-full cursor-pointer overflow-hidden" onClick={onClick}>
          <Image src={job.image} alt={job.title} fill className="object-cover hover:scale-105 transition-transform duration-500" />
          {user && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFavorite}
              className={cn(
                "absolute top-3 right-3 rounded-xl h-10 w-10 transition-all active:scale-110",
                isFavorite ? "text-red-500 bg-white shadow-md" : "text-white bg-black/20 hover:bg-black/30"
              )}
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
            </Button>
          )}
        </div>
      )}

      <CardHeader className="p-5 pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold truncate leading-tight cursor-pointer hover:text-primary transition-colors" onClick={onClick}>
                {job.title}
              </CardTitle>
              {job.isPremium && <Crown size={14} className="text-yellow-500 fill-yellow-500 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Building2 size={12} className="text-primary/60" /> {job.company}
            </p>
          </div>
          {!job.image && user && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFavorite}
              className={cn(
                "rounded-xl h-9 w-9 transition-all active:scale-110",
                isFavorite ? "text-red-500 bg-red-50" : "text-muted-foreground/30 hover:text-red-500"
              )}
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-5 pt-2 flex-1 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-primary/20 text-primary font-bold text-[10px] py-1">
            <MapPin size={10} className="mr-1" /> {job.city}
          </Badge>
          <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1 rounded-lg">
            <Banknote className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold">{job.salary ? `${job.salary} TJS` : 'Маош —'}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-lg text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">{formatTajikTime(job.postedAt)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
          {job.desc}
        </p>
      </CardContent>

      <CardFooter className="p-5 pt-0 mt-auto">
        <Button 
          variant="default" 
          className="w-full rounded-xl font-bold h-10 shadow-md transition-all gap-2 text-xs" 
          onClick={onClick}
        >
          ТАФСИЛОТ <ArrowRight size={14} />
        </Button>
      </CardFooter>
    </Card>
  );
}
