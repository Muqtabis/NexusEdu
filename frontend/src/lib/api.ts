const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = rawApiUrl && rawApiUrl.length > 0
  ? rawApiUrl.replace(/\/$/, '')
  : 'http://localhost:4000';

export const buildApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const apiFetch = (path: string, init?: RequestInit) => {
  return fetch(buildApiUrl(path), {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.headers || {}),
    },
  });
};

declare global {
  interface Window {
    __nexuseduFetchPatched?: boolean;
  }
}

if (typeof window !== 'undefined' && !window.__nexuseduFetchPatched) {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    let normalizedInput: RequestInfo | URL = input;

    if (typeof input === 'string') {
      const sanitizedInput = input.startsWith('undefined/')
        ? input.replace(/^undefined/, '')
        : input;

      normalizedInput = buildApiUrl(sanitizedInput);
    } else if (input instanceof URL) {
      normalizedInput = input.toString();
    } else if (input instanceof Request) {
      normalizedInput = new Request(input, {
        credentials: 'include',
        ...init,
      });
    }

    return nativeFetch(normalizedInput, {
      credentials: 'include',
      ...init,
    });
  }) as typeof window.fetch;

  window.__nexuseduFetchPatched = true;
}
