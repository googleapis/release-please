export {};

declare global {
  interface ErrorOptions {
    cause?: unknown;
  }
}
