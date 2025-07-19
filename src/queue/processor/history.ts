import * as vscode from 'vscode';
import { HistoryRun, MessageItem } from '../../core/types';
import { extensionContext, currentRun, messageQueue, setCurrentRun } from '../../core/state';
import { claudePanel } from '../../core/state';
import { debugLog, getHistoryStorageKey, getPendingQueueStorageKey, getWorkspacePath } from '../../utils/logging';
import { getValidatedConfig } from '../../core/config';
import { enforceMessageSizeLimits } from '../memory';


export function saveWorkspaceHistory(): void {
    if (!extensionContext || !currentRun) {
        debugLog(`⚠️ Cannot save workspace history: ${!extensionContext ? 'no extension context' : 'no current run'}`);
        return;
    }
    
    try {
        const storageKey = getHistoryStorageKey();
        const existingHistory = extensionContext.globalState.get<HistoryRun[]>(storageKey, []);
        
        // Apply size limits to messages before saving to history
        const sizeLimitedMessages = messageQueue.map(msg => enforceMessageSizeLimits(msg));
        
        currentRun.messages = [...sizeLimitedMessages];
        currentRun.totalMessages = messageQueue.length;
        currentRun.completedMessages = messageQueue.filter(m => m.status === 'completed').length;
        currentRun.errorMessages = messageQueue.filter(m => m.status === 'error').length;
        currentRun.waitingMessages = messageQueue.filter(m => m.status === 'waiting').length;
        
        const existingIndex = existingHistory.findIndex(run => run.id === currentRun!.id);
        if (existingIndex >= 0) {
            existingHistory[existingIndex] = currentRun;
        } else {
            existingHistory.push(currentRun);
        }
        
        // Use the configuration for history limit
        const config = getValidatedConfig();
        const recentHistory = existingHistory.slice(-config.history.maxRuns);
        
        // Log memory cleanup if history was trimmed
        if (existingHistory.length > config.history.maxRuns) {
            const trimmedCount = existingHistory.length - config.history.maxRuns;
            debugLog(`🧹 Trimmed ${trimmedCount} old history runs to prevent memory bloat`);
        }
        
        extensionContext.globalState.update(storageKey, recentHistory);
        debugLog(`💾 Saved workspace history with ${recentHistory.length} runs`);
        
        savePendingQueue();
    } catch (error) {
        debugLog(`❌ Failed to save workspace history: ${error}`);
        vscode.window.showErrorMessage(`Failed to save workspace history: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export function loadWorkspaceHistory(): void {
    if (!extensionContext) return;
    
    const storageKey = getHistoryStorageKey();
    const history = extensionContext.globalState.get<HistoryRun[]>(storageKey, []);
    
    if (claudePanel) {
        try {
            claudePanel.webview.postMessage({
                command: 'historyLoaded',
                history: history.reverse()
            });
        } catch (error) {
            debugLog(`❌ Failed to send history to webview: ${error}`);
        }
    }
}

export function filterHistory(filter: string): void {
    if (!extensionContext) return;
    
    const storageKey = getHistoryStorageKey();
    const allHistory = extensionContext.globalState.get<HistoryRun[]>(storageKey, []);
    
    let filteredHistory = allHistory;
    
    switch (filter) {
        case 'waiting':
            filteredHistory = allHistory.filter(run => run.waitingMessages > 0);
            break;
        case 'completed':
            filteredHistory = allHistory.filter(run => run.completedMessages === run.totalMessages && run.totalMessages > 0);
            break;
        case 'errors':
            filteredHistory = allHistory.filter(run => run.errorMessages > 0);
            break;
        case 'recent':
            filteredHistory = allHistory.slice(-10);
            break;
        default:
            filteredHistory = allHistory;
    }
    
    if (claudePanel) {
        try {
            claudePanel.webview.postMessage({
                command: 'historyFiltered',
                history: filteredHistory.reverse(),
                filter: filter
            });
        } catch (error) {
            debugLog(`❌ Failed to send filtered history to webview: ${error}`);
        }
    }
}

export function startNewHistoryRun(): void {
    const run: HistoryRun = {
        id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        startTime: new Date().toISOString(),
        workspacePath: getWorkspacePath(),
        messages: [],
        totalMessages: 0,
        completedMessages: 0,
        errorMessages: 0,
        waitingMessages: 0
    };
    setCurrentRun(run);
}

export function ensureHistoryRun(): void {
    if (!currentRun) {
        startNewHistoryRun();
    }
}

export function endCurrentHistoryRun(): void {
    if (currentRun) {
        currentRun.endTime = new Date().toISOString();
        saveWorkspaceHistory();
    }
}

export function savePendingQueue(): void {
    if (!extensionContext) return;
    
    const pendingMessages = messageQueue.filter(msg => 
        msg.status === 'pending' || msg.status === 'waiting'
    );
    
    const storageKey = getPendingQueueStorageKey();
    extensionContext.globalState.update(storageKey, pendingMessages);
}

export function loadPendingQueue(): void {
    if (!extensionContext) return;
    
    const storageKey = getPendingQueueStorageKey();
    const pendingMessages = extensionContext.globalState.get<MessageItem[]>(storageKey, []);
    
    if (pendingMessages.length > 0) {
        messageQueue.splice(0, messageQueue.length, ...pendingMessages);
        vscode.window.showInformationMessage(`Restored ${pendingMessages.length} pending messages from previous session`);
        
        if (!currentRun) {
            startNewHistoryRun();
            saveWorkspaceHistory();
        }
    }
}

export function clearPendingQueue(): void {
    if (!extensionContext) return;
    
    const storageKey = getPendingQueueStorageKey();
    extensionContext.globalState.update(storageKey, []);
}