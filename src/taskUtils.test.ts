import { describe, expect, it } from 'vitest';
import { parseJsonImport } from './taskUtils';

describe('task JSON imports', () => {
  it('preserves all task fields and defaults older imports', () => {
    const fields = {
      code: 'SHIP',
      label: 'Ship',
      description: 'Release',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      dueDate: '2026-11-15',
      assignedTo: 'alice',
      tagIds: [2, 4],
      nomenclatureId: 3,
    };
    expect(parseJsonImport(JSON.stringify([fields]))).toEqual([fields]);
    expect(parseJsonImport('[{"code":"OLD","label":"Old"}]')[0]).toMatchObject({
      status: 'TODO',
      priority: 'NORMAL',
      dueDate: null,
      assignedTo: null,
      tagIds: [],
      nomenclatureId: null,
    });
  });
  it.each([
    { status: 'UNKNOWN' },
    { priority: 'CRITICAL' },
    { dueDate: '2026-02-30' },
    { dueDate: 'tomorrow' },
    { tagIds: ['2'] },
    { tagIds: [-1] },
    { assignedTo: 7 },
    { nomenclatureId: -1 },
  ])('rejects invalid extra fields %j', (fields) => {
    expect(() => parseJsonImport(JSON.stringify([{ code: 'X', label: 'X', ...fields }]))).toThrow();
  });
});
