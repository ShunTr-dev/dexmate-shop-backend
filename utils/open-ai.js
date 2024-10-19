const { s3UploaderFile } = require('./s3');
const crypto = require('crypto');

const { Configuration, OpenAIApi } = require("openai");
const https = require('https');

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const createImagesDalle = async (prompt = "a dog smiling", numberImages = 1, userId) => {
    
    const openai = new OpenAIApi(configuration);
    let createdImages = [];

    let dalleResponse;
    try {
        dalleResponse = await openai.createImage({
            prompt: prompt,
            n: numberImages,
            size: "1024x1024",
        });

    } catch (error) {
        return errorHandler(req, res, 'Max limit reached.', 500, error);
    }

    for (let index = 0; index < numberImages; index++) {
        
        const url = dalleResponse.data.data[index].url;
        const response = await fetch(url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        createdImages.push(await s3UploaderFile(buffer, userId));
    }

    return createdImages;
}

exports.createImagesDalle = createImagesDalle;