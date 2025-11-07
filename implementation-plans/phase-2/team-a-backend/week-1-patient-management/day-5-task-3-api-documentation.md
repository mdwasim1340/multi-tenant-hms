# Day 5, Task 3: API Documentation (OpenAPI/Swagger)

## 🎯 Task Objective
Create comprehensive API documentation for all patient endpoints.

## ⏱️ Estimated Time: 1.5 hours

## 📝 Step 1: Install Swagger Dependencies

```bash
npm install swagger-jsdoc swagger-ui-express
npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express
```

## 📝 Step 2: Create Swagger Configuration

Create file: `backend/src/config/swagger.ts`

```typescript
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hospital Management API',
      version: '1.0.0',
      description: 'Multi-tenant hospital management system API',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      parameters: {
        tenantId: {
          in: 'header',
          name: 'X-Tenant-ID',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'Tenant identifier',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

## 📝 Step 3: Add Swagger Documentation to Routes

Update `backend/src/routes/patients.routes.ts`:

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: object
 *       required:
 *         - patient_number
 *         - first_name
 *         - last_name
 *         - date_of_birth
 *       properties:
 *         id:
 *           type: integer
 *         patient_number:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         date_of_birth:
 *           type: string
 *           format: date-time
 *         gender:
 *           type: string
 *           enum: [male, female, other, prefer_not_to_say]
 *         status:
 *           type: string
 *           enum: [active, inactive, deceased, transferred]
 */

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: List all patients
 *     tags: [Patients]
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, deceased, transferred]
 *     responses:
 *       200:
 *         description: List of patients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     patients:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Patient'
 *                     pagination:
 *                       type: object
 */

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Create a new patient
 *     tags: [Patients]
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       201:
 *         description: Patient created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate patient number
 */

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient details
 *       404:
 *         description: Patient not found
 */

/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     summary: Update patient
 *     tags: [Patients]
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *       404:
 *         description: Patient not found
 */

/**
 * @swagger
 * /api/patients/{id}:
 *   delete:
 *     summary: Soft delete patient
 *     tags: [Patients]
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient deactivated successfully
 *       404:
 *         description: Patient not found
 */
```

## 📝 Step 4: Add Swagger UI to App

Update `backend/src/index.ts`:

```typescript
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Add before routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

console.log('📚 API Documentation available at http://localhost:3000/api-docs');
```

## ✅ Verification

```bash
# Start server
npm run dev

# Open browser
open http://localhost:3000/api-docs

# Should see Swagger UI with all patient endpoints documented
```

## 📄 Commit

```bash
git add src/config/swagger.ts src/routes/patients.routes.ts src/index.ts
git commit -m "docs(patient): Add OpenAPI/Swagger documentation"
```