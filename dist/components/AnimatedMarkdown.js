"use strict";
'use client';
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_markdown_preview_1 = __importDefault(require("@uiw/react-markdown-preview"));
const remark_gfm_1 = __importDefault(require("remark-gfm"));
const docco_1 = __importDefault(require("react-syntax-highlighter/dist/esm/styles/hljs/docco"));
require("./animations.css");
require("./custom-lists.css");
const regex_splitter_1 = require("../utils/regex-splitter");
const AnimatedImage = ({ src, alt, animation, animationDuration, animationTimingFunction, animationIterationCount }) => {
    const [isLoaded, setIsLoaded] = react_1.default.useState(false);
    const imageStyle = isLoaded ? {
        animationName: animation,
        animationDuration: animationDuration,
        animationTimingFunction: animationTimingFunction,
        animationIterationCount: animationIterationCount,
        whiteSpace: 'pre-wrap',
    } : {
        display: 'none',
    };
    return (react_1.default.createElement("img", { src: src, alt: alt, onLoad: () => setIsLoaded(true), style: imageStyle }));
};
const TokenizedText = ({ input, sep, animation, animationDuration, animationTimingFunction, animationIterationCount }) => {
    const tokens = react_1.default.useMemo(() => {
        if (react_1.default.isValidElement(input))
            return [input];
        if (typeof input !== 'string')
            return null;
        let splitRegex;
        if (sep === 'word') {
            splitRegex = /(\s+)/;
        }
        else if (sep === 'char') {
            splitRegex = /(.)/;
        }
        else {
            throw new Error('Invalid separator');
        }
        return input.split(splitRegex).filter(token => token.length > 0);
    }, [input, sep]);
    return (react_1.default.createElement(react_1.default.Fragment, null, tokens === null || tokens === void 0 ? void 0 : tokens.map((token, index) => (react_1.default.createElement("span", { key: index, style: {
            animationName: animation,
            animationDuration,
            animationTimingFunction,
            animationIterationCount,
            whiteSpace: 'pre-wrap',
            display: 'inline-block',
        } }, token)))));
};
const MarkdownAnimateText = ({ content, sep = "word", animation = "fadeIn", animationDuration = "1s", animationTimingFunction = "ease-in-out", codeStyle = null, htmlComponents = {}, customComponents = {}, theme = 'light', }) => {
    customComponents = react_1.default.useMemo(() => {
        return Object.entries(customComponents).reduce((acc, [pattern, component]) => {
            if (!pattern.startsWith('/') && !pattern.endsWith('/')) {
                // Convert simple component name to HTML-style tag pattern
                const regexPattern = `/<${pattern}.*\\s*\\/\\>/`;
                acc[regexPattern] = component;
                delete acc[pattern];
            }
            return acc;
        }, {});
    }, [customComponents]);
    codeStyle = codeStyle || docco_1.default.docco;
    const animationStyle = {
        '--marker-animation': `${animation} ${animationDuration} ${animationTimingFunction}`,
    };
    // Add this new memoized function
    const generatePatterns = react_1.default.useMemo(() => {
        const generatePartialPatterns = (pattern) => {
            const components = (0, regex_splitter_1.splitRegexPattern)(pattern);
            return components.reduce((acc, _, index) => {
                if (index < components.length - 1) {
                    acc.push(components.slice(0, index + 1).join(''));
                }
                return acc;
            }, []);
        };
        const fullPatterns = Object.keys(customComponents).map(pattern => new RegExp(pattern.slice(1, -1)));
        const partialPatterns = fullPatterns.flatMap(generatePartialPatterns)
            .sort((a, b) => b.length - a.length);
        return { fullPatterns, partialPatterns };
    }, [customComponents]);
    const processCustomComponents = react_1.default.useCallback((text) => {
        if (text === '\n')
            return [];
        const { fullPatterns, partialPatterns } = generatePatterns;
        // Process the entire text as it ends with a complete pattern
        let remainingText = text;
        // Split text by full matches
        const regex = new RegExp(`(${fullPatterns.map(pattern => pattern.source).join('|')})`, 'g');
        let parts = [];
        let lastIndex = 0;
        if (fullPatterns.length === 0) {
            return [text];
        }
        // Use matchAll to find each match and its position
        for (const match of remainingText.matchAll(regex)) {
            // Add the substring before the match
            if (match.index > lastIndex) {
                parts.push(react_1.default.createElement(TokenizedText, { input: remainingText.slice(lastIndex, match.index), sep: sep, animation: animation, animationDuration: animationDuration, animationTimingFunction: animationTimingFunction, animationIterationCount: 1 }));
            }
            // Add the match itself - either as custom component or tokenized text
            const matchText = match[0];
            const matchPattern = fullPatterns.find(pattern => new RegExp(pattern).test(matchText));
            if (matchPattern && customComponents[matchPattern]) {
                const CustomComponent = customComponents[matchPattern];
                // Only extract props if it's an HTML-style component (starts with <)
                if (matchText.startsWith('<')) {
                    // Extract props from the matched text
                    const propsMatch = matchText.match(/\s+([\w-]+)=(?:"([^"]*)"|{([^}]*)})/g);
                    const props = propsMatch === null || propsMatch === void 0 ? void 0 : propsMatch.reduce((acc, prop) => {
                        const [name, value] = prop.trim().split('=');
                        // Handle both string values ("value") and JSX expressions ({value})
                        if (value.startsWith('"') && value.endsWith('"')) {
                            acc[name] = value.slice(1, -1); // Remove quotes
                        }
                        else if (value.startsWith('{') && value.endsWith('}')) {
                            acc[name] = value.slice(1, -1); // Remove braces
                        }
                        return acc;
                    }, {});
                    parts.push(react_1.default.createElement(TokenizedText, { input: react_1.default.createElement(CustomComponent, Object.assign({ key: match.index }, props, { content: matchText })), sep: sep, animation: animation, animationDuration: animationDuration, animationTimingFunction: animationTimingFunction, animationIterationCount: 1 }));
                }
                else {
                    // For non-HTML regex matches, just pass the content
                    parts.push(react_1.default.createElement(TokenizedText, { input: react_1.default.createElement(CustomComponent, { key: match.index, content: matchText }), sep: sep, animation: animation, animationDuration: animationDuration, animationTimingFunction: animationTimingFunction, animationIterationCount: 1 }));
                }
            }
            // Update the last index to be after the match
            lastIndex = match.index + match[0].length;
        }
        // Add any remaining part after the last match
        if (lastIndex < remainingText.length) {
            // Split the remaining text into before and after the partial pattern match
            const partialRegex = new RegExp(`(${partialPatterns.join('|')})$`);
            const partialMatch = remainingText.slice(lastIndex).match(partialRegex);
            if (partialMatch && partialMatch.index) {
                const beforePartial = remainingText.slice(lastIndex, lastIndex + partialMatch.index);
                if (beforePartial) {
                    parts.push(react_1.default.createElement(TokenizedText, { input: beforePartial, sep: sep, animation: animation, animationDuration: animationDuration, animationTimingFunction: animationTimingFunction, animationIterationCount: 1 }));
                }
            }
            else {
                parts.push(react_1.default.createElement(TokenizedText, { input: remainingText.slice(lastIndex), sep: sep, animation: animation, animationDuration: animationDuration, animationTimingFunction: animationTimingFunction, animationIterationCount: 1 }));
            }
        }
        return parts;
    }, [animation, animationDuration, animationTimingFunction, sep, generatePatterns]);
    // Memoize animateText function to prevent recalculations if props do not change
    const animateText = react_1.default.useCallback((text) => {
        text = Array.isArray(text) ? text : [text];
        const processText = (input) => {
            if (Array.isArray(input)) {
                // Process each element in the array
                return input.map(element => processText(element));
            }
            else if (typeof input === 'string') {
                if (!animation)
                    return input;
                return processCustomComponents(input);
            }
            else if (react_1.default.isValidElement(input)) {
                // If the element is a React component or element, clone it and process its children
                return input;
            }
            else {
                // Return non-string, non-element inputs unchanged (null, undefined, etc.)
                return input;
            }
        };
        if (!animation) {
            return text;
        }
        return processText(text);
    }, [animation, animationDuration, animationTimingFunction, sep]);
    // Memoize components object to avoid redefining components unnecessarily
    const components = react_1.default.useMemo(() => (Object.assign({ text: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return animateText(props.children);
        }, h1: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("h1", Object.assign({}, props), animateText(props.children));
        }, h2: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("h2", Object.assign({}, props), animateText(props.children));
        }, h3: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("h3", Object.assign({}, props), animateText(props.children));
        }, h4: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("h4", Object.assign({}, props), animateText(props.children));
        }, h5: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("h5", Object.assign({}, props), animateText(props.children));
        }, h6: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("h6", Object.assign({}, props), animateText(props.children));
        }, p: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("p", Object.assign({}, props), animateText(props.children));
        }, li: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("li", Object.assign({}, props, { className: "custom-li", style: animationStyle }), animateText(props.children));
        }, a: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("a", Object.assign({}, props, { href: props.href, target: "_blank", rel: "noopener noreferrer" }), animateText(props.children));
        }, strong: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("strong", Object.assign({}, props), animateText(props.children));
        }, em: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("em", Object.assign({}, props), animateText(props.children));
        }, hr: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("hr", Object.assign({}, props, { style: {
                    animationName: animation,
                    animationDuration,
                    animationTimingFunction,
                    animationIterationCount: 1,
                    whiteSpace: 'pre-wrap',
                } }));
        }, img: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement(AnimatedImage, { src: props.src, alt: props.alt, animation: animation || '', animationDuration: animationDuration, animationTimingFunction: animationTimingFunction, animationIterationCount: 1 });
        }, table: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("table", Object.assign({}, props, { className: "code-block" }), props.children);
        }, tr: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("tr", Object.assign({}, props), animateText(props.children));
        }, td: (_a) => {
            var { node } = _a, props = __rest(_a, ["node"]);
            return react_1.default.createElement("td", Object.assign({}, props), animateText(props.children));
        } }, htmlComponents)), [animateText]);
    return (react_1.default.createElement(react_markdown_preview_1.default, { source: content, className: "wmde-markdown", wrapperElement: {
            'data-color-mode': theme
        }, remarkPlugins: [remark_gfm_1.default], components: components }));
};
exports.default = MarkdownAnimateText;
