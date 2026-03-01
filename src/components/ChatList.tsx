"use client";

import { useMemo } from "react";
import { useUser, useRTDBData } from "@/firebase";
import { UserProfile } from "@/app/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatListProps {
  activeChatEmail: string | null;
  onSelect: (email: string) => void;
}

export function ChatList({ activeChatEmail, onSelect }: ChatListProps) {
  const { user } = useUser();
  const { data: usersObj } = useRTDBData("users");
  const { data: chatsObj } = useRTDBData("chats");

  const users = useMemo(() => {
    if (!usersObj || !chatsObj || !user?.email) return [];
    
    const myEncodedEmail = encodeURIComponent(user.email).replace(/\./g, '%2E');
    
    // Пайдо кардани ҳамаи ҳамсӯҳбатон аз рӯи калидҳои чат
    const chatPartnersEmails = new Set<string>();
    Object.keys(chatsObj).forEach(chatKey => {
      if (chatKey.includes(myEncodedEmail)) {
        const parts = chatKey.split('--');
        const partnerEncoded = parts[0] === myEncodedEmail ? parts[1] : parts[0];
        const partnerEmail = decodeURIComponent(partnerEncoded).replace(/%2E/g, '.');
        chatPartnersEmails.add(partnerEmail);
      }
    });

    return Object.entries(usersObj)
      .map(([id, val]: [string, any]) => ({ id, ...val }))
      .filter((u: any) => chatPartnersEmails.has(u.email)) as UserProfile[];
  }, [usersObj, chatsObj, user]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b font-bold text-lg bg-white">Чатҳо</div>
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {users.map(u => (
            <div 
              key={u.email} 
              onClick={() => onSelect(u.email)}
              className={cn(
                "p-4 cursor-pointer hover:bg-secondary/30 transition-colors flex items-center gap-3",
                activeChatEmail === u.email && "bg-primary/10 border-r-4 border-primary"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                {u.name[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-semibold truncate">{u.name}</span>
                  {u.lastSeen && Date.now() - u.lastSeen < 300000 && (
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wider">
                  {u.role === 'korfarmo' ? 'Корфармо' : 'Корҷуй'}
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="p-12 text-center space-y-2">
              <p className="text-muted-foreground font-medium">Шумо то ҳол ягон чат надоред.</p>
              <p className="text-xs text-muted-foreground/60">Барои оғози чат ба эълонҳо гузаред.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
