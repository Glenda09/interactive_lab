import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSimulations } from '../services/simulationService';

/**
 * useSimulations
 * Fetches the simulation list whenever `filters` changes and returns list,
 * loading and error state.
 *
 * @param {object} [filters] - Optional query filters (category, difficulty)
 */
const useSimulations = (filters) => {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((s) => s.simulations);

  // Stabilise the filters reference so the effect only fires when values change
  const stableFilters = useMemo(
    () => filters,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters?.category, filters?.difficulty]
  );

  useEffect(() => {
    dispatch(fetchSimulations(stableFilters));
  }, [dispatch, stableFilters]);

  return { simulations: list, loading, error };
};

export default useSimulations;
