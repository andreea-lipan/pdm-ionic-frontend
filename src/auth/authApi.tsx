import axios from 'axios';
import { baseUrl, config, withLogs } from '../core';

const authUrl = `http://${baseUrl}/api/auth/login`;

export interface AuthProps {
  token: string;
}

// @ts-ignore
export const getToken: () => string = () => {
  return localStorage.getItem("token") ? localStorage.getItem("token") : '' ;
}

export const login: (username?: string, password?: string) => Promise<AuthProps> = (username, password) => {
  return withLogs(axios.post(authUrl, { username, password }, config), 'login');
}
