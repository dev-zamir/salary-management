import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchEmployees } from "../api/employees";
import type { EmployeesQueryParams } from "../types/employee";

export function useEmployees(params: EmployeesQueryParams) {
  return useQuery({
    queryKey: ["employees", params],
    queryFn: () => fetchEmployees(params),
    placeholderData: keepPreviousData,
  });
}
