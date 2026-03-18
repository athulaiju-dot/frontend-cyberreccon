const BACKEND_BASE = "https://cyberrecon-backend.onrender.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || BACKEND_BASE;

function getErrorMessage(resp: Response) {
  return `Server error ${resp.status}: ${resp.statusText || "Unexpected backend error"}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${API_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  } catch (error: any) {
    throw new Error(error?.message || "Network request failed.");
  }

  if (!response.ok) {
    let payload: any;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    const serverMessage = payload?.message || payload?.error;
    throw new Error(serverMessage || getErrorMessage(response));
  }

  try {
    return (await response.json()) as T;
  } catch (err) {
    throw new Error("Invalid JSON response from backend.");
  }
}

export interface WhoisResponse {
  registrar?: string;
  creation_date?: string;
  expiration_date?: string;
  [key: string]: any;
}

export interface DNSResponse {
  ips?: string[];
  A?: string[];
  dns?: string[];
  [key: string]: any;
}

export interface ReconResponse {
  raw?: string;
  output?: string;
  data?: string;
  [key: string]: any;
}

export async function getWhois(domain: string): Promise<WhoisResponse> {
  if (!domain) throw new Error("Domain is required for WHOIS lookup.");
  return fetchJson<WhoisResponse>(`/whois/${encodeURIComponent(domain)}`);
}

export async function getDNS(domain: string): Promise<DNSResponse> {
  if (!domain) throw new Error("Domain is required for DNS lookup.");
  return fetchJson<DNSResponse>(`/dns/${encodeURIComponent(domain)}`);
}

export async function getRecon(domain: string): Promise<ReconResponse> {
  if (!domain) throw new Error("Domain is required for RECON lookup.");
  return fetchJson<ReconResponse>(`/recon/${encodeURIComponent(domain)}`);
}

export const API = {
  url: API_URL,
  getWhois,
  getDNS,
  getRecon,
};
