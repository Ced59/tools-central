import {ATOMIC_TOOLS} from "./atomic-tools";

export type ToolId = keyof typeof ATOMIC_TOOLS;

export type AtomicToolItem = {
  id: ToolId;
} & (typeof ATOMIC_TOOLS)[ToolId];
