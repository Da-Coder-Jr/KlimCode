import type { StreamChunk } from '$types/core';

export function createSSEStream(generator: AsyncGenerator<StreamChunk>): ReadableStream {
	return new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			try {
				for await (const chunk of generator) {
					const data = JSON.stringify(chunk);
					controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				}
				controller.enqueue(encoder.encode('data: [DONE]\n\n'));
			} catch (error) {
				const errChunk: StreamChunk = {
					type: 'error',
					error: error instanceof Error ? error.message : 'Unknown streaming error'
				};
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(errChunk)}\n\n`));
			} finally {
				controller.close();
			}
		}
	});
}

export function sseResponse(stream: ReadableStream): Response {
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
}

export async function* mergeToolCallChunks(
	chunks: AsyncGenerator<StreamChunk>
): AsyncGenerator<StreamChunk> {
	let currentToolCall: { id: string; name: string; arguments: string } | null = null;

	for await (const chunk of chunks) {
		if (chunk.type === 'tool_call' && chunk.toolCall) {
			if (chunk.toolCall.id && chunk.toolCall.function.name) {
				// Start of a new tool call
				if (currentToolCall) {
					yield {
						type: 'tool_call',
						toolCall: {
							id: currentToolCall.id,
							type: 'function',
							function: {
								name: currentToolCall.name,
								arguments: currentToolCall.arguments
							}
						}
					};
				}
				currentToolCall = {
					id: chunk.toolCall.id,
					name: chunk.toolCall.function.name,
					arguments: chunk.toolCall.function.arguments
				};
			} else if (currentToolCall && chunk.toolCall.function.arguments) {
				// Continuation of arguments
				currentToolCall.arguments += chunk.toolCall.function.arguments;
			}
		} else {
			if (currentToolCall) {
				yield {
					type: 'tool_call',
					toolCall: {
						id: currentToolCall.id,
						type: 'function',
						function: {
							name: currentToolCall.name,
							arguments: currentToolCall.arguments
						}
					}
				};
				currentToolCall = null;
			}
			yield chunk;
		}
	}

	if (currentToolCall) {
		yield {
			type: 'tool_call',
			toolCall: {
				id: currentToolCall.id,
				type: 'function',
				function: {
					name: currentToolCall.name,
					arguments: currentToolCall.arguments
				}
			}
		};
	}
}
