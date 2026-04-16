export interface Employee {
  id: number;
  full_name: string;
  job_title: string;
  country: string;
  salary_cents: number;
  salary: number;
  currency: string;
  email: string | null;
  hired_on: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
}

export interface EmployeesResponse {
  data: Employee[];
  meta: PaginationMeta;
}

export interface EmployeeResponse {
  data: Employee;
}

export interface EmployeeFormData {
  full_name: string;
  job_title: string;
  country: string;
  salary_cents: number;
  currency: string;
  email: string;
  hired_on: string;
}

export interface EmployeesQueryParams {
  page: number;
  per_page: number;
  sort?: string;
  direction?: "asc" | "desc";
  country?: string;
  job_title?: string;
  search?: string;
}
