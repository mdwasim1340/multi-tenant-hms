'use client';

/**
 * ClinicalNoteForm Component
 * 
 * Form for creating and editing clinical notes with:
 * - Patient selection
 * - Note type selection
 * - Provider information
 * - Rich text editor integration
 * - Version history display
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RichTextEditor } from './RichTextEditor';
import { PatientSelector } from './PatientSelector';
import { usePatientContext } from '@/hooks/usePatientContext';
import { useClinicalNotes } from '@/hooks/useClinicalNotes';
import { ClinicalNote, ClinicalNoteVersion } from '@/lib/api/clinical-notes';
import { FileText, Save, Clock, User, AlertCircle, History } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Form validation schema
const clinicalNoteSchema = z.object({
  patient_id: z.number().min(1, 'Patient is required'),
  note_type: z.enum([
    'progress_note',
    'history_physical',
    'consultation',
    'discharge_summary',
    'procedure_note',
    'other'
  ]),
  provider_id: z.number().min(1, 'Provider is required'),
  content: z.string().min(10, 'Note content must be at least 10 characters'),
  status: z.enum(['draft', 'signed', 'amended']).default('draft')
});

type ClinicalNoteFormData = z.infer<typeof clinicalNoteSchema>;

interface ClinicalNoteFormProps {
  noteId?: number;
  initialData?: Partial<ClinicalNote>;
  onSuccess?: (note: ClinicalNote) => void;
  onCancel?: () => void;
}

export function ClinicalNoteForm({
  noteId,
  initialData,
  onSuccess,
  onCancel
}: ClinicalNoteFormProps) {
  const { selectedPatient } = usePatientContext();
  const { createNote, updateNote, getNoteVersions, loading } = useClinicalNotes();
  const [versions, setVersions] = useState<ClinicalNoteVersion[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const form = useForm<ClinicalNoteFormData>({
    resolver: zodResolver(clinicalNoteSchema),
    defaultValues: {
      patient_id: initialData?.patient_id || selectedPatient?.id || 0,
      note_type: initialData?.note_type || 'progress_note',
      provider_id: initialData?.provider_id || 0,
      content: initialData?.content || '',
      status: initialData?.status || 'draft'
    }
  });

  // Update patient_id when selected patient changes
  useEffect(() => {
    if (selectedPatient && !initialData) {
      form.setValue('patient_id', selectedPatient.id);
    }
  }, [selectedPatient, initialData, form]);

  // Load version history if editing existing note
  useEffect(() => {
    if (noteId) {
      loadVersionHistory();
    }
  }, [noteId]);

  const loadVersionHistory = async () => {
    if (!noteId) return;

    try {
      setLoadingVersions(true);
      const response = await getNoteVersions(noteId);
      setVersions(response.versions || []);
    } catch (err) {
      console.error('Error loading version history:', err);
      toast.error('Failed to load version history');
    } finally {
      setLoadingVersions(false);
    }
  };

  const onSubmit = async (data: ClinicalNoteFormData) => {
    try {
      let result;
      
      if (noteId) {
        // Update existing note
        result = await updateNote(noteId, data);
        toast.success('Clinical note updated successfully');
      } else {
        // Create new note
        result = await createNote(data);
        toast.success('Clinical note created successfully');
      }

      if (onSuccess && result) {
        onSuccess(result);
      }

      // Reload version history after update
      if (noteId) {
        await loadVersionHistory();
      }
    } catch (err: any) {
      console.error('Error saving clinical note:', err);
      toast.error(err.message || 'Failed to save clinical note');
    }
  };

  const handleSignNote = async () => {
    try {
      if (!noteId) {
        toast.error('Cannot sign unsaved note');
        return;
      }

      // Update status to signed
      form.setValue('status', 'signed');
      await form.handleSubmit(onSubmit)();
      
      toast.success('Clinical note signed successfully');
    } catch (err) {
      console.error('Error signing note:', err);
      toast.error('Failed to sign note');
    }
  };

  const noteTypeLabels: Record<string, string> = {
    progress_note: 'Progress Note',
    history_physical: 'History & Physical',
    consultation: 'Consultation',
    discharge_summary: 'Discharge Summary',
    procedure_note: 'Procedure Note',
    other: 'Other'
  };

  const currentStatus = form.watch('status');
  const isSigned = currentStatus === 'signed';

  return (
    <div className="space-y-6">
      {/* Patient Selection */}
      {!initialData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Patient
            </CardTitle>
            <CardDescription>
              Choose the patient for this clinical note
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PatientSelector />
            {!selectedPatient && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please select a patient before creating a clinical note
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Note Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {noteId ? 'Edit Clinical Note' : 'New Clinical Note'}
          </CardTitle>
          <CardDescription>
            {isSigned ? (
              <Badge variant="secondary">Signed - Read Only</Badge>
            ) : (
              'Complete the form below to create or update a clinical note'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Note Type */}
              <FormField
                control={form.control}
                name="note_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSigned}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select note type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(noteTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the type of clinical note
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Provider ID (simplified - in real app, would be a provider selector) */}
              <FormField
                control={form.control}
                name="provider_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider ID</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter provider ID"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isSigned}
                      />
                    </FormControl>
                    <FormDescription>
                      The healthcare provider creating this note
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Rich Text Editor */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note Content</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        content={field.value}
                        onChange={field.onChange}
                        placeholder="Enter clinical note content..."
                        showTemplateSelector={!noteId}
                        templateCategory={form.watch('note_type')}
                        editable={!isSigned}
                      />
                    </FormControl>
                    <FormDescription>
                      Use the rich text editor to document clinical findings
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {!isSigned && (
                    <>
                      <Button
                        type="submit"
                        disabled={loading || !selectedPatient}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {noteId ? 'Update Note' : 'Save Note'}
                      </Button>
                      {noteId && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleSignNote}
                          disabled={loading}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Sign Note
                        </Button>
                      )}
                    </>
                  )}
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                {noteId && versions.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowVersionHistory(!showVersionHistory)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    Version History ({versions.length})
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Version History */}
      {showVersionHistory && noteId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Version History
            </CardTitle>
            <CardDescription>
              Previous versions of this clinical note
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingVersions ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading version history...
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No version history available
              </div>
            ) : (
              <div className="space-y-4">
                {versions.map((version) => (
                  <VersionHistoryItem key={version.id} version={version} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Version History Item Component
 * Displays a single version with diff view
 */
interface VersionHistoryItemProps {
  version: ClinicalNoteVersion;
}

function VersionHistoryItem({ version }: VersionHistoryItemProps) {
  const [showContent, setShowContent] = useState(false);

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Version {version.version_number}</Badge>
          <span className="text-sm text-muted-foreground">
            {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowContent(!showContent)}
        >
          {showContent ? 'Hide' : 'Show'} Content
        </Button>
      </div>

      {version.changed_by && (
        <div className="text-sm text-muted-foreground">
          Changed by: User ID {version.changed_by}
        </div>
      )}

      {showContent && (
        <div className="mt-4 p-4 bg-muted rounded-md">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: version.content }}
          />
        </div>
      )}
    </div>
  );
}
