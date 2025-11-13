import { Pool, PoolClient } from 'pg';
import {
  Patient,
  CreatePatientData,
  UpdatePatientData,
  PatientSearchQuery,
} from '../types/patient';
import { NotFoundError, DuplicateError } from '../errors/AppError';

export class PatientService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createPatient(
    data: CreatePatientData,
    tenantId: string,
    userId?: number
  ): Promise<Patient> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check for duplicate patient number
      const existingPatient = await client.query(
        'SELECT id FROM patients WHERE patient_number = $1',
        [data.patient_number]
      );

      if (existingPatient.rows.length > 0) {
        throw new DuplicateError('Patient', 'patient_number');
      }

      // Separate custom fields from patient data
      const { custom_fields, ...patientData } = data;

      // Add audit fields
      const dataWithAudit = {
        ...patientData,
        created_by: userId,
        updated_by: userId,
      };

      // Build insert query
      const columns = Object.keys(dataWithAudit);
      const values = Object.values(dataWithAudit);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const insertQuery = `
        INSERT INTO patients (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await client.query(insertQuery, values);
      const patient = result.rows[0];

      // Handle custom fields if provided
      if (custom_fields && Object.keys(custom_fields).length > 0) {
        await this.saveCustomFields(client, patient.id, custom_fields);
      }

      // Fetch complete patient with custom fields
      const completePatient = await this.getPatientById(
        patient.id,
        tenantId,
        client
      );
      if (!completePatient) {
        throw new Error('PATIENT_CREATION_FAILED');
      }
      return completePatient;
    } finally {
      client.release();
    }
  }

  async getPatientById(
    patientId: number,
    tenantId: string,
    client?: PoolClient
  ): Promise<Patient | null> {
    const dbClient = client || (await this.pool.connect());

    try {
      if (!client) {
        await dbClient.query(`SET search_path TO "${tenantId}"`);
      }

      const query = `
        SELECT 
          p.*,
          EXTRACT(YEAR FROM AGE(p.date_of_birth)) as age
        FROM patients p
        WHERE p.id = $1
      `;

      const result = await dbClient.query(query, [patientId]);

      if (result.rows.length === 0) {
        return null;
      }

      const patient = result.rows[0];

      // Get custom fields
      patient.custom_fields = await this.getCustomFields(dbClient, patientId);

      return patient;
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  async updatePatient(
    patientId: number,
    data: UpdatePatientData,
    tenantId: string,
    userId?: number
  ): Promise<Patient> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check patient exists
      const existing = await this.getPatientById(patientId, tenantId, client);
      if (!existing) {
        throw new NotFoundError('Patient');
      }

      // Separate custom fields
      const { custom_fields, ...patientData } = data;

      if (Object.keys(patientData).length > 0) {
        // Add audit fields
        const dataWithAudit = {
          ...patientData,
          updated_by: userId,
          updated_at: new Date(),
        };

        // Build update query
        const entries = Object.entries(dataWithAudit);
        const setClause = entries
          .map(([key], i) => `${key} = $${i + 2}`)
          .join(', ');
        const values = entries.map(([, value]) => value);

        const updateQuery = `
          UPDATE patients 
          SET ${setClause}
          WHERE id = $1
          RETURNING *
        `;

        await client.query(updateQuery, [patientId, ...values]);
      }

      // Update custom fields if provided
      if (custom_fields) {
        await this.deleteCustomFields(client, patientId);
        if (Object.keys(custom_fields).length > 0) {
          await this.saveCustomFields(client, patientId, custom_fields);
        }
      }

      const updatedPatient = await this.getPatientById(
        patientId,
        tenantId,
        client
      );
      if (!updatedPatient) {
        throw new Error('PATIENT_UPDATE_FAILED');
      }
      return updatedPatient;
    } finally {
      client.release();
    }
  }

  async deletePatient(
    patientId: number,
    tenantId: string,
    userId?: number
  ): Promise<Patient> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const patient = await this.getPatientById(patientId, tenantId, client);
      if (!patient) {
        throw new NotFoundError('Patient');
      }

      // Soft delete
      const query = `
        UPDATE patients 
        SET status = 'inactive', updated_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      await client.query(query, [patientId, userId]);

      const deletedPatient = await this.getPatientById(
        patientId,
        tenantId,
        client
      );
      if (!deletedPatient) {
        throw new Error('PATIENT_DELETE_FAILED');
      }
      return deletedPatient;
    } finally {
      client.release();
    }
  }

  private async saveCustomFields(
    client: PoolClient,
    patientId: number,
    customFields: Record<string, any>
  ): Promise<void> {
    const fieldNames = Object.keys(customFields);
    if (fieldNames.length === 0) return;

    // Get field definitions
    const fieldsQuery = `
      SELECT id, name, field_type
      FROM public.custom_fields 
      WHERE name = ANY($1) AND applies_to = 'patients'
    `;

    const fieldsResult = await client.query(fieldsQuery, [fieldNames]);
    const fieldDefinitions = fieldsResult.rows;

    // Insert custom field values
    const values = [];
    for (const fieldDef of fieldDefinitions) {
      const value = customFields[fieldDef.name];
      if (value !== undefined && value !== null && value !== '') {
        values.push({
          entity_type: 'patient',
          entity_id: patientId,
          field_id: fieldDef.id,
          value:
            typeof value === 'object' ? JSON.stringify(value) : String(value),
        });
      }
    }

    if (values.length > 0) {
      const insertQuery = `
        INSERT INTO custom_field_values (entity_type, entity_id, field_id, value)
        VALUES ${values
          .map(
            (_, i) =>
              `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
          )
          .join(', ')}
      `;

      const params = values.flatMap((v) => [
        v.entity_type,
        v.entity_id,
        v.field_id,
        v.value,
      ]);
      await client.query(insertQuery, params);
    }
  }

  private async getCustomFields(
    client: PoolClient,
    patientId: number
  ): Promise<Record<string, any>> {
    const query = `
      SELECT 
        cf.name as field_name,
        cf.field_type as field_type,
        cfv.value as field_value
      FROM custom_field_values cfv
      JOIN public.custom_fields cf ON cf.id = cfv.field_id
      WHERE cfv.entity_type = 'patient' AND cfv.entity_id = $1
      ORDER BY cf.display_order
    `;

    const result = await client.query(query, [patientId]);

    const customFields: Record<string, any> = {};
    result.rows.forEach((row) => {
      customFields[row.field_name] = row.field_value;
    });

    return customFields;
  }

  private async deleteCustomFields(
    client: PoolClient,
    patientId: number
  ): Promise<void> {
    await client.query(
      'DELETE FROM custom_field_values WHERE entity_type = $1 AND entity_id = $2',
      ['patient', patientId]
    );
  }
}
