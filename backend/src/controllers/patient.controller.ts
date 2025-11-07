import { Request, Response } from 'express';
import { PatientService } from '../services/patient.service';
import {
  PatientSearchSchema,
  CreatePatientSchema,
} from '../validation/patient.validation';
import { asyncHandler } from '../middleware/errorHandler';
import { Pool } from 'pg';

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
      WHERE ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

      queryParams.push(limit, offset);

      // Get total count
      const countQuery = `
      SELECT COUNT(*) as total
      FROM patients 
      WHERE ${whereClause}
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
    const userId = (req as any).user?.id; // From auth middleware

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
