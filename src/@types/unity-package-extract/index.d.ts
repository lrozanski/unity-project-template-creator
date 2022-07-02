declare module "unity-package-extract" {
    class UnityExtractClient {
        extract(src: string, dest: string): Promise<string>

        convert(src: string, dest: string): Promise<string[]>
    }
}
