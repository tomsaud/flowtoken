import React, { useState, useEffect } from 'react';
import SmoothText from '../src/components/SmoothText'; // Adjust the import path accordingly
import AnimatedMarkdown from '../src/components/AnimatedMarkdown';
import Markdown from 'react-markdown'
import './tailwind.css';

export default {
    title: 'Components/MarkdownCustomWordBreak',
    component: AnimatedMarkdown,
};

// Here we define a "story" for the default view of SmoothText
export const DefaultMarkdown = () => <AnimatedMarkdown 
    content={"Hello world. Hello world. Hello world. Hello world. Hello world. Hello world. Hello world. Hello world. Hello world. "} 
    sep="word"
    animation="fadeIn"
    animationDuration={"0.3s"}
    animationTimingFunction="ease-in-out"
/>;
