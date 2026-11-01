import type { CreateTaskRequest } from '@organization_template/react-client';

export function parseJsonImport(value: string): CreateTaskRequest[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) throw new Error('JSON import must contain an array.');

  return parsed.map((entry) => {
    if (!entry || typeof entry !== 'object') throw new Error('Each JSON record must be an object.');
    const record = entry as Record<string, unknown>;
    if (typeof record.code !== 'string' || !record.code.trim())
      throw new Error('Each JSON record requires a code.');
    if (typeof record.label !== 'string' || !record.label.trim())
      throw new Error('Each JSON record requires a label.');
    if (record.description != null && typeof record.description !== 'string') {
      throw new Error('Description must be a string or null.');
    }
    if (
      record.status != null &&
      !['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'].includes(String(record.status))
    )
      throw new Error('Invalid task status.');
    if (
      record.priority != null &&
      !['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(String(record.priority))
    )
      throw new Error('Invalid task priority.');
    if (
      record.dueDate != null &&
      (typeof record.dueDate !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(record.dueDate) ||
        new Date(record.dueDate).toISOString().slice(0, 10) !== record.dueDate)
    )
      throw new Error('Due date must be a valid YYYY-MM-DD date.');
    if (record.assignedTo != null && typeof record.assignedTo !== 'string')
      throw new Error('Assigned to must be a string or null.');
    if (
      record.tagIds != null &&
      (!Array.isArray(record.tagIds) ||
        record.tagIds.some((id) => !Number.isSafeInteger(id) || id <= 0))
    )
      throw new Error('Tag IDs must be positive integers.');
    if (
      record.nomenclatureId != null &&
      (!Number.isSafeInteger(record.nomenclatureId) || Number(record.nomenclatureId) <= 0)
    )
      throw new Error('Nomenclature ID must be a positive integer or null.');
    return {
      code: record.code.trim(),
      label: record.label.trim(),
      description: typeof record.description === 'string' ? emptyToNull(record.description) : null,
      status: (record.status ?? 'TODO') as CreateTaskRequest['status'],
      priority: (record.priority ?? 'NORMAL') as CreateTaskRequest['priority'],
      dueDate: (record.dueDate ?? null) as string | null,
      assignedTo: (record.assignedTo ?? null) as string | null,
      tagIds: (record.tagIds ?? []) as number[],
      nomenclatureId: (record.nomenclatureId ?? null) as number | null,
    };
  });
}

export function emptyToNull(value: string) {
  return value.trim() || null;
}

export function parseTaskId(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export function toErrorMessage(caught: unknown, fallback = 'The request failed.') {
  if (caught && typeof caught === 'object' && 'status' in caught) {
    const status = (caught as { status: unknown }).status;
    if (status === 401) return 'Your session has expired. Sign in again.';
    if (status === 403) return 'You do not have permission to perform this action.';
    if (status === 404) return 'Record not found. Refresh and try again.';
    if (status === 409) return 'The code already exists, or the record is still referenced.';
    if (status === 400 || status === 422)
      return 'Invalid data or relationship. Check references and hierarchy cycles.';
  }
  return caught instanceof Error ? caught.message : fallback;
}

export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function handleFileChange(
  event: React.ChangeEvent<HTMLInputElement>,
  handler: (file: File) => Promise<void>,
) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (file) void handler(file);
}
