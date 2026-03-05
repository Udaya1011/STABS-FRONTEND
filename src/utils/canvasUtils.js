export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        if (url && !url.startsWith('data:')) {
            image.setAttribute('crossOrigin', 'anonymous');
        }
        image.src = url;
    });

export function getRadianAngle(degreeValue) {
    return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width, height, rotation) {
    const rotRad = getRadianAngle(rotation);

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

/**
 * This function was adapted from the one in the documentation of `react-easy-crop`.
 */
export async function getCroppedImg(
    imageSrc,
    pixelCrop,
    rotation = 0,
    flip = { horizontal: false, vertical: false },
    removeWhiteBackground = false
) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    const rotRad = getRadianAngle(rotation);

    const safeImageWidth = Math.max(1, image.naturalWidth || image.width || 1);
    const safeImageHeight = Math.max(1, image.naturalHeight || image.height || 1);

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        safeImageWidth,
        safeImageHeight,
        rotation
    );

    // set canvas size to match the bounding box
    canvas.width = Math.max(1, Math.floor(bBoxWidth));
    canvas.height = Math.max(1, Math.floor(bBoxHeight));

    // translate canvas context to a central point to allow rotating and flipping around the center
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    // draw rotated image
    ctx.drawImage(image, 0, 0);

    // croppedCanvas will contain the actual cropped image
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');

    if (!croppedCtx) {
        return null;
    }

    // Set the size of the cropped canvas
    const cropWidth = Math.max(1, Math.floor(Number(pixelCrop?.width) || 1));
    const cropHeight = Math.max(1, Math.floor(Number(pixelCrop?.height) || 1));
    const cropX = Math.floor(Number(pixelCrop?.x) || 0);
    const cropY = Math.floor(Number(pixelCrop?.y) || 0);

    // Scale down output image if too large (avatars don't need to be 4K)
    const MAX_DIMENSION = 512;
    const scale = Math.min(MAX_DIMENSION / cropWidth, MAX_DIMENSION / cropHeight, 1);

    const finalWidth = Math.max(1, Math.floor(cropWidth * scale));
    const finalHeight = Math.max(1, Math.floor(cropHeight * scale));

    croppedCanvas.width = finalWidth;
    croppedCanvas.height = finalHeight;

    // Draw the cropped image onto the new final canvas
    croppedCtx.drawImage(
        canvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        finalWidth,
        finalHeight
    );

    // Background Removal (Simple White Color Strip)
    if (removeWhiteBackground) {
        const imageData = croppedCtx.getImageData(0, 0, finalWidth, finalHeight);
        const data = imageData.data;
        const threshold = 240; // Threshold for what is considered "white"

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // If pixel is very close to white, make it transparent
            if (r > threshold && g > threshold && b > threshold) {
                data[i + 3] = 0; // Set alpha to 0
            }
        }
        croppedCtx.putImageData(imageData, 0, 0);
    }

    console.log('Canvas Sizes:', {
        bBoxWidth, bBoxHeight,
        cropX, cropY,
        cropW: cropWidth, cropH: cropHeight,
        finalW: finalWidth, finalH: finalHeight
    });

    // As a blob
    return new Promise((resolve, reject) => {
        try {
            croppedCanvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty: Dimensions are W: ' + croppedCanvas.width + ', H: ' + croppedCanvas.height));
                    return;
                }
                resolve(blob);
            }, 'image/png');
        } catch (error) {
            reject(error);
        }
    });
}


