import express, { Request, Response } from 'express';
import axios from 'axios';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

/**
 * POST /api/n8n/chat
 * Universal endpoint to interact with n8n AI agents
 * Supports: OPD Agent, Ward Agent, Emergency Agent, General Query
 */
export const chatWithAgent = asyncHandler(async (req: Request, res: Response) => {
  const { message, sessionId, department } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: message, sessionId'
    });
  }

  // Default to general query if no department specified
  const dept = department || 'general';

  try {
    // Get n8n configuration from environment
    const n8nBaseUrl = process.env.N8N_BASE_URL;
    const n8nAuthHeader = process.env.N8N_WEBHOOK_AUTH_HEADER || 'cdss';
    const n8nAuthToken = process.env.N8N_WEBHOOK_AUTH_TOKEN;

    // Map department to webhook path
    const agentPaths: Record<string, string | undefined> = {
      opd: process.env.N8N_OPD_AGENT_PATH,
      ward: process.env.N8N_WARD_AGENT_PATH,
      emergency: process.env.N8N_EMERGENCY_AGENT_PATH,
      general: process.env.N8N_OPD_AGENT_PATH // Use OPD as fallback for general queries
    };

    const agentPath = agentPaths[dept.toLowerCase()];

    // Validate configuration
    if (!n8nBaseUrl || !n8nAuthToken || !agentPath) {
      console.error('n8n configuration missing:', {
        baseUrl: !!n8nBaseUrl,
        authToken: !!n8nAuthToken,
        agentPath: !!agentPath,
        department: dept
      });
      return res.status(500).json({
        success: false,
        error: 'n8n configuration not properly set up for this department',
        debug: {
          baseUrl: !!n8nBaseUrl,
          authToken: !!n8nAuthToken,
          agentPath: !!agentPath,
          department: dept
        }
      });
    }

    // Construct full webhook URL
    const webhookUrl = `${n8nBaseUrl}/webhook/${agentPath}`;

    console.log('Calling n8n Agent:', {
      department: dept,
      url: webhookUrl,
      sessionId: sessionId,
      messageLength: message.length
    });

    // Call n8n webhook
    const response = await axios.post(
      webhookUrl,
      {
        chatInput: message,
        sessionId: sessionId
      },
      {
        headers: {
          [n8nAuthHeader]: n8nAuthToken,
          'Content-Type': 'application/json'
        },
        timeout: parseInt(process.env.N8N_SESSION_TIMEOUT || '90000')
      }
    );

    console.log('n8n Agent response received:', {
      department: dept,
      status: response.status,
      hasOutput: !!response.data.output,
      hasText: !!response.data.text
    });

    // Return response
    res.json({
      success: true,
      response: response.data.output || response.data.text || 'No response from AI agent',
      sessionId: sessionId,
      department: dept,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('n8n Agent chat failed:', {
      department: dept,
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    // Determine error type
    let errorMessage = `Failed to connect to ${dept} agent`;
    let errorCode = 'N8N_CONNECTION_ERROR';

    if (error.response?.status === 401) {
      errorMessage = 'Authentication failed - check n8n token';
      errorCode = 'N8N_AUTH_ERROR';
    } else if (error.response?.status === 404) {
      errorMessage = 'n8n webhook not found - check webhook path';
      errorCode = 'N8N_NOT_FOUND';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to n8n instance - check N8N_BASE_URL';
      errorCode = 'N8N_CONNECTION_REFUSED';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'n8n request timeout - server may be slow';
      errorCode = 'N8N_TIMEOUT';
    }

    // Get agent path for error reporting
    const agentPaths: Record<string, string | undefined> = {
      opd: process.env.N8N_OPD_AGENT_PATH,
      ward: process.env.N8N_WARD_AGENT_PATH,
      emergency: process.env.N8N_EMERGENCY_AGENT_PATH,
      general: process.env.N8N_OPD_AGENT_PATH
    };

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage,
      code: errorCode,
      debug: {
        message: error.message,
        status: error.response?.status,
        department: dept,
        url: `${process.env.N8N_BASE_URL}/webhook/${agentPaths[dept.toLowerCase()]}`
      }
    });
  }
});

/**
 * GET /api/n8n/status
 * Check n8n configuration status
 */
export const checkN8NStatus = asyncHandler(async (req: Request, res: Response) => {
  const n8nBaseUrl = process.env.N8N_BASE_URL;
  const n8nAuthToken = process.env.N8N_WEBHOOK_AUTH_TOKEN;
  const n8nOPDPath = process.env.N8N_OPD_AGENT_PATH;
  const n8nWardPath = process.env.N8N_WARD_AGENT_PATH;
  const n8nEmergencyPath = process.env.N8N_EMERGENCY_AGENT_PATH;

  res.json({
    success: true,
    configured: {
      baseUrl: !!n8nBaseUrl,
      authToken: !!n8nAuthToken,
      opdPath: !!n8nOPDPath,
      wardPath: !!n8nWardPath,
      emergencyPath: !!n8nEmergencyPath
    },
    agents: {
      opd: {
        available: !!(n8nBaseUrl && n8nOPDPath),
        url: n8nBaseUrl && n8nOPDPath ? `${n8nBaseUrl}/webhook/${n8nOPDPath}` : 'Not configured'
      },
      ward: {
        available: !!(n8nBaseUrl && n8nWardPath),
        url: n8nBaseUrl && n8nWardPath ? `${n8nBaseUrl}/webhook/${n8nWardPath}` : 'Not configured'
      },
      emergency: {
        available: !!(n8nBaseUrl && n8nEmergencyPath),
        url: n8nBaseUrl && n8nEmergencyPath ? `${n8nBaseUrl}/webhook/${n8nEmergencyPath}` : 'Not configured'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Routes
router.post('/chat', chatWithAgent);
router.get('/status', checkN8NStatus);

export default router;
