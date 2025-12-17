"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader,
  Maximize2,
  MessageSquare,
  Minimize2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { sendMessageToAI } from "../../../actions/chat";
import { useAuth } from "../../../hooks/useAuth";
import { useChatRealtime } from "../../../hooks/useChatRealtime";
import { createClient } from "../../../lib/supabase/client";
import { Message } from "../../../type/index.chat";

const suggestedPrompts = [
  "Show me bills due this week",
  "What tasks are pending?",
  "Remind me about expiring documents",
  "Create a new task",
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Load conversation ID from localStorage on mount and verify it exists
  useEffect(() => {
    const verifyAndLoadConversation = async () => {
      const savedConversationId = localStorage.getItem("chat_conversation_id");
      if (!savedConversationId) return;

      // Verify the conversation exists in the database
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ai_conversations")
        .select("id")
        .eq("id", savedConversationId)
        .single();

      if (error || !data) {
        // Conversation doesn't exist, clear localStorage
        console.log("⚠️ Conversation not found, clearing localStorage");
        localStorage.removeItem("chat_conversation_id");
        return;
      }

      console.log("📂 Restoring conversation:", savedConversationId);
      setConversationId(savedConversationId);
    };

    verifyAndLoadConversation();
  }, []);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Auto-scroll when messages change or typing status changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Also scroll when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, isMinimized]);

  // Fetch messages when conversation ID changes
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to fetch messages:", error);
        toast.error("Failed to load conversation");
      } else {
        console.log("📬 Loaded messages:", data?.length);
        setMessages(data || []);
      }

      setIsLoadingMessages(false);
    };

    fetchMessages();
  }, [conversationId]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    setIsTyping(true);

    try {
      const res = await sendMessageToAI({
        conversationId,
        message: userMessage,
      });

      if (!res.success) {
        console.error(res.message);
        // If foreign key constraint error, clear invalid conversation ID
        if (
          res.message?.includes("foreign key constraint") ||
          res.message?.includes("conversation_id_fkey")
        ) {
          toast.error("⚠️ Invalid conversation ID, clearing and retrying");
          localStorage.removeItem("chat_conversation_id");
          setConversationId(null);
          setMessages([]);
          toast.error("Starting new conversation");
        } else {
          toast.error("Failed to send message");
        }
        setInput(userMessage);
      } else {
        // Set conversation ID on first message
        if (!conversationId && res.conversationId) {
          setConversationId(res.conversationId);
        }
      }
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Failed to send message");
      setInput(userMessage);
    } finally {
      setIsTyping(false);
    }
  };

  // Save conversation ID to localStorage whenever it changes
  useEffect(() => {
    if (conversationId) {
      console.log("💾 Saving conversation ID:", conversationId);
      localStorage.setItem("chat_conversation_id", conversationId);
    }
  }, [conversationId]);

  useChatRealtime(conversationId, setMessages);

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  // Clear conversation and start fresh
  const handleNewConversation = () => {
    localStorage.removeItem("chat_conversation_id");
    setConversationId(null);
    setMessages([]);
    toast.success("Started new conversation");
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="lg"
              onClick={() => setIsOpen(true)}
              className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-500 via-purple-600 to-violet-600 shadow-2xl hover:shadow-pink-500/50 transition-all hover:scale-110 relative group"
            >
              <MessageSquare className="h-7 w-7 text-white" />
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-75 group-hover:opacity-0" />
              {messages.length > 0 && (
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white">
                  {messages.length}
                </div>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Card
              className={`flex flex-col overflow-hidden border-2 border-primary/20 shadow-2xl backdrop-blur-sm bg-background/95 transition-all ${
                isMinimized ? "h-16 w-96" : "h-[650px] w-[420px]"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-pink-500/10 via-purple-600/10 to-violet-600/10 p-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-purple-600 to-violet-600 shadow-lg">
                    <Sparkles className="h-6 w-6 text-white animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">AI Copilot</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-xs text-muted-foreground">
                        Always here to help
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {messages.length > 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleNewConversation}
                      className="h-8 w-8 hover:bg-white/10"
                      title="New conversation"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-8 w-8 hover:bg-white/10"
                  >
                    {isMinimized ? (
                      <Maximize2 className="h-4 w-4" />
                    ) : (
                      <Minimize2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Content */}
              {!isMinimized && (
                <>
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                      {isLoadingMessages ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-pink-500/20 via-purple-600/20 to-violet-600/20 flex items-center justify-center mb-4">
                            <Sparkles className="h-10 w-10 text-primary" />
                          </div>
                          <h3 className="font-semibold text-lg mb-2">
                            Welcome to AI Copilot!
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Ask me anything about your bills, tasks, or
                            documents.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message, index) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`flex gap-3 ${
                                message.role === "user"
                                  ? "flex-row-reverse"
                                  : "flex-row"
                              }`}
                            >
                              <Avatar className="h-9 w-9 border-2 border-background shadow-md flex-shrink-0">
                                {message.role === "assistant" ? (
                                  <AvatarFallback className="bg-gradient-to-br from-pink-500 via-purple-600 to-violet-600 text-white">
                                    <Sparkles className="h-5 w-5" />
                                  </AvatarFallback>
                                ) : (
                                  <>
                                    <AvatarImage
                                      src={user?.user_metadata?.avatar_url}
                                    />
                                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                      {user?.user_metadata?.first_name?.[0]?.toUpperCase() ||
                                        user?.email?.[0]?.toUpperCase() ||
                                        "U"}
                                    </AvatarFallback>
                                  </>
                                )}
                              </Avatar>
                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                  message.role === "user"
                                    ? "bg-gradient-to-br from-pink-500 via-purple-600 to-violet-600 text-white"
                                    : "bg-muted text-foreground border border-border"
                                }`}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                                <p
                                  className={`mt-1.5 text-xs ${
                                    message.role === "user"
                                      ? "text-white/70"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {formatTime(message.created_at)}
                                </p>
                              </div>
                            </motion.div>
                          ))}

                          {isTyping && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex gap-3"
                            >
                              <Avatar className="h-9 w-9 border-2 border-background shadow-md flex-shrink-0">
                                <AvatarFallback className="bg-gradient-to-br from-pink-500 via-purple-600 to-violet-600 text-white">
                                  <Sparkles className="h-5 w-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="rounded-2xl bg-muted px-4 py-3 border border-border">
                                <div className="flex flex-col gap-2">
                                  <div className="flex gap-1.5">
                                    <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-foreground/50" />
                                    <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-foreground/50 [animation-delay:0.2s]" />
                                    <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-foreground/50 [animation-delay:0.4s]" />
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Analyzing your data...
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>
                  </div>

                  {messages.length === 0 && !isLoadingMessages && (
                    <div className="border-t border-border p-4 bg-muted/30 flex-shrink-0">
                      <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Try asking:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedPrompts.map((prompt) => (
                          <Button
                            key={prompt}
                            size="sm"
                            variant="outline"
                            onClick={() => handlePromptClick(prompt)}
                            className="h-auto py-2 px-3 text-xs hover:bg-primary/10 hover:border-primary/50 transition-all"
                          >
                            {prompt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border p-4 bg-background flex-shrink-0">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        disabled={isTyping}
                        className="flex-1 bg-muted/50 border-border focus:border-primary transition-all"
                        autoFocus
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isTyping}
                        className="bg-gradient-to-br from-pink-500 via-purple-600 to-violet-600 hover:shadow-lg transition-all flex-shrink-0"
                      >
                        {isTyping ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
