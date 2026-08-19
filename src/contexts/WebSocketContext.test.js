import React from "react";
import { act, render, screen } from "@testing-library/react";
import { io } from "socket.io-client";
import { useWebSocketContext, WebSocketProvider } from "./WebSocketContext";

jest.mock("socket.io-client", () => ({
  io: jest.fn(),
}));

const createMockSocket = () => ({
  handlers: {},
  on: jest.fn(function on(event, callback) {
    this.handlers[event] = callback;
    return this;
  }),
  disconnect: jest.fn(),
});

const renderProvider = () => render(
  <WebSocketProvider>
    <div>conteudo</div>
  </WebSocketProvider>
);

const renderConnectionState = () => render(
  <WebSocketProvider>
    <ConnectionState />
  </WebSocketProvider>
);

const ConnectionState = () => {
  const { connectionError, isConnected } = useWebSocketContext();
  return (
    <output data-testid="connection-state">
      {isConnected ? 'connected' : 'disconnected'}:{connectionError || ''}
    </output>
  );
};

beforeEach(() => {
  localStorage.clear();
  io.mockReset();
  delete process.env.REACT_APP_SOCKET_PATH;
});

test.each([undefined, ""])("nao chama Socket.IO sem token de sessao (%s)", (token) => {
  if (token !== undefined) {
    localStorage.setItem("token", token);
  }

  renderProvider();

  expect(io).not.toHaveBeenCalled();
});

test("usa a origem atual e o path default com os transportes configurados", () => {
  const mockSocket = createMockSocket();
  io.mockReturnValue(mockSocket);
  localStorage.setItem("token", "token-de-teste");

  const { unmount } = renderProvider();

  expect(io).toHaveBeenCalledWith(
    expect.objectContaining({
      path: "/socket.io",
      auth: { token: "token-de-teste" },
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 5000,
    })
  );

  unmount();
  expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
});

test("usa o path configurado sem alterar a origem", () => {
  const mockSocket = createMockSocket();
  io.mockReturnValue(mockSocket);
  process.env.REACT_APP_SOCKET_PATH = "/backend/socket.io";
  localStorage.setItem("token", "token-de-teste");

  renderProvider();

  expect(io).toHaveBeenCalledWith(
    expect.objectContaining({
      path: "/backend/socket.io",
      auth: { token: "token-de-teste" },
    })
  );
});

test("mantem o erro visivel enquanto o socket nao esta conectado", () => {
  const mockSocket = createMockSocket();
  io.mockReturnValue(mockSocket);
  localStorage.setItem("token", "token-de-teste");

  renderConnectionState();

  expect(screen.getByTestId("connection-state").textContent).toBe(
    "disconnected:WebSocket desconectado"
  );

  act(() => {
    mockSocket.handlers.disconnect();
  });

  expect(screen.getByTestId("connection-state").textContent).toBe(
    "disconnected:WebSocket desconectado"
  );
});

test("reconecta sem recarregar e limpa o erro ao conectar", () => {
  const mockSocket = createMockSocket();
  io.mockReturnValue(mockSocket);
  localStorage.setItem("token", "token-de-teste");

  renderConnectionState();

  act(() => {
    mockSocket.handlers.connect_error({ message: "servidor indisponivel" });
  });
  expect(screen.getByTestId("connection-state").textContent).toBe(
    "disconnected:servidor indisponivel"
  );

  act(() => {
    mockSocket.handlers.connect();
  });
  expect(screen.getByTestId("connection-state").textContent).toBe("connected:");
  expect(io).toHaveBeenCalledTimes(1);
});

test("trocar o token desconecta o anterior e conecta a nova identidade", () => {
  const previousSocket = createMockSocket();
  const nextSocket = createMockSocket();
  io.mockReturnValueOnce(previousSocket).mockReturnValueOnce(nextSocket);
  localStorage.setItem("token", "token-anterior");

  renderProvider();

  act(() => {
    localStorage.setItem("token", "token-novo");
    window.dispatchEvent(new Event("auth-changed"));
  });

  expect(previousSocket.disconnect).toHaveBeenCalledTimes(1);
  expect(io).toHaveBeenCalledTimes(2);
  expect(io).toHaveBeenLastCalledWith(
    expect.objectContaining({
      path: "/socket.io",
      auth: { token: "token-novo" },
    })
  );
});

test("logout desconecta o socket da sessao anterior", () => {
  const mockSocket = createMockSocket();
  io.mockReturnValue(mockSocket);
  localStorage.setItem("token", "token-de-teste");

  renderProvider();

  act(() => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
  });

  expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  expect(io).toHaveBeenCalledTimes(1);
});
