declare module "sql.js" {
  interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  interface Statement {
    run(params?: unknown[]): void;
    free(): void;
  }

  interface Database {
    run(sql: string, params?: unknown[]): void;
    exec(sql: string, params?: unknown[]): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }

  export type { Database, QueryExecResult, Statement };

  export default function initSqlJs(config?: Record<string, unknown>): Promise<SqlJsStatic>;
}
