'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, User, X } from 'lucide-react';
import api from '@/lib/api/client';

interface Patient {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
}

interface PatientSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (patient: Patient) => void;
}

export function PatientSelectModal({ open, onClose, onSelect }: PatientSelectModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadPatients();
    }
  }, [open, searchTerm]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: 1,
        limit: 20,
        status: 'active'
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get('/api/patients', { params });

      if (response.data && response.data.patients) {
        setPatients(response.data.patients);
      }
    } catch (err: any) {
      console.error('Error loading patients:', err);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (patient: Patient) => {
    onSelect(patient);
    onClose();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Patient</DialogTitle>
          <DialogDescription>
            Search and select a patient to create a medical record
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, patient number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Patient List */}
        {!loading && (
          <div className="flex-1 overflow-y-auto space-y-2">
            {patients.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {searchTerm ? 'No patients found' : 'No patients available'}
                </p>
              </div>
            ) : (
              patients.map((patient) => (
                <Card
                  key={patient.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleSelect(patient)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <h3 className="font-semibold text-lg">
                            {patient.first_name} {patient.last_name}
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Patient #:</span>{' '}
                            {patient.patient_number}
                          </div>
                          <div>
                            <span className="font-medium">DOB:</span>{' '}
                            {formatDate(patient.date_of_birth)}
                          </div>
                          {patient.email && (
                            <div>
                              <span className="font-medium">Email:</span>{' '}
                              {patient.email}
                            </div>
                          )}
                          {patient.phone && (
                            <div>
                              <span className="font-medium">Phone:</span>{' '}
                              {patient.phone}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button size="sm" variant="outline">
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
