import { API_CONFIG, HTTP_STATUS } from './config';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request configuration interface
interface RequestConfig extends RequestInit {
  timeout?: number;
  retry?: number;
}

// API Client class
class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;

  constructor(baseURL: string, timeout: number = API_CONFIG.TIMEOUT) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
  }

  // Get access token from cookie
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  }

  // Create fetch with timeout
  private async fetchWithTimeout(
    url: string,
    options: RequestConfig = {}
  ): Promise<Response> {
    const { timeout = this.defaultTimeout, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout');
      }
      throw error;
    }
  }

  // Retry logic
  private async fetchWithRetry(
    url: string,
    options: RequestConfig = {}
  ): Promise<Response> {
    const { retry = 0, ...fetchOptions } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        return await this.fetchWithTimeout(url, fetchOptions);
      } catch (error: any) {
        lastError = error;
        if (attempt < retry) {
          await new Promise(resolve => 
            setTimeout(resolve, API_CONFIG.RETRY_DELAY * (attempt + 1))
          );
        }
      }
    }

    throw lastError;
  }

  // Main request method
  async request<T = any>(
    endpoint: string,
    options: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const accessToken = this.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const config: RequestConfig = {
      ...options,
      headers,
      credentials: 'include', // Include cookies
    };

    try {
      const response = await this.fetchWithRetry(url, config);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle error responses
      if (!response.ok) {
        throw new ApiError(
          response.status,
          data.message || 'An error occurred',
          data
        );
      }

      return data;
    } catch (error: any) {
      // Handle network errors
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.message || 'Network error occurred'
      );
    }
  }

  // GET request
  async get<T = any>(endpoint: string, options?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T = any>(
    endpoint: string,
    options?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_CONFIG.BASE_URL);
