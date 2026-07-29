/**
 * Headless replacement for the upstream LoggingService, which depended on the
 * VS Code OutputChannel and a Microsoft telemetry reporter. Same public surface
 * (singleton, LogLevel, debug/info/warn/error) so the lifted parsers need no
 * changes - but no `vscode` and no telemetry. See docs/specs/002-headless-extraction.md.
 */

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Silent = 4,
}

export type LogMetadata = Record<string, unknown>;

export class LoggingService {
  private static instance: LoggingService | undefined;
  private level: LogLevel = LogLevel.Info;

  static getInstance(): LoggingService {
    LoggingService.instance ??= new LoggingService();
    return LoggingService.instance;
  }

  /** No-op in headless mode; kept for API compatibility with the extension. */
  initialize(): void {
    /* intentionally empty */
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.write(LogLevel.Debug, message, undefined, metadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.write(LogLevel.Info, message, undefined, metadata);
  }

  warn(message: string, error?: Error | LogMetadata, metadata?: LogMetadata): void {
    const err = error instanceof Error ? error : undefined;
    const meta = error instanceof Error ? metadata : (error ?? metadata);
    this.write(LogLevel.Warn, message, err, meta);
  }

  error(message: string, error?: Error, metadata?: LogMetadata): void {
    this.write(LogLevel.Error, message, error, metadata);
  }

  showOutputChannel(): void {
    /* intentionally empty */
  }

  clear(): void {
    /* intentionally empty */
  }

  dispose(): void {
    /* intentionally empty */
  }

  private write(
    level: LogLevel,
    message: string,
    error?: Error,
    metadata?: LogMetadata,
  ): void {
    if (level < this.level) return;
    const parts: unknown[] = [`[${LogLevel[level]}] ${message}`];
    if (error) parts.push(error);
    if (metadata) parts.push(metadata);
    if (level >= LogLevel.Error) console.error(...parts);
    else if (level >= LogLevel.Warn) console.warn(...parts);
    else console.debug(...parts);
  }
}
