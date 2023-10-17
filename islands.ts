import { main, each, spawn, resource, suspend, type Operation, type Stream } from "effection";

import { type Slot } from "./types.ts";
import { CurrentSlot } from "./mod.ts";
import Counter from "./Counter.tsx";

await main(function*() {

  let stack: Boundary[] = [];

  for (let boundary of yield* each(boundaries(document))) {
    if (boundary.end) {
      let top = stack.pop();
      if (!top) {
        throw new Error(`found closing tag with no opener: {boundary.node.data}`)
      } else if (boundary.id !== top.id) {
        throw new Error(`mismatched `)
      } else {
        yield* useIsland({
          start: top,
          end: boundary,
        });
      }
    } else {
      stack.push(boundary);
    }
    yield* each.next;
  }

  yield* suspend();
});

function matchBoundary(node: Comment): Boundary | void {
  let { data } = node;
  let match = data.match(/^<(\/?)@(\w+):(\d+)>$/);
  if (match) {
    let [, flag, tagname, idx ] = match;
    let end = flag === "/";
    return {
      start: !end,
      end,
      tagname,
      id: `${tagname}:${Number(idx)}`,
      idx: Number(idx),
      node,
    }
  }
}

interface UseIslandOptions {
  start: Boundary;
  end: Boundary;
}

function useIsland(options: UseIslandOptions): Operation<void> {

  return resource(function*(provide) {
    let slot = createSlot(options.start.node, options.end.node);
    yield* spawn(function*() {
      yield* CurrentSlot.set(slot);
      yield* Counter();
    });

    yield* provide();
  });
}

interface Boundary {
  start: boolean;
  end: boolean;
  tagname: string;
  idx: number;
  id: string;
  node: Node;
}

function* commentsOf(document: Document): Stream<Comment, void> {
  let iterator = document.createNodeIterator(
    document.body,
    NodeFilter.SHOW_COMMENT,
  );
  return {
    *next() {
      let value = iterator.nextNode() as Comment | null;
      if (value) {
        return { done: false, value };
      } else {
        return { done: true, value: void 0 };
      }
    }
  }
}

function* boundaries(document: Document): Stream<Boundary, void> {
  let comments = yield* commentsOf(document);

  return {
    *next() {
      while (true) {
        let next = yield* comments.next();
        if (next.done) {
          return next;
        } else {
          let value = matchBoundary(next.value);
          if (value) {
            return { done: false, value };
          }
        }
      }
    }
  }
}

function createSlot(start: Node, end: Node): Slot {
  return {
    replace(...nodes) {
      let parent = start.parentElement!;
      let next = start.nextSibling;
      while (next !== end) {
        parent.removeChild(next!);
        next = start.nextSibling;
      }
      for (let node of nodes) {
        parent.insertBefore(node, end);
      }
    }
  }
}
