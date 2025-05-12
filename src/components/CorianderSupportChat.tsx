"use client";

import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Send, Loader2, Leaf } from 'lucide-react'; // Added Leaf icon
import { corianderSupportChat, type CorianderSupportChatInput, type CorianderSupportChatOutput } from '@/ai/flows/coriander-support-chat-flow';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface CorianderSupportChatProps {
  trigger: ReactNode; // The element that will trigger the sheet
}

export default function CorianderSupportChat({ trigger }: CorianderSupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome-bot',
          sender: 'bot',
          text: "Hello! I'm Green Guardian, your dedicated AI assistant for all things Coriander. How can I help your plants flourish today?",
          timestamp: new Date(),
        }
      ]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
          if(scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
          }
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      sender: 'user',
      text: inputValue.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      const aiInput: CorianderSupportChatInput = { userQuery: currentInput };
      const aiOutput: CorianderSupportChatOutput = await corianderSupportChat(aiInput);

      const botMessage: Message = {
        id: `${Date.now()}-bot`,
        sender: 'bot',
        text: aiOutput.botResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        sender: 'bot',
        text: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-[90vw] max-w-md sm:max-w-lg flex flex-col p-0 shadow-xl">
        <SheetHeader className="p-4 border-b bg-muted/50">
          <SheetTitle className="flex items-center gap-2 text-lg text-primary">
            <Leaf className="h-6 w-6 text-primary" /> Green Guardian Support
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Ask any questions you have about growing coriander. I'm here to help!
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 p-4 space-y-0 bg-background" ref={scrollAreaRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={cn(
                "flex items-start gap-2.5 mb-4",
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
            )}>
              {msg.sender === 'bot' && (
                <Avatar className="h-8 w-8 flex-shrink-0 border border-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Leaf size={18} /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-lg px-3.5 py-2.5 text-sm shadow-md break-words",
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-secondary text-secondary-foreground rounded-bl-none'
                )}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <p className={cn(
                    "text-xs mt-1.5",
                     msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-secondary-foreground/70 text-left'
                )}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.sender === 'user' && (
                <Avatar className="h-8 w-8 flex-shrink-0 border">
                  <AvatarFallback className="bg-accent text-accent-foreground"><User size={18} /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start items-start gap-2.5 mb-4">
              <Avatar className="h-8 w-8 flex-shrink-0 border border-primary/20">
                 <AvatarFallback className="bg-primary text-primary-foreground"><Leaf size={18} /></AvatarFallback>
              </Avatar>
              <div className="bg-secondary text-secondary-foreground rounded-lg px-3.5 py-2.5 text-sm shadow-md rounded-bl-none">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </div>
          )}
        </ScrollArea>
        <SheetFooter className="p-3 border-t bg-muted/50">
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Ask Green Guardian..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-background focus-visible:ring-primary"
              autoComplete="off"
            />
            <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

