'use client';

/**
 * Add Lab Report Modal Component
 * Modal for adding new lab results for a patient
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FlaskConical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLabTests, type LabTest } from '@/lib/api/lab-tests';
import { createLabReport } from '@/lib/api/medical-records-module';

interface AddLabReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: number;
}

export function AddLabReportModal({
  open,
  onClose,
  onSuccess,
  patientId,
}: AddLabReportModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    test_id: '',
    value: '',
    unit: '',
    reference_range: '',
    is_abnormal: false,
    flag: '',
    notes: '',
    result_date: new Date().toISOString().split('T')[0],
  });

  // Load lab tests when modal opens
  useEffect(() => {
    if (open) {
      loadLabTests();
    }
  }, [open]);

  const loadLabTests = async () => {
    setLoadingTests(true);
    try {
      const response = await getLabTests({ status: 'active', limit: 100 });
      setLabTests(response.tests || []);
    } catch (error) {
      console.error('Failed to load lab tests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lab tests. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTests(false);
    }
  };

  const handleTestChange = (testId: string) => {
    const selectedTest = labTests.find(t => t.id.toString() === testId);
    setFormData(prev => ({
      ...prev,
      test_id: testId,
      unit: selectedTest?.unit || '',
      reference_range: selectedTest?.normal_range_text || 
        (selectedTest?.normal_range_min && selectedTest?.normal_range_max 
          ? `${selectedTest.normal_range_min} - ${selectedTest.normal_range_max}`
          : ''),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.test_id || !formData.value) {
      toast({
        title: 'Validation Error',
        description: 'Please select a test and enter a value.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await createLabReport({
        patient_id: patientId,
        test_id: parseInt(formData.test_id),
        value: formData.value,
        unit: formData.unit || undefined,
        reference_range: formData.reference_range || undefined,
        is_abnormal: formData.is_abnormal,
        flag: formData.flag || undefined,
        notes: formData.notes || undefined,
        result_date: formData.result_date,
      });

      toast({
        title: 'Success',
        description: 'Lab result added successfully.',
      });

      // Reset form
      setFormData({
        test_id: '',
        value: '',
        unit: '',
        reference_range: '',
        is_abnormal: false,
        flag: '',
        notes: '',
        result_date: new Date().toISOString().split('T')[0],
      });

      onSuccess();
    } catch (error: any) {
      console.error('Failed to add lab result:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add lab result. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Add Lab Result
          </DialogTitle>
          <DialogDescription>
            Enter the lab test result for this patient.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Test Selection */}
          <div className="space-y-2">
            <Label htmlFor="test">Lab Test *</Label>
            <Select
              value={formData.test_id}
              onValueChange={handleTestChange}
              disabled={loadingTests}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTests ? "Loading tests..." : "Select a test"} />
              </SelectTrigger>
              <SelectContent>
                {labTests.map((test) => (
                  <SelectItem key={test.id} value={test.id.toString()}>
                    {test.test_name} ({test.test_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Result Value and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Result Value *</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="e.g., 120"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g., mg/dL"
              />
            </div>
          </div>

          {/* Reference Range */}
          <div className="space-y-2">
            <Label htmlFor="reference_range">Reference Range</Label>
            <Input
              id="reference_range"
              value={formData.reference_range}
              onChange={(e) => setFormData(prev => ({ ...prev, reference_range: e.target.value }))}
              placeholder="e.g., 70 - 100"
            />
          </div>

          {/* Result Date */}
          <div className="space-y-2">
            <Label htmlFor="result_date">Result Date</Label>
            <Input
              id="result_date"
              type="date"
              value={formData.result_date}
              onChange={(e) => setFormData(prev => ({ ...prev, result_date: e.target.value }))}
            />
          </div>

          {/* Abnormal Flag */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_abnormal"
              checked={formData.is_abnormal}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_abnormal: checked === true }))
              }
            />
            <Label htmlFor="is_abnormal" className="text-sm font-normal">
              Mark as abnormal result
            </Label>
          </div>

          {/* Flag (if abnormal) */}
          {formData.is_abnormal && (
            <div className="space-y-2">
              <Label htmlFor="flag">Abnormal Flag</Label>
              <Select
                value={formData.flag}
                onValueChange={(value) => setFormData(prev => ({ ...prev, flag: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select flag type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="H">High (H)</SelectItem>
                  <SelectItem value="L">Low (L)</SelectItem>
                  <SelectItem value="HH">Critical High (HH)</SelectItem>
                  <SelectItem value="LL">Critical Low (LL)</SelectItem>
                  <SelectItem value="A">Abnormal (A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or comments..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Result
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
