"use client"

import { useState } from "react";
import { ConversationList } from "./ConversationList";
import { ChatView } from "./ChatView";
import { type Conversation } from "./ConversationList";

export function MessagesScreen() {
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

    return (
        <div className="flex h-[calc(100vh-theme(height.14))] border-t">
            <ConversationList onSelectConversation={setSelectedConversation} selectedConversationId={selectedConversation?.id} />
            <ChatView conversation={selectedConversation} />
        </div>
    )
}

    