"use client"

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsLayout } from "@/components/layout/settings-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Info } from "lucide-react";

export default function LLMSettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [temperature, setTemperature] = useState([1]);

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <PageHeader
            title="設定"
            description="プロジェクトとシステムの設定を管理"
          />

          <SettingsLayout>
            <div className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">LLM設定</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="provider">LLMプロバイダー</Label>
                  <Select defaultValue="openai">
                    <SelectTrigger id="provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      <SelectItem value="google">Google (Gemini)</SelectItem>
                      <SelectItem value="azure">Azure OpenAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">APIキー</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      defaultValue="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">APIキーは暗号化して保存されます</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">モデル</Label>
                  <Select defaultValue="gpt-4-turbo">
                    <SelectTrigger id="model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Temperature</Label>
                    <span className="text-sm font-semibold text-slate-900">{temperature[0]}</span>
                  </div>
                  <Slider
                    value={temperature}
                    onValueChange={setTemperature}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>決定的 (0)</span>
                    <span>創造的 (2)</span>
                  </div>
                </div>

                <Card className="border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-blue-900">推奨設定</div>
                      <div className="text-xs text-blue-700 mt-1">
                        要件管理では正確性が重要なため、Temperature は 0.3 以下を推奨します。
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-end gap-3">
                  <Button variant="outline">接続テスト</Button>
                  <Button className="bg-brand hover:bg-brand-600">変更を保存</Button>
                </div>
              </div>
            </div>
          </SettingsLayout>
        </div>
      </div>
    </>
  );
}
