
declare module 'react-treebeard' {
    import * as React from 'react';

    export interface TreeNode {
        name: string;
        toggled?: boolean;
        children?: TreeNode[];
        active?: boolean;
    }

    export interface TreebeardProps {
        data: TreeNode | TreeNode[];
        onToggle?: (node: TreeNode, toggled: boolean) => void;
        style?: any;
    }

    export const Treebeard: React.FC<TreebeardProps>;
}
