'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { updateChangeRequestStatus } from '@/lib/data/change-requests';
import type { ChangeRequestStatus } from '@/lib/domain/value-objects';
import { CURRENT_PROJECT_ID_KEY, DEFAULT_PROJECT_ID } from '@/lib/constants/project';

export async function updateTicketStatus(id: string, status: ChangeRequestStatus) {
  const cookieStore = await cookies();
  const projectId = cookieStore.get(CURRENT_PROJECT_ID_KEY)?.value ?? DEFAULT_PROJECT_ID;
  const result = await updateChangeRequestStatus(id, status, projectId);

  if (result.error) {
    return { success: false, error: result.error };
  }

  // 照会画面と一覧画面を再検証
  revalidatePath(`/tickets/${id}`);
  revalidatePath('/tickets');

  return { success: true, data: result.data };
}
