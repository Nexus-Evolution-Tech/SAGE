import React from "react";
import { act, render } from "@testing-library/react";
import { io } from "socket.io-client";
import { WebSocketProvider } from "./WebSocketContext";

jest.mock("socket.io-client", () => ({
  io: jest.fn(),
}));

const createMockSocket = () => ({
  on: jest.fn(),
  disconnect: jest.fn(),
});

const renderProvider = () => render(
  <WebSocketProvider>
    <div>conteudo</div>
  </WebSocketProvider>
);

beforeEach(() => {
  localStorage.clear();
  io.mockReset();
});

test.each([undefined, ""])("nao chama Socket.IO sem token de sessao (%s)", (token) => {
  if (token !== undefined) {
    localStorage.setItem("token", token);
  }

  renderProvider();

  expect(io).not.toHaveBeenCalled();
});

test("conecta com token e preserva URL/configuracao e transportes", () => {
  const originalSocketUrl = process.env.REACT_APP_SOCKET_URL;
  process.env.REACT_APP_SOCKET_URL = "";
  const mockSocket = createMockSocket();
  io.mockReturnValue(mockSocket);
  localStorage.setItem("token", "token-de-teste");

  const { unmount } = renderProvider();

  expect(io).toHaveBeenCalledWith(
    undefined,
    expect.objectContaining({
      auth: { token: "token-de-teste" },
      transports: ["websocket", "polling"],
    })
  );

  unmount();
  expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  if (originalSocketUrl === undefined) {
    delete process.env.REACT_APP_SOCKET_URL;
  } else {
    process.env.REACT_APP_SOCKET_URL = originalSocketUrl;
  }
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
    undefined,
    expect.objectContaining({ auth: { token: "token-novo" } })
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
