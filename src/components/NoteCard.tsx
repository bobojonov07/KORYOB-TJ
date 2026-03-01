"use client";

import { Note } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface NoteCardProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
}

export function NoteCard({ note, isActive, onClick }: NoteCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all duration-200 border-transparent hover:border-primary/50 group",
        isActive ? "bg-primary/10 border-primary/50 shadow-md ring-1 ring-primary/20" : "bg-white hover:bg-muted/30"
      )}
    >
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold truncate group-hover:text-accent transition-colors">
          {note.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {note.content || <span className="italic opacity-50">No content</span>}
        </p>
        <div className="mt-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  );
}