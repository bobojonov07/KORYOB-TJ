"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Plus, MessageCircle, User, LogOut, Briefcase, TrendingUp, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useFirestore, useCollection, useUser } from "@/firebase";
import { collection, query, where, orderBy, doc, updateDoc } from "firebase/firestore";
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
import { Badge } from "@/components/ui/badge";

const CITIES = ["Ҳама шаҳрҳо", "Душанбе", "Роғун", "Бохтар", "Истаравшан", "Исфара", "Конибодом", "Кӯлоб", "Турсунзода", "Ваҳдат", "Хуҷанд"];
const CATEGORIES = ["Муҳосиб", "Ронанда", "Муаллим", "Ошпаз", "Муҳофиз", "Дизайнер"];

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
  const { data: jobsData } = useCollection(activeJobsQuery) as { data: JobListing[] | null };

  const usersRef = useMemo(() => collection(db, "users"), [db]);
  const userProfileDoc = useMemo(() => (user ? doc(usersRef, user.uid) : null), [usersRef, user]);
  const { data: profile } = useCollection(userProfileDoc ? query(usersRef, where("uid", "==", user!.uid)) : null) as { data: UserProfile[] | null };
  const currentUserProfile = profile?.[0];

  useEffect(() => {
    if (user && userProfileDoc) {
      updateDoc(userProfileDoc, { lastSeen: Date.now() });
    }
  }, [user, userProfileDoc]);

  const filteredJobs = useMemo(() => {
    const baseList = jobsData || [];
    let list = [...baseList];
    
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

  const selectedJob = (jobsData || []).find(j => j.id === selectedJobId);

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
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveView("jobs")}>
          <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <Briefcase size={24} />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tighter">KORYOB.TJ</h1>
        </div>

        <nav className="flex items-center gap-2 md:gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-sm font-bold text-foreground leading-tight">{currentUserProfile?.name}</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  {currentUserProfile?.role === 'korfarmo' ? 'Корфармо' : 'Корҷуй'}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveView("chat")} className={`rounded-xl ${activeView === 'chat' ? 'bg-primary/10 text-primary' : ''}`}>
                <MessageCircle size={22} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setActiveView("profile")} className={`rounded-xl ${activeView === 'profile' ? 'bg-primary/10 text-primary' : ''}`}>
                <User size={22} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl text-destructive hover:bg-destructive/10">
                <LogOut size={22} />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setIsAuthModalOpen(true)} className="rounded-xl px-6 shadow-md shadow-primary/10">Воридшавӣ</Button>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1 container max-w-6xl mx-auto p-4 md:p-8">
        {activeView === "jobs" && (
          <div className="space-y-10">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-white to-primary/5 p-8 md:p-16 rounded-[2.5rem] border border-primary/10 text-center space-y-8">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              
              <div className="space-y-4 relative">
                <Badge variant="secondary" className="bg-white/80 text-primary border-primary/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                  Платформаи №1 дар Тоҷикистон
                </Badge>
                <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tight leading-[1.1]">
                  Кори орзуи худро <br /> <span className="text-primary">дар як лаҳза ёбед</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
                  Пайваст кардани беҳтарин мутахассисон бо ширкатҳои пешсафи кишвар.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto pt-6">
                <div className="relative flex-[2]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input 
                    placeholder="Вазифа, ширкат ё калимаи калидӣ..." 
                    className="pl-12 h-14 rounded-2xl bg-white shadow-xl shadow-primary/5 border-primary/10 focus:ring-primary/20 transition-all text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white shadow-xl shadow-primary/5 border-primary/10 font-semibold">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <SelectValue placeholder="Шаҳр" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {CITIES.map(city => (
                        <SelectItem key={city} value={city} className="font-medium">{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                <span className="text-sm font-bold text-muted-foreground mr-2">Категорияҳои маъмул:</span>
                {CATEGORIES.map(cat => (
                  <Button 
                    key={cat} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSearchQuery(cat)}
                    className="rounded-full bg-white/50 border-primary/10 hover:border-primary hover:text-primary transition-all text-xs font-bold"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </section>

            {/* Content Area */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-primary w-6 h-6" />
                  <h3 className="text-2xl font-black text-foreground">Эълонҳои ҷорӣ</h3>
                </div>
                {currentUserProfile?.role === 'korfarmo' && (
                  <Button onClick={() => setActiveView("create-job")} className="rounded-2xl gap-2 h-12 px-6 shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
                    <Plus size={20} /> Иловаи эълон
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <div className="lg:col-span-2 text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-muted/50 space-y-4">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto opacity-50">
                      <Filter size={32} className="text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-lg font-medium">Мутаассифона, эълонҳо ёфт нашуданд.</p>
                    <Button variant="link" onClick={() => { setSearchQuery(""); setCityFilter("Ҳама шаҳрҳо"); }} className="text-primary font-bold">
                      Тоза кардани филтрҳо
                    </Button>
                  </div>
                )}
              </div>

              {!user && (jobsData?.length || 0) > 5 && (
                <div className="relative overflow-hidden bg-primary/5 p-10 rounded-[2.5rem] text-center space-y-4 border border-primary/10 mt-12">
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black">Дастрасии комил мехоҳед?</h4>
                    <p className="font-medium text-muted-foreground max-w-lg mx-auto">Барои дидани ҳамаи эълонҳо ва тамос бо корфармоён лутфан ворид шавед.</p>
                  </div>
                  <Button onClick={() => setIsAuthModalOpen(true)} className="rounded-xl h-12 px-10 text-lg font-bold shadow-lg shadow-primary/10">Қайд шудан</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "chat" && (
          <div className="grid md:grid-cols-3 gap-6 h-[75vh]">
            <div className="md:col-span-1 bg-white rounded-3xl border shadow-xl shadow-black/5 overflow-hidden">
              <ChatList activeChatUid={activeChatUid} onSelect={setActiveChatUid} />
            </div>
            <div className="md:col-span-2 bg-white rounded-3xl border shadow-xl shadow-black/5 overflow-hidden flex flex-col">
              {activeChatUid ? (
                <ChatWindow partnerUid={activeChatUid} onBack={() => setActiveChatUid(null)} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-secondary/10">
                  <div className="bg-white p-6 rounded-full shadow-inner mb-4">
                    <MessageCircle size={48} className="opacity-20" />
                  </div>
                  <p className="font-bold">Яке аз чатҳоро интихоб кунед</p>
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

      <footer className="py-12 border-t bg-white text-center">
        <div className="container max-w-6xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center gap-2 grayscale opacity-50">
            <Briefcase size={20} />
            <span className="font-black tracking-tighter">KORYOB.TJ</span>
          </div>
          <p className="text-sm text-muted-foreground font-medium">© {new Date().getFullYear()} KORYOB.TJ — Платформаи муосири корёбӣ дар Тоҷикистон.</p>
        </div>
      </footer>

      {selectedJobId && activeView === "jobs" && selectedJob && (
        <JobDetails 
          job={selectedJob} 
          onClose={() => setSelectedJobId(null)} 
          onChat={() => handleStartChat(selectedJob.postedUid)}
        />
      )}

      <AuthModals isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
