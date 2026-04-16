import apiClient from "./client";

export interface CountryStat {
  country: string;
  currency: string;
  employee_count: number;
  min_salary_cents: number;
  max_salary_cents: number;
  avg_salary_cents: number;
  min_salary: number;
  max_salary: number;
  avg_salary: number;
}

export interface JobTitleStat {
  job_title: string;
  currency: string;
  employee_count: number;
  min_salary_cents: number;
  max_salary_cents: number;
  avg_salary_cents: number;
  min_salary: number;
  max_salary: number;
  avg_salary: number;
}

export async function fetchCountryStats(): Promise<CountryStat[]> {
  const { data } = await apiClient.get<{ data: CountryStat[] }>("/insights/by_country");
  return data.data;
}

export async function fetchJobTitleStats(country: string): Promise<JobTitleStat[]> {
  const { data } = await apiClient.get<{ data: JobTitleStat[] }>("/insights/by_job_title", {
    params: { country },
  });
  return data.data;
}
