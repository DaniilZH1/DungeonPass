import * as React from "react";
import {Drawer} from "@mui/material";
import DrawerContent from "./DrawerContent.jsx";

export default function SideDrawer({
                                       drawerWidth = 220,
                                       appBarHeight = 64,
                                       active,
                                       onSelect,
                                   }) {
    const paperBaseSx = {
        width: drawerWidth,
        boxSizing: "border-box",
        bgcolor: "rgba(10,15,22,0.55)",
        backdropFilter: "blur(12px)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
    };

    return (
        <Drawer variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        ...paperBaseSx,
                        position: "fixed",
                        top: `${appBarHeight}px`,
                        height: `calc(100vh - ${appBarHeight}px)`,
                        overflowY: "auto",
                    },
                }}
        >
            <DrawerContent active={active} onSelect={onSelect}/>
        </Drawer>
    );


}