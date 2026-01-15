import { useState } from "react";
import type { Ticket, TicketStatus, TicketPriority, BusinessArea, TicketChangeItem } from "@/lib/domain";

export function useTicketForm(existingTicket?: Ticket) {
  const [title, setTitle] = useState(existingTicket?.title || "");
  const [description, setDescription] = useState(existingTicket?.description || "");
  const [background, setBackground] = useState(existingTicket?.background || "");
  const [changeSummary, setChangeSummary] = useState(existingTicket?.changeSummary || "");
  const [expectedBenefit, setExpectedBenefit] = useState(existingTicket?.expectedBenefit || "");
  const [changeItems, setChangeItems] = useState<TicketChangeItem[]>(existingTicket?.changeItems || []);
  const [status, setStatus] = useState<TicketStatus>(existingTicket?.status || "open");
  const [priority, setPriority] = useState<TicketPriority>(existingTicket?.priority || "medium");
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>(existingTicket?.businessIds || []);
  const [selectedAreas, setSelectedAreas] = useState<BusinessArea[]>(existingTicket?.areas || []);
  const [targetVersions, setTargetVersions] = useState(existingTicket?.targetVersions?.join(", ") || "");

  const toggleBusiness = (businessId: string) => {
    setSelectedBusinessIds(prev =>
      prev.includes(businessId) ? prev.filter(id => id !== businessId) : [...prev, businessId]
    );
  };

  const toggleArea = (area: BusinessArea) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const updateChangeItem = <K extends keyof TicketChangeItem>(index: number, key: K, value: TicketChangeItem[K]) => {
    setChangeItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  };

  const addChangeItem = () => {
    setChangeItems(prev => [
      ...prev,
      {
        refId: "",
        refTitle: "",
        refType: "業務要件",
        changeType: "変更",
        beforeText: "",
        afterText: "",
        acceptanceCriteria: [],
      },
    ]);
  };

  const removeChangeItem = (index: number) => {
    setChangeItems(prev => prev.filter((_, i) => i !== index));
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    background,
    setBackground,
    changeSummary,
    setChangeSummary,
    expectedBenefit,
    setExpectedBenefit,
    changeItems,
    setChangeItems,
    status,
    setStatus,
    priority,
    setPriority,
    selectedBusinessIds,
    selectedAreas,
    targetVersions,
    setTargetVersions,
    toggleBusiness,
    toggleArea,
    updateChangeItem,
    addChangeItem,
    removeChangeItem,
  };
}
