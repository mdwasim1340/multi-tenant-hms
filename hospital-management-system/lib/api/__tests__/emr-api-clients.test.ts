/**
 * EMR API Clients Unit Tests
 * Tests for all EMR API client functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clinicalNotesApi from '../clinical-notes';
import * as noteTemplatesApi from '../note-templates';
import * as imagingReportsApi from '../imaging-reports';
import * as prescriptionsApi from '../prescriptions';
import * as medicalHistoryApi from '../medical-history';
import * as reportUploadApi from '../report-upload';

// Mock the API client
vi.mock('../client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

describe('Clinical Notes API Client', () => {
  it('should export all required functions', () => {
    expect(clinicalNotesApi.getClinicalNotes).toBeDefined();
    expect(clinicalNotesApi.getClinicalNote).toBeDefined();
    expect(clinicalNotesApi.getPatientClinicalNotes).toBeDefined();
    expect(clinicalNotesApi.createClinicalNote).toBeDefined();
    expect(clinicalNotesApi.updateClinicalNote).toBeDefined();
    expect(clinicalNotesApi.deleteClinicalNote).toBeDefined();
    expect(clinicalNotesApi.signClinicalNote).toBeDefined();
    expect(clinicalNotesApi.getClinicalNoteVersions).toBeDefined();
    expect(clinicalNotesApi.getClinicalNoteVersion).toBeDefined();
  });
});

describe('Note Templates API Client', () => {
  it('should export all required functions', () => {
    expect(noteTemplatesApi.getNoteTemplates).toBeDefined();
    expect(noteTemplatesApi.getNoteTemplate).toBeDefined();
    expect(noteTemplatesApi.createNoteTemplate).toBeDefined();
    expect(noteTemplatesApi.updateNoteTemplate).toBeDefined();
    expect(noteTemplatesApi.deleteNoteTemplate).toBeDefined();
    expect(noteTemplatesApi.getTemplateCategories).toBeDefined();
  });
});

describe('Imaging Reports API Client', () => {
  it('should export all required functions', () => {
    expect(imagingReportsApi.getImagingReports).toBeDefined();
    expect(imagingReportsApi.getImagingReport).toBeDefined();
    expect(imagingReportsApi.getPatientImagingReports).toBeDefined();
    expect(imagingReportsApi.createImagingReport).toBeDefined();
    expect(imagingReportsApi.updateImagingReport).toBeDefined();
    expect(imagingReportsApi.deleteImagingReport).toBeDefined();
    expect(imagingReportsApi.searchImagingReports).toBeDefined();
    expect(imagingReportsApi.attachFileToReport).toBeDefined();
    expect(imagingReportsApi.getReportFiles).toBeDefined();
    expect(imagingReportsApi.deleteReportFile).toBeDefined();
  });
});

describe('Prescriptions API Client', () => {
  it('should export all required functions', () => {
    expect(prescriptionsApi.getPrescriptions).toBeDefined();
    expect(prescriptionsApi.getPrescription).toBeDefined();
    expect(prescriptionsApi.getPatientPrescriptions).toBeDefined();
    expect(prescriptionsApi.createPrescription).toBeDefined();
    expect(prescriptionsApi.updatePrescription).toBeDefined();
    expect(prescriptionsApi.deletePrescription).toBeDefined();
    expect(prescriptionsApi.discontinuePrescription).toBeDefined();
    expect(prescriptionsApi.refillPrescription).toBeDefined();
    expect(prescriptionsApi.checkDrugInteractions).toBeDefined();
    expect(prescriptionsApi.updateExpiredPrescriptions).toBeDefined();
  });
});

describe('Medical History API Client', () => {
  it('should export all required functions', () => {
    expect(medicalHistoryApi.getMedicalHistory).toBeDefined();
    expect(medicalHistoryApi.getMedicalHistoryEntry).toBeDefined();
    expect(medicalHistoryApi.getPatientMedicalHistory).toBeDefined();
    expect(medicalHistoryApi.createMedicalHistoryEntry).toBeDefined();
    expect(medicalHistoryApi.updateMedicalHistoryEntry).toBeDefined();
    expect(medicalHistoryApi.deleteMedicalHistoryEntry).toBeDefined();
    expect(medicalHistoryApi.getPatientCriticalAllergies).toBeDefined();
    expect(medicalHistoryApi.getPatientMedicalHistorySummary).toBeDefined();
  });
});

describe('Report Upload API Client', () => {
  it('should export all required functions', () => {
    expect(reportUploadApi.requestUploadUrl).toBeDefined();
    expect(reportUploadApi.getDownloadUrl).toBeDefined();
    expect(reportUploadApi.uploadFileToS3).toBeDefined();
    expect(reportUploadApi.uploadFile).toBeDefined();
    expect(reportUploadApi.validateFile).toBeDefined();
  });

  it('should validate file size correctly', () => {
    const largeFile = new File(['x'.repeat(30 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    const result = reportUploadApi.validateFile(largeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum');
  });

  it('should validate file type correctly', () => {
    const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
    const result = reportUploadApi.validateFile(invalidFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('should accept valid files', () => {
    const validFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const result = reportUploadApi.validateFile(validFile);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
