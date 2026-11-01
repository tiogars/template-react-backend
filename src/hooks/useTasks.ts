import { useEffect, useState } from 'react';
import type { Task } from '@organization_template/react-client';
import { taskClient } from '@organization_template/react-client';
import { toErrorMessage } from '../taskUtils';

export function useTasks() {
  const [templates, setTemplates] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setTemplates(await taskClient.findAll());
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { templates, loading, error, refresh };
}
