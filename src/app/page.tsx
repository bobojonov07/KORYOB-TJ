
"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Plus, MessageCircle, User as UserIcon, LogOut, Briefcase, TrendingUp, Filter, Menu, Home, Heart, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useRTDB, useRTDBData, useUser } from "@/firebase";
import { ref, update } from "firebase/database";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const CITIES = ["Ҳама шаҳрҳо", "Душанбе", "Роғун", "Бохтар", "Истаравшан", "Исфара", "Конибодом", "Кӯлоб", "Турсунзода", "Ваҳдат", "Хуҷанд"];
const CATEGORIES = ["Муҳосиб", "Ронанда", "Муаллим", "Ошпаз", "Муҳофиз", "Дизайнер"];

export default function KoryobTJ() {
  const auth = useAuth();
  const rtdb = useRTDB();
  const { user } = useUser();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("Ҳама шаҳрҳо");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"jobs" | "chat" | "profile" | "my-jobs" | "create-job">("jobs");
  const [activeChatEmail, setActiveChatEmail] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { data: jobsObj } = useRTDBData("jobs");
  const jobsData = useMemo(() => {
    if (!jobsObj) return [];
    return Object.entries(jobsObj).map(([id, val]: [string, any]) => ({ id, ...val })) as JobListing[];
  }, [jobsObj]);

  const userEncodedEmail = user?.email ? encodeURIComponent(user.email).replace(/\./g, '%2E') : null;
  const { data: currentUserProfile } = useRTDBData(userEncodedEmail ? `users/${userEncodedEmail}` : null);

  useEffect(() => {
    if (user && userEncodedEmail && rtdb) {
      update(ref(rtdb, `users/${userEncodedEmail}`), { lastSeen: Date.now() });
    }
  }, [user, userEncodedEmail, rtdb]);

  const filteredJobs = useMemo(() => {
    if (!jobsData) return [];
    let list = jobsData.filter(j => j.active);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.company.toLowerCase().includes(q) || 
        (j.desc && j.desc.toLowerCase().includes(q))
      );
    }
    if (cityFilter !== "Ҳама шаҳрҳо") {
      list = list.filter(j => j.city === cityFilter);
    }
    return user ? list : list.slice(0, 5);
  }, [jobsData, searchQuery, cityFilter, user]);

  const selectedJob = jobsData.find(j => j.id === selectedJobId);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setActiveView("jobs");
    toast({ title: "Шумо баромадед", description: "То дидор!" });
  };

  const handleStartChat = (partnerEmail: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setActiveChatEmail(partnerEmail);
    setActiveView("chat");
  };

  const handleViewDetails = (jobId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedJobId(jobId);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col pb-20 md:pb-0">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveView("jobs")}>
          <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <Briefcase size={24} />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tighter">KORYOB.TJ</h1>
        </div>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-4 mr-4">
                <Button variant="ghost" onClick={() => setActiveView("jobs")} className={activeView === 'jobs' ? 'text-primary font-bold' : ''}>Асосӣ</Button>
                <Button variant="ghost" onClick={() => setActiveView("chat")} className={activeView === 'chat' ? 'text-primary font-bold' : ''}>Чат</Button>
                {currentUserProfile?.role === 'korfarmo' && (
                  <Button variant="ghost" onClick={() => setActiveView("my-jobs")} className={activeView === 'my-jobs' ? 'text-primary font-bold' : ''}>Эълонҳои ман</Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col items-end mr-2 text-right">
                  <span className="text-sm font-bold text-foreground leading-tight">{currentUserProfile?.name}</span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    {currentUserProfile?.role === 'korfarmo' ? 'Корфармо' : 'Корҷуй'}
                  </span>
                </div>
                
                {/* Desktop User Menu */}
                <div className="hidden md:flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setActiveView("profile")} className={`rounded-xl ${activeView === 'profile' ? 'bg-primary/10 text-primary' : ''}`}>
                    <UserIcon size={22} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl text-destructive hover:bg-destructive/10">
                    <LogOut size={22} />
                  </Button>
                </div>

                {/* Mobile Hamburger Menu */}
                <div className="md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl">
                        <Menu size={24} />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="rounded-l-3xl">
                      <SheetHeader>
                        <SheetTitle className="text-left font-black text-primary text-xl">МЕНЮ</SheetTitle>
                      </SheetHeader>
                      <div className="flex flex-col gap-4 mt-8">
                        <Button variant="ghost" className="justify-start gap-3 h-12 text-lg font-bold rounded-xl" onClick={() => setActiveView("jobs")}>
                          <Home size={20} /> Асосӣ
                        </Button>
                        <Button variant="ghost" className="justify-start gap-3 h-12 text-lg font-bold rounded-xl" onClick={() => setActiveView("chat")}>
                          <MessageCircle size={20} /> Чат
                        </Button>
                        {currentUserProfile?.role === 'korfarmo' && (
                          <Button variant="ghost" className="justify-start gap-3 h-12 text-lg font-bold rounded-xl" onClick={() => setActiveView("my-jobs")}>
                            <List size={20} /> Эълонҳои ман
                          </Button>
                        )}
                        <Button variant="ghost" className="justify-start gap-3 h-12 text-lg font-bold rounded-xl" onClick={() => setActiveView("profile")}>
                          <UserIcon size={20} /> Профил
                        </Button>
                        <div className="mt-auto pt-8 border-t">
                          <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-lg font-bold rounded-xl text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                            <LogOut size={20} /> Баромад
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </>
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
            </section>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-primary w-6 h-6" />
                  <h3 className="text-2xl font-black text-foreground">Эълонҳои ҷорӣ</h3>
                </div>
                {currentUserProfile?.role === 'korfarmo' && (
                  <Button onClick={() => setActiveView("create-job")} className="hidden md:flex rounded-2xl gap-2 h-12 px-6 shadow-lg shadow-primary/20 transition-transform hover:scale-105">
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
                      onClick={() => handleViewDetails(job.id)} 
                      onChat={() => handleStartChat(job.postedEmail)}
                      isOwner={user?.uid === job.postedUid}
                    />
                  ))
                ) : (
                  <div className="lg:col-span-2 text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-muted/50 space-y-4">
                    <Filter size={32} className="text-muted-foreground mx-auto opacity-50" />
                    <p className="text-muted-foreground text-lg font-medium">Мутаассифона, эълонҳо ёфт нашуданд.</p>
                    <Button variant="link" onClick={() => { setSearchQuery(""); setCityFilter("Ҳама шаҳрҳо"); }} className="text-primary font-bold">
                      Тоза кардани филтрҳо
                    </Button>
                  </div>
                )}
              </div>

              {!user && filteredJobs.length >= 5 && (
                <div className="relative overflow-hidden bg-primary/5 p-10 rounded-[2.5rem] text-center space-y-4 border border-primary/10 mt-12">
                  <h4 className="text-2xl font-black">Дастрасии комил мехоҳед?</h4>
                  <p className="font-medium text-muted-foreground max-w-lg mx-auto">Барои дидани ҳамаи эълонҳо ва тамос бо корфармоён лутфан ворид шавед.</p>
                  <Button onClick={() => setIsAuthModalOpen(true)} className="rounded-xl h-12 px-10 text-lg font-bold shadow-lg shadow-primary/10">Қайд шудан</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "chat" && (
          <div className="grid md:grid-cols-3 gap-6 h-[75vh]">
            <div className="md:col-span-1 bg-white rounded-3xl border shadow-xl shadow-black/5 overflow-hidden">
              <ChatList activeChatEmail={activeChatEmail} onSelect={setActiveChatEmail} />
            </div>
            <div className="md:col-span-2 bg-white rounded-3xl border shadow-xl shadow-black/5 overflow-hidden flex flex-col">
              {activeChatEmail ? (
                <ChatWindow partnerEmail={activeChatEmail} onBack={() => setActiveChatEmail(null)} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-secondary/10">
                  <MessageCircle size={48} className="opacity-20 mb-4" />
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

      {/* Mobile Bottom Navigation */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-3 flex items-center justify-between z-50 rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <button onClick={() => setActiveView("jobs")} className={`flex flex-col items-center gap-1 ${activeView === 'jobs' ? 'text-primary' : 'text-muted-foreground'}`}>
            <Home size={24} />
            <span className="text-[10px] font-bold">Асосӣ</span>
          </button>
          <button onClick={() => setActiveView("chat")} className={`flex flex-col items-center gap-1 ${activeView === 'chat' ? 'text-primary' : 'text-muted-foreground'}`}>
            <MessageCircle size={24} />
            <span className="text-[10px] font-bold">Чат</span>
          </button>
          
          {currentUserProfile?.role === 'korfarmo' ? (
            <button onClick={() => setActiveView("create-job")} className="bg-primary text-white p-3 rounded-2xl -mt-10 shadow-lg shadow-primary/30 border-4 border-white active:scale-90 transition-transform">
              <Plus size={28} />
            </button>
          ) : (
            <button className="flex flex-col items-center gap-1 text-muted-foreground opacity-50">
              <Heart size={24} />
              <span className="text-[10px] font-bold">Писанд</span>
            </button>
          )}

          <button onClick={() => setActiveView("my-jobs")} className={`flex flex-col items-center gap-1 ${activeView === 'my-jobs' ? 'text-primary' : 'text-muted-foreground'} ${currentUserProfile?.role !== 'korfarmo' ? 'hidden' : ''}`}>
            <List size={24} />
            <span className="text-[10px] font-bold">Эълонҳо</span>
          </button>
          
          <button onClick={() => setActiveView("profile")} className={`flex flex-col items-center gap-1 ${activeView === 'profile' ? 'text-primary' : 'text-muted-foreground'}`}>
            <UserIcon size={24} />
            <span className="text-[10px] font-bold">Профил</span>
          </button>
        </div>
      )}

      <footer className="py-12 border-t bg-white text-center hidden md:block">
        <div className="container max-w-6xl mx-auto px-4 space-y-4">
          <p className="text-sm text-muted-foreground font-medium">© {new Date().getFullYear()} KORYOB.TJ — Платформаи муосири корёбӣ дар Тоҷикистон.</p>
        </div>
      </footer>

      {selectedJobId && activeView === "jobs" && selectedJob && (
        <JobDetails 
          job={selectedJob} 
          onClose={() => setSelectedJobId(null)} 
          onChat={() => handleStartChat(selectedJob.postedEmail)}
        />
      )}

      <AuthModals isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
