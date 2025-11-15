import { Request, Response } from 'express';
import { PatientService } from '../services/patient.service';
import {
  PatientSearchSchema,
  CreatePatientSchema,
  UpdatePatientSchema,
} from '../validation/patient.validation';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/AppError';
import { Pool } from 'pg';
import { convertToCSV, formatDateForCSV, generateCSVFilename } from '../utils/csv-export';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const patientService = new PatientService(pool);

export const getPatients = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;

    // Validate query parameters
    const query = PatientSearchSchema.parse(req.query);
    const {
      page,
      limit,
      search,
      status,
      gender,
      age_min,
      age_max,
      city,
      state,
      blood_type,
      sort_by,
      sort_order,
      created_at_from,
      created_at_to,
      custom_field_filters,
    } = query;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Build dynamic query
    const client = await pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let whereConditions: string[] = ['1=1'];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Search across multiple fields
      if (search) {
        whereConditions.push(`(
        patient_number ILIKE $${paramIndex} OR
        first_name ILIKE $${paramIndex} OR
        last_name ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex} OR
        phone ILIKE $${paramIndex} OR
        mobile_phone ILIKE $${paramIndex}
      )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // Status filter
      if (status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      // Gender filter
      if (gender) {
        whereConditions.push(`gender = $${paramIndex}`);
        queryParams.push(gender);
        paramIndex++;
      }

      // Age range filter
      if (age_min !== undefined || age_max !== undefined) {
        const currentDate = new Date();
        if (age_min !== undefined) {
          const maxBirthDate = new Date(
            currentDate.getFullYear() - age_min,
            currentDate.getMonth(),
            currentDate.getDate()
          );
          whereConditions.push(`date_of_birth <= $${paramIndex}`);
          queryParams.push(maxBirthDate.toISOString().split('T')[0]);
          paramIndex++;
        }
        if (age_max !== undefined) {
          const minBirthDate = new Date(
            currentDate.getFullYear() - age_max - 1,
            currentDate.getMonth(),
            currentDate.getDate()
          );
          whereConditions.push(`date_of_birth > $${paramIndex}`);
          queryParams.push(minBirthDate.toISOString().split('T')[0]);
          paramIndex++;
        }
      }

      // Location filters
      if (city) {
        whereConditions.push(`city ILIKE $${paramIndex}`);
        queryParams.push(`%${city}%`);
        paramIndex++;
      }

      if (state) {
        whereConditions.push(`state = $${paramIndex}`);
        queryParams.push(state);
        paramIndex++;
      }

      // Blood type filter
      if (blood_type) {
        whereConditions.push(`blood_type = $${paramIndex}`);
        queryParams.push(blood_type);
        paramIndex++;
      }

      // Created_at date range filters
      if (created_at_from) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        queryParams.push(`${created_at_from}T00:00:00.000Z`);
        paramIndex++;
      }
      if (created_at_to) {
        whereConditions.push(`created_at <= $${paramIndex}`);
        queryParams.push(`${created_at_to}T23:59:59.999Z`);
        paramIndex++;
      }

      // Custom field filters: join when present
      let customWhere: string[] = [];
      if (custom_field_filters && Object.keys(custom_field_filters).length > 0) {
        // Each field must exist for the patient; we use EXISTS subqueries for flexibility
        for (const [fieldName, fieldValue] of Object.entries(custom_field_filters as Record<string, any>)) {
          customWhere.push(`EXISTS (
            SELECT 1 FROM custom_field_values cfv
            JOIN public.custom_fields cf ON cf.id = cfv.field_id
            WHERE cfv.entity_type = 'patient'
              AND cfv.entity_id = patients.id
              AND cf.name = $${paramIndex}
              AND cfv.field_value::text ILIKE $${paramIndex + 1}
          )`);
          queryParams.push(fieldName, `%${String(fieldValue)}%`);
          paramIndex += 2;
        }
      }

      // Build final query
      const whereClause = whereConditions.join(' AND ');
      const orderClause = `ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;

      // Get patients with pagination
      const patientsQuery = `
      SELECT 
        id, patient_number, first_name, last_name, middle_name, preferred_name,
        email, phone, mobile_phone, date_of_birth, gender, marital_status, occupation,
        address_line_1, address_line_2, city, state, postal_code, country,
        emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
        blood_type, status, created_at, updated_at,
        EXTRACT(YEAR FROM AGE(date_of_birth)) as age
      FROM patients 
      WHERE ${[whereClause, ...(customWhere.length ? customWhere : [])].join(' AND ')}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

      queryParams.push(limit, offset);

      // Get total count
      const countQuery = `
      SELECT COUNT(*) as total
      FROM patients 
      WHERE ${[whereClause, ...(customWhere.length ? customWhere : [])].join(' AND ')}
    `;

      const [patientsResult, countResult] = await Promise.all([
        client.query(patientsQuery, queryParams),
        client.query(countQuery, queryParams.slice(0, -2)),
      ]);

      const patients = patientsResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const pages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          patients,
          pagination: {
            page,
            limit,
            total,
            pages,
            has_next: page < pages,
            has_prev: page > 1,
          },
        },
      });
    } finally {
      client.release();
    }
  }
);


export const createPatient = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).userId;

    // Validate request body
    const validatedData = CreatePatientSchema.parse(req.body);

    // Create patient
    const patient = await patientService.createPatient(
      validatedData,
      tenantId,
      userId
    );

    res.status(201).json({
      success: true,
      data: { patient },
      message: 'Patient created successfully',
    });
  }
);


export const getPatientById = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const patientId = parseInt(req.params.id);

    if (isNaN(patientId)) {
      throw new ValidationError('Invalid patient ID');
    }

    const patient = await patientService.getPatientById(patientId, tenantId);

    if (!patient) {
      throw new NotFoundError('Patient');
    }

    res.json({
      success: true,
      data: { patient },
    });
  }
);


export const updatePatient = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const patientId = parseInt(req.params.id);
    const userId = (req as any).userId;

    if (isNaN(patientId)) {
      throw new ValidationError('Invalid patient ID');
    }

    // Validate request body
    const validatedData = UpdatePatientSchema.parse(req.body);

    // Update patient
    const patient = await patientService.updatePatient(
      patientId,
      validatedData,
      tenantId,
      userId
    );

    res.json({
      success: true,
      data: { patient },
      message: 'Patient updated successfully',
    });
  }
);


export const deletePatient = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const patientId = parseInt(req.params.id);
    const userId = (req as any).userId;

    if (isNaN(patientId)) {
      throw new ValidationError('Invalid patient ID');
    }

    // Soft delete patient
    const patient = await patientService.deletePatient(
      patientId,
      tenantId,
      userId
    );

    res.json({
      success: true,
      data: { patient },
      message: 'Patient deactivated successfully',
    });
  }
);


/**
 * Export patients to CSV
 * Supports filtering and selection of specific patient IDs
 */
export const exportPatientsCSV = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;

    // Parse query parameters
    const {
      search,
      status,
      gender,
      age_min,
      age_max,
      city,
      state,
      blood_type,
      created_at_from,
      created_at_to,
      patient_ids, // Comma-separated list of patient IDs to export
    } = req.query;

    const client = await pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let whereConditions: string[] = ['1=1'];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // If specific patient IDs provided, only export those
      if (patient_ids && typeof patient_ids === 'string') {
        const ids = patient_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (ids.length > 0) {
          whereConditions.push(`id = ANY($${paramIndex})`);
          queryParams.push(ids);
          paramIndex++;
        }
      } else {
        // Apply filters only if not exporting specific IDs
        
        // Search filter
        if (search) {
          whereConditions.push(`(
            patient_number ILIKE $${paramIndex} OR
            first_name ILIKE $${paramIndex} OR
            last_name ILIKE $${paramIndex} OR
            email ILIKE $${paramIndex} OR
            phone ILIKE $${paramIndex} OR
            mobile_phone ILIKE $${paramIndex}
          )`);
          queryParams.push(`%${search}%`);
          paramIndex++;
        }

        // Status filter
        if (status) {
          whereConditions.push(`status = $${paramIndex}`);
          queryParams.push(status);
          paramIndex++;
        }

        // Gender filter
        if (gender) {
          whereConditions.push(`gender = $${paramIndex}`);
          queryParams.push(gender);
          paramIndex++;
        }

        // Age range filter
        if (age_min !== undefined || age_max !== undefined) {
          const currentDate = new Date();
          if (age_min !== undefined) {
            const maxBirthDate = new Date(
              currentDate.getFullYear() - Number(age_min),
              currentDate.getMonth(),
              currentDate.getDate()
            );
            whereConditions.push(`date_of_birth <= $${paramIndex}`);
            queryParams.push(maxBirthDate.toISOString().split('T')[0]);
            paramIndex++;
          }
          if (age_max !== undefined) {
            const minBirthDate = new Date(
              currentDate.getFullYear() - Number(age_max) - 1,
              currentDate.getMonth(),
              currentDate.getDate()
            );
            whereConditions.push(`date_of_birth > $${paramIndex}`);
            queryParams.push(minBirthDate.toISOString().split('T')[0]);
            paramIndex++;
          }
        }

        // Location filters
        if (city) {
          whereConditions.push(`city ILIKE $${paramIndex}`);
          queryParams.push(`%${city}%`);
          paramIndex++;
        }

        if (state) {
          whereConditions.push(`state = $${paramIndex}`);
          queryParams.push(state);
          paramIndex++;
        }

        // Blood type filter
        if (blood_type) {
          whereConditions.push(`blood_type = $${paramIndex}`);
          queryParams.push(blood_type);
          paramIndex++;
        }

        // Date range filters
        if (created_at_from) {
          whereConditions.push(`created_at >= $${paramIndex}`);
          queryParams.push(`${created_at_from}T00:00:00.000Z`);
          paramIndex++;
        }
        if (created_at_to) {
          whereConditions.push(`created_at <= $${paramIndex}`);
          queryParams.push(`${created_at_to}T23:59:59.999Z`);
          paramIndex++;
        }
      }

      const whereClause = whereConditions.join(' AND ');

      // Fetch all matching patients (no pagination for export)
      const query = `
        SELECT 
          patient_number,
          first_name,
          last_name,
          middle_name,
          preferred_name,
          email,
          phone,
          mobile_phone,
          date_of_birth,
          gender,
          marital_status,
          occupation,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          emergency_contact_name,
          emergency_contact_relationship,
          emergency_contact_phone,
          emergency_contact_email,
          blood_type,
          allergies,
          current_medications,
          medical_history,
          family_medical_history,
          insurance_provider,
          insurance_policy_number,
          status,
          created_at,
          EXTRACT(YEAR FROM AGE(date_of_birth)) as age
        FROM patients 
        WHERE ${whereClause}
        ORDER BY created_at DESC
      `;

      const result = await client.query(query, queryParams);
      const patients = result.rows;

      // Define CSV columns
      const columns = [
        { key: 'patient_number', label: 'Patient Number' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'middle_name', label: 'Middle Name' },
        { key: 'preferred_name', label: 'Preferred Name' },
        { key: 'age', label: 'Age' },
        { key: 'date_of_birth', label: 'Date of Birth' },
        { key: 'gender', label: 'Gender' },
        { key: 'marital_status', label: 'Marital Status' },
        { key: 'occupation', label: 'Occupation' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'mobile_phone', label: 'Mobile Phone' },
        { key: 'address_line_1', label: 'Address Line 1' },
        { key: 'address_line_2', label: 'Address Line 2' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'postal_code', label: 'Postal Code' },
        { key: 'country', label: 'Country' },
        { key: 'emergency_contact_name', label: 'Emergency Contact Name' },
        { key: 'emergency_contact_relationship', label: 'Emergency Contact Relationship' },
        { key: 'emergency_contact_phone', label: 'Emergency Contact Phone' },
        { key: 'emergency_contact_email', label: 'Emergency Contact Email' },
        { key: 'blood_type', label: 'Blood Type' },
        { key: 'allergies', label: 'Allergies' },
        { key: 'current_medications', label: 'Current Medications' },
        { key: 'medical_history', label: 'Medical History' },
        { key: 'family_medical_history', label: 'Family Medical History' },
        { key: 'insurance_provider', label: 'Insurance Provider' },
        { key: 'insurance_policy_number', label: 'Insurance Policy Number' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Registration Date' },
      ];

      // Format dates for CSV
      const formattedPatients = patients.map(patient => ({
        ...patient,
        date_of_birth: formatDateForCSV(patient.date_of_birth),
        created_at: formatDateForCSV(patient.created_at),
      }));

      // Convert to CSV
      const csv = convertToCSV(formattedPatients, columns);

      // Set response headers for CSV download
      const filename = generateCSVFilename('patients');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Add BOM for Excel UTF-8 compatibility and send CSV
      res.send('\uFEFF' + csv);
    } finally {
      client.release();
    }
  }
);
