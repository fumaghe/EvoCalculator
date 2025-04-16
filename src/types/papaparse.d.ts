declare module "papaparse" {
    export interface ParseError {
      type: string;
      code: string;
      message: string;
      row: number;
    }
  
    export interface ParseMeta {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
      cursor: number;
      fields?: string[];
    }
  
    export interface ParseResult<T = any> {
      data: T[];
      errors: ParseError[];
      meta: ParseMeta;
    }
  
    export interface ParseConfig<T = any> {
      delimiter?: string;
      newline?: string;
      quoteChar?: string;
      escapeChar?: string;
      header?: boolean;
      dynamicTyping?: boolean | { [key: string]: boolean };
      preview?: number;
      encoding?: string;
      worker?: boolean;
      comments?: boolean | string;
      download?: boolean;
      skipEmptyLines?: boolean;
      fastMode?: boolean;
      beforeFirstChunk?: (chunk: string) => string;
      complete: (results: ParseResult<T>, file?: File) => void;
      error?: (error: ParseError, file?: File) => void;
    }
  
    export function parse<T = any>(input: string | File, config?: ParseConfig<T>): ParseResult<T>;
  
    export default {
      parse,
    };
  }
  