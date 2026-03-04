
"use client";

import { useMemo } from "react";
import { useUser, useRTDBData } from "@/firebase";
import { UserProfile } from "@/app/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

interface ChatListProps {
  activeChatEmail: string | null;
  onSelect: (email: string) => void;
}

export function ChatList({ activeChatEmail, onSelect }: ChatListProps) {
  const { user } = useUser();
  const { data: usersObj } = useRTDBData("users");
  const { data: chatsObj } = useRTDBData("chats");

  const sortedUsers = useMemo(() => {
    if (!usersObj || !chatsObj || !user?.email) return [];
    
    const myEncodedEmail = encodeURIComponent(user.email).replace(/\./g, '%2E');
    const chatStats = new Map<string, { lastTime: number, hasUnread: boolean }>();
    
    // Дарёфти маълумот дар бораи охирин паёмҳо аз ҳамаи чатҳо
    Object.entries(chatsObj).forEach(([chatKey, messages]: [string, any]) => {
      if (chatKey.includes(myEncodedEmail)) {
        const parts = chatKey.split('--');
        const partnerEncoded = parts[0] === myEncodedEmail ? parts[1] : parts[0];
        const partnerEmail = decodeURIComponent(partnerEncoded).replace(/%2E/g, '.');
        
        const messageList = Object.values(messages).sort((a: any, b: any) => (a.time || 0) - (b.time || 0));
        const lastMsg: any = messageList[messageList.length - 1];
        const hasUnread = messageList.some((m: any) => m.sender !== user.email && !m.read);
        
        chatStats.set(partnerEmail, { 
          lastTime: lastMsg?.time || 0,
          hasUnread 
        });
      }
    });

    // Тартиб додани рӯйхати корбарон аз рӯи вақти охирин паём
    return Object.entries(usersObj)
      .map(([id, val]: [string, any]) => ({ id, ...val }))
      .filter((u: any) => chatStats.has(u.email))
      .map((u: any) => ({
        ...u,
        lastInteraction: chatStats.get(u.email)?.lastTime || 0,
        hasUnread: chatStats.get(u.email)?.hasUnread || false
      }))
      .sort((a, b) => b.lastInteraction - a.lastInteraction);
  }, [usersObj, chatsObj, user]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-5 border-b font-black text-xl tracking-tighter bg-white sticky top-0 z-10 flex items-center justify-between">
        Чатҳо
        <MessageCircle size={20} className="text-primary opacity-50" />
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y divide-primary/5">
          {sortedUsers.map(u => (
            <div 
              key={u.email} 
              onClick={() => onSelect(u.email)}
              className={cn(
                "p-5 cursor-pointer hover:bg-primary/5 transition-all flex items-center gap-4 relative",
                activeChatEmail === u.email && "bg-primary/5"
              )}
            >
              {activeChatEmail === u.email && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>}
              
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-xl shadow-sm border border-primary/10">
                  {u.name[0]?.toUpperCase() || '?'}
                </div>
                {u.lastSeen && Date.now() - u.lastSeen < 300000 && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-4 border-white"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-md truncate tracking-tight">{u.name}</span>
                  {u.hasUnread && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-muted-foreground truncate uppercase font-black tracking-widest bg-secondary/50 px-2 py-0.5 rounded-md">
                    {u.role === 'korfarmo' ? 'Корфармо' : 'Корҷӯ'}
                  </div>
                  {u.lastInteraction > 0 && (
                    <span className="text-[10px] text-muted-foreground/60 font-bold">
                      {new Date(u.lastInteraction).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {sortedUsers.length === 0 && (
            <div className="p-16 text-center space-y-4">
              <div className="bg-secondary/30 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-muted-foreground opacity-30">
                <MessageCircle size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-black">Чатҳо ёфт нашуданд</p>
                <p className="text-xs text-muted-foreground/60 font-bold leading-relaxed">Барои оғози суҳбат ба эълонҳо равед ва тугмаи "Чат"-ро пахш кунед.</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
