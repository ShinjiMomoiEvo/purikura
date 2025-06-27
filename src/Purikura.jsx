import React, { useRef, useState, useEffect } from "react";
import Select from 'react-select'
import { Uploader } from "uploader"; // Installed by "react-uploader".
import { UploadButton } from "react-uploader";
import {
    Box,
    Button,
    Typography,
    TextField,
    Slider,
    Input,
    FormControl,
    InputLabel,
} from "@mui/material";

const stamps = [{ value: "⭐", label: "⭐" }, { value: "❤️", label: "❤️" }, { value: "😊", label: "😊" }, { value: "🔥", label: "🔥" }, { value: "🎉", label: "🎉" }];

export default function PhotoBooth() {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);

    const [drawings, setDrawings] = useState([]); // array of {from: {x,y}, to: {x,y}, color, size}
    const [stampsDrawn, setStampsDrawn] = useState([]);
    const [action, setAction] = useState(null);
    const [selectedStamp, setSelectedStamp] = useState(null);
    const [image, setImage] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [brushColor, setBrushColor] = useState("#ff0000");
    const [brushSize, setBrushSize] = useState(5);
    const [texts, setTexts] = useState([]);
    const [textInput, setTextInput] = useState("");
    // const [filters, setFilters] = useState({ grayscale: false, sepia: false, invert: false });

    // Load image to canvas when image changes
    useEffect(() => {
        if (!image) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.crossOrigin = "anonymous";
        const maxWidth = Math.min(window.innerWidth, 800);
        const maxHeight = Math.min(window.innerHeight, 600);
        img.onload = () => {
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = width * ratio;
                height = height * ratio;
            }

            canvas.width = width;
            canvas.height = height;

            ctx.clearRect(0, 0, width, height);
            // ctx.filter = buildFilterString();
            ctx.drawImage(img, 0, 0, width, height);

            // Reset filter for overlays
            // ctx.filter = "none";

            // Redraw drawings
            drawings.forEach(({ from, to, color, size }) => {
                ctx.strokeStyle = color;
                ctx.lineWidth = size;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
            });

            // Redraw stamps
            stampsDrawn.forEach(({ emoji, x, y }) => {
                ctx.font = "40px serif";
                ctx.fillText(emoji, x, y);
            });

            // Redraw texts
            redrawTexts(ctx);
        };
        img.src = image;
    }, [image, texts]);

    // function buildFilterString() {
    //     let filterStr = "";
    //     if (filters.grayscale) filterStr += "grayscale(100%) ";
    //     if (filters.sepia) filterStr += "sepia(100%) ";
    //     if (filters.invert) filterStr += "invert(100%) ";
    //     return filterStr.trim();
    // }

    function redrawTexts(ctx) {
        texts.forEach(({ text, x, y }) => {
            ctx.font = "24px Arial";
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
        });
    }

    // Drawing handlers
    function getPointerPos(e) {
        const rect = canvasRef.current.getBoundingClientRect();
        if (e.touches) {
            const touch = e.touches[0];
            return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
        } else {
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
    }

    function handlePointerDown(e) {
        e.preventDefault();
        const pos = getPointerPos(e);

        if (action === "draw") {
            setIsDrawing(true);
            setLastPos(pos);
        } else if (action === "stamp" && selectedStamp) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            ctx.font = "40px serif";
            ctx.fillText(selectedStamp, pos.x, pos.y);

            // Optionally, save this stamp for redraw later:
            setStampsDrawn(prev => [...prev, { emoji: selectedStamp, x: pos.x, y: pos.y }]);
        }
    }

    function handlePointerMove(e) {
        e.preventDefault();
        if (!isDrawing) return;
        const ctx = canvasRef.current.getContext("2d");
        const currentPos = getPointerPos(e);

        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();

        setLastPos(currentPos);
    }

    function handlePointerUp(e) {
        e.preventDefault();
        setIsDrawing(false);
    }

    function resetCanvas() {
        setAction(null);
        setImage(null)
        setDrawings([]);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Upload image
    function handleUpload(file) {
        if (!file || !file.fileUrl) return;

        const url = file.fileUrl;
        setImage(url);
        setTexts([]);
    }

    // Add text to canvas (position is fixed center for simplicity)
    function addText() {
        if (!textInput.trim()) return;
        const canvas = canvasRef.current;
        setTexts([...texts, { text: textInput.trim(), x: canvas.width / 2 - 50, y: canvas.height / 2 }]);
        setTextInput("");
    }

    // Download image
    function downloadImage() {
        const canvas = canvasRef.current;
        const link = document.createElement("a");
        link.download = "photobooth.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    }

    function selectStamp(emoji) {
        setSelectedStamp(emoji);
        setAction("stamp");
    }
    
    function handleFileChange() {
        
    }

    const uploader = Uploader({
        apiKey: "free" // Get production API keys from Bytescale
    });

    const options = { multi: false, accept: "image/*" };

    return (
        <>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Purikura
                </Typography>

                {/* Camera capture input */}
                <Box sx={{ mb: 2 }}>
                    <Input
                    type="file"
                    inputProps={{ accept: "image/*", capture: "environment" }}
                    onChange={handleFileChange}
                    />
                </Box>

                {/* Upload button */}
                <Box sx={{ mb: 2 }}>
                    <UploadButton
                    uploader={uploader}
                    options={options}
                    onComplete={(files) => handleUpload(files[0])}
                    >
                    {({ onClick }) => (
                        <Button variant="outlined" onClick={onClick}>
                        Upload a file...
                        </Button>
                    )}
                    </UploadButton>
                </Box>

                {/* Canvas */}
                <Box
                    component="canvas"
                    ref={canvasRef}
                    sx={{
                        border: "1px solid #ccc",
                        cursor: "crosshair",
                        maxWidth: "100%",
                        display: "block",
                        mb: 3,
                    }}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                />

                {/* Drawing controls */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <Button variant="contained" onClick={() => setAction("draw")}>
                    Draw
                    </Button>

                    <InputLabel shrink>Draw Color</InputLabel>
                    <Input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    sx={{ width: 60 }}
                    />

                    <InputLabel shrink>Brush Size</InputLabel>
                    <Slider
                    min={1}
                    max={20}
                    value={brushSize}
                    onChange={(e, val) => setBrushSize(val)}
                    sx={{ width: 150 }}
                    />
                </Box>

                {/* Text input */}
                    <Box sx={{ mb: 3, flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ mt: 1, textAlign: "left" }}>
                            Add Text
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                            <TextField
                            placeholder="Enter text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            size="small"
                            sx={{ flexGrow: 2 }}
                            />
                            <Button variant="contained" onClick={addText}>
                            Add Text
                            </Button>
                        </Box>
                    </Box>

                    {/* Emoji/stamp select */}
                    <Box sx={{ mb: 3, flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ mt: 1, textAlign: "left" }}>
                            Stamps
                        </Typography>
                        <FormControl fullWidth>
                        <Select
                        
                            options={stamps}
                            onChange={(selectedOption) => {
                            if (selectedOption) selectStamp(selectedOption.value);
                            }}
                        />
                        </FormControl>
                    </Box>

                {/* Action buttons */}
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button variant="outlined" color="success" onClick={downloadImage}>
                    Download Image
                    </Button>
                    <Button variant="outlined" color="error" onClick={resetCanvas}>
                    Reset
                    </Button>
                </Box>
                </Box>
        </>
    );
}
