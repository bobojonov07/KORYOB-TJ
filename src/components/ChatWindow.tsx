"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useUser, useRTDB, useRTDBData } from "@/firebase";
import { ref, push, update, set, runTransaction } from "firebase/database";
import { ChatMessage, UserProfile } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Check, CheckCheck, AlertTriangle } from "lucide-react";
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
    if (!user || !messages.length) return;
    messages.forEach((msg) => {
      if (msg.sender !== user.email && !msg.read && msg.id) {
        update(ref(rtdb, `chats/${chatId}/${msg.id}`), { read: true });
      }
    });
    if (myEncodedEmail) {
      set(ref(rtdb, `userNotifications/${myEncodedEmail}`), false);
    }
  }, [messages, user, chatId, rtdb, myEncodedEmail]);

  const handleSend = async () => {
    if (!text.trim() || !user?.email || !currentUserProfile) return;

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
    <div className="flex flex-col h-full bg-secondary/5">
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft />
          </Button>
          <div className="flex flex-col">
            <h3 className="font-bold text-lg leading-none">{partner?.name || "Чат"}</h3>
            {partner?.lastSeen && (
              <span className={cn("text-[10px] mt-1", Date.now() - partner.lastSeen < 300000 ? "text-green-500 font-bold" : "text-muted-foreground")}>
                {Date.now() - partner.lastSeen < 300000 ? "Онлайн" : `Охирин дидан: ${safeFormatTime(partner.lastSeen)}`}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsReportOpen(true)} className="text-muted-foreground hover:text-destructive">
          <AlertTriangle size={20} />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col max-w-[80%]", msg.sender === user?.email ? "ml-auto items-end" : "mr-auto items-start")}>
            <div className={cn("p-3 rounded-2xl text-sm break-words", msg.sender === user?.email ? "bg-primary text-white rounded-tr-none" : "bg-white border rounded-tl-none")}>
              {msg.text}
            </div>
            <div className="flex items-center gap-1 mt-1 px-1">
              <span className="text-[10px] text-muted-foreground">{safeFormatTime(msg.time)}</span>
              {msg.sender === user?.email && (
                <span className="text-primary">
                  {msg.read ? <CheckCheck size={12} /> : <Check size={12} />}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t flex gap-2">
        <Input 
          placeholder="Паём нависед..." 
          className="rounded-full" 
          value={text} 
          onChange={e => setText(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={currentUserProfile?.isBlocked}
        />
        <Button onClick={handleSend} size="icon" className="rounded-full shrink-0" disabled={currentUserProfile?.isBlocked}>
          <Send size={18} />
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
