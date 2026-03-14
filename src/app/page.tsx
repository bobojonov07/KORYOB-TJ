"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, MapPin, Plus, MessageCircle, User as UserIcon, LogOut, Briefcase, Menu, Home, List, Info, ShieldAlert, Heart, Crown, ChevronRight, Sparkles, ExternalLink } from "lucide-react";
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
import { AdSenseBanner } from "@/components/AdSenseBanner";
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

  const isUserPremium = useMemo(() => {
    let premium = currentUserProfile?.isPremium === true;
    if (premium && currentUserProfile?.premiumUntil) {
      const expiry = new Date(currentUserProfile.premiumUntil).getTime();
      if (expiry < Date.now()) premium = false;
    }
    return premium;
  }, [currentUserProfile]);

  const { data: unreadStatus } = useRTDBData(userEncodedEmail ? `userNotifications/${userEncodedEmail}` : null);
  const hasUnreadMessages = !!unreadStatus;

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

  const lastNotifiedTime = useRef<number>(0);

  useEffect(() => {
    if (unreadStatus && typeof unreadStatus === 'object' && currentUserProfile?.notificationsEnabled !== false) {
      const { senderName, text, timestamp } = unreadStatus as any;
      if (timestamp && timestamp > lastNotifiedTime.current) {
        lastNotifiedTime.current = timestamp;
        if (Notification.permission === 'granted') {
          if (document.visibilityState !== 'visible' || activeView !== 'chat') {
            const n = new Notification(`KORYOB.TJ: ${senderName}`, {
              body: text || "Шумо паёми нав доред",
              icon: "/icon.png",
              badge: "/icon.png",
              tag: 'new-message',
              renotify: true,
              silent: false,
              vibrate: [200, 100, 200, 100, 200],
              requireInteraction: true
            });
            n.onclick = () => {
              window.focus();
              setActiveView('chat');
              n.close();
            };
          }
        }
      }
    }
  }, [unreadStatus, currentUserProfile?.notificationsEnabled, activeView]);

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
      <div className="min-h-screen flex items-center justify-center bg-background p-6 page-transition">
        <div className="max-w-md w-full glass rounded-[3rem] p-10 text-center shadow-2xl space-y-8 border-destructive/20">
          <div className="bg-destructive/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-destructive animate-pulse">
            <ShieldAlert size={56} />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black uppercase tracking-tight">Аккаунт Блок шуд</h2>
            <p className="text-muted-foreground font-bold text-sm leading-relaxed">
              {currentUserProfile.blockReason || "Аз сабаби ворид кардани маълумоти бардурӯғ аккаунти шумо блок карда шуд."}
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
    <div className="min-h-screen bg-background flex flex-col pb-24 md:pb-0 overflow-x-hidden w-full max-w-full">
      {!isFullScreenView && (
        <header className="sticky top-0 z-50 glass border-b px-6 md:px-12 py-4 flex items-center justify-between shadow-sm w-full">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setActiveView("jobs"); setActiveChatEmail(null); }}>
            <div className="bg-primary text-white p-2.5 rounded-[1rem] shadow-2xl group-hover:rotate-12 transition-transform">
              <Briefcase size={26} />
            </div>
            <h1 className="text-2xl font-black text-primary tracking-tighter uppercase">KORYOB.TJ</h1>
          </div>

          <nav className="hidden md:flex items-center gap-4">
            <NavButton icon={<Home size={20}/>} label="Асосӣ" active={activeView === 'jobs'} onClick={() => {setActiveView("jobs"); setActiveChatEmail(null);}} />
            {user && (
              <>
                <div className="relative">
                  <NavButton icon={<MessageCircle size={20}/>} label="Чат" active={activeView === 'chat'} onClick={() => setActiveView("chat")} />
                  {hasUnreadMessages && <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white animate-pulse"></div>}
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
              <Button onClick={() => setActiveView("auth")} className="rounded-[1.2rem] font-black px-8 h-12 shadow-xl shadow-primary/20">Воридшавӣ</Button>
            ) : (
              <Button variant="ghost" onClick={handleLogout} className="text-destructive font-black gap-2 hover:bg-destructive/10 rounded-[1.2rem] px-6">
                <LogOut size={18} /> Баромад
              </Button>
            )}
          </nav>

          <div className="md:hidden flex items-center gap-3">
            {!user ? (
              <Button onClick={() => setActiveView("auth")} size="sm" className="rounded-xl font-black h-10 px-6">Воридшавӣ</Button>
            ) : (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-2xl h-11 w-11 relative bg-white/50 border-primary/10">
                    <Menu size={24} className="text-primary" />
                    {hasUnreadMessages && <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-primary rounded-full border border-white"></div>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85%] rounded-l-[3rem] p-8 glass border-none">
                  <SheetHeader><SheetTitle className="text-left font-black text-primary text-2xl tracking-tighter uppercase mb-6">МЕНЮ</SheetTitle></SheetHeader>
                  <div className="flex flex-col gap-4">
                    <MobileNavItem icon={<Home size={22}/>} label="Асосӣ" active={activeView === 'jobs'} onClick={() => {setActiveView("jobs"); setActiveChatEmail(null);}} />
                    <MobileNavItem icon={<MessageCircle size={22}/>} label="Чат" active={activeView === 'chat'} onClick={() => setActiveView("chat")} />
                    <MobileNavItem icon={<Heart size={22}/>} label="Писандидаҳо" active={activeView === 'favorites'} onClick={() => setActiveView("favorites")} />
                    {currentUserProfile?.role === 'korfarmo' && (
                      <MobileNavItem icon={<UserIcon size={22}/>} label="Эълонҳои ман" active={activeView === 'my-jobs'} onClick={() => setActiveView("my-jobs")} />
                    )}
                    <MobileNavItem icon={<UserIcon size={22}/>} label="Профил" active={activeView === 'profile'} onClick={() => setActiveView("profile")} />
                    <MobileNavItem icon={<Info size={22}/>} label="Оиди мо" active={activeView === 'about'} onClick={() => setActiveView("about")} />
                    <div className="mt-auto pt-8 border-t border-primary/5">
                      <Button variant="ghost" className="w-full justify-start gap-5 h-14 text-md font-black rounded-2xl text-destructive" onClick={handleLogout}>
                        <LogOut size={22} /> Баромад
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </header>
      )}

      <main className={cn("flex-1 overflow-y-auto w-full max-w-full overflow-x-hidden page-transition", isFullScreenView ? "p-0 h-screen" : "container max-w-7xl mx-auto p-4 md:p-12 md:px-0")}>
        {activeView === "jobs" && (
          <div className="space-y-16 w-full">
            <section className="relative overflow-hidden p-8 md:p-32 rounded-none text-center space-y-8 min-h-[600px] flex flex-col justify-center items-center shadow-2xl border-b border-primary/5 w-full max-w-full">
              {heroImg && (
                <div className="absolute inset-0 z-0">
                  <Image 
                    src={heroImg.imageUrl} 
                    alt="Koryob Background" 
                    fill 
                    className="object-cover scale-105"
                    priority
                    data-ai-hint={heroImg.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 backdrop-blur-[2px]"></div>
                </div>
              )}
              <div className="relative z-10 space-y-8 max-w-full px-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                <h2 className="text-4xl md:text-8xl font-black text-white tracking-tighter leading-[1] drop-shadow-2xl uppercase">
                  Кори орзуи худро <br /> <span className="text-primary">пайдо кунед</span>
                </h2>
                <p className="text-white/80 text-lg md:text-2xl font-bold tracking-wide max-w-2xl mx-auto uppercase">Платформаи муосири корёбӣ дар тамоми Тоҷикистон</p>
                <div className="flex flex-col md:flex-row gap-5 pt-10 w-full max-w-4xl mx-auto">
                  <div className="relative flex-[2] group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-7 h-7 group-focus-within:scale-110 transition-transform" />
                    <Input 
                      placeholder="Ҷустуҷӯ: вазифа, ширкат..." 
                      className="pl-16 h-16 md:h-20 rounded-[1.5rem] bg-white/95 border-none shadow-2xl font-black text-lg text-foreground transition-all focus:bg-white" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                  </div>
                  <div className="flex-1">
                    <Select value={cityFilter} onValueChange={setCityFilter}>
                      <SelectTrigger className="h-16 md:h-20 rounded-[1.5rem] bg-white/95 border-none shadow-2xl font-black text-lg text-foreground px-8">
                        <div className="flex items-center gap-4"><MapPin className="w-6 h-6 text-primary" /><SelectValue placeholder="Шаҳр" /></div>
                      </SelectTrigger>
                      <SelectContent className="rounded-[1.5rem] p-2 glass">
                        {CITIES.map(city => (<SelectItem key={city} value={city} className="font-black rounded-xl uppercase text-xs tracking-widest">{city}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </section>

            <div className="px-6 md:px-0 space-y-20 w-full">
              {/* AdSense Unit 1 */}
              <AdSenseBanner adSlot="2827818474" />

              {/* HUNAR-YOB AD BANNER */}
              <section className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <a 
                  href="https://www.hunar-yob.store" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative block w-full p-8 md:p-12 rounded-[3.5rem] overflow-hidden bg-gradient-to-br from-[#1a237e] via-[#311b92] to-[#4a148c] shadow-2xl hover:scale-[1.01] transition-all duration-500"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]"></div>
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-1000"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                        <Sparkles className="text-yellow-400 w-4 h-4" />
                        <span className="text-white font-black text-[10px] uppercase tracking-widest">ЛОИҲАИ НАВ</span>
                      </div>
                      <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                        HUNAR-YOB.STORE
                      </h3>
                      <p className="text-white/70 font-bold text-sm md:text-lg max-w-xl leading-relaxed">
                        Агар ҳунар доред ва намедонед дар куҷо эълон кунед, ё мутахассис меҷӯед, ба вебсайти нави мо гузаред!
                      </p>
                    </div>
                    <div className="bg-white text-[#1a237e] p-6 rounded-[2.5rem] font-black text-sm md:text-md uppercase tracking-tighter flex items-center gap-4 shadow-2xl group-hover:bg-yellow-400 transition-colors">
                      ГУЗАШТАН <ExternalLink size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </div>
                </a>
              </section>

              {premiumJobs.length > 0 && (
                <div className="space-y-6 w-full animate-in fade-in slide-in-from-left-4 duration-700">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                      <Crown className="text-primary fill-primary animate-subtle-float" /> VIP PREMIUM ЭЪЛОНҲО
                    </h3>
                  </div>
                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-8 pb-10 px-2 h-full">
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

              <div className="space-y-10 w-full">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
                  <h3 className="text-2xl md:text-4xl font-black text-foreground tracking-tighter uppercase">Эълонҳои ҷорӣ</h3>
                  {currentUserProfile?.role === 'korfarmo' && (
                    <Button onClick={() => setActiveView("create-job")} className="rounded-[1.5rem] gap-3 h-14 px-8 text-sm font-black shadow-2xl shadow-primary/20 bg-primary hover:scale-[1.05] transition-all">
                      <Plus size={20} /> НАШРИ ЭЪЛОН
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
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
                    <div className="col-span-full text-center py-32 glass rounded-[3.5rem] border-2 border-dashed border-primary/10">
                      <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-xs opacity-40">Эълонҳо ёфт нашуданд</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* AdSense Unit 2 (Bottom) */}
              <AdSenseBanner adSlot="2827818474" />
            </div>
          </div>
        )}

        {activeView === "chat" && (
          <div className="h-full md:h-[calc(100vh-220px)] w-full page-transition">
            <div className="flex h-full bg-white md:rounded-[3.5rem] md:shadow-2xl overflow-hidden md:border border-primary/5">
              <div className={cn("flex flex-col border-r border-primary/5 w-full md:w-1/3 glass", activeChatEmail && "hidden md:flex")}>
                <ChatList activeChatEmail={activeChatEmail} onSelect={setActiveChatEmail} onBack={() => setActiveView("jobs")} />
              </div>
              <div className={cn("flex flex-col w-full md:w-2/3", !activeChatEmail && "hidden md:flex")}>
                {activeChatEmail ? (
                  <ChatWindow partnerEmail={activeChatEmail} onBack={() => setActiveChatEmail(null)} />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/30 bg-secondary/5">
                    <MessageCircle size={100} className="mb-8 opacity-10 animate-subtle-float" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs">Суҳбатро интихоб кунед</p>
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t px-10 py-5 flex items-center justify-between z-50 rounded-t-[3rem] shadow-[0_-15px_50px_rgba(0,0,0,0.1)] w-full">
          <MobileNavTab icon={<Home size={28} />} label="Асосӣ" active={activeView === 'jobs'} onClick={() => {setActiveView("jobs"); setActiveChatEmail(null);}} />
          <div className="relative">
            <MobileNavTab icon={<MessageCircle size={28} />} label="Чат" active={activeView === 'chat'} onClick={() => setActiveView("chat")} />
            {hasUnreadMessages && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white animate-pulse"></div>}
          </div>
          <MobileNavTab icon={<UserIcon size={28} />} label="Профил" active={activeView === 'profile'} onClick={() => setActiveView("profile")} />
        </div>
      )}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-3 px-6 py-2.5 rounded-[1.2rem] transition-all font-black text-[11px] uppercase tracking-widest", active ? "bg-primary text-white shadow-xl shadow-primary/30 scale-105" : "text-muted-foreground/80 hover:bg-secondary hover:text-primary")}>
      {icon} <span>{label}</span>
    </button>
  );
}

function MobileNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <Button variant="ghost" className={cn("justify-start gap-5 h-16 text-md font-black rounded-[1.5rem] uppercase tracking-widest border-none", active ? "bg-primary text-white shadow-xl shadow-primary/30" : "bg-secondary/30 text-muted-foreground/70")} onClick={onClick}>
      {icon} {label}
    </Button>
  );
}

function MobileNavTab({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-1.5 transition-all duration-300", active ? 'text-primary scale-110' : 'text-muted-foreground/40')}>
      {icon}
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}
