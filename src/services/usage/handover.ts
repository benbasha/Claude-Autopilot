import * as vscode from 'vscode';
import * as path from 'path';
import { MessageItem } from '../../core/types';
import { messageQueue } from '../../core/state';
import { generateHandoverPrompt, generateContinuationPrompt, HandoverContext } from './handover-templates';
import { generateMessageId } from '../../utils/id-generator';
import { debugLog } from '../../utils/logging';
import { clearMessageQueue } from '../../queue/manager';
import { updateWebviewContent } from '../../ui/webview';
import { savePendingQueue } from '../../queue/processor/history';

export interface HandoverOptions {
    generateHandover: boolean;
    clearQueue: boolean;
    autoResume: boolean;
}

export function getProjectName(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        return path.basename(workspaceFolders[0].uri.fsPath);
    }
    return 'Unknown Project';
}

export function analyzeCurrentTask(lastMessage: string, queueMessages: MessageItem[]): string {
    // Analyze the last message and queue to infer current task
    const pendingMessages = queueMessages.filter(msg => msg.status === 'pending');
    const lastCompleted = queueMessages.filter(msg => msg.status === 'completed').slice(-3);
    
    let context = `Last message: "${lastMessage}"`;
    
    if (pendingMessages.length > 0) {
        context += `\nUpcoming tasks: ${pendingMessages.slice(0, 3).map(msg => `"${msg.text.substring(0, 50)}..."`).join(', ')}`;
    }
    
    if (lastCompleted.length > 0) {
        context += `\nRecent completed: ${lastCompleted.map(msg => `"${msg.text.substring(0, 50)}..."`).join(', ')}`;
    }
    
    return context;
}

export function createHandoverContext(lastMessage: MessageItem): HandoverContext {
    const completedMessages = messageQueue.filter(msg => msg.status === 'completed').length;
    const pendingMessages = messageQueue.filter(msg => msg.status === 'pending');
    
    return {
        timestamp: new Date().toISOString(),
        sessionId: generateMessageId(),
        projectName: getProjectName(),
        queueLength: pendingMessages.length,
        completedMessages,
        lastMessage: lastMessage.text,
        currentTask: analyzeCurrentTask(lastMessage.text, messageQueue)
    };
}

export function generateHandoverDocumentName(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const projectName = getProjectName().replace(/[^a-zA-Z0-9]/g, '_');
    return `handover_${projectName}_${timestamp}`;
}

export async function createHandoverMessages(lastMessage: MessageItem, options: HandoverOptions): Promise<void> {
    if (!options.generateHandover) {
        debugLog('📋 Handover generation disabled, skipping');
        return;
    }

    const handoverDocName = generateHandoverDocumentName();
    const context = createHandoverContext(lastMessage);
    const handoverPrompt = generateHandoverPrompt(context);
    
    debugLog(`📋 Creating handover document: ${handoverDocName}`);
    
    // 1. Add handover document generation message
    const handoverMessage: MessageItem = {
        id: generateMessageId(),
        text: handoverPrompt,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    // 2. Add clear queue message (if enabled)
    const clearMessage: MessageItem | null = options.clearQueue ? {
        id: generateMessageId(),
        text: 'clear',
        timestamp: new Date().toISOString(),
        status: 'pending'
    } : null;
    
    // 3. Add continuation message with handover reference
    const continuationPrompt = generateContinuationPrompt(handoverDocName, lastMessage.text);
    const continuationMessage: MessageItem = {
        id: generateMessageId(),
        text: continuationPrompt,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    // Insert messages in the correct order
    const insertIndex = messageQueue.findIndex(msg => msg.id === lastMessage.id) + 1;
    
    if (clearMessage) {
        messageQueue.splice(insertIndex, 0, handoverMessage, clearMessage, continuationMessage);
        debugLog(`📋 Added handover sequence: generate → clear → continue at index ${insertIndex}`);
    } else {
        messageQueue.splice(insertIndex, 0, handoverMessage, continuationMessage);
        debugLog(`📋 Added handover sequence: generate → continue at index ${insertIndex}`);
    }
    
    // Update the webview to reflect the new messages and save queue state
    updateWebviewContent();
    savePendingQueue();
    
    const messageCount = clearMessage ? 3 : 2;
    vscode.window.showInformationMessage(
        `📋 Handover sequence created: ${messageCount} messages added to handle usage limit and continue work`
    );
}

export function getHandoverOptions(): HandoverOptions {
    const config = vscode.workspace.getConfiguration('claudeAutopilot');
    
    return {
        generateHandover: config.get<boolean>('handover.generateDocument', true),
        clearQueue: config.get<boolean>('handover.clearQueueAfterHandover', true),
        autoResume: config.get<boolean>('handover.autoResumeWithHandover', true)
    };
}