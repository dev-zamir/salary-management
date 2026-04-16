import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Chip,
} from "@mui/material";
import type { Employee } from "../types/employee";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
}

function formatSalary(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function EmployeeDetailDialog({ open, onClose, employee }: Props) {
  if (!employee) return null;

  const rows = [
    { label: "ID", value: employee.id },
    { label: "Full Name", value: employee.full_name },
    { label: "Job Title", value: employee.job_title },
    { label: "Country", value: employee.country },
    { label: "Salary", value: formatSalary(employee.salary, employee.currency) },
    { label: "Currency", value: employee.currency },
    { label: "Email", value: employee.email || "—" },
    { label: "Hired On", value: formatDate(employee.hired_on) },
    { label: "Created At", value: formatDate(employee.created_at) },
    { label: "Updated At", value: formatDate(employee.updated_at) },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {employee.full_name}
        <Chip label={employee.job_title} size="small" color="primary" variant="outlined" />
      </DialogTitle>
      <DialogContent dividers>
        <Table size="small">
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                <TableCell sx={{ fontWeight: 600, width: 140, color: "text.secondary" }}>
                  {row.label}
                </TableCell>
                <TableCell>{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
