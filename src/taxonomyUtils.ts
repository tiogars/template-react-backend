import type { NomenclatureRead, TagRead } from '@organization_template/react-client';

export function taxonomyLabel(id: number | null | undefined, records: TagRead[]) {
  if (id == null) return 'None';
  return records.find((record) => record.id === id)?.label ?? `Unavailable (${id})`;
}

export function nomenclaturePath(id: number | null | undefined, records: NomenclatureRead[]) {
  if (id == null) return 'None';
  const labels: string[] = [];
  const visited = new Set<number>();
  let current: number | null = id;
  while (current != null && !visited.has(current)) {
    visited.add(current);
    const record = records.find((entry) => entry.id === current);
    labels.unshift(record?.label ?? `Unavailable (${current})`);
    current = record?.parentId ?? null;
  }
  return labels.join(' / ');
}

export function parentOptions(records: NomenclatureRead[], editingId?: number) {
  return records
    .filter((record) => {
      const visited = new Set<number>();
      let current: number | null = record.id;
      while (current != null && !visited.has(current)) {
        if (current === editingId) return false;
        visited.add(current);
        current = records.find((entry) => entry.id === current)?.parentId ?? null;
      }
      return true;
    })
    .sort((a, b) => nomenclaturePath(a.id, records).localeCompare(nomenclaturePath(b.id, records)));
}
