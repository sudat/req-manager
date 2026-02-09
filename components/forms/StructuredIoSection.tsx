"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type {
  ApiInput,
  ApiOutput,
  BatchInput,
  BatchOutput,
  JobInput,
  JobOutput,
  ScreenInput,
  ScreenOutput,
  StructuredInput,
  StructuredOutput,
} from "@/lib/domain/schemas/io-schemas";
import type { FunctionDesignContent } from "@/lib/domain/schemas/system-design";
import { ApiIoForm } from "./ApiIoForm";
import { ScreenIoForm } from "./ScreenIoForm";
import { BatchIoForm } from "./BatchIoForm";
import { JobIoForm } from "./JobIoForm";

type IoType = "api" | "screen" | "batch" | "job";

interface StructuredIoSectionProps {
  content: FunctionDesignContent;
  onChange: (next: FunctionDesignContent) => void;
}

const defaultStructuredInput: Record<IoType, StructuredInput> = {
  api: { method: "POST", path: "", query: [], body: [] },
  screen: {
    trigger: "click",
    action: "",
    targetElement: "",
    precondition: "",
    elements: [],
  },
  batch: { schedule: "", source: "", parameters: [] },
  job: { event: "", payload: [] },
};

const defaultStructuredOutput: Record<IoType, StructuredOutput> = {
  api: { success: { status: 200, fields: [] }, error: [] },
  screen: { transition: "", messages: [], behavior: "", displayChanges: "" },
  batch: {
    summary: { processedCount: 0, successCount: 0, errorCount: 0, status: "completed" },
    nextBatch: "",
  },
  job: { result: "", nextEvent: "" },
};

const normalizeIoType = (value?: string): IoType => {
  if (value === "api" || value === "screen" || value === "batch" || value === "job") {
    return value;
  }
  return "api";
};

export function StructuredIoSection({ content, onChange }: StructuredIoSectionProps) {
  const ioType = normalizeIoType(content.ioType);
  const draftsRef = useRef<Record<IoType, { input: StructuredInput; output: StructuredOutput }>>({
    api: { input: defaultStructuredInput.api, output: defaultStructuredOutput.api },
    screen: { input: defaultStructuredInput.screen, output: defaultStructuredOutput.screen },
    batch: { input: defaultStructuredInput.batch, output: defaultStructuredOutput.batch },
    job: { input: defaultStructuredInput.job, output: defaultStructuredOutput.job },
  });

  useEffect(() => {
    if (content.structuredInput && content.structuredOutput) {
      draftsRef.current[ioType] = {
        input: content.structuredInput,
        output: content.structuredOutput,
      };
    }
  }, [content.structuredInput, content.structuredOutput, ioType]);

  const handleTypeChange = (nextType: IoType) => {
    const current = draftsRef.current[ioType];
    draftsRef.current[ioType] = {
      input: content.structuredInput ?? current.input,
      output: content.structuredOutput ?? current.output,
    };
    const nextDraft = draftsRef.current[nextType];
    onChange({
      ...content,
      ioType: nextType,
      structuredInput: nextDraft.input,
      structuredOutput: nextDraft.output,
    });
  };

  const handleInputChange = (input: StructuredInput) => {
    draftsRef.current[ioType].input = input;
    onChange({ ...content, structuredInput: input });
  };

  const handleOutputChange = (output: StructuredOutput) => {
    draftsRef.current[ioType].output = output;
    onChange({ ...content, structuredOutput: output });
  };

  const input = (content.structuredInput ?? draftsRef.current[ioType].input) as StructuredInput;
  const output = (content.structuredOutput ?? draftsRef.current[ioType].output) as StructuredOutput;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label>構造化入出力</Label>
          <p className="text-sm text-muted-foreground">
            タイプごとに入力・出力のスキーマを定義します。
          </p>
        </div>
        <div className="w-40">
          <Select value={ioType} onValueChange={(value) => handleTypeChange(value as IoType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="screen">画面</SelectItem>
              <SelectItem value="batch">バッチ</SelectItem>
              <SelectItem value="job">ジョブ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="input" className="w-full">
        <TabsList>
          <TabsTrigger value="input">入力</TabsTrigger>
          <TabsTrigger value="output">出力</TabsTrigger>
        </TabsList>
        <TabsContent value="input" className="pt-4">
          {ioType === "api" && (
            <ApiIoForm
              input={input as ApiInput}
              output={output as ApiOutput}
              onInputChange={(next) => handleInputChange(next)}
              onOutputChange={(next) => handleOutputChange(next)}
              mode="input"
            />
          )}
          {ioType === "screen" && (
            <ScreenIoForm
              input={input as ScreenInput}
              output={output as ScreenOutput}
              onInputChange={(next) => handleInputChange(next)}
              onOutputChange={(next) => handleOutputChange(next)}
              mode="input"
            />
          )}
          {ioType === "batch" && (
            <BatchIoForm
              input={input as BatchInput}
              output={output as BatchOutput}
              onInputChange={(next) => handleInputChange(next)}
              onOutputChange={(next) => handleOutputChange(next)}
              mode="input"
            />
          )}
          {ioType === "job" && (
            <JobIoForm
              input={input as JobInput}
              output={output as JobOutput}
              onInputChange={(next) => handleInputChange(next)}
              onOutputChange={(next) => handleOutputChange(next)}
              mode="input"
            />
          )}
        </TabsContent>
        <TabsContent value="output" className="pt-4">
          {ioType === "api" && (
            <ApiIoForm
              input={input as ApiInput}
              output={output as ApiOutput}
              onInputChange={(next) => handleInputChange(next)}
              onOutputChange={(next) => handleOutputChange(next)}
              mode="output"
            />
          )}
          {ioType === "screen" && (
            <ScreenIoForm
              input={input as ScreenInput}
              output={output as ScreenOutput}
              onInputChange={(next) => handleInputChange(next)}
              onOutputChange={(next) => handleOutputChange(next)}
              mode="output"
            />
          )}
          {ioType === "batch" && (
            <BatchIoForm
              input={input as BatchInput}
              output={output as BatchOutput}
              onInputChange={(next) => handleInputChange(next)}
              onOutputChange={(next) => handleOutputChange(next)}
              mode="output"
            />
          )}
          {ioType === "job" && (
            <JobIoForm
              input={input as JobInput}
              output={output as JobOutput}
              onInputChange={(next) => handleInputChange(next)}
              onOutputChange={(next) => handleOutputChange(next)}
              mode="output"
            />
          )}
        </TabsContent>
      </Tabs>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm">
            旧形式（テキスト）を表示
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 text-sm text-muted-foreground">
          旧形式はFunctionの入力/出力欄で編集できます。構造化に移行後は使用しないでください。
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
