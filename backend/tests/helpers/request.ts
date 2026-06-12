import type { Express } from "express";
import request from "supertest";

export interface RequestOptions {
  token?: string;
  body?: unknown;
}

export function createTestAgent(app: Express) {
  return {
    get(path: string, options?: RequestOptions) {
      let req = request(app).get(path);
      if (options?.token) {
        req = req.set("Authorization", `Bearer ${options.token}`);
      }
      return req;
    },
    post(path: string, options?: RequestOptions) {
      let req = request(app).post(path);
      if (options?.token) {
        req = req.set("Authorization", `Bearer ${options.token}`);
      }
      if (options?.body) {
        req = req.send(options.body as object);
      }
      return req;
    },
    delete(path: string, options?: RequestOptions) {
      let req = request(app).delete(path);
      if (options?.token) {
        req = req.set("Authorization", `Bearer ${options.token}`);
      }
      return req;
    },
  };
}
