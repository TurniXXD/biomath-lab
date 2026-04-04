import axios, { type AxiosRequestConfig } from "axios";

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
  const axiosConfig: AxiosRequestConfig = {
    url,
    method: config?.method as AxiosRequestConfig["method"],
    headers: config?.headers as AxiosRequestConfig["headers"],
  };

  // Map fetch body -> axios data
  if (config?.body !== undefined) {
    axiosConfig.data = config.body;
  }

  const response = await http.request<T>(axiosConfig);

  return response.data;
};
