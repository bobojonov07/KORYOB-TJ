"use client";

import { useMemo } from "react";
import { useUser, useRTDB, useRTDBData } from "@/firebase";
import { ref, remove } from "firebase/database";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageCircle, Trash2, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ChatListProps {
  activeChatEmail: string | null;
  onSelect: (email: string) => void;
  onBack?: () => void;
}

/**
 * Utility to encode email consistently for RTDB paths
 */
const encodeEmail = (email: string) => {
  if (!email) return "";
  return encodeURIComponent(email.toLowerCase()).replace(/\./g, '%2E').toLowerCase();
};

export function ChatList({ activeChatEmail, onSelect, onBack }: ChatListProps) {
  const { user } = useUser();
  const rtdb = useRTDB();
  const { toast } = useToast();
  const { data: usersObj, loading: usersLoading } = useRTDBData("users");
  const { data: chatsObj, loading: chatsLoading } = useRTDBData("chats");

  const sortedUsers = useMemo(() => {
    if (!user?.email || !chatsObj) return [];
    
    const myEncodedEmail = encodeEmail(user.email);
    const chatStats = new Map<string, { lastTime: number; hasUnread: boolean; chatId: string }>();

    // 1. Identify all chats where current user is a participant
    Object.entries(chatsObj).forEach(([chatId, messages]: [string, any]) => {
      const parts = chatId.split('--');
      if (parts.length === 2 && parts.includes(myEncodedEmail)) {
        const partnerEncoded = parts[0] === myEncodedEmail ? parts[1] : parts[0];
        const partnerEmail = decodeURIComponent(partnerEncoded).toLowerCase();
        
        // Safety check for messages
        if (!messages || typeof messages !== 'object') return;

        const messageList = Object.values(messages).sort((a: any, b: any) => (a.time || 0) - (b.time || 0));
        const lastMsg: any = messageList[messageList.length - 1];
        
        const hasUnread = messageList.some((m: any) => 
          m.sender && 
          m.sender.toLowerCase() !== user.email?.toLowerCase() && 
          !m.read
        );

        chatStats.set(partnerEmail, {
          lastTime: lastMsg?.time || 0,
          hasUnread,
          chatId
        });
      }
    });

    if (chatStats.size === 0) return [];

    // 2. Map chat stats to user info
    const result = Array.from(chatStats.entries()).map(([email, stats]) => {
      let userData: any = null;
      if (usersObj) {
        const encoded = encodeEmail(email);
        userData = usersObj[encoded];
        
        // If not found by key, try searching in values
        if (!userData) {
          userData = Object.values(usersObj).find((u: any) => 
            u && u.email && u.email.toLowerCase() === email.toLowerCase()
          );
        }
      }

      return {
        email,
        name: userData?.name || email.split('@')[0],
        role: userData?.role || 'korjob',
        lastSeen: userData?.lastSeen || null,
        ...stats
      };
    });

    return result.sort((a, b) => b.lastTime - a.lastTime);
  }, [usersObj, chatsObj, user]);

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!rtdb || !chatId) return;
    
    if (confirm("Шумо мехоҳед тамоми таърихи ин чатро ҳазф кунед?")) {
      try {
        await remove(ref(rtdb, `chats/${chatId}`));
        toast({ title: "Чат ҳазф шуд" });
      } catch (err) {
        toast({ variant: "destructive", title: "Хатогӣ", description: "Натавонистам чатро ҳазф кунам" });
      }
    }
  };

  if (usersLoading || chatsLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Боршавӣ...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 md:p-5 border-b font-black text-xl tracking-tighter bg-white sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden rounded-full h-10 w-10 bg-secondary/50">
              <ChevronLeft size={20} />
            </Button>
          )}
          Чатҳо
        </div>
        <MessageCircle size={20} className="text-primary opacity-50" />
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y divide-primary/5">
          {sortedUsers.map(u => (
            <div 
              key={u.email} 
              onClick={() => onSelect(u.email)}
              className={cn(
                "p-4 md:p-5 cursor-pointer hover:bg-primary/5 transition-all flex items-center gap-3 md:gap-4 relative group",
                activeChatEmail?.toLowerCase() === u.email?.toLowerCase() && "bg-primary/5"
              )}
            >
              {activeChatEmail?.toLowerCase() === u.email?.toLowerCase() && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>}
              
              <div className="relative">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-xl shadow-sm border border-primary/10">
                  {u.name?.[0]?.toUpperCase() || '?'}
                </div>
                {u.lastSeen && Date.now() - u.lastSeen < 300000 && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-black text-sm md:text-md truncate tracking-tight">{u.name}</span>
                  <div className="flex items-center gap-1.5">
                    {u.hasUnread && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-all rounded-lg md:opacity-0 md:group-hover:opacity-100"
                      onClick={(e) => handleDeleteChat(e, u.chatId)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[9px] text-muted-foreground truncate uppercase font-black tracking-widest bg-secondary/50 px-2 py-0.5 rounded-md">
                    {u.role === 'korfarmo' ? 'Корфармо' : 'Корҷӯ'}
                  </div>
                  {u.lastTime > 0 && (
                    <span className="text-[10px] text-muted-foreground/60 font-bold">
                      {new Date(u.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                <p className="text-xs text-muted-foreground/60 font-bold leading-relaxed">Барои оғози суҳбат ба эълонҳо равед.</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
