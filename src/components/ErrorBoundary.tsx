import { Component, type ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Global Error Boundary — catches React rendering errors
 * and shows a friendly NB-styled fallback instead of a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("[ErrorBoundary] Caught rendering error:", error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    handleGoHome = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = "/";
    };

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="min-h-screen flex items-center justify-center p-6"
                    style={{
                        fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
                        background: "#f9fafb",
                    }}
                >
                    <div
                        style={{
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                            padding: "2.5rem",
                            maxWidth: "480px",
                            width: "100%",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                width: "64px",
                                height: "64px",
                                borderRadius: "50%",
                                background: "#FEE2E2",
                                border: "1px solid #e5e7eb",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 1.5rem",
                                fontSize: "28px",
                            }}
                        >
                            😵
                        </div>
                        <h1
                            style={{
                                fontWeight: 800,
                                fontSize: "1.5rem",
                                color: "#111827",
                                marginBottom: "0.5rem",
                            }}
                        >
                            Đã xảy ra lỗi
                        </h1>
                        <p
                            style={{
                                fontWeight: 500,
                                fontSize: "0.875rem",
                                color: "#6B7280",
                                marginBottom: "1.5rem",
                                lineHeight: 1.6,
                            }}
                        >
                            Trang không thể hiển thị. Hãy thử tải lại hoặc quay về trang chủ.
                        </p>
                        {import.meta.env.DEV && this.state.error && (
                            <pre
                                style={{
                                    background: "#F3F4F6",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "4px",
                                    padding: "0.75rem",
                                    fontSize: "0.75rem",
                                    color: "#DC2626",
                                    textAlign: "left",
                                    overflow: "auto",
                                    maxHeight: "120px",
                                    marginBottom: "1.5rem",
                                    fontFamily: "monospace",
                                }}
                            >
                                {this.state.error.message}
                            </pre>
                        )}
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button
                                onClick={this.handleGoHome}
                                style={{
                                    flex: 1,
                                    padding: "0.625rem 1.25rem",
                                    fontWeight: 700,
                                    fontSize: "0.875rem",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "4px",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                    cursor: "pointer",
                                    background: "white",
                                    color: "#111827",
                                    transition: "all 0.2s",
                                }}
                            >
                                🏠 Trang chủ
                            </button>
                            <button
                                onClick={this.handleRetry}
                                style={{
                                    flex: 1,
                                    padding: "0.625rem 1.25rem",
                                    fontWeight: 700,
                                    fontSize: "0.875rem",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "4px",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                    cursor: "pointer",
                                    background: "#8b7bc7",
                                    color: "#111827",
                                    transition: "all 0.2s",
                                }}
                            >
                                🔄 Tải lại
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
