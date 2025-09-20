"use client";

/*
  ChatWidget.tsx
  - Full-featured real-time chat widget
  - Shows admin console inside the widget when admin@gmail.com logs in
  - Suggested replies, unread badge, left-side close button, typing indicators,
    presence online/offline, delete & clear, animations, mobile-friendly
  - Uses Firestore collections:
      messages (docs: { text, sender: 'user'|'admin', userEmail, author, createdAt })
      typing   (docs keyed by email { typing: boolean, updatedAt })
      presence (docs keyed by email { online: boolean, lastSeen })
  - Requires `auth` and `db` exports from src/firebaseConfig.ts
*/

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  CheckCircle,
  Loader2,
  User as UserIcon,
  Circle,
} from "lucide-react";
import { auth, db } from "@/firebaseConfig";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
  where,
  getDocs,
} from "firebase/firestore";

const ADMIN_EMAIL = "olivegray022@gmail.com"; // change to your admin email
const SUGGESTED = [
  "Hi there 👋",
  "Can I get more info?",
  "Please provide your account ID.",
  "Thanks — I'm on it.",
];

type Msg = {
  id: string;
  text: string;
  sender: "user" | "admin";
  userEmail?: string;
  author?: string;
  createdAt?: any;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<Msg[]>([]);
  const [messageText, setMessageText] = useState("");
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null); // admin replies to this user
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newBadge, setNewBadge] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // --- Auth listener ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u?.email) {
        // set presence
        const pRef = doc(db, "presence", u.email);
        setDoc(pRef, { online: true, lastSeen: serverTimestamp() }, { merge: true }).catch(console.error);
      }
    });
    return () => unsub();
  }, []);

  // --- Real-time messages subscription ---
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const msgs: Msg[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setMessages(msgs);

        // build user list (unique userEmail)
        const users = Array.from(new Set(msgs.map((m) => m.userEmail).filter(Boolean)));
        setAllUsers(users);

        // compute unread if closed (only count messages not by current user)
        if (!isOpen && user?.email) {
          const added = snap.docChanges().filter((c) => c.type === "added").length;
          if (added > 0) {
            // count added messages not authored by current user
            let delta = 0;
            for (const c of snap.docChanges()) {
              if (c.type === "added") {
                const d = c.doc.data() as any;
                if (!user || d.author !== user.email) delta++;
              }
            }
            if (delta > 0) {
              setUnreadCount((n) => n + delta);
              setNewBadge(true);
            }
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error("messages onSnapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, isOpen]);

  // --- Typing subscription ---
  useEffect(() => {
    const q = query(collection(db, "typing"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const map: Record<string, boolean> = {};
        snap.docs.forEach((d) => (map[d.id] = !!(d.data() as any).typing));
        setTypingMap(map);
      },
      console.error
    );
    return () => unsub();
  }, []);

  // --- Presence subscription ---
  useEffect(() => {
    const q = query(collection(db, "presence"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const map: Record<string, boolean> = {};
        snap.docs.forEach((d) => (map[d.id] = !!(d.data() as any).online));
        setPresenceMap(map);
      },
      console.error
    );
    return () => unsub();
  }, []);

  // --- Visible messages derivation ---
  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      // admin sees messages for selectedUser (if set) or all
      if (selectedUser) setVisibleMessages(messages.filter((m) => m.userEmail === selectedUser));
      else setVisibleMessages(messages);
    } else if (user?.email) {
      setVisibleMessages(messages.filter((m) => m.userEmail === user.email));
    } else {
      // logged out: show no messages (or may show general)
      setVisibleMessages([]);
    }
    scrollToBottom();
  }, [messages, user, selectedUser]);

  // Scroll helper
  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 80);
  };

  // --- Mark typing ---
  const markTyping = async (email: string | undefined, typing: boolean) => {
    if (!email) return;
    try {
      await setDoc(doc(db, "typing", email), { typing, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error("markTyping error:", err);
    }
  };

  // --- Send message ---
  const sendMessage = async (payloadText?: string) => {
    if (sending) return;
    const text = (payloadText ?? messageText).trim();
    if (!text) return;
    if (!user && user?.email !== ADMIN_EMAIL) return alert("Please login to chat.");

    setSending(true);
    try {
      const isAdmin = user?.email === ADMIN_EMAIL;
      const docPayload: any = {
        text,
        sender: isAdmin ? "admin" : "user",
        author: user?.email || "guest",
        createdAt: serverTimestamp(),
      };
      if (isAdmin) {
        // admin must select a user to reply to
        if (!selectedUser) throw new Error("Select a user to reply to (Admin Console).");
        docPayload.userEmail = selectedUser;
      } else {
        docPayload.userEmail = user?.email;
      }

      await addDoc(collection(db, "messages"), docPayload);
      // clear typing doc for author
      await markTyping(user?.email || undefined, false);

      setMessageText("");
      setUnreadCount(0);
      setNewBadge(false);
      scrollToBottom();
    } catch (err: any) {
      console.error("sendMessage failed:", err);
      alert(err?.message || "Send failed.");
    } finally {
      setSending(false);
    }
  };

  // --- Delete ---
  const deleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, "messages", id));
    } catch (err) {
      console.error("deleteMessage:", err);
      alert("Delete failed (permissions).");
    }
  };

  // --- Clear all current user's messages (admin can clear for selected user) ---
  const clearAll = async (targetEmail?: string) => {
    const email = targetEmail ?? user?.email;
    if (!email) return;
    try {
      const q = query(collection(db, "messages"), where("userEmail", "==", email));
      const snap = await getDocs(q);
      const deletes = snap.docs.map((d) => deleteDoc(doc(db, "messages", d.id)));
      await Promise.all(deletes);
    } catch (err) {
      console.error("clearAll:", err);
      alert("Clear failed.");
    }
  };

  // --- UI helpers for admin selection next/prev ---
  const pickNextUser = (forward = true) => {
    if (!allUsers.length) return;
    const idx = selectedUser ? allUsers.indexOf(selectedUser) : -1;
    let newIdx;
    if (idx === -1) newIdx = 0;
    else if (forward) newIdx = (idx + 1) % allUsers.length;
    else newIdx = (idx - 1 + allUsers.length) % allUsers.length;
    setSelectedUser(allUsers[newIdx]);
  };

  // --- Open/close handlers ---
  const openWidget = () => {
    setIsOpen(true);
    setNewBadge(false);
    setUnreadCount(0);
  };
  const closeWidget = () => setIsOpen(false);

  // --- UI: quick sign-in with Google ---
  const googleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("googleSignIn:", err);
    }
  };

  // --- Effects: when admin logs in without selected user, auto-select first user ---
  useEffect(() => {
    if (user?.email === ADMIN_EMAIL && !selectedUser && allUsers.length) {
      setSelectedUser(allUsers[0]);
    }
  }, [user, allUsers]);

  // --- typing debounce from input ---
  useEffect(() => {
    if (!user?.email) return;
    const email = user.email;
    const handler = setTimeout(() => {
      markTyping(email, messageText.length > 0).catch(console.error);
    }, 300);
    return () => clearTimeout(handler);
  }, [messageText, user]);

  // --- Mark presence offline on unload (best-effort) ---
  useEffect(() => {
    const onUnload = async () => {
      try {
        if (user?.email) {
          await setDoc(doc(db, "presence", user.email), { online: false, lastSeen: serverTimestamp() }, { merge: true });
        }
      } catch (e) {
        // ignore
      }
    };
    typeof window !== "undefined" && window.addEventListener("beforeunload", onUnload);
    return () => typeof window !== "undefined" && window.removeEventListener("beforeunload", onUnload);
  }, [user]);

  // --- derived adminTypingActive for end-user view (if admin typing doc true) ---
  const adminTypingActive = !!typingMap[ADMIN_EMAIL] && user?.email !== ADMIN_EMAIL && !!user?.email;

  // --- keyboard send on Enter ---
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- helper small components inside file for clarity ---
  const OnlineDot = ({ email }: { email?: string }) => (
    <span className={`w-2 h-2 rounded-full ${email && presenceMap[email] ? "bg-green-400" : "bg-gray-500"} inline-block`} />
  );

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Collapsed button */}
      {!isOpen && (
        <motion.button
          onClick={openWidget}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl"
          title="Open chat"
        >
          <MessageCircle size={26} />
          {newBadge && (
            <div className="absolute -top-1 -right-1 bg-green-400 w-5 h-5 rounded-full flex items-center justify-center text-black text-xs font-bold shadow-md">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </motion.button>
      )}

      {/* Open panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="w-[94vw] sm:w-96 rounded-3xl p-3 bg-gray-900/95 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col"
            style={{ boxShadow: "0 8px 30px rgba(2,6,23,0.6), 0 0 40px rgba(99,102,241,0.08)" }}
          >
            {/* Header: left-close button, title center, actions right */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <button onClick={closeWidget} className="p-1 rounded-md hover:bg-white/5 text-gray-300">
                  {/* left close purposely */}
                  <X size={18} />
                </button>
                <div className="text-white text-base font-semibold">
                  {user?.email === ADMIN_EMAIL ? "Admin" : "Live Chat"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* admin quick controls */}
                {user?.email === ADMIN_EMAIL && (
                  <>
                    <button title="Prev user" onClick={() => pickNextUser(false)} className="text-sm px-2 py-1 bg-white/5 rounded-full">Prev</button>
                    <button title="Next user" onClick={() => pickNextUser(true)} className="text-sm px-2 py-1 bg-white/5 rounded-full">Next</button>
                  </>
                )}
                {/* clear */}
                {user && (
                  <button title="Clear my messages" onClick={() => (user.email === ADMIN_EMAIL ? clearAll(selectedUser ?? undefined) : clearAll())} className="p-1 rounded-md hover:bg-white/5 text-gray-300">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Admin user selector (horizontal chips) */}
            {user?.email === ADMIN_EMAIL && (
              <div className="mt-2 mb-2 flex gap-2 overflow-x-auto">
                {allUsers.length === 0 ? (
                  <div className="text-xs text-gray-400 px-2 py-1">No users yet</div>
                ) : (
                  allUsers.map((u) => {
                    const online = !!presenceMap[u];
                    const selected = u === selectedUser;
                    return (
                      <button key={u} onClick={() => setSelectedUser(u)} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${selected ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" : "bg-white/5 text-gray-200"}`}>
                        <UserIcon size={12} />
                        <span className="max-w-[100px] truncate">{u}</span>
                        <OnlineDot email={u} />
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Messages viewport */}
            <div className="flex-1 overflow-y-auto rounded-xl px-2 py-3 bg-gradient-to-b from-black/20 to-white/2 border border-white/5">
              {/* admin typing bubble for users */}
              {adminTypingActive && <div className="mb-2 flex items-center gap-2"><div className="bg-white/6 px-3 py-2 rounded-2xl animate-pulse"><div className="flex gap-1"><span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" /><span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "0.12s" }} /><span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "0.24s" }} /></div></div><div className="text-xs text-gray-300">Admin is typing...</div></div>}

              <div className="flex flex-col gap-3">
                {visibleMessages.length === 0 && <div className="text-sm text-gray-400 text-center py-6">No messages yet — say hi 👋</div>}
                {visibleMessages.map((m) => {
                  const fromAdmin = m.sender === "admin";
                  const mine = user?.email && m.author === user.email;
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`max-w-[84%] ${fromAdmin ? "self-start" : "self-end"}`}>
                      <div className={`p-3 rounded-2xl ${fromAdmin ? "bg-gradient-to-r from-purple-600/90 to-blue-600/90 text-white" : "bg-white/6 text-white"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm break-words">{m.text}</div>
                          <div className="text-[10px] text-gray-200/70 ml-2">{m.author?.split("@")[0]}</div>
                        </div>
                        <div className="text-[10px] text-gray-300/60 mt-1">{m.createdAt?.toDate ? new Date(m.createdAt.toDate()).toLocaleTimeString() : ""}</div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {(mine || user?.email === ADMIN_EMAIL) && <button onClick={() => deleteMessage(m.id)} className="text-gray-400 hover:text-red-400 text-xs p-1"><Trash2 size={14} /></button>}
                        {user?.email === ADMIN_EMAIL && !fromAdmin && <button onClick={() => { setSelectedUser(m.userEmail || null); setMessageText(`@${(m.userEmail||"").split("@")[0]} `); }} className="text-xs text-green-300 hover:underline p-1">Reply</button>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator row */}
            <div className="mt-2 min-h-[22px]">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                {user?.email === ADMIN_EMAIL ? (
                  <>{selectedUser ? (typingMap[selectedUser] ? <div className="text-green-300"><Loader2 className="animate-spin inline" size={12} /> {selectedUser} is typing...</div> : <div className="text-gray-400">No typing</div>) : <div className="text-gray-400">Select a user</div>}</>
                ) : (
                  typingMap[ADMIN_EMAIL] ? <div className="text-green-300"><Loader2 className="animate-spin inline" size={12} /> Admin is typing...</div> : null
                )}
              </div>
            </div>

            {/* suggested replies for non-admin */}
            {user?.email !== ADMIN_EMAIL && (
              <div className="flex flex-wrap gap-2 mt-2">
                {SUGGESTED.map((s) => <button key={s} onClick={() => sendMessage(s)} className="px-3 py-1 rounded-full text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-105 transform transition">{s}</button>)}
              </div>
            )}

            {/* Input area */}
            <div className="mt-3 flex items-center gap-2">
              {!user ? (
                <div className="flex-1">
                  <div className="flex gap-2">
                    <Link href="/login" className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center">Login</Link>
                    <Link href="/signup" className="px-3 py-2 rounded-lg bg-white/5 text-white">Sign Up</Link>
                    <button onClick={googleSignIn} className="px-2 py-2 rounded-lg bg-white/6 text-white">G</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 relative">
                    <input value={messageText} onChange={(e) => { setMessageText(e.target.value); markTyping(user.email!, e.target.value.length > 0).catch(console.error); }} onKeyDown={onKeyDown} placeholder={user?.email === ADMIN_EMAIL ? (selectedUser ? `Replying to ${selectedUser}` : "Pick a user to reply to") : "Type your message..."} className="w-full px-3 py-2 rounded-lg bg-gray-800/70 border border-white/5 text-white placeholder-gray-400 focus:outline-none" />
                  </div>
                  <button onClick={() => sendMessage()} disabled={sending || (user?.email === ADMIN_EMAIL && !selectedUser)} className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-2 text-white hover:opacity-90">
                    {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
