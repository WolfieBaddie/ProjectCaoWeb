import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal.tsx';

interface CommandItem {
    id: string;
    title: string;
    category: string;
    view: string;
    action?: string;
    description?: string;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: string, action?: string) => void;
}

// Global Registry of Pages and Functions
const COMMANDS: CommandItem[] = [
    // Dashboard
    { id: 'dash-home', title: 'Dashboard', category: 'Pages', view: 'dashboard', description: 'Overview and Statistics' },
    { id: 'dash-sched', title: 'Scheduler Settings', category: 'Dashboard', view: 'dashboard', action: 'scheduler', description: 'Manage crawler frequency' },
    
    // Contents
    { id: 'cont-list', title: 'Content Management', category: 'Pages', view: 'contents', description: 'View and manage articles' },
    
    // Categories
    { id: 'cat-list', title: 'Categories', category: 'Pages', view: 'categories', description: 'Manage article categories' },
    { id: 'cat-add', title: 'Add New Category', category: 'Categories', view: 'categories', action: 'add', description: 'Create a new category' },
    
    // Crawler Bots
    { id: 'bot-list', title: 'Crawler Bots', category: 'Pages', view: 'bots', description: 'Manage sources and bots' },
    { id: 'bot-add', title: 'Add New Source', category: 'Crawler Bots', view: 'bots', action: 'add', description: 'Configure a new crawler source' },
    { id: 'bot-manual', title: 'Manual Seed Tasks', category: 'Crawler Bots', view: 'bots', action: 'manual', description: 'Run specific category or listing crawls' },
    { id: 'bot-ip', title: 'IP Management', category: 'Crawler Bots', view: 'bots', action: 'ip', description: 'Manage fake IPs' },
    { id: 'bot-ua', title: 'User Agent Management', category: 'Crawler Bots', view: 'bots', action: 'ua', description: 'Manage User Agent strings' },
    
    // Logs
    { id: 'log-home', title: 'Crawler Logs', category: 'Pages', view: 'logs', description: 'View system logs' },
    
    // System
    { id: 'sys-team', title: 'Teams', category: 'Pages', view: 'teams', description: 'Manage team members' },
    { id: 'sys-bill', title: 'Billing', category: 'Pages', view: 'billing', description: 'Plans and subscription' },
];

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const filteredCommands = useMemo(() => {
        if (!searchTerm) {
            // Group by category for default view
            return COMMANDS; 
        }
        const lower = searchTerm.toLowerCase();
        return COMMANDS.filter(cmd => 
            cmd.title.toLowerCase().includes(lower) || 
            cmd.category.toLowerCase().includes(lower) ||
            cmd.description?.toLowerCase().includes(lower)
        );
    }, [searchTerm]);

    // Handle Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    handleSelect(filteredCommands[selectedIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex]);

    const handleSelect = (cmd: CommandItem) => {
        onNavigate(cmd.view, cmd.action);
        onClose();
    };

    // Grouping for display
    const groupedCommands = useMemo(() => {
        const groups: {[key: string]: CommandItem[]} = {};
        filteredCommands.forEach(cmd => {
            if (!groups[cmd.category]) groups[cmd.category] = [];
            groups[cmd.category].push(cmd);
        });
        return groups;
    }, [filteredCommands]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="flex flex-col h-[500px]">
                {/* Search Input */}
                <div className="border-b border-gray-200 pb-2 relative">
                     <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        className="w-full text-lg p-3 pl-10 focus:outline-none bg-transparent"
                        placeholder="Search pages, settings, actions..."
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setSelectedIndex(0);
                        }}
                        autoFocus
                    />
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto py-2 space-y-4">
                    {Object.entries(groupedCommands).map(([category, commands]) => (
                        <div key={category}>
                            <h3 className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                                {category}
                            </h3>
                            <ul className="mt-1">
                                {commands.map((cmd) => {
                                    // Find index in flattened list for highlighting
                                    const globalIndex = filteredCommands.indexOf(cmd);
                                    const isSelected = globalIndex === selectedIndex;

                                    return (
                                        <li key={cmd.id}>
                                            <button
                                                onClick={() => handleSelect(cmd)}
                                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                                                    isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                                        {cmd.title}
                                                    </span>
                                                    {cmd.description && (
                                                        <span className="text-xs text-gray-500">
                                                            {cmd.description}
                                                        </span>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}

                    {filteredCommands.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            No results found for "{searchTerm}"
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="border-t border-gray-100 pt-2 px-4 text-xs text-gray-400 flex justify-between items-center">
                    <span>Use arrow keys to navigate</span>
                    <span>Enter to select</span>
                </div>
            </div>
        </Modal>
    );
};

export default CommandPalette;