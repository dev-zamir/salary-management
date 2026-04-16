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

export async function updateEmployee(id: number, employee: EmployeeFormData): Promise<EmployeeResponse> {
  const { data } = await apiClient.patch<EmployeeResponse>(`/employees/${id}`, { employee });
  return data;
}

export async function deleteEmployee(id: number): Promise<void> {
  await apiClient.delete(`/employees/${id}`);
}
