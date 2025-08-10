
import { Menu, Item, Separator, Submenu, UseContextMenuParams } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';

interface ContextMenuProps {
    id: string;
    children?: React.ReactNode;
}

export const ContextMenu = ({ id, children }: ContextMenuProps) => {
    return (
        <Menu id={id} animation="fade" className="bg-gray-800 border border-gray-600 shadow-lg rounded-md py-1 min-w-[180px] z-50">
            {children}
        </Menu>
    );
};

export const MenuItem = ({ children, ...props }: any) => (
    <Item {...props} className="px-4 py-2 text-gray-200 hover:bg-blue-600 hover:text-white cursor-pointer text-sm transition-colors">
        {children}
    </Item>
);

export const MenuSeparator = () => (
    <Separator />
);

export const SubMenu = ({ children, label, ...props }: any) => (
    <Submenu {...props} label={label} className="px-4 py-2 text-gray-200 hover:bg-blue-600 hover:text-white cursor-pointer text-sm transition-colors flex items-center justify-between">
        {children}
    </Submenu>
);

// Helper hook for context menu
export const useContextMenu = () => {
    const showContextMenu = (
        e: React.MouseEvent,
        menuId: string,
        props?: UseContextMenuParams['props']
    ) => {
        e.preventDefault();
        // We'll need to implement a context menu provider later
        document.dispatchEvent(
            new CustomEvent(`show-context-menu-${menuId}`, { detail: { x: e.clientX, y: e.clientY, props } })
        );
    };

    return { showContextMenu };
};