"use client";
import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto de dados frescos: navegação instantânea sem loading spinner
            gcTime: 10 * 60 * 1000, // 10 minutos de retenção em cache
            refetchOnWindowFocus: false, // evita refetch desnecessário ao alternar abas
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
