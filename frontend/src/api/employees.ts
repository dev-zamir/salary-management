import apiClient from "./client";
import type { EmployeesResponse, EmployeesQueryParams } from "../types/employee";

export async function fetchEmployees(params: EmployeesQueryParams): Promise<EmployeesResponse> {
  const { data } = await apiClient.get<EmployeesResponse>("/employees", { params });
  return data;
}
