import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export type UploadFolder = "products" | "banners" | "avatars" | "categories"

interface UploadOptions {
  folder: UploadFolder
  publicId?: string
  transformation?: cloudinary.TransformationOptions
}

export async function uploadToCloudinary(
  file: Buffer | string,
  options: UploadOptions
): Promise<{ secure_url: string; public_id: string; width: number; height: number; format: string }> {
  const { folder, publicId, transformation = {} } = options

  const uploadPromise = new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `elhasna-hijab/${folder}`,
        public_id: publicId,
        transformation: {
          quality: "auto:good",
          fetch_format: "auto",
          ...transformation,
        },
        overwrite: true,
        invalidate: true,
      },
      (error, result) => {
        if (error) reject(error)
        else if (result) resolve(result)
        else reject(new Error("Upload failed: no result returned"))
      }
    )

    if (typeof file === "string") {
      uploadStream.end(file)
    } else {
      uploadStream.end(file)
    }
  })

  const result = await uploadPromise

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === "ok"
  } catch {
    return false
  }
}

export function getOptimizedUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number; format?: "auto" | "webp" | "avif" } = {}
): string {
  const { width, height, quality = 80, format = "auto" } = options

  return cloudinary.url(publicId, {
    transformation: [
      { quality, fetch_format: format },
      ...(width ? [{ width, crop: "scale" }] : []),
      ...(height ? [{ height, crop: "scale" }] : []),
    ],
    secure: true,
  })
}

export function getThumbnailUrl(publicId: string, size = 200): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width: size, height: size, height: size, crop: "fill", gravity: "auto" },
      { quality: 80, fetch_format: "auto" },
    ],
    secure: true,
  })
}

export default cloudinary