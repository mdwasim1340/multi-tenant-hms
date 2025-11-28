import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface LabOrder {
  id: string;
  patient_id: string;
  doctor_id: string;
  test_ids: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLabOrderData {
  patient_id: string;
  doctor_id: string;
  test_ids: string[];
  priority: 'routine' | 'urgent' | 'stat';
  notes?: string;
}

export const useLabOrders = () => {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/lab-orders');
      setOrders(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch lab orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return { orders, loading, error, refetch: fetchOrders };
};

export const useLabOrder = (id: string) => {
  const [order, setOrder] = useState<LabOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/lab-orders/${id}`);
        setOrder(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch lab order');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  return { order, loading, error };
};

export const useLabOrderMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (data: CreateLabOrderData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/lab-orders', data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to create lab order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (id: string, data: Partial<LabOrder>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/lab-orders/${id}`, data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to update lab order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/lab-orders/${id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete lab order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createOrder, updateOrder, deleteOrder, loading, error };
};

export const useLabOrderStatistics = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/lab-orders/statistics');
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
