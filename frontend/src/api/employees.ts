import apiClient from "./client";
import type {
  EmployeesResponse,
  EmployeeResponse,
  EmployeesQueryParams,
  EmployeeFormData,
} from "../types/employee";

export async function fetchEmployees(params: EmployeesQueryParams): Promise<EmployeesResponse> {
  const { data } = await apiClient.get<EmployeesResponse>("/employees", { params });
  return data;
}

export async function createEmployee(employee: EmployeeFormData): Promise<EmployeeResponse> {
  const { data } = await apiClient.post<EmployeeResponse>("/employees", { employee });
  return data;
}
