"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Instagram, Send, MessageCircle, Info, ShieldAlert, Code, Sparkles } from "lucide-react";

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
        <CardHeader className="bg-primary text-white p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
             <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          <CardTitle className="text-3xl md:text-4xl font-black tracking-tighter mb-2">KORYOB.TJ</CardTitle>
          <p className="text-sm text-white/80 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <Sparkles size={14} /> Платформаи №1 дар Тоҷикистон
          </p>
        </CardHeader>
        <CardContent className="p-6 md:p-10 space-y-8">
          <div className="flex items-center gap-5 p-5 bg-secondary/20 rounded-[1.5rem] border border-primary/5">
            <div className="bg-primary/10 p-4 rounded-2xl">
              <Code className="text-primary" size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Барномасоз</p>
              <h3 className="text-xl font-black text-foreground">Бобоҷонзода Аминҷон</h3>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-black flex items-center gap-2">
              <Info className="text-primary" size={20} /> Мақсади лоиҳа
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm font-bold">
              KORYOB.TJ бо мақсади осон ва тезтар кардани раванди дарёфти кор барои ҳамватанони мо сохта шудааст. Мо мехоҳем, ки ҳар як сокини Тоҷикистон тавонад кори мувофиқи худро бидуни миёнаравҳо пайдо кунад.
            </p>
          </div>

          <div className="bg-destructive/5 border border-destructive/10 p-6 rounded-[2rem] space-y-4">
            <h3 className="text-md font-black flex items-center gap-2 text-destructive">
              <ShieldAlert size={20} /> Огоҳинома ва Амният
            </h3>
            <div className="text-[11px] text-destructive/80 leading-relaxed font-bold space-y-2">
              <p>• Барномасоз Бобоҷонзода Аминҷон барои саҳеҳӣ ва маълумоти дохили эълонҳо ҷавобгар нест.</p>
              <p>• Эълонҳо аз ҷониби худи корбарон нашр мешаванд ва мо ба онҳо назорат намекунем.</p>
              <p>• Дар платформа системаи автоматии модераторӣ фаъол аст, ки дашномҳоро филтр мекунад.</p>
              <p>• Лутфан, пеш аз қабули кор ҳама маълумотро шахсан тафтиш кунед.</p>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-lg font-black text-center tracking-tight">Тамос бо мо</h3>
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
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-white hover:bg-secondary/50 transition-all border border-primary/5 shadow-sm group">
      <div className={`${color} text-white p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>{icon}</div>
      <span className="font-black text-sm">{label}</span>
    </a>
  );
}
