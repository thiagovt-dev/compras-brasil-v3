// Debug utilities for authentication issues

export const AUTH_DEBUG = {
  enabled: process.env.NODE_ENV === "development",

  log: (message: string, data?: any) => {
    if (AUTH_DEBUG.enabled) {
      console.log(`🔍 [AUTH DEBUG] ${message}`, data || "");
    }
  },

  error: (message: string, error?: any) => {
    if (AUTH_DEBUG.enabled) {
      console.error(`[AUTH ERROR] ${message}`, error || "");
    }
  },

  warn: (message: string, data?: any) => {
    if (AUTH_DEBUG.enabled) {
      console.warn(`⚠️ [AUTH WARN] ${message}`, data || "");
    }
  },

  success: (message: string, data?: any) => {
    if (AUTH_DEBUG.enabled) {
      console.log(`✅ [AUTH SUCCESS] ${message}`, data || "");
    }
  },
};

export const clearAuthData = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("sb-jfbuistvgwkfpnujygwx-auth-token");
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      AUTH_DEBUG.log("Auth data cleared");
    } catch (error) {
      AUTH_DEBUG.error("Error clearing auth data:", error);
    }
  }
};

export const getAuthDebugInfo = () => {
  if (typeof window === "undefined") return null;

  try {
    const token = localStorage.getItem("sb-jfbuistvgwkfpnujygwx-auth-token");
    return {
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 50) + "..." : null,
      localStorage: Object.keys(localStorage).filter((key) => key.includes("sb-")),
      cookies: document.cookie.split(";").filter((c) => c.includes("sb-")),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    AUTH_DEBUG.error("Error getting debug info:", error);
    return null;
  }
};
