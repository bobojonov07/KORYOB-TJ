
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useUser, useRTDB, useRTDBData } from "@/firebase";
import { ref, push, update, set, runTransaction, remove } from "firebase/database";
import { ChatMessage, UserProfile } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Check, CheckCheck, AlertTriangle, MessageCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { containsForbiddenWords, MODERATION_RULES } from "@/app/lib/moderation";
import { useToast } from "@/hooks/use-toast";
import { ReportDialog } from "./ReportDialog";

interface ChatWindowProps {
  partnerEmail: string;
  onBack: () => void;
}

const encodeEmail = (email: string) => {
  if (!email) return "";
  return encodeURIComponent(email.toLowerCase()).replace(/\./g, '%2E');
};

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

    // Лимити умумии 1000 аломат барои тамоми суҳбат
    if (totalChatCharacters + trimmedText.length > 1000) {
      toast({ 
        variant: "destructive", 
        title: "Лимити суҳбат ба охир расид", 
        description: `Шумораи умумии аломатҳо дар ин суҳбат аз 1000 гузашт. (Ҳозир: ${totalChatCharacters})` 
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
      set(ref(rtdb, `userNotifications/${partnerEncodedEmail}`), true);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!rtdb || !msgId || !chatId) return;
    if (confirm("Ҳазф кардани паём?")) {
      remove(ref(rtdb, `chats/${chatId}/${msgId}`));
    }
  };

  const formatLastSeen = (timestamp: number | null) => {
    if (!timestamp) return '—';
    const diff = Date.now() - timestamp;
    if (diff < 5 * 60 * 1000) return <span className="text-green-500 font-bold">Онлайн</span>;
    return `Дида шуд: ${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#fdfcfb]">
      <div className="p-3 border-b bg-white flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex flex-col">
            <h3 className="font-black text-md leading-tight">{partner?.name || partnerEmail.split('@')[0]}</h3>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {formatLastSeen(partner?.lastSeen || null)}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsReportOpen(true)} className="text-muted-foreground hover:text-destructive">
          <AlertTriangle size={18} />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg, i) => {
          const isMine = msg.sender?.toLowerCase() === user?.email?.toLowerCase();
          const time = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={msg.id || i} className={cn("flex flex-col max-w-[85%] group", isMine ? "ml-auto items-end" : "mr-auto items-start")}>
              <div className={cn(
                "p-3 rounded-2xl text-[14px] font-medium shadow-sm break-words relative flex flex-col gap-1", 
                isMine ? "bg-[#e0f7fa] text-[#222] rounded-tr-none" : "bg-[#f1f1f1] text-[#222] rounded-tl-none"
              )}>
                <span>{msg.text}</span>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className="text-[9px] opacity-60 font-bold">{time}</span>
                  {isMine && (
                    <span className={cn(msg.read ? "text-[#00b8d4]" : "text-gray-400")}>
                      {msg.read ? <CheckCheck size={12} /> : <Check size={12} />}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-destructive p-1 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
            <MessageCircle size={64} className="text-primary" />
            <p className="font-black mt-4 uppercase tracking-tighter">Паём нависед...</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t sticky bottom-0 z-20 flex flex-col gap-2">
        <div className="flex gap-3 items-center">
          <Input 
            placeholder="Паём нависед..." 
            className="rounded-full h-12 bg-gray-100 border-none font-bold px-5 focus-visible:ring-primary" 
            value={text} 
            onChange={e => setText(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={currentUserProfile?.isBlocked}
          />
          <Button 
            onClick={handleSend} 
            size="icon" 
            className="rounded-full h-12 w-12 shrink-0 bg-primary hover:bg-primary/90 shadow-lg active:scale-95 transition-all" 
            disabled={currentUserProfile?.isBlocked || !text.trim() || (totalChatCharacters + text.trim().length > 1000)}
          >
            <Send size={20} />
          </Button>
        </div>
        <div className="flex justify-between items-center px-4">
           <span className={cn("text-[9px] font-black uppercase tracking-widest", (totalChatCharacters + text.length > 1000) ? "text-destructive" : "text-muted-foreground")}>
             Умумӣ: {totalChatCharacters + text.length} / 1000 аломат
           </span>
           {(totalChatCharacters + text.length > 1000) && <span className="text-[9px] font-black text-destructive uppercase tracking-widest">Лимити суҳбат ба охир расид!</span>}
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
