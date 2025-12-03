/**
 * Note Templates API Client
 * Handles all note templates API calls
 */

import api from './client';

export interface NoteTemplate {
  id: number;
  name: string;
  category: 'progress' | 'consultation' | 'admission' | 'discharge' | 'procedure' | 'follow_up' | 'general';
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  name: string;
  category: 'progress' | 'consultation' | 'admission' | 'discharge' | 'procedure' | 'follow_up' | 'general';
  content: string;
  is_active?: boolean;
}

export interface UpdateTemplateData {
  name?: string;
  category?: 'progress' | 'consultation' | 'admission' | 'discharge' | 'procedure' | 'follow_up' | 'general';
  content?: string;
  is_active?: boolean;
}

export interface ListTemplatesParams {
  category?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Get list of note templates
 */
export async function getNoteTemplates(params?: ListTemplatesParams) {
  const response = await api.get('/api/note-templates', { params });
  return response.data;
}

/**
 * Get a single note template by ID
 */
export async function getNoteTemplate(id: number) {
  const response = await api.get(`/api/note-templates/${id}`);
  return response.data;
}

/**
 * Create a new note template
 */
export async function createNoteTemplate(data: CreateTemplateData) {
  const response = await api.post('/api/note-templates', data);
  return response.data;
}

/**
 * Update an existing note template
 */
export async function updateNoteTemplate(id: number, data: UpdateTemplateData) {
  const response = await api.put(`/api/note-templates/${id}`, data);
  return response.data;
}

/**
 * Delete a note template
 */
export async function deleteNoteTemplate(id: number) {
  const response = await api.delete(`/api/note-templates/${id}`);
  return response.data;
}

/**
 * Get all template categories
 */
export async function getTemplateCategories() {
  const response = await api.get('/api/note-templates/categories');
  return response.data;
}
