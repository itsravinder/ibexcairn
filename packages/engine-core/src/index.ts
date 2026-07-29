/**
 * Headless engine core: the source parsers and the intermediate representation,
 * lifted from the upstream fork with vscode and telemetry removed (S02).
 *
 * Namespaced to avoid name collisions between the parser and IR type surfaces.
 */
export * as parsers from './parsers';
export * as ir from './ir';
export { LoggingService, LogLevel, type LogMetadata } from './services/LoggingService';
export type { CancellationToken } from './compat/vscode';
