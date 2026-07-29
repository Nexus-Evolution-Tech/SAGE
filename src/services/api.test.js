describe("API no mesmo origin", () => {
  const originalApiUrl = process.env.REACT_APP_API_URL;

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.REACT_APP_API_URL;
    } else {
      process.env.REACT_APP_API_URL = originalApiUrl;
    }
    jest.resetModules();
  });

  test("usa caminhos relativos quando a URL não é configurada", () => {
    process.env.REACT_APP_API_URL = "";
    jest.resetModules();

    const { API_URL, getAreaPhotoUrl } = require("./api");

    expect(API_URL).toBe("");
    expect(getAreaPhotoUrl("/areas/foto.jpg")).toBe("/uploads/areas/foto.jpg");
  });
});
