import crypto from 'crypto';

interface WebhookEvent {
	type: string;
	action?: string;
	payload: Record<string, unknown>;
}

export function verifyWebhookSignature(
	payload: string,
	signature: string,
	secret: string
): boolean {
	const hmac = crypto.createHmac('sha256', secret);
	hmac.update(payload, 'utf-8');
	const expectedSignature = `sha256=${hmac.digest('hex')}`;

	const sigBuffer = Buffer.from(signature);
	const expectedBuffer = Buffer.from(expectedSignature);

	// timingSafeEqual throws if lengths differ — reject mismatched lengths
	if (sigBuffer.length !== expectedBuffer.length) {
		return false;
	}

	return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

export function parseWebhookEvent(
	eventType: string,
	payload: Record<string, unknown>
): WebhookEvent {
	return {
		type: eventType,
		action: payload.action as string | undefined,
		payload
	};
}

export async function handlePullRequestEvent(event: WebhookEvent): Promise<{
	handled: boolean;
	message: string;
}> {
	const pr = event.payload.pull_request as Record<string, unknown>;

	if (!pr) {
		return { handled: false, message: 'No pull request data in event' };
	}

	const action = event.action;
	const prNumber = pr.number as number;
	const prTitle = pr.title as string;

	switch (action) {
		case 'opened':
			return {
				handled: true,
				message: `PR #${prNumber} opened: ${prTitle}`
			};

		case 'closed':
			if (pr.merged) {
				return {
					handled: true,
					message: `PR #${prNumber} merged: ${prTitle}`
				};
			}
			return {
				handled: true,
				message: `PR #${prNumber} closed: ${prTitle}`
			};

		case 'synchronize':
			return {
				handled: true,
				message: `PR #${prNumber} updated with new commits`
			};

		case 'review_requested':
			return {
				handled: true,
				message: `Review requested on PR #${prNumber}: ${prTitle}`
			};

		default:
			return {
				handled: false,
				message: `Unhandled PR action: ${action}`
			};
	}
}

export async function handlePushEvent(event: WebhookEvent): Promise<{
	handled: boolean;
	message: string;
}> {
	const ref = event.payload.ref as string;
	const commits = event.payload.commits as Array<{ message: string; id: string }>;
	const branch = ref.replace('refs/heads/', '');

	return {
		handled: true,
		message: `Push to ${branch}: ${commits?.length || 0} commit(s)`
	};
}
