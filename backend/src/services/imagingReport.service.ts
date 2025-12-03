import { Pool } from 'pg';
import {
  ImagingReport,
  ImagingReportFile,
  CreateImagingReportRequest,
  UpdateImagingReportRequest,
  ImagingReportFilters,
} from '../types/imagingReport';

// Extended filters interface for internal use
interface ExtendedImagingReportFilters extends ImagingReportFilters {
  body_part?: string;
}

export class ImagingReportService {
  constructor(private pool: Pool) {}

  async createReport(
    tenantId: string,
    data: CreateImagingReportRequest,
    createdBy: number
  ): Promise<ImagingReport> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Create table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS imaging_reports (
          id SERIAL PRIMARY KEY,
          patient_id INTEGER NOT NULL,
          imaging_type VARCHAR(100) NOT NULL,
          body_part VARCHAR(100),
          radiologist_id INTEGER,
          findings TEXT NOT NULL,
          impression TEXT,
          recommendations TEXT,
          report_date DATE,
          study_date DATE,
          modality VARCHAR(50),
          contrast_used BOOLEAN DEFAULT false,
          status VARCHAR(20) DEFAULT 'pending',
          created_by INTEGER,
          updated_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = await client.query<ImagingReport>(
        `INSERT INTO imaging_reports (
          patient_id, imaging_type, body_part, radiologist_id,
          findings, impression, report_date, study_date, modality, contrast_used, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          data.patient_id,
          data.imaging_type,
          data.body_part || null,
          data.radiologist_id,
          data.findings,
          data.impression || null,
          data.report_date,
          data.study_date || null,
          data.modality || null,
          data.contrast_used || false,
          'pending',
          createdBy,
        ]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getReportById(tenantId: string, reportId: number): Promise<ImagingReport | null> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query<ImagingReport>(
        `SELECT * FROM imaging_reports WHERE id = $1`,
        [reportId]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getReports(
    tenantId: string,
    filters?: ExtendedImagingReportFilters
  ): Promise<{ reports: ImagingReport[]; total: number }> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check if imaging_reports table exists
      const tableCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'imaging_reports'
        )`,
        [tenantId]
      );

      if (!tableCheck.rows[0].exists) {
        return { reports: [], total: 0 };
      }

      const whereConditions: string[] = ['1=1'];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (filters?.patient_id) {
        whereConditions.push(`patient_id = $${paramIndex}`);
        queryParams.push(filters.patient_id);
        paramIndex++;
      }

      if (filters?.imaging_type) {
        whereConditions.push(`imaging_type = $${paramIndex}`);
        queryParams.push(filters.imaging_type);
        paramIndex++;
      }

      if (filters?.body_part) {
        whereConditions.push(`body_part ILIKE $${paramIndex}`);
        queryParams.push(`%${filters.body_part}%`);
        paramIndex++;
      }

      if (filters?.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(filters.status);
        paramIndex++;
      }

      if (filters?.date_from) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        queryParams.push(filters.date_from);
        paramIndex++;
      }

      if (filters?.date_to) {
        whereConditions.push(`created_at <= $${paramIndex}`);
        queryParams.push(filters.date_to);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*) FROM imaging_reports WHERE ${whereClause}`,
        queryParams
      );

      // Get paginated results
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      const result = await client.query<ImagingReport>(
        `SELECT * FROM imaging_reports 
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      return {
        reports: result.rows,
        total: parseInt(countResult.rows[0].count),
      };
    } catch (error) {
      console.error('Error in getReports:', error);
      return { reports: [], total: 0 };
    } finally {
      client.release();
    }
  }


  async getReportsByPatient(
    tenantId: string,
    patientId: number,
    filters?: ExtendedImagingReportFilters
  ): Promise<{ reports: ImagingReport[]; total: number }> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check if imaging_reports table exists
      const tableCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'imaging_reports'
        )`,
        [tenantId]
      );

      if (!tableCheck.rows[0].exists) {
        return { reports: [], total: 0 };
      }

      const whereConditions: string[] = ['patient_id = $1'];
      const queryParams: any[] = [patientId];
      let paramIndex = 2;

      if (filters?.imaging_type) {
        whereConditions.push(`imaging_type = $${paramIndex}`);
        queryParams.push(filters.imaging_type);
        paramIndex++;
      }

      if (filters?.body_part) {
        whereConditions.push(`body_part ILIKE $${paramIndex}`);
        queryParams.push(`%${filters.body_part}%`);
        paramIndex++;
      }

      if (filters?.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(filters.status);
        paramIndex++;
      }

      if (filters?.date_from) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        queryParams.push(filters.date_from);
        paramIndex++;
      }

      if (filters?.date_to) {
        whereConditions.push(`created_at <= $${paramIndex}`);
        queryParams.push(filters.date_to);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*) FROM imaging_reports WHERE ${whereClause}`,
        queryParams
      );

      // Get paginated results
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      const result = await client.query<ImagingReport>(
        `SELECT * FROM imaging_reports 
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      return {
        reports: result.rows,
        total: parseInt(countResult.rows[0].count),
      };
    } catch (error) {
      console.error('Error in getReportsByPatient:', error);
      return { reports: [], total: 0 };
    } finally {
      client.release();
    }
  }

  async updateReport(
    tenantId: string,
    reportId: number,
    data: UpdateImagingReportRequest,
    updatedBy: number
  ): Promise<ImagingReport | null> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const updateFields: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (data.imaging_type !== undefined) {
        updateFields.push(`imaging_type = $${paramIndex}`);
        queryParams.push(data.imaging_type);
        paramIndex++;
      }

      if (data.body_part !== undefined) {
        updateFields.push(`body_part = $${paramIndex}`);
        queryParams.push(data.body_part);
        paramIndex++;
      }

      if ((data as any).radiologist_id !== undefined) {
        updateFields.push(`radiologist_id = $${paramIndex}`);
        queryParams.push((data as any).radiologist_id);
        paramIndex++;
      }

      if (data.findings !== undefined) {
        updateFields.push(`findings = $${paramIndex}`);
        queryParams.push(data.findings);
        paramIndex++;
      }

      if (data.impression !== undefined) {
        updateFields.push(`impression = $${paramIndex}`);
        queryParams.push(data.impression);
        paramIndex++;
      }

      if ((data as any).recommendations !== undefined) {
        updateFields.push(`recommendations = $${paramIndex}`);
        queryParams.push((data as any).recommendations);
        paramIndex++;
      }

      if (data.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        queryParams.push(data.status);
        paramIndex++;
      }

      updateFields.push(`updated_by = $${paramIndex}`);
      queryParams.push(updatedBy);
      paramIndex++;

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      queryParams.push(reportId);

      const result = await client.query<ImagingReport>(
        `UPDATE imaging_reports 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        queryParams
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async deleteReport(tenantId: string, reportId: number): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Delete associated files first (ignore if table doesn't exist)
      try {
        await client.query(`DELETE FROM imaging_report_files WHERE report_id = $1`, [reportId]);
      } catch {
        // Table may not exist
      }

      const result = await client.query(`DELETE FROM imaging_reports WHERE id = $1`, [reportId]);

      return result.rowCount !== null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  // File operations
  async addReportFile(
    tenantId: string,
    reportId: number,
    fileData: {
      file_name: string;
      file_type: string;
      file_size: number;
      s3_key: string;
      s3_url: string;
    },
    uploadedBy: number
  ): Promise<ImagingReportFile> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query<ImagingReportFile>(
        `INSERT INTO imaging_report_files (
          report_id, file_name, file_type, file_size,
          s3_key, s3_url, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          reportId,
          fileData.file_name,
          fileData.file_type,
          fileData.file_size,
          fileData.s3_key,
          fileData.s3_url,
          uploadedBy,
        ]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getReportFiles(tenantId: string, reportId: number): Promise<ImagingReportFile[]> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query<ImagingReportFile>(
        `SELECT * FROM imaging_report_files 
         WHERE report_id = $1
         ORDER BY uploaded_at DESC`,
        [reportId]
      );

      return result.rows;
    } catch {
      return [];
    } finally {
      client.release();
    }
  }

  async deleteReportFile(tenantId: string, fileId: number): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query(`DELETE FROM imaging_report_files WHERE id = $1`, [fileId]);

      return result.rowCount !== null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  async searchReports(
    tenantId: string,
    searchTerm: string,
    filters?: ExtendedImagingReportFilters
  ): Promise<{ reports: ImagingReport[]; total: number }> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check if imaging_reports table exists
      const tableCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'imaging_reports'
        )`,
        [tenantId]
      );

      if (!tableCheck.rows[0].exists) {
        return { reports: [], total: 0 };
      }

      const whereConditions: string[] = [
        `(findings ILIKE $1 OR impression ILIKE $1 OR body_part ILIKE $1)`,
      ];
      const queryParams: any[] = [`%${searchTerm}%`];
      let paramIndex = 2;

      if (filters?.imaging_type) {
        whereConditions.push(`imaging_type = $${paramIndex}`);
        queryParams.push(filters.imaging_type);
        paramIndex++;
      }

      if (filters?.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(filters.status);
        paramIndex++;
      }

      if (filters?.date_from) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        queryParams.push(filters.date_from);
        paramIndex++;
      }

      if (filters?.date_to) {
        whereConditions.push(`created_at <= $${paramIndex}`);
        queryParams.push(filters.date_to);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*) FROM imaging_reports WHERE ${whereClause}`,
        queryParams
      );

      // Get paginated results
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      const result = await client.query<ImagingReport>(
        `SELECT * FROM imaging_reports 
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      return {
        reports: result.rows,
        total: parseInt(countResult.rows[0].count),
      };
    } catch (error) {
      console.error('Error in searchReports:', error);
      return { reports: [], total: 0 };
    } finally {
      client.release();
    }
  }
}
