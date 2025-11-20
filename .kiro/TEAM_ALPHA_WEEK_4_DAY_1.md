# Team Alpha - Week 4, Day 1: Database Schema & S3 Setup

**Date:** November 18, 2025  
**Week:** 4 of 8  
**Day:** 1 of 5  
**Focus:** Medical Records Database & S3 Configuration  
**Status:** In Progress 🚀

---

## 🎯 Day 1 Objectives

### Morning Tasks (3-4 hours)
1. ✅ Create medical records database schema
2. ✅ Create record attachments table
3. ✅ Create diagnoses table
4. ✅ Apply migrations to all tenant schemas

### Afternoon Tasks (2-3 hours)
1. ✅ Configure S3 bucket structure
2. ✅ Set up Intelligent-Tiering
3. ✅ Configure lifecycle policies
4. ✅ Test S3 connectivity

### Evening Tasks (1-2 hours)
1. ✅ Create S3 helper functions
2. ✅ Implement file compression
3. ✅ Test upload/download
4. ✅ Document S3 patterns

---

## 📋 Database Schema Design

### medical_records Table
**Purpose**: Store patient medical visit records

**Columns**:
- `id` - Primary key
- `patient_id` - Foreign key to patients
- `doctor_id` - Foreign key to public.users
- `visit_date` - Date/time of visit
- `chief_complaint` - Main reason for visit
- `diagnosis` - Medical diagnosis
- `treatment_plan` - Treatment recommendations
- `prescriptions` - JSONB array of medications
- `vital_signs` - JSONB (BP, temp, pulse, etc.)
- `lab_results` - JSONB lab test results
- `notes` - Additional notes
- `follow_up_required` - Boolean flag
- `follow_up_date` - Next visit date
- `status` - draft, finalized
- `finalized_at` - Timestamp when finalized
- `finalized_by` - User who finalized
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### record_attachments Table
**Purpose**: Store file attachments for medical records

**Columns**:
- `id` - Primary key
- `record_id` - Foreign key to medical_records
- `file_name` - Original filename
- `file_type` - MIME type
- `file_size` - Size in bytes
- `s3_key` - S3 object key
- `s3_bucket` - S3 bucket name
- `uploaded_by` - User who uploaded
- `description` - File description
- `created_at` - Upload timestamp

### diagnoses Table
**Purpose**: Store multiple diagnoses per record

**Columns**:
- `id` - Primary key
- `record_id` - Foreign key to medical_records
- `icd_code` - ICD-10 code
- `diagnosis_name` - Diagnosis description
- `diagnosis_type` - primary, secondary
- `notes` - Additional notes
- `created_at` - Creation timestamp

---

## 🗄️ S3 Bucket Structure

### Folder Organization
```
{tenant-id}/
  medical-records/
    {year}/
      {month}/
        {record-id}/
          {filename}
```

### Example Paths
```
tenant_1762083064503/
  medical-records/
    2025/
      11/
        1/
          lab-results.pdf
          xray-chest.jpg
          prescription-001.pdf
        2/
          ecg-report.pdf
          blood-test.pdf
```

### Benefits
- **Organized**: Easy to navigate
- **Scalable**: Handles millions of files
- **Efficient**: Fast lookups
- **Isolated**: Tenant separation
- **Archivable**: Easy to archive by date

---

## 🔧 S3 Configuration

### Intelligent-Tiering
**Purpose**: Automatically move files to cheaper storage

**Configuration**:
- **Frequent Access**: 0-30 days
- **Infrequent Access**: 30-90 days
- **Archive Instant Access**: 90-180 days
- **Archive Access**: 180+ days

**Savings**: Up to 95% on storage costs

### Lifecycle Policies
**Purpose**: Automatically archive old files

**Rules**:
1. **Transition to Glacier**: After 90 days
2. **Delete old versions**: After 365 days
3. **Clean up incomplete uploads**: After 7 days

### Bucket Policies
**Purpose**: Secure access control

**Rules**:
- Require encryption at rest
- Require encryption in transit
- Block public access
- Enable versioning
- Enable logging

---

## 💻 Implementation Plan

### Step 1: Create Migration File
**File**: `backend/migrations/1731920000000_create_medical_records.sql`

**Content**:
```sql
-- Medical Records Table
CREATE TABLE IF NOT EXISTS medical_records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL,
  visit_date TIMESTAMP NOT NULL,
  chief_complaint TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  prescriptions JSONB,
  vital_signs JSONB,
  lab_results JSONB,
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  status VARCHAR(50) DEFAULT 'draft',
  finalized_at TIMESTAMP,
  finalized_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Record Attachments Table
CREATE TABLE IF NOT EXISTS record_attachments (
  id SERIAL PRIMARY KEY,
  record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  s3_bucket VARCHAR(255) NOT NULL,
  uploaded_by INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diagnoses Table
CREATE TABLE IF NOT EXISTS diagnoses (
  id SERIAL PRIMARY KEY,
  record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  icd_code VARCHAR(20),
  diagnosis_name VARCHAR(255) NOT NULL,
  diagnosis_type VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS medical_records_patient_id_idx ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS medical_records_doctor_id_idx ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS medical_records_visit_date_idx ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS medical_records_status_idx ON medical_records(status);
CREATE INDEX IF NOT EXISTS record_attachments_record_id_idx ON record_attachments(record_id);
CREATE INDEX IF NOT EXISTS diagnoses_record_id_idx ON diagnoses(record_id);
```

### Step 2: Apply Migration Script
**File**: `backend/scripts/apply-medical-records-migration.js`

**Purpose**: Apply migration to all tenant schemas

### Step 3: S3 Helper Functions
**File**: `backend/src/services/s3.service.ts`

**Functions**:
- `generateUploadUrl(tenantId, recordId, filename)` - Get presigned upload URL
- `generateDownloadUrl(s3Key)` - Get presigned download URL
- `compressFile(buffer)` - Compress file with gzip
- `getS3Key(tenantId, recordId, filename)` - Generate S3 key
- `deleteFile(s3Key)` - Delete file from S3

### Step 4: Test S3 Integration
**File**: `backend/tests/test-s3-medical-records.js`

**Tests**:
- Upload file
- Download file
- Compress file
- Delete file
- Multi-tenant isolation

---

## 🧪 Testing Checklist

### Database Tests
- [ ] Tables created successfully
- [ ] Foreign keys work
- [ ] Indexes created
- [ ] Constraints enforced
- [ ] Multi-tenant isolation

### S3 Tests
- [ ] Presigned upload URL generated
- [ ] Presigned download URL generated
- [ ] File compression works
- [ ] File upload works
- [ ] File download works
- [ ] File deletion works
- [ ] Tenant isolation works

---

## 📊 Success Criteria

### Day 1 Complete When:
- [ ] Database schema created
- [ ] Migration applied to all tenants
- [ ] S3 bucket configured
- [ ] S3 helper functions created
- [ ] Tests passing
- [ ] Documentation updated

### Quality Standards:
- [ ] SQL follows conventions
- [ ] Indexes for performance
- [ ] Foreign keys for integrity
- [ ] S3 security configured
- [ ] Code documented

---

**Status**: Day 1 Starting  
**Next**: Create database migration  
**Timeline**: On Schedule  

---

**Team Alpha - Week 4, Day 1: Let's build the foundation! 🏗️💪**
