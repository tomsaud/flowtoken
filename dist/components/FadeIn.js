"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
require("./animations.css");
const StreamingFadeInText = ({ incomingText, animation = "", sep = "token" }) => {
    // console.log('sep:', sep);
    const [animatingTokens, setAnimatingTokens] = (0, react_1.useState)([]);
    const [completedTokens, setCompletedTokens] = (0, react_1.useState)([]);
    const lastTokenTime = (0, react_1.useRef)(performance.now());
    const numId = (0, react_1.useRef)(0);
    const receivedText = (0, react_1.useRef)('');
    const animationDuration = '0.5s';
    const animationTimingFunction = 'ease-in-out';
    (0, react_1.useEffect)(() => {
        if (incomingText) {
            const textToSplit = incomingText.slice(receivedText.current.length);
            // Split the text and include spaces in the tokens list
            let newTokens = [];
            if (sep === 'token') {
                newTokens = textToSplit.split(/(\s+)/).filter(token => token.length > 0);
            }
            else if (sep === 'char') {
                newTokens = textToSplit.split('');
                // console.log('New tokens:', newTokens);
            }
            else {
                throw new Error('Invalid separator');
            }
            const newTokenObjects = newTokens.map(token => ({ token, id: numId.current++ }));
            if (newTokenObjects.length === 0)
                return;
            newTokenObjects.forEach((token, index) => {
                const delay = 10 - (performance.now() - (lastTokenTime.current || 0));
                lastTokenTime.current = Math.max(performance.now() + delay, lastTokenTime.current || 0);
                setTimeout(() => {
                    setAnimatingTokens(prev => [...prev, token]);
                }, delay);
            });
            // setAnimatingTokens(prev => [...prev, ...newTokenObjects]);
            receivedText.current = incomingText;
        }
    }, [incomingText]);
    // const handleAnimationEnd = (token?: string) => {
    //     console.log('Animation:', animatingTokens);
    //     setAnimatingTokens((prev) => {
    //         const prevToken = prev[0].token;
    //         console.log('Token:', prevToken);
    //         setCompletedTokens(prev => [...prev, prevToken]);
    //         return prev.slice(1);
    //     });
    // };
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("span", null, completedTokens.join('')),
        animatingTokens.map(({ token, id }) => {
            if (token === '\n')
                return react_1.default.createElement("br", { key: id });
            return react_1.default.createElement("span", { key: id, style: {
                    animationName: animation,
                    animationDuration: animationDuration,
                    animationTimingFunction: animationTimingFunction,
                    animationIterationCount: 1,
                    whiteSpace: 'pre',
                    display: 'inline-block',
                } }, token);
        })));
};
exports.default = StreamingFadeInText;
