import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface LabResult {
  id: string;
  order_id: string;
  test_id: string;
  patient_id: string;
  result_value: string;
  reference_range: string;
  unit: string;
  status: 'pending' | 'completed' | 'reviewed';
  is_abnormal: boolean;
  is_critical: boolean;
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export const useLabResults = () => {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await api.get('/lab-results');
      setResults(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch lab results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return { results, loading, error, refetch: fetchResults };
};

export const useLabResult = (id: string) => {
  const [result, setResult] = useState<LabResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/lab-results/${id}`);
        setResult(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch lab result');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResult();
    }
  }, [id]);

  return { result, loading, error };
};

export const useOrderResults = (orderId: string) => {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/lab-orders/${orderId}/results`);
        setResults(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch order results');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchResults();
    }
  }, [orderId]);

  return { results, loading, error };
};

export const useResultHistory = (patientId: string, testId: string) => {
  const [history, setHistory] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/lab-results/history/${patientId}/${testId}`);
        setHistory(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch result history');
      } finally {
        setLoading(false);
      }
    };

    if (patientId && testId) {
      fetchHistory();
    }
  }, [patientId, testId]);

  return { history, loading, error };
};

export const useAbnormalResults = () => {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await api.get('/lab-results?abnormal=true');
        setResults(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch abnormal results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  return { results, loading, error };
};

export const useCriticalResults = () => {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await api.get('/lab-results?critical=true');
        setResults(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch critical results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  return { results, loading, error };
};

export const useLabResultMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateResult = async (id: string, data: Partial<LabResult>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/lab-results/${id}`, data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to update lab result');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reviewResult = async (id: string, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/lab-results/${id}/review`, { notes });
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to review result');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateResult, reviewResult, loading, error };
};

export const useLabResultStatistics = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    reviewed: 0,
    abnormal: 0,
    critical: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/lab-results/statistics');
        setStats(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};
