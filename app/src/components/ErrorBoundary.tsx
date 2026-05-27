import { Component, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {};

  public static getDerivedStateFromError(error: any): State {
    return error instanceof Error ? { error } : { error: new Error(String(error)) };
  }

  public componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  componentDidMount() {
    window.addEventListener("unhandledrejection", this.onUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener("unhandledrejection", this.onUnhandledRejection);
  }

  onUnhandledRejection = (event: PromiseRejectionEvent) => {
    event.promise.catch((error) => {
      this.setState(ErrorBoundary.getDerivedStateFromError(error));
    });
  };

  public render() {
    const error = this.state.error;
    if (!error) return this.props.children;
    return <p>Error</p>;
  }
}

export default ErrorBoundary;
