declare module "pg" {
  export type ClientConfig = {
    connectionString?: string;
    ssl?: unknown;
    [key: string]: unknown;
  };

  export class Client {
    constructor(config?: ClientConfig);
    connect(): Promise<void>;
    query<T = unknown>(
      queryTextOrConfig: unknown,
      values?: unknown[],
    ): Promise<{ rows: T[] }>;
    end(): Promise<void>;
  }
}
