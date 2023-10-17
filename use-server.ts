import type { Operation, Resolve, Reject, Result } from "effection";
import { expect, resource, createSignal } from "effection";

export interface Server {
  hostname: string;
  port: number;
}

export type ServeOptions = Deno.ServeInit & Deno.ServeOptions;

export function useServer(options: ServeOptions): Operation<Server> {
  return resource(function*(provide) {
    let controller = new AbortController();
    let { signal } = controller;

    let [listening, onListen] = yield* useDeferred<Server>();

    let { finished } = Deno.serve({
      ...options,
      signal,
      onListen,
    });

    let server = yield* listening;

    try {
      yield* provide(server);
    } finally {
      controller.abort();
      yield* expect(finished);
    }
  })
}


function* useDeferred<T>(): Operation<[Operation<T>, Resolve<T>, Reject]> {
  let signal = createSignal<never, Result<T>>();
  let subscription = yield* signal.stream;
  let result: Result<T> | undefined = void 0;

  let operation = {
    *[Symbol.iterator]() {
      if (!result) {
        result = (yield* subscription.next()).value;
      }
      if (result.ok) {
        return result.value;
      } else {
        throw result.error;
      }
    }
  }
  let resolve = (value: T) => signal.close({ ok: true, value });
  let reject = (error: Error) => signal.close({ ok: false, error });

  return [operation, resolve, reject];
}
