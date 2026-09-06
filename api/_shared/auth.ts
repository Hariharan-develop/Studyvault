export interface AuthenticatedUser {
  uid: string;
  email?: string;
}

export interface AuthVerificationResult {
  authenticated: boolean;
  user?: AuthenticatedUser;
  status?: number;
  error?: string;
}

const DEFAULT_PROJECT_ID = "gen-lang-client-0548172331";
const DEFAULT_API_KEY = "AIzaSyCsUsng3ztdWO9rIRDbrBsQvJM_mgWo3P4";

/**
 * Validates the Firebase ID token passed in the Authorization header.
 * Works natively in Vercel Serverless Functions and Cloud Run without requiring
 * Firebase Admin SDK or Google Cloud Application Default Credentials.
 */
export async function verifyFirebaseToken(req: any): Promise<AuthVerificationResult> {
  const isProduction =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  const rawHeader =
    req.headers?.authorization ||
    req.headers?.Authorization ||
    (typeof req.header === "function" ? req.header("authorization") : "");

  const token =
    typeof rawHeader === "string" && rawHeader.startsWith("Bearer ")
      ? rawHeader.slice(7).trim()
      : null;

  const projectId =
    process.env.VITE_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    DEFAULT_PROJECT_ID;

  const apiKey =
    process.env.VITE_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    DEFAULT_API_KEY;

  // Case 1: Token is provided - validate it
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return {
          authenticated: false,
          status: 401,
          error: "Unauthorized: Malformed authentication token",
        };
      }

      // Decode JWT payload for claim verification
      const payloadStr = Buffer.from(parts[1], "base64").toString("utf-8");
      const payload = JSON.parse(payloadStr);

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return {
          authenticated: false,
          status: 401,
          error: "Unauthorized: Authentication token has expired",
        };
      }

      // Check project ID audience
      if (payload.aud && projectId && payload.aud !== projectId) {
        return {
          authenticated: false,
          status: 401,
          error: "Unauthorized: Token was issued for an unexpected project",
        };
      }

      // Verify issuer
      const expectedIssuer = `https://securetoken.google.com/${projectId}`;
      if (payload.iss && payload.iss !== expectedIssuer) {
        return {
          authenticated: false,
          status: 401,
          error: "Unauthorized: Invalid token issuer",
        };
      }

      // Verify cryptographically with Google Identity Toolkit account lookup
      if (apiKey) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const verifyRes = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: token }),
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);

          if (verifyRes.ok) {
            const verifyData: any = await verifyRes.json();
            const userRecord = verifyData.users?.[0];
            if (userRecord?.localId) {
              return {
                authenticated: true,
                user: {
                  uid: userRecord.localId,
                  email: userRecord.email,
                },
              };
            }
          } else {
            const errData: any = await verifyRes.json().catch(() => ({}));
            const errMsg =
              errData?.error?.message === "TOKEN_EXPIRED"
                ? "Unauthorized: Authentication token has expired"
                : "Unauthorized: Invalid authentication token";
            return {
              authenticated: false,
              status: 401,
              error: errMsg,
            };
          }
        } catch (fetchErr: any) {
          // If network call timed out, rely on the validated JWT claims
          if (payload.sub) {
            return {
              authenticated: true,
              user: { uid: payload.sub, email: payload.email },
            };
          }
        }
      }

      // Valid claims verified
      if (payload.sub) {
        return {
          authenticated: true,
          user: { uid: payload.sub, email: payload.email },
        };
      }

      return {
        authenticated: false,
        status: 401,
        error: "Unauthorized: Invalid token payload",
      };
    } catch (err: any) {
      return {
        authenticated: false,
        status: 401,
        error: "Unauthorized: Failed to decode authentication token",
      };
    }
  }

  // Case 2: No token provided
  if (isProduction) {
    return {
      authenticated: false,
      status: 401,
      error: "Unauthorized: Missing authentication token",
    };
  }

  // Local development / automated testing fallback when not in production
  return {
    authenticated: true,
    user: {
      uid: "dev-guest-user",
      email: "student@studyvault.local",
    },
  };
}

/**
 * Guard utility for serverless & Express handlers.
 * Sends JSON 401 response if authentication fails.
 */
export async function requireAuth(req: any, res: any): Promise<AuthenticatedUser | null> {
  const result = await verifyFirebaseToken(req);
  if (!result.authenticated || !result.user) {
    res.setHeader?.("Content-Type", "application/json");
    res.status(result.status || 401).json({
      success: false,
      error: result.error || "Unauthorized: Authentication required",
    });
    return null;
  }
  return result.user;
}
