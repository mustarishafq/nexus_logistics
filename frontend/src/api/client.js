const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'access_token';
const NEXUS_RETURN_TO_KEY = 'nexus_return_to';
const NEXUS_SSO_KEY = 'nexus_sso';
const NEXUS_SSO_VERIFYING_KEY = 'nexus_sso_verifying';

let lastParsedImport = null;

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function applySsoLogin({ access_token: accessToken, nexus_return_to: returnTo }) {
  setToken(accessToken);
  sessionStorage.setItem(NEXUS_SSO_KEY, '1');
  sessionStorage.setItem(NEXUS_SSO_VERIFYING_KEY, '1');

  if (returnTo) {
    sessionStorage.setItem(NEXUS_RETURN_TO_KEY, returnTo);
  }
}

export function captureSsoParams() {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('access_token');
  const returnTo = params.get('nexus_return_to');

  if (!accessToken) {
    return false;
  }

  applySsoLogin({ access_token: accessToken, nexus_return_to: returnTo });

  params.delete('access_token');
  params.delete('nexus_return_to');
  const remaining = params.toString();
  const nextUrl = `${window.location.pathname}${remaining ? `?${remaining}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', nextUrl);

  return true;
}

export function isNexusSsoUser() {
  return sessionStorage.getItem(NEXUS_SSO_KEY) === '1';
}

export function isNexusSsoVerifying() {
  return sessionStorage.getItem(NEXUS_SSO_VERIFYING_KEY) === '1';
}

export function clearNexusSsoVerifying() {
  sessionStorage.removeItem(NEXUS_SSO_VERIFYING_KEY);
}

function clearNexusSsoState() {
  sessionStorage.removeItem(NEXUS_SSO_KEY);
  sessionStorage.removeItem(NEXUS_RETURN_TO_KEY);
  sessionStorage.removeItem(NEXUS_SSO_VERIFYING_KEY);
}

async function request(path, options = {}) {
  const headers = { Accept: 'application/json', ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body instanceof FormData
      ? options.body
      : options.body
        ? JSON.stringify(options.body)
        : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function parseSort(sort) {
  if (!sort) return '-created_at';
  return sort.replace('created_date', 'created_at');
}

function createEntityClient(resource) {
  return {
    async list(sort = '-created_date', limit = 100) {
      const params = new URLSearchParams({
        sort: parseSort(sort),
        limit: String(limit),
      });
      return request(`/${resource}?${params}`);
    },

    async filter(filters = {}, sort = '-created_date', limit = 100) {
      const params = new URLSearchParams({
        sort: parseSort(sort),
        limit: String(limit),
      });
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });
      return request(`/${resource}?${params}`);
    },

    async create(data) {
      return request(`/${resource}`, { method: 'POST', body: data });
    },

    async update(id, data) {
      return request(`/${resource}/${id}`, { method: 'PATCH', body: data });
    },

    async bulkCreate(records) {
      return request(`/${resource}/bulk`, { method: 'POST', body: { records } });
    },

    async delete(id) {
      return request(`/${resource}/${id}`, { method: 'DELETE' });
    },

    async bulkDelete(ids) {
      return request(`/${resource}/bulk-delete`, { method: 'POST', body: { ids } });
    },
  };
}

const resourceMap = {
  Shipment: 'shipments',
  SlaRule: 'sla-rules',
  SourceSystem: 'source-systems',
  WebhookLog: 'webhook-logs',
  TrackingEvent: 'tracking-events',
  User: 'users',
};

const entities = new Proxy(
  {},
  {
    get(_, entityName) {
      const resource = resourceMap[entityName];
      if (!resource) {
        throw new Error(`Unknown entity: ${entityName}`);
      }
      return createEntityClient(resource);
    },
  }
);

export const api = {
  auth: {
    async loginViaEmailPassword(email, password) {
      const result = await request('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (!result.access_token) {
        throw new Error(
          'Login failed: no access token received. Rebuild the frontend with VITE_API_URL set to your production API URL.'
        );
      }

      setToken(result.access_token);
      return result;
    },

    async register({ email, password, name, full_name }) {
      return request('/auth/register', {
        method: 'POST',
        body: {
          email,
          password,
          password_confirmation: password,
          name: name || full_name || email.split('@')[0],
        },
      });
    },

    async me() {
      return request('/auth/me');
    },

    async exchangeNexusSso(token, returnTo) {
      const params = new URLSearchParams({ token });
      if (returnTo) {
        params.set('return_to', returnTo);
      }

      return request(`/sso/nexus?${params}`);
    },

    async logout() {
      if (isNexusSsoUser()) {
        const fallback = sessionStorage.getItem(NEXUS_RETURN_TO_KEY);

        try {
          await request('/auth/logout', { method: 'POST' });
        } catch {
          // Token may already be invalid; still redirect back to Nexus.
        } finally {
          setToken(null);
          clearNexusSsoState();
        }

        window.location.replace(fallback || 'https://emzinexus.com/applications');
        return { redirected: true };
      }

      try {
        await request('/auth/logout', { method: 'POST' });
      } finally {
        setToken(null);
        clearNexusSsoState();
      }

      return { redirected: false };
    },

    setToken,

    redirectToLogin(returnUrl) {
      const loginUrl = `/login${returnUrl ? `?return=${encodeURIComponent(returnUrl)}` : ''}`;
      window.location.href = loginUrl;
    },

    async resetPasswordRequest(email) {
      return request('/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
    },

    async resetPassword({ resetToken, token, newPassword, email }) {
      return request('/auth/reset-password', {
        method: 'POST',
        body: {
          token: resetToken || token,
          email,
          password: newPassword,
          password_confirmation: newPassword,
        },
      });
    },

    async approveUser(userId) {
      return request(`/users/${userId}/approve`, { method: 'POST' });
    },

    async updateUser(userId, data) {
      return request(`/users/${userId}`, { method: 'PATCH', body: data });
    },
  },

  entities,

  integrations: {
    Core: {
      async UploadFile({ file }) {
        const formData = new FormData();
        formData.append('file', file);
        lastParsedImport = await request('/imports/parse-csv', {
          method: 'POST',
          body: formData,
          headers: {},
        });
        return { file_url: 'cached' };
      },

      async ExtractDataFromUploadedFile() {
        return lastParsedImport || { status: 'error', details: 'No parsed data available' };
      },
    },
  },
};

export default api;
