import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/Button";
import { ErrorMessage } from "./ui/ErrorMessage";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(error, this.handleReset);
      }
      return (
        <div
          role="alert"
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <ErrorMessage
            message={`Что-то пошло не так: ${error.message}`}
          />
          <Button variant="primary" onClick={this.handleReset}>
            Повторить
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
