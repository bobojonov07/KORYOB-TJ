
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, addDoc, doc, updateDoc, where } from "firebase/firestore";
import { ChatMessage, UserProfile } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  partnerUid: string;
  onBack: () => void;
}

export function ChatWindow({ partnerUid, onBack }: ChatWindowProps) {
  const { db } = useFirestore();
  const { user } = useUser();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatId = useMemo(() => {
    if (!user) return "";
    return [user.uid, partnerUid].sort().join("--");
  }, [user, partnerUid]);

  const messagesRef = useMemo(() => collection(db, "chats", chatId, "messages"), [db, chatId]);
  const messagesQuery = useMemo(() => query(messagesRef, orderBy("time", "asc")), [messagesRef]);
  const { data: messages = [] } = useCollection(messagesQuery) as { data: ChatMessage[] };

  const partnerDoc = useMemo(() => doc(db, "users", partnerUid), [db, partnerUid]);
  const { data: partnerProfile } = useCollection(query(collection(db, "users"), where("uid", "==", partnerUid))) as { data: UserProfile[] };
  const partner = partnerProfile?.[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark as read
  useEffect(() => {
    if (!user || !messages.length) return;
    messages.forEach(async (msg) => {
      if (msg.receiverUid === user.uid && !msg.read && msg.id) {
        await updateDoc(doc(db, "chats", chatId, "messages", msg.id), { read: true });
      }
    });
  }, [messages, user, chatId, db]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const msg: ChatMessage = {
      senderUid: user.uid,
      receiverUid: partnerUid,
      text: text.trim(),
      time: Date.now(),
      read: false,
    };
    setText("");
    await addDoc(messagesRef, msg);
  };

  return (
    <div className="flex flex-col h-full bg-secondary/5">
      <div className="p-4 border-b bg-white flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft />
        </Button>
        <div className="flex flex-col">
          <h3 className="font-bold text-lg leading-none">{partner?.name || "Чат"}</h3>
          {partner?.lastSeen && (
            <span className={cn("text-[10px] mt-1", Date.now() - partner.lastSeen < 300000 ? "text-green-500 font-bold" : "text-muted-foreground")}>
              {Date.now() - partner.lastSeen < 300000 ? "Онлайн" : `Охирин дидан: ${format(partner.lastSeen, "HH:mm")}`}
            </span>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col max-w-[80%]", msg.senderUid === user?.uid ? "ml-auto items-end" : "mr-auto items-start")}>
            <div className={cn("p-3 rounded-2xl text-sm break-words", msg.senderUid === user?.uid ? "bg-primary text-white rounded-tr-none" : "bg-white border rounded-tl-none")}>
              {msg.text}
            </div>
            <div className="flex items-center gap-1 mt-1 px-1">
              <span className="text-[10px] text-muted-foreground">{format(msg.time, "HH:mm")}</span>
              {msg.senderUid === user?.uid && (
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
        />
        <Button onClick={handleSend} size="icon" className="rounded-full shrink-0">
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
}
