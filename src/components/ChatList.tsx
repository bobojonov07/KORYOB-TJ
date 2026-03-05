
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

const encodeEmail = (email: string) => {
  if (!email) return "";
  return encodeURIComponent(email.toLowerCase()).replace(/\./g, '%2E');
};

export function ChatList({ activeChatEmail, onSelect, onBack }: ChatListProps) {
  const { user } = useUser();
  const rtdb = useRTDB();
  const { toast } = useToast();
  const { data: usersObj, loading: usersLoading } = useRTDBData("users");
  const { data: chatsObj, loading: chatsLoading } = useRTDBData("chats");

  const sortedChatPartners = useMemo(() => {
    if (!user?.email || !chatsObj || !usersObj) return [];
    
    const myEncodedEmail = encodeEmail(user.email);
    const chatPartnersMap = new Map<string, { lastTime: number; lastText: string; hasUnread: boolean; chatId: string }>();

    // Ҷамъоварии ҳамаи чатҳо ва ёфтани паёми охирин барои ҳар як ҳамсӯҳбат
    Object.entries(chatsObj).forEach(([chatId, messages]: [string, any]) => {
      if (chatId.includes(myEncodedEmail)) {
        const parts = chatId.split('--');
        if (parts.length !== 2) return;

        const partnerEncoded = parts[0] === myEncodedEmail ? parts[1] : parts[0];
        const partnerEmail = decodeURIComponent(partnerEncoded).replace(/%2E/g, '.');
        
        // Сорткунии паёмҳо барои ёфтани охирин паём
        const messageList = Object.values(messages || {}).sort((a: any, b: any) => 
          new Date(a.time).getTime() - new Date(b.time).getTime()
        );
        
        const lastMsg: any = messageList[messageList.length - 1];
        const hasUnread = messageList.some((m: any) => 
          m.sender && m.sender.toLowerCase() !== user.email?.toLowerCase() && !m.read
        );

        if (lastMsg) {
          chatPartnersMap.set(partnerEmail, {
            lastTime: new Date(lastMsg.time).getTime(),
            lastText: lastMsg.text,
            hasUnread,
            chatId
          });
        }
      }
    });

    // Табдил додани Map ба массив ва сорт кардан: охирин дар боло
    return Array.from(chatPartnersMap.entries())
      .map(([email, stats]) => {
        const encoded = encodeEmail(email);
        const userData = usersObj[encoded];
        return {
          email,
          name: userData?.name || email.split('@')[0],
          role: userData?.role || 'korjob',
          lastSeen: userData?.lastSeen || null,
          ...stats
        };
      })
      .sort((a, b) => b.lastTime - a.lastTime); // МАНТИҚИ АСОСӢ: Охирин паём дар боло
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

  const formatLastSeen = (timestamp: number | null) => {
    if (!timestamp) return '';
    const diff = Date.now() - timestamp;
    if (diff < 5 * 60 * 1000) return 'Онлайн';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      <div className="p-4 border-b font-black text-xl tracking-tighter bg-white sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden rounded-full h-10 w-10">
              <ChevronLeft size={20} />
            </Button>
          )}
          Чатҳо
        </div>
        <MessageCircle size={20} className="text-primary" />
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y divide-primary/5">
          {sortedChatPartners.map(u => {
            const isOnline = u.lastSeen && (Date.now() - u.lastSeen < 5 * 60 * 1000);
            return (
              <div 
                key={u.email} 
                onClick={() => onSelect(u.email)}
                className={cn(
                  "p-4 cursor-pointer hover:bg-gray-50 transition-all flex items-center gap-3 relative group",
                  activeChatEmail?.toLowerCase() === u.email?.toLowerCase() && "bg-orange-50/50"
                )}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center font-black text-primary text-xl border-2 border-white shadow-sm">
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                    isOnline ? "bg-green-500" : "bg-gray-300"
                  )}></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <div className="flex items-center gap-1 truncate">
                      <span className="font-black text-sm truncate">{u.name}</span>
                      <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest bg-gray-100 px-1 py-0.5 rounded">
                        {u.role === 'korfarmo' ? 'Корфармо' : 'Корҷӯ'}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 font-bold whitespace-nowrap ml-2">
                      {formatLastSeen(u.lastTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "text-xs truncate font-medium",
                      u.hasUnread ? "text-foreground font-black" : "text-muted-foreground"
                    )}>
                      {u.lastText || "Паёмҳо мавҷуд нест"}
                    </p>
                    <div className="flex items-center gap-2">
                      {u.hasUnread && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 animate-pulse"></div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteChat(e, u.chatId)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {sortedChatPartners.length === 0 && (
            <div className="p-16 text-center space-y-4 opacity-40">
              <MessageCircle size={48} className="mx-auto text-muted-foreground" />
              <p className="font-black text-sm">Рӯйхати чатҳо холӣ аст</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
