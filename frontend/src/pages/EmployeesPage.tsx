import { useState, useCallback } from "react";
import {
  Box,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import { DataGrid, type GridSortModel, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import { useEmployees } from "../hooks/useEmployees";
import type { EmployeesQueryParams } from "../types/employee";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const columns: GridColDef[] = [
  { field: "full_name", headerName: "Name", flex: 1, minWidth: 180 },
  { field: "job_title", headerName: "Job Title", flex: 1, minWidth: 180 },
  { field: "country", headerName: "Country", flex: 0.8, minWidth: 140 },
  {
    field: "salary",
    headerName: "Salary",
    flex: 0.7,
    minWidth: 130,
    type: "number",
    valueFormatter: (value: number, row) => {
      if (value == null) return "";
      return `${row.currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
  },
  { field: "email", headerName: "Email", flex: 1, minWidth: 200, sortable: false },
  { field: "hired_on", headerName: "Hired On", width: 120 },
];

export default function EmployeesPage() {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => {
        setSearchDebounced(value);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
      }, 400);
      setDebounceTimer(timer);
    },
    [debounceTimer]
  );

  const queryParams: EmployeesQueryParams = {
    page: paginationModel.page + 1, // DataGrid is 0-indexed, API is 1-indexed
    per_page: paginationModel.pageSize,
    ...(sortModel[0] && {
      sort: sortModel[0].field,
      direction: sortModel[0].sort ?? "asc",
    }),
    ...(searchDebounced && { search: searchDebounced }),
  };

  const { data, isLoading } = useEmployees(queryParams);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">Employees</Typography>
        <TextField
          size="small"
          placeholder="Search by name, email, or job title..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          sx={{ width: 350 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <DataGrid
        rows={data?.data ?? []}
        columns={columns}
        rowCount={data?.meta.total ?? 0}
        loading={isLoading}
        paginationMode="server"
        sortingMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        disableRowSelectionOnClick
        sx={{ backgroundColor: "background.paper", minHeight: 400 }}
      />
    </Box>
  );
}
