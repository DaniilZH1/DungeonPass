import * as React from "react";
import {
    AppBar,
    Toolbar,
    Box,
    Typography,
    IconButton,
    TextField,
    InputAdornment,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LockIcon from "@mui/icons-material/Lock";

export default function AppTopBar({ appBarHeight =64, onMobileMenu }) {
    return (
        <AppBar position="fixed"
                elevation={0}
                sx={{
                    height: appBarHeight,
                    justifyContent: "center",
                    bgcolor: "rgba(10,15,22,0.55)",
                    backdropFilter: "blur(10px)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
        >
            <Toolbar sx={{ minHeight: appBarHeight, px:2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap:2 }}>
                    {onMobileMenu ? (
                        <IconButton onClick={onMobileMenu}
                                    sx={{
                                        display: { xs: "inline-flex", md: "none" },
                                        color: "rgba(255,255,255,0.9)",
                                    }}
                        >
                            <MenuIcon />
                        </IconButton>
                    ) : null}
                    <IconButton
                        size="large"
                        disabled={true}
                    >
                        <LockIcon sx={{ color: "#4aa3ff" }}/>
                    </IconButton>
                    <Typography sx={{
                        color: "rgba(255,255,255,0.9)",
                        fontWeight:800,
                        letterSpacing:0.2,
                        whiteSpace: "nowrap",
                    }}
                    >
                        DUNGEONPASS </Typography>
                </Box>

                <Box sx={{ flexGrow:1, display: "flex", justifyContent: "center" }}>
                    <Box sx={{ width: { xs: "100%", sm:420 }, maxWidth:520 }}>
                        <TextField size="small"
                                   placeholder="Поиск паролей... (Under construction)"
                                   fullWidth variant="outlined"
                                   InputProps={{
                                       startAdornment: (
                                           <InputAdornment position="start">
                                               <SearchIcon sx={{ color: "rgba(255,255,255,0.6)" }} />
                                           </InputAdornment>
                                       ),
                                   }}
                                   sx={{
                                       "& .MuiOutlinedInput-root": {
                                           bgcolor: "rgba(0,0,0,0.15)",
                                           borderRadius:2,
                                           color: "#fff",
                                           "& fieldset": { borderColor: "rgba(255,255,255,0.10)" },
                                           "&:hover fieldset": { borderColor: "rgba(255,255,255,0.20)" },
                                           "&.Mui-focused fieldset": { borderColor: "#4aa3ff" },
                                       },
                                       "& input::placeholder": { color: "rgba(255,255,255,0.45)" },
                                   }}
                        />
                    </Box>
                </Box>

                <Box sx={{ display: "flex", gap:1 }}>

                    <IconButton sx={{ color: "rgba(255,255,255,0.85)" }}>
                        <AccountCircleIcon />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
}