const vscode = acquireVsCodeApi();
let messageQueue = [];
let sessionState = {
    isSessionRunning: false,  // Claude session/process is active
    isProcessing: false,      // Currently processing messages
    wasStopped: false,        // User manually stopped processing
    justStarted: false        // Just clicked start (prevent backend override)
};
let historyData = [];
let draggedIndex = -1;
let allowDangerousXssbypass = false;

// Security utilities
function sanitizeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\//g, "&#x2F;");
}

function validateMessage(text) {
    if (typeof text !== 'string') return { valid: false, error: 'Message must be a string' };
    if (text.length === 0) return { valid: false, error: 'Message cannot be empty' };
    if (text.length > 50000) return { valid: false, error: 'Message too long (max 50,000 characters)' };
    
    // Skip XSS validation if bypass is enabled
    if (allowDangerousXssbypass) {
        return { valid: true };
    }
    
    const dangerousPatterns = [
        /<script[^>]*>/i,
        /javascript:/i,
        /data:text\/html/i,
        /vbscript:/i,
        /on\w+\s*=/i,
        /<iframe[^>]*>/i,
        /<object[^>]*>/i,
        /<embed[^>]*>/i
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(text)) {
            return { valid: false, error: 'Message contains potentially dangerous content. Enable XSS bypass in settings if needed.' };
        }
    }
    
    return { valid: true };
}

function createSafeElement(tagName, textContent, className) {
    const element = document.createElement(tagName);
    element.textContent = textContent;
    if (className) {
        element.className = className.replace(/[^a-zA-Z0-9\-_\s]/g, '');
    }
    return element;
}

function addMessage() {
    try {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message) {
            return;
        }

        const validation = validateMessage(message);
        if (!validation.valid) {
            showError(validation.error);
            return;
        }

        vscode.postMessage({
            command: 'addMessage',
            text: message
        });

        input.value = '';
    } catch (error) {
        console.error('Error adding message:', error);
        showError('Failed to add message');
    }
}

function startProcessing() {
    try {
        console.log('Frontend: User clicked Start Processing');
        const skipPermissions = document.getElementById('skipPermissions').checked;
        sessionState.isProcessing = true;
        sessionState.wasStopped = false; // Reset stopped state when starting
        
        // Mark that we just started processing (to prevent backend override)
        sessionState.justStarted = true;
        setTimeout(() => {
            sessionState.justStarted = false;
        }, 2000); // Clear flag after 2 seconds
        
        updateButtonStates();
        vscode.postMessage({
            command: 'startProcessing',
            skipPermissions: skipPermissions
        });
    } catch (error) {
        console.error('Error starting processing:', error);
        showError('Failed to start processing');
    }
}

function stopProcessing() {
    try {
        console.log('Frontend: User clicked Stop Processing');
        sessionState.isProcessing = false;
        sessionState.wasStopped = true; // Mark that user manually stopped
        updateButtonStates();
        vscode.postMessage({
            command: 'stopProcessing'
        });
    } catch (error) {
        console.error('Error stopping processing:', error);
        showError('Failed to stop processing');
    }
}

function interruptClaude() {
    try {
        console.log('Frontend: User clicked Interrupt (ESC)');
        vscode.postMessage({
            command: 'claudeKeypress',
            key: 'escape'
        });
    } catch (error) {
        console.error('Error interrupting Claude:', error);
    }
}

function clearQueue() {
    try {
        vscode.postMessage({
            command: 'clearQueue'
        });
    } catch (error) {
        console.error('Error clearing queue:', error);
        showError('Failed to clear queue');
    }
}

function resetSession() {
    try {
        sessionState.isSessionRunning = false;
        sessionState.isProcessing = false;
        sessionState.wasStopped = false; // Reset stopped state on session reset
        updateButtonStates();
        vscode.postMessage({
            command: 'resetSession'
        });
    } catch (error) {
        console.error('Error resetting session:', error);
        showError('Failed to reset session');
    }
}

function openSettings() {
    try {
        vscode.postMessage({ command: 'openSettings' });
    } catch (error) {
        console.error('Error opening settings:', error);
    }
}

function clearClaudeOutput() {
    try {
        const claudeContainer = document.getElementById('claudeOutputContainer');
        let claudeOutput = claudeContainer.querySelector('.claude-live-output');
        if (claudeOutput) {
            claudeOutput.innerHTML = '';
            const readyMessage = createSafeElement('div', '', 'claude-ready-message');
            const pulseDiv = createSafeElement('div', '', 'pulse-dot');
            const messageSpan = createSafeElement('span', 'Output cleared - ready for new Claude output...', '');
            const contentDiv = document.createElement('div');
            contentDiv.style.cssText = 'display: flex; align-items: center; gap: 8px;';
            contentDiv.appendChild(pulseDiv);
            contentDiv.appendChild(messageSpan);
            readyMessage.appendChild(contentDiv);
            claudeOutput.appendChild(readyMessage);
            
            // Reset content tracking
            claudeContent = '';
            lastRenderedContent = '';
            
            // Reset parsing cache
            lastParsedContent = '';
            lastParsedHtml = '';
            
            // Reset throttling state
            pendingClaudeOutput = null;
            if (claudeRenderTimer) {
                clearTimeout(claudeRenderTimer);
                claudeRenderTimer = null;
            }
            lastClaudeRenderTime = 0;
        }
    } catch (error) {
        console.error('Error clearing Claude output:', error);
    }
}

function clearClaudeOutputUI() {
    // Same as clearClaudeOutput but called from backend
    clearClaudeOutput();
    console.log('Claude output auto-cleared by backend');
}

function updateQueue(queue) {
    try {
        messageQueue = Array.isArray(queue) ? queue : [];
        renderQueue();
        updateButtonStates();
    } catch (error) {
        console.error('Error updating queue:', error);
    }
}

function renderQueue() {
    try {
        const container = document.getElementById('queueContainer');

        if (messageQueue.length === 0) {
            container.innerHTML = '';
            const emptyMessage = createSafeElement('div', 'No messages in queue', 'empty-queue');
            container.appendChild(emptyMessage);
            return;
        }

        container.innerHTML = '';

        messageQueue.forEach((item, index) => {
            const queueItem = document.createElement('div');
            queueItem.className = `queue-item ${sanitizeHtml(item.status)}`;
            queueItem.setAttribute('data-index', index);
            
            let statusText = item.status;
            let timeText = new Date(item.timestamp).toLocaleString();
            let additionalContent = '';

            if (item.status === 'waiting' && item.waitSeconds > 0) {
                const hours = Math.floor(item.waitSeconds / 3600);
                const minutes = Math.floor((item.waitSeconds % 3600) / 60);
                const seconds = item.waitSeconds % 60;
                statusText = `waiting - ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                const countdownDiv = createSafeElement('div', `Resuming in ${hours}h ${minutes}m ${seconds}s`, 'countdown');
                additionalContent = countdownDiv;
            }

            if (item.status === 'completed' && item.output) {
                const outputDiv = createSafeElement('div', item.output, 'queue-item-output');
                additionalContent = outputDiv;
            }

            if (item.status === 'error' && item.error) {
                const errorDiv = createSafeElement('div', `Error: ${item.error}`, 'queue-item-error');
                additionalContent = errorDiv;
            }

            const isDraggable = item.status === 'pending';
            
            // Create actions
            const actions = document.createElement('div');
            actions.className = 'queue-item-actions';
            
            // Show duplicate button for pending, completed, and processing messages
            if (item.status === 'pending' || item.status === 'completed' || item.status === 'processing') {
                const duplicateBtn = document.createElement('button');
                duplicateBtn.textContent = '📋';
                duplicateBtn.className = 'queue-item-action duplicate';
                duplicateBtn.title = 'Duplicate message';
                duplicateBtn.onclick = () => duplicateMessage(item.id);
                actions.appendChild(duplicateBtn);
            }
            
            // Show edit button only for pending messages
            if (item.status === 'pending') {
                const editBtn = document.createElement('button');
                editBtn.textContent = '✏️';
                editBtn.className = 'queue-item-action edit';
                editBtn.title = 'Edit message';
                editBtn.onclick = () => {
                    console.log('Edit button clicked for message ID:', item.id);
                    editMessage(item.id);
                };
                actions.appendChild(editBtn);
                
                const removeBtn = document.createElement('button');
                removeBtn.textContent = '✕';
                removeBtn.className = 'queue-item-action remove';
                removeBtn.title = 'Remove message';
                removeBtn.onclick = () => removeMessage(item.id);
                actions.appendChild(removeBtn);
            } else {
                const removeBtn = document.createElement('button');
                removeBtn.textContent = '✕';
                removeBtn.className = 'queue-item-action remove';
                removeBtn.title = 'Remove message';
                removeBtn.onclick = () => removeMessage(item.id);
                actions.appendChild(removeBtn);
            }

            // Set drag properties
            queueItem.draggable = isDraggable;
            if (isDraggable) {
                queueItem.addEventListener('dragstart', (e) => handleDragStart(e, index));
                queueItem.addEventListener('dragover', handleDragOver);
                queueItem.addEventListener('drop', (e) => handleDrop(e, index));
            }
            
            // Create header
            const header = document.createElement('div');
            header.className = 'queue-item-header';
            
            const status = createSafeElement('span', statusText, 'queue-item-status');
            const time = createSafeElement('span', timeText, 'queue-item-time');
            
            header.appendChild(status);
            header.appendChild(time);
            
            // Create text content - SAFELY
            const textDiv = createSafeElement('div', item.text, 'queue-item-text');
            
            queueItem.appendChild(actions);
            queueItem.appendChild(header);
            queueItem.appendChild(textDiv);
            
            if (additionalContent) {
                queueItem.appendChild(additionalContent);
            }
            
            container.appendChild(queueItem);
        });
    } catch (error) {
        console.error('Error rendering queue:', error);
        const container = document.getElementById('queueContainer');
        container.innerHTML = '';
        const errorMessage = createSafeElement('div', 'Error rendering queue', 'error-message');
        container.appendChild(errorMessage);
    }
}

function updateButtonStates() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const resetBtn = document.getElementById('resetBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    console.log('Button State Update:', {
        isSessionRunning: sessionState.isSessionRunning,
        isProcessing: sessionState.isProcessing,
        queueLength: messageQueue.length
    });
    
    // Update start button text and state based on session and queue status
    if (!sessionState.isSessionRunning) {
        startBtn.innerHTML = '<span class="btn-icon">🚀</span>Start Session';
        startBtn.disabled = sessionState.isProcessing;
    } else if (sessionState.wasStopped && !sessionState.isProcessing) {
        // Show "Start Processing" only if user manually stopped processing
        startBtn.innerHTML = '<span class="btn-icon">▶️</span>Start Processing';
        startBtn.disabled = messageQueue.length === 0; // Disable only if no messages
    } else if (sessionState.isProcessing) {
        startBtn.innerHTML = '<span class="btn-icon">▶️</span>Processing...';
        startBtn.disabled = true; // Currently processing
    } else {
        // Session running, not stopped by user - show ready state
        startBtn.innerHTML = '<span class="btn-icon">⏳</span>Session Ready';
        startBtn.disabled = true;
    }
    
    console.log('Start button state:', {
        text: startBtn.innerHTML.replace(/<[^>]*>/g, ''),
        disabled: startBtn.disabled,
        wasStopped: sessionState.wasStopped,
        reason: !sessionState.isSessionRunning ? 'no session' : 
               sessionState.wasStopped ? 'manually stopped' :
               sessionState.isProcessing ? 'processing' : 'session ready'
    });
    
    // Stop button: enabled when processing
    stopBtn.disabled = !sessionState.isProcessing;
    
    // Reset button: enabled when session is running but not processing
    resetBtn.disabled = !sessionState.isSessionRunning || sessionState.isProcessing;
    
    // Clear button: always enabled when queue has messages
    clearBtn.disabled = messageQueue.length === 0;
}

// Queue Management Functions
function removeMessage(messageId) {
    try {
        vscode.postMessage({
            command: 'removeMessage',
            messageId: messageId
        });
    } catch (error) {
        console.error('Error removing message:', error);
        showError('Failed to remove message');
    }
}

function duplicateMessage(messageId) {
    try {
        const message = messageQueue.find(item => item.id === messageId);
        if (message) {
            vscode.postMessage({
                command: 'duplicateMessage',
                messageId: messageId
            });
        }
    } catch (error) {
        console.error('Error duplicating message:', error);
        showError('Failed to duplicate message');
    }
}

function editMessage(messageId) {
    try {
        console.log('EditMessage called with messageId:', messageId);
        const message = messageQueue.find(item => item.id === messageId);
        console.log('Found message:', message);
        
        if (message) {
            // Create a custom input dialog instead of using prompt()
            showEditDialog(message, messageId);
        } else {
            console.error('Message not found for ID:', messageId);
            showError('Message not found');
        }
    } catch (error) {
        console.error('Error editing message:', error);
        showError('Failed to edit message');
    }
}

function showEditDialog(message, messageId) {
    // Remove any existing edit dialog
    const existingDialog = document.getElementById('editDialog');
    if (existingDialog) {
        existingDialog.remove();
    }

    // Create dialog overlay
    const overlay = document.createElement('div');
    overlay.id = 'editDialog';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    // Create dialog box
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-widget-border);
        border-radius: 4px;
        padding: 20px;
        min-width: 400px;
        max-width: 600px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    // Create dialog content
    const title = document.createElement('h3');
    title.textContent = 'Edit Message';
    title.style.cssText = `
        margin: 0 0 15px 0;
        color: var(--vscode-foreground);
        font-size: 16px;
    `;

    const textarea = document.createElement('textarea');
    textarea.value = message.text;
    textarea.style.cssText = `
        width: 100%;
        height: 100px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        border-radius: 3px;
        padding: 8px;
        font-family: var(--vscode-font-family);
        font-size: 13px;
        resize: vertical;
        box-sizing: border-box;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 15px;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
        padding: 6px 12px;
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: 1px solid var(--vscode-widget-border);
        border-radius: 3px;
        cursor: pointer;
    `;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = `
        padding: 6px 12px;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 3px;
        cursor: pointer;
    `;

    // Event handlers
    cancelBtn.onclick = () => {
        console.log('Edit cancelled by user');
        overlay.remove();
    };

    saveBtn.onclick = () => {
        const newText = textarea.value.trim();
        console.log('User entered text:', newText);
        
        if (newText === '') {
            showError('Message cannot be empty');
            return;
        }

        const validation = validateMessage(newText);
        console.log('Validation result:', validation);
        
        if (!validation.valid) {
            showError(validation.error);
            return;
        }

        console.log('Sending editMessage command to backend');
        vscode.postMessage({
            command: 'editMessage',
            messageId: messageId,
            newText: newText
        });

        overlay.remove();
    };

    // Handle Enter key to save
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            saveBtn.click();
        }
        if (e.key === 'Escape') {
            cancelBtn.click();
        }
    });

    // Assemble dialog
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(saveBtn);
    
    dialog.appendChild(title);
    dialog.appendChild(textarea);
    dialog.appendChild(buttonContainer);
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Focus the textarea and select all text
    setTimeout(() => {
        textarea.focus();
        textarea.select();
    }, 100);

    // Close on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            cancelBtn.click();
        }
    };
}

function sortQueue() {
    try {
        const field = document.getElementById('sortField').value;
        const direction = document.getElementById('sortDirection').value;
        
        vscode.postMessage({
            command: 'sortQueue',
            field: field,
            direction: direction
        });
    } catch (error) {
        console.error('Error sorting queue:', error);
        showError('Failed to sort queue');
    }
}

// Drag and Drop Functions
function handleDragStart(event, index) {
    const item = messageQueue[index];
    
    // Prevent dragging running or completed tasks
    if (item && (item.status === 'processing' || item.status === 'completed' || item.status === 'error' || item.status === 'waiting')) {
        event.preventDefault();
        return false;
    }
    
    draggedIndex = index;
    event.dataTransfer.effectAllowed = 'move';
    event.target.style.opacity = '0.5';
}

function handleDragOver(event) {
    event.preventDefault();
    
    // Only allow dropping on pending items or at the end
    const targetElement = event.currentTarget;
    const targetIndex = parseInt(targetElement.dataset.index);
    const targetItem = messageQueue[targetIndex];
    
    if (targetItem && (targetItem.status === 'processing' || targetItem.status === 'completed' || targetItem.status === 'error' || targetItem.status === 'waiting')) {
        event.dataTransfer.dropEffect = 'none';
        return;
    }
    
    event.dataTransfer.dropEffect = 'move';
}

function handleDrop(event, targetIndex) {
    event.preventDefault();
    
    const targetItem = messageQueue[targetIndex];
    const draggedItem = messageQueue[draggedIndex];
    
    // Prevent dropping on running/completed tasks or dragging them
    if (targetItem && (targetItem.status === 'processing' || targetItem.status === 'completed' || targetItem.status === 'error' || targetItem.status === 'waiting')) {
        return;
    }
    
    if (draggedItem && (draggedItem.status === 'processing' || draggedItem.status === 'completed' || draggedItem.status === 'error' || draggedItem.status === 'waiting')) {
        return;
    }
    
    if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
        vscode.postMessage({
            command: 'reorderQueue',
            fromIndex: draggedIndex,
            toIndex: targetIndex
        });
    }
    
    // Reset drag styling
    const draggedElement = document.querySelector(`[data-index="${draggedIndex}"]`);
    if (draggedElement) {
        draggedElement.style.opacity = '1';
    }
    
    draggedIndex = -1;
}

// History Management Functions
function loadHistory() {
    try {
        vscode.postMessage({
            command: 'loadHistory'
        });
    } catch (error) {
        console.error('Error loading history:', error);
        showError('Failed to load history');
    }
}

function filterHistory() {
    try {
        const filter = document.getElementById('historyFilter').value;
        vscode.postMessage({
            command: 'filterHistory',
            filter: filter
        });
    } catch (error) {
        console.error('Error filtering history:', error);
        showError('Failed to filter history');
    }
}

function deleteHistoryRun(runId) {
    try {
        if (confirm('Are you sure you want to delete this history run?')) {
            vscode.postMessage({
                command: 'deleteHistoryRun',
                runId: runId
            });
        }
    } catch (error) {
        console.error('Error deleting history run:', error);
        showError('Failed to delete history run');
    }
}

function deleteAllHistory() {
    try {
        if (confirm('Are you sure you want to delete ALL history? This action cannot be undone.')) {
            vscode.postMessage({
                command: 'deleteAllHistory'
            });
        }
    } catch (error) {
        console.error('Error deleting all history:', error);
        showError('Failed to delete all history');
    }
}

function renderHistory(history) {
    try {
        const container = document.getElementById('historyContainer');
        
        if (!history || history.length === 0) {
            container.innerHTML = '';
            const emptyMessage = createSafeElement('div', 'No previous runs found for this workspace', 'empty-history');
            container.appendChild(emptyMessage);
            return;
        }
        
        container.innerHTML = '';
        
        history.forEach(run => {
            const startTime = new Date(run.startTime).toLocaleString();
            const endTime = run.endTime ? new Date(run.endTime).toLocaleString() : 'In Progress';
            const duration = run.endTime ? 
                Math.round((new Date(run.endTime) - new Date(run.startTime)) / 1000 / 60) + ' min' : 
                'Ongoing';
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            // Create header
            const header = document.createElement('div');
            header.className = 'history-item-header';
            
            const title = createSafeElement('div', `Run ${run.id.split('_')[1]}`, 'history-item-title');
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'history-item-actions';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.className = 'history-item-action delete';
            deleteBtn.title = 'Delete this run';
            deleteBtn.onclick = () => deleteHistoryRun(run.id);
            actionsDiv.appendChild(deleteBtn);
            
            const timeDiv = createSafeElement('div', `${startTime} (${duration})`, 'history-item-time');
            actionsDiv.appendChild(timeDiv);
            
            header.appendChild(title);
            header.appendChild(actionsDiv);
            
            // Create stats
            const stats = document.createElement('div');
            stats.className = 'history-item-stats';
            
            const totalStat = createSafeElement('div', `📊 Total: ${run.totalMessages}`, 'history-stat history-stat-total');
            const completedStat = createSafeElement('div', `✅ Completed: ${run.completedMessages}`, 'history-stat history-stat-completed');
            const errorStat = createSafeElement('div', `❌ Errors: ${run.errorMessages}`, 'history-stat history-stat-errors');
            const waitingStat = createSafeElement('div', `⏳ Waiting: ${run.waitingMessages}`, 'history-stat history-stat-waiting');
            
            stats.appendChild(totalStat);
            stats.appendChild(completedStat);
            stats.appendChild(errorStat);
            stats.appendChild(waitingStat);
            
            // Create messages
            const messages = document.createElement('div');
            messages.className = 'history-item-messages';
            
            run.messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'history-message';
                
                const textDiv = createSafeElement('div', msg.text, 'history-message-text');
                
                const metaDiv = document.createElement('div');
                metaDiv.className = 'history-message-meta';
                
                const statusSpan = createSafeElement('span', msg.status.toUpperCase(), `status-${msg.status}`);
                const timeSpan = createSafeElement('span', new Date(msg.timestamp).toLocaleTimeString(), '');
                
                metaDiv.appendChild(statusSpan);
                metaDiv.appendChild(timeSpan);
                
                messageDiv.appendChild(textDiv);
                messageDiv.appendChild(metaDiv);
                
                messages.appendChild(messageDiv);
            });
            
            historyItem.appendChild(header);
            historyItem.appendChild(stats);
            historyItem.appendChild(messages);
            
            container.appendChild(historyItem);
        });
    } catch (error) {
        console.error('Error rendering history:', error);
        const container = document.getElementById('historyContainer');
        container.innerHTML = '';
        const errorMessage = createSafeElement('div', 'Error rendering history', 'error-message');
        container.appendChild(errorMessage);
    }
}

// Handle messages from extension
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'updateQueue':
            updateQueue(message.queue);
            break;
        case 'terminalOutput':
            appendToTerminal(message.output);
            break;
        case 'claudeOutput':
            appendToClaudeOutput(message.output);
            break;
        case 'setSecuritySettings':
            allowDangerousXssbypass = message.allowDangerousXssbypass;
            const securityWarning = document.getElementById('securityWarning');
            if (securityWarning) {
                securityWarning.style.display = message.allowDangerousXssbypass ? 'block' : 'none';
            }
            break;
        case 'setHistoryVisibility':
            const historySection = document.querySelector('.history-section');
            if (historySection) {
                historySection.style.display = message.showInUI ? 'block' : 'none';
            }
            break;
        case 'setDevelopmentModeSetting':
            updateDevelopmentModeUI(message.enabled);
            break;
        case 'clearClaudeOutput':
            clearClaudeOutputUI();
            break;
        case 'sessionStateChanged':
            console.log('Backend state update:', {
                backendSessionRunning: message.isSessionRunning,
                backendProcessing: message.isProcessing,
                frontendWasStopped: sessionState.wasStopped,
                frontendProcessing: sessionState.isProcessing,
                justStarted: sessionState.justStarted
            });
            
            sessionState.isSessionRunning = message.isSessionRunning;
            
            // If processing finished naturally (backend says processing stopped but user didn't click stop), 
            // reset wasStopped so it goes back to auto-processing mode
            if (sessionState.isProcessing && !message.isProcessing && !sessionState.wasStopped) {
                // Processing finished naturally - keep wasStopped as false
                sessionState.wasStopped = false;
            }
            
            // Don't override wasStopped if user just clicked start and backend hasn't caught up yet
            if (sessionState.wasStopped && message.isProcessing) {
                // User clicked start, backend is now processing - reset wasStopped
                sessionState.wasStopped = false;
            }
            
            // Don't override frontend processing state if user just clicked start
            if (!sessionState.justStarted) {
                sessionState.isProcessing = message.isProcessing;
            } else if (message.isProcessing) {
                // Backend caught up and is processing - good to sync
                sessionState.isProcessing = message.isProcessing;
                sessionState.justStarted = false;
            }
            
            updateButtonStates();
            break;
        case 'historyLoaded':
            historyData = message.history;
            renderHistory(historyData);
            break;
        case 'historyFiltered':
            renderHistory(message.history);
            break;
        case 'queueSorted':
            const sortField = document.getElementById('sortField');
            const sortDirection = document.getElementById('sortDirection');
            sortField.value = message.sortConfig.field;
            sortDirection.value = message.sortConfig.direction;
            break;
        case 'workspaceFilesResult':
            renderFileAutocomplete(message.files, message.pagination);
            break;
    }
});

// Store terminal content separately
let debugTerminalContent = '';

function appendToTerminal(output) {
    try {
        const terminalContainer = document.getElementById('terminalContainer');
        let terminalOutput = terminalContainer.querySelector('.terminal-output');

        if (!terminalOutput) {
            terminalOutput = document.createElement('div');
            terminalOutput.className = 'terminal-output';
            terminalContainer.appendChild(terminalOutput);
        }

        // Clear the ready message on first output
        const readyMessage = terminalOutput.querySelector('.terminal-ready-message');
        if (readyMessage) {
            terminalOutput.innerHTML = '';
            debugTerminalContent = '';
        }

        // Filter out Claude output debug messages (🤖 [CLAUDE timestamp])
        if (output.includes('🤖 [CLAUDE') && output.includes(']')) {
            // Skip Claude output messages in terminal section
            return;
        }

        // Add to debug terminal content (this is just debug info, so we append)
        debugTerminalContent += output;

        // Parse ANSI escape codes for terminal output
        const htmlOutput = parseAnsiToHtml(debugTerminalContent);

        // Replace the entire content safely
        terminalOutput.innerHTML = '';
        const outputElement = document.createElement('div');
        outputElement.style.cssText = 'white-space: pre; word-wrap: break-word; line-height: 1.4; font-family: inherit;';
        outputElement.innerHTML = htmlOutput;
        terminalOutput.appendChild(outputElement);

        // Auto-scroll to bottom
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    } catch (error) {
        console.error('Error appending to terminal:', error);
    }
}

// ANSI Color palette for 256-color mode
const ansiColors = {
    // Standard colors (0-15)
    0: '#000000', 1: '#cd0000', 2: '#00cd00', 3: '#cdcd00', 4: '#0000ee', 5: '#cd00cd', 6: '#00cdcd', 7: '#e5e5e5',
    8: '#7f7f7f', 9: '#ff0000', 10: '#00ff00', 11: '#ffff00', 12: '#5c5cff', 13: '#ff00ff', 14: '#00ffff', 15: '#ffffff',
    // More colors including common Claude colors
    52: '#5f0000', 88: '#870000', 124: '#af0000', 160: '#d70000', 196: '#ff0000',
    114: '#87d787', 118: '#87ff00', 148: '#afd700', 154: '#afff00', 190: '#d7ff00',
    174: '#d787af', 175: '#d787d7', 176: '#d787ff', 177: '#d7af5f', 178: '#d7af87',
    179: '#d7afaf', 180: '#d7afd7', 181: '#d7afff', 182: '#d7d75f', 183: '#d7d787',
    184: '#d7d7af', 185: '#d7d7d7', 186: '#d7d7ff', 187: '#d7ff5f', 188: '#d7ff87',
    189: '#d7ffaf', 190: '#d7ffd7', 191: '#d7ffff', 192: '#ff5f5f', 193: '#ff5f87',
    194: '#ff5faf', 195: '#ff5fd7', 196: '#ff5fff', 197: '#ff875f', 198: '#ff8787',
    199: '#ff87af', 200: '#ff87d7', 201: '#ff87ff', 202: '#ffaf5f', 203: '#ffaf87',
    204: '#ffafaf', 205: '#ffafd7', 206: '#ffafff', 207: '#ffd75f', 208: '#ffd787',
    209: '#ffd7af', 210: '#ffd7d7', 211: '#ffd7ff', 212: '#ffff5f', 213: '#ffff87',
    214: '#ffffaf', 215: '#ffffd7', 216: '#ffffff',
    // Claude specific colors
    220: '#ffd700', 231: '#ffffff', 244: '#808080', 246: '#949494',
    // Grays and commonly used colors
    232: '#080808', 233: '#121212', 234: '#1c1c1c', 235: '#262626', 236: '#303030', 237: '#3a3a3a',
    238: '#444444', 239: '#4e4e4e', 240: '#585858', 241: '#626262', 242: '#6c6c6c', 243: '#767676',
    244: '#808080', 245: '#8a8a8a', 246: '#949494', 247: '#9e9e9e', 248: '#a8a8a8', 249: '#b2b2b2',
    250: '#bcbcbc', 251: '#c6c6c6', 252: '#d0d0d0', 253: '#dadada', 254: '#e4e4e4', 255: '#eeeeee'
};

function parseAnsiToHtml(text) {
    // Remove cursor control sequences that don't affect display
    text = text.replace(/\x1b\[\?25[lh]/g, ''); // Show/hide cursor
    text = text.replace(/\x1b\[\?2004[lh]/g, ''); // Bracketed paste mode
    text = text.replace(/\x1b\[\?1004[lh]/g, ''); // Focus reporting
    text = text.replace(/\x1b\[[2-3]J/g, ''); // §
    text = text.replace(/\x1b\[H/g, ''); // Move cursor to home

    // Process the text line by line to handle carriage returns properly
    const lines = text.split('\n');
    const processedLines = [];

    for (let lineText of lines) {
        // Handle carriage returns within the line
        const parts = lineText.split('\r');
        let finalLine = '';

        for (let i = 0; i < parts.length; i++) {
            if (i === parts.length - 1) {
                // Last part - append normally
                finalLine += processAnsiInText(parts[i]);
            } else {
                // Not the last part - this will be overwritten by the next part
                finalLine = processAnsiInText(parts[i]);
            }
        }

        processedLines.push(finalLine);
    }

    return processedLines.join('\n');
}

function processAnsiInText(text) {
    let html = '';
    let currentStyles = {
        color: null,
        bold: false,
        italic: false,
        dim: false,
        reverse: false
    };

    // Split text into parts: text and ANSI escape sequences
    const parts = text.split(/(\x1b\[[0-9;]*m)/);

    for (let part of parts) {
        if (part.startsWith('\x1b[') && part.endsWith('m')) {
            // This is an ANSI color/style code
            const codes = part.slice(2, -1).split(';').filter(c => c !== '').map(Number);

            for (const code of codes) {
                if (code === 0 || code === 39) {
                    // Reset or default foreground color
                    currentStyles.color = null;
                    currentStyles.bold = false;
                    currentStyles.italic = false;
                    currentStyles.dim = false;
                    currentStyles.reverse = false;
                } else if (code === 1) {
                    currentStyles.bold = true;
                } else if (code === 22) {
                    currentStyles.bold = false;
                    currentStyles.dim = false;
                } else if (code === 2) {
                    currentStyles.dim = true;
                } else if (code === 3) {
                    currentStyles.italic = true;
                } else if (code === 23) {
                    currentStyles.italic = false;
                } else if (code === 7) {
                    currentStyles.reverse = true;
                } else if (code === 27) {
                    currentStyles.reverse = false;
                }
            }

            // Handle 256-color mode (38;5;n)
            for (let j = 0; j < codes.length - 2; j++) {
                if (codes[j] === 38 && codes[j + 1] === 5) {
                    const colorCode = codes[j + 2];
                    currentStyles.color = ansiColors[colorCode] || '#ffffff';
                    break;
                }
            }
        } else if (part.length > 0) {
            // This is actual text content - sanitize it
            let style = '';
            if (currentStyles.color) style += `color: ${currentStyles.color};`;
            if (currentStyles.bold) style += 'font-weight: bold;';
            if (currentStyles.italic) style += 'font-style: italic;';
            if (currentStyles.dim) style += 'opacity: 0.6;';
            if (currentStyles.reverse) style += 'background-color: #ffffff; color: #000000;';

            // Sanitize HTML characters
            const escapedText = sanitizeHtml(part);

            if (style) {
                html += `<span style="${style}">${escapedText}</span>`;
            } else {
                html += escapedText;
            }
        }
    }

    return html;
}

// Store Claude output content 
let claudeContent = '';
let lastRenderedContent = '';
let pendingClaudeOutput = null;
let claudeRenderTimer = null;
let lastClaudeRenderTime = 0;
let lastParsedContent = '';
let lastParsedHtml = '';
const CLAUDE_RENDER_THROTTLE_MS = 500; // 500ms = 2 times per second max (matches backend analysis)

function appendToClaudeOutput(output) {
    try {
        // Store the latest output
        pendingClaudeOutput = output;
        
        // Check if we need to throttle
        const now = Date.now();
        const timeSinceLastRender = now - lastClaudeRenderTime;
        
        if (timeSinceLastRender >= CLAUDE_RENDER_THROTTLE_MS) {
            // Enough time has passed, render immediately
            console.log('🎨 Rendering Claude output immediately');
            renderClaudeOutput();
        } else {
            // Schedule a delayed render if not already scheduled
            if (!claudeRenderTimer) {
                const delay = CLAUDE_RENDER_THROTTLE_MS - timeSinceLastRender;
                console.log(`⏰ Throttling Claude render for ${delay}ms`);
                claudeRenderTimer = setTimeout(() => {
                    renderClaudeOutput();
                }, delay);
            } else {
                console.log('🔄 Claude render already scheduled, updating pending output');
            }
        }
    } catch (error) {
        console.error('Error appending to Claude output:', error);
    }
}

function renderClaudeOutput() {
    if (!pendingClaudeOutput) {
        return;
    }
    
    const output = pendingClaudeOutput;
    pendingClaudeOutput = null;
    lastClaudeRenderTime = Date.now();
    
    // Clear the timer
    if (claudeRenderTimer) {
        clearTimeout(claudeRenderTimer);
        claudeRenderTimer = null;
    }
    
    console.log(`🎨 Rendering Claude output (${output.length} chars)`);
    
    // Now perform the actual rendering
    performClaudeRender(output);
}

function performClaudeRender(output) {
    try {
        const claudeContainer = document.getElementById('claudeOutputContainer');
        let claudeOutput = claudeContainer.querySelector('.claude-live-output');

        if (!claudeOutput) {
            claudeOutput = document.createElement('div');
            claudeOutput.className = 'claude-live-output';
            claudeContainer.appendChild(claudeOutput);
        }

        // Clear the ready message on first output
        const readyMessage = claudeOutput.querySelector('.claude-ready-message');
        if (readyMessage) {
            claudeOutput.innerHTML = '';
            claudeContent = '';
            lastRenderedContent = '';
            
            // Reset parsing cache
            lastParsedContent = '';
            lastParsedHtml = '';
        }

        // Check if this output contains screen clearing commands
        if (output.includes('\x1b[2J') || output.includes('\x1b[3J') || output.includes('\x1b[H')) {
            // Clear screen - replace entire content
            claudeContent = output;
            lastRenderedContent = output;
            claudeOutput.innerHTML = '';
            
            // Reset cache since this is a new screen
            lastParsedContent = '';
            lastParsedHtml = '';
            
            // Parse and render the new content
            const htmlOutput = parseAnsiToHtml(claudeContent);
            lastParsedContent = output;
            lastParsedHtml = htmlOutput;
            
            const outputElement = document.createElement('div');
            outputElement.style.cssText = 'white-space: pre; word-wrap: break-word; line-height: 1.4; font-family: inherit;';
            outputElement.innerHTML = htmlOutput;
            claudeOutput.appendChild(outputElement);
        } else {
            // No clear screen - this is the complete current screen content from backend
            // Only update if content has actually changed
            if (output !== lastRenderedContent) {
                claudeContent = output;
                lastRenderedContent = output;
                
                // Use cached parsing if content hasn't changed significantly
                let htmlOutput;
                if (output === lastParsedContent && lastParsedHtml) {
                    htmlOutput = lastParsedHtml;
                    console.log('📋 Using cached ANSI parsing result');
                } else {
                    // Parse and cache the result
                    htmlOutput = parseAnsiToHtml(claudeContent);
                    lastParsedContent = output;
                    lastParsedHtml = htmlOutput;
                    console.log('🔄 Parsing ANSI content');
                }
                
                // Replace the content efficiently
                claudeOutput.innerHTML = '';
                const outputElement = document.createElement('div');
                outputElement.style.cssText = 'white-space: pre; word-wrap: break-word; line-height: 1.4; font-family: inherit;';
                outputElement.innerHTML = htmlOutput;
                claudeOutput.appendChild(outputElement);
            } else {
                // Content hasn't changed, skip rendering
                return;
            }
        }

        // Auto-scroll to bottom
        claudeOutput.scrollTop = claudeOutput.scrollHeight;

        // Highlight the Claude output section briefly with new colors
        claudeOutput.style.borderColor = '#00ff88';
        claudeOutput.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
        setTimeout(() => {
            claudeOutput.style.borderColor = '#4a9eff';
            claudeOutput.style.boxShadow = '0 0 20px rgba(74, 158, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
        }, 800);
    } catch (error) {
        console.error('Error performing Claude render:', error);
    }
}

function showError(message) {
    try {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    } catch (error) {
        console.error('Error showing error message:', error);
    }
}

// File reference autocomplete functionality
let fileAutocompleteState = {
    isOpen: false,
    query: '',
    selectedIndex: 0,
    files: [],
    atPosition: -1,
    pagination: null,
    currentPage: 0,
    isLoading: false,
    pageScrollHandler: null
};

function getCaretCoordinates(textarea, caretPosition) {
    // Create a mirror div to calculate caret position
    const div = document.createElement('div');
    const style = getComputedStyle(textarea);
    
    // Copy relevant styles
    ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'padding', 'border', 'boxSizing'].forEach(prop => {
        div.style[prop] = style[prop];
    });
    
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.width = textarea.offsetWidth + 'px';
    div.style.height = 'auto';
    
    document.body.appendChild(div);
    
    // Get text up to caret position
    const textBeforeCaret = textarea.value.substring(0, caretPosition);
    div.textContent = textBeforeCaret;
    
    // Add a span to measure the exact position
    const span = document.createElement('span');
    span.textContent = '|';
    div.appendChild(span);
    
    const textareaRect = textarea.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const divRect = div.getBoundingClientRect();
    
    const coordinates = {
        top: textareaRect.top + (spanRect.top - divRect.top) + textarea.scrollTop,
        left: textareaRect.left + (spanRect.left - divRect.left)
    };
    
    document.body.removeChild(div);
    return coordinates;
}

function showFileAutocomplete(textarea, atPosition) {
    fileAutocompleteState.isOpen = true;
    fileAutocompleteState.atPosition = atPosition;
    fileAutocompleteState.selectedIndex = 0;
    
    // Create autocomplete container if it doesn't exist
    let autocompleteContainer = document.getElementById('fileAutocompleteContainer');
    if (!autocompleteContainer) {
        autocompleteContainer = document.createElement('div');
        autocompleteContainer.id = 'fileAutocompleteContainer';
        autocompleteContainer.className = 'file-autocomplete-container';
        document.body.appendChild(autocompleteContainer);
    }
    
    // Add scroll listener to close autocomplete when page scrolls
    if (fileAutocompleteState.pageScrollHandler) {
        window.removeEventListener('scroll', fileAutocompleteState.pageScrollHandler);
        document.removeEventListener('scroll', fileAutocompleteState.pageScrollHandler);
    }
    
    fileAutocompleteState.pageScrollHandler = () => {
        hideFileAutocomplete();
    };
    
    // Add new scroll listeners
    window.addEventListener('scroll', fileAutocompleteState.pageScrollHandler, { passive: true });
    document.addEventListener('scroll', fileAutocompleteState.pageScrollHandler, { passive: true });
    
    // Get caret position for precise positioning
    const caretCoords = getCaretCoordinates(textarea, atPosition + 1);
    
    // Position the autocomplete menu near the caret
    autocompleteContainer.style.cssText = `
        position: fixed;
        top: ${caretCoords.top + 20}px;
        left: ${caretCoords.left}px;
        width: 280px;
        max-height: 150px;
        background: var(--vscode-dropdown-background);
        border: 1px solid var(--vscode-dropdown-border);
        border-radius: 6px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        z-index: 10000;
        overflow-y: auto;
        display: block;
        font-size: 12px;
    `;
    
    // Show loading state
    autocompleteContainer.innerHTML = '<div class="file-autocomplete-loading">Loading files...</div>';
    
    // Request files from extension
    fileAutocompleteState.currentPage = 0;
    vscode.postMessage({
        command: 'getWorkspaceFiles',
        query: '',
        page: 0
    });
}

function hideFileAutocomplete() {
    fileAutocompleteState.isOpen = false;
    fileAutocompleteState.query = '';
    fileAutocompleteState.selectedIndex = 0;
    fileAutocompleteState.files = [];
    fileAutocompleteState.atPosition = -1;
    fileAutocompleteState.pagination = null;
    fileAutocompleteState.currentPage = 0;
    fileAutocompleteState.isLoading = false;
    
    const autocompleteContainer = document.getElementById('fileAutocompleteContainer');
    if (autocompleteContainer) {
        autocompleteContainer.style.display = 'none';
        // Remove scroll listener to prevent memory leaks
        autocompleteContainer.removeEventListener('scroll', handleInfiniteScroll);
    }
    
    // Remove page scroll listeners to prevent memory leaks
    if (fileAutocompleteState.pageScrollHandler) {
        window.removeEventListener('scroll', fileAutocompleteState.pageScrollHandler);
        document.removeEventListener('scroll', fileAutocompleteState.pageScrollHandler);
        fileAutocompleteState.pageScrollHandler = null;
    }
}

function updateFileAutocomplete(query) {
    fileAutocompleteState.query = query;
    fileAutocompleteState.selectedIndex = 0;
    fileAutocompleteState.currentPage = 0;
    
    // Request filtered files from extension
    vscode.postMessage({
        command: 'getWorkspaceFiles',
        query: query,
        page: 0
    });
}

// Removed old pagination functions - now using infinite scroll

function renderFileAutocomplete(files, pagination = null) {
    const autocompleteContainer = document.getElementById('fileAutocompleteContainer');
    if (!autocompleteContainer || !fileAutocompleteState.isOpen) {
        return;
    }
    
    // For first page or new query, replace content
    if (fileAutocompleteState.currentPage === 0) {
        fileAutocompleteState.files = files;
        fileAutocompleteState.pagination = pagination;
        
        if (files.length === 0) {
            autocompleteContainer.innerHTML = '<div class="file-autocomplete-empty">No files found</div>';
            return;
        }
        
        let html = '';
        
        // Add header with total count
        if (pagination && pagination.totalResults > 0) {
            html += `
                <div class="file-autocomplete-header">
                    <span class="file-count">${pagination.totalResults} files found</span>
                    ${pagination.hasNextPage ? '<span class="loading-more">Scroll for more...</span>' : ''}
                </div>
            `;
        }
        
        files.forEach((file, index) => {
            const isSelected = index === fileAutocompleteState.selectedIndex;
            html += `
                <div class="file-autocomplete-item ${isSelected ? 'selected' : ''}" data-index="${index}" id="file-item-${index}">
                    <div class="file-name">${sanitizeHtml(file.name)}</div>
                    <div class="file-path">${sanitizeHtml(file.path)}</div>
                </div>
            `;
        });
        
        // Add loading indicator if there are more pages
        if (pagination && pagination.hasNextPage) {
            html += '<div class="file-autocomplete-loading-more" id="loadingMore">Loading more files...</div>';
        }
        
        autocompleteContainer.innerHTML = html;
        
        // Setup infinite scroll
        setupInfiniteScroll();
    } else {
        // Append new files for infinite scroll
        // Preserve scroll position to prevent jumping
        const scrollTop = autocompleteContainer.scrollTop;
        const scrollHeight = autocompleteContainer.scrollHeight;
        
        fileAutocompleteState.files = fileAutocompleteState.files.concat(files);
        fileAutocompleteState.pagination = pagination;
        
        // Remove loading indicator
        const loadingMore = document.getElementById('loadingMore');
        if (loadingMore) {
            loadingMore.remove();
        }
        
        // Append new files
        files.forEach((file, index) => {
            const globalIndex = fileAutocompleteState.files.length - files.length + index;
            const fileItem = document.createElement('div');
            fileItem.className = 'file-autocomplete-item';
            fileItem.setAttribute('data-index', globalIndex);
            fileItem.id = `file-item-${globalIndex}`;
            fileItem.innerHTML = `
                <div class="file-name">${sanitizeHtml(file.name)}</div>
                <div class="file-path">${sanitizeHtml(file.path)}</div>
            `;
            fileItem.addEventListener('click', () => {
                selectFileReference(globalIndex);
            });
            autocompleteContainer.appendChild(fileItem);
        });
        
        // Add new loading indicator if there are more pages
        if (pagination && pagination.hasNextPage) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'file-autocomplete-loading-more';
            loadingDiv.id = 'loadingMore';
            loadingDiv.textContent = 'Loading more files...';
            autocompleteContainer.appendChild(loadingDiv);
        }
        
        // Maintain scroll position - keep user at same relative position
        requestAnimationFrame(() => {
            autocompleteContainer.scrollTop = scrollTop;
        });
    }
    
    // Only scroll selected item into view for first page to avoid jumping
    if (fileAutocompleteState.currentPage === 0) {
        scrollSelectedItemIntoView();
    }
    
    // Add click handlers for first page items
    if (fileAutocompleteState.currentPage === 0) {
        autocompleteContainer.querySelectorAll('.file-autocomplete-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                selectFileReference(index);
            });
        });
    }
}

function setupInfiniteScroll() {
    const autocompleteContainer = document.getElementById('fileAutocompleteContainer');
    if (!autocompleteContainer) return;
    
    // Remove existing scroll listener
    autocompleteContainer.removeEventListener('scroll', handleInfiniteScroll);
    
    // Add new scroll listener
    autocompleteContainer.addEventListener('scroll', handleInfiniteScroll);
}

function handleInfiniteScroll(event) {
    const container = event.target;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // Load more when scrolled to bottom 90% (less aggressive triggering)
    if (scrollTop + clientHeight >= scrollHeight * 0.9) {
        loadMoreFiles();
    }
}

function loadMoreFiles() {
    if (fileAutocompleteState.pagination && 
        fileAutocompleteState.pagination.hasNextPage && 
        !fileAutocompleteState.isLoading) {
        
        fileAutocompleteState.isLoading = true;
        fileAutocompleteState.currentPage++;
        
        vscode.postMessage({
            command: 'getWorkspaceFiles',
            query: fileAutocompleteState.query,
            page: fileAutocompleteState.currentPage
        });
        
        // Reset loading flag after request
        setTimeout(() => {
            fileAutocompleteState.isLoading = false;
        }, 100);
    }
}

function scrollSelectedItemIntoView() {
    const autocompleteContainer = document.getElementById('fileAutocompleteContainer');
    const selectedItem = document.getElementById(`file-item-${fileAutocompleteState.selectedIndex}`);
    
    if (autocompleteContainer && selectedItem) {
        const containerRect = autocompleteContainer.getBoundingClientRect();
        const itemRect = selectedItem.getBoundingClientRect();
        
        // Check if item is above visible area
        if (itemRect.top < containerRect.top) {
            selectedItem.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
        // Check if item is below visible area
        else if (itemRect.bottom > containerRect.bottom) {
            selectedItem.scrollIntoView({ block: 'end', behavior: 'smooth' });
        }
    }
}

function selectFileReference(index) {
    if (!fileAutocompleteState.isOpen || index >= fileAutocompleteState.files.length) {
        return;
    }
    
    const selectedFile = fileAutocompleteState.files[index];
    const textarea = document.getElementById('messageInput');
    const currentValue = textarea.value;
    
    // Find the @ position and replace with file reference
    const beforeAt = currentValue.substring(0, fileAutocompleteState.atPosition);
    const afterQuery = currentValue.substring(fileAutocompleteState.atPosition + 1 + fileAutocompleteState.query.length);
    
    const newValue = beforeAt + '@' + selectedFile.path + ' ' + afterQuery;
    textarea.value = newValue;
    
    // Position cursor after the inserted file reference
    const newCursorPosition = beforeAt.length + selectedFile.path.length + 2;
    textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    
    hideFileAutocomplete();
    textarea.focus();
}

function handleAutocompleteNavigation(event) {
    if (!fileAutocompleteState.isOpen) {
        return false;
    }
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            fileAutocompleteState.selectedIndex = Math.min(
                fileAutocompleteState.selectedIndex + 1,
                fileAutocompleteState.files.length - 1
            );
            renderFileAutocomplete(fileAutocompleteState.files);
            return true;
            
        case 'ArrowUp':
            event.preventDefault();
            fileAutocompleteState.selectedIndex = Math.max(
                fileAutocompleteState.selectedIndex - 1,
                0
            );
            renderFileAutocomplete(fileAutocompleteState.files);
            return true;
            
        case 'Enter':
        case 'Tab':
            event.preventDefault();
            selectFileReference(fileAutocompleteState.selectedIndex);
            return true;
            
        case 'Escape':
            event.preventDefault();
            hideFileAutocomplete();
            return true;
            
        default:
            return false;
    }
}

// Handle Enter key in textarea and file autocomplete
document.getElementById('messageInput').addEventListener('keydown', function (event) {
    // Handle autocomplete navigation first
    if (handleAutocompleteNavigation(event)) {
        return;
    }
    
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        addMessage();
    }
});

// Handle input changes to detect @ symbol and update autocomplete
document.getElementById('messageInput').addEventListener('input', function (event) {
    const textarea = event.target;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    
    // Find the last @ symbol before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
        // Check if @ is at start or preceded by whitespace
        const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
        if (charBeforeAt === ' ' || charBeforeAt === '\n' || charBeforeAt === '\t' || lastAtIndex === 0) {
            // Extract query after @
            const queryAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            
            // Check if query contains spaces or newlines (invalid for file reference)
            if (!queryAfterAt.includes(' ') && !queryAfterAt.includes('\n') && !queryAfterAt.includes('\t')) {
                if (!fileAutocompleteState.isOpen) {
                    showFileAutocomplete(textarea, lastAtIndex);
                } else if (queryAfterAt !== fileAutocompleteState.query) {
                    updateFileAutocomplete(queryAfterAt);
                }
                return;
            }
        }
    }
    
    // Hide autocomplete if conditions not met
    if (fileAutocompleteState.isOpen) {
        hideFileAutocomplete();
    }
});

// Hide autocomplete when clicking outside
document.addEventListener('click', function (event) {
    const autocompleteContainer = document.getElementById('fileAutocompleteContainer');
    const messageInput = document.getElementById('messageInput');
    
    if (fileAutocompleteState.isOpen && 
        !autocompleteContainer?.contains(event.target) && 
        event.target !== messageInput) {
        hideFileAutocomplete();
    }
});

// Handle keyboard navigation in Claude output area
document.addEventListener('DOMContentLoaded', function () {
    const claudeOutput = document.getElementById('claudeOutputContainer');

    // Make the Claude output area focusable
    claudeOutput.addEventListener('click', function () {
        const outputElement = claudeOutput.querySelector('.claude-live-output');
        if (outputElement) {
            outputElement.focus();
        }
    });

    // Handle keyboard navigation when Claude output is focused
    claudeOutput.addEventListener('keydown', function (event) {
        const outputElement = claudeOutput.querySelector('.claude-live-output');
        if (!outputElement || document.activeElement !== outputElement) {
            return;
        }

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                // Send up arrow to Claude
                vscode.postMessage({
                    command: 'claudeKeypress',
                    key: 'up'
                });
                break;
            case 'ArrowDown':
                event.preventDefault();
                // Send down arrow to Claude
                vscode.postMessage({
                    command: 'claudeKeypress',
                    key: 'down'
                });
                break;
            case 'ArrowLeft':
                event.preventDefault();
                // Send left arrow to Claude
                vscode.postMessage({
                    command: 'claudeKeypress',
                    key: 'left'
                });
                break;
            case 'ArrowRight':
                event.preventDefault();
                // Send right arrow to Claude
                vscode.postMessage({
                    command: 'claudeKeypress',
                    key: 'right'
                });
                break;
            case 'Enter':
                event.preventDefault();
                // Send enter to Claude
                vscode.postMessage({
                    command: 'claudeKeypress',
                    key: 'enter'
                });
                break;
            case 'Escape':
                event.preventDefault();
                // Send escape to Claude
                vscode.postMessage({
                    command: 'claudeKeypress',
                    key: 'escape'
                });
                break;
        }
    });
    
    // Initialize button states and load history
    updateButtonStates();
    loadHistory();
});

// Cleanup function to flush any pending Claude output before page closes
window.addEventListener('beforeunload', function() {
    if (claudeRenderTimer) {
        clearTimeout(claudeRenderTimer);
        claudeRenderTimer = null;
    }
    if (pendingClaudeOutput) {
        performClaudeRender(pendingClaudeOutput);
        pendingClaudeOutput = null;
    }
    
    // Reset parsing cache
    lastParsedContent = '';
    lastParsedHtml = '';
});


// Initialize sleep prevention checkbox from VS Code settings
window.addEventListener('DOMContentLoaded', function() {
    
    // Check if development mode is enabled
    vscode.postMessage({
        command: 'getDevelopmentModeSetting'
    });
});

// Development mode state
let isDevelopmentMode = false;

// Debug functions
function simulateUsageLimit() {
    vscode.postMessage({
        command: 'simulateUsageLimit'
    });
}

function clearAllTimers() {
    vscode.postMessage({
        command: 'clearAllTimers'
    });
}

function debugQueueState() {
    vscode.postMessage({
        command: 'debugQueueState'
    });
}

function toggleDebugMode() {
    vscode.postMessage({
        command: 'toggleDebugLogging'
    });
}

// Show/hide development mode sections
function updateDevelopmentModeUI(enabled) {
    isDevelopmentMode = enabled;
    
    const debugSection = document.getElementById('debugSection');
    const terminalSection = document.querySelector('.terminal-section');
    
    if (debugSection) {
        debugSection.style.display = enabled ? 'block' : 'none';
    }
    
    if (terminalSection) {
        terminalSection.style.display = enabled ? 'block' : 'none';
    }
}

