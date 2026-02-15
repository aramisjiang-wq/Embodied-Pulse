import { getApiConfig, getFallbackUrl, detectEnvironment, isDevelopment, isProduction, isStaging } from './config';

interface ValidationResult {
  valid: boolean;
  checks: ValidationCheck[];
}

interface ValidationCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  suggestion?: string;
}

export function validateApiConfig(): ValidationResult {
  const checks: ValidationCheck[] = [];
  const config = getApiConfig();

  const baseUrlCheck: ValidationCheck = {
    name: 'API Base URL',
    status: 'pass',
    message: `API URL configured: ${config.baseUrl}`,
  };

  if (!config.baseUrl) {
    baseUrlCheck.status = 'fail';
    baseUrlCheck.message = 'API Base URL is not configured';
    baseUrlCheck.suggestion = 'Set NEXT_PUBLIC_API_URL environment variable';
  } else if (config.baseUrl.includes('localhost') && isProduction()) {
    baseUrlCheck.status = 'warn';
    baseUrlCheck.message = 'Using localhost URL in production environment';
    baseUrlCheck.suggestion = 'Ensure NEXT_PUBLIC_API_URL is set correctly for production';
  } else if (config.baseUrl.includes('staging') && !isStaging()) {
    baseUrlCheck.status = 'warn';
    baseUrlCheck.message = 'Staging URL detected but environment is not staging';
    baseUrlCheck.suggestion = 'Check NODE_ENV and NEXT_PUBLIC_API_URL consistency';
  }

  checks.push(baseUrlCheck);

  const timeoutCheck: ValidationCheck = {
    name: 'Request Timeout',
    status: 'pass',
    message: `Timeout configured: ${config.timeout}ms`,
  };

  if (config.timeout < 5000) {
    timeoutCheck.status = 'warn';
    timeoutCheck.message = `Timeout too low: ${config.timeout}ms`;
    timeoutCheck.suggestion = 'Consider increasing timeout for slower networks';
  } else if (config.timeout > 120000) {
    timeoutCheck.status = 'warn';
    timeoutCheck.message = `Timeout very high: ${config.timeout}ms`;
    timeoutCheck.suggestion = 'May affect user experience on slow connections';
  }

  checks.push(timeoutCheck);

  const retriesCheck: ValidationCheck = {
    name: 'Retry Configuration',
    status: 'pass',
    message: `Retries configured: ${config.retries}`,
  };

  if (config.retries > 3) {
    retriesCheck.status = 'warn';
    retriesCheck.message = `High retry count: ${config.retries}`;
    retriesCheck.suggestion = 'May increase perceived latency on failures';
  }

  checks.push(retriesCheck);

  const debugCheck: ValidationCheck = {
    name: 'Debug Mode',
    status: 'pass',
    message: `Debug mode: ${config.debug ? 'enabled' : 'disabled'}`,
  };

  if (config.debug && isProduction()) {
    debugCheck.status = 'warn';
    debugCheck.message = 'Debug mode enabled in production';
    debugCheck.suggestion = 'Consider disabling debug mode in production';
  }

  checks.push(debugCheck);

  const valid = !checks.some(c => c.status === 'fail');

  return { valid, checks };
}

export function printConfigValidation(): void {
  if (!isDevelopment()) {
    return;
  }

  const env = detectEnvironment();
  const config = getApiConfig();

  console.group('[API Config Validation]');
  console.log(`Environment: ${env}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Timeout: ${config.timeout}ms`);
  console.log(`Retries: ${config.retries}`);
  console.log(`Debug: ${config.debug}`);

  const result = validateApiConfig();
  console.log(`Validation: ${result.valid ? 'PASSED' : 'FAILED'}`);

  result.checks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${check.name}: ${check.message}`);
    if (check.suggestion && check.status !== 'pass') {
      console.log(`   💡 ${check.suggestion}`);
    }
  });

  console.groupEnd();
}

export function getEnvironmentInfo(): {
  env: ReturnType<typeof detectEnvironment>;
  baseUrl: string;
  fallbackUrl: string;
  debug: boolean;
} {
  return {
    env: detectEnvironment(),
    baseUrl: getApiConfig().baseUrl,
    fallbackUrl: getFallbackUrl(),
    debug: isDevelopment(),
  };
}

export function checkApiHealth(): Promise<boolean> {
  return new Promise(resolve => {
    const config = getApiConfig();
    const healthUrl = `${config.baseUrl}/api/health`;

    const timeout = setTimeout(() => {
      console.warn(`[API Health] Health check timeout: ${healthUrl}`);
      resolve(false);
    }, 5000);

    fetch(healthUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => {
        clearTimeout(timeout);
        if (response.ok) {
          console.log(`[API Health] API is healthy: ${healthUrl}`);
          resolve(true);
        } else {
          console.warn(`[API Health] API returned status: ${response.status}`);
          resolve(false);
        }
      })
      .catch(error => {
        clearTimeout(timeout);
        console.warn(`[API Health] API health check failed: ${error.message}`);
        resolve(false);
      });
  });
}

export function reportConfigIssue(issue: {
  type: 'missing_env' | 'invalid_value' | 'connection_failed';
  message: string;
  solution?: string;
}): void {
  const prefix = '[Config Issue]';

  switch (issue.type) {
    case 'missing_env':
      console.warn(`${prefix} Environment variable missing: ${issue.message}`);
      break;
    case 'invalid_value':
      console.warn(`${prefix} Invalid configuration: ${issue.message}`);
      break;
    case 'connection_failed':
      console.error(`${prefix} Connection failed: ${issue.message}`);
      break;
  }

  if (issue.solution) {
    console.info(`${prefix} Solution: ${issue.solution}`);
  }
}
