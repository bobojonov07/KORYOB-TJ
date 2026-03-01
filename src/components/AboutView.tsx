
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Instagram, Send, MessageCircle, Info, ShieldAlert } from "lucide-react";

interface AboutViewProps {
  onBack: () => void;
}

export function AboutView({ onBack }: AboutViewProps) {
  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
          <ArrowLeft />
        </Button>
        <h2 className="text-2xl font-black">Оиди барнома</h2>
      </div>

      <Card className="rounded-[2.5rem] border-primary/10 shadow-xl overflow-hidden bg-white">
        <CardHeader className="bg-primary text-white p-8 md:p-12 text-center">
          <CardTitle className="text-3xl md:text-4xl font-black">KORYOB.TJ</CardTitle>
          <p className="mt-2 text-white/80 font-medium">Платформаи муосири корёбӣ дар Тоҷикистон</p>
        </CardHeader>
        <CardContent className="p-8 md:p-12 space-y-10">
          <div className="space-y-4">
            <h3 className="text-xl font-black flex items-center gap-3">
              <Info className="text-primary" /> Мақсади мо
            </h3>
            <p className="text-muted-foreground leading-relaxed text-lg font-medium italic">
              KORYOB.TJ бо мақсади осон кардани раванди дарёфти ҷойи кор ва пайваст кардани мустақими корҷӯён бо корфармоён сохта шудааст. Мо мехоҳем, ки ҳар як нафар имкони пайдо кардани кори орзуи худро дошта бошад.
            </p>
          </div>

          <div className="bg-destructive/5 border border-destructive/10 p-6 md:p-8 rounded-[2rem] space-y-4">
            <h3 className="text-xl font-black flex items-center gap-3 text-destructive">
              <ShieldAlert /> Огоҳинома (Disclaimer)
            </h3>
            <div className="text-sm text-destructive/80 leading-relaxed font-bold space-y-2">
              <p>• Барномасоз ва маъмурияти лоиҳа барои дурустии маълумот дар эълонҳо ҷавобгар нестанд.</p>
              <p>• Ҳамаи эълонҳо аз ҷониби корбарони озод нашр карда мешаванд.</p>
              <p>• Мо танҳо як платформаи техникӣ барои мусоидат ва осон кардани кори шумо ҳастем.</p>
              <p>• Лутфан, пеш аз қабули кор, ҳамаи маълумотро мустақилона тафтиш кунед.</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black text-center">Тамос бо мо</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ContactLink 
                icon={<MessageCircle className="w-6 h-6" />} 
                label="WhatsApp" 
                value="200702032" 
                href="https://wa.me/992200702032"
                color="bg-[#25D366]"
              />
              <ContactLink 
                icon={<Send className="w-6 h-6" />} 
                label="Telegram" 
                value="200702032" 
                href="https://t.me/+992200702032"
                color="bg-[#0088cc]"
              />
              <ContactLink 
                icon={<Instagram className="w-6 h-6" />} 
                label="Instagram" 
                value="koryob.ab" 
                href="https://instagram.com/koryob.ab"
                color="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContactLink({ icon, label, value, href, color }: { icon: React.ReactNode, label: string, value: string, href: string, color: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex flex-col items-center p-6 rounded-3xl border border-primary/5 hover:border-primary/20 transition-all hover:shadow-lg group bg-secondary/10"
    >
      <div className={`${color} text-white p-4 rounded-2xl group-hover:scale-110 transition-transform shadow-md`}>
        {icon}
      </div>
      <span className="mt-3 font-black text-sm">{label}</span>
      <span className="text-xs text-muted-foreground font-bold">{value}</span>
    </a>
  );
}
