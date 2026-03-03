
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Instagram, Send, MessageCircle, Info, ShieldAlert, Code } from "lucide-react";

interface AboutViewProps {
  onBack: () => void;
}

export function AboutView({ onBack }: AboutViewProps) {
  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-black">Оиди барнома</h2>
      </div>

      <Card className="rounded-[2.5rem] border-primary/10 shadow-lg overflow-hidden bg-white">
        <CardHeader className="bg-primary text-white p-6 md:p-10 text-center">
          <CardTitle className="text-2xl md:text-3xl font-black">KORYOB.TJ</CardTitle>
          <p className="text-sm text-white/80 font-medium">Платформаи №1 барои дарёфти кор</p>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8">
          <div className="space-y-3">
            <h3 className="text-lg font-black flex items-center gap-2">
              <Code className="text-primary" size={20} /> Барномасоз
            </h3>
            <p className="text-lg font-bold text-foreground">Бобоҷонзода Аминҷон</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-black flex items-center gap-2">
              <Info className="text-primary" size={20} /> Мақсади мо
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm font-medium">
              KORYOB.TJ барои осон кардани раванди дарёфти кор дар тамоми Тоҷикистон сохта шудааст. Мо мехоҳем, ки корҷӯён ва корфармоён мустақиман бо ҳам пайваст шаванд.
            </p>
          </div>

          <div className="bg-destructive/5 border border-destructive/10 p-5 rounded-2xl space-y-3">
            <h3 className="text-md font-black flex items-center gap-2 text-destructive">
              <ShieldAlert size={18} /> Огоҳинома
            </h3>
            <div className="text-[11px] text-destructive/80 leading-relaxed font-bold space-y-1">
              <p>• Барномасоз барои маълумот дар эълонҳо ҷавобгар нест.</p>
              <p>• Эълонҳо аз ҷониби корбарон нашр мешаванд.</p>
              <p>• Лутфан, ҳама маълумотро пеш аз қабули кор тафтиш кунед.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-black text-center">Тамос бо мо</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ContactLink icon={<MessageCircle size={20}/>} label="WhatsApp" href="https://wa.me/992200702032" color="bg-[#25D366]" />
              <ContactLink icon={<Send size={20}/>} label="Telegram" href="https://t.me/+992200702032" color="bg-[#0088cc]" />
              <ContactLink icon={<Instagram size={20}/>} label="Instagram" href="https://instagram.com/koryob.ab" color="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContactLink({ icon, label, href, color }: { icon: React.ReactNode, label: string, href: string, color: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-all border border-primary/5">
      <div className={`${color} text-white p-2 rounded-lg`}>{icon}</div>
      <span className="font-black text-sm">{label}</span>
    </a>
  );
}
