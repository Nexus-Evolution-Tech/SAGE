import React from "react";
import { render } from "@testing-library/react";
import { io } from "socket.io-client";
import { WebSocketProvider } from "./WebSocketContext";

const mockSocket = {
  on: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock("socket.io-client", () => ({
  io: jest.fn(),
}));

test("conecta o Socket.IO ao mesmo origin por padrão", () => {
  const originalSocketUrl = process.env.REACT_APP_SOCKET_URL;
  process.env.REACT_APP_SOCKET_URL = "";
  io.mockReturnValue(mockSocket);

  const { unmount } = render(
    <WebSocketProvider>
      <div>conteúdo</div>
    </WebSocketProvider>
  );

  expect(io).toHaveBeenCalledWith(
    undefined,
    expect.objectContaining({
      transports: ["websocket", "polling"],
    })
  );

  unmount();
  expect(mockSocket.disconnect).toHaveBeenCalled();
  if (originalSocketUrl === undefined) {
    delete process.env.REACT_APP_SOCKET_URL;
  } else {
    process.env.REACT_APP_SOCKET_URL = originalSocketUrl;
  }
});
