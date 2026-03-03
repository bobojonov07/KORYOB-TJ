
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useUser, useRTDB, useRTDBData } from "@/firebase";
import { ref, push, update, set, runTransaction } from "firebase/database";
import { ChatMessage, UserProfile } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Check, CheckCheck, AlertTriangle, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { containsForbiddenWords, MODERATION_RULES } from "@/app/lib/moderation";
import { useToast } from "@/hooks/use-toast";
import { ReportDialog } from "./ReportDialog";

interface ChatWindowProps {
  partnerEmail: string;
  onBack: () => void;
}

export function ChatWindow({ partnerEmail, onBack }: ChatWindowProps) {
  const rtdb = useRTDB();
  const { user } = useUser();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatId = useMemo(() => {
    if (!user?.email) return "";
    const e1 = encodeURIComponent(user.email).replace(/\./g, '%2E');
    const e2 = encodeURIComponent(partnerEmail).replace(/\./g, '%2E');
    return [e1, e2].sort().join("--");
  }, [user, partnerEmail]);

  const { data: messagesObj } = useRTDBData(`chats/${chatId}`);
  const messages = useMemo(() => {
    if (!messagesObj) return [];
    return Object.entries(messagesObj)
      .map(([id, val]: [string, any]) => ({ id, ...val }))
      .sort((a, b) => (a.time || 0) - (b.time || 0)) as any[];
  }, [messagesObj]);

  const partnerEncodedEmail = encodeURIComponent(partnerEmail).replace(/\./g, '%2E');
  const { data: partnerObj } = useRTDBData(`users/${partnerEncodedEmail}`);
  const partner = partnerObj as UserProfile | null;

  const myEncodedEmail = user?.email ? encodeURIComponent(user.email).replace(/\./g, '%2E') : null;
  const { data: currentUserProfileObj } = useRTDBData(myEncodedEmail ? `users/${myEncodedEmail}` : null);
  const currentUserProfile = currentUserProfileObj as UserProfile | null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!user || !messages.length || !rtdb || !myEncodedEmail) return;
    
    // Паёмҳоро ҳамчун хондашуда қайд мекунем
    let updated = false;
    messages.forEach((msg) => {
      if (msg.sender !== user.email && !msg.read && msg.id) {
        update(ref(rtdb, `chats/${chatId}/${msg.id}`), { read: true });
        updated = true;
      }
    });

    if (updated) {
      // Огоҳиномаро дар базаи додаҳо нест мекунем
      set(ref(rtdb, `userNotifications/${myEncodedEmail}`), false);
    }
  }, [messages, user, chatId, rtdb, myEncodedEmail]);

  const handleSend = async () => {
    if (!text.trim() || !user?.email || !currentUserProfile || !rtdb) return;

    if (currentUserProfile.isBlocked) {
      toast({ variant: "destructive", title: "Ҳисоб блок шудааст", description: "Шумо паём фиристода наметавонед." });
      return;
    }

    if (containsForbiddenWords(text)) {
      if (myEncodedEmail) {
        const userRef = ref(rtdb, `users/${myEncodedEmail}`);
        await runTransaction(userRef, (userData) => {
          if (userData) {
            userData.warningCount = (userData.warningCount || 0) + 1;
            if (userData.warningCount >= MODERATION_RULES.MAX_WARNINGS) {
              userData.isBlocked = true;
            }
          }
          return userData;
        });
      }

      toast({ 
        variant: "destructive", 
        title: "Огоҳӣ!", 
        description: "Дар паёми шумо калимаҳои ноҷо ҳастанд. Баъди 3 огоҳӣ аккаунт блок мешавад." 
      });
      setText("");
      return;
    }

    const msg = {
      sender: user.email,
      text: text.trim(),
      time: Date.now(),
      read: false,
    };
    setText("");
    const newMsgRef = push(ref(rtdb, `chats/${chatId}`));
    await set(newMsgRef, msg);
    
    // Ба ҳамсуҳбат огоҳинома мефиристем
    set(ref(rtdb, `userNotifications/${partnerEncodedEmail}`), true);
  };

  const safeFormatTime = (time: any) => {
    if (!time) return "";
    try {
      const date = new Date(time);
      if (isNaN(date.getTime())) return "";
      return format(date, "HH:mm");
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFCFB] animate-in slide-in-from-right duration-300">
      <div className="p-4 md:p-6 border-b bg-white flex items-center justify-between sticky top-0 z-20 shadow-sm backdrop-blur-xl bg-white/90">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-secondary/50 h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex flex-col">
            <h3 className="font-black text-lg leading-tight tracking-tight">{partner?.name || "Чат"}</h3>
            {partner?.lastSeen && (
              <span className={cn("text-[10px] uppercase font-black tracking-widest mt-0.5", Date.now() - partner.lastSeen < 300000 ? "text-green-500" : "text-muted-foreground/60")}>
                {Date.now() - partner.lastSeen < 300000 ? "Онлайн" : `Охирин дидан: ${safeFormatTime(partner.lastSeen)}`}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsReportOpen(true)} className="text-muted-foreground hover:text-destructive h-10 w-10 rounded-full">
          <AlertTriangle size={20} />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col max-w-[85%]", msg.sender === user?.email ? "ml-auto items-end" : "mr-auto items-start")}>
            <div className={cn(
              "p-4 rounded-3xl text-sm font-bold shadow-sm", 
              msg.sender === user?.email 
                ? "bg-primary text-white rounded-tr-none" 
                : "bg-white border border-primary/5 rounded-tl-none text-foreground"
            )}>
              {msg.text}
            </div>
            <div className="flex items-center gap-1.5 mt-1 px-2">
              <span className="text-[10px] text-muted-foreground/60 font-black tracking-tighter">{safeFormatTime(msg.time)}</span>
              {msg.sender === user?.email && (
                <span className="text-primary">
                  {msg.read ? <CheckCheck size={14} /> : <Check size={14} />}
                </span>
              )}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-20 opacity-30 text-center space-y-4">
            <MessageCircle size={64} className="text-primary" />
            <p className="font-black text-lg">Паём фиристед</p>
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 bg-white border-t sticky bottom-0 z-20 flex gap-3 items-center">
        <Input 
          placeholder="Паём нависед..." 
          className="rounded-2xl h-14 bg-secondary/20 border-none font-bold px-6 focus-visible:ring-primary" 
          value={text} 
          onChange={e => setText(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={currentUserProfile?.isBlocked}
        />
        <Button 
          onClick={handleSend} 
          size="icon" 
          className="rounded-2xl h-14 w-14 shrink-0 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all" 
          disabled={currentUserProfile?.isBlocked || !text.trim()}
        >
          <Send size={22} />
        </Button>
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
