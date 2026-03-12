
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, MapPin, Plus, MessageCircle, User as UserIcon, LogOut, Briefcase, Menu, Home, List, Info, ShieldAlert, Heart, Crown, ChevronRight, Sparkles } from "lucide-react";
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
import { PremiumPurchaseView } from "@/components/PremiumPurchaseView";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const CITIES = ["Ҳама шаҳрҳо", "Душанбе", "Хуҷанд", "Бохтар", "Кӯлоб", "Истаравшан", "Исфара", "Конибодом", "Турсунзода", "Ваҳдат", "Роғун", "Норак", "Панҷакент", "Ҳисор"];

export default function KoryobTJ() {
  const auth = useAuth();
  const rtdb = useRTDB();
  const { user } = useUser();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("Ҳама шаҳрҳо");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"jobs" | "chat" | "profile" | "my-jobs" | "create-job" | "about" | "favorites" | "auth" | "job-details" | "premium-purchase">("jobs");
  const [activeChatEmail, setActiveChatEmail] = useState<string | null>(null);

  const { data: jobsObj } = useRTDBData("jobs");
  const jobsData = useMemo(() => {
    if (!jobsObj) return [];
    return Object.entries(jobsObj).map(([id, val]: [string, any]) => ({ id, ...val })) as JobListing[];
  }, [jobsObj]);

  const userEncodedEmail = user?.email ? encodeURIComponent(user.email.toLowerCase()).replace(/\./g, '%2E') : null;
  const { data: currentUserProfileObj } = useRTDBData(userEncodedEmail ? `users/${userEncodedEmail}` : null);
  const currentUserProfile = currentUserProfileObj as UserProfile | null;

  const { data: requestsObj } = useRTDBData("premiumRequests");
  
  const isUserPremium = useMemo(() => {
    let premium = currentUserProfile?.isPremium === true;
    if (premium && currentUserProfile?.premiumUntil) {
      const expiry = new Date(currentUserProfile.premiumUntil).getTime();
      if (expiry < Date.now()) premium = false;
    }
    if (!premium && requestsObj && user) {
      const hasAcceptedRequest = Object.values(requestsObj).some((req: any) => req.uid === user.uid && req.isPremium === true);
      if (hasAcceptedRequest) premium = true;
    }
    return premium;
  }, [currentUserProfile, requestsObj, user]);

  const lastPremiumStatus = useRef<boolean>(false);
  useEffect(() => {
    if (isUserPremium && lastPremiumStatus.current === false) {
      toast({
        title: "ПРЕМИУМ ФАЪОЛ ШУД!",
        description: "Табрик! Акнун тамоми имкониятҳои VIP барои шумо кушодаанд.",
      });
    }
    lastPremiumStatus.current = isUserPremium;
  }, [isUserPremium, toast]);

  const { data: unreadStatus } = useRTDBData(userEncodedEmail ? `userNotifications/${userEncodedEmail}` : null);
  const hasUnreadMessages = !!unreadStatus;

  // Browser Notifications Logic with timely message notice
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && user && currentUserProfile?.notificationsEnabled !== false) {
      if (Notification.permission === 'default') {
        toast({
          title: "Огоҳиномаҳоро фаъол созед",
          description: "Барои дидани сари вақт паёмҳо ва огоҳ шудан аз хабарҳои нав, лутфан огоҳиномаҳоро фаъол созед.",
          duration: 10000,
          action: (
            <Button 
              variant="default" 
              size="sm" 
              className="font-black text-[10px] uppercase rounded-lg"
              onClick={() => {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                    toast({ title: "Раҳмат!", description: "Огоҳиномаҳо фаъол шуданд." });
                  }
                });
              }}
            >
              Иҷозат додан
            </Button>
          ),
        });
      }
    }
  }, [user, toast, currentUserProfile?.notificationsEnabled]);

  useEffect(() => {
    if (unreadStatus && typeof unreadStatus === 'string' && currentUserProfile?.notificationsEnabled !== false) {
      if (Notification.permission === 'granted' && document.visibilityState !== 'visible') {
        new Notification("KORYOB.TJ: Паёми нав", {
          body: `Шумо аз ${unreadStatus} паёми нав доред`,
          icon: "/icon.png"
        });
      }
    }
  }, [unreadStatus, currentUserProfile?.notificationsEnabled]);

  const heroImg = PlaceHolderImages.find(img => img.id === 'hero-bg');

  useEffect(() => {
    if (user && userEncodedEmail && rtdb) {
      update(ref(rtdb, `users/${userEncodedEmail}`), { lastSeen: Date.now() });
    }
  }, [user, userEncodedEmail, rtdb]);

  const premiumJobs = useMemo(() => {
    return jobsData.filter(j => j.active && j.isPremium).sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }, [jobsData]);

  const filteredJobs = useMemo(() => {
    if (!jobsData) return [];
    let list = jobsData.filter(j => j.active && !j.isPremium);
    
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
    const final = list.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    return user ? final : final.slice(0, 5);
  }, [jobsData, searchQuery, cityFilter, user]);

  const selectedJob = jobsData.find(j => j.id === selectedJobId);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setActiveView("jobs");
    setActiveChatEmail(null);
    toast({ title: "Шумо баромадед", description: "То дидор!" });
  };

  const handleStartChat = (partnerEmail: string) => {
    if (!user) {
      setActiveView("auth");
      return;
    }
    if (user.email?.toLowerCase() === partnerEmail.toLowerCase()) {
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

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isFullScreenView = isMobile && (
    activeView === "job-details" || 
    activeView === "chat" || 
    activeView === "auth" ||
    activeView === "create-job" ||
    activeView === "profile" ||
    activeView === "favorites" ||
    activeView === "my-jobs" ||
    activeView === "premium-purchase"
  );

  if (currentUserProfile?.isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 text-center shadow-2xl space-y-6 border border-destructive/20 overflow-hidden">
          <div className="bg-destructive/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-destructive animate-pulse">
            <ShieldAlert size={56} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Аккаунт Блок шуд</h2>
            <p className="text-muted-foreground font-bold text-sm leading-relaxed">
              {currentUserProfile.blockReason || "Аз сабаби вориди акси бардурӯғ аккаунти шумо блок шуд"}
            </p>
          </div>
          <Button onClick={handleLogout} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs" variant="destructive">
            <LogOut size={18} className="mr-2" /> Баромад аз ҳисоб
          </Button>
          <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest pt-4">© KORYOB.TJ Security Service</p>
        </div>
      </div>
    );
  }

  if (activeView === "auth") {
    return <AuthView onBack={() => setActiveView("jobs")} onAuthSuccess={() => setActiveView("jobs")} />;
  }

  if (activeView === "premium-purchase") {
    return <PremiumPurchaseView onBack={() => setActiveView("profile")} />;
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

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col pb-24 md:pb-0 overflow-x-hidden">
      {!isFullScreenView && (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b px-4 md:px-12 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveView("jobs"); setActiveChatEmail(null); }}>
            <div className="bg-primary text-white p-2 rounded-xl shadow-lg">
              <Briefcase size={24} />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-primary tracking-tighter">KORYOB.TJ</h1>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <NavButton icon={<Home size={20}/>} label="Асосӣ" active={activeView === 'jobs'} onClick={() => {setActiveView("jobs"); setActiveChatEmail(null);}} />
            {user && (
              <>
                <div className="relative">
                  <NavButton icon={<MessageCircle size={20}/>} label="Чат" active={activeView === 'chat'} onClick={() => setActiveView("chat")} />
                  {hasUnreadMessages && <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white"></div>}
                </div>
                <NavButton icon={<Heart size={20}/>} label="Писандидаҳо" active={activeView === 'favorites'} onClick={() => setActiveView("favorites")} />
                {currentUserProfile?.role === 'korfarmo' && (
                  <NavButton icon={<List size={20}/>} label="Эълонҳо" active={activeView === 'my-jobs'} onClick={() => setActiveView("my-jobs")} />
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

          <div className="md:hidden flex items-center gap-3">
            {!user ? (
              <Button onClick={() => setActiveView("auth")} size="sm" className="rounded-xl font-black">Воридшавӣ</Button>
            ) : (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 relative">
                    <Menu size={22} className="text-primary" />
                    {hasUnreadMessages && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border border-white"></div>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85%] rounded-l-[2.5rem] p-6">
                  <SheetHeader><SheetTitle className="text-left font-black text-primary text-xl tracking-tighter uppercase">МЕНЮ</SheetTitle></SheetHeader>
                  <div className="flex flex-col gap-3 mt-8">
                    <MobileNavItem icon={<Home size={20}/>} label="Асосӣ" active={activeView === 'jobs'} onClick={() => {setActiveView("jobs"); setActiveChatEmail(null);}} />
                    <MobileNavItem icon={<MessageCircle size={20}/>} label="Чат" active={activeView === 'chat'} onClick={() => setActiveView("chat")} />
                    <MobileNavItem icon={<Heart size={20}/>} label="Писандидаҳо" active={activeView === 'favorites'} onClick={() => setActiveView("favorites")} />
                    {currentUserProfile?.role === 'korfarmo' && (
                      <MobileNavItem icon={<List size={20}/>} label="Эълонҳои ман" active={activeView === 'my-jobs'} onClick={() => setActiveView("my-jobs")} />
                    )}
                    <MobileNavItem icon={<UserIcon size={20}/>} label="Профил" active={activeView === 'profile'} onClick={() => setActiveView("profile")} />
                    <MobileNavItem icon={<Info size={20}/>} label="Оиди мо" active={activeView === 'about'} onClick={() => setActiveView("about")} />
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

      <main className={cn("flex-1 overflow-y-auto", isFullScreenView ? "p-0 h-screen" : "container max-w-7xl mx-auto p-4 md:p-12 md:px-0")}>
        {activeView === "jobs" && (
          <div className="space-y-12">
            <section className="relative overflow-hidden p-6 md:p-24 rounded-none text-center space-y-6 min-h-[500px] flex flex-col justify-center items-center shadow-lg border-b border-primary/10">
              {heroImg && (
                <div className="absolute inset-0 z-0">
                  <Image 
                    src={heroImg.imageUrl} 
                    alt="Koryob Background" 
                    fill 
                    className="object-cover"
                    priority
                    data-ai-hint={heroImg.imageHint}
                  />
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"></div>
                </div>
              )}
              <div className="relative z-10 space-y-6 max-w-3xl">
                <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-[1.1] drop-shadow-2xl">
                  Кори орзуи худро <br /> <span className="text-primary">пайдо кунед</span>
                </h2>
                <p className="text-white/95 text-xl font-bold tracking-wide max-w-xl mx-auto">Платформаи муосири корёбӣ ва кордиҳӣ дар тамоми Тоҷикистон</p>
                <div className="flex flex-col md:flex-row gap-4 pt-8 w-full">
                  <div className="relative flex-[2]">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary w-6 h-6" />
                    <Input 
                      placeholder="Ҷустуҷӯ: вазифа, ширкат..." 
                      className="pl-14 h-16 rounded-2xl bg-white/95 border-none shadow-2xl font-bold text-lg text-foreground" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                  </div>
                  <div className="flex-1">
                    <Select value={cityFilter} onValueChange={setCityFilter}>
                      <SelectTrigger className="h-16 rounded-2xl bg-white/95 border-none shadow-2xl font-bold text-lg text-foreground">
                        <div className="flex items-center gap-3"><MapPin className="w-6 h-6 text-primary" /><SelectValue placeholder="Шаҳр" /></div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {CITIES.map(city => (<SelectItem key={city} value={city} className="font-bold">{city}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </section>

            <div className="px-4 md:px-0 space-y-12">
              {premiumJobs.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter">
                      <Crown className="text-yellow-500 fill-yellow-500" /> VIP PREMIUM ЭЪЛОНҲО
                    </h3>
                  </div>
                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-6 pb-6 px-2 h-full">
                      {premiumJobs.map(job => (
                        <JobCard 
                          key={job.id} 
                          job={job} 
                          compact 
                          onClick={() => handleJobClick(job.id)} 
                          onChat={() => handleStartChat(job.postedEmail)}
                          isOwner={user?.uid === job.postedUid}
                        />
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" className="hidden" />
                  </ScrollArea>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl md:text-2xl font-black text-foreground tracking-tighter uppercase">Эълонҳои ҷорӣ</h3>
                  {currentUserProfile?.role === 'korfarmo' && (
                    <Button onClick={() => setActiveView("create-job")} className="rounded-xl gap-2 h-12 px-6 text-sm font-black shadow-lg bg-primary">
                      <Plus size={18} /> НАШРИ ЭЪЛОН
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
                    <div className="col-span-full text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-primary/5">
                      <p className="text-muted-foreground font-black uppercase tracking-widest text-xs opacity-50">Эълонҳо ёфт нашуданд</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === "chat" && (
          <div className="h-full md:h-[calc(100vh-200px)]">
            <div className="flex h-full bg-white md:rounded-[2.5rem] md:shadow-2xl overflow-hidden md:border border-primary/5">
              <div className={cn("flex flex-col border-r w-full md:w-1/3", activeChatEmail && "hidden md:flex")}>
                <ChatList activeChatEmail={activeChatEmail} onSelect={setActiveChatEmail} onBack={() => setActiveView("jobs")} />
              </div>
              <div className={cn("flex flex-col w-full md:w-2/3", !activeChatEmail && "hidden md:flex")}>
                {activeChatEmail ? (
                  <ChatWindow partnerEmail={activeChatEmail} onBack={() => setActiveChatEmail(null)} />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-secondary/5">
                    <MessageCircle size={48} className="opacity-10 mb-4" />
                    <p className="font-black uppercase tracking-widest text-xs">Суҳбатро интихоб кунед</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === "profile" && <ProfileView profile={currentUserProfile} isPremium={isUserPremium} onViewMyJobs={() => setActiveView("my-jobs")} onAbout={() => setActiveView("about")} onBack={() => setActiveView("jobs")} onLogout={handleLogout} onUpgrade={() => setActiveView("premium-purchase")} />}
        {activeView === "favorites" && <FavoritesView onSelectJob={(id) => handleJobClick(id)} onBack={() => setActiveView("jobs")} />}
        {activeView === "my-jobs" && <MyJobsView onBack={() => setActiveView("profile")} />}
        {activeView === "create-job" && <JobForm jobId={null} onSuccess={() => setActiveView("jobs")} onCancel={() => setActiveView("jobs")} onUpgrade={() => setActiveView("premium-purchase")} />}
        {activeView === "about" && <AboutView onBack={() => setActiveView("jobs")} />}
      </main>

      {user && !isFullScreenView && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t px-8 py-4 flex items-center justify-between z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <MobileNavTab icon={<Home size={24} />} label="Асосӣ" active={activeView === 'jobs'} onClick={() => {setActiveView("jobs"); setActiveChatEmail(null);}} />
          <div className="relative">
            <MobileNavTab icon={<MessageCircle size={24} />} label="Чат" active={activeView === 'chat'} onClick={() => setActiveView("chat")} />
            {hasUnreadMessages && <div className="absolute top-0 right-1 w-3 h-3 bg-primary rounded-full border-2 border-white"></div>}
          </div>
          <MobileNavTab icon={<UserIcon size={24} />} label="Профил" active={activeView === 'profile'} onClick={() => setActiveView("profile")} />
        </div>
      )}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-black text-sm uppercase tracking-tighter", active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-secondary")}>
      {icon} <span>{label}</span>
    </button>
  );
}

function MobileNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <Button variant="ghost" className={cn("justify-start gap-4 h-14 text-md font-black rounded-2xl uppercase tracking-widest", active && "bg-primary/10 text-primary")} onClick={onClick}>
      {icon} {label}
    </Button>
  );
}

function MobileNavTab({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-1 transition-all", active ? 'text-primary scale-110' : 'text-muted-foreground/60')}>
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
