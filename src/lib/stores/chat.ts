import { writable, derived, get } from 'svelte/store';
import type { Conversation, Message, StreamChunk, AgentStep } from '$types/core';

export const conversations = writable<Conversation[]>([]);
export const activeConversationId = writable<string | null>(null);
export const messages = writable<Message[]>([]);
export const isStreaming = writable(false);
export const streamingContent = writable('');
export const agentSteps = writable<AgentStep[]>([]);
export const inputMessage = writable('');
export const error = writable<string | null>(null);

// AbortController for stopping generation - inspired by chat-ui/open-webui stop button
let currentAbortController: AbortController | null = null;

export function stopStreaming(): void {
	if (currentAbortController) {
		currentAbortController.abort();
		currentAbortController = null;
	}
	isStreaming.set(false);
	streamingContent.set('');
}

export const activeConversation = derived(
	[conversations, activeConversationId],
	([$conversations, $activeId]) => {
		return $activeId ? $conversations.find((c) => c.id === $activeId) || null : null;
	}
);

export async function loadConversations(): Promise<void> {
	try {
		const res = await fetch('/api/conversations');
		if (res.ok) {
			const data = await res.json();
			conversations.set(data.conversations);
		}
	} catch (err) {
		error.set('Failed to load conversations');
	}
}

export async function createConversation(mode: 'chat' | 'agent', model: string): Promise<string> {
	const res = await fetch('/api/conversations', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ mode, model })
	});

	if (!res.ok) throw new Error('Failed to create conversation');

	const data = await res.json();
	conversations.update((convs) => [data.conversation, ...convs]);
	activeConversationId.set(data.conversation.id);
	messages.set([]);
	agentSteps.set([]);
	return data.conversation.id;
}

export async function loadMessages(conversationId: string): Promise<void> {
	try {
		const res = await fetch(`/api/conversations/${conversationId}/messages`);
		if (res.ok) {
			const data = await res.json();
			messages.set(data.messages);
		}
	} catch (err) {
		error.set('Failed to load messages');
	}
}

export async function selectConversation(conversationId: string): Promise<void> {
	activeConversationId.set(conversationId);
	agentSteps.set([]);
	await loadMessages(conversationId);
}

export async function deleteConversation(conversationId: string): Promise<void> {
	const res = await fetch(`/api/conversations/${conversationId}`, { method: 'DELETE' });
	if (res.ok) {
		conversations.update((convs) => convs.filter((c) => c.id !== conversationId));
		if (get(activeConversationId) === conversationId) {
			activeConversationId.set(null);
			messages.set([]);
		}
	}
}

export async function renameConversation(conversationId: string, title: string): Promise<void> {
	const res = await fetch(`/api/conversations/${conversationId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ title })
	});

	if (res.ok) {
		conversations.update((convs) =>
			convs.map((c) => (c.id === conversationId ? { ...c, title } : c))
		);
	}
}

export async function sendMessage(content: string): Promise<void> {
	const convId = get(activeConversationId);
	if (!convId || !content.trim()) return;

	const conv = get(conversations).find((c) => c.id === convId);
	if (!conv) return;

	// Add user message immediately
	const userMsg: Message = {
		id: crypto.randomUUID(),
		conversationId: convId,
		role: 'user',
		content,
		createdAt: new Date().toISOString()
	};
	messages.update((msgs) => [...msgs, userMsg]);
	inputMessage.set('');
	isStreaming.set(true);
	streamingContent.set('');
	agentSteps.set([]);
	error.set(null);

	try {
		currentAbortController = new AbortController();
		const endpoint = conv.mode === 'agent' ? '/api/agent' : '/api/chat';
		const res = await fetch(endpoint, {
			signal: currentAbortController.signal,
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				conversationId: convId,
				message: content,
				model: conv.model
			})
		});

		if (!res.ok) {
			const errData = await res.json().catch(() => ({ message: 'Request failed' }));
			throw new Error(errData.message || `HTTP ${res.status}`);
		}

		if (!res.body) throw new Error('No response body');

		const reader = res.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let fullContent = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed || !trimmed.startsWith('data: ')) continue;
				const data = trimmed.slice(6);
				if (data === '[DONE]') continue;

				try {
					const chunk: StreamChunk = JSON.parse(data);

					switch (chunk.type) {
						case 'text':
							fullContent += chunk.content || '';
							streamingContent.set(fullContent);
							break;
						case 'agent_step':
							if (chunk.agentStep) {
								agentSteps.update((steps) => {
									const idx = steps.findIndex((s) => s.id === chunk.agentStep!.id);
									if (idx >= 0) {
										steps[idx] = chunk.agentStep!;
										return [...steps];
									}
									return [...steps, chunk.agentStep!];
								});
							}
							break;
						case 'tool_result':
							// Tool results are shown via agent steps
							break;
						case 'error':
							error.set(chunk.error || 'Unknown error');
							break;
						case 'done':
							break;
					}
				} catch {
					// Skip parse errors
				}
			}
		}

		// Add assistant message
		if (fullContent) {
			const assistantMsg: Message = {
				id: crypto.randomUUID(),
				conversationId: convId,
				role: 'assistant',
				content: fullContent,
				model: conv.model,
				createdAt: new Date().toISOString(),
				metadata: {
					agentSteps: get(agentSteps)
				}
			};
			messages.update((msgs) => [...msgs, assistantMsg]);
		}

		// Auto-title the conversation from first message
		const allConvs = get(conversations);
		const currentConv = allConvs.find((c) => c.id === convId);
		if (currentConv && currentConv.title === 'New Conversation' && content.length > 5) {
			const title = content.slice(0, 60) + (content.length > 60 ? '...' : '');
			renameConversation(convId, title);
		}
	} catch (err) {
		if (err instanceof DOMException && err.name === 'AbortError') {
			// User cancelled - not an error
		} else {
			error.set(err instanceof Error ? err.message : 'Failed to send message');
		}
	} finally {
		currentAbortController = null;
		isStreaming.set(false);
		streamingContent.set('');
	}
}
