
"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Plus, MessageCircle, User as UserIcon, LogOut, Briefcase, TrendingUp, Filter, Menu, Home, List, Info, ShieldAlert, Heart, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useRTDB, useRTDBData, useUser } from "@/firebase";
import { ref, update } from "firebase/database";
import { JobListing, UserProfile } from "@/app/lib/types";
import { JobCard } from "@/components/JobCard";
import { JobDetails } from "@/components/JobDetails";
import { JobForm } from "@/components/JobForm";
import { AuthView } from "@/components/AuthView";
import { ChatList } from "@/components/ChatList";
import { ChatWindow } from "@/components/ChatWindow";
import { ProfileView } from "@/components/ProfileView";
import { MyJobsView } from "@/components/MyJobsView";
import { AboutView } from "@/components/AboutView";
import { FavoritesView } from "@/components/FavoritesView";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const CITIES = ["Ҳама шаҳрҳо", "Душанбе", "Хуҷанд", "Бохтар", "Кӯлоб", "Истаравшан", "Исфара", "Конибодом", "Турсунзода", "Ваҳдат", "Роғун", "Норак", "Панҷакент", "Ҳисор"];

export default function KoryobTJ() {
  const auth = useAuth();
  const rtdb = useRTDB();
  const { user } = useUser();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("Ҳама шаҳрҳо");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"jobs" | "chat" | "profile" | "my-jobs" | "create-job" | "about" | "favorites" | "auth" | "job-details">("jobs");
  const [activeChatEmail, setActiveChatEmail] = useState<string | null>(null);

  const { data: jobsObj } = useRTDBData("jobs");
  const jobsData = useMemo(() => {
    if (!jobsObj) return [];
    return Object.entries(jobsObj).map(([id, val]: [string, any]) => ({ id, ...val })) as JobListing[];
  }, [jobsObj]);

  const userEncodedEmail = user?.email ? encodeURIComponent(user.email).replace(/\./g, '%2E') : null;
  const { data: currentUserProfile } = useRTDBData(userEncodedEmail ? `users/${userEncodedEmail}` : null) as { data: UserProfile | null };

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
      setActiveView("auth");
      return;
    }
    if (user.email === partnerEmail) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Шумо ба худатон навишта наметавонед." });
      return;
    }
    setActiveChatEmail(partnerEmail);
    setActiveView("chat");
  };

  const handleJobClick = (jobId: string) => {
    if (!user) {
      setActiveView("auth");
      return;
    }
    setSelectedJobId(jobId);
    setActiveView("job-details");
  };

  if (currentUserProfile?.isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 text-center shadow-2xl space-y-6 border border-destructive/20">
          <div className="bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-destructive animate-pulse">
            <ShieldAlert size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-foreground tracking-tight">Аккаунт Блок шуд</h2>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Мутаассифона, ҳисоби шумо барои риоя накардани қоидаҳои платформа (дашном ё гузоришҳои зиёд) блок карда шуд.
            </p>
          </div>
          <Button onClick={handleLogout} className="w-full h-14 rounded-2xl text-lg font-black" variant="destructive">
            <LogOut size={20} className="mr-2" /> Баромад аз ҳисоб
          </Button>
        </div>
      </div>
    );
  }

  // Auth Screen
  if (activeView === "auth") {
    return <AuthView onBack={() => setActiveView("jobs")} onAuthSuccess={() => setActiveView("jobs")} />;
  }

  // Job Details Screen
  if (activeView === "job-details" && selectedJob) {
    return (
      <JobDetails 
        job={selectedJob} 
        onBack={() => setActiveView("jobs")} 
        onChat={() => handleStartChat(selectedJob.postedEmail)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col pb-24 md:pb-0">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b px-4 md:px-12 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveView("jobs")}>
          <div className="bg-primary text-white p-2.5 rounded-2xl shadow-lg shadow-primary/30 group-hover:scale-105 transition-all">
            <Briefcase size={26} />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tighter">KORYOB.TJ</h1>
        </div>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 mr-4 bg-secondary/30 p-1 rounded-2xl">
                <Button variant={activeView === 'jobs' ? 'default' : 'ghost'} onClick={() => setActiveView("jobs")} className="rounded-xl font-bold">Асосӣ</Button>
                <Button variant={activeView === 'chat' ? 'default' : 'ghost'} onClick={() => setActiveView("chat")} className="rounded-xl font-bold">Чат</Button>
                <Button variant={activeView === 'favorites' ? 'default' : 'ghost'} onClick={() => setActiveView("favorites")} className="rounded-xl font-bold">Писандида</Button>
                {currentUserProfile?.role === 'korfarmo' && (
                  <Button variant={activeView === 'my-jobs' ? 'default' : 'ghost'} onClick={() => setActiveView("my-jobs")} className="rounded-xl font-bold">Эълонҳо</Button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col items-end mr-2 text-right">
                  <span className="text-sm font-black text-foreground leading-tight">{currentUserProfile?.name}</span>
                  <span className="text-[10px] uppercase font-black text-primary tracking-widest">
                    {currentUserProfile?.role === 'korfarmo' ? 'Корфармо' : 'Корҷуй'}
                  </span>
                </div>
                
                <div className="hidden md:flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setActiveView("profile")} className={`rounded-xl h-11 w-11 ${activeView === 'profile' ? 'border-primary text-primary bg-primary/5' : 'border-primary/10'}`}>
                    <UserIcon size={22} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl h-11 w-11 text-destructive hover:bg-destructive/10">
                    <LogOut size={22} />
                  </Button>
                </div>

                <div className="md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-xl h-11 w-11 border-primary/10">
                        <Menu size={24} className="text-primary" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="rounded-l-[2.5rem] p-8">
                      <SheetHeader>
                        <SheetTitle className="text-left font-black text-primary text-2xl tracking-tighter">МЕНЮ</SheetTitle>
                      </SheetHeader>
                      <div className="flex flex-col gap-4 mt-10">
                        <MobileNavItem icon={<Home />} label="Асосӣ" active={activeView === 'jobs'} onClick={() => setActiveView("jobs")} />
                        <MobileNavItem icon={<MessageCircle />} label="Чат" active={activeView === 'chat'} onClick={() => setActiveView("chat")} />
                        <MobileNavItem icon={<Heart />} label="Писандидаҳо" active={activeView === 'favorites'} onClick={() => setActiveView("favorites")} />
                        <MobileNavItem icon={<Info />} label="Оиди барнома" active={activeView === 'about'} onClick={() => setActiveView("about")} />
                        {currentUserProfile?.role === 'korfarmo' && (
                          <MobileNavItem icon={<List />} label="Эълонҳои ман" active={activeView === 'my-jobs'} onClick={() => setActiveView("my-jobs")} />
                        )}
                        <MobileNavItem icon={<UserIcon />} label="Профил" active={activeView === 'profile'} onClick={() => setActiveView("profile")} />
                        <div className="mt-auto pt-10 border-t">
                          <Button variant="ghost" className="w-full justify-start gap-4 h-14 text-lg font-black rounded-2xl text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                            <LogOut size={22} /> Баромад
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
              <Button variant="ghost" className="hidden md:flex font-bold" onClick={() => setActiveView("about")}>Оиди мо</Button>
              <Button onClick={() => setActiveView("auth")} className="rounded-2xl px-8 h-11 font-black shadow-lg shadow-primary/20 transition-transform active:scale-95">Воридшавӣ</Button>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1 container max-w-7xl mx-auto p-4 md:p-12">
        {activeView === "jobs" && (
          <div className="space-y-12">
            <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-white to-primary/5 p-10 md:p-24 rounded-[3rem] border border-primary/10 text-center space-y-10 shadow-2xl shadow-primary/5">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
              
              <div className="space-y-5 relative">
                <Badge className="bg-white/90 text-primary border-primary/20 px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                  Платформаи №1 дар Тоҷикистон
                </Badge>
                <h2 className="text-4xl md:text-7xl font-black text-foreground tracking-tighter leading-[1] md:px-20">
                  Кори орзуи худро <br /> <span className="text-primary underline decoration-primary/20 underline-offset-8">дар як лаҳза ёбед</span>
                </h2>
                <p className="text-muted-foreground text-xl max-w-2xl mx-auto font-semibold leading-relaxed">
                  Мо мутахассисонро бо ширкатҳои пешсафи Тоҷикистон мустақиман пайваст мекунем.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 max-w-5xl mx-auto pt-8 relative">
                <div className="relative flex-[2] group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary w-6 h-6 group-focus-within:scale-110 transition-transform" />
                  <Input 
                    placeholder="Вазифа, ширкат ё калимаи калидӣ..." 
                    className="pl-14 h-16 rounded-[1.5rem] bg-white shadow-2xl shadow-primary/5 border-primary/10 transition-all text-lg font-medium focus:ring-4 focus:ring-primary/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="h-16 rounded-[1.5rem] bg-white shadow-2xl shadow-primary/5 border-primary/10 font-black text-lg px-6">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-6 h-6 text-primary" />
                        <SelectValue placeholder="Интихоби шаҳр" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl p-2">
                      {CITIES.map(city => (
                        <SelectItem key={city} value={city} className="font-bold h-12 rounded-xl focus:bg-primary/5">{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-primary/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <TrendingUp size={28} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-foreground tracking-tight">Эълонҳои ҷорӣ</h3>
                    <p className="text-sm text-muted-foreground font-bold">{filteredJobs.length} эълон ёфт шуд</p>
                  </div>
                </div>
                {currentUserProfile?.role === 'korfarmo' && (
                  <Button onClick={() => setActiveView("create-job")} className="hidden md:flex rounded-2xl gap-3 h-14 px-8 text-lg font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    <Plus size={24} /> Иловаи эълон
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map(job => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onClick={() => handleJobClick(job.id)} 
                      onChat={() => handleStartChat(job.postedEmail)}
                      isOwner={user?.uid === job.postedUid}
                    />
                  ))
                ) : (
                  <div className="lg:col-span-3 text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-primary/10 space-y-5 shadow-inner">
                    <div className="bg-secondary/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-muted-foreground/30">
                      <Filter size={48} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xl font-black">Эълонҳо ёфт нашуданд.</p>
                      <p className="text-sm text-muted-foreground/60 font-bold">Лутфан калимаҳои ҷустуҷӯиро иваз кунед ё шаҳри дигарро интихоб намоед.</p>
                    </div>
                  </div>
                )}
              </div>

              {!user && filteredJobs.length >= 5 && (
                <div className="relative overflow-hidden bg-primary/5 p-12 rounded-[3rem] text-center space-y-6 border border-primary/10 mt-16 shadow-xl">
                  <div className="space-y-2">
                    <h4 className="text-3xl font-black tracking-tight">Дастрасии комил мехоҳед?</h4>
                    <p className="font-bold text-muted-foreground max-w-xl mx-auto leading-relaxed">
                      Барои дидани ҳамаи эълонҳо, маълумоти тамос ва оғози чат бо корфармоён, лутфан ворид шавед ё сабти ном кунед.
                    </p>
                  </div>
                  <Button onClick={() => setActiveView("auth")} className="rounded-[1.25rem] h-14 px-12 text-xl font-black shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    Ҳозир ҳамроҳ шавед
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "chat" && (
          <div className="grid md:grid-cols-3 gap-8 h-[80vh] animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="md:col-span-1 bg-white rounded-[2.5rem] border shadow-2xl shadow-black/5 overflow-hidden border-primary/5">
              <ChatList activeChatEmail={activeChatEmail} onSelect={setActiveChatEmail} />
            </div>
            <div className="md:col-span-2 bg-white rounded-[2.5rem] border shadow-2xl shadow-black/5 overflow-hidden flex flex-col border-primary/5">
              {activeChatEmail ? (
                <ChatWindow partnerEmail={activeChatEmail} onBack={() => setActiveChatEmail(null)} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 space-y-4">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary/40">
                    <MessageCircle size={56} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-2xl text-foreground/80">Мукотибаи худро оғоз кунед</p>
                    <p className="font-bold text-muted-foreground">Яке аз чатҳоро аз рӯйхат интихоб намоед.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "profile" && (
          <ProfileView 
            profile={currentUserProfile || undefined} 
            onViewMyJobs={() => setActiveView("my-jobs")}
            onAbout={() => setActiveView("about")}
          />
        )}

        {activeView === "favorites" && (
          <FavoritesView 
            onSelectJob={(id) => handleJobClick(id)}
            onBack={() => setActiveView("jobs")}
          />
        )}

        {activeView === "my-jobs" && (
          <MyJobsView 
            onBack={() => setActiveView("profile")}
          />
        )}

        {activeView === "create-job" && (
          <JobForm 
            jobId={null} 
            onSuccess={() => setActiveView("jobs")}
            onCancel={() => setActiveView("jobs")}
          />
        )}

        {activeView === "about" && (
          <AboutView onBack={() => setActiveView("jobs")} />
        )}
      </main>

      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t px-8 py-4 flex items-center justify-between z-50 rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.08)] border-primary/5">
          <MobileNavTab icon={<Home size={26} />} label="Асосӣ" active={activeView === 'jobs'} onClick={() => setActiveView("jobs")} />
          <MobileNavTab icon={<MessageCircle size={26} />} label="Чат" active={activeView === 'chat'} onClick={() => setActiveView("chat")} />
          
          {currentUserProfile?.role === 'korfarmo' ? (
            <button onClick={() => setActiveView("create-job")} className="bg-primary text-white p-4 rounded-[1.5rem] -mt-14 shadow-2xl shadow-primary/40 border-[6px] border-[#FDFCFB] active:scale-90 transition-all hover:rotate-90">
              <Plus size={32} />
            </button>
          ) : (
            <MobileNavTab icon={<Heart size={26} />} label="Писанд" active={activeView === 'favorites'} onClick={() => setActiveView("favorites")} />
          )}

          <MobileNavTab icon={<List size={26} />} label="Эълонҳо" active={activeView === 'my-jobs'} onClick={() => setActiveView("my-jobs")} hidden={currentUserProfile?.role !== 'korfarmo'} />
          
          <MobileNavTab icon={<UserIcon size={26} />} label="Профил" active={activeView === 'profile'} onClick={() => setActiveView("profile")} />
        </div>
      )}
    </div>
  );
}

function MobileNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <Button 
      variant="ghost" 
      className={`justify-start gap-4 h-16 text-xl font-black rounded-2xl ${active ? 'bg-primary/10 text-primary' : ''}`} 
      onClick={onClick}
    >
      <span className={active ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
      {label}
    </Button>
  );
}

function MobileNavTab({ icon, label, active, onClick, hidden = false }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, hidden?: boolean }) {
  if (hidden) return null;
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-primary scale-110' : 'text-muted-foreground/60'}`}>
      <div className={`${active ? 'bg-primary/10 p-2 rounded-xl' : ''}`}>{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
