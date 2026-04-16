import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { renderWithProviders } from "../../test/render";
import EmployeeFormDialog from "../EmployeeFormDialog";
import type { Employee } from "../../types/employee";

const noop = vi.fn();

describe("EmployeeFormDialog", () => {
  it("renders the dialog title", () => {
    renderWithProviders(
      <EmployeeFormDialog open onClose={noop} onSubmit={noop} title="Add Employee" />
    );
    expect(screen.getByText("Add Employee")).toBeInTheDocument();
  });

  it("renders empty fields for a new employee", () => {
    renderWithProviders(
      <EmployeeFormDialog open onClose={noop} onSubmit={noop} title="Add Employee" />
    );
    expect(screen.getByLabelText(/full name/i)).toHaveValue("");
    expect(screen.getByLabelText(/email/i)).toHaveValue("");
    expect(screen.getByLabelText(/hired on/i)).toHaveValue("");
  });

  it("pre-fills fields when editing an existing employee", () => {
    const employee: Employee = {
      id: 1,
      full_name: "Jane Doe",
      job_title: "CTO",
      country: "United States",
      salary_cents: 250_000_00,
      salary: 250_000,
      currency: "USD",
      email: "jane@example.com",
      hired_on: "2023-01-15",
      created_at: "2023-01-15T00:00:00Z",
      updated_at: "2023-01-15T00:00:00Z",
    };

    renderWithProviders(
      <EmployeeFormDialog
        open
        onClose={noop}
        onSubmit={noop}
        initialData={employee}
        title="Edit Employee"
      />
    );

    expect(screen.getByLabelText(/full name/i)).toHaveValue("Jane Doe");
    expect(screen.getByLabelText(/email/i)).toHaveValue("jane@example.com");
    expect(screen.getByLabelText(/hired on/i)).toHaveValue("2023-01-15");
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <EmployeeFormDialog open onClose={onClose} onSubmit={noop} title="Add Employee" />
    );

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onSubmit with form data when Save is clicked", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <EmployeeFormDialog open onClose={noop} onSubmit={onSubmit} title="Add Employee" />
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/full name/i), "John Smith");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    const submittedData = onSubmit.mock.calls[0][0];
    expect(submittedData.full_name).toBe("John Smith");
  });

  it("displays server validation errors", async () => {
    const error = new AxiosError("Request failed");
    error.response = {
      data: { errors: ["Full name can't be blank"] },
      status: 422,
      statusText: "Unprocessable Content",
      headers: {},
      config: {} as never,
    };
    const onSubmit = vi.fn().mockRejectedValue(error);

    renderWithProviders(
      <EmployeeFormDialog open onClose={noop} onSubmit={onSubmit} title="Add Employee" />
    );

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText("Full name can't be blank")).toBeInTheDocument();
    });
  });

  it("does not render when open is false", () => {
    const { container } = renderWithProviders(
      <EmployeeFormDialog open={false} onClose={noop} onSubmit={noop} title="Add Employee" />
    );
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });
});
