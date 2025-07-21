// API module for namespace import testing

export function get(url: string): Promise<any> {
  return fetch(url).then(res => res.json());
}

export function post(url: string, data: any): Promise<any> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());
}

export function put(url: string, data: any): Promise<any> {
  return fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());
}

export const BASE_URL = 'https://api.example.com';
export const TIMEOUT = 5000;