
"use client";

import { useMemo } from "react";
import { useUser, useRTDBData } from "@/firebase";
import { JobListing, UserProfile } from "@/app/lib/types";
import { JobCard } from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart } from "lucide-react";

interface FavoritesViewProps {
  onSelectJob: (id: string) => void;
  onBack: () => void;
}

export function FavoritesView({ onSelectJob, onBack }: FavoritesViewProps) {
  const { user } = useUser();
  const { data: jobsObj } = useRTDBData("jobs");
  
  const userEncodedEmail = user?.email ? encodeURIComponent(user.email).replace(/\./g, '%2E') : null;
  const { data: profile } = useRTDBData(userEncodedEmail ? `users/${userEncodedEmail}` : null) as { data: UserProfile | null };

  const favoriteJobs = useMemo(() => {
    if (!jobsObj || !profile?.favorites) return [];
    const allJobs = Object.entries(jobsObj).map(([id, val]: [string, any]) => ({ id, ...val })) as JobListing[];
    return allJobs.filter(j => profile.favorites?.includes(j.id) && j.active);
  }, [jobsObj, profile]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
          <ArrowLeft />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 text-red-500 rounded-xl">
            <Heart size={24} fill="currentColor" />
          </div>
          <h2 className="text-3xl font-black tracking-tight">Писандидаҳо</h2>
        </div>
      </div>

      {favoriteJobs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {favoriteJobs.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              onClick={() => onSelectJob(job.id)} 
              onChat={() => {}} // Not needed in this view
              isOwner={user?.uid === job.postedUid}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-primary/10 space-y-5">
          <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-red-200">
            <Heart size={48} />
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xl font-black">Шумо то ҳол ягон эълонро писанд накардаед.</p>
            <p className="text-sm text-muted-foreground/60 font-bold">Барои илова кардан ба икони "дилча" дар эълонҳо клик кунед.</p>
          </div>
        </div>
      )}
    </div>
  );
}
