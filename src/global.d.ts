declare interface String {
    sha512(): string
    md5(): string
    isValidEmail(): boolean
}
declare interface Date {
    getTimestamp(): number
}
declare function time(): number
declare function date(format: string, timestamp: number): string
declare function float(value: any): number
declare module "strong-soap" {
    export const soap: any
}

declare module "connect-multiparty" {
    const app: any

    export default app
}

declare module 'excel4node'