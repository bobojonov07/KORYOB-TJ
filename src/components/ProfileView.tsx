"use client";

import { useMemo } from "react";
import { UserProfile, JobListing } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRTDBData } from "@/firebase";
import { User, Settings, Briefcase, ChevronRight, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ProfileViewProps {
  profile?: UserProfile;
  onViewMyJobs: () => void;
  onEditJob: (id: string) => void;
}

export function ProfileView({ profile, onViewMyJobs, onEditJob }: ProfileViewProps) {
  const { data: jobsObj } = useRTDBData("jobs");
  
  const myJobsCount = useMemo(() => {
    if (!jobsObj || !profile?.email) return 0;
    return Object.values(jobsObj).filter((j: any) => j.postedEmail === profile.email).length;
  }, [jobsObj, profile]);

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="flex flex-col items-center text-center space-y-4 bg-white p-8 rounded-3xl border shadow-sm">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold border-4 border-white shadow-lg">
          {profile.name[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <p className="text-muted-foreground capitalize">{profile.role === 'korfarmo' ? 'Корфармо' : 'Корҷуй'}</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="rounded-2xl border-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User size={20} className="text-primary" /> Маълумоти умумӣ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={<Mail size={16} />} label="Почта" value={profile.email} />
            <InfoItem icon={<Calendar size={16} />} label="Санаи сабт" value={profile.createdAt ? format(new Date(profile.createdAt), "dd/MM/yyyy") : "—"} />
          </CardContent>
        </Card>

        {profile.role === 'korfarmo' && (
          <Card className="rounded-2xl border-primary/5 cursor-pointer hover:bg-secondary/20 transition-colors" onClick={onViewMyJobs}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase size={20} className="text-primary" /> Эълонҳои ман ({myJobsCount})
              </CardTitle>
              <ChevronRight className="text-muted-foreground" />
            </CardHeader>
          </Card>
        )}

        <Card className="rounded-2xl border-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings size={20} className="text-primary" /> Танзимот
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start rounded-xl">Тағйир додани ном</Button>
            <Button variant="outline" className="w-full justify-start rounded-xl">Иваз кардани парол</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0 border-primary/5">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        {label}
      </div>
      <div className="font-medium text-sm">{value}</div>
    </div>
  );
}
