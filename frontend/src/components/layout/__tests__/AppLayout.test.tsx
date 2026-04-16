import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../test/render";
import App from "../../../App";

describe("AppLayout", () => {
  it("renders the app title", () => {
    renderWithProviders(<App />);
    expect(screen.getByText("Salary Management")).toBeInTheDocument();
  });

  it("renders the sidebar navigation items", () => {
    renderWithProviders(<App />);
    // Nav items are inside MUI ListItemButton elements
    const listItems = screen.getAllByRole("button");
    const navLabels = listItems.map((el) => el.textContent?.trim());
    expect(navLabels).toContain("Employees");
    expect(navLabels).toContain("Salary Insights");
  });

  it("renders the employees page by default", () => {
    renderWithProviders(<App />);
    expect(screen.getByRole("heading", { name: /employees/i })).toBeInTheDocument();
  });

  it("redirects unknown routes to /employees", () => {
    renderWithProviders(<App />, { initialRoute: "/nonexistent" });
    expect(screen.getByRole("heading", { name: /employees/i })).toBeInTheDocument();
  });
});
