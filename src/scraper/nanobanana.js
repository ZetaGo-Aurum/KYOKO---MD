async function nanoBananaImgEditor(imageBuffer, prompt, options = {}) {
    if (!imageBuffer) throw new Error("Image buffer kosong");
    if (!prompt) throw new Error("Prompt kosong");

    const {
        styleId = "realistic",
        model = "nano-banana",
        outputFormat = "png",
        waitInterval = 4000
    } = options;

    // 1. get upload url
    const info = await fetch("https://imgeditor.co/api/get-upload-url", {
        method: "POST",
        headers: {
            accept: "*/*",
            "content-type": "application/json"
        },
        body: JSON.stringify({
            fileName: "image.jpg",
            contentType: "image/jpeg",
            fileSize: imageBuffer.length
        })
    }).then(r => r.json());

    if (!info?.uploadUrl || !info?.publicUrl) {
        throw new Error("Gagal mendapatkan upload URL");
    }

    // 2. upload image
    await fetch(info.uploadUrl, {
        method: "PUT",
        headers: { "content-type": "image/jpeg" },
        body: imageBuffer
    });

    // 3. generate image
    const gen = await fetch("https://imgeditor.co/api/generate-image", {
        method: "POST",
        headers: {
            accept: "*/*",
            "content-type": "application/json"
        },
        body: JSON.stringify({
            prompt,
            styleId,
            mode: "image",
            imageUrl: info.publicUrl,
            imageUrls: [info.publicUrl],
            numImages: 1,
            outputFormat,
            model
        })
    }).then(r => r.json());

    if (!gen?.taskId) {
        throw new Error("Gagal memulai generate image");
    }

    // 4. polling status
    let status;
    while (true) {
        await new Promise(r => setTimeout(r, waitInterval));

        status = await fetch(
            `https://imgeditor.co/api/generate-image/status?taskId=${gen.taskId}`,
            { headers: { accept: "*/*" } }
        ).then(r => r.json());

        if (status?.status === "completed") break;
        if (status?.status === "failed") {
            throw new Error("Generate image gagal");
        }
    }

    return {
        imageUrl: status.imageUrl,
        taskId: gen.taskId,
        model,
        styleId
    };
}

module.exports = nanoBananaImgEditor;