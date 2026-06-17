import * as React from "react";
import {
    Box,
    Divider,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
} from "@mui/material";

import LockIcon from "@mui/icons-material/Lock";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import StorageIcon from "@mui/icons-material/Storage";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import SettingsIcon from "@mui/icons-material/Settings";

export default function DrawerContent({ active, onSelect }) {
    const menuMain = [
        { id: "storage", label: "Хранилище", icon: <StorageIcon fontSize="small" /> },
        { id: "settings", label: "Настройки", icon: <SettingsIcon fontSize="small" /> },
    ];

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", color: "rgba(255,255,255,0.9)" }}>
            <Box sx={{ px:2, py:1 }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", fontWeight:700 }}>
                    ОСНОВНОЕ </Typography>
            </Box>

            <List disablePadding sx={{ px:0 }}>
                {menuMain.map((item) => (
                    <ListItemButton key={item.id}
                                    selected={active === item.id}
                                    onClick={() => {
                                        onSelect?.(item.id)
                                        console.log(item.id)
                                    }}
                                    sx={{
                                        mx:1,
                                        borderRadius:1.5,
                                        mb:0.25,
                                        color: "rgba(255,255,255,0.75)",
                                        "& .MuiListItemIcon-root": { color: "rgba(255,255,255,0.75)" },
                                        "& .MuiListItemText-primary": { color: "rgba(255,255,255,0.82)" },

                                        "&.Mui-selected": {
                                            bgcolor: "rgba(74,163,255,0.18)",
                                            color: "#fff",
                                        },
                                        "&.Mui-selected .MuiListItemIcon-root": { color: "#4aa3ff" },
                                        "&.Mui-selected .MuiListItemText-primary": { color: "#fff" },

                                        "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                                    }}
                    >
                        <ListItemIcon sx={{ minWidth:30 }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                    </ListItemButton>
                ))}
            </List>

            {/*<Box sx={{ px:2, py:1 }}>*/}
            {/*    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", fontWeight:700 }}>*/}
            {/*        КАТЕГОРИИ </Typography>*/}
            {/*</Box>*/}

            {/*<List disablePadding>*/}
            {/*    {menuCategories.map((item) => (*/}
            {/*        <ListItemButton key={item.id}*/}
            {/*                        selected={active === item.id}*/}
            {/*                        onClick={() => onSelect?.(item.id)}*/}
            {/*                        sx={{*/}
            {/*                            mx:1,*/}
            {/*                            borderRadius:1.5,*/}
            {/*                            mb:0.25,*/}
            {/*                            color: "rgba(255,255,255,0.75)",*/}
            {/*                            "& .MuiListItemIcon-root": { color: "rgba(255,255,255,0.75)" },*/}
            {/*                            "& .MuiListItemText-primary": { color: "rgba(255,255,255,0.82)" },*/}

            {/*                            "&.Mui-selected": {*/}
            {/*                                bgcolor: "rgba(74,163,255,0.18)",*/}
            {/*                                color: "#fff",*/}
            {/*                            },*/}
            {/*                            "&.Mui-selected .MuiListItemIcon-root": { color: "#4aa3ff" },*/}
            {/*                            "&.Mui-selected .MuiListItemText-primary": { color: "#fff" },*/}

            {/*                            "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },*/}
            {/*                        }}*/}
            {/*        >*/}
            {/*            <ListItemIcon sx={{ minWidth:30 }}>{item.icon}</ListItemIcon>*/}
            {/*            <ListItemText primary={item.label} />*/}
            {/*        </ListItemButton>*/}
            {/*    ))}*/}
            {/*</List>*/}

            <Box sx={{ flexGrow:1 }} />

            <Box sx={{ px:2, py:2 }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>
                    v0.1 </Typography>
            </Box>
        </Box>
    );
}