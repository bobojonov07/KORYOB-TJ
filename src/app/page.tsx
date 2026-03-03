
"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Plus, MessageCircle, User as UserIcon, LogOut, Briefcase, Menu, Home, List, Info, ShieldAlert, Heart, ChevronLeft } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
  const { data: currentUserProfileObj } = useRTDBData(userEncodedEmail ? `users/${userEncodedEmail}` : null);
  const currentUserProfile = currentUserProfileObj as UserProfile | null;

  // Notification for new messages
  const { data: unreadStatus } = useRTDBData(userEncodedEmail ? `userNotifications/${userEncodedEmail}` : null);
  const hasUnreadMessages = !!unreadStatus;

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
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 text-center shadow-2xl space-y-6 border border-destructive/20 overflow-hidden">
          <div className="bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-destructive animate-pulse">
            <ShieldAlert size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Аккаунт Блок шуд</h2>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Мутаассифона, ҳисоби шумо барои риоя накардани қоидаҳои платформа блок карда шуд.
            </p>
          </div>
          <Button onClick={handleLogout} className="w-full h-14 rounded-2xl text-lg font-black" variant="destructive">
            <LogOut size={20} className="mr-2" /> Баромад аз ҳисоб
          </Button>
        </div>
      </div>
    );
  }

  if (activeView === "auth") {
    return <AuthView onBack={() => setActiveView("jobs")} onAuthSuccess={() => setActiveView("jobs")} />;
  }

  if (activeView === "job-details" && selectedJob) {
    return (
      <JobDetails 
        job={selectedJob} 
        onBack={() => setActiveView("jobs")} 
        onChat={() => handleStartChat(selectedJob.postedEmail)} 
      />
    );
  }

  // Full screen views for chat on mobile
  const isFullScreenView = (activeView === "chat" || activeView === "job-details") && typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col pb-24 md:pb-0 overflow-x-hidden">
      {/* Universal Header */}
      {!isFullScreenView && (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b px-4 md:px-12 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveView("jobs"); setActiveChatEmail(null); }}>
            <div className="bg-primary text-white p-2 rounded-xl shadow-lg">
              <Briefcase size={24} />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-primary tracking-tighter">KORYOB.TJ</h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavButton icon={<Home size={20}/>} label="Асосӣ" active={activeView === 'jobs'} onClick={() => {setActiveView("jobs"); setActiveChatEmail(null);}} />
            {user && (
              <>
                <div className="relative">
                  <NavButton icon={<MessageCircle size={20}/>} label="Чат" active={activeView === 'chat'} onClick={() => setActiveView("chat")} />
                  {hasUnreadMessages && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white"></div>}
                </div>
                <NavButton icon={<Heart size={20}/>} label="Писандидаҳо" active={activeView === 'favorites'} onClick={() => setActiveView("favorites")} />
                {currentUserProfile?.role === 'korfarmo' && (
                  <NavButton icon={<List size={20}/>} label="Эълонҳои ман" active={activeView === 'my-jobs'} onClick={() => setActiveView("my-jobs")} />
                )}
                <NavButton icon={<UserIcon size={20}/>} label="Профил" active={activeView === 'profile'} onClick={() => setActiveView("profile")} />
              </>
            )}
            <NavButton icon={<Info size={20}/>} label="Оиди мо" active={activeView === 'about'} onClick={() => setActiveView("about")} />
            
            {!user ? (
              <Button onClick={() => setActiveView("auth")} className="rounded-xl font-black px-6">Воридшавӣ</Button>
            ) : (
              <Button variant="ghost" onClick={handleLogout} className="text-destructive font-black gap-2 hover:bg-destructive/10 rounded-xl">
                <LogOut size={18} /> Баромад
              </Button>
            )}
          </nav>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden flex items-center gap-3">
            {!user ? (
              <Button onClick={() => setActiveView("auth")} size="sm" className="rounded-xl font-black">Воридшавӣ</Button>
            ) : (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 relative">
                    <Menu size={22} className="text-primary" />
                    {hasUnreadMessages && <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85%] rounded-l-[2.5rem] p-6">
                  <SheetHeader>
                    <SheetTitle className="text-left font-black text-primary text-xl tracking-tighter">МЕНЮ</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-3 mt-8">
                    <MobileNavItem icon={<Home size={20}/>} label="Асосӣ" active={activeView === 'jobs'} onClick={() => {setActiveView("jobs"); setActiveChatEmail(null);}} />
                    <div className="relative">
                      <MobileNavItem icon={<MessageCircle size={20}/>} label="Чат" active={activeView === 'chat'} onClick={() => setActiveView("chat")} />
                      {hasUnreadMessages && <div className="absolute top-1/2 -translate-y-1/2 right-4 w-2.5 h-2.5 bg-primary rounded-full"></div>}
                    </div>
                    <MobileNavItem icon={<Heart size={20}/>} label="Писандидаҳо" active={activeView === 'favorites'} onClick={() => setActiveView("favorites")} />
                    <MobileNavItem icon={<Info size={20}/>} label="Оиди мо" active={activeView === 'about'} onClick={() => setActiveView("about")} />
                    {currentUserProfile?.role === 'korfarmo' && (
                      <MobileNavItem icon={<List size={20}/>} label="Эълонҳои ман" active={activeView === 'my-jobs'} onClick={() => setActiveView("my-jobs")} />
                    )}
                    <MobileNavItem icon={<UserIcon size={20}/>} label="Профил" active={activeView === 'profile'} onClick={() => setActiveView("profile")} />
                    <div className="mt-auto pt-6 border-t">
                      <Button variant="ghost" className="w-full justify-start gap-4 h-12 text-md font-black rounded-xl text-destructive" onClick={handleLogout}>
                        <LogOut size={20} /> Баромад
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </header>
      )}

      <main className={cn(
        "flex-1 overflow-y-auto",
        isFullScreenView ? "p-0" : "container max-w-7xl mx-auto p-4 md:p-12"
      )}>
        {activeView === "jobs" && (
          <div className="space-y-8">
            <section className="bg-gradient-to-br from-primary/10 to-white p-6 md:p-16 rounded-[2.5rem] border border-primary/5 text-center space-y-6">
              <div className="space-y-3">
                <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter leading-tight">
                  Кори орзуи худро <br /> <span className="text-primary">пайдо кунед</span>
                </h2>
                <p className="text-muted-foreground text-sm md:text-lg font-medium">Платформаи муосири корёбӣ дар Тоҷикистон</p>
              </div>

              <div className="flex flex-col md:flex-row gap-3 max-w-4xl mx-auto pt-4">
                <div className="relative flex-[2]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                  <Input 
                    placeholder="Ҷустуҷӯи кор..." 
                    className="pl-12 h-12 md:h-14 rounded-2xl bg-white border-none shadow-sm font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="h-12 md:h-14 rounded-2xl bg-white border-none shadow-sm font-bold">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <SelectValue placeholder="Шаҳр" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {CITIES.map(city => (
                        <SelectItem key={city} value={city} className="font-bold">{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Эълонҳои ҷорӣ</h3>
                {currentUserProfile?.role === 'korfarmo' && (
                  <Button onClick={() => setActiveView("create-job")} className="rounded-xl gap-2 h-10 px-4 text-sm font-black shadow-md">
                    <Plus size={18} /> Илова
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
                  <div className="col-span-full text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-primary/5">
                    <p className="text-muted-foreground font-black">Эълонҳо ёфт нашуданд.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === "chat" && (
          <div className="h-full md:h-[calc(100vh-200px)] lg:h-[80vh]">
            <div className="flex h-full bg-white md:rounded-[2rem] md:shadow-xl overflow-hidden md:border border-primary/5">
              <div className="hidden md:flex md:w-1/3 border-r">
                <ChatList activeChatEmail={activeChatEmail} onSelect={setActiveChatEmail} />
              </div>
              <div className="hidden md:flex md:w-2/3">
                {activeChatEmail ? (
                  <ChatWindow partnerEmail={activeChatEmail} onBack={() => setActiveChatEmail(null)} />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-secondary/5">
                    <MessageCircle size={48} className="opacity-20 mb-4" />
                    <p className="font-bold">Чатҳоро аз рӯйхат интихоб кунед</p>
                  </div>
                )}
              </div>
              <div className="flex md:hidden w-full h-full">
                {activeChatEmail ? (
                  <ChatWindow partnerEmail={activeChatEmail} onBack={() => setActiveChatEmail(null)} />
                ) : (
                  <ChatList activeChatEmail={activeChatEmail} onSelect={setActiveChatEmail} />
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === "profile" && <ProfileView profile={currentUserProfile || undefined} onViewMyJobs={() => setActiveView("my-jobs")} onAbout={() => setActiveView("about")} />}
        {activeView === "favorites" && <FavoritesView onSelectJob={(id) => handleJobClick(id)} onBack={() => setActiveView("jobs")} />}
        {activeView === "my-jobs" && <MyJobsView onBack={() => setActiveView("profile")} />}
        {activeView === "create-job" && <JobForm jobId={null} onSuccess={() => setActiveView("jobs")} onCancel={() => setActiveView("jobs")} />}
        {activeView === "about" && <AboutView onBack={() => setActiveView("jobs")} />}
      </main>

      {/* Mobile Footer Navigation (Floating Tabs) */}
      {user && !isFullScreenView && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t px-6 py-3 flex items-center justify-between z-50 rounded-t-3xl shadow-lg">
          <MobileNavTab icon={<Home size={22} />} label="Асосӣ" active={activeView === 'jobs'} onClick={() => {setActiveView("jobs"); setActiveChatEmail(null);}} />
          <div className="relative">
            <MobileNavTab icon={<MessageCircle size={22} />} label="Чат" active={activeView === 'chat'} onClick={() => setActiveView("chat")} />
            {hasUnreadMessages && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white"></div>}
          </div>
          
          {currentUserProfile?.role === 'korfarmo' ? (
            <button onClick={() => setActiveView("create-job")} className="bg-primary text-white p-3 rounded-2xl -mt-10 shadow-lg border-4 border-white active:scale-95 transition-all">
              <Plus size={26} />
            </button>
          ) : (
            <MobileNavTab icon={<Heart size={22} />} label="Писанд" active={activeView === 'favorites'} onClick={() => setActiveView("favorites")} />
          )}

          <MobileNavTab icon={<UserIcon size={22} />} label="Профил" active={activeView === 'profile'} onClick={() => setActiveView("profile")} />
        </div>
      )}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-black text-sm",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/50"
      )}
    >
      {icon} <span>{label}</span>
    </button>
  );
}

function MobileNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <Button variant="ghost" className={`justify-start gap-4 h-12 text-md font-bold rounded-xl ${active ? 'bg-primary/10 text-primary' : ''}`} onClick={onClick}>
      {icon} {label}
    </Button>
  );
}

function MobileNavTab({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-primary scale-105' : 'text-muted-foreground/60'}`}>
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
