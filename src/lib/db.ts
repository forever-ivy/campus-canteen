/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import * as sql from "mssql";

declare global {
  // eslint-disable-next-line no-var
  var __mssql_pool__: sql.ConnectionPool | undefined;
}

function getConfig(): sql.config {
  const urlStr = process.env.DATABASE_URL;
  if (!urlStr) {
    throw new Error("Missing DATABASE_URL for MSSQL connection");
  }
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch (e: any) {
    throw new Error(`Invalid DATABASE_URL: ${e?.message || e}`);
  }

  const database = url.pathname.replace(/^\//, "");

  return {
    server: url.hostname,
    port: url.port ? Number(url.port) : 1433,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    options: {
      encrypt: url.searchParams.get("encrypt") === "true",
      trustServerCertificate:
        url.searchParams.get("trustServerCertificate") === "true",
    },
  } as sql.config;
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (global.__mssql_pool__ && global.__mssql_pool__.connected) {
    return global.__mssql_pool__;
  }

  const pool = await sql.connect(getConfig());
  if (process.env.NODE_ENV !== "production") {
    global.__mssql_pool__ = pool;
  }
  return pool;
}

export { sql };
