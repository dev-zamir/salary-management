import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { fetchCountryStats, fetchJobTitleStats } from "../api/insights";
import type { CountryStat } from "../api/insights";

function formatSalary(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SummaryCards({ stats }: { stats: CountryStat[] }) {
  const totalEmployees = stats.reduce((sum, s) => sum + s.employee_count, 0);
  const totalCountries = stats.length;
  const totalJobTitles = new Set(stats.map((s) => s.country)).size; // unique countries

  return (
    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography color="text.secondary" variant="body2">Total Employees</Typography>
          <Typography variant="h4">{totalEmployees.toLocaleString()}</Typography>
        </CardContent>
      </Card>
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography color="text.secondary" variant="body2">Countries</Typography>
          <Typography variant="h4">{totalCountries}</Typography>
        </CardContent>
      </Card>
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography color="text.secondary" variant="body2">Avg Headcount / Country</Typography>
          <Typography variant="h4">
            {totalCountries > 0 ? Math.round(totalEmployees / totalCountries).toLocaleString() : "—"}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function InsightsPage() {
  const [selectedCountry, setSelectedCountry] = useState("");
  const jobTitleSectionRef = useRef<HTMLDivElement>(null);

  const selectCountryAndScroll = (country: string) => {
    setSelectedCountry(country);
    setTimeout(() => {
      jobTitleSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const {
    data: countryStats,
    isLoading: countryLoading,
    error: countryError,
  } = useQuery({
    queryKey: ["insights", "by_country"],
    queryFn: fetchCountryStats,
  });

  const {
    data: jobTitleStats,
    isLoading: jobTitleLoading,
  } = useQuery({
    queryKey: ["insights", "by_job_title", selectedCountry],
    queryFn: () => fetchJobTitleStats(selectedCountry),
    enabled: selectedCountry !== "",
  });

  if (countryLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (countryError) {
    return <Alert severity="error">Failed to load salary insights.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Salary Insights</Typography>

      <SummaryCards stats={countryStats ?? []} />

      {/* ---- Country-level stats ---- */}
      <Typography variant="h6" sx={{ mb: 1 }}>Salary by Country</Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Country</strong></TableCell>
              <TableCell align="right"><strong>Employees</strong></TableCell>
              <TableCell align="right"><strong>Currency</strong></TableCell>
              <TableCell align="right"><strong>Min Salary</strong></TableCell>
              <TableCell align="right"><strong>Max Salary</strong></TableCell>
              <TableCell align="right"><strong>Avg Salary</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(countryStats ?? []).map((row) => (
              <TableRow
                key={`${row.country}-${row.currency}`}
                hover
                onClick={() => selectCountryAndScroll(row.country)}
                sx={{ cursor: "pointer", backgroundColor: selectedCountry === row.country ? "action.selected" : undefined }}
              >
                <TableCell>{row.country}</TableCell>
                <TableCell align="right">{row.employee_count}</TableCell>
                <TableCell align="right">{row.currency}</TableCell>
                <TableCell align="right">{formatSalary(row.min_salary, row.currency)}</TableCell>
                <TableCell align="right">{formatSalary(row.max_salary, row.currency)}</TableCell>
                <TableCell align="right">{formatSalary(row.avg_salary, row.currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ---- Job title breakdown for selected country ---- */}
      <Box ref={jobTitleSectionRef} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <Typography variant="h6">Salary by Job Title</Typography>
        <TextField
          select
          size="small"
          label="Country"
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">
            <em>Select a country</em>
          </MenuItem>
          {(countryStats ?? []).map((row) => (
            <MenuItem key={row.country} value={row.country}>
              {row.country}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {selectedCountry === "" && (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Click a country row above or use the dropdown to see the job title breakdown.
        </Typography>
      )}

      {selectedCountry !== "" && jobTitleLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {selectedCountry !== "" && !jobTitleLoading && jobTitleStats && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Job Title</strong></TableCell>
                <TableCell align="right"><strong>Employees</strong></TableCell>
                <TableCell align="right"><strong>Min Salary</strong></TableCell>
                <TableCell align="right"><strong>Max Salary</strong></TableCell>
                <TableCell align="right"><strong>Avg Salary</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobTitleStats.map((row) => (
                <TableRow key={row.job_title} hover>
                  <TableCell>{row.job_title}</TableCell>
                  <TableCell align="right">{row.employee_count}</TableCell>
                  <TableCell align="right">{formatSalary(row.min_salary, row.currency)}</TableCell>
                  <TableCell align="right">{formatSalary(row.max_salary, row.currency)}</TableCell>
                  <TableCell align="right">{formatSalary(row.avg_salary, row.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
