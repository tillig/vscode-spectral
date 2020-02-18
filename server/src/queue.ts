// BufferedMessageQueue and related classes/interfaces originated in the ESLint
// extension licensed under the MIT license.
// https://github.com/microsoft/vscode-eslint/blob/d40b96d4a2f0d085770b2bdce87b985bdd198bec/server/src/eslintServer.ts#L828
import {
  IConnection,
  NotificationHandler,
  NotificationType
} from 'vscode-languageserver';

/**
 * Defines a type of notification for which subscriptions in the queue can be raised.
 */
interface Notification<P> {
  method: string;
  params: P;
  documentVersion: number | undefined;
}

/**
 * An object that provides a document version.
 */
interface VersionProvider<P> {
  (params: P): number | undefined;
}

/**
 * Message queue for processing requests to lint a document. Ensures that a
 * given request is acting against the current version of the document to avoid
 * using up resources to run lint operations against a stale document version
 * where the results will no longer apply.
 */
export class BufferedMessageQueue {

  private queue: Notification<any>[];
  private notificationHandlers: Map<string, { handler: NotificationHandler<any>, versionProvider?: VersionProvider<any> }>;
  private timer: NodeJS.Immediate | undefined;

  constructor(private connection: IConnection) {
    this.queue = [];
    this.notificationHandlers = new Map();
  }

  public registerNotification<P, RO>(type: NotificationType<P, RO>, handler: NotificationHandler<P>, versionProvider?: (params: P) => number): void {
    this.connection.onNotification(type, (params) => {
      this.queue.push({
        method: type.method,
        params: params,
        documentVersion: versionProvider ? versionProvider(params) : undefined,
      });
      this.trigger();
    });
    this.notificationHandlers.set(type.method, { handler, versionProvider });
  }

  public addNotificationMessage<P, RO>(type: NotificationType<P, RO>, params: P, version: number) {
    this.queue.push({
      method: type.method,
      params,
      documentVersion: version
    });
    this.trigger();
  }

  public onNotification<P, RO>(type: NotificationType<P, RO>, handler: NotificationHandler<P>, versionProvider?: (params: P) => number): void {
    this.notificationHandlers.set(type.method, { handler, versionProvider });
  }

  private trigger(): void {
    if (this.timer || this.queue.length === 0) {
      return;
    }
    this.timer = setImmediate(() => {
      this.timer = undefined;
      this.processQueue();
      this.trigger();
    });
  }

  private processQueue(): void {
    const message = this.queue.shift() as Notification<any>;
    if (!message) {
      return;
    }
    const elem = this.notificationHandlers.get(message.method);
    if (elem === undefined) {
      throw new Error(`No handler registered`);
    }
    if (elem.versionProvider && message.documentVersion !== undefined && message.documentVersion !== elem.versionProvider(message.params)) {
      return;
    }
    elem.handler(message.params);
  }
}
