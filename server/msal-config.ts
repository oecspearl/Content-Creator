import { ConfidentialClientApplication } from '@azure/msal-node';

export function getMsalClient() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common'; // 'common' allows any Microsoft account

  if (!clientId || !clientSecret) {
    return null;
  }

  const msalConfig = {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
    system: {
      loggerOptions: {
        loggerCallback(loglevel: any, message: string, containsPii: boolean) {
          if (!containsPii) {
            console.log(message);
          }
        },
        piiLoggingEnabled: false,
        logLevel: 3, // Info level
      },
    },
  };

  return new ConfidentialClientApplication(msalConfig);
}

export function getRedirectUri() {
  // Check if we're in production (Replit deployment)
  const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_ENVIRONMENT === 'production';
  
  // Always use h5pcreator.org for production deployments
  // This ensures OAuth works with your custom domain
  const baseUrl = isProduction
    ? 'https://h5pcreator.org'
    : 'http://localhost:5000';
  
  return `${baseUrl}/api/auth/microsoft/callback`;
}

export function getLogoutRedirectUri() {
  // Check if we're in production (Replit deployment)
  const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_ENVIRONMENT === 'production';
  
  // Always use h5pcreator.org for production deployments
  return isProduction
    ? 'https://h5pcreator.org'
    : 'http://localhost:5000';
}
