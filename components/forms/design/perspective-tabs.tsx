"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DesignPerspective } from "@/lib/domain/schemas/system-design";
import type { ReactNode } from "react";

interface PerspectiveTabsProps {
  activePerspective: DesignPerspective;
  onPerspectiveChange: (perspective: DesignPerspective) => void;
  functionForm: ReactNode;
  dataForm: ReactNode;
  exceptionForm: ReactNode;
  authForm: ReactNode;
  nonFunctionalForm: ReactNode;
}

const PERSPECTIVE_LABELS: Record<DesignPerspective, string> = {
  function: "機能",
  data: "データ",
  exception: "例外",
  auth: "認証・認可",
  non_functional: "非機能",
};

export function PerspectiveTabs({
  activePerspective,
  onPerspectiveChange,
  functionForm,
  dataForm,
  exceptionForm,
  authForm,
  nonFunctionalForm,
}: PerspectiveTabsProps) {
  return (
    <Tabs
      value={activePerspective}
      onValueChange={(value) =>
        onPerspectiveChange(value as DesignPerspective)
      }
    >
      <TabsList className="grid w-full grid-cols-5">
        {(Object.entries(PERSPECTIVE_LABELS) as [DesignPerspective, string][]).map(
          ([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          )
        )}
      </TabsList>
      <TabsContent value="function" className="space-y-4 mt-4">
        {functionForm}
      </TabsContent>
      <TabsContent value="data" className="space-y-4 mt-4">
        {dataForm}
      </TabsContent>
      <TabsContent value="exception" className="space-y-4 mt-4">
        {exceptionForm}
      </TabsContent>
      <TabsContent value="auth" className="space-y-4 mt-4">
        {authForm}
      </TabsContent>
      <TabsContent value="non_functional" className="space-y-4 mt-4">
        {nonFunctionalForm}
      </TabsContent>
    </Tabs>
  );
}
