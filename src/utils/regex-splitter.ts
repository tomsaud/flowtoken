import * as regexpTree from 'regexp-tree';

interface BaseNode {
  type: string;
}

interface RegExpNode extends BaseNode {
  type: 'RegExp';
  body: AlternativeNode;
}

interface AlternativeNode extends BaseNode {
  type: 'Alternative';
  expressions: Array<RegExpNodeTypes>;
}

interface DisjunctionNode extends BaseNode {
  type: 'Disjunction';
  left: RegExpNodeTypes;
  right: RegExpNodeTypes;
}

interface GroupNode extends BaseNode {
  type: 'Group' | 'CapturingGroup' | 'NonCapturingGroup' | 'Lookahead' | 'Lookbehind';
  expression: RegExpNodeTypes;
}

interface RepetitionNode extends BaseNode {
  type: 'Repetition';
  expression: RegExpNodeTypes;
  quantifier: {
    type: 'Quantifier';
    raw?: string;
  };
}

interface CharacterNode extends BaseNode {
  type:
    | 'Character'
    | 'CharacterClass'
    | 'CharacterClassRange'
    | 'Backreference'
    | 'Anchor'
    | 'ClassRange'
    | 'UnicodePropertyEscape';
}

type RegExpNodeTypes =
  | RegExpNode
  | AlternativeNode
  | DisjunctionNode
  | GroupNode
  | RepetitionNode
  | CharacterNode;

export const splitRegexPattern = (pattern: string): string[] => {
  // **Correction 1:** Pass the pattern string directly
  const ast = regexpTree.parse(pattern) as RegExpNode;
  const components: string[] = [];

  // Function to traverse the AST and collect components
  const collectComponents = (node: RegExpNodeTypes): void => {
    if (!node) return;

    switch (node.type) {
      case 'RegExp':
        collectComponents(node.body);
        break;

      case 'Alternative':
        node.expressions.forEach((expr) => collectComponents(expr));
        break;

      case 'Disjunction':
        collectComponents(node.left);
        components.push('|');
        collectComponents(node.right);
        break;

      case 'Group':
      case 'CapturingGroup':
      case 'NonCapturingGroup':
      case 'Lookahead':
      case 'Lookbehind':
        // **Correction 2:** Use regexpTree.generate(node)
        components.push(regexpTree.generate(node as any));
        break;

      case 'Repetition':
        collectComponents(node.expression);
        components.push(regexpTree.generate(node.quantifier as any));
        break;

      case 'Character':
      case 'CharacterClass':
      case 'CharacterClassRange':
      case 'Backreference':
      case 'Anchor':
      case 'ClassRange':
      case 'UnicodePropertyEscape':
        components.push(regexpTree.generate(node as any));
        break;

      default:
        // For any other node types, generate their string representation
        components.push(regexpTree.generate(node));
    }
  };

  collectComponents(ast);
  return components;
};

export const generateSubRegexes = (pattern: string): string[] => {
  const components = splitRegexPattern(pattern);

  const subRegexes: string[] = [];
  for (let i = components.length; i > 0; i--) {
    const subRegex = components.slice(0, i).join('');
    subRegexes.push(subRegex);
  }
  return subRegexes;
};
