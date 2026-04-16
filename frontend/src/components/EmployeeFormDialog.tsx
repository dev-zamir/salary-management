import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Alert,
} from "@mui/material";
import { COUNTRIES_WITH_CURRENCY, CURRENCY_BY_COUNTRY, JOB_TITLES } from "../constants";
import type { EmployeeFormData, Employee } from "../types/employee";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  initialData?: Employee | null;
  title: string;
}

const EMPTY_FORM: EmployeeFormData = {
  full_name: "",
  job_title: "",
  country: "",
  salary_cents: 0,
  currency: "USD",
  email: "",
  hired_on: "",
};

export default function EmployeeFormDialog({ open, onClose, onSubmit, initialData, title }: Props) {
  const [form, setForm] = useState<EmployeeFormData>(EMPTY_FORM);
  const [salaryDisplay, setSalaryDisplay] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          full_name: initialData.full_name,
          job_title: initialData.job_title,
          country: initialData.country,
          salary_cents: initialData.salary_cents,
          currency: initialData.currency,
          email: initialData.email ?? "",
          hired_on: initialData.hired_on,
        });
        setSalaryDisplay(String(initialData.salary_cents / 100));
      } else {
        setForm(EMPTY_FORM);
        setSalaryDisplay("");
      }
      setErrors([]);
      setDirty(false);
      setConfirmClose(false);
    }
  }, [open, initialData]);

  const handleChange = (field: keyof EmployeeFormData, value: string) => {
    setDirty(true);
    if (field === "country") {
      const currency = CURRENCY_BY_COUNTRY[value] ?? "USD";
      setForm((prev) => ({ ...prev, country: value, currency }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSalaryChange = (value: string) => {
    setDirty(true);
    setSalaryDisplay(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      setForm((prev) => ({ ...prev, salary_cents: Math.round(parsed * 100) }));
    }
  };

  const handleSubmit = async () => {
    setErrors([]);
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response: { data?: { errors?: string[] } } }).response;
        setErrors(response.data?.errors ?? ["An unexpected error occurred"]);
      } else {
        setErrors(["An unexpected error occurred"]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (dirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  };

  return (
    <>
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {errors.length > 0 && (
            <Alert severity="error">
              {errors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </Alert>
          )}

          <TextField
            label="Full Name"
            value={form.full_name}
            onChange={(e) => handleChange("full_name", e.target.value)}
            required
            fullWidth
          />

          <TextField
            label="Job Title"
            value={form.job_title}
            onChange={(e) => handleChange("job_title", e.target.value)}
            select
            required
            fullWidth
          >
            {JOB_TITLES.map((jt) => (
              <MenuItem key={jt} value={jt}>
                {jt}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Country"
            value={form.country}
            onChange={(e) => handleChange("country", e.target.value)}
            select
            required
            fullWidth
          >
            {COUNTRIES_WITH_CURRENCY.map((c) => (
              <MenuItem key={c.country} value={c.country}>
                {c.country}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label={`Salary (${form.currency})`}
              value={salaryDisplay}
              onChange={(e) => handleSalaryChange(e.target.value)}
              type="number"
              required
              fullWidth
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
            />
            <TextField
              label="Currency"
              value={form.currency}
              onChange={(e) => handleChange("currency", e.target.value)}
              select
              required
              sx={{ width: 140 }}
            >
              {[...new Set(COUNTRIES_WITH_CURRENCY.map((c) => c.currency))].sort().map((cur) => (
                <MenuItem key={cur} value={cur}>
                  {cur}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <TextField
            label="Email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            type="email"
            fullWidth
          />

          <TextField
            label="Hired On"
            value={form.hired_on}
            onChange={(e) => handleChange("hired_on", e.target.value)}
            type="date"
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>

    <Dialog open={confirmClose} onClose={() => setConfirmClose(false)}>
      <DialogTitle>Discard changes?</DialogTitle>
      <DialogContent>
        You have unsaved changes. Are you sure you want to close?
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmClose(false)}>Keep Editing</Button>
        <Button
          color="error"
          onClick={() => {
            setConfirmClose(false);
            onClose();
          }}
        >
          Discard
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
