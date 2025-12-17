import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configuração do QueryClient
// Estratégia: Cache inteligente (estilo Next.js/SWR)
// - Não refetch automático se dados estão "fresh" (não expirados)
// - Refetch apenas em eventos (WebSocket) ou quando explicitamente solicitado
// - Perfeito para sistema interno com pouco acesso mas muita atualização
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tempo de cache - "fresh" por 10 minutos
      // Dados nessas condições não serão refetched automaticamente
      staleTime: 1000 * 60 * 10, // 10 minutos = sem refetch automático
      cacheTime: 1000 * 60 * 15, // 15 minutos = quando remover do cache
      
      // Refetch automático - DESABILITADO (padrão Next.js)
      refetchOnWindowFocus: false, // ❌ Não refetch ao trocar de aba
      refetchOnReconnect: true, // ✅ Apenas ao perder e reconectar internet
      refetchOnMount: false, // ❌ Usar cache se disponível (não refetch)
      
      // Retry conservador
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Error handling
      onError: (error) => {
        console.error('Query error:', error);
      }
    },
    mutations: {
      // Retry para mutations
      retry: 1,
      
      // Error handling
      onError: (error) => {
        console.error('Mutation error:', error);
      }
    }
  }
});

export const ReactQueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
};

export { queryClient };
export default ReactQueryProvider;
