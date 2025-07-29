export interface HandoverContext {
    timestamp: string;
    sessionId: string;
    projectName: string;
    queueLength: number;
    completedMessages: number;
    lastMessage: string;
    currentTask: string;
}

export function generateHandoverPrompt(context: HandoverContext): string {
    const timestamp = new Date(context.timestamp).toLocaleString();
    
    return `Create a comprehensive handover document for project "${context.projectName}" based on the current Claude Code session.

**Session Context:**
- Timestamp: ${timestamp}
- Session ID: ${context.sessionId}
- Queue Status: ${context.completedMessages} completed, ${context.queueLength} remaining
- Last processed message: "${context.lastMessage.substring(0, 100)}${context.lastMessage.length > 100 ? '...' : ''}"
- Current task context: ${context.currentTask}

**Required Handover Document Structure:**

## Project Status Summary
Provide a concise overview of what has been accomplished in this session and the current state of the project.

## Current Task Progress
Detail the specific task or feature being worked on, including:
- What has been completed
- What is currently in progress
- Any blockers or issues encountered

## Technical Context
Include relevant technical details:
- File paths that have been modified or created
- Key functions, classes, or components involved
- Dependencies or libraries being used
- Architecture decisions made

## Queue Analysis
Analyze the remaining messages in the queue and categorize them by:
- Priority level (high/medium/low)
- Task type (feature, bug fix, refactor, etc.)
- Dependencies between tasks

## Next Steps Recommendation
Provide clear guidance for continuing the work:
- Immediate next actions to take
- Suggested order for processing remaining queue items
- Any preparatory work needed

## Important Notes
Include any critical information that would be essential for someone picking up this work:
- Temporary workarounds in place
- Configuration changes made
- Testing requirements
- Deployment considerations

**Instructions:** 
- Be specific and actionable
- Include exact file paths and line numbers where relevant
- Highlight any urgent or time-sensitive items
- Format the document in clear markdown
- Keep it comprehensive but concise (aim for 500-1000 words)

Generate this handover document now based on the current session state.`;
}

export function generateContinuationPrompt(handoverDocumentName: string, originalTask: string): string {
    return `Using the handover document "${handoverDocumentName}", continue working on the project where the previous session left off.

**Context:**
- A comprehensive handover document has been created with the name "${handoverDocumentName}"
- The original task being worked on was: "${originalTask}"
- This is a continuation of a previous Claude Code session that hit usage limits

**Instructions:**
1. First, review the handover document to understand the current project state
2. Identify the immediate next steps from the handover recommendations
3. Continue with the work as outlined in the handover document
4. Process any remaining tasks in the queue based on the priority and dependencies noted in the handover

**Important:**
- Follow the technical context and architecture decisions from the handover
- Pay attention to any blockers or issues mentioned
- Maintain consistency with the previous session's approach
- Reference the handover document as needed throughout the work

Begin by acknowledging receipt of this handover and then proceed with the next steps as outlined in the handover document.`;
}