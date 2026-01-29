import type { Processor } from '@mastra/core/processors';
import type { MastraDBMessage } from '@mastra/core/agent/message-list';

const STRIP_PART_TYPES = new Set([
  'reasoning',
  'redacted_reasoning',
  'redacted-reasoning',
  'reasoning_signature',
  'reasoning-signature',
  'tool-invocation',
  'tool-result',
  'step-start',
  'step-finish',
]);

const sanitizeMessage = (message: MastraDBMessage): MastraDBMessage => {
  const content = message.content;
  if (!content || !Array.isArray(content.parts)) {
    return message;
  }

  const filteredParts = content.parts
    .filter((part) => {
      const type = (part as { type?: string }).type;
      return !type || !STRIP_PART_TYPES.has(type);
    })
    .map((part) => {
      if (!part || typeof part !== 'object') {
        return part;
      }
      const { providerMetadata: _providerMetadata, ...rest } = part as {
        providerMetadata?: unknown;
        [key: string]: unknown;
      };
      return rest;
    });

  if (
    filteredParts.length === content.parts.length &&
    content.reasoning === undefined &&
    content.toolInvocations === undefined &&
    content.providerMetadata === undefined
  ) {
    return message;
  }

  const {
    reasoning: _reasoning,
    toolInvocations: _toolInvocations,
    providerMetadata: _providerMetadata,
    ...rest
  } = content;
  return {
    ...message,
    content: {
      ...rest,
      parts: filteredParts,
    },
  };
};

const sanitizeMessages = (messages: MastraDBMessage[]): MastraDBMessage[] =>
  messages.map((message) => sanitizeMessage(message));

export const sanitizeReasoningProcessor: Processor<'sanitize-reasoning'> = {
  id: 'sanitize-reasoning',
  name: 'Sanitize Reasoning Parts',
  processInput: ({ messages }) => sanitizeMessages(messages),
  processOutputResult: ({ messages }) => sanitizeMessages(messages),
};
