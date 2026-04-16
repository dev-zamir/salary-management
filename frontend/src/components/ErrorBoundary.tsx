import { Component, type ReactNode } from "react";
import { Box, Typography, Button } from "@mui/material";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 2, p: 3 }}>
          <Typography variant="h5" color="error">
            Something went wrong
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 500, textAlign: "center" }}>
            An unexpected error occurred. Please try again or refresh the page.
          </Typography>
          <Button variant="contained" onClick={this.handleReset}>
            Try Again
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
