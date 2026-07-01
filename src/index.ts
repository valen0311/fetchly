export { FetchlyClient } from './core/index.js';
export { FetchlyEventEmitter } from './events/index.js';
export type {
  FetchlyConfig,
  FetchlyError,
  FetchlyResponse,
  RequestOptions,
  HttpMethod,
} from './types/index.js';
export type {
  FetchlyEventType,
  FetchlyEventMap,
  SuccessEventData,
  ErrorEventData,
  RetryEventData,
  TimeoutEventData,
} from './events/index.js';