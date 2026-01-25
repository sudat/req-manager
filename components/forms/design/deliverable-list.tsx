"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import type { Deliverable } from "@/lib/domain/schemas/deliverable";
import { createEmptyDeliverable } from "@/lib/domain/schemas/deliverable";
import { DeliverableCard } from "./deliverable-card";

interface DeliverableListProps {
  deliverables: Deliverable[];
  onDeliverablesChange: (deliverables: Deliverable[]) => void;
}

export function DeliverableList({ deliverables, onDeliverablesChange }: DeliverableListProps) {
  const handleAdd = () => {
    const newDeliverable = createEmptyDeliverable();
    onDeliverablesChange([...deliverables, newDeliverable]);
  };

  const handleUpdate = (index: number, updatedDeliverable: Deliverable) => {
    const newDeliverables = [...deliverables];
    newDeliverables[index] = updatedDeliverable;
    onDeliverablesChange(newDeliverables);
  };

  const handleDelete = (index: number) => {
    const newDeliverables = deliverables.filter((_, i) => i !== index);
    onDeliverablesChange(newDeliverables);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>成果物 ({deliverables.length})</CardTitle>
            <CardDescription>
              画面、バッチ、APIなどの成果物ごとに設計内容を記述します
            </CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            成果物を追加
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {deliverables.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            成果物が登録されていません。「成果物を追加」ボタンから追加してください。
          </p>
        ) : (
          deliverables.map((deliverable, index) => (
            <DeliverableCard
              key={deliverable.id}
              deliverable={deliverable}
              onUpdate={(updated) => handleUpdate(index, updated)}
              onDelete={() => handleDelete(index)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
