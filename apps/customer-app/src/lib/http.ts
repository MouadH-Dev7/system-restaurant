import axios from 'axios';
import { CSRF_CONFIG } from '@repo/shared-types';

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '/api',
  ...CSRF_CONFIG,
});
