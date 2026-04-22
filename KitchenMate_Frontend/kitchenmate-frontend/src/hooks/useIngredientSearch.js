// KitchenMate_Frontend/kitchenmate-frontend/src/hooks/useIngredientSearch.js
import { useState, useEffect } from 'react';
import { recipeApi } from '../api/recipeApi';

export function useIngredientSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await recipeApi.searchIngredients(query);
        setResults(data);
      } catch (err) {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, results, isLoading };
}
