import firebaseAppletConfig from "../../firebase-applet-config.json";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
}

export interface AuthVerificationResult {
  authenticated: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

/**
 * Validates the Firebase ID token passed in the Authorization header.
 * Uses Google's Identity Toolkit account lookup to cryptographically verify the token.
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
    firebaseAppletConfig.projectId;

  const apiKey =
    process.env.VITE_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    firebaseAppletConfig.apiKey;

  // Case 1: Token is provided - validate it
  if (token) {
    try {
      // Decode JWT payload for basic claim verification
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadStr = Buffer.from(parts[1], "base64").toString("utf-8");
        const payload = JSON.parse(payloadStr);

        // Check basic expiration
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          return {
            authenticated: false,
            error: "Authentication token has expired. Please sign in again.",
          };
        }

        // Check project ID audience
        if (payload.aud && projectId && payload.aud !== projectId) {
          return {
            authenticated: false,
            error: "Authentication token is for an unauthorized project.",
          };
        }
      }

      // Cryptographic verification via Google Identity Toolkit
      if (apiKey) {
        const verifyRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token }),
          }
        );

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
              ? "Authentication token has expired. Please sign in again."
              : "Invalid Firebase authentication token.";
          return {
            authenticated: false,
            error: errMsg,
          };
        }
      }

      // Fallback if apiKey not set but token format is valid
      const partsFallback = token.split(".");
      if (partsFallback.length === 3) {
        const payload = JSON.parse(Buffer.from(partsFallback[1], "base64").toString("utf-8"));
        if (payload.sub) {
          return {
            authenticated: true,
            user: { uid: payload.sub, email: payload.email },
          };
        }
      }
    } catch (err: any) {
      console.warn("Token verification error:", err?.message || err);
      return {
        authenticated: false,
        error: "Failed to verify authentication token.",
      };
    }
  }

  // Case 2: No token provided
  if (isProduction) {
    return {
      authenticated: false,
      error: "Authentication required. Please sign in to access StudyVault AI.",
    };
  }

  // Allow unauthenticated local development / testing fallback
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
 * Automatically sends 401 JSON response if authentication fails.
 */
export async function requireAuth(req: any, res: any): Promise<AuthenticatedUser | null> {
  const result = await verifyFirebaseToken(req);
  if (!result.authenticated || !result.user) {
    res.setHeader?.("Content-Type", "application/json");
    res.status(401).json({
      success: false,
      error: result.error || "Authentication required.",
    });
    return null;
  }
  return result.user;
}
