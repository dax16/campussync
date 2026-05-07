// xss-clean ships no type declarations — minimal shim so TypeScript accepts the import.
declare module 'xss-clean' {
  import { RequestHandler } from 'express';
  function xss(): RequestHandler;
  export = xss;
}
