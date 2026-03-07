
"use client";

import { useMemo, useState } from "react";
import { useUser, useRTDB, useRTDBData } from "@/firebase";
import { ref, remove } from "firebase/database";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageCircle, Trash2, ChevronLeft, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  
  const { data: usersObj, loading: usersLoading } = useRTDBData("users");
  const { data: chatsObj, loading: chatsLoading } = useRTDBData("chats");

  const sortedChatPartners = useMemo(() => {
    if (!user?.email || !chatsObj || !usersObj) return [];
    
    const myEncodedEmail = encodeEmail(user.email);
    const partners: any[] = [];

    Object.entries(chatsObj).forEach(([chatId, messages]: [string, any]) => {
      if (chatId.includes(myEncodedEmail)) {
        const parts = chatId.split('--');
        if (parts.length !== 2) return;

        const partnerEncoded = parts[0] === myEncodedEmail ? parts[1] : parts[0];
        const partnerEmail = decodeURIComponent(partnerEncoded).replace(/%2E/g, '.');
        
        const messageList = Object.values(messages || {}).sort((a: any, b: any) => 
          new Date(a.time).getTime() - new Date(b.time).getTime()
        );
        
        if (messageList.length === 0) return;

        const lastMsg: any = messageList[messageList.length - 1];
        const hasUnread = messageList.some((m: any) => 
          m.sender && m.sender.toLowerCase() !== user.email?.toLowerCase() && !m.read
        );

        const userData = usersObj[partnerEncoded];

        partners.push({
          email: partnerEmail,
          name: userData?.name || partnerEmail.split('@')[0],
          role: userData?.role || 'korjob',
          lastSeen: userData?.lastSeen || null,
          lastTime: new Date(lastMsg.time).getTime() || 0,
          lastText: lastMsg.text || "Паём...",
          hasUnread,
          chatId
        });
      }
    });

    // Сорткунии қатъӣ: Охирин суҳбат ҳамеша дар боло
    let result = partners.sort((a, b) => b.lastTime - a.lastTime);

    if (showOnlyUnread) {
      result = result.filter(u => u.hasUnread);
    }

    return result;
  }, [usersObj, chatsObj, user, showOnlyUnread]);

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
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Боршавии суҳбатҳо...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b bg-white sticky top-0 z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter uppercase">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden rounded-full h-10 w-10">
                <ChevronLeft size={20} />
              </Button>
            )}
            Чатҳо
          </div>
          <MessageCircle size={20} className="text-primary" />
        </div>
        
        <Button 
          variant={showOnlyUnread ? "default" : "outline"} 
          size="sm" 
          onClick={() => setShowOnlyUnread(!showOnlyUnread)}
          className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 h-10"
        >
          <Filter size={14} />
          {showOnlyUnread ? "Намоиши ҳама" : "Танҳо нахондаҳо"}
        </Button>
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
                  "p-4 cursor-pointer hover:bg-gray-50 transition-all flex items-center gap-3 relative group border-l-4 border-transparent",
                  activeChatEmail?.toLowerCase() === u.email?.toLowerCase() && "bg-orange-50/50 border-l-primary"
                )}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center font-black text-primary text-xl border-2 border-white shadow-sm">
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className={cn(
                    "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm",
                    isOnline ? "bg-green-500" : "bg-gray-300"
                  )}></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-black text-sm truncate text-foreground">{u.name}</span>
                      <Badge variant="secondary" className="text-[7px] h-3.5 px-1.5 rounded uppercase font-black tracking-widest bg-gray-100 text-muted-foreground border-none">
                        {u.role === 'korfarmo' ? 'Корфармо' : 'Корҷӯ'}
                      </Badge>
                    </div>
                    <span className="text-[9px] text-muted-foreground/60 font-black whitespace-nowrap ml-2">
                      {new Date(u.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "text-xs truncate font-medium flex-1",
                      u.hasUnread ? "text-foreground font-black" : "text-muted-foreground/70"
                    )}>
                      {u.lastText}
                    </p>
                    <div className="flex items-center gap-2">
                      {u.hasUnread && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 animate-pulse shadow-sm shadow-primary/50"></div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive/30 hover:text-destructive hover:bg-destructive/5 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity"
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
              <p className="font-black text-xs uppercase tracking-widest">
                {showOnlyUnread ? "Паёмҳои нахонда ёфт нашуданд" : "Рӯйхати чатҳо холӣ аст"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
