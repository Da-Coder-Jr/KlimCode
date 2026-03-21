import type { User, Session } from '$types/core';

declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: Session;
		}
		interface Error {
			message: string;
			code?: string;
		}
	}
}

export {};
