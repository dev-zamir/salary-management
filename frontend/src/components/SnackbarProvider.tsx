import { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert, type AlertColor } from "@mui/material";

interface SnackbarMessage {
  text: string;
  severity: AlertColor;
}

interface SnackbarContextValue {
  showSnackbar: (text: string, severity?: AlertColor) => void;
}

const SnackbarContext = createContext<SnackbarContextValue>({
  showSnackbar: () => {},
});

export function useSnackbar() {
  return useContext(SnackbarContext);
}

export default function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<SnackbarMessage | null>(null);

  const showSnackbar = useCallback((text: string, severity: AlertColor = "success") => {
    setMessage({ text, severity });
  }, []);

  const handleClose = () => setMessage(null);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={message !== null}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {message ? (
          <Alert onClose={handleClose} severity={message.severity} variant="filled" sx={{ width: "100%" }}>
            {message.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}
