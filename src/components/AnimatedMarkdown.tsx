'use client';
import React from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import style from 'react-syntax-highlighter/dist/esm/styles/hljs/docco'
import './animations.css';
import './custom-lists.css';
import { splitRegexPattern } from '../utils/regex-splitter';

interface SmoothTextProps {
    content: string;
    sep?: string;
    animation?: string | null;
    animationDuration?: string;
    animationTimingFunction?: string;
    codeStyle?: any;
    htmlComponents?: any;
    customComponents?: any;
    theme?: 'light' | 'dark';
}

interface AnimatedImageProps {
    src: string;
    alt: string;
    animation: string;
    animationDuration: string;
    animationTimingFunction: string;
    animationIterationCount: number;
}

interface CustomRendererProps {
    rows: any[];
    stylesheet: any;
    useInlineStyles: boolean;
}

const AnimatedImage: React.FC<AnimatedImageProps>  = ({ src, alt, animation, animationDuration, animationTimingFunction, animationIterationCount }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);

    const imageStyle = isLoaded ? {
        animationName: animation,
        animationDuration: animationDuration,
        animationTimingFunction: animationTimingFunction,
        animationIterationCount: animationIterationCount,
        whiteSpace: 'pre-wrap',
    } : {
        display: 'none',
    };

    return (
        <img
            src={src}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            style={imageStyle}
        />
    );
};

const TokenizedText = ({ input, sep, animation, animationDuration, animationTimingFunction, animationIterationCount }: any) => {
    const tokens = React.useMemo(() => {
        if (React.isValidElement(input)) return [input];

        if (typeof input !== 'string') return null;

        let splitRegex;
        if (sep === 'word') {
            splitRegex = /(\s+)/;
        } else if (sep === 'char') {
            splitRegex = /(.)/;
        } else {
            throw new Error('Invalid separator');
        }

        return input.split(splitRegex).filter(token => token.length > 0);
    }, [input, sep]);

    return (
        <>
            {tokens?.map((token, index) => (
                <span key={index} style={{
                    animationName: animation,
                    animationDuration,
                    animationTimingFunction,
                    animationIterationCount,
                    whiteSpace: 'pre-wrap',
                    display: 'inline-block',
                }}>
                    {token}
                </span>
            ))}
        </>
    );
};

const MarkdownAnimateText: React.FC<SmoothTextProps> = ({
    content,
    sep = "word",
    animation = "fadeIn",
    animationDuration = "1s",
    animationTimingFunction = "ease-in-out",
    codeStyle=null,
    htmlComponents = {},
    customComponents = {},
    theme = 'light',
}) => {
    customComponents = React.useMemo(() => {
        return Object.entries(customComponents).reduce((acc, [pattern, component]) => {
            if (!pattern.startsWith('/') && !pattern.endsWith('/')) {
                // Convert simple component name to HTML-style tag pattern
                const regexPattern = `/<${pattern}.*\\s*\\/\\>/`;
                acc[regexPattern] = component;
                delete acc[pattern];
            }
            return acc;
        }, {} as typeof customComponents);
    }, [customComponents]);
    
    codeStyle = codeStyle || style.docco;
    const animationStyle: any
     = {
        '--marker-animation': `${animation} ${animationDuration} ${animationTimingFunction}`,
    };

    // Add this new memoized function
    const generatePatterns = React.useMemo(() => {
        const generatePartialPatterns = (pattern: RegExp ): string[] => {
            const components = splitRegexPattern(pattern as unknown as string);
            return components.reduce((acc: string[], _, index) => {
                if (index < components.length - 1) {
                    acc.push(components.slice(0, index + 1).join(''));
                }
                return acc;
            }, []);
        };

        const fullPatterns = Object.keys(customComponents).map(pattern => new RegExp(pattern.slice(1, -1)));
        const partialPatterns: string[] = fullPatterns.flatMap(generatePartialPatterns)
            .sort((a, b) => b.length - a.length);

        return { fullPatterns, partialPatterns };
    }, [customComponents]);

    const processCustomComponents = React.useCallback((text: string): React.ReactNode[] => {
        if (text === '\n') return [];
        const { fullPatterns, partialPatterns } = generatePatterns;

        // Process the entire text as it ends with a complete pattern
        let remainingText = text;
        
        // Split text by full matches
        const regex = new RegExp(`(${fullPatterns.map(pattern => pattern.source).join('|')})`, 'g');
        let parts: React.ReactNode[] = [];
        let lastIndex = 0;

        if (fullPatterns.length === 0) {
            return [text];
        }

        // Use matchAll to find each match and its position
        for (const match of remainingText.matchAll(regex)) {
            // Add the substring before the match
            if (match.index > lastIndex) {
                parts.push(<TokenizedText
                        input={remainingText.slice(lastIndex, match.index)}
                        sep={sep}
                        animation={animation}
                        animationDuration={animationDuration}
                        animationTimingFunction={animationTimingFunction}
                        animationIterationCount={1}
                    />);
            }
            // Add the match itself - either as custom component or tokenized text
            const matchText = match[0];
            const matchPattern = fullPatterns.find(pattern => new RegExp(pattern).test(matchText));
            if (matchPattern && customComponents[matchPattern as unknown as string]) {
                const CustomComponent = customComponents[matchPattern as unknown as string];

                // Only extract props if it's an HTML-style component (starts with <)
                if (matchText.startsWith('<')) {
                    // Extract props from the matched text
                    const propsMatch = matchText.match(/\s+([\w-]+)=(?:"([^"]*)"|{([^}]*)})/g);
                    const props = propsMatch?.reduce((acc: any, prop: string) => {
                        const [name, value] = prop.trim().split('=');
                        // Handle both string values ("value") and JSX expressions ({value})
                        if (value.startsWith('"') && value.endsWith('"')) {
                            acc[name] = value.slice(1, -1); // Remove quotes
                        } else if (value.startsWith('{') && value.endsWith('}')) {
                            acc[name] = value.slice(1, -1); // Remove braces
                        }
                        return acc;
                    }, {});

                    parts.push(<TokenizedText
                        input={<CustomComponent 
                            key={match.index} 
                            {...props}
                            content={matchText} // Keep original content just in case
                        />}
                        sep={sep}
                        animation={animation}
                        animationDuration={animationDuration}
                        animationTimingFunction={animationTimingFunction}
                        animationIterationCount={1}
                    />);
                } else {
                    // For non-HTML regex matches, just pass the content
                    parts.push(<TokenizedText
                        input={<CustomComponent key={match.index} content={matchText} />}
                        sep={sep}
                        animation={animation}
                        animationDuration={animationDuration}
                        animationTimingFunction={animationTimingFunction}
                        animationIterationCount={1}
                    />);
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
                    parts.push(<TokenizedText
                        input={beforePartial}
                        sep={sep}
                        animation={animation}
                        animationDuration={animationDuration}
                        animationTimingFunction={animationTimingFunction}
                        animationIterationCount={1}
                    />);
                }
            } else {
                parts.push(<TokenizedText
                    input={remainingText.slice(lastIndex)}
                    sep={sep}
                    animation={animation}
                    animationDuration={animationDuration}
                    animationTimingFunction={animationTimingFunction}
                    animationIterationCount={1}
                />);
            }
        }
        return parts;
    }, [animation, animationDuration, animationTimingFunction, sep, generatePatterns]);

    // Memoize animateText function to prevent recalculations if props do not change
    const animateText: (text: string | Array<any>) => React.ReactNode = React.useCallback((text: string | Array<any>) => {
        text = Array.isArray(text) ? text : [text]; 
        const processText: (input: any) => React.ReactNode = (input: any) => {
            if (Array.isArray(input)) {
                // Process each element in the array
                return input.map(element => processText(element));
            } else if (typeof input === 'string') {
                if (!animation) return input;
                return processCustomComponents(input);
            } else if (React.isValidElement(input)) {
                // If the element is a React component or element, clone it and process its children
                return input;
            } else {
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
    const components: any = React.useMemo(() => ({
        text: ({ node, ...props }: any) => animateText(props.children),
        h1: ({ node, ...props }: any) => <h1 {...props}>{animateText(props.children)}</h1>,
        h2: ({ node, ...props }: any) => <h2 {...props}>{animateText(props.children)}</h2>,
        h3: ({ node, ...props }: any) => <h3 {...props}>{animateText(props.children)}</h3>,
        h4: ({ node, ...props }: any) => <h4 {...props}>{animateText(props.children)}</h4>,
        h5: ({ node, ...props }: any) => <h5 {...props}>{animateText(props.children)}</h5>,
        h6: ({ node, ...props }: any) => <h6 {...props}>{animateText(props.children)}</h6>,
        p: ({ node, ...props }: any) => <p {...props}>{animateText(props.children)}</p>,
        li: ({ node, ...props }: any) => <li {...props} className="custom-li" style={animationStyle}>{animateText(props.children)}</li>,
        a: ({ node, ...props }: any) => <a {...props} href={props.href} target="_blank" rel="noopener noreferrer">{animateText(props.children)}</a>,
        strong: ({ node, ...props }: any) => <strong {...props}>{animateText(props.children)}</strong>,
        em: ({ node, ...props }: any) => <em {...props}>{animateText(props.children)}</em>,
        hr: ({ node, ...props }: any) => <hr {...props} style={{
            animationName: animation,
            animationDuration,
            animationTimingFunction,
            animationIterationCount: 1,
            whiteSpace: 'pre-wrap',
        }} />,
        img: ({ node, ...props }: any) => <AnimatedImage src={props.src} alt={props.alt} animation={animation || ''} animationDuration={animationDuration} animationTimingFunction={animationTimingFunction} animationIterationCount={1} />,
        table: ({ node, ...props }: any) => <table {...props} className="code-block">{props.children}</table>,
        tr: ({ node, ...props }: any) => <tr {...props}>{animateText(props.children)}</tr>,
        td: ({ node, ...props }: any) => <td {...props}>{animateText(props.children)}</td>,
        ...htmlComponents
    }), [animateText]);

    return (
        <MarkdownPreview 
            source={content}
            className="wmde-markdown" 
            wrapperElement={{
                'data-color-mode': theme
            }}
            remarkPlugins={[remarkGfm]}
            components={components}
        />
    );
};

export default MarkdownAnimateText;