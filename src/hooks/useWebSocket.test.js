import React from 'react';
import { act, render } from '@testing-library/react';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import useWebSocket from './useWebSocket';

import { io } from 'socket.io-client';

jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

const createMockSocket = () => {
  const socket = {
    handlers: {},
    emit: jest.fn(),
    on: jest.fn(function on(event, callback) {
      this.handlers[event] = callback;
      return this;
    }),
    off: jest.fn(),
    disconnect: jest.fn(),
  };
  return socket;
};

const HookProbe = () => {
  useWebSocket({
    autoSubscribeAccess: true,
    autoSubscribeDevices: true,
    autoSubscribeSync: true,
    autoSubscribeStats: true,
  });
  return null;
};

beforeEach(() => {
  localStorage.clear();
  io.mockReset();
});

test('emite somente a allowlist code-owned de subscribe:*', () => {
  const mockSocket = createMockSocket();
  io.mockReturnValue(mockSocket);
  localStorage.setItem('token', 'token-de-teste');

  render(
    <WebSocketProvider>
      <HookProbe />
    </WebSocketProvider>
  );

  act(() => {
    mockSocket.handlers.connect();
  });

  expect(mockSocket.emit.mock.calls).toEqual([
    ['subscribe:acessos'],
    ['subscribe:dispositivos'],
    ['subscribe:sync'],
    ['subscribe:stats'],
  ]);
  expect(mockSocket.emit).not.toHaveBeenCalledWith('join', expect.anything());
});
