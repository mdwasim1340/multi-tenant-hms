/**
 * Team Alpha - Medical Record Service
 * Business logic for medical records management
 */

import pool from '../database';
import {
  MedicalRecord,
  RecordAttachment,
  CreateMedicalRecordDTO,
  UpdateMedicalRecordDTO,
  AddAttachmentDTO,
  MedicalRecordFilters,
} from '../types/medicalRecord';

/**
 * Get medical records with filters and pagination
 */
export async function getMedicalRecords(
  tenantId: string,
  filters: MedicalRecordFilters = {}
): Promise<{ records: MedicalRecord[]; total: number }> {
  const {
    page = 1,
    limit = 10,
    patient_id,
    doctor_id,
    status,
    date_from,
    date_to,
    search,
  } = filters;

  const offset = (page - 1) * limit;

  // Build WHERE clause
  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let paramIndex = 1;

  if (patient_id) {
    conditions.push(`mr.patient_id = $${paramIndex}`);
    params.push(patient_id);
    paramIndex++;
  }

  if (doctor_id) {
    conditions.push(`mr.doctor_id = $${paramIndex}`);
    params.push(doctor_id);
    paramIndex++;
  }

  if (status) {
    conditions.push(`mr.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (date_from) {
    conditions.push(`mr.visit_date >= $${paramIndex}`);
    params.push(date_from);
    paramIndex++;
  }

  if (date_to) {
    conditions.push(`mr.visit_date <= $${paramIndex}`);
    params.push(date_to);
    paramIndex++;
  }

  if (search) {
    conditions.push(`(mr.chief_complaint ILIKE $${paramIndex} OR mr.diagnosis ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Set tenant schema
  await pool.query(`SET search_path TO "${tenantId}"`);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM medical_records mr
    WHERE ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get records with patient and doctor info
  const query = `
    SELECT 
      mr.*,
      p.first_name as patient_first_name,
      p.last_name as patient_last_name,
      p.patient_number
    FROM medical_records mr
    LEFT JOIN patients p ON mr.patient_id = p.id
    WHERE ${whereClause}
    ORDER BY mr.visit_date DESC, mr.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Transform results
  const records = result.rows.map((row: any) => ({
    ...row,
    patient: row.patient_first_name ? {
      id: row.patient_id,
      first_name: row.patient_first_name,
      last_name: row.patient_last_name,
      patient_number: row.patient_number,
    } : undefined,
  }));

  return { records, total };
}

/**
 * Get medical record by ID
 */
export async function getMedicalRecordById(
  tenantId: string,
  id: number
): Promise<MedicalRecord | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const query = `
    SELECT 
      mr.*,
      p.first_name as patient_first_name,
      p.last_name as patient_last_name,
      p.patient_number
    FROM medical_records mr
    LEFT JOIN patients p ON mr.patient_id = p.id
    WHERE mr.id = $1
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...row,
    patient: row.patient_first_name ? {
      id: row.patient_id,
      first_name: row.patient_first_name,
      last_name: row.patient_last_name,
      patient_number: row.patient_number,
    } : undefined,
  };
}

/**
 * Create new medical record
 */
export async function createMedicalRecord(
  tenantId: string,
  data: CreateMedicalRecordDTO
): Promise<MedicalRecord> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const query = `
    INSERT INTO medical_records (
      patient_id,
      doctor_id,
      visit_date,
      chief_complaint,
      diagnosis,
      treatment_plan,
      prescriptions,
      vital_signs,
      lab_results,
      notes,
      follow_up_required,
      follow_up_date,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft')
    RETURNING *
  `;

  const values = [
    data.patient_id,
    data.doctor_id,
    data.visit_date,
    data.chief_complaint || null,
    data.diagnosis || null,
    data.treatment_plan || null,
    data.prescriptions ? JSON.stringify(data.prescriptions) : null,
    data.vital_signs ? JSON.stringify(data.vital_signs) : null,
    data.lab_results ? JSON.stringify(data.lab_results) : null,
    data.notes || null,
    data.follow_up_required || false,
    data.follow_up_date || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Update medical record
 */
export async function updateMedicalRecord(
  tenantId: string,
  id: number,
  data: UpdateMedicalRecordDTO
): Promise<MedicalRecord | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  // Check if record exists and is not finalized
  const checkQuery = 'SELECT status FROM medical_records WHERE id = $1';
  const checkResult = await pool.query(checkQuery, [id]);

  if (checkResult.rows.length === 0) {
    return null;
  }

  if (checkResult.rows[0].status === 'finalized') {
    throw new Error('Cannot update finalized medical record');
  }

  // Build update query dynamically
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.visit_date !== undefined) {
    updates.push(`visit_date = $${paramIndex}`);
    values.push(data.visit_date);
    paramIndex++;
  }

  if (data.chief_complaint !== undefined) {
    updates.push(`chief_complaint = $${paramIndex}`);
    values.push(data.chief_complaint);
    paramIndex++;
  }

  if (data.diagnosis !== undefined) {
    updates.push(`diagnosis = $${paramIndex}`);
    values.push(data.diagnosis);
    paramIndex++;
  }

  if (data.treatment_plan !== undefined) {
    updates.push(`treatment_plan = $${paramIndex}`);
    values.push(data.treatment_plan);
    paramIndex++;
  }

  if (data.prescriptions !== undefined) {
    updates.push(`prescriptions = $${paramIndex}`);
    values.push(JSON.stringify(data.prescriptions));
    paramIndex++;
  }

  if (data.vital_signs !== undefined) {
    updates.push(`vital_signs = $${paramIndex}`);
    values.push(JSON.stringify(data.vital_signs));
    paramIndex++;
  }

  if (data.lab_results !== undefined) {
    updates.push(`lab_results = $${paramIndex}`);
    values.push(JSON.stringify(data.lab_results));
    paramIndex++;
  }

  if (data.notes !== undefined) {
    updates.push(`notes = $${paramIndex}`);
    values.push(data.notes);
    paramIndex++;
  }

  if (data.follow_up_required !== undefined) {
    updates.push(`follow_up_required = $${paramIndex}`);
    values.push(data.follow_up_required);
    paramIndex++;
  }

  if (data.follow_up_date !== undefined) {
    updates.push(`follow_up_date = $${paramIndex}`);
    values.push(data.follow_up_date);
    paramIndex++;
  }

  if (updates.length === 0) {
    // No updates provided, return current record
    return getMedicalRecordById(tenantId, id);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE medical_records
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Delete medical record
 */
export async function deleteMedicalRecord(
  tenantId: string,
  id: number
): Promise<boolean> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  // Check if record is finalized
  const checkQuery = 'SELECT status FROM medical_records WHERE id = $1';
  const checkResult = await pool.query(checkQuery, [id]);

  if (checkResult.rows.length === 0) {
    return false;
  }

  if (checkResult.rows[0].status === 'finalized') {
    throw new Error('Cannot delete finalized medical record');
  }

  const query = 'DELETE FROM medical_records WHERE id = $1';
  const result = await pool.query(query, [id]);

  return (result.rowCount || 0) > 0;
}

/**
 * Finalize medical record (lock it from further edits)
 */
export async function finalizeMedicalRecord(
  tenantId: string,
  id: number,
  userId: number
): Promise<MedicalRecord | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const query = `
    UPDATE medical_records
    SET 
      status = 'finalized',
      finalized_at = CURRENT_TIMESTAMP,
      finalized_by = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND status = 'draft'
    RETURNING *
  `;

  const result = await pool.query(query, [userId, id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Get attachments for a medical record
 */
export async function getRecordAttachments(
  tenantId: string,
  recordId: number
): Promise<RecordAttachment[]> {
  // Use tenant ID directly as schema name
  const schemaName = tenantId;
  await pool.query(`SET search_path TO "${schemaName}", public`);

  // Create table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS record_attachments (
      id SERIAL PRIMARY KEY,
      record_id INTEGER NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(100),
      file_size INTEGER,
      s3_key VARCHAR(500) NOT NULL,
      s3_bucket VARCHAR(100) NOT NULL,
      uploaded_by INTEGER,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const query = `
    SELECT *
    FROM record_attachments
    WHERE record_id = $1
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [recordId]);
  return result.rows;
}

/**
 * Add attachment to medical record
 */
export async function addRecordAttachment(
  tenantId: string,
  recordId: number,
  uploadedBy: number,
  data: AddAttachmentDTO
): Promise<RecordAttachment> {
  // Use tenant ID as-is (schema name is already correct from tenant middleware)
  await pool.query(`SET search_path TO "${tenantId}"`);

  // Create table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS record_attachments (
      id SERIAL PRIMARY KEY,
      record_id INTEGER NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(100),
      file_size INTEGER,
      s3_key VARCHAR(500) NOT NULL,
      s3_bucket VARCHAR(100) NOT NULL,
      uploaded_by INTEGER,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Drop foreign key constraint if it exists (allows attachments for any record_id)
  try {
    await pool.query(`
      ALTER TABLE record_attachments 
      DROP CONSTRAINT IF EXISTS record_attachments_record_id_fkey
    `);
  } catch {
    // Constraint may not exist, ignore error
  }

  const query = `
    INSERT INTO record_attachments (
      record_id,
      file_name,
      file_type,
      file_size,
      s3_key,
      s3_bucket,
      uploaded_by,
      description
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const values = [
    recordId,
    data.file_name,
    data.file_type,
    data.file_size,
    data.s3_key,
    data.s3_bucket,
    uploadedBy,
    data.description || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get attachment by ID
 */
export async function getAttachmentById(
  tenantId: string,
  attachmentId: number
): Promise<RecordAttachment | null> {
  // Use tenant ID directly as schema name
  const schemaName = tenantId;
  await pool.query(`SET search_path TO "${schemaName}", public`);

  // Create table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS record_attachments (
      id SERIAL PRIMARY KEY,
      record_id INTEGER NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(100),
      file_size INTEGER,
      s3_key VARCHAR(500) NOT NULL,
      s3_bucket VARCHAR(100) NOT NULL,
      uploaded_by INTEGER,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const query = 'SELECT * FROM record_attachments WHERE id = $1';
  const result = await pool.query(query, [attachmentId]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Delete attachment
 */
export async function deleteRecordAttachment(
  tenantId: string,
  attachmentId: number
): Promise<boolean> {
  // Use tenant ID directly as schema name
  const schemaName = tenantId;
  await pool.query(`SET search_path TO "${schemaName}", public`);

  const query = 'DELETE FROM record_attachments WHERE id = $1 RETURNING s3_key';
  const result = await pool.query(query, [attachmentId]);

  return (result.rowCount || 0) > 0;
}

export default {
  getMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  finalizeMedicalRecord,
  getRecordAttachments,
  addRecordAttachment,
  getAttachmentById,
  deleteRecordAttachment,
};
