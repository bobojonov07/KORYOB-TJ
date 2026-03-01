"use client";

import { useMemo } from "react";
import { useUser, useRTDB, useRTDBData } from "@/firebase";
import { ref, remove, update } from "firebase/database";
import { JobListing } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Edit, CheckCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MyJobsViewProps {
  onEditJob: (job: JobListing) => void;
  onBack: () => void;
}

export function MyJobsView({ onEditJob, onBack }: MyJobsViewProps) {
  const rtdb = useRTDB();
  const { user } = useUser();
  const { toast } = useToast();

  const { data: jobsObj } = useRTDBData("jobs");
  const myJobs = useMemo(() => {
    if (!jobsObj || !user?.email) return [];
    return Object.entries(jobsObj)
      .map(([id, val]: [string, any]) => ({ id, ...val }))
      .filter((j: any) => j.postedEmail === user.email)
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()) as JobListing[];
  }, [jobsObj, user]);

  const handleDelete = async (id: string) => {
    if (confirm("Шумо мехоҳед ин эълонро ҳазф кунед?")) {
      await remove(ref(rtdb, `jobs/${id}`));
      toast({ title: "Ҳазф шуд" });
    }
  };

  const toggleActive = async (job: JobListing) => {
    await update(ref(rtdb, `jobs/${job.id}`), { active: !job.active });
    toast({ title: job.active ? "Эълон ғайрифаъол шуд" : "Эълон фаъол шуд" });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <h2 className="text-2xl font-bold">Эълонҳои ман</h2>
      </div>

      <div className="grid gap-4">
        {myJobs.map(job => (
          <Card key={job.id} className={cn("overflow-hidden border-primary/10 shadow-sm", !job.active && "opacity-60 grayscale")}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge variant={job.active ? "default" : "secondary"}>
                  {job.active ? "Фаъол" : "Ғайрифаъол"}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye size={14} /> {job.views || 0}
                </div>
              </div>
              <CardTitle className="text-xl font-bold mt-2">{job.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 italic">{job.desc}</p>
            </CardContent>
            <CardFooter className="bg-secondary/10 flex flex-wrap gap-2 py-3">
              <Button size="sm" variant="outline" onClick={() => onEditJob(job)} className="gap-2 rounded-full">
                <Edit size={14} /> Таҳрир
              </Button>
              <Button size="sm" variant={job.active ? "secondary" : "default"} onClick={() => toggleActive(job)} className="gap-2 rounded-full">
                <CheckCircle size={14} /> {job.active ? "Ғайрифаъол кардан" : "Фаъол кардан"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(job.id)} className="gap-2 rounded-full ml-auto">
                <Trash2 size={14} /> Ҳазф
              </Button>
            </CardFooter>
          </Card>
        ))}
        {myJobs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Шумо то ҳол ягон эълон надоред.</p>
          </div>
        )}
      </div>
    </div>
  );
}
