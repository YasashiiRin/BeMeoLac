import React from 'react';
import { EmptyState } from './EmptyState';
import { isApiError } from '../services/http';

interface ErrorStateProps {
  onRetry: () => void;
  /** the error that happened; network and server messages are shown gently */
  error?: unknown;
  title?: string;
  className?: string;
}

/** A load failure with a "Thử lại" button. */
export const ErrorState: React.FC<ErrorStateProps> = ({ onRetry, error, title = 'Khu vườn chưa mở được', className }) => (
  <EmptyState
    icon="🍂"
    title={title}
    description={
      isApiError(error, 'network_error')
        ? 'Không kết nối được máy chủ. Nàng kiểm tra mạng rồi thử lại nhé.'
        : 'Có chút trục trặc khi tải dữ liệu. Nàng thử lại sau một chút nhé.'
    }
    actionText="Thử lại"
    onAction={onRetry}
    className={className}
  />
);
