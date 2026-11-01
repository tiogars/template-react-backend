import { useMemo, useState } from 'react';
import type { GridRowSelectionModel } from '@mui/x-data-grid';

const emptySelection = (): GridRowSelectionModel => ({ type: 'include', ids: new Set() });

/**
 * Tracks DataGrid row selection and resolves it to concrete numeric ids.
 * Select-all produces an "exclude" model, so ids are computed from the current rows in that case.
 */
export function useRowSelection<T extends { id: number }>(rows: T[], isSelectable: (row: T) => boolean = () => true) {
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(emptySelection);

  const selectedIds = useMemo(() => {
    if (selectionModel.type === 'include') {
      return rows.filter((row) => selectionModel.ids.has(row.id) && isSelectable(row)).map((row) => row.id);
    }
    return rows.filter((row) => !selectionModel.ids.has(row.id) && isSelectable(row)).map((row) => row.id);
  }, [rows, selectionModel, isSelectable]);

  return {
    selectionModel,
    setSelectionModel,
    selectedIds,
    clearSelection: () => setSelectionModel(emptySelection()),
  };
}
