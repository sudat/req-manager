import type { InputProcessor, OutputProcessor } from '@mastra/core/processors';
import type { MastraDBMessage } from '@mastra/core/agent/message-list';

const STRIP_PART_TYPES_INPUT = new Set<string>([
  'step-start',
  'step-finish',
]);

const STRIP_PART_TYPES_OUTPUT = new Set<string>([
  'redacted_reasoning',
  'redacted-reasoning',
  ...STRIP_PART_TYPES_INPUT,
]);

const sanitizeMessage = (
  message: MastraDBMessage,
  stripPartTypes: Set<string>
): MastraDBMessage => {
  const content = message.content;
  if (!content || !Array.isArray(content.parts)) {
    return message;
  }

  const filteredParts = content.parts
    .filter((part) => {
      if (!stripPartTypes.size) {
        return true;
      }
      const type = (part as { type?: string }).type;
      return !type || !stripPartTypes.has(type);
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
    content.providerMetadata === undefined
  ) {
    return message;
  }

  const { providerMetadata: _providerMetadata, ...rest } = content;
  return {
    ...message,
    content: {
      ...rest,
      parts: filteredParts,
    },
  };
};

const sanitizeMessages = (messages: MastraDBMessage[], stripPartTypes: Set<string>) =>
  messages.map((message) => sanitizeMessage(message, stripPartTypes));

export const sanitizeReasoningInputProcessor = {
  id: 'sanitize-reasoning-input',
  name: 'Sanitize Reasoning Parts (Input)',
  processInputStep: ({ messages }) => sanitizeMessages(messages, STRIP_PART_TYPES_INPUT),
} as const satisfies InputProcessor;

export const sanitizeReasoningOutputProcessor = {
  id: 'sanitize-reasoning-output',
  name: 'Sanitize Reasoning Parts (Output)',
  processOutputStep: ({ messages }) =>
    sanitizeMessages(messages, STRIP_PART_TYPES_OUTPUT),
} as const satisfies OutputProcessor;
