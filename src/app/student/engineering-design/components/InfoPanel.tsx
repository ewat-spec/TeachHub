"use client";

import React, { useRef, useEffect } from 'react';
import {
    FileCodeIcon, MessageSquareIcon, HistoryIcon, SendIcon, LoaderIcon, SlidersIcon
} from './icons';
import { DesignSpec, ArchitecturalSpec, AutonomousVehicleSpec, BasicGeometrySpec } from '../types';
import { PersonalizationPanel } from './PersonalizationPanel';

interface Comment {
    text: string;
    timestamp: string;
}

interface DesignVersion {
    name: string;
    timestamp: string;
    spec: DesignSpec | ArchitecturalSpec | AutonomousVehicleSpec | BasicGeometrySpec;
}

interface InfoPanelProps {
    activeTab: 'spec' | 'chat' | 'history' | 'comments' | 'personalize';
    setActiveTab: (tab: 'spec' | 'chat' | 'history' | 'comments' | 'personalize') => void;
    designSpec: any;
    // Chat Props
    chatHistory: { role: 'user' | 'model', text: string }[];
    chatInput: string;
    setChatInput: (val: string) => void;
    isChatLoading: boolean;
    handleChatSubmit: () => void;
    // History Props
    designHistory: DesignVersion[];
    loadVersion: (version: DesignVersion) => void;
    // Comments Props
    comments: Comment[];
    newComment: string;
    setNewComment: (val: string) => void;
    handleAddComment: () => void;
    // Personalization Props
    handleApplyPersonalization: (style: string, material: string, color: string) => void;
    handleAiInsight: (type: string) => void;
}

const RightPanelTabButton = ({ tabId, icon: Icon, label, activeTab, setActiveTab }: { tabId: 'spec' | 'chat' | 'history' | 'comments' | 'personalize', icon: React.ElementType, label: string, activeTab: string, setActiveTab: (t: any) => void }) => (
    <button
        onClick={() => setActiveTab(tabId)}
        className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-medium transition-colors ${activeTab === tabId ? 'bg-slate-800/50 text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}
        title={label}
    >
        <Icon className="w-5 h-5" />
        <span className="hidden xl:inline">{label}</span>
    </button>
);

export const InfoPanel: React.FC<InfoPanelProps> = ({
    activeTab, setActiveTab, designSpec,
    chatHistory, chatInput, setChatInput, isChatLoading, handleChatSubmit,
    designHistory, loadVersion,
    comments, newComment, setNewComment, handleAddComment,
    handleApplyPersonalization, handleAiInsight
}) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

     // Effect to scroll chat to bottom
     useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory, isChatLoading, activeTab]);

    return (
        <div className="lg:col-span-3 bg-slate-800/50 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
            <div className="flex border-b border-slate-800 shrink-0 overflow-x-auto">
                <RightPanelTabButton tabId="spec" icon={FileCodeIcon} label="Spec" activeTab={activeTab} setActiveTab={setActiveTab} />
                <RightPanelTabButton tabId="chat" icon={MessageSquareIcon} label="Chat" activeTab={activeTab} setActiveTab={setActiveTab} />
                <RightPanelTabButton tabId="personalize" icon={SlidersIcon} label="Tools" activeTab={activeTab} setActiveTab={setActiveTab} />
                <RightPanelTabButton tabId="history" icon={HistoryIcon} label="History" activeTab={activeTab} setActiveTab={setActiveTab} />
                <RightPanelTabButton tabId="comments" icon={MessageSquareIcon} label="Discuss" activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar">
              {activeTab === 'spec' && (
                 <div className="p-4">
                    {designSpec ? <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words">{JSON.stringify(designSpec, null, 2)}</pre> : <p className="text-slate-500 text-sm">Design specification will appear here.</p>}
                 </div>
              )}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                   <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                        {chatHistory.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs md:max-w-sm lg:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-sky-800 text-white' : 'bg-slate-700'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="flex justify-start">
                                <div className="p-3 rounded-lg bg-slate-700">
                                    <LoaderIcon className="w-5 h-5 animate-spin"/>
                                </div>
                            </div>
                        )}
                   </div>
                   <div className="p-4 border-t border-slate-700">
                        <div className="flex items-center gap-2">
                            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleChatSubmit()} placeholder={designSpec ? "Refine the spec..." : "Generate a design first"} disabled={!designSpec || isChatLoading} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                            <button onClick={handleChatSubmit} disabled={!chatInput.trim() || isChatLoading} className="p-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 rounded-md text-white"><SendIcon className="w-5 h-5"/></button>
                        </div>
                   </div>
                </div>
              )}
              {activeTab === 'personalize' && (
                  <PersonalizationPanel
                    onApply={handleApplyPersonalization}
                    onAiInsight={handleAiInsight}
                    isProcessing={isChatLoading}
                  />
              )}
              {activeTab === 'history' && (
                <div className="p-4 space-y-2">
                    {designHistory.length > 0 ? designHistory.slice().reverse().map((version, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-slate-900/50 rounded-md">
                            <div>
                                <p className="text-sm font-medium">{version.name}</p>
                                <p className="text-xs text-slate-400">{new Date(version.timestamp).toLocaleString()}</p>
                            </div>
                            <button onClick={() => loadVersion(version)} className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded">Load</button>
                        </div>
                    )) : <p className="text-slate-500 text-sm">No version history yet.</p>}
                </div>
              )}
               {activeTab === 'comments' && (
                <div className="flex flex-col h-full">
                   <div className="flex-grow p-4 space-y-3 overflow-y-auto">
                       {comments.length > 0 ? comments.map((comment, index) => (
                           <div key={index} className="p-2 bg-slate-700/50 rounded-md">
                               <p className="text-sm">{comment.text}</p>
                               <p className="text-xs text-slate-500 text-right mt-1">{new Date(comment.timestamp).toLocaleString()}</p>
                           </div>
                       )) : <p className="text-slate-500 text-sm">No comments yet.</p>}
                   </div>
                   <div className="p-4 border-t border-slate-700">
                       <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="w-full text-sm bg-slate-900 border border-slate-600 rounded-md p-2 h-20 outline-none focus:ring-1 focus:ring-sky-500"></textarea>
                       <button onClick={handleAddComment} className="mt-2 w-full py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-sm">Add Comment</button>
                   </div>
                </div>
               )}
            </div>
        </div>
    );
};
