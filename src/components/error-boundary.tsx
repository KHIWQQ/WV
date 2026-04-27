"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  translations?: {
    errorOccurred?: string;
    cannotDisplaySection?: string;
    retry?: string;
  };
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { translations } = this.props;
      const errorTitle = translations?.errorOccurred ?? "เกิดข้อผิดพลาด";
      const errorDesc = translations?.cannotDisplaySection ?? "ไม่สามารถแสดงส่วนนี้ได้";
      const retryText = translations?.retry ?? "ลองใหม่";

      return (
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold">{errorTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {this.state.error?.message || errorDesc}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              <RefreshCw className="h-4 w-4" />
              {retryText}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

