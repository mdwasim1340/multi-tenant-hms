'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api/client';

interface Doctor {
  id: number;
  name: string;
  email: string;
  specialty?: string;
}

interface DoctorSelectProps {
  value?: number;
  onChange: (doctorId: number) => void;
  required?: boolean;
  error?: string;
}

export function DoctorSelect({ value, onChange, required = false, error }: DoctorSelectProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      
      // Fetch users with doctor role
      const response = await api.get('/api/users', {
        params: {
          role: 'Doctor',
          limit: 100
        }
      });

      if (response.data && response.data.users) {
        setDoctors(response.data.users);
      }
    } catch (err: any) {
      console.error('Error loading doctors:', err);
      setLoadError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Label>Doctor {required && '*'}</Label>
        <div className="text-sm text-gray-500 mt-2">Loading doctors...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <Label>Doctor {required && '*'}</Label>
        <div className="text-sm text-red-600 mt-2">{loadError}</div>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="doctor_id">
        Doctor {required && <span className="text-red-600">*</span>}
      </Label>
      <Select
        value={value?.toString()}
        onValueChange={(val) => onChange(parseInt(val))}
      >
        <SelectTrigger id="doctor_id" className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder="Select a doctor" />
        </SelectTrigger>
        <SelectContent>
          {doctors.length === 0 ? (
            <div className="p-2 text-sm text-gray-500">No doctors available</div>
          ) : (
            doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id.toString()}>
                <div className="flex flex-col">
                  <span className="font-medium">{doctor.name}</span>
                  {doctor.specialty && (
                    <span className="text-xs text-gray-500">{doctor.specialty}</span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
