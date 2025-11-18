# Lab Tests System - User Guide

**Version**: 1.0  
**Last Updated**: November 15, 2025  
**Team**: Alpha

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Lab Tests Catalog](#lab-tests-catalog)
4. [Lab Orders](#lab-orders)
5. [Lab Results](#lab-results)
6. [Workflows](#workflows)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Lab Tests System provides comprehensive laboratory management capabilities including:

- **Test Catalog Management**: Browse and manage available laboratory tests
- **Order Management**: Create and track laboratory test orders
- **Result Management**: Enter, verify, and view test results
- **Alert System**: Automatic notifications for abnormal and critical results
- **Trend Analysis**: Historical result visualization

### Key Features

✅ **Complete Test Catalog** - 100+ pre-configured laboratory tests  
✅ **Order Tracking** - Real-time order status and progress  
✅ **Result Entry** - Support for numeric, text, and value results  
✅ **Verification Workflow** - Two-step result approval process  
✅ **Abnormality Detection** - Automatic flagging based on reference ranges  
✅ **Critical Alerts** - Proactive notifications for critical results  
✅ **Trend Visualization** - Historical result charts  
✅ **Multi-Tenant Support** - Complete data isolation

---

## Getting Started

### Accessing the System

1. **Login** to the hospital management system
2. **Navigate** to the Lab Tests section from the main menu
3. **Select** your desired function:
   - Lab Tests Catalog
   - Lab Orders
   - Lab Results

### User Roles

Different roles have different permissions:

| Role | Tests | Orders | Results | Verify |
|------|-------|--------|---------|--------|
| **Doctor** | View | Create | View | No |
| **Nurse** | View | Create | View | No |
| **Lab Technician** | View | View | Enter | No |
| **Pathologist** | View | View | View | Yes |
| **Admin** | All | All | All | Yes |

---

## Lab Tests Catalog

### Viewing Available Tests

**Path**: `/lab-tests`

The test catalog displays all available laboratory tests organized by category.

**Features**:
- Search by test name or code
- Filter by category
- Filter by status (active/inactive)
- View test details (price, turnaround time, specimen type)

**Test Information**:
- Test Code (e.g., CBC, BMP, HbA1c)
- Test Name (e.g., Complete Blood Count)
- Category (e.g., Hematology, Chemistry)
- Specimen Type (e.g., Blood, Urine)
- Turnaround Time (in hours)
- Price
- Reference Range
- Description

### Test Categories

Common categories include:
- **Hematology**: Blood cell counts and coagulation
- **Chemistry**: Metabolic panels and enzymes
- **Immunology**: Antibodies and immune markers
- **Microbiology**: Cultures and sensitivity
- **Molecular**: Genetic and molecular tests

---

## Lab Orders

### Creating a Lab Order

**Path**: `/lab-orders` → Click "New Order"

**Steps**:

1. **Select Patient**
   - Search for patient by name or ID
   - Verify patient information

2. **Set Priority**
   - **Routine**: Standard processing (default)
   - **Urgent**: Expedited processing
   - **STAT**: Immediate processing

3. **Add Clinical Notes**
   - Document reason for testing
   - Include relevant clinical information

4. **Select Tests**
   - Browse available tests
   - Click tests to select/deselect
   - Review selected tests and total price

5. **Add Special Instructions** (optional)
   - Fasting requirements
   - Timing considerations
   - Collection notes

6. **Submit Order**
   - Review all information
   - Click "Create Lab Order"
   - Order number will be generated

### Viewing Orders

**Order List Features**:
- Search by order number or patient name
- Filter by status (pending, collected, processing, completed, cancelled)
- Filter by priority (routine, urgent, STAT)
- View order details
- Track progress

**Order Statuses**:
- **Pending**: Order created, awaiting specimen collection
- **Collected**: Specimen collected, ready for processing
- **Processing**: Tests in progress
- **Completed**: All tests completed
- **Cancelled**: Order cancelled

### Specimen Collection

**For Lab Technicians**:

1. Navigate to order details
2. Verify patient identity
3. Collect specimen according to test requirements
4. Click "Collect Specimen"
5. Order status updates to "Collected"

### Order Statistics

The dashboard shows:
- **Total Orders**: All orders in system
- **Pending**: Orders awaiting collection
- **Completed**: Finished orders
- **Urgent/STAT**: Priority orders requiring attention

---

## Lab Results

### Viewing Results

**Path**: `/lab-results`

**Features**:
- View all results
- Filter by verification status
- Toggle "Abnormal Only" view
- See critical result alerts
- View result details

### Result Types

The system supports three result types:

1. **Numeric Results**
   - Quantitative values with units
   - Example: 95 mg/dL
   - Automatic abnormality detection

2. **Value Results**
   - Qualitative values
   - Example: Positive, Negative, Normal

3. **Text Results**
   - Descriptive results
   - Example: Detailed microscopy findings

### Entering Results

**For Lab Technicians**:

1. Navigate to order details
2. Click on test item
3. Select result type
4. Enter result value
5. Add reference range (if applicable)
6. Add interpretation (optional)
7. Add notes (optional)
8. Click "Save Result"

**Required Fields**:
- Result value (numeric, text, or value)
- Result type selection

**Optional Fields**:
- Unit (for numeric results)
- Reference range
- Clinical interpretation
- Additional notes

### Verifying Results

**For Pathologists**:

1. Navigate to result details
2. Review result value
3. Check abnormality status
4. Review interpretation
5. Click "Verify Result"
6. Confirm verification

**Verification Requirements**:
- Only unverified results can be verified
- Verification is permanent
- Verified results show verification date and user

### Abnormality Detection

Results are automatically flagged as abnormal when outside reference ranges:

**Abnormality Levels**:
- **Critical High (HH)**: Dangerously high, immediate attention
- **High (H)**: Above normal range
- **Low (L)**: Below normal range
- **Critical Low (LL)**: Dangerously low, immediate attention

**Visual Indicators**:
- 🔴 **Critical**: Red background, alert icon
- 🟠 **High/Low**: Orange background, trend icon
- 🟡 **Abnormal**: Yellow background, warning icon
- 🟢 **Normal**: Green checkmark

### Critical Result Alerts

Critical results trigger automatic alerts:

**Alert Features**:
- Prominent notification banner
- Severity-based color coding
- Patient information
- Result value and reference range
- Clinical interpretation
- View and dismiss actions

**Alert Types**:
- **Critical Results**: HH or LL flags
- **Abnormal Results**: H or L flags

### Result Trends

**For Numeric Results**:

View historical trends with line charts showing:
- Result values over time
- Date labels
- Smooth curve interpolation
- Visual pattern recognition

**Accessing Trends**:
1. Open result details
2. Scroll to "Result Trend" section
3. View chart (requires 2+ historical results)

### Result Statistics

The dashboard shows:
- **Total Results**: All results in system
- **Abnormal**: Results outside normal range
- **Critical**: Results requiring immediate attention
- **Verified**: Results approved by pathologist
- **Pending**: Results awaiting verification

---

## Workflows

### Complete Order-to-Result Workflow

**1. Doctor Orders Tests**
- Reviews patient condition
- Selects appropriate tests
- Creates lab order with clinical notes
- Sets priority level

**2. Lab Technician Collects Specimen**
- Receives order notification
- Verifies patient identity
- Collects specimen per protocol
- Marks specimen as collected

**3. Lab Processes Tests**
- Receives specimen
- Performs laboratory analysis
- Enters results into system
- Adds interpretation

**4. Pathologist Verifies Results**
- Reviews entered results
- Checks for abnormalities
- Verifies accuracy
- Approves results

**5. Doctor Reviews Results**
- Receives notification
- Reviews verified results
- Checks for abnormalities
- Takes clinical action

### Urgent/STAT Workflow

For urgent or STAT orders:
- Priority flagging throughout system
- Expedited processing
- Immediate notifications
- Highlighted in all views

### Critical Result Workflow

When critical results are detected:
- Automatic alert generation
- Prominent notification display
- Immediate attention required
- Documentation of acknowledgment

---

## Troubleshooting

### Common Issues

**Issue**: Cannot create order
- **Solution**: Verify patient is selected and at least one test is chosen

**Issue**: Cannot collect specimen
- **Solution**: Ensure order status is "Pending" and you have proper permissions

**Issue**: Cannot enter result
- **Solution**: Verify specimen has been collected and you have lab technician role

**Issue**: Cannot verify result
- **Solution**: Ensure result is entered and you have pathologist role

**Issue**: Results not showing
- **Solution**: Check filters and verification status settings

**Issue**: Abnormal alert not appearing
- **Solution**: Verify result is outside reference range and not dismissed

### Getting Help

**Support Resources**:
- User documentation (this guide)
- Admin documentation
- API documentation
- System administrator
- IT support team

**Reporting Issues**:
1. Document the issue
2. Note any error messages
3. Record steps to reproduce
4. Contact system administrator
5. Provide screenshots if helpful

---

## Best Practices

### For Doctors

✅ **Provide Clinical Context**: Always add clinical notes explaining reason for tests  
✅ **Set Appropriate Priority**: Use STAT only for true emergencies  
✅ **Review Results Promptly**: Check for new results regularly  
✅ **Document Actions**: Note clinical decisions based on results

### For Lab Technicians

✅ **Verify Patient Identity**: Always confirm patient before collection  
✅ **Follow Protocols**: Adhere to specimen collection procedures  
✅ **Enter Results Accurately**: Double-check values before saving  
✅ **Add Context**: Include relevant observations in notes

### For Pathologists

✅ **Review Thoroughly**: Check all aspects before verification  
✅ **Verify Promptly**: Don't delay result approval  
✅ **Add Interpretation**: Provide clinical context when needed  
✅ **Flag Concerns**: Note any unusual findings

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search | `/` |
| New Order | `N` |
| Refresh | `R` |
| Close Modal | `Esc` |

---

## Glossary

**Order**: Request for laboratory tests  
**Specimen**: Sample collected for testing  
**Result**: Outcome of laboratory analysis  
**Verification**: Approval of result accuracy  
**Reference Range**: Normal values for a test  
**Abnormal**: Result outside normal range  
**Critical**: Result requiring immediate attention  
**Turnaround Time**: Expected time to complete test

---

**For additional help, contact your system administrator or IT support team.**

