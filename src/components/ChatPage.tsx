// src/components/ChatPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMessages, Message } from '../contexts/MessageContext'; // Removed AttachedFile as it's not directly used, but Message type imports it from MessageContext
import { 
  Send, Trash2, CornerDownRight, AlertTriangle, Paperclip, Smile, Settings, TreePine, 
  XCircle as CloseIcon, Download, FileText as FileIconType, Image as ImageIcon, Leaf,
  SmilePlus // Icon for adding reaction
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import EmojiPicker, { EmojiClickData, Theme as EmojiTheme } from 'emoji-picker-react';
import { toast } from 'react-toastify';

const getFileIcon = (fileType: string): JSX.Element => {
  if (fileType.startsWith('image/')) return <ImageIcon size={20} className="text-purple-500" />;
  if (fileType === 'application/pdf') return <FileIconType size={20} className="text-red-500" />;
  return <Paperclip size={20} className="text-gray-500" />;
};

const ChatPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { sendMessage, deleteMessage, getMessagesForDisplay, toggleReaction } = useMessages();
  
  const [newMessageText, setNewMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // For main textarea emoji
  const emojiPickerRef = useRef<HTMLDivElement>(null); // For main textarea emoji picker

  const [showReactionPickerFor, setShowReactionPickerFor] = useState<string | null>(null); // Message ID for reaction picker
  const reactionPickerRef = useRef<HTMLDivElement>(null); // For reaction emoji picker

  const displayedMessages = getMessagesForDisplay();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [displayedMessages]);

  useEffect(() => { // Main textarea emoji picker click outside handler
    function handleClickOutside(event: MouseEvent) { if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) { setShowEmojiPicker(false); } }
    document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [emojiPickerRef]);

  useEffect(() => { // Reaction emoji picker click outside handler
    function handleClickOutside(event: MouseEvent) {
      const targetElement = event.target as Element;
      // Check if the click is outside the reaction picker AND not on a reaction button itself
      if (reactionPickerRef.current && 
          !reactionPickerRef.current.contains(targetElement) && 
          !targetElement.closest('[data-reaction-button="true"]')) {
        setShowReactionPickerFor(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [reactionPickerRef]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Fichier trop volumineux (max 5MB).");
        setSelectedFile(null); setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => { setFilePreview(reader.result as string); };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null); 
      }
    } else {
      setSelectedFile(null); setFilePreview(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessageText.trim() && !selectedFile) || !currentUser) return;
    await sendMessage(newMessageText, replyingTo?.id, selectedFile || undefined);
    setNewMessageText(''); setReplyingTo(null); setSelectedFile(null); setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowEmojiPicker(false); inputRef.current?.focus();
  };

  const handleDeleteMessage = async (messageId: string) => { 
      if (window.confirm("Voulez-vous vraiment supprimer ce message ?")) {
        await deleteMessage(messageId); 
      }
  };
  const handleSetReply = (message: Message) => { 
    setReplyingTo(message); setShowEmojiPicker(false); inputRef.current?.focus(); 
  };

  const onEmojiClickForTextarea = (emojiData: EmojiClickData) => { setNewMessageText(prev => prev + emojiData.emoji); inputRef.current?.focus(); };

  const isAdmin = currentUser?.role === 'admin';
  if (!currentUser) { return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-180px)] text-gray-500">
        <AlertTriangle size={48} className="mb-4 text-red-500" />
        <p>Vous devez être connecté pour accéder à la discussion.</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-5xl mx-auto bg-white shadow-2xl rounded-lg border border-gray-200 my-3">
      <div className="flex items-center justify-between p-3 border-b border-green-300 bg-green-100 rounded-t-lg">
        <div className="flex items-center">
            <TreePine className="h-7 w-7 text-green-700 mr-2.5" /> 
            <h2 className="text-lg font-semibold text-green-800">Discussion Générale DEFCCS</h2>
        </div>
        <button title="Paramètres (non implémenté)" className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-green-200 transition-colors">
            <Settings size={18} />
        </button>
      </div>

      <div className="relative flex-grow p-3 space-y-3 overflow-y-auto bg-lime-50 custom-scrollbar">
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
            <TreePine size={250} className="text-green-200/30 opacity-30" />
        </div>
        
        <div className="relative z-10"> 
            {displayedMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-90 pt-10">
                <TreePine size={40} className="mb-3 text-green-400" />
                <p className="text-base font-medium">Aucun message pour le moment.</p>
                <p className="text-sm">Soyez le premier à engager la discussion !</p>
              </div>
            )}
            {displayedMessages.map(msg => {
              const isCurrentUserSender = msg.senderId === currentUser.id;
              const canDelete = isAdmin || (isCurrentUserSender && !msg.isDeleted);

              return (
                <div key={msg.id} className={`flex group ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] sm:max-w-[65%] p-2.5 rounded-xl shadow ${isCurrentUserSender ? 'bg-green-700 text-green-50 rounded-br-lg' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-lg'}`}>
                    {/* Message Sender and Actions */}
                    <div className="flex items-baseline justify-between mb-0.5">
                        <span className={`text-xs font-bold ${isCurrentUserSender ? 'text-green-200' : 'text-green-600'}`}>{msg.senderName}</span> 
                        <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ml-2">
                            {!msg.isDeleted && (<button onClick={() => handleSetReply(msg)} title="Répondre" className={`p-0.5 rounded-full ${isCurrentUserSender ? 'text-green-200 hover:text-white hover:bg-green-800' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-100'}`}> <CornerDownRight size={12} /> </button>)}
                            {canDelete && (<button onClick={() => handleDeleteMessage(msg.id)} title={msg.isDeleted ? "Message déjà supprimé" : "Supprimer le message"} disabled={msg.isDeleted} className={`p-0.5 rounded-full ${msg.isDeleted ? 'text-gray-400 cursor-not-allowed' : (isCurrentUserSender ? 'text-green-200 hover:text-white hover:bg-green-800' : 'text-gray-400 hover:text-red-600 hover:bg-red-100')}`}> {msg.isDeleted ? <AlertTriangle size={12}/> : <Trash2 size={12} />} </button>)}
                        </div> 
                    </div>

                    {/* Quoted Message */}
                    {msg.replyToMessageId && msg.quotedMessageText && !msg.isDeleted && (
                        <div className={`p-1.5 mb-1 rounded-md text-xs border-l-2 ${isCurrentUserSender ? 'bg-green-800 border-green-500' : 'bg-slate-100 border-slate-300'}`}>
                            <p className={`font-medium text-[0.65rem] leading-tight mb-0.5 ${isCurrentUserSender ? 'text-green-100' : 'text-slate-600'}`}>Réponse à {msg.quotedMessageSenderName || 'un utilisateur'}:</p>
                            <p className={`italic truncate text-[0.7rem] ${isCurrentUserSender ? 'text-green-200/80' : 'text-slate-500'}`}>"{msg.quotedMessageText}"</p>
                        </div>
                    )}

                    {/* Attachment */}
                    {msg.attachment && !msg.isDeleted && (
                        <div className={`my-2 p-2 rounded-md border ${isCurrentUserSender ? 'bg-green-800/70 border-green-600' : 'bg-gray-100 border-gray-300'}`}>
                            {msg.attachment.type.startsWith('image/')?(<img src={msg.attachment.dataUrl} alt={msg.attachment.name} className="max-w-xs max-h-48 rounded object-contain mb-1 cursor-pointer"/>):(<div className="flex items-center p-2 bg-gray-200 rounded-md">{getFileIcon(msg.attachment.type)}<span className="ml-2 text-sm text-gray-700 truncate">{msg.attachment.name}</span></div>)}
                            <a href={msg.attachment.dataUrl} download={msg.attachment.name} className={`block mt-1.5 text-xs font-medium ${isCurrentUserSender ? 'text-green-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}><Download size={12} className="inline mr-1" />Télécharger ({(msg.attachment.size / 1024).toFixed(1)} Ko)</a>
                        </div>
                    )}

                    {/* Message Text */}
                    {(msg.text || (!msg.attachment && !msg.isDeleted)) && (<p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>)}
                    {msg.isDeleted && (<p className="text-sm italic whitespace-pre-wrap break-words text-gray-500">{msg.text}</p>)}

                    {/* Timestamp */}
                    <p className={`flex items-center justify-end text-[0.65rem] leading-tight mt-1 ${ isCurrentUserSender ? 'text-green-300' : 'text-gray-400'}`}>
                      <Leaf size={10} className={`mr-1 ${isCurrentUserSender ? 'text-green-400 opacity-70' : 'text-gray-300 opacity-70'}`} />
                      {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true, locale: fr })}
                    </p>

                    {/* Reactions Section */}
                    {!msg.isDeleted && (
                        <div className="mt-1.5 -mb-1 flex flex-wrap gap-1 items-center relative">
                        {msg.reactions && Object.entries(msg.reactions).map(([emoji, userIds]) => {
                            if (!userIds || userIds.length === 0) return null; 
                            const currentUserReacted = userIds.includes(currentUser.id);
                            return (
                            <button
                                key={emoji}
                                onClick={() => toggleReaction(msg.id, emoji)}
                                title={`Réagi par ${userIds.length}${currentUserReacted ? ' (dont vous)' : ''}`}
                                className={`px-1.5 py-0.5 text-xs rounded-full border transition-all duration-150 transform active:scale-90 ${
                                currentUserReacted
                                    ? (isCurrentUserSender ? 'bg-green-500 text-white border-green-400 hover:bg-green-400' : 'bg-blue-500 text-white border-blue-400 hover:bg-blue-400')
                                    : (isCurrentUserSender ? 'bg-green-800 text-green-300 border-green-600 hover:bg-green-600 hover:text-green-100' : 'bg-slate-100 text-gray-600 border-gray-300 hover:bg-slate-200')
                                }`}
                            >
                                {emoji} <span className="ml-0.5 text-[0.7rem] font-medium">{userIds.length}</span>
                            </button>
                            );
                        })}
                        <div className="relative">
                            <button
                            onClick={(e) => { e.stopPropagation(); setShowReactionPickerFor(showReactionPickerFor === msg.id ? null : msg.id);}}
                            title="Ajouter une réaction"
                            data-reaction-button="true" // Used in click-outside handler
                            className={`p-1 rounded-full transition-colors ${
                                isCurrentUserSender
                                ? 'text-green-300 hover:text-white hover:bg-green-600'
                                : 'text-gray-400 hover:text-gray-700 hover:bg-slate-200'
                            }`}
                            >
                            <SmilePlus size={14} />
                            </button>
                            {showReactionPickerFor === msg.id && (
                            <div 
                                ref={reactionPickerRef}
                                onClick={e => e.stopPropagation()}
                                className="absolute bottom-[calc(100%+4px)] mb-1 p-0.5 bg-white rounded-lg shadow-xl z-30 border border-gray-200 overflow-hidden"
                                style={isCurrentUserSender ? { right: 0 } : { left: 0 }} 
                            >
                                <EmojiPicker
                                onEmojiClick={(emojiData) => {
                                    toggleReaction(msg.id, emojiData.emoji);
                                    setShowReactionPickerFor(null);
                                }}
                                height={280} width={250} theme={EmojiTheme.LIGHT} searchDisabled
                                previewConfig={{ showPreview: false }} suggestedEmojisMode="recent" lazyLoadEmojis
                                />
                            </div>
                            )}
                        </div>
                        </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-green-300 bg-green-100 rounded-b-lg">
        {replyingTo && !replyingTo.isDeleted && ( <div className="mb-1.5 p-1.5 bg-green-200/70 border border-green-300 rounded-md text-xs text-green-800 flex justify-between items-center"> <div className="flex-grow min-w-0"> Répondre à <span className="font-semibold">{replyingTo.senderName}</span> : <em className="ml-1 truncate inline-block max-w-full">"{replyingTo.text}"</em> </div> <button onClick={() => setReplyingTo(null)} className="p-1 text-gray-500 hover:text-red-600 rounded-full flex-shrink-0 ml-1"> <CloseIcon size={14} /> </button> </div> )}
        {selectedFile && ( <div className="mb-2 p-2 border border-green-300 rounded-md bg-green-200/50 flex items-center justify-between"> <div className="flex items-center min-w-0"> {filePreview ? ( <img src={filePreview} alt="Prévisualisation" className="w-10 h-10 object-cover rounded mr-2"/> ) : ( getFileIcon(selectedFile.type) )} <span className="text-xs text-gray-700 truncate">{selectedFile.name}</span> </div> <button onClick={() => { setSelectedFile(null); setFilePreview(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="p-1 text-red-500 hover:text-red-700 rounded-full flex-shrink-0 ml-1"> <CloseIcon size={16}/> </button> </div>)}
        <form onSubmit={handleSendMessage} className="flex items-end space-x-1.5">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="chat-file-input" />
          <label htmlFor="chat-file-input" title="Joindre un fichier" className="p-2 text-gray-500 hover:text-green-700 rounded-full hover:bg-green-200 cursor-pointer transition-colors"> <Paperclip size={18}/> </label>
          <textarea
            ref={inputRef} value={newMessageText} onChange={(e) => setNewMessageText(e.target.value)}
            placeholder="Écrivez votre message ici..." rows={1} style={{ scrollbarWidth: 'thin' }}
            className="flex-grow p-2 border border-gray-300 rounded-lg resize-none focus:ring-1 focus:ring-green-600 focus:border-green-600 text-sm max-h-28 overflow-y-auto custom-scrollbar bg-white placeholder-gray-400"
            onFocus={() => {setShowEmojiPicker(false); setShowReactionPickerFor(null);}} // Close both pickers on focus
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
          />
          <div className="relative" ref={emojiPickerRef}>
            <button type="button" onClick={(e) => {e.stopPropagation(); setShowEmojiPicker(prev => !prev); setShowReactionPickerFor(null);}} title="Choisir un emoji pour le message" className="p-2 text-gray-500 hover:text-yellow-500 rounded-full hover:bg-yellow-100 transition-colors"> <Smile size={18}/> </button>
            {showEmojiPicker && (
              <div onClick={e => e.stopPropagation()} className="absolute bottom-full right-0 mb-2 z-20 border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                <EmojiPicker onEmojiClick={onEmojiClickForTextarea} theme={EmojiTheme.LIGHT} emojiVersion="5.0" searchDisabled previewConfig={{showPreview: false}} height={350} width={300}/>
              </div>
            )}
          </div>
          <button type="submit" disabled={(!newMessageText.trim() && !selectedFile)} title="Envoyer le message" className="p-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"> <Send size={18}/> </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;