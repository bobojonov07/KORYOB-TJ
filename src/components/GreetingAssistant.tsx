"use client";

import { useState } from "react";
import { Sparkles, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { generateGreetingMessage } from "@/ai/flows/generate-greeting-message";

export function GreetingAssistant() {
  const [prompt, setPrompt] = useState("");
  const [greeting, setGreeting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    try {
      const result = await generateGreetingMessage({ prompt });
      setGreeting(result.message);
    } catch (error) {
      console.error("Failed to generate greeting", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-lg bg-white/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-headline flex items-center gap-2 text-accent">
          <Sparkles className="w-5 h-5" />
          Greeting Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="How are you feeling today?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            className="bg-white/80"
          />
          <Button 
            onClick={handleGenerate} 
            disabled={isLoading || !prompt.trim()}
            size="icon"
            className="shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        {greeting && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-1">
            <p className="text-sm leading-relaxed italic text-foreground/80">
              "{greeting}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}