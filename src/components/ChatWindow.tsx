"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useUser, useRTDB, useRTDBData } from "@/firebase";
import { ref, push, update, set, runTransaction, remove } from "firebase/database";
import { ChatMessage, UserProfile } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Check, CheckCheck, AlertTriangle, MessageCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { containsForbiddenWords, MODERATION_RULES } from "@/app/lib/moderation";
import { useToast } from "@/hooks/use-toast";
import { ReportDialog } from "./ReportDialog";

interface ChatWindowProps {
  partnerEmail: string;
  onBack: () => void;
}

/**
 * Utility to encode email consistently for RTDB paths
 */
const encodeEmail = (email: string) => {
  if (!email) return "";
  return encodeURIComponent(email.toLowerCase()).replace(/\./g, '%2E').toLowerCase();
};

export function ChatWindow({ partnerEmail, onBack }: ChatWindowProps) {
  const rtdb = useRTDB();
  const { user } = useUser();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatId = useMemo(() => {
    if (!user?.email || !partnerEmail) return null;
    const e1 = encodeEmail(user.email);
    const e2 = encodeEmail(partnerEmail);
    return [e1, e2].sort().join("--");
  }, [user, partnerEmail]);

  const { data: messagesObj } = useRTDBData(chatId ? `chats/${chatId}` : null);
  const messages = useMemo(() => {
    if (!messagesObj) return [];
    return Object.entries(messagesObj)
      .map(([id, val]: [string, any]) => ({ id, ...val }))
      .filter((msg: any) => msg && msg.text && msg.sender)
      .sort((a, b) => (a.time || 0) - (b.time || 0)) as any[];
  }, [messagesObj]);

  const partnerEncodedEmail = useMemo(() => partnerEmail ? encodeEmail(partnerEmail) : null, [partnerEmail]);
  const { data: partnerObj } = useRTDBData(partnerEncodedEmail ? `users/${partnerEncodedEmail}` : null);
  const partner = partnerObj as UserProfile | null;

  const myEncodedEmail = useMemo(() => user?.email ? encodeEmail(user.email) : null, [user]);
  const { data: currentUserProfileObj } = useRTDBData(myEncodedEmail ? `users/${myEncodedEmail}` : null);
  const currentUserProfile = currentUserProfileObj as UserProfile | null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read
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
      toast({ variant: "destructive", title: "Ҳисоб блок шудааст", description: "Шумо паём фиристода наметавонед." });
      return;
    }

    if (containsForbiddenWords(trimmedText)) {
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
      sender: user.email.toLowerCase(),
      text: trimmedText,
      time: Date.now(),
      read: false,
    };
    
    setText("");
    const newMsgRef = push(ref(rtdb, `chats/${chatId}`));
    await set(newMsgRef, msg);
    
    if (partnerEncodedEmail) {
      set(ref(rtdb, `userNotifications/${partnerEncodedEmail}`), true);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!rtdb || !msgId || !chatId) return;
    if (confirm("Шумо мехоҳед ин паёмро ҳазф кунед?")) {
      try {
        await remove(ref(rtdb, `chats/${chatId}/${msgId}`));
      } catch (err) {
        toast({ variant: "destructive", title: "Хатогӣ", description: "Натавонистам паёмро ҳазф кунам" });
      }
    }
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
      <div className="p-2 md:p-4 border-b bg-white flex items-center justify-between sticky top-0 z-20 shadow-sm backdrop-blur-xl bg-white/90">
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-secondary/50 h-8 w-8 md:h-10 md:w-10">
            <ArrowLeft size={16} className="md:size-5" />
          </Button>
          <div className="flex flex-col">
            <h3 className="font-black text-sm md:text-lg leading-tight tracking-tight truncate max-w-[140px] md:max-w-md">
              {partner?.name || partnerEmail.split('@')[0]}
            </h3>
            {partner?.lastSeen && (
              <span className={cn("text-[8px] md:text-[10px] uppercase font-black tracking-widest mt-0.5", Date.now() - partner.lastSeen < 300000 ? "text-green-500" : "text-muted-foreground/60")}>
                {Date.now() - partner.lastSeen < 300000 ? "Онлайн" : `Дида шуд: ${safeFormatTime(partner.lastSeen)}`}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsReportOpen(true)} className="text-muted-foreground hover:text-destructive h-8 w-8 md:h-10 md:w-10 rounded-full">
          <AlertTriangle size={16} className="md:size-5" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-8 space-y-3 bg-[#F5F5F5]/30">
        {messages.map((msg, i) => {
          const isMine = msg.sender && msg.sender.toLowerCase() === user?.email?.toLowerCase();
          return (
            <div key={msg.id || i} className={cn("flex flex-col max-w-[85%] group", isMine ? "ml-auto items-end" : "mr-auto items-start")}>
              <div className="flex items-end gap-1.5 max-w-full">
                {isMine && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0 mb-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteMessage(msg.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
                
                <div className={cn(
                  "p-3 rounded-2xl text-sm font-bold shadow-sm break-words relative", 
                  isMine 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-white border border-primary/5 rounded-tl-none text-foreground"
                )}>
                  {msg.text}
                </div>

                {!isMine && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0 mb-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteMessage(msg.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1 px-1">
                <span className="text-[9px] text-muted-foreground/60 font-black tracking-tighter">{safeFormatTime(msg.time)}</span>
                {isMine && (
                  <span className="text-primary">
                    {msg.read ? <CheckCheck size={12} /> : <Check size={12} />}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 text-center space-y-4">
            <MessageCircle size={56} className="text-primary" />
            <p className="font-black text-md">Паём нависед</p>
          </div>
        )}
      </div>

      <div className="p-3 md:p-6 bg-white border-t sticky bottom-0 z-20 flex gap-2 md:gap-3 items-center">
        <Input 
          placeholder="Паём..." 
          className="rounded-xl md:rounded-2xl h-12 md:h-14 bg-secondary/20 border-none font-bold px-4 md:px-6 focus-visible:ring-primary" 
          value={text} 
          onChange={e => setText(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={currentUserProfile?.isBlocked}
        />
        <Button 
          onClick={handleSend} 
          size="icon" 
          className="rounded-xl md:rounded-2xl h-12 w-12 md:h-14 md:w-14 shrink-0 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all" 
          disabled={currentUserProfile?.isBlocked || !text.trim()}
        >
          <Send size={20} className="md:size-5" />
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
