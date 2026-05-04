/**
 * Odoo Connection Testing Utility
 * Provides methods to test and validate Odoo connections
 */

import { OdooConnector, OdooAuthenticationError, OdooConnectorError } from './odoo.connector';
import type { OdooConnectorConfig } from './odoo.types';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    serverUrl?: string;
    database?: string;
    username?: string;
    userId?: number;
    version?: string;
    modules?: string[];
  };
  error?: {
    code: number;
    message: string;
    type: string;
  };
  duration: number;
}

/**
 * Test basic connectivity to Odoo server
 */
export async function testServerConnectivity(serverUrl: string): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${serverUrl}/web/health`, {
      method: 'GET',
      timeout: 5000,
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        message: 'Server is reachable',
        duration,
      };
    } else {
      return {
        success: false,
        message: `Server returned HTTP ${response.status}`,
        error: {
          code: response.status,
          message: response.statusText,
          type: 'HTTP_ERROR',
        },
        duration,
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      message: `Failed to connect to server: ${errorMessage}`,
      error: {
        code: 0,
        message: errorMessage,
        type: 'CONNECTION_ERROR',
      },
      duration,
    };
  }
}

/**
 * Test authentication with Odoo
 */
export async function testAuthentication(
  config: OdooConnectorConfig
): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    const connector = new OdooConnector(config);
    const session = await connector.authenticate();

    const duration = Date.now() - startTime;

    return {
      success: true,
      message: 'Authentication successful',
      details: {
        serverUrl: config.serverUrl,
        database: config.database,
        username: config.username,
        userId: session.uid,
      },
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof OdooAuthenticationError) {
      return {
        success: false,
        message: 'Authentication failed: Invalid credentials',
        error: {
          code: 401,
          message: error.message,
          type: 'AUTHENTICATION_ERROR',
        },
        duration,
      };
    }

    if (error instanceof OdooConnectorError) {
      return {
        success: false,
        message: `Authentication failed: ${error.message}`,
        error: {
          code: error.code,
          message: error.message,
          type: 'ODOO_ERROR',
        },
        duration,
      };
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Authentication failed: ${errorMessage}`,
      error: {
        code: 0,
        message: errorMessage,
        type: 'UNKNOWN_ERROR',
      },
      duration,
    };
  }
}

/**
 * Test Odoo API functionality
 */
export async function testOdooAPI(
  config: OdooConnectorConfig
): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    const connector = new OdooConnector(config);
    await connector.authenticate();

    // Test basic search operation
    const products = await connector.search('product.product', [], {
      limit: 1,
    });

    const duration = Date.now() - startTime;

    return {
      success: true,
      message: 'API is functional',
      details: {
        serverUrl: config.serverUrl,
        database: config.database,
      },
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      message: `API test failed: ${errorMessage}`,
      error: {
        code: 0,
        message: errorMessage,
        type: 'API_ERROR',
      },
      duration,
    };
  }
}

/**
 * Comprehensive connection test
 */
export async function testFullConnection(
  config: OdooConnectorConfig
): Promise<{
  overall: ConnectionTestResult;
  connectivity: ConnectionTestResult;
  authentication: ConnectionTestResult;
  api: ConnectionTestResult;
}> {
  // Test connectivity first
  const connectivity = await testServerConnectivity(config.serverUrl);

  if (!connectivity.success) {
    return {
      overall: {
        success: false,
        message: 'Connection test failed at server connectivity',
        error: connectivity.error,
        duration: connectivity.duration,
      },
      connectivity,
      authentication: {
        success: false,
        message: 'Skipped due to connectivity failure',
        duration: 0,
      },
      api: {
        success: false,
        message: 'Skipped due to connectivity failure',
        duration: 0,
      },
    };
  }

  // Test authentication
  const authentication = await testAuthentication(config);

  if (!authentication.success) {
    return {
      overall: {
        success: false,
        message: 'Connection test failed at authentication',
        error: authentication.error,
        duration: connectivity.duration + authentication.duration,
      },
      connectivity,
      authentication,
      api: {
        success: false,
        message: 'Skipped due to authentication failure',
        duration: 0,
      },
    };
  }

  // Test API
  const api = await testOdooAPI(config);

  const totalDuration = connectivity.duration + authentication.duration + api.duration;

  return {
    overall: {
      success: api.success,
      message: api.success ? 'All tests passed' : 'API test failed',
      duration: totalDuration,
    },
    connectivity,
    authentication,
    api,
  };
}

/**
 * Validate configuration parameters
 */
export function validateConfig(config: OdooConnectorConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.serverUrl) {
    errors.push('Server URL is required');
  } else if (!config.serverUrl.startsWith('http://') && !config.serverUrl.startsWith('https://')) {
    errors.push('Server URL must start with http:// or https://');
  }

  if (!config.database) {
    errors.push('Database name is required');
  }

  if (!config.username) {
    errors.push('Username is required');
  }

  if (!config.password) {
    errors.push('Password is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get Odoo version information
 */
export async function getOdooVersion(serverUrl: string): Promise<string | null> {
  try {
    const response = await fetch(`${serverUrl}/web/webclient/version_info`, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      return data.server_version || null;
    }
  } catch (error) {
    console.error('Failed to get Odoo version:', error);
  }

  return null;
}

/**
 * Format test results for display
 */
export function formatTestResults(results: {
  overall: ConnectionTestResult;
  connectivity: ConnectionTestResult;
  authentication: ConnectionTestResult;
  api: ConnectionTestResult;
}): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════');
  lines.push('Odoo Connection Test Results');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('');

  lines.push(`Overall Status: ${results.overall.success ? '✓ PASSED' : '✗ FAILED'}`);
  lines.push(`Duration: ${results.overall.duration}ms`);
  lines.push('');

  lines.push('Server Connectivity:');
  lines.push(`  Status: ${results.connectivity.success ? '✓ PASSED' : '✗ FAILED'}`);
  lines.push(`  Message: ${results.connectivity.message}`);
  lines.push(`  Duration: ${results.connectivity.duration}ms`);
  if (results.connectivity.error) {
    lines.push(`  Error: ${results.connectivity.error.message}`);
  }
  lines.push('');

  lines.push('Authentication:');
  lines.push(`  Status: ${results.authentication.success ? '✓ PASSED' : '✗ FAILED'}`);
  lines.push(`  Message: ${results.authentication.message}`);
  lines.push(`  Duration: ${results.authentication.duration}ms`);
  if (results.authentication.error) {
    lines.push(`  Error: ${results.authentication.error.message}`);
  }
  if (results.authentication.details?.userId) {
    lines.push(`  User ID: ${results.authentication.details.userId}`);
  }
  lines.push('');

  lines.push('API Functionality:');
  lines.push(`  Status: ${results.api.success ? '✓ PASSED' : '✗ FAILED'}`);
  lines.push(`  Message: ${results.api.message}`);
  lines.push(`  Duration: ${results.api.duration}ms`);
  if (results.api.error) {
    lines.push(`  Error: ${results.api.error.message}`);
  }
  lines.push('');

  lines.push('═══════════════════════════════════════════════════════');

  return lines.join('\n');
}
