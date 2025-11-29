import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface LabTest {
  id: string;
  name: string;
  code: string;
  category_id: string;
  category_name?: string;
  description?: string;
  reference_range: string;
  unit: string;
  price: number;
  duration_minutes: number;
  preparation_instructions?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabTestCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useLabTests = () => {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/lab-tests');
      setTests(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch lab tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  return { tests, loading, error, refetch: fetchTests };
};

export const useLabTest = (id: string) => {
  const [test, setTest] = useState<LabTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/lab-tests/${id}`);
        setTest(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch lab test');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTest();
    }
  }, [id]);

  return { test, loading, error };
};

export const useLabTestCategories = () => {
  const [categories, setCategories] = useState<LabTestCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/lab-test-categories');
      setCategories(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch lab test categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, loading, error, refetch: fetchCategories };
};

export const useLabTestsByCategory = (categoryId: string) => {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/lab-tests?category=${categoryId}`);
        setTests(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch lab tests');
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchTests();
    }
  }, [categoryId]);

  return { tests, loading, error };
};

export const useLabTestMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTest = async (data: Omit<LabTest, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/lab-tests', data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to create lab test');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTest = async (id: string, data: Partial<LabTest>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/lab-tests/${id}`, data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to update lab test');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTest = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/lab-tests/${id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete lab test');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createTest, updateTest, deleteTest, loading, error };
};

export const useLabTestSearch = (query: string) => {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchTests = async () => {
      if (!query.trim()) {
        setTests([]);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/lab-tests/search?q=${encodeURIComponent(query)}`);
        setTests(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to search lab tests');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchTests, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return { tests, loading, error };
};
