import type { Slot } from "./types.ts"
import { createContext, type Operation } from "effection";

export const CurrentSlot = createContext<Slot>('slot');

export function render(ast: JSX.Element): Operation<void> {
  return {
    *[Symbol.iterator]() {
      let nodes = toNodes(ast);
      let slot = yield* CurrentSlot;
      slot.replace(...nodes);
    }
  }
}


function toNodes(jsx: JSX.Element): Node[] {
  if (jsx.type === "text") {
    return [document.createTextNode(jsx.value)];
  } else if (jsx.type === "root") {
    let { children } = jsx;
    return children.flatMap(child => {
      if (child.type === "doctype") {
        return [];
      } else if (child.type === "comment") {
        return document.createComment(child.value);
      } else {
        return toNodes(child);
      }
    });
  } else {
    let element = document.createElement(jsx.tagName);
    for (let [key, value] of Object.entries(jsx.properties ?? {})) {
      //@ts-expect-error it will be fine;
      element[key] = value;
      for (let child of jsx.children) {
        if (child.type === "comment") {
          element.appendChild(document.createComment(child.value));
        } else {
          let childNodes = toNodes(child);
          element.append(...childNodes);
        }
      }
    }
    return [element];
  }
}
