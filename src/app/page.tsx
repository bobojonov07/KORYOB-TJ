
"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Plus, MessageCircle, User, LogOut, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useFirestore, useCollection, useUser } from "@/firebase";
import { collection, query, where, orderBy, doc, updateDoc, increment } from "firebase/firestore";
import { JobListing, UserProfile } from "@/app/lib/types";
import { JobCard } from "@/components/JobCard";
import { JobDetails } from "@/components/JobDetails";
import { JobForm } from "@/components/JobForm";
import { AuthModals } from "@/components/AuthModals";
import { ChatList } from "@/components/ChatList";
import { ChatWindow } from "@/components/ChatWindow";
import { ProfileView } from "@/components/ProfileView";
import { MyJobsView } from "@/components/MyJobsView";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";

const CITIES = ["Ҳама шаҳрҳо", "Душанбе", "Роғун", "Бохтар", "Истаравшан", "Исфара", "Конибодом", "Кӯлоб", "Турсунзода", "Ваҳдат", "Хуҷанд"];

export default function KoryobTJ() {
  const { auth } = useAuth();
  const { db } = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("Ҳама шаҳрҳо");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"jobs" | "chat" | "profile" | "my-jobs" | "create-job">("jobs");
  const [activeChatUid, setActiveChatUid] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Firestore Queries
  const jobsRef = useMemo(() => collection(db, "jobs"), [db]);
  const activeJobsQuery = useMemo(() => query(jobsRef, where("active", "==", true), orderBy("postedAt", "desc")), [jobsRef]);
  const { data: jobsData = [] } = useCollection(activeJobsQuery) as { data: JobListing[] };

  const usersRef = useMemo(() => collection(db, "users"), [db]);
  const userProfileDoc = useMemo(() => (user ? doc(usersRef, user.uid) : null), [usersRef, user]);
  const { data: profile } = useCollection(userProfileDoc ? query(usersRef, where("uid", "==", user!.uid)) : null) as { data: UserProfile[] };
  const currentUserProfile = profile?.[0];

  useEffect(() => {
    if (user && userProfileDoc) {
      updateDoc(userProfileDoc, { lastSeen: Date.now() });
    }
  }, [user, userProfileDoc]);

  const filteredJobs = useMemo(() => {
    let list = jobsData;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.company.toLowerCase().includes(q) || 
        j.desc.toLowerCase().includes(q)
      );
    }
    if (cityFilter !== "Ҳама шаҳрҳо") {
      list = list.filter(j => j.city === cityFilter);
    }
    return user ? list : list.slice(0, 5);
  }, [jobsData, searchQuery, cityFilter, user]);

  const selectedJob = jobsData.find(j => j.id === selectedJobId);

  const handleLogout = async () => {
    await signOut(auth);
    setActiveView("jobs");
    toast({ title: "Шумо баромадед", description: "То дидор!" });
  };

  const handleStartChat = (partnerUid: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setActiveChatUid(partnerUid);
    setActiveView("chat");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView("jobs")}>
          <div className="bg-primary text-white p-1.5 rounded-lg">
            <Briefcase size={24} />
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">KORYOB.TJ</h1>
        </div>

        <nav className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:block text-sm font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full capitalize">
                {currentUserProfile?.name} — {currentUserProfile?.role === 'korfarmo' ? 'Корфармо' : 'Корҷуй'}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setActiveView("chat")} className={activeView === 'chat' ? 'text-primary' : ''}>
                <MessageCircle />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setActiveView("profile")} className={activeView === 'profile' ? 'text-primary' : ''}>
                <User />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive">
                <LogOut />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setIsAuthModalOpen(true)}>Воридшавӣ</Button>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1 container max-w-5xl mx-auto p-4 md:p-6">
        {activeView === "jobs" && (
          <div className="space-y-6">
            <section className="bg-gradient-to-b from-primary/5 to-white p-8 rounded-3xl text-center space-y-4 border border-primary/10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">Кори орзуи худро ёбед</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                KORYOB TJ — Платформаи №1 барои дарёфти ҷойҳои корӣ дар Тоҷикистон.
              </p>
              <div className="flex flex-col md:row gap-3 max-w-3xl mx-auto pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Ҷустуҷӯ: вазифа, ширкат..." 
                    className="pl-10 rounded-full bg-white shadow-sm border-primary/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-56">
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="rounded-full bg-white shadow-sm border-primary/20">
                      <MapPin className="w-4 h-4 mr-2 text-primary" />
                      <SelectValue placeholder="Шаҳр" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">Эълонҳои ҷорӣ</h3>
                {currentUserProfile?.role === 'korfarmo' && (
                  <Button onClick={() => setActiveView("create-job")} className="rounded-full gap-2">
                    <Plus size={18} /> Иловаи эълон
                  </Button>
                )}
              </div>

              <div className="grid gap-4">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map(job => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onClick={() => setSelectedJobId(job.id)} 
                      onChat={() => handleStartChat(job.postedUid)}
                      isOwner={user?.uid === job.postedUid}
                    />
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl border-dashed border-2">
                    <p className="text-muted-foreground italic">Эълонҳо ёфт нашуданд.</p>
                  </div>
                )}

                {!user && jobsData.length > 5 && (
                  <div className="bg-primary/10 p-6 rounded-2xl text-center space-y-3 border border-primary/20">
                    <p className="font-semibold text-primary">Барои дидани ҳамаи эълонҳо лутфан ворид шавед.</p>
                    <Button onClick={() => setIsAuthModalOpen(true)}>Қайд шудан</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === "chat" && (
          <div className="grid md:grid-cols-3 gap-6 h-[70vh]">
            <div className="md:col-span-1 bg-white rounded-2xl border overflow-hidden">
              <ChatList activeChatUid={activeChatUid} onSelect={setActiveChatUid} />
            </div>
            <div className="md:col-span-2 bg-white rounded-2xl border overflow-hidden flex flex-col">
              {activeChatUid ? (
                <ChatWindow partnerUid={activeChatUid} onBack={() => setActiveChatUid(null)} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-secondary/20">
                  <MessageCircle size={48} className="opacity-20 mb-2" />
                  <p>Чатҳоро интихоб кунед</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "profile" && (
          <ProfileView 
            profile={currentUserProfile} 
            onViewMyJobs={() => setActiveView("my-jobs")}
            onEditJob={(id) => { setSelectedJobId(id); setActiveView("create-job"); }}
          />
        )}

        {activeView === "my-jobs" && (
          <MyJobsView 
            onEditJob={(job) => { setSelectedJobId(job.id); setActiveView("create-job"); }} 
            onBack={() => setActiveView("profile")}
          />
        )}

        {activeView === "create-job" && (
          <JobForm 
            jobId={selectedJobId} 
            onSuccess={() => { setActiveView("jobs"); setSelectedJobId(null); }}
            onCancel={() => { setActiveView("jobs"); setSelectedJobId(null); }}
          />
        )}
      </main>

      <footer className="py-8 border-t bg-white text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} KORYOB.TJ — Ҳамаи ҳуқуқҳо ҳифз шудаанд.</p>
      </footer>

      {/* Modals */}
      {selectedJobId && activeView === "jobs" && (
        <JobDetails 
          job={selectedJob!} 
          onClose={() => setSelectedJobId(null)} 
          onChat={() => handleStartChat(selectedJob!.postedUid)}
        />
      )}

      <AuthModals isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
