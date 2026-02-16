"use client";

import { useState } from "react";
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
type IoFormMode = "input" | "output";
type IoDraft = { input: StructuredInput; output: StructuredOutput };

interface StructuredIoSectionProps {
  content: FunctionDesignContent;
  onChange: (next: FunctionDesignContent) => void;
}

const normalizeIoType = (value?: string): IoType => {
  if (value === "api" || value === "screen" || value === "batch" || value === "job") {
    return value;
  }
  return "api";
};

const createDefaultStructuredInput = (ioType: IoType): StructuredInput => {
  switch (ioType) {
    case "api":
      return { method: "POST", path: "", fields: [], query: [], body: [], dataFields: [] };
    case "screen":
      return {
        trigger: "click",
        action: "",
        targetElement: "",
        precondition: "",
        fields: [],
        elements: [],
        dataFields: [],
      };
    case "batch":
      return { schedule: "", source: "", fields: [], parameters: [], dataFields: [] };
    case "job":
      return { event: "", fields: [], payload: [], dataFields: [] };
  }
};

const createDefaultStructuredOutput = (ioType: IoType): StructuredOutput => {
  switch (ioType) {
    case "api":
      return { success: { status: 200, fields: [] }, error: [], fields: [], dataFields: [] };
    case "screen":
      return {
        transition: "",
        messages: [],
        behavior: "",
        displayChanges: "",
        fields: [],
        dataFields: [],
      };
    case "batch":
      return {
        summary: { processedCount: 0, successCount: 0, errorCount: 0, status: "completed" },
        nextBatch: "",
        fields: [],
        dataFields: [],
      };
    case "job":
      return { result: "", nextEvent: "", fields: [], dataFields: [] };
  }
};

const createDefaultIoDraft = (ioType: IoType): IoDraft => ({
  input: createDefaultStructuredInput(ioType),
  output: createDefaultStructuredOutput(ioType),
});

const createInitialDrafts = (): Record<IoType, IoDraft> => ({
  api: createDefaultIoDraft("api"),
  screen: createDefaultIoDraft("screen"),
  batch: createDefaultIoDraft("batch"),
  job: createDefaultIoDraft("job"),
});

export function StructuredIoSection({ content, onChange }: StructuredIoSectionProps) {
  const ioType = normalizeIoType(content.ioType);
  const [drafts, setDrafts] = useState<Record<IoType, IoDraft>>(createInitialDrafts);

  const handleTypeChange = (nextType: IoType) => {
    const updatedDrafts: Record<IoType, IoDraft> = {
      ...drafts,
      [ioType]: {
        input: content.structuredInput ?? drafts[ioType].input,
        output: content.structuredOutput ?? drafts[ioType].output,
      },
    };
    setDrafts(updatedDrafts);

    const nextDraft = updatedDrafts[nextType];
    onChange({
      ...content,
      ioType: nextType,
      structuredInput: nextDraft.input,
      structuredOutput: nextDraft.output,
    });
  };

  const handleInputChange = (input: StructuredInput) => {
    setDrafts((prev) => ({
      ...prev,
      [ioType]: {
        ...prev[ioType],
        input,
      },
    }));
    onChange({ ...content, structuredInput: input });
  };

  const handleOutputChange = (output: StructuredOutput) => {
    setDrafts((prev) => ({
      ...prev,
      [ioType]: {
        ...prev[ioType],
        output,
      },
    }));
    onChange({ ...content, structuredOutput: output });
  };

  const activeDraft = drafts[ioType];
  const input = (content.structuredInput ?? activeDraft.input) as StructuredInput;
  const output = (content.structuredOutput ?? activeDraft.output) as StructuredOutput;

  const renderIoForm = (mode: IoFormMode) => {
    switch (ioType) {
      case "api":
        return (
          <ApiIoForm
            input={input as ApiInput}
            output={output as ApiOutput}
            onInputChange={(next) => handleInputChange(next)}
            onOutputChange={(next) => handleOutputChange(next)}
            mode={mode}
          />
        );
      case "screen":
        return (
          <ScreenIoForm
            input={input as ScreenInput}
            output={output as ScreenOutput}
            onInputChange={(next) => handleInputChange(next)}
            onOutputChange={(next) => handleOutputChange(next)}
            mode={mode}
          />
        );
      case "batch":
        return (
          <BatchIoForm
            input={input as BatchInput}
            output={output as BatchOutput}
            onInputChange={(next) => handleInputChange(next)}
            onOutputChange={(next) => handleOutputChange(next)}
            mode={mode}
          />
        );
      case "job":
        return (
          <JobIoForm
            input={input as JobInput}
            output={output as JobOutput}
            onInputChange={(next) => handleInputChange(next)}
            onOutputChange={(next) => handleOutputChange(next)}
            mode={mode}
          />
        );
    }
  };

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
          {renderIoForm("input")}
        </TabsContent>
        <TabsContent value="output" className="pt-4">
          {renderIoForm("output")}
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
