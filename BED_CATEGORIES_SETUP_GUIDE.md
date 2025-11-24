# Bed Categories Setup Guide

## 🎯 Overview

This guide will help you set up the bed categories management system that was just implemented. The system allows you to organize hospital beds into categories with custom colors, icons, and descriptions.

## ✅ What Was Implemented

### 1. **Removed "Assign Bed" Button**
- The main bed management page now has an "Add Category" button instead
- This button navigates to the new bed categories management system

### 2. **Added Bed Categories Management**
- Complete CRUD operations for bed categories
- Visual category cards with custom colors and icons
- Database schema with proper relationships
- Backend API with 6 endpoints
- Frontend pages for managing categories

### 3. **Enhanced Department View**
- Added "Bed Categories" tab in department view
- Shows category distribution within each department
- Visual occupancy statistics per category

## 🚀 Setup Instructions

### Step 1: Database Setup

First, ensure PostgreSQL is running and accessible:

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# If not running, start PostgreSQL service
# On Windows: Start PostgreSQL service from Services
# On macOS: brew services start postgresql
# On Linux: sudo systemctl start postgresql
```

### Step 2: Database Configuration

Update the database password in `backend/.env` if needed:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=multitenant_db
DB_PASSWORD=your_actual_password
DB_PORT=5432
```

### Step 3: Initialize Database

```bash
cd backend
node setup-local.js
```

### Step 4: Run Bed Categories Migration

```bash
cd backend
node run-bed-categories-migration.js
```

Expected output:
```
🚀 Running bed categories migration...
✅ Bed categories migration completed successfully!
📊 Created 8 default bed categories
✅ Added category_id column to beds table

📋 Created bed categories:
  - Bariatric: Heavy-duty beds for bariatric patients (#8B5CF6)
  - Emergency: Emergency department beds for urgent care (#F97316)
  - ICU: Intensive Care Unit beds with advanced monitoring (#EF4444)
  - Isolation: Isolation beds for infectious disease control (#F59E0B)
  - Maternity: Specialized beds for maternity care (#EC4899)
  - Pediatric: Specialized beds for children and infants (#10B981)
  - Recovery: Post-operative recovery beds (#06B6D4)
  - Standard: Standard hospital beds for general patients (#3B82F6)

🎉 Bed categories system is ready!
```

### Step 5: Start the Backend Server

```bash
cd backend
npm run dev
```

The server should start on port 3000.

### Step 6: Start the Frontend

```bash
cd hospital-management-system
npm run dev
```

The frontend should start on port 3001.

### Step 7: Test the System

```bash
cd backend
node test-bed-categories.js
```

## 🎨 Using the Bed Categories System

### Accessing Categories Management

1. **From Main Bed Management Page**:
   - Go to `/bed-management`
   - Click the "Add Category" button (top right)
   - This takes you to `/bed-management/categories`

2. **Direct Access**:
   - Navigate directly to `/bed-management/categories`

### Managing Categories

#### Create New Category
1. Click "Add New Category" button
2. Fill in the form:
   - **Name**: Required (e.g., "ICU", "Standard")
   - **Description**: Optional description
   - **Color**: Choose from 12 predefined colors or enter hex code
   - **Icon**: Select from 12 available emoji icons
3. Click "Create Category"

#### Edit Existing Category
1. Find the category in the table
2. Click the edit icon (pencil)
3. Modify the fields as needed
4. Click "Update Category"

#### View Category Details
1. Click the view icon (eye) or category name
2. See detailed statistics and beds in that category
3. View occupancy rates and bed distribution

#### Delete Category
1. Click the delete icon (trash)
2. Confirm deletion
3. **Note**: Categories with assigned beds cannot be deleted

### Viewing Categories in Departments

1. Go to any department view (e.g., `/bed-management/department/cardiology`)
2. Click the "Bed Categories" tab
3. See all categories with department-specific statistics:
   - Number of beds per category in this department
   - Available vs occupied beds
   - Visual occupancy bars
   - Quick actions to view details or filter beds

## 🎨 Default Categories Created

The system comes with 8 pre-configured categories:

| Category | Color | Icon | Description |
|----------|-------|------|-------------|
| **Standard** | Blue (#3B82F6) | 🛏️ | General hospital beds |
| **ICU** | Red (#EF4444) | 📊 | Intensive care beds |
| **Isolation** | Yellow (#F59E0B) | 🛡️ | Infection control beds |
| **Pediatric** | Green (#10B981) | 👶 | Children's beds |
| **Bariatric** | Purple (#8B5CF6) | ⚖️ | Heavy-duty beds |
| **Maternity** | Pink (#EC4899) | ❤️ | Maternity care beds |
| **Recovery** | Cyan (#06B6D4) | 🔄 | Post-operative beds |
| **Emergency** | Orange (#F97316) | ⚡ | Emergency department beds |

## 🔧 Troubleshooting

### Database Connection Issues

**Error**: `password authentication failed for user "postgres"`

**Solutions**:
1. Check PostgreSQL is running
2. Verify password in `.env` file
3. Reset PostgreSQL password if needed:
   ```bash
   # Connect as superuser and reset password
   sudo -u postgres psql
   ALTER USER postgres PASSWORD 'your_new_password';
   ```

### Migration Fails

**Error**: `relation "bed_categories" already exists`

**Solution**: The migration has already been run. Check if categories exist:
```sql
SELECT * FROM bed_categories;
```

### Frontend Build Errors

**Error**: `Export apiClient doesn't exist`

**Solution**: This has been fixed. The import now uses the correct `api` export.

### API Endpoints Not Working

**Checklist**:
1. Backend server is running on port 3000
2. Database migration completed successfully
3. JWT token is valid (check browser cookies)
4. Tenant ID is set correctly

### Categories Not Showing in Department View

**Possible Causes**:
1. No categories created yet
2. Backend API not responding
3. Frontend not connected to backend

**Debug Steps**:
1. Check browser console for errors
2. Verify API calls in Network tab
3. Test API directly: `curl http://localhost:3000/api/beds/categories`

## 🧪 Testing the Implementation

### Manual Testing

1. **Create Category**:
   - Go to categories management
   - Create a new category with custom color/icon
   - Verify it appears in the list

2. **Edit Category**:
   - Edit an existing category
   - Change color and description
   - Verify changes are saved

3. **Department View**:
   - Go to any department
   - Switch to "Bed Categories" tab
   - Verify categories show with correct statistics

4. **Category Details**:
   - Click on a category to view details
   - Verify bed list and statistics are correct

### API Testing

```bash
# Test all endpoints
cd backend
node test-bed-categories.js
```

### Database Verification

```sql
-- Check categories table
SELECT * FROM bed_categories;

-- Check beds have category_id
SELECT bed_number, bed_type, category_id FROM beds LIMIT 5;

-- Check category usage
SELECT 
  bc.name, 
  COUNT(b.id) as bed_count 
FROM bed_categories bc 
LEFT JOIN beds b ON bc.id = b.category_id 
GROUP BY bc.id, bc.name;
```

## 📱 User Interface Features

### Visual Design
- **Responsive**: Works on desktop, tablet, mobile
- **Dark Mode**: Full dark/light theme support
- **Color Coding**: Each category has a unique color
- **Icon System**: Emoji-based icons for easy recognition

### User Experience
- **Breadcrumb Navigation**: Clear navigation path
- **Loading States**: Skeleton screens during data loading
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Success/error feedback
- **Empty States**: Helpful guidance when no data

### Accessibility
- **Keyboard Navigation**: All elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels
- **Color Contrast**: Meets WCAG guidelines
- **Focus Management**: Clear focus indicators

## 🔒 Security Features

### Multi-Tenant Isolation
- All operations respect tenant boundaries
- Categories are shared across tenants (global)
- Bed assignments are tenant-specific

### Authentication & Authorization
- JWT token validation required
- Permission-based access control
- Secure API endpoints

### Data Validation
- Required field validation
- Color format validation (hex codes)
- Unique category name enforcement
- Safe deletion (prevents deletion of categories in use)

## 🚀 Next Steps

### Immediate Actions
1. Run the setup steps above
2. Test the basic functionality
3. Create your first custom category
4. Explore the department view categories tab

### Future Enhancements
- **Category-based Reporting**: Analytics by bed category
- **Automated Assignment**: AI-powered bed categorization
- **Advanced Permissions**: Category-specific access control
- **Integration with Billing**: Category-based pricing

## 📞 Support

If you encounter any issues:

1. **Check the logs**: Backend console and browser console
2. **Verify database**: Ensure migration completed successfully
3. **Test API**: Use the provided test script
4. **Check configuration**: Verify .env file settings

The bed categories system is now fully implemented and ready to help organize your hospital beds more effectively! 🎉