"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, StickyNote, Search, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Note } from "@/app/lib/types";
import { NoteCard } from "@/components/NoteCard";
import { NoteEditor } from "@/components/NoteEditor";
import { GreetingAssistant } from "@/components/GreetingAssistant";
import { Separator } from "@/components/ui/separator";

export default function SalomNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Load notes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("salom-notes");
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse notes", e);
      }
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("salom-notes", JSON.stringify(notes));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, searchQuery]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  const handleSaveNote = (noteData: Partial<Note>) => {
    const now = Date.now();
    if (noteData.id) {
      // Editing
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteData.id
            ? { ...n, ...noteData, updatedAt: now } as Note
            : n
        )
      );
    } else {
      // Creating
      const newNote: Note = {
        id: crypto.randomUUID(),
        title: noteData.title || "Untitled Note",
        content: noteData.content || "",
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
    }
    setIsCreating(false);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
  };

  const handleNewNote = () => {
    setActiveNoteId(null);
    setIsCreating(true);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-body">
      {/* Sidebar */}
      <aside className="w-80 md:w-96 border-r flex flex-col bg-white/40 backdrop-blur-md">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-headline font-bold text-accent tracking-tight flex items-center gap-2">
              <StickyNote className="w-7 h-7" />
              Salom Notes
            </h1>
            <Button onClick={handleNewNote} size="icon" className="rounded-full shadow-lg hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              className="pl-9 bg-white/60 border-primary/20 focus-visible:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <GreetingAssistant />
        </div>

        <Separator className="mx-6 w-auto" />

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-3 pb-8">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-muted-foreground text-sm italic">
                  {searchQuery ? "No notes matching your search" : "No notes yet. Create your first one!"}
                </p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isActive={activeNoteId === note.id}
                  onClick={() => {
                    setActiveNoteId(note.id);
                    setIsCreating(false);
                  }}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-transparent relative">
        <div className="flex-1 max-w-4xl w-full mx-auto px-8 py-12 md:py-20 overflow-y-auto">
          {isCreating || activeNoteId ? (
            <NoteEditor
              activeNote={isCreating ? null : activeNote}
              onSave={handleSaveNote}
              onCancel={() => {
                setIsCreating(false);
                setActiveNoteId(null);
              }}
              onDelete={handleDeleteNote}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                <StickyNote className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-3xl font-headline font-semibold text-foreground">Select a note to view</h2>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  Choose a note from the sidebar or click the plus button to start writing something new.
                </p>
              </div>
              <Button onClick={handleNewNote} variant="outline" className="gap-2 border-primary/20">
                <Plus className="w-4 h-4" />
                Create New Note
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}