import * as CodeMirror from "codemirror";
import "codemirror/addon/mode/simple";

// Optional but recommended if authoring Eve documents rather than individual blocks.
// import "codemirror/addon/mode/overlay";
// import "codemirror/addon/mode/multiplex";
// import "codemirror/mode/gfm/gfm";
// import "codemirror/mode/markdown/markdown";
// import "codemirror/mode/javascript/javascript";

// Just some type silliness to tell TS to preserve the static keys but type their values as Patterns.
function asPatterns<T extends {}>(patterns:T):{[name in keyof T]:CodeMirror.SimpleModePattern} {
  return patterns as any;
}

let _identifierPattern = /[^\s|\[\](){}"',.:=#]+/;
let patterns = asPatterns({
  start_search: {
    regex: /search/,
    token: "keyword.section.search",
    indent: true,
    push: "search",
  },
  start_action: {
    regex: /(bind|commit)/,
    token: "keyword.section.action",
    indent: true,
    dedent: true,
    push: "action"
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
    token: "syntax.end-not",
    dedent: true,
    pop: true,
  },

  start_string: {regex: /(?:(?!\\))"/, token: "literal.string", push: "string"},
  stop_string: {regex: /(?:(?!\\))"/, token: "literal.string", pop: true},
  string_inner: {regex: /(?:[^"\\{]|\\.)+/, token: "literal.string"},

  start_interpolation: {regex: /(?:(?!\\)){{/, token: "syntax", push: "interpolation"},
  stop_interpolation: {regex: /(?:(?!\\))}}/, token: "syntax", pop: true},

  if: {regex: /if|else if/, token: "keyword.if", indent: true},
  then: {regex: /then/, token: "keyword.if", dedent: true},
  else: {regex: /else/, token: "keyword.if"},

  number: {regex: /[-+]?(?:\.\d+|\d+\.?\d*)/, token: "literal.number"},
  comment: {regex: /\/\/.*/, token: "comment"},
  identifier: {regex: _identifierPattern, token: "identifier"},
  tag: {regex: new RegExp("#" + _identifierPattern.source), token: "tag"},
  infix: {regex: /-|\+|\/|\*/, token: "operator.infix"},
  filter: {regex: /<|<=|>|>=|!=/, token: "operator.filter"},
  update: {regex: /\+=|-=|:=|<-/, token: "operator.update"},
  misc_syntax: {regex: /[:.,]/, token: "syntax.misc"}
});

function compose(...states:CodeMirror.SimpleModePattern[][]) {
  let result:CodeMirror.SimpleModePattern[] = [];
  for(let state of states) {
    result.push(...state);
  }
  return result;
}

let expr = [
  patterns.infix,
  patterns.start_string,
  patterns.start_function,
  patterns.identifier,
  patterns.number
];

let union_or_choose = [
  patterns.if,
  patterns.then,
  patterns.else
];

let mode = CodeMirror.defineSimpleMode("eve", {
  meta: {
    //dontIndentStates: ["comment"],
    lineComment: "//"
  },
  start: [
    patterns.comment,
    patterns.start_search,
    patterns.start_action
  ],

  record: compose(
    [
      patterns.comment,
      patterns.stop_record,
      patterns.start_record,
      patterns.tag,
      patterns.filter,
      patterns.misc_syntax
    ],
    expr
  ),

  search: compose(
    [
      patterns.comment,
      patterns.tag,
      patterns.start_action,
      patterns.start_record,
      patterns.start_not,
    ],
    union_or_choose,
    [
      patterns.filter,
      patterns.misc_syntax
    ],
    expr
  ),

  not: compose(
    [
      patterns.comment,
      patterns.stop_not,
      patterns.start_record,
      patterns.filter,
      patterns.misc_syntax
    ],
    expr
  ),

  action: compose(
    [
      patterns.comment,
      patterns.start_record,
      // @FIXME: begin hack for whitespace syntax
      patterns.start_search,
      patterns.start_action,
      patterns.filter,
      // @FIXME: end hack for whitespace syntax
      patterns.update,
      patterns.tag,
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
    [
      patterns.comment,
      patterns.stop_interpolation,
      patterns.start_record,
      patterns.misc_syntax
    ],
    expr
  )
});

CodeMirror.defineMIME("text/eve", "eve");
