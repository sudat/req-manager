import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { Concept, BusinessArea } from "@/lib/mock/data/types";

export type ConceptInput = {
  id: string;
  name: string;
  synonyms: string[];
  areas: BusinessArea[];
  definition: string;
  relatedDocs: string[];
  requirementCount: number;
};

type ConceptRow = {
  id: string;
  name: string;
  synonyms: string[] | null;
  areas: string[] | null;
  definition: string | null;
  related_docs: string[] | null;
  requirement_count: number | null;
  created_at: string;
  updated_at: string;
};

const toConcept = (row: ConceptRow): Concept => ({
  id: row.id,
  name: row.name,
  synonyms: row.synonyms ?? [],
  areas: (row.areas ?? []) as BusinessArea[],
  definition: row.definition ?? "",
  relatedDocs: row.related_docs ?? [],
  requirementCount: row.requirement_count ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toConceptRow = (input: ConceptInput) => ({
  id: input.id,
  name: input.name,
  synonyms: input.synonyms,
  areas: input.areas,
  definition: input.definition,
  related_docs: input.relatedDocs,
  requirement_count: input.requirementCount,
});

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

export const listConcepts = async () => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("concepts")
    .select("*")
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as ConceptRow[]).map(toConcept), error: null };
};

export const getConceptById = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("concepts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: toConcept(data as ConceptRow), error: null };
};

export const createConcept = async (input: ConceptInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toConceptRow(input),
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("concepts")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toConcept(data as ConceptRow), error: null };
};

export const updateConcept = async (id: string, input: Omit<ConceptInput, "id">) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toConceptRow({ ...input, id }),
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("concepts")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toConcept(data as ConceptRow), error: null };
};

export const deleteConcept = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { error } = await supabase
    .from("concepts")
    .delete()
    .eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};
