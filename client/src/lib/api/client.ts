import axios, { type AxiosRequestConfig } from "axios";
import { getSession } from "next-auth/react";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

export const publicHttp = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

type AxiosInstance = <T>(url: string, config?: RequestInit) => Promise<T>;

export const axiosInstance: AxiosInstance = async <T>(
  url: string,
  config?: RequestInit,
) => {
  const session = await getSession();
  const axiosConfig: AxiosRequestConfig = {
    url,
    method: config?.method as AxiosRequestConfig["method"],
    headers: config?.headers as AxiosRequestConfig["headers"],
  };

  if (session?.accessToken) {
    axiosConfig.headers = {
      ...axiosConfig.headers,
      Authorization: `Bearer ${session.accessToken}`,
    };
  }

  // Map fetch body -> axios data
  if (config?.body !== undefined) {
    axiosConfig.data = config.body;
  }

  const response = await http.request<T>(axiosConfig);

  return response.data;
};
