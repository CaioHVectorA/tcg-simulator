import { write } from 'bun'
type Path = "/banners/" | "/user_pictures"
export async function storeImg(
    ref: string | number,
    path: Path,
    img: File
) {
    const storePath = process.cwd()+`/public${path}${ref}.${img.type.split('/')[1]}`
    const b = await write(storePath, img)
    console.log({ b, storePath })
    return `/public${path}${ref}.${img.type.split('/')[1]}`
}