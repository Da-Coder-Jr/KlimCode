#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import open from 'open';
import { createServer } from 'net';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const BANNER = `
╔═══════════════════════════════════════════════╗
║                                               ║
║   ██╗  ██╗██╗     ██╗███╗   ███╗              ║
║   ██║ ██╔╝██║     ██║████╗ ████║              ║
║   █████╔╝ ██║     ██║██╔████╔██║              ║
║   ██╔═██╗ ██║     ██║██║╚██╔╝██║              ║
║   ██║  ██╗███████╗██║██║ ╚═╝ ██║              ║
║   ╚═╝  ╚═╝╚══════╝╚═╝╚═╝     ╚═╝              ║
║                                               ║
║   KlimCode — AI Agent Web UI                  ║
║   Powered by NVIDIA NIM                       ║
║                                               ║
╚═══════════════════════════════════════════════╝
`;

function findOpenPort(startPort) {
	return new Promise((resolve, reject) => {
		const server = createServer();
		server.listen(startPort, () => {
			const port = server.address().port;
			server.close(() => resolve(port));
		});
		server.on('error', () => {
			resolve(findOpenPort(startPort + 1));
		});
	});
}

function startServer(port, host) {
	const buildPath = resolve(ROOT, 'build', 'index.js');
	const isDev = !existsSync(buildPath);

	const env = {
		...process.env,
		PORT: String(port),
		HOST: host,
		KLIMCODE_PORT: String(port),
		KLIMCODE_HOST: host
	};

	if (isDev) {
		console.log(chalk.yellow('  Running in development mode...\n'));
		const child = spawn('npx', ['vite', 'dev', '--port', String(port), '--host', host], {
			cwd: ROOT,
			env,
			stdio: 'inherit'
		});
		return child;
	} else {
		console.log(chalk.green('  Running production build...\n'));
		const child = spawn('node', [buildPath], {
			cwd: ROOT,
			env,
			stdio: 'inherit'
		});
		return child;
	}
}

const program = new Command();

program
	.name('klimcode')
	.description('KlimCode — AI Agent Web UI powered by NVIDIA NIM')
	.version('1.0.0');

program
	.command('start')
	.description('Start the KlimCode server')
	.option('-p, --port <port>', 'Port to listen on', '7700')
	.option('-H, --host <host>', 'Host to bind to', '0.0.0.0')
	.option('--no-open', 'Do not open browser automatically')
	.action(async (opts) => {
		console.log(chalk.hex('#338dff')(BANNER));

		const port = await findOpenPort(parseInt(opts.port, 10));
		const host = opts.host;

		console.log(chalk.hex('#338dff')(`  Starting KlimCode on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}\n`));

		const child = startServer(port, host);

		if (opts.open !== false) {
			setTimeout(() => {
				open(`http://localhost:${port}`).catch(() => {});
			}, 2000);
		}

		process.on('SIGINT', () => {
			console.log(chalk.yellow('\n  Shutting down KlimCode...'));
			child.kill('SIGTERM');
			process.exit(0);
		});

		process.on('SIGTERM', () => {
			child.kill('SIGTERM');
			process.exit(0);
		});
	});

program
	.command('dev')
	.description('Start KlimCode in development mode')
	.option('-p, --port <port>', 'Port to listen on', '7700')
	.action(async (opts) => {
		console.log(chalk.hex('#338dff')(BANNER));

		const port = await findOpenPort(parseInt(opts.port, 10));
		console.log(chalk.hex('#338dff')(`  Starting KlimCode dev server on http://localhost:${port}\n`));

		const child = spawn('npx', ['vite', 'dev', '--port', String(port), '--host', '0.0.0.0'], {
			cwd: ROOT,
			env: { ...process.env, PORT: String(port) },
			stdio: 'inherit'
		});

		process.on('SIGINT', () => {
			child.kill('SIGTERM');
			process.exit(0);
		});
	});

program
	.command('build')
	.description('Build KlimCode for production')
	.action(() => {
		console.log(chalk.hex('#338dff')(BANNER));
		console.log(chalk.hex('#338dff')('  Building KlimCode for production...\n'));

		const child = spawn('npx', ['vite', 'build'], {
			cwd: ROOT,
			stdio: 'inherit'
		});

		child.on('close', (code) => {
			if (code === 0) {
				console.log(chalk.green('\n  Build complete! Run `klimcode start` to launch.\n'));
			} else {
				console.error(chalk.red('\n  Build failed.\n'));
				process.exit(1);
			}
		});
	});

// Default action: start
if (process.argv.length <= 2) {
	process.argv.push('start');
}

program.parse();
