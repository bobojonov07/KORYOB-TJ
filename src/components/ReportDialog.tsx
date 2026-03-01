
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MODERATION_RULES } from "@/app/lib/moderation";
import { useRTDB, useUser } from "@/firebase";
import { ref, push, set, runTransaction } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUid: string;
  reportedEmail: string;
}

export function ReportDialog({ isOpen, onClose, reportedUid, reportedEmail }: ReportDialogProps) {
  const { user } = useUser();
  const rtdb = useRTDB();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !rtdb) return;
    
    if (reason.length < MODERATION_RULES.REPORT_MIN_LENGTH || reason.length > MODERATION_RULES.REPORT_MAX_LENGTH) {
      toast({
        variant: "destructive",
        title: "Хатогӣ",
        description: `Сабаб бояд аз ${MODERATION_RULES.REPORT_MIN_LENGTH} то ${MODERATION_RULES.REPORT_MAX_LENGTH} аломат бошад.`
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Save report details
      const reportsRef = ref(rtdb, "reports");
      const newReportRef = push(reportsRef);
      await set(newReportRef, {
        reportedUid,
        reporterUid: user.uid,
        reason,
        timestamp: Date.now()
      });

      // 2. Increment user reportsCount and block if needed
      const encodedEmail = encodeURIComponent(reportedEmail).replace(/\./g, '%2E');
      const userRef = ref(rtdb, `users/${encodedEmail}`);
      
      await runTransaction(userRef, (userData) => {
        if (userData) {
          userData.reportsCount = (userData.reportsCount || 0) + 1;
          if (userData.reportsCount >= MODERATION_RULES.MAX_REPORTS) {
            userData.isBlocked = true;
          }
        }
        return userData;
      });

      toast({ title: "Гузориш фиристода шуд", description: "Ташаккур барои кӯмак дар беҳтар кардани платформа." });
      onClose();
      setReason("");
    } catch (e) {
      toast({ variant: "destructive", title: "Хатогӣ", description: "Фиристодани гузориш ноком шуд." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" /> Гузориш дар бораи корбар
          </DialogTitle>
          <DialogDescription>
            Лутфан сабаби гузоришро муфассал шарҳ диҳед. Корбаре, ки 5 гузориш мегирад, блок карда мешавад.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Textarea 
            placeholder="Сабаби гузориш (50-100 аломат)..." 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="rounded-xl"
          />
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>Аломатҳо: {reason.length}</span>
            <span className={reason.length >= 50 && reason.length <= 100 ? "text-green-500" : "text-destructive"}>
              {reason.length < 50 ? "Кам" : reason.length > 100 ? "Зиёд" : "Дуруст"}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl">Бекор</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading} className="rounded-xl">Фиристодан</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
