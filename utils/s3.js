
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');

// import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner"


const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
    }
});

const s3UploaderFile = async (file, userId) => {
    const imageName = new Date().valueOf() + '-' + userId + '.webp';
    const newfile = await sharp(file.buffer).resize(380, 507).webp({ nearLossless: true }).toBuffer();
    const s3Return = await uploadFileS3(newfile, imageName, 'image/webp');

    return imageName;
}

const uploadFileS3 = (fileBuffer, fileName, mimetype) =>  {
    const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Body: fileBuffer,
        Key: fileName,
        ContentType: mimetype,
        CacheControl: 'max-age=31536000'
    }

    return s3Client.send(new PutObjectCommand(uploadParams));
}

const deleteFileS3 = (fileName) => {
    const deleteParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
    }

    return s3Client.send(new DeleteObjectCommand(deleteParams));
}

/*
export async function getObjectSignedUrl(key) {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key
    }

    // https://aws.amazon.com/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/
    const command = new GetObjectCommand(params);
    const seconds = 60
    const url = await getSignedUrl(s3Client, command, { expiresIn: seconds });

    return url
}
*/

exports.deleteFileS3 = deleteFileS3;
exports.uploadFileS3 = uploadFileS3;
exports.s3UploaderFile = s3UploaderFile;