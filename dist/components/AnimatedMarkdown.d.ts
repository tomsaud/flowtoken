import React from 'react';
import './animations.css';
import './custom-lists.css';
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
declare const MarkdownAnimateText: React.FC<SmoothTextProps>;
export default MarkdownAnimateText;
