import { useEffect, useState } from 'react';
import {
  nomenclatureClient,
  tagClient,
  type NomenclatureRead,
  type TagRead,
} from '@organization_template/react-client';
import { toErrorMessage } from '../taskUtils';

export function useTaxonomies() {
  const [tags, setTags] = useState<TagRead[]>([]);
  const [nomenclatures, setNomenclatures] = useState<NomenclatureRead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.all([tagClient.findAll(), nomenclatureClient.findAll()])
      .then(([newTags, newNomenclatures]) => {
        if (active) {
          setTags(newTags);
          setNomenclatures(newNomenclatures);
        }
      })
      .catch((caught) => {
        if (active) setError(toErrorMessage(caught));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return { tags, nomenclatures, error, loading };
}
