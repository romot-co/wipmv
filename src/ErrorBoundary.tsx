import React from 'react';
import { Card, Heading, Text, Button } from '@radix-ui/themes';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('エラーがキャッチされました:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} reset={this.handleReset} />;
      }

      return (
        <Card style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem' }}>
          <Heading as="h2" size="5" mb="4" style={{ color: 'var(--red-9)' }}>
            エラーが発生しました
          </Heading>
          <Text as="p" size="2" mb="4" style={{ color: 'var(--gray-11)' }}>
            {this.state.error?.message || 'アプリケーションでエラーが発生しました。'}
          </Text>
          <Button 
            onClick={this.handleReset}
            size="2"
            variant="solid"
            color="red"
          >
            再試行
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

// カスタムエラーフォールバックコンポーネントの例
export const CustomErrorFallback: React.FC<{ error: Error; reset: () => void }> = ({
  error,
  reset,
}) => (
  <Card style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem' }}>
    <Heading as="h2" size="5" mb="4" style={{ color: 'var(--red-9)' }}>
      エラーが発生しました
    </Heading>
    <Text as="p" size="2" mb="2" style={{ color: 'var(--gray-11)' }}>
      {error.message}
    </Text>
    <Text as="p" size="1" mb="4" style={{ color: 'var(--gray-9)' }}>
      このエラーが続く場合は、ページを更新するか、サポートにお問い合わせください。
    </Text>
    <Button 
      onClick={reset}
      size="2"
      variant="solid"
      color="red"
    >
      再試行
    </Button>
  </Card>
);
