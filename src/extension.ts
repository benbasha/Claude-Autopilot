import * as vscode from 'vscode';
import {
    claudePanel, isRunning, setClaudePanel, setIsRunning,
    setExtensionContext, setDebugMode, isDevelopmentMode, developmentOnly,
    getValidatedConfig, showConfigValidationStatus, resetConfigToDefaults, watchConfigChanges
} from './core';
import { updateWebviewContent, updateSessionState, getWebviewContent, sendHistoryVisibilitySettings } from './ui';
import { startClaudeSession, resetClaudeSession, handleClaudeKeypress, startProcessingQueue, stopProcessingQueue, flushClaudeOutput, clearClaudeOutput } from './claude';
import {
    removeMessageFromQueue, duplicateMessageInQueue, editMessageInQueue, reorderQueue, sortQueue, clearMessageQueue,
    addMessageToQueueFromWebview, loadWorkspaceHistory, filterHistory, 
    loadPendingQueue, clearPendingQueue, saveWorkspaceHistory, endCurrentHistoryRun,
    startAutomaticMaintenance, stopAutomaticMaintenance, performQueueMaintenance, getMemoryUsageSummary
} from './queue';
import { recoverWaitingMessages, stopSleepPrevention, stopHealthCheck, startScheduledSession, stopScheduledSession } from './services';
import { sendSecuritySettings, toggleXssbypassSetting } from './services/security';
import { debugLog } from './utils';

// Development-only imports
let simulateUsageLimit: (() => void) | undefined;
let clearAllTimers: (() => void) | undefined;
let debugQueueState: (() => void) | undefined;

// Dynamically import development features only in dev mode
if (isDevelopmentMode()) {
    import('./services/usage').then(module => {
        simulateUsageLimit = module.simulateUsageLimit;
        clearAllTimers = module.clearAllTimers;
        debugQueueState = module.debugQueueState;
    }).catch(error => {
        console.error('Failed to load development features:', error);
        vscode.window.showWarningMessage('Development features failed to load');
    });
}

export function activate(context: vscode.ExtensionContext) {
    setExtensionContext(context);
    setDebugMode(false);

    // Validate configuration on startup
    const config = getValidatedConfig();
    debugLog('Extension activated with validated configuration');

    // Watch for configuration changes
    const configWatcher = watchConfigChanges((newConfig) => {
        debugLog('Configuration updated, reloading settings...');
        
        // Update UI settings
        sendSecuritySettings();
        sendHistoryVisibilitySettings();
        
        // Restart scheduler if scheduledStartTime changed
        stopScheduledSession();
        if (newConfig.session.scheduledStartTime && !newConfig.session.autoStart) {
            startScheduledSession(() => {
                // Start Claude session directly (not just open panel)
                startClaudeSession(newConfig.session.skipPermissions).catch(error => {
                    vscode.window.showErrorMessage(`Scheduled Claude session failed to start: ${error.message}`);
                });
            });
        }
    });

    // Register commands
    const startCommand = vscode.commands.registerCommand('claude-autopilot.start', () => {
        startClaudeAutopilot(context);
    });

    const stopCommand = vscode.commands.registerCommand('claude-autopilot.stop', () => {
        stopClaudeAutopilot();
    });

    const addMessageCommand = vscode.commands.registerCommand('claude-autopilot.addMessage', () => {
        addMessageToQueue();
    });

    context.subscriptions.push(startCommand, stopCommand, addMessageCommand, configWatcher);
    
    // Auto-start or schedule Claude session based on configuration
    if (config.session.autoStart) {
        setTimeout(() => {
            startClaudeAutopilot(context);
        }, 1000); // Small delay to ensure extension is fully loaded
    } else if (config.session.scheduledStartTime) {
        // Start scheduler for timed session start
        setTimeout(() => {
            startScheduledSession(() => {
                // Start Claude session directly (not just open panel)
                startClaudeSession(config.session.skipPermissions).catch(error => {
                    vscode.window.showErrorMessage(`Scheduled Claude session failed to start: ${error.message}`);
                });
            });
        }, 1000); // Small delay to ensure extension is fully loaded
    }
}

function startClaudeAutopilot(context: vscode.ExtensionContext): void {
    if (isRunning && claudePanel) {
        claudePanel.reveal(vscode.ViewColumn.Two);
        vscode.window.showInformationMessage('Claude Autopilot is already running - showing existing panel');
        return;
    }
    
    if (isRunning && !claudePanel) {
        setIsRunning(false);
    }

    const panel = vscode.window.createWebviewPanel(
        'claudeAutopilot',
        'Claude Autopilot',
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    setClaudePanel(panel);
    panel.webview.html = getWebviewContent(context);

    loadPendingQueue();
    recoverWaitingMessages();
    
    // Start automatic queue maintenance
    startAutomaticMaintenance();
    
    setTimeout(() => {
        updateWebviewContent();
        updateSessionState();
        sendSecuritySettings();
        sendHistoryVisibilitySettings();
        loadWorkspaceHistory();
        debugLog('Webview state synchronized after reopening');
        
        // Auto-start processing if configured
        const config = getValidatedConfig();
        if (config.session.autoStart) {
            setTimeout(() => {
                startProcessingQueue(config.session.skipPermissions).catch(error => {
                    vscode.window.showErrorMessage(`Failed to auto-start processing: ${error.message}`);
                });
            }, 500); // Small delay to ensure webview is fully loaded
        }
    }, 100);

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(
        (message: any) => {
            switch (message.command) {
                case 'addMessage':
                    addMessageToQueueFromWebview(message.text);
                    break;
                case 'getWorkspaceFiles':
                    getWorkspaceFiles(message.query || '', message.page || 0);
                    break;
                case 'startProcessing':
                    startProcessingQueue(message.skipPermissions).catch(error => {
                        vscode.window.showErrorMessage(`Failed to start processing: ${error.message}`);
                        debugLog(`Error starting processing: ${error}`);
                    });
                    break;
                case 'stopProcessing':
                    stopProcessingQueue();
                    break;
                case 'clearQueue':
                    clearMessageQueue();
                    break;
                case 'resetSession':
                    resetClaudeSession();
                    break;
                case 'startClaudeSession':
                    startClaudeSession(message.skipPermissions).catch(error => {
                        vscode.window.showErrorMessage(`Failed to start Claude session: ${error.message}`);
                        debugLog(`Error starting Claude session: ${error}`);
                    });
                    break;
                case 'claudeKeypress':
                    handleClaudeKeypress(message.key);
                    break;
                case 'removeMessage':
                    removeMessageFromQueue(message.messageId);
                    break;
                case 'duplicateMessage':
                    duplicateMessageInQueue(message.messageId);
                    break;
                case 'editMessage':
                    console.log('Extension received editMessage command:', message);
                    editMessageInQueue(message.messageId, message.newText);
                    break;
                case 'reorderQueue':
                    reorderQueue(message.fromIndex, message.toIndex);
                    break;
                case 'sortQueue':
                    sortQueue(message.field, message.direction);
                    break;
                case 'loadHistory':
                    loadWorkspaceHistory();
                    break;
                case 'filterHistory':
                    filterHistory(message.filter);
                    break;
                case 'toggleXssbypass':
                    toggleXssbypassSetting(message.enabled);
                    break;
                case 'getSecuritySettings':
                    sendSecuritySettings();
                    break;
                case 'openSettings':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'claudeAutopilot');
                    break;
                case 'getDevelopmentModeSetting':
                    sendDevelopmentModeSetting();
                    break;
                case 'simulateUsageLimit':
                    developmentOnly(() => {
                        if (simulateUsageLimit) {
                            simulateUsageLimit();
                        } else {
                            vscode.window.showWarningMessage('Development feature not available');
                        }
                    });
                    break;
                case 'clearAllTimers':
                    developmentOnly(() => {
                        if (clearAllTimers) {
                            clearAllTimers();
                        } else {
                            vscode.window.showWarningMessage('Development feature not available');
                        }
                    });
                    break;
                case 'debugQueueState':
                    developmentOnly(() => {
                        if (debugQueueState) {
                            debugQueueState();
                        } else {
                            vscode.window.showWarningMessage('Development feature not available');
                        }
                    });
                    break;
                case 'toggleDebugLogging':
                    toggleDebugLogging();
                    break;
                case 'performQueueMaintenance':
                    developmentOnly(() => {
                        performQueueMaintenance();
                        vscode.window.showInformationMessage('Queue maintenance completed');
                    });
                    break;
                case 'getMemoryUsage':
                    developmentOnly(() => {
                        const summary = getMemoryUsageSummary();
                        vscode.window.showInformationMessage(summary);
                    });
                    break;
                case 'validateConfig':
                    developmentOnly(() => {
                        showConfigValidationStatus();
                    });
                    break;
                case 'resetConfig':
                    developmentOnly(() => {
                        vscode.window.showWarningMessage(
                            'This will reset all Claude Autopilot settings to defaults. Continue?',
                            'Reset',
                            'Cancel'
                        ).then(selection => {
                            if (selection === 'Reset') {
                                resetConfigToDefaults();
                            }
                        });
                    });
                    break;
            }
        },
        undefined,
        []
    );

    // Handle panel disposal
    panel.onDidDispose(() => {
        debugLog('Webview panel disposed - cleaning up but keeping Claude session running');
        
        setClaudePanel(null);
        flushClaudeOutput();
        clearClaudeOutput();
        setIsRunning(false);
        
        vscode.window.showInformationMessage('Claude Autopilot panel closed. Claude session continues in background. Use "Start Claude Autopilot" to reopen.');
    }, null, []);

    setIsRunning(true);
    vscode.window.showInformationMessage('Claude Autopilot started');
}

async function getWorkspaceFiles(query: string, page: number = 0): Promise<void> {
    try {
        if (!claudePanel) {
            return;
        }

        const excludePattern = '{node_modules,coverage,.git,dist,build,out,.vscode,.idea,.history,tmp,temp}/**';
        
        let files;
        if (query.trim()) {
            // Search for both files containing query AND files inside folders containing query
            const [fileMatches, folderMatches] = await Promise.all([
                vscode.workspace.findFiles(`**/*${query}*`, excludePattern, 500),
                vscode.workspace.findFiles(`**/*${query}*/**`, excludePattern, 500)
            ]);
            files = [...fileMatches, ...folderMatches];
        } else {
            files = await vscode.workspace.findFiles('**/*', excludePattern, 1000);
        }
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
        if (!workspaceRoot) {
            claudePanel.webview.postMessage({
                command: 'workspaceFilesResult',
                files: [],
                query: query
            });
            return;
        }

        let results = files
            .map(file => ({
                path: vscode.workspace.asRelativePath(file, false),
                name: vscode.workspace.asRelativePath(file, false).split('/').pop() || ''
            }))
            .filter((file, index, self) => index === self.findIndex(f => f.path === file.path))
            .sort((a, b) => {
                if (!query.trim()) return a.path.localeCompare(b.path);
                
                const lowerQuery = query.toLowerCase();
                const aNameMatch = a.name.toLowerCase().startsWith(lowerQuery);
                const bNameMatch = b.name.toLowerCase().startsWith(lowerQuery);
                
                if (aNameMatch && !bNameMatch) return -1;
                if (!aNameMatch && bNameMatch) return 1;
                
                return a.path.localeCompare(b.path);
            });

        const pageSize = 50;
        const totalResults = results.length;
        const totalPages = Math.ceil(totalResults / pageSize);
        const paginatedFiles = results.slice(page * pageSize, (page + 1) * pageSize);

        claudePanel.webview.postMessage({
            command: 'workspaceFilesResult',
            files: paginatedFiles,
            query: query,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalResults: totalResults,
                pageSize: pageSize,
                hasNextPage: page < totalPages - 1,
                hasPrevPage: page > 0
            }
        });

    } catch (error) {
        debugLog(`Error getting workspace files: ${error}`);
        if (claudePanel) {
            claudePanel.webview.postMessage({
                command: 'workspaceFilesResult',
                files: [],
                query: query,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
}

function stopClaudeAutopilot(): void {
    if (!isRunning) {
        return;
    }

    stopSleepPrevention();
    flushClaudeOutput();
    clearClaudeOutput();
    setIsRunning(false);
    
    if (claudePanel) {
        claudePanel.dispose();
        setClaudePanel(null);
    }

    vscode.window.showInformationMessage('Claude Autopilot stopped');
}

function addMessageToQueue(): void {
    vscode.window.showInputBox({
        prompt: 'Enter message to add to Claude Autopilot queue',
        placeHolder: 'Type your message here...'
    }).then(message => {
        if (message) {
            try {
                addMessageToQueueFromWebview(message);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to add message to queue: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }, error => {
        vscode.window.showErrorMessage(`Input dialog error: ${error instanceof Error ? error.message : String(error)}`);
    });
}

function sendDevelopmentModeSetting(): void {
    if (claudePanel) {
        const config = vscode.workspace.getConfiguration('claudeAutopilot');
        const isDevelopmentMode = config.get<boolean>('developmentMode', false);
        
        claudePanel.webview.postMessage({
            command: 'setDevelopmentModeSetting',
            enabled: isDevelopmentMode
        });
    }
}

function toggleDebugLogging(): void {
    const config = vscode.workspace.getConfiguration('claudeAutopilot');
    const isDevelopmentMode = config.get<boolean>('developmentMode', false);
    
    if (!isDevelopmentMode) {
        vscode.window.showWarningMessage('Development mode must be enabled to use debug features');
        return;
    }
    
    // Toggle debug logging state (this would need to be implemented in core state)
    vscode.window.showInformationMessage('DEBUG: Debug logging toggled');
}

export function deactivate(): void {
    // Stop all timers and background processes first
    stopHealthCheck();
    stopAutomaticMaintenance();
    stopScheduledSession();
    
    // Clear development timers if available
    if (clearAllTimers) {
        try {
            clearAllTimers();
        } catch (error) {
            console.error('Error clearing timers during deactivation:', error);
        }
    }
    
    // Save state and clean up
    try {
        saveWorkspaceHistory();
        endCurrentHistoryRun();
    } catch (error) {
        console.error('Error saving state during deactivation:', error);
    }
    
    // Clean up output and stop loops
    try {
        flushClaudeOutput();
        clearClaudeOutput();
        stopClaudeAutopilot();
    } catch (error) {
        console.error('Error during final cleanup:', error);
    }
}