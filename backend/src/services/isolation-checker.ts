import { Pool } from 'pg';
import pool from '../database';
import { IsolationType, IsolationRequirement, IsolationRoomAvailability } from '../types/bed-management';

/**
 * Isolation Requirements Checker Service
 * 
 * Determines isolation requirements based on:
 * - Patient diagnoses (ICD-10 codes)
 * - Lab results (cultures, PCR tests)
 * - Clinical symptoms
 * - Infection control protocols
 * 
 * Prevents inappropriate bed assignments that violate infection control.
 */
export class IsolationChecker {
  
  // ICD-10 codes requiring specific isolation types
  private readonly ISOLATION_DIAGNOSES = {
    contact: [
      'A04', // Bacterial intestinal infections (C. diff)
      'B95.6', // MRSA
      'B96.2', // E. coli
      'A41', // Sepsis (some types)
      'L08', // Skin infections
    ],
    droplet: [
      'J09', // Influenza
      'J10', // Influenza
      'J11', // Influenza
      'J18', // Pneumonia
      'A37', // Pertussis (whooping cough)
      'B05', // Measles
      'B06', // Rubella
    ],
    airborne: [
      'A15', // Tuberculosis (respiratory)
      'A16', // Tuberculosis (respiratory)
      'B05', // Measles
      'B01', // Varicella (chickenpox)
      'A48.1', // Legionnaires' disease
    ],
    protective: [
      'D70', // Neutropenia
      'C91', // Lymphoid leukemia
      'C92', // Myeloid leukemia
      'Z94', // Transplant status
    ]
  };

  // Lab results requiring isolation
  private readonly ISOLATION_LAB_RESULTS = {
    contact: ['MRSA', 'VRE', 'C.DIFF', 'CRE', 'ESBL'],
    droplet: ['INFLUENZA', 'RSV', 'ADENOVIRUS'],
    airborne: ['TB', 'MEASLES', 'VARICELLA'],
  };

  /**
   * Check if a patient requires isolation and determine the type
   */
  async checkIsolationRequirements(
    tenantId: string,
    patientId: number
  ): Promise<IsolationRequirement> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get patient diagnoses
      const diagnosesResult = await client.query(`
        SELECT diagnosis_code, diagnosis_description
        FROM medical_records
        WHERE patient_id = $1
        AND diagnosis_code IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 10
      `, [patientId]);

      // Get recent lab results
      const labsResult = await client.query(`
        SELECT test_name, result, result_status
        FROM lab_tests
        WHERE patient_id = $1
        AND result_status = 'positive'
        AND created_at > NOW() - INTERVAL '30 days'
        ORDER BY created_at DESC
      `, [patientId]);

      // Determine isolation requirements
      const isolationTypes: Set<IsolationType> = new Set();
      const reasons: string[] = [];

      // Check diagnoses
      for (const diagnosis of diagnosesResult.rows) {
        const code = diagnosis.diagnosis_code;
        
        for (const [type, codes] of Object.entries(this.ISOLATION_DIAGNOSES)) {
          if (codes.some(isoCode => code.startsWith(isoCode))) {
            isolationTypes.add(type as IsolationType);
            reasons.push(`Diagnosis: ${diagnosis.diagnosis_description} (${code})`);
          }
        }
      }

      // Check lab results
      for (const lab of labsResult.rows) {
        const testName = lab.test_name.toUpperCase();
        
        for (const [type, organisms] of Object.entries(this.ISOLATION_LAB_RESULTS)) {
          if (organisms.some(org => testName.includes(org))) {
            isolationTypes.add(type as IsolationType);
            reasons.push(`Lab: ${lab.test_name} - ${lab.result}`);
          }
        }
      }

      // Determine primary isolation type (most restrictive)
      const isolationPriority: IsolationType[] = ['airborne', 'droplet', 'contact', 'protective'];
      let primaryType: IsolationType | null = null;
      
      for (const type of isolationPriority) {
        if (isolationTypes.has(type)) {
          primaryType = type;
          break;
        }
      }

      // Update patient isolation status if needed
      if (primaryType) {
        await client.query(`
          UPDATE patients
          SET 
            isolation_required = true,
            isolation_type = $1,
            isolation_start_date = COALESCE(isolation_start_date, NOW())
          WHERE id = $2
        `, [primaryType, patientId]);
      }

      return {
        patient_id: patientId,
        isolation_required: primaryType !== null,
        isolation_type: primaryType,
        reasons: reasons,
        checked_at: new Date(),
        requires_negative_pressure: primaryType === 'airborne',
        requires_positive_pressure: primaryType === 'protective',
        requires_anteroom: ['airborne', 'protective'].includes(primaryType || ''),
        ppe_requirements: this.getPPERequirements(primaryType)
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get available isolation rooms by type
   */
  async getIsolationRoomAvailability(
    tenantId: string,
    isolationType?: IsolationType
  ): Promise<IsolationRoomAvailability[]> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let query = `
        SELECT 
          u.id as unit_id,
          u.name as unit_name,
          b.isolation_type,
          COUNT(*) FILTER (WHERE b.status = 'available') as available_count,
          COUNT(*) FILTER (WHERE b.status = 'occupied') as occupied_count,
          COUNT(*) as total_count
        FROM beds b
        JOIN departments u ON b.unit_id = u.id
        WHERE b.isolation_capable = true
      `;

      const params: any[] = [];
      
      if (isolationType) {
        query += ` AND b.isolation_type = $1`;
        params.push(isolationType);
      }

      query += `
        GROUP BY u.id, u.name, b.isolation_type
        ORDER BY u.name, b.isolation_type
      `;

      const result = await client.query(query, params);

      return result.rows.map(row => ({
        unit_id: row.unit_id,
        unit_name: row.unit_name,
        isolation_type: row.isolation_type,
        available_count: parseInt(row.available_count),
        occupied_count: parseInt(row.occupied_count),
        total_count: parseInt(row.total_count),
        utilization_rate: (parseInt(row.occupied_count) / parseInt(row.total_count)) * 100
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Validate that a bed assignment meets isolation requirements
   */
  async validateBedAssignment(
    tenantId: string,
    patientId: number,
    bedId: number
  ): Promise<{ valid: boolean; reason?: string }> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get patient isolation requirements
      const patientResult = await client.query(`
        SELECT isolation_required, isolation_type
        FROM patients
        WHERE id = $1
      `, [patientId]);

      if (patientResult.rows.length === 0) {
        return { valid: false, reason: 'Patient not found' };
      }

      const patient = patientResult.rows[0];

      // Get bed capabilities
      const bedResult = await client.query(`
        SELECT isolation_capable, isolation_type, status
        FROM beds
        WHERE id = $1
      `, [bedId]);

      if (bedResult.rows.length === 0) {
        return { valid: false, reason: 'Bed not found' };
      }

      const bed = bedResult.rows[0];

      // Check if bed is available
      if (bed.status !== 'available') {
        return { valid: false, reason: 'Bed is not available' };
      }

      // Check isolation requirements
      if (patient.isolation_required) {
        if (!bed.isolation_capable) {
          return { 
            valid: false, 
            reason: `Patient requires ${patient.isolation_type} isolation but bed is not isolation-capable` 
          };
        }

        if (bed.isolation_type !== patient.isolation_type) {
          return { 
            valid: false, 
            reason: `Isolation type mismatch: patient needs ${patient.isolation_type}, bed provides ${bed.isolation_type}` 
          };
        }
      }

      return { valid: true };
    } finally {
      client.release();
    }
  }

  /**
   * Get PPE requirements for isolation type
   */
  private getPPERequirements(isolationType: IsolationType | null): string[] {
    if (!isolationType) {
      return ['Standard precautions'];
    }

    const ppeMap: Record<IsolationType, string[]> = {
      contact: ['Gloves', 'Gown'],
      droplet: ['Gloves', 'Gown', 'Surgical mask', 'Eye protection'],
      airborne: ['Gloves', 'Gown', 'N95 respirator', 'Eye protection'],
      protective: ['Gloves', 'Gown', 'Mask']
    };

    return ppeMap[isolationType] || ['Standard precautions'];
  }

  /**
   * Clear isolation status for a patient (when no longer needed)
   */
  async clearIsolation(
    tenantId: string,
    patientId: number,
    clearedBy: number,
    reason: string
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      await client.query(`
        UPDATE patients
        SET 
          isolation_required = false,
          isolation_type = NULL,
          isolation_end_date = NOW()
        WHERE id = $1
      `, [patientId]);

      // Log the clearance
      await client.query(`
        INSERT INTO bed_management_audit_log (
          tenant_id,
          action,
          entity_type,
          entity_id,
          performed_by,
          details
        ) VALUES ($1, 'isolation_cleared', 'patient', $2, $3, $4)
      `, [tenantId, patientId, clearedBy, JSON.stringify({ reason })]);
    } finally {
      client.release();
    }
  }
}

export default new IsolationChecker();
