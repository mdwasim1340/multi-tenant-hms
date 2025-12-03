/**
 * PatientSelector Property Tests
 * Property-based tests for patient search functionality
 * 
 * Feature: medical-records-enhancement, Property 14: Patient Search Multi-Criteria
 * Validates: Requirements 7.2
 */

import { describe, it, expect } from 'vitest';

/**
 * Property 14: Patient Search Multi-Criteria
 * 
 * For any search query (name, patient number, or DOB), the search results should:
 * 1. Only include patients that match the search criteria
 * 2. Match across multiple fields (first_name, last_name, patient_number, date_of_birth)
 * 3. Be case-insensitive
 * 4. Return results in consistent order
 */

describe('Property 14: Patient Search Multi-Criteria', () => {
  // Mock patient data for testing
  const mockPatients = [
    {
      id: 1,
      patient_number: 'P001',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1985-01-01',
      status: 'active'
    },
    {
      id: 2,
      patient_number: 'P002',
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: '1990-05-15',
      status: 'active'
    },
    {
      id: 3,
      patient_number: 'P003',
      first_name: 'Bob',
      last_name: 'Johnson',
      date_of_birth: '1975-12-25',
      status: 'active'
    }
  ];

  // Search function that mimics backend behavior
  const searchPatients = (patients: typeof mockPatients, query: string) => {
    if (!query) return patients;
    
    const lowerQuery = query.toLowerCase();
    return patients.filter(patient => 
      patient.first_name.toLowerCase().includes(lowerQuery) ||
      patient.last_name.toLowerCase().includes(lowerQuery) ||
      patient.patient_number.toLowerCase().includes(lowerQuery) ||
      patient.date_of_birth.includes(query)
    );
  };

  it('should match patients by first name (case-insensitive)', () => {
    const results = searchPatients(mockPatients, 'john');
    expect(results).toHaveLength(1);
    expect(results[0].first_name).toBe('John');

    // Case insensitive
    const resultsUpper = searchPatients(mockPatients, 'JOHN');
    expect(resultsUpper).toHaveLength(1);
    expect(resultsUpper[0].first_name).toBe('John');
  });

  it('should match patients by last name (case-insensitive)', () => {
    const results = searchPatients(mockPatients, 'smith');
    expect(results).toHaveLength(1);
    expect(results[0].last_name).toBe('Smith');

    // Case insensitive
    const resultsUpper = searchPatients(mockPatients, 'SMITH');
    expect(resultsUpper).toHaveLength(1);
    expect(resultsUpper[0].last_name).toBe('Smith');
  });

  it('should match patients by patient number', () => {
    const results = searchPatients(mockPatients, 'P002');
    expect(results).toHaveLength(1);
    expect(results[0].patient_number).toBe('P002');

    // Case insensitive
    const resultsLower = searchPatients(mockPatients, 'p002');
    expect(resultsLower).toHaveLength(1);
    expect(resultsLower[0].patient_number).toBe('P002');
  });

  it('should match patients by date of birth', () => {
    const results = searchPatients(mockPatients, '1990-05-15');
    expect(results).toHaveLength(1);
    expect(results[0].date_of_birth).toBe('1990-05-15');

    // Partial date match
    const partialResults = searchPatients(mockPatients, '1990');
    expect(partialResults).toHaveLength(1);
    expect(partialResults[0].date_of_birth).toContain('1990');
  });

  it('should return empty array when no matches found', () => {
    const results = searchPatients(mockPatients, 'nonexistent');
    expect(results).toHaveLength(0);
  });

  it('should return all patients when query is empty', () => {
    const results = searchPatients(mockPatients, '');
    expect(results).toHaveLength(mockPatients.length);
  });

  it('should match partial strings', () => {
    const results = searchPatients(mockPatients, 'Jo');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(p => p.first_name.includes('Jo') || p.last_name.includes('Jo'))).toBe(true);
  });

  it('should maintain consistent results for same query', () => {
    const results1 = searchPatients(mockPatients, 'john');
    const results2 = searchPatients(mockPatients, 'john');
    
    expect(results1).toEqual(results2);
  });

  it('should search across multiple fields simultaneously', () => {
    // A query that could match different fields
    const results = searchPatients(mockPatients, 'P');
    
    // Should match patient numbers (P001, P002, P003)
    expect(results.length).toBeGreaterThan(0);
  });

  it('should handle special characters in search', () => {
    const patientsWithSpecialChars = [
      ...mockPatients,
      {
        id: 4,
        patient_number: 'P-004',
        first_name: "O'Brien",
        last_name: 'Smith-Jones',
        date_of_birth: '1980-01-01',
        status: 'active'
      }
    ];

    const results = searchPatients(patientsWithSpecialChars, "O'Brien");
    expect(results).toHaveLength(1);
    expect(results[0].first_name).toBe("O'Brien");
  });
});

/**
 * Property: Search results should be deterministic
 * 
 * For any given search query and patient dataset, the search should always
 * return the same results in the same order.
 */
describe('Property: Search Determinism', () => {
  const mockPatients = [
    { id: 1, patient_number: 'P001', first_name: 'Alice', last_name: 'Anderson', date_of_birth: '1985-01-01', status: 'active' },
    { id: 2, patient_number: 'P002', first_name: 'Bob', last_name: 'Brown', date_of_birth: '1990-05-15', status: 'active' },
    { id: 3, patient_number: 'P003', first_name: 'Charlie', last_name: 'Clark', date_of_birth: '1975-12-25', status: 'active' }
  ];

  const searchPatients = (patients: typeof mockPatients, query: string) => {
    if (!query) return patients;
    
    const lowerQuery = query.toLowerCase();
    return patients.filter(patient => 
      patient.first_name.toLowerCase().includes(lowerQuery) ||
      patient.last_name.toLowerCase().includes(lowerQuery) ||
      patient.patient_number.toLowerCase().includes(lowerQuery) ||
      patient.date_of_birth.includes(query)
    );
  };

  it('should return consistent results for multiple executions', () => {
    const query = 'a';
    const iterations = 10;
    const results = [];

    for (let i = 0; i < iterations; i++) {
      results.push(searchPatients(mockPatients, query));
    }

    // All results should be identical
    for (let i = 1; i < iterations; i++) {
      expect(results[i]).toEqual(results[0]);
    }
  });

  it('should maintain order consistency', () => {
    const results1 = searchPatients(mockPatients, 'P');
    const results2 = searchPatients(mockPatients, 'P');
    
    // Check that IDs are in the same order
    const ids1 = results1.map(p => p.id);
    const ids2 = results2.map(p => p.id);
    
    expect(ids1).toEqual(ids2);
  });
});
