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

  const users = useMemo(() => {
    if (!usersObj) return [];
    return Object.entries(usersObj)
      .map(([id, val]: [string, any]) => ({ id, ...val }))
      .filter((u: any) => u.email !== user?.email) as UserProfile[];
  }, [usersObj, user]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b font-bold text-lg">Чатҳо</div>
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
                <div className="text-xs text-muted-foreground truncate">{u.role === 'korfarmo' ? 'Корфармо' : 'Корҷуй'}</div>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="p-8 text-center text-muted-foreground text-sm">Ҳамсӯҳбатҳо ёфт нашуданд</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
