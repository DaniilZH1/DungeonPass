import * as React from "react";
import {Box, Button, Typography, IconButton, Snackbar } from "@mui/material";

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import KeyIcon from '@mui/icons-material/Key';
import {useState} from "react";

export default function MainPage({
                                     active
                                 }) {
    const [snack, setSnack] = useState({
        open: false,
        message: ""
    })

    const [services, setServices] = useState([
        {
            name: "GitHub",
            login: "xxxx@gmail.com",
            password: "Pa$w0rdGithub",
            show: false
        },
        {
            name: "Google",
            login: "xxxxx@gmail.com",
            password: "Pa$w0rdGoogle",
            show: false
        },
    ])

    let content = null

    const cardSx = {
        p: 2,
        borderRadius: 2.5,
        bgcolor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "010px30px rgba(0,0,0,0.10)",
    };

    if (active === "storage") {
        content = (
            <Box sx={{display: "flex", flexDirection: "column", width: "100%"}}>
                {/* Шапка */}
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                    gap: 2,
                }}
                >
                    <Typography variant="h5"
                                sx={{color: "rgba(255,255,255,0.95)", fontWeight: 900, letterSpacing: 0.2}}
                    >
                        Хранилище паролей </Typography>

                    <Button variant="contained"
                            sx={{
                                borderRadius: 2,
                                bgcolor: "#2f8cff",
                                px: 2,
                                height: 40,
                                fontWeight: 800,
                                "&:hover": {bgcolor: "#1f78e6"},
                                boxShadow: "010px25px rgba(47,140,255,0.25)",
                            }}
                    >
                        СГЕНЕРИРОВАТЬ ПАРОЛЬ </Button>
                </Box>

                <Box sx={{
                    display: "grid",
                    gap: 2,
                    justifyItems: "stretch",
                }}>
                    {services.map((service) => (
                        <Box key={service.name} sx={cardSx}>
                            <Box sx={{display: "flex", alignItems: "flex-start", gap: 1.5}}>
                                <Box sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    color: "#fff",
                                    mt: 0.2,
                                }}
                                >
                                    <KeyIcon/>
                                </Box>

                                <Box sx={{flexGrow: 1, minWidth: 0}}>
                                    <Typography sx={{color: "rgba(255,255,255,0.92)", fontWeight: 800}}>
                                        {service.name}
                                    </Typography>

                                    <Typography sx={{color: "rgba(255,255,255,0.70)", fontSize: 15, mt: 0.3}}>
                                        Логин: {service.login}
                                    </Typography>

                                    <Typography sx={{color: "rgba(255,255,255,0.70)", fontSize: 15, mt: 0.3}}>
                                        Пароль: {service.show ? service.password : "* * * * * * * * * * * *"}
                                    </Typography>
                                </Box>

                                <Box sx={{display: "flex", flexDirection: "row", gap: 0.5, pt: 0.2}}>
                                    <IconButton size="small"
                                                sx={{color: "rgba(255,255,255,0.65)"}}
                                                onClick={async () => {
                                                    try {
                                                        await navigator.clipboard.writeText(service.password)
                                                        setSnack({ open: true, message: "Успешно скопировано" })
                                                    } catch (e) {
                                                        setSnack({ open: true, message: "Не удалось скопировать" });
                                                    }
                                                }}

                                    >
                                        <ContentCopyIcon fontSize="small"/>
                                    </IconButton>

                                    <IconButton size="small"
                                                sx={{color: "rgba(255,255,255,0.65)"}}
                                                onClick={() =>
                                                    setServices((prev) =>
                                                        prev.map((s) =>
                                                            s.name === service.name ? {...s, show: !s.show} : s)
                                                    )
                                                }
                                    >
                                        <VisibilityIcon fontSize="small"/>
                                    </IconButton>
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
        );
    }


    return (
        <Box sx={{
            mt: 5,
            ml: 5,
        }}>
            {content}
            <Snackbar open={snack.open}
                      message={snack.message}
                      autoHideDuration={2500}
                      onClose={() => setSnack((p) => ({ ...p, open: false }))}
                      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                      sx={{
                          "& .MuiSnackbarContent-root": {
                              backgroundColor: "rgba(47,140,255,0.95)",
                              color: "#fff",
                              borderRadius:2,
                          },
                      }}
            />
        </Box>

    );
}