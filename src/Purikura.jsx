import { useRef, useState, useEffect } from "react";
import { Uploader } from "uploader";
import { UploadButton } from "react-uploader";
import IconButton from '@mui/material/IconButton';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Box, Button, Typography, TextField, Slider, Input } from "@mui/material";
import BrushIcon from '@mui/icons-material/Brush';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

export default function PhotoBooth() {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);

    const [drawings, setDrawings] = useState([]); // array of {from: {x,y}, to: {x,y}, color, size}
    const [stampsDrawn, setStampsDrawn] = useState([]);
    const [action, setAction] = useState(null);
    const [selectedStamp, setSelectedStamp] = useState(null);
    const [textToPlace, setTextToPlace] = useState(null);
    const [image, setImage] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [brushColor, setBrushColor] = useState("#ff0000");
    const [brushSize, setBrushSize] = useState(5);
    const [texts, setTexts] = useState([]);
    const [textInput, setTextInput] = useState("");
    const [pickerOpen, setPickerOpen] = useState(false);


    // Load image to canvas when image changes
    useEffect(() => {
        if (!image) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.crossOrigin = "anonymous";

        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        const availableWidth = window.innerWidth * 0.9;
        const canvasWidth = availableWidth;
        const canvasHeight = (canvasWidth * 4) / 3;

        // Set CSS size
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;

        // Set internal pixel size for sharpness
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        ctx.scale(dpr, dpr); // Scale the context

        img.onload = () => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        const imgRatio = img.width / img.height;
        const canvasRatio = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgRatio > canvasRatio) {
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imgRatio;
            offsetX = 0;
            offsetY = (canvasHeight - drawHeight) / 2;
        } else {
            drawHeight = canvasHeight;
            drawWidth = canvasHeight * imgRatio;
            offsetX = (canvasWidth - drawWidth) / 2;
            offsetY = 0;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
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
    }, [image, texts, selectedStamp]);    

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

            setStampsDrawn(prev => [...prev, { emoji: selectedStamp, x: pos.x, y: pos.y }]);
        } else if (action === "text" && textToPlace) {
            setTexts(prev => [...prev, { text: textToPlace, x: pos.x, y: pos.y }]);
            setTextToPlace(null);
            setAction(null);
            return;
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

        // Save the stroke
        setDrawings(d => [...d, {
            from: { ...lastPos },
            to: { ...currentPos },
            color: brushColor,
            size: brushSize
        }]);

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
        setStampsDrawn([]);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

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

    // Add text to canvas (position is fixed center for simplicity)
    function addText() {
        if (!textInput.trim()) return;

        setAction("text");
        setTextToPlace(textInput.trim());
        setTextInput("");
    }

    // Upload image
    function handleUpload(file) {
        if (!file || !file.fileUrl) return;

        const url = file.fileUrl;
        setImage(url);
        setTexts([]);
    }

    // Download image
    function downloadImage() {
        const canvas = canvasRef.current;
        const link = document.createElement("a");
        link.download = "photobooth.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
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

                {image && (
                    <>
                        {/* Canvas */}
                        <Box
                            component="canvas"
                            ref={canvasRef}
                            sx={{
                                border: "1px solid #ccc",
                                cursor: "crosshair",
                                maxWidth: "100%",
                                display: "block",
                                touchAction: 'none',
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
                        <Box onClick={() => setAction("draw")} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                            <IconButton onClick={() => setAction("draw")} color="primary">
                                <BrushIcon />
                            </IconButton>

                            <Input
                                type="color"
                                value={brushColor}
                                onChange={(e) => setBrushColor(e.target.value)}
                                sx={{ width: 20 }}
                            />

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
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                                    <IconButton onClick={() => setPickerOpen(!pickerOpen)} color="primary">
                                        <EmojiEmotionsIcon />
                                    </IconButton>
                                    <TextField
                                        label="Type your text"
                                        placeholder="Enter text"
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        size="small"
                                        sx={{ flexGrow: 2 }}
                                    />
                                    <Button variant="contained" onClick={addText}>
                                        Add
                                    </Button>
                                </Box>
                            </Box>
                            {action === "text" && textToPlace && (
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                    Tap anywhere on the canvas to place your text.
                                </Typography>
                            )}
                        {/* Action buttons */}
                        <Box sx={{ display: "flex", gap: 2, justifyContent: "space-around" }}>
                            <Button variant="outlined" color="success" onClick={downloadImage}>Download Image</Button>
                            <Button variant="outlined" color="error" onClick={resetCanvas}>Reset</Button>
                        </Box>
                        
                        {pickerOpen && (
                            <Box style={{ 
                                position: "fixed",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                zIndex: 1000 
                            }}>
                                <Picker
                                    data={data}
                                    onEmojiSelect={(emoji) => {
                                        setSelectedStamp(emoji.native);
                                        setPickerOpen(false);
                                        setAction("stamp");
                                    }}
                                />
                            </Box>
                        )}
                    </>
                )}
                
                
            </Box>
        </>
    );
}
