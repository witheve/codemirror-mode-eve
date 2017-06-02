import * as CodeMirror from "codemirror";

if(!CodeMirror["defineSimpleMode"]) throw new Error("Please ensure that the simple-mode addon is loaded prior to eve-mode.");
if(!CodeMirror.modes["gfm"]) console.warn("Codemirror eve mode was designed to be embedded within gfm mode. Please ensure gfm mode is loaded prior to eve-mode.");

// Just some type silliness to tell TS to preserve the static keys but type their values as Patterns.
function asPatterns<T extends {}>(patterns:T):{[name in keyof T]:CodeMirror.SimpleModePattern} {
  return patterns as any;
}

let patterns = asPatterns({
  start_search: {
    regex: /^\s*search/,
    token: "keyword.section.search",
    indent: true,
    next: "search",
  },
  start_action: {
    regex: /^\s*(bind|commit)/,
    token: "keyword.section.action",
    indent: true,
    next: "action"
  },

  start_record: {
    regex: /\[/,
    token: "syntax",
    indent: true,
    push: "record",
  },
  stop_record: {
    regex: /\]/,
    token: "syntax",
    dedent: true,
    pop: true
  },

  start_function: {
    regex: /([a-zA-Z][a-zA-Z0-9\-_\?!\/]*)(\[)/,
    token: ["identifier.function", "syntax"],
    indent: true,
    push: "record",
  },

  start_not: {
    regex: /(not)(\()/,
    token: ["keyword.not", "syntax"],
    indent: true,
    push: "not",
  },
  stop_not: {
    regex: /\)/,
    token: "syntax",
    dedent: true,
    pop: true,
  },

  start_comment: {regex: /\/\*.*/, token: "comment", push: "comment"},
  stop_comment: {regex: /.*\*\//, token: "comment", pop: true},
  comment_inner: {regex: /.+?/, token: "comment"},

  start_string: {regex: /(?:(?!\\))"/, token: "literal.string", push: "string"},
  stop_string: {regex: /(?:(?!\\))"/, token: "literal.string", pop: true},
  string_inner: {regex: /(?:[^"\\{]|\\.)+/, token: "literal.string"},

  start_interpolation: {regex: /(?:(?!\\)){{/, token: "syntax", push: "interpolation"},
  stop_interpolation: {regex: /(?:(?!\\))}}/, token: "syntax", pop: true},

  if_then_else: {
    regex: /if|then|else/,
    token: "keyword.if"
  },

  number: {regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i, token: "literal.number"},
  comment: {regex: /(?:\/\/.*)|(?:\/\*.*\*\/)/, token: "comment"},
  tag: {regex: /#[a-zA-Z0-9\-_\?!\/]+/, token: "tag"},
  identifier: {regex: /[a-zA-Z][a-zA-Z0-9\-_\?!\/]*/, token: "identifier"},
  infix: {regex: /-|\+|\/|\*/, token: "operator.infix"},
  filter: {regex: /<|<=|>|>=|!=/, token: "operator.filter"},
  update: {regex: /\+=|-=|:=|<-/, token: "operator.update"},
  misc_syntax: {regex: /[:.]/, token: "syntax"}
});

function compose(...states:CodeMirror.SimpleModePattern[][]) {
  let result:CodeMirror.SimpleModePattern[] = [];
  for(let state of states) {
    result.push(...state);
  }
  return result;
}

let comment = [patterns.comment, patterns.start_comment];
let expr = [
  patterns.infix,
  patterns.start_string,
  patterns.start_function,
  patterns.identifier,
  patterns.number
];

let mode = CodeMirror.defineSimpleMode("eve", {
  meta: {
    dontIndentStates: ["comment"],
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/"
  },
  start: compose(
    comment,
    [
      patterns.start_search,
      patterns.start_action
    ]
  ),

  record: compose(
    comment,
    [
      patterns.stop_record,
      patterns.start_record,
      patterns.tag,
      patterns.filter,
      patterns.misc_syntax
    ],
    expr
  ),

  search: compose(
    comment,
    [
      patterns.start_action,
      patterns.start_record,
      patterns.start_not,
      patterns.if_then_else,
      patterns.filter,
      patterns.misc_syntax
    ],
    expr
  ),

  not: compose(
    comment,
    [
      patterns.stop_not,
      patterns.start_record,
      patterns.filter,
      patterns.misc_syntax
    ],
    expr
  ),

  comment: [
    patterns.stop_comment,
    patterns.comment_inner
  ],

  action: compose(
    comment,
    [
      patterns.start_record,
      patterns.update,
      patterns.misc_syntax
    ],
    expr
  ),

  string: [
    patterns.start_interpolation,
    patterns.string_inner,
    patterns.stop_string,
    {regex: /./, token: "string"}
  ],

  interpolation: compose(
    comment,
    [
      patterns.stop_interpolation,
      patterns.start_record,
      patterns.misc_syntax
    ],
    expr
  )
});

CodeMirror.defineMIME("text/eve", "eve");