declare global {
    namespace Unity {
        type Package = {
            dependencies: Record<string, string>
            name: string
            displayName: string
            version: string
        }
    }
}

export {};
