import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyWebhookSignature, parseWebhookEvent, handlePullRequestEvent, handlePushEvent } from '$server/github/webhook';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	const webhookSecret = env.KLIMCODE_GITHUB_WEBHOOK_SECRET;

	if (!webhookSecret) {
		return json({ message: 'Webhook secret not configured' }, { status: 500 });
	}

	const signature = request.headers.get('x-hub-signature-256');
	const eventType = request.headers.get('x-github-event');

	if (!signature || !eventType) {
		return json({ message: 'Missing required headers' }, { status: 400 });
	}

	const body = await request.text();

	if (!verifyWebhookSignature(body, signature, webhookSecret)) {
		return json({ message: 'Invalid signature' }, { status: 401 });
	}

	const payload = JSON.parse(body);
	const event = parseWebhookEvent(eventType, payload);

	let result;

	switch (eventType) {
		case 'pull_request':
			result = await handlePullRequestEvent(event);
			break;
		case 'push':
			result = await handlePushEvent(event);
			break;
		default:
			result = { handled: false, message: `Unhandled event: ${eventType}` };
	}

	return json(result);
};
