"use client";

import { useState, useEffect } from "react";
import { Save, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Note } from "@/app/lib/types";

interface NoteEditorProps {
  activeNote: Note | null;
  onSave: (note: Partial<Note>) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

export function NoteEditor({ activeNote, onSave, onCancel, onDelete }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [activeNote]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    onSave({
      ...(activeNote?.id ? { id: activeNote.id } : {}),
      title: title || "Untitled Note",
      content: content,
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Note Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-headline font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent"
        />
        <div className="flex gap-2">
          {activeNote?.id && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(activeNote.id)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <Textarea
        placeholder="Start writing..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 resize-none border-none shadow-none focus-visible:ring-0 text-lg leading-relaxed bg-transparent p-0 min-h-[300px]"
      />
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} className="gap-2 px-6" size="lg">
          <Save className="w-4 h-4" />
          Save Note
        </Button>
      </div>
    </div>
  );
}