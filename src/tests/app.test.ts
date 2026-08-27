import assert from "node:assert";
import test from "node:test";
import app from "../app";

test("GET /health-check returns 200 with standard status", async () => {
  const server = app.listen(0);
  const address = server.address() as any;
  const port = address.port;

  try {
    const res = await fetch(`http://localhost:${port}/health-check`);
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, true);
    assert.strictEqual(body.message, "yorozuya_be service is healthy");
    assert.strictEqual(body.data.status, "ok");
  } finally {
    server.close();
  }
});

test("GET / returns 200 welcome message", async () => {
  const server = app.listen(0);
  const address = server.address() as any;
  const port = address.port;

  try {
    const res = await fetch(`http://localhost:${port}/`);
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, true);
    assert.strictEqual(body.data.version, "1.0.0");
  } finally {
    server.close();
  }
});

test("GET /unknown-route returns 404 with standard error format", async () => {
  const server = app.listen(0);
  const address = server.address() as any;
  const port = address.port;

  try {
    const res = await fetch(`http://localhost:${port}/unknown-route`);
    assert.strictEqual(res.status, 404);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, false);
    assert.strictEqual(body.code, "NOT_FOUND");
  } finally {
    server.close();
  }
});
