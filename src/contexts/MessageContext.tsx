// src/contexts/MessageContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify'; 
import { useNavigate } from 'react-router-dom';

// --- Types ---
export interface AttachedFile { /* ... */ }

export interface Reaction { // Plus utilisé directement dans l'interface Message, mais bon à garder pour référence
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isRead?: boolean;
  isDeleted?: boolean;
  replyToMessageId?: string;
  quotedMessageText?: string;
  quotedMessageSenderName?: string;
  attachment?: AttachedFile; 
  reactions?: { // Les réactions sont un objet où la clé est l'emoji et la valeur est un tableau d'ID utilisateur
    [emoji: string]: string[]; 
  };
}

export interface MessageContextType {
  messages: Message[];
  sendMessage: (text: string, replyToMessageId?: string, file?: File) => Promise<void>; 
  deleteMessage: (messageId: string) => Promise<void>;
  markMessagesAsRead: (messageIds?: string[]) => Promise<void>;
  unreadMessagesCount: number;
  getMessagesForDisplay: () => Message[];
  toggleReaction: (messageId: string, emoji: string) => Promise<void>; // AJOUTÉ
}
// --- Fin Types ---

const MessageContext = createContext<MessageContextType | undefined>(undefined);

const MESSAGES_STORAGE_KEY = 'dsefs_messages_db';
const LAST_READ_TIMESTAMP_KEY_PREFIX = 'dsefs_last_read_ts_';

const readFileAsDataURLAsync = (file: File): Promise<string> => { /* ... */ return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = error => reject(error); reader.readAsDataURL(file); }); };

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const { currentUser } = useAuth();
  const prevUnreadCountRef = useRef<number>(0);
  const navigate = useNavigate();

  useEffect(() => { /* ... chargement initial et listener storage ... */ 
    const loadMessages = () => { const storedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY); if (storedMessages) { try { const parsedMessages = JSON.parse(storedMessages) as Message[]; setMessages(parsedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())); } catch (e) { console.error("Erreur chargement messages depuis localStorage:", e); localStorage.removeItem(MESSAGES_STORAGE_KEY); } } }; loadMessages();
    const handleStorageChange = (event: StorageEvent) => { if (event.key === MESSAGES_STORAGE_KEY && event.newValue) { console.log("MessageContext: Storage event détecté"); try { const parsedMessages = JSON.parse(event.newValue) as Message[]; setMessages(parsedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())); } catch (e) { console.error("Erreur traitement event storage:", e); } } };
    window.addEventListener('storage', handleStorageChange); return () => { window.removeEventListener('storage', handleStorageChange); };
  }, []);

  useEffect(() => { /* ... logique unread count et toast ... */ 
    if (!currentUser) { setUnreadMessagesCount(0); prevUnreadCountRef.current = 0; return; }
    const lastReadTsKey = `${LAST_READ_TIMESTAMP_KEY_PREFIX}${currentUser.id}`; const lastReadTs = localStorage.getItem(lastReadTsKey) || new Date(0).toISOString();
    const newUnread = messages.filter(m => !m.isDeleted && m.senderId !== currentUser.id && new Date(m.timestamp) > new Date(lastReadTs)); const newCnt = newUnread.length; setUnreadMessagesCount(newCnt);
    if (newCnt > 0 && newCnt > prevUnreadCountRef.current) { if (typeof window !== 'undefined' && window.location.pathname !== '/discussion') { const latestUnread = newUnread.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]; if(latestUnread) { const tc = (<div onClick={() => navigate('/discussion')} className="cursor-pointer"><strong className="block text-base">Nouveau de {latestUnread.senderName}</strong><p className="text-sm truncate mt-1">{latestUnread.text||(latestUnread.attachment?`PJ: ${latestUnread.attachment.name}`:"PJ")}</p></div>); toast.success(tc, {pauseOnHover:true,closeOnClick:true,toastId:`new-msg-${latestUnread.id}`});}}} prevUnreadCountRef.current = newCnt;
  }, [messages, currentUser, navigate]);

  useEffect(() => { /* ... sauvegarde localStorage ... */ if (messages.length > 0 || localStorage.getItem(MESSAGES_STORAGE_KEY)) { localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages)); }}, [messages]);

  const getMessagesForDisplay = useCallback(() => messages.filter(msg => !msg.isDeleted).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), [messages]);
  const sendMessage = async (text: string, replyToMessageId?: string, file?: File) => { /* ... inchangé ... */ 
    if (!currentUser || (!text.trim() && !file)) return; let attachmentData: AttachedFile | undefined = undefined; if (file) { if (file.size > 5 * 1024 * 1024) { toast.error("Fichier > 5MB."); return; } try { const dataUrl = await readFileAsDataURLAsync(file); attachmentData = { name: file.name, type: file.type, size: file.size, dataUrl: dataUrl }; } catch (error) { console.error("Erreur PJ:", error); toast.error("Erreur prépa PJ."); return; } } const quotedMessage = replyToMessageId ? messages.find(m => m.id === replyToMessageId && !m.isDeleted) : undefined; const newMessage: Message = { id: uuidv4(), text: text.trim(), senderId: currentUser.id, senderName: `${currentUser.prenom} ${currentUser.nom}`.trim() || "Anonyme", timestamp: new Date().toISOString(), isRead: false, replyToMessageId: quotedMessage?.id, quotedMessageText: quotedMessage?.text, quotedMessageSenderName: quotedMessage?.senderName, attachment: attachmentData, }; setMessages(prev => [...prev, newMessage].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  };
  const deleteMessage = async (messageId: string) => { /* ... inchangé ... */ 
    if (!currentUser) return; setMessages(prev => prev.map(msg => { if (msg.id === messageId && (currentUser.role === 'admin' || msg.senderId === currentUser.id)) { return { ...msg, isDeleted: true, text: msg.isDeleted ? msg.text : "Message supprimé." }; } return msg; }));
  };
  const markMessagesAsRead = async (messageIds?: string[]) => { /* ... inchangé ... */ 
    if (!currentUser) return; const lastReadTsKey = `${LAST_READ_TIMESTAMP_KEY_PREFIX}${currentUser.id}`; localStorage.setItem(lastReadTsKey, new Date().toISOString()); const currentLastReadTs = localStorage.getItem(lastReadTsKey) || new Date(0).toISOString(); const count = messages.filter(m => !m.isDeleted && m.senderId !== currentUser.id && new Date(m.timestamp) > new Date(currentLastReadTs)).length; setUnreadMessagesCount(count); 
  };

  // NOUVELLE FONCTION toggleReaction
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;

    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId) {
          const currentReactions = msg.reactions || {}; // S'assurer que c'est un objet
          const newReactionsForEmoji = [...(currentReactions[emoji] || [])]; // Copie des users pour cet emoji
          
          const userIndex = newReactionsForEmoji.indexOf(currentUser.id);

          if (userIndex > -1) { // L'utilisateur a déjà réagi, on retire
            newReactionsForEmoji.splice(userIndex, 1);
          } else { // L'utilisateur n'a pas réagi, on ajoute
            newReactionsForEmoji.push(currentUser.id);
          }

          const updatedReactionsOverall = { ...currentReactions };
          if (newReactionsForEmoji.length > 0) {
            updatedReactionsOverall[emoji] = newReactionsForEmoji;
          } else {
            delete updatedReactionsOverall[emoji]; // Nettoyer si plus personne pour cet emoji
          }
          
          // Si l'objet global des réactions est vide, le mettre à undefined
          const finalReactions = Object.keys(updatedReactionsOverall).length > 0 ? updatedReactionsOverall : undefined;
          return { ...msg, reactions: finalReactions };
        }
        return msg;
      })
    );
  };

  const contextValue: MessageContextType = {
    messages, sendMessage, deleteMessage, markMessagesAsRead, unreadMessagesCount, getMessagesForDisplay,
    toggleReaction, // AJOUTÉ AU CONTEXTE
  };

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = (): MessageContextType => { /* ... inchangé ... */ const context = useContext(MessageContext); if (context === undefined) { throw new Error('useMessages with_in MessageProvider'); } return context; };