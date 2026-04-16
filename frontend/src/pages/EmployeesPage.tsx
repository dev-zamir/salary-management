import { useState, useCallback } from "react";
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  InputAdornment,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  type SelectChangeEvent,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { DataGrid, type GridSortModel, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import { useQueryClient } from "@tanstack/react-query";
import { useEmployees } from "../hooks/useEmployees";
import { createEmployee, updateEmployee, deleteEmployee } from "../api/employees";
import EmployeeFormDialog from "../components/EmployeeFormDialog";
import type { Employee, EmployeesQueryParams } from "../types/employee";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const STORAGE_KEY = "employees_per_page";

function getStoredPageSize(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = Number(stored);
    if (PAGE_SIZE_OPTIONS.includes(parsed)) return parsed;
  }
  return 25;
}

function getColumns(onEdit: (employee: Employee) => void, onDelete: (employee: Employee) => void): GridColDef[] {
  return [
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
    {
      field: "actions",
      headerName: "",
      width: 100,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => onEdit(params.row as Employee)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(params.row as Employee)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];
}

interface CustomPaginationProps {
  page: number;
  pageSize: number;
  rowCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function CustomPagination({ page, pageSize, rowCount, onPageChange, onPageSizeChange }: CustomPaginationProps) {
  const pageCount = Math.ceil(rowCount / pageSize);
  const from = rowCount === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, rowCount);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.5,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 14 }}>
        <span>Rows per page:</span>
        <FormControl size="small" variant="outlined">
          <Select
            value={pageSize}
            onChange={(e: SelectChangeEvent<number>) => onPageSizeChange(e.target.value as number)}
            sx={{ fontSize: 14, height: 32 }}
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <span style={{ marginLeft: 16 }}>
          {from}–{to} of {rowCount.toLocaleString()}
        </span>
      </Box>

      <Pagination
        count={pageCount}
        page={page + 1} // MUI Pagination is 1-indexed
        onChange={(_e, value) => onPageChange(value - 1)}
        shape="rounded"
        color="primary"
        showFirstButton
        showLastButton
        siblingCount={1}
        boundaryCount={1}
      />
    </Box>
  );
}

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: getStoredPageSize(),
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const columns = getColumns(
    (employee) => setEditingEmployee(employee),
    (employee) => setDeletingEmployee(employee),
  );

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
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Add Employee
        </Button>
        </Box>
      </Box>

      <EmployeeFormDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={async (formData) => {
          await createEmployee(formData);
          queryClient.invalidateQueries({ queryKey: ["employees"] });
        }}
        title="Add Employee"
      />

      <EmployeeFormDialog
        open={editingEmployee !== null}
        onClose={() => setEditingEmployee(null)}
        onSubmit={async (formData) => {
          await updateEmployee(editingEmployee!.id, formData);
          queryClient.invalidateQueries({ queryKey: ["employees"] });
        }}
        initialData={editingEmployee}
        title="Edit Employee"
      />

      <Dialog
        open={deletingEmployee !== null}
        onClose={() => setDeletingEmployee(null)}
      >
        <DialogTitle>Delete Employee</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deletingEmployee?.full_name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingEmployee(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              try {
                await deleteEmployee(deletingEmployee!.id);
                queryClient.invalidateQueries({ queryKey: ["employees"] });
                setDeletingEmployee(null);
              } finally {
                setDeleting(false);
              }
            }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

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
        hideFooter
        sx={{ backgroundColor: "background.paper", minHeight: 400 }}
      />
      <CustomPagination
        page={paginationModel.page}
        pageSize={paginationModel.pageSize}
        rowCount={data?.meta.total ?? 0}
        onPageChange={(page) => setPaginationModel((prev) => ({ ...prev, page }))}
        onPageSizeChange={(pageSize) => {
          localStorage.setItem(STORAGE_KEY, String(pageSize));
          setPaginationModel({ page: 0, pageSize });
        }}
      />
    </Box>
  );
}
