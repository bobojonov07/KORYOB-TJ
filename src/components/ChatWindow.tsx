"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useUser, useRTDB, useRTDBData } from "@/firebase";
import { ref, push, update, set, runTransaction, remove } from "firebase/database";
import { ChatMessage, UserProfile } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Check, CheckCheck, AlertTriangle, MessageCircle, Trash2, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { containsForbiddenWords, MODERATION_RULES } from "@/app/lib/moderation";
import { useToast } from "@/hooks/use-toast";
import { ReportDialog } from "./ReportDialog";
import Image from "next/image";

interface ChatWindowProps {
  partnerEmail: string;
  onBack: () => void;
}

const encodeEmail = (email: string) => {
  if (!email) return "";
  return encodeURIComponent(email.toLowerCase()).replace(/\./g, '%2E');
};

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  return date.toLocaleDateString('tg-TJ', { day: 'numeric', month: 'short' }) + ", " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatWindow({ partnerEmail, onBack }: ChatWindowProps) {
  const rtdb = useRTDB();
  const { user } = useUser();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const myEncodedEmail = useMemo(() => user?.email ? encodeEmail(user.email) : null, [user]);
  const partnerEncodedEmail = useMemo(() => partnerEmail ? encodeEmail(partnerEmail) : null, [partnerEmail]);

  const chatId = useMemo(() => {
    if (!myEncodedEmail || !partnerEncodedEmail) return null;
    return [myEncodedEmail, partnerEncodedEmail].sort().join("--");
  }, [myEncodedEmail, partnerEncodedEmail]);

  const { data: messagesObj } = useRTDBData(chatId ? `chats/${chatId}` : null);
  const messages = useMemo(() => {
    if (!messagesObj) return [];
    return Object.entries(messagesObj)
      .map(([id, val]: [string, any]) => ({ id, ...val }))
      .filter((msg: any) => msg && msg.text && msg.sender)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()) as any[];
  }, [messagesObj]);

  const totalChatCharacters = useMemo(() => {
    return messages.reduce((acc, msg) => acc + (msg.text?.length || 0), 0);
  }, [messages]);

  const { data: partnerObj } = useRTDBData(partnerEncodedEmail ? `users/${partnerEncodedEmail}` : null);
  const partner = partnerObj as UserProfile | null;

  const { data: currentUserProfileObj } = useRTDBData(myEncodedEmail ? `users/${myEncodedEmail}` : null);
  const currentUserProfile = currentUserProfileObj as UserProfile | null;

  const isPremium = currentUserProfile?.isPremium === true;
  const partnerIsPremium = partner?.isPremium === true;
  
  const maxLimit = (isPremium || partnerIsPremium) ? 3000 : 1000;

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth"
          });
        }
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (!user || !messages.length || !rtdb || !myEncodedEmail || !chatId) return;
    
    let updated = false;
    messages.forEach((msg) => {
      if (msg.sender && msg.sender.toLowerCase() !== user.email?.toLowerCase() && !msg.read && msg.id) {
        update(ref(rtdb, `chats/${chatId}/${msg.id}`), { read: true });
        updated = true;
      }
    });

    if (updated) {
      set(ref(rtdb, `userNotifications/${myEncodedEmail}`), false);
    }
  }, [messages, user, chatId, rtdb, myEncodedEmail]);

  const handleSend = async () => {
    const trimmedText = text.trim();
    if (!trimmedText || !user?.email || !currentUserProfile || !rtdb || !chatId) return;

    if (currentUserProfile.isBlocked) {
      toast({ variant: "destructive", title: "Блок шудааст", description: "Шумо паём фиристода наметавонед." });
      return;
    }

    if (totalChatCharacters + trimmedText.length > maxLimit) {
      toast({ 
        variant: "destructive", 
        title: "Лимит ба охир расид", 
        description: `Шумораи умумии аломатҳо аз ${maxLimit} гузашт.` 
      });
      return;
    }

    if (containsForbiddenWords(trimmedText)) {
      if (myEncodedEmail) {
        const userRef = ref(rtdb, `users/${myEncodedEmail}`);
        await runTransaction(userRef, (userData) => {
          if (userData) {
            userData.warningCount = (userData.warningCount || 0) + 1;
            if (userData.warningCount >= MODERATION_RULES.MAX_WARNINGS) userData.isBlocked = true;
          }
          return userData;
        });
      }
      toast({ variant: "destructive", title: "Огоҳӣ!", description: "Дар паёми шумо калимаҳои ноҷо ҳастанд." });
      setText("");
      return;
    }

    const msg = {
      sender: user.email.toLowerCase(),
      text: trimmedText,
      time: new Date().toISOString(),
      read: false,
    };
    
    setText("");
    const newMsgRef = push(ref(rtdb, `chats/${chatId}`));
    await set(newMsgRef, msg);
    
    if (partnerEncodedEmail) {
      set(ref(rtdb, `userNotifications/${partnerEncodedEmail}`), {
        senderName: currentUserProfile.name,
        text: trimmedText,
        timestamp: Date.now()
      });
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!rtdb || !msgId || !chatId) return;
    if (confirm("Паём ҳазф шавад?")) {
      remove(ref(rtdb, `chats/${chatId}/${msgId}`));
    }
  };

  const formatLastSeen = (timestamp: number | null) => {
    if (!timestamp) return '—';
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 5 * 60 * 1000) return <span className="text-green-500 font-black animate-pulse">● Онлайн</span>;
    
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);

    if (mins < 60) return `${mins} дақ. пеш`;
    if (hours < 24) return `${hours} соат пеш`;
    if (days < 7) return `${days} рӯз пеш`;
    if (weeks < 4) return `${weeks} ҳафта пеш`;
    
    return `${new Date(timestamp).toLocaleDateString('tg-TJ', { day: 'numeric', month: 'short' })}`;
  };

  return (
    <div className={cn(
      "flex flex-col h-full w-full max-w-full overflow-hidden transition-all duration-500",
      isPremium ? "bg-[#FDFCFB]" : "bg-white"
    )}>
      <div className="p-4 border-b glass flex items-center justify-between sticky top-0 z-30 shadow-sm w-full">
        <div className="flex items-center gap-3 overflow-hidden">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-secondary h-10 w-10 shrink-0">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={cn(
              "relative w-11 h-11 rounded-full flex items-center justify-center font-black overflow-hidden border-2 shadow-inner transition-all shrink-0",
              partner?.isPremium ? "border-primary animate-glow" : "border-primary/10 bg-secondary/50"
            )}>
              {partner?.profileImage ? (
                <Image src={partner.profileImage} alt={partner.name} fill className="object-cover" />
              ) : (
                <span className="text-primary text-xl">{partner?.name?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <h3 className="font-black text-sm leading-tight flex items-center gap-1.5 truncate">
                <span className="truncate">{partner?.name || partnerEmail.split('@')[0]}</span>
                {partner?.isPremium && <Crown size={14} className="text-primary fill-primary shrink-0" />}
              </h3>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5 truncate">
                {formatLastSeen(partner?.lastSeen || null)}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsReportOpen(true)} className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0">
          <AlertTriangle size={20} />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 relative w-full max-w-full overflow-x-hidden scroll-smooth">
        {messages.map((msg, i) => {
          const isMine = msg.sender?.toLowerCase() === user?.email?.toLowerCase();
          return (
            <div key={msg.id || i} className={cn("flex flex-col max-w-[85%] group page-transition", isMine ? "ml-auto items-end" : "mr-auto items-start")}>
              <div className={cn(
                "p-4 rounded-[1.8rem] text-[15px] font-medium shadow-md break-words relative flex flex-col gap-2 transition-all duration-300", 
                isMine 
                  ? "bg-primary text-white rounded-tr-none hover:shadow-primary/30" 
                  : "glass text-foreground rounded-tl-none hover:shadow-xl"
              )}>
                <span className="leading-relaxed whitespace-pre-wrap">{msg.text}</span>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", isMine ? "text-white/70" : "text-muted-foreground/50")}>
                    {formatMessageTime(msg.time)}
                  </span>
                  {isMine && (
                    <span className={cn(msg.read ? "text-white" : "text-white/40")}>
                      {msg.read ? <CheckCheck size={14} /> : <Check size={14} />}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => handleDeleteMessage(msg.id)}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-destructive p-2 transition-all hover:scale-125",
                    isMine ? "-left-10" : "-right-10"
                  )}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-24 opacity-30">
            <div className="bg-primary/10 p-12 rounded-full animate-pulse">
              <MessageCircle size={80} className="text-primary" />
            </div>
            <p className="font-black mt-8 uppercase tracking-[0.3em] text-xs">Оғози суҳбат</p>
          </div>
        )}
      </div>

      <div className="p-4 md:p-8 bg-white border-t glass sticky bottom-0 z-30 flex flex-col gap-4 w-full max-w-full">
        <div className="flex gap-4 items-center w-full">
          <div className="relative flex-1">
            <Input 
              placeholder="Нависед..." 
              className="rounded-full h-14 bg-secondary/50 border-none font-bold px-8 text-base focus-visible:ring-primary shadow-inner w-full transition-all" 
              value={text} 
              onChange={e => setText(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={currentUserProfile?.isBlocked}
            />
            {isPremium && (
              <Sparkles className="absolute right-5 top-1/2 -translate-y-1/2 text-primary w-5 h-5 pointer-events-none" />
            )}
          </div>
          <Button 
            onClick={handleSend} 
            size="icon" 
            className="rounded-full h-14 w-14 shrink-0 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 active:scale-90 transition-all" 
            disabled={currentUserProfile?.isBlocked || !text.trim() || (totalChatCharacters + text.trim().length > maxLimit)}
          >
            <Send size={24} />
          </Button>
        </div>
        <div className="flex justify-between items-center px-6">
           <div className="flex items-center gap-3 flex-1">
             <div className={cn(
               "h-1.5 w-full max-w-[200px] rounded-full bg-secondary overflow-hidden border border-black/5 shadow-inner",
               (totalChatCharacters + text.length > maxLimit) && "bg-destructive/20"
             )}>
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    (totalChatCharacters + text.length > maxLimit) ? "bg-destructive" : "bg-primary"
                  )} 
                  style={{ width: `${Math.min(100, ((totalChatCharacters + text.length) / maxLimit) * 100)}%` }}
                ></div>
             </div>
             <span className={cn("text-[10px] font-black uppercase tracking-widest shrink-0", (totalChatCharacters + text.length > maxLimit) ? "text-destructive" : "text-muted-foreground/60")}>
               {totalChatCharacters + text.length} / {maxLimit}
             </span>
           </div>
           {(totalChatCharacters + text.length > maxLimit) && (
             <span className="text-[10px] font-black text-destructive uppercase tracking-widest flex items-center gap-2 shrink-0 animate-pulse">
               <AlertTriangle size={14} /> ЛИМИТИ ПАЁМ
             </span>
           )}
        </div>
      </div>

      <ReportDialog 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        reportedUid={partner?.uid || ""}
        reportedEmail={partnerEmail}
      />
    </div>
  );
}
