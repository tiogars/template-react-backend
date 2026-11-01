import { describe, expect, it } from 'vitest';
import type { NomenclatureRead } from '@organization_template/react-client';
import { nomenclaturePath, parentOptions } from './taxonomyUtils';

const nodes = [
  { id: 1, label: 'Work', parentId: null },
  { id: 2, label: 'Engineering', parentId: 1 },
  { id: 3, label: 'Releases', parentId: 2 },
  { id: 4, label: 'Personal', parentId: null },
] as NomenclatureRead[];

describe('nomenclature hierarchy', () => {
  it('renders human-readable ancestor paths', () => {
    expect(nomenclaturePath(3, nodes)).toBe('Work / Engineering / Releases');
  });
  it('excludes the edited node and descendants from parent selections', () => {
    expect(
      parentOptions(nodes, 2)
        .map((node) => node.id)
        .sort(),
    ).toEqual([1, 4]);
  });
  it('terminates safely for stale cyclic responses', () => {
    expect(nomenclaturePath(1, [{ ...nodes[0], parentId: 2 }, nodes[1]])).toBe(
      'Engineering / Work',
    );
  });
});
