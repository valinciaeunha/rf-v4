import fs from 'fs';
import path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LoggerConfig {
    enableFileLogging: boolean;
    storagePath: string;
    logToConsole: boolean;
}

// Configuration defaults
const config: LoggerConfig = {
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
    storagePath: path.join(process.cwd(), 'storage', 'logs'),
    logToConsole: true, // Always log to console by default (container friendly)
};

// Ensure log directory exists
function ensureLogDirectory() {
    if (config.enableFileLogging) {
        try {
            if (!fs.existsSync(config.storagePath)) {
                fs.mkdirSync(config.storagePath, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create log directory:', error);
            // Fallback: Disable file logging if we can't write
            config.enableFileLogging = false;
        }
    }
}

// Get current date for filename (YYYY-MM-DD)
function getLogFilename(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return path.join(config.storagePath, `${year}-${month}-${day}.log`);
}

// Format log entry
function formatLogMessage(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    let contextStr = '';

    if (context) {
        if (context instanceof Error) {
            contextStr = ` [Stack: ${context.stack}]`;
        } else if (typeof context === 'object') {
            try {
                contextStr = ` ${JSON.stringify(context)}`;
            } catch (e) {
                contextStr = ` [Circular/Unserializable Context]`;
            }
        } else {
            contextStr = ` ${context}`;
        }
    }

    return `[${timestamp}] [${level.toUpperCase()}]: ${message}${contextStr}\n`;
}

// Internal writer
async function writeToFile(message: string) {
    if (!config.enableFileLogging) return;

    try {
        const file = getLogFilename();
        await fs.promises.appendFile(file, message, 'utf8');
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }
}

// Main Logger Object
export const logger = {
    init: () => {
        ensureLogDirectory();
    },

    info: (message: string, context?: any) => {
        if (config.logToConsole) console.log(message, context || '');
        const formatted = formatLogMessage('info', message, context);
        writeToFile(formatted);
    },

    warn: (message: string, context?: any) => {
        if (config.logToConsole) console.warn(message, context || '');
        const formatted = formatLogMessage('warn', message, context);
        writeToFile(formatted);
    },

    error: (message: string, context?: any) => {
        if (config.logToConsole) console.error(message, context || '');
        const formatted = formatLogMessage('error', message, context);
        writeToFile(formatted);
    },

    debug: (message: string, context?: any) => {
        // Only log debug if explicit setting is on, or in Dev
        if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') {
            if (config.logToConsole) console.debug(message, context || '');
            const formatted = formatLogMessage('debug', message, context);
            writeToFile(formatted);
        }
    }
};

// Auto-init on import (safe for serverless usually, but explicit init is better if strict)
// We'll auto-init lazily when writing if needed, but here we do it once.
ensureLogDirectory();
