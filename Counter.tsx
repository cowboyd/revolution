import { render } from "./mod.ts";
import { createSignal, type Operation } from "effection";

export default function* Counter(): Operation<void> {
  let signal = createSignal<MouseEvent>();

  let count = 0;

  let clicks = yield* signal.stream;

  while (true) {
    yield* render(<button onclick={signal.send}> Clicks: {count}</button>);
    yield* clicks.next();
    count++;
  }
}
