import * as React from "react";
import { Box, CssBaseline } from "@mui/material";

import AppTopBar from "./components/AppTopBar";
import SideDrawer from "./components/SideDrawer/SideDrawer.jsx";
import MainPage from "./pages/MainPage.jsx";

const drawerWidth =220;
const appBarHeight =64;

export default function App() {
    const [active, setActive] = React.useState("storage");

    return (
        <Box sx={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, rgba(11,26,35,1)0%, rgba(8,32,44,0.8)40%, rgba(10,47,61,0.6)100%)",
        }}
        >
            <CssBaseline />

            <AppTopBar appBarHeight={appBarHeight} />

            <SideDrawer                         drawerWidth={drawerWidth}
                        appBarHeight={appBarHeight}
                        active={active}
                        onSelect={(id) => {
                            setActive(id);
                        }}
            />

            <Box component="main"
                 sx={{
                     flexGrow:1,
                     pl: `${drawerWidth}px`,
                     pt: `${appBarHeight}px`,
                     pb:3,
                     pr:3,
                 }}
            >
                <MainPage active={active}/>
            </Box>
        </Box>
    );
}