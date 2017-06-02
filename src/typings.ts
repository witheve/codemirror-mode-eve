declare module "codemirror" {
  /////////////////////////////////////////////////////////////////////////////
  // Simple Mode Types
  /////////////////////////////////////////////////////////////////////////////

  export interface SimpleModePattern {
    /** The regular expression that matches the token */
    regex: string|RegExp,
    /** An optional token style. Multiple styles can be specified by separating them with dots or spaces. When the regex for this rule captures groups, it must capture all of the string. */
    token?: string|null,
    /** When true, this token will only match at the start of the line. */
    sol?: boolean,
    /** When a next property is present, the mode will transfer to the state named by the property when the token is encountered. */
    next?: string,
    /** Like next, but instead replacing the current state by the new state, the current state is kept on a stack, and can be returned to with the pop directive. */
    push?: string,
    /** When true, and there is another state on the state stack, will cause the mode to pop that state off the stack and transition to it. */
    pop?: boolean,
    /** Can be used to embed another mode inside a mode. */
    mode?: {spec: SimpleModeStates, end?: RegExp, persistent?: boolean},
    /** When true, this token changes the indentation to be one unit more than the current line's indentation. */
    indent?: boolean,
    /** When true, this token will pop one scope off the indentation stack. */
    dedent?: boolean,
    /** If a token has its dedent property set, it will, by default, cause lines where it appears at the start to be dedented. Set this property to false to prevent that behavior. */
    dedentIfLineStart?: boolean,
  }

  interface SimpleModeStates {
    meta?: {dontIndentStates:string[], lineComment:string, [key:string]: any}
    [state:string]: SimpleModePattern[]|any
  }

  export function defineSimpleMode(name:string, states:SimpleModeStates):void;

  /////////////////////////////////////////////////////////////////////////////
  // Misc. Missing Types
  /////////////////////////////////////////////////////////////////////////////

  export function defineMIME(mime:string, mode:string|{name:string, [attr:string]: any}):void;
  export interface ModeFactory<T> {}
  export var modes:{[name:string]: ModeFactory<any>}
}
