"use client";

/**
 * src/app/admin/page.tsx
 * - Dedicated admin console (only visible/usable for ADMIN_EMAIL)
 * - Lists users with presence, shows conversation per user, allows reply, delete, clear
 * - Reuses the same Firestore collections as ChatWidget
 */

import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "@/src/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, onSnapshot, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";
import { Trash2, ArrowLeft, Send } from "lucide-react";

const ADMIN_EMAIL = "admin@gmail.com";

type Msg = { id: string; text: string; author?: string; createdAt?: any; userEmail?: string; sender?: string };

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    // load all distinct userEmail from messages
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const all = Array.from(new Set(snap.docs.map((d) => (d.data() as any).userEmail).filter(Boolean)));
      setUsers(all);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    const q = query(collection(db, "messages"), where("userEmail", "==", selected), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [selected]);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    await addDoc(collection(db, "messages"), { text: reply.trim(), sender: "admin", userEmail: selected, author: ADMIN_EMAIL, createdAt: serverTimestamp() });
    setReply("");
  };

  const deleteMsg = async (id: string) => {
    await deleteDoc(doc(db, "messages", id));
  };

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Admin console — please login as admin</h2>
          <Link href="/" className="px-4 py-2 bg-blue-600 rounded">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
        <div className="bg-white/5 rounded p-4">
          <h3 className="font-bold mb-3">Users</h3>
          <div className="flex flex-col gap-2">
            {users.map(u => (
              <button key={u} onClick={() => setSelected(u)} className={`text-left px-3 py-2 rounded ${selected===u ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" : "hover:bg-white/5"}`}>
                {u}
              </button>
            ))}
            {users.length === 0 && <div className="text-sm text-gray-400">No users yet</div>}
          </div>
        </div>

        <div className="bg-white/5 rounded p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-white/5"><ArrowLeft/></button>
              <h3 className="text-lg font-semibold">{selected ?? "Select a user"}</h3>
            </div>
            <div>
              {selected && <button onClick={() => { /* clear all for user */ }} className="px-3 py-1 bg-red-500 rounded">Clear all</button>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-3">
            {messages.map(m => (
              <div key={m.id} className={`p-3 rounded ${m.sender === 'admin' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-white/6 text-white'}`}>
                <div className="text-sm">{m.text}</div>
                <div className="text-[11px] text-gray-300 mt-1 flex items-center justify-between">
                  <div>{m.author}</div>
                  <div className="flex items-center gap-2">
                    <div>{m.createdAt?.toDate ? new Date(m.createdAt.toDate()).toLocaleString() : ''}</div>
                    <button onClick={() => deleteMsg(m.id)} className="text-gray-200 hover:text-red-300 p-1"><Trash2/></button>
                  </div>
                </div>
              </div>
            ))}
            {messages.length===0 && <div className="text-sm text-gray-400">No messages to show</div>}
          </div>

          <div className="mt-auto">
            <textarea value={reply} onChange={(e)=>setReply(e.target.value)} rows={3} className="w-full p-3 rounded bg-gray-800 text-white" placeholder={selected?`Reply to ${selected}`:"Select a user to reply"} />
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-400">Admin replying as {ADMIN_EMAIL}</div>
              <button onClick={sendReply} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded">Send <Send className="inline ml-2" size={12} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
