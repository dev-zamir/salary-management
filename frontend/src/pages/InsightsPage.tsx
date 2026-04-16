import { useState, useRef, useEffect } from "react";
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
  TablePagination,
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

  // Pagination state for both tables
  const [countryPage, setCountryPage] = useState(0);
  const [countryRowsPerPage, setCountryRowsPerPage] = useState(10);
  const [jobTitlePage, setJobTitlePage] = useState(0);
  const [jobTitleRowsPerPage, setJobTitleRowsPerPage] = useState(10);

  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const selectCountryAndScroll = (country: string) => {
    setSelectedCountry(country);
    setJobTitlePage(0);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
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

  const countryRows = countryStats ?? [];
  const paginatedCountryRows = countryRows.slice(
    countryPage * countryRowsPerPage,
    countryPage * countryRowsPerPage + countryRowsPerPage
  );

  const jobTitleRows = jobTitleStats ?? [];
  const paginatedJobTitleRows = jobTitleRows.slice(
    jobTitlePage * jobTitleRowsPerPage,
    jobTitlePage * jobTitleRowsPerPage + jobTitleRowsPerPage
  );

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
            {paginatedCountryRows.map((row) => (
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
        <TablePagination
          component="div"
          count={countryRows.length}
          page={countryPage}
          onPageChange={(_e, newPage) => setCountryPage(newPage)}
          rowsPerPage={countryRowsPerPage}
          onRowsPerPageChange={(e) => {
            setCountryRowsPerPage(parseInt(e.target.value, 10));
            setCountryPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </TableContainer>

      {/* ---- Job title breakdown for selected country ---- */}
      <Box ref={jobTitleSectionRef} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <Typography variant="h6">Salary by Job Title</Typography>
        <TextField
          select
          size="small"
          label="Country"
          value={selectedCountry}
          onChange={(e) => {
            setSelectedCountry(e.target.value);
            setJobTitlePage(0);
          }}
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
              {paginatedJobTitleRows.map((row) => (
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
          <TablePagination
            component="div"
            count={jobTitleRows.length}
            page={jobTitlePage}
            onPageChange={(_e, newPage) => setJobTitlePage(newPage)}
            rowsPerPage={jobTitleRowsPerPage}
            onRowsPerPageChange={(e) => {
              setJobTitleRowsPerPage(parseInt(e.target.value, 10));
              setJobTitlePage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </TableContainer>
      )}
    </Box>
  );
}
